"""Daten für Abb. 5.70 „Bandbreitenplanung – Eingabeparameter“ und Abb. 5.71 „Bandbreitenplanung – Ergebnisse“.

Ein Datensatz für beide Abbildungen (Abb. 5.71 führt diesen Generator per runpy aus und übernimmt seine Ausgabe).
Erfolgsplanung 2027 je Business Unit, Region, Produktgruppe und Kundengruppe mit Plan (Jan–Dez) und Ist (Jan–Jun,
Stichtag 30.06.2027) für die 13 Positionen der stufenweisen Deckungsbeitragsrechnung des Originals.
Prämissen (Dreipunktschätzung Min / Wahrscheinlich / Max je Monat) für die drei Treiber des Originals:
Verkaufspreise (VKP), Einkaufspreise (EKP), Tarifsteigerung der Fertigungslöhne. Business Unit „Antriebe“ trägt die
Werte des Originals: Prämissen exakt (Worst/Mittel/Best → Min/Wahrscheinlich/Max nach Wirkung), Plan Jan–Jun wie die
Spalte PLAN (Nettoumsatz 140 … DB Business Unit 20; Einheit fehlte im Original, angenommen Mio. €), Ist-DB je Monat
aus dem Säulendiagramm abgelesen. Die beiden übrigen Business Units sind erfunden.
Rechenlogik (in den Dashboards): Plan = Szenario „Wahrscheinlich“; Szenariowert = Plan × (1 + p) / (1 + p_wahrsch.)
für die Positionen des Treibers (VKP: Nettoumsatz, Skonti, Boni; EKP: Material, Fremdleistungen; Tarif: variable
Fertigungskosten), alle übrigen Positionen bleiben auf Plan.
Grain: Zelle (BU x Region x Produktgruppe x Kundengruppe) x Monat x Position, Werte in Tsd. € (ganzzahlig).
Ausgabe: bandbreiten.json und bandbreiten.csv.
"""
import csv
import json
import os
import random

HIER = os.path.dirname(os.path.abspath(__file__))
JAHR, STICHTAG = 2027, 6
MONATE = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"]
BU = ["Antriebe", "Steuerungen", "Sensoren"]
REGIONEN = ["Inland", "Ausland"]
PG = ["Standard", "Premium", "Ersatzteile"]
KG = ["Industrie", "Handel"]
# Position: Schlüssel, Name, Vorzeichen im Ergebnis, Treiber
POS = [("nu", "Nettoumsatz", 1, "vkp"), ("bv", "Bestandsveränderung", 1, None),
       ("sk", "Skonti", -1, "vkp"), ("bo", "Boni", -1, "vkp"), ("fr", "Ausgangsfrachten", -1, None),
       ("ma", "Materialkosten", -1, "ekp"), ("fl", "Fremdleistungen", -1, "ekp"),
       ("fk", "Variable Fertigungskosten", -1, "tarif"),
       ("mgk", "Materialgemeinkosten", -1, None), ("fgk", "Fertigungsgemeinkosten", -1, None),
       ("vwgk", "Verwaltungsgemeinkosten", -1, None), ("vtgk", "Vertriebsgemeinkosten", -1, None),
       ("bugk", "BU-Gemeinkosten", -1, None)]
KEYS = [p[0] for p in POS]
# Treiber: Schlüssel, Name, Richtung (+1 = Anstieg günstig, −1 = Anstieg ungünstig)
TREIBER = [("vkp", "Verkaufspreise", 1), ("ekp", "Einkaufspreise", -1), ("tarif", "Fertigungslöhne", -1)]

# Plan Jan–Jun je Business Unit in Mio. € (Antriebe = Spalte PLAN des Originals)
H1 = {
    "Antriebe":    dict(nu=140, bv=2, sk=4, bo=14, fr=5, ma=35, fl=22, fk=22, mgk=3, fgk=10, vwgk=2, vtgk=5, bugk=0),
    "Steuerungen": dict(nu=96, bv=1, sk=2.4, bo=7.2, fr=2, ma=30, fl=8, fk=14, mgk=2.4, fgk=7, vwgk=1.6, vtgk=3.4, bugk=1),
    "Sensoren":    dict(nu=64, bv=0.5, sk=1.3, bo=3.8, fr=1.2, ma=14, fl=6, fk=12, mgk=1.5, fgk=8.5, vwgk=1.2, vtgk=2.8, bugk=0.8),
}
# Prämissen je Monat in %: [Min, Wahrscheinlich, Max]
TARIF = [[0.0] * 12, [0.0] * 6 + [2.0] * 6, [0.0] * 6 + [6.0] * 6]          # Tarifabschluss ab Juli, alle BU
PRAEM = {
    "Antriebe": {
        "vkp": [[-5.0] * 12, [0.0] * 12, [5.0] * 12],
        "ekp": [[-0.5 * (m + 1) for m in range(12)], [0.0] * 12, [5.0 + m for m in range(12)]],
        "tarif": TARIF},
    "Steuerungen": {
        "vkp": [[-3.0] * 12, [0.0] * 12, [4.0] * 12],
        "ekp": [[-2.0] * 12, [1.0] * 12, [8.0] * 12],
        "tarif": TARIF},
    "Sensoren": {
        "vkp": [[-6.0] * 12, [-1.0] * 12, [3.0] * 12],
        "ekp": [[round(-1.0 - 0.2 * m, 1) for m in range(12)], [0.0] * 12, [4.0 + 0.5 * m for m in range(12)]],
        "tarif": TARIF},
}
# Ist-DB Business Unit „Antriebe“ Jan–Jun in Tsd. € (aus dem Original abgelesen)
IST_DB_ANTRIEBE = [3150, 2680, 3520, 4030, 3630, 2850]

ANT_R, ANT_P, ANT_K = [0.6, 0.4], [0.5, 0.3, 0.2], [0.65, 0.35]
FAKTOR = {                       # Struktur der Positionen je Zelle (Region, Produktgruppe, Kundengruppe)
    "bv": lambda r, p, k: [1.2, 1.0, 0.4][p],
    "sk": lambda r, p, k: [0.85, 1.3][k],
    "bo": lambda r, p, k: [0.45, 2.0][k],
    "fr": lambda r, p, k: [0.6, 1.6][r],
    "ma": lambda r, p, k: [1.15, 0.85, 0.8][p],
    "fl": lambda r, p, k: [0.9, 1.3, 0.8][p],
    "fk": lambda r, p, k: [1.0, 1.2, 0.7][p],
    "mgk": lambda r, p, k: [1.15, 0.85, 0.8][p],
    "fgk": lambda r, p, k: [1.0, 1.2, 0.7][p],
    "vtgk": lambda r, p, k: [0.9, 1.15][r],
}
SIGMA_IST = dict(nu=0.03, bv=0.4, sk=0.05, bo=0.05, fr=0.08, ma=0.05, fl=0.08, fk=0.04, mgk=0.05, fgk=0.04,
                 vwgk=0.06, vtgk=0.06, bugk=0.1)

rnd = random.Random(5070)
ZELLEN = [(b, r, p, k) for b in range(len(BU)) for r in range(2) for p in range(3) for k in range(2)]


def verteilen(summe, gewichte):
    """Ganzzahlige Aufteilung von summe nach gewichte (Methode der größten Reste, summengetreu)."""
    s = sum(gewichte)
    roh = [summe * g / s for g in gewichte]
    ganz = [int(x // 1) for x in roh]
    rest = summe - sum(ganz)
    for i in sorted(range(len(roh)), key=lambda i: -(roh[i] - ganz[i]))[:rest]:
        ganz[i] += 1
    return ganz


def gewichte(b, key, streuung=0.0):
    zs = [z for z in ZELLEN if z[0] == b]
    f = FAKTOR.get(key, lambda r, p, k: 1.0)
    return [ANT_R[r] * ANT_P[p] * ANT_K[k] * f(r, p, k) * (1 + rnd.gauss(0, streuung)) for _, r, p, k in zs]


def monatswerte(gesamt_h1):
    """Halbjahreswert in Tsd. € auf sechs Monate verteilen (summengetreu)."""
    return verteilen(round(gesamt_h1 * 1000), [1] * 6)


plan, ist = [], []                      # [zelle, monat, 13 Werte]
plan_bu = {}                            # (b, m) -> {key: Tsd. €}
for b, name in enumerate(BU):
    ml = {t: PRAEM[name][t][1] for t, _, _ in TREIBER}
    h1 = {key: monatswerte(H1[name][key]) for key in KEYS}
    for m in range(12):
        werte = {}
        for key, _, _, tr in POS:
            basis = h1[key][m % 6] / (1 + (ml[tr][m % 6] / 100 if tr else 0))      # Wert vor Prämissen
            werte[key] = round(basis * (1 + (ml[tr][m] / 100 if tr else 0)))     # Plan = Szenario „Wahrscheinlich“
        plan_bu[(b, m)] = werte
    gw = {key: gewichte(b, key) for key in KEYS}
    zs = [i for i, z in enumerate(ZELLEN) if z[0] == b]
    for m in range(12):
        teile = {key: verteilen(plan_bu[(b, m)][key], gw[key]) for key in KEYS}
        for j, zi in enumerate(zs):
            plan.append([zi, m] + [teile[key][j] for key in KEYS])
    # Ist Jan–Jun: Abweichungen je Position, für „Antriebe“ auf den abgelesenen DB je Monat abgestimmt
    for m in range(STICHTAG):
        p = plan_bu[(b, m)]
        w = {key: round(p[key] * (1 + rnd.gauss(0, SIGMA_IST[key]))) for key in KEYS}
        if name == "Antriebe":
            db = sum(vz * w[key] for key, _, vz, _ in POS)
            w["nu"] += IST_DB_ANTRIEBE[m] - db
        for key in KEYS:
            w[key] = max(0, w[key])
        teile = {key: verteilen(w[key], gewichte(b, key, 0.08)) for key in KEYS}
        for j, zi in enumerate(zs):
            ist.append([zi, m] + [teile[key][j] for key in KEYS])

daten = {"jahr": JAHR, "stichtag": STICHTAG, "einheit": "Tsd. €", "monate": MONATE, "bu": BU, "regionen": REGIONEN,
         "produktgruppen": PG, "kundengruppen": KG, "positionen": [list(p) for p in POS],
         "treiber": [list(t) for t in TREIBER],
         "praemissen": [[PRAEM[name][t] for t, _, _ in TREIBER] for name in BU],
         "zellen": [list(z) for z in ZELLEN], "plan": plan, "ist": ist}
json.dump(daten, open(os.path.join(HIER, "bandbreiten.json"), "w", encoding="utf-8"), ensure_ascii=False,
          separators=(",", ":"))

# CSV breit: Plan- und Ist-Zeilen mit den 13 Positionen in Tsd. €, Prämissenzeilen mit den drei Treibern in %
with open(os.path.join(HIER, "bandbreiten.csv"), "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh, delimiter=";", lineterminator="\r\n")
    w.writerow(["Ebene", "Jahr", "Monat", "Business_Unit", "Region", "Produktgruppe", "Kundengruppe"] +
               [p[1].replace(" ", "_") + "_Tsd_EUR" for p in POS] + [t[1] + "_Prozent" for t in TREIBER])
    for b, name in enumerate(BU):
        for i, kw in enumerate(["Min", "Wahrscheinlich", "Max"]):
            for m in range(12):
                w.writerow([f"Prämisse {kw}", JAHR, m + 1, name, "Alle", "Alle", "Alle"] + [""] * len(POS) +
                           [str(PRAEM[name][tk][i][m]).replace(".", ",") for tk, _, _ in TREIBER])
    for ebene, zeilen in (("Plan", plan), ("Ist", ist)):
        for z in zeilen:
            b, r, p, k = ZELLEN[z[0]]
            w.writerow([ebene, JAHR, z[1] + 1, BU[b], REGIONEN[r], PG[p], KG[k]] + z[2:] + [""] * len(TREIBER))


# ---------------- Kontrollausgabe ----------------
def summe(zeilen, b, monate):
    s = {key: 0 for key in KEYS}
    for z in zeilen:
        if ZELLEN[z[0]][0] == b and z[1] in monate:
            for j, key in enumerate(KEYS):
                s[key] += z[2 + j]
    return s


def szenario(b, monate, wahl):
    """DB Business Unit in Tsd. € für ein Szenario: wahl je Treiber 0 = Min, 1 = Wahrscheinlich, 2 = Max."""
    name, db = BU[b], 0.0
    for m in monate:
        p = plan_bu[(b, m)]
        for key, _, vz, tr in POS:
            v = p[key]
            if tr:
                pr = PRAEM[name][tr]
                v = v * (1 + pr[wahl[tr]][m] / 100) / (1 + pr[1][m] / 100)
            db += vz * v
    return db


def db(s):
    return sum(vz * s[key] for key, _, vz, _ in POS)


H1M, JM = range(6), range(12)
WC = {"vkp": 0, "ekp": 2, "tarif": 2}
BC = {"vkp": 2, "ekp": 0, "tarif": 0}
for b, name in enumerate(BU):
    ph, pj, ih = summe(plan, b, H1M), summe(plan, b, JM), summe(ist, b, H1M)
    print(f"{name}: Plan Jan–Jun Nettoumsatz {ph['nu'] / 1000:.1f}, DB BU {db(ph) / 1000:.2f} | Jahr DB BU {db(pj) / 1000:.2f} "
          f"| Ist Jan–Jun DB BU {db(ih) / 1000:.2f} Mio. €")
    print(f"   Worst/Plan/Best Case Jan–Jun {szenario(b, H1M, WC) / 1000:.2f} / {szenario(b, H1M, {t: 1 for t in WC}) / 1000:.2f} / "
          f"{szenario(b, H1M, BC) / 1000:.2f}; Jahr {szenario(b, JM, WC) / 1000:.2f} / {szenario(b, JM, {t: 1 for t in WC}) / 1000:.2f} / "
          f"{szenario(b, JM, BC) / 1000:.2f} Mio. €")
print("Antriebe je Monat (Plan | Ist):", " ".join(f"{db(summe(plan, 0, [m])) / 1000:.2f}|"
      f"{(db(summe(ist, 0, [m])) / 1000 if m < 6 else 0):.2f}" for m in range(12)))
print("Ø Jahr Prämissen Antriebe:", {t: [round(sum(x) / 12, 2) for x in PRAEM['Antriebe'][t]] for t in PRAEM['Antriebe']})
print(f"Zeilen: Plan {len(plan)}, Ist {len(ist)}, Zellen {len(ZELLEN)}")
