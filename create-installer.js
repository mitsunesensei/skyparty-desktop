const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🎮 Creating SkyParty Installer...\n');

// Source folder (standalone app)
const sourceFolder = 'C:\\Users\\SETUP\\Desktop\\SkyParty-Standalone-win32-x64';
const outputDir = path.join(__dirname, 'installer');

// Create installer directory
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

console.log('📁 Source folder:', sourceFolder);
console.log('📁 Output directory:', outputDir);

try {
    // Create installer using electron-installer-windows
    const command = `electron-installer-windows --src "${sourceFolder}" --dest "${outputDir}" --name "SkyParty" --productName "SkyParty Desktop" --version "1.0.0" --description "SkyParty Desktop Gaming Application" --authors "SkyParty Team" --homepage "https://skyparty.com"`;
    
    console.log('🔧 Running installer command...');
    execSync(command, { stdio: 'inherit' });
    
    console.log('\n✅ Installer created successfully!');
    console.log('📁 Check the installer folder for your setup file');
    
} catch (error) {
    console.error('❌ Error creating installer:', error.message);
    console.log('\n💡 Alternative: Let\'s create a simple batch installer instead...');
    
    // Create a simple batch installer as fallback
    createBatchInstaller();
}

function createBatchInstaller() {
    console.log('📝 Creating batch installer...');
    
    const batchContent = `@echo off
echo.
echo ========================================
echo    SkyParty Desktop - Installation
echo ========================================
echo.
echo Installing SkyParty to Program Files...
echo.

REM Create installation directory
set "INSTALL_DIR=%ProgramFiles%\\SkyParty"
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

REM Copy files
echo Copying application files...
xcopy /E /I /Y "%~dp0SkyParty-Standalone-win32-x64\\*" "%INSTALL_DIR%\\"

REM Create desktop shortcut
echo Creating desktop shortcut...
set "DESKTOP=%USERPROFILE%\\Desktop"
echo Set oWS = WScript.CreateObject("WScript.Shell") > "%TEMP%\\CreateShortcut.vbs"
echo sLinkFile = "%DESKTOP%\\SkyParty.lnk" >> "%TEMP%\\CreateShortcut.vbs"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%TEMP%\\CreateShortcut.vbs"
echo oLink.TargetPath = "%INSTALL_DIR%\\SkyParty-Standalone.exe" >> "%TEMP%\\CreateShortcut.vbs"
echo oLink.WorkingDirectory = "%INSTALL_DIR%" >> "%TEMP%\\CreateShortcut.vbs"
echo oLink.Description = "SkyParty Desktop" >> "%TEMP%\\CreateShortcut.vbs"
echo oLink.Save >> "%TEMP%\\CreateShortcut.vbs"
cscript "%TEMP%\\CreateShortcut.vbs"
del "%TEMP%\\CreateShortcut.vbs"

REM Create Start Menu shortcut
echo Creating Start Menu shortcut...
set "START_MENU=%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs"
if not exist "%START_MENU%\\SkyParty" mkdir "%START_MENU%\\SkyParty"
echo Set oWS = WScript.CreateObject("WScript.Shell") > "%TEMP%\\CreateStartMenuShortcut.vbs"
echo sLinkFile = "%START_MENU%\\SkyParty\\SkyParty.lnk" >> "%TEMP%\\CreateStartMenuShortcut.vbs"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%TEMP%\\CreateStartMenuShortcut.vbs"
echo oLink.TargetPath = "%INSTALL_DIR%\\SkyParty-Standalone.exe" >> "%TEMP%\\CreateStartMenuShortcut.vbs"
echo oLink.WorkingDirectory = "%INSTALL_DIR%" >> "%TEMP%\\CreateStartMenuShortcut.vbs"
echo oLink.Description = "SkyParty Desktop" >> "%TEMP%\\CreateStartMenuShortcut.vbs"
echo oLink.Save >> "%TEMP%\\CreateStartMenuShortcut.vbs"
cscript "%TEMP%\\CreateStartMenuShortcut.vbs"
del "%TEMP%\\CreateStartMenuShortcut.vbs"

echo.
echo ========================================
echo    Installation Complete!
echo ========================================
echo.
echo SkyParty has been installed to: %INSTALL_DIR%
echo Desktop shortcut created
echo Start Menu shortcut created
echo.
echo You can now run SkyParty from:
echo - Desktop shortcut
echo - Start Menu
echo - Or directly from: %INSTALL_DIR%\\SkyParty-Standalone.exe
echo.
pause`;

    fs.writeFileSync(path.join(outputDir, 'Install-SkyParty.bat'), batchContent);
    
    // Copy the standalone folder to installer directory
    console.log('📁 Copying standalone app to installer folder...');
    execSync(`xcopy /E /I /Y "${sourceFolder}" "${path.join(outputDir, 'SkyParty-Standalone-win32-x64')}"`, { stdio: 'inherit' });
    
    console.log('\n✅ Batch installer created successfully!');
    console.log('📁 Location: installer/Install-SkyParty.bat');
    console.log('🎯 To install: Run Install-SkyParty.bat as Administrator');
}
