"""Daten für Abb. 3.75 „Durch Selektion änderbare dynamische Diagramme – nachher“.

Dieselben Daten wie Abb. 3.74 (vorher): Absatz je Quartal, Unterkategorie, Untersegment, Region und Anbieter.
Quelle ist der Generator der Abb. 3.74 (../Durch_Selektion_aenderbare_dynamische_Diagramme_-_vorher_QlikView/
daten_marktanteile.py, fester Zufallsstart); er wird hier ausgeführt und seine Ausgabe übernommen. Die beiden
Abbildungen unterscheiden sich nur im Startzustand des Dashboards (Selektion Smartphones und Privatkunden).
Ausgabe: marktanteile.json und marktanteile.csv.
"""
import json
import os
import runpy
import shutil

HIER = os.path.dirname(os.path.abspath(__file__))
VORHER = os.path.join(os.path.dirname(HIER), "Durch_Selektion_aenderbare_dynamische_Diagramme_-_vorher_QlikView")

runpy.run_path(os.path.join(VORHER, "daten_marktanteile.py"), run_name="__main__")   # schreibt dort json/csv neu
d = json.load(open(os.path.join(VORHER, "marktanteile.json"), encoding="utf-8"))
json.dump(d, open(os.path.join(HIER, "marktanteile.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
shutil.copyfile(os.path.join(VORHER, "marktanteile.csv"), os.path.join(HIER, "marktanteile.csv"))

# Kontrollausgabe: Startzustand der Abb. 3.75 (Smartphones x Privatkunden), eigener Anteil in %
uk_sp = [i for i, (_, k) in enumerate(d["unterkat"]) if k == 0]
us_pr = [i for i, (_, s) in enumerate(d["untersegmente"]) if s == 0]
for q in (len(d["quartale"]) - 1, len(d["quartale"]) - 2, len(d["quartale"]) - 5):
    zs = [z for z in d["zeilen"] if z[0] == q and z[1] in uk_sp and z[2] in us_pr]
    print(f"Smartphones x Privatkunden {d['quartale'][q]}: {sum(z[4] for z in zs) / sum(sum(z[4:]) for z in zs) * 100:.1f} %")
