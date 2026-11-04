"""Daten für Abb. 5.18 „Normalisierte Tabellenstruktur in der 3. Normalform“.

Die vier Tabellen des Originals mit unveränderten Werten (Produkte, Kunden, Verkaufsdetails, Verkäufe);
dieselben Werte nutzen Abb. 5.17 (Schema) und Abb. 5.20 (Analyse im Star-Schema).
Feldnamen einheitlich mit Abb. 5.17–5.22: „VerkaufsDatum“ → „Verkaufsdatum“, „VerkaufsOrt“ → „Verkaufsort“.
Datum ISO im JSON, deutsch in Abbildung und CSV.
Ausgabe: tabellen.json und tabellen.csv (vier Blöcke, je Block Tabellenname, Kopfzeile, Datensätze).
Kein Zufall – alle Werte stammen aus dem Original.
"""
import csv
import json
import os

HIER = os.path.dirname(os.path.abspath(__file__))
# ProduktID, ProduktName, Preis (€), VeganeOption
PRODUKTE = [(1, "Latte Macchiato", 3.50, "Ja"), (2, "Cappuccino", 3.00, "Ja"), (3, "Schokoladenkeks", 1.50, "Ja"),
            (4, "Mandelkuchen", 2.50, "Nein"), (5, "Americano", 2.80, "Nein"), (6, "Cold Brew", 4.00, "Ja")]
# KundenID, Name, DreamCardNr, VeganePraeferenz
KUNDEN = [(1, "Max", 1001, "Ja"), (2, "Anna", 1002, "Nein"), (3, "Lisa-Marie", 1003, "Ja")]
# VerkaufsID, ProduktID, Menge, Vegan
DETAILS = [(1, 1, 1, "Ja"), (1, 3, 2, "Ja"), (2, 2, 1, "Nein"), (3, 6, 1, "Ja"), (4, 1, 1, "Ja"), (5, 5, 1, "Nein"),
           (6, 3, 1, "Ja")]
# VerkaufsID, KundenID, Verkaufsdatum, Verkaufsort
VERKAEUFE = [(1, 1, "2024-10-01", "Kaffeehaus 1"), (2, 2, "2024-10-01", "Kaffeehaus 2"), (3, 3, "2024-10-02", "Coffeebike"),
             (4, 1, "2024-10-02", "Kaffeehaus 1"), (5, 2, "2024-10-03", "Kaffeehaus 2"), (6, 3, "2024-10-03", "Kaffeehaus 1")]

json.dump({"produkte": PRODUKTE, "kunden": KUNDEN, "details": DETAILS, "verkaeufe": VERKAEUFE},
          open(os.path.join(HIER, "tabellen.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))

de = lambda v: f"{v:.2f}".replace(".", ",")
datum = lambda iso: ".".join(reversed(iso.split("-")))
with open(os.path.join(HIER, "tabellen.csv"), "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh, delimiter=";", lineterminator="\r\n")
    for name, kopf, zeilen in [
        ("Produkte", ["ProduktID", "ProduktName", "Preis_EUR", "VeganeOption"], [(a, b, de(c), d) for a, b, c, d in PRODUKTE]),
        ("Kunden", ["KundenID", "Name", "DreamCardNr", "VeganePraeferenz"], KUNDEN),
        ("Verkaufsdetails", ["VerkaufsID", "ProduktID", "Menge", "Vegan"], DETAILS),
        ("Verkäufe", ["VerkaufsID", "KundenID", "Verkaufsdatum", "Verkaufsort"], [(a, b, datum(c), d) for a, b, c, d in VERKAEUFE]),
    ]:
        w.writerow([name, "", "", ""])
        w.writerow(kopf)
        w.writerows(zeilen)
        w.writerow([])

# Kontrollausgabe
preis = {p[0]: p[2] for p in PRODUKTE}
kunde_v = {v[0]: v[1] for v in VERKAEUFE}
print(f"{len(VERKAEUFE)} Verkäufe, {len(DETAILS)} Positionen, Menge {sum(d[2] for d in DETAILS)}, "
      f"Umsatz {sum(d[2] * preis[d[1]] for d in DETAILS):.2f} €")
for k in KUNDEN:
    pos = [d for d in DETAILS if kunde_v[d[0]] == k[0]]
    print(f"  {k[1]}: {len(pos)} Positionen, {sum(d[2] for d in pos)} Stück, {sum(d[2] * preis[d[1]] for d in pos):.2f} €")
for p in PRODUKTE:
    pos = [d for d in DETAILS if d[1] == p[0]]
    print(f"  {p[1]}: {len(pos)} Positionen, {sum(d[2] for d in pos)} Stück")
