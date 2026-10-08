# Abbildungsinventur 6. Auflage

Planung und Reporting im BI-gestützten Controlling – alle Abbildungen und Tabellen der Abbildungssammlung zur 5. Auflage (ohne Kap. 3.9) mit Vorschau alt/neu, Status, kritischen Kommentaren und Direktlinks auf die neuen Dateien.

Einstieg: **`index.html`** (lokal per Doppelklick oder über GitHub Pages).

## Ordner

| Ordner | Inhalt |
|---|---|
| `index.html` | Inventur – wird erzeugt, nicht von Hand bearbeiten |
| `abbildungen/kapN/` | neue Fassungen, benannt nach der Caption (z. B. `ABC-Analyse.png`): `.png` (600 dpi), `.pdf` (Vektor), `.pptx` (editierbar), bei Dashboards `.html` und `_daten.csv`, bei Eingabemasken zusätzlich `.html` |
| `tabellen/` | LaTeX-Code der Tabellen und Listings, benannt nach der Caption (z. B. `Kennzahlenblatt.tex`) |
| `quellen/kapN/` | Skripte, aus denen die Abbildungen gebaut werden |
| `vorschau/` | Vorschaubilder (Original zugeschnitten, neue Fassung, gesetzte Tabellen) |
| `werkzeug/` | Generator, Pflegeliste `status.json`, Caption-Prüfregeln, Bau-Werkzeuge `bookfig/` (Abbildungen), `dashkit/` (Dashboards) und `maskkit/` (Eingabemasken), Anbindung der Abstimmung (`abstimmung.json`, `abstimmung/Code.gs`, Rückmeldungen `abstimmung/rueckmeldungen.json`), Neubau einer Abbildung `bauen.py`, Revisionen `revision.py` |

## In Overleaf verwenden

- **Tabellen:** „LaTeX kopieren“ und einfügen. Die erste Kommentarzeile nennt die nötigen Pakete (`booktabs`, `tabularx`, `amsmath`, `listings`).
- **Abbildungen:** „LaTeX (figure) kopieren“. Alle Abbildungen werden mit dem Pfad des Overleaf-Projekts eingebunden: `author/content/abbildungen/kapN/<Datei>`; den Ordner `abbildungen/` also nach `author/content/` hochladen. Hochformate werden als PDF ohne Skalierung eingebunden, damit die Schrift bei 7 pt bleibt. „PNG-Link kopieren“ legt den Link auf das PNG der Plattform in die Zwischenablage, z. B. `https://scotandmillfield-spec.github.io/Planung_Reporting_6/abbildungen/kap2/Phasen_des_Planungs-_und_Steuerungsprozesses.png`.
- **Dateinamen und Labels:** Beide werden aus der Caption gebildet, nicht aus der Nummer, denn die Reihenfolge ändert sich. Wörter mit `_` verbunden, Quellenangabe am Ende entfällt, Umlaute umschrieben (ä → ae), nur Buchstaben, Ziffern, `-` und `_`. Beispiel: Caption „Exemplarische Struktur im Reporting“ → Datei `Exemplarische_Struktur_im_Reporting.pdf`, Label `\label{fig:Exemplarische_Struktur_im_Reporting}` (Tabellen `tab:`). Ändert sich eine Caption, benennt `werkzeug/inventur.py` beim nächsten Lauf alle Dateien der Abbildung um (Bild, Quellen, Vorschau) – in Overleaf dann die neue Datei hochladen und Verweise auf das alte Label nachziehen. Gleiche Captions meldet die Inventur.
- **Keine Produktscreenshots:** Screenshots aus SAP, prevero, Cubeware, Hyperion, Power BI usw. werden nicht übernommen, sondern softwareneutral nachgebaut – Eingabemasken mit `werkzeug/maskkit`, Dashboards und Berichte mit `werkzeug/dashkit`, Datenmodelle und Abläufe als Diagramm mit `werkzeug/bookfig`. Captions ohne Produktnamen; die Inventur meldet Produktnamen in der Caption. Offen sind nur Sonderfälle (Art „Screenshot“, Status „Klärung nötig“).
- **Querformate (Dashboards und Abbildungen):** werden immer als PNG um 90° gedreht auf einer Hochformatseite eingebunden:

  ```latex
  \begin{figure}
      \centering
      \includegraphics[angle=90, width=\linewidth, height=1\textheight, keepaspectratio]{author/content/abbildungen/kap3/ABC-Analyse.png}
      \caption{ABC-Analyse}
      \label{fig:ABC-Analyse}
  \end{figure}
  ```

## Aktualisieren

```bash
python3 werkzeug/vorschau.py     # neue/geänderte Vorschaubilder
python3 werkzeug/inventur.py     # index.html neu schreiben
```

Die „Hinweise aus der Umsetzung“ (Anmerkungen beim Neuzeichnen, Alternativtexte) stehen in `werkzeug/status.json` (Schlüssel `"3.5"`, `"Tab. 4.8"` oder `"Folie 5"`). Status und Kommentare der Abstimmung kommen aus der Google-Tabelle (nächster Abschnitt).

## Abstimmung: Status und Kommentare

Status und Kommentare je Abbildung liegen in der Google-Tabelle „Abbildungsinventur 6. Auflage – Status“. Die Inventur liest sie beim Öffnen über eine kleine Web-App (Google Apps Script) und schreibt Änderungen dorthin zurück. Ohne erreichbare Web-App zeigt die Seite den Stand der Inventur.

**Einrichtung (einmalig, durch den Inhaber der Tabelle):**

1. Tabelle öffnen → *Erweiterungen → Apps Script*.
2. Den vorhandenen Code durch den Inhalt von `werkzeug/abstimmung/Code.gs` ersetzen, oben bei `PASSWORT` ein eigenes Passwort eintragen, speichern.
3. Oben die Funktion `einrichten` auswählen → *Ausführen*. Beim ersten Mal den Zugriff erlauben (Hinweis „Google hat diese App nicht überprüft“ → *Erweitert* → *Zu … wechseln*). Danach hat die Statusspalte eine Auswahlliste, es gibt ein Blatt „Hinweise“, der Zeit-Trigger für die Rückmeldungen läuft, und das Passwort ist in den Skripteigenschaften gespeichert (bei späteren Code-Änderungen kann oben `bitte-aendern` stehen bleiben).
4. *Bereitstellen → Neue Bereitstellung* → Typ *Web-App*, *Ausführen als: Ich*, *Zugriff: Jeder* → *Bereitstellen*, die Web-App-URL (endet auf `/exec`) kopieren.
5. Die URL in `werkzeug/abstimmung.json` bei `webapp` eintragen und `python3 werkzeug/inventur.py` laufen lassen.

**Bedienung:** *Bearbeiten* oben in der Inventur, Name oder Kürzel und Passwort eingeben (bleibt im Browser gespeichert). An jeder Abbildung Status wählen, optional einen Kommentar schreiben, *Speichern*. Der Kommentar wird mit Datum und Name an die Zelle angehängt. Status und Kommentare lassen sich auch direkt in der Tabelle ändern; Datum und Kennung werden dann automatisch vermerkt.

**Sichtbarkeit:** Lesen geht ohne Passwort, denn die Web-App-URL steht in der öffentlichen Seite. Schreiben nur mit Passwort.

**Status:** *offen* → *zur Prüfung* → bei Änderungswünschen *Revision* → *Nächste Version* (beliebig oft) → *freigegeben* (fertig für das Manuskript) → *Overleaf überführt* (produktiv im LaTeX-Dokument eingebunden, Endzustand). Daneben *Klärung nötig* (inhaltliche Frage offen; Antwort als Kommentar, dann wieder *Revision*) und *entfällt*. Die früheren Werte *in Arbeit* und *Änderung nötig* stellt `einrichten` auf *offen* bzw. *Revision* um.

**Revisionen:** Änderungswunsch als Kommentar schreiben und den Status auf *Revision* setzen. Claude arbeitet die Revisionen mit dem Skill `sechste-auflage-revision` ab:

1. Tabelle über den Google-Drive-Connector als CSV holen, `python3 werkzeug/revision.py lesen` listet die Aufträge (alle Kommentare seit der letzten Rückmeldung von Claude) mit Art, Quelle und zuständigem Skill.
2. Quelle ändern und `python3 werkzeug/bauen.py <Nr>` – baut nach Art (Diagramm, Dashboard, Maske) in `/tmp/bauen/<Datei>/`, prüft, übernimmt die Lieferdateien nach `abbildungen/kapN/` und erzeugt Vorschau und Inventur neu; dort liegt auch ein Vergleichsblatt vorher/nachher.
3. `python3 werkzeug/revision.py melden <Nr> --umsetzung "…"` schreibt die Rückmeldung nach `werkzeug/abstimmung/rueckmeldungen.json` und den Vorgang in `status.json` („Revisionen“ in der Inventur). Bei einer Rückfrage `--status "Klärung nötig"`.
4. Committen und pushen. Ein Zeit-Trigger der Tabelle (`rueckmeldungenUebernehmen`, alle 5 Minuten, eingerichtet von `einrichten`) holt die Datei von GitHub, hängt „TT.MM.JJJJ Claude: …“ an die Kommentare und setzt den Status auf *Nächste Version* – nur wenn er noch auf *Revision* steht.

Die Shell der Claude-Umgebung erreicht Google nicht; deshalb liest Claude über den Connector und schreibt über das Repository zurück. Ein Passwort braucht Claude dafür nicht.

**Code ändern:** Nach einer Änderung an `Code.gs` in Apps Script *Bereitstellen → Bereitstellungen verwalten → Bearbeiten → Version: Neue Version → Bereitstellen*. So bleibt die URL gleich.

## Auf GitHub Pages veröffentlichen

1. Ordnerinhalt in ein Repository hochladen (die Datei `.nojekyll` mitnehmen).
2. *Settings → Pages → Build and deployment → Deploy from a branch*, Branch `main`, Ordner `/ (root)`.
3. Nach ein bis zwei Minuten unter `https://<benutzer>.github.io/<repository>/` erreichbar.

**Sichtbarkeit:** Eine Pages-Seite ist öffentlich – auch aus einem privaten Repository (Ausnahme: GitHub Enterprise Cloud mit privater Pages-Sichtbarkeit). Die Inventur enthält die Originale der 5. Auflage einschließlich Screenshots und Abbildungen aus Fremdquellen. Wer das nicht öffentlich zeigen will, nutzt die Seite lokal oder einen geschützten Hoster.
