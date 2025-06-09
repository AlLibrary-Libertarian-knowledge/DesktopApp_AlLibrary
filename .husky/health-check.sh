#!/usr/bin/env sh
# Husky Health Check Script
# Run this to validate your Husky configuration

echo "🔍 Husky Configuration Health Check"
echo "=================================="

# Check if Husky is properly installed
if [ ! -d ".husky" ]; then
    echo "❌ .husky directory not found"
    exit 1
else
    echo "✅ Husky directory exists"
fi

# Check if core Husky files exist
if [ ! -f ".husky/_/husky.sh" ]; then
    echo "❌ Husky core files missing"
    exit 1
else
    echo "✅ Husky core files present"
fi

# Check individual hooks
hooks=("pre-commit" "commit-msg" "pre-push" "post-checkout" "post-merge" "post-commit" "prepare-commit-msg")

for hook in "${hooks[@]}"; do
    if [ -f ".husky/$hook" ]; then
        if [ -x ".husky/$hook" ]; then
            echo "✅ $hook - exists and executable"
        else
            echo "⚠️  $hook - exists but not executable (run: chmod +x .husky/$hook)"
        fi
    else
        echo "❌ $hook - missing"
    fi
done

# Check if lint-staged is configured
if grep -q "lint-staged" package.json; then
    echo "✅ lint-staged configuration found"
else
    echo "❌ lint-staged configuration missing"
fi

# Check if required npm scripts exist
required_scripts=("test" "lint" "typecheck" "build")
missing_scripts=""

for script in "${required_scripts[@]}"; do
    if grep -q "\"$script\":" package.json; then
        echo "✅ npm script '$script' found"
    else
        echo "❌ npm script '$script' missing"
        missing_scripts="$missing_scripts $script"
    fi
done

# Check Git hooks are linked
if [ -f ".git/hooks/pre-commit" ]; then
    echo "✅ Git pre-commit hook linked"
else
    echo "⚠️  Git pre-commit hook not linked (run: npx husky)"
fi

# Test if dependencies are installed
if [ -d "node_modules" ]; then
    echo "✅ Node modules installed"
else
    echo "❌ Node modules missing (run: npm install)"
fi

# Summary
echo ""
echo "📋 Health Check Summary"
echo "======================"

if [ -z "$missing_scripts" ]; then
    echo "🎉 All checks passed! Your Husky configuration is healthy."
    echo ""
    echo "💡 Next steps:"
    echo "   - Run 'git add .' and 'git commit' to test the pre-commit hook"
    echo "   - Try making a commit to test commit message validation"
    echo "   - Use conventional commit format: feat: add new feature"
else
    echo "⚠️  Some issues found. Please address the missing components above."
fi

echo ""
echo "🔧 Available npm scripts for development:"
echo "   npm run dev              # Start development server"
echo "   npm run test:watch       # Run tests in watch mode"
echo "   npm run typecheck:watch  # Type checking in watch mode"
echo "   npm run validate         # Run complete validation pipeline"
echo "   npm run clean           # Clean build artifacts" 