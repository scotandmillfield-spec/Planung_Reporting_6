"""Abb. 3.1 – Gesamtmodellüberblick für die integrierte Unternehmensplanung und -steuerung (Querformat, ganzseitig)."""
# Muster: Anordnung des Originals in vier Spalten – links die drei Planungsebenen (mit Doppelpfeilen),
# Mitte Roadmap, Strategische Planung (Portfolio) und das Modell der Teilpläne, rechts Zielvereinbarungen,
# Balanced Chance and Risk Card (internes Reporting) und externes Reporting. Die Screenshots des Originals
# (Roadmap, BCR-Card) sind als Karten mit ihrem Inhalt ersetzt, das Portfolio als schematische Matrix.
# Teilpläne: Umsatz- und Ressourcenplan speisen gebündelt Ergebnis- und Bilanzplan (Sammelleitung).
STEM = "Gesamtmodellueberblick_fuer_die_integrierte_Unternehmensplanung_und_-steuerung"
from bookfig import Fig, P, Para, MM, MSO_SHAPE, Emu

W, H = 155, 97.0
SHY = chr(0xAD)
NB = chr(0xA0)
LBL = 6.5            # Pfeilbeschriftungen (kursiv)
MOD = 6.0            # Teilpläne (dichtes Netz)

# Spalten
XA, WA = 0.3, 23.0                 # Planungsebenen
XB, WB = 26.0, 31.0                # Roadmap
XC, WC = 60.0, 40.0                # Strategische Planung, Teilpläne
XD = 119.5                         # Zielvereinbarungen, BCR-Card, externes Reporting
WD = W - 0.3 - XD


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


def karte(f, x, y, w, h, titel, inhalt=None, kopf="header", size="head", anchor="t"):
    """Karte mit Kopfleiste; kopf="box_strong" für das Schlüsselelement. Kopfhöhe aus dem Titel."""
    t = f.t
    kp = [Para(titel, size=size, bold=True)]
    kh = max(5.0, f.measure(kp, w, ins=(1.6, 0.5)))
    f.box(x, y, w, h, None, role="box", name=f"Karte {titel}")
    hr = t.role(kopf)
    s = f.sh.add_shape(MSO_SHAPE.ROUND_2_SAME_RECTANGLE, Emu(round(x * MM)), Emu(round(y * MM)),
                       Emu(round(w * MM)), Emu(round(kh * MM)))
    f._strip_style(s)
    s.adjustments[0] = t.role("box").radius / kh
    s.adjustments[1] = 0.0
    f._apply_role(s, hr)
    s.name = f"Kopf {titel}"
    f._fill_text(s, kp, w, kh, hr.text, "l", "m", (1.6, 0.5), label=titel, bg=hr.fill)
    if inhalt:
        f.text(x, y + kh, w, h - kh, inhalt, align="l", anchor=anchor, ins=(1.6, 1.0),
               bg=t.role("box").fill, name=f"Inhalt {titel}")
    return B(x, y, w, h), y + kh


def build(theme):
    f = Fig(W, H, theme, STEM)
    t = theme
    A = f.arrow

    def dot(x, y):
        f.ellipse(x - 0.45, y - 0.45, 0.9, 0.9, fill=t.arrow, line="none", name="Knoten")

    def label(x, y, w, h, s, align="l", anchor="b", name=None):
        f.text(x, y, w, h, [P(s, size=LBL, italic=True)], align=align, anchor=anchor, name=name or s[:30])

    # ------------------------------------------------------------ Planungsebenen (links)
    def ebene(y, h, titel, zusatz=None):
        paras = [P(titel, bold=True)]
        if zusatz:
            paras.append(P(zusatz, size="small", color=t.text_muted, space_before=1.5))
        f.box(XA, y, WA, h, paras, role="box_hi", anchor="m", name=f"Ebene {titel[:20]}")
        return B(XA, y, WA, h)

    L1 = ebene(6.0, 16.0, "Strategische Planung", f"(Vision, strategische Analyse, Grund{SHY}strategien u.{NB}a.)")
    L2 = ebene(28.0, 22.0, f"Verzahnung strategischer und operativ-taktischer Planung")
    L3 = ebene(64.0, 20.0, "Simulative Planung", "(operative, taktische und Forecast-Planung)")
    for o, u in ((L1, L2), (L2, L3)):
        A([(o.cx, o.b), (o.cx, u.y)], head=True, tail=True, name="Ebenen wechselseitig")

    # ------------------------------------------------------------ Instrumente (oben)
    f.text(XB, 0.3, XD - 3.0 - XB, 6.4,
           [P("Instrumente u." + NB + "a.", size=6.5, bold=True),
            P(f"Umwelt-, Umfeld-, Markt- und Wettbewerbs{SHY}analysen, SWOT, Portfolioanalyse", size=6.5)],
           align="c", anchor="t", name="Instrumente")

    # ------------------------------------------------------------ Strategische Planung (Portfolio)
    SP, yb = karte(f, XC, 9.0, WC, 35.0, "Strategische Planung")
    mx, my, cw, ch = XC + 9.6, yb + 4.0, 9.6, 5.8           # Matrix 3 x 3
    mr, mb = mx + 3 * cw, my + 3 * ch
    bg = t.role("box").fill
    f.text(XC + 1.0, yb + 0.9, 30.0, 2.8, [P("Marktattraktivität", size="small", bold=True)],
           anchor="t", bg=bg, name="Achse Marktattraktivität")
    for i, s in enumerate(("Chance", "neutral", "Risiko")):
        f.text(XC + 0.3, my + i * ch, mx - XC - 0.8, ch, [P(s, size="small")], align="r", anchor="m",
               bg=bg, name=f"Zeile {s}")
    # Zonen: oberhalb der Diagonale Chancen (dunkler), unterhalb Risiken (weiß)
    f.poly([(mx, my), (mr, my), (mr, mb)], closed=True, fill=t.role("box_hi").fill, line=None, name="Zone Chancen")
    f.poly([(mx, my), (mx, mb), (mr, mb)], closed=True, fill="FFFFFF", line=None, name="Zone Risiken")
    for k in range(4):
        f.line([(mx + k * cw, my), (mx + k * cw, mb)], color="8A8A8A", lw=0.5, name="Raster")
        f.line([(mx, my + k * ch), (mr, my + k * ch)], color="8A8A8A", lw=0.5, name="Raster")
    f.line([(mx, my), (mr, mb)], color=t.arrow, lw=0.6, dash="sysDash", name="Diagonale")
    f.text(mx + 2 * cw, my, cw, ch, [P("Chancen", size="small")], align="c", anchor="m",
           bg=t.role("box_hi").fill, name="Chancen")
    f.text(mx, my + 2 * ch, cw, ch, [P("Risiken", size="small")], align="c", anchor="m",
           bg="FFFFFF", name="Risiken")
    for i, s in enumerate(("schwach", "neutral", "stark")):
        f.text(mx + i * cw - 1.0, mb + 0.3, cw + 2.0, 2.6, [P(s, size="small")], align="c", anchor="t",
               bg=bg, name=f"Spalte {s}")
    f.text(mx - 4.0, mb + 2.9, 3 * cw + 8.0, 2.8, [P("Relative Wettbewerbsposition", size="small", bold=True)],
           align="c", anchor="t", bg=bg, name="Achse Wettbewerbsposition")

    # ------------------------------------------------------------ Roadmap
    RM, _ = karte(f, XB, 28.0, WB, 22.0, "Roadmap",
                  [P("Strategische Projekte mit Status", size=6.5, bullet="•"),
                   P("Zeitplan: Planung, Umsetzung, Durchführung", size=6.5, bullet="•")])

    # ------------------------------------------------------------ rechte Spalte
    ZV = B(XD, 0.6, WD, 6.0)
    f.box(ZV.x, ZV.y, ZV.w, ZV.h, [P("Zielvereinbarungen", bold=True)], name="Zielvereinbarungen")
    BCR, _ = karte(f, XD, 15.5, WD, 35.5, "Balanced Chance and Risk Card",
                   [P("Internes Reporting (Kennzahlen und Berichte)", size=6.5, bold=True),
                    P("Strategische Ziele und Kennzahlen je Perspektive", size=6.5, bullet="•", space_before=2),
                    P("Vorjahr, Forecast und Plan", size=6.5, bullet="•"),
                    P("Strategische Projekte", size=6.5, bullet="•"),
                    P("Chancen und Risiken mit Bewertung", size=6.5, bullet="•")],
                   kopf="box_strong")
    A([(BCR.cx, ZV.b), (BCR.cx, BCR.y)], head=True, tail=True, name="Zielvereinbarungen–BCR")
    ER_paras = [P("Externes Reporting", bold=True, align="l"),
                P("Jahresabschluss", size=6.5, bullet="•"), P("Bankenreporting", size=6.5, bullet="•"),
                P("Rating", size=6.5, bullet="•")]
    ex = 130.5
    ER = B(ex, 63.0, W - 0.3 - ex, f.measure(ER_paras, W - 0.3 - ex) + 0.6)
    f.box(ER.x, ER.y, ER.w, ER.h, ER_paras, align="l", anchor="m", name="Externes Reporting")
    A([(ER.cx, BCR.b), (ER.cx, ER.y)], head=True, tail=True, name="Internes–Externes Reporting")

    # ------------------------------------------------------------ Teilpläne (simulative Planung)
    f.INS_X, f.INS_Y = 0.6, 0.4
    BW, BH, GAP = 17.6, 4.2, 3.2
    xl, xr, wr = XC + 2.5, XC + 24.6, 14.6
    ap = [P("Absatz- und Produktions" + SHY + "planung", size=MOD)]
    hA = max(BH, f.measure(ap, BW))
    MD = B(XC, 54.0, WC, 2.0 + hA + 4 * (GAP + BH) + 2.0)
    f.box(MD.x, MD.y, MD.w, MD.h, None, role="container", name="Teilpläne")
    links = {}
    y = MD.y + 2.0
    for i, n in enumerate(("Absatz- und Produktionsplanung", "Umsatzplan", "Ressourcenplan", "Personalplan",
                           "Kostenplan")):
        h = hA if i == 0 else BH
        f.box(xl, y, BW, h, ap if i == 0 else [P(n, size=MOD)], name=n)
        links[n] = B(xl, y, BW, h)
        y += h + GAP
    AP, U, R, PE, K = (links[n] for n in ("Absatz- und Produktionsplanung", "Umsatzplan", "Ressourcenplan",
                                          "Personalplan", "Kostenplan"))
    E = B(xr, U.y, wr, BH)
    BI = B(xr, R.y, wr, BH)
    f.box(E.x, E.y, E.w, E.h, [P("Ergebnisplan", size=MOD)], name="Ergebnisplan")
    f.box(BI.x, BI.y, BI.w, BI.h, [P("Bilanzplan", size=MOD)], name="Bilanzplan")
    for o, u in ((AP, U), (R, PE), (PE, K)):
        A([(o.cx, o.b), (o.cx, u.y)], head=True, tail=True, size="sm", name="Teilpläne wechselseitig")
    A([(E.cx, E.b), (E.cx, BI.y)], head=True, tail=True, size="sm", name="Ergebnis–Bilanz")
    xs = (U.r + E.x) / 2                                     # Sammelleitung Umsatz/Ressourcen -> Ergebnis/Bilanz
    A([(U.r, U.cy), (E.x, E.cy)], size="sm", name="Umsatz–Ergebnis")
    A([(R.r, R.cy), (BI.x, BI.cy)], size="sm", name="Ressourcen–Bilanz")
    f.line([(xs, U.cy), (xs, R.cy)], color=t.arrow, lw=t.arrow_lw, name="Sammelleitung")
    dot(xs, U.cy)
    dot(xs, R.cy)
    A([(K.r, K.cy), (BI.cx, K.cy), (BI.cx, BI.b)], size="sm", name="Kosten–Bilanz")
    xg = XC + 1.2                                            # Absatz/Produktion -> Ressourcen (links herum)
    A([(AP.x, AP.cy), (xg, AP.cy), (xg, R.cy), (R.x, R.cy)], size="sm", name="Absatz/Produktion–Ressourcen")

    # ------------------------------------------------------------ Verbindungen zwischen den Elementen
    # Strategische Planung -> Roadmap
    xp, yp = 41.0, 20.0
    A([(SP.x, yp), (xp, yp), (xp, RM.y)], name="Strategische Projekte")
    label(xp + 0.6, 13.6, SP.x - xp - 1.0, 6.0, "Strategische\nProjekte", anchor="b")
    # BCR-Card -> Strategische Planung (Forecast) und Strategische Planung -> BCR-Card (Vorgaben)
    yf, yz = 21.0, 33.0
    A([(BCR.x, yf), (SP.r, yf)], name="BCR-Card-Forecast")
    label(SP.r + 2.4, yf - 6.2, BCR.x - SP.r - 2.8, 6.0, "BCR-Card-\nForecast", anchor="b")
    A([(SP.r, yz), (BCR.x, yz)], name="Strategische Ziele")
    label(SP.r + 1.0, yz + 0.5, BCR.x - SP.r - 1.4, 12.0,
          "Strategische\nZiele/Projekte\nsowie Vorgaben\nfür Kennzahlen", anchor="t")
    # Roadmap <-> BCR-Card
    yr = 46.5
    A([(RM.r, yr), (BCR.x, yr)], head=True, tail=True, name="Roadmap–BCR")
    # Roadmap -> Teilpläne (operative Einlastung)
    xe, ye = 36.0, 84.0
    A([(xe, RM.b), (xe, ye), (MD.x, ye)], name="Operative Einlastung")
    label(xe + 0.6, 66.0, MD.x - xe - 1.0, ye - 66.5, "operative\nEinlastung\nstrategischer\nProjekte", anchor="b")
    # BCR-Card -> Teilpläne (Vorgabe), Teilpläne -> BCR-Card (Gesamtplanung)
    xv, yv = XD + 3.0, 60.0
    A([(xv, BCR.b), (xv, yv), (MD.r, yv)], name="BCR-Vorgabe")
    label(MD.r + 2.4, yv - 3.6, xv - MD.r - 2.8, 3.4, "BCR-Vorgabe", anchor="b")
    xg2, yg = XD + 7.5, 88.0
    A([(MD.r, yg), (xg2, yg), (xg2, BCR.b)], name="Gesamtplanung")
    label(MD.r + 1.0, yg - 6.4, xg2 - MD.r - 1.4, 6.2, "Gesamtplanung\nbis zum BCR-Plan", anchor="b")
    return f
