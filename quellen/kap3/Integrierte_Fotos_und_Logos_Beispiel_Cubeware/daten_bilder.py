"""Bilder für Abb. 3.78 „Integrierte Fotos und Logos“ – selbst gezeichnete, lizenzfreie Illustrationen.

Alle Motive sind frei erfunden und hier per Code gezeichnet (keine Downloads, keine echten Personen, keine Marken):
- Porträts der zehn erfundenen Verkäuferinnen und Verkäufer (stilisierte Porträt-Illustration im Passbildformat),
- Seitenansichten der vier erfundenen Modelle (Limousine, SUV, Kombi, Kompaktwagen),
- Logo (Bildmarke und Wortmarke) des erfundenen Autohauses „Lindqvar Automobile“.
Ausgabe: SVG-Dateien im Unterordner bilder/ (frei weiterverwendbar). daten_vertrieb.py bettet sie in vertrieb.json ein,
damit die HTML-Datei ohne externe Dateien auskommt.
"""
import os

HIER = os.path.dirname(os.path.abspath(__file__))
ZIEL = os.path.join(HIER, "bilder")


# ---------------------------------------------------------------- Porträts (216 x 280, Seitenverhältnis 108 x 140)
def portraet(p, uid):
    haut, haut_d, haar, jacke, hemd = p["haut"], p["haut_d"], p["haar"], p["jacke"], p["hemd"]
    s = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 216 280" width="216" height="280">',
         '<defs>',
         f'<linearGradient id="bg{uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#EEF1F4"/>'
         f'<stop offset="1" stop-color="#CED5DC"/></linearGradient>',
         f'<radialGradient id="hd{uid}" cx="0.42" cy="0.38" r="0.7"><stop offset="0" stop-color="{p["haut_h"]}"/>'
         f'<stop offset="0.75" stop-color="{haut}"/><stop offset="1" stop-color="{haut_d}"/></radialGradient>',
         f'<linearGradient id="jk{uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{jacke[0]}"/>'
         f'<stop offset="1" stop-color="{jacke[1]}"/></linearGradient>',
         f'<radialGradient id="hr{uid}" cx="0.4" cy="0.3" r="0.8"><stop offset="0" stop-color="{p["haar_h"]}"/>'
         f'<stop offset="1" stop-color="{haar}"/></radialGradient>',
         '</defs>',
         f'<rect width="216" height="280" fill="url(#bg{uid})"/>',
         '<ellipse cx="150" cy="60" rx="90" ry="70" fill="#FFFFFF" opacity="0.35"/>']
    stil = p["stil"]
    if stil in ("bob", "lang"):
        unten = 200 if stil == "bob" else 250
        s.append(f'<path d="M50,{unten} C40,130 46,48 108,46 C170,48 176,130 166,{unten} '
                 f'C146,{unten + 10} 70,{unten + 10} 50,{unten} Z" fill="url(#hr{uid})"/>')
    if stil == "dutt":
        s.append(f'<circle cx="108" cy="50" r="22" fill="url(#hr{uid})"/>')
    # Hals und Oberkörper
    s.append(f'<path d="M90,150 L126,150 L128,206 Q108,218 88,206 Z" fill="{haut_d}"/>')
    s.append(f'<path d="M14,280 C18,236 52,212 92,204 L108,226 L124,204 C164,212 198,236 202,280 Z" '
             f'fill="url(#jk{uid})"/>')
    if p.get("bluse"):
        s.append(f'<path d="M90,204 Q108,236 126,204 L132,210 Q108,250 84,210 Z" fill="{hemd}"/>')
    else:
        s.append(f'<path d="M88,206 L108,262 L128,206 L120,202 L108,222 L96,202 Z" fill="{hemd}"/>')
        if p.get("krawatte"):
            s.append(f'<path d="M104,224 L112,224 L116,262 L108,274 L100,262 Z" fill="{p["krawatte"]}"/>')
    # Revers
    s.append(f'<path d="M88,206 L104,262 L70,280 L56,224 Z" fill="{jacke[1]}" opacity="0.55"/>')
    s.append(f'<path d="M128,206 L112,262 L146,280 L160,224 Z" fill="{jacke[1]}" opacity="0.55"/>')
    # Ohren, Kopf
    s.append(f'<ellipse cx="62" cy="124" rx="8" ry="13" fill="{haut_d}"/>')
    s.append(f'<ellipse cx="154" cy="124" rx="8" ry="13" fill="{haut_d}"/>')
    s.append(f'<ellipse cx="108" cy="116" rx="46" ry="55" fill="url(#hd{uid})"/>')
    if p.get("ohrring"):
        s.append('<circle cx="62" cy="140" r="3" fill="#D9C27A"/><circle cx="154" cy="140" r="3" fill="#D9C27A"/>')
    # Haar vorn
    if stil == "kurz":
        s.append(f'<path d="M60,118 C54,66 80,48 110,48 C142,48 164,68 156,118 C152,96 144,84 128,78 '
                 f'C108,86 84,84 68,94 C64,100 62,108 60,118 Z" fill="url(#hr{uid})"/>')
    elif stil == "licht":
        s.append(f'<path d="M60,120 C56,92 64,74 76,70 C72,84 70,100 68,122 Z" fill="url(#hr{uid})"/>')
        s.append(f'<path d="M156,120 C160,92 152,74 140,70 C144,84 146,100 148,122 Z" fill="url(#hr{uid})"/>')
    elif stil in ("bob", "lang"):
        s.append(f'<path d="M60,128 C56,72 82,54 110,54 C140,54 162,74 156,128 C152,104 142,88 120,80 '
                 f'C104,94 82,104 60,128 Z" fill="url(#hr{uid})"/>')
    elif stil == "dutt":
        s.append(f'<path d="M62,116 C58,76 82,60 108,60 C136,60 158,76 154,116 C146,94 132,84 108,84 '
                 f'C86,84 70,94 62,116 Z" fill="url(#hr{uid})"/>')
    # Gesicht
    br = p.get("brauen", haar)
    s.append(f'<path d="M80,102 Q90,96 100,101" stroke="{br}" stroke-width="3.6" fill="none" stroke-linecap="round"/>')
    s.append(f'<path d="M116,101 Q126,96 136,102" stroke="{br}" stroke-width="3.6" fill="none" stroke-linecap="round"/>')
    for x in (90, 126):
        s.append(f'<ellipse cx="{x}" cy="115" rx="5.2" ry="3.8" fill="#2B2622"/>')
        s.append(f'<circle cx="{x + 1.6}" cy="113.8" r="1.2" fill="#FFFFFF"/>')
    if p.get("brille"):
        s.append('<g fill="none" stroke="#2F2F2F" stroke-width="2.4"><rect x="76" y="105" width="28" height="20" rx="7"/>'
                 '<rect x="112" y="105" width="28" height="20" rx="7"/><path d="M104,113 Q108,110 112,113"/>'
                 '<path d="M76,112 L64,110"/><path d="M140,112 L152,110"/></g>')
    s.append(f'<path d="M108,118 Q103,134 110,138" stroke="{haut_d}" stroke-width="2.4" fill="none" stroke-linecap="round"/>')
    s.append(f'<ellipse cx="82" cy="136" rx="9" ry="5" fill="#D9776B" opacity="0.16"/>')
    s.append(f'<ellipse cx="134" cy="136" rx="9" ry="5" fill="#D9776B" opacity="0.16"/>')
    if p.get("bart"):
        s.append(f'<path d="M66,132 C70,168 90,174 108,174 C126,174 146,168 150,132 C146,150 132,158 108,158 '
                 f'C84,158 70,150 66,132 Z" fill="{p["bart"]}" opacity="0.85"/>')
    s.append(f'<path d="M94,149 Q108,161 122,149 Q108,154 94,149 Z" fill="{p.get("lippe", "#9C4A43")}"/>')
    s.append('</svg>')
    return "".join(s)


HAUT = {  # Grundton, Schatten, Licht
    "hell": ("#F1C9A9", "#D9A783", "#F8DCC4"), "mittel": ("#E0AE86", "#C48C64", "#EEC6A4"),
    "oliv": ("#C99468", "#A8744C", "#DCAE86"), "dunkel": ("#8E5B3C", "#6E432A", "#A9734F"),
}
HAAR = {  # Grundton, Glanz
    "braun": ("#4A3324", "#7A563C"), "dunkel": ("#22201E", "#4A4540"), "blond": ("#B98E52", "#E2C08A"),
    "rot": ("#8A4A2A", "#B97048"), "grau": ("#8E8C88", "#C4C2BE"), "hellbraun": ("#7A5636", "#A8825C"),
}
JACKE = {"navy": ("#3E4E66", "#26324A"), "anthrazit": ("#52575C", "#2F3338"), "grau": ("#8A9097", "#5E646B"),
         "petrol": ("#3E6468", "#254246"), "beere": ("#6E4258", "#4A2A3A"), "camel": ("#A88660", "#7E6142")}


def person(haut, haar, jacke, stil, hemd="#FFFFFF", **extra):
    h, hd, hh = HAUT[haut]
    a, ah = HAAR[haar]
    return dict(haut=h, haut_d=hd, haut_h=hh, haar=a, haar_h=ah, jacke=JACKE[jacke], stil=stil, hemd=hemd, **extra)


PERSONEN = {  # Namen wie in daten_vertrieb.py (erfunden)
    "Frau Brandt": person("hell", "braun", "navy", "bob", bluse=True, ohrring=True),
    "Herr Tal": person("mittel", "dunkel", "anthrazit", "kurz", krawatte="#7A2E2E"),
    "Frau Lenz": person("hell", "blond", "grau", "lang", bluse=True, hemd="#F2E9E1"),
    "Herr Kaya": person("oliv", "dunkel", "navy", "kurz", bart="#2A2420", hemd="#E8EEF4"),
    "Frau Moreau": person("dunkel", "dunkel", "beere", "dutt", bluse=True, ohrring=True, lippe="#7A3B36"),
    "Herr Olsen": person("hell", "hellbraun", "grau", "kurz", brille=True, krawatte="#3E4E66"),
    "Frau Petrov": person("hell", "rot", "petrol", "bob", bluse=True, brille=True),
    "Herr Weber": person("mittel", "grau", "anthrazit", "licht", brille=True, krawatte="#5E646B"),
    "Herr Novak": person("hell", "hellbraun", "camel", "kurz", bart="#6A4A30", hemd="#EEF2F5"),
    "Frau Albers": person("mittel", "braun", "anthrazit", "lang", bluse=True, hemd="#E9E4EE"),
}


# ---------------------------------------------------------------- Produkte (300 x 208, Seitenverhältnis 150 x 104)
def rad(x, y, r):
    s = [f'<circle cx="{x}" cy="{y}" r="{r}" fill="#1E1F21"/>',
         f'<circle cx="{x}" cy="{y}" r="{r * .64:.1f}" fill="url(#felge)"/>']
    for i in range(5):
        import math
        w = math.radians(i * 72 - 90)
        s.append(f'<line x1="{x}" y1="{y}" x2="{x + math.cos(w) * r * .58:.1f}" y2="{y + math.sin(w) * r * .58:.1f}" '
                 f'stroke="#7E858C" stroke-width="{r * .16:.1f}" stroke-linecap="round"/>')
    s.append(f'<circle cx="{x}" cy="{y}" r="{r * .18:.1f}" fill="#5A6066"/>')
    return "".join(s)


MODELLBAU = {
    "Limousine L 67": dict(farbe=("#62788E", "#2E3E50"), xf=78, xr=226, r=21, yb=158, R=25,
        oben="M22,158 L22,140 Q22,124 40,121 L102,113 Q120,88 138,84 L196,83 Q212,85 232,108 L270,112 Q280,114 280,132 L280,158",
        fenster=["M110,112 Q124,92 140,89 L170,88 L170,112 Z", "M176,88 L194,88 Q206,90 222,110 L176,111 Z"],
        tueren=[(172, 112, 156), (118, 116, 156)], licht=(24, 128), heck=(274, 118)),
    "SUV S 55": dict(farbe=("#B9C0C7", "#7D868F"), xf=78, xr=226, r=24, yb=156, R=28,
        oben="M20,156 L20,128 Q20,112 38,108 L96,102 Q112,76 126,66 L250,64 Q262,66 270,88 L280,104 Q282,110 282,124 L282,156",
        fenster=["M104,100 Q118,78 130,72 L168,72 L168,100 Z", "M174,72 L218,72 L218,100 L174,100 Z",
                 "M224,72 L248,72 Q256,74 262,96 L224,100 Z"],
        tueren=[(171, 100, 150), (221, 100, 150)], licht=(22, 116), heck=(276, 106)),
    "Kombi K 40": dict(farbe=("#6E7276", "#34373B"), xf=78, xr=226, r=21, yb=158, R=25,
        oben="M22,158 L22,140 Q22,124 40,121 L102,113 Q120,88 138,84 L250,82 Q262,84 270,104 L278,112 Q281,118 281,134 L281,158",
        fenster=["M110,112 Q124,92 140,89 L172,88 L172,112 Z", "M178,88 L222,87 L222,111 L178,111 Z",
                 "M228,87 L248,86 Q258,88 266,108 L228,111 Z"],
        tueren=[(175, 112, 156), (225, 111, 154)], licht=(24, 128), heck=(276, 116)),
    "Kompakt C 20": dict(farbe=("#5F8DA6", "#2C5266"), xf=88, xr=214, r=20, yb=159, R=24,
        oben="M40,159 L40,142 Q40,128 56,125 L108,118 Q126,92 142,86 L212,84 Q226,86 240,104 L256,114 Q262,118 262,136 L262,159",
        fenster=["M116,116 Q130,96 144,91 L176,90 L176,116 Z", "M182,90 L208,89 Q220,91 232,110 L182,114 Z"],
        tueren=[(179, 116, 157)], licht=(42, 132), heck=(258, 120)),
}


def produkt(m, uid):
    b = MODELLBAU[m]
    yc = b["yb"] - 3 if b["r"] < 24 else b["yb"] - 4
    boden = yc + b["r"]
    R, xf, xr, yb = b["R"], b["xf"], b["xr"], b["yb"]
    xmax = float(b["oben"].split()[-1].split(",")[0][1:])
    xmin = float(b["oben"].split()[0][1:].split(",")[0])
    pfad = (b["oben"] + f" L{xr + R},{yb} A{R},{R} 0 0 0 {xr - R},{yb} L{xf + R},{yb} "
            f"A{R},{R} 0 0 0 {xf - R},{yb} L{xmin},{yb} Z")
    s = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 208" width="300" height="208">',
         '<defs>',
         '<linearGradient id="pbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F4F5F7"/>'
         '<stop offset="0.78" stop-color="#E3E6EA"/><stop offset="1" stop-color="#D3D7DC"/></linearGradient>',
         f'<linearGradient id="lack" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{b["farbe"][0]}"/>'
         f'<stop offset="0.55" stop-color="{b["farbe"][1]}"/><stop offset="1" stop-color="{b["farbe"][1]}"/></linearGradient>',
         '<linearGradient id="glas" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7D8E9C"/>'
         '<stop offset="0.5" stop-color="#2E3A45"/><stop offset="1" stop-color="#1D252C"/></linearGradient>',
         '<radialGradient id="felge" cx="0.4" cy="0.35" r="0.7"><stop offset="0" stop-color="#E4E8EC"/>'
         '<stop offset="1" stop-color="#9AA2AA"/></radialGradient>',
         '<radialGradient id="schatten" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#000" stop-opacity="0.32"/>'
         '<stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>',
         '</defs>',
         '<rect width="300" height="208" fill="url(#pbg)"/>',
         f'<ellipse cx="{(xmin + xmax) / 2}" cy="{boden + 1}" rx="{(xmax - xmin) / 2 + 12}" ry="9" fill="url(#schatten)"/>',
         f'<path d="M{xf - R},{yb} A{R},{R} 0 0 1 {xf + R},{yb} Z" fill="#202224"/>',
         f'<path d="M{xr - R},{yb} A{R},{R} 0 0 1 {xr + R},{yb} Z" fill="#202224"/>',
         f'<path d="{pfad}" fill="url(#lack)"/>']
    s += [f'<path d="{f}" fill="url(#glas)"/>' for f in b["fenster"]]
    s.append(f'<path d="{b["fenster"][0]}" fill="#FFFFFF" opacity="0.12" transform="translate(4,0) scale(0.97,1)"/>')
    for x, y1, y2 in b["tueren"]:
        s.append(f'<line x1="{x}" y1="{y1}" x2="{x}" y2="{y2}" stroke="#000" stroke-opacity="0.28" stroke-width="1.2"/>')
    # Lichtkante, Schweller, Leuchten, Griffe
    s.append(f'<path d="M{xmin + 6},{b["licht"][1] + 4} L{xmax - 6},{b["heck"][1] + 6}" stroke="#FFFFFF" '
             f'stroke-opacity="0.35" stroke-width="2"/>')
    s.append(f'<rect x="{xmin + 2}" y="{yb - 9}" width="{xmax - xmin - 4}" height="6" fill="#000" opacity="0.18"/>')
    lx, ly = b["licht"]
    s.append(f'<path d="M{lx},{ly} L{lx + 16},{ly - 2} L{lx + 14},{ly + 5} L{lx},{ly + 6} Z" fill="#F3F1E8"/>')
    hx, hy = b["heck"]
    s.append(f'<rect x="{hx - 6}" y="{hy}" width="7" height="9" rx="1.5" fill="#9E3B36"/>')
    for x, y1, _ in b["tueren"]:
        s.append(f'<rect x="{x - 18}" y="{y1 + 8}" width="11" height="3" rx="1.5" fill="#000" opacity="0.3"/>')
    s.append(rad(xf, yc, b["r"]) + rad(xr, yc, b["r"]))
    s.append('</svg>')
    return "".join(s)


# ---------------------------------------------------------------- Logo (300 x 92, Seitenverhältnis 150 x 46)
LOGO = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 92" width="300" height="92">'
        '<g transform="translate(44,46) scale(1.3) translate(-38,-46)">'
        '<circle cx="38" cy="46" r="31" fill="#3A3F44"/>'
        '<path d="M22,66 C30,52 36,40 38,24 C40,40 46,52 54,66 L47,66 C43,56 40,48 38,40 C36,48 33,56 29,66 Z" fill="#FFFFFF"/>'
        '<rect x="36.4" y="50" width="3.2" height="6" fill="#FFFFFF"/><rect x="36.4" y="60" width="3.2" height="6" fill="#FFFFFF"/>'
        '<circle cx="38" cy="18" r="4.5" fill="#C62828"/></g>'
        '<text x="98" y="58" font-family="Arial, Liberation Sans, Helvetica, sans-serif" font-size="32" font-weight="bold" '
        'letter-spacing="1.2" fill="#3A3F44">LINDQVAR</text>'
        '</svg>')


def dateiname(t):
    return t.lower().replace(" ", "_").replace("ä", "ae").replace("ö", "oe").replace("ü", "ue").replace("ß", "ss")


if __name__ == "__main__":
    os.makedirs(ZIEL, exist_ok=True)
    for i, (n, p) in enumerate(PERSONEN.items()):
        open(os.path.join(ZIEL, f"person_{dateiname(n)}.svg"), "w", encoding="utf-8").write(portraet(p, i))
    for i, m in enumerate(MODELLBAU):
        open(os.path.join(ZIEL, f"produkt_{dateiname(m)}.svg"), "w", encoding="utf-8").write(produkt(m, i))
    open(os.path.join(ZIEL, "logo_lindqvar.svg"), "w", encoding="utf-8").write(LOGO)
    print("Bilder geschrieben:", len(os.listdir(ZIEL)))
