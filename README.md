# FireGuard IoT

Premium fire alarm monitoring **web app**.

## Recommended architecture

```
Browser (Vercel / Next.js UI)
    │
    ▼  /api/*
Next.js API routes (CORS-safe proxy)
    │
    ▼  GAS_SCRIPT_URL
Google Apps Script backend (auth, sensors, controls, simulator)
```

- **Frontend:** Next.js on Vercel  
- **Backend:** Google Apps Script web app  
- NestJS in `apps/api` is optional (local/hardware only)

---

## 1) Deploy Google Apps Script backend

See full steps in [`gas/README.md`](./gas/README.md).

Short version:

1. Create a new Apps Script project at [script.google.com](https://script.google.com)
2. Paste [`gas/Code.gs`](./gas/Code.gs)
3. Deploy → Web app → **Anyone** access
4. Copy the `/exec` URL

## 2) Deploy frontend on Vercel

1. Import this GitHub repo
2. Set **Root Directory** to `apps/web`
3. Add environment variable:

| Name | Value |
|------|--------|
| `GAS_SCRIPT_URL` | `https://script.google.com/macros/s/.../exec` |

4. Deploy

Do **not** set `NEXT_PUBLIC_API_URL` on Vercel.

## Demo logins

| Role | Email | Password |
|------|-------|----------|
| Developer | `developer@fireguard.io` | `FireGuard@2026` |
| User | `user@fireguard.io` | `FireGuard@2026` |

## Local development

```bash
cd apps/web
npm install --legacy-peer-deps
npm run dev
```

Without `GAS_SCRIPT_URL`, the app uses the built-in Next.js in-memory API + simulator.

With GAS:

```env
GAS_SCRIPT_URL=https://script.google.com/macros/s/XXXX/exec
```

## Repo layout

| Path | Purpose |
|------|---------|
| `apps/web` | Next.js UI + `/api` proxy |
| `gas/` | Google Apps Script backend |
| `apps/api` | Optional NestJS (ESP32 / Socket.IO) |
| `firmware/` | ESP32 sketch |

## Features

- Role-based login
- Live smoke / flame / device status (2s polling)
- LCD / LED / buzzer visuals
- Alarm test, reset, emergency, buzzer controls
- Alerts + acknowledge
- Settings + developer diagnostics
