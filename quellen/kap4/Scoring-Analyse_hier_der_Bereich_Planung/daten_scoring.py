"""Daten für Abb. 4.10 „Scoring-Analyse (hier der Bereich Planung)“.

Bereich Planung: Analysefelder und Bewertungen des Originals (5. Auflage). Die Punkte des Originals lagen auf einer
Skala von −4 (Worst Practice) über 0 (Durchschnitt, „⌀“) bis +4 (Best Practice); abgelesen aus der Folie
(Mittelpunkte der Kreise gegen die Teilstriche, alle auf ganzen Punkten ±0,1):
Planungsinhalte −1, Absatzplanung 0, Einkaufsplanung +1,
Kostenplanung 0, Ergebnisplanung −1, Finanzplanung 0, „…“ (weitere Teilpläne) −1, Planungsprozesse −2,
Planungsorganisation 0, IT-Unterstützung +1.
Bereich Reporting: für den Datenschnitt erfunden (gleicher Aufbau, plausible Werte).
Revision 11.11.2026 (Prüferhinweis): Die Bewertung eines Feldes mit Teilfeldern (Planungsinhalte, Berichtsinhalte) ist
der Durchschnitt seiner Teilfelder und wird hier berechnet, nicht vorgegeben (Planung −1/6 ≈ −0,2, Reporting −3/6 = −0,5).
Das Original zeigte für die Planungsinhalte −1, was nicht zum Mittelwert der Teilpläne passte.
Ausgabe: scoring.json und scoring.csv.
"""
import csv
import json
import os

HIER = os.path.dirname(os.path.abspath(__file__))
SKALA = (-4, 4)
# Bereich: [(Analysefeld, Bewertung, [(Teilfeld, Bewertung), …]), …]
BEREICHE = {
    "Planung": [
        ("Planungsinhalte", None, [("Absatzplanung", 0), ("Einkaufsplanung", 1), ("Kostenplanung", 0),
                                 ("Ergebnisplanung", -1), ("Finanzplanung", 0), ("weitere Teilpläne", -1)]),
        ("Planungsprozesse", -2, []),
        ("Planungsorganisation", 0, []),
        ("IT-Unterstützung", 1, []),
    ],
    "Reporting": [
        ("Berichtsinhalte", None, [("Monatsbericht", 1), ("Kennzahlenbericht", 0), ("Abweichungsanalyse", -2),
                                ("Forecastbericht", -1), ("Kommentierung", -1), ("weitere Berichte", 0)]),
        ("Berichtsprozesse", -1, []),
        ("Berichtsorganisation", 1, []),
        ("IT-Unterstützung", 2, []),
    ],
}
# Gesamtbewertung eines Feldes mit Teilfeldern = Durchschnitt der Teilfelder (2 Nachkommastellen)
BEREICHE = {b: [(n, round(sum(w for _, w in t) / len(t), 2) if t else v, t) for n, v, t in f] for b, f in BEREICHE.items()}
dez = lambda v: str(v).replace(".", ",")
for b, felder in BEREICHE.items():
    for name, v, teile in felder:
        assert SKALA[0] <= v <= SKALA[1], (b, name)
        assert all(SKALA[0] <= w <= SKALA[1] for _, w in teile), (b, name)

json.dump({"skala": SKALA, "bereiche": {b: [[n, v, [[t, w] for t, w in teile]] for n, v, teile in f] for b, f in BEREICHE.items()}},
          open(os.path.join(HIER, "scoring.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
with open(os.path.join(HIER, "scoring.csv"), "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh, delimiter=";", lineterminator="\r\n")
    w.writerow(["Bereich", "Gruppe", "Analysefeld", "Bewertung", "Abstand_Best_Practice"])
    for b, felder in BEREICHE.items():
        for name, v, teile in felder:
            w.writerow([b, "", name, dez(v), dez(round(SKALA[1] - v, 2))])
            for t, x in teile:
                w.writerow([b, name, t, x, SKALA[1] - x])

# Kontrollausgabe je Bereich
for b, felder in BEREICHE.items():
    alle = [(n, v) for n, v, teile in felder] + [(t, x) for _, _, teile in felder for t, x in teile]
    lo = min(v for _, v in alle)
    for n, v, teile in felder:
        if teile:
            print(f"{b:10s} {n}: Durchschnitt der Teilfelder {v:+.2f}")
    print(f"{b:10s} Felder {len(alle):2d}  schwächstes {[n for n, v in alle if v == lo]} ({lo:+})  "
          f"über Ø {[n for n, v in alle if v > 0]}")
