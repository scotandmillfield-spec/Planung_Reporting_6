"""Daten für Abb. 4.15 „Reportingkalender“.

Vorgänge aus dem Original (5. Auflage, Projektdatei „Planungs- und Reportingkalender“, Jahr 2011): Reporting mit
Jahresabschluss des Vorjahres, 13 Monatsabschlüssen (März, Juni und September zugleich Quartals- bzw.
Halbjahresabschluss), drei Forecasts und dem Jahresabschluss; dazu Risikomanagement, strategische Planung (fünf
Schritte) und Budgetierung. Übertragen auf das Berichtsjahr 2026 (Termine in den Jahren 2026 und 2027):
- Monatsabschlüsse wie im Original vom 1. bis 8. Arbeitstag des Folgemonats (Feiertage NRW berücksichtigt);
  die Forecasts laufen wie im Original parallel zu den Quartals- und Halbjahresabschlüssen.
- Jahresabschluss 2025 vom 1. Arbeitstag bis Ende Februar, Jahresabschluss 2026 sieben Wochen ab dem 1. Arbeitstag 2027
  (Original: 03.01.–25.02.2011 bzw. 02.01.–17.02.2012); Risikomanagement ganzjährig.
- Strategische Planung: gleicher Zeitraum wie im Planungskalender (Abb. 4.11), 19.08.–16.09.2026 (Aug.–Sep.,
  21 Arbeitstage), mit den fünf Schritten des Originals in dessen Abfolge und ungefähren Anteilen (Analyse etwa die
  Hälfte, Strategietage zwei Tage, die drei Festlegungsschritte parallel am Ende). Revision 11.11.2026: Das Original
  (und die erste Fassung) legte die strategische Planung in den Januar/Februar, der Planungskalender in August/September.
- Budgetierung 2027 mit allen Teilplänen aus dem Planungskalender (Abb. 4.11, planungskalender.json) – gleicher Stand.
Erfunden (wie Abb. 3.12): Stichtag Fr 16.10.2026 (wie Abb. 4.11) und Ist-Termine. Der Monats- und
Quartalsabschluss September wird zwei Arbeitstage später fertig, Forecast III ist zum Stichtag überfällig.
Ausgabe: reportingkalender.json und reportingkalender.csv.
"""
import csv
import datetime as dt
import json
import os

HIER = os.path.dirname(os.path.abspath(__file__))
PLAN = json.load(open(os.path.join(HIER, "..", "Planungskalender",
                                   "planungskalender.json"), encoding="utf-8"))
JAHR = 2026
STICHTAG = dt.date(2026, 10, 16)
assert PLAN["stichtag"] == STICHTAG.isoformat(), "Stichtag wie im Planungskalender"
FEIERTAGE = PLAN["feiertage"]
FREI = {dt.date.fromisoformat(f) for f in FEIERTAGE}
TAG = dt.timedelta(days=1)


def arbeitstag(t):
    return t.weekday() < 5 and t not in FREI


def at_im_monat(jahr, monat, n):
    """n-ter Arbeitstag eines Monats."""
    t = dt.date(jahr, monat, 1)
    while True:
        if arbeitstag(t):
            n -= 1
            if n == 0:
                return t
        t += TAG


def at(a, b):
    return sum(arbeitstag(a + dt.timedelta(days=i)) for i in range((b - a).days + 1))


MONAT = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"]


def monatsabschluss(jahr, monat):
    """Abschluss des Monats: 1. bis 8. Arbeitstag des Folgemonats."""
    j, m = (jahr + 1, 1) if monat == 12 else (jahr, monat + 1)
    return at_im_monat(j, m, 1), at_im_monat(j, m, 8)


def strat(t):
    return dt.date(JAHR, int(t[3:5]), int(t[0:2]))


STR_PLAN = next(k for k in PLAN["knoten"] if k[0] == "str")   # Strategische Planung im Planungskalender


# Ist-Ende: None = nicht erledigt; "plan" = am Plan-Ende erledigt; sonst Datum
V = []      # id, übergeordnet, Name, Beginn, Ende, Ist
V.append(("rep", None, "Reporting", None, None, None))
V.append(("ja25", "rep", "Jahresabschluss 2025", at_im_monat(2026, 1, 1), dt.date(2026, 2, 27), "plan"))
for jahr, monat, name in [(2025, 12, "Monatsabschluss Dezember 2025"), (2026, 1, None), (2026, 2, None),
                          (2026, 3, "Monats- und Quartalsabschluss März"), ("fc", 1, "Forecast I"), (2026, 4, None),
                          (2026, 5, None), (2026, 6, "Monats- und Halbjahresabschluss Juni"), ("fc", 2, "Forecast II"),
                          (2026, 7, None), (2026, 8, None), (2026, 9, "Monats- und Quartalsabschluss September"),
                          ("fc", 3, "Forecast III"), (2026, 10, None), (2026, 11, None), (2026, 12, "Monatsabschluss Dezember 2026")]:
    if jahr == "fc":            # Forecast parallel zum Abschluss des Quartals
        b, e = monatsabschluss(2026, 3 * monat)
        V.append((f"fc{monat}", "rep", name, b, e, None if monat == 3 else "plan"))
        continue
    b, e = monatsabschluss(jahr, monat)
    ist = dt.date(2026, 10, 14) if (jahr, monat) == (2026, 9) else ("plan" if e <= STICHTAG else None)
    V.append((f"ma{jahr % 100:02d}{monat:02d}", "rep", name or f"Monatsabschluss {MONAT[monat - 1]}", b, e, ist))
b27 = at_im_monat(2027, 1, 1)
V.append(("ja26", "rep", "Jahresabschluss 2026", b27, b27 + dt.timedelta(weeks=7) - 3 * TAG, None))
V.append(("risk", None, "Risikomanagement", at_im_monat(2026, 1, 1), dt.date(2026, 12, 31), None))
V.append(("str", None, "Strategische Planung", None, None, None))
STR = [("str1", "Umwelt- und Wettbewerbsanalyse", "19.08.", "01.09."),
       ("str2", "Strategieentwicklung (Strategietage)", "02.09.", "03.09."),
       ("str3", "Ziele, Kennzahlen, Projekte festlegen", "04.09.", "16.09."),
       ("str4", "Prämissenplanung", "04.09.", "16.09."),
       ("str5", "Top-down-Vorgaben herunterbrechen", "04.09.", "16.09.")]
# gleicher Zeitraum und gleicher Stand wie im Planungskalender (Abb. 4.11)
assert min(strat(b) for _, _, b, _ in STR).isoformat() == STR_PLAN[3], "Beginn wie Abb. 4.11"
assert max(strat(e) for _, _, _, e in STR).isoformat() == STR_PLAN[4], "Ende wie Abb. 4.11"
assert STR_PLAN[5] == STR_PLAN[4], "Abb. 4.11: Strategische Planung termingerecht erledigt"
for kid, name, b, e in STR:
    V.append((kid, "str", name, strat(b), strat(e), "plan"))

knoten, ids = [], set()
for kid, parent, name, b, e, ist in V:
    assert parent is None or parent in ids, kid
    ids.add(kid)
    if b is None:
        knoten.append([kid, parent, name, None, None, None, False])
        continue
    ist = e if ist == "plan" else ist
    for t in (b, e, ist):
        assert t is None or arbeitstag(t), (kid, t)
    assert b <= e and (ist is None or b <= ist <= STICHTAG), kid
    knoten.append([kid, parent, name, b.isoformat(), e.isoformat(), ist and ist.isoformat(), False])
# Budgetierung 2027 aus dem Planungskalender (Abb. 4.11)
for k in PLAN["knoten"]:
    if k[0] == "bud" or k[1] == "bud":
        knoten.append(k)

daten = {"jahr": JAHR, "stichtag": STICHTAG.isoformat(), "feiertage": FEIERTAGE, "knoten": knoten,
         "zeitraeume": [["gesamt", "Jan. 2026–Feb. 2027", "2026-01-01", "2027-03-01"],
                        ["h1", "Jan.–Jun. 2026", "2026-01-01", "2026-07-01"],
                        ["h2", "Jul. 2026–Feb. 2027", "2026-07-01", "2027-03-01"]],
         "auf": ["rep"]}
json.dump(daten, open(os.path.join(HIER, "reportingkalender.json"), "w", encoding="utf-8"), ensure_ascii=False,
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
with open(os.path.join(HIER, "reportingkalender.csv"), "w", newline="", encoding="utf-8-sig") as fh:
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
        if parent == "rep" or verzug:
            print(f"{name:42s} {de(B)}–{de(E)} {at(B, E):3d} AT  {st}{f', Verzug {verzug} AT' if verzug else ''}")
print("Stichtag", de(STICHTAG), zaehler, "Vorgänge", sum(zaehler.values()))
