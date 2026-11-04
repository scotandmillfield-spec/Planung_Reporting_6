"""Abb. 3.188 – Abstimmung der Personalplanung (in Anlehnung an Schön und Irmer 2009, S. 301)."""
# Muster: senkrechte Kette – Bedarf aus der Absatzplanung, Zu- und Abschläge (rechts geklammert: Maßnahmen,
# Projekte), Kapazitätsabgleich; darunter die mögliche Stundenleistung. Kapazitätsabgleich und Stundenleistung
# bilden einen Kreislauf (links abwärts, rechts aufwärts), in der Mitte die Anpassungsmöglichkeiten.
# Rot nur für den Kapazitätsabgleich; Bedarf und Kapazität grau hervorgehoben.
STEM = "Abstimmung_der_Personalplanung"
from bookfig import Fig, P

W = 110.0
SHY = chr(0xAD)
NB = chr(0xA0)
MINUS = chr(0x2212)

X0, X1 = 0.3, 82.0            # Hauptspalte (Bedarf, Zu- und Abschläge)
XK = X1 + 1.6                 # Klammern
XT = XK + 3.4                 # Klammertexte
CW = 56.0                     # Kreislauf: Kapazitätsabgleich und Stundenleistung
CX = (X0 + X1) / 2
RAIL = 5.0                    # Abstand der Kreislaufpfeile zu den Boxen


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
    tmp = Fig(W, 30, theme)
    bedarf = [P("Absatzplanung: benötigte Leistungsmenge in Stunden je Kostenstelle (KST) und Leistungsart (LA) "
                "(aus Arbeitsplänen)", bold=True)]
    zeilen = [f"{MINUS} Rationalisierungsvorgabe in{NB}%", "+ Aufschlag für technisches Risiko/Ausschuss",
              "+ Mehrbedarf für Neuanläufe auf Monatsebene"]
    abgleich = [P("Kapazitätsabgleich je KST/Monat", bold=True)]
    anpassung = [P(f"Anpassung über NN plus oder minus bzw. Mitarbeiter- oder KST-Prämissen")]
    leistung = [P("Mögliche Stundenleistung je KST/LA aus Mitarbeiterstammdaten und Prämissen", bold=True)]

    ZH = 3.5                                       # Zeilenhöhe der Zu- und Abschläge
    hA = tmp.measure(bedarf, X1 - X0)
    hZ = len(zeilen) * ZH + 2 * 1.0
    hC = max(tmp.measure(abgleich, CW), 6.0)
    hM = tmp.measure(anpassung, CW, ins=(0.0, 0.0))
    hD = tmp.measure(leistung, CW)

    y = 0.3
    A_ = B(X0, y, X1 - X0, hA); y = A_.b + 2.4
    Z = B(X0, y, X1 - X0, hZ); y = Z.b + 5.0
    C = B(CX - CW / 2, y, CW, hC); y = C.b + 3.0
    M = B(CX - CW / 2, y, CW, hM); y = M.b + 3.0
    D = B(CX - CW / 2, y, CW, hD)
    H = round(D.b + 0.3, 1)

    f = Fig(W, H, theme, STEM)
    t = theme
    A = f.arrow

    f.box(A_.x, A_.y, A_.w, A_.h, bedarf, role="box_hi", name="Bedarf aus der Absatzplanung")
    f.box(Z.x, Z.y, Z.w, Z.h, None, role="box", name="Zu- und Abschläge")
    zy = []
    for i, z in enumerate(zeilen):
        yy = Z.y + 1.0 + i * ZH
        zy.append((yy, yy + ZH))
        f.text(Z.x + 2.0, yy, Z.w - 4.0, ZH, [P(z, nowrap=True)], anchor="m", bg=t.role("box").fill,
               name=z[2:30])
    # Klammern rechts: Maßnahmen (Zeilen 1–2), Projekte (Zeile 3)
    for (ya, yb), txt in (((zy[0][0] + 0.4, zy[1][1] - 0.4), "Maßnahmen"), ((zy[2][0] + 0.4, zy[2][1] - 0.4), "Projekte")):
        ym = (ya + yb) / 2
        f.line([(XK, ya), (XK + 1.0, ya), (XK + 1.0, yb), (XK, yb)], color=t.arrow, lw=0.6, name=f"Klammer {txt}")
        f.line([(XK + 1.0, ym), (XK + 2.0, ym)], color=t.arrow, lw=0.6, name=f"Klammerspitze {txt}")
        f.text(XT, ym - 1.8, W - XT, 3.6, [P(txt, nowrap=True)], anchor="m", name=txt)

    A([(Z.cx, Z.b), (Z.cx, C.y)], name="Bedarf → Kapazitätsabgleich")
    f.box(C.x, C.y, C.w, C.h, abgleich, role="box_strong", name="Kapazitätsabgleich")
    f.text(M.x, M.y, M.w, M.h, anpassung, align="c", name="Anpassung")
    f.box(D.x, D.y, D.w, D.h, leistung, role="box_hi", name="Mögliche Stundenleistung")
    # Kreislauf: links vom Abgleich zur Stundenleistung, rechts zurück zum Abgleich
    xl, xr = C.x - RAIL, C.r + RAIL
    A([(C.x, C.cy), (xl, C.cy), (xl, D.cy), (D.x, D.cy)], name="Abgleich → Stundenleistung")
    A([(D.r, D.cy), (xr, D.cy), (xr, C.cy), (C.r, C.cy)], name="Stundenleistung → Abgleich")
    return f
