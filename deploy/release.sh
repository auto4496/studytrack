#!/usr/bin/env bash
# The workflow supplies a validated main context and short-lived WIF credentials.
set +x
set -euo pipefail
exec python3 deploy/release.py "$@"
