# Toveli

A campus social app for shared interests, small circles, and real plans. This V4 release replaces the old demonstration screens with connected social features and a complete visual redesign.

Built with **Next.js 16, React 19, TypeScript, and PostgreSQL**. It runs as an ordinary Node service on Render. All fonts and cover images ship with the source. There is no external identity-provider requirement.

## What works

- Email/password registration and sign-in with Toveli-owned sessions.
- Interest onboarding and profile editing. People discover each other within the same chosen hub and age group.
- Shared text and photo posts, likes, private bookmarks, comments, and authenticated share links.
- User-created circles, membership, and circle conversations.
- User-created public-place plans, capacity-limited RSVPs, upcoming/past filters, and calendar downloads. Hosts can cancel plans; participants receive a notification.
- Mutual connection requests, accept/decline/cancel actions, and persistent messages after acceptance. Conversation starters use selected interests.
- Notifications, search and filters, profile activity, basic current-data export, blocking, and private reporting.
- A finite feed, desktop sidebar, mobile navigation, native modal focus handling, accessible control labels, and reduced-motion support.
- `/demo`: an explicitly labelled, browser-session sandbox with sample people. It works without a database. The live app starts with real empty states; it never fills a failed database request with fake users.

The implementation and its limits are described in [docs/V4_RELEASE.md](docs/V4_RELEASE.md). Older blueprint documents contain proposed features; they are not a list of features implemented in this release.

## Try the interface first

Use Node.js 22.13 or newer.

```sh
npm ci
npm run dev
```

Open `http://localhost:3000/demo`. The demo supports creating posts, replying, saving, joining, accepting a sample request, and sending a local test message. Sample members never generate pretend live replies.

## Run with real accounts

Create a PostgreSQL database. In the project folder:

```sh
npm ci
cp .env.example .env.local
```

Set `DATABASE_URL` in `.env.local` to your database connection string, then run:

```sh
npm run db:migrate
npm run dev
```

Open `http://localhost:3000`, create an account, and complete your profile. To test real interaction, create two test accounts in separate browser sessions with the same campus and age group. A third account in another age group should not see their content.

## Update your existing Render project

The source download includes complete code. Use [START_HERE.md](START_HERE.md) for replacement and Git patch instructions.

Existing users, password hashes, sessions, community profiles, connections, and messages retain their original tables. Migration `0001_round_warhawk.sql` adds social tables. **Keep migration 0000 and the migration journal.** Old private V3 drafts are not silently published to the new campus feed.

Use these commands in your existing Render web service:

```text
Build command: npm ci && npm run db:migrate && npm run build
Start command: npm start
```

Required environment: `DATABASE_URL`. The service binds to Render's `PORT`. For a custom domain, set `APP_ORIGIN` to that exact public origin, including `https://`. Otherwise the shared origin check uses Render's `RENDER_EXTERNAL_URL` automatically. This preserves the reverse-proxy login fix and applies it consistently to all mutation endpoints.

The included `render.yaml` is also available for a new installation. Plan availability and pricing are controlled by Render. This source release does not deploy your site.

## Verify

```sh
npm test
npm run lint
python3 -m unittest discover -s tests -p 'test_*.py'
```

`npm test` builds the production app and runs Node tests, real PostgreSQL-engine integration tests through PGlite, and React interaction tests in JSDOM. The tests require no external database or credentials. PGlite checks the actual migrations and SQL; it does not test distributed production concurrency or Render infrastructure.

## Deliberate boundaries

This is a working campus MVP. It is not a claim of production readiness at Instagram scale.

There are no paid features, voucher payouts, public video publishing, push notifications, live collaborative canvas, or deployed behavioral AI service. The existing short-consumption reservation endpoint and Python matching primitives are retained as foundations; the new interface does not pretend they are a finished video or AI product. Messaging refreshes on a 20-second visible-tab interval, rather than through WebSockets.

Production preparation still includes account recovery, email verification, login abuse protection, stronger age/campus assurance, moderation operations, backup/restore verification, media storage improvements, and a real-device visual check. These are tracked in [docs/V4_RELEASE.md](docs/V4_RELEASE.md).

Image sources and third-party assets are documented in [docs/ASSETS.md](docs/ASSETS.md).
