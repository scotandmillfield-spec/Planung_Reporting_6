"""Daten für Abb. 3.12 „Reporting- und Planungskalender“.

Kalender der Berichts- und Planungsprozesse eines Jahres (2027) mit der Budgetierung 2028, Stichtag 30.09.2027.
Aufbau und Abfolge folgen dem Original (5. Auflage, Jahr 2010). Revision DS 07.10.2026: alle Termine um ein Jahr
verschoben (52 Wochen, damit sie Arbeitstage bleiben); in der Tabelle unten stehen noch die Tagesangaben des Vorjahres.
Personennamen des Originals sind durch Rollen ersetzt, Softwarebezüge (SAP, CO-Aufträge, prevero) neutralisiert.
Die Absatzplanung (13.09.–24.09.2027) stimmt mit dem Planungsbrief in Abb. 3.7 überein.

Je Knoten: id, übergeordneter Knoten, Name, Verantwortlich, Plan-Beginn, Plan-Ende, Ist-Ende (None = nicht erledigt),
Serie (nur Gruppen: wiederkehrende Termine, die zugeklappt in einer Zeile stehen). Gruppen haben keine eigenen Termine.
Der Status ergibt sich aus den Terminen und dem Stichtag – dieselbe Regel steht in kalender.js:
erledigt (Ist-Ende ≤ Stichtag) · überfällig (Plan-Ende < Stichtag, nicht erledigt) · läuft (Beginn ≤ Stichtag) · offen.
Ausgabe: kalender.json (für das Dashboard) und kalender.csv (gleich der CSV-Ebene).
"""
import csv
import datetime as dt
import json
import os

HIER = os.path.dirname(os.path.abspath(__file__))
JAHR = 2027
STICHTAG = "30.09."
VERSCHIEBUNG = dt.timedelta(days=364)        # 52 Wochen: Wochentage und Abfolge bleiben erhalten


def iso(t):
    if t is None:
        return None
    if t == STICHTAG:
        return f"{JAHR}-09-30"
    return (dt.date(JAHR - 1, int(t[3:5]), int(t[0:2])) + VERSCHIEBUNG).isoformat()


G = None  # Gruppe: keine eigenen Termine
# id, parent, Name, Verantwortlich, Beginn, Ende, Ist-Ende, Serie
K = [
    ("rep", None, "Reporting", "", G, G, G, False),
    ("ja", "rep", "Jahresabschluss 2026", "Rechnungswesen", "02.02.", "27.03.", "27.03.", False),
    ("mr", "rep", "Monatsreporting", "Controlling", G, G, G, True),
    ("mr01", "mr", "Monatsreporting 01 und 02", "Controlling", "02.03.", "10.03.", "10.03.", False),
    ("mr03", "mr", "Monatsreporting 03", "Controlling", "01.04.", "14.04.", "14.04.", False),
    ("mr04", "mr", "Monatsreporting 04", "Controlling", "04.05.", "12.05.", "12.05.", False),
    ("mr05", "mr", "Monatsreporting 05", "Controlling", "01.06.", "10.06.", "10.06.", False),
    ("mr06", "mr", "Monatsreporting 06", "Controlling", "01.07.", "09.07.", "09.07.", False),
    ("mr07", "mr", "Monatsreporting 07", "Controlling", "03.08.", "11.08.", "11.08.", False),
    ("mr08", "mr", "Monatsreporting 08", "Controlling", "01.09.", "09.09.", "09.09.", False),
    ("mr09", "mr", "Monatsreporting 09", "Controlling", "01.10.", "09.10.", None, False),
    ("mr10", "mr", "Monatsreporting 10", "Controlling", "02.11.", "10.11.", None, False),
    ("mr11", "mr", "Monatsreporting 11", "Controlling", "01.12.", "09.12.", None, False),
    ("qa", "rep", "Quartalsabschluss", "Rechnungswesen", G, G, G, True),
    ("qa1", "qa", "Quartalsabschluss Q1", "Rechnungswesen", "01.04.", "05.05.", "05.05.", False),
    ("qa2", "qa", "Quartalsabschluss Q2", "Rechnungswesen", "20.07.", "11.08.", "11.08.", False),
    ("qa3", "qa", "Quartalsabschluss Q3", "Rechnungswesen", "12.10.", "29.10.", None, False),
    ("fc", "rep", "Forecast", "Controlling", G, G, G, True),
    ("fc2", "fc", "Forecast 2", "Controlling", "17.08.", "03.09.", "03.09.", False),
    ("fc3", "fc", "Forecast 3 (Outlook Year End)", "Controlling", "09.11.", "13.11.", None, False),
    ("pla", None, "Planung", "", G, G, G, False),
    ("str", "pla", "Strategieentwicklung", "Unternehmensentwicklung", "12.01.", "27.02.", "27.02.", False),
    ("mfp", "pla", "Mittelfristplanung inkl. Forecast 1", "Controlling", "13.04.", "23.10.", None, False),
    ("bud", "pla", "Budgetierung 2028", "Controlling", G, G, G, False),
    ("vor", "bud", "Vorbereitungsarbeiten", "Controlling", "17.08.", "28.08.", "28.08.", False),
    ("pip", "bud", "Projekt- und Investitionsplanung", "Investitionscontrolling", G, G, G, False),
    ("pip1", "pip", "Projekte vorbereiten", "Investitionscontrolling", "24.08.", "28.08.", "28.08.", False),
    ("pip2", "pip", "Sonderprojekte identifizieren", "Investitionscontrolling", "26.08.", "28.08.", "28.08.", False),
    ("pip3", "pip", "Planungsworkshop Projekte", "Investitionscontrolling", "02.09.", "03.09.", "03.09.", False),
    ("pip4", "pip", "Planwerte auf Innenaufträgen", "Investitionscontrolling", "07.09.", "16.09.", "18.09.", False),
    ("pip5", "pip", "Investitionen und Eigenleistungen", "Investitionscontrolling", "07.09.", "16.09.", "16.09.", False),
    ("pip6", "pip", "Eingabesperre", "Investitionscontrolling", "17.09.", "17.09.", "17.09.", False),
    ("pip7", "pip", "Projektübergreifende Abstimmung", "Investitionscontrolling", "21.09.", "23.09.", "23.09.", False),
    ("pip8", "pip", "Kapazitätsabgleich Einzelprojekte", "Investitionscontrolling", "22.09.", "24.09.", "24.09.", False),
    ("pip9", "pip", "Projektübersicht erstellen", "Investitionscontrolling", "28.09.", "02.10.", None, False),
    ("aeb", "bud", "Absatz-, Erlös- und Beschaffungsplanung", "Vertriebscontrolling", G, G, G, False),
    ("aeb1", "aeb", "Absatzplanung", "Vertriebscontrolling", "14.09.", "25.09.", None, False),
    ("aeb2", "aeb", "Erlösplanung", "Vertriebscontrolling", "21.09.", "02.10.", None, False),
    ("aeb3", "aeb", "Beschaffungsplanung", "Einkauf", "28.09.", "09.10.", None, False),
    ("pers", "bud", "Personalplanung", "Personalcontrolling", "17.08.", "09.10.", None, False),
    ("kst", "bud", "Kostenstellenplanung", "Bereichscontrolling", "01.09.", "16.10.", None, False),
    ("fin", "bud", "Finanz- und Beteiligungsplanung", "Treasury", "05.10.", "06.11.", None, False),
    ("abst", "bud", "Zentrale Abstimmung", "Controlling", "28.09.", "20.11.", None, False),
    ("frei", "bud", "Abschluss und Freigabe", "Geschäftsführung", "23.11.", "14.12.", None, False),
    ("exp", "bud", "Export der Planwerte ins ERP", "Controlling", "17.12.", "17.12.", None, False),
]

# Prüfung: Termine an Arbeitstagen, Ende nicht vor Beginn, Eltern vor Kindern
ids = set()
for kid, parent, name, verantw, b, e, ist, serie in K:
    assert parent is None or parent in ids, kid
    ids.add(kid)
    for t in (b, e, ist):
        if t:
            assert dt.date.fromisoformat(iso(t)).weekday() < 5, (kid, t)
    if b:
        assert iso(e) >= iso(b) and (ist is None or iso(ist) >= iso(b)), kid

daten = {"jahr": JAHR, "stichtag": iso(STICHTAG),
         "knoten": [[kid, parent, name, verantw, iso(b), iso(e), iso(ist), serie] for kid, parent, name, verantw, b, e, ist, serie in K]}
json.dump(daten, open(os.path.join(HIER, "kalender.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))


def status(b, e, ist):
    s = iso(STICHTAG)
    if ist and iso(ist) <= s:
        return "erledigt"
    if iso(e) < s:
        return "überfällig"
    return "läuft" if iso(b) <= s else "offen"


def tage(a, b):
    return (dt.date.fromisoformat(iso(b)) - dt.date.fromisoformat(iso(a))).days


eltern = {k[0]: k for k in K}


def pfad(kid):
    p = []
    while kid:
        p.insert(0, eltern[kid][2])
        kid = eltern[kid][1]
    return p


def d(t):
    if t is None:
        return ""
    x = dt.date.fromisoformat(iso(t))
    return f"{x.day:02d}.{x.month:02d}.{x.year}"


with open(os.path.join(HIER, "kalender.csv"), "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh, delimiter=";", lineterminator="\r\n")
    w.writerow(["Prozessart", "Prozess", "Teilprozess", "Schritt", "Verantwortlich", "Plan_Beginn", "Plan_Ende", "Ist_Ende",
                "Meilenstein", "Status_zum_Stichtag", "Verzug_Tage"])
    for kid, parent, name, verantw, b, e, ist, serie in K:
        if not b:
            continue
        st = status(b, e, ist)
        verzug = tage(e, ist) if ist and iso(ist) > iso(e) else (tage(e, STICHTAG) if st == "überfällig" else 0)
        ebenen = (pfad(kid) + ["", "", ""])[:4]
        w.writerow(ebenen + [verantw, d(b), d(e), d(ist), "ja" if b == e else "nein", st, verzug])

# Kontrollausgabe: Status je Termin zum Stichtag
zaehler = {}
for kid, parent, name, verantw, b, e, ist, serie in K:
    if b:
        st = status(b, e, ist)
        zaehler[st] = zaehler.get(st, 0) + 1
        if st in ("überfällig", "läuft") or (ist and iso(ist) > iso(e)):
            print(f"{name:40s} {b}–{e} {st}{' (Ist-Ende ' + ist + ')' if ist else ''}")
print("Stichtag", STICHTAG + str(JAHR), zaehler, "Termine", sum(zaehler.values()))
