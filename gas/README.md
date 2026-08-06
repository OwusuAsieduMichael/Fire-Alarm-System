# FireGuard IoT — Google Apps Script Backend

This is the production backend for FireGuard when hosting the UI on Vercel.

## 1. Create the script

1. Open [script.google.com](https://script.google.com)
2. **New project** → rename to `FireGuard IoT API`
3. Paste contents of `Code.gs` into `Code.gs`
4. Project Settings → check **Show "appsscript.json" manifest**
5. Replace manifest with `appsscript.json` (optional)

## 2. Deploy as web app

1. **Deploy** → **New deployment**
2. Type: **Web app**
3. Description: `FireGuard API`
4. Execute as: **Me**
5. Who has access: **Anyone**
6. Deploy → copy the **Web app URL**  
   (`https://script.google.com/macros/s/.../exec`)

## 3. Connect Vercel / Next.js

In Vercel project → Settings → Environment Variables:

| Name | Value |
|------|--------|
| `GAS_SCRIPT_URL` | your `/exec` URL |
| `JWT_SECRET` | any long random string (used only if local fallback runs) |

**Do not set** `NEXT_PUBLIC_API_URL` on Vercel.  
The browser talks to Next `/api/*`, and Next proxies to Apps Script (avoids CORS).

Redeploy Vercel after saving env vars.

## 4. Demo accounts

| Role | Email | Password |
|------|-------|----------|
| Developer | `developer@fireguard.io` | `FireGuard@2026` |
| User | `user@fireguard.io` | `FireGuard@2026` |

## 5. Test the script

In the Apps Script editor, run function `resetStore` once if you need a clean slate.

Health check (browser or curl):

```
GET {WEB_APP_URL}?path=/health
```

## API paths

Same as the Nest/Next API:

- `POST /auth/login`
- `GET /auth/me`
- `GET /devices`
- `GET /sensors/latest`
- `GET /live`
- `POST /controls/test-alarm`
- `POST /controls/reset-alarm`
- `POST /controls/emergency`
- `POST /controls/buzzer`
- `GET /alerts`
- `PATCH /alerts/:id/acknowledge`

State is stored in **Script Properties** (demo-scale). For heavy production data, switch the store to a Google Sheet.
