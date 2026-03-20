@echo off
cd /d %~dp0

git add .

git diff --cached --quiet
if %errorlevel%==0 (
    echo No staged changes to commit
    pause
    exit /b
)

git commit -m "update"
if errorlevel 1 (
    echo Commit failed
    pause
    exit /b
)

git pull --rebase origin main
if errorlevel 1 (
    echo Pull rebase failed
    pause
    exit /b
)

git push origin main
if errorlevel 1 (
    echo Push failed
    pause
    exit /b
)

echo Sync completed successfully
pause