"""Daten für Abb. 3.23 „Portfolio-Analyse“.

Fünf strategische Geschäftseinheiten (SGE A–E) mit den Werten des Originals (5. Auflage), weil der Buchtext
die Abbildung erläutert; diese Werte gelten hier als Ist 2027 (Revision DS 07.10.2026). Für den Datenschnitt Jahr
(letzte drei Jahre) kommen 2025 und 2026 mit erfundenen, plausiblen Vorjahreswerten hinzu; die Lage der SGE in den
vier Feldern bleibt dabei erhalten. Erfasst werden nur die Ausgangsgrößen: eigener Marktanteil, Marktanteil des
stärksten Konkurrenten, Marktwachstum (alle in %) und Umsatz (Mio. €). Relativer Marktanteil und
Umsatzanteil sind abgeleitet – dieselben Formeln stehen in portfolio_analyse.js.
Ausgabe: portfolio_analyse.json (für das Dashboard) und portfolio_analyse.csv (gleich der CSV-Ebene).
"""
import csv
import json
import os

HIER = os.path.dirname(os.path.abspath(__file__))

JAHRE = [2025, 2026, 2027]
# SGE, je Jahr: eigener Marktanteil %, Marktanteil stärkster Konkurrent %, Marktwachstum %, Umsatz Mio. €
SGE = [
    ["A", [[2.9, 7.4, 3.8, 228], [3.0, 7.5, 4.0, 240], [3.2, 7.6, 4.2, 250]]],
    ["B", [[6.1, 3.1, 4.4, 92], [6.8, 3.0, 4.6, 105], [7.4, 2.9, 4.9, 120]]],
    ["C", [[9.0, 5.1, 2.9, 291], [9.1, 5.2, 2.6, 300], [9.4, 5.3, 2.4, 310]]],
    ["D", [[4.0, 3.0, 3.7, 240], [4.2, 3.0, 4.0, 262], [4.3, 3.1, 4.2, 280]]],
    ["E", [[1.6, 3.1, 2.0, 131], [1.5, 3.2, 1.8, 125], [1.4, 3.3, 1.5, 120]]],
]
GRENZEN = {"rel_ma": 1.5, "wachstum": 3.0}   # Trennlinien des Originals
FELDER = {"ol": "Question Marks", "or": "Stars", "ur": "Cash Cows", "ul": "Poor Dogs"}

json.dump({"jahre": JAHRE, "sge": SGE, "grenzen": GRENZEN},
          open(os.path.join(HIER, "portfolio_analyse.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))


def de(v, nk):
    return f"{v:.{nk}f}".replace(".", ",")


with open(os.path.join(HIER, "portfolio_analyse.csv"), "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh, delimiter=";", lineterminator="\r\n")
    w.writerow(["Jahr", "SGE", "Eigener_MA_Prozent", "MA_staerkster_Konkurrent_Prozent", "Relativer_MA", "Marktwachstum_Prozent",
                "Umsatz_Mio_EUR", "Umsatzanteil_Prozent"])
    for j, jahr in enumerate(JAHRE):
        ges = sum(s[1][j][3] for s in SGE)
        for name, ws in SGE:
            ma, mak, wachstum, umsatz = ws[j]
            w.writerow([jahr, name, de(ma, 1), de(mak, 1), de(ma / mak, 2), de(wachstum, 1), umsatz, de(100 * umsatz / ges, 2)])

# Kontrollausgabe: Felder nach den Grenzen des Originals (Normstrategie des BCG-Portfolios)
for j, jahr in enumerate(JAHRE):
    ges = sum(s[1][j][3] for s in SGE)
    print(f"{jahr}: Umsatz gesamt {ges} Mio. €")
    for name, ws in SGE:
        ma, mak, wachstum, umsatz = ws[j]
        rel = ma / mak
        feld = ("o" if wachstum >= GRENZEN["wachstum"] else "u") + ("r" if rel >= GRENZEN["rel_ma"] else "l")
        print(f"  {name}: rel. MA {rel:.2f}, Wachstum {wachstum:.1f} %, Umsatz {umsatz} ({100 * umsatz / ges:.1f} %), {FELDER[feld]}")
