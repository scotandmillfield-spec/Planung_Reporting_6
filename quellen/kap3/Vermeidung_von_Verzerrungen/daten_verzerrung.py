"""Daten für Abb. 3.53 „Vermeidung von Verzerrungen“: Umsatz je Kontinent in Mio. €, Werte des Originals.
Ausgabe: verzerrung.json und verzerrung.csv.
"""
import csv
import json
import os

HIER = os.path.dirname(os.path.abspath(__file__))
WERTE = [("Europa", 57.7), ("Asien", 59.8), ("Nordamerika", 58.8), ("Südamerika", 58.2), ("Afrika", 56.3), ("Ozeanien", 55.6)]
json.dump({"jahr": 2027, "werte": [list(w) for w in WERTE], "achse_verzerrt": [52, 62, 2], "achse_null": [0, 80, 20]},
          open(os.path.join(HIER, "verzerrung.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
with open(os.path.join(HIER, "verzerrung.csv"), "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh, delimiter=";", lineterminator="\r\n")
    w.writerow(["Region", "Umsatz_Mio_EUR"])
    for n, v in WERTE:
        w.writerow([n, str(v).replace(".", ",")])
print("ok")
