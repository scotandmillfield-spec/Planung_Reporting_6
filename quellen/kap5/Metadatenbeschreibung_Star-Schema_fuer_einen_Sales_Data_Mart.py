"""Abb. 5.62 – Metadatenbeschreibung Star-Schema für einen Sales Data Mart."""
# Revision DS 24.11.2026: als Abbildung statt als gesetzte LaTeX-Tabellen.
# Muster: Karten mit Kopfleiste wie im Original – oben mittig die Faktentabelle „Sales“ als Matrix (Kennzahlen in den
# Spalten, Dimensionen in den Zeilen, × = Kennzahl ist nach dieser Dimension auswertbar, – = nicht auswertbar; im
# Original „x“ und Leerfeld), darunter je Dimension eine Karte mit den Abschnitten „Eigenschaften“ und „Hierarchien“.
# Die Zwischenleisten der Abschnitte liegen in allen drei Karten auf gleicher Höhe (wie im Original).
# Hellblaue Kopfzeile → Kopfleiste (header); graue Balken „Eigenschaften …“ und rote Balken „Hierarchien“ →
# Zwischenleisten (box_hi), kein Rot: Die Abbildung hebt kein Element hervor.
# Hierarchien mit Halbgeviertstrich, die lange Datumshierarchie mit Einzug umbrochen; „DreamCard“ wie im Original.
STEM = "Metadatenbeschreibung_Star-Schema_fuer_einen_Sales_Data_Mart"
from bookfig import Fig, P, Para, MM, MSO_SHAPE, Emu

W = 110
KH = 5.0                          # Kopfleiste
RH = 3.5                          # Zeilenhöhe
SH = 4.0                          # Zwischenleiste
PAD = 0.9
G = 2.2
NB = chr(0xA0)
ST = chr(0x2013)

KENNZAHLEN = ["Umsatz", "Menge", "Bonuspunkte"]
MATRIX = [("Kunden", [1, 1, 1]), ("Datum", [1, 1, 1]), ("Produkte", [1, 1, 0])]
DIMS = [
    ("Kunde", 29.0, ["Name", "Kundennummer", "Postleitzahl", "Stadt", "DreamCard"],
     [f"Stadt {ST} Postleitzahl"]),
    ("Datum", 40.0, ["Tag", "Monat", "Quartal", "Halbjahr", "Jahr"],
     [f"Jahr {ST} Quartal {ST} Monat {ST} Tag", f"Jahr {ST} Halbjahr {ST} Quartal {ST}", f"\tMonat {ST} Tag"]),
    ("Produkte", 36.0, ["Bezeichnung", "Saisonal", "Produktlinie", "Produktgruppe"],
     [f"Produktlinie {ST} Produktgruppe"]),
]


def kopf(f, x, y, w, titel, align="l"):
    t = f.t
    s = f.sh.add_shape(MSO_SHAPE.ROUND_2_SAME_RECTANGLE, Emu(round(x * MM)), Emu(round(y * MM)),
                       Emu(round(w * MM)), Emu(round(KH * MM)))
    f._strip_style(s)
    s.adjustments[0] = t.role("box").radius / KH
    s.adjustments[1] = 0.0
    hr = t.role("header")
    f._apply_role(s, hr)
    s.name = f"Kopf {titel}"
    f._fill_text(s, [Para(titel, size="head", bold=True)], w, KH, hr.text, align, "m", (1.6, 0.3),
                 label=titel, bg=hr.fill)


def build(theme):
    t = theme
    bg = t.role("box").fill
    n_eig = max(len(d[2]) for d in DIMS)
    n_hier = max(len(d[3]) for d in DIMS)
    # ------------------------------------------------------------ Geometrie
    MW = 74.0                                     # Matrix „Sales“
    MX = (W - MW) / 2
    LW = 16.0                                     # Zeilenbeschriftung
    CWM = (MW - LW - 1.6) / 3
    MH = KH + PAD + RH * (1 + len(MATRIX)) + 0.8 + PAD
    y0 = 0.3
    yk = y0 + MH + 4.0                            # Oberkante Dimensionskarten
    DH = KH + SH + PAD + n_eig * RH + PAD + SH + PAD + n_hier * RH + PAD
    H = round(yk + DH + 0.3, 1)
    f = Fig(W, H, theme, STEM)

    # ------------------------------------------------------------ Faktentabelle Sales
    f.box(MX, y0, MW, MH, None, role="box", name="Faktentabelle Sales")
    kopf(f, MX, y0, MW, "Sales", align="c")
    y = y0 + KH + PAD
    f.text(MX + 1.6, y, LW, RH, [P("Dimension", size=6.0, color=t.text_muted)], anchor="m", bg=bg,
           name="Spaltenkopf Dimension")
    for j, k in enumerate(KENNZAHLEN):
        f.text(MX + 1.6 + LW + j * CWM, y, CWM, RH, [P(k, bold=True)], align="c", anchor="m", bg=bg,
               name=f"Kennzahl {k}")
    y += RH + 0.4
    f.line([(MX + 1.6, y), (MX + MW - 1.6, y)], color=t.role("box").line, lw=0.5, name="Trennlinie Sales")
    y += 0.4
    for dim, zeile in MATRIX:
        f.text(MX + 1.6, y, LW, RH, [P(dim)], anchor="m", bg=bg, name=f"Dimension {dim}")
        for j, (k, v) in enumerate(zip(KENNZAHLEN, zeile)):
            f.text(MX + 1.6 + LW + j * CWM, y, CWM, RH, [P("×" if v else ST)], align="c", anchor="m", bg=bg,
                   name=f"{dim} × {k}: " + ("auswertbar" if v else "nicht auswertbar"))
        y += RH

    # ------------------------------------------------------------ Dimensionen
    breit = sum(d[1] for d in DIMS) + G * (len(DIMS) - 1)
    x = (W - breit) / 2
    hi = t.role("box_hi")
    for name, w, eig, hier in DIMS:
        f.box(x, yk, w, DH, None, role="box", name=f"Dimension {name}")
        kopf(f, x, yk, w, name)
        y = yk + KH
        f.box(x, y, w, SH, [P("Eigenschaften", bold=True)], role="box_hi", align="l", rounded=False,
              ins=(1.6, 0.3), name=f"Eigenschaften {name}")
        y += SH + PAD
        for e in eig:
            f.text(x + 1.6, y, w - 3.2, RH, [P(e)], anchor="m", bg=bg, name=f"{name}: {e}")
            y += RH
        y = yk + KH + SH + PAD + n_eig * RH + PAD
        f.box(x, y, w, SH, [P("Hierarchien", bold=True)], role="box_hi", align="l", rounded=False,
              ins=(1.6, 0.3), name=f"Hierarchien {name}")
        y += SH + PAD
        for h_ in hier:
            ein = 2.6 if h_.startswith("\t") else 0.0          # Folgezeile einer umbrochenen Hierarchie eingerückt
            h_ = h_.strip()
            f.text(x + 1.6 + ein, y, w - 3.2 - ein, RH, [P(h_, nowrap=True)], anchor="m", bg=bg,
                   name=f"{name}: {h_}")
            y += RH
        x += w + G
    return f
