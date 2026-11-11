#!/usr/bin/env python3
"""Mindmap Inhaltsrevision 6. Auflage – Abgleich mit den LaTeX-Quellen.

Liest die Gliederung des Buches aus dem Buch-Repository
(scotandmillfield-spec/-6th-ed.-Planung-Reporting), legt die gepflegte
Bewertung aus mindmap/bewertung.json darüber und schreibt mindmap/daten.js,
die Datendatei der Mindmap (mindmap/index.html).

    python3 werkzeug/mindmap.py --buch ../-6th-ed.-Planung-Reporting

Was wo gepflegt wird:
  * Gliederung, Nummern, Umfang, Abbildungen, Belegjahre, Querverweise und die
    VERALTET-/PRUEFEN-Kommentare kommen bei jedem Lauf frisch aus dem LaTeX.
    Nichts davon von Hand in daten.js ändern – der nächste Lauf überschreibt es.
  * Bewertung, Empfehlung, Entscheidung, Befund, Begründung, frei wählbare
    Metadaten (meta), vorgeschlagene neue Knoten und zusätzliche Kanten stehen
    in mindmap/bewertung.json. Nur diese Datei wird von Hand gepflegt.

Schlüssel eines Knotens ist das LaTeX-Label des Abschnitts (z. B.
sec:fa-tabellen). Abschnitte ohne Label bekommen eine abgeleitete Kennung aus
der Kennung des Elternabschnitts und dem Titel. Wird ein solcher Titel
geändert, findet der Abgleich den Knoten über die Titelähnlichkeit wieder und
meldet das in mindmap/ABGLEICH.md. Dauerhaft robust ist ein \\label.
"""
import argparse, bisect, datetime, difflib, json, os, re, statistics, subprocess, sys, unicodedata

HIER = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HIER)
MAP = os.path.join(REPO, 'mindmap')

EBENE = {'chapter': 0, 'section': 1, 'subsection': 2, 'subsubsection': 3, 'paragraph': 4}
TYP = {0: 'Kapitel', 1: 'Abschnitt', 2: 'Unterabschnitt', 3: 'Unterunterabschnitt', 4: 'Absatz'}

# Signalbegriffe: Hinweise auf veraltete bzw. aktuelle Inhalte (nur als Indiz).
SIGNAL_ALT = ['Hadoop', 'MapReduce', 'Flash', 'Silverlight', 'BlackBerry', 'Windows Phone', 'Windows Mobile',
              'Netbook', 'PDA', 'UMTS', 'GPRS', 'WAP', 'CeBIT', 'Lotus', 'BEx', 'ReportNet', 'PowerPlay', 'Powerplay',
              'Hyperion', 'prevero', 'QlikView', 'Crystal Reports', 'SAP SEM', 'NetWeaver', 'ERP CC',
              'MS Access', 'PostScript', 'EDV', 'PASW', 'Web 2.0', 'Reporting 2.0', 'Expertensystem',
              'Smartpad', 'Siri', 'Alexa', 'OneMind', 'Corona', 'Tacho', 'Thermometer', '3D-Effekt', 'ROLAP', 'MOLAP',
              'HOLAP', 'Basel III', 'Cubeware', 'arcplan', 'Arcplan']
SIGNAL_NEU = ['Cloud', 'SaaS', 'Power BI', 'Fabric', 'Lakehouse', 'Data Lake', 'Data Mesh', 'Generative KI', 'GenAI',
              'LLM', 'Large Language', 'Copilot', 'KI-Agent', 'xP&A', 'ESG', 'CSRD', 'ESRS', 'IBCS', 'SUCCESS',
              'Data Governance', 'DSGVO', 'KI-Verordnung', 'AI Act', 'Data Act', 'Self-Service', 'Predictive',
              'Machine Learning', 'In-Memory', 'SAP Analytics Cloud', 'Analytic Cloud', 'Python', 'Storytelling',
              'Embedded', 'Streaming', 'Monte-Carlo', 'Cyber', 'NIS2', 'Teams']


def slug(s):
    s = unicodedata.normalize('NFKD', s.replace('ß', 'ss'))
    s = ''.join(c for c in s if not unicodedata.combining(c)).lower()
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')[:60]


def code_teil(zeile):
    """Zeile ohne Kommentar (unescapte %)."""
    if zeile.lstrip().startswith('%'):
        return ''
    return re.split(r'(?<!\\)%', zeile)[0]


def lies_buch(buch):
    """Kapiteldateien in Satzreihenfolge auflösen -> Liste (datei, zeilennr, text)."""
    haupt = open(os.path.join(buch, 'author/book.tex'), encoding='utf-8').read()
    teil = haupt.split('\\mainmatter', 1)[-1].split('\\backmatter', 1)[0]
    kapitel = [m.group(2) for z in teil.splitlines()
               for m in [re.search(r'\\(include|input)\{([^}]+)\}', code_teil(z))] if m]

    def expand(pfad):
        p = os.path.join(buch, pfad if pfad.endswith('.tex') else pfad + '.tex')
        aus = []
        with open(p, encoding='utf-8') as f:
            for n, z in enumerate(f, 1):
                m = re.search(r'\\(input|include)\{([^}]+)\}', code_teil(z))
                if m and 'author/content' in m.group(2):
                    aus += expand(m.group(2))
                else:
                    aus.append((pfad.replace('author/content/', '') + ('' if pfad.endswith('.tex') else '.tex'), n, z))
        return aus

    zeilen = []
    for k in kapitel:
        zeilen += expand(k)
    return zeilen


def klammer(s, i):
    tiefe, j = 1, i
    while tiefe and j < len(s):
        if s[j] == '{' and s[j - 1] != '\\':
            tiefe += 1
        elif s[j] == '}' and s[j - 1] != '\\':
            tiefe -= 1
        j += 1
    return s[i:j - 1], j


def bereinige_titel(t):
    t = re.sub(r'\\textbullet\\?\s*', '', t)
    t = re.sub(r'\\(textbf|emph|textit)\{(.*?)\}', r'\2', t)
    t = t.replace('\\\\', ' ').replace('~', ' ').replace('\\,', ' ').replace('\\ ', ' ')
    t = re.sub(r'\\-', '', t)
    return re.sub(r'\s+', ' ', t).strip()


def klartext(s):
    s = re.sub(r'(?m)^\s*%.*$', '', s)
    s = re.sub(r'(?<!\\)%.*', '', s)
    s = re.sub(r'\\index\{[^}]*\}', ' ', s)
    s = re.sub(r'\\footnote\{', ' (', s)
    s = re.sub(r'\\(begin|end)\{[^}]*\}(\[[^\]]*\])?', ' ', s)
    s = re.sub(r'\\(includegraphics|label|ref|vgl|textcites?|cite|abbnr|platzhalter\w*)(\[[^\]]*\])*(\{[^}]*\})*', ' ', s)
    s = re.sub(r'\\[a-zA-Z]+\*?', ' ', s)
    s = re.sub(r'[{}\[\]]', '', s)
    return re.sub(r'\s+', ' ', s).strip()


def kommentarblock(text, marke):
    """VERALTET:/PRUEFEN:-Kommentare samt Folgezeilen einsammeln."""
    aus = []
    for m in re.finditer(r'%\s*' + marke + r':((?:.*\n)(?:[ \t]*%(?![ \t]*[A-Z]{4,}:).*\n)*)', text):
        t = re.sub(r'\n[ \t]*%[ \t]*', ' ', m.group(1))
        aus.append(re.sub(r'\s+', ' ', t).strip())
    return aus


def jahre_der_literatur(buch):
    bib = open(os.path.join(buch, 'author/biblio.bib'), encoding='utf-8').read()
    jahr = {}
    for m in re.finditer(r'@\w+\s*\{\s*([^,\s]+)\s*,(.*?)\n\}', bib, re.S):
        y = re.search(r'\b(?:year|date)\s*=\s*[{"]?\s*(\d{4})', m.group(2))
        if y:
            jahr[m.group(1)] = int(y.group(1))
    return jahr


ZITAT = re.compile(r'\\(?:vgl|textcites?|parencites?|cite|footcite)\*?((?:\s*\[[^\]]*\])*\s*\{[^}]+\}(?:\s*(?:\[[^\]]*\])*\s*\{[^}]+\})*)')


def struktur(buch, einst):
    zeilen = lies_buch(buch)
    text = ''.join(z[2] for z in zeilen)
    starts, o = [], 0
    for z in zeilen:
        starts.append(o)
        o += len(z[2])

    def herkunft(pos):
        return zeilen[bisect.bisect_right(starts, pos) - 1]

    exkurs_in = set(einst.get('exkurs_als_knoten_in', []))
    muster = re.compile(r'\\(chapter|section|subsection|subsubsection|paragraph|exkurs)(\*?)\s*(\[[^\]]*\])?\s*\{')
    koepfe = []
    akt_kapitel = None
    for m in muster.finditer(text):
        zs = text.rfind('\n', 0, m.start()) + 1
        if '%' in text[zs:m.start()]:
            continue
        if text[m.start() - 1:m.start()] == '\\':
            continue
        titel_roh, ende = klammer(text, m.end())
        art = m.group(1)
        lab = re.match(r'\s*\\label\{([^}]+)\}', text[ende:ende + 300])
        if art == 'chapter':
            akt_kapitel = lab.group(1) if lab else None
        if art == 'exkurs':
            if akt_kapitel not in exkurs_in:
                continue
            ebene = 2 if '\\textbullet' in titel_roh else 1
        else:
            ebene = EBENE[art]
        if m.group(2):  # Sternform: nicht im Inhaltsverzeichnis
            continue
        q = herkunft(m.start())
        koepfe.append(dict(art=art, ebene=ebene, titel=bereinige_titel(titel_roh), start=m.start(), rumpf=ende,
                           label=lab.group(1) if lab else None, datei=q[0], zeile=q[1]))

    # Kommentarblock unmittelbar über einer Überschrift gehört zu dieser
    for k in koepfe:
        zs = text.rfind('\n', 0, k['start'])
        anfang = k['start']
        while zs > 0:
            vor = text.rfind('\n', 0, zs) + 1
            z = text[vor:zs]
            if z.strip() == '' or z.lstrip().startswith('%'):
                anfang = vor
                zs = vor - 1
            else:
                break
        k['vorspann'] = anfang

    # Nummern wie LaTeX (secnumdepth 3: Absätze und Exkurse ohne Nummer)
    zaehler = [0] * 5
    for k in koepfe:
        if k['art'] in ('paragraph', 'exkurs'):
            k['nr'] = None
            continue
        e = k['ebene']
        zaehler[e] += 1
        for j in range(e + 1, 5):
            zaehler[j] = 0
        k['nr'] = '.'.join(str(c) for c in zaehler[:e + 1])

    # Eltern und Kennungen
    stapel = []
    for k in koepfe:
        while stapel and stapel[-1]['ebene'] >= k['ebene']:
            stapel.pop()
        k['eltern'] = stapel[-1] if stapel else None
        stapel.append(k)
    for k in koepfe:
        k['id'] = k['label'] or ((k['eltern']['id'] if k['eltern'] else 'buch') + '/' + slug(k['titel']))

    jahr = jahre_der_literatur(buch)
    nr_zu_id = {k['nr']: k['id'] for k in koepfe if k['nr']}
    label_zu_id = {k['label']: k['id'] for k in koepfe if k['label']}
    verweise = {}

    for i, k in enumerate(koepfe):
        eigen_ende = koepfe[i + 1]['vorspann'] if i + 1 < len(koepfe) else len(text)
        gesamt_ende = len(text)
        for k2 in koepfe[i + 1:]:
            if k2['ebene'] <= k['ebene']:
                gesamt_ende = k2['vorspann']
                break
        eigen = text[k['vorspann']:eigen_ende]
        gesamt = text[k['vorspann']:gesamt_ende]
        schluessel = []
        for m in ZITAT.finditer(gesamt):
            for g in re.findall(r'\{([^}]+)\}', m.group(1)):
                schluessel += [s.strip() for s in g.split(',')]
        jahre = [jahr[s] for s in schluessel if s in jahr]
        kt = klartext(gesamt)
        woerter = len(kt.split())
        abb = len(re.findall(r'\\begin\{(?:figure|sidewaysfigure)', gesamt))
        k['kennzahlen'] = dict(
            woerter=woerter,
            abbildungen=abb,
            platzhalter=len(re.findall(r'\\platzhalter', gesamt)),
            tabellen=len(re.findall(r'\\begin\{table', gesamt)),
            seiten=round(woerter / 300 + abb * 0.6, 1),
            belege=len(schluessel),
            lit_min=min(jahre) if jahre else None,
            lit_median=int(statistics.median(jahre)) if jahre else None,
            lit_max=max(jahre) if jahre else None,
            anteil_vor_2015=round(sum(1 for y in jahre if y < 2015) / len(jahre), 2) if jahre else None)
        k['abbildungen'] = [klartext(c)[:160] for c in
                            re.findall(r'\\caption(?:\[[^\]]*\])?\{((?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*)\}', gesamt)]
        k['veraltet'] = kommentarblock(eigen, 'VERALTET')
        k['pruefen'] = kommentarblock(eigen, 'PRUEFEN')
        k['signal_alt'] = sorted({w for w in SIGNAL_ALT if re.search(r'(?<![\w-])' + re.escape(w) + r'(?![\w])', kt)})
        k['signal_neu'] = sorted({w for w in SIGNAL_NEU if re.search(r'(?<![\w-])' + re.escape(w) + r'(?![\w])', kt)})
        # Querverweise aus dem eigenen Text
        for m in re.finditer(r'\\(?:ref|vref|autoref)\{((?:sec|ch|cha):[^}]+)\}', code_only(eigen)):
            ziel = label_zu_id.get(m.group(1))
            if ziel and ziel != k['id']:
                verweise[(k['id'], ziel)] = verweise.get((k['id'], ziel), 0) + 1
        for m in re.finditer(r'\\vw(Abschn|Kap)\{([\d.]+)\}', code_only(eigen)):
            ziel = nr_zu_id.get(m.group(2).rstrip('.'))
            if ziel and ziel != k['id']:
                verweise[(k['id'], ziel)] = verweise.get((k['id'], ziel), 0) + 1
    return koepfe, verweise


def code_only(s):
    return '\n'.join(code_teil(z) for z in s.split('\n'))


def git_stand(buch):
    try:
        h = subprocess.run(['git', '-C', buch, 'rev-parse', '--short', 'HEAD'], capture_output=True, text=True).stdout.strip()
        d = subprocess.run(['git', '-C', buch, 'log', '-1', '--format=%cs'], capture_output=True, text=True).stdout.strip()
        return h, d
    except Exception:
        return '', ''


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--buch', default=os.environ.get('BUCH_REPO', os.path.join(os.path.dirname(REPO), '-6th-ed.-Planung-Reporting')),
                    help='Pfad zum geklonten Buch-Repository')
    args = ap.parse_args()
    if not os.path.exists(os.path.join(args.buch, 'author/book.tex')):
        alt = os.path.join(os.path.dirname(REPO), '-6th-ed.-planung-reporting')
        if os.path.exists(os.path.join(alt, 'author/book.tex')):
            args.buch = alt
        else:
            sys.exit(f'Buch-Repository nicht gefunden: {args.buch}  (--buch PFAD angeben)')

    bew = json.load(open(os.path.join(MAP, 'bewertung.json'), encoding='utf-8'))
    einst = bew.get('einstellungen', {})
    koepfe, verweise = struktur(args.buch, einst)

    # Absätze unter ausgewählten Eltern ausblenden (z. B. gleichförmige Kriterienlisten)
    ausblenden = set(einst.get('absaetze_ausblenden_unter', []))
    koepfe = [k for k in koepfe if not (k['art'] == 'paragraph' and k['eltern'] and k['eltern']['id'] in ausblenden)]
    ids = {k['id'] for k in koepfe}

    bewertet = bew.get('knoten', {})
    bericht = []
    # Titeländerung bei Knoten ohne Label: über Ähnlichkeit zuordnen
    verwaist = [i for i in bewertet if i not in ids]
    neu_ohne = [k for k in koepfe if k['id'] not in bewertet]
    for vid in list(verwaist):
        eltern_teil = vid.rsplit('/', 1)[0] if '/' in vid else None
        kandidaten = [k for k in neu_ohne if '/' in k['id'] and k['id'].rsplit('/', 1)[0] == eltern_teil]
        best, quote = None, 0
        for k in kandidaten:
            q = difflib.SequenceMatcher(None, vid.rsplit('/', 1)[1], slug(k['titel'])).ratio()
            if q > quote:
                best, quote = k, q
        if best and quote >= 0.75:
            bewertet[best['id']] = bewertet.pop(vid)
            verwaist.remove(vid)
            neu_ohne.remove(best)
            bericht.append(f'- Zuordnung über Titelähnlichkeit ({quote:.0%}): `{vid}` → `{best["id"]}` – Kennung in bewertung.json nachziehen oder \\label setzen')

    vorschlaege = bew.get('vorschlaege', [])
    umgesetzt = {v['label']: v for v in vorschlaege if v.get('label') in ids}

    knoten = []
    nach_id = {}
    for reihenfolge, k in enumerate(koepfe):
        b = dict(bewertet.get(k['id'], {}))
        if k['id'] in umgesetzt:
            v = umgesetzt[k['id']]
            b = {**{x: v[x] for x in v if x not in ('id', 'parent', 'nach', 'label', 'titel')}, **b}
            b.setdefault('meta', {})['aus_vorschlag'] = v['id']
            if b.get('bewertung') == 'vorschlag':
                b['bewertung'] = 'neu'
        n = dict(id=k['id'], parent=k['eltern']['id'] if k['eltern'] else 'buch', nr=k['nr'], titel=k['titel'],
                 ebene=k['ebene'] + 1, typ=TYP.get(k['ebene'], 'Absatz') if k['art'] != 'exkurs' else 'Stichpunkt',
                 reihenfolge=reihenfolge, im_manuskript=True,
                 quelle=dict(datei=k['datei'], zeile=k['zeile'], label=k['label']),
                 kennzahlen=k['kennzahlen'], abbildungen=k['abbildungen'],
                 hinweise=dict(veraltet=k['veraltet'], pruefen=k['pruefen']),
                 signale=dict(alt=k['signal_alt'], neu=k['signal_neu']))
        for f in ('bewertung', 'empfehlung', 'entscheidung', 'befund', 'begruendung', 'notiz', 'meta'):
            if f in b:
                n[f] = b[f]
        knoten.append(n)
        nach_id[n['id']] = n

    # Vorschläge (noch nicht im Manuskript)
    for v in vorschlaege:
        if v.get('label') in ids:
            continue
        n = dict(id=v['id'], parent=v.get('parent', 'buch'), nr=v.get('nr'), titel=v['titel'],
                 ebene=(nach_id[v['parent']]['ebene'] + 1) if v.get('parent') in nach_id else 1,
                 typ='Vorschlag', im_manuskript=False, quelle=None, kennzahlen=v.get('kennzahlen', {}),
                 bewertung='vorschlag', nach=v.get('nach'))
        for f in ('empfehlung', 'entscheidung', 'befund', 'begruendung', 'notiz', 'meta', 'label'):
            if f in v:
                n[f] = v[f]
        knoten.append(n)
        nach_id[n['id']] = n

    # Reihenfolge der Vorschläge: hinter dem genannten Geschwisterknoten, sonst ans Ende
    reih = {n['id']: n.get('reihenfolge', 10 ** 6) for n in knoten}
    for n in knoten:
        if not n['im_manuskript']:
            reih[n['id']] = reih.get(n.get('nach'), 10 ** 6) + 0.5
            n['reihenfolge'] = reih[n['id']]
    knoten.sort(key=lambda n: (n['ebene'], n['reihenfolge']))

    # Bewertungen ohne Knoten im Manuskript behalten (z. B. gestrichene Abschnitte)
    for vid in verwaist:
        b = bewertet[vid]
        eltern = b.get('parent_alt') or (vid.rsplit('/', 1)[0] if '/' in vid else 'buch')
        if eltern not in nach_id:
            eltern = 'buch'
        n = dict(id=vid, parent=eltern, nr=b.get('nr_alt'), titel=b.get('titel_alt', vid), ebene=2, typ='Entfallen',
                 im_manuskript=False, quelle=None, kennzahlen={}, reihenfolge=10 ** 6)
        for f in ('bewertung', 'empfehlung', 'entscheidung', 'befund', 'begruendung', 'notiz', 'meta'):
            if f in b:
                n[f] = b[f]
        knoten.append(n)
        bericht.append(f'- Bewertung ohne Abschnitt im Manuskript: `{vid}` (als „nicht mehr im Manuskript“ geführt)')

    # Vergleich mit dem letzten Lauf (mindmap/gliederung.json)
    snap_pfad = os.path.join(MAP, 'gliederung.json')
    vorher = {}
    if os.path.exists(snap_pfad):
        vorher = {g['id']: g for g in json.load(open(snap_pfad, encoding='utf-8'))}
    jetzt = [dict(id=k['id'], nr=k['nr'], titel=k['titel']) for k in koepfe]
    if vorher:
        for g in jetzt:
            alt = vorher.get(g['id'])
            if not alt:
                bericht.append(f'- Neu im Manuskript seit dem letzten Abgleich: {g["nr"] or "–"} {g["titel"]} (`{g["id"]}`)')
            else:
                if alt['nr'] != g['nr']:
                    bericht.append(f'- Neu nummeriert: {alt["nr"]} → {g["nr"]} {g["titel"]}')
                if alt['titel'] != g['titel']:
                    bericht.append(f'- Titel geändert ({g["nr"] or "–"}): „{alt["titel"]}“ → „{g["titel"]}“')
        for gid, alt in vorher.items():
            if gid not in ids:
                bericht.append(f'- Seit dem letzten Abgleich nicht mehr im Manuskript: {alt["nr"] or "–"} {alt["titel"]} (`{gid}`)')
    json.dump(jetzt, open(snap_pfad, 'w', encoding='utf-8'), ensure_ascii=False, indent=0)

    # Knoten ohne eigene und ohne geerbte Bewertung
    eltern_von = {k['id']: (k['eltern']['id'] if k['eltern'] else None) for k in koepfe}
    def hat_bewertung(i):
        while i:
            if 'bewertung' in bewertet.get(i, {}):
                return True
            i = eltern_von.get(i)
        return False
    ungeprueft = [k for k in koepfe if not hat_bewertung(k['id'])]
    for k in ungeprueft:
        bericht.append(f'- Ungeprüft (weder eigene noch geerbte Bewertung): {k["nr"] or "–"} {k["titel"]} (`{k["id"]}`)')

    # Kanten: Struktur, Querverweise aus dem Text, gepflegte Kanten
    kanten_meta = {(e['von'], e['nach'], e.get('typ', 'verwandt')): e for e in bew.get('kanten', [])}
    kanten = []
    alle = {n['id'] for n in knoten} | {'buch'}
    for n in knoten:
        e = kanten_meta.pop((n['parent'], n['id'], 'struktur'), {})
        kanten.append(dict(id=f"s:{n['id']}", von=n['parent'], nach=n['id'], typ='struktur', meta=e.get('meta', {})))
    for (von, nach), anz in sorted(verweise.items()):
        if von in alle and nach in alle:
            e = kanten_meta.pop((von, nach, 'verweis'), {})
            kanten.append(dict(id=f'v:{von}>{nach}', von=von, nach=nach, typ='verweis',
                               meta={'anzahl': anz, 'quelle': 'Querverweis im LaTeX', **e.get('meta', {})}))
    for (von, nach, typ), e in kanten_meta.items():
        if von in alle and nach in alle:
            kanten.append(dict(id=e.get('id', f'{typ[0]}:{von}>{nach}'), von=von, nach=nach, typ=typ,
                               beschriftung=e.get('beschriftung'), meta=e.get('meta', {})))
        else:
            bericht.append(f'- Kante mit unbekanntem Endpunkt übersprungen: {von} → {nach} ({typ})')

    hash_, datum = git_stand(args.buch)
    daten = dict(
        meta=dict(titel=bew.get('titel', 'Inhaltsrevision 6. Auflage'), untertitel=bew.get('untertitel', ''),
                  stand_bewertung=bew.get('stand', ''), erzeugt=datetime.datetime.now().strftime('%Y-%m-%d %H:%M'),
                  buch_commit=hash_, buch_datum=datum, repo=bew.get('buch_repo', ''),
                  buchtitel=bew.get('buchtitel', 'Planung und Reporting im BI-gestützten Controlling'),
                  skalen=bew.get('skalen', {}),
                  # Rohfassung der Pflegedatei: daraus baut die Seite beim Export die neue bewertung.json
                  bewertung_roh=bew),
        knoten=knoten, kanten=kanten)
    with open(os.path.join(MAP, 'daten.js'), 'w', encoding='utf-8') as f:
        f.write('/* Erzeugt von werkzeug/mindmap.py – nicht von Hand bearbeiten. Pflege: mindmap/bewertung.json */\n')
        # eine Zeile je Knoten bzw. Kante, damit Git-Diffs lesbar bleiben
        dump = lambda o: json.dumps(o, ensure_ascii=False, separators=(',', ':'))
        f.write('window.MINDMAP = {"meta":' + dump(daten['meta']) + ',\n"knoten":[\n')
        f.write(',\n'.join(dump(n) for n in knoten))
        f.write('\n],\n"kanten":[\n')
        f.write(',\n'.join(dump(e) for e in kanten))
        f.write('\n]};\n')

    ohne = [n for n in knoten if n['im_manuskript'] and 'bewertung' not in n]
    with open(os.path.join(MAP, 'ABGLEICH.md'), 'w', encoding='utf-8') as f:
        f.write(f'# Abgleich Mindmap ↔ Manuskript\n\nLauf {daten["meta"]["erzeugt"]}, Buch-Commit `{hash_}` ({datum}).\n\n')
        f.write(f'| | |\n|---|---:|\n| Knoten aus dem Manuskript | {sum(1 for n in knoten if n["im_manuskript"])} |\n')
        f.write(f'| davon mit eigener Bewertung | {sum(1 for n in knoten if n["im_manuskript"] and "bewertung" in n)} |\n')
        f.write(f'| davon Bewertung vom Elternabschnitt geerbt | {len(ohne) - len(ungeprueft)} |\n')
        f.write(f'| ungeprüft | {len(ungeprueft)} |\n')
        f.write(f'| Vorschläge (noch nicht geschrieben) | {sum(1 for n in knoten if n["typ"] == "Vorschlag")} |\n')
        f.write(f'| Querverweise | {sum(1 for e in kanten if e["typ"] == "verweis")} |\n')
        f.write(f'| gepflegte Kanten | {sum(1 for e in kanten if e["typ"] not in ("struktur", "verweis"))} |\n\n')
        f.write('## Meldungen\n\n' + ('\n'.join(bericht) if bericht else 'Keine – Manuskript und Bewertung passen zusammen.') + '\n')
    print(f'daten.js: {len(knoten)} Knoten, {len(kanten)} Kanten, Buch-Commit {hash_}')
    for b in bericht:
        print(b)


if __name__ == '__main__':
    main()
