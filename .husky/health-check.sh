#!/usr/bin/env sh
# Husky health check — POSIX sh (Git Bash / Linux / macOS)

echo "🔍 Husky configuration health check"
echo "====================================="

if [ ! -d ".husky" ]; then
  echo "❌ .husky directory not found"
  exit 1
fi
echo "✅ .husky directory exists"

if ! grep -q '"husky"' package.json 2>/dev/null; then
  echo "⚠️  husky not listed in package.json devDependencies"
else
  echo "✅ husky in package.json"
fi

for hook in pre-commit commit-msg pre-push post-checkout post-merge post-commit prepare-commit-msg; do
  if [ -f ".husky/$hook" ]; then
    if [ -x ".husky/$hook" ]; then
      echo "✅ $hook — executable"
    else
      echo "⚠️  $hook — present but not executable (chmod +x .husky/$hook)"
    fi
  else
    echo "❌ $hook — missing"
  fi
done

for helper in scripts/hooks/secret-scan.cjs scripts/hooks/changed-files.cjs; do
  if [ -f "$helper" ]; then
    echo "✅ $helper"
  else
    echo "❌ $helper — missing"
  fi
done

if grep -q "lint-staged" package.json 2>/dev/null; then
  echo "✅ lint-staged configured in package.json"
else
  echo "❌ lint-staged missing"
fi

if command -v pnpm >/dev/null 2>&1; then
  echo "✅ pnpm available"
else
  echo "⚠️  pnpm not in PATH (hooks expect pnpm)"
fi

echo ""
echo "Try: pnpm run husky:analyze:changes · pnpm run quality:ci"
