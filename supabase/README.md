# FireGuard + Supabase

## 1. Create a project

1. Open [supabase.com](https://supabase.com) → New project  
2. Copy **Project URL**, **publishable/anon** key, and **secret/service_role** key

## 2. Apply the schema

1. Dashboard → **SQL** → New query  
2. Paste [`schema.sql`](./schema.sql) → Run  
3. If you already ran an older schema, also run:
   - [`patch-profile-phone.sql`](./patch-profile-phone.sql)
   - [`patch-device-commands.sql`](./patch-device-commands.sql)

Creates:

- `profiles` (Auth users + SMS contact)
- `devices`, `sensor_readings`, `alerts`, `connection_logs`, `device_commands`
- One **OFFLINE** placeholder device (`FG-ESP32-DEMO-001`) — no fake live data

## 3. Auth

Enable Email provider. For local testing you can disable **Confirm email**.

Sign up in the web app (full name, email, SMS, password). Login uses email + password.

Promote a developer:

```sql
update public.profiles
set role = 'DEVELOPER'
where email = 'you@example.com';
```

## 4. Env (`apps/web/.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-or-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-secret-key
```

`SUPABASE_SERVICE_ROLE_KEY` is required for ESP32 ingest (`POST /api/iot/telemetry`).

## 5. ESP32 contract

- **Telemetry:** `POST /api/iot/telemetry`  
  Header `x-device-key: FG-ESP32-DEMO-001`  
  Body: `{ "smokeLevel": 120, "flameDetected": false, ... }`
- **Commands:** `GET /api/iot/telemetry` with same header — returns queued controls

See `firmware/fireguard_esp32/fireguard_esp32.ino`.
