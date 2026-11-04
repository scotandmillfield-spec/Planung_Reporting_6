"""Daten für Abb. 3.190 „Planungsauswertung Personalkostenplanung“.

Gemeinsamer Datensatz mit Abb. 3.189 „Planungsformular Personalkostenplanung“: Planstellen, FTE, Monatsentgelte,
Gültigkeiten und Prämissen (Zulagen, Urlaubs- und Weihnachtsgeld, Sozialabgaben) stehen genau einmal – im Block
PLAN der Maske (../Planungsformular_Personalkostenplanung/personalkosten.js, zwischen den Markierungen
PLANDATEN-ANFANG und PLANDATEN-ENDE, reines JSON). Dieser Generator liest den Block und rechnet mit denselben Regeln
wie die Maske die Monatswerte je Planstelle und Kostenart:

  Grundentgelt  = FTE × Monatsentgelt × Anteil des Monats (tagesgenau innerhalb von „gültig von/bis“)
  Zulagen       = Grundentgelt × Zulagen %
  Sonderzahlung = FTE × Monatsentgelt × Anteil × Urlaubsgeld % (Juli) bzw. Weihnachtsgeld % (November)
  Sozialabgaben = (Grundentgelt + Zulagen + Sonderzahlung) × Sozialabgaben %
  Anwesenheitslohn = Grundentgelt + Zulagen; Lohnnebenkosten = Sonderzahlungen + Sozialabgaben

Jeder Wert wird auf Cent gerundet (floor(x · 100 + 0,5), wie Math.round in der Maske). Kein Zufall im Spiel –
die Auswertung zeigt also genau die Summen des Formulars (Kontrollausgabe unten).
Grain: Planstelle × Monat × Kostenart (Betrag in Cent). Ausgabe: personalkosten.json und personalkosten.csv.
"""
import csv
import json
import math
import os
import re
from datetime import date

HIER = os.path.dirname(os.path.abspath(__file__))
MASKE = os.path.join(os.path.dirname(HIER), "Planungsformular_Personalkostenplanung", "personalkosten.js")

quelle = open(MASKE, encoding="utf-8").read()
m = re.search(r"/\* PLANDATEN-ANFANG \*/\s*const PLAN = (\{.*?\});\s*/\* PLANDATEN-ENDE \*/", quelle, re.S)
if not m:
    raise SystemExit(f"Block PLAN in {MASKE} nicht gefunden")
PLAN = json.loads(m.group(1))
P, JAHR = PLAN["praemissen"], PLAN["planjahr"]
STELLEN = [dict(zip(PLAN["felder"], a)) for a in PLAN["planstellen"]]
MONATE = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"]
KOSTENARTEN = [["Grundentgelt", "Anwesenheitslohn"], ["Zulagen", "Anwesenheitslohn"],
               ["Sonderzahlungen", "Lohnnebenkosten"], ["Sozialabgaben", "Lohnnebenkosten"]]


def tag(t):
    d, mo, j = (int(x) for x in t.split("."))
    return date(j, mo, d).toordinal()


def anteile(von, bis):
    out = []
    for mo in range(1, 13):
        a = date(JAHR, mo, 1).toordinal()
        e = date(JAHR + (mo == 12), mo % 12 + 1, 1).toordinal() - 1
        ue = min(bis, e) - max(von, a) + 1
        out.append(ue / (e - a + 1) if ue > 0 else 0)
    return out


def cent(x):
    return math.floor(x * 100 + 0.5)


def kosten(fte, entgelt, ant):
    werte = []
    for mi, a in enumerate(ant):
        grund = fte * entgelt * a
        zul = grund * P["zulagen"] / 100
        satz = P["urlaubsgeld"] if mi + 1 == P["urlaubsgeld_monat"] else P["weihnachtsgeld"] if mi + 1 == P["weihnachtsgeld_monat"] else 0
        sonder = fte * entgelt * a * satz / 100
        sozial = (grund + zul + sonder) * P["sozialabgaben"] / 100
        werte.append([cent(grund), cent(zul), cent(sonder), cent(sozial)])
    return werte


zeilen, fte_monat = [], []               # [Stelle, Monat, Kostenart, Cent] / je Stelle FTE je Monat (×1000)
for si, s in enumerate(STELLEN):
    ant = anteile(tag(s["von"]), tag(s["bis"]))
    fte_monat.append([round(s["fte"] * a * 1000) for a in ant])
    for mi, w in enumerate(kosten(s["fte"], s["monatsentgelt"], ant)):
        for ki, c in enumerate(w):
            if c:
                zeilen.append([si, mi, ki, c])

daten = {
    "jahr": JAHR, "planversion": PLAN["planversion"], "version": PLAN["version"],
    "kostenstelle": PLAN["kostenstelle"], "praemissen": P, "monate": MONATE, "kostenarten": KOSTENARTEN,
    "stellen": [[s["planstelle"], s["bezeichnung"], s["vertragsart"], s["fte"], s["monatsentgelt"], s["von"], s["bis"]] for s in STELLEN],
    "fte": fte_monat, "werte": zeilen,
}
json.dump(daten, open(os.path.join(HIER, "personalkosten.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))

eur = lambda c: f"{c / 100:.2f}".replace(".", ",")
with open(os.path.join(HIER, "personalkosten.csv"), "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh, delimiter=";", lineterminator="\r\n")
    w.writerow(["Planjahr", "Kostenstelle", "Planstelle", "Bezeichnung", "Vertragsart", "FTE", "Monatsentgelt_EUR",
                "Gueltig_von", "Gueltig_bis", "Monat", "Kostenartengruppe", "Kostenart", "Betrag_EUR"])
    for si, mi, ki, c in zeilen:
        s = STELLEN[si]
        w.writerow([JAHR, " ".join(PLAN["kostenstelle"]), s["planstelle"], s["bezeichnung"], s["vertragsart"],
                    f"{s['fte']:.2f}".replace(".", ","), s["monatsentgelt"], s["von"], s["bis"],
                    f"{JAHR}-{mi + 1:02d}", KOSTENARTEN[ki][1], KOSTENARTEN[ki][0], eur(c)])

# Kontrollausgabe: Summen wie im Ergebnis der Maske
k = [sum(c for _, _, ki, c in zeilen if ki == j) for j in range(4)]
print(f"Personalkosten {eur(sum(k))} €  Anwesenheitslohn {eur(k[0] + k[1])} €  Lohnnebenkosten {eur(k[2] + k[3])} €")
print("  je Kostenart: " + ", ".join(f"{KOSTENARTEN[j][0]} {eur(k[j])}" for j in range(4)))
print(f"  FTE im Jahresmittel {sum(map(sum, fte_monat)) / 12000:.2f}")
print("  je Monat: " + " ".join(f"{MONATE[mi]} {sum(c for _, m_, _, c in zeilen if m_ == mi) / 100:.0f}" for mi in range(12)))
print("  je Planstelle: " + " ".join(f"{STELLEN[si]['planstelle']} {sum(c for s_, _, _, c in zeilen if s_ == si) / 100:.0f}" for si in range(len(STELLEN))))
