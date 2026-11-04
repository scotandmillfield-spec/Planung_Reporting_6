"""Abb. 5.49 – Bildschirmauflösung und Bildschirmgröße."""
# Muster: ineinanderliegende Flächen wie im Original – PC, darin unten links das Tablet, darin unten die beiden
# Smartphones. Neu: Die Flächen sind maßstäblich (Diagonale in Zoll, Seitenverhältnis aus der Auflösung), damit
# die Größenunterschiede stimmen; das Original war nicht maßstäblich. Die Smartphones sind dafür zu klein für
# ihre Beschriftung – sie steht rechts daneben (Smartphone) bzw. darüber (Smartphone mit Tastatur).
# Entfernt: Gerätefotos (iPad, iPhone, BlackBerry) und Produktnamen (softwareneutral: Tablet, Smartphone,
# Smartphone mit Tastatur); lila Flächen → Grau, im Wechsel mit Weiß wie im Original.
# Korrigiert/vereinheitlicht: „z.B“ → „z. B.“, „17-Zoll“ → „17 Zoll“, Auflösung einheitlich Breite × Höhe in Pixel
# (Smartphone hochkant 320 × 480, Smartphone mit Tastatur quer 480 × 320 – im Original vertauscht notiert).
STEM = "Bildschirmaufloesung_und_Bildschirmgroesse"
import math
from bookfig import Fig, P

W = 110
SZ = 7.0
NB = chr(0xA0)
X = chr(0xD7)          # Malzeichen

# Name, Breite px, Höhe px, Diagonale Zoll, Anzeige Diagonale, Rolle
GERAETE = [
    ("PC", 1280, 1024, 17.0, "17", "box"),
    ("Tablet", 1280, 768, 9.7, "9,7", "box_plain"),
    ("Smartphone", 320, 480, 3.5, "3,5", "box"),
    ("Smartphone mit Tastatur", 480, 320, 2.6, "2,6", "box"),
]


def tsd(n):
    return "{:,}".format(n).replace(",", ".")


def masse(bw, bh, diag, s):
    k = diag / math.hypot(bw, bh)
    return bw * k * s, bh * k * s


def paras(name, bw, bh, z):
    return [P(name, size=SZ, bold=True),
            P(f"z.{NB}B. {tsd(bw)}{NB}{X}{NB}{tsd(bh)} Pixel", size=SZ),
            P(f"z.{NB}B. {z}{NB}Zoll", size=SZ)]


def build(theme):
    X0, LW = 0.2, W - 0.4
    pc, tab, sp, st = GERAETE
    s = LW / masse(pc[1], pc[2], pc[3], 1.0)[0]           # mm je Zoll
    wpc, hpc = masse(pc[1], pc[2], pc[3], s)
    wt, ht = masse(tab[1], tab[2], tab[3], s)
    ws, hs = masse(sp[1], sp[2], sp[3], s)
    wk, hk = masse(st[1], st[2], st[3], s)
    H = round(hpc + 0.4, 1)
    f = Fig(W, H, theme, STEM)
    ins = (1.6, 1.2)
    y_b = 0.2 + hpc                                       # gemeinsame Unterkante (unten links wie im Original)

    # PC
    f.box(X0, 0.2, wpc, hpc, paras(pc[0], pc[1], pc[2], pc[4]), role=pc[5], align="l", anchor="t", ins=ins,
          rounded=False, name="PC")
    # Tablet unten links im PC
    ty = y_b - ht
    f.box(X0, ty, wt, ht, paras(tab[0], tab[1], tab[2], tab[4]), role=tab[5], align="l", anchor="t", ins=ins,
          rounded=False, name="Tablet")
    # Smartphone hochkant unten links im Tablet, Beschriftung rechts daneben
    f.box(X0, y_b - hs, ws, hs, None, role=sp[5], rounded=False, name="Smartphone")
    lab_h = f.measure(paras(sp[0], sp[1], sp[2], sp[4]), 30, ins=(0, 0))
    f.text(X0 + ws + 1.6, y_b - hs, 25.0, lab_h + 0.2, paras(sp[0], sp[1], sp[2], sp[4]), bg="FFFFFF",
           name="Beschriftung Smartphone")
    # Smartphone mit Tastatur quer unten im Tablet, Beschriftung darüber (linksbündig mit der Fläche)
    LK = 23.6
    kx = X0 + ws + 1.6 + 26.4
    f.box(kx, y_b - hk, wk, hk, None, role=st[5], rounded=False, name="Smartphone mit Tastatur")
    lab_k = f.measure(paras(st[0], st[1], st[2], st[4]), LK, ins=(0, 0))
    f.text(kx, y_b - hk - 1.2 - lab_k, LK, lab_k + 0.2, paras(st[0], st[1], st[2], st[4]), bg="FFFFFF",
           name="Beschriftung Smartphone mit Tastatur")
    if kx + LK > X0 + wt - 0.8:
        f.warnings.append(f"[Geometrie] Beschriftung Smartphone mit Tastatur ragt aus dem Tablet ({kx + LK:.1f} > {X0 + wt:.1f})")
    if y_b - hk - 1.2 - lab_k < ty + 11.0:
        f.warnings.append("[Geometrie] Beschriftung Smartphone mit Tastatur stößt an die Tabletbeschriftung")
    return f
