"""Daten für Abb. 4.23 – multidimensionale Analyse der Balanced Chance and Risk Card (BCR-Card).

Würfel mit den Dimensionen Jahr › Quartal, Standort (Konzern › Dortmund, Hamburg, München), Produkt (A, B, C) und
Kennzahlen (Perspektive › Chance/Risiko › Kennzahl). Gespeichert sind nur additive Basisgrößen je Quartal, Standort
und Produkt; Quoten (ROI, ROS, WACC, Risikovorsorgequoten …) rechnet das Dashboard aus Zähler und Nenner, damit sie
auf jeder Ebene stimmen.
Perspektive Finanzen: Konzern-Jahreswerte des Originals (2000–2002 → 2024–2026) – EVA, EBT, Cash Flow, Umsatz,
Bruttoertrag, Risikovorsorgekosten exakt; die Nenner (Kapital, Kapitalkosten, Risikovorsorge intern/extern,
Forderungsausfälle, Fremdkapital) sind so gewählt, dass WACC, ROI, ROS und die Risikoquoten auf zwei Nachkommastellen
den Originalwerten entsprechen. Markt und Kunden, Prozesse, Potenziale: erfunden (im Original nicht sichtbar).
Verteilung auf Quartal x Standort x Produkt ganzzahlig und summengetreu (größte Reste), Anteile je Größe leicht
verschieden, damit Quoten zwischen Standorten und Produkten streuen.
Ausgabe: bcr_olap.json und bcr_olap.csv.
"""
import csv
import json
import os
import random

HIER = os.path.dirname(os.path.abspath(__file__))
JAHRE = [2024, 2025, 2026]
STANDORTE = ["Dortmund", "Hamburg", "München"]
PRODUKTE = ["Produkt A", "Produkt B", "Produkt C"]
PERSPEKTIVEN = ["Finanzen", "Markt und Kunden", "Prozesse", "Potenziale"]

# Jahressummen je Basisgröße (Konzern); Finanzen aus dem Original
JAHRESWERTE = {
    "umsatz":        [10809000, 16319000, 19850000],
    "bruttoertrag":  [3233014, 4758503, 6102224],
    "ebt":           [529000, 1149000, 1560000],
    "cashflow":      [609918, 1250995, 1608535],
    "eva":           [56334, 68664, 240713],
    "kapital":       [6888021, 19742268, 23283582],      # ROI = EBT / Kapital: 7,68 %, 5,82 %, 6,70 %
    "kapitalkosten": [413281, 1184536, 1397015],          # WACC = Kapitalkosten / Kapital = 6,00 %
    "rv_int":        [65600, 116000, 277900],             # Risikovorsorgequote intern 0,61 %, 0,71 %, 1,40 %
    "rv_ext":        [43860, 76875, 184550],              # extern 0,41 %, 0,47 %, 0,93 %; Summe = 109.460, 192.875, 462.450
    "ausfall":       [82150, 141980, 176700],             # Forderungsausfallquote 0,76 %, 0,87 %, 0,89 %
    "fk":            [4305013, 12931186, 13737313],       # Verschuldungsgrad FK/Kapital 62,50 %, 65,50 %, 59,00 %
    # Markt und Kunden (erfunden)
    "absatz":        [182000, 241000, 268000],            # Stück
    "marktvolumen":  [1310000, 1420000, 1465000],
    "kunden":        [412, 468, 503],
    "zufr_punkte":   [412 * 76, 468 * 78, 503 * 81],      # Kundenzufriedenheit Index = Punkte / Kunden
    "neukundenumsatz": [1320000, 2410000, 2780000],
    "grosskundenumsatz": [4540000, 7180000, 9130000],
    "reklamationen": [214, 251, 238],
    "auftraege":     [8900, 11650, 13100],
    # Prozesse (erfunden)
    "lieferungen":   [9400, 12300, 13800],
    "puenktlich":    [8742, 11685, 13248],
    "dlz_tage":      [8900 * 14.2, 11650 * 13.1, 13100 * 12.4],
    "ausschuss":     [5460, 6750, 6430],
    "produktion":    [186000, 246000, 272000],
    # Potenziale (erfunden)
    "neuproduktumsatz": [1080000, 2120000, 3180000],
    "vorschlaege":   [310, 402, 486],
    "kranktage":     [4810, 5560, 5980],
    "solltage":      [96000, 108000, 114000],
    "austritte":     [31, 38, 34],
}
FELDER = list(JAHRESWERTE)
# Perspektive, Art (C/R), Name, Einheit, Zähler (Liste), Nenner (oder None), Faktor, Nachkommastellen, Wirkung, Δ-Art
KENNZAHLEN = [
    [0, "C", "EVA", "Tsd. €", ["eva"], None, 0.001, 0, 1, "rel"],
    [0, "C", "WACC", "%", ["kapitalkosten"], "kapital", 100, 2, -1, "pp"],
    [0, "C", "EBT", "Tsd. €", ["ebt"], None, 0.001, 0, 1, "rel"],
    [0, "C", "ROI", "%", ["ebt"], "kapital", 100, 2, 1, "pp"],
    [0, "C", "ROS", "%", ["ebt"], "umsatz", 100, 2, 1, "pp"],
    [0, "C", "Cash Flow", "Tsd. €", ["cashflow"], None, 0.001, 0, 1, "rel"],
    [0, "C", "Umsatz", "Tsd. €", ["umsatz"], None, 0.001, 0, 1, "rel"],
    [0, "C", "Bruttoertrag", "Tsd. €", ["bruttoertrag"], None, 0.001, 0, 1, "rel"],
    [0, "R", "Risikovorsorgequote intern", "%", ["rv_int"], "umsatz", 100, 2, -1, "pp"],
    [0, "R", "Risikovorsorgequote extern", "%", ["rv_ext"], "umsatz", 100, 2, -1, "pp"],
    [0, "R", "Risikovorsorgekosten", "Tsd. €", ["rv_int", "rv_ext"], None, 0.001, 0, -1, "rel"],
    [0, "R", "Forderungsausfallquote", "%", ["ausfall"], "umsatz", 100, 2, -1, "pp"],
    [0, "R", "Verschuldungsgrad", "%", ["fk"], "kapital", 100, 2, -1, "pp"],
    [1, "C", "Marktanteil", "%", ["absatz"], "marktvolumen", 100, 1, 1, "pp"],
    [1, "C", "Kundenzufriedenheit", "Index", ["zufr_punkte"], "kunden", 1, 1, 1, "abs"],
    [1, "C", "Neukundenumsatz", "Tsd. €", ["neukundenumsatz"], None, 0.001, 0, 1, "rel"],
    [1, "R", "Großkundenanteil", "%", ["grosskundenumsatz"], "umsatz", 100, 1, -1, "pp"],
    [1, "R", "Reklamationsquote", "%", ["reklamationen"], "auftraege", 100, 2, -1, "pp"],
    [2, "C", "Liefertreue", "%", ["puenktlich"], "lieferungen", 100, 1, 1, "pp"],
    [2, "C", "Durchlaufzeit", "Tage", ["dlz_tage"], "auftraege", 1, 1, -1, "abs"],
    [2, "R", "Ausschussquote", "%", ["ausschuss"], "produktion", 100, 2, -1, "pp"],
    [3, "C", "Innovationsquote", "%", ["neuproduktumsatz"], "umsatz", 100, 1, 1, "pp"],
    [3, "C", "Verbesserungsvorschläge", "Anzahl", ["vorschlaege"], None, 1, 0, 1, "rel"],
    [3, "R", "Krankenquote", "%", ["kranktage"], "solltage", 100, 1, -1, "pp"],
    [3, "R", "Austritte", "Anzahl", ["austritte"], None, 1, 0, -1, "rel"],
]

rnd = random.Random(423)
ST_ANTEIL = [[0.31, 0.37, 0.32], [0.29, 0.39, 0.32], [0.27, 0.40, 0.33]]       # je Jahr
PR_ANTEIL = [0.46, 0.34, 0.20]
SAISON = [0.23, 0.24, 0.25, 0.28]


def verteilen(summe, anteile):
    summe = round(summe)
    roh = [summe * a / sum(anteile) for a in anteile]
    ganz = [int(r) for r in roh]
    for i in sorted(range(len(roh)), key=lambda i: roh[i] - ganz[i], reverse=True)[:summe - sum(ganz)]:
        ganz[i] += 1
    return ganz


# Grundgewicht je Zelle (Quartal, Standort, Produkt) und Jahr; je Größe eigener Streufaktor je Standort/Produkt
zellen = [(q, s, p) for q in range(4) for s in range(3) for p in range(3)]
streu = {f: {(s, p): rnd.uniform(0.8, 1.2) for s in range(3) for p in range(3)} for f in FELDER}
for f in ("kapital", "kapitalkosten"):                 # WACC je Zelle konstant 6 %: gleiche Verteilung wie Kapital
    streu[f] = streu["kapital"]
saetze = []
werte = {}
for j in range(3):
    for f in FELDER:
        a = [ST_ANTEIL[j][s] * PR_ANTEIL[p] * SAISON[q] * streu[f][(s, p)] * rnd.uniform(0.95, 1.05) for q, s, p in zellen]
        if f == "kapitalkosten":
            a = werte[(j, "kapital_anteile")]
        if f == "kapital":
            werte[(j, "kapital_anteile")] = a
        werte[(j, f)] = verteilen(JAHRESWERTE[f][j], a)
    for i, (q, s, p) in enumerate(zellen):
        saetze.append([j, q, s, p] + [werte[(j, f)][i] for f in FELDER])

json.dump({"jahre": JAHRE, "standorte": STANDORTE, "produkte": PRODUKTE, "perspektiven": PERSPEKTIVEN,
           "felder": FELDER, "kennzahlen": KENNZAHLEN, "saetze": saetze},
          open(os.path.join(HIER, "bcr_olap.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
with open(os.path.join(HIER, "bcr_olap.csv"), "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh, delimiter=";", lineterminator="\r\n")
    w.writerow(["Jahr", "Quartal", "Standort", "Produkt"] + FELDER)
    for z in saetze:
        w.writerow([JAHRE[z[0]], f"Q{z[1] + 1}", STANDORTE[z[2]], PRODUKTE[z[3]]] + z[4:])

# Kontrollausgabe: Konzernwerte je Jahr wie im Original
idx = {f: 4 + i for i, f in enumerate(FELDER)}
for j, jahr in enumerate(JAHRE):
    s = {f: sum(z[idx[f]] for z in saetze if z[0] == j) for f in FELDER}
    zeile = []
    for k in KENNZAHLEN[:13]:
        v = sum(s[x] for x in k[4]) / (s[k[5]] if k[5] else 1) * k[6]
        zeile.append(f"{k[2]} {v:,.{k[7]}f}".replace(",", "X").replace(".", ",").replace("X", "."))
    print(jahr, " · ".join(zeile))
print(f"{len(saetze)} Sätze, {len(FELDER)} Basisgrößen")
