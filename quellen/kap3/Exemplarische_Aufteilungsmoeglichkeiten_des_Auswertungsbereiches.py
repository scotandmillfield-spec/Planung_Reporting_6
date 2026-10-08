"""Abb. 3.29 – Exemplarische Aufteilungsmöglichkeiten des Auswertungsbereiches."""
# Muster: wie Abb. 3.28 – jeder Auswertungsbereich als Karte mit Kopfleiste, die Elemente als weiße Platzhalter.
# Vier Varianten im 2 × 2-Raster wie im Original (links oben, rechts oben, links unten, rechts unten); jede Variante
# teilt den Bereich in zwei Spalten und zwei Zeilen, zusammengefasste Zellen laufen über zwei Zeilen bzw. Spalten:
#   1  Tabelle (über beide Zeilen) | Grafik / Kommentare
#   2  Tabelle | Grafik  –  Kommentare | Grafik
#   3  Grafik | Grafik   –  Tabelle | Kommentare
#   4  Grafik | Grafik   –  Tabelle (über beide Spalten)
# Linienraster des Originals entfällt; kein Rot, da kein Element zentral ist.
STEM = "Exemplarische_Aufteilungsmoeglichkeiten_des_Auswertungsbereiches"
from bookfig import Fig, P

W = 110
R = 0.3                      # Rand, damit die Konturen nicht angeschnitten werden
G = 1.6                      # Abstand zwischen den Karten und Innenrand der Karte (wie Abb. 3.28)
L = 1.2                      # Abstand zwischen den Platzhaltern
KOPF = 5.0                   # Kopfleiste
ZH = 7.5                     # Zeilenhöhe der Platzhalter
KH = KOPF + G + ZH + L + ZH + G
H = 2 * R + 2 * KH + G

# Zellen je Variante: (Text, Spalte, Zeile, Spaltenzahl, Zeilenzahl)
VARIANTEN = [
    [("Tabelle", 0, 0, 1, 2), ("Grafik", 1, 0, 1, 1), ("Kommentare", 1, 1, 1, 1)],
    [("Tabelle", 0, 0, 1, 1), ("Grafik", 1, 0, 1, 1), ("Kommentare", 0, 1, 1, 1), ("Grafik", 1, 1, 1, 1)],
    [("Grafik", 0, 0, 1, 1), ("Grafik", 1, 0, 1, 1), ("Tabelle", 0, 1, 1, 1), ("Kommentare", 1, 1, 1, 1)],
    [("Grafik", 0, 0, 1, 1), ("Grafik", 1, 0, 1, 1), ("Tabelle", 0, 1, 2, 1)],
]


def build(theme):
    f = Fig(W, H, theme, STEM)
    B = W - 2 * R
    kb = (B - G) / 2                      # Kartenbreite
    sb = (kb - 2 * G - L) / 2             # Spaltenbreite der Platzhalter
    for n, zellen in enumerate(VARIANTEN, start=1):
        x0 = R + (n - 1) % 2 * (kb + G)
        y0 = R + (n - 1) // 2 * (KH + G)
        f.card(x0, y0, kb, KH, "Auswertungsbereich", [P("")], head_h=KOPF, name=f"Variante {n}")
        for text, sp, ze, ns, nz in zellen:
            x = x0 + G + sp * (sb + L)
            y = y0 + KOPF + G + ze * (ZH + L)
            f.box(x, y, ns * sb + (ns - 1) * L, nz * ZH + (nz - 1) * L, [P(text)], role="box_plain",
                  name=f"Variante {n} {text} {sp + 1}/{ze + 1}")
    return f
