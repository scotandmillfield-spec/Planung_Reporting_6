"""Abb. 5.67 – Architektur von RPA."""
# Muster: drei Ebenen als Bänder mit Titel oben links (statt der Beschriftungen links und der geschweiften Klammer):
# Prozesse (Pfeilkette der Aktivitäten), Substitution (RPA ersetzt die Anwendung durch den Menschen) und die drei
# Schichten betrieblicher Anwendungssysteme. Anordnung wie im Original: Schichten rechts, Präsentation oben.
# Ersetzt: Monitor- und Personensymbol durch beschriftete Boxen („RPA – Bots/Softwareroboter“, „Anwendung durch
# Mensch“); die zwei Schrägpfeile aus der Präsentationsschicht als orthogonale Verzweigung ohne Knotenpunkt.
# Rollen nach Abstimmung Kapitel 5: Datenhaltung box_hi; die im Original grau hervorgehobene Präsentationsschicht
# ist das Schlüsselelement (dort setzen Bots wie Menschen an) und wird rot.
# Korrekturen: Platzhalter „Aktivität …“ → „Aktivität 2“ (Vorgabe keine Auslassungspunkte), „Bots / Software-
# roboter“ → „Bots/Softwareroboter“.
STEM = "Architektur_von_RPA"
from bookfig import Fig, P

W = 110
SHY = chr(0xAD)
TOP = 4.4                        # Titelzeile im Band
GAPB = 1.2                       # Abstand der Bänder
XB0, XB1 = 0.3, 109.7            # Bänder
XI0, XI1 = 1.9, 108.1            # Inhalt in den Bändern


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


def build(theme):
    t = theme
    tmp = Fig(W, 30, theme)
    box = t.role("box")

    # ------------------------------------------------------------ Geometrie
    # Band 1: Prozesse
    y1 = 0.3
    ch = 7.0                                    # Höhe der Chevrons
    h1 = TOP + ch + 1.4
    # Band 2: Substitution
    y2 = y1 + h1 + GAPB
    RW = 36.0                                   # Breite RPA / Anwendung durch Mensch
    rpa_p = [P("RPA", size="head", bold=True), P("Bots/Softwareroboter")]
    men_p = [P("Anwendung", size="head", bold=True), P("durch Mensch", size="head", bold=True)]
    bh = max(tmp.measure(rpa_p, RW), tmp.measure(men_p, RW)) + 1.0
    R = B(XI0 + 4.0, y2 + TOP, RW, bh)
    M = B(XI1 - 4.0 - RW, y2 + TOP, RW, bh)
    ybus = R.b + 2.8                            # Verzweigung aus der Präsentationsschicht
    h2 = ybus - y2 + 1.6
    # Band 3: Schichten
    y3 = y2 + h2 + GAPB
    LX, LW, LH, LG = 40.0, 64.0, 6.0, 1.6       # Schichtboxen
    L = [B(LX, y3 + TOP + i * (LH + LG), LW, LH) for i in range(3)]
    h3 = TOP + 3 * LH + 2 * LG + 1.4
    H = round(y3 + h3 + 0.3, 1)

    f = Fig(W, H, theme, STEM)
    A = f.arrow

    # ------------------------------------------------------------ Bänder
    f.band(XB0, y1, XB1 - XB0, h1, "Prozesse")
    f.band(XB0, y2, XB1 - XB0, h2, "Substitution")
    f.band(XB0, y3, XB1 - XB0, h3, "3 Schichten betrieblicher Anwendungssysteme")

    # ------------------------------------------------------------ Prozesse: Pfeilkette
    tip, gap = 3.0, 1.2
    cw = (XI1 - XI0 - 2 * gap) / 3
    cy0 = y1 + TOP
    for i, s in enumerate(("Aktivität 1", "Aktivität 2", "Aktivität n")):
        x0 = XI0 + i * (cw + gap)
        x1 = x0 + cw
        pts = [(x0, cy0), (x1 - tip, cy0), (x1, cy0 + ch / 2), (x1 - tip, cy0 + ch), (x0, cy0 + ch)]
        if i > 0:
            pts.append((x0 + tip, cy0 + ch / 2))
        f.poly(pts, fill=box.fill, line=box.line, lw=box.lw, name=f"Chevron {s}")
        tx0 = x0 + (tip if i > 0 else 0) + 0.6
        f.text(tx0, cy0, x1 - tip - 0.6 - tx0, ch, [P(s)], align="c", anchor="m", bg=box.fill, name=s)

    # ------------------------------------------------------------ Substitution
    # Pfeil „ersetzt“
    A([(R.r, R.cy), (M.x, R.cy)], name="RPA ersetzt Anwendung durch Mensch")
    f.text(R.r + 1.0, R.cy - 4.2, M.x - R.r - 2.0, 3.6, [P("ersetzt", italic=True)], align="c", anchor="b",
           bg=t.role("band").fill, name="Beschriftung ersetzt")
    # Verzweigung aus der Präsentationsschicht (ohne Knotenpunkt)
    px = L[0].cx
    f.line([(px, L[0].y), (px, ybus)], name="Präsentation nach oben")
    A([(px, ybus), (R.cx, ybus), (R.cx, R.b)], size="sm", name="Präsentation → RPA")
    A([(px, ybus), (M.cx, ybus), (M.cx, M.b)], size="sm", name="Präsentation → Anwendung durch Mensch")
    f.box(R.x, R.y, R.w, R.h, rpa_p, role="box", name="RPA Bots/Softwareroboter")
    f.box(M.x, M.y, M.w, M.h, men_p, role="box", name="Anwendung durch Mensch")

    # ------------------------------------------------------------ Schichten
    for b_, s, role in zip(L, ("3. Präsentation", "2. Datenverarbeitung", "1. Datenhaltung"),
                           ("box_strong", "box", "box_hi")):
        f.box(b_.x, b_.y, b_.w, b_.h, [P(s, bold=True)], role=role, align="l",
              ins=(2.0, 0.5), name=s)
    return f
