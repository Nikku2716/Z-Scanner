package scan

import (
	"testing"
)

func baseAlerts() []Alert {
	return []Alert{
		{PluginID: "40012", Name: "XSS", Risk: "High", Confidence: "Confirmed", URL: "https://e.com/search?q=1", Param: "q"},
		{PluginID: "10038", Name: "CSP Missing", Risk: "Medium", Confidence: "Firm", URL: "https://e.com/"},
	}
}

func targetAlerts() []Alert {
	return []Alert{
		// XSS fixed, CSP persists, SQLi is new
		{PluginID: "10038", Name: "CSP Missing", Risk: "Medium", Confidence: "Firm", URL: "https://e.com/"},
		{PluginID: "40018", Name: "SQLi", Risk: "High", Confidence: "Confirmed", URL: "https://e.com/login?u=1", Param: "u"},
	}
}

func TestCompareBasics(t *testing.T) {
	cmp := Compare("s1", baseAlerts(), nil, "s2", targetAlerts(), nil)

	if len(cmp.NewFindings) != 1 || cmp.NewFindings[0].Name != "SQLi" {
		t.Errorf("new findings = %+v", cmp.NewFindings)
	}
	if len(cmp.FixedFindings) != 1 || cmp.FixedFindings[0].Name != "XSS" {
		t.Errorf("fixed findings = %+v", cmp.FixedFindings)
	}
	if len(cmp.PersistentFindings) != 1 || cmp.PersistentFindings[0].Name != "CSP Missing" {
		t.Errorf("persistent findings = %+v", cmp.PersistentFindings)
	}

	// s1: High(15*1.0*1.0)=15 + Medium(7*1.0)=7 → score 78
	// s2: same shape → 78
	if cmp.BaseScore != 78 || cmp.TargetScore != 78 {
		t.Errorf("scores = %d, %d; want 78, 78", cmp.BaseScore, cmp.TargetScore)
	}
	if cmp.ScoreDelta != 0 {
		t.Errorf("delta = %d", cmp.ScoreDelta)
	}
}

func TestCompareScoreImprovement(t *testing.T) {
	cmp := Compare("s1", baseAlerts(), nil, "s2", nil, nil)
	if cmp.TargetScore != 100 {
		t.Errorf("clean target should be 100, got %d", cmp.TargetScore)
	}
	if cmp.ScoreDelta <= 0 {
		t.Errorf("removing alerts must improve the score: %d", cmp.ScoreDelta)
	}
}

func TestCompareEndpoints(t *testing.T) {
	baseEP := []Endpoint{
		{URL: "https://e.com/keep", Method: "GET"},
		{URL: "https://e.com/gone", Method: "POST"},
	}
	targetEP := []Endpoint{
		{URL: "https://e.com/keep/", Method: "GET"}, // trailing slash — same endpoint
		{URL: "https://e.com/fresh", Method: "GET"},
	}

	cmp := Compare("s1", nil, baseEP, "s2", nil, targetEP)

	if len(cmp.NewEndpoints) != 1 || cmp.NewEndpoints[0].URL != "https://e.com/fresh" {
		t.Errorf("new endpoints = %+v", cmp.NewEndpoints)
	}
	if len(cmp.RemovedEndpoints) != 1 || endpointIdentity(cmp.RemovedEndpoints[0]) != endpointIdentity(Endpoint{URL: "https://e.com/gone", Method: "POST"}) {
		t.Errorf("removed endpoints = %+v", cmp.RemovedEndpoints)
	}
}

func TestCompareEmptyScans(t *testing.T) {
	cmp := Compare("a", nil, nil, "b", nil, nil)
	if cmp.BaseScore != 100 || cmp.TargetScore != 100 || cmp.ScoreDelta != 0 {
		t.Errorf("two clean scans should compare equal at 100: %+v", cmp)
	}
	if len(cmp.NewFindings)+len(cmp.FixedFindings)+len(cmp.PersistentFindings) != 0 {
		t.Error("no findings expected")
	}
}

func TestCompareDeterministic(t *testing.T) {
	alerts := make([]Alert, 0, 20)
	for i := 0; i < 20; i++ {
		alerts = append(alerts, Alert{
			PluginID: "40000",
			Name:     "Vuln",
			Risk:     "Medium",
			URL:      "https://e.com/p" + string(rune('a'+i)),
		})
	}
	a := Compare("s1", alerts, nil, "s2", alerts, nil)
	b := Compare("s1", alerts, nil, "s2", alerts, nil)
	if len(a.PersistentFindings) == 0 {
		t.Fatal("expected persistent findings")
	}
	for i := range a.PersistentFindings {
		if a.PersistentFindings[i].ID != b.PersistentFindings[i].ID {
			t.Fatalf("non-deterministic ordering at %d", i)
		}
	}
}
