"""Abb. 5.55 – Mobile Computing, Mobile BI sowie mobiles Reporting und mobile Planung."""
# Muster: verschachtelte Bereiche wie im Original (jeder Bereich liegt im übergeordneten, nach rechts unten
# eingerückt), Titel oben links. Helligkeitsleiter von außen nach innen: Mobile Computing weiß mit Kontur,
# Mobile BI grau, mobiles Reporting und mobile Planung als Schlüsselelement rot (Gegenstand des Buches).
# Englische Beschriftung „Mobile Planning and Reporting“ → „Mobiles Reporting und mobile Planung“ (Reihenfolge
# wie in der Caption). Leicht versetzte, fast deckungsgleiche Ränder des Originals mit einheitlichem Abstand.
STEM = "Mobile_Computing_Mobile_BI_sowie_mobiles_Reporting_und_mobile_Planung"
from bookfig import Fig, P

W = 110
DX, DY = 12.0, 6.6          # Einzug links/oben je Ebene
DR = 2.6                    # Abstand rechts/unten je Ebene
TH = 4.2                    # Titelzeile


def build(theme):
    t = theme
    H = 35.0
    f = Fig(W, H, theme, STEM)
    ebenen = [("Mobile Computing", "box_plain"), ("Mobile BI", "box"), (None, "box_strong")]
    x, y, r, b = 0.3, 0.3, W - 0.3, H - 0.3
    for i, (titel, rolle) in enumerate(ebenen):
        role = t.role(rolle)
        if titel:
            f.box(x, y, r - x, b - y, None, role=rolle, name=titel)
            f.text(x + 2.0, y + 1.6, r - x - 4.0, TH, [P(titel, size="head", bold=True)], align="l", anchor="t",
                   bg=role.fill or "FFFFFF", name=f"Titel {titel}")
        else:
            f.box(x, y, r - x, b - y, [P("Mobiles Reporting", size="head", bold=True),
                                       P("und mobile Planung", size="head", bold=True)],
                  role=rolle, name="Mobiles Reporting und mobile Planung")
        x, y, r, b = x + DX, y + DY, r - DR, b - DR
    return f
