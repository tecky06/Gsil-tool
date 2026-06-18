# GSIL Working Tool

GSIL is now a working full-stack prototype:

- Static frontend in `outputs/gsil-netlify-static`
- Express backend in `backend`
- Supabase/PostgreSQL persistence for vendors, signals, audit events, tasks, decisions, connectors and QBR snapshots
- Netlify-ready static zip at `outputs/gsil-netlify-static.zip`

## Run Locally

1. Start the backend:

```bash
cd backend
npm install
npm start
```

2. Start the frontend static server from the project root:

```bash
python3 -m http.server 4210 --directory outputs/gsil-netlify-static
```

3. Open the real backend-connected app:

```text
http://localhost:4210/?fresh=20260618-working-tool&backend=1
```

## Share With Team As A Hosted Tool

Use the Option 2 deployment guide:

```text
DEPLOY_OPTION_2.md
```

Once frontend and backend are hosted, share this URL pattern:

```text
https://YOUR-NETLIFY-SITE.netlify.app/?backend=1&backendUrl=https://YOUR-RENDER-SERVICE.onrender.com
```

That link opens GSIL in backend mode and connects to the hosted Render API.

Demo login:

```text
admin@gsil.demo / Admin@123
head@gsil.demo / Head@123
analyst@gsil.demo / Analyst@123
finance@gsil.demo / Finance@123
viewer@gsil.demo / Viewer@123
```

## What Is Working

- Vendor portfolio dashboard
- PRISM scoring and score movement
- Approval Gate
- Internal Gate
- Coupa and LittleBig demo connector sync
- Procurement Copilot
- Executive Watchlist
- Task Board
- Decision workflow
- QBR snapshot generation
- Quarterly, FY, portfolio, QBR and action-brief downloads
- PostgreSQL persistence for core records, tasks and decisions

## Monday Demo Flow

1. Dashboard: show portfolio PRISM, pending gate and executive attention.
2. Executive Watchlist: show Wipro/KPMG style owner decisions.
3. Copilot: ask “Which vendors need action today?”
4. Create task from Copilot answer.
5. Task Board: show the task persisted.
6. Approval Gate: show human review before scores move.
7. Internal Gate: show internal evidence can affect PRISM.
8. Audit Trail: generate QBR and download reports.
9. Production: explain what remains before real rollout.

## Current Production Gap

This is a full-stack prototype, not a hardened enterprise deployment yet. Remaining production work:

- Real SSO/auth instead of demo login
- Deployed backend on Render/Railway/Fly
- Netlify frontend configured with production backend URL
- Secrets management
- Role enforcement on backend, not only frontend
- Real Coupa/LittleBig API credentials and schemas
- Monitoring, backups and audit retention policy
