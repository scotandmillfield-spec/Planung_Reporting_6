"""Abb. 4.8 – Prozesse der Planung und des Reportings."""
# Muster: Baum mit einer Wurzel und drei gleich großen Teilprozessen; Verbindung über eine Sammelleitung
# (Linien ohne Spitzen wie im Original). Die drei Teilprozesse werden in Abb. 4.9, 4.13/4.17 und 4.24 vertieft.
STEM = "Reporting-_und_Planungsprozesse"
from bookfig import Fig, P

W = 110
SHY = chr(0xAD)
X0, XR = 0.3, W - 0.3
WURZEL = "Reporting- und Planungsprozesse"
TEILE = [f"Einführungs{SHY}prozess", f"Zyklischer Durchführungs{SHY}prozess",
         f"Qualitäts{SHY}sicherungs{SHY}prozess"]
GAP = 4.0                       # Abstand zwischen den Teilprozessen
WW, WH = 50.0, 7.0              # Wurzel
V1, V2 = 4.5, 4.5               # Wurzel → Sammelleitung → Teilprozesse


def build(theme):
    t = theme
    tw = (XR - X0 - 2 * GAP) / 3
    tmp = Fig(W, 30, theme)
    th = max(10.0, max(tmp.measure([P(x, bold=True)], tw) for x in TEILE) + 2.0)
    y0 = 0.3
    yb = y0 + WH + V1
    yt = yb + V2
    H = round(yt + th + 0.3, 1)
    f = Fig(W, H, theme, STEM)
    cx = W / 2
    xs = [X0 + i * (tw + GAP) for i in range(3)]
    mids = [x + tw / 2 for x in xs]
    # Verbindungen zuerst (liegen unter den Kästen)
    f.line([(cx, y0 + WH), (cx, yb)], color=t.arrow, lw=t.arrow_lw, name="Linie Wurzel")
    f.line([(mids[0], yb), (mids[-1], yb)], color=t.arrow, lw=t.arrow_lw, name="Sammelleitung")
    for m, txt in zip(mids, TEILE):
        f.line([(m, yb), (m, yt)], color=t.arrow, lw=t.arrow_lw, name="Linie " + txt.replace(SHY, "")[:20])
    f.box(cx - WW / 2, y0, WW, WH, [P(WURZEL, bold=True)], role="box_hi", name=WURZEL)
    for x, txt in zip(xs, TEILE):
        f.box(x, yt, tw, th, [P(txt, bold=True)], role="box", name=txt.replace(SHY, ""))
    return f
