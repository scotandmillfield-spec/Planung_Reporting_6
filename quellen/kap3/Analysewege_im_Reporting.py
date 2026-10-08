"""Abb. 3.10 – Analysewege im Reporting."""
# Muster: Stufen in einer Achse (Navigation gemäß Startcockpit → zwei Detailanalysen, je mit Kennzahlen
# und Berichten), links eine Sammelleitung mit Abzweigungen, rechts der Wechsel zwischen den Detailanalysen.
STEM = "Analysewege_im_Reporting"
from bookfig import Fig, P

W = 110
NB = chr(0xA0)
ZB = "z." + NB + "B."

# Revision DS 07.10.2026: Beispielkästen rechts und Kasten „Reporting-Navigation“ entfallen,
# die Hauptspalte nutzt dafür die volle Breite.
X0, X1 = 5.5, W - 7.5         # Hauptspalte
XS = 2.4                      # Sammelleitung links
XW = X1 + 4.0                 # Wechsel zwischen den Detailanalysen (rechts)
KW = 28.0                     # Kennzahlen/Berichte, symmetrisch unter der Detailanalyse
XK, XB = (X0 + X1) / 2 - 8.0 - KW, (X0 + X1) / 2 + 8.0


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


def build(theme):
    tmp = Fig(W, 30, theme)
    detail = lambda titel, bsp: [P(titel, bold=True), P(f"{ZB} {bsp}", size=6.5)]
    hD = max(tmp.measure(detail("Detailanalyse: Kostenträgerstruktur", "dezidiert für Key-Account-Manager"), X1 - X0), 8.0)
    start = [P("Navigation gemäß Startcockpit", bold=True),
             P(f"({ZB} nach Bereichen und Spitzenkennzahlen)", size=6.5)]
    hS, hK = max(tmp.measure(start, X1 - X0), 8.0), 5.6

    y = 0.3
    SK = B(X0, y, X1 - X0, hS); y = SK.b + 4.6
    D1 = B(X0, y, X1 - X0, hD); y = D1.b + 4.6
    K1 = B(XK, y, KW, hK); B1 = B(XB, y, KW, hK); y = K1.b + 6.0
    D2 = B(X0, y, X1 - X0, hD); y = D2.b + 4.6
    K2 = B(XK, y, KW, hK); B2 = B(XB, y, KW, hK)
    H = round(K2.b + 0.3, 1)

    f = Fig(W, H, theme, STEM)
    t = theme
    A = f.arrow

    def dot(x, y):
        f.ellipse(x - 0.45, y - 0.45, 0.9, 0.9, fill=t.arrow, line="none", name="Knoten")

    f.box(SK.x, SK.y, SK.w, SK.h, start, name="Navigation Startcockpit")
    f.box(D1.x, D1.y, D1.w, D1.h, detail("Detailanalyse: Bereichsstruktur", "Management, Vertrieb und Produktion"),
          name="Detailanalyse Bereichsstruktur")
    f.box(D2.x, D2.y, D2.w, D2.h, detail("Detailanalyse: Kostenträgerstruktur", "dezidiert für Key-Account-Manager"),
          name="Detailanalyse Kostenträgerstruktur")
    for k, b, n in ((K1, B1, 1), (K2, B2, 2)):
        f.box(k.x, k.y, k.w, k.h, [P("Kennzahlen")], role="box_plain", name=f"Kennzahlen {n}")
        f.box(b.x, b.y, b.w, b.h, [P("Berichte")], role="box_plain", name=f"Berichte {n}")
        A([(k.r, k.cy), (b.x, b.cy)], head=True, tail=True, name=f"Kennzahlen–Berichte {n}")

    # Startcockpit -> Detailanalysen (Sammelleitung links)
    f.line([(SK.x, SK.cy), (XS, SK.cy), (XS, D2.cy)], color=t.arrow, lw=t.arrow_lw, name="Sammelleitung")
    A([(XS, D1.cy), (D1.x, D1.cy)], name="Navigation–Bereichsstruktur")
    A([(XS, D2.cy), (D2.x, D2.cy)], name="Navigation–Kostenträgerstruktur")
    dot(XS, D1.cy)
    # Detailanalyse -> Kennzahlen und Berichte (Abzweigung)
    for d, k, b, n in ((D1, K1, B1, 1), (D2, K2, B2, 2)):
        ym = (d.b + k.y) / 2
        f.line([(d.cx, d.b), (d.cx, ym)], color=t.arrow, lw=t.arrow_lw, name=f"Abzweig {n}")
        A([(d.cx, ym), (k.cx, ym), (k.cx, k.y)], name=f"Detail–Kennzahlen {n}")
        A([(d.cx, ym), (b.cx, ym), (b.cx, b.y)], name=f"Detail–Berichte {n}")
        dot(d.cx, ym)
    # Wechsel zwischen den Detailanalysen (rechts)
    A([(D1.r, D1.cy), (XW, D1.cy), (XW, D2.cy), (D2.r, D2.cy)], head=True, tail=True, name="Wechsel Detailanalysen")

    return f
