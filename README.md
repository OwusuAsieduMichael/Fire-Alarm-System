# FireGuard IoT

Premium fire alarm monitoring and control platform for ESP32-powered systems.

Monorepo:

- `apps/web` — Next.js App Router dashboard (TypeScript, Tailwind, Framer Motion, React Query, Zustand, Socket.IO, Recharts)
- `apps/api` — NestJS API (JWT auth, Prisma, Socket.IO, ESP32 simulator)
- `firmware/fireguard_esp32` — ESP32 sketch for live telemetry + control

## Quick start

### Prerequisites

- Node.js 20+
- npm 10+

### Install

On Windows, preferred one-shot setup:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\setup.ps1
```

Or manually (install each app if workspace install fails):

```bash
cd apps/api && npm install --legacy-peer-deps
cd ../web && npm install --legacy-peer-deps
cd ../.. && npm install --legacy-peer-deps
```

### Database (SQLite for local demo)

```bash
cd apps/api
npx prisma generate
npx prisma db push
npx ts-node prisma/seed.ts
```

> Production can point Prisma at PostgreSQL/Supabase by changing `provider` and `DATABASE_URL` in `apps/api/prisma/schema.prisma` and `apps/api/.env`.

### Run

```bash
npm run dev
```

- Web: http://localhost:3000
- API: http://localhost:4000

### Demo accounts

| Role | Email | Password |
|------|-------|----------|
| Developer | `developer@fireguard.io` | `FireGuard@2026` |
| User | `user@fireguard.io` | `FireGuard@2026` |

Seeded device key: `FG-ESP32-DEMO-001`

## Features

- Role-based auth (User / Developer)
- Live dashboard with smoke charts and alert feed
- LCD simulation, LED/buzzer visuals
- Alarm test / reset / emergency / buzzer controls
- Notifications with acknowledge
- Settings: theme, smoke threshold, calibration
- Developer diagnostics + debug console
- Socket.IO realtime + automatic reconnect
- Built-in ESP32 simulator when no hardware is connected

## Environment

### API (`apps/api/.env`)

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="fireguard-dev-secret-change-in-production"
JWT_EXPIRES_IN="7d"
PORT=4000
CORS_ORIGIN="http://localhost:3000"
```

### Web (`apps/web/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=http://localhost:4000
```

## ESP32

1. Flash `firmware/fireguard_esp32/fireguard_esp32.ino`
2. Set WiFi + `SERVER_HOST` + `DEVICE_KEY`
3. Device connects on Socket.IO namespace `/iot` with `deviceKey`
4. Emits `sensor:data`; receives `control:command`

While hardware is offline, the API simulator streams live values every 2 seconds.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | API + web concurrently |
| `npm run build` | Production build |
| `npm run db:seed` | Seed users + demo device |

## Architecture

```
Web (Next.js) ──REST/JWT──▶ NestJS API ──Prisma──▶ SQLite/Postgres
       │                        │
       └────── Socket.IO ───────┼──▶ Dashboard clients
                                └──▶ ESP32 (/iot) + simulator
```
