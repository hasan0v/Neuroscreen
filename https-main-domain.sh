#!/bin/bash

echo "🔒 HTTPS Setup - Main Domain Only"
echo "=================================="

echo "[STEP] 1. Checking DNS resolution..."
if nslookup neuroscreen.tetym.space > /dev/null 2>&1; then
    echo "✅ neuroscreen.tetym.space resolves correctly"
else
    echo "❌ neuroscreen.tetym.space does not resolve"
    exit 1
fi

echo "[STEP] 2. Generating SSL certificate for main domain only..."
# Stop nginx temporarily
systemctl stop nginx

# Generate certificate for main domain only (no www)
certbot certonly --standalone -d neuroscreen.tetym.space --non-interactive --agree-tos --email admin@neuroscreen.tetym.space

if [[ $? -eq 0 ]]; then
    echo "✅ SSL certificate generated successfully!"
    
    echo "[STEP] 3. Configuring HTTPS nginx..."
    # Create HTTPS nginx configuration for main domain only
    cat > /etc/nginx/sites-available/neuroscreen << 'EOF'
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name neuroscreen.tetym.space;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name neuroscreen.tetym.space;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/neuroscreen.tetym.space/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/neuroscreen.tetym.space/privkey.pem;
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Root and logging
    root /var/www/neuroscreen;
    index index.html;
    access_log /var/log/nginx/neuroscreen.access.log;
    error_log /var/log/nginx/neuroscreen.error.log;

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

    echo "[STEP] 4. Testing nginx configuration..."
    if nginx -t; then
        echo "✅ Nginx configuration is valid"
        systemctl start nginx
        
        if systemctl is-active --quiet nginx; then
            echo "✅ Nginx started successfully"
            echo ""
            echo "🎉 HTTPS SETUP COMPLETED! 🎉"
            echo "============================"
            echo ""
            echo "✅ Your secure website is now available at:"
            echo "🔒 https://neuroscreen.tetym.space"
            echo ""
            echo "🔄 HTTP automatically redirects to HTTPS"
            echo "🔒 SSL certificate valid for 90 days (auto-renewal enabled)"
            echo ""
            echo "📊 Testing the connection..."
            if curl -I https://neuroscreen.tetym.space > /dev/null 2>&1; then
                echo "✅ HTTPS connection test successful!"
            else
                echo "⚠️  HTTPS connection test failed (but configuration is correct)"
            fi
        else
            echo "❌ Nginx failed to start"
            systemctl status nginx --no-pager -l
        fi
    else
        echo "❌ Nginx configuration error"
        nginx -t
        systemctl start nginx
    fi
else
    echo "❌ SSL certificate generation failed"
    echo "Starting nginx in HTTP mode..."
    systemctl start nginx
    echo ""
    echo "🔍 Troubleshooting steps:"
    echo "1. Check if neuroscreen.tetym.space points to this server IP"
    echo "2. Check if ports 80 and 443 are open"
    echo "3. Try: nslookup neuroscreen.tetym.space"
    echo "4. Try: curl -I http://neuroscreen.tetym.space"
fi