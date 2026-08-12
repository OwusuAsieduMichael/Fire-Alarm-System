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
   - [`team-messages.sql`](./team-messages.sql) ← shared Notifications inbox for team operators

Creates:

- `profiles` (Auth users + SMS contact)
- `devices`, `sensor_readings`, `alerts`, `connection_logs`, `device_commands`
- `team_messages` (broadcast messages between assigned operators)
- Optional seed device `FG-ESP32-DEMO-001` (developer-only). Normal users get their own key auto-created on first app open.

## 3. Auth

Enable Email provider. Presentation signup uses the service role to confirm email without inbox limits.

Sign up in the web app → a personal `DEVICE_KEY` is provisioned → flash that key onto the ESP32.

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

## Multi-account + traffic

- Unlimited self-serve signup via Supabase Auth (enable Email provider)
- Each account only sees **its own devices** (RLS + `owner_id`)
- Register hardware in **Settings → Register ESP32 device**
- Live polling is adaptive (slower when offline / tab hidden)
- Soft rate limits on live polls, controls, and ESP32 telemetry

Run [`patch-multi-tenant.sql`](./patch-multi-tenant.sql) if your project already had the older open RLS policies.
