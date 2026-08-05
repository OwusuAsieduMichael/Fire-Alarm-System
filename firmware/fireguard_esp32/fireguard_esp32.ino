/**
 * FireGuard IoT — ESP32 client sketch
 * Streams sensor telemetry to the NestJS Socket.IO gateway (/iot)
 * and accepts control commands (test/reset/emergency/buzzer).
 *
 * Libraries:
 *  - WiFi (built-in)
 *  - ArduinoJson
 *  - WebSocketsClient (Links2004/arduinoWebSockets)
 *
 * Configure WIFI_SSID, WIFI_PASSWORD, SERVER_HOST, DEVICE_KEY before flashing.
 */

#include <WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>

const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* SERVER_HOST = "192.168.1.10"; // FireGuard API host
const uint16_t SERVER_PORT = 4000;
const char* DEVICE_KEY = "FG-ESP32-DEMO-001";

// Pins — adjust to your wiring
const int PIN_SMOKE = 34;   // MQ-2 analog
const int PIN_FLAME = 27;   // digital flame sensor
const int PIN_BUZZER = 25;
const int PIN_LED = 2;

WebSocketsClient webSocket;
bool alarmActive = false;
bool buzzerActive = false;
unsigned long lastTelemetry = 0;

void setLed(const char* status) {
  if (strcmp(status, "red") == 0 || strcmp(status, "on") == 0) {
    digitalWrite(PIN_LED, HIGH);
  } else {
    digitalWrite(PIN_LED, LOW);
  }
}

void applyControl(const char* action) {
  if (strcmp(action, "test-alarm") == 0 || strcmp(action, "emergency") == 0) {
    alarmActive = true;
    buzzerActive = true;
    setLed("red");
  } else if (strcmp(action, "reset-alarm") == 0) {
    alarmActive = false;
    buzzerActive = false;
    setLed("green");
  } else if (strcmp(action, "buzzer-on") == 0) {
    buzzerActive = true;
  } else if (strcmp(action, "buzzer-off") == 0) {
    buzzerActive = false;
  }
  digitalWrite(PIN_BUZZER, buzzerActive ? HIGH : LOW);
}

void sendTelemetry() {
  int smokeRaw = analogRead(PIN_SMOKE);
  bool flame = digitalRead(PIN_FLAME) == LOW; // active-low typical
  float smokeLevel = smokeRaw; // map/calibrate as needed

  if (smokeLevel > 300 || flame) {
    alarmActive = true;
    buzzerActive = true;
    setLed("red");
  }

  digitalWrite(PIN_BUZZER, buzzerActive ? HIGH : LOW);

  StaticJsonDocument<384> doc;
  doc["smokeLevel"] = smokeLevel;
  doc["flameDetected"] = flame;
  doc["temperature"] = 24.0; // replace with DHT/BME if available
  doc["humidity"] = 45.0;
  doc["buzzerActive"] = buzzerActive;
  doc["ledStatus"] = alarmActive ? "red" : "green";
  doc["alarmActive"] = alarmActive;
  doc["lcdMessage"] = flame ? "FIRE DETECTED!" : (alarmActive ? "SMOKE ALERT!" : "Monitoring...");

  String payload;
  serializeJson(doc, payload);
  webSocket.sendTXT(payload);
}

void webSocketEvent(WStype_t type, uint8_t* payload, size_t length) {
  switch (type) {
    case WStype_CONNECTED:
      Serial.println("[WS] Connected to FireGuard /iot");
      break;
    case WStype_DISCONNECTED:
      Serial.println("[WS] Disconnected — auto reconnect enabled");
      break;
    case WStype_TEXT: {
      StaticJsonDocument<384> doc;
      if (deserializeJson(doc, payload, length)) break;
      if (doc.containsKey("action")) {
        applyControl(doc["action"]);
      } else if (doc["event"] == "control:command" || doc.containsKey("state")) {
        const char* action = doc["action"] | "";
        if (strlen(action) > 0) applyControl(action);
      }
      break;
    }
    default:
      break;
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_FLAME, INPUT_PULLUP);
  pinMode(PIN_BUZZER, OUTPUT);
  pinMode(PIN_LED, OUTPUT);
  digitalWrite(PIN_BUZZER, LOW);
  setLed("green");

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(400);
    Serial.print(".");
  }
  Serial.println();
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());

  // Socket.IO-compatible path for ESP clients using raw WS libraries may vary.
  // Prefer a Socket.IO Arduino client in production; this sketch demonstrates the payload contract.
  String path = String("/socket.io/?EIO=4&transport=websocket&deviceKey=") + DEVICE_KEY;
  webSocket.begin(SERVER_HOST, SERVER_PORT, path.c_str());
  webSocket.setReconnectInterval(2000);
  webSocket.onEvent(webSocketEvent);
}

void loop() {
  webSocket.loop();
  if (millis() - lastTelemetry > 2000) {
    lastTelemetry = millis();
    if (webSocket.isConnected()) {
      sendTelemetry();
    }
  }
}
