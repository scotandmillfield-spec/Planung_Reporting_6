"""Exemplarische Struktur im Reporting: Gesamtunternehmen und drei Analysesichten, je Kennzahlen/BSC und Detailberichte."""
# Muster: Zeilen mit Boxen + Pfeilen in einer Achse, links ein Baum (Stamm mit Abzweigungen).
STEM = "Exemplarische_Struktur_im_Reporting"
from bookfig import Fig, P, THEMES

W = 110
X0 = 0.3                 # linker Rand (Kontur)
X_SUB = 9.0              # Einzug der untergeordneten Analysesichten
X_STAMM = 4.5            # senkrechte Leitung des Baums
R1 = 47.0                # rechte Kante Spalte 1
X_KZ, W_KZ = 53.0, 27.0  # Kennzahlen/Balanced Scorecard
X_DB = 88.0              # Detailberichte
W_DB = W - 0.3 - X_DB
BH = 8.0                 # Boxhöhe (zwei Zeilen à 7 pt)
GAP = 3.6                # Abstand der Zeilen
Y0 = 0.3

ZEILEN = ["Gesamtunternehmensanalyse", "Geschäftsfelder", "Standorte", "Funktionsbereiche"]


class B:
    def __init__(self, x, y, w, h):
        self.x, self.y, self.w, self.h = x, y, w, h
    @property
    def r(self): return self.x + self.w
    @property
    def b(self): return self.y + self.h
    @property
    def cx(self): return self.x + self.w / 2
    @property
    def cy(self): return self.y + self.h / 2


H = Y0 + len(ZEILEN) * BH + (len(ZEILEN) - 1) * GAP + 0.3


def build(theme):
    f = Fig(W, H, theme, STEM)
    t = theme
    A = f.arrow

    def dot(x, y):
        f.ellipse(x - 0.45, y - 0.45, 0.9, 0.9, fill=t.arrow, line="none", name="Knoten")

    links = []
    for i, name in enumerate(ZEILEN):
        y = Y0 + i * (BH + GAP)
        x = X0 if i == 0 else X_SUB
        f.box(x, y, R1 - x, BH, [P(name, bold=True)], role="box_hi" if i == 0 else "box",
              anchor="m", name=name)
        L = B(x, y, R1 - x, BH)
        links.append(L)
        f.box(X_KZ, y, W_KZ, BH, [P("Kennzahlen/\nBalanced Scorecard")], role="box", anchor="m",
              name=f"Kennzahlen {i + 1}")
        f.box(X_DB, y, W_DB, BH, [P("Detailberichte")], role="box", anchor="m",
              name=f"Detailberichte {i + 1}")
        A([(L.r, L.cy), (X_KZ, L.cy)], name=f"Analyse-Kennzahlen {i + 1}")
        A([(X_KZ + W_KZ, L.cy), (X_DB, L.cy)], head=True, tail=True, name=f"Kennzahlen-Details {i + 1}")

    # Baum: Gesamtunternehmen -> Geschäftsfelder, Standorte, Funktionsbereiche
    top, last = links[0], links[-1]
    A([(X_STAMM, top.b), (X_STAMM, last.cy), (last.x, last.cy)], name="Stamm")
    for L in links[1:-1]:
        A([(X_STAMM, L.cy), (L.x, L.cy)], name=f"Abzweig {L.cy:.1f}")   # ohne Knotenpunkt (Revision DS 07.10.2026)
    return f
