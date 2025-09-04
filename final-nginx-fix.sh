#!/bin/bash

echo "🔧 Final Nginx Fix"
echo "=================="

echo "[STEP] 1. Removing old nginx configuration..."
rm -f /etc/nginx/sites-enabled/neuroscreen

echo "[STEP] 2. Creating clean nginx configuration..."
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

echo "[STEP] 3. Enabling clean configuration..."
ln -sf /etc/nginx/sites-available/neuroscreen /etc/nginx/sites-enabled/

echo "[STEP] 4. Testing nginx configuration..."
if nginx -t; then
    echo "✅ Nginx configuration is now valid!"
    systemctl restart nginx
    if systemctl is-active --quiet nginx; then
        echo "✅ Nginx started successfully!"
        echo ""
        echo "🎉 DEPLOYMENT COMPLETED SUCCESSFULLY! 🎉"
        echo "========================================"
        echo ""
        echo "✅ NeuroScreen service: RUNNING"
        echo "✅ Nginx web server: RUNNING"
        echo "✅ Application available at: http://neuroscreen.tetym.space"
        echo ""
        echo "🔒 Next step - Set up SSL certificate:"
        echo "certbot --nginx -d neuroscreen.tetym.space -d www.neuroscreen.tetym.space --non-interactive --agree-tos --email admin@neuroscreen.tetym.space"
        echo ""
        echo "📊 Service status:"
        systemctl status neuroscreen.service --no-pager -l | head -10
    else
        echo "❌ Nginx failed to start"
        systemctl status nginx --no-pager -l
    fi
else
    echo "❌ Nginx configuration still has issues"
    nginx -t
fi