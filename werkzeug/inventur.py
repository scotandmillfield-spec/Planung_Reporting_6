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
  abbildungen/kapN/<name>.png|.pdf|.pptx|.html|_daten.csv, quellen/kapN/<name>.py oder quellen/kapN/<name>/,
  tabellen/<name>.tex, vorschau/neu/kapN/<name>.jpg bzw. vorschau/neu/tabellen/<name>.jpg

<name> ist der Kurzname der Caption (pruefregeln.kurzname, z. B. „ABC-Analyse“), nicht die Nummer – die Reihenfolge
ändert sich. Ändert sich eine Caption, benennt dieses Skript alle Dateien der Abbildung um (git mv), passt die
Verweise in quellen/ an und vermerkt den Namen in status.json („datei“).
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
from pruefregeln import caption_aus_notiz, kurzname, label_aus_caption, pruefe  # noqa: E402
import subprocess  # noqa: E402

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
# Abstimmungsstatus (Google-Tabelle); Schlüssel für CSS/Filter, Text wie in der Tabelle
ABSTIMMUNG = OrderedDict([
    ("offen", "offen"),
    ("arbeit", "in Arbeit"),
    ("pruefung", "zur Prüfung"),
    ("revision", "Revision"),
    ("version", "Nächste Version"),
    ("aenderung", "Änderung nötig"),
    ("klaerung", "Klärung nötig"),
    ("freigegeben", "freigegeben"),
    ("entfaellt", "entfällt"),
])
# Anfangsstatus aus dem Stand der Umsetzung (gilt, solange die Tabelle nicht erreichbar ist)
START = {"pruefung": "pruefung", "latex": "pruefung", "freigegeben": "freigegeben", "klaerung": "klaerung",
         "entfaellt": "entfaellt", "hinweis": "hinweis"}
ART = {"D": "Diagramm", "V": "Dashboard/Visual", "M": "Eingabemaske", "S": "Screenshot", "T": "Tabelle", "DUP": "Duplikat",
       "X": "Hinweis"}
WEG = {"D": "neu als PNG + PPTX", "V": "neu als PNG + HTML", "M": "neu als HTML + PNG + PDF + PPTX (Skill Eingabemasken)",
       "S": "Sonderfall – Vorgehen klären", "T": "LaTeX-Tabelle"}
OFFEN_MUSTER = re.compile(r"prüfen|klären|\?|abgleichen|angleichen|unterscheiden|welche|gleichsetzen|vereinheitlichen")


def label_setzen(code):
    """Label einer Tabelle bzw. eines Listings aus der Caption ableiten (Präfix wie im Code, z. B. tab:)."""
    cap = tex_caption(code)
    m = re.search(r"\\label\{([a-z]+):[^}]*\}", code)
    if not cap or not m:
        return code
    return code[:m.start()] + "\\label{" + label_aus_caption(cap, m.group(1)) + "}" + code[m.end():]


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


# Pfad aller Abbildungen im Overleaf-Projekt des Buchs (author/content/abbildungen/kapN/…)
OVERLEAF_PFAD = "author/content/"
# Veröffentlichte Inventur (GitHub Pages) – Grundlage für die Links auf die PNGs der Lernplattform
PLATTFORM_URL = "https://scotandmillfield-spec.github.io/Planung_Reporting_6/"


def quer_latex(nr, caption, datei):
    """Jede Abbildung im Querformat (Dashboard oder nicht): PNG um 90° gedreht auf einer Hochformatseite."""
    return "\n".join([
        r"\begin{figure}",
        r"    \centering",
        rf"    \includegraphics[angle=90, width=\linewidth, height=1\textheight, keepaspectratio]{{{OVERLEAF_PFAD}{datei}}}",
        rf"    \caption{{{latex_text(caption)}}}",
        rf"    \label{{{label_aus_caption(caption)}}}",
        r"\end{figure}"]) + "\n"


def figure_latex(nr, caption, datei, breite_mm, vektor):
    """Abbildung im Hochformat (110 mm breit)."""
    zeilen = []
    if vektor:
        zeilen.append(f"% Vektor-PDF in Originalgröße ({breite_mm} mm breit) – nicht skalieren, dann bleibt die Schriftgröße erhalten")
        gfx = rf"\includegraphics{{{OVERLEAF_PFAD}{datei}}}"
    else:
        zeilen.append(f"% PNG mit 600 dpi, {breite_mm} mm breit")
        gfx = rf"\includegraphics[width={breite_mm}mm]{{{OVERLEAF_PFAD}{datei}}}"
    zeilen += [r"\begin{figure}[htbp]", r"  \centering", "  " + gfx,
               rf"  \caption{{{latex_text(caption)}}}", rf"  \label{{{label_aus_caption(caption)}}}", r"\end{figure}"]
    return "\n".join(zeilen) + "\n"


UMBENANNT = []
GEAENDERT = []


def verschieben(alt, neu):
    """Datei oder Ordner umbenennen, im Repository mit git mv (Historie bleibt erhalten)."""
    qa, qn = os.path.join(ROOT, alt), os.path.join(ROOT, neu)
    if not os.path.exists(qa) or os.path.abspath(qa) == os.path.abspath(qn):
        return False
    os.makedirs(os.path.dirname(qn), exist_ok=True)
    r = subprocess.run(["git", "mv", alt, neu], cwd=ROOT, capture_output=True, text=True)
    if r.returncode != 0:
        os.rename(qa, qn)
    return True


def umbenennen(alt, neu, kap, tabelle):
    """Alle Dateien einer Abbildung bzw. Tabelle vom Namen alt auf neu umstellen. True, wenn etwas verschoben wurde."""
    paare = []
    for f in sorted(glob.glob(os.path.join(ROOT, "abbildungen", f"kap{kap}", alt + ".*"))):
        paare.append((rel("abbildungen", f"kap{kap}", os.path.basename(f)),
                      rel("abbildungen", f"kap{kap}", neu + os.path.splitext(f)[1])))
    paare += [(rel("abbildungen", f"kap{kap}", f"{alt}_daten.csv"), rel("abbildungen", f"kap{kap}", f"{neu}_daten.csv")),
              (rel("quellen", f"kap{kap}", f"{alt}.py"), rel("quellen", f"kap{kap}", f"{neu}.py")),
              (rel("quellen", f"kap{kap}", alt), rel("quellen", f"kap{kap}", neu)),
              (rel("tabellen", f"{alt}.tex"), rel("tabellen", f"{neu}.tex"))]
    # Vorschauen: alte flache Ablage (vorschau/neu/<alt>.jpg) oder neue Ablage je Kapitel bzw. Tabellen
    vz = "tabellen" if tabelle else f"kap{kap}"
    for quelle in (rel("vorschau", "neu", f"{alt}.jpg"), rel("vorschau", "neu", vz, f"{alt}.jpg")):
        paare.append((quelle, rel("vorschau", "neu", vz, f"{neu}.jpg")))
    paare.append((rel("vorschau", "neu", "gross", f"{alt}.png"), rel("vorschau", "neu", "gross", f"{neu}.png")))
    bewegt = [a for a, n in paare if verschieben(a, n)]
    if not bewegt:
        return False
    # Verweise in den Quellen: STEM = "…", Pfade wie "..", "<alt>", "projekte.json" oder …/<alt>/…
    muster = re.compile(r'(["\'/])' + re.escape(alt) + r'(["\'/])')
    for f in glob.glob(os.path.join(ROOT, "quellen", "**", "*.*"), recursive=True):
        if os.path.splitext(f)[1] not in (".py", ".js"):
            continue
        t = open(f, encoding="utf-8").read()
        t2 = muster.sub(lambda m: m.group(1) + neu + m.group(2), t)
        if t2 != t:
            open(f, "w", encoding="utf-8").write(t2)
    UMBENANNT.append(f"{alt} → {neu} ({len(bewegt)} Dateien/Ordner)")
    return True


def eintraege():
    E = lade("einordnung.json")
    notiz = {i["folie"]: i["notiz"] for i in lade("inventar.json")}
    status_json = lade("status.json")
    pflege = status_json["eintraege"]
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
        if stem and p.get("datei"):
            stem = p["datei"]                            # aktueller Dateiname (Kurzname der Caption)
        cap_alt = caption_aus_notiz(notiz.get(folie, "")) if art != "X" else "Abbildungen zu Kapitel 3.9"
        if art in ("D", "V", "M", "S", "T"):
            cap_neu, cap_kom = pruefe(schluessel if art == "T" else nr, art, cap_alt)
        else:
            cap_neu, cap_kom = cap_alt, []
        tex = p.get("latex") or (rel("tabellen", f"{stem}.tex") if stem and art == "T" else None)
        if tex and da(tex):
            cap_tex = tex_caption(open(os.path.join(ROOT, tex), encoding="utf-8").read())
            if cap_tex:
                cap_neu = cap_tex
        if p.get("caption"):
            cap_neu = p["caption"]

        # Dateiname = Kurzname der Caption; bei Abweichung alle Dateien umbenennen
        if stem:
            ziel = kurzname(cap_neu)
            if ziel and ziel != stem:
                tabelle = art == "T" or bool(p.get("latex"))
                alt_tex = rel("tabellen", f"{os.path.splitext(os.path.basename(tex))[0]}") if tex else None
                if alt_tex and os.path.basename(alt_tex) != stem:      # Tabelle mit abweichendem Dateinamen
                    umbenennen(os.path.basename(alt_tex), ziel, kap, True)
                if umbenennen(stem, ziel, kap, tabelle) or (alt_tex and not da(tex)):
                    pflege.setdefault(schluessel, p)
                    p["datei"] = ziel
                    if p.get("latex"):
                        p["latex"] = rel("tabellen", f"{ziel}.tex")
                    GEAENDERT.append(schluessel)
                stem = ziel
        tex = p.get("latex") or (rel("tabellen", f"{stem}.tex") if stem and art == "T" else None)

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
        if tex and not da(tex):
            tex = None

        # Status
        if p.get("status"):
            status = p["status"]
        elif dateien:
            status = "pruefung"
        elif art == "T" and tex:
            status = "latex"
        elif art == "S":                                 # keine Produktscreenshots: Sonderfall klären
            status = "klaerung"
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
        for k in ([rel("vorschau", "neu", f"kap{kap}", f"{stem}.jpg")] if stem else []) + \
                 ([rel("vorschau", "neu", "tabellen", f"{tex_stem}.jpg")] if tex_stem else []):
            if da(k):
                neu_k = k
                neu_g = dateien.get("PNG") or rel("vorschau", "neu", "gross", f"{tex_stem or stem}.png")
                break

        groesse = None
        if "PNG" in dateien:
            groesse = mm(dateien["PNG"])
        quer = bool(p.get("quer")) or (groesse is not None and groesse[0] > 120)

        # LaTeX-Code
        latex = None
        if tex:
            with open(os.path.join(ROOT, tex), encoding="utf-8") as fh:
                latex = label_setzen(fh.read())
        elif "PNG" in dateien and quer:                  # Querformat: immer gedrehtes PNG (Dashboards und Abbildungen)
            latex = quer_latex(nr, cap_neu, dateien["PNG"])
        elif "PDF" in dateien or "PNG" in dateien:
            vektor = "PDF" in dateien
            latex = figure_latex(nr, cap_neu, dateien["PDF"] if vektor else dateien["PNG"],
                                 groesse[0] if groesse else 110, vektor)

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
    if GEAENDERT:                                        # neue Dateinamen in der Pflegeliste vermerken
        with open(os.path.join(HIER, "status.json"), "w", encoding="utf-8") as fh:
            json.dump(status_json, fh, ensure_ascii=False, indent=1)
    return liste


def pruefe_dubletten(liste):
    nach_label = {}
    for x in liste:
        m = re.search(r"\\label\{([^}]*)\}", x["latex"] or "")
        if m:
            nach_label.setdefault(m.group(1), []).append(x)
    for lab, gruppe in nach_label.items():
        if len(gruppe) > 1:
            for x in gruppe:
                andere = ", ".join(y["label"] for y in gruppe if y is not x)
                x["cap_kom"].append(f"Gleiches LaTeX-Label wie {andere} ({lab}) – Captions unterscheiden")
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
        if x["art"] in ("D", "V", "M", "S"):
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
    st = START.get(x["status"], "offen")
    such = " ".join([x["label"], x["cap_alt"], x["cap_neu"], " ".join(x["kommentare"]), " ".join(x["cap_kom"]),
                     f"folie {x['folie']}"]).lower()
    offen = any(OFFEN_MUSTER.search(k) for k in x["kommentare"] + x["cap_kom"]) or st == "klaerung"
    teile = [f"<article class='karte' id='{x['anker']}' data-kap='{x['kap']}' data-status='{st}' data-art='{x['art']}'"
             f" data-offen='{1 if offen else 0}' data-offen-fix='{1 if offen else 0}' data-suche='{e(such)}'>"]
    # Kopf
    text = "Hinweis" if st == "hinweis" else ABSTIMMUNG[st]
    teile.append("<header class='kk'>"
                 f"<a class='nr' href='#{x['anker']}' title='Link auf diese Abbildung'>{e(x['label'])}</a>"
                 f"<span class='st st-{st}' title='Status der Abstimmung'>{e(text)}</span>"
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
    if "PNG" in x["dateien"]:
        link = PLATTFORM_URL + x["dateien"]["PNG"]
        knoepfe.append(f"<button class='kn kopie' data-text='{e(link)}' title='{e(link)}'>PNG-Link kopieren</button>")
    if knoepfe:
        teile.append("<nav class='dateien'>" + "".join(knoepfe) + "</nav>")
    if x["quellen"]:
        teile.append("<p class='quellen'><span>Quelle:</span> " + " · ".join(
            f"<a href='{e(q)}' target='_blank' rel='noopener'>{e(os.path.basename(q))}</a>" for q in x["quellen"]) + "</p>")
    # Abstimmung (Status und Kommentare aus der Google-Tabelle)
    if st != "hinweis":
        optionen = "".join(f"<option value='{k}'{' selected' if k == st else ''}>{e(v)}</option>"
                           for k, v in ABSTIMMUNG.items())
        teile.append(f"<section class='abst' aria-label='Abstimmung'><h4>Abstimmung <span class='abst-zuletzt'></span></h4>"
                     "<ul class='abst-liste'></ul>"
                     "<div class='abst-form' hidden>"
                     f"<label>Status <select class='abst-status'>{optionen}</select></label>"
                     "<textarea class='abst-text' rows='2' placeholder='Kommentar hinzufügen (optional)'></textarea>"
                     "<div class='abst-zeile'><button type='button' class='kn kopie abst-speichern'>Speichern</button>"
                     "<span class='abst-meldung' role='status'></span></div></div></section>")
    # Hinweise aus der Umsetzung
    if x["vorgehen"]:
        teile.append(f"<p class='vorgehen'><span>Vorgehen:</span> {e(x['vorgehen'])}</p>")
    if x["kommentare"]:
        teile.append("<div class='kom'><h4>Hinweise aus der Umsetzung</h4><ul>" + "".join(kommentar_li(k) for k in x["kommentare"]) + "</ul></div>")
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
details.info td.fett{font-weight:bold}
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
.st-offen{border-color:#9A9A9A;color:var(--muted)}
.st-arbeit{color:var(--ac)}
.st-pruefung{background:var(--ac);color:#fff}
.st-revision{border-color:var(--rot);color:var(--rot);font-weight:bold}
.st-version{background:#5E646A;border-color:#5E646A;color:#fff}
.st-aenderung{border-color:var(--rot);color:var(--rot);font-weight:bold}
.st-klaerung{background:var(--rot);border-color:var(--rot);color:#fff}
.st-freigegeben{background:var(--gut);border-color:var(--gut);color:#fff}
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
.abst{margin:8px 0 2px;padding:8px 10px;background:var(--flaeche);border-radius:4px}
.abst h4{font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:var(--muted);margin:0 0 2px}
.abst-zuletzt{text-transform:none;letter-spacing:0;font-weight:normal}
.abst-liste{margin:2px 0 0;padding-left:18px;font-size:13.5px}
.abst-liste:empty{display:none}
.abst-liste li{margin:1px 0}
.abst-liste .wer{color:var(--muted)}
.abst-form{display:grid;gap:6px;margin-top:6px}
.abst-form[hidden]{display:none}
.abst-form label{font-size:13px;display:flex;gap:8px;align-items:center}
.abst-form select{font-size:13px;padding:3px 6px}
.abst-form textarea{font:inherit;font-size:13.5px;padding:5px 7px;border:1px solid #9A9A9A;border-radius:4px;resize:vertical;width:100%}
.abst-zeile{display:flex;gap:10px;align-items:center}
.abst-meldung{font-size:13px;color:var(--muted)}
.abst-meldung.fehler{color:var(--rot)}
.abst-info{display:flex;flex-wrap:wrap;gap:6px 14px;align-items:center;font-size:13.5px;color:var(--muted);margin:0 0 12px}
.abst-info .punkt{display:inline-block;width:8px;height:8px;border-radius:4px;background:#9A9A9A;margin-right:6px}
.abst-info.verbunden .punkt{background:var(--gut)}
.abst-info.fehler .punkt{background:var(--rot)}
#anmelden{padding:18px 20px;max-width:360px;border:1px solid var(--linie);border-radius:6px}
#anmelden h3{margin:0 0 6px;font-size:16px}
#anmelden p{display:block;padding:0;margin:0 0 10px;font-size:13px;color:var(--muted)}
#anmelden label{display:grid;gap:3px;font-size:13px;margin-bottom:10px}
#anmelden input{font:inherit;font-size:14px;padding:5px 8px;border:1px solid #9A9A9A;border-radius:4px}
#anmelden .knoepfe{display:flex;gap:8px;justify-content:flex-end}
details{margin-top:6px;font-size:13.5px}
details summary{cursor:pointer;color:var(--muted)}
details p{margin:4px 0}
pre{margin:6px 0 0;padding:10px;background:var(--flaeche);border:1px solid var(--linie);border-radius:4px;overflow:auto;max-height:340px;font:12px/1.4 Consolas,"DejaVu Sans Mono",monospace}
#lupe{border:none;padding:0;max-width:96vw;max-height:94vh;background:#fff}
#lupe img{display:block;max-width:96vw;max-height:calc(94vh - 34px);object-fit:contain}
#lupe p{margin:0;padding:8px 12px;font-size:13px;color:var(--muted);display:flex;justify-content:space-between;gap:12px}
dialog::backdrop{background:rgba(0,0,0,.65)}
.leerhinweis{display:none;color:var(--muted);padding:30px 0}
footer{max-width:1240px;margin:0 auto;padding:0 20px 40px;color:var(--muted);font-size:12px}
@media (max-width:700px){.leiste{position:static}.kapitel button{padding:5px 9px}.kapitel .kp{display:none}select,input[type=search]{flex:1 1 140px}html{scroll-padding-top:10px}}
@media (max-width:640px){.zahlen{display:grid;grid-template-columns:1fr 1fr}.zahlen button,.zahlen button:first-child{border-left:none;padding:8px 0;border-top:1px solid var(--linie)}.bilder{grid-template-columns:1fr}.meta{margin-left:0}.anzahl{margin-left:0}}
"""

JS = r"""
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const KONFIG=__KONFIG__, STATUSTEXT=__STATUS__;
const TEXT2KEY=Object.fromEntries(Object.entries(STATUSTEXT).map(([k,v])=>[v,k]));
const karten=$$('.karte'), stand={kap:'alle',status:'',art:'',q:'',offen:false};
function el(tag,text,cls){const e=document.createElement(tag);if(text!=null)e.textContent=text;if(cls)e.className=cls;return e;}
// ---------- Kennzahlen und Übersicht aus den aktuellen Status der Karten ----------
function zaehlen(){
  const ges={}, kap={};
  for(const k of karten){const s=k.dataset.status; if(s==='hinweis')continue;
    ges[s]=(ges[s]||0)+1; const z=kap[k.dataset.kap]||(kap[k.dataset.kap]={}); z[s]=(z[s]||0)+1;}
  const summe=Object.values(ges).reduce((a,b)=>a+b,0), sts=Object.keys(STATUSTEXT).filter(s=>ges[s]);
  const z=$('#zahlen'); z.textContent='';
  const knopf=(s,n,t)=>{const b=el('button'); b.dataset.status=s; b.setAttribute('aria-pressed',String(!!s&&stand.status===s));
    b.append(el('b',String(n)),el('span',t));
    b.addEventListener('click',()=>{stand.status=(stand.status===s)?'':s; $('#f-status').value=stand.status; filtern();}); z.appendChild(b);};
  knopf('',summe,'Einträge'); for(const s of sts) knopf(s,ges[s],STATUSTEXT[s]);
  const t=el('table'), kopf=el('tr'); kopf.append(el('th','Kapitel'),...sts.map(s=>el('th',STATUSTEXT[s])),el('th','Summe')); t.appendChild(kopf);
  for(const [k,z2] of Object.entries(kap)){const tr=el('tr'); tr.append(el('td','Kapitel '+k),...sts.map(s=>el('td',z2[s]?String(z2[s]):'–')),
    el('td',String(Object.values(z2).reduce((a,b)=>a+b,0)))); t.appendChild(tr);}
  const tr=el('tr'); tr.append(el('td','Gesamt','fett'),...sts.map(s=>el('td',String(ges[s]),'fett')),el('td',String(summe),'fett')); t.appendChild(tr);
  const ziel=$('#kapiteltabelle'); ziel.textContent=''; ziel.appendChild(t);
}
// ---------- Filter ----------
function filtern(){
  let n=0;
  for(const k of karten){
    const suche=k.dataset.suche+' '+(k.dataset.sucheAbst||'');
    const ok=(stand.kap==='alle'||k.dataset.kap===stand.kap)&&(!stand.status||k.dataset.status===stand.status)
      &&(!stand.art||k.dataset.art===stand.art)&&(!stand.offen||k.dataset.offen==='1')
      &&(!stand.q||stand.q.split(/\s+/).every(w=>suche.includes(w)));
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
// ---------- Lupe ----------
const d=$('#lupe');
for(const b of $$('.lupe')) b.addEventListener('click',()=>{
  $('img',d).src=b.dataset.gross; $('img',d).alt=b.dataset.titel; $('#lupe-titel').textContent=b.dataset.titel;
  $('#lupe-link').href=b.dataset.gross; d.showModal();});
d.addEventListener('click',ev=>{if(ev.target.tagName!=='A')d.close();});
// ---------- Kopieren ----------
async function kopiere(text){
  try{await navigator.clipboard.writeText(text);return true;}catch(e){
    const t=document.createElement('textarea');t.value=text;t.style.position='fixed';t.style.opacity='0';
    document.body.appendChild(t);t.select();let ok=false;try{ok=document.execCommand('copy');}catch(e2){}
    t.remove();return ok;}
}
for(const b of $$('.kopie[data-ziel],.kopie[data-text]')) b.addEventListener('click',async()=>{
  const ok=await kopiere(b.dataset.text||document.getElementById(b.dataset.ziel).textContent);
  const alt=b.textContent; b.textContent=ok?'Kopiert ✓':'Kopieren fehlgeschlagen'; b.classList.toggle('ok',ok);
  setTimeout(()=>{b.textContent=alt;b.classList.remove('ok');},1600);});
// ---------- Abstimmung über die Google-Tabelle ----------
const WEBAPP=new URLSearchParams(location.search).get('webapp')||KONFIG.webapp||'';
const speicher={get:k=>{try{return localStorage.getItem(k)||'';}catch(e){return '';}},
  set:(k,v)=>{try{v?localStorage.setItem(k,v):localStorage.removeItem(k);}catch(e){}}};
let nutzer={name:speicher.get('abst-name'),pw:speicher.get('abst-pw')}, zuletztGeladen=0;
function info(text,klasse){$('#abst-info').className='abst-info '+(klasse||''); $('#abst-stand').textContent=text;}
function eintragZeigen(id,v){
  const k=document.getElementById(id); if(!k||k.dataset.status==='hinweis'||!v) return;
  const key=TEXT2KEY[String(v.status||'').trim()]||k.dataset.status;
  k.dataset.status=key;
  const b=$('.st',k); b.className='st st-'+key; b.textContent=STATUSTEXT[key];
  const sel=$('.abst-status',k); if(sel) sel.value=key;
  const ul=$('.abst-liste',k); ul.textContent='';
  for(const zeile of String(v.kommentare||'').split('\n').map(x=>x.trim()).filter(Boolean)){
    const li=el('li'), m=zeile.match(/^(\d\d\.\d\d\.\d{4} [^:]{1,40}:)\s*(.*)$/);
    if(m){li.append(el('span',m[1]+' ','wer'),m[2]);} else li.textContent=zeile;
    ul.appendChild(li);}
  $('.abst-zuletzt',k).textContent=(v.von||v.am)?'· zuletzt geändert: '+[v.von,v.am].filter(Boolean).join(', '):'';
  k.dataset.offen=(k.dataset.offenFix==='1'||key==='aenderung'||key==='revision'||key==='klaerung')?'1':'0';
  k.dataset.sucheAbst=String(v.kommentare||'').toLowerCase();
}
async function laden(){
  if(!WEBAPP){info('Abstimmung noch nicht verbunden – angezeigt wird der Stand der Inventur');return;}
  try{
    const r=await fetch(WEBAPP,{cache:'no-store'}); const j=await r.json();
    if(!j.ok) throw new Error(j.fehler||'Fehler');
    for(const [id,v] of Object.entries(j.eintraege||{})) eintragZeigen(id,v);
    zuletztGeladen=Date.now(); info('Abstimmung verbunden · Stand '+(j.stand||''),'verbunden'); zaehlen(); filtern();
  }catch(e){info('Abstimmung nicht erreichbar – angezeigt wird der Stand der Inventur','fehler');}
}
async function senden(obj){
  const r=await fetch(WEBAPP,{method:'POST',body:JSON.stringify(obj),headers:{'Content-Type':'text/plain;charset=utf-8'}});
  return r.json();
}
function bearbeiten(an){
  for(const f of $$('.abst-form')) f.hidden=!an;
  $('#abst-login').textContent=an?'Abmelden ('+nutzer.name+')':'Bearbeiten';
}
const dlg=$('#anmelden');
$('#abst-login').addEventListener('click',()=>{
  if(nutzer.pw){nutzer={name:'',pw:''}; speicher.set('abst-name',''); speicher.set('abst-pw',''); bearbeiten(false); return;}
  $('#an-name').value=speicher.get('abst-name-zuletzt'); $('#an-pw').value=''; $('#an-meldung').textContent=''; dlg.showModal();});
$('#an-abbrechen').addEventListener('click',()=>dlg.close());
$('#anmelden form').addEventListener('submit',async ev=>{
  ev.preventDefault();
  const name=$('#an-name').value.trim(), pw=$('#an-pw').value;
  if(!name||!pw){$('#an-meldung').textContent='Bitte Name und Passwort eingeben.';return;}
  $('#an-meldung').textContent='prüfe …';
  try{const j=await senden({aktion:'pruefen',passwort:pw});
    if(!j.ok) throw new Error(j.fehler||'Fehler');
    nutzer={name,pw}; speicher.set('abst-name',name); speicher.set('abst-pw',pw); speicher.set('abst-name-zuletzt',name);
    dlg.close(); bearbeiten(true);
  }catch(e){$('#an-meldung').textContent='Anmeldung fehlgeschlagen: '+e.message;}
});
for(const btn of $$('.abst-speichern')) btn.addEventListener('click',async()=>{
  const k=btn.closest('.karte'), m=$('.abst-meldung',k), key=$('.abst-status',k).value, text=$('.abst-text',k).value.trim();
  m.className='abst-meldung'; m.textContent='speichere …'; btn.disabled=true;
  try{
    const j=await senden({aktion:'speichern',schluessel:k.id,status:STATUSTEXT[key],kommentar:text,autor:nutzer.name,passwort:nutzer.pw});
    if(!j.ok) throw new Error(j.fehler||'Fehler');
    eintragZeigen(k.id,j.eintrag); $('.abst-text',k).value=''; m.textContent='gespeichert'; zaehlen();
  }catch(e){m.className='abst-meldung fehler'; m.textContent='nicht gespeichert: '+e.message;}
  finally{btn.disabled=false;}
});
if(!WEBAPP){$('#abst-login').disabled=true; $('#abst-login').title='Die Web-App ist noch nicht eingerichtet';}
else if(nutzer.pw) bearbeiten(true);
addEventListener('focus',()=>{if(WEBAPP&&Date.now()-zuletztGeladen>30000) laden();});
// ---------- Direktlink #abb-3-5: Filter so setzen, dass die Karte sichtbar ist ----------
function zeigeZiel(){const z=location.hash&&document.getElementById(location.hash.slice(1));
  if(z&&z.hidden){stand.kap='alle';stand.status='';stand.art='';stand.q='';stand.offen=false;
    $('#f-status').value='';$('#f-art').value='';$('#f-suche').value='';$('#f-offen').checked=false;
    for(const x of $$('.kapitel button')) x.setAttribute('aria-pressed',String(x.dataset.kap==='alle')); filtern(); z.scrollIntoView();}}
addEventListener('hashchange',zeigeZiel);
zaehlen(); filtern(); zeigeZiel(); laden();
"""


def seite(liste):
    heute = datetime.date.today().strftime("%d.%m.%Y")
    konfig = lade("abstimmung.json")
    kapitel = list(OrderedDict.fromkeys(x["kap"] for x in liste))
    befunde = luecken(liste)
    kap_kn = "<button data-kap='alle' aria-pressed='true'>Alle</button>" + "".join(
        f"<button data-kap='{k}' aria-pressed='false'><span class='kp'>Kap. </span>{k}</button>" for k in kapitel)
    st_opt = "<option value=''>Alle Status</option>" + "".join(
        f"<option value='{s}'>{e(t)}</option>" for s, t in ABSTIMMUNG.items())
    arten = Counter(x["art"] for x in liste)
    art_opt = "<option value=''>Alle Arten</option>" + "".join(
        f"<option value='{a}'>{e(ART[a])} ({arten[a]})</option>" for a in ("D", "V", "M", "S", "T", "DUP", "X") if arten[a])
    tabelle = (f" · <a href='{e(konfig['tabelle'])}' target='_blank' rel='noopener'>Tabelle öffnen</a>"
               if konfig.get("tabelle") else "")
    js = JS.replace("__KONFIG__", json.dumps({"webapp": konfig.get("webapp", "")}, ensure_ascii=False)) \
           .replace("__STATUS__", json.dumps(ABSTIMMUNG, ensure_ascii=False))
    teile = [
        "<!DOCTYPE html><html lang='de'><head><meta charset='utf-8'>"
        "<meta name='viewport' content='width=device-width,initial-scale=1'>"
        f"<title>Abbildungsinventur 6. Auflage</title><style>{CSS}</style></head><body>",
        "<div class='kopf'><h1>Abbildungsinventur 6. Auflage</h1>",
        "<p class='unter'>Planung und Reporting im BI-gestützten Controlling · alle Abbildungen und Tabellen der "
        f"Abbildungssammlung zur 5. Auflage (ohne Kap. 3.9) · Stand {heute}</p>",
        "<div class='zahlen' id='zahlen'></div>",
        f"<p class='abst-info' id='abst-info'><span><span class='punkt'></span><span id='abst-stand'>Abstimmung wird geladen …</span>"
        f"{tabelle}</span><button type='button' class='kn' id='abst-login'>Bearbeiten</button></p>",
        "<details class='info'><summary>Übersicht je Kapitel, Nummerierung und Bedienung</summary><div id='kapiteltabelle'></div>",
        ("<ul>" + "".join(f"<li>{e(b)}</li>" for b in befunde) + "</ul>") if befunde else "",
        "<ul><li>Bild anklicken: große Ansicht. Links das Original der 5. Auflage, rechts die neue Fassung.</li>"
        "<li>„LaTeX kopieren“ legt den Code der Tabelle in die Zwischenablage – direkt in Overleaf einfügen. "
        "Bei fertigen Abbildungen kopiert der Knopf die figure-Umgebung mit Caption und Label (aus der Caption gebildet, nicht aus der Nummer); dafür die Datei aus "
        "<code>abbildungen/</code> nach <code>author/content/</code> in Overleaf hochladen. Querformate (Dashboards und "
        "Abbildungen) werden als PNG um 90° gedreht auf einer Hochformatseite eingebunden. Eingabemasken (Screenshots aus "
        "Planungssoftware) werden softwareneutral als HTML5 nachgebaut; HTML, PNG, PDF und PPTX entstehen aus derselben "
        "Druckfassung, die HTML-Fassung ist bedienbar. Produktscreenshots bleiben nicht im Buch: Masken, Dashboards und "
        "Modellansichten werden softwareneutral nachgebaut, Captions ohne Produktnamen gefasst. „PNG-Link kopieren“ legt "
        f"den Link auf das PNG der Plattform in die Zwischenablage (<code>{PLATTFORM_URL}abbildungen/kapN/….png</code>).</li>"
        "<li>Status und Kommentare unter „Abstimmung“ kommen aus der gemeinsamen Google-Tabelle. Zum Ändern "
        "„Bearbeiten“ wählen und mit Name und Passwort anmelden; Kommentare werden mit Datum und Name angehängt.</li>"
        "<li>„Hinweise aus der Umsetzung“ sind die Anmerkungen beim Neuzeichnen; rote Punkte markieren Stellen, "
        "die eine Entscheidung oder fachliche Prüfung brauchen.</li>"
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
    teile.append(f"<footer>Erzeugt mit werkzeug/inventur.py am {heute}. Hinweise aus der Umsetzung: werkzeug/status.json; "
                 "Abstimmung: Google-Tabelle über werkzeug/abstimmung/Code.gs.</footer>")
    teile.append("<dialog id='lupe'><img alt=''><p><span id='lupe-titel'></span>"
                 "<a id='lupe-link' target='_blank' rel='noopener'>in neuem Tab öffnen</a></p></dialog>")
    teile.append("<dialog id='anmelden'><form><h3>Bearbeiten</h3>"
                 "<p>Name und Passwort werden nur in diesem Browser gespeichert. Der Name steht bei jedem Kommentar.</p>"
                 "<label>Name oder Kürzel<input id='an-name' autocomplete='name' maxlength='40'></label>"
                 "<label>Passwort<input id='an-pw' type='password' autocomplete='current-password'></label>"
                 "<p id='an-meldung' role='status'></p>"
                 "<div class='knoepfe'><button type='button' class='kn' id='an-abbrechen'>Abbrechen</button>"
                 "<button type='submit' class='kn kopie'>Anmelden</button></div></form></dialog>")
    teile.append(f"<script>{js}</script></body></html>")
    return "".join(teile)


def main():
    liste = eintraege()
    for u in UMBENANNT:
        print("umbenannt:", u)
    if UMBENANNT:
        print("Hinweis: Vorschauen wurden mitverschoben; neue Vorschauen mit werkzeug/vorschau.py")
    with open(os.path.join(ROOT, "index.html"), "w", encoding="utf-8") as fh:
        fh.write(seite(liste))
    c = Counter(START.get(x["status"], "offen") for x in liste)
    print("index.html geschrieben:", len(liste), "Einträge – Anfangsstatus:",
          ", ".join(f"{ABSTIMMUNG.get(s, s)} {c[s]}" for s in list(ABSTIMMUNG) + ["hinweis"] if c[s]))
    fehlend = [x["label"] for x in liste if not x["orig_k"]]
    if fehlend:
        print("ohne Originalvorschau:", ", ".join(fehlend))


if __name__ == "__main__":
    main()
