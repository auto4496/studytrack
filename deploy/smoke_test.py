"""Check the public StudyTrack UI and database-backed API after deployment."""

import json
import sys
import time
import urllib.request


def read(url):
    with urllib.request.urlopen(url, timeout=10) as response:
        return response.read()


def healthy(body):
    payload = json.loads(body)
    data = payload.get("data") if isinstance(payload, dict) else None
    return (
        isinstance(data, dict)
        and data.get("status") == "ok"
        and data.get("service") == "StudyTrack API"
    )


def check(base):
    base = base.rstrip("/")
    checks = (
        ("/api/health", healthy),
        ("/", lambda body: b"StudyTrack" in body and b'id="root"' in body),
    )
    for path, valid in checks:
        for attempt in range(5):
            try:
                if not valid(read(base + path)):
                    raise ValueError("Unexpected response")
                break
            except (OSError, ValueError):
                if attempt == 4:
                    raise RuntimeError(f"Smoke check failed for {path}") from None
                time.sleep(3)
        print(f"PASS {path}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit("Usage: python3 deploy/smoke_test.py SERVICE_URL")
    try:
        check(sys.argv[1])
    except RuntimeError as error:
        sys.exit(str(error))
