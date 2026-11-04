"""Daten für Abb. 3.67 „Lieferantenvergleich mit Schwellenwert“.

Werte des Originals (aus dem Diagramm abgelesen, auf eine Nachkommastelle gerundet): Bewertung zweier Lieferanten
in sechs Kriterien auf einer Skala von 0 bis 10 Punkten (10 = sehr gut, auch beim Preis: hohe Punktzahl = günstiger
Preis), Schwellenwert (Mindestpunktzahl je Kriterium) 4. Jahr 2027 ergänzt.
Ausgabe: lieferanten.json und lieferanten.csv.
"""
import csv
import json
import os

HIER = os.path.dirname(os.path.abspath(__file__))
KRITERIEN = ["Qualität", "Preis", "Liefergenauigkeit", "Liefersicherheit", "Kulanz", "Kapazität"]
LIEFERANTEN = ["Lieferant A", "Lieferant B"]
PUNKTE = [  # je Lieferant in der Reihenfolge der Kriterien
    [4.5, 6.7, 5.0, 5.7, 4.0, 3.5],
    [3.7, 4.5, 3.7, 4.7, 5.5, 4.3],
]
SCHWELLE, SCHWELLEN = 4, [3, 4, 5]

json.dump({"jahr": 2027, "skala": 10, "schwelle": SCHWELLE, "schwellen": SCHWELLEN, "kriterien": KRITERIEN,
           "lieferanten": LIEFERANTEN, "punkte": PUNKTE},
          open(os.path.join(HIER, "lieferanten.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
with open(os.path.join(HIER, "lieferanten.csv"), "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh, delimiter=";", lineterminator="\r\n")
    w.writerow(["Jahr", "Lieferant", "Kriterium", "Punkte_0_bis_10", "Schwellenwert"])
    for l, reihe in zip(LIEFERANTEN, PUNKTE):
        for k, p in zip(KRITERIEN, reihe):
            w.writerow([2027, l, k, str(p).replace(".", ","), SCHWELLE])
for l, reihe in zip(LIEFERANTEN, PUNKTE):
    unter = [k for k, p in zip(KRITERIEN, reihe) if p < SCHWELLE]
    print(l, "Mittel %.2f" % (sum(reihe) / len(reihe)), "unter Schwelle:", ", ".join(unter) or "keins")
