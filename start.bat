@echo off
echo ========================================================
echo Starting Simplicity EOD Excel Updater...
echo ========================================================

echo Starting Spring Boot Backend on http://localhost:8080...
start "EOD Backend (Spring Boot)" cmd /c "cd backend && mvn spring-boot:run"

echo Starting React Frontend on http://localhost:5173...
start "EOD Frontend (React)" cmd /c "cd frontend && npm.cmd run dev"

echo.
echo Application is starting!
echo Open your browser at: http://localhost:5173
echo ========================================================
pause
