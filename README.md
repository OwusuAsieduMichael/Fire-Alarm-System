# FireGuard IoT

Premium fire alarm monitoring web app. Auth and data use **Supabase**. Live sensor values appear only when the **ESP32** posts telemetry — there is no dashboard simulator.

## Architecture

```
Browser (Next.js)
    │  /api/*  (user JWT)
    ▼
Supabase  ←──  ESP32 POST /api/iot/telemetry  (x-device-key)
```

- **Frontend:** Next.js (`apps/web`)
- **Auth / DB:** Supabase
- **Hardware:** ESP32 sketch in `firmware/`
- NestJS (`apps/api`) is optional legacy Socket.IO path (simulator disabled)

## Setup

1. Copy `apps/web/.env.local.example` → `apps/web/.env.local`
2. Add Supabase URL, publishable/anon key, and **secret/service_role** key
3. Run `supabase/schema.sql` (or the patch SQL files if schema already exists)
4. `cd apps/web && npm install --legacy-peer-deps && npm run dev`
5. Sign up in the app (full name, email, SMS, password)

Promote a developer:

```sql
update public.profiles set role = 'DEVELOPER' where email = 'you@example.com';
```

Details: [`supabase/README.md`](./supabase/README.md)

## ESP32

Flash `firmware/fireguard_esp32/fireguard_esp32.ino` after setting Wi‑Fi + `API_HOST` + `DEVICE_KEY` (`FG-ESP32-DEMO-001` matches the seeded offline device).

- Telemetry: `POST /api/iot/telemetry`
- Commands: `GET /api/iot/telemetry`

Until the board is online, the UI correctly shows **OFFLINE / Waiting for ESP32**.

## Vercel

Root Directory: `apps/web`. Set the same Supabase env vars. Remove obsolete `GAS_SCRIPT_URL` if present. Do not set `NEXT_PUBLIC_API_URL` unless you host Nest separately.

## Repo layout

| Path | Purpose |
|------|---------|
| `apps/web` | Next.js UI + API (Supabase + ESP32 ingest) |
| `apps/api` | Optional NestJS |
| `firmware/` | ESP32 HTTP client |
| `supabase/` | Schema + setup notes |
