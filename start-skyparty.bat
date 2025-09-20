@echo off
title SkyParty Desktop App
color 0A

echo ========================================
echo        SkyParty Desktop App
echo ========================================
echo.

REM Check if Node.js is installed
echo Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Node.js is not installed!
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo Download the LTS version and install it.
    echo.
    echo After installing Node.js, restart this batch file.
    echo.
    pause
    exit /b 1
)

echo Node.js is installed!
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo ERROR: package.json not found!
    echo Please make sure you're running this from the correct directory.
    echo.
    echo Current directory: %CD%
    echo.
    pause
    exit /b 1
)

echo Installing dependencies...
if not exist "node_modules" (
    echo Running: npm install
    npm install
    if %errorlevel% neq 0 (
        echo.
        echo ERROR: Failed to install dependencies!
        echo Please check your internet connection and try again.
        echo.
        pause
        exit /b 1
    )
    echo Dependencies installed successfully!
) else (
    echo Dependencies already installed.
)

echo.
echo ========================================
echo Starting SkyParty Desktop App...
echo ========================================
echo.
echo The desktop app will open in a new window.
echo Close the app window to stop the application.
echo.

REM Start the Electron app
npm start

echo.
echo SkyParty Desktop App closed.
pause
