"""Daten für Abb. 5.73 „Standardbericht SAP ERP CC (Detailbild)“ – Bericht Kostenstellen: Ist/Soll/Abweichung.

Gehört zur Selektionsmaske Abb. 5.72: deren Vorbelegung (Kostenrechnungskreis 1000, Geschäftsjahr 2026, Perioden 1–12,
Planversion 0, Kostenstelle 1000, alle Kostenarten) bestimmt den Startzustand dieses Berichts. Die Stammdaten
(Kostenstellen, Kostenarten, Kostenartengruppen) stehen gleichlautend in der Maske.
Kostenstelle 1000 „Zentrale Dienste“ (im Original „Corporate Services“, Verantwortlicher geändert) trägt die Werte des
Originals: Ist- und Sollkosten je Kostenart auf den Cent, Belastung 627.269,28 / 2.127.402,27 €, Entlastung
1.405.829,60 €. Zeilen ohne Werte (431900 Feiertagszuschlag Lohn, 440100 Sozialaufwand Gehalt) entfallen. Die Belastung des
Originals enthielt Kostenarten der nicht gezeigten Seite 1 (Seiten 2/4); die Differenz zu den gezeigten Zeilen steht als
430000 Gehälter (Ist 198.381,38 €, Soll 238.489,86 €), damit die Summen des Originals stimmen. Die
Sollkosten 470000–476900 sind zugleich die Plankosten fix der Kostenartenplanung (Abb. 5.74). Kostenstellen 1100 und
1200 sind erfunden. Für die Periodenauswahl werden die Jahreswerte summengetreu auf zwölf Perioden verteilt: Soll
gleichmäßig, Ist mit Schwankung (Tarifliche Jahresleistung im November, Versicherungen im Januar).
Grain: Kostenstelle x Kostenart x Periode, Ist (None = keine Buchung) und Soll in Cent.
Ausgabe: kostenstellen.json und kostenstellen.csv.
"""
import csv
import json
import os
import random

HIER = os.path.dirname(os.path.abspath(__file__))
JAHR, STAND = 2026, "15.01.2027"
KOSTENSTELLEN = [["1000", "Zentrale Dienste", "Frau Brandt"], ["1100", "Personalwesen", "Herr Tal"],
                 ["1200", "Informationstechnik", "Frau Wendt"]]
# Kostenart, Bezeichnung, Gruppe (P = primär, S = sekundär), Erläuterung
KOSTENARTEN = [
    ["430000", "Gehälter", "P", "im Original auf der nicht gezeigten Seite 1 des Berichts"],
    ["435000", "Tarifliche Jahresleistung", "P", "Jahressonderzahlung nach Tarif"],
    ["440000", "Gesetzliche Sozialaufwendungen", "P", "Arbeitgeberanteile zur Sozialversicherung"],
    ["449000", "Sonstige Personalkosten", "P", "z. B. Weiterbildung, Zuschüsse"],
    ["451000", "Instandhaltung Gebäude", "P", ""],
    ["466000", "Versicherungen", "P", "Jahresprämie, im Januar gebucht"],
    ["470000", "Raumkosten", "P", ""],
    ["471000", "Maschinenmieten", "P", ""],
    ["473000", "Postkosten (ohne Telefon)", "P", ""],
    ["476000", "Büromaterial", "P", ""],
    ["476100", "EDV-Material", "P", ""],
    ["476500", "Sonstige Verwaltungskosten", "P", ""],
    ["476900", "Sonstige Kosten", "P", ""],
    ["481000", "Kalkulatorische Abschreibungen", "P", "kalkulatorische Kosten, monatlich abgegrenzt"],
    ["483000", "Kalkulatorische Zinsen", "P", "kalkulatorische Kosten, monatlich abgegrenzt"],
    ["618000", "Verrechnung EDV (direkt)", "S", "direkte innerbetriebliche Leistungsverrechnung"],
    ["632000", "Verrechnung Dienstleistungen", "S", "indirekte innerbetriebliche Leistungsverrechnung"],
    ["633000", "Verrechnung Kantine", "S", "indirekte innerbetriebliche Leistungsverrechnung"],
    ["634000", "Verrechnung Telefoneinheiten", "S", "indirekte innerbetriebliche Leistungsverrechnung"],
    ["635000", "Verrechnung Telefone", "S", "indirekte innerbetriebliche Leistungsverrechnung"],
    ["636000", "Verrechnung Fuhrpark", "S", "indirekte innerbetriebliche Leistungsverrechnung"],
    ["637000", "Verrechnung Personal", "S", "indirekte innerbetriebliche Leistungsverrechnung"],
]
KA = {k[0]: i for i, k in enumerate(KOSTENARTEN)}
# Jahreswerte in € (Ist, Soll); None = keine Buchung; Entlastung negativ
JAHRESWERTE = {
    "1000": {   # Werte des Originals; 430000 = Differenz zur Belastung des Originals (Kostenarten der Seite 1)
        "430000": (198381.38, 238489.86), "435000": (17674.56, 17874.76), "440000": (46936.76, 49019.33), "449000": (619.13, 638.04),
        "451000": (24520.78, 25692.36), "466000": (7269.92, 7707.72), "470000": (29992.29, 30830.88),
        "471000": (24602.99, 25692.36), "473000": (22327.73, 23123.16), "476000": (19550.94, 20553.96),
        "476100": (5850.49, 6166.20), "476500": (9948.06, 10276.92), "476900": (5959.01, 6166.20),
        "481000": (128045.00, 550331.52), "483000": (71497.00, 1085217.00), "618000": (None, 7608.98),
        "633000": (3199.78, 4895.19), "634000": (75.58, 114.49), "635000": (1139.55, 1726.47),
        "636000": (250.81, 381.87), "637000": (9427.52, 14895.00), "632000": (-1405829.60, -1405829.60)},
    "1100": {
        "430000": (96400.00, 98000.00), "435000": (9812.40, 9950.00), "440000": (31205.18, 30860.00), "449000": (4310.77, 3900.00),
        "451000": (3118.90, 3400.00), "466000": (2205.00, 2205.00), "470000": (18432.10, 18430.00),
        "473000": (6904.55, 7200.00), "476000": (8311.62, 7900.00), "476100": (2911.30, 3100.00),
        "476500": (5127.48, 5000.00), "476900": (2390.15, 2500.00), "481000": (21480.00, 21480.00),
        "483000": (9760.00, 9760.00), "618000": (12388.00, 12000.00), "633000": (1902.35, 1850.00),
        "634000": (61.20, 70.00), "635000": (818.40, 790.00), "637000": (-235000.00, -240395.00)},
    "1200": {
        "430000": (142800.00, 140000.00), "435000": (14220.00, 14300.00), "440000": (38950.66, 39400.00), "449000": (2880.10, 2500.00),
        "451000": (4020.00, 4400.00), "466000": (6400.00, 6400.00), "470000": (22150.40, 22150.00),
        "471000": (48770.25, 46800.00), "473000": (1204.30, 1300.00), "476000": (3120.80, 3300.00),
        "476100": (41385.60, 36000.00), "476500": (4410.00, 4600.00), "476900": (1880.25, 2000.00),
        "481000": (96400.00, 96400.00), "483000": (18300.00, 18300.00), "633000": (1410.00, 1400.00),
        "634000": (210.40, 190.00), "635000": (2115.90, 1950.00), "636000": (980.00, 1100.00),
        "637000": (6010.00, 6200.00), "618000": (-452000.00, -452690.00)},
}
BESONDERS = {"435000": 10, "466000": 0}          # Ist in einer Periode gebucht (November, Januar)
GLEICH = {"481000", "483000"}                    # Ist monatlich gleich (Abgrenzung)

rnd = random.Random(5073)


def verteilen(summe, gewichte):
    """Ganzzahlige Aufteilung (Cent) nach Gewichten, summengetreu; Vorzeichen bleibt erhalten."""
    vz = -1 if summe < 0 else 1
    summe = abs(summe)
    s = sum(gewichte)
    roh = [summe * g / s for g in gewichte]
    ganz = [int(x // 1) for x in roh]
    for i in sorted(range(len(roh)), key=lambda i: -(roh[i] - ganz[i]))[:summe - sum(ganz)]:
        ganz[i] += 1
    return [vz * g for g in ganz]


werte = []                                       # [Kostenstelle, Kostenart, Periode, Ist|None, Soll] in Cent
for ki, (kst, _, _) in enumerate(KOSTENSTELLEN):
    for ka, (ist, soll) in JAHRESWERTE[kst].items():
        soll_p = verteilen(round(soll * 100), [1] * 12)
        if ist is None:
            ist_p = [None] * 12
        elif ka in BESONDERS:
            ist_p = [round(ist * 100) if p == BESONDERS[ka] else 0 for p in range(12)]
        elif ka in GLEICH:
            ist_p = verteilen(round(ist * 100), [1] * 12)
        else:
            ist_p = verteilen(round(ist * 100), [max(0.2, 1 + rnd.gauss(0, 0.12)) for _ in range(12)])
        for p in range(12):
            werte.append([ki, KA[ka], p + 1, ist_p[p], soll_p[p]])
werte.sort(key=lambda z: (z[0], z[1], z[2]))

json.dump({"jahr": JAHR, "stand": STAND, "krk": ["1000", "Inland"], "version": ["0", "Plan/Ist-Version"],
           "kostenstellen": KOSTENSTELLEN, "kostenarten": KOSTENARTEN, "werte": werte},
          open(os.path.join(HIER, "kostenstellen.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
eur = lambda c: "" if c is None else f"{c / 100:.2f}".replace(".", ",")
with open(os.path.join(HIER, "kostenstellen.csv"), "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh, delimiter=";", lineterminator="\r\n")
    w.writerow(["Kostenrechnungskreis", "Geschaeftsjahr", "Version", "Kostenstelle", "Kostenstelle_Text", "Kostenart",
                "Kostenart_Text", "Kostenartengruppe", "Periode", "Istkosten_EUR", "Sollkosten_EUR"])
    for ki, kai, p, i, s in werte:
        k, ka = KOSTENSTELLEN[ki], KOSTENARTEN[kai]
        w.writerow(["1000", JAHR, "0", k[0], k[1], ka[0], ka[1], "Primärkosten" if ka[2] == "P" else "Sekundärkosten", p, eur(i), eur(s)])

# Kontrollausgabe: Belastung, Entlastung, Über-/Unterdeckung je Kostenstelle (Perioden 1–12)
for ki, (kst, name, _) in enumerate(KOSTENSTELLEN):
    zs = [z for z in werte if z[0] == ki]
    bel = [z for z in zs if z[4] > 0 or (z[3] or 0) > 0]
    ent = [z for z in zs if z not in bel]
    s = lambda rows, j: sum((z[j] or 0) for z in rows) / 100
    print(f"{kst} {name}: Belastung Ist {s(bel, 3):,.2f} Soll {s(bel, 4):,.2f} | Entlastung Ist {s(ent, 3):,.2f} "
          f"Soll {s(ent, 4):,.2f} | Über-/Unterdeckung Ist {s(zs, 3):,.2f} Soll {s(zs, 4):,.2f} Abw {s(zs, 3) - s(zs, 4):,.2f}")
