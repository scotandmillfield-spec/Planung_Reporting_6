"""Abb. 5.2 – Unterschiedliche Facetten von BI (in Anlehnung an Gluchowski 2001, S. 7, und Kemper et al. 2010, S. 4)."""
# Muster: Positionsdiagramm mit zwei Achsen (Prozessphase senkrecht, Schwerpunkt waagerecht) und drei
# ineinanderliegenden Flächen. Helligkeitsleiter statt Legende: weites BI-Verständnis box (EF),
# analyseorientiertes box_hi (CF), enges box_plain (weiß); die Flächen sind direkt beschriftet, die Legende
# rechts mit ihren schrägen Zeigerpfeilen entfällt. Begriffe an den Positionen des Originals.
STEM = "Unterschiedliche_Facetten_von_BI"
from bookfig import Fig, P, text_width_mm

W, H = 110, 74.0
SHY = chr(0xAD)
SZ = 7.0
LB = 6.5                  # Flächenbeschriftung
XA, YT, YB, XE = 20.4, 6.4, 66.0, 106.0   # Achsen: x der senkrechten, y oben/unten, Ende der waagerechten
LH = SZ * 1.18 * 25.4 / 72                # Zeilenhöhe 7 pt


def build(theme):
    f = Fig(W, H, theme, STEM)
    t = theme
    weit, ana, eng = t.role("box").fill, t.role("box_hi").fill, t.role("box_plain").fill

    def txt(x, y, s, bg, align="l", bold=False, size=SZ, n=1):
        """Freier Begriff; x = linke Kante (align l) bzw. rechte Kante (align r)."""
        ww = max(text_width_mm(z, size, bold) for z in s.split("\n")) + 1.0
        if align == "r":
            x = x - ww
        f.text(x, y, ww, n * size * 1.18 * 25.4 / 72 + 0.2, [P(s, size=size, bold=bold)], align=align, bg=bg,
               name=s.replace("\n", " ")[:30])

    # ------------------------------------------------------------ Flächen
    f.box(XA + 0.4, 8.0, 83.2, YB - 0.4 - 8.0, None, role="box", dash="sysDash", name="Weites BI-Verständnis")
    f.box(25.2, 37.4, 77.6, YB - 1.0 - 37.4, None, role="box_hi", dash="sysDash",
          name="Analyseorientiertes BI-Verständnis")
    f.box(44.0, 45.6, 29.6, 12.6, None, role="box_plain", dash="sysDash", name="Enges BI-Verständnis")

    # Flächenbeschriftungen
    txt(22.4, 9.2, "Weites BI-Verständnis", weit, bold=True, size=LB)
    txt(27.2, YB - 1.0 - 4.0, "Analyseorientiertes BI-Verständnis", ana, bold=True, size=LB)
    f.text(44.0, 46.4, 29.6, 3.0, [P("Enges BI-Verständnis", size=LB, bold=True)], align="c", bg=eng,
           name="Titel enges BI-Verständnis")

    # ------------------------------------------------------------ Begriffe
    txt(43.0, 13.4, "Extraktion", weit, align="r")
    txt(43.0, 17.4, "Transformation", weit, align="r")
    txt(34.6, 24.2, "Data Warehouse", weit)
    yr, ys, yh = 34.4, 30.0, 40.2                  # Mitte Reporting, Standard, Ad hoc
    txt(53.0, yr - LH / 2, "Reporting", weit, align="r")
    txt(58.6, ys - LH / 2, "Standard", weit)
    txt(58.6, yh - LH / 2, "Ad hoc", ana)
    xg = 55.6
    f.line([(53.4, yr), (xg, yr)], name="Reporting Gabel")
    f.arrow([(xg, yr), (xg, ys), (58.2, ys)], size="sm", name="Reporting → Standard")
    f.arrow([(xg, yr), (xg, yh), (58.2, yh)], size="sm", name="Reporting → Ad hoc")

    txt(27.6, 47.6, "Text Mining", ana)
    txt(27.6, 54.4, "Data Mining", ana)
    txt(47.4, 52.0, "OLAP", eng)
    txt(59.6, 50.4, "MIS\nEIS", eng, n=2)
    for y, s, n in ((40.0, "Kennzahlen", 1), (43.8, "BSC-Systeme", 1), (48.6, "Analytisches CRM", 1),
                    (53.4, "Planung/\nKonsolidierung", 2)):
        txt(77.6, y, s, ana, n=n)

    # ------------------------------------------------------------ Achsen
    f.line([(XA, YT), (XA, YB), (XE, YB)], name="Achsen")
    f.text(0.3, 0.3, XA - 1.5, 3.0, [P("Prozessphase", size=SZ, bold=True)], align="r", name="Achse Prozessphase")
    f.text(0.3, 8.0, XA - 1.5, 2 * LH + 0.2, [P(f"Daten{SHY}bereitstellung", size=SZ)], align="r",
           name="Datenbereitstellung")
    f.text(0.3, YB - 2 * LH - 0.6, XA - 1.5, 2 * LH + 0.2, [P(f"Daten{SHY}auswertung", size=SZ)], align="r",
           name="Datenauswertung")
    f.text(XA + 2.4, YB + 1.0, 20.0, 3.0, [P("Technik", size=SZ)], name="Technik")
    f.text(XE - 32.0, YB + 1.0, 30.0, 3.0, [P("Anwendung", size=SZ)], align="r", name="Anwendung")
    f.text(W - 30.3, YB + 4.4, 30.0, 3.0, [P("Schwerpunkt", size=SZ, bold=True)], align="r",
           name="Achse Schwerpunkt")
    return f
