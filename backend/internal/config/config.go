package config

import (
	"os"
	"strconv"
)

type Config struct {
	Port       int
	ZAPHost    string
	ZAPAPIKey  string
	CORSOrigin string
	StorePath  string
}

func Load() Config {
	port, _ := strconv.Atoi(getEnv("PORT", "8081"))
	return Config{
		Port:       port,
		ZAPHost:    getEnv("ZAP_HOST", "http://localhost:8080"),
		ZAPAPIKey:  getEnv("ZAP_API_KEY", "changeme"),
		CORSOrigin: getEnv("CORS_ORIGIN", "http://localhost:5174"),
		StorePath:  getEnv("STORE_PATH", "scans.db"),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
