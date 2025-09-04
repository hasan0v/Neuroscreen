@echo off
REM NeuroScreen Production Deployment Script for Windows
REM This script sets up the NeuroScreen application for production deployment on Windows

title NeuroScreen Production Deployment

echo.
echo 🧠 NeuroScreen Production Deployment
echo ====================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH.
    echo Please install Python 3.8 or higher and add it to PATH.
    pause
    exit /b 1
)

echo [INFO] Python found: 
python --version

REM Check if pip is installed
pip --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] pip is not installed or not in PATH.
    pause
    exit /b 1
)

echo [INFO] pip found:
pip --version

REM Create virtual environment
echo [INFO] Creating virtual environment...
python -m venv venv
if errorlevel 1 (
    echo [ERROR] Failed to create virtual environment
    pause
    exit /b 1
)

REM Activate virtual environment
echo [INFO] Activating virtual environment...
call venv\Scripts\activate.bat

REM Upgrade pip
echo [INFO] Upgrading pip...
python -m pip install --upgrade pip

REM Install dependencies
echo [INFO] Installing dependencies from requirements.txt...
pip install -r requirements.txt
if errorlevel 1 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)

REM Install production server (Waitress for Windows)
echo [INFO] Installing Waitress for production...
pip install waitress

REM Create logs directory
echo [INFO] Creating logs directory...
if not exist "logs" mkdir logs

REM Create data file if it doesn't exist
if not exist "data.txt" (
    echo [INFO] Creating initial data file...
    echo {'first': 0, 'second': 0, 'third': 0, 'fifth': 0} > data.txt
)

REM Create production start script
echo [INFO] Creating production start script...
(
echo @echo off
echo echo Starting NeuroScreen in production mode...
echo call venv\Scripts\activate.bat
echo set FLASK_ENV=production
echo waitress-serve --host=0.0.0.0 --port=5000 wsgi:application
) > start_production.bat

REM Create development start script
echo [INFO] Creating development start script...
(
echo @echo off
echo echo Starting NeuroScreen in development mode...
echo call venv\Scripts\activate.bat
echo set FLASK_ENV=development
echo python main.py
echo pause
) > start_development.bat

REM Create stop script
echo [INFO] Creating stop script...
(
echo @echo off
echo echo Stopping NeuroScreen...
echo taskkill /f /im python.exe 2^>nul
echo taskkill /f /im waitress-serve.exe 2^>nul
echo echo NeuroScreen stopped.
echo pause
) > stop_application.bat

echo.
echo [INFO] 🎉 Production setup completed successfully!
echo.
echo 📋 Next steps:
echo   1. Configure environment variables (if needed)
echo   2. Set up reverse proxy (IIS or Apache recommended)
echo   3. Configure SSL/TLS certificates
echo   4. Start the application:
echo      start_production.bat   (for production)
echo      start_development.bat  (for development)
echo.
echo 🌐 Application will be available at:
echo   Development: http://localhost:5000
echo   Production:  http://your-domain.com
echo.
echo 📁 Important files:
echo   - wsgi.py: WSGI entry point
echo   - config.py: Configuration settings
echo   - requirements.txt: Python dependencies
echo   - logs\: Application logs
echo.
echo [WARNING] Remember to:
echo   - Change the SECRET_KEY in production
echo   - Set up proper logging
echo   - Configure firewall rules
echo   - Set up monitoring
echo.
pause