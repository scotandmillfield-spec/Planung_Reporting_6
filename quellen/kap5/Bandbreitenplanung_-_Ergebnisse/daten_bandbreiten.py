"""Daten für Abb. 5.71 „Bandbreitenplanung – Ergebnisse“.

Derselbe Datensatz wie Abb. 5.70 „Bandbreitenplanung – Eingabeparameter“: Quelle ist der Generator der Abb. 5.70
(../Bandbreitenplanung_-_Eingabeparameter/daten_bandbreiten.py, fester Zufallsstart); er wird hier ausgeführt und
seine Ausgabe übernommen. Worst Case, Plan, Best Case und die Monte-Carlo-Simulation rechnet das Dashboard aus den
Prämissen und den Planwerten.
Ausgabe: bandbreiten.json und bandbreiten.csv.
"""
import json
import os
import runpy
import shutil

HIER = os.path.dirname(os.path.abspath(__file__))
QUELLE = os.path.join(os.path.dirname(HIER), "Bandbreitenplanung_-_Eingabeparameter")

runpy.run_path(os.path.join(QUELLE, "daten_bandbreiten.py"), run_name="__main__")   # schreibt dort json/csv neu
d = json.load(open(os.path.join(QUELLE, "bandbreiten.json"), encoding="utf-8"))
json.dump(d, open(os.path.join(HIER, "bandbreiten.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
shutil.copyfile(os.path.join(QUELLE, "bandbreiten.csv"), os.path.join(HIER, "bandbreiten.csv"))
print(f"übernommen: {len(d['plan'])} Plan- und {len(d['ist'])} Ist-Zeilen, {len(d['bu'])} Business Units")
