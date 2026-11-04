"""Daten für Abb. 3.42 „Kreis- bzw. Kuchendiagramme“.

Umsatz je strategischer Geschäftseinheit (SGE A–D) in Mio. €. Die Werte des Jahres 2027 sind die des Originals
(510, 420, 110 und 40 Mio. €, zusammen 1.080 Mio. €), damit Zahlen im Buchtext weiter stimmen; das Original
beschriftete die dritte und vierte Einheit versehentlich noch einmal mit „SGE A“ und „SGE B“ – hier SGE C und D.
Vorjahr 2026 erfunden, aber stimmig: SGE A wächst, SGE B schrumpft leicht, SGE C wächst stark, SGE D stagniert.
Ausgabe: kreis.json und kreis.csv.
"""
import csv
import json
import os

HIER = os.path.dirname(os.path.abspath(__file__))
JAHRE = [2026, 2027]
SGE = ["SGE A", "SGE B", "SGE C", "SGE D"]
UMSATZ = {2026: [478, 434, 96, 41], 2027: [510, 420, 110, 40]}       # Mio. €

json.dump({"jahre": JAHRE, "sge": SGE, "umsatz": [UMSATZ[j] for j in JAHRE]},
          open(os.path.join(HIER, "kreis.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
with open(os.path.join(HIER, "kreis.csv"), "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh, delimiter=";", lineterminator="\r\n")
    w.writerow(["SGE", "Jahr", "Umsatz_Mio_EUR"])
    for j in JAHRE:
        for s, u in zip(SGE, UMSATZ[j]):
            w.writerow([s, j, u])
for j in JAHRE:
    ges = sum(UMSATZ[j])
    print(j, "gesamt", ges, "Mio. €:", ", ".join(f"{s} {u} ({u / ges:.0%})" for s, u in zip(SGE, UMSATZ[j])))
