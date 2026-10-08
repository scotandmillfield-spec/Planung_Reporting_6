"""Abb. 3.28 – Exemplarisches Grundraster eines Berichtes."""
# Muster: Raster als Kästen und Karten (wie abb_2-7). Oben drei Zeilen des Berichtskopfs – Navigationsmenü (über die
# ganze Breite), generelle Berichtsinformationen mit Corporate Identity rechts, Selektionskriterien und Funktionen –,
# darunter mit größerem Abstand (im Original die kräftige Linie) vier Auswertungsbereiche im 2 × 2-Raster.
# Jeder Auswertungsbereich als Karte mit Kopfleiste; „Tabellen/Grafiken“ und „Kommentare“ als weiße Platzhalter,
# damit die Aufteilung des Bereichs sichtbar wird (vgl. Abb. 3.29). Kein Rot: kein Element ist als zentral markiert.
STEM = "Exemplarisches_Grundraster_eines_Berichtes"
from bookfig import Fig, P

W, H = 110, 72.0
G = 1.6                      # Abstand zwischen den Kästen
ZEILE = 6.5                  # Höhe der Kopfzeilen
CI_B = 24.0                  # Breite Corporate Identity
R = 0.3                      # Rand, damit die Konturen nicht angeschnitten werden


def build(theme):
    f = Fig(W, H, theme, STEM)
    f.INS_X = 1.6
    B = W - 2 * R
    halb = (B - G) / 2

    # Berichtskopf
    y = R
    f.box(R, y, B, ZEILE, [P("Navigationsmenü")], role="box_hi", align="l", name="Navigationsmenü")
    y += ZEILE + G
    f.box(R, y, B - G - CI_B, ZEILE, [P("Generelle Berichtsinformationen")], role="box", align="l",
          name="Generelle Berichtsinformationen")
    f.box(R + B - CI_B, y, CI_B, ZEILE, [P("Corporate Identity")], role="box", align="c", name="Corporate Identity")
    y += ZEILE + G
    f.box(R, y, halb, ZEILE, [P("Selektionskriterien")], role="box", align="l", name="Selektionskriterien")
    f.box(R + halb + G, y, halb, ZEILE, [P("Funktionen")], role="box", align="l", name="Funktionen")
    y += ZEILE + 3.4                          # größerer Abstand: Kopf | Auswertung

    # Auswertungsbereiche 2 x 2
    kh = (H - R - y - G) / 2
    kopf = 5.0
    for zeile in range(2):
        for spalte in range(2):
            x0, y0 = R + spalte * (halb + G), y + zeile * (kh + G)
            n = zeile * 2 + spalte + 1
            f.card(x0, y0, halb, kh, "Auswertungsbereich", [P("")], head_h=kopf, name=f"Auswertungsbereich {n}")
            innen = kh - kopf - 2 * G - 1.2
            hg = innen * 0.64
            f.box(x0 + G, y0 + kopf + G, halb - 2 * G, hg, [P("Tabellen/Grafiken")], role="box_plain",
                  name=f"Tabellen/Grafiken {n}")
            f.box(x0 + G, y0 + kopf + G + hg + 1.2, halb - 2 * G, innen - hg, [P("Kommentare")], role="box_plain",
                  name=f"Kommentare {n}")
    return f
