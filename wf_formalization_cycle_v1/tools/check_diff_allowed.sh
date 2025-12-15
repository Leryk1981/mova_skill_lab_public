#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  wf_formalization_cycle_v1/tools/check_diff_allowed.sh <allowed_prefix> [baseline_untracked_file]

Purpose:
  Guardrail to ensure all diffs stay within a scoped prefix.
  Also fails on new untracked files outside the prefix (unless listed in baseline file).

Examples:
  ./wf_formalization_cycle_v1/tools/check_diff_allowed.sh lab/experiments/MY_EXPERIMENT/
  ./wf_formalization_cycle_v1/tools/check_diff_allowed.sh lab/experiments/MY_EXPERIMENT/ ./baseline_outside_untracked.txt
EOF
}

ALLOWED_PREFIX="${1:-}"
BASELINE_FILE="${2:-}"

if [[ -z "${ALLOWED_PREFIX}" ]]; then
  usage
  exit 2
fi

die() {
  echo "[check_diff_allowed] FAIL: $1"
  exit 1
}

echo "[check_diff_allowed] Allowed prefix: ${ALLOWED_PREFIX}"

changes="$(git diff --name-only)"
if [[ -n "${changes}" ]]; then
  bad=""
  while IFS= read -r p; do
    [[ -z "${p}" ]] && continue
    if [[ "${p}" != ${ALLOWED_PREFIX}* ]]; then
      bad+="${p}"$'\n'
    fi
  done <<< "${changes}"
  [[ -z "${bad}" ]] || die "git diff has paths outside allowed prefix:\n${bad}"
fi

status_lines="$(git status --porcelain)"
outside_untracked=""
while IFS= read -r line; do
  [[ -z "${line}" ]] && continue
  code="${line:0:2}"
  p="${line:3}"
  if [[ "${code}" == "??" ]]; then
    if [[ "${p}" != ${ALLOWED_PREFIX}* ]]; then
      outside_untracked+="${p}"$'\n'
    fi
  fi
done <<< "${status_lines}"

if [[ -n "${outside_untracked}" ]]; then
  if [[ -z "${BASELINE_FILE}" || ! -f "${BASELINE_FILE}" ]]; then
    die "untracked files exist outside allowed prefix and no baseline file provided.\n${outside_untracked}"
  fi

  new_outside=""
  while IFS= read -r p; do
    [[ -z "${p}" ]] && continue
    if ! grep -Fqx "${p}" "${BASELINE_FILE}"; then
      new_outside+="${p}"$'\n'
    fi
  done <<< "${outside_untracked}"

  [[ -z "${new_outside}" ]] || die "new untracked files outside allowed prefix (not in baseline):\n${new_outside}"
fi

echo "[check_diff_allowed] OK"

