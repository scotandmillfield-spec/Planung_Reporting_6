"""Daten für Abb. 5.20 „Analyse gemäß einem Star-Schema“.

Star-Schema wie Abb. 5.19, gefüllt aus den Werten von Abb. 5.18 (3. Normalform): je Position eine Zeile der
Faktentabelle Verkäufe (KundenID, ProduktID, VerkaufsdatumID, VerkaufsortID, Menge, Umsatz = Menge × Preis),
dazu die Dimensionen Produkt, Kunde, Datum und Verkaufsort. VerkaufsortID ist ergänzt (1 Kaffeehaus 1,
2 Kaffeehaus 2, 3 Coffeebike), die Datumsattribute sind aus dem Datum abgeleitet. Die Mengen ergeben die Balken
des Originals: alle Produkte Max 4, Anna 2, Lisa-Marie 2 Stück; Produktfilter Latte Macchiato: Max 2 Stück.
Ausgabe: star.json und star.csv (fünf Blöcke: Faktentabelle und vier Dimensionen). Kein Zufall.
"""
import csv
import json
import os

HIER = os.path.dirname(os.path.abspath(__file__))
PRODUKT = [(1, "Latte Macchiato", 3.50, "Ja"), (2, "Cappuccino", 3.00, "Ja"), (3, "Schokoladenkeks", 1.50, "Ja"),
           (4, "Mandelkuchen", 2.50, "Nein"), (5, "Americano", 2.80, "Nein"), (6, "Cold Brew", 4.00, "Ja")]
KUNDE = [(1, "Max", 1001, "Ja"), (2, "Anna", 1002, "Nein"), (3, "Lisa-Marie", 1003, "Ja")]
ORT = [(1, "Kaffeehaus 1"), (2, "Kaffeehaus 2"), (3, "Coffeebike")]
# Quelle 3NF (Abb. 5.18): Verkäufe (VerkaufsID, KundenID, Datum, Ort) und Verkaufsdetails (VerkaufsID, ProduktID, Menge)
VERKAEUFE = [(1, 1, "2024-10-01", "Kaffeehaus 1"), (2, 2, "2024-10-01", "Kaffeehaus 2"), (3, 3, "2024-10-02", "Coffeebike"),
             (4, 1, "2024-10-02", "Kaffeehaus 1"), (5, 2, "2024-10-03", "Kaffeehaus 2"), (6, 3, "2024-10-03", "Kaffeehaus 1")]
DETAILS = [(1, 1, 1), (1, 3, 2), (2, 2, 1), (3, 6, 1), (4, 1, 1), (5, 5, 1), (6, 3, 1)]

preis = {p[0]: p[2] for p in PRODUKT}
ort_id = {o[1]: o[0] for o in ORT}
verk = {v[0]: v for v in VERKAEUFE}
FAKTEN = []
for v, p, m in DETAILS:
    _, k, d, o = verk[v]
    FAKTEN.append((k, p, d, ort_id[o], m, round(m * preis[p], 2)))
DATUM = []
for d in sorted({f[2] for f in FAKTEN}):
    j, mo, t = map(int, d.split("-"))
    DATUM.append((d, t, mo, (mo - 1) // 3 + 1, 1 if mo <= 6 else 2, j))

json.dump({"produkt": PRODUKT, "kunde": KUNDE, "ort": ORT, "datum": DATUM, "fakten": FAKTEN},
          open(os.path.join(HIER, "star.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))

de = lambda v: f"{v:.2f}".replace(".", ",")
dat = lambda iso: ".".join(reversed(iso.split("-")))
with open(os.path.join(HIER, "star.csv"), "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh, delimiter=";", lineterminator="\r\n")
    for name, kopf, zeilen in [
        ("Verkäufe (Faktentabelle)", ["KundenID", "ProduktID", "VerkaufsdatumID", "VerkaufsortID", "Menge", "Umsatz_EUR"],
         [(k, p, dat(d), o, m, de(u)) for k, p, d, o, m, u in FAKTEN]),
        ("Produkt (Dimension)", ["ProduktID", "ProduktName", "Preis_EUR", "VeganeOption"], [(a, b, de(c), e) for a, b, c, e in PRODUKT]),
        ("Kunde (Dimension)", ["KundenID", "Name", "DreamCardNr", "VeganePraeferenz"], KUNDE),
        ("Datum (Dimension)", ["DatumID", "Tag", "Monat", "Quartal", "Halbjahr", "Jahr"], [(dat(d), *r) for d, *r in DATUM]),
        ("Verkaufsort (Dimension)", ["VerkaufsortID", "Verkaufsort"], ORT),
    ]:
        w.writerow([name] + [""] * (len(kopf) - 1))
        w.writerow(kopf)
        w.writerows(zeilen)
        w.writerow([])

# Kontrollausgabe
print(f"Faktentabelle: {len(FAKTEN)} Zeilen, Menge {sum(f[4] for f in FAKTEN)}, Umsatz {sum(f[5] for f in FAKTEN):.2f} €")
for k in KUNDE:
    z = [f for f in FAKTEN if f[0] == k[0]]
    lm = sum(f[4] for f in z if f[1] == 1)
    print(f"  {k[1]}: {sum(f[4] for f in z)} Stück, {sum(f[5] for f in z):.2f} €, davon Latte Macchiato {lm} Stück")
