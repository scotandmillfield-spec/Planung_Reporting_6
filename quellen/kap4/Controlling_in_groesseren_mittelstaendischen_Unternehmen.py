"""Abb. 4.7 – Controlling in größeren (mittelständischen) Unternehmen."""
# Muster: Organigramm mit zwei Gruppen (gestrichelte Container): links dezentrale Einheiten als zwei Spartenbäume
# (Stamm unter dem Spartenkasten, eingerückte Funktionen), rechts die zentralen Einheiten als Stapel. Geschäfts-
# führung/Vorstand oben, Verbindung zu beiden Gruppen über die Lücke zwischen ihnen. Controlling rot (im Original blau).
STEM = "Controlling_in_groesseren_mittelstaendischen_Unternehmen"
from bookfig import Fig, P

W = 110
X0, XR = 0.3, W - 0.3
DOTS = "…"
PAD = 2.5                      # Innenabstand der Container
RH, RG = 5.4, 1.8              # Zeilenhöhe und -abstand (gemeinsames Raster links und rechts)
EIN = 4.0                      # Einzug der Funktionen unter der Sparte
SW = 21.0                      # Breite einer Spartenspalte (Spartenkasten)
GS = 7.0                       # Lücke zwischen den Spartenspalten („…“)
ZW = 34.0                      # Breite der zentralen Einheiten
GFW, GFH = 31.0, 8.0           # Geschäftsführung/Vorstand
TITEL_H = 5.0                  # Titelzeile der Container

SPARTEN = ["Sparte 1", "Sparte n"]
DEZENTRAL = ["Vertrieb", "Produktion", "Einkauf", "Controlling", DOTS]
ZENTRAL = ["Controlling", "Rechnungswesen/Finanzen", "Einkauf", "Personal", "IT", DOTS]


def rolle(name):
    return "box_strong" if name == "Controlling" else "box"


def build(theme):
    t = theme
    lw = t.arrow_lw
    # Geometrie
    xL0 = X0
    xT = [xL0 + PAD, xL0 + PAD + SW + GS]                 # linke Kanten der Spartenspalten
    xL1 = xT[1] + SW + PAD                                # rechte Kante „Dezentrale Einheiten“
    xR0 = XR - PAD - ZW - PAD                             # linke Kante „Zentrale Einheiten“
    yC = 0.3 + GFH + 4.0                                  # Oberkante der Container
    yr = [yC + TITEL_H + i * (RH + RG) for i in range(6)] # Zeilen
    yC1 = yr[-1] + RH + PAD                               # Unterkante der Container
    H = round(yC1 + 0.3, 1)
    f = Fig(W, H, theme, STEM)

    def L(pts, name):
        f.line(pts, color=t.arrow, lw=lw, name=name)

    # Geschäftsführung und Verbindung zu beiden Gruppen
    gx = (xL1 + xR0) / 2
    yv = (yC + yC1) / 2
    L([(gx, 0.3 + GFH), (gx, yv)], "Linie Geschäftsführung")
    L([(xL1, yv), (xR0, yv)], "Verbindung der Gruppen")
    f.box(gx - GFW / 2, 0.3, GFW, GFH, [P("Geschäftsführung/", bold=True), P("Vorstand", bold=True)],
          name="Geschäftsführung/Vorstand")

    # Gruppen
    for x0, x1, titel in ((xL0, xL1, "Dezentrale Einheiten"), (xR0, XR, "Zentrale Einheiten")):
        f.box(x0, yC, x1 - x0, yC1 - yC, None, role="container", name=f"Gruppe {titel}")
        f.text(x0, yC + 0.6, x1 - x0, TITEL_H - 1.0, [P(titel, bold=True)], align="c", anchor="m",
               name=f"Titel {titel}")

    # Dezentrale Einheiten: zwei Spartenbäume
    for xs, sparte in zip(xT, SPARTEN):
        xst = xs + EIN / 2                                 # Stamm
        L([(xst, yr[0] + RH), (xst, yr[-1] + RH / 2)], f"Stamm {sparte}")
        for y, fk in zip(yr[1:], DEZENTRAL):
            L([(xst, y + RH / 2), (xs + EIN, y + RH / 2)], f"Abzweig {sparte} {fk}")
        f.box(xs, yr[0], SW, RH, [P(sparte, bold=True, align="l")], align="l", name=sparte)
        for y, fk in zip(yr[1:], DEZENTRAL):
            f.box(xs + EIN, y, SW - EIN, RH, [P(fk, align="l")], role=rolle(fk), align="l",
                  name=f"{sparte} {fk}")
    f.text(xT[0] + SW, yr[0], GS, RH, [P(DOTS, bold=True)], align="c", anchor="m", name="weitere Sparten")

    # Zentrale Einheiten
    for y, ze in zip(yr, ZENTRAL):
        f.box(xR0 + PAD, y, ZW, RH, [P(ze, align="l")], role=rolle(ze), align="l", name=f"Zentral {ze}")
    return f
