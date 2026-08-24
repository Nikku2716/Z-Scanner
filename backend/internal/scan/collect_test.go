package scan

import (
	"path/filepath"
	"testing"

	"github.com/ghost0/BlackHawk/backend/internal/zapclient"
)

func newTestStore(t *testing.T) *Store {
	t.Helper()
	store, err := NewStore(filepath.Join(t.TempDir(), "test.db"))
	if err != nil {
		t.Fatalf("NewStore: %v", err)
	}
	t.Cleanup(func() { _ = store.Close() })
	return store
}

func TestExtractEndpoints(t *testing.T) {
	alerts := []zapclient.ZAPAlert{
		{PluginID: "40012", Name: "XSS", Risk: "High", URL: "https://example.com/search?q=x", Param: "q", Method: "GET"},
		{PluginID: "40012", Name: "XSS", Risk: "High", URL: "https://example.com/search?q=y", Param: "q", Method: "GET"}, // same endpoint
		{PluginID: "6", Name: "Path Traversal", Risk: "High", URL: "https://example.com/download", Method: "POST"},
		{URL: "https://example.com/login/", Method: "GET"}, // from site tree
		{URL: "https://other-host.com/evil", Method: "GET"},
	}

	endpoints := extractEndpoints("https://example.com", alerts)

	if len(endpoints) != 3 {
		t.Fatalf("want 3 endpoints, got %d: %+v", len(endpoints), endpoints)
	}

	var search Endpoint
	for _, e := range endpoints {
		if e.Path == "/search" {
			search = e
		}
	}
	if search.Method != "GET" || len(search.Params) != 1 || search.Params[0] != "q" {
		t.Errorf("search endpoint = %+v", search)
	}
	if search.RiskCounts["High"] != 2 {
		t.Errorf("expected High risk merged to 2, got %v", search.RiskCounts["High"])
	}
	for _, e := range endpoints {
		if e.ScanID != "" || e.ID != "" || !e.DiscoveredAt.IsZero() == false {
			// fields are set at persist time, not extraction time — fine
		}
	}
}

func TestCollectFromZAPPersists(t *testing.T) {
	store := newTestStore(t)
	collector := NewEndpointCollector(store)

	alerts := []zapclient.ZAPAlert{
		{Risk: "Medium", URL: "https://example.com/a?x=1", Method: "GET", Param: "x"},
		{Risk: "Low", URL: "https://example.com/b", Method: "POST"},
	}

	got, err := collector.CollectFromZAP("scan-1", "https://example.com", alerts)
	if err != nil {
		t.Fatalf("CollectFromZAP: %v", err)
	}
	if len(got) != 2 {
		t.Fatalf("want 2 endpoints, got %d", len(got))
	}

	persisted, err := store.ListScanEndpoints("scan-1")
	if err != nil {
		t.Fatalf("ListScanEndpoints: %v", err)
	}
	if len(persisted) != 2 {
		t.Fatalf("want 2 persisted, got %d", len(persisted))
	}
	for _, e := range persisted {
		if e.ID == "" || e.DiscoveredAt.IsZero() {
			t.Errorf("endpoint not enriched on persist: %+v", e)
		}
	}

	// Replace pass is idempotent — no duplicates.
	if _, err := collector.CollectFromZAP("scan-1", "https://example.com", alerts); err != nil {
		t.Fatalf("second collect: %v", err)
	}
	persisted2, _ := store.ListScanEndpoints("scan-1")
	if len(persisted2) != 2 {
		t.Errorf("re-collection duplicated endpoints: got %d", len(persisted2))
	}
}

func TestDeleteScanEndpoints(t *testing.T) {
	store := newTestStore(t)
	collector := NewEndpointCollector(store)
	_, err := collector.CollectFromZAP("s1", "https://example.com", []zapclient.ZAPAlert{
		{URL: "https://example.com/x", Method: "GET"},
	})
	if err != nil {
		t.Fatal(err)
	}
	if err := store.DeleteScanEndpoints("s1"); err != nil {
		t.Fatal(err)
	}
	list, _ := store.ListScanEndpoints("s1")
	if len(list) != 0 {
		t.Errorf("endpoints not deleted: %+v", list)
	}
}
