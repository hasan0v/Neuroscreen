#!/bin/bash

# Quick fix for nginx configuration issues
echo "🔧 NeuroScreen Nginx Quick Fix"
echo "================================="

# Add rate limiting zones to nginx.conf
echo "[STEP] 1. Adding rate limiting configuration to nginx.conf..."
if ! grep -q "neuroscreen_api" /etc/nginx/nginx.conf; then
    sed -i '/http {/a\\n    # NeuroScreen Rate Limiting Zones\n    limit_req_zone $binary_remote_addr zone=neuroscreen_api:10m rate=10r/s;\n    limit_req_zone $binary_remote_addr zone=neuroscreen_static:10m rate=50r/s;\n    limit_req_zone $binary_remote_addr zone=neuroscreen_eeg:10m rate=5r/s;\n' /etc/nginx/nginx.conf
    echo "[INFO] Rate limiting zones added"
else
    echo "[INFO] Rate limiting zones already present"
fi

# Create a simplified nginx configuration
echo "[STEP] 2. Creating simplified nginx configuration..."
cat > /etc/nginx/sites-available/neuroscreen << 'EOF'
server {
    listen 80;
    server_name neuroscreen.tetym.space www.neuroscreen.tetym.space;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name neuroscreen.tetym.space www.neuroscreen.tetym.space;

    # SSL Configuration (will be configured by certbot)
    ssl_certificate /etc/letsencrypt/live/neuroscreen.tetym.space/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/neuroscreen.tetym.space/privkey.pem;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Logging
    access_log /var/log/nginx/neuroscreen.access.log;
    error_log /var/log/nginx/neuroscreen.error.log;

    # Main application
    location / {
        limit_req zone=neuroscreen_api burst=20 nodelay;
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
        limit_req zone=neuroscreen_eeg burst=5 nodelay;
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
        limit_req zone=neuroscreen_static burst=100 nodelay;
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

echo "[STEP] 3. Testing nginx configuration..."
if nginx -t; then
    echo "[SUCCESS] Nginx configuration test passed!"
    echo "[STEP] 4. Reloading nginx..."
    systemctl reload nginx
    echo "[SUCCESS] Nginx configuration fixed and reloaded!"
    echo ""
    echo "✅ You can now continue with the deployment script"
    echo "   The script should continue from step 11 (SSL certificate setup)"
else
    echo "[ERROR] Nginx configuration still has issues"
    echo "Please check the error messages above"
    exit 1
fi