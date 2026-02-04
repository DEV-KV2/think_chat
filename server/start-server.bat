@echo off
echo Starting Multi-User Chat Server...
echo.
cd /d "%~dp0"
echo Trying Python server...
python chat_server.py
if errorlevel 1 (
    echo.
    echo ❌ Python server failed. Trying Node.js...
    node working-server.cjs
    if errorlevel 1 (
        echo.
        echo ❌ All servers failed. Check Python/Node.js installation.
    )
)
pause
