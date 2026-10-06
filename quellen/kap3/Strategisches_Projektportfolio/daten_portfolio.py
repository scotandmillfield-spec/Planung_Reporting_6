"""Daten für Abb. 3.4 „Strategisches Projektportfolio“.

Gleicher Datensatz wie Abb. 3.3 und 3.5 (../Projektroadmap_Uebersicht/projekte.json, 19 Projekte, fünf Quartalsstände).
Das Portfolio stellt je Projekt die strategische Relevanz (Nutzwert 0–10) dem strategischen Risiko (Risikoindex 0–100)
gegenüber; die Kreisfläche zeigt die Plan-Kosten. Die Felder ergeben sich aus den Grenzen 5 und 50:
umsetzen (Relevanz ≥ 5, Risiko < 50), absichern (Relevanz ≥ 5, Risiko ≥ 50), prüfen (Relevanz < 5, Risiko ≥ 50),
nachrangig (Relevanz < 5, Risiko < 50). Dieselbe Regel steht in portfolio.js.
Ausgabe: portfolio.json (unverändert übernommen) und portfolio.csv (Einzelsätze je Stand mit Feld und ΔVQ Risiko).
"""
import csv
import json
import os

HIER = os.path.dirname(os.path.abspath(__file__))
D = json.load(open(os.path.join(HIER, "..", "Projektroadmap_Uebersicht", "projekte.json"), encoding="utf-8"))
FELDER = ["umsetzen", "absichern", "prüfen", "nachrangig"]


def nw_text(v):
    """Nutzwert wie im Dashboard-Export: 8 statt 8,0, 4,5 mit Komma."""
    return (str(int(v)) if float(v).is_integer() else str(v)).replace(".", ",")


def feld(nutzwert, risiko):
    if nutzwert >= 5:
        return "umsetzen" if risiko < 50 else "absichern"
    return "prüfen" if risiko >= 50 else "nachrangig"


json.dump(D, open(os.path.join(HIER, "portfolio.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))

risiko = {(z[0], z[1]): z[6] for z in D["zeilen"]}
zeilen = []
for z in D["zeilen"]:
    q, pid, st, r = z[0], z[1], z[2], z[6]
    name, gb, fb, bsc, verantw, plan, nw, kw = D["projekte"][pid]
    vq = risiko.get((q - 1, pid))
    zeilen.append([D["staende"][q], pid + 1, name, D["status"][st], verantw, D["gb"][gb], D["fb"][fb], D["bsc"][bsc],
                   plan, nw_text(nw), r, "" if vq is None else r - vq, feld(nw, r),
                   "" if kw is None else kw])
with open(os.path.join(HIER, "portfolio.csv"), "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh, delimiter=";", lineterminator="\r\n")
    w.writerow(["Stand", "Projekt_ID", "Projekt", "Status", "Verantwortung", "Geschäftsbereich", "Funktionsbereich",
                "BSC_Perspektive", "Plan_Kosten_TEUR", "Nutzwert", "Risikoindex", "Risiko_dVQ", "Feld", "Kapitalwert_TEUR"])
    w.writerows(zeilen)

# Kontrollausgabe je Stand: Projekte und Plan-Kosten je Feld
for q, stand in enumerate(D["staende"]):
    zs = [z for z in D["zeilen"] if z[0] == q]
    ges = sum(D["projekte"][z[1]][5] for z in zs)
    teile = []
    for f in FELDER:
        fz = [z for z in zs if feld(D["projekte"][z[1]][6], z[6]) == f]
        plan = sum(D["projekte"][z[1]][5] for z in fz)
        teile.append(f"{f} {len(fz)} ({plan / 1000:.1f} Mio. €, {100 * plan / ges:.0f} %)")
    steigt = [z for z in zs if (q - 1, z[1]) in risiko and z[6] > risiko[(q - 1, z[1])]]
    print(stand, f"n {len(zs)}, Plan {ges / 1000:.1f} Mio. € |", " | ".join(teile), f"| Risiko gestiegen: {len(steigt)}")
