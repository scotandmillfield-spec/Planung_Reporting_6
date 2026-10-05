#!/usr/bin/env python3
"""Baut eine Abbildung aus einem Abbildungsskript.

Aufruf:
    python3 scripts/build_figure.py <abbildungsskript.py> [--out ORDNER] [--stem abb_2-1]

Das Abbildungsskript definiert build(theme) -> bookfig.Fig und optional STEM.
Ausgabe in ORDNER: <stem>.png (600 dpi), <stem>.pptx (editierbar), <stem>.pdf (Vektor)
sowie _graustufen/<stem>_grau.png als Druckvorschau.
Exit-Code 1, wenn Layoutwarnungen (Überlauf, Kontrast) oder die PPTX-Validierung anschlagen.
"""
import argparse
import importlib.util
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import bookfig  # noqa: E402

VALIDATOR = "/mnt/skills/public/pptx/scripts/office/validate.py"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("script")
    ap.add_argument("--out", default="out")
    ap.add_argument("--stem", default=None)
    a = ap.parse_args()

    spec = importlib.util.spec_from_file_location("figmod", a.script)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    stem = a.stem or getattr(mod, "STEM", None) or os.path.splitext(os.path.basename(a.script))[0]

    fig = mod.build(bookfig.THEME)
    pptx, pdf, png = fig.save(a.out, stem)
    print(f"Größe: {fig.w:.1f} x {fig.h:.1f} mm")
    for p in (png, pptx, pdf):
        print("geschrieben:", p)

    problems = fig.report()
    if fig.w > bookfig.FIG_W + 0.01 and fig.w != bookfig.FIG_W_QUER:
        problems.append(f"[Format] Breite {fig.w} mm weicht von {bookfig.FIG_W} bzw. {bookfig.FIG_W_QUER} mm ab")
    if fig.w == bookfig.FIG_W_QUER and fig.h > 98.0:
        problems.append(f"[Format] Querabbildung zu hoch ({fig.h} mm > 98 mm)")

    if os.path.exists(VALIDATOR):
        r = subprocess.run(["python3", VALIDATOR, pptx], capture_output=True, text=True)
        if "PASSED" not in r.stdout + r.stderr:
            problems.append("[PPTX-Validierung] " + (r.stdout + r.stderr).strip()[-400:])

    if problems:
        print("\nPROBLEME:")
        for m in problems:
            print("  ", m)
        sys.exit(1)
    print("Keine Layoutprobleme.")


if __name__ == "__main__":
    main()
