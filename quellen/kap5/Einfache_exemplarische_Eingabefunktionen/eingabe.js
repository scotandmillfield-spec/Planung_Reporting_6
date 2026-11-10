/* Abb. 5.61 „Einfache exemplarische Eingabefunktionen“ – Logik der vier Bedienelemente.
   Kalender (Mehrfachauswahl, Monatswechsel), Zylinder-Zeitauswahl (drei unabhängige Walzen, Klick, Mausrad,
   Pfeiltasten), An- und Ausschalter, Plus- und Minusschalter mit geprüftem Jahresfeld.
   Anfangszustand = Druckfassung: Januar 2027 ohne Auswahl, Mo 25.01. 20:00, Schalter aus, Jahr 2026
   (Original: Januar 2010, Mon Jan 25 8:00 PM, OFF, 2009 – 2027 beginnt wie 2010 an einem Freitag). */
(() => {
  "use strict";
  const { el, pruefeFeld, leseZahl } = MK;
  const PRINT = MK.PRINT;
  MK.init({ titel: "Einfache exemplarische Eingabefunktionen" });
  const $ = id => document.getElementById(id);
  const MONATE = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
  const WT = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
  const WT_LANG = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
  const z2 = n => String(n).padStart(2, "0");
  const tt = d => z2(d.getDate()) + "." + z2(d.getMonth() + 1) + ".";
  const iso = d => d.getFullYear() + "-" + z2(d.getMonth() + 1) + "-" + z2(d.getDate());

  /* ---------- Kalenderauswahl ---------- */
  const K = { jahr: 2027, monat: 0, auswahl: new Set() };
  function kalender() {
    $("kal-monat").textContent = MONATE[K.monat] + " " + K.jahr;
    const kal = $("kal");
    kal.textContent = "";
    const erster = new Date(K.jahr, K.monat, 1);
    const start = new Date(K.jahr, K.monat, 1 - ((erster.getDay() + 6) % 7));     // Montag davor
    for (let i = 0; i < 42; i++) {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      const fremd = d.getMonth() !== K.monat;
      const c = el("div", { class: "tag" + (fremd ? " fremd" : "") + (K.auswahl.has(iso(d)) ? " gewaehlt" : ""),
        role: "gridcell", "aria-label": `${WT_LANG[d.getDay()]}, ${tt(d)}${d.getFullYear()}`,
        "aria-selected": String(K.auswahl.has(iso(d))) }, kal, String(d.getDate()));
      if (PRINT) continue;
      c.tabIndex = fremd ? -1 : 0;
      const waehlen = () => {
        if (fremd) { K.jahr = d.getFullYear(); K.monat = d.getMonth(); }
        if (K.auswahl.has(iso(d))) K.auswahl.delete(iso(d)); else K.auswahl.add(iso(d));
        kalender(); meldeTage();
      };
      c.addEventListener("click", waehlen);
      c.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); waehlen(); } });
    }
  }
  function meldeTage() {
    const t = [...K.auswahl].sort();
    if (!t.length) { MK.meldung("Kein Tag ausgewählt."); return; }
    const f = s => s.slice(8, 10) + "." + s.slice(5, 7) + "." + s.slice(0, 4);
    MK.meldung(`Ausgewählt: ${t.length} ${t.length === 1 ? "Tag" : "Tage"} (${t.slice(0, 4).map(f).join(", ")}${t.length > 4 ? " …" : ""})`);
  }
  const blaettern = schritt => {
    const d = new Date(K.jahr, K.monat + schritt, 1);
    K.jahr = d.getFullYear(); K.monat = d.getMonth(); kalender();
  };
  $("k-zurueck").addEventListener("click", () => blaettern(-1));
  $("k-vor").addEventListener("click", () => blaettern(1));
  kalender();

  /* ---------- Zylinder-Zeitauswahl ---------- */
  const W = { datum: new Date(2027, 0, 25), stunde: 20, minute: 0 };
  const ROLLEN = {
    datum: { wert: k => { const d = W.datum; return new Date(d.getFullYear(), d.getMonth(), d.getDate() + k); },
             text: d => WT[d.getDay()] + " " + tt(d), schieben: k => { W.datum = ROLLEN.datum.wert(k); } },
    stunde: { wert: k => (W.stunde + k + 24) % 24, text: v => z2(v), schieben: k => { W.stunde = (W.stunde + k + 24) % 24; } },
    minute: { wert: k => (W.minute + 5 * k + 60) % 60, text: v => z2(v), schieben: k => { W.minute = (W.minute + 5 * k + 60) % 60; } },
  };
  function walze() {
    Object.entries(ROLLEN).forEach(([name, r]) => {
      const box = $("walze-" + name);
      box.textContent = "";
      for (let i = 0; i < 5; i++) {
        const z = el("div", { class: "zeile-w r" + i, role: "option", "aria-selected": String(i === 2) }, box, r.text(r.wert(i - 2)));
        if (!PRINT && i !== 2) z.addEventListener("click", () => drehen(name, i - 2));
      }
    });
  }
  function drehen(name, k) {
    ROLLEN[name].schieben(k); walze();
    const d = W.datum;
    MK.meldung(`Gewählt: ${WT_LANG[d.getDay()]}, ${tt(d)}${d.getFullYear()}, ${z2(W.stunde)}:${z2(W.minute)} Uhr`);
  }
  if (!PRINT) Object.keys(ROLLEN).forEach(name => {
    const box = $("walze-" + name);
    box.addEventListener("wheel", e => { e.preventDefault(); drehen(name, e.deltaY > 0 ? 1 : -1); }, { passive: false });
    box.addEventListener("keydown", e => {
      if (e.key === "ArrowDown") { e.preventDefault(); drehen(name, 1); }
      if (e.key === "ArrowUp") { e.preventDefault(); drehen(name, -1); }
    });
  });
  walze();

  /* ---------- An- und Ausschalter ---------- */
  const sch = $("f-schalter");
  function schalten() {
    const an = sch.getAttribute("aria-checked") !== "true";
    sch.setAttribute("aria-checked", String(an));
    sch.classList.toggle("an", an);
    $("schalter-text").textContent = an ? "Ein" : "Aus";
    MK.meldung(an ? "Vorjahreswerte werden eingeblendet." : "Vorjahreswerte werden ausgeblendet.");
  }
  if (!PRINT) {
    sch.addEventListener("click", schalten);
    sch.addEventListener("keydown", e => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); schalten(); } });
  }

  /* ---------- Plus- und Minusschalter ---------- */
  const jahr = $("f-jahr"), MIN = 2000, MAX = 2099;
  const pruefen = () => pruefeFeld(jahr, "zahl", { pflicht: true, min: MIN, max: MAX, meldung: `Jahr zwischen ${MIN} und ${MAX}` });
  function stufe(k) {
    const v = pruefen();
    const neu = Math.min(MAX, Math.max(MIN, (v === null ? 2026 : Math.round(v)) + k));
    jahr.value = String(neu); pruefen();
    if (neu === MIN || neu === MAX) MK.meldung(`Grenze erreicht: ${neu}`);
  }
  jahr.addEventListener("input", pruefen);
  jahr.addEventListener("blur", () => { const v = leseZahl(jahr.value); if (v !== null && !isNaN(v) && v >= MIN && v <= MAX) jahr.value = String(Math.round(v)); });
  jahr.addEventListener("keydown", e => {
    if (e.key === "ArrowUp") { e.preventDefault(); stufe(1); }
    if (e.key === "ArrowDown") { e.preventDefault(); stufe(-1); }
  });
  $("k-minus").addEventListener("click", () => stufe(-1));
  $("k-plus").addEventListener("click", () => stufe(1));

  /* ---------- Lernplattform: Erläuterungen und Gestaltung ---------- */
  MK.ebenen({
    erlaeuterungen: {
      titel: "Erläuterungen",
      intro: "Wofür die Eingabefunktionen in Planungs- und BI-Anwendungen auf Tablet und Smartphone dienen. Die Nummern in der Maske zeigen, wo.",
      eintraege: [
        { nr: 1, ziel: "band-kalender", versatz: [-6, 2], titel: "Kalenderauswahl",
          text: "Stichtage und Zeiträume werden angetippt statt eingetippt – etwa Berichtsstichtag, Planungstermine oder Abwesenheiten. Mehrere Tage sind wählbar; ein zweiter Klick hebt die Auswahl wieder auf." },
        { nr: 2, ziel: "kal-monat", versatz: [-62, 2], titel: "Monat wechseln",
          text: "Die Pfeile blättern monatsweise. Tage der Nachbarmonate erscheinen grau; ein Klick darauf wechselt in diesen Monat." },
        { nr: 3, ziel: "band-walze", versatz: [-6, 2], titel: "Zylinder-Zeitauswahl",
          text: "Datum und Uhrzeit auf kleinem Bildschirm: Jede Walze dreht sich unabhängig (Klick auf eine Zeile, Mausrad oder Pfeiltasten), der Wert im Band gilt. Beispiel: Termin für den automatischen Berichtsversand oder die Abgabefrist der Planung." },
        { nr: 4, ziel: "walze-minute", versatz: [-60, 30], titel: "Nur gültige Werte",
          text: "Die Walzen bieten nur gültige Werte an, Minuten im Raster von 5. Tippfehler und unmögliche Angaben wie der 31.02. sind ausgeschlossen." },
        { nr: 5, ziel: "band-schalter", versatz: [-6, 2], titel: "An- und Ausschalter",
          text: "Für Einstellungen mit genau zwei Zuständen, etwa Vorjahreswerte einblenden, Benachrichtigung bei Planabweichungen oder eine Simulation ein- und ausschalten. Der Schalter wirkt sofort, ohne Speichern." },
        { nr: 6, ziel: "band-stepper", versatz: [-6, 2], titel: "Plus- und Minusschalter",
          text: "Ändert einen Zahlenwert in festen Schritten – Jahr, Planversion, Menge oder Prozentpunkte in einer What-if-Simulation. Der Wert lässt sich auch direkt eingeben." },
        { nr: 7, ziel: "kopf-unter", versatz: [6, 2], titel: "Auswählen statt tippen",
          text: "Mobile BI- und Planungsanwendungen ersetzen Tastatureingaben durch Auswahl mit großen Trefferflächen. Das beschleunigt die Erfassung unterwegs und vermeidet Eingabefehler, verlangt aber ein responsives Design der Masken." },
      ],
    },
    gestaltung: {
      titel: "Gestaltung",
      intro: "Was gegenüber dem Original geändert wurde – softwareneutral im Buchstil und nach den Interaktionsprinzipien der DIN EN ISO 9241-110.",
      eintraege: [
        { nr: "A", ziel: "kopf-titel", versatz: [8, 2], regel: "BUCHSTIL – SOFTWARENEUTRAL", titel: "Kein Gerät, keine Systemleiste",
          text: "Die Navigationsleiste des Smartphones mit „Back“ und „Select Days“ entfällt. Die vier Beispiele stehen als eine Maske mit Abschnittsbändern, benannt wie im Original." },
        { nr: "B", ziel: "kal-kopf", anker: "links", versatz: [0, 2], regel: "ERWARTUNGSKONFORMITÄT", titel: "Woche ab Montag, deutsch",
          text: "Die Woche beginnt am Montag (ISO 8601), Wochentage und Monat sind deutsch. Das Original zeigte englische Bezeichnungen und begann am Sonntag." },
        { nr: "C", ziel: "walze-stunde", versatz: [-62, 30], regel: "ERWARTUNGSKONFORMITÄT", titel: "24-Stunden-Format",
          text: "Uhrzeit im 24-Stunden-Format, Datum als TT.MM. – aus „Mon Jan 25 8:00 PM“ wird „Mo 25.01. 20:00“. Die AM/PM-Walze entfällt." },
        { nr: "D", ziel: "walze-kopf", versatz: [-190, 2], regel: "SELBSTBESCHREIBUNGSFÄHIGKEIT", titel: "Flache Walze mit Spaltenköpfen",
          text: "Verläufe, Glanz und Schatten der 3D-Walze entfallen; die gültige Zeile ist ein graues Band mit Linien, die äußeren Zeilen werden heller. Die Köpfe Datum, Stunde und Minute sind ergänzt." },
        { nr: "E", ziel: "f-schalter", versatz: [36, 2], regel: "SELBSTBESCHREIBUNGSFÄHIGKEIT", titel: "Zustand dreifach erkennbar",
          text: "Stellung des Knopfs, Füllung und Text „Aus“/„Ein“ (statt OFF) zeigen den Zustand – nicht die Farbe allein. Die Beschriftung sagt, wofür der Schalter steht; das Original hatte keine." },
        { nr: "F", ziel: "f-jahr", versatz: [62, 2], regel: "ROBUSTHEIT GEGEN BENUTZUNGSFEHLER", titel: "Jahr geprüft",
          text: "Das Jahr ist auch direkt eingebbar; ungültige Werte werden rot markiert. Plus und Minus bleiben an den Grenzen 2000 und 2099 stehen. Beschriftung „Jahr“ ergänzt." },
        { nr: "G", ziel: "k-zurueck", anker: "links", versatz: [0, 2], regel: "STEUERBARKEIT", titel: "Gleichwertige Knöpfe, Tastatur",
          text: "Blauer Plus- und grauer Minusknopf werden zu gleich gestalteten Knöpfen mit Rahmen, die blaue Auswahl der Walze zu Grau. Alle Elemente sind auch mit Tastatur bedienbar (Tab, Pfeiltasten, Leertaste)." },
        { nr: "H", ziel: "kal-monat", versatz: [-62, 2], regel: "BUCHSTIL – NEUTRAL UND AKTUELL", titel: "Aktuelle Jahre",
          text: "Januar 2010 → Januar 2027, Jahr 2009 → 2026. Die Wochentage bleiben gleich, weil 2027 wie 2010 an einem Freitag beginnt." },
      ],
    },
  });
  MK.fertig();
})();
