"""Daten für Abb. 3.44 „Sunburst-Chart“.

Umsatz eines Fahrradherstellers nach Region, Produktgruppe und Kaufgrund – Hierarchie wie im Original (Gebiet →
Unterkategorie → Kaufgrund), die Ebene Kategorie mit nur einem Element („Bikes“) entfällt. Produktgruppen wie in den
OLAP-Abbildungen 3.37–3.40 (City Bike, Mountain Bike, Racing Bike, Trekking Bike). Zahlen erfunden, aber stimmig:
Regionen mit eigenem Produktprofil (Niederlande City Bikes, Österreich Mountain Bikes, Frankreich Racing Bikes) und
Kaufgründen je Produktgruppe (City Bike vor allem Preis, Racing Bike vor allem Marke). Je Region, Produktgruppe,
Kaufgrund und Jahr ein Datensatz (Umsatz in €, auf 100 € gerundet).
Ausgabe: sunburst.json und sunburst.csv.
"""
import csv
import json
import os
import random

HIER = os.path.dirname(os.path.abspath(__file__))
JAHRE = [2024, 2025]
REGIONEN = ["Deutschland", "Frankreich", "Niederlande", "Österreich"]
PRODUKTE = ["City Bike", "Mountain Bike", "Racing Bike", "Trekking Bike"]
GRUENDE = ["Preis", "Qualität", "Marke", "Aktion", "Testbericht"]

UMSATZ_2025 = {"Deutschland": 7.62e6, "Frankreich": 4.91e6, "Niederlande": 3.28e6, "Österreich": 2.19e6}
WACHSTUM = {"Deutschland": 0.04, "Frankreich": 0.09, "Niederlande": -0.03, "Österreich": 0.12}   # 2025 zu 2024
MIX = {  # Anteil der Produktgruppen je Region
    "Deutschland": [0.30, 0.22, 0.18, 0.30],
    "Frankreich":  [0.20, 0.20, 0.38, 0.22],
    "Niederlande": [0.52, 0.06, 0.12, 0.30],
    "Österreich":  [0.14, 0.46, 0.16, 0.24],
}
GRUND = {  # Anteil der Kaufgründe je Produktgruppe
    "City Bike":     [0.42, 0.20, 0.10, 0.20, 0.08],
    "Mountain Bike": [0.22, 0.34, 0.20, 0.10, 0.14],
    "Racing Bike":   [0.16, 0.30, 0.32, 0.06, 0.16],
    "Trekking Bike": [0.30, 0.34, 0.12, 0.14, 0.10],
}

rnd = random.Random(344)
zeilen = []          # [region, produkt, grund, [u2024, u2025]]
for r in REGIONEN:
    for p, mp in zip(PRODUKTE, MIX[r]):
        for g, mg in zip(GRUENDE, GRUND[p]):
            u25 = UMSATZ_2025[r] * mp * mg * rnd.uniform(0.85, 1.15)
            u24 = u25 / (1 + WACHSTUM[r] + rnd.uniform(-0.06, 0.06))
            zeilen.append([REGIONEN.index(r), PRODUKTE.index(p), GRUENDE.index(g), [round(u24, -2), round(u25, -2)]])

json.dump({"jahre": JAHRE, "regionen": REGIONEN, "produkte": PRODUKTE, "gruende": GRUENDE,
           "zeilen": [[a, b, c, [int(u) for u in us]] for a, b, c, us in zeilen]},
          open(os.path.join(HIER, "sunburst.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
with open(os.path.join(HIER, "sunburst.csv"), "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh, delimiter=";", lineterminator="\r\n")
    w.writerow(["Region", "Produktgruppe", "Kaufgrund", "Jahr", "Umsatz_EUR"])
    for a, b, c, us in zeilen:
        for j, jahr in enumerate(JAHRE):
            w.writerow([REGIONEN[a], PRODUKTE[b], GRUENDE[c], jahr, int(us[j])])

# Kontrollausgabe
for j, jahr in enumerate(JAHRE):
    ges = sum(z[3][j] for z in zeilen)
    print(f"{jahr}: gesamt {ges / 1e6:6.2f} Mio. €")
    for i, r in enumerate(REGIONEN):
        s = sum(z[3][j] for z in zeilen if z[0] == i)
        print(f"   {r:12s} {s / 1e6:5.2f} Mio. € ({s / ges:5.1%})")
    for i, g in enumerate(GRUENDE):
        s = sum(z[3][j] for z in zeilen if z[2] == i)
        print(f"   {g:12s} {s / 1e6:5.2f} Mio. € ({s / ges:5.1%})")
