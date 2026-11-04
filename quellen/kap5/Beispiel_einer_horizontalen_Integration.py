"""Abb. 5.9 – Beispiel einer horizontalen Integration (eigene Darstellung)."""
# Muster: zwei Elemente in einer Achse, verbunden durch einen beschrifteten Pfeil (wie im Original).
# Entfernt: Lkw- und Waagensymbol (Deko, die Bereiche sind beschriftet). Der orangefarbene Pfeil ist die einzige
# Hervorhebung des Originals und wird zum roten Akzentpfeil: Er zeigt die Integration zwischen den Bereichen.
# Beide Bereiche gleich breit und gleich hoch; die Tätigkeiten als Aufzählung, damit Zeilenumbrüche nicht mit
# getrennten Tätigkeiten verwechselt werden.
STEM = "Beispiel_einer_horizontalen_Integration"
from bookfig import Fig, P

W = 110
BW = 44.0                       # Breite eines Bereichs (längste Zeile ohne Umbruch)


def build(theme):
    t = theme
    links = [P("Einkauf/Logistik", bold=True),
             P("Bestellung neuer Kaffeebohnen", bullet="–", space_before=1.5)]
    rechts = [P("Buchhaltung", bold=True),
              P("Erhöhung der Lagerbestände", bullet="–", space_before=1.5),
              P("Verbuchen des Geschäftsvorfalls", bullet="–")]
    ins = (1.6, 1.4)
    tmp = Fig(W, 30, theme)
    bh = max(tmp.measure(links, BW, ins=ins), tmp.measure(rechts, BW, ins=ins))
    H = max(25.4, round(bh + 0.6, 1))           # Mindesthöhe der Folie; Bereiche füllen die Höhe
    iy = (H - 0.6 - bh) / 2 + ins[1]            # gleicher oberer Abstand: Bereichstitel auf einer Höhe
    bh = H - 0.6
    ins = (ins[0], iy)
    f = Fig(W, H, theme, STEM)

    y = 0.3
    xl, xr = 0.3, W - 0.3 - BW
    f.box(xl, y, BW, bh, links, align="l", anchor="t", ins=ins, name="Einkauf/Logistik")
    f.box(xr, y, BW, bh, rechts, align="l", anchor="t", ins=ins, name="Buchhaltung")

    ya = y + bh / 2
    f.arrow([(xl + BW, ya), (xr, ya)], role="accent", lw=1.0, name="triggert")
    f.text(xl + BW + 1.0, ya - 4.0, xr - xl - BW - 2.0, 3.4,
           [P("triggert", italic=True, color=t.accent)], align="c", anchor="b", name="Beschriftung triggert")
    return f
