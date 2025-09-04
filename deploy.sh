#!/bin/bash

# NeuroScreen Production Deployment Script
# This script sets up the NeuroScreen application for production deployment

echo "🧠 NeuroScreen Production Deployment"
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

print_status "Python 3 found: $(python3 --version)"

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    print_error "pip3 is not installed. Please install pip3."
    exit 1
fi

print_status "pip3 found: $(pip3 --version)"

# Create virtual environment
print_status "Creating virtual environment..."
python3 -m venv venv
if [ $? -ne 0 ]; then
    print_error "Failed to create virtual environment"
    exit 1
fi

# Activate virtual environment
print_status "Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
print_status "Upgrading pip..."
pip install --upgrade pip

# Install dependencies
print_status "Installing dependencies from requirements.txt..."
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    print_error "Failed to install dependencies"
    exit 1
fi

# Install production server (Gunicorn)
print_status "Installing Gunicorn for production..."
pip install gunicorn

# Create logs directory
print_status "Creating logs directory..."
mkdir -p logs

# Create data file if it doesn't exist
if [ ! -f "data.txt" ]; then
    print_status "Creating initial data file..."
    echo "{'first': 0, 'second': 0, 'third': 0, 'fifth': 0}" > data.txt
fi

# Set permissions
print_status "Setting file permissions..."
chmod +x wsgi.py
chmod 644 requirements.txt
chmod 644 config.py

# Create systemd service file (optional)
if command -v systemctl &> /dev/null; then
    print_status "Creating systemd service file..."
    cat > neuroscreen.service << EOF
[Unit]
Description=NeuroScreen BCI Application
After=network.target

[Service]
User=$USER
Group=$USER
WorkingDirectory=$(pwd)
Environment=PATH=$(pwd)/venv/bin
ExecStart=$(pwd)/venv/bin/gunicorn --bind 0.0.0.0:5000 wsgi:application
Restart=always

[Install]
WantedBy=multi-user.target
EOF
    print_warning "Systemd service file created. Run 'sudo mv neuroscreen.service /etc/systemd/system/' to install it."
fi

# Create production start script
print_status "Creating production start script..."
cat > start_production.sh << 'EOF'
#!/bin/bash
echo "Starting NeuroScreen in production mode..."
source venv/bin/activate
export FLASK_ENV=production
gunicorn --bind 0.0.0.0:5000 --workers 4 --timeout 120 --access-logfile logs/access.log --error-logfile logs/error.log wsgi:application
EOF
chmod +x start_production.sh

# Create development start script
print_status "Creating development start script..."
cat > start_development.sh << 'EOF'
#!/bin/bash
echo "Starting NeuroScreen in development mode..."
source venv/bin/activate
export FLASK_ENV=development
python main.py
EOF
chmod +x start_development.sh

# Display completion message
echo ""
print_status "🎉 Production setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "  1. Configure environment variables (if needed)"
echo "  2. Set up reverse proxy (Nginx recommended)"
echo "  3. Configure SSL/TLS certificates"
echo "  4. Start the application:"
echo "     ./start_production.sh   (for production)"
echo "     ./start_development.sh  (for development)"
echo ""
echo "🌐 Application will be available at:"
echo "  Development: http://localhost:5000"
echo "  Production:  http://your-domain.com"
echo ""
echo "📁 Important files:"
echo "  - wsgi.py: WSGI entry point"
echo "  - config.py: Configuration settings"
echo "  - requirements.txt: Python dependencies"
echo "  - logs/: Application logs"
echo ""
print_warning "Remember to:"
echo "  - Change the SECRET_KEY in production"
echo "  - Set up proper logging"
echo "  - Configure firewall rules"
echo "  - Set up monitoring"