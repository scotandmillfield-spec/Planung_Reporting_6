"""Synthetische Absatzdaten für Abb. 3.22 „ABC-Analyse Produkte“ (Neuaufbau des Cubeware-Beispiels).

Ein namenloser Hersteller von Antriebs- und Lineartechnik, 49 Produkte, vier Kundengruppen, Jahre 2026 und 2027.
Der Absatz 2027 über alle Kunden entspricht Stück für Stück dem Original (Ränge 1–29 abgelesen, 30–49 ergänzt),
damit die Klassenwerte des Buchtextes gelten: A 11 Produkte / 59,81 %, B 10 / 20,16 %, C 28 / 20,03 %.
Umsatz und Wareneinsatz je Produkt sind erfunden (Listenpreis je Produkt, Rabatt je Kundengruppe).
Ausgabe: abc.json (kompakt) und abc.csv (Einzelsätze, Semikolon, Dezimalkomma).
"""
import csv
import json
import random

rng = random.Random(20261006)

# Absatz 2027, alle Kunden, in Rangfolge (Original, Ränge 1–29)
OBEN = [732, 591, 417, 311, 242, 212, 185, 167, 157, 149, 139,          # A
        137, 132, 122, 115, 113, 106, 100, 98, 95, 95,                   # B
        95, 93, 88, 71, 69, 61, 58, 56]                                  # C (sichtbar)
REST = 5521 - sum(OBEN)                                                  # Ränge 30–49 (im Original verdeckt)
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

# Produkte: Absatzstarke Ränge eher kleine Baugrößen und günstige Familien (realistisch, und Umsatz-ABC weicht ab)
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
    """Ganzzahlige Aufteilung mit größtem Rest."""
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

json.dump({"jahre": JAHRE, "kunden": KUNDEN, "produkte": [p["name"] for p in produkte],
           # Zeile: Jahr-2000, Produkt-Index, Kundengruppe-Index, Stück, Umsatz €, Wareneinsatz €
           "zeilen": zeilen}, open("abc.json", "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
with open("abc.csv", "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh, delimiter=";")
    w.writerow(["Jahr", "Produkt", "Kundengruppe", "Stück", "Umsatz_EUR", "Wareneinsatz_EUR", "DB_EUR"])
    for j, pid, k, n, u, we in zeilen:
        w.writerow([2000 + j, produkte[pid]["name"], KUNDEN[k], n, u, we, u - we])


# Kontrollausgabe: ABC je Jahr und Kennzahl (alle Kunden, Grenzen 60/20)
def abc(werte, a=0.6, b=0.2):
    reihe = sorted(range(len(werte)), key=lambda i: (-werte[i], i))
    ges = sum(werte); kum = 0; n = [0, 0, 0]; s = [0, 0, 0]
    for r, i in enumerate(reihe):
        kum += werte[i]
        kl = 0 if (kum / ges <= a + 1e-9 or r == 0) else 1 if kum / ges <= a + b + 1e-9 else 2
        n[kl] += 1; s[kl] += werte[i]
    return ges, n, [round(100 * x / ges, 2) for x in s]


for jahr in JAHRE:
    for name, sp in (("Stück", 3), ("Umsatz", 4), ("Wareneinsatz", 5), ("DB", None)):
        werte = [0] * len(produkte)
        for z in zeilen:
            if z[0] == jahr - 2000:
                werte[z[1]] += z[sp] if sp else z[4] - z[5]
        print(jahr, name, *abc(werte))
