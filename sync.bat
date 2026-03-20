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
git push

pause