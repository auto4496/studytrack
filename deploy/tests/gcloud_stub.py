"""Stateful gcloud fixture for the offline bootstrap tests."""

import json
import os
from pathlib import Path
import sys

sys.stdout.reconfigure(newline="\n")
root = Path(os.environ["TEST_STATE"])
state_file = root / "state.json"
state = json.loads(state_file.read_text())
args = sys.argv[1:]
mode = os.environ.get("TEST_MODE", "normal")


def flag(name):
    return next(arg.split("=", 1)[1] for arg in args if arg.startswith(name + "="))


def finish(value=None, code=0):
    state_file.write_text(json.dumps(state))
    if value is not None:
        print(value)
    sys.exit(code)


with (root / "calls.jsonl").open("a") as log:
    log.write(json.dumps([
        "--password=<REDACTED>" if arg.startswith("--password=") else arg
        for arg in args
    ]) + "\n")

command = tuple(args[:3])
if args[0] == "--smoke":
    finish(code=1 if mode == "smoke-fail" else 0)
if command == ("config", "get-value", "project"):
    finish("other-project" if mode == "wrong-project" else "studytrack-cpe334")
if command == ("billing", "projects", "describe"):
    finish("False" if mode == "billing-off" else "True")
if tuple(args[:2]) == ("projects", "describe"):
    finish("123456789012")
if tuple(args[:2]) == ("services", "enable"):
    finish()
if command == ("artifacts", "repositories", "describe"):
    finish(code=0 if state.get("repository") else 1)
if command == ("artifacts", "repositories", "create"):
    state["repository"] = True
    finish()
if command == ("artifacts", "repositories", "add-iam-policy-binding"):
    finish()
if command == ("iam", "service-accounts", "describe"):
    finish(code=0 if args[3].split("@")[0] in state["accounts"] else 1)
if command == ("iam", "service-accounts", "create"):
    state["accounts"].append(args[3])
    finish()
if tuple(args[:2]) == ("projects", "add-iam-policy-binding"):
    finish()
if tuple(args[:2]) == ("builds", "submit"):
    finish(code=1 if mode == "build-fail" else 0)
if command == ("artifacts", "docker", "images"):
    if mode == "missing-image":
        finish("")
    image = args[4].rsplit(":", 1)[0]
    finish(image + "@sha256:" + "a" * 64)
if command == ("sql", "instances", "describe"):
    if not state.get("instance"):
        finish(code=1)
    finish(state["instance"])
if command == ("sql", "instances", "create"):
    state["instance"] = "POSTGRES_17,asia-southeast1,ENTERPRISE,db-f1-micro,False"
    finish()
if command == ("sql", "databases", "describe"):
    finish(code=0 if state.get("database") else 1)
if command == ("sql", "databases", "create"):
    state["database"] = True
    finish()
if command == ("sql", "users", "list"):
    finish("\n".join(["postgres"] + list(state["users"])))
if command == ("sql", "users", "create"):
    if mode == "user-fail":
        finish(code=1)
    if args[3] in state["users"]:
        finish(code=1)
    state["users"][args[3]] = flag("--password")
    finish()
if tuple(args[:2]) == ("secrets", "describe"):
    finish(code=0 if args[2] in state["secrets"] else 1)
if tuple(args[:2]) == ("secrets", "create"):
    if args[2] in state["secrets"]:
        finish(code=1)
    state["secrets"][args[2]] = {"1": sys.stdin.read()}
    finish()
if command == ("secrets", "versions", "list"):
    versions = state["secrets"][args[3]]
    finish(max(versions, key=int) if versions else "")
if command == ("secrets", "versions", "access"):
    finish(state["secrets"][flag("--secret")][args[3]])
if tuple(args[:2]) == ("secrets", "add-iam-policy-binding"):
    finish()
if command == ("run", "jobs", "deploy"):
    finish()
if command == ("run", "jobs", "execute"):
    finish(code=1 if mode == "job-fail" else 0)
if tuple(args[:2]) == ("run", "deploy"):
    state["service"] = True
    finish()
if command == ("run", "services", "update-traffic"):
    finish()
if command == ("run", "services", "describe"):
    finish("studytrack-00001-fixture")
finish("Unexpected mock gcloud command", code=2)
