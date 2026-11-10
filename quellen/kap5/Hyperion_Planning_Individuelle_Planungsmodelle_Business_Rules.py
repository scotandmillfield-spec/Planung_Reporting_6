"""Abb. 5.79 – Individuelle Planungsmodelle (Business Rules): Verknüpfungen im Umsatzmodell."""
# Produktscreenshot (Grafik „Verknüpfungen im Umsatzmodell“, aufgerufen über einen Link in den Anweisungen des Formulars
# „Umsatzplanung“) softwareneutral als Diagramm. Serie Abb. 5.78–5.82: Positionen heißen wie in der GuV der Abb. 5.80
# (Nettoumsatz, Frachtkosten, Bestandsveränderung, Fertigungsmaterial, Fertigungslöhne, Deckungsbeitrag) und rechnen so
# im gemeinsamen Planungsmodell (daten_planungsmodell.py).
# Muster: Spalten als Bänder statt Farblegende – Eingabe | Berechnung | GuV | Bilanz | Cash-Flow; Anordnung, Zeilen und
# Leserichtung wie im Original (Eingaben links, Zahlungen rechts). Eingabepositionen weiß gestrichelt (wie im Original),
# berechnete Zwischengrößen weiß, Positionen der Rechenwerke grau, Nettoumsatz als Ausgangsgröße des Modells rot.
# Querformat 155 mm, 6,5 pt (dichtes Netz). Pfeile orthogonal, keine Knotenpunkte (Festlegung Kapitel 5): Abzweig = T,
# Kreuzung = durchgehende Linie. Verbindungen fachlich bereinigt: Fertigungsmaterial aus Zugang Produktion und
# Standardmaterialkosten, Fertigungslöhne aus Zugang Produktion und Standardfertigungskosten (im Original führte nur eine
# Linie von „STD MK STK“ zu den Fertigungslöhnen); Frachtkosten → Deckungsbeitrag und Nettoumsatz → Zugang
# Verbindlichkeiten Finanzamt (im Original nur gekreuzt, rechnerisch nötig).
# Entfernt: Browserfenster, Bildtitel „Verknüpfungen imUmsatzmodell“ (gehört in die Caption), Farblegende.
STEM = "Hyperion_Planning_Individuelle_Planungsmodelle_Business_Rules"
from bookfig import Fig, P, SHY

W, H = 155.0, 96.0
SZ = 6.5
H1, H2 = 4.2, 6.6                    # Boxhöhe ein-/zweizeilig
TOP = 4.4                            # Titelzeile im Band


class B:
    def __init__(self, x, y, w, h):
        self.x, self.y, self.w, self.h = x, y, w, h
    @property
    def r(self): return self.x + self.w
    @property
    def b(self): return self.y + self.h
    @property
    def cx(self): return self.x + self.w / 2
    @property
    def cy(self): return self.y + self.h / 2


def build(theme):
    t = theme
    f = Fig(W, H, theme, STEM)
    A = f.arrow

    # ------------------------------------------------------------ Bänder (Spalten)
    BAND = {"e": (0.0, 27.0, "Eingabe"), "b": (31.0, 20.0, "Berechnung"), "g": (55.0, 31.0, "GuV"),
            "bi": (90.0, 30.0, "Bilanz"), "c": (124.0, 31.0, "Cash-Flow")}
    for k, (x, w, lab) in BAND.items():
        f.band(x, 0.0, w, H, lab)
    XE, WE_ = 2.4, 23.0                  # Eingabe
    XB, WB = 32.5, 17.0                  # Berechnung
    XG, WG, WGN = 56.5, 25.0, 29.0       # GuV (schmale Boxen lassen rechts Platz für die Sammelleitung)
    XBI, WBI = 91.5, 27.0                # Bilanz
    XC, WC = 125.5, 28.0                 # Cash-Flow
    BUS = 85.0                           # Sammelleitung zum Deckungsbeitrag (im GuV-Band)
    KANAL = 0.9                          # Leitung links von den Eingaben (Absatz → Wareneinsatz, Zugang Produktion)
    XFK, XMK = 27.6, 29.0                # Abzweige der Standardkosten nach unten

    def box(b, text, role="box", **kw):
        f.box(b.x, b.y, b.w, b.h, [P(text, size=SZ)], role=role, name=text.replace(SHY, ""), **kw)

    def eingabe(b, text):
        box(b, text, role="box_plain", line="6E747A", lw=0.75, dash="dash")

    # ------------------------------------------------------------ Eingabepositionen
    E1 = B(XE, 5.6, WE_, H1); E2 = B(XE, 12.2, WE_, H1); E3 = B(XE, 18.6, WE_, H1); E4 = B(XE, 24.0, WE_, H1)
    E5 = B(XE, 30.4, WE_, H1); E6 = B(XE, 36.8, WE_, H1); E7 = B(XE, 45.0, WE_, H2); E8 = B(XE, 53.2, WE_, H2)
    eingabe(E1, "Inkassorate in %")
    eingabe(E2, "Absatz")
    eingabe(E3, "Listenpreis")
    eingabe(E4, "Rabatt in %")
    eingabe(E5, "USt-Satz")
    eingabe(E6, "Frachtkostensatz")
    eingabe(E7, f"Standard{SHY}material{SHY}kosten je Stück")
    eingabe(E8, f"Standard{SHY}fertigungs{SHY}kosten je Stück")

    # ------------------------------------------------------------ Berechnete Zwischengrößen
    VK = B(XB, 18.6, WB, 9.6)
    ZP = B(XB, 69.0, WB, H2)
    box(VK, "Verkaufspreis", role="box_plain")
    box(ZP, "Zugang Produktion", role="box_plain")

    # ------------------------------------------------------------ GuV
    NU = B(XG, 12.2, WGN, 13.4)
    FR = B(XG, 36.6, WG, 5.0)
    WE = B(XG, 46.5, WG, 12.6)
    DB = B(XG, 62.6, WG, H1)
    BV = B(XG, 70.2, WG, H1)
    FM = B(XG, 77.8, WG, H2)
    FL = B(XG, 87.0, WG, 5.6)
    box(NU, "Nettoumsatz", role="box_strong")
    box(FR, "Frachtkosten")
    box(WE, "Wareneinsatz")
    box(DB, "Deckungsbeitrag")
    box(BV, "Bestandsveränderung")
    box(FM, f"Fertigungs{SHY}material{SHY}kosten")
    box(FL, "Fertigungslöhne")

    # ------------------------------------------------------------ Bilanz
    ZF = B(XBI, 12.2, WBI, H1)
    ZV = B(XBI, 29.0, WBI, H2)
    LB = B(XBI, 70.2, WBI, H1)
    box(ZF, "Zugang Forderungen")
    box(ZV, f"Zugang Verbindlich{SHY}keiten Finanzamt")
    box(LB, "Lagerbestand")

    # ------------------------------------------------------------ Cash-Flow
    EF = B(XC, 5.0, WC, H2)
    AF = B(XC, 30.2, WC, H1)
    AR = B(XC, 35.4, WC, H2)
    AM = B(XC, 77.8, WC, H2)
    AL = B(XC, 86.5, WC, H2)
    box(EF, "Einzahlung Forderungen")
    box(AF, "Auszahlung Finanzamt")
    box(AR, "Auszahlung Frachtkosten")
    box(AM, "Auszahlung Fertigungsmaterial")
    box(AL, "Auszahlung Fertigungslöhne")

    # ------------------------------------------------------------ Verbindungen: Umsatz und Forderungen
    A([(E1.r, E1.cy), (EF.x, E1.cy)], name="Inkassorate → Einzahlung Forderungen")
    A([(E2.r, E2.cy), (NU.x, E2.cy)], name="Absatz → Nettoumsatz")
    A([(E3.r, E3.cy), (VK.x, E3.cy)], name="Listenpreis → Verkaufspreis")
    A([(E4.r, E4.cy), (VK.x, E4.cy)], name="Rabatt → Verkaufspreis")
    A([(VK.r, VK.cy), (NU.x, VK.cy)], name="Verkaufspreis → Nettoumsatz")
    A([(NU.r, E2.cy), (ZF.x, E2.cy)], name="Nettoumsatz → Zugang Forderungen")
    A([(ZF.r, ZF.cy), (EF.cx, ZF.cy), (EF.cx, EF.b)], name="Zugang Forderungen → Einzahlung Forderungen")
    # Umsatzsteuer
    y_nv, y_ust = ZV.y + 1.6, E5.cy + 0.0
    A([(NU.r, 21.0), (88.0, 21.0), (88.0, y_nv), (ZV.x, y_nv)], name="Nettoumsatz → Zugang Verbindlichkeiten Finanzamt")
    A([(E5.r, y_ust), (ZV.x, y_ust)], name="USt-Satz → Zugang Verbindlichkeiten Finanzamt")
    A([(ZV.r, AF.cy), (AF.x, AF.cy)], name="Zugang Verbindlichkeiten → Auszahlung Finanzamt")
    # Frachtkosten
    A([(E6.r, E6.cy), (FR.x, E6.cy)], name="Frachtkostensatz → Frachtkosten")
    A([(60.0, NU.b), (60.0, FR.y)], name="Nettoumsatz → Frachtkosten")
    y_fa = AR.y + 2.6
    A([(FR.r, y_fa), (AR.x, y_fa)], name="Frachtkosten → Auszahlung Frachtkosten")

    # ------------------------------------------------------------ Wareneinsatz und Deckungsbeitrag
    y_w = 43.0                                           # zwischen Frachtkostensatz und Standardmaterialkosten
    A([(E2.x, E2.cy), (KANAL, E2.cy), (KANAL, y_w), (62.0, y_w), (62.0, WE.y)], name="Absatz → Wareneinsatz")
    A([(E7.r, E7.cy), (WE.x, E7.cy)], name="Standardmaterialkosten → Wareneinsatz")
    A([(E8.r, E8.cy), (WE.x, E8.cy)], name="Standardfertigungskosten → Wareneinsatz")
    A([(68.0, WE.b), (68.0, DB.y)], name="Wareneinsatz → Deckungsbeitrag")
    A([(BUS, NU.b), (BUS, DB.cy), (DB.r, DB.cy)], name="Nettoumsatz → Deckungsbeitrag")
    f.line([(FR.r, FR.b - 1.2), (BUS, FR.b - 1.2)], name="Frachtkosten → Deckungsbeitrag (Abzweig)")

    # ------------------------------------------------------------ Produktion und Bestand
    A([(KANAL, y_w), (KANAL, ZP.cy), (ZP.x, ZP.cy)], name="Absatz → Zugang Produktion")
    A([(ZP.r, BV.cy), (BV.x, BV.cy)], name="Zugang Produktion → Bestandsveränderung")
    A([(BV.r, BV.cy), (LB.x, BV.cy)], name="Bestandsveränderung → Lagerbestand")
    x_zp = 45.0
    y_fm1, y_fm2 = FM.y + 1.7, FM.b - 1.7
    y_fl1, y_fl2 = FL.y + 1.5, FL.b - 1.5
    A([(x_zp, ZP.b), (x_zp, y_fl1), (FL.x, y_fl1)], name="Zugang Produktion → Fertigungslöhne")
    A([(x_zp, y_fm1), (FM.x, y_fm1)], name="Zugang Produktion → Fertigungsmaterial")
    f.line([(E7.r, E7.cy), (XMK, E7.cy)], name="Abzweig Standardmaterialkosten")
    A([(XMK, E7.cy), (XMK, y_fm2), (FM.x, y_fm2)], name="Standardmaterialkosten → Fertigungsmaterial")
    A([(XFK, E8.cy), (XFK, y_fl2), (FL.x, y_fl2)], name="Standardfertigungskosten → Fertigungslöhne")
    A([(FM.r, AM.cy), (AM.x, AM.cy)], name="Fertigungsmaterial → Auszahlung")
    A([(FL.r, FL.cy), (AL.x, FL.cy)], name="Fertigungslöhne → Auszahlung")
    return f
