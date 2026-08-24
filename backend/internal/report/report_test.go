package report

import (
	"encoding/json"
	"strings"
	"testing"

	"github.com/ghost0/BlackHawk/backend/internal/scan"
)

func sampleScan() *scan.Scan {
	return &scan.Scan{
		ID:     "11111111-2222-3333-4444-555555555555",
		Target: "https://example.com",
		Config: scan.ScanConfig{Mode: scan.ModeQuick, MaxChildren: 5},
		Status: scan.StatusComplete,
		Alerts: []scan.Alert{
			{
				ID: "1", PluginID: "40012", Name: "Cross Site Scripting", Risk: "High", Confidence: "Confirmed",
				URL: "https://example.com/search?q=1", Method: "GET", Param: "q",
				Evidence: "<script>alert(1)</script>", Attack: "<script>alert(1)</script>",
				Description: "Reflected XSS was found.", Solution: "Encode output.",
				Reference: "https://owasp.org/xss", CWEID: "79",
			},
			{ID: "2", PluginID: "10038", Name: "CSP Missing", Risk: "Medium", Confidence: "Firm", URL: "https://example.com/", Method: "GET"},
			{ID: "3", PluginID: "10098", Name: "Anti-CSRF", Risk: "Low", Confidence: "Low", URL: "https://example.com/login"},
		},
	}
}

func TestGenerateHTMLContainsSections(t *testing.T) {
	html, err := New().GenerateHTML(sampleScan())
	if err != nil {
		t.Fatalf("GenerateHTML: %v", err)
	}
	s := string(html)
	for _, want := range []string{
		"Executive Summary",
		"Target Information",
		"Security Score",
		"Attack Surface",
		"Vulnerability Summary",
		"Detailed Findings",
		"Remediation Guidance",
		"not a CVSS score",
		"Cross Site Scripting",
		"Encode output.",
		"https://example.com/search?q=1",
	} {
		if !strings.Contains(s, want) {
			t.Errorf("report missing %q", want)
		}
	}
}

func TestGenerateHTMLEmptyScan(t *testing.T) {
	s := sampleScan()
	s.Alerts = nil
	html, err := New().GenerateHTML(s)
	if err != nil {
		t.Fatalf("empty scan should render, got %v", err)
	}
	out := string(html)
	if !strings.Contains(out, "No vulnerabilities were identified") {
		t.Error("empty scan lacks clean-state message")
	}
}

func TestGenerateHTMLDeduplicates(t *testing.T) {
	s := sampleScan()
	s.Alerts = append(s.Alerts, s.Alerts[0]) // exact duplicate
	html, err := New().GenerateHTML(s)
	if err != nil {
		t.Fatal(err)
	}
	if got := strings.Count(string(html), "Reflected XSS was found."); got != 1 {
		t.Errorf("duplicate description rendered %d times", got)
	}
}

func TestGenerateHTMLEscapesEvidence(t *testing.T) {
	s := sampleScan()
	s.Alerts[0].Evidence = `<img src=x onerror="alert('xss')">`
	html, err := New().GenerateHTML(s)
	if err != nil {
		t.Fatal(err)
	}
	out := string(html)
	if strings.Contains(out, `<img src=x onerror=`) {
		t.Error("evidence was not HTML-escaped — XSS in report!")
	}
	if !strings.Contains(out, "&lt;img src=x") {
		t.Error("expected escaped evidence markup")
	}
}

func TestGenerateJSON(t *testing.T) {
	data, err := New().GenerateJSON(sampleScan())
	if err != nil {
		t.Fatal(err)
	}
	var parsed map[string]any
	if err := json.Unmarshal(data, &parsed); err != nil {
		t.Fatalf("invalid JSON: %v", err)
	}
	if parsed["target"] != "https://example.com" {
		t.Errorf("target = %v", parsed["target"])
	}
	alerts, ok := parsed["alerts"].([]any)
	if !ok || len(alerts) != 3 {
		t.Errorf("alerts = %v", parsed["alerts"])
	}
}
