"""Daten für Abb. 3.14 „Ist-Ist-Vergleiche“.

Gemeinsamer Datensatz der Erfolgsrechnung für Abb. 3.14 (Ist-Ist), 3.15 (Plan-Ist) und 3.17 (Plan-Wird): Die drei
Generatoren enthalten dieselbe Tabelle WERTE; jeder schreibt nur die Szenarien, die seine Abbildung zeigt
(hier: Ist und Vorjahr, Monat und kumuliert).

Werte der Zeilen unverändert aus dem Original (5. Auflage). Das Original nannte keine Einheit – gelesen als Mio. €
(wie Abb. 3.16). Berichtsmonat August 2027, kumuliert Januar–August 2027, Vorjahr 2026. Summen (Gesamtleistung,
Gesamtkosten, Erfolg), Abweichungen und Prozente rechnet das Visual aus den Zeilen. Das Original rechnete im Monat
mit verdeckten Nachkommastellen; daher weichen dort einzelne Summen und Prozente vom Original ab (Kontrollausgabe).
Ausgabe: guv.json (Zeilen, Szenarien) und guv.csv (Einzelsätze Berichtszeile × Szenario × Zeitraum).
"""
import csv
import json
import os

HIER = os.path.dirname(os.path.abspath(__file__))
JAHR, MONAT = 2027, 8
SZENARIEN = ["VJ_M", "IST_M", "VJ_K", "IST_K"]          # diese Abbildung

# Berichtszeile, Gruppe (L = Leistung, K = Kosten)
ZEILEN = [("Umsatzerlöse", "L"), ("Sonstige Erträge", "L"), ("Bestandsveränderungen", "L"),
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

json.dump({"jahr": JAHR, "monat": MONAT, "einheit": "Mio. €", "zeilen": [list(z) for z in ZEILEN],
           "werte": {k: WERTE[k] for k in SZENARIEN}},
          open(os.path.join(HIER, "guv.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))

with open(os.path.join(HIER, "guv.csv"), "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh, delimiter=";", lineterminator="\r\n")
    w.writerow(["Berichtszeile", "Gruppe", "Vorzeichen", "Szenario", "Zeitraum", "Jahr", "Wert_Mio_EUR"])
    for i, (name, gruppe) in enumerate(ZEILEN):
        for k in SZENARIEN:
            sz, zr = k.split("_")
            w.writerow([name, "Leistung" if gruppe == "L" else "Kosten", 1 if gruppe == "L" else -1,
                        SZ_TEXT[sz], ZR_TEXT[zr], JAHR - 1 if sz == "VJ" else JAHR, WERTE[k][i]])

# Kontrollausgabe: Summen je Szenario
for k in SZENARIEN:
    v = WERTE[k]
    gl, gk = sum(v[:3]), sum(v[3:])
    print(f"{k:6s} Gesamtleistung {gl:5d}  Gesamtkosten {gk:5d}  Erfolg {gl - gk:5d}")
