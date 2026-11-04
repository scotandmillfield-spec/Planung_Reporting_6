"""Daten für Abb. 3.194 „Liniendiagramm mit Prognosewerten sowie Prognoseintervallen“.

Monatlicher Absatz in Stück, Ist Januar 2024 bis Juni 2027 (42 Monate, erfunden mit festem Seed; Saisonmuster wie
im Original: schwach im Januar und März, stark im April/Mai, Juli/August und November/Dezember).
Prognosemodell: lineare Regression mit Trend und Monatsdummies (saisonale Regression),
  Absatz_t = b0 + b1 * t + s_Monat + e_t   (Januar = Basis, 13 Parameter, 29 Freiheitsgrade).
Prognose Juli 2027 bis Dezember 2028 (18 Monate) mit Prognoseintervallen 80 % und 95 %:
  y0 ± t(1 − α/2; df) * s * sqrt(1 + x0' (X'X)^-1 x0)  – das Intervall wird mit dem Abstand zum letzten Ist breiter,
  weil die Unsicherheit des Trends wächst.
Modellgüte: MAPE (mittlerer absoluter Prozentfehler) der Modellwerte gegenüber Ist, dazu R².
Ausgabe: prognose.json und prognose.csv (eine Zeile je Monat).
"""
import csv
import json
import os

import numpy as np
from scipy import stats

HIER = os.path.dirname(os.path.abspath(__file__))
MON = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"]
SAISON = [480, 560, 400, 870, 880, 720, 950, 900, 590, 620, 880, 920]
N_IST, N_FC, START = 42, 18, 2024

rng = np.random.default_rng(203)
t = np.arange(N_IST + N_FC)
monat = t % 12
ist = np.round(np.array(SAISON)[monat[:N_IST]] + 2.6 * t[:N_IST] + rng.normal(0, 75, N_IST))


def X_von(ts):
    X = np.zeros((len(ts), 13))
    X[:, 0] = 1.0
    X[:, 1] = ts
    for i, tt in enumerate(ts):
        m = tt % 12
        if m > 0:
            X[i, 1 + m] = 1.0
    return X


X = X_von(t[:N_IST])
XtX_inv = np.linalg.inv(X.T @ X)
b = XtX_inv @ X.T @ ist
modell_hist = X @ b
res = ist - modell_hist
df = N_IST - X.shape[1]
s = float(np.sqrt(res @ res / df))
r2 = float(1 - (res @ res) / ((ist - ist.mean()) @ (ist - ist.mean())))
mape = float(np.mean(np.abs(res) / ist) * 100)

Xf = X_von(t[N_IST:])
fc = Xf @ b
se = s * np.sqrt(1 + np.einsum("ij,jk,ik->i", Xf, XtX_inv, Xf))
t80, t95 = float(stats.t.ppf(0.90, df)), float(stats.t.ppf(0.975, df))

r = lambda a: [int(round(v)) for v in a]
labels = [f"{MON[m]} {START + tt // 12}" for tt, m in zip(t, monat)]
daten = {
    "monate": labels, "nIst": N_IST, "ist": r(ist), "modell": r(np.concatenate([modell_hist, fc])),
    "u80": r(fc - t80 * se), "o80": r(fc + t80 * se), "u95": r(fc - t95 * se), "o95": r(fc + t95 * se),
    "mape": round(mape, 2), "r2": round(r2, 3), "s": round(s, 1), "df": df, "t80": round(t80, 3), "t95": round(t95, 3),
    "trend": round(float(b[1]), 2), "basis": round(float(b[0]), 1),
}
json.dump(daten, open(os.path.join(HIER, "prognose.json"), "w", encoding="utf-8"), ensure_ascii=False,
          separators=(",", ":"))
with open(os.path.join(HIER, "prognose.csv"), "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh, delimiter=";", lineterminator="\r\n")
    w.writerow(["Monat", "Jahr", "Monat_Nr", "Art", "Ist_Stueck", "Modellwert_Stueck",
                "Untergrenze_80", "Obergrenze_80", "Untergrenze_95", "Obergrenze_95"])
    for i, tt in enumerate(t):
        f = i - N_IST
        w.writerow([labels[i], START + tt // 12, tt % 12 + 1, "Ist" if f < 0 else "Prognose",
                    daten["ist"][i] if f < 0 else "", daten["modell"][i],
                    *(["", "", "", ""] if f < 0 else [daten["u80"][f], daten["o80"][f], daten["u95"][f], daten["o95"][f]])])

# Kontrollausgabe
jahr = lambda j: [i for i in range(N_IST + N_FC) if START + i // 12 == j]
wert = lambda i: daten["ist"][i] if i < N_IST else daten["modell"][i]
for j in (2024, 2025, 2026, 2027, 2028):
    print(j, "Summe (Ist bzw. Prognose)", sum(wert(i) for i in jahr(j)))
print(f"R² {r2:.3f}  MAPE {mape:.2f} %  s {s:.1f}  df {df}  t80 {t80:.3f}  t95 {t95:.3f}  Trend {b[1]:.2f} Stück/Monat")
print("Intervallhalbbreite 95 %: erster", round(t95 * se[0]), "letzter", round(t95 * se[-1]))
print("Prognose 2028:", [daten["modell"][i] for i in jahr(2028)])
print("u95 min", min(daten["u95"]))
