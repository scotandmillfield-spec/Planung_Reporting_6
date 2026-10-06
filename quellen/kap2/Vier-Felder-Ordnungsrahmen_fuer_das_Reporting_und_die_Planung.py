"""Abb. 2.7 – Vier-Felder-Ordnungsrahmen für das Reporting und die Planung."""
# Muster: Raster aus Karten mit Kopfleiste und Aufzählungen (2. Ebene, Erläuterungen in 6 pt).
# Bauen: python3 scripts/build_figure.py beispiele/abb_2-7.py --out <Zielordner>
STEM = "Vier-Felder-Ordnungsrahmen_fuer_das_Reporting_und_die_Planung"
from bookfig import Fig, P, THEMES

NB = chr(0xA0)  # geschütztes Leerzeichen
W = 110
GAP = 2.2
HEAD = 5.2
B, S = 7.0, 6.0   # Schriftgrade Aufzählung / Erläuterung


def items(theme):
    m = theme.text_muted
    def b(t, sb=1.1): return P(t, size=B, bullet="•", space_before=sb)
    def b2(t): return P(t, size=B, bullet="–", level=1, space_before=0.6)
    def note(t, level=0): return P(t, size=S, cont=True, level=level, color=m, space_before=0.3)
    return {
        "Fachlicher Inhalt": [
            b("Bezug zur Unternehmensstrategie", 0),
            b("Wertschöpfungstreibende Faktoren des Geschäftsmodells"),
            b("Planungs-/Berichtsinhalte"),
            note("(Struktur und Navigation, Berichts- und Planungsobjekte)"),
            b("Planungsformular-/Berichtsgestaltung"),
            note("(Berichtsarten, Grundformen, Filter-/Selektionsmöglichkeiten, Layout, "
                 "Besonderheiten der Planungsformulare)"),
        ],
        "IT-Unterstützung": [
            b("Hardware", 0),
            b("Software"),
            b2("ERP-gestützte Systeme"),
            b2("Tabellenkalkulationsprogramme"),
            b2("Relationale Datenbank-gestützte Systeme"),
            b2("Data-Warehouse- und BI-gestützte Systeme"),
            note("(Anforderungskriterien: Datenanbindung, Datenmodellierung, -harmonisierung "
                 "und -qualität, Analyse- und Planungsfunktionalität, Flexibilität und "
                 "Gestaltungsmöglichkeiten, Geschwindigkeit etc.)", level=1),
            b("Mobile BI"),
            b("KI-gestützte und Big-Data-Analytics"),
            b("RPA und Chatbots"),
        ],
        "Organisation": [
            b("Unternehmensverbindungen", 0),
            b("Aufbauorganisation"),
            b("Führungsstil"),
            b("Unternehmensgröße"),
            b("Adressaten/Empfänger der Planung/Berichte"),
            b("Sender/Ersteller/Koordinatoren der Planung/Berichte"),
            note("(zentrale und dezentrale Verantwortlichkeiten)"),
        ],
        "Prozesse": [
            b("Einführungsprozesse", 0),
            note("(Rahmenbedingungen, Informationsbedarfs- und Ist-Analyse, Best-Practice-Abgleich, "
                 "Blueprint, Sollkonzept, DV-Auswahl, IT-Konzept und Implementierung, Coaching/Schulung)"),
            b("Zyklische Durchführungsprozesse"),
            b2("Zyklischer Planungsprozess"),
            note(f"(Vorbereitung (u.{NB}a. Datenaufbereitung), Durchführung, Abstimmung und Genehmigung)", level=1),
            b2("Zyklischer Reportingprozess"),
            note("(Informationsbeschaffung, -aufbereitung, Berichtserstellung, Analysevorbereitung, "
                 "Berichtsbereitstellung, Informationsanalyse und Steuerung)", level=1),
            b(f"Qualitätssicherungsprozesse (u.{NB}a.{NB}Support)"),
        ],
    }


def build(theme):
    cw = (W - GAP) / 2
    tmp = Fig(W, 30, theme)
    it = items(theme)
    ins = (1.6, 1.2)
    hts = {k: tmp.measure(v, cw - 0.4, ins) + HEAD + 0.6 for k, v in it.items()}
    r1 = max(hts["Fachlicher Inhalt"], hts["IT-Unterstützung"])
    r2 = max(hts["Organisation"], hts["Prozesse"])
    H = round(r1 + GAP + r2 + 0.4, 1)
    f = Fig(W, H, theme, "Vier-Felder-Ordnungsrahmen_fuer_das_Reporting_und_die_Planung")
    pos = {"Fachlicher Inhalt": (0.2, 0.2, r1), "IT-Unterstützung": (0.2 + cw + GAP, 0.2, r1),
           "Organisation": (0.2, 0.2 + r1 + GAP, r2), "Prozesse": (0.2 + cw + GAP, 0.2 + r1 + GAP, r2)}
    for k, (x, y, h) in pos.items():
        f.card(x, y, cw - 0.4, h, k, it[k], head_h=HEAD)
    return f
