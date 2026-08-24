package scan

import (
	"testing"
)

func alertSet() []Alert {
	return []Alert{
		{ID: "1", PluginID: "40012", Name: "Cross Site Scripting", Risk: "High", Confidence: "Confirmed", URL: "https://e.com/s?q=1", Method: "GET", Param: "q"},
		{ID: "2", PluginID: "40012", Name: "Cross Site Scripting", Risk: "High", Confidence: "Confirmed", URL: "https://e.com/comment?msg=x", Method: "POST", Param: "msg"},
		{ID: "3", PluginID: "40012", Name: "Cross Site Scripting", Risk: "High", Confidence: "Confirmed", URL: "https://e.com/s?q=1", Method: "GET", Param: "q"}, // exact dup
		{ID: "4", PluginID: "40018", Name: "SQL Injection", Risk: "High", Confidence: "Firm", URL: "https://e.com/login", Method: "POST", Param: "user"},
		{ID: "5", PluginID: "10038", Name: "Content Security Policy Header Not Set", Risk: "Medium", Confidence: "Firm", URL: "https://e.com/", Method: "GET"},
		{ID: "6", PluginID: "10098", Name: "Cross-Domain Misconfiguration", Risk: "Low", Confidence: "Low", URL: "https://e.com/static/app.js", Method: "GET"},
	}
}

func TestCorrelateFindings(t *testing.T) {
	findings := CorrelateFindings("scan-9", alertSet())

	if len(findings) != 5 {
		t.Fatalf("want 5 findings, got %d", len(findings))
	}
	if findings[0].Risk != "High" || findings[0].Name != "Cross Site Scripting" {
		t.Errorf("first finding = %+v", findings[0])
	}
	if findings[0].AffectedCount != 1 {
		t.Errorf("XSS affected endpoints = %d, want 1 (exact dupes collapsed)", findings[0].AffectedCount)
	}
	if len(findings[0].Alerts) != 1 {
		t.Errorf("XSS should keep exactly one evidence alert after dedup, got %d", len(findings[0].Alerts))
	}
	for _, f := range findings {
		if len(f.Alerts) == 0 {
			t.Errorf("%s lost its evidence alerts", f.Name)
		}
		if len(f.AffectedURLs) != f.AffectedCount {
			t.Errorf("affected count mismatch on %s", f.Name)
		}
	}
	// Deterministic ordering
	again := CorrelateFindings("scan-9", alertSet())
	for i := range findings {
		if findings[i].ID != again[i].ID {
			t.Errorf("non-deterministic finding order at %d", i)
		}
	}
}

func TestCorrelateFindingsEmpty(t *testing.T) {
	f := CorrelateFindings("x", nil)
	if len(f) != 0 {
		t.Errorf("want empty, got %d", len(f))
	}
}

func TestCorrelateMissingOptionalFields(t *testing.T) {
	findings := CorrelateFindings("x", []Alert{
		{Name: "", Risk: "", Confidence: "", URL: "", Param: ""},
	})
	if len(findings) != 1 {
		t.Fatalf("degenerate alert should still correlate, got %d", len(findings))
	}
	if findings[0].Name != "" || findings[0].Risk != "" {
		t.Errorf("fields mutated: %+v", findings[0])
	}
}

func TestScoreScanEmpty(t *testing.T) {
	r := ScoreScan(nil)
	if r.Score != 100 {
		t.Errorf("empty scan score = %d, want 100", r.Score)
	}
	if r.FindingCount != 0 || r.AffectedEndpoint != 0 {
		t.Errorf("unexpected counts: %+v", r)
	}
	if r.Methodology == "" {
		t.Error("methodology must always be documented")
	}
}

func TestScoreScanDeterministicAndOrdered(t *testing.T) {
	a, b := ScoreScan(alertSet()), ScoreScan(alertSet())
	if a.Score != b.Score {
		t.Fatalf("nondeterministic score: %d vs %d", a.Score, b.Score)
	}
	if a.Score >= 100 {
		t.Errorf("alerts should reduce the score, got %d", a.Score)
	}
	if a.RiskCounts["High"] != 3 || a.RiskCounts["Medium"] != 1 || a.RiskCounts["Low"] != 1 {
		t.Errorf("risk counts wrong: %+v", a.RiskCounts)
	}
	// High-confidence SQLi + XSS on distinct endpoints should hurt more than
	// one low-confidence informational.
	worse := ScoreScan([]Alert{{PluginID: "6", Name: "SQLi", Risk: "High", Confidence: "Confirmed", URL: "https://e.com/a"}})
	better := ScoreScan([]Alert{{PluginID: "0", Name: "Info leak", Risk: "Informational", Confidence: "Low", URL: "https://e.com/b"}})
	if worse.Score >= better.Score {
		t.Errorf("severity not respected: %d vs %d", worse.Score, better.Score)
	}
	if a.Categories[0].Count < a.Categories[len(a.Categories)-1].Count {
		t.Error("categories not sorted by count desc")
	}
}

func TestScoreClampsToZero(t *testing.T) {
	alerts := make([]Alert, 0, 30)
	for i := 0; i < 30; i++ {
		alerts = append(alerts, Alert{
			PluginID: "1", Name: "RCE-ish", Risk: "High", Confidence: "Confirmed",
			URL: "https://e.com/path" + string(rune('a'+i%26)) + string(rune('a'+(i/26)%26)),
		})
	}
	if got := ScoreScan(alerts).Score; got != 0 {
		t.Errorf("score should clamp to 0, got %d", got)
	}
}

func TestScopeFactorDiminishing(t *testing.T) {
	base := FindingDeduction(Finding{Risk: "High", Confidence: "Confirmed", AffectedURLs: []string{"u"}})
	maxed := FindingDeduction(Finding{Risk: "High", Confidence: "Confirmed", AffectedURLs: []string{"1", "2", "3", "4", "5", "6", "7", "8", "9", "10"}})
	if maxed > base*1.8+1e-9 || maxed <= base*1.7 {
		t.Errorf("scope factor out of expected band: base=%f maxed=%f", base, maxed)
	}
}
