"""Gemeinsames Planungsmodell der Serie Abb. 5.78–5.82 (Planungs- und Konsolidierungssoftware, softwareneutral).

Ein Konzern mit Gesellschaften in Europa, Amerika und Asien plant das Jahr 2028 (Szenario Plan, Version Bottom-up)
gegen das Ist 2027; Stand 14.10.2027. Im Planzyklus sind fünf Gesellschaften gestartet (Deutschland,
Großbritannien, USA, Australien, Japan), die übrigen sind ausgeschlossen und haben keine Planwerte.
Produkte: Fahrräder (Cityräder, E-Bikes) und Zubehör (Helme), je Produktgruppe zwei Produkte.

Grain der Absatzplanung: Gesellschaft x Kunde x Vertriebsart x Produkt x Monat (Stück), Ist 2027 und Plan 2028,
dazu je Seite (Gesellschaft, Kunde, Vertriebsart) eine Top-down-Vorgabe auf „Alle Produkte, Jahr“.
Regel „Top-down-Vorgabe verteilen“: Vorgabe nach dem Ist je Produkt auf die Produkte, dann nach dem Ist je Monat
auf die Monate (ganzzahlig, größte Reste) – dieselbe Rechnung wie in der Maske 5.78 (zielvorgaben.js).
Seite Deutschland, Großkunde 1, Normalgeschäft wie im Original von Abb. 5.78: Ist 4.018 / 4.521 Stück je
Produktgruppe, Vorgabe 10.000, Bottom-up = verteilte Vorgabe mit den Monatswerten Jan–Jul des Originals.

Umsatzmodell (Abb. 5.79): Verkaufspreis = Listenpreis x (1 − Rabatt); Nettoumsatz = Absatz x Verkaufspreis;
Frachtkosten = Nettoumsatz x Frachtkostensatz; Wareneinsatz = Absatz x (Std.-Material- + Std.-Fertigungskosten);
Zugang Produktion je Gesellschaft und Produkt gleichmäßig über das Jahr; Bestandsveränderung = (Produktion − Absatz)
x Standardkosten; Fertigungsmaterial/-löhne = Produktion x Std.-Kosten. GuV (Abb. 5.80) nach dem
Gesamtkostenverfahren; Abschreibungen = Bestand + Abschreibungen aus der Investitionsplanung (Abb. 5.81).
Workflow (Abb. 5.82): Prozessstatus und Eigentümer der Planungseinheiten wie im Original, Personen fiktiv.

Wird von den anderen Abbildungen der Serie per runpy ausgeführt (run_name ≠ "__main__") und liefert MODELL sowie
die Hilfsfunktion einsetzen(); als Hauptprogramm setzt es den Datenblock in zielvorgaben.js (Abb. 5.78) ein und
gibt Kontrollsummen aus.
"""
import json
import math
import os
import random
import re

HIER = os.path.dirname(os.path.abspath(__file__))
STAND = "14.10.2027"
JAHR_IST, JAHR_PLAN = 2027, 2028
MONATE = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"]

# ---------------------------------------------------------------- Gesellschaften (Einheiten)
BAUM = ["Konzern", [
    ["Europa", ["Deutschland", "Großbritannien", "Dänemark", "Polen", "Russland", "Frankreich", "Österreich", "Schweiz"]],
    ["Amerika", ["USA", "Kanada", "Brasilien"]],
    ["Asien", ["Australien", "China", "Hongkong", "Japan", "Neuseeland", "Singapur"]],
]]
AKTIV = ["Deutschland", "Großbritannien", "USA", "Australien", "Japan"]       # im Planzyklus gestartet
SKALA = {"Deutschland": 1.0, "Großbritannien": 0.46, "USA": 0.72, "Australien": 0.21, "Japan": 0.33}
FRACHTSATZ = {"Deutschland": 0.025, "Großbritannien": 0.035, "USA": 0.040, "Australien": 0.055, "Japan": 0.045}
USTSATZ = {"Deutschland": 0.19, "Großbritannien": 0.20, "USA": 0.07, "Australien": 0.10, "Japan": 0.10}

# Personen (fiktiv) und Rollen
PERSONEN = {"albers": ["Herr Albers", "Konzerncontrolling"], "brandt": ["Frau Brandt", "Controlling Deutschland"],
            "roth": ["Herr Roth", "Kostenstellenleitung Deutschland"], "kaya": ["Frau Kaya", "Controlling Amerika"]}

# Workflow wie im Original (Abb. 5.82): Einheit -> (Status, Eigentümer); nicht genannte Einheiten: nicht gestartet
WORKFLOW = {"Konzern": ("Wird überprüft", None), "Europa": ("Wird überprüft", "brandt"),
            "Deutschland": ("Wird überprüft", "brandt"), "Großbritannien": ("Genehmigt", "albers"),
            "Amerika": ("Wird überprüft", "kaya"), "USA": ("Wird überprüft", "kaya"),
            "Asien": ("Genehmigt", "albers"), "Australien": ("Genehmigt", "albers"), "Japan": ("Genehmigt", "albers")}
# Verlauf je Planungseinheit: Datum, Uhrzeit, Person, Aktion, Status danach, Eigentümer danach, Anmerkung
VERLAUF = {
    "Deutschland": [["01.10.2027", "08:12", "albers", "Planzyklus gestartet", "Erste Bearbeitung", "roth", ""],
                    ["13.10.2027", "12:04", "roth", "Weitergeleitet", "Wird überprüft", "brandt", "Bitte um Feedback."]],
    "Großbritannien": [["01.10.2027", "08:12", "albers", "Planzyklus gestartet", "Erste Bearbeitung", "albers", ""],
                       ["08.10.2027", "16:30", "albers", "Genehmigt", "Genehmigt", "albers", "Freigabe ohne Änderungen."]],
    "USA": [["01.10.2027", "08:14", "albers", "Planzyklus gestartet", "Erste Bearbeitung", "kaya", ""],
            ["12.10.2027", "18:45", "kaya", "Weitergeleitet", "Wird überprüft", "kaya", ""]],
    "Australien": [["01.10.2027", "08:15", "albers", "Planzyklus gestartet", "Erste Bearbeitung", "albers", ""],
                   ["11.10.2027", "09:05", "albers", "Genehmigt", "Genehmigt", "albers", ""]],
    "Japan": [["01.10.2027", "08:15", "albers", "Planzyklus gestartet", "Erste Bearbeitung", "albers", ""],
              ["11.10.2027", "09:20", "albers", "Genehmigt", "Genehmigt", "albers", ""]],
}

# ---------------------------------------------------------------- Produkte, Kunden, Vertriebsarten
LINIEN = [["Fahrräder", [["Cityräder", ["City 26", "City 28"]], ["E-Bikes", ["E-City", "E-Trekking"]]]],
          ["Zubehör", [["Helme", ["Helm Urban", "Helm Sport"]]]]]
PRODUKTE = [p for _, gs in LINIEN for _, ps in gs for p in ps]
GRUPPE = {p: g for _, gs in LINIEN for g, ps in gs for p in ps}
LINIE = {p: l for l, gs in LINIEN for _, ps in gs for p in ps}
# Listenpreis € je Stück (Plan 2028; Ist 2027 rund 3 % niedriger), Standardmaterial- und -fertigungskosten € je Stück
LISTENPREIS = {"City 26": 590, "City 28": 690, "E-City": 2290, "E-Trekking": 2690, "Helm Urban": 69, "Helm Sport": 99}
LISTENPREIS_IST = {"City 26": 575, "City 28": 670, "E-City": 2230, "E-Trekking": 2610, "Helm Urban": 67, "Helm Sport": 96}
STD_MK = {"City 26": 280, "City 28": 320, "E-City": 1180, "E-Trekking": 1390, "Helm Urban": 21, "Helm Sport": 31}
STD_FK = {"City 26": 85, "City 28": 95, "E-City": 240, "E-Trekking": 270, "Helm Urban": 8, "Helm Sport": 11}
STD_MK_IST = {p: round(v * 0.98) for p, v in STD_MK.items()}
STD_FK_IST = {p: round(v * 0.97) for p, v in STD_FK.items()}
KUNDEN = ["Großkunde 1", "Großkunde 2", "Fachhandel"]
VERTRIEBSARTEN = ["Normalgeschäft", "Aktionsgeschäft"]
RABATT = {("Großkunde 1", "Normalgeschäft"): 0.14, ("Großkunde 1", "Aktionsgeschäft"): 0.20,
          ("Großkunde 2", "Normalgeschäft"): 0.12, ("Großkunde 2", "Aktionsgeschäft"): 0.18,
          ("Fachhandel", "Normalgeschäft"): 0.05, ("Fachhandel", "Aktionsgeschäft"): 0.10}
# Jahresmenge Ist 2027 in Deutschland je Kunde, Vertriebsart, Produkt (andere Gesellschaften skaliert)
MENGE_DE = {
    ("Großkunde 1", "Normalgeschäft"): {"City 26": 1689, "City 28": 2329, "E-City": 1718, "E-Trekking": 2803},
    ("Großkunde 1", "Aktionsgeschäft"): {"City 26": 260, "City 28": 340, "E-City": 150, "E-Trekking": 210},
    ("Großkunde 2", "Normalgeschäft"): {"City 26": 1350, "City 28": 1800, "E-City": 1200, "E-Trekking": 1650,
                                         "Helm Urban": 2400, "Helm Sport": 1300},
    ("Großkunde 2", "Aktionsgeschäft"): {"City 26": 220, "City 28": 260, "E-City": 120, "E-Trekking": 140,
                                          "Helm Urban": 600, "Helm Sport": 250},
    ("Fachhandel", "Normalgeschäft"): {"City 26": 900, "City 28": 1300, "E-City": 1450, "E-Trekking": 2100,
                                        "Helm Urban": 7200, "Helm Sport": 5600},
    ("Fachhandel", "Aktionsgeschäft"): {"City 26": 120, "City 28": 160, "E-City": 140, "E-Trekking": 180,
                                         "Helm Urban": 1500, "Helm Sport": 900},
}
SAISON_RAD = [0.94, 1.13, 1.12, 0.98, 0.79, 0.94, 1.09, 1.24, 1.02, 0.96, 0.88, 0.91]
SAISON_HELM = [0.70, 0.78, 1.10, 1.32, 1.36, 1.24, 1.12, 1.02, 0.92, 0.82, 0.74, 0.88]
SAISON_AKTION = [0.2, 0.3, 2.2, 2.0, 0.6, 0.3, 0.2, 0.3, 2.1, 1.9, 0.7, 1.2]

# Original Abb. 5.78 (Seite Deutschland, Großkunde 1, Normalgeschäft): Bottom-up je Produktgruppe Jan–Jul
ORIG_SEITE = ("Deutschland", "Großkunde 1", "Normalgeschäft")
ORIG_VORGABE = 10000
ORIG_GRUPPE_MONATE = {"Cityräder": [417, 443, 482, 443, 312, 353, 417, 470, 388, 352, 300, 328],   # Aug–Dez ergänzt
                      "E-Bikes": [365, 498, 454, 376, 349, 430, 495, 560, 480, 455, 400, 433]}

# ---------------------------------------------------------------- Investitionsplanung (Abb. 5.81)
# Gesellschaft -> Kostenstelle -> [Investition, Positionsanmerkung, Anschaffungswert €, Nutzungsdauer Jahre,
#                                  Restwert €, Anschaffungsmonat 1–12, Durchführung 1/0]
INVESTITIONEN = {
    "Deutschland": {
        "Sonstige Kostenstellen": [["Investition 1", "Büromöbel", 6000, 5, 0, 3, 1],
                                   ["Investition 2", "Medientechnik", 18000, 6, 0, 6, 1]],
        "Fertigung": [["Investition 1", "Montagelinie E-Bikes", 480000, 10, 0, 4, 1],
                      ["Investition 2", "Prüfstand Antriebe", 96000, 8, 0, 9, 0]],
        "Vertrieb": [["Investition 1", "Showroom", 36000, 5, 0, 2, 1]],
    },
    "Großbritannien": {"Sonstige Kostenstellen": [["Investition 1", "Büromöbel", 4800, 5, 0, 5, 1]],
                       "Vertrieb": [["Investition 1", "Lieferfahrzeug", 42000, 6, 6000, 7, 1]]},
    "USA": {"Fertigung": [["Investition 1", "Lackieranlage", 240000, 10, 0, 3, 1]],
            "Sonstige Kostenstellen": [["Investition 1", "Server", 21600, 3, 0, 1, 1]]},
    "Australien": {"Vertrieb": [["Investition 1", "Showroom", 24000, 5, 0, 8, 1]]},
    "Japan": {"Sonstige Kostenstellen": [["Investition 1", "Büromöbel", 7200, 5, 0, 4, 1]],
              "Fertigung": [["Investition 1", "Montagewerkzeuge", 60000, 5, 0, 10, 1]]},
}
# Anmerkungen je Planungseinheit (Szenario Plan 2028, Version Bottom-up, Einheit): neueste zuerst
ANMERKUNGEN = {
    "Deutschland": [["Status überprüfen – nicht beendet", "albers", "13.10.2027", "12:06", "Bitte überarbeiten."],
                    ["Status überprüfen – wird überprüft", "roth", "13.10.2027", "12:04", "Bitte um Feedback."]],
    "Großbritannien": [["Genehmigt", "albers", "08.10.2027", "16:30", "Freigabe ohne Änderungen."]],
    "USA": [["Daten eingeben – wird überprüft", "kaya", "12.10.2027", "18:45", "Lackieranlage nach Angebot vom 30.09.2027."]],
    "Australien": [],
    "Japan": [["Genehmigt", "albers", "11.10.2027", "09:20", "Werkzeugbudget wie besprochen."]],
}
# Abschreibungen auf den Anlagenbestand und Zinsen je Monat (€), Ist 2027 und Plan 2028
AFA_BESTAND = {"Deutschland": (61000, 58500), "Großbritannien": (21000, 20400), "USA": (39000, 37800),
               "Australien": (8200, 8000), "Japan": (14600, 14100)}
ZINSEN = {"Deutschland": (16800, 15400), "Großbritannien": (6100, 5800), "USA": (11200, 10600),
          "Australien": (2300, 2200), "Japan": (3900, 3700)}


def verteilen(summe, gewichte):
    """Ganzzahlig und summengetreu nach Gewichten verteilen (größte Reste, bei Gleichstand die vordere Stelle).
    Identisch in zielvorgaben.js umgesetzt: roh = summe * w / s, abrunden, Rest nach größtem Nachkommaanteil."""
    s = sum(gewichte)
    if not s or summe is None:
        return [0] * len(gewichte)
    roh = [summe * w / s for w in gewichte]
    ganz = [math.floor(r) for r in roh]
    rest = summe - sum(ganz)
    for i in sorted(range(len(roh)), key=lambda i: (-(roh[i] - ganz[i]), i))[:rest]:
        ganz[i] += 1
    return ganz


def regel_topdown(ist, vorgabe):
    """ist: {produkt: [12 Monate]} -> Bottom-up {produkt: [12]} aus der Vorgabe (Regel „Top-down-Vorgabe verteilen“)."""
    ps = [p for p in PRODUKTE if p in ist]
    jahr = verteilen(vorgabe, [sum(ist[p]) for p in ps])
    return {p: verteilen(j, ist[p]) for p, j in zip(ps, jahr)}, dict(zip(ps, jahr))


def ist_fuer_ziel(ist_jahr, td_jahr, bu_ziel):
    """Monats-Ist (Summe ist_jahr) suchen, das mit verteilen(td_jahr, ·) genau bu_ziel ergibt; None, wenn keins.
    Je Monat kommen nur Ist-Werte infrage, deren Anteil an td_jahr auf bu_ziel ab- oder aufgerundet wird."""
    r = td_jahr / ist_jahr
    kand = []
    for b in bu_ziel:
        a = math.floor(b / r)
        kand.append([x for x in range(a - 2, a + 3) if x >= 0 and b - 1 <= td_jahr * x / ist_jahr < b + 1])
    lo = [min(k) if k else 0 for k in kand]
    hi = [max(k) if k else 0 for k in kand]
    if any(not k for k in kand):
        return None
    wahl = []

    def dfs(m, rest):
        if m == 12:
            return rest == 0 and verteilen(td_jahr, wahl) == bu_ziel
        if rest < sum(lo[m:]) or rest > sum(hi[m:]):
            return False
        for x in kand[m]:
            wahl.append(x)
            if dfs(m + 1, rest - x):
                return True
            wahl.pop()
        return False

    return list(wahl) if dfs(0, ist_jahr) else None


rnd = random.Random(578)


def saison(p, va):
    s = SAISON_HELM if LINIE[p] == "Zubehör" else SAISON_RAD
    return [a * (b if va == "Aktionsgeschäft" else 1) for a, b in zip(s, SAISON_AKTION)]


# ---------------------------------------------------------------- Absatz je Seite
SEITEN = {}          # (g, k, v) -> {"ist": {p: [12]}, "td": int, "bu": {p: [12]}}
for g in AKTIV:
    for k in KUNDEN:
        for v in VERTRIEBSARTEN:
            basis = MENGE_DE[(k, v)]
            if (g, k, v) == ORIG_SEITE:
                ist_jahr = dict(basis)
                td_p = verteilen(ORIG_VORGABE, [ist_jahr[p] for p in basis])
                td_p = dict(zip(basis, td_p))
                ist, bu = {}, {}
                for grp, ziel in ORIG_GRUPPE_MONATE.items():
                    ps = [p for p in basis if GRUPPE[p] == grp]
                    # Gruppenziel je Monat auf die Produkte: Anteil des Produkts an der Gruppenvorgabe
                    anteil = [td_p[p] for p in ps]
                    rest = {p: td_p[p] for p in ps}
                    zeilen = {p: [0] * 12 for p in ps}
                    for m in range(12):
                        teil = verteilen(ziel[m], anteil)
                        for p, t in zip(ps, teil):
                            zeilen[p][m] = t
                    # Monatssummen je Produkt auf die Produktvorgabe abgleichen (größte Abweichung zuerst)
                    for _ in range(200):
                        d = {p: sum(zeilen[p]) - rest[p] for p in ps}
                        if not any(d.values()):
                            break
                        a = max(ps, key=lambda p: d[p]); b = min(ps, key=lambda p: d[p])
                        m = max(range(12), key=lambda m: zeilen[a][m])
                        zeilen[a][m] -= 1; zeilen[b][m] += 1
                    # Aufteilung auf die Produkte so lange tauschen (Zeilen- und Spaltensummen bleiben), bis zu
                    # jedem Produkt ein ganzzahliges Monats-Ist existiert, das die Regel genau so verteilt
                    such = random.Random(5780)
                    for _ in range(5000):
                        loes = {p: ist_fuer_ziel(ist_jahr[p], td_p[p], zeilen[p]) for p in ps}
                        if all(x is not None for x in loes.values()):
                            break
                        a, b = ps[0], ps[1]
                        m1, m2 = such.sample(range(12), 2)
                        if zeilen[a][m1] > 0 and zeilen[b][m2] > 0:
                            zeilen[a][m1] -= 1; zeilen[b][m1] += 1; zeilen[a][m2] += 1; zeilen[b][m2] -= 1
                    else:
                        raise SystemExit(f"Kein Monats-Ist für {grp} gefunden")
                    for p in ps:
                        bu[p] = zeilen[p]
                        ist[p] = loes[p]
                SEITEN[(g, k, v)] = {"ist": ist, "td": ORIG_VORGABE, "bu": bu}
                continue
            ist = {}
            for p, menge in basis.items():
                if k == "Großkunde 1" and LINIE[p] == "Zubehör":
                    continue
                if g == "Japan" and k == "Großkunde 2":
                    continue                                   # in Japan kein zweiter Großkunde
                j = round(menge * SKALA[g] * rnd.uniform(0.85, 1.15))
                w = [s * rnd.uniform(0.9, 1.1) for s in saison(p, v)]
                ist[p] = verteilen(j, w)
            if not ist:
                continue
            summe = sum(sum(x) for x in ist.values())
            td = int(round(summe * rnd.uniform(1.04, 1.15) / 50.0)) * 50
            regel, _ = regel_topdown(ist, td)
            if rnd.random() < 0.7:          # Planer hat die verteilte Vorgabe angepasst
                bu = {}
                for p, z in regel.items():
                    f = rnd.uniform(0.92, 1.04)
                    bu[p] = [max(0, round(x * f * rnd.uniform(0.97, 1.03))) for x in z]
            else:
                bu = regel
            SEITEN[(g, k, v)] = {"ist": ist, "td": td, "bu": bu}


# ---------------------------------------------------------------- Umsatzmodell und GuV je Gesellschaft, Produkt, Monat
def umsatzmodell(szen):
    """szen 0 = Ist 2027, 1 = Plan 2028. Liefert {g: {p: {kennzahl: [12]}}} in € bzw. Stück."""
    lp = LISTENPREIS_IST if szen == 0 else LISTENPREIS
    mk = STD_MK_IST if szen == 0 else STD_MK
    fk = STD_FK_IST if szen == 0 else STD_FK
    aus = {}
    for g in AKTIV:
        aus[g] = {}
        for p in PRODUKTE:
            absatz, umsatz = [0] * 12, [0.0] * 12
            for (gg, k, v), s in SEITEN.items():
                if gg != g:
                    continue
                z = s["ist" if szen == 0 else "bu"].get(p)
                if not z:
                    continue
                vk = lp[p] * (1 - RABATT[(k, v)])
                for m in range(12):
                    absatz[m] += z[m]
                    umsatz[m] += z[m] * vk
            if not sum(absatz):
                continue
            jahr = sum(absatz)
            prod = verteilen(round(jahr * (1.01 if szen == 0 else 1.02)), [1] * 12)
            hk = mk[p] + fk[p]
            aus[g][p] = {
                "absatz": absatz, "produktion": prod,
                "nettoumsatz": [round(u) for u in umsatz],
                "frachtkosten": [round(u * FRACHTSATZ[g]) for u in umsatz],
                "wareneinsatz": [a * hk for a in absatz],
                "bestandsveraenderung": [(q - a) * hk for q, a in zip(prod, absatz)],
                "fertigungsmaterial": [q * mk[p] for q in prod],
                "fertigungsloehne": [q * fk[p] for q in prod],
            }
    return aus


UM = [umsatzmodell(0), umsatzmodell(1)]


def afa_investitionen(g):
    """Monatliche Abschreibung aus der Investitionsplanung 2028 (linear ab Anschaffungsmonat)."""
    afa = [0.0] * 12
    for ks in INVESTITIONEN.get(g, {}).values():
        for name, anm, aw, nd, rw, mon, ja in ks:
            if not ja:
                continue
            for m in range(mon - 1, 12):
                afa[m] += (aw - rw) / (nd * 12)
    return afa


KOSTEN = [{}, {}]        # szen -> g -> konto -> [12]
SAISON_MARKETING = [0.7, 1.0, 1.5, 1.5, 1.2, 0.9, 0.8, 0.8, 1.1, 1.0, 0.7, 0.8]
for g in AKTIV:
    for szen in (0, 1):
        um = UM[szen][g]
        db = sum(sum(x["nettoumsatz"]) - sum(x["frachtkosten"]) - sum(x["wareneinsatz"]) for x in um.values())
        f = rnd.uniform(0.96, 1.04)
        personal = db * 0.43 * f * (1.0 if szen else 0.957)
        marketing = db * 0.14 * f * (1.0 if szen else 0.905)
        verwaltung = db * 0.11 * f * (1.0 if szen else 0.985)
        ver_p = [1, 1, 1, 1, 1, 1.5, 1, 1, 1, 1, 1.5, 1]
        k = {"personal": [round(x) for x in (personal * w / sum(ver_p) for w in ver_p)],
             "marketing": [round(x) for x in (marketing * w / sum(SAISON_MARKETING) for w in SAISON_MARKETING)],
             "verwaltung": [round(verwaltung / 12)] * 12}
        afa_b, zins = AFA_BESTAND[g][szen], ZINSEN[g][szen]
        inv = afa_investitionen(g) if szen == 1 else [0.0] * 12
        k["abschreibungen"] = [round(afa_b + x) for x in inv]
        k["zinsen"] = [zins] * 12
        KOSTEN[szen][g] = k


def einsetzen(pfad, name, objekt):
    """Ersetzt in einer JS-Datei den Block zwischen „// <daten>“ und „// </daten>“ durch const name = objekt;."""
    js = open(pfad, encoding="utf-8").read()
    neu = (f"// <daten> erzeugt von {os.path.relpath(__file__, os.path.dirname(pfad))} – nicht von Hand ändern\n"
           f"const {name} = {json.dumps(objekt, ensure_ascii=False, separators=(',', ':'))};\n// </daten>")
    js2, n = re.subn(r"// <daten>.*?// </daten>", lambda _m: neu, js, flags=re.S)
    if n != 1:
        raise SystemExit(f"{pfad}: Datenblock-Marken fehlen")
    if js2 != js:
        open(pfad, "w", encoding="utf-8").write(js2)
    return n


MODELL = {
    "stand": STAND, "jahrIst": JAHR_IST, "jahrPlan": JAHR_PLAN, "monate": MONATE, "baum": BAUM, "aktiv": AKTIV,
    "personen": PERSONEN, "workflow": WORKFLOW, "verlauf": VERLAUF, "linien": LINIEN, "produkte": PRODUKTE,
    "kunden": KUNDEN, "vertriebsarten": VERTRIEBSARTEN, "seiten": SEITEN, "um": UM, "kosten": KOSTEN,
    "investitionen": INVESTITIONEN, "anmerkungen": ANMERKUNGEN, "listenpreis": LISTENPREIS, "rabatt": RABATT,
    "frachtsatz": FRACHTSATZ, "ustsatz": USTSATZ, "std_mk": STD_MK, "std_fk": STD_FK,
}


def daten_zielvorgaben():
    """Datenblock für die Maske Abb. 5.78 (Zielvorgaben, Absatzmenge)."""
    seiten = {}
    for (g, k, v), s in SEITEN.items():
        seiten[f"{g}|{k}|{v}"] = {"td": s["td"], "ist": [s["ist"].get(p) for p in PRODUKTE],
                                  "bu": [s["bu"].get(p) for p in PRODUKTE]}
    return {"stand": STAND, "jahrIst": JAHR_IST, "jahrPlan": JAHR_PLAN, "monate": MONATE, "gesellschaften": AKTIV,
            "kunden": KUNDEN, "vertriebsarten": VERTRIEBSARTEN, "linien": LINIEN, "seiten": seiten}


if __name__ == "__main__":
    js = os.path.join(HIER, "zielvorgaben.js")
    if os.path.exists(js):
        einsetzen(js, "DATEN", daten_zielvorgaben())
        print("Datenblock eingesetzt:", os.path.relpath(js, HIER))
    # Kontrollausgabe 1: Seite des Originals
    s = SEITEN[ORIG_SEITE]
    print("Seite", " / ".join(ORIG_SEITE), "– Vorgabe", s["td"])
    regel, tdp = regel_topdown(s["ist"], s["td"])
    assert regel == s["bu"], "Bottom-up der Originalseite ist nicht die verteilte Vorgabe"
    for grp in ORIG_GRUPPE_MONATE:
        ps = [p for p in PRODUKTE if GRUPPE[p] == grp and p in s["ist"]]
        ist = sum(sum(s["ist"][p]) for p in ps)
        td = sum(tdp[p] for p in ps)
        mon = [sum(s["bu"][p][m] for p in ps) for m in range(12)]
        print(f"  {grp:10s} Ist {ist:6d}  Top-down {td:6d}  Bottom-up {sum(mon):6d}  Monate {mon}")
        assert mon[:7] == ORIG_GRUPPE_MONATE[grp][:7], "Monatswerte Jan–Jul weichen vom Original ab"
    # Kontrollausgabe 2: GuV je Gesellschaft (Tsd. €)
    for szen, name in ((0, f"Ist {JAHR_IST}"), (1, f"Plan {JAHR_PLAN}")):
        print(f"GuV {name}, Tsd. €: Nettoumsatz · DB · Fixkosten · Betriebsergebnis · AfA · Zinsen · Ergebnis")
        for g in AKTIV:
            um, k = UM[szen][g], KOSTEN[szen][g]
            nu = sum(sum(x["nettoumsatz"]) for x in um.values())
            bv = sum(sum(x["bestandsveraenderung"]) for x in um.values())
            vhk = sum(sum(x["fertigungsmaterial"]) + sum(x["fertigungsloehne"]) for x in um.values())
            fr = sum(sum(x["frachtkosten"]) for x in um.values())
            db = nu + bv - vhk - fr
            fix = sum(sum(k[x]) for x in ("personal", "marketing", "verwaltung"))
            be = db - fix
            erg = be - sum(k["abschreibungen"]) - sum(k["zinsen"])
            print(f"  {g:15s} {nu/1e3:9.1f} {db/1e3:8.1f} {fix/1e3:8.1f} {be/1e3:8.1f} {sum(k['abschreibungen'])/1e3:6.1f}"
                  f" {sum(k['zinsen'])/1e3:6.1f} {erg/1e3:8.1f}  (DB {db/nu:.1%}, BE {be/nu:.1%})")
    print("AfA aus Investitionen Deutschland 2028 (€):", [round(x) for x in afa_investitionen("Deutschland")])
