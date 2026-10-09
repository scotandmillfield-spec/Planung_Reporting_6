/* Dashboard „Portfolio-Analyse“ (Abb. 3.23), Layout wie Abb. 3.5 (Kopf, Datenschnitt, Kennzahlenleiste, Tabellen links,
   Portfolio rechts). Daten: portfolio_analyse.json (daten_portfolio_analyse.py) – die fünf strategischen
   Geschäftseinheiten (SGE) mit den Werten des Originals als Ist 2027, dazu 2025 und 2026 für den Datenschnitt Jahr.
   Relativer Marktanteil = eigener Marktanteil / Marktanteil des stärksten Konkurrenten, Umsatzanteil = Umsatz / Umsatz
   aller SGE (gleiche Formeln wie daten_portfolio_analyse.py). Die vier Felder tragen die Normstrategien des
   Boston-Consulting-Portfolios (Question Marks, Stars, Poor Dogs, Cash Cows); Grenzen bei 1,5 und 3 % wie im Original. */
(() => {
  "use strict";
  const { zahl, delta, prozent, wirkung, NBSP } = DK;
  const GR = DATA.grenzen, JAHRE = DATA.jahre;
  const FELDER = [
    { key: "ol", name: "Question Marks", strategie: "Selektieren", test: r => r.wachstum >= GR.wachstum && r.rel < GR.rel_ma },
    { key: "or", name: "Stars", strategie: "Investieren", test: r => r.wachstum >= GR.wachstum && r.rel >= GR.rel_ma },
    { key: "ur", name: "Cash Cows", strategie: "Abschöpfen", test: r => r.wachstum < GR.wachstum && r.rel >= GR.rel_ma },
    { key: "ul", name: "Poor Dogs", strategie: "Desinvestieren", test: r => r.wachstum < GR.wachstum && r.rel < GR.rel_ma },
  ];
  const feldVon = r => FELDER.find(f => f.test(r));
  const und = l => (l.length < 2 ? l.join("") : l.slice(0, -1).join(", ") + " und " + l[l.length - 1]);
  const pz = (v, nk) => zahl(v, nk) + NBSP + "%";

  /* ---------- Zustand: Daten je Jahr ---------- */
  const S = { jahr: JAHRE[JAHRE.length - 1], auswahl: null, sort: null };
  function daten(jahr) {
    const j = JAHRE.indexOf(jahr);
    if (j < 0) return null;
    const roh = DATA.sge.map(([sge, w]) => ({ sge, ma: w[j][0], mak: w[j][1], wachstum: w[j][2], umsatz: w[j][3] }));
    const ges = roh.reduce((s, z) => s + z.umsatz, 0);
    return roh.map((z, i) => ({ i, ...z, rel: z.ma / z.mak, anteil: z.umsatz / ges }));
  }
  let R = daten(S.jahr);
  const GES = () => R.reduce((s, r) => s + r.umsatz, 0);
  function auswaehlen(k) { S.auswahl = S.auswahl === k ? null : k; zeichnen(); }
  addEventListener("keydown", e => { if (e.key === "Escape" && S.auswahl != null) { S.auswahl = null; zeichnen(); } });

  /* ---------- Layout (Seite 1024 x 646) ---------- */
  DK.init({ titel: "Portfolio-Analyse" });
  const bKopf = DK.box("kopf", 16, 10, 992, 46);
  DK.haarlinie(62);
  const bFilter = DK.box("filter", 16, 68, 992, 50, "dk-filter");
  const bKpi = DK.box("kpis", 16, 128, 992, 68);
  DK.haarlinie(206);
  const bTab = DK.box("v-tabelle", 16, 216, 560, 184);
  const bFelder = DK.box("v-felder", 16, 414, 560, 228);
  const bPort = DK.box("v-portfolio", 596, 216, 412, 426);

  /* ---------- Datenschnitt ---------- */
  DK.schnitt(bFilter, "Jahr", "knoepfe", { optionen: JAHRE.map(j => [j, String(j)]), wert: S.jahr,
    onChange: v => { S.jahr = Number(v); R = daten(S.jahr); S.auswahl = null; zeichnen(); } });

  /* ---------- Kennzahlen ---------- */
  function summen(rs) {
    const ges = rs.reduce((s, r) => s + r.umsatz, 0), f = n => rs.filter(r => feldVon(r).name === n).reduce((s, r) => s + r.umsatz, 0) / ges;
    return { umsatz: ges, wachstum: rs.reduce((s, r) => s + r.wachstum * r.umsatz, 0) / ges,
             fuehrend: rs.filter(r => r.rel > 1).length, stars: f("Stars"), kuehe: f("Cash Cows") };
  }
  function kpiDaten() {
    const ist = summen(R), vj = S.jahr === JAHRE[0] ? null : summen(daten(S.jahr - 1));
    const def = [
      ["Umsatz", "umsatz", 0, +1, "Mio. €", ""],
      ["Ø Marktwachstum", "wachstum", 1, +1, "%", " %-Pkt."],
      ["SGE mit führender Position", "fuehrend", 0, +1, "SGE", ""],
      ["Umsatzanteil Stars", "stars", 1, +1, "%", " %-Pkt."],
      ["Umsatzanteil Cash Cows", "kuehe", 1, +1, "%", " %-Pkt."],
    ];
    return def.map(([label, k, nk, richtung, einheit, suffix]) => {
      const pr = k === "stars" || k === "kuehe";
      const a = pr ? ist[k] * 100 : ist[k], p = vj == null ? null : (pr ? vj[k] * 100 : vj[k]);
      const d = p == null ? null : a - p;
      return { label, bezug: "ΔVJ", einheit, wert: zahl(a, nk),
        delta: d == null ? "–" : delta(d, nk, suffix), klasse: d == null ? "neutral" : wirkung(d, richtung, nk), roh: [a, p] };
    });
  }

  /* ---------- Tabellen ---------- */
  const SPALTEN = [
    { key: "sge", titel: "SGE", breite: 46 },
    { key: "ma", id: "sp-ma", titel: "Eigener MA", breite: 76, fmt: v => zahl(v, 1) },
    { key: "mak", titel: "MA Konkurrent", breite: 100, fmt: v => zahl(v, 1) },
    { key: "rel", id: "sp-rel", titel: "Relativer MA", breite: 92, fmt: v => zahl(v, 1) },
    { key: "wachstum", titel: "Marktwachstum", breite: 110, fmt: v => zahl(v, 1) },
    { key: "umsatz", titel: "Umsatz", breite: 62, fmt: v => zahl(v, 0) },
    { key: "anteil", id: "sp-anteil", titel: "Anteil", breite: 74, fmt: v => zahl(v * 100, 1) },
  ];
  function tabellenDaten() {
    const s = S.sort, liste = R.slice();
    if (s) liste.sort((a, b) => {
      const c = typeof a[s.key] === "string" ? a[s.key].localeCompare(b[s.key], "de") : a[s.key] - b[s.key];
      return (s.ab ? -c : c) || a.i - b.i;
    });
    return liste.map(r => ({ key: r.sge, label: r.sge, r, werte: r }));
  }
  function sortieren(key) {
    if (S.sort && S.sort.key === key) S.sort = { key, ab: !S.sort.ab };
    else S.sort = { key, ab: key !== "sge" };
    zeichnen();
  }
  function felderDaten() {
    return FELDER.map(f => {
      const rs = R.filter(f.test);
      return { ...f, sge: rs.map(r => r.sge), umsatz: rs.reduce((s, r) => s + r.umsatz, 0), anteil: rs.reduce((s, r) => s + r.anteil, 0) };
    });
  }
  const felderTab = () => felderDaten().map(f => ({ key: f.name, label: f.name, f,
    werte: { name: f.name, strategie: f.strategie, sge: f.sge.join(", ") || "–", anteil: f.anteil } }));
  const SPALTEN_FELDER = [
    { key: "name", titel: "Feld", breite: 150 },
    { key: "strategie", titel: "Normstrategie", breite: 140, typ: "text" },
    { key: "sge", titel: "SGE", breite: 100, typ: "text" },
    { key: "anteil", titel: "Umsatzanteil", breite: 100, fmt: v => zahl(v * 100, 1) },
  ];
  function tooltipSGE(r) {
    return [`SGE ${r.sge}`, `Eigener Marktanteil: ${pz(r.ma, 1)}`, `Marktanteil stärkster Konkurrent: ${pz(r.mak, 1)}`,
      `Relativer Marktanteil: ${zahl(r.rel, 2)}${r.rel > 1 ? " (Marktführer)" : ""}`, `Marktwachstum: ${pz(r.wachstum, 1)}`,
      `Umsatz: ${zahl(r.umsatz, 0)} Mio. € (${pz(r.anteil * 100, 1)})`, `Feld: ${feldVon(r).name} (${feldVon(r).strategie})`, "Klick hebt die SGE hervor"];
  }

  // Botschaften (aus den Daten berechnet, Kurzfassung, falls die Zeile zu lang wird)
  function botschaftTabelle(breite) {
    const fuehrend = R.filter(r => r.rel > 1).map(r => r.sge), top = R.slice().sort((a, b) => b.umsatz - a.umsatz)[0];
    const kurz = `${und(fuehrend)} ${fuehrend.length === 1 ? "führt seinen" : "führen ihren"} Markt (relativer MA über 1)`;
    const lang = `${kurz}, ${top.sge} hat den größten Umsatzanteil (${pz(top.anteil * 100, 1)})`;
    return DK.tw(lang) <= breite ? lang : kurz;
  }
  function botschaftPortfolio(breite) {
    const f = felderDaten()[0];
    if (!f.sge.length) return `keine SGE bei den ${f.name}`;
    const kurz = `${und(f.sge)} ${f.sge.length === 1 ? "ist" : "sind"} ${f.name}`;
    const lang = `${kurz} – zusammen ${prozent(f.anteil, 0)} des Umsatzes`;
    return DK.tw(lang) <= breite ? lang : kurz;
  }

  /* ---------- Zeichnen ---------- */
  function zeichnen() {
    const sel = S.auswahl;
    DK.kopf(bKopf, { titel: "Portfolio-Analyse",
      untertitel: `Strategische Geschäftseinheiten (SGE) · Ist ${S.jahr} · Marktwachstum und relativer Marktanteil · Normstrategien nach dem Boston-Consulting-Portfolio`,
      quelle: DK.NBSP, legende: [] });
    DK.kpis(bKpi, kpiDaten());

    let v = DK.visual(bTab, { titel: "Strategische Geschäftseinheiten", einheit: "MA und Wachstum in %, Umsatz in Mio. €",
      botschaft: botschaftTabelle(bTab.clientWidth || 560) });
    DK.matrix(v.flaeche, { spalten: SPALTEN, zeilen: tabellenDaten(), zeilenhoehe: 20, sortierung: S.sort, onSort: sortieren,
      auswahl: sel, onClick: k => auswaehlen(k), tooltip: z => tooltipSGE(z.r) });

    v = DK.visual(bFelder, { titel: "Felder des Portfolios", einheit: "Umsatzanteil in %",
      botschaft: "Normstrategie je Feld: Investieren, Selektieren, Abschöpfen oder Desinvestieren" });
    DK.matrix(v.flaeche, { spalten: SPALTEN_FELDER, zeilen: felderTab(), zeilenhoehe: 20 });

    v = DK.visual(bPort, { titel: "Portfolio", einheit: "Kreisfläche = Umsatz",
      botschaft: botschaftPortfolio(bPort.clientWidth || 412) });
    DK.streuung(v.flaeche, { breite: v.breite, hoehe: v.hoehe, rMax: 28,
      punkte: R.map(r => ({ key: r.sge, x: r.rel, y: r.wachstum, g: r.umsatz, r, label: r.sge })),
      x: { min: 0, max: 3, ticks: [0, 0.5, 1, 1.5, 2, 2.5, 3], titel: "Relativer Marktanteil", fmt: t => zahl(t, 1) },
      y: { min: 0, max: 6, ticks: [0, 1, 2, 3, 4, 5, 6], titel: "Marktwachstum in %", fmt: t => zahl(t, 0) },
      linien: { x: GR.rel_ma, y: GR.wachstum },
      felder: FELDER.map(f => ({ ecke: f.key, text: f.name })),
      auswahl: sel == null ? null : p => p.key === sel, onClick: k => auswaehlen(k),
      aria: "Portfolio der fünf SGE aus relativem Marktanteil und Marktwachstum, Kreisfläche nach Umsatz",
      tooltip: p => tooltipSGE(p.r) });
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

/* ---------- Lernplattform: Designregeln, Nachbau, Tabellen, CSV ---------- */
  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "v-tabelle", versatz: [0, 30], regel: "SAY – Botschaft vermitteln", titel: "Kernaussage je Visual",
        text: "Unter jedem Titel steht in einem Satz, was die Zahlen sagen: welche SGE ihren Markt führen und welche SGE in wachsenden Märkten nur einen geringen relativen Marktanteil haben. Das Original hatte nur den Titel „Portfolio-Analyse“ im Diagramm." },
      { nr: 2, ziel: "v-portfolio", anker: "links", versatz: [60, 165], regel: "UNIFY – Semantische Notation", titel: "Eine Farbe für alle SGE",
        text: "Alle Kreise sind anthrazit, denn die SGE unterscheiden sich durch ihre Lage, nicht durch eine Kategorie. Das Original färbte jede SGE anders (Blau, Weinrot, Hellgelb, Hellblau, Violett); die hellen Kreise verschwanden im Graustufendruck fast." },
      { nr: 3, ziel: "v-portfolio", anker: "links", versatz: [345, 128], regel: "SIMPLIFY – Überflüssiges weglassen", titel: "Beschriftung statt Legende",
        text: "Der Buchstabe steht direkt am Kreis. Die Legende „SGE A … SGE E“ rechts neben dem Diagramm entfällt und mit ihr das Hin- und Herschauen. Rahmen um Diagramm und Zeichenfläche sowie der Diagrammtitel im Bild entfallen ebenfalls." },
      { nr: 4, ziel: "sp-ma", versatz: [36, 26], anker: "links", regel: "UNIFY – Zahlenformate", titel: "Ein Format je Größe",
        text: "Alle Anteile und Wachstumsraten haben eine Nachkommastelle, die Einheit steht einmal im Titel. Das Original mischte „3,20%“, „4,2%“ und „23,15%“ und setzte das Prozentzeichen an jede Zahl." },
      { nr: 5, ziel: "sp-rel", versatz: [36, 26], anker: "links", regel: "CONDENSE – Informationsdichte", titel: "Tabelle und Portfolio als Einheit",
        text: "Die Tabelle liefert die Ausgangswerte, das Portfolio ihre Lage. Ein Klick auf eine Zeile oder einen Kreis hebt dieselbe SGE in beiden hervor; der Tooltip zeigt alle Werte und das Feld." },
      { nr: 6, ziel: "v-portfolio", anker: "links", versatz: [250, 265], regel: "CHECK – Visuelle Integrität", titel: "Fläche proportional zum Umsatz",
        text: "Die Kreisfläche, nicht der Durchmesser, wächst mit dem Umsatz: C (310 Mio. €) ist gut zweieinhalbmal so groß wie B und E (je 120 Mio. €). Beide Achsen beginnen bei null; die Kreise sind leicht transparent, damit Überlagerungen sichtbar bleiben." },
      { nr: 7, ziel: "v-portfolio", anker: "links", versatz: [213, 100], regel: "EXPRESS – Passende Darstellung", titel: "Trennlinien als Hilfslinien",
        text: "Die Grenzen bei relativem Marktanteil 1,5 und Marktwachstum 3 % stammen aus dem Original; sie sind gestrichelt, weil sie Bezugslinien und keine Daten sind. In der klassischen BCG-Matrix liegt die Grenze beim relativen Marktanteil bei 1,0 – ab dort führt eine SGE ihren Markt." },
      { nr: 8, ziel: "sp-anteil", versatz: [36, 26], anker: "links", regel: "STRUCTURE – Inhalte ordnen", titel: "Feste Reihenfolge, sortierbar",
        text: "Die SGE stehen in der Reihenfolge A bis E. Ein Klick auf einen Spaltenkopf sortiert die Tabelle, z. B. nach Umsatzanteil; ein zweiter Klick kehrt die Richtung um." },
    ],
    nachbauIntro: "Standard-Visuals von Power BI Desktop. Seitengröße benutzerdefiniert 1024 × 646 px. Schrift Arial: Beschriftungen 10,5 pt, Visualtitel 12 pt. Das Berichtsdesign (JSON) setzt Farben und Schriften. Datenmodell: eine Tabelle SGE mit den Spalten der CSV-Datei (Jahr als Datenschnitt, Einzelauswahl, vorbelegt 2027).",
    nachbau: [
      { id: "A", ziel: "v-tabelle", versatz: [0, 0], titel: "Strategische Geschäftseinheiten", visual: "Tabelle",
        felder: "SGE, Eigener MA, MA stärkster Konkurrent, Relativer MA, Marktwachstum, Umsatz, Umsatzanteil (je ein Measure)",
        format: "Anteile, Wachstum und relativer MA mit 1 Dezimalstelle, Umsatz ohne; Summen aus; Spaltenkopf mit Unterstrich #3A3F44, Zeilenrasterlinien #EFEFEF, sonst keine Rahmen",
        hinweis: "Relativer MA = DIVIDE([Eigener MA]; [MA stärkster Konkurrent]), Umsatzanteil = DIVIDE([Umsatz]; CALCULATE([Umsatz]; ALL(SGE))) * 100. Beide Measures rechnen aus den Ausgangswerten, so stimmen Tabelle und Portfolio immer überein." },
      { id: "B", ziel: "v-portfolio", versatz: [0, 120], titel: "Portfolio", visual: "Punktdiagramm",
        felder: "Werte: SGE; X-Achse: Measure „Relativer MA“; Y-Achse: Marktwachstum; Größe: Umsatz; QuickInfos: Eigener MA, MA stärkster Konkurrent, Umsatzanteil",
        format: "Achsen fest 0–3 und 0–6; Analysebereich: X-Konstantenlinie 1,5 und Y-Konstantenlinie 3, gestrichelt #9A9A9A; Markierung #3A3F44, 20 % Transparenz; Kategoriebeschriftungen an; Legende, Gitternetz und Rahmen aus",
        hinweis: "Für die BCG-Grenze bei 1,0 nur den Wert der X-Konstantenlinie ändern." },
      { id: "C", ziel: "v-tabelle", versatz: [0, 30], titel: "Kernaussagen", visual: "Textfeld mit dynamischem Wert",
        felder: "Je Visual ein Text-Measure, z. B. CONCATENATEX(FILTER(SGE; [Relativer MA] > 1); SGE[SGE]; \", \") für die Marktführer",
        format: "10,5 pt, #4D4D4D" },
    ],
    theme: DK.thema(),
    csv: { name: "portfolio_analyse_daten.csv", text: () => {
      const de = (v, nk) => v.toFixed(nk).replace(".", ",");
      return ["Jahr;SGE;Eigener_MA_Prozent;MA_staerkster_Konkurrent_Prozent;Relativer_MA;Marktwachstum_Prozent;Umsatz_Mio_EUR;Umsatzanteil_Prozent",
        ...JAHRE.flatMap(j => daten(j).map(r => [j, r.sge, de(r.ma, 1), de(r.mak, 1), de(r.rel, 2), de(r.wachstum, 1), r.umsatz, de(r.anteil * 100, 2)].join(";")))].join("\r\n"); } },
    tabellen: () => [
      { titel: "Marktanteile in % (Konkurrent = stärkster Konkurrent)", kopf: ["SGE", "Eigener MA", "MA Konkurrent", "Relativer MA"],
        zeilen: R.map(r => [r.sge, zahl(r.ma, 1), zahl(r.mak, 1), zahl(r.rel, 2)]) },
      { titel: "Marktwachstum (in %) und Umsatz (Mio. €)", kopf: ["SGE", "Marktwachstum", "Umsatz", "Umsatzanteil"],
        zeilen: [...R.map(r => [r.sge, zahl(r.wachstum, 1), zahl(r.umsatz, 0), zahl(r.anteil * 100, 1)]), ["Gesamt", "", zahl(GES(), 0), zahl(100, 1)]] },
      { titel: `Felder des Portfolios ${S.jahr} (Umsatzanteil in %)`, kopf: ["Feld", "Normstrategie", "SGE", "Umsatzanteil"],
        zeilen: felderDaten().map(f => [f.name, f.strategie, f.sge.join(", ") || "–", zahl(f.anteil * 100, 1)]) },
    ],
  });
  zeichnen();
})();
