"""Abb. 4.12 – Rollierende Planung/rollierender Forecast."""
# Muster: Zeitachse mit Quartalsspalten (Q1 2027 … Q3 2028) und einer Zeile je Planungszeitpunkt.
# Revision 11/2026 nach Vorgabe der Prüfer vereinfacht auf sieben Zeilen in drei Gruppen:
#   1 Zeile Planung für das ganze Jahr 2027,
#   3 Zeilen YTE-Prognose (Year-to-End: Prognose bis Jahresende) ab Anfang Q2, Q3 bzw. Q4 2027,
#   3 Zeilen rollierende Planung über vier Quartale ab Anfang Q2, Q3 bzw. Q4 2027 (bis Ende Q1, Q2 bzw. Q3 2028).
# Stil: lfd. Ist anthrazit, Plan 2027 weiß mit Kontur, YTE-Prognose grau #8F8F8F, rollierende Planung hellgrau
# (box_hi) mit Kontur – Helligkeitsleiter, druckfest in Graustufen. Zeilennamen links, Kategorien einmal direkt im
# Balken beschriftet (keine Legende). Rot gepunktet: Jahreswechsel 2027/2028 (Horizont der YTE-Prognosen).
STEM = "Rollierende_Planung-rollierender_Forecast"
from bookfig import Fig, P

W = 110
X0, XR = 0.3, W - 0.3
LW = 28.5                                # Spalte der Zeilennamen
XT = X0 + LW                             # Beginn der Zeitachse
N = 7                                    # Quartale Q1 2027 … Q3 2028
CW = (XR - XT) / N
QUARTALE = ["Q1", "Q2", "Q3", "Q4", "Q1", "Q2", "Q3"]
JAHRE = [("2027", 0, 4), ("2028", 4, 7)]
IST, PLAN, YTE, ROLL = "ist", "plan", "yte", "roll"
STIL = {  # Füllung, Kontur, Textfarbe
    IST: ("3A3F44", "none", "FFFFFF"),
    PLAN: ("FFFFFF", "3A3F44", "1A1A1A"),
    YTE: ("8F8F8F", "none", "1A1A1A"),
    ROLL: ("CFCFCF", "3A3F44", "1A1A1A"),
}
# Gruppen: Liste von Zeilen (Name, [(Kategorie, von Quartal, bis Quartal, Beschriftung)])
GRUPPEN = [
    [("Planung 2027", [(PLAN, 0, 4, "Plan 2027")])],
    [("YTE-Prognose ab Q2", [(IST, 0, 1, "Ist"), (YTE, 1, 4, "YTE-Prognose")]),
     ("YTE-Prognose ab Q3", [(IST, 0, 2, "Ist"), (YTE, 2, 4, None)]),
     ("YTE-Prognose ab Q4", [(IST, 0, 3, "Ist"), (YTE, 3, 4, None)])],
    [("Rollierende Planung ab Q2", [(IST, 0, 1, "Ist"), (ROLL, 1, 5, "Rollierende Planung")]),
     ("Rollierende Planung ab Q3", [(IST, 0, 2, "Ist"), (ROLL, 2, 6, None)]),
     ("Rollierende Planung ab Q4", [(IST, 0, 3, "Ist"), (ROLL, 3, 7, None)])],
]
BH, PITCH, TRENN = 3.6, 4.8, 2.4         # Balkenhöhe, Zeilenabstand, zusätzlicher Abstand der Gruppen
FUGE = 0.4                               # weiße Fuge zwischen benachbarten Abschnitten
Y_JAHR, Y_Q = 0.3, 3.4                   # Kopfzeilen Jahr / Quartal
Y_ACHSE = 6.4                            # Unterkante der Achsenbeschriftung
GITTER = "A9A9A9"


def bx(q):
    return XT + q * CW


def build(theme):
    t = theme
    rows, y = [], Y_ACHSE + 1.2
    for gi, g in enumerate(GRUPPEN):
        if gi:
            y += TRENN
        for name, segs in g:
            rows.append((name, segs, y))
            y += PITCH
    yend = rows[-1][2] + BH + 0.8
    yn = yend + 0.8                      # Erläuterung YTE
    H = round(yn + 3.0 + 0.3, 1)
    f = Fig(W, H, theme, STEM)

    # Achse: Jahre (über die Quartale gespannt), Quartale, Gitterlinien an den Quartalsgrenzen
    for j, a, b in JAHRE:
        f.text(bx(a), Y_JAHR, bx(b) - bx(a), 3.0, [P(j, bold=True)], align="c", anchor="m", name=f"Jahr {j}")
        f.line([(bx(a) + 0.6, Y_JAHR + 3.0), (bx(b) - 0.6, Y_JAHR + 3.0)], color=t.arrow, lw=0.5,
               name=f"Jahresklammer {j}")
    for k, q in enumerate(QUARTALE):
        f.text(bx(k), Y_Q, CW, Y_ACHSE - Y_Q, [P(q, size="small")], align="c", anchor="m",
               name=f"Quartal {k + 1}")
    for k in range(N + 1):
        f.line([(bx(k), Y_ACHSE + 0.3), (bx(k), yend)], color=GITTER, lw=0.4, name=f"Gitter {k}")

    # Zeilen
    for i, (name, segs, y) in enumerate(rows):
        f.text(X0, y, LW - 1.0, BH, [P(name, size="small")], align="l", anchor="m", name=f"Zeile {i + 1} {name}"[:40])
        for kat, a, b, txt in segs:
            xa = bx(a) + (FUGE / 2 if a > 0 else 0)
            xb = bx(b) - (FUGE / 2 if b < N else 0)
            fill, line, tc = STIL[kat]
            paras = [P(txt, size="small")] if txt else None
            f.box(xa, y, xb - xa, BH, paras, role="box", rounded=False, fill=fill, line=line,
                  lw=0.75 if line != "none" else None, text_color=tc, ins=(0.6, 0.4),
                  name=f"Zeile {i + 1} {kat} {a}-{b}")

    # Jahreswechsel 2027/2028 = Horizont der YTE-Prognosen
    f.line([(bx(4), Y_ACHSE + 0.3), (bx(4), yend)], color=t.accent, lw=1.0, dash="sysDot",
           name="Jahreswechsel 2027/2028")
    f.text(X0, yn, XR - X0, 3.0, [P("YTE = Year-to-End (Prognose vom Anfang des Quartals bis zum Jahresende)",
                                     size="small", color=t.text_muted)], align="l", anchor="m", name="Erläuterung YTE")
    return f
