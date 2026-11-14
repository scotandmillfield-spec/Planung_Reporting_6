"""Abb. 5.7 – Dimensionsebenen von betrieblichen IT-Systemen."""
# Muster: Pyramide mit Spitze und rechter Seitenfläche (Körper wie im Original, ohne 3D-Schattierung), mittig
# gesetzt; vier Systemebenen als Bänder der Vorderfläche, Elemente als Boxen je Ebene, die Boxen füllen die
# Ebenenbreite. BI-/KI-gestützte Systeme in der Spitze rot. Die drei Dimensionen als Pfeile an den Kanten der
# Pyramide: Systemebene an der Grundlinie, zeitlicher Horizont an der oberen Kante der Seitenfläche,
# Inhalte/Objekte/Bereiche an der hinteren Kante der Seitenfläche; Achsentitel parallel zu den Kanten.
# Revision 13.11.2026 (2): Platzhalter im Grau der übrigen Kästchen, „intern/extern“ entfernt.
# Entfernt: Farbverläufe und blaue Flächen, Würfelsymbol (Data Warehouse) und 4V-Rad (Big Data) – beide als
# beschriftete Boxen, die vier V als Erläuterung. Platzhalter „…“ je Ebene wie im Original (Revision 13.11.2026).
STEM = "Dimensionsebenen_von_betrieblichen_IT-Systemen"
import math
from bookfig import Fig, P

W = 110
SZ = 7.0
SHY = chr(0xAD)
INS = (0.6, 0.5)
LH = SZ * 1.18 * 25.4 / 72
BH1 = LH + 2 * INS[1] + 0.2                # einzeilige Box
BH2 = 2 * LH + 2 * INS[1] + 0.2            # zweizeilige Box
GAPX = 1.6
SEITE = "E3E3E3"                           # Seitenfläche, etwas dunkler als die Vorderfläche


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


def versatz(p, q, d):
    """Strecke p–q um d mm nach rechts (in Laufrichtung) verschoben, an beiden Enden um 1 mm gekürzt."""
    dx, dy = q[0] - p[0], q[1] - p[1]
    n = math.hypot(dx, dy)
    ux, uy = dx / n, dy / n
    nx, ny = -uy, ux
    if nx < 0:
        nx, ny = -nx, -ny
    return ((p[0] + nx * d + ux, p[1] + ny * d + uy), (q[0] + nx * d - ux, q[1] + ny * d - uy))


def build(theme):
    from bookfig import text_width_mm as tw
    t = theme
    band = t.role("band").fill
    pc = W / 2                                 # Pyramide mittig
    HB = 41.0                                  # halbe Grundlinie
    ya = 0.8                                   # Spitze
    BIw = 14.0

    def bw(txt):
        if txt == "…":
            return 6.0
        return max(9.0, max(tw(z, SZ) for z in txt.replace(SHY, "-\n").split("\n")) + 2.4)

    ebenen = [  # Titel, Elemente (Umbruch mit \n), zweizeilig?
        ("Planungs- und\nBerichtssysteme", ["ERP-\ngestützt", "Tabellen-\nkalkulation", "…"], True),
        ("Abrechnungssysteme", ["Finanz- und\nRechnungswesen", "Personal-\nwesen", "…"], True),
        ("Administrations- und Dispositionssysteme",
         ["Material-\nwirtschaft", "PPS", "Auftrags-\nabwicklung", "…"], True),
        ("Erfassungs- und Steuerungssysteme", ["BDE", "ZDE", "CAD", "DNC", "…"], False),
    ]
    th = lambda titel: (titel.count("\n") + 1) * LH + 0.5   # Höhe der Ebenentitel
    hoehen = []
    for i, (titel, el, zwei) in enumerate(ebenen):
        oben = BH2 + 1.4 if i == 0 else 0.6
        hoehen.append(oben + th(titel) + 0.3 + (BH2 if zwei else BH1) + 1.1)
    C = sum(hoehen) + 1.2 * (len(hoehen) - 1)
    # Höhe der Spitze über der BI-Box so wählen, dass die Elemente jeder Ebene in die Pyramide passen
    # (gerade Kanten von der Spitze zur Grundlinie, halbe Breite HB): hw(y) = s·(y − ya)
    def zeilen(tip):
        y, out = ya + tip, []
        for i, ((titel, el, zwei), h) in enumerate(zip(ebenen, hoehen)):
            yti = y + (BH2 + 1.4 if i == 0 else 0.6)
            out.append((yti, yti + th(titel) + 0.3, sum(bw(e) for e in el) + GAPX * (len(el) - 1)))
            y += h + 1.2
        return out
    tip = 4.0
    while True:
        s = HB / (tip + C)
        if all(2 * s * (yr - ya) - 3.0 >= need and tw(ti.split("\n")[0], SZ, True) <= 2 * s * (yti - ya) - 2.0
               for (yti, yr, need), (ti, _, _) in zip(zeilen(tip), ebenen)) and s * tip >= BIw / 2 + 1.0:
            break
        tip += 0.5
    hw = lambda y: s * (y - ya)
    lagen, y = [], ya + tip
    for i, h in enumerate(hoehen):
        lagen.append((ya if i == 0 else y, y + h))
        y += h + 1.2
    yb = lagen[-1][1]
    H = round(yb + 7.0, 1)

    f = Fig(W, H, theme, STEM)
    A = f.arrow

    # ------------------------------------------------------------ Seitenfläche
    xr = pc + hw(yb)                           # rechte Ecke der Grundlinie
    yk = ya + 0.64 * (yb - ya)                 # hintere Ecke der Seitenfläche
    K = (xr + 6.0, yk)
    f.poly([(pc, ya), K, (xr, yb)], closed=True, fill=SEITE, name="Seitenfläche")

    # ------------------------------------------------------------ Ebenen
    for i, ((titel, el, zwei), (y0, y1)) in enumerate(zip(ebenen, lagen)):
        if i == 0:
            pts = [(pc, y0), (pc + hw(y1), y1), (pc - hw(y1), y1)]
        else:
            pts = [(pc - hw(y0), y0), (pc + hw(y0), y0), (pc + hw(y1), y1), (pc - hw(y1), y1)]
        f.poly(pts, closed=True, fill=band, name=f"Ebene {titel.replace(chr(10), ' ')}")
        yti = (ya + tip + BH2 + 1.4) if i == 0 else y0 + 0.6
        f.text(pc - 30.0, yti, 60.0, th(titel), [P(titel, size=SZ, bold=True)], align="c", anchor="m", bg=band,
               name=f"Titel {titel}")
        for z, zl in enumerate(titel.split("\n")):            # Titelzeile muss in die Ebene passen
            yz = yti + z * LH
            if tw(zl, SZ, True) > 2 * hw(yz) - 2.0:
                f.warnings.append(f"[Ebene {titel}] Titel zu breit")
        bh = BH2 if zwei else BH1
        yr = yti + th(titel) + 0.3
        avail = 2 * hw(yr) - 3.0
        ws = [bw(e) for e in el]
        frei = avail - GAPX * (len(ws) - 1)
        if sum(ws) > frei:
            f.warnings.append(f"[Ebene {titel}] Elemente zu breit ({sum(ws):.1f} > {frei:.1f} mm)")
        k = min(1.8, frei / sum(ws))           # Boxen auf die Ebenenbreite ziehen
        ws = [w_ * k for w_ in ws]
        x = pc - (sum(ws) + GAPX * (len(ws) - 1)) / 2
        for e, w_ in zip(el, ws):
            f.box(x, yr, w_, bh, [P(e, size=SZ)], role="box", ins=INS,
                  name="Platzhalter" if e == "…" else e.replace("\n", ""))
            x += w_ + GAPX

    # BI-/KI-gestützt in der Spitze
    BI = B(pc - BIw / 2, ya + tip, BIw, BH2)
    f.box(BI.x, BI.y, BI.w, BI.h, [P("BI-/KI-\ngestützt", size=SZ, bold=True)], role="box_strong", ins=INS,
          name="BI-/KI-gestützt")

    # ------------------------------------------------------------ Data Warehouse, Big Data
    DW = B(0.4, BI.cy - BH2 / 2, 16.2, BH2)
    f.box(DW.x, DW.y, DW.w, DW.h, [P("Data\nWarehouse", size=SZ, bold=True)], role="box_hi", ins=INS,
          name="Data Warehouse")
    A([(DW.r, BI.cy), (BI.x, BI.cy)], name="Data Warehouse → BI-/KI-gestützt")
    bd = [P("Big Data", size=SZ, bold=True), P("(Volume, Velocity, Variety, Veracity)", size="small",
                                              color=t.text_muted)]
    BDw = 20.6
    BDh = f.measure(bd, BDw, INS)
    BD = B(W - 0.4 - BDw, BI.cy - BDh / 2, BDw, BDh)
    f.box(BD.x, BD.y, BD.w, BD.h, bd, role="box_hi", ins=INS, name="Big Data")
    A([(BI.r, BI.cy), (BD.x, BI.cy)], head=True, tail=True, name="BI-/KI-gestützt ↔ Big Data")

    # ------------------------------------------------------------ Dimensionen an den Kanten
    # Systemebene (Grundlinie)
    ya_ = yb + 3.8
    x0 = pc - hw(yb)
    gw = tw("Systemebene", SZ, True) + 3.0
    A([(pc - gw / 2, ya_), (x0, ya_)], name="Systemebene links")
    A([(pc + gw / 2, ya_), (xr, ya_)], name="Systemebene rechts")
    f.text(pc - gw / 2, ya_ - 1.6, gw, 3.2, [P("Systemebene", size=SZ, bold=True)], align="c", anchor="m",
           name="Achse Systemebene")
    def entlang(p, q, t, d):
        """Punkt bei Anteil t auf p–q, um d mm nach außen (rechts) versetzt."""
        dx, dy = q[0] - p[0], q[1] - p[1]
        n = math.hypot(dx, dy)
        nx, ny = dy / n, -dx / n
        if nx < 0:
            nx, ny = -nx, -ny
        return (p[0] + t * dx + nx * d, p[1] + t * dy + ny * d)

    def schraeg(c, w, h, paras, winkel, name):
        s_ = f.text(c[0] - w / 2, c[1] - h / 2, w, h, paras, align="c", anchor="m", name=name)
        s_.rotation = winkel % 360
        return s_

    # Zeitlicher Horizont: parallel zur oberen Kante der Seitenfläche (Spitze → hintere Ecke), wie im Original
    # zweigeteilt: oberer Pfeil zur Spitze (operativ/strategisch), Achsentitel auf der Linie, unterer Pfeil zur
    # hinteren Ecke (operativ); die Lücke liegt dort, wo der Pfeil BI-/KI-gestützt ↔ Big Data kreuzt.
    A0 = (pc, ya)
    L1 = math.hypot(K[0] - pc, yk - ya)
    w1 = math.degrees(math.atan2(yk - ya, K[0] - pc))
    d1 = 2.6
    tl = (BI.cy - ya) / (yk - ya)                       # Kreuzung mit der Waagerechten BI ↔ Big Data
    mm = lambda v: v / L1
    A([entlang(A0, K, tl - mm(1.6), d1), entlang(A0, K, 0.03, d1)], name="Zeitlicher Horizont strategisch")
    tw_h = tw("Zeitlicher Horizont", SZ, True) + 1.6
    t0 = tl + mm(2.6)
    schraeg(entlang(A0, K, t0 + mm(tw_h / 2), d1), tw_h, LH + 0.3, [P("Zeitlicher Horizont", size=SZ, bold=True)],
            w1, "Achse Zeitlicher Horizont")
    A([entlang(A0, K, t0 + mm(tw_h + 0.4), d1), entlang(A0, K, 0.97, d1)], name="Zeitlicher Horizont operativ")
    wl = tw("strategisch", SZ) + 1.2
    schraeg(entlang(A0, K, 0.03 + mm(wl / 2 + 6.0), d1 + LH + 0.6), wl, 2 * LH + 0.3,
            [P("operativ/", size=SZ), P("strategisch", size=SZ)], w1, "operativ/strategisch")
    wo = tw("operativ", SZ) + 1.0
    schraeg(entlang(A0, K, 0.97 - mm(wo / 2 + 0.5), d1 + 0.5 * LH + 1.0), wo, LH + 0.3,
            [P("operativ", size=SZ)], w1, "operativ")
    # Inhalte/Objekte/Bereiche: parallel zur hinteren Kante der Seitenfläche, Titel außen entlang der Kante
    C0 = (xr, yb)
    L2 = math.hypot(K[0] - xr, yk - yb)
    w2 = math.degrees(math.atan2(yk - yb, K[0] - xr))   # Lesrichtung von unten nach oben
    d2 = 2.2
    A([entlang(C0, K, 0.04, d2), entlang(C0, K, 0.96, d2)], head=True, tail=True, name="Inhalte/Objekte/Bereiche")
    lg = tw("Inhalte/Objekte/Bereiche", SZ, True) + 1.0
    schraeg(entlang(C0, K, 0.5, d2 + 0.5 * LH + 1.0), lg, LH + 0.3, [P("Inhalte/Objekte/Bereiche", size=SZ, bold=True)],
            w2, "Achse Inhalte/Objekte/Bereiche")
    return f
