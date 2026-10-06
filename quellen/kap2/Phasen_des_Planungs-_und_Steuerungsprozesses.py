"""Abb. 2.4 – Phasen des Planungs- und Steuerungsprozesses."""
# Muster: Tabelle (Phasen | Tätigkeiten) mit Klammern rechts, Informationsflüsse gestrichelt
# (Zielvorgabe links, Vorgabeinformation zur Durchführung, Rückinformation als Schleife).
STEM = "Phasen_des_Planungs-_und_Steuerungsprozesses"
from bookfig import Fig, P

W = 110
SHY = chr(0xAD)
NB = chr(0xA0)

X0, CW = 10.0, 28.0          # Tabelle: Phasenspalte, Tätigkeitsspalte
X1, X2 = X0 + CW, X0 + 2 * CW
XI = X2 + 2.0                # innere Klammern
XO = 89.0                    # äußere Klammer (Planung i. w. S.)

PHASEN = [f"1. Problem{SHY}stellungs{SHY}phase", "2. Suchphase", "3. Beurteilungsphase (Bewertungsphase)",
          f"4. Entscheidungs{SHY}phase", "5. Realisationsphase", "6. Kontrollphase"]


def build(theme):
    tmp = Fig(W, 30, theme)
    t = theme
    taet = {3: [P(f"Entscheidungs{SHY}fällung", align="l")],
            4: [P("Detaillierte Festlegung der Durchführung", bullet="–", align="l"),
                P("Veranlassung der Durchführung", bullet="–", align="l", space_before=1)],
            5: [P(f"Vergleich der Durchführungs- und Entscheidungs{SHY}resultate (Soll/Ist)", align="l")]}
    kopf = [P("Phasen des Führungsprozesses", bold=True), P(f"Tätigkeiten der Unternehmungs{SHY}führung", bold=True)]
    hk = max(tmp.measure([kopf[0]], CW), tmp.measure([kopf[1]], CW))
    hs = []
    for i, ph in enumerate(PHASEN):
        h = tmp.measure([P(ph, align="l")], CW)
        if i in taet:
            h = max(h, tmp.measure(taet[i], CW))
        hs.append(max(7.0, h + 1.0))
    y0 = 6.0
    ys = [y0 + hk]
    for h in hs:
        ys.append(ys[-1] + h)
    yend = ys[-1] + 3.2
    H = round(yend + 5.0, 1)
    f = Fig(W, H, theme, STEM)

    # Kopf und Tabelle
    f.box(X0, y0, CW, hk, [kopf[0]], role="header", rounded=False)
    f.box(X1, y0, CW, hk, [kopf[1]], role="header", rounded=False)
    for i, ph in enumerate(PHASEN):
        f.box(X0, ys[i], CW, hs[i], [P(ph, align="l")], role="box", rounded=False, anchor="m", name=f"Phase {i + 1}")
    f.box(X1, ys[0], CW, ys[3] - ys[0], [P(f"Entscheidungs{SHY}vorbereitung", align="l")], role="box_plain",
          rounded=False, name="Entscheidungsvorbereitung")
    for i in (3, 4, 5):
        f.box(X1, ys[i], CW, hs[i], taet[i], role="box_plain", rounded=False, name=f"Tätigkeit {i + 1}")

    # Klammern
    def klammer(x, ya, yb, color, label, lw=0.75):
        ya, yb = ya + 0.8, yb - 0.8
        m = (ya + yb) / 2
        f.line([(x, ya), (x + 1.4, ya), (x + 1.4, yb), (x, yb)], color=color, lw=lw)
        f.line([(x + 1.4, m), (x + 2.8, m)], color=color, lw=lw)
        lw_ = 108.8 - (x + 3.4) if x > 80 else XO - 1.2 - (x + 3.4)
        lh = f.measure(label, lw_, ins=(0, 0)) + 0.4
        f.text(x + 3.4, m - lh / 2, lw_, lh, label, align="l", anchor="m", name="Klammer " + label[0].text)
    klammer(XI, ys[0], ys[3], t.arrow, [P(f"Planauf{SHY}stellung", bold=True), P(f"(Planung i.{NB}e.{NB}S.)")])
    klammer(XI, ys[3], ys[4], t.arrow, [P(f"Planverab{SHY}schiedung", bold=True)])
    klammer(XI, ys[4], ys[5], t.arrow, [P("Steuerung", bold=True)])
    klammer(XI, ys[5], ys[6], t.arrow, [P("Kontrolle", bold=True)])
    klammer(XO, ys[0], ys[4], t.accent, [P("Planung", bold=True, color=t.accent),
                                         P(f"(i.{NB}w.{NB}S.)", color=t.accent)], lw=1.0)

    # Durchführung und Informationsflüsse
    dx, dw = 89.6, 19.2
    dy = ys[4] + 6.0
    f.box(dx, dy, dw, 5.6, [P("Durchführung", bold=True)], role="box", name="Durchführung", ins=(0.6, 0.5))
    dcx = dx + dw / 2
    f.arrow([(X2, ys[4]), (dcx, ys[4]), (dcx, dy)], role="info", dash="sysDash")
    vg = [P("Vorgabeinformation", size=6.5, italic=True), P("(Soll)", size=6.5, italic=True)]
    f.text(XI + 3.4, ys[4] + 0.7, dcx - 1.5 - (XI + 3.4), 6.2, vg, align="l", anchor="t", name="Vorgabeinformation")
    f.arrow([(dcx, dy + 5.6), (dcx, yend), (3.0, yend), (3.0, 2.0), (5.4, 2.0)], role="info", dash="sysDash")
    f.text(78.0, yend + 0.6, 30.8, 3.6, [P("Rückinformation (Ist)", size=6.5, italic=True)],
           align="r", anchor="t", name="Rückinformation")
    f.text(5.6, 0.2, 30, 3.6, [P("Zielvorgabe", italic=True)], align="l", anchor="m", name="Zielvorgabe")
    xf = 7.0
    f.line([(xf, 3.9), (xf, ys[4] + hs[4] / 2)], color=t.info, lw=0.6, dash="sysDash")
    for i in range(5):
        cy = ys[i] + hs[i] / 2
        f.arrow([(xf, cy), (X0, cy)], role="info", dash="sysDash", size="sm")
    return f
