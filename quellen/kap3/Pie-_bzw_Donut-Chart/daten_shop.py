"""Daten für Abb. 3.43 „Pie- bzw. Donut-Chart“ – Kennzahlen eines Online-Shops.

Vorbild ist das E-Commerce-Dashboard des Originals: Besuche nach Kanal, Produktaufrufe und Umsatz nach Kategorie,
dazu die Quoten qualifizierte Besuche, Produktaufrufquote und Konversionsrate. Anteile und Quoten des Monats
Juni 2027 entsprechen dem Original (Organisch 66 %, Textilien 40 % der Aufrufe, Schuhe 36 % des Umsatzes,
53 % / 50 % / 2,04 %). Die absoluten Zahlen sind stimmig gemacht: Das Original nannte 44 Mio. Besuche bei
1,8 Mio. € Umsatz – mit 2 % Konversionsrate wären das Bestellungen von 2 € im Schnitt. Hier: 440 Tsd. Besuche,
Ø Warenkorb rund 200 €. Monate Dezember 2026 bis Juni 2027 (Dezember nur als Vormonat für Januar).

Grain: Monat x Kanal (Besuche, qualifizierte Besuche, Besuche mit Produktaufruf) und
       Monat x Kanal x Kategorie (Produktaufrufe, Bestellungen, Umsatz).
Ausgabe: shop.json und shop.csv.
"""
import csv
import json
import os
import random

HIER = os.path.dirname(os.path.abspath(__file__))
MONATE = ["2026-12", "2027-01", "2027-02", "2027-03", "2027-04", "2027-05", "2027-06"]
KANAELE = ["Organisch", "Bezahlt"]
KATEGORIEN = ["Schuhe", "Textilien", "Dekoration", "Haushalt"]          # Reihenfolge nach Umsatz im Juni 2027

BESUCHE = [395e3, 402e3, 398e3, 415e3, 421e3, 428e3, 440e3]
ORG = [0.69, 0.68, 0.68, 0.67, 0.67, 0.665, 0.66]                     # Anteil organischer Besuche
QUAL = [0.515, 0.508, 0.512, 0.505, 0.509, 0.515, 0.53]               # qualifizierte Besuche (gesamt)
AUFRUF = [0.47, 0.468, 0.475, 0.48, 0.482, 0.487, 0.50]               # Besuche mit Produktaufruf (gesamt)
KONV = [0.0212, 0.0225, 0.0208, 0.0211, 0.0218, 0.0215, 0.0204]       # Konversionsrate (gesamt)
DIFF = {"qual": 0.088, "aufruf": 0.059, "konv": -0.0056}              # organisch minus bezahlt
AUFRUFE_JE_BESUCH = [4.8, 4.9, 4.9, 4.95, 5.0, 5.0, 5.0]              # Produktaufrufe je Besuch mit Aufruf
WARENKORB = [214, 196, 199, 201, 203, 205, 203.3]                     # Ø Umsatz je Bestellung in €
# Anteile der Kategorien (Juni 2027 wie im Original); Vormonate leicht verschoben
ANT_AUFRUFE = [0.30, 0.40, 0.10, 0.20]
ANT_BESTELL = [0.29, 0.33, 0.20, 0.18]
ANT_UMSATZ = [0.36, 0.31, 0.18, 0.15]
VERSATZ_ORG = [-0.015, 0.02, 0.0, -0.005]          # Anteilsverschiebung organisch; bezahlt gegengleich (mehr Schuhe)

rnd = random.Random(343)


def kanal_werte(tot, d, s):
    """Raten je Kanal so, dass der gewichtete Mittelwert genau tot ist (s = Anteil organisch)."""
    return [tot + d * (1 - s), tot - d * s]


def anteile(basis, kanal, mi):
    """Anteile je Kanal; die Verschiebung ist so gewichtet, dass sie sich über beide Kanäle aufhebt."""
    s = ORG[mi]
    f = 1.0 if kanal == 0 else -s / (1 - s)
    a = [b + v * f + (6 - mi) * rnd.uniform(-0.002, 0.002) for b, v in zip(basis, VERSATZ_ORG)]
    s = sum(a)
    return [x / s for x in a]


kanal_zeilen, kat_zeilen = [], []          # [m, c, besuche, qualifiziert, mit_aufruf] / [m, c, k, aufrufe, bestellungen, umsatz]
for mi, m in enumerate(MONATE):
    s = ORG[mi]
    q, a, k = kanal_werte(QUAL[mi], DIFF["qual"], s), kanal_werte(AUFRUF[mi], DIFF["aufruf"], s), kanal_werte(KONV[mi], DIFF["konv"], s)
    for ci in range(2):
        bes = round(BESUCHE[mi] * (s if ci == 0 else 1 - s))
        mit = round(bes * a[ci])
        kanal_zeilen.append([mi, ci, bes, round(bes * q[ci]), mit])
        aufrufe = mit * AUFRUFE_JE_BESUCH[mi]
        bestell = bes * k[ci]
        au, be, um = anteile(ANT_AUFRUFE, ci, mi), anteile(ANT_BESTELL, ci, mi), anteile(ANT_UMSATZ, ci, mi)
        for ki in range(4):
            n = round(bestell * be[ki])
            kat_zeilen.append([mi, ci, ki, round(aufrufe * au[ki]), n, round(bestell * WARENKORB[mi] * um[ki], -2)])

json.dump({"monate": MONATE, "kanaele": KANAELE, "kategorien": KATEGORIEN, "kanal": kanal_zeilen, "kategorie": kat_zeilen},
          open(os.path.join(HIER, "shop.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
with open(os.path.join(HIER, "shop.csv"), "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh, delimiter=";", lineterminator="\r\n")
    w.writerow(["Ebene", "Monat", "Kanal", "Kategorie", "Besuche", "Qualifizierte_Besuche", "Besuche_mit_Produktaufruf",
                "Produktaufrufe", "Bestellungen", "Umsatz_EUR"])
    for mi, ci, b, q_, a_ in kanal_zeilen:
        w.writerow(["Kanal", MONATE[mi], KANAELE[ci], "", b, q_, a_, "", "", ""])
    for mi, ci, ki, au, n, u in kat_zeilen:
        w.writerow(["Kategorie", MONATE[mi], KANAELE[ci], KATEGORIEN[ki], "", "", "", au, n, int(u)])

# Kontrollausgabe je Monat
for mi, m in enumerate(MONATE):
    kz = [z for z in kanal_zeilen if z[0] == mi]
    tz = [z for z in kat_zeilen if z[0] == mi]
    bes = sum(z[2] for z in kz)
    org = sum(z[2] for z in kz if z[1] == 0)
    best = sum(z[4] for z in tz)
    um = sum(z[5] for z in tz)
    auf = sum(z[3] for z in tz)
    print(f"{m}: Besuche {bes:7d} (org. {org / bes:.0%}), qualifiziert {sum(z[3] for z in kz) / bes:.1%}, "
          f"Aufrufquote {sum(z[4] for z in kz) / bes:.1%}, Konversion {best / bes:.2%}, Aufrufe {auf:8d}, "
          f"Umsatz {um:9.0f} €, Ø Warenkorb {um / best:5.0f} €")
    if m == "2027-06":
        for ki, k in enumerate(KATEGORIEN):
            print(f"   {k:10s} Aufrufe {sum(z[3] for z in tz if z[2] == ki) / auf:.0%}  Umsatz {sum(z[5] for z in tz if z[2] == ki) / um:.0%}")
