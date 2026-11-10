"""Abb. 3.9.8.b – Strategien der Risikobehandlung in der Risikomatrix."""
# Neue Abbildung nach Vorlage des Autors (SECURWARE 2025, mit A. Lawall), ins Deutsche übertragen.
# Muster: Matrix 3 x 3 mit Achsen Eintrittswahrscheinlichkeit (senkrecht) und Schadenspotenzial (waagerecht),
# Raster dünn gestrichelt. Gefüllte Kreise = Risiko vor der Maßnahme (Anthrazit), hohle Kreise = nach der
# Maßnahme (weiß mit Kontur); je Strategie ein sauberer Pfeil statt Pinselstrich. Die Verminderung bleibt als
# Diagonale, weil sie beide Dimensionen zugleich senkt. Achsentitel waagerecht, kurze Legende oben rechts.
STEM = "Strategien_der_Risikobehandlung_in_der_Risikomatrix"
from bookfig import Fig, P

W = 110
D = 8.6                 # Kreisdurchmesser
GAP = 1.4               # Abstand Pfeil – Kreis
LWP = 1.0               # Strategiepfeile


def build(theme):
    t = theme
    GX, GY = 6.0, 7.2                       # Ursprung des Rasters (oben links)
    CW, CH = 33.0, 24.5                     # Zellen
    GR, GB = GX + 3 * CW, GY + 3 * CH
    H = round(GB + 7.6, 1)
    f = Fig(W, H, t, STEM)
    dunkel = t.role("header").fill
    grau_linie = t.role("box").line

    def pos(col, fx, row, fy):
        return GX + (col + fx) * CW, GY + (row + fy) * CH

    def vorher(c, name):
        f.ellipse(c[0] - D / 2, c[1] - D / 2, D, D, role="header", line="none", name=name)

    def nachher(c, name):
        f.ellipse(c[0] - D / 2, c[1] - D / 2, D, D, role="box_plain", line=t.arrow, lw=0.75, name=name)

    def label(cx, y, s, align="c", w=24.0):
        x = {"c": cx - w / 2, "r": cx - w, "l": cx}[align]
        f.text(x, y, w, 3.4, [P(s, bold=True)], align=align, anchor="m", name=f"Strategie {s}")

    # ------------------------------------------------------------ Raster (dünn gestrichelt grau)
    for k in (1, 2, 3):
        f.line([(GX + k * CW, GY), (GX + k * CW, GB)], color=grau_linie, lw=0.5, dash="sysDash", name="Raster")
        f.line([(GX, GB - k * CH), (GR, GB - k * CH)], color=grau_linie, lw=0.5, dash="sysDash", name="Raster")

    # ------------------------------------------------------------ Achsen
    f.arrow([(GX, GB), (GX, 1.2)], name="Achse Eintrittswahrscheinlichkeit")
    f.arrow([(GX, GB), (W - 0.6, GB)], name="Achse Schadenspotenzial")
    f.text(GX + 1.6, 0.6, 40.0, 3.6, [P("Eintrittswahrscheinlichkeit", bold=True)], anchor="m",
           name="Titel Eintrittswahrscheinlichkeit")
    f.text(GX, GB + 1.4, GR - GX, 3.6, [P("Schadenspotenzial", bold=True)], align="c", anchor="m",
           name="Titel Schadenspotenzial")

    # ------------------------------------------------------------ Legende (oben rechts)
    LD = 2.6
    ly = 2.4
    lx = GR - 27.0
    f.ellipse(lx - 31.0, ly - LD / 2, LD, LD, role="header", line="none", name="Legende vorher")
    f.text(lx - 31.0 + LD + 1.0, ly - 1.7, 27.0, 3.4, [P("vor der Maßnahme", size="note")], anchor="m",
           name="Legende vor der Maßnahme")
    f.ellipse(lx, ly - LD / 2, LD, LD, role="box_plain", line=t.arrow, lw=0.75, name="Legende nachher")
    f.text(lx + LD + 1.0, ly - 1.7, 24.0, 3.4, [P("nach der Maßnahme", size="note")], anchor="m",
           name="Legende nach der Maßnahme")

    # ------------------------------------------------------------ Risikotransfer: Schaden sinkt
    yt = GY + 0.42 * CH
    tv = (GX + 2.36 * CW, yt)
    tn = (GX + 0.5 * CW, yt)
    vorher(tv, "Transfer vorher")
    nachher(tn, "Transfer nachher")
    f.arrow([(tv[0] - D / 2 - GAP, yt), (tn[0] + D / 2 + GAP, yt)], lw=LWP, name="Pfeil Risikotransfer")
    label(GX + 1.5 * CW, yt - 4.6, "Risikotransfer")

    # ------------------------------------------------------------ Vermeidung: Eintrittswahrscheinlichkeit sinkt
    xv = GX + 2.74 * CW
    vv = (xv, GY + 0.72 * CH)
    vn = (xv, GY + 2.55 * CH)
    vorher(vv, "Vermeidung vorher")
    nachher(vn, "Vermeidung nachher")
    f.arrow([(xv, vv[1] + D / 2 + GAP), (xv, vn[1] - D / 2 - GAP)], lw=LWP, name="Pfeil Vermeidung")
    label(xv - 1.6, GY + 2.08 * CH, "Vermeidung", align="r")   # wie Verminderung: über dem Zielkreis

    # ------------------------------------------------------------ Diversifikation: ein Risiko auf mehrere verteilt
    yd = GY + 1.52 * CH
    dv = (GX + 1.78 * CW, yd)
    dn1 = (GX + 0.30 * CW, yd)
    dn2 = (GX + 0.30 * CW + 0.72 * D, yd)
    vorher(dv, "Diversifikation vorher")
    nachher(dn1, "Diversifikation nachher 1")
    nachher(dn2, "Diversifikation nachher 2")
    f.arrow([(dv[0] - D / 2 - GAP, yd), (dn2[0] + D / 2 + GAP, yd)], lw=LWP, name="Pfeil Diversifikation")
    label(GX + CW + 1.2, yd - 4.6, "Diversifikation", align="l")

    # ------------------------------------------------------------ Verminderung: beide Dimensionen sinken
    mv = (GX + 2.30 * CW, GY + 1.62 * CH)
    mn = (GX + 1.52 * CW, GY + 2.50 * CH)
    vorher(mv, "Verminderung vorher")
    nachher(mn, "Verminderung nachher")
    dx, dy = mn[0] - mv[0], mn[1] - mv[1]
    ln = (dx * dx + dy * dy) ** 0.5
    ux, uy = dx / ln, dy / ln
    a = (mv[0] + ux * (D / 2 + GAP), mv[1] + uy * (D / 2 + GAP))
    b = (mn[0] - ux * (D / 2 + GAP), mn[1] - uy * (D / 2 + GAP))
    f.arrow([a, b], lw=LWP, name="Pfeil Verminderung")
    yl = GY + 2.06 * CH                      # links neben dem Pfeil, oberhalb des Zielkreises
    xa = mv[0] + ux * (yl + 1.7 - mv[1]) / uy
    label(xa - 2.6, yl, "Verminderung", align="r")

    # ------------------------------------------------------------ Akzeptanz: Risiko bleibt
    av = (GX + 0.45 * CW, GY + 2.58 * CH)
    vorher(av, "Akzeptanz")
    label(av[0], av[1] - D / 2 - 4.2, "Akzeptanz")
    return f
