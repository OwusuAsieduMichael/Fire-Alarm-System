# FireGuard + Supabase

## 1. Create a project

1. Open [supabase.com](https://supabase.com) → New project  
2. Note your **Project URL** and **publishable / anon** key (Settings → API)

## 2. Apply the schema

1. Dashboard → **SQL** → New query  
2. Paste [`schema.sql`](./schema.sql)  
3. Run

If you already ran an older schema, also run [`patch-profile-phone.sql`](./patch-profile-phone.sql) so signup saves **full name** and **SMS contact**.

This creates:

- `profiles` (linked to Supabase Auth users) including `phone` for SMS alerts
- `devices`, `sensor_readings`, `alerts`, `connection_logs`
- RLS policies for authenticated operators
- One demo device (`FG-ESP32-DEMO-001`)

## 3. Auth settings (recommended for first test)

Dashboard → **Authentication** → **Providers** → Email enabled.

For local testing, you can turn off **Confirm email** under Authentication → Providers → Email so signup signs in immediately. With confirm email on, users must click the email link before login works.

Add your app URL under Authentication → URL configuration (e.g. `http://localhost:3000`).

## 4. Local / Vercel env

In `apps/web/.env.local` (and Vercel):

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-or-anon-key
# Optional later for server admin:
# SUPABASE_SERVICE_ROLE_KEY=your-secret-key
```

## 5. Sign up in the app

Use **Sign up** in the web app with:

- Full name  
- Email  
- SMS contact (notification number)  
- Password  

Login uses **email + password** only. SMS numbers are stored on `profiles.phone` for alert delivery.

To promote an operator to developer:

```sql
update public.profiles
set role = 'DEVELOPER'
where email = 'you@example.com';
```
