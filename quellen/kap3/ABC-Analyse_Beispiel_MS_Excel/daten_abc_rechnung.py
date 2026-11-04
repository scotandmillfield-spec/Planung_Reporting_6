"""Daten für Abb. 3.21 „ABC-Analyse (Beispiel MS Excel)“ (6. Auflage) – die Rechentabelle zur ABC-Analyse.

Dieselben Daten wie Abb. 3.22 „ABC-Analyse“: Der Generator von Abb. 3.22 (quellen/kap3/ABC-Analyse/daten_abc.py,
Seed 20261006) wird hier unverändert nachgerechnet; ausgegeben werden Absatz (Stück) und Umsatz (€) je Produkt im
Jahr 2027 über alle Kundengruppen – genau die Werte, die Abb. 3.22 in ihrer Standardansicht (Stück, 2027, alle Kunden)
klassifiziert. Absatz 2027 über alle Kunden = Stückzahlen des Cubeware-Originals (A 21 / B 7 / C 21 Produkte bei den
Grenzen A 80 %, B weitere 10 %).
Ausgabe: abc_rechnung.json und abc_rechnung.csv (Semikolon, UTF-8 mit BOM); Kontrollsummen und Klassen auf stdout.
"""
import csv
import json
import os
import random

HIER = os.path.dirname(os.path.abspath(__file__))
rng = random.Random(20261006)

# ---------- unverändert aus daten_abc.py (Abb. 3.22) ----------
OBEN = [732, 591, 417, 311, 242, 212, 185, 167, 157, 149, 139,
        137, 132, 122, 115, 113, 106, 100, 98, 95, 95,
        95, 93, 88, 71, 69, 61, 58, 56]
REST = 5521 - sum(OBEN)
roh = [54 * 0.912 ** i for i in range(20)]
f = REST / sum(roh)
UNTEN = [round(v * f) for v in roh]
UNTEN[-1] += REST - sum(UNTEN)
STUECK_2027 = OBEN + UNTEN
assert sum(STUECK_2027) == 5521 and all(a >= b for a, b in zip(STUECK_2027, STUECK_2027[1:])), STUECK_2027

FAMILIEN = [("Kupplung", "KU", 70), ("Kugelgewindetrieb", "KG", 240), ("Getriebemotor", "GM", 420),
            ("Frequenzumrichter", "FU", 380), ("Planetengetriebe", "PG", 560), ("Servomotor", "SM", 690),
            ("Linearachse", "LA", 980)]
GROESSEN = [10, 20, 30, 40, 50, 63, 80]
KUNDEN = ["Maschinenbau", "Fördertechnik", "Fahrzeugbau", "Handel"]
RABATT = [0.00, 0.03, 0.06, 0.12]
JAHRE = [2026, 2027]

kandidaten = [(fam, kz, preis, g) for fam, kz, preis in FAMILIEN for g in GROESSEN]


def score(k):
    fam, kz, preis, g = k
    return preis * (0.6 + g / 60) * rng.uniform(0.3, 3.0)


kandidaten.sort(key=score)
produkte = []
for rang, (fam, kz, preis, g) in enumerate(kandidaten):
    listenpreis = round(preis * (0.6 + g / 60) * rng.uniform(0.9, 1.1), -1)
    we_quote = rng.uniform(0.56, 0.78)
    produkte.append({"name": f"{fam} {kz} {g}", "preis": listenpreis, "we": round(we_quote, 3)})


def aufteilen(gesamt, gewichte):
    s = sum(gewichte)
    teile = [gesamt * w / s for w in gewichte]
    ganz = [int(t) for t in teile]
    for i in sorted(range(len(teile)), key=lambda i: ganz[i] - teile[i])[: gesamt - sum(ganz)]:
        ganz[i] += 1
    return ganz


zeilen = []
for pid, p in enumerate(produkte):
    basis = [rng.uniform(0.5, 1.5) * w for w in (0.38, 0.22, 0.24, 0.16)]
    for jahr in JAHRE:
        st = STUECK_2027[pid] if jahr == 2027 else max(1, round(STUECK_2027[pid] * rng.uniform(0.78, 1.18)))
        gew = [b * rng.uniform(0.85, 1.15) for b in basis]
        for k, n in enumerate(aufteilen(st, gew)):
            preis = p["preis"] * (1 - RABATT[k]) * (0.97 if jahr == 2026 else 1.0)
            umsatz = round(n * preis)
            we = round(n * p["preis"] * p["we"] * (0.98 if jahr == 2026 else 1.0))
            zeilen.append([jahr - 2000, pid, k, n, umsatz, we])
# ---------- Ende der Übernahme ----------

# Abgleich mit Abb. 3.22, falls deren Daten vorliegen
ref = os.path.join(HIER, "..", "ABC-Analyse", "abc.json")
if os.path.exists(ref):
    r = json.load(open(ref, encoding="utf-8"))
    assert r["zeilen"] == zeilen and r["produkte"] == [p["name"] for p in produkte], "Daten weichen von Abb. 3.22 ab"
    print("Einzelsätze identisch mit Abb. 3.22 (ABC-Analyse/abc.json)")

JAHR = 2027
stueck = [0] * len(produkte)
umsatz = [0] * len(produkte)
for j, pid, k, n, u, we in zeilen:
    if j == JAHR - 2000:
        stueck[pid] += n
        umsatz[pid] += u

json.dump({"jahr": JAHR, "grenzen": [80, 10], "produkte": [p["name"] for p in produkte],
           # je Produkt: Absatz Stück, Umsatz € (Jahr 2027, alle Kundengruppen)
           "werte": [[s, u] for s, u in zip(stueck, umsatz)]},
          open(os.path.join(HIER, "abc_rechnung.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
with open(os.path.join(HIER, "abc_rechnung.csv"), "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh, delimiter=";", lineterminator="\r\n")
    w.writerow(["Produkt", "Jahr", "Absatz_Stueck", "Umsatz_EUR"])
    for p, s, u in zip(produkte, stueck, umsatz):
        w.writerow([p["name"], JAHR, s, u])


# Kontrollausgabe: Klassen wie in Abb. 3.22 (A, solange kumuliert ≤ 80 %; B ≤ 90 %; Rang 1 immer A)
def abc(werte, a=0.8, b=0.1):
    reihe = sorted(range(len(werte)), key=lambda i: (-werte[i], i))
    ges = sum(werte); kum = 0; n = [0, 0, 0]; s = [0, 0, 0]
    for r, i in enumerate(reihe):
        kum += werte[i]
        kl = 0 if (kum / ges <= a + 1e-9 or r == 0) else 1 if kum / ges <= a + b + 1e-9 else 2
        n[kl] += 1; s[kl] += werte[i]
    return ges, n, [round(100 * x / ges, 1) for x in s]


print("Absatz 2027:", *abc(stueck))
print("Umsatz 2027:", *abc(umsatz))
