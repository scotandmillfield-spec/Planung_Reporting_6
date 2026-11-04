"""Daten für Abb. 3.73 „Verzerrungen durch 3D-Effekte“: Umsatz 2027 in Mio. € je Quartal, Plan und Ist,
Region Süd und Nord. Werte des Originals (aus der Geometrie des 3D-Diagramms zurückgerechnet); die Summen
Plan 100/120/90/130 und Ist 120/130/100/110 stimmen mit Abb. 3.48 (Säulendiagramm, SGE A) überein.
Ausgabe: verzerrung_3d.json und verzerrung_3d.csv.
"""
import csv
import json
import os

HIER = os.path.dirname(os.path.abspath(__file__))
QUARTALE = ["Q1", "Q2", "Q3", "Q4"]
REGIONEN = ["Süd", "Nord"]
PLAN = [[50, 70, 50, 80], [50, 50, 40, 50]]       # je Region, Q1..Q4
IST = [[60, 80, 50, 80], [60, 50, 50, 30]]

json.dump({"jahr": 2027, "quartale": QUARTALE, "regionen": REGIONEN, "plan": PLAN, "ist": IST, "achse": [0, 140, 20]},
          open(os.path.join(HIER, "verzerrung_3d.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
with open(os.path.join(HIER, "verzerrung_3d.csv"), "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh, delimiter=";", lineterminator="\r\n")
    w.writerow(["Jahr", "Quartal", "Region", "Plan_Mio_EUR", "Ist_Mio_EUR"])
    for ri, r in enumerate(REGIONEN):
        for qi, q in enumerate(QUARTALE):
            w.writerow([2027, q, r, PLAN[ri][qi], IST[ri][qi]])

# Kontrollsummen
for qi, q in enumerate(QUARTALE):
    p, i = sum(PLAN[r][qi] for r in range(2)), sum(IST[r][qi] for r in range(2))
    print(f"{q}: Plan {p:4d}  Ist {i:4d}  ΔPL {i - p:+d}")
for ri, r in enumerate(REGIONEN):
    print(f"{r}: Plan {sum(PLAN[ri])}  Ist {sum(IST[ri])}  ΔPL {sum(IST[ri]) - sum(PLAN[ri]):+d}")
print(f"Jahr: Plan {sum(map(sum, PLAN))}  Ist {sum(map(sum, IST))}")
