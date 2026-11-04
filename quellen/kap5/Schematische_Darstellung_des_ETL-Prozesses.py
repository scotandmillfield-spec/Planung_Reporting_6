"""Abb. 5.10 – Schematische Darstellung des ETL-Prozesses (eigene Darstellung)."""
# Muster: drei Phasen als Karten mit Kopfleiste in einer Achse, Pfeile dazwischen (Aufbau des Originals).
# Ersetzt: Datenbanksymbole durch beschriftete Boxen (Staging, Cleansing, Core Data Warehouse); der Wecker am
# ersten Pfeil wird zur Pfeilbeschriftung „zeitgesteuert“. Entfernt: Zahnrad, Schraubenschlüssel und Sackkarre
# (Deko, doppelt zu „Transform“ bzw. „Load“). Quellen in einem Raster gleich großer Boxen statt verstreut,
# „Databases“ oben über beide Spalten wie im Original; Auslassungspunkte entfallen (Vorgabe aus Revision 2.2).
# Korrekturen: „JSon“ → „JSON“, „On Prem“ → „On-Premises“.
# Rollen wie Abb. 5.1–5.8: Quellen weiße Boxen, Data Warehouse box_hi; kein Rot.
STEM = "Schematische_Darstellung_des_ETL-Prozesses"
from bookfig import Fig, P, Para, MM, MSO_SHAPE, Emu

W = 110
SHY = chr(0xAD)
WE, WT = 39.0, 23.4              # Kartenbreiten: Extract, Transform/Load
GAP = (W - 0.6 - WE - 2 * WT) / 2
KH = 5.0                         # Kopfleiste
PAD = 2.0                        # Innenabstand der Karte
QH, QG = 4.4, 1.4                # Quellen: Boxhöhe, Abstand


def karte(f, x, y, w, h, titel):
    """Karte mit Kopfleiste (Rolle header) und leerem Rumpf (Rolle box)."""
    t = f.t
    f.box(x, y, w, h, None, role="box", name=f"Karte {titel}")
    s = f.sh.add_shape(MSO_SHAPE.ROUND_2_SAME_RECTANGLE, Emu(round(x * MM)), Emu(round(y * MM)),
                       Emu(round(w * MM)), Emu(round(KH * MM)))
    f._strip_style(s)
    s.adjustments[0] = t.role("box").radius / KH
    s.adjustments[1] = 0.0
    hr = t.role("header")
    f._apply_role(s, hr)
    s.name = f"Kopf {titel}"
    f._fill_text(s, [Para(titel, size="head", bold=True)], w, KH, hr.text, "c", "m", (1.6, 0.3),
                 label=titel, bg=hr.fill)


def build(theme):
    quellen = ["API", "JSON", "XML", "Flatfiles", "Cloud", "On-Premises"]
    rows = 1 + (len(quellen) + 1) // 2           # erste Zeile: Databases über beide Spalten
    body = rows * QH + (rows - 1) * QG
    HK = KH + PAD + body + PAD
    H = round(HK + 0.6, 1)
    f = Fig(W, H, theme, STEM)
    t = theme

    y0 = 0.3
    xe = 0.3
    xt = xe + WE + GAP
    xl = xt + WT + GAP
    yb = y0 + KH + PAD                       # Oberkante Rumpfinhalt
    ym = yb + body / 2                       # Pfeilhöhe = Mitte des Rumpfs

    # ---------------- Extract: Quellen im Raster
    karte(f, xe, y0, WE, HK, "Extract")
    qw = (WE - 2 * 1.6 - QG) / 2
    f.box(xe + 1.6, yb, WE - 3.2, QH, [P("Databases")], role="box_plain", name="Quelle Databases")
    for i, q in enumerate(quellen):
        c, r = i % 2, i // 2 + 1
        f.box(xe + 1.6 + c * (qw + QG), yb + r * (QH + QG), qw, QH, [P(q)], role="box_plain",
              name=f"Quelle {q}")

    # ---------------- Transform: Staging und Cleansing
    karte(f, xt, y0, WT, HK, "Transform")
    sh = (body - 2.0) / 2
    f.box(xt + 1.6, yb, WT - 3.2, sh, [P("Staging")], role="box_plain", name="Staging")
    f.box(xt + 1.6, yb + sh + 2.0, WT - 3.2, sh, [P("Cleansing")], role="box_plain", name="Cleansing")

    # ---------------- Load: Core Data Warehouse
    karte(f, xl, y0, WT, HK, "Load")
    f.box(xl + 1.6, yb, WT - 3.2, body, [P("Core Data Warehouse", bold=True)], role="box_hi",
          name="Core Data Warehouse")

    # ---------------- Pfeile
    f.arrow([(xe + WE, ym), (xt, ym)], name="Extract → Transform")
    f.text(xe + WE, ym - 7.2, GAP, 6.0, [P(f"zeit{SHY}gesteuert", size=6.5, italic=True)],
           align="c", anchor="b", name="zeitgesteuert")
    f.arrow([(xt + WT, ym), (xl, ym)], name="Transform → Load")
    return f
