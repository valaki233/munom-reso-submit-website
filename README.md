# MunoM Submissions (Next.js on Vercel)

Mobile‑first submission app for MunoM. Delegates can submit Resolutions and Amendments. Designed to match the provided screenshots: light blue background, rounded white inputs, and a dark navy pill CTA with a paper‑plane icon.

## Quick Start

1. Install deps
   - npm: `npm install`
   - pnpm: `pnpm install`
2. Dev server: `npm run dev` (http://localhost:3000)
3. Build: `npm run build` then `npm start`

## Design

- Mobile layout with top tabs (Committee | Submit | Executive).
- Bottom nav with a centered circular blue people icon (active).
- Submit header toggles between Resolution/Amendment via a small dropdown.
- Styles are plain CSS (no Tailwind) in `src/styles/globals.css`.

## API & Storage

POST `/api/submit` accepts JSON payloads:

Resolution
```json
{
  "type": "resolution",
  "title": "...",
  "sponsor": "...",
  "content": "..."
}
```

Amendment
```json
{
  "type": "amendment",
  "resolutionNumber": "...",
  "content": "..."
}
```

### Persistence options

- Upstash Redis (recommended on Vercel):
  - Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in Vercel Project → Settings → Environment Variables.
  - Submissions are appended to lists `munom:resolutions` and `munom:amendments` via REST.
- Local dev fallback:
  - Writes to `/tmp/munom/submissions.json` (ephemeral on serverless; use for local/testing only).

## Deploy to Vercel

1. `vercel` (or connect repo in Vercel dashboard)
2. Add env vars if using Upstash Redis
3. Deploy

## Customization

- Colors, spacing, and components are in `src/styles/globals.css` and `src/components/*`.
- The top tabs and bottom nav are simple placeholders for now; link targets can be wired to real pages.

