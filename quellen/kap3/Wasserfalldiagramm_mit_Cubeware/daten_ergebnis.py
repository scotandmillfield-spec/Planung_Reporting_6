"""Daten für Abb. 3.56 „Wasserfalldiagramm mit Cubeware“ (softwareneutral): Ergebnisüberleitung eines Autohandelskonzerns
über drei Jahre nach GuV-Positionen mit Detailanalyse nach Konten und Gesellschaften, Tsd. €.

Werte des Originals (Screenshot 2011, Jahre 2008–2010 → 2025–2027, Vorzeichen in Ergebnisrichtung: Aufwand negativ):
  Wasserfall: Ergebnis −1.611 → Rohertrag +3.080, sonst. betr. Aufwand −82, Raumkosten −6, Personalkosten −206 →
  Ergebnis 1.175 → Rohertrag +4.257, −311, −55, −247 → Ergebnis 4.819.
  Konten des Rohertrags (Werte und Veränderungen je Jahr) und Rohertrag der sichtbaren Gesellschaften (Australien mit zwei
  Autohäusern, Nordamerika mit einem sichtbaren Autohaus).
Das Original rundet jede Zeile für sich (z. B. 12.302 + 3.080 ≠ 15.381). Damit alle angezeigten Werte und Veränderungen
genau dem Original entsprechen und trotzdem jede Summe aufgeht, werden die Werte in 0,1 Tsd. € so bestimmt (ganzzahlige
lineare Optimierung, kleinste Abweichung von den angezeigten Werten), dass jede gerundete Zahl der Originalzahl entspricht.
Erfunden: Unterkonten von Personal-, Raum- und sonstigen Kosten, die übrigen Gesellschaften, die Aufteilung der Konten
auf die Gesellschaften (fester Seed).
Ausgabe: ergebnis.json und ergebnis.csv.
"""
import csv
import json
import os
import random

import numpy as np
from scipy.optimize import Bounds, LinearConstraint, milp

HIER = os.path.dirname(os.path.abspath(__file__))
JAHRE = [2025, 2026, 2027]
T = len(JAHRE)
POSITIONEN = [("RE", "Rohertrag"), ("SONST", "Sonst. betriebl. Aufwand"), ("RAUM", "Raumkosten"), ("PERS", "Personalkosten")]
GRUPPEN = {"UMS": "Umsatzerlöse", "MAT": "Materialaufwand"}
# Schlüssel, Bezeichnung, Konto, Position, Zwischensumme, angezeigte Werte je Jahr, angezeigte Veränderungen
KONTEN = [
    ("E_NW", "Erlöse Neuwagen", "40001", "RE", "UMS", [99698, 115911, 150837], [16213, 34927]),
    ("E_GW", "Erlöse Gebrauchtwagen", "40002", "RE", "UMS", [29423, 35839, 41625], [6417, 5786]),
    ("E_ZP", "Zusatzpakete", "40010", "RE", "UMS", [981, 1899, 2758], [919, 858]),
    ("K_NW", "Einkauf Neuwagen", "54010", "RE", "MAT", [-89682, -104275, -135731], [-14593, -31456]),
    ("K_GW", "Einkauf Gebrauchtwagen", "54020", "RE", "MAT", [-26060, -31550, -36787], [-5489, -5237]),
    ("INST", "Fahrzeuginstandsetzung", "54050", "RE", "MAT", [-1287, -1570, -1959], [-282, -390]),
    ("PROV", "Provisionen", "67710", "RE", None, [-769, -873, -1104], [-104, -231]),
    # erfunden, Summen und Veränderungen der Positionen wie im Original
    ("WERB", "Werbung", "68100", "SONST", None, [-1405, -1437, -1690], [-32, -253]),
    ("VERS", "Versicherungen und Beiträge", "69000", "SONST", None, [-618, -631, -655], [-13, -24]),
    ("VERW", "Verwaltung und IT", "68500", "SONST", None, [-1210, -1247, -1281], [-37, -34]),
    ("MIET", "Miete", "67100", "RAUM", None, [-912, -912, -948], [0, -36]),
    ("ENER", "Energie und Nebenkosten", "67200", "RAUM", None, [-356, -362, -381], [-6, -19]),
    ("LOHN", "Löhne und Gehälter", "62000", "PERS", None, [-7736, -7905, -8108], [-169, -203]),
    ("SOZ", "Soziale Abgaben", "64000", "PERS", None, [-1676, -1713, -1757], [-37, -44]),
]
K = [k[0] for k in KONTEN]
# Knoten der Konzernsicht: Schlüssel, Blätter, angezeigte Werte, angezeigte Veränderungen (None = nicht angezeigt)
KNOTEN = [
    ("UMS", ["E_NW", "E_GW", "E_ZP"], [130101, 153649, 195220], [23548, 41571]),
    ("EKF", ["K_NW", "K_GW"], [-115743, -135825, -172518], [-20082, -36693]),
    ("MAT", ["K_NW", "K_GW", "INST"], [-117030, -137394, -174477], [-20364, -37083]),
    ("RE", K[:7], [12302, 15381, 19638], [3080, 4257]),
    ("SONST", ["WERB", "VERS", "VERW"], [-3233, -3315, -3626], [-82, -311]),
    ("RAUM", ["MIET", "ENER"], [-1268, -1274, -1329], [-6, -55]),
    ("PERS", ["LOHN", "SOZ"], [-9412, -9618, -9865], [-206, -247]),
    ("ERG", K, [-1611, 1175, 4819], None),
] + [(k[0], [k[0]], k[5], k[6]) for k in KONTEN]


def loese(variablen, knoten, fest=(), grenze=4):
    """Ganzzahlige Werte in 0,1 Tsd. € je (Variable, Jahr): jede Knotensumme rundet auf den angezeigten Wert, jede
    Veränderung auf die angezeigte Veränderung; Ziel: kleinste Summe der Abweichungen von den angezeigten Werten."""
    nv = len(variablen) * T
    idx = {(v, t): i * T + t for i, v in enumerate(variablen) for t in range(T)}
    basis = {}
    for name, blaetter, d, _ in knoten:
        if len(blaetter) == 1 and blaetter[0] == name:
            werte = d if not isinstance(d, tuple) else d[0]
            for t in range(T):
                basis[(name, t)] = werte[t] * 10
    for v in variablen:                                    # Startwerte für Variablen ohne eigene Anzeige
        for t in range(T):
            basis.setdefault((v, t), 0)
    A, lo, hi = [], [], []
    def zeile(koef, a, b):
        r = np.zeros(2 * nv); [r.__setitem__(i, c) for i, c in koef.items()]; A.append(r); lo.append(a); hi.append(b)
    for name, blaetter, d, dd in knoten:
        tol = grenze if not isinstance(d, tuple) else d[1]
        werte = d if not isinstance(d, tuple) else d[0]
        for t in range(T):
            if werte[t] is None:
                continue
            zeile({idx[(b, t)]: 1 for b in blaetter}, werte[t] * 10 - tol, werte[t] * 10 + tol)
        if dd:
            for t in range(T - 1):
                k = {idx[(b, t + 1)]: 1 for b in blaetter}
                for b in blaetter:
                    k[idx[(b, t)]] = k.get(idx[(b, t)], 0) - 1
                zeile(k, dd[t] * 10 - grenze, dd[t] * 10 + grenze)
    for (v, t), wert in fest:
        zeile({idx[(v, t)]: 1}, wert, wert)
    for (v, t), i in idx.items():                         # Hilfsvariable u ≥ |x − Basis|
        zeile({i: 1, nv + i: -1}, -np.inf, basis[(v, t)])
        zeile({i: -1, nv + i: -1}, -np.inf, -basis[(v, t)])
    c = np.r_[np.zeros(nv), np.ones(nv)]
    r = milp(c, constraints=LinearConstraint(np.array(A), lo, hi), integrality=np.ones(2 * nv),
             bounds=Bounds(np.r_[np.full(nv, -1e7), np.zeros(nv)], np.full(2 * nv, 1e7)))
    if not r.success:
        raise SystemExit("keine Lösung: " + r.message)
    return {k: int(round(r.x[i])) for k, i in idx.items()}


# 1. Konzernwerte je Konto
KZ = loese(K, KNOTEN)
re_t = [sum(KZ[(k, t)] for k in K[:7]) for t in range(T)]

# 2. Rohertrag je Gesellschaft (Australien und Nordamerika aus dem Original, übrige erfunden), Summe = Konzern
GES = [("AU1", "Autohaus Sydney", "Australien"), ("AU2", "Autohaus Melbourne", "Australien"),
       ("NA1", "Autohaus Los Angeles", "Nordamerika"), ("NA2", "Autohaus Toronto", "Nordamerika"),
       ("EU1", "Autohaus Hamburg", "Europa"), ("EU2", "Autohaus Wien", "Europa")]
GK = [g[0] for g in GES]
GKNOTEN = [
    ("AU1", ["AU1"], [822, 1126, 1563], [303, 437]),
    ("AU2", ["AU2"], [697, 850, 1153], [153, 302]),
    ("AU", ["AU1", "AU2"], [1520, 1976, 2715], [456, 740]),
    ("NA1", ["NA1"], [1292, 1559, 1918], [266, 360]),
    ("NA", ["NA1", "NA2"], [3314, 3965, 4975], [650, 1010]),
    ("NA2", ["NA2"], ([2022, 2406, 3057], 20), None),
    ("EU1", ["EU1"], ([4105, 5204, 6512], 20), None),
    ("EU2", ["EU2"], ([3363, 4236, 5436], 20), None),
]
GR = loese(GK, GKNOTEN)
# Summe auf den Konzern-Rohertrag zwingen: Differenz trägt Wien (erfunden)
for t in range(T):
    GR[("EU2", t)] += re_t[t] - sum(GR[(g, t)] for g in GK)

# 3. Zellen Gesellschaft × Konto × Jahr (0,1 Tsd. €): Anteile mit Rauschen, Einkauf Neuwagen gleicht den Rohertrag
#    der Gesellschaft aus, Wien nimmt den Rest je Konto auf
rnd = random.Random(356)
anteil = {}
for t in range(T):
    roh = [GR[(g, t)] / re_t[t] * (1 + rnd.uniform(-0.04, 0.04)) for g in GK]
    s = sum(roh)
    for g, a in zip(GK, roh):
        anteil[(g, t)] = a / s
W = {}
for t in range(T):
    for k in K:
        rest = KZ[(k, t)]
        for g in GK[:-1]:
            if k == "K_NW":
                continue
            v = round(KZ[(k, t)] * anteil[(g, t)] * (1 + rnd.uniform(-0.06, 0.06)))
            W[(g, k, t)] = v; rest -= v
        if k != "K_NW":
            W[(GK[-1], k, t)] = rest
    rest = KZ[("K_NW", t)]
    for g in GK[:-1]:
        v = GR[(g, t)] - sum(W[(g, k, t)] for k in K[:7] if k != "K_NW")
        W[(g, "K_NW", t)] = v; rest -= v
    W[(GK[-1], "K_NW", t)] = rest

# Prüfungen
for t in range(T):
    for k in K:
        assert sum(W[(g, k, t)] for g in GK) == KZ[(k, t)]
    for g in GK:
        assert sum(W[(g, k, t)] for k in K[:7]) == GR[(g, t)]
        q = -W[(g, "K_NW", t)] / W[(g, "E_NW", t)]
        assert 0.8 < q < 1.0, (g, t, q)

json.dump({"jahre": JAHRE, "positionen": [list(p) for p in POSITIONEN], "gruppen": GRUPPEN,
           "konten": [[k[0], k[1], k[2], k[3], k[4]] for k in KONTEN],
           "gesellschaften": [list(g) for g in GES],
           "werte": [[[W[(g, k, t)] for t in range(T)] for k in K] for g in GK]},
          open(os.path.join(HIER, "ergebnis.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
with open(os.path.join(HIER, "ergebnis.csv"), "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh, delimiter=";", lineterminator="\r\n")
    w.writerow(["Gesellschaft", "Region", "Position", "Konto", "Kontobezeichnung", "Jahr", "Wert_Tsd_EUR"])
    pos = dict(POSITIONEN)
    for g, gname, reg in GES:
        for k in KONTEN:
            for t, j in enumerate(JAHRE):
                w.writerow([gname, reg, pos[k[3]], k[2], k[1], j, f"{W[(g, k[0], t)] / 10:.1f}".replace(".", ",")])

# Kontrollausgabe: angezeigte (gerundete) Werte
r = lambda x: f"{x / 10:,.0f}".replace(",", ".")
def zeige(name, werte):
    print(f"{name:7s}", " | ".join(r(v) for v in werte), "  Δ", " | ".join(r(b - a) for a, b in zip(werte, werte[1:])))
for name, blaetter, _, _ in KNOTEN[:8]:
    zeige(name, [sum(KZ[(b, t)] for b in blaetter) for t in range(T)])
for g in GK:
    zeige(g, [GR[(g, t)] for t in range(T)])
zeige("AU", [GR[("AU1", t)] + GR[("AU2", t)] for t in range(T)])
zeige("NA", [GR[("NA1", t)] + GR[("NA2", t)] for t in range(T)])
