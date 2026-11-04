"""Daten für Abb. 5.43 – Dashboard „Controlling-Cockpit“ (Stichtag März 2027, Ist gegen Plan, Monat und kumuliert).

Werte des Originals (01–03.2009 → 01–03.2027, TEUR → Tsd. €):
- Umsatz, Deckungsbeitrag II und Cashflow: Ist und Plan im März sowie kumuliert Januar bis März exakt wie in den
  Tabellen des Originals (Umsatz 492/685, kum. 1.431/1.827; DB II 364/546, kum. 995/1.363; Cashflow 90/280, kum. 32/564).
  Januar und Februar sowie der Plan April bis Dezember sind aus den Liniendiagrammen bzw. Säulen abgelesen und so
  gesetzt, dass die kumulierten Werte stimmen.
- ROCE: Das Original zeigte unplausible Werte (Plan 113,57 %). Hier wird er aus den Daten gerechnet:
  EBIT = DB II − Fixkosten, ROCE (annualisiert) = EBIT × 12 / Capital Employed; Fixkosten und Capital Employed erfunden.
  Die Aussage des Originals – ROCE rund drei Viertel unter Plan – bleibt erhalten.
Ausgabe: cockpit.json und cockpit.csv.
"""
import csv
import json
import os

HIER = os.path.dirname(os.path.abspath(__file__))
JAHR = 2027
MONATE = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"]
PLAN = {
    "umsatz":   [530, 612, 685, 455, 385, 385, 385, 610, 840, 905, 975, 830],
    "db2":      [375, 442, 546, 325, 265, 265, 285, 515, 720, 800, 830, 680],
    "cashflow": [299, -15, 280, 25, -40, -10, -45, 200, 440, 510, 375, 390],
    "fixkosten": [300] * 12,
    "ce":       [14400, 14400, 14450, 14450, 14500, 14500, 14550, 14550, 14600, 14600, 14650, 14650],
}
IST = {
    "umsatz":   [440, 499, 492],
    "db2":      [240, 391, 364],
    "cashflow": [-40, -18, 90],
    "fixkosten": [305, 305, 305],
    "ce":       [14620, 14650, 14680],
}
# Kontrolle gegen die Tabellen des Originals (März und kumuliert Januar–März)
ORIGINAL = {"umsatz": (492, 685, 1431, 1827), "db2": (364, 546, 995, 1363), "cashflow": (90, 280, 32, 564)}
for k, (i, p, ik, pk) in ORIGINAL.items():
    assert IST[k][2] == i and PLAN[k][2] == p and sum(IST[k]) == ik and sum(PLAN[k][:3]) == pk, k


def roce(d, n):
    """ROCE annualisiert für Monat n (0-basiert) und kumuliert Januar bis n, in %."""
    ebit = [d["db2"][m] - d["fixkosten"][m] for m in range(n + 1)]
    mon = ebit[n] * 12 / d["ce"][n] * 100
    kum = sum(ebit) * 12 / (n + 1) / (sum(d["ce"][:n + 1]) / (n + 1)) * 100
    return mon, kum


daten = {"jahr": JAHR, "monate": MONATE, "plan": PLAN, "ist": IST}
with open(os.path.join(HIER, "cockpit.json"), "w", encoding="utf-8") as fh:
    json.dump(daten, fh, ensure_ascii=False, separators=(",", ":"))
with open(os.path.join(HIER, "cockpit.csv"), "w", encoding="utf-8-sig", newline="") as fh:
    wr = csv.writer(fh, delimiter=";")
    wr.writerow(["Monat", "Szenario", "Umsatz_TsdEUR", "Deckungsbeitrag_II_TsdEUR", "Cashflow_TsdEUR", "Fixkosten_TsdEUR",
                 "Capital_Employed_TsdEUR"])
    for sz, d in (("Plan", PLAN), ("Ist", IST)):
        for m in range(len(d["umsatz"])):
            wr.writerow([f"{JAHR}-{m + 1:02d}", sz, d["umsatz"][m], d["db2"][m], d["cashflow"][m], d["fixkosten"][m], d["ce"][m]])

print("Kontrollwerte März 2027 (Ist / Plan / ΔPL %; kumuliert Ist / Plan / ΔPL %):")
for k in ("umsatz", "db2", "cashflow"):
    i, p, ik, pk = IST[k][2], PLAN[k][2], sum(IST[k]), sum(PLAN[k][:3])
    print(f"  {k:<9} {i:>5} {p:>5} {(i / p - 1) * 100:+7.2f}   {ik:>6} {pk:>6} {(ik / pk - 1) * 100:+7.2f}")
for n in range(3):
    ri, rp = roce(IST, n), roce(PLAN, n)
    print(f"  ROCE {MONATE[n]}: Ist {ri[0]:5.1f} % / Plan {rp[0]:5.1f} % ({(ri[0] / rp[0] - 1) * 100:+.1f} %), "
          f"kum. Ist {ri[1]:5.1f} % / Plan {rp[1]:5.1f} % ({(ri[1] / rp[1] - 1) * 100:+.1f} %)")
print(f"  Jahresplan Umsatz {sum(PLAN['umsatz'])}, DB II {sum(PLAN['db2'])}, Cashflow {sum(PLAN['cashflow'])}")
