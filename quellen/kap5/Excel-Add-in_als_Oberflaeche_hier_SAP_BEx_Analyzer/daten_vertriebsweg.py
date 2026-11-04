"""Daten für Abb. 5.45 – Bericht „Absatz und Umsatz nach Vertriebsweg“ in einer Tabellenkalkulation mit Add-in.

Werte des Originals übernommen: Absatz (Stück) und Umsatz je Vertriebsweg (Internet, Großhandel) und
Verkaufsorganisation (im Original AUS1–AUS3, hier Nord, Mitte, Süd); Umsatz als Euro mit Cent (Original AUD).
Für die freien Merkmale Kalenderjahr und Kalendermonat wird jeder Wert ganzzahlig (Stück bzw. Cent) und
summengetreu auf 18 Monate verteilt (Januar 2025 bis Juni 2026, Datenstand 24.06.2026); Saisonmuster für Fahrräder
mit Frühjahrsspitze, Internet mit leichtem Wachstum, Großhandel mit Vororder im Winter.
Grain: Vertriebsweg x Verkaufsorganisation x Monat mit Absatz (Stück) und Umsatz (Cent).
Ausgabe: vertriebsweg.json und vertriebsweg.csv.
"""
import csv
import json
import os
import random

HIER = os.path.dirname(os.path.abspath(__file__))
VW = ["Internet", "Großhandel"]
VO = ["Nord", "Mitte", "Süd"]
MONATE = [f"{j}-{m:02d}" for j in (2025, 2026) for m in range(1, 13)][:18]
# Original: Vertriebsweg, Verkaufsorganisation, Absatz (Stück), Umsatz (Cent)
ORIGINAL = {
    (0, 0): (14093, 2155307880), (0, 1): (15807, 2424695273), (0, 2): (20151, 3061615837),
    (1, 0): (13846, 1984342408), (1, 1): (15774, 2269481850), (1, 2): (19837, 2873147935),
}
ERGEBNIS = {0: (50051, 7641618990), 1: (49457, 7126972193)}
GESAMT = (99508, 14768591183)

rnd = random.Random(545)
SAISON = [0.55, 0.62, 0.95, 1.30, 1.42, 1.35, 1.18, 1.02, 0.86, 0.70, 0.58, 0.72]


def verteilen(summe, gewichte):
    """Ganzzahlig und summengetreu nach Gewichten verteilen (größte Reste)."""
    g = sum(gewichte)
    roh = [summe * w / g for w in gewichte]
    ganz = [int(r) for r in roh]
    for i in sorted(range(len(roh)), key=lambda i: roh[i] - ganz[i], reverse=True)[:summe - sum(ganz)]:
        ganz[i] += 1
    return ganz


saetze = []                       # [vw, vo, monat, absatz, umsatz_cent]
for (w, o), (absatz, umsatz) in ORIGINAL.items():
    gew = []
    for i, m in enumerate(MONATE):
        mon = int(m[5:]) - 1
        s = SAISON[mon]
        if w == 1 and mon in (0, 1, 10, 11):
            s *= 1.35            # Vororder des Handels
        trend = 1 + (0.012 if w == 0 else 0.003) * i
        gew.append(s * trend * rnd.uniform(0.93, 1.07))
    ab = verteilen(absatz, gew)
    # Preis schwankt leicht je Monat (Rabattaktionen im Herbst)
    preis = [rnd.uniform(0.97, 1.03) * (0.96 if int(m[5:]) in (9, 10) else 1) for m in MONATE]
    um = verteilen(umsatz, [a * p for a, p in zip(ab, preis)])
    for i in range(len(MONATE)):
        saetze.append([w, o, i, ab[i], um[i]])

# Kontrollsummen gegen das Original
for (w, o), (absatz, umsatz) in ORIGINAL.items():
    t = [s for s in saetze if s[0] == w and s[1] == o]
    assert sum(s[3] for s in t) == absatz and sum(s[4] for s in t) == umsatz, (w, o)
for w, (absatz, umsatz) in ERGEBNIS.items():
    t = [s for s in saetze if s[0] == w]
    assert sum(s[3] for s in t) == absatz and sum(s[4] for s in t) == umsatz, w
assert sum(s[3] for s in saetze) == GESAMT[0] and sum(s[4] for s in saetze) == GESAMT[1]

INFO = [
    ["Autor", "Frau Brandt"], ["Aktueller Benutzer", "Herr Tal"], ["Zuletzt geändert von", "Frau Brandt"],
    ["Geändert am", "17.07.2026, 15:24"], ["Datenquelle", "Vertrieb (Absatz und Umsatz)"],
    ["Abfrage", "Absatz und Umsatz nach Vertriebsweg"], ["Datenstand", "24.06.2026, 14:47"],
    ["Stichtag", "17.07.2026"], ["Zuletzt aktualisiert", "17.07.2026, 15:35"],
]

daten = {"vertriebswege": VW, "vos": VO, "monate": MONATE, "info": INFO, "saetze": saetze}
with open(os.path.join(HIER, "vertriebsweg.json"), "w", encoding="utf-8") as fh:
    json.dump(daten, fh, ensure_ascii=False, separators=(",", ":"))
with open(os.path.join(HIER, "vertriebsweg.csv"), "w", encoding="utf-8-sig", newline="") as fh:
    wr = csv.writer(fh, delimiter=";")
    wr.writerow(["Vertriebsweg", "Verkaufsorganisation", "Kalenderjahr", "Kalendermonat", "Absatz_Stueck", "Umsatz_EUR"])
    for w, o, m, a, u in saetze:
        wr.writerow([VW[w], VO[o], MONATE[m][:4], MONATE[m][5:], a, f"{u // 100},{u % 100:02d}"])

print("Kontrollsummen (Absatz Stück / Umsatz €):")
for w in range(2):
    for o in range(3):
        a, u = ORIGINAL[(w, o)]
        print(f"  {VW[w]:<11} {VO[o]:<6} {a:>7,}  {u / 100:>16,.2f}")
    print(f"  {VW[w]:<11} Ergebnis {ERGEBNIS[w][0]:>7,}  {ERGEBNIS[w][1] / 100:>16,.2f}")
print(f"  Gesamtergebnis     {GESAMT[0]:>7,}  {GESAMT[1] / 100:>16,.2f}")
for j in ("2025", "2026"):
    t = [s for s in saetze if MONATE[s[2]].startswith(j)]
    print(f"  {j}: {sum(s[3] for s in t):,} Stück, {sum(s[4] for s in t) / 100:,.2f} €")
