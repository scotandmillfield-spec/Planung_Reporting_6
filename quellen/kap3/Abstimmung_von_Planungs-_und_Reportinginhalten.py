"""Abb. 3.181 – Abstimmung von Planungs- und Reportinginhalten."""
# Muster: zwei Kontenblöcke untereinander (Kontengruppe 472 mit ihren Konten), rechts je die Planebene.
# Oben wird auf der Kontengruppe geplant und auf die Konten verteilt (Pfeil nach unten), unten auf einem eigenen
# Planungskonto 472090, das in die Kontengruppe eingeht (Pfeil nach oben). Planebene rot, geplante Zeile grau.
STEM = "Abstimmung_von_Planungs-_und_Reportinginhalten"
from bookfig import Fig, P

W = 110.0
KONTEN = ["472010 Beiträge IHK", "472020 Beiträge Verband", "472030 Sonstige Beiträge",
          "472040 Mitgliedsgebühren", "472050 Sonstige Gebühren und Abgaben"]
GRUPPE = "472 Beiträge und Gebühren"
PLANKONTO = "472090 Plan Beiträge und Gebühren"

BX, BW = 0.3, 60.0            # Kontenblock
KH, RH = 5.0, 4.0             # Kopfzeile, Kontenzeile
PX, PW, PH = 84.0, 25.7, 5.0  # Planebene
XV = PX + PW / 2              # senkrechter Pfeil (Planverteilung)


def build(theme):
    h1 = KH + 0.6 + len(KONTEN) * RH + 0.6
    h2 = KH + 0.6 + (len(KONTEN) + 1) * RH + 0.6
    y1 = 0.3
    y2 = y1 + h1 + 6.0
    H = round(y2 + h2 + 0.3, 1)
    f = Fig(W, H, theme, STEM)
    t = theme
    A = f.arrow

    def block(y, kopf_rolle, kopf_kursiv, zeilen, plan_zeile, n):
        h = KH + 0.6 + len(zeilen) * RH + 0.6
        f.box(BX, y, BW, h, None, role="box_plain", name=f"Kontenblock {n}")
        f.box(BX + 0.5, y + 0.5, BW - 1.0, KH - 0.5, [P(GRUPPE, bold=True, italic=kopf_kursiv)], role=kopf_rolle,
              align="l", ins=(1.6, 0.3), name=f"Kontengruppe {n}")
        ys = []
        for i, z in enumerate(zeilen):
            yy = y + KH + 0.6 + i * RH
            ys.append(yy + RH / 2)
            if i == plan_zeile:
                f.box(BX + 0.5, yy, BW - 1.0, RH, [P(z, bold=True, nowrap=True)], role="box_hi", align="l",
                      ins=(1.6, 0.2), name=f"Planungskonto {n}")
            else:
                f.text(BX + 2.1, yy, BW - 4.2, RH, [P(z, nowrap=True)], anchor="m", name=f"Konto {z[:6]} {n}")
        return y + KH / 2, ys

    def planebene(y, n):
        f.box(PX, y, PW, PH, [P("Planebene", bold=True)], role="box_strong", name=f"Planebene {n}")

    def label(ya, yb, n):
        f.text(XV - 1.6 - 20.5, (ya + yb) / 2 - 1.8, 20.5, 3.6, [P("Planverteilung", italic=True, nowrap=True)],
               align="r", anchor="m", name=f"Planverteilung {n}")

    # Oben: Planung auf der Kontengruppe, Verteilung auf die Konten
    kopf1, ys1 = block(y1, "box_hi", False, KONTEN, None, 1)
    planebene(kopf1 - PH / 2, 1)
    A([(PX, kopf1), (BX + BW, kopf1)], name="Planebene → Kontengruppe")
    A([(XV, kopf1 + PH / 2), (XV, ys1[-1])], dash="sysDash", name="Planverteilung nach unten")
    label(kopf1 + PH / 2, ys1[-1], 1)

    # Unten: Planung auf dem Planungskonto, Eingang in die Kontengruppe
    kopf2, ys2 = block(y2, "box", True, KONTEN + [PLANKONTO], len(KONTEN), 2)
    planebene(ys2[-1] - PH / 2, 2)
    A([(PX, ys2[-1]), (BX + BW, ys2[-1])], name="Planebene → Planungskonto")
    A([(XV, ys2[-1] - PH / 2), (XV, kopf2)], dash="sysDash", name="Planverteilung nach oben")
    label(ys2[-1] - PH / 2, kopf2, 2)
    return f
