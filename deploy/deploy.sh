#!/usr/bin/env bash
# Run from the repository root. Preview with DRY_RUN=1 before the first deployment.
set +x
set -euo pipefail

DRY_RUN="${DRY_RUN:-0}"
PROJECT_ID="${PROJECT_ID:?Set PROJECT_ID to the reviewed Google Cloud project.}"
REGION="${REGION:-asia-southeast1}"
SQL_TIER="${SQL_TIER:-db-f1-micro}"
[[ $# -eq 0 ]] || { echo 'Usage: DRY_RUN=1 PROJECT_ID=... REGION=... bash deploy/deploy.sh' >&2; exit 1; }
[[ "$DRY_RUN" == 0 || "$DRY_RUN" == 1 ]] || { echo 'DRY_RUN must be 0 or 1.' >&2; exit 1; }
[[ "$PROJECT_ID" =~ ^[a-z][a-z0-9-]{4,28}[a-z0-9]$ ]] || { echo 'Invalid project ID.' >&2; exit 1; }
[[ "$REGION" =~ ^[a-z]+-[a-z]+[0-9]+$ && "$SQL_TIER" =~ ^db-[a-z0-9-]+$ ]] || { echo 'Invalid region or SQL tier.' >&2; exit 1; }
[[ -f Dockerfile && -f deploy/cloudbuild.yaml && -f .dockerignore ]] || { echo 'Run from the StudyTrack repository root.' >&2; exit 1; }

SOURCE_SHA="$(git rev-parse HEAD)"
[[ "$SOURCE_SHA" =~ ^[0-9a-f]{40}$ ]] || { echo 'A full Git revision is required.' >&2; exit 1; }

run_cmd() {
  local arg
  if [[ "$DRY_RUN" == 1 ]]; then printf '[DRY_RUN] '; else printf '+ '; fi
  for arg in "$@"; do
    case "$arg" in
      --password=*) printf '%s ' '--password=<REDACTED>' ;;
      *) printf '%q ' "$arg" ;;
    esac
  done
  printf '\n'
  if [[ "$DRY_RUN" == 0 ]]; then "$@"; fi
}

# Validate the release and billing before the first cloud mutation.
if [[ "$DRY_RUN" == 0 ]]; then
  [[ "$(git branch --show-current)" == main && -z "$(git status --porcelain)" ]] || {
    echo 'Real deployment requires a clean main checkout.' >&2; exit 1;
  }
  remote_sha="$(git ls-remote origin refs/heads/main)"
  [[ "${remote_sha%%[[:space:]]*}" == "$SOURCE_SHA" ]] || { echo 'Update main to the latest reviewed release.' >&2; exit 1; }
  [[ "$(gcloud config get-value project 2>/dev/null)" == "$PROJECT_ID" ]] || { echo 'Cloud Shell project differs from PROJECT_ID.' >&2; exit 1; }
  billing="$(gcloud billing projects describe "$PROJECT_ID" --format='value(billingEnabled)')"
  [[ "${billing,,}" == true ]] || { echo 'Project billing must be active.' >&2; exit 1; }
  project_number="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"
else
  project_number=000000000000
fi
[[ "$project_number" =~ ^[0-9]{6,}$ ]] || { echo 'Could not resolve the project number.' >&2; exit 1; }

registry="$REGION-docker.pkg.dev/$PROJECT_ID/studytrack"
sql_connection="$PROJECT_ID:$REGION:studytrack-pg"
origin="https://studytrack-$project_number.$REGION.run.app"
runtime_sa="studytrack-runner@$PROJECT_ID.iam.gserviceaccount.com"
migration_sa="studytrack-migrator@$PROJECT_ID.iam.gserviceaccount.com"
build_sa="studytrack-builder@$PROJECT_ID.iam.gserviceaccount.com"
db_secret=studytrack-database-url
manager_secret=studytrack-manager-password
participant_secret=studytrack-participant-password

printf 'StudyTrack first deployment\nProject %s\nRegion %s\nCommit %s\nSQL Enterprise POSTGRES_17 / %s / zonal / 10 GB SSD / fixed storage\n' "$PROJECT_ID" "$REGION" "$SOURCE_SHA" "$SQL_TIER"
if [[ "$DRY_RUN" == 1 ]]; then echo 'Preview uses a simulated project number and secret versions.'; fi

run_cmd gcloud services enable run.googleapis.com sqladmin.googleapis.com artifactregistry.googleapis.com \
  cloudbuild.googleapis.com secretmanager.googleapis.com iam.googleapis.com cloudresourcemanager.googleapis.com --project="$PROJECT_ID"

if [[ "$DRY_RUN" == 1 ]] || ! gcloud artifacts repositories describe studytrack --location="$REGION" --project="$PROJECT_ID" >/dev/null 2>&1; then
  run_cmd gcloud artifacts repositories create studytrack --repository-format=docker --location="$REGION" --project="$PROJECT_ID"
fi
for account in studytrack-runner studytrack-migrator studytrack-builder; do
  if [[ "$DRY_RUN" == 1 ]] || ! gcloud iam service-accounts describe "$account@$PROJECT_ID.iam.gserviceaccount.com" --project="$PROJECT_ID" >/dev/null 2>&1; then
    run_cmd gcloud iam service-accounts create "$account" --project="$PROJECT_ID"
  fi
done
for account in "$runtime_sa" "$migration_sa"; do
  run_cmd gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:$account" --role=roles/cloudsql.client --condition=None --quiet
done
run_cmd gcloud artifacts repositories add-iam-policy-binding studytrack --location="$REGION" --project="$PROJECT_ID" \
  --member="serviceAccount:$build_sa" --role=roles/artifactregistry.writer --quiet
for role in roles/logging.logWriter roles/storage.objectViewer; do
  run_cmd gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:$build_sa" --role="$role" --condition=None --quiet
done

# Build first so a build failure does not create a new billable database.
run_cmd gcloud builds submit . --config=deploy/cloudbuild.yaml --ignore-file=.dockerignore \
  --substitutions="_REGISTRY=$registry,_VCS_REF=$SOURCE_SHA" \
  --service-account="projects/$PROJECT_ID/serviceAccounts/$build_sa" --region="$REGION" --project="$PROJECT_ID"
if [[ "$DRY_RUN" == 0 ]]; then
  runtime_image="$(gcloud artifacts docker images describe "$registry/studytrack:$SOURCE_SHA" --project="$PROJECT_ID" --format='value(image_summary.fully_qualified_digest)')"
  tools_image="$(gcloud artifacts docker images describe "$registry/studytrack-tools:$SOURCE_SHA" --project="$PROJECT_ID" --format='value(image_summary.fully_qualified_digest)')"
  [[ "${runtime_image%:*}" == "$registry/studytrack@sha256" && "${runtime_image##*:}" =~ ^[0-9a-f]{64}$ &&
     "${tools_image%:*}" == "$registry/studytrack-tools@sha256" && "${tools_image##*:}" =~ ^[0-9a-f]{64}$ ]] || {
    echo 'Both built image digests are required.' >&2; exit 1;
  }
else
  runtime_image="$registry/studytrack@sha256:SIMULATED_RUNTIME_DIGEST"
  tools_image="$registry/studytrack-tools@sha256:SIMULATED_TOOLS_DIGEST"
fi

if [[ "$DRY_RUN" == 1 ]] || ! gcloud sql instances describe studytrack-pg --project="$PROJECT_ID" >/dev/null 2>&1; then
  run_cmd gcloud sql instances create studytrack-pg --database-version=POSTGRES_17 --edition=enterprise \
    --tier="$SQL_TIER" --availability-type=zonal --region="$REGION" --storage-size=10GB --storage-type=SSD \
    --no-storage-auto-increase --backup-start-time=03:00 --project="$PROJECT_ID"
fi
if [[ "$DRY_RUN" == 0 ]]; then
  settings="$(gcloud sql instances describe studytrack-pg --project="$PROJECT_ID" --format='csv[no-heading](databaseVersion,region,settings.edition,settings.tier,settings.storageAutoResize)')"
  [[ "${settings,,}" == "postgres_17,$REGION,enterprise,$SQL_TIER,false" ]] || {
    echo 'Existing SQL engine, region, edition, tier or storage auto-increase differs from the reviewed plan.' >&2; exit 1;
  }
fi
if [[ "$DRY_RUN" == 1 ]] || ! gcloud sql databases describe studytrack --instance=studytrack-pg --project="$PROJECT_ID" >/dev/null 2>&1; then
  run_cmd gcloud sql databases create studytrack --instance=studytrack-pg --project="$PROJECT_ID"
fi

user_exists=false
if [[ "$DRY_RUN" == 0 ]]; then
  users="$(gcloud sql users list --instance=studytrack-pg --project="$PROJECT_ID" --format='value(name)')"
  if grep -qx studytrack <<< "$users"; then user_exists=true; fi
fi

# Only the successful secret creator writes its initial value. Concurrent callers
# stop on create failure. Empty metadata from an interrupted create needs recovery.
ensure_secret() {
  local name="$1" kind="$2" payload version
  if [[ "$DRY_RUN" == 1 ]]; then
    run_cmd gcloud secrets create "$name" --replication-policy=automatic --data-file=- --project="$PROJECT_ID"
    SECRET_VERSION=1
    return
  fi
  if ! gcloud secrets describe "$name" --project="$PROJECT_ID" >/dev/null 2>&1; then
    if [[ "$kind" == database && "$user_exists" == true ]]; then
      echo 'Existing DB user has no saved database secret. Review credential recovery before continuing.' >&2; exit 1
    fi
    payload="$(openssl rand -hex 24)"
    if [[ "$kind" == database ]]; then
      payload="postgresql://studytrack:$payload@localhost/studytrack?host=/cloudsql/$sql_connection&schema=public&connection_limit=3"
    fi
    printf '%s' "$payload" | run_cmd gcloud secrets create "$name" --replication-policy=automatic --data-file=- --project="$PROJECT_ID"
  fi
  version="$(gcloud secrets versions list "$name" --filter='state=ENABLED' --sort-by='~createTime' --limit=1 --format='value(name)' --project="$PROJECT_ID")"
  SECRET_VERSION="${version##*/}"
  [[ "$SECRET_VERSION" =~ ^[1-9][0-9]*$ ]] || {
    echo "Secret $name has no enabled version. Review interrupted secret creation before continuing." >&2; exit 1;
  }
}
ensure_secret "$db_secret" database
db_version="$SECRET_VERSION"
if [[ "$DRY_RUN" == 0 ]]; then
  db_url="$(gcloud secrets versions access "$db_version" --secret="$db_secret" --project="$PROJECT_ID")"
  password="${db_url#postgresql://studytrack:}"
  password="${password%%@*}"
  [[ "$password" =~ ^[0-9a-f]{48}$ && "$db_url" == "postgresql://studytrack:$password@localhost/studytrack?host=/cloudsql/$sql_connection&schema=public&connection_limit=3" ]] || {
    echo 'Saved database secret differs from the reviewed project/database connection.' >&2; exit 1;
  }
else
  password=SIMULATED_PASSWORD
fi
if [[ "$user_exists" == false ]]; then
  run_cmd gcloud sql users create studytrack --instance=studytrack-pg --password="$password" --project="$PROJECT_ID"
fi
unset password db_url
ensure_secret "$manager_secret" password
manager_version="$SECRET_VERSION"
ensure_secret "$participant_secret" password
participant_version="$SECRET_VERSION"

for account in "$runtime_sa" "$migration_sa"; do
  run_cmd gcloud secrets add-iam-policy-binding "$db_secret" --member="serviceAccount:$account" --role=roles/secretmanager.secretAccessor --project="$PROJECT_ID" --quiet
done
for secret in "$manager_secret" "$participant_secret"; do
  run_cmd gcloud secrets add-iam-policy-binding "$secret" --member="serviceAccount:$migration_sa" --role=roles/secretmanager.secretAccessor --project="$PROJECT_ID" --quiet
done

run_cmd gcloud run jobs deploy studytrack-migrate --image="$tools_image" --region="$REGION" --project="$PROJECT_ID" \
  --service-account="$migration_sa" --set-cloudsql-instances="$sql_connection" \
  --set-secrets="DATABASE_URL=$db_secret:$db_version,SEED_MANAGER_PASSWORD=$manager_secret:$manager_version,SEED_PARTICIPANT_PASSWORD=$participant_secret:$participant_version" \
  --set-env-vars=NODE_ENV=production --command=sh '--args=-c,npm run db:migrate && npm run db:seed' \
  --tasks=1 --parallelism=1 --max-retries=0 --task-timeout=300s --memory=512Mi --cpu=1 --quiet
if ! run_cmd gcloud run jobs execute studytrack-migrate --region="$REGION" --project="$PROJECT_ID" --wait; then
  echo 'Migration/seed job failed. Inspect its execution logs before retrying.' >&2
  exit 1
fi
run_cmd gcloud run deploy studytrack --image="$runtime_image" --region="$REGION" --project="$PROJECT_ID" \
  --service-account="$runtime_sa" --set-cloudsql-instances="$sql_connection" \
  --set-secrets="DATABASE_URL=$db_secret:$db_version" --set-env-vars="NODE_ENV=production,APP_ORIGIN=$origin,TZ=Asia/Bangkok" \
  --execution-environment=gen2 --port=8080 --min-instances=0 --max-instances=3 --memory=512Mi --cpu=1 --allow-unauthenticated --quiet
run_cmd gcloud run services update-traffic studytrack --to-latest --region="$REGION" --project="$PROJECT_ID" --quiet
run_cmd python3 deploy/smoke_test.py "$origin"
if [[ "$DRY_RUN" == 1 ]]; then
  echo 'Dry-run plan complete. Review before running with DRY_RUN=0 from accepted main.'
else
  revision="$(gcloud run services describe studytrack --region="$REGION" --project="$PROJECT_ID" --format='value(status.latestReadyRevisionName)')"
  printf 'Deployment complete\nCommit %s\nRuntime image %s\nTools image %s\nRevision %s\nURL %s\n' "$SOURCE_SHA" "$runtime_image" "$tools_image" "$revision" "$origin"
  echo 'Seed accounts: manager@studytrack.test, student1@studytrack.test, student2@studytrack.test. Retrieve their respective passwords privately from Secret Manager.'
fi
