#!/usr/bin/env python3
"""Erzeugt index.html – die Abbildungsinventur der 6. Auflage.

Aufruf (im Ordner der Inventur):
    python3 werkzeug/vorschau.py      # Vorschaubilder aktualisieren (nur neue/geänderte)
    python3 werkzeug/inventur.py      # index.html neu schreiben

Datenquellen (alle in werkzeug/):
  einordnung.json  je Folie der 5. Auflage: Abbildungsnummer, Titel, Art (D/V/S/T/DUP/X), Hinweis
  inventar.json    je Folie: vollständige Sprechernotiz (Caption der 5. Auflage)
  status.json      Pflegeliste: Status, Kommentare, Alternativtext je Abbildung
  pruefregeln.py   automatische Caption-Prüfung

Dateien der neuen Fassung werden automatisch gefunden:
  abbildungen/kapN/<stem>.png|.pdf|.pptx|.html|_daten.csv, quellen/kapN/<stem>.py oder quellen/kapN/<stem>/,
  tabellen/<stem>.tex, vorschau/... (stem z. B. abb_3-5, tab_4-8, lst_5-39)
"""
import datetime
import glob
import html
import json
import os
import re
import sys
from collections import Counter, OrderedDict

from PIL import Image

HIER = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HIER)
sys.path.insert(0, HIER)
from pruefregeln import caption_aus_notiz, pruefe  # noqa: E402

Image.MAX_IMAGE_PIXELS = None
STATUS = OrderedDict([
    ("freigegeben", "Freigegeben"),
    ("pruefung", "Zur Prüfung"),
    ("latex", "LaTeX bereit"),
    ("klaerung", "Klärung nötig"),
    ("offen", "Offen"),
    ("screenshot", "Screenshot (später)"),
    ("entfaellt", "Entfällt"),
    ("hinweis", "Hinweis"),
])
ART = {"D": "Diagramm", "V": "Dashboard/Visual", "S": "Screenshot", "T": "Tabelle", "DUP": "Duplikat", "X": "Hinweis"}
WEG = {"D": "neu als PNG + PPTX", "V": "neu als PNG + HTML", "S": "Skill Screenshots", "T": "LaTeX-Tabelle"}
OFFEN_MUSTER = re.compile(r"prüfen|klären|\?|abgleichen|angleichen|unterscheiden|welche|gleichsetzen|vereinheitlichen")


def tex_caption(code):
    """Text der \\caption{...} aus LaTeX-Code (für die Anzeige)."""
    i = code.find("\\caption")
    if i < 0:
        return None
    i += len("\\caption")
    if code[i] == "[":
        i = code.index("]", i) + 1
    tiefe, start = 0, i + 1
    for j in range(i, len(code)):
        if code[j] == "{":
            tiefe += 1
        elif code[j] == "}":
            tiefe -= 1
            if tiefe == 0:
                t = code[start:j]
                break
    else:
        return None
    for a, b in (("\\,", " "), ("~", " "), ("\\%", "%"), ("\\&", "&"), ("\\_", "_")):
        t = t.replace(a, b)
    return re.sub(r"\s+", " ", t).strip()


def lade(name):
    with open(os.path.join(HIER, name), encoding="utf-8") as fh:
        return json.load(fh)


def rel(*teile):
    return "/".join(teile)


def da(pfad):
    return os.path.exists(os.path.join(ROOT, pfad))


def e(s):
    return html.escape(str(s), quote=True)


def mm(png):
    with Image.open(os.path.join(ROOT, png)) as im:
        dpi = im.info.get("dpi", (600, 600))[0] or 600
        return round(im.width / dpi * 25.4), round(im.height / dpi * 25.4)


def latex_text(s):
    s = s.replace("\\", r"\textbackslash{}")
    for a, b in (("&", r"\&"), ("%", r"\%"), ("#", r"\#"), ("_", r"\_"), ("λ", r"$\lambda$")):
        s = s.replace(a, b)
    s = re.sub(r"\bz\. B\.", r"z.\\,B.", s)
    s = re.sub(r"\bu\. a\.", r"u.\\,a.", s)
    s = re.sub(r"\bS\. (\d)", r"S.~\1", s)
    s = re.sub(r"\bi\. ([ew])\. S\.", r"i.\\,\1.\\,S.", s)
    return s


def figure_latex(nr, caption, datei, breite_mm, quer, vektor):
    umg = "sidewaysfigure" if quer else "figure"
    zeilen = []
    if quer:
        zeilen.append(r"% benötigt im Präambel: \usepackage{rotating}")
    if vektor:
        zeilen.append(f"% Vektor-PDF in Originalgröße ({breite_mm} mm breit) – nicht skalieren, dann bleibt die Schrift bei 7 pt")
        gfx = rf"\includegraphics{{{datei}}}"
    else:
        zeilen.append(f"% PNG mit 600 dpi, {breite_mm} mm breit")
        gfx = rf"\includegraphics[width={breite_mm}mm]{{{datei}}}"
    zeilen += [rf"\begin{{{umg}}}" + ("" if quer else "[htbp]"), r"  \centering", "  " + gfx,
               rf"  \caption{{{latex_text(caption)}}}", rf"  \label{{fig:{nr.replace('.', '-')}}}", rf"\end{{{umg}}}"]
    return "\n".join(zeilen) + "\n"


def eintraege():
    E = lade("einordnung.json")
    notiz = {i["folie"]: i["notiz"] for i in lade("inventar.json")}
    pflege = lade("status.json")["eintraege"]
    liste = []
    for x in E:
        art, folie = x["art"], x["folie"]
        if art == "X" and not x["hinweis"].startswith("Hinweis"):
            continue                                     # Titel- und Trennfolien
        if art == "T":
            nr = re.match(r"Tab\. ([0-9.]+)", x["titel"]).group(1)
            schluessel, label, stem = f"Tab. {nr}", f"Tab. {nr}", f"tab_{nr.replace('.', '-')}"
            anker, kap = f"tab-{nr.replace('.', '-')}", nr.split(".")[0]
        elif art == "DUP":
            schluessel, label, stem = f"Folie {folie}", f"Abb. {x['nr']} (Duplikat)", None
            anker, kap, nr = f"folie-{folie:03d}", x["nr"].split(".")[0], x["nr"]
        elif art == "X":
            m = re.search(r"Abb\. ([0-9.]+–[0-9.]+)", x["hinweis"])
            schluessel, label, stem = f"Folie {folie}", f"Abb. {m.group(1)}" if m else f"Folie {folie}", None
            anker, kap, nr = f"folie-{folie:03d}", "3", ""
        else:
            nr = x["nr"]
            schluessel, label, stem = nr, f"Abb. {nr}", f"abb_{nr.replace('.', '-')}"
            anker, kap = f"abb-{nr.replace('.', '-')}", nr.split(".")[0]
        p = pflege.get(schluessel, {})
        cap_alt = caption_aus_notiz(notiz.get(folie, "")) if art != "X" else "Abbildungen zu Kapitel 3.9"
        if art in ("D", "V", "S", "T"):
            cap_neu, cap_kom = pruefe(schluessel if art == "T" else nr, art, cap_alt)
        else:
            cap_neu, cap_kom = cap_alt, []

        # Dateien der neuen Fassung
        dateien = OrderedDict()
        if stem:
            for endung, name in (("png", "PNG"), ("pdf", "PDF"), ("pptx", "PPTX"), ("html", "HTML")):
                pf = rel("abbildungen", f"kap{kap}", f"{stem}.{endung}")
                if da(pf):
                    dateien[name] = pf
            csv = rel("abbildungen", f"kap{kap}", f"{stem}_daten.csv")
            if da(csv):
                dateien["CSV"] = csv
        quellen = []
        if stem:
            q = rel("quellen", f"kap{kap}", f"{stem}.py")
            if da(q):
                quellen.append(q)
            qd = os.path.join(ROOT, "quellen", f"kap{kap}", stem)
            if os.path.isdir(qd):
                quellen += [rel("quellen", f"kap{kap}", stem, f) for f in sorted(os.listdir(qd))]
        tex = p.get("latex") or (rel("tabellen", f"{stem}.tex") if stem and art == "T" else None)
        if tex and not da(tex):
            tex = None

        if tex:
            cap_tex = tex_caption(open(os.path.join(ROOT, tex), encoding="utf-8").read())
            if cap_tex:
                cap_neu = cap_tex
        if p.get("caption"):
            cap_neu = p["caption"]

        # Status
        if p.get("status"):
            status = p["status"]
        elif dateien:
            status = "pruefung"
        elif art == "T" and tex:
            status = "latex"
        elif art == "S":
            status = "screenshot"
        elif art == "DUP":
            status = "entfaellt"
        elif art == "X":
            status = "hinweis"
        elif "klären" in x["hinweis"]:
            status = "klaerung"
        else:
            status = "offen"

        # Vorschau
        orig_k = rel("vorschau", "original", "klein", f"folie_{folie:03d}.jpg")
        orig_g = rel("vorschau", "original", f"folie_{folie:03d}.jpg")
        neu_k = neu_g = None
        tex_stem = os.path.splitext(os.path.basename(tex))[0] if tex else None
        for s in (stem, tex_stem):
            if s and da(rel("vorschau", "neu", f"{s}.jpg")):
                neu_k = rel("vorschau", "neu", f"{s}.jpg")
                neu_g = dateien.get("PNG") or rel("vorschau", "neu", "gross", f"{s}.png")
                break

        groesse = None
        if "PNG" in dateien:
            groesse = mm(dateien["PNG"])
        quer = bool(p.get("quer")) or (groesse is not None and groesse[0] > 120)

        # LaTeX-Code
        latex = None
        if tex:
            with open(os.path.join(ROOT, tex), encoding="utf-8") as fh:
                latex = fh.read()
        elif "PDF" in dateien or "PNG" in dateien:
            vektor = "PDF" in dateien
            latex = figure_latex(nr, cap_neu, dateien["PDF"] if vektor else dateien["PNG"],
                                 groesse[0] if groesse else 110, quer, vektor)

        vorgehen = x["hinweis"]
        if (re.match(r"(bereits|Tabelle mit Tab|Titel|Doppelte|Hinweis|Notiz)", vorgehen) or "klären" in vorgehen
                or status in ("freigegeben", "pruefung", "latex")):
            vorgehen = ""
        liste.append(dict(
            folie=folie, art=art, kap=kap, nr=nr, schluessel=schluessel, label=label, anker=anker, stem=stem,
            cap_alt=cap_alt, cap_neu=cap_neu, cap_kom=cap_kom, kommentare=list(p.get("kommentare", [])),
            alt=p.get("alt", ""), status=status, dateien=dateien, quellen=quellen, tex=tex, latex=latex,
            orig_k=orig_k if da(orig_k) else None, orig_g=orig_g if da(orig_g) else None,
            neu_k=neu_k, neu_g=neu_g if neu_g and da(neu_g) else None,
            groesse=groesse, quer=quer, vorgehen=vorgehen))
    pruefe_dubletten(liste)
    return liste


def pruefe_dubletten(liste):
    nach_caption = {}
    for x in liste:
        if x["art"] in ("DUP", "X"):
            continue
        nach_caption.setdefault(x["cap_neu"].split(" (")[0].strip().lower(), []).append(x)
    for gruppe in nach_caption.values():
        if len(gruppe) > 1:
            for x in gruppe:
                andere = ", ".join(y["label"] for y in gruppe if y is not x)
                x["cap_kom"].append(f"Gleiche Caption wie {andere} – Captions unterscheiden")


def luecken(liste):
    """Fehlende Nummern je Kapitel (Kap. 3.9 = Abb. 3.79–3.177 liegt gesondert vor)."""
    befunde = []
    abb = {}
    tab = {}
    for x in liste:
        if x["art"] in ("D", "V", "S"):
            k, n = x["nr"].split(".")
            abb.setdefault(k, set()).add(int(n))
        elif x["art"] == "T":
            k, n = x["schluessel"][5:].split(".")
            tab.setdefault(k, set()).add(int(n))
    for k in sorted(abb, key=int):
        fehlt = [n for n in range(1, max(abb[k]) + 1) if n not in abb[k] and not (k == "3" and 79 <= n <= 177)]
        if fehlt:
            befunde.append(f"Kapitel {k}: Abb. " + ", ".join(f"{k}.{n}" for n in fehlt) + " fehlen in der Sammlung")
    for k in sorted(tab, key=int):
        fehlt = [n for n in range(1, max(tab[k]) + 1) if n not in tab[k]]
        if fehlt:
            von, bis = fehlt[0], fehlt[-1]
            rng = f"{k}.{von}–{k}.{bis}" if len(fehlt) == bis - von + 1 and len(fehlt) > 1 else ", ".join(f"{k}.{n}" for n in fehlt)
            befunde.append(f"Kapitel {k}: Tab. {rng} nicht in der Sammlung (vermutlich Satztabellen im Manuskript)")
    return befunde


def kommentar_li(t):
    klasse = " class='pk'" if OFFEN_MUSTER.search(t) else ""
    return f"<li{klasse}>{e(t)}</li>"


def karte(x):
    st = x["status"]
    such = " ".join([x["label"], x["cap_alt"], x["cap_neu"], " ".join(x["kommentare"]), " ".join(x["cap_kom"]),
                     f"folie {x['folie']}"]).lower()
    offen = any(OFFEN_MUSTER.search(k) for k in x["kommentare"] + x["cap_kom"]) or st == "klaerung"
    teile = [f"<article class='karte' id='{x['anker']}' data-kap='{x['kap']}' data-status='{st}' data-art='{x['art']}'"
             f" data-offen='{1 if offen else 0}' data-suche='{e(such)}'>"]
    # Kopf
    teile.append("<header class='kk'>"
                 f"<a class='nr' href='#{x['anker']}' title='Link auf diese Abbildung'>{e(x['label'])}</a>"
                 f"<span class='st st-{st}'>{e(STATUS[st])}</span>"
                 f"<span class='meta'>{e(ART.get(x['art'], ''))} · Folie {x['folie']}</span></header>")
    teile.append(f"<h3 class='cap'>{e(x['cap_neu'])}</h3>")
    if x["cap_neu"] != x["cap_alt"] and x["art"] not in ("X",):
        teile.append(f"<p class='capalt'><span>5. Aufl.:</span> {e(x['cap_alt'])}</p>")
    # Bilder
    teile.append("<div class='bilder'>")
    if x["orig_k"]:
        teile.append(f"<figure><button class='lupe' data-gross='{e(x['orig_g'] or x['orig_k'])}' "
                     f"data-titel='{e(x['label'])} – 5. Auflage'><img src='{e(x['orig_k'])}' loading='lazy' "
                     f"alt='{e(x['label'])}, Fassung der 5. Auflage'></button><figcaption>5. Auflage</figcaption></figure>")
    if x["neu_k"]:
        fmt = f" · {x['groesse'][0]} × {x['groesse'][1]} mm" if x["groesse"] else ""
        quer = " quer" if x["quer"] else ""
        teile.append(f"<figure class='neu'><button class='lupe' data-gross='{e(x['neu_g'] or x['neu_k'])}' "
                     f"data-titel='{e(x['label'])} – 6. Auflage'><img src='{e(x['neu_k'])}' loading='lazy' "
                     f"alt='{e(x['alt'] or x['label'] + ', neue Fassung')}'></button>"
                     f"<figcaption>6. Auflage{fmt}{quer}</figcaption></figure>")
    elif x["status"] not in ("entfaellt", "hinweis"):
        weg = WEG.get(x["art"], "")
        teile.append(f"<figure class='leer'><div><span>noch nicht umgesetzt</span><small>{e(weg)}</small></div>"
                     f"<figcaption>6. Auflage</figcaption></figure>")
    teile.append("</div>")
    # Dateien und Kopieren
    knoepfe = []
    for name, pf in x["dateien"].items():
        dl = " download" if name in ("PPTX", "CSV") else " target='_blank' rel='noopener'"
        knoepfe.append(f"<a class='kn' href='{e(pf)}'{dl}>{name}</a>")
    if x["tex"]:
        knoepfe.append(f"<a class='kn' href='{e(x['tex'])}' target='_blank' rel='noopener'>.tex</a>")
    if x["latex"]:
        was = "LaTeX kopieren" if x["tex"] else "LaTeX (figure) kopieren"
        knoepfe.append(f"<button class='kn kopie' data-ziel='tex-{x['anker']}'>{was}</button>")
    if knoepfe:
        teile.append("<nav class='dateien'>" + "".join(knoepfe) + "</nav>")
    if x["quellen"]:
        teile.append("<p class='quellen'><span>Quelle:</span> " + " · ".join(
            f"<a href='{e(q)}' target='_blank' rel='noopener'>{e(os.path.basename(q))}</a>" for q in x["quellen"]) + "</p>")
    # Kommentare
    if x["vorgehen"]:
        teile.append(f"<p class='vorgehen'><span>Vorgehen:</span> {e(x['vorgehen'])}</p>")
    if x["kommentare"]:
        teile.append("<div class='kom'><h4>Kommentare</h4><ul>" + "".join(kommentar_li(k) for k in x["kommentare"]) + "</ul></div>")
    if x["cap_kom"]:
        teile.append("<div class='kom'><h4>Caption</h4><ul>" + "".join(kommentar_li(k) for k in x["cap_kom"]) + "</ul></div>")
    if x["alt"]:
        teile.append(f"<details><summary>Alternativtext</summary><p>{e(x['alt'])}</p></details>")
    if x["latex"]:
        teile.append(f"<details class='code'><summary>LaTeX-Code</summary><pre><code id='tex-{x['anker']}'>"
                     f"{e(x['latex'])}</code></pre></details>")
    teile.append("</article>")
    return "".join(teile)


CSS = """
:root{--ac:#3A3F44;--rot:#C62828;--gut:#00806B;--text:#1A1A1A;--muted:#5A5F64;--linie:#D9D9D9;--flaeche:#F4F4F4;color-scheme:light}
*{box-sizing:border-box}
html{scroll-padding-top:120px}
body{margin:0;font:15px/1.45 Arial,"Liberation Sans",Helvetica,sans-serif;color:var(--text);background:#fff}
a{color:inherit}
.kopf{max-width:1240px;margin:0 auto;padding:26px 20px 6px}
h1{font-size:25px;margin:0 0 2px}
.unter{color:var(--muted);margin:0 0 16px}
.zahlen{display:flex;flex-wrap:wrap;border-top:1px solid var(--linie);border-bottom:1px solid var(--linie);margin:0 0 14px}
.zahlen button{all:unset;cursor:pointer;flex:1 1 120px;padding:10px 14px;border-left:1px solid var(--linie)}
.zahlen button:first-child{border-left:none;padding-left:0}
.zahlen button:hover b,.zahlen button[aria-pressed=true] b{color:var(--rot)}
.zahlen b{display:block;font-size:26px;line-height:1.1}
.zahlen span{color:var(--muted);font-size:13px}
details.info{margin:0 0 10px;font-size:14px;color:var(--muted)}
details.info summary{cursor:pointer;color:var(--text)}
details.info table{border-collapse:collapse;margin:8px 0 4px;font-size:13px}
details.info th,details.info td{padding:3px 10px 3px 0;border-bottom:1px solid var(--linie);text-align:right}
details.info th:first-child,details.info td:first-child{text-align:left}
details.info ul{margin:6px 0;padding-left:18px}
.leiste{position:sticky;top:0;z-index:5;background:#fff;border-bottom:1px solid var(--linie)}
.leiste div.in{max-width:1240px;margin:0 auto;padding:10px 20px;display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center}
.kapitel{display:flex;border:1px solid var(--ac);border-radius:4px;overflow:hidden}
.kapitel button{all:unset;cursor:pointer;padding:5px 11px;font-size:14px;border-left:1px solid var(--ac);white-space:nowrap}
.kapitel button:first-child{border-left:none}
.kapitel button[aria-pressed=true]{background:var(--ac);color:#fff}
select,input[type=search]{font:inherit;font-size:14px;padding:5px 8px;border:1px solid #9A9A9A;border-radius:4px;background:#fff}
input[type=search]{min-width:160px;flex:1 1 160px}
label.cb{font-size:14px;display:flex;gap:6px;align-items:center;cursor:pointer}
.anzahl{color:var(--muted);font-size:13px;margin-left:auto}
main{max-width:1240px;margin:0 auto;padding:6px 20px 60px}
h2.kap{font-size:20px;margin:30px 0 12px;padding-bottom:6px;border-bottom:2px solid var(--ac)}
h2.kap span{color:var(--muted);font-weight:normal;font-size:15px}
.raster{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,540px),1fr));gap:16px}
.karte{border:1px solid var(--linie);border-radius:5px;padding:12px 14px 12px;background:#fff;min-width:0}
.karte:target{outline:3px solid var(--rot);outline-offset:2px}
.kk{display:flex;flex-wrap:wrap;gap:6px 10px;align-items:center;margin-bottom:4px}
.nr{font-weight:bold;font-size:16px;text-decoration:none}
.nr:hover{text-decoration:underline}
.meta{color:var(--muted);font-size:13px;margin-left:auto}
.st{font-size:12px;padding:2px 8px;border-radius:10px;border:1px solid var(--ac);white-space:nowrap}
.st-freigegeben{background:var(--gut);border-color:var(--gut);color:#fff}
.st-pruefung{background:var(--ac);color:#fff}
.st-latex{color:var(--ac)}
.st-klaerung{background:var(--rot);border-color:var(--rot);color:#fff}
.st-offen{border-color:#9A9A9A;color:var(--muted)}
.st-screenshot{background:var(--flaeche);border-color:var(--linie);color:var(--muted)}
.st-entfaellt{border-color:var(--linie);color:var(--muted);text-decoration:line-through}
.st-hinweis{border-color:var(--linie);color:var(--muted);font-style:italic}
h3.cap{font-size:15px;margin:2px 0 4px;line-height:1.35}
.capalt{margin:0 0 6px;font-size:13px;color:var(--muted)}
.capalt span,.vorgehen span,.quellen span{font-weight:bold}
.bilder{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:8px 0 8px}
.bilder figure{margin:0;min-width:0}
.lupe{all:unset;display:block;width:100%;cursor:zoom-in;border:1px solid var(--linie);background:var(--flaeche);border-radius:3px}
.lupe:focus-visible{outline:2px solid var(--rot)}
.lupe img{display:block;width:100%;aspect-ratio:4/3;object-fit:contain;background:#fff}
.bilder figcaption{font-size:12px;color:var(--muted);margin-top:3px}
.neu .lupe{border-color:var(--ac)}
.leer>div{aspect-ratio:4/3;display:flex;flex-direction:column;gap:2px;align-items:center;justify-content:center;text-align:center;border:1px dashed #B5B5B5;border-radius:3px;color:var(--muted);font-size:13px;background:#fff}
.dateien{display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 6px}
.kn{font:inherit;font-size:13px;padding:3px 9px;border:1px solid var(--ac);border-radius:4px;background:#fff;color:var(--ac);text-decoration:none;cursor:pointer}
.kn:hover{background:var(--ac);color:#fff}
.kn.leise{border-color:var(--linie);color:var(--muted)}
.kn.kopie{background:var(--ac);color:#fff}
.kn.kopie:hover{background:#000}
.kn.ok{background:var(--gut);border-color:var(--gut)}
.vorgehen,.quellen{font-size:13px;color:var(--muted);margin:4px 0}
.quellen a{color:var(--muted)}
.kom h4{font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:var(--muted);margin:8px 0 2px}
.kom ul{margin:0;padding-left:18px;font-size:13.5px}
.kom li{margin:1px 0}
.kom li.pk::marker{color:var(--rot)}
.kom li.pk{color:#000}
details{margin-top:6px;font-size:13.5px}
details summary{cursor:pointer;color:var(--muted)}
details p{margin:4px 0}
pre{margin:6px 0 0;padding:10px;background:var(--flaeche);border:1px solid var(--linie);border-radius:4px;overflow:auto;max-height:340px;font:12px/1.4 Consolas,"DejaVu Sans Mono",monospace}
dialog{border:none;padding:0;max-width:96vw;max-height:94vh;background:#fff}
dialog img{display:block;max-width:96vw;max-height:calc(94vh - 34px);object-fit:contain}
dialog p{margin:0;padding:8px 12px;font-size:13px;color:var(--muted);display:flex;justify-content:space-between;gap:12px}
dialog::backdrop{background:rgba(0,0,0,.65)}
.leerhinweis{display:none;color:var(--muted);padding:30px 0}
footer{max-width:1240px;margin:0 auto;padding:0 20px 40px;color:var(--muted);font-size:12px}
@media (max-width:700px){.leiste{position:static}.kapitel button{padding:5px 9px}.kapitel .kp{display:none}select,input[type=search]{flex:1 1 140px}html{scroll-padding-top:10px}}
@media (max-width:640px){.zahlen{display:grid;grid-template-columns:1fr 1fr}.zahlen button,.zahlen button:first-child{border-left:none;padding:8px 0;border-top:1px solid var(--linie)}.bilder{grid-template-columns:1fr}.meta{margin-left:0}.anzahl{margin-left:0}}
"""

JS = r"""
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const karten=$$('.karte'), stand={kap:'alle',status:'',art:'',q:'',offen:false};
function filtern(){
  let n=0;
  for(const k of karten){
    const ok=(stand.kap==='alle'||k.dataset.kap===stand.kap)&&(!stand.status||k.dataset.status===stand.status)
      &&(!stand.art||k.dataset.art===stand.art)&&(!stand.offen||k.dataset.offen==='1')
      &&(!stand.q||stand.q.split(/\s+/).every(w=>k.dataset.suche.includes(w)));
    k.hidden=!ok; if(ok)n++;
  }
  for(const s of $$('section.kapitel-block')) s.hidden=!$$('.karte',s).some(k=>!k.hidden);
  $('#anzahl').textContent=n+' von '+karten.length+' angezeigt';
  $('.leerhinweis').style.display=n?'none':'block';
  for(const b of $$('.zahlen button')) b.setAttribute('aria-pressed',String(b.dataset.status===stand.status&&!!stand.status));
}
for(const b of $$('.kapitel button')) b.addEventListener('click',()=>{
  stand.kap=b.dataset.kap; for(const x of $$('.kapitel button')) x.setAttribute('aria-pressed',String(x===b)); filtern();});
$('#f-status').addEventListener('change',ev=>{stand.status=ev.target.value;filtern();});
$('#f-art').addEventListener('change',ev=>{stand.art=ev.target.value;filtern();});
$('#f-suche').addEventListener('input',ev=>{stand.q=ev.target.value.trim().toLowerCase();filtern();});
$('#f-offen').addEventListener('change',ev=>{stand.offen=ev.target.checked;filtern();});
for(const b of $$('.zahlen button')) b.addEventListener('click',()=>{
  stand.status=(stand.status===b.dataset.status)?'':b.dataset.status; $('#f-status').value=stand.status; filtern();});
// Lupe
const d=$('#lupe');
for(const b of $$('.lupe')) b.addEventListener('click',()=>{
  $('img',d).src=b.dataset.gross; $('img',d).alt=b.dataset.titel; $('#lupe-titel').textContent=b.dataset.titel;
  $('#lupe-link').href=b.dataset.gross; d.showModal();});
d.addEventListener('click',ev=>{if(ev.target.tagName!=='A')d.close();});
// Kopieren
async function kopiere(text){
  try{await navigator.clipboard.writeText(text);return true;}catch(e){
    const t=document.createElement('textarea');t.value=text;t.style.position='fixed';t.style.opacity='0';
    document.body.appendChild(t);t.select();let ok=false;try{ok=document.execCommand('copy');}catch(e2){}
    t.remove();return ok;}
}
for(const b of $$('.kopie')) b.addEventListener('click',async()=>{
  const ok=await kopiere(document.getElementById(b.dataset.ziel).textContent);
  const alt=b.textContent; b.textContent=ok?'Kopiert ✓':'Kopieren fehlgeschlagen'; b.classList.toggle('ok',ok);
  setTimeout(()=>{b.textContent=alt;b.classList.remove('ok');},1600);});
// Direktlink #abb-3-5: Filter so setzen, dass die Karte sichtbar ist
function zeigeZiel(){const z=location.hash&&document.getElementById(location.hash.slice(1));
  if(z&&z.hidden){stand.kap='alle';stand.status='';stand.art='';stand.q='';stand.offen=false;
    $('#f-status').value='';$('#f-art').value='';$('#f-suche').value='';$('#f-offen').checked=false;
    for(const x of $$('.kapitel button')) x.setAttribute('aria-pressed',String(x.dataset.kap==='alle')); filtern(); z.scrollIntoView();}}
addEventListener('hashchange',zeigeZiel);
filtern(); zeigeZiel();
"""


def seite(liste):
    heute = datetime.date.today().strftime("%d.%m.%Y")
    zaehler = Counter(x["status"] for x in liste)
    kapitel = list(OrderedDict.fromkeys(x["kap"] for x in liste))
    # Übersichtstabelle Kapitel × Status
    sts = [s for s in STATUS if zaehler[s]]
    tab = ["<table><tr><th>Kapitel</th>" + "".join(f"<th>{e(STATUS[s])}</th>" for s in sts) + "<th>Summe</th></tr>"]
    for k in kapitel:
        c = Counter(x["status"] for x in liste if x["kap"] == k)
        tab.append(f"<tr><td>Kapitel {k}</td>" + "".join(f"<td>{c[s] or '–'}</td>" for s in sts)
                   + f"<td>{sum(c.values())}</td></tr>")
    tab.append("<tr><td><b>Gesamt</b></td>" + "".join(f"<td><b>{zaehler[s]}</b></td>" for s in sts)
               + f"<td><b>{len(liste)}</b></td></tr></table>")
    befunde = luecken(liste)
    zahlen = "".join(f"<button data-status='{s}' aria-pressed='false'><b>{zaehler[s]}</b><span>{e(STATUS[s])}</span></button>"
                     for s in STATUS if zaehler[s] and s != "hinweis")
    kap_kn = "<button data-kap='alle' aria-pressed='true'>Alle</button>" + "".join(
        f"<button data-kap='{k}' aria-pressed='false'><span class='kp'>Kap. </span>{k}</button>" for k in kapitel)
    st_opt = "<option value=''>Alle Status</option>" + "".join(
        f"<option value='{s}'>{e(STATUS[s])}</option>" for s in STATUS if zaehler[s])
    arten = Counter(x["art"] for x in liste)
    art_opt = "<option value=''>Alle Arten</option>" + "".join(
        f"<option value='{a}'>{e(ART[a])} ({arten[a]})</option>" for a in ("D", "V", "S", "T", "DUP", "X") if arten[a])
    teile = [
        "<!DOCTYPE html><html lang='de'><head><meta charset='utf-8'>"
        "<meta name='viewport' content='width=device-width,initial-scale=1'>"
        f"<title>Abbildungsinventur 6. Auflage</title><style>{CSS}</style></head><body>",
        "<div class='kopf'><h1>Abbildungsinventur 6. Auflage</h1>",
        "<p class='unter'>Planung und Reporting im BI-gestützten Controlling · alle Abbildungen und Tabellen der "
        f"Abbildungssammlung zur 5. Auflage (ohne Kap. 3.9) · Stand {heute}</p>",
        f"<div class='zahlen'><button data-status='' aria-pressed='false'><b>{len(liste)}</b><span>Einträge</span></button>{zahlen}</div>",
        "<details class='info'><summary>Übersicht je Kapitel, Nummerierung und Bedienung</summary>" + "".join(tab),
        ("<ul>" + "".join(f"<li>{e(b)}</li>" for b in befunde) + "</ul>") if befunde else "",
        "<ul><li>Bild anklicken: große Ansicht. Links neben „5. Auflage“ das Original, rechts die neue Fassung.</li>"
        "<li>„LaTeX kopieren“ legt den Code der Tabelle in die Zwischenablage – direkt in Overleaf einfügen. "
        "Bei fertigen Abbildungen kopiert der Knopf die figure-Umgebung mit Caption und Label; dafür die Datei aus "
        "<code>abbildungen/</code> mit gleichem Pfad nach Overleaf hochladen.</li>"
        "<li>Rote Aufzählungspunkte markieren Kommentare, die eine Entscheidung oder fachliche Prüfung brauchen.</li>"
        "<li>Direktlink auf eine Abbildung: Nummer anklicken, z. B. <code>index.html#abb-3-5</code>.</li></ul></details>",
        "</div>",
        "<div class='leiste'><div class='in'>"
        f"<div class='kapitel' role='group' aria-label='Kapitel'>{kap_kn}</div>"
        f"<select id='f-status' aria-label='Status'>{st_opt}</select>"
        f"<select id='f-art' aria-label='Art'>{art_opt}</select>"
        "<input id='f-suche' type='search' placeholder='Suche: Nummer, Titel, Kommentar …' aria-label='Suche'>"
        "<label class='cb'><input id='f-offen' type='checkbox'> nur offene Punkte</label>"
        "<span class='anzahl' id='anzahl'></span></div></div>",
        "<main>",
    ]
    for k in kapitel:
        ks = [x for x in liste if x["kap"] == k]
        fertig = sum(1 for x in ks if x["status"] in ("freigegeben", "pruefung", "latex"))
        teile.append(f"<section class='kapitel-block' data-kap='{k}'><h2 class='kap'>Kapitel {k} "
                     f"<span>{len(ks)} Einträge · {fertig} umgesetzt</span></h2><div class='raster'>")
        teile += [karte(x) for x in ks]
        teile.append("</div></section>")
    teile.append("<p class='leerhinweis'>Keine Einträge für diese Auswahl.</p></main>")
    teile.append(f"<footer>Erzeugt mit werkzeug/inventur.py am {heute}. Pflege: werkzeug/status.json.</footer>")
    teile.append("<dialog id='lupe'><img alt=''><p><span id='lupe-titel'></span>"
                 "<a id='lupe-link' target='_blank' rel='noopener'>in neuem Tab öffnen</a></p></dialog>")
    teile.append(f"<script>{JS}</script></body></html>")
    return "".join(teile)


def main():
    liste = eintraege()
    with open(os.path.join(ROOT, "index.html"), "w", encoding="utf-8") as fh:
        fh.write(seite(liste))
    c = Counter(x["status"] for x in liste)
    print("index.html geschrieben:", len(liste), "Einträge –", ", ".join(f"{STATUS[s]} {c[s]}" for s in STATUS if c[s]))
    fehlend = [x["label"] for x in liste if not x["orig_k"]]
    if fehlend:
        print("ohne Originalvorschau:", ", ".join(fehlend))


if __name__ == "__main__":
    main()
