# Toveli V4: a campus worth coming back to

## Product decision

The first job is to make a useful social home for one real campus. A better reason to return is a familiar person, a conversation about a shared interest, or a plan happening soon. Attractive screens help someone try the product; useful relationships give them a reason to keep it.

The name remains Toveli so the existing repository and deployment retain one identity. This release does not make a trademark or domain-availability claim.

The new experience follows a concrete loop:

1. Choose your campus, interests, and intention.
2. See an interesting post, person, circle, or small plan.
3. Take a meaningful action: reply, connect, join, or RSVP.
4. Return for an actual reply or a plan you chose.
5. Reach the end of the feed and carry the interaction into your day.

There are no fabricated online counters, artificially inflated match percentages, ghosting penalties, or paid extensions of consumption limits. Slower replies are treated as a preference, not misconduct. Sharing an interest is an explanation for a recommendation, not proof of compatibility.

## Interface

The visual language uses warm off-white surfaces, deep green actions, soft olive and lilac accents, local photography, DM Sans, and Manrope. A photographic hero gives the feed a real activity to lead with. A compact sidebar anchors desktop navigation. On phones, the same five destinations sit in a bottom bar, with search contained in the sticky header.

| Route | Main job | Working actions |
| --- | --- | --- |
| `/` | Explain the product | Register, sign in, open demo |
| `/login` | Own-account access | Create account, sign in, show/hide password |
| `/onboard` | Build a useful introduction | Campus, age group, interests, intention, bio, preferences |
| `/feed` | Share and respond | Publish text/photo, like, comment, bookmark, share, report, delete own item |
| `/radar` | Meet through shared interests | Search, interest filter, inspect explanation, request connection |
| `/circles` | Belong through a shared topic | Create, join, leave, filter joined, read and add replies |
| `/plans` | Make an afternoon happen | Create, RSVP, leave, view upcoming/mine/past, calendar file, host cancellation |
| `/messages`, `/chat/:id` | Continue a mutual introduction | Accept/decline/cancel requests, select contact, send message, choose an icebreaker |
| `/profile` | See your contributions | Your moments, joined circles, joined plans, edit profile |
| `/saved` | Revisit intentional saves | Filter moments/circles/plans and open their detail |
| `/notifications` | See meaningful updates | Open related items or chats, mark read |
| `/settings` | Control the account experience | Edit profile, discovery preference, slower-start preference, export current data, sign out |
| `/demo` | Inspect the experience before registering | Same interface with clearly labelled, session-local sample activity |

Native dialogs provide focus containment and Escape dismissal. Destructive content removal requires confirmation. Dialogs also display mutation errors directly so a failed action is not hidden behind a modal. Busy states prevent accidental duplicate submissions. Form labels and icon-button names support assistive technology. The stylesheet includes a reduced-motion override.

The remote browser in the development environment could not access localhost. This release was checked with a production build, database integration tests, and DOM interaction tests. **Desktop/mobile screenshots, real-device touch behaviour, screen-reader behaviour, and production Render operation remain unverified.**

## Runtime architecture

The application is an ordinary Next.js App Router app. No Cloudflare-only imports or Workers bindings are needed.

- Pages delegate to `components/social/social-app.tsx`.
- `use-social.ts` handles fetching, errors, mutations, request ordering, polling, and explicit demo mode.
- Reusable modules own cards, detail dialogs, composition, profile forms, messages, and UI primitives.
- `GET /api/social` returns the authorized snapshot. `POST /api/social` validates a command and commits it transactionally.
- `lib/social/service.ts` owns the SQL and all audience/relationship checks. It accepts a small query/transaction interface, which is why the same service can be tested against an actual PostgreSQL engine.
- `lib/social/database.ts` connects that service to PostgreSQL using `postgres`.
- `GET /api/social/media/:id` checks the viewer's session and audience before returning uploaded JPEG bytes.
- `/api/community` is a compatibility alias to the same service. Old community code cannot bypass the new age-group restriction.
- `/api/state` retains private V3 state for compatibility. It does not publish private drafts into V4.

The snapshot loads up to 80 recent social items, 1,000 eligible profiles, 200 connection requests, 200 messages, 500 comments across visible items, and 50 notifications. These are intentionally bounded MVP reads, not a complete historical archive. Old saved/joined content can fall outside the current window. Cursor pagination and dedicated saved/joined queries are the first data-scale follow-up before a wider rollout. Profile counters and exports describe the loaded snapshot.

When the tab is visible, the client refreshes every 20 seconds. A mutation returns a new server snapshot immediately to the person who made it. Other clients see the change on their next refresh. There is no false typing, delivery, or read-receipt indicator.

## Additive data model

Migration 0000 remains unchanged. Migration 0001 adds:

| Table | Purpose | Important constraints |
| --- | --- | --- |
| `social_items` | Posts, circles, plans, and their typed JSON content | UUID primary key; owner references users; hub/cohort captured at creation |
| `social_reactions` | Likes, bookmarks, memberships and RSVPs | Composite primary key `(item_id, actor, kind)` makes an action idempotent |
| `social_comments` | Replies on posts, circles, and plans | Item and actor references cascade on deletion |
| `social_notifications` | Replies, requests, messages, joins and cancellation notices | Recipient and actor reference users; read state belongs to recipient |
| `social_reports` | Private moderation intake | Reporting actor is recorded; report remains after item removal |

Users, hashed sessions, community profiles, bilateral blocks, connection requests, and messages retain their existing tables. A previously registered member can sign in with the same password. Existing community identity and connection data are read by the new interface.

## Command contract

Commands are discriminated by `kind` in `lib/social/validation.ts`:

- `profile`: an entire validated profile; the existing age group is immutable through the app.
- `create`: `itemKind` plus typed data. Plans additionally require a title, approved public-place category, group size of 2–20, and a start between one minute and 90 days in the future.
- `react`: item UUID, `like | save | join`, and desired boolean state.
- `comment`: item UUID and up to 500 characters. Circle membership is checked before writing.
- `delete`: item UUID. Only the creator may remove it.
- `request`, `respond`, `cancel_request`: introduction lifecycle commands.
- `message`: public member ID and up to 1,500 characters. Requires a currently accepted connection and matching audience.
- `block`: target member public ID. Hides both parties from each other and cancels their relationship.
- `report`: item UUID and a private reason.
- `read_notifications`: updates only the current recipient's notifications.

Raw email addresses and internal user IDs are never returned as public member identifiers. Public IDs are opaque 24-character hexadecimal values.

## Transaction rules

Each account has a serialized rolling mutation budget of 40 commands per minute. Content creation is also limited to 30 items per day, introductions to 20 per day, and messages to 60 per hour. These limits protect the MVP; they are not a complete anti-abuse system.

An RSVP locks the plan row before counting members and inserting the membership. The host is already one member. Two people cannot both claim the last seat. Likes, saves, and joins use an idempotent primary key instead of trusting a client counter.

Reciprocal introduction attempts serialize on an advisory lock derived from the sorted pair of account identifiers. One pending or accepted connection is allowed by service logic for either direction. Profile and account rate locks use `FOR NO KEY UPDATE` to allow foreign-key references while coordinating account mutations.

Every item read or write checks the current hub, age group, current author profile, and bilateral blocks. Discovery preferences affect discovery and new requests; they are not a private-post toggle. The app does not collect GPS or display exact building-level proximity.

Plan cancellation deletes its RSVP records and conversation, then participants receive a cancellation notification in the same transaction. A calendar download is a static one-hour calendar entry; changing or cancelling the app plan cannot retract an already imported calendar file. The UI makes no promise of live calendar synchronization.

## Media and persistence

The photo composer accepts JPG, PNG, and WebP files up to 10 MB, scales them to a maximum 1,200-pixel side, strips the source metadata through canvas re-encoding, and converts them to bounded JPEG data. The server limits the command body to 400 KB and the JPEG data URL to 350,000 characters.

The MVP stores compressed image data in PostgreSQL. Snapshots omit the base64 payload and return an authenticated same-origin media URL. Photos are not returned through a public object URL or an image proxy that loses the session cookie. Media responses are private and `no-store`.

This is appropriate for testing a small campus product, not high-volume media delivery. Object storage, server-side image decoding, malware/content review, thumbnails, lifecycle controls, and backup size management belong in the next infrastructure phase.

## Identity and deployment

Toveli owns account passwords and sessions. Passwords retain the existing salted PBKDF2-SHA256 format so users are not locked out by an unversioned hash change. Session tokens are random and only their hashes are stored. Cookies are HttpOnly, SameSite=Lax, and Secure in production.

A shared origin helper checks the explicit `APP_ORIGIN`, otherwise Render's public URL, otherwise the local request origin. It fixes the reverse-proxy scheme mismatch without treating arbitrary cross-site origins as valid. A custom domain requires `APP_ORIGIN`.

Email verification, password reset, production-strength login throttling, session/account management, and a versioned password-hash upgrade remain release work. Age groups and campus membership are self-declared; they must not be marketed as verified. Reports are queued in the database, but a trained moderation process and staff interface are not yet implemented.

## Recommendation and attention policy

V4 discovery uses explicit chosen interests and the stated intention to order eligible campus members. The screen explains actual overlaps. It does not claim to infer psychology, personality, private sentiment, or a probability of friendship from a few interactions.

The Python matching primitives in `services/matching/engine.py` remain available for future work. The live app does not invoke FastAPI, embeddings, pgvector, or a paid LLM. Deploying those requires separate infrastructure and consent design; it is not something a decorative AI label can supply.

The feed shows at most 12 posts per view and ends with a route to plans. This is a finite-feed experience, not a strict daily text/photo time cap. The retained `/api/shorts` endpoint reserves five-second units against an account's 20-minute UTC daily budget. V4 does not implement video upload, authenticated streaming, or the old text-animation preview. No paid tier can buy extra video budget.

## What would make users return

The next pilot should test value, not just visual preference:

1. Seed a small number of real interest circles with hosts who actually want to run them. Invite a group that can interact with each other, instead of scattering isolated signups across many campuses.
2. Ensure each circle has a welcome question and one simple public-place plan. Empty spaces should offer a useful first action.
3. Ask whether someone had a good conversation or attended an activity. Track voluntary self-reports of real connection, not minutes consumed.
4. Let people share a circle or plan with someone they already know. Expand only after current groups have activity worth inviting a friend into.
5. Preserve low-pressure use. No reply streaks, coercive FOMO, public popularity rankings, or penalties for declining an introduction.

After validating that loop, the strongest additions are repeatable weekly plans, optional post-meetup feedback, group moderation tools, digest notifications controlled by the user, and an invite flow with campus hosts. Paid creator utilities or vendor offers should follow useful activity, not precede it. Voucher redemption must be explicit, transparent, and independently protected against fraud.

## Release acceptance

Automated checks cover migration execution, shared persistence, audience restrictions, ownership, private saves, idempotent likes, RSVP capacity, circle reply permissions, mutual messaging, read notifications, authenticated photos, immutable age groups, duplicate reciprocal requests, cancellation notices, blocking, reports, request size/origin checks, and the primary React user journeys.

The previous Python community test only inspected strings in the old route. It has been replaced by the stronger database tests; the existing matching and budget tests remain.

Before inviting public users, complete these concrete remaining checks:

1. Walk through the source build on desktop and at 390-pixel phone width, including keyboard focus, scrollable dialogs, image uploads and calendar import.
2. Test two real accounts against the actual Render PostgreSQL service, including a logout/login round trip and mobile Safari cookies.
3. Add account recovery and verification, operational rate protection, a staffed reporting workflow, and a clear age/campus assurance process.
4. Test backups and restore. Define retention and deletion for profiles, messages, reports, and stored media.
5. Add dedicated historical saved/joined queries and message pagination before the snapshot windows become restrictive.

This code release does not publish or deploy the service.
