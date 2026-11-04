"""Daten für Tab. 3.3 „Erweiterte Kreuztabelle“ (interaktive Fassung für die Lernplattform).

Werte unverändert aus dem eingebetteten Excel-Objekt der 5. Auflage bzw. tabellen/Erweiterte_Kreuztabelle.tex:
Absatz in Stück je Kunde und Produkt; Produkt 1 und 2 bilden Produktgruppe A, Produkt 3 und 4 Produktgruppe B.
Teilsummen und Summen rechnet das Visual. Kein Zufall (fester Datensatz).
Ausgabe: erweitert.json und erweitert.csv (flache Form: je Kombination ein Datensatz mit Produktgruppe).
"""
import csv
import json
import os

HIER = os.path.dirname(os.path.abspath(__file__))
KUNDEN = ["Kunde 1", "Kunde 2", "Kunde 3", "Kunde 4"]
PRODUKTE = ["Produkt 1", "Produkt 2", "Produkt 3", "Produkt 4"]
GRUPPEN = [["Produktgruppe A", [0, 1]], ["Produktgruppe B", [2, 3]]]
ABSATZ = [  # Stück – Werte des Originals
    [200, 100, 100, 0],
    [100, 50, 200, 100],
    [50, 100, 50, 0],
    [100, 300, 100, 50],
]
# Kontrolle gegen das Original: „Zw.-Summe“ je Produkt und „Summe“ je Produktgruppe
assert [sum(z[j] for z in ABSATZ) for j in range(4)] == [450, 550, 450, 150]
assert [sum(z[j] for z in ABSATZ for j in idx) for _, idx in GRUPPEN] == [1000, 600]
assert [sum(z) for z in ABSATZ] == [400, 450, 200, 550]

json.dump({"einheit": "Stück", "kunden": KUNDEN, "produkte": PRODUKTE, "gruppen": GRUPPEN, "absatz": ABSATZ},
          open(os.path.join(HIER, "erweitert.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
gruppe_von = {j: g for g, idx in GRUPPEN for j in idx}
with open(os.path.join(HIER, "erweitert.csv"), "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh, delimiter=";", lineterminator="\r\n")
    w.writerow(["Kunde", "Produktgruppe", "Produkt", "Absatz_Stueck"])
    for i, k in enumerate(KUNDEN):
        for j, p in enumerate(PRODUKTE):
            w.writerow([k, gruppe_von[j], p, ABSATZ[i][j]])

for g, idx in GRUPPEN:
    print(f"{g}: je Kunde {[sum(z[j] for j in idx) for z in ABSATZ]}  gesamt {sum(z[j] for z in ABSATZ for j in idx)}")
print("Gesamt", sum(map(sum, ABSATZ)))
