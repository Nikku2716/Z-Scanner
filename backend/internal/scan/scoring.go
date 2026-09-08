package scan

import (
	"math"
	"sort"
	"strings"
)

// Security risk scoring.
//
// METHODOLOGY (BlackHawk Security Score, 0-100, higher = better):
//
// The score starts at 100 and is reduced by weighted deductions for each
// severity level. Deductions scale with severity, confidence, and number
// of *distinct* finding categories, but with diminishing returns:
//
//   Per-finding base deduction = severityWeight × confidenceMultiplier
//     Severity weights: High 15, Medium 7, Low 2, Informational 0.5
//     Confidence multipliers: Confirmed/Firm 1.0, Low 0.5, other 0.25
//
//   Total deduction for a severity level = baseWeight × log2(count+1)
//   (diminishing returns: 1st finding costs full weight, 2nd costs ~0.58×,
//    3rd ~0.46×, etc.)
//
//   Cap: total deduction cannot exceed 100. Score clamped to [0, 100].
//
// This is NOT CVSS. ZAP does not emit CVSS vectors; the BlackHawk score is a
// prioritization aid. CWE/WASC metadata from ZAP is surfaced separately.

type SeverityWeights struct {
	High          float64
	Medium        float64
	Low           float64
	Informational float64
}

var defaultSeverityWeights = SeverityWeights{High: 15, Medium: 7, Low: 2, Informational: 0.5}

func severityWeight(risk string) float64 {
	switch risk {
	case "High":
		return defaultSeverityWeights.High
	case "Medium":
		return defaultSeverityWeights.Medium
	case "Low":
		return defaultSeverityWeights.Low
	case "Informational", "Info":
		return defaultSeverityWeights.Informational
	default:
		return defaultSeverityWeights.Informational
	}
}

func confidenceMultiplier(confidence string) float64 {
	switch strings.ToLower(strings.TrimSpace(confidence)) {
	case "confirmed", "firm", "high", "certain":
		return 1.0
	case "low":
		return 0.5
	default:
		return 0.25
	}
}

// FindingDeduction returns the score points a single finding removes.
func FindingDeduction(f Finding) float64 {
	return severityWeight(f.Risk) * confidenceMultiplier(f.Confidence)
}

// ScoreResult is the deterministic security assessment of one scan.
type ScoreResult struct {
	Score            int            `json:"score"`
	RiskCounts       map[string]int `json:"riskCounts"`
	FindingCount     int            `json:"findingCount"`
	AlertCount       int            `json:"alertCount"`
	AffectedEndpoint int            `json:"affectedEndpoints"`
	Categories       []CategoryStat `json:"categories"`
	Methodology      string         `json:"methodology"`
}

const methodologyDoc = "BlackHawk Security Score: starts at 100; each severity level deducts " +
	"base weight (High 15, Medium 7, Low 2, Info 0.5) x confidence multiplier " +
	"(Confirmed/Firm 1.0, Low 0.5, other 0.25) x log2(distinctFindingCount+1) " +
	"for diminishing returns. Capped at 100. Not CVSS."

// ScoreScan computes the security score for a scan's alerts.
func ScoreScan(alerts []Alert) ScoreResult {
	findings := CorrelateFindings("", alerts)

	result := ScoreResult{
		RiskCounts:  map[string]int{"High": 0, "Medium": 0, "Low": 0, "Informational": 0},
		Methodology: methodologyDoc,
	}
	urlSet := make(map[string]struct{})

	// Count distinct findings per severity level
	riskCount := map[string]int{"High": 0, "Medium": 0, "Low": 0, "Informational": 0}
	for _, f := range findings {
		result.FindingCount++
		result.AlertCount += len(f.Alerts)
		result.RiskCounts[f.Risk]++
		riskCount[f.Risk]++
		for _, u := range f.AffectedURLs {
			urlSet[u] = struct{}{}
		}
		result.Categories = append(result.Categories, CategoryStat{
			Name:     f.Name,
			PluginID: f.PluginID,
			CWEID:    f.CWEID,
			Risk:     f.Risk,
			Count:    len(f.Alerts),
		})
	}
	result.AffectedEndpoint = len(urlSet)

	// Deduction with diminishing returns: log2(count+1) so more findings
	// of the same severity have smaller marginal impact.
	deduction := 0.0
	for risk, count := range riskCount {
		if count == 0 {
			continue
		}
		deduction += severityWeight(risk) * math.Log2(float64(count+1))
	}

	if deduction > 100 {
		deduction = 100
	}
	score := 100.0 - deduction
	if score < 0 {
		score = 0
	}
	result.Score = int(score + 0.5)
	sort.SliceStable(result.Categories, func(i, j int) bool {
		if result.Categories[i].Count != result.Categories[j].Count {
			return result.Categories[i].Count > result.Categories[j].Count
		}
		return result.Categories[i].Name < result.Categories[j].Name
	})
	return result
}

// CategoryStat summarizes one vulnerability category (finding group).
type CategoryStat struct {
	Name     string `json:"name"`
	PluginID string `json:"pluginId"`
	CWEID    string `json:"cweId,omitempty"`
	Risk     string `json:"risk"`
	Count    int    `json:"count"` // number of alerts in this category
}
