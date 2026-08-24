#!/usr/bin/env python3
"""Mock ZAP daemon for BlackHawk end-to-end smoke testing.

Implements just enough of the ZAP JSON API to drive a complete scan cycle:
version, session, accessUrl, spider, passive queue, active scan, alerts,
site tree, and spider URLs.
"""
import json
import threading
import time
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse, parse_qs

ALERTS = [
    {
        "pluginId": "40012", "name": "Cross Site Scripting (Reflected)", "risk": "High",
        "confidence": "Confirmed", "url": "http://testphp.vulnweb.com/search.php?test=query",
        "method": "GET", "param": "test", "attack": "<script>alert(1)</script>",
        "evidence": "<script>alert(1)</script>",
        "description": "User input is echoed unencoded.",
        "solution": "Encode user-supplied output.", "reference": "https://owasp.org/www-community/attacks/xss/",
        "cweid": "79", "wascid": "8",
    },
    {
        "pluginId": "40012", "name": "Cross Site Scripting (Reflected)", "risk": "High",
        "confidence": "Confirmed", "url": "http://testphp.vulnweb.com/search.php?test=query",
        "method": "GET", "param": "test",  # exact duplicate of the first
        "attack": "<script>alert(1)</script>", "evidence": "<script>alert(1)</script>",
        "description": "User input is echoed unencoded.", "solution": "Encode user-supplied output.",
    },
    {
        "pluginId": "10038", "name": "Content Security Policy Header Not Set", "risk": "Medium",
        "confidence": "Firm", "url": "http://testphp.vulnweb.com/", "method": "GET", "param": "",
        "description": "No CSP header.", "solution": "Set a CSP header.", "cweid": "693",
    },
]

SITES = [
    {"name": "http://testphp.vulnweb.com", "url": "", "method": "", "statusCode": "", "contentType": ""},
    {"name": "GET:search.php", "url": "http://testphp.vulnweb.com/search.php?test=query", "method": "GET", "statusCode": "200", "contentType": "text/html"},
    {"name": "GET:listproducts.php", "url": "http://testphp.vulnweb.com/listproducts.php", "method": "GET", "statusCode": "200", "contentType": "text/html"},
]
ALL_URLS = ["http://testphp.vulnweb.com/search.php", "http://testphp.vulnweb.com/listproducts.php"]

def dynamic_alerts(base):
    """Alerts whose URLs match the scanned target so host filtering keeps them."""
    if not base:
        return ALERTS
    return [
        dict(a, url=a["url"].replace("http://testphp.vulnweb.com", base.rstrip("/")))
        for a in ALERTS
    ]


state = {"spider": 0, "active": 0}


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def send_json(self, obj):
        body = json.dumps(obj).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        u = urlparse(self.path)
        p, q = u.path, parse_qs(u.query)
        # Bump fake progress on each status poll.
        if p == "/JSON/spider/view/status/":
            state["spider"] = min(100, state["spider"] + 50)
            return self.send_json({"status": str(state["spider"])})
        if p == "/JSON/ascan/view/status/":
            state["active"] = min(100, state["active"] + 34)
            return self.send_json({"status": str(state["active"])})
        if p == "/JSON/core/view/alerts/":
            base = q.get("baseurl", [""])[0]
            return self.send_json({"alerts": dynamic_alerts(base)})
        if p == "/JSON/core/view/sites/":
            return self.send_json({"sites": SITES})
        if p == "/JSON/spider/view/allUrls/":
            base = q.get("baseurl", [""])[0]
            urls = [u.replace("http://testphp.vulnweb.com", base.rstrip("/")) for u in ALL_URLS] if base else ALL_URLS
            return self.send_json({"allUrls": urls})
        if p in ("/JSON/core/view/version/", "/JSON/core/view/passivescannerrecordsToScan/"):
            return self.send_json({"version": "2.14.0"} if "version" in p else {"recordsToScan": "0"})
        if p.startswith("/JSON/spider/action/") or p.startswith("/JSON/ascan/action/") \
                or p.startswith("/JSON/core/action/"):
            if "newSession" in p:
                state["spider"] = state["active"] = 0
            out = {"scan": "1"} if "scan" in p else {}
            if "accessUrl" in p:
                out = {"resp": "<html></html>"}
            return self.send_json(out or {"Ok": True})
        self.send_json({})


if __name__ == "__main__":
    HTTPServer(("127.0.0.1", 8099), Handler).serve_forever()
