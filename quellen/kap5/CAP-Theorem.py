"""Abb. 5.30 – CAP-Theorem."""
# Muster: Venn-Diagramm aus drei Kreisen wie im Original. Farbige, transparente Kreise → einheitlich Grau; die
# Überschneidungen (CA, CP, AP) sind dunkler (box_hi), wie die Überlagerung im Original.
# Schräge Hinweislinien → waagerecht bzw. senkrecht zu den Beispielen geführt.
# Revision 13.11.2026: Kreisnamen englisch mit deutscher Übersetzung; Produktnamen der Beispiele durch
# Systemklassen ersetzt (RDBMS, konsistenz- bzw. verfügbarkeitsorientierte NoSQL-Systeme).
STEM = "CAP-Theorem"
import math
from bookfig import Fig, P

W = 110
R = 17.5
_k = R / 19.0                    # Lage wie bisher, auf den kleineren Radius skaliert
KC = (55.0, 0.6 + R + 0.0)       # Consistency (oben)
KA = (55.0 - 10.5 * _k, KC[1] + 18.0 * _k)   # Availability (links unten)
KP = (55.0 + 10.5 * _k, KC[1] + 18.0 * _k)   # Partition Tolerance (rechts unten)
SZ_K = 7.5                       # Kreisnamen
SZ_R = 7.5                       # CA, CP, AP


def u(a):
    return math.cos(a), math.sin(a)


def kreis_pts(c, a0, a1, n=60):
    """Punkte auf dem Kreis um c (Bildschirmkoordinaten, y nach unten), Winkel im Bogenmaß."""
    return [(c[0] + R * math.cos(a0 + (a1 - a0) * i / n), c[1] + R * math.sin(a0 + (a1 - a0) * i / n))
            for i in range(n + 1)]


def linse(c1, c2):
    """Schnittfläche zweier gleich großer Kreise als Punktliste."""
    d = math.dist(c1, c2)
    phi = math.atan2(c2[1] - c1[1], c2[0] - c1[0])
    al = math.acos(d / (2 * R))
    return kreis_pts(c1, phi - al, phi + al)[:-1] + kreis_pts(c2, phi + math.pi - al, phi + math.pi + al)[:-1]


def innen(p, c):
    return math.dist(p, c) < R


def schwerpunkt(rein, raus):
    """Schwerpunkt der Fläche innerhalb der Kreise 'rein' und außerhalb von 'raus' (Rasterabtastung)."""
    xs, ys, n = 0.0, 0.0, 0
    for i in range(0, 1100):
        for j in range(0, 700):
            p = (i * 0.1, j * 0.1)
            if all(innen(p, c) for c in rein) and not innen(p, raus):
                xs += p[0]; ys += p[1]; n += 1
    return xs / n, ys / n


def build(theme):
    t = theme
    H = round(KA[1] + R + 2.6 + 8.0, 1)
    f = Fig(W, H, theme, STEM)
    box, hi = t.role("box"), t.role("box_hi")

    # ---------------- Flächen
    for c, nm in ((KC, "Consistency"), (KA, "Availability"), (KP, "Partition Tolerance")):
        f.ellipse(c[0] - R, c[1] - R, 2 * R, 2 * R, role="box", line="none", name=f"Fläche {nm}")
    for c1, c2, nm in ((KC, KA, "CA"), (KC, KP, "CP"), (KA, KP, "AP")):
        f.poly(linse(c1, c2), closed=True, fill=hi.fill, line=None, name=f"Schnitt {nm}")
    for c, nm in ((KC, "Consistency"), (KA, "Availability"), (KP, "Partition Tolerance")):
        f.ellipse(c[0] - R, c[1] - R, 2 * R, 2 * R, role="box", fill="none", line=hi.line, lw=0.5,
                  name=f"Kontur {nm}")

    # ---------------- Kreisnamen (englisch, darunter deutsch)
    def name(x, y, w, h, en, de):
        f.text(x, y, w, h, [P(en, size=SZ_K, bold=True), P(f"({de})", size=SZ_K - 1.0)], align="c", anchor="m",
               bg=box.fill, name=en)

    name(KC[0] - 12, KC[1] - 13.0, 24, 7, "Consistency", "Konsistenz")
    name(KA[0] - 17.0, KA[1] + 1.0, 19, 7, "Availability", "Verfügbarkeit")
    # Revision 13.11.2026 (2): deutsche Übersetzung getrennt, damit der Text im Kreis bleibt
    f.text(KP[0] + 0.5, KP[1] - 3.6, 15.0, 12.6, [P("Partition", size=SZ_K, bold=True),
                                                P("Tolerance", size=SZ_K, bold=True),
                                                P("(Partitions-", size=SZ_K - 1.0), P("toleranz)", size=SZ_K - 1.0)],
           align="c", anchor="m", bg=box.fill, name="Partition Tolerance")

    # ---------------- Überschneidungen mit Beispielen
    ca = schwerpunkt((KC, KA), KP)
    cp = schwerpunkt((KC, KP), KA)
    ap = schwerpunkt((KA, KP), KC)
    rw, rh = 7.0, 3.6
    for (x, y), txt in ((ca, "CA"), (cp, "CP"), (ap, "AP")):
        f.text(x - rw / 2, y - rh / 2, rw, rh, [P(txt, size=SZ_R, bold=True)], align="c", anchor="m",
               bg=hi.fill, name=f"Feld {txt}")

    ln = dict(color=t.arrow, lw=0.5)
    # CA → links
    xl = KA[0] - R - 1.6
    f.line([(ca[0] - 3.2, ca[1]), (xl + 0.8, ca[1])], name="Hinweis CA", **ln)
    f.text(0.3, ca[1] - 6.0, xl - 0.3, 12.0, [P("Relationale"), P("Datenbank-"), P("systeme"), P("(RDBMS)")],
           align="r", anchor="m", name="CA-Systemklasse")
    # CP → rechts
    xr = KP[0] + R + 1.6
    f.line([(cp[0] + 3.2, cp[1]), (xr - 0.8, cp[1])], name="Hinweis CP", **ln)
    f.text(xr, cp[1] - 4.6, W - 0.3 - xr, 9.2, [P("Konsistenz-"), P("orientierte"), P("NoSQL-Systeme")],
           align="l", anchor="m", name="CP-Systemklasse")
    # AP → unten
    yb = KA[1] + R + 2.6
    f.line([(ap[0], ap[1] + 2.0), (ap[0], yb - 0.6)], name="Hinweis AP", **ln)
    f.text(ap[0] - 25, yb, 50, H - 0.3 - yb, [P("Verfügbarkeitsorientierte NoSQL-Systeme"),
                                            P("(Eventual Consistency)")], align="c",
           anchor="t", name="AP-Systemklasse")
    return f
