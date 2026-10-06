/**
 * Abstimmung der Abbildungsinventur (6. Auflage)
 *
 * Web-App zur Google-Tabelle „Abbildungsinventur 6. Auflage – Status“.
 *   GET   liefert Status und Kommentare aller Abbildungen als JSON (für index.html)
 *   POST  setzt Status, hängt einen Kommentar an und vermerkt Name und Datum (mit Passwort)
 *
 * Einrichtung (einmalig, Anleitung auch im README des Repositorys):
 *   1. In der Tabelle: Erweiterungen → Apps Script, diesen Code einfügen, PASSWORT unten ändern, speichern.
 *   2. Funktion „einrichten“ auswählen und ausführen (legt Auswahlliste, Format und das Blatt „Hinweise“ an).
 *   3. Bereitstellen → Neue Bereitstellung → Typ „Web-App“, Ausführen als „Ich“, Zugriff „Jeder“.
 *   4. Die Web-App-URL in werkzeug/abstimmung.json des Repositorys eintragen.
 * Nach Änderungen am Code: Bereitstellen → Bereitstellungen verwalten → Bearbeiten → Version „Neue Version“
 * (so bleibt die URL gleich).
 */

const PASSWORT = 'bitte-aendern';
const BLATT = 'Status';
const STATUSWERTE = ['offen', 'in Arbeit', 'zur Prüfung', 'Änderung nötig', 'Klärung nötig', 'freigegeben', 'entfällt'];
const SP = { schluessel: 1, status: 6, kommentare: 7, von: 8, am: 9 };   // Spalten, 1-basiert
const ZONE = 'Europe/Berlin';

/* ---------------- Web-App ---------------- */

function doGet() {
  return antwort_({ ok: true, stand: Utilities.formatDate(new Date(), ZONE, 'dd.MM.yyyy HH:mm'), eintraege: alleLesen_() });
}

function doPost(e) {
  let d;
  try {
    d = JSON.parse(e.postData.contents);
  } catch (err) {
    return antwort_({ ok: false, fehler: 'Ungültige Anfrage' });
  }
  if (String(d.passwort || '') !== PASSWORT) return antwort_({ ok: false, fehler: 'Passwort falsch' });
  if (d.aktion === 'pruefen') return antwort_({ ok: true });

  const autor = bereinigen_(d.autor).slice(0, 40);
  if (!autor) return antwort_({ ok: false, fehler: 'Name fehlt' });
  if (d.status && STATUSWERTE.indexOf(d.status) < 0) return antwort_({ ok: false, fehler: 'Unbekannter Status' });

  const sperre = LockService.getScriptLock();
  sperre.waitLock(20000);
  try {
    const blatt = blatt_();
    const n = blatt.getLastRow() - 1;
    const schluessel = n > 0 ? blatt.getRange(2, SP.schluessel, n, 1).getValues().map(z => String(z[0])) : [];
    const i = schluessel.indexOf(String(d.schluessel));
    if (i < 0) return antwort_({ ok: false, fehler: 'Abbildung nicht in der Tabelle' });
    const zeile = i + 2;
    if (d.status) blatt.getRange(zeile, SP.status).setValue(d.status);
    const text = bereinigen_(d.kommentar).replace(/\s+/g, ' ').slice(0, 2000);
    if (text) {
      const zelle = blatt.getRange(zeile, SP.kommentare);
      const alt = String(zelle.getValue() || '');
      const neu = Utilities.formatDate(new Date(), ZONE, 'dd.MM.yyyy') + ' ' + autor + ': ' + text;
      zelle.setValue(alt ? alt + '\n' + neu : neu);
    }
    blatt.getRange(zeile, SP.von).setValue(autor);
    blatt.getRange(zeile, SP.am).setValue(new Date());
    SpreadsheetApp.flush();
    return antwort_({ ok: true, eintrag: zeileLesen_(blatt.getRange(zeile, 1, 1, SP.am).getValues()[0]) });
  } finally {
    sperre.releaseLock();
  }
}

/* ---------------- Direkte Bearbeitung in der Tabelle ---------------- */

// Einfacher Trigger: Wer Status oder Kommentar in der Tabelle selbst ändert, bekommt Datum (und, falls
// Google sie liefert, die Mail-Kennung) in „Geändert von/am“.
function onEdit(e) {
  if (!e || !e.range) return;
  const blatt = e.range.getSheet();
  if (blatt.getName() !== BLATT) return;
  const r0 = e.range.getRow(), r1 = e.range.getLastRow(), c0 = e.range.getColumn(), c1 = e.range.getLastColumn();
  if (r1 < 2 || c1 < SP.status || c0 > SP.kommentare) return;
  let wer = '';
  try { wer = (e.user && e.user.getEmail && e.user.getEmail()) || ''; } catch (err) { wer = ''; }
  for (let r = Math.max(2, r0); r <= r1; r++) {
    blatt.getRange(r, SP.am).setValue(new Date());
    if (wer) blatt.getRange(r, SP.von).setValue(wer.split('@')[0]);
  }
}

/* ---------------- Einrichtung ---------------- */

function einrichten() {
  const ss = SpreadsheetApp.getActive();
  const blatt = blatt_();
  if (blatt.getName() !== BLATT) blatt.setName(BLATT);
  const n = Math.max(1, blatt.getLastRow() - 1);

  blatt.setFrozenRows(1);
  blatt.setFrozenColumns(3);
  blatt.getRange(1, 1, n + 1, SP.am).setFontFamily('Arial').setVerticalAlignment('top');
  blatt.getRange(1, 1, 1, SP.am).setFontWeight('bold').setFontColor('#FFFFFF').setBackground('#3A3F44');
  [100, 70, 130, 420, 130, 130, 440, 110, 100].forEach((b, i) => blatt.setColumnWidth(i + 1, b));
  blatt.getRange(2, 4, n, 1).setWrap(true);
  blatt.getRange(2, SP.kommentare, n, 1).setNumberFormat('@').setWrap(true);
  blatt.getRange(2, SP.von, n, 1).setNumberFormat('@');
  blatt.getRange(2, SP.am, n, 1).setNumberFormat('dd.MM.yyyy');

  const statusBereich = blatt.getRange(2, SP.status, n, 1);
  statusBereich.setDataValidation(SpreadsheetApp.newDataValidation()
    .requireValueInList(STATUSWERTE, true).setAllowInvalid(false).build());
  const regel = (text, farbe) => SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo(text).setFontColor(farbe).setBold(true).setRanges([statusBereich]).build();
  blatt.setConditionalFormatRules([
    regel('freigegeben', '#00806B'), regel('Änderung nötig', '#C62828'), regel('Klärung nötig', '#C62828')]);
  if (!blatt.getFilter()) blatt.getRange(1, 1, n + 1, SP.am).createFilter();

  hinweiseAnlegen_(ss);
}

function hinweiseAnlegen_(ss) {
  let h = ss.getSheetByName('Hinweise');
  if (!h) h = ss.insertSheet('Hinweise');
  h.clear();
  const zeilen = [
    ['Statuswerte', ''],
    ['offen', 'noch nicht bearbeitet'],
    ['in Arbeit', 'wird gerade neu gezeichnet oder gesetzt'],
    ['zur Prüfung', 'neue Fassung liegt vor und wartet auf Durchsicht'],
    ['Änderung nötig', 'Durchsicht abgeschlossen, Kommentare umsetzen'],
    ['Klärung nötig', 'inhaltliche Frage offen, vor der Umsetzung klären'],
    ['freigegeben', 'fertig für das Manuskript'],
    ['entfällt', 'wird in der 6. Auflage nicht mehr verwendet'],
    ['', ''],
    ['Kommentare', 'je Hinweis eine neue Zeile in der Zelle, beginnend mit Datum und Kürzel, z. B. „06.10.2026 MD: Achsenbeschriftung kürzen“'],
    ['Schlüssel', 'verbindet die Zeile mit der Abbildung in der Inventur; nicht ändern'],
  ];
  h.getRange(1, 1, zeilen.length, 2).setValues(zeilen).setFontFamily('Arial').setVerticalAlignment('top');
  h.getRange('A1:A' + zeilen.length).setFontWeight('bold');
  h.getRange('B1:B' + zeilen.length).setWrap(true);
  h.setColumnWidth(1, 140);
  h.setColumnWidth(2, 620);
}

/* ---------------- Hilfsfunktionen ---------------- */

function blatt_() {
  const ss = SpreadsheetApp.getActive();
  return ss.getSheetByName(BLATT) || ss.getSheets()[0];
}

function alleLesen_() {
  const blatt = blatt_();
  const n = blatt.getLastRow() - 1;
  const aus = {};
  if (n < 1) return aus;
  blatt.getRange(2, 1, n, SP.am).getValues().forEach(z => {
    if (z[SP.schluessel - 1]) aus[String(z[SP.schluessel - 1])] = zeileLesen_(z);
  });
  return aus;
}

function zeileLesen_(z) {
  const am = z[SP.am - 1];
  return {
    status: String(z[SP.status - 1] || ''),
    kommentare: String(z[SP.kommentare - 1] || ''),
    von: String(z[SP.von - 1] || ''),
    am: am instanceof Date ? Utilities.formatDate(am, ZONE, 'dd.MM.yyyy') : String(am || ''),
  };
}

// Text ohne führende Formelzeichen, damit nichts als Formel in die Tabelle gelangt
function bereinigen_(s) {
  return String(s == null ? '' : s).trim().replace(/^[=+\-@]+/, '').trim();
}

function antwort_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
