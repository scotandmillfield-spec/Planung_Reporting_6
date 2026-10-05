/* Dashboard „Strategische Projektroadmap“ – zweiter Test für den Skill sechste-auflage-dashboard.
   Daten: synthetisch (daten_projekte.py), eingebettet als DATA. Alle Kennzahlen werden hier aus den Einzelsätzen berechnet. */
(() => {
  "use strict";
  const { zahl, delta, prozent, wirkung, FARBE } = DK;
  const ST = DATA.status, GB = DATA.gb, FB = DATA.fb, BSC = DATA.bsc, STAENDE = DATA.staende;
  const PJ = DATA.projekte.map(p => ({ name: p[0], gb: p[1], fb: p[2], bsc: p[3], verantw: p[4], plan: p[5], nw: p[6], kw: p[7] }));
  const R = DATA.zeilen.map(z => ({ q: z[0], p: z[1], st: z[2], fert: z[3] == null ? null : z[3] / 100, abw: z[4], verz: z[5],
                                    risk: z[6], ...PJ[z[1]] }));
  const IDEE = 2, UMSETZUNG = 0, PLANUNG = 1;
  const STAND_KNOEPFE = [[1, "Q3/25"], [2, "Q4/25"], [3, "Q1/26"], [4, "Q2/26"]];

  /* ---------- Zustand ---------- */
  const S = { stand: 4, gb: "alle", fb: "alle", bsc: "alle", auswahl: null, sort: null };
  // ohne: Auswahltyp, der für dieses Visual nicht filtert ("projekt", "status" oder "alle")
  function zeilen(q, ohne) {
    const a = S.auswahl;
    return R.filter(r => r.q === q &&
      (S.gb === "alle" || r.gb === +S.gb) && (S.fb === "alle" || r.fb === +S.fb) && (S.bsc === "alle" || r.bsc === +S.bsc) &&
      (!a || ohne === "alle" || a.typ === ohne || (a.typ === "projekt" ? r.p === a.wert : r.st === a.wert)));
  }
  function auswaehlen(typ, wert) {
    S.auswahl = S.auswahl && S.auswahl.typ === typ && S.auswahl.wert === wert ? null : { typ, wert };
    zeichnen();
  }
  addEventListener("keydown", e => { if (e.key === "Escape" && S.auswahl) { S.auswahl = null; zeichnen(); } });
  const passt = r => !S.auswahl || (S.auswahl.typ === "projekt" ? r.p === S.auswahl.wert : r.st === S.auswahl.wert);

  /* ---------- Layout (Seite 1024 x 646) ---------- */
  DK.init({ titel: "Strategische Projektroadmap" });
  const bKopf = DK.box("kopf", 16, 10, 992, 46);
  DK.haarlinie(62);
  const bFilter = DK.box("filter", 16, 68, 992, 50, "dk-filter");
  const bKpi = DK.box("kpis", 16, 128, 992, 68);
  DK.haarlinie(206);
  const bTab = DK.box("projekte", 16, 216, 672, 426);
  const bPort = DK.box("v-portfolio", 708, 216, 300, 250);
  DK.haarlinie(474, 708, 16);
  const bStatus = DK.box("v-status", 708, 482, 300, 160);

  /* ---------- Datenschnitte ---------- */
  DK.schnitt(bFilter, "Berichtsstand", "knoepfe", { optionen: STAND_KNOEPFE, wert: S.stand,
    onChange: v => { S.stand = v; zeichnen(); } });
  const dd = (label, key, liste, breite) => DK.schnitt(bFilter, label, "dropdown", { breite,
    optionen: [["alle", "Alle"], ...liste.map((t, i) => [String(i), t])], wert: "alle",
    onChange: v => { S[key] = v; S.auswahl = null; zeichnen(); } });
  dd("Geschäftsbereich", "gb", GB, 170);
  dd("Funktionsbereich", "fb", FB, 150);
  dd("BSC-Perspektive", "bsc", BSC, 190);

  /* ---------- Berechnungen ---------- */
  const summe = (rows, f) => rows.reduce((s, r) => s + (f(r) ?? 0), 0);
  function kennzahlen(rows) {
    const u = rows.filter(r => r.st === UMSETZUNG), pu = summe(u, r => r.plan);
    return { n: rows.length, plan: summe(rows, r => r.plan) / 1000, abw: summe(rows, r => r.abw) / 1000,
             fert: pu ? summe(u, r => r.plan * r.fert) / pu * 100 : null,
             verz: rows.filter(r => (r.st === UMSETZUNG || r.st === PLANUNG) && r.verz > 0).length,
             kw: summe(rows, r => r.kw) / 1000, risk: rows.length ? summe(rows, r => r.risk) / rows.length : null };
  }
  function kpiDaten() {
    const ist = kennzahlen(zeilen(S.stand)), vq = kennzahlen(zeilen(S.stand - 1));
    const def = [
      ["Projekte", "n", 0, 0, "", ""],
      ["Plan-Kosten", "plan", 1, 0, "Mio. €", ""],
      ["Kostenabweichung", "abw", 1, -1, "Mio. €", ""],
      ["Ø Fertigstellung", "fert", 0, +1, "%", " %-Pkt."],
      ["Im Terminverzug", "verz", 0, -1, "Projekte", ""],
      ["Kapitalwert", "kw", 1, +1, "Mio. €", ""],
      ["Ø Risikoindex", "risk", 0, -1, "", ""],
    ];
    return def.map(([label, k, nk, richtung, einheit, suffix]) => {
      const a = ist[k], p = vq[k];
      const d = a == null || p == null ? null : a - p;
      return { label, bezug: "ΔVQ", einheit: a == null ? "" : einheit === "Projekte" && a === 1 ? "Projekt" : einheit,
        wert: a == null ? "–" : k === "abw" ? delta(a, nk) : zahl(a, nk),
        wertKlasse: k === "abw" && a != null ? wirkung(a, -1, nk) : "",
        delta: d == null ? "–" : delta(d, nk, suffix), klasse: d == null ? "neutral" : wirkung(d, richtung, nk), roh: [a, p] };
    });
  }
  const SPALTEN = [
    { key: "name", titel: "Projekt", breite: 186 },
    { key: "st", titel: "Status", breite: 86, typ: "text" },
    { key: "plan", titel: "Plan-Kosten", breite: 90, fmt: v => zahl(v, 0) },
    { key: "abw", id: "sp-abw", titel: "ΔPL Kosten", breite: 110, typ: "delta", richtung: -1, nk: 0, textBreite: 46 },
    { key: "fert", titel: "Fertigstellung", breite: 100, typ: "anteil", textBreite: 46 },
    { key: "verz", id: "sp-verz", titel: "ΔPL Termin", breite: 100, typ: "delta", richtung: -1, nk: 0, textBreite: 36 },
  ];
  function tabellenDaten() {
    const rows = zeilen(S.stand, "projekt").slice();
    const s = S.sort;
    if (!s) rows.sort((a, b) => a.st - b.st || b.plan - a.plan);
    else {
      const wert = r => (s.key === "st" ? r.st : r[s.key]);
      rows.sort((a, b) => {
        const va = wert(a), vb = wert(b);
        if (va == null || vb == null) return (va == null) - (vb == null);
        const c = typeof va === "string" ? va.localeCompare(vb, "de") : va - vb;
        return (s.ab ? -c : c) || b.plan - a.plan;
      });
    }
    // Standardsortierung: Status nur in der ersten Zeile der Gruppe (Matrix mit Zeilenkopf), Trennlinie zwischen Gruppen
    return rows.map((r, i) => {
      const neueGruppe = !s && (i === 0 || rows[i - 1].st !== r.st);
      return { key: r.p, label: r.name, r, trenner: neueGruppe && i > 0,
               werte: { st: !s && !neueGruppe ? "" : ST[r.st], plan: r.plan, abw: r.abw, fert: r.fert, verz: r.verz } };
    });
  }
  function sortieren(key) {
    if (S.sort && S.sort.key === key) S.sort = { key, ab: !S.sort.ab };
    else S.sort = { key, ab: !(key === "name" || key === "st") };
    zeichnen();
  }
  function statusDaten() {
    const rows = zeilen(S.stand, "alle");
    const z = ST.map((label, i) => {
      const rs = rows.filter(r => r.st === i);
      return { key: i, label, wert: summe(rs, r => r.plan) / 1000, n: rs.length, kontur: FARBE.ist };
    });
    return { zeilen: z, ges: z.reduce((s, x) => s + x.wert, 0) || 1e-9 };
  }
  function portfolioDaten() {
    return zeilen(S.stand, "alle").map(r => ({ key: r.p, x: r.risk, y: r.nw, g: r.plan, r }));
  }
  const pruefen = r => r.risk >= 50 && r.nw < 5;
  function tooltipProjekt(r) {
    return [r.name, `${ST[r.st]} · ${r.verantw}`, `${GB[r.gb]} · ${FB[r.fb]}`, `BSC-Perspektive: ${BSC[r.bsc]}`,
      `Plan-Kosten: ${zahl(r.plan, 0)} Tsd. €${r.st === IDEE ? " (Grobschätzung)" : ""}`,
      `Kostenabweichung: ${r.abw == null ? "–" : delta(r.abw, 0) + " Tsd. €"}`,
      `Fertigstellung: ${r.fert == null ? "–" : prozent(r.fert, 0)}`,
      `Terminverzug: ${r.verz == null ? "–" : delta(r.verz, 0) + " Wochen"}`,
      `Nutzwert ${zahl(r.nw, 1)} · Risikoindex ${r.risk}`,
      `Kapitalwert: ${r.kw == null ? "nicht finanziell bewertet" : zahl(r.kw, 0) + " Tsd. €"}`,
      "Klick filtert das Dashboard"];
  }

  /* ---------- Zeichnen ---------- */
  function zeichnen() {
    DK.kopf(bKopf, { titel: "Strategische Projektroadmap",
      untertitel: `Strategische Projekte · Berichtsstand ${STAENDE[S.stand]} · Abweichung zum Plan (ΔPL) und zum Vorquartal (ΔVQ)`,
      quelle: `Quelle: Projektcontrolling · Stand ${STAENDE[4]}`,
      legende: [["#FFFFFF", "Plan", "#3A3F44"], [FARBE.ist, "Ist"], [FARBE.gut, "günstig"], [FARBE.schlecht, "ungünstig"]] });

    DK.kpis(bKpi, kpiDaten());

    // Projekttabelle
    const td = tabellenDaten();
    const mehr = td.filter(z => z.r.abw > 0).sort((a, b) => b.r.abw - a.r.abw)[0];
    const verz = td.filter(z => z.r.verz > 0 && z.r.st !== 3).sort((a, b) => b.r.verz - a.r.verz)[0];
    const teile = [];
    if (mehr) teile.push(`größte Mehrkosten: ${mehr.label} (${delta(mehr.r.abw, 0)} Tsd. €)`);
    if (verz) teile.push(`größter Verzug: ${verz.label} (${delta(verz.r.verz, 0)} Wo.)`);
    let v = DK.visual(bTab, { titel: "Projekte", einheit: "Kosten in Tsd. €, Termin in Wochen",
      botschaft: teile.length ? teile.join(", ") : "keine Mehrkosten und kein Verzug gegenüber Plan" });
    DK.matrix(v.flaeche, { spalten: SPALTEN, zeilen: td, zeilenhoehe: 18, sortierung: S.sort, onSort: sortieren,
      auswahl: S.auswahl?.typ === "projekt" ? S.auswahl.wert : null, onClick: k => auswaehlen("projekt", k),
      tooltip: z => tooltipProjekt(z.r) });

    // Portfolio
    const pd = portfolioDaten();
    const kritisch = pd.filter(p => pruefen(p.r)).length;
    v = DK.visual(bPort, { titel: "Portfolio", einheit: "Kreisfläche = Plan-Kosten",
      botschaft: kritisch ? `${kritisch} ${kritisch === 1 ? "Projekt" : "Projekte"} im Feld „prüfen“` : "kein Projekt im Feld „prüfen“" });
    DK.streuung(v.flaeche, { breite: v.breite, hoehe: v.hoehe, punkte: pd, rMax: 13,
      x: { min: 0, max: 100, ticks: [0, 50, 100], titel: "Risikoindex" },
      y: { min: 0, max: 10, ticks: [0, 5, 10], titel: "Nutzwert" },
      linien: { x: 50, y: 5 },
      felder: [{ ecke: "ol", text: "umsetzen" }, { ecke: "ur", text: "prüfen" }],
      auswahl: S.auswahl ? p => passt(p.r) : null, onClick: k => auswaehlen("projekt", k),
      aria: "Portfolio aus Nutzwert und Risikoindex", tooltip: p => tooltipProjekt(p.r) });

    // Status
    const sd = statusDaten();
    const top = sd.zeilen.slice().sort((a, b) => b.wert - a.wert)[0];
    v = DK.visual(bStatus, { titel: "Plan-Kosten nach Status", einheit: "Mio. €",
      botschaft: `${top.label} bindet ${prozent(top.wert / sd.ges, 0)} der Plan-Kosten` });
    const selStatus = !S.auswahl ? null : S.auswahl.typ === "status" ? S.auswahl.wert
      : (R.find(r => r.q === S.stand && r.p === S.auswahl.wert) || {}).st;
    DK.balken(v.flaeche, { breite: v.breite - 4, hoehe: v.hoehe, zeilenhoehe: 26, zeilen: sd.zeilen, fmt: x => zahl(x, 1),
      auswahl: selStatus ?? null, onClick: k => auswaehlen("status", k), aria: "Plan-Kosten nach Status",
      tooltip: z => [z.label, `${z.n} ${z.n === 1 ? "Projekt" : "Projekte"}`, `Plan-Kosten: ${zahl(z.wert, 1)} Mio. €`,
                     `Anteil: ${prozent(z.wert / sd.ges, 1)}`, "Klick filtert das Dashboard"] });
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  /* ---------- Lernplattform: Designregeln, Nachbau, Tabellen, CSV ---------- */
  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "v-portfolio", regel: "SAY – Botschaft vermitteln", titel: "Kernaussage je Visual",
        text: "Unter jedem Titel steht die Aussage in einem Satz: größte Mehrkosten, größter Verzug, Projekte im Feld „prüfen“. Die Sätze werden bei jedem Filter neu berechnet." },
      { nr: 2, ziel: "kopf-legende", anker: "links", regel: "UNIFY – Semantische Notation", titel: "Plan umrandet, Abweichung nach Wirkung",
        text: "Planwerte sind weiß mit Kontur, Istwerte anthrazit. Mehrkosten und Verzug sind rot, Einsparung und Vorsprung blaugrün. Das Original zeigte Mehrkosten als grüne Balken und eine Einsparung als roten." },
      { nr: 3, ziel: "projekte", regel: "UNIFY – Einheiten und Formate", titel: "Einheit im Titel, ein Format je Spalte",
        text: "Tsd. € und Wochen stehen im Titel. Das Original mischte 8,00 und 8, „ohne“ neben Zahlen und nannte für den Terminverzug keine Einheit. Fehlende Werte erscheinen einheitlich als „–“." },
      { nr: 4, ziel: "v-portfolio", versatz: [0, 26], regel: "CONDENSE – Informationsdichte", titel: "Portfolio statt zwei Ampelspalten",
        text: "Nutzwert und Risikoindex standen als Rot-Gelb-Grün-Zellen nebeneinander. Als Achsen eines Portfolios zeigen sie dieselben Werte und zusätzlich, welche Projekte zusammen auffallen; die Kreisfläche ergänzt die Plan-Kosten." },
      { nr: 5, ziel: "sp-abw", versatz: [4, -2], regel: "CHECK – Visuelle Integrität", titel: "Sichtbare Nulllinie, Zahl neben dem Balken",
        text: "Abweichungsbalken gehen von einer sichtbaren Nulllinie aus, ein Maßstab je Spalte. Die Zahl steht links daneben; im Original verdeckten die Balken die Zahlen." },
      { nr: 6, ziel: "v-status", regel: "EXPRESS – Passende Darstellung", titel: "Struktur als Balken",
        text: "Die Verteilung der Plan-Kosten auf die Status ist eine Struktur und steht deshalb als Balken. Klick auf einen Balken filtert Tabelle, Portfolio und Kennzahlen." },
      { nr: 7, ziel: "kpis", regel: "SIMPLIFY – Überflüssiges weglassen", titel: "Keine Farbskalen, kein Logo, keine Kästen",
        text: "Farbskalen, Farbverläufe, Logo und hinterlegte Filterkästen entfallen. Verantwortung, Bereich, Nutzwert, Risikoindex und Kapitalwert stehen im Tooltip jeder Zeile." },
      { nr: 8, ziel: "projekte", versatz: [-28, 0], regel: "STRUCTURE – Inhalte ordnen", titel: "Feste Statusfolge, sortierbar",
        text: "Tabelle und Balken folgen derselben Statusfolge: Umsetzung, Planung, Idee, erledigt; innerhalb nach Plan-Kosten. Ein Klick auf einen Spaltenkopf sortiert um." },
    ],
    nachbauIntro: "Alle Elemente sind Standard-Visuals von Power BI Desktop. Seitengröße benutzerdefiniert 1024 × 646 px. Schrift Arial: Beschriftungen 10,5 pt, Visualtitel 12 pt, Kennzahlen 19,5 pt. Das Berichtsdesign (JSON) setzt Farben und Schriften.",
    nachbau: [
      { id: "A", ziel: "kopf-titel", versatz: [26, 0], titel: "Kopfzeile und Legende", visual: "Textfeld; Formen (Rechteck)",
        felder: "Untertitel mit dynamischem Wert: Measure „Berichtsstand Text“",
        format: "Titel 16,5 pt fett; Legende: Rechtecke 9 × 9 px (Plan weiß mit Rahmen #3A3F44)" },
      { id: "B", ziel: "filter", titel: "Datenschnitte", visual: "Datenschnitt (Stil Kacheln bzw. Dropdown)",
        felder: "Berichtsstand (Quartal), Geschäftsbereich, Funktionsbereich, BSC-Perspektive",
        format: "Ausgewählt: Füllung #3A3F44, Schrift weiß; nicht ausgewählt: weiß, Rahmen #9A9A9A",
        hinweis: "ΔVQ-Measures verwenden DATEADD(Stand[Datum]; -1; QUARTER) bzw. den vorigen Stand-Index." },
      { id: "C", ziel: "kpis", titel: "KPI-Leiste", visual: "Karte (neu) mit 7 Measures",
        felder: "Projekte, Plan-Kosten, Kostenabweichung, Ø Fertigstellung (kostengewichtet, Status Umsetzung), Im Terminverzug, Kapitalwert, Ø Risikoindex; Referenzbeschriftung ΔVQ",
        format: "Wert und Referenzbeschriftung: bedingte Formatierung nach Feldwert (Farb-Measure liefert #00806B, #C62828 oder #1A1A1A)",
        hinweis: "Die Kostenabweichung ist selbst eine Abweichung (ΔPL) und wird deshalb auch im Wert eingefärbt." },
      { id: "D", ziel: "projekte", titel: "Projekttabelle", visual: "Matrix (Zeilen: Status, Projekt; Layout „tabellarisch“, Abstufung aus)",
        felder: "Projekt, Status, Plan-Kosten, Kostenabweichung, Fertigstellung, Terminverzug; QuickInfos: Verantwortung, Bereiche, Nutzwert, Risikoindex, Kapitalwert",
        format: "Bedingte Formatierung „Datenbalken“: Kosten und Termin positiv #C62828, negativ #00806B, Achse automatisch; Fertigstellung #3A3F44, Minimum 0, Maximum 1; Zeilenabstand kompakt",
        hinweis: "Status nach Sortierspalte (1 Umsetzung … 4 erledigt) sortieren, dann Plan-Kosten absteigend." },
      { id: "E", ziel: "v-portfolio", versatz: [0, 26], titel: "Portfolio", visual: "Punktdiagramm",
        felder: "Werte: Projekt; X-Achse: Risikoindex; Y-Achse: Nutzwert; Größe: Plan-Kosten",
        format: "Achsen fest 0–100 und 0–10; Analysebereich: X- und Y-Konstantenlinie bei 50 und 5, gestrichelt #9A9A9A; Markierung #3A3F44, 20 % Transparenz",
        hinweis: "Die Feldnamen „umsetzen“ und „prüfen“ sind Textfelder über dem Visual." },
      { id: "F", ziel: "v-status", versatz: [-28, 0], titel: "Plan-Kosten nach Status", visual: "Gruppiertes Balkendiagramm",
        felder: "Y-Achse: Status (Sortierspalte); X-Achse: Plan-Kosten in Mio. €",
        format: "Balken weiß mit Rahmen #3A3F44, 1 px (Planwerte); Datenbeschriftung an; X-Achse und Gitternetz aus" },
      { id: "G", ziel: "projekte", versatz: [-56, 0], titel: "Kernaussagen", visual: "Textfeld mit dynamischem Wert",
        felder: "Je Visual ein Text-Measure, z. B. TOPN(1; Projekte; [Kostenabweichung]) für die größten Mehrkosten",
        format: "10,5 pt, #4D4D4D" },
    ],
    theme: DK.thema(),
    csv: { name: "projektroadmap_beispieldaten.csv", text: () => {
      const kopf = "Stand;Projekt_ID;Projekt;Status;Verantwortung;Geschäftsbereich;Funktionsbereich;BSC_Perspektive;Plan_Kosten_TEUR;Kostenabweichung_TEUR;Fertigstellung_Prozent;Terminverzug_Wochen;Nutzwert;Risikoindex;Kapitalwert_TEUR";
      const leer = v => (v == null ? "" : v);
      return [kopf, ...R.map(r => [STAENDE[r.q], r.p + 1, r.name, ST[r.st], r.verantw, GB[r.gb], FB[r.fb], BSC[r.bsc], r.plan,
        leer(r.abw), r.fert == null ? "" : Math.round(r.fert * 100), leer(r.verz), String(r.nw).replace(".", ","), r.risk,
        leer(r.kw)].join(";"))].join("\r\n"); } },
    tabellen: () => {
      const sd = statusDaten();
      return [
        { titel: "KPI-Leiste", kopf: ["Kennzahl", "Ist", "ΔVQ"], zeilen: kpiDaten().map(k => [k.label, k.wert + (k.einheit ? " " + k.einheit : ""), k.delta]) },
        { titel: "Projekte (Tsd. €, Wochen)", kopf: ["Projekt", "Status", "Verantwortung", "Plan-Kosten", "ΔPL Kosten", "Fertigst.", "ΔPL Termin", "Nutzwert", "Risiko", "Kapitalwert"],
          zeilen: tabellenDaten().map(({ r }) => [r.name, ST[r.st], r.verantw, zahl(r.plan, 0), r.abw == null ? "–" : delta(r.abw, 0),
            r.fert == null ? "–" : prozent(r.fert, 0), r.verz == null ? "–" : delta(r.verz, 0), zahl(r.nw, 1), String(r.risk),
            r.kw == null ? "–" : zahl(r.kw, 0)]) },
        { titel: "Plan-Kosten nach Status (Mio. €)", kopf: ["Status", "Projekte", "Plan-Kosten"], zeilen: sd.zeilen.map(z => [z.label, String(z.n), zahl(z.wert, 1)]) },
      ];
    },
  });
  zeichnen();
})();
