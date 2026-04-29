@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM ===== Legacy frozen H5 sync script =====
REM 默认不要把响应式主站的新功能同步到独立 H5。
REM 仅在修复 H5 阻断问题时才使用本脚本处理历史仓库。

REM ===== H5 仓库目录 =====
set "REPO_DIR=E:\Codex\frontend-h5"

echo.
echo =====================================
echo     AIRS-H5 安全同步工具
echo  提交本地 -> 拉取远端 -> 推送 GitHub
echo =====================================
echo.

REM ===== 检查目录 =====
if not exist "%REPO_DIR%" (
    echo [错误] 目录不存在：
    echo %REPO_DIR%
    echo.
    pause
    exit /b 1
)

cd /d "%REPO_DIR%"
if errorlevel 1 (
    echo [错误] 无法进入目录：
    echo %REPO_DIR%
    echo.
    pause
    exit /b 1
)

echo [信息] 当前目录：%CD%
echo.

REM ===== 检查 Git 仓库 =====
git rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 (
    echo [错误] 当前目录不是 Git 仓库。
    echo.
    pause
    exit /b 1
)

REM ===== 检查 origin =====
for /f "delims=" %%i in ('git remote get-url origin 2^>nul') do set "REMOTE_URL=%%i"
if "%REMOTE_URL%"=="" (
    echo [错误] 当前仓库没有配置 origin 远程仓库。
    echo 你应连接到：
    echo https://github.com/Will-Hooper/AIRS-H5.git
    echo.
    pause
    exit /b 1
)

echo [信息] 远程仓库：%REMOTE_URL%
echo.

REM ===== 获取当前分支 =====
for /f %%i in ('git branch --show-current') do set "BRANCH=%%i"
if "%BRANCH%"=="" (
    echo [错误] 无法识别当前分支。
    echo.
    pause
    exit /b 1
)

echo [信息] 当前分支：%BRANCH%
echo.

REM ===== 检查本地改动 =====
git status --porcelain > "%temp%\h5_git_status.txt"
for %%A in ("%temp%\h5_git_status.txt") do set "FILESIZE=%%~zA"

if not "%FILESIZE%"=="0" (
    echo [信息] 检测到本地改动：
    type "%temp%\h5_git_status.txt"
    echo.

    set /p COMMIT_MSG=请输入本次提交说明（直接回车则使用默认说明）: 
    if "!COMMIT_MSG!"=="" (
        set "COMMIT_MSG=chore: sync H5 updates"
    )

    echo.
    echo [执行] git add .
    git add .
    if errorlevel 1 (
        echo [错误] git add 失败。
        del "%temp%\h5_git_status.txt" >nul 2>&1
        echo.
        pause
        exit /b 1
    )

    echo.
    echo [执行] git commit -m "!COMMIT_MSG!"
    git commit -m "!COMMIT_MSG!"
    if errorlevel 1 (
        echo [错误] git commit 失败。
        del "%temp%\h5_git_status.txt" >nul 2>&1
        echo.
        pause
        exit /b 1
    )
) else (
    echo [信息] 本地没有新的未提交改动。
)

del "%temp%\h5_git_status.txt" >nul 2>&1

REM ===== 拉取远端最新内容 =====
echo.
echo [执行] git pull --rebase origin %BRANCH%
git pull --rebase origin %BRANCH%
if errorlevel 1 (
    echo.
    echo [错误] 拉取远端失败，可能出现以下情况：
    echo 1. 网络问题
    echo 2. GitHub 权限问题
    echo 3. rebase 冲突需要人工处理
    echo.
    echo 如出现冲突，请先解决冲突，再执行：
    echo git add .
    echo git rebase --continue
    echo.
    pause
    exit /b 1
)

REM ===== 推送到 GitHub =====
echo.
echo [执行] git push origin %BRANCH%
git push origin %BRANCH%
if errorlevel 1 (
    echo.
    echo [错误] git push 失败。
    echo 请检查网络、登录状态或远端权限。
    echo.
    pause
    exit /b 1
)

echo.
echo =====================================
echo [成功] H5 已完成安全同步
echo 仓库：AIRS-H5
echo 分支：%BRANCH%
echo =====================================
echo.
pause
exit /b 0
