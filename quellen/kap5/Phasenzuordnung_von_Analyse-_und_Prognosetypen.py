"""Abb. 5.36 – Phasenzuordnung von Analyse- und Prognosetypen (Querformat, ganzseitig)."""
# Muster: Matrix wie das Excel-Objekt der Folie (sichtbarer Bereich A1:H17, ausgeblendete Zeilen 5–9 bleiben weg):
# oben die sieben Analyse- bzw. Prognosephasen mit Zeitraum und Grundfrage, links die sieben Analyse- und
# Prognosetypen; zugeordnete Felder grau (box_hi, im Original dunkelgrau), übrige weiß. Treppe von unten links
# (traditionell) nach oben rechts (präskriptiv) bleibt; Reihenfolge der Typen wie Abb. 5.35 (innen → außen) und
# Abb. 5.37 (links → rechts). Serie: Spalten-/Zeilenköpfe box, Werte box_plain, Titel header.
# Querformat 155 mm, weil sieben Phasenspalten bei 110 mm unter 6 pt fallen würden; Zellen 6 pt.
# Korrekturen: „trad. Planung/ Prognose“ → „Traditionelle Planung/Prognose“, „Real-Time Analyse“ →
# „Real-Time-Analyse“, „Zusam-menhänge“ und „Prognose-methoden“ ohne Trennstrich, „Prognosemethoden/-modellen“ →
# „-modelle“ (Genitiv Plural), Doppelpunkt in „Analyse- und Prognosetypen:“ entfällt.
STEM = "Phasenzuordnung_von_Analyse-_und_Prognosetypen"
from bookfig import Fig, P

W = 155
SHY = chr(0xAD)
SZ = 6.0
X0 = 0.3
LW = 40.0                        # Spalte Analyse- und Prognosetypen
NC = 7
CW = (W - 0.6 - LW) / NC
INS = (0.4, 0.5)
PHASEN = ["Deskriptive Analyse", "Diagnostische Analyse", "Prädiktive Analyse", "Real-Time-Analyse",
          "Traditionelle Planung/Prognose", "Prädiktive Prognose", "Präskriptive Prognose"]
ZEITRAUM = ["Vergangenheit"] * 3 + ["Gegenwart"] + ["Zukunft"] * 3
GRUNDFRAGE = ["Was ist geschehen?", "Warum ist es geschehen?", f"Welche Zusammen{SHY}hänge und Trends gibt es?",
              "Was geschieht gerade?", "Was wird erwartet?\nWas soll geschehen?", "Was könnte geschehen?",
              "Was soll getan werden?\nWas wird getan?"]
TYPEN = [  # (Text, zugeordnete Phasen 0–6)
    ("Optimierung durch Maßnahmen auf Basis statistischer Analyse- und Prognosemethoden/-modelle\n"
     "(Big-Data-Analytics)", {6}),
    ("Simulationen & Szenarien auf Basis statistischer Analyse- und Prognosemethoden/-modelle\n"
     "(Big-Data-Analytics)", {2, 5}),
    ("Forecasts/Prognosen auf Basis statistischer Analyse- und Prognosemethoden/-modelle\n(Big-Data-Analytics)",
     {2, 5}),
    ("Radar-/Scan-Analysen auf Basis statistischer Analysemethoden [Zusammenhänge, Trends etc.]\n"
     "(Big-Data-Analytics)", {2}),
    ("Monitoring mit Streamingdaten", {3}),
    ("Multidimensionale OLAP-gestützte Planung und Analyse", {0, 1, 4}),
    ("Traditionelle Planung und relationales Reporting", {0, 1, 4}),
]


def build(theme):
    t = theme
    tmp = Fig(W, 30, theme)
    m = lambda paras, w: tmp.measure(paras, w, ins=INS)
    xc = [X0 + LW + j * CW for j in range(NC)]

    h_tit = 4.6
    h_ph = max(m([P(s, size=SZ, bold=True)], CW) for s in PHASEN)
    h_zr = m([P("Vergangenheit", size=SZ)], CW)
    h_gf = max(max(m([P(s, size=SZ)], CW) for s in GRUNDFRAGE), 3.4 + h_tit)
    h_rows = [max(5.0, m([P(s, size=SZ)], LW)) for s, _ in TYPEN]
    y_tit = 0.3
    y_ph = y_tit + h_tit
    y_zr = y_ph + h_ph
    y_gf = y_zr + h_zr
    y_r = y_gf + h_gf
    H = round(y_r + sum(h_rows) + 0.3, 1)
    f = Fig(W, H, theme, STEM)

    def zelle(x, y, w, h, paras, rolle, align="c", name=""):
        f.box(x, y, w, h, paras, role=rolle, rounded=False, align=align, ins=INS, name=name)

    # ---------------- Kopf
    zelle(xc[0], y_tit, NC * CW, h_tit, [P("Analyse- bzw. Prognosephasen", size=6.5, bold=True)], "header",
          name="Titel Analyse- bzw. Prognosephasen")
    for j, s in enumerate(PHASEN):
        zelle(xc[j], y_ph, CW, h_ph, [P(s, size=SZ, bold=True)], "box", name=f"Phase {s}")
        zelle(xc[j], y_zr, CW, h_zr, [P(ZEITRAUM[j], size=SZ)], "box_plain", name=f"Zeitraum {s}")
        zelle(xc[j], y_gf, CW, h_gf, [P(GRUNDFRAGE[j], size=SZ)], "box_plain", name=f"Grundfrage {s}")
    f.text(X0, y_zr, LW - 1.2, h_zr, [P("Zeitraum", size=SZ, italic=True)], align="r", anchor="m",
           name="Zeilenkopf Zeitraum")
    f.text(X0, y_gf, LW - 1.2, h_gf - h_tit, [P("Grundfrage", size=SZ, italic=True)], align="r", anchor="t",
           ins=(0, 0.5), name="Zeilenkopf Grundfrage")
    zelle(X0, y_r - h_tit, LW, h_tit, [P("Analyse- und Prognosetypen", size=6.5, bold=True)], "header",
          name="Titel Analyse- und Prognosetypen")

    # ---------------- Zeilen
    y = y_r
    for (s, phasen), h in zip(TYPEN, h_rows):
        zelle(X0, y, LW, h, [P(s, size=SZ)], "box", align="l", name=f"Typ {s[:30]}")
        for j in range(NC):
            zelle(xc[j], y, CW, h, None, "box_hi" if j in phasen else "box_plain",
                  name=f"{s[:20]} × {PHASEN[j]}" + (" zugeordnet" if j in phasen else ""))
        y += h
    return f
