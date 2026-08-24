package api

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"testing"

	"github.com/ghost0/BlackHawk/backend/internal/report"
	"github.com/ghost0/BlackHawk/backend/internal/scan"
	"github.com/ghost0/BlackHawk/backend/internal/zapclient"
)

// newTestServerWithStore returns a handler and its store so tests can seed
// completed scans directly.
func newTestServerWithStore(t *testing.T) (http.Handler, *scan.Store, *scan.Orchestrator) {
	t.Helper()
	store, err := scan.NewStore(filepath.Join(t.TempDir(), "test.db"))
	if err != nil {
		t.Fatalf("store: %v", err)
	}
	t.Cleanup(func() { _ = store.Close() })
	zap := zapclient.New("http://127.0.0.1:1", "test-key")
	orch := scan.NewOrchestrator(zap, store)
	return NewHandler(orch, report.New(), "http://localhost:5174"), store, orch
}

func seedCompletedScan(t *testing.T, orch *scan.Orchestrator, id string, alerts []scan.Alert) {
	t.Helper()
	s := &scan.Scan{
		ID: id, Target: "https://example.com",
		Config: scan.DefaultConfig(scan.ModeQuick),
		Status: scan.StatusComplete,
		Alerts: alerts,
	}
	if err := orch.SaveScan(s); err != nil {
		t.Fatalf("seed scan: %v", err)
	}
}

func TestCompareEndpointHappyPath(t *testing.T) {
	h, _, orch := newTestServerWithStore(t)
	seedCompletedScan(t, orch, "scan-base", []scan.Alert{
		{PluginID: "40012", Name: "XSS", Risk: "High", Confidence: "Confirmed", URL: "https://example.com/a"},
	})
	seedCompletedScan(t, orch, "scan-target", nil)

	req := httptest.NewRequest(http.MethodGet, "/api/compare/scan-base/scan-target", nil)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if rec.Code != 200 {
		t.Fatalf("want 200, got %d: %s", rec.Code, rec.Body.String())
	}
	var cmp struct {
		BaseScore   int `json:"baseScore"`
		TargetScore int `json:"targetScore"`
		ScoreDelta  int `json:"scoreDelta"`
		FixedCount  int `json:"-"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &cmp); err != nil {
		t.Fatal(err)
	}
	var full map[string]any
	_ = json.Unmarshal(rec.Body.Bytes(), &full)
	fixed, _ := full["fixedFindings"].([]any)
	newF, _ := full["newFindings"].([]any)
	if len(fixed) != 1 || len(newF) != 0 {
		t.Errorf("expected XSS fixed; fixed=%v new=%v", fixed, newF)
	}
	if cmp.BaseScore >= cmp.TargetScore {
		t.Errorf("target should score higher after fix: %d vs %d", cmp.BaseScore, cmp.TargetScore)
	}
}

func TestCompareEndpointMissingScan(t *testing.T) {
	h, _, orch := newTestServerWithStore(t)
	seedCompletedScan(t, orch, "a", nil)

	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/api/compare/a/missing", nil))
	if rec.Code != http.StatusNotFound {
		t.Errorf("want 404, got %d", rec.Code)
	}
}

func TestFindingsEndpoints(t *testing.T) {
	h, _, orch := newTestServerWithStore(t)
	seedCompletedScan(t, orch, "s1", []scan.Alert{
		{PluginID: "40012", Name: "XSS", Risk: "High", Confidence: "Confirmed", URL: "https://example.com/a?q=1", Param: "q"},
	})

	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/api/scan/s1/findings", nil))
	if rec.Code != 200 {
		t.Fatalf("findings: %d", rec.Code)
	}
	var findings []map[string]any
	if err := json.Unmarshal(rec.Body.Bytes(), &findings); err != nil {
		t.Fatal(err)
	}
	if len(findings) != 1 {
		t.Fatalf("want 1 finding, got %d", len(findings))
	}
	id, _ := findings[0]["id"].(string)

	rec = httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/api/scan/s1/findings/"+id, nil))
	if rec.Code != 200 {
		t.Fatalf("single finding: %d", rec.Code)
	}

	rec = httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/api/scan/s1/findings/nope", nil))
	if rec.Code != http.StatusNotFound {
		t.Errorf("unknown finding should 404, got %d", rec.Code)
	}
}

func TestAnalyticsEndpointShape(t *testing.T) {
	h, _, orch := newTestServerWithStore(t)
	seedCompletedScan(t, orch, "s2", []scan.Alert{
		{PluginID: "40018", Name: "SQLi", Risk: "High", Confidence: "Confirmed", URL: "https://example.com/login", Param: "u"},
	})

	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/api/scan/s2/analytics", nil))
	if rec.Code != 200 {
		t.Fatalf("%d: %s", rec.Code, rec.Body.String())
	}
	var body map[string]any
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatal(err)
	}
	score, _ := body["score"].(map[string]any)
	if score == nil || int(score["score"].(float64)) >= 100 {
		t.Errorf("analytics score wrong: %v", body["score"])
	}
	if _, ok := score["methodology"].(string); !ok || score["methodology"] == "" {
		t.Error("methodology must be present in the analytics payload")
	}
}
