"""Daten für die Serie „Beispiel zu Defektklassen“ (Abb. 5.11–5.15) – gemeinsamer Generator.

Ein Datensatz für alle fünf Abbildungen: sieben Kundenbestellungen (Rohdaten der Abb. 5.11, Werte unverändert aus
dem Original) und die Liste der Defekte mit Klasse, Rohwert, korrigiertem Wert, Beschreibung und Regel. Jede
Abbildung zeigt einen Schritt der Bereinigung; ein Defekt der Klasse k ist ab Schritt k + 1 korrigiert:
  1 Rohdaten · 2 Klasse 1 automatisch · 3 Klasse 2 manuell · 4 Klasse 3 manuell · 5 Ergebnis (Umsatz je Kunde).
Korrigierte Werte wie in Abb. 5.12–5.15 mit zwei Festlegungen (siehe Statusdateien):
  - Name 1004 „Meyer, Sofíá“ wird in Klasse 1 zu „Meyer, Sofía“ (wie Abb. 5.12) und bleibt so, auch wenn Abb. 5.13
    und 5.14 wieder „Sofíá“ zeigen;
  - die Bestellung „Espresso“ behält nach der Zusammenführung ihr Bestelldatum 2023-06-01 (Abb. 5.14: 2023-04-05).
Datumsregel der Klasse 1: ISO 8601 (JJJJ-MM-TT), Tag vor Monat, außer der zweite Teil ist größer als 12 –
ergibt genau die korrigierten Werte der Abb. 5.12. Betrag in Cent (exakt), Ausgabe in € mit Dezimalkomma.
Kein Zufall (fester Datensatz). Ausgabe: defektklassen.json und defektklassen.csv; andere Ordner der Serie
führen dieses Skript per runpy aus und setzen nur Startschritt und Seitentitel.
"""
import csv
import io
import json
import os
import re

HIER = os.path.dirname(os.path.abspath(__file__))
START, TITEL = 1, "Defektklassen: Rohdaten"

SPALTEN = ["Kunden_ID", "Name", "Geburtsdatum", "Alter", "Bestelldatum", "Bestellung", "Betrag"]
SCHRITTE = ["Rohdaten", "Klasse 1: automatisch", "Klasse 2: manuell", "Klasse 3: manuell", "Ergebnis"]
KLASSEN = [[1, "automatisch erkannt, automatisch korrigiert"],
           [2, "automatisch erkannt, manuell korrigiert"],
           [3, "manuell erkannt, manuell korrigiert"]]

# Rohdaten der Abb. 5.11 (Betrag in Cent)
ROH = [
    [1001, "Meyer, Sofia", "1985-07-12", 39, "01-05-2023", "Latte Macchiato", 450],
    [1002, "Meier, Max", "1205-10-06", 32, "03-01-2023", "Americano", 320],
    [1003, "Müller, Anna", "1989-11-01", 34, "06/15/2023", "Cappuccino, Cookies", 780],
    [1004, "Meyer, Sofíá", "1992-02-30", 32, "2023-04-05", "Green Tea", 350],
    [1005, "Meyer, Sofia", "1985-07-12", 39, "01.06.2023", "Espresso", 250],
    [1006, "Maier, Clara", "1995-12-15", 28, "01-07-2023", "Latte, Croissant", 650],
    [1007, "MÜLLER, Karl", "1978-03-08", 45, "03/05/2023", "Cappuccino, Cheesecake", 900],
]
C = {s: i for i, s in enumerate(SPALTEN)}


def iso(s):
    """Datumsregel der Klasse 1."""
    if re.fullmatch(r"\d{4}-\d{2}-\d{2}", s):
        return s
    a, b, j = re.split(r"[-./]", s)
    tag, monat = (b, a) if int(b) > 12 else (a, b)
    return f"{j}-{monat}-{tag}"


REGEL_DATUM = "in ISO 8601 (JJJJ-MM-TT) umwandeln; Tag vor Monat, außer der zweite Teil ist größer als 12"
FORMAT = {"-": "TT-MM-JJJJ", ".": "TT.MM.JJJJ"}

# Defekte: [Zeile, Spalte, Klasse, Rohwert, korrigierter Wert, Beschreibung, Regel]
DEFEKTE = []
for r, z in enumerate(ROH):                                   # Klasse 1: Datumsformat
    s = z[C["Bestelldatum"]]
    if iso(s) != s:
        trenner = re.search(r"[-./]", s).group()
        if trenner == "/":
            a, b = (int(x) for x in s.split("/")[:2])
            text = ("Bestelldatum im US-Format MM/TT/JJJJ" if b > 12 else
                    "Bestelldatum mit Schrägstrich – Tag und Monat nicht eindeutig, die Regel liest Tag vor Monat")
        else:
            text = f"Bestelldatum im Format {FORMAT[trenner]} statt JJJJ-MM-TT"
        DEFEKTE.append([r, C["Bestelldatum"], 1, s, iso(s), text, REGEL_DATUM])
DEFEKTE += [
    [6, C["Name"], 1, "MÜLLER, Karl", "Müller, Karl", "Nachname in Großbuchstaben",
     "Namen in Groß- und Kleinschreibung überführen (Anfangsbuchstabe groß)"],
    [3, C["Name"], 1, "Meyer, Sofíá", "Meyer, Sofía", "Vorname mit doppeltem Akzent – Zeichensatz- oder Erfassungsfehler",
     "Abgleich mit einem Vornamensverzeichnis: unbekannte Schreibweise durch die nächstliegende gültige ersetzen"],
    [1, C["Geburtsdatum"], 2, "1205-10-06", "1985-10-06", "Geburtsjahr 1205 unplausibel",
     "Prüfregel: Geburtsjahr zwischen 1900 und dem Bestelljahr – den richtigen Wert liefert erst die Rückfrage beim Kunden"],
    [1, C["Alter"], 2, 32, 37, "Alter beruht auf dem fehlerhaften Geburtsdatum (Folgefehler)",
     "Prüfregel: Alter muss zum Geburtsdatum passen – nach der Korrektur des Geburtsdatums neu berechnet"],
    [3, C["Geburtsdatum"], 2, "1992-02-30", "1992-02-28", "Ungültiges Datum: 30. Februar",
     "Prüfregel: Datum muss im Kalender existieren – den richtigen Wert liefert erst die Rückfrage beim Kunden"],
    [3, C["Alter"], 2, 32, 31, "Alter beruht auf dem fehlerhaften Geburtsdatum (Folgefehler)",
     "Prüfregel: Alter muss zum Geburtsdatum passen – nach der Korrektur des Geburtsdatums neu berechnet"],
    [4, C["Kunden_ID"], 3, 1005, 1001,
     "Dublette: dieselbe Kundin wie 1001 (gleicher Name, gleiches Geburtsdatum) unter einer zweiten Kundennummer",
     "Ähnliche Datensätze manuell prüfen, bestätigte Dubletten auf die zuerst vergebene Kundennummer zusammenführen; "
     "1004 (Meyer, Sofía, anderes Geburtsdatum) ist eine andere Person und bleibt eigenständig"],
]

# Abgleich mit den korrigierten Werten der Abb. 5.12 (Bestelldatum, Name) und 5.13/5.14
SOLL_12 = ["2023-05-01", "2023-01-03", "2023-06-15", "2023-04-05", "2023-06-01", "2023-07-01", "2023-05-03"]


def stand(schritt):
    """Werte aller Datensätze nach Schritt 1–5 (ab Schritt k + 1 ist Klasse k korrigiert)."""
    w = [list(z) for z in ROH]
    for r, c, k, roh, neu, *_ in DEFEKTE:
        assert w[r][c] == roh or schritt > k, (r, c)
        if schritt >= k + 1:
            w[r][c] = neu
    return w


assert [z[C["Bestelldatum"]] for z in stand(2)] == SOLL_12
assert [z[C["Name"]] for z in stand(2)][3] == "Meyer, Sofía" and stand(2)[6][1] == "Müller, Karl"
assert [z[C["Geburtsdatum"]] for z in stand(3)][1:4:2] == ["1985-10-06", "1992-02-28"]
assert [z[C["Alter"]] for z in stand(3)] == [39, 37, 34, 31, 39, 28, 45]
assert [z[C["Kunden_ID"]] for z in stand(4)] == [1001, 1002, 1003, 1004, 1001, 1006, 1007]


def umsatz(schritt):
    u = {}
    for z in stand(schritt):
        u[z[0]] = u.get(z[0], 0) + z[C["Betrag"]]
    return u


def eur(cent):
    return f"{cent // 100},{cent % 100:02d}"


# CSV: Stand der sieben Datensätze nach jedem Bereinigungsschritt (Ergebnis = Stand nach Klasse 3)
STAENDE = ["Rohdaten", "nach Klasse 1", "nach Klasse 2", "nach Klasse 3 (Ergebnis)"]
puffer = io.StringIO()
cw = csv.writer(puffer, delimiter=";", lineterminator="\r\n")
cw.writerow(["Schritt", "Datensatz", *SPALTEN[:-1], "Betrag_EUR", "Offene_Defekte", "Korrigiert_in_diesem_Schritt"])
for s, name in enumerate(STAENDE, start=1):
    for r, z in enumerate(stand(s)):
        offen = [f"{SPALTEN[c]} (Klasse {k})" for rr, c, k, *_ in DEFEKTE if rr == r and s <= k]
        neu = [f"{SPALTEN[c]} (Klasse {k}): {roh} → {kor}" for rr, c, k, roh, kor, *_ in DEFEKTE if rr == r and s == k + 1]
        cw.writerow([name, r + 1, *z[:-1], eur(z[-1]), ", ".join(offen) or "–", ", ".join(neu) or "–"])
CSV_TEXT = puffer.getvalue()

DATEN = {"titel": TITEL, "start": START, "spalten": SPALTEN, "schritte": SCHRITTE, "klassen": KLASSEN,
         "roh": ROH, "defekte": DEFEKTE, "csv": CSV_TEXT.rstrip("\r\n")}


def schreiben(ordner, start, titel, name="defektklassen"):
    d = dict(DATEN, start=start, titel=titel)
    with open(os.path.join(ordner, name + ".json"), "w", encoding="utf-8") as fh:
        json.dump(d, fh, ensure_ascii=False, separators=(",", ":"))
    with open(os.path.join(ordner, name + ".csv"), "w", encoding="utf-8-sig", newline="") as fh:
        fh.write(CSV_TEXT)


def kontrolle(start):
    print(f"Startschritt {start} ({SCHRITTE[start - 1]}) · {len(ROH)} Datensätze · {len(DEFEKTE)} fehlerhafte Werte:",
          ", ".join(f"Klasse {k} {sum(1 for d in DEFEKTE if d[2] == k)}" for k in (1, 2, 3)))
    for s in (1, 4):
        u = umsatz(s)
        print(f"  Umsatz je Kunde, Stand {STAENDE[s - 1]}: " + "  ".join(f"{k} {eur(v)}" for k, v in sorted(u.items())),
              f"| Summe {eur(sum(u.values()))} € bei {len(u)} Kunden")


if __name__ == "__main__":
    schreiben(HIER, START, TITEL)
    kontrolle(START)
