"""Daten für Abb. 3.71 „Beispiel Chartanalysediagramm“: Tageskurse (Eröffnung, Hoch, Tief, Schluss in €) einer
namenlosen Aktie A, 14.10.2026 bis 14.07.2027 (190 Handelstage), dazu 50 Handelstage Vorlauf für die gleitenden Durchschnitte.

Der Verlauf ist in Anlehnung an das Original erfunden: Stützwerte alle vier Handelstage aus dem Original
abgelesen (Zeitachse um 16 Jahre verschoben), dazwischen ein Zufallspfad mit festem Seed. Festgehalten sind die
im Original beschrifteten Marken: Hoch 43,33 €, Tief danach 37,82 €, Unterstützung 33,53 € (Tief der Kursspitze im
März), letzter Tag Eröffnung 43,00, Hoch 43,00, Tief 42,70, Schluss 42,88 € (+0,175 € zum Vortag).
Trendlinien und Szenarioskizzen (Analystenzeichnung) stehen als Stützpunkte (Handelstag, Kurs) in der JSON-Datei;
der Kursverlauf hält sie ein (Abwärtstrend bis zum Ausbruch, Dreieck bis zum Ausbruch nach oben).
Ausgabe: chart.json und chart.csv.
"""
import csv
import datetime as dt
import json
import os
import random

HIER = os.path.dirname(os.path.abspath(__file__))
rnd = random.Random(371)
FREI = {"2026-12-24", "2026-12-25", "2026-12-31", "2027-01-01", "2027-03-26", "2027-03-29"}


def handelstage(start, n, rueck=False):
    d, out = dt.date.fromisoformat(start), []
    while len(out) < n:
        if d.weekday() < 5 and d.isoformat() not in FREI:
            out.append(d.isoformat())
        d += dt.timedelta(days=-1 if rueck else 1)
    return out[::-1] if rueck else out


VOR, N, ZUK = 50, 190, 24
sichtbar = handelstage("2026-10-14", N + ZUK)
tage = handelstage("2026-10-13", VOR, rueck=True) + sichtbar[:N]
zukunft = sichtbar[N:]

# Stützwerte Schlusskurs (Handelstag im sichtbaren Bereich, Kurs), aus dem Original abgelesen
STUETZ = [(-50, 29.4), (-30, 29.9), (-12, 30.5), (0, 31.0), (2, 31.12), (6, 32.43), (10, 33.69), (14, 33.25), (18, 32.9),
          (22, 32.54), (26, 32.63), (30, 32.5), (34, 32.1), (38, 33.67), (42, 34.27), (46, 34.95), (50, 35.62),
          (54, 36.24), (58, 36.27), (62, 35.99), (66, 35.54), (70, 34.2), (73, 34.4), (74, 38.0), (78, 38.13),
          (82, 38.92), (86, 38.91), (90, 39.17), (94, 38.11), (98, 39.0), (102, 38.52), (106, 36.9), (108, 35.3),
          (110, 36.24), (114, 37.64), (118, 38.45), (122, 39.47), (126, 40.31), (130, 39.47), (134, 39.8),
          (137, 41.0), (138, 42.6), (142, 42.16), (146, 41.62), (150, 41.06), (154, 40.3), (158, 39.34),
          (161, 38.2), (164, 40.1), (166, 39.7), (170, 39.32), (174, 39.09), (177, 38.6), (178, 40.5), (179, 40.1),
          (180, 39.8), (181, 39.5), (182, 39.6), (183, 39.4)]
# Analystenzeichnung (Handelstag, Kurs); Tage > 189 liegen in der Zukunft
ANALYSE = {
    "abwaertstrend": [[138, 43.33], [164, 40.90]],          # vom Hoch durch das nächste tiefere Hoch, verlängert
    "dreieck_oben": [[164, 40.90], [179, 40.72]],
    "dreieck_unten": [[161, 37.82], [177, 38.23]],
    "unterstuetzung": 33.53,
    "szenario_bevorzugt": [[190, 43.0], [194, 44.0], [200, 42.1], [210, 46.2]],
    "szenario_alternativ": [[176, 37.7], [195, 37.7], [201, 33.9], [206, 34.9]],
    "hoch": [138, 43.33], "tief": [161, 37.82],
}


def linie(p, d, verl=None):
    (d0, k0), (d1, k1) = p
    return k0 + (k1 - k0) * (d - d0) / (d1 - d0)


# Schlusskurse: Stützwerte linear verbunden plus Brücke eines Zufallspfads (an den Stützstellen null)
schluss = {}
for (a, ka), (b, kb) in zip(STUETZ, STUETZ[1:]):
    w = [0.0]
    for _ in range(b - a):
        w.append(w[-1] + rnd.gauss(0, 0.30))
    for i in range(b - a + 1):
        schluss[a + i] = ka + (kb - ka) * i / (b - a) + w[i] - w[-1] * i / (b - a)
# Feste Kerzen (Eröffnung, Hoch, Tief, Schluss): Kurssprung Februar, Kursspitze März, Hoch, Tief, Ausbruch am Ende
FEST = {74: (34.9, 38.3, 34.8, 38.0), 108: (36.3, 36.5, 33.53, 35.3), 138: (41.5, 43.33, 41.3, 42.6),
        161: (38.5, 38.6, 37.82, 38.2), 164: (39.2, 40.90, 39.1, 40.1), 177: (38.9, 39.1, 38.23, 38.6),
        178: (38.6, 40.72, 38.5, 40.5),
        184: (39.3, 40.46, 39.1, 40.3), 185: (40.2, 41.31, 39.9, 41.1), 186: (41.0, 41.57, 40.6, 41.4),
        187: (41.3, 42.71, 41.1, 42.5), 188: (42.4, 42.95, 42.0, 42.705), 189: (43.00, 43.00, 42.70, 42.88)}
kerzen = []
for d in range(-VOR, N):
    if d in FEST:
        kerzen.append(list(FEST[d]))
        continue
    c = schluss[d]
    o = (kerzen[-1][3] if kerzen else c) + rnd.gauss(0, 0.14)
    h = max(o, c) + abs(rnd.gauss(0, 0.20))
    l = min(o, c) - abs(rnd.gauss(0, 0.20))
    # Analysezeichnung einhalten: Abwärtstrend und Dreieck bis zum Ausbruch, Tief und Unterstützung
    deckel = []
    if 139 <= d <= 177:
        deckel.append(linie(ANALYSE["abwaertstrend"], d) - 0.03 - abs(rnd.gauss(0, 0.05)))
    if 165 <= d <= 183:
        deckel.append(linie(ANALYSE["dreieck_oben"], d) - 0.03 - abs(rnd.gauss(0, 0.05)))
    if d < 138:
        deckel.append(43.1)
    if deckel:
        cap = min(deckel)
        h = min(h, cap); o = min(o, cap - 0.02); c = min(c, cap - 0.02)
    boden = 33.6 if 100 <= d < 138 else None
    if 139 <= d <= 183:
        boden = 37.9 if d < 161 else linie(ANALYSE["dreieck_unten"], d) + 0.03 + abs(rnd.gauss(0, 0.05))
    if boden is not None:
        l = max(l, boden); o = max(o, boden + 0.02); c = max(c, boden + 0.02)
    h, l = max(h, o, c), min(l, o, c)
    kerzen.append([o, h, l, c])
kerzen = [[round(x, 2) if i != 3 or abs(x - 42.705) > 1e-9 else x for i, x in enumerate(k)] for k in kerzen]
for o, h, l, c in kerzen:
    assert l <= min(o, c) <= max(o, c) <= h, (o, h, l, c)

json.dump({"tage": tage, "start": VOR, "zukunft": zukunft, "kerzen": kerzen, "analyse": ANALYSE},
          open(os.path.join(HIER, "chart.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
de = lambda v: (f"{v:.3f}" if abs(v * 100 - round(v * 100)) > 1e-6 else f"{v:.2f}").replace(".", ",")
with open(os.path.join(HIER, "chart.csv"), "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh, delimiter=";", lineterminator="\r\n")
    w.writerow(["Datum", "Eroeffnung_EUR", "Hoch_EUR", "Tief_EUR", "Schluss_EUR"])
    for t, (o, h, l, c) in zip(tage, kerzen):
        w.writerow([t, de(o), de(h), de(l), de(c)])

# Kontrollausgabe
sicht = kerzen[VOR:]
hi = max(range(N), key=lambda i: sicht[i][1])
lo2 = min(range(hi, N), key=lambda i: sicht[i][2])
lo_m = min(range(90, 130), key=lambda i: sicht[i][2])
gd = lambda n, i: sum(k[3] for k in kerzen[VOR + i - n + 1:VOR + i + 1]) / n
print(f"Zeitraum {tage[VOR]} bis {tage[-1]} ({N} Handelstage, Vorlauf ab {tage[0]}), Skizze bis {zukunft[-1]}")
print(f"Hoch {sicht[hi][1]:.2f} am {tage[VOR + hi]} (Tag {hi}); Tief danach {sicht[lo2][2]:.2f} am {tage[VOR + lo2]} (Tag {lo2})")
print(f"Märztief {sicht[lo_m][2]:.2f} am {tage[VOR + lo_m]}; letzter Tag {sicht[-1]}, Vortag Schluss {sicht[-2][3]}")
print(f"GD 20 {gd(20, N - 1):.3f}, GD 50 {gd(50, N - 1):.3f}")
print("Abwärtstrend am letzten Tag {:.2f}, Dreieck oben {:.2f}, unten {:.2f}".format(
    linie(ANALYSE["abwaertstrend"], N - 1), linie(ANALYSE["dreieck_oben"], N - 1), linie(ANALYSE["dreieck_unten"], N - 1)))
