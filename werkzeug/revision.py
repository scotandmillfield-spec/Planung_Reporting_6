#!/usr/bin/env python3
"""Revisionen der Abstimmung: Aufträge aus der Google-Tabelle lesen und Umsetzungen zurückmelden.

Ablauf (Skill „sechste-auflage-revision“):

  1. Tabelle als CSV holen – im Chat mit dem Google-Drive-Connector:
       download_file_content(fileId=<tabelle aus abstimmung.json>, exportMimeType="text/csv")
     Die Shell erreicht Google nicht; das Ergebnis des Connector-Aufrufs steht aber im Sitzungsprotokoll
     (~/.claude/projects/**/*.jsonl). „lesen“ holt die CSV von dort, alternativ mit --csv aus einer Datei.

  2. python3 werkzeug/revision.py lesen
       listet alle Zeilen mit Status „Revision“: Schlüssel, Abbildung, Art, zuständiger Skill, Quelle,
       Dateien und den Auftrag (alle Kommentarzeilen nach der letzten „Claude:“-Zeile). Schreibt die Aufträge
       nach /tmp/revision/auftraege.json. Aufträge, die schon umgesetzt sind und nur auf die Übernahme durch
       die Tabelle warten, erscheinen als „wartet“ und werden nicht noch einmal ausgegeben.

  3. Auftrag umsetzen (Quelle ändern, python3 werkzeug/bauen.py <Nr>, prüfen).

  4. python3 werkzeug/revision.py melden <Schlüssel> --umsetzung "…" [--status "Nächste Version"]
       hängt eine Rückmeldung an werkzeug/abstimmung/rueckmeldungen.json und den Vorgang an die
       „revisionen“ der Abbildung in werkzeug/status.json (Anzeige in der Inventur). Bei einer Rückfrage
       statt Umsetzung: --status "Klärung nötig" und die Frage als --umsetzung.

  5. Inventur neu erzeugen, committen, pushen. Ein Zeit-Trigger der Tabelle (Code.gs,
     rueckmeldungenUebernehmen) holt rueckmeldungen.json binnen etwa 5–10 Minuten und setzt Status und
     Kommentar „TT.MM.JJJJ Claude: …“.
"""
import argparse
import base64
import csv
import datetime
import glob
import hashlib
import io
import json
import os
import re
import sys

HIER = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HIER)
sys.path.insert(0, HIER)

ABSTIMMUNG = json.load(open(os.path.join(HIER, "abstimmung.json"), encoding="utf-8"))
TABELLE_ID = re.search(r"/d/([A-Za-z0-9_-]+)", ABSTIMMUNG["tabelle"]).group(1)
RUECK = os.path.join(HIER, "abstimmung", "rueckmeldungen.json")
STATUS = os.path.join(HIER, "status.json")
ARBEIT = "/tmp/revision"
AUFTRAEGE = os.path.join(ARBEIT, "auftraege.json")
AUFBEWAHREN_TAGE = 90                                   # ältere Rückmeldungen fallen aus rueckmeldungen.json

SKILL = {"D": "sechste-auflage-abbildungen", "V": "sechste-auflage-dashboard", "M": "sechste-auflage-eingabemasken",
         "T": "LaTeX-Tabelle (tabellen/*.tex, ohne eigenen Skill)", "S": "Sonderfall – erst klären",
         "DUP": "Duplikat – entfällt", "X": "Hinweisfolie"}
ZEILE = re.compile(r"^(\d{2}\.\d{2}\.\d{4}) ([^:\n]{1,40}): (.*)$")


# ---------------------------------------------------------------- Tabelle holen

def csv_aus_protokoll():
    """Neuestes Ergebnis von download_file_content für die Abstimmungstabelle aus den Sitzungsprotokollen."""
    dateien = sorted(glob.glob(os.path.expanduser("~/.claude/projects/**/*.jsonl"), recursive=True),
                     key=os.path.getmtime, reverse=True)[:6]
    for pfad in dateien:
        aufrufe, treffer = {}, None
        with open(pfad, encoding="utf-8", errors="replace") as fh:
            for zeile in fh:
                if "download_file_content" not in zeile and TABELLE_ID not in zeile:
                    continue
                try:
                    d = json.loads(zeile)
                except ValueError:
                    continue
                inhalt = (d.get("message") or {}).get("content")
                if not isinstance(inhalt, list):
                    continue
                for b in inhalt:
                    if b.get("type") == "tool_use" and str(b.get("name", "")).endswith("download_file_content") \
                            and (b.get("input") or {}).get("fileId") == TABELLE_ID:
                        aufrufe[b.get("id")] = d.get("timestamp", "")
                    elif b.get("type") == "tool_result" and b.get("tool_use_id") in aufrufe:
                        text = b.get("content")
                        if isinstance(text, list):
                            text = "".join(t.get("text", "") for t in text if isinstance(t, dict))
                        try:
                            daten = json.loads(text)
                            roh = base64.b64decode(daten["content"]).decode("utf-8-sig")
                        except (ValueError, KeyError, TypeError):
                            continue
                        if roh.startswith("Schlüssel"):
                            treffer = (roh, aufrufe[b.get("tool_use_id")], pfad)
        if treffer:
            return treffer
    return None


def tabelle_lesen(csv_datei=None):
    if csv_datei:
        roh, zeit, herkunft = open(csv_datei, encoding="utf-8-sig").read(), "", csv_datei
    else:
        t = csv_aus_protokoll()
        if not t:
            sys.exit("Keine Tabelle gefunden. Zuerst im Chat den Google-Drive-Connector aufrufen:\n"
                     f"  download_file_content(fileId=\"{TABELLE_ID}\", exportMimeType=\"text/csv\")\n"
                     "und dann erneut „revision.py lesen“ – oder die CSV mit --csv übergeben.")
        roh, zeit, herkunft = t
    os.makedirs(ARBEIT, exist_ok=True)
    open(os.path.join(ARBEIT, "tabelle.csv"), "w", encoding="utf-8").write(roh)
    return list(csv.DictReader(io.StringIO(roh))), zeit, herkunft


# ---------------------------------------------------------------- Kommentare

def kommentarzeilen(text):
    """Zellinhalt → [{datum, autor, text}]; Zeilen ohne Datum gehören zur vorigen."""
    aus = []
    for z in str(text or "").replace("\r", "").split("\n"):
        z = z.strip()
        if not z:
            continue
        m = ZEILE.match(z)
        if m:
            aus.append({"datum": m.group(1), "autor": m.group(2).strip(), "text": m.group(3).strip()})
        elif aus:
            aus[-1]["text"] += " " + z
        else:
            aus.append({"datum": "", "autor": "", "text": z})
    return aus


def auftrag_aus(zeilen):
    """Alle Zeilen nach der letzten Rückmeldung von Claude (ohne Rückmeldung: alle)."""
    letzte = max((i for i, z in enumerate(zeilen) if z["autor"].lower() == "claude"), default=-1)
    return [z for z in zeilen[letzte + 1:] if z["autor"].lower() != "claude"]


def kennung(auftrag):
    return hashlib.sha1("\n".join(f"{z['datum']} {z['autor']}: {z['text']}" for z in auftrag)
                        .encode("utf-8")).hexdigest()[:12]


# ---------------------------------------------------------------- Inventur-Daten

def inventur_eintraege():
    import inventur                                    # noqa: E402 – erst hier, damit „melden“ schnell bleibt
    return {x["anker"]: x for x in inventur.eintraege()}


def lade(pfad, leer):
    if os.path.exists(pfad):
        return json.load(open(pfad, encoding="utf-8"))
    return leer


def speichere(pfad, daten):
    with open(pfad, "w", encoding="utf-8") as fh:
        json.dump(daten, fh, ensure_ascii=False, indent=1)
        fh.write("\n")


# ---------------------------------------------------------------- Befehle

def befehl_lesen(a):
    zeilen, zeit, herkunft = tabelle_lesen(a.csv)
    inv = inventur_eintraege()
    rueck = lade(RUECK, {"eintraege": []})["eintraege"]
    print(f"Tabelle: {len(zeilen)} Zeilen" + (f", abgerufen {zeit}" if zeit else "") + f" ({herkunft})")
    stand = {}
    for z in zeilen:
        stand[z.get("Status", "")] = stand.get(z.get("Status", ""), 0) + 1
    print("Status: " + ", ".join(f"{k or '(leer)'} {v}" for k, v in sorted(stand.items(), key=lambda t: -t[1])))

    auftraege, wartend = [], []
    for z in zeilen:
        if z.get("Status", "").strip() != "Revision":
            continue
        schl = z["Schlüssel"].strip()
        alle = kommentarzeilen(z.get("Kommentare", ""))
        auftrag = auftrag_aus(alle)
        k = kennung(auftrag)
        if any(r.get("schluessel") == schl and r.get("auftrag") == k for r in rueck):
            wartend.append(f"{schl} ({z.get('Abbildung', '')})")
            continue
        x = inv.get(schl)
        eintrag = {"schluessel": schl, "abbildung": z.get("Abbildung", ""), "titel": z.get("Titel", ""),
                   "auftrag": auftrag, "kennung": k, "verlauf": alle[:len(alle) - len(auftrag)]}
        if x:
            eintrag.update({"nr": x["schluessel"], "art": x["art"], "skill": SKILL.get(x["art"], "?"),
                            "datei": x["stem"], "kap": x["kap"], "caption": x["cap_neu"],
                            "status_inventur": x["status"], "quellen": x["quellen"],
                            "dateien": list(x["dateien"].values()) + ([x["tex"]] if x["tex"] else []),
                            "gebaut": bool(x["dateien"] or x["tex"])})
        else:
            eintrag["fehler"] = "Schlüssel nicht in der Inventur"
        auftraege.append(eintrag)

    os.makedirs(ARBEIT, exist_ok=True)
    speichere(AUFTRAEGE, {"stand": zeit, "auftraege": auftraege})
    if wartend:
        print("Schon umgesetzt, Übernahme in die Tabelle steht noch aus: " + ", ".join(wartend))
    if not auftraege:
        print("Keine offenen Revisionen.")
        return
    print(f"\n{len(auftraege)} Revision(en) – Details in {AUFTRAEGE}\n")
    for r in auftraege:
        print(f"■ {r['abbildung']} [{r['schluessel']}] – {r.get('caption') or r['titel']}")
        if r.get("fehler"):
            print(f"   FEHLER: {r['fehler']}")
            continue
        print(f"   Art {r['art']} → {r['skill']}" + ("" if r["gebaut"] else " · NOCH NICHT GEBAUT (Erstumsetzung)"))
        if r["quellen"]:
            print("   Quelle:  " + ", ".join(r["quellen"]))
        if r["dateien"]:
            print("   Dateien: " + ", ".join(r["dateien"]))
        if r["verlauf"]:
            print("   Frühere Kommentare (nur Kontext):")
            for v in r["verlauf"]:
                print(f"     {v['datum']} {v['autor']}: {v['text']}")
        print("   AUFTRAG:" if r["auftrag"] else "   AUFTRAG: (kein Kommentar seit der letzten Rückmeldung – nachfragen)")
        for v in r["auftrag"]:
            print(f"     {v['datum']} {v['autor']}: {v['text']}")
        print()


def befehl_melden(a):
    daten = lade(AUFTRAEGE, {"auftraege": []})
    r = next((x for x in daten["auftraege"] if a.schluessel in (x["schluessel"], x.get("nr"), x["abbildung"])), None)
    if not r:
        sys.exit(f"{a.schluessel} steht nicht in {AUFTRAEGE} – zuerst „revision.py lesen“.")
    if a.status not in ("Nächste Version", "Klärung nötig", "zur Prüfung"):
        sys.exit(f"Status „{a.status}“ ist für eine Rückmeldung nicht vorgesehen.")
    heute = datetime.date.today()
    text = " ".join(a.umsetzung.split())
    if a.status == "Klärung nötig" and not text.lower().startswith("rückfrage"):
        text = "Rückfrage: " + text

    rueck = lade(RUECK, {"_hinweis": "", "eintraege": []})
    rueck["_hinweis"] = ("Rückmeldungen der Revisionen (werkzeug/revision.py melden). Der Zeit-Trigger der "
                         "Abstimmungstabelle (Code.gs, rueckmeldungenUebernehmen) trägt neue Einträge ein: Kommentar "
                         "„TT.MM.JJJJ Claude: …“ und Status, sofern er noch auf „von“ steht.")
    grenze = (heute - datetime.timedelta(days=AUFBEWAHREN_TAGE)).isoformat()
    rueck["eintraege"] = [x for x in rueck["eintraege"] if x.get("zeit", "")[:10] >= grenze]
    n = 1 + sum(1 for x in rueck["eintraege"] if x["schluessel"] == r["schluessel"]
                and x.get("zeit", "")[:10] == heute.isoformat())
    rueck["eintraege"].append({
        "id": f"{heute.isoformat()}-{r['schluessel']}-{n}", "schluessel": r["schluessel"], "von": "Revision",
        "status": a.status, "kommentar": text, "auftrag": r["kennung"],
        "zeit": datetime.datetime.now().strftime("%Y-%m-%dT%H:%M")})
    speichere(RUECK, rueck)

    if r.get("nr"):
        st = lade(STATUS, {"eintraege": {}})
        e = st["eintraege"].setdefault(r["nr"], {})
        e.setdefault("revisionen", []).append({
            "datum": heute.strftime("%d.%m.%Y"),
            "wunsch": [f"{v['datum']} {v['autor']}: {v['text']}" for v in r["auftrag"]],
            "ergebnis": "Rückfrage" if a.status == "Klärung nötig" else "umgesetzt",
            "text": text})
        if r.get("datei") and r.get("gebaut") and not e.get("datei"):
            e["datei"] = r["datei"]
        speichere(STATUS, st)
    print(f"Gemeldet: {r['abbildung']} → {a.status}: {text}")
    print("Jetzt: python3 werkzeug/vorschau.py && python3 werkzeug/inventur.py, dann committen und pushen.")


def befehl_offen(a):
    """Rückmeldungen im Repository, die die Tabelle laut letzter CSV noch nicht übernommen hat."""
    zeilen, _, _ = tabelle_lesen(a.csv)
    nach = {z["Schlüssel"]: z for z in zeilen}
    for x in lade(RUECK, {"eintraege": []})["eintraege"]:
        z = nach.get(x["schluessel"])
        drin = z and x["kommentar"][:60] in z.get("Kommentare", "")
        print(("✓ übernommen  " if drin else "… ausstehend  ") + f"{x['id']}: {x['status']} – {x['kommentar'][:80]}")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="befehl", required=True)
    p = sub.add_parser("lesen", help="Revisionen aus der Tabelle auflisten")
    p.add_argument("--csv", help="CSV-Export der Tabelle statt Sitzungsprotokoll")
    p.set_defaults(f=befehl_lesen)
    p = sub.add_parser("melden", help="Umsetzung (oder Rückfrage) zurückmelden")
    p.add_argument("schluessel", help="Schlüssel (abb-2-2), Nummer (2.2) oder „Abb. 2.2“")
    p.add_argument("--umsetzung", required=True, help="ein bis zwei Sätze: was geändert wurde bzw. die Rückfrage")
    p.add_argument("--status", default="Nächste Version")
    p.set_defaults(f=befehl_melden)
    p = sub.add_parser("offen", help="Rückmeldungen gegen die Tabelle abgleichen")
    p.add_argument("--csv")
    p.set_defaults(f=befehl_offen)
    a = ap.parse_args()
    a.f(a)


if __name__ == "__main__":
    main()
