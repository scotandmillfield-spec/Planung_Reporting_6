"""Abb. 5.58 – Architektur einer mobilen BI-Lösung (Original: SAP BusinessObjects Mobile Architecture)."""
# Muster: Architektur softwareneutral in derselben Anordnung wie das Original: links die Nutzer mit mobilem
# Endgerät, zwei Firewalls als gestrichelte Senkrechte, dazwischen die optionalen Komponenten (Reverse Proxy,
# Relay-Server), in der Mitte der mobile Anwendungsserver (Schlüsselelement, rot), rechts die BI-Plattform als
# Gruppe mit ihren Diensten und der Dateiablageserver mit Dateiablage und Datenbanken (Datenhaltung box_hi).
# Schnittstellensymbole (Kreise mit „R“-Pfeilen) → Pfeile mit kursivem Protokoll: ◄R► als Doppelpfeil,
# R► als einfacher Pfeil. Grauer Hinweis „Optional“ → gestrichelte Gruppe „optional“ (oben wie unten).
# Entfernt: Personen- und App-Symbol, Lupe, Zahnrad und Datenbanksymbol (→ beschriftete Box), gestapelte Kästen
# (→ „mehrere“), Produkt- und Versionsangaben (SAP BusinessObjects, XI 3.1/4.0, Web Intelligence, Crystal Reports,
# Sybase SUP 2.1.0). Texte übertragen: Mobile application server → mobiler Anwendungsserver, File Repository
# Server → Dateiablageserver, Report and CMS databases → Berichts- und Systemdatenbanken, Kbits/sec → kbit/s.
STEM = "SAP_BusinessObjects_Mobile_Architecture"
from bookfig import Fig, P

W = 110
SHY = chr(0xAD)

XU0, XU1 = 0.3, 17.0             # Nutzer
XF = [18.6, 38.6]                # Firewalls
XD0, XD1 = 20.2, 37.0            # Komponenten zwischen den Firewalls
XS0, XS1 = 40.4, 60.8            # mobiler Anwendungsserver
XW0, XW1 = 43.4, 58.4            # Middleware-Server
XST = 56.4                       # Zuleitung von oben (Reverse Proxy)
XSB = 59.4                       # Zuleitung von unten (Middleware)
XP0, XP1 = 66.0, 87.0            # BI-Plattform
XR0, XR1 = 92.6, 109.7           # Dateiablageserver
XUL = 8.6                        # Abgänge oben/unten am Nutzerkasten


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
    tmp = Fig(W, 30, theme)
    lab = dict(size=6, italic=True)
    sz = 6.5

    user_p = [P("Nutzer mit mobilem Endgerät", bold=True), P("(Smartphone/Tablet) und mobiler BI-App", size=sz)]
    srv_p = [P("Mobiler", bold=True), P(f"Anwendungs{SHY}server", bold=True),
             P("(Authentifizierung: Basic oder X.509-Zertifikat)", size=6, space_before=1.0)]
    mw_p = [P("Mobile-Middleware-Server", size=sz)]
    dienste = [[P(f"Verarbeitungs{SHY}server für Ad-hoc-Berichte (mehrere)", size=sz)],
               [P("Server für formatierte Berichte", size=sz)],
               [P("Suchdienst", size=sz)],
               [P("Zeitsteuerung (Scheduler)", size=sz)],
               [P(f"Adaptiver Verarbeitungs{SHY}server", size=sz)]]
    frs_p = [P(f"Dateiablage{SHY}server", size=sz)]
    abl_p = [P("Dateiablage", size=sz)]
    db_p = [P(f"Berichts- und System{SHY}datenbanken", size=sz)]

    # ------------------------------------------------------------ Geometrie (y)
    OT = B(XD0 - 0.8, 0.3, XD1 - XD0 + 1.6, 9.8)            # optional oben
    RP = B(XD0, OT.y + 3.4, XD1 - XD0, 5.4)
    yt = RP.cy
    sh = tmp.measure(srv_p, XS1 - XS0)
    S = B(XS0, 15.6, XS1 - XS0, sh)
    ymid = S.cy
    uh = tmp.measure(user_p, XU1 - XU0) + 1.6
    U = B(XU0, ymid - uh / 2, XU1 - XU0, uh)
    mwh = tmp.measure(mw_p, XW1 - XW0, ins=(0.5, 0.6))
    yb = max(U.b, S.b) + 9.2                                  # Route unten
    WS = B(XW0, yb - mwh / 2, XW1 - XW0, mwh)
    RS = B(XD0, yb - 2.7, XD1 - XD0, 5.4)
    OB = B(XD0 - 0.8, WS.y - 4.0, XW1 + 1.8 - (XD0 - 0.8), WS.h + 5.4)   # optional unten
    yfw = OB.b + 1.4                                          # Ende der Firewall-Linien
    H = round(yfw + 3.6, 1)

    # BI-Plattform
    P0 = B(XP0, 0.3, XP1 - XP0, yfw - 0.3)
    ins = 1.0
    dh = [tmp.measure(d, P0.w - 2 * ins) + 0.4 for d in dienste]
    gap = (P0.h - 4.4 - sum(dh) - 1.0) / (len(dienste) - 1)
    # Dateiablageserver
    fh = tmp.measure(frs_p, XR1 - XR0) + 1.0
    FR = B(XR0, ymid - fh / 2, XR1 - XR0, fh)
    AB = B(XR0 + 1.0, FR.y - 6.0 - 5.0, XR1 - XR0 - 2.0, 5.0)
    dbh = tmp.measure(db_p, XR1 - XR0) + 0.6
    DB = B(XR0, FR.b + 6.0, XR1 - XR0, dbh)

    f = Fig(W, H, theme, STEM)
    A = f.arrow

    # ------------------------------------------------------------ Firewalls
    for x in XF:
        f.line([(x, 0.3), (x, yfw)], color=t.info, lw=0.75, dash="dash", name="Firewall")
        f.text(x - 6.0, yfw + 0.4, 12.0, 3.0, [P("Firewall", size=6)], align="c", anchor="t", name="Firewall Text")

    # ------------------------------------------------------------ optionale Gruppen
    for G, nm in ((OT, "oben"), (OB, "unten")):
        f.box(G.x, G.y, G.w, G.h, None, role="container", name=f"optional {nm}")
        f.text(G.x + 1.0, G.y + 0.4, G.w - 2.0, 2.8, [P("optional", size=6, bold=True)], align="c", anchor="t",
               name=f"Titel optional {nm}")

    # ------------------------------------------------------------ Verbindungen
    # oben: Nutzer ⇄ Reverse Proxy ⇄ Anwendungsserver
    A([(XUL, U.y), (XUL, yt), (RP.x, yt)], head=True, size="sm", name="Nutzer ⇄ Reverse Proxy")
    A([(RP.r, yt), (XST, yt), (XST, S.y)], head=True, size="sm", name="Reverse Proxy ⇄ Anwendungsserver")
    f.text(XUL + 0.8, yt - 3.0, 8.0, 2.8, [P("HTTPS", **lab)], anchor="b", name="HTTPS oben links")
    f.text(XF[1] + 0.8, yt - 3.0, 8.0, 2.8, [P("HTTPS", **lab)], anchor="b", name="HTTPS oben rechts")
    # Mitte: Nutzer ⇄ Anwendungsserver (Internet/WLAN)
    A([(U.r, ymid), (S.x, ymid)], head=True, size="sm", name="Nutzer ⇄ Anwendungsserver")
    f.text(XD0, ymid - 3.0, XD1 - XD0, 2.8, [P("Internet/WLAN", **lab)], align="c", anchor="b",
           name="Internet/WLAN")
    f.text(XD0, ymid + 0.6, XD1 - XD0 + 0.6, 7.8,
           [P("GPRS: 64 kbit/s", size=6), P("EDGE: 128 kbit/s", size=6), P("3G: 384 kbit/s", size=6)],
           align="c", anchor="t", name="Übertragungsraten")
    # unten: Nutzer ⇄ Relay-Server ⇄ Middleware-Server ⇄ Anwendungsserver
    A([(XUL, U.b), (XUL, yb), (RS.x, yb)], head=True, size="sm", name="Nutzer ⇄ Relay-Server")
    A([(RS.r, yb), (WS.x, yb)], head=True, size="sm", name="Relay-Server ⇄ Middleware-Server")
    A([(WS.r, yb), (XSB, yb), (XSB, S.b)], head=True, size="sm", name="Middleware-Server ⇄ Anwendungsserver")
    f.text(XUL + 0.8, yb - 3.0, 8.0, 2.8, [P("HTTPS", **lab)], anchor="b", name="HTTPS unten links")
    f.text(XF[1] + 0.6, yb - 3.0, WS.x - XF[1] - 0.6, 2.8, [P("TCP", **lab)], align="c", anchor="b",
           name="TCP unten")
    f.text(XSB - 0.8 - 8.0, S.b + 0.5, 8.0, 2.8, [P("HTTPS", **lab)], align="r", anchor="t", name="HTTPS unten rechts")
    # Anwendungsserver ⇄ BI-Plattform → Dateiablageserver
    A([(S.r, ymid), (P0.x, ymid)], head=True, size="sm", name="Anwendungsserver ⇄ BI-Plattform")
    f.text(S.r, ymid - 3.0, P0.x - S.r, 2.8, [P("TCP", **lab)], align="c", anchor="b", name="TCP Mitte")
    A([(P0.r, ymid), (FR.x, ymid)], size="sm", name="BI-Plattform → Dateiablageserver")
    A([(FR.cx, AB.b), (FR.cx, FR.y)], head=True, size="sm", name="Dateiablage ⇄ Dateiablageserver")
    A([(FR.cx, DB.y), (FR.cx, FR.b)], size="sm", name="Datenbanken → Dateiablageserver")

    # ------------------------------------------------------------ Kästen
    f.box(U.x, U.y, U.w, U.h, user_p, role="box", name="Nutzer mit mobilem Endgerät")
    f.box(RP.x, RP.y, RP.w, RP.h, [P("Reverse Proxy", size=sz)], role="box", ins=(0.4, 0.6),
          name="Reverse Proxy")
    f.box(RS.x, RS.y, RS.w, RS.h, [P("Relay-Server", size=sz)], role="box", name="Relay-Server")
    f.box(WS.x, WS.y, WS.w, WS.h, mw_p, role="box", ins=(0.5, 0.6), name="Mobile-Middleware-Server")
    f.box(S.x, S.y, S.w, S.h, srv_p, role="box_strong", name="Mobiler Anwendungsserver")

    f.box(P0.x, P0.y, P0.w, P0.h, None, role="container", name="BI-Plattform")
    f.text(P0.x + 0.5, P0.y + 0.6, P0.w - 1.0, 3.2, [P("BI-Plattform", size=6.5, bold=True)], align="c",
           anchor="t", name="Titel BI-Plattform")
    y = P0.y + 4.4
    for d, h_ in zip(dienste, dh):
        f.box(P0.x + ins, y, P0.w - 2 * ins, h_, d, role="box", name=d[0].text.replace(SHY, "")[:30])
        y += h_ + gap

    f.box(FR.x, FR.y, FR.w, FR.h, frs_p, role="box", name="Dateiablageserver")
    f.box(AB.x, AB.y, AB.w, AB.h, abl_p, role="box_hi", name="Dateiablage")
    f.box(DB.x, DB.y, DB.w, DB.h, db_p, role="box_hi", name="Berichts- und Systemdatenbanken")
    return f
