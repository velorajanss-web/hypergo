@echo off
setlocal
title HyperGo - Tek Tik Calistir

cd /d "%~dp0"

echo.
echo ==========================================
echo          HYPERGO BASLATILIYOR
echo ==========================================
echo.

where node >nul 2>&1
if errorlevel 1 (
    echo Node.js bilgisayarda kurulu degil.
    echo Otomatik olarak Node.js LTS kurulumu deneniyor...
    echo.

    where winget >nul 2>&1
    if errorlevel 1 (
        echo.
        echo WINGET BULUNAMADI.
        echo.
        echo Node.js kurulumu gerekiyor.
        echo Microsoft Store / Windows Update ile
        echo "App Installer" guncellenmeli.
        echo.
        echo Bu pencereyi kapatmadan bana ekran goruntusu gonder.
        pause
        exit /b 1
    )

    winget install --id OpenJS.NodeJS.LTS -e --accept-source-agreements --accept-package-agreements

    if errorlevel 1 (
        echo.
        echo Node.js otomatik kurulumu basarisiz oldu.
        echo Bilgisayari yeniden baslatip bu dosyayi tekrar deneyin.
        pause
        exit /b 1
    )

    echo.
    echo Node.js kuruldu. Yeni PATH bilgisi icin sunucu yeniden baslatiliyor...
    timeout /t 2 /nobreak >nul
)

where node >nul 2>&1
if errorlevel 1 (
    echo.
    echo Node.js kuruldu fakat Windows PATH henuz yenilenmedi.
    echo Bu pencereyi kapatip HYPERGO_BASLAT.bat dosyasini
    echo tekrar cift tiklayin.
    pause
    exit /b 1
)

echo Node.js bulundu.
echo HyperGo sunucusu baslatiliyor...
echo.
echo BU SIYAH PENCEREYI KAPATMA.
echo Site: http://localhost:3000
echo.

start "" "http://localhost:3000"
node server.js

echo.
echo HyperGo sunucusu kapandi.
pause
