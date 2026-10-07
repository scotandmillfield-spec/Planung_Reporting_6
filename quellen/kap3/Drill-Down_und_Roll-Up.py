"""Abb. 3.37 – Drill-Down und Roll-Up."""
# Muster: Querformat wie das Original – oben links der Würfel (Region, Produkt, Zeit; rot der Ausschnitt, den die
# Tabelle zeigt), oben rechts der Umsatz nach Monat und Region, darunter der Quartalsumsatz nach Produkt, unten rechts
# die Legende. Gelbe Wertefelder und rote Gitterlinien entfallen; Tabellen im Buchstil ohne senkrechte Linien.
# Pfeilarten nach Bedeutung statt nach Richtung: durchgezogen = Aggregation (Roll-Up, zur Summe hin), gestrichelt =
# Disaggregation (Drill-Down, zu den Details hin). Im Original stimmte die Richtungslegende (← ↑ / → ↓) für die
# senkrechten Pfeile nicht (Monate → Quartal zeigt nach unten und ist trotzdem eine Aggregation).
STEM = "Drill-Down_und_Roll-Up"
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from bookfig import Fig  # noqa: E402
from _olap import drillwuerfel, umsatztabelle, produkttabelle, legende_roll  # noqa: E402

W, H = 155, 90.0
UMSATZ = [(20000, 13000, 7000), (15000, 7000, 8000), (22000, 12000, 10000), (57000, 32000, 25000)]
TAB_X, TAB_Y = 66.0, 2.0
PROD_Y = 48.0


def build(theme):
    f = Fig(W, H, theme, STEM)
    drillwuerfel(f, 15.0, 13.0)
    t, feld = umsatztabelle(f, TAB_X, TAB_Y, ("Summe", "Deutschland", "Frankreich"), UMSATZ)
    produkttabelle(f, t.cx(1), PROD_Y, von=feld[(3, 0)])
    legende_roll(f, 114.0, PROD_Y + 12.0, 41.0)
    return f
