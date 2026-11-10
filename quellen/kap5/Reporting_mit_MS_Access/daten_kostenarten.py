"""Daten für Abb. 5.76 „Reporting mit MS Access“ – Bericht „Kostenartenübersicht nach Kostenstellen“.

Werte des Originals (Kreuztabelle eines Betriebsabrechnungsbogens): elf Kostenarten × sieben Kostenstellen in €.
Leere Zellen des Originals bedeuten „keine Kosten“ und werden nicht als Satz geführt.
Kontrolle: Spalte „Gesamt“ des Originals = Zeilensumme der Kostenstellen (wird hier geprüft).
Ausgabe: kostenarten.json (Stammdaten + Einzelsätze) und kostenarten.csv (Semikolon, UTF-8 mit BOM).
"""
import csv
import json
import os

HIER = os.path.dirname(os.path.abspath(__file__))
KOSTENSTELLEN = ["2111", "3455", "4533", "4544", "5625", "6715", "7832"]
# Kostenartennummer, Kostenart, Gesamt laut Original, {Kostenstelle: Betrag}
KOSTENARTEN = [
    ("1011", "Fertigungslohn", 11450, {"4533": 11450}),
    ("1050", "Gemeinkostenlohn", 16020, {"2111": 1120, "4533": 9130, "6715": 5770}),
    ("1060", "Personalnebenkosten-Lohn", 22560, {"3455": 13540, "6715": 9020}),
    ("2025", "Gemeinkostenmaterial", 15121, {"2111": 2230, "3455": 6196, "4544": 6695}),
    ("3038", "Energie", 6835, {"3455": 1385, "4533": 1280, "4544": 3370, "7832": 800}),
    ("4015", "Gehalt", 6700, {"3455": 6700}),
    ("4033", "Personalnebenkosten-Gehalt", 3360, {"3455": 3360}),
    ("5012", "Fremdreparaturen", 835, {"2111": 835}),
    ("6018", "Kalk. Abschreibungen", 4130, {"2111": 500, "5625": 3630}),
    ("6033", "Kalk. Zinsen", 1120, {"2111": 1120}),
    ("8044", "Sonstige Kosten", 17973, {"2111": 3903, "4544": 14070}),
]

saetze = []
for nr, name, gesamt, werte in KOSTENARTEN:
    assert sum(werte.values()) == gesamt, (nr, sum(werte.values()), gesamt)
    for ks in KOSTENSTELLEN:
        if ks in werte:
            saetze.append([nr, ks, werte[ks]])

daten = {"stand": "19.02.2027", "kostenstellen": KOSTENSTELLEN,
         "kostenarten": [[nr, name] for nr, name, _, _ in KOSTENARTEN], "saetze": saetze}
with open(os.path.join(HIER, "kostenarten.json"), "w", encoding="utf-8") as fh:
    json.dump(daten, fh, ensure_ascii=False, separators=(",", ":"))

namen = {nr: name for nr, name, _, _ in KOSTENARTEN}
with open(os.path.join(HIER, "kostenarten.csv"), "w", encoding="utf-8-sig", newline="") as fh:
    w = csv.writer(fh, delimiter=";")
    w.writerow(["Kostenartennummer", "Kostenart", "Kostenstelle", "Betrag_EUR"])
    for nr, ks, v in saetze:
        w.writerow([nr, namen[nr], ks, v])

ges = sum(v for _, _, v in saetze)
print(f"{len(saetze)} Sätze, Gesamtkosten {ges:,} €".replace(",", "."))
for ks in KOSTENSTELLEN:
    s = sum(v for _, k, v in saetze if k == ks)
    print(f"  Kostenstelle {ks}: {s:>7,} € ({s / ges * 100:4.1f} %)".replace(",", "."))
assert ges == 106104
