"""Daten für Abb. 3.66 „Geo-Visualisierung“: Marktpotenzial und Umsatzentwicklung je Bundesland.

Softwareneutraler Nachbau eines Kartenberichts (Original: US-Bundesstaaten, Flächenfärbung „Market Potential“,
Mini-Säulen „Change Q3 vs Q2“ und „Change Q4 vs Q3“, Symbole für Vertriebsbüros, Register „States“ und „Sales
Region“). Hier die 16 Bundesländer als Kachelkarte (Zeile, Spalte), vier Vertriebsregionen, Jahr 2027.
Alle Werte erfunden: Marktpotenzial in Mio. € p. a., Umsatz je Quartal in Tsd. €, Vertriebsbüros mit Ort.
Ausgabe: geo.json und geo.csv.
"""
import csv
import json
import os

HIER = os.path.dirname(os.path.abspath(__file__))
REGIONEN = ["Nord", "Ost", "Süd", "West"]
# Kürzel, Name, Region, Zeile, Spalte, Potenzial (Mio. €), Umsatz Q2 (Tsd. €), Δ Q3 (%), Δ Q4 (%), Vertriebsbüros
LAENDER = [
    ("SH", "Schleswig-Holstein", "Nord", 0, 2, 330, 3420, 1.2, -0.8, []),
    ("HB", "Bremen", "Nord", 1, 1, 95, 1080, -1.5, -2.2, []),
    ("HH", "Hamburg", "Nord", 1, 2, 360, 4210, 2.5, 1.4, ["Hamburg"]),
    ("MV", "Mecklenburg-Vorpommern", "Ost", 1, 3, 160, 1390, 3.1, 2.4, []),
    ("NW", "Nordrhein-Westfalen", "West", 2, 0, 1920, 21480, 1.8, 0.5, ["Düsseldorf", "Köln", "Dortmund"]),
    ("NI", "Niedersachsen", "Nord", 2, 1, 860, 9350, 0.6, -1.9, ["Hannover"]),
    ("ST", "Sachsen-Anhalt", "Ost", 2, 2, 220, 2060, 1.9, 0.7, []),
    ("BE", "Berlin", "Ost", 2, 3, 470, 4980, 4.2, 3.6, ["Berlin"]),
    ("BB", "Brandenburg", "Ost", 2, 4, 280, 2510, 2.8, 3.1, []),
    ("RP", "Rheinland-Pfalz", "West", 3, 0, 440, 4630, -0.4, 0.9, []),
    ("HE", "Hessen", "West", 3, 1, 780, 8890, 1.1, -0.6, ["Frankfurt am Main"]),
    ("TH", "Thüringen", "Ost", 3, 2, 230, 2140, 0.9, 1.5, []),
    ("SN", "Sachsen", "Ost", 3, 3, 420, 4120, 3.4, 2.2, ["Leipzig"]),
    ("SL", "Saarland", "West", 4, 0, 110, 1170, -2.1, -3.0, []),
    ("BW", "Baden-Württemberg", "Süd", 4, 1, 1480, 17260, 0.8, -3.4, ["Stuttgart", "Mannheim"]),
    ("BY", "Bayern", "Süd", 4, 2, 1760, 19870, 2.2, 1.1, ["München", "Nürnberg"]),
]
zeilen = []
for k, n, r, z, s, pot, q2, d3, d4, b in LAENDER:
    q3 = round(q2 * (1 + d3 / 100))
    q4 = round(q3 * (1 + d4 / 100))
    zeilen.append([k, n, REGIONEN.index(r), z, s, pot, [q2, q3, q4], b])

json.dump({"jahr": 2027, "regionen": REGIONEN, "klassen": [200, 400, 800, 1600], "laender": zeilen},
          open(os.path.join(HIER, "geo.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
with open(os.path.join(HIER, "geo.csv"), "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh, delimiter=";", lineterminator="\r\n")
    w.writerow(["Kuerzel", "Bundesland", "Region", "Marktpotenzial_Mio_EUR", "Umsatz_Q2_Tsd_EUR", "Umsatz_Q3_Tsd_EUR",
                "Umsatz_Q4_Tsd_EUR", "Vertriebsbueros", "Kachel_Zeile", "Kachel_Spalte"])
    for k, n, r, z, s, pot, (q2, q3, q4), b in zeilen:
        w.writerow([k, n, REGIONEN[r], pot, q2, q3, q4, ", ".join(b), z + 1, s + 1])
pot = sum(x[5] for x in zeilen)
u = [sum(x[6][i] for x in zeilen) for i in range(3)]
print("Potenzial gesamt", pot, "Mio. € | Umsatz Q2/Q3/Q4", u, "Tsd. € | ΔQ3 %+.1f %% ΔQ4 %+.1f %%" % ((u[1] / u[0] - 1) * 100, (u[2] / u[1] - 1) * 100))
print("Top 3 Potenzial-Anteil %.1f %%" % (sum(sorted((x[5] for x in zeilen), reverse=True)[:3]) / pot * 100),
      "| Büros", sum(len(x[7]) for x in zeilen))
for x in zeilen:
    q2, q3, q4 = x[6]
    print(x[0], x[5], "ΔQ3 %+.1f ΔQ4 %+.1f" % ((q3 / q2 - 1) * 100, (q4 / q3 - 1) * 100))
for j, r in enumerate(REGIONEN):
    xs = [x for x in zeilen if x[2] == j]
    a = [sum(x[6][i] for x in xs) for i in range(3)]
    print(r, "Potenzial", sum(x[5] for x in xs), "ΔQ4 %+.1f %%" % ((a[2] / a[1] - 1) * 100))
