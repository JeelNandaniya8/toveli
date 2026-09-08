# Toveli

A standalone working alpha for a social home built around shared interests, small circles, real plans, mutual connections, and a finite feed.

The detailed V3 product strategy is in [docs/PRODUCT_STRATEGY_V3.md](docs/PRODUCT_STRATEGY_V3.md). The technical blueprint remains in [docs/PRODUCT_BLUEPRINT.md](docs/PRODUCT_BLUEPRINT.md).

## Implemented

React/Vinext multi-route app with a redesigned mobile-first Today experience, D1 persistence, independent email/password accounts, expiring pulses, interest onboarding, explainable server-ranked sample profiles, a finite mixed feed, private text posts, likes/saves, circle preferences, introduction drafts, plan drafts, profile controls, and privacy settings. The short-content preview uses atomic five-second server reservations with a 20-minute UTC daily cap.

The alpha also contains a real member foundation: discoverable profiles, same-hub and same-cohort visibility, mutual connection requests, accepted-contact messaging, bidirectional discovery blocks, and server rate limits. Sample discovery content remains clearly labelled. No AI responses, payments, uploaded media, campus verification, or public launch are implemented. The text-based short preview is not production video delivery. Saathi is a separate project and has not been modified.

## Setup

Requirements: Node.js 22+, npm, and PostgreSQL. The included `render.yaml` creates the Render web service and PostgreSQL database together.

```sh
npm ci
cp .env.example .env.local
npm run db:migrate
npm run dev
```

Replace `DATABASE_URL` in `.env.local` with your local PostgreSQL connection string.

## Deploy on Render

Use **New → Blueprint** in Render and select this repository. Render reads `render.yaml`, creates `toveli-db`, injects its internal `DATABASE_URL`, applies the migrations, builds Next.js, and starts the Node web service.

If you create the Render web service manually, use:

```sh
Build command: npm ci && npm run db:migrate && npm run build
Start command: npm start
```

Authentication is owned by Toveli. Passwords use salted PBKDF2-SHA256 hashes and browser sessions use random tokens stored only as SHA-256 hashes in D1. Session cookies are HttpOnly, SameSite=Lax, and Secure in production. Add email verification, password reset, breached-password screening, abuse controls, and production monitoring before inviting public users.

## Verification

```sh
npx tsc --noEmit
python -m unittest discover -s tests -p 'test_*.py'
node --experimental-strip-types --test tests/model.test.mjs
npm run build
```

`services/matching/engine.py` contains tested pure-Python primitives for the future FastAPI/pgvector service. It is not called by the deployed alpha.

## Source and operations

This repository is independent from Saathi and from any development or preview platform. Before a public beta, complete the age-assurance, authorization, moderation, reporting, content safety, media protection and privacy gates documented in the blueprint.

Sample campus photograph: Kaden Taylor on Unsplash, https://unsplash.com/photos/campus-buildings-surrounded-by-trees-at-sunset-xjmmQ06Iprw. Image is an illustrative scene, not an assertion about Silver Oak or Nirma.
