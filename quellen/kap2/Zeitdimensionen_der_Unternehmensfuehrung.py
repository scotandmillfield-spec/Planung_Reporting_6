"""Abb. 2.2 – Zeitdimensionen der Unternehmensführung."""
# Muster: Stapel von Planungsebenen im Rahmen „Unternehmenskultur“, Zeithorizont als rechte Spalte,
# Vorgaben links als Sammelleitung (top-down), Rückkopplung rechts (bottom-up).
STEM = "Zeitdimensionen_der_Unternehmensfuehrung"
from bookfig import Fig, P

W = 110
ELL = "…"
NB = chr(0xA0)


class B:
    def __init__(self, x, y, w, h):
        self.x, self.y, self.w, self.h = x, y, w, h
    @property
    def r(self): return self.x + self.w
    @property
    def b(self): return self.y + self.h
    @property
    def cy(self): return self.y + self.h / 2


def ebenen():
    def bl(t): return P(t, size=7, bullet="•", align="l")
    return [
        ("Generelle Zielplanung", [P("Generelle Zielplanung", bold=True)], None),
        ("Strategische Planung", [P("Strategische Planung", bold=True), bl("Geschäftsfelder"), bl("Regionen"), bl(ELL)],
         "5 Jahre"),
        ("Mittelfristplanung", [P("Mittelfristplanung", bold=True), bl("Maßnahmen"), bl("Projekte"), bl(ELL)],
         "2–3 Jahre"),
        ("Operative Planung", [P("Operative Planung", bold=True), bl("Prozesse"), bl("Ressourcen"), bl(ELL)],
         "bis 1 Jahr"),
        ("Steuerung und Kontrolle", [P("Steuerung und Kontrolle", bold=True)], None),
        ("Durchführung", [P("Durchführung", bold=True)], None),
    ]


def build(theme):
    BX, BW, GAP = 14.0, 62.0, 4.2
    TX, TW = 80.0, 27.0
    tmp = Fig(W, 30, theme)
    ys, y = [], 8.6
    for name, paras, _ in ebenen():
        h = max(5.6, tmp.measure(paras, BW))
        ys.append(B(BX, y, BW, h))
        y += h + GAP
    H = round(y - GAP + 2.6, 1)
    f = Fig(W, H, theme, STEM)
    t = theme
    # Rahmen Unternehmenskultur
    f.box(0.3, 0.3, W - 0.6, H - 0.6, None, role="container", name="Unternehmenskultur")
    f.text(BX, 1.6, BW, 4.0, [P("Unternehmenskultur", size="head", bold=True)], align="c", anchor="m")
    f.text(TX, 1.6, TW, 4.0, [P(f"Zeithorizont, z.{NB}B.", size="head", bold=True)],
           align="c", anchor="m")
    # Ebenen
    for (name, paras, zeit), b in zip(ebenen(), ys):
        f.box(b.x, b.y, b.w, b.h, paras, role="box", name=name)
        if zeit:
            f.text(TX, b.cy - 2.2, TW, 4.4, [P(zeit)], align="c", anchor="m", name=f"Zeithorizont {zeit}")
    # Rückkopplung bottom-up (rechts)
    xr = BX + BW - 9
    for lo, hi in zip(ys[1:], ys[:-1]):
        f.arrow([(xr, lo.y), (xr, hi.b)])
    # Steuerung -> Durchführung (top-down)
    st, du = ys[4], ys[5]
    f.arrow([(BX + 12, st.b), (BX + 12, du.y)])
    # Vorgaben aus der generellen Zielplanung (links, Sammelleitung)
    xl = 6.0
    g = ys[0]
    f.line([(g.x, g.cy), (xl, g.cy), (xl, ys[4].cy)], color=t.arrow, lw=t.arrow_lw)
    for b in ys[1:5]:
        f.arrow([(xl, b.cy), (b.x, b.cy)])
        if b is not ys[4]:
            f.ellipse(xl - 0.45, b.cy - 0.45, 0.9, 0.9, fill=t.arrow, line="none", name="Knoten")
    return f
