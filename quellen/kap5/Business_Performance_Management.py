"""Abb. 5.3 – Business Performance Management."""
# Muster: Baum im Rahmen des Führungssystems (gestrichelter Container), darunter Business Performance Management
# als Schlüsselelement (rot). Die beiden Blockpfeile des Originals sind Pfeile mit kursiver Beschriftung
# (Informationen nach oben, Wissen nach unten). Teilfunktionen als weiße Boxen an einer Leitung.
STEM = "Business_Performance_Management"
from bookfig import Fig, P

W = 110
SHY = chr(0xAD)
SZ = 7.0


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
    t = theme
    CW, CG = 34.0, 2.6                         # Kinder
    X0 = (W - 3 * CW - 2 * CG) / 2
    FS = B(W / 2 - 25.0, 2.0, 50.0, 5.6)       # Führungssystem
    yk = FS.b + 5.2                            # Oberkante Kinder
    KH = 7.6
    LW, LH, LG = 24.0, 4.4, 1.4                # Teilfunktionen
    y_l0 = yk + KH + 2.4
    cb = y_l0 + 4 * LH + 3 * LG + 2.4          # Unterkante Container
    yb = cb + 10.0                             # Business Performance Management
    H = round(yb + 6.4 + 0.3, 1)

    f = Fig(W, H, theme, STEM)
    A = f.arrow
    f.box(0.3, 0.3, W - 0.6, cb - 0.3, None, role="container", name="Rahmen Führungssystem")
    f.box(FS.x, FS.y, FS.w, FS.h, [P("Führungssystem", size="head", bold=True)], role="box_hi",
          name="Führungssystem")

    kinder = [f"Informations{SHY}versorgungssystem", "Primäre Führungsfunktionen", "Sekundäre Führungsfunktionen"]
    K = []
    for i, s in enumerate(kinder):
        b = B(X0 + i * (CW + CG), yk, CW, KH)
        f.box(b.x, b.y, b.w, b.h, [P(s, size=SZ, bold=True)], name=s.replace(SHY, ""))
        K.append(b)
    # Führungssystem → Kinder (Verteiler ohne Knotenpunkte)
    yv = FS.b + 2.4
    f.line([(FS.cx, FS.b), (FS.cx, yv)], name="Verteiler")
    f.line([(K[0].cx, yv), (K[2].cx, yv)], name="Verteiler waagerecht")
    for b in K:
        A([(b.cx, yv), (b.cx, b.y)], name="Führungssystem → Teilsystem")

    # Teilfunktionen
    for b, items in ((K[1], ("Planung", "Entscheidung", "Steuerung", "Kontrolle")),
                     (K[2], ("Systembildung", "Systemkopplung"))):
        xs = b.x + 4.0
        xl = b.x + 8.0
        ys = []
        for j, s in enumerate(items):
            y = y_l0 + j * (LH + LG)
            f.box(xl, y, LW, LH, [P(s, size=SZ)], role="box_plain", name=s)
            ys.append(y + LH / 2)
        f.line([(xs, b.b), (xs, ys[-1])], name="Leitung Teilfunktionen")
        for y in ys:
            A([(xs, y), (xl, y)], size="sm", name="→ Teilfunktion")

    # Business Performance Management
    BP = B(0.3, yb, W - 0.6, 6.4)
    f.box(BP.x, BP.y, BP.w, BP.h, [P("Business Performance Management", size="head", bold=True)],
          role="box_strong", name="Business Performance Management")
    xi, xw = K[0].cx, K[2].cx
    A([(xi, BP.y), (xi, cb)], name="Informationen")
    A([(xw, cb), (xw, BP.y)], name="Wissen")
    f.text(xi + 1.4, cb, 30.0, BP.y - cb, [P("Informationen", size=SZ, italic=True)], anchor="m",
           name="Beschriftung Informationen")
    f.text(xw + 1.4, cb, 20.0, BP.y - cb, [P("Wissen", size=SZ, italic=True)], anchor="m",
           name="Beschriftung Wissen")
    return f
