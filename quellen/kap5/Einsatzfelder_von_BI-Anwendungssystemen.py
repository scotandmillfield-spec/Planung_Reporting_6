"""Abb. 5.5 – Einsatzfelder von BI-Anwendungssystemen (vgl. Kemper et al. 2010, S. 9)."""
# Muster: zwei Container (Führungssystem, Ausführungssystem). Oben die Managementpyramide (Top, Middle, Lower)
# mit dem Keil „Koordination & Unterstützung“, links die rote Klammer „Business Intelligence“; unten die
# wertschöpfenden Prozesse als Pfeilkette. Alle Datenflusspfeile enden an der Umrandung des Führungssystems. Die Blockpfeile des Originals sind Pfeile mit kursiver Beschriftung.
# Entfernt: Weltkarte (Deko, „Externe Daten“ sagt es), Farbverlauf; Graustufen wie im Druck des Originals
# (Top und Middle hell, Lower dunkler).
STEM = "Einsatzfelder_von_BI-Anwendungssystemen"
from bookfig import Fig, P, arc_pts

W = 110
SZ = 7.0
SHY = chr(0xAD)


def build(theme):
    t = theme
    # ------------------------------------------------------------ Geometrie
    CR = 88.0                                  # rechte Kante der Container
    pcx, hb = 58.0, 25.0                       # Pyramide: Mitte, halbe Basis
    yt, yb = 8.2, 39.2                         # Spitze, Basis
    PH = yb - yt
    g = 2.2                                    # Abstand Keil / Pyramide
    hw = lambda y: hb * (y - yt) / PH          # halbe Breite der Pyramide in Höhe y
    yFb = yb + 2.6                             # Unterkante Führungssystem
    yA0 = yFb + 13.0                           # Oberkante Ausführungssystem
    yA1 = yA0 + 16.0
    H = round(yA1 + 0.3, 1)

    f = Fig(W, H, theme, STEM)
    A = f.arrow

    # ------------------------------------------------------------ Container
    for y0, y1, s in ((0.3, yFb, "Führungssystem"), (yA0, yA1, "Ausführungssystem")):
        f.box(0.3, y0, CR - 0.3, y1 - y0, None, role="container", name=s)
        f.text(1.9, y0 + 0.7, 40.0, 3.2, [P(s, size=6.5, bold=True)], name=f"Titel {s}")

    # ------------------------------------------------------------ Pyramide
    f.text(pcx - 15.0, 3.6, 30.0, 3.2, [P("Management", size=SZ)], align="c", name="Management")
    stufen = (("Top", yt, yt + 13.0, "box"), ("Middle", yt + 15.0, yt + 22.0, "box"),
              ("Lower", yt + 24.0, yb, "box_hi"))
    for s, y0, y1, role in stufen:
        r = t.role(role)
        if y0 == yt:
            pts = [(pcx, y0), (pcx + hw(y1), y1), (pcx - hw(y1), y1)]
        else:
            pts = [(pcx - hw(y0), y0), (pcx + hw(y0), y0), (pcx + hw(y1), y1), (pcx - hw(y1), y1)]
        f.poly(pts, closed=True, fill=r.fill, line=r.line, lw=r.lw, name=f"Ebene {s}")
        yy0 = y0 + (y1 - y0) * (0.45 if y0 == yt else 0.0)
        f.text(pcx - 10.0, yy0, 20.0, y1 - yy0, [P(s, size=7.5)], align="c", anchor="m", bg=r.fill, name=s)

    # Keil Koordination & Unterstützung (parallel zur linken Pyramidenseite)
    xw = pcx - hb - g
    kr = t.role("box")
    f.poly([(xw, yt), (pcx - g, yt), (xw, yb)], closed=True, fill=kr.fill, line=kr.line, lw=kr.lw,
           name="Keil Koordination")
    f.text(xw + 0.9, yt + 0.8, 21.0, 6.6, [P("Koordination &", size=SZ), P("Unterstützung", size=SZ)],
           bg=kr.fill, name="Koordination & Unterstützung")

    # Klammer Business Intelligence (Akzent)
    xb, r = xw - 2.6, 1.2
    ym = (yt + yb) / 2
    pts = (arc_pts(xb + r, yt + r, r, 90, 180) + [(xb, ym - r)] + arc_pts(xb - r, ym - r, r, 0, -90)
           + arc_pts(xb - r, ym + r, r, 90, 0) + [(xb, yb - r)] + arc_pts(xb + r, yb - r, r, 180, 270))
    f.poly(pts, closed=False, line=t.accent, lw=1.0, name="Klammer Business Intelligence")
    f.text(0.8, ym - 3.2, xb - r - 1.6, 6.4, [P("Business", size=SZ, bold=True, color=t.accent),
                                              P("Intelligence", size=SZ, bold=True, color=t.accent)],
           align="r", anchor="m", name="Business Intelligence")

    # ------------------------------------------------------------ Datenflüsse
    # Revision 13.11.2026: alle Pfeile enden an der Umrandung des Führungssystems – externe Daten gelten
    # für alle Ebenen (Top, Middle, Lower), Planen/Interne Daten nicht an Lower
    ye = yt + 18.5                             # Externe Daten → Führungssystem
    A([(W - 0.4, ye), (CR, ye)], name="Externe Daten")
    f.text(CR + 1.2, ye - 3.6, W - CR - 1.6, 3.2, [P("Externe Daten", size=SZ, italic=True)], align="r",
           name="Beschriftung Externe Daten")
    xd, xu = pcx - 9.0, pcx + 9.0
    A([(xd, yFb), (xd, yA0)], name="Planen, Steuern, Überwachen")
    A([(xu, yA0), (xu, yFb)], name="Interne Daten")
    lh = SZ * 1.18 * 25.4 / 72
    ym2 = (yFb + yA0) / 2
    f.text(xd - 31.4, ym2 - 1.5 * lh - 0.2, 30.0, 3 * lh + 0.4,
           [P("Planen", size=SZ, italic=True), P("Steuern", size=SZ, italic=True),
            P("Überwachen", size=SZ, italic=True)], align="r", anchor="m", name="Beschriftung Planen")
    f.text(xu + 1.4, ym2 - lh / 2 - 0.2, 24.0, lh + 0.4, [P("Interne Daten", size=SZ, italic=True)],
           anchor="m", name="Beschriftung Interne Daten")

    # ------------------------------------------------------------ Ausführungssystem
    yc = yA0 + 9.0
    f.text(2.4, yA0 + 4.2, 27.0, 11.0,
           [P(f"Operative Informations- und Kommunikations{SHY}systeme", size=SZ)], anchor="m",
           name="Operative Informations- und Kommunikationssysteme")
    cw, cg, td, ch = 16.4, 1.0, 3.0, 7.0
    x0 = 33.0
    hr = t.role("box_hi")
    for i in range(3):
        x = x0 + i * (cw + cg)
        f.poly([(x, yc - ch / 2), (x + cw - td, yc - ch / 2), (x + cw, yc), (x + cw - td, yc + ch / 2),
                (x, yc + ch / 2), (x + td, yc)], closed=True, fill=hr.fill, name=f"Prozessschritt {i + 1}")
    xe = x0 + 3 * cw + 2 * cg
    f.box(x0 + 6.0, yc - 2.3, xe - x0 - 12.0, 4.6, [P("Wertschöpfende Prozesse", size=SZ)], role="box_plain",
          name="Wertschöpfende Prozesse")
    return f
