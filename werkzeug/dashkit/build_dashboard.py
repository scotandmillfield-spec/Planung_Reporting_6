#!/usr/bin/env python3
"""Bündelt ein Dashboard zu einer eigenständigen HTML-Datei und rendert das Druck-PNG.

Aufruf:
    python3 build_dashboard.py --dashboard personal.js --daten data.json --titel "Personalstrukturanalyse" \
        --out out/dash_personalstruktur [--varianten blaugruen,gruen] [--kein-png]

Ausgabe: <out>.html (Lernplattform), <out>.png (600 dpi), _graustufen/<name>_grau.png.
Maßstab fest: 1024 px = 155 mm (14 px = 6 pt). Dashboard 1024 x 646 px = 155 x 97,8 mm,
Einzelvisual 727 px breit = 110 mm (Seitengröße kommt aus DK.init({breite, hoehe})).
Mit --varianten werden zusätzliche PNGs je Grünton erzeugt (<out>_<variante>.png).
"""
import argparse
import json
import os
import sys

from PIL import Image

HIER = os.path.dirname(os.path.abspath(__file__))
SEITE_B, SEITE_H = 1024, 646
DRUCK_MM = 155.0
DPI = 600


def lesen(p):
    with open(p, encoding="utf-8") as fh:
        return fh.read()


def buendeln(dashboard, daten, titel, out_html):
    css = lesen(os.path.join(HIER, "dashkit.css"))
    kit = lesen(os.path.join(HIER, "dashkit.js"))
    js = lesen(dashboard)
    data = json.dumps(json.load(open(daten, encoding="utf-8")), ensure_ascii=False, separators=(",", ":"))
    sicher = lambda s: s.replace("</", "<\\/")
    html = f"""<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{titel}</title>
<style>
{css}
</style>
</head>
<body>
<script>const DATA = {sicher(data)};</script>
<script>
{sicher(kit)}
</script>
<script>
{sicher(js)}
</script>
</body>
</html>
"""
    os.makedirs(os.path.dirname(os.path.abspath(out_html)), exist_ok=True)
    with open(out_html, "w", encoding="utf-8") as fh:
        fh.write(html)
    return out_html


def rendern(html, png, gut=None):
    from playwright.sync_api import sync_playwright
    px = DRUCK_MM / 25.4 * DPI
    skala = px / SEITE_B
    url = "file://" + os.path.abspath(html) + "?print" + (f"&gut={gut}" if gut else "")
    fehler = []
    with sync_playwright() as p:
        b = p.chromium.launch()
        seite = b.new_page(viewport={"width": SEITE_B, "height": SEITE_H}, device_scale_factor=skala)
        seite.on("pageerror", lambda e: fehler.append(str(e)))
        seite.on("console", lambda m: fehler.append(m.text) if m.type == "error" else None)
        seite.goto(url)
        seite.wait_for_timeout(200)
        w, h = seite.evaluate("() => { const r = document.getElementById('seite').getBoundingClientRect(); return [r.width, r.height]; }")
        if (round(w), round(h)) != (SEITE_B, SEITE_H):
            seite.set_viewport_size({"width": round(w), "height": round(h)})
            seite.goto(url)
        seite.wait_for_timeout(300)
        seite.locator("#seite").screenshot(path=png)
        # Überlaufprüfung: Elemente, die über die Seite hinausragen
        ueber = seite.evaluate("""() => {
            const s = document.getElementById('seite').getBoundingClientRect(); const out = [];
            document.querySelectorAll('#seite *').forEach(e => { const r = e.getBoundingClientRect();
              if (r.width && (r.right > s.right + 0.5 || r.bottom > s.bottom + 0.5)) out.push((e.id || e.className || e.tagName) + ' ' + Math.round(r.right - s.left) + 'x' + Math.round(r.bottom - s.top)); });
            return out.slice(0, 10); }""")
        gekappt = seite.evaluate("""() => [...document.querySelectorAll('.dk-botschaft')].filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.textContent)""")
        b.close()
    im = Image.open(png)
    im.save(png, dpi=(DPI, DPI))
    gdir = os.path.join(os.path.dirname(os.path.abspath(png)), "_graustufen")
    os.makedirs(gdir, exist_ok=True)
    grau = os.path.join(gdir, os.path.basename(png).replace(".png", "_grau.png"))
    im.convert("L").resize((im.width // 2, im.height // 2), Image.LANCZOS).save(grau)
    return fehler, ueber, gekappt


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dashboard", required=True)
    ap.add_argument("--daten", required=True)
    ap.add_argument("--titel", required=True)
    ap.add_argument("--out", required=True, help="Pfad ohne Endung, z. B. out/dash_3-4")
    ap.add_argument("--varianten", default="")
    ap.add_argument("--kein-png", action="store_true")
    a = ap.parse_args()
    html = buendeln(a.dashboard, a.daten, a.titel, a.out + ".html")
    print("geschrieben:", html, f"({os.path.getsize(html) // 1024} KB)")
    if a.kein_png:
        return
    probleme = []
    ziele = [(None, a.out + ".png")] + [(v, f"{a.out}_{v}.png") for v in a.varianten.split(",") if v]
    for gut, png in ziele:
        fehler, ueber, gekappt = rendern(html, png, None if gut in (None, "blaugruen") else gut)
        g = Image.open(png).size
        print("geschrieben:", png, g, "= %.1f x %.1f mm" % (g[0] / DPI * 25.4, g[1] / DPI * 25.4))
        probleme += [f"JS-Fehler: {f}" for f in fehler] + [f"Überlauf: {u}" for u in ueber] + \
                    [f"Botschaft gekürzt: {g}" for g in gekappt]
    if probleme:
        print("\nPROBLEME:")
        for p in sorted(set(probleme)):
            print("  ", p)
        sys.exit(1)
    print("Keine Layoutprobleme.")


if __name__ == "__main__":
    main()
