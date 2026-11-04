"""Daten für Abb. 4.22 „Forderungs-Cockpit … im Kollaborationswerkzeug“ – derselbe Datensatz wie Abb. 4.21.

Quelle ist der Generator der Abb. 4.21 (../Forderungs-Cockpit_mit_Power_BI_im_Webbrowser/daten_forderungen.py, fester
Zufallsstart); er wird hier ausgeführt und seine Ausgabe übernommen. Beide Abbildungen zeigen dasselbe Dashboard mit
denselben Zahlen; Abb. 4.22 bettet es als Registerkarte in einen Kanal mit Unterhaltung ein.
Ausgabe: forderungen.json und forderungen.csv.
"""
import json
import os
import runpy
import shutil

HIER = os.path.dirname(os.path.abspath(__file__))
QUELLE = os.path.join(os.path.dirname(HIER), "Forderungs-Cockpit_mit_Power_BI_im_Webbrowser")

runpy.run_path(os.path.join(QUELLE, "daten_forderungen.py"), run_name="__main__")    # schreibt dort json/csv neu
d = json.load(open(os.path.join(QUELLE, "forderungen.json"), encoding="utf-8"))
json.dump(d, open(os.path.join(HIER, "forderungen.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
shutil.copyfile(os.path.join(QUELLE, "forderungen.csv"), os.path.join(HIER, "forderungen.csv"))
print(f"übernommen: {len(d['rechnungen'])} Rechnungen, {len(d['debitoren'])} Debitoren")
