"""Abb. 3.9.8.c – Integriertes Steuerungskonzept mit Cybersecurity."""
# Neue Abbildung nach Vorlage des Autors (SECURWARE 2025, mit A. Lawall), ins Deutsche übertragen.
# Muster: oben zwei Container (ökonomische und technische Sicht), Pfeile in den unteren Container; darin links eine
# kleine Risikomatrix (kritische Risiken rot, unkritische grau), das senkrechte Band Risikomanagement mit je einem
# Pfeil in jede Perspektive, rechts die Perspektivzeilen über den Spalten strategisch/operativ mit KPI und KRI.
# Die Wirkungen KRI 1 → KPI 1 und KRI 1 → KPI 2 als rote gestrichelte Akzentlinien, gebündelt, Abzweig ohne Knotenpunkt.
# Gedrehte Seitenbeschriftungen (Economic/Technical View) stehen waagerecht über dem Containertitel; Blockpfeile
# als normale Pfeile; Warndreiecke entfallen (keine Icons).
STEM = "Integriertes_Steuerungskonzept_mit_Cybersecurity"
from bookfig import Fig, P

W = 110
SHY = chr(0xAD)
ZEILEN = ["Finanzen", "Prozesse", "Markt", "Mitarbeitende", "Cyber-Resilienz"]
# Kennzahl: Zeile, Spalte (0 strategisch, 1 operativ), Platz (0 links, 1 rechts) – Lage wie im Original
KENNZAHLEN = [("KPI 1", 0, 0, 0), ("KPI 2", 1, 0, 1), ("KPI 3", 2, 1, 0), ("KPI n", 3, 0, 1), ("KRI 1", 4, 0, 0)]
# Risiken der Matrix: (Spalte, Anteil x, Zeile von oben, Anteil y, kritisch) – Lage wie im Original
RISIKEN = [(0, .72, 0, .72, 0), (1, .72, 0, .77, 1), (2, .26, 0, .45, 1), (2, .66, 0, .73, 1),
           (1, .74, 1, .30, 1), (2, .58, 1, .65, 1), (0, .48, 2, .50, 0), (1, .50, 2, .36, 0),
           (2, .68, 2, .54, 0)]


class B:
    def __init__(self, x, y, w, h):
        self.x, self.y, self.w, self.h = x, y, w, h
    @property
    def r(self): return self.x + self.w
    @property
    def b(self): return self.y + self.h
    @property
    def cx(self): return self.x + self.w / 2
    @property
    def cy(self): return self.y + self.h / 2


def build(theme):
    t = theme
    # ------------------------------------------------------------ Maße
    CT = 26.2                                  # Unterkante der oberen Container
    YU = 31.4                                  # Oberkante des unteren Containers
    YH = YU + 5.6                              # Spaltenköpfe
    RH, RG = 5.4, 1.0                          # Perspektivzeilen
    YR = YH + 4.8
    ys = [YR + i * (RH + RG) for i in range(len(ZEILEN))]
    yend = ys[-1] + RH
    H = round(yend + 1.4 + 1.6 + 0.3, 1)
    f = Fig(W, H, t, STEM)

    # ------------------------------------------------------------ obere Container
    CWID = (W - 0.6 - 2.0) / 2
    links = B(0.3, 0.3, CWID, CT - 0.3)
    rechts = B(W - 0.3 - CWID, 0.3, CWID, CT - 0.3)

    def container(c, sicht, titel):
        f.box(c.x, c.y, c.w, c.h, None, role="container", name=f"Container {titel}")
        f.text(c.x + 1.0, c.y + 0.6, c.w - 2.0, 6.0,
               [P(sicht.upper(), size="band", bold=True, color=t.band_label), P(titel, bold=True)],
               align="c", anchor="t", name=f"Titel {titel}")

    container(links, "Ökonomische Sicht", "Konzeptionsorientierte Steuerung")
    container(rechts, "Technische Sicht", "Cybersecurity")
    YO, HO, HR = 7.6, 10.6, 5.2                # obere Box, untere Box
    YRM = YO + HO + 1.4
    ix = 2.0
    # links: Controlling-Konzeption mit BSC und KPIs, darunter Risikomanagement
    ck = B(links.x + ix, YO, links.w - 2 * ix, HO)
    f.box(ck.x, ck.y, ck.w, ck.h, None, role="box_hi", name="Controlling-Konzeption")
    f.text(ck.x, ck.y + 0.7, ck.w, 3.4, [P("Controlling-Konzeption", bold=True)], align="c", anchor="m",
           bg=t.role("box_hi").fill, name="Titel Controlling-Konzeption")
    bw = 16.0
    for i, s in enumerate(("BSC", "KPIs")):
        cx = ck.x + ck.w * (0.27 if i == 0 else 0.73)
        f.box(cx - bw / 2, ck.y + 4.6, bw, 4.6, [P(s, bold=True)], role="box_plain", name=s)
    f.box(ck.x, YRM, ck.w, HR, [P("Risikomanagement", bold=True)], role="box_hi", name="Risikomanagement oben")
    # rechts: Regulatorik, KRIs
    rx, rw = rechts.x + ix, rechts.w - 2 * ix
    f.box(rx, YO, rw, HO, [P("Regulatorik", bold=True)], role="box_hi", name="Regulatorik")
    f.box(rx, YRM, rw, HR, [P("KRIs", bold=True)], role="box_hi", name="KRIs")

    # ------------------------------------------------------------ Pfeile in den unteren Container
    for c in (links, rechts):
        f.arrow([(c.cx, c.b), (c.cx, YU)], lw=1.0, name="Pfeil in das integrierte Konzept")

    # ------------------------------------------------------------ unterer Container
    unten = B(0.3, YU, W - 0.6, H - 0.3 - YU)
    f.box(unten.x, unten.y, unten.w, unten.h, None, role="container", name="Container integriertes Konzept")
    f.text(unten.x + 1.0, unten.y + 0.6, unten.w - 2.0, 3.8,
           [P("Integriertes Steuerungskonzept mit Cybersecurity", bold=True)], align="c", anchor="m",
           name="Titel integriertes Konzept")

    # Spalten strategisch / operativ (Bänder) und Perspektivzeilen
    XZ, XZE = 39.4, 108.2                      # Zeilen
    WLB = 21.6                                 # Zeilenkopf
    XS0 = XZ + WLB + 0.4
    SW = (XZE + 0.6 - XS0 - 1.0) / 2
    spalten = [B(XS0, YH, SW, yend + 1.4 - YH), B(XS0 + SW + 1.0, YH, SW, yend + 1.4 - YH)]
    for sp, s in zip(spalten, ("strategisch", "operativ")):
        f.box(sp.x, sp.y, sp.w, sp.h, None, role="band", name=f"Spalte {s}")
        f.text(sp.x, sp.y + 0.4, sp.w, 3.8, [P(s, bold=True)], align="c", anchor="m",
               bg=t.role("band").fill, name=f"Kopf {s}")
    zeilen = []
    for name, y in zip(ZEILEN, ys):
        f.box(XZ, y, XZE - XZ, RH, None, role="box_hi", name=f"Zeile {name}")
        f.text(XZ, y, WLB, RH, [P(name, bold=True)], align="l", anchor="m", ins=(1.0, 0.3),
               bg=t.role("box_hi").fill, name=f"Perspektive {name}")
        zeilen.append(B(XZ, y, XZE - XZ, RH))

    KW, KH = 9.0, RH - 1.4
    kz = {}
    for s, zi, sp, platz in KENNZAHLEN:
        c = spalten[sp]
        x = c.x + 1.6 if platz == 0 else c.r - 1.6 - KW
        b = B(x, ys[zi] + 0.7, KW, KH)
        f.box(b.x, b.y, b.w, b.h, [P(s, bold=True)], role="box_plain", ins=(0.5, 0.3), name=s)
        kz[s] = b

    # Band Risikomanagement mit je einem Pfeil in jede Perspektive
    XRM, WRM = 29.4, 5.0
    f.box(XRM, ys[0], WRM, yend - ys[0], [P("Risikomanagement", bold=True)], role="box_hi", rot=270,
          name="Risikomanagement Band")
    for z in zeilen:
        f.arrow([(XRM + WRM, z.cy), (XZ, z.cy)], name="Risikomanagement in Perspektive")

    # Wirkungen KRI 1 → KPI 1 und KRI 1 → KPI 2 (rot gestrichelt, gebündelt)
    k, p1, p2 = kz["KRI 1"], kz["KPI 1"], kz["KPI 2"]
    f.arrow([(k.cx, k.y), (p1.cx, p1.b)], role="accent", lw=1.0, dash="sysDash", size="sm", name="KRI 1 – KPI 1")
    f.arrow([(k.cx, p2.cy), (p2.x, p2.cy)], role="accent", lw=1.0, dash="sysDash", size="sm", name="KRI 1 – KPI 2")

    # ------------------------------------------------------------ Risikomatrix (klein)
    GX, CS = 3.0, 7.2
    GB = yend - 3.6
    GY = GB - 3 * CS
    GR = GX + 3 * CS
    grau = t.role("box").line
    for kk in (1, 2, 3):
        f.line([(GX + kk * CS, GY), (GX + kk * CS, GB)], color=grau, lw=0.5, dash="sysDash", name="Raster")
        f.line([(GX, GB - kk * CS), (GR, GB - kk * CS)], color=grau, lw=0.5, dash="sysDash", name="Raster")
    f.arrow([(GX, GB), (GX, GY - 4.2)], size="sm", name="Achse Eintrittswahrscheinlichkeit")
    f.arrow([(GX, GB), (GR + 2.6, GB)], size="sm", name="Achse Schadenspotenzial")
    f.text(1.6, GY - 8.2, 27.8, 3.0, [P("Eintrittswahrscheinlichkeit", size="small", bold=True)], anchor="m",
           name="Titel Eintrittswahrscheinlichkeit")
    f.text(GX, GB + 0.6, GR - GX, 3.0, [P("Schadenspotenzial", size="small", bold=True)], align="c", anchor="m",
           name="Titel Schadenspotenzial")
    DD = 2.4
    for col, fx, row, fy, krit in RISIKEN:
        x, y = GX + (col + fx) * CS, GY + (row + fy) * CS
        if krit:
            f.ellipse(x - DD / 2, y - DD / 2, DD, DD, role="box_strong", name="Risiko kritisch")
        else:
            f.ellipse(x - DD / 2, y - DD / 2, DD, DD, role="box_hi", fill="A9A9A9", line="none",
                      name="Risiko unkritisch")
    return f
