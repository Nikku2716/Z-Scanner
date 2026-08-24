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

func newTestServer(t *testing.T) http.Handler {
	t.Helper()
	store, err := scan.NewStore(filepath.Join(t.TempDir(), "test.db"))
	if err != nil {
		t.Fatalf("store: %v", err)
	}
	t.Cleanup(func() { _ = store.Close() })
	// A ZAP client pointed at an unreachable address — no scan can start,
	// which is exactly what these API tests want.
	zap := zapclient.New("http://127.0.0.1:1", "test-key")
	return NewHandler(scan.NewOrchestrator(zap, store), report.New(), "http://localhost:5173")
}

func getJSON(t *testing.T, h http.Handler, path string) (int, map[string]any) {
	t.Helper()
	req := httptest.NewRequest(http.MethodGet, path, nil)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	var body map[string]any
	if rec.Code < 300 {
		if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
			t.Fatalf("decode %s: %v", path, err)
		}
	}
	return rec.Code, body
}

func TestHealthEndpoint(t *testing.T) {
	h := newTestServer(t)
	code, body := getJSON(t, h, "/health")
	if code != 200 || body["status"] != "ok" {
		t.Errorf("health = %d %v", code, body)
	}
}

func TestAnalyticsUnknownScanReturns404(t *testing.T) {
	h := newTestServer(t)
	req := httptest.NewRequest(http.MethodGet, "/api/scan/nope/analytics", nil)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusNotFound {
		t.Errorf("want 404, got %d", rec.Code)
	}
}

func TestEndpointsUnknownScanReturns404(t *testing.T) {
	h := newTestServer(t)
	req := httptest.NewRequest(http.MethodGet, "/api/scan/nope/endpoints", nil)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusNotFound {
		t.Errorf("want 404, got %d", rec.Code)
	}
}

func TestFindingsUnknownScanReturns404(t *testing.T) {
	h := newTestServer(t)
	req := httptest.NewRequest(http.MethodGet, "/api/scan/nope/findings", nil)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusNotFound {
		t.Errorf("want 404, got %d", rec.Code)
	}
}

func TestListScansEmpty(t *testing.T) {
	h := newTestServer(t)
	req := httptest.NewRequest(http.MethodGet, "/api/scans", nil)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != 200 {
		t.Fatalf("want 200, got %d", rec.Code)
	}
	var scans []map[string]any
	if err := json.Unmarshal(rec.Body.Bytes(), &scans); err != nil {
		t.Fatal(err)
	}
	if len(scans) != 0 {
		t.Errorf("want empty list, got %v", scans)
	}
}

func TestStartScanValidation(t *testing.T) {
	h := newTestServer(t)
	req := httptest.NewRequest(http.MethodPost, "/api/scan", nil)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusBadRequest {
		t.Errorf("empty target should be rejected, got %d", rec.Code)
	}
}
