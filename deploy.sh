#!/bin/bash

# NeuroScreen Production Deployment Script for Debian/Ubuntu
# Domain: neuroscreen.tetym.space
# This script sets up the NeuroScreen application for production deployment

echo "🧠 NeuroScreen Production Deployment for neuroscreen.tetym.space"
echo "================================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="neuroscreen.tetym.space"
APP_DIR="/var/www/neuroscreen"
SERVICE_USER="www-data"
LOG_DIR="/var/log/neuroscreen"

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

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root (use sudo)"
   exit 1
fi

print_step "1. Updating system packages..."
apt update && apt upgrade -y
if [ $? -ne 0 ]; then
    print_error "Failed to update system packages"
    exit 1
fi

print_step "2. Installing required system packages..."
apt install -y python3 python3-pip python3-venv python3-dev \
    nginx certbot python3-certbot-nginx \
    build-essential curl git \
    supervisor logrotate \
    ufw fail2ban
if [ $? -ne 0 ]; then
    print_error "Failed to install system packages"
    exit 1
fi

print_step "3. Creating application directory and user setup..."
# Create application directory
mkdir -p $APP_DIR
mkdir -p $LOG_DIR
chown -R $SERVICE_USER:$SERVICE_USER $APP_DIR
chown -R $SERVICE_USER:$SERVICE_USER $LOG_DIR

# Create logs directory structure
mkdir -p $LOG_DIR/{nginx,gunicorn,supervisor}
chmod 755 $LOG_DIR
chmod 755 $LOG_DIR/{nginx,gunicorn,supervisor}

print_step "4. Copying application files..."
# Copy application files (assuming script is run from project directory)
if [ -f "main.py" ]; then
    cp -r . $APP_DIR/
    chown -R $SERVICE_USER:$SERVICE_USER $APP_DIR
else
    print_error "main.py not found. Please run this script from the NeuroScreen project directory."
    exit 1
fi

print_step "5. Setting up Python virtual environment..."
cd $APP_DIR
sudo -u $SERVICE_USER python3 -m venv venv
if [ $? -ne 0 ]; then
    print_error "Failed to create virtual environment"
    exit 1
fi

print_step "6. Installing Python dependencies..."
sudo -u $SERVICE_USER $APP_DIR/venv/bin/pip install --upgrade pip
sudo -u $SERVICE_USER $APP_DIR/venv/bin/pip install -r requirements.txt
sudo -u $SERVICE_USER $APP_DIR/venv/bin/pip install gunicorn
if [ $? -ne 0 ]; then
    print_error "Failed to install Python dependencies"
    exit 1
fi

print_step "7. Creating data file..."
if [ ! -f "$APP_DIR/data.txt" ]; then
    echo "{'first': 0, 'second': 0, 'third': 0, 'fifth': 0}" > $APP_DIR/data.txt
    chown $SERVICE_USER:$SERVICE_USER $APP_DIR/data.txt
fi

print_step "8. Setting up environment variables..."
if [ ! -f "$APP_DIR/.env" ]; then
    cat > $APP_DIR/.env << EOF
FLASK_ENV=production
SECRET_KEY=$(openssl rand -hex 32)
DOMAIN=neuroscreen.tetym.space
HOST=127.0.0.1
PORT=5000
LOG_LEVEL=INFO
EOF
    chown $SERVICE_USER:$SERVICE_USER $APP_DIR/.env
    chmod 600 $APP_DIR/.env
fi

print_step "9. Installing systemd service..."
cp $APP_DIR/neuroscreen.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable neuroscreen
print_status "Systemd service installed and enabled"

print_step "10. Configuring Nginx..."
# Backup default nginx config
cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup 2>/dev/null || true

# Add rate limiting zones to nginx.conf if not already present
if ! grep -q "neuroscreen_api" /etc/nginx/nginx.conf; then
    print_status "Adding rate limiting configuration to nginx.conf..."
    sed -i '/http {/a\\n    # NeuroScreen Rate Limiting Zones\n    limit_req_zone $binary_remote_addr zone=neuroscreen_api:10m rate=10r/s;\n    limit_req_zone $binary_remote_addr zone=neuroscreen_static:10m rate=50r/s;\n    limit_req_zone $binary_remote_addr zone=neuroscreen_eeg:10m rate=5r/s;\n' /etc/nginx/nginx.conf
fi

# Create HTTP-only nginx configuration (before SSL certificate generation)
print_status "Creating HTTP-only nginx configuration..."
cat > /etc/nginx/sites-available/neuroscreen << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    root $APP_DIR;
    index index.html;

    access_log /var/log/nginx/neuroscreen.access.log;
    error_log /var/log/nginx/neuroscreen.error.log;

    # Let's Encrypt challenge location
    location /.well-known/acme-challenge/ {
        root /var/www/html;
        allow all;
    }

    # Main application
    location / {
        limit_req zone=neuroscreen_api burst=20 nodelay;
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 120;
        proxy_connect_timeout 120;
        proxy_send_timeout 120;
    }

    # EEG stream endpoint
    location /eeg_stream {
        limit_req zone=neuroscreen_eeg burst=5 nodelay;
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 300;
        proxy_send_timeout 300;
    }
    
    # Static files
    location /static/ {
        limit_req zone=neuroscreen_static burst=100 nodelay;
        alias $APP_DIR/static/;
        expires 1d;
        add_header Cache-Control "public";
    }

    # Health check
    location /health {
        access_log off;
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host \$host;
    }

    # Block sensitive files
    location ~ /\\. {
        deny all;
        access_log off;
        log_not_found off;
    }
    
    location ~ /(data\\.txt|\\.env|config\\.py|wsgi\\.py)$ {
        deny all;
        access_log off;
        log_not_found off;
    }
}
EOF

# Enable the site and remove default
ln -sf /etc/nginx/sites-available/neuroscreen /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
print_status "Testing nginx configuration..."
if nginx -t; then
    print_status "Nginx configuration test passed"
    systemctl reload nginx
    print_status "Nginx reloaded successfully"
else
    print_error "Nginx configuration test failed"
    nginx -t
    exit 1
fi

print_step "11. Setting up SSL certificate with Let's Encrypt..."
print_warning "Setting up temporary HTTP server for certificate generation..."

# Create temporary nginx config for certificate generation
cat > /etc/nginx/sites-available/temp-neuroscreen << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    location / {
        return 200 'NeuroScreen is being set up...';
        add_header Content-Type text/plain;
    }
}
EOF

ln -sf /etc/nginx/sites-available/temp-neuroscreen /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/neuroscreen
systemctl reload nginx

# Generate SSL certificate
certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
if [ $? -eq 0 ]; then
    print_status "SSL certificate generated successfully"
    # Switch back to main config
    rm -f /etc/nginx/sites-enabled/temp-neuroscreen
    ln -sf /etc/nginx/sites-available/neuroscreen /etc/nginx/sites-enabled/
else
    print_warning "SSL certificate generation failed. You can set it up manually later."
    print_warning "Using HTTP-only configuration for now."
    # Create HTTP-only version
    sed 's/listen 443 ssl http2;/listen 80;/' $APP_DIR/nginx-neuroscreen.conf > /etc/nginx/sites-available/neuroscreen-http
    ln -sf /etc/nginx/sites-available/neuroscreen-http /etc/nginx/sites-enabled/neuroscreen
fi

print_step "12. Configuring firewall..."
ufw --force enable
ufw allow ssh
ufw allow 'Nginx Full'
ufw allow 80
ufw allow 443
print_status "Firewall configured"

print_step "13. Setting up log rotation..."
cat > /etc/logrotate.d/neuroscreen << EOF
$LOG_DIR/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 $SERVICE_USER $SERVICE_USER
    postrotate
        systemctl reload neuroscreen
    endscript
}
EOF

print_step "14. Configuring fail2ban..."
cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 5

[nginx-http-auth]
enabled = true

[nginx-noscript]
enabled = true

[nginx-badbots]
enabled = true

[nginx-noproxy]
enabled = true
EOF

systemctl enable fail2ban
systemctl restart fail2ban

print_step "15. Starting services..."
systemctl start neuroscreen
systemctl reload nginx

# Wait a moment for services to start
sleep 3

print_step "16. Testing deployment..."
if systemctl is-active --quiet neuroscreen; then
    print_status "NeuroScreen service is running"
else
    print_error "NeuroScreen service failed to start"
    systemctl status neuroscreen
    exit 1
fi

if systemctl is-active --quiet nginx; then
    print_status "Nginx service is running"
else
    print_error "Nginx service failed to start"
    systemctl status nginx
    exit 1
fi

# Test HTTP connection
if curl -s -o /dev/null -w "%{http_code}" http://$DOMAIN | grep -q "200\|301\|302"; then
    print_status "HTTP connection test passed"
else
    print_warning "HTTP connection test failed - check configuration"
fi

print_step "17. Setting up monitoring (optional)..."
cat > /etc/cron.d/neuroscreen-health << EOF
# Check NeuroScreen health every 5 minutes
*/5 * * * * root curl -f http://localhost:5000/health > /dev/null 2>&1 || systemctl restart neuroscreen
EOF

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📋 Deployment Summary:"
echo "  Domain: https://$DOMAIN"
echo "  Application Directory: $APP_DIR"
echo "  Service User: $SERVICE_USER"
echo "  Log Directory: $LOG_DIR"
echo ""
echo "🔧 Service Management Commands:"
echo "  Start:   sudo systemctl start neuroscreen"
echo "  Stop:    sudo systemctl stop neuroscreen"
echo "  Restart: sudo systemctl restart neuroscreen"
echo "  Status:  sudo systemctl status neuroscreen"
echo "  Logs:    sudo journalctl -u neuroscreen -f"
echo ""
echo "🌐 Your NeuroScreen application is now available at:"
echo "  http://$DOMAIN (redirects to HTTPS)"
echo "  https://$DOMAIN"
echo ""
echo "📁 Important files:"
echo "  Service: /etc/systemd/system/neuroscreen.service"
echo "  Nginx Config: /etc/nginx/sites-available/neuroscreen"
echo "  Environment: $APP_DIR/.env"
echo "  Logs: $LOG_DIR/"
echo ""
print_warning "Next steps:"
echo "  1. Update DNS records to point $DOMAIN to this server's IP"
echo "  2. Test the application at https://$DOMAIN"
echo "  3. Set up monitoring and alerting"
echo "  4. Configure backups for $APP_DIR and $LOG_DIR"
echo "  5. Review security settings and update as needed"
echo ""
print_status "🎊 NeuroScreen is now live at https://$DOMAIN!"