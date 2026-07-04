package scan

import (
	"sort"
	"strings"
)

// DeduplicateAlerts removes repeated ZAP alert instances while preserving the
// first occurrence and keeping findings that differ by URL, parameter, risk,
// plugin, attack payload, or evidence. ZAP can emit the same logical alert
// more than once after spider/passive/active phases have populated the same
// session, so all report paths should normalize alerts through this function.
func DeduplicateAlerts(alerts []Alert) []Alert {
	if len(alerts) < 2 {
		return alerts
	}

	seen := make(map[string]struct{}, len(alerts))
	unique := make([]Alert, 0, len(alerts))
	for _, alert := range alerts {
		key := alertDedupKey(alert)
		if _, ok := seen[key]; ok {
			continue
		}
		seen[key] = struct{}{}
		unique = append(unique, alert)
	}
	return unique
}

func alertDedupKey(alert Alert) string {
	parts := []string{
		alert.PluginID,
		alert.URL,
		alert.Param,
		alert.Risk,
		alert.Attack,
		alert.Evidence,
	}

	for i := range parts {
		parts[i] = strings.TrimSpace(parts[i])
	}
	return strings.Join(parts, "|")
}

func SortAlertsByRisk(alerts []Alert) {
	sort.SliceStable(alerts, func(i, j int) bool {
		left, right := RiskOrder(alerts[i].Risk), RiskOrder(alerts[j].Risk)
		if left != right {
			return left < right
		}
		if alerts[i].Name != alerts[j].Name {
			return alerts[i].Name < alerts[j].Name
		}
		return alerts[i].URL < alerts[j].URL
	})
}
