"""Abb. 5.65 – CRISP-DM-Modell – Prozessschritte."""
# Muster: Kreislauf wie Abb. 2.1 (Chevron-Ringsegmente um einen Kern), sechs Phasen im Uhrzeigersinn an den
# Positionen des Originals; Kern „Daten“ rot (im Original Datenbanksymbol in der Mitte). Rechts die Liste der
# Prozessschritte wie im Original.
# Rückkopplungen des Originals als Pfeile im Innenring: 2 → 1 und 4 → 3 (Doppelpfeile 1 ⇄ 2, 3 ⇄ 4; die
# Vorwärtsrichtung zeigen die Chevrons), 5 → 1 (Bogen von Evaluation zurück zu Business Understanding).
# Der äußere Kreis mit Drehpfeilen entfällt: Die geschlossene Chevron-Kette zeigt den Neubeginn nach Phase 6.
# Entfernt: Listenüberschrift „CRISP DM Modell - Prozessschritte:“ (= Caption), Blau → Rollen.
# Korrekturen: „CRISP DM“ → „CRISP-DM“, „Data“ → „Daten“, „Bewertung und Interpretation der Ereignisse“ →
# „… der Ergebnisse“ (bitte prüfen). Phasennamen bleiben englisch (Fachbegriffe des Modells).
STEM = "CRISP-DM-Modell_-_Prozessschritte"
import math
from bookfig import Fig, P, arc_pts, polar, text_width_mm

W = 110
CX, CY = 30.6, 30.6
R_OUT, R_IN, R_CORE = 30.0, 15.4, 8.2
R_FB = 11.8                  # Radius der Rückkopplungspfeile
GAP_MM = 1.5
TIP_MM = 4.0
SEG = 60.0

PHASEN = [  # (Mittelwinkel, Zeilen)
    (120, ["1. Business", "Understanding"]),
    (60, ["2. Data", "Understanding"]),
    (0, ["3. Data", "Preparation"]),
    (-60, ["4. Modeling"]),
    (-120, ["5. Evaluation"]),
    (180, ["6. Deployment"]),
]
SCHRITTE = ["Aufgabendefinition",
            "Verstehen und Auswahl der relevanten Datenbestände",
            "Datenaufbereitung",
            "Auswahl und Anwendung von Methoden/Modellen",
            "Bewertung und Interpretation der Ergebnisse",
            "Anwendung der Ergebnisse"]
XL = 65.0                    # Liste: Nummer
XLT = 69.6                   # Liste: Text


def segment_polygon(c_ang):
    r_mid = (R_OUT + R_IN) / 2
    gap = math.degrees(GAP_MM / r_mid)
    tip = math.degrees(TIP_MM / r_mid)
    a0 = c_ang + SEG / 2 - gap / 2 + tip / 2
    a1 = c_ang - SEG / 2 + gap / 2 + tip / 2
    pts = arc_pts(CX, CY, R_OUT, a0, a1)
    pts.append(polar(CX, CY, r_mid, a1 - tip))
    pts += arc_pts(CX, CY, R_IN, a1, a0)
    pts.append(polar(CX, CY, r_mid, a0 - tip))
    return pts


def rueckpfeil(f, a_von, a_nach, name):
    pts = [polar(CX, CY, R_IN - 0.2, a_von), polar(CX, CY, R_FB, a_von)]
    pts += arc_pts(CX, CY, R_FB, a_von, a_nach, step=2.0)[1:]
    pts.append(polar(CX, CY, R_IN - 0.2, a_nach))
    f.arrow(pts, size="sm", name=name)


def build(theme):
    t = theme
    H = round(CY + R_OUT + 0.6, 1)
    f = Fig(W, H, theme, STEM)
    rolle = t.role("box_hi")
    # Ringsegmente
    for ang, zeilen in PHASEN:
        f.poly(segment_polygon(ang), fill=rolle.fill, line=rolle.line, lw=rolle.lw, name=f"Phase {zeilen[0]}")
    r_mid = (R_OUT + R_IN) / 2
    for ang, zeilen in PHASEN:
        x, y = polar(CX, CY, r_mid + 0.2, ang - 1.5)
        bw = max(text_width_mm(z, 6.5, bold=True) for z in zeilen) + 1.4
        bh = len(zeilen) * 6.5 * 1.18 * 25.4 / 72 + 0.8
        f.text(x - bw / 2, y - bh / 2, bw, bh, [P(z, size=6.5, bold=True) for z in zeilen], align="c",
               anchor="m", ins=(0.2, 0.2), bg=rolle.fill, name=f"Text {zeilen[0]}")
    # Rückkopplungen im Innenring
    rueckpfeil(f, 72, 106, "Rückkopplung 2 → 1")
    rueckpfeil(f, -48, -14, "Rückkopplung 4 → 3")
    rueckpfeil(f, 228, 134, "Rückkopplung 5 → 1")
    # Kern
    f.ellipse(CX - R_CORE, CY - R_CORE, 2 * R_CORE, 2 * R_CORE, role="box_strong", name="Kern Daten")
    f.text(CX - R_CORE, CY - 2.0, 2 * R_CORE, 4.0, [P("Daten", bold=True)], align="c", anchor="m",
           color=t.role("box_strong").text, bg=t.role("box_strong").fill, name="Kern Text")
    # Liste der Prozessschritte
    tmp = Fig(W, 30, theme)
    tw = W - 0.3 - XLT
    hs = [tmp.measure([P(s)], tw, ins=(0, 0)) for s in SCHRITTE]
    gap = 1.6
    y = CY - (sum(hs) + gap * (len(hs) - 1)) / 2
    for i, (s, h_) in enumerate(zip(SCHRITTE, hs)):
        f.text(XL, y, XLT - XL, h_, [P(f"{i + 1}.", bold=True)], align="l", anchor="t", name=f"Nummer {i + 1}")
        f.text(XLT, y, tw, h_, [P(s)], align="l", anchor="t", name=f"Schritt {i + 1}")
        y += h_ + gap
    return f
