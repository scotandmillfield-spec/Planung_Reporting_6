/* Abb. 3.7 „Exemplarische Prämissenplanung“ – Logik der Maske „Planungsvorgaben“.
   Der Planungsbrief wird aus den Feldern erzeugt: Budgetjahr, Teilplan, Zeitraum, Variante und Prämissen. */
(() => {
  "use strict";
  const { el, zahl, leseZahl, leseDatum, pruefeFeld } = MK;
  const NBSP = MK.NBSP, NDASH = String.fromCharCode(0x2013);
  MK.init({ titel: "Exemplarische Prämissenplanung" });

  /* ---------- Stammdaten ---------- */
  const PRAEMISSEN = ["Inflationsrate", "Wirtschaftswachstum", "Personalsteigerungsrate", "Umsatzwachstum"];
  const SAETZE = { "Standard": [1.2, 2.5, 3.5, 4.5], "Best Case": [null, null, null, null],
                   "Worst Case": [null, null, null, null] };
  const SPALTEN = ["Standard", "Best Case", "Worst Case"];
  const BUDGET = { B2028: ["das Budget 2028", "das Planjahr 2028", "Budget 2028"],
                   F2027: ["den Forecast 2027", "das Planjahr 2027", "Forecast 2027"],
                   M2029: ["die Mittelfristplanung 2029" + NDASH + "2031", "die Planjahre 2029 bis 2031", "Mittelfristplanung 2029" + NDASH + "2031"] };
  const STAND = "30.06.2027";
  // Teilplan: Empfänger im Briefkopf und Anrede
  const TEILPLAENE = [
    ["Absatzplanung", "Key-Account-Manager", "Sehr geehrte(r) Key-Account-Manager(in),"],
    ["Produktionsplanung", "Produktionsleitung", "Sehr geehrte Damen und Herren,"],
    ["Beschaffungsplanung", "Einkauf", "Sehr geehrte Damen und Herren,"],
    ["Kostenplanung", "Kostenstellenleitung", "Sehr geehrte Damen und Herren,"],
    ["Personalplanung", "Bereichsleitung", "Sehr geehrte Damen und Herren,"],
    ["Investitionsplanung", "Bereichsleitung", "Sehr geehrte Damen und Herren,"],
  ];
  // Ansprechpartner (fiktiv); Telefonnummern aus dem für Medien reservierten Bereich 030 23125 xxx
  const NAMEN = [["Frau Wendt", "controlling@example.com", "+49 30 23125-254"],
                 ["Herr Albers", "controlling@example.com", "+49 30 23125-255"],
                 ["Frau Kaya", "controlling@example.com", "+49 30 23125-256"]];

  const $ = id => document.getElementById(id);
  const optionen = (sel, liste, wert) => liste.forEach(([v, t]) => el("option", v === wert ? { value: v, selected: "" } : { value: v }, sel, t));

  /* ---------- Prämissenraster ---------- */
  const raster = $("praem-raster");
  [...document.querySelectorAll("select.spalte")].forEach((s, c) => optionen(s, Object.keys(SAETZE).map(k => [k, k]), SPALTEN[c]));
  const zellen = PRAEMISSEN.map((p, i) => {
    el("span", { class: "mk-label s1", id: `l-p${i}` }, raster, p);
    return SPALTEN.map((_, c) => el("input", { class: `mk-feld mk-zahl s${c + 2}`, id: `p${i}-${c}`, inputmode: "decimal",
      "aria-label": `${p}, Spalte ${c + 1}`, "data-hilfe": "Prozentwert mit Dezimalkomma, z. B. 2,5" }, raster));
  });
  function spalteFuellen(c) {
    const satz = SAETZE[SPALTEN[c]];
    zellen.forEach((z, i) => { z[c].value = zahl(satz[i], 1); z[c].classList.remove("mk-fehler"); });
  }
  SPALTEN.forEach((_, c) => spalteFuellen(c));
  document.querySelectorAll("select.spalte").forEach(s => s.addEventListener("change", () => {
    SPALTEN[+s.dataset.spalte] = s.value; SPALTEN.forEach((_, c) => spalteFuellen(c)); brief();
  }));
  zellen.forEach((z, i) => z.forEach((f, c) => f.addEventListener("input", () => {
    const v = pruefeFeld(f, "zahl", { min: -20, max: 50, meldung: "Prozentwert zwischen −20 und 50 mit Dezimalkomma" });
    if (!f.classList.contains("mk-fehler")) {
      SAETZE[SPALTEN[c]][i] = v;
      SPALTEN.forEach((s, c2) => { if (c2 !== c && s === SPALTEN[c]) zellen[i][c2].value = zahl(v, 1); });
    }
    brief();
  })));
  zellen.forEach(z => z.forEach(f => f.addEventListener("blur", () => {
    const v = leseZahl(f.value);
    if (v !== null && !isNaN(v) && !f.classList.contains("mk-fehler")) f.value = zahl(v, 1);
  })));

  /* ---------- Teilpläne ---------- */
  optionen($("f-teilplan"), TEILPLAENE.map(t => [t[0], t[0]]), "Absatzplanung");
  optionen($("f-variante"), Object.keys(SAETZE).map(k => [k, k]), "Standard");
  optionen($("f-name"), NAMEN.map(n => [n[0], n[0]]), "Frau Wendt");
  function kontakt() {
    const n = NAMEN.find(x => x[0] === $("f-name").value);
    $("f-email").textContent = n[1]; $("f-telefon").textContent = n[2];
  }
  function zeitraum() {
    const von = pruefeFeld($("f-von"), "datum", { pflicht: true, meldung: "Datum im Format TT.MM.JJJJ" });
    const bis = pruefeFeld($("f-bis"), "datum", { pflicht: true, meldung: "Datum im Format TT.MM.JJJJ" });
    if (von && bis && von > bis) {
      ["f-von", "f-bis"].forEach(id => { $(id).classList.add("mk-fehler"); $(id).title = "Der Zeitraum muss vor seinem Ende beginnen"; });
      return null;
    }
    return von && bis ? [$("f-von").value.trim(), $("f-bis").value.trim()] : null;
  }

  /* ---------- Planungsbrief aus den Feldern ---------- */
  function brief() {
    const tp = TEILPLAENE.find(t => t[0] === $("f-teilplan").value);
    const [periode, planjahr, kurz] = BUDGET[$("f-budgetjahr").value];
    $("kopf-unter").textContent = `${kurz} · Stand ${STAND}`;
    const variante = $("f-variante").value, satz = SAETZE[variante];
    const zr = zeitraum();
    $("brief-kopf").textContent = "Planungsbrief für " + tp[1];
    const b = $("brief");
    b.textContent = "";
    el("p", {}, b, tp[2]);
    el("p", {}, b, `Sie werden gebeten, die ${tp[0]} für ${periode} vorzunehmen. ` +
      (zr ? `Der Zeitraum für die Planung ist vom ${zr[0]} bis zum ${zr[1]} vorgesehen.` : "Der Zeitraum für die Planung wird noch festgelegt."));
    el("p", {}, b, `Für ${planjahr} gehen Sie bitte von folgenden Rahmenbedingungen aus` +
      (variante === "Standard" ? ":" : ` (${variante}):`));
    const liste = el("p", { class: "brief-liste" }, b);
    PRAEMISSEN.forEach((p, i) => { el("span", {}, liste, p + ":"); el("span", {}, liste, satz[i] == null ? NDASH : zahl(satz[i], 1) + NBSP + "%"); });
    el("p", {}, b, "Nutzen Sie den unten stehenden Link, um Zugang zum Planungsformular zu erhalten.");
    const lp = el("p", {}, b);
    const a = el("a", { class: "mk-link", "data-dok": "Planungsformular" }, lp, "Planungsformular " + tp[0]);
    a.addEventListener("click", dokument);
  }
  function dokument(e) { MK.meldung(`Beispielmaske: „${e.currentTarget.dataset.dok}“ ist nicht hinterlegt.`); }

  ["f-budgetjahr", "f-teilplan", "f-variante"].forEach(id => $(id).addEventListener("change", brief));
  ["f-von", "f-bis"].forEach(id => $(id).addEventListener("input", brief));
  $("f-name").addEventListener("change", kontakt);
  document.querySelectorAll("#praemissen a.mk-link").forEach(a => a.addEventListener("click", dokument));
  $("k-veroeffentlichen").addEventListener("click", () => {
    if (document.querySelector("#praemissen .mk-fehler")) { MK.meldung("Bitte zuerst die rot markierten Eingaben korrigieren."); return; }
    MK.meldung(`Vorgabewerte veröffentlicht: ${$("f-budgetjahr").selectedOptions[0].text}, ${$("f-teilplan").value}, ${$("f-variante").value}.`);
  });
  kontakt();
  brief();

  /* ---------- Klappen ohne Maßstabssprung ----------
     Beim Zuklappen wird die Maske kürzer; maskkit skaliert sie dann neu, und der Pfeil springt weg.
     Hier bleibt der Maßstab beim Klappen erhalten, nur der Rahmen folgt der neuen Höhe. */
  if (!document.body.classList.contains("print")) {
    const maske = $("praemissen"), seite = $("seite"), rahmen = seite.parentElement;
    let alt = null;
    const merken = e => { if (e.target.closest && e.target.closest(".mk-band")) alt = seite.style.transform; };
    const halten = e => {
      if (alt === null || !(e.target.closest && e.target.closest(".mk-band"))) return;
      const s = parseFloat((/scale\(([\d.]+)\)/.exec(alt) || [0, 1])[1]);
      seite.style.transform = alt; alt = null;
      rahmen.style.width = maske.offsetWidth * s + "px"; rahmen.style.height = maske.offsetHeight * s + "px";
      if (MK._ebenenNeu) MK._ebenenNeu();
    };
    ["click", "keydown"].forEach(t => { maske.addEventListener(t, merken, true); maske.addEventListener(t, halten); });
  }

  /* ---------- Lernplattform: Erläuterungen und Gestaltung ---------- */
  MK.ebenen({
    erlaeuterungen: {
      titel: "Erläuterungen",
      intro: "Was die Bereiche der Maske in der Prämissenplanung leisten. Die Nummern in der Maske zeigen, wo.",
      eintraege: [
        { nr: 1, ziel: "band-allgemein", versatz: [-24, 2], titel: "Allgemeine Planungsprämissen",
          text: "Gesamtwirtschaftliche und unternehmensweite Annahmen – Inflation, Wirtschaftswachstum, Personalkostensteigerung, Umsatzwachstum – gibt das zentrale Controlling einmal vor. Alle Teilpläne rechnen damit auf derselben Grundlage." },
        { nr: 2, ziel: "f-budgetjahr", anker: "links", titel: "Planversion",
          text: "Die Prämissen gelten für eine Planversion, hier das Budget 2028. Für Forecast und Mittelfristplanung werden eigene Prämissen gepflegt." },
        { nr: 3, ziel: "sp-2", versatz: [-4, -26], titel: "Varianten für Simulationen",
          text: "Neben dem Standard lassen sich alternative Prämissensätze hinterlegen, hier ein Best Case und ein Worst Case. Sie sind die Grundlage für Simulationen und Szenariovergleiche. Die Spaltenköpfe wählen den angezeigten Satz." },
        { nr: 4, ziel: "f-von", anker: "links", titel: "Teilplan, Zeitraum und Variante",
          text: "Für jeden Teilplan legt das Controlling fest, bis wann geplant wird und welcher Prämissensatz gilt. Die Termine stammen aus dem Planungskalender." },
        { nr: 5, ziel: "g-ansprech", titel: "Ansprechpartner",
          text: "Für Rückfragen nennt die Maske eine Ansprechperson im zentralen Controlling. E-Mail und Telefon kommen aus den Stammdaten." },
        { nr: 6, ziel: "g-dokumente", titel: "Dokumente",
          text: "Zugang zum Planungsformular sowie Planungshandbuch und Anwenderleitfaden: einheitliche Regeln und Hilfen für alle, die planen." },
        { nr: 7, ziel: "g-brief", titel: "Planungsbrief",
          text: "Der Brief an die Planenden – bei der Absatzplanung die Key-Account-Manager – wird aus den Feldern der Maske erzeugt. Ändern Sie Teilplan, Zeitraum, Variante oder eine Prämisse: Der Brief folgt sofort." },
        { nr: 8, ziel: "k-veroeffentlichen", versatz: [32, 8], titel: "Vorgabewerte veröffentlichen",
          text: "Mit der Veröffentlichung gehen die Vorgaben top-down an die dezentral Planenden. Deren Bottom-up-Planung beginnt; im Gegenstromverfahren werden beide Seiten anschließend abgestimmt." },
      ],
    },
    gestaltung: {
      titel: "Gestaltung",
      intro: "Was gegenüber dem Original geändert wurde – softwareneutral im Buchstil und nach den Interaktionsprinzipien der DIN EN ISO 9241-110.",
      eintraege: [
        { nr: "A", ziel: "kopf", versatz: [-6, 8], regel: "BUCHSTIL – SOFTWARENEUTRAL", titel: "Kein Fenster, kein Logo",
          text: "Fensterrahmen, Menü- und Symbolleiste, Produktname und Logo, Navigationsleiste, Statusleiste und Bildlaufleisten des Originals entfallen. Übrig bleibt die Maske mit ihrem Namen als Titel; die Titelzeile ist gestaltet wie bei den Dashboards." },
        { nr: "B", ziel: "einheit", versatz: [6, 2], regel: "SELBSTBESCHREIBUNGSFÄHIGKEIT", titel: "Einheit genannt",
          text: "Die Prämissen sind Prozentwerte; „in %“ steht jetzt am Raster und im Brief. Das Original nannte keine Einheit." },
        { nr: "C", ziel: "f-email", anker: "links", versatz: [0, 2], regel: "SELBSTBESCHREIBUNGSFÄHIGKEIT", titel: "Eingabe und Anzeige unterscheidbar",
          text: "Eingabefelder sind weiß mit Rahmen, Anzeigefelder grau hinterlegt: E-Mail und Telefon folgen aus dem gewählten Namen, der Brief aus den Feldern. Im Original sahen alle Felder gleich aus." },
        { nr: "D", ziel: "f-teilplan", versatz: [-26, 2], regel: "ERWARTUNGSKONFORMITÄT", titel: "Gewohnte Bedienelemente",
          text: "Auswahlfelder tragen den Pfeil rechts, Zahlen stehen rechtsbündig mit Dezimalkomma, Daten im Format TT.MM.JJJJ. Das Original setzte die Pfeile links und zentrierte die Zahlen." },
        { nr: "E", ziel: "brief", versatz: [-4, 4], regel: "AUFGABENANGEMESSENHEIT", titel: "Brief aus den Feldern",
          text: "Der Planungsbrief übernimmt Budgetjahr, Teilplan, Zeitraum und Prämissen aus der Maske – nichts wird doppelt erfasst. Im Original nannte der Brief eine Inflationsrate von 1.23 mit Dezimalpunkt, das Feld 1,2." },
        { nr: "F", ziel: "p0-0", anker: "links", versatz: [0, 2], regel: "ROBUSTHEIT GEGEN BENUTZUNGSFEHLER", titel: "Eingaben werden geprüft",
          text: "Ungültige Zahlen oder Daten werden rot markiert und nicht übernommen; der Zeitraum muss vor seinem Ende beginnen. Veröffentlichen ist erst nach der Korrektur möglich." },
        { nr: "G", ziel: "band-teilplaene", versatz: [-24, 2], regel: "ERLERNBARKEIT", titel: "Klare Gliederung",
          text: "Zwei Abschnitte mit Band, Gruppen mit Überschrift, Beschriftungen und Felder auf gemeinsamen Achsen. Die Abschnitte lassen sich wie im Original auf- und zuklappen." },
        { nr: "H", ziel: "f-name", versatz: [-26, 2], regel: "BUCHSTIL – NEUTRAL UND AKTUELL", titel: "Keine echten Daten",
          text: "Name, E-Mail-Adresse, Telefonnummer und Dateipfad des Originals sind durch fiktive Angaben ersetzt; das Budgetjahr 2012 wird zum Budget 2028, Stand 30.06.2027." },
      ],
    },
  });
  MK.fertig();
})();
