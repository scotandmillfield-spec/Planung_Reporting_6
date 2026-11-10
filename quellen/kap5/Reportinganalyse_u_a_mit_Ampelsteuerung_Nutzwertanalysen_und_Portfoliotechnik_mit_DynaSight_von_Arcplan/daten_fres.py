"""Daten für Abb. 5.42 – Dashboard „Frühwarn-, Risiko- und Erfolgsreporting“ (Projektcontrolling, April 2027).

Vier Bildschirme des Originals in einem Dashboard: Spitzenkennzahlen mit Ampel, Soft Facts als Nutzwertanalyse,
Portfolio Kosten-/Terminabweichung der Projekte („Strategieabgleich“) und Marktportfolio der Produktfelder („Strategie“).
Werte des Originals (Periode April 1999/2000 → April 2027, T€ → Tsd. €):
- Spitzenkennzahlen der fünf Projekte im April exakt: Projektwert, Projektergebnis (Prog.), DB/AW (AK), Cashflow (Ist),
  ΔELK, ΔFLK, ΔRisikovorsorge (Prog. − ArK), Terminverzug. DB/PW (Prog.) ergibt sich als Projektergebnis / Projektwert
  (im Original identisch) und wird im Dashboard gerechnet. Januar bis März sind erfunden (Verlauf zum Aprilwert).
- Soft Facts: Profil des Projekts Sensortechnik wie im Original; Gewichte und die Profile der übrigen Projekte erfunden,
  so dass die Ampel der Spalte „Soft Facts“ zum Original passt. Skala der Projektkomplexität korrigiert (1 = sehr gering).
- Portfolio Kosten/Termine: aus den Spitzenkennzahlen gerechnet (Kostenabweichung / Projektwert, Terminverzug /
  geplante Dauer); geplante Dauer erfunden.
- Marktportfolio: zehn Produktfelder mit Lage und Volumen in Anlehnung an das Original (dort 25 Felder), Namen neutral;
  zwei Felder leicht verschoben, damit sich Kreise und Beschriftungen nicht überdecken.
Ausgabe: fres.json und fres.csv.
"""
import csv
import json
import os

HIER = os.path.dirname(os.path.abspath(__file__))
JAHR = 2027
MONATE = ["Jan", "Feb", "Mär", "Apr"]
# Kriterium, Gewicht %, Skala 1 (günstig) … 5 (ungünstig)
KRITERIEN = [
    ["Koordinationsintensität", 10, "sehr gering", "sehr hoch"],
    ["Projektkomplexität", 15, "sehr gering", "sehr hoch"],
    ["Regionale Risiken", 10, "sehr gering", "sehr hoch"],
    ["Kundenbonität", 15, "sehr hoch", "sehr gering"],
    ["Strategierelevanz", 10, "sehr hoch", "sehr gering"],
    ["Projekterfahrung", 15, "sehr hoch", "sehr gering"],
    ["Vertragsqualität", 15, "sehr hoch", "sehr gering"],
    ["Prozessqualität", 10, "sehr hoch", "sehr gering"],
]
FELDER = [  # Produktfeld, Wettbewerbsstärke, Marktattraktivität (0–15), Auftragsvolumen Tsd. €
    ["Mess- und Sensortechnik", 9.0, 6.0, 4746], ["Gerüst- und Stahlbau", 3.0, 8.0, 2903],
    ["Industrieanlagen", 5.0, 4.0, 7689], ["Schaltanlagen", 10.0, 10.0, 7393], ["Netzwerktechnik", 12.0, 9.0, 10623],
    ["Tankbau", 6.0, 14.5, 7476], ["Kühl- und Klimatechnik", 10.0, 13.0, 4122], ["Heiztechnik", 11.0, 5.0, 9934],
    ["Verbrennungsanlagen", 6.2, 2.0, 9664], ["Wassertechnik", 9.0, 3.5, 9116],
]
# Projekt, Kurzname (Ort, Beschriftung der Portfolios), Produktfeld, geplante Dauer (Tage), Projektwert, DB/AW (AK) %, Soft Facts (8 Kriterien),
# je Monat Jan–Apr: Projektergebnis (Prog.), Cashflow (Ist), ΔELK, ΔFLK, ΔRisikovorsorge, Terminverzug (Tage)
PROJEKTE = [
    ["Sensortechnik Malmö", "Malmö", 0, 365, 13684, 0.00, [3, 2, 3, 2, 3, 4, 3, 3],
     {"erg": [1100, 520, -760, -1850], "cf": [380, 260, 40, -125], "delk": [180, 390, 610, 832],
      "dflk": [240, 620, 1100, 1582], "drisk": [-60, -120, -180, -227], "tv": [0, 0, 14, 30]}],
    ["Gerüstbau Aue", "Aue", 1, 240, 2236, 3.86, [4, 2, 2, 4, 3, 3, 4, 4],
     {"erg": [210, 240, 265, 286], "cf": [420, 610, 820, 969], "delk": [-40, -80, -110, -141],
      "dflk": [-20, -50, -75, -97], "drisk": [0, 20, 35, 47], "tv": [30, 70, 95, 119]}],
    ["Anlagenbau Hoyerswerda", "Hoyerswerda", 2, 540, 39774, -18.58, [5, 5, 2, 3, 2, 4, 4, 3],
     {"erg": [-15200, -17900, -20600, -23291], "cf": [-1900, -2800, -3900, -4711], "delk": [8400, 9900, 11300, 12776],
      "dflk": [3100, 3700, 4300, 4832], "drisk": [2500, 2900, 3300, 3753], "tv": [60, 75, 90, 100]}],
    ["Verschaltung Sydney", "Sydney", 3, 300, 10292, 5.03, [3, 3, 4, 2, 3, 3, 3, 2],
     {"erg": [780, 805, 830, 849], "cf": [1100, 1650, 2200, 2673], "delk": [-300, -420, -540, -649],
      "dflk": [-10, -25, -35, -48], "drisk": [0, 0, 0, 0], "tv": [60, 60, 60, 60]}],
    ["Netzwerktechnik Lima", "Lima", 4, 420, 63725, 1.85, [3, 4, 5, 3, 2, 3, 4, 3],
     {"erg": [520, 580, 650, 703], "cf": [400, 900, 1400, 1954], "delk": [-5200, -6500, -7800, -9088],
      "dflk": [120, 230, 350, 465], "drisk": [0, 0, 0, 0], "tv": [0, 0, 0, 0]}],
]
# Kontrolle gegen das Original (April): Projektergebnis, DB/PW %, Cashflow, ΔELK, ΔFLK, ΔRisiko, Terminverzug
ORIGINAL = [(-1850, -13.52, -125, 832, 1582, -227, 30), (286, 12.79, 969, -141, -97, 47, 119),
            (-23291, -58.56, -4711, 12776, 4832, 3753, 100), (849, 8.25, 2673, -649, -48, 0, 60),
            (703, 1.10, 1954, -9088, 465, 0, 0)]
for p, o in zip(PROJEKTE, ORIGINAL):
    m = p[7]
    assert (m["erg"][3], round(m["erg"][3] / p[4] * 100, 2), m["cf"][3], m["delk"][3], m["dflk"][3], m["drisk"][3], m["tv"][3]) == o, p[0]
assert sum(k[1] for k in KRITERIEN) == 100

daten = {"jahr": JAHR, "monate": MONATE, "kriterien": KRITERIEN, "felder": FELDER,
         "projekte": [{"name": p[0], "kurz": p[1], "feld": p[2], "dauer": p[3], "pw": p[4], "dbaw": p[5], "sf": p[6], **p[7]}
                      for p in PROJEKTE]}
with open(os.path.join(HIER, "fres.json"), "w", encoding="utf-8") as fh:
    json.dump(daten, fh, ensure_ascii=False, separators=(",", ":"))
dz = lambda v: str(v).replace(".", ",")
with open(os.path.join(HIER, "fres.csv"), "w", encoding="utf-8-sig", newline="") as fh:
    wr = csv.writer(fh, delimiter=";")
    wr.writerow(["Projekt", "Monat", "Projektwert_TsdEUR", "Projektergebnis_Prog_TsdEUR", "DB_AW_AK_Prozent", "Cashflow_Ist_TsdEUR",
                 "Delta_ELK_TsdEUR", "Delta_FLK_TsdEUR", "Delta_Risikovorsorge_TsdEUR", "Terminverzug_Tage", "Geplante_Dauer_Tage",
                 "Produktfeld", *[f"SoftFacts_{k[0]}" for k in KRITERIEN]])
    for p in PROJEKTE:
        m = p[7]
        for i, mo in enumerate(MONATE):
            wr.writerow([p[0], f"{JAHR}-{i + 1:02d}", p[4], m["erg"][i], dz(p[5]), m["cf"][i], m["delk"][i], m["dflk"][i],
                         m["drisk"][i], m["tv"][i], p[3], FELDER[p[2]][0], *p[6]])

print("Kontrollwerte April 2027 (Nutzwert, DB/PW %, Kostenabweichung %, Zeitverzug %):")
for p in PROJEKTE:
    m = p[7]
    nw = sum(k[1] * s for k, s in zip(KRITERIEN, p[6])) / 100
    kosten = (m["delk"][3] + m["dflk"][3] + m["drisk"][3]) / p[4] * 100
    print(f"  {p[0]:<24} Nutzwert {nw:4.2f}  DB/PW {m['erg'][3] / p[4] * 100:7.2f}  Kosten {kosten:+6.1f}  Zeit {m['tv'][3] / p[3] * 100:5.1f}")
