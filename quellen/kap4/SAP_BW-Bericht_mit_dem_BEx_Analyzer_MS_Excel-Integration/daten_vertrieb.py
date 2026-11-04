"""Daten für Abb. 4.19 – Bericht „Vertriebsbeauftragte im Quartalsvergleich“ mit Navigationsbereich.

Werte des Originals (Quartale 1–4, Absatzmenge, Erlös, Deckungsbeitrag I je Vertriebsbeauftragtem und Kunde) sind
übernommen; nur der Deckungsbeitrag I des letzten Kunden war im Original abgeschnitten und ist ergänzt. Namen sind
neutralisiert, Mengeneinheiten (ST, KAR) einheitlich Stück, Geschäftsjahr 2026 statt 1999.
Für den Aufriss nach Warengruppe wird jeder Wert ganzzahlig und summengetreu auf drei Warengruppen verteilt
(Anteile je Kunde fest, je Quartal leicht schwankend); die Branche ist ein Merkmal des Kunden.
Grain: Vertriebsbeauftragter x Kunde x Warengruppe x Quartal mit Absatz (Stück), Erlös und DB I (€).
Ausgabe: vertrieb.json und vertrieb.csv.
"""
import csv
import json
import os
import random

HIER = os.path.dirname(os.path.abspath(__file__))
VB = ["Frau Lenz", "Herr Krause", "Herr Vogt"]
BRANCHEN = ["Fachhandel", "Systemhaus", "Elektromarkt"]
WG = ["Hardware", "Zubehör", "Service"]
QUARTALE = ["Q1 2026", "Q2 2026", "Q3 2026", "Q4 2026"]
# Kunde, Vertriebsbeauftragter, Branche, Absatz Q1–Q4, Erlös Q1–Q4, DB I Q1–Q4 (None = kein Umsatz im Quartal)
KUNDEN = [
    ["Computerhandel Nord", 0, 0, [2716, 2585, 3608, 1909], [443419, 404096, 693230, 307122], [375274, 191657, 241494, 63061]],
    ["Systemhaus Mitte", 0, 1, [10, None, None, None], [10402, None, None, None], [4823, None, None, None]],
    ["Technikhandel West", 0, 2, [676, 882, 949, 377], [654374, 798725, 887838, 375353], [569960, 695599, 772801, 275593]],
    ["Bürofachhandel Süd", 1, 0, [4240, 2493, 3156, 1084], [1628927, 961892, 1210199, 415783], [740507, 410254, 404657, 80766]],
    ["Elektromarkt Ost", 1, 2, [3200, 3349, 3064, 3399], [1243086, 1290095, 1186169, 1314065], [601431, 476396, 380219, 273368]],
    ["Systemhaus Rhein", 2, 1, [2380, 2189, 2698, 964], [601582, 310772, 521787, 202203], [511024, 139999, 212800, 50297]],
    ["Systemhaus Ruhr", 2, 1, [2758, 2107, 1662, 2069], [585271, 383505, 344530, 344717], [450777, 176609, 135206, 71467]],
    ["Bauteilehandel Main", 2, 0, [993, 275, 933, 623], [882428, 254362, 856620, 557574], [361795, 98304, 342648, 189575]],
]
# Kontrollwerte des Originals: „Ergebnis“ je Vertriebsbeauftragtem (Absatz, Erlös, DB I je Quartal); das Original
# rundete verdeckte Nachkommastellen, die Summe der Kundenzeilen weicht dort um bis zu 1 € ab
ERGEBNIS = {0: ([3402, 3467, 4557, 2286], [1108195, 1202822, 1581068, 682475], [950057, 887256, 1014295, 338654]),
            1: ([7440, 5842, 6220, 4483], [2872012, 2251987, 2396368, 1729847], [1341939, 886650, 784875, 354133])}

rnd = random.Random(419)


def verteilen(summe, anteile):
    """Ganzzahlig und summengetreu nach Anteilen verteilen (größte Reste)."""
    roh = [summe * a for a in anteile]
    ganz = [int(r) for r in roh]
    for i in sorted(range(len(roh)), key=lambda i: roh[i] - ganz[i], reverse=True)[:summe - sum(ganz)]:
        ganz[i] += 1
    return ganz


saetze = []                  # [kunde, wg, quartal, absatz, erloes, db]
for ki, (name, vb, br, ab, er, db) in enumerate(KUNDEN):
    basis = [rnd.uniform(0.5, 0.7), rnd.uniform(0.18, 0.3), 0]
    basis[2] = 1 - basis[0] - basis[1]
    for q in range(4):
        if ab[q] is None:
            continue
        a = [max(0.02, b + rnd.uniform(-0.04, 0.04)) for b in basis]
        a = [x / sum(a) for x in a]
        # Service bringt weniger Stück, aber mehr Deckungsbeitrag je Euro Erlös
        aa = [a[0] * 1.05, a[1] * 1.3, a[2] * 0.35]
        aa = [x / sum(aa) for x in aa]
        ad = [a[0] * 0.92, a[1] * 0.95, a[2] * 1.3]
        ad = [x / sum(ad) for x in ad]
        for w, (x, y, z) in enumerate(zip(verteilen(ab[q], aa), verteilen(er[q], a), verteilen(db[q], ad))):
            saetze.append([ki, w, q, x, y, z])

json.dump({"vertriebsbeauftragte": VB, "branchen": BRANCHEN, "warengruppen": WG, "quartale": QUARTALE,
           "kunden": [[k[0], k[1], k[2]] for k in KUNDEN], "saetze": saetze, "vkorg": "1000", "jahr": 2026},
          open(os.path.join(HIER, "vertrieb.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
with open(os.path.join(HIER, "vertrieb.csv"), "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh, delimiter=";", lineterminator="\r\n")
    w.writerow(["Verkaufsorganisation", "Quartal", "Vertriebsbeauftragter", "Kunde", "Branche", "Warengruppe",
                "Absatz_Stueck", "Erloes_EUR", "Deckungsbeitrag_I_EUR"])
    for ki, wg, q, x, y, z in saetze:
        k = KUNDEN[ki]
        w.writerow(["1000", QUARTALE[q], VB[k[1]], k[0], BRANCHEN[k[2]], WG[wg], x, y, z])

# Kontrollausgabe: Summen je Vertriebsbeauftragtem und Quartal gegen das Original
for vb in range(3):
    s = [[sum(r[3 + i] for r in saetze if KUNDEN[r[0]][1] == vb and r[2] == q) for q in range(4)] for i in range(3)]
    # Das Original rechnete mit verdeckten Nachkommastellen: Abweichungen von 1 € zur Summe der Kundenzeilen
    ok = "" if vb not in ERGEBNIS else "  Differenz zum Original (€): " + str([[x - y for x, y in zip(s[i], ERGEBNIS[vb][i])] for i in range(3)])
    print(f"{VB[vb]:12s} Absatz {s[0]}  Erlös {s[1]}  DB I {s[2]}{ok}")
ges = [sum(r[4] for r in saetze if r[2] == q) for q in range(4)]
gdb = [sum(r[5] for r in saetze if r[2] == q) for q in range(4)]
print("Erlös gesamt je Quartal", ges, "Summe", sum(ges), "· DB-I-Quote", [f"{d / e:.1%}" for d, e in zip(gdb, ges)])
