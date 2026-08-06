/**
 * FireGuard IoT — Google Apps Script backend
 *
 * Deploy: Deploy → New deployment → Web app
 *   Execute as: Me
 *   Who has access: Anyone
 *
 * Call shape (from Next.js proxy):
 *   GET/POST  SCRIPT_URL?path=/auth/login
 *   Header: Authorization: Bearer <token>  (also accepts body.token / query.token)
 */

var JWT_SECRET_KEY = "JWT_SECRET";
var STORE_KEY = "FIREGUARD_STORE_V1";
var DEMO_PASSWORD = "FireGuard@2026";

/* ========================= HTTP ENTRY ========================= */

function doGet(e) {
  return handleRequest_(e, "GET");
}

function doPost(e) {
  return handleRequest_(e, "POST");
}

function doOptions() {
  return json_({ ok: true });
}

function handleRequest_(e, method) {
  try {
    ensureStore_();
    var path = normalizePath_((e && e.parameter && e.parameter.path) || "/");
    var body = {};
    if (e && e.postData && e.postData.contents) {
      try {
        body = JSON.parse(e.postData.contents);
      } catch (err) {
        body = {};
      }
    }
    if (body.path) path = normalizePath_(body.path);
    if (body.method) method = String(body.method).toUpperCase();

    // Allow method override for clients that can only POST to Apps Script
    if (body._method) method = String(body._method).toUpperCase();

    var token =
      (e && e.parameter && e.parameter.token) ||
      body.token ||
      extractBearer_(e) ||
      "";

    tickSimulator_();

    var result = route_(method, path, body, token, e);
    return json_(result.body, result.status || 200);
  } catch (err) {
    return json_(
      { message: (err && err.message) || "Server error" },
      500
    );
  }
}

function route_(method, path, body, token, e) {
  // Auth
  if (method === "POST" && path === "/auth/login") return login_(body);
  if (method === "POST" && path === "/auth/forgot-password") {
    return ok_({
      message:
        "If an account exists for that email, password reset instructions have been sent.",
    });
  }
  if (method === "GET" && path === "/auth/me") {
    var me1 = requireUser_(token);
    if (me1.error) return me1.error;
    return ok_(publicUser_(me1.user));
  }

  // Users
  if (method === "GET" && path === "/users/me") {
    var me2 = requireUser_(token);
    if (me2.error) return me2.error;
    return ok_(publicUser_(me2.user));
  }
  if (method === "PATCH" && path === "/users/me") {
    var me3 = requireUser_(token);
    if (me3.error) return me3.error;
    return patchProfile_(me3.user, body);
  }

  // Devices
  if (method === "GET" && path === "/devices") {
    var d0 = requireUser_(token);
    if (d0.error) return d0.error;
    return ok_(listDevices_());
  }
  var deviceMatch = path.match(/^\/devices\/([^/]+)$/);
  if (deviceMatch) {
    var d1 = requireUser_(token);
    if (d1.error) return d1.error;
    if (method === "GET") return getDevice_(deviceMatch[1]);
    if (method === "PATCH") {
      if (d1.user.role !== "DEVELOPER") {
        return fail_("Insufficient permissions", 403);
      }
      return patchDevice_(deviceMatch[1], body);
    }
  }
  var logsMatch = path.match(/^\/devices\/([^/]+)\/logs$/);
  if (method === "GET" && logsMatch) {
    var d2 = requireUser_(token);
    if (d2.error) return d2.error;
    return getLogs_(logsMatch[1]);
  }

  // Sensors
  if (method === "GET" && path === "/sensors/latest") {
    var s0 = requireUser_(token);
    if (s0.error) return s0.error;
    var deviceId =
      (e && e.parameter && e.parameter.deviceId) || body.deviceId || "";
    return latestReading_(deviceId);
  }
  var histMatch = path.match(/^\/sensors\/([^/]+)\/history$/);
  if (method === "GET" && histMatch) {
    var s1 = requireUser_(token);
    if (s1.error) return s1.error;
    var limit = Number(
      (e && e.parameter && e.parameter.limit) || body.limit || 60
    );
    return history_(histMatch[1], limit);
  }

  // Alerts
  if (method === "GET" && path === "/alerts") {
    var a0 = requireUser_(token);
    if (a0.error) return a0.error;
    return listAlerts_(e, body);
  }
  if (method === "POST" && path === "/alerts/acknowledge-all") {
    var a1 = requireUser_(token);
    if (a1.error) return a1.error;
    return acknowledgeAll_(
      (e && e.parameter && e.parameter.deviceId) || body.deviceId || ""
    );
  }
  var ackMatch = path.match(/^\/alerts\/([^/]+)\/acknowledge$/);
  if (method === "PATCH" && ackMatch) {
    var a2 = requireUser_(token);
    if (a2.error) return a2.error;
    return acknowledge_(ackMatch[1]);
  }

  // Controls
  if (method === "POST" && path === "/controls/test-alarm") {
    var c0 = requireUser_(token);
    if (c0.error) return c0.error;
    return ok_(applyControl_("test-alarm"));
  }
  if (method === "POST" && path === "/controls/reset-alarm") {
    var c1 = requireUser_(token);
    if (c1.error) return c1.error;
    return ok_(applyControl_("reset-alarm"));
  }
  if (method === "POST" && path === "/controls/emergency") {
    var c2 = requireUser_(token);
    if (c2.error) return c2.error;
    return ok_(applyControl_("emergency"));
  }
  if (method === "POST" && path === "/controls/buzzer") {
    var c3 = requireUser_(token);
    if (c3.error) return c3.error;
    if (typeof body.on !== "boolean") return fail_("on boolean required", 400);
    return ok_(applyControl_(body.on ? "buzzer-on" : "buzzer-off"));
  }

  // Live polling
  if (method === "GET" && path === "/live") {
    var l0 = requireUser_(token);
    if (l0.error) return l0.error;
    return livePayload_();
  }

  // Health
  if (method === "GET" && (path === "/" || path === "/health")) {
    return ok_({
      service: "FireGuard IoT GAS",
      status: "ok",
      time: new Date().toISOString(),
    });
  }

  return fail_("Not found: " + method + " " + path, 404);
}

/* ========================= AUTH ========================= */

function login_(body) {
  var email = String((body && body.email) || "")
    .toLowerCase()
    .trim();
  var password = String((body && body.password) || "");
  if (!email || !password) return fail_("Email and password are required", 400);

  var store = getStore_();
  var user = null;
  for (var i = 0; i < store.users.length; i++) {
    if (store.users[i].email === email) {
      user = store.users[i];
      break;
    }
  }
  if (!user || !verifyPassword_(password, user.passwordHash)) {
    return fail_("Invalid email or password", 401);
  }

  return ok_({
    accessToken: signToken_(user),
    user: publicUser_(user),
  });
}

function requireUser_(token) {
  if (!token) return { error: fail_("Unauthorized", 401) };
  var payload = verifyToken_(token);
  if (!payload) return { error: fail_("Unauthorized", 401) };
  var store = getStore_();
  for (var i = 0; i < store.users.length; i++) {
    if (store.users[i].id === payload.sub) {
      return { user: store.users[i] };
    }
  }
  return { error: fail_("Unauthorized", 401) };
}

function patchProfile_(user, body) {
  var store = getStore_();
  var target = null;
  for (var i = 0; i < store.users.length; i++) {
    if (store.users[i].id === user.id) {
      target = store.users[i];
      break;
    }
  }
  if (!target) return fail_("User not found", 404);
  if (body && typeof body.name === "string" && body.name.trim()) {
    target.name = body.name.trim();
  }
  if (body && body.phone !== undefined) target.phone = body.phone;
  if (body && typeof body.theme === "string") target.theme = body.theme;
  saveStoreObject_(store);
  return ok_(publicUser_(target));
}

function publicUser_(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    theme: user.theme,
    phone: user.phone,
  };
}

function seedPasswordHash_(password, salt) {
  salt = salt || "fireguard-seed";
  var digest = Utilities.computeHmacSha256Signature(password, salt);
  return salt + ":" + toHex_(digest);
}

function verifyPassword_(password, stored) {
  var parts = String(stored).split(":");
  if (parts.length < 2) return false;
  var salt = parts[0];
  var digest = parts.slice(1).join(":");
  var next = toHex_(Utilities.computeHmacSha256Signature(password, salt));
  return next === digest;
}

function signToken_(user) {
  var secret = getJwtSecret_();
  var header = Utilities.base64EncodeWebSafe(
    JSON.stringify({ alg: "HS256", typ: "JWT" })
  ).replace(/=+$/, "");
  var payload = Utilities.base64EncodeWebSafe(
    JSON.stringify({
      sub: user.id,
      email: user.email,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
    })
  ).replace(/=+$/, "");
  var data = header + "." + payload;
  var sig = Utilities.base64EncodeWebSafe(
    Utilities.computeHmacSha256Signature(data, secret)
  ).replace(/=+$/, "");
  return data + "." + sig;
}

function verifyToken_(token) {
  try {
    var parts = String(token).split(".");
    if (parts.length !== 3) return null;
    var data = parts[0] + "." + parts[1];
    var secret = getJwtSecret_();
    var expected = Utilities.base64EncodeWebSafe(
      Utilities.computeHmacSha256Signature(data, secret)
    ).replace(/=+$/, "");
    if (expected !== parts[2]) return null;
    var json = Utilities.newBlob(
      Utilities.base64DecodeWebSafe(padB64_(parts[1]))
    ).getDataAsString();
    var body = JSON.parse(json);
    if (body.exp && body.exp < Math.floor(Date.now() / 1000)) return null;
    return body;
  } catch (err) {
    return null;
  }
}

function getJwtSecret_() {
  var props = PropertiesService.getScriptProperties();
  var secret = props.getProperty(JWT_SECRET_KEY);
  if (!secret) {
    secret = "fireguard-gas-secret-" + Utilities.getUuid();
    props.setProperty(JWT_SECRET_KEY, secret);
  }
  return secret;
}

/* ========================= STORE ========================= */

function ensureStore_() {
  var raw = PropertiesService.getScriptProperties().getProperty(STORE_KEY);
  if (!raw) {
    PropertiesService.getScriptProperties().setProperty(
      STORE_KEY,
      JSON.stringify(createStore_())
    );
  }
}

function getStore_() {
  ensureStore_();
  var raw = PropertiesService.getScriptProperties().getProperty(STORE_KEY);
  return JSON.parse(raw);
}

function saveStore_() {
  // no-op placeholder — callers mutate then call saveStoreObject_
}

function saveStoreObject_(store) {
  PropertiesService.getScriptProperties().setProperty(
    STORE_KEY,
    JSON.stringify(store)
  );
}

function createStore_() {
  var deviceId = "dev_main_hall";
  var now = new Date().toISOString();
  var password = seedPasswordHash_(DEMO_PASSWORD);
  return {
    users: [
      {
        id: "user_developer",
        email: "developer@fireguard.io",
        passwordHash: password,
        name: "FireGuard Developer",
        role: "DEVELOPER",
        theme: "dark",
        phone: "+10000000001",
      },
      {
        id: "user_user",
        email: "user@fireguard.io",
        passwordHash: password,
        name: "FireGuard User",
        role: "USER",
        theme: "dark",
        phone: "+10000000002",
      },
    ],
    devices: [
      {
        id: deviceId,
        name: "Main Hall Sensor",
        deviceKey: "FG-ESP32-DEMO-001",
        status: "ONLINE",
        wifiSsid: "FireGuard-Net",
        ipAddress: "192.168.1.50",
        firmwareVersion: "1.0.0",
        lastSeen: now,
        smokeThreshold: 300,
        smokeCalibration: 0,
        createdAt: now,
      },
    ],
    readings: [],
    alerts: [
      {
        id: "alert_boot",
        deviceId: deviceId,
        type: "SYSTEM",
        severity: "INFO",
        title: "System Online",
        message: "FireGuard Google Apps Script backend is ready.",
        smsStatus: "NONE",
        acknowledged: true,
        createdAt: now,
      },
    ],
    logs: [
      {
        id: "log_boot",
        deviceId: deviceId,
        event: "boot",
        message: "GAS backend started",
        createdAt: now,
      },
    ],
    live: {
      deviceId: deviceId,
      deviceKey: "FG-ESP32-DEMO-001",
      smokeLevel: 85,
      flameDetected: false,
      temperature: 24.2,
      humidity: 46,
      buzzerActive: false,
      ledStatus: "green",
      alarmActive: false,
      lcdMessage: "System Ready",
      status: "ONLINE",
      lastSeen: now,
      realDeviceConnected: false,
    },
    tick: 0,
    lastSimAt: 0,
  };
}

/* ========================= DOMAIN ========================= */

function listDevices_() {
  var store = getStore_();
  return store.devices.map(function (d) {
    return Object.assign({}, d, {
      _count: {
        alerts: store.alerts.filter(function (a) {
          return a.deviceId === d.id;
        }).length,
        sensorReadings: store.readings.filter(function (r) {
          return r.deviceId === d.id;
        }).length,
      },
    });
  });
}

function getDevice_(id) {
  var store = getStore_();
  var device = findById_(store.devices, id);
  if (!device) return fail_("Device not found", 404);
  return ok_(
    Object.assign({}, device, {
      connectionLogs: store.logs
        .filter(function (l) {
          return l.deviceId === id;
        })
        .slice(0, 20),
    })
  );
}

function patchDevice_(id, body) {
  var store = getStore_();
  var device = findById_(store.devices, id);
  if (!device) return fail_("Device not found", 404);
  if (body && typeof body.name === "string") device.name = body.name;
  if (body && typeof body.wifiSsid === "string") device.wifiSsid = body.wifiSsid;
  if (body && typeof body.smokeThreshold === "number") {
    device.smokeThreshold = body.smokeThreshold;
  }
  if (body && typeof body.smokeCalibration === "number") {
    device.smokeCalibration = body.smokeCalibration;
  }
  saveStoreObject_(store);
  return ok_(device);
}

function getLogs_(id) {
  var store = getStore_();
  if (!findById_(store.devices, id)) return fail_("Device not found", 404);
  return ok_(
    store.logs
      .filter(function (l) {
        return l.deviceId === id;
      })
      .slice(0, 50)
  );
}

function latestReading_(deviceId) {
  var store = getStore_();
  var live = store.live;
  var id = deviceId || live.deviceId;
  for (var i = 0; i < store.readings.length; i++) {
    if (store.readings[i].deviceId === id) return ok_(store.readings[i]);
  }
  return ok_({
    id: "live",
    deviceId: live.deviceId,
    smokeLevel: live.smokeLevel,
    flameDetected: live.flameDetected,
    temperature: live.temperature,
    humidity: live.humidity,
    buzzerActive: live.buzzerActive,
    ledStatus: live.ledStatus,
    alarmActive: live.alarmActive,
    lcdMessage: live.lcdMessage,
    createdAt: live.lastSeen,
  });
}

function history_(deviceId, limit) {
  var store = getStore_();
  limit = Math.min(200, Math.max(1, limit || 60));
  return ok_(
    store.readings
      .filter(function (r) {
        return r.deviceId === deviceId;
      })
      .slice(0, limit)
  );
}

function listAlerts_(e, body) {
  var store = getStore_();
  var deviceId =
    (e && e.parameter && e.parameter.deviceId) || body.deviceId || "";
  var acknowledged =
    e && e.parameter && e.parameter.acknowledged !== undefined
      ? e.parameter.acknowledged
      : body.acknowledged;
  var limit = Number(
    (e && e.parameter && e.parameter.limit) || body.limit || 50
  );
  limit = Math.min(200, Math.max(1, limit));

  var alerts = store.alerts.slice();
  if (deviceId) {
    alerts = alerts.filter(function (a) {
      return a.deviceId === deviceId;
    });
  }
  if (acknowledged !== undefined && acknowledged !== null && acknowledged !== "") {
    var flag = String(acknowledged) === "true";
    alerts = alerts.filter(function (a) {
      return a.acknowledged === flag;
    });
  }

  var deviceMap = {};
  store.devices.forEach(function (d) {
    deviceMap[d.id] = d;
  });

  return ok_(
    alerts.slice(0, limit).map(function (a) {
      var d = deviceMap[a.deviceId];
      return Object.assign({}, a, {
        device: d ? { id: d.id, name: d.name } : undefined,
      });
    })
  );
}

function acknowledge_(id) {
  var store = getStore_();
  var alert = findById_(store.alerts, id);
  if (!alert) return fail_("Alert not found", 404);
  alert.acknowledged = true;
  saveStoreObject_(store);
  return ok_(alert);
}

function acknowledgeAll_(deviceId) {
  var store = getStore_();
  var count = 0;
  store.alerts.forEach(function (a) {
    if (deviceId && a.deviceId !== deviceId) return;
    if (!a.acknowledged) {
      a.acknowledged = true;
      count++;
    }
  });
  saveStoreObject_(store);
  return ok_({ success: true, count: count });
}

function applyControl_(action) {
  var store = getStore_();
  var device = store.devices[0];
  var live = store.live;
  var now = new Date().toISOString();

  if (action === "test-alarm") {
    live.alarmActive = true;
    live.buzzerActive = true;
    live.ledStatus = "red";
    live.lcdMessage = "TEST ALARM";
    store.alerts.unshift(makeAlert_(device.id, "SYSTEM", "INFO", "Test Alarm", "Test alarm issued"));
  } else if (action === "reset-alarm") {
    live.alarmActive = false;
    live.buzzerActive = false;
    live.flameDetected = false;
    live.ledStatus = "green";
    live.lcdMessage = "System Ready";
  } else if (action === "emergency") {
    live.alarmActive = true;
    live.buzzerActive = true;
    live.ledStatus = "red";
    live.lcdMessage = "EMERGENCY!";
    store.alerts.unshift(
      makeAlert_(device.id, "FIRE", "CRITICAL", "Emergency Activated", "Emergency issued")
    );
  } else if (action === "buzzer-on") {
    live.buzzerActive = true;
    live.lcdMessage = "BUZZER ON";
  } else if (action === "buzzer-off") {
    live.buzzerActive = false;
    if (!live.alarmActive) live.ledStatus = "green";
    live.lcdMessage = "BUZZER OFF";
  }

  live.lastSeen = now;
  store.logs.unshift({
    id: "log_" + Utilities.getUuid().slice(0, 8),
    deviceId: device.id,
    event: "control",
    message: "Control " + action,
    createdAt: now,
  });
  store.alerts = store.alerts.slice(0, 100);
  store.logs = store.logs.slice(0, 100);
  saveStoreObject_(store);
  return {
    success: true,
    action: action,
    deviceId: device.id,
    state: live,
    message: action + " ok",
  };
}

function livePayload_() {
  var store = getStore_();
  return ok_({
    live: store.live,
    recentAlerts: store.alerts.slice(0, 20),
    smokeHistory: store.readings
      .slice(0, 60)
      .reverse()
      .map(function (r) {
        return {
          timestamp: r.createdAt,
          smokeLevel: r.smokeLevel,
          temperature: r.temperature,
          humidity: r.humidity,
        };
      }),
  });
}

function tickSimulator_() {
  var store = getStore_();
  var now = Date.now();
  if (now - (store.lastSimAt || 0) < 2000) return store.live;

  store.lastSimAt = now;
  store.tick = (store.tick || 0) + 1;
  var device = store.devices[0];
  var live = store.live;
  if (!device || live.realDeviceConnected) {
    saveStoreObject_(store);
    return live;
  }

  var base = 90 + Math.sin(store.tick / 8) * 40;
  var noise = (Math.random() - 0.5) * 30;
  var smokeLevel = Math.max(20, base + noise);
  if (Math.random() < 0.05) {
    smokeLevel = device.smokeThreshold + 50 + Math.random() * 100;
  }
  var flameDetected = Math.random() < 0.015;
  var temperature = 22 + Math.sin(store.tick / 20) * 3 + Math.random();
  var humidity = 40 + Math.cos(store.tick / 15) * 8 + Math.random() * 2;

  if (!live.alarmActive) {
    live.ledStatus = "green";
    live.buzzerActive = false;
    live.lcdMessage = "Monitoring...";
  }

  live.smokeLevel = Math.max(0, smokeLevel + (device.smokeCalibration || 0));
  live.flameDetected = flameDetected;
  live.temperature = Math.round(temperature * 10) / 10;
  live.humidity = Math.round(humidity * 10) / 10;
  live.status = "ONLINE";
  live.lastSeen = new Date().toISOString();
  device.status = "ONLINE";
  device.lastSeen = live.lastSeen;

  if (live.smokeLevel > device.smokeThreshold || flameDetected) {
    live.alarmActive = true;
    live.buzzerActive = true;
    live.ledStatus = "red";
    live.lcdMessage = flameDetected ? "FIRE DETECTED!" : "SMOKE ALERT!";
  }

  if (store.tick % 5 === 0 || live.alarmActive) {
    store.readings.unshift({
      id: "read_" + Utilities.getUuid().slice(0, 8),
      deviceId: device.id,
      smokeLevel: live.smokeLevel,
      flameDetected: live.flameDetected,
      temperature: live.temperature,
      humidity: live.humidity,
      buzzerActive: live.buzzerActive,
      ledStatus: live.ledStatus,
      alarmActive: live.alarmActive,
      lcdMessage: live.lcdMessage,
      createdAt: live.lastSeen,
    });
    store.readings = store.readings.slice(0, 120);
  }

  maybeAlert_(store, device, live);
  saveStoreObject_(store);
  return live;
}

function maybeAlert_(store, device, live) {
  var cutoff = Date.now() - 30000;
  function hasRecent(type) {
    return store.alerts.some(function (a) {
      return (
        a.deviceId === device.id &&
        a.type === type &&
        new Date(a.createdAt).getTime() > cutoff
      );
    });
  }
  if (live.flameDetected && !hasRecent("FIRE")) {
    store.alerts.unshift(
      makeAlert_(
        device.id,
        "FIRE",
        "CRITICAL",
        "Fire Detected",
        "Flame sensor triggered on " + device.name
      )
    );
  } else if (live.smokeLevel > device.smokeThreshold && !hasRecent("SMOKE")) {
    store.alerts.unshift(
      makeAlert_(
        device.id,
        "SMOKE",
        "WARNING",
        "Smoke Threshold Exceeded",
        "Smoke level " +
          Math.round(live.smokeLevel) +
          " exceeded threshold " +
          device.smokeThreshold
      )
    );
  }
  store.alerts = store.alerts.slice(0, 100);
}

function makeAlert_(deviceId, type, severity, title, message) {
  return {
    id: "alert_" + Utilities.getUuid().slice(0, 8),
    deviceId: deviceId,
    type: type,
    severity: severity,
    title: title,
    message: message,
    smsStatus: severity === "CRITICAL" ? "PENDING" : "NONE",
    acknowledged: false,
    createdAt: new Date().toISOString(),
  };
}

/* ========================= UTILS ========================= */

function json_(obj, status) {
  status = status || 200;
  var out = ContentService.createTextOutput(
    JSON.stringify(obj)
  ).setMimeType(ContentService.MimeType.JSON);
  // Status codes via Apps Script web apps are limited; include status in body for proxy.
  if (status !== 200 && obj && typeof obj === "object" && !obj.statusCode) {
    obj.statusCode = status;
    return ContentService.createTextOutput(
      JSON.stringify(obj)
    ).setMimeType(ContentService.MimeType.JSON);
  }
  return out;
}

function ok_(body) {
  return { status: 200, body: body };
}

function fail_(message, status) {
  return { status: status || 400, body: { message: message, statusCode: status || 400 } };
}

function normalizePath_(path) {
  path = String(path || "/");
  if (path.charAt(0) !== "/") path = "/" + path;
  if (path.length > 1 && path.slice(-1) === "/") path = path.slice(0, -1);
  return path;
}

function extractBearer_(e) {
  // Apps Script does not always expose Authorization; proxy sends token query/body.
  try {
    var headers = e && e.headers ? e.headers : {};
    var auth = headers.Authorization || headers.authorization || "";
    var parts = String(auth).split(" ");
    if (parts[0] && parts[0].toLowerCase() === "bearer") return parts[1];
  } catch (err) {}
  return "";
}

function findById_(arr, id) {
  for (var i = 0; i < arr.length; i++) {
    if (arr[i].id === id) return arr[i];
  }
  return null;
}

function toHex_(bytes) {
  return bytes
    .map(function (b) {
      var v = (b < 0 ? b + 256 : b).toString(16);
      return v.length === 1 ? "0" + v : v;
    })
    .join("");
}

function padB64_(s) {
  while (s.length % 4 !== 0) s += "=";
  return s;
}

/** Manual reset from Apps Script editor if needed */
function resetStore() {
  PropertiesService.getScriptProperties().deleteProperty(STORE_KEY);
  ensureStore_();
}
