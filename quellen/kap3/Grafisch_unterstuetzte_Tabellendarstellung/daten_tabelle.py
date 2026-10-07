"""Daten für Abb. 3.16 „Grafisch unterstützte Tabellendarstellung“.

Jahreswerte des Originals (5. Auflage) je Bundesland für Vorjahr, Plan und Ist – unverändert. Das Original nannte keine
Einheit; gelesen als Umsatz in Mio. €. Für die Datenschnitte werden die Jahreswerte auf Quartale verteilt
(Zehntel-Mio. genau, Summe der Quartale = Jahreswert):
- Vorjahr und Plan mit einem leichten Saisonverlauf (stärkeres viertes Quartal),
- Ist = Plan des Quartals + Anteil der Jahresabweichung, verteilt nach einer Geschichte je Land:
  Berlin verliert ab dem dritten Quartal einen Großkunden, Niedersachsen liegt das ganze Jahr unter Plan
  (am stärksten im zweiten Quartal), Nordrhein-Westfalen gewinnt im Jahresverlauf zunehmend dazu.
Ausgabe: tabelle.json (Länder, Regionen, Werte in Zehntel-Mio. €) und tabelle.csv (Einzelsätze Land × Quartal).
"""
import csv
import json
import os
import random

HIER = os.path.dirname(os.path.abspath(__file__))
JAHR = 2025
# Bundesland, Region, Vorjahr, Plan, Ist (Mio. €, Jahr) – Werte des Originals
LAENDER = [
    ("Baden-Württemberg", "Süd", 4.6, 4.8, 5.3),
    ("Bayern", "Süd", 5.6, 5.9, 5.4),
    ("Berlin", "Ost", 18.4, 18.4, 13.5),
    ("Brandenburg", "Ost", 10.5, 11.5, 12.6),
    ("Bremen", "Nord", 25.1, 25.4, 25.4),
    ("Hamburg", "Nord", 8.4, 7.7, 9.9),
    ("Hessen", "West", 15.0, 13.4, 15.1),
    ("Mecklenburg-Vorpommern", "Ost", 3.2, 1.7, 2.8),
    ("Niedersachsen", "Nord", 84.0, 91.7, 81.5),
    ("Nordrhein-Westfalen", "West", 21.2, 18.2, 24.8),
    ("Rheinland-Pfalz", "West", 2.6, 2.4, 2.8),
    ("Saarland", "West", 1.2, 1.8, 1.6),
    ("Sachsen", "Ost", 6.4, 5.5, 5.7),
    ("Sachsen-Anhalt", "Ost", 5.5, 5.1, 4.9),
    ("Schleswig-Holstein", "Nord", 5.8, 2.8, 3.2),
    ("Thüringen", "Ost", 4.7, 4.7, 5.0),
]
SAISON_VJ = [0.24, 0.25, 0.24, 0.27]
SAISON_PL = [0.24, 0.25, 0.245, 0.265]
ABW = {"Berlin": [0.02, 0.08, 0.40, 0.50], "Niedersachsen": [0.22, 0.34, 0.24, 0.20],
       "Nordrhein-Westfalen": [0.10, 0.20, 0.30, 0.40]}


def verteilen(gesamt, gewichte):
    """Ganzzahlige Aufteilung (Zehntel) nach Gewichten, Summe exakt (größte Reste)."""
    roh = [gesamt * g / sum(gewichte) for g in gewichte]
    teile = [int(r // 1) for r in roh]
    rest = gesamt - sum(teile)
    for i in sorted(range(len(roh)), key=lambda i: roh[i] - teile[i], reverse=True)[:rest]:
        teile[i] += 1
    return teile


rnd = random.Random(316)
werte = []
for name, region, vj, pl, ist in LAENDER:
    t = lambda v: round(v * 10)
    g_vj = [s * rnd.uniform(0.94, 1.06) for s in SAISON_VJ]
    g_pl = [s * rnd.uniform(0.97, 1.03) for s in SAISON_PL]
    vjq = verteilen(t(vj), g_vj)
    plq = verteilen(t(pl), g_pl)
    d = t(ist) - t(pl)
    gew = ABW.get(name) or [rnd.uniform(0.15, 0.35) for _ in range(4)]
    # Abweichung je Quartal (mit Vorzeichen), Summe exakt d
    dq = verteilen(abs(d), gew)
    dq = [x if d >= 0 else -x for x in dq]
    istq = [p + x for p, x in zip(plq, dq)]
    assert min(istq) >= 0 and sum(istq) == t(ist) and sum(plq) == t(pl) and sum(vjq) == t(vj), name
    werte.append([vjq, plq, istq])

json.dump({"jahr": JAHR, "einheit": "Mio. €", "laender": [[n, r] for n, r, *_ in LAENDER], "werte": werte},
          open(os.path.join(HIER, "tabelle.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))

de = lambda z: f"{z / 10:.1f}".replace(".", ",")
with open(os.path.join(HIER, "tabelle.csv"), "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh, delimiter=";", lineterminator="\r\n")
    w.writerow(["Bundesland", "Region", "Quartal", "Vorjahr_Mio_EUR", "Plan_Mio_EUR", "Ist_Mio_EUR"])
    for (name, region, *_), (vjq, plq, istq) in zip(LAENDER, werte):
        for q in range(4):
            w.writerow([name, region, f"Q{q + 1} {JAHR}", de(vjq[q]), de(plq[q]), de(istq[q])])

# Kontrollausgabe
for q in range(4):
    s = [sum(v[k][q] for v in werte) / 10 for k in range(3)]
    print(f"Q{q + 1}: VJ {s[0]:6.1f}  PL {s[1]:6.1f}  IST {s[2]:6.1f}  ΔPL {s[2] - s[1]:+5.1f}")
s = [sum(sum(v[k]) for v in werte) / 10 for k in range(3)]
print(f"Jahr: VJ {s[0]:6.1f}  PL {s[1]:6.1f}  IST {s[2]:6.1f}  ΔPL {s[2] - s[1]:+5.1f}  ΔVJ {s[2] - s[0]:+5.1f}")
for (name, *_), (vjq, plq, istq) in zip(LAENDER, werte):
    if name in ABW:
        print(f"{name:22s} ΔPL je Quartal: " + "  ".join(f"{(i - p) / 10:+5.1f}" for i, p in zip(istq, plq)))
