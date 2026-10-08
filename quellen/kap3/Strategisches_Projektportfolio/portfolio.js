/* Dashboard „Strategisches Projektportfolio“ (Abb. 3.4).
   Daten: derselbe Datensatz wie die Strategische Projektroadmap (Abb. 3.3 und 3.5), eingebettet als DATA.
   Das Portfolio stellt je Projekt die strategische Relevanz (Nutzwert 0–10) dem strategischen Risiko (Risikoindex 0–100)
   gegenüber, die Kreisfläche zeigt die Plan-Kosten. Felder aus den Grenzen 5 und 50 (gleiche Regel wie daten_portfolio.py). */
(() => {
  "use strict";
  const { zahl, delta, prozent, FARBE } = DK;
  const ST = DATA.status, GB = DATA.gb, FB = DATA.fb, BSC = DATA.bsc, STAENDE = DATA.staende;
  const PJ = DATA.projekte.map(p => ({ name: p[0], gb: p[1], fb: p[2], bsc: p[3], verantw: p[4], plan: p[5], nw: p[6], kw: p[7] }));
  const RISIKO = new Map(DATA.zeilen.map(z => [z[0] + "/" + z[1], z[6]]));
  const FELDER = ["umsetzen", "absichern", "prüfen", "nachrangig"];
  const feld = (nw, risk) => (nw >= 5 ? (risk < 50 ? 0 : 1) : (risk >= 50 ? 2 : 3));
  const R = DATA.zeilen.map(z => {
    const vq = RISIKO.get((z[0] - 1) + "/" + z[1]);
    return { q: z[0], p: z[1], st: z[2], risk: z[6], dvq: vq == null ? null : z[6] - vq, ...PJ[z[1]], feld: feld(PJ[z[1]].nw, z[6]) };
  });
  const IDEE = 2;
  const STAND_KNOEPFE = [[1, "Q3/26"], [2, "Q4/26"], [3, "Q1/27"], [4, "Q2/27"]];

  /* ---------- Zustand ---------- */
  const S = { stand: 4, gb: "alle", fb: "alle", bsc: "alle", auswahl: null, sort: null };
  function zeilen(q) {
    return R.filter(r => r.q === q &&
      (S.gb === "alle" || r.gb === +S.gb) && (S.fb === "alle" || r.fb === +S.fb) && (S.bsc === "alle" || r.bsc === +S.bsc));
  }
  function auswaehlen(p) { S.auswahl = S.auswahl === p ? null : p; zeichnen(); }
  addEventListener("keydown", e => { if (e.key === "Escape" && S.auswahl != null) { S.auswahl = null; zeichnen(); } });

  /* ---------- Layout (Seite 1024 x 646, ohne KPI-Leiste) ---------- */
  DK.init({ titel: "Strategisches Projektportfolio" });
  const bKopf = DK.box("kopf", 16, 10, 992, 46);
  DK.haarlinie(62);
  const bFilter = DK.box("filter", 16, 68, 992, 50, "dk-filter");
  DK.haarlinie(128);
  const bPort = DK.box("v-portfolio", 16, 138, 460, 504);
  const bTab = DK.box("projekte", 496, 138, 512, 504);

  /* ---------- Datenschnitte ---------- */
  DK.schnitt(bFilter, "Stand", "knoepfe", { optionen: STAND_KNOEPFE, wert: S.stand,
    onChange: v => { S.stand = v; S.auswahl = null; zeichnen(); } });
  const dd = (label, key, liste, breite) => DK.schnitt(bFilter, label, "dropdown", { breite,
    optionen: [["alle", "Alle"], ...liste.map((t, i) => [String(i), t])], wert: "alle",
    onChange: v => { S[key] = v; S.auswahl = null; zeichnen(); } });
  dd("Geschäftsbereich", "gb", GB, 170);
  dd("Funktionsbereich", "fb", FB, 150);
  dd("BSC-Perspektive", "bsc", BSC, 190);

  /* ---------- Berechnungen ---------- */
  // Standardfolge: Feld (umsetzen, absichern, prüfen, nachrangig), darin Plan-Kosten absteigend; die Nummer folgt dieser Folge
  function projekte() {
    const rows = zeilen(S.stand).slice().sort((a, b) => a.feld - b.feld || b.plan - a.plan);
    rows.forEach((r, i) => { r.nr = i + 1; });
    return rows;
  }
  function felderDaten(rows) {
    const ges = rows.reduce((s, r) => s + r.plan, 0) || 1e-9;
    return FELDER.map((label, i) => {
      const rs = rows.filter(r => r.feld === i), plan = rs.reduce((s, r) => s + r.plan, 0);
      return { label, n: rs.length, plan, anteil: plan / ges };
    });
  }
  const SPALTEN = [
    { key: "feld", titel: "Feld", breite: 80 },
    { key: "nr", titel: "Nr.", breite: 34, fmt: String },
    { key: "name", titel: "Projekt", breite: 184, typ: "text" },
    { key: "nw", titel: "Relevanz", breite: 74, fmt: v => zahl(v, 1) },
    { key: "risk", titel: "Risiko", breite: 52, fmt: String },
    { key: "dvq", id: "sp-dvq", titel: "ΔVQ Risiko", breite: 88, typ: "delta", richtung: -1, nk: 0, textBreite: 30 },
  ];
  function tabellenDaten(rows) {
    const s = S.sort, liste = rows.slice();
    if (s) {
      liste.sort((a, b) => {
        const va = a[s.key], vb = b[s.key];
        if (va == null || vb == null) return (va == null) - (vb == null);
        const c = typeof va === "string" ? va.localeCompare(vb, "de") : va - vb;
        return (s.ab ? -c : c) || a.nr - b.nr;
      });
    }
    // Standardfolge: Feld nur in der ersten Zeile der Gruppe, Trennlinie zwischen den Gruppen
    return liste.map((r, i) => {
      const neueGruppe = !s && (i === 0 || liste[i - 1].feld !== r.feld);
      return { key: r.p, label: !s && !neueGruppe ? "" : FELDER[r.feld], r, trenner: neueGruppe && i > 0,
               werte: { nr: r.nr, name: r.name, nw: r.nw, risk: r.risk, dvq: r.dvq } };
    });
  }
  function sortieren(key) {
    if (S.sort && S.sort.key === key) S.sort = { key, ab: !S.sort.ab };
    else S.sort = { key, ab: !(key === "name" || key === "feld" || key === "nr") };
    zeichnen();
  }
  function tooltipProjekt(r) {
    return [`${r.nr} ${r.name}`, `${ST[r.st]} · ${r.verantw}`, `${GB[r.gb]} · ${FB[r.fb]}`, `BSC-Perspektive: ${BSC[r.bsc]}`,
      `Strategische Relevanz (Nutzwert): ${zahl(r.nw, 1)}`,
      `Strategisches Risiko (Risikoindex): ${r.risk}${r.dvq == null ? "" : " (ΔVQ " + delta(r.dvq, 0) + ")"}`,
      `Plan-Kosten: ${zahl(r.plan, 0)} Tsd. €${r.st === IDEE ? " (Grobschätzung)" : ""}`,
      `Kapitalwert: ${r.kw == null ? "nicht finanziell bewertet" : zahl(r.kw, 0) + " Tsd. €"}`,
      `Feld: ${FELDER[r.feld]}`, "Klick filtert das Dashboard"];
  }
  // Botschaften
  function botschaftPortfolio(rows) {
    if (!rows.length) return "keine Projekte in der Auswahl";
    const top = felderDaten(rows).slice().sort((a, b) => b.plan - a.plan)[0];
    return `${top.n} ${top.n === 1 ? "Projekt" : "Projekte"} im Feld „${top.label}“ ${top.n === 1 ? "bindet" : "binden"} ` +
           `${prozent(top.anteil, 0)} der Plan-Kosten`;
  }
  function botschaftTabelle(rows, breite) {
    const steigt = rows.filter(r => r.dvq > 0).sort((a, b) => b.dvq - a.dvq || b.plan - a.plan);
    if (!steigt.length) return rows.some(r => r.dvq != null) ? "Risiko bei keinem Projekt gestiegen" : "kein Vorquartal zum Vergleich";
    const n = steigt.length, top = steigt[0];
    const kurz = `Risiko steigt bei ${n} ${n === 1 ? "Projekt" : "Projekten"}`;
    const lang = n === 1 ? `Risiko steigt bei ${top.name} (${delta(top.dvq, 0)})`
                         : `${kurz}, am stärksten: ${top.name} (${delta(top.dvq, 0)})`;
    return DK.tw(lang) <= breite ? lang : `${kurz}, am stärksten um ${delta(top.dvq, 0)}`;
  }

  /* ---------- Zeichnen ---------- */
  function zeichnen() {
    DK.kopf(bKopf, { titel: "Strategisches Projektportfolio",
      untertitel: `Strategische Projekte · Stand ${STAENDE[S.stand]} · Abweichung zum Vorquartal (ΔVQ)`,
      quelle: DK.NBSP,   // keine Quellenzeile (Revision DS); Platzhalter hält die Legende in der zweiten Zeile
      legende: [[FARBE.ist, "Ist"], [FARBE.gut, "günstig"], [FARBE.schlecht, "ungünstig"]] });

    const rows = projekte();
    const sel = S.auswahl;

    // Portfolio
    let v = DK.visual(bPort, { titel: "Portfolio der strategischen Projekte", einheit: "Kreisfläche = Plan-Kosten",
      botschaft: botschaftPortfolio(rows) });
    DK.streuung(v.flaeche, { breite: v.breite, hoehe: v.hoehe, rMax: 22,
      punkte: rows.map(r => ({ key: r.p, x: r.risk, y: r.nw, g: r.plan, r, label: String(r.nr) })),
      x: { min: 0, max: 100, ticks: [0, 25, 50, 75, 100], titel: "Strategisches Risiko (Risikoindex)" },
      y: { min: 0, max: 10, ticks: [0, 5, 10], titel: "Strategische Relevanz (Nutzwert)" },
      linien: { x: 50, y: 5 },
      felder: [{ ecke: "ol", text: "umsetzen" }, { ecke: "or", text: "absichern" },
               { ecke: "ul", text: "nachrangig" }, { ecke: "ur", text: "prüfen" }],
      auswahl: sel == null ? null : p => p.key === sel, onClick: k => auswaehlen(k),
      aria: "Portfolio aus strategischer Relevanz und strategischem Risiko", tooltip: p => tooltipProjekt(p.r) });

    // Projekte nach Feld
    v = DK.visual(bTab, { titel: "Projekte nach Feld", einheit: "Relevanz 0–10, Risiko 0–100",
      botschaft: botschaftTabelle(rows, bTab.clientWidth || 512) });
    DK.matrix(v.flaeche, { spalten: SPALTEN, zeilen: tabellenDaten(rows), zeilenhoehe: 20, sortierung: S.sort, onSort: sortieren,
      auswahl: sel, onClick: k => auswaehlen(k), tooltip: z => tooltipProjekt(z.r) });
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  /* ---------- Lernplattform: Designregeln, Nachbau, Tabellen, CSV ---------- */
  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "v-portfolio", versatz: [0, 30], regel: "SAY – Botschaft vermitteln", titel: "Kernaussage je Visual",
        text: "Unter jedem Titel steht die Aussage in einem Satz: welches Feld die meisten Plan-Kosten bindet und bei welchen Projekten das Risiko gegenüber dem Vorquartal steigt. Die Sätze werden bei jedem Filter neu berechnet. Das Original hatte nur einen zweizeiligen Diagrammtitel." },
      { nr: 2, ziel: "v-portfolio", versatz: [0, 120], regel: "UNIFY – Semantische Notation", titel: "Eine Farbe für alle Projekte",
        text: "Alle Kreise sind anthrazit (Ist). Rot und Blaugrün stehen nur für die Veränderung des Risikos, nach Wirkung gefärbt. Das Original färbte die Kreise in rund 20 Farben ohne Bedeutung und zeigte einen Legendenrest „Series3“." },
      { nr: 3, ziel: "projekte", regel: "CONDENSE – Informationsdichte", titel: "Nummer verbindet Kreis und Zeile",
        text: "Die Namensliste des Originals stand ohne Bezug neben dem Diagramm. Jetzt trägt jeder Kreis die Nummer seiner Tabellenzeile; die Tabelle ergänzt Relevanz, Risiko und die Veränderung zum Vorquartal." },
      { nr: 4, ziel: "v-portfolio", versatz: [0, 154], regel: "CHECK – Visuelle Integrität", titel: "Fläche proportional, flache Kreise",
        text: "Die Kreisfläche, nicht der Durchmesser, wächst mit den Plan-Kosten. Flache, leicht transparente Kreise mit weißem Rand lassen überlagerte Projekte erkennen; die 3D-Kugeln des Originals verdeckten sich gegenseitig." },
      { nr: 5, ziel: "v-portfolio", versatz: [0, 188], regel: "EXPRESS – Passende Darstellung", titel: "Benannte Felder statt „niedrig/hoch“",
        text: "Die Grenzen bei Relevanz 5 und Risiko 50 teilen das Portfolio in vier Felder mit Handlungsempfehlung: umsetzen, absichern, prüfen, nachrangig. Das Original setzte „niedrig“ und „hoch“ an die Achsentitel, teils an die falsche Stelle." },
      { nr: 6, ziel: "filter", regel: "SIMPLIFY – Überflüssiges weglassen", titel: "Kein Logo, keine Navigation",
        text: "Logo, Info-Symbol, Navigationsknöpfe, Farbverlauf und Gitternetz entfallen, ebenso der Filter „Firma“. Status, Verantwortung, Bereiche, Plan-Kosten und Kapitalwert stehen im Tooltip." },
      { nr: 7, ziel: "projekte", versatz: [-28, 0], regel: "STRUCTURE – Inhalte ordnen", titel: "Nach Feld gruppiert, sortierbar",
        text: "Die Tabelle folgt den Feldern umsetzen, absichern, prüfen, nachrangig, innerhalb nach Plan-Kosten; die Nummern folgen dieser Reihenfolge. Ein Klick auf einen Spaltenkopf sortiert um." },
      { nr: 8, ziel: "kopf-titel", versatz: [26, 0], regel: "UNIFY – Begriffe", titel: "Gleiche Kennzahlen wie die Roadmap",
        text: "Die Achsen nennen Begriff und Kennzahl: strategische Relevanz (Nutzwert) und strategisches Risiko (Risikoindex), wie im Portfolio der Strategischen Projektroadmap. Beide Dashboards nutzen denselben Datensatz." },
    ],
    nachbauIntro: "Alle Elemente sind Standard-Visuals von Power BI Desktop. Seitengröße benutzerdefiniert 1024 × 646 px. Schrift Arial: Beschriftungen 10,5 pt, Visualtitel 12 pt, Berichtstitel 16,5 pt. Das Berichtsdesign (JSON) setzt Farben und Schriften.",
    nachbau: [
      { id: "A", ziel: "kopf-titel", versatz: [60, 0], titel: "Kopfzeile und Legende", visual: "Textfeld; Formen (Rechteck)",
        felder: "Untertitel mit dynamischem Wert: Measure „Stand Text“",
        format: "Titel 16,5 pt fett; Legende: Rechtecke 9 × 9 px in #3A3F44, #00806B, #C62828" },
      { id: "B", ziel: "filter", versatz: [-28, 0], titel: "Datenschnitte", visual: "Datenschnitt (Stil Kacheln bzw. Dropdown)",
        felder: "Stand (Quartal), Geschäftsbereich, Funktionsbereich, BSC-Perspektive",
        format: "Ausgewählt: Füllung #3A3F44, Schrift weiß; nicht ausgewählt: weiß, Rahmen #9A9A9A" },
      { id: "C", ziel: "v-portfolio", versatz: [0, 120], titel: "Portfolio", visual: "Punktdiagramm",
        felder: "Werte: Nr.; X-Achse: Risikoindex; Y-Achse: Nutzwert; Größe: Plan-Kosten; QuickInfos: Projekt, Status, Verantwortung, Kapitalwert",
        format: "Achsen fest 0–100 und 0–10; Analysebereich: X- und Y-Konstantenlinie bei 50 und 5, gestrichelt #9A9A9A; Markierung #3A3F44, 20 % Transparenz; Kategoriebeschriftungen an; Gitternetz aus",
        hinweis: "Nr. als berechnete Spalte je Stand: RANKX über Feld-Sortierung und Plan-Kosten. Bei Bereichsfiltern bleiben die Nummern dann fest, statt neu durchzuzählen. Die Feldnamen sind Textfelder über dem Visual." },
      { id: "D", ziel: "projekte", versatz: [-56, 0], titel: "Projekte nach Feld", visual: "Matrix (Zeilen: Feld, Nr., Projekt; Layout „tabellarisch“, Abstufung aus)",
        felder: "Werte: Nutzwert, Risikoindex, Measure „ΔVQ Risiko“ = [Risikoindex] − CALCULATE([Risikoindex]; Vorquartal)",
        format: "Feld als berechnete Spalte: SWITCH(TRUE(); Nutzwert >= 5 && Risikoindex < 50; \"umsetzen\"; …), sortiert nach Feld-Sortierspalte 1–4; Datenbalken ΔVQ positiv #C62828, negativ #00806B",
        hinweis: "Projekte innerhalb eines Felds nach Plan-Kosten absteigend sortieren (Sortierspalte oder Nr.)." },
      { id: "E", ziel: "v-portfolio", versatz: [0, 30], titel: "Kernaussagen", visual: "Textfeld mit dynamischem Wert",
        felder: "Je Visual ein Text-Measure, z. B. TOPN(1; Felder; [Plan-Kosten]) für das Feld mit den meisten Plan-Kosten",
        format: "10,5 pt, #4D4D4D" },
    ],
    theme: DK.thema(),
    csv: { name: "projektportfolio_beispieldaten.csv", text: () => {
      const kopf = "Stand;Projekt_ID;Projekt;Status;Verantwortung;Geschäftsbereich;Funktionsbereich;BSC_Perspektive;Plan_Kosten_TEUR;Nutzwert;Risikoindex;Risiko_dVQ;Feld;Kapitalwert_TEUR";
      const leer = v => (v == null ? "" : v);
      return [kopf, ...R.map(r => [STAENDE[r.q], r.p + 1, r.name, ST[r.st], r.verantw, GB[r.gb], FB[r.fb], BSC[r.bsc], r.plan,
        String(r.nw).replace(".", ","), r.risk, leer(r.dvq), FELDER[r.feld], leer(r.kw)].join(";"))].join("\r\n"); } },
    tabellen: () => {
      const rows = projekte();
      return [
        { titel: "Felder (Plan-Kosten in Mio. €)", kopf: ["Feld", "Projekte", "Plan-Kosten", "Anteil"],
          zeilen: felderDaten(rows).map(f => [f.label, String(f.n), zahl(f.plan / 1000, 1), prozent(f.anteil, 0)]) },
        { titel: "Projekte (Tsd. €)", kopf: ["Nr.", "Feld", "Projekt", "Status", "Verantwortung", "Plan-Kosten", "Relevanz", "Risiko", "ΔVQ Risiko", "Kapitalwert"],
          zeilen: rows.map(r => [String(r.nr), FELDER[r.feld], r.name, ST[r.st], r.verantw, zahl(r.plan, 0), zahl(r.nw, 1), String(r.risk),
            r.dvq == null ? "–" : delta(r.dvq, 0), r.kw == null ? "–" : zahl(r.kw, 0)]) },
      ];
    },
  });
  zeichnen();
})();
