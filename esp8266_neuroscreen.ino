#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include <Servo.h>

// --- Configuration ---
const char* ssid = "NeuroScreen";
const char* password = "1213123321";
const char* serverURL = "https://neuroscreen.tetym.space/get_data";

// --- Pins ---
#define BUZZER 13  // D7
#define LED3 14    // D5
#define LED2 16    // D0
#define LED4 4     // D2
#define LED1 5     // D1
#define SERVO_PIN 12 // D6

// --- Globals ---
Servo myServo;
WiFiClientSecure client;
unsigned long lastPollTime = 0;
const long pollInterval = 500; // Poll every 500ms for responsiveness

// State variables
bool stateFirst = false;
bool stateSecond = false;
bool stateThird = false;
bool stateFifth = false;

// Blinking logic
unsigned long lastBlinkTime = 0;
bool blinkState = false;
const long blinkInterval = 500; // Blink speed

void setup() {
  Serial.begin(115200);
  
  // Initialize Pins
  pinMode(LED1, OUTPUT);
  pinMode(LED2, OUTPUT);
  pinMode(LED3, OUTPUT);
  pinMode(LED4, OUTPUT);
  pinMode(BUZZER, OUTPUT);
  
  // Initialize Servo
  myServo.attach(SERVO_PIN);
  myServo.write(0); // Initial position

  // Connect to WiFi
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected! IP: " + WiFi.localIP().toString());

  // Allow insecure HTTPS (no cert check)
  client.setInsecure();
}

void updateOutputs() {
  unsigned long currentMillis = millis();

  // Handle Blinking Timing
  if (currentMillis - lastBlinkTime >= blinkInterval) {
    lastBlinkTime = currentMillis;
    blinkState = !blinkState; // Toggle state
  }

  // Apply states to LEDs (Blink if active, LOW if inactive)
  // If active, value is blinkState (HIGH/LOW). If inactive, value is LOW.
  digitalWrite(LED1, stateFirst ? blinkState : LOW);
  digitalWrite(LED2, stateSecond ? blinkState : LOW);
  digitalWrite(LED3, stateThird ? blinkState : LOW);
  
  // LED4 is for 'fifth' (SOS)
  digitalWrite(LED4, stateFifth ? blinkState : LOW);

  // Buzzer logic (Active only when Fifth/SOS is active and in blink 'ON' phase)
  if (stateFifth && blinkState) {
    digitalWrite(BUZZER, HIGH);
  } else {
    digitalWrite(BUZZER, LOW);
  }
  
  // Servo Logic (Optional: Move servo if 'second' is active, else return to 0)
  if (stateSecond) {
      myServo.write(90);
  } else {
      myServo.write(0);
  }
}

void loop() {
  unsigned long currentMillis = millis();

  // 1. Poll Server
  if (currentMillis - lastPollTime >= pollInterval) {
    lastPollTime = currentMillis;

    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      // Use Keep-Alive if possible, but for simple polling new connection is safer on ESP8266
      if (http.begin(client, serverURL)) {
        int httpCode = http.GET();

        if (httpCode > 0) {
          String payload = http.getString();
          // Serial.println("JSON: " + payload); // Debug

          // Parse JSON
          StaticJsonDocument<256> doc;
          DeserializationError error = deserializeJson(doc, payload);

          if (!error) {
            // Update global states
            // Note: Backend sends 0 or 1 (int). 
            stateFirst = doc["first"] == 1;
            stateSecond = doc["second"] == 1;
            stateThird = doc["third"] == 1;
            stateFifth = doc["fifth"] == 1; // Changed from 'fourth' to 'fifth'
          } else {
            Serial.print("JSON Error: ");
            Serial.println(error.c_str());
          }
        } else {
          Serial.printf("HTTP Error: %d\n", httpCode);
        }
        http.end();
      }
    }
  }

  // 2. Update Outputs (Non-blocking)
  updateOutputs();
}