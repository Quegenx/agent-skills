#!/usr/bin/env python3
"""WCAG 2.x contrast between two colors, so a pairing is computed, never eyeballed.

  python3 contrast.py "#777777" "#ffffff"          one pair: ratio and pass/fail per use
  python3 contrast.py "#fff" "#1f5bff" "#9aa"       the first color against each of the others

Colors are #rgb or #rrggbb (the # is optional). Thresholds: normal text 4.5, large text (14pt bold
or 18pt, "approximately 18.5px and 24px" per W3C Understanding 1.4.3) 3.0, interface parts and focus rings 3.0, enhanced (AAA) 7.0 and 4.5.
"""
import sys


def parse_hex_color(text):
    h = text.strip().lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    if len(h) != 6 or any(c not in "0123456789abcdefABCDEF" for c in h):
        sys.exit(f"contrast: not a hex color: {text!r} (use #rgb or #rrggbb)")
    return [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]


def relative_luminance(rgb):
    lin = [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in rgb]
    return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]


def contrast_ratio(a, b):
    la, lb = sorted((relative_luminance(parse_hex_color(a)), relative_luminance(parse_hex_color(b))), reverse=True)
    return (la + 0.05) / (lb + 0.05)


def report_pair(a, b):
    r = contrast_ratio(a, b)
    verdict = lambda need: "PASS" if r >= need else "FAIL"
    # Verdicts use the unrounded ratio (W3C: do not round), so 4.499 prints "4.50:1" and still fails 4.5.
    print(f"{a} on {b}: {r:.2f}:1")
    print(f"  normal text (AA 4.5):   {verdict(4.5)}")
    print(f"  large text (AA 3.0):    {verdict(3.0)}")
    print(f"  UI parts, focus (3.0):  {verdict(3.0)}")
    print(f"  normal text (AAA 7.0):  {verdict(7.0)}")
    return r


if __name__ == "__main__":
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    worst = min(report_pair(sys.argv[1], other) for other in sys.argv[2:])
    sys.exit(0 if worst >= 4.5 else 1)
