"""Abb. 3.13 – Modell der Teilplanungsgebiete."""
# Muster: Raster aus vier Spalten, von oben nach unten vom strategischen Plan über die mengenorientierten Teilpläne
# zur Ergebnis-, Bilanz- und Finanzplanung. Verzweigungen und Zusammenführungen als Busse mit Knotenpunkten,
# rechts der Bus Investition–Kapazität–Finanzen, links die gestrichelten Zuflüsse von außen (wie im Original).
STEM = "Modell_der_Teilplanungsgebiete"
from bookfig import Fig, P

W = 110
SHY = chr(0xAD)
XL, XR = 6.5, 104.5          # Hauptfläche
GAP = 3.0
CW = (XR - XL - 3 * GAP) / 4  # Spaltenbreite
XC = [XL + i * (CW + GAP) for i in range(4)]
XBUS_R = 107.6               # Bus rechts
XBUS_L = 2.4                 # gestrichelte Zuflüsse links


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
    H1, H2 = 6.0, 7.2          # einzeilige / zweizeilige Boxen
    y_sp = 0.3
    y1 = y_sp + H1 + 5.0
    y2 = y1 + H2 + 5.0
    y3 = y2 + H2 + 5.0
    y4 = y3 + H1 + 4.0
    y5 = y4 + H1 + 5.0
    y6 = y5 + H1 + 5.0
    y_unten = y6 + H1 + 3.4
    H = round(y_unten + 0.6, 1)

    f = Fig(W, H, theme, STEM)
    t = theme
    A = f.arrow
    L = lambda pts, name: f.line(pts, color=t.arrow, lw=t.arrow_lw, name=name)

    def dot(x, y):
        f.ellipse(x - 0.45, y - 0.45, 0.9, 0.9, fill=t.arrow, line="none", name="Knoten")

    def box(b, text, name=None):
        f.box(b.x, b.y, b.w, b.h, [P(text)], name=name or text.replace(SHY, ""))
        return b

    breit = XR - XL
    SP = box(B(XL, y_sp, breit, H1), "Strategischer Plan")
    AB = box(B(XC[0], y1, CW, H2), "Absatzplanung")
    PR = box(B((XC[1] + XC[2] + CW) / 2 - CW / 2, y1, CW, H2), f"Produktions{SHY}planung")
    IN = box(B(XC[3], y1, CW, H2), f"Investitions{SHY}planung")
    UM = box(B(XC[0], y2, CW, H2), "Umsatzplanung")
    EK = box(B(XC[1], y2, CW, H2), "Einkaufsplanung")
    PE = box(B(XC[2], y2, CW, H2), "Personalplanung")
    AN = box(B(XC[3], y2, CW, H2), "Anlagenplanung")
    HK = box(B(XC[1], y3, CW, y4 + H1 - y3), f"Herstellkosten{SHY}planung")
    KA = box(B(XC[2], y3, XR - XC[2], H1), "Kapazitätsabgleich")
    KS = box(B(XC[2], y4, XR - XC[2], H1), "Kostenstellenplanung")
    ER = box(B(XL, y5, breit, H1), "Produktergebnisplanung/Betriebsergebnisplanung")
    BI = box(B(XL, y6, XC[2] - GAP - XL, H1), "Bilanz- und GuV-Planung")
    FI = box(B(XC[2], y6, XR - XC[2], H1), "Finanzplanung")

    # Strategischer Plan -> Absatz- und Investitionsplanung (gestrichelt wie im Original)
    yv = (SP.b + y1) / 2
    f.arrow([(SP.cx, SP.b), (SP.cx, yv)], tail=False, dash="sysDash", name="Strategischer Plan Abgang")
    for z in (AB, IN):
        f.arrow([(SP.cx, yv), (z.cx, yv), (z.cx, z.y)], dash="sysDash", name=f"Strategischer Plan–{z.cx:.0f}")
    dot(SP.cx, yv)
    # Absatz -> Produktion, Absatz -> Umsatz
    A([(AB.r, AB.cy), (PR.x, PR.cy)], name="Absatz–Produktion")
    A([(AB.cx, AB.b), (AB.cx, UM.y)], name="Absatz–Umsatz")
    # Produktion -> Einkauf, Personal, Anlagen
    yp = (PR.b + y2) / 2
    L([(PR.cx, PR.b), (PR.cx, yp)], "Produktion Abgang")
    for z in (EK, PE, AN):
        A([(PR.cx, yp), (z.cx, yp), (z.cx, z.y)], name=f"Produktion–{z.cx:.0f}")
    dot(PR.cx, yp)
    # Einkauf -> Herstellkosten
    A([(EK.cx, EK.b), (EK.cx, HK.y)], name="Einkauf–Herstellkosten")
    # Personal + Anlagen -> Kapazitätsabgleich
    yk = (PE.b + KA.y) / 2
    L([(PE.cx, PE.b), (PE.cx, yk), (AN.cx, yk), (AN.cx, AN.b)], "Personal/Anlagen")
    A([(KA.cx, yk), (KA.cx, KA.y)], name="Personal/Anlagen–Kapazität")
    dot(KA.cx, yk)
    # Kapazitätsabgleich -> Kostenstellen -> Herstellkosten
    A([(KA.cx, KA.b), (KA.cx, KS.y)], name="Kapazität–Kostenstellen")
    A([(KS.x, KS.cy), (HK.r, KS.cy)], name="Kostenstellen–Herstellkosten")
    # Herstellkosten + Kostenstellen -> Produktergebnis
    ym = (KS.b + ER.y) / 2
    xm = (HK.cx + KS.cx) / 2
    L([(HK.cx, HK.b), (HK.cx, ym), (KS.cx, ym), (KS.cx, KS.b)], "Herstellkosten/Kostenstellen")
    A([(xm, ym), (xm, ER.y)], name="Herstellkosten/Kostenstellen–Produktergebnis")
    dot(xm, ym)
    # Umsatz -> Produktergebnis (im Original über den linken Rand geführt)
    A([(UM.cx, UM.b), (UM.cx, ER.y)], name="Umsatz–Produktergebnis")
    # Produktergebnis <-> Bilanz/GuV und Finanzen
    yb = (ER.b + y6) / 2
    A([(ER.cx, yb), (ER.cx, ER.b)], name="Produktergebnis Bus")
    for z in (BI, FI):
        A([(ER.cx, yb), (z.cx, yb), (z.cx, z.y)], name=f"Produktergebnis–{z.cx:.0f}")
    dot(ER.cx, yb)
    # Bus rechts: Investition <-> Kapazitätsabgleich <-> Finanzplanung
    L([(XBUS_R, IN.cy), (XBUS_R, FI.cy)], "Bus Investition")
    for z in (IN, KA, FI):
        A([(XBUS_R, z.cy), (z.r, z.cy)], name=f"Bus–{z.cy:.0f}")
    dot(XBUS_R, KA.cy)
    # gestrichelte Zuflüsse von außen (links)
    f.line([(XBUS_L, SP.cy), (XBUS_L, y_unten), (FI.cx, y_unten)], color=t.arrow, lw=t.arrow_lw, dash="sysDash",
           name="Zuflüsse von außen")
    for z in (SP, ER):
        A([(XBUS_L, z.cy), (z.x, z.cy)], dash="sysDash", name=f"Zufluss {z.cy:.0f}")
    for z in (BI, FI):
        A([(z.cx, y_unten), (z.cx, z.b)], dash="sysDash", name=f"Zufluss unten {z.cx:.0f}")
    dot(XBUS_L, ER.cy)
    dot(BI.cx, y_unten)
    return f
