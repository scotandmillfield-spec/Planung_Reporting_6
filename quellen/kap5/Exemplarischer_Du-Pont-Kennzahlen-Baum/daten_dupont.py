"""Daten für Abb. 5.50 „Exemplarischer Du-Pont-Kennzahlen-Baum“.

Blattwerte des Originals (eingebettetes Excel-Objekt, Jahre 1–7): Gewinn, Umsatz und Kapital in Mio. €.
Jahre 1–7 → 2023–2029; 2023–2027 Ist, 2028–2029 Plan (im Original Jahre 6 und 7 heller eingefärbt).
Die Seite rechnet die Knoten aus den Blättern:
    Umsatzrendite = Gewinn / Umsatz · Kapitalumschlag = Umsatz / Kapital · ROI = Umsatzrendite × Kapitalumschlag
Das Original rechnete den ROI mit der auf ganze Prozent gerundeten Umsatzrendite (Jahr 1: 11 % × 1,261 = 13,87 %
statt 25 / 180 = 13,89 %); auf eine Nachkommastelle gerundet ergeben sich dieselben Werte.
Nicht übernommen: eine zweite, im Diagramm nicht verwendete Wertereihe im Excel-Objekt (Profit 4/2/−2/…, Net Sales 26/24/…).
Ausgabe: dupont.json und dupont.csv (Semikolon, Dezimalkomma, UTF-8 mit BOM).
"""
import csv
import json
import os

HIER = os.path.dirname(os.path.abspath(__file__))
JAHRE = [2023, 2024, 2025, 2026, 2027, 2028, 2029]
SZENARIO = ["Ist"] * 5 + ["Plan"] * 2
GEWINN = [25, 26, 27, 28, 29, 30, 32]
UMSATZ = [227, 325, 270, 215, 223, 222, 213]
KAPITAL = [180, 175, 170, 178, 186, 192, 202]
# Original zur Kontrolle: Umsatzrendite (gerundet), Kapitalumschlag, ROI des Excel-Objekts
ORIG_ROS = [0.11, 0.08, 0.10, 0.13, 0.13, 0.135, 0.15]
ORIG_KU = [1.261111111111111, 1.8571428571428572, 1.588235294117647, 1.2078651685393258, 1.1989247311827957, 1.15625, 1.0544554455445545]
ORIG_ROI = [0.13872222222222222, 0.14857142857142858, 0.1588235294117647, 0.15702247191011237, 0.15586021505376346, 0.15609375, 0.15816831683168317]

daten = {"jahre": JAHRE, "szenario": SZENARIO, "gewinn": GEWINN, "umsatz": UMSATZ, "kapital": KAPITAL, "stichjahr": 2027}
with open(os.path.join(HIER, "dupont.json"), "w", encoding="utf-8") as fh:
    json.dump(daten, fh, ensure_ascii=False, separators=(",", ":"))

d = lambda v, nk: f"{v:.{nk}f}".replace(".", ",")
with open(os.path.join(HIER, "dupont.csv"), "w", encoding="utf-8-sig", newline="") as fh:
    w = csv.writer(fh, delimiter=";")
    w.writerow(["Jahr", "Szenario", "Gewinn_MioEUR", "Umsatz_MioEUR", "Kapital_MioEUR", "Umsatzrendite_Prozent", "Kapitalumschlag", "ROI_Prozent"])
    for i, j in enumerate(JAHRE):
        g, u, k = GEWINN[i], UMSATZ[i], KAPITAL[i]
        w.writerow([j, SZENARIO[i], g, u, k, d(g / u * 100, 2), d(u / k, 3), d(g / k * 100, 2)])

print("Jahr Szen.  Gewinn Umsatz Kapital   ROS     KU     ROI   | Original ROS  KU     ROI")
for i, j in enumerate(JAHRE):
    g, u, k = GEWINN[i], UMSATZ[i], KAPITAL[i]
    ros, ku, roi = g / u, u / k, g / k
    assert abs(ku - ORIG_KU[i]) < 1e-9 and round(ros * 100) == round(ORIG_ROS[i] * 100) or abs(ros - ORIG_ROS[i]) < 0.0006
    assert round(roi * 1000) == round(ORIG_ROI[i] * 1000) or abs(roi - ORIG_ROI[i]) < 0.0005
    print(f"{j} {SZENARIO[i]:5s} {g:6d} {u:6d} {k:7d}  {ros * 100:5.2f} % {ku:5.3f} {roi * 100:5.2f} % | {ORIG_ROS[i] * 100:5.1f} % {ORIG_KU[i]:5.3f} {ORIG_ROI[i] * 100:5.2f} %")
