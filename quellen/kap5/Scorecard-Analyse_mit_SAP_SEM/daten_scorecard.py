"""Daten für Abb. 5.51 „Scorecard-Analyse“ – Ursache-Wirkungs-Analyse einer Balanced Scorecard.

Inhalte des Originals (Fenster „Ursache-Wirkung Analyse“ der Scorecard „Wertsteigerung“): vier Perspektiven,
sieben strategische Ziele mit ihren Ursache-Wirkungs-Beziehungen und zwölf Kennzahlenzuordnungen mit Ist und Ziel.
Werte des Originals; Änderungen:
  - Beträge EUR → Tsd. € (180.000,00 EUR → 180), Kosten positiv mit Wirkung „Anstieg ungünstig“ (Original −3.470.000,00)
  - Durchlaufzeit: Ziel im Original 0,000 (fehlt) → 20 Tage angenommen
  - „Schulungstage/MA“ 110 / 100 als Schulungstage gesamt gelesen (110 Tage je Mitarbeiter wären unplausibel)
  - Perioden 2000.002 / 2001.012 → 02/2027 / 12/2028; Verantwortlicher (Original eine reale Person) → erfundene Namen
Status je Kennzahl (statt Ampelsymbolen) aus der Zielerreichung e = (Ist − Ziel) / |Ziel| × Wirkung:
  e > 0 übertroffen · e = 0 erreicht · −10 % ≤ e < 0 im Rahmen · e < −10 % kritisch; Ziel = schlechteste Kennzahl.
Ausgabe: scorecard.json und scorecard.csv (Semikolon, Dezimalkomma, UTF-8 mit BOM).
"""
import csv
import json
import os

HIER = os.path.dirname(os.path.abspath(__file__))
PERSPEKTIVEN = ["Finanzen", "Kunden", "Interne Prozesse", "Lernen und Entwicklung"]
# Ziel: Perspektive, Name, Verantwortlich, Lage in der Karte (Spalte 0 links, 1 rechts, 0.5 Mitte)
ZIELE = [
    (0, "Ergebnisverbesserung", "Frau Brandt", 0.5),
    (1, "Marktposition verbessern", "Herr Tal", 0),
    (1, "Kundenbindung", "Herr Tal", 1),
    (2, "Prozessoptimierung", "Frau Kühn", 0),
    (2, "Mitarbeiterbindung", "Herr Ober", 1),
    (3, "Umsetzung Innovation", "Frau Lenz", 0),
    (3, "Weiterentwicklung", "Herr Ober", 1),
]
# Ursache → Wirkung (Indizes in ZIELE), Pfeile des Originals
LINKS = [(1, 0), (2, 0), (2, 1), (3, 1), (3, 2), (4, 3), (5, 3), (6, 3), (6, 4)]
# Kennzahl: Ziel, Name, Einheit, Nachkommastellen, Ist, Ziel, Wirkung (+1 mehr ist besser), Hinweis
KENNZAHLEN = [
    (0, "EBIT", "Tsd. €", 0, 180, 200, 1, ""),
    (0, "Umsatz", "Tsd. €", 0, 3650, 3550, 1, ""),
    (0, "Kosten", "Tsd. €", 0, 3470, 3350, -1, "im Original mit negativem Vorzeichen"),
    (1, "Marktanteil", "%", 1, 10.1, 10.1, 1, ""),
    (2, "Kundenzufriedenheit", "%", 0, 80, 95, 1, ""),
    (3, "Verbesserungsvorschläge", "Anzahl", 0, 6, 5, 1, ""),
    (3, "Lieferfähigkeit", "%", 0, 80, 88, 1, ""),
    (3, "Durchlaufzeit", "Tage", 0, 25, 20, -1, "gewichtet; Ziel angenommen (Original 0,000)"),
    (4, "MA-Zufriedenheit", "%", 0, 80, 80, 1, ""),
    (5, "Umsatz neue Produkte", "Tsd. €", 0, 150, 1210, 1, ""),
    (6, "Schulungstage", "Tage", 0, 110, 100, 1, "gesamt"),
    (6, "Verbesserungsvorschläge", "Anzahl", 0, 6, 5, 1, "auch unter Prozessoptimierung"),
]
STUFEN = ["kritisch", "im Rahmen", "erreicht", "übertroffen"]


def status(ist, ziel, w):
    e = round((ist - ziel) / abs(ziel) * w * 100, 1)
    return 3 if e > 0 else 2 if e == 0 else 1 if e >= -10 else 0


daten = {"perspektiven": PERSPEKTIVEN, "periode": "02/2027", "zielperiode": "12/2028", "scorecard": "Wertsteigerung",
         "ziele": [list(z) for z in ZIELE], "links": [list(l) for l in LINKS], "kennzahlen": [list(k) for k in KENNZAHLEN],
         "stufen": STUFEN}
with open(os.path.join(HIER, "scorecard.json"), "w", encoding="utf-8") as fh:
    json.dump(daten, fh, ensure_ascii=False, separators=(",", ":"))

d = lambda v, nk=1: f"{v:.{nk}f}".replace(".", ",")
with open(os.path.join(HIER, "scorecard.csv"), "w", encoding="utf-8-sig", newline="") as fh:
    wr = csv.writer(fh, delimiter=";")
    wr.writerow(["Perspektive", "Strategisches_Ziel", "Ziel_wirkt_auf", "Kennzahl", "Einheit", "Wirkung", "Ist", "Ziel",
                 "Abweichung_Prozent", "Status", "Verantwortlich", "Periode", "Zielperiode", "Hinweis"])
    for z, name, einh, nk, ist, ziel, w, hinweis in KENNZAHLEN:
        p, zn, ver, _ = ZIELE[z]
        wirkt = ", ".join(ZIELE[b][1] for a, b in LINKS if a == z)
        wr.writerow([PERSPEKTIVEN[p], zn, wirkt, name, einh, "Anstieg günstig" if w > 0 else "Anstieg ungünstig",
                     d(ist, nk), d(ziel, nk), d((ist - ziel) / abs(ziel) * 100), STUFEN[status(ist, ziel, w)], ver,
                     "2027-02", "2028-12", hinweis])

# Kontrollausgabe
print("Kennzahl                  Ist     Ziel   Δ %    Status")
for z, name, einh, nk, ist, ziel, w, _ in KENNZAHLEN:
    print(f"{name:24s} {ist:7.1f} {ziel:7.1f} {(ist - ziel) / abs(ziel) * 100:+6.1f}  {STUFEN[status(ist, ziel, w)]}")
for i, (p, zn, ver, _) in enumerate(ZIELE):
    st = min(status(k[4], k[5], k[6]) for k in KENNZAHLEN if k[0] == i)
    print(f"Ziel {zn:26s} {STUFEN[st]:12s} Ursachen: {', '.join(ZIELE[a][1] for a, b in LINKS if b == i) or '–'}")
assert KENNZAHLEN[0][4] == KENNZAHLEN[1][4] - KENNZAHLEN[2][4] and KENNZAHLEN[0][5] == KENNZAHLEN[1][5] - KENNZAHLEN[2][5]
print("EBIT = Umsatz − Kosten (Ist und Ziel) stimmt")
