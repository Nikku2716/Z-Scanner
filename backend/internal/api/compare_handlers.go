package api

import (
	"net/http"

	"github.com/ghost0/BlackHawk/backend/internal/scan"
	"github.com/go-chi/chi/v5"
)

// getScanCompare compares two completed scans: /api/compare/{base}/{target}
func (s *Server) getScanCompare(w http.ResponseWriter, r *http.Request) {
	base, target := chi.URLParam(r, "baseId"), chi.URLParam(r, "targetId")

	baseScan, err := s.orch.Get(base)
	if err != nil {
		writeError(w, http.StatusNotFound, "base scan not found")
		return
	}
	targetScan, err := s.orch.Get(target)
	if err != nil {
		writeError(w, http.StatusNotFound, "target scan not found")
		return
	}
	if baseScan.Status != scan.StatusComplete || targetScan.Status != scan.StatusComplete {
		writeError(w, http.StatusBadRequest, "both scans must be complete to compare")
		return
	}

	baseEndpoints, _ := s.orch.Store().ListScanEndpoints(baseScan.ID)
	targetEndpoints, _ := s.orch.Store().ListScanEndpoints(targetScan.ID)

	writeJSON(w, http.StatusOK, scan.Compare(
		baseScan.ID, baseScan.Alerts, baseEndpoints,
		targetScan.ID, targetScan.Alerts, targetEndpoints,
	))
}
