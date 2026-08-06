/**
 * FireGuard IoT — ESP32 client (HTTP)
 *
 * Posts telemetry to the Next.js API and polls queued control commands.
 * No simulator — the dashboard stays OFFLINE until this sketch is online.
 *
 * Libraries:
 *  - WiFi (built-in)
 *  - HTTPClient (built-in)
 *  - ArduinoJson
 *
 * Configure WIFI_*, API_HOST, API_PORT, DEVICE_KEY before flashing.
 * Device key must exist in Supabase `devices.device_key`.
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Local Next.js: 192.168.x.x:3000  |  Vercel: your-app.vercel.app with port 443 + HTTPS
const char* API_HOST = "192.168.1.10";
const uint16_t API_PORT = 3000;
const bool API_HTTPS = false;
const char* DEVICE_KEY = "FG-ESP32-DEMO-001";

const int PIN_SMOKE = 34;
const int PIN_FLAME = 27;
const int PIN_BUZZER = 25;
const int PIN_LED = 2;

bool alarmActive = false;
bool buzzerActive = false;
unsigned long lastTelemetry = 0;
unsigned long lastCommandPoll = 0;

String apiBase() {
  String scheme = API_HTTPS ? "https://" : "http://";
  return scheme + API_HOST + ":" + String(API_PORT);
}

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

void postTelemetry() {
  int smokeRaw = analogRead(PIN_SMOKE);
  bool flame = digitalRead(PIN_FLAME) == LOW;
  float smokeLevel = smokeRaw;

  if (smokeLevel > 300 || flame) {
    alarmActive = true;
    buzzerActive = true;
    setLed("red");
  }
  digitalWrite(PIN_BUZZER, buzzerActive ? HIGH : LOW);

  StaticJsonDocument<384> doc;
  doc["smokeLevel"] = smokeLevel;
  doc["flameDetected"] = flame;
  doc["buzzerActive"] = buzzerActive;
  doc["ledStatus"] = alarmActive ? "red" : "green";
  doc["alarmActive"] = alarmActive;
  doc["lcdMessage"] = flame ? "FIRE DETECTED!" : (alarmActive ? "SMOKE ALERT!" : "Monitoring...");
  doc["wifiSsid"] = WIFI_SSID;
  doc["ipAddress"] = WiFi.localIP().toString();
  doc["firmwareVersion"] = "1.0.0-http";

  String payload;
  serializeJson(doc, payload);

  HTTPClient http;
  String url = apiBase() + "/api/iot/telemetry";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-device-key", DEVICE_KEY);
  int code = http.POST(payload);
  Serial.printf("[TEL] POST %s -> %d\n", url.c_str(), code);
  http.end();
}

void pollCommands() {
  HTTPClient http;
  String url = apiBase() + "/api/iot/telemetry?deviceKey=" + String(DEVICE_KEY);
  http.begin(url);
  http.addHeader("x-device-key", DEVICE_KEY);
  int code = http.GET();
  if (code == 200) {
    String body = http.getString();
    StaticJsonDocument<768> doc;
    if (!deserializeJson(doc, body)) {
      JsonArray cmds = doc["commands"].as<JsonArray>();
      for (JsonObject c : cmds) {
        const char* action = c["action"] | "";
        if (strlen(action) > 0) {
          Serial.printf("[CMD] %s\n", action);
          applyControl(action);
        }
      }
    }
  } else {
    Serial.printf("[CMD] GET -> %d\n", code);
  }
  http.end();
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
  Serial.print("API: ");
  Serial.println(apiBase());
}

void loop() {
  if (millis() - lastTelemetry > 2000) {
    lastTelemetry = millis();
    postTelemetry();
  }
  if (millis() - lastCommandPoll > 3000) {
    lastCommandPoll = millis();
    pollCommands();
  }
}
