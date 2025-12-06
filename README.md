# Ajudaqi university platform

## Overview

This repository will stay in sync with your deployed chats on [v0.app](https://v0.app).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.app](https://v0.app).

## Deployment

## Build your app

Continue building your app on:

**[https://v0.app/chat/projects/ipXHNXSZETW](https://v0.app/chat/projects/ipXHNXSZETW)**

## How It Works

1. Create and modify your project using [v0.app](https://v0.app)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository

## Database (SQL Server on AWS RDS)

This app includes a basic SQL Server connection using the `mssql` driver and a test API route.

1) Create a `.env.local` file in the project root with:


2) Start the dev server:

```
npm run dev
```

3) Test the connection by visiting:

```
http://localhost:3000/api/db
```

- Success: `{ ok: true, result: true }`
- Failure: `{ ok: false, error: "..." }`

Files added:
- `lib/db.ts`: Shared connection pool and `query` helper
- `app/api/db/route.ts`: Test endpoint that runs `SELECT 1 AS ok`

### Initialize schema and seed data

1) Ensure `.env.local` is configured (see section above). You must set `DB_NAME`.
2) Start dev server:

```
npm run dev
```

3) Create schema (drops existing tables if you pass drop=true):

```
curl -X POST http://localhost:3000/api/db/init?drop=true
```

4) Seed fake data:

```
curl -X POST http://localhost:3000/api/db/seed
```

5) Verify connection:

```
http://localhost:3000/api/db
```
