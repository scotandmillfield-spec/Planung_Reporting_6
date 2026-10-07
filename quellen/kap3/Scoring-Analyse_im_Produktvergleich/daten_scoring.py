"""Daten für Abb. 3.27 „Scoring-Analyse im Produktvergleich“.

Kriterien, Gewichtung (Standard) und Punkte des eigenen Produkts und des Konkurrenzprodukts A sind die Werte des
Originals (5. Auflage). Für die Datenschnitte erfunden: zwei weitere Konkurrenzprodukte (B, C) und zwei alternative
Gewichtungen (preisorientiert, qualitätsorientiert), je mit Summe 100. Gewichtete Punkte = Gewichtung × Punkte;
Gesamt höchstens 1.000 (alle Kriterien 10 Punkte).
Ausgabe: scoring.json und scoring.csv.
"""
import csv
import json
import os

HIER = os.path.dirname(os.path.abspath(__file__))
KRITERIEN = ["Preis", "Leistung", "Innovation", "Qualität", "Service"]
GEWICHTUNG = {"standard": ("Standard", [30, 20, 20, 20, 10]),
              "preis": ("Preisorientiert", [40, 15, 15, 20, 10]),
              "qualitaet": ("Qualitätsorientiert", [20, 15, 15, 40, 10])}
PRODUKTE = {"eigen": ("Eigenes Produkt", [8, 7, 6, 9, 5]),
            "A": ("Konkurrenzprodukt A", [9, 9, 8, 7, 6]),
            "B": ("Konkurrenzprodukt B", [6, 7, 7, 6, 8]),
            "C": ("Konkurrenzprodukt C", [7, 8, 9, 6, 7])}
for k, (_, g) in GEWICHTUNG.items():
    assert sum(g) == 100, k

json.dump({"kriterien": KRITERIEN, "gewichtung": {k: {"name": n, "werte": g} for k, (n, g) in GEWICHTUNG.items()},
           "produkte": {k: {"name": n, "punkte": p} for k, (n, p) in PRODUKTE.items()}},
          open(os.path.join(HIER, "scoring.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
with open(os.path.join(HIER, "scoring.csv"), "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh, delimiter=";", lineterminator="\r\n")
    w.writerow(["Kriterium"] + [f"Gewichtung_{n.replace('ä', 'ae')}" for n, _ in GEWICHTUNG.values()] +
               [f"Punkte_{n.replace(' ', '_')}" for n, _ in PRODUKTE.values()])
    for i, k in enumerate(KRITERIEN):
        w.writerow([k] + [g[i] for _, g in GEWICHTUNG.values()] + [p[i] for _, p in PRODUKTE.values()])

# Kontrollausgabe: Gesamtpunkte je Gewichtung und Produkt
for gk, (gn, g) in GEWICHTUNG.items():
    print(f"{gn:20s} " + "  ".join(f"{pk}: {sum(a * b for a, b in zip(g, p)):4d}" for pk, (_, p) in PRODUKTE.items()))
