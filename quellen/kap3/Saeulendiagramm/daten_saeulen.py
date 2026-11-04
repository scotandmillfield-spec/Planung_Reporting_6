"""Daten für Abb. 3.48 „Säulendiagramm“: Umsatz der SGE A je Quartal, Plan und Ist in Mio. €.

Werte des Originals (Plan 100/120/90/130, Ist 120/130/100/110), Jahr 2027 ergänzt.
Ausgabe: saeulen.json und saeulen.csv.
"""
import csv
import json
import os

HIER = os.path.dirname(os.path.abspath(__file__))
QUARTALE = ["Q1", "Q2", "Q3", "Q4"]
PLAN = [100, 120, 90, 130]
IST = [120, 130, 100, 110]
json.dump({"jahr": 2027, "einheit": "SGE A", "quartale": QUARTALE, "plan": PLAN, "ist": IST},
          open(os.path.join(HIER, "saeulen.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
with open(os.path.join(HIER, "saeulen.csv"), "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh, delimiter=";", lineterminator="\r\n")
    w.writerow(["SGE", "Jahr", "Quartal", "Plan_Mio_EUR", "Ist_Mio_EUR"])
    for q, p, i in zip(QUARTALE, PLAN, IST):
        w.writerow(["SGE A", 2027, q, p, i])
print("Plan", sum(PLAN), "Ist", sum(IST), "ΔPL", sum(IST) - sum(PLAN))
