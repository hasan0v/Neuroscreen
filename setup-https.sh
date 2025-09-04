#!/bin/bash

echo "🔒 Setting up HTTPS for NeuroScreen"
echo "==================================="

# Check if certificates exist
if [[ -f "/etc/letsencrypt/live/neuroscreen.tetym.space/fullchain.pem" ]]; then
    echo "✅ SSL certificates found, configuring HTTPS..."
    
    # Create HTTPS nginx configuration
    cat > /etc/nginx/sites-available/neuroscreen << 'EOF'
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name neuroscreen.tetym.space www.neuroscreen.tetym.space;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name neuroscreen.tetym.space www.neuroscreen.tetym.space;

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

    # Test and reload nginx
    if nginx -t; then
        systemctl reload nginx
        echo "✅ HTTPS configured successfully!"
        echo "🌟 Your site is now available at: https://neuroscreen.tetym.space"
    else
        echo "❌ Nginx configuration error"
        nginx -t
    fi
    
else
    echo "❌ SSL certificates not found. Generating them now..."
    
    # Method 1: Try nginx plugin
    echo "Trying automatic SSL setup..."
    certbot --nginx -d neuroscreen.tetym.space -d www.neuroscreen.tetym.space --non-interactive --agree-tos --email admin@neuroscreen.tetym.space
    
    if [[ $? -eq 0 ]]; then
        echo "✅ SSL certificates generated successfully!"
        echo "🌟 Your site should now be available at: https://neuroscreen.tetym.space"
    else
        echo "❌ Automatic SSL setup failed. Trying manual approach..."
        
        # Method 2: Standalone mode
        echo "Stopping nginx temporarily for standalone certificate generation..."
        systemctl stop nginx
        
        certbot certonly --standalone -d neuroscreen.tetym.space -d www.neuroscreen.tetym.space --non-interactive --agree-tos --email admin@neuroscreen.tetym.space
        
        if [[ $? -eq 0 ]]; then
            echo "✅ SSL certificates generated via standalone mode!"
            # Apply HTTPS configuration and restart nginx
            $0  # Re-run this script to apply HTTPS config
            systemctl start nginx
        else
            echo "❌ SSL certificate generation failed"
            echo "Please check:"
            echo "1. Domain DNS points to this server"
            echo "2. Ports 80 and 443 are open"
            echo "3. No firewall blocking access"
            systemctl start nginx
        fi
    fi
fi