package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/ghost0/BlackHawk/backend/internal/api"
	"github.com/ghost0/BlackHawk/backend/internal/config"
	"github.com/ghost0/BlackHawk/backend/internal/report"
	"github.com/ghost0/BlackHawk/backend/internal/scan"
	"github.com/ghost0/BlackHawk/backend/internal/zapclient"
)

func main() {
	cfg := config.Load()

	zap := zapclient.New(cfg.ZAPHost, cfg.ZAPAPIKey)
	log.Printf("Waiting for ZAP at %s...", cfg.ZAPHost)
	if err := zap.WaitForReady(60); err != nil {
		log.Printf("Warning: ZAP not ready yet: %v (scans will retry)", err)
	}

	store, err := scan.NewStore(cfg.StorePath)
	if err != nil {
		log.Fatalf("store: %v", err)
	}
	defer store.Close()

	orch := scan.NewOrchestrator(zap, store)
	reporter := report.New()
	handler := api.NewHandler(orch, reporter, cfg.CORSOrigin)

	addr := fmt.Sprintf(":%d", cfg.Port)
	log.Printf("BlackHawk backend listening on %s", addr)
	if err := http.ListenAndServe(addr, handler); err != nil {
		log.Fatal(err)
	}
}
