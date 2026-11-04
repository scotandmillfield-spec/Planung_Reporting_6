"""Abb. 5.34 – Technologien sowie Analyse- und Prognosemethoden im Einsatz von Business Intelligence bzw.
Business Analytics."""
# Muster: Aufbau der Folie – äußerer gestrichelter Rahmen „Business Intelligence“ (Titel oben mittig), darin ein
# durchgezogener Rahmen, den „Business Analytics“ unten rechts beschriftet, darin zwei Spalten als Karten mit
# Kopfleiste. Die blaue Umrandung der explorativen Spalte (Hervorhebung) → Kartenrumpf box_hi.
# Entfernt: Unterstreichungen der Titel, Serifenschrift. Aufzählungen über bullet= (2. Ebene „–“).
# Korrekturen: „DWH-Technologien“ → „Data-Warehouse-Technologien“, „KDD“ aufgelöst, Kleinschreibung nach Doppelpunkt
# („deskriptive …“), „(Budget-, Mittelfrist-, Strategischer Planung …)“ → „(Budget-, Mittelfrist- und strategische
# Planung …)“, „Machine und Deep Learning“ → „Machine Learning und Deep Learning“, Trennstriche aus dem Zeilenumbruch
# („Unternehmens-planung“, „Maßnahmen-ableitung“) entfernt.
STEM = "Technologien_sowie_Analyse-_und_Prognosemethoden_im_Einsatz_von_Business_Intelligence_bzw_Business_Analytics"
from bookfig import Fig, P, Para, MM, MSO_SHAPE, Emu

W = 110
SHY = chr(0xAD)
NB = chr(0xA0)
KH = 5.0
TRAD = [
    "Data-Warehouse-Technologien",
    "Frontend-Lösungen:\nDashboard/Cockpit",
    f"Data Mining/KDD (Knowledge Discovery in Databases): deskriptive, prädiktive und präskriptive Analysen mit "
    f"traditionellen Technologien",
    "Strukturierte mehrdimensionale (OLAP-)Analysen",
    "Kommentierung und Dokumentation der Erkenntnisse",
    "Integrierte Unternehmensplanung (Budget-, Mittelfrist- und strategische Planung sowie Forecasting)",
    f"Unternehmensweite Maßnahmen{SHY}ableitung",
]
EXPL = [
    ("In-Memory-Technik", 0),
    ("NoSQL-Datenbanken", 0),
    ("Hadoop", 0),
    ("Big-Data-Analytics", 0),
    ("Modellbasierte statistische Analysen", 1),
    ("Prädiktive und präskriptive Analysen (Predictive und Prescriptive Analytics)", 1),
    ("KI-gestützte Analysen mit Machine Learning und Deep Learning", 1),
    ("Data Discovery und Data Visualization", 1),
    (f"Modellbasierte Maßnahmen{SHY}ableitung für bestimmte Management{SHY}fragestellungen", 1),
]


def karte(f, x, y, w, h, titel, paras, rumpf="box"):
    """Karte mit Kopfleiste (Rolle header) und Rumpf in der angegebenen Rolle."""
    t = f.t
    f.box(x, y, w, h, None, role=rumpf, name=f"Karte {titel}")
    s = f.sh.add_shape(MSO_SHAPE.ROUND_2_SAME_RECTANGLE, Emu(round(x * MM)), Emu(round(y * MM)),
                       Emu(round(w * MM)), Emu(round(KH * MM)))
    f._strip_style(s)
    s.adjustments[0] = t.role("box").radius / KH
    s.adjustments[1] = 0.0
    hr = t.role("header")
    f._apply_role(s, hr)
    s.name = f"Kopf {titel}"
    f._fill_text(s, [Para(titel, size="head", bold=True)], w, KH, hr.text, "l", "m", (1.6, 0.3),
                 label=titel, bg=hr.fill)
    f.text(x, y + KH, w, h - KH, paras, align="l", anchor="t", ins=(1.6, 1.2), bg=t.role(rumpf).fill,
           name=f"Inhalt {titel}")


def build(theme):
    t = theme
    tmp = Fig(W, 30, theme)
    p_trad = [P(s, bullet="•", space_before=0 if i == 0 else 1.0) for i, s in enumerate(TRAD)]
    p_expl = [P(s, bullet="–" if lv else "•", level=lv, space_before=0 if i == 0 else (0.6 if lv else 1.0))
              for i, (s, lv) in enumerate(EXPL)]

    XO, WO = 0.3, W - 0.6               # Rahmen Business Intelligence
    XI, WI = 2.0, W - 4.0               # Rahmen Business Analytics
    G = 2.0
    KW = (WI - 3 * G) / 2
    th = max(tmp.measure(p_trad, KW, ins=(1.6, 1.2)), tmp.measure(p_expl, KW, ins=(1.6, 1.2)))
    KHH = KH + th + 0.2
    yt = 0.3
    yi = yt + 5.6                       # Oberkante innerer Rahmen
    yk = yi + G
    ib = yk + KHH + G                   # Unterkante innerer Rahmen
    yb = ib + 0.6                       # Beschriftung Business Analytics
    ob = yb + 4.0 + 0.8
    H = round(ob + 0.3, 1)
    f = Fig(W, H, theme, STEM)

    f.box(XO, yt, WO, ob - yt, None, role="container", name="Rahmen Business Intelligence")
    f.text(XO, yt + 0.6, WO, 4.4, [P("Business Intelligence", size="head", bold=True)], align="c", anchor="m",
           name="Titel Business Intelligence")
    f.box(XI, yi, WI, ib - yi, None, role="box_plain", name="Rahmen Business Analytics")
    f.text(XI, yb, WI - 1.0, 4.0, [P("Business Analytics", size="head", bold=True)], align="r", anchor="m",
           name="Titel Business Analytics")
    karte(f, XI + G, yk, KW, KHH, "Traditionelle Business Intelligence", p_trad, rumpf="box")
    karte(f, XI + 2 * G + KW, yk, KW, KHH, "Explorative Business Intelligence", p_expl, rumpf="box_hi")
    return f
