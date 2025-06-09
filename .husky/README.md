# Husky Git Hooks Configuration

This directory contains Git hooks managed by Husky to ensure code quality and consistency across the project.

## Available Hooks

### Pre-commit (`pre-commit`)

Runs before each commit to ensure code quality:

- ✅ **Lint-staged**: Formats and lints only staged files
- ✅ **TypeScript type checking**: Ensures no type errors
- ✅ **Tests**: Runs tests for modified files
- ✅ **Security audit**: Basic security vulnerability check

### Commit Message (`commit-msg`)

Validates commit messages to follow conventional commits format:

- ✅ **Format validation**: Enforces conventional commit structure
- ✅ **Helpful error messages**: Shows examples when format is invalid

**Accepted formats:**

- `feat(scope): add new feature`
- `fix(scope): resolve bug`
- `docs: update documentation`
- `style: formatting changes`
- `refactor: code refactoring`
- `test: add or update tests`
- `chore: maintenance tasks`
- `perf: performance improvements`
- `ci: CI/CD changes`
- `build: build system changes`
- `revert: revert previous commit`

### Prepare Commit Message (`prepare-commit-msg`)

Helps create better commit messages:

- ✅ **Auto-completion**: Suggests commit type based on branch name
- ✅ **Ticket integration**: Extracts ticket numbers from branch names
- ✅ **Templates**: Provides helpful commit message templates

### Pre-push (`pre-push`)

Comprehensive checks before pushing to remote:

- ✅ **Branch protection**: Prevents direct pushes to main/master
- ✅ **Full test suite**: Runs complete test suite
- ✅ **Build verification**: Ensures code compiles successfully
- ✅ **Security audit**: Comprehensive security check
- ✅ **TODO/FIXME detection**: Warns about unresolved comments

### Post-checkout (`post-checkout`)

Handles setup after branch switches:

- ✅ **Dependency updates**: Installs dependencies if package files changed
- ✅ **Cache cleanup**: Clears build artifacts when switching branches

### Post-merge (`post-merge`)

Handles updates after merges:

- ✅ **Dependency sync**: Updates dependencies if package files changed
- ✅ **Type checking**: Runs type check if source files changed
- ✅ **Security audit**: Runs audit after dependency updates

### Post-commit (`post-commit`)

Provides helpful information after commits:

- ✅ **Release detection**: Provides guidance for release commits
- ✅ **Bug fix reminders**: Suggests additional steps for fix commits
- ✅ **Next steps**: Shows helpful next actions

## Configuration

### Lint-staged Configuration

Located in `package.json`:

```json
{
  "lint-staged": {
    "*.{js,ts,tsx}": ["eslint --fix", "prettier --write", "vitest related --run"],
    "*.{css,scss,less}": ["prettier --write"],
    "*.{md,json,yml,yaml}": ["prettier --write"],
    "package.json": ["prettier --write", "npm audit --audit-level=moderate"]
  }
}
```

## Useful Scripts

The following npm scripts work well with these hooks:

```bash
# Development
npm run dev              # Start development server
npm run test:watch       # Run tests in watch mode
npm run typecheck:watch  # Run type checking in watch mode

# Validation (runs all checks like pre-push)
npm run validate         # Complete validation pipeline

# Maintenance
npm run clean            # Clean build artifacts
npm run audit:fix        # Fix security vulnerabilities

# Testing
npm run test             # Run test suite
npm run test:coverage    # Run tests with coverage
npm run test:e2e         # Run end-to-end tests
```

## Troubleshooting

### Skip hooks temporarily

```bash
# Skip pre-commit hook
git commit --no-verify -m "your message"

# Skip pre-push hook
git push --no-verify
```

### Disable specific checks

Edit the respective hook file and comment out unwanted checks.

### Performance issues

If hooks are too slow:

1. Reduce test scope in pre-commit
2. Use `--changed` flag for type checking
3. Configure lint-staged to process fewer files

### Common issues

**Hook not executable**:

```bash
chmod +x .husky/pre-commit
```

**Wrong shell on Windows**:
Ensure you're using Git Bash or WSL for shell scripts.

**NPM vs Yarn**:
Update hook scripts to use your preferred package manager.

## Best Practices

1. **Keep hooks fast**: Pre-commit should run in under 30 seconds
2. **Use lint-staged**: Only process staged files for better performance
3. **Fail fast**: Put quickest checks first
4. **Provide clear feedback**: Show progress and helpful error messages
5. **Make them skippable**: Allow developers to skip in emergencies
6. **Document everything**: Keep this README updated

## Contributing

When modifying hooks:

1. Test thoroughly before committing
2. Update this documentation
3. Consider impact on team workflow
4. Use meaningful echo messages with emojis for better UX
