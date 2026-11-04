"""Daten für Abb. 3.58 „Trichter- bzw. Funnel-Chart“: Stufen der Kundengewinnung von der Website bis zum Folgekauf.

Werte des Originals (amCharts-Beispiel): Website visits 300, Downloads 123, Requested prices 98, Contacted 72,
Purchased 35, Asked for support 25, Purchased more 18 – Stufennamen übersetzt.
Ausgabe: trichter.json und trichter.csv.
"""
import csv
import json
import os

HIER = os.path.dirname(os.path.abspath(__file__))
STUFEN = [("Website-Besuche", 300), ("Downloads", 123), ("Preisanfragen", 98), ("Kontaktaufnahmen", 72),
          ("Käufe", 35), ("Supportanfragen", 25), ("Folgekäufe", 18)]
assert all(a[1] >= b[1] for a, b in zip(STUFEN, STUFEN[1:])), "Trichter muss monoton fallen"
json.dump({"stufen": [list(s) for s in STUFEN]}, open(os.path.join(HIER, "trichter.json"), "w", encoding="utf-8"),
          ensure_ascii=False, separators=(",", ":"))
with open(os.path.join(HIER, "trichter.csv"), "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh, delimiter=";", lineterminator="\r\n")
    w.writerow(["Stufe_Nr", "Stufe", "Anzahl"])
    for i, (n, v) in enumerate(STUFEN, 1):
        w.writerow([i, n, v])
for (n, v), (n0, v0) in zip(STUFEN[1:], STUFEN):
    print(f"{n:18s} {v:4d}  zur Vorstufe {v / v0 * 100:5.1f} %  vom Start {v / STUFEN[0][1] * 100:5.1f} %")
