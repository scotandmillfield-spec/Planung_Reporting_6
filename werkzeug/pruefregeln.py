"""Caption-Prüfung für die Abbildungsinventur.

pruefe(nr, art, caption) -> (vorschlag, kommentare)
  nr       Abbildungsnummer ("3.43") oder "Tab. 4.8"
  art      D = Diagramm, V = Dashboard/Visual, S = Screenshot, T = Tabelle
  caption  Bildunterschrift der 5. Auflage (aus den Sprechernotizen)

Die Regeln sind bewusst einfach und nachvollziehbar: allgemeine Schreibregeln, Quellenformel
für neu gezeichnete Abbildungen und eine Liste gezielter Korrekturen je Abbildung.
"""
import re

UML = {"¨u": "ü", "¨a": "ä", "¨o": "ö", "¨U": "Ü", "¨A": "Ä", "¨O": "Ö"}

# (Muster, Ersatz, Kommentar) – gelten für alle Captions
SCHREIBREGELN = [
    (r"z\.B\.", "z. B.", "„z.B.“ → „z. B.“"),
    (r"u\.a\.", "u. a.", "„u.a.“ → „u. a.“"),
    (r"S\.(\d)", r"S. \1", "Leerzeichen nach „S.“"),
    (r"\bPowerBI\b", "Power BI", "Produktname „Power BI“ (mit Leerzeichen)"),
    (r"MS Projekt\b", "MS Project", "Produktname „MS Project“"),
    (r"\bBex-Analyser\b", "BEx Analyzer", "Produktname „BEx Analyzer“"),
    (r"\bAnalyser\b", "Analyzer", "Produktname „Analyzer“ (SAP schreibt amerikanisch)"),
    (r"Qlik[ -]View", "QlikView", "Produktname „QlikView“ einheitlich"),
    (r"Dash-Board", "Dashboard", "„Dash-Board“ → „Dashboard“"),
    (r"SAP Analytic Cloud", "SAP Analytics Cloud", "Produktname „SAP Analytics Cloud“"),
    (r"\bH\. G\. Kemper\b", "Kemper", "Kurzbeleg ohne Initialen (wie bei allen anderen Quellen)"),
    (r" - ", " – ", "Gedankenstrich statt Bindestrich"),
    (r"  +", " ", "doppeltes Leerzeichen"),
]

# Quellenformeln, die bei neu gezeichneten Abbildungen (D, V) zu „In Anlehnung an“ werden
QUELLENFORMELN = [
    r"Quelle a: ", r"Quelle: ", r"Entnommen aus: ", r"Entnommen aus ", r"Leicht verändert zu ",
    r"In Anlehnung zur Quelle: ", r"Leicht abgeändert im Vgl\. zu: ", r"Von Kemper modifiziert übernommen aus ",
    r"modifiziert übernommen aus ", r"Eigene Darstellung in Anlehnung an ",
]

# Gezielte Korrekturen je Nummer: (alt, neu, Kommentar)
GEZIELT = {
    "2.1": [(", S. 10", "", "„S. 10“ in der Notiz ist die Seitenzahl der 5. Auflage – nicht Teil der Caption")],
    "2.2": [(", S. 11", "", "„S. 11“ in der Notiz ist die Seitenzahl der 5. Auflage – nicht Teil der Caption")],
    "3.1": [("–steuerung", "-steuerung", "Ergänzungsstrich ist ein Bindestrich: „Unternehmensplanung und -steuerung“")],
    "3.39": [("Drill Across", "Drill-Across", "Schreibweise wie Drill-Down und Drill-Through")],
    "3.47": [("(In Anlehnung an PPM Execution 2017, Quelle b: react 2017)",
              "(In Anlehnung an a) PPM Execution 2017, b) react 2017)", None)],
    "3.57": [("(In Anlehnung an XLSTAT 2017, Quelle b: Sullivan und LaMorte 2017)",
              "(In Anlehnung an a) XLSTAT 2017, b) Sullivan und LaMorte 2017)", None)],
    "3.64": [("Berichtselemente u. a. entnommen aus", "Berichtselemente u. a. in Anlehnung an",
              "Neu gezeichnet – „in Anlehnung an“ statt „entnommen aus“")],
    "5.35": [(None, "BI-Analysespektrum (In Anlehnung an Lanquillon und Mallow 2015, S. 56, nach Eckerson 2007)",
              "Notiz enthält zwei Caption-Fassungen und Vollzitate – auf Kurzbeleg gekürzt, Vollzitate ins Literaturverzeichnis")],
    "5.58": [(None, "SAP BusinessObjects Mobile Architecture (In Anlehnung an SAP AG 2016, S. 5)",
              "Quellenangabe ohne Klammer und als Vollzitat – Kurzbeleg; englischer Titel ggf. eindeutschen")],
    "3.69": [("(Das Beispiel wurde entnommen von den Internetpräsentationsseiten der Bissantz & Company GmbH 2011)",
              "(In Anlehnung an Bissantz & Company GmbH 2011)", "Quellenhinweis auf Kurzbeleg gekürzt")],
    "3.77": [("nacher", "nachher", "Tippfehler „nacher“")],
    "3.180": [("Insightsoftware", "insightsoftware", "Firmenname wird kleingeschrieben")],
    "3.193": [("(Quelle: Geißner, W. 2016. Bandbreitenplanung, Planungssicherheit und Monte-Carlo-Simulation mehrerer "
               "Planjahre. In Controller Magazin. Juli/August 2016. S. 16 –23",
               "(Quelle: Geißner 2016, S. 16–23)",
               "Vollzitat in der Caption und schließende Klammer fehlt – Kurzbeleg, Vollzitat ins Literaturverzeichnis")],
    "3.195": [("R-Studio (Quelle: Oehler, K. 2019. Advanced Analytics fur Controller Einsetzbare Anwendungen zum "
               "Nachbauen mit R. S. 111.)", "RStudio (Quelle: Oehler 2019, S. 111)",
               "„fur“ → „für“, Produktname „RStudio“, Vollzitat durch Kurzbeleg ersetzt")],
    "4.19": [("(Quelle: SAP BW-Bericht mit dem BEx Analyzer (MS Excel-Integration) basierend auf Daten eines "
              "SAP-IDES-Systems. Entnommen aus Schön 2004, S. 331)",
              "(Daten eines SAP-IDES-Systems; Quelle: Schön 2004, S. 331)",
              "Quellenangabe wiederholt den Titel – gekürzt")],
    "5.2": [("(In Anlehnung an Gluchowski 2001, S. 7 und", "(In Anlehnung an Gluchowski 2001, S. 7, und", None)],
    "5.5": [(". Den BI-Einsatz im Controlling insbesondere im Reporting und in der Planung heben u. a. Seufert und "
             "Oehler hervor, vgl. Seufert und Oehler 2009)", ")",
             "Fließtext-Satz in der Caption (Seufert und Oehler 2009) – in den Text oder eine Fußnote verschieben")],
    "5.6": [("Referanzarchitektur", "Referenzarchitektur", "Tippfehler „Referanzarchitektur“")],
    "5.8": [("Hansen (2019, S. 9))", "Hansen 2019, S. 9)", "Klammer in der Klammer aufgelöst")],
    "5.15": [("Ergebnis manuelle Korrektur eines Defekts dritten Grades",
              "Ergebnis der manuellen Korrektur eines Defekts der Defektklasse 3",
              "Begriff wie in Abb. 5.11–5.14 („Defektklasse 3“ statt „Defekt dritten Grades“)")],
    "5.20": [("Analyse gemäß eines Stern-Schemas in Power BI", "Analyse gemäß einem Star-Schema in Power BI",
              "„gemäß“ mit Dativ; Begriff einheitlich „Star-Schema“ (5.19, 5.77) statt „Stern-Schema“/„Sternschema“")],
    "5.28": [("Erlösschemata", "Erlösschema", "Singular: „Stufenorientiertes Erlösschema“")],
    "5.33": [(chr(0x28E) + "-Architektur", "λ-Architektur (Lambda-Architektur)",
              "Falsches Zeichen: statt λ (Lambda) steht ʎ (gedrehtes y, U+028E)")],
    "5.39": [("(z. B. Select-Anweisung", "(z. B. SELECT-Anweisung)", "Schließende Klammer fehlt; SQL-Schlüsselwort in Großbuchstaben")],
    "5.52": [("; Quelle SAP Fiori (2017a)", " (Quelle: SAP Fiori 2017a)", "Quellenangabe in der üblichen Form")],
    "5.53": [("; Quelle SAP Fiori (2017a)", " (Quelle: SAP Fiori 2017a)", "Quellenangabe in der üblichen Form")],
    "5.55": [("Mobile BI and Mobil Reporting and Planning", "Mobile BI sowie mobiles Reporting und mobile Planung",
              "Englisch-deutsche Mischform und Tippfehler „Mobil“")],
    "5.59": [("Smarphone", "Smartphone", "Tippfehler „Smarphone“"),
             (" Vgl. Cubeware, URL: http://de.cubeware.com/produkte/c8-mobile/galerie-mobile-bi-android.html "
              "[Zugriff am 23.03.2015]", "", "URL von 2015 in der Notiz – Link vermutlich nicht mehr erreichbar")],
    "5.60": [(" Vgl. Cubeware, URL: http://de.cubeware.com/produkte/c8-mobile/galerie-mobile-bi-ios.html "
              "[Zugriff am 23.03.2015]", "", "URL von 2015 in der Notiz – Link vermutlich nicht mehr erreichbar")],
    "5.61": [("Einfache Exemplarische", "Einfache exemplarische", "Adjektiv klein")],
    "5.62": [("Sternschema", "Star-Schema", "Begriff einheitlich „Star-Schema“")],
    "5.65": [("CRISP DM Modell – Prozessschritte", "CRISP-DM-Modell – Prozessschritte", "Durchkopplung „CRISP-DM-Modell“")],
    "5.68": [("RPA-Lösun", "RPA-Lösungen", "Caption in der Notiz abgeschnitten („Lösun“)")],
    "5.71": [("Bandbreitenplanung Ergebnisse", "Bandbreitenplanung – Ergebnisse", "Form wie Abb. 5.70")],
    "5.77": [("mit dem Microsoft Visual Studio", "mit Microsoft Visual Studio", None)],
}

# Software in der Caption, die in der neu gezeichneten Fassung nicht mehr zu sehen ist
WERKZEUG_IN_CAPTION = re.compile(r"\((?:Beispiel )?(MS Excel|Cubeware)\)|mit (MS Excel)")


def _umlaute(s):
    for a, b in UML.items():
        s = s.replace(a, b)
    return s


def caption_aus_notiz(notiz):
    """Sprechernotiz -> Caption der 5. Auflage (ohne Nummer, Zeilenumbrüche zusammengeführt)."""
    t = notiz.strip()
    t = re.sub(r"^(Doppelte\s+)?(Abbildung|Abb\.|Tab\.)\s*[0-9]+\.[0-9]+\s*", "", t)
    t = re.sub(r"\s*\n\s*", " ", t)
    t = t.replace("\t", " ").replace("\x0b", " ")
    return t.strip()


def pruefe(nr, art, caption):
    kom = []
    v = caption
    u = _umlaute(v)
    if u != v:
        kom.append("Zerlegte Umlaute aus PDF-Kopie („¨u“ → „ü“)")
        v = u
    for muster, ersatz, text in SCHREIBREGELN:
        neu = re.sub(muster, ersatz, v)
        if neu != v:
            kom.append(text)
            v = neu
    # Satzzeichen: kein Punkt vor der Quellenklammer, kein Punkt am Ende
    neu = re.sub(r"\.\s+\(", " (", v)
    neu = re.sub(r"(?<!ff)\.$", "", neu)
    if neu != v:
        kom.append("Punkt vor der Quellenklammer bzw. am Ende entfernt (einheitliche Form)")
        v = neu
    # eigene Darstellung
    if re.search(r"[Ee]igene Darstellung", v):
        v2 = re.sub(r"\s*\(eigene Darstellung\)", "", v)
        v2 = v2.replace("(Eigene Darstellung. Vgl. auch ", "(Vgl. ")
        v2 = v2.replace("(Eigene Darstellung in Anlehnung an ", "(In Anlehnung an ")
        if v2 != v:
            kom.append("„eigene Darstellung“ nur in einzelnen Captions – für eigene Abbildungen entfällt die Angabe")
            v = v2
    # Quellenformel bei Neuzeichnung
    if art in ("D", "V"):
        v2 = v
        for q in QUELLENFORMELN:
            v2 = re.sub(r"\(" + q, "(In Anlehnung an ", v2)
        if v2 != v:
            kom.append("Neu gezeichnet – Quellenformel „In Anlehnung an“ statt „Quelle“/„Entnommen aus“")
            v = v2
        m = WERKZEUG_IN_CAPTION.search(v)
        if m:
            kom.append(f"Caption nennt {m.group(1) or m.group(2)} – die Neuzeichnung ist werkzeugneutral, Caption anpassen")
    for alt, neu, text in GEZIELT.get(nr, []):
        if alt is None:  # Caption vollständig ersetzt – Einzelbefunde davor sind hinfällig
            v = neu
            kom = [text] if text else []
        elif alt in v:
            v = v.replace(alt, neu)
            if text:
                kom.append(text)
    if art == "S":
        jahre = [int(j) for j in re.findall(r"\b(19[89]\d|20[0-2]\d)\b", caption)]
        if jahre and max(jahre) <= 2015:
            kom.append(f"Screenshot-Quelle von {max(jahre)} – Aktualität der Software prüfen")
    if len(v) > 160:
        kom.append(f"Sehr lange Caption ({len(v)} Zeichen) – Erläuterungen in den Text verschieben")
    return v, kom
