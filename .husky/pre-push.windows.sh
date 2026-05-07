#!/usr/bin/env sh

# -----------------------------
# AlLibrary Pre-push — Windows (Git Bash): Playwright windows config + pnpm
# -----------------------------

if [ -t 1 ] && command -v tput >/dev/null 2>&1; then
  ncolors=$(tput colors 2>/dev/null || echo 0)
  if [ -n "$ncolors" ] && [ "$ncolors" -ge 8 ]; then
    RED="$(tput setaf 1)"; GREEN="$(tput setaf 2)"; YELLOW="$(tput setaf 3)"; BLUE="$(tput setaf 4)"; CYAN="$(tput setaf 6)"; BOLD="$(tput bold)"; RESET="$(tput sgr0)"
  else
    RED=""; GREEN=""; YELLOW=""; BLUE=""; CYAN=""; BOLD=""; RESET=""
  fi
else
  RED=""; GREEN=""; YELLOW=""; BLUE=""; CYAN=""; BOLD=""; RESET=""
fi

stamp() { date +%H:%M:%S; }
start_ts=$(date +%s)

rm -f .git/prepush.log .git/prepush-*.log 2>/dev/null || true
: > .git/prepush.log

on_error() {
  echo ""
  echo "${RED}✖ Pre-push failed${RESET} at $(stamp)"
  if [ -f .git/prepush.log ]; then
    tail -n 30 .git/prepush.log || true
  fi
  echo "${YELLOW}Recovery:${RESET} ${BOLD}pnpm run quality:ci${RESET}"
  exit 1
}

if (trap '' ERR 2>/dev/null); then
  trap on_error ERR
else
  trap 'exit_code=$?; if [ "$exit_code" -ne 0 ] && [ -z "${_error_handled:-}" ]; then _error_handled=1; on_error; fi; exit "$exit_code"' EXIT
fi

echo "${BOLD}${CYAN}════════════════════════════════════════════════════════════${RESET}"
echo "${BOLD}🚀 Pre-push · Quality checks (Windows)${RESET}  $(stamp)"
echo "${BOLD}${CYAN}════════════════════════════════════════════════════════════${RESET}"

RUN_RESULT=$(node scripts/hooks/changed-files.cjs --format=run 2>/dev/null || echo "1 1 1 1 1 0 0 5")
set -- $RUN_RESULT
RUN_T1_QUALITY=${1:-1}
RUN_T1_COVERAGE=${2:-1}
RUN_T2_AUDIT=${3:-1}
RUN_T3_E2E=${4:-1}
RUN_T3_BUILD=${5:-1}
RUN_T3_BUDGET=${6:-0}
RUN_T3_LH=${7:-0}
SCOPE_NUM=${8:-5}

SCOPE_LABEL=$(case "$SCOPE_NUM" in 1) echo "docs";; 2) echo "tests";; 3) echo "config";; 4) echo "partial";; *) echo "full";; esac)
echo "${BLUE}• Scope:${RESET} $SCOPE_LABEL"

if [ "$SCOPE_NUM" -eq 1 ]; then
  echo "${BLUE}• All tiers skipped (docs only)${RESET}"
  echo "${BOLD}${GREEN}✅ Pre-push passed${RESET} · $(( $(date +%s) - start_ts ))s"
  exit 0
fi

create_temp_file() {
  if command -v mktemp >/dev/null 2>&1; then
    mktemp 2>/dev/null || echo "/tmp/prepush-$$-$(date +%s)"
  else
    echo "/tmp/prepush-$$-$(date +%s)"
  fi
}

run_step() {
  label="$1"; shift
  echo "${BLUE}• Step:${RESET} ${label}"
  ts=$(date +%s)
  temp_log=$(create_temp_file)
  label_safe=$(echo "$label" | tr ' ' '-')
  tier_log=".git/prepush-${label_safe}.log"
  mkdir -p "$(dirname "$temp_log")" 2>/dev/null || true
  if "$@" > "$temp_log" 2>&1; then
    cat "$temp_log" >> .git/prepush.log 2>/dev/null || true
    cat "$temp_log" > "$tier_log" 2>/dev/null || true
    echo "${GREEN}✔ ${label}${RESET} ($(( $(date +%s) - ts ))s)"
    rm -f "$temp_log" 2>/dev/null || true
    return 0
  fi
  cat "$temp_log" >> .git/prepush.log 2>/dev/null || true
  cat "$temp_log" > "$tier_log" 2>/dev/null || true
  echo "${RED}✖ ${label}${RESET}"
  cat "$temp_log" 2>/dev/null || true
  rm -f "$temp_log" 2>/dev/null || true
  return 1
}

if [ "$RUN_T1_QUALITY" -gt 0 ]; then
  echo "${BLUE}• Tier 1:${RESET} quality"
  if ! run_step "Quality (lint, typecheck, unit tests)" pnpm run quality:ci; then
    exit 1
  fi
  if [ "$RUN_T1_COVERAGE" -gt 0 ]; then
    if ! run_step "Unit test coverage" pnpm run test:coverage; then
      exit 1
    fi
  fi
fi

if [ "$RUN_T2_AUDIT" -gt 0 ]; then
  echo "${BLUE}• Tier 2:${RESET} security audit"
  if ! run_step "Security audit" sh -c 'pnpm audit --audit-level=high'; then
    exit 1
  fi
else
  echo "${BLUE}• Tier 2:${RESET} skipped"
fi

if [ "$RUN_T3_E2E" -gt 0 ] || [ "$RUN_T3_BUILD" -gt 0 ]; then
  echo "${BLUE}• Tier 3:${RESET} e2e / build"

  if [ "$RUN_T3_E2E" -gt 0 ]; then
    pnpm exec playwright install chromium || exit 1
    if ! run_step "E2E (Windows profile)" pnpm run test:e2e:windows; then
      exit 1
    fi
  fi

  if [ "$RUN_T3_BUILD" -gt 0 ]; then
    if [ "${HUSKY_TAURI_BUILD:-}" = "1" ]; then
      if ! run_step "Build (Tauri)" pnpm run build; then exit 1; fi
    else
      if ! run_step "Build (Vite frontend)" pnpm run build:frontend; then exit 1; fi
    fi
  fi
else
  echo "${BLUE}• Tier 3:${RESET} skipped"
fi

total_time=$(( $(date +%s) - start_ts ))
echo "${BOLD}${GREEN}✅ Pre-push passed${RESET} · ${total_time}s"

if ! (trap '' ERR 2>/dev/null); then
  trap - EXIT
fi
