"""Daten für Abb. 3.69 „Sparkline-Beispiel“: Produktionscontrolling mit täglicher Aktualisierung.

Drei Produktfamilien, 20 Arbeitstage (Mo 20.09. bis Fr 15.10.2027). Je Tag und Produktfamilie: bestellte Stückzahl,
Lagermenge (negativ = Mindermenge), Produktionsmenge (Stück), durchschnittliche Durchlaufzeit (Std.) und
Produktqualität (PPM, fehlerhafte Teile je Million).
Werte des Originals am Stichtag: Aufträge 23.817 / 24.526 / 5.334 (Änderung zum Vortag +178 % / +14 % / −53 %),
Lager 5.330 bzw. 18.524 und −10.813 (Änderung zum Vortag +183 / +474 / −5.334), Produktion 13.004 / 24.526 / 5.334,
Durchlaufzeit 5,30 / 3,24 / 4,55 Std., Qualität 100 / 156 / 40 PPM. Die Vortageswerte sind daraus zurückgerechnet,
die übrigen Tage mit festem Seed erfunden. Ziele (Annahme): Durchlaufzeit ≤ 4,0 Std., Qualität ≤ 80 PPM.
Ausgabe: sparklines.json und sparklines.csv.
"""
import csv
import datetime
import json
import os
import random

HIER = os.path.dirname(os.path.abspath(__file__))
rnd = random.Random(369)
START = datetime.date(2027, 9, 20)
TAGE = []
d = START
while len(TAGE) < 20:
    if d.weekday() < 5:
        TAGE.append(d)
    d += datetime.timedelta(days=1)
assert TAGE[-1] == datetime.date(2027, 10, 15)
N = len(TAGE)
PF = ["Produktfamilie 1", "Produktfamilie 2", "Produktfamilie 3"]


def reihe(start, ende, streu, vortag, letzter, nk=0, mini=None):
    """Zufallsweg von start nach ende über N−2 Tage, dann Vortag und Stichtag fest."""
    w = []
    for i in range(N - 2):
        basis = start + (ende - start) * i / (N - 3)
        v = basis + rnd.uniform(-streu, streu)
        if mini is not None:
            v = max(mini, v)
        w.append(round(v, nk) if nk else int(round(v)))
    return w + [vortag, letzter]


auftraege = [reihe(9800, 9000, 2600, 8567, 23817), reihe(15500, 20500, 2400, 21514, 24526),
             reihe(8200, 10500, 2200, 11349, 5334)]
lager = [reihe(21000, -9500, 2500, -10996, -10813), reihe(17000, 18500, 1500, 18050, 18524),
         reihe(15500, 11500, 1400, 10664, 5330)]
produktion = [reihe(11000, 12500, 1800, 12650, 13004), reihe(17500, 22500, 2200, 23120, 24526),
              reihe(7600, 8800, 1500, 9020, 5334)]
dlz = [reihe(4.6, 5.0, 0.55, 5.12, 5.30, 2), reihe(3.1, 3.3, 0.3, 3.41, 3.24, 2), reihe(4.1, 4.3, 0.35, 4.38, 4.55, 2)]
ppm = [reihe(70, 90, 35, 85, 100, 0, 15), reihe(120, 140, 40, 131, 156, 0, 15), reihe(45, 40, 18, 52, 40, 0, 10)]
for j, spitze in enumerate([520, 610, 470]):      # Qualitätsproblem in der ersten Woche (wie die Spitze im Original)
    ppm[j][3] = spitze
    ppm[j][4] = int(spitze * 0.35)

# Kontrollen gegen das Original
assert [a[-1] for a in auftraege] == [23817, 24526, 5334]
assert [round((a[-1] / a[-2] - 1) * 100) for a in auftraege] == [178, 14, -53]
assert [l[-1] for l in lager] == [-10813, 18524, 5330] and [l[-1] - l[-2] for l in lager] == [183, 474, -5334]
assert [p[-1] for p in produktion] == [13004, 24526, 5334]

json.dump({"tage": [t.isoformat() for t in TAGE], "familien": PF, "ziel_dlz": 4.0, "ziel_ppm": 80,
           "auftraege": auftraege, "lager": lager, "produktion": produktion, "dlz": dlz, "ppm": ppm},
          open(os.path.join(HIER, "sparklines.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
with open(os.path.join(HIER, "sparklines.csv"), "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh, delimiter=";", lineterminator="\r\n")
    w.writerow(["Datum", "Produktfamilie", "Bestellte_Stueck", "Lagermenge_Stueck", "Produktionsmenge_Stueck",
                "Durchlaufzeit_Std", "Qualitaet_PPM"])
    for i, t in enumerate(TAGE):
        for j, pf in enumerate(PF):
            w.writerow([t.strftime("%d.%m.%Y"), pf, auftraege[j][i], lager[j][i], produktion[j][i],
                        f"{dlz[j][i]:.2f}".replace(".", ","), ppm[j][i]])
for j, pf in enumerate(PF):
    print(pf, "Aufträge", auftraege[j][-1], "ΔVT %+.1f %%" % ((auftraege[j][-1] / auftraege[j][-2] - 1) * 100),
          "| Lager", lager[j][-1], "ΔVT %+d" % (lager[j][-1] - lager[j][-2]), "| Produktion", produktion[j][-1],
          "| DLZ", dlz[j][-1], "| PPM", ppm[j][-1], "| Min Lager", min(lager[j]))
