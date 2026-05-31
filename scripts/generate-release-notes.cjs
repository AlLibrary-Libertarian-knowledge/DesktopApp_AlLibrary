#!/usr/bin/env node
/**
 * Renders .github/RELEASE_NOTES.template.md for GitHub Releases.
 * Used by CI (release.yml) and locally: node scripts/generate-release-notes.cjs
 */
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const TEMPLATE_PATH = path.join(ROOT, '.github', 'RELEASE_NOTES.template.md');
const ENV_EXAMPLE_PATH = path.join(ROOT, '.env.example');
const ENV_PATH = path.join(ROOT, '.env');
const TAURI_CONF_PATH = path.join(ROOT, 'src-tauri', 'tauri.conf.json');

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const vars = {};
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    vars[key] = value;
  }
  return vars;
}

function resolveVersion() {
  if (process.env.APP_VERSION?.trim()) {
    return process.env.APP_VERSION.trim();
  }
  if (fs.existsSync(TAURI_CONF_PATH)) {
    const conf = JSON.parse(fs.readFileSync(TAURI_CONF_PATH, 'utf8'));
    if (conf.version) return conf.version;
  }
  const vars = { ...parseEnvFile(ENV_EXAMPLE_PATH), ...parseEnvFile(ENV_PATH) };
  return vars.APP_VERSION || '0.0.0';
}

function resolveAppName() {
  const vars = { ...parseEnvFile(ENV_EXAMPLE_PATH), ...parseEnvFile(ENV_PATH) };
  return process.env.VITE_APP_NAME || vars.VITE_APP_NAME || 'AlLibrary';
}

function formatDate() {
  return new Date().toISOString().slice(0, 10);
}

function shortSha() {
  const sha = process.env.GITHUB_SHA || '';
  return sha ? sha.slice(0, 7) : 'local';
}

function resolveRepo() {
  return process.env.GITHUB_REPOSITORY || 'your-org/allibrary';
}

function main() {
  if (!fs.existsSync(TEMPLATE_PATH)) {
    throw new Error(`Missing template: ${TEMPLATE_PATH}`);
  }

  const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');
  const version = resolveVersion();
  const replacements = {
    '{{VERSION}}': version,
    '{{APP_NAME}}': resolveAppName(),
    '{{DATE}}': formatDate(),
    '{{SHA}}': shortSha(),
    '{{REPO}}': resolveRepo(),
    '{{TAG}}': `v${version}`,
  };

  let body = template;
  for (const [token, value] of Object.entries(replacements)) {
    body = body.split(token).join(value);
  }

  process.stdout.write(body);
}

main();
