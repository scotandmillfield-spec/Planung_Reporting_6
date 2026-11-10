"""Daten für Abb. 5.48 „Main Dashboard des Governance Dashboards“ – Betrieb und Nutzung einer BI-Plattform.

Inhalte und Werte des Originals (Stichtag 15.12., hier 15.12.2026):
  Server (28 Tage): Fehler 0, Warnungen 1.312, max. Arbeitsspeicher 43 GB, max. CPU-Last 16 %, max. geladene Apps 2
  Nutzung (28 Tage): 275 aktive Nutzer, 1 genutzte App, 1.353 Sitzungen, max. 6 gleichzeitige Sitzungen
  Ladevorgänge: 28 Ladeaufträge, 9.009 Ladevorgänge, davon 3.571 fehlerhaft (40 %); Ladedauer < 1 Min 8.561,
    1–5 Min 195 (→ 196, damit die Klassen 9.009 ergeben), 6–10 Min 5, 11–30 Min 155, > 30 Min 92
  Tage seit letzter Aktualisierung: 8–28 Tage 1, 29–60 Tage 1, > 60 Tage 252 (+ Klasse 0–7 Tage mit 26 Apps ergänzt:
    die 28 Ladeaufträge aktualisieren 28 Apps, die übrigen 252 haben keinen Ladeauftrag)
  90 Tage: aktivste Nutzer 308/206/188/117/111 Sitzungen (ohne anonyme), Apps 7.694 und 1 Sitzung
  Komplexeste Apps: Index 25/25/25/25/24; Datenquellen: Anteile aus dem Kreisdiagramm (≈ 39/33/15/7/5 %)
Im Original waren Heute, Gestern und 7 Tage überall 0 (Testsystem ohne Betrieb); hier ergeben sie sich aus
erfundenen Einzelsätzen, deren 28- und 90-Tage-Summen den Werten des Originals entsprechen.
Ausgabe: governance.json und governance.csv (Semikolon, UTF-8 mit BOM).
"""
import csv
import datetime as dt
import json
import os
import random

HIER = os.path.dirname(os.path.abspath(__file__))
rnd = random.Random(548)
STICHTAG = dt.date(2026, 12, 15)
TAGE = 90                                   # Tag 89 = Stichtag
DATUM = [STICHTAG - dt.timedelta(days=TAGE - 1 - t) for t in range(TAGE)]
WOCHE = [1.0, 1.05, 1.0, 0.95, 0.85, 0.2, 0.12]          # Mo … So


def verteilen(summe, gewichte):
    """Ganzzahlig nach Gewichten, Summe exakt (größter Rest)."""
    roh = [summe * g / sum(gewichte) for g in gewichte]
    teile = [int(r) for r in roh]
    for i in sorted(range(len(roh)), key=lambda i: teile[i] - roh[i])[: summe - sum(teile)]:
        teile[i] += 1
    return teile


# ---------- Sitzungen (Einzelsätze): [Tag, Nutzer, App] ----------
APPS = ["Vertriebsanalyse", "Vertriebsanalyse (SSO)"]
TOP = [("Frau Brandt", 308), ("Herr Tal", 206), ("Frau Kühn", 188), ("Herr Ober", 117), ("Frau Lenz", 111)]
N_NUTZER = 420                               # 0 = anonym, 1–5 = Top 5, Rest „Nutzer 006“ …
NAMEN = ["anonym"] + [n for n, _ in TOP] + [f"Nutzer {i:03d}" for i in range(6, N_NUTZER + 1)]
ALT, NEU = 62, 28                            # Tage vor bzw. in den letzten 28 Tagen
SITZ_NEU, SITZ_ALT = 1353, 7695 - 1353       # 7.694 + 1 Sitzungen in 90 Tagen
gew = [WOCHE[d.weekday()] * (1.0 if t < 50 else 1.0 - 0.04 * (t - 50) if t < ALT else 0.52) for t, d in enumerate(DATUM)]
je_tag = verteilen(SITZ_ALT, gew[:ALT]) + verteilen(SITZ_NEU, gew[ALT:])
slots = [t for t in range(TAGE) for _ in range(je_tag[t])]
rnd.shuffle(slots)
nutzer_von = {}                              # Index in slots → Nutzer
frei = list(range(len(slots)))
rnd.shuffle(frei)
# Top 5: Sitzungen über den Zeitraum verteilt
for u, (_, n) in enumerate(TOP, start=1):
    for _ in range(n):
        nutzer_von[frei.pop()] = u
# anonym: rund 3 % der übrigen
for _ in range(int(len(frei) * 0.03)):
    nutzer_von[frei.pop()] = 0
# letzte 28 Tage: genau 275 benannte Nutzer (Top 5 + 270 weitere)
neu_frei = [i for i in frei if slots[i] >= ALT]
alt_frei = [i for i in frei if slots[i] < ALT]
aktiv_neu = list(range(6, 6 + 270))
for u in aktiv_neu:                          # je eine Sitzung, damit jeder aktiv ist
    nutzer_von[neu_frei.pop()] = u
pool = list(range(6, N_NUTZER + 1))
gew_n = {u: 1 / (1 + (u - 6) * 0.02) for u in pool}  # einige Vielnutzer, viele Gelegenheitsnutzer
zaehler = {u: 1 if u in aktiv_neu else 0 for u in pool}
for i in neu_frei:
    u = rnd.choices(aktiv_neu, weights=[gew_n[x] for x in aktiv_neu])[0]
    nutzer_von[i] = u; zaehler[u] += 1
for i in alt_frei:
    while True:
        u = rnd.choices(pool, weights=[gew_n[x] for x in pool])[0]
        if zaehler[u] < 100:
            break
    nutzer_von[i] = u; zaehler[u] += 1
app_von = {i: 0 for i in range(len(slots))}
sso = next(i for i in range(len(slots)) if slots[i] == 20 and nutzer_von[i] >= 6)
app_von[sso] = 1
sitzungen = sorted([slots[i], nutzer_von[i], app_von[i]] for i in range(len(slots)))

# ---------- Server je Tag der letzten 28 Tage: [Warnungen, Fehler, RAM GB, CPU %, geladene Apps, gleichzeitige Sitzungen] ----------
warn_gew = [0 if t == NEU - 1 else rnd.choice([0.2, 0.5, 1, 1, 2, 4]) for t in range(NEU)]
warn = verteilen(1312, warn_gew)
s_neu = [je_tag[ALT + t] for t in range(NEU)]
server = []
for t in range(NEU):
    w = DATUM[ALT + t].weekday() < 5
    ram = round(31 + 9 * s_neu[t] / max(s_neu) + rnd.uniform(-1.5, 1.5))
    cpu = round(5 + 9 * s_neu[t] / max(s_neu) + rnd.uniform(-1, 1))
    server.append([warn[t], 0, ram, cpu, 2 if w and s_neu[t] > 40 else 1, max(1, round(s_neu[t] / 12 + rnd.uniform(0, 1.5)))])
imax = max(range(NEU), key=lambda t: s_neu[t])
server[imax][2], server[imax][3], server[imax][5] = 43, 16, 6
for r in server:
    r[2], r[3], r[5] = min(r[2], 43), min(r[3], 16), min(r[5], 6)

LADEN = {"auftraege": 28, "klassen": ["unter 1 Min", "1–5 Min", "6–10 Min", "11–30 Min", "über 30 Min"],
         "anzahl": [8561, 196, 5, 155, 92], "fehler": [3402, 61, 2, 48, 58]}
AKTUAL = {"klassen": ["0–7 Tage", "8–28 Tage", "29–60 Tage", "über 60 Tage"], "anzahl": [26, 1, 1, 252]}
KOMPLEX = [["Vertriebsanalyse", 25], ["Controlling-Cockpit", 25], ["Ergebnisrechnung", 25], ["Debitorenanalyse", 25], ["Governance-Dashboard", 24]]
QUELLEN = [["Datenbank", 161], ["Zwischendatei", 134], ["Speichertabelle", 64], ["Tabellenkalkulation", 30], ["Sonstige", 23]]

daten = {"stichtag": STICHTAG.isoformat(), "tage": TAGE, "nutzer": NAMEN, "apps": APPS, "sitzungen": sitzungen,
         "server": server, "laden": LADEN, "aktual": AKTUAL, "komplex": KOMPLEX, "quellen": QUELLEN}
with open(os.path.join(HIER, "governance.json"), "w", encoding="utf-8") as fh:
    json.dump(daten, fh, ensure_ascii=False, separators=(",", ":"))

KZ_SERVER = ["Serverwarnungen", "Serverfehler", "Arbeitsspeicher_max_GB", "CPU_Last_max_Prozent", "Geladene_Apps_max", "Gleichzeitige_Sitzungen_max"]
with open(os.path.join(HIER, "governance.csv"), "w", encoding="utf-8-sig", newline="") as fh:
    w = csv.writer(fh, delimiter=";")
    w.writerow(["Ebene", "Datum", "Nutzer", "App", "Kennzahl", "Wert"])
    for t, u, a in sitzungen:
        w.writerow(["Sitzung", DATUM[t].isoformat(), NAMEN[u], APPS[a], "Sitzung", 1])
    for t, r in enumerate(server):
        for k, v in zip(KZ_SERVER, r):
            w.writerow(["Server", DATUM[ALT + t].isoformat(), "", "", k, v])
    for k, n, f in zip(LADEN["klassen"], LADEN["anzahl"], LADEN["fehler"]):
        w.writerow(["Ladevorgänge 90 Tage", "", "", "", f"Ladedauer {k}", n])
        w.writerow(["Ladevorgänge 90 Tage", "", "", "", f"Ladedauer {k}, fehlerhaft", f])
    for k, n in zip(AKTUAL["klassen"], AKTUAL["anzahl"]):
        w.writerow(["Apps", STICHTAG.isoformat(), "", "", f"Letzte Aktualisierung {k}", n])
    for a, v in KOMPLEX:
        w.writerow(["Komplexität", STICHTAG.isoformat(), "", a, "Komplexitätsindex", v])
    for q, v in QUELLEN:
        w.writerow(["Datenquellen", STICHTAG.isoformat(), "", "", q, v])

# ---------- Kontrollausgabe ----------
neu = [s for s in sitzungen if s[0] >= ALT]
named = lambda ss: {s[1] for s in ss if s[1] > 0}
von = lambda ab: [s for s in sitzungen if s[0] >= ab]
assert len(neu) == 1353 and len(named(neu)) == 275 and {s[2] for s in neu} == {0}
assert sum(1 for s in sitzungen if s[2] == 0) == 7694 and sum(1 for s in sitzungen if s[2] == 1) == 1
cnt = {}
for s in sitzungen:
    if s[1] > 0: cnt[s[1]] = cnt.get(s[1], 0) + 1
top = sorted(cnt.items(), key=lambda x: -x[1])[:6]
assert [c for _, c in top[:5]] == [308, 206, 188, 117, 111] and top[5][1] < 111, top
assert sum(r[0] for r in server) == 1312 and max(r[2] for r in server) == 43 and max(r[3] for r in server) == 16
assert max(r[4] for r in server) == 2 and max(r[5] for r in server) == 6 and sum(r[1] for r in server) == 0
assert sum(LADEN["anzahl"]) == 9009 and sum(LADEN["fehler"]) == 3571 and sum(AKTUAL["anzahl"]) == 280
print(f"Sitzungen 90 Tage {len(sitzungen)}, davon anonym {sum(1 for s in sitzungen if s[1] == 0)}; Top 6: {top}")
for name, ab in (("Heute", 89), ("Gestern", 88), ("7 Tage", 83), ("28 Tage", 62)):
    ss = von(ab) if name != "Gestern" else [s for s in sitzungen if s[0] == 88]
    sr = server[ab - ALT:] if name != "Gestern" else [server[88 - ALT]]
    print(f"{name:8s}: Sitzungen {len(ss):5d} · aktive Nutzer {len(named(ss)):3d} · Apps {len({s[2] for s in ss})} · "
          f"Warnungen {sum(r[0] for r in sr):5d} · RAM {max(r[2] for r in sr)} · CPU {max(r[3] for r in sr)} · "
          f"Apps geladen {max(r[4] for r in sr)} · gleichzeitig {max(r[5] for r in sr)}")
print(f"Ladevorgänge {sum(LADEN['anzahl'])}, fehlerhaft {sum(LADEN['fehler'])} = {sum(LADEN['fehler']) / sum(LADEN['anzahl']) * 100:.1f} %")
print(f"Datenquellen {sum(v for _, v in QUELLEN)}: " + ", ".join(f"{q} {v / sum(x for _, x in QUELLEN) * 100:.1f} %" for q, v in QUELLEN))
