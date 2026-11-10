"""Abb. 5.68 – Arten von RPA-Lösungen."""
# Muster: Pyramide mit drei Stufen wie im Original (unten einfache, in der Mitte erweiterte, oben intelligente
# RPA-Systeme), Stufen als Freiformen mit weißer Fuge. Die einheitlich graue Pyramide des Originals wird zur
# Helligkeitsleiter (hell → dunkel nach oben), die Spitze ist das Schlüsselelement (rot).
# Der schräge Pfeil „Zunehmender Wert und Intelligenz“ entlang der linken Flanke → senkrechter Pfeil links mit
# waagerechter Beschriftung oben (Pfeile orthogonal, gedrehte Beschriftung waagerecht).
# Korrekturen: In der Spitze war die Beschreibung abgeschnitten („KI für Lernfähigkeit des“) – vollständig nach dem
# Folientext „KI für Lernfähigkeit des Systems“; die Spitze ist dafür etwas höher als die übrigen Stufen.
# „Anstoßen und kontrollieren“ → „Anstoßen und Kontrollieren“ (substantiviertes Verb).
STEM = "Arten_von_RPA-Loesungen"
from bookfig import Fig, P, text_width_mm

W = 110
XL, XR = 16.0, 109.5             # Grundlinie der Pyramide
Y0 = 0.4                         # Spitze
PH = 56.0                        # Höhe der Pyramide
FUGE = 1.0                       # weiße Fuge zwischen den Stufen
XP = 4.0                         # senkrechter Pfeil
ZL = 7.0 * 1.18 * 0.3528         # Zeilenhöhe 7 pt in mm


def build(theme):
    t = theme
    H = round(Y0 + PH + 0.4, 1)
    f = Fig(W, H, theme, STEM)
    cx = (XL + XR) / 2
    halb = lambda y: (XR - XL) / 2 * (y - Y0) / PH          # halbe Breite der Pyramide in Höhe y

    # Stufen (Unterkanten in mm ab der Spitze): Spitze 23, Mitte und unten je 15,5
    hs = [23.0, (PH - 23.0 - 2 * FUGE) / 2, (PH - 23.0 - 2 * FUGE) / 2]
    stufen = [
        ("Intelligente RPA-Systeme", "box_strong",
         [P("Intelligente", bold=True), P("RPA-Systeme", bold=True), P("KI für Lernfähigkeit"), P("des Systems")]),
        ("Erweiterte RPA-Systeme", "box_hi",
         [P("Erweiterte RPA-Systeme", bold=True), P("Selbständige Ausführungen von"),
          P("Aufgaben durch das RPA-System")]),
        ("Einfache RPA-Systeme", "box",
         [P("Einfache RPA-Systeme", bold=True), P("Anstoßen und Kontrollieren der Ausführung von Aufgaben"),
          P("durch einen menschlichen Anwender")]),
    ]
    ya = Y0
    for (name, role, paras), h in zip(stufen, hs):
        yb = ya + h
        r = t.role(role)
        if ya <= Y0 + 1e-6:
            pts = [(cx, ya), (cx + halb(yb), yb), (cx - halb(yb), yb)]
        else:
            pts = [(cx - halb(ya), ya), (cx + halb(ya), ya), (cx + halb(yb), yb), (cx - halb(yb), yb)]
        f.poly(pts, fill=r.fill, line=r.line, lw=r.lw or 0.5, name=f"Stufe {name}")
        # Textblock: in der Spitze unten angesetzt (dort ist sie breit genug), sonst mittig
        th = len(paras) * ZL
        ty = yb - 2.0 - th if role == "box_strong" else ya + (h - th) / 2
        tw = max(text_width_mm(p.text, 7.0, p.bold) for p in paras) + 1.6
        for k, p in enumerate(paras):                       # jede Zeile passt in die Pyramide
            breite = 2 * halb(ty + k * ZL) - 2.0
            assert text_width_mm(p.text, 7.0, p.bold) <= breite, (p.text, breite)
        f.text(cx - tw / 2, ty, tw, th + 0.2, paras, align="c", anchor="m", color=r.text or t.text, bg=r.fill,
               name=f"Text {name}")
        ya = yb + FUGE

    # Senkrechter Pfeil mit waagerechter Beschriftung oben links
    f.arrow([(XP, Y0 + PH), (XP, Y0)], name="Zunehmender Wert und Intelligenz")
    f.text(XP + 2.0, Y0, 30.0, 2 * ZL + 0.4, [P("Zunehmender Wert"), P("und Intelligenz")], align="l", anchor="t",
           name="Beschriftung Zunehmender Wert und Intelligenz")
    return f
