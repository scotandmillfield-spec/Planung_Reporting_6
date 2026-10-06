"""Daten für Abb. 3.26 „Break-Even-Point-Analyse“.

Ausgangsdaten des Originals (5. Auflage): je Monat 1.000 Stück, Erlöse 375, variable Kosten 250, fixe Kosten 1.150,
Break-Even bei 9.200 Stück und 3.450 Umsatz. Das Original nannte als Einheit „Euro“ – 1.000 Stück für 375 € wären
unplausibel. Die Zahlen bleiben gleich, gelesen als Tsd. €: Preis 375 € je Stück, variable Kosten 250 € je Stück,
Fixkosten 1.150 Tsd. € im Jahr. So stimmen Break-Even-Menge (9.200 Stück) und -Umsatz (3.450 Tsd. €) mit dem Buchtext.

Die Optionen je Parameter sind die Werte der Was-wäre-wenn-Datenschnitte im Dashboard (Basis in der Mitte).
Alle Kennzahlen rechnet bep.js aus den Parametern – dieselben Formeln wie hier.
Ausgabe: bep.json (Parameter) und bep.csv (Monatswerte im Basisfall, gleich der CSV-Ebene).
"""
import csv
import json
import math
import os

HIER = os.path.dirname(os.path.abspath(__file__))
MONATE = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"]
BASIS = {"menge": 1000, "preis": 375, "kv": 250, "kf": 1150}       # Stück je Monat, € je Stück, € je Stück, Tsd. € je Jahr
OPTIONEN = {"menge": [900, 1000, 1100], "preis": [350, 375, 400], "kv": [225, 250, 275], "kf": [1000, 1150, 1300]}

json.dump({"monate": MONATE, "basis": BASIS, "optionen": OPTIONEN},
          open(os.path.join(HIER, "bep.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))


def monatswerte(menge, preis, kv, kf):
    """Je Monat: Absatz, Umsatz, variable Kosten (Monat und kumuliert), Fixkosten, Gesamtkosten und Ergebnis kumuliert (Tsd. €)."""
    out = []
    for i, name in enumerate(MONATE, start=1):
        absatz_kum = menge * i
        umsatz, var = menge * preis / 1000, menge * kv / 1000
        umsatz_kum, var_kum = absatz_kum * preis / 1000, absatz_kum * kv / 1000
        out.append([name, menge, absatz_kum, umsatz, umsatz_kum, var, var_kum, kf, kf + var_kum, umsatz_kum - kf - var_kum])
    return out


def de(v):
    return (str(int(v)) if float(v).is_integer() else f"{v:.2f}".rstrip("0").rstrip(".")).replace(".", ",")


with open(os.path.join(HIER, "bep.csv"), "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh, delimiter=";", lineterminator="\r\n")
    w.writerow(["Monat", "Absatz_Stueck", "Absatz_kum_Stueck", "Umsatz_TEUR", "Umsatz_kum_TEUR", "Variable_Kosten_TEUR",
                "Variable_Kosten_kum_TEUR", "Fixkosten_Jahr_TEUR", "Gesamtkosten_kum_TEUR", "Ergebnis_kum_TEUR"])
    for z in monatswerte(**BASIS):
        w.writerow([z[0]] + [de(v) for v in z[1:]])

# Kontrollausgabe: Break-Even im Basisfall
b = BASIS
db = b["preis"] - b["kv"]
bep = b["kf"] * 1000 / db
print(f"Deckungsbeitrag {db} € je Stück, Break-Even-Menge {bep:.0f} Stück, -Umsatz {bep * b['preis'] / 1000:.0f} Tsd. €, "
      f"Monat {MONATE[math.ceil(bep / b['menge']) - 1]} (nach {bep / b['menge']:.1f} Monaten), "
      f"Jahresergebnis {12 * b['menge'] * db / 1000 - b['kf']:+.0f} Tsd. €")
for z in monatswerte(**BASIS):
    print(f"{z[0]:10s} Absatz {z[2]:6d}  Umsatz {z[4]:7.0f}  Gesamtkosten {z[8]:7.0f}  Ergebnis {z[9]:+7.0f}")
