"""Daten für Abb. 5.23 „Kennzahlenmodell“ – dieselben Stammdaten und Werte wie die Serie „Kontenmodell“ (Abb. 5.25–5.27).

Quelle ist der gemeinsame Generator ../Kontenmodell_mit_Parent-Child-Hierarchie/daten_kontenmodell.py (Werte aus dem
Original): Dimensionstabellen Produkt, Kunde, Zeit und die vier Zeilen der Faktentabelle mit Bruttoumsatz, Rabatten
und Skonti; Nettoumsatz und NettoNetto-Umsatz werden je Zeile berechnet und gegen das Original geprüft.
Betrag in € (Annahme, das Original nennt keine Einheit). Ausgabe: kennzahlenmodell.json und kennzahlenmodell.csv.
"""
import csv
import io
import json
import os
import runpy

HIER = os.path.dirname(os.path.abspath(__file__))
QUELLE = os.path.join(os.path.dirname(HIER), "Kontenmodell_mit_Parent-Child-Hierarchie", "daten_kontenmodell.py")
g = runpy.run_path(QUELLE, run_name="kontenmodell")

zeilen = g["kennzahlen"]()                      # [Produkt, Kunde, Zeit, Brutto, Rabatte, Netto, Skonti, NettoNetto]
pn, kn = dict(g["PRODUKTE"]), dict(g["KUNDEN"])
buf = io.StringIO()
w = csv.writer(buf, delimiter=";", lineterminator="\n")
w.writerow(["Produkt-ID", "Produkt-Bez.", "Kunde-ID", "Kunde-Bez.", "Jahr"] + [f"{k} (€)" for k in g["KENNZAHLEN"]])
for p, k, t, *werte in zeilen:
    w.writerow([p, pn[p], k, kn[k], t] + werte)
daten = {"titel": "Kennzahlenmodell", "produkte": g["PRODUKTE"], "kunden": g["KUNDEN"], "zeit": g["ZEIT"],
         "kennzahlen": g["KENNZAHLEN"], "berechnet": ["Nettoumsatz", "NettoNetto-Umsatz"], "zeilen": zeilen,
         "csv": buf.getvalue()}
with open(os.path.join(HIER, "kennzahlenmodell.json"), "w", encoding="utf-8") as fh:
    json.dump(daten, fh, ensure_ascii=False, indent=1)
with open(os.path.join(HIER, "kennzahlenmodell.csv"), "w", encoding="utf-8-sig", newline="") as fh:
    fh.write(daten["csv"])

print("Zeilen:", len(zeilen))
print("Summen:", dict(zip(g["KENNZAHLEN"], [sum(r[i] for r in zeilen) for i in range(3, 8)])))
for jahr in (2018, 2019):
    print(f"  {jahr}:", [sum(r[i] for r in zeilen if r[2] == jahr) for i in range(3, 8)])
for p, _ in g["PRODUKTE"]:
    print(f"  Produkt {p}: NettoNetto-Umsatz", sum(r[7] for r in zeilen if r[0] == p))
