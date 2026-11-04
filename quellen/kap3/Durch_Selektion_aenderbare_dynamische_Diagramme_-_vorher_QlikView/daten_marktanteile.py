"""Daten für Abb. 3.74/3.75 „Durch Selektion änderbare dynamische Diagramme – vorher/nachher“.

Absatzmarkt für mobile Endgeräte, 16 Quartale (Q3 2023 bis Q2 2027), Absatz in Tsd. Stück je
Quartal x Unterkategorie x Untersegment x Region x Anbieter (eigenes Unternehmen, Anbieter A–E, Übrige).
Marktanteil = Absatz eines Anbieters / Absatz aller Anbieter; das Dashboard rechnet alles aus diesen Zeilen.

Werte des Originals (QlikView-Demo „Market Share“, Q4 2013 → hier Q2 2027):
  ohne Selektion          eigener Anteil 15,0 % (Vorquartal 15,7 %, Vorjahresquartal 16,1 %),
                          Regionen 17,4 / 13,7 / 18,5 / 12,0 %, Zeitreihe der Anbieter wie in „Market Share against Time“
  Smartphones x Privat    58,7 % (Vorquartal 51,8 %, Vorjahresquartal 55,1 %), Regionen 66,2 / 75,7 / 43,4 / 32,6 %
Die eigenen Anteile werden je Quartal exakt (auf eine Nachkommastelle) kalibriert, die Regionen näherungsweise.
Abb. 3.75 übernimmt diese Daten unverändert (../…nachher_QlikView/daten_marktanteile.py).
Ausgabe: marktanteile.json und marktanteile.csv.
"""
import csv
import json
import math
import os
import random

HIER = os.path.dirname(os.path.abspath(__file__))
NQ = 16
QUARTALE = [f"Q{(2 + i) % 4 + 1} {2023 + (i + 2) // 4}" for i in range(NQ)]        # Q3 2023 … Q2 2027
KATEGORIEN = ["Smartphones", "Tablets", "Wearables"]
UNTERKAT = [["Oberklasse", 0], ["Mittelklasse", 0], ["7 Zoll", 1], ["11 Zoll", 1], ["Smartwatches", 2], ["Fitnessbänder", 2]]
SEGMENTE = ["Privatkunden", "Großunternehmen", "Mittelstand"]
UNTERSEG = [["Haushalte", 0], ["Heimbüro", 0], ["Konzerne", 1], ["Öffentliche Hand", 1], ["Mittlere Betriebe", 2], ["Kleinbetriebe", 2]]
REGIONEN = ["Nordamerika", "Lateinamerika", "EMEA", "Asien-Pazifik"]
ANBIETER = ["Eigenes Unternehmen", "Anbieter A", "Anbieter B", "Anbieter C", "Anbieter D", "Anbieter E", "Übrige"]

# Zielwerte eigener Marktanteil in % (Original: Bulldozer 2012-Q1 … 2013-Q4 aus der Tabelle, davor aus dem Liniendiagramm)
T_ALLE = [24.2, 23.6, 25.5, 25.3, 22.4, 22.8, 23.1, 21.6, 19.7, 18.3, 18.1, 16.1, 16.8, 16.5, 15.7, 15.0]
T_SPP = [44.0, 45.2, 46.1, 47.5, 48.0, 49.3, 50.6, 51.2, 52.4, 53.1, 54.0, 55.1, 54.2, 53.0, 51.8, 58.7]  # Smartphones x Privat
R_ALLE = [17.4, 13.7, 18.5, 12.0]          # Regionen Q2 2027 (AMS, LATAM, EMEA, APAC)
R_SPP = [66.2, 75.7, 43.4, 32.6]
# Wettbewerber (gesamter Markt, %): Firefly → A, Crosstalk → B, Bobtail → C, Highball → D, Underclerk → E
T_WB = [
    [3.8, 4.1, 4.6, 5.0, 5.4, 5.9, 6.3, 6.8, 7.2, 9.7, 11.2, 12.8, 10.8, 13.0, 12.2, 15.2],
    [13.0, 14.5, 16.2, 15.8, 12.4, 13.1, 12.0, 11.2, 10.0, 10.7, 9.6, 11.9, 8.7, 9.6, 9.0, 11.5],
    [10.4, 10.2, 10.5, 10.1, 10.3, 9.9, 10.0, 9.9, 9.8, 9.0, 8.7, 7.9, 8.8, 8.3, 8.1, 6.8],
    [9.0, 9.3, 8.9, 9.1, 9.0, 8.8, 8.9, 8.7, 8.8, 8.4, 8.0, 7.9, 8.2, 7.9, 8.0, 6.7],
    [2.8, 2.6, 2.7, 2.5, 2.4, 2.6, 2.3, 2.4, 2.5, 2.1, 2.7, 2.6, 3.2, 2.7, 3.9, 5.3],
]

rnd = random.Random(374)
SAISON = {1: 0.94, 2: 0.97, 3: 1.00, 4: 1.12}
A_UK = [0.10, 0.15, 0.15, 0.20, 0.22, 0.18]                 # Volumenanteile der Unterkategorien
B_US = [0.30, 0.13, 0.33, 0.17, 0.04, 0.03]                 # Untersegmente (Privat 43 %, Groß 50 %, Mittelstand 7 %)
C_R = [0.22, 0.24, 0.22, 0.32]                               # Regionen (Lateinamerika groß, sonst passen
#                                                             die Regionswerte des Originals nicht zusammen)
M_SPP = [1.64, 1.13, 0.95, 0.50]                               # Privatkunden-Smartphones vor allem in Amerika
BETA = [0.75, 0.45, -0.05, -0.25, -0.35, -0.6]               # Logit-Effekt eigener Anteil je Unterkategorie
GAMMA = [0.45, 0.2, -0.25, -0.15, 0.05, -0.1]                # je Untersegment
spp = lambda uk, us: UNTERKAT[uk][1] == 0 and UNTERSEG[us][1] == 0

# Marktvolumen je Zelle (Tsd. Stück), Basisnoise je Zelle fest, je Quartal leicht schwankend
zellen = [(uk, us, r) for uk in range(6) for us in range(6) for r in range(4)]
basis = {c: rnd.uniform(0.92, 1.08) for c in zellen}
lrausch = {c: rnd.uniform(-0.12, 0.12) for c in zellen}
M = {}
for q in range(NQ):
    vq = 30000 * 1.085 ** (q / 4) * SAISON[int(QUARTALE[q][1])]
    for c in zellen:
        uk, us, r = c
        f = M_SPP[r] if spp(uk, us) else 1.0
        M[q, c] = vq * A_UK[uk] * B_US[us] * C_R[r] * f * basis[c] * rnd.uniform(0.96, 1.04)

sig = lambda x: 1 / (1 + math.exp(-x))
alpha, inter = [0.0] * NQ, [0.0] * NQ
delta, rho = [0.15, -0.05, 0.2, -0.2], [0.3, 0.8, -0.4, -0.8]
lq = {(q, c): rnd.uniform(-0.04, 0.04) for q in range(NQ) for c in zellen}


def anteil(q, c):
    uk, us, r = c
    x = alpha[q] + BETA[uk] + GAMMA[us] + delta[r] + lrausch[c] + lq[q, c]
    if spp(uk, us):
        x += inter[q] + rho[r]
    return sig(x)


def quote(q, sel):
    m = o = 0.0
    for c in zellen:
        if sel(c):
            m += M[q, c]
            o += M[q, c] * anteil(q, c)
    return o / m * 100


def loese(setz, f, ziel, lo=-8.0, hi=8.0):
    for _ in range(40):
        mid = (lo + hi) / 2
        setz(mid)
        if f() < ziel:
            lo = mid
        else:
            hi = mid
    setz((lo + hi) / 2)


alle = lambda c: True
nur_spp = lambda c: spp(c[0], c[1])
for runde in range(14):              # Regionen nur im aktuellen Quartal, Quartalswerte zuletzt (exakt)
    for r in range(4):
        loese(lambda v, r=r: rho.__setitem__(r, v), lambda r=r: quote(NQ - 1, lambda c: c[2] == r and nur_spp(c)), R_SPP[r], -6, 6)
        loese(lambda v, r=r: delta.__setitem__(r, v), lambda r=r: quote(NQ - 1, lambda c: c[2] == r), R_ALLE[r], -6, 6)
    for q in range(NQ):
        loese(lambda v, q=q: inter.__setitem__(q, v), lambda q=q: quote(q, nur_spp), T_SPP[q])
        loese(lambda v, q=q: alpha.__setitem__(q, v), lambda q=q: quote(q, alle), T_ALLE[q])

# Wettbewerber: Startgewichte nach Stärken (Kategorie, Segment, Region), dann iterative Anpassung (IPF) je Quartal,
# sodass Zeilensummen (Restabsatz der Zelle) und Spaltensummen (Zielanteile der Anbieter) stimmen
AFF_K = [[0.6, 1.3, 1.2], [1.4, 0.8, 0.8], [0.8, 1.5, 0.7], [0.6, 0.8, 1.6], [1.0, 1.0, 1.0], [1.0, 1.0, 1.0]]
AFF_S = [[0.7, 1.3, 1.0], [0.8, 1.2, 1.0], [1.1, 0.9, 1.0], [1.2, 0.8, 1.0], [0.7, 1.0, 2.5], [1.0, 1.0, 1.0]]
AFF_R = [[1.2, 0.8, 0.9, 1.1], [0.9, 1.0, 1.2, 1.0], [1.0, 1.2, 1.0, 0.9], [0.9, 0.8, 1.0, 1.2], [0.6, 1.0, 0.9, 1.3],
         [0.8, 1.2, 0.9, 1.1]]
wrausch = {(v, c): rnd.uniform(0.85, 1.15) for v in range(6) for c in zellen}
X = {}
for q in range(NQ):
    rest = {c: M[q, c] * (1 - anteil(q, c)) for c in zellen}
    mq = sum(M[q, c] for c in zellen)
    ziel = [T_WB[v][q] / 100 * mq for v in range(5)]
    ziel.append(sum(rest.values()) - sum(ziel))
    x = {}
    for c in zellen:
        uk, us, r = c
        w = [AFF_K[v][UNTERKAT[uk][1]] * AFF_S[v][UNTERSEG[us][1]] * AFF_R[v][r] * wrausch[v, c] for v in range(6)]
        s = sum(w)
        for v in range(6):
            x[v, c] = rest[c] * w[v] / s
    for _ in range(60):
        for v in range(6):
            f = ziel[v] / sum(x[v, c] for c in zellen)
            for c in zellen:
                x[v, c] *= f
        for c in zellen:
            f = rest[c] / sum(x[v, c] for v in range(6))
            for v in range(6):
                x[v, c] *= f
    for c in zellen:
        X[q, c] = [M[q, c] * anteil(q, c)] + [x[v, c] for v in range(6)]

# Runden auf ganze Tsd. Stück, dann eigene Anteile exakt auf die Zielwerte (eine Nachkommastelle) bringen:
# Stückzahlen zwischen „Eigenes Unternehmen“ und „Übrige“ derselben Zelle verschieben, Marktvolumen bleibt gleich
Z = {k: [round(v) for v in w] for k, w in X.items()}


def ist(q, sel):
    o = m = 0
    for c in zellen:
        if sel(c):
            o += Z[q, c][0]
            m += sum(Z[q, c])
    return o, m


def treffen(q, sel, ziel, kandidaten):
    for _ in range(50):
        o, m = ist(q, sel)
        if round(o / m * 100, 1) == ziel and abs(o / m * 100 - ziel) < 0.04:
            return
        d = round((ziel / 100) * m - o) or (1 if o / m * 100 < ziel else -1)
        c = max(kandidaten, key=lambda c: Z[q, c][6] if d > 0 else Z[q, c][0])
        d = max(-Z[q, c][0] + 1, min(d, Z[q, c][6] - 1))
        Z[q, c][0] += d
        Z[q, c][6] -= d
    raise SystemExit(f"Zielwert nicht erreicht: {QUARTALE[q]} {ziel}")


for q in range(NQ):
    treffen(q, nur_spp, T_SPP[q], [c for c in zellen if nur_spp(c)])
    treffen(q, alle, T_ALLE[q], [c for c in zellen if not nur_spp(c)])

zeilen = [[q, c[0], c[1], c[2], *Z[q, c]] for q in range(NQ) for c in zellen]
json.dump({"quartale": QUARTALE, "kategorien": KATEGORIEN, "unterkat": UNTERKAT, "segmente": SEGMENTE,
           "untersegmente": UNTERSEG, "regionen": REGIONEN, "anbieter": ANBIETER, "zeilen": zeilen},
          open(os.path.join(HIER, "marktanteile.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
with open(os.path.join(HIER, "marktanteile.csv"), "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh, delimiter=";", lineterminator="\r\n")
    w.writerow(["Quartal", "Kategorie", "Unterkategorie", "Segment", "Untersegment", "Region"] +
               ["Absatz_Tsd_Stueck_" + a.replace(" ", "_").replace("Ü", "Ue") for a in ANBIETER])
    for q, uk, us, r, *u in zeilen:
        w.writerow([QUARTALE[q], KATEGORIEN[UNTERKAT[uk][1]], UNTERKAT[uk][0], SEGMENTE[UNTERSEG[us][1]], UNTERSEG[us][0],
                    REGIONEN[r]] + u)

# Kontrollausgabe
pz = lambda o, m: f"{o / m * 100:5.1f}"
print("Quartal   Markt    eigen  SPxP  | Anbieter A–E, Übrige (gesamter Markt, %)")
for q in range(NQ):
    tot = [sum(Z[q, c][v] for c in zellen) for v in range(7)]
    o, m = ist(q, nur_spp)
    print(f"{QUARTALE[q]}  {sum(tot):6d}  {pz(tot[0], sum(tot))}  {pz(o, m)}  |",
          " ".join(pz(t, sum(tot)) for t in tot[1:]))
q = NQ - 1
print("Regionen Q2 2027 gesamt:", [pz(*ist(q, lambda c, r=r: c[2] == r)) for r in range(4)],
      " SPxP:", [pz(*ist(q, lambda c, r=r: c[2] == r and nur_spp(c))) for r in range(4)])
print("Kategorien Q2 2027:", [pz(*ist(q, lambda c, k=k: UNTERKAT[c[0]][1] == k)) for k in range(3)],
      " Segmente:", [pz(*ist(q, lambda c, s=s: UNTERSEG[c[1]][1] == s)) for s in range(3)])
print("Volumenanteil SPxP:", pz(*[sum(sum(Z[q, c]) for c in zellen if nur_spp(c)), sum(sum(Z[q, c]) for c in zellen)]))
print("min. Zellwert:", min(min(z[4:]) for z in zeilen), " Zeilen:", len(zeilen))
