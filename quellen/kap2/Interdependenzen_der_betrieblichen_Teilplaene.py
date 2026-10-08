"""Abb. 2.3 – Interdependenzen der betrieblichen Teilpläne (Querformat, ganzseitig)."""
# Muster: dichtes Netz in Bändern (Querformat, ganzseitig) – Gruppen als Container, Busse, Knotenpunkte, gebündelte Verbindungen.
# Bauen: python3 scripts/build_figure.py beispiele/abb_2-3.py --out <Zielordner>
STEM = "Interdependenzen_der_betrieblichen_Teilplaene"
from bookfig import Fig, P, THEMES

W, H = 155, 98
S = 6.0      # Grundschrift Boxen
T = 6.5      # Gruppentitel
SHY = chr(0xAD)  # weiches Trennzeichen


class B:
    """Box-Geometrie mit Ankerpunkten."""
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
    f = Fig(W, H, theme, "Interdependenzen_der_betrieblichen_Teilplaene")
    f.INS_X, f.INS_Y = 0.6, 0.5
    t = theme
    band_bg = t.role("band").fill or "FFFFFF"

    def paras_of(p):
        return [P(p, size=S)] if isinstance(p, str) else p

    def box(x, y, w, p, role="box", h=None, hmin=4.2, name=None):
        p = paras_of(p)
        if h is None:
            h = max(hmin, f.measure(p, w))
        f.box(x, y, w, h, p, role=role, name=name)
        return B(x, y, w, h)

    def hgt(p, w, hmin=4.2):
        return max(hmin, f.measure(paras_of(p), w))

    def group(b, title=None, name=None):
        f.box(b.x, b.y, b.w, b.h, None, role="container", name=name or title)
        if title:
            f.text(b.x, b.y + 0.2, b.w, 3.2, [P(title, size=T, bold=True)], align="c", anchor="m", bg=band_bg)

    def dot(x, y):
        f.ellipse(x - 0.45, y - 0.45, 0.9, 0.9, role="box_strong", fill=t.arrow, line="none", name="Knoten")

    A = f.arrow
    L = lambda pts: f.line(pts, color=t.arrow, lw=0.6)

    # ------------------------------------------------------------ Bänder
    yS0, yS1 = 13.6, 49.2
    yO0, yO1 = 50.6, 97.8
    f.band(0, 0, W, 12.4, "Generelle Zielplanung")
    f.band(0, yS0, W, yS1 - yS0, "Strategische Planung")
    f.band(0, yO0, W, yO1 - yO0, "Operative Planung")

    # ------------------------------------------------------------ Generelle Zielplanung
    fx, fw = 47, 61
    f.box(fx, 1.0, fw, 10.4, None, role="box", name="Unternehmensgrundsätze")
    f.text(fx, 1.1, fw, 3.0, [P("Unternehmensgrundsätze:", size=T, bold=True)], align="c", anchor="m",
           bg=t.role("box").fill or "FFFFFF")
    cw = (fw - 2 * 1.2 - 2 * 1.0) / 3
    for i, (txt, role) in enumerate([("Sozialziele", "box_plain"), ("Sachziele", "box_plain"),
                                     ("Wertziele", "box_hi")]):
        box(fx + 1.2 + i * (cw + 1.0), 4.2, cw, txt, role=role, h=3.4, hmin=3.4)
    f.text(fx, 7.8, fw, 3.4, [P("Unternehmensleitlinie/-philosophie", size=S)], align="c", anchor="m",
           bg=t.role("box").fill or "FFFFFF")
    grund_bottom = 11.4

    # ------------------------------------------------------------ Strategische Planung
    sy, sh = 21.4, 16.0
    ep = B(3, 17.8, 94, 3.6 + sh + 1.0)
    group(ep, "Erfolgspotenzialplanung")
    G = box(5, sy, 47, [P("Geschäftsfeldplanung", size=T, bold=True),
                        P("langfr. Leistungs- u. Produktprogrammplanung, langfr. Wettbewerbs-/Marktstruktur"
                          "planung, Lebenszyklusplanung, langfr. Potenzialplanung (Betriebsmittel-, "
                          "Personalplanung)", size=S)], h=sh, name="Geschäftsfeldplanung")
    U = box(54, sy, 19.5, f"Unternehmens{SHY}größen-, Kapitalstruktur-, Standort-, Rechtsstruktur{SHY}planung", h=sh)
    O = box(75.5, sy, 19.5, f"Organisations- und Kommunikations{SHY}planung, Führungs{SHY}kräfte{SHY}planung",
            h=sh)

    zg = B(100.5, 17.8, 54.0, ep.h)
    group(zg, "Ableitung strategischer Zielgrößen")
    zw = (zg.w - 3 * 1.4) / 2
    box(zg.x + 1.4, sy, zw, [P("nicht monetäre Sachziele:", size=S, bold=True),
                             P("Produktivitäts-, Bestands-, Auslastungs-, Mengen-Ziele", size=S)], h=sh)
    box(zg.x + 2.8 + zw, sy, zw, [P("monetäre Wertziele:", size=S, bold=True),
                                  P("Ergebnis-, Rentabilitäts-, Liquiditäts-, Umsatz-Ziele", size=S)],
        role="box_hi", h=sh)

    INV = box(49, ep.b + 2.6, 38.5, f"Investitions-/Desinvestitions{SHY}planung, langfr. Finanzierungsplanung",
              role="box_hi")

    # ------------------------------------------------------------ Operative Planung
    # F&E liegt wie im Original auf der Grenze strategisch/operativ
    FE = box(40, 47.4, 24.2, f"Forschungs-/Entwicklungs{SHY}planung")
    yA = 55.2                                   # Leitung Absatz -> Umsatz

    g1 = B(1.8, 57.0, 63.4, 39.6)
    group(g1, name="Mengen- und Prozesspläne")
    PP = B(3.4, 58.6, 8.6, 36.4)
    f.box(PP.x, PP.y, PP.w, PP.h, [P("Unternehmensübergreifende kurz-/mittelfristige Produktprogrammplanung",
                                     size=S)], role="box", rot=270, name="Produktprogrammplanung")
    cx0, cww = 15.2, 22.4
    chain_txt = ["Absatzplanung", f"Lagerbestands{SHY}planung", "Produktionsplanung",
                 f"Lagerbestands{SHY}planung", "Beschaffungsplanung"]
    hs = [hgt(c, cww) for c in chain_txt]
    gap = (PP.h - sum(hs)) / (len(hs) - 1)
    y = PP.y
    chain = []
    for c, h in zip(chain_txt, hs):
        strong = c == "Absatzplanung"           # Revision DS 07.10.2026: Absatzplanung rot
        chain.append(box(cx0, y, cww, [P(c, size=S, bold=strong)], role="box_strong" if strong else "box", h=h))
        y += h + gap
    for a, b_ in zip(chain, chain[1:]):
        A([(a.cx, a.b), (b_.cx, b_.y)])
    for c in chain:
        L([(PP.r, c.cy), (c.x, c.cy)])
    LOG = box(40, 63.5, 24.2, [P("Logistikplanung", size=S), P("(Lager-, Transport-, Bereitstellungsplanung)", size=S)])
    VER = box(40, LOG.b + 5.0, 24.2, "Pläne der Verwaltung und anderer unterstützender Unternehmensbereiche")

    res_txt = ["Betriebsmittelpläne", "Personalpläne", "Leistungspläne", f"Verbrauchsfaktor{SHY}pläne"]
    rh = [hgt(r_, 20.0) for r_ in res_txt]
    rgap = 2.2
    c3 = B(68.5, g1.y, 23.0, sum(rh) + rgap * 3 + 3.6)
    group(c3, name="Ressourcenpläne")
    y = c3.y + 1.8
    res = []
    for r_, h in zip(res_txt, rh):
        res.append(box(c3.x + 1.5, y, 20.0, r_, h=h))
        y += h + rgap

    mon = B(94.8, 56.6, 56.4, g1.b - 56.6)
    group(mon, name="Wertmäßige Pläne")
    kw = 14.8
    kx = [mon.x + 2.0, mon.x + 2.0 + kw + 4.5, mon.x + 2.0 + 2 * (kw + 4.5)]
    rows = [[f"Umsatz{SHY}planung", f"Ertrags{SHY}planung", f"Einzahlungs{SHY}planung"],
            [f"Betriebs{SHY}ergebnis{SHY}planung", "Plan-G+V", f"kurzfr. Finanz-/Liquiditäts{SHY}planung"],
            [f"Kosten{SHY}planung", f"Aufwands{SHY}planung", f"Auszahlungs{SHY}planung"],
            [f"Bestands-/Vermögens{SHY}planung", "Planbilanz Vermögen/Kapital", None]]
    rowh = [max(hgt(c, kw) for c in row if c) for row in rows]
    rgap_m = (mon.h - 3.2 - sum(rowh)) / 3
    M = {}
    y = mon.y + 1.6
    for ri, row in enumerate(rows):
        for ci, txt in enumerate(row):
            if txt is None:
                continue
            # Revision DS 07.10.2026: Kostenplanung grau wie Umsatzplanung, dafür Betriebsergebnisplanung rot
            strong = txt.startswith("Betriebs")
            M[(ri, ci)] = box(kx[ci], y, kw, [P(txt, size=S, bold=strong)],
                              role="box_strong" if strong else "box_hi", h=rowh[ri])
        y += rowh[ri] + rgap_m

    # ------------------------------------------------------------ Verbindungen
    A([(fx + fw / 2, grund_bottom), (fx + fw / 2, ep.y)])               # Grundsätze -> Erfolgspotenzial
    A([(ep.r, G.cy), (zg.x, G.cy)])                                      # -> Ableitung Zielgrößen
    # Revision DS 07.10.2026: Pfeile gehen von der gestrichelten Umrandung der Erfolgspotenzialplanung aus;
    # der Pfeil von Organisations-/Führungskräfteplanung in die operative Planung entfällt.
    A([(U.cx, ep.b), (U.cx, INV.y)])                                     # Erfolgspotenzial -> Investitionen
    A([(43.0, ep.b), (43.0, FE.y)])                                      # Erfolgspotenzial -> F&E
    A([(27.5, ep.b), (27.5, g1.y)])                                      # Erfolgspotenzial -> operative Mengenpläne
    L([(FE.cx, FE.b), (FE.cx, g1.y)])                                    # F&E -- Mengen-/Prozesspläne
    ax = zg.cx
    A([(ax, zg.b), (ax, yO0)], head=True)                                # Abgleich
    f.text(ax + 1.2, 43.4, 14, 3.0, [P("Abgleich", size=S, italic=True)], align="l", anchor="m", bg=band_bg)
    A([(g1.r, 74.0), (c3.x, 74.0)])                                      # Mengenpläne -> Ressourcenpläne
    # Investitionen -- Betriebsmittel-, Personalpläne
    L([(74.0, INV.b), (74.0, res[0].y)])
    yP = INV.y + INV.h * 0.72
    L([(INV.r, yP), (c3.r - 0.75, yP), (c3.r - 0.75, res[1].cy), (res[1].r, res[1].cy)])
    # Absatzplanung -> Umsatzplanung
    U0 = M[(0, 0)]
    A([(33.5, chain[0].y), (33.5, yA), (U0.cx, yA), (U0.cx, U0.y)])
    # Ressourcenpläne -> Kostenplanung, ⇢ Bestands-/Vermögensplanung
    K, BV, BE = M[(2, 0)], M[(3, 0)], M[(1, 0)]
    A([(c3.r, K.cy), (K.x, K.cy)])
    f.arrow([(79.75, c3.b), (79.75, BV.cy), (BV.x, BV.cy)], dash="sysDash", lw=0.6)
    # wertmäßige Pläne untereinander
    for (a, b_) in [((0, 0), (0, 1)), ((0, 1), (0, 2)), ((2, 0), (2, 1)), ((2, 1), (2, 2)), ((3, 0), (3, 1))]:
        p, q = M[a], M[b_]
        yy = (max(p.y, q.y) + min(p.b, q.b)) / 2
        A([(p.r, yy), (q.x, yy)])
    for (a, b_) in [((0, 0), (1, 0)), ((0, 1), (1, 1)), ((0, 2), (1, 2))]:
        A([(M[a].cx, M[a].b), (M[b_].cx, M[b_].y)])
    for (a, b_) in [((2, 0), (1, 0)), ((2, 1), (1, 1)), ((2, 2), (1, 2))]:
        A([(M[a].cx, M[a].y), (M[b_].cx, M[b_].b)])
    LQ, PB, AZ, EZ = M[(1, 2)], M[(3, 1)], M[(2, 2)], M[(0, 2)]
    ch1, ch2 = 152.4, 154.4
    A([(LQ.r, LQ.cy), (ch1, LQ.cy), (ch1, PB.y + PB.h * 0.3), (PB.r, PB.y + PB.h * 0.3)])  # Liquidität -> Planbilanz
    # Investitionen -> Einzahlung, Auszahlung, Planbilanz
    yI = INV.y + INV.h * 0.28
    L([(INV.r, yI), (ch2, yI)])
    A([(EZ.cx, yI), (EZ.cx, EZ.y)])                                      # ohne Knotenpunkt (Revision DS 07.10.2026)
    A([(ch2, yI), (ch2, PB.y + PB.h * 0.72), (PB.r, PB.y + PB.h * 0.72)])
    A([(ch2, AZ.cy), (AZ.r, AZ.cy)])                                     # ohne Knotenpunkt (Revision DS 07.10.2026)
    # Rückkopplung Betriebsergebnis -> Mengen-/Prozesspläne
    A([(BE.x, BE.cy), (92.6, BE.cy), (92.6, g1.b - 2.6), (g1.r, g1.b - 2.6)])
    return f
