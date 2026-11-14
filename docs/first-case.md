# The Bell at 21:11

Design fixture `last-stop-bell-001`, version 1.0.0. Six humans: five investigators and one killer. This document contains the solution and private dossiers. Give players only their own dossier and currently authorized cards.

This is a complete first blind-test case, not a replayable case generator. Randomize which person receives each character, but do not run this same mystery twice with a group that knows its answer. Renaming Cora does not create a new mystery.

## Public opening

At 21:15, conductor Mara finds Victor Ash dead in the vestibule of the overnight train. The train reaches its final station after five investigation rounds. Someone aboard moved Victor after the attack. The passengers must identify the killer before arrival.

Exactly one of the six passengers killed Victor between 21:10 and 21:12. The weapon is one of four listed objects: a brass signal bell, steel spanner, brass paperweight, or silver letter opener. The original scene is the lounge, dining carriage, sleeper, or luggage carriage. There are no outside killers, accomplices, unlisted weapons, or unrecorded transfers that can invalidate a certified access or custody record. Those are explicit puzzle premises.

Character names and the four weapon/scene choices are public. Role screens are private and never admissible proof. Everyone may claim innocence; the killer may lie about their account. Certified cards cannot be edited. Witness reports and player statements may be misleading until tested.

## Private dossiers

Each player knows only their own role, account, and secret. Innocent accounts are not independent certified alibis. Other players can believe or challenge them. All background secrets concern events before 21:05; revealing them immediately does not add a certified murder-window constraint.

| Character | Private role and account | Secret and optional one-action objective |
| --- | --- | --- |
| Ada Reed, travel clerk | Investigator. You were alone in the lounge during 21:10–21:12. You know you did not kill Victor; you did not see another passenger during the window. | At 19:55 you changed a sleeper reservation to conceal a booking error. Retrieve the original booking slip. |
| Ben Ward, railway musician | Investigator. You were alone in the lounge alcove during the window, with no view of Ada's seat. You returned the bell after a rehearsal at 20:45; you do not know its later custody. | Victor threatened to report your unpaid licensing fee. Recover the receipt that settles it. |
| Cora Vale, accounts officer | Killer. At 21:07 you collected the bell; at 21:10 you met Victor in the sleeper; at 21:11 you killed him; by 21:14 you moved the body through the luggage carriage into the vestibule. Your suggested cover is that you worked alone in the lounge during the murder window. | Victor discovered a false reimbursement claim. Retrieve its duplicate before arrival. You have two sabotage tokens, usable in rounds 1–4 while retaining your ordinary action. Your goal is to prevent three investigator ballots from naming you. |
| Daan Voss, mechanic | Investigator. You were alone in the lounge's rear recess during the window. You saw no one clearly enough to establish an alibi. | You owe Victor money under a note signed at 20:20. Retrieve the repayment agreement. |
| Eli March, courier | Investigator. You were alone in your sleeper compartment during the window and heard nothing you can place reliably. | At 20:30 you delivered a private family letter to Victor's tray. Recover the delivery receipt. |
| Freya Lind, journalist | Investigator. You were alone in the lounge's writing booth during the window. You did not see another passenger. | At 20:15 you argued with Victor about publishing an embarrassing letter. Recover your original interview notes. |

Objectives are visibly optional. Completing one earns a personal badge only if the player's faction wins. There is no point total that rewards sacrificing the team. Players may disclose their secrets without losing their main victory condition.

## Author-only truth and route

Cora used the brass signal bell in the sleeper. Victor was blackmailing her over the reimbursement claim. The body was moved to manufacture uncertainty about the scene.

The train's relevant route is lounge → dining → sleeper → luggage → vestibule. Moving one carriage takes one minute. Cora's three-minute gap between collecting the bell and meeting Victor permits the journey from dining to sleeper. The attack at 21:11 and arrival in the vestibule at 21:14 permit moving through luggage after its seal releases at 21:12. The route is checked against these stated travel assumptions; it is not a forensic simulation.

## Lead schedule and evidence

Round one opens E1 and E3. E2 and E4 are visible as upcoming leads and open in round two. The two sleeper-access corroboration leads open in round three, alongside a new report to challenge. The two bell-custody leads open in round four. These arrivals are announced from the start. Round five is recovery time. This avoids misleading players about whether a locked record is available.

Each investigation action contributes one work unit. All contributors, including contributors from earlier rounds, receive a completed card. A hostile player can withhold their copy. Anyone else may retrieve a completed unpublished card for one action. Publishing costs nothing. Reservations are anonymous and advisory: show aggregate reserved units, not a reserving player’s identity. A reservation never blocks another player from committing work to an unfinished lead. Warn about redundant work; if players still overfill a lead, every contributor receives its card, and excess units do not become bonus actions. This prevents reserve-and-withdraw denial of access.

| ID | Lead and location | Opens | Work | Canonical certified result |
| --- | --- | --- | --- | --- |
| E1 | Carriage fibre comparison, lounge | 1 | 2 | The scene is sleeper or luggage. |
| E2 | Timed carriage seals, dining | 2 | 2 | Dining and luggage are excluded during 21:10–21:12. The scene is sleeper or lounge. Seals release at 21:12. |
| E3 | Railway inventory comparison, luggage | 1 | 3 | The weapon is bell or spanner: only those listed objects carry railway inventory coating. |
| E4 | Metal sample analysis, lounge | 2 | 3 | The weapon is bell or paperweight: only those listed objects are brass. |
| E5a | Sleeper door audit, sleeper | 3 | 2 | If the scene is sleeper, the killer is Ada, Cora, or Eli. The certified audit covers all possible access. |
| E6a | Bell custody audit, dining | 4 | 2 | If the weapon is the bell, the killer is Ben, Cora, or Daan. The certified record covers all possible handlers. |
| E5b | Conductor's duplicate key ledger, dining | 3 | 2 | An independently checked issued-key ledger supplies the same conditional access fact as E5a. |
| E6b | Bell checkout counterfoils, luggage | 4 | 2 | Independently retained station counterfoils supply the same conditional custody fact as E6a. |

Full authored wording is in `case.json`. The conditions on E5 and E6 must remain visible: neither card alone proves that its three names contain the killer unless the relevant scene or weapon has also been established.

E1 plus E2 establishes the sleeper. E3 plus E4 establishes the bell. Either E5 source gives Ada/Cora/Eli; either E6 source gives Ben/Cora/Daan. Their intersection is Cora. A shortest proof therefore uses six cards and fourteen work units. The backup routes share the four preliminary facts but have separate sources for both decisive records. No final exclusive clue must be handed over by the killer.

Do not present this solution chain automatically during play. The notebook lets players record their own exclusions. The recap explains the chain after voting.

## Scheduled reports and tests

Each round publishes one inbox report marked **Untested**. The killer may replace the current round's eligible report with its authored planted version, at most once per match. Every inbox has the same timing, styling, and card count. Planting supplies no automatic visual tell.

| Round | Ordinary report | Permitted planted report | One-action test result |
| --- | --- | --- | --- |
| 1 | Ben carried the bell earlier tonight. | Ben carried the bell just before the body was found. | The image is from 20:40; he returned it at 20:45. It establishes nothing about custody during the murder window. |
| 2 | Ada changed a sleeper reservation before departure. | Ada changed a sleeper reservation after the alarm. | The edit was at 19:55. It establishes no murder-window access or location. |
| 3 | Freya argued with Victor before dinner. | Freya threatened Victor in the sleeper near the murder window. | The source recording is from the lounge at 20:15. It is not a murder-window alibi. |
| 4 | Daan owes Victor money. | Daan offered money to hide the bell after the alarm. | The cited note records a debt at 20:20; it contains no request to hide an object. |
| 5 | Eli carried a letter for Victor. | None: sabotage has ended. | Delivery was at 20:30. The letter concerns a family dispute and provides no murder-window alibi. |

Tests publish their result automatically. The original report remains visible beside the correction. These reports help players evaluate accounts and motive; none adds a new certified constraint to the six-fact proof. Players are told that testing every rumor is optional. There are eight main cards and five inbox cards, not thirteen mandatory tasks. Repeated groups must receive fresh cases in which lead usefulness varies; this fixture is for blind testing only.

## Conductor interaction and tiny-model boundary

Mara initially says: “I followed the normal key procedure.” Her private embarrassment is that she issued duplicate keys without immediately updating her own notebook. This is a background account, not a certified access fact. An ordinary question cannot reveal who the killer is.

When round three begins, the delayed station register is available. Selecting **Check your key record against these findings** with E1 and E2 attached gives a supported challenge. Its explanation is: “You place the attack in the sleeper. Will you check every issued key?” This is available through buttons and through natural-language interpretation.

The challenge maps to E5b, one work unit per committed action, two total units. Work includes retrieving and reconciling the register; the cost is the same as directly requesting the record. Multiple players can contribute in the same round. On completion Mara's authored reaction is: “I failed to update my notebook. Here is the checked register.” The attached certified card is exactly E5b. Her concession creates no additional evidence, cheaper route, or early unlock.

The model receives the player's question, selected witness, attached authorized evidence labels, and supported intent descriptions. It returns an intent and target IDs. The server validates IDs, prerequisites, round, action cost, and ownership. The player confirms the interpretation before spending anything. The model cannot decide truth, invent a concession, alter a record, read roles, or see future answers.

The initial interface supports eight intents: ask account, ask access, challenge account, request record, clarify statement, ask motive, repeat answer, and unsupported question. Requests for new case information map to an ordinary lead or a fixed unavailable response. Clarification/repetition can show only material already authorized to that player. No confidence score or unsupported-question response provides hidden correctness feedback.

The model is optional. Buttons are the first implementation and remain fully functional if a download fails. Training a small custom intent classifier is a later measured experiment; no model has been trained for this fixture.

## Sabotage and final verdict

The killer retains an ordinary action every round and separately has two interference tokens. In rounds 1–4, at most one token can be used per round. A token either adds one work unit to an available unfinished lead, once per lead, or plants one eligible report, once per match. Round five permits no new interference. An invalid target spends no token; the submission result is private.

All ordinary actions and interference selections lock together at the planning deadline. Validate targets against the state immediately before resolution, apply obstruction, then resolve work. A lead becoming complete in that same resolution was an eligible unfinished target. An already completed lead is not. Ordinary-action success cannot certify innocence because the killer can work and interfere in the same round.

At the end, every player privately saves a killer, weapon, and scene. Only the five investigator killer fields determine the faction result. Three or more naming Cora wins for the investigators; otherwise Cora wins. A blank counts as incorrect. An investigator who also names the bell and sleeper earns a reconstruction badge. It never changes the faction result. No midgame elimination, majority expulsion, or early accusation is available.

## What was checked

The runnable validator enumerates all 96 killer/weapon/scene combinations and all 256 evidence subsets for each of six perspectives: public information and each of the five investigators' own innocence. The actual tuple is uniquely identified, the cheapest killer proof is fourteen actions from every perspective, and pre-round-four evidence still leaves at least two candidate killers for each investigator (two for Ada and Eli; three for Ben, Daan, and Freya).

A fixed visible-state investigation policy was checked against 12,325 interference/work/withholding history prefixes, represented by 993 state transitions. It obtains the proof by round five in every explored history, without requiring hostile publication. Planning occurs before the current round's obstruction becomes visible. This is a solvability result for coordinated play, not a prediction that people will find the route. Histories stop when proof is acquired; they are not thousands of distinct mysteries or playtests.

The verdict checker passes 5,112 checks over 568 investigator-vote patterns for proposed counts 4–10. Five negative controls are rejected: false truth, early access to the solution, a proof made too cheap, missing backup corroboration, and an unavailable decisive record. The case's travel route also passes its stated timing checks.

These checks do not establish fun, a 50/50 win rate, narrative plausibility beyond the explicit premises, a secure implemented server, mobile performance, or model quality. Those are separate build and playtest gates.

## First playtest script

Use six people who have not read this solution. The facilitator may know it but must not join as an investigator. Randomly distribute characters. Teach one sample unrelated clue, the three evidence labels, one normal action, and the private final ballot before starting.

Use the voice preset: one-minute briefing; five rounds of 30 seconds planning, 15 seconds reading, and 60 seconds discussion; then 60 seconds final discussion, 30 seconds private voting, and 45 seconds reveal. That is twelve minutes excluding the lobby and any reconnect pause. For a group using only text, select the longer preset before assignment: 45 seconds planning, 30 seconds reading, and 90 seconds discussion per round, giving seventeen minutes. Do not change the preset mid-match.

After reveal, ask everyone privately whether they understood their choices, felt able to influence the result, felt heard, and would play another case. Record where the first confident accusation appeared, which cards were misunderstood, which optional tests consumed actions, and whether anyone felt unable to recover from an error. Ask the killer which truthful facts made their cover untenable.

Run an initial 20–30 completed six-player games with fresh groups. Separate prior experience and the communication preset. Improve wording before changing costs; change one major balance lever at a time. Revalidate every edit. The initial faction target is 45–55% among experienced groups, but a small pilot cannot certify that range. Do not count repeat exposure to this solution as independent balance evidence. A new case collection is needed for rematch and long-term balance testing.
