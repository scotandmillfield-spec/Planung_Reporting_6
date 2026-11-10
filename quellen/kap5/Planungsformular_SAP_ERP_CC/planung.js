/* Abb. 5.74 „Planungsformular SAP ERP CC“ – Logik der Übersicht „Planung Kostenarten/Leistungsaufnahmen ändern“.
   Je Kostenart: Plankosten fix und variabel (€), Planverbrauch fix und variabel (Menge) mit Verteilungsschlüssel (VS).
   Summenzeile = Summe der Plankosten (Mengen verschiedener Einheiten werden nicht summiert). Zwei leere Zeilen für weitere
   Kostenarten: Nummer eingeben → Bezeichnung aus den Stammdaten (wie Abb. 5.72/5.73). Werte und Verteilungsschlüssel der
   sieben Kostenarten wie im Original; die Plankosten fix sind in Abb. 5.73 die Sollkosten (Perioden 1–12/2026). */
(() => {
  "use strict";
  const { el, zahl, pruefeFeld } = MK;
  MK.init({ titel: "Planungsformular Kostenarten" });
  const $ = id => document.getElementById(id);

  /* ---------- Stammdaten (Kostenarten wie Abb. 5.73; Kurztext für die Rasterbreite) ---------- */
  const KA = { 430000: "Gehälter", 435000: "Tarifliche Jahresleistung", 440000: "Gesetzl. Sozialaufwand",
    449000: "Sonstige Personalkosten", 451000: "Instandhaltung Gebäude", 466000: "Versicherungen", 470000: "Raumkosten",
    471000: "Maschinenmieten", 473000: "Postkosten (ohne Telefon)", 476000: "Büromaterial", 476100: "EDV-Material",
    476500: "Sonst. Verwaltungskosten", 476900: "Sonstige Kosten", 481000: "Kalk. Abschreibungen", 483000: "Kalk. Zinsen" };
  const VS = [["0", "0 – Werte je Periode manuell"], ["1", "1 – gleichmäßig auf alle Perioden"], ["2", "2 – wie die bisherige Verteilung"]];
  // Kostenart, Plankosten fix, VS, Plankosten var, VS, Planverbrauch fix, VS, Planverbrauch var, VS (Original)
  const START = [
    ["470000", 30830.88, "2", 0, "2", 0, "2", 0, "2"], ["471000", 25692.36, "0", 0, "2", 0, "0", 0, "2"],
    ["473000", 23123.16, "2", 0, "2", 0, "2", 0, "2"], ["476000", 20553.96, "2", 0, "2", 0, "2", 0, "2"],
    ["476100", 6166.20, "2", 0, "2", 0, "2", 0, "2"], ["476500", 10276.92, "0", 0, "2", 0, "0", 0, "2"],
    ["476900", 6166.20, "2", 0, "2", 0, "2", 0, "2"]];
  const NEU = 2;                                                     // leere Zeilen für weitere Kostenarten
  const SPALTEN = [[3, "pkf", 2, "Plankosten fix in €"], [5, "pkv", 2, "Plankosten variabel in €"],
                   [7, "pvf", 3, "Planverbrauch fix"], [9, "pvv", 3, "Planverbrauch variabel"]];

  /* ---------- Raster aufbauen ---------- */
  const raster = $("raster");
  const pos = (z, s, n = 1) => `grid-row:${z};grid-column:${s}${n > 1 ? " / span " + n : ""}`;
  const ZEILEN = [];
  function vsAuswahl(z, s, wert, kaText, id) {
    const sel = el("select", { class: "mk-feld", id, style: pos(z, s), "aria-label": `Verteilungsschlüssel ${kaText}`,
      title: "Verteilungsschlüssel: 0 manuell je Periode · 1 gleichmäßig · 2 wie die bisherige Verteilung" }, raster);
    VS.forEach(([v]) => el("option", v === wert ? { value: v, selected: "" } : { value: v }, sel, v));
    return sel;
  }
  START.forEach((r, i) => {
    const z = 3 + i, ka = r[0];
    el("span", { class: "mk-label mx-l", id: `ka-${i}`, style: pos(z, 1) }, raster, ka);
    el("span", { class: "mk-label mx-l", id: `tx-${i}`, style: pos(z, 2) }, raster, KA[ka]);
    const felder = SPALTEN.map(([s, key, nk, lbl], j) => {
      const f = el("input", { class: "mk-feld mk-zahl", id: `${key}-${i}`, style: pos(z, s), value: zahl(r[1 + 2 * j], nk), inputmode: "decimal",
        "aria-label": `${lbl}, Kostenart ${ka}`, "data-hilfe": `${lbl}, Zahl ab 0 mit Dezimalkomma` }, raster);
      vsAuswahl(z, s + 1, r[2 + 2 * j], ka, `vs-${key}-${i}`);
      return f;
    });
    ZEILEN.push({ ka, felder, neu: false });
  });
  for (let n = 0; n < NEU; n++) {
    const i = START.length + n, z = 3 + i;
    const kf = el("input", { class: "mk-feld mk-zahl", id: `ka-${i}`, style: pos(z, 1), value: "", inputmode: "numeric",
      "aria-label": "Weitere Kostenart", "data-hilfe": "Kostenart eingeben, z. B. 449000" }, raster);
    el("div", { class: "mk-feld mk-anzeige", id: `tx-${i}`, style: pos(z, 2) }, raster);
    const felder = SPALTEN.map(([s, key, nk, lbl]) => {
      const f = el("input", { class: "mk-feld mk-zahl", id: `${key}-${i}`, style: pos(z, s), value: "", inputmode: "decimal",
        "aria-label": `${lbl}, weitere Kostenart`, "data-hilfe": `${lbl}, Zahl ab 0 mit Dezimalkomma` }, raster);
      vsAuswahl(z, s + 1, "1", "weitere Kostenart", `vs-${key}-${i}`);
      return f;
    });
    ZEILEN.push({ kf, felder, neu: true, i });
  }
  const zs = 3 + ZEILEN.length;
  el("span", { class: "mk-label mx-l summe", id: "l-summe", style: pos(zs, 1, 2) }, raster, "Summe");
  el("div", { class: "mk-feld mk-anzeige mk-zahl summe", id: "sum-pkf", style: pos(zs, 3) }, raster);
  el("div", { class: "leer", style: pos(zs, 4) }, raster);
  el("div", { class: "mk-feld mk-anzeige mk-zahl summe", id: "sum-pkv", style: pos(zs, 5) }, raster);
  el("div", { class: "leer", id: "sum-menge", style: pos(zs, 6, 5) }, raster);

  /* ---------- Prüfen und rechnen ---------- */
  function neueKostenart(z) {
    const f = z.kf, t = $(`tx-${z.i}`), v = f.value.trim();
    f.classList.remove("mk-fehler"); f.title = f.dataset.hilfe;
    if (!v) { t.textContent = ""; return null; }
    const vergeben = ZEILEN.some(x => x !== z && (x.ka === v || (x.kf && x.kf.value.trim() === v)));
    if (!KA[v] || vergeben) {
      f.classList.add("mk-fehler"); f.title = vergeben ? `Kostenart ${v} ist bereits im Formular` : `Kostenart ${v} ist nicht angelegt`;
      t.textContent = vergeben ? "bereits geplant" : "nicht angelegt";
      return null;
    }
    t.textContent = KA[v];
    return v;
  }
  function rechnen() {
    let pkf = 0, pkv = 0, ok = true;
    ZEILEN.forEach(z => {
      if (z.neu) neueKostenart(z);
      z.felder.forEach((f, j) => {
        const nk = SPALTEN[j][2];
        const v = pruefeFeld(f, "zahl", { min: 0, max: 99999999, pflicht: !z.neu, meldung: "Zahl ab 0 mit Dezimalkomma, z. B. 30.830,88" });
        if (f.classList.contains("mk-fehler")) { ok = false; return; }
        if (z.neu && v !== null && !z.kf.value.trim()) { z.kf.classList.add("mk-fehler"); z.kf.title = "Zuerst die Kostenart eingeben"; ok = false; }
        if (j === 0) pkf += v || 0;
        if (j === 1) pkv += v || 0;
        if (v !== null && document.activeElement !== f) f.value = zahl(v, nk);
      });
      if (z.kf && z.kf.classList.contains("mk-fehler")) ok = false;
    });
    $("sum-pkf").textContent = ok ? zahl(pkf, 2) : "–";
    $("sum-pkv").textContent = ok ? zahl(pkv, 2) : "–";
    return { ok, pkf, pkv };
  }
  ZEILEN.forEach(z => {
    z.felder.forEach(f => { f.addEventListener("input", rechnen); f.addEventListener("blur", rechnen); });
    if (z.kf) z.kf.addEventListener("input", rechnen);
  });
  rechnen();

  /* ---------- Knöpfe ---------- */
  $("k-sichern").addEventListener("click", () => {
    const r = rechnen();
    if (!r.ok || document.querySelector("#planung .mk-fehler")) { MK.meldung("Nicht gesichert: Bitte zuerst die rot markierten Eingaben korrigieren."); return; }
    const n = ZEILEN.filter(z => !z.neu || z.kf.value.trim()).length;
    MK.meldung(`Gesichert: ${n} Kostenarten, Plankosten ${zahl(r.pkf + r.pkv, 2)} € – Kostenstelle 1000, Geschäftsjahr 2026, Version 0.`);
  });
  $("k-einzelposten").addEventListener("click", () => MK.meldung("Einzelposten: Planbelege zu den Werten – in der Beispielmaske nicht hinterlegt."));
  $("k-werte").addEventListener("click", () => MK.meldung("Werte ändern: Planwerte um einen Prozentsatz oder Betrag anpassen – in der Beispielmaske nicht hinterlegt."));

  /* ---------- Klappen ohne Maßstabssprung (wie Abb. 3.7) ---------- */
  if (!document.body.classList.contains("print")) {
    const maske = $("planung"), seite = $("seite"), rahmen = seite.parentElement;
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
      intro: "Was die Bereiche des Planungsformulars in der Kostenstellenplanung leisten. Die Nummern in der Maske zeigen, wo.",
      eintraege: [
        { nr: 1, ziel: "a-kst-text", versatz: [-6, 2], titel: "Kopfdaten aus dem Einstieg",
          text: "Kostenstelle, Version, Perioden und Geschäftsjahr werden vor dem Formular gewählt und stehen hier nur zur Anzeige. Geplant wird die Kostenstelle 1000 Zentrale Dienste in der Plan/Ist-Version 0 für das ganze Jahr 2026." },
        { nr: 2, ziel: "tx-0", versatz: [-4, 1], titel: "Kostenarten der Kostenstelle",
          text: "Je Zeile eine Kostenart, hier Sachkosten von den Raumkosten bis zu den sonstigen Kosten. Die Bezeichnung kommt aus den Stammdaten; dieselben Kostenarten erscheinen im Ist/Soll-Vergleich (Abb. 5.73)." },
        { nr: 3, ziel: "h-pk-fix", anker: "links", versatz: [38, 1], titel: "Plankosten fix",
          text: "Leistungsunabhängige Kosten, die unabhängig von der Beschäftigung anfallen. Sie gehen unverändert als Sollkosten in den Ist/Soll-Vergleich ein – die Raumkosten von 30.830,88 € stehen in Abb. 5.73 als Sollkosten." },
        { nr: 4, ziel: "h-kosten", anker: "links", versatz: [0, -2], titel: "Fix und variabel",
          text: "Variable Plankosten sind leistungsabhängig: Im Soll werden sie mit dem Verhältnis von Ist- zu Planleistung angepasst (flexible Plankostenrechnung). Die Zentralen Dienste planen hier nur fixe Kosten; die variablen Spalten stehen auf 0." },
        { nr: 5, ziel: "h-verbrauch", anker: "links", versatz: [4, -2], titel: "Planverbrauch",
          text: "Statt eines Betrags lässt sich die Menge planen (z. B. kWh, Stück), fix oder leistungsabhängig; bewertet wird sie mit dem Planpreis. Im Beispiel sind keine Mengen geplant." },
        { nr: 6, ziel: "h-verbrauch", versatz: [-10, -2], titel: "Verteilungsschlüssel",
          text: "VS legt fest, wie der Jahreswert auf die zwölf Perioden verteilt wird: 0 = Werte je Periode manuell, 1 = gleichmäßig, 2 = wie die bisherige Verteilung. Maschinenmieten und sonstige Verwaltungskosten sind manuell verteilt." },
        { nr: 7, ziel: "l-summe", versatz: [-6, 1], titel: "Summe der Kostenstelle",
          text: "Die Plankosten der Kostenstelle betragen 122.809,68 €. Sie bilden mit den übrigen Kostenarten die Grundlage für die Verrechnung der Leistungen der Zentralen Dienste an andere Kostenstellen." },
        { nr: 8, ziel: "ka-7", versatz: [-8, 1], titel: "Weitere Kostenarten",
          text: "In den freien Zeilen werden weitere Kostenarten geplant: Nummer eingeben, die Bezeichnung erscheint aus den Stammdaten. „Sichern“ schreibt die Planwerte in die Version 0." },
      ],
    },
    gestaltung: {
      titel: "Gestaltung",
      intro: "Was gegenüber dem Original geändert wurde – softwareneutral im Buchstil und nach den Interaktionsprinzipien der DIN EN ISO 9241-110.",
      eintraege: [
        { nr: "A", ziel: "kopf", versatz: [-6, 8], regel: "BUCHSTIL – SOFTWARENEUTRAL", titel: "Kein Programmfenster",
          text: "Menüleiste, Symbolleisten mit 15 Symbolen, Spaltenauswahl- und Bildlaufsymbole des Originals entfallen. Der Fenstertitel „… ändern: Übersichtsbild“ ist Titel und Untertitel; „Einzelposten“ und „Werte ändern“ sind beschriftete Knöpfe." },
        { nr: "B", ziel: "tx-1", versatz: [-4, 1], regel: "SELBSTBESCHREIBUNGSFÄHIGKEIT", titel: "Bezeichnung ergänzt",
          text: "Neben der Kostenart steht ihre Bezeichnung. Das Original zeigte nur die sechsstelligen Nummern." },
        { nr: "C", ziel: "h-verbrauch", anker: "links", versatz: [-2, -2], regel: "SELBSTBESCHREIBUNGSFÄHIGKEIT", titel: "Spalten gruppiert, Einheit genannt",
          text: "„Plankosten fix“, „Plankosten var“, „Planverbr. fix“, „Planverbr. var“ stehen unter zwei Gruppenköpfen „Plankosten in €“ und „Planverbrauch“ mit fix und variabel. Das Original nannte keine Währung." },
        { nr: "D", ziel: "a-version", anker: "links", versatz: [0, 2], regel: "SELBSTBESCHREIBUNGSFÄHIGKEIT", titel: "Eingabe und Anzeige unterscheidbar",
          text: "Die Kopfdaten sind grau als Anzeige, weil sie im Formular nicht geändert werden; im Original sahen sie wie Eingabefelder aus. Weiß mit Rahmen sind nur die Planwerte und die freien Zeilen." },
        { nr: "E", ziel: "h-verbrauch", versatz: [-10, -2], regel: "ERWARTUNGSKONFORMITÄT", titel: "Verteilungsschlüssel als Auswahl",
          text: "VS ist eine Auswahlliste mit Pfeil rechts; der Tooltip erklärt die Schlüssel. Im Original waren es freie Eingabefelder ohne Erklärung." },
        { nr: "F", ziel: "sum-menge", anker: "links", versatz: [30, 1], regel: "AUFGABENANGEMESSENHEIT", titel: "Summe nur, wo sinnvoll",
          text: "„*Kostenart“ heißt jetzt „Summe“. Summiert werden die Plankosten in €; Mengen verschiedener Kostenarten haben verschiedene Einheiten und werden nicht addiert (im Original 0,000)." },
        { nr: "G", ziel: "pkf-1", anker: "links", versatz: [0, 1], regel: "ROBUSTHEIT GEGEN BENUTZUNGSFEHLER", titel: "Eingaben werden geprüft",
          text: "Planwerte sind Zahlen ab 0 mit Dezimalkomma, neue Kostenarten müssen angelegt und dürfen nicht doppelt sein. Fehler werden rot markiert, die Summe zeigt dann „–“, gesichert wird erst nach der Korrektur." },
        { nr: "H", ziel: "a-jahr", anker: "links", versatz: [0, 2], regel: "BUCHSTIL – NEUTRAL UND AKTUELL", titel: "Aktuell und bereinigt",
          text: "Geschäftsjahr 2011 → 2026, gleich dem Bericht in Abb. 5.73; „Corporate Investments (Vormals Services)“ heißt Zentrale Dienste. Die leeren Spalten E (Einheit), M und L entfallen; von den freien Zeilen bleiben zwei." },
      ],
    },
  });
  MK.fertig();
})();
