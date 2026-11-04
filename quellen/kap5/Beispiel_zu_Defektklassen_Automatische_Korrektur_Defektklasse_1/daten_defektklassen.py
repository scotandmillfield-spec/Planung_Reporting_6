"""Daten für Abb. 5.12 – Serie „Beispiel zu Defektklassen“ (Abb. 5.11–5.15), Schritt 2: automatische Korrektur der Klasse 1.

Derselbe Datensatz wie Abb. 5.11 (sieben Kundenbestellungen mit Defekten der Klassen 1–3): Quelle ist der gemeinsame
Generator ../Beispiel_zu_Defektklassen_Ausgangspunkt_Rohdaten/daten_defektklassen.py; er wird hier ausgeführt, nur
Startschritt und Seitentitel werden gesetzt. Ausgabe: defektklassen.json und defektklassen.csv in diesem Ordner.
"""
import os
import runpy

HIER = os.path.dirname(os.path.abspath(__file__))
QUELLE = os.path.join(os.path.dirname(HIER), "Beispiel_zu_Defektklassen_Ausgangspunkt_Rohdaten", "daten_defektklassen.py")

g = runpy.run_path(QUELLE, run_name="__main__")          # schreibt auch die Daten der Abb. 5.11 neu
g["schreiben"](HIER, 2, "Defektklassen: Korrektur Klasse 1")
g["kontrolle"](2)
