#!/bin/bash

echo "🔧 NeuroScreen Service Fix"
echo "=========================="

echo "[STEP] 1. Updating systemd service..."
# Copy the updated service file
cp /var/www/neuroscreen/neuroscreen.service /etc/systemd/system/

echo "[STEP] 2. Reloading systemd..."
systemctl daemon-reload

echo "[STEP] 3. Checking service logs before restart..."
journalctl -u neuroscreen.service --no-pager -n 10

echo "[STEP] 4. Testing Python import..."
cd /var/www/neuroscreen
source venv/bin/activate
python3 -c "
import sys
sys.path.insert(0, '/var/www/neuroscreen')
try:
    from wsgi import application
    print('✅ WSGI application loads successfully')
except Exception as e:
    print(f'❌ Error loading WSGI: {e}')
    import traceback
    traceback.print_exc()
"

echo "[STEP] 5. Testing Gunicorn directly..."
cd /var/www/neuroscreen
timeout 5s venv/bin/gunicorn --bind 127.0.0.1:5001 --chdir /var/www/neuroscreen wsgi:application --timeout 10 &
sleep 2
if curl -s http://127.0.0.1:5001 > /dev/null 2>&1; then
    echo "✅ Gunicorn can start the application"
    pkill -f "gunicorn.*5001" 2>/dev/null
else
    echo "❌ Gunicorn failed to start"
    pkill -f "gunicorn.*5001" 2>/dev/null
fi

echo "[STEP] 6. Starting NeuroScreen service..."
systemctl restart neuroscreen.service
sleep 3

echo "[STEP] 7. Checking service status..."
if systemctl is-active --quiet neuroscreen.service; then
    echo "✅ NeuroScreen service is running successfully!"
    systemctl status neuroscreen.service --no-pager -l
else
    echo "❌ NeuroScreen service failed to start"
    echo "Recent logs:"
    journalctl -u neuroscreen.service --no-pager -n 15
fi

echo "[STEP] 8. Testing nginx..."
systemctl restart nginx
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx is running"
else
    echo "❌ Nginx failed to start"
    systemctl status nginx --no-pager -l
fi