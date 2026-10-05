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
| `werkzeug/` | Generator, Pflegeliste `status.json`, Caption-Prüfregeln, Bau-Werkzeuge `bookfig/` und `dashkit/` |

## In Overleaf verwenden

- **Tabellen:** „LaTeX kopieren“ und einfügen. Die erste Kommentarzeile nennt die nötigen Pakete (`booktabs`, `tabularx`, `amsmath`, `listings`).
- **Abbildungen:** „LaTeX (figure) kopieren“ und den Ordner `abbildungen/` mit gleichem Pfad ins Overleaf-Projekt hochladen. Die PDFs werden ohne Skalierung eingebunden, damit die Schrift bei 7 pt bleibt. Querformate brauchen `\usepackage{rotating}`.

## Aktualisieren

```bash
python3 werkzeug/vorschau.py     # neue/geänderte Vorschaubilder
python3 werkzeug/inventur.py     # index.html neu schreiben
```

Status und Kommentare stehen in `werkzeug/status.json` (Schlüssel `"3.5"`, `"Tab. 4.8"` oder `"Folie 5"`). Eine Abbildung freigeben: `"status": "freigegeben"` setzen und `inventur.py` laufen lassen. Ohne Eintrag ergibt sich der Status aus den vorhandenen Dateien.

## Auf GitHub Pages veröffentlichen

1. Ordnerinhalt in ein Repository hochladen (die Datei `.nojekyll` mitnehmen).
2. *Settings → Pages → Build and deployment → Deploy from a branch*, Branch `main`, Ordner `/ (root)`.
3. Nach ein bis zwei Minuten unter `https://<benutzer>.github.io/<repository>/` erreichbar.

**Sichtbarkeit:** Eine Pages-Seite ist öffentlich – auch aus einem privaten Repository (Ausnahme: GitHub Enterprise Cloud mit privater Pages-Sichtbarkeit). Die Inventur enthält die Originale der 5. Auflage einschließlich Screenshots und Abbildungen aus Fremdquellen. Wer das nicht öffentlich zeigen will, nutzt die Seite lokal oder einen geschützten Hoster.
