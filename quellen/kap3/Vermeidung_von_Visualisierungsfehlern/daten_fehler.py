"""Daten für Abb. 3.41 „Vermeidung von Visualisierungsfehlern“: Umsatz je Produktgruppe, Werte des Originals
(Beschriftung der korrigierten Darstellung: Standardmodelle 8,53, Luxusmodelle 6,12, Sondermodelle 3,82 Mio. €;
die fehlerhafte Darstellung zeigt dieselben Werte in € auf einer Achse bis 9.000.000). Kein Zufall.
Ausgabe: fehler.json und fehler.csv.
"""
import csv
import json
import os

HIER = os.path.dirname(os.path.abspath(__file__))
# Reihenfolge wie in der fehlerhaften Darstellung (alphabetisch)
WERTE = [("Luxusmodelle", 6_120_000), ("Sondermodelle", 3_820_000), ("Standardmodelle", 8_530_000)]
json.dump({"werte": [list(w) for w in WERTE], "achse_max": 9_000_000, "achse_schritt": 1_000_000},
          open(os.path.join(HIER, "fehler.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
with open(os.path.join(HIER, "fehler.csv"), "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh, delimiter=";", lineterminator="\r\n")
    w.writerow(["Produktgruppe", "Umsatz_EUR", "Umsatz_Mio_EUR"])
    for n, v in WERTE:
        w.writerow([n, v, f"{v / 1e6:.2f}".replace(".", ",")])
ges = sum(v for _, v in WERTE)
print(f"Summe {ges:,} €".replace(",", "."), " Anteile:", ", ".join(f"{n} {v / ges * 100:.1f} %" for n, v in WERTE))
