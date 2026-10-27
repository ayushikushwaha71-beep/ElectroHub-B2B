@echo off
REM ====================================================================
REM  ElectroHub Automated Chrome Demo Runner for Presentation
REM ====================================================================
echo Starting ElectroHub Presentation Demo...
cd /d "%~dp0"
if exist ".\venv\Scripts\python.exe" (
    .\venv\Scripts\python.exe run_demo.py %*
) else (
    "C:\Users\Ayushi\electrohub24\venv\Scripts\python.exe" run_demo.py %*
)
pause
