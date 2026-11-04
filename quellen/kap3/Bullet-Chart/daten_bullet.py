"""Daten für Abb. 3.54 „Bullet-Chart“.

Das Original zeigte eine einzige Kennzahl („Evaluation“: Wert 65, Ziel 78, Skala 0–100, fünf Farbbereiche).
Bullet-Charts sind dafür gedacht, mehrere Kennzahlen platzsparend untereinander zu stellen; deshalb vier Kennzahlen
eines Unternehmens, die erste mit den Werten des Originals (Kundenzufriedenheit 65, Ziel 78). Je Kennzahl:
Einheit, Skala, Grenzen der Bewertungsbereiche (schlecht | befriedigend | gut), Ist, Ziel, Richtung (+1 höher besser).
Ausgabe: bullet.json und bullet.csv.
"""
import csv
import json
import os

HIER = os.path.dirname(os.path.abspath(__file__))
KENNZAHLEN = [  # Name, Einheit, Skala bis, Grenzen [befriedigend ab, gut ab], Ist, Ziel, Nachkommastellen
    ("Kundenzufriedenheit", "Index 0–100", 100, [60, 80], 65, 78, 0),
    ("Umsatz", "Mio. €", 600, [380, 450], 460, 440, 0),
    ("Deckungsbeitragsquote", "%", 50, [25, 35], 31.4, 35, 1),
    ("Liefertreue", "%", 100, [85, 95], 93.8, 95, 1),
]
json.dump({"jahr": 2027, "kennzahlen": [list(k) for k in KENNZAHLEN]},
          open(os.path.join(HIER, "bullet.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
with open(os.path.join(HIER, "bullet.csv"), "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh, delimiter=";", lineterminator="\r\n")
    w.writerow(["Kennzahl", "Einheit", "Skala_bis", "Befriedigend_ab", "Gut_ab", "Ist", "Ziel"])
    for n, e, s, (b, g), i, z, _ in KENNZAHLEN:
        w.writerow([n, e, s, b, g, str(i).replace(".", ","), str(z).replace(".", ",")])
print("ok")
