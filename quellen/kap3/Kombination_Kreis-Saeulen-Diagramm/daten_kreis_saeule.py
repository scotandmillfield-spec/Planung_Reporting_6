"""Daten für Abb. 3.72 „Kombination Kreis-Säulen-Diagramm“: Umsatz 2027 nach Kundengruppen, Gruppe A nach Kunden.
Anteile des Originals (Kundengruppe A 30 %, B 24 %, C 25 %, D 21 %; Kunde A1 6 %, A2 3 %, A3 8 %, A4 9 %,
sonstige A-Kunden 4 %); absolute Werte erfunden (Gesamtumsatz 50 Mio. €).
Ausgabe: kreis_saeule.json und kreis_saeule.csv.
"""
import csv
import json
import os

HIER = os.path.dirname(os.path.abspath(__file__))
GESAMT = 50.0                                                        # Mio. €
GRUPPEN = [("Kundengruppe A", 0.30), ("Kundengruppe B", 0.24), ("Kundengruppe C", 0.25), ("Kundengruppe D", 0.21)]
KUNDEN_A = [("Kunde A1", 0.06), ("Kunde A2", 0.03), ("Kunde A3", 0.08), ("Kunde A4", 0.09), ("sonstige A-Kunden", 0.04)]

gruppen = [[n, round(GESAMT * a, 2)] for n, a in GRUPPEN]
kunden = [[n, round(GESAMT * a, 2)] for n, a in KUNDEN_A]
json.dump({"jahr": 2027, "gruppen": gruppen, "kunden_a": kunden},
          open(os.path.join(HIER, "kreis_saeule.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
with open(os.path.join(HIER, "kreis_saeule.csv"), "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh, delimiter=";", lineterminator="\r\n")
    w.writerow(["Jahr", "Kundengruppe", "Kunde", "Umsatz_Mio_EUR"])
    for n, v in gruppen:
        if n != "Kundengruppe A":
            w.writerow([2027, n, "", f"{v:.2f}".replace(".", ",")])
    for n, v in kunden:
        w.writerow([2027, "Kundengruppe A", n, f"{v:.2f}".replace(".", ",")])

# Kontrollsummen
ges = sum(v for _, v in gruppen)
a = sum(v for _, v in kunden)
print(f"Gesamt {ges:.2f} Mio. €, Gruppe A {gruppen[0][1]:.2f} = Summe Kunden A {a:.2f}")
for n, v in gruppen + kunden:
    print(f"  {n:20s} {v:6.2f}  {v / ges:6.1%}")
