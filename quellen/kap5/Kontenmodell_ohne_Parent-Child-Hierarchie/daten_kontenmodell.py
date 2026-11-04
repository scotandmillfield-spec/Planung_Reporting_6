"""Daten für Abb. 5.26 – Serie „Kontenmodell“ (Abb. 5.25–5.27), Schritt 2: Kontendimension mit Ebenenspalten.

Derselbe Datensatz wie Abb. 5.25 (Dimensionstabellen, zwölf Buchungen, Kontendimension mit und ohne
Parent-Child-Hierarchie): Quelle ist der gemeinsame Generator
../Kontenmodell_mit_Parent-Child-Hierarchie/daten_kontenmodell.py; er wird hier ausgeführt, nur Startansicht und
Seitentitel werden gesetzt. Ausgabe: kontenmodell.json und kontenmodell.csv in diesem Ordner.
"""
import os
import runpy

HIER = os.path.dirname(os.path.abspath(__file__))
QUELLE = os.path.join(os.path.dirname(HIER), "Kontenmodell_mit_Parent-Child-Hierarchie", "daten_kontenmodell.py")

g = runpy.run_path(QUELLE, run_name="kontenmodell")
g["schreiben"](HIER, 2, "Kontenmodell ohne Parent-Child-Hierarchie")
g["kontrolle"]()
