#!/bin/bash

echo "🔧 NeuroScreen Quick Fix"
echo "========================"

echo "[STEP] 1. Fixing Gunicorn service..."
# Copy the corrected service file
cp /var/www/neuroscreen/neuroscreen.service /etc/systemd/system/
systemctl daemon-reload

echo "[STEP] 2. Fixing Nginx configuration..."
# Remove rate limiting from the site config and put it in nginx.conf
if ! grep -q "neuroscreen_api" /etc/nginx/nginx.conf; then
    # Add rate limiting to nginx.conf
    sed -i '/http {/a\\n    # NeuroScreen Rate Limiting\n    limit_req_zone $binary_remote_addr zone=neuroscreen_api:10m rate=10r/s;\n    limit_req_zone $binary_remote_addr zone=neuroscreen_static:10m rate=50r/s;\n    limit_req_zone $binary_remote_addr zone=neuroscreen_eeg:10m rate=5r/s;\n' /etc/nginx/nginx.conf
fi

# Create a simple nginx config without embedded rate limiting
cat > /etc/nginx/sites-available/neuroscreen << 'EOF'
server {
    listen 80;
    server_name neuroscreen.tetym.space www.neuroscreen.tetym.space;
    
    root /var/www/neuroscreen;
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

echo "[STEP] 3. Testing configurations..."
# Test nginx
if nginx -t; then
    echo "✅ Nginx configuration is valid"
    systemctl restart nginx
    if systemctl is-active --quiet nginx; then
        echo "✅ Nginx started successfully"
    else
        echo "❌ Nginx failed to start"
    fi
else
    echo "❌ Nginx configuration still has issues"
    nginx -t
fi

echo "[STEP] 4. Starting NeuroScreen service..."
systemctl restart neuroscreen.service
sleep 3

if systemctl is-active --quiet neuroscreen.service; then
    echo "✅ NeuroScreen service started successfully!"
    echo "Service status:"
    systemctl status neuroscreen.service --no-pager -l
    
    echo ""
    echo "🎉 Deployment successful!"
    echo "Your application should be accessible at: http://neuroscreen.tetym.space"
    echo "You can now set up SSL certificates with:"
    echo "certbot --nginx -d neuroscreen.tetym.space -d www.neuroscreen.tetym.space --non-interactive --agree-tos --email admin@neuroscreen.tetym.space"
else
    echo "❌ NeuroScreen service failed to start"
    echo "Service logs:"
    journalctl -u neuroscreen.service --no-pager -n 10
fi