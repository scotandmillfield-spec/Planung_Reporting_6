"""Abb. 4.18 – Hyperion Application Link (softwareneutral als Datenflussdiagramm)."""
# Original: Bildschirmfoto eines Integrationswerkzeugs (Programmfenster, Logos, Werkzeugpalette). Neu: derselbe
# Datenfluss als Diagramm ohne Produktnamen – links das Quellsystem (Kontensalden) mit zwei Filterwerten, in der
# Mitte die Transformationsbausteine, rechts das Zielsystem mit den Dialogen für Anmeldung und Periodenauswahl.
# Alle Spalten auf einem gemeinsamen Zeilenraster; Felder, die direkt verbunden sind, liegen auf einer Höhe.
# Die Anschlussfelder der Bausteine (im Original eigene Zeilen) ergeben sich aus den Pfeilen; Nettobuchungen 02–11
# und Perioden 02–11 sind wie im Original gebündelt (eine Zeile, eine Leitung).
STEM = "Hyperion_Application_Link"
from bookfig import Fig, P

W = 110
RH = 3.3                         # Zeilenraster
Y0 = 0.3
INS = (0.6, 0.4)
SZ = 6                           # Schriftgrad (dichtes Netz)
# Spalten
SX, SW = 3.2, 23.0               # Quellsystem
MX, MW = 30.6, 27.0              # Transformationen
TX, TW = 62.6, 22.0              # Zielsystem
DX, DW = 89.9, 19.6              # Dialoge
XK = 1.4                         # Leitung der Filterwerte (links am Quellsystem)
XG, XO = 27.5, 29.1              # Spuren zwischen Quelle und Transformation
XM2 = 60.1                       # Spur zwischen Transformation und Ziel
XE, XS = 86.6, 88.3              # Spuren zwischen Dialog und Ziel (End-, Startperiode)


def yc(r):
    """Mitte der Rasterzeile r."""
    return Y0 + (r + 0.5) * RH


def yt(r):
    return Y0 + r * RH


def build(theme):
    H = round(Y0 + 18 * RH + 0.3, 1)
    f = Fig(W, H, theme, STEM)
    t = theme
    ah = dict(size="sm")

    def tabelle(x, w, r0, kopf, zeilen, rolle_kopf, kopf_zeilen=2, name=""):
        hk = kopf_zeilen * RH
        f.box(x, yt(r0), w, hk, kopf, role=rolle_kopf, rounded=False, ins=INS, name=f"Kopf {name}")
        for i, z in enumerate(zeilen):
            f.box(x, yt(r0) + hk + i * RH, w, RH, [P(z, size=SZ, align="l")], role="box_plain", rounded=False,
                  align="l", ins=INS, name=f"{name} {z}"[:40])

    def baustein(r0, n, paras, name):
        f.box(MX, yt(r0), MW, n * RH, paras, role="box_hi", ins=INS, name=name)

    # ---------------- Leitungen (unter den Kästen) ----------------
    # Filterwerte → Quellsystem
    f.arrow([(SX + 1.0, yc(2)), (XK, yc(2)), (XK, yc(6)), (SX, yc(6))], name="98 → Filter Geschäftsjahr", **ah)
    f.arrow([(SX + 1.0, yc(17)), (XK, yc(17)), (XK, yc(15)), (SX, yc(15))], name="AA → Filter Ledger-Typ", **ah)
    # Quellsystem → Transformationen
    SR = SX + SW
    f.arrow([(SR, yc(7)), (XG, yc(7)), (XG, yc(2)), (MX, yc(2))], name="Gesellschaft → Umschlüsselung Einheit", **ah)
    f.arrow([(SR, yc(8)), (XO, yc(8)), (XO, yc(4)), (MX, yc(4))], name="Objektkonto → Umschlüsselung Konto", **ah)
    f.arrow([(XO, yc(6)), (MX, yc(6))], name="Objektkonto → Vorzeichenumkehr", **ah)
    for r, nm in ((9, "Saldovortrag"), (10, "Nettobuchung 01"), (12, "Nettobuchung 12"), (13, "Nettobuchung 13")):
        f.arrow([(SR, yc(r)), (MX, yc(r))], name=f"{nm} → Baustein", **ah)
    # Nettobuchungen 02–11 direkt in die Perioden 02–11 (durch die Lücke zwischen den Bausteinen)
    f.arrow([(SR, yc(11)), (TX, yc(11))], name="Nettobuchung 02–11 → Periode 02–11", **ah)
    # Transformationen → Zielsystem
    MR = MX + MW
    f.arrow([(MR, yc(2)), (TX, yc(2))], name="Einheit", **ah)
    f.arrow([(MR, yc(4)), (XM2, yc(4)), (XM2, yc(3)), (TX, yc(3))], name="Konto", **ah)
    f.arrow([(MR, yc(6)), (XM2, yc(6)), (XM2, yc(9)), (TX, yc(9))], name="Vorzeichenumkehr", **ah)
    f.arrow([(MR, yc(10)), (TX, yc(10))], name="Januar → Periode 01", **ah)
    f.arrow([(MR, yc(12)), (TX, yc(12))], name="Ergebnis → Periode 12", **ah)
    # Dialoge → Zielsystem
    TR = TX + TW
    for r, nm in ((4, "Anwendung"), (5, "Benutzerkennung"), (6, "Kennwort")):
        f.arrow([(DX, yc(r)), (TR, yc(r))], name=f"Anmeldung {nm}", **ah)
    f.arrow([(DX, yc(9)), (XS, yc(9)), (XS, yc(7)), (TR, yc(7))], name="Startperiode", **ah)
    f.arrow([(DX, yc(10)), (XE, yc(10)), (XE, yc(8)), (TR, yc(8))], name="Endperiode", **ah)

    # ---------------- Kästen ----------------
    hb = dict(size=SZ, bold=True)
    tabelle(SX, SW, 4, [P("Quellsystem", **hb), P("Kontensalden", size=SZ)],
            ["Filter Geschäftsjahr", "Gesellschaft", "Objektkonto", "Saldovortrag", "Nettobuchung 01",
             "Nettobuchung 02–11", "Nettobuchung 12", "Nettobuchung 13", "Ledger-Typ", "Filter Ledger-Typ"],
            "header", name="Quelle")
    tabelle(TX, TW, 0, [P("Zielsystem", **hb), P("Planungsanwendung", size=SZ)],
            ["Einheit", "Konto", "Anwendung", "Benutzerkennung", "Kennwort", "Startperiode", "Endperiode",
             "Vorzeichenumkehr", "Periode 01", "Periode 02–11", "Periode 12", "Kategorie"],
            "header", name="Ziel")
    tabelle(DX, DW, 3, [P("Anmeldung", **hb)], ["Anwendung", "Benutzerkennung", "Kennwort"], "box",
            kopf_zeilen=1, name="Anmeldung")
    tabelle(DX, DW, 8, [P("Periodenauswahl", **hb)], ["Startperiode", "Endperiode"], "box",
            kopf_zeilen=1, name="Periodenauswahl")
    baustein(2, 1, [P("Umschlüsselung Einheit", **hb)], "Umschlüsselung Einheit")
    baustein(4, 1, [P("Umschlüsselung Konto", **hb)], "Umschlüsselung Konto")
    baustein(6, 1, [P("Vorzeichenumkehr", **hb)], "Vorzeichenumkehr")
    baustein(9, 2, [P("Berechnung Januar", **hb)], "Berechnung Januar")
    baustein(12, 2, [P("Abschlussbuchungen in Periode 12", **hb)], "Abschlussbuchungen Periode 12")
    # Filterwerte
    for r, wert in ((2, "98"), (17, "„AA“")):
        f.box(SX + 1.0, yt(r), 9.0, RH, [P(wert, size=SZ)], role="box", ins=INS, name=f"Filterwert {wert}")
    return f
