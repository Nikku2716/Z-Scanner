package scan

import (
	"fmt"
	"sort"
	"strings"
)

// Finding is a correlated vulnerability: all ZAP alerts that share a
// (pluginId, normalized path, param) identity are grouped into one finding,
// with every affected URL and raw alert preserved as evidence.
type Finding struct {
	ID            string   `json:"id"` // deterministic: scanID + group key hash
	ScanID        string   `json:"scanId"`
	PluginID      string   `json:"pluginId"`
	Name          string   `json:"name"`
	Risk          string   `json:"risk"`
	Confidence    string   `json:"confidence"`
	Description   string   `json:"description"`
	Solution      string   `json:"solution"`
	Reference     string   `json:"reference"`
	CWEID         string   `json:"cweid"`
	WASCID        string   `json:"wascid,omitempty"`
	Param         string   `json:"param,omitempty"`
	AffectedURLs  []string `json:"affectedUrls"`
	AffectedCount int      `json:"affectedCount"`
	Alerts        []Alert  `json:"alerts"` // original evidence, deduplicated
}

// findingKey groups alerts by vulnerability class (pluginId + name) rather
// than by individual URL path or parameter. This means all instances of the
// same vulnerability type (e.g. "Absence of Anti-CSRF Tokens" across 6 pages)
// collapse into a single finding with multiple affected URLs, which is how
// professional security tools (Burp Suite, Nessus, Qualys) present findings.
// Per-URL evidence and parameters are preserved inside each Finding.Alerts.
func findingKey(a Alert) string {
	return strings.Join([]string{
		a.PluginID,
		strings.ToLower(strings.TrimSpace(a.Name)),
	}, "|")
}

// CorrelateFindings groups deduplicated alerts into findings. Input alerts
// are first passed through DeduplicateAlerts. Output is sorted by risk
// severity, then name, then plugin ID — fully deterministic.
func CorrelateFindings(scanID string, alerts []Alert) []Finding {
	alerts = DeduplicateAlerts(alerts)
	groups := make(map[string]*Finding)
	order := make([]string, 0)

	for _, a := range alerts {
		key := findingKey(a)
		f, ok := groups[key]
		if !ok {
			f = &Finding{
				ID:          FindingID(scanID, a),
				ScanID:      scanID,
				PluginID:    a.PluginID,
				Name:        a.Name,
				Risk:        a.Risk,
				Confidence:  a.Confidence,
				Description: a.Description,
				Solution:    a.Solution,
				Reference:   a.Reference,
				CWEID:       a.CWEID,
				Param:       strings.TrimSpace(a.Param),
			}
			groups[key] = f
			order = append(order, key)
		}
		if !contains(f.AffectedURLs, endpointOriginPath(a.URL)) {
			f.AffectedURLs = append(f.AffectedURLs, endpointOriginPath(a.URL))
		}
		f.Alerts = append(f.Alerts, a)
	}

	findings := make([]Finding, 0, len(order))
	for _, key := range order {
		f := groups[key]
		sort.Strings(f.AffectedURLs)
		f.AffectedCount = len(f.AffectedURLs)
		sort.SliceStable(f.Alerts, func(i, j int) bool {
			return f.Alerts[i].URL < f.Alerts[j].URL
		})
		findings = append(findings, *f)
	}

	sort.SliceStable(findings, func(i, j int) bool {
		ri, rj := RiskOrder(findings[i].Risk), RiskOrder(findings[j].Risk)
		if ri != rj {
			return ri < rj
		}
		if findings[i].Name != findings[j].Name {
			return findings[i].Name < findings[j].Name
		}
		return findings[i].PluginID < findings[j].PluginID
	})
	return findings
}

// FindingID derives a stable identifier for a finding from its group
// identity, independent of insertion order.
func FindingID(scanID string, representative Alert) string {
	return fmt.Sprintf("%s-f-%s", scanID, shortHash(findingKey(representative)))
}

func shortHash(s string) string {
	const fnvPrime = 1099511628211
	var h uint64 = 14695981039346656037
	for i := 0; i < len(s); i++ {
		h ^= uint64(s[i])
		h *= fnvPrime
	}
	return fmt.Sprintf("%016x", h)
}
