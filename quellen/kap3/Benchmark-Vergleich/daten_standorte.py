"""Standortdaten für Abb. 3.24 „Objekt-Vergleich“ und Abb. 3.25 „Benchmark-Vergleich“ (6. Auflage).

Beide Abbildungen nutzen denselben Datensatz (identische Generatoren in beiden Quellordnern), damit die Zahlen
zusammenpassen. Geschäftszahlen 2027 je Standort in Mio. € (Einheit wie im Original).
- Hamburg und München: Werte des Originals (Abb. 3.24), z. B. Betriebsertrag 10.980 bzw. 10.709.
- Frankfurt: der „beste Standort“ aus Abb. 3.25 (höchster Gewinn 3.721, Umsatzrendite 31,8 %).
- Sieben weitere Standorte sind erfunden und so gewählt, dass der Durchschnitt aller zehn Standorte genau den
  Werten des Originals entspricht (Betriebsertrag 9.540, Betriebsaufwand 7.950, Gewinn 1.590, Umsatzrendite 16,7 %,
  Investitionen 451, Free Cashflow 495). Geschichte: Leipzig schreibt einen kleinen Verlust.
Gewinn = Betriebsertrag − Betriebsaufwand; Umsatzrendite = Gewinn / Betriebsertrag (Durchschnitt: Summe / Summe).
Ausgabe: standorte.json und standorte.csv (Semikolon, Dezimalkomma, UTF-8 mit BOM).
"""
import csv
import json
import os

HIER = os.path.dirname(os.path.abspath(__file__))
JAHR = 2027

# Standort, Betriebsertrag, Betriebsaufwand, Investitionen, Free Cashflow (Mio. €)
STANDORTE = [
    ("Hamburg", 10980, 8168, 516, 684),      # Original Abb. 3.24/3.25
    ("München", 10709, 7988, 431, 595),      # Original Abb. 3.24
    ("Frankfurt", 11709, 7988, 531, 695),    # „Bester Standort“ Abb. 3.25
    ("Berlin", 10150, 8320, 520, 650),
    ("Köln", 9420, 8100, 470, 560),
    ("Stuttgart", 9880, 7855, 560, 680),
    ("Düsseldorf", 8640, 7860, 390, 400),
    ("Hannover", 8210, 7720, 420, 330),
    ("Nürnberg", 7950, 7630, 330, 270),
]
# Leipzig ergänzt die Summen so, dass der Durchschnitt aller zehn Standorte dem Original entspricht
ZIEL = {"ertrag": 9540, "aufwand": 7950, "inv": 451, "fcf": 495}
n = len(STANDORTE) + 1
rest = [ZIEL[k] * n - sum(s[i + 1] for s in STANDORTE) for i, k in enumerate(("ertrag", "aufwand", "inv", "fcf"))]
STANDORTE.append(("Leipzig", *rest))

# Prüfungen: Durchschnitt = Original, Frankfurt höchster Gewinn und höchste Rendite
for i, k in enumerate(("ertrag", "aufwand", "inv", "fcf")):
    assert sum(s[i + 1] for s in STANDORTE) == ZIEL[k] * n, k
gewinn = {s[0]: s[1] - s[2] for s in STANDORTE}
rendite = {s[0]: (s[1] - s[2]) / s[1] for s in STANDORTE}
assert max(gewinn, key=gewinn.get) == "Frankfurt" and max(rendite, key=rendite.get) == "Frankfurt"
assert gewinn["Hamburg"] == 2812 and gewinn["München"] == 2721 and gewinn["Frankfurt"] == 3721

json.dump({"jahr": JAHR, "einheit": "Mio. €",
           # Zeile: Standort, Betriebsertrag, Betriebsaufwand, Investitionen, Free Cashflow
           "standorte": [list(s) for s in STANDORTE]},
          open(os.path.join(HIER, "standorte.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
de = lambda v, nk=0: f"{v:.{nk}f}".replace(".", ",")
with open(os.path.join(HIER, "standorte.csv"), "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh, delimiter=";", lineterminator="\r\n")
    w.writerow(["Standort", "Jahr", "Betriebsertrag_Mio_EUR", "Betriebsaufwand_Mio_EUR", "Gewinn_Mio_EUR",
                "Umsatzrendite_Prozent", "Investitionen_Mio_EUR", "Free_Cashflow_Mio_EUR"])
    for name, e, a, inv, fcf in STANDORTE:
        w.writerow([name, JAHR, e, a, e - a, de(100 * (e - a) / e, 1), inv, fcf])

# Kontrollausgabe
print(f"{'Standort':12s} {'Ertrag':>7s} {'Aufwand':>7s} {'Gewinn':>7s} {'Rendite':>7s} {'Invest':>6s} {'FCF':>5s}")
for name, e, a, inv, fcf in STANDORTE:
    print(f"{name:12s} {e:7d} {a:7d} {e - a:7d} {100 * (e - a) / e:6.1f}% {inv:6d} {fcf:5d}")
s = [sum(x[i] for x in STANDORTE) / n for i in range(1, 5)]
print(f"{'Durchschnitt':12s} {s[0]:7.0f} {s[1]:7.0f} {s[0] - s[1]:7.0f} {100 * (s[0] - s[1]) / s[0]:6.1f}% {s[2]:6.0f} {s[3]:5.0f}")
