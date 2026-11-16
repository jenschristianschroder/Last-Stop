# Exploration gameplay prototype

The loop is: choose a destination → travel through the train → search an object → commit fieldwork → compare findings → accuse. Players decide whether to split up or combine limited work on a difficult lead. The killer must visit a lead to obstruct it, creating an opportunity to be seen.

This is a discrete carriage-movement prototype, not a free-roaming character controller. Graphics intentionally use rectangles, labels and colored passenger dots. Searches use a short timer; object-specific puzzles, proximity chat, item trading and roaming within individual cars are future design work, not implemented features.

## Rules

- Four adjoining cars: lounge, dining, sleeper, luggage. Everyone starts in the lounge.
- Movement only during investigation; two-second crossing cooldown, checked on the server.
- Search a local available object for four seconds, then commit fieldwork. Changing targets restarts the search. Leaving discards search progress, but previously committed work remains saved.
- One final ordinary action per round. Replacing it does not produce extra progress. Work resolves at the bell, with the original clue costs and unlock rounds.
- Tests and retrieval require local presence. Publishing remains free and train-wide.
- Nearby passenger positions are visible. Remote positions, private searches and sabotage choices are not exposed.
- Sabotage must be selected locally; a player may subsequently leave. Two tokens and existing round limits still apply.
- Missed human actions are passes. Bots schedule travel and work during the window; they do not acquire knowledge merely by moving.
- Voice investigations last 60 seconds; text investigations last 90 seconds. Total scheduled matches are 13m45s / 20m, excluding lobby and reconnect pause.

## Verification

18 engine tests cover the original deduction rules, adjacent movement, crossing cooldown, search timer, remote access rejection, stale rounds, pause, hidden remote positions, no idle clue awards, local sabotage, and a full bot match that identifies the unique solution. Production compilation and TypeScript checks pass.

Browser verification was attempted, but Chromium could not launch because the execution environment disallowed its process socket. Desktop/mobile visual interaction checks and Neon-backed multiplayer verification remain unverified. Human timing and faction balance require fresh six-player playtests; no measured balance claim is made.
