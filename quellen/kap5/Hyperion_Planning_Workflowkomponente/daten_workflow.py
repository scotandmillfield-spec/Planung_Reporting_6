"""Datenblock für Abb. 5.82 „Workflowkomponente“ (Status überprüfen und Prozess verwalten).

Dieselben Daten wie die übrige Serie Abb. 5.78–5.82: Quelle ist das Planungsmodell der Abb. 5.78
(../Hyperion_Planning_Mehrdimensionale_Planungsformulare/daten_planungsmodell.py); es wird per runpy ausgeführt, und
Gesellschaftsbaum, Prozessstatus, Eigentümer, Verlauf und Personen werden als Datenblock in workflow.js eingesetzt
(zwischen den Marken „// <daten>“ und „// </daten>“). Im Planzyklus gestartet sind dieselben fünf Gesellschaften, die in
den Abb. 5.78, 5.80 und 5.81 Planwerte haben.
Aufruf vor dem Bauen, wenn sich das Planungsmodell ändert: python3 daten_workflow.py
"""
import os
import runpy

HIER = os.path.dirname(os.path.abspath(__file__))
QUELLE = os.path.join(os.path.dirname(HIER), "Hyperion_Planning_Mehrdimensionale_Planungsformulare", "daten_planungsmodell.py")
NS = runpy.run_path(QUELLE, run_name="planungsmodell")
M = NS["MODELL"]

daten = {"stand": M["stand"], "jahrPlan": M["jahrPlan"], "baum": M["baum"], "aktiv": M["aktiv"],
         "workflow": {k: list(v) for k, v in M["workflow"].items()}, "verlauf": M["verlauf"],
         "personen": M["personen"], "benutzer": "albers"}
NS["einsetzen"](os.path.join(HIER, "workflow.js"), "DATEN", daten)
print("Im Planzyklus:", ", ".join(M["aktiv"]))
for e, (st, ow) in M["workflow"].items():
    print(f"  {e:15s} {st:16s} {M['personen'][ow][0] if ow else 'kein Eigentümer'}")
