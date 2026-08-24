package scan

import (
	"sort"
	"strings"
)

// Security risk scoring.
//
// METHODOLOGY (BlackHawk Security Score, 0-100, higher = better):
//
// The score starts at 100 and is reduced by weighted deductions for each
// correlated finding. Deductions scale with severity and confidence:
//
//   Severity base weights:  High 15, Medium 7, Low 2, Informational 0.5
//   Confidence multipliers: Confirmed 1.0, Firm 1.0,
//                           Low 0.5, Uncertain/other/empty 0.25
//
// Per-finding deduction = severityWeight * confidenceMultiplier * scopeFactor,
// where scopeFactor grows with the number of affected endpoints but with
// diminishing returns: 1 + min(affectedCount-1, 4) * 0.2 (max 1.8x).
//
// The final score is clamped to [0, 100] and rounded to an integer.
// Identical inputs always produce identical outputs — no randomness, no
// wall-clock dependence.
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

func scopeFactor(affectedCount int) float64 {
	if affectedCount < 1 {
		affectedCount = 1
	}
	extra := affectedCount - 1
	if extra > 4 {
		extra = 4
	}
	return 1.0 + float64(extra)*0.2
}

// FindingDeduction returns the score points a single finding removes.
func FindingDeduction(f Finding) float64 {
	return severityWeight(f.Risk) * confidenceMultiplier(f.Confidence) * scopeFactor(len(f.AffectedURLs))
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

const methodologyDoc = "BlackHawk Security Score: starts at 100; each correlated finding deducts " +
	"severity weight (High 15, Medium 7, Low 2, Info 0.5) x confidence multiplier " +
	"(Confirmed/Firm 1.0, Low 0.5, other 0.25) x scope factor (1 + up to 4 extra endpoints at 0.2 each). " +
	"Clamped to 0-100. Not CVSS."

// ScoreScan computes the security score for a scan's alerts.
func ScoreScan(alerts []Alert) ScoreResult {
	findings := CorrelateFindings("", alerts)

	result := ScoreResult{
		RiskCounts:  map[string]int{"High": 0, "Medium": 0, "Low": 0, "Informational": 0},
		Methodology: methodologyDoc,
	}
	urlSet := make(map[string]struct{})
	deduction := 0.0

	for _, f := range findings {
		result.FindingCount++
		result.AlertCount += len(f.Alerts)
		result.RiskCounts[f.Risk]++
		for _, u := range f.AffectedURLs {
			urlSet[u] = struct{}{}
		}
		deduction += FindingDeduction(f)
		result.Categories = append(result.Categories, CategoryStat{
			Name:     f.Name,
			PluginID: f.PluginID,
			CWEID:    f.CWEID,
			Risk:     f.Risk,
			Count:    len(f.Alerts),
		})
	}
	result.AffectedEndpoint = len(urlSet)

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
