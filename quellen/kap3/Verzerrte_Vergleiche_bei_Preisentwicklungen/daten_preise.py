"""Daten für Abb. 3.60 „Verzerrte Vergleiche bei Preisentwicklungen“: Preise dreier Segmente über 17 Jahre in €.

Werte aus dem Original abgelesen (Pixelauswertung beider Diagramme, für B und C die logarithmische Fassung) und auf
0,1 € gerundet; Anfangswerte so gesetzt, dass sich jeder Preis wie in der Legende des Originals („+100 %“) genau
verdoppelt. Jahre 1991–2007 um 20 Jahre auf 2011–2027 verschoben.
Ausgabe: preise.json und preise.csv.
"""
import csv
import json
import os

HIER = os.path.dirname(os.path.abspath(__file__))
JAHRE = list(range(2011, 2028))
SEGMENTE = [
    ("Segment A", [31.8, 35.3, 34.6, 34.1, 33.4, 33.0, 35.0, 35.2, 32.5, 40.2, 49.6, 48.5, 46.9, 48.0, 50.0, 64.3, 63.6]),
    ("Segment B", [8.5, 9.1, 9.4, 9.7, 10.1, 10.5, 10.9, 10.1, 9.4, 9.0, 9.8, 10.8, 13.7, 14.6, 15.4, 16.9, 17.0]),
    ("Segment C", [3.1, 3.3, 3.3, 3.4, 3.3, 3.3, 3.3, 3.3, 3.4, 4.8, 4.7, 4.7, 4.8, 5.1, 5.2, 5.3, 6.2]),
]
for n, w in SEGMENTE:
    assert len(w) == len(JAHRE)
    assert abs(w[-1] / w[0] - 2) < 1e-9, n
json.dump({"jahre": JAHRE, "segmente": [[n, w] for n, w in SEGMENTE], "achse_linear": [0, 80, 20],
           "achse_log": [1, 100, [1, 2, 5, 10, 20, 50, 100]]},
          open(os.path.join(HIER, "preise.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
with open(os.path.join(HIER, "preise.csv"), "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh, delimiter=";", lineterminator="\r\n")
    w.writerow(["Segment", "Jahr", "Preis_EUR"])
    for n, werte in SEGMENTE:
        for j, v in zip(JAHRE, werte):
            w.writerow([n, j, f"{v:.1f}".replace(".", ",")])
for n, werte in SEGMENTE:
    print(f"{n}: {werte[0]:.1f} → {werte[-1]:.1f} € (+{werte[-1] - werte[0]:.1f} €, +{(werte[-1] / werte[0] - 1) * 100:.0f} %)")
