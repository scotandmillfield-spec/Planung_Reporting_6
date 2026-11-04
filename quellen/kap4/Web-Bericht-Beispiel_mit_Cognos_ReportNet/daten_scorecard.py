"""Daten für Abb. 4.20 – Web-Bericht „Scorecard“ eines Führungsinformationssystems.

Perspektive Finanzen mit den Werten des Originals (Ist und Budget aktuell, Plan 1 und 2 = Plan 2027 und 2028);
Korrekturen für eine stimmige Zahlenbasis: Liquide Mittel ein Zehntel des Originals (118.000 T€ lagen über dem
Gesamtkapital, das sich aus Umsatz und Kapitalumschlag ergibt), „Realisierung“ wird als Ist zu Budget gerechnet
(das Original nannte 81–92 % ohne erkennbare Rechnung). Die übrigen Perspektiven sind erfunden.
Kennzahlen Bilanz/GuV: Ergebnisbrücke Betriebsergebnis + Finanzergebnis + außerordentliches Ergebnis = EBT 24.500
(EBT und AO-Ergebnis wie im Original; Betriebs- und Finanzergebnis stimmig gemacht, im Original 4.499.035 und 18.620);
Kennzahlen mit erfundenem Vorjahr; Kapitalumschlag 1,66 statt 3,2, damit ROS 11 % × Kapitalumschlag = GKR 18,3 %.
Risiken der Perspektive Finanzen wie im Original (Namen der Verantwortlichen neutral, Abkürzungen ausgeschrieben).
Ausgabe: scorecard.json und scorecard.csv.
"""
import csv
import json
import os

HIER = os.path.dirname(os.path.abspath(__file__))
PERSPEKTIVEN = ["Finanzen", "Markt und Kunden", "Prozesse", "Potenziale"]
# Perspektive, strategisches Ziel, Messgröße, Einheit, Nachkommastellen, Wirkung (+1 Anstieg günstig), Ist, Budget, Plan 2027, Plan 2028
MESSGROESSEN = [
    [0, "Sicherung der Liquidität", "Cash Flow", "Tsd. €", 0, 1, 30000, 32000, 33500, 34000],
    [0, "Sicherung der Liquidität", "Liquide Mittel", "Tsd. €", 0, 1, 11800, 12000, 11750, 12250],
    [0, "Profitables Wachstum", "EBIT", "Tsd. €", 0, 1, 27500, 26000, 30475, 35000],
    [0, "Profitables Wachstum", "Umsatz", "Tsd. €", 0, 1, 250000, 255000, 265000, 270000],
    [0, "Substanzerhaltung", "Investitionsquote", "%", 0, 1, 92, 90, 90, 95],
    [0, "Steigerung der Rentabilität", "ROCE", "%", 0, 1, 20, 21, 22, 23],
    [0, "Steigerung der Rentabilität", "ROS", "%", 0, 1, 11, 10, 12, 13],
    [1, "Kunden binden", "Zufriedenheit", "Index", 0, 1, 78, 80, 82, 84],
    [1, "Kunden binden", "Bindungsquote", "%", 0, 1, 71, 70, 72, 74],
    [1, "Markt ausbauen", "Marktanteil", "%", 1, 1, 14.2, 15.0, 15.5, 16.0],
    [1, "Markt ausbauen", "Neukunden", "Anzahl", 0, 1, 46, 40, 50, 55],
    [1, "Qualität zeigen", "Reklamationsquote", "%", 1, -1, 1.8, 1.5, 1.4, 1.2],
    [2, "Termine halten", "Liefertermintreue", "%", 0, 1, 93, 95, 96, 97],
    [2, "Schneller liefern", "Durchlaufzeit", "Tage", 1, -1, 12.5, 12.0, 11.0, 10.0],
    [2, "Qualität sichern", "Ausschussquote", "%", 1, -1, 2.1, 2.5, 2.0, 1.8],
    [2, "Kosten senken", "Kosten je Auftrag", "€", 0, -1, 182, 175, 170, 165],
    [3, "Know-how ausbauen", "Weiterbildung", "Tage", 1, 1, 3.2, 4.0, 4.5, 5.0],
    [3, "Personal binden", "Fluktuationsquote", "%", 1, -1, 6.8, 6.0, 5.5, 5.0],
    [3, "Innovation fördern", "Vorschläge", "je MA", 1, 1, 1.4, 1.2, 1.5, 1.8],
    [3, "Gesundheit fördern", "Krankenquote", "%", 1, -1, 5.1, 4.5, 4.3, 4.0],
]
# Perspektive, Risiko, Ausmaß (Tsd. €), Beurteilung 1–5, Maßnahme (Projekt), Verantwortlich
RISIKEN = [
    [0, "Fehlende Perspektiven", 400, 3, "Einrichtung Anreizsystem", "Frau Arndt"],
    [0, "Herrschaftswissen", 180, 3, "Wissensaustausch", "Herr Tal"],
    [0, "Individuelle Kundenvarianten", 600, 4, "Bereinigung Produktportfolio", "Herr Becker"],
    [0, "Intransparenz des Marktes", 350, 3, "Aufbau der Vertriebskanäle", "Herr Roth"],
    [0, "Nachfragerückgang Inland", 1200, 5, "Markterschließung Südosteuropa", "Herr Tal"],
    [0, "Konjunkturelle Entwicklung", 800, 4, "Gemeinkostenwertanalyse", "Herr Kühn"],
    [0, "Schnittstellenprobleme", 250, 3, "Prozessstandardisierung", "Herr Becker"],
    [0, "Nachlässigkeit", 150, 3, "Kaizen-Programm", "Herr Tal"],
    [0, "Wechselkursschwankungen", 120, 2, "Devisentermingeschäfte", "Frau Arndt"],
    [0, "Zinsänderung", 90, 1, "Zinssicherung prüfen", "Frau Arndt"],
    [1, "Verlust eines Großkunden", 900, 4, "Key-Account-Programm", "Herr Roth"],
    [1, "Preisdruck im Wettbewerb", 500, 3, "Wertanalyse Sortiment", "Herr Becker"],
    [1, "Imageschaden", 300, 2, "Beschwerdemanagement", "Frau Arndt"],
    [2, "Lieferengpass Rohstoffe", 700, 4, "Zweitlieferanten qualifizieren", "Herr Kühn"],
    [2, "Maschinenausfall", 450, 3, "Vorbeugende Instandhaltung", "Herr Tal"],
    [2, "IT-Ausfall", 380, 3, "Notfallplan", "Herr Becker"],
    [3, "Fachkräftemangel", 650, 4, "Ausbildungsoffensive", "Frau Arndt"],
    [3, "Abwanderung Schlüsselpersonal", 420, 3, "Nachfolgeplanung", "Herr Roth"],
    [3, "Überalterung", 200, 2, "Wissenstransfer", "Herr Kühn"],
]
# Ergebnisbrücke in Tsd. € (Typ s = Summe, d = Beitrag)
BRUECKE = [["Betriebsergebnis", 23890, "s"], ["Finanzergebnis", -3000, "d"], ["AO-Ergebnis", 3610, "d"], ["EBT", 24500, "s"]]
# Gruppe, Kennzahl, Wert 2026, Vorjahr, Nachkommastellen, Definition
KENNZAHLEN = [
    ["Rentabilität, %", "Eigenkapitalrentabilität", 23.6, 21.9, 1, "Jahresüberschuss in % des Eigenkapitals"],
    ["Rentabilität, %", "Gesamtkapitalrentabilität", 18.3, 17.6, 1, "EBIT in % des Gesamtkapitals (= ROS × Kapitalumschlag)"],
    ["Umschlag, pro Jahr", "Kapitalumschlag", 1.66, 1.58, 2, "Umsatz : Gesamtkapital"],
    ["Umschlag, pro Jahr", "Erzeugnisumschlag", 19.4, 18.1, 1, "Umsatz : Bestand an Erzeugnissen"],
    ["Umschlag, pro Jahr", "Forderungsumschlag", 22.3, 23.5, 1, "Umsatz : Forderungen aus Lieferungen und Leistungen"],
    ["Umschlag, pro Jahr", "Materialumschlag", 12.6, 12.9, 1, "Materialaufwand : Materialbestand"],
]

assert sum(b[1] for b in BRUECKE[:3]) == BRUECKE[3][1]
json.dump({"jahr": 2026, "perspektiven": PERSPEKTIVEN, "messgroessen": MESSGROESSEN, "risiken": RISIKEN,
           "bruecke": BRUECKE, "kennzahlen": KENNZAHLEN},
          open(os.path.join(HIER, "scorecard.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))

de = lambda v: str(v).replace(".", ",")
with open(os.path.join(HIER, "scorecard.csv"), "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh, delimiter=";", lineterminator="\r\n")
    w.writerow(["Ebene", "Perspektive", "Gruppe_Ziel", "Name", "Einheit", "Ist_2026", "Budget_2026", "Plan_2027", "Plan_2028",
                "Vorjahr", "Ausmass_Tsd_EUR", "Beurteilung", "Massnahme", "Verantwortlich"])
    for p, z, m, e, _, _, ist, bu, p1, p2 in MESSGROESSEN:
        w.writerow(["Messgröße", PERSPEKTIVEN[p], z, m, e, de(ist), de(bu), de(p1), de(p2), "", "", "", "", ""])
    for p, r, a, b, ms, v in RISIKEN:
        w.writerow(["Risiko", PERSPEKTIVEN[p], "", r, "Tsd. €", "", "", "", "", "", a, b, ms, v])
    for n, v, _ in BRUECKE:
        w.writerow(["Ergebnisbrücke", "", "", n, "Tsd. €", v, "", "", "", "", "", "", "", ""])
    for g, n, v, vj, _, _ in KENNZAHLEN:
        w.writerow(["Kennzahl", "", g, n, g.split(", ")[1], de(v), "", "", "", de(vj), "", "", "", ""])

# Kontrollausgabe
for p, name in enumerate(PERSPEKTIVEN):
    zs = [m for m in MESSGROESSEN if m[0] == p]
    ung = [m[2] for m in zs if (m[6] - m[7]) * m[5] < 0]
    print(f"{name}: {len(zs)} Messgrößen, unter Budget (nach Wirkung): {', '.join(ung)}")
    for m in zs:
        print(f"   {m[2]:26s} Ist/Budget {m[6] / m[7]:6.1%}  ΔBU {(m[6] / m[7] - 1) * 100:+5.1f} %")
umsatz, ebit, gkr, ku = 250000, 27500, 18.3, 1.66
print(f"ROS {ebit / umsatz:.1%} × Kapitalumschlag {ku} = {ebit / umsatz * ku:.1%} (GKR {gkr} %); Gesamtkapital {umsatz / ku:,.0f} Tsd. €")
