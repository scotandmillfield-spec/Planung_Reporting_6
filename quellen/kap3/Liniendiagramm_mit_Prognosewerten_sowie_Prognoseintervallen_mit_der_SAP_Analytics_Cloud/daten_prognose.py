"""Daten für Abb. 3.194 „Liniendiagramm mit Prognosewerten sowie Prognoseintervallen“ – Modellvergleich.

Monatlicher Absatz in Stück, Ist Januar 2024 bis Juni 2027 (42 Monate), für ein erfundenes Sortiment eines
Haushalts- und Gartengeräteherstellers: drei Produktgruppen mit je zwei Einzelprodukten, Gruppen und Gesamt als Summe.
Jede Reihe hat eine eigene Geschichte (stabiler Trend, Trendbruch, Niveausprung, Zufallspfad), damit nicht überall
dasselbe Modell gewinnt. Ist erfunden mit festem Seed; alle Modellwerte, Prognosen und Intervalle sind tatsächlich
berechnet (nur numpy/scipy, keine weiteren Pakete):

  1 Saisonale Regression  Trend + Monatsdummies (OLS), Intervall y0 ± t · s · sqrt(1 + x0'(X'X)^-1 x0)
  2 ARIMA                  saisonales „Airline“-Modell (0,1,1)(0,1,1)12, Schätzung über bedingte Fehlerquadratsumme,
                           Intervall aus den psi-Gewichten
  3 Holt-Winters           additive exponentielle Glättung mit Trend und Saison (ETS(A,A,A)), α, β, γ optimiert,
                           Intervall nach der analytischen Varianzformel
  4 Prophet-Ansatz         nachgebildet nach dem Aufbau von Prophet: stückweise linearer Trend mit Knickpunkten
                           (Laplace-Prior, hier per gewichteter L1-Schätzung) + Fourier-Saisonalität (Ordnung 4);
                           Intervall durch Simulation künftiger Trendknicke und Störgrößen (2.000 Pfade)

Modellwahl: Testjahr Juli 2026 bis Juni 2027 – jedes Modell wird auf den 30 Monaten davor geschätzt und prognostiziert
die 12 Testmonate; Gütemaß ist der MAPE (mittlerer absoluter Prozentfehler) im Testjahr. Bestes Modell = kleinster
Test-MAPE. Danach wird jedes Modell auf allen 42 Monaten neu geschätzt und prognostiziert Juli 2027 bis Dezember 2028
(18 Monate) mit Intervallen 80 % und 95 %. Zusätzlich: MAPE der Anpassung (Modellwerte gegenüber Ist, 42 Monate).
Ausgabe: prognose.json und prognose.csv (eine Zeile je Reihe, Modell und Monat).
"""
import csv
import json
import os

import numpy as np
from scipy import optimize, stats

HIER = os.path.dirname(os.path.abspath(__file__))
MON = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"]
N_IST, N_FC, N_TEST, START, M = 42, 18, 12, 2024, 12
MODELLE = ["Saisonale Regression", "ARIMA", "Holt-Winters", "Prophet-Ansatz"]

# ------------------------------------------------------------------ Ist-Daten
SAISON = {
    "garten": [0.35, 0.45, 0.80, 1.50, 1.75, 1.55, 1.30, 1.10, 0.80, 0.55, 0.40, 0.35],
    "klima": [0.30, 0.30, 0.45, 0.65, 1.05, 1.75, 2.30, 2.05, 1.05, 0.50, 0.35, 0.30],
    "kueche": [0.80, 0.75, 0.85, 0.85, 0.90, 0.85, 0.80, 0.85, 0.95, 1.10, 1.50, 1.90],
}
t = np.arange(N_IST)


def reihe(seed, saison, basis, trend, rausch, knick=None, sprung=None, irrfahrt=0.0, mult=False):
    rng = np.random.default_rng(seed)
    s = np.array(SAISON[saison])[t % M]
    niveau = basis + trend * t
    if knick:                                  # Trendbruch: ab Monat k zusätzliche Steigung
        k, zus = knick
        niveau = niveau + zus * np.maximum(0, t - k)
    if sprung:                                 # Niveausprung ab Monat k
        k, h = sprung
        niveau = niveau + h * (t >= k)
    if irrfahrt:
        niveau = niveau + np.cumsum(rng.normal(0, irrfahrt, N_IST))
    y = niveau * s if mult else niveau + basis * (s - 1)
    y = y * (1 + rng.normal(0, rausch, N_IST))
    return np.maximum(5, np.round(y))


PRODUKTE = [  # Gruppe, Produkt, Ist
    ("Gartentechnik", "Rasenmäher RM 40", reihe(11, "garten", 900, 4.0, 0.05)),
    ("Gartentechnik", "Heckenschere HS 2", reihe(12, "garten", 380, 1.2, 0.08, irrfahrt=14)),
    ("Klimatechnik", "Ventilator VT 12", reihe(21, "klima", 620, -2.0, 0.07, sprung=(30, -60), mult=True)),
    ("Klimatechnik", "Klimagerät KG 9", reihe(22, "klima", 320, 1.0, 0.06, knick=(18, 7.0))),
    ("Küchengeräte", "Küchenmaschine KM 5", reihe(31, "kueche", 640, 2.0, 0.04, sprung=(27, 130), mult=True)),
    ("Küchengeräte", "Kaffeevollautomat KV 7", reihe(32, "kueche", 520, 0.0, 0.03, irrfahrt=22, mult=True)),
]
GRUPPEN = list(dict.fromkeys(g for g, _, _ in PRODUKTE))
REIHEN = [("Gesamt", "gesamt", None, sum(p[2] for p in PRODUKTE))]
for g in GRUPPEN:
    REIHEN.append((g, "gruppe", "Gesamt", sum(p[2] for p in PRODUKTE if p[0] == g)))
    REIHEN += [(n, "produkt", g, y) for gg, n, y in PRODUKTE if gg == g]


# ------------------------------------------------------------------ Modelle: fit(y, h) -> dict
def regression(y, h):
    n = len(y)

    def X_von(ts):
        X = np.zeros((len(ts), 13))
        X[:, 0], X[:, 1] = 1.0, ts
        for i, tt in enumerate(ts):
            if tt % M:
                X[i, 1 + tt % M] = 1.0
        return X
    X = X_von(np.arange(n))
    XtX = np.linalg.inv(X.T @ X)
    b = XtX @ X.T @ y
    fit = X @ b
    res = y - fit
    df = n - 13
    s = np.sqrt(res @ res / df)
    Xf = X_von(np.arange(n, n + h))
    fc = Xf @ b
    se = s * np.sqrt(1 + np.einsum("ij,jk,ik->i", Xf, XtX, Xf))
    r2 = 1 - res @ res / ((y - y.mean()) @ (y - y.mean()))
    q = {lv: stats.t.ppf(0.5 + lv / 200, df) for lv in (80, 95)}
    return dict(fit=fit, fc=fc, int={lv: (fc - q[lv] * se, fc + q[lv] * se) for lv in q},
                kenn={"R2": r2, "trend": b[1]})


def airline(y, h):
    n = len(y)
    w = y[13:] - y[12:-1] - y[1:-12] + y[:-13]           # (1-B)(1-B^12) y

    def fehler(p):
        th, Th = p
        e = np.zeros(len(w))
        for i in range(len(w)):
            e[i] = w[i] - th * (e[i - 1] if i >= 1 else 0) - Th * (e[i - 12] if i >= 12 else 0) \
                - th * Th * (e[i - 13] if i >= 13 else 0)
        return e
    best = optimize.minimize(lambda p: np.sum(fehler(p) ** 2), [-0.4, -0.4], bounds=[(-0.95, 0.95)] * 2, method="L-BFGS-B")
    th, Th = best.x
    e = fehler(best.x)
    sig2 = e @ e / (len(w) - 2)
    # Modellwerte (Ein-Schritt-Prognosen) für t >= 13, davor Ist
    fit = y.copy().astype(float)
    fit[13:] = y[13:] - e
    # Prognose rekursiv
    yy, ee = list(y.astype(float)), list(np.concatenate([np.zeros(13), e]))
    for k in range(h):
        i = n + k
        wv = th * ee[i - 1] + Th * ee[i - 12] + th * Th * ee[i - 13]
        yy.append(yy[i - 1] + yy[i - 12] - yy[i - 13] + wv)
        ee.append(0.0)
    fc = np.array(yy[n:])
    # psi-Gewichte von (1+θB)(1+ΘB^12) / ((1-B)(1-B^12))
    ma = np.zeros(h + 14)
    ma[0], ma[1], ma[12], ma[13] = 1, th, Th, th * Th
    psi = np.zeros(h)
    for j in range(h):
        psi[j] = ma[j] + (psi[j - 1] if j >= 1 else 0) + (psi[j - 12] if j >= 12 else 0) - (psi[j - 13] if j >= 13 else 0)
    se = np.sqrt(sig2 * np.cumsum(psi ** 2))
    n_eff = len(w)
    aic = n_eff * np.log(e @ e / n_eff) + 2 * 3
    return dict(fit=fit, fc=fc, int={lv: (fc - stats.norm.ppf(0.5 + lv / 200) * se, fc + stats.norm.ppf(0.5 + lv / 200) * se)
                                     for lv in (80, 95)}, kenn={"theta": th, "Theta": Th, "AIC": aic})


def holt_winters(y, h):
    n = len(y)
    l0 = y[:M].mean()
    b0 = (y[M:2 * M].mean() - y[:M].mean()) / M
    s0 = np.array([np.mean([y[i] - (l0 + b0 * (i - 5.5)), y[i + M] - (l0 + b0 * (i + M - 5.5))]) for i in range(M)])
    s0 -= s0.mean()

    def lauf(p, voll=False):
        a, bb, g = p
        lv, tr, sz = l0 - b0 * 0, b0, list(s0)
        lv = l0 - b0 * 5.5 - b0           # Niveau vor dem ersten Monat
        fit, err = np.zeros(n), np.zeros(n)
        for i in range(n):
            sv = sz[i]
            f = lv + tr + sv
            fit[i], err[i] = f, y[i] - f
            ln = lv + tr + a * err[i]
            tr = tr + a * bb * err[i]
            sz.append(sv + g * err[i])
            lv = ln
        return (fit, err, lv, tr, sz) if voll else err @ err
    best = optimize.minimize(lauf, [0.3, 0.1, 0.2], bounds=[(0.01, 0.99), (0.01, 0.99), (0.01, 0.99)], method="L-BFGS-B")
    a, bb, g = best.x
    fit, err, lv, tr, sz = lauf(best.x, True)
    sig2 = err @ err / (n - 3 - 14)
    fc = np.array([lv + (k + 1) * tr + sz[n + (k % M)] for k in range(h)])
    beta = a * bb
    var = np.array([sig2 * (1 + sum((a + beta * j + g * (1 if j % M == 0 else 0)) ** 2 for j in range(1, k + 1)))
                    for k in range(h)])
    se = np.sqrt(var)
    return dict(fit=fit, fc=fc, int={lv_: (fc - stats.norm.ppf(0.5 + lv_ / 200) * se, fc + stats.norm.ppf(0.5 + lv_ / 200) * se)
                                     for lv_ in (80, 95)}, kenn={"alpha": a, "beta": bb, "gamma": g})


def prophet_ansatz(y, h, seed=7):
    n = len(y)
    skala = np.abs(y).max()
    ys = y / skala
    ts = np.arange(n + h) / (n - 1)                     # Zeit auf [0, 1] im Ist skaliert
    cps = np.linspace(0, 0.8, 16)[1:]                  # 15 mögliche Knickpunkte in den ersten 80 %
    K = 4

    def X_von(tt, idx):
        cols = [np.ones(len(tt)), tt] + [np.maximum(0, tt - c) for c in cps]
        mon = idx % M
        for k in range(1, K + 1):
            cols += [np.sin(2 * np.pi * k * mon / M), np.cos(2 * np.pi * k * mon / M)]
        return np.column_stack(cols)
    X = X_von(ts[:n], np.arange(n))
    tau, sig = 0.05, 0.05
    pen = np.zeros(X.shape[1])
    beta = np.linalg.lstsq(X, ys, rcond=None)[0]
    for _ in range(60):                                 # IRLS für Laplace-Prior auf die Knicke
        d = beta[2:2 + len(cps)]
        pen[:] = 0
        pen[2:2 + len(cps)] = sig ** 2 / (tau * (np.abs(d) + 1e-4))
        beta = np.linalg.solve(X.T @ X + np.diag(pen), X.T @ ys)
        res = ys - X @ beta
        sig = max(1e-3, np.sqrt(res @ res / n))
    fit = X @ beta * skala
    deltas = beta[2:2 + len(cps)]
    Xf = X_von(ts[n:], np.arange(n, n + h))
    fc = Xf @ beta * skala
    # Unsicherheit wie in Prophet: künftige Knicke mit gleicher Häufigkeit und mittlerer Stärke, dazu Rauschen
    rng = np.random.default_rng(seed)
    lam = max(np.mean(np.abs(deltas)), 1e-8)
    p_knick = len(cps) / (0.8 * n)                      # Knicke je Monat im Ist
    S = 2000
    dt = 1 / (n - 1)
    knicke = (rng.random((S, h)) < p_knick) * rng.laplace(0, lam, (S, h))
    slope_add = np.cumsum(knicke, axis=1)
    trend_add = np.cumsum(slope_add * dt, axis=1)
    p_eff = 2 + 2 * K + int(np.sum(np.abs(deltas) > 1e-3))        # wirksame Parameter
    sig_p = np.sqrt(np.sum((ys - X @ beta) ** 2) / max(1, n - p_eff))
    pfade = (fc / skala + trend_add + rng.normal(0, sig_p, (S, h))) * skala
    q = {80: (10, 90), 95: (2.5, 97.5)}
    n_knick = int(np.sum(np.abs(deltas) * skala / (n - 1) > 1.0))   # Knicke mit mehr als 1 Stück/Monat
    return dict(fit=fit, fc=fc, int={lv: (np.percentile(pfade, a, axis=0), np.percentile(pfade, b, axis=0))
                                     for lv, (a, b) in q.items()}, kenn={"knicke": n_knick, "K": K})


VERFAHREN = [regression, airline, holt_winters, prophet_ansatz]
mape = lambda ist, mod: float(np.mean(np.abs(ist - mod) / ist) * 100)

# ------------------------------------------------------------------ Rechnen
r0 = lambda a: [int(round(v)) for v in a]
labels = [f"{MON[i % M]} {START + i // M}" for i in range(N_IST + N_FC)]
aus_reihen = []
for name, ebene, eltern, y in REIHEN:
    y = y.astype(float)
    erg = []
    for vi, f in enumerate(VERFAHREN):
        test = f(y[:N_IST - N_TEST], N_TEST)
        voll = f(y, N_FC)
        m_test = mape(y[N_IST - N_TEST:], test["fc"])
        m_fit = mape(y[13:], voll["fit"][13:])        # ab Monat 14, weil ARIMA davor keine Modellwerte hat
        u80, o80 = voll["int"][80]
        u95, o95 = voll["int"][95]
        erg.append({"fit": r0(voll["fit"]), "fc": r0(voll["fc"]), "test": r0(test["fc"]),
                    "u80": r0(np.maximum(0, u80)), "o80": r0(o80), "u95": r0(np.maximum(0, u95)), "o95": r0(o95),
                    "mapeTest": round(m_test, 2), "mapeFit": round(m_fit, 2),
                    "kenn": {k: round(float(v), 3) for k, v in voll["kenn"].items()}})
    bestes = int(np.argmin([e["mapeTest"] for e in erg]))
    aus_reihen.append({"name": name, "ebene": ebene, "eltern": eltern, "ist": r0(y), "modelle": erg, "bestes": bestes})

daten = {"monate": labels, "nIst": N_IST, "nTest": N_TEST, "modelle": MODELLE, "reihen": aus_reihen}
json.dump(daten, open(os.path.join(HIER, "prognose.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
with open(os.path.join(HIER, "prognose.csv"), "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh, delimiter=";", lineterminator="\r\n")
    w.writerow(["Reihe", "Ebene", "Produktgruppe", "Modell", "Bestes_Modell", "Monat", "Art", "Ist_Stueck", "Modellwert_Stueck",
                "Testprognose_Stueck", "Untergrenze_80", "Obergrenze_80", "Untergrenze_95", "Obergrenze_95",
                "MAPE_Test_Prozent", "MAPE_Anpassung_Prozent"])
    for r in aus_reihen:
        for mi, e in enumerate(r["modelle"]):
            for i, lab in enumerate(labels):
                f = i - N_IST
                ist = i < N_IST
                tp = e["test"][i - (N_IST - N_TEST)] if N_IST - N_TEST <= i < N_IST else ""
                w.writerow([r["name"], r["ebene"], r["eltern"] if r["ebene"] == "produkt" else r["name"] if r["ebene"] == "gruppe" else "",
                            MODELLE[mi], "ja" if mi == r["bestes"] else "nein", lab, "Ist" if ist else "Prognose",
                            r["ist"][i] if ist else "", e["fit"][i] if ist else e["fc"][f], tp,
                            *(["", "", "", ""] if ist else [e["u80"][f], e["o80"][f], e["u95"][f], e["o95"][f]]),
                            str(e["mapeTest"]).replace(".", ","), str(e["mapeFit"]).replace(".", ",")])

# ------------------------------------------------------------------ Kontrollausgabe
for r in aus_reihen:
    jahr = lambda j, e: sum(r["ist"][i] if i < N_IST else e["fc"][i - N_IST] for i in range(N_IST + N_FC) if START + i // M == j)
    print(f"{r['name']:24s} Ist 2026 {jahr(2026, r['modelle'][0]):>6}  bestes: {MODELLE[r['bestes']]:20s} | " +
          " | ".join(f"{MODELLE[mi][:6]} MAPE {e['mapeTest']:5.1f}/{e['mapeFit']:4.1f} 2028 {jahr(2028, e):>6}"
                     f" ±{np.mean(np.array(e['o95'][-12:]) - np.array(e['u95'][-12:])) / 2:5.0f}"
                     for mi, e in enumerate(r["modelle"])))
