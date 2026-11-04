"""Daten für Abb. 3.18 „Zielerreichungsbericht“.

Werte des Originals (5. Auflage) unverändert: Plan p. a., Ist kumuliert und Ist Vorjahr p. a. für sechs Geschäftszahlen
in Mio. € und drei Personalbestände in FTE. Gewinn (Betriebsertrag − Betriebsaufwand) und Umsatzrendite
(Gewinn ÷ Betriebsertrag) rechnet das Visual als Kennzahlen aus den Zeilen; die Kontrollausgabe vergleicht sie mit dem
Original. Gelesen als Geschäftsjahr 2027 (Ist kumuliert Januar–Dezember), Vorjahr 2026, weil das kumulierte Ist bereits
auf Höhe von Plan p. a. und Vorjahr p. a. liegt. Richtung der Wirkung je Kennzahl: +1 Anstieg günstig, −1 ungünstig,
0 ohne Wertung (Investitionen, Bilanzsumme, Personalbestände).
Ausgabe: ziele.json (Kennzahlen) und ziele.csv (Einzelsätze Kennzahl × Szenario).
"""
import csv
import json
import os

HIER = os.path.dirname(os.path.abspath(__file__))
JAHR = 2027
# Kennzahl, Abschnitt (GZ = Geschäftszahlen Mio. €, PB = Personalbestand FTE), Art (fluss | bestand), Richtung,
# Plan p. a., Ist kumuliert, Ist Vorjahr p. a.
KENNZAHLEN = [
    ("Betriebsertrag", "GZ", "fluss", 1, 8980, 8709, 8688),
    ("Betriebsaufwand", "GZ", "fluss", -1, 8168, 7988, 7953),
    ("Investitionen", "GZ", "fluss", 0, 516, 431, 415),
    ("Free Cashflow", "GZ", "fluss", 1, 684, 595, 576),
    ("Bilanzsumme", "GZ", "bestand", 0, 71603, 84676, 82659),
    ("Eigenkapital", "GZ", "bestand", 1, 2857, 3534, 2745),
    ("Konzern", "PB", "bestand", 0, 44178, 44803, 44698),
    ("Stammhaus", "PB", "bestand", 0, 32919, 30863, 30699),
    ("Leihpersonal", "PB", "bestand", 0, 1571, 1690, 1602),
]

json.dump({"jahr": JAHR, "kennzahlen": [list(k) for k in KENNZAHLEN]},
          open(os.path.join(HIER, "ziele.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))

with open(os.path.join(HIER, "ziele.csv"), "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh, delimiter=";", lineterminator="\r\n")
    w.writerow(["Kennzahl", "Abschnitt", "Einheit", "Art", "Richtung", "Szenario", "Jahr", "Wert"])
    for name, ab, art, ri, pl, ist, vj in KENNZAHLEN:
        for sz, jahr, v in (("Plan p. a.", JAHR, pl), ("Ist kumuliert", JAHR, ist), ("Ist Vorjahr p. a.", JAHR - 1, vj)):
            w.writerow([name, "Geschäftszahlen" if ab == "GZ" else "Personalbestand", "Mio. €" if ab == "GZ" else "FTE",
                        art, ri, sz, jahr, v])

# Kontrollausgabe: abgeleitete Kennzahlen und Quoten gegen das Original
k = {n: (pl, ist, vj) for n, _, _, _, pl, ist, vj in KENNZAHLEN}
gewinn = [a - b for a, b in zip(k["Betriebsertrag"], k["Betriebsaufwand"])]
rendite = [g / e * 100 for g, e in zip(gewinn, k["Betriebsertrag"])]
assert gewinn == [812, 721, 735], gewinn
print("Gewinn        Plan {:6d}  Ist {:6d}  VJ {:6d}  Quote PL {:5.1f} %  Quote VJ {:5.1f} %".format(
    *gewinn, gewinn[1] / gewinn[0] * 100, gewinn[1] / gewinn[2] * 100))
print("Umsatzrendite Plan {:6.1f}  Ist {:6.1f}  VJ {:6.1f}  ΔPL {:+.1f} %-Pkt.  ΔVJ {:+.1f} %-Pkt.".format(
    *rendite, rendite[1] - rendite[0], rendite[1] - rendite[2]))
for n, (pl, ist, vj) in k.items():
    print(f"{n:15s} Quote PL {ist / pl * 100:6.1f} %  ΔPL {ist - pl:+7d}   Quote VJ {ist / vj * 100:6.1f} %  ΔVJ {ist - vj:+6d}")
