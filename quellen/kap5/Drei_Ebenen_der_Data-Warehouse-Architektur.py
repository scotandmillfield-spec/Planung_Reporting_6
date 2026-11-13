"""Abb. 5.16 – Drei Ebenen der Data-Warehouse-Architektur."""
# Muster: Ebenen als Bänder (Titel oben links statt Beschriftung am linken Rand), wie Abb. 5.1–5.8.
# Ebene 2: links „Administration und Metadaten“ als senkrechte Spalte, daneben die Schichten Marts, Core,
# Cleansing, Staging; rechts die Speicher in einem gestrichelten Container „Daten-Virtualisierung“
# (im Original blau verlaufend hinterlegter Bereich).
# Ersetzt: Zylinder (ERP, CRM, Excel, Core Data Warehouse, ODS, CMS/DMS) und Würfel durch beschriftete Boxen;
# die Würfel heißen „Data Mart“, „OLAP-Engine“ bleibt unter dem mittleren. Verbindungen wie in der Folie (im
# Altbild verzerrt dargestellte Linie über dem Core DWH ist eine Sammelleitung mit Abzweigen zu den Marts).
# Rollen wie Abb. 5.1–5.8 (Auftrag): Quellsysteme box, Data Warehouse und Data Marts box_hi, kein Rot.
# Softwareneutral: „Excel“ → „Tabellenkalkulation“; „BSC“ → „Balanced Scorecard“; „Daten - Virtualisierung“ →
# „Daten-Virtualisierung“. Auslassungspunkte zwischen den Quellen entfallen (Vorgabe aus Revision 2.2), Abzweig
# der Sammelleitung ohne Knotenpunkt (Revision 2.5/3.6).
# Revision 13.11.2026: Konsolidierung und Balanced Scorecard gestrichen, „OLAP-Engine“ entfällt; Cleansing und
# Staging reichen bis zur Unterkante von „Administration und Metadaten“; die Pfeile aus der Datenanbindung enden
# am gestrichelten Rahmen, die ETL-Schritte haben keine eigenen Pfeile mehr – nur noch drei Pfeile (ohne
# Berührung der Kästchen) in Core Data Warehouse, ODS und CMS/DMS; Platzhalter „…“ für weitere interne Quellen.
STEM = "Drei_Ebenen_der_Data-Warehouse-Architektur"
from bookfig import Fig, P

W = 110
SHY = chr(0xAD)
GAPB = 1.2                       # Abstand der Bänder
TOP = 4.4                        # Titelzeile im Band
SQ = 3.2                         # ETL-Prozessschritt (Quadrat)

# Spalten (x)
XA, WA = 1.6, 5.4                # Administration und Metadaten
XS, WS = 8.4, 14.4               # Schichten
XC = 25.4                        # Container Daten-Virtualisierung
XR = W - 1.6                     # rechter Innenrand der Bänder
XD = 28.0                        # Leitung Core DWH → Analyse (direkter Zugriff), rechts vom Bandtitel
CORE = (29.6, 37.6)              # x, Breite
XRUECK = 31.2                    # Rückfluss Core DWH → interne Quellen
MARTS = [30.4, 47.0, 63.6]       # x der Data Marts
MW = 15.6
ODS = (74.6, 13.6)
CMS = (91.6, 14.4)
X_STAGING = [35.0, 48.0, 62.0, 76.0, 91.6, 104.0]
X_CLEANS = [41.0, 55.0, 69.0, 84.0, 99.0]


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
    analyse_p = [P("Analyse- und Planungswerkzeuge (Dashboards, Cockpits, Portale etc.)\n"
                   "sowie spezielle Nutzungsmöglichkeiten wie\n"
                   "z. B. Data Mining, Maschinelles Lernen und KI")]
    mart2_p = [P("Data Mart", bold=True)]

    # ------------------------------------------------------------ Geometrie (y)
    y3 = 0.3
    ah = tmp.measure(analyse_p, XR - XA) + 0.4
    h3 = TOP + ah + 1.4
    y2 = y3 + h3 + GAPB
    ykl = y2 + 6.4                              # Oberkante Spalten und Container (unter dem zweizeiligen Bandtitel)
    yk = ykl
    ym = ykl + 2.0                              # Data Marts
    mh = 8.4
    ybus = ym + mh + 3.0                        # Sammelleitung
    yc = ybus + 3.0                             # Core DWH, ODS, CMS/DMS
    ch, oh = 6.4, 8.4
    ycl = yc + oh + 3.6                         # Cleansing-Reihe
    yetl = ycl + SQ + 0.6                       # Beschriftung ETL-Prozesse
    yst = yetl + 3.6                            # Staging-Reihe
    yvt = yst + SQ + 1.0                        # Titel Daten-Virtualisierung (unten, frei von Leitungen)
    kb = yvt + 3.4                              # Unterkante Container
    h2 = kb + 1.4 - y2
    y1 = y2 + h2 + GAPB
    qh = 7.4                                    # zwei Zeilen (Tabellenkalkulation)
    h1 = TOP + 4.0 + qh + 1.8
    H = round(y1 + h1 + 0.3, 1)

    f = Fig(W, H, theme, STEM)
    A = f.arrow

    # ------------------------------------------------------------ Bänder
    f.band(0.3, y3, W - 0.6, h3, "3. Datenauswertung und -nutzung")
    # Band 2: Titel zweizeilig links oben, damit die Leitungen zur Ebene 3 frei bleiben
    f.box(0.3, y2, W - 0.6, h2, None, role="band", name="Band 2. Datenverwaltung und -distribution")
    f.text(1.9, y2 + 0.9, XD - 1.9 - 0.3, 5.4,
           [P("2. DATENVERWALTUNG", size="band", bold=True, color=t.band_label),
            P("UND -DISTRIBUTION", size="band", bold=True, color=t.band_label)],
           bg=t.role("band").fill, name="Bandtitel 2. Datenverwaltung und -distribution")
    f.band(0.3, y1, W - 0.6, h1, "1. Datenanbindung")

    # ------------------------------------------------------------ Ebene 3
    AN = B(XA, y3 + TOP, XR - XA, ah)
    f.box(AN.x, AN.y, AN.w, AN.h, analyse_p, role="box", name="Analyse- und Planungswerkzeuge")

    # ------------------------------------------------------------ Ebene 1
    IQ = B(XA, y1 + TOP, 84.0 - XA, h1 - TOP - 1.4)
    EQ = B(86.0, IQ.y, XR - 86.0, IQ.h)
    f.box(IQ.x, IQ.y, IQ.w, IQ.h, None, role="container", name="Interne Quellsysteme und Quellen")
    f.text(IQ.x + 1.0, IQ.y + 0.4, IQ.w - 2.0, 3.4, [P("Interne Quellsysteme und Quellen", size=6.5, bold=True)],
           align="c", anchor="t", bg=t.role("band").fill, name="Titel Interne Quellsysteme")
    qy = IQ.y + 4.0
    qw, pw = 17.0, 10.0                         # Quellen, Platzhalter
    qg = (IQ.w - 3 * qw - pw - 2 * 3.0) / 3
    qx = [IQ.x + 3.0 + i * (qw + qg) for i in range(4)]
    for x, n in zip(qx, ("ERP", "CRM", f"Tabellen{SHY}kalkulation", "…")):
        if n == "…":
            f.box(x, qy, pw, qh, [P("…")], role="box_plain", name="Platzhalter weitere Quellen")
        else:
            f.box(x, qy, qw, qh, [P(n, bold=True)], role="box", name=f"Quelle {n}")
    f.box(EQ.x, EQ.y, EQ.w, EQ.h, [P("Externe Quellen", bold=True)], role="box", name="Externe Quellen")

    # ------------------------------------------------------------ Ebene 2: Spalten links
    f.box(XA, ykl, WA, kb - ykl, [P("Administration und Metadaten")], role="box_plain", rot=270,
          name="Administration und Metadaten")
    gr = [ykl, ybus + 1.4, ycl - 1.8, yetl + 1.6, kb]   # Grenzen der Schichten, Staging bündig mit der Spalte
    for i, n in enumerate(("Marts", "Core", "Cleansing", "Staging")):
        y0, y1_ = gr[i] + (0 if i == 0 else 0.5), gr[i + 1] - (0 if i == 3 else 0.5)
        f.box(XS, y0, WS, y1_ - y0, [P(n)], role="box_plain", name=f"Schicht {n}")

    # ------------------------------------------------------------ Ebene 2: Container
    f.box(XC, yk, XR - XC, kb - yk, None, role="container", name="Daten-Virtualisierung")
    f.text(56.0, yvt, 44.0, 3.2, [P("Daten-Virtualisierung", size=6.5, bold=True)], align="c", anchor="t",
           bg=t.role("band").fill, name="Titel Daten-Virtualisierung")

    # Speicher
    C = B(CORE[0], yc, CORE[1], ch)
    O = B(ODS[0], yc, ODS[1], oh)
    CM = B(CMS[0], yc, CMS[1], oh)
    M = [B(x, ym, MW, mh) for x in MARTS]

    # ---------------- Leitungen (unter den Kästen)
    # Analyse: direkter Zugriff, Marts, ODS, CMS/DMS
    A([(XD, ybus), (XD, AN.b)], name="Sammelleitung → Analyse")
    for i, m in enumerate(M):
        A([(m.cx, m.y), (m.cx, AN.b)], name=f"Data Mart {i + 1} → Analyse")
        A([(m.cx, ybus), (m.cx, m.b)], size="sm", name=f"Sammelleitung → Data Mart {i + 1}")
    A([(O.cx, O.y), (O.cx, AN.b)], name="ODS → Analyse")
    A([(CM.cx, CM.y), (CM.cx, AN.b)], name="CMS/DMS → Analyse")
    f.line([(XD, ybus), (O.cx, ybus)], name="Sammelleitung")
    A([(C.cx, C.y), (C.cx, ybus)], size="sm", name="Core DWH → Sammelleitung")
    A([(O.x, C.cy), (C.r, C.cy)], size="sm", name="ODS → Core DWH")
    # Datenanbindung → gestrichelter Rahmen; ETL → Speicher (drei Pfeile durch die Lücken der ETL-Schritte)
    A([(48.0, IQ.y), (48.0, kb)], size="sm", name="Interne Quellen → Daten-Virtualisierung")
    A([(104.0, EQ.y), (104.0, kb)], size="sm", name="Externe Quellen → Daten-Virtualisierung")
    ys = yetl + 1.5
    for x, ziel, nm in ((48.0, C, "Core DWH"), (76.5, O, "ODS"), (93.5, CM, "CMS/DMS")):
        for xb in X_CLEANS:
            if abs(x - xb) < SQ / 2 + 0.6:
                f.warnings.append(f"[ETL → {nm}] Pfeil berührt einen ETL-Schritt")
        A([(x, ys), (x, ziel.b)], size="sm", name=f"ETL → {nm}")
    # Rückfluss Core DWH → interne Quellen
    A([(XRUECK, C.b), (XRUECK, IQ.y)], size="sm", name="Core DWH → interne Quellen")

    # ---------------- Kästen
    f.box(C.x, C.y, C.w, C.h, [P("Core Data Warehouse", bold=True)], role="box_hi", name="Core Data Warehouse")
    f.box(O.x, O.y, O.w, O.h, [P("ODS", bold=True)], role="box_plain", name="ODS")
    f.box(CM.x, CM.y, CM.w, CM.h, [P("CMS", bold=True), P("DMS", bold=True)], role="box_plain", name="CMS/DMS")
    for i, m in enumerate(M):
        f.box(m.x, m.y, m.w, m.h, mart2_p if i == 1 else [P("Data Mart", bold=True)], role="box_hi",
              name=f"Data Mart {i + 1}")
    for x in X_CLEANS:
        f.box(x - SQ / 2, ycl, SQ, SQ, None, role="box_plain", rounded=False, name="ETL-Schritt Cleansing")
    for x in X_STAGING:
        f.box(x - SQ / 2, yst, SQ, SQ, None, role="box_plain", rounded=False, name="ETL-Schritt Staging")
    f.text(54.0, yetl, 19.0, 3.0, [P("ETL-Prozesse", italic=True)], align="c", anchor="m",
           bg=t.role("band").fill, name="ETL-Prozesse")
    return f
