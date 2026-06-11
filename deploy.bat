@echo off
powershell -ExecutionPolicy Bypass -File "%~dp0deploy.ps1"
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Aperte qualquer tecla para fechar...
    pause >nul
)
