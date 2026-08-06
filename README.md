# FireGuard IoT

Premium fire alarm monitoring web app.

## Architecture

```
Browser (Vercel / Next.js UI)
    │
    ▼  /api/*
Next.js API routes (local simulator + auth)
    │
    ▼  (in progress)
Supabase — durable auth, devices, sensors, alerts
```

- **Frontend:** Next.js on Vercel
- **Backend target:** Supabase (Google Apps Script has been removed)
- NestJS in `apps/api` remains optional for ESP32 / Socket.IO hardware work

---

## Deploy frontend on Vercel

1. Import this GitHub repo
2. Set **Root Directory** to `apps/web`
3. Set `JWT_SECRET` (and Supabase vars when ready)
4. Deploy

Do **not** set `NEXT_PUBLIC_API_URL` on Vercel unless you host NestJS separately.

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

Copy `apps/web/.env.local.example` → `apps/web/.env.local` and fill values.

Without Supabase credentials, the app uses the built-in Next.js in-memory API + simulator.

## Supabase setup

See [`supabase/README.md`](./supabase/README.md) for schema + demo users.

1. Create a Supabase project  
2. Run `supabase/schema.sql` in the SQL editor  
3. Add env vars from `apps/web/.env.local.example`

## Important: Vercel env cleanup

Remove **`GAS_SCRIPT_URL`** from Vercel (and any local `.env`) if it is still set. That variable is obsolete.

## Repo layout

| Path | Purpose |
|------|---------|
| `apps/web` | Next.js UI + `/api` routes |
| `apps/api` | Optional NestJS (ESP32 / Socket.IO) |
| `firmware/` | ESP32 sketch |

## Features

- Role-based login
- Live smoke / flame / device status (2s polling)
- LCD / LED / buzzer visuals
- Alarm test, reset, emergency, buzzer controls
- Alerts + acknowledge
- Settings + developer diagnostics
