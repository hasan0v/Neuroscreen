import os
import time
import requests

def send_telegram_message(message: str, bot_token: str, chat_id: str):
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


def watch_data_file(data_file: str, bot_token: str, chat_id: str):
    last_modified = None
    last_state = None
    while True:
        try:
            current_modified = os.path.getmtime(data_file)
            if last_modified is None or current_modified != last_modified:
                last_modified = current_modified
                with open(data_file, 'r', encoding='utf-8') as f:
                    data = f.read().strip()
                if data != last_state:
                    last_state = data
                    # Parse data and send notification
                    message = parse_and_format_notification(data)
                    if message:
                        print(f"Sending notification: {message}")
                        send_telegram_message(message, bot_token, chat_id)
                    else:
                        print("No notification triggered for this change.")
            time.sleep(2)
        except Exception as e:
            print(f"Error watching {data_file}: {e}")
            time.sleep(5)


def parse_and_format_notification(data: str) -> str:
    import ast
    needs = {
        'first': 'Water needed',
        'second': 'AC needed',
        'third': 'Restroom needed',
        'fifth': 'SOS/Emergency'
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
            messages.append(f"<b>{label}</b> notification sent.")
    if messages:
        return '\n'.join(messages)
    return None


if __name__ == "__main__":
    # Set your Telegram bot token and chat id here (from user)
    BOT_TOKEN = '8420940286:AAFainPEvTHoI7LfdDlTmAVgZKInH80pXyw'
    CHAT_ID = '6436641398'
    DATA_FILE = os.getenv('DATA_FILE', 'data.txt')

    # Test sending a message immediately for verification
    print("Testing Telegram notification...")
    send_telegram_message("Test: NeuroScreen connection successful!", BOT_TOKEN, CHAT_ID)

    print(f"Watching {DATA_FILE} for changes...")
    watch_data_file(DATA_FILE, BOT_TOKEN, CHAT_ID)
