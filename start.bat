@echo off
echo ========================================
echo BudgetGuard - Quick Start
echo ========================================
echo.

echo Starting Backend Server...
start cmd /k "cd backend && python main.py"
timeout /t 3 /nobreak >nul

echo.
echo Backend started on http://localhost:8000
echo.

echo Web app is already running on http://localhost:5173
echo.

echo ========================================
echo Next Steps:
echo ========================================
echo 1. Open http://localhost:5173 in your browser
echo 2. Complete budget setup
echo 3. Try the demo scenarios:
echo    - Small payment ($50) = APPROVED
echo    - Medium payment ($200) = WARNING  
echo    - Large payment ($500) = BLOCKED
echo.
echo For mobile app:
echo   cd mobile
echo   npx expo start
echo.
echo ========================================

pause
