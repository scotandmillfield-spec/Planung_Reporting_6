"""Abb. 5.47 – Schematischer Aufbau eines Portals (in Anlehnung an Kemper et al. 2010)."""
# Muster: Seitenaufteilung als Raster aus Bereichen (Karten ohne Kopfleiste), Beschriftung oben links wie im
# Original. Navigation & Konfiguration als Leiste über die ganze Breite, darunter drei Spalten: links Nachrichten
# und Suche, Mitte der Detailbereich (Schlüsselelement rot – dort läuft die BI-Applikation), rechts Aktienkurse
# sowie Kommunikation & Kollaboration. Proportionen der Bereiche wie im Original.
# Entfernt: Fenster, Menü-, Symbol- und Adressleiste des Webbrowsers (Produktname, Logo, „http://localhost“),
# Bildlaufleiste und Copyright-Zeile (Quelle gehört in die Caption). Der Browser bleibt als gestrichelte Gruppe
# „Portalseite im Webbrowser“ erkennbar.
STEM = "Schematischer_Aufbau_eines_Portals"
from bookfig import Fig, P

W = 110
SZ = 7.0
NB = chr(0xA0)


class B:
    def __init__(self, x, y, w, h):
        self.x, self.y, self.w, self.h = x, y, w, h
    @property
    def r(self): return self.x + self.w
    @property
    def b(self): return self.y + self.h


def build(theme):
    t = theme
    # ------------------------------------------------------------ Geometrie
    CX0, CW = 0.2, W - 0.4                 # Gruppe Webbrowser
    TT = 5.0                               # Titelzeile der Gruppe
    X0, X1 = 2.6, W - 2.6                  # Inhalt
    G = 2.4                                # Abstand zwischen Bereichen
    y0 = TT + 0.8
    NAV = B(X0, y0, X1 - X0, 6.4)
    yb = NAV.b + G
    HB = 44.0                              # Höhe der drei Spalten
    wl, wr = 24.4, 23.6                    # Spaltenbreiten links/rechts (Original 245 : 545 : 230)
    wm = (X1 - X0) - wl - wr - 2 * G
    L = B(X0, yb, wl, HB)
    M = B(L.r + G, yb, wm, HB)
    R = B(M.r + G, yb, wr, HB)
    h_such = 11.6
    h_akt = 18.4
    NACH = B(L.x, yb, wl, HB - h_such - G)
    SUCH = B(L.x, NACH.b + G, wl, h_such)
    AKT = B(R.x, yb, wr, h_akt)
    KOM = B(R.x, AKT.b + G, wr, HB - h_akt - G)
    cb = yb + HB + 2.4
    H = round(cb + 0.2, 1)

    f = Fig(W, H, theme, STEM)
    ins = (1.6, 1.2)

    # ------------------------------------------------------------ Gruppe Webbrowser
    f.box(CX0, 0.2, CW, cb - 0.2, None, role="container", name="Portalseite im Webbrowser")
    f.text(CX0, 0.7, CW, 4.0, [P("Portalseite im Webbrowser", size=6.5, bold=True)], align="c",
           anchor="m", name="Titel Portalseite im Webbrowser")

    # ------------------------------------------------------------ Bereiche
    f.box(NAV.x, NAV.y, NAV.w, NAV.h, [P("Navigation & Konfiguration", size=SZ, bold=True)], align="l",
          anchor="m", ins=(1.6, 0.6), name="Navigation & Konfiguration")
    f.box(NACH.x, NACH.y, NACH.w, NACH.h, [P("Nachrichten", size=SZ, bold=True)], align="l", anchor="t",
          ins=ins, name="Nachrichten")
    f.box(SUCH.x, SUCH.y, SUCH.w, SUCH.h, [P("Suche", size=SZ, bold=True)], align="l", anchor="t",
          ins=ins, name="Suche")
    f.box(M.x, M.y, M.w, M.h,
          [P("Detailbereich", size=SZ, bold=True),
           P(f"(z.{NB}B. für BI-Applikation/Analysesystem)", size=SZ, space_before=2.0)],
          role="box_strong", align="l", anchor="t", ins=ins, name="Detailbereich")
    f.box(AKT.x, AKT.y, AKT.w, AKT.h, [P("Aktienkurse", size=SZ, bold=True)], align="l", anchor="t",
          ins=ins, name="Aktienkurse")
    f.box(KOM.x, KOM.y, KOM.w, KOM.h, [P("Kommunikation & Kollaboration", size=SZ, bold=True)], align="l",
          anchor="t", ins=ins, name="Kommunikation & Kollaboration")
    return f
