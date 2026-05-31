#!/usr/bin/env node
/**
 * Propagates APP_VERSION from .env to package.json, Cargo.toml, and tauri.conf.json.
 * Run automatically before dev/build (see package.json scripts).
 */
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const ENV_PATH = path.join(ROOT, '.env');
const ENV_EXAMPLE_PATH = path.join(ROOT, '.env.example');

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }
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

function ensureEnvFile() {
  if (fs.existsSync(ENV_PATH)) {
    return;
  }
  if (!fs.existsSync(ENV_EXAMPLE_PATH)) {
    throw new Error('Missing .env and .env.example — cannot resolve APP_VERSION.');
  }
  fs.copyFileSync(ENV_EXAMPLE_PATH, ENV_PATH);
  console.log('[sync-app-version] Created .env from .env.example');
}

function resolveAppVersion() {
  if (process.env.APP_VERSION) {
    return process.env.APP_VERSION.trim();
  }
  ensureEnvFile();
  const vars = {
    ...parseEnvFile(ENV_EXAMPLE_PATH),
    ...parseEnvFile(ENV_PATH),
  };
  const version = vars.APP_VERSION?.trim();
  if (!version) {
    throw new Error('APP_VERSION is not set in .env (see .env.example).');
  }
  if (!/^\d+\.\d+\.\d+(-[\w.-]+)?(\+[\w.-]+)?$/.test(version)) {
    throw new Error(`APP_VERSION "${version}" is not a valid semver string.`);
  }
  return version;
}

function updatePackageJson(version) {
  const filePath = path.join(ROOT, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (pkg.version === version) {
    return false;
  }
  pkg.version = version;
  fs.writeFileSync(filePath, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8');
  return true;
}

function updateCargoToml(version) {
  const filePath = path.join(ROOT, 'src-tauri', 'Cargo.toml');
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  let inPackage = false;
  let changed = false;
  const next = lines.map(line => {
    if (line.trim() === '[package]') {
      inPackage = true;
      return line;
    }
    if (line.startsWith('[') && line.trim() !== '[package]') {
      inPackage = false;
    }
    if (inPackage && line.startsWith('version = ')) {
      const updated = `version = "${version}"`;
      if (line !== updated) {
        changed = true;
      }
      return updated;
    }
    return line;
  });
  if (changed) {
    fs.writeFileSync(filePath, `${next.join('\n')}\n`, 'utf8');
  }
  return changed;
}

function updateTauriConf(version) {
  const filePath = path.join(ROOT, 'src-tauri', 'tauri.conf.json');
  const conf = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (conf.version === version) {
    return false;
  }
  conf.version = version;
  fs.writeFileSync(filePath, `${JSON.stringify(conf, null, 2)}\n`, 'utf8');
  return true;
}

function main() {
  const version = resolveAppVersion();
  const updates = [];
  if (updatePackageJson(version)) updates.push('package.json');
  if (updateCargoToml(version)) updates.push('src-tauri/Cargo.toml');
  if (updateTauriConf(version)) updates.push('src-tauri/tauri.conf.json');

  if (updates.length === 0) {
    console.log(`[sync-app-version] APP_VERSION=${version} (already synced)`);
    return;
  }
  console.log(`[sync-app-version] APP_VERSION=${version} → ${updates.join(', ')}`);
}

main();
