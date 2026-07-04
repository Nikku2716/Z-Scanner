package scan

import "testing"

func TestDeduplicateAlertsRemovesRepeatedLogicalFindings(t *testing.T) {
	alerts := []Alert{
		{
			ID:       "first",
			PluginID: "10021",
			URL:      "https://example.test/login",
			Param:    "session",
			Risk:     "Medium",
		},
		{
			ID:       "duplicate",
			PluginID: "10021",
			URL:      "https://example.test/login",
			Param:    "session",
			Risk:     "Medium",
		},
	}

	got := DeduplicateAlerts(alerts)
	if len(got) != 1 {
		t.Fatalf("expected 1 unique alert, got %d", len(got))
	}
	if got[0].ID != "first" {
		t.Fatalf("expected first occurrence to be preserved, got %q", got[0].ID)
	}
}

func TestDeduplicateAlertsPreservesDistinctFindings(t *testing.T) {
	base := Alert{
		PluginID: "40012",
		URL:      "https://example.test/search",
		Param:    "q",
		Risk:     "High",
	}
	alerts := []Alert{
		withID(base, "base"),
		withID(Alert{PluginID: "40012", URL: "https://example.test/profile", Param: "q", Risk: "High"}, "different-url"),
		withID(Alert{PluginID: "40012", URL: "https://example.test/search", Param: "page", Risk: "High"}, "different-param"),
		withID(Alert{PluginID: "90033", URL: "https://example.test/search", Param: "q", Risk: "High"}, "different-plugin"),
		withID(Alert{PluginID: "40012", URL: "https://example.test/search", Param: "q", Risk: "Medium"}, "different-risk"),
		withID(Alert{PluginID: "40012", URL: "https://example.test/search", Param: "q", Risk: "High", Attack: "<script>1</script>"}, "different-attack"),
		withID(Alert{PluginID: "40012", URL: "https://example.test/search", Param: "q", Risk: "High", Evidence: "alert(1)"}, "different-evidence"),
	}

	got := DeduplicateAlerts(alerts)
	if len(got) != len(alerts) {
		t.Fatalf("expected all distinct alerts to remain, got %d want %d", len(got), len(alerts))
	}
}

func TestDeduplicateAlertsTrimsKeyFields(t *testing.T) {
	alerts := []Alert{
		{ID: "first", PluginID: "10021", URL: "https://example.test/", Param: "x", Risk: "Low"},
		{ID: "second", PluginID: " 10021 ", URL: " https://example.test/ ", Param: " x ", Risk: " Low "},
	}

	got := DeduplicateAlerts(alerts)
	if len(got) != 1 {
		t.Fatalf("expected whitespace variants to dedupe, got %d", len(got))
	}
}

func withID(alert Alert, id string) Alert {
	alert.ID = id
	return alert
}
