"""Abb. 5.7 – Dimensionsebenen von betrieblichen IT-Systemen."""
# Muster: Pyramide aus vier Systemebenen (Trapeze, Abstand statt Stufen-3D), Elemente als Boxen je Ebene,
# BI-gestützte Planungs- und Berichtssysteme an der Spitze rot. Die drei Dimensionen als beschriftete Achsen:
# Systemebene (unten), zeitlicher Horizont (entlang der rechten Flanke), Inhalte/Objekte/Bereiche (rechts).
# Entfernt: 3D-Stufen und blaue Flächen, Würfelsymbol (Data Warehouse) und 4V-Rad (Big Data) – beide als
# beschriftete Boxen, die vier V als Erläuterung; Platzhalter „…“ (Autorenwunsch, vgl. Abb. 2.2).
STEM = "Dimensionsebenen_von_betrieblichen_IT-Systemen"
from bookfig import Fig, P

W = 110
SZ = 7.0
SHY = chr(0xAD)
INS = (0.6, 0.5)
LH = SZ * 1.18 * 25.4 / 72
BH1 = LH + 2 * INS[1] + 0.2                # einzeilige Box
BH2 = 2 * LH + 2 * INS[1] + 0.2            # zweizeilige Box
GAPX = 1.6


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
    from bookfig import text_width_mm as tw
    t = theme
    band = t.role("band").fill
    pc, WT, s = 44.0, 17.0, 0.55               # Mitte, Breite oben, Breitenzunahme je Seite und mm
    yt = 1.0
    hw = lambda y: WT / 2 + s * (y - yt)       # halbe Breite in Höhe y

    def bw(txt):
        return max(10.0, max(tw(z, SZ) for z in txt.replace(SHY, "-\n").split("\n")) + 2.2)

    ebenen = [  # Titel, Elemente (Umbruch mit \n), zweizeilig?
        ("Planungs- und\nBerichtssysteme", ["ERP-\ngestützt", "Tabellen-\nkalkulation"], True),
        ("Abrechnungssysteme", ["Finanz- und\nRechnungswesen", "Personalwesen"], True),
        ("Administrations- und Dispositionssysteme", ["Material-\nwirtschaft", "PPS", "Auftrags-\nabwicklung"],
         True),
        ("Erfassungs- und Steuerungssysteme", ["BDE", "ZDE", "CAD", "DNC"], False),
    ]
    H_BI = BH2
    th = lambda titel: (titel.count("\n") + 1) * LH + 0.5   # Höhe der Ebenentitel
    lagen = []
    y = yt
    for i, (titel, el, zwei) in enumerate(ebenen):
        oben = 1.0 + H_BI + 0.8 if i == 0 else 0.6
        h = oben + th(titel) + 0.3 + (BH2 if zwei else BH1) + 1.1
        lagen.append((y, y + h))
        y += h + 1.2
    yb = lagen[-1][1]
    H = round(yb + 7.0, 1)

    f = Fig(W, H, theme, STEM)
    A = f.arrow

    # ------------------------------------------------------------ Ebenen
    for i, ((titel, el, zwei), (y0, y1)) in enumerate(zip(ebenen, lagen)):
        f.poly([(pc - hw(y0), y0), (pc + hw(y0), y0), (pc + hw(y1), y1), (pc - hw(y1), y1)], closed=True,
               fill=band, name=f"Ebene {titel}")
        yti = y0 + (1.0 + H_BI + 0.8 if i == 0 else 0.6)
        f.text(pc - 30.0, yti, 60.0, th(titel), [P(titel, size=SZ, bold=True)], align="c", anchor="m", bg=band,
               name=f"Titel {titel}")
        for z, zl in enumerate(titel.split("\n")):            # Titelzeile muss in die Ebene passen
            yz = yti + (z + 1) * LH
            if tw(zl, SZ, True) > 2 * hw(yz) - 2.0:
                f.warnings.append(f"[Ebene {titel}] Titel zu breit")
        bh = BH2 if zwei else BH1
        ws = [bw(e) for e in el]
        total = sum(ws) + GAPX * (len(ws) - 1)
        yr = yti + th(titel) + 0.3
        avail = 2 * hw(yr) - 2.4
        if total > avail:
            f.warnings.append(f"[Ebene {titel}] Elemente zu breit ({total:.1f} > {avail:.1f} mm)")
        x = pc - total / 2
        for e, w_ in zip(el, ws):
            f.box(x, yr, w_, bh, [P(e, size=SZ)], ins=INS, name=e.replace("\n", ""))
            x += w_ + GAPX

    # BI-gestützt an der Spitze
    BI = B(pc - 6.5, yt + 1.0, 13.0, H_BI)
    f.box(BI.x, BI.y, BI.w, BI.h, [P("BI-\ngestützt", size=SZ, bold=True)], role="box_strong", ins=INS,
          name="BI-gestützt")

    # ------------------------------------------------------------ Data Warehouse, Big Data
    DW = B(0.4, BI.cy - BH2 / 2, 16.2, BH2)
    f.box(DW.x, DW.y, DW.w, DW.h, [P("Data\nWarehouse", size=SZ, bold=True)], role="box_hi", ins=INS,
          name="Data Warehouse")
    A([(DW.r, BI.cy), (BI.x, BI.cy)], name="Data Warehouse → BI-gestützt")
    bd = [P("Big Data", size=SZ, bold=True), P("(Volume, Velocity, Variety, Veracity)", size="small",
                                              color=t.text_muted)]
    BDw = 20.6
    BDh = f.measure(bd, BDw, INS)
    BD = B(W - 0.4 - BDw, BI.cy - BDh / 2, BDw, BDh)
    f.box(BD.x, BD.y, BD.w, BD.h, bd, role="box_hi", ins=INS, name="Big Data")
    A([(BI.r, BI.cy), (BD.x, BI.cy)], head=True, tail=True, name="BI-gestützt ↔ Big Data")

    # ------------------------------------------------------------ Dimensionen
    # Systemebene (unten)
    ya = yb + 3.8
    x0, x1 = pc - hw(yb), pc + hw(yb)
    gw = tw("Systemebene", SZ, True) + 3.0
    A([(pc - gw / 2, ya), (x0, ya)], name="Systemebene links")
    A([(pc + gw / 2, ya), (x1, ya)], name="Systemebene rechts")
    f.text(pc - gw / 2, ya - 1.6, gw, 3.2, [P("Systemebene", size=SZ, bold=True)], align="c", anchor="m",
           name="Achse Systemebene")
    # Zeitlicher Horizont (parallel zur rechten Flanke)
    off = 3.0
    yo, yu = yt + 11.0, yb - 2.0
    po, pu = (pc + hw(yo) + off, yo), (pc + hw(yu) + off, yu)
    A([po, pu], head=True, tail=True, name="Zeitlicher Horizont")
    f.text(po[0] + s * 2 * LH + 1.4, yo - 0.4, 16.0, 2 * LH + 0.2, [P("operativ/", size=SZ),
                                                                 P("strategisch", size=SZ)],
           name="operativ/strategisch")
    f.text(pu[0] + 1.4, yu - LH - 0.8, 12.0, LH + 0.2, [P("operativ", size=SZ)], name="operativ")
    ym = (yo + yu) / 2
    f.text(pc + hw(ym + LH) + off + 1.6, ym - LH, 14.0, 2 * LH + 0.2,
           [P("Zeitlicher", size=SZ, bold=True), P("Horizont", size=SZ, bold=True)], name="Achse Zeitlicher Horizont")
    # Inhalte/Objekte/Bereiche (rechts, senkrecht)
    xv = W - 3.4
    yv0, yv1 = yt + 17.0, yb
    lg = tw("Inhalte/Objekte/Bereiche", SZ, True) + 3.0
    yvm = (yv0 + yv1) / 2
    A([(xv, yvm - lg / 2), (xv, yv0)], name="Inhalte oben")
    A([(xv, yvm + lg / 2), (xv, yv1)], name="Inhalte unten")
    f.text(xv - LH - 0.2, yvm - lg / 2, 2 * LH + 0.4, lg,
           [P("Inhalte/Objekte/Bereiche", size=SZ, bold=True), P("(intern/extern)", size=SZ)],
           align="c", anchor="m", rot=270, name="Achse Inhalte/Objekte/Bereiche")
    return f
