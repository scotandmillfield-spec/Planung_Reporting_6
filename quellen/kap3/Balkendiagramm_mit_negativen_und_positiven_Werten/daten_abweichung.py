"""Daten für Abb. 3.50 „Balkendiagramm mit negativen und positiven Werten“.

Veränderung von Absatz, Umsatz und EBIT der Tochtergesellschaften A, B und C zum Vorjahr in %. Werte des Originals
(A: +1,5 / −2,5 / −6,0; B: +8,0 / +3,0 / −2,0; C: +5,0 / +4,0 / +1,0), Jahr 2014 auf 2027 aktualisiert.
Ausgabe: abweichung.json und abweichung.csv.
"""
import csv
import json
import os

HIER = os.path.dirname(os.path.abspath(__file__))
GES = ["Tochter A", "Tochter B", "Tochter C"]
KZ = ["Absatz", "Umsatz", "EBIT"]
WERTE = [[1.5, -2.5, -6.0], [8.0, 3.0, -2.0], [5.0, 4.0, 1.0]]      # [Gesellschaft][Kennzahl], ΔVJ in %
json.dump({"jahr": 2027, "gesellschaften": GES, "kennzahlen": KZ, "werte": WERTE},
          open(os.path.join(HIER, "abweichung.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
with open(os.path.join(HIER, "abweichung.csv"), "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh, delimiter=";", lineterminator="\r\n")
    w.writerow(["Gesellschaft", "Jahr", "Kennzahl", "Veraenderung_VJ_Prozent"])
    for g, ws in zip(GES, WERTE):
        for k, v in zip(KZ, ws):
            w.writerow([g, 2027, k, str(v).replace(".", ",")])
print("ok")
