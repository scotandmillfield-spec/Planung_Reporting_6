"""Daten für Abb. 3.70 „Beispiel Kursdiagramm“: Aktienkurs einer Handelswoche (Eröffnung, Hoch, Tief, Schluss in €)
und Handelsvolumen in €.

Volumen, Hoch, Tief und Schluss sind die Werte des Originals (Excel-Datentabelle). Das Original zeigte den
01.–05.09.2011, darunter Samstag und Sonntag; hier die Handelstage Montag bis Freitag 06.–10.09.2027.
Eröffnungskurse sind ergänzt (erfunden, jeweils zwischen Tief und Hoch), weil Kerzen sie benötigen.
Ausgabe: kurs.json und kurs.csv.
"""
import csv
import json
import os

HIER = os.path.dirname(os.path.abspath(__file__))
TAGE = ["2027-09-06", "2027-09-07", "2027-09-08", "2027-09-09", "2027-09-10"]
VOLUMEN = [89120, 91460, 95820, 91780, 87520]
HOCH = [45.67, 46.89, 49.88, 46.47, 45.86]
TIEF = [43.22, 44.98, 45.77, 43.11, 42.01]
SCHLUSS = [44.56, 45.73, 47.91, 45.89, 43.76]
EROEFFNUNG = [44.10, 45.12, 46.05, 46.20, 45.40]  # ergänzt

for o, h, t, s in zip(EROEFFNUNG, HOCH, TIEF, SCHLUSS):
    assert t <= min(o, s) and max(o, s) <= h, (o, h, t, s)

json.dump({"tage": TAGE, "eroeffnung": EROEFFNUNG, "hoch": HOCH, "tief": TIEF, "schluss": SCHLUSS, "volumen": VOLUMEN},
          open(os.path.join(HIER, "kurs.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
de = lambda v: f"{v:.2f}".replace(".", ",")
with open(os.path.join(HIER, "kurs.csv"), "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh, delimiter=";", lineterminator="\r\n")
    w.writerow(["Datum", "Eroeffnung_EUR", "Hoch_EUR", "Tief_EUR", "Schluss_EUR", "Volumen_EUR"])
    for row in zip(TAGE, EROEFFNUNG, HOCH, TIEF, SCHLUSS, VOLUMEN):
        d, o, h, t, s, v = row
        w.writerow([".".join(reversed(d.split("-"))), de(o), de(h), de(t), de(s), v])
print("Volumen Woche", sum(VOLUMEN), "Schluss Mo→Fr %.2f→%.2f" % (SCHLUSS[0], SCHLUSS[-1]),
      "Spanne Woche %.2f–%.2f" % (min(TIEF), max(HOCH)),
      "steigend:", sum(s > o for o, s in zip(EROEFFNUNG, SCHLUSS)), "fallend:", sum(s < o for o, s in zip(EROEFFNUNG, SCHLUSS)))
