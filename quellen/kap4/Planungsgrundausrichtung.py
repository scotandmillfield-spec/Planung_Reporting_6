"""Abb. 4.14 – Planungsgrundausrichtung."""
# Muster: drei Ebenen untereinander – oben Zentrale Planung (Controlling) und Vorstand, darunter die Ebene der
# konzentrierten und die der dezentralen Planung als gestapelte Tafeln (mehrere Hauptbereiche bzw. Niederlassungen).
# Links Top-Down-, rechts Bottom-Up-Pfeil (Blockpfeile mit senkrechter Beschriftung wie im Original).
# Gegenstrom: Sammelleitungen mit Pfeilen in beide Richtungen; die zwei Leitungen der Hauptbereichsleitung zu den
# dezentralen Planungen (im Original eine Sammelleitung und eine Schleife) sind zu einer Sammelleitung gebündelt.
# Gestrichelt: Rückmeldungen aus den dahinterliegenden Tafeln an die übrigen konzentrierten Planungen.
STEM = "Planungsgrundausrichtung"
from bookfig import Fig, P

W = 110
SHY = chr(0xAD)
# Blockpfeile in den Randspuren
PS, PH, PL = 1.9, 2.75, 4.0      # halbe Schaftbreite, halbe Kopfbreite, Kopflänge
XL_C, XR_C = 3.05, W - 3.05      # Mittellinien der Blockpfeile
# Inhalt
XC0, XC1 = 6.6, W - 6.6
STAPEL = 1.4                     # Versatz je dahinterliegender Tafel (nach rechts oben)
FX0 = 6.8                        # linke Kante der vorderen Tafeln
FX1 = XC1 - 2 * STAPEL           # rechte Kante der vorderen Tafeln
KS = 6.5                         # Schriftgrad der Planungskästen
INS = (0.6, 0.5)


def build(theme):
    t = theme
    lw = t.arrow_lw
    # ---- Geometrie ----
    y0 = 0.3
    TOP_H = 8.0
    yM = y0 + TOP_H + 6.3 + 2 * STAPEL       # Oberkante vordere Tafel „konzentriert“
    yb1 = yM + 2.2                           # Sammelleitung Zentrale ↔ konzentriert
    yK = yM + 4.4
    KH = 7.0
    yM1 = yK + KH + 2.4                      # Unterkante vordere Tafel „konzentriert“
    yD = yM1 + 4.5 + 2 * STAPEL              # Oberkante vordere Tafel „dezentral“
    yb2 = yD + 2.2
    yDk = yD + 4.4
    DH = 7.0
    yD1 = yDk + DH + 2.2
    H = round(yD1 + 0.3, 1)
    f = Fig(W, H, theme, STEM)

    # ---- Blockpfeile Top-Down (links, nach unten) und Bottom-Up (rechts, nach oben) ----
    hi = t.role("box_hi")
    ya, yz = y0, H - 0.3
    c = XL_C
    f.poly([(c - PS, ya), (c + PS, ya), (c + PS, yz - PL), (c + PH, yz - PL), (c, yz), (c - PH, yz - PL),
            (c - PS, yz - PL)], fill=hi.fill, line=hi.line, lw=hi.lw, name="Blockpfeil Top-Down")
    c = XR_C
    f.poly([(c - PS, yz), (c + PS, yz), (c + PS, ya + PL), (c + PH, ya + PL), (c, ya), (c - PH, ya + PL),
            (c - PS, ya + PL)], fill=hi.fill, line=hi.line, lw=hi.lw, name="Blockpfeil Bottom-Up")
    lab_h = 22.0
    ym = (ya + yz) / 2
    f.text(XL_C - PS, ym - lab_h / 2, 2 * PS, lab_h, [P("Top-Down", bold=True)], align="c", anchor="m",
           rot=270, bg=hi.fill, name="Top-Down")
    f.text(XR_C - PS, ym - lab_h / 2, 2 * PS, lab_h, [P("Bottom-Up", bold=True)], align="c", anchor="m",
           rot=90, bg=hi.fill, name="Bottom-Up")

    # ---- Gestapelte Tafeln (hinten zuerst) ----
    def stapel(ya_, yb_, name):
        for k in (2, 1):
            d = k * STAPEL
            f.box(FX0 + d, ya_ - d, FX1 - FX0, yb_ - ya_, None, role="box_plain", rounded=False,
                  name=f"{name} Tafel hinten {k}")
        f.box(FX0, ya_, FX1 - FX0, yb_ - ya_, None, role="box_plain", rounded=False, name=f"{name} Tafel vorn")

    stapel(yM, yM1, "Konzentriert")
    stapel(yD, yD1, "Dezentral")

    # ---- Oberste Ebene: Zentrale Planung ↔ Vorstand ----
    ZX, ZW = 8.5, 42.0
    VX = XC1 - 2.9 - ZW
    f.box(ZX, y0, ZW, TOP_H, [P("Zentrale Planung", bold=True), P("(Controlling)", bold=True)], role="box",
          name="Zentrale Planung")
    f.box(VX, y0, ZW, TOP_H, [P("Vorstand", bold=True)], role="box", name="Vorstand")
    f.arrow([(ZX + ZW + 0.6, y0 + TOP_H / 2), (VX - 0.6, y0 + TOP_H / 2)], head=True, name="Zentrale ↔ Vorstand")

    # ---- Konzentrierte Planung ----
    KW = 27.2
    kgap = (FX1 - FX0 - 2 * 2.5 - 3 * KW) / 2
    kx = [FX0 + 2.5 + i * (KW + kgap) for i in range(3)]
    kc = [x + KW / 2 for x in kx]
    ktxt = [[P("Konzentrierte Planung", size=KS), P("(Hauptbereichsleiter)", size=KS)],
            [P("Konzentrierte Planung", size=KS)], [P("Konzentrierte Planung", size=KS)]]
    # Sammelleitung Zentrale ↔ konzentrierte Planungen
    zx = ZX + ZW / 2
    f.line([(kc[0], yb1), (kc[-1], yb1)], color=t.arrow, lw=lw, name="Sammelleitung Zentrale")
    f.arrow([(zx, yb1), (zx, y0 + TOP_H)], name="nach oben in Zentrale")
    for i, x in enumerate(kc):
        f.arrow([(x, yb1), (x, yK)], name=f"nach unten in Konzentriert {i + 1}")
    for i, (x, tx) in enumerate(zip(kx, ktxt)):
        f.box(x, yK, KW, KH, tx, role="box", ins=INS, name=f"Konzentrierte Planung {i + 1}")

    # Gegenstromverfahren (Schlüsselbegriff, rot)
    gy = y0 + TOP_H + 1.0
    f.text(zx + 6.0, gy, 52.0, 4.0, [P("Gegenstromverfahren", size="head", bold=True, color=t.accent)],
           align="c", anchor="m", name="Gegenstromverfahren")

    # ---- Dezentrale Planung ----
    DW, DP = 25.5, 8.0
    dgap = (FX1 - FX0 - 2 * 1.8 - 3 * DW - DP) / 3
    dx, x = [], FX0 + 1.8
    for w_ in (DW, DW, DP, DW):
        dx.append((x, w_))
        x += w_ + dgap
    dtxt = [[P("Dezentrale Planung", size=KS), P("(Niederlassungsleiter)", size=KS)],
            [P("Dezentrale Planung", size=KS)], [P("…", size=KS, bold=True)], [P("Dezentrale Planung", size=KS)]]
    dc = [x_ + w_ / 2 for x_, w_ in dx]
    # Sammelleitung Hauptbereichsleiter ↔ dezentrale Planungen (Ein- und Ausgang rechts der Mitte)
    k1x = kx[0] + KW * 0.72
    f.line([(dc[0], yb2), (dc[-1], yb2)], color=t.arrow, lw=lw, name="Sammelleitung Hauptbereich")
    f.arrow([(k1x, yb2), (k1x, yK + KH)], name="nach oben in Konzentriert 1")
    for i, x_ in enumerate(dc):
        f.arrow([(x_, yb2), (x_, yDk)], name=f"nach unten in Dezentral {i + 1}")
    for i, ((x_, w_), tx) in enumerate(zip(dx, dtxt)):
        f.box(x_, yDk, w_, DH, tx, role="box", ins=INS, name=f"Dezentrale Planung {i + 1}")

    # Gestrichelt: aus den dahinterliegenden Tafeln an die übrigen konzentrierten Planungen
    for k, i in ((1, 1), (2, 2)):
        f.arrow([(kc[i], yD - k * STAPEL), (kc[i], yK + KH)], role="info", dash="sysDash",
                name=f"Rückmeldung Tafel {k} → Konzentriert {i + 1}")
    return f
