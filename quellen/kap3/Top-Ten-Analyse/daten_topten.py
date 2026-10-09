"""Daten für Abb. 3.20 „Top-Ten-Analyse“.

Die zehn Kunden des Originals (5. Auflage) mit ihren Umsätzen Vorjahr und Ist – Werte unverändert, Namen
erfunden (das Original nannte reale Versicherungsunternehmen). Gelesen als Geschäftsjahr 2027 mit Vorjahr 2026 (Revision DS 08.10.2026).
Damit Datenschnitte (Jahr, Vertriebsgebiet) eine echte Rangfolge ergeben, kommen 38 weitere erfundene Kunden mit
kleineren Umsätzen hinzu (alle unter dem zehnten Kunden, damit die Top Ten des Originals erhalten bleiben) und ein
Jahr 2025 für den Vorjahresvergleich 2026.
Ausgabe: topten.json (Kunden, Gebiete, Umsätze 2023–2025 in €) und topten.csv (Einzelsätze Kunde × Jahr).
"""
import csv
import json
import os
import random

HIER = os.path.dirname(os.path.abspath(__file__))
JAHRE = [2025, 2026, 2027]
# Kunde, Vertriebsgebiet, Umsatz 2026 (VJ), Umsatz 2027 (Ist) – Werte des Originals, Namen erfunden
TOP = [
    ("Altmoor Versicherung", "Süd", 164674, 162357),
    ("Brenkhof Versicherung", "West", 95212, 99516),
    ("Corvelt Versicherung", "Nord", 85304, 83232),
    ("Elmsried Versicherung", "Süd", 73767, 74290),
    ("Dahlwerth Versicherung", "West", 61359, 74810),
    ("Gerwald Versicherung", "Süd", 55128, 55637),
    ("Fennrath Versicherung", "Süd", 55075, 58943),
    ("Ilvershof Versicherung", "Süd", 48854, 48233),
    ("Holmbach Leben", "Nord", 48302, 52128),
    ("Jarnstedt Versicherung", "West", 46650, 34402),
]
WEITERE = [
    ("Kellwitz Versicherung", "Ost"), ("Lorvenich Versicherung", "West"), ("Merzbach Leben", "Süd"),
    ("Nordhaver Versicherung", "Nord"), ("Orlenkamp Versicherung", "Nord"), ("Pellworth Versicherung", "Nord"),
    ("Quernbach Versicherung", "Ost"), ("Rautenfels Versicherung", "Süd"), ("Selmbruch Versicherung", "West"),
    ("Tollberg Versicherung", "Ost"), ("Ulmenau Leben", "Ost"), ("Varnhorst Versicherung", "Nord"),
    ("Wendhagen Versicherung", "West"), ("Zellbrück Versicherung", "Süd"), ("Achterkamp Versicherung", "Nord"),
    ("Birkenfurt Versicherung", "Ost"), ("Dornstetten Versicherung", "Süd"), ("Eschweide Versicherung", "West"),
    ("Falkenrode Versicherung", "Ost"), ("Grünwalde Versicherung", "Ost"), ("Hessling Leben", "West"),
    ("Immenried Versicherung", "Süd"), ("Kaltenmoor Versicherung", "Nord"), ("Lindwerder Versicherung", "Ost"),
    ("Mühlhaupt Versicherung", "Süd"), ("Neuenkirch Versicherung", "West"), ("Oberstaal Versicherung", "Süd"),
    ("Priemhof Versicherung", "Nord"), ("Rosswinkel Versicherung", "Ost"), ("Sandhöfen Versicherung", "West"),
    ("Tannrode Versicherung", "Ost"), ("Uhlenbrock Versicherung", "Nord"), ("Vierlinden Versicherung", "West"),
    ("Weißenstede Versicherung", "Ost"), ("Achtermoor Leben", "Nord"), ("Bergfelde Versicherung", "Süd"),
    ("Krummhörn Versicherung", "West"), ("Steinwedel Versicherung", "Ost"),
]

rnd = random.Random(320)
kunden, werte = [], []
for name, gebiet, u24, u25 in TOP:
    u23 = round(u24 / rnd.uniform(0.93, 1.09))
    kunden.append([name, gebiet]); werte.append([u23, u24, u25])
for i, (name, gebiet) in enumerate(WEITERE):
    u25 = round(rnd.uniform(4500, 33500) * (1.0 if i % 3 else 0.6))
    u24 = round(u25 / rnd.uniform(0.86, 1.14))
    u24 = min(u24, 45500)                        # Vorjahr ebenfalls unter dem zehnten Kunden des Vorjahres
    u23 = round(u24 / rnd.uniform(0.9, 1.1))
    kunden.append([name, gebiet]); werte.append([u23, u24, u25])

# Prüfungen: Top Ten 2027 und 2026 wie im Original
for j, nr in ((2, 2027), (1, 2026)):
    rang = sorted(range(len(kunden)), key=lambda i: -werte[i][j])[:10]
    assert set(rang) == set(range(10)), f"Top Ten {nr} weichen vom Original ab"
assert all(len([k for k in kunden if k[1] == g]) >= 10 for g in ("Nord", "Ost", "Süd", "West"))

json.dump({"jahre": JAHRE, "kunden": kunden, "werte": werte},
          open(os.path.join(HIER, "topten.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
with open(os.path.join(HIER, "topten.csv"), "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh, delimiter=";", lineterminator="\r\n")
    w.writerow(["Kunde", "Vertriebsgebiet", "Jahr", "Umsatz_EUR"])
    for (name, gebiet), u in zip(kunden, werte):
        for j, jahr in enumerate(JAHRE):
            w.writerow([name, gebiet, jahr, u[j]])

# Kontrollausgabe
for j, jahr in enumerate(JAHRE):
    ges = sum(u[j] for u in werte)
    top = sorted((u[j] for u in werte), reverse=True)[:10]
    print(f"{jahr}: Gesamt {ges:9,d} €  Top 10 {sum(top):9,d} € ({sum(top) / ges:.1%})")
for g in ("Nord", "Ost", "Süd", "West"):
    n = sum(1 for k in kunden if k[1] == g)
    print(f"{g}: {n} Kunden, Umsatz 2027 {sum(u[2] for k, u in zip(kunden, werte) if k[1] == g):,d} €")
