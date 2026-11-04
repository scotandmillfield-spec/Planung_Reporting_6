"""Daten für Abb. 3.30 „Exemplarischer Bericht in Anlehnung an das Grundraster“ (6. Auflage): Segmenterfolgsbericht.

Sparte A über alle Vertriebswege = Werte des Originals (5. Auflage, „Jan 11“ → Januar 2027, Stand 04.02.2027):
- Januar kumuliert, Ist und Plan: euro-genaue Werte, die jede Zahl des Originals reproduzieren (Ist, Plan, ΔPL, ΔPL %,
  auch Gesamtleistung, Gesamtkosten und Erfolg). Ermittelt per linearer Optimierung (größter Abstand zu den
  Rundungsgrenzen) und hier fest eingetragen; die Prüfung unten rechnet sie gegen die Anzeige des Originals nach.
- Forecast und Plan Gesamtjahr: ganze Tsd. € des Originals (in sich stimmig).
- Cash-to-Cash-Cycle (Tage): Debitorenziel 31, Kreditorenziel 39, Erzeugnisumschlag 10, Materialumschlag 63, Zyklus 64
  wie im Original (mit einer Nachkommastelle so gewählt, dass die Rechnung D + M + E − K aufgeht). Planwerte erfunden.
Erfunden: Sparten B und C, Aufteilung auf drei Vertriebswege (fester Seed), Planwerte des Cash-to-Cash-Cycle,
Kommentare der Sparten B und C sowie die Gesamtsicht. Namen der Verantwortlichen frei erfunden.
Ausgabe: segmentbericht.json und segmentbericht.csv (Einzelsätze Sparte × Vertriebsweg × Position, Beträge in €).
"""
import csv
import json
import os
import random
from decimal import Decimal, ROUND_HALF_UP

HIER = os.path.dirname(os.path.abspath(__file__))
rng = random.Random(330)

SPARTEN = ["Sparte A", "Sparte B", "Sparte C"]
WEGE = ["Fachhandel", "Direktvertrieb", "Online"]
# Schlüssel, Bezeichnung, Wirkung (+1 Anstieg günstig, −1 ungünstig), Gruppe (L = Leistung, K = Kosten)
POSITIONEN = [("U", "Umsatzerlöse", 1, "L"), ("S", "Sonstige Einnahmen", 1, "L"), ("B", "Bestandsveränderungen", 1, "L"),
              ("M", "Materialkosten", -1, "K"), ("F", "Fremdleistungen", -1, "K"), ("Pe", "Personalkosten", -1, "K"),
              ("Ab", "Abschreibungen", -1, "K"), ("So", "Sonstige Kosten", -1, "K")]
PK = [p[0] for p in POSITIONEN]

# Je Sparte und Position: Januar Ist, Januar Plan, Forecast Jahr, Plan Jahr – in €
A_MONAT = {"U": (137503, 118381), "S": (16902, 18828), "B": (41797, 33294), "M": (41775, 45503),
           "F": (10393, 12875), "Pe": (45769, 37503), "Ab": (8503, 7801), "So": (7263, 6497)}
A_JAHR = {"U": (1050, 1000), "S": (203, 250), "B": (454, 400), "M": (503, 500), "F": (121, 150), "Pe": (549, 450),
          "Ab": (97, 100), "So": (85, 100)}                                   # Tsd. €, Original
B_MONAT = {"U": (96.4, 102.0), "S": (6.2, 6.0), "B": (-3.1, 2.0), "M": (38.5, 36.0), "F": (8.2, 8.0), "Pe": (27.9, 28.5),
           "Ab": (6.1, 6.0), "So": (5.3, 5.5)}
B_JAHR = {"U": (1180, 1220), "S": (70, 70), "B": (10, 20), "M": (452, 430), "F": (96, 95), "Pe": (338, 340),
          "Ab": (72, 72), "So": (64, 66)}
C_MONAT = {"U": (41.8, 40.0), "S": (1.2, 1.5), "B": (2.4, 2.0), "M": (16.2, 16.5), "F": (3.9, 4.0), "Pe": (14.6, 14.0),
           "Ab": (3.2, 3.2), "So": (2.6, 2.5)}
C_JAHR = {"U": (505, 480), "S": (15, 18), "B": (20, 20), "M": (196, 192), "F": (48, 48), "Pe": (172, 168),
          "Ab": (38, 38), "So": (31, 30)}
EUR = lambda t: round(t * 1000)
WERTE = {0: {k: (*A_MONAT[k], EUR(A_JAHR[k][0]), EUR(A_JAHR[k][1])) for k in PK},
         1: {k: (EUR(B_MONAT[k][0]), EUR(B_MONAT[k][1]), EUR(B_JAHR[k][0]), EUR(B_JAHR[k][1])) for k in PK},
         2: {k: (EUR(C_MONAT[k][0]), EUR(C_MONAT[k][1]), EUR(C_JAHR[k][0]), EUR(C_JAHR[k][1])) for k in PK}}

# Anteile der Vertriebswege je Sparte (Leistung bzw. Kosten); Ist und Forecast streuen um den Plananteil
ANTEIL = {0: ([0.50, 0.30, 0.20], [0.48, 0.32, 0.20]),
          1: ([0.35, 0.55, 0.10], [0.36, 0.52, 0.12]),
          2: ([0.20, 0.15, 0.65], [0.22, 0.18, 0.60])}


def aufteilen(gesamt, gewichte):
    """Ganzzahlige Aufteilung (€) nach Gewichten, Summe exakt (größte Reste), auch für negative Summen."""
    vz = -1 if gesamt < 0 else 1
    g = abs(gesamt)
    roh = [g * w / sum(gewichte) for w in gewichte]
    teile = [int(r) for r in roh]
    for i in sorted(range(len(roh)), key=lambda i: roh[i] - teile[i], reverse=True)[: g - sum(teile)]:
        teile[i] += 1
    return [vz * t for t in teile]


zeilen = []                                   # Sparte, Weg, Position, Januar Ist, Januar Plan, Forecast, Plan Jahr (€)
for s in range(3):
    for p, (k, _, _, gruppe) in enumerate(POSITIONEN):
        basis = ANTEIL[s][0 if gruppe == "L" else 1]
        ist_gew = [b * rng.uniform(0.88, 1.12) for b in basis]
        spalten = []
        for j, wert in enumerate(WERTE[s][k]):
            gew = basis if j in (1, 3) else [g * rng.uniform(0.97, 1.03) for g in ist_gew]
            spalten.append(aufteilen(wert, gew))
        for w in range(3):
            zeilen.append([s, w, p] + [spalten[j][w] for j in range(4)])

# ---------- Prüfung: Sparte A über alle Wege zeigt genau die Zahlen des Originals ----------
ORIGINAL = {  # Januar: Ist, Plan, ΔPL, ΔPL % · Forecast: FC, Plan, ΔPL, ΔPL %
    "U": (138, 118, 19, 16.2, 1050, 1000, 50, 5.0), "S": (17, 19, -2, -10.2, 203, 250, -47, -18.8),
    "B": (42, 33, 9, 25.5, 454, 400, 54, 13.5), "GL": (196, 171, 26, 15.1, 1707, 1650, 57, 3.5),
    "M": (42, 46, -4, -8.2, 503, 500, 3, 0.6), "F": (10, 13, -2, -19.3, 121, 150, -29, -19.3),
    "Pe": (46, 38, 8, 22.0, 549, 450, 99, 22.0), "Ab": (9, 8, 1, 9.0, 97, 100, -3, -3.0),
    "So": (7, 6, 1, 11.8, 85, 100, -15, -15.0), "GK": (114, 110, 4, 3.2, 1355, 1300, 55, 4.2),
    "E": (82, 60, 22, 36.8, 352, 350, 2, 0.6)}


def rd(v, nk=0):
    return float(Decimal(repr(v)).quantize(Decimal(1).scaleb(-nk), rounding=ROUND_HALF_UP))


def summe(sparte, keys, j):
    return sum(z[3 + j] for z in zeilen if z[0] == sparte and PK[z[2]] in keys)


L, K = [p[0] for p in POSITIONEN if p[3] == "L"], [p[0] for p in POSITIONEN if p[3] == "K"]
for key, soll in ORIGINAL.items():
    for t, (ji, jp) in enumerate(((0, 1), (2, 3))):
        if key == "E":
            i = summe(0, L, ji) - summe(0, K, ji); p = summe(0, L, jp) - summe(0, K, jp)
        else:
            keys = L if key == "GL" else K if key == "GK" else [key]
            i, p = summe(0, keys, ji), summe(0, keys, jp)
        ist = (rd(i / 1000), rd(p / 1000), rd((i - p) / 1000), rd(100 * (i - p) / p, 1))
        assert ist == tuple(float(x) for x in soll[4 * t: 4 * t + 4]), (key, t, ist, soll)
print("Sparte A, alle Vertriebswege: alle 88 Zahlen des Originals reproduziert")

# ---------- Cash-to-Cash-Cycle (Tage) ----------
# Kreditorenziel und Materialumschlag je Sparte (gewichtet mit Materialkosten), Debitorenziel und Erzeugnisumschlag
# je Sparte und Vertriebsweg (gewichtet mit Umsatz); Online-Wert so gelöst, dass die Sparte den Zielwert trifft.
C2C_SPARTE = {0: {"K": (39.2, 40.0), "M": (62.7, 50.0), "D": (30.8, 30.0), "E": (9.7, 10.0)},
              1: {"K": (45.0, 45.0), "M": (41.0, 40.0), "D": (36.0, 35.0), "E": (14.0, 12.0)},
              2: {"K": (30.0, 30.0), "M": (35.0, 35.0), "D": (18.0, 20.0), "E": (8.0, 8.0)}}
C2C_WEGE = {0: {"D": (36.0, 28.0), "E": (11.0, 9.0)}, 1: {"D": (42.0, 34.0), "E": (16.0, 13.5)},
            2: {"D": (30.0, 26.0), "E": (10.0, 9.0)}}
c2c = {"sparte": [], "wege": []}
for s in range(3):
    c2c["sparte"].append({k: list(v) for k, v in C2C_SPARTE[s].items()})
    umsatz = [sum(z[3] for z in zeilen if z[0] == s and z[1] == w and PK[z[2]] == "U") for w in range(3)]
    je = {}
    for k in ("D", "E"):
        a, b = C2C_WEGE[s][k]
        ziel = C2C_SPARTE[s][k][0]
        x = (ziel * sum(umsatz) - a * umsatz[0] - b * umsatz[1]) / umsatz[2]
        assert 3 < x < 60, (s, k, x)
        je[k] = [a, b, round(x, 2)]
    c2c["wege"].append(je)

# ---------- Kommentare je Sparte (Verknüpfung: Position oder c2c:Kennzahl) ----------
KOMMENTARE = {
    "0": {"status": [["Umsatzprognose wegen vieler Neukunden nach oben korrigiert", ["U"]],
                     ["Daraufhin Personal vorzeitig aufgebaut (vorgezogene Einstellungen)", ["Pe"]],
                     ["Materialumschlag wegen Produktionsstörungen zu hoch", ["c2c:M"]]],
          "massnahmen": [["Verkaufsschulungen für die neuen Kräfte", "Herr Seidel", "02/2027", ["Pe", "U"]],
                         ["Spitzen über Fremdarbeitskräfte abdecken", "Frau Haas", "laufend", ["F"]],
                         ["Aggregate reparieren, Ersatz prüfen", "Herr Roth", "04/2027", ["c2c:M"]]]},
    "1": {"status": [["Umsatz unter Plan: Preisnachlässe bei Großkunden", ["U"]],
                     ["Materialkosten über Plan wegen gestiegener Stahlpreise", ["M"]],
                     ["Fertigwarenlager wird abgebaut, Umschlag noch zu langsam", ["B", "c2c:E"]]],
          "massnahmen": [["Preisgleitklauseln in Rahmenverträgen", "Frau Brandt", "03/2027", ["U", "M"]],
                         ["Zweitlieferanten für Stahl qualifizieren", "Herr Tal", "06/2027", ["M"]],
                         ["Reichweite der Fertigwaren senken", "Frau Kühn", "laufend", ["B", "c2c:E"]]]},
    "2": {"status": [["Online-Nachfrage über Plan, Umsatzprognose angehoben", ["U"]],
                     ["Personalkosten über Plan durch Aushilfen im Versand", ["Pe"]],
                     ["Onlinekunden zahlen schneller als geplant", ["c2c:D"]]],
          "massnahmen": [["Versandprozess automatisieren", "Herr Kluge", "05/2027", ["Pe"]],
                         ["Sortiment im Onlineshop erweitern", "Frau Weber", "09/2027", ["U"]]]},
    "alle": {"status": [["Sparte A über Plan, Personalaufbau belastet den Forecast", ["Pe"]],
                        ["Sparte B unter Plan: Preisdruck und höhere Stahlpreise", ["U", "M"]],
                        ["Sparte C: Onlinegeschäft wächst schneller als geplant", ["U"]]],
             "massnahmen": [["Verkaufsschulungen neue Kräfte (Sparte A)", "Herr Seidel", "02/2027", ["Pe"]],
                            ["Preisgleitklauseln verhandeln (Sparte B)", "Frau Brandt", "03/2027", ["U", "M"]],
                            ["Aggregate reparieren (Sparte A)", "Herr Roth", "04/2027", ["c2c:M"]]]},
}

json.dump({"stand": "04.02.2027", "monat": "Januar", "jahr": 2027, "sparten": SPARTEN, "wege": WEGE,
           "positionen": [list(p) for p in POSITIONEN],
           # Zeile: Sparte, Vertriebsweg, Position, Januar Ist, Januar Plan, Forecast Jahr, Plan Jahr (€)
           "zeilen": zeilen, "c2c": c2c, "kommentare": KOMMENTARE},
          open(os.path.join(HIER, "segmentbericht.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
with open(os.path.join(HIER, "segmentbericht.csv"), "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh, delimiter=";", lineterminator="\r\n")
    w.writerow(["Sparte", "Vertriebsweg", "Position", "Januar_Ist_EUR", "Januar_Plan_EUR", "Forecast_2027_EUR", "Plan_2027_EUR"])
    for s, v, p, *b in zeilen:
        w.writerow([SPARTEN[s], WEGE[v], POSITIONEN[p][1], *b])

# Kontrollausgabe je Sparte (Tsd. €)
for s in range(3):
    gl = [summe(s, L, j) / 1000 for j in range(4)]
    gk = [summe(s, K, j) / 1000 for j in range(4)]
    e = [a - b for a, b in zip(gl, gk)]
    print(f"{SPARTEN[s]}: Gesamtleistung {gl[0]:.1f}/{gl[1]:.1f} FC {gl[2]:.0f}/{gl[3]:.0f} · "
          f"Gesamtkosten {gk[0]:.1f}/{gk[1]:.1f} FC {gk[2]:.0f}/{gk[3]:.0f} · Erfolg {e[0]:.1f}/{e[1]:.1f} FC {e[2]:.0f}/{e[3]:.0f}")
print("Cash-to-Cash je Weg:", json.dumps(c2c["wege"]))
