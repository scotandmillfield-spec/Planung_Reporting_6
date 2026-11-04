"""Abb. 5.38 – Explorative BI, Cloud Computing, Sandboxing und Self-Service BI."""
# Muster: identisch mit Abb. 5.32 (gleiche Geometrie, gleiche Texte und Rollen), gebaut mit derselben Funktion
# zeichne() aus Traditionelle_und_explorative_BI-Architektur.py. Unterschiede wie in der Folie: Der linke Data Mart
# ist durch „Sandboxing“ ersetzt, im Data Lake kommt oben rechts ein zweites „Sandboxing“ hinzu; beide sind das
# Neue der Abbildung und deshalb rot (box_strong). Die Wolken „Cloud“ werden beschriftete Boxen, die Gedankenblasen
# (Zuordnung Cloud ↔ Sandboxing) gestrichelte Informationslinien. Die linke Cloud steht neben statt über dem
# Sandboxing, damit der Pfeil zur Analyse frei bleibt (im Original von der Wolke verdeckt).
# Doppelrahmen und Blaufüllung der Sandboxing-Kästen entfallen; im Data Lake „Sandboxing“ einzeilig, links getrennt.
STEM = "Explorative_BI_Cloud_Computing_Sandboxing_und_Self-Service_BI"
import importlib.util
import os

_spec = importlib.util.spec_from_file_location(
    "bi_architektur", os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                   "Traditionelle_und_explorative_BI-Architektur.py"))
_mod = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_mod)


def build(theme):
    return _mod.zeichne(theme, "sandbox")
