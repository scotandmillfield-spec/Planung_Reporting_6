"""Daten für Abb. 5.60 „Mobile Reporting mit einem Tablet“ – derselbe Datensatz wie Abb. 5.59 (Smartphone).

Quelle ist der Generator der Abb. 5.59 (../Mobile_Reporting_mit_einem_Smartphone_C8_Cubeware/daten_mobil.py, fester
Zufallsstart); er wird hier ausgeführt und seine Ausgabe übernommen. Beide Abbildungen zeigen denselben Bericht mit
denselben Zahlen, nur im Layout des jeweiligen Geräts (Smartphone eine Spalte, Tablet zwei Spalten).
Ausgabe: mobil.json und mobil.csv.
"""
import json
import os
import runpy
import shutil

HIER = os.path.dirname(os.path.abspath(__file__))
QUELLE = os.path.join(os.path.dirname(HIER), "Mobile_Reporting_mit_einem_Smartphone_C8_Cubeware")

runpy.run_path(os.path.join(QUELLE, "daten_mobil.py"), run_name="__main__")    # schreibt dort json/csv neu
d = json.load(open(os.path.join(QUELLE, "mobil.json"), encoding="utf-8"))
json.dump(d, open(os.path.join(HIER, "mobil.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
shutil.copyfile(os.path.join(QUELLE, "mobil.csv"), os.path.join(HIER, "mobil.csv"))
print(f"übernommen: {len(d['zeilen'])} Monatswerte, {len(d['laender'])} Länder, {len(d['linien'])} Produktlinien")
