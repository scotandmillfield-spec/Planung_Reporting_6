"""Daten für Abb. 3.62 „Koordinatensystem mit vier Quadranten“: Entwicklung der Geschäftsfelder.

Lage der Geschäftsfelder wie im Original (Wachstumsrate | Gewinnanstieg): PKW +10 % | +11 %, LKW +5 % | +4 %,
Motorrad −10 % | −5 %, Sonstige +3 % | −7 %. Jahr 2014 → 2027 (Vorjahr 2026). Damit die Raten aus Zahlen
entstehen, sind Umsatz und Gewinn je Geschäftsfeld für 2026 und 2027 erfunden (Mio. €), so gewählt, dass die
Veränderungen genau die Werte des Originals ergeben.
Ausgabe: quadranten.json und quadranten.csv.
"""
import csv
import json
import os

HIER = os.path.dirname(os.path.abspath(__file__))
JAHRE = [2026, 2027]
FELDER = [  # Name, Umsatz 2026, Umsatz 2027, Gewinn 2026, Gewinn 2027 (Mio. €)
    ("PKW", 900.0, 990.0, 70.0, 77.7),
    ("LKW", 480.0, 504.0, 30.0, 31.2),
    ("Motorrad", 160.0, 144.0, 12.0, 11.4),
    ("Sonstige", 130.0, 133.9, 10.0, 9.3),
]
json.dump({"jahre": JAHRE, "felder": [list(f) for f in FELDER]},
          open(os.path.join(HIER, "quadranten.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
de = lambda v: f"{v:.1f}".replace(".", ",")
with open(os.path.join(HIER, "quadranten.csv"), "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh, delimiter=";", lineterminator="\r\n")
    w.writerow(["Geschaeftsfeld", "Jahr", "Umsatz_Mio_EUR", "Gewinn_Mio_EUR"])
    for n, u0, u1, g0, g1 in FELDER:
        w.writerow([n, 2026, de(u0), de(g0)])
        w.writerow([n, 2027, de(u1), de(g1)])
for n, u0, u1, g0, g1 in FELDER:
    print(f"{n:9s} Wachstumsrate {100 * (u1 / u0 - 1):+.1f} %  Gewinnanstieg {100 * (g1 / g0 - 1):+.1f} %")
U0, U1 = sum(f[1] for f in FELDER), sum(f[2] for f in FELDER)
G0, G1 = sum(f[3] for f in FELDER), sum(f[4] for f in FELDER)
print(f"Gesamt Umsatz {U0:.1f} → {U1:.1f} ({100 * (U1 / U0 - 1):+.1f} %), Gewinn {G0:.1f} → {G1:.1f} ({100 * (G1 / G0 - 1):+.1f} %)")
