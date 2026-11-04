"""Abb. 5.29 – 4-V-Modell."""
# Muster: Ringdiagramm wie im Original – vier Viertel (Volume, Variety, Velocity, Veracity), vier Ringe von innen
# nach außen, je Viertel ein radialer Pfeil zum V-Begriff. Ausprägungen tangential beschriftet (45°, wie im
# Original); unter den Beschriftungen ist der Pfeil ausgespart.
# Entfernt: Programmfenster der Tabellenkalkulation, Symbole (Festplatte, Trichter, Sanduhr, Dokument), Farben
# der Viertel (Bedeutung trägt die Position und die Beschriftung).
# Korrekturen: „socia“ → „social“, „unstructure“ → „unstructured“ (abgeschnitten), „correct Data“/„enriched Data“
# → „correct data“/„enriched data“ (Kleinschreibung wie die übrigen Ausprägungen).
STEM = "4-V-Modell"
import math
from bookfig import Fig, P, text_width_mm

W = 110
CX, CY = 55.0, 36.2
R0 = 3.6                          # Innenkreis (frei)
DR = 8.0                          # Ringbreite
NR = 4
RA = R0 + NR * DR + 4.6           # Pfeilspitze
SZ = 6.5                          # Ausprägungen
SZ_V = 7.5                        # V-Begriffe

# Viertel: (Name, Winkel von, bis (mathematisch, Grad), Drehung der Beschriftung im Uhrzeigersinn)
VIERTEL = {
    "Volume":   (0, 90, 45),
    "Veracity": (90, 180, 315),
    "Velocity": (180, 270, 45),
    "Variety":  (270, 360, 315),
}
# Ausprägungen: Viertel -> Liste (Ring 1..4, Winkel, Text)
WERTE = {
    "Volume":   [(1, 45, "MB"), (2, 45, "GB"), (3, 45, "TB"), (4, 45, "PB")],
    "Veracity": [(1, 135, "false"), (2, 135, "undetermined"), (3, 135, "enriched data"), (4, 135, "correct data")],
    "Velocity": [(1, 225, "batch"), (2, 225, "periodic"), (3, 225, "near real time"), (4, 225, "real time")],
    "Variety":  [(1, 315, "table"), (2, 315, "data"),
                 (3, 292, "photo"), (3, 315, "Web"), (3, 338, "audio"),
                 (4, 280, "social"), (4, 299, "video"), (4, 323, "unstructured"), (4, 348, "mobile")],
}


def pol(r, a):
    """Punkt bei Radius r und mathematischem Winkel a (Grad); Bildschirm-y nach unten."""
    return CX + r * math.cos(math.radians(a)), CY - r * math.sin(math.radians(a))


def sektor(r1, r2, a0, a1, n=24):
    aus = [pol(r2, a0 + (a1 - a0) * i / n) for i in range(n + 1)]
    ein = [pol(r1, a1 - (a1 - a0) * i / n) for i in range(n + 1)]
    return aus + ein


def build(theme):
    t = theme
    H = round(CY + R0 + NR * DR + 0.4, 1)
    f = Fig(W, H, theme, STEM)
    box = t.role("box")

    # ---------------- Ringe
    for nm, (a0, a1, _) in VIERTEL.items():
        for k in range(NR):
            f.poly(sektor(R0 + k * DR, R0 + (k + 1) * DR, a0, a1), closed=True, fill=box.fill, line=box.line,
                   lw=0.5, name=f"{nm} Ring {k + 1}")

    # ---------------- Pfeile und V-Begriffe
    for nm, (a0, a1, _) in VIERTEL.items():
        am = (a0 + a1) / 2
        x0, y0 = pol(R0 + 0.4, am)
        x1, y1 = pol(RA, am)
        f.arrow([(x0, y0), (x1, y1)], name=f"Pfeil {nm}")
        rechts = math.cos(math.radians(am)) > 0
        oben = math.sin(math.radians(am)) > 0
        bw, bh = 24.0, 4.0
        bx = x1 + 0.8 if rechts else x1 - 0.8 - bw
        by = y1 - 1.0 - bh if oben else y1 + 1.0
        f.text(bx, by, bw, bh, [P(nm, size=SZ_V, bold=True)], align="l" if rechts else "r",
               anchor="b" if oben else "t", name=f"V {nm}")

    # ---------------- Ausprägungen (tangential, Pfeil darunter ausgespart)
    lh = SZ * 1.18 * 25.4 / 72 + 0.2
    for nm, liste in WERTE.items():
        rot = VIERTEL[nm][2]
        for ring, a, txt in liste:
            r = R0 + (ring - 0.5) * DR
            x, y = pol(r, a)
            lw = text_width_mm(txt, SZ) + 1.4
            s = f.text(x - lw / 2, y - lh / 2, lw, lh, [P(txt, size=SZ, nowrap=True)], align="c", anchor="m",
                       bg=box.fill, ins=(0.3, 0.0), name=f"{nm} {txt}")
            s.fill.solid()
            from pptx.dml.color import RGBColor
            s.fill.fore_color.rgb = RGBColor.from_string(box.fill)
            s.rotation = rot
    return f
