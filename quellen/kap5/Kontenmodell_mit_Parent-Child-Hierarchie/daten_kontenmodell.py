"""Daten für die Serie „Kontenmodell“ (Abb. 5.25–5.27) – gemeinsamer Generator, auch Grundlage der Abb. 5.23.

Ein Datensatz für alle Abbildungen, Werte unverändert aus den Originalen der 5. Auflage (Excel-Objekte als EMF):
  - Dimensionstabellen Produkt (3312 Ring, 4512 Kette), Kunde (471 MTS GmbH, 236 SOT AG), Zeit (2018, 2019);
  - Kennzahlenmodell (Abb. 5.23): vier Zeilen mit Bruttoumsatz, Rabatten und Skonti; Nettoumsatz und
    NettoNetto-Umsatz werden berechnet;
  - Kontenmodell (Abb. 5.25/5.26): dieselben Werte als zwölf Buchungen auf den Konten 8000 Bruttoumsatz,
    8050 Rabatte, 8090 Skonti (entpivotiert in der Reihenfolge des Originals);
  - Kontendimension mit Parent-Child-Hierarchie (Abb. 5.25: Konten-ID, Werte, Vorgänger, Sortiercode) und ohne
    (Abb. 5.26: Werte und Ebenen mit je einem Sortiercode); daraus der Hierarchieaufbau (Abb. 5.27).
Festlegung: Konto 8050 heißt überall „Rabatte“ (Abb. 5.25 des Originals: „Rabatt“). Betrag in € (Annahme, das
Original nennt keine Einheit). Kein Zufall (fester Datensatz). Ausgabe: kontenmodell.json und kontenmodell.csv;
die Ordner der Abb. 5.26 und 5.27 führen dieses Skript per runpy aus und setzen nur Startansicht und Seitentitel,
der Ordner der Abb. 5.23 nutzt die Stammdaten und das Kennzahlenmodell.
"""
import csv
import io
import json
import os

HIER = os.path.dirname(os.path.abspath(__file__))
START, TITEL = 1, "Kontenmodell mit Parent-Child-Hierarchie"

PRODUKTE = [[3312, "Ring"], [4512, "Kette"]]
KUNDEN = [[471, "MTS GmbH"], [236, "SOT AG"]]
ZEIT = [[2018, 2018], [2019, 2019]]

# Kennzahlenmodell (Abb. 5.23): Produkt, Kunde, Zeit, Bruttoumsatz, Rabatte, Skonti
KENNZAHLEN = ["Bruttoumsatz", "Rabatte", "Nettoumsatz", "Skonti", "NettoNetto-Umsatz"]
KZ_ZEILEN = [
    [3312, 471, 2018, 1000, -100, -18],
    [4512, 236, 2018, 800, -60, -15],
    [3312, 471, 2019, 950, -50, -18],
    [4512, 471, 2018, 1250, 0, -25],
]
# berechnete Kennzahlen des Originals zur Kontrolle: Nettoumsatz, NettoNetto-Umsatz
KZ_BERECHNET_ORIGINAL = [[900, 882], [740, 725], [900, 882], [1250, 1225]]

# Konten der Faktentabelle im Kontenmodell: Kennzahl -> Konto
KONTO_JE_KENNZAHL = {"Bruttoumsatz": 8000, "Rabatte": 8050, "Skonti": 8090}

# Kontendimension mit Parent-Child-Hierarchie (Abb. 5.25): Konten-ID, Werte, Vorgänger (None = NULL), Sortiercode
KONTEN_PC = [
    [100, "NettoNetto-Umsatz", None, 1],
    [8090, "Skonti", 100, 2],
    [200, "Nettoumsatz", 100, 3],
    [8050, "Rabatte", 200, 4],
    [8000, "Bruttoumsatz", 200, 5],
]
# Kontendimension ohne Parent-Child-Hierarchie (Abb. 5.26), Zeilenfolge des Originals:
# Konten-ID, Werte, Sortiercode 3, Ebene 2, Sortiercode 2, Ebene 1, Sortiercode 1
KONTEN_EBENEN = [
    [8050, "Rabatte", 2, "Nettoumsatz", 2, "NettoNetto-Umsatz", 1],
    [8000, "Bruttoumsatz", 3, "Nettoumsatz", 2, "NettoNetto-Umsatz", 1],
    [8090, "Skonti", 1, "Skonti", 1, "NettoNetto-Umsatz", 1],
]
# Hierarchieaufbau des Originals (Abb. 5.27) zur Kontrolle
HIERARCHIE_ORIGINAL = [["Ebene 1", "NettoNetto-Umsatz"], ["Ebene 2", "Skonti"], ["Werte", "Skonti"],
                       ["Ebene 2", "Nettoumsatz"], ["Werte", "Rabatte"], ["Werte", "Bruttoumsatz"]]
# Faktentabelle des Originals (Abb. 5.25/5.26) zur Kontrolle: Produkt, Kunde, Zeit, Konten, Betrag
FAKTEN_ORIGINAL = [
    [3312, 471, 2018, 8000, 1000], [4512, 236, 2018, 8000, 800], [3312, 471, 2019, 8000, 950],
    [4512, 471, 2018, 8000, 1250], [3312, 471, 2018, 8050, -100], [4512, 236, 2018, 8050, -60],
    [3312, 471, 2019, 8050, -50], [4512, 471, 2018, 8050, 0], [3312, 471, 2018, 8090, -18],
    [4512, 236, 2018, 8090, -15], [3312, 471, 2019, 8090, -18], [4512, 471, 2018, 8090, -25],
]


def kennzahlen():
    """Kennzahlenmodell mit berechneten Kennzahlen: [Produkt, Kunde, Zeit, Brutto, Rabatte, Netto, Skonti, NettoNetto]."""
    z = []
    for p, k, t, brutto, rabatte, skonti in KZ_ZEILEN:
        netto = brutto + rabatte
        z.append([p, k, t, brutto, rabatte, netto, skonti, netto + skonti])
    assert [[r[5], r[7]] for r in z] == KZ_BERECHNET_ORIGINAL, "berechnete Kennzahlen weichen vom Original ab"
    return z


def fakten():
    """Kontenmodell: Kennzahlenspalten als Buchungen je Konto (entpivotiert)."""
    spalte = {"Bruttoumsatz": 3, "Rabatte": 4, "Skonti": 5}        # Spalte in KZ_ZEILEN
    f = []
    for kz, konto in KONTO_JE_KENNZAHL.items():
        for z in KZ_ZEILEN:
            f.append([z[0], z[1], z[2], konto, z[spalte[kz]]])
    assert f == FAKTEN_ORIGINAL, "Faktentabelle weicht vom Original ab"
    return f


def pc_baum():
    """Vorordnung (Knoten vor Kindern, Kinder nach Sortiercode) mit Tiefe."""
    kinder = {}
    for kid, name, vg, sc in KONTEN_PC:
        kinder.setdefault(vg, []).append((sc, kid, name))
    aus = []

    def lauf(vg, tiefe):
        for sc, kid, name in sorted(kinder.get(vg, [])):
            aus.append((kid, name, tiefe))
            lauf(kid, tiefe + 1)
    lauf(None, 1)
    return aus


def ebenen_aufbau():
    """Hierarchieaufbau aus den Ebenenspalten: sortiert nach Sortiercode 1, 2, 3; gleiche Knoten einmal."""
    zeilen = sorted(KONTEN_EBENEN, key=lambda r: (r[6], r[5], r[4], r[3], r[2], r[1]))
    aus, e1, e2 = [], None, None
    for kid, w, sc3, eb2, sc2, eb1, sc1 in zeilen:
        if eb1 != e1:
            aus.append(["Ebene 1", eb1]); e1, e2 = eb1, None
        if eb2 != e2:
            aus.append(["Ebene 2", eb2]); e2 = eb2
        aus.append(["Werte", w])
    assert aus == HIERARCHIE_ORIGINAL, "Hierarchieaufbau weicht vom Original ab"
    return aus


def csv_text():
    name = {k: v for k, v, *_ in KONTEN_PC}
    vg = {k: v for k, _, v, _ in KONTEN_PC}
    eb = {r[0]: r for r in KONTEN_EBENEN}
    pn, kn = dict(PRODUKTE), dict(KUNDEN)
    buf = io.StringIO()
    w = csv.writer(buf, delimiter=";", lineterminator="\n")
    w.writerow(["Produkt-ID", "Produkt-Bez.", "Kunde-ID", "Kunde-Bez.", "Jahr", "Konten-ID", "Konto", "Vorgänger",
                "Ebene 2", "Ebene 1", "Betrag (€)"])
    for p, k, t, konto, betrag in fakten():
        w.writerow([p, pn[p], k, kn[k], t, konto, name[konto], vg[konto], eb[konto][3], eb[konto][5], betrag])
    return buf.getvalue()


def daten(start=START, titel=TITEL):
    kennzahlen()
    ebenen_aufbau()
    return {"start": start, "titel": titel, "produkte": PRODUKTE, "kunden": KUNDEN, "zeit": ZEIT,
            "fakten": fakten(), "konten_pc": KONTEN_PC, "konten_ebenen": KONTEN_EBENEN, "csv": csv_text()}


def schreiben(ordner, start=START, titel=TITEL):
    d = daten(start, titel)
    with open(os.path.join(ordner, "kontenmodell.json"), "w", encoding="utf-8") as fh:
        json.dump(d, fh, ensure_ascii=False, indent=1)
    with open(os.path.join(ordner, "kontenmodell.csv"), "w", encoding="utf-8-sig", newline="") as fh:
        fh.write(d["csv"])


def kontrolle():
    f = fakten()
    je_konto = {}
    for *_, konto, b in f:
        je_konto[konto] = je_konto.get(konto, 0) + b
    print("Buchungen:", len(f), "· je Konto:", je_konto)
    for jahr in (None, 2018, 2019):
        s = lambda kt: sum(b for p, k, t, ko, b in f if ko == kt and (jahr is None or t == jahr))
        netto = s(8000) + s(8050)
        print(f"  {'gesamt' if jahr is None else jahr}: Brutto {s(8000)}, Rabatte {s(8050)}, Netto {netto}, "
              f"Skonti {s(8090)}, NettoNetto {netto + s(8090)}")
    print("Parent-Child-Hierarchie:", " › ".join(f"{'·' * (t - 1)}{n} ({k})" for k, n, t in pc_baum()))
    print("Hierarchieaufbau:", " | ".join(f"{e}: {n}" for e, n in ebenen_aufbau()))
    kz = kennzahlen()
    print("Kennzahlenmodell Summen:", [sum(r[i] for r in kz) for i in range(3, 8)])


if __name__ == "__main__":
    schreiben(HIER)
    kontrolle()
