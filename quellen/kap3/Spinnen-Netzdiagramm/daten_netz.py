"""Daten für Abb. 3.68 „(Spinnen-)Netzdiagramm“: Balanced Scorecard eines Immobilienmanagements (REM).

23 Kennzahlen in fünf Perspektiven, vier Reihen wie im Original (dort Ist 2009, Plan 2010, Ist 2010, Plan 2011),
hier Ist 2025, Plan 2026, Ist 2026 und Plan 2027. Werte aus dem Original abgelesen und gerundet bzw. in dessen
Größenordnung ergänzt. Skala wie im Original 0–160; gedeutet als Index (Ausgangsjahr 2024 = 100), so normiert,
dass außen stets günstiger ist – auch bei Kennzahlen, deren Rohwert sinken soll (Beschwerden, Krankheits-,
Fluktuations-, Leerstandsquote, Kosten, Reklamationszeit). Reihenfolge der Achsen wie im Original (im Uhrzeigersinn).
Ausgabe: netz.json und netz.csv.
"""
import csv
import json
import os

HIER = os.path.dirname(os.path.abspath(__file__))
REIHEN = ["Ist 2025", "Plan 2026", "Ist 2026", "Plan 2027"]
# Perspektive, Kennzahl (Anzeige; "|" trennt Zeilen, "~|" trennt mit Trennstrich), Rohwert sinkt günstig?, Werte je Reihe
KENNZAHLEN = [
    ("Finanzen", "ROCE", False, [104, 110, 101, 130]),
    ("Finanzen", "EVA", False, [98, 110, 116, 131]),
    ("Finanzen", "Umsatzrentabilität", False, [102, 96, 86, 111]),
    ("Finanzen", "Kapitalumschlag", False, [99, 108, 91, 115]),
    ("Finanzen", "Ergebnisbeitrag", False, [97, 94, 88, 109]),
    ("Finanzen", "Reinvestitionsquote", False, [103, 108, 84, 116]),
    ("Prozesse", "Fertigstellungsgrad", False, [95, 86, 72, 108]),
    ("Prozesse", "Verhältnis Fremd-|zu Eigenleistung", False, [101, 113, 97, 128]),
    ("Prozesse", "Durchschnittliche|Reklamationszeit", True, [98, 105, 95, 120]),
    ("Assets", "Assetabnutzungsgrad", True, [104, 125, 110, 136]),
    ("Assets", "Budgetverbrauch", True, [100, 96, 86, 148]),
    ("Assets", "Leerstandsquote", True, [96, 95, 84, 106]),
    ("Assets", "Kosten pro BGF", True, [99, 92, 72, 107]),
    ("Assets", "Wertzuwachs Assets", False, [102, 101, 76, 120]),
    ("Mitarbeiter", "Fluktuationsquote", True, [97, 96, 80, 106]),
    ("Mitarbeiter", "Krankheitsquote", True, [100, 106, 98, 120]),
    ("Mitarbeiter", "Personalintensität", False, [103, 115, 85, 121]),
    ("Mitarbeiter", "MA-Zufriedenheit", False, [101, 108, 62, 125]),
    ("Mitarbeiter", "Verbesserungs~|vorschlagsquote", False, [96, 109, 48, 116]),
    ("Mitarbeiter", "Anzahl|qualifizierter MA", False, [99, 97, 95, 111]),
    ("Mitarbeiter", "MA-Auslastung", False, [102, 104, 96, 120]),
    ("Kunden", "Anzahl Beschwerden", True, [98, 104, 90, 112]),
    ("Kunden", "Kundenzufriedenheit", False, [101, 128, 121, 145]),
]
PERSPEKTIVEN = ["Finanzen", "Prozesse", "Assets", "Mitarbeiter", "Kunden"]

json.dump({"basisjahr": 2024, "skala": 160, "reihen": REIHEN, "perspektiven": PERSPEKTIVEN,
           "kennzahlen": [[PERSPEKTIVEN.index(p), k, int(s), w] for p, k, s, w in KENNZAHLEN]},
          open(os.path.join(HIER, "netz.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
with open(os.path.join(HIER, "netz.csv"), "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh, delimiter=";", lineterminator="\r\n")
    w.writerow(["Nr", "Perspektive", "Kennzahl", "Rohwert_sinkt_guenstig", "Reihe", "Index_2024_100"])
    for n, (p, k, s, werte) in enumerate(KENNZAHLEN, 1):
        for r, v in zip(REIHEN, werte):
            w.writerow([n, p, k.replace("~|", "").replace("|", " "), "ja" if s else "nein", r, v])
ist, plan = 2, 1
unter = [k for _, k, _, w in KENNZAHLEN if w[ist] < w[plan]]
print("Kennzahlen", len(KENNZAHLEN), "| Ist 2026 unter Plan 2026:", len(unter))
for p in PERSPEKTIVEN:
    ws = [w for q, _, _, w in KENNZAHLEN if q == p]
    print(p, len(ws), "Ø Ist 2026 %.1f, Ø Plan 2026 %.1f, Ø Plan 2027 %.1f" % tuple(sum(x[i] for x in ws) / len(ws) for i in (2, 1, 3)))
