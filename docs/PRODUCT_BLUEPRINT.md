# Toveli: product decision and execution blueprint

Version 0.1 • 7 September 2026 • Jeel Nandaniya’s social platform

## 1. The decision

**Name: Toveli.** Pronounced toh-veh-lee. A short brand name with no spiritual or numerological promise. The product can give the word its meaning through what it does. This is the selected build name, not a claim of trademark, domain, or handle availability. Preliminary searches found unrelated uses; formal clearance remains a launch dependency.

**Product promise: Find your people. Make something of it.** Help people discover shared interests nearby, start a comfortable conversation, and turn it into a small activity. Reducing isolation is the mission; the app must not promise to eradicate loneliness or treat a health condition.

The Instagram/Facebook ambition is a long-term direction. The first product should win one repeatable use case: a student finds a small group or compatible peer, proposes a simple activity, and returns because the connection was useful. Having every content format alone will not make people switch.

## 2. What the original conversations got right

Keep the unified text/photo/short-content feed; campus-first discovery; explicit interests and intentions; interest-based icebreakers; circles; collaborative activities; a finite short-content allowance; optional public-place meetup offers; and web before native apps.

Launch with a small real community. Density matters because people need relevant choices in their ordinary surroundings. An invitation should make onboarding manageable and protect the pilot, not manufacture anxiety with fictitious counters or exaggerated exclusivity.

The user's original concern is particularly important: compatible people can share a campus without ever encountering one another. Discovery must therefore bridge departments and existing friend groups, not merely recommend the most popular accounts.

## 3. Ideas to change or reject

| Original proposal | Decision | Reason |
|---|---|---|
| Forced 85–99% match scores | Show a similarity index and its inputs | The formula is not a validated friendship probability; low scores must remain low |
| AI reads all user data | Explicit scope and separate consent | Browsing, private messages, mental-health information and journals are not interchangeable inputs |
| Psychological profiling from ten images | Optional interest selection | Aesthetic preference is weak evidence about personality or values |
| Ghosting penalty | Reject | Silence or declining a stranger is a legitimate boundary |
| Public reply-rate badge | Reject in v1 | Availability differs; it can pressure people to reply and reward superficial messages |
| Exact watch-history explanations | Show only mutually visible interest tags | Explanations must not reveal private activity or timestamps |
| Live similarity bumps when two people watch together | Defer and redesign | A notification loop would reproduce the attention incentives the platform rejects |
| Building-level paid tracking | Reject | Specific presence/location creates avoidable exposure |
| Incognito as a paid safety feature | Basic privacy stays free | Safety and visibility controls should not depend on spending |
| Vouchers only for 90% matches | Use optional scheduled-plan eligibility | A ranking score should not control commercial or social access |
| Five microservices plus Kubernetes immediately | Modular application first | Operational complexity should follow demonstrated scale |
| Safety as post-launch scope | Before any real discovery/messages | Block, report, consent and operational response are part of launch readiness |

## 4. New features worth building

### Make a plan

A structured invitation with an activity, time, duration, public place, group size, and host. Keep the group small. Suggested first activities: study together, bring a book, a short campus photo walk, or build a tiny project. Let participants decline and cancel without public penalties. A plan is not confirmed until the invited participants accept it.

### Take it slow

Prioritise small circles and low-pressure group activities. Let users draft an introduction privately and choose when to reveal details. Do not make an anonymous, unmoderated adult-minor audio room the entry point.

### Availability, deliberately shared

Later, allow a short-lived “open to a study session this week” signal. No passive inference of real-time presence. Expire it automatically. Show a broad hub, not live coordinates.

### A feed with an ending

Bound each session's selection and show a calm endpoint. The short-content cap affects short content only. Text, circles, profile controls and existing conversations remain accessible. No streak loss, countdown panic or premium cap bypass.

### A connection outcome loop

After a plan, privately ask whether it happened, whether the user felt comfortable, and whether they want another activity. All responses are optional. Never infer that “attended” means “safe,” and never use disagreement in feedback as an automatic reputation penalty.

## 5. What this alpha actually implements

The alpha uses Next.js on a standard Node.js runtime and PostgreSQL for account-scoped state. Render can host both through the repository Blueprint. The tested Python matching primitives remain a future service boundary rather than a falsely deployed microservice.

| Surface | Implemented behavior | Deliberate boundary |
|---|---|---|
| `/` and `/feed` | Mixed sample feed, private text posts, likes, saved posts, finite endpoint, search | No public audience or photo/video uploading |
| `/onboard` | Name, hub, ten interest options, intent, discovery cohort, take-it-slow preference | Self-selected demo values are not verification |
| `/radar` | Server-generated ranking, component breakdown, search, hide, private connection interest | Every person shown is a sample profile |
| `/circles` | Three example circles with private join/leave state | No public membership or live group chat |
| `/plans` | Create and remove private activity drafts with future date, public-place choice and group size | No invitations are sent |
| `/chat/:id` | Interest-based template starter and persistent private introduction draft | No human or AI messages are sent or fabricated |
| `/settings` | Update preferences, unblock sample profiles, see privacy and integration boundaries | No behavioural learning is enabled |
| `/community` | Create a real pilot profile, discover same-hub/same-cohort members, exchange requests, message accepted contacts, and block members | The Site remains owner-private; hub and cohort are self-selected and not verified |
| Short preview | Five-second text-based preview; server budget reservations with a 1200-second daily cap | Not a media player or protected streaming system |

The preview resets at 00:00 UTC. Local-time reset is a later explicit migration, not a hidden assumption. Sample seed profiles and posts are fixture data. Private user records are persisted under the authenticated viewer's identity; no global shared fallback owner is used.

## 6. Component and API contracts

`Toveli` is the initial composite client surface. `Profile`, `Post`, `rankPeople`, sample people and circle definitions live in `lib/model.ts`. Route wrappers render the relevant view. The UI uses shared sidebar, dialog, tabs, switch, select and progress primitives.

Before more engineers join, split the client into `AppShell`, `Feed`, `Onboarding`, `Discover`, `Circles`, `PlanForm`, `IntroductionDraft`, `BudgetPreview`, and typed API hooks. Avoid doing a framework rewrite merely to split components.

### Implemented endpoints

| Endpoint | Responsibility | Failure handling |
|---|---|---|
| `GET /api/state` | Read current viewer's records, profile and derived matches | 401 without trusted identity; 503 if storage fails; no-store |
| `POST /api/state` | Validate a discriminated action, write only viewer-owned keys, return refreshed snapshot | Origin check; schema validation; bounded request text; no-store |
| `GET /api/shorts` | Read server-side allowance for current UTC date | Missing/failed budget does not grant playback |
| `POST /api/shorts` | Atomically reserve one five-second allowance when no lease is active and budget remains | 409 for active lease or cap; 503 on storage failure |

Private actions: profile, post, like, save, circle, request, block, draft, report, plan, and removal of owned posts/plans. Mutations are acknowledged only after a successful server response. No API trusts a client-provided account identifier.

The alpha database keeps private prototype choices in `records(owner,key,value,created)` and video reservations in `budgets(owner,day,used,lease_until)`. Release 2 adds normalized `community_profiles`, `connection_requests`, `community_blocks`, and `community_messages` tables. Community APIs return opaque IDs instead of email addresses. Request creation is limited to 20 per day and message creation to 60 per hour. More granular moderation, identity verification, deletion/export, media, plans, circles, and public post tables remain pre-beta work.

## 7. Production architecture

Start with a React web application, a single FastAPI service with domain modules, PostgreSQL with pgvector, object storage for validated media, a small background job worker, and Redis only where justified by measured realtime/job requirements. Keep billing and matching separate as modules without requiring separate deployable services.

Proposed modules: identity/hubs; content; discovery; connections; chat; circles/plans; consumption; trust-and-safety; monetization; notifications; privacy/export. Version API contracts so a native client can reuse them later.

The browser calls a same-origin gateway. The gateway verifies sessions, checks CSRF/origin, rate-limits operations, and resolves the server-side user. Workers access external AI through server credentials. User text supplied to an LLM is data, never an instruction to query additional private tables.

### Proposed normalized entities

| Entity | Essential fields / constraints |
|---|---|
| users | UUID, verified email, display name, account state, cohort, age-assurance state, timezone, created/deleted times |
| hubs | UUID, name, city ID, hub type, verification policy; no public per-user coordinates |
| memberships | user/hub unique pair, state, verified_at, method, revocation time |
| interests / user_interests | controlled tags, visible flag, declared preference weight |
| intents | user ID, intent, primary flag, optional availability expiry |
| consent_events | user, purpose, version, grant/revoke time; immutable audit record |
| user_vectors | user, purpose, model version, dimension, vector, event cursor, updated_at |
| content | author, type, text, media state, hub/circle visibility, created_at, moderation state |
| media | owner, object key, MIME, bytes, checksum, scan/transcode state, deletion time |
| interactions | unique event ID, user, content, allowed event type, server receipt time, retention deadline |
| connections | canonical ordered user pair, initiator, requested/accepted/declined/cancelled state, timestamps |
| blocks | directed actor/target pair, unique; exclude in both directions everywhere |
| reports | reporter, target, reason, evidence reference, queue state, assigned reviewer, resolution |
| conversations / participants | membership, accepted connection or circle authorization, read cursor, retention policy |
| messages | conversation, sender, unique client request ID, body, created/deleted times |
| circles / circle_members | hub, topic, cohort policy, capacity, host, membership and moderation role |
| plans / plan_attendees | host, activity, public venue, start/end, capacity, invite/accept/cancel states |
| plan_feedback | respondent, plan, optional outcome and comfort response; private access |
| consumption_days | user, server period boundaries, reserved seconds, immutable cap |
| playback_leases | user, day, content, session, sequence, expiration, signed grant, revocation |
| vendors / offers / vouchers | verified vendor, clearly disclosed offer, eligibility, expiry, one-time redemption state |
| entitlements | user, plan, provider references, state and expiry; never a cap increase |
| outbox / audit_events | idempotent notifications and auditable sensitive operations |

Enforce ownership and authorization in every read and write, with database policies where the chosen connection model supports them. Foreign keys use deliberate retention rules. Deleting an account must revoke sessions and discovery immediately, then remove/rewrite vectors, raw events, cached suggestions, media, and relevant processor data according to the documented retention policy.

## 8. Matching design and runnable foundation

The alpha computes cosine similarity between sets of selected interests. It is deterministic retrieval, not a trained AI model. Score = 0.5 × interest cosine + 0.3 × hub similarity + 0.2 × exact intent agreement. Same hub = 1.0; same city = 0.5. The sample fixtures are all in one city. No intent agreement = 0.0. Scores are shown as points out of 100.

Eligibility precedes scoring: allowed cohort, discovery opt-in, active state, appropriate verified hub/city scope, and no block in either direction. The alpha implements cohort and hide eligibility over fixtures; real account verification and consent gates remain a public-beta requirement.

For a production experiment, declare a fixed, versioned vector dimension with a real selected embedding model. Do not assert that arbitrary model outputs have 128 dimensions. A zero norm returns a stable zero vector. Reject nonfinite values and mismatched dimensions. Maintain separate declared and behavioral vectors so disabling consent removes behavioral influence immediately.

`services/matching/engine.py` provides tested normalization, bounded cosine, stable positive-signal updates, a cold-start blend, and scoring. It uses no external model or database. Behavior contributes at most 30% of the effective interest vector in this proposed design; the outer 0.5/0.3/0.2 weights are an initial experiment, not learned truth.

Only consented, approved topic interactions should reach the update job. Cap each event's influence, deduplicate by event ID, use a job cursor to avoid replay, and exclude private messages, sensitive inferences and comment sentiment. Watching something can indicate disagreement, curiosity or an accidental linger; it is weak evidence, not a hidden “true personality.” Explicit interest changes should take effect immediately.

### Candidate retrieval sketch

```sql
-- $1 is resolved from the authenticated session, not supplied as a target by the browser.
SELECT uv.user_id,
       1 - (uv.embedding <=> me.embedding) AS interest_cosine
FROM user_vectors uv
JOIN users candidate ON candidate.id = uv.user_id
JOIN user_vectors me ON me.user_id = $1 AND me.model_version = uv.model_version
JOIN users viewer ON viewer.id = me.user_id
WHERE candidate.id <> viewer.id
  AND candidate.account_state = 'active'
  AND candidate.discovery_enabled
  AND candidate.cohort = viewer.cohort
  AND candidate.age_assurance_state = 'eligible'
  AND candidate.city_id = viewer.city_id
  AND NOT EXISTS (
    SELECT 1 FROM blocks b
    WHERE (b.actor_id = viewer.id AND b.target_id = candidate.id)
       OR (b.actor_id = candidate.id AND b.target_id = viewer.id)
  )
ORDER BY uv.embedding <=> me.embedding
LIMIT 100;
```

This is a contract sketch for the proposed schema, not a migration run against the alpha. Retrieve enough eligible candidates, rerank using hub and intent, then diversify the shortlist. A global top-50 vector query followed by eligibility filtering can starve a campus of appropriate candidates. Use an exact baseline first, then benchmark approximate retrieval against it before adding an ANN index. Check model version, empty results, candidate recall, exclusions and latency.

Explanations use mutually visible tags: “Both interested in photography; same campus; both looking for friends.” Do not expose “15 minutes watched today,” private content IDs, or simultaneous activity.

## 9. Consumption enforcement

The provided document’s watch-tick pseudocode is insufficient: a modified browser can omit ticks, submit false durations, and race read-modify-write updates. A server database row alone does not protect publicly addressable video.

The alpha reserves five seconds atomically before a five-second text preview. Concurrent reservations for one account cannot overlap. Reservations are deliberately conservative: pausing, network failure, closing a tab or losing a response may consume the reserved five seconds. There is no authoritative value in local storage and no subscriber branch. SQLite tests exercise exhaustion, overlapping lease denial, per-account separation, and next-day reset using the exact reservation SQL.

Production media must use authenticated segment delivery with short server-issued grants. Atomically reserve bounded segment duration, bind the grant to user/session/content/sequence/expiry, and verify it on segment delivery. Revalidate account and cap, prevent uncontrolled public object URLs, record idempotent requests, restrict buffering, and revoke sessions when needed. Signed grants need a server secret and must not be created client-side.

Even protected delivery cannot erase already downloaded media or prevent an independent recording. Describe the feature as enforcing access to additional short content, not perfect control over human attention.

At the cap, pause short playback and offer circles, plans and existing conversations. Never force contact with a specific person. The production reset policy should use server-stored timezone and fixed period boundaries with delayed timezone changes; otherwise repeatedly changing timezone can create extra allowances.

## 10. Saathi review and integration boundary

Reviewed through GitHub: `JeelNandaniya8/saathi` README and the backend’s initial implementation/configuration and AI-mode definitions. The repository documents a Flask/PostgreSQL app, Gemini-only AI replies, Brevo email, streaming, user-approved memory, private journal/check-ins, planning and multilingual preferences. This was a targeted code review, not a full security audit or live deployment test.

Useful patterns: provider credentials stay server-side; chat modes are validated; private memory is user-controlled; UTF-8 streaming supports Gujarati/Hindi; help can be offered one manageable step at a time; AI must not claim monitoring or exclusive companionship.

Proposed integration: an optional “Help me write an introduction” or “Suggest a small activity” action. Send only visible selected interests, chosen intent, and the text the person explicitly supplies. Show the result as an editable AI draft, with no automatic send. No raw journal import, private conversation mining, mental-health matching or assumed cross-product identity linking.

Keep Saathi operationally separate. A later account-link consent flow would be narrowly scoped and revocable. No Saathi code or data has been modified by this build, and no Saathi or Gemini secret is copied into Toveli.

## 11. Monetization that fits the product

First demonstrate useful connections. Then test clearly marked local offers attached to plans, with acceptance optional and no sharing of personal profile data with vendors. Use one-time redemption, budget limits, expiry, dispute handling and idempotent billing. Scheduled or self-reported attendance alone is not fraud-proof evidence for payment.

Possible Plus features: greater organizer tools, reusable event templates and longer collaborative-workspace history. Basic messaging, safety, privacy and the daily video allowance stay the same. No paid ranking advantage that hides unpaid users from meaningful connections. No payment collection is implemented in the alpha.

Evaluate unit economics using media delivery, moderation, AI cost, support and storage per active participant, not just API token cost. Retention from valuable relationships must carry the product; simulated FOMO cannot substitute for it.

## 12. Twenty-two-week execution plan

These are planning estimates for a small team, not a promised delivery date. Each phase has an exit condition. Do not launch simply because week 22 arrived.

| Weeks | Work | Exit condition |
|---|---|---|
| 1–2 | Interview a small range of students; test Toveli pronunciation; define friendship/study/creative scope; document age policy and pilot operations; review alpha | People can explain the product and complete the core prototype flow; chosen name cleared before public branding |
| 3–4 | Normalize schema, set up FastAPI service and reproducible environments, session/CSRF controls, invitation and campus verification, account export/delete | Real test accounts are isolated; unauthorized reads/writes fail; migration and restore rehearsal pass |
| 5–6 | Consent-led onboarding, interest taxonomy, cohorts and hub eligibility, exact declared-interest ranking, truthful explanations | New users get understandable suggestions; blocks and exclusions hold across all retrieval paths |
| 7–8 | Finite mixed feed, validated photo uploads, object storage, deletion, reporting and moderation queue | Unreviewed/invalid media is not distributed; access and deletion controls work |
| 9–10 | Accepted connection requests, persistent messaging, request idempotency, member authorization, rate limits, notifications with explicit opt-in | Two test users can request/accept/chat; unauthorized and blocked users cannot receive new messages |
| 11–12 | Small circles, group memberships, plan invites, acceptance, capacity, cancellation, public-place suggestions, optional private feedback | A group can complete one plan lifecycle; duplicate acceptance cannot overfill it |
| 13–14 | Protected short-content transcoding/segments, reservations, retry-safe leases, reset policy, multi-session behavior | Storage failure denies additional playback; cap, concurrent devices and midnight boundaries pass integration tests |
| 15–16 | Optional behavioral experiment, real versioned embeddings, queued deduplicated updates, privacy-preserving explanation and consent revocation | No sensitive/private input reaches the pipeline; disabling consent removes influence; compare against declared-only baseline |
| 17–18 | Optional Saathi-powered draft helper; bounded context; rate/cost limits; streamed UTF-8 output; shared canvas pilot if supported by demand | AI cannot send or reveal hidden fields; drafts remain editable; provider failures are graceful |
| 19–20 | Supervised campus pilot, moderation coverage, operational alerts, abuse exercises, low-pressure ambassadors; investigate local offers | Actual connections and comfort outcomes justify continuing; response operations can support the audience |
| 21–22 | Accessibility/mobile checks, performance/load baseline, backup/restore, vendor experiment only if ready, staged release and rollback drill | Every launch gate passes; expand only with sufficient relevant activity and operating capacity |

After web retention is demonstrated, add an installable PWA shell without caching private API responses, then consider React Native for native notification and media needs. A native rewrite is not a prerequisite for learning whether the product works.

## 13. Product measurements

Primary candidate metric: weekly participants who report a useful new conversation or activity, with optional feedback. Separate conversation-start, mutually accepted connection, plan acceptance and plan completion. Track median time to a first useful action and whether quieter users can find a comfortable entry point.

Guardrails: reports per meaningful interaction, block rate, unwanted requests, unacknowledged report backlog, opted-out learning state, media failures, cost per useful connection, and user-reported pressure. No metric is proof of reduced loneliness on its own. Do not maximize screen time or automatic notifications.

## 14. Public-beta gates and known risks

The deployed app is owner-private and includes fixtures. Do not change its audience and call it a live community. Before real strangers interact, require an appropriate age-assurance and cohort design, validated identity/session flows, consent, working block/report paths, a staffed response process, media moderation, verified contact/notification permissions, ownership tests, and operational rollback.

Cold start: recruit a small real community with a few recurring activities. Low match density: offer a group or allow voluntary broader hub scope; never fabricate matches. Harassment: mutual acceptance, request limits, bidirectional blocks and human moderation. Location exposure: broad hub display and opt-in plan details. AI misinterpretation: declared interests first and reviewable suggestions. Media cost: upload limits and small encodings. Scope growth: preserve the first useful connection loop.

## 15. Verification performed for this build

Local production build and TypeScript checks; Python tests for vector zero-state, invalid inputs, consent revocation and score bounds; the alpha reservation SQL tested against SQLite for concurrent lease denial, exhaustion, account isolation and daily reset; TypeScript model tests for cohort/block exclusions and onboarding-driven rank changes.

These checks do not constitute browser end-to-end QA, a live PostgreSQL integration test, a media-delivery test, or a security audit. The Python foundation is not wired to the live alpha. Public beta remains future work.

## References used for the decision

User-provided `ethr-technical-documentation.md` and Gemini/Claude conversation attachments.

GitHub source review: https://github.com/JeelNandaniya8/saathi

Zynk's existing social app listing: https://play.google.com/store/apps/details?id=com.usezynk.social

Example of unrelated Toveli commercial use: https://www.baxtonstudio.com/baxton-studio-toveli-vintage-french-inspired-ash-walnut-finished-wood-and-synthetic-rattan-full-size-daybed-36650.html

Illustrative campus photo, Kaden Taylor, Unsplash License: https://unsplash.com/photos/campus-buildings-surrounded-by-trees-at-sunset-xjmmQ06Iprw
