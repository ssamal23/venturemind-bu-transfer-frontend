# BU transfer credit: frontend

React + TypeScript + Tailwind (Vite). Three screens, one per role:

| Role | Screen | What it does |
|---|---|---|
| Student | `/student`, `/student/upload` | See every transferred course and its status, upload a transcript, upload a syllabus when asked |
| Evaluator | `/evaluator` | Review queue; each case opens in a dialog with the AI suggestion, evidence and rule checks, and the decision form |
| Credit office | `/office` | Post decided and matched results to the academic record (grade T), one or in a batch, with a confirmation step |

The app talks to the backend over `/api`. It holds no secrets.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
```

In development, Vite forwards `/api` to `http://localhost:8000` (see `vite.config.ts`), so start the backend first.

To run the screens with built-in sample data and no backend, copy `.env.example` to `.env` and set `VITE_USE_MOCK=true`.

## Demo accounts

Synthetic accounts, all with the password `demo1234`: `student@demo.edu`, `evaluator@demo.edu`, `office@demo.edu`. The login page fills them in for you. Do not expose a deployment that accepts these without restricting who can reach it.

## Build and deploy

```bash
npm run build      # type-checks, then builds to dist/
```

The `Dockerfile` builds the app and serves it with nginx. nginx forwards `/api` to the backend address in the `API_UPSTREAM` environment variable (default `http://bu-api`), so the browser talks to a single origin and the backend needs no public address and no CORS settings.

```bash
docker build -t bu-web .
docker run -p 8080:8080 -e API_UPSTREAM=http://host.docker.internal:8000 bu-web
```

## Settings

| Variable | Default | Meaning |
|---|---|---|
| `VITE_API_BASE` | `/api` | Where the app sends API requests |
| `VITE_USE_MOCK` | `false` | `true` runs on built-in sample data |
| `API_UPSTREAM` (container only) | `http://bu-api` | Where nginx forwards `/api` |
