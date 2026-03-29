"""
Cloud Run requires a container to listen on PORT.
This entrypoint starts a minimal HTTP health server on that port,
then runs the ARQ worker in a subprocess.
"""
import os
import subprocess
import sys
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer


class HealthHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b"ok")

    def log_message(self, format, *args):
        pass  # suppress access logs


def run_health_server():
    port = int(os.environ.get("PORT", "8080"))
    server = HTTPServer(("0.0.0.0", port), HealthHandler)
    server.serve_forever()


if __name__ == "__main__":
    t = threading.Thread(target=run_health_server, daemon=True)
    t.start()

    result = subprocess.run(
        [sys.executable, "-m", "arq", "src.workers.document_worker.WorkerSettings"]
    )
    sys.exit(result.returncode)
