"""Daten für Abb. 3.14 „Ist-Ist-Vergleiche“.

Gemeinsamer Datensatz der Erfolgsrechnung für Abb. 3.14 (Ist-Ist), 3.15 (Plan-Ist) und 3.17 (Plan-Wird): Die drei
Generatoren enthalten dieselbe Tabelle WERTE; jeder schreibt nur die Szenarien, die seine Abbildung zeigt
(hier: Ist und Vorjahr, Monat und kumuliert).

Werte der Zeilen unverändert aus dem Original (5. Auflage). Das Original nannte keine Einheit – gelesen als Mio. €
(wie Abb. 3.16). Berichtsmonat August 2027, kumuliert Januar–August 2027, Vorjahr 2026. Summen (Gesamtleistung,
Gesamtkosten, Erfolg), Abweichungen und Prozente rechnet das Visual aus den Zeilen. Das Original rechnete im Monat
mit verdeckten Nachkommastellen; daher weichen dort einzelne Summen und Prozente vom Original ab (Kontrollausgabe).
Für die Filter Zeit (Berichtsmonat Januar–August) und Segment (drei Segmente) werden die Monatswerte je Segment
erzeugt: Die Summe über alle Segmente ergibt im August und kumuliert Januar–August genau die Werte der Tabelle WERTE.
Ausgabe: guv.json (Zeilen, Segmente, Monatswerte) und guv.csv (Berichtszeile × Segment × Szenario × Monat).
"""
import csv
import json
import os

HIER = os.path.dirname(os.path.abspath(__file__))
JAHR, MONAT = 2027, 8
SZENARIEN = ["VJ_M", "IST_M", "VJ_K", "IST_K"]          # diese Abbildung

# Berichtszeile, Gruppe (L = Leistung, K = Kosten)
ZEILEN = [("Umsatzerlöse", "L"), ("Sonstige Erlöse", "L"), ("Bestandsveränderungen", "L"),
          ("Materialkosten", "K"), ("Fremdleistungen", "K"), ("Personalkosten", "K"),
          ("Abschreibungen", "K"), ("Sonstige Kosten", "K")]
# Szenario_Zeitraum: M = Monat August, K = kumuliert Januar–August, J = Gesamtjahr (Mio. €)
WERTE = {
    "IST_M": [133, 17, 37, 42, 8, 50, 9, 8],
    "VJ_M":  [110, 19, 33, 54, 17, 42, 4, 11],
    "PL_M":  [118, 19, 33, 46, 13, 38, 8, 6],
    "IST_K": [1000, 200, 400, 500, 100, 600, 100, 100],
    "VJ_K":  [900, 250, 400, 600, 200, 500, 50, 150],
    "PL_K":  [1000, 250, 400, 500, 150, 450, 100, 100],
    "PL_J":  [1200, 400, 600, 750, 300, 600, 150, 120],
    "FC_J":  [1300, 350, 700, 800, 250, 700, 200, 150],
}
MONATE = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober",
          "November", "Dezember"]
SZ_TEXT = {"IST": "Ist", "VJ": "Vorjahr", "PL": "Plan", "FC": "Forecast"}
ZR_TEXT = {"M": f"Monat {MONATE[MONAT - 1]}", "K": f"kumuliert Januar–{MONATE[MONAT - 1]}", "J": "Gesamtjahr"}

def verteile(summe, gewichte):
    """Ganzzahlige Aufteilung einer Summe nach Gewichten (größte Reste), Summe bleibt exakt."""
    g = sum(gewichte)
    roh = [summe * x / g for x in gewichte]
    teil = [int(r) for r in roh]
    for i in sorted(range(len(roh)), key=lambda i: roh[i] - teil[i], reverse=True)[:summe - sum(teil)]:
        teil[i] += 1
    return teil


# Verlauf Januar–Juli (Saison) und Anteile der Segmente je Berichtszeile
SAISON = {"IST": [0.86, 0.90, 1.02, 1.05, 1.08, 0.97, 1.12], "VJ": [0.92, 0.95, 1.00, 1.02, 1.04, 1.00, 1.07]}
SEGMENTE = ["Antriebe", "Steuerungen", "Service"]
ANTEIL = [(52, 30, 18), (30, 25, 45), (45, 35, 20), (50, 32, 18), (40, 25, 35), (48, 32, 20), (55, 30, 15), (35, 25, 40)]
# Monatswerte: MON[sz][segment][zeile][monat 1..8]; August = Monatswert, Januar–August = kumuliert (je Zeile exakt)
MON8 = {}
for sz in ("IST", "VJ"):
    gesamt = []
    for i in range(len(ZEILEN)):
        aug, kum = WERTE[sz + "_M"][i], WERTE[sz + "_K"][i]
        gesamt.append(verteile(kum - aug, [x + 0.04 * ((i * 3 + m) % 5) for m, x in enumerate(SAISON[sz])]) + [aug])
    seg = [[[0] * 8 for _ in ZEILEN] for _ in SEGMENTE]
    for i in range(len(ZEILEN)):
        for m in range(8):
            for s_, w in enumerate(verteile(gesamt[i][m], ANTEIL[i])):
                seg[s_][i][m] = w
    MON8[sz] = seg

json.dump({"jahr": JAHR, "monat": MONAT, "einheit": "Mio. €", "zeilen": [list(z) for z in ZEILEN],
           "segmente": SEGMENTE, "monatswerte": MON8},
          open(os.path.join(HIER, "guv.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))

with open(os.path.join(HIER, "guv.csv"), "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh, delimiter=";", lineterminator="\r\n")
    w.writerow(["Berichtszeile", "Gruppe", "Vorzeichen", "Segment", "Szenario", "Monat", "Jahr", "Wert_Mio_EUR"])
    for s_, sg in enumerate(SEGMENTE):
        for i, (name, gruppe) in enumerate(ZEILEN):
            for sz in ("IST", "VJ"):
                for m in range(8):
                    w.writerow([name, "Leistung" if gruppe == "L" else "Kosten", 1 if gruppe == "L" else -1, sg,
                                SZ_TEXT[sz], MONATE[m], JAHR - 1 if sz == "VJ" else JAHR, MON8[sz][s_][i][m]])

# Kontrollausgabe: Summen je Szenario (Segmente zusammen, Berichtsmonat August)
for k in SZENARIEN:
    sz, zr = k.split("_")
    v = [sum(MON8[sz][s_][i][7] if zr == "M" else sum(MON8[sz][s_][i]) for s_ in range(3)) for i in range(len(ZEILEN))]
    assert v == WERTE[k], k
    gl, gk = sum(v[:3]), sum(v[3:])
    print(f"{k:6s} Gesamtleistung {gl:5d}  Gesamtkosten {gk:5d}  Erfolg {gl - gk:5d}")
