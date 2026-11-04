"""Abb. 5.22 – Snowflake-Schema (Vgl. Mohr 2006, S. 98)."""
# Muster und Zeichencode wie Abb. 5.19 (Star-Schema) und 5.21 (Galaxy-Schema): gleiche Tabellen, Felder, Größen
# und Lagen; ergänzt ist die normalisierte Dimension Postleitzahlen unter Kunde (im Original rechts unten neben
# Kunde), die Dimension Kunde erhält dafür den Fremdschlüssel PLZ. Die Kopfleiste von Postleitzahlen ist rot:
# das Element, das gegenüber 5.21 neu ist. Faktentabellen box_hi, Dimensionen box.
# Gegenüber der Modellansicht des Originals (Produktscreenshot, softwareneutral nachgebaut):
# - „Dreamcardnutzung“ → „DreamCardNutzung“; Beziehung Datum–DreamCardNutzung gestrichelt wie in 5.21
#   (im Original gepunktet = inaktive Beziehung).
# - Postleitzahlen unter Kunde statt rechts daneben (Breite 110 mm reicht nicht für eine vierte Spalte).
# - „*“ → „n“; Felder: Schlüssel zuerst, Datum in der Hierarchie Tag → Jahr; entfallen: Tabellen-/Σ-/
#   Kalender-/Augensymbole, Auswahlmarkierung an PLZID, „…“, „Collapse“, Bildlaufleisten, Filterrichtungssymbole.
STEM = "Snowflake-Schema"
VARIANTE = "snowflake"
from bookfig import Fig, P, Para, MM, MSO_SHAPE, Emu

W = 110
CW = 31.0                         # Kartenbreite
XS = [0.3, 39.5, 78.7]            # Spalten
GY = 7.0                          # Zeilenabstand (Platz für senkrechte Linien und Kardinalität)
RH = 3.2                          # Feldzeile
KW = 4.4                          # Schlüsselspalte („PK“/„FK“)
PAD = 1.0                         # Innenabstand oben/unten im Rumpf
SEP = 0.8                         # Abstand Schlüssel | übrige Felder (mit Trennlinie)
FAKT, DIM = "Faktentabelle", "Dimensionstabelle"


def modell(variante):
    """Tabellen der Serie: Name -> (Rolle, [(Schlüssel, Feld)])."""
    kunde = [("PK", "KundenID")] + ([("FK", "PLZ")] if variante == "snowflake" else []) + \
            [("", "Name"), ("", "DreamCardNr"), ("", "VeganePraeferenz")]
    t = {
        "Datum": (DIM, [("PK", "DatumID"), ("", "Tag"), ("", "Monat"), ("", "Quartal"), ("", "Halbjahr"), ("", "Jahr")]),
        "Produkt": (DIM, [("PK", "ProduktID"), ("", "ProduktName"), ("", "Preis"), ("", "VeganeOption")]),
        "Verkäufe": (FAKT, [("FK", "KundenID"), ("FK", "ProduktID"), ("FK", "VerkaufsdatumID"), ("FK", "VerkaufsortID"),
                            ("", "Menge"), ("", "Umsatz")]),
        "Kunde": (DIM, kunde),
        "Verkaufsort": (DIM, [("PK", "VerkaufsortID"), ("", "Verkaufsort")]),
    }
    if variante in ("galaxy", "snowflake"):
        t["DreamCardNutzung"] = (FAKT, [("FK", "DatumID"), ("FK", "KundenID"), ("", "Anzahl")])
    if variante == "snowflake":
        t["Postleitzahlen"] = (DIM, [("PK", "PLZID"), ("", "Stadt"), ("", "Stadtteil"), ("", "Einwohnerzahl")])
    return t


def kopf_paras(name, rolle):
    return [Para(name, size="head", bold=True), Para(rolle, size=6.0, color="FFFFFF")]


def kopfhoehe(f):
    return round(f.measure(kopf_paras("Verkäufe", FAKT), CW, ins=(1.6, 0.5)), 2)


def kartenhoehe(f, felder):
    n_k = sum(1 for k, _ in felder if k)
    return kopfhoehe(f) + 2 * PAD + len(felder) * RH + (SEP if 0 < n_k < len(felder) else 0)


def karte(f, x, y, name, rolle, felder, kopf_rolle="header"):
    """Tabellenkarte: Rumpf (Fakten box_hi, Dimension box), Kopfleiste oben gerundet, Feldzeilen."""
    t = f.t
    h = kartenhoehe(f, felder)
    rumpf = "box_hi" if rolle == FAKT else "box"
    f.box(x, y, CW, h, None, role=rumpf, name=f"Tabelle {name}")
    kh = kopfhoehe(f)
    hr = t.role(kopf_rolle)
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


def kard(f, x, y, txt, align="l"):
    f.text(x, y, 3.0, 3.2, [P(txt, size=7.0, bold=True)], align=align, anchor="m", name=f"Kardinalität {txt}")


def senkrecht(f, x, y_oben, y_unten, oben, unten, dash=False):
    """Beziehung zwischen zwei übereinanderliegenden Karten; Kardinalität rechts neben der Linie."""
    pts = [(x, y_oben), (x, y_unten)]
    if dash:
        f.arrow(pts, role="info", tail=False, dash="sysDash", name=f"Beziehung {oben}-{unten}")
    else:
        f.line(pts, name=f"Beziehung {oben}-{unten}")
    kard(f, x + 0.7, y_oben + 0.1, oben)
    kard(f, x + 0.7, y_unten - 3.3, unten)


def waagerecht(f, x_links, x_rechts, y, links, rechts, dash=False):
    """Beziehung zwischen zwei nebeneinanderliegenden Karten; Kardinalität über der Linie."""
    pts = [(x_links, y), (x_rechts, y)]
    if dash:
        f.arrow(pts, role="info", tail=False, dash="sysDash", name=f"Beziehung {links}-{rechts}")
    else:
        f.line(pts, name=f"Beziehung {links}-{rechts}")
    kard(f, x_links + 0.6, y - 3.4, links)
    kard(f, x_rechts - 3.6, y - 3.4, rechts, align="r")


def zeichnen(theme, variante, stem, neu=None):
    """Zeichnet die Variante star | galaxy | snowflake; `neu` bekommt eine rote Kopfleiste."""
    tab = modell(variante)
    tmp = Fig(W, 30, theme)
    hh = {k: kartenhoehe(tmp, v[1]) for k, v in tab.items()}
    r1 = 0.3
    r2 = r1 + hh["Datum"] + GY
    r3 = r2 + max(hh["Verkäufe"], hh["Kunde"], hh["Produkt"]) + GY
    unten = max(hh["Verkaufsort"], hh.get("Postleitzahlen", 0))
    H = round(r3 + unten + 0.3, 1)
    f = Fig(W, H, theme, stem)
    lage = {"Datum": (XS[1], r1), "Produkt": (XS[0], r2), "Verkäufe": (XS[1], r2), "Kunde": (XS[2], r2),
            "Verkaufsort": (XS[1], r3)}
    if "DreamCardNutzung" in tab:
        lage["DreamCardNutzung"] = (XS[2], r1 + hh["Datum"] - hh["DreamCardNutzung"])
    if "Postleitzahlen" in tab:
        lage["Postleitzahlen"] = (XS[2], r3)
    for name, (x, y) in lage.items():
        rolle, felder = tab[name]
        karte(f, x, y, name, rolle, felder, kopf_rolle="box_strong" if name == neu else "header")

    cx = lambda n: lage[n][0] + CW / 2
    top = lambda n: lage[n][1]
    bot = lambda n: lage[n][1] + hh[n]
    yh = r2 + hh["Produkt"] / 2                       # gemeinsame Höhe der waagerechten Beziehungen
    senkrecht(f, cx("Datum"), bot("Datum"), top("Verkäufe"), "1", "n")
    waagerecht(f, XS[0] + CW, XS[1], yh, "1", "n")    # Produkt – Verkäufe
    waagerecht(f, XS[1] + CW, XS[2], yh, "n", "1")    # Verkäufe – Kunde
    senkrecht(f, cx("Verkäufe"), bot("Verkäufe"), top("Verkaufsort"), "n", "1")
    if "DreamCardNutzung" in tab:
        yd = top("DreamCardNutzung") + hh["DreamCardNutzung"] / 2
        waagerecht(f, XS[1] + CW, XS[2], yd, "1", "n", dash=True)     # Datum – DreamCardNutzung
        senkrecht(f, cx("DreamCardNutzung"), bot("DreamCardNutzung"), top("Kunde"), "n", "1")
    if "Postleitzahlen" in tab:
        senkrecht(f, cx("Kunde"), bot("Kunde"), top("Postleitzahlen"), "n", "1")
    return f


def build(theme):
    return zeichnen(theme, VARIANTE, STEM, neu="Postleitzahlen")
