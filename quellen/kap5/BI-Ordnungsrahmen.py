"""Abb. 5.1 – BI-Ordnungsrahmen (in Anlehnung an Kemper et al. 2010, S. 11)."""
# Muster: Ordnungsrahmen als Bänder (wie Abb. 5.6). Die drei Schichten des BI-Rahmens sind Bänder mit Titel
# oben links, „Metadaten“ links und „Systemintegration“ rechts laufen als senkrechte Spalten über alle Schichten.
# Darunter das Band der Quellsysteme. Einheitliche Rollen mit Abb. 5.6 (Abstimmung Kapitel 5): Quell- und
# operative Systeme box, Datenhaltung box_hi, Data Warehouse als Schlüsselelement rot, Analyse/Präsentation box,
# Querschnittsfunktionen gestrichelte Spalte.
# Entfernt: Zylinder- und Trapezformen, Blockpfeile, Schatten, Copyright-Zeile (Quelle gehört in die Caption),
# Platzhalter „…“ (Autorenwunsch, vgl. Abb. 2.2).
STEM = "BI-Ordnungsrahmen"
from bookfig import Fig, P

W = 110
SZ = 7.0                 # Elemente
BH = 5.0                 # Standardhöhe Element
TOP = 4.4                # Titelzeile im Band


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
    tmp = Fig(W, 30, theme)
    dwh_p = [P("Data Mart", size=SZ, bold=True), P("Core Data Warehouse", size=SZ, bold=True),
             P("Operational Data Store", size=SZ, bold=True)]
    DWH_H = tmp.measure(dwh_p, 40) + 0.6

    # ------------------------------------------------------------ Geometrie
    CX0, CW = 0.2, W - 0.4                     # Container Business Intelligence
    XM, WM = 1.8, 5.4                          # Spalte Metadaten
    XB0, XB1 = 8.8, 100.4                      # Bänder
    XS = 106.6                                 # Pfeil Systemintegration
    xa, xb = XB0 + 1.6, XB1 - 1.6              # Inhalt der Bänder
    L = B(xa, 0, 54.0, 0)                      # linke Spalte (Analyse, Data Warehouse)
    R = B(xa + 54.0 + 5.6, 0, xb - (xa + 59.6), 0)  # rechte Spalte
    XP = L.r - 3.0                             # Pfeil Analyse → Portal (rechts vom Bandtitel)
    XD = L.x + 34.0                            # Pfeil Analyse ↔ Data Warehouse

    y1 = 6.2                                   # Band Informationszugriff
    h1 = TOP + BH + 1.2
    y2 = y1 + h1 + 1.2                         # Band Informationsgenerierung/-distribution
    h2 = TOP + 7.0 + 1.2
    y3 = y2 + h2 + 1.2                         # Band Datenbereitstellung
    h3 = TOP + DWH_H + 1.2
    cb = y3 + h3 + 1.6                         # Unterkante Container
    yq = cb + 6.0                              # Band Quellsysteme
    QB = 4.6                                   # Höhe Quellsystem
    hq = TOP + 0.4 + QB + 2.2 + (1.0 + QB + 1.0) + 1.2
    H = round(yq + hq + 0.2, 1)

    f = Fig(W, H, theme, STEM)
    A = f.arrow

    # ------------------------------------------------------------ Container BI
    f.box(CX0, 0.2, CW, cb - 0.2, None, role="container", name="Business Intelligence")
    f.text(CX0, 0.9, CW, 4.0, [P("Business Intelligence (BI)", size="head", bold=True)], align="c",
           anchor="m", name="Titel Business Intelligence")

    # ------------------------------------------------------------ Bänder
    f.band(XB0, y1, XB1 - XB0, h1, "Informationszugriff")
    f.band(XB0, y2, XB1 - XB0, h2, "Informationsgenerierung/-distribution")
    f.band(XB0, y3, XB1 - XB0, h3, "Datenbereitstellung")

    # Informationszugriff
    POR = B(xa, y1 + TOP, xb - xa, BH)
    f.box(POR.x, POR.y, POR.w, POR.h, [P("BI-Portal", size=SZ)], name="BI-Portal")
    # Informationsgenerierung/-distribution
    AN = B(L.x, y2 + TOP, L.w, 7.0)
    ID = B(R.x, y2 + TOP, R.w, 7.0)
    f.box(AN.x, AN.y, AN.w, AN.h, [P("Analysesysteme", size=SZ)], name="Analysesysteme")
    f.box(ID.x, ID.y, ID.w, ID.h, [P("Informationsdistribution", size=SZ)], name="Informationsdistribution")
    # Datenbereitstellung
    DW = B(L.x, y3 + TOP, L.w, DWH_H)
    CM = B(R.x, y3 + TOP, R.w, DWH_H)
    f.box(DW.x, DW.y, DW.w, DW.h, dwh_p, role="box_strong", name="Data Warehouse")
    f.box(CM.x, CM.y, CM.w, CM.h, [P("Content & Document Management", size=SZ)],
          name="Content & Document Management")

    # Verbindungen zwischen den Schichten
    A([(XP, AN.y), (XP, POR.b)], name="Analysesysteme → BI-Portal")
    A([(ID.cx, ID.y), (ID.cx, POR.b)], name="Informationsdistribution → BI-Portal")
    A([(AN.r, AN.cy), (ID.x, ID.cy)], head=True, tail=True, name="Analysesysteme ↔ Informationsdistribution")
    A([(XD, AN.b), (XD, DW.y)], head=True, tail=True, name="Analysesysteme ↔ Data Warehouse")
    A([(ID.cx, ID.b), (ID.cx, CM.y)], head=True, tail=True, name="Informationsdistribution ↔ Content")
    A([(CM.x, CM.cy), (DW.r, CM.cy)], name="Content → Data Warehouse")

    # ------------------------------------------------------------ Querschnittsspalten
    f.box(XM, y1, WM, y3 + h3 - y1, [P("Metadaten", size=SZ, bold=True)], role="container", rot=270,
          name="Metadaten")
    A([(XS, y3 + h3), (XS, y1)], name="Systemintegration")
    f.text(XS - 5.0, y1, 3.6, y3 + h3 - y1, [P("Systemintegration", size=SZ, bold=True)], align="c",
           anchor="m", rot=270, name="Beschriftung Systemintegration")

    # ------------------------------------------------------------ Quellsysteme
    f.band(CX0, yq, CW, hq, "Externe und operative Systeme mit strukturierten und unstrukturierten Daten")
    qw, qg, qx = 19.4, 2.0, 2.8
    r1 = yq + TOP + 0.4
    r2 = r1 + QB + 2.2 + 1.0
    for i, s in enumerate(("SCM", "E-Procurement", "ERP", "CRM")):
        f.box(qx + i * (qw + qg), r1, qw, QB, [P(s, size=SZ)], name=f"Quelle {s}")
    grp = B(qx - 1.0, r2 - 1.0, 4 * qw + 3 * qg + 2.0, QB + 2.0)
    f.box(grp.x, grp.y, grp.w, grp.h, None, role="container", name="Gruppe technische Systeme")
    for i, s in enumerate(("CAx", "PPS", "MES", "PDM/PLM")):
        f.box(qx + i * (qw + qg), r2, qw, QB, [P(s, size=SZ)], name=f"Quelle {s}")
    EX = B(grp.r + 2.0, r1, CX0 + CW - 1.4 - (grp.r + 2.0), grp.b - r1)
    f.box(EX.x, EX.y, EX.w, EX.h, [P("Externe Daten", size=SZ)], name="Externe Daten")

    # Quellsysteme → Business Intelligence
    A([(DW.r - 6.0, yq), (DW.r - 6.0, cb)], name="Quellsysteme → BI")
    return f
