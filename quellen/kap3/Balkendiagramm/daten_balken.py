"""Daten für Abb. 3.49 „Balkendiagramm“: Cash-to-Cash Cycle in Tagen.

Werte des Originals (Materialumschlag 63, Erzeugnisumschlag 10, Debitorenziel 31, Kreditorenziel 39,
Cash-to-Cash Cycle 64 Tage). Mit ganzen Tagen ergäbe die Rechnung 63 + 10 + 31 − 39 = 65; die Werte sind deshalb
mit einer Nachkommastelle hinterlegt, die gerundet die Zahlen des Originals ergeben und rechnerisch stimmen.
Ausgabe: balken.json und balken.csv.
"""
import csv
import json
import os

HIER = os.path.dirname(os.path.abspath(__file__))
POSTEN = [  # Name, Tage, Vorzeichen in der Rechnung
    ("Materialumschlag", 62.6, 1), ("Erzeugnisumschlag", 10.2, 1), ("Debitorenziel", 30.8, 1), ("Kreditorenziel", 39.4, -1),
]
ccc = round(sum(t * v for _, t, v in POSTEN), 1)
json.dump({"jahr": 2027, "posten": [list(p) for p in POSTEN], "ccc": ccc},
          open(os.path.join(HIER, "balken.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
with open(os.path.join(HIER, "balken.csv"), "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh, delimiter=";", lineterminator="\r\n")
    w.writerow(["Kennzahl", "Tage", "Vorzeichen"])
    for n, t, v in POSTEN:
        w.writerow([n, str(t).replace(".", ","), "+" if v > 0 else "−"])
    w.writerow(["Cash-to-Cash Cycle", str(ccc).replace(".", ","), "="])
print("Cash-to-Cash Cycle", ccc, "Tage; gerundet:", [round(t) for _, t, _ in POSTEN], round(ccc))
