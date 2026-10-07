"""Gemeinsame Bausteine der OLAP-Abbildungen 3.33–3.40 (Datenwürfel, Dimensionspfeile, Tabellen).

Kein eigenes Abbildungsskript – wird von Einfacher_Datenwuerfel.py, Rotation_bzw_Pivoting.py, Slice.py, Dice.py,
Drill-Down_und_Roll-Up.py, Drill-Through.py, Drill-Across.py und Split_und_Merge.py importiert, damit Würfel und
Tabellen in allen Abbildungen gleich aussehen.
"""
from bookfig import P, text_width_mm

SHY = chr(0xAD)
NB = chr(0xA0)
ROT = "C62828"
ANTHRAZIT = "3A3F44"


# --------------------------------------------------------------------------
# Würfel
# --------------------------------------------------------------------------
def wuerfel(f, fx, fy, nx=4, ny=5, nz=3, zelle=7.0, tiefe=None, name="Würfel", auswahl=None,
            vorn="FFFFFF", oben="EFEFEF", rechts="CFCFCF", raster="8A8A8A", kante=ANTHRAZIT, auswahl_farbe=ROT):
    """Würfel in Schrägprojektion. (fx, fy) = obere linke Ecke der Vorderseite; tiefe = Versatz je Zelle nach hinten
    (Standard: Verhältnis wie in Abb. 3.33). nx Spalten (nach links), ny Zeilen (nach unten), nz Ebenen (nach hinten).
    auswahl = {"i": (i0, i1), "j": (j0, j1), "k": (k0, k1)} – halboffene Bereiche der hervorgehobenen Zellen
    (i Spalte von links, j Zeile von oben, k Ebene von vorn); gezeichnet wird, was davon sichtbar ist.
    Rückgabe: Geometrie für Pfeile und Beschriftungen."""
    if tiefe is None:
        tiefe = (zelle * 4.0 / 7.0, -zelle * 2.6 / 7.0)
    dx, dy = tiefe
    bw, bh = nx * zelle, ny * zelle
    tx, ty = nz * dx, nz * dy
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
        L((fx + k * dx, fy + k * dy), (fx + bw + k * dx, fy + k * dy), f"{name} Raster oben")
    # Raster rechts
    for j in range(1, ny):
        L((fx + bw, fy + j * zelle), (fx + bw + tx, fy + j * zelle + ty), f"{name} Raster rechts")
    for k in range(1, nz):
        L((fx + bw + k * dx, fy + k * dy), (fx + bw + k * dx, fy + bh + k * dy), f"{name} Raster rechts")
    # Auswahl: Zellen einzeln, weiße Fugen trennen sie
    if auswahl:
        i0, i1 = auswahl.get("i", (0, nx))
        j0, j1 = auswahl.get("j", (0, ny))
        k0, k1 = auswahl.get("k", (0, nz))
        Z = lambda pts, n: f.poly(pts, fill=auswahl_farbe, line="FFFFFF", lw=0.5, name=f"{name} Auswahl {n}")
        if k0 == 0:
            for i in range(i0, i1):
                for j in range(j0, j1):
                    x, y = fx + i * zelle, fy + j * zelle
                    Z([(x, y), (x + zelle, y), (x + zelle, y + zelle), (x, y + zelle)], "vorn")
        if j0 == 0:
            for i in range(i0, i1):
                for k in range(k0, k1):
                    x, y = fx + i * zelle + k * dx, fy + k * dy
                    Z([(x, y), (x + zelle, y), (x + zelle + dx, y + dy), (x + dx, y + dy)], "oben")
        if i1 == nx:
            for j in range(j0, j1):
                for k in range(k0, k1):
                    x, y = fx + bw + k * dx, fy + j * zelle + k * dy
                    Z([(x, y), (x + dx, y + dy), (x + dx, y + dy + zelle), (x, y + zelle)], "rechts")
    # Umriss
    f.poly([(fx, fy), (fx + tx, fy + ty), (fx + bw + tx, fy + ty), (fx + bw + tx, fy + bh + ty), (fx + bw, fy + bh),
            (fx, fy + bh)], closed=True, fill=None, line=kante, lw=0.75, name=f"{name} Umriss")
    f.line([(fx, fy), (fx + bw, fy), (fx + bw + tx, fy + ty)], color=kante, lw=0.75, name=f"{name} Kante oben")
    f.line([(fx + bw, fy), (fx + bw, fy + bh)], color=kante, lw=0.75, name=f"{name} Kante vorn")
    return {"fx": fx, "fy": fy, "v": (fx + bw, fy), "bw": bw, "bh": bh, "t": (tx, ty), "d": (dx, dy), "z": zelle,
            "nx": nx, "ny": ny, "nz": nz}


def zelle_rechts(w, j, k):
    """Mittelpunkt der Zelle (Zeile j, Ebene k) auf der rechten Seitenfläche."""
    dx, dy = w["d"]
    x = w["fx"] + w["bw"] + (k + 0.5) * dx
    y = w["fy"] + (j + 0.5) * w["z"] + (k + 0.5) * dy
    return x, y


def zelle_vorn(w, i, j):
    """Mittelpunkt der Zelle (Spalte i, Zeile j) auf der Vorderseite."""
    return w["fx"] + (i + 0.5) * w["z"], w["fy"] + (j + 0.5) * w["z"]


def kennzahlen(f, w, zeile=2, size=7.0, rand=None, name="Kennzahlen"):
    """„Kennzahlen“ auf der Vorderseite (weiße Fläche über dem Raster, wie im Original). Passt das Wort nicht in eine
    Zeile, wird es an der Trennstelle umbrochen und belegt zwei Zellreihen."""
    z = w["z"]
    wort = "Kenn" + SHY + "zahlen"
    if rand is None:
        rand = z * 0.6
        if text_width_mm("Kennzahlen", size, bold=True) + 1.2 > w["bw"] - 2 * rand:
            rand = max(0.4, min(rand, (w["bw"] - text_width_mm("zahlen", size, bold=True) - 2.0) / 2))
    b = w["bw"] - 2 * rand
    zweizeilig = text_width_mm("Kennzahlen", size, bold=True) > b - 1.2
    h = (2 * size * 0.3528 * 1.2 + 0.8) if zweizeilig else min(z - 2.0, size * 0.3528 * 1.2 + 1.6)
    h = max(h, size * 0.3528 * 1.2 + 0.6)
    yc = w["fy"] + (zeile + (1.0 if zweizeilig else 0.5)) * z
    f.box(w["fx"] + rand, yc - h / 2, b, h, [P(wort, size=size, bold=True)], role="box_plain", line="none",
          rounded=False, name=name, ins=(0.2, 0.1))


def dim_text(f, x, y, b, text, align="l", anchor="m", size=7.5, farbe=None, name=None, h=None):
    """Beschriftung „Dimension <Name>“ zweizeilig, fett. (x, y) = Ankerpunkt: linke/rechte/mittlere Kante je align,
    y = Mitte (anchor m), Oberkante (t) oder Unterkante (b)."""
    h = h or 2 * size * 0.3528 * 1.2 + 0.4
    x0 = x if align == "l" else x - b if align == "r" else x - b / 2
    y0 = y - h / 2 if anchor == "m" else y if anchor == "t" else y - h
    f.text(x0, y0, b, h, [P(f"Dimension\n{text}", size=size, bold=True, color=farbe)], align=align, anchor=anchor,
           name=name or f"Beschriftung {text}")


def achsen(f, w, links, hinten, unten, lw=1.25, size=7.5, lang=(9.0, 1.55, 8.0), farben=None, b=None,
           links_stil="vor", hinten_stil="neben"):
    """Dimensionspfeile entlang der Kanten ab der vorderen oberen rechten Ecke, mit Beschriftung.
    lang = (Überstand nach links in mm, Faktor der Tiefe nach hinten, Überstand nach unten in mm).
    Beschriftung hinten rechts neben der Spitze, unten darunter; links je links_stil neben der Spitze („vor“) oder
    unter dem Pfeil links neben der Vorderseite („unter“, spart Breite).
    Rückgabe: Pfeilspitzen je Richtung und Breite der Beschriftungen."""
    farben = farben or {}
    vx, vy = w["v"]
    tx, ty = w["t"]
    b = b or max(text_width_mm("Dimension", size, bold=True), *(text_width_mm(t, size, bold=True)
                                                               for t in (links, hinten, unten))) + 1.2
    sp = {
        "links": (w["fx"] - lang[0], vy),
        "hinten": (vx + tx * lang[1], vy + ty * lang[1]),
        "unten": (vx, vy + w["bh"] + lang[2]),
    }
    for r, t in (("links", links), ("hinten", hinten), ("unten", unten)):
        c = farben.get(r)
        f.arrow([(vx, vy), sp[r]], lw=lw, color=c, name=f"Dimension {t}")
    if links_stil == "unter":
        dim_text(f, w["fx"] - 1.0, vy + 1.0, b, links, align="r", anchor="t", size=size, farbe=farben.get("links"))
    else:
        dim_text(f, sp["links"][0] - 1.2, sp["links"][1], b, links, align="r", size=size, farbe=farben.get("links"))
    if hinten_stil == "ueber":      # über der Pfeilspitze (spart Breite)
        dim_text(f, sp["hinten"][0] - 5.0, sp["hinten"][1] - 1.0, b, hinten, align="c", anchor="b", size=size,
                 farbe=farben.get("hinten"))
    else:
        dim_text(f, sp["hinten"][0] + 1.2, sp["hinten"][1], b, hinten, align="l", size=size,
                 farbe=farben.get("hinten"))
    dim_text(f, sp["unten"][0], sp["unten"][1] + 0.6, b, unten, align="c", anchor="t", size=size,
             farbe=farben.get("unten"))
    return sp, b


# --------------------------------------------------------------------------
# Tabellen (Drill-Down, Drill-Through, Drill-Across, Split und Merge)
# --------------------------------------------------------------------------
def zahl(v):
    return f"{v:,.0f}".replace(",", ".")


class Tabelle:
    """Schlichte Tabelle im Buchstil: Kopfzeile fett, Linie unter dem Kopf, Haarlinien zwischen den Zeilen, kräftigere
    Linie über der Summenzeile, keine senkrechten Linien und keine Füllungen. Werte als weiße Felder in Textbreite,
    damit Pfeile, die hinter ihnen durchlaufen, verdeckt werden (Pfeile also vor den Werten zeichnen)."""

    def __init__(self, x, y, breiten, kopf_h, zeilen_h, n_zeilen, summe_ab=None):
        self.x, self.y, self.breiten = x, y, breiten
        self.kopf_h, self.zeilen_h, self.n = kopf_h, zeilen_h, n_zeilen
        self.summe_ab = summe_ab
        self.b = sum(breiten)
        self.h = kopf_h + n_zeilen * zeilen_h

    def sx(self, s):            # linke Kante der Spalte s
        return self.x + sum(self.breiten[:s])

    def cx(self, s):            # Mitte der Spalte s
        return self.sx(s) + self.breiten[s] / 2

    def zy(self, z):            # Mitte der Zeile z (z = -1: Kopf)
        if z < 0:
            return self.y + self.kopf_h / 2
        return self.y + self.kopf_h + (z + 0.5) * self.zeilen_h

    def linien(self, f, name="Tabelle", kopf=True):
        x0, x1 = self.x, self.x + self.b
        if kopf:
            f.line([(x0, self.y), (x1, self.y)], color=ANTHRAZIT, lw=0.75, name=f"{name} Linie oben")
            f.line([(x0, self.y + self.kopf_h), (x1, self.y + self.kopf_h)], color=ANTHRAZIT, lw=0.5,
                   name=f"{name} Linie Kopf")
        else:
            f.line([(x0, self.y + self.kopf_h), (x1, self.y + self.kopf_h)], color=ANTHRAZIT, lw=0.75,
                   name=f"{name} Linie oben")
        for z in range(1, self.n):
            yy = self.y + self.kopf_h + z * self.zeilen_h
            if self.summe_ab is not None and z == self.summe_ab:
                f.line([(x0, yy), (x1, yy)], color=ANTHRAZIT, lw=0.5, name=f"{name} Linie Summe")
            else:
                f.line([(x0, yy), (x1, yy)], color="BDBDBD", lw=0.5, name=f"{name} Haarlinie")
        yy = self.y + self.h
        f.line([(x0, yy), (x1, yy)], color=ANTHRAZIT, lw=0.75, name=f"{name} Linie unten")

    def text(self, f, s, z, t, align="c", bold=False, italic=False, size=7.0, farbe=None, rand=1.0, name=None):
        x0 = self.sx(s) + rand
        b = self.breiten[s] - 2 * rand
        h = self.kopf_h if z < 0 else self.zeilen_h
        f.text(x0, self.zy(z) - h / 2, b, h, [P(t, size=size, bold=bold, italic=italic, color=farbe)], align=align,
               anchor="m", name=name or t)

    def wert(self, f, s, z, t, bold=False, size=7.0, align="c", rand=1.0, name=None):
        """Wert als weißes Feld in Textbreite (verdeckt dahinterliegende Pfeile). Gibt das Feld (x0, y0, x1, y1) zurück."""
        bt = text_width_mm(t, size, bold=bold) + 1.2
        h = size * 0.3528 * 1.2 + 0.4
        if align == "c":
            x0 = self.cx(s) - bt / 2
        elif align == "r":
            x0 = self.sx(s) + self.breiten[s] - rand - bt
        else:
            x0 = self.sx(s) + rand
        y0 = self.zy(z) - h / 2
        f.box(x0, y0, bt, h, [P(t, size=size, bold=bold)], role="box_plain", line="none", rounded=False,
              ins=(0.0, 0.0), name=name or f"Wert {t}")
        return (x0, y0, x0 + bt, y0 + h)


def legende_pfeile(f, x, y, eintraege, size=7.0, laenge=7.0, zeilen_h=4.4, name="Legende"):
    """Legende für Pfeilarten: eintraege = [(dash, farbe, text)]."""
    for n, (dash, farbe, t) in enumerate(eintraege):
        yy = y + n * zeilen_h + zeilen_h / 2
        f.arrow([(x, yy), (x + laenge, yy)], dash=dash, color=farbe, name=f"{name} Pfeil {n + 1}")
        f.text(x + laenge + 1.5, yy - zeilen_h / 2, text_width_mm(t, size) + 1.0, zeilen_h, [P(t, size=size)],
               anchor="m", name=f"{name} {t}")


def standardwuerfel(f, fx, fy, auswahl=None, zelle=7.0):
    """Würfel aus Abb. 3.33 (Produkt 4 nach links, Zeit 5 nach unten, Region 3 nach hinten) mit „Kennzahlen“ und
    Dimensionspfeilen – gemeinsam für 3.33, 3.35 (Slice) und 3.36 (Dice)."""
    w = wuerfel(f, fx, fy, nx=4, ny=5, nz=3, zelle=zelle, auswahl=auswahl)
    kennzahlen(f, w, zeile=2, size=7.0)
    sp, b = achsen(f, w, "Produkt", "Region", "Zeit", lw=1.25, size=7.5, lang=(7.0, 1.55, 8.0), links_stil="unter")
    return w, sp, b


# --------------------------------------------------------------------------
# Drill-Down, Drill-Through, Drill-Across, Split und Merge: Würfel, Umsatztabelle, Produkttabelle
# --------------------------------------------------------------------------
MONATE = ("Januar", "Februar", "März", "1. Quartal")
PRODUKTE = (("City Bike", 20000), ("Mountain Bike", 7000), ("Racing Bike", 17000), ("Trekking Bike", 13000))
LW_ROLL = 0.75                     # Pfeile Roll-Up/Drill-Down


def drillwuerfel(f, fx, fy, links="Region", farben=None, name="Würfel", zelle=4.0, auswahl=None,
                 hinten_stil="neben"):
    """Würfel der Abb. 3.37–3.40: links Region (4), hinten Produkt (4), unten Zeit (5). Rot hervorgehoben ist, was die
    Tabelle zeigt – Standard: zwei Regionen × drei Monate × alle Produkte."""
    w = wuerfel(f, fx, fy, nx=4, ny=5, nz=4, zelle=zelle, name=name, auswahl=auswahl or {"i": (2, 4), "j": (0, 3)})
    kennzahlen(f, w, zeile=3, size=7.0, name=f"{name} Kennzahlen")
    sp, b = achsen(f, w, links, "Produkt", "Zeit", lw=1.0, size=7.0, lang=(4.0, 1.35, 5.0), links_stil="unter",
                   farben=farben, hinten_stil=hinten_stil)
    return w, sp, b


def umsatztabelle(f, x, y, spalten, werte, breiten=(20.0, 23.0, 23.0, 23.0), kopf_h=7.0, zeilen_h=8.0,
                  senkrecht=True, ecke="Umsatz in €", name="Umsatztabelle"):
    """Tabelle Monate × (Summe, Teil 1, Teil 2) mit Pfeilen wie im Original:
    waagerecht von den Teilen zur Summe (Roll-Up, durchgezogen), in der Quartalszeile zusätzlich zurück (Drill-Down,
    gestrichelt); senkrecht (optional) in den Teilspalten von den Monaten zum Quartal (Roll-Up), in der Summenspalte
    hinunter (Roll-Up) und hinauf (Drill-Down). werte[z][s] mit s = 0 Summe, 1, 2 Teile."""
    t = Tabelle(x, y, list(breiten), kopf_h, zeilen_h, len(MONATE), summe_ab=3)
    t.linien(f, name=name)
    t.text(f, 0, -1, ecke, align="l", bold=True, rand=0.6, name=f"{name} Kopf {ecke}")
    for s, sp_ in enumerate(spalten, start=1):
        t.text(f, s, -1, sp_, bold=True, rand=0.6, name=f"{name} Kopf {sp_}")
    for z, m in enumerate(MONATE):
        t.text(f, 0, z, m, align="l", rand=0.6, name=f"{name} {m}")
    # Wertefelder vorab vermessen (rechtsbündig an gemeinsamer Achse je Spalte)
    halb = (text_width_mm("00.000", 7.0) + 1.2) / 2
    feld = {}
    for z in range(len(MONATE)):
        for s in range(3):
            fett = (z == 3 and s == 0)
            txt = zahl(werte[z][s])
            bt = text_width_mm(txt, 7.0, bold=fett) + 1.2
            hh = 7.0 * 0.3528 * 1.2 + 0.4
            x1 = t.cx(s + 1) + halb
            feld[(z, s)] = (x1 - bt, t.zy(z) - hh / 2, x1, t.zy(z) + hh / 2, txt, fett)
    A = lambda pts, gestrichelt, n: f.arrow(pts, dash="sysDash" if gestrichelt else None, lw=LW_ROLL, name=n)
    # waagerecht: Teile → Summe
    for z in range(3):
        A([(feld[(z, 2)][0], t.zy(z)), (feld[(z, 0)][2], t.zy(z))], False, f"{name} Roll-Up {MONATE[z]}")
    yq = t.zy(3)
    A([(feld[(3, 2)][0], yq - 0.8), (feld[(3, 0)][2], yq - 0.8)], False, f"{name} Roll-Up Quartal")
    A([(feld[(3, 0)][2], yq + 0.8), (feld[(3, 2)][0], yq + 0.8)], True, f"{name} Drill-Down Quartal")
    if senkrecht:
        for s in (1, 2):
            cx = t.cx(s + 1)
            A([(cx, feld[(0, s)][3]), (cx, feld[(3, s)][1])], False, f"{name} Roll-Up {spalten[s]}")
        cx = t.cx(1)
        A([(cx - 2.4, feld[(3, 0)][1]), (cx - 2.4, feld[(0, 0)][3])], True, f"{name} Drill-Down Summe")
        A([(cx + 2.4, feld[(0, 0)][3]), (cx + 2.4, feld[(3, 0)][1])], False, f"{name} Roll-Up Summe")
    # Wertefelder zuletzt (verdecken die durchlaufenden Pfeile)
    for (z, s), (x0, y0, x1, y1, txt, fett) in feld.items():
        f.box(x0, y0, x1 - x0, y1 - y0, [P(txt, size=7.0, bold=fett)], role="box_plain", line="none", rounded=False,
              ins=(0.0, 0.0), name=f"{name} Wert {MONATE[z]} {spalten[s]}")
    return t, feld


def produkttabelle(f, cx, y, von=None, breite_wert=14.0, breite_label=20.0, kopf_h=6.0, zeilen_h=7.0,
                   name="Produkttabelle"):
    """Umsatz des 1. Quartals je Produkt. Die Wertespalte steht mittig unter der Summenspalte der Umsatztabelle (cx);
    von = Wertefeld 57.000 der Umsatztabelle: gestrichelter Drill-Down-Pfeil herunter zum ersten Produkt, in der
    Tabelle durchgezogener Roll-Up-Pfeil zur Summe."""
    x_wert = cx - breite_wert / 2
    t = Tabelle(x_wert - breite_label, y, [breite_label, breite_wert], kopf_h, zeilen_h, len(PRODUKTE) + 1,
                summe_ab=len(PRODUKTE))
    t.linien(f, name=name)
    t.text(f, 0, -1, "Produkt", align="l", bold=True, rand=0.6, name=f"{name} Kopf")
    zeilen = [*PRODUKTE, ("Summe", sum(v for _, v in PRODUKTE))]
    halb = (text_width_mm("00.000", 7.0) + 1.2) / 2
    hh = 7.0 * 0.3528 * 1.2 + 0.4
    feld = []
    for z, (lab, v) in enumerate(zeilen):
        t.text(f, 0, z, lab, align="l", rand=0.6, name=f"{name} {lab}")
        fett = z == len(PRODUKTE)
        txt = zahl(v)
        bt = text_width_mm(txt, 7.0, bold=fett) + 1.2
        x1 = t.cx(1) + halb
        feld.append((x1 - bt, t.zy(z) - hh / 2, x1, t.zy(z) + hh / 2, txt, fett))
    cx = t.cx(1)
    if von is not None:
        f.arrow([(cx, von[3]), (cx, feld[0][1])], dash="sysDash", lw=LW_ROLL, name=f"{name} Drill-Down Produkt")
    f.arrow([(cx, feld[0][3]), (cx, feld[-1][1])], lw=LW_ROLL, name=f"{name} Roll-Up Produkt")
    for x0, y0, x1, y1, txt, fett in feld:
        f.box(x0, y0, x1 - x0, y1 - y0, [P(txt, size=7.0, bold=fett)], role="box_plain", line="none", rounded=False,
              ins=(0.0, 0.0), name=f"{name} Wert {txt}")
    return t, feld


def legende_roll(f, x, y, breite, eintraege=(("Aggregation (Roll-Up)", False), ("Disaggregation (Drill-Down)", True)),
                 name="Legende"):
    """Legende der beiden Pfeilarten; Einträge als (Text, gestrichelt)."""
    zh = 5.0
    for n, (txt, gestr) in enumerate(eintraege):
        yy = y + (n + 0.5) * zh
        f.arrow([(x, yy), (x + 7.0, yy)], dash="sysDash" if gestr else None, lw=LW_ROLL, name=f"{name} Pfeil {n + 1}")
        f.text(x + 8.5, yy - zh / 2, breite - 8.5, zh, [P(txt, size=7.0)], anchor="m", name=f"{name} {txt}")
    return y + len(eintraege) * zh
