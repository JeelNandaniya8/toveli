# Toveli V3: the social home for real life

Version 3 product strategy • 7 September 2026

## The goal

Toveli should become the first app people open when they want to know what is happening around them, share something with people they care about, find someone with a compatible interest, join a small group, organise a plan, or continue a relationship.

That is a stronger and more realistic product goal than asking people to uninstall Instagram or Facebook immediately. People leave an established network only after the replacement carries their relationships and solves their daily jobs reliably. Toveli must first earn one repeated behaviour in one dense community, then add adjacent behaviours without weakening the first one.

The first repeated behaviour is:

> I opened Toveli, found something relevant near me, and ended with a useful conversation or real plan.

Toveli measures success through useful connections and completed activities. Session length is a cost to control, not the main success number.

## What Toveli replaces

Instagram is strong at identity, visual expression, creator discovery, short entertainment, and private sharing. Meta reported in September 2025 that messaging had become the most popular way to share photos and videos on Instagram and that people reshared Reels more than 4.5 billion times each day across Meta platforms.

Facebook is strong at groups, events, local information, identity, messaging, and practical coordination. Its Local work combines nearby events, groups, people, businesses, and other local information. This shows that a replacement needs more than a feed.

Toveli must serve six daily jobs:

1. **Know what matters today.** A finite personal edition of people, circles, plans, and posts.
2. **Express yourself.** Text, photos, questions, invitations, and short updates without performance pressure.
3. **Find your people.** Explainable discovery based on selected interests, broad place, intent, and safety eligibility.
4. **Belong somewhere.** Small circles with recurring activities, useful posts, and clear hosts.
5. **Make plans.** Turn content and shared interests into a time, public place, and group.
6. **Keep relationships.** Mutual requests, private messages, shared collections, and memories.

Marketplace, large public pages, professional networking, dating, and creator monetisation are later products. Adding them before the core community works would spread the network too thin.

## The daily loop

### 1. Arrive

The Today screen begins with three useful options: a person, a circle, and a plan. The feed starts below them. Toveli therefore gives the user an action before offering entertainment.

The user can post a short pulse such as “Open to a study session after class.” A pulse expires after 24 hours. It is explicit, editable, and never inferred from live location or passive behaviour.

### 2. Discover

People discovery uses a broad hub, compatible age group, selected interests, current intent, discovery consent, and blocks. Each suggestion explains its score as points out of 100. Toveli never calls it a probability of friendship.

The discovery page also offers circles. A person who does not want a direct introduction can enter through a shared activity.

### 3. Interact

A user can respond to a post, save it, or turn it into a plan. Content becomes a conversation object instead of a dead engagement event.

A connection request opens messaging only after the receiver accepts. Declining, cancelling, muting, hiding, or blocking never creates a public penalty.

### 4. Make something happen

A plan has an activity, start time, expected duration, public meeting place, capacity, and host. Participants accept individually. The plan is clear enough to join and easy enough to leave.

Afterward, Toveli can privately ask whether the activity happened and whether the user wants another one. Feedback is optional and is not a public rating of a person.

### 5. Finish

The Today edition contains a bounded selection and ends visibly. Toveli then offers a plan, a message, or an exit. Short entertainment has a daily allowance that cannot be extended by payment.

## Information architecture

### Today

Today is the default home. Its order is:

1. Now around you: one people entry, one circle entry, one plan entry.
2. Pulses from accepted contacts and eligible communities.
3. Composer for thought, question, invitation, or photo.
4. Finite personal edition of posts.
5. Visible end state.

Ranking priorities are accepted contacts, joined circles, saved interests, upcoming plans, broad hub relevance, freshness, and diversity. Popularity is one small signal. It must not create a winner-takes-all feed.

### People

People contains four modes:

- Suggested: eligible people ranked through visible factors.
- Open now: people who explicitly publish a temporary availability pulse.
- New at my hub: verified newcomers who opt in.
- Reconnect: accepted contacts with a shared circle or unfinished plan.

Filters should remain small: interest, intent, circle, and broad hub. Exact building presence and live distance are excluded.

### Circles

A circle contains a purpose, hub, privacy level, age policy, hosts, capacity, recurring activities, posts, resources, and group messages. Small circles can be capped to protect participation quality.

Hosts receive simple tools: approve members when needed, schedule recurring activities, pin useful posts, create participation guidelines, remove content, restrict new posts temporarily, and escalate reports.

### Plans

Plans show invited, accepted, waitlisted, declined, and cancelled states. Capacity updates atomically. A participant cannot be added without their action. The host can change the time or location, but material changes require participants to reconfirm.

Public place suggestions come from verified hub venues. Toveli does not expose a participant's journey, home location, or continuous live location.

### Messages

Messages support accepted one-to-one contacts and circle channels. V1 needs text, reactions, reply, edit window, delete for self, mute, block, report, and shared posts or plans. Photos and documents require upload validation and moderation before release.

Read receipts and active status are opt-in. Quiet delivery lets a sender avoid a notification. Message requests remain separate from the accepted inbox.

### Profile

A profile shows the person's chosen name, verified broad hub, visible interests, current intent, optional short introduction, circles they choose to show, public posts, and temporary pulse. Counts are informational. Toveli avoids follower-count competition in the initial campus product.

### Search

Unified search finds people, circles, activities, posts, and broad hubs. Results apply authorization, cohort, block, and moderation filters before ranking. Search never returns private messages or hidden profiles.

## Content system

Supported first formats:

- Text thought up to a clear limit.
- Question with optional answer choices.
- Photo with caption and alt text.
- Invitation that can become a plan.
- Resource link with a generated preview.
- Short video after protected media delivery is ready.

Every post declares an audience: accepted contacts, one circle, one verified hub, or public. Teen accounts begin with the narrowest appropriate audience. An audience change displays the exact effect before saving.

The feed has session and daily boundaries. Short video uses authenticated segment grants. Text and existing relationships stay accessible after the video allowance ends.

Creator tools should reward contribution to communities rather than maximum watch time. Useful signals include saves, meaningful replies, circle joins caused by a post, and plans created from it. Raw view count receives less emphasis.

## Discovery and matching

### Eligibility first

Before ranking, a candidate must pass:

- Active account state.
- Discovery enabled.
- Appropriate verified age group.
- Allowed hub or city scope.
- No block in either direction.
- No moderation restriction.
- Request-rate and contact-policy limits.

### Ranking second

The initial score remains explainable:

`score = 0.50 × interest similarity + 0.30 × place relevance + 0.20 × intent agreement`

The weights are an experiment. They should be versioned and evaluated against actual accepted connections and useful activities. The score is displayed as an index, not a percentage prediction.

Declared interests dominate at launch. Optional behavioural learning can contribute later only after explicit consent, a visible explanation, and a working deletion path. Private messages, journals, health-related data, and precise location never enter the discovery vector.

### Diversity and fairness

The final list should avoid showing ten near-identical people. It can diversify by interest cluster, circle, department, and activity type after eligibility and relevance. New members receive a fair opportunity without hiding established compatible members.

Toveli monitors whether some groups consistently receive fewer safe, relevant suggestions. It must inspect data quality and eligibility design before changing rank weights.

## AI's role

AI should remove friction in user-controlled tasks:

- Draft an introduction from mutually visible interests.
- Turn a post into a structured plan draft.
- Suggest a clear title or alt text.
- Summarise a long circle discussion when members request it.
- Help a host organise repeated questions.
- Translate a user-selected message draft, preserving the original.

AI never sends a message, accepts a request, creates a plan, changes an audience, or reports a person without a final user action. It receives the minimum fields required for the chosen task. Outputs remain editable and are labelled as assistance.

Saathi can later provide the drafting surface through a narrow, revocable connection. Saathi journals, private conversations, memories, check-ins, and mental-health context stay outside Toveli discovery.

## Teen and community safety

Age assurance is required before opening a real public network. Self-selected age groups in the private prototype are not verification. Meta's 2026 age-assurance announcement states that knowing people's ages is required to place teens in age-appropriate experiences, while its teen products use stricter default messaging and content settings.

Toveli's launch defaults should include:

- Teen accounts private by default.
- Teen-to-adult discovery blocked unless a carefully defined legitimate context and verified policy allows it.
- Messages opened by mutual connection or an approved circle.
- Broad hubs instead of exact live location.
- Public first-meeting suggestions.
- Block and report on every relevant surface.
- Request, message, upload, and invitation rate limits.
- Human moderation queue with response targets and escalation paths.
- Device and account signals for repeated abuse, with an appeal path.
- Clear content standards in the languages used by the pilot.

Safety tools remain free. Incognito visibility, blocks, reporting, account privacy, audience selection, and message controls are not paid features.

## Moderation operations

Before the first multi-user campus pilot, Toveli needs named people responsible for the report queue during published coverage hours. The system must record report status, assignment, action, reason, appeal, and timestamps.

Reports should support member profile, message, post, circle, plan, and media targets. A block applies immediately for the reporter while review continues. Sensitive evidence is accessible only to authorised reviewers and expires according to the retention policy.

Automated filters can prioritise review and prevent obvious spam from distributing widely. They do not replace human decisions for ambiguous cases.

## Monetisation

The product earns money after it demonstrates valuable local activity.

### Toveli Plus

Reasonable paid features include advanced circle hosting, reusable activity templates, collaborative workspace history, additional profile design, larger private archives, and organisation tools. Paid accounts do not receive a larger short-video allowance, stronger discovery ranking, basic privacy, or safety advantages.

### Local partners

Verified campus cafés, bookstores, workshops, and activity venues can offer clearly marked discounts attached to a plan. A user chooses the offer. Toveli does not send a profile, match score, private interests, or attendee feedback to the vendor.

Partners pay for verified redemption or a transparent campaign, with budget limits, expiry, fraud review, refunds, and idempotent billing.

### Campus and organisation tools

Universities and organisations may pay for verified hub administration, official announcements, activity infrastructure, and aggregate privacy-preserving participation analytics. They cannot buy access to private conversations or individual behavioural profiles.

## Growth strategy

### Phase 1: one dense pilot

Choose one reachable campus where the founding team can support users directly. Recruit a balanced seed group across interests rather than chasing a raw signup number. Prepare at least six recurring circles and twelve small activities before opening discovery.

The invitation system controls support load and community balance. Marketing should show real activities and useful outcomes. Artificial scarcity and fabricated counters destroy trust.

### Phase 2: repeatable campus playbook

A campus is ready to expand when new users can find several relevant people or circles, report handling is timely, recurring activities continue without founder intervention, and useful-connection retention is stable.

Document ambassador selection, host training, moderation coverage, initial circle templates, launch-week activities, and local partner onboarding. Expand to the next nearby campus only after the playbook works.

### Phase 3: city graph

Connect campuses with coworking spaces, libraries, creator communities, and public activities. Cross-hub discovery remains optional. The city product begins with activities and circles, not unrestricted stranger proximity.

### Phase 4: broader social network

Add close-friend sharing, richer media, creator communities, trusted local commerce, and native applications once the relationship graph is strong. Each new surface must strengthen the useful social loop.

## Metrics

The primary metric is weekly users who complete a useful social action: an accepted connection followed by a conversation, joining and participating in a circle, or accepting and attending a plan.

Supporting metrics:

- Time to first relevant person, circle, or plan.
- Connection request acceptance rate.
- Accepted conversations with a reply from both sides.
- Circle participation after joining.
- Plan acceptance and completion.
- Four-week retention after a useful action.
- Percentage of sessions that end at the finite endpoint.
- Percentage of short-limit redirects that lead to a voluntary useful action.

Guardrails:

- Blocks and reports per 1,000 interactions.
- Unwanted request rate.
- Median report response time and open backlog.
- Teen-to-adult eligibility failures.
- Notification opt-out rate.
- AI draft rejection or heavy-edit rate.
- Cost per useful action.
- Users who disable discovery or delete accounts.

Toveli should not optimise total minutes, daily streaks, notification opens, or messages sent without mutual replies.

## Build sequence

### Current private build

The current release implements the redesigned Today page, finite mixed feed, pulses, explainable sample discovery, circle choices, private plan drafts, conversation rehearsal, profile, onboarding, settings, a server-enforced short preview, and the real mutual-request community foundation.

### Next engineering release

1. Move private fixture actions into typed domain APIs.
2. Add normalised posts, reactions, circles, plans, memberships, attendees, and notifications.
3. Add account export and deletion across new tables.
4. Add real block and report controls to every live-community surface.
5. Add tests for request races, block/message races, capacity races, and ownership.
6. Add hub and age verification adapters.
7. Add moderation queue and audit records.

### Media release

1. Validated photo upload with object storage and malware/media scanning.
2. Derivatives, alt text, ownership checks, deletion, and audience controls.
3. Protected short-video transcoding and authenticated segment grants.
4. Server reservation integration across multiple devices and timezone boundaries.
5. Media moderation and appeals.

### Pilot release

1. Invite codes and balanced cohort seeding.
2. Six real circles and twelve scheduled activities.
3. Staffed moderation coverage.
4. Notification preferences and quiet delivery.
5. Pilot analytics for useful actions and guardrails.
6. Backup, restore, incident response, and rollback rehearsal.

## Source references

- Meta, “In India, Instagram debuts a Reels-first experience for its mobile app,” September 2025: https://about.fb.com/news/2025/09/in-india-instagram-debuts-a-reels-first-experience-for-its-mobile-app/
- Meta, “Introducing New Facebook Local Tab, Messenger Communities, AI Integrations and More,” October 2024, updated June 2025: https://about.fb.com/news/2024/10/facebook-local-tab-messenger-communities-ai/
- Meta, “New AI-Powered Age Assurance Measures to Place Teens in Age-Appropriate Experiences,” May 2026: https://about.fb.com/news/2026/05/ai-age-assurance-teens/
- Meta, “Teen Accounts Expand to Facebook and Messenger with New Protections,” April 2025: https://about.fb.com/news/2025/04/introducing-new-built-in-restrictions-instagram-teen-accounts-expanding-facebook-messenger/
- Meta, “Introducing Stricter Message Settings for Teens on Instagram and Facebook,” January 2024: https://about.fb.com/news/2024/01/introducing-stricter-message-settings-for-teens-on-instagram-and-facebook/
