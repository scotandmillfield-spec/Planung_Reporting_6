"""Daten für Abb. 5.44 – Dashboard „Vertriebscockpit: Umsatz und Preis je Stück“.

Werte des Originals übernommen (Jahre 2018/2019 → 2025/2026, Berichtswährung € statt $):
- Tabelle „Produktkategorie/Kunde 2026, Verkaufsorganisation USA Ost“: Umsatz, Rabatt und Absatz je Kategorie und
  Kunde exakt (Summe 41.342.610,61 € / 1.381.813,63 € / 20.956 Stück). Bei den Trendrädern war nur der erste Kunde
  lesbar, die übrigen sind summengetreu ergänzt.
- Visuals „Preis je Stück“ und „Umsatz“ je Verkaufsorganisation: Umsatz West 23,68 → 24,45 Mio. €, Ost 37,89 →
  41,34 Mio. €; Preis je Stück West 2,06 → 2,05 Tsd. €, Ost 1,90 → 1,97 Tsd. € (Abweichungen −0,66 % bzw. +3,61 %
  wie im Original). Die Einzelsätze von West und vom Vorjahr sind so erfunden, dass diese Summen genau stimmen.
Deutschland (Nord, Süd) ist für den Datenschnitt Land erfunden. Kunden je Verkaufsorganisation neutral benannt
(Kundentyp + Ort). Grain: Land x Verkaufsorganisation x Jahr x Kategorie x Kunde mit Umsatz und Rabatt (Cent), Absatz.
Ausgabe: vertrieb.json und vertrieb.csv.
"""
import csv
import json
import os
import random

HIER = os.path.dirname(os.path.abspath(__file__))
rnd = random.Random(544)
LAENDER = ["Deutschland", "USA"]
VO = [["Nord", "Süd"], ["West", "Ost"]]            # je Land
JAHRE = [2025, 2026]
KAT = ["Tourenräder", "Rennräder", "Mountainbikes", "E-Bikes", "Zubehör", "Trendräder"]
KUNDEN = {  # (Land, VO): [(Name, Ort)]
    (1, 1): [("Fachhandel Boston", "Boston"), ("Fachmarkt Detroit", "Detroit"), ("Sporthaus New York", "New York"),
             ("Radhandel Philadelphia", "Philadelphia"), ("Fachhandel Atlanta", "Atlanta"),
             ("Sporthaus Washington", "Washington"), ("Radhandel Grand Rapids", "Grand Rapids")],
    (1, 0): [("Fachhandel Seattle", "Seattle"), ("Fachmarkt Portland", "Portland"), ("Sporthaus San Francisco", "San Francisco"),
             ("Radhandel Los Angeles", "Los Angeles"), ("Fachhandel San Diego", "San Diego"),
             ("Sporthaus Denver", "Denver"), ("Radhandel Phoenix", "Phoenix")],
    (0, 0): [("Fachhandel Hamburg", "Hamburg"), ("Fachmarkt Bremen", "Bremen"), ("Sporthaus Hannover", "Hannover"),
             ("Radhandel Berlin", "Berlin"), ("Fachhandel Kiel", "Kiel"), ("Sporthaus Rostock", "Rostock"),
             ("Radhandel Münster", "Münster")],
    (0, 1): [("Fachhandel München", "München"), ("Fachmarkt Stuttgart", "Stuttgart"), ("Sporthaus Nürnberg", "Nürnberg"),
             ("Radhandel Freiburg", "Freiburg"), ("Fachhandel Augsburg", "Augsburg"),
             ("Sporthaus Regensburg", "Regensburg"), ("Radhandel Karlsruhe", "Karlsruhe")],
}
# Original USA Ost 2026: je Kategorie [(Kundenindex, Umsatz Cent, Rabatt Cent, Absatz)] in der Reihenfolge des Originals
K = {"B": 0, "M": 1, "N": 2, "P": 3, "A": 4, "D": 5, "G": 6}
OST26 = {
    0: [("B", 424278270, 21213924, 1125), ("M", 304413273, 9132399, 804), ("N", 302147508, 9064432, 806),
        ("P", 226306104, 6789190, 601), ("A", 187812876, 5634390, 497), ("D", 184475160, 5534256, 492), ("G", 84733839, 0, 225)],
    1: [("B", 315315610, 15765790, 954), ("A", 193556405, 5806701, 607), ("N", 189134558, 5674045, 587),
        ("M", 165088473, 4952660, 551), ("P", 150184518, 4505540, 453), ("D", 141316452, 4239496, 418), ("G", 62588053, 0, 207)],
    2: [("B", 224113453, 11205683, 960), ("M", 156104673, 4683143, 661), ("N", 141815911, 4254479, 596),
        ("P", 137601122, 4128028, 570), ("A", 130499387, 3914981, 553), ("D", 74221302, 2226639, 309), ("G", 64171631, 0, 278)],
    3: [("B", 71626632, 3581330, 147), ("A", 43365784, 1300973, 89), ("M", 28748104, 862442, 59),
        ("D", 25824568, 774737, 53), ("N", 24362800, 730884, 50), ("G", 14130424, 0, 29), ("P", 13155912, 394677, 27)],
    4: [("B", 8567794, 428418, 2161), ("M", 5070539, 152121, 1188), ("N", 5067789, 152028, 1242),
        ("P", 4779190, 143386, 1159), ("A", 3765429, 112966, 958), ("D", 3755566, 112669, 952), ("G", 1843372, 0, 472)],
}
KAT_SUMME = {0: (1714167030, 57368591, 4550), 1: (1217184069, 40944232, 3777), 2: (928527479, 30412953, 3927),
             3: (221214224, 7645043, 454), 4: (32849679, 1101588, 8132), 5: (20318580, 708956, 116)}
GESAMT_OST26 = (4134261061, 138181363, 20956)


def verteilen(summe, gewichte):
    """Ganzzahlig und summengetreu nach Gewichten verteilen (größte Reste)."""
    g = sum(gewichte)
    roh = [summe * w / g for w in gewichte]
    ganz = [int(r) for r in roh]
    for i in sorted(range(len(roh)), key=lambda i: roh[i] - ganz[i], reverse=True)[:summe - sum(ganz)]:
        ganz[i] += 1
    return ganz


# Trendräder: nur Kunde B lesbar (4.970.013 Cent, 248.500 Cent, 29 Stück); Rest summengetreu ergänzen
rest_u, rest_r, rest_a = KAT_SUMME[5][0] - 4970013, KAT_SUMME[5][1] - 248500, KAT_SUMME[5][2] - 29
reihen = ["N", "M", "P", "A", "D", "G"]
gew = [1.35, 1.2, 1.0, 0.9, 0.75, 0.55]
ru = verteilen(rest_u, gew)
rr = verteilen(rest_r, [g if k != "G" else 0 for g, k in zip(gew, reihen)])   # Kunde G erhält im Original nie Rabatt
ra = verteilen(rest_a, gew)
OST26[5] = [("B", 4970013, 248500, 29)] + [(k, u, r, a) for k, u, r, a in zip(reihen, ru, rr, ra)]
for c, (u, r, a) in KAT_SUMME.items():
    assert sum(x[1] for x in OST26[c]) == u and sum(x[2] for x in OST26[c]) == r and sum(x[3] for x in OST26[c]) == a, c
assert sum(KAT_SUMME[c][0] for c in KAT_SUMME) == GESAMT_OST26[0]

# Zielsummen je Land, VO, Jahr: (Umsatz Cent, Absatz Stück); Absatz Deutschland (None) ergibt sich aus den Preisen
ZIEL = {
    (1, 1, 2026): GESAMT_OST26[0::2], (1, 1, 2025): (3789000000, 19900),
    (1, 0, 2026): (2445000000, 11927), (1, 0, 2025): (2368200000, 11476),
    (0, 0, 2026): (1762480000, None), (0, 0, 2025): (1821930000, None),
    (0, 1, 2026): (2893160000, None), (0, 1, 2025): (2641270000, None),
}
RABATT = {(0, 0): 0.029, (0, 1): 0.031, (1, 0): 0.034}
MIX = {(1, 0): [0.41, 0.31, 0.19, 0.075, 0.006, 0.009], (0, 0): [0.30, 0.18, 0.14, 0.35, 0.018, 0.012],
       (0, 1): [0.26, 0.17, 0.20, 0.34, 0.017, 0.013]}
WACHSTUM = {(1, 0): [1.02, 1.05, 1.03, 1.12, 1.0, 0.95], (0, 0): [0.94, 0.95, 0.97, 1.02, 0.98, 0.93],
            (0, 1): [1.04, 1.06, 1.08, 1.16, 1.03, 0.98]}
PREIS = {1: [3767, 3223, 2364, 4872, 40, 1752],      # € je Stück je Kategorie (USA, aus dem Original)
         0: [3350, 2980, 2550, 5150, 45, 1650]}      # Deutschland
PREIS_VJ = [0.985, 0.99, 0.99, 0.97, 1.0, 1.0]        # Preise im Vorjahr etwas niedriger (E-Bikes deutlich)

saetze = []      # [land, vo, jahr, kat, kunde, umsatz_cent, rabatt_cent, absatz]
for (l, v) in [(1, 1), (1, 0), (0, 0), (0, 1)]:
    if (l, v) == (1, 1):
        for c, zeilen in OST26.items():
            for k, u, r, a in zeilen:
                saetze.append([l, v, 1, c, K[k], u, r, a])
        # Vorjahr Ost: aus 2026 je Zelle zurückgerechnet (E-Bikes und Rennräder wuchsen stärker)
        wachstum = [1.06, 1.12, 1.05, 1.28, 1.02, 0.96]
        zellen = [(c, K[k]) for c, zs in OST26.items() for k, u, r, a in zs]
        ist = {(c, K[k]): (u, r, a) for c, zs in OST26.items() for k, u, r, a in zs}
        gu = {z: ist[z][0] / wachstum[z[0]] * rnd.uniform(0.95, 1.05) for z in zellen}
        ga = {z: ist[z][2] / wachstum[z[0]] * rnd.uniform(0.97, 1.03) for z in zellen}
        zu, za = ZIEL[(1, 1, 2025)]
        us = verteilen(zu, [gu[z] for z in zellen])
        ab = verteilen(za, [ga[z] for z in zellen])
        for (c, k), u, a in zip(zellen, us, ab):
            q = ist[(c, k)][1] / ist[(c, k)][0] if ist[(c, k)][0] else 0
            saetze.append([l, v, 0, c, k, u, round(u * q * rnd.uniform(0.9, 1.0)), a])
        continue
    # übrige Organisationen: Grundgewichte je Kategorie und Kunde, je Jahr mit Wachstum und leichtem Rauschen
    mix, kshare = MIX[(l, v)], sorted((rnd.uniform(0.6, 1.5) for _ in range(7)), reverse=True)
    w0 = {(c, k): mix[c] * kshare[k] * rnd.uniform(0.85, 1.15) for c in range(6) for k in range(7)}
    rq = {k: RABATT[(l, v)] * rnd.uniform(0.75, 1.4) for k in range(7)}
    rq[6] = 0.0                                       # wie im Original: ein Kunde ohne Rabatt
    zellen = sorted(w0)
    for j in (0, 1):
        zu, za = ZIEL[(l, v, JAHRE[j])]
        gw = {z: w0[z] * (WACHSTUM[(l, v)][z[0]] * rnd.uniform(0.96, 1.04) if j == 1 else 1) for z in zellen}
        us = verteilen(zu, [gw[z] for z in zellen])
        preis = {z: PREIS[l][z[0]] * (1 if j == 1 else PREIS_VJ[z[0]]) * rnd.uniform(0.97, 1.03) for z in zellen}
        stueck = [u / 100 / preis[z] for z, u in zip(zellen, us)]
        ab = verteilen(za if za is not None else round(sum(stueck)), stueck)
        for (c, k), u, a in zip(zellen, us, ab):
            saetze.append([l, v, j, c, k, u, round(u * rq[k] * (1 if j == 1 else rnd.uniform(0.95, 1.05))), a])
        if za is None:
            ZIEL[(l, v, JAHRE[j])] = (zu, sum(ab))

# Kontrollsummen
print("Kontrollsummen (Umsatz Mio. € / Absatz / Preis je Stück Tsd. € / Rabatt Tsd. €):")
for l in range(2):
    for v in range(2):
        for j in range(2):
            t = [s for s in saetze if s[0] == l and s[1] == v and s[2] == j]
            u, a, r = sum(s[5] for s in t), sum(s[7] for s in t), sum(s[6] for s in t)
            assert (u, a) == ZIEL[(l, v, JAHRE[j])], (l, v, j)
            print(f"  {LAENDER[l]:<11} {VO[l][v]:<5} {JAHRE[j]}: {u / 1e8:7.2f}  {a:>7,}  {u / 100 / a / 1000:5.2f}  {r / 1e5:9.1f}")
for v in range(2):
    a, b = [sum(s[5] for s in saetze if s[0] == 1 and s[1] == v and s[2] == j) for j in range(2)]
    pa, pb = [sum(s[5] for s in saetze if s[0] == 1 and s[1] == v and s[2] == j) / 100 /
              sum(s[7] for s in saetze if s[0] == 1 and s[1] == v and s[2] == j) for j in range(2)]
    print(f"  USA {VO[1][v]}: Umsatz ΔVJ {(b - a) / 1e8:+.2f} Mio. € ({(b / a - 1) * 100:+.2f} %), "
          f"Preis ΔVJ {(pb - pa) / 1000:+.2f} Tsd. € ({(pb / pa - 1) * 100:+.2f} %)")

daten = {"laender": LAENDER, "vos": VO, "jahre": JAHRE, "kategorien": KAT,
         "kunden": {f"{l}-{v}": [list(x) for x in ks] for (l, v), ks in KUNDEN.items()}, "saetze": saetze}
with open(os.path.join(HIER, "vertrieb.json"), "w", encoding="utf-8") as fh:
    json.dump(daten, fh, ensure_ascii=False, separators=(",", ":"))
cent = lambda c: f"{c // 100},{c % 100:02d}"
with open(os.path.join(HIER, "vertrieb.csv"), "w", encoding="utf-8-sig", newline="") as fh:
    wr = csv.writer(fh, delimiter=";")
    wr.writerow(["Land", "Verkaufsorganisation", "Jahr", "Produktkategorie", "Kunde", "Ort", "Umsatz_EUR", "Rabatt_EUR", "Absatz_Stueck"])
    for l, v, j, c, k, u, r, a in saetze:
        name, ort = KUNDEN[(l, v)][k]
        wr.writerow([LAENDER[l], VO[l][v], JAHRE[j], KAT[c], name, ort, cent(u), cent(r), a])
