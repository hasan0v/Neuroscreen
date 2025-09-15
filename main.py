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
import os
import requests
import ast
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

def parse_and_format_notification(data: str) -> str:
    needs = {
        'first': 'Su ihtiyacı',
        'second': 'Klima ihtiyacı',
        'third': 'Tuvalet ihtiyacı',
        'fifth': 'SOS/Acil yardım'
    }
    if not data:
        return None
    try:
        items = ast.literal_eval(data)
    except Exception as e:
        print(f"Error parsing data.txt: {e}")
        return None
    messages = []
    for key, label in needs.items():
        if str(items.get(key)) == '1':
            messages.append(f"<b>{label}</b> bildirimi gönderildi.")
    if messages:
        return '\n'.join(messages)
    return None
from flask import Flask, send_file, render_template_string, render_template, request, jsonify, Response
from eeg_plot import generate_eeg_time_image, generate_eeg_freq_image

app = Flask(__name__)

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/focus")
def focus():
    return render_template("focus.html")

@app.route('/eeg_stream1')
def eeg_stream1():
    return Response(generate_eeg_time_image(), mimetype='image/png')

@app.route('/eeg_stream2')
def eeg_stream2():
    return Response(generate_eeg_freq_image(), mimetype='image/png')

@app.route("/get_data")
def get_data():
    # data.txt faylını göndərir
    return send_file("data.txt", mimetype="text/plain")

@app.route("/reset_data", methods=["GET"])
def reset_data():
    default_data = {
        "first": 0,
        "second": 0,
        "third": 0,
        "fifth": 0
    }
    with open("data.txt", "w", encoding="utf-8") as f:
        f.write(str(default_data))
    # Send notification for system reset
    notif_msg = "<i class='fa-solid fa-info-circle'></i> Sistem başarıyla sıfırlandı."
    send_telegram_message("<b>Sistem başarıyla sıfırlandı!</b>")
    add_local_notification(notif_msg)
    return jsonify({"status": "success", "message": "data.txt resetləndi", "data": default_data})

@app.route("/push_data", methods=["POST"])
def push_data():
    data = request.get_json()
    if not data:
        return jsonify({"error": "JSON göndərin"}), 400

    # Write to data.txt
    with open("data.txt", "w", encoding="utf-8") as f:
        f.write(str(data))

    # Send notification about needs
    notif_msg = parse_and_format_notification(str(data))
    if notif_msg:
        send_telegram_message(notif_msg)
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