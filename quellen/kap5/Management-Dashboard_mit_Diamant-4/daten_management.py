"""Daten für Abb. 5.54 „Management-Dashboard“ einer sozialen Einrichtung (stationäre Pflege, drei Häuser).

Einzelsätze: Monatswerte je Haus und BWA-Position (Ist und Plan in Cent, Januar bis Juni 2027), Belegungs- und
Abwesenheitstage je Haus und Monat (Ist und Plan), Personaldaten je Haus und Monat (Januar 2026 bis Juni 2027:
Vollkräfte Fach- und Assistenzkräfte, Köpfe, Teilzeitköpfe, Soll-, Krankheits- und Überstunden) sowie der
Auslastungsgrad der Vergleichsgruppe. Alle Kennzahlen rechnet das Dashboard daraus.

Anker aus dem Original (BWA „Ist | März | kum.“): alle Ist-Werte der sichtbaren BWA-Zeilen centgenau, z. B.
Gesamterlöse 15.007.921,41 €, Personalkosten 10.122.169,64 €; Betriebsergebnis 1.756.891,00 € wie die Kachel des
Originals (dafür die Zeile „Sonstige Erträge“ 20.888,28 €, im Original unterhalb des Bildlaufs); Planwerte für
Wasser/Energie (297.838,39 €) und Abschreibungen (31.250,00 €) wie im Original, übrige Planwerte neu (das Original
zeigte für März kumuliert einen Plan von 28,1 Mio. € Erlösen – vermutlich ein Halbjahresplan). Teilzeitquote 52 %.
Geschichte: Haus Fliederhof ist schlechter belegt als geplant und hat die höchste Krankheitsquote; die Personal-
kosten liegen über Plan, das Betriebsergebnis rund 19 % unter Plan.
Ausgabe: management.json und management.csv.
"""
import csv
import json
import os
import random

HIER = os.path.dirname(os.path.abspath(__file__))
SEED = 554
rnd = random.Random(SEED)

MONATE = ["2027-01", "2027-02", "2027-03", "2027-04", "2027-05", "2027-06"]
TAGE = [31, 28, 31, 30, 31, 30]
# Kürzel, Name, Plätze, Pflegesatz-Gewicht
HAEUSER = [["BH", "Haus Birkenhof", 420, 166.0], ["FH", "Haus Fliederhof", 360, 162.0], ["MH", "Haus Mühlenhof", 300, 165.0]]
AUSL_IST = [[95.6, 96.1, 95.7, 96.0, 96.3, 96.2], [91.2, 90.1, 90.5, 91.8, 92.9, 93.6], [94.0, 94.5, 94.1, 94.6, 94.9, 95.1]]
AUSL_PLAN = [96.0, 95.0, 95.0]
VERGLEICH = [93.4, 93.1, 93.6, 93.8, 94.0, 94.1]          # Auslastungsgrad der Vergleichsgruppe, %

# Schlüssel, Bezeichnung, Gruppe, Richtung (+1 Anstieg günstig), Ist Jan–Mär (Cent, Original), Plan Jan–Mär (Cent)
POS = [
    ["pfl", "Allgemeine Pflegeleistungen", "erl", 1, 1500139032, 1518000000],
    ["uv", "Unterkunft und Verpflegung", "erl", 1, 653109, 600000],
    ["sach", "Sachbedarf", "gk", -1, 212588517, 204000000],
    ["ener", "Wasser, Energie, Brennstoffe", "gk", -1, 29708427, 29783839],
    ["verw", "Wirtschafts-/Verwaltungsbedarf", "gk", -1, 11620461, 11200000],
    ["pers", "Personalkosten", "", -1, 1012216964, 998000000],
    ["leb", "Lebensmittel", "vek", -1, 41955900, 42500000],
    ["steu", "Steuern, Abgaben, Versicherungen", "vek", -1, 14394466, 14600000],
    ["afa", "Abschreibungen", "vek", -1, 4707134, 3125000],
    ["soe", "Sonstige Erträge", "", 1, 2088828, 1500000],
]
ENERGIE = [1.12, 1.08, 1.0, 0.9, 0.82, 0.78]


def verteilen(roh, ziel):
    """Rohwerte (Liste) auf eine Ganzzahlsumme ziel skalieren, Rest nach größtem Nachkommaanteil."""
    s = sum(roh)
    x = [r * ziel / s for r in roh]
    g = [int(v // 1) for v in x]
    rest = ziel - sum(g)
    for i in sorted(range(len(x)), key=lambda i: x[i] - g[i], reverse=True)[:rest]:
        g[i] += 1
    return g


# ---------- Belegung ----------
bt_ist = [[round(h[2] * TAGE[m] * AUSL_IST[i][m] / 100) for m in range(6)] for i, h in enumerate(HAEUSER)]
bt_plan = [[round(h[2] * TAGE[m] * AUSL_PLAN[i] / 100) for m in range(6)] for i, h in enumerate(HAEUSER)]
abw_ist = [[round(bt_ist[i][m] * rnd.uniform(0.013, 0.019)) for m in range(6)] for i in range(3)]
abw_plan = [[round(bt_plan[i][m] * 0.015) for m in range(6)] for i in range(3)]


# ---------- BWA: Rohwerte je Haus und Monat ----------
def roh(key, plan):
    bt = bt_plan if plan else bt_ist
    out = []
    for i, h in enumerate(HAEUSER):
        z = []
        for m in range(6):
            n = 1.0 if plan else rnd.uniform(0.97, 1.03)
            if key == "pfl":
                v = bt[i][m] * h[3]
            elif key == "uv":
                v = 2000 * h[2] / 360 * (1.0 if plan else rnd.uniform(0.6, 1.5))
            elif key == "sach":
                v = bt[i][m] * (22.0 if plan else 23.4 + (0.8 if i == 1 else 0)) * n
            elif key == "ener":
                v = h[2] * TAGE[m] * ENERGIE[m] * n
            elif key == "verw":
                v = h[2] * TAGE[m] * n
            elif key == "pers":
                v = h[2] * (1.0 if plan else (1.035 if i == 1 else 1.0) * (1 + 0.004 * m)) * n
            elif key == "leb":
                v = bt[i][m] * 4.6 * n
            elif key == "steu":
                v = h[2] * n
            elif key == "afa":
                v = h[2] * (1.0 if plan else (1.0 if m < 1 else 1.12))
            else:                                       # sonstige Erträge
                v = h[2] * (1.0 if plan else rnd.uniform(0.4, 1.6))
            z.append(v)
        out.append(z)
    return out


bwa = []                                                 # [haus, monat, pos, ist_cent, plan_cent]
werte = {}
for pi, (key, name, gr, ri, ist_q1, plan_q1) in enumerate(POS):
    erg = {}
    for art, ziel in (("ist", ist_q1), ("plan", plan_q1)):
        r = roh(key, art == "plan")
        q1 = [r[i][m] for i in range(3) for m in range(3)]
        g = verteilen(q1, ziel)
        f = ziel / sum(q1)
        tab = [[0] * 6 for _ in range(3)]
        for k, (i, m) in enumerate((i, m) for i in range(3) for m in range(3)):
            tab[i][m] = g[k]
        for i in range(3):
            for m in range(3, 6):
                tab[i][m] = round(r[i][m] * f)
        erg[art] = tab
    werte[key] = erg
    for i in range(3):
        for m in range(6):
            bwa.append([i, m, pi, erg["ist"][i][m], erg["plan"][i][m]])

# ---------- Personal ----------
P_MONATE = [f"2026-{m:02d}" for m in range(1, 13)] + MONATE
KQ_BASIS = [7.6, 8.1, 7.6, 6.5, 5.8, 5.5, 5.3, 5.5, 6.0, 6.8, 7.3, 7.5, 7.9, 8.6, 8.2, 6.9, 6.1, 5.8]
VK = [286.0, 245.0, 204.0]
FQ = [0.485, 0.432, 0.47]
TZ = [0.497, 0.553, 0.512]
KQ_OFF = [-0.5, 1.2, -0.3]
personal = []                                            # [haus, monat, vk_fach, vk_ass, vk_ges, koepfe, teilzeit, soll_h, krank_h, ueber_h]
for i in range(3):
    for mi in range(len(P_MONATE)):
        vj = mi < 12
        vk = round(VK[i] * (1 + 0.003 * (mi - 14)) * rnd.uniform(0.995, 1.005), 1)
        pflege = vk * 0.6
        fq = FQ[i] - (0.008 if vj else 0) + rnd.uniform(-0.003, 0.003)
        fach = round(pflege * fq, 1)
        ass = round(pflege - fach, 1)
        koepfe = round(vk / 0.8)
        tz = round(koepfe * (TZ[i] - (0.016 if vj else 0) + rnd.uniform(-0.002, 0.002)))
        soll = round(vk * 164)
        kq = max(3.0, KQ_BASIS[mi] + KQ_OFF[i] + rnd.uniform(-0.25, 0.25))
        uq = max(0.8, 1.6 + 0.42 * (kq - 5) + (0.5 if i == 1 else 0) + rnd.uniform(-0.2, 0.2))
        personal.append([i, mi, fach, ass, vk, koepfe, tz, soll, round(soll * kq / 100), round(soll * uq / 100)])

# Teilzeitquote März 2027 gesamt genau 52 % (Original): Teilzeitköpfe im größten Haus nachführen
mz = P_MONATE.index("2027-03")
zeilen_mz = [p for p in personal if p[1] == mz]
ko = sum(p[5] for p in zeilen_mz)
soll_tz = round(ko * 0.52)
zeilen_mz[0][6] += soll_tz - sum(p[6] for p in zeilen_mz)

daten = {
    "monate": MONATE, "tage": TAGE, "haeuser": [h[:3] for h in HAEUSER],
    "positionen": [p[:4] for p in POS], "bwa": bwa,
    "belegung": [[i, m, HAEUSER[i][2] * TAGE[m], bt_ist[i][m], bt_plan[i][m], abw_ist[i][m], abw_plan[i][m]]
                 for i in range(3) for m in range(6)],
    "vergleich": VERGLEICH, "personal_monate": P_MONATE, "personal": personal, "fk_soll": 0.5,
}
json.dump(daten, open(os.path.join(HIER, "management.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))

# ---------- CSV (Langformat, alle Einzelsätze) ----------
de = lambda c: ("-" if c < 0 else "") + f"{abs(c) // 100},{abs(c) % 100:02d}"
with open(os.path.join(HIER, "management.csv"), "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh, delimiter=";", lineterminator="\r\n")
    w.writerow(["Bereich", "Monat", "Haus", "Kennzahl", "Ist", "Plan"])
    for i, m, pi, ist, plan in bwa:
        w.writerow(["BWA (EUR)", MONATE[m], HAEUSER[i][1], POS[pi][1], de(ist), de(plan)])
    for i, m, kap, bi, bp, ai, ap in daten["belegung"]:
        w.writerow(["Belegung (Tage)", MONATE[m], HAEUSER[i][1], "Platztage", kap, kap])
        w.writerow(["Belegung (Tage)", MONATE[m], HAEUSER[i][1], "Belegungstage", bi, bp])
        w.writerow(["Belegung (Tage)", MONATE[m], HAEUSER[i][1], "Abwesenheitstage", ai, ap])
    for m, v in enumerate(VERGLEICH):
        w.writerow(["Belegung (%)", MONATE[m], "Vergleichsgruppe", "Auslastungsgrad", str(v).replace(".", ","), ""])
    namen = ["Vollkräfte Fachkräfte Pflege", "Vollkräfte Assistenzkräfte Pflege", "Vollkräfte gesamt", "Köpfe",
             "Köpfe Teilzeit", "Sollstunden", "Krankheitsstunden", "Überstunden"]
    for p in personal:
        for k, n in enumerate(namen):
            w.writerow(["Personal", P_MONATE[p[1]], HAEUSER[p[0]][1], n, str(p[2 + k]).replace(".", ","), ""])

# ---------- Kontrollausgabe ----------
def summe(key, art, ms, haus=None):
    return sum(werte[key][art][i][m] for i in range(3) for m in ms if haus is None or i == haus)


for bis in (2, 5):
    ms = range(bis + 1)
    print(f"--- {MONATE[bis]} kumuliert (Euro) ---")
    for art in ("ist", "plan"):
        s = {k: summe(k, art, ms) for k in werte}
        erl = s["pfl"] + s["uv"]
        gk = s["sach"] + s["ener"] + s["verw"]
        vek = s["leb"] + s["steu"] + s["afa"]
        be = erl - gk - s["pers"] - vek + s["soe"]
        bt = sum((bt_ist if art == "ist" else bt_plan)[i][m] for i in range(3) for m in ms)
        print(f"{art:4s}: Erlöse {erl / 100:15,.2f}  GK {gk / 100:13,.2f}  ZE {(erl - gk) / 100:15,.2f}  Personal {s['pers'] / 100:15,.2f}"
              f"  VEK {vek / 100:13,.2f}  BE {be / 100:13,.2f}  BT {bt:6d}  BE/BT {be / 100 / bt:6.2f}")
for m in (mz, mz - 12):
    z = [p for p in personal if p[1] == m]
    print(f"Personal {P_MONATE[m]}: Teilzeitquote {sum(p[6] for p in z) / sum(p[5] for p in z) * 100:.1f} %  "
          f"Fachkraftquote {sum(p[2] for p in z) / sum(p[2] + p[3] for p in z) * 100:.1f} %  "
          f"Krankheitsquote {sum(p[8] for p in z) / sum(p[7] for p in z) * 100:.1f} %  "
          f"Überstundenquote {sum(p[9] for p in z) / sum(p[7] for p in z) * 100:.1f} %")
for i, h in enumerate(HAEUSER):
    kap = sum(h[2] * TAGE[m] for m in range(3))
    print(f"{h[1]}: Auslastung Jan–Mär Ist {sum(bt_ist[i][:3]) / kap * 100:.1f} %  Plan {sum(bt_plan[i][:3]) / kap * 100:.1f} %")
