/* Einzelvisual „Scoring-Analyse (hier der Bereich Planung)“ (Abb. 4.10). Seite 727 x 446 px = 110 x 67,5 mm.
   Daten: scoring.json (daten_scoring.py) – Analysefelder mit Bewertung von −4 (Worst Practice) über 0 (Durchschnitt)
   bis +4 (Best Practice); Bereich Planung mit den Werten des Originals, Bereich Reporting erfunden.
   Felder mit Teilfeldern (Planungsinhalte, Berichtsinhalte) tragen den Durchschnitt ihrer Teilfelder (Ø, berechnet).
   Statt Punkten vor einer Regenbogenskala Abweichungsbalken vom Durchschnitt auf fester, gleichabständiger Skala,
   gefärbt nach Wirkung (unter dem Durchschnitt rot, darüber blaugrün). Gliederung wie im Original; Schalter
   „Reihenfolge“ sortiert nach Bewertung. Klick hebt ein Feld hervor, Esc hebt auf. Gestaltung wie Abb. 3.27. */
(() => {
  "use strict";
  const { delta, FARBE, sv, el, tw } = DK;
  const [MIN, MAX] = DATA.skala;
  const BER = Object.keys(DATA.bereiche);
  // Zeilen je Bereich: oberste Felder und ihre Teilfelder (Ebene 1)
  const ZEILEN = Object.fromEntries(BER.map(b => [b, DATA.bereiche[b].flatMap(([name, v, teile], i) =>
    [{ key: `${i}`, name, v, ebene: 0, gruppe: teile.length > 0, pos: i },
     ...teile.map(([t, w], j) => ({ key: `${i}.${j}`, name: t, v: w, ebene: 1, eltern: name, pos: i + (j + 1) / 100 }))])]));
  const pkt = v => delta(v, 1);                         // ein Format je Spalte: eine Nachkommastelle
  const pktZeile = r => (r.gruppe ? "Ø" + DK.NBSP : "") + pkt(r.v);

  /* ---------- Zustand ---------- */
  const S = { bereich: BER[0], sort: "gliederung", auswahl: null };
  const auswaehlen = k => { S.auswahl = S.auswahl === k ? null : k; zeichnen(); };
  addEventListener("keydown", e => { if (e.key === "Escape" && S.auswahl != null) { S.auswahl = null; zeichnen(); } });

  /* ---------- Layout ---------- */
  const H = 446;
  DK.init({ titel: "Scoring-Analyse", breite: 727, hoehe: H });
  const bFilter = DK.box("filter", 16, 8, 695, 50, "dk-filter");
  DK.haarlinie(66);
  const bVis = DK.box("v-scoring", 16, 76, 695, H - 84);

  // Tooltip wie in den Bausteinen (DK.tooltip ist nicht exportiert); das Element legt DK.init an
  const tip = document.querySelector(".dk-tooltip");
  function tooltip(ziel, zeilenFn) {
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
  }

  DK.schnitt(bFilter, "Bereich", "knoepfe", { optionen: BER.map(b => [b, b]), wert: S.bereich,
    onChange: v => { S.bereich = v; S.auswahl = null; zeichnen(); } });

  /* ---------- Berechnungen ---------- */
  function zeilen() {
    const z = ZEILEN[S.bereich].slice();
    if (S.sort === "bewertung") {
      // oberste Felder nach Bewertung (schwächstes zuerst), Teilfelder innerhalb ihrer Gruppe ebenso
      const oben = z.filter(r => r.ebene === 0).sort((a, b) => a.v - b.v || a.pos - b.pos);
      return oben.flatMap(o => [o, ...z.filter(r => r.eltern === o.name).sort((a, b) => a.v - b.v || a.pos - b.pos)]);
    }
    return z;
  }
  const lage = v => (v < 0 ? "unter dem Durchschnitt" : v > 0 ? "über dem Durchschnitt" : "im Durchschnitt");
  const liste = n => (n.length > 1 ? n.slice(0, -1).join(", ") + " und " + n[n.length - 1] : n[0]);
  function botschaft(breite) {
    const z = ZEILEN[S.bereich], lo = Math.min(...z.map(r => r.v));
    const schwach = z.filter(r => r.v === lo).map(r => r.name), stark = z.filter(r => r.v > 0).sort((a, b) => b.v - a.v);
    const gleich = stark.length > 1 && stark.every(r => r.v === stark[0].v);
    const st = !stark.length ? "kein Feld über dem Durchschnitt"
      : gleich ? `über dem Durchschnitt: ${liste(stark.map(r => r.name))} (je ${pkt(stark[0].v)})`
      : `über dem Durchschnitt: ${liste(stark.map(r => `${r.name} (${pkt(r.v)})`))}`;
    const kand = [`Größte Schwäche: ${liste(schwach)} (${pkt(lo)}); ${st}`,
                  ...(gleich ? [`${liste(schwach)} am schwächsten (${pkt(lo)}); über dem Durchschnitt nur ${liste(stark.map(r => r.name))}`] : []),
                  `Größte Schwäche: ${liste(schwach)} (${pkt(lo)}); ${stark.length} ${stark.length === 1 ? "Feld" : "Felder"} über dem Durchschnitt`,
                  `Größte Schwäche: ${liste(schwach)} (${pkt(lo)})`];
    return kand.find(t => tw(t) <= breite) || kand[kand.length - 1];
  }

  /* ---------- Profil (Abweichungsbalken auf fester Skala) ---------- */
  const ZH = 27, KOPF = 40;
  const LW = Math.ceil(Math.max(...Object.values(ZEILEN).flat().map(r => r.ebene * 16 + tw(r.name, 14, r.ebene === 0)))) + 16;
  const VW = Math.ceil(tw("Ø" + DK.NBSP + "−0,0")) + 18;
  function profil(ziel, breite, rows) {
    ziel.textContent = "";
    const h = KOPF + rows.length * ZH;
    const svg = sv("svg", { width: breite, height: h, role: "img", "aria-label": `Scoring-Analyse ${S.bereich}: Bewertung je Analysefeld von −4 bis +4` }, ziel);
    const x0 = LW + VW + 28, x1 = breite - 14;
    const X = v => x0 + (v - MIN) / (MAX - MIN) * (x1 - x0);
    // Kopf: Spaltentitel, Pole der Skala, Teilstriche
    sv("text", { x: 0, y: KOPF - 8, class: "muted", id: "sp-feld" }, svg, "Analysefeld");
    sv("text", { x: LW + VW, y: KOPF - 8, class: "muted", "text-anchor": "end", id: "sp-wert" }, svg, "Bewertung");
    const pole = sv("g", { id: "sc-pole" }, svg);
    sv("text", { x: X(MIN) - 6, y: 12, style: "font-weight:bold" }, pole, "Worst Practice");
    sv("text", { x: X(0), y: 12, "text-anchor": "middle", style: "font-weight:bold", id: "sc-durchschnitt" }, pole, "Durchschnitt");
    sv("text", { x: X(MAX) + 6, y: 12, "text-anchor": "end", style: "font-weight:bold" }, pole, "Best Practice");
    const skala = sv("g", { id: "sc-skala" }, svg);
    for (let v = MIN; v <= MAX; v++) {
      sv("text", { x: X(v), y: KOPF - 8, "text-anchor": "middle", class: "muted" }, skala, v === 0 ? "0" : delta(v, 0));
      if (v !== 0) sv("line", { x1: Math.round(X(v)) + 0.5, x2: Math.round(X(v)) + 0.5, y1: KOPF, y2: h, stroke: "#E3E3E3", "stroke-width": 1 }, svg);
    }
    sv("line", { x1: 0, x2: breite, y1: KOPF - 0.5, y2: KOPF - 0.5, stroke: "#3A3F44", "stroke-width": 1 }, svg);
    rows.forEach((r, i) => {
      const y = KOPF + i * ZH, cy = y + ZH / 2;
      if (i > 0) sv("line", { x1: 0, x2: breite, y1: y - 0.5, y2: y - 0.5, stroke: r.ebene === 0 ? "#C9C9C9" : "#EFEFEF", "stroke-width": 1 }, svg);
      const sel = S.auswahl != null && rows.find(q => q.key === S.auswahl);
      const blass = sel && !(r.key === sel.key || r.eltern === sel.name);      // Auswahl: Feld und seine Teilfelder
      const g = sv("g", { class: "dk-klick" + (blass ? " dk-blass" : ""), id: "z-" + r.key.replace(".", "-") }, svg);
      sv("text", { x: r.ebene * 16, y: cy, dy: "0.35em", style: r.ebene === 0 ? "font-weight:bold" : "" }, g, r.name);
      const kl = r.v < 0 ? "schlecht" : r.v > 0 ? "gut" : "neutral";
      sv("text", { x: LW + VW, y: cy, dy: "0.35em", "text-anchor": "end", style: kl === "neutral" ? "" : `fill:${FARBE[kl]}` }, g, pktZeile(r));
      if (r.v !== 0) {
        const a = X(Math.min(0, r.v)), b = X(Math.max(0, r.v));
        sv("rect", { x: a, y: cy - 7, width: b - a, height: 14, fill: FARBE[kl] }, g);
      }
      const hit = sv("rect", { x: 0, y, width: breite, height: ZH, fill: "transparent" }, g);
      hit.addEventListener("click", () => auswaehlen(r.key));
      tooltip(hit, () => [r.name, ...(r.eltern ? [`Teil von: ${r.eltern}`] : []), `Bewertung: ${pkt(r.v)} – ${lage(r.v)}`,
        `Abstand zur Best Practice: ${DK.zahl(MAX - r.v, 1)} Punkte`, `Abstand zur Worst Practice: ${DK.zahl(r.v - MIN, 1)} Punkte`,
        ...(r.gruppe ? [`Durchschnitt der ${ZEILEN[S.bereich].filter(q => q.eltern === r.name).length} Teilfelder`] : []), "Klick hebt hervor"]);
    });
    // Nulllinie = Durchschnitt
    sv("line", { x1: Math.round(X(0)) + 0.5, x2: Math.round(X(0)) + 0.5, y1: KOPF - 4, y2: h, stroke: "#3A3F44", "stroke-width": 1.5 }, svg);
  }

  /* ---------- Zeichnen ---------- */
  function zeichnen() {
    const v = DK.visual(bVis, { titel: `Scoring-Analyse ${S.bereich}`, einheit: "Punkte von −4 bis +4",
      botschaft: botschaft(695),
      schalter: { optionen: [["gliederung", "Gliederung"], ["bewertung", "nach Bewertung"]], wert: S.sort,
                  onChange: w => { S.sort = w; zeichnen(); } } });
    profil(v.flaeche, v.breite, zeilen());
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "v-scoring", anker: "links", versatz: [392, 3], regel: "SAY – Botschaft vermitteln", titel: "Kernaussage unter dem Titel",
        text: "Unter dem Titel steht, wo der Bereich am weitesten hinter dem Durchschnitt liegt und welche Felder darüber liegen – berechnet für den gewählten Bereich. Das Original hatte nur die Überschrift „Analysefelder“." },
      { nr: 2, ziel: "sc-pole", anker: "links", versatz: [0, -2], regel: "UNIFY – Semantische Notation", titel: "Farbe nach Wirkung statt Regenbogen",
        text: "Felder unter dem Durchschnitt sind rot, darüber blaugrün, durchschnittliche ohne Balken. Der Regenbogen des Originals hatte keine lesbare Richtung: Beide Enden waren violett, Rot lag bei −3, Grün bei 0, Blau bei +2 – und in Graustufen war er nicht zu unterscheiden." },
      { nr: 3, ziel: "sc-skala", anker: "links", versatz: [452, 0], regel: "CHECK – Visuelle Integrität", titel: "Gleichabständige Skala",
        text: "Die Skala von −4 bis +4 hat gleiche Abstände und bleibt fest, auch wenn kein Feld die Pole erreicht – so bleibt der Abstand zur Best Practice sichtbar. Im Original waren die Abstände um 0 enger, „+4“ war in eine zweite Zeile gerutscht und „⌀“ nicht erklärt." },
      { nr: 4, ziel: "z-1", anker: "links", versatz: [520, 2], regel: "EXPRESS – Passende Darstellung", titel: "Abweichungsbalken statt Punkte",
        text: "Jedes Feld ist ein Balken von der Durchschnittslinie aus; seine Länge zeigt den Abstand zum Durchschnitt, die Zahl daneben den Wert. Die weißen Punkte des Originals vor dem Farbverlauf ließen sich nur über die Lage im Verlauf ablesen." },
      { nr: 5, ziel: "sp-wert", anker: "links", versatz: [0, -2], regel: "CONDENSE – Informationsdichte", titel: "Wert als Zahl",
        text: "Die Bewertung steht als Zahl mit Vorzeichen neben dem Feld, ±0,0 für durchschnittlich, einheitlich mit einer Nachkommastelle. Felder mit Teilfeldern tragen den Durchschnitt ihrer Teilfelder (Ø); im Original passte die Gesamtbewertung der Planungsinhalte (−1) nicht zum Mittelwert der Teilpläne. Der Tooltip nennt den Abstand zur Best und zur Worst Practice." },
      { nr: 6, ziel: "sp-feld", versatz: [26, -24], regel: "STRUCTURE – Inhalte ordnen", titel: "Gliederung wie im Original",
        text: "Die Planungsinhalte mit ihren Teilplänen stehen eingerückt oben, darauf folgen Prozesse, Organisation und IT-Unterstützung. Der Schalter „nach Bewertung“ stellt die schwächsten Felder nach oben; die Gliederung bleibt erhalten. „…“ heißt jetzt „weitere Teilpläne“." },
      { nr: 7, ziel: "filter", anker: "links", versatz: [196, 6], regel: "SIMPLIFY – Filtern statt vervielfachen", titel: "Bereich als Datenschnitt",
        text: "Die Abbildung zeigt den Bereich Planung; der Datenschnitt wechselt zum Reporting mit demselben Aufbau (erfundene Werte). Aufzählungszeichen, Unterstreichung und Farbverlauf des Originals entfallen." },
    ],
    nachbauIntro: "Standard-Visuals von Power BI Desktop. Seitengröße benutzerdefiniert 727 × 446 px. Schrift Arial: Beschriftungen 10,5 pt, Visualtitel 12 pt. Datenmodell: Tabelle Bewertung (Bereich, Gruppe, Analysefeld, Bewertung, Sortierung) wie in der CSV-Datei.",
    nachbau: [
      { id: "A", ziel: "sp-feld", versatz: [26, -2], titel: "Profil", visual: "Matrix, Layout „Abgestuft“",
        felder: "Zeilen: Gruppe, Analysefeld (Hierarchie; Gruppen ohne Teilfelder über leere Gruppe auf oberster Ebene); Werte: Bewertung (Summe) zweimal – als Zahl und als Datenbalken",
        format: "Zahlenformat +0,0;−0,0;±0,0; zweite Spalte nur Datenbalken (bedingte Formatierung): Minimum −4, Maximum 4, Achse Mitte, positiv #00806B, negativ #C62828, Achsenfarbe #3A3F44; Zeilenhöhe 20 px",
        hinweis: "Die Bewertung einer Gruppe ist der Durchschnitt ihrer Teilfelder: Measure Bewertung = AVERAGE(Bewertung[Bewertung]) liefert auf Gruppenebene automatisch den Mittelwert; Gruppen ohne Teilfelder zeigen ihren eigenen Wert." },
      { id: "B", ziel: "sc-pole", anker: "links", versatz: [0, -2], titel: "Pole der Skala", visual: "Textfelder über der Datenbalkenspalte",
        felder: "„Worst Practice“ links, „Durchschnitt“ mittig, „Best Practice“ rechts; Teilstriche −4 bis +4 als Textfeld", format: "10,5 pt fett bzw. #4D4D4D" },
      { id: "C", ziel: "filter", anker: "links", versatz: [196, 6], titel: "Datenschnitt Bereich", visual: "Datenschnitt (Stil Kacheln, Einzelauswahl)",
        felder: "Bereich", format: "Ausgewählt #3A3F44 mit weißer Schrift, sonst weiß mit Rahmen #9A9A9A" },
      { id: "D", ziel: "v-scoring", anker: "links", versatz: [392, 3], titel: "Kernaussage", visual: "Textfeld mit dynamischem Wert",
        felder: "Text-Measure aus MINX über die Analysefelder (schwächstes Feld) und CONCATENATEX der Felder mit Bewertung > 0",
        format: "10,5 pt, #4D4D4D",
        hinweis: "Der Schalter „Reihenfolge“ entspricht der Sortierung der Matrix nach der Spalte Bewertung (Klick auf den Spaltenkopf)." },
    ],
    theme: DK.thema(),
    csv: { name: "scoring_analyse_daten.csv", text: () => ["Bereich;Gruppe;Analysefeld;Bewertung;Abstand_Best_Practice",
      ...BER.flatMap(b => ZEILEN[b].map(r => [b, r.eltern || "", r.name, String(r.v).replace(".", ","), String(Math.round((MAX - r.v) * 100) / 100).replace(".", ",")].join(";")))].join("\r\n") },
    tabellen: () => [{ titel: `Scoring-Analyse ${S.bereich} (Skala −4 bis +4)`, kopf: ["Analysefeld", "Bewertung", "Lage", "Abstand zur Best Practice"],
      zeilen: zeilen().map(r => [(r.ebene ? "  " : "") + r.name, pktZeile(r), lage(r.v), DK.zahl(MAX - r.v, 1)]) }],
  });
  zeichnen();
})();
