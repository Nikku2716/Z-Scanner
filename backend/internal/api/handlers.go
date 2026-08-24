package api

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/ghost0/BlackHawk/backend/internal/scan"
	"github.com/go-chi/chi/v5"
)

func (s *Server) health(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

type startScanRequest struct {
	Target string           `json:"target"`
	Mode   scan.Mode        `json:"mode"`
	Config *scan.ScanConfig `json:"config,omitempty"`
}

func (s *Server) startScan(w http.ResponseWriter, r *http.Request) {
	var req startScanRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	target := strings.TrimSpace(req.Target)
	if target == "" {
		writeError(w, http.StatusBadRequest, "target URL is required")
		return
	}
	if !strings.HasPrefix(target, "http://") && !strings.HasPrefix(target, "https://") {
		target = "https://" + target
	}

	cfg := scan.DefaultConfig(scan.ModeQuick)
	if req.Mode != "" {
		cfg = scan.DefaultConfig(req.Mode)
	}
	if req.Config != nil {
		cfg = *req.Config
		if cfg.Mode == "" && req.Mode != "" {
			cfg.Mode = req.Mode
		}
	}

	scanResult, err := s.orch.Start(target, cfg)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusCreated, scanResult)
}

func (s *Server) listScans(w http.ResponseWriter, r *http.Request) {
	scans, err := s.orch.List()
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if scans == nil {
		scans = []scan.Scan{}
	}
	writeJSON(w, http.StatusOK, scans)
}

func (s *Server) getStatus(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	scanResult, err := s.orch.Get(id)
	if err != nil {
		writeError(w, http.StatusNotFound, "scan not found")
		return
	}
	writeJSON(w, http.StatusOK, scanResult)
}

func (s *Server) stopScan(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := s.orch.Stop(id); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "stopping"})
}

func (s *Server) deleteScan(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := s.orch.Delete(id); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "deleted"})
}

func (s *Server) getReport(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	scanResult, err := s.orch.Get(id)
	if err != nil {
		writeError(w, http.StatusNotFound, "scan not found")
		return
	}

	scanResult.Alerts = scan.DeduplicateAlerts(scanResult.Alerts)
	scan.SortAlertsByRisk(scanResult.Alerts)

	writeJSON(w, http.StatusOK, scanResult)
}

func (s *Server) getReportHTML(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	scanResult, err := s.orch.Get(id)
	if err != nil {
		writeError(w, http.StatusNotFound, "scan not found")
		return
	}

	html, err := s.reporter.GenerateHTML(scanResult)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(html)
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}
