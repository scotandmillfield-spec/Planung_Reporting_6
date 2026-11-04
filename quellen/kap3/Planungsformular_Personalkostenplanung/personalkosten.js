/* Abb. 3.189 „Planungsformular Personalkostenplanung“ – Logik des Reiters „Planstellen bearbeiten“.
   Je Planstelle werden FTE, Monatsentgelt und Gültigkeit geplant; Monate und Personalkosten rechnen sich nach:
     Grundentgelt  = FTE × Monatsentgelt × Anteil des Monats (tagesgenau innerhalb von „gültig von/bis“)
     Zulagen       = Grundentgelt × Zulagen %
     Sonderzahlung = FTE × Monatsentgelt × Anteil × Urlaubsgeld % (Juli) bzw. Weihnachtsgeld % (November)
     Sozialabgaben = (Grundentgelt + Zulagen + Sonderzahlung) × Sozialabgaben %
     Anwesenheitslohn = Grundentgelt + Zulagen; Lohnnebenkosten = Sonderzahlung + Sozialabgaben.
   Jeder Monatswert je Kostenart wird auf Cent gerundet (wie im Datengenerator der Planungsauswertung).
   Der Block PLAN ist reines JSON: ../Planungsauswertung_Personalkostenplanung/daten_personalkosten.py liest ihn
   und rechnet mit denselben Regeln die Monatswerte der Auswertung (Abb. 3.190) – beide Abbildungen zeigen
   also dieselben Planstellen und dieselben Summen.
   Werte des Originals: Planstellen, Köpfe und Gültigkeiten unverändert; Entgelte von 2007 mit Faktor 1,6 auf
   2027 fortgeschrieben (2.248 → 3.600 € usw.); Prämissen ergänzt (im Original im Reiter „Prämissen“). */
(() => {
  "use strict";
  const { el, zahl, leseDatum, datum, pruefeFeld } = MK;
  MK.init({ titel: "Planungsformular Personalkostenplanung" });
  const $ = id => document.getElementById(id);
  const NBSP = MK.NBSP;

  /* PLANDATEN-ANFANG */
  const PLAN = {
    "planjahr": 2027,
    "planversion": "0",
    "version": "Plan/Ist",
    "buchungskreis": "6000",
    "kostenstelle": ["6-1110", "Intralogistik"],
    "praemissen": {"zulagen": 20.0, "urlaubsgeld": 25.0, "urlaubsgeld_monat": 7,
                   "weihnachtsgeld": 100.0, "weihnachtsgeld_monat": 11, "sozialabgaben": 26.0},
    "referenz": "50032721",
    "felder": ["planstelle", "bezeichnung", "mitarbeiterkreis", "meisterbereich", "vertragsart", "fte", "monatsentgelt", "von", "bis"],
    "planstellen": [
      ["50032712", "Teamleitung", "Gewerblich", "Intralogistik", "unbefristet", 1.0, 3600, "01.01.2027", "30.06.2027"],
      ["50032713", "Teamleitung", "Gewerblich", "Intralogistik", "unbefristet", 1.0, 3600, "01.01.2027", "31.12.2027"],
      ["50032714", "Teamleitung", "Gewerblich", "Intralogistik", "unbefristet", 1.0, 3600, "01.01.2027", "31.12.2027"],
      ["50032715", "Teamleitung", "Gewerblich", "Intralogistik", "unbefristet", 1.0, 3360, "01.01.2027", "31.12.2027"],
      ["50032716", "Kommissionierung", "Gewerblich", "Intralogistik", "unbefristet", 1.0, 3360, "01.01.2027", "31.12.2027"],
      ["50032717", "Materialbereitstellung", "Gewerblich", "Intralogistik", "unbefristet", 1.0, 3520, "01.01.2027", "31.12.2027"],
      ["50032718", "Materialbereitstellung", "Gewerblich", "Intralogistik", "unbefristet", 1.0, 3360, "01.01.2027", "31.12.2027"],
      ["50032719", "Materialbereitstellung", "Gewerblich", "Intralogistik", "unbefristet", 1.0, 3390, "01.01.2027", "31.12.2027"],
      ["50032720", "Materialbereitstellung", "Gewerblich", "Intralogistik", "unbefristet", 1.0, 3390, "01.01.2027", "31.12.2027"],
      ["50032721", "Teamleitung", "Gewerblich", "Intralogistik", "befristet", 5.0, 4000, "01.07.2027", "31.12.2027"]
    ]
  };
  /* PLANDATEN-ENDE */

  const P = PLAN.praemissen, JAHR = PLAN.planjahr, MAX_ZEILEN = 14;

  /* ---------- Rechenregeln (identisch mit daten_personalkosten.py) ---------- */
  const TAG = 86400000;
  const tagNr = d => Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / TAG);
  function anteile(von, bis) {                          // je Monat: Anteil der gültigen Tage (0 … 1)
    return Array.from({ length: 12 }, (_, m) => {
      const a = Math.round(Date.UTC(JAHR, m, 1) / TAG), e = Math.round(Date.UTC(JAHR, m + 1, 1) / TAG) - 1;
      const ue = Math.min(bis, e) - Math.max(von, a) + 1;
      return ue > 0 ? ue / (e - a + 1) : 0;
    });
  }
  const cent = x => Math.floor(x * 100 + 0.5);
  function kosten(fte, entgelt, ant) {                  // je Monat [Grundentgelt, Zulagen, Sonderzahlung, Sozialabgaben] in Cent
    return ant.map((a, m) => {
      const grund = fte * entgelt * a;
      const zul = grund * P.zulagen / 100;
      const satz = m + 1 === P.urlaubsgeld_monat ? P.urlaubsgeld : m + 1 === P.weihnachtsgeld_monat ? P.weihnachtsgeld : 0;
      const sonder = fte * entgelt * a * satz / 100;
      const sozial = (grund + zul + sonder) * P.sozialabgaben / 100;
      return [cent(grund), cent(zul), cent(sonder), cent(sozial)];
    });
  }

  /* ---------- Kopf, Auswahl, Prämissen ---------- */
  $("f-version").textContent = PLAN.version;
  $("f-gjahr").textContent = String(JAHR);
  $("kopf-erg").textContent = `Ergebnis ${JAHR}`;
  $("p-zulagen").textContent = zahl(P.zulagen, 1);
  $("p-urlaub").textContent = zahl(P.urlaubsgeld, 1);
  $("p-weihnacht").textContent = zahl(P.weihnachtsgeld, 1);
  $("p-sozial").textContent = zahl(P.sozialabgaben, 1);
  $("p-zulagen").title = "Schicht- und Leistungszulagen in % des Grundentgelts";
  $("p-urlaub").title = "Urlaubsgeld im Juli in % eines Monatsentgelts";
  $("p-weihnacht").title = "Weihnachtsgeld im November in % eines Monatsentgelts";
  $("p-sozial").title = "Arbeitgeberanteile zur Sozialversicherung und Umlagen in % von Anwesenheitslohn und Sonderzahlungen";

  /* ---------- Planstellen ---------- */
  const mx = $("mx");
  const zeilen = [];                                    // { p, z, fte, entgelt, von, bis, monate, pk, radio, werte }
  const HILFE = {
    fte: "Kapazität der Planstelle in Vollzeitäquivalenten, z. B. 1,00",
    entgelt: "Monatsentgelt je FTE in € (Grundentgelt ohne Zulagen)",
    von: "Beginn der Gültigkeit, TT.MM.JJJJ",
    bis: "Ende der Gültigkeit, TT.MM.JJJJ",
  };
  let summenZeile;

  function zeileAnlegen(p) {
    const i = zeilen.length;
    const z = el("div", { class: "mx-zeile", id: "z" + i, role: "row" });
    mx.insertBefore(z, summenZeile || null);
    const r = { p, z };
    const zelle = el("div", { class: "mx-r" }, z);
    r.radio = el("input", { type: "radio", class: "mk-check", name: "wahl", id: "w" + i,
      "aria-label": `Planstelle ${p.planstelle} markieren` }, zelle);
    const anzeige = (text, id) => el("div", { class: "mk-feld mk-anzeige", id }, z, text);
    anzeige(p.planstelle, "ps-" + i);
    anzeige(p.bezeichnung, "bez-" + i);
    anzeige(p.mitarbeiterkreis, "kreis-" + i);
    anzeige(p.meisterbereich, "bereich-" + i);
    anzeige(p.vertragsart, "vertrag-" + i);
    const eingabe = (cls, id, wert, hilfe, aria) => el("input", { class: "mk-feld " + cls, id, value: wert, "data-hilfe": hilfe,
      title: hilfe, "aria-label": `${aria}, Planstelle ${p.planstelle}`, inputmode: cls.includes("mk-zahl") ? "decimal" : "text" }, z);
    r.fte = eingabe("mk-zahl trenn", "fte-" + i, p.fte == null ? "" : zahl(p.fte, 2), HILFE.fte, "FTE");
    r.entgelt = eingabe("mk-zahl", "ent-" + i, p.monatsentgelt == null ? "" : zahl(p.monatsentgelt, 0), HILFE.entgelt, "Monatsentgelt in €");
    r.von = eingabe("mk-datum", "von-" + i, p.von, HILFE.von, "gültig von");
    r.bis = eingabe("mk-datum", "bis-" + i, p.bis, HILFE.bis, "gültig bis");
    r.monate = el("div", { class: "mk-feld mk-anzeige mk-zahl", id: "mon-" + i }, z);
    r.pk = el("div", { class: "mk-feld mk-anzeige mk-zahl", id: "pk-" + i }, z);
    // Prüfen und rechnen bei jeder Eingabe; beim Verlassen formatieren
    const PR_FTE = { min: 0, max: 99, meldung: "FTE von 0 bis 99 mit Dezimalkomma, z. B. 1,00" };
    const PR_ENT = { min: 0, max: 99999, meldung: "Monatsentgelt in € von 0 bis 99.999, z. B. 3.600" };
    const PR_DAT = { pflicht: true, meldung: "Datum als TT.MM.JJJJ, z. B. 01.07.2027" };
    r.fte.addEventListener("input", () => { pruefeFeld(r.fte, "zahl", PR_FTE); rechnen(); });
    r.entgelt.addEventListener("input", () => { pruefeFeld(r.entgelt, "zahl", PR_ENT); rechnen(); });
    [r.von, r.bis].forEach(f => f.addEventListener("input", () => { pruefeFeld(f, "datum", PR_DAT); rechnen(); }));
    r.fte.addEventListener("blur", () => { const v = wert(r.fte); if (v != null) r.fte.value = zahl(v, 2); });
    r.entgelt.addEventListener("blur", () => { const v = wert(r.entgelt); if (v != null) r.entgelt.value = zahl(v, 0); });
    [r.von, r.bis].forEach(f => f.addEventListener("blur", () => { const d = leseDatum(f.value); if (d && !f.classList.contains("mk-fehler")) f.value = datum(d); }));
    // Markierte Zeile wird Referenzplanstelle
    r.radio.addEventListener("change", () => {
      if (r.radio.checked && !p.nn) $("f-referenz").value = p.planstelle;
      else if (p.nn) MK.meldung("NN-Zeilen haben noch keine Planstelle und taugen nicht als Referenz.");
    });
    zeilen.push(r);
    return r;
  }
  const wert = f => { const v = MK.leseZahl(f.value); return v == null || isNaN(v) || f.classList.contains("mk-fehler") ? null : v; };

  PLAN.planstellen.forEach(a => zeileAnlegen(Object.fromEntries(PLAN.felder.map((k, j) => [k, a[j]]))));
  summenZeile = el("div", { class: "mx-zeile summe", id: "z-summe", role: "row" }, mx);
  el("div", { class: "mx-l", id: "l-summe" }, summenZeile, "Summe");
  const pkSumme = el("div", { class: "mk-feld mk-anzeige mk-zahl", id: "pk-summe" }, summenZeile);

  /* ---------- Rechnen ---------- */
  const summe = a => a.reduce((s, v) => s + v, 0);
  function zeileRechnen(r) {
    const fte = wert(r.fte), ent = wert(r.entgelt);
    const dv = r.von.classList.contains("mk-fehler") ? null : leseDatum(r.von.value);
    const db = r.bis.classList.contains("mk-fehler") ? null : leseDatum(r.bis.value);
    r.werte = null;
    if (dv && db && tagNr(db) < tagNr(dv)) {
      r.bis.classList.add("mk-fehler"); r.bis.title = "Das Bis-Datum liegt vor dem Von-Datum.";
      r.monate.textContent = "–"; r.pk.textContent = "–"; r.pk.title = ""; return;
    }
    if (!dv || !db) { r.monate.textContent = "–"; r.pk.textContent = "–"; r.pk.title = ""; return; }
    const ant = anteile(tagNr(dv), tagNr(db));
    r.mon = summe(ant);
    r.monate.textContent = zahl(r.mon, 1);
    if (fte == null || ent == null) { r.pk.textContent = "–"; r.pk.title = "FTE und Monatsentgelt eintragen"; return; }
    r.fteWert = fte;
    r.werte = kosten(fte, ent, ant);
    const k = [0, 1, 2, 3].map(j => summe(r.werte.map(w => w[j])) / 100);
    r.pk.textContent = zahl(summe(k), 0);
    r.pk.title = `Anwesenheitslohn ${zahl(k[0] + k[1], 0)} € (Grundentgelt ${zahl(k[0], 0)} €, Zulagen ${zahl(k[1], 0)} €) · ` +
                 `Lohnnebenkosten ${zahl(k[2] + k[3], 0)} € (Sonderzahlungen ${zahl(k[2], 0)} €, Sozialabgaben ${zahl(k[3], 0)} €)`;
  }
  function rechnen() {
    zeilen.forEach(zeileRechnen);
    const mit = zeilen.filter(r => r.werte);
    const k = [0, 1, 2, 3].map(j => summe(mit.map(r => summe(r.werte.map(w => w[j])))) / 100);
    const pk = summe(k);
    pkSumme.textContent = zahl(pk, 0);
    $("e-pk").textContent = zahl(pk, 0);
    $("e-al").textContent = zahl(k[0] + k[1], 0);
    $("e-lnk").textContent = zahl(k[2] + k[3], 0);
    $("e-fte").textContent = zahl(summe(mit.map(r => r.fteWert * r.mon)) / 12, 1);
  }

  /* ---------- Referenzplanstelle, Planstelle generieren, NN-Zeilen ---------- */
  const ref = $("f-referenz");
  function referenzOptionen() {
    const alt = ref.value || PLAN.referenz;
    ref.textContent = "";
    zeilen.filter(r => !r.p.nn).forEach(r => el("option", { value: r.p.planstelle }, ref, `${r.p.planstelle} ${String.fromCharCode(0x2013)} ${r.p.bezeichnung}`));
    ref.value = alt;
  }
  referenzOptionen();
  ref.value = PLAN.referenz;
  function neuAufbauen() { rechnen(); MK.skalieren(); if (MK._ebenenNeu) MK._ebenenNeu(); }
  $("k-generieren").addEventListener("click", () => {
    if (zeilen.length >= MAX_ZEILEN) { MK.meldung(`Beispielmaske: höchstens ${MAX_ZEILEN} Zeilen.`); return; }
    const vorlage = zeilen.find(r => r.p.planstelle === ref.value);
    if (!vorlage) return;
    const nr = String(Math.max(...zeilen.filter(r => !r.p.nn).map(r => Number(r.p.planstelle))) + 1);
    const ent = wert(vorlage.entgelt);
    zeileAnlegen({ ...vorlage.p, planstelle: nr, fte: 1, monatsentgelt: ent == null ? vorlage.p.monatsentgelt : ent,
                   von: `01.01.${JAHR}`, bis: `31.12.${JAHR}` });
    referenzOptionen();
    neuAufbauen();
    MK.meldung(`Planstelle ${nr} nach dem Muster von ${vorlage.p.planstelle} generiert: 1,00 FTE, ganzjährig.`);
  });
  $("k-neu").addEventListener("click", () => {
    const n = pruefeFeld($("f-neu"), "zahl", { min: 1, max: 4, pflicht: true, meldung: "Anzahl von 1 bis 4" });
    if (n == null || n !== Math.round(n)) { $("f-neu").classList.add("mk-fehler"); return; }
    const frei = Math.min(n, MAX_ZEILEN - zeilen.length);
    if (frei <= 0) { MK.meldung(`Beispielmaske: höchstens ${MAX_ZEILEN} Zeilen.`); return; }
    for (let k = 0; k < frei; k++)
      zeileAnlegen({ planstelle: "NN", bezeichnung: "noch offen", mitarbeiterkreis: "–", meisterbereich: "–", vertragsart: "–",
                     fte: null, monatsentgelt: null, von: `01.01.${JAHR}`, bis: `31.12.${JAHR}`, nn: true });
    neuAufbauen();
    MK.meldung(`${frei} NN-${frei === 1 ? "Zeile" : "Zeilen"} angefügt – FTE und Monatsentgelt eintragen.`);
  });
  $("f-neu").addEventListener("input", () => pruefeFeld($("f-neu"), "zahl", { min: 1, max: 4, pflicht: true, meldung: "Anzahl von 1 bis 4" }));

  /* ---------- Aktionen und Reiter ---------- */
  $("k-aktualisieren").addEventListener("click", () => { rechnen(); MK.meldung("Personalkosten neu berechnet."); });
  $("k-sichern").addEventListener("click", () => MK.meldung("Beispielmaske: Die Planwerte werden nicht gespeichert."));
  $("k-beenden").addEventListener("click", () => MK.meldung("Beispielmaske: Beenden ist ohne Funktion."));
  [...$("reiter").children].forEach(s => s.addEventListener("click", () => {
    if (s.classList.contains("aktiv")) return;
    MK.meldung(s.id === "reiter-auswertung"
      ? "Die Auswertung zeigt die Abbildung „Planungsauswertung Personalkostenplanung“ – mit genau diesen Planstellen."
      : `Beispielmaske: ausgeführt ist nur der Reiter „Planstellen bearbeiten“.`);
  }));

  rechnen();

  /* ---------- Lernplattform: Erläuterungen und Gestaltung ---------- */
  MK.ebenen({
    erlaeuterungen: {
      titel: "Erläuterungen",
      intro: "Was die Bereiche des Planungsformulars in der Personalkostenplanung leisten. Die Nummern in der Maske zeigen, wo.",
      eintraege: [
        { nr: 1, ziel: "f-kostenstelle", versatz: [14, 0], titel: "Planungsobjekt Kostenstelle",
          text: "Geplant wird je Kostenstelle, Planjahr und Planversion. Version 0 nimmt die verabschiedete Planung auf (Plan/Ist-Version), weitere Versionen dienen Szenarien. Das Geschäftsjahr folgt aus dem Planjahr." },
        { nr: 2, ziel: "kopf-praem", versatz: [0, 2], titel: "Prämissen der Personalkosten",
          text: "Zulagen, Urlaubs- und Weihnachtsgeld sowie die Sozialabgaben legt der Reiter „Prämissen“ für die Kostenstelle fest; hier werden sie nur angezeigt. Ändert sich etwa der Beitragssatz, wird die Prämisse einmal geändert, statt jede Planstelle anzufassen." },
        { nr: 3, ziel: "reiter-aktiv", versatz: [0, -20], titel: "Ablauf in Reitern",
          text: "Die Reiter folgen dem Ablauf: Prämissen setzen, Planstellen der Kostenstelle zuordnen und bearbeiten, Abrechnungsdaten ergänzen, das Ergebnis in die Kostenstellenplanung (Jahr und Perioden) übergeben und auswerten." },
        { nr: 4, ziel: "kreis-0", versatz: [0, 2], titel: "Stellenbezogen planen",
          text: "Jede Zeile ist eine Planstelle des Stellenplans; Mitarbeiterkreis, Meisterbereich und Vertragsart kommen aus den Stammdaten. Geplant wird stellenbezogen, nicht personenbezogen – Namen und individuelle Gehälter bleiben in der Entgeltabrechnung." },
        { nr: 5, ziel: "vertrag-9", versatz: [4, 2], titel: "FTE und Monatsentgelt",
          text: "Geplant werden die Kapazität in Vollzeitäquivalenten (FTE) und das Monatsentgelt je FTE. Die Sammelplanstelle 50032721 plant 5 FTE Teamleitung, befristet ab Juli – etwa für den Anlauf eines neuen Auftrags." },
        { nr: 6, ziel: "h-von", versatz: [0, -30], titel: "Gültigkeit im Jahresverlauf",
          text: "Von- und Bis-Datum begrenzen eine Planstelle auf einen Teil des Jahres; angebrochene Monate zählen tagesgenau anteilig. So werden Abgänge (50032712 bis Juni) und Zugänge (ab Juli) im Monatsverlauf der Auswertung sichtbar." },
        { nr: 7, ziel: "h-pk", versatz: [0, -30], titel: "Personalkosten rechnen sich nach",
          text: "Anwesenheitslohn = FTE × Monatsentgelt × Monate × (1 + Zulagen). Lohnnebenkosten = Urlaubsgeld im Juli, Weihnachtsgeld im November und Sozialabgaben auf beides. Zeilen, Summe und Ergebnis rechnen bei jeder Eingabe neu; die Planungsauswertung zeigt dieselben Werte nach Monat und Kostenart." },
        { nr: 8, ziel: "k-generieren", versatz: [26, 2], titel: "Planstellen und NN-Zeilen",
          text: "„Planstelle generieren“ legt eine neue Planstelle nach dem Muster der Referenzplanstelle an. „Neue Zeilen“ nimmt Stellen auf, die noch keiner Planstelle zugeordnet sind (NN plus). Wie viele nötig sind, ergibt die Abstimmung von Kapazitätsbedarf und Stundenleistung." },
      ],
    },
    gestaltung: {
      titel: "Gestaltung",
      intro: "Was gegenüber dem Original geändert wurde – softwareneutral im Buchstil und nach den Interaktionsprinzipien der DIN EN ISO 9241-110.",
      eintraege: [
        { nr: "A", ziel: "kopf-titel", anker: "links", versatz: [292, 2], regel: "BUCHSTIL – SOFTWARENEUTRAL", titel: "Kein Browserfenster",
          text: "Browserrahmen, Menü-, Symbol- und Adressleiste mit Serveradresse sowie der Seitentitel „Page1“ entfallen. Übrig bleibt das Formular mit seinem Namen; die Titelzeile nennt Planjahr, Version, Kostenstelle und die Einheit." },
        { nr: "B", ziel: "h-fte", versatz: [0, -30], regel: "SELBSTBESCHREIBUNGSFÄHIGKEIT", titel: "Eingabe und Anzeige unterscheidbar",
          text: "Eingaben (FTE, Monatsentgelt, Gültigkeit) sind weiß mit Rahmen, Stammdaten und Ergebnisse grau. Im Original lagen alle Spalten auf grauem Grund; Eingaben waren nur an dünnen Rahmen zu erkennen." },
        { nr: "C", ziel: "pk-summe", anker: "links", versatz: [0, 3], regel: "AUFGABENANGEMESSENHEIT", titel: "Kosten sofort sichtbar",
          text: "Neu sind Monate und Personalkosten je Planstelle, die Summe und das Ergebnis oben rechts. Das Original zeigte nur die Eingaben; die Kosten sah man erst nach dem Wechsel in den Reiter „Reporting“." },
        { nr: "D", ziel: "f-version", versatz: [0, 0], regel: "ERWARTUNGSKONFORMITÄT", titel: "Abgeleitetes als Anzeige",
          text: "Version und Geschäftsjahr folgen aus Planversion und Planjahr und sind graue Anzeigen; Auswahlfelder tragen den Pfeil rechts. Im Original waren Geschäftsjahr und Version eigene Auswahlfelder – widersprüchliche Angaben waren möglich." },
        { nr: "E", ziel: "h-bez", versatz: [-10, 2], regel: "BUCHSTIL – NEUTRAL UND AKTUELL", titel: "Deutsche Begriffe, aktuelle Werte",
          text: "„Team Speaker“, „Order Picker“ und „Material handler“ heißen Teamleitung, Kommissionierung und Materialbereitstellung; die Kürzel I-LO und BCI sind ausgeschrieben, „Zähler Köpfe“ heißt FTE, „Entgeldgröße“ Monatsentgelt. Planjahr 2007 → 2027, Entgelte auf das heutige Niveau fortgeschrieben." },
        { nr: "F", ziel: "h-wahl", versatz: [-2, 2], regel: "ERWARTUNGSKONFORMITÄT", titel: "Auswahl am Zeilenanfang",
          text: "Die Optionsfelder stehen vorn statt zwischen Vertragsart und Köpfen. Eine markierte Zeile wird zur Referenzplanstelle; Einheiten stehen einmal in der Titelzeile statt „EUR“ hinter jedem Betrag." },
        { nr: "G", ziel: "h-entgelt", versatz: [0, -30], regel: "ROBUSTHEIT GEGEN BENUTZUNGSFEHLER", titel: "Eingaben werden geprüft",
          text: "FTE, Entgelt und Datum werden geprüft; ein Bis-Datum vor dem Von-Datum oder ein ungültiger Betrag wird rot markiert und nicht in Summen übernommen." },
        { nr: "H", ziel: "aktionen", anker: "links", versatz: [-2, 6], regel: "STEUERBARKEIT", titel: "Aktionen am Ende des Formulars",
          text: "Sichern, Beenden und Aktualisieren stehen unten rechts, Sichern als einzige Hauptaktion dunkel. Im Original standen drei gleich gelbe Knöpfe über der Auswahl; die Abkürzungen der Reiter („perio.“, „PLAST“) sind aufgelöst." },
      ],
    },
  });
  MK.fertig();
})();
