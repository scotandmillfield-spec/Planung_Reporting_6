"""Daten für Abb. 3.57 „Histogramm und Box-Plot“.

a) Bearbeitungsdauer (min) von 237 Kundenaufträgen (Revision 6. Auflage: betriebswirtschaftliches statt medizinisches Beispiel; Zahlen unverändert): Klassenhäufigkeiten aus dem Original (XLSTAT-Histogramm, 49 Klassen ab 131,06 cm,
   Breite 1,164 cm) per Pixelauswertung abgelesen. Einzelwerte je Klasse gleichverteilt erzeugt (fester Seed), auf 0,1 cm
   gerundet und innerhalb ihrer Klasse so verschoben, dass Mittelwert und Standardabweichung der Legende des Originals
   entsprechen (Normal(159,548; 10,258)). Mit den Originalklassen ergibt sich exakt das Originalhistogramm.
b) Lieferzeit (Tage): zehn Einzelwerte, erfunden: Minimum 6, 1. Quartil 8, Median 11, 3. Quartil 14, Maximum 16 (Quartile als Median der unteren bzw. oberen Hälfte).
Ausgabe: verteilung.json und verteilung.csv.
"""
import csv
import json
import os
import random
import statistics as st

HIER = os.path.dirname(os.path.abspath(__file__))
ZIEL_M, ZIEL_S = 159.548, 10.258
LO, W = 131.06, 1.164
ANZAHL = [1, 1, 1, 0, 1, 1, 2, 1, 0, 2, 4, 2, 5, 8, 7, 8, 8, 6, 3, 10, 10, 9, 10, 7, 21, 14, 4, 7, 12, 8, 3, 8, 9, 8,
          8, 11, 1, 5, 2, 1, 2, 1, 1, 1, 0, 0, 2, 0, 1]
rnd = random.Random(357)
werte, klasse = [], []
for k, c in enumerate(ANZAHL):
    a, b = LO + k * W, LO + (k + 1) * W
    for _ in range(c):
        werte.append(round(rnd.uniform(a + 0.06, b - 0.06), 1)); klasse.append(k)
grenzen = lambda k: (round(LO + k * W + 0.06, 1), round(LO + (k + 1) * W - 0.06, 1))
fehler = lambda: abs(st.mean(werte) - ZIEL_M) * 4 + abs(st.stdev(werte) - ZIEL_S)
f = fehler()
for _ in range(200000):                      # Bergsteigen: einzelne Werte um ±0,1 cm innerhalb der Klasse verschieben
    if f < 0.0004:
        break
    i = rnd.randrange(len(werte)); d = rnd.choice((-0.1, 0.1)); a, b = grenzen(klasse[i])
    neu = round(werte[i] + d, 1)
    if not a <= neu <= b:
        continue
    alt = werte[i]; werte[i] = neu
    g = fehler()
    if g <= f: f = g
    else: werte[i] = alt
assert all(LO + k * W <= v < LO + (k + 1) * W for v, k in zip(werte, klasse))
werte.sort()
BLUTDRUCK = [6, 7, 8, 9, 10, 12, 13, 14, 15, 16]   # Lieferzeit in Tagen: Min 6, Q1 8, Median 11, Q3 14, Max 16
json.dump({"groesse": werte, "klassen_original": [LO, W, len(ANZAHL)], "blutdruck": BLUTDRUCK},
          open(os.path.join(HIER, "verteilung.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
with open(os.path.join(HIER, "verteilung.csv"), "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh, delimiter=";", lineterminator="\r\n")
    w.writerow(["Teil", "Merkmal", "Nr", "Wert", "Einheit"])
    for i, v in enumerate(werte, 1):
        w.writerow(["a) Histogramm", "Bearbeitungsdauer", i, f"{v:.1f}".replace(".", ","), "min"])
    for i, v in enumerate(BLUTDRUCK, 1):
        w.writerow(["b) Box-Plot", "Lieferzeit", i, v, "Tage"])
h = BLUTDRUCK
print(f"Bearbeitungsdauer: n {len(werte)}, Mittelwert {st.mean(werte):.3f}, Std.-Abw. {st.stdev(werte):.3f}, Min {werte[0]}, Max {werte[-1]}")
print(f"Lieferzeit: Min {min(h)}, Q1 {st.median(h[:5])}, Median {st.median(h)}, Q3 {st.median(h[5:])}, Max {max(h)}")
