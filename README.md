# The Talent Table

A football agency player-intelligence app: manage your roster, benchmark players
against 11 leagues and 290 clubs, and export multilingual, client-ready PDF reports.

**Live demo: https://sharks1992.github.io/the-talent-table/**

## Features

- **Our Players** — agency roster with percentile ratings (0–99 vs position family),
  growth vs last season, profile radar, strengths / weaknesses / transfer-club tags,
  scout notes, and Wyscout paste-import. All edits persist locally on the device.
- **Comparison** — Radar / Scatter / Bar views, position frames, league-average or
  per-club references, similar-players mode, up to 8 players side by side.
- **PDF Report** — live A4 preview, 8 optional sections, 6 languages
  (EN / IT / FR / ES / PT / DE), confidential footer. Transfer-club shortlists are
  never exported.
- **Guide key** — permanent in-app user guide (sidebar button) with five diagrams
  covering every workflow.

## Stack

React 19 · TypeScript · Vite · Tailwind CSS · Radix UI · Recharts · jsPDF + html2canvas

## Develop

```bash
npm install
npm run dev
```

`npm run build` type-checks and bundles to `dist/`.

The benchmarking pool (`public/data/*.json`) is fetched at build time in CI
(see `.github/workflows/pages.yml`). For local development, place `roster.json`
and `data.json` under `public/data/`.

## Deploy

Pushes to `main` build and deploy to GitHub Pages automatically via the
included workflow.