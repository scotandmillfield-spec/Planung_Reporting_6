"""Daten für Abb. 3.32 „Pivottabelle“ – softwareneutrale, bedienbare Pivottabelle mit Feldliste.

Ausgangswerte: Umsatz der Pivottabelle im Original (Summe von Umsatz je Produktgruppe und Verkaufsorganisation, Filter
Jahr = zwei von drei Jahren, Material und Vertriebsweg = alle). Die Summen des Originals enthalten Rundungsdifferenzen
(z. B. Rennrad: 4.291.450 + 3.325.792 + 5.044.376 = 12.661.618, angezeigt 12.661.619) – die Zellen hatten also
Cent-Beträge. Die Zellwerte werden deshalb in Cent so angesetzt, dass jede angezeigte Zahl (gerundet auf volle €)
genau dem Original entspricht, auch alle Zeilen-, Spalten- und Gesamtsummen.

Für die Bedienung der Feldliste werden die Zellwerte erfunden, aber exakt (Cent) aufgeteilt auf
Material (2 je Produktgruppe) × Vertriebsweg (Fachhandel, Online) × Jahr (2026, 2027). Das Jahr 2025 ist im
Standardfilter nicht gewählt und frei erfunden (rund 8–12 % unter 2026). Absatz (Stück) = Umsatz / Listenpreis, gerundet.
Codes des Originals: GER1/GER2/GER3 → Nord/Mitte/Süd, englische Produktgruppen → deutsch (Annahme).
Fester Seed. Ausgabe: pivot.json und pivot.csv.
"""
import csv
import json
import os
import random

HIER = os.path.dirname(os.path.abspath(__file__))
GRUPPEN = ["Citybike", "Kinderrad", "Mountainbike", "Rennrad", "Trekkingrad"]
VOS = ["Nord", "Mitte", "Süd"]
WEGE = ["Fachhandel", "Online"]
JAHRE = [2025, 2026, 2027]
# Material, Produktgruppe (Index), Listenpreis in €
MATERIAL = [
    ("Citybike Damen", 0, 650), ("Citybike Herren", 0, 690),
    ("Kinderrad 20 Zoll", 1, 280), ("Kinderrad 24 Zoll", 1, 340),
    ("Mountainbike Hardtail", 2, 950), ("Mountainbike Fully", 2, 1850),
    ("Rennrad Aluminium", 3, 1150), ("Rennrad Carbon", 3, 2600),
    ("Trekkingrad Damen", 4, 820), ("Trekkingrad Herren", 4, 860),
]
# Umsatz in Cent je Produktgruppe (Zeilen) und Verkaufsorganisation (Spalten), Jahre 2026 + 2027 – Original
ORIGINAL_CENT = [
    [230791193, 181498363, 271519244],   # City bike (CB):     2.307.912 | 1.814.984 | 2.715.192 | 6.838.088
    [54137793, 44320563, 64953244],      # Kids bike (KB):       541.378 |   443.206 |   649.532 | 1.634.116
    [437908494, 355200062, 531031844],   # Mountain bike (MB): 4.379.085 | 3.552.001 | 5.310.318 | 13.241.404
    [429145030, 332579226, 504437644],   # Racing bike (RB):   4.291.450 | 3.325.792 | 5.044.376 | 12.661.619
    [185703130, 149518726, 217959044],   # Trekking bike (TB): 1.857.031 | 1.495.187 | 2.179.590 | 5.531.809
]
ANZEIGE = {  # Werte, wie sie das Original zeigt (volle €)
    "zellen": [[2307912, 1814984, 2715192], [541378, 443206, 649532], [4379085, 3552001, 5310318],
               [4291450, 3325792, 5044376], [1857031, 1495187, 2179590]],
    "zeilen": [6838088, 1634116, 13241404, 12661619, 5531809],
    "spalten": [13376856, 10631169, 15899010],
    "gesamt": 39907036,
}
euro = lambda cent: int((cent + 50) // 100)          # kaufmännisch auf volle € (keine Hälften im Datensatz)
for i, z in enumerate(ORIGINAL_CENT):
    assert [euro(c) for c in z] == ANZEIGE["zellen"][i], i
    assert euro(sum(z)) == ANZEIGE["zeilen"][i], i
for j in range(3):
    assert euro(sum(z[j] for z in ORIGINAL_CENT)) == ANZEIGE["spalten"][j], j
assert euro(sum(map(sum, ORIGINAL_CENT))) == ANZEIGE["gesamt"]


def verteilen(gesamt, gewichte):
    """Ganzzahlige Aufteilung nach Gewichten, Summe exakt (größte Reste)."""
    roh = [gesamt * g / sum(gewichte) for g in gewichte]
    teile = [int(r // 1) for r in roh]
    for i in sorted(range(len(roh)), key=lambda i: roh[i] - teile[i], reverse=True)[:gesamt - sum(teile)]:
        teile[i] += 1
    return teile


rnd = random.Random(332)
ONLINE = {0: 0.30, 1: 0.38, 2: 0.24, 3: 0.33, 4: 0.20}          # Online-Anteil je Produktgruppe (2026)
saetze = []   # [material, vo, weg, jahr, absatz, umsatz_cent]
for g, zeile in enumerate(ORIGINAL_CENT):
    mats = [m for m, x in enumerate(MATERIAL) if x[1] == g]
    for vo, cent in enumerate(zeile):
        a = rnd.uniform(0.42, 0.62)
        teile = []                                  # (material, weg, jahr, gewicht)
        for k, m in enumerate(mats):
            wm = a if k == 0 else 1 - a
            for weg in range(2):
                for jahr in (1, 2):                 # 2026, 2027 – zusammen das Original
                    on = ONLINE[g] * (1.0 if jahr == 1 else 1.18) * rnd.uniform(0.9, 1.1)
                    ww = on if weg == 1 else 1 - on
                    wj = rnd.uniform(0.46, 0.50) if jahr == 1 else rnd.uniform(0.50, 0.54)
                    teile.append((m, weg, jahr, wm * ww * wj))
        for (m, weg, jahr, _), c in zip(teile, verteilen(cent, [t[3] for t in teile])):
            saetze.append([m, vo, weg, jahr, max(1, round(c / 100 / MATERIAL[m][2])), c])
        # 2025: frei erfunden, nicht im Standardfilter
        for (m, weg, jahr, w) in teile:
            if jahr == 1:
                vj = [s for s in saetze if s[:4] == [m, vo, weg, 1]][0][5]
                c = int(round(vj * rnd.uniform(0.88, 0.92) * (0.85 if weg == 1 else 1.0)))
                saetze.append([m, vo, weg, 0, max(1, round(c / 100 / MATERIAL[m][2])), c])
saetze.sort(key=lambda s: (s[3], s[0], s[1], s[2]))

# Kontrolle: Standardfilter (2026 und 2027) ergibt exakt das Original
for g in range(5):
    for vo in range(3):
        c = sum(s[5] for s in saetze if MATERIAL[s[0]][1] == g and s[1] == vo and s[3] in (1, 2))
        assert c == ORIGINAL_CENT[g][vo], (g, vo)

json.dump({"gruppen": GRUPPEN, "vos": VOS, "wege": WEGE, "jahre": JAHRE,
           "materialien": [[n, g] for n, g, _ in MATERIAL], "filter_jahr": [1, 2],
           "saetze": saetze},
          open(os.path.join(HIER, "pivot.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
de = lambda cent: f"{cent // 100},{cent % 100:02d}"
with open(os.path.join(HIER, "pivot.csv"), "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh, delimiter=";", lineterminator="\r\n")
    w.writerow(["Jahr", "Produktgruppe", "Material", "Verkaufsorganisation", "Vertriebsweg", "Absatz_Stueck", "Umsatz_EUR"])
    for m, vo, weg, jahr, absatz, c in saetze:
        w.writerow([JAHRE[jahr], GRUPPEN[MATERIAL[m][1]], MATERIAL[m][0], VOS[vo], WEGE[weg], absatz, de(c)])

# Kontrollausgabe
print(f"{len(saetze)} Datensätze")
std = [s for s in saetze if s[3] in (1, 2)]
for g, name in enumerate(GRUPPEN):
    z = [euro(sum(s[5] for s in std if MATERIAL[s[0]][1] == g and s[1] == vo)) for vo in range(3)]
    print(f"  {name:13s} " + " | ".join(f"{v:>10,}".replace(",", ".") for v in z)
          + f" | {euro(sum(s[5] for s in std if MATERIAL[s[0]][1] == g)):>11,}".replace(",", "."))
print("  Gesamt        " + " | ".join(f"{euro(sum(s[5] for s in std if s[1] == vo)):>10,}".replace(",", ".") for vo in range(3))
      + f" | {euro(sum(s[5] for s in std)):>11,}".replace(",", "."))
for j, jahr in enumerate(JAHRE):
    js = [s for s in saetze if s[3] == j]
    print(f"  {jahr}: Umsatz {euro(sum(s[5] for s in js)):>11,} €  Absatz {sum(s[4] for s in js):>7,} Stück  Online-Anteil "
          f"{sum(s[5] for s in js if s[2] == 1) / sum(s[5] for s in js) * 100:4.1f} %".replace(",", "."))
