# FireGuard IoT

Premium fire alarm monitoring. **Live values come only from the ESP32** — no simulator.

## What you need

| Layer | Required |
|-------|----------|
| Vercel (`apps/web`) | Yes — UI + `/api` |
| Supabase | Yes — auth + data |
| ESP32 | Yes — only hardware |
| NestJS / local DB / GAS | **No** |

```
Browser → Next.js /api (user JWT) → Supabase
ESP32   → Next.js /api/iot/telemetry (x-device-key) → Supabase
```

## Deploy (once)

1. Create a Supabase project and run `supabase/schema.sql`
2. Deploy `apps/web` to Vercel (Root Directory: `apps/web`)
3. Set env vars on Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` ← required for ESP32 ingest + controls
4. Do **not** set `NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_WS_URL` / `GAS_SCRIPT_URL`

## Run the system (ESP32 starts the live function)

1. Open the deployed site → sign up / log in  
   (a device key is **auto-created** for your account)
2. **Settings → ESP32 flash setup** → copy the snippet
3. Paste into `firmware/fireguard_esp32/fireguard_esp32.ino` (Wi‑Fi + `API_HOST` + `DEVICE_KEY`)
4. Flash the board

Until the board posts telemetry, the UI correctly shows **OFFLINE / Waiting for ESP32**.

### ESP32 endpoints

- Telemetry: `POST /api/iot/telemetry` (`x-device-key`)
- Commands: `GET /api/iot/telemetry?deviceKey=...`

## Local development (optional)

```bash
cd apps/web
cp .env.local.example .env.local   # add Supabase keys
npm install --legacy-peer-deps
npm run dev
```

Point the sketch at your PC LAN IP with `API_HTTPS = false` and port `3000`.

## Repo layout

| Path | Purpose |
|------|---------|
| `apps/web` | Next.js UI + API (production path) |
| `firmware/` | ESP32 HTTP client |
| `supabase/` | Schema |
| `apps/api` | Optional legacy NestJS — not required |
