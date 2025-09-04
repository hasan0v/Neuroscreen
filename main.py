from flask import Flask, send_file, render_template_string, render_template, request, jsonify, Response
from eeg_plot import generate_fft_frames

app = Flask(__name__)

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/focus")
def focus():
    return render_template("focus.html")

@app.route('/eeg_stream')
def eeg_stream():
    return Response(generate_fft_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

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
        f.write(str(default_data))  # Faylı default JSON kimi yazır
    return jsonify({"status": "success", "message": "data.txt resetləndi", "data": default_data})

@app.route("/push_data", methods=["POST"])
def push_data():
    data = request.get_json()
    if not data:
        return jsonify({"error": "JSON göndərin"}), 400

    # data.txt faylına yazır
    with open("data.txt", "w", encoding="utf-8") as f:
        f.write(str(data))  # JSON-un Python dict şəklində saxlanması

    return jsonify({"status": "success", "data_received": data})

if __name__ == "__main__":
      app.run(debug=True, host="0.0.0.0", port=5000)