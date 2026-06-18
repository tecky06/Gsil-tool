# GSIL Option 2 Deployment

This is the team-sharing setup:

- Frontend: Netlify
- Backend: Render
- Database: Supabase PostgreSQL

After this is deployed, your teammate opens one URL. They do not need to install Node, Python or run localhost.

## 1. Push This Folder To GitHub

Upload the whole project folder, including:

- `backend`
- `outputs/gsil-netlify-static`
- `netlify.toml`
- `render.yaml`
- `outputs/gsil-postgres-schema.sql`

Do not upload `backend/.env`.

## 2. Supabase Database

In Supabase SQL Editor, run:

```text
outputs/gsil-postgres-schema.sql
outputs/gsil-seed-vendors.sql
outputs/gsil-seed-signals.sql
```

Then copy your database connection string.

## 3. Deploy Backend On Render

1. Go to Render.
2. New > Blueprint.
3. Connect the GitHub repo.
4. Render should detect `render.yaml`.
5. Add environment variable:

```text
DATABASE_URL=your_supabase_connection_string
```

6. Deploy.
7. Test:

```text
https://YOUR-RENDER-SERVICE.onrender.com/api/health
```

You should see:

```json
{"ok":true,"service":"GSIL Backend"}
```

## 4. Deploy Frontend On Netlify

1. Go to Netlify.
2. Add new site > Import from Git.
3. Select the same repo.
4. Netlify should use `netlify.toml`.
5. Publish directory should be:

```text
outputs/gsil-netlify-static
```

6. Deploy.

## 5. Share This URL

Use this URL pattern:

```text
https://YOUR-NETLIFY-SITE.netlify.app/?backend=1&backendUrl=https://YOUR-RENDER-SERVICE.onrender.com
```

That URL turns backend mode on automatically and points the frontend at the hosted backend.

## Demo Login

```text
admin@gsil.demo / Admin@123
head@gsil.demo / Head@123
analyst@gsil.demo / Analyst@123
finance@gsil.demo / Finance@123
viewer@gsil.demo / Viewer@123
```

## What Works In Hosted Mode

- Vendors load from PostgreSQL
- Signals load from PostgreSQL
- Approval Gate actions persist
- Internal Gate evidence persists
- QBR snapshots persist
- Copilot-created tasks persist
- Watchlist decisions persist
- Audit trail persists
- Coupa/LittleBig demo sync creates backend signals

## Important Limitation

This is a working full-stack prototype. Before real enterprise production, add:

- Real SSO/auth
- Backend role enforcement
- Real Coupa/LittleBig credentials
- Monitoring and alerting
- Backup and retention policy
