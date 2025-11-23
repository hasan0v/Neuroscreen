import os
import requests
import ast
import sqlite3
import json
import threading
from flask import Flask, send_file, render_template_string, render_template, request, jsonify, Response
from eeg_plot import simulate_eeg_and_fft

app = Flask(__name__)

# --- Database Setup ---
DB_FILE = 'neuroscreen.db'

def init_db():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS state
                 (id INTEGER PRIMARY KEY, data TEXT)''')
    c.execute('SELECT count(*) FROM state')
    if c.fetchone()[0] == 0:
        default_data = json.dumps({"first": 0, "second": 0, "third": 0, "fifth": 0})
        c.execute('INSERT INTO state (id, data) VALUES (1, ?)', (default_data,))
        conn.commit()
    conn.close()

def get_state():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('SELECT data FROM state WHERE id=1')
    row = c.fetchone()
    conn.close()
    if row:
        return json.loads(row[0])
    return {"first": 0, "second": 0, "third": 0, "fifth": 0}

def update_state(new_data):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    # Ensure we are updating the existing row, not inserting a new one if it exists
    c.execute('UPDATE state SET data=? WHERE id=1', (json.dumps(new_data),))
    if c.rowcount == 0:
        # If no row was updated (e.g. table was empty), insert it
        c.execute('INSERT INTO state (id, data) VALUES (1, ?)', (json.dumps(new_data),))
    conn.commit()
    conn.close()

# Initialize DB on startup
init_db()

# --- Notification storage ---
NOTIFICATION_FILE = 'notifications.log'

def add_local_notification(message: str):
    with open(NOTIFICATION_FILE, 'a', encoding='utf-8') as f:
        f.write(message + '\n')

def get_local_notifications():
    if not os.path.exists(NOTIFICATION_FILE):
        return []
    with open(NOTIFICATION_FILE, 'r', encoding='utf-8') as f:
        return [line.strip() for line in f if line.strip()]

def remove_local_notification(index: int):
    """Remove a specific notification by index"""
    notifications = get_local_notifications()
    if 0 <= index < len(notifications):
        notifications.pop(index)
        # Rewrite the file with remaining notifications
        with open(NOTIFICATION_FILE, 'w', encoding='utf-8') as f:
            for notification in notifications:
                f.write(notification + '\n')
        return True
    return False

def clear_all_notifications():
    """Clear all notifications from the log file"""
    if os.path.exists(NOTIFICATION_FILE):
        open(NOTIFICATION_FILE, 'w').close()
        return True
    return False

# --- Telegram notification logic ---
BOT_TOKEN = '8420940286:AAFainPEvTHoI7LfdDlTmAVgZKInH80pXyw'
CHAT_ID = '6436641398'

def send_telegram_message(message: str, bot_token: str = BOT_TOKEN, chat_id: str = CHAT_ID):
    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": message,
        "parse_mode": "HTML"
    }
    try:
        response = requests.post(url, data=payload)
        print(f"Telegram API response: {response.status_code} {response.text}")
        return response.json()
    except Exception as e:
        print(f"Error sending Telegram message: {e}")
        return None

def send_telegram_async(message):
    """Send Telegram message in a background thread to avoid blocking"""
    threading.Thread(target=send_telegram_message, args=(message,)).start()

def parse_and_format_notification(data_dict: dict) -> str:
    needs = {
        'first': 'Su ihtiyacı',
        'second': 'Klima ihtiyacı',
        'third': 'Tuvalet ihtiyacı',
        'fifth': 'SOS/Acil yardım'
    }
    if not data_dict:
        return None
    
    messages = []
    for key, label in needs.items():
        if str(data_dict.get(key)) == '1':
            messages.append(f"<b>{label}</b> bildirimi gönderildi.")
    if messages:
        return '\n'.join(messages)
    return None

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/focus")
def focus():
    return render_template("focus.html")

@app.route('/eeg_data')
def eeg_data():
    """Return JSON data for client-side rendering"""
    current_state = get_state()
    simulation_data = simulate_eeg_and_fft(current_state)
    return jsonify(simulation_data)

@app.route("/get_data")
def get_data():
    # Return current state as JSON
    return jsonify(get_state())

@app.route("/reset_data", methods=["GET"])
def reset_data():
    default_data = {
        "first": 0,
        "second": 0,
        "third": 0,
        "fifth": 0
    }
    update_state(default_data)
    
    # Send notification for system reset
    notif_msg = "<i class='fa-solid fa-info-circle'></i> Sistem başarıyla sıfırlandı."
    send_telegram_async("<b>Sistem başarıyla sıfırlandı!</b>")
    add_local_notification(notif_msg)
    return jsonify({"status": "success", "message": "Sistem sıfırlandı", "data": default_data})

@app.route("/push_data", methods=["POST"])
def push_data():
    data = request.get_json()
    if not data:
        return jsonify({"error": "JSON göndərin"}), 400

    # Update DB
    update_state(data)

    # Send notification about needs
    notif_msg = parse_and_format_notification(data)
    if notif_msg:
        send_telegram_async(notif_msg)
        # Add each line as a notification item
        for line in notif_msg.split('\n'):
            add_local_notification(f"<i class='fa-solid fa-bell'></i> {line}")
    return jsonify({"status": "success", "data_received": data})

# Endpoint to get notifications for frontend
@app.route('/get_notifications')
def get_notifications():
    return jsonify({"notifications": get_local_notifications()})

# Endpoint to remove individual notification
@app.route('/remove_notification', methods=['POST'])
def remove_notification():
    try:
        data = request.get_json()
        index = data.get('index')
        
        if index is None:
            return jsonify({"status": "error", "message": "Index is required"}), 400
            
        if remove_local_notification(index):
            return jsonify({"status": "success", "message": "Notification removed successfully"})
        else:
            return jsonify({"status": "error", "message": "Invalid notification index"}), 400
            
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# Endpoint to clear all notifications
@app.route('/clear_notifications', methods=['POST'])
def clear_notifications():
    try:
        if clear_all_notifications():
            return jsonify({"status": "success", "message": "All notifications cleared successfully"})
        else:
            return jsonify({"status": "error", "message": "Failed to clear notifications"}), 500
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == "__main__":
      app.run(debug=True, host="0.0.0.0", port=5000)