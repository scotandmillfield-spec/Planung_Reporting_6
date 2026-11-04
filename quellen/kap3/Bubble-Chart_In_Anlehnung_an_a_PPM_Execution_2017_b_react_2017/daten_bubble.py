"""Daten für Abb. 3.47 „Bubble-Chart“ – zwei Beispiele wie im Original.

a) Projektportfolio: 15 Projekte (Buchstaben wie im Original) nach Wert (Opportunity Score 0–10) und Risiko
   (0–10, hoch = riskant), Kreisfläche = Kapitalwert über fünf Jahre in Mio. €, vier Projektkategorien.
   Lage, Kategorie und Größenklasse (< 1, 1–2, 2–5, > 5 Mio. €) aus dem Original abgelesen; Kapitalwerte innerhalb
   der Klasse erfunden. Kategorienamen statt „Category 1–4“: Wachstum, Effizienz, Digitalisierung, Pflicht.
b) Gepackte Blasen: Begriffe in Kundenbewertungen eines Online-Shops (1. Halbjahr 2027) nach Häufigkeit und
   Stimmung. Das Original zeigte Begriffe aus der US-Wahlberichterstattung 2016 (Personen, Orte); hier neutral und
   zum Controlling-Kontext passend, Zahlen erfunden.
Ausgabe: bubble.json und bubble.csv.
"""
import csv
import json
import os

HIER = os.path.dirname(os.path.abspath(__file__))
KATEGORIEN = ["Wachstum", "Effizienz", "Digitalisierung", "Pflicht"]
# Projekt: (Wert, Risiko, Kapitalwert Mio. €, Kategorie-Index)
PROJEKTE = {
    "A": (7.5, 0.7, 3.5, 2), "B": (2.9, 2.0, 1.4, 3), "C": (2.6, 4.4, 1.2, 1), "K": (4.5, 4.0, 1.5, 1),
    "T": (6.4, 4.0, 6.2, 0), "V": (1.7, 5.7, 0.6, 2), "L": (4.4, 6.3, 3.0, 3), "D": (9.0, 6.2, 7.4, 2),
    "E": (5.2, 7.5, 1.6, 1), "F": (1.0, 8.5, 0.8, 1), "G": (4.3, 8.8, 1.3, 2), "H": (4.8, 9.5, 1.8, 1),
    "S": (6.0, 8.8, 5.8, 0), "I": (6.7, 9.7, 6.6, 1), "M": (8.7, 8.5, 6.0, 0),
}
STIMMUNG = ["negativ", "positiv", "neutral"]
BEGRIFFE = [  # Begriff, Nennungen, Stimmung
    ("Qualität", 620, 1), ("Lieferzeit", 540, 0), ("Preis", 480, 2), ("Service", 410, 1), ("Verpackung", 300, 2),
    ("Rücksendung", 280, 0), ("Beratung", 260, 1), ("Passform", 240, 0), ("Material", 230, 1), ("Größe", 220, 2),
    ("Versandkosten", 210, 0), ("Farbe", 200, 2), ("Kundenservice", 190, 1), ("Lieferung", 180, 0),
    ("Bestellung", 170, 2), ("Zahlung", 150, 2), ("Rabatt", 140, 1), ("Gutschein", 120, 1), ("App", 115, 0),
    ("Website", 110, 2), ("Umtausch", 105, 0), ("Nachhaltigkeit", 100, 1), ("Design", 95, 1), ("Haltbarkeit", 90, 0),
    ("Beschreibung", 85, 2), ("Bilder", 80, 2), ("Hotline", 75, 0), ("Bewertung", 70, 2), ("Newsletter", 60, 2),
    ("Filiale", 55, 2), ("Garantie", 50, 1), ("Montage", 45, 0), ("Sortiment", 45, 1), ("Abholung", 40, 2),
    ("Retourenlabel", 38, 0), ("Treuepunkte", 35, 1),
]

json.dump({"kategorien": KATEGORIEN, "projekte": [[p, *v] for p, v in PROJEKTE.items()],
           "stimmungen": STIMMUNG, "begriffe": [list(b) for b in BEGRIFFE]},
          open(os.path.join(HIER, "bubble.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
with open(os.path.join(HIER, "bubble.csv"), "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh, delimiter=";", lineterminator="\r\n")
    w.writerow(["Ebene", "Name", "Kategorie_oder_Stimmung", "Wert", "Risiko", "Kapitalwert_Mio_EUR", "Nennungen"])
    for p, (x, r, npv, k) in PROJEKTE.items():
        w.writerow(["Projekt", p, KATEGORIEN[k], str(x).replace(".", ","), str(r).replace(".", ","), str(npv).replace(".", ","), ""])
    for b, n, s in BEGRIFFE:
        w.writerow(["Begriff", b, STIMMUNG[s], "", "", "", n])
print("Projekte:", len(PROJEKTE), "Kapitalwert gesamt", round(sum(v[2] for v in PROJEKTE.values()), 1), "Mio. €")
print("Begriffe:", len(BEGRIFFE), "Nennungen", sum(b[1] for b in BEGRIFFE),
      {s: sum(b[1] for b in BEGRIFFE if b[2] == i) for i, s in enumerate(STIMMUNG)})
