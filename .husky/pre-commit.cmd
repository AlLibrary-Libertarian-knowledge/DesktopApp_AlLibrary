@echo off
echo Running pre-commit checks...
npx lint-staged
if %errorlevel% neq 0 exit /b %errorlevel%

npm run typecheck
if %errorlevel% neq 0 exit /b %errorlevel%

npm run test -- --run
if %errorlevel% neq 0 exit /b %errorlevel%

npm audit --audit-level=moderate 