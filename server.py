"""Serve the dashboard while reading TP values directly from the CSV with pandas."""

from __future__ import annotations

import argparse
import json
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

from data_loader import CSV_PATH, load_tp_values, metadata, summarize


ROOT = Path(__file__).resolve().parent


class DashboardHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        url = urlsplit(self.path)
        if url.path == "/api/tp-values/meta":
            return self.send_json(metadata(load_tp_values(CSV_PATH)))
        if url.path == "/api/tp-values":
            query = parse_qs(url.query)
            filters = {key: query.get(key, [""])[0] for key in ("province", "district_id", "group")}
            return self.send_json(summarize(load_tp_values(CSV_PATH), **filters))
        return super().do_GET()

    def send_json(self, payload):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def main():
    parser = argparse.ArgumentParser(description="Serve the GSM dashboard with direct pandas CSV loading")
    parser.add_argument("--port", type=int, default=5511)
    args = parser.parse_args()

    with ThreadingHTTPServer(("127.0.0.1", args.port), DashboardHandler) as server:
        print(f"Reading {CSV_PATH} directly with pandas")
        print(f"Open http://127.0.0.1:{args.port}/")
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            print("\nStopping server.")


if __name__ == "__main__":
    main()
