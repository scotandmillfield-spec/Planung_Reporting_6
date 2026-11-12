"""Daten für Abb. 3.78 „Integrierte Fotos und Logos“: Monatsübersicht eines Automobilvertriebs, März 2027.

Ergebnisübersicht März: Ist und Abweichung zum Plan des Originals je Region (Umsatzerlöse, Rohertrag, Ergebnis in €);
der Plan ist aus Ist und Abweichung zurückgerechnet (bei negativem Plan: Abweichung bezogen auf |Plan|).
Regionen statt der Gesellschaftsnamen des Originals (Motor Union Australia → Australien, Rolling North Americas →
Nordamerika, Motorcars of UK → Großbritannien, United European Car Dealers → Kontinentaleuropa).
Ergebnis je Quartal (Tsd. €): Q1 Ist und Plan Q1 bis Q4 in Anlehnung an das Flächendiagramm des Originals.
Verkäufer und Modelle (Fahrzeuge im März) sind erfunden. Porträts, Produktansichten und das Logo des erfundenen
Autohauses „Lindqvar Automobile“ sind selbst gezeichnete, lizenzfreie Illustrationen (daten_bilder.py, bilder/). Ausgabe: vertrieb.json und vertrieb.csv.
"""
import csv
import json
import os
import sys

HIER = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HIER)
sys.dont_write_bytecode = True
REGIONEN = ["Kontinentaleuropa", "Nordamerika", "Australien", "Großbritannien"]       # nach Umsatz
KENNZAHLEN = ["Umsatzerlöse", "Rohertrag", "Ergebnis"]
# März 2027: Ist in € und Abweichung zum Plan in % (Original)
MAERZ = {
    "Kontinentaleuropa": [(8388258, -2.0), (904004, 50.8), (354231, 331.1)],
    "Nordamerika": [(3925807, -8.8), (380070, 8.4), (153236, 32.3)],
    "Australien": [(1807180, -8.1), (167446, -64.3), (37600, -89.1)],
    "Großbritannien": [(880404, -13.1), (87821, 24.3), (-74762, 11.1)],
}
# Ergebnis je Quartal in Tsd. €: Ist Q1, Plan Q1..Q4
QUARTAL = {
    "Kontinentaleuropa": (850, [780, 840, 680, 620]),
    "Nordamerika": (-20, [60, 670, 230, 790]),
    "Australien": (30, [120, 490, 470, 10]),
    "Großbritannien": (-200, [-150, 300, 60, 260]),
}
VERKAEUFER = [  # Region, Name, Fahrzeuge, Umsatz Tsd. €, Ziel Fahrzeuge
    ("Kontinentaleuropa", "Frau Brandt", 31, 1120, 26), ("Kontinentaleuropa", "Herr Tal", 27, 980, 26),
    ("Kontinentaleuropa", "Frau Lenz", 24, 860, 25), ("Nordamerika", "Herr Kaya", 22, 790, 20),
    ("Nordamerika", "Frau Moreau", 19, 700, 21), ("Nordamerika", "Herr Olsen", 17, 610, 18),
    ("Australien", "Frau Petrov", 14, 470, 15), ("Australien", "Herr Weber", 12, 410, 14),
    ("Großbritannien", "Herr Novak", 9, 300, 8), ("Großbritannien", "Frau Albers", 7, 240, 9),
]
MODELLE = ["Limousine L 67", "SUV S 55", "Kombi K 40", "Kompakt C 20"]
ABSATZ = {"Kontinentaleuropa": [62, 51, 55, 42], "Nordamerika": [27, 34, 19, 15], "Australien": [10, 16, 12, 7],
          "Großbritannien": [6, 3, 5, 8]}


def plan(ist, p):
    return round(ist / (1 + p / 100)) if ist >= 0 else round(ist / (1 - p / 100))


maerz = [[ri, ki, ist, plan(ist, p)] for ri, r in enumerate(REGIONEN) for ki, (ist, p) in enumerate(MAERZ[r])]
quartal = [[ri, qi, QUARTAL[r][0] if qi == 0 else None, QUARTAL[r][1][qi]] for ri, r in enumerate(REGIONEN) for qi in range(4)]
verk = [[REGIONEN.index(r), n, f, u, z] for r, n, f, u, z in VERKAEUFER]
absatz = [[ri, mi, ABSATZ[r][mi]] for ri, r in enumerate(REGIONEN) for mi in range(len(MODELLE))]
# Selbst gezeichnete Illustrationen (daten_bilder.py) einbetten: Porträt je Verkäufer, Seitenansicht je Modell, Logo
import daten_bilder as DB  # noqa: E402
bilder = {"logo": DB.LOGO,
          "personen": {n: DB.portraet(p, i) for i, (n, p) in enumerate(DB.PERSONEN.items())},
          "produkte": {m: DB.produkt(m, i) for i, m in enumerate(DB.MODELLBAU)},
          "firma": "Lindqvar Automobile"}
assert set(bilder["personen"]) == {v[1] for v in VERKAEUFER} and set(bilder["produkte"]) == set(MODELLE)
json.dump({"bilder": bilder, "monat": "2027-03", "stand": "2027-03-31", "regionen": REGIONEN, "kennzahlen": KENNZAHLEN, "modelle": MODELLE,
           "maerz": maerz, "quartal": quartal, "verkaeufer": verk, "absatz": absatz},
          open(os.path.join(HIER, "vertrieb.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
with open(os.path.join(HIER, "vertrieb.csv"), "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh, delimiter=";", lineterminator="\r\n")
    w.writerow(["Ebene", "Region", "Periode", "Kennzahl_oder_Name", "Ist", "Plan", "Ziel"])
    for ri, ki, i, p in maerz:
        w.writerow(["Monat", REGIONEN[ri], "2027-03", KENNZAHLEN[ki] + " (€)", i, p, ""])
    for ri, qi, i, p in quartal:
        w.writerow(["Quartal", REGIONEN[ri], f"2027-Q{qi + 1}", "Ergebnis (Tsd. €)", "" if i is None else i, p, ""])
    for ri, n, f, u, z in verk:
        w.writerow(["Verkäufer", REGIONEN[ri], "2027-03", n, f, "", z])
    for ri, mi, s in absatz:
        w.writerow(["Modell", REGIONEN[ri], "2027-03", MODELLE[mi], s, "", ""])

# Kontrollsummen
for ki, k in enumerate(KENNZAHLEN):
    i = sum(z[2] for z in maerz if z[1] == ki); p = sum(z[3] for z in maerz if z[1] == ki)
    print(f"März {k:13s} Ist {i:>11,d}  Plan {p:>11,d}  ΔPL {(i - p) / abs(p):+.1%}".replace(",", "."))
qi_ist = sum(z[2] for z in quartal if z[1] == 0); qi_pl = sum(z[3] for z in quartal if z[1] == 0)
print(f"Ergebnis Q1 Ist {qi_ist} Plan {qi_pl} Tsd. €  ΔPL {(qi_ist - qi_pl) / abs(qi_pl):+.1%}; Plan Q2–Q4 "
      f"{sum(z[3] for z in quartal if z[1] > 0)}")
tot = [sum(z[2] for z in absatz if z[1] == mi) for mi in range(len(MODELLE))]
print("Absatz März je Modell:", dict(zip(MODELLE, tot)), "gesamt", sum(tot))
