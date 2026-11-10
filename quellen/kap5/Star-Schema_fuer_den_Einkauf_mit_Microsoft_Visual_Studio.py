"""Abb. 5.77 – Star-Schema für den Einkauf (Produktscreenshot einer Würfel-Entwurfsansicht, softwareneutral als Diagramm)."""
# Muster wie Abb. 5.19 (Star-Schema mit Fakten- und Dimensionstabellen): Tabellenkarten mit Kopfleiste (Name, Rolle),
# Felder mit „PK“/„FK“, Beziehungen als orthogonale Linien mit Kardinalität n (Fakten) : 1 (Dimension).
# Faktentabelle box_hi, Dimensionen box; kein Rot (wie 5.19). Anordnung wie im Original: Lieferant oben, Datum links,
# Einkäufer rechts, Region und Artikel unten links bzw. rechts, Verbindungen nach unten mit zwei Knicken wie im Original.
# Gegenüber dem Original:
# - Präfixe „TC_“/„TD_“ entfallen, Rolle als zweite Zeile im Kopf; Schlüssel zuerst (im Original ID_Region am Ende).
# - Pfeile Fakten → Dimension → Linien mit Kardinalität n:1 wie in Abb. 5.19–5.22.
# - Englische Feldnamen übersetzt: City → Ort, vendor posting group → Buchungsgruppe, Country (Region Code) → Ländercode,
#   country_name/country_code → Ländername/Ländercode, Inventory posting group → Lagerbuchungsgruppe; Datum Tag → Jahr.
# - Lieferant: im Original durch Bildlauf abgeschnitten („vendor posting g…“, „Countr…“) – aus der Attributliste ergänzt.
# - Seitenleisten Measures und Dimensionen des Würfels als zwei gestrichelte Gruppen oben (Measures mit „TC Einkauf
#   Anzahl“ als „Anzahl Einkäufe“, Hierarchien Produktgruppe und Region aus der Dimensionsliste);
#   Projektmappen-Explorer, Menüs, Symbolleisten, Reiter, Tabellen- und Schlüsselsymbole entfallen.
STEM = "Star-Schema_fuer_den_Einkauf_mit_Microsoft_Visual_Studio"
from bookfig import Fig, P, Para, MM, MSO_SHAPE, Emu

W = 110
CW = 32.5                         # Kartenbreite (längstes Feld „Lagerbuchungsgruppe“)
XS = [0.3, 38.75, 77.2]           # Spalten
GY = 7.0                          # Abstand oben – Mitte
GY2 = 9.0                         # Abstand Mitte – unten (Platz für die Knicke)
RH = 3.2                          # Feldzeile
KW = 4.4                          # Schlüsselspalte („PK“/„FK“)
PAD = 1.0
SEP = 0.8
FAKT, DIM = "Faktentabelle", "Dimensionstabelle"

TABELLEN = {
    "Lieferant": (DIM, [("PK", "LieferantID"), ("", "LieferantNr"), ("", "Name"), ("", "Ort"), ("", "Einkäufercode"),
                        ("", "Buchungsgruppe"), ("", "Ländercode")]),
    "Datum": (DIM, [("PK", "DatumID"), ("", "Tag"), ("", "Monat"), ("", "Jahr")]),
    "Einkauf": (FAKT, [("FK", "ArtikelID"), ("FK", "EinkäuferID"), ("FK", "LieferantID"), ("FK", "DatumID"),
                       ("FK", "RegionID"), ("", "Menge"), ("", "Wert")]),
    "Einkäufer": (DIM, [("PK", "EinkäuferID"), ("", "EinkäuferCode"), ("", "EinkäuferName")]),
    "Region": (DIM, [("PK", "RegionID"), ("", "Ländername"), ("", "Ländercode")]),
    "Artikel": (DIM, [("PK", "ArtikelID"), ("", "Artikelnummer"), ("", "Artikelbezeichnung"), ("", "Lagerbuchungsgruppe"),
                      ("", "Einzelpreis")]),
}
WUERFEL = [("Würfel: Measures", ["Menge", "Wert", "Anzahl Einkäufe"]),
           ("Würfel: Hierarchien", ["Produktgruppe › Artikel", "Region › Lieferant"])]


def kopf_paras(name, rolle):
    return [Para(name, size="head", bold=True), Para(rolle, size=6.0, color="FFFFFF")]


def kopfhoehe(f):
    return round(f.measure(kopf_paras("Einkauf", FAKT), CW, ins=(1.6, 0.5)), 2)


def kartenhoehe(f, felder):
    n_k = sum(1 for k, _ in felder if k)
    return kopfhoehe(f) + 2 * PAD + len(felder) * RH + (SEP if 0 < n_k < len(felder) else 0)


def karte(f, x, y, name, rolle, felder):
    """Tabellenkarte wie Abb. 5.19: Rumpf (Fakten box_hi, Dimension box), Kopfleiste oben gerundet, Feldzeilen."""
    t = f.t
    h = kartenhoehe(f, felder)
    rumpf = "box_hi" if rolle == FAKT else "box"
    f.box(x, y, CW, h, None, role=rumpf, name=f"Tabelle {name}")
    kh = kopfhoehe(f)
    hr = t.role("header")
    s = f.sh.add_shape(MSO_SHAPE.ROUND_2_SAME_RECTANGLE, Emu(round(x * MM)), Emu(round(y * MM)),
                       Emu(round(CW * MM)), Emu(round(kh * MM)))
    f._strip_style(s)
    s.adjustments[0] = t.role("box").radius / kh
    s.adjustments[1] = 0.0
    f._apply_role(s, hr)
    s.name = f"Kopf {name}"
    f._fill_text(s, kopf_paras(name, rolle), CW, kh, hr.text, "l", "m", (1.6, 0.5), label=name, bg=hr.fill)
    bg = t.role(rumpf).fill
    yy = y + kh + PAD
    n_k = sum(1 for k, _ in felder if k)
    for i, (k, feld) in enumerate(felder):
        if i == n_k and 0 < n_k < len(felder):
            f.line([(x + 1.0, yy + SEP / 2), (x + CW - 1.0, yy + SEP / 2)], color="9A9A9A", lw=0.4,
                   name=f"Trennlinie {name}")
            yy += SEP
        if k:
            f.text(x + 1.2, yy, KW, RH, [P(k, size=6.0, bold=True)], anchor="m", bg=bg, name=f"{name} {feld} {k}")
        f.text(x + 1.2 + KW, yy, CW - 2.4 - KW, RH, [P(feld, size=7.0)], anchor="m", bg=bg, name=f"{name} {feld}")
        yy += RH
    return h


def gruppe(f, x, y, titel, zeilen, h):
    """Würfelangaben als gestrichelte Gruppe: Titel fett, Zeilen mit Strich."""
    paras = [P(titel, size="note", bold=True)] + [P(z, size=7.0, bullet="–") for z in zeilen]
    f.box(x, y, CW, h, None, role="container", name=f"Würfel {titel}")
    f.text(x, y, CW, h, paras, anchor="t", ins=(1.6, 1.0), name=f"Würfel {titel} Text")
    return h


def kard(f, x, y, txt, align="l"):
    f.text(x, y, 3.0, 3.2, [P(txt, size=7.0, bold=True)], align=align, anchor="m", name=f"Kardinalität {txt}")


def build(theme):
    tmp = Fig(W, 30, theme)
    hh = {k: kartenhoehe(tmp, v[1]) for k, v in TABELLEN.items()}
    r1 = 0.3
    r2 = r1 + hh["Lieferant"] + GY
    r3 = r2 + max(hh["Einkauf"], hh["Datum"], hh["Einkäufer"]) + GY2
    H = round(r3 + max(hh["Region"], hh["Artikel"]) + 0.3, 1)
    f = Fig(W, H, theme, STEM)
    lage = {"Lieferant": (XS[1], r1), "Datum": (XS[0], r2), "Einkauf": (XS[1], r2), "Einkäufer": (XS[2], r2),
            "Region": (XS[0], r3), "Artikel": (XS[2], r3)}
    for name, (x, y) in lage.items():
        rolle, felder = TABELLEN[name]
        karte(f, x, y, name, rolle, felder)
    # Würfel: Measures links oben, Hierarchien rechts oben, unten bündig mit der Lieferantenkarte
    hw = max(round(tmp.measure([P(t, size="note", bold=True)] + [P(z, size=7.0, bullet="–") for z in zz], CW,
                                   ins=(1.6, 1.0)), 2) for t, zz in WUERFEL)
    for (titel, zeilen), x in zip(WUERFEL, (XS[0], XS[2])):
        gruppe(f, x, r1 + hh["Lieferant"] - hw, titel, zeilen, hw)

    cx = lambda n: lage[n][0] + CW / 2
    bot = lambda n: lage[n][1] + hh[n]
    # Lieferant – Einkauf (senkrecht)
    f.line([(cx("Lieferant"), bot("Lieferant")), (cx("Lieferant"), r2)], name="Beziehung Lieferant-Einkauf")
    kard(f, cx("Lieferant") + 0.7, bot("Lieferant") + 0.1, "1")
    kard(f, cx("Lieferant") + 0.7, r2 - 3.3, "n")
    # Datum – Einkauf und Einkauf – Einkäufer (waagerecht, gemeinsame Höhe)
    yh = r2 + hh["Einkäufer"] / 2
    f.line([(XS[0] + CW, yh), (XS[1], yh)], name="Beziehung Datum-Einkauf")
    kard(f, XS[0] + CW + 0.6, yh - 3.4, "1")
    kard(f, XS[1] - 3.6, yh - 3.4, "n", align="r")
    f.line([(XS[1] + CW, yh), (XS[2], yh)], name="Beziehung Einkauf-Einkäufer")
    kard(f, XS[1] + CW + 0.6, yh - 3.4, "n")
    kard(f, XS[2] - 3.6, yh - 3.4, "1", align="r")
    # Einkauf – Region und Einkauf – Artikel: senkrecht aus der Faktentabelle, Knick, senkrecht in die Dimension
    ym = bot("Einkauf") + (r3 - bot("Einkauf")) / 2
    for ziel, xa in (("Region", XS[1] + 7.0), ("Artikel", XS[1] + CW - 7.0)):
        f.line([(xa, bot("Einkauf")), (xa, ym), (cx(ziel), ym), (cx(ziel), r3)], name=f"Beziehung Einkauf-{ziel}")
        kard(f, xa + 0.7, bot("Einkauf") + 0.1, "n")
        kard(f, cx(ziel) + 0.7, r3 - 3.3, "1")
    return f
