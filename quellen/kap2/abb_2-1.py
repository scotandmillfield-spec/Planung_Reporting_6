"""Abb. 2.1 – Planung und Reporting im Management-Regelkreis."""
# Muster: Kreislauf/Regelkreis – Chevron-Ringsegmente, Kern, Informationsobjekte außen, Prozessklammer.
# Bauen: python3 scripts/build_figure.py beispiele/abb_2-1.py --out <Zielordner>
STEM = "abb_2-1"
import math
from bookfig import Fig, P, THEMES, arc_pts, polar, text_width_mm

W, H = 110, 81
CX, CY = 55, 44.5
R_OUT, R_IN, R_CORE = 33.0, 17.0, 10.5
GAP_MM = 1.5          # Abstand zwischen Segmenten (an mittlerem Radius)
TIP_MM = 4.2          # Länge der Chevron-Spitze

SEGMENTS = [  # (Mittelwinkel, Text, Planungsprozess?)
    (90,   "Ziele\nsetzen", True),
    (18,   "Planen\nund\nGestalten", True),
    (-54,  "Entscheiden", True),
    (-126, "Realisieren\nDurchführen", False),
    (162,  "Analyse\nund\nKontrolle", False),
]
# Informationsobjekte außen: (Winkel, Radius, Text)
DATA = [
    (90, 37.4, "Ziel-Größen"),
    (14, 37.4, "Plan-Werte"),
    (-126, 36.2, "Ist-Werte"),
    (166, 36.0, "Abweichungen"),
]


def segment_polygon(c_ang):
    r_mid = (R_OUT + R_IN) / 2
    gap = math.degrees(GAP_MM / r_mid)
    tip = math.degrees(TIP_MM / r_mid)
    a0 = c_ang + 36 - gap / 2 + tip / 2     # Anfang (gegen den Uhrzeigersinn gesehen)
    a1 = c_ang - 36 + gap / 2 + tip / 2     # Ende (im Uhrzeigersinn)
    pts = arc_pts(CX, CY, R_OUT, a0, a1)              # außen, im Uhrzeigersinn
    pts.append(polar(CX, CY, r_mid, a1 - tip))        # Spitze
    pts += arc_pts(CX, CY, R_IN, a1, a0)              # innen zurück
    pts.append(polar(CX, CY, r_mid, a0 - tip))        # Kerbe
    return pts


def label_box(f, ang, r, text, **kw):
    x, y = polar(CX, CY, r, ang)
    size = 7.0
    w = text_width_mm(text, size, italic=True) + 1.0
    h = 3.2
    c, s = math.cos(math.radians(ang)), math.sin(math.radians(ang))
    if c > 0.35:
        bx, al = x, "l"
    elif c < -0.35:
        bx, al = x - w, "r"
    else:
        bx, al = x - w / 2, "c"
    if s > 0.35:
        by = y - h
    elif s < -0.35:
        by = y
    else:
        by = y - h / 2
    f.text(bx, by, w, h, [P(text, italic=True, size=size)], align=al, anchor="m", name=f"Objekt {text}", **kw)


def build(theme):
    f = Fig(W, H, theme, "abb_2-1")
    t = theme
    # Ringsegmente
    for ang, txt, plan in SEGMENTS:
        role = t.role("box_hi" if plan else "box")
        f.poly(segment_polygon(ang), fill=role.fill or "FFFFFF", line=role.line, lw=role.lw,
               name=f"Segment {txt.splitlines()[0]}")
    # Segmenttexte
    r_mid = (R_OUT + R_IN) / 2
    for ang, txt, plan in SEGMENTS:
        x, y = polar(CX, CY, r_mid + 0.3, ang)
        lines = txt.split("\n")
        bw = max(text_width_mm(l, 7, bold=True) for l in lines) + 1.4
        bh = len(lines) * 7 * 1.18 * 25.4 / 72 + 0.8
        role = t.role("box_hi" if plan else "box")
        f.text(x - bw / 2, y - bh / 2, bw, bh, [P(txt, bold=True)], align="c", anchor="m",
               ins=(0.2, 0.2), name=f"Text {lines[0]}", bg=role.fill or "FFFFFF")
    # Informationsflüsse Kern <-> Segmente
    for ang, txt, plan in SEGMENTS:
        p0 = polar(CX, CY, R_CORE + 0.9, ang)
        p1 = polar(CX, CY, R_IN - 0.9, ang)
        f.arrow([p0, p1], role="info", head=True, tail=True, dash="sysDash", size="sm")
    # Kern
    f.ellipse(CX - R_CORE, CY - R_CORE, 2 * R_CORE, 2 * R_CORE, role="box_strong", name="Kern")
    f.text(CX - R_CORE, CY - 5, 2 * R_CORE, 10,
           [P("Information", size=6.5, bold=True), P("Kommunikation", size=6.5, bold=True),
            P("Koordination", size=6.5, bold=True)],
           align="c", anchor="m", color=t.role("box_strong").text, bg=t.role("box_strong").fill,
           name="Kern Text")
    # Klammer Planungsprozess (Bogen über Ziele setzen ... Entscheiden)
    r_b = R_OUT + 2.1
    a_start = 126 - 1.0
    a_end = -90 + 3.0
    f.line(arc_pts(CX, CY, r_b, a_start, a_end, step=1.5), color=t.accent, lw=1.0, name="Klammer Planungsprozess")
    for a in (a_start, a_end):
        f.line([polar(CX, CY, r_b, a), polar(CX, CY, R_OUT + 0.3, a)], color=t.accent, lw=1.0)
    lx, ly = polar(CX, CY, r_b + 1.4, 52)
    f.text(lx, ly - 3.6, 26, 3.4, [P("Planungsprozess", bold=True, color=t.accent)], align="l",
           anchor="b", name="Planungsprozess")
    # Informationsobjekte
    for ang, r, txt in DATA:
        label_box(f, ang, r, txt)
    return f
