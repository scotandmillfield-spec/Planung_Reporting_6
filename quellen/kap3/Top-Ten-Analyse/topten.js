/* Einzelvisual „Top-Ten-Analyse“ (Abb. 3.20): Tabelle und Balkendiagramm der zehn umsatzstärksten Kunden.
   Seite 727 x 420 px = 110 x 63,6 mm. Daten: topten.json (daten_topten.py) – 48 Kunden mit Vertriebsgebiet und Umsatz
   2025–2027 in €; die zehn größten Kunden 2027 sind die des Originals (Namen erfunden). Wie im Original links die
   Tabelle, rechts das Balkendiagramm Ist gegen Vorjahr – zwei getrennte Visuals in derselben Reihenfolge, deren Zeilen
   auf gleicher Höhe liegen. Datenschnitte Jahr und Vertriebsgebiet; Klick auf Zeile oder Balken hebt den Kunden in
   beiden Visuals hervor. */
(() => {
  "use strict";
  const { zahl, delta, NBSP, FARBE, sv, el } = DK;
  const JAHRE = DATA.jahre;
  const K = DATA.kunden.map(([name, gebiet], i) => ({ i, name, gebiet, u: DATA.werte[i] }));
  const GEBIETE = ["Nord", "Ost", "Süd", "West"];
  const N = 10, ZH = 24, KOPF = 30;                       // Zeilenhöhe und Kopfhöhe – gleich in Tabelle und Diagramm
  const tsd = v => zahl(v / 1000, 1);
  const pz = (v, nk = 0) => delta(v * 100, nk, NBSP + "%");

  /* ---------- Zustand ---------- */
  const S = { jahr: JAHRE[JAHRE.length - 1], gebiet: "alle", sort: null, auswahl: null };
  const auswaehlen = k => { S.auswahl = S.auswahl === k ? null : k; zeichnen(); };
  addEventListener("keydown", e => { if (e.key === "Escape" && S.auswahl != null) { S.auswahl = null; zeichnen(); } });

  /* ---------- Layout ---------- */
  // Revision DS 08.10.2026: Berichtsname oben, die Datenschnitte darunter
  DK.init({ titel: "Top-Ten-Analyse", breite: 727, hoehe: 468 });
  const bKopf = DK.box("kopf", 16, 10, 695, 40);
  DK.haarlinie(56);
  const bFilter = DK.box("filter", 16, 64, 695, 50, "dk-filter");
  DK.haarlinie(122);
  const bTab = DK.box("v-tabelle", 16, 132, 322, 334);
  const bDia = DK.box("v-diagramm", 358, 132, 353, 334);
  DK.el("style", {}, document.head, `
    #v-tabelle .dk-matrix th { vertical-align: bottom; height: ${KOPF - 5}px; }
    #v-tabelle .dk-matrix td:nth-child(2), #v-tabelle .dk-matrix th:nth-child(2) { text-align: left; }`);

  /* ---------- Berechnungen ---------- */
  function daten() {
    const ji = JAHRE.indexOf(S.jahr);
    const alle = K.filter(k => S.gebiet === "alle" || k.gebiet === S.gebiet).map(k => ({ k, ist: k.u[ji], vj: k.u[ji - 1] }));
    const ges = alle.reduce((s, r) => s + r.ist, 0);
    const rangVj = alle.slice().sort((a, b) => b.vj - a.vj);
    alle.forEach(r => { r.dvj = r.ist - r.vj; r.dvjp = r.dvj / r.vj; r.anteil = r.ist / ges; r.rangVj = rangVj.indexOf(r) + 1; });
    alle.sort((a, b) => b.ist - a.ist).forEach((r, i) => { r.rang = i + 1; });
    const top = alle.slice(0, N), s = S.sort;
    if (s) top.sort((a, b) => {
      const c = s.key === "kunde" ? a.k.name.localeCompare(b.k.name, "de") : s.key === "rang" ? a.rang - b.rang : a[s.key] - b[s.key];
      return (s.ab ? -c : c) || a.rang - b.rang;
    });
    const sTop = top.reduce((x, r) => x + r.ist, 0);
    return { top, n: alle.length, ges, anteilTop: sTop / ges };
  }
  const gebietText = () => (S.gebiet === "alle" ? "alle Vertriebsgebiete" : "Vertriebsgebiet " + S.gebiet);

  const SPALTEN = [
    { key: "rang", titel: "Rang", breite: 44 },
    { key: "kunde", id: "sp-kunde", titel: "Kunde", breite: 162, typ: "text" },
    { key: "vj", id: "sp-vj", titel: "VJ", breite: 58, fmt: tsd },
    { key: "ist", id: "sp-ist", titel: "IST", breite: 58, fmt: tsd },
  ];
  function sortieren(key) {
    if (S.sort && S.sort.key === key) S.sort = { key, ab: !S.sort.ab };
    else S.sort = { key, ab: !["kunde", "rang"].includes(key) };
    zeichnen();
  }
  function tooltipKunde(r) {
    return [r.k.name, `Vertriebsgebiet ${r.k.gebiet} · Rang ${r.rang} (Vorjahr Rang ${r.rangVj})`,
      `Umsatz ${S.jahr}: ${tsd(r.ist)} Tsd. € · ${S.jahr - 1}: ${tsd(r.vj)} Tsd. €`,
      `ΔVJ ${delta(r.dvj / 1000, 1)} Tsd. € (${pz(r.dvjp)})`,
      `Anteil am Umsatz (${gebietText()}): ${zahl(r.anteil * 100, 1)}${NBSP}%`,
      "Klick hebt den Kunden in Tabelle und Diagramm hervor"];
  }
  const passt = (kandidaten, breite) => kandidaten.find(t => DK.tw(t) <= breite) || kandidaten[kandidaten.length - 1];
  function botschaftTabelle(d, breite) {
    const a = zahl(d.anteilTop * 100, 0) + NBSP + "%";
    return passt([`Top ${d.top.length} = ${a} des Umsatzes von ${d.n} Kunden`, `Top ${d.top.length} = ${a} des Umsatzes`], breite);
  }
  function botschaftDiagramm(d, breite) {
    const nach = d.top.slice().sort((a, b) => a.dvjp - b.dvjp), rueck = nach[0], zuw = nach[nach.length - 1];
    const kurz = n => n.replace(/ (Versicherung|Leben)$/, "");
    const k = [];
    if (rueck.dvjp < -0.05 && zuw.dvjp > 0.05) k.push(`${kurz(rueck.k.name)} ${pz(rueck.dvjp)}, ${kurz(zuw.k.name)} ${pz(zuw.dvjp)} zum Vorjahr`);
    if (rueck.dvjp < -0.05) k.push(`stärkster Rückgang: ${kurz(rueck.k.name)} ${pz(rueck.dvjp)}`);
    k.push(`stärkster Zuwachs: ${kurz(zuw.k.name)} ${pz(zuw.dvjp)}`);
    const t = passt(k.map(s => s[0].toUpperCase() + s.slice(1)), breite);
    return t;
  }

  /* ---------- Balkendiagramm Ist gegen Vorjahr (gruppiertes Balkendiagramm) ---------- */
  function diagramm(ziel, d, breite, KOPF, ZH) {
    ziel.textContent = "";
    const n = d.top.length, H = KOPF + n * ZH;
    const svg = sv("svg", { width: breite, height: H, role: "img",
      "aria-label": `Gruppierte Balken je Kunde: Umsatz ${S.jahr} und ${S.jahr - 1}` }, ziel);
    // Legende in Höhe des Tabellenkopfs
    const lg = sv("g", { id: "dia-legende" }, svg);
    sv("rect", { x: 0, y: KOPF - 18, width: 11, height: 11, fill: FARBE.ist }, lg);
    sv("text", { x: 16, y: KOPF - 12, dy: "0.35em", class: "muted" }, lg, `IST ${S.jahr}`);
    const x2 = 16 + DK.tw(`IST ${S.jahr}`) + 18;
    sv("rect", { x: x2, y: KOPF - 18, width: 11, height: 11, fill: FARBE.vj }, lg);
    sv("text", { x: x2 + 16, y: KOPF - 12, dy: "0.35em", class: "muted" }, lg, `VJ ${S.jahr - 1}`);
    sv("line", { x1: 0, x2: breite, y1: KOPF - 0.5, y2: KOPF - 0.5, stroke: "var(--ac)", "stroke-width": 1 }, svg);
    const kurz = n => n.replace(/ (Versicherung|Leben)$/, "");
    const lw = Math.ceil(Math.max(...d.top.map(r => DK.tw(kurz(r.k.name))))) + 10;
    const vw = Math.ceil(Math.max(...d.top.map(r => DK.tw(tsd(r.ist))))) + 8;
    const max = Math.max(...d.top.map(r => Math.max(r.ist, r.vj)), 1);
    const pw = breite - lw - vw, bi = 9, bv = 6;
    d.top.forEach((r, i) => {
      const y = KOPF + i * ZH, blass = S.auswahl != null && S.auswahl !== r.k.name;
      const g = sv("g", { class: "dk-klick" + (blass ? " dk-blass" : "") }, svg);
      sv("text", { x: lw - 10, y: y + ZH / 2, dy: "0.35em", "text-anchor": "end" }, g, kurz(r.k.name));
      const wi = r.ist / max * pw, wv = r.vj / max * pw, y0 = y + (ZH - bi - bv - 1) / 2;
      sv("rect", { x: lw, y: y0, width: wi, height: bi, fill: FARBE.ist }, g);
      sv("rect", { x: lw, y: y0 + bi + 1, width: wv, height: bv, fill: FARBE.vj }, g);
      sv("text", { x: lw + Math.max(wi, wv) + 5, y: y + ZH / 2, dy: "0.35em" }, g, tsd(r.ist));
      const hit = sv("rect", { x: 0, y, width: breite, height: ZH, fill: "transparent" }, g);
      hit.addEventListener("click", () => auswaehlen(r.k.name));
      DK._tip(hit, () => tooltipKunde(r));
    });
    sv("line", { x1: lw, x2: lw, y1: KOPF, y2: H, stroke: "#8C8C8C", "stroke-width": 1 }, svg);
  }
  // Tooltip wie in den Bausteinen (DK.tooltip ist nicht exportiert)
  const tip = document.querySelector(".dk-tooltip");       // von DK.init angelegt
  DK._tip = (ziel, zeilenFn) => {
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

  /* ---------- Datenschnitte ---------- */
  DK.schnitt(bFilter, "Jahr", "knoepfe", {
    optionen: JAHRE.slice(1).map(y => [y, String(y)]), wert: S.jahr,
    onChange: v => { S.jahr = Number(v); S.auswahl = null; zeichnen(); } });
  DK.schnitt(bFilter, "Vertriebsgebiet", "dropdown", {
    breite: 170, optionen: [["alle", "Alle Gebiete"], ...GEBIETE.map(g => [g, g])], wert: S.gebiet,
    onChange: v => { S.gebiet = v; S.auswahl = null; zeichnen(); } });

  /* ---------- Zeichnen ---------- */
  function zeichnen() {
    const d = daten();
    DK.kopf(bKopf, { titel: "Top-Ten-Analyse",
      untertitel: `Umsatz der zehn größten Kunden · Geschäftsjahr ${S.jahr} im Vergleich zum Vorjahr ${S.jahr - 1}`,
      quelle: "", legende: [] });
    let v = DK.visual(bTab, { titel: `Top-Ten-Kunden ${S.jahr}`, einheit: "Tsd. €", botschaft: botschaftTabelle(d, bTab.clientWidth || 322) });
    const t = DK.matrix(v.flaeche, { spalten: SPALTEN, zeilenhoehe: ZH, sortierung: S.sort, onSort: sortieren, auswahl: S.auswahl,
      zeilen: d.top.map(r => ({ key: r.k.name, label: String(r.rang), r, werte: { kunde: r.k.name, vj: r.vj, ist: r.ist } })),
      onClick: auswaehlen, tooltip: z => tooltipKunde(z.r) });
    v = DK.visual(bDia, { titel: "Umsatz Top-Ten-Kunden", einheit: "Tsd. €", botschaft: botschaftDiagramm(d, bDia.clientWidth || 353) });
    // Zeilen des Diagramms auf die gemessenen Zeilen der Tabelle legen
    const tr = t.querySelectorAll("tbody tr"), y0 = tr[0].offsetTop;
    const pitch = tr.length > 1 ? (tr[tr.length - 1].offsetTop - y0) / (tr.length - 1) : ZH;
    diagramm(v.flaeche, d, v.breite, y0, pitch);
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  /* ---------- Lernplattform: Designregeln, Nachbau, Tabellen, CSV ---------- */
  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "v-tabelle", anker: "links", versatz: [318, 21], regel: "SAY – Botschaft vermitteln", titel: "Kernaussage je Visual",
        text: "Unter jedem Titel steht in einem Satz, was die Zahlen sagen: welchen Anteil die zehn größten Kunden am Umsatz haben und wo sich ein Kunde am stärksten verändert hat – berechnet für Jahr und Gebiet. Das Original hatte nur Überschriften." },
      { nr: 2, ziel: "dia-legende", anker: "links", versatz: [195, -1], regel: "UNIFY – Semantische Notation", titel: "Ist anthrazit, Vorjahr hellgrau",
        text: "Die Szenarien haben dieselben Farben wie in allen Abbildungen des Buchs: Ist anthrazit, Vorjahr hellgrau und schmaler. Das Original färbte Ist rot und Vorjahr blau – Rot stand damit für ein Szenario statt für eine ungünstige Abweichung." },
      { nr: 3, ziel: "sp-ist", versatz: [-35, -2], regel: "STRUCTURE – Inhalte ordnen", titel: "Rang nach dem Ist",
        text: "Die Rangfolge richtet sich nach dem Umsatz des gewählten Jahres. Das Original sortierte nach dem Vorjahr, sodass z. B. der fünftgrößte Kunde mit mehr Umsatz hinter dem vierten stand. Der Tooltip nennt den Vorjahresrang." },
      { nr: 4, ziel: "v-diagramm", anker: "links", versatz: [295, 222], regel: "STRUCTURE – Gleiche Reihenfolge", titel: "Zeilen auf gleicher Höhe",
        text: "Tabelle und Diagramm zeigen die Kunden in derselben Reihenfolge und auf derselben Zeilenhöhe; ein Klick auf eine Zeile oder einen Balken hebt den Kunden in beiden Visuals hervor. Sortiert man die Tabelle um, folgt das Diagramm." },
      { nr: 5, ziel: "v-diagramm", anker: "links", versatz: [300, 300], regel: "SIMPLIFY – Überflüssiges weglassen", titel: "Werte am Balken statt Achse",
        text: "Der Ist-Wert steht am Balkenende; Werteachse, Gitternetz, Rahmen und die Legende rechts unten entfallen. Die Legende steht in der Kopfzeile, auf Höhe des Tabellenkopfs." },
      { nr: 6, ziel: "sp-kunde", anker: "links", versatz: [100, -2], regel: "UNIFY – Einheitliche Zahlen", titel: "Tsd. € und vollständige Namen",
        text: "Statt sechsstelliger Eurobeträge („164.674“) stehen Tausend Euro mit einer Nachkommastelle, die Einheit steht im Titel. Im Diagramm des Original waren Namen abgeschnitten („Hamburg-…“, „Bayern…“)." },
      { nr: 7, ziel: "v-diagramm", anker: "links", versatz: [92, 324], regel: "CHECK – Visuelle Integrität", titel: "Ein Maßstab ab null",
        text: "Ist- und Vorjahresbalken beginnen an derselben Nulllinie und teilen einen Maßstab; so ist der Rückgang beim zehnten Kunden direkt als kürzerer Ist-Balken sichtbar." },
      { nr: 8, ziel: "filter", anker: "links", versatz: [300, 6], regel: "CONDENSE – Filtern statt vervielfachen", titel: "Jahr und Vertriebsgebiet als Datenschnitte",
        text: "Die Rangfolge wird für jede Auswahl neu berechnet: Im Vertriebsgebiet Ost erscheinen andere Kunden als bundesweit. Die Namen der Kunden sind erfunden; das Original nannte reale Versicherungsunternehmen." },
    ],
    nachbauIntro: "Standard-Visuals von Power BI Desktop. Seitengröße benutzerdefiniert 727 × 420 px. Schrift Arial: Beschriftungen 10,5 pt, Visualtitel 12 pt. Das Berichtsdesign (JSON) setzt Farben und Schriften. Datenmodell: Tabelle Umsatz (Kunde, Vertriebsgebiet, Jahr, Umsatz) wie in der CSV-Datei.",
    nachbau: [
      { id: "A", ziel: "v-tabelle", versatz: [0, 0], titel: "Top-Ten-Kunden", visual: "Tabelle",
        felder: "Measure Rang = RANKX(ALLSELECTED(Umsatz[Kunde]); [IST]); Kunde; Measures VJ und IST",
        format: "Filter auf Kunde: Filtertyp „Top N“, 10 nach [IST]; Werte in Tsd. € (Anzeigeeinheit Tausend, 1 Dezimalstelle); Summen aus; Spaltenkopf mit Unterstrich #3A3F44, Zeilenraster #EFEFEF",
        hinweis: "IST = SUM(Umsatz[Umsatz]) für das gewählte Jahr, VJ = CALCULATE([IST]; Umsatz[Jahr] = SELECTEDVALUE(Umsatz[Jahr]) − 1)." },
      { id: "B", ziel: "v-diagramm", versatz: [0, 0], titel: "Umsatz Top-Ten-Kunden", visual: "Gruppiertes Balkendiagramm",
        felder: "Y-Achse: Kunde; X-Achse: IST und VJ; Filter wie A (Top N = 10 nach [IST])",
        format: "Farben IST #3A3F44, VJ #C9C9C9; Datenbeschriftung nur für IST; X-Achse, Gitternetz und Titel der Achsen aus; Legende oben links; sortiert nach IST absteigend",
        hinweis: "Gleiche Zeilenhöhe wie die Tabelle über die Visualhöhe einstellen; Tabelle und Diagramm filtern sich per Klick gegenseitig (Interaktionen „Hervorheben“)." },
      { id: "C", ziel: "filter", anker: "links", versatz: [80, 6], titel: "Datenschnitte", visual: "Datenschnitt (2×)",
        felder: "Jahr als Kacheln (Einzelauswahl), Vertriebsgebiet als Dropdown",
        format: "Ausgewählt #3A3F44 mit weißer Schrift, sonst weiß mit Rahmen #9A9A9A" },
      { id: "D", ziel: "v-tabelle", anker: "links", versatz: [318, 21], titel: "Kernaussagen", visual: "Textfeld mit dynamischem Wert",
        felder: "Text-Measures, z. B. DIVIDE(Summe der Top 10; [IST] aller Kunden) für den Anteil", format: "10,5 pt, #4D4D4D" },
    ],
    theme: DK.thema(),
    csv: { name: "top_ten_kunden_daten.csv", text: () => {
      const k = ["Kunde;Vertriebsgebiet;Jahr;Umsatz_EUR"];
      K.forEach(x => JAHRE.forEach((y, i) => k.push([x.name, x.gebiet, y, x.u[i]].join(";"))));
      return k.join("\r\n"); } },
    tabellen: () => {
      const d = daten();
      return [{ titel: `Top-Ten-Kunden ${S.jahr}, ${gebietText()} (Tsd. €)`,
        kopf: ["Rang", "Kunde", "Gebiet", `VJ ${S.jahr - 1}`, `IST ${S.jahr}`, "ΔVJ %", "Anteil %"],
        zeilen: d.top.map(r => [String(r.rang), r.k.name, r.k.gebiet, tsd(r.vj), tsd(r.ist), pz(r.dvjp), zahl(r.anteil * 100, 1)]) }];
    },
  });
  zeichnen();
})();
