# wincon

A small Clash Royale clan analytics page built with React + TypeScript + Vite.

## What it shows

- Clan details + computed MVP
- Clan war performance graphs (trophies, fame, placement)
- Member performance rankings
- Member awards (winrate, donations, climbed, hardstuck, ghost)

## Run locally

```bash
npm install
npm run dev
```

Set `CR_API_KEY` in `.env` for local dev proxy access.
In Cloudflare Pages, set `CR_API_KEY` as a project secret (Preview + Production).
