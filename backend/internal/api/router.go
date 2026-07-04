package api

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/ghost0/BlackHawk/backend/internal/report"
	"github.com/ghost0/BlackHawk/backend/internal/scan"
)

type Server struct {
	orch     *scan.Orchestrator
	reporter *report.Generator
	hub      *Hub
}

func NewHandler(orch *scan.Orchestrator, reporter *report.Generator, origin string) http.Handler {
	s := &Server{
		orch:     orch,
		reporter: reporter,
		hub:      NewHub(),
	}
	go s.hub.Run()

	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	r.Get("/health", s.health)

	r.Route("/api", func(r chi.Router) {
		r.Get("/scans", s.listScans)
		r.Post("/scan", s.startScan)
		r.Get("/status/{id}", s.getStatus)
		r.Post("/stop/{id}", s.stopScan)
		r.Delete("/scan/{id}", s.deleteScan)
		r.Get("/report/{id}", s.getReport)
		r.Get("/report/{id}/html", s.getReportHTML)
		r.Get("/ws/{id}", s.scanWebSocket)
	})

	return cors.Handler(cors.Options{
		AllowedOrigins:   []string{origin, "http://localhost:5173", "http://127.0.0.1:5173"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: true,
		MaxAge:           300,
	})(r)
}
