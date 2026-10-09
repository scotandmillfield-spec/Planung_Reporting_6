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

# Revision DS 07.10.2026: Nummer und Phasenname getrennt gesetzt (hängender Einzug)
PHASEN = [f"Problem{SHY}stellungs{SHY}phase", "Suchphase", "Beurteilungsphase (Bewertungsphase)",
          f"Entscheidungs{SHY}phase", "Realisationsphase", "Kontrollphase"]
XF = 7.0                     # gestrichelte Zielvorgabe-Linie
NUM_W = 3.0                  # Breite der Nummernspalte (hängender Einzug)


def build(theme):
    tmp = Fig(W, 30, theme)
    t = theme
    taet = {3: [P(f"Entscheidungs{SHY}fällung", align="l")],
            4: [P("Detaillierte Festlegung der Durchführung", bullet="–", align="l"),
                P("Veranlassung der Durchführung", bullet="–", align="l", space_before=1)],
            5: [P(f"Vergleich der Durchführungs- und Entscheidungs{SHY}resultate (Soll/Ist)", align="l")]}
    # Revision DS 07.10.2026: Spaltenköpfe als kursiver Text ohne Kasten, etwas oberhalb der Tabelle
    # Revision DS 08.10.2026: „Tätigkeiten der Unternehmungsführung“ ebenfalls zweizeilig
    kopf = [[P("Phasen des", italic=True), P("Führungsprozesses", italic=True)],
            [P("Tätigkeiten der", italic=True), P("Unternehmungsführung", italic=True)]]
    hk = max(tmp.measure(kopf[0], CW, ins=(0.9, 0)), tmp.measure(kopf[1], CW + 2.0, ins=(0.9, 0)))
    ph_w = CW - 2 * tmp.INS_X - NUM_W
    ph_h = [tmp.measure([P(ph, align="l")], ph_w, ins=(0, 0)) for ph in PHASEN]
    hs = []
    for i, ph in enumerate(PHASEN):
        h = ph_h[i] + 2 * tmp.INS_Y
        if i in taet:
            h = max(h, tmp.measure(taet[i], CW))
        hs.append(max(7.0, h + 1.0))
    # Revision DS 08.10.2026: Spaltenköpfe ganz oben, „Zielvorgabe“ darunter, direkt über der Tabelle
    y0 = 0.4                 # Oberkante der Spaltenköpfe
    yz = y0 + hk + 0.6       # Oberkante „Zielvorgabe“
    ys = [yz + 3.6 + 0.8]
    for h in hs:
        ys.append(ys[-1] + h)
    yend = ys[-1] + 3.2
    H = round(yend + 5.0, 1)
    f = Fig(W, H, theme, STEM)

    # Kopf und Tabelle
    f.text(X0, y0, CW, hk, kopf[0], align="c", anchor="b", ins=(0.9, 0), name="Kopf Phasen")
    f.text(X1 - 1.0, y0, CW + 2.0, hk, kopf[1], align="c", anchor="b", ins=(0.9, 0), name="Kopf Tätigkeiten")
    bgp = t.role("box").fill
    for i, ph in enumerate(PHASEN):
        f.box(X0, ys[i], CW, hs[i], None, role="box", rounded=False, name=f"Phase {i + 1}")
        ty = ys[i] + (hs[i] - ph_h[i]) / 2
        f.text(X0 + f.INS_X, ty, NUM_W + 0.2, ph_h[i], [P(f"{i + 1}.")], align="l", anchor="t", bg=bgp,
               name=f"Nummer Phase {i + 1}")
        f.text(X0 + f.INS_X + NUM_W, ty, ph_w, ph_h[i], [P(ph, align="l")], align="l", anchor="t", bg=bgp,
               name=f"Text Phase {i + 1}")
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
    # Revision DS 07.10.2026: Durchführung mittig auf der Höhe von Phase 4 und 5
    dx, dw, dh = 90.2, 19.0, 4.6
    dy = (ys[4] + ys[5]) / 2 - dh / 2   # Revision DS 08.10.2026: weiter nach unten, mittig auf Phase 5
    f.box(dx, dy, dw, dh, [P("Durchführung", bold=True)], role="box", name="Durchführung", ins=(0.6, 0.5))
    dcx = dx + dw / 2
    f.arrow([(X2, ys[4]), (dcx, ys[4]), (dcx, dy)], role="info", dash="sysDash")
    vg = [P(f"Vorgabe{SHY}information (Soll)", size=6.5, italic=True)]
    f.text(XI + 3.4, ys[4] + 0.7, dx - 0.5 - (XI + 3.4), 6.2, vg, align="l", anchor="t", name="Vorgabeinformation")
    f.arrow([(dcx, dy + dh), (dcx, yend), (3.0, yend), (3.0, yz + 1.8), (XF - 0.5, yz + 1.8)], role="info", dash="sysDash")
    f.text(78.0, yend + 0.6, 30.8, 3.6, [P("Rückinformation (Ist)", size=6.5, italic=True)],
           align="r", anchor="t", name="Rückinformation")
    # Revision DS 07.10.2026: „Zielvorgabe“ und ihr Pfeil beginnen an der gestrichelten Linie nach unten
    xf = XF
    f.text(xf - 0.2, yz, 30, 3.6, [P("Zielvorgabe", italic=True)], align="l", anchor="m", name="Zielvorgabe")
    f.line([(xf, yz + 3.7), (xf, ys[4] + hs[4] / 2)], color=t.info, lw=0.6, dash="sysDash")
    for i in range(5):
        cy = ys[i] + hs[i] / 2
        f.arrow([(xf, cy), (X0, cy)], role="info", dash="sysDash", size="sm")
    return f
