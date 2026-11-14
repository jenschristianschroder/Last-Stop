"""Finite-model design checks, not the game server. Python 3.10+, stdlib only.

Run: python3 validate.py --output validation-results.json
Scope: the authored 96-world fixture, certified facts, one known-innocent
perspective at a time, aggregate simultaneous work, and the specified fixed
coordinated policy. Humans need not discover or follow that policy.
"""
from __future__ import annotations
import argparse
import copy
import itertools
import json
from collections import Counter, deque
from pathlib import Path


def accepts(fact, world):
    if fact["op"] == "in":
        return world[fact["field"]] in fact["values"]
    if fact["op"] == "implies_in":
        return (world[fact["if_field"]] != fact["if_value"] or
                world[fact["field"]] in fact["values"])
    raise ValueError("Unknown predicate")


def candidates(case, selected, innocent=None):
    facts = {lead["fact"] for lead in selected}
    return [dict(zip(("killer", "weapon", "scene"), values))
            for values in itertools.product(case["suspects"], case["weapons"], case["scenes"])
            if values[0] != innocent and all(accepts(case["facts"][f],
                dict(zip(("killer", "weapon", "scene"), values))) for f in facts)]


def logic_checks(case):
    errors, costs = [], {}
    leads = case["leads"]
    if not all(accepts(f, case["truth"]) for f in case["facts"].values()):
        errors.append("A certified fact excludes the truth")
    if candidates(case, leads) != [case["truth"]]:
        errors.append("Complete evidence is not uniquely the selected truth")
    innocents = [s for s in case["suspects"] if s != case["truth"]["killer"]]
    early = [l for l in leads if l["unlock"] < 4]
    for perspective in [None] + innocents:
        if len({w["killer"] for w in candidates(case, early, perspective)}) < 2:
            errors.append("Premature solution for " + str(perspective))
        proofs = []
        for bits in itertools.product((False, True), repeat=len(leads)):
            selected = [l for l, chosen in zip(leads, bits) if chosen]
            worlds = candidates(case, selected, perspective)
            if len({w["killer"] for w in worlds}) == 1:
                proofs.append(sum(l["cost"] for l in selected))
                if len(selected) < 3 or len({l["location"] for l in selected}) < 2 or len({l["category"] for l in selected}) < 2:
                    errors.append("Proof lacks required evidence diversity")
        costs[str(perspective or "public")] = min(proofs, default=None)
        if not proofs or not case["proof_cost_band"][0] <= min(proofs) <= case["proof_cost_band"][1]:
            errors.append("Proof cost outside design band for " + str(perspective))
    for fact in ("F5", "F6"):
        if len([l for l in leads if l["fact"] == fact]) < 2:
            errors.append("Missing independent decisive source: " + fact)
    return errors, {"worlds": len(candidates(case, [])), "subsets_per_perspective": 2**len(leads),
                    "perspectives": 1 + len(innocents), "minimum_killer_proof_cost": costs,
                    "early_killer_candidates": {str(p or "public"): len({w["killer"] for w in candidates(case, early, p)}) for p in [None]+innocents}}


def check_timeline(case):
    t = case["timeline"]
    graph = {}
    for a, b in t["edges"]:
        graph.setdefault(a, []).append(b)
        graph.setdefault(b, []).append(a)
    def distance(start, end):
        queue, visited = deque([(start, 0)]), {start}
        while queue:
            place, d = queue.popleft()
            if place == end:
                return d * t["minutes_per_edge"]
            for nxt in graph[place]:
                if nxt not in visited:
                    visited.add(nxt)
                    queue.append((nxt, d + 1))
        raise ValueError("Disconnected route")
    path = t["killer_path"]
    assert all(b["minute"] - a["minute"] >= distance(a["place"], b["place"]) for a, b in zip(path, path[1:]))
    attack = next(x for x in path if x["event"] == "attack")
    assert attack["place"] == case["truth"]["scene"] and 10 <= attack["minute"] <= 12
    assert path[-1]["minute"] < t["body_found_minute"]
    return {"path_segments_checked": len(path)-1, "scope": "Authored killer route on the stated one-minute carriage graph; not a general narrative-consistency proof."}


def schedule_checks(case):
    """Explore all legal interference and hostile investigate/withhold choices.

    All investigator planning uses the preceding visible state: an obstruction
    cannot be anticipated within its round. Progress contributors receive the
    card on completion, including contributors from earlier rounds. A completed
    lead with no investigator contributor costs one action to retrieve.
    The killer never publishes and never helps with private tests or secrets.
    Non-investigate normal actions are equivalent to 'no useful work' here.
    Hostile work may also overfill advisory reservations without excluding
    any investigator contribution.
    """
    leads = case["leads"]
    ids = {l["id"]: i for i, l in enumerate(leads)}
    priority = [ids[x] for x in case["proof_policy"]]
    base = tuple(l["cost"] for l in leads)
    fact_bit = {f: 1 << i for i, f in enumerate(case["facts"])}
    target = sum(fact_bit.values())
    # State: progress, jam mask, investigator-contributor mask, owned facts,
    # tokens used, planted, first proof round. Values count decision histories.
    initial = ((0,)*len(leads), 0, 0, 0, 0, False, 0)
    states = Counter({initial: 1})
    layer_sizes, branches, terminal = [], 0, Counter()
    for round_no in range(1, case["rounds"] + 1):
        nxt = Counter()
        for state, ways in states.items():
            progress, jams, contributed, owned, used, planted, won = state
            if won:
                terminal[won] += ways
                continue
            costs = [c + ((jams >> i) & 1) for i, c in enumerate(base)]
            available = [i for i, l in enumerate(leads) if l["unlock"] <= round_no]
            work, retrievals, remaining = [0]*len(leads), [], case["investigators"]
            for i in priority:
                if i not in available or (owned & fact_bit[leads[i]["fact"]]):
                    continue
                if progress[i] >= costs[i]:
                    if remaining:
                        retrievals.append(i)
                        remaining -= 1
                else:
                    work[i] = min(remaining, costs[i]-progress[i])
                    remaining -= work[i]
                if remaining == 0:
                    break
            interference = [("none", -1)]
            if used < case["sabotage"]["tokens"] and round_no <= case["sabotage"]["last_round"]:
                interference += [("jam", i) for i in available if progress[i] < costs[i] and not ((jams >> i) & 1)]
                if not planted and any(t["round"] == round_no and "planted" in t for t in case["inbox"]):
                    interference.append(("plant", -1))
            hostile_work = [-1] + [i for i in available if progress[i] < costs[i]]
            for (kind, target_i), hostile_i in itertools.product(interference, hostile_work):
                branches += 1
                new_jams = jams | ((1 << target_i) if kind == "jam" else 0)
                new_costs = [c + ((new_jams >> i) & 1) for i, c in enumerate(base)]
                new_progress = tuple(min(new_costs[i], progress[i] + work[i] + (i == hostile_i)) for i in range(len(leads)))
                new_contributed = contributed
                new_owned = owned
                for i in available:
                    if work[i]:
                        new_contributed |= 1 << i
                    if new_progress[i] >= new_costs[i] and ((new_contributed >> i) & 1 or i in retrievals):
                        new_owned |= fact_bit[leads[i]["fact"]]
                new_won = round_no if new_owned == target else 0
                new_state = (new_progress, new_jams, new_contributed, new_owned,
                             used + (kind != "none"), planted or kind == "plant", new_won)
                nxt[new_state] += ways
        states = nxt
        layer_sizes.append(len(states))
    failures = sum(ways for state, ways in states.items() if not state[-1])
    for state, ways in states.items():
        if state[-1]:
            terminal[state[-1]] += ways
    return {"passed": failures == 0, "failing_histories": failures,
            "state_counts_by_round": layer_sizes, "transitions_checked": branches,
            "terminal_histories": sum(terminal.values()) + failures,
            "successful_history_prefixes_by_proof_round": dict(sorted(terminal.items())),
            "latest_proof_round": max(terminal, default=None),
            "scope": "One fixed five-investigator coordinated policy, all legal jam/plant sequences and all hostile lead-work/withholding choices, stopping each history at proof. No guarantee humans follow the policy."}


def winner(investigator_ballots, hostile_ballots, actual):
    # All ballots have fields; only investigator identity votes affect victory.
    correct = sum(b.get("killer") == actual for b in investigator_ballots)
    return "investigators" if 2*correct > len(investigator_ballots) else "hostiles"


def verdict_checks():
    checks, patterns = 0, 0
    thresholds = {}
    for players in range(4, 11):
        hostile_count = 1 if players <= 7 else 2
        n = players - hostile_count
        thresholds[str(players)] = n//2 + 1
        for bits in itertools.product((False, True), repeat=n):
            patterns += 1
            expected = "investigators" if sum(bits) >= n//2+1 else "hostiles"
            for embellishment in ({}, {"weapon":"right", "scene":"right"}, {"weapon":"wrong", "scene":"wrong"}):
                ballots = [dict(embellishment, killer="Cora" if b else None) for b in bits]
                for cover in ([], [{"killer":"Cora"}]*hostile_count, [{"killer":"Ada"}]*hostile_count):
                    assert winner(ballots, cover, "Cora") == expected
                    checks += 1
    return {"identity_patterns": patterns, "checks": checks, "thresholds": thresholds,
            "scope": "Strict majority, blanks, cover-ballot invariance, and reconstruction-field invariance. Not human win rates."}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default="validation-results.json")
    args = parser.parse_args()
    case = json.loads(Path(__file__).with_name("case.json").read_text())
    errors, logic = logic_checks(case)
    assert not errors, errors
    schedule = schedule_checks(case)
    assert schedule["passed"], schedule
    negative_controls = {}
    bad = copy.deepcopy(case)
    bad["truth"]["killer"] = "Ada Reed"
    negative_controls["false_truth_rejected"] = bool(logic_checks(bad)[0])
    bad = copy.deepcopy(case)
    for lead in bad["leads"]:
        lead["unlock"] = 1
    negative_controls["early_solution_rejected"] = bool(logic_checks(bad)[0])
    bad = copy.deepcopy(case)
    for lead in bad["leads"]:
        lead["cost"] = 1
    negative_controls["cheap_proof_rejected"] = bool(logic_checks(bad)[0])
    bad = copy.deepcopy(case)
    bad["leads"] = [l for l in bad["leads"] if l["id"] != "E5b"]
    negative_controls["missing_backup_rejected"] = bool(logic_checks(bad)[0])
    bad = copy.deepcopy(case)
    for lead in bad["leads"]:
        if lead["fact"] == "F6":
            lead["unlock"] = 6
    negative_controls["impossible_schedule_rejected"] = not schedule_checks(bad)["passed"]
    assert all(negative_controls.values()), negative_controls
    result = {"case_id":case["id"], "case_version":case["version"], "status":"PASS",
              "logic":logic, "timeline":check_timeline(case), "schedule":schedule,
              "verdict":verdict_checks(), "negative_controls":negative_controls,
              "not_tested":["Human enjoyment or faction win rates", "Narrative realism beyond stated premises and route", "Actual server, client or database implementation", "Network failures or device performance", "Tiny-model accuracy, latency or download size", "Other player counts or replayable case generation"]}
    Path(args.output).write_text(json.dumps(result, indent=2)+"\n")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
