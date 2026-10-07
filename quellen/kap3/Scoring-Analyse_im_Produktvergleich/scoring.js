/* Einzelvisual „Scoring-Analyse im Produktvergleich“ (Abb. 3.27): Tabelle und Balkendiagramm.
   Seite 727 x 370 px = 110 x 56 mm. Daten: scoring.json (daten_scoring.py) – fünf Kriterien, drei Gewichtungen (Summe 100),
   Punkte 0–10 für das eigene Produkt und drei Konkurrenzprodukte; Standard und Konkurrenzprodukt A sind die Werte des
   Originals. Wie im Original links die Tabelle, rechts das Balkendiagramm der gewichteten Punkte – zwei Visuals in
   derselben Reihenfolge, Zeilen auf gleicher Höhe. Datenschnitte Wettbewerber und Gewichtung; Klick auf Zeile oder
   Balken hebt das Kriterium in beiden Visuals hervor. */
(() => {
  "use strict";
  const { zahl, delta, NBSP, FARBE, sv } = DK;
  const KRIT = DATA.kriterien, GEW = DATA.gewichtung, PROD = DATA.produkte;
  const KONK = Object.keys(PROD).filter(k => k !== "eigen");
  const FARBE_EIGEN = FARBE.ist, FARBE_KONK = "#8F8F8F";
  const pkt = v => (v == null ? "–" : zahl(v, 0));
  const pz = v => zahl(v, 0) + NBSP + "%";

  /* ---------- Zustand ---------- */
  const S = { konk: "A", gew: "standard", sort: null, auswahl: null };
  const auswaehlen = k => { S.auswahl = S.auswahl === k ? null : k; zeichnen(); };
  addEventListener("keydown", e => { if (e.key === "Escape" && S.auswahl != null) { S.auswahl = null; zeichnen(); } });

  /* ---------- Layout ---------- */
  DK.init({ titel: "Scoring-Analyse im Produktvergleich", breite: 727, hoehe: 370 });
  const bFilter = DK.box("filter", 16, 8, 695, 50, "dk-filter");
  DK.haarlinie(66);
  const bTab = DK.box("v-tabelle", 16, 76, 430, 284);
  const bDia = DK.box("v-diagramm", 466, 76, 245, 284);
  DK.el("style", {}, document.head, `
    #v-tabelle .dk-matrix th { vertical-align: bottom; }
    #v-tabelle .dk-matrix tr.dk-gruppe th { text-align: center; border-bottom: 1px solid #9A9A9A; padding: 0 8px 3px; }
    #v-tabelle .dk-matrix tr.dk-gruppe th.leer { border-bottom: none; }`);

  /* ---------- Berechnungen ---------- */
  function daten() {
    const g = GEW[S.gew].werte, e = PROD.eigen.punkte, k = PROD[S.konk].punkte;
    const zeilen = KRIT.map((name, i) => ({ i, name, gew: g[i], pe: e[i], pk: k[i], ge: g[i] * e[i], gk: g[i] * k[i] }));
    const sum = key => zeilen.reduce((s, z) => s + z[key], 0);
    const liste = zeilen.slice(), s = S.sort;
    if (s) liste.sort((a, b) => {
      const c = s.key === "name" ? a.i - b.i : a[s.key] - b[s.key];
      return (s.ab ? -c : c) || a.i - b.i;
    });
    return { zeilen: liste, ge: sum("ge"), gk: sum("gk"), konkName: PROD[S.konk].name };
  }
  const SPALTEN = [
    { key: "name", titel: "Kriterium", breite: 104 },
    { key: "gew", id: "sp-gew", titel: "Gewichtung", breite: 94, fmt: pz },
    { key: "pe", id: "sp-pe", titel: "Punkte", breite: 60, fmt: pkt },
    { key: "ge", id: "sp-ge", titel: "gewichtet", breite: 80, fmt: pkt },
    { key: "pk", id: "sp-pk", titel: "Punkte", breite: 60, fmt: pkt },
    { key: "gk", id: "sp-gk", titel: "gewichtet", breite: 80, fmt: pkt },
  ];
  function sortieren(key) {
    if (S.sort && S.sort.key === key) S.sort = { key, ab: !S.sort.ab };
    else S.sort = { key, ab: key !== "name" };
    zeichnen();
  }
  function tooltipKrit(z, d) {
    const diff = z.ge - z.gk;
    return [z.name, `Gewichtung ${GEW[S.gew].name.toLowerCase()}: ${pz(z.gew)}`,
      `Eigenes Produkt: ${z.pe} Punkte × ${z.gew} = ${pkt(z.ge)}`,
      `${d.konkName}: ${z.pk} Punkte × ${z.gew} = ${pkt(z.gk)}`,
      `Differenz eigenes Produkt: ${delta(diff, 0)} gewichtete Punkte`,
      "Klick hebt das Kriterium in Tabelle und Diagramm hervor"];
  }
  const passt = (kandidaten, breite) => kandidaten.find(t => DK.tw(t) <= breite) || kandidaten[kandidaten.length - 1];
  function botschaftTabelle(d, breite) {
    const vorn = d.ge > d.gk ? "eigenes Produkt vorn" : d.ge < d.gk ? `${d.konkName} vorn` : "Gleichstand";
    const kurzK = d.konkName.replace("Konkurrenzprodukt", "Konkurrenz");
    return passt([`${pkt(d.ge)} zu ${pkt(d.gk)} von 1.000 Punkten – ${vorn}`,
                  `${pkt(d.ge)} zu ${pkt(d.gk)} Punkte – ${vorn.replace("Konkurrenzprodukt", "Konkurrenz")}`,
                  `${pkt(d.ge)} zu ${pkt(d.gk)} Punkte (${kurzK})`], breite);
  }
  function botschaftDiagramm(d, breite) {
    const besser = d.zeilen.filter(z => z.ge > z.gk).map(z => z.name);
    const t = besser.length === 0 ? "Eigenes Produkt bei keinem Kriterium vorn"
      : besser.length === KRIT.length ? "Eigenes Produkt bei allen Kriterien vorn"
      : `Eigenes Produkt vorn bei ${besser.length > 1 ? besser.slice(0, -1).join(", ") + " und " + besser[besser.length - 1] : besser[0]}`;
    return passt([t, `Eigenes Produkt vorn: ${besser.length} von ${KRIT.length} Kriterien`], breite);
  }

  /* ---------- Balkendiagramm gewichtete Punkte (gruppiertes Balkendiagramm) ---------- */
  function diagramm(ziel, d, breite, KOPF, ZH) {
    ziel.textContent = "";
    const n = d.zeilen.length, H = KOPF + n * ZH;
    const svg = sv("svg", { width: breite, height: H, role: "img",
      "aria-label": `Gruppierte Balken je Kriterium: gewichtete Punkte eigenes Produkt und ${d.konkName}` }, ziel);
    const lg = sv("g", { id: "dia-legende" }, svg);
    const eintrag = (x, y, farbe, text) => { sv("rect", { x, y: y - 6, width: 11, height: 11, fill: farbe }, lg);
      sv("text", { x: x + 16, y, dy: "0.35em", class: "muted" }, lg, text); };
    eintrag(0, KOPF - 34, FARBE_EIGEN, "Eigenes Produkt");
    eintrag(0, KOPF - 13, FARBE_KONK, d.konkName);
    sv("line", { x1: 0, x2: breite, y1: KOPF - 0.5, y2: KOPF - 0.5, stroke: "var(--ac)", "stroke-width": 1 }, svg);
    const lw = Math.ceil(Math.max(...d.zeilen.map(z => DK.tw(z.name)))) + 10;
    const vw = Math.ceil(DK.tw("000")) + 8;
    const max = Math.max(...d.zeilen.map(z => Math.max(z.ge, z.gk)), 1);
    const pw = breite - lw - vw, bh = 12, gap = 2;
    d.zeilen.forEach((z, i) => {
      const y = KOPF + i * ZH, blass = S.auswahl != null && S.auswahl !== z.name;
      const g = sv("g", { class: "dk-klick" + (blass ? " dk-blass" : "") }, svg);
      sv("text", { x: lw - 10, y: y + ZH / 2, dy: "0.35em", "text-anchor": "end" }, g, z.name);
      const y0 = y + (ZH - 2 * bh - gap) / 2;
      [[z.ge, FARBE_EIGEN, y0], [z.gk, FARBE_KONK, y0 + bh + gap]].forEach(([v, farbe, yb]) => {
        const w = v / max * pw;
        sv("rect", { x: lw, y: yb, width: w, height: bh, fill: farbe }, g);
        sv("text", { x: lw + w + 4, y: yb + bh / 2, dy: "0.35em" }, g, pkt(v));
      });
      const hit = sv("rect", { x: 0, y, width: breite, height: ZH, fill: "transparent" }, g);
      hit.addEventListener("click", () => auswaehlen(z.name));
      tipp(hit, () => tooltipKrit(z, d));
    });
    sv("line", { x1: lw, x2: lw, y1: KOPF, y2: H, stroke: "#8C8C8C", "stroke-width": 1 }, svg);
  }
  // Tooltip wie in den Bausteinen (DK.tooltip ist nicht exportiert); das Element legt DK.init an
  const tip = document.querySelector(".dk-tooltip");
  function tipp(ziel, zeilenFn) {
    ziel.addEventListener("pointermove", ev => {
      tip.textContent = "";
      zeilenFn().forEach((z, i) => DK.el(i === 0 ? "b" : "div", {}, tip, z));
      tip.style.display = "block";
      const r = tip.getBoundingClientRect();
      let x = ev.clientX + 14, y = ev.clientY + 14;
      if (x + r.width > innerWidth - 8) x = ev.clientX - r.width - 14;
      if (y + r.height > innerHeight - 8) y = ev.clientY - r.height - 14;
      tip.style.left = x + "px"; tip.style.top = y + "px";
    });
    ziel.addEventListener("pointerleave", () => { tip.style.display = "none"; });
  }

  /* ---------- Datenschnitte ---------- */
  DK.schnitt(bFilter, "Vergleich mit", "knoepfe", {
    optionen: KONK.map(k => [k, "Konkurrenz " + k]), wert: S.konk,
    onChange: v => { S.konk = v; zeichnen(); } });
  DK.schnitt(bFilter, "Gewichtung", "dropdown", {
    breite: 190, optionen: Object.entries(GEW).map(([k, g]) => [k, g.name]), wert: S.gew,
    onChange: v => { S.gew = v; zeichnen(); } });

  /* ---------- Zeichnen ---------- */
  function zeichnen() {
    const d = daten();
    let v = DK.visual(bTab, { titel: "Scoring", einheit: "Punkte 0–10, Gewichtung in %",
      botschaft: botschaftTabelle(d, bTab.clientWidth || 430) });
    const zeilen = d.zeilen.map(z => ({ key: z.name, label: z.name, z, werte: z }));
    zeilen.push({ key: "summe", label: "Summe", summe: true, werte: { gew: 100, pe: null, ge: d.ge, pk: null, gk: d.gk } });
    const t = DK.matrix(v.flaeche, { spalten: SPALTEN, zeilen, zeilenhoehe: 32, sortierung: S.sort, onSort: sortieren,
      auswahl: S.auswahl, onClick: auswaehlen, tooltip: zr => tooltipKrit(zr.z, d) });
    // Spaltengruppen (Produkte) über den Spaltenköpfen – wie eine Matrix mit Produkt in den Spalten
    const kopf = t.querySelector("thead"), gr = document.createElement("tr");
    gr.className = "dk-gruppe";
    [["", 2, "leer"], ["Eigenes Produkt", 2, ""], [d.konkName, 2, ""]].forEach(([text, n, cls]) => {
      const th = DK.el("th", { colspan: n, class: cls }, gr, text);
      if (text === "Eigenes Produkt") th.id = "gr-eigen";
    });
    kopf.insertBefore(gr, kopf.firstChild);
    const tr = t.querySelectorAll("tbody tr"), y0 = tr[0].offsetTop;
    const pitch = (tr[tr.length - 2].offsetTop - y0) / (tr.length - 2);
    v = DK.visual(bDia, { titel: "Gewichtete Punkte", botschaft: botschaftDiagramm(d, bDia.clientWidth || 245) });
    diagramm(v.flaeche, d, v.breite, y0, pitch);
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  /* ---------- Lernplattform: Designregeln, Nachbau, Tabellen, CSV ---------- */
  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "v-tabelle", anker: "links", versatz: [400, 21], regel: "SAY – Botschaft vermitteln", titel: "Kernaussage je Visual",
        text: "Unter jedem Titel steht das Ergebnis in einem Satz: wie viele der 1.000 möglichen Punkte beide Produkte erreichen und bei welchen Kriterien das eigene Produkt vorn liegt – berechnet für Wettbewerber und Gewichtung. Das Original hatte nur die Überschrift „Scoring“." },
      { nr: 2, ziel: "gr-eigen", anker: "links", versatz: [13, -4], regel: "STRUCTURE – Inhalte ordnen", titel: "Produkte als Spaltengruppen",
        text: "Wie im Original stehen Punkte und gewichtete Punkte je Produkt nebeneinander unter einer gemeinsamen Überschrift; die Gewichtung steht direkt neben dem Kriterium, weil sie für beide Produkte gilt." },
      { nr: 3, ziel: "sp-pe", anker: "links", versatz: [26, 150], regel: "CHECK – Visuelle Integrität", titel: "Keine Summe der Rohpunkte",
        text: "Das Original summierte auch die ungewichteten Punkte (35 und 39) – eine Zahl ohne Aussage, weil die Kriterien unterschiedlich zählen. Summiert werden nur die gewichteten Punkte; das Maximum ist 1.000 (10 Punkte bei jedem Kriterium)." },
      { nr: 4, ziel: "dia-legende", anker: "links", versatz: [150, -2], regel: "UNIFY – Semantische Notation", titel: "Anthrazit und Grau statt Blau und Rot",
        text: "Das eigene Produkt ist anthrazit, das Konkurrenzprodukt mittelgrau. Das Original nutzte Blau und Rot – Rot ist im Buch ungünstigen Abweichungen vorbehalten und hätte das Konkurrenzprodukt fälschlich als „schlecht“ markiert." },
      { nr: 5, ziel: "v-diagramm", anker: "links", versatz: [215, 160], regel: "SIMPLIFY – Überflüssiges weglassen", titel: "Werte am Balken, Legende oben",
        text: "Die Werte stehen am Balkenende in derselben Schrift wie die Tabelle (im Original in einer Serifenschrift über den Balken verrutscht); Rahmen, Gitter und Achse entfallen, die Legende steht in der Kopfzeile statt rechts neben dem Diagramm." },
      { nr: 6, ziel: "v-diagramm", anker: "links", versatz: [30, 110], regel: "STRUCTURE – Gleiche Reihenfolge", titel: "Zeilen auf gleicher Höhe",
        text: "Tabelle und Diagramm zeigen die Kriterien in derselben Reihenfolge auf derselben Zeilenhöhe. Ein Klick auf eine Zeile oder einen Balken hebt das Kriterium in beiden Visuals hervor; sortiert man die Tabelle, folgt das Diagramm." },
      { nr: 7, ziel: "filter", anker: "links", versatz: [300, 6], regel: "CONDENSE – Filtern statt vervielfachen", titel: "Wettbewerber und Gewichtung als Datenschnitte",
        text: "Eine Scoring-Analyse hängt an der Gewichtung. Mit qualitätsorientierter Gewichtung schrumpft der Abstand zu Konkurrenzprodukt A von 80 auf 10 Punkte, und das eigene Produkt überholt Konkurrenzprodukt C. Wettbewerber B und C sowie die beiden Gewichtungen sind erfunden." },
      { nr: 8, ziel: "v-diagramm", anker: "links", versatz: [215, 60], regel: "EXPRESS – Passende Darstellung", titel: "Balken zeigen den Beitrag",
        text: "Die Balken zeigen gewichtete Punkte, also den Beitrag eines Kriteriums zum Gesamtergebnis – deshalb ist Preis (Gewicht 30 %) am längsten. Beide Balken teilen eine Nulllinie und einen Maßstab." },
    ],
    nachbauIntro: "Standard-Visuals von Power BI Desktop. Seitengröße benutzerdefiniert 727 × 370 px. Schrift Arial: Beschriftungen 10,5 pt, Visualtitel 12 pt. Das Berichtsdesign (JSON) setzt Farben und Schriften. Datenmodell: Tabellen Kriterium (mit den Gewichtungen je Szenario), Produkt und Bewertung (Kriterium, Produkt, Punkte) wie in der CSV-Datei.",
    nachbau: [
      { id: "A", ziel: "v-tabelle", versatz: [0, 0], titel: "Scoring", visual: "Matrix",
        felder: "Zeilen: Kriterium; Spalten: Produkt (eigenes und gewähltes Konkurrenzprodukt); Werte: Measures Punkte und gewichtet; Gewichtung als eigene Spalte über ein Measure",
        format: "Gewichtung in %, Punkte ohne Dezimalstellen; Gesamtsumme nur für „gewichtet“ (Punkte: Measure gibt bei ISINSCOPE(Kriterium) = FALSE leer zurück); Spaltenkopf mit Unterstrich #3A3F44",
        hinweis: "Gewicht = SWITCH(SELECTEDVALUE(Szenario[Szenario]); \"Preisorientiert\"; MAX(Kriterium[Gewicht_Preis]); …), gewichtet = SUMX(Bewertung; Bewertung[Punkte] × [Gewicht])." },
      { id: "B", ziel: "v-diagramm", versatz: [0, 0], titel: "Gewichtete Punkte", visual: "Gruppiertes Balkendiagramm",
        felder: "Y-Achse: Kriterium; X-Achse: Measure gewichtet; Legende: Produkt",
        format: "Farben eigenes Produkt #3A3F44, Konkurrenz #8F8F8F; Datenbeschriftungen an; X-Achse und Gitternetz aus; Legende oben links; Sortierung wie die Tabelle (Kriterium)",
        hinweis: "Interaktion „Hervorheben“ zwischen Matrix und Diagramm." },
      { id: "C", ziel: "filter", anker: "links", versatz: [118, 6], titel: "Datenschnitte", visual: "Datenschnitt (2×)",
        felder: "Konkurrenzprodukt als Kacheln (Einzelauswahl, das eigene Produkt bleibt über das Measure immer sichtbar); Gewichtung über eine getrennte Szenario-Tabelle als Dropdown",
        format: "Ausgewählt #3A3F44 mit weißer Schrift, sonst weiß mit Rahmen #9A9A9A" },
      { id: "D", ziel: "v-tabelle", anker: "links", versatz: [400, 21], titel: "Kernaussagen", visual: "Textfeld mit dynamischem Wert",
        felder: "Text-Measures aus den Summen der gewichteten Punkte und der Liste der Kriterien mit Vorsprung (CONCATENATEX)", format: "10,5 pt, #4D4D4D" },
    ],
    theme: DK.thema(),
    csv: { name: "scoring_daten.csv", text: () => {
      const k = ["Kriterium;Gewichtung_Standard;Gewichtung_Preisorientiert;Gewichtung_Qualitaetsorientiert;" +
                 Object.values(PROD).map(p => "Punkte_" + p.name.replace(/ /g, "_")).join(";")];
      KRIT.forEach((n, i) => k.push([n, ...Object.values(GEW).map(g => g.werte[i]), ...Object.values(PROD).map(p => p.punkte[i])].join(";")));
      return k.join("\r\n"); } },
    tabellen: () => {
      const d = daten();
      return [{ titel: `Scoring – Gewichtung ${GEW[S.gew].name.toLowerCase()}, Vergleich mit ${d.konkName}`,
        kopf: ["Kriterium", "Gewichtung %", "Eigen Punkte", "Eigen gewichtet", "Konkurrenz Punkte", "Konkurrenz gewichtet", "Differenz"],
        zeilen: [...d.zeilen.map(z => [z.name, String(z.gew), String(z.pe), pkt(z.ge), String(z.pk), pkt(z.gk), delta(z.ge - z.gk, 0)]),
                 ["Summe", "100", "", pkt(d.ge), "", pkt(d.gk), delta(d.ge - d.gk, 0)]] }];
    },
  });
  zeichnen();
})();
