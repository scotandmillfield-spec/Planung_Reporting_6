"""Daten für Abb. 3.63 „Flächendiagramm“: Kapazität je Quartal, Plan und Ist in Tonnen.

Werte aus der eingebetteten Excel-Tabelle des Originals (Plan 110/120/110/120 t, Ist 80/100/70/70 t; 6. Auflage: Q3 mit Ist über Plan = 125 t);
Jahr 2011 → 2027. Annahme: Ist unter Plan ist ungünstig (Kapazität nicht wie geplant genutzt).
Ausgabe: flaeche.json und flaeche.csv.
"""
import csv
import json
import os

HIER = os.path.dirname(os.path.abspath(__file__))
QUARTALE = ["Q1", "Q2", "Q3", "Q4"]
PLAN = [110, 120, 110, 120]
IST = [80, 100, 125, 70]
json.dump({"jahr": 2027, "quartale": QUARTALE, "plan": PLAN, "ist": IST},
          open(os.path.join(HIER, "flaeche.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
with open(os.path.join(HIER, "flaeche.csv"), "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh, delimiter=";", lineterminator="\r\n")
    w.writerow(["Jahr", "Quartal", "Plan_t", "Ist_t", "Abweichung_t"])
    for q, p, i in zip(QUARTALE, PLAN, IST):
        w.writerow([2027, q, p, i, i - p])
print("Plan", sum(PLAN), "t, Ist", sum(IST), "t, ΔPL", sum(IST) - sum(PLAN), "t",
      f"({100 * (sum(IST) / sum(PLAN) - 1):+.1f} %)", "je Quartal", [i - p for p, i in zip(PLAN, IST)])
