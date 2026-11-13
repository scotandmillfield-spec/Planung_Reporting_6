"""Abb. 5.8 – Horizontale und vertikale Integration von Informationssystemen (in Anlehnung an Hansen 2019, S. 9)."""
# Muster: Pyramide wie Abb. 5.7 (Ebenen als Flächen mit Abstand, Elemente als Boxen), Systemklassen als
# Beschriftungen links und rechts neben den Ebenen, beide Integrationsrichtungen als beschriftete Achsen
# (unten waagerecht, rechts senkrecht). Hellblaue Fläche → Grau, weiße Kästen → box.
STEM = "Horizontale_und_vertikale_Integration_von_Informationssystemen"
from bookfig import Fig, P, text_width_mm as tw

W = 110
SZ = 7.0
SHY = chr(0xAD)
INS = (0.6, 0.5)
LH = SZ * 1.18 * 25.4 / 72
BH2 = 2 * LH + 2 * INS[1] + 0.2            # zweizeilige Box
GX = 1.6


def build(theme):
    t = theme
    band = t.role("band").fill
    pc, s = 54.0, 0.639                        # Spitze (x), Breitenzunahme je Seite und mm
    yt = 0.5                                   # Spitze (y)
    HP = 72.0                                  # Höhe der Pyramide
    yb = yt + HP
    hw = lambda y: s * (y - yt)
    hB = 1.0 + BH2 + 1.4 + BH2 + 1.0           # untere Ebene (zwei Reihen)
    hM = 1.0 + BH2 + 1.0                       # mittlere Ebene
    yB0 = yb - hB
    yM1 = yB0 - 1.2
    yM0 = yM1 - hM
    yT1 = yM0 - 1.2                            # Unterkante der Spitze
    H = round(yb + 6.4, 1)

    f = Fig(W, H, theme, STEM)
    A = f.arrow

    def flaeche(y0, y1, name):
        if y0 <= yt:
            pts = [(pc, yt), (pc + hw(y1), y1), (pc - hw(y1), y1)]
        else:
            pts = [(pc - hw(y0), y0), (pc + hw(y0), y0), (pc + hw(y1), y1), (pc - hw(y1), y1)]
        f.poly(pts, closed=True, fill=band, name=name)

    def reihe(y, texte, w):
        total = len(texte) * w + (len(texte) - 1) * GX
        if total > 2 * hw(y) - 2.0:
            f.warnings.append(f"[Reihe {texte[0]}] zu breit ({total:.1f} > {2 * hw(y) - 2.0:.1f} mm)")
        x = pc - total / 2
        for s_ in texte:
            f.box(x, y, w, BH2, [P(s_, size=SZ)], ins=INS, name=s_.replace("\n", " "))
            x += w + GX

    def bw(texte):
        return max(max(tw(z, SZ) for z in s_.split("\n")) for s_ in texte) + 2 * INS[0] + 0.9

    # ------------------------------------------------------------ Ebenen
    flaeche(yt, yT1, "Spitze Managementunterstützungssysteme")
    flaeche(yM0, yM1, "Ebene Büroinformationssysteme")
    flaeche(yB0, yb, "Ebene ERP-Systeme")

    # Spitze: Texte wie im Original ohne Kästen
    def zeilen(y, zs, name):
        h = len(zs) * LH + 0.2
        f.text(pc - 20.0, y, 40.0, h, [P(z, size=SZ) for z in zs], align="c", bg=band, name=name)
        for i, z in enumerate(zs):                 # jede Zeile muss in die Spitze passen
            if tw(z, SZ) > 2 * hw(y + i * LH) - 1.0:
                f.warnings.append(f"[{name}] Zeile zu breit für die Spitze: {z}")
        return y + h
    zeilen(yt + 6.4, ["MUS", "auf", "strategischer", "Ebene"], "MUS strategisch")
    zeilen(yt + 22.6, ["MUS auf operativer und", "taktischer Ebene"], "MUS operativ und taktisch")
    zeilen(yt + 34.6, ["Abfrage- und Berichtssysteme"], "Abfrage- und Berichtssysteme")

    mitte = ["Individuelle\nUnterstützung", "Gruppen-\nunterstützung", "Vorgangs-\nbearbeitung"]
    reihe(yM0 + 1.0, mitte, bw(mitte))
    r1 = ["Finanz- &\nRechnungswesen", "Personal-\nwirtschaft", "Anlagen-\nwirtschaft"]
    r2 = ["Forschung &\nEntwicklung", "Material-\nwirtschaft", "Produktion", "Vertrieb &\nMarketing"]
    reihe(yB0 + 1.0, r1, bw(r1))
    reihe(yB0 + 1.0 + BH2 + 1.4, r2, bw(r2))

    # ------------------------------------------------------------ Systemklassen neben der Pyramide
    def links(y, zs, name):
        h = len(zs) * LH + 0.2
        xr = pc - hw(y + h) - 1.4                  # rechte Kante: links der Flanke an der Unterkante des Texts
        w_ = max(tw(z, SZ) for z in zs) + 1.0
        if xr - w_ < 0.3:                          # zu wenig Platz: linksbündig am Rand, Flanke je Zeile prüfen
            for i, z in enumerate(zs):
                if 0.3 + tw(z, SZ) > pc - hw(y + (i + 1) * LH) - 1.0:
                    f.warnings.append(f"[{name}] Zeile berührt die Flanke: {z}")
            f.text(0.3, y, w_, h, [P(z, size=SZ) for z in zs], align="l", name=name)
        else:
            f.text(xr - w_, y, w_, h, [P(z, size=SZ) for z in zs], align="r", name=name)

    def rechts(y, zs, name):
        h = len(zs) * LH + 0.2
        xl = pc + hw(y + h) + 1.4
        w_ = max(tw(z, SZ) for z in zs) + 1.0
        if xl + w_ - 1.0 > XV - 1.6:                # Textende mit Abstand zur Achse
            f.warnings.append(f"[{name}] reicht an die Achse")
        f.text(xl, y, w_, h, [P(z, size=SZ) for z in zs], align="l", name=name)

    XV = W - 2.2                                   # Achse vertikale Integration
    links(yt + 10.4, ["Planungs- und", "Kontrollsysteme"], "Planungs- und Kontrollsysteme")
    links(yM0 + 2.4, ["Administrations-", "und Dispositions-", "systeme"], "Administrations- und Dispositionssysteme")
    rechts(yt + 8.6, ["Management-", "unterstützungs-", "systeme (MUS)"], "Managementunterstützungssysteme")
    rechts(yM0 + 0.2, ["Büro-", "informations-", "systeme"], "Büroinformationssysteme")
    rechts(yB0 + 3.2, ["ERP-", "Systeme"], "ERP-Systeme")

    # ------------------------------------------------------------ Achsen
    ya = yb + 3.6
    x0, x1 = pc - hw(yb), pc + hw(yb)
    gw = tw("Horizontale Integration", SZ, True) + 3.0
    A([(pc - gw / 2, ya), (x0, ya)], name="Horizontale Integration links")
    A([(pc + gw / 2, ya), (x1, ya)], name="Horizontale Integration rechts")
    f.text(pc - gw / 2, ya - 1.6, gw, 3.2, [P("Horizontale Integration", size=SZ, bold=True)], align="c",
           anchor="m", name="Achse horizontale Integration")
    lg = tw("Vertikale Integration", SZ, True) + 3.0
    ym = (yt + yb) / 2
    A([(XV, ym - lg / 2), (XV, yt)], name="Vertikale Integration oben")
    A([(XV, ym + lg / 2), (XV, yb)], name="Vertikale Integration unten")
    f.text(XV - 1.6, ym - lg / 2, 3.2, lg, [P("Vertikale Integration", size=SZ, bold=True)], align="c",
           anchor="m", rot=270, name="Achse vertikale Integration")
    return f
