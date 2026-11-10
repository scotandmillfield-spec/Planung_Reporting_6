"""Daten für Abb. 5.80 „Auswertungen“ – GuV und Umsatz nach Produkten aus der integrierten Planung.

Dieselben Daten wie die übrige Serie Abb. 5.78–5.82: Quelle ist das Planungsmodell der Abb. 5.78
(../Hyperion_Planning_Mehrdimensionale_Planungsformulare/daten_planungsmodell.py, fester Zufallsstart); es wird hier
per runpy ausgeführt und seine Ergebnisse übernommen. Der Nettoumsatz Deutschland enthält damit die Absatzmengen der
Maske 5.78 (u. a. Großkunde 1, Normalgeschäft: 10.000 Stück), die Abschreibungen die Investitionen der Maske 5.81.
Grain: Szenario (Ist 2027, Plan 2028) x Gesellschaft x Produkt x Monat mit Absatz (Stück), Nettoumsatz,
Bestandsveränderung, Fertigungsmaterial, Fertigungslöhnen und Frachtkosten (€); dazu Szenario x Gesellschaft x
Konto x Monat für Personal-, Marketing-, Verwaltungskosten, Abschreibungen und Zinsen (€).
Ausgabe: auswertungen.json und auswertungen.csv.
"""
import csv
import json
import os
import runpy

HIER = os.path.dirname(os.path.abspath(__file__))
QUELLE = os.path.join(os.path.dirname(HIER), "Hyperion_Planning_Mehrdimensionale_Planungsformulare", "daten_planungsmodell.py")
M = runpy.run_path(QUELLE, run_name="planungsmodell")["MODELL"]

GES = M["aktiv"]
PROD = M["produkte"]
KONTEN = ["personal", "marketing", "verwaltung", "abschreibungen", "zinsen"]
KONTO_NAME = ["Personalkosten", "Marketingkosten", "Verwaltungskosten", "Abschreibungen", "Zinsen"]
UKZ = ["absatz", "nettoumsatz", "bestandsveraenderung", "fertigungsmaterial", "fertigungsloehne", "frachtkosten"]
UKZ_NAME = ["Absatz", "Nettoumsatz", "Bestandsveränderungen", "Fertigungsmaterial", "Fertigungslöhne", "Frachtkosten"]
# Regionen für die Seitenauswahl: nur Gesellschaften im Planzyklus haben Werte
REGIONEN = [[r, [g for g in gs if g in GES]] for r, gs in M["baum"][1]]

u, k = [], []
for szen in (0, 1):
    for gi, g in enumerate(GES):
        for pi, p in enumerate(PROD):
            x = M["um"][szen][g].get(p)
            if not x:
                continue
            for m in range(12):
                u.append([szen, gi, pi, m] + [x[kz][m] for kz in UKZ])
        for ki, kz in enumerate(KONTEN):
            for m in range(12):
                k.append([szen, gi, ki, m, M["kosten"][szen][g][kz][m]])

daten = {"stand": M["stand"], "jahre": [M["jahrIst"], M["jahrPlan"]], "monate": M["monate"], "gesellschaften": GES,
         "regionen": REGIONEN, "linien": M["linien"], "produkte": PROD, "ukz": UKZ, "konten": KONTEN, "u": u, "k": k}
json.dump(daten, open(os.path.join(HIER, "auswertungen.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))

region = {g: r for r, gs in REGIONEN for g in gs}
gruppe = {p: (l, g) for l, gs in M["linien"] for g, ps in gs for p in ps}
with open(os.path.join(HIER, "auswertungen.csv"), "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh, delimiter=";", lineterminator="\r\n")
    w.writerow(["Szenario", "Version", "Jahr", "Monat", "Region", "Gesellschaft", "Produktlinie", "Produktgruppe",
                "Produkt", "Position", "Wert", "Einheit"])
    for r in u:
        szen, gi, pi, m = r[:4]
        p = PROD[pi]
        for j, name in enumerate(UKZ_NAME):
            w.writerow(["Ist" if szen == 0 else "Plan", "Ist" if szen == 0 else "Bottom-up", daten["jahre"][szen],
                        m + 1, region[GES[gi]], GES[gi], gruppe[p][0], gruppe[p][1], p, name, r[4 + j],
                        "Stück" if j == 0 else "EUR"])
    for szen, gi, ki, m, betrag in k:
        w.writerow(["Ist" if szen == 0 else "Plan", "Ist" if szen == 0 else "Bottom-up", daten["jahre"][szen],
                    m + 1, region[GES[gi]], GES[gi], "", "", "", KONTO_NAME[ki], betrag, "EUR"])

# Kontrollausgabe: GuV Plan 2028 je Quartal (Tsd. €) für Deutschland und den Konzern
def guv(szen, gis, q=None):
    ms = range(12) if q is None else range(3 * q, 3 * q + 3)
    s = lambda j: sum(r[4 + j] for r in u if r[0] == szen and r[1] in gis and r[3] in ms)
    kk = lambda ki: sum(r[4] for r in k if r[0] == szen and r[1] in gis and r[2] == ki and r[3] in ms)
    nu, bv, fm, fl, fr = s(1), s(2), s(3), s(4), s(5)
    db = nu + bv - fm - fl - fr
    fix = kk(0) + kk(1) + kk(2)
    be = db - fix
    return {"Nettoumsatz": nu, "Bestandsveränderungen": bv, "Var. Herstellkosten": fm + fl, "Frachtkosten": fr,
            "Deckungsbeitrag": db, "Fixkosten": fix, "Betriebsergebnis": be, "Abschreibungen": kk(3), "Zinsen": kk(4),
            "Ergebnis vor Steuern": be - kk(3) - kk(4)}


for name, gis in (("Deutschland", [0]), ("Konzern", list(range(len(GES))))):
    zs = [guv(1, gis, q) for q in range(4)] + [guv(1, gis), guv(0, gis)]
    print(f"{name} – Plan {daten['jahre'][1]} Q1…Q4, Jahr, Ist {daten['jahre'][0]} (Tsd. €)")
    for kz in zs[0]:
        print(f"  {kz:22s}" + "".join(f"{z[kz] / 1000:10.1f}" for z in zs))
print(f"Datensätze: {len(u)} Umsatz, {len(k)} Kosten")
