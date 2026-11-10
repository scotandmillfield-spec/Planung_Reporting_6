"""Abb. 5.57 – Mobile Zugangsarten und Endgeräte."""
# Muster: Serie mit Abb. 5.56 – die mobilen BI-Komponenten sind derselbe Baustein (mobilblock() aus
# Aufbau_von_mobilen_BI-Systemen.py: gleiche Geometrie, Begriffe und Rollen, Mobile BI-Client rot). Darüber die
# Ebenen „Zugangsarten“ und „Endgeräte“ als Bänder mit Titel oben links statt gedrehter Seitenbeschriftung.
# Gerätefotos (Smartphone, Tablet mit Bildschirminhalt) → beschriftete Boxen; Fahne mit Blitz → kursive
# Beschriftung am Pfeil „Direktverbindung“ (kommt von den stationären BI-Komponenten, vgl. Abb. 5.56).
# Verbindungen nach der Folie: Mobile BI-Anwendung → beide Zugangsarten; beide Zugangsarten über eine
# Sammelleitung (ohne Knotenpunkte) → beide Endgeräte.
# Korrekturen: „(4 bzw. 5G-LTE, UMTS,GPRS)“ → „(LTE/4G bzw. 5G, UMTS, GPRS)“ (5G ist kein LTE, Leerzeichen).
STEM = "Mobile_Zugangsarten_und_Endgeraete"
import importlib.util
import os

from bookfig import Fig, P

_spec = importlib.util.spec_from_file_location(
    "mobile_bi", os.path.join(os.path.dirname(os.path.abspath(__file__)), "Aufbau_von_mobilen_BI-Systemen.py"))
_mb = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_mb)
B = _mb.B

W = 110
GAPB = _mb.GAPB
XB0, XB1 = _mb.XB0, _mb.XB1
X0, X1 = _mb.XM0, _mb.XM1          # Inhaltsspalten = Container Mobile BI-Anwendung
GAPC = 2.0
CW = (X1 - X0 - GAPC) / 2
COLS = [X0, X0 + CW + GAPC]


def build(theme):
    t = theme
    tmp = Fig(W, 30, theme)
    zug = [[P("Mobiler Zugriff", bold=True), P("(LTE/4G bzw. 5G, UMTS, GPRS)", size=6.5)],
           [P("Hotspot-Zugang", bold=True), P("(WLAN)", size=6.5)]]
    ger = [[P("Mobiltelefon/Smartphone", bold=True)], [P("Tablet-PC/Notebook", bold=True)]]
    zh = max(tmp.measure(p, CW) for p in zug) + 0.8
    gh = max(tmp.measure(p, CW) for p in ger) + 1.6

    yE = 0.3
    hE = 1.4 + gh + 1.4
    yZ = yE + hE + GAPB
    ybus = yZ + 2.0                             # Sammelleitung Zugangsarten → Endgeräte
    hZ = 4.0 + zh + 1.4
    y4 = yZ + hZ + GAPB
    H = round(y4 + _mb.H4 + GAPB + _mb.H3 + 0.3, 1)

    f = Fig(W, H, theme, STEM)
    f.band(XB0, yE, XB1 - XB0, hE, "", name="Band Endgeräte")
    _mb.bandtitel(f, t, _mb.XT, yE, ["ENDGERÄTE"], "Endgeräte")
    f.band(XB0, yZ, XB1 - XB0, hZ, "", name="Band Zugangsarten")
    _mb.bandtitel(f, t, _mb.XT, yZ, ["ZUGANGSARTEN"], "Zugangsarten")

    MC, RW, _ = _mb.mobilblock(f, t, y4)

    G = [B(x, yE + 1.4, CW, gh) for x in COLS]
    Z = [B(x, yZ + 4.0, CW, zh) for x in COLS]
    # Mobile BI-Anwendung → Zugangsarten
    for z, nm in zip(Z, ("Mobiler Zugriff", "Hotspot-Zugang")):
        f.arrow([(z.cx, MC.y), (z.cx, z.b)], name=f"Mobile BI-Anwendung → {nm}")
    # Zugangsarten → Sammelleitung → Endgeräte
    for z in Z:
        f.line([(z.cx, z.y), (z.cx, ybus)], name="Zugangsart → Sammelleitung")
    f.line([(Z[0].cx, ybus), (Z[1].cx, ybus)], name="Sammelleitung Zugangsarten")
    for g, nm in zip(G, ("Smartphone", "Tablet-PC/Notebook")):
        f.arrow([(g.cx, ybus), (g.cx, g.b)], name=f"Sammelleitung → {nm}")

    for z, p, nm in zip(Z, zug, ("Mobiler Zugriff", "Hotspot-Zugang")):
        f.box(z.x, z.y, z.w, z.h, p, role="box", name=nm)
    for g, p, nm in zip(G, ger, ("Mobiltelefon/Smartphone", "Tablet-PC/Notebook")):
        f.box(g.x, g.y, g.w, g.h, p, role="box", name=nm)
    return f
