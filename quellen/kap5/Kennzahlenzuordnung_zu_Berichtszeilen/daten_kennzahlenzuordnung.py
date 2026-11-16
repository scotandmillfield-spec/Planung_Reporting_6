"""Daten für Abb. 5.24 „Kennzahlenzuordnung zu Berichtszeilen“ (Revision 16.11.2026: Bild statt LaTeX-Tabelle).

Werte wie Abb. 5.23 und die Serie „Kontenmodell“ (Abb. 5.25–5.27): Quelle ist der gemeinsame Generator
../Kontenmodell_mit_Parent-Child-Hierarchie/daten_kontenmodell.py (Stammdaten, vier Zeilen des Kennzahlenmodells,
Aufteilung der Rabatte 60 : 30 : 10 in Kunden-, Aktions- und Sonderrabatte).
Drei Berichtszeilen (Bruttoumsatz, Nettoumsatz, NettoNetto-Umsatz), je Variante die zugeordneten Kennzahlen:
  ohne Rabattdifferenzierung drei Kennzahlen (Bruttoumsatz, Rabatte, Skonti),
  mit Rabattdifferenzierung fünf (Bruttoumsatz, Kundenrabatte, Aktionsrabatte, Sonderrabatte, Skonti).
Ausgabe: kennzahlenzuordnung.json und kennzahlenzuordnung.csv (Kennzahlen je Zeile im Langformat, beide Varianten).
"""
import csv
import io
import json
import os
import runpy

HIER = os.path.dirname(os.path.abspath(__file__))
QUELLE = os.path.join(os.path.dirname(HIER), "Kontenmodell_mit_Parent-Child-Hierarchie", "daten_kontenmodell.py")
g = runpy.run_path(QUELLE, run_name="kontenmodell")

RA = g["RABATTARTEN"]
zeilen = []                                      # Produkt, Kunde, Zeit, {Kennzahl: Wert}
for z, teile in zip(g["KZ_ZEILEN"], g["RABATT_AUFTEILUNG"]):
    assert sum(teile) == z[4]
    w = {"Bruttoumsatz": z[3], "Rabatte": z[4], "Skonti": z[5], **dict(zip(RA, teile))}
    zeilen.append([z[0], z[1], z[2], w])

VARIANTEN = {
    "gesamt": ["Bruttoumsatz", "Rabatte", "Skonti"],
    "differenziert": ["Bruttoumsatz"] + RA + ["Skonti"],
}
BERICHTSZEILEN = ["Bruttoumsatz", "Nettoumsatz", "NettoNetto-Umsatz"]


def zuordnung(kz):
    """Berichtszeile -> zugeordnete Kennzahlen (Summe): Umsatzstufen schließen die vorigen ein."""
    rab = [k for k in kz if k not in ("Bruttoumsatz", "Skonti")]
    return {"Bruttoumsatz": ["Bruttoumsatz"], "Nettoumsatz": ["Bruttoumsatz"] + rab,
            "NettoNetto-Umsatz": ["Bruttoumsatz"] + rab + ["Skonti"]}


pn, kn = dict(g["PRODUKTE"]), dict(g["KUNDEN"])
buf = io.StringIO()
w = csv.writer(buf, delimiter=";", lineterminator="\n")
w.writerow(["Variante Rabatte", "Produkt-ID", "Produkt-Bez.", "Kunde-ID", "Kunde-Bez.", "Jahr", "Kennzahl", "Betrag (€)",
            "zugeordnet zu Berichtszeilen"])
for v, kz in VARIANTEN.items():
    zu = zuordnung(kz)
    for p, k, t, werte in zeilen:
        for kname in kz:
            w.writerow([v, p, pn[p], k, kn[k], t, kname, werte[kname],
                        ", ".join(b for b in BERICHTSZEILEN if kname in zu[b])])
daten = {"titel": "Kennzahlenzuordnung zu Berichtszeilen", "produkte": g["PRODUKTE"], "kunden": g["KUNDEN"],
         "zeit": g["ZEIT"], "zeilen": [[p, k, t, werte] for p, k, t, werte in zeilen],
         "varianten": {v: {"kennzahlen": kz, "zuordnung": [[b, zuordnung(kz)[b]] for b in BERICHTSZEILEN]}
                       for v, kz in VARIANTEN.items()},
         "csv": buf.getvalue()}
with open(os.path.join(HIER, "kennzahlenzuordnung.json"), "w", encoding="utf-8") as fh:
    json.dump(daten, fh, ensure_ascii=False, indent=1)
with open(os.path.join(HIER, "kennzahlenzuordnung.csv"), "w", encoding="utf-8-sig", newline="") as fh:
    fh.write(daten["csv"])

for v, kz in VARIANTEN.items():
    zu = zuordnung(kz)
    print(v, {b: sum(r[3][x] for r in zeilen for x in zu[b]) for b in BERICHTSZEILEN},
          {x: sum(r[3][x] for r in zeilen) for x in kz})
