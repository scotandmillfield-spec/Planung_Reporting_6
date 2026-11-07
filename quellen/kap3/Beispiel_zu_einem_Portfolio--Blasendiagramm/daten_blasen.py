"""Daten für Abb. 3.46 „Beispiel zu einem Portfolio-/Blasendiagramm“.

Marktattraktivitäts-Wettbewerbsstärken-Portfolio (Neun-Felder-Matrix) der Geschäftsfelder des Bereichs
Blechverarbeitung. Geschäftsfelder, Umsätze (Tsd. €) und Lage im Portfolio wie im Original (2027); die Lage ist
leicht auseinandergezogen, damit die Kreise sich weniger überdecken. Vorjahr 2026 erfunden, aber stimmig
(Laser- und Plasmaschneiden gewinnen an Wettbewerbsstärke, Feinblechverarbeitung verliert Umsatz).
Je Geschäftsfeld und Jahr: Wettbewerbsstärke (0–15), Marktattraktivität (0–15), Umsatz in Tsd. €.
Ausgabe: blasen.json und blasen.csv.
"""
import csv
import json
import os

HIER = os.path.dirname(os.path.abspath(__file__))
JAHRE = [2026, 2027]
FELDER = {   # Name: {Jahr: (Wettbewerbsstärke, Marktattraktivität, Umsatz Tsd. €)}
    "Brennzuschnitte":        {2026: (8.2, 9.4, 10930), 2027: (8.6, 9.6, 11280)},
    "Laserzuschnitte":        {2026: (6.0, 10.0, 8870), 2027: (6.6, 10.4, 9609)},
    "Feinblechverarbeitung":  {2026: (2.4, 4.1, 9140), 2027: (2.1, 3.9, 8452)},
    "CNC-Blechbearbeitung":   {2026: (7.0, 8.0, 7210), 2027: (7.2, 7.8, 6982)},
    "Plasmaschneiden":        {2026: (4.6, 9.0, 6080), 2027: (5.2, 9.2, 6682)},
    "Blechzuschnitte":        {2026: (10.0, 5.6, 2990), 2027: (10.2, 5.2, 2761)},
    "Stahlblechverarbeitung": {2026: (7.2, 1.5, 1990), 2027: (7.0, 1.2, 1824)},
}
namen = list(FELDER)
json.dump({"jahre": JAHRE, "felder": namen,
           "werte": [[list(FELDER[n][j]) for j in JAHRE] for n in namen]},
          open(os.path.join(HIER, "blasen.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
with open(os.path.join(HIER, "blasen.csv"), "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh, delimiter=";", lineterminator="\r\n")
    w.writerow(["Geschaeftsfeld", "Jahr", "Wettbewerbsstaerke", "Marktattraktivitaet", "Umsatz_TEUR"])
    for n in namen:
        for j in JAHRE:
            x, y, u = FELDER[n][j]
            w.writerow([n, j, str(x).replace(".", ","), str(y).replace(".", ","), u])
for j in JAHRE:
    ges = sum(FELDER[n][j][2] for n in namen)
    print(j, "Umsatz gesamt", ges, "Tsd. €")
