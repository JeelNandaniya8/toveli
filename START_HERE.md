# Start here, Jeel

Aa full source code chhe. Ek HTML file ma paste karvanu nathi. Next.js project ne `app`, `components`, `lib`, `db`, `drizzle`, `public` ane configuration files badha joiye.

## Easiest: fresh folder ma open kar

1. ZIP extract kar.
2. Andar nu `toveli` folder VS Code ma open kar.
3. Terminal ma aa run kar:

```sh
npm ci
npm run dev
```

4. Browser ma `http://localhost:3000/demo` open kar. Aa sample users sathe interactive demo chhe. Database vagar pan UI ane actions check kari sakay.
5. Real accounts mate `.env.example` ni copy `.env.local` name thi banav. Tema taru PostgreSQL `DATABASE_URL` set kar.
6. `npm run db:migrate` run kar. Pachi normal home page par thi account create kar.

## Existing GitHub / Render project

GitHub ma release branch select kari ne code review kari sakay. Tare deploy karvu hoy tyare existing Render service ma e branch select kar athva code `main` ma merge kar. Normal Node/Next.js setup j chhe.

For the source ZIP, copy the contents of `toveli` into your project root, where `package.json` lives. Do not nest the new project inside `app`. Preserve your existing `.env.local`. Keep the complete `drizzle` folder from the new source.

The replacement removes these unused files:

```text
app/community/CommunityClient.tsx
app/v3.css
tests/test_community.py
```

Their functionality and relevant checks now live in the new social service and integration tests.

## Optional: apply the included patch

`UPGRADE.patch` is intended for the GitHub main source at commit `89c8a32b0375d9ccbc55661dea34f0744eb45383`, which includes your three Render login-origin fixes. Commit or back up any work you changed after that version first.

Put `UPGRADE.patch` in your existing repository folder and run:

```sh
git switch -c upgrade/toveli-v4
git apply --check UPGRADE.patch
git apply UPGRADE.patch
npm ci
npm run db:migrate
npm run build
```

If the check reports a conflict, do not use force flags. Use the complete source folder or merge the conflicting files while retaining your later edits.

## Render commands

```text
Build: npm ci && npm run db:migrate && npm run build
Start: npm start
```

Set `DATABASE_URL` in Render. If you use a custom domain, also set `APP_ORIGIN=https://your-exact-domain`. On the default Render URL, origin detection is automatic.

No site is deployed by opening this code bundle. Deployment stays with you.
