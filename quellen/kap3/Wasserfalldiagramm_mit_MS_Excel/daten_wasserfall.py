"""Daten für Abb. 3.55 „Wasserfalldiagramm mit MS Excel“: monatliche Umsatzveränderungen in Mio. €.

Werte des Originals: Ausgangsniveau 110 (im Original nicht als Säule gezeigt), Veränderungen Januar +70, Februar +20,
März −10, April −60, Mai +10, Juni +60, Endniveau 200. Ausgangsniveau als Monatsumsatz Dezember 2026 gedeutet,
Monate Januar bis Juni 2027.
Ausgabe: wasserfall.json und wasserfall.csv.
"""
import csv
import json
import os

HIER = os.path.dirname(os.path.abspath(__file__))
START = ("Dez 2026", 110)
DELTAS = [("Jan", 70), ("Feb", 20), ("Mär", -10), ("Apr", -60), ("Mai", 10), ("Jun", 60)]
ende = START[1] + sum(d for _, d in DELTAS)
json.dump({"start": list(START), "deltas": [list(d) for d in DELTAS], "ende": ["Jun 2027", ende]},
          open(os.path.join(HIER, "wasserfall.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
with open(os.path.join(HIER, "wasserfall.csv"), "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh, delimiter=";", lineterminator="\r\n")
    w.writerow(["Position", "Art", "Wert_Mio_EUR"])
    w.writerow([START[0], "Ausgangswert", START[1]])
    for m, d in DELTAS:
        w.writerow([m + " 2027", "Veraenderung", d])
    w.writerow(["Jun 2027", "Endwert", ende])
print("Ende", ende)
