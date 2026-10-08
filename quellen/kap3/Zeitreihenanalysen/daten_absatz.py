"""Daten für Abb. 3.19 „Zeitreihenanalysen“.

Absatz von fünf Fahrradkomponenten je Monat in Stück – Monatswerte unverändert aus dem Original (5. Auflage).
Ausgabe: absatz.json (Produkte, Monate, Mengen) und absatz.csv (Einzelsätze Produkt × Monat).
"""
import csv
import json
import os

HIER = os.path.dirname(os.path.abspath(__file__))
MONATE = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"]
ABSATZ = {
    "Rahmen/Gabel":  [503, 543, 402, 605, 157, 837, 817, 796, 235, 714, 434, 15],
    "Laufräder h.":  [630, 214, 945, 593, 203, 833, 906, 510, 698, 908, 232, 740],
    "Laufräder v.":  [470, 729, 810, 287, 100, 294, 821, 722, 725, 996, 162, 444],
    "Tretlager":     [748, 998, 410, 225, 802, 980, 338, 99, 996, 158, 934, 48],
    "Lenker":        [556, 372, 500, 546, 35, 178, 738, 414, 917, 127, 773, 737],
}
# Das Original wies gerundete Summen aus, die nicht zu den angezeigten Monatswerten passten (z. B. Laufräder h.
# 7.413 statt 7.412, Gesamt 32.661 statt 32.659). Hier gelten die Monatswerte; alle Summen werden daraus gerechnet.
assert sum(map(sum, ABSATZ.values())) == 32659

json.dump({"monate": MONATE, "produkte": list(ABSATZ), "werte": list(ABSATZ.values())},
          open(os.path.join(HIER, "absatz.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
with open(os.path.join(HIER, "absatz.csv"), "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh, delimiter=";", lineterminator="\r\n")
    w.writerow(["Produkt", "Monat_Nr", "Monat", "Absatz_Stueck"])
    for p, v in ABSATZ.items():
        for m, x in enumerate(v):
            w.writerow([p, m + 1, MONATE[m], x])
for p, v in ABSATZ.items():
    print(f"{p:14s} Summe {sum(v):6,d}  Ø {sum(v) / 12:6.0f}  max {MONATE[v.index(max(v))]} {max(v)}  min {MONATE[v.index(min(v))]} {min(v)}")
