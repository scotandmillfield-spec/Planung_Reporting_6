"""Abb. 5.32 – Traditionelle und explorative BI-Architektur."""
# Muster: drei Ebenen als Bänder mit Titel oben links wie Abb. 5.16 (gleiche Ebenen und Texte); „Self-Service BI“
# (im Original Blockpfeil über alle Ebenen) als gestrichelte Querschnittsspalte links; Traditionelle BI (links) und
# Explorative BI (rechts) durch eine gestrichelte Trennlinie geteilt, Spaltentitel unten; der Blockpfeil „Big Data“
# als Pfeil unter beiden Spalten. Blau verlaufender Bereich → gestrichelter Container „Daten-Virtualisierung“.
# Ersetzt: Würfel, Zylinder und Symbole durch beschriftete Boxen; Rollen nach Abstimmung Kapitel 5: Quellsysteme box,
# Datenhaltung (Data Marts, Core Data Warehouse, ODS, CMS/DMS, Speicher im Data Lake) box_hi, Data Lake weiß mit
# Titel, kein Rot (Rot erhält in Abb. 5.38 das neu hinzukommende Sandboxing).
# Verbindungen nach der Folie: ETL-Sammelleitung aus den internen Quellen zu Core DWH, ODS, CMS/DMS, Data Lake und
# (rechts hoch) zum zweiten Data Mart; Core DWH → Data Marts; ODS → Core DWH; Data Marts, ODS, CMS/DMS, Data Lake →
# Analyse; ELT externe Quellen → Data Lake; Streaming externe Quellen → Analyse. ODS und CMS/DMS zur Analyse als
# Sammelleitung (eine Kreuzung statt zwei); Schrägpfeile orthogonal; Abzweige ohne Knotenpunkt.
# Korrekturen: „Daten - Virtualisierung“ → „Daten-Virtualisierung“, „Core DWH“ → „Core Data Warehouse“,
# „Analytische DB“ → „Analytische Datenbank“, „Sensor-Daten“ → „Sensordaten“, „Portal etc.“ → „Portale etc.“
# (wie Abb. 5.16), „Excel“ → „Tabellenkalkulation“ (softwareneutral), „B i g  D a t a“ → „Big Data“;
# Auslassungspunkte „…“ entfallen (Vorgabe Revision 2.2).
# Die Funktion zeichne() baut auch Abb. 5.38 (variante="sandbox"), damit beide Abbildungen deckungsgleich bleiben.
STEM = "Traditionelle_und_explorative_BI-Architektur"
from bookfig import Fig, P

W = 110
SHY = chr(0xAD)
TOP = 4.4                        # Titelzeile im Band
GAPB = 1.2                       # Abstand der Bänder

# Spalten (x)
XSS, WSS = 0.3, 5.0              # Querschnittsspalte Self-Service BI
XB0, XB1 = 6.5, 109.7            # Bänder
XC0, XC1 = 7.3, 108.9            # Container Daten-Virtualisierung
XA = 8.5                         # linker Inhaltsrand
XR = 108.1                       # rechter Inhaltsrand
CORE = (8.5, 16.6)               # x, Breite
ODS = (28.4, 8.0)
CMS = (38.8, 8.0)
MW = 10.0                        # Data Mart / Sandboxing
MARTS = [33.4, 45.6]
XCOL = 58.0                      # Sammelleitung ODS, CMS/DMS → Analyse
XBR = 60.2                       # Abzweig ETL-Sammelleitung → Data Mart
XDIV = 62.4                      # Trennlinie Traditionelle | Explorative BI
DL = (64.4, 40.6)                # Data Lake
XS = 106.6                       # Streaming
XETL = 26.6                      # ETL-Zuleitung
IQ = (XA, XDIV - 1.2 - XA)       # interne Quellsysteme
EQ = (XDIV + 1.2, XR - XDIV - 1.2)


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


def zeichne(theme, variante="traditionell"):
    sb = variante == "sandbox"
    t = theme
    tmp = Fig(W, 30, theme)
    analyse_p = [P("Analyse- und Planungswerkzeuge (Dashboards, Cockpits, Portale etc.)\n"
                   "sowie andere Nutzungsmöglichkeiten (Data Mining, Konsolidierung etc.) und\n"
                   "Big-Data-Analytics (Data Discovery, Data Visualization, Predictive Analytics, KI etc.)")]
    mart_p = [P("Data Mart")]
    sand_p = [P(f"Sand{SHY}boxing", bold=True)]

    # ------------------------------------------------------------ Geometrie (y)
    y3 = 0.3
    ah = tmp.measure(analyse_p, XR - XA) + 0.4
    h3 = TOP + ah + 1.4
    y2 = y3 + h3 + GAPB
    yk = y2 + 6.6                               # Oberkante Container (unter dem zweizeiligen Bandtitel)
    ym = yk + 1.6                               # Data Marts
    mh = 7.0
    yb2 = ym + mh + 2.2                         # Leitung Core DWH → Data Marts
    yj = yb2 + 1.8                              # Sammelleitung ODS, CMS/DMS → Analyse
    yB = yj + 2.2                               # Core DWH, ODS, CMS/DMS
    bh = 7.0
    ybus = yB + bh + 2.6                        # ETL-Sammelleitung
    ydl = ym + 5.4                              # Data Lake (darüber Platz für „Cloud“ in Abb. 5.38)
    dlb = ybus + 2.2
    kb = dlb + 3.8                              # Unterkante Container
    h2 = kb + 1.2 - y2
    y1 = y2 + h2 + GAPB
    tq = [P("Interne Quellsysteme mit zumeist strukturierten Daten", size=6.5, bold=True)]
    te = [P("Externe Quellen mit strukturierten und unstrukturierten Daten", size=6.5, bold=True)]
    th = max(tmp.measure(tq, IQ[1] - 2.0, ins=(0, 0)), tmp.measure(te, EQ[1] - 2.0, ins=(0, 0)))
    qh = 7.0
    ch = 0.5 + th + 0.9 + qh + 1.2
    h1 = TOP + ch + 1.2
    ycol = y1 + h1 + 1.0                        # Spaltentitel
    ybd = ycol + 6.4                            # Pfeil Big Data
    H = round(ybd + 2.0, 1)

    f = Fig(W, H, theme, "fig")
    A = f.arrow

    # ------------------------------------------------------------ Bänder
    f.band(XB0, y3, XB1 - XB0, h3, "3. Datenauswertung und -nutzung")
    f.box(XB0, y2, XB1 - XB0, h2, None, role="band", name="Band 2. Datenverwaltung und -distribution")
    f.text(XB0 + 1.6, y2 + 0.9, MARTS[0] - 1.0 - (XB0 + 1.6), 5.4,
           [P("2. DATENVERWALTUNG", size="band", bold=True, color=t.band_label),
            P("UND -DISTRIBUTION", size="band", bold=True, color=t.band_label)],
           bg=t.role("band").fill, name="Bandtitel 2. Datenverwaltung und -distribution")
    f.band(XB0, y1, XB1 - XB0, h1, "1. Datenanbindung")

    # ------------------------------------------------------------ Querschnittsspalte Self-Service BI
    f.box(XSS, y3, WSS, y1 + h1 - y3, [P("Self-Service BI", bold=True)], role="container", rot=270,
          name="Self-Service BI")

    # ------------------------------------------------------------ Ebene 3
    AN = B(XA, y3 + TOP, XR - XA, ah)
    f.box(AN.x, AN.y, AN.w, AN.h, analyse_p, role="box", name="Analyse- und Planungswerkzeuge")

    # ------------------------------------------------------------ Ebene 2: Container
    f.box(XC0, yk, XC1 - XC0, kb - yk, None, role="container", name="Daten-Virtualisierung")
    f.text(XA + 0.2, yk + 0.5, MARTS[0] - 1.0 - XA, 3.2, [P("Daten-Virtualisierung", size=6.5, bold=True)],
           align="l", anchor="t", bg=t.role("band").fill, name="Titel Daten-Virtualisierung")

    C = B(CORE[0], yB, CORE[1], bh)
    O = B(ODS[0], yB, ODS[1], bh)
    CM = B(CMS[0], yB, CMS[1], bh)
    M = [B(x, ym, MW, mh) for x in MARTS]
    D = B(DL[0], ydl, DL[1], dlb - ydl)

    # ---------------- Leitungen (unter den Kästen)
    # zur Analyse
    for i, m in enumerate(M):
        A([(m.cx, m.y), (m.cx, AN.b)], name=("Sandboxing" if sb and i == 0 else f"Data Mart {i + 1}") + " → Analyse")
    A([(O.cx, O.y), (O.cx, yj), (XCOL, yj), (XCOL, AN.b)], name="ODS → Analyse (Sammelleitung)")
    f.line([(CM.cx, CM.y), (CM.cx, yj)], name="CMS/DMS → Sammelleitung")
    xdl = D.x + 7.0
    A([(xdl, D.y), (xdl, AN.b)], name="Data Lake → Analyse")
    # Core DWH → Data Marts (bzw. Sandboxing)
    A([(C.cx, C.y), (C.cx, yb2), (M[1].cx, yb2), (M[1].cx, M[1].b)], size="sm", name="Core DWH → Data Mart 2")
    A([(M[0].cx, yb2), (M[0].cx, M[0].b)], size="sm", name="Core DWH → " + ("Sandboxing" if sb else "Data Mart 1"))
    A([(O.x, C.cy), (C.r, C.cy)], size="sm", name="ODS → Core DWH")
    # ETL-Sammelleitung
    A([(XETL, y1 + TOP), (XETL, ybus)], size="sm", name="ETL interne Quellen → Sammelleitung")
    A([(C.cx, ybus), (D.x, ybus)], size="sm", name="ETL-Sammelleitung → Data Lake")
    A([(C.cx, ybus), (C.cx, C.b)], size="sm", name="ETL → Core DWH")
    A([(O.cx, ybus), (O.cx, O.b)], size="sm", name="ETL → ODS")
    A([(CM.cx, ybus), (CM.cx, CM.b)], size="sm", name="ETL → CMS/DMS")
    A([(XBR, ybus), (XBR, M[1].cy), (M[1].r, M[1].cy)], size="sm", name="ETL → Data Mart 2")
    # explorative Seite
    xelt = D.x + 20.0
    A([(xelt, y1 + TOP), (xelt, D.b)], size="sm", name="ELT externe Quellen → Data Lake")
    A([(XS, y1 + TOP), (XS, AN.b)], name="Streaming externe Quellen → Analyse")
    lab = dict(size=6.5, italic=True)
    f.text(XETL + 0.8, ybus + 0.5, 8.0, 3.0, [P("ETL", **lab)], anchor="t", bg=t.role("band").fill,
           name="Beschriftung ETL")
    f.text(xelt + 0.8, D.b + 0.4, 8.0, 3.0, [P("ELT", **lab)], anchor="t", bg=t.role("band").fill,
           name="Beschriftung ELT")
    f.text(XS - 0.8 - 14.0, D.b + 0.4, 14.0, 3.0, [P("Streaming", **lab)], align="r", anchor="t",
           bg=t.role("band").fill, name="Beschriftung Streaming")

    # ---------------- Kästen
    f.box(C.x, C.y, C.w, C.h, [P("Core Data"), P("Warehouse")], role="box_hi", name="Core Data Warehouse")
    f.box(O.x, O.y, O.w, O.h, [P("ODS")], role="box_hi", name="ODS")
    f.box(CM.x, CM.y, CM.w, CM.h, [P("CMS/"), P("DMS")], role="box_hi", name="CMS/DMS")
    for i, m in enumerate(M):
        if sb and i == 0:
            f.box(m.x, m.y, m.w, m.h, sand_p, role="box_strong", name="Sandboxing Data Warehouse")
        else:
            f.box(m.x, m.y, m.w, m.h, mart_p, role="box_hi", name=f"Data Mart {i + 1}")

    # Data Lake
    f.box(D.x, D.y, D.w, D.h, None, role="box_plain", name="Data Lake")
    ig, ip = 1.0, 1.2
    iw = [15.2, 10.8, 10.4]
    ih = 7.0
    iy = D.b - ip - ih
    if sb:
        SB = B(D.r - ip - 15.0, D.y + ip, 15.0, iy - 1.0 - (D.y + ip))
        f.text(D.x + ip, D.y + 0.6, SB.x - 1.0 - (D.x + ip), SB.h + 0.6, [P("Data Lake", italic=True, bold=True)],
               align="l", anchor="m", name="Titel Data Lake")
    else:
        f.text(D.x + ip, D.y + 0.6, D.w - 2 * ip, iy - 0.4 - (D.y + 0.6), [P("Data Lake", italic=True, bold=True)],
               align="c", anchor="m", name="Titel Data Lake")
    ix = D.x + ip
    for w_, s in zip(iw, (f"Analytische Datenbank", "Hadoop HDFS", "NoSQL")):
        f.box(ix, iy, w_, ih, [P(s)], role="box_hi", ins=(0.5, 0.6), name=f"Data Lake {s}")
        ix += w_ + ig

    # ------------------------------------------------------------ Abb. 5.38: Sandboxing und Cloud
    if sb:
        f.box(SB.x, SB.y, SB.w, SB.h, [P("Sandboxing", bold=True)], role="box_strong", name="Sandboxing Data Lake")
        CL2 = B(SB.x + 2.0, yk + 0.9, SB.w - 4.0, 4.0)
        f.arrow([(CL2.cx, CL2.b), (CL2.cx, SB.y)], role="info", tail=False, dash="sysDash",
                name="Cloud ↔ Sandboxing Data Lake")
        f.box(CL2.x, CL2.y, CL2.w, CL2.h, [P("Cloud")], role="box", name="Cloud Data Lake")
        m = M[0]
        CL1 = B(m.x - 1.6 - 10.0, m.y + 1.5, 10.0, 4.0)
        f.arrow([(CL1.r, CL1.cy), (m.x, CL1.cy)], role="info", tail=False, dash="sysDash",
                name="Cloud ↔ Sandboxing Data Warehouse")
        f.box(CL1.x, CL1.y, CL1.w, CL1.h, [P("Cloud")], role="box", name="Cloud Data Warehouse")

    # ------------------------------------------------------------ Ebene 1
    for (x, w_), titel, quellen, nm in ((IQ, tq, ("ERP", "CRM", f"Tabellen{SHY}kalkulation"), "Interne Quellsysteme"),
                                        (EQ, te, (f"Sensor{SHY}daten", "Web-Logs", "Web-Dokumente"), "Externe Quellen")):
        G = B(x, y1 + TOP, w_, ch)
        f.box(G.x, G.y, G.w, G.h, None, role="container", name=nm)
        f.text(G.x + 1.0, G.y + 0.5, G.w - 2.0, th, titel, align="c", anchor="t", bg=t.role("band").fill,
               name=f"Titel {nm}")
        qy = G.y + 0.5 + th + 0.9
        pad, gap = 1.6, 1.6
        qw = (G.w - 2 * pad - 2 * gap) / 3
        for i, q in enumerate(quellen):
            f.box(G.x + pad + i * (qw + gap), qy, qw, qh, [P(q)], role="box", name=f"Quelle {q.replace(SHY, '')}")

    # ------------------------------------------------------------ Spalten Traditionelle | Explorative BI
    f.line([(XDIV, y2), (XDIV, ycol + 3.8)], color=t.arrow, lw=0.75, dash="dash", name="Trennlinie")
    f.text(IQ[0], ycol, IQ[1], 3.8, [P("Traditionelle BI", size="head", bold=True)], align="c", anchor="m",
           name="Spaltentitel Traditionelle BI")
    f.text(EQ[0], ycol, EQ[1], 3.8, [P("Explorative BI", size="head", bold=True)], align="c", anchor="m",
           name="Spaltentitel Explorative BI")
    xm, bw = XDIV, 13.0
    f.line([(XB0, ybd), (xm - bw / 2, ybd)], name="Big Data links")
    A([(xm + bw / 2, ybd), (XB1, ybd)], name="Big Data rechts")
    f.text(xm - bw / 2, ybd - 1.7, bw, 3.4, [P("Big Data", bold=True)], align="c", anchor="m", name="Big Data")
    return f


def build(theme):
    return zeichne(theme, "traditionell")
