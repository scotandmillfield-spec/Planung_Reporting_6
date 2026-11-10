"""Datenblock für Abb. 5.81 „Kommentarfunktion“ (Formular Investitionsplanung mit Anmerkungen der Planungseinheit).

Dieselben Daten wie die übrige Serie Abb. 5.78–5.82: Quelle ist das Planungsmodell der Abb. 5.78
(../Hyperion_Planning_Mehrdimensionale_Planungsformulare/daten_planungsmodell.py); es wird per runpy ausgeführt, und
seine Investitionen, Anmerkungen, Personen und Gesellschaften werden als Datenblock in kommentar.js eingesetzt
(zwischen den Marken „// <daten>“ und „// </daten>“). Die Abschreibungen dieser Investitionen gehen im Modell in die
GuV der Abb. 5.80 ein (Deutschland 2028: Büromöbel 100 € je Monat ab März usw.).
Aufruf vor dem Bauen, wenn sich das Planungsmodell ändert: python3 daten_kommentar.py
"""
import os
import runpy

HIER = os.path.dirname(os.path.abspath(__file__))
QUELLE = os.path.join(os.path.dirname(HIER), "Hyperion_Planning_Mehrdimensionale_Planungsformulare", "daten_planungsmodell.py")
NS = runpy.run_path(QUELLE, run_name="planungsmodell")
M = NS["MODELL"]

daten = {"stand": M["stand"], "jahrPlan": M["jahrPlan"], "monate": M["monate"], "gesellschaften": M["aktiv"],
         "personen": M["personen"], "benutzer": "brandt", "investitionen": M["investitionen"],
         "anmerkungen": M["anmerkungen"]}
NS["einsetzen"](os.path.join(HIER, "kommentar.js"), "DATEN", daten)

# Kontrollausgabe: Abschreibungen je Gesellschaft 2028 aus der Investitionsplanung
for g in M["aktiv"]:
    afa = NS["afa_investitionen"](g)
    print(f"{g:15s} Abschreibungen aus Investitionen 2028: {round(sum(afa)):7d} €  (Monate {[round(x) for x in afa]})")
