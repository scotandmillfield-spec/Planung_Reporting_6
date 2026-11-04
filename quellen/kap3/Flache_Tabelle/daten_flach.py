"""Daten für Tab. 3.1 „Flache Tabelle“ (interaktive Fassung für die Lernplattform).

Werte unverändert aus dem eingebetteten Excel-Objekt der 5. Auflage bzw. tabellen/Flache_Tabelle.tex:
fünf Auftragspositionen mit Auftragsnummer, Artikelnummer, Menge (Stück), Preis (€) und Umsatz (€).
Keine Zufallswerte (fester Datensatz). Ausgabe: flach.json und flach.csv.
"""
import csv
import json
import os

HIER = os.path.dirname(os.path.abspath(__file__))
# Auftragsnummer, Artikelnummer, Menge, Preis, Umsatz – Werte des Originals
POSITIONEN = [
    (10001, 20101, 2, 10, 20),
    (10001, 20201, 1, 20, 20),
    (10002, 20101, 3, 10, 30),
    (10002, 20201, 4, 20, 80),
    (10002, 20203, 1, 15, 15),
]
for a, b, m, p, u in POSITIONEN:
    assert m * p == u, (a, b)

json.dump({"positionen": [list(p) for p in POSITIONEN]},
          open(os.path.join(HIER, "flach.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
with open(os.path.join(HIER, "flach.csv"), "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh, delimiter=";", lineterminator="\r\n")
    w.writerow(["Auftragsnummer", "Artikelnummer", "Menge_Stueck", "Preis_EUR", "Umsatz_EUR"])
    for p in POSITIONEN:
        w.writerow(p)

# Kontrollausgabe
print(f"Positionen {len(POSITIONEN)}  Menge {sum(p[2] for p in POSITIONEN)}  Umsatz {sum(p[4] for p in POSITIONEN)}")
for auftrag in sorted({p[0] for p in POSITIONEN}):
    print(f"  Auftrag {auftrag}: Umsatz {sum(p[4] for p in POSITIONEN if p[0] == auftrag)}")
for artikel in sorted({p[1] for p in POSITIONEN}):
    print(f"  Artikel {artikel}: Menge {sum(p[2] for p in POSITIONEN if p[1] == artikel)}  Umsatz {sum(p[4] for p in POSITIONEN if p[1] == artikel)}")
