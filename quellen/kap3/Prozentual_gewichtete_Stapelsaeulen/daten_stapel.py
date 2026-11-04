"""Daten für Abb. 3.51 „Normale Stapelsäulen“ und Abb. 3.52 „Prozentual gewichtete Stapelsäulen“.

Umsatz Ist je Quartal nach Region (Süd, Nord) in Mio. €, Werte aus der eingebetteten Excel-Tabelle des Originals
(Ist Süd 60/80/50/80, Nord 60/50/50/30; Summen wie Ist in Abb. 3.48: 120/130/100/110). Jahr 2027 ergänzt.
Ausgabe: stapel.json und stapel.csv.
"""
import csv
import json
import os

HIER = os.path.dirname(os.path.abspath(__file__))
QUARTALE = ["Q1", "Q2", "Q3", "Q4"]
REGIONEN = ["Region Süd", "Region Nord"]
IST = [[60, 80, 50, 80], [60, 50, 50, 30]]
json.dump({"jahr": 2027, "quartale": QUARTALE, "regionen": REGIONEN, "ist": IST},
          open(os.path.join(HIER, "stapel.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
with open(os.path.join(HIER, "stapel.csv"), "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh, delimiter=";", lineterminator="\r\n")
    w.writerow(["Jahr", "Quartal", "Region", "Umsatz_Ist_Mio_EUR"])
    for r, werte in zip(REGIONEN, IST):
        for q, v in zip(QUARTALE, werte):
            w.writerow([2027, q, r, v])
print("Summen je Quartal:", [a + b for a, b in zip(*IST)])
