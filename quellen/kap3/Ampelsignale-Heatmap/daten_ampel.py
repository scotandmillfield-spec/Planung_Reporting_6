"""Daten für Abb. 3.64 „Ampelsignale/Heatmap“: vier Berichtselemente mit Signal- bzw. Farbcodierung.

1. Kennzahlenliste mit Ampel (Original: Ausschnitt eines Management-Dashboards, Bereiche Marketing, Sales,
   Development): 18 Kennzahlen in drei Bereichen, Namen neutral übersetzt (Produkt- und Releasenamen eines
   Softwareherstellers ersetzt). Ist und Ziel erfunden, so dass die Ampelstufen genau denen des Originals
   entsprechen (Stand Juni 2027). Regel: Zielerreichung ≥ 100 % im Ziel, ≥ 95 % beobachten, sonst kritisch;
   bei Budgets Ziel/Ist. Ein Budget ohne Wert (im Original grauer Punkt).
2. Heatmap: Monatswerte des Originals (Excel-Farbskala, 2014–2016) als Umsatz in Tsd. € für 2025–2027.
3. ABC-Tabelle: Umsatz 01–03/2009 nach PLZ-Region (Werte des Originals in €, einschließlich der Gutschrift in
   PLZ 81) als 1. Quartal 2027; Klassengrenzen 70 % und 90 % wie im Original.
4. Karte: dieselben PLZ-Regionen; Lage = ungefährer Mittelpunkt der Leitregion; vereinfachter Umriss Deutschlands.
Ausgabe: ampel.json und ampel.csv (alle Einzelsätze im Langformat).
"""
import csv
import json
import os

HIER = os.path.dirname(os.path.abspath(__file__))

STAND = "Juni 2027"
# Bereich, Kurzname, Langname, Einheit, Ist, Ziel, Richtung (+1 höher besser, −1 niedriger besser), Nachkommastellen
KENNZAHLEN = [
    ("Marketing", "Interessenten", "Neue Interessenten (Leads)", "Anzahl", 1164, 1200, 1, 0),
    ("Marketing", "Webbesuche", "Besuche der Website", "Tsd.", 48.6, 45.0, 1, 1),
    ("Marketing", "Kanalumsatz", "Umsatz über Partnerkanäle", "Mio. €", 12.4, 12.0, 1, 1),
    ("Marketing", "Budget", "Budget Marketing (Kosten)", "Mio. €", 1.85, 1.90, -1, 2),
    ("Vertrieb", "Aufträge", "Auftragseingang", "Mio. €", 41.2, 46.0, 1, 1),
    ("Vertrieb", "Pipeline", "Pipeline-Abdeckung (Vielfaches des Restziels)", "Faktor", 2.9, 3.0, 1, 1),
    ("Vertrieb", "Forecast", "Umsatzvorschau Gesamtjahr", "Mio. €", 182.5, 188.0, 1, 1),
    ("Vertrieb", "Budget Direkt", "Budget Direktvertrieb (Kosten)", "Mio. €", 2.40, 2.50, -1, 2),
    ("Vertrieb", "Budget Service", "Budget Kundenservice (Kosten)", "Mio. €", 1.12, 1.20, -1, 2),
    ("Vertrieb", "Budget Partner", "Budget Partnervertrieb (Kosten)", "Mio. €", 0.83, 0.80, -1, 2),
    ("Vertrieb", "Budget Handel", "Budget Handelsvertrieb (Kosten)", "Mio. €", 0.64, 0.70, -1, 2),
    ("Vertrieb", "Budget Zentrale", "Budget Vertriebszentrale (Kosten)", "Mio. €", 3.46, 3.10, -1, 2),
    ("Entwicklung", "Release 8.0", "Release 8.0 – Fertigstellung", "%", 100, 100, 1, 0),
    ("Entwicklung", "Release 8.1", "Release 8.1 – Fertigstellung", "%", 72, 70, 1, 0),
    ("Entwicklung", "Version 6.6", "Wartungsversion 6.6 – Fertigstellung", "%", 100, 100, 1, 0),
    ("Entwicklung", "Version 7.1", "Version 7.1 – Fertigstellung", "%", 45, 40, 1, 0),
    ("Entwicklung", "Änderungen", "Umgesetzte Änderungswünsche", "Anzahl", 39, 40, 1, 0),
    ("Entwicklung", "Budget", "Budget Entwicklung (Kosten)", "Mio. €", None, 4.20, -1, 2),
]

JAHRE = [2025, 2026, 2027]
MONATE = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober",
          "November", "Dezember"]
HEAT = [  # je Monat: 2025, 2026, 2027 (Werte des Originals)
    [600, 708, 594], [607, 984, 749], [901, 886, 908], [608, 615, 835], [715, 833, 734], [520, 663, 618],
    [731, 521, 950], [709, 663, 987], [633, 863, 979], [533, 651, 841], [996, 958, 749], [792, 717, 875]]

# PLZ-Region, Umsatz Q1 in € (Original), Bundesland, Länge, Breite
REGIONEN = [
    ("32", 201604.33, "Nordrhein-Westfalen", 8.67, 52.12), ("80", 179990.40, "Bayern", 11.57, 48.14),
    ("60", 123958.71, "Hessen", 8.68, 50.11), ("58", 87324.24, "Nordrhein-Westfalen", 7.55, 51.30),
    ("73", 71971.09, "Baden-Württemberg", 9.55, 48.75), ("40", 66883.93, "Nordrhein-Westfalen", 6.78, 51.23),
    ("48", 60444.02, "Nordrhein-Westfalen", 7.63, 51.96), ("50", 51499.66, "Nordrhein-Westfalen", 6.96, 50.94),
    ("33", 42888.09, "Nordrhein-Westfalen", 8.53, 51.85), ("22", 31853.63, "Hamburg", 10.00, 53.57),
    ("44", 27296.54, "Nordrhein-Westfalen", 7.40, 51.50), ("30", 15845.36, "Niedersachsen", 9.74, 52.37),
    ("81", -1250.74, "Bayern", 11.62, 48.10)]
GRENZEN = [70, 90]

# Vereinfachter Umriss Deutschlands (Länge, Breite), im Uhrzeigersinn ab der dänischen Grenze an der Nordsee
UMRISS = [(8.66, 54.91), (9.42, 54.83), (9.95, 54.78), (10.03, 54.55), (10.17, 54.43), (10.75, 54.30), (11.10, 54.45),
          (10.85, 54.08), (10.90, 53.96), (11.45, 53.98), (12.08, 54.18), (12.50, 54.47), (13.10, 54.55), (13.43, 54.68),
          (13.70, 54.40), (13.80, 54.15), (14.22, 53.93), (14.27, 53.70), (14.42, 53.28), (14.14, 52.87), (14.62, 52.58),
          (14.55, 52.33), (14.72, 52.07), (14.65, 51.73), (14.74, 51.53), (14.99, 51.15), (14.83, 50.87), (14.60, 50.93),
          (14.38, 51.03), (14.25, 50.90), (13.90, 50.79), (13.40, 50.63), (12.97, 50.42), (12.47, 50.35), (12.20, 50.32),
          (12.10, 50.25), (12.47, 49.98), (12.40, 49.75), (12.52, 49.62), (12.85, 49.33), (13.20, 49.12), (13.84, 48.77),
          (13.46, 48.57), (13.03, 48.26), (12.83, 48.17), (12.95, 47.95), (13.05, 47.70), (13.00, 47.47), (12.75, 47.68),
          (12.20, 47.62), (11.60, 47.55), (11.26, 47.40), (10.98, 47.40), (10.55, 47.55), (10.25, 47.27), (10.10, 47.40),
          (9.70, 47.54), (9.20, 47.66), (8.75, 47.70), (8.60, 47.78), (8.40, 47.62), (7.60, 47.58), (7.56, 47.82),
          (7.58, 48.05), (7.80, 48.57), (8.23, 48.97), (7.94, 49.05), (7.36, 49.17), (7.03, 49.15), (6.73, 49.17),
          (6.55, 49.43), (6.37, 49.47), (6.51, 49.75), (6.32, 49.85), (6.13, 50.14), (6.40, 50.33), (6.27, 50.50),
          (6.02, 50.75), (5.87, 51.05), (6.08, 51.22), (6.20, 51.40), (6.22, 51.50), (5.95, 51.80), (6.25, 51.85),
          (6.75, 51.95), (7.03, 52.22), (6.70, 52.48), (7.05, 52.65), (7.21, 53.00), (7.20, 53.24), (7.00, 53.35),
          (7.15, 53.63), (7.70, 53.72), (8.05, 53.70), (8.20, 53.42), (8.50, 53.55), (8.57, 53.55), (8.70, 53.87),
          (9.00, 53.88), (8.88, 54.02), (8.85, 54.15), (8.60, 54.30), (8.95, 54.48), (8.75, 54.70)]

json.dump({"stand": STAND, "kennzahlen": [list(k) for k in KENNZAHLEN], "jahre": JAHRE, "monate": MONATE, "heat": HEAT,
           "quartal": "1. Quartal 2027", "grenzen": GRENZEN, "regionen": [list(r) for r in REGIONEN],
           "umriss": [list(p) for p in UMRISS]},
          open(os.path.join(HIER, "ampel.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))

de = lambda v, nk=2: "" if v is None else f"{v:.{nk}f}".replace(".", ",")
with open(os.path.join(HIER, "ampel.csv"), "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh, delimiter=";", lineterminator="\r\n")
    w.writerow(["Element", "Gruppe", "Objekt", "Periode", "Einheit", "Ist", "Ziel", "Richtung"])
    for b, k, _, e, i, z, r, nk in KENNZAHLEN:
        w.writerow(["Kennzahlenliste", b, k, STAND, e, de(i, nk), de(z, nk), r])
    for m, werte in zip(MONATE, HEAT):
        for j, v in zip(JAHRE, werte):
            w.writerow(["Heatmap", "", m, j, "Tsd. €", v, "", ""])
    for plz, u, land, lon, lat in REGIONEN:
        w.writerow(["ABC-Analyse", land, "PLZ " + plz, "1. Quartal 2027", "€", de(u), "", ""])

# Kontrollausgabe
def stufe(i, z, r):
    if i is None:
        return "ohne Wert"
    q = i / z if r > 0 else z / i
    return "im Ziel" if q >= 1 else "beobachten" if q >= 0.95 else "kritisch"
zaehl = {}
for b, k, _, e, i, z, r, nk in KENNZAHLEN:
    zaehl[stufe(i, z, r)] = zaehl.get(stufe(i, z, r), 0) + 1
print("Ampel:", zaehl)
print("Heatmap Jahressummen:", {j: sum(m[n] for m in HEAT) for n, j in enumerate(JAHRE)})
ges = sum(r[1] for r in REGIONEN)
kum, kl = 0, {}
for plz, u, *_ in REGIONEN:
    kum += u
    a = kum / ges * 100
    k = "A" if a <= GRENZEN[0] else "B" if a <= GRENZEN[1] else "C"
    kl.setdefault(k, []).append(plz)
print(f"ABC: Summe {ges:.2f} €", {k: (len(v), v) for k, v in kl.items()})
