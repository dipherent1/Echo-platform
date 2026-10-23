# Echo

Echo is a personal productivity tracker for the web. A companion browser
extension records time spent on pages, while this Next.js platform stores the
data, groups it into projects, and turns it into dashboards and AI-powered
insights.

## Features

- **Activity tracking** – receives page URL, title, duration, and timestamp from
  the Echo browser extension.
- **Dashboard** – total tracked time, time by project and domain, top pages,
  activity heatmap, and a recent activity feed.
- **Time range filtering** – today, week, or a custom date range.
- **Projects** – categorize activity automatically with `domain`,
  `url_contains`, or `manual_url` rules.
- **Pages view** – search, sort, paginate, and inspect per-page statistics.
- **AI assistant** – chat with a Gemini-powered agent that can query your
  activity data for today or the last seven days.
- **Authentication** – scrypt-hashed passwords with separate API and dashboard
  session tokens.
- **Onboarding** – guided token generation and extension installation.
- **Observability** – structured JSON logging, Sentry error/replay monitoring,
  and Vercel Analytics.
- **Data retention** – a scheduled cron job removes activity older than two
  weeks.

## Tech stack

| Area          | Technology                                  |
| ------------- | ------------------------------------------- |
| Framework     | Next.js 16 (App Router), React 19           |
| Language      | TypeScript                                  |
| Styling       | Tailwind CSS 4, shadcn/ui, Radix UI         |
| Database      | MongoDB                                     |
| AI            | Vercel AI SDK, Google Gemini 2.5 Flash Lite  |
| Data fetching | SWR                                         |
| Monitoring    | Sentry, Vercel Analytics                    |
| Deployment    | Vercel                                      |

## Getting started

### Prerequisites

- Node.js 20+
- pnpm
- A MongoDB database (Atlas or self-hosted)
- A Google AI API key (for the chat assistant)

### Installation

```bash
pnpm install
```

Create `.env.local` in the project root:

```bash
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/<database>

# Required for the AI assistant
GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_key

# Optional
NEXT_PUBLIC_APP_URL=http://localhost:3000
AI_GATEWAY_API_KEY=your_ai_gateway_key
SENTRY_AUTH_TOKEN=your_sentry_token
```

> `MONGODB_URI` is required at startup. `NEXT_PUBLIC_APP_URL` is used for CORS
> alongside Chrome/Firefox extension origins.

Run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000), register an account, and
follow the onboarding flow to generate an API token for the extension.

### Browser extension

Install the companion extension from
[dipherent1/Echo-chrome-extention](https://github.com/dipherent1/Echo-chrome-extention):

1. Clone the repository.
2. Open `chrome://extensions/` and enable **Developer mode**.
3. Choose **Load unpacked** and select the cloned folder.
4. Open the Echo extension and paste the API token from onboarding.

## Project structure

```
app/
  api/                  REST API route handlers
  onboarding/           Token and extension setup
  page.tsx              Auth gate + dashboard shell
components/
  AI/                   Chat widget
  auth/                 Sign-in / registration form
  dashboard/            Charts, heatmap, pages, projects, tokens
  ui/                   shadcn/ui primitives
lib/
  repository/           MongoDB queries
  services/             Business logic
  auth.ts               Password hashing and token authentication
  db.ts                 Cached MongoDB connection
  types.ts              Shared domain types
scripts/
  verify-auth-separation.mjs  Session/API token verification script
```

## API overview

All protected endpoints expect a bearer token:

```http
Authorization: Bearer <token>
```

| Method     | Endpoint                     | Description                                  |
| ---------- | ---------------------------- | -------------------------------------------- |
| `POST`     | `/api/auth/register`         | Create a user and issue tokens               |
| `POST`     | `/api/auth/login`            | Authenticate and retrieve an API token       |
| `GET`      | `/api/auth/validate`         | Validate a token                             |
| `POST`     | `/api/auth/regenerate-token` | Rotate the API token                         |
| `POST`     | `/api/auth/complete-onboarding` | Mark onboarding as complete               |
| `POST`     | `/api/log`                   | Record a page activity entry                 |
| `GET`      | `/api/stats`                 | Aggregated stats (`?range=today\|week\|YYYY-MM-DD`) |
| `GET`      | `/api/pages`                 | List/search pages (`page`, `limit`, `sortBy`, `sortOrder`, `q`) |
| `GET`      | `/api/pages/[id]/stats`      | Per-page stats (`startDate`, `endDate`)      |
| `GET`      | `/api/projects`              | List projects                                |
| `POST`     | `/api/projects`              | Create a project                             |
| `GET`      | `/api/projects/[id]`         | Get a project                                |
| `PATCH`    | `/api/projects/[id]`         | Update a project or its rules                |
| `DELETE`   | `/api/projects/[id]`         | Delete a project                             |
| `POST`     | `/api/chat`                  | AI assistant (streaming UI response)         |
| `POST`     | `/api/health`                | Receive extension health telemetry           |
| `GET`      | `/api/status`                | Check token status                           |
| `GET`      | `/api/cron/cleanup`          | Delete data older than two weeks             |
| `GET`      | `/api/seed?email=<username>` | Seed demo data for a user                    |

### Example: logging activity

```bash
curl -X POST http://localhost:3000/api/log \
  -H "Authorization: Bearer $ECHO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://github.com/pulls",
    "title": "Pull Requests",
    "duration": 120,
    "timestamp": "2026-01-01T10:00:00.000Z"
  }'
```

## Data model

MongoDB collections:

- `users` – username, password hash, API token hash, session token hash, and
  onboarding state.
- `pages` – unique pages per user with AI classification metadata.
- `projects` – named projects with color and matching rules.
- `activity_logs` – time entries linked to a page, project, and user.

## Scripts

```bash
pnpm dev     # Start the development server
pnpm build   # Production build
pnpm start   # Run the production server
pnpm lint    # Run ESLint
```

With the dev server running, verify API/session token separation:

```bash
node scripts/verify-auth-separation.mjs
```

## Deployment

The project is configured for Vercel. Set the environment variables above in
the Vercel dashboard, then deploy. The cleanup job in `vercel.json` runs on the
1st and 15th of every month at 00:00 UTC.

