"""Abb. 5.33 – λ-Architektur (Lambda-Architektur) zur Echtzeitdatenverarbeitung."""
# Muster: Aufbau der Folie – oben die Abfrage, links Serving Layer über Batch Layer, rechts der Speed Layer über die
# volle Höhe, unten die neuen Daten. Schichten als Karten mit Kopfleiste (wie Abb. 5.10), Inhalte (Master Dataset,
# Views) als Datenhaltung box_hi; Abfrage und neue Daten als Ellipsen wie im Original. Schrägpfeile → senkrechte
# Pfeile, die an der Ellipse enden. Kein Rot (kein einzelnes Schlüsselelement).
# Übertragen: „Query“ → „Abfrage“, „New Data“ → „Neue Daten“; Schichtnamen und Views als Fachbegriffe englisch,
# „Batch view“/„Realtime view“ → „Batch View“/„Realtime View“ (einheitliche Großschreibung).
STEM = "Architektur_Lambda-Architektur_zur_Echtzeitdatenverarbeitung"
import math
from bookfig import Fig, P, Para, MM, MSO_SHAPE, Emu

W = 110
KH = 5.0                          # Kopfleiste
PAD = 1.6                         # Innenabstand Karte
XL, WL = 0.3, 50.0                # Serving/Batch Layer
XS = 62.0                         # Speed Layer
WS = W - 0.3 - XS
EX, EW, EH = 28.0, 60.0, 9.0      # Ellipsen
XP1, XP2 = 40.0, 76.0             # Pfeilachsen zu/von den Ellipsen


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


def karte(f, k, titel):
    """Karte mit Kopfleiste (Rolle header) und leerem Rumpf (Rolle box)."""
    t = f.t
    f.box(k.x, k.y, k.w, k.h, None, role="box", name=f"Karte {titel}")
    s = f.sh.add_shape(MSO_SHAPE.ROUND_2_SAME_RECTANGLE, Emu(round(k.x * MM)), Emu(round(k.y * MM)),
                       Emu(round(k.w * MM)), Emu(round(KH * MM)))
    f._strip_style(s)
    s.adjustments[0] = t.role("box").radius / KH
    s.adjustments[1] = 0.0
    hr = t.role("header")
    f._apply_role(s, hr)
    s.name = f"Kopf {titel}"
    f._fill_text(s, [Para(titel, size="head", bold=True)], k.w, KH, hr.text, "l", "m", (1.6, 0.3),
                 label=titel, bg=hr.fill)


def rand_y(e, x, oben):
    """y der Ellipse e an der Stelle x (oberer oder unterer Rand)."""
    a, b = e.w / 2, e.h / 2
    d = b * math.sqrt(max(0.0, 1 - ((x - e.cx) / a) ** 2))
    return e.cy - d if oben else e.cy + d


def build(theme):
    VH = 6.4                                   # View-Box
    GAP = 5.4                                  # Abstand für Pfeile
    Q = B(EX, 0.3, EW, EH)
    SV = B(XL, Q.b + GAP + 0.6, WL, KH + PAD + 5.0 + PAD)
    BL = B(XL, SV.b + GAP - 1.0, WL, KH + PAD + 7.0 + PAD)
    SP = B(XS, SV.y, WS, BL.b - SV.y)
    N = B(EX, BL.b + GAP + 0.6, EW, EH)
    H = round(N.b + 0.3, 1)
    f = Fig(W, H, theme, STEM)
    A = f.arrow

    # ---------------- Pfeile
    A([(XP1, SV.y), (XP1, rand_y(Q, XP1, False))], name="Serving Layer → Abfrage")
    A([(XP2, SP.y), (XP2, rand_y(Q, XP2, False))], name="Speed Layer → Abfrage")
    A([(SV.cx, BL.y), (SV.cx, SV.b)], name="Batch Layer → Serving Layer")
    A([(XP1, rand_y(N, XP1, True)), (XP1, BL.b)], name="Neue Daten → Batch Layer")
    A([(XP2, rand_y(N, XP2, True)), (XP2, SP.b)], name="Neue Daten → Speed Layer")

    # ---------------- Ellipsen
    f.ellipse(Q.x, Q.y, Q.w, Q.h, role="box_plain", paras=[P("Abfrage", size="head", bold=True)], name="Abfrage")
    f.ellipse(N.x, N.y, N.w, N.h, role="box_plain", paras=[P("Neue Daten", size="head", bold=True)],
              name="Neue Daten")

    # ---------------- Serving Layer
    karte(f, SV, "Serving Layer")
    f.box(SV.x + PAD, SV.y + KH + PAD, SV.w - 2 * PAD, 5.0, [P("Master Dataset")], role="box_hi",
          name="Master Dataset")

    # ---------------- Batch Layer
    karte(f, BL, "Batch Layer")
    g = 1.6
    bw = (BL.w - 2 * PAD - 2 * g) / 3
    for i in range(3):
        f.box(BL.x + PAD + i * (bw + g), BL.y + KH + PAD, bw, 7.0, [P("Batch"), P("View")], role="box_hi",
              name=f"Batch View {i + 1}")

    # ---------------- Speed Layer
    karte(f, SP, "Speed Layer")
    inner = SP.h - KH - 2 * PAD
    g2 = (inner - 3 * VH) / 2
    for i in range(3):
        f.box(SP.x + PAD, SP.y + KH + PAD + i * (VH + g2), SP.w - 2 * PAD, VH, [P("Realtime View")],
              role="box_hi", name=f"Realtime View {i + 1}")
    return f
