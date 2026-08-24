package scan

// Scan comparison engine. Compares two completed scans by correlating each
// scan's alerts into findings and matching them by identity
// (pluginId + name + path + param). Endpoints are matched by normalized
// origin+path+method+param names, the same key used for persistence.
//
// All logic is deterministic — identical inputs always produce identical
// output, including ordering.

import "sort"

type Comparison struct {
	BaseScanID         string     `json:"baseScanId"`
	TargetScanID       string     `json:"targetScanId"`
	BaseScore          int        `json:"baseScore"`
	TargetScore        int        `json:"targetScore"`
	ScoreDelta         int        `json:"scoreDelta"`
	NewFindings        []Finding  `json:"newFindings"`
	FixedFindings      []Finding  `json:"fixedFindings"`
	PersistentFindings []Finding  `json:"persistentFindings"`
	NewEndpoints       []Endpoint `json:"newEndpoints"`
	RemovedEndpoints   []Endpoint `json:"removedEndpoints"`
}

func findingIdentity(f Finding) string {
	return strings_Join([]string{f.PluginID, lowerName(f.Name), f.Param}, "|")
}

func lowerName(s string) string {
	b := []byte(s)
	for i := range b {
		if b[i] >= 'A' && b[i] <= 'Z' {
			b[i] += 32
		}
	}
	return string(b)
}

func strings_Join(parts []string, sep string) string {
	out := ""
	for i, p := range parts {
		if i > 0 {
			out += sep
		}
		out += p
	}
	return out
}

func endpointIdentity(e Endpoint) string {
	names := append([]string(nil), e.Params...)
	sort.Strings(names)
	return strings_Join([]string{
		endpointOriginPath(e.URL),
		normalizeMethod(e.Method),
		strings_Join(names, ","),
	}, "|")
}

// Compare correlates both scans independently and diffs their findings and
// endpoints.
func Compare(baseScanID string, baseAlerts []Alert, baseEndpoints []Endpoint,
	targetScanID string, targetAlerts []Alert, targetEndpoints []Endpoint) *Comparison {

	baseFindings := CorrelateFindings(baseScanID, baseAlerts)
	targetFindings := CorrelateFindings(targetScanID, targetAlerts)

	baseIndex := make(map[string]Finding, len(baseFindings))
	for _, f := range baseFindings {
		baseIndex[findingIdentity(f)] = f
	}
	targetIndex := make(map[string]Finding, len(targetFindings))
	for _, f := range targetFindings {
		targetIndex[findingIdentity(f)] = f
	}

	cmp := &Comparison{
		BaseScanID:   baseScanID,
		TargetScanID: targetScanID,
		BaseScore:    ScoreScan(baseAlerts).Score,
		TargetScore:  ScoreScan(targetAlerts).Score,
	}
	cmp.ScoreDelta = cmp.TargetScore - cmp.BaseScore

	for id, f := range targetIndex {
		if _, existed := baseIndex[id]; !existed {
			cmp.NewFindings = append(cmp.NewFindings, f)
		} else {
			cmp.PersistentFindings = append(cmp.PersistentFindings, f)
		}
	}
	for id, f := range baseIndex {
		if _, stillThere := targetIndex[id]; !stillThere {
			cmp.FixedFindings = append(cmp.FixedFindings, f)
		}
	}

	baseEP := make(map[string]Endpoint, len(baseEndpoints))
	for _, e := range baseEndpoints {
		baseEP[endpointIdentity(e)] = e
	}
	targetEP := make(map[string]Endpoint, len(targetEndpoints))
	for _, e := range targetEndpoints {
		targetEP[endpointIdentity(e)] = e
	}
	for id, e := range targetEP {
		if _, existed := baseEP[id]; !existed {
			cmp.NewEndpoints = append(cmp.NewEndpoints, e)
		}
	}
	for id, e := range baseEP {
		if _, stillThere := targetEP[id]; !stillThere {
			cmp.RemovedEndpoints = append(cmp.RemovedEndpoints, e)
		}
	}

	sort.SliceStable(cmp.NewFindings, func(i, j int) bool { return cmp.NewFindings[i].ID < cmp.NewFindings[j].ID })
	sort.SliceStable(cmp.FixedFindings, func(i, j int) bool { return cmp.FixedFindings[i].ID < cmp.FixedFindings[j].ID })
	sort.SliceStable(cmp.PersistentFindings, func(i, j int) bool { return cmp.PersistentFindings[i].ID < cmp.PersistentFindings[j].ID })
	SortEndpoints(cmp.NewEndpoints)
	SortEndpoints(cmp.RemovedEndpoints)

	return cmp
}
