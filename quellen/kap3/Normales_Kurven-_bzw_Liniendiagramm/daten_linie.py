"""Daten für Abb. 3.59 „Normales Kurven- bzw. Liniendiagramm“: Umsatz der SGE A je Quartal, Plan und Ist in Mio. €.

Werte des Originals (eingebettete Excel-Tabelle, Blatt „Säulen“: Plan 100/120/90/130, Ist 120/130/100/110) – dieselben
Werte wie Abb. 3.48 „Säulendiagramm“; Jahr 2027 ergänzt wie dort.
Ausgabe: linie.json und linie.csv.
"""
import csv
import json
import os

HIER = os.path.dirname(os.path.abspath(__file__))
QUARTALE = ["Q1", "Q2", "Q3", "Q4"]
PLAN = [100, 120, 90, 130]
IST = [120, 130, 100, 110]
json.dump({"jahr": 2027, "sge": "SGE A", "quartale": QUARTALE, "plan": PLAN, "ist": IST},
          open(os.path.join(HIER, "linie.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
with open(os.path.join(HIER, "linie.csv"), "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh, delimiter=";", lineterminator="\r\n")
    w.writerow(["SGE", "Jahr", "Quartal", "Plan_Mio_EUR", "Ist_Mio_EUR"])
    for q, p, i in zip(QUARTALE, PLAN, IST):
        w.writerow(["SGE A", 2027, q, p, i])
print("Plan", sum(PLAN), "Ist", sum(IST), "ΔPL", sum(IST) - sum(PLAN))
