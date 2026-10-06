#!/usr/bin/env python3
"""Baut eine Abbildung aus ihrer Quelle neu und legt die Lieferdateien in abbildungen/kapN/ ab.

Aufruf (im Ordner der Inventur):
    python3 werkzeug/bauen.py 2.2              # Nummer, Schlüssel (abb-2-2) oder „Tab. 3.1“
    python3 werkzeug/bauen.py 3.26 --titel "Break-Even-Point-Analyse"
Optionen:
    --titel T          Titel der HTML-Seite (Dashboard, Maske); Standard: <title> der bisherigen HTML-Datei
    --trotzdem         Dateien auch übernehmen, wenn das Bauwerkzeug Probleme meldet
    --ohne-inventur    vorschau.py und inventur.py nicht aufrufen

Je Art (einordnung.json):
  D  Diagramm     quellen/kapN/<name>.py   → werkzeug/bookfig/build_figure.py      → .png .pdf .pptx
  V  Dashboard    quellen/kapN/<name>/     → daten_*.py, werkzeug/dashkit/build_dashboard.py → .html .png _daten.csv
  M  Maske        quellen/kapN/<name>/     → werkzeug/maskkit/build_maske.py        → .html .png .pdf .pptx
  T  Tabelle      tabellen/<name>.tex      → nur Vorschau und Inventur

Gebaut wird in /tmp/bauen/<name>/; dort bleiben die Prüfbilder (Graustufen, PowerPoint-Kontrolle), die
bisherige Fassung als <name>_vorher.png und ein Vergleichsblatt <name>_vergleich.png (vorher | nachher).
Übernommen werden nur die Lieferdateien, und nur wenn das Bauwerkzeug „Keine Layoutprobleme.“ meldet.
"""
import argparse
import glob
import os
import re
import shutil
import subprocess
import sys

HIER = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HIER)
sys.path.insert(0, HIER)


def finde(ziel):
    import inventur
    ziel = ziel.strip()
    for x in inventur.eintraege():
        if ziel in (x["schluessel"], x["anker"], x["label"], x["nr"]) and x["art"] in ("D", "V", "M", "T", "S"):
            return x
    sys.exit(f"{ziel}: nicht in der Inventur gefunden")


def eins(ordner, muster, ausser=()):
    treffer = [p for p in sorted(glob.glob(os.path.join(ordner, muster))) if os.path.basename(p) not in ausser]
    if len(treffer) != 1:
        sys.exit(f"In {ordner} genau eine Datei {muster} erwartet, gefunden: {[os.path.basename(t) for t in treffer]}")
    return treffer[0]


def titel_bisher(html):
    if os.path.exists(html):
        m = re.search(r"<title>(.*?)</title>", open(html, encoding="utf-8").read(), re.S)
        if m:
            return m.group(1).strip()
    return None


def vergleichsblatt(vorher, nachher, titel, ziel, breite=1100):
    """vorher | nachher nebeneinander, gleiche Breite, für die Durchsicht der Revision."""
    from PIL import Image, ImageDraw, ImageFont
    Image.MAX_IMAGE_PIXELS = None
    schrift = "/usr/share/fonts/truetype/liberation/LiberationSans-%s.ttf"
    fb = ImageFont.truetype(schrift % "Bold", 34) if os.path.exists(schrift % "Bold") else ImageFont.load_default()
    fr = ImageFont.truetype(schrift % "Regular", 26) if os.path.exists(schrift % "Regular") else fb
    bilder = []
    for p in (vorher, nachher):
        im = Image.open(p).convert("RGB")
        bilder.append(im.resize((breite, round(im.height * breite / im.width)), Image.LANCZOS))
    pad, gap = 50, 50
    h = max(b.height for b in bilder)
    blatt = Image.new("RGB", (2 * pad + 2 * breite + gap, pad + 60 + 44 + h + pad), "white")
    d = ImageDraw.Draw(blatt)
    d.text((pad, pad), titel, font=fb, fill="#1A1A1A")
    for i, (lbl, im) in enumerate(zip(("vorher", "nachher"), bilder)):
        x0 = pad + i * (breite + gap)
        d.text((x0, pad + 60), lbl, font=fr, fill="#4D4D4D")
        blatt.paste(im, (x0, pad + 104))
        d.rectangle([x0 - 1, pad + 103, x0 + breite, pad + 104 + im.height], outline="#D0D0D0")
    blatt.save(ziel, optimize=True)


def lauf(cmd, cwd=None):
    print("$", " ".join(os.path.relpath(c, ROOT) if os.path.isabs(c) and c.startswith(ROOT) else c for c in cmd))
    r = subprocess.run(cmd, cwd=cwd or ROOT, capture_output=True, text=True)
    aus = (r.stdout + r.stderr).strip()
    if aus:
        print("\n".join("  " + z for z in aus.splitlines()[-25:]))
    return r.returncode


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("nr")
    ap.add_argument("--titel")
    ap.add_argument("--trotzdem", action="store_true")
    ap.add_argument("--ohne-inventur", action="store_true")
    a = ap.parse_args()

    x = finde(a.nr)
    art, kap, stem = x["art"], x["kap"], x["stem"]
    ziel = os.path.join(ROOT, "abbildungen", f"kap{kap}")
    tmp = os.path.join("/tmp/bauen", stem)
    shutil.rmtree(tmp, ignore_errors=True)
    os.makedirs(tmp)
    vorher = os.path.join(ziel, f"{stem}.png")
    if os.path.exists(vorher):
        shutil.copy2(vorher, os.path.join(tmp, f"{stem}_vorher.png"))
    print(f"{x['label']} „{x['cap_neu']}“ – Art {art}, Datei {stem}")

    liefern, code = [], 0
    if art == "D":
        quelle = os.path.join(ROOT, "quellen", f"kap{kap}", f"{stem}.py")
        if not os.path.exists(quelle):
            sys.exit(f"Quelle fehlt: {os.path.relpath(quelle, ROOT)}")
        code = lauf([sys.executable, os.path.join(HIER, "bookfig", "build_figure.py"), quelle, "--out", tmp, "--stem", stem])
        liefern = [f"{stem}.{e}" for e in ("png", "pdf", "pptx")]
    elif art in ("V", "M"):
        ordner = os.path.join(ROOT, "quellen", f"kap{kap}", stem)
        if not os.path.isdir(ordner):
            sys.exit(f"Quellordner fehlt: {os.path.relpath(ordner, ROOT)}")
        titel = a.titel or titel_bisher(os.path.join(ziel, f"{stem}.html")) or x["cap_neu"]
        out = os.path.join(tmp, stem)
        if art == "V":
            for gen in sorted(glob.glob(os.path.join(ordner, "daten_*.py"))):
                if lauf([sys.executable, gen], cwd=ordner):
                    sys.exit(f"Datengenerator {os.path.basename(gen)} fehlgeschlagen")
            js = eins(ordner, "*.js")
            daten = eins(ordner, "*.json")
            code = lauf([sys.executable, os.path.join(HIER, "dashkit", "build_dashboard.py"), "--dashboard", js,
                         "--daten", daten, "--titel", titel, "--out", out])
            liefern = [f"{stem}.html", f"{stem}.png"]
            csvs = glob.glob(os.path.join(ordner, "*.csv"))
            if len(csvs) == 1:
                shutil.copy2(csvs[0], os.path.join(tmp, f"{stem}_daten.csv"))
                liefern.append(f"{stem}_daten.csv")
        else:
            html = eins(ordner, "*.html")
            skripte = glob.glob(os.path.join(ordner, "*.js"))
            cmd = [sys.executable, os.path.join(HIER, "maskkit", "build_maske.py"), "--maske", html, "--titel", titel,
                   "--out", out]
            if len(skripte) == 1:
                cmd += ["--skript", skripte[0]]
            code = lauf(cmd)
            liefern = [f"{stem}.{e}" for e in ("html", "png", "pdf", "pptx")]
    elif art == "T":
        if not x["tex"]:
            sys.exit("Keine .tex-Datei zur Tabelle gefunden")
        print(f"Tabelle: {x['tex']} – wird nur neu gesetzt (Vorschau) und in die Inventur übernommen")
    else:
        sys.exit(f"Art {art}: kein Bauweg (Sonderfall erst klären)")

    if code and not a.trotzdem:
        print(f"\nBauwerkzeug meldet Probleme – nichts übernommen. Prüfbilder: {tmp}")
        sys.exit(1)
    for f in liefern:
        q = os.path.join(tmp, f)
        if not os.path.exists(q):
            sys.exit(f"Erwartete Ausgabe fehlt: {q}")
        shutil.copy2(q, os.path.join(ziel, f))
    if liefern:
        print("übernommen: " + ", ".join(f"abbildungen/kap{kap}/{f}" for f in liefern))

    neu = os.path.join(tmp, f"{stem}.png")
    alt = os.path.join(tmp, f"{stem}_vorher.png")
    if os.path.exists(neu) and os.path.exists(alt):
        vergleich = os.path.join(tmp, f"{stem}_vergleich.png")
        vergleichsblatt(alt, neu, f"{x['label']} – {x['cap_neu']}", vergleich)
        print(f"Vergleich vorher/nachher: {vergleich}")

    if not a.ohne_inventur:
        lauf([sys.executable, os.path.join(HIER, "vorschau.py")])
        lauf([sys.executable, os.path.join(HIER, "inventur.py")])
    print(f"\nPrüfbilder und Zwischenstände: {tmp}")
    r = subprocess.run(["git", "status", "--short"], cwd=ROOT, capture_output=True, text=True)
    print("Geänderte Dateien:\n" + (r.stdout.rstrip() or "  (keine)"))


if __name__ == "__main__":
    main()
