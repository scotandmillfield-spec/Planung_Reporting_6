/* Einzelvisual „Zeitreihenanalysen“ (Abb. 3.19): Absatz je Monat als Säulen und die Absatztabelle nach Produkten.
   Seite 727 x 468 px = 110 x 70,8 mm. Daten: absatz.json (daten_absatz.py) – fünf Fahrradkomponenten, zwölf Monate,
   Werte des Originals. Zwei Visuals wie im Original: oben die Zeitreihe, unten die Tabelle. Die Säulen stehen genau
   über den Monatsspalten der Tabelle. Ohne Auswahl zeigt die Zeitreihe die Summe aller Produkte; ein Klick auf eine
   Tabellenzeile zeigt die Zeitreihe dieses Produkts, Esc hebt die Auswahl auf. */
(() => {
  "use strict";
  const { zahl, NBSP, FARBE, sv, el } = DK;
  const MON = DATA.monate, PROD = DATA.produkte, W = DATA.werte;
  const SUMME_M = MON.map((_, m) => W.reduce((s, r) => s + r[m], 0));
  const summe = r => r.reduce((a, b) => a + b, 0);
  const GES = summe(SUMME_M);
  const LANG = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

  /* ---------- Zustand ---------- */
  const S = { auswahl: null };                              // Produktindex oder null (= alle Produkte)
  const auswaehlen = k => { S.auswahl = S.auswahl === k ? null : k; zeichnen(); };
  addEventListener("keydown", e => { if (e.key === "Escape" && S.auswahl != null) { S.auswahl = null; zeichnen(); } });
  const reihe = () => (S.auswahl == null ? SUMME_M : W[S.auswahl]);
  const name = () => (S.auswahl == null ? "alle Produkte" : PROD[S.auswahl]);

  /* ---------- Layout ---------- */
  DK.init({ titel: "Zeitreihenanalysen", breite: 727, hoehe: 468 });
  const bDia = DK.box("v-zeitreihe", 16, 10, 695, 238);
  DK.haarlinie(256);
  const bTab = DK.box("v-tabelle", 16, 266, 695, 194);
  DK.el("style", {}, document.head, `
    #v-tabelle .dk-matrix td, #v-tabelle .dk-matrix th { padding: 0 4px; }
    #v-tabelle .dk-matrix td:first-child, #v-tabelle .dk-matrix th:first-child { padding-left: 0; }
    #v-tabelle .dk-matrix td:last-child, #v-tabelle .dk-matrix th:last-child { font-weight: bold; padding-right: 0; }`);

  // Tooltip wie in den Bausteinen (DK.tooltip ist nicht exportiert)
  const tip = document.querySelector(".dk-tooltip");
  const tipp = (ziel, zeilenFn) => {
    ziel.addEventListener("pointermove", ev => {
      tip.textContent = "";
      zeilenFn().forEach((z, i) => el(i === 0 ? "b" : "div", {}, tip, z));
      tip.style.display = "block";
      const r = tip.getBoundingClientRect();
      let x = ev.clientX + 14, y = ev.clientY + 14;
      if (x + r.width > innerWidth - 8) x = ev.clientX - r.width - 14;
      if (y + r.height > innerHeight - 8) y = ev.clientY - r.height - 14;
      tip.style.left = x + "px"; tip.style.top = y + "px";
    });
    ziel.addEventListener("pointerleave", () => { tip.style.display = "none"; });
  };

  /* ---------- Berechnungen ---------- */
  function zeitreihe() {
    const r = reihe(), s = summe(r), mx = Math.max(...r), mn = Math.min(...r);
    return { r, s, schnitt: s / 12, max: r.indexOf(mx), min: r.indexOf(mn) };
  }
  const SPALTEN = [
    { key: "label", titel: "Produkt", breite: 88 },
    ...MON.map((m, i) => ({ key: "m" + i, id: i === 0 ? "sp-jan" : undefined, titel: m, breite: 45, fmt: v => zahl(v, 0) })),
    { key: "s", id: "sp-summe", titel: "Summe", breite: 60, fmt: v => zahl(v, 0) },
  ];
  const werte = r => Object.fromEntries([...r.map((v, i) => ["m" + i, v]), ["s", summe(r)]]);
  function tabelle() {
    return [...PROD.map((p, i) => ({ key: i, label: p, werte: werte(W[i]) })),
            { key: "summe", label: "Summe", summe: true, werte: werte(SUMME_M) }];
  }
  function tooltipMonat(m) {
    const z = zeitreihe(), v = z.r[m];
    const t = [`${LANG[m]} – ${name()}`, `Absatz: ${zahl(v, 0)} Stück`,
      `Abweichung zum Monatsdurchschnitt: ${DK.delta(v - z.schnitt, 0)} Stück`];
    if (S.auswahl != null) t.push(`Anteil am Absatz des Monats: ${zahl(v / SUMME_M[m] * 100, 0)}${NBSP}%`);
    else PROD.forEach((p, i) => t.push(`${p}: ${zahl(W[i][m], 0)}`));
    return t;
  }
  function tooltipProdukt(i) {
    const r = W[i], s = summe(r);
    return [PROD[i], `Absatz gesamt: ${zahl(s, 0)} Stück (${zahl(s / GES * 100, 0)}${NBSP}% aller Produkte)`,
      `Ø je Monat: ${zahl(s / 12, 0)} Stück`,
      `Höchster Monat: ${LANG[r.indexOf(Math.max(...r))]} (${zahl(Math.max(...r), 0)})`,
      `Niedrigster Monat: ${LANG[r.indexOf(Math.min(...r))]} (${zahl(Math.min(...r), 0)})`,
      "Klick zeigt die Zeitreihe dieses Produkts"];
  }

  /* ---------- Säulendiagramm über den Monatsspalten ---------- */
  function diagramm(ziel, breite, hoehe, xs) {
    ziel.textContent = "";
    const z = zeitreihe(), unten = 20, oben = 18, PH = hoehe - unten - oben;
    const max = Math.max(...z.r), k = PH / max, basis = oben + PH, bw = 26;
    const svg = sv("svg", { width: breite, height: hoehe, role: "img",
      "aria-label": `Säulendiagramm: Absatz je Monat, ${name()}` }, ziel);
    // Monatsdurchschnitt als Referenzlinie hinter den Säulen, beschriftet links in der Produktspalte
    const yd = basis - z.schnitt * k;
    sv("line", { id: "dia-schnitt", x1: xs[0] - 22, x2: xs[11] + 22, y1: yd, y2: yd, stroke: "#4D4D4D", "stroke-width": 1,
                 "stroke-dasharray": "4 3" }, svg);
    sv("text", { x: 0, y: yd, dy: "0.35em", class: "muted" }, svg, `Ø ${zahl(z.schnitt, 0)}`);
    z.r.forEach((v, m) => {
      const cx = xs[m], h = v * k;
      const g = sv("g", {}, svg);
      sv("rect", { x: cx - bw / 2, y: basis - h, width: bw, height: Math.max(h, v > 0 ? 1 : 0), fill: FARBE.ist }, g);
      sv("text", { x: cx, y: basis - h - 5, "text-anchor": "middle", stroke: "#FFFFFF", "stroke-width": 4,
                   "paint-order": "stroke", "stroke-linejoin": "round" }, g, zahl(v, 0));   // Freistellung vor der Ø-Linie
      sv("text", { x: cx, y: hoehe - 3, "text-anchor": "middle" }, g, MON[m]);
      const hit = sv("rect", { x: cx - 22, y: 0, width: 44, height: hoehe, fill: "transparent" }, g);
      tipp(hit, () => tooltipMonat(m));
    });
    sv("line", { x1: xs[0] - 22, x2: xs[11] + 22, y1: basis + 0.5, y2: basis + 0.5, stroke: "#8C8C8C", "stroke-width": 1 }, svg);
  }

  /* ---------- Zeichnen ---------- */
  function zeichnen() {
    const z = zeitreihe();
    // Tabelle zuerst, damit die Säulen über den gemessenen Monatsspalten stehen
    const p = PROD.map((_, i) => summe(W[i])), top = p.indexOf(Math.max(...p));
    let v = DK.visual(bTab, { titel: "Absatz nach Produkten und Monaten", einheit: "Stück",
      botschaft: `${PROD[top]} mit dem höchsten Absatz (${zahl(p[top], 0)} Stück, ${zahl(p[top] / GES * 100, 0)}${NBSP}%)` });
    const t = DK.matrix(v.flaeche, { spalten: SPALTEN, zeilen: tabelle(), zeilenhoehe: 22, auswahl: S.auswahl,
      onClick: auswaehlen, tooltip: zl => tooltipProdukt(zl.key) });
    const ths = t.querySelectorAll("thead th");
    const xs = MON.map((_, m) => { const th = ths[m + 1]; return th.offsetLeft + th.offsetWidth - 4 - DK.tw("000") / 2; });

    v = DK.visual(bDia, { titel: `Absatz je Monat, ${name()}`, einheit: "Stück",
      botschaft: `Höchster Absatz im ${LANG[z.max]} (${zahl(z.r[z.max], 0)}), niedrigster im ${LANG[z.min]} (${zahl(z.r[z.min], 0)}); Ø ${zahl(z.schnitt, 0)} je Monat` });
    diagramm(v.flaeche, v.breite, v.hoehe, xs);
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  /* ---------- Lernplattform: Designregeln, Nachbau, Tabellen, CSV ---------- */
  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "v-zeitreihe", anker: "links", versatz: [600, 21], regel: "SAY – Botschaft vermitteln", titel: "Kernaussage je Visual",
        text: "Unter jedem Titel steht in einem Satz, was die Zahlen sagen: stärkster und schwächster Monat, Monatsdurchschnitt und das absatzstärkste Produkt. Die Sätze werden bei jeder Auswahl neu berechnet. Das Original hatte nur die Überschrift „Absatzzahlen“." },
      { nr: 2, ziel: "v-zeitreihe", anker: "links", versatz: [312, 190], regel: "EXPRESS – Passende Darstellung", titel: "Säulen statt Linie",
        text: "Monatsmengen sind abgegrenzte Perioden und stehen deshalb als Säulen, die Zeit läuft waagerecht. Die Linie des Originals verband Monatswerte, als gäbe es Zwischenwerte, und ließ die Höhe der einzelnen Monate nur über die Achse ablesen." },
      { nr: 3, ziel: "dia-schnitt", anker: "links", versatz: [2, -12], regel: "CONDENSE – Referenz einblenden", titel: "Monatsdurchschnitt als Linie",
        text: "Die gestrichelte Linie zeigt den Durchschnitt je Monat. So sieht man ohne Rechnen, welche Monate über- und welche unterdurchschnittlich sind." },
      { nr: 4, ziel: "v-tabelle", anker: "links", versatz: [380, -14], regel: "STRUCTURE – Gleiche Reihenfolge", titel: "Säulen über den Tabellenspalten",
        text: "Jede Säule steht genau über ihrer Monatsspalte; Diagramm und Tabelle lesen sich als ein Block. Ein Klick auf eine Produktzeile zeigt die Zeitreihe dieses Produkts, ohne Auswahl die Summe aller Produkte." },
      { nr: 5, ziel: "v-zeitreihe", anker: "links", versatz: [520, 120], regel: "SIMPLIFY – Überflüssiges weglassen", titel: "Werte an den Säulen statt Achse",
        text: "Die Werte stehen über den Säulen; Werteachse, Achsentitel „Stück“, Gitternetz, Rahmen und die Legende rechts entfallen. Die Einheit steht im Titel, das gezeigte Produkt ebenfalls." },
      { nr: 6, ziel: "v-tabelle", anker: "links", versatz: [640, 21], regel: "CHECK – Visuelle Integrität", titel: "Summen aus den gezeigten Werten",
        text: "Alle Summen sind aus den angezeigten Monatswerten gerechnet. Im Original passten fünf Summen nicht zu den Einzelwerten (z. B. Laufräder h. 7.413 statt 7.412, Gesamt 32.661 statt 32.659). Die Säulen beginnen bei null." },
      { nr: 7, ziel: "v-tabelle", anker: "links", versatz: [600, 21], regel: "UNIFY – Einheitliche Notation", titel: "Ist anthrazit, Summen fett",
        text: "Die Istwerte haben dieselbe Farbe wie in allen Abbildungen des Buchs. Die Summenzeile ist durch eine Linie abgesetzt, die Summenspalte fett; die Monatsnamen sind einheitlich abgekürzt („Mär“ statt „Mrz“)." },
    ],
    nachbauIntro: "Standard-Visuals von Power BI Desktop. Seitengröße benutzerdefiniert 727 × 468 px. Schrift Arial: Beschriftungen 10,5 pt, Visualtitel 12 pt. Das Berichtsdesign (JSON) setzt Farben und Schriften. Datenmodell: Tabelle Absatz (Produkt, Monat_Nr, Monat, Absatz_Stueck) wie in der CSV-Datei.",
    nachbau: [
      { id: "A", ziel: "v-zeitreihe", versatz: [0, 0], titel: "Absatz je Monat", visual: "Gruppiertes Säulendiagramm",
        felder: "X-Achse: Monat (sortiert nach Monat_Nr); Y-Achse: Summe von Absatz_Stueck",
        format: "Farbe #3A3F44; Datenbeschriftung an; Y-Achse, Gitternetz und Legende aus; Analysebereich: Durchschnittslinie gestrichelt #4D4D4D mit Datenbeschriftung",
        hinweis: "Titel dynamisch: \"Absatz je Monat, \" & IF(HASONEVALUE(Absatz[Produkt]); VALUES(Absatz[Produkt]); \"alle Produkte\")." },
      { id: "B", ziel: "v-tabelle", versatz: [0, 0], titel: "Absatz nach Produkten und Monaten", visual: "Matrix",
        felder: "Zeilen: Produkt; Spalten: Monat (sortiert nach Monat_Nr); Werte: Summe von Absatz_Stueck",
        format: "Zeilen- und Spaltensummen an, Beschriftung „Summe“, fett; Spaltenkopf mit Unterstrich #3A3F44, Zeilenraster #EFEFEF; Abstufung aus",
        hinweis: "Interaktion Matrix → Säulendiagramm: „Filtern“. Die Spaltenbreiten so wählen, dass die Monate unter den Säulen stehen." },
      { id: "C", ziel: "v-zeitreihe", anker: "links", versatz: [600, 21], titel: "Kernaussagen", visual: "Textfeld mit dynamischem Wert",
        felder: "Text-Measures, z. B. höchster Monat mit TOPN(1; VALUES(Absatz[Monat]); [Absatz])", format: "10,5 pt, #4D4D4D" },
    ],
    theme: DK.thema(),
    csv: { name: "absatz_daten.csv", text: () => {
      const k = ["Produkt;Monat_Nr;Monat;Absatz_Stueck"];
      PROD.forEach((p, i) => MON.forEach((m, j) => k.push([p, j + 1, m, W[i][j]].join(";"))));
      return k.join("\r\n"); } },
    tabellen: () => {
      const z = zeitreihe();
      return [
        { titel: `Absatz je Monat, ${name()} (Stück)`, kopf: ["Monat", "Absatz", "Δ Ø"],
          zeilen: z.r.map((v, m) => [LANG[m], zahl(v, 0), DK.delta(v - z.schnitt, 0)]) },
        { titel: "Absatz nach Produkten und Monaten (Stück)", kopf: SPALTEN.map(s => s.titel),
          zeilen: tabelle().map(r => [r.label, ...SPALTEN.slice(1).map(s => zahl(r.werte[s.key], 0))]) },
      ];
    },
  });
  zeichnen();
})();
