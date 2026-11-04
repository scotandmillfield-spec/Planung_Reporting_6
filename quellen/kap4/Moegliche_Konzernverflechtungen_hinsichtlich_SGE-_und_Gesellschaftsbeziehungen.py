"""Abb. 4.2 – Mögliche Konzernverflechtungen hinsichtlich SGE- und Gesellschaftsbeziehungen."""
# Muster: Organigramm über fünf Ebenen mit Sammelleitungen. Mehrfachzuordnungen (im Original gekreuzte Diagonalen)
# als gemeinsame Sammelleitung zweier übergeordneter Einheiten: TK 1 und TK 2 hängen beide an SGE 1 und SGE 2,
# EG 5 und EG 6 beide an SGE 3 und SGE 4. Konzern gestrichelt (wie im Original), Abkürzungen unten links erklärt.
STEM = "Moegliche_Konzernverflechtungen_hinsichtlich_SGE-_und_Gesellschaftsbeziehungen"
from bookfig import Fig, P

W = 110
X0, XR = 0.3, W - 0.3
BW, BH = 14.0, 6.5             # Kastengröße aller Einheiten
G1 = 3.0                       # Abstand innerhalb eines Paares
G2 = (XR - X0 - 6 * BW - 3 * G1) / 2   # Abstand zwischen den Paaren
VG = 5.0                       # senkrechter Abstand zwischen den Ebenen
KW = 2 * BW + G1               # Breite Konzern
LEGENDE = [("TK", "Teilkonzern"), ("SGE", "Strategische Geschäftseinheit"), ("EG", "Einzelgesellschaft")]


class B:
    def __init__(self, x, y, w=BW, h=BH):
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
    t = theme
    ys = [0.3 + i * (BH + VG) for i in range(5)]
    H = round(ys[4] + BH + 0.3, 1)
    f = Fig(W, H, theme, STEM)
    lw = t.arrow_lw

    def L(pts, name):
        f.line(pts, color=t.arrow, lw=lw, name=name)

    def bus(oben, unten, name):
        """Sammelleitung von einer oder mehreren oberen zu einer oder mehreren unteren Einheiten."""
        ym = (oben[0].b + unten[0].y) / 2
        xs = [o.cx for o in oben] + [u.cx for u in unten]
        L([(min(xs), ym), (max(xs), ym)], f"Sammelleitung {name}")
        for o in oben:
            L([(o.cx, o.b), (o.cx, ym)], f"Linie {name} oben {o.cx:.0f}")
        for u in unten:
            L([(u.cx, ym), (u.cx, u.y)], f"Linie {name} unten {u.cx:.0f}")

    # Einzelgesellschaften als Raster (drei Paare)
    xe = []
    x = X0
    for p in range(3):
        xe += [x, x + BW + G1]
        x += 2 * BW + G1 + G2
    EG = [B(xx, ys[3]) for xx in xe]
    SGE1 = B((EG[0].cx + EG[1].cx) / 2 - BW / 2, ys[2])
    SGE2 = B((EG[2].cx + EG[3].cx) / 2 - BW / 2, ys[2])
    TK1, TK2 = B(SGE1.x, ys[1]), B(SGE2.x, ys[1])
    TK3 = B((EG[4].cx + EG[5].cx) / 2 - BW / 2, ys[1])
    SGE3, SGE4 = B(EG[4].x, ys[4]), B(EG[5].x, ys[4])
    KZ = B(TK2.cx - KW / 2, ys[0], KW)

    # Linien zuerst, Kästen darüber
    bus([KZ], [TK1, TK2, TK3], "Konzern")
    bus([TK1, TK2], [SGE1, SGE2], "TK 1/TK 2 – SGE 1/SGE 2")
    bus([SGE1], EG[0:2], "SGE 1")
    bus([SGE2], EG[2:4], "SGE 2")
    bus([TK3], EG[4:6], "TK 3")
    bus(EG[4:6], [SGE3, SGE4], "EG 5/EG 6 – SGE 3/SGE 4")

    f.box(KZ.x, KZ.y, KZ.w, KZ.h, [P("Konzern")], role="container", name="Konzern")
    for b, n in ((TK1, "TK 1"), (TK2, "TK 2"), (TK3, "TK 3"), (SGE1, "SGE 1"), (SGE2, "SGE 2"),
                 (SGE3, "SGE 3"), (SGE4, "SGE 4")):
        f.box(b.x, b.y, b.w, b.h, [P(n)], name=n)
    for i, b in enumerate(EG):
        f.box(b.x, b.y, b.w, b.h, [P(f"EG {i + 1}")], name=f"EG {i + 1}")

    # Legende der Abkürzungen unten links
    lh = len(LEGENDE) * 6.5 * f.LINE * 25.4 / 72 + 0.4
    yl = ys[4] + BH - lh
    kurz = [P(k, size="note", color=t.text_muted) for k, _ in LEGENDE]
    lang = [P(f"= {v}", size="note", color=t.text_muted) for _, v in LEGENDE]
    f.text(X0, yl, 7.0, lh, kurz, align="l", anchor="t", name="Legende Kürzel")
    f.text(X0 + 7.0, yl, SGE3.x - 2.0 - (X0 + 7.0), lh, lang, align="l", anchor="t", name="Legende Begriffe")
    return f
