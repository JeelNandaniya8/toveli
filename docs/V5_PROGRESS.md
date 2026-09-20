# Toveli: places, following and local AI

Implemented September 20, 2026. This is an incremental web-app release, not a launch-ready native application.

## Included

* Up to six optional places in profile preferences: society, area, college, workplace, each with city and explicit matching consent. Names are normalized for comparison. These are self-reported affiliations, not verification.
* Same-age discovery through a common opted-in place, including people at different primary campuses. Only mutually shared affiliations are included in other members' API responses. Residential matching is disabled server-side for teen accounts.
* Follow/unfollow, eligible follower/following counts and a chronological Following home tab. Mutual connection acceptance is still required for direct messages. Blocking removes follows in both directions.
* Existing posts retain their original campus/age audience. Following someone from another campus does not expose their campus posts. The Following tab currently filters the latest loaded campus posts; a paginated cross-community following feed and explicit per-post audiences remain work to do.
* Optional local semantic ranking in a dedicated browser worker using Transformers.js 3.8.1 and quantized Xenova/all-MiniLM-L6-v2. No inference API key. Only chosen interests and goals enter the model. Names, biographies, places and messages are excluded from embedding inputs. Up to 50 already-eligible people are reordered, using cosine similarity plus shared-place and intention weights. Scores are not displayed as friendship probabilities.
* Explicit start, cancel, off, retry and failure fallback for AI. No model download until the user chooses it. Public model/runtime hosts receive standard download metadata, including IP; profile text is not sent for inference. Model downloads use bandwidth and local execution uses device memory/CPU. Browser cache may retain public model files after turning AI off.

## Upgrade

Use Node 22.13 or newer. Back up the database before deploying code.

```sh
npm ci
npm run db:migrate
npm run build
npm start
```

Migration `0002_eminent_nehzno.sql` adds profile places and follows without replacing old tables. The checked-in `.npmrc` skips unnecessary ONNX server CUDA downloads; this application uses browser WASM. No new environment secrets are required. Keep existing `DATABASE_URL` and origin configuration. Never commit `.env` files.

## Free pilot choices

Keep the existing Render setup for a small test, and use browser AI without a paid model provider. Do not rely on Render's free Postgres for durable storage: its documented lifetime is 30 days. Render's free web service also sleeps after 15 minutes idle and has usage limits. A free external Postgres tier is an option to evaluate before a pilot, not something this release provisions or migrates automatically. No paid resources have been created.

Sources checked September 20, 2026:
* https://huggingface.co/docs/transformers.js/en/index
* https://huggingface.co/Xenova/all-MiniLM-L6-v2 (Apache 2.0 model)
* https://render.com/docs/free
* https://supabase.com/pricing

The code can run without paid AI inference. Unlimited hosting, video bandwidth and production operations cannot be guaranteed free.

## Validation and remaining work

Production build, TypeScript, lint, SQL migration/integration tests and React DOM journeys are the automated gates. New tests cover place opt-in, normalization, city separation, age boundaries, hidden affiliations, preserved post audiences, follows, DM consent and block cleanup. Real-device visual QA and actual browser model-download/inference verification remain necessary; compilation and numerical tests do not prove model execution on every browser.

Still pending: verified affiliations, private-account follow approvals, per-post audience controls, durable paginated following feed, dedicated global profile search, temporary location check-ins and notifications, Clips upload/playback with the existing server budget integrated, native mobile packaging, authentication recovery/verification, moderation operations and full account deletion/export. Existing candidate scans remain capped at 1,000 profiles for this pilot; replace with indexed place membership retrieval before scaling. There is no GPS tracking or background proximity notification in this release.
