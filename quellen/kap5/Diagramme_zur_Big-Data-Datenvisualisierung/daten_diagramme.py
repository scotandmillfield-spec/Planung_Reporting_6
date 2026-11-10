"""Daten für Abb. 5.66 „Diagramme zur Big-Data-Datenvisualisierung“: zwölf Diagrammarten als kleine Vielfache.

Original: Collage von zwölf Diagrammen aus einer Visualisierungsbibliothek (gepackte Blasen, Kalender-Heatmap,
Baumdiagramm, Flächenkartogramm Deutschland, eingerückter Baum, Kantenbündelung, Sunburst, Wortwolke, Treemap,
Sehnendiagramm, Balkendiagramm, 3D-Globus mit Säulen) ohne Beschriftung und mit englischen Beispieldaten.
Hier ein gemeinsames, erfundenes Beispiel eines Online-Händlers (namenlos), Jahr 2026 bzw. 1. Quartal 2027:
- Sortiment: Umsatz je Bereich und Warengruppe in Mio. € (Baumdiagramm, eingerückter Baum, Treemap, Sunburst,
  Balkendiagramm – gleiche Daten, damit die Arten vergleichbar sind)
- Themen im Kundenfeedback (Nennungen) für das Blasendiagramm, Begriffe aus Kundenbewertungen für die Wortwolke
- Online-Umsatz je Einwohner in € je Bundesland (Flächenkartogramm als Kachelkarte wie Abb. 3.66)
- Webshop-Sitzungen nach Standort in Tsd. (Globus mit Säulen)
- Bestellungen je Tag im 1. Quartal 2027 (Kalender-Heatmap; fester Seed)
- Datenflüsse zwischen IT-Systemen (Kantenbündelung), Wechsel des Hauptkanals in Tsd. Kunden (Sehnendiagramm)
Ausgabe: diagramme.json und diagramme.csv (Langformat: Datensatz;Schluessel_1;Schluessel_2;Wert;Einheit).
"""
import csv
import datetime as dt
import json
import os
import random

HIER = os.path.dirname(os.path.abspath(__file__))
random.seed(566)

SORTIMENT = [("Mode", "Damen", 9.8), ("Mode", "Herren", 7.1), ("Mode", "Kinder", 4.5),
             ("Wohnen", "Möbel", 9.3), ("Wohnen", "Leuchten", 5.3),
             ("Technik", "Audio", 7.4), ("Technik", "Foto", 4.8)]
THEMEN = [("Lieferzeit", 1840), ("Preis", 1520), ("Qualität", 1390), ("Retoure", 1210), ("Passform", 980),
          ("Service", 860), ("Verpackung", 610), ("Zahlung", 540), ("App", 470), ("Nachhaltigkeit", 380)]
WOERTER = [("schnell", 420), ("Lieferung", 390), ("Qualität", 350), ("Preis", 330), ("gut", 300), ("Größe", 260),
           ("Retoure", 230), ("passt", 210), ("Service", 190), ("freundlich", 170), ("Versand", 160), ("App", 140),
           ("Farbe", 130), ("Rabatt", 120)]
# Kürzel, Name, Kachelzeile, Kachelspalte (wie Abb. 3.66), Online-Umsatz je Einwohner in €
LAENDER = [("SH", "Schleswig-Holstein", 0, 2, 540), ("HB", "Bremen", 1, 1, 600), ("HH", "Hamburg", 1, 2, 780),
           ("MV", "Mecklenburg-Vorpommern", 1, 3, 400), ("NW", "Nordrhein-Westfalen", 2, 0, 690),
           ("NI", "Niedersachsen", 2, 1, 560), ("ST", "Sachsen-Anhalt", 2, 2, 410), ("BE", "Berlin", 2, 3, 700),
           ("BB", "Brandenburg", 2, 4, 450), ("RP", "Rheinland-Pfalz", 3, 0, 520), ("HE", "Hessen", 3, 1, 650),
           ("TH", "Thüringen", 3, 2, 430), ("SN", "Sachsen", 3, 3, 480), ("SL", "Saarland", 4, 0, 470),
           ("BW", "Baden-Württemberg", 4, 1, 720), ("BY", "Bayern", 4, 2, 740)]
KLASSEN = [450, 550, 650, 750]               # Klassengrenzen € je Einwohner (fünf Klassen)
STANDORTE = [("Berlin", 52.5, 13.4, 410), ("London", 51.5, -0.1, 290), ("Paris", 48.9, 2.35, 250),
             ("Zürich", 47.4, 8.5, 230), ("Wien", 48.2, 16.4, 210), ("Amsterdam", 52.4, 4.9, 200),
             ("Warschau", 52.2, 21.0, 190), ("Rom", 41.9, 12.5, 170), ("Madrid", 40.4, -3.7, 150),
             ("New York", 40.7, -74.0, 140), ("Stockholm", 59.3, 18.1, 120), ("Istanbul", 41.0, 29.0, 110),
             ("Dubai", 25.2, 55.3, 80), ("Moskau", 55.8, 37.6, 70), ("Kairo", 30.0, 31.2, 60),
             ("Mumbai", 19.1, 72.9, 60), ("Johannesburg", -26.2, 28.0, 50), ("Lagos", 6.5, 3.4, 40)]
SYSTEME = [("Shop", "Kanäle"), ("App", "Kanäle"), ("Social Media", "Kanäle"), ("CRM", "Operative Systeme"),
           ("ERP", "Operative Systeme"), ("Lager", "Operative Systeme"), ("DWH", "Analyse"), ("Data Lake", "Analyse")]
FLUESSE = [("Shop", "ERP"), ("Shop", "CRM"), ("Shop", "Lager"), ("Shop", "Data Lake"), ("App", "CRM"),
           ("App", "Data Lake"), ("Social Media", "CRM"), ("Social Media", "Data Lake"), ("CRM", "DWH"),
           ("ERP", "Lager"), ("ERP", "DWH"), ("Lager", "DWH"), ("Data Lake", "DWH")]
KANAELE = ["Shop", "App", "Filiale", "Telefon", "Markt"]
WECHSEL = [[0, 42, 12, 4, 18],               # von Zeile zu Spalte, Tsd. Kunden
           [25, 0, 6, 2, 9],
           [30, 14, 0, 5, 3],
           [9, 6, 3, 0, 1],
           [15, 11, 2, 1, 0]]

# Bestellungen je Tag, 1. Quartal 2027: Wochentagsmuster (So/Mo stark), leichter Trend, Winterschlussverkauf
start = dt.date(2027, 1, 1)
TAG_FAKTOR = [1.08, 0.96, 0.94, 0.95, 0.90, 0.86, 1.31]   # Mo … So
tage = []
for i in range((dt.date(2027, 3, 31) - start).days + 1):
    d = start + dt.timedelta(days=i)
    v = 1180 * TAG_FAKTOR[d.weekday()] * (1 + 0.0018 * i)
    if dt.date(2027, 1, 25) <= d <= dt.date(2027, 1, 31):
        v *= 1.55                                            # Winterschlussverkauf
    v *= random.uniform(0.94, 1.06)
    tage.append(round(v))

daten = {
    "jahr": 2026, "sortiment": SORTIMENT, "themen": THEMEN, "woerter": WOERTER, "laender": LAENDER,
    "klassen": KLASSEN, "standorte": STANDORTE, "systeme": SYSTEME, "fluesse": FLUESSE, "kanaele": KANAELE,
    "wechsel": WECHSEL, "tage_start": start.isoformat(), "tage": tage,
}
json.dump(daten, open(os.path.join(HIER, "diagramme.json"), "w", encoding="utf-8"), ensure_ascii=False,
          separators=(",", ":"))

de = lambda v: str(v).replace(".", ",")
with open(os.path.join(HIER, "diagramme.csv"), "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh, delimiter=";", lineterminator="\r\n")
    w.writerow(["Datensatz", "Schluessel_1", "Schluessel_2", "Wert", "Einheit"])
    for b, g, v in SORTIMENT:
        w.writerow(["Umsatz Sortiment 2026", b, g, de(v), "Mio. EUR"])
    for t, v in THEMEN:
        w.writerow(["Themen im Kundenfeedback 2026", t, "", v, "Nennungen"])
    for t, v in WOERTER:
        w.writerow(["Begriffe in Kundenbewertungen 2026", t, "", v, "Anzahl"])
    for k, n, z, s, v in LAENDER:
        w.writerow(["Online-Umsatz je Einwohner 2026", k, n, v, "EUR"])
    for n, la, lo, v in STANDORTE:
        w.writerow(["Webshop-Sitzungen nach Standort 2026", n, f"{de(la)}/{de(lo)}", v, "Tsd."])
    for i, v in enumerate(tage):
        w.writerow(["Bestellungen je Tag", (start + dt.timedelta(days=i)).isoformat(), "", v, "Anzahl"])
    for a, b in FLUESSE:
        w.writerow(["Datenfluss zwischen Systemen", a, b, 1, "Fluss"])
    for i, a in enumerate(KANAELE):
        for j, b in enumerate(KANAELE):
            if WECHSEL[i][j]:
                w.writerow(["Wechsel des Hauptkanals 2026", a, b, WECHSEL[i][j], "Tsd. Kunden"])

ges = sum(v for _, _, v in SORTIMENT)
print("Sortiment gesamt %.1f Mio. €" % ges, {b: round(sum(v for x, _, v in SORTIMENT if x == b), 1) for b in ("Mode", "Wohnen", "Technik")})
print("Themen", sum(v for _, v in THEMEN), "Nennungen | Wörter", sum(v for _, v in WOERTER))
print("Bestellungen Q1", sum(tage), "| Tage", len(tage), "| min/max", min(tage), max(tage),
      "| Jan/Feb/Mär", sum(tage[:31]), sum(tage[31:59]), sum(tage[59:]))
print("Sitzungen", sum(x[3] for x in STANDORTE), "Tsd. | Kanalwechsel", sum(map(sum, WECHSEL)), "Tsd. | Flüsse", len(FLUESSE))
print("Länder je Klasse", [sum(1 for x in LAENDER if (sum(x[4] >= g for g in KLASSEN)) == k) for k in range(5)])
