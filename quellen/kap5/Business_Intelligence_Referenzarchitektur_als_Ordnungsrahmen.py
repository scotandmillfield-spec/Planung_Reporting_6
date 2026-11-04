"""Abb. 5.6 – Business-Intelligence-Referenzarchitektur als Ordnungsrahmen."""
# Muster: Ordnungsrahmen als Bänder (wie Abb. 5.1). Die fünf Schichten der rechten Beschriftungsspalte des
# Originals (Frontend … Source systems) sind Bänder mit Titel oben links; Metadaten-, Rechte- und Rollen- sowie
# Qualitätsmanagement laufen rechts als senkrechte Spalten über alle Schichten.
# Einheitliche Rollen mit Abb. 5.1 (Abstimmung Kapitel 5): Quell- und operative Systeme box, Datenhaltung
# (Auswertungsdatenbank, ODI) box_hi, Core Data Warehouse als Schlüsselelement rot, übrige Elemente box,
# Extraktion/Transformation/Laden weiß (box_plain), Querschnittsfunktionen gestrichelt.
# Original englisch beschriftet – Texte ins Deutsche übertragen (PPC → PPS wie in Abb. 5.1 und 5.7).
# Entfernt: Zylinder-, Würfel- und Globussymbole, Schatten, Platzhalter „…“; Pfeilpaare auf/ab als Doppelpfeile.
STEM = "Business_Intelligence_Referenzarchitektur_als_Ordnungsrahmen"
from bookfig import Fig, P

W = 110
SZ = 7.0
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


def trapez(f, cx, y, h, w_oben, w_unten, text, role="box"):
    """Trapez (Pyramidenstufe) mit zentrierter Beschriftung."""
    r = f.t.role(role)
    f.poly([(cx - w_oben / 2, y), (cx + w_oben / 2, y), (cx + w_unten / 2, y + h), (cx - w_unten / 2, y + h)],
           closed=True, fill=r.fill, line=r.line, lw=r.lw, name=f"Stufe {text}")
    wi = min(w_oben, w_unten)
    f.text(cx - wi / 2, y, wi, h, [P(text, size=SZ)], align="c", anchor="m", bg=r.fill, name=text)


def build(theme):
    t = theme
    # ------------------------------------------------------------ Geometrie
    XT = 1.2                                   # Sammelleitung links (Planung, Core DWH → operative Systeme)
    XB0, XB1 = 2.4, 89.6                       # Bänder
    CW, CG = 5.6, 1.0                          # Querschnittsspalten
    XC = W - 0.2 - 3 * CW - 2 * CG

    yF = 0.2                                   # Frontend
    PH, PG = 4.6, 0.8                          # Pyramidenstufe, Abstand
    hF = 1.2 + 3 * PH + 2 * PG + 1.2
    yA = yF + hF + 1.2                         # Ausgabeschicht
    hA = TOP + BH + 2.8 + BH + 1.2
    yD = yA + hA + 1.2                         # Datenhaltungsschicht
    hD = TOP + BH + 1.4
    yI = yD + hD + 1.2                         # Integrationsschicht
    EH = 4.2                                   # Extraktion/Transformation/Laden
    hI = TOP + 0.8 + 3 * EH + 0.8 + 1.2
    yQ = yI + hI + 1.2                         # Quellsysteme
    hQ = TOP + 4.2 + BH + 1.2 + 1.2
    H = round(yQ + hQ + 0.2, 1)

    f = Fig(W, H, theme, STEM)
    A = f.arrow

    for y, h, s in ((yF, hF, "Frontend"), (yA, hA, "Ausgabeschicht"), (yD, hD, "Datenhaltungsschicht"),
                    (yI, hI, "Integrationsschicht"), (yQ, hQ, "Quellsysteme")):
        f.band(XB0, y, XB1 - XB0, h, s)

    # ------------------------------------------------------------ Ausgabeschicht
    rA, rB = yA + TOP, yA + TOP + BH + 2.8
    PL = B(4.0, rB, 23.0, BH)                  # Planung
    AD = B(36.8, rB, 28.6, BH)                 # Auswertungsdatenbank
    BD = B(27.8, rA, 18.8, BH)                 # Bereichsdaten
    AG = B(55.6, rA, 18.8, BH)                 # Aggregationen
    OL = B(69.4, rB, 18.6, BH)                 # OLAP
    f.box(PL.x, PL.y, PL.w, PL.h, [P("Planung", size=SZ)], name="Planung")
    f.box(AD.x, AD.y, AD.w, AD.h, [P("Auswertungsdatenbank", size=SZ)], role="box_hi", name="Auswertungsdatenbank")
    f.box(BD.x, BD.y, BD.w, BD.h, [P("Bereichsdaten", size=SZ)], name="Bereichsdaten")
    f.box(AG.x, AG.y, AG.w, AG.h, [P("Aggregationen", size=SZ)], name="Aggregationen")
    f.box(OL.x, OL.y, OL.w, OL.h, [P("OLAP", size=SZ)], name="OLAP")

    # ------------------------------------------------------------ Frontend (Pyramide)
    pcx = AD.cx - 1.0
    wb = 68.0                                  # Basisbreite
    k = 1.3                                    # Breitenabnahme je mm Höhe (je Seite)
    yb = yF + hF - 1.2
    for i, s in enumerate(("Reporting | Analyse", "Planung | Hochrechnung", "Management-Cockpit")):
        yu = yb - i * (PH + PG)
        wu = wb - 2 * k * (yb - yu)
        wo = wu - 2 * k * PH
        trapez(f, pcx, yu - PH, PH, wo, wu, s)

    # ------------------------------------------------------------ Datenhaltungsschicht
    CD = B(AD.x, yD + TOP, AD.w, BH)           # Core Data Warehouse
    OD = B(OL.x, yD + TOP, OL.w, BH)           # ODI
    f.box(CD.x, CD.y, CD.w, CD.h, [P("Core Data Warehouse", size=SZ, bold=True)], role="box_strong",
          name="Core Data Warehouse")
    f.box(OD.x, OD.y, OD.w, OD.h, [P("ODI", size=SZ)], role="box_hi", name="ODI")

    # ------------------------------------------------------------ Integrationsschicht
    SA = B(4.0, yI + TOP, XB1 - 1.6 - 4.0, 0.8 + 3 * EH + 0.8)
    f.box(SA.x, SA.y, SA.w, SA.h, None, role="container", name="Staging Area")
    f.text(SA.x + 1.6, SA.y, 20.0, SA.h, [P("Staging Area", size=SZ, bold=True)], align="l", anchor="m",
           bg=t.role("band").fill, name="Titel Staging Area")
    ET = B(AD.cx - 10.0, SA.y + 0.8, 20.0, 3 * EH)
    for i, s in enumerate(("Laden", "Transformation", "Extraktion")):
        f.box(ET.x, ET.y + i * EH, ET.w, EH, [P(s, size=SZ)], role="box_plain", rounded=False, name=s)

    # ------------------------------------------------------------ Quellsysteme
    OP = B(4.0, yQ + TOP, AD.r - 4.0, 4.2 + BH + 1.2)
    f.box(OP.x, OP.y, OP.w, OP.h, None, role="container", name="Operative Anwendungssysteme")
    f.text(OP.x, OP.y + 0.3, OP.w, 3.4, [P("Operative Anwendungssysteme", size=6.5, bold=True)], align="c",
           anchor="m", bg=t.role("band").fill, name="Titel Operative Anwendungssysteme")
    qw, qg = 16.0, 2.4
    qx = OP.x + (OP.w - (3 * qw + 2 * qg)) / 2
    for i, s in enumerate(("ERP", "PPS", "CRM")):
        f.box(qx + i * (qw + qg), OP.y + 4.2, qw, BH, [P(s, size=SZ)], name=f"Quelle {s}")
    EX = B(OL.x, OP.y + 4.2, OL.w, BH)
    f.box(EX.x, EX.y, EX.w, EX.h, [P("Externe Daten", size=SZ)], name="Externe Daten")

    # ------------------------------------------------------------ Querschnittsspalten
    for i, s in enumerate(("Metadatenmanagement", "Rechte- und Rollenmanagement", "Qualitätsmanagement")):
        f.box(XC + i * (CW + CG), yF, CW, yQ + hQ - yF, [P(s, size=SZ, bold=True)], role="container", rot=270,
              name=s)

    # ------------------------------------------------------------ Verbindungen
    # Frontend ↔ Ausgabeschicht
    A([(AD.cx, AD.y), (AD.cx, yb)], head=True, tail=True, name="Auswertungsdatenbank ↔ Frontend")
    xp = PL.r - 1.6
    A([(xp, PL.y), (xp, yb)], head=True, tail=True, name="Planung ↔ Frontend")
    # innerhalb der Ausgabeschicht
    A([(BD.r - 4.5, AD.y), (BD.r - 4.5, BD.b)], name="Auswertungsdatenbank → Bereichsdaten")
    A([(AG.x + 5.0, AD.y), (AG.x + 5.0, AG.b)], name="Auswertungsdatenbank → Aggregationen")
    A([(AD.r, AD.cy), (OL.x, AD.cy)], name="Auswertungsdatenbank → OLAP")
    # Datenhaltung
    A([(AD.cx, CD.y), (AD.cx, AD.b)], name="Core DWH → Auswertungsdatenbank")
    A([(OD.x, OD.cy), (CD.r, OD.cy)], name="ODI → Core DWH")
    xv = CD.x - 3.2
    A([(PL.r, PL.cy + 1.2), (xv, PL.cy + 1.2), (xv, CD.cy - 1.2), (CD.x, CD.cy - 1.2)], name="Planung → Core DWH")
    # Rückfluss in die operativen Systeme (Sammelleitung links außen)
    A([(PL.x, PL.cy), (XT, PL.cy), (XT, OP.cy), (OP.x, OP.cy)], name="Planung → operative Systeme")
    f.line([(CD.x, CD.cy + 1.2), (XT, CD.cy + 1.2)], name="Core DWH → operative Systeme")
    # Integration
    A([(OP.x + 20.5, OP.y), (OP.x + 20.5, SA.b)], name="Operative Systeme → Staging Area")
    A([(CD.x + 3.0, SA.y), (CD.x + 3.0, CD.b)], name="Staging Area → Core DWH")
    A([(ET.cx, OP.y), (ET.cx, ET.b)], name="Operative Systeme → Extraktion")
    A([(ET.cx, ET.y), (ET.cx, CD.b)], name="Laden → Core DWH")
    A([(EX.cx, EX.y), (EX.cx, SA.b)], name="Externe Daten → Staging Area")
    A([(OD.cx, SA.y), (OD.cx, OD.b)], name="Staging Area → ODI")
    return f
