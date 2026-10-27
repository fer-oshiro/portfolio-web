#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPOSITORY_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"
BACKEND_DIR="${REPOSITORY_ROOT}/apps/backend"
ALL_FUNCTIONS=(authorizer signaling chat drawing cost-guard)

project_name="${LAMBDA_PROJECT_NAME:-portfolio}"
aws_region="${AWS_REGION:-us-east-1}"
aws_profile="${AWS_PROFILE:-}"
functions=()

usage() {
  cat <<'EOF'
Usage: bash scripts/back.sh [options] [function...]

Builds the backend bundles and updates only the code of the Lambda functions.
Without functions, all of them are deployed. Configuration changes (env vars,
memory, timeout, permissions) still require Terraform.

Functions:
  authorizer, signaling, chat, drawing, cost-guard

Options:
  --project-name <name>       Terraform project_name prefix
                              (env: LAMBDA_PROJECT_NAME; default: portfolio)
  --region <region>           AWS region (env: AWS_REGION; default: us-east-1)
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

function_name() {
  case "$1" in
    authorizer) printf '%s-ws-authorizer' "${project_name}" ;;
    signaling) printf '%s-ws-handler' "${project_name}" ;;
    chat) printf '%s-chat-handler' "${project_name}" ;;
    drawing) printf '%s-draw-handler' "${project_name}" ;;
    cost-guard) printf '%s-twilio-cost-guard' "${project_name}" ;;
    *) return 1 ;;
  esac
}

while (($# > 0)); do
  case "$1" in
    --project-name)
      require_value "$1" "${2:-}"
      project_name="$2"
      shift 2
      ;;
    --region)
      require_value "$1" "${2:-}"
      aws_region="$2"
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
    --*)
      fail "unknown option: $1"
      ;;
    *)
      function_name "$1" >/dev/null || fail "unknown function: $1"
      functions+=("$1")
      shift
      ;;
  esac
done

command -v npm >/dev/null 2>&1 || fail 'npm is required'
command -v aws >/dev/null 2>&1 || fail 'AWS CLI is required'

aws_options=(--region "${aws_region}")
if [[ -n "${aws_profile}" ]]; then
  aws_options+=(--profile "${aws_profile}")
fi

if ((${#functions[@]} == 0)); then
  functions=("${ALL_FUNCTIONS[@]}")
  npm --prefix "${BACKEND_DIR}" run build
else
  for fn in "${functions[@]}"; do
    npm --prefix "${BACKEND_DIR}" run "build:${fn}"
  done
fi

for fn in "${functions[@]}"; do
  name="$(function_name "${fn}")"
  zip_path="${BACKEND_DIR}/dist/aws/${fn}.zip"

  [[ -f "${zip_path}" ]] || fail "build artifact not found: ${zip_path}"

  printf 'Updating %s from %s\n' "${name}" "${zip_path}"

  aws "${aws_options[@]}" lambda update-function-code \
    --function-name "${name}" \
    --zip-file "fileb://${zip_path}" \
    --query '{FunctionName: FunctionName, CodeSha256: CodeSha256}' \
    --output text \
    --no-cli-pager

  aws "${aws_options[@]}" lambda wait function-updated-v2 \
    --function-name "${name}"
done
