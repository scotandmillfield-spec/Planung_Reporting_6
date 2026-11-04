"""Abb. 5.53 – Responsive Design für verschiedene Endgeräte (in Anlehnung an SAP Fiori 2017a)."""
# Muster: drei vereinfachte Geräterahmen mit Layoutblöcken statt Gerätefotos. Oben der Desktop (vier Spalten),
# darunter Tablet (drei Spalten) und Smartphone (eine Spalte). Jede Fassung zeigt dieselbe Übersichtsseite mit
# Kopfleiste, Filterleiste und neun Karten in derselben Reihenfolge wie im Original; die Karten stehen je Gerät an
# der Stelle des Screenshots. Was über den Bildschirm hinausreicht, ist unten offen angeschnitten (Bildlauf).
# Entfernt: Fotos der Geräte, Produktname und Logo, Personenfoto und -name, Inhalte der Karten (Verträge,
# Lieferanten, Ringdiagramm mit Ampelfarben) – nur die Kartentitel bleiben, ins Deutsche übertragen.
STEM = "SAP_Fiori_Responsive_Design_fuer_verschiedene_Endgeraete"
import math
from bookfig import Fig, P, SHY, text_width_mm

W = 110
NB = chr(0xA0)
MID = chr(0xB7)
ST = 6.0                       # Kartentitel
LINE = "9A9A9A"

# Kartentitel in der Reihenfolge der Übersichtsseite
KARTEN = {
    "CM": f"Vertrags{SHY}überwachung",
    "RC": "Letzte Kontakte",
    "OA": "Offene Aktivitäten",
    "PO": f"Bestell{SHY}management",
    "OC": "Ausgaben ohne Vertrag",
    "NM": "Ausgaben je Lieferant",
    "UP": f"Dringende Bestell{SHY}anforderungen",
    "EM": f"Vertrags{SHY}überwachung EMEA",
    "QL": f"Schnell{SHY}zugriffe",
}
# Spalten je Gerät wie im Screenshot: (Karte, Höhe in mm); zu hohe Karten werden am Bildschirmrand angeschnitten
DESKTOP = [[("CM", 11.0), ("OC", 9.4)], [("RC", 14.0), ("NM", 13.0)], [("OA", 5.6), ("UP", 10.0), ("EM", 8.6)],
           [("PO", 12.4), ("QL", 8.4)]]
TABLET = [[("CM", 15.0), ("PO", 15.5)], [("RC", 18.0), ("OC", 11.8)], [("OA", 7.0), ("NM", 10.4), ("UP", 10.0)]]
PHONE = [[("CM", 14.3), ("RC", 22.0), ("OA", 7.0)]]


def build(theme):
    t = theme
    BZ = 1.6                   # Gehäuserand
    PAD = 1.2                  # Innenabstand Bildschirm
    G = 1.2                    # Abstand zwischen Karten
    HK, HF = 3.6, 3.4          # Kopf- und Filterleiste
    LAB = 3.6                  # Gerätebeschriftung

    geraete = [
        # Name, Spalten-Text, x, y, Breite, Höhe, Spalten, Filtertext
        ("Desktop", "vier Spalten", 0.2, 0.2, W - 0.4, 40.0, DESKTOP,
         f"Standard {MID} gefiltert nach Lieferant"),
    ]
    y2 = 0.2 + 40.0 + 1.0 + LAB + 2.6
    geraete.append(("Tablet", "drei Spalten", 0.2, y2, 64.0, 42.0, TABLET,
                    f"Standard {MID} gefiltert nach Lieferant"))
    geraete.append(("Smartphone", "eine Spalte", (64.2 + W) / 2 - 13.5, y2, 27.0, 47.0, PHONE,
                    f"Standard {MID} 1 Filter"))
    H = round(y2 + 47.0 + 1.0 + LAB + 0.2, 1)
    f = Fig(W, H, theme, STEM)

    def karte(x, y, w, h, titel, unten):
        """Karte; reicht sie über den Bildschirm hinaus, wird sie unten offen angeschnitten."""
        p = [P(titel, size=ST, bold=True)]
        if y + h <= unten + 0.01:
            f.box(x, y, w, h, p, role="box", align="l", anchor="t", ins=(0.9, 0.7), name=f"Karte {titel}")
            return
        r = 0.8
        top = []
        for i in range(0, 7):                     # obere Ecken gerundet
            a = math.radians(180 - i * 15)
            top.append((x + r + r * math.cos(a), y + r - r * math.sin(a)))
        for i in range(0, 7):
            a = math.radians(90 - i * 15)
            top.append((x + w - r + r * math.cos(a), y + r - r * math.sin(a)))
        pts = [(x, unten)] + top + [(x + w, unten)]
        f.poly(pts, closed=True, fill=t.role("box").fill, line=None, name=f"Karte {titel} (angeschnitten)")
        f.poly(pts, closed=False, fill=None, line=LINE, lw=0.5, name=f"Rand {titel}")
        f.text(x, y, w, min(h, unten - y), p, ins=(0.9, 0.7), bg=t.role("box").fill, name=f"Titel {titel}")

    for name, spalten_txt, gx, gy, gw, gh, spalten, filt in geraete:
        # Gehäuse und Bildschirm
        f.box(gx, gy, gw, gh, None, role="box_hi", name=f"Gerät {name}")
        sx, sy, sw, sh = gx + BZ, gy + BZ, gw - 2 * BZ, gh - 2 * BZ
        f.box(sx, sy, sw, sh, None, role="box_plain", rounded=False, name=f"Bildschirm {name}")
        # Kopfleiste und Filterleiste
        f.box(sx, sy, sw, HK, [P("Einkaufsübersicht", size=ST, bold=True)], role="header", rounded=False,
              align="c", anchor="m", ins=(0.6, 0.2), name=f"Kopfleiste {name}")
        fy = sy + HK + 1.0
        f.box(sx + PAD, fy, sw - 2 * PAD, HF, [P(filt, size=ST)], role="band", align="l", anchor="m",
              ins=(0.9, 0.2), name=f"Filterleiste {name}")
        # Karten
        cy0 = fy + HF + PAD
        unten = sy + sh
        n = len(spalten)
        cw = (sw - 2 * PAD - (n - 1) * G) / n
        for i, sp in enumerate(spalten):
            cx = sx + PAD + i * (cw + G)
            cy = cy0
            for k, h in sp:
                titel = KARTEN[k]
                need = f.measure([P(titel, size=ST, bold=True)], cw, ins=(0.9, 0.7))
                if unten - cy < need:                  # Titel passt nicht mehr auf den Bildschirm
                    break
                h = max(h, need)
                karte(cx, cy, cw, h, titel, unten)
                cy += h + G
        # Beschriftung unter dem Gerät, zentriert
        ly = gy + gh + 1.0
        rest = f"{MID} {spalten_txt}"
        nb = text_width_mm(name, 7.0, bold=True)
        nr = text_width_mm(rest, 7.0)
        lx = gx + gw / 2 - (nb + 1.0 + nr) / 2
        f.text(lx, ly, nb + 0.9, LAB, [P(name, size=7.0, bold=True)], name=f"Beschriftung {name}")
        f.text(lx + nb + 1.0, ly, nr + 0.9, LAB, [P(rest, size=7.0)], name=f"Spalten {name}")
    return f
