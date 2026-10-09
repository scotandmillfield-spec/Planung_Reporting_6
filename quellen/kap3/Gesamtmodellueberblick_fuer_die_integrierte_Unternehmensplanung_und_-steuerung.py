"""Abb. 3.1 – Gesamtmodellüberblick für die integrierte Unternehmensplanung und -steuerung (Querformat, ganzseitig)."""
# Muster: Anordnung des Originals in vier Spalten – links die drei Planungsebenen (mit Doppelpfeilen),
# Mitte Roadmap, Strategische Planung (Portfolio) und das Modell der Teilpläne, rechts Zielvereinbarungen und
# Balanced Chance and Risk Card. Die Screenshots des Originals (Roadmap, BCR-Card) sind als Karten mit ihrem
# Inhalt ersetzt, das Portfolio als schematische Matrix.
# Revision DS 07.10.2026: Strategische Planung oben links; Roadmap und BCR-Card auf Höhe der Verzahnung, beide rot;
# Revision DS 08.10.2026: Strategische Planung (links) länger, Kartentexte kleiner (5,4 pt), Spiegelstrich Zielerreichung
# (Roadmap), Simulative Planung länger, Instrumente mittiger.
# neue Kartentexte; externes Reporting entfällt; Zielvereinbarungen tiefer; Teilpläne wie Abb. 3.6 (ohne Knotenpunkte).
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
XD = 119.5                         # Zielvereinbarungen, BCR-Card
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

    def label(x, y, w, h, s, align="l", anchor="b", name=None):
        f.text(x, y, w, h, [P(s, size=LBL, italic=True)], align=align, anchor=anchor, name=name or s[:30])

    # ------------------------------------------------------------ Planungsebenen (links)
    def ebene(y, h, titel, zusatz=None):
        paras = [P(titel, bold=True)]
        if zusatz:
            paras.append(P(zusatz, size="small", color=t.text_muted, space_before=1.5))
        f.box(XA, y, WA, h, paras, role="box_hi", anchor="m", name=f"Ebene {titel[:20]}")
        return B(XA, y, WA, h)

    # Kartentexte (Revision DS 07.10.2026), Höhe der mittleren Reihe aus dem Inhalt
    KS = 5.4                                                 # Schrift der Kartentexte (Revision DS 08.10.2026)
    RM_inhalt = [P("Strategische Projekte mit", size=KS),
                 P("Status", size=KS, bullet="–"), P("Zeitplan", size=KS, bullet="–"),
                 P("Kennzahlen", size=KS, bullet="–"), P("Zielerreichung", size=KS, bullet="–")]
    BCR_inhalt = [P("Strategischem Ziel je Perspektive:", size=KS),
                  P("Kennzahlen", size=KS, bullet="–"), P("Strategische Projekte", size=KS, bullet="–"),
                  P("Chancen", size=KS, bullet="–"), P("Risiken", size=KS, bullet="–")]
    YV = 28.0                                                # mittlere Reihe: Verzahnung, Roadmap, BCR-Card
    kh_bcr = max(5.0, f.measure([Para("Balanced Chance and Risk Card", size="head", bold=True)], WD,
                                ins=(1.6, 0.5)))
    HV = max(22.0, kh_bcr + f.measure(BCR_inhalt, WD, ins=(1.6, 1.0)) + 0.4)

    L1 = ebene(0.3, 22.0, "Strategische Planung", f"(Vision, strategische Analyse, Grund{SHY}strategien u.{NB}a.)")
    L2 = ebene(YV, HV, f"Verzahnung strategischer und operativ-taktischer Planung")
    L3 = ebene(64.0, 32.7, "Simulative Planung", "(operative, taktische und Forecast-Planung)")
    for o, u in ((L1, L2), (L2, L3)):
        A([(o.cx, o.b), (o.cx, u.y)], head=True, tail=True, name="Ebenen wechselseitig")

    # ------------------------------------------------------------ Instrumente (oben)
    f.text(W / 2 - 45.0, 0.3, 90.0, 6.4,
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
    RM, _ = karte(f, XB, YV, WB, HV, "Roadmap", RM_inhalt, kopf="box_strong")

    # ------------------------------------------------------------ rechte Spalte
    ZV = B(XD, 9.0, WD, 6.0)                                 # tiefer gesetzt (Revision DS 07.10.2026)
    f.box(ZV.x, ZV.y, ZV.w, ZV.h, [P("Zielvereinbarungen", bold=True)], name="Zielvereinbarungen")
    BCR, _ = karte(f, XD, YV, WD, HV, "Balanced Chance and Risk Card", BCR_inhalt, kopf="box_strong")
    A([(BCR.cx, ZV.b), (BCR.cx, BCR.y)], head=True, tail=True, name="Zielvereinbarungen–BCR")

    # ------------------------------------------------------------ Teilpläne (simulative Planung)
    # Struktur wie Abb. 3.6: links Absatz- bis Kostenplan, Ergebnisplan in der Mitte, Bilanzplan rechts
    f.INS_X, f.INS_Y = 0.6, 0.4
    BW, BH, GAP, DY = 17.6, 4.2, 3.2, 1.0
    xl = XC + 2.5
    WE, WBI = 14.6, 12.4
    xe_ = xl + BW + 3.5
    xb_ = xe_ + WE + 2.5
    MD = B(XC, RM.b + 3.0, xb_ + WBI + 1.5 - XC, 2.0 + 5 * BH + 4 * GAP + 2.0)
    f.box(MD.x, MD.y, MD.w, MD.h, None, role="container", name="Teilpläne")
    links = {}
    y = MD.y + 2.0
    for n in ("Absatzplan", "Umsatzplan", "Ressourcenplan", "Personalplan", "Kostenplan"):
        f.box(xl, y, BW, BH, [P(n, size=MOD)], name=n)
        links[n] = B(xl, y, BW, BH)
        y += BH + GAP
    AP, U, R, PE, K = (links[n] for n in ("Absatzplan", "Umsatzplan", "Ressourcenplan", "Personalplan",
                                          "Kostenplan"))
    E = B(xe_, U.y, WE, BH)
    BI = B(xb_, R.y + DY, WBI, BH)
    f.box(E.x, E.y, E.w, E.h, [P("Ergebnisplan", size=MOD)], name="Ergebnisplan")
    f.box(BI.x, BI.y, BI.w, BI.h, [P("Bilanzplan", size=MOD)], name="Bilanzplan")
    for o, u in ((AP, U), (R, PE), (PE, K)):
        A([(o.cx, o.b), (o.cx, u.y)], head=True, tail=True, size="sm", name="Teilpläne wechselseitig")
    xg = XC + 1.2                                            # Absatz -> Ressourcen (links herum)
    A([(AP.x, AP.cy), (xg, AP.cy), (xg, R.cy), (R.x, R.cy)], size="sm", name="Absatz–Ressourcen")
    A([(U.r, U.cy), (E.x, E.cy)], size="sm", name="Umsatz–Ergebnis")
    A([(R.r, R.cy - DY), (E.cx - 3.0, R.cy - DY), (E.cx - 3.0, E.b)], size="sm", name="Ressourcen–Ergebnis")
    A([(R.r, R.cy + DY), (BI.x, BI.cy)], size="sm", name="Ressourcen–Bilanz")
    A([(K.r, K.cy), (E.cx + 3.0, K.cy), (E.cx + 3.0, E.b)], size="sm", name="Kosten–Ergebnis")
    A([(E.r, E.cy), (BI.cx, E.cy), (BI.cx, BI.y)], size="sm", name="Ergebnis–Bilanz")

    # ------------------------------------------------------------ Verbindungen zwischen den Elementen
    # Strategische Planung -> Roadmap
    xp, yp = 41.0, 20.0
    A([(SP.x, yp), (xp, yp), (xp, RM.y)], name="Strategische Projekte")
    label(xp + 0.6, 13.6, SP.x - xp - 1.0, 6.0, "Strategische\nProjekte", anchor="b")
    # BCR-Card -> Strategische Planung (Forecast) und Strategische Planung -> BCR-Card (Vorgaben)
    yf, yz = YV + 3.0, YV + 7.0
    A([(BCR.x, yf), (SP.r, yf)], name="BCR-Card-Forecast")
    label(SP.r + 2.4, yf - 6.2, BCR.x - SP.r - 2.8, 6.0, "BCR-Card-\nForecast", anchor="b")
    A([(SP.r, yz), (BCR.x, yz)], name="Strategische Ziele")
    label(SP.r + 1.0, yz + 0.5, BCR.x - SP.r - 1.4, 12.0,
          "Strategische\nZiele/Projekte\nsowie Vorgaben\nfür Kennzahlen", anchor="t")
    # Roadmap <-> BCR-Card
    yr = RM.b - 3.0
    A([(RM.r, yr), (BCR.x, yr)], head=True, tail=True, name="Roadmap–BCR")
    # Roadmap -> Teilpläne (operative Einlastung)
    xe, ye = 36.0, MD.b - 6.0
    A([(xe, RM.b), (xe, ye), (MD.x, ye)], name="Operative Einlastung")
    label(xe + 0.6, ye - 18.0, MD.x - xe - 1.0, 17.5, "operative\nEinlastung\nstrategischer\nProjekte", anchor="b")
    # BCR-Card -> Teilpläne (Vorgabe), Teilpläne -> BCR-Card (Gesamtplanung)
    xv, yv = XD + 4.0, MD.y + 5.0
    A([(xv, BCR.b), (xv, yv), (MD.r, yv)], name="BCR-Vorgabe")
    label(xv + 1.0, BCR.b + 0.5, 17.0, yv - BCR.b - 1.0, "BCR-Vorgabe", anchor="b")
    xg2, yg = XD + 22.0, MD.b - 3.0
    A([(MD.r, yg), (xg2, yg), (xg2, BCR.b)], name="Gesamtplanung")
    label(MD.r + 1.0, yg - 6.4, xg2 - MD.r - 1.4, 6.2, "Gesamtplanung\nbis zum BCR-Plan", anchor="b")
    return f
