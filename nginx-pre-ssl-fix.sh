#!/bin/bash

# Pre-SSL nginx fix for NeuroScreen
echo "🔧 NeuroScreen Pre-SSL Nginx Fix"
echo "================================="

echo "[STEP] 1. Creating HTTP-only nginx configuration (before SSL)..."
cat > /etc/nginx/sites-available/neuroscreen << 'EOF'
server {
    listen 80;
    server_name neuroscreen.tetym.space www.neuroscreen.tetym.space;
    
    # Root directory
    root /var/www/neuroscreen;
    index index.html;

    # Logging
    access_log /var/log/nginx/neuroscreen.access.log;
    error_log /var/log/nginx/neuroscreen.error.log;

    # Let's Encrypt challenge location
    location /.well-known/acme-challenge/ {
        root /var/www/html;
        allow all;
    }

    # Main application
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120;
        proxy_connect_timeout 120;
        proxy_send_timeout 120;
    }

    # EEG stream endpoint
    location /eeg_stream {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 300;
        proxy_send_timeout 300;
    }
    
    # Static files
    location /static/ {
        alias /var/www/neuroscreen/static/;
        expires 1d;
        add_header Cache-Control "public";
    }

    # Health check
    location /health {
        access_log off;
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
    }

    # Block sensitive files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
    
    location ~ /(data\.txt|\.env|config\.py|wsgi\.py)$ {
        deny all;
        access_log off;
        log_not_found off;
    }
}
EOF

echo "[STEP] 2. Enabling the HTTP-only configuration..."
ln -sf /etc/nginx/sites-available/neuroscreen /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

echo "[STEP] 3. Testing nginx configuration..."
if nginx -t; then
    echo "[SUCCESS] HTTP-only nginx configuration test passed!"
    echo "[STEP] 4. Reloading nginx..."
    systemctl reload nginx
    echo "[SUCCESS] Nginx is now running with HTTP-only configuration"
    echo ""
    echo "✅ Now you can generate SSL certificates with:"
    echo "   certbot --nginx -d neuroscreen.tetym.space -d www.neuroscreen.tetym.space --non-interactive --agree-tos --email admin@neuroscreen.tetym.space"
    echo ""
    echo "📋 After SSL certificate generation, nginx will automatically be updated to use HTTPS"
else
    echo "[ERROR] HTTP-only nginx configuration still has issues"
    echo "Showing nginx error details:"
    nginx -t 2>&1
    exit 1
fi