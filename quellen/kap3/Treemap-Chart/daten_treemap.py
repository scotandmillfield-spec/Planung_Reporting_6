"""Daten für Abb. 3.45 „Treemap-Chart“.

Dieselben Daten wie Abb. 3.44 „Sunburst-Chart“ (Umsatz eines Fahrradherstellers nach Region, Produktgruppe und
Kaufgrund, Jahre 2026 und 2027), damit Leser beide Diagrammtypen an denselben Zahlen vergleichen können.
Quelle ist der Generator der Abb. 3.44 (../Sunburst-Chart/daten_sunburst.py, fester Zufallsstart); er wird hier
ausgeführt und seine Ausgabe übernommen.
Ausgabe: treemap.json und treemap.csv.
"""
import json
import os
import runpy
import shutil

HIER = os.path.dirname(os.path.abspath(__file__))
SB = os.path.join(os.path.dirname(HIER), "Sunburst-Chart")

runpy.run_path(os.path.join(SB, "daten_sunburst.py"), run_name="__main__")   # schreibt sunburst.json/.csv neu
d = json.load(open(os.path.join(SB, "sunburst.json"), encoding="utf-8"))
json.dump(d, open(os.path.join(HIER, "treemap.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
shutil.copyfile(os.path.join(SB, "sunburst.csv"), os.path.join(HIER, "treemap.csv"))

# Kontrollausgabe: Region x Produktgruppe 2027 in Mio. €
ji = d["jahre"].index(2027)
print("2027, Mio. €:", "  ".join(p[:6] for p in d["produkte"]))
for ri, r in enumerate(d["regionen"]):
    werte = [sum(z[3][ji] for z in d["zeilen"] if z[0] == ri and z[1] == pi) / 1e6 for pi in range(len(d["produkte"]))]
    print(f"   {r:12s}", "  ".join(f"{w:6.2f}" for w in werte), f"  Summe {sum(werte):5.2f}")
