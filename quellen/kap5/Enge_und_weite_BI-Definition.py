"""Abb. 5.4 – Enge und weite BI-Definition."""
# Muster: zwei Karten (betriebswirtschaftliche Sicht, IT-Sicht), jeweils oben die Steuerungs- bzw. Data-Warehouse-
# Ebene, unten die operative Ebene. Die weite BI-Definition umschließt wie im Original die oberen Teile beider
# Karten (rote gestrichelte Klammer), die enge BI-Definition ist als graue Fläche um die dritte
# Data-Warehouse-Ebene hervorgehoben (im Original nur fett gesetzt).
STEM = "Enge_und_weite_BI-Definition"
from bookfig import Fig, P, Para, MM, MSO_SHAPE, Emu

W = 110
NB = chr(0xA0)
SZ = 7.0
INS = (1.6, 1.0)


def kopf(f, x, y, w, titel):
    """Kopfleiste einer Karte (oben gerundet), Höhe aus dem Titel."""
    t = f.t
    kp = [Para(titel, size="head", bold=True)]
    kh = max(5.0, f.measure(kp, w, ins=(1.6, 0.5)))
    hr = t.role("header")
    s = f.sh.add_shape(MSO_SHAPE.ROUND_2_SAME_RECTANGLE, Emu(round(x * MM)), Emu(round(y * MM)),
                       Emu(round(w * MM)), Emu(round(kh * MM)))
    f._strip_style(s)
    s.adjustments[0] = t.role("box").radius / kh
    s.adjustments[1] = 0.0
    f._apply_role(s, hr)
    s.name = f"Kopf {titel}"
    f._fill_text(s, kp, w, kh, hr.text, "l", "m", (1.6, 0.5), label=titel, bg=hr.fill)
    return kh


def build(theme):
    t = theme
    bg = t.role("box").fill
    tmp = Fig(W, 30, theme)
    GAP = 3.0
    CW = (W - 2 * 2.2 - GAP) / 2               # Kartenbreite
    XL, XR = 2.2, 2.2 + CW + GAP
    b = lambda s: P(s, size=SZ, bullet="•", space_before=0.8)

    oben_l = [P(f"Steuerungsunterstützung für das Management:", size=SZ),
              b("Reporting/Kennzahlensysteme"), b("Planung/Prognosen"), b("Konsolidierung"), b("BSC")]
    oben_r1 = [P("Data-Warehouse-Ebenen:", size=SZ),
               P("1. Datenanbindung", size=SZ, space_before=0.8), P("2. Datenverwaltung", size=SZ, space_before=0.8)]
    eng = [P("3. Datenauswertung und -nutzung", size=SZ),
           P(f"(z.{NB}B. OLAP-Analyse, MIS, EIS", size=SZ, cont=True),
           P("→ enge BI-Definition)", size=SZ, bold=True, cont=True)]
    oben_r2 = [P("Big-Data- und KI-Technologie", size=SZ)]
    unten_l = [P("Operative Geschäftsabwicklung:", size=SZ, italic=True),
               b("Bestellungen"), b("Bearbeitungen"), b("Abrechnungen")]
    unten_r = [P("Quellsysteme zur Abwicklung der Geschäftsprozesse:", size=SZ, italic=True),
               b("ERP-Systeme"), b("Kommunikationssysteme"), b("SCM-Systeme")]

    ENW = CW - 2 * 1.6 + 1.0                   # Breite der Fläche „enge BI-Definition“
    h_ol = tmp.measure(oben_l, CW, INS)
    h_r1 = tmp.measure(oben_r1, CW, INS)
    h_eng = tmp.measure(eng, ENW, (1.0, 0.7))
    h_r2 = tmp.measure(oben_r2, CW, INS)
    h_or = h_r1 + 0.4 + h_eng + 0.4 + h_r2 - 1.0
    h_oben = max(h_ol, h_or)
    h_unten = max(tmp.measure(unten_l, CW, INS), tmp.measure(unten_r, CW, INS))

    Y0 = 7.0                                    # Oberkante der Karten (unter dem Titel der weiten Definition)
    kh = max(5.0, tmp.measure([Para("Betriebswirtschaftliche Sicht", size="head", bold=True)], CW, ins=(1.6, 0.5)))
    ys = Y0 + kh + h_oben + 1.2                # Grenze weit / operativ
    yc = ys + 2.6 + h_unten + 0.6              # Unterkante der Karten
    H = round(yc + 0.4, 1)

    f = Fig(W, H, theme, STEM)
    for x, titel in ((XL, "Betriebswirtschaftliche Sicht"), (XR, "IT-Sicht")):
        f.box(x, Y0, CW, yc - Y0, None, role="box", name=f"Karte {titel}")
        kopf(f, x, Y0, CW, titel)
    yt = Y0 + kh
    f.text(XL, yt, CW, h_oben, oben_l, ins=INS, bg=bg, name="Steuerungsunterstützung")
    f.text(XR, yt, CW, h_r1, oben_r1, ins=INS, bg=bg, name="Data-Warehouse-Ebenen")
    ye = yt + h_r1 + 0.4 - 0.6
    f.box(XR + 1.6 - 0.5, ye, ENW, h_eng, eng, role="box_hi", align="l", anchor="m", ins=(1.0, 0.7),
          name="Enge BI-Definition")
    f.text(XR, ye + h_eng + 0.4, CW, h_r2, oben_r2, ins=INS, bg=bg, name="Big Data und KI")
    f.text(XL, ys + 2.6 - 1.0, CW, h_unten, unten_l, ins=INS, bg=bg, name="Operative Geschäftsabwicklung")
    f.text(XR, ys + 2.6 - 1.0, CW, h_unten, unten_r, ins=INS, bg=bg, name="Quellsysteme")

    # Weite BI-Definition: rote gestrichelte Umrandung über beide Karten
    f.box(0.4, 0.4, W - 0.8, ys - 0.4, None, role="container", line=t.accent, lw=1.0, name="Weite BI-Definition")
    f.text(0.4, 1.0, W - 0.8, 4.6, [P("Weite BI-Definition", size="head", bold=True, color=t.accent)], align="c",
           anchor="m", name="Titel weite BI-Definition")
    return f
