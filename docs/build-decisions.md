# Last Stop: decisions for the first build

Decision revision: 2026-11-14. These choices close the open design questions. Implementation, device measurements, and human playtesting have not yet happened.

## Scope and finish line

Build a six-person private-room game with one killer, one authored mystery, five rounds, a shared evidence board, private notes, one conductor, ordinary actions, bounded sabotage, private simultaneous ballots, and an explanatory reveal. Use TypeScript and a responsive Next.js interface on Vercel, with Postgres on Neon. No public matchmaking or accounts are needed for the first test.

The first complete slice is create room → join by link or QR → approve six names → private role briefing → five rounds → secret ballots → reveal. Do not call a lobby mockup or a single-device simulation the multiplayer prototype. Support real players on six separate browsers. The original 4–10-player and 1–3-player cooperative ambitions remain later stages, each requiring its own case workload and validation.

The two rule fixes are final for this revision: strict investigator majority, with ties escaping; and separate sabotage tokens that do not replace normal actions. Weapon and scene affect a reconstruction badge only. Interference budgets are two tokens for 4–7 players and three for 8–10, with one shared use per round, one plant per match, and no use in round five. Only the six-player case has been schedule-validated.

## Communication and accessibility

Default to friends in the same room or on an existing voice call. Include in-game text messages and evidence sharing, but do not build voice infrastructure. Offer the seventeen-minute text-only preset before role assignment; the default voice preset lasts twelve minutes. Record the preset in playtest data.

Use a mobile-first interface with a persistent phase timer, action confirmation, connection indicator, clear work remaining, and one primary action per screen. An action remains a draft until acknowledged by the server. An offline banner must say that a choice has not been saved. Include a 60–90-second interactive tutorial before the lobby marks a player ready.

Use text labels as well as color for evidence status, large touch targets, readable type, keyboard navigation, reduced motion, and screen-reader labels. Keep private dossiers concealed behind an explicit reveal control. No clue relies on sound, color recognition, fast movement, or precise pointer control. The app does not ask anyone to show a role screen as evidence.

## Authority and synchronization

Vercel runs the web app and authenticated HTTP command handlers. Neon holds room snapshots, deadlines, actions, evidence grants, ballots, and the immutable case/rules version. The server owns the truth and game transitions. A player's browser is never the trusted host, even if that player created the room.

Start with a two-second active polling interval plus immediate synchronization after commands. Slow polling when hidden and synchronize immediately on return. This is adequate for simultaneous phase-based choices; measure it rather than add a persistent connection to the first slice. Six browsers polling for twelve minutes make about 2,160 sync requests before extra commands, an explicit quantity to include in cost tests.

Use database transactions with a per-room lock for state changes, an expected state version, and an idempotency key unique per participant command. Store the resulting response so a retry returns the same result instead of spending another action. Generate secret role assignment server-side. Separate public projections from private player projections; never send a case seed or full solution JSON to a live player's browser.

Every authenticated sync or command checks persisted deadlines using the database clock and advances due phases exactly once while holding the room lock. An authenticated POST can both synchronize and perform that idempotent advancement. Do not depend on a browser timer, a long-lived Vercel invocation, or a cron firing at the exact deadline. When every browser has gone away, the next request reconciles overdue phases from stored deadlines and marks absence appropriately. Late commands cannot reopen a phase.

Evaluate a command deadline after acquiring the lock, using a database wall clock rather than a transaction-start timestamp that might predate a long lock wait. A command received by the server before the deadline but not accepted in the locked transaction may be rejected; show the acknowledgement and never promise acceptance merely because a local countdown remained positive. Performance tests must make this boundary rare and predictable.

Apply a round in this order: lock due phase and drafts; select role-neutral fallbacks for missing ordinary actions; validate interference against pre-resolution state; apply obstruction or inbox replacement; apply simultaneous investigation work and trace tests; issue evidence to every contributor; publish mandatory test results; persist the next phase and event version; commit. Retries and two simultaneous callers must produce the same grants and token spend.

Store stable deadlines rather than adding delays to the current request time. The one shared reconnect pause shifts the remaining deadline exactly once. Simultaneous pause requests cannot grant extra pauses. Start it on the first detected loss of heartbeat for at least ten seconds; record the detection time and remaining phase time. After it is consumed, absences use the normal fallback. Fixed roster and voting denominator remain unchanged. A whole-round absence or absence throughout final voting makes the match incomplete for balance statistics; a present player intentionally leaving their ballot blank is a valid losing vote, not a disconnect.

Choose application and database regions close together for the initial testers. Use a pooled server-side database connection and an app role with only needed privileges. Keep preview/test data separate from live matches. Freeze the case and rules version per room so a deployment cannot rewrite an active mystery. Support old active versions until they finish; do not force a mid-match page refresh.

Vercel currently supports native WebSockets, while Neon Realtime is in beta. Neither is a first-build dependency. Later adopt a push channel only if measured latency, polling cost, or scale warrants it, while retaining the same database authority and reconnect protocol. Sources checked on 2026-11-14: [Vercel WebSockets](https://vercel.com/docs/functions/websockets), [Neon Realtime](https://neon.com/docs/realtime/overview), and [Neon–Vercel integration](https://neon.com/docs/guides/vercel-overview).

## Minimal server contract

| Command | Required behavior |
| --- | --- |
| Create / join room | Issue a high-entropy guest session; the invite code is not a participant credential. Host approves the fixed roster before role assignment. |
| Sync room | Authenticate, reconcile deadlines, return server time, version, public board, and only the caller's private projection. |
| Save action | Validate round, action type, availability, and evidence ownership. Reservations are advisory and cannot block another player. Upsert one draft ordinary action per round. |
| Save interference | Hostile authorization, token/round/target limits, separate secret draft. No actor identity in the public event. |
| Publish card | Require an acquired evidence grant; publish its immutable canonical text. |
| Save ballot | Upsert private draft during final voting; lock at the deadline; never disclose aggregate live votes. |
| Send message | Rate-limit and length-limit plain text; render safely; record no secret internal state with the message. |
| Reconnect | Resume the existing participant credential and private state, never guess a role from a display name. |

Suggested tables are rooms, participants, round_actions, interference_actions, evidence_definitions, evidence_grants, public_events, private_ballots, command_receipts, and short-lived chat_messages. Notes belong to a participant and are private. Role and truth columns never appear in public queries. The first release has no spectator path, reducing accidental information access.

Store guest credentials as hashes server-side and use Secure HttpOnly SameSite cookies with origin/CSRF checks for mutations. Apply per-session and per-room limits; initial defaults are one draft update per second with a short burst of three, five chat messages per ten seconds, 500 characters per message, and 300 characters per witness question. Client throttling alone is insufficient. Joining closes at match start. A host may remove a disruptive guest before start; removing someone mid-match ends competitive validity and is recorded as an incomplete game.

Private notes and chat expire within 24 hours after the match. Retain only pseudonymous structured balance events for 30 days by default, with a host deletion action. Do not collect voice or use player chat as training data. Longer retention or model-training contributions require a separate explicit opt-in. Show these choices in the lobby. These are product decisions to implement, not claims that a deployed privacy system already exists.

## Small and custom models

Ship the button-based witness first. Add the natural-language adapter behind a feature flag after the complete game loop works. Use one interface for button and model intents so the server cannot tell a privileged model-only action from a normal supported action.

Compare a rules/keyword baseline with a small pretrained encoder and a custom intent classifier trained on reviewed game examples. Training a narrow classifier or fine-tuning an existing small model is the preferred custom-model route. Training a general language model from scratch has no demonstrated benefit for this scope. Model selection remains an experiment, not a build blocker.

Collect an explicit opt-in set of realistic witness questions; keep author/template/paraphrase families separate between training and evaluation. Evaluate at least 200 held-out in-scope questions plus 200 unsupported or adversarial questions before enabling free text by default. Initial gates are at least 95% exact intent-and-target accuracy on clear supported questions, less than 1% false acceptance of unsupported questions, and warm p95 interpretation below one second on the chosen test devices. If the sample cannot substantiate a rare-error claim, report its uncertainty and expand the test set.

Test an Android phone, an iPhone, and a laptop, including model cold load, missing WebGPU, poor network, backgrounding, and memory pressure. Run inference in a worker. Buttons become usable immediately; the round never waits for a download. Prefer an encoder/tokenizer artifact under 50 MB, measured separately from the runtime. Serve public versioned model files; keep all private case truth on the server. No GPU inference server is required by the baseline architecture.

Only retain the model feature if players use it successfully and prefer its questioning interaction without extra action-selection errors or lower clue comprehension. Use blinded interface comparisons after users have learned the rules. If it offers no measurable benefit, ship the complete button game and retain the adapter as an experiment. No custom model, training dataset, or measured device result has been produced yet.

## Build acceptance and human validation

| Gate | Evidence required before calling it complete |
| --- | --- |
| Complete multiplayer slice | Six separate clients can create, join, play five rounds, accuse, and see the same correct reveal. |
| Correct authority | Forged participant IDs, unauthorized evidence IDs, direct hostile actions from innocent sessions, stale versions, and duplicated commands cannot alter prohibited state. Browser payloads contain no other player's secrets. |
| Phase races | Concurrent deadline calls, action retries, test/publication races, and simultaneous pause requests resolve once with consistent costs and grants. |
| Recovery | Refresh, lost connection, and server restart preserve roles, notes, ballots, and deadlines. Missing players do not reduce the verdict denominator. |
| Mobile clarity | A first-time player can finish the tutorial and act from each target device; no unreadable clue, blocked action, or hidden save failure. |
| Latency and cost | Initial target: p95 action acknowledgement under 500 ms and visible synchronization under 3 seconds for same-region testers at 20 simultaneous six-player rooms. Measure database load, polling volume, cold starts, and cost per completed match; revise these targets if evidence requires it. |
| Playability | Complete 20–30 blind six-player pilot games, fix repeated misunderstandings, and collect agency, participation, and rematch responses. |
| Model release | Meet the stated accuracy/latency gates and demonstrate useful player preference over buttons; otherwise keep it optional. |

Begin with deterministic rules and the supplied case, then implement synchronization, then run blind playtests, then add and evaluate language input. Do not expand to more player counts, generated cases, rankings, voice, payments, or public matchmaking until this slice works. The remaining uncertainty is empirical: fun, balance, performance, and model value must be measured. There is no unresolved architectural or core-rule choice preventing the first build.
