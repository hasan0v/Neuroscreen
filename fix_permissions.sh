#!/bin/bash
# Fix permissions for NeuroScreen
# Run this on the server: sudo ./fix_permissions.sh

PROJECT_DIR="/var/www/neuroscreen"
USER="www-data"
GROUP="www-data"

echo "Fixing permissions for $PROJECT_DIR..."

# Change ownership to www-data
chown -R $USER:$GROUP $PROJECT_DIR

# Ensure the directory is writable (for SQLite journal files)
chmod 775 $PROJECT_DIR

# Ensure the database file is writable
if [ -f "$PROJECT_DIR/neuroscreen.db" ]; then
    chmod 664 "$PROJECT_DIR/neuroscreen.db"
    echo "Fixed neuroscreen.db permissions"
fi

# Ensure the log file is writable
if [ -f "$PROJECT_DIR/notifications.log" ]; then
    chmod 664 "$PROJECT_DIR/notifications.log"
    echo "Fixed notifications.log permissions"
fi

# Ensure the debug log is writable
if [ -f "$PROJECT_DIR/telegram_debug.log" ]; then
    chmod 664 "$PROJECT_DIR/telegram_debug.log"
    echo "Fixed telegram_debug.log permissions"
fi

echo "Permissions fixed. Restarting service..."
systemctl restart neuroscreen
echo "Done."
