/**
 * FireGuard IoT — ESP32 client (HTTP / HTTPS)
 *
 * Only hardware needed for a live system once Vercel + Supabase are deployed.
 * Posts telemetry and polls control commands from the Next.js API.
 *
 * Libraries:
 *  - WiFi (built-in)
 *  - WiFiClientSecure (built-in) — for Vercel HTTPS
 *  - HTTPClient (built-in)
 *  - ArduinoJson
 *
 * Setup:
 *  1. Sign in to the web app (a DEVICE_KEY is auto-created)
 *  2. Settings → copy the flash snippet
 *  3. Paste WIFI_* / API_* / DEVICE_KEY below and flash
 */

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ---- Configure before flash (copy from Settings) ----
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Vercel example: "your-app.vercel.app", port 443, HTTPS true
// Local Next.js: "192.168.x.x", port 3000, HTTPS false
const char* API_HOST = "YOUR_APP.vercel.app";
const uint16_t API_PORT = 443;
const bool API_HTTPS = true;
const char* DEVICE_KEY = "FG-ESP32-PASTE-FROM-SETTINGS";
// -----------------------------------------------------

const int PIN_SMOKE = 34;
const int PIN_FLAME = 27;
const int PIN_BUZZER = 25;
const int PIN_LED = 2;

bool alarmActive = false;
bool buzzerActive = false;
unsigned long lastTelemetry = 0;
unsigned long lastCommandPoll = 0;

WiFiClientSecure secureClient;
WiFiClient plainClient;

String apiBase() {
  String scheme = API_HTTPS ? "https://" : "http://";
  String base = scheme + API_HOST;
  // Omit default ports from the URL (ESP32 HTTPClient is picky)
  if (!(API_HTTPS && API_PORT == 443) && !(!API_HTTPS && API_PORT == 80)) {
    base += ":";
    base += String(API_PORT);
  }
  return base;
}

bool beginHttp(HTTPClient& http, const String& url) {
  if (API_HTTPS) {
    secureClient.setInsecure(); // presentation / demo TLS (no custom CA)
    return http.begin(secureClient, url);
  }
  return http.begin(plainClient, url);
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

void logHttpError(const char* tag, int code, const String& url) {
  Serial.printf("[%s] %s -> %d", tag, url.c_str(), code);
  if (code == 404) {
    Serial.print(" (unknown DEVICE_KEY — copy key from Settings)");
  } else if (code == 503) {
    Serial.print(" (server missing SUPABASE_SERVICE_ROLE_KEY)");
  } else if (code < 0) {
    Serial.print(" (TLS/network fail — check API_HOST / WiFi)");
  }
  Serial.println();
}

void postTelemetry() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[TEL] WiFi down — reconnecting");
    WiFi.reconnect();
    return;
  }

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
  doc["firmwareVersion"] = "1.1.0-http";

  String payload;
  serializeJson(doc, payload);

  HTTPClient http;
  String url = apiBase() + "/api/iot/telemetry";
  if (!beginHttp(http, url)) {
    Serial.println("[TEL] begin() failed");
    return;
  }
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-device-key", DEVICE_KEY);
  int code = http.POST(payload);
  if (code == 200) {
    Serial.printf("[TEL] OK smoke=%.0f flame=%d\n", smokeLevel, flame ? 1 : 0);
  } else {
    logHttpError("TEL", code, url);
  }
  http.end();
}

void pollCommands() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String url = apiBase() + "/api/iot/telemetry?deviceKey=" + String(DEVICE_KEY);
  if (!beginHttp(http, url)) {
    Serial.println("[CMD] begin() failed");
    return;
  }
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
    logHttpError("CMD", code, url);
  }
  http.end();
}

void setup() {
  Serial.begin(115200);
  delay(300);
  pinMode(PIN_FLAME, INPUT_PULLUP);
  pinMode(PIN_BUZZER, OUTPUT);
  pinMode(PIN_LED, OUTPUT);
  digitalWrite(PIN_BUZZER, LOW);
  setLed("green");

  Serial.println();
  Serial.println("FireGuard ESP32");
  Serial.printf("API: %s\n", apiBase().c_str());
  Serial.printf("KEY: %s\n", DEVICE_KEY);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting WiFi");
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED) {
    delay(400);
    Serial.print(".");
    if (millis() - start > 30000) {
      Serial.println();
      Serial.println("WiFi timeout — check WIFI_SSID / WIFI_PASSWORD");
      break;
    }
  }
  Serial.println();
  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
  }
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
