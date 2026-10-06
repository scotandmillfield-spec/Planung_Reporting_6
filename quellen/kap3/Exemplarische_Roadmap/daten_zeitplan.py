"""Termindaten für Abb. 3.3 „Strategische Projektroadmap – Zeitplan“.

Gleicher Datensatz wie Abb. 3.5 (../Projektroadmap_Uebersicht/projekte.json, 19 Projekte, fünf Quartalsstände): Status,
Fertigstellung und Terminverzug je Stand werden übernommen, ergänzt um die Plantermine (Beginn, Beginn der
Umsetzung, Ende) und den Ist-Beginn. Prognose-Ende = Plan-Ende + Terminverzug des jeweiligen Stands;
bei erledigten Projekten ist es das Ist-Ende.
Ausgabe: zeitplan.json (kompakt) und zeitplan.csv. Die Prüfungen am Ende sichern, dass Status und Termine
zu jedem Stand zusammenpassen.
"""
import csv
import datetime as dt
import json
import os

HIER = os.path.dirname(os.path.abspath(__file__))
P = json.load(open(os.path.join(HIER, "..", "Projektroadmap_Uebersicht", "projekte.json"), encoding="utf-8"))
STAND_ISO = ["2025-06-30", "2025-09-30", "2025-12-31", "2026-03-31", "2026-06-30"]

# Plan-Beginn, Plan-Beginn Umsetzung, Plan-Ende, Ist-Beginn (None = Idee, noch nicht terminiert)
T = {
    "Übernahme Digitalanbieter": ("2025-04-01", "2025-08-01", "2028-01-31", "2025-04-14"),
    "Markteintritt Osteuropa": ("2025-08-01", "2026-09-01", "2028-06-30", "2025-08-18"),
    "Vertriebsausbau DACH": ("2025-01-06", "2025-03-01", "2026-11-30", "2025-01-06"),
    "Rationalisierung Montage": None,
    "Digitales Mahnwesen": ("2025-02-01", "2025-03-15", "2025-10-31", "2025-02-03"),
    "Online-Akquiseplattform": ("2025-11-01", "2026-06-01", "2027-09-30", "2025-11-17"),
    "CRM-Einführung": ("2025-01-02", "2025-02-03", "2027-05-14", "2025-01-02"),
    "Ersatzteil-Webshop": ("2025-09-01", "2026-10-01", "2027-06-30", "2025-09-01"),
    "Produktlinie AT20": ("2025-07-15", "2026-04-01", "2027-03-31", "2025-07-21"),
    "Modularisierung GT1": ("2024-07-01", "2024-11-01", "2027-02-12", "2024-07-01"),
    "Digitaler Serviceprozess": ("2025-03-01", "2025-08-01", "2026-11-30", "2025-03-03"),
    "Prozessstandardisierung": ("2024-11-01", "2025-01-01", "2028-06-30", "2024-11-04"),
    "Fixkosten Altanlagen": ("2024-07-01", "2024-10-01", "2026-09-04", "2024-07-01"),
    "Projektmanagement-Office": ("2025-04-01", "2025-07-01", "2027-01-29", "2025-04-07"),
    "Recruiting Fachkräfte": ("2025-09-15", "2026-09-01", "2027-08-31", "2025-09-15"),
    "Gebäudesanierung Werk 2": ("2025-12-01", "2026-07-01", "2027-12-31", "2025-12-15"),
    "Energiesparende Anlagen": None,
    "Führungskräfteentwicklung": ("2025-09-01", "2026-02-01", "2027-12-17", "2025-09-01"),
    "Produktlinie AT40": None,
}
d = dt.date.fromisoformat
woche = lambda w: dt.timedelta(days=7 * w)

# Prüfungen: Status und Termine je Stand stimmig
fehler = []
for q, s, p_idx, verz in [(z[0], z[2], z[1], z[5]) for z in P["zeilen"]]:
    name = P["projekte"][p_idx][0]
    st = P["status"][s]
    t = T[name]
    stand = d(STAND_ISO[q])
    if st == "Idee":
        continue
    if t is None:
        fehler.append(f"{name}: Status {st} am {stand}, aber keine Termine")
        continue
    beginn, u, ende, ist = map(d, t)
    if ist > stand:
        fehler.append(f"{name}: {st} am {stand}, Ist-Beginn {ist} liegt danach")
    u_prog = u + woche(verz)
    if st == "Planung" and u_prog <= stand:
        fehler.append(f"{name}: noch Planung am {stand}, Umsetzung laut Prognose ab {u_prog}")
    if st == "Umsetzung" and u_prog > stand + dt.timedelta(days=14):
        fehler.append(f"{name}: Umsetzung am {stand}, Umsetzung laut Prognose erst ab {u_prog}")
    ende_prog = ende + woche(verz)
    if st in ("Planung", "Umsetzung") and ende_prog <= stand:
        fehler.append(f"{name}: offen am {stand}, Prognose-Ende {ende_prog} liegt davor")
    if st == "erledigt" and ende_prog > stand:
        fehler.append(f"{name}: erledigt am {stand}, Ist-Ende {ende_prog} liegt danach")
    if not beginn <= u < ende:
        fehler.append(f"{name}: Planphasen nicht aufsteigend")
if fehler:
    raise SystemExit("\n".join(fehler))

daten = dict(P)
daten["stand_iso"] = STAND_ISO
# Termine je Projekt in Reihenfolge der Projektliste (None = nicht terminiert)
daten["termine"] = [list(T[p[0]]) if T[p[0]] else None for p in P["projekte"]]
json.dump(daten, open(os.path.join(HIER, "zeitplan.json"), "w", encoding="utf-8"), ensure_ascii=False,
          separators=(",", ":"))

de = lambda x: x.strftime("%d.%m.%Y")
with open(os.path.join(HIER, "zeitplan.csv"), "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh, delimiter=";")
    w.writerow(["Stand", "Projekt_ID", "Projekt", "Status", "Verantwortung", "Geschäftsbereich", "Funktionsbereich",
                "BSC_Perspektive", "Plan_Kosten_TEUR", "Plan_Beginn", "Plan_Beginn_Umsetzung", "Plan_Ende", "Ist_Beginn",
                "Ende_Prognose_bzw_Ist", "Terminverzug_Wochen", "Fertigstellung_Prozent"])
    for q, p_idx, s, fert, abw, verz, risk in P["zeilen"]:
        p = P["projekte"][p_idx]
        t = T[p[0]]
        st = P["status"][s]
        if t and st != "Idee":
            b, u, e, i = map(d, t)
            werte = [de(b), de(u), de(e), de(i), de(e + woche(verz)), verz, fert]
        else:
            werte = [""] * 7
        w.writerow([P["staende"][q], p_idx + 1, p[0], st, p[4], P["gb"][p[1]], P["fb"][p[2]], P["bsc"][p[3]], p[5]] + werte)

# Kontrollausgabe je Stand
for q, stand in enumerate(P["staende"]):
    zs = [z for z in P["zeilen"] if z[0] == q]
    offen = [z for z in zs if P["status"][z[2]] in ("Planung", "Umsetzung")]
    verzug = [z for z in offen if z[5] > 0]
    s12 = d(STAND_ISO[q]) + dt.timedelta(days=365)
    ab12 = sum(1 for z in offen if d(T[P["projekte"][z[1]][0]][2]) + woche(z[5]) <= s12)
    print(stand, "Projekte", len(zs), "Umsetzung", sum(P["status"][z[2]] == "Umsetzung" for z in zs),
          "terminiert", len(offen), "Verzug", len(verzug), "Ø Verzug %.1f Wo." % (sum(z[5] for z in offen) / len(offen)),
          "Abschluss <=12 Mon.", ab12)
print("Prüfungen bestanden.")
