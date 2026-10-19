"""Set up a word-fold animation inside a CoAnimator project.

usage: python3 init_word.py <project-dir> WORD [--color "#RRGGBB"]

Copies the kit into the project if it is not there yet:
    <project>/word-fold/fold.js      engine (edit this copy to add letters/endings)
    <project>/vendor/kc-player.js    CoAnimator player contract (__kcControl)
    <project>/assets/sfx/fold/*.wav  soft footstep x2 + landing pop
and writes <project>/word-fold/<word>.html from the starter. It never overwrites an
existing fold.js or word page, so project customization is kept.
[word-fold, scripts/init_word.py; SKILL.md]
Exclusive creation: https://docs.python.org/3/library/functions.html#open
"""
import argparse, os, re, shutil, sys

SKILL = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KIT = os.path.join(SKILL, "assets", "kit")
ENDINGS = set("ATIN")


def glyphs_in(fold_js):
    src = open(fold_js).read()
    block = src[src.index("const GLYPH={"):src.index("};", src.index("const GLYPH={"))]
    return set(re.findall(r"^\s*([A-Z0-9]):\{w:", block, re.M))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("project")
    ap.add_argument("word")
    ap.add_argument("--color", default="#8B5CF6")
    a = ap.parse_args()
    word = a.word.upper()
    if not re.fullmatch(r"[A-Za-z0-9]+", a.word):
        sys.exit("Give one word (letters/digits). For a phrase, make one page per word.")
    if not re.fullmatch(r"#[0-9A-Fa-f]{6}", a.color):
        sys.exit("word-fold: color must be #RRGGBB.")
    proj = os.path.abspath(a.project)
    if not os.path.exists(os.path.join(proj, "project.json")):
        sys.exit(f"{proj} has no project.json. Pick a CoAnimator project folder.")

    page = os.path.join(proj, "word-fold", f"{word.lower()}.html")
    if os.path.lexists(page):
        sys.exit(f"word-fold: page already exists; edit it in place: {page}")
    fold = os.path.join(proj, "word-fold", "fold.js")
    os.makedirs(os.path.dirname(fold), exist_ok=True)
    if not os.path.exists(fold):
        shutil.copy(os.path.join(KIT, "fold.js"), fold)
    player = os.path.join(proj, "vendor", "kc-player.js")
    if not os.path.exists(player):
        os.makedirs(os.path.dirname(player), exist_ok=True)
        shutil.copy(os.path.join(KIT, "kc-player.js"), player)
    sfx = os.path.join(proj, "assets", "sfx", "fold")
    os.makedirs(sfx, exist_ok=True)
    for f in os.listdir(os.path.join(SKILL, "assets", "sfx")):
        if not os.path.exists(os.path.join(sfx, f)):
            shutil.copy(os.path.join(SKILL, "assets", "sfx", f), os.path.join(sfx, f))

    have = glyphs_in(fold)
    missing = sorted(set(word) - have)
    end = word[-1]
    if missing or end not in ENDINGS:
        if missing:
            print(f"MISSING GLYPHS: {' '.join(missing)}; add them to project word-fold/fold.js (source references/glyphs.md)")
        if end not in ENDINGS:
            print(f"ENDING: {end} needs an engine ending and an ENDINGS entry in this helper (source references/endings.md)")
        sys.exit("word-fold: kit copied if missing; no page written until glyphs/endings are supported.")
    html = open(os.path.join(KIT, "starter.html")).read()
    html = (html.replace("__WORD__", word).replace("__COLOR__", a.color)
                .replace("__END__", end)
                .replace("__GAPS__", "[" + ",".join(["15"] * (len(word) - 1)) + "]"))
    try:
        with open(page, "x", encoding="utf-8") as f:
            f.write(html)
    except FileExistsError:
        sys.exit(f"word-fold: page already exists; left unchanged: {page}")
    print(f"wrote {os.path.relpath(page, proj)}")
    print("next: python3 scripts/space_word.py", os.path.relpath(page), word)


if __name__ == "__main__":
    main()
