"""Daten für Abb. 4.11 „Planungskalender“.

Vorgänge und Plantermine aus dem Original (5. Auflage, Projektdatei „Planungs- und Reportingkalender“, Jahr 2011):
Strategische Planung, Budgetierung (operative Planung) mit 19 Teilplänen, Mehrjahresplanung. Die Termine sind aus
den Balken des Screenshots abgelesen (Wochenraster 5,56 px je Tag, Summenbalken an den Endmarken).
Übertragung ins Jahr 2026: 783 Wochen (5.481 Tage) später – Wochentage und Abfolge bleiben erhalten
(Mo 05.09.2011 → Mo 07.09.2026), alle Termine liegen auf Arbeitstagen (NRW).
Korrekturen: „Ergebnispanungplanung“ → „Ergebnisplanung“, „Kick-Off“ → „Kick-off“, „Personalplanung Indirekt“ → „indirekt“.

Erfunden (für Stichtag und Status, wie Abb. 3.12): Stichtag Fr 16.10.2026 und die Ist-Termine. Die Absatz- und
Umsatzplanung wird vier Tage später fertig, die Produktionsplanung ist zum Stichtag überfällig.
Status je Vorgang (gleiche Regel in planungskalender.js): erledigt (Ist-Ende ≤ Stichtag) · überfällig (Plan-Ende
< Stichtag) · läuft (Beginn ≤ Stichtag) · offen.
Der Reportingkalender (Abb. 4.15) liest diese Datei für die Budgetierung – beide Abbildungen zeigen denselben Stand.
Ausgabe: planungskalender.json und planungskalender.csv.
"""
import csv
import datetime as dt
import json
import os

HIER = os.path.dirname(os.path.abspath(__file__))
JAHR = 2026
VERSCHIEBUNG = dt.timedelta(weeks=783)            # 2011 → 2026, gleicher Wochentag
STICHTAG = dt.date(2026, 10, 16)
# Gesetzliche Feiertage NRW (Ostersonntag 05.04.2026) – nur für die Zählung der Arbeitstage
FEIERTAGE = ["2026-01-01", "2026-04-03", "2026-04-06", "2026-05-01", "2026-05-14", "2026-05-25", "2026-06-04",
             "2026-10-03", "2026-11-01", "2026-12-25", "2026-12-26", "2027-01-01"]
FREI = {dt.date.fromisoformat(f) for f in FEIERTAGE}


def d11(t):
    """Datum des Originals (TT.MM., Jahr 2011) → Datum 2026."""
    return dt.date(2011, int(t[3:5]), int(t[0:2])) + VERSCHIEBUNG


def d26(t):
    return None if t is None else dt.date(JAHR, int(t[3:5]), int(t[0:2]))


G = None
# id, übergeordnet, Name, Beginn (2011), Ende (2011), Ist-Ende (2026, erfunden; None = nicht erledigt)
K = [
    ("str", None, "Strategische Planung", "17.08.", "14.09.", "16.09."),
    ("bud", None, "Budgetierung 2027 (operative Planung)", G, G, G),
    ("vor", "bud", "Vorbereitung und Kick-off zur Planung", "05.09.", "19.09.", "21.09."),
    ("pra", "bud", "Prämissenplanung pflegen", "14.09.", "15.09.", "17.09."),
    ("abs", "bud", "Absatz- und Umsatzplanung", "19.09.", "07.10.", "13.10."),
    ("pro", "bud", "Produktionsplanung", "03.10.", "07.10.", None),
    ("res", "bud", "Ressourcenplanung", "03.10.", "14.10.", None),
    ("ped", "bud", "Personalplanung direkt", "10.10.", "21.10.", None),
    ("anl", "bud", "Anlagenplanung", "10.10.", "21.10.", None),
    ("ekp", "bud", "Einkaufspreisplanung", "10.10.", "21.10.", None),
    ("pei", "bud", "Personalplanung indirekt", "10.10.", "21.10.", None),
    ("per", "bud", "Produkterfolgsplanung", "24.10.", "28.10.", None),
    ("prj", "bud", "Projektplanung", "10.10.", "28.10.", None),
    ("inv", "bud", "Investitionsplanung", "03.10.", "28.10.", None),
    ("kst", "bud", "Kostenstellenplanung", "10.10.", "28.10.", None),
    ("erg", "bud", "Ergebnisplanung", "31.10.", "04.11.", None),
    ("guv", "bud", "GuV-Planung", "07.11.", "09.11.", None),
    ("kon", "bud", "Plankonsolidierung", "10.11.", "14.11.", None),
    ("bil", "bud", "Bilanzplanung", "10.11.", "14.11.", None),
    ("fin", "bud", "Finanzplanung", "07.11.", "14.11.", None),
    ("ver", "bud", "Veröffentlichung der Budgetplanung", "15.11.", "22.11.", None),
    ("mjp", None, "Mehrjahresplanung", "31.10.", "18.11.", None),
]


def arbeitstag(t):
    return t.weekday() < 5 and t not in FREI


knoten, ids = [], set()
for kid, parent, name, b, e, ist in K:
    assert parent is None or parent in ids, kid
    ids.add(kid)
    if b is None:
        knoten.append([kid, parent, name, None, None, None, False])
        continue
    B, E, I = d11(b), d11(e), d26(ist)
    for t in (B, E, I):
        assert t is None or arbeitstag(t), (kid, t)
    assert B <= E and (I is None or I >= B), kid
    assert I is None or I <= STICHTAG, kid
    knoten.append([kid, parent, name, B.isoformat(), E.isoformat(), I and I.isoformat(), False])

daten = {"jahr": JAHR, "stichtag": STICHTAG.isoformat(), "feiertage": FEIERTAGE, "knoten": knoten,
         # Zeiträume für den Datenschnitt: Schlüssel, Text, erster Tag, Tag nach dem letzten
         "zeitraeume": [["gesamt", "Aug.–Nov.", "2026-08-17", "2026-11-30"], ["sep", "September", "2026-08-31", "2026-10-05"],
                        ["okt", "Oktober", "2026-09-28", "2026-11-02"], ["nov", "November", "2026-10-26", "2026-11-30"]],
         "auf": ["bud"]}
json.dump(daten, open(os.path.join(HIER, "planungskalender.json"), "w", encoding="utf-8"), ensure_ascii=False,
          separators=(",", ":"))


def status(B, E, I):
    if I and I <= STICHTAG:
        return "erledigt"
    if E < STICHTAG:
        return "überfällig"
    return "läuft" if B <= STICHTAG else "offen"


def at(a, b):
    """Arbeitstage von a bis b einschließlich."""
    return sum(arbeitstag(a + dt.timedelta(days=i)) for i in range((b - a).days + 1))


de = lambda t: "" if t is None else t.strftime("%d.%m.%Y")
eltern = {k[0]: k for k in knoten}


def pfad(kid):
    p = []
    while kid:
        p.insert(0, eltern[kid][2])
        kid = eltern[kid][1]
    return p


zaehler = {}
with open(os.path.join(HIER, "planungskalender.csv"), "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh, delimiter=";", lineterminator="\r\n")
    w.writerow(["Gliederung", "Vorgang", "Plan_Anfang", "Plan_Ende", "Dauer_Arbeitstage", "Ist_Ende", "Status_zum_Stichtag",
                "Verzug_Arbeitstage"])
    for kid, parent, name, b, e, ist, _ in knoten:
        if b is None:
            continue
        B, E, I = (dt.date.fromisoformat(x) if x else None for x in (b, e, ist))
        st = status(B, E, I)
        tag1 = dt.timedelta(days=1)
        verzug = at(E + tag1, I) if I and I > E else (at(E + tag1, STICHTAG) if st == "überfällig" else 0)
        w.writerow([" › ".join(pfad(parent)) if parent else "", name, de(B), de(E), at(B, E), de(I), st, verzug])
        zaehler[st] = zaehler.get(st, 0) + 1
        if st in ("überfällig",) or verzug:
            print(f"{name:40s} {de(B)}–{de(E)} {st}, Verzug {verzug} Arbeitstage")

# Kontrollausgabe
bl = [k for k in knoten if k[1] == "bud"]
print("Budgetierung", min(k[3] for k in bl), "bis", max(k[4] for k in bl))
print("Stichtag", de(STICHTAG), zaehler, "Vorgänge", sum(zaehler.values()))
