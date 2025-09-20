@echo off
echo Building SkyParty Desktop App...
echo.

echo Step 1: Installing dependencies...
npm install

echo.
echo Step 2: Building Electron app...
npx electron-builder --win --x64 --dir

echo.
echo Build complete! Check the 'dist' folder for your app.
echo.
pause
