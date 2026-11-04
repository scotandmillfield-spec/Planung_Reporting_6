/* Abb. 3.191 „Planungsformular Kapazitätsbedarf Anlagen“ – Logik des Reiters „Kapazitätsbedarf Anlagen“.
   Je Periode: Kapazitätsbedarf aus der Absatzplanung (Anzeige, Werte des Originals in Std.), Korrektur in %
   (Rationalisierungsvorgabe negativ, Aufschlag für technisches Risiko/Ausschuss positiv) und Mehrbedarf für
   Neuanläufe in Std. (Eingaben). Kapazitätsbedarf nach Korrektur und Mehrbedarf = Bedarf × (1 + Korrektur) + Mehrbedarf,
   auf 0,1 Std. gerundet; die Ergebniszeile summiert die gerundeten Zeilen, die Korrektur als gewichteter Durchschnitt.
   Zusammenhang: Abb. 3.188 „Abstimmung der Personalplanung“ (Bedarf − Rationalisierung + Aufschläge + Mehrbedarf
   → Kapazitätsabgleich je Kostenstelle und Monat).
   Werte des Originals: Bedarf der Perioden 2–12 unverändert (Summe 1.323,523 Std.); Korrektur und Mehrbedarf waren 0 –
   hier Beispielwerte (−3,0 % in allen Perioden, Neuanlauf ab Oktober 24/32/16 Std.), damit die Rechnung sichtbar wird. */
(() => {
  "use strict";
  const { el, zahl, pruefeFeld } = MK;
  MK.init({ titel: "Planungsformular Kapazitätsbedarf Anlagen" });
  const $ = id => document.getElementById(id);
  const MINUS = MK.MINUS;

  /* ---------- Stammdaten ---------- */
  const MONATE = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
  // Periode, Kapazitätsbedarf (Std., aus der Absatzplanung), Korrektur (%), Mehrbedarf (Std.)
  const PERIODEN = [
    [2, 130.458, -3, 0], [3, 143.512, -3, 0], [4, 127.217, -3, 0], [5, 120.858, -3, 0], [6, 127.217, -3, 0],
    [7, 146.297, -3, 0], [8, 38.172, -3, 0], [9, 139.944, -3, 0], [10, 139.944, -3, 24], [11, 133.563, -3, 32],
    [12, 76.341, -3, 16],
  ];

  /* ---------- Raster ---------- */
  const mx = $("mx");
  const PR_KORR = { min: -50, max: 50, meldung: "Korrektur in % von −50 bis +50 mit Dezimalkomma, z. B. −3,0" };
  const PR_MEHR = { min: 0, max: 999.9, meldung: "Mehrbedarf in Std. ab 0 mit Dezimalkomma, z. B. 24,0" };
  const wert = f => { const v = MK.leseZahl(f.value); return v == null ? 0 : isNaN(v) || f.classList.contains("mk-fehler") ? null : v; };
  const zeilen = PERIODEN.map(([p, bedarf, korr, mehr]) => {
    const pp = String(p).padStart(2, "0"), z = el("div", { class: "mx-zeile", id: "z" + pp, role: "row" }, mx);
    el("div", { class: "mx-l", id: "p" + pp }, z, `${pp} ${MONATE[p - 1]}`);
    const r = { p, bedarf };
    el("div", { class: "mk-feld mk-anzeige mk-zahl", id: "b" + pp }, z, zahl(bedarf, 1)).title = `${zahl(bedarf, 3)} Std. laut Absatzplanung`;
    r.korr = el("input", { class: "mk-feld mk-zahl trenn", id: "k" + pp, value: zahl(korr, 1), inputmode: "decimal",
      "aria-label": `Korrektur in %, ${MONATE[p - 1]}`, "data-hilfe": "Rationalisierungsvorgabe negativ, Aufschlag für technisches Risiko oder Ausschuss positiv",
      title: "Rationalisierungsvorgabe negativ, Aufschlag für technisches Risiko oder Ausschuss positiv" }, z);
    r.mehr = el("input", { class: "mk-feld mk-zahl", id: "m" + pp, value: zahl(mehr, 1), inputmode: "decimal",
      "aria-label": `Mehrbedarf in Std., ${MONATE[p - 1]}`, "data-hilfe": "Zusätzliche Stunden für Neuanläufe in dieser Periode",
      title: "Zusätzliche Stunden für Neuanläufe in dieser Periode" }, z);
    r.ergebnis = el("div", { class: "mk-feld mk-anzeige mk-zahl", id: "e" + pp }, z);
    r.korr.addEventListener("input", () => { pruefeFeld(r.korr, "zahl", PR_KORR); rechnen(); });
    r.mehr.addEventListener("input", () => { pruefeFeld(r.mehr, "zahl", PR_MEHR); rechnen(); });
    [r.korr, r.mehr].forEach(f => f.addEventListener("blur", () => { const v = wert(f); if (v != null) f.value = zahl(v, 1); }));
    return r;
  });
  const ez = el("div", { class: "mx-zeile ergebnis", id: "z-ergebnis", role: "row" }, mx);
  el("div", { class: "mx-l", id: "l-ergebnis" }, ez, "Ergebnis");
  const eBedarf = el("div", { class: "mk-feld mk-anzeige mk-zahl", id: "s-bedarf" }, ez);
  const eKorr = el("div", { class: "mk-feld mk-anzeige mk-zahl", id: "s-korr" }, ez);
  const eMehr = el("div", { class: "mk-feld mk-anzeige mk-zahl", id: "s-mehr" }, ez);
  const eKorrigiert = el("div", { class: "mk-feld mk-anzeige mk-zahl", id: "s-korrigiert" }, ez);

  /* ---------- Rechnen ---------- */
  const runde1 = x => Math.round(x * 10) / 10;
  const prozent = v => (Math.abs(v) < 0.05 ? String.fromCharCode(0xB1) + zahl(0, 1) : (v > 0 ? "+" : "") + zahl(v, 1));
  function rechnen() {
    let sB = 0, sBK = 0, sM = 0, sE = 0, ok = true;
    zeilen.forEach(r => {
      const k = wert(r.korr), m = wert(r.mehr);
      sB += r.bedarf;
      if (k == null || m == null) { r.ergebnis.textContent = "–"; ok = false; return; }
      const e = runde1(r.bedarf * (1 + k / 100) + m);
      r.ergebnis.textContent = zahl(e, 1);
      r.ergebnis.title = `${zahl(r.bedarf, 1)} × (1 ${k < 0 ? MINUS : "+"} ${zahl(Math.abs(k), 1)} %) + ${zahl(m, 1)} = ${zahl(e, 1)} Std.`;
      sBK += r.bedarf * (1 + k / 100); sM += m; sE += e;
    });
    eBedarf.textContent = zahl(sB, 1);
    eKorr.textContent = ok ? prozent((sBK / sB - 1) * 100) : "–";
    eKorr.title = "Korrektur gewichtet mit dem Kapazitätsbedarf der Perioden";
    eMehr.textContent = ok ? zahl(sM, 1) : "–";
    eKorrigiert.textContent = ok ? zahl(sE, 1) : "–";
  }
  rechnen();

  /* ---------- Aktionen und Reiter ---------- */
  $("k-aktualisieren").addEventListener("click", () => { rechnen(); MK.meldung("Kapazitätsbedarf neu berechnet."); });
  $("k-sichern").addEventListener("click", () => MK.meldung("Beispielmaske: Die Planwerte werden nicht gespeichert."));
  $("k-beenden").addEventListener("click", () => MK.meldung("Beispielmaske: Beenden ist ohne Funktion."));
  [...$("reiter").children].forEach(s => s.addEventListener("click", () => {
    if (!s.classList.contains("aktiv")) MK.meldung("Beispielmaske: ausgeführt ist nur der Reiter „Kapazitätsbedarf Anlagen“.");
  }));
  ["f-ap", "f-la"].forEach(id => $(id).addEventListener("change", () => {
    if ($(id).value) MK.meldung("Die Kostenstelle hat nur diesen Arbeitsplatz und diese Leistungsart – die Werte bleiben gleich.");
  }));

  /* ---------- Lernplattform: Erläuterungen und Gestaltung ---------- */
  MK.ebenen({
    erlaeuterungen: {
      titel: "Erläuterungen",
      intro: "Was die Bereiche des Planungsformulars in der Kapazitätsplanung leisten. Die Nummern in der Maske zeigen, wo.",
      eintraege: [
        { nr: 1, ziel: "reiter", versatz: [0, 2], titel: "Drei Sichten der Kapazitätsplanung",
          text: "Geplant werden der Kapazitätsbedarf der Anlagen, der Kapazitätsbedarf an Personal und das Kapazitätsangebot der Anlagen. Erst der Abgleich von Bedarf und Angebot je Kostenstelle und Monat zeigt Engpässe oder Leerkapazitäten." },
        { nr: 2, ziel: "f-kst", versatz: [14, 0], titel: "Planungsobjekt",
          text: "Geplant wird je Werk und Kostenstelle; Arbeitsplatz und Leistungsart grenzen weiter ein. Leere Auswahlfelder bedeuten „alle“ – hier hat die Kostenstelle nur den Arbeitsplatz Pkw-Stanzen mit der Leistungsart Maschinenstunden." },
        { nr: 3, ziel: "h-bedarf", anker: "links", versatz: [0, 0], titel: "Bedarf aus der Absatzplanung",
          text: "Der Kapazitätsbedarf folgt aus der Absatz- und Produktionsplanung: geplante Stückzahlen mal Vorgabezeiten der Arbeitspläne, je Kostenstelle, Arbeitsplatz, Leistungsart und Periode. Er ist eine Anzeige; im August sinkt er mit dem Betriebsurlaub auf 38,2 Std." },
        { nr: 4, ziel: "h-korr", versatz: [-74, 0], titel: "Korrektur in %",
          text: "Eine Rationalisierungsvorgabe senkt den Bedarf (negativ), ein Aufschlag für technisches Risiko oder Ausschuss erhöht ihn (positiv). Hier gilt eine Vorgabe von −3,0 % in allen Perioden." },
        { nr: 5, ziel: "m10", versatz: [-92, 1], titel: "Mehrbedarf für Neuanläufe",
          text: "Neuanläufe brauchen zusätzliche Stunden, die in den Arbeitsplänen noch nicht stehen – etwa für Einrichten und Anlaufverluste. Sie werden auf Monatsebene erfasst, hier für einen Serienanlauf ab Oktober." },
        { nr: 6, ziel: "h-korrigiert", versatz: [-160, 0], titel: "Bedarf nach Korrektur und Mehrbedarf",
          text: "Kapazitätsbedarf × (1 + Korrektur) + Mehrbedarf, je Periode auf 0,1 Std. gerundet. Er geht in den Kapazitätsabgleich mit der möglichen Stundenleistung ein; aus der Differenz folgt der Personalbedarf (FTE) der Personalkostenplanung." },
        { nr: 7, ziel: "l-ergebnis", versatz: [-4, 3], titel: "Ergebnis für das Jahr",
          text: "Die Ergebniszeile summiert Bedarf, Mehrbedarf und korrigierten Bedarf; die Korrektur steht als mit dem Bedarf gewichteter Durchschnitt. 1.323,5 Std. aus der Absatzplanung werden so zu 1.355,7 Std." },
        { nr: 8, ziel: "p08", versatz: [-40, 1], titel: "Planung je Periode",
          text: "Kapazität wird je Periode geplant, weil der Bedarf schwankt – Betriebsurlaub im August, wenige Arbeitstage im Dezember. Wie im Original beginnt die Planung mit Periode 2." },
      ],
    },
    gestaltung: {
      titel: "Gestaltung",
      intro: "Was gegenüber dem Original geändert wurde – softwareneutral im Buchstil und nach den Interaktionsprinzipien der DIN EN ISO 9241-110.",
      eintraege: [
        { nr: "A", ziel: "kopf-titel", anker: "links", versatz: [238, 2], regel: "BUCHSTIL – SOFTWARENEUTRAL", titel: "Ohne Rahmen und Symbole",
          text: "Fensterrahmen, Symbole für die Werthilfe neben jedem Feld und die Knopfleiste über den Reitern entfallen. Der Titel „Kapazitätsplanung“ bleibt; die Titelzeile nennt Geschäftsjahr, Perioden und die Einheit." },
        { nr: "B", ziel: "gruppe", anker: "links", versatz: [700, 2], regel: "AUFGABENANGEMESSENHEIT", titel: "Gruppenkopf statt Leerspalten",
          text: "Kostenstelle, Arbeitsplatz und Leistungsart stehen einmal im Gruppenkopf. Im Original waren es vier Spalten (mit Profit-Center „#“ für nicht zugeordnet), die nur in der ersten Zeile gefüllt waren und das Raster auf die volle Bildschirmbreite zogen." },
        { nr: "C", ziel: "h-korrigiert", versatz: [-128, 0], regel: "SELBSTBESCHREIBUNGSFÄHIGKEIT", titel: "Spaltenköpfe ausgeschrieben",
          text: "„Kapa.-Bedarf Korr. %“ heißt Korrektur in %, „Kapa.-Mehrbedarf“ Mehrbedarf für Neuanläufe, „Kapa.Bedarf n.R.u.M.“ Kapazitätsbedarf nach Korrektur und Mehrbedarf. Die Mengeneinheit STD in jeder Zeile steht einmal als „Werte in Std.“ im Kopf." },
        { nr: "D", ziel: "b02", anker: "links", versatz: [6, 1], regel: "ERWARTUNGSKONFORMITÄT", titel: "Sinnvolle Genauigkeit",
          text: "Stunden mit einer Nachkommastelle (130,458 → 130,5; genauer Wert im Tooltip), Prozent mit einer statt zwei; zur Periodennummer steht der Monat. Eingaben sind weiß mit Rahmen, Anzeigen grau." },
        { nr: "E", ziel: "s-korr", versatz: [-74, 3], regel: "AUFGABENANGEMESSENHEIT", titel: "Ergebnis gewichtet",
          text: "Die Ergebniszeile zeigt die gewichtete Korrektur (−3,0 %) statt einer Summe von Prozentsätzen; die gelbe Hinterlegung des Originals entfällt, die Zeile ist fett mit Linien abgesetzt." },
        { nr: "F", ziel: "m02", versatz: [-92, 1], regel: "ROBUSTHEIT GEGEN BENUTZUNGSFEHLER", titel: "Eingaben werden geprüft",
          text: "Korrekturen von −50 bis +50 % und Mehrbedarf ab 0 Std.; ungültige Eingaben werden rot markiert und nicht gerechnet. Im Tooltip des Ergebnisfelds steht die Rechnung der Zeile." },
        { nr: "G", ziel: "f-kst", versatz: [-30, 0], regel: "BUCHSTIL – NEUTRAL UND AKTUELL", titel: "Neutrale Namen, Beispielwerte",
          text: "„MOST Zuschneiden“ und „PKW STANZEN MOST“ heißen Zuschneiden und Pkw-Stanzen, Abkürzungen der Reiter (KapaBedarf, KapaAngebot) sind aufgelöst. Korrektur und Mehrbedarf waren im Original 0; die Beispielwerte machen die Rechnung sichtbar." },
        { nr: "H", ziel: "aktionen", anker: "links", versatz: [338, 6], regel: "STEUERBARKEIT", titel: "Aktionen am Ende",
          text: "Sichern, Beenden und Aktualisieren stehen unten rechts, Sichern als einzige Hauptaktion dunkel; im Original standen sie oben über den Reitern." },
      ],
    },
  });
  MK.fertig();
})();
