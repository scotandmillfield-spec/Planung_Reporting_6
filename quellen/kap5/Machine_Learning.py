"""Abb. 5.63 – Machine Learning."""
# Muster: Eingabe → Verarbeitung → Ausgabe in einer Achse wie im Original: links und rechts Pfeilformen für die
# Daten (box_hi), in der Mitte Machine Learning als Karte mit Kopfleiste und Aufzählung.
# Blaue Füllungen, blauer Rahmen und blaue Überschrift → Rollen; die Pfeilformen überlappen den Rahmen nicht
# mehr, sondern stehen mit Abstand davor bzw. dahinter. Kein Rot (kein hervorzuhebendes Einzelelement).
# Übertragen bzw. korrigiert: „Input-Daten“ → „Eingabedaten“, „Output-Daten“ → „Ausgabedaten“,
# „wahrscheinl. Lösung“ → „wahrscheinliche Lösung“, „Beispieldaten …“ → „Beispieldaten etc.“.
STEM = "Machine_Learning"
from bookfig import Fig, P

W = 110
TIP = 5.0                    # Länge der Pfeilspitze
PW = 31.0                    # Breite der Pfeilformen
GAP = 2.4                    # Abstand Pfeilform – Karte


def pfeil(f, t, x, y, w, h, paras, name):
    r = t.role("box_hi")
    pts = [(x, y), (x + w - TIP, y), (x + w, y + h / 2), (x + w - TIP, y + h), (x, y + h)]
    f.poly(pts, fill=r.fill, line=r.line, lw=r.lw, name=name)
    f.text(x + 1.4, y + 0.6, w - TIP - 1.6, h - 1.2, paras, align="l", anchor="m", bg=r.fill,
           name=f"Text {name}")


def build(theme):
    t = theme
    tmp = Fig(W, 30, theme)
    punkte = ["Statistische Methoden", "Zusammenhänge", "Datenmuster", "Abhängigkeiten",
              "Verborgene Strukturen", "Algorithmen"]
    liste = [P(p, bullet="•", space_before=(0 if i == 0 else 1.0)) for i, p in enumerate(punkte)]
    xc0 = 0.3 + PW + GAP
    xc1 = W - 0.3 - PW - GAP
    cw = xc1 - xc0
    head = 5.0
    lh = tmp.measure(liste, cw, ins=(1.6, 1.2))
    ch = head + lh + 0.6
    H = round(ch + 0.6, 1)
    f = Fig(W, H, theme, STEM)
    y0 = 0.3
    # Pfeile hinter der Karte: Eingabe → Karte → Ausgabe (Verbinder als Teil der Form, nicht separat)
    ph = 17.0
    py = y0 + head + (ch - head - ph) / 2
    pfeil(f, t, 0.3, py, PW, ph,
          [P("Eingabedaten", bold=True), P("(Informationen, Beispieldaten etc.)", size=6.5, space_before=1.0)],
          "Eingabedaten")
    pfeil(f, t, xc1 + GAP, py, PW, ph,
          [P("Ausgabedaten", bold=True), P("(Optimales Modell, wahrscheinliche Lösung)", size=6.5,
                                           space_before=1.0)],
          "Ausgabedaten")
    f.card(xc0, y0, cw, ch, "Machine Learning", liste, head_h=head)
    return f
