"""Daten für Abb. 3.76/3.77 „Dynamische Vollkräfte-Statistik – vorher/nachher“.

Personalstatistik eines Krankenhauses mit zwei Standorten (Ost, Süd-West), Monate Januar 2017 bis Dezember 2029:
Ist bis Juni 2027 (aktueller Monat), danach Plan (Stellenplan). Je Monat und Kombination aus Kostenstelle und Dienstart
Köpfe in Vollzeit, Köpfe in Teilzeit und Vollkräfte (VK) der Teilzeitkräfte; eine Vollzeitkraft zählt 1,0 VK.
Planmonate enthalten nur VK. Die Kostenstellen gehören zu Planungseinheiten und Standorten.

Werte des Originals (Juni 2020 → hier Juni 2027): ∑ Vollkräfte 1.884, Teilzeitquote nach Köpfen 50,3 %, nach VK
34,6 %; nach der Selektion (Abb. 3.77, hier als Standort Ost nachgebildet) 1.697 VK und 51,4 % nach Köpfen.
Verlauf wie im Original: stetiger Aufbau, Höchststand im Januar, danach Rückgang; Plan sinkt bis Ende 2029.
Abb. 3.77 übernimmt diese Daten unverändert (../Dynamische_Vollkraefte-Statistik_mit_HEARTBEAT_-_nachher/).
Ausgabe: vollkraefte.json und vollkraefte.csv.
"""
import csv
import json
import os
import random

HIER = os.path.dirname(os.path.abspath(__file__))
NM, AKT = 156, 125                                   # Januar 2017 … Dezember 2029, aktueller Monat Juni 2027
MONATE = [f"{2017 + m // 12}-{m % 12 + 1:02d}" for m in range(NM)]
STANDORTE = ["Ost", "Süd-West"]
PE = ["Anästhesie und Intensivmedizin", "Chirurgie", "Innere Medizin", "Frauenklinik", "Neurologie",
      "Zentrale Notaufnahme", "Medizinische Funktionsbereiche", "Verwaltung und Service"]
DA = ["Ärztlicher Dienst", "Pflegedienst", "Medizinisch-technischer Dienst", "Funktionsdienst",
      "Wirtschafts- und Versorgungsdienst", "Verwaltungsdienst", "Sonstiges Personal"]      # Reihenfolge nach KHBV
KST = [["Anästhesie Ost", 0, 0], ["Intensivstation Ost", 0, 0], ["Chirurgie Ost", 1, 0], ["Chirurgische Stationen Ost", 1, 0],
       ["Zentral-OP Ost", 1, 0], ["Innere Medizin Ost", 2, 0], ["Internistische Stationen Ost", 2, 0], ["Endoskopie Ost", 2, 0],
       ["Frauenklinik Ost", 3, 0], ["Neurologie Ost", 4, 0], ["Neurophysiologie Ost", 4, 0], ["Notaufnahme Ost", 5, 0],
       ["Patientenaufnahme Ost", 5, 0], ["Radiologie Ost", 6, 0], ["Labor Ost", 6, 0], ["Apotheke Ost", 6, 0],
       ["Verwaltung Ost", 7, 0], ["Technik und Versorgung Ost", 7, 0], ["Bildungszentrum Ost", 7, 0],
       ["Anästhesie Süd-West", 0, 1], ["Innere Medizin Süd-West", 2, 1], ["Atemtherapie Süd-West", 6, 1],
       ["Verwaltung Süd-West", 7, 1]]
# Kostenstelle, Dienstart, VK im Juni 2027, erster Monat (Süd-West: Innere Medizin ab 2020, Atemtherapie ab 2023)
KOMBI = [(0, 0, 48, 0), (0, 3, 52, 0), (1, 1, 98, 0), (2, 0, 72, 0), (3, 1, 172, 0), (4, 3, 76, 0), (5, 0, 88, 0),
         (6, 1, 228, 0), (7, 3, 34, 0), (8, 0, 30, 0), (8, 1, 92, 0), (9, 0, 24, 0), (9, 1, 66, 0), (10, 2, 8, 0),
         (11, 0, 22, 0), (11, 1, 52, 0), (12, 5, 10, 0), (13, 0, 12, 0), (13, 2, 70, 0), (14, 2, 62, 0), (15, 2, 40, 0),
         (16, 5, 120, 0), (17, 4, 105, 0), (18, 6, 116, 0),
         (19, 0, 10, 0), (19, 3, 16, 0), (20, 0, 16, 36), (20, 1, 62, 36), (21, 2, 28, 72), (22, 5, 14, 0), (22, 4, 25, 0),
         (22, 6, 16, 0)]
WACHSTUM = [1.0, 1.25, 0.85, 1.0, 0.6, 0.7, 1.1]                    # Exponent je Dienstart (Pflege wächst am stärksten)
TZ = [(0.28, 0.62), (0.62, 0.55), (0.60, 0.52), (0.52, 0.55), (0.55, 0.48), (0.58, 0.50), (0.35, 0.45)]  # Teilzeitanteil Köpfe, Ø VK je Teilzeitkraft


def kurve(anker):
    """Stückweise linear zwischen Ankerpunkten {Monat: Wert}."""
    ks = sorted(anker)
    out = []
    for m in range(ks[0], ks[-1] + 1):
        a = max(k for k in ks if k <= m)
        b = min(k for k in ks if k >= m)
        out.append(anker[a] if a == b else anker[a] + (anker[b] - anker[a]) * (m - a) / (b - a))
    return out


rnd = random.Random(376)
GESAMT = kurve({0: 1180, 11: 1236, 23: 1302, 35: 1388, 47: 1476, 59: 1560, 71: 1642, 83: 1721, 95: 1790, 107: 1866,
                113: 1904, 119: 1942, 120: 1959, 125: 1884.0, 126: 1878, 131: 1842, 143: 1790, 155: 1745})
SUEDWEST = kurve({0: 42, 35: 47, 36: 98, 71: 112, 72: 158, 119: 183, 125: 187.0, 155: 192})
FEST = {113, 119, 120, 125}
GESAMT = [g if m in FEST else g * (1 + rnd.gauss(0, 0.0015)) for m, g in enumerate(GESAMT)]
SITE = [[g - s for g, s in zip(GESAMT, SUEDWEST)], SUEDWEST]

# VK je Kombination: Basis × (Standortverlauf)^Wachstum × Rauschen, je Standort und Monat auf die Summe normiert
n = len(KOMBI)
gexp = [WACHSTUM[da] + rnd.uniform(-0.1, 0.1) for _, da, _, _ in KOMBI]
rausch = []
for i in range(n):
    e, r = 0.0, []
    for m in range(NM):
        e = 0.7 * e + rnd.gauss(0, 0.004)
        r.append(e)
    rausch.append(r)
VK = [[0.0] * NM for _ in range(n)]
for m in range(NM):
    for st in range(2):
        idx = [i for i, (k, _, _, s0) in enumerate(KOMBI) if KST[k][2] == st and m >= s0]
        rel = SITE[st][m] / SITE[st][AKT]
        roh = {}
        for i in idx:
            k, da, basis, _ = KOMBI[i]
            g = gexp[i] if m <= AKT else 2 - gexp[i]                 # im Plan schrumpft die Pflege am wenigsten
            saison = 1.0
            if da == 6 and m <= AKT:
                saison = 1.05 if m % 12 >= 8 else 0.97 if m % 12 in (6, 7) else 1.0   # Ausbildungsbeginn im September
            roh[i] = basis * rel ** g * (1 + rausch[i][m]) * saison
        s = sum(roh.values())
        for i in idx:
            VK[i][m] = round(roh[i] * SITE[st][m] / s, 2)


def koepfe(i, m, kp, kf):
    """Köpfe Vollzeit, Köpfe Teilzeit, VK Teilzeit (stetig) für eine Kombination im Ist-Monat m."""
    p0, f0 = TZ[KOMBI[i][1]]
    p = min(0.9, (p0 + pz[i]) * kp - 0.0004 * (AKT - m))
    f = min(0.8, f0 * kf)
    v = VK[i][m]
    nk = v / (1 - p + p * f)
    return nk * (1 - p), nk * p, v - nk * (1 - p)


pz = [rnd.uniform(-0.03, 0.03) for _ in range(n)]
KP, KF = [1.0, 1.0], [1.0, 1.0]
ist_st = lambda i: KST[KOMBI[i][0]][2]


def quoten(m, sel=lambda i: True):
    vz = tz = tv = 0.0
    for i in range(n):
        if sel(i) and VK[i][m] > 0:
            a, b, c = koepfe(i, m, KP[ist_st(i)], KF[ist_st(i)])
            vz, tz, tv = vz + a, tz + b, tv + c
    return tz / (vz + tz), tv / (vz + tv)


def bisekt(setz, f, ziel, lo, hi):
    for _ in range(50):
        mid = (lo + hi) / 2
        setz(mid)
        if f() < ziel:
            lo = mid
        else:
            hi = mid
    setz((lo + hi) / 2)


# Kalibrierung im aktuellen Monat: Süd-West mit Ø 0,62 VK je Teilzeitkraft; Ost auf 51,4 % Teilzeitquote nach Köpfen,
# Gesamt auf 50,3 % nach Köpfen und 34,6 % nach VK
sw = lambda i: ist_st(i) == 1
bisekt(lambda v: KF.__setitem__(1, v), lambda: sum(koepfe(i, AKT, KP[1], KF[1])[2] for i in range(n) if sw(i)) /
       sum(koepfe(i, AKT, KP[1], KF[1])[1] for i in range(n) if sw(i)), 0.62, 0.5, 2.0)
for _ in range(30):
    bisekt(lambda v: KP.__setitem__(0, v), lambda: quoten(AKT, lambda i: not sw(i))[0], 0.514, 0.5, 1.5)
    bisekt(lambda v: KF.__setitem__(0, v), lambda: quoten(AKT)[1], 0.346, 0.5, 1.5)
    bisekt(lambda v: KP.__setitem__(1, v), lambda: quoten(AKT)[0], 0.503, 0.3, 1.5)

# Runden: ganze Köpfe, VK Teilzeit = VK − Köpfe Vollzeit (zwei Nachkommastellen)
R = [[None] * (AKT + 1) for _ in range(n)]
for i in range(n):
    for m in range(AKT + 1):
        v = VK[i][m]
        if v <= 0:
            R[i][m] = [0, 0, 0]
            continue
        a, b, _ = koepfe(i, m, KP[ist_st(i)], KF[ist_st(i)])
        vz = min(round(a), int(v))
        tv = round((v - vz) * 100)
        tz = max(1 if tv > 0 else 0, round(b))
        if tv > 0 and tv / tz > 90:
            tz = -(-tv // 85)
        R[i][m] = [vz, tz, tv]


def summen(m, sel=lambda i: True):
    vz = sum(R[i][m][0] for i in range(n) if sel(i))
    tz = sum(R[i][m][1] for i in range(n) if sel(i))
    tv = sum(R[i][m][2] for i in range(n) if sel(i)) / 100
    return vz, tz, tv


def treffer():
    vz, tz, tv = summen(AKT)
    vo, to_, tvo = summen(AKT, lambda i: not sw(i))
    return (round(tz / (vz + tz) * 100, 1) == 50.3 and round(tv / (vz + tv) * 100, 1) == 34.6 and
            round(to_ / (vo + to_) * 100, 1) == 51.4)


# Feinabgleich auf eine Nachkommastelle: Köpfe der größten Pflege-Kostenstelle je Standort verschieben
c1 = max((i for i in range(n) if not sw(i)), key=lambda i: VK[i][AKT])
c2 = max((i for i in range(n) if sw(i)), key=lambda i: VK[i][AKT])
basis1, basis2 = list(R[c1][AKT]), list(R[c2][AKT])
gefunden = treffer()
for d1 in range(-4, 5):
    for t1 in range(-8, 9):
        for t2 in range(-6, 7):
            if gefunden:
                break
            vz = basis1[0] + d1
            R[c1][AKT] = [vz, basis1[1] + t1, round((VK[c1][AKT] - vz) * 100)]
            R[c2][AKT] = [basis2[0], basis2[1] + t2, basis2[2]]
            gefunden = treffer()
if not gefunden:
    raise SystemExit("Teilzeitquoten nicht getroffen")

PLAN = [[round(VK[i][m] * 100) for m in range(AKT + 1, NM)] for i in range(n)]
kombis = [[k, da, [r[0] for r in R[i]], [r[1] for r in R[i]], [r[2] for r in R[i]], PLAN[i]]
          for i, (k, da, _, _) in enumerate(KOMBI)]
json.dump({"monate": MONATE, "aktuell": AKT, "standorte": STANDORTE, "planungseinheiten": PE, "kostenstellen": KST,
           "dienstarten": DA, "kombis": kombis},
          open(os.path.join(HIER, "vollkraefte.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
with open(os.path.join(HIER, "vollkraefte.csv"), "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh, delimiter=";", lineterminator="\r\n")
    w.writerow(["Monat", "Szenario", "Standort", "Planungseinheit", "Kostenstelle", "Dienstart", "Koepfe_Vollzeit",
                "Koepfe_Teilzeit", "VK_Teilzeit", "VK"])
    dez = lambda c: f"{c // 100},{c % 100:02d}"
    for k, da, vz, tz, tv, pl in kombis:
        name, pe, st = KST[k]
        for m in range(NM):
            if m <= AKT:
                if vz[m] + tz[m] == 0:
                    continue
                w.writerow([MONATE[m], "Ist", STANDORTE[st], PE[pe], name, DA[da], vz[m], tz[m], dez(tv[m]), dez(vz[m] * 100 + tv[m])])
            else:
                w.writerow([MONATE[m], "Plan", STANDORTE[st], PE[pe], name, DA[da], "", "", "", dez(pl[m - AKT - 1])])

# Kontrollausgabe
def kennz(m, sel=lambda i: True):
    vz, tz, tv = summen(m, sel)
    return f"VK {vz + tv:8.2f}  Köpfe {vz + tz:5d}  TZ-Quote Köpfe {tz / (vz + tz) * 100:4.1f} %  nach VK {tv / (vz + tv) * 100:4.1f} %"


ost = lambda i: not sw(i)
print("Juni 2027 gesamt:", kennz(AKT))
print("Juni 2027 Ost:   ", kennz(AKT, ost))
print("Juni 2027 S-W:   ", kennz(AKT, sw))
print("Juni 2026 gesamt:", kennz(AKT - 12))
print("Juni 2026 Ost:   ", kennz(AKT - 12, ost))
vk = [sum(summen(m)[0] + summen(m)[2] for _ in [0]) for m in range(AKT + 1)]
mx = max(range(AKT + 1), key=lambda m: vk[m])
print(f"Januar 2017 {vk[0]:.1f} VK, Höchststand {MONATE[mx]} {vk[mx]:.1f} VK, Plan Dez 2029 {sum(p[-1] for p in PLAN) / 100:.1f} VK")
for m in (58, 103, AKT):
    print(MONATE[m], "Ost je Planungseinheit:",
          " ".join(f"{sum(R[i][m][0] + R[i][m][2] / 100 for i in range(n) if ost(i) and KST[KOMBI[i][0]][1] == p):.1f}" for p in range(len(PE))))
print("Kombinationen:", n)
