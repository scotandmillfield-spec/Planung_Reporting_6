"""Daten für Abb. 3.2 „Balanced Chance and Risk Card“ (Neuaufbau, 6. Auflage).

Struktur wie im Original der 5. Auflage: fünf Perspektiven, 17 strategische Ziele, 24 Kennzahlen mit Vorjahr,
Forecast und Plan sowie Mittelfristplanung, je Kennzahl eine Maßnahme und eine Chance bzw. ein Risiko mit
Eintrittswahrscheinlichkeit (1–5) und Wert. Zahlen der Kennzahlen erfunden und in sich stimmig (Stand 30.06.2027,
gleiches Unternehmen wie Abb. 3.3 und 3.5); Chancen und Risiken mit den Werten des Originals (dort T€, hier Mio. €
bei zehnfach größerem Unternehmen). Maßnahmen, die in der Projektroadmap (Abb. 3.3/3.5) als Projekt geführt
werden, tragen deren Namen; Status und Fertigstellung zum 30.06.2027 kommen aus ../Projektroadmap_Uebersicht/projekte.json.
Datenschnitt Geschäftsbereich (Revision 10/2026): je Kennzahl Werte für Antriebstechnik, Lineartechnik und Service.
Mengengrößen (Mio. €, Anzahl) und Chancen/Risiken summieren sich exakt zum Wert „Alle“; Quoten und Kennzahlen je Kopf
streuen um den Gesamtwert, der umsatzgewichtete Durchschnitt entspricht ihm. Geschichte: Lineartechnik bleibt im
Forecast hinter Plan, Service liegt darüber, Antriebstechnik etwa im Plan.
Ausgabe: bcr.json (kompakt) und bcr.csv.
"""
import csv
import json
import os
import random

HIER = os.path.dirname(os.path.abspath(__file__))
PR = json.load(open(os.path.join(HIER, "..", "Projektroadmap_Uebersicht", "projekte.json"), encoding="utf-8"))
PERSPEKTIVEN = ["Finanzen", "Markt, Kunde, Produkt", "Prozesse", "Organisation", "Mitarbeiter"]

# Perspektive, Ziel, Kennzahl, Einheit, Nachkommastellen, Wirkung (+1 Anstieg günstig, -1 ungünstig, 0 neutral),
# VJ 2026, FC 2027, PL 2027, PL 2028, PL 2029, PL 2030, Maßnahme, Art (C/R/None), Chance/Risiko, Eintritt 1–5, Wert Mio. €
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

# Roadmap-Projekte zum 30.06.2027 (Stand-Index 4)
namen = [p[0] for p in PR["projekte"]]
stand = {z[1]: z for z in PR["zeilen"] if z[0] == 4}
def projekt(name):
    if name not in namen:
        return None
    z = stand.get(namen.index(name))
    return None if z is None else [PR["status"][z[2]], z[3]]

# Geschäftsbereiche wie in der Projektroadmap; „Zentral“ ist kein Geschäftsbereich, zentrale Projekte gelten für alle
GB = [g for g in PR["gb"] if g != "Zentral"]                 # Antriebstechnik, Lineartechnik, Service
GEWICHT = [0.50, 0.32, 0.18]                                 # Umsatzanteile, Gewichte für Quoten und je-Kopf-Größen
# Anteile der Mengengrößen je Geschäftsbereich (Plan und Vorjahr); sonst GEWICHT
ANTEIL = {"Nettoumsatz": [0.50, 0.32, 0.18], "Cashflow": [0.56, 0.26, 0.18], "Auftragsbestand": [0.52, 0.36, 0.12],
          "Neuprodukte": [0.58, 0.34, 0.08], "Umsatz Poor Dogs": [0.38, 0.57, 0.05],
          "Übergreifende Projekte": [0.45, 0.35, 0.20], "Führungsnachwuchs": [0.45, 0.35, 0.20]}
ADDITIV = {"Mio. €", ""}                                      # Einheiten, die sich über die Bereiche summieren
# Maßnahmen ohne Roadmap-Projekt: zuständige Geschäftsbereiche
MN_GB = {"Subunternehmer steuern": ["Lineartechnik", "Service"], "Strategische Allianzen": ["Antriebstechnik"],
         "Arbeitszeitstudie": GB, "Weiterbildungsprogramm": GB}
rnd = random.Random(2027)


def aufteilen(gesamt, anteile, nk):
    """Mengengröße auf die Bereiche verteilen; der größte Bereich nimmt die Rundungsdifferenz, Summe = gesamt."""
    gr = max(range(len(anteile)), key=lambda g: anteile[g])
    werte = [round(gesamt * a, nk) for a in anteile]
    werte[gr] = round(gesamt - sum(w for g, w in enumerate(werte) if g != gr), nk)
    return [int(w) if nk == 0 else w for w in werte]


def norm(v):
    s = sum(v)
    return [x / s for x in v]


def bereiche(k):
    p, ziel, kz, einh, nk, wirk, vj, fc, pl, m1, m2, m3, mn, art, cr, ein, wert = k
    if einh in ADDITIV:
        basis = ANTEIL.get(kz, GEWICHT)
        # Forecast: Lineartechnik ungünstiger, Service günstiger als im Plan; Vorjahr: Lineartechnik etwas stärker
        a_fc = norm([basis[0], basis[1] * (1 - 0.05 * wirk), basis[2] * (1 + 0.07 * wirk)])
        a_vj = norm([basis[0], basis[1] * 1.03, basis[2] * 0.95])
        a_mf = [norm([basis[0], basis[1] * (1 - 0.01 * j), basis[2] * (1 + 0.04 * j)]) for j in (1, 2, 3)]
        reihen = [aufteilen(vj, a_vj, nk), aufteilen(fc, a_fc, nk), aufteilen(pl, basis, nk),
                  *[aufteilen(v, a, nk) for v, a in zip((m1, m2, m3), a_mf)]]
    else:
        streu = 0.02 if einh == "%" and pl >= 80 else 0.07   # hohe Quoten (Liefertreue, Auslastung) streuen wenig
        rel = [rnd.uniform(-streu, streu) for _ in GB]
        f = 0.4 if einh == "%" and pl >= 80 else 1.0
        tilt = [0.0, -0.05 * wirk * f, 0.06 * wirk * f]       # relative Verschiebung im Forecast
        def streuen(v, t):
            roh = [v * (1 + r + tt) for r, tt in zip(rel, t)]
            korr = sum(w * (x - v) for w, x in zip(GEWICHT, roh))   # gewichteter Mittelwert = Gesamtwert
            out = [round(x - korr, nk) for x in roh]
            return [int(x) if nk == 0 else x for x in out]
        null = [0.0] * len(GB)
        reihen = [streuen(vj, null), streuen(fc, tilt), streuen(pl, null), *[streuen(v, null) for v in (m1, m2, m3)]]
    # Maßnahme: Roadmap-Projekt mit Geschäftsbereich → nur dort; zentrale Projekte → alle
    if mn in namen:
        pg = PR["gb"][PR["projekte"][namen.index(mn)][1]]
        mn_gb = GB if pg == "Zentral" else [pg]
    else:
        mn_gb = MN_GB.get(mn, GB) if mn else []
    # Chance bzw. Risiko: Wert nach Anteilen mit Streuung; kleine Werte ganz bei einem Bereich
    # (dem der Maßnahme, wenn sie nur einen hat, sonst dem größten)
    if art:
        w = wert if art == "C" else -wert
        basis = ANTEIL.get(kz, GEWICHT)
        if wert < 1.0:
            ein_gb = GB.index(mn_gb[0]) if len(mn_gb) == 1 else max(range(len(GB)), key=lambda x: basis[x])
            cr_w = [w if g == ein_gb else 0.0 for g in range(len(GB))]
        else:
            cr_w = aufteilen(w, norm([b * rnd.uniform(0.7, 1.3) for b in basis]), 1)
    else:
        cr_w = [None] * len(GB)
    return [[reihen[0][g], reihen[1][g], reihen[2][g], [reihen[3][g], reihen[4][g], reihen[5][g]],
             (cr_w[g] if cr_w[g] else None), 1 if name in mn_gb else 0] for g, name in enumerate(GB)]


zeilen = []
for k in K:
    p, ziel, kz, einh, nk, wirk, vj, fc, pl, p28, p29, p30, mn, art, cr, ein, wert = k
    zeilen.append([p, ziel, kz, einh, nk, wirk, vj, fc, pl, [p28, p29, p30], mn, projekt(mn),
                   art or "", cr, ein, (wert if art == "C" else -wert) if art else None, ERKL.get(kz, ""), bereiche(k)])

json.dump({"stand": "30.06.2027", "perspektiven": PERSPEKTIVEN, "bereiche": GB,
           # Zeile: Perspektive, Ziel (leer = wie oben), Kennzahl, Einheit, NK, Wirkung, VJ 2026, FC 2027, PL 2027,
           # [PL 2028–2030], Maßnahme, [Roadmap-Status, Fertigstellung %] oder null, Art C/R, Chance/Risiko, Eintritt 1–5,
           # Wert Mio. € (Chance +, Risiko −), Erläuterung,
           # je Geschäftsbereich [VJ, FC, PL, [PL 2028–2030], Wert Mio. € oder null, Maßnahme zuständig 0/1]
           "zeilen": zeilen}, open(os.path.join(HIER, "bcr.json"), "w", encoding="utf-8"),
          ensure_ascii=False, separators=(",", ":"))

dez = lambda v: "" if v is None else str(v).replace(".", ",")
WIRK = {1: "Anstieg günstig", -1: "Anstieg ungünstig", 0: "neutral"}
with open(os.path.join(HIER, "bcr.csv"), "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh, delimiter=";")
    w.writerow(["Geschäftsbereich", "Perspektive", "Strategisches_Ziel", "Kennzahl", "Einheit", "Wirkung", "VJ_2026",
                "FC_2027", "PL_2027", "PL_2028", "PL_2029", "PL_2030", "Maßnahme", "Roadmap_Status", "Chance_Risiko",
                "Art", "Eintritt_1_5", "Wert_MioEUR"])
    for gi, gname in [(None, "Alle")] + list(enumerate(GB)):
        ziel = ""
        for z in zeilen:
            ziel = z[1] or ziel
            if gi is None:
                vj, fc, pl, mf, wert, mn_ok = z[6], z[7], z[8], z[9], z[15], 1
            else:
                vj, fc, pl, mf, wert, mn_ok = z[17][gi]
            mn = z[10] if mn_ok else ""
            hat_cr = wert is not None
            w.writerow([gname, PERSPEKTIVEN[z[0]], ziel, z[2], z[3], WIRK[z[5]], dez(vj), dez(fc), dez(pl), *map(dez, mf),
                        mn, z[11][0] if (z[11] and mn) else "", z[13] if hat_cr else "",
                        {"C": "Chance", "R": "Risiko"}.get(z[12], "") if hat_cr else "", (z[14] or "") if hat_cr else "",
                        dez(wert)])

# Kontrollausgabe
for i, name in enumerate(PERSPEKTIVEN):
    zs = [z for z in zeilen if z[0] == i]
    sal = sum(z[15] or 0 for z in zs)
    hinter = sum(1 for z in zs if z[5] and (z[7] - z[8]) * z[5] < 0)
    print(f"{name:24s} Kennzahlen {len(zs)}  hinter Plan {hinter}  Saldo {sal:+.1f}")
print("Gesamtsaldo %+.1f" % sum(z[15] or 0 for z in zeilen),
      "| Roadmap-Projekte:", sum(1 for z in zeilen if z[11]), "| ohne Projekt:", [z[10] for z in zeilen if z[10] and not z[11]])
for gi, gname in enumerate(GB):
    sal = sum(z[17][gi][4] or 0 for z in zeilen)
    hinter = sum(1 for z in zeilen if z[5] and (z[17][gi][1] - z[17][gi][2]) * z[5] < 0)
    print(f"{gname:16s} Gesamtsaldo {sal:+.1f}  hinter Plan {hinter} von {len(zeilen)}  Maßnahmen {sum(z[17][gi][5] for z in zeilen)}")
# Prüfung: Mengengrößen und Chancen/Risiken summieren sich zum Gesamtwert, Quoten gewichtet
for z in zeilen:
    b = z[17]
    for j, ges in enumerate([z[6], z[7], z[8]]):
        if z[3] in ADDITIV:
            assert abs(sum(x[j] for x in b) - ges) < 1e-6, (z[2], j)
        else:
            mw = sum(w_ * x[j] for w_, x in zip(GEWICHT, b))
            assert abs(mw - ges) <= 0.6 * 10 ** -z[4] + 1e-9 or abs(mw - ges) / abs(ges) < 0.01, (z[2], j, mw, ges)
    if z[15] is not None:
        assert abs(sum(x[4] or 0 for x in b) - z[15]) < 1e-6, z[2]
    d = (z[7] - z[8]) / abs(z[8]) * 100
    print(f"  {z[2]:24s} ΔPL {d:+6.1f} %  ΔVJ {(z[7] - z[6]) / abs(z[6]) * 100:+6.1f} %   je GB FC/PL: " +
          "  ".join(f"{x[1]}/{x[2]}" for x in b) + "   C/R: " + " ".join(str(x[4]) for x in b))
