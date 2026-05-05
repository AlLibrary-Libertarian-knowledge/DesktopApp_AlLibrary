# 🏗️ Build Documentation

## Development Build

```bash
yarn dev           # Start development server
yarn tauri:dev     # Start Tauri development mode
```

## Production Build

```bash
yarn build         # Build frontend for production
yarn tauri:build   # Build complete Tauri application with installers
```

## Quality Assurance

```bash
pnpm run lint      # Run Biome check (format + lint) on src and tests
pnpm run lint:fix  # Run Biome check with --write
pnpm run format    # Run Biome format --write
yarn typecheck     # Run TypeScript type checking
yarn test          # Run unit tests with Vitest
```

## Available Build Targets

- **Windows**: MSI and NSIS installers
- **Frontend**: Vite-optimized static files in `dist/`
- **Backend**: Rust binary compiled with Cargo

## Build Configuration

- Frontend dist: `src-tauri/tauri.conf.json`
- Rust dependencies: `src-tauri/Cargo.toml`
- TypeScript config: `tsconfig.json`
- Vite config: `vite.config.ts`

## Build Pipeline Status ✅

All build commands verified and working correctly.
