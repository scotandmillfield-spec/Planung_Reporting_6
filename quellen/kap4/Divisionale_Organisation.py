"""Abb. 4.4 – Divisionale Organisation."""
# Muster: Organigramm (Unternehmensleitung über vier Einheiten, Sammelleitung), rote Klammer unter den Einheiten
# für die Ausrichtung von Reporting/Planung, links der Kasten der anderen Geschäftsausrichtungen, auf den ein
# gestrichelter Pfeil (schwache bzw. fehlende Sicht) zeigt.
# Serie Abb. 4.3–4.5: Raster (WL, G, WU, BH, VG) in allen drei Skripten identisch – bei Änderungen alle drei anpassen.
STEM = "Divisionale_Organisation"
from bookfig import Fig, P

W = 110
SHY = chr(0xAD)
NB = chr(0xA0)
DOTS = "…"

# ---- gemeinsames Raster der Serie (Abb. 4.3 Funktionale, 4.4 Divisionale, 4.5 Matrixorganisation) ----
X0, XR = 0.3, W - 0.3          # Außenkanten
WL = 23.0                      # linke Spalte (andere Geschäftsausrichtungen bzw. Zeilenköpfe der Matrix)
G = 2.4                        # Abstand zwischen Kästen
XU = X0 + WL + G               # erste Einheit
WU = (XR - XU - 3 * G) / 4     # Breite einer Einheit (vier Spalten)
BH = 8.0                       # Kastenhöhe
VG = 5.0                       # senkrechter Abstand zwischen den Ebenen (Sammelleitung in der Mitte)
WT = 2 * WU + G                # Unternehmensleitung (über den beiden mittleren Einheiten)

EINHEITEN = ["Sparte 1", "Sparte 2", "Sparte 3", DOTS]
AUSRICHTUNG = "Reporting/Planung ist primär divisional ausgerichtet"
ANDERE = [f"Funktions{SHY}bereiche{NB}1–n", f"Region{NB}1–n", DOTS]
SICHT = "Die Sicht auf andere Geschäftsausrichtungen\nfehlt oder ist wenig ausgeprägt."


def andere_paras(items):
    return ([P(f"Andere Geschäfts{SHY}ausrichtungen:", bold=True, align="l")] +
            [P(t, align="l", space_before=2.0 if i == 0 else 0.6) for i, t in enumerate(items)])


def build(theme):
    t = theme
    tmp = Fig(W, 30, theme)
    # gleiche Kastenhöhe links in Abb. 4.3 und 4.4 (jeweils die größere)
    hL = max(tmp.measure(andere_paras([f"Sparte{NB}1–n", f"Region{NB}1–n", f"Business Unit{NB}1–n", DOTS]), WL),
             tmp.measure(andere_paras([f"Funktions{SHY}bereiche{NB}1–n", f"Region{NB}1–n", DOTS]), WL))
    hS = tmp.measure([P(SICHT)], XR - XU, ins=(0, 0))

    y0 = 0.3
    yU = y0 + BH + VG                  # Einheiten
    yK = yU + BH + 1.0                 # Klammer: Oberkante der Endstriche
    yKL = yK + 1.3                     # Klammer: waagerechte Linie
    yKT = yKL + 1.6                    # Klammerbeschriftung
    yS = yKT + 3.6 + 2.4               # Text zur Sicht
    yA = yS + hS + 1.4                 # gestrichelter Pfeil
    yL = yA - hL / 2                   # linker Kasten, mittig zum Pfeil
    H = round(max(yA + 1.0, yL + hL) + 0.3, 1)

    f = Fig(W, H, theme, STEM)
    lw = t.arrow_lw

    # Organigramm
    xs = [XU + i * (WU + G) for i in range(4)]
    cx = (XU + XR) / 2
    f.box(cx - WT / 2, y0, WT, BH, [P("Unternehmensleitung")], name="Unternehmensleitung")
    yb = y0 + BH + VG / 2
    f.line([(cx, y0 + BH), (cx, yb)], color=t.arrow, lw=lw, name="Linie Unternehmensleitung")
    f.line([(xs[0] + WU / 2, yb), (xs[-1] + WU / 2, yb)], color=t.arrow, lw=lw, name="Sammelleitung")
    for x, e in zip(xs, EINHEITEN):
        f.line([(x + WU / 2, yb), (x + WU / 2, yU)], color=t.arrow, lw=lw, name=f"Linie {e}")
        f.box(x, yU, WU, BH, [P(e)], name=f"Einheit {e}")

    # Klammer: Ausrichtung von Reporting/Planung
    xa, xb = XU + 0.4, XR - 0.4
    f.line([(xa, yK), (xa, yKL), (xb, yKL), (xb, yK)], color=t.accent, lw=1.0, name="Klammer")
    f.line([(cx, yKL), (cx, yKL + 1.2)], color=t.accent, lw=1.0, name="Klammer Mitte")
    f.text(XU, yKT, XR - XU, 3.6, [P(AUSRICHTUNG, bold=True, color=t.accent)], align="c", anchor="t",
           name="Ausrichtung")

    # Andere Geschäftsausrichtungen und schwache Sicht darauf
    f.box(X0, yL, WL, hL, andere_paras(ANDERE), align="l", anchor="m", name="Andere Geschäftsausrichtungen")
    f.text(XU, yS, XR - XU, hS, [P(SICHT)], align="c", anchor="t", name="Sicht")
    f.arrow([(xb, yA), (X0 + WL, yA)], role="info", dash="sysDash", name="Sicht auf andere Ausrichtungen")
    return f
