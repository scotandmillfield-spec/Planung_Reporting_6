# Abbildungsinventur 6. Auflage

Planung und Reporting im BI-gestützten Controlling – alle Abbildungen und Tabellen der Abbildungssammlung zur 5. Auflage (ohne Kap. 3.9) mit Vorschau alt/neu, Status, kritischen Kommentaren und Direktlinks auf die neuen Dateien.

Einstieg: **`index.html`** (lokal per Doppelklick oder über GitHub Pages).

## Ordner

| Ordner | Inhalt |
|---|---|
| `index.html` | Inventur – wird erzeugt, nicht von Hand bearbeiten |
| `abbildungen/kapN/` | neue Fassungen: `abb_X-Y.png` (600 dpi), `.pdf` (Vektor), `.pptx` (editierbar), bei Dashboards `.html` und `_daten.csv` |
| `tabellen/` | LaTeX-Code der Tabellen (`tab_X-Y.tex`) und Listings (`lst_X-Y.tex`) |
| `quellen/kapN/` | Skripte, aus denen die Abbildungen gebaut werden |
| `vorschau/` | Vorschaubilder (Original zugeschnitten, neue Fassung, gesetzte Tabellen) |
| `werkzeug/` | Generator, Pflegeliste `status.json`, Caption-Prüfregeln, Bau-Werkzeuge `bookfig/` und `dashkit/`, Anbindung der Abstimmung (`abstimmung.json`, `abstimmung/Code.gs`) |

## In Overleaf verwenden

- **Tabellen:** „LaTeX kopieren“ und einfügen. Die erste Kommentarzeile nennt die nötigen Pakete (`booktabs`, `tabularx`, `amsmath`, `listings`).
- **Abbildungen:** „LaTeX (figure) kopieren“ und den Ordner `abbildungen/` mit gleichem Pfad ins Overleaf-Projekt hochladen. Die PDFs werden ohne Skalierung eingebunden, damit die Schrift bei 7 pt bleibt. Querformate brauchen `\usepackage{rotating}`.
- **Dashboards im Querformat:** werden um 90° gedreht auf einer Hochformatseite eingebunden, Pfad wie im Overleaf-Projekt (`author/content/abbildungen/…`):

  ```latex
  \begin{figure}
      \centering
      \includegraphics[angle=90, width=\linewidth, height=1\textheight, keepaspectratio]{author/content/abbildungen/kap3/abb_3-22.png}
      \caption{ABC-Analyse}
      \label{fig:3-22}
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
3. Oben die Funktion `einrichten` auswählen → *Ausführen*. Beim ersten Mal den Zugriff erlauben (Hinweis „Google hat diese App nicht überprüft“ → *Erweitert* → *Zu … wechseln*). Danach hat die Statusspalte eine Auswahlliste und es gibt ein Blatt „Hinweise“.
4. *Bereitstellen → Neue Bereitstellung* → Typ *Web-App*, *Ausführen als: Ich*, *Zugriff: Jeder* → *Bereitstellen*, die Web-App-URL (endet auf `/exec`) kopieren.
5. Die URL in `werkzeug/abstimmung.json` bei `webapp` eintragen und `python3 werkzeug/inventur.py` laufen lassen.

**Bedienung:** *Bearbeiten* oben in der Inventur, Name oder Kürzel und Passwort eingeben (bleibt im Browser gespeichert). An jeder Abbildung Status wählen, optional einen Kommentar schreiben, *Speichern*. Der Kommentar wird mit Datum und Name an die Zelle angehängt. Status und Kommentare lassen sich auch direkt in der Tabelle ändern; Datum und Kennung werden dann automatisch vermerkt.

**Sichtbarkeit:** Lesen geht ohne Passwort, denn die Web-App-URL steht in der öffentlichen Seite. Schreiben nur mit Passwort.

**Code ändern:** Nach einer Änderung an `Code.gs` in Apps Script *Bereitstellen → Bereitstellungen verwalten → Bearbeiten → Version: Neue Version → Bereitstellen*. So bleibt die URL gleich.

## Auf GitHub Pages veröffentlichen

1. Ordnerinhalt in ein Repository hochladen (die Datei `.nojekyll` mitnehmen).
2. *Settings → Pages → Build and deployment → Deploy from a branch*, Branch `main`, Ordner `/ (root)`.
3. Nach ein bis zwei Minuten unter `https://<benutzer>.github.io/<repository>/` erreichbar.

**Sichtbarkeit:** Eine Pages-Seite ist öffentlich – auch aus einem privaten Repository (Ausnahme: GitHub Enterprise Cloud mit privater Pages-Sichtbarkeit). Die Inventur enthält die Originale der 5. Auflage einschließlich Screenshots und Abbildungen aus Fremdquellen. Wer das nicht öffentlich zeigen will, nutzt die Seite lokal oder einen geschützten Hoster.
