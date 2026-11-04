"""Abb. 5.17 – Datenbankschema in 3NF."""
# Muster: Datenmodell als Tabellenkarten wie Abb. 5.19–5.22 (Kopfleiste = Tabellenname, Zeilen = Felder,
# Schlüssel als Text „PK“/„FK“), Beziehungen als orthogonale Linien mit Kardinalität „1“/„n“ an den Enden.
# Anordnung wie im Original: Produkte und Verkaufsdetails oben, Kunden und Verkäufe unten.
# Alle Tabellen box (im 3NF-Schema gibt es keine Fakten-/Dimensionsrollen), kein Rot.
# Gegenüber der Modellansicht des Originals (Produktscreenshot, softwareneutral nachgebaut):
# - Schlüssel ergänzt: PK/FK wie in Abb. 5.18 (dort unterstrichen); Verkaufsdetails mit zusammengesetztem
#   Schlüssel (VerkaufsID, ProduktID), beide zugleich Fremdschlüssel.
# - Felder in der Reihenfolge von Abb. 5.18 (Schlüssel zuerst) statt alphabetisch; Schreibweise einheitlich
#   mit 5.18–5.22: „Produktname“ → „ProduktName“; „Verkaufsdatum“, „Verkaufsort“ wie im Star-Schema.
# - „*“ → „n“ (1:n-Notation); Tabellen-/Σ-/Kalendersymbole, „…“, „Collapse“, Bildlaufleisten und
#   Filterrichtungssymbole entfallen.
STEM = "Datenbankschema_in_3NF"
from bookfig import Fig, P, Para, MM, MSO_SHAPE, Emu

W = 110
CW = 40.0                         # Kartenbreite
XS = [0.3, W - 0.3 - CW]          # Spalten
GY = 8.0                          # Zeilenabstand
RH = 3.2                          # Feldzeile
KW = {False: 4.4, True: 8.0}      # Schlüsselspalte: „PK“/„FK“ bzw. „PK, FK“ (zusammengesetzter Schlüssel)
PAD = 1.0
SEP = 0.8
KH = 5.0                          # Kopfleiste

TABELLEN = {
    "Produkte": [("PK", "ProduktID"), ("", "ProduktName"), ("", "Preis"), ("", "VeganeOption")],
    "Verkaufsdetails": [("PK, FK", "VerkaufsID"), ("PK, FK", "ProduktID"), ("", "Menge"), ("", "Vegan")],
    "Kunden": [("PK", "KundenID"), ("", "Name"), ("", "DreamCardNr"), ("", "VeganePraeferenz")],
    "Verkäufe": [("PK", "VerkaufsID"), ("FK", "KundenID"), ("", "Verkaufsdatum"), ("", "Verkaufsort")],
}


def kartenhoehe(felder):
    n_k = sum(1 for k, _ in felder if k)
    return KH + 2 * PAD + len(felder) * RH + (SEP if 0 < n_k < len(felder) else 0)


def karte(f, x, y, name, felder):
    """Tabellenkarte: Rumpf box, Kopfleiste oben gerundet, Feldzeilen mit Schlüsselspalte."""
    t = f.t
    h = kartenhoehe(felder)
    f.box(x, y, CW, h, None, role="box", name=f"Tabelle {name}")
    hr = t.role("header")
    s = f.sh.add_shape(MSO_SHAPE.ROUND_2_SAME_RECTANGLE, Emu(round(x * MM)), Emu(round(y * MM)),
                       Emu(round(CW * MM)), Emu(round(KH * MM)))
    f._strip_style(s)
    s.adjustments[0] = t.role("box").radius / KH
    s.adjustments[1] = 0.0
    f._apply_role(s, hr)
    s.name = f"Kopf {name}"
    f._fill_text(s, [Para(name, size="head", bold=True)], CW, KH, hr.text, "l", "m", (1.6, 0.3), label=name,
                 bg=hr.fill)
    bg = t.role("box").fill
    yy = y + KH + PAD
    n_k = sum(1 for k, _ in felder if k)
    kw = KW[any("," in k for k, _ in felder)]
    for i, (k, feld) in enumerate(felder):
        if i == n_k and 0 < n_k < len(felder):
            f.line([(x + 1.0, yy + SEP / 2), (x + CW - 1.0, yy + SEP / 2)], color="9A9A9A", lw=0.4,
                   name=f"Trennlinie {name}")
            yy += SEP
        if k:
            f.text(x + 1.2, yy, kw, RH, [P(k, size=6.0, bold=True)], anchor="m", bg=bg, name=f"{name} {feld} {k}")
        f.text(x + 1.2 + kw, yy, CW - 2.4 - kw, RH, [P(feld, size=7.0)], anchor="m", bg=bg, name=f"{name} {feld}")
        yy += RH
    return h


def kard(f, x, y, txt, align="l"):
    f.text(x, y, 3.0, 3.2, [P(txt, size=7.0, bold=True)], align=align, anchor="m", name=f"Kardinalität {txt}")


def build(theme):
    h = {k: kartenhoehe(v) for k, v in TABELLEN.items()}
    r1 = 0.3
    r2 = r1 + max(h["Produkte"], h["Verkaufsdetails"]) + GY
    H = round(r2 + max(h["Kunden"], h["Verkäufe"]) + 0.3, 1)
    f = Fig(W, H, theme, STEM)
    lage = {"Produkte": (XS[0], r1), "Verkaufsdetails": (XS[1], r1), "Kunden": (XS[0], r2), "Verkäufe": (XS[1], r2)}
    for name, (x, y) in lage.items():
        karte(f, x, y, name, TABELLEN[name])

    # Produkte 1 – n Verkaufsdetails (ProduktID)
    y = r1 + h["Produkte"] / 2
    f.line([(XS[0] + CW, y), (XS[1], y)], name="Beziehung Produkte-Verkaufsdetails")
    kard(f, XS[0] + CW + 0.6, y - 3.4, "1")
    kard(f, XS[1] - 3.6, y - 3.4, "n", align="r")
    # Kunden 1 – n Verkäufe (KundenID)
    y = r2 + h["Kunden"] / 2
    f.line([(XS[0] + CW, y), (XS[1], y)], name="Beziehung Kunden-Verkäufe")
    kard(f, XS[0] + CW + 0.6, y - 3.4, "1")
    kard(f, XS[1] - 3.6, y - 3.4, "n", align="r")
    # Verkaufsdetails n – 1 Verkäufe (VerkaufsID)
    x = XS[1] + CW / 2
    y0, y1 = r1 + h["Verkaufsdetails"], r2
    f.line([(x, y0), (x, y1)], name="Beziehung Verkaufsdetails-Verkäufe")
    kard(f, x + 0.7, y0 + 0.1, "n")
    kard(f, x + 0.7, y1 - 3.3, "1")
    return f
