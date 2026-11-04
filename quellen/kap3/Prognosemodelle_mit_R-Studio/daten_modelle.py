"""Daten für Abb. 3.195 „Prognosemodelle mit R-Studio“ (in Anlehnung an Oehler 2019, S. 111).

Monatlicher Absatz in Stück, Januar 2023 bis Dezember 2026 (48 Monate), mit den Treibern Verkaufspreis (€ je Stück)
und Werbebudget (Tsd. €) sowie dem Quartal – erfunden mit festem Seed.
Drei lineare Regressionsmodelle, nacheinander um einen Treiber erweitert (Kleinste-Quadrate-Schätzung):
  M1  Absatz = b0 + b1 * Preis
  M2  Absatz = b0 + b1 * Preis + b2 * Werbung                         (Standard, R² ≈ 0,85 wie im Original)
  M3  Absatz = b0 + b1 * Preis + b2 * Werbung + Quartalseffekte Q2–Q4
Je Modell: Koeffizienten mit Standardfehler und t-Wert, R², korrigiertes R², Standardfehler der Regression, MAPE,
Modellwerte (vorhergesagt) und die Ausgleichsgerade „Modellwert auf Ist“ (Steigung = R², wie in der Vorlage
„Linear Anpassung auf die Punkte“). Pseudo-R² (quadrierte Korrelation Modellwert/Ist) = R² bei linearer Regression.
Ausgabe: modelle.json und modelle.csv (eine Zeile je Monat).
"""
import csv
import json
import os

import numpy as np

HIER = os.path.dirname(os.path.abspath(__file__))
MON = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"]
N, START = 48, 2023

rng = np.random.default_rng(103)
preis = np.round(rng.uniform(38, 56, N), 1)
werbung = np.round(rng.uniform(8, 62, N))
quartal = (np.arange(N) % 12) // 3
absatz = np.round(3250 - 42 * preis + 18 * werbung + np.array([0, 80, 120, -60])[quartal] + rng.normal(0, 150, N))

eins = np.ones(N)
q = [(quartal == k).astype(float) for k in (1, 2, 3)]
MODELLE = [
    ("M1", "Preis", ["Konstante", "Preis"], np.c_[eins, preis]),
    ("M2", "Preis + Werbung", ["Konstante", "Preis", "Werbung"], np.c_[eins, preis, werbung]),
    ("M3", "Preis + Werbung + Quartal", ["Konstante", "Preis", "Werbung", "Q2", "Q3", "Q4"],
     np.c_[eins, preis, werbung, *q]),
]

modelle = []
for key, name, namen, X in MODELLE:
    XtX_inv = np.linalg.inv(X.T @ X)
    b = XtX_inv @ X.T @ absatz
    f = X @ b
    r = absatz - f
    p = X.shape[1]
    df = N - p
    s = float(np.sqrt(r @ r / df))
    sst = float((absatz - absatz.mean()) @ (absatz - absatz.mean()))
    r2 = 1 - float(r @ r) / sst
    r2k = 1 - (1 - r2) * (N - 1) / df
    se = np.sqrt(np.diag(XtX_inv)) * s
    pseudo = float(np.corrcoef(f, absatz)[0, 1] ** 2)
    assert abs(pseudo - r2) < 1e-9
    steig = float(np.cov(f, absatz)[0, 1] / np.var(absatz, ddof=1))      # Ausgleichsgerade Modellwert auf Ist
    achse = float(f.mean() - steig * absatz.mean())
    modelle.append({
        "key": key, "name": name,
        "koeff": [{"name": n, "b": round(float(bb), 2), "se": round(float(ss), 2), "t": round(float(bb / ss), 2)}
                  for n, bb, ss in zip(namen, b, se)],
        "r2": round(r2, 4), "r2k": round(r2k, 4), "s": round(s, 1), "df": df,
        "mape": round(float(np.mean(np.abs(r) / absatz) * 100), 2),
        "gerade": [round(achse, 2), round(steig, 4)], "wert": [int(round(v)) for v in f],
    })

monate = [f"{MON[i % 12]} {START + i // 12}" for i in range(N)]
daten = {"monate": monate, "absatz": [int(v) for v in absatz], "preis": [float(v) for v in preis],
         "werbung": [int(v) for v in werbung], "quartal": [int(v) + 1 for v in quartal], "modelle": modelle,
         "standard": "M2"}
json.dump(daten, open(os.path.join(HIER, "modelle.json"), "w", encoding="utf-8"), ensure_ascii=False,
          separators=(",", ":"))
with open(os.path.join(HIER, "modelle.csv"), "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh, delimiter=";", lineterminator="\r\n")
    w.writerow(["Monat", "Jahr", "Quartal", "Preis_EUR", "Werbung_TEUR", "Absatz_Stueck",
                "Modellwert_M1", "Modellwert_M2", "Modellwert_M3"])
    for i in range(N):
        w.writerow([monate[i], START + i // 12, daten["quartal"][i], f"{preis[i]:.1f}".replace(".", ","),
                    daten["werbung"][i], daten["absatz"][i], *[m["wert"][i] for m in modelle]])

# Kontrollausgabe
print("Absatz Summe", int(absatz.sum()), "min", int(absatz.min()), "max", int(absatz.max()),
      "Preis", preis.min(), "–", preis.max(), "Werbung", werbung.min(), "–", werbung.max())
for m in modelle:
    print(m["key"], m["name"], "R²", m["r2"], "korr.", m["r2k"], "s", m["s"], "MAPE", m["mape"], "Gerade", m["gerade"],
          "| " + ", ".join(f"{k['name']} {k['b']} (t {k['t']})" for k in m["koeff"]))
