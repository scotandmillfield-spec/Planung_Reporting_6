"""Daten für Abb. 5.59 „Mobile Reporting mit einem Smartphone“ und Abb. 5.60 „… mit einem Tablet“ (derselbe Bericht).

Einzelsätze: Monatswerte je Land und Produktlinie von Januar 2026 bis August 2027 – Umsatz und Ergebnis, jeweils
Ist und Budget, in Tsd. €. Der Bericht zeigt die rollierenden 12 Monate bis zum gewählten Monat.

Anker aus dem Original (Abb. 5.60, „Werte in T€“): Umsatz der acht Länder in den 12 Monaten bis August 2027 genau wie
in der Tabelle des Originals (Großbritannien 481.492, Deutschland 466.790, Schweiz 155.296, Österreich 152.275,
Italien 149.003, Spanien 123.079, Niederlande 67.454, Polen 35.992; zusammen 1.631.381 T€), damit auch die
ABC-Klassen (Grenzen 65 % und 80 %) wie im Original ausfallen. Aus Abb. 5.59 stammen die Gliederung nach fünf
Produktlinien (dort Marken) mit 12-Monats-Verlauf und Budgetvergleich sowie das negative Ergebnis in
Großbritannien. Geschichte: Elektro wächst stark und liegt über Budget, Kompakt und Sport schrumpfen;
Großbritannien hat den größten Umsatz, aber ein negatives Ergebnis.
Ausgabe: mobil.json und mobil.csv.
"""
import csv
import json
import math
import os
import random

HIER = os.path.dirname(os.path.abspath(__file__))
SEED = 559
rnd = random.Random(SEED)

MONATE = [f"2026-{m:02d}" for m in range(1, 13)] + [f"2027-{m:02d}" for m in range(1, 9)]
FENSTER = list(range(len(MONATE) - 12, len(MONATE)))          # September 2026 bis August 2027
# Kürzel, Name, Region, Umsatz 12 Monate bis Aug 2027 (T€, Original), Ergebnis-Zuschlag (%-Pkt.), ΔBU Land
LAENDER = [
    ["GB", "Großbritannien", "uebrige", 481492, -6.4, -0.050],
    ["DE", "Deutschland", "dach", 466790, 0.6, 0.015],
    ["CH", "Schweiz", "dach", 155296, 2.1, 0.010],
    ["AT", "Österreich", "dach", 152275, 1.0, 0.020],
    ["IT", "Italien", "uebrige", 149003, -1.2, -0.020],
    ["ES", "Spanien", "uebrige", 123079, -0.4, 0.030],
    ["NL", "Niederlande", "uebrige", 67454, 1.2, 0.005],
    ["PL", "Polen", "uebrige", 35992, 0.2, 0.060],
]
# Name, Anteil am Umsatz, Wachstum je Jahr, Marge %, ΔBU Linie
LINIEN = [
    ["Kompakt", 0.25, -0.06, 3.2, -0.035],
    ["Limousine", 0.26, -0.02, 6.0, -0.005],
    ["SUV", 0.28, 0.08, 8.2, 0.025],
    ["Sport", 0.07, -0.01, 11.0, -0.060],
    ["Elektro", 0.14, 0.32, -1.5, 0.090],
]
SAISON = {1: 0.86, 2: 0.92, 3: 1.14, 4: 1.0, 5: 1.0, 6: 1.10, 7: 0.98, 8: 0.84, 9: 1.12, 10: 1.02, 11: 0.98, 12: 0.92}


def verteilen(roh, ziel):
    s = sum(roh)
    x = [r * ziel / s for r in roh]
    g = [math.floor(v) for v in x]
    for i in sorted(range(len(x)), key=lambda i: x[i] - g[i], reverse=True)[:ziel - sum(g)]:
        g[i] += 1
    return g


zeilen = []                                                  # [land, linie, monat, ist, budget, ergebnis, ergebnis_budget]
for li, (lk, ln, reg, ziel, zuschlag, dbu_land) in enumerate(LAENDER):
    mix = [p[1] * rnd.uniform(0.8, 1.2) for p in LINIEN]
    roh = {}
    for pi, (pn, anteil, wachstum, marge, dbu) in enumerate(LINIEN):
        for m, mon in enumerate(MONATE):
            t = (m - (len(MONATE) - 1)) / 12                     # Jahre vor August 2027
            roh[pi, m] = mix[pi] * (1 + wachstum) ** t * SAISON[int(mon[5:])] * rnd.uniform(0.93, 1.07)
    fenster = [(pi, m) for pi in range(len(LINIEN)) for m in FENSTER]
    g = verteilen([roh[k] for k in fenster], ziel)
    f = ziel / sum(roh[k] for k in fenster)
    ist = {k: v for k, v in zip(fenster, g)}
    for k in roh:
        if k not in ist:
            ist[k] = round(roh[k] * f)
    for pi, (pn, anteil, wachstum, marge, dbu) in enumerate(LINIEN):
        for m in range(len(MONATE)):
            u = ist[pi, m]
            bud = round(u / (1 + dbu + dbu_land) * rnd.uniform(0.985, 1.015))
            erg = round(u * (marge + zuschlag + rnd.uniform(-0.8, 0.8)) / 100)
            erg_bud = round(bud * (marge + max(zuschlag, -5.6) + 0.3) / 100)   # Budget: Großbritannien knapp positiv
            zeilen.append([li, pi, m, u, bud, erg, erg_bud])

daten = {"monate": MONATE, "laender": [x[:3] for x in LAENDER], "linien": [x[0] for x in LINIEN],
         "regionen": [["dach", "DACH"], ["uebrige", "Übrige"]], "abc": [0.65, 0.80], "zeilen": zeilen}
json.dump(daten, open(os.path.join(HIER, "mobil.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))

with open(os.path.join(HIER, "mobil.csv"), "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh, delimiter=";", lineterminator="\r\n")
    w.writerow(["Monat", "Land", "Region", "Produktlinie", "Umsatz_Ist_TEUR", "Umsatz_Budget_TEUR", "Ergebnis_Ist_TEUR", "Ergebnis_Budget_TEUR"])
    for li, pi, m, u, b, e, eb in zeilen:
        w.writerow([MONATE[m], LAENDER[li][1], "DACH" if LAENDER[li][2] == "dach" else "Übrige", LINIEN[pi][0], u, b, e, eb])

# Kontrollausgabe: 12 Monate bis August 2027
fz = [z for z in zeilen if z[2] in FENSTER]
U = sum(z[3] for z in fz)
print(f"12 Monate bis {MONATE[-1]}: Umsatz {U} T€, Budget {sum(z[4] for z in fz)} T€, Ergebnis {sum(z[5] for z in fz)} T€, "
      f"Ergebnis-Budget {sum(z[6] for z in fz)} T€")
kum = 0
for li, x in sorted(enumerate(LAENDER), key=lambda t: -sum(z[3] for z in fz if z[0] == t[0])):
    u = sum(z[3] for z in fz if z[0] == li)
    kum += u
    e = sum(z[5] for z in fz if z[0] == li)
    print(f"  {x[1]:15s} {u:8d}  Anteil {u / U * 100:5.2f} %  kum. {kum / U * 100:6.2f} %  Ergebnis {e:7d}  Rendite {e / u * 100:5.1f} %")
for pi, x in enumerate(LINIEN):
    u = sum(z[3] for z in fz if z[1] == pi)
    b = sum(z[4] for z in fz if z[1] == pi)
    print(f"  {x[0]:10s} {u:8d}  ΔBU {(u / b - 1) * 100:+5.1f} %")
