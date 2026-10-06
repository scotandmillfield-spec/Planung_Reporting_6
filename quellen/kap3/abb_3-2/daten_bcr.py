"""Daten für Abb. 3.2 „Balanced Chance and Risk Card“ (Neuaufbau, 6. Auflage).

Struktur wie im Original der 5. Auflage: fünf Perspektiven, 17 strategische Ziele, 24 Kennzahlen mit Vorjahr,
Forecast und Plan sowie Mittelfristplanung, je Kennzahl eine Maßnahme und eine Chance bzw. ein Risiko mit
Eintrittswahrscheinlichkeit (1–5) und Wert. Zahlen der Kennzahlen erfunden und in sich stimmig (Stand 30.06.2026,
gleiches Unternehmen wie Abb. 3.3 und 3.5); Chancen und Risiken mit den Werten des Originals (dort T€, hier Mio. €
bei zehnfach größerem Unternehmen). Maßnahmen, die in der Projektroadmap (Abb. 3.3/3.5) als Projekt geführt
werden, tragen deren Namen; Status und Fertigstellung zum 30.06.2026 kommen aus ../abb_3-5/projekte.json.
Ausgabe: bcr.json (kompakt) und bcr.csv.
"""
import csv
import json
import os

HIER = os.path.dirname(os.path.abspath(__file__))
PR = json.load(open(os.path.join(HIER, "..", "abb_3-5", "projekte.json"), encoding="utf-8"))
PERSPEKTIVEN = ["Finanzen", "Markt, Kunde, Produkt", "Prozesse", "Organisation", "Mitarbeiter"]

# Perspektive, Ziel, Kennzahl, Einheit, Nachkommastellen, Wirkung (+1 Anstieg günstig, -1 ungünstig, 0 neutral),
# VJ 2025, FC 2026, PL 2026, PL 2027, PL 2028, PL 2029, Maßnahme, Art (C/R/None), Chance/Risiko, Eintritt 1–5, Wert Mio. €
K = [
    (0, "Wachstum 5 % p. a.", "Nettoumsatz", "Mio. €", 1, 1, 236.8, 243.9, 248.6, 261.0, 274.1, 287.8,
     "Übernahme Digitalanbieter", "C", "Positive Konjunktur", 2, 20.0),
    (0, "", "Umsatzwachstum", "%", 1, 1, 2.4, 3.0, 5.0, 5.0, 5.0, 5.0,
     "Vertriebsausbau DACH", "R", "Stärkerer Wettbewerb", 2, 1.0),
    (0, "Rendite steigern", "ROI", "%", 1, 1, 9.4, 10.1, 12.0, 13.0, 14.0, 15.0,
     "Rationalisierung Montage", "R", "Gemeinkostensteigerung", 1, 0.5),
    (0, "", "Umsatzrentabilität", "%", 1, 1, 6.2, 7.2, 7.0, 7.5, 8.0, 8.5,
     "", "R", "Tarifsteigerung", 2, 0.1),
    (0, "Liquidität sichern", "Cashflow", "Mio. €", 1, 1, 21.4, 18.9, 22.5, 24.0, 26.0, 28.0,
     "Digitales Mahnwesen", "R", "Anzahlungsrisiko", 4, 10.0),
    (0, "", "Debitorenziel", "Tage", 0, -1, 38, 46, 35, 33, 32, 30,
     "", "R", "Forderungsausfall", 4, 15.0),
    (1, "Marktanteil online steigern", "Marktanteil", "%", 1, 1, 10.0, 12.3, 12.0, 13.0, 14.0, 15.0,
     "Online-Akquiseplattform", "R", "A-Kundenabhängigkeit", 2, 8.0),
    (1, "", "Auftragsbestand", "Mio. €", 1, 1, 96.0, 94.8, 100.0, 105.0, 110.0, 115.0,
     "", "R", "Öko-Sensibilität", 3, 4.0),
    (1, "Fremdleistung 50 %", "Fremdleistungsanteil", "%", 1, 1, 38.0, 46.0, 50.0, 50.0, 50.0, 50.0,
     "Subunternehmer steuern", "R", "Abstimmungsprobleme", 2, 1.5),
    (1, "Marktbearbeitung stärken", "Hitrate", "%", 1, 1, 35.0, 41.0, 40.0, 42.0, 44.0, 45.0,
     "CRM-Einführung", "C", "CRM-Defizite Wettbewerb", 3, 5.5),
    (1, "", "Umsatz/Verkäufer", "Tsd. €", 0, 1, 2145, 2250, 2200, 2300, 2400, 2500,
     "Strategische Allianzen", "C", "Höhere Kaufkraft", 3, 11.5),
    (1, "Technologie ausbauen", "Neuprodukte", "Mio. €", 1, 1, 18.0, 17.6, 20.0, 24.0, 28.0, 32.0,
     "Produktlinie AT20", "R", "Substitutionsprodukte", 2, 3.0),
    (1, "Sortiment optimieren", "Variantenanteil", "%", 1, 0, 12.0, 15.0, 15.0, 15.0, 15.0, 15.0,
     "Modularisierung GT1", "C", "Neue Kundenwünsche", 3, 11.5),
    (1, "", "Umsatz Poor Dogs", "Mio. €", 1, -1, 48.9, 42.4, 40.0, 32.0, 25.0, 20.0,
     "", "R", "Start-up-Wettbewerb", 2, 2.0),
    (2, "Service verbessern", "Ø Servicezeit", "Std.", 0, -1, 78, 82, 60, 48, 36, 24,
     "Digitaler Serviceprozess", "R", "Softwareabhängigkeit", 4, 10.0),
    (2, "Fertigung modernisieren", "Anteil neuer Anlagen", "%", 1, 1, 22.0, 26.0, 30.0, 36.0, 42.0, 48.0,
     "Energiesparende Anlagen", "R", "Technologiewechsel", 1, 0.5),
    (2, "Liefertreue auf 98 %", "Liefertreue", "%", 1, 1, 93.0, 95.6, 95.0, 96.0, 97.0, 98.0,
     "Prozessstandardisierung", "R", "Schnittstellenkoordination", 2, 1.0),
    (2, "Auslastung erhöhen", "Kapazitätsauslastung", "%", 1, 1, 80.0, 78.0, 85.0, 88.0, 90.0, 92.0,
     "Fixkosten Altanlagen", "R", "Kostenremanenz", 3, 5.0),
    (3, "Projektgruppen etablieren", "Übergreifende Projekte", "", 0, 1, 7, 6, 9, 10, 11, 12,
     "Projektmanagement-Office", "R", "Überlastung, Koordination", 3, 1.0),
    (3, "Nachwuchskräfte fördern", "Führungsnachwuchs", "", 0, 1, 4, 6, 6, 8, 10, 12,
     "Führungskräfteentwicklung", "R", "Fachkräftemangel", 3, 6.0),
    (3, "Internationalisierung", "Auslandserfahrung", "%", 1, 1, 12.0, 14.0, 18.0, 22.0, 26.0, 30.0,
     "Recruiting Fachkräfte", None, "", 0, 0.0),
    (4, "Motivation stärken", "Krankenquote", "%", 1, -1, 7.0, 6.5, 6.8, 6.5, 6.2, 6.0,
     "Arbeitszeitstudie", "R", "Überlastung, Burn-out", 3, 1.0),
    (4, "", "DB je Kopf", "Tsd. €", 0, 1, 108, 95, 112, 116, 120, 125,
     "", None, "", 0, 0.0),
    (4, "Wissenstransfer stärken", "Weiterbildung", "Tage/Kopf", 1, 1, 2.0, 3.2, 3.0, 3.5, 4.0, 4.0,
     "Weiterbildungsprogramm", "C", "Kreativität Mitarbeitende", 2, 5.0),
]
# Erläuterungen für den Tooltip (Kennzahlen, deren Kurzname erklärungsbedürftig ist)
ERKL = {
    "Neuprodukte": "Auftragseingang mit Produkten jünger als zwei Jahre",
    "Umsatz Poor Dogs": "Umsatz der Produkte mit geringem Wachstum und geringem Marktanteil",
    "Auslandserfahrung": "Anteil der Führungskräfte mit internationaler Erfahrung",
    "Übergreifende Projekte": "Projekte mit Beteiligten aus mehreren Bereichen",
    "Führungsnachwuchs": "Nachwuchsführungskräfte im Entwicklungsprogramm",
}

# Roadmap-Projekte zum 30.06.2026 (Stand-Index 4)
namen = [p[0] for p in PR["projekte"]]
stand = {z[1]: z for z in PR["zeilen"] if z[0] == 4}
def projekt(name):
    if name not in namen:
        return None
    z = stand.get(namen.index(name))
    return None if z is None else [PR["status"][z[2]], z[3]]

zeilen = []
for k in K:
    p, ziel, kz, einh, nk, wirk, vj, fc, pl, p27, p28, p29, mn, art, cr, ein, wert = k
    zeilen.append([p, ziel, kz, einh, nk, wirk, vj, fc, pl, [p27, p28, p29], mn, projekt(mn),
                   art or "", cr, ein, (wert if art == "C" else -wert) if art else None, ERKL.get(kz, "")])

json.dump({"stand": "30.06.2026", "perspektiven": PERSPEKTIVEN,
           # Zeile: Perspektive, Ziel (leer = wie oben), Kennzahl, Einheit, NK, Wirkung, VJ, FC, PL, [PL 27–29],
           # Maßnahme, [Roadmap-Status, Fertigstellung %] oder null, Art C/R, Chance/Risiko, Eintritt 1–5,
           # Wert Mio. € (Chance +, Risiko −), Erläuterung
           "zeilen": zeilen}, open(os.path.join(HIER, "bcr.json"), "w", encoding="utf-8"),
          ensure_ascii=False, separators=(",", ":"))

dez = lambda v: "" if v is None else str(v).replace(".", ",")
with open(os.path.join(HIER, "bcr.csv"), "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh, delimiter=";")
    w.writerow(["Perspektive", "Strategisches_Ziel", "Kennzahl", "Einheit", "Wirkung", "VJ_2025", "FC_2026", "PL_2026",
                "PL_2027", "PL_2028", "PL_2029", "Maßnahme", "Roadmap_Status", "Chance_Risiko", "Art", "Eintritt_1_5",
                "Wert_MioEUR"])
    ziel = ""
    for z in zeilen:
        ziel = z[1] or ziel
        w.writerow([PERSPEKTIVEN[z[0]], ziel, z[2], z[3], {1: "Anstieg günstig", -1: "Anstieg ungünstig", 0: "neutral"}[z[5]],
                    dez(z[6]), dez(z[7]), dez(z[8]), *map(dez, z[9]), z[10], z[11][0] if z[11] else "",
                    z[13], {"C": "Chance", "R": "Risiko"}.get(z[12], ""), z[14] or "", dez(z[15])])

# Kontrollausgabe
for i, name in enumerate(PERSPEKTIVEN):
    zs = [z for z in zeilen if z[0] == i]
    sal = sum(z[15] or 0 for z in zs)
    hinter = sum(1 for z in zs if z[5] and (z[7] - z[8]) * z[5] < 0)
    print(f"{name:24s} Kennzahlen {len(zs)}  hinter Plan {hinter}  Saldo {sal:+.1f}")
print("Saldo gesamt %+.1f" % sum(z[15] or 0 for z in zeilen),
      "| Roadmap-Projekte:", sum(1 for z in zeilen if z[11]), "| ohne Projekt:", [z[10] for z in zeilen if z[10] and not z[11]])
for z in zeilen:
    d = (z[7] - z[8]) / abs(z[8]) * 100
    print(f"  {z[2]:24s} ΔPL {d:+6.1f} %  ΔVJ {(z[7] - z[6]) / abs(z[6]) * 100:+6.1f} %")
