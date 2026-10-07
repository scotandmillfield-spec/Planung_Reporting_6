"""Abb. 3.33 – Einfacher Datenwürfel."""
# Muster: Datenwürfel in Schrägprojektion – Vorderseite 4 × 5 Zellen (Produkt × Zeit), Tiefe 3 Zellen (Region).
# Statt einzelner Würfelchen mit Lücken und blauen Seitenflächen ein durchgehendes Zellraster; die räumliche Wirkung
# entsteht nur aus drei flachen Grautönen (vorn weiß, oben hellgrau, rechts mittelgrau). Die drei Dimensionen als Pfeile
# entlang der Kanten ab der vorderen oberen rechten Ecke, wie im Original; „Dimension Produkt“ steht unter dem Pfeil
# neben der Vorderseite – so in allen OLAP-Abbildungen 3.33–3.40.
# Würfel, Pfeile und Beschriftung stehen in _olap.py (standardwuerfel) und werden von Slice und Dice mitbenutzt.
STEM = "Einfacher_Datenwuerfel"
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from bookfig import Fig  # noqa: E402
from _olap import standardwuerfel  # noqa: E402

W, H = 110, 67.0


def build(theme):
    f = Fig(W, H, theme, STEM)
    standardwuerfel(f, 44.5, 16.5)
    return f
