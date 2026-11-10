"""Abb. 3.9.8.a – Balanced Chance and Cyber-Risk Card mit Kennzahlen je Perspektive und Führungsebene."""
# Neue Abbildung nach Vorlage des Autors (SECURWARE 2025, mit A. Lawall), ins Deutsche übertragen.
# Muster: Raster aus Perspektiven (Zeilen als Bänder, Kopf links) und Führungsebenen (Spalten als gestrichelte
# Container); rechts die verantwortlichen Rollen. Cyber-Kennzahlen in den übrigen Perspektiven und die Perspektive
# Cyber-Resilienz tragen die Kernaussage (rot); die Wirkungspfeile vom Erwarteten Jahresverlust laufen gebündelt
# über eine Sammelleitung am linken Rand der Spalte C-Level. Titel senkrecht links und „…“-Platzhalter entfallen.
STEM = "Balanced_Chance_and_Cyber-Risk_Card_mit_Kennzahlen_je_Perspektive_und_Fuehrungsebene"
from bookfig import Fig, P

W = 110
SHY = chr(0xAD)
NB = chr(0xA0)
KS = 6.5                      # Kennzahlen (dichtes Raster)

SPALTEN = ["C-Level", "Mittleres Management", "Mitarbeitende"]
# Perspektive, Zusatz, Rolle, Kennzahlen je Spalte [(Text, Cyber-Kennzahl?)]
ZEILEN = [
    ("Finanzen", None, "CFO",
     [[(f"Eigenkapital{SHY}rendite (ROE)", 0), ("CLI", 1), ("Return on Investment (ROI)", 0)],
      [(f"Forderungs{SHY}reichweite (DSO)", 0)],
      []]),
    ("Wachstum", "(Lernen und Entwicklung)", "CHRO",
     [[("Phishing-Klickrate", 1)],
      [(f"Mitarbeiter{SHY}zufriedenheit", 0)],
      [("Schulungsstunden je Jahr", 0)]]),
    ("Markt", None, "CSO",
     [[("Net Promoter Score", 0), (f"Serviceausfallzeit je{NB}Kunde", 1)],
      [(f"Kunden{SHY}bindungsrate", 0)],
      []]),
    ("Prozesse", None, "COO",
     [[(f"Gewährleistungs{SHY}quote", 0), ("Patch-Compliance-Rate", 1)],
      [],
      []]),
    ("Cyber-Resilienz", None, "CISO",
     [[("Erwarteter Jahresverlust (EAL)", 0), ("Cyber-Value at Risk", 0), ("Cyber-Resilienz-\nIndex", 0)],
      [("Mean Time to Detect (MTTD)", 0), ("Mean Time to Respond (MTTR)", 0)],
      []]),
]
QUELLE = "Erwarteter Jahresverlust (EAL)"


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
    # ------------------------------------------------------------ Raster
    XL, WL = 0.3, 15.0                       # Perspektivköpfe
    WR = 9.0
    XR = W - 0.3 - WR                        # Rollen
    XBE = XR - 1.0                           # Ende der Bänder
    GAPC = 1.0
    XC0 = XL + WL + 1.0
    CW = (XBE - 0.5 - XC0 - 2 * GAPC) / 3    # Spaltenbreite (Container)
    XS = [XC0 + i * (CW + GAPC) for i in range(3)]
    LANE, BX = 0.8, 3.4                      # Sammelleitung und Einzug der Kennzahlen in der Spalte
    BW = CW - BX - 0.6
    KH, KG, PAD = 6.6, 1.0, 1.1              # Kennzahlhöhe, Abstand, Innenrand der Zeile
    RG = 1.2                                 # Abstand der Zeilen
    Y0 = 5.4                                 # unter den Spaltentiteln

    tmp = Fig(W, 30, t)
    tmp.INS_Y = 0.5

    def kopf_paras(name, zusatz, rot):
        col = t.role("box_strong").text if rot else None
        ps = [P(name, size=6.5, bold=True, color=col)]
        if zusatz:
            ps.append(P(zusatz, size="small", color=col if rot else t.text_muted))
        return ps

    hoehen = []
    for name, zusatz, rolle, spalten in ZEILEN:
        n = max(len(s) for s in spalten)
        h = 2 * PAD + n * KH + (n - 1) * KG
        h = max(h, tmp.measure(kopf_paras(name, zusatz, False), WL) + 0.4)
        hoehen.append(h)
    ys = [Y0]
    for h in hoehen[:-1]:
        ys.append(ys[-1] + h + RG)
    yend = ys[-1] + hoehen[-1]
    H = round(yend + 0.8, 1)

    f = Fig(W, H, t, STEM)
    f.INS_Y = 0.5

    # ------------------------------------------------------------ Zeilen (Perspektiven) als Bänder
    for (name, *_), y, h in zip(ZEILEN, ys, hoehen):
        f.box(XL, y, XBE - XL, h, None, role="band", name=f"Band {name}")

    # ------------------------------------------------------------ Spalten (Führungsebenen) als Container
    for x, s in zip(XS, SPALTEN):
        f.box(x, 0.3, CW, H - 0.6, None, role="container", name=f"Spalte {s}")
        f.text(x + 0.5, 0.8, CW - 1.0, 3.6, [P(s, size=6.5, bold=True)], align="c", anchor="m",
               name=f"Titel {s}")

    # ------------------------------------------------------------ Köpfe, Rollen, Kennzahlen
    boxen = {}
    for (name, zusatz, rolle, spalten), y, h in zip(ZEILEN, ys, hoehen):
        rot = name == "Cyber-Resilienz"
        f.box(XL, y, WL, h, kopf_paras(name, zusatz, rot), role="box_strong" if rot else "box_hi",
              anchor="m", name=f"Perspektive {name}")
        f.box(XR, y + h / 2 - 2.5, WR, 5.0, [P(rolle, size=6.5, bold=True)], role="box_hi",
              anchor="m", ins=(0.4, 0.5), name=f"Rolle {rolle}")
        for x, kz in zip(XS, spalten):
            n = len(kz)
            hs = n * KH + (n - 1) * KG
            yk = y + (h - hs) / 2
            for txt, cyber in kz:
                b = B(x + BX, yk, BW, KH)
                f.box(b.x, b.y, b.w, b.h, [P(txt, size=KS)], role="box_strong" if cyber else "box",
                      anchor="m", name=txt.replace(SHY, "").replace(NB, " ").replace("\n", "")[:30])
                boxen[txt] = (b, cyber)
                yk += KH + KG

    # ------------------------------------------------------------ Wirkungspfeile (Akzent, gepunktet, gebündelt)
    q, _ = boxen[QUELLE]
    ziele = sorted([b for b, c in boxen.values() if c], key=lambda b: b.cy)
    xl = XS[0] + LANE
    oben = ziele[0]
    f.arrow([(q.x, q.cy), (xl, q.cy), (xl, oben.cy), (oben.x, oben.cy)], role="accent", lw=1.0,
            dash="sysDot", size="sm", name="Wirkung EAL Sammelleitung")
    for b in ziele[1:]:
        f.arrow([(xl, b.cy), (b.x, b.cy)], role="accent", lw=1.0, dash="sysDot", size="sm",
                name="Wirkung EAL Abzweig")
        f.ellipse(xl - 0.45, b.cy - 0.45, 0.9, 0.9, fill=t.accent, line="none", name="Knoten")
    return f
