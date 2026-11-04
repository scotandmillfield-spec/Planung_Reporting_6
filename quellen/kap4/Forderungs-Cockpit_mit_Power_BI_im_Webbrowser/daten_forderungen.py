"""Daten für Abb. 4.21 „Forderungs-Cockpit … im Webbrowser“ (und Abb. 4.22, gleicher Datensatz).

Einzelsätze sind Ausgangsrechnungen an 24 Debitoren (Rechnungsdatum, Fälligkeit, Betrag, Zahlungseingang) von
August 2026 bis Juni 2027. Das Dashboard bildet daraus je Monatsultimo (Dezember 2026 bis Juni 2027) die offenen
Posten: Rechnung bis zum Stichtag gestellt und bis dahin nicht bezahlt. Überfälligkeit, Fälligkeitsklasse und
Mahnstufe ergeben sich aus den Tagen zwischen Fälligkeit und Stichtag.

Anker aus dem Original (Stichtag 30.06.2027): Forderungen gesamt 1.768.744,06 € = Sammelkonto 1400 Inland
1.286.866,62 € + 1401 Ausland 481.877,44 €; die Beträge je Konto werden dafür einheitlich skaliert (alle Monate),
der Rundungsrest in Cent geht an den größten offenen Posten des Kontos. Geschichte: Der Importeur in Skagen zahlt
seit Jahresbeginn immer später (Mahnstufe 3 im Juni), sonst zahlen die meisten Debitoren pünktlich.
Ausgabe: forderungen.json und forderungen.csv.
"""
import csv
import datetime as dt
import json
import os
import random

HIER = os.path.dirname(os.path.abspath(__file__))
START = dt.date(2026, 8, 1)
STICHTAGE = [dt.date(2026, 12, 31), dt.date(2027, 1, 31), dt.date(2027, 2, 28), dt.date(2027, 3, 31),
             dt.date(2027, 4, 30), dt.date(2027, 5, 31), dt.date(2027, 6, 30)]
ENDE = STICHTAGE[-1]
ZIEL_KONTO = [128686662, 48187744]                      # Cent: 1400 Inland, 1401 Ausland am 30.06.2027
KONTEN = [["1400", "Inland", "Forderungen aus Lieferungen und Leistungen Inland"],
          ["1401", "Ausland", "Forderungen aus Lieferungen und Leistungen Ausland"]]

# Nummer, Name, Konto (0 Inland, 1 Ausland), Zahlungsziel in Tagen, Rechnungen je Monat, Ø Betrag €, Verhalten
DEBITOREN = [
    ["10017", "Möbelhaus Osnabrück", 0, 30, 36, 9800, "puenktlich"],
    ["10012", "Großhandel Hannover", 0, 30, 32, 9900, "puenktlich"],
    ["50001", "Fachhandel Luzern (CH)", 1, 30, 20, 9300, "puenktlich"],
    ["50002", "Importeur Skagen (DK)", 1, 30, 11, 7600, "zunehmend"],
    ["10013", "Einrichter Esslingen", 0, 14, 30, 9600, "puenktlich"],
    ["10008", "Raumausstatter Münster", 0, 14, 30, 9100, "spaet"],
    ["50000", "Händler Oxford (GB)", 1, 30, 14, 6600, "puenktlich"],
    ["10001", "Bürobedarf Dortmund", 0, 14, 14, 2700, "puenktlich"],
    ["10002", "Objekteinrichter Essen", 0, 14, 12, 3600, "spaet"],
    ["10003", "Küchenstudio Bochum", 0, 14, 10, 3100, "puenktlich"],
    ["10004", "Hotelausstatter Köln", 0, 30, 6, 6200, "puenktlich"],
    ["10005", "Möbelmarkt Kassel", 0, 14, 12, 2900, "puenktlich"],
    ["10006", "Planungsbüro Bielefeld", 0, 14, 6, 2400, "puenktlich"],
    ["10007", "Wohnstudio Mainz", 0, 14, 9, 2600, "spaet"],
    ["10009", "Tischlerei Paderborn", 0, 14, 8, 2200, "puenktlich"],
    ["10010", "Fachmarkt Leipzig", 0, 14, 11, 3000, "puenktlich"],
    ["10011", "Polsterei Bremen", 0, 14, 7, 2500, "strittig"],
    ["10014", "Praxisausstatter Ulm", 0, 30, 5, 3900, "puenktlich"],
    ["10015", "Wohnbedarf Freiburg", 0, 14, 8, 2800, "puenktlich"],
    ["10016", "Gastronomiebedarf Hamburg", 0, 14, 10, 2700, "spaet"],
    ["50003", "Agentur Wien (AT)", 1, 30, 4, 3400, "puenktlich"],
    ["50004", "Händler Antwerpen (BE)", 1, 30, 4, 3100, "puenktlich"],
    ["50005", "Möbelhaus Linz (AT)", 1, 30, 3, 3600, "spaet"],
    ["50006", "Importeur Rotterdam (NL)", 1, 30, 3, 2900, "puenktlich"],
]
SAISON = {8: 0.94, 9: 1.0, 10: 1.03, 11: 1.05, 12: 0.97, 1: 0.95, 2: 0.98, 3: 1.03, 4: 1.0, 5: 1.03, 6: 1.06}
FAKTOR = 1.68                                         # Rechnungen je Monat (Anzahl offener Posten wie im Original)

SEED = 205
tag = lambda d: (d - START).days


def simulieren(seed):
    """Rechnungen [deb, rdatum, faellig, betrag_cent, zahldatum|None] mit Zahlungsverhalten je Debitor."""
    rnd = random.Random(seed)

    def verzug(verhalten, rdatum):
        """Tage zwischen Fälligkeit und Zahlung (negativ = vor Fälligkeit)."""
        if verhalten == "puenktlich":
            return rnd.uniform(-9, 0) if rnd.random() > 0.022 else rnd.uniform(3, 20)
        if verhalten == "spaet":
            return rnd.uniform(-6, 7) if rnd.random() > 0.05 else rnd.uniform(14, 30)
        if verhalten == "zunehmend":                  # ab Januar 2027 immer später
            basis = max(0, (rdatum - dt.date(2027, 1, 1)).days) / 151 * 46
            return basis + rnd.uniform(-4, 5)
        # strittig: meist pünktlich, gelegentlich eine strittige Rechnung, die lange offen bleibt
        return rnd.uniform(-5, 3) if rnd.random() > 0.07 else rnd.uniform(45, 95)

    out, d = [], START
    while d <= ENDE:
        if d.weekday() < 5:
            for di, (_, _, _, ziel, n_mon, mittel, verh) in enumerate(DEBITOREN):
                p = n_mon * FAKTOR * SAISON[d.month] / 21.5
                k = int(p) + (1 if rnd.random() < p - int(p) else 0)
                for _ in range(k):
                    betrag = max(180.0, rnd.lognormvariate(0, 0.55) * mittel * 0.86)
                    faellig = d + dt.timedelta(days=ziel)
                    z = faellig + dt.timedelta(days=round(verzug(verh, d)))
                    if z <= d:
                        z = d + dt.timedelta(days=1)
                    out.append([di, d, faellig, round(betrag * 100), z if z <= ENDE else None])
        d += dt.timedelta(days=1)
    return out


rechnungen = simulieren(SEED)

# Skalierung je Konto auf die Werte des Originals am 30.06.2027
offen_ende = lambda r: r[1] <= ENDE and (r[4] is None or r[4] > ENDE)
for k in (0, 1):
    rk = [r for r in rechnungen if DEBITOREN[r[0]][2] == k]
    f = ZIEL_KONTO[k] / sum(r[3] for r in rk if offen_ende(r))
    for r in rk:
        r[3] = round(r[3] * f)
    rest = ZIEL_KONTO[k] - sum(r[3] for r in rk if offen_ende(r))
    max(filter(offen_ende, rk), key=lambda r: r[3])[3] += rest

rechnungen.sort(key=lambda r: (r[1], r[0]))
zeilen = [[i + 1, r[0], tag(r[1]), tag(r[2]), r[3], tag(r[4]) if r[4] else -1] for i, r in enumerate(rechnungen)]
json.dump({"start": START.isoformat(), "stichtage": [tag(s) for s in STICHTAGE],
           "konten": KONTEN, "debitoren": [x[:4] for x in DEBITOREN], "rechnungen": zeilen},
          open(os.path.join(HIER, "forderungen.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))

de = lambda c: f"{c // 100},{c % 100:02d}"
with open(os.path.join(HIER, "forderungen.csv"), "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh, delimiter=";", lineterminator="\r\n")
    w.writerow(["Beleg", "Debitor_Nr", "Debitor", "Sammelkonto", "Rechnungsdatum", "Faelligkeit", "Betrag_EUR", "Zahlungseingang"])
    for b, di, rd, fd, c, zd in zeilen:
        x = DEBITOREN[di]
        w.writerow([b, x[0], x[1], KONTEN[x[2]][0], (START + dt.timedelta(rd)).isoformat(),
                    (START + dt.timedelta(fd)).isoformat(), de(c), (START + dt.timedelta(zd)).isoformat() if zd >= 0 else ""])

# Kontrollausgabe je Stichtag (Beträge in Tsd. €)
for s in STICHTAGE:
    t = tag(s)
    op = [z for z in zeilen if z[2] <= t and (z[5] < 0 or z[5] > t)]
    ue = [z for z in op if z[3] < t]
    tage = lambda z: t - z[3]
    um3 = sum(z[4] for z in zeilen if t - 90 < z[2] <= t)
    ges = sum(z[4] for z in op)
    kl = [sum(z[4] for z in ue if a <= tage(z) <= b) / 1e5 for a, b in ((1, 14), (15, 28), (29, 10 ** 6))]
    ms = [sum(z[4] for z in op if (0 if tage(z) <= 7 else 1 if tage(z) <= 21 else 2 if tage(z) <= 35 else 3) == m) / 1e5
          for m in range(4)]
    kon = [sum(z[4] for z in op if DEBITOREN[z[1]][2] == k) / 1e5 for k in (0, 1)]
    print(f"{s}: OP {len(op):3d}  Forderungen {ges / 1e5:8.1f}  Inland {kon[0]:7.1f}  Ausland {kon[1]:6.1f}  "
          f"überfällig {sum(z[4] for z in ue) / 1e5:6.1f} (1–14 {kl[0]:.1f}, 15–28 {kl[1]:.1f}, >28 {kl[2]:.1f})  "
          f"Mahnstufen {' / '.join(f'{v:.1f}' for v in ms)}  DSO {ges / um3 * 90:4.1f} Tage")
print(f"Rechnungen gesamt: {len(zeilen)}")
