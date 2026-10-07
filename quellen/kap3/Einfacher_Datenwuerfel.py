"""Abb. 3.33 – Einfacher Datenwürfel."""
# Muster: Datenwürfel in Schrägprojektion – Vorderseite 4 × 5 Zellen (Produkt × Zeit), Tiefe 3 Zellen (Region).
# Statt einzelner Würfelchen mit Lücken und blauen Seitenflächen ein durchgehendes Zellraster; die räumliche Wirkung
# entsteht nur aus drei flachen Grautönen (vorn weiß, oben hellgrau, rechts mittelgrau). Die drei Dimensionen als Pfeile
# entlang der Kanten ab der vorderen oberen rechten Ecke, wie im Original.
# wuerfel() ist so geschrieben, dass die Folgeabbildungen (Rotation, Slice, Dice, Drill-Down …) ihn wiederverwenden können.
STEM = "Einfacher_Datenwuerfel"
from bookfig import Fig, P

W, H = 110, 70.5
NB = chr(0xA0)


def wuerfel(f, fx, fy, nx=4, ny=5, nz=3, zelle=7.0, tiefe=(4.0, -2.6), name="Würfel",
            vorn="FFFFFF", oben="EFEFEF", rechts="CFCFCF", raster="8A8A8A", kante="3A3F44"):
    """Würfel in Schrägprojektion. (fx, fy) = obere linke Ecke der Vorderseite; tiefe = Versatz je Zelle nach hinten.
    Gibt die Eckpunkte zurück: v (vorne oben rechts), Breite, Höhe und den Tiefenvektor der ganzen Tiefe."""
    bw, bh = nx * zelle, ny * zelle
    tx, ty = nz * tiefe[0], nz * tiefe[1]
    # Flächen
    f.poly([(fx, fy), (fx + bw, fy), (fx + bw + tx, fy + ty), (fx + tx, fy + ty)], fill=oben, line=None, name=f"{name} oben")
    f.poly([(fx + bw, fy), (fx + bw + tx, fy + ty), (fx + bw + tx, fy + bh + ty), (fx + bw, fy + bh)],
           fill=rechts, line=None, name=f"{name} rechts")
    f.poly([(fx, fy), (fx + bw, fy), (fx + bw, fy + bh), (fx, fy + bh)], fill=vorn, line=None, name=f"{name} vorn")
    L = lambda a, b, n: f.line([a, b], color=raster, lw=0.5, name=n)
    # Raster vorn
    for i in range(1, nx):
        L((fx + i * zelle, fy), (fx + i * zelle, fy + bh), f"{name} Raster vorn")
    for j in range(1, ny):
        L((fx, fy + j * zelle), (fx + bw, fy + j * zelle), f"{name} Raster vorn")
    # Raster oben
    for i in range(1, nx):
        L((fx + i * zelle, fy), (fx + i * zelle + tx, fy + ty), f"{name} Raster oben")
    for k in range(1, nz):
        L((fx + k * tiefe[0], fy + k * tiefe[1]), (fx + bw + k * tiefe[0], fy + k * tiefe[1]), f"{name} Raster oben")
    # Raster rechts
    for j in range(1, ny):
        L((fx + bw, fy + j * zelle), (fx + bw + tx, fy + j * zelle + ty), f"{name} Raster rechts")
    for k in range(1, nz):
        L((fx + bw + k * tiefe[0], fy + k * tiefe[1]), (fx + bw + k * tiefe[0], fy + bh + k * tiefe[1]), f"{name} Raster rechts")
    # Umriss
    f.poly([(fx, fy), (fx + tx, fy + ty), (fx + bw + tx, fy + ty), (fx + bw + tx, fy + bh + ty), (fx + bw, fy + bh),
            (fx, fy + bh)], closed=True, fill=None, line=kante, lw=0.75, name=f"{name} Umriss")
    f.line([(fx, fy), (fx + bw, fy), (fx + bw + tx, fy + ty)], color=kante, lw=0.75, name=f"{name} Kante oben")
    f.line([(fx + bw, fy), (fx + bw, fy + bh)], color=kante, lw=0.75, name=f"{name} Kante vorn")
    return {"v": (fx + bw, fy), "bw": bw, "bh": bh, "t": (tx, ty)}


def build(theme):
    f = Fig(W, H, theme, STEM)
    t = theme
    fx, fy, z = 33.0, 19.0, 7.0
    w = wuerfel(f, fx, fy, zelle=z)
    vx, vy = w["v"]
    tx, ty = w["t"]

    # Kennzahlen in den Zellen (Beschriftung auf der Vorderseite)
    f.box(fx + 4.2, fy + 2 * z + 1.0, w["bw"] - 8.4, z - 2.0, [P("Kennzahlen", bold=True)], role="box_plain",
          line="none", rounded=False, name="Kennzahlen")

    # Dimensionen als Pfeile entlang der Kanten
    lw = 1.25
    produkt = (fx - 9.0, fy)
    zeit = (vx, fy + w["bh"] + 8.0)
    region = (vx + tx * 1.55, vy + ty * 1.55)
    for ziel, n in ((produkt, "Produkt"), (zeit, "Zeit"), (region, "Region")):
        f.arrow([(vx, vy), ziel], lw=lw, name=f"Dimension {n}")
    lab = lambda x, y, w_, al, text, n: f.text(x, y, w_, 7.0, [P(f"Dimension\n{text}", size=7.5, bold=True)],
                                              align=al, anchor="m", name=n)
    lab(produkt[0] - 23.5, fy - 9.5, 22.0, "r", "Produkt", "Beschriftung Produkt")
    lab(region[0] + 1.5, region[1] - 3.5, 24.0, "l", "Region", "Beschriftung Region")
    lab(zeit[0] - 12.0, zeit[1] + 0.6, 24.0, "c", "Zeit", "Beschriftung Zeit")
    return f
