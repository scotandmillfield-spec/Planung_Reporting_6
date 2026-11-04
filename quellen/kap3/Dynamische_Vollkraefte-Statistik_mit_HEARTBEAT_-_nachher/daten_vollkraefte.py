"""Daten für Abb. 3.77 „Dynamische Vollkräfte-Statistik – nachher“.

Dieselben Daten wie Abb. 3.76 (vorher): Köpfe und Vollkräfte je Monat, Kostenstelle und Dienstart, Ist bis Juni 2027,
Plan bis Dezember 2029. Quelle ist der Generator der Abb. 3.76 (../Dynamische_Vollkraefte-Statistik_mit_HEARTBEAT_-_vorher/
daten_vollkraefte.py, fester Zufallsstart); er wird hier ausgeführt und seine Ausgabe übernommen. Die beiden Abbildungen
unterscheiden sich nur im Startzustand des Dashboards (Standort Ost, Zeitraum November 2021 bis August 2025).
Ausgabe: vollkraefte.json und vollkraefte.csv.
"""
import json
import os
import runpy
import shutil

HIER = os.path.dirname(os.path.abspath(__file__))
VORHER = os.path.join(os.path.dirname(HIER), "Dynamische_Vollkraefte-Statistik_mit_HEARTBEAT_-_vorher")

runpy.run_path(os.path.join(VORHER, "daten_vollkraefte.py"), run_name="__main__")   # schreibt dort json/csv neu
d = json.load(open(os.path.join(VORHER, "vollkraefte.json"), encoding="utf-8"))
json.dump(d, open(os.path.join(HIER, "vollkraefte.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
shutil.copyfile(os.path.join(VORHER, "vollkraefte.csv"), os.path.join(HIER, "vollkraefte.csv"))

# Kontrollausgabe: Startzustand der Abb. 3.77 (Standort Ost), VK am Anfang und Ende des Zeitraums
ost = [c for c in d["kombis"] if d["kostenstellen"][c[0]][2] == 0]
for m in (58, 103, d["aktuell"]):
    print(f"Standort Ost {d['monate'][m]}: {sum(c[2][m] + c[4][m] / 100 for c in ost):.1f} VK")
