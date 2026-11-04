"""Abb. 5.37 – Aufwand- und Nutzeneinschätzung von Analyse- und Prognosetypen (Querformat, ganzseitig)."""
# Muster: Bewertungsmatrix wie das Excel-Objekt der Folie (sichtbarer Bereich A38:H57): oben die sieben Analyse-
# bzw. Prognosetypen (Reihenfolge wie Abb. 5.35 innen → außen und Abb. 5.36 unten → oben), darunter die Blöcke
# Komplexität und Nutzenstiftung mit +/++/+++. Kein Diagramm mit Achsen: Das Original zeigt Einstufungen, keine
# Lage in einem Koordinatensystem. Rollen wie Abb. 5.36: Spalten-/Zeilenköpfe box, Werte box_plain, Titel header,
# Blocküberschriften box_hi. Leere Felder bleiben leer (wie im Original: kein Beitrag).
# Querformat 155 mm, weil sieben Typenspalten bei 110 mm unter 6 pt fallen würden; Zellen 6 pt, Wertungen 7 pt.
# Korrekturen: „Trad. Planung und Reporting“ → „Traditionelle Planung und Reporting“, „Forecasts/ Prognosen“ und
# „Optimierung/ Maßnahmen“ ohne Leerzeichen, „Web-Mining/ Predictive-Analytics“ → „Web-Mining/Predictive Analytics“,
# „(DWH)“ → „(Data Warehouse)“.
STEM = "Aufwand-_und_Nutzeneinschaetzung_von_Analyse-_und_Prognosetypen"
from bookfig import Fig, P

W = 155
SHY = chr(0xAD)
NB = chr(0xA0)
SZ = 6.0
X0 = 0.3
LW = 32.0                        # Spalte Kriterien
NC = 7
CW = (W - 0.6 - LW) / NC
INS = (0.4, 0.5)
RH = 3.7                         # Zeilenhöhe Wertungszeilen
TYPEN = ["Traditionelle Planung und Reporting", "OLAP-gestützte Planung/Analyse",
         f"Monitoring mit Streaming{SHY}daten", "Radar-/Scan-Analysen", "Forecasts/Prognosen",
         "Simulationen & Szenarien", "Optimierung/Maßnahmen"]
# Zeilen: (Art, Beschriftung, Werte) – Art: blk = Blocküberschrift, grp = Gruppe mit Text über Spaltenbereiche,
# sub = eingerückte Wertungszeile, val = Wertungszeile
ZEILEN = [
    ("blk", "Komplexität", None),
    ("grp", "Technologieeinsatz und Know-how generell",
     [(0, 1, f"u.{NB}a. relationale Datenbanken, Software"), (1, 1, f"u.{NB}a. OLAP-Datenbanken und Software"),
      (2, 5, f"u.{NB}a. traditionelle (Data Warehouse) und explorative BI-Technologie (Big-Data-Analytics) mit verteilter "
             f"Datenhaltung, NoSQL, In-Memory-Technik und Software")]),
    ("sub", "Tools", ["+", "++", "+++", "+++", "+++", "+++", "+++"]),
    ("sub", "Know-how", ["+", "++", "+++", "+++", "+++", "+++", "+++"]),
    ("grp", "Einsatz statistischer Methoden und Modelle",
     [(0, 3, "nicht zwingend, aber möglich"), (3, 4, f"u.{NB}a. Data-, Text-, Web-Mining/Predictive Analytics")]),
    ("sub", "Tools", ["+", "++", "+", "+++", "+++", "+++", "+++"]),
    ("sub", "Know-how", ["+", "++", "+", "+++", "+++", "+++", "+++"]),
    ("blk", "Nutzenstiftung", None),
    ("val", "Dokumentation", ["++", "+++", "+", "+", "", "", ""]),
    ("val", "Koordination", ["++", "+++", "+", "+", "+", "+", "+"]),
    ("val", "Gestaltung", ["++", "+++", "", "+", "+", "+", "+"]),
    ("val", "Prognose", ["+", "++", "", "", "+++", "+++", "+++"]),
    ("val", "Zielsetzung", ["++", "+++", "", "", "+", "+", "+"]),
    ("val", "Zielerreichung", ["++", "+++", "+", "+", "", "", ""]),
    ("val", "Gesamtsteuerung", ["++", "+++", "", "", "+", "+", ""]),
    ("val", "Selektive Steuerung", ["+", "++", "+", "++", "++", "++", "+++"]),
    ("val", "Innovation", ["+", "++", "+", "+++", "+++", "+++", "+++"]),
    ("val", "Reaktionsvorteil", ["+", "++", "++", "+++", "+++", "+++", "+++"]),
]


def build(theme):
    tmp = Fig(W, 30, theme)
    m = lambda paras, w: tmp.measure(paras, w, ins=INS)
    xc = [X0 + LW + j * CW for j in range(NC)]

    h_tit = 4.6
    h_typ = max(m([P(s, size=SZ, bold=True)], CW) for s in TYPEN)
    hs = []
    for art, txt, werte in ZEILEN:
        if art == "blk":
            hs.append(4.4)
        elif art == "grp":
            h = m([P(txt, size=SZ, bold=True)], LW)
            for a, n, s in werte:
                h = max(h, m([P(s, size=SZ)], n * CW))
            hs.append(h)
        else:
            hs.append(RH)
    y_tit = 0.3
    y_typ = y_tit + h_tit
    y_r = y_typ + h_typ
    H = round(y_r + sum(hs) + 0.3, 1)
    f = Fig(W, H, theme, STEM)

    def zelle(x, y, w, h, paras, rolle, align="c", name="", ins=INS):
        f.box(x, y, w, h, paras, role=rolle, rounded=False, align=align, ins=ins, name=name)

    # ---------------- Kopf
    zelle(xc[0], y_tit, NC * CW, h_tit, [P("Analyse- bzw. Prognosetypen", size=6.5, bold=True)], "header",
          name="Titel Analyse- bzw. Prognosetypen")
    for j, s in enumerate(TYPEN):
        zelle(xc[j], y_typ, CW, h_typ, [P(s, size=SZ, bold=True)], "box", name=f"Typ {s.replace(SHY, '')}")

    # ---------------- Zeilen
    y = y_r
    for (art, txt, werte), h in zip(ZEILEN, hs):
        if art == "blk":
            zelle(X0, y, LW + NC * CW, h, [P(txt, size=6.5, bold=True)], "box_hi", align="l", ins=(1.0, 0.5),
                  name=f"Block {txt}")
        elif art == "grp":
            zelle(X0, y, LW, h, [P(txt, size=SZ, bold=True)], "box", align="l", ins=(1.0, 0.5),
                  name=f"Gruppe {txt}")
            for a, n, s in werte:
                zelle(xc[a], y, n * CW, h, [P(s, size=SZ)], "box_plain", name=f"{txt[:20]} {a + 1}–{a + n}")
        else:
            einzug = 3.2 if art == "sub" else 1.0
            zelle(X0, y, LW, h, [P(txt, size=SZ, bold=art == "val")], "box", align="l", ins=(einzug, 0.3),
                  name=f"Kriterium {txt} {y:.0f}")
            for j, v in enumerate(werte):
                zelle(xc[j], y, CW, h, [P(v, size=7.0)] if v else None, "box_plain",
                      ins=(0.4, 0.2), name=f"{txt} × {TYPEN[j][:18]}")
        y += h
    return f
