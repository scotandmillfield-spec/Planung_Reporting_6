"""Abb. 5.56 – Aufbau von mobilen BI-Systemen."""
# Muster: Erweiterung von Abb. 5.32/5.38 (gleiche Geometrie, Texte und Rollen für den stationären Teil, Ebene
# „Datenauswertung und -nutzung“ ersetzt durch die mobilen BI-Komponenten). Vier Schichten als Bänder mit Titel
# oben links (Zeilenbeschriftungen des Originals): Mobile Datenauswertung und -nutzung, Mobile Datenverwaltung und
# -distribution, Stationäre Datenverwaltung und -distribution, Stationäre Datenanbindung. Die gedrehten
# Gruppenbeschriftungen „Mobile BI-Komponenten“ und „Stationäre BI-Komponenten“ werden Klammern am linken Rand.
# Mobile BI-Anwendung (im Original Rahmen um beide mobilen Zeilen) als gestrichelte Gruppe über beide mobilen
# Bänder: oben Mobile BI-Client (Schlüsselelement, rot – in Abb. 5.57 ebenso), darunter Mobile Data Marts
# (Datenhaltung box_hi) mit Mobilitätsunterstützung. Fahne mit Blitz „Direktverbindung“ → kursive Beschriftung am
# Pfeil Sandboxing → Mobile BI-Client. Wolken → beschriftete Boxen, Gedankenblasen → gestrichelte Zuordnung.
# Sandboxing grau (Datenhaltung); Rot hat hier der Mobile BI-Client. Würfel, Zylinder, Blauverlauf entfallen.
# Verbindungen nach der Folie: Data Mart, ODS, CMS/DMS (als Sammelleitung wie Abb. 5.32), Data Lake und Streaming
# → mobile Datenverwaltung; Mobile Data Marts → Mobile BI-Client; stationärer Teil wie Abb. 5.38.
# Korrekturen wie Abb. 5.32: „Daten - Virtualisierung“ → „Daten-Virtualisierung“, „Core DWH“ → „Core Data
# Warehouse“, „Analytische DB“ → „Analytische Datenbank“, „Sensor-Daten“ → „Sensordaten“, „Excel“ →
# „Tabellenkalkulation“ (softwareneutral); „…“ entfallen.
# Die Funktion mobilblock() zeichnet auch die mobilen BI-Komponenten in Abb. 5.57 (gleiche Begriffe und Rollen).
STEM = "Aufbau_von_mobilen_BI-Systemen"
from bookfig import Fig, P

W = 110
SHY = chr(0xAD)
TOP = 4.4                        # Titelzeile im Band (einzeilig)
GAPB = 1.2                       # Abstand der Bänder

# Spalten (x) – stationärer Teil wie Abb. 5.32/5.38
XB0, XB1 = 6.5, 109.7            # Bänder
XC0, XC1 = 7.3, 108.9            # Container Daten-Virtualisierung
XA = 7.7                         # Rand der Kästen in der Datenanbindung
XR = 108.5
XI = 8.5                         # linker Inhaltsrand im Container
CORE = (8.5, 16.6)               # x, Breite
ODS = (27.6, 7.6)
CMS = (37.4, 9.0)
MW = 10.0                        # Data Mart / Sandboxing
MARTS = [32.6, 44.2]
XCOL = 56.2                      # Sammelleitung ODS, CMS/DMS → mobile Datenverwaltung
XBR = 58.2                       # Abzweig ETL-Sammelleitung → Data Mart
XDIV = 60.2                      # Trennlinie Traditionelle | Explorative BI
DL = (62.2, 42.6)                # Data Lake
XS = 106.6                       # Streaming
XETL = 51.8                      # ETL-Zuleitung
IQ = (XA, XDIV - 1.2 - XA)       # interne Quellsysteme
EQ = (XDIV + 1.2, XR - XDIV - 1.2)

# Mobiler Block (x) – gemeinsam mit Abb. 5.57
XT = 8.1                         # Bandtitel
XM0, XM1 = 31.6, XC1             # Container Mobile BI-Anwendung
XDV = MARTS[0] + MW / 2          # Direktverbindung (über dem Sandboxing)
XCL = 59.0                       # Mobile BI-Client links
XIR = 108.1                      # rechter Rand der Kästen im Container
XRW = 40.0                       # Zeile mobile Datenverwaltung links
MDM = (41.2, 22.4)               # Mobile Data Marts
XMC = 61.4                       # Pfeil Mobile Data Marts → Client
XKL = 4.9                        # Klammer der Komponentengruppen

H4 = 12.8                        # Band mobile Datenauswertung
H3 = 14.6                        # Band mobile Datenverwaltung


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


def bandtitel(f, t, x, y, zeilen, name):
    f.text(x, y + 0.9, 24.0, len(zeilen) * 2.5 + 0.4,
           [P(z, size="band", bold=True, color=t.band_label) for z in zeilen],
           bg=t.role("band").fill, name=f"Bandtitel {name}")


def klammer(f, t, y0, y1, text):
    """Gruppenklammer am linken Rand: senkrechte Linie mit Endstrichen und gedrehter Beschriftung."""
    f.line([(XKL + 1.0, y0 + 0.4), (XKL, y0 + 0.4), (XKL, y1 - 0.4), (XKL + 1.0, y1 - 0.4)], color=t.arrow,
           lw=0.75, name=f"Klammer {text}")
    f.text(0.3, y0, XKL - 0.9, y1 - y0, [P(text, size=6.5, bold=True)], align="c", anchor="m", rot=270,
           name=f"Gruppe {text}")


def mobilblock(f, t, y4, direkt_ab=None):
    """Mobile BI-Komponenten: zwei Bänder, Gruppe Mobile BI-Anwendung, Klammer.
    direkt_ab: y-Anfang des Pfeils „Direktverbindung“ (Standard: Unterkante des Bandes).
    Liefert Container und Zeilenkasten (für Anschlüsse von außen)."""
    y3 = y4 + H4 + GAPB
    f.band(XB0, y4, XB1 - XB0, H4, "", name="Band Mobile Datenauswertung und -nutzung")
    f.band(XB0, y3, XB1 - XB0, H3, "", name="Band Mobile Datenverwaltung und -distribution")
    bandtitel(f, t, XT, y4, ["MOBILE", "DATENAUSWERTUNG", "UND -NUTZUNG"], "Mobile Datenauswertung und -nutzung")
    bandtitel(f, t, XT, y3, ["MOBILE", "DATENVERWALTUNG", "UND -DISTRIBUTION"],
              "Mobile Datenverwaltung und -distribution")
    klammer(f, t, y4, y3 + H3, "Mobile BI-Komponenten")

    C = B(XM0, y4 + 1.4, XM1 - XM0, y3 + H3 - 1.2 - (y4 + 1.4))
    CL = B(XCL, C.y + 3.8, XIR - XCL, 6.2)
    RW = B(XRW, y3 + 1.4, XIR - XRW, 10.6)
    M = B(MDM[0], RW.y + 1.0, MDM[1], RW.h - 2.0)

    # Container Mobile BI-Anwendung
    f.box(C.x, C.y, C.w, C.h, None, role="container", name="Mobile BI-Anwendung")
    f.text(C.x + 1.0, C.y + 0.3, C.w - 2.0, 3.0, [P("Mobile BI-Anwendung", size=6.5, bold=True)], align="c",
           anchor="t", bg=t.role("band").fill, name="Titel Mobile BI-Anwendung")

    # Leitungen
    y0 = direkt_ab if direkt_ab is not None else y3 + H3
    f.arrow([(XDV, y0), (XDV, CL.cy), (CL.x, CL.cy)], name="Direktverbindung → Mobile BI-Client")
    f.text(XDV + 0.8, CL.cy - 3.6, CL.x - XDV - 2.6, 3.0, [P("Direktverbindung", size=6.5, italic=True)],
           align="l", anchor="b", bg=t.role("band").fill, name="Beschriftung Direktverbindung")
    f.arrow([(XMC, M.y), (XMC, CL.b)], name="Mobile Data Marts → Mobile BI-Client")

    # Kästen
    f.box(CL.x, CL.y, CL.w, CL.h, [P("Mobile BI-Client", bold=True)], role="box_strong", name="Mobile BI-Client")
    f.box(RW.x, RW.y, RW.w, RW.h, None, role="box_plain", name="Mobile Datenverwaltung")
    f.box(M.x, M.y, M.w, M.h, [P("Mobile Data Marts")], role="box_hi", name="Mobile Data Marts")
    f.text(M.r + 1.2, RW.y + 0.6, RW.r - M.r - 2.0, RW.h - 1.2,
           [P("Mobilitätsunterstützung durch Replikations-, Synchronisations- und Sicherheitsmechanismen",
              size=6.5)], align="l", anchor="m", bg=t.role("box_plain").fill, name="Mobilitätsunterstützung")
    return C, RW, y3 + H3


def build(theme):
    t = theme
    tmp = Fig(W, 30, theme)
    mart_p = [P("Data Mart")]

    # ------------------------------------------------------------ Geometrie (y)
    y4 = 0.3
    y2 = y4 + H4 + GAPB + H3 + GAPB
    yk = y2 + 9.4                               # Oberkante Container (unter dem dreizeiligen Bandtitel)
    ym = yk + 1.6                               # Data Marts
    mh = 7.0
    yb2 = ym + mh + 2.2                         # Leitung Core DWH → Data Marts
    yj = yb2 + 1.8                              # Sammelleitung ODS, CMS/DMS
    yB = yj + 2.2                               # Core DWH, ODS, CMS/DMS
    bh = 7.0
    ybus = yB + bh + 2.6                        # ETL-Sammelleitung
    ydl = ym + 5.4                              # Data Lake
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
    H = round(ycol + 4.2, 1)

    f = Fig(W, H, theme, STEM)
    A = f.arrow

    # ------------------------------------------------------------ Bänder stationär
    f.band(XB0, y2, XB1 - XB0, h2, "", name="Band Stationäre Datenverwaltung und -distribution")
    bandtitel(f, t, XT, y2, ["STATIONÄRE", "DATENVERWALTUNG", "UND -DISTRIBUTION"],
              "Stationäre Datenverwaltung und -distribution")
    f.band(XB0, y1, XB1 - XB0, h1, "Stationäre Datenanbindung")
    klammer(f, t, y2, y1 + h1, "Stationäre BI-Komponenten")

    # ------------------------------------------------------------ Mobile BI-Komponenten
    C = B(CORE[0], yB, CORE[1], bh)
    O = B(ODS[0], yB, ODS[1], bh)
    CM = B(CMS[0], yB, CMS[1], bh)
    M = [B(x, ym, MW, mh) for x in MARTS]
    D = B(DL[0], ydl, DL[1], dlb - ydl)
    MC, RW, _ = mobilblock(f, t, y4, direkt_ab=M[0].y)

    # ------------------------------------------------------------ Container Daten-Virtualisierung
    f.box(XC0, yk, XC1 - XC0, kb - yk, None, role="container", name="Daten-Virtualisierung")
    f.text(XI - 0.2, yk + 0.5, MARTS[0] - XI, 3.2, [P("Daten-Virtualisierung", size=6.5, bold=True)],
           align="l", anchor="t", bg=t.role("band").fill, name="Titel Daten-Virtualisierung")

    # ---------------- Leitungen zur mobilen Datenverwaltung
    A([(M[1].cx, M[1].y), (M[1].cx, RW.b)], name="Data Mart → mobile Datenverwaltung")
    A([(O.cx, O.y), (O.cx, yj), (XCOL, yj), (XCOL, RW.b)], name="ODS → mobile Datenverwaltung (Sammelleitung)")
    f.line([(CM.cx, CM.y), (CM.cx, yj)], name="CMS/DMS → Sammelleitung")
    xdl = D.x + 7.0
    A([(xdl, D.y), (xdl, RW.b)], name="Data Lake → mobile Datenverwaltung")
    # Core DWH → Sandboxing und Data Mart
    A([(C.cx, C.y), (C.cx, yb2), (M[1].cx, yb2), (M[1].cx, M[1].b)], size="sm", name="Core DWH → Data Mart")
    A([(M[0].cx, yb2), (M[0].cx, M[0].b)], size="sm", name="Core DWH → Sandboxing")
    A([(O.x, C.cy), (C.r, C.cy)], size="sm", name="ODS → Core DWH")
    # ETL-Sammelleitung
    A([(XETL, y1 + TOP), (XETL, ybus)], size="sm", name="ETL interne Quellen → Sammelleitung")
    A([(C.cx, ybus), (D.x, ybus)], size="sm", name="ETL-Sammelleitung → Data Lake")
    A([(C.cx, ybus), (C.cx, C.b)], size="sm", name="ETL → Core DWH")
    A([(O.cx, ybus), (O.cx, O.b)], size="sm", name="ETL → ODS")
    A([(CM.cx, ybus), (CM.cx, CM.b)], size="sm", name="ETL → CMS/DMS")
    A([(XBR, ybus), (XBR, M[1].cy), (M[1].r, M[1].cy)], size="sm", name="ETL → Data Mart")
    # explorative Seite
    xelt = D.x + 20.0
    A([(xelt, y1 + TOP), (xelt, D.b)], size="sm", name="ELT externe Quellen → Data Lake")
    A([(XS, y1 + TOP), (XS, RW.b)], name="Streaming externe Quellen → mobile Datenverwaltung")
    lab = dict(size=6.5, italic=True)
    f.text(XETL + 0.8, ybus + 0.5, 8.0, 3.0, [P("ETL", **lab)], anchor="t", bg=t.role("band").fill,
           name="Beschriftung ETL")
    f.text(xelt + 0.8, D.b + 0.4, 8.0, 3.0, [P("ELT", **lab)], anchor="t", bg=t.role("band").fill,
           name="Beschriftung ELT")
    f.text(XS - 0.8 - 14.0, D.b + 0.4, 14.0, 3.0, [P("Streaming", **lab)], align="r", anchor="t",
           bg=t.role("band").fill, name="Beschriftung Streaming")

    # ---------------- Kästen
    f.box(C.x, C.y, C.w, C.h, [P("Core Data"), P("Warehouse")], role="box_hi", name="Core Data Warehouse")
    f.box(O.x, O.y, O.w, O.h, [P("ODS")], role="box_hi", ins=(0.5, 0.6), name="ODS")
    f.box(CM.x, CM.y, CM.w, CM.h, [P("CMS/"), P("DMS")], role="box_hi", name="CMS/DMS")
    f.box(M[0].x, M[0].y, M[0].w, M[0].h, [P(f"Sand{SHY}boxing")], role="box_hi", ins=(0.5, 0.6),
          name="Sandboxing Data Warehouse")
    f.box(M[1].x, M[1].y, M[1].w, M[1].h, mart_p, role="box_hi", name="Data Mart")

    # Data Lake mit Sandboxing
    f.box(D.x, D.y, D.w, D.h, None, role="box_plain", name="Data Lake")
    ig, ip = 1.0, 1.2
    iw = [15.0, 11.6, 11.6]
    ih = 7.0
    iy = D.b - ip - ih
    SB = B(D.r - ip - 16.4, iy - 1.2 - 6.0, 16.4, 6.0)
    f.text(D.x + ip, SB.y, SB.x - 1.0 - (D.x + ip), SB.h, [P("Data Lake", italic=True, bold=True)],
           align="l", anchor="m", name="Titel Data Lake")
    ix = D.x + ip
    for w_, s in zip(iw, ("Analytische Datenbank", "Hadoop HDFS", "NoSQL")):
        f.box(ix, iy, w_, ih, [P(s)], role="box_hi", ins=(0.5, 0.6), name=f"Data Lake {s}")
        ix += w_ + ig
    f.box(SB.x, SB.y, SB.w, SB.h, [P("Sandboxing")], role="box_hi", ins=(0.5, 0.6), name="Sandboxing Data Lake")

    # Cloud (wie Abb. 5.38)
    CL2 = B(SB.x + 2.0, yk + 0.9, SB.w - 4.0, 4.0)
    f.arrow([(CL2.cx, CL2.b), (CL2.cx, SB.y)], role="info", tail=False, dash="sysDash",
            name="Cloud ↔ Sandboxing Data Lake")
    f.box(CL2.x, CL2.y, CL2.w, CL2.h, [P("Cloud")], role="box", name="Cloud Data Lake")
    m = M[0]
    CL1 = B(m.x - 1.6 - 10.0, m.b - 4.0, 10.0, 4.0)
    f.arrow([(CL1.r, CL1.cy), (m.x, CL1.cy)], role="info", tail=False, dash="sysDash",
            name="Cloud ↔ Sandboxing Data Warehouse")
    f.box(CL1.x, CL1.y, CL1.w, CL1.h, [P("Cloud")], role="box", name="Cloud Data Warehouse")

    # ------------------------------------------------------------ Datenanbindung
    for (x, w_), titel, quellen, nm in ((IQ, tq, ("ERP", "CRM", f"Tabellen{SHY}kalkulation"), "Interne Quellsysteme"),
                                        (EQ, te, (f"Sensor{SHY}daten", "Web-Logs", "Web-Dokumente"), "Externe Quellen")):
        G = B(x, y1 + TOP, w_, ch)
        f.box(G.x, G.y, G.w, G.h, None, role="container", name=nm)
        f.text(G.x + 1.0, G.y + 0.5, G.w - 2.0, th, titel, align="c", anchor="t", bg=t.role("band").fill,
               name=f"Titel {nm}")
        qy = G.y + 0.5 + th + 0.9
        pad, gap = 1.0, 1.0
        qw = (G.w - 2 * pad - 2 * gap) / 3
        for i, q in enumerate(quellen):
            f.box(G.x + pad + i * (qw + gap), qy, qw, qh, [P(q)], role="box", ins=(0.4, 0.6),
                  name=f"Quelle {q.replace(SHY, '')}")

    # ------------------------------------------------------------ Spalten Traditionelle | Explorative BI
    f.line([(XDIV, y2), (XDIV, ycol + 3.8)], color=t.arrow, lw=0.75, dash="dash", name="Trennlinie")
    f.text(IQ[0], ycol, IQ[1], 3.8, [P("Traditionelle BI", size="head", bold=True)], align="c", anchor="m",
           name="Spaltentitel Traditionelle BI")
    f.text(EQ[0], ycol, EQ[1], 3.8, [P("Explorative BI", size="head", bold=True)], align="c", anchor="m",
           name="Spaltentitel Explorative BI")
    return f
