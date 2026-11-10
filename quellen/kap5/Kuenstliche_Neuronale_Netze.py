"""Abb. 5.64 – Künstliche Neuronale Netze."""
# Muster: Neuronen als Kreise in fünf Spalten wie im Original (3 – 4 – 5 – 4 – 2), jede Spalte vollständig mit der
# nächsten verbunden; diagonale Verbindungen sind hier fachlich nötig (Festlegung Kap. 5), dünne Linien.
# Schichten beschriftet: Eingabeschicht, verdeckte Schichten (Klammer über die drei mittleren Spalten – im
# Original stand „Hidden-Layer“ nur über der Mitte), Ausgabeschicht; englische Fachbegriffe in Klammern.
# Helligkeitsleiter statt einheitlichem Blau: Eingabe hellgrau, verdeckt grau, Ausgabe anthrazit. Kein Rot.
STEM = "Kuenstliche_Neuronale_Netze"
from bookfig import Fig, P

W = 110
SCHICHTEN = [3, 4, 5, 4, 2]
XS = [12.0, 33.5, 55.0, 76.5, 98.0]
ROLLE = ["box", "box_hi", "box_hi", "box_hi", "header"]
D = 5.2                      # Durchmesser Neuron
DY = 7.2                     # Abstand der Neuronen
Y_LAB = 0.3
Y0 = 11.0                    # Oberkante des höchsten Neurons


def build(theme):
    t = theme
    nmax = max(SCHICHTEN)
    yc = Y0 + D / 2 + (nmax - 1) * DY / 2
    H = round(Y0 + (nmax - 1) * DY + D + 0.4, 1)
    f = Fig(W, H, theme, STEM)
    pos = []
    for n, x in zip(SCHICHTEN, XS):
        pos.append([(x, yc + (i - (n - 1) / 2) * DY) for i in range(n)])
    # Verbindungen (unter den Neuronen)
    for a, b in zip(pos[:-1], pos[1:]):
        for p in a:
            for q in b:
                f.line([p, q], color=t.arrow, lw=0.35, name="Verbindung")
    # Neuronen
    for k, (spalte, rolle) in enumerate(zip(pos, ROLLE)):
        r = t.role(rolle)
        for i, (x, y) in enumerate(spalte):
            f.ellipse(x - D / 2, y - D / 2, D, D, role=rolle, name=f"Neuron {k + 1}.{i + 1}")
    # Beschriftung der Schichten
    def lab(xm, w, de, en):
        f.text(xm - w / 2, Y_LAB, w, 6.0, [P(de, bold=True), P(f"({en})", size=6, color=t.text_muted)],
               align="c", anchor="t", name=f"Schicht {de}")
    lab(XS[0], 22.0, "Eingabeschicht", "Input Layer")
    lab(XS[2], 30.0, "Verdeckte Schichten", "Hidden Layers")
    lab(XS[4], 22.0, "Ausgabeschicht", "Output Layer")
    # Klammer über die verdeckten Schichten
    yk = Y_LAB + 6.9
    x0, x1 = XS[1] - D / 2, XS[3] + D / 2
    f.line([(x0, yk + 1.2), (x0, yk), (x1, yk), (x1, yk + 1.2)], color=t.arrow, lw=0.5,
           name="Klammer verdeckte Schichten")
    return f
