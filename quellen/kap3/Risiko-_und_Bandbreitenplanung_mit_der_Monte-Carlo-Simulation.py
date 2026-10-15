"""Abb. 3.193 – Risiko- und Bandbreitenplanung mit der Monte-Carlo-Simulation (in Anlehnung an Gleißner 2016)."""
# Muster: Plan-GuV mit sechs Risiken (R1–R6) → Simulationsergebnis als Histogramm → Schätzung der
# Ausfallwahrscheinlichkeit → Ratingnote → Finanzrating; Cashflow-Prognose als Fächer. Rot nur für das Eigenkapital (EK).
STEM = "Risiko-_und_Bandbreitenplanung_mit_der_Monte-Carlo-Simulation"
import math
from bookfig import Fig, P

W, H = 155.0, 97.0
SHY = chr(0xAD)


def build(theme):
    f = Fig(W, H, theme, STEM)
    t = theme
    A = f.arrow
    DARK = "3A3F44"

    # ---------------- Plan-GuV (links oben) ----------------
    cx0, cy0, cw, ch = 0.5, 15.0, 45.5, 43.0
    f.box(cx0, cy0, cw, ch, None, role="box_plain", name="Plan-GuV")
    f.box(cx0, cy0, cw, 5.0, [P("Plan-GuV", size="head", bold=True)], role="header", name="Kopf Plan-GuV")
    rows = [("Umsatz", "1.000", True), ("– Materialkosten", "400", False), ("= Deckungsbeitrag", "600", False),
            ("– Personalaufwand", "300", False), ("– Sonstige Kosten", "150", False),
            ("   davon Risikotransfer", "5", False), ("– AfA", "50", False), ("= Betriebsergebnis", "100", True),
            ("– Zinsaufwand", "44", False), ("– a. o. Ergebnis", "0", False), ("= Gewinn vor Steuern", "56", True)]
    rh = 3.3
    ry0 = cy0 + 5.0 + 0.9
    ry = []
    for i, (lab, val, b) in enumerate(rows):
        y = ry0 + i * rh
        ry.append(y + rh / 2)
        f.text(cx0 + 1.2, y, cw - 11, rh, [P(lab, size="small", bold=b, nowrap=True)], anchor="m",
               bg="FFFFFF", name=f"Zeile {lab.strip()}")
        f.text(cx0 + cw - 10.2, y, 9.0, rh, [P(val, size="small", bold=b)], align="r", anchor="m",
               bg="FFFFFF", name=f"Wert {lab.strip()}")

    # ---------------- Risikoleiste ----------------
    names = [f"Absatz{SHY}menge", f"Neuer Wettbe{SHY}werber", f"Material{SHY}preise", f"Perso{SHY}nal{SHY}kosten",
             f"Zins{SHY}ände{SHY}rung", f"Maschi{SHY}nen{SHY}schaden"]
    cw_r, x_r0 = 9.0, 52.0
    xr = []
    for i, n in enumerate(names):
        x = x_r0 + i * cw_r
        xr.append(x + cw_r / 2)
        f.text(x, 0.5, cw_r, 9.2, [P(n, size="small")], align="c", anchor="b", bg="FFFFFF", name=f"Risiko {n}")
        f.box(x, 10.0, cw_r, 4.2, [P(f"R{i + 1}", size="small", bold=True)], role="header",
              name=f"R{i + 1}", rounded=False)
    targets = [(0, "±5 %"), (0, "–100"), (1, "±10 %"), (3, "±2 %"), (8, "±1 %"), (9, "–200")]
    for i, (row, lab) in enumerate(targets):
        y = ry[row]
        A([(xr[i], 14.2), (xr[i], y), (cx0 + cw, y)], name=f"R{i + 1} → {rows[row][0].strip()}")
        lx = cx0 + cw + 3.6 if i != 1 else xr[0] + 1.2
        f.text(lx, y - 3.0, 8.0, 2.8, [P(lab, size="small", nowrap=True)], anchor="b", bg="FFFFFF", name=f"Wert R{i + 1}")

    # ---------------- Histogramm (rechts oben) ----------------
    hx, hy, hw, hh = 110.0, 12.5, 44.5, 45.5
    f.box(hx, hy, hw, hh, None, role="box_plain", name="Simulationsergebnis")
    f.text(hx + 1.0, hy + 0.8, 20, 2.8, [P("5.000 Läufe", size="small", nowrap=True)], bg="FFFFFF", name="Läufe")
    f.text(hx + hw - 21.0, hy + 0.8, 20, 2.8, [P("17 Ausreißer", size="small", nowrap=True)], align="r", bg="FFFFFF",
           name="Ausreißer")
    px0, px1 = hx + 2.0, hx + hw - 2.0

    def X(v):
        return px0 + (v + 250) / 500 * (px1 - px0)

    base, top = hy + 34.0, hy + 14.5
    n = 26
    bw = (px1 - px0) / n
    for i in range(n):
        v = -250 + (i + 0.5) * 500 / n
        d = math.exp(-((v - 30) / 75) ** 2 / 2) * (1.0 if v > 30 else 0.9) + 0.05 * math.exp(-((v + 180) / 60) ** 2 / 2)
        hgt = max(0.5, d * (base - top))
        f.poly([(px0 + i * bw + 0.15, base), (px0 + i * bw + 0.15, base - hgt), (px0 + (i + 1) * bw - 0.15, base - hgt),
                (px0 + (i + 1) * bw - 0.15, base)], fill="9A9A9A", name=f"Balken {i + 1}")
    f.line([(px0, base), (px1, base)], color=DARK, lw=0.5, name="Achse")
    for v, lab in ((-200, "–200"), (-100, "–100"), (0, "0"), (56, "56"), (200, "200")):
        f.line([(X(v), base), (X(v), base + 0.9)], color=DARK, lw=0.5, name=f"Teilstrich {lab}")
        f.text(X(v) - 3.0, base + 1.0, 6.0, 2.8, [P(lab, size="small", nowrap=True)], align="c", bg="FFFFFF",
               name=f"Wert {lab}")
    f.text(px0, base + 4.2, px1 - px0, 3.0, [P("Gewinn vor Steuern", size="small", italic=True)], align="c",
           bg="FFFFFF", name="Achsentitel")
    xv = X(-140)
    f.line([(xv, hy + 5.0), (xv, base)], color=DARK, lw=1.0, name="Zielniveau-Linie")
    f.line([(X(56), hy + 5.0), (X(56), base)], color=DARK, lw=1.0, name="Erwartungswert-Linie")
    f.line([(X(0), hy + 8.4), (X(0), base)], color=DARK, lw=0.75, dash="sysDot", name="Null-Linie")
    f.arrow([(xv + 0.4, hy + 6.2), (X(56) - 0.4, hy + 6.2)], head=True, dash="sysDash", name="DVaR")
    f.text(xv + 3.0, hy + 3.0, X(56) - xv - 6.0, 2.9, [P("DVaR₁%", size="small", italic=True, nowrap=True)],
           align="c", bg="FFFFFF", name="DVaR-Text")
    f.arrow([(xv + 0.4, hy + 9.4), (X(0) - 0.4, hy + 9.4)], head=True, dash="sysDash", name="EKB")
    f.text(xv + 2.0, hy + 6.5, X(0) - xv - 4.0, 2.9, [P("EKB", size="small", italic=True, nowrap=True)],
           align="c", bg="FFFFFF", name="EKB-Text")
    # Eigenkapital (EK) als einziges rotes Element
    xe = X(-100)
    f.line([(xe, hy + 19.5), (xe, base)], color=t.accent, lw=1.2, name="EK-Linie")
    f.box(xe - 3.4, hy + 14.8, 6.8, 4.6, [P("EK", size="body", bold=True, italic=True)], role="box_hi", name="EK")

    # Zielniveau-Hinweis mit Marke
    f.text(hx, 3.4, hw, 3.9, [P("Zielniveau (hier 1 %) ist ratingabhängig.", size="small", italic=True)],
           align="r", anchor="b", bg="FFFFFF", name="Zielniveau")
    f.poly([(xv - 2.0, 7.6), (xv + 2.0, 7.6), (xv, hy + 0.3)], fill=t.accent, name="Marke Zielniveau")

    # ---------------- Untere Reihe ----------------
    yb, hb = 65.0, 31.5
    FR = (0.5, 33.0)
    RT = (39.0, 34.0)
    SC = (79.0, 42.0)
    CF = (126.0, 28.5)

    def fan(x, y, w, h, title, ylab, f_lo, f_hi, f_mid, f_lo2, f_hi2):
        f.box(x, y, w, h, None, role="box_plain", name=f"Kasten {title}")
        f.text(x + 0.8, y + 0.6, w - 1.6, 6.0, [P(title, size="small", bold=True)], align="c", anchor="t",
               bg="FFFFFF", name=title)
        ax, ay, aw, ah = x + 6.0, y + 7.6, w - 11.0, h - 14.0
        f.line([(ax, ay), (ax, ay + ah), (ax + aw, ay + ah)], color=DARK, lw=0.5, name=f"Achsen {title}")
        for yy, lab in ylab:
            f.text(x + 0.1, ay + yy * ah - 1.3, 5.8, 2.6, [P(lab, size="small", nowrap=True)], align="r",
                   anchor="m", bg="FFFFFF", name=f"y {lab}")
        for k, yr in enumerate(("2008", "2012", "2016", "2020")):
            xx = ax + k / 3 * aw
            f.text(xx - 4.0, ay + ah + 0.8, 8.0, 2.8, [P(yr, size="small", nowrap=True)], align="c",
                   bg="FFFFFF", name=f"Jahr {yr}")
        N = 13
        i0 = 2                                    # 2010: Bandbreite öffnet sich (Prognosebeginn)
        xs = [ax + i / (N - 1) * aw for i in range(N)]
        Y = lambda v: ay + min(1.0, max(0.0, v)) * ah
        f.poly([(xs[i], Y(f_hi(i))) for i in range(i0, N)] + [(xs[i], Y(f_lo(i))) for i in range(N - 1, i0 - 1, -1)],
               fill="DADADA", name=f"Bandbreite außen {title}")
        f.poly([(xs[i], Y(f_hi2(i))) for i in range(i0, N)] + [(xs[i], Y(f_lo2(i))) for i in range(N - 1, i0 - 1, -1)],
               fill="B5B5B5", name=f"Bandbreite innen {title}")
        f.line([(xs[i], Y(f_mid(i))) for i in range(N)], color=DARK, lw=0.9, name=f"Verlauf {title}")

    # Finanzrating (Skala 0–6, oben = 6): Verlauf 2008–2010, danach breite Bandbreite um eine nahezu flache Mitte
    q = lambda t: 1 - t / 6.0
    fm = lambda i: q([2.5, 4.0, 3.3][i] if i < 3 else 2.8 + 0.5 * math.exp(-(i - 2) / 1.5))
    fg = lambda i: 1 - math.exp(-(max(i, 2) - 2) / 4.0)
    fan(FR[0], yb, FR[1], hb, "Finanzrating", [(0.0, "6"), (1 / 3, "4"), (2 / 3, "2"), (1.0, "0")],
        lambda i: fm(i) + (0.6 + 1.2 * fg(i)) / 6, lambda i: fm(i) - (0.5 + 2.0 * fg(i)) / 6,
        fm, lambda i: fm(i) + (0.4 + 0.4 * fg(i)) / 6, lambda i: fm(i) - (0.4 + 0.5 * fg(i)) / 6)

    # Freier Cashflow (Skala –400 bis 400, oben = 400): Einbruch 2010, danach schnell öffnende Bandbreite
    c = lambda v: 0.5 - v / 800.0
    ce = lambda i: math.exp(-(max(i, 2) - 2) / 1.2)
    cm = lambda i: c([100, 40, -200][i] if i < 3 else 20 * (1 - ce(i)) - 200 * ce(i))
    cg = lambda i: 1 - math.exp(-(max(i, 2) - 2) / 2.0)
    fan(CF[0], yb, CF[1], hb, "Freier Cashflow nach Steuern",
        [(0.0, "400"), (0.25, "200"), (0.5, "0"), (0.75, "–200"), (1.0, "–400")],
        lambda i: cm(i) - (60 + 270 * cg(i)) / 800, lambda i: cm(i) + (70 + 80 * cg(i)) / 800,
        cm, lambda i: cm(i) - (30 + 90 * cg(i)) / 800, lambda i: cm(i) + (30 + 70 * cg(i)) / 800)

    # Ratingtabelle
    f.box(RT[0], yb, RT[1], hb, None, role="box_plain", name="Ratingtabelle")
    f.text(RT[0] + 0.8, yb + 0.6, RT[1] - 1.6, 6.0, [P("Ratingnote und Ausfallwahrscheinlichkeit", size="small", bold=True)],
           align="c", bg="FFFFFF", name="Titel Ratingtabelle")
    tab = [("AAA", "0,01 %"), ("AA", "0,03 %"), ("A", "0,06 %"), ("BBB", "0,22 %"), ("BB", "1,17 %"), ("B+", "3,51 %")]
    ty = yb + 7.4
    f.box(RT[0] + 2.0, ty, RT[1] - 4.0, 3.1, None, role="header", name="Tabellenkopf", rounded=False)
    f.text(RT[0] + 3.5, ty, 12.0, 3.1, [P("Note", size="small", bold=True, nowrap=True)], anchor="m", color="FFFFFF",
           bg="3A3F44", name="Kopf Note")
    f.text(RT[0] + RT[1] - 17.0, ty, 13.5, 3.1, [P("PD", size="small", bold=True, nowrap=True)], align="r",
           anchor="m", color="FFFFFF", bg="3A3F44", name="Kopf PD")
    for i, (k, p) in enumerate(tab):
        yy = ty + 3.1 + i * 3.1
        f.text(RT[0] + 3.5, yy, 12.0, 3.1, [P(k, size="small", nowrap=True)], anchor="m", bg="FFFFFF", name=f"Klasse {k}")
        f.text(RT[0] + RT[1] - 17.0, yy, 13.5, 3.1, [P(p, size="small", nowrap=True)], align="r", anchor="m",
               bg="FFFFFF", name=f"PD {k}")
        f.line([(RT[0] + 2.0, yy + 3.1), (RT[0] + RT[1] - 2.0, yy + 3.1)], color="B5B5B5", lw=0.4, name=f"Linie {k}")

    # Schätzung der Ausfallwahrscheinlichkeit
    f.box(SC[0], yb, SC[1], hb, [
        P("Schätzung der Ausfallwahrscheinlichkeit (PD)", size="body", bold=True, align="c"),
        P("In wie viel % der simulierten Zukunftsszenarien tritt (1) Überschuldung oder (2) Illiquidität ein?",
          size="small", space_before=3),
        P("Zuordnung einer Ratingnote möglich!", size="small", italic=True, space_before=3)],
        role="box", align="l", ins=(1.6, 1.0), name="Schätzung PD")

    # ---------------- Verbindungen ----------------
    A([(cx0 + cw, ry[10]), (hx, ry[10])], name="Gewinn → Simulation")
    ym = 61.0
    A([(xe, hy + hh), (xe, ym), (SC[0] + SC[1] / 2, ym), (SC[0] + SC[1] / 2, yb)], name="Simulation → Schätzung")
    A([(CF[0] + CF[1] / 2, hy + hh), (CF[0] + CF[1] / 2, yb)], name="Simulation → Cashflow")
    A([(SC[0], yb + hb / 2), (RT[0] + RT[1], yb + hb / 2)], name="Schätzung → Ratingtabelle")
    A([(RT[0] + RT[1] / 2, yb), (RT[0] + RT[1] / 2, ym), (FR[0] + FR[1] / 2, ym), (FR[0] + FR[1] / 2, yb)],
      name="Ratingtabelle → Finanzrating")
    return f
