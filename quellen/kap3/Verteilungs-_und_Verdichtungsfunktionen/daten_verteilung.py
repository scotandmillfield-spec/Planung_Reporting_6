"""Daten für Abb. 3.178 „Verteilungs- und Verdichtungsfunktionen“.

Umsatz je Vertriebsregion in Tsd. € (Einheit angenommen; das Original nannte keine), Werte des Originals:
Vorjahr Nord 250, Süd 300, West 200, Ost 250 (gesamt 1.000).
Erfasst werden (im Original gelb):
  Top-down        Jahresvorgabe 1.200 → Verteilung nach Vorjahresanteil
  Bottom-up       Regionen 250, 360, 240, 300 → Verdichtung (Summe 1.150)
  Gegenstrom      Vorgabe 1.200 (verteilt wie Top-down), Rückmeldung der Regionen 320, 340, 200, 280 → Summe 1.140
  Mit Fixierung   Vorgabe 1.200, Region West manuell 220 (fixiert) → Rest 980 nach Vorjahresanteil der übrigen
                  Regionen (800): 306,25, 367,50, 306,25
Ausgabe: verteilung.json (Eingaben; die Seite rechnet selbst) und verteilung.csv (alle Werte je Verfahren und Ebene).
"""
import csv
import json
import os

HIER = os.path.dirname(os.path.abspath(__file__))
REGIONEN = ["Nord", "Süd", "West", "Ost"]
VJ = [250, 300, 200, 250]
EINGABE = {
    "topdown": 1200,
    "bottomup": [250, 360, 240, 300],
    "vorgabe": 1200,
    "rueckmeldung": [320, 340, 200, 280],
    "fixGesamt": 1200,
    "fixRegion": 2,          # Index der fixierten Region (West)
    "fixWert": 220,
}


def verteilen(gesamt, schluessel, fix=None):
    """Verteilt gesamt nach Schlüssel; fix = (Index, Wert) bleibt unverändert, der Rest wird auf die übrigen verteilt."""
    if fix is None:
        s = sum(schluessel)
        return [gesamt * k / s for k in schluessel]
    i, w = fix
    s = sum(k for j, k in enumerate(schluessel) if j != i)
    return [w if j == i else (gesamt - w) * k / s for j, k in enumerate(schluessel)]


e = EINGABE
td = verteilen(e["topdown"], VJ)
bu = e["bottomup"]
gv = verteilen(e["vorgabe"], VJ)
gr = e["rueckmeldung"]
fx = verteilen(e["fixGesamt"], VJ, (e["fixRegion"], e["fixWert"]))

json.dump({"regionen": REGIONEN, "vj": VJ, "eingabe": EINGABE},
          open(os.path.join(HIER, "verteilung.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))

zahl = lambda v: f"{v:.2f}".replace(".", ",")
with open(os.path.join(HIER, "verteilung.csv"), "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh, delimiter=";", lineterminator="\r\n")
    w.writerow(["Verfahren", "Spalte", "Ebene", "Umsatz_VJ_TEUR", "Plan_TEUR", "Herkunft"])
    for verf, spalte, werte, oben, unten in [
        ("Top-down", "Plan", td, "erfasst", "verteilt"),
        ("Bottom-up", "Plan", bu, "verdichtet", "erfasst"),
        ("Gegenstrom", "Vorgabe", gv, "erfasst", "verteilt"),
        ("Gegenstrom", "Rückmeldung", gr, "verdichtet", "erfasst"),
        ("Mit Fixierung", "Plan", fx, "erfasst", "verteilt"),
    ]:
        w.writerow([verf, spalte, "Unternehmen gesamt", sum(VJ), zahl(sum(werte)), oben])
        for j, r in enumerate(REGIONEN):
            herkunft = "erfasst (fixiert)" if verf == "Mit Fixierung" and j == e["fixRegion"] else unten
            w.writerow([verf, spalte, "Region " + r, VJ[j], zahl(werte[j]), herkunft])

# Kontrollausgabe
print("Vorjahr", VJ, "Summe", sum(VJ))
print("Top-down", td, "Summe", sum(td))
print("Bottom-up", bu, "Summe", sum(bu))
print("Gegenstrom Vorgabe", gv, "Rückmeldung", gr, "Summe", sum(gr), "Δ", sum(gr) - e["vorgabe"])
print("Mit Fixierung", fx, "Summe", sum(fx))
