# PulsePoint — Hospital Management System

Hospital Management System built with the PERN stack (PostgreSQL + Express + React + Node). It supports patients, doctors, admins, appointments, prescriptions, medical history, and an “advanced booking” flow (schedules → slots → triage → notifications).

## Repo layout

- `server/` — Express API (default: `http://localhost:5000`)
- `client/` — React + Vite app (default: `http://localhost:5173`)
- `schema.sql` — base DB schema
- `schema_enhancements.sql` — advanced booking tables/triggers
- `demo_users.sql` — demo accounts
- `AUTHENTICATION.md`, `ADVANCED_FEATURES.md`, `SETUP.md`, `QUICKSTART.md` — additional docs

## Prerequisites

- Node.js 16+ (Node 18+ recommended)
- PostgreSQL 13+
- `psql` available in PATH (or use pgAdmin/DBeaver to run SQL files)

## Quick start (Windows)

### 1) Create DB + load schema

```sql
CREATE DATABASE hospital_management;
```

From the project root:

```bash
psql -U postgres -d hospital_management -f schema.sql
psql -U postgres -d hospital_management -f schema_enhancements.sql
```

Optional (only if you are upgrading an older DB):

```bash
psql -U postgres -d hospital_management -f auth_migration.sql
```

### 2) Seed minimal reference data (required for demo users)

`demo_users.sql` expects a department with `dept_id = 1`.

If you’re starting from a fresh DB, run this once before `demo_users.sql` (it will become `dept_id = 1` on an empty table):

```sql
INSERT INTO departments (name) VALUES ('General') ON CONFLICT DO NOTHING;
```

If your `departments` table already has rows, either ensure there is a row with `dept_id = 1`, or update `demo_users.sql` to reference an existing `dept_id`.

Then load demo users:

```bash
psql -U postgres -d hospital_management -f demo_users.sql
```

### 3) Run the backend

```bash
cd server
npm install
```

Create `server/.env`:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hospital_management
DB_USER=postgres
DB_PASSWORD=your_password
```

Start the API:

```bash
npm run dev
```

Health check: `GET http://localhost:5000/health`

### 4) Run the frontend

```bash
cd client
npm install
npm run dev
```

The frontend is configured to call the API via `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

## Demo accounts

All demo accounts use the password: `password123`

| Role    | Email                |
| ------- | -------------------- |
| Admin   | admin@pulsepoint.com |
| Doctor  | doctor@test.com      |
| Doctor  | dr.jones@test.com    |
| Doctor  | dr.wilson@test.com   |
| Patient | patient@test.com     |
| Patient | jane.doe@test.com    |

## API base routes

- Base path: `http://localhost:5000/api`
- Auth: `/api/auth/*` (JWT)
- Core modules: `/api/users`, `/api/patients`, `/api/doctors`, `/api/appointments`, `/api/prescriptions`, `/api/hospitals`, etc.

For auth details and protected routes, see `AUTHENTICATION.md`.

## More docs

- `QUICKSTART.md` — walkthrough of the main flows
- `SETUP.md` — detailed setup + troubleshooting
- `AUTHENTICATION.md` — JWT auth, roles, endpoints
- `ADVANCED_FEATURES.md` — schedules/slots/triage/notifications

## License

This project is licensed under the GNU GPL v3.0 — see `LICENSE`.

---

**Note**: This is a DBMS project. For production use, additional security measures and testing are required.
A healthcare management software aimed at integrating &amp; streamlining the processes for the medical industries.
