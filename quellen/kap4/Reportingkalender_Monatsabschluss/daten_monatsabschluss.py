"""Daten für Abb. 4.16 „Reportingkalender Monatsabschluss“.

Vorgänge aus dem Original (5. Auflage): Monatsabschluss Januar 2011 mit vier Phasen – Berichtserstellung
(mit Informationsbeschaffung und -transformation), Analysevorbereitung, Berichtsbereitstellung, Berichtsanalyse und
-steuerung – und 14 Schritten, abgelesen aus den Tagesspalten des Screenshots (01.02.–10.02.2011).
Übertragung auf den Monatsabschluss Januar 2026 nach Arbeitstagen (AT) des Folgemonats, wie im Reportingkalender
(Abb. 4.15): AT 1 = Mo 02.02.2026 … AT 8 = Mi 11.02.2026. Im Original begann die Informationsanalyse des
Berichtsempfängers an einem Samstag (05.02.2011); sie liegt jetzt auf AT 5 und 6 (Fr 06.02. und Mo 09.02.2026).
Der Schritt „Berichtserstellung“ heißt „Berichte erstellen“, damit er sich von der gleichnamigen Phase unterscheidet.
Erfunden (wie Abb. 3.12): Stichtag Mi 04.02.2026 (AT 3) und Ist-Termine – die Abschlussbuchungen sind überfällig.
Revision 11.11.2026: Zeitachse einheitlich in Arbeitstagen; Datenschnitt „Zeitachse“ mit Tagen und Wochen statt
Kalendertage/Arbeitstage.
Ausgabe: monatsabschluss.json und monatsabschluss.csv.
"""
import csv
import datetime as dt
import json
import os

HIER = os.path.dirname(os.path.abspath(__file__))
STICHTAG = dt.date(2026, 2, 4)
FEIERTAGE = ["2026-01-01", "2026-04-03", "2026-04-06", "2026-05-01", "2026-05-14", "2026-05-25", "2026-06-04",
             "2026-10-03", "2026-11-01", "2026-12-25", "2026-12-26", "2027-01-01"]
FREI = {dt.date.fromisoformat(f) for f in FEIERTAGE}
TAG = dt.timedelta(days=1)


def arbeitstag(t):
    return t.weekday() < 5 and t not in FREI


AT = []                                   # Arbeitstage im Februar 2026
t = dt.date(2026, 2, 1)
while len(AT) < 10:
    if arbeitstag(t):
        AT.append(t)
    t += TAG


def at(a, b):
    return sum(arbeitstag(a + dt.timedelta(days=i)) for i in range((b - a).days + 1))


G = None
# id, übergeordnet, Name, Arbeitstag Beginn, Arbeitstag Ende, Ist (Arbeitstag des Ist-Endes; None = nicht erledigt)
K = [
    ("ma", None, "Monatsabschluss Januar 2026", G, G, G),
    ("be", "ma", "Berichtserstellung", G, G, G),
    ("ib", "be", "Informationsbeschaffung und -transformation", G, G, G),
    ("ib1", "ib", "Datenübertragungen anstoßen", 1, 1, 1),
    ("ib2", "ib", "Buchungsperioden schließen", 1, 1, 1),
    ("ib3", "ib", "Abschlussbuchungen durchführen", 2, 2, None),
    ("be1", "be", "Informationsaufbereitung und -verdichtung", 3, 3, None),
    ("be2", "be", "Berichte erstellen", 3, 3, None),
    ("av", "ma", "Analysevorbereitung", G, G, G),
    ("av1", "av", "Plausibilisierung", 3, 3, None),
    ("av2", "av", "Abweichungs-, Ursachen- und sonstige Analysen", 4, 4, None),
    ("av3", "av", "Berichtskommentierung und Entscheidungsvorbereitung", 4, 4, None),
    ("bb", "ma", "Berichtsbereitstellung", G, G, G),
    ("bb1", "bb", "Bündelung der Berichte", 4, 4, None),
    ("bb2", "bb", "Versendung der Berichte", 4, 4, None),
    ("ba", "ma", "Berichtsanalyse und -steuerung", G, G, G),
    ("ba1", "ba", "Informationsanalyse des Berichtsempfängers", 5, 6, None),
    ("ba2", "ba", "Präsentation und Diskussion", 7, 7, None),
    ("ba3", "ba", "Entscheidungsfindung und Maßnahmeneinleitung", 7, 8, None),
]

knoten, ids = [], set()
for kid, parent, name, b, e, ist in K:
    assert parent is None or parent in ids, kid
    ids.add(kid)
    if b is None:
        knoten.append([kid, parent, name, None, None, None, False])
        continue
    B, E, I = AT[b - 1], AT[e - 1], ist and AT[ist - 1]
    assert B <= E and (I is None or B <= I <= STICHTAG), kid
    knoten.append([kid, parent, name, B.isoformat(), E.isoformat(), I and I.isoformat(), False])

# gleiche Termine wie der Monatsabschluss Januar im Reportingkalender (Abb. 4.15)
rk = os.path.join(HIER, "..", "Reportingkalender", "reportingkalender.json")
if os.path.exists(rk):
    jan = next(k for k in json.load(open(rk, encoding="utf-8"))["knoten"] if k[0] == "ma2601")
    blatt = [k for k in knoten if k[3]]
    assert (jan[3], jan[4]) == (min(k[3] for k in blatt), max(k[4] for k in blatt)), "Termine wie Abb. 4.15"

daten = {"jahr": 2026, "stichtag": STICHTAG.isoformat(), "feiertage": FEIERTAGE, "knoten": knoten,
         # Datenschnitt „Zeitachse“ (nur Arbeitstage): Tage = Abschlusszeitraum (AT 1–9), Wochen = Februar (KW 6–9)
         "zeitraeume": [["tage", "Tage", "2026-02-02", "2026-02-13"], ["wochen", "Wochen", "2026-02-02", "2026-03-02"]],
         "auf": ["ma", "be", "ib", "av", "bb", "ba"]}
json.dump(daten, open(os.path.join(HIER, "monatsabschluss.json"), "w", encoding="utf-8"), ensure_ascii=False,
          separators=(",", ":"))


def status(B, E, I):
    if I and I <= STICHTAG:
        return "erledigt"
    if E < STICHTAG:
        return "überfällig"
    return "läuft" if B <= STICHTAG else "offen"


de = lambda t: "" if t is None else t.strftime("%d.%m.%Y")
eltern = {k[0]: k for k in knoten}


def pfad(kid):
    p = []
    while kid:
        p.insert(0, eltern[kid][2])
        kid = eltern[kid][1]
    return p


zaehler = {}
with open(os.path.join(HIER, "monatsabschluss.csv"), "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh, delimiter=";", lineterminator="\r\n")
    w.writerow(["Gliederung", "Vorgang", "Plan_Anfang", "Plan_Ende", "Dauer_Arbeitstage", "Ist_Ende", "Status_zum_Stichtag",
                "Verzug_Arbeitstage"])
    for kid, parent, name, b, e, ist, _ in knoten:
        if b is None:
            continue
        B, E, I = (dt.date.fromisoformat(x) if x else None for x in (b, e, ist))
        st = status(B, E, I)
        verzug = at(E + TAG, I) if I and I > E else (at(E + TAG, STICHTAG) if st == "überfällig" else 0)
        w.writerow([" › ".join(pfad(parent)) if parent else "", name, de(B), de(E), at(B, E), de(I), st, verzug])
        zaehler[st] = zaehler.get(st, 0) + 1
        print(f"{name:52s} {B:%a %d.%m.}–{E:%a %d.%m.} {st}{f', Verzug {verzug} AT' if verzug else ''}")
print("Stichtag", de(STICHTAG), zaehler, "Vorgänge", sum(zaehler.values()))
