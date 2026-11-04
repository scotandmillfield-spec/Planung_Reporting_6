"""Daten für Abb. 3.61 „Punktdiagramm“: Umsatz der SGE A je Quartal, Plan und Ist in Mio. €.

Werte des Originals (Plan 100/120/90/130, Ist 120/130/100/110) – dieselben Zahlen wie das Säulendiagramm
Abb. 3.48, damit beide Darstellungsformen vergleichbar sind; Jahr 2027 ergänzt.
Ausgabe: punkte.json und punkte.csv.
"""
import csv
import json
import os

HIER = os.path.dirname(os.path.abspath(__file__))
QUARTALE = ["Q1", "Q2", "Q3", "Q4"]
PLAN = [100, 120, 90, 130]
IST = [120, 130, 100, 110]
json.dump({"jahr": 2027, "einheit": "SGE A", "quartale": QUARTALE, "plan": PLAN, "ist": IST},
          open(os.path.join(HIER, "punkte.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
with open(os.path.join(HIER, "punkte.csv"), "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh, delimiter=";", lineterminator="\r\n")
    w.writerow(["SGE", "Jahr", "Quartal", "Plan_Mio_EUR", "Ist_Mio_EUR", "Abweichung_Mio_EUR"])
    for q, p, i in zip(QUARTALE, PLAN, IST):
        w.writerow(["SGE A", 2027, q, p, i, i - p])
print("Plan", sum(PLAN), "Ist", sum(IST), "ΔPL", sum(IST) - sum(PLAN), "je Quartal", [i - p for p, i in zip(PLAN, IST)])
