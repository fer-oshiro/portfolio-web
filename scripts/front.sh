#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPOSITORY_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"

bucket="${WEB_DEPLOY_BUCKET:-}"
distribution_id="${CLOUDFRONT_DISTRIBUTION_ID:-}"
aws_profile="${AWS_PROFILE:-}"

usage() {
  cat <<'EOF'
Usage: bash scripts/front.sh --bucket <bucket> --distribution-id <id> [--profile <profile>]

Builds all workspaces, synchronizes the four web artifacts to S3, and then
invalidates the CloudFront distribution.

Options:
  --bucket <bucket>           S3 bucket name (env: WEB_DEPLOY_BUCKET)
  --distribution-id <id>     CloudFront distribution ID
                             (env: CLOUDFRONT_DISTRIBUTION_ID)
  --profile <profile>         AWS CLI profile (env: AWS_PROFILE; optional)
  -h, --help                  Show this help
EOF
}

fail() {
  printf 'Error: %s\n' "$1" >&2
  printf 'Run with --help for usage.\n' >&2
  exit 1
}

require_value() {
  local option="$1"
  local value="${2:-}"

  if [[ -z "${value}" || "${value}" == --* ]]; then
    fail "${option} requires a value"
  fi
}

while (($# > 0)); do
  case "$1" in
    --bucket)
      require_value "$1" "${2:-}"
      bucket="$2"
      shift 2
      ;;
    --distribution-id)
      require_value "$1" "${2:-}"
      distribution_id="$2"
      shift 2
      ;;
    --profile)
      require_value "$1" "${2:-}"
      aws_profile="$2"
      shift 2
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    *)
      fail "unknown option: $1"
      ;;
  esac
done

[[ -n "${bucket}" ]] || fail 'missing S3 bucket (--bucket or WEB_DEPLOY_BUCKET)'
[[ -n "${distribution_id}" ]] || fail 'missing CloudFront distribution ID (--distribution-id or CLOUDFRONT_DISTRIBUTION_ID)'

command -v npm >/dev/null 2>&1 || fail 'npm is required'
command -v aws >/dev/null 2>&1 || fail 'AWS CLI is required'

aws_options=()
if [[ -n "${aws_profile}" ]]; then
  aws_options+=(--profile "${aws_profile}")
fi

npm --prefix "${REPOSITORY_ROOT}" run build

for app in shell home blog resume; do
  artifact_dir="${REPOSITORY_ROOT}/apps/web/${app}/dist"

  [[ -d "${artifact_dir}" ]] || fail "build artifact not found: ${artifact_dir}"

  aws "${aws_options[@]}" s3 sync \
    "${artifact_dir}/" \
    "s3://${bucket}/${app}/" \
    --exclude 'index.html' \
    --exclude 'remoteEntry.js' \
    --cache-control 'public, max-age=31536000, immutable'

  for entry_file in index.html remoteEntry.js; do
    [[ -f "${artifact_dir}/${entry_file}" ]] || continue

    aws "${aws_options[@]}" s3 cp \
      "${artifact_dir}/${entry_file}" \
      "s3://${bucket}/${app}/${entry_file}" \
      --cache-control 'no-cache'
  done

  aws "${aws_options[@]}" s3 sync \
    "${artifact_dir}/" \
    "s3://${bucket}/${app}/" \
    --delete \
    --exclude 'index.html' \
    --exclude 'remoteEntry.js' \
    --cache-control 'public, max-age=31536000, immutable'
done

aws "${aws_options[@]}" cloudfront create-invalidation \
  --distribution-id "${distribution_id}" \
  --paths '/*' '/' \
  --no-cli-pager
