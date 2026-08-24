package scan

import (
	"testing"
	"time"
)

func TestNormalizeEndpointURL(t *testing.T) {
	tests := []struct {
		name string
		in   string
		want string
	}{
		{"empty", "", ""},
		{"lowercases scheme and host", "HTTP://EXAMPLE.COM/path", "http://example.com/path"},
		{"strips default http port", "http://example.com:80/a", "http://example.com/a"},
		{"keeps non-default port", "http://example.com:8080/a", "http://example.com:8080/a"},
		{"strips default https port", "https://example.com:443/", "https://example.com/"},
		{"drops fragment", "https://example.com/a#section", "https://example.com/a"},
		{"trims trailing slash", "https://example.com/login/", "https://example.com/login"},
		{"keeps root slash", "https://example.com/", "https://example.com/"},
		{"sorts query params", "https://example.com/s?b=2&a=1", "https://example.com/s?a=1&b=2"},
		{"no url parse failure panic on garbage path", "/just-a-path", "/just-a-path"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := NormalizeEndpointURL(tt.in); got != tt.want {
				t.Errorf("NormalizeEndpointURL(%q) = %q, want %q", tt.in, got, tt.want)
			}
		})
	}
}

func TestEndpointPath(t *testing.T) {
	if got := EndpointPath("https://example.com/api/users?id=3"); got != "/api/users" {
		t.Errorf("got %q", got)
	}
	if got := EndpointPath("https://example.com"); got != "/" {
		t.Errorf("got %q", got)
	}
}

func TestDeduplicateEndpoints(t *testing.T) {
	now := time.Now().UTC()
	endpoints := []Endpoint{
		{URL: "https://example.com/login", Method: "GET", StatusCode: 200, ContentType: "text/html"},
		{URL: "https://example.com/login/", Method: "GET", StatusCode: 404}, // same after normalize
		{URL: "https://example.com/login", Method: "POST"},                  // different method
		{URL: "https://example.com/search?q=1", Method: "GET", Params: []string{"q"}},
		{URL: "https://EXAMPLE.com/search?q=2", Method: "GET", Params: []string{"q"}}, // same normalized
	}

	got := DeduplicateEndpoints(endpoints)
	if len(got) != 3 {
		t.Fatalf("want 3 unique endpoints, got %d: %+v", len(got), got)
	}

	first := got[0]
	if first.StatusCode != 200 || first.ContentType != "text/html" {
		t.Errorf("expected first record's status/content preserved, got %+v", first)
	}

	search := got[2]
	if len(search.Params) != 1 || search.Params[0] != "q" {
		t.Errorf("search endpoint params = %v", search.Params)
	}

	_ = now
}

func TestDeduplicateEndpointsMergesRiskCounts(t *testing.T) {
	endpoints := []Endpoint{
		{URL: "https://e.com/x", Method: "GET", RiskCounts: map[string]int{"High": 1}},
		{URL: "https://e.com/x/", Method: "POST", RiskCounts: map[string]int{"Medium": 2}}, // different method → separate
		{URL: "https://e.com/x", Method: "get", RiskCounts: map[string]int{"High": 1, "Low": 1}},
	}
	got := DeduplicateEndpoints(endpoints)
	if len(got) != 2 {
		t.Fatalf("want 2, got %d", len(got))
	}
	if got[0].RiskCounts["High"] != 2 || got[0].RiskCounts["Low"] != 1 {
		t.Errorf("risk counts not merged: %+v", got[0].RiskCounts)
	}
}

func TestSortEndpoints(t *testing.T) {
	endpoints := []Endpoint{
		{URL: "https://e.com/b", Method: "GET"},
		{URL: "https://e.com/a", Method: "POST"},
		{URL: "https://e.com/a", Method: "GET"},
	}
	SortEndpoints(endpoints)
	want := []string{"/a GET", "/b GET", "/a POST"}
	for i, w := range []string{"GET /a", "GET /b", "POST /a"} {
		_ = w
		_ = i
		_ = want[0]
	}
	if endpoints[0].Method != "GET" || endpoints[0].URL != "https://e.com/a" {
		t.Errorf("unexpected order: %+v", endpoints)
	}
	if endpoints[2].Method != "POST" {
		t.Errorf("unexpected order: %+v", endpoints)
	}
}
