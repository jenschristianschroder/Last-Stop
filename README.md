# Last Stop

[Play the live pilot](https://last-stop-seven.vercel.app/) · [Release verification](docs/verification.md)

![Last Stop station interface](docs/last-stop-preview.jpg)

A six-player browser murder mystery aboard the Nocturne Express. One passenger is the killer. Everyone investigates, shares evidence, and makes a private accusation before the last station.

The interface is an illustrated train and a collection of paper artifacts: tickets, private dossiers, evidence slips, a notebook, and a sealed accusation. It is responsive and includes keyboard-accessible native dialogs, reduced-motion support, optional ambience, QR invitations, a favicon, and Home Screen metadata.

## Play

Create a private train, invite five friends, approve the passenger list, and read the short field guide. Everyone marks themselves ready before the host departs. Use voice/same-room pacing (12 minutes) or text-only pacing (17 minutes).

The solo **rehearsal** supplies five clearly labeled scripted passengers and lets the host skip a phase. Bots investigate visible leads, share acquired evidence, and base accusations on their available facts. This is a learning mode, not a substitute for human balance tests.

**Pilot content:** The Bell at 21:11 is a fixed authored mystery. Players who know the solution should not be counted as blind investigators in a repeat test. The source and `docs/first-case.md` contain spoilers.

## Rules implemented

- Five rounds; one ordinary action per player per round; no eliminations.
- Multi-player lead work, private acquisition, free publication, and retrieval of withheld completed clues.
- Advisory reservations cannot block another participant from acting.
- Two separate killer tokens, at most one per round through round four. Obstruct a lead once or plant one authored report.
- Reports 1–4 arrive after their round's actions and can be tested in a later round. The unplantable fifth report arrives before round five's actions so it remains testable.
- Only investigator identity votes determine victory: at least three of five must name the killer. Full reconstruction earns a badge.
- Server-owned roles, evidence grants, clocks, phase transitions, and ballots. Retries use idempotency receipts; every room mutation holds a Postgres row lock.
- Guest credentials are opaque Secure/HttpOnly cookies in production, with hashes stored in the room. Origin checks protect browser mutations. No solution, other player's dossier, or credential hash appears in a live private projection.
- One shared one-minute reconnect pause. The roster and voting denominator stay fixed. Whole-round/final-vote absences mark the result incomplete.

## Run locally

Requires Node 22+ and Postgres (Neon recommended).

```sh
npm ci
cp .env.example .env.local
# Set DATABASE_URL (pooled), DATABASE_URL_UNPOOLED (direct), and a random AUTH_SECRET.
npm run db:migrate
npm run dev
```

Keep `.env.local` private. `AUTH_SECRET` must be a high-entropy random string; changing it invalidates the deterministic recovery for interrupted boarding requests. Existing HttpOnly room cookies continue until expiry.

```sh
npm test
npm run typecheck
npm run build
python3 docs/validate-case.py --output /tmp/last-stop-case-results.json
```

The domain tests cover secrecy, roles, state transitions, action gates, sabotage, withholding, reservations, vote invariance, reconnects, and a full rehearsal. The independent finite-case validator checks the clue predicates and coordinated solvability; neither proves human enjoyment or a measured 50/50 win rate.

## Vercel and Neon

Deploy the Next.js app on Vercel in Frankfurt (`fra1`) with the database in AWS EU Central. Set `DATABASE_URL` and `AUTH_SECRET` in Vercel. Run the versioned migration with the direct connection; it creates only the namespaced `last_stop_rooms` and `last_stop_limits` tables.

The app uses pooled `pg` connections with Fluid Compute pool attachment. Every authenticated synchronization reconciles stored deadlines under a row lock using the database clock. No long-lived process, WebSocket server, Redis, cron, or client host is required. Active browsers poll every two seconds and synchronize after commands.

The first deployment can be uploaded directly. Connecting this repository in Vercel later enables automatic deployment on pushes; this requires the Vercel GitHub integration on the account. GitHub Actions runs tests, the case validator, and a production build independently of deployment.

Rooms expire 24 hours after creation and then reject access. Expired rows and their private content are removed on the next room creation; this is lazy cleanup, not a guaranteed physical deletion at the exact 24-hour instant. No analytics, voice recording, external inference, or model training data collection is installed. A host can close a room early.

## Language input

The conductor has an authored account and a paid evidence lead. Natural-language input currently uses a narrow keyword/intent baseline with a confirmation step and a direct-button fallback. It is **not** a trained tiny language model. The UI and engine boundary are ready for an evaluated classifier; model training and claims about accuracy/download/latency remain future work. Changing wording cannot invent facts, bypass a round gate, or buy an extra discovery.

## Next acceptance gates

Run 20–30 blind six-human playtests with fresh groups, then tune one lever at a time. Measure mobile comprehension, complete-match reliability, costs under concurrent rooms, faction outcomes, and whether language input improves questioning. More player counts, public matchmaking, rankings, voice infrastructure, and a replayable case collection are deliberately outside this first six-player build.
