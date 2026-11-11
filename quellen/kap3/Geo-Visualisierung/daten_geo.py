"""Daten für Abb. 3.66 „Geo-Visualisierung“: Marktpotenzial und Umsatzentwicklung je Bundesland.

Eigene Abbildung: Karte der 16 Bundesländer mit Flächenfärbung nach Marktpotenzial, Vertriebsbüros an ihrem
Standort, vier Vertriebsregionen, Jahr 2027. Alle Werte erfunden: Marktpotenzial in Mio. € p. a., Umsatz je
Quartal in Tsd. €, Vertriebsbüros mit Ort.

Kartengrundlage: bundeslaender.topojson – Grenzen der Länder aus Natural Earth (Admin-1, 1:10 Mio., gemeinfrei),
als TopoJSON aus dem npm-Paket datamaps 0.5.10 (MIT, dist/datamaps.deu.js). Das Skript projiziert die Grenzen
(abstandstreue Zylinderprojektion mit Breitenkorrektur bei 51° N), vereinfacht sie je Kante (Douglas-Peucker, so dass
gemeinsame Grenzen deckungsgleich bleiben) und legt SVG-Pfade in einem Koordinatensystem 1000 Einheiten breit ab.
Ausgabe: geo.json und geo.csv.
"""
import csv
import json
import math
import os

HIER = os.path.dirname(os.path.abspath(__file__))
REGIONEN = ["Nord", "Ost", "Süd", "West"]
# Kürzel, Name, Region, Zeile, Spalte (frühere Kachelkarte, nur noch Reihenfolge), Potenzial (Mio. €), Umsatz Q2 (Tsd. €), Δ Q3 (%), Δ Q4 (%), Vertriebsbüros
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


# ---------------------------------------------------------------- Karte
LAT0 = 51.0
KX = math.cos(math.radians(LAT0))
TOL = 0.9                     # Vereinfachung in Karteneinheiten (Karte 1000 breit, gedruckt ≈ 300 px)
# Standorte der Vertriebsbüros (Länge, Breite)
ORTE = {"Hamburg": (9.99, 53.55), "Düsseldorf": (6.78, 51.23), "Köln": (6.96, 50.94), "Dortmund": (7.47, 51.51),
        "Hannover": (9.74, 52.37), "Berlin": (13.40, 52.52), "Frankfurt am Main": (8.68, 50.11),
        "Leipzig": (12.37, 51.34), "Stuttgart": (9.18, 48.78), "Mannheim": (8.47, 49.49), "München": (11.58, 48.14),
        "Nürnberg": (11.08, 49.45)}
# Lage der Landeskürzel (Länge, Breite); bei Stadtstaaten außerhalb mit Hinweislinie zum Punkt „an“
KUERZEL = {"SH": (9.55, 54.25), "HH": (10.95, 53.62, 10.08, 53.57), "HB": (7.95, 53.32, 8.72, 53.12),
           "MV": (12.45, 53.78), "NW": (7.75, 51.95), "NI": (9.35, 52.75), "ST": (11.65, 52.05),
           "BE": (14.35, 52.78, 13.55, 52.55), "BB": (13.35, 51.95), "RP": (7.35, 49.95), "HE": (9.05, 50.6),
           "TH": (11.0, 50.85), "SN": (13.35, 51.0), "SL": (6.25, 49.15, 6.85, 49.38), "BW": (9.05, 48.45),
           "BY": (11.55, 49.05)}


def _dp(pts, tol):
    if len(pts) < 3:
        return pts
    (x1, y1), (x2, y2) = pts[0], pts[-1]
    dx, dy = x2 - x1, y2 - y1
    n = math.hypot(dx, dy)
    best, idx = -1.0, 0
    for i in range(1, len(pts) - 1):
        x, y = pts[i]
        d = abs(dy * (x - x1) - dx * (y - y1)) / n if n else math.hypot(x - x1, y - y1)
        if d > best:
            best, idx = d, i
    if best <= tol:
        return [pts[0], pts[-1]]
    return _dp(pts[:idx + 1], tol)[:-1] + _dp(pts[idx:], tol)


def karte():
    topo = json.load(open(os.path.join(HIER, "bundeslaender.topojson"), encoding="utf-8"))
    (sx, sy), (tx, ty) = topo["transform"]["scale"], topo["transform"]["translate"]
    arcs_ll = []
    for a in topo["arcs"]:
        x = y = 0
        pts = []
        for dx, dy in a:
            x += dx
            y += dy
            pts.append((x * sx + tx, y * sy + ty))
        arcs_ll.append(pts)
    lon_min = min(p[0] for a in arcs_ll for p in a)
    lon_max = max(p[0] for a in arcs_ll for p in a)
    lat_min = min(p[1] for a in arcs_ll for p in a)
    lat_max = max(p[1] for a in arcs_ll for p in a)
    k = 1000 / ((lon_max - lon_min) * KX)
    proj = lambda lon, lat: (round((lon - lon_min) * KX * k, 1), round((lat_max - lat) * k, 1))
    arcs = [_dp([proj(*p) for p in a], TOL) for a in arcs_ll]

    def ring(idx):
        pts = []
        for i in idx:
            a = arcs[i] if i >= 0 else arcs[~i][::-1]
            pts += a if not pts else a[1:]
        return "M" + "L".join(f"{x:g},{y:g}" for x, y in pts) + "Z"

    namen = {n: kz for kz, n, *_ in LAENDER}
    pfade = {}
    for g in topo["objects"]["deu"]["geometries"]:
        polys = [g["arcs"]] if g["type"] == "Polygon" else g["arcs"]
        pfade[namen[g["properties"]["name"]]] = "".join(ring(r) for p in polys for r in p)
    lab = {kz: [*proj(*v[:2])] + ([*proj(*v[2:])] if len(v) > 2 else []) for kz, v in KUERZEL.items()}
    orte = {o: [*proj(*ll)] for o, ll in ORTE.items()}
    return {"breite": 1000, "hoehe": round((lat_max - lat_min) * k, 1), "pfade": pfade, "kuerzel": lab, "orte": orte}

json.dump({"jahr": 2027, "regionen": REGIONEN, "klassen": [200, 400, 800, 1600], "laender": zeilen, "karte": karte()},
          open(os.path.join(HIER, "geo.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
with open(os.path.join(HIER, "geo.csv"), "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh, delimiter=";", lineterminator="\r\n")
    w.writerow(["Kuerzel", "Bundesland", "Region", "Marktpotenzial_Mio_EUR", "Umsatz_Q2_Tsd_EUR", "Umsatz_Q3_Tsd_EUR",
                "Umsatz_Q4_Tsd_EUR", "Vertriebsbueros"])
    for k, n, r, z, s, pot, (q2, q3, q4), b in zeilen:
        w.writerow([k, n, REGIONEN[r], pot, q2, q3, q4, ", ".join(b)])
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
