"""Synthetische Daten für das Test-Dashboard „Strategische Projektroadmap“.

Ein erfundenes Industrieunternehmen (ohne Namen) mit 19 strategischen Projekten.
Fünf Quartalsstände 30.06.2025 bis 30.06.2026; der älteste dient nur als Vergleich (ΔVQ).
Je Stand: Status, Fertigstellungsgrad, Kostenabweichung (Prognose minus Plan), Terminverzug, Risikoindex.
Ausgabe: projekte.json (kompakt) und projekte.csv.
"""
import csv
import json

STAENDE = ["30.06.2025", "30.09.2025", "31.12.2025", "31.03.2026", "30.06.2026"]
STATUS = {"U": "Umsetzung", "P": "Planung", "I": "Idee", "E": "erledigt"}
STATUS_FOLGE = ["U", "P", "I", "E"]          # laufend, geplant, Idee, abgeschlossen
GB = ["Antriebstechnik", "Lineartechnik", "Service", "Zentral"]
FB = ["Vertrieb", "Produktion", "F&E", "IT", "Personal", "Finanzen"]
BSC = ["Finanzen", "Kunden", "Prozesse", "Lernen und Entwicklung"]

# Name, GB, FB, BSC, Verantwortung, Plan-Kosten (Tsd. €; bei Ideen Grobschätzung), Nutzwert (1–10),
# Kapitalwert (Tsd. €, None = nicht finanziell bewertet), Statusverlauf je Stand (- = noch nicht im Portfolio),
# Endwerte zum 30.06.2026: Fertigstellung %, Kostenabweichung Tsd. €, Terminverzug Wochen, Risikoindex,
# Fortschritt je Quartal (%-Pkt.), Risikoanstieg je Quartal
P = [
    ("Übernahme Digitalanbieter", "Zentral", "Finanzen", "Finanzen", "Frau Brandt", 4720, 8.0, 2360, "PUUUU", 34, 236, 6, 82, 9, 2),
    ("Markteintritt Osteuropa", "Antriebstechnik", "Vertrieb", "Kunden", "Herr Lange", 5340, 9.0, 3150, "IPPPP", 12, 120, 4, 75, 3, 0),
    ("Vertriebsausbau DACH", "Antriebstechnik", "Vertrieb", "Kunden", "Herr Yilmaz", 3430, 8.0, 2480, "UUUUU", 82, 172, -2, 48, 14, -2),
    ("Rationalisierung Montage", "Lineartechnik", "Produktion", "Prozesse", "Frau Dehmel", 2300, 7.0, 1900, "--III", None, None, None, 35, 0, 0),
    ("Digitales Mahnwesen", "Zentral", "Finanzen", "Prozesse", "Herr Sieg", 60, 5.0, None, "UUEEE", 100, -6, 2, 15, 25, 0),
    ("Online-Akquiseplattform", "Service", "Vertrieb", "Kunden", "Frau Tamm", 1030, 8.0, 820, "-IPPP", 8, 103, 9, 78, 4, 4),
    ("CRM-Einführung", "Zentral", "Vertrieb", "Kunden", "Frau Konrad", 3600, 4.5, 900, "UUUUU", 54, 360, 8, 68, 9, 5),
    ("Ersatzteil-Webshop", "Service", "Vertrieb", "Kunden", "Herr Schwerdt", 750, 6.0, 610, "IPPPP", 6, 0, 0, 40, 2, 0),
    ("Produktlinie AT20", "Antriebstechnik", "F&E", "Kunden", "Frau Leicht", 1150, 7.5, 1400, "IPPPU", 22, 58, 3, 58, 8, -3),
    ("Modularisierung GT1", "Lineartechnik", "F&E", "Prozesse", "Herr Tal", 5400, 6.5, 3800, "UUUUU", 64, 270, 7, 72, 11, 2),
    ("Digitaler Serviceprozess", "Service", "IT", "Prozesse", "Frau Schwarz", 960, 6.0, 700, "PUUUU", 75, 48, -1, 55, 16, -2),
    ("Prozessstandardisierung", "Zentral", "IT", "Prozesse", "Herr Schön", 800, 5.5, 450, "UUUUU", 42, 240, 5, 52, 7, 3),
    ("Fixkosten Altanlagen", "Lineartechnik", "Produktion", "Finanzen", "Frau Zepper", 1600, 8.0, 2100, "UUUUU", 91, -40, -1, 12, 13, -1),
    ("Projektmanagement-Office", "Zentral", "Finanzen", "Lernen und Entwicklung", "Herr Schröder", 120, 4.0, None, "PUUUU", 65, 12, 14, 64, 12, 3),
    ("Recruiting Fachkräfte", "Zentral", "Personal", "Lernen und Entwicklung", "Frau Koslowski", 80, 7.0, None, "-PPPP", 10, 8, 0, 28, 3, 0),
    ("Gebäudesanierung Werk 2", "Lineartechnik", "Produktion", "Finanzen", "Herr Schubert", 360, 3.0, None, "IIPPP", 5, -72, 6, 40, 2, 0),
    ("Energiesparende Anlagen", "Lineartechnik", "Produktion", "Finanzen", "Frau Lotz", 1060, 3.0, 900, "---II", None, None, None, 30, 0, 0),
    ("Führungskräfteentwicklung", "Zentral", "Personal", "Lernen und Entwicklung", "Frau Morgen", 263, 8.0, None, "IPPUU", 15, 26, -1, 25, 8, 0),
    ("Produktlinie AT40", "Antriebstechnik", "F&E", "Kunden", "Herr West", 2300, 3.0, 1200, "----I", None, None, None, 70, 0, 0),
]


def verlauf(p):
    """Werte je Stand aus dem Endstand rückwärts fortschreiben."""
    _, _, _, _, _, plan, nw, kw, st, fert, abw, verz, risk, rate, rdrift = p
    q0 = next((i for i, s in enumerate(st) if s in "PUE"), None)          # erstes Quartal mit Budget
    qa = st.index("E") if "E" in st else 4                                 # Ankerquartal
    fa = 100 if "E" in st else fert
    out = []
    for q, s in enumerate(st):
        if s == "-":
            continue
        r = max(0, min(100, risk - rdrift * (4 - q)))
        if s == "I":
            out.append((q, s, None, None, None, r))
            continue
        f = fa - rate * (qa - q)
        if s == "E":
            f = 100
        elif s == "P":
            f = max(2, min(15, f))
        else:
            f = max(5, min(99, f))
        g = 1.0 if q >= qa else ((q - q0 + 1) / (qa - q0 + 1)) ** 0.8
        out.append((q, s, round(f), round(abw * g), round(verz * g), r))
    return out


zeilen, csvz = [], []
for pid, p in enumerate(P):
    for q, s, f, a, v, r in verlauf(p):
        zeilen.append([q, pid, STATUS_FOLGE.index(s), f, a, v, r])
        csvz.append([STAENDE[q], pid + 1, p[0], STATUS[s], p[4], p[1], p[2], p[3], p[5], "" if a is None else a,
                     "" if f is None else f, "" if v is None else v, str(p[6]).replace(".", ","), r,
                     "" if p[7] is None else p[7]])

daten = {
    "staende": STAENDE,
    "status": [STATUS[s] for s in STATUS_FOLGE],
    "gb": GB, "fb": FB, "bsc": BSC,
    # Projekt: Name, GB, FB, BSC, Verantwortung, Plan-Kosten, Nutzwert, Kapitalwert
    "projekte": [[p[0], GB.index(p[1]), FB.index(p[2]), BSC.index(p[3]), p[4], p[5], p[6], p[7]] for p in P],
    # Zeile: Stand-Index, Projekt-Index, Status-Index, Fertigstellung %, Kostenabweichung Tsd. €, Verzug Wochen, Risiko
    "zeilen": zeilen,
}
json.dump(daten, open("projekte.json", "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
with open("projekte.csv", "w", newline="", encoding="utf-8") as fh:
    w = csv.writer(fh, delimiter=";")
    w.writerow(["Stand", "Projekt_ID", "Projekt", "Status", "Verantwortung", "Geschäftsbereich", "Funktionsbereich",
                "BSC_Perspektive", "Plan_Kosten_TEUR", "Kostenabweichung_TEUR", "Fertigstellung_Prozent",
                "Terminverzug_Wochen", "Nutzwert", "Risikoindex", "Kapitalwert_TEUR"])
    w.writerows(csvz)

# Kontrollausgabe je Stand
for q, stand in enumerate(STAENDE):
    zs = [z for z in zeilen if z[0] == q]
    plan = sum(P[z[1]][5] for z in zs)
    abw = sum(z[4] or 0 for z in zs)
    u = [z for z in zs if z[2] == 0]
    fert = sum(P[z[1]][5] * z[3] for z in u) / max(1, sum(P[z[1]][5] for z in u))
    verz = sum(1 for z in zs if z[2] in (0, 1) and (z[5] or 0) > 0)
    kw = sum(P[z[1]][7] or 0 for z in zs)
    print(stand, "n", len(zs), "Plan %.1f" % (plan / 1000), "Abw %+.2f" % (abw / 1000), "Fert %.1f" % fert,
          "Verzug", verz, "KW %.1f" % (kw / 1000), "Risiko %.1f" % (sum(z[6] for z in zs) / len(zs)),
          "Status", [sum(1 for z in zs if z[2] == i) for i in range(4)])
