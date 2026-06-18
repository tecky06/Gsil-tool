# GSIL Backend

This is the Express backend for GSIL. It connects to Supabase/PostgreSQL and powers the full-stack prototype.

## Setup

1. Copy `.env.example` to `.env`.
2. Paste your Supabase connection string into `.env`.

```text
DATABASE_URL=your_supabase_connection_string
PORT=3001
```

3. Install dependencies:

```bash
npm install
```

4. Start backend:

```bash
npm start
```

5. Test in browser:

```text
http://localhost:3001/api/health
```

## Main API Routes

- `GET /api/health`
- `GET /api/vendors`
- `GET /api/state`
- `POST /api/vendors`
- `PATCH /api/vendors/:id`
- `POST /api/scheduler/run-pull`
- `POST /api/connectors/:id/sync`
- `POST /api/signals/:id/approve`
- `POST /api/signals/:id/reject`
- `POST /api/internal-inputs`
- `POST /api/qbr/:vendorId`
- `GET /api/tasks`
- `POST /api/tasks`
- `PATCH /api/tasks/:id`
- `GET /api/decisions`
- `POST /api/decisions`

## Production Notes

The backend currently uses demo header-based role context from the frontend. Before enterprise rollout, add:

- SSO/JWT validation
- Backend role enforcement
- Secret management
- Connector credentials
- Monitoring and alerting
- Database backups and retention policy

## Important

Do not commit or share `.env`. It contains your database password.
