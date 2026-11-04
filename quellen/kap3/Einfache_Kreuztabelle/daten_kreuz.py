"""Daten für Tab. 3.2 „Einfache Kreuztabelle“ (interaktive Fassung für die Lernplattform).

Werte unverändert aus dem eingebetteten Excel-Objekt der 5. Auflage bzw. tabellen/Einfache_Kreuztabelle.tex:
Absatz in Stück je Kunde (Zeilen) und Produkt (Spalten). Die Summen rechnet das Visual. Kein Zufall (fester Datensatz).
Ausgabe: kreuz.json (Kunden, Produkte, Matrix) und kreuz.csv (flache Form: je Kombination ein Datensatz).
"""
import csv
import json
import os

HIER = os.path.dirname(os.path.abspath(__file__))
KUNDEN = ["Kunde 1", "Kunde 2", "Kunde 3", "Kunde 4"]
PRODUKTE = ["Produkt 1", "Produkt 2", "Produkt 3", "Produkt 4"]
ABSATZ = [  # Stück – Werte des Originals
    [200, 100, 100, 0],
    [100, 50, 200, 100],
    [50, 100, 50, 0],
    [100, 300, 100, 50],
]
SOLL_ZEILE = [400, 450, 200, 550]          # Summenspalte des Originals
SOLL_SPALTE = [450, 550, 450, 150]         # Summenzeile des Originals
assert [sum(z) for z in ABSATZ] == SOLL_ZEILE
assert [sum(z[j] for z in ABSATZ) for j in range(4)] == SOLL_SPALTE
assert sum(SOLL_ZEILE) == 1600

json.dump({"einheit": "Stück", "kunden": KUNDEN, "produkte": PRODUKTE, "absatz": ABSATZ},
          open(os.path.join(HIER, "kreuz.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
with open(os.path.join(HIER, "kreuz.csv"), "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh, delimiter=";", lineterminator="\r\n")
    w.writerow(["Kunde", "Produkt", "Absatz_Stueck"])
    for i, k in enumerate(KUNDEN):
        for j, p in enumerate(PRODUKTE):
            w.writerow([k, p, ABSATZ[i][j]])

print("Zeilensummen", SOLL_ZEILE, " Spaltensummen", SOLL_SPALTE, " Gesamt", sum(SOLL_ZEILE))
