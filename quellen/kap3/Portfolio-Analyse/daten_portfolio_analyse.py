"""Daten für Abb. 3.23 „Portfolio-Analyse“.

Fünf strategische Geschäftseinheiten (SGE A–E) mit den Werten des Originals (5. Auflage), weil der Buchtext
die Abbildung erläutert. Erfasst werden nur die Ausgangsgrößen: eigener Marktanteil, Marktanteil des
stärksten Konkurrenten, Marktwachstum (alle in %) und Umsatz (Mio. €). Relativer Marktanteil und
Umsatzanteil sind abgeleitet – dieselben Formeln stehen in portfolio_analyse.js.
Ausgabe: portfolio_analyse.json (für das Dashboard) und portfolio_analyse.csv (gleich der CSV-Ebene).
"""
import csv
import json
import os

HIER = os.path.dirname(os.path.abspath(__file__))

# SGE, eigener Marktanteil %, Marktanteil stärkster Konkurrent %, Marktwachstum %, Umsatz Mio. €
SGE = [
    ["A", 3.2, 7.6, 4.2, 250],
    ["B", 7.4, 2.9, 4.9, 120],
    ["C", 9.4, 5.3, 2.4, 310],
    ["D", 4.3, 3.1, 4.2, 280],
    ["E", 1.4, 3.3, 1.5, 120],
]
GRENZEN = {"rel_ma": 1.5, "wachstum": 3.0}   # Trennlinien des Originals

json.dump({"sge": SGE, "grenzen": GRENZEN}, open(os.path.join(HIER, "portfolio_analyse.json"), "w", encoding="utf-8"),
          ensure_ascii=False, separators=(",", ":"))


def de(v, nk):
    return f"{v:.{nk}f}".replace(".", ",")


umsatz_ges = sum(s[4] for s in SGE)
with open(os.path.join(HIER, "portfolio_analyse.csv"), "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh, delimiter=";", lineterminator="\r\n")
    w.writerow(["SGE", "Eigener_MA_Prozent", "MA_staerkster_Konkurrent_Prozent", "Relativer_MA", "Marktwachstum_Prozent",
                "Umsatz_Mio_EUR", "Umsatzanteil_Prozent"])
    for name, ma, mak, wachstum, umsatz in SGE:
        w.writerow([name, de(ma, 1), de(mak, 1), de(ma / mak, 2), de(wachstum, 1), umsatz, de(100 * umsatz / umsatz_ges, 2)])

# Kontrollausgabe: Werte wie in der Tabelle der Abbildung, Felder nach den Grenzen des Originals
print(f"Umsatz gesamt {umsatz_ges} Mio. €")
for name, ma, mak, wachstum, umsatz in SGE:
    rel = ma / mak
    feld = ("oben" if wachstum >= GRENZEN["wachstum"] else "unten") + ("-rechts" if rel >= GRENZEN["rel_ma"] else "-links")
    print(f"{name}: rel. MA {rel:.2f} ({rel:.1f}), Wachstum {wachstum:.1f} %, Umsatz {umsatz} ({100 * umsatz / umsatz_ges:.1f} %), {feld}"
          f"{', Marktführer' if rel > 1 else ''}")
