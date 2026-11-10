"""Daten für Abb. 5.46 „What-If-Simulation“ – Basis der Was-wäre-wenn-Rechnung je Warengruppe.

Werte des Originals (Tabelle „What If Analysis“): Menge, Umsatz und Marge je Warengruppe, Währung $ → €,
Basis Ist Juli 2026. Die Simulationswerte (neue Menge, neuer Umsatz, neue Marge) rechnet die Seite selbst:
    Menge neu  = Menge × (1 + Δ Menge)
    Umsatz neu = Umsatz × (1 + Δ Menge) × (1 + Δ Preis)
    Kosten neu = (Umsatz − Marge) × (1 + Δ Menge) × (1 + Δ Stückkosten)
    Marge neu  = Umsatz neu − Kosten neu
Mit den Annahmen des Originals (Menge −15 %, Preis +5 %, Kosten −5 %) ergeben sich die Werte des Originals
(Umsatz neu 5.456.752 €, Marge neu 2.592.940 €); die Cent-Beträge der Basis sind so gewählt, dass jede Zahl
der Tabelle des Originals auf ganze € gerundet herauskommt.
Für die Dimensionen Region und Kundensegment (Original: Country, Segment …) wird jede Warengruppe mit festem
Seed auf Region × Segment aufgeteilt; die Summen je Warengruppe bleiben exakt.
Ausgabe: whatif.json und whatif.csv (Semikolon, Dezimalkomma, UTF-8 mit BOM).
"""
import csv
import json
import os
import random

HIER = os.path.dirname(os.path.abspath(__file__))
rnd = random.Random(546)

# Warengruppe: Menge (Stück), Umsatz (€), Marge (€) – Original, Reihenfolge des Originals. Die Cent-Beträge sind so
# gewählt, dass alle Werte des Originals auf ganze € bzw. 0,1 % gerundet herauskommen (das Original rechnete mit Cent),
# dazu die Simulationswerte des Originals zur Kontrolle: Menge neu, Umsatz neu, Marge neu, Δ Umsatz, Δ Marge.
WG = [
    ("Alkoholische Getränke", 15781, 65505.43, -79651.07, (13414, 58464, -58750, -7042, 20901)),
    ("Dosenprodukte", 2664, 42567.34, 26792.37, (2264, 37991, 25253, -4576, -1539)),
    ("Meeresfrüchte", 27, 1842.74, 1158.64, (23, 1645, 1092, -198, -66)),
    ("Teigwaren und Reis", 407, 62105.03, 30470.70, (346, 55429, 29884, -6676, -587)),
    ("Backzutaten", 4871, 870947.65, 423418.51, (4140, 777321, 415941, -93627, -7478)),
    ("Obst und Gemüse", 10039, 1081820.27, 512917.99, (8533, 965525, 506136, -116296, -6782)),
    ("Knabberartikel", 5481, 485633.05, 227839.12, (4659, 433427, 225259, -52206, -2580)),
    ("Alkoholfreie Getränke", 3275, 475560.32, 216777.67, (2784, 424438, 215471, -51123, -1307)),
    ("Fleisch", 26, 1377.22, 619.31, (22, 1229, 617, -148, -2)),
    ("Tiefkühlkost", 8306, 901876.39, 396812.13, (7060, 804925, 397085, -96952, 273)),
    ("Backwaren", 991, 30403.94, 13215.49, (842, 27136, 13256, -3268, 40)),
    ("Konserven", 6226, 238556.72, 102571.83, (5292, 212912, 103104, -25645, 532)),
    ("Snacks", 380, 64279.61, 26941.60, (323, 57370, 27219, -6910, 278)),
    ("Frühstücksprodukte", 741, 16624.43, 6901.52, (630, 14837, 6986, -1787, 85)),
    ("Eier", 125, 13632.69, 5306.84, (106, 12167, 5444, -1466, 137)),
    ("Feinkost", 20027, 1461756.54, 567312.66, (17023, 1304618, 582354, -157139, 15042)),
    ("Molkereiprodukte", 6937, 299518.43, 88085.75, (5896, 267320, 96588, -32198, 8503)),
]
ORIGINAL_SUMME = (86304, 6114008, 2567491, 73358, 5456752, 2592940, -657256, 25449)
REGIONEN = ["Nord", "Ost", "Süd", "West"]
SEGMENTE = ["Lebensmittelhandel", "Gastronomie", "Großverbraucher"]
W_REG = [0.24, 0.17, 0.34, 0.25]
W_SEG = [0.61, 0.24, 0.15]
START = {"menge": -15, "preis": 5, "kosten": -5}          # Annahmen des Originals in %


def aufteilen(summe, gewichte, einheit=1):
    """Ganzzahlige Aufteilung (in Einheiten, z. B. Cent) nach Gewichten, Summe exakt (größter Rest)."""
    ges = round(summe * einheit)
    roh = [ges * g / sum(gewichte) for g in gewichte]
    teile = [int(r // 1) if ges >= 0 else -int((-r) // 1) for r in roh]
    rest = ges - sum(teile)
    reihe = sorted(range(len(roh)), key=lambda i: -(abs(roh[i]) - abs(teile[i])))
    for i in reihe[:abs(rest)]:
        teile[i] += 1 if rest > 0 else -1
    return [t / einheit for t in teile]


zeilen = []
for w, (name, menge, umsatz, marge, _) in enumerate(WG):
    zellen = [(r, s) for r in range(len(REGIONEN)) for s in range(len(SEGMENTE))]
    g_u = [W_REG[r] * W_SEG[s] * rnd.uniform(0.75, 1.25) for r, s in zellen]
    g_m = [g * rnd.uniform(0.9, 1.1) for g in g_u]            # Margenquote je Zelle leicht verschieden
    g_v = [g * rnd.uniform(0.92, 1.08) for g in g_u]          # Preis je Stück je Zelle leicht verschieden
    mengen = aufteilen(menge, g_v)
    umsaetze = aufteilen(umsatz, g_u, 100)
    margen = aufteilen(marge, g_m, 100)
    for (r, s), m, u, g in zip(zellen, mengen, umsaetze, margen):
        zeilen.append([w, r, s, int(m), round(u, 2), round(g, 2)])

daten = {"stand": "Juli 2026", "warengruppen": [x[0] for x in WG], "regionen": REGIONEN, "segmente": SEGMENTE,
         "start": START, "zeilen": zeilen}
with open(os.path.join(HIER, "whatif.json"), "w", encoding="utf-8") as fh:
    json.dump(daten, fh, ensure_ascii=False, separators=(",", ":"))

with open(os.path.join(HIER, "whatif.csv"), "w", encoding="utf-8-sig", newline="") as fh:
    wr = csv.writer(fh, delimiter=";")
    wr.writerow(["Periode", "Warengruppe", "Region", "Kundensegment", "Menge_Stueck", "Umsatz_EUR", "Marge_EUR", "Kosten_EUR"])
    d = lambda v: f"{v:.2f}".replace(".", ",")
    for w, r, s, m, u, g in zeilen:
        wr.writerow(["2026-07", WG[w][0], REGIONEN[r], SEGMENTE[s], m, d(u), d(g), d(u - g)])

# Kontrollausgabe: Summen je Warengruppe und Simulation mit den Annahmen des Originals gegen das Original
v, p, c = (START[k] / 100 for k in ("menge", "preis", "kosten"))
rund = lambda x: int(x + 0.5) if x >= 0 else -int(-x + 0.5)


def simulation(menge, umsatz, marge):
    nu = umsatz * (1 + v) * (1 + p)
    nk = (umsatz - marge) * (1 + v) * (1 + c)
    return menge * (1 + v), nu, nu - nk


tv = tu = tm = 0.0
for w, (name, menge, umsatz, marge, orig) in enumerate(WG):
    z = [x for x in zeilen if x[0] == w]
    sv, su, sm = sum(x[3] for x in z), sum(x[4] for x in z), sum(x[5] for x in z)
    assert sv == menge and abs(su - umsatz) < 0.005 and abs(sm - marge) < 0.005, name
    nv, nu, nm = simulation(sv, su, sm)
    ist = tuple(rund(x) for x in (nv, nu, nm, nu - su, nm - sm))
    assert ist == orig, (name, ist, orig)
    print(f"  {name}: Δ Marge {nm - sm:+,.2f} € = {(nm - sm) / abs(sm) * 100:+.1f} %")
    tv += sv; tu += su; tm += sm
nv, nu, nm = simulation(tv, tu, tm)
summe = tuple(rund(x) for x in (tv, tu, tm, nv, nu, nm, nu - tu, nm - tm))
assert summe == ORIGINAL_SUMME, summe
print(f"Zeilen: {len(zeilen)} · alle 17 Warengruppen und die Summe stimmen mit dem Original überein")
print(f"Ist: Menge {tv:,.0f} · Umsatz {tu:,.2f} € · Marge {tm:,.2f} € · Margenquote {tm / tu * 100:.2f} %")
print(f"Simulation −15/+5/−5 %: Menge {nv:,.0f} · Umsatz {nu:,.0f} € ({(nu / tu - 1) * 100:+.2f} %) · "
      f"Marge {nm:,.0f} € (Δ {nm - tm:+,.0f} €, {(nm - tm) / abs(tm) * 100:+.2f} %) · Margenquote {nm / nu * 100:.2f} %")
print(f"Margeneffekte: Menge {tm * v:+,.0f} · Preis {tu * (1 + v) * p:+,.0f} · Stückkosten {-(tu - tm) * (1 + v) * c:+,.0f}")
for r, n in enumerate(REGIONEN):
    print(f"  Region {n}: Umsatz {sum(x[4] for x in zeilen if x[1] == r):,.2f} · Marge {sum(x[5] for x in zeilen if x[1] == r):,.2f}")
for s_, n in enumerate(SEGMENTE):
    print(f"  Segment {n}: Umsatz {sum(x[4] for x in zeilen if x[2] == s_):,.2f} · Marge {sum(x[5] for x in zeilen if x[2] == s_):,.2f}")
