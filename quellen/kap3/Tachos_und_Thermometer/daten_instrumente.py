"""Daten für Abb. 3.65 „Tachos und Thermometer“: drei Kennzahlen als Tacho, Ring und Thermometer.

Das Original zeigte drei Instrumente ohne Namen, Einheit und Ziel: Tacho mit Wert 5.348 (Zeiger bei etwa 60 %
der Skala), Ring mit 85 %, Thermometer bei etwa 51 %. Die Werte bleiben; Kennzahl, Einheit, Skala, Ziel und
Bewertungsbereiche sind ergänzt (erfunden, Stand Juni 2027):
- Tacho: Auftragseingang Juni 2027, 5.348 Tsd. €, Skala 0–9.000 (Zeiger bei 59 % wie im Original), Ziel 5.000.
- Ring: Kapazitätsauslastung Juni 2027, 85 %, Ziel 90 %.
- Thermometer: Budgetausschöpfung 1. Halbjahr 2027, 51 %, Ziel höchstens 50 % (zeitanteilig) – mehr ist ungünstig.
Bereiche wie im Bullet-Chart (Abb. 3.54): schlecht | befriedigend | gut, Grenzen je Kennzahl.
Ausgabe: instrumente.json und instrumente.csv.
"""
import csv
import json
import os

HIER = os.path.dirname(os.path.abspath(__file__))
# Typ, Kennzahl, Zeitraum, Einheit, Skala bis, Grenzen [a, b], Ist, Ziel, Richtung (+1 höher besser), Nachkommastellen
# Grenzen: bei Richtung +1 schlecht < a ≤ befriedigend < b ≤ gut; bei Richtung −1 gut ≤ a < befriedigend ≤ b < schlecht
INSTRUMENTE = [
    ("tacho", "Auftragseingang", "Juni 2027", "Tsd. €", 9000, [4000, 5000], 5348, 5000, 1, 0),
    ("ring", "Kapazitätsauslastung", "Juni 2027", "%", 100, None, 85, 90, 1, 0),
    ("thermometer", "Budgetausschöpfung", "1. Halbjahr 2027", "%", 100, [50, 60], 51, 50, -1, 0),
]
json.dump({"stand": "Juni 2027", "instrumente": [list(i) for i in INSTRUMENTE]},
          open(os.path.join(HIER, "instrumente.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
with open(os.path.join(HIER, "instrumente.csv"), "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh, delimiter=";", lineterminator="\r\n")
    w.writerow(["Darstellung", "Kennzahl", "Zeitraum", "Einheit", "Skala_bis", "Grenze_1", "Grenze_2", "Ist", "Ziel", "Richtung"])
    for typ, n, z, e, s, g, i, zi, r, nk in INSTRUMENTE:
        w.writerow([typ, n, z, e, s, g[0] if g else "", g[1] if g else "", i, zi, r])
for typ, n, z, e, s, g, i, zi, r, nk in INSTRUMENTE:
    d = i - zi
    print(f"{n}: Ist {i} Ziel {zi} ΔZiel {d:+} ({'günstig' if d * r > 0 else 'ungünstig' if d * r < 0 else 'neutral'}),"
          f" Zeiger bei {100 * i / s:.0f} % der Skala")
