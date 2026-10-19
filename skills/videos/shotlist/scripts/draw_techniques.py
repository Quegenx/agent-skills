#!/usr/bin/env python3
"""Draw a film's techniques at random from the library, so films stop converging on the same few moves.

An agent left to choose picks the first familiar option: the same fade-up, the same push-in, the same end card.
This draws from the ordered library/techniques.json manifest and its sibling parts (273 source recipes, with per-entry evidence counts in 14 categories),
weighted toward moves that fit the film's format and energy and toward proven workhorses. The seed is printed so a
plan can be reproduced and written into shotlist.md.

  python3 scripts/draw_techniques.py --format launch --energy high --seconds 25      a whole-film plan
  python3 scripts/draw_techniques.py --format loop --energy calm --seconds 8 --seed 41
  python3 scripts/draw_techniques.py --category transition --n 3 --format launch     three transitions
  python3 scripts/draw_techniques.py --category camera --exclude cam-living-hold        reroll one slot
  python3 scripts/draw_techniques.py --list [--category camera]                       ids and names
  python3 scripts/draw_techniques.py --show tr-velocity-handoff-cut                         one entry in full

Formats: launch, feature, loop, sting, walkthrough, vertical. Energy: calm, medium, high.
A plan holds about one technique per 2.5 s of film, filled in the order the format needs them, with one signature
move (two in a plan of 10 or more).

Rules: draw before you design; build the picks the concept can carry, each retold in the film's own objects; reroll a
pick that fights the concept at most twice (--exclude it, same --category) or drop it with a written reason; never add
a technique the draw did not give you (draw one with --category). A draw is a starting point, not a quota.

The recipes were written for a Remotion starter. Translate them to the seek-engine template: prog/tw -> tween,
E.out -> EASE.out, SPR.* -> the template's SPR (frequency/damping), b(bar, beat) -> beat(n), f in frames -> t in
seconds (frames / 60), C.accent -> TOKENS.accent, hitPulse and lmix are the same.
Entries marked with looks in "bans" (glow, gradients, beige, orange...) also carry a variant without them: use the
variant unless the brand owns that look.
"""
import argparse
import json
import os
import random
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
LIBRARY = next(p for p in [os.path.join(HERE, "..", "library", "techniques.json"), os.path.join(HERE, "library", "techniques.json"),
                           os.path.join(HERE, "techniques.json")] if os.path.isfile(p))

# The order a plan fills its slots, by format: what that format needs most comes first.
ORDER = {
    "launch": ["opening_hook", "transition", "typography_motion", "product_demo", "camera", "logo_and_end_card", "pacing_structure",
               "transition", "ui_choreography", "color_and_light", "data_and_numbers", "micro_interaction", "layout_and_composition",
               "texture_and_finish", "depth_and_3d", "camera"],
    "feature": ["opening_hook", "product_demo", "ui_choreography", "micro_interaction", "camera", "transition", "data_and_numbers",
                "typography_motion", "logo_and_end_card", "color_and_light", "layout_and_composition", "pacing_structure"],
    "loop": ["product_demo", "ui_choreography", "micro_interaction", "camera", "color_and_light", "transition", "typography_motion"],
    "sting": ["logo_and_end_card", "opening_hook", "micro_interaction", "color_and_light", "texture_and_finish"],
    "walkthrough": ["product_demo", "camera", "ui_choreography", "transition", "micro_interaction", "typography_motion",
                    "opening_hook", "logo_and_end_card", "data_and_numbers", "pacing_structure", "layout_and_composition", "transition"],
    "vertical": ["opening_hook", "typography_motion", "layout_and_composition", "transition", "product_demo", "camera",
                 "logo_and_end_card", "micro_interaction", "pacing_structure", "color_and_light"],
}
ROLE_W = {"workhorse": 3, "accent": 2, "signature": 1}


def weight(e, fmt, energy):
    if fmt and fmt not in e["formats"] and "any" not in e["formats"]:
        return 0
    w = ROLE_W.get(e["role"], 1) * min(3, 1 + e.get("evidence", 0) / 4)
    if energy:
        w *= 1.0 if e["energy"] == energy else 0.7 if e["energy"] == "any" else 0.25
    return w


def show(e, full=True):
    print(f"\n### {e['name']}  [{e['id']}]  {e['category']} · {e['role']} · energy {e['energy']}")
    print(e["summary"])
    if full:
        print(f"- build: {e['recipe']}")
        if e.get("bans"):
            print(f"- without {', '.join(e['bans'])}: {e.get('ban_safe_variant', '')}")
        print(f"- timing: {e['timing']}")
        print(f"- use when: {e['use_when']}")
        print(f"- avoid when: {e['avoid_when']}")
        print(f"- evidence: {e.get('evidence', 0)} (source claim, unverified; 0 has no corroborating count)")
        for key in ("correction_note", "safety_note"):
            if e.get(key):
                print(f"- source qualification: {e[key]}")


def draw(pool, rng, k):
    picks = []
    pool = list(pool)
    for _ in range(k):
        ws = [w for _, w in pool]
        if not pool or sum(ws) == 0:
            break
        i = rng.choices(range(len(pool)), weights=ws)[0]
        picks.append(pool.pop(i)[0])
    return picks


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--format", choices=list(ORDER))
    ap.add_argument("--energy", choices=["calm", "medium", "high"])
    ap.add_argument("--seconds", type=float)
    ap.add_argument("--category")
    ap.add_argument("--n", type=int, default=1)
    ap.add_argument("--seed", type=int)
    ap.add_argument("--exclude", default="")
    ap.add_argument("--list", action="store_true")
    ap.add_argument("--show")
    ap.add_argument("--json")
    a = ap.parse_args()
    with open(LIBRARY, encoding="utf-8") as source:
        manifest = json.load(source)
    lib = []
    for part in manifest["parts"]:
        with open(os.path.join(os.path.dirname(LIBRARY), part), encoding="utf-8") as source:
            lib.extend(json.load(source)["techniques"])
    by_id = {e["id"]: e for e in lib}
    if a.show:
        if a.show not in by_id:
            sys.exit(f"draw: no technique '{a.show}' (try --list)")
        show(by_id[a.show])
        return
    if a.list:
        for e in lib:
            if not a.category or e["category"] == a.category:
                print(f"{e['id']:34s} {e['category']:24s} {e['role']:10s} {e['name']}")
        return
    seed = a.seed if a.seed is not None else random.SystemRandom().randrange(1, 10 ** 6)
    rng = random.Random(seed)
    excluded = set(filter(None, a.exclude.split(",")))
    usable = [e for e in lib if e["id"] not in excluded]
    if a.category:
        pool = [(e, weight(e, a.format, a.energy)) for e in usable if e["category"] == a.category]
        picks = draw(pool, rng, a.n)
    else:
        if not a.format or not a.seconds:
            sys.exit("draw: a whole-film plan needs --format and --seconds (or pass --category)")
        n = max(3, min(len(ORDER[a.format]), round(a.seconds / 2.5)))
        signatures_left = 2 if n >= 10 else 1
        picks = []
        for cat in ORDER[a.format][:n]:
            pool = [(e, weight(e, a.format, a.energy)) for e in usable if e["category"] == cat and e not in picks
                    and (e["role"] != "signature" or signatures_left > 0)]
            got = draw(pool, rng, 1)
            if got:
                if got[0]["role"] == "signature":
                    signatures_left -= 1
                picks.append(got[0])
    if not picks:
        sys.exit(1)
    print(f"seed {seed}: {len(picks)} technique(s)" + (f" for a {a.seconds:g} s {a.format} film" if a.seconds else ""))
    for e in picks:
        show(e)
    if a.json:
        json.dump({"seed": seed, "picks": [e["id"] for e in picks]}, open(a.json, "w"), indent=2)


if __name__ == "__main__":
    main()
