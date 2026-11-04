/* Einzelvisual „(Spinnen-)Netzdiagramm“ (Abb. 3.68): Balanced Scorecard eines Immobilienmanagements mit 23 Kennzahlen
   in fünf Perspektiven, vier Reihen (Ist 2025, Plan 2026, Ist 2026, Plan 2027).
   Seite 727 x 560 px = 110 x 84,7 mm. Daten: netz.json (daten_netz.py), Werte in Anlehnung an das Original.
   Diagrammtyp bleibt: Netzdiagramm mit Achsen im Uhrzeigersinn wie im Original, Perspektiven als Sektoren. Reihen nach
   IBCS-Logik: Ist kräftig, Plan dünn, Vorjahr hellgrau, Folgeplan gestrichelt; ein Index mit „außen = günstiger“.
   Schalter „Netz | Punkte“ zeigt dieselben Daten als Punktdiagramm (die bessere Alternative für genaue Vergleiche).
   Klick auf eine Kennzahl hebt sie hervor, Klick auf einen Legendeneintrag hebt die Reihe hervor. */
(() => {
  "use strict";
  const { zahl, delta, sv, el, FARBE } = DK;
  const RN = DATA.reihen, PE = DATA.perspektiven, MAX = DATA.skala, BJ = DATA.basisjahr;
  const K = DATA.kennzahlen.map(([p, roh, sinkt, w], i) => ({
    i, p, sinkt: !!sinkt, w, zeilen: roh.replace("~|", "-|").split("|"), name: roh.replace("~|", "").replace("|", " ") }));
  const N = K.length, VJ = 0, PL = 1, IST = 2, FP = 3;
  const STIL = [
    { stroke: "#C9C9C9", "stroke-width": 2.5 },                                   // Ist 2025 (Vorjahr)
    { stroke: "#3A3F44", "stroke-width": 1.2 },                                   // Plan 2026
    { stroke: "#3A3F44", "stroke-width": 3 },                                     // Ist 2026
    { stroke: "#6E747A", "stroke-width": 1.5, "stroke-dasharray": "5 3" },        // Plan 2027
  ];
  const ZEICHENFOLGE = [VJ, PL, FP, IST];
  const dpl = k => k.w[IST] - k.w[PL];
  const mittel = r => K.reduce((s, k) => s + k.w[r], 0) / N;
  const S = { ansicht: "netz", auswahl: null, reihe: null };
  const auswaehlen = i => { S.auswahl = S.auswahl === i ? null : i; S.reihe = null; zeichnen(); };
  const reiheWaehlen = r => { S.reihe = S.reihe === r ? null : r; S.auswahl = null; zeichnen(); };
  addEventListener("keydown", e => {
    if (e.key === "Escape" && (S.auswahl !== null || S.reihe !== null)) { S.auswahl = null; S.reihe = null; zeichnen(); }
  });

  DK.init({ titel: "Netzdiagramm", breite: 727, hoehe: 560 });
  const bVis = DK.box("v-netz", 16, 10, 695, 542);

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
  const tipKennzahl = k => [`${k.name} (${PE[k.p]})`, ...RN.map((r, j) => `${r}: ${zahl(k.w[j])}`),
    `Ist 2026 zu Plan 2026: ${delta(dpl(k), 0)} Indexpunkte`,
    k.sinkt ? "Rohwert soll sinken – Index umgekehrt (außen = günstiger)" : "Rohwert soll steigen (außen = günstiger)",
    "Klick hebt die Kennzahl hervor"];

  function botschaft(b) {
    const passt = x => x.find(t => DK.tw(t) <= b) || x[x.length - 1];
    if (S.auswahl !== null) {
      const k = K[S.auswahl];
      return passt([`${k.name}: Ist 2026 ${zahl(k.w[IST])} bei Plan ${zahl(k.w[PL])} (${delta(dpl(k), 0)}), Vorjahr ${zahl(k.w[VJ])}, Plan 2027 ${zahl(k.w[FP])}`,
        `${k.name}: Ist 2026 ${zahl(k.w[IST])} bei Plan ${zahl(k.w[PL])} (${delta(dpl(k), 0)})`]);
    }
    if (S.reihe !== null) {
      const r = S.reihe, ueber = K.filter(k => k.w[r] > 100).length;
      return passt([`${RN[r]}: im Mittel ${zahl(mittel(r))} Indexpunkte, über dem Basisjahr ${BJ} bei ${ueber} von ${N} Kennzahlen`]);
    }
    const unter = K.filter(k => dpl(k) < 0), luecken = unter.slice().sort((a, c) => dpl(a) - dpl(c));
    const pm = PE.map((p, j) => { const ks = K.filter(k => k.p === j); return ks.reduce((s, k) => s + dpl(k), 0) / ks.length; });
    const schwach = PE[pm.indexOf(Math.min(...pm))];
    const top = luecken.slice(0, 2).map(k => `${k.name} ${delta(dpl(k), 0)}`).join(", ");
    return passt([`Ist 2026 unter Plan bei ${unter.length} von ${N} Kennzahlen; größte Lücken bei ${schwach}: ${top}`,
      `Ist 2026 unter Plan bei ${unter.length} von ${N} Kennzahlen; größte Lücken in der Perspektive ${schwach}`]);
  }

  /* ---------- Legende (klickbar) ---------- */
  function legende(svg, breite, punkte = false) {
    const gl = sv("g", { id: "nz-legende" }, svg);
    const folge = [IST, PL, VJ, FP];
    const lb = punkte ? 16 : 30;
    let x = breite - folge.reduce((s, r) => s + lb + DK.tw(RN[r]) + 16, 0) + 16;
    folge.forEach(r => {
      const blass = S.reihe !== null && S.reihe !== r;
      const g = sv("g", { class: "dk-klick" + (blass ? " dk-blass" : "") }, gl);
      if (!punkte) sv("line", { x1: x, x2: x + 24, y1: 9, y2: 9, ...STIL[r] }, g);
      else if (r === FP) sv("line", { x1: x + 5, x2: x + 5, y1: 3, y2: 15, stroke: "#6E747A", "stroke-width": 2 }, g);
      else sv("circle", { cx: x + 5, cy: 9, r: r === VJ ? 3.5 : 4.5, fill: r === IST ? "#3A3F44" : r === PL ? "#FFFFFF" : "#C9C9C9",
        stroke: r === PL ? "#3A3F44" : "none", "stroke-width": 1.5 }, g);
      sv("text", { x: x + lb, y: 9, dy: "0.35em", class: "muted" }, g, RN[r]);
      const w = lb + DK.tw(RN[r]);
      const hit = sv("rect", { x: x - 4, y: -2, width: w + 8, height: 22, fill: "transparent" }, g);
      hit.addEventListener("click", () => reiheWaehlen(r));
      tooltip(hit, () => [RN[r], `Mittelwert ${zahl(mittel(r))} Indexpunkte`, "Klick hebt die Reihe hervor"]);
      x += w + 16;
    });
    sv("text", { x: 0, y: 9, dy: "0.35em", class: "muted" }, svg, "außen = günstiger");
  }

  /* ---------- Netz ---------- */
  function netz(ziel, breite, hoehe) {
    ziel.textContent = "";
    const svg = sv("svg", { width: breite, height: hoehe, role: "img",
      "aria-label": `Netzdiagramm Balanced Scorecard: ${N} Kennzahlen in ${PE.length} Perspektiven, vier Reihen` }, ziel);
    const R = 186, cx = breite / 2, cy = 56 + R, D = 2 * Math.PI / N;
    const wk = i => -Math.PI / 2 + i * D;                                  // Winkel der Achse i (oben beginnend, im Uhrzeigersinn)
    const pt = (i, v, r = R) => [cx + Math.cos(wk(i)) * v / MAX * r, cy + Math.sin(wk(i)) * v / MAX * r];
    const bogen = (a0, a1, r) => `M${cx},${cy} L${cx + Math.cos(a0) * r},${cy + Math.sin(a0) * r} A${r},${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${cx + Math.cos(a1) * r},${cy + Math.sin(a1) * r} Z`;

    // Perspektiven als Sektoren (abwechselnd getönt) mit Trennlinien
    const gp = sv("g", { id: "nz-perspektiven" }, svg);
    const TON = ["#F3F3F3", "#FFFFFF", "#F3F3F3", "#FFFFFF", "#E6E6E6"];
    PE.forEach((p, j) => {
      // Sektor als Ausschnitt des äußeren Netzes (Ring 160): Mitte der Kante vor der ersten bis nach der letzten Achse
      const ks = K.filter(k => k.p === j), i0 = ks[0].i, i1 = ks[ks.length - 1].i;
      const mitteKante = (a, c) => pt(a, MAX).map((v, z) => (v + pt(c, MAX)[z]) / 2);
      const m0 = mitteKante((i0 - 1 + N) % N, i0), m1 = mitteKante(i1, (i1 + 1) % N);
      const ecken = [[cx, cy], m0, ...ks.map(k => pt(k.i, MAX)), m1];
      sv("path", { d: ecken.map((q, z) => `${z ? "L" : "M"}${q[0].toFixed(1)},${q[1].toFixed(1)}`).join(" ") + "Z", fill: TON[j] }, gp);
      sv("line", { x1: cx, y1: cy, x2: m0[0], y2: m0[1], stroke: "#9A9A9A", "stroke-width": 1 }, gp);
    });
    // Ringe (Netz) und Speichen
    const gr = sv("g", { id: "nz-ringe" }, svg);
    [50, 150, MAX].forEach(v => sv("path", { d: K.map((k, i) => `${i ? "L" : "M"}${pt(i, v).join(",")}`).join(" ") + "Z", fill: "none", stroke: "#CFCFCF", "stroke-width": 1 }, gr));
    sv("path", { id: "nz-basis", d: K.map((k, i) => `${i ? "L" : "M"}${pt(i, 100).join(",")}`).join(" ") + "Z", fill: "none", stroke: "#8C8C8C", "stroke-width": 1, "stroke-dasharray": "2 2" }, gr);
    K.forEach((k, i) => sv("line", { x1: cx, y1: cy, x2: pt(i, MAX)[0], y2: pt(i, MAX)[1], stroke: S.auswahl === i ? "#3A3F44" : "#D6D6D6", "stroke-width": S.auswahl === i ? 1.5 : 1 }, gr));

    // Reihen als geschlossene Polygone
    const gs = sv("g", { id: "nz-reihen" }, svg);
    ZEICHENFOLGE.forEach(r => {
      sv("path", { id: `nz-reihe-${r}`, d: K.map((k, i) => `${i ? "L" : "M"}${pt(i, k.w[r]).map(v => v.toFixed(1)).join(",")}`).join(" ") + "Z",
        fill: "none", "stroke-linejoin": "round", ...STIL[r], class: S.reihe !== null && S.reihe !== r ? "dk-blass" : "" }, gs);
    });
    if (S.auswahl !== null) {
      const i = S.auswahl;
      ZEICHENFOLGE.forEach(r => {
        const [x, y] = pt(i, K[i].w[r]);
        sv("circle", { cx: x, cy: y, r: r === IST ? 4.5 : 3.5, fill: r === PL ? "#FFFFFF" : STIL[r].stroke, stroke: STIL[r].stroke, "stroke-width": 1.5 }, gs);
      });
    }
    // Skalenbeschriftung auf der Grenze zwischen Kunden und Finanzen
    const gskala = sv("g", { id: "nz-skala" }, svg);
    [50, 100, 150].forEach(v => {
      const a = -Math.PI / 2 - D / 2, x = cx + Math.cos(a) * v / MAX * R, y = cy + Math.sin(a) * v / MAX * R;
      sv("text", { x: x - 4, y, dy: "0.35em", "text-anchor": "end", class: "muted",
        style: "paint-order:stroke;stroke:#FFFFFF;stroke-width:3px;stroke-linejoin:round" }, gskala, zahl(v));
    });

    // Achsenbeschriftung, Klickflächen
    const gk = sv("g", { id: "nz-kennzahlen" }, svg);
    K.forEach((k, i) => {
      const blass = S.auswahl !== null && S.auswahl !== i;
      const g = sv("g", { class: "dk-klick" + (blass ? " dk-blass" : ""), "data-name": k.name }, gk);
      const a = wk(i), c = Math.cos(a), s = Math.sin(a), rl = R + 12;
      const anker = Math.abs(c) < 0.05 ? "middle" : c > 0 ? "start" : "end";
      const x = cx + c * rl, y0 = cy + s * rl + s * 6, n = k.zeilen.length;
      k.zeilen.forEach((z, l) => {
        const at = { x, y: y0 + (l - (n - 1) / 2) * 16, dy: "0.35em", "text-anchor": anker, style: S.auswahl === i ? "font-weight:bold" : "" };
        if (l === 0) at.id = `nz-label-${i}`;
        sv("text", at, g, z);
      });
      const hit = sv("path", { d: bogen(a - D / 2, a + D / 2, R + 14), fill: "transparent" }, g);
      hit.addEventListener("click", () => auswaehlen(i));
      tooltip(hit, () => tipKennzahl(k));
    });

    // Perspektivennamen in den freien Ecken bzw. Seiten
    const gn = sv("g", { id: "nz-namen" }, svg);
    const PLATZ = { Kunden: [0, 40, "start"], Finanzen: [breite, 40, "end"], Prozesse: [breite, cy + 96, "end"],
      Assets: [cx, cy + R + 52, "middle"], Mitarbeiter: [0, cy + 96, "start"] };
    PE.forEach(p => sv("text", { x: PLATZ[p][0], y: PLATZ[p][1], dy: "0.35em", "text-anchor": PLATZ[p][2],
      style: "font-weight:bold;fill:#4D4D4D" }, gn, p));
    legende(svg, breite);
  }

  /* ---------- Punkte (Alternative) ---------- */
  function punkte(ziel, breite, hoehe) {
    ziel.textContent = "";
    const svg = sv("svg", { width: breite, height: hoehe, role: "img", "aria-label": `Punktdiagramm Balanced Scorecard: ${N} Kennzahlen, vier Reihen` }, ziel);
    legende(svg, breite, true);
    const pw = 92, lw = 238, dw = 66, x0 = pw + lw, x1 = breite - dw - 14, oben = 52, rh = 18.4, gap = 5;
    const MIN = 40, sx = v => x0 + (v - MIN) / (MAX - MIN) * (x1 - x0);
    const gg = sv("g", { id: "nz-raster" }, svg);
    [50, 100, 150].forEach(v => {
      sv("text", { x: sx(v), y: oben - 14, dy: "0.35em", "text-anchor": "middle", class: "muted" }, gg, zahl(v));
    });
    sv("text", { x: breite, y: oben - 14, dy: "0.35em", "text-anchor": "end", class: "muted" }, gg, "ΔPL");
    sv("line", { x1: 0, x2: breite, y1: oben - 3.5, y2: oben - 3.5, stroke: "#3A3F44", "stroke-width": 1 }, gg);
    let y = oben;
    const zeilenY = [];
    PE.forEach((p, j) => {
      const ks = K.filter(k => k.p === j);
      if (j) y += gap;
      sv("text", { x: 0, y: y + rh / 2, dy: "0.35em", style: "font-weight:bold;fill:#4D4D4D" }, gg, p);
      ks.forEach(k => { zeilenY[k.i] = y; y += rh; });
      sv("line", { x1: 0, x2: breite, y1: y - 0.5 + gap / 2, y2: y - 0.5 + gap / 2, stroke: "#D9D9D9", "stroke-width": 1 }, gg);
    });
    const yEnde = y;
    [50, 150].forEach(v => sv("line", { x1: sx(v), x2: sx(v), y1: oben - 2, y2: yEnde, stroke: "#E3E3E3", "stroke-width": 1 }, gg));
    sv("line", { x1: sx(100), x2: sx(100), y1: oben - 2, y2: yEnde, stroke: "#8C8C8C", "stroke-width": 1, "stroke-dasharray": "2 2" }, gg);
    const gz = sv("g", { id: "nz-punkte" }, svg), gd = sv("g", { id: "nz-dpl" }, svg);
    K.forEach(k => {
      const yc = zeilenY[k.i] + rh / 2, blass = S.auswahl !== null && S.auswahl !== k.i;
      const g = sv("g", { class: "dk-klick" + (blass ? " dk-blass" : "") }, gz);
      sv("text", { x: pw, y: yc, dy: "0.35em" }, g, k.name);
      const d = dpl(k), kl = d > 0 ? "gut" : d < 0 ? "schlecht" : "neutral";
      const rb = r => (S.reihe !== null && S.reihe !== r ? "dk-blass" : "");
      sv("line", { x1: sx(k.w[PL]), x2: sx(k.w[IST]), y1: yc, y2: yc, stroke: FARBE[kl], "stroke-width": 2.5 }, g);
      sv("circle", { cx: sx(k.w[VJ]), cy: yc, r: 3.5, fill: "#C9C9C9", class: rb(VJ) }, g);
      sv("line", { x1: sx(k.w[FP]), x2: sx(k.w[FP]), y1: yc - 6, y2: yc + 6, stroke: "#6E747A", "stroke-width": 2, class: rb(FP) }, g);
      sv("circle", { cx: sx(k.w[PL]), cy: yc, r: 4.5, fill: "#FFFFFF", stroke: "#3A3F44", "stroke-width": 1.5, class: rb(PL) }, g);
      sv("circle", { cx: sx(k.w[IST]), cy: yc, r: 4.5, fill: "#3A3F44", class: rb(IST) }, g);
      sv("text", { x: breite, y: yc, dy: "0.35em", "text-anchor": "end", class: blass ? "dk-blass" : "", style: `font-weight:bold;fill:${FARBE[kl]}` }, gd, delta(d, 0));
      const hit = sv("rect", { x: 0, y: zeilenY[k.i], width: breite, height: rh, fill: "transparent" }, g);
      hit.addEventListener("click", () => auswaehlen(k.i));
      tooltip(hit, () => tipKennzahl(k));
    });
    sv("text", { x: 0, y: oben - 14, dy: "0.35em", class: "muted" }, gg, "Linie Plan → Ist nach Wirkung");
  }

  function zeichnen() {
    const v = DK.visual(bVis, { titel: "Balanced Scorecard Immobilienmanagement", einheit: `Index ${BJ} = 100`, botschaft: botschaft(695),
      schalter: { optionen: [["netz", "Netz"], ["punkte", "Punkte"]], wert: S.ansicht,
        onChange: w => { S.ansicht = w; zeichnen(); } } });
    bVis.querySelector(".dk-titelzeile .dk-knoepfe").id = "nz-ansicht";
    (S.ansicht === "netz" ? netz : punkte)(v.flaeche, v.breite, v.hoehe);
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "v-netz", anker: "links", versatz: [690, 26], regel: "SAY – Botschaft vermitteln", titel: "Kernaussage unter dem Titel",
        text: "Unter dem Titel steht, wie viele Kennzahlen das Ist 2026 unter Plan liegen und wo die größten Lücken sind – aus den Daten berechnet. Das Original hatte nur den Titel „Balanced Scorecard REM“." },
      { nr: 2, ziel: "nz-legende", anker: "links", versatz: [-4, 4], regel: "UNIFY – Semantische Notation", titel: "Reihen nach Szenario",
        text: "Ist 2026 ist eine kräftige anthrazitfarbene Linie, Plan 2026 eine dünne, das Vorjahr hellgrau, der Folgeplan 2027 gestrichelt. Das Original zeichnete Pläne durchgezogen und Ist gestrichelt – umgekehrt zur üblichen Notation – und unterschied die Jahre nur durch Grautöne." },
      { nr: 3, ziel: "nz-label-0", anker: "links", versatz: [-40, 76], regel: "CHECK – Einheitliche Richtung", titel: "Ein Index, außen = günstiger",
        text: "Alle Kennzahlen sind als Index auf das Basisjahr 2024 = 100 bezogen; Kennzahlen, deren Rohwert sinken soll (Beschwerden, Krankheits-, Fluktuations-, Leerstandsquote, Kosten, Reklamationszeit), sind umgekehrt. Nur so bedeutet „weiter außen“ überall „besser“. Im Original war die Skala 0–160 nicht erklärt, und Kennzahlen mit gegenläufiger Richtung standen nebeneinander." },
      { nr: 4, ziel: "nz-reihe-2", anker: "links", versatz: [60, 150], regel: "CHECK – Grenzen des Diagrammtyps", titel: "Fläche und Reihenfolge täuschen",
        text: "Die Fläche eines Netzes wächst mit dem Quadrat der Werte und hängt von der Reihenfolge der Achsen ab: Dieselben Werte in anderer Anordnung ergeben eine andere Form und Fläche. Schwache Kennzahlen (hier Verbesserungsvorschläge und MA-Zufriedenheit) fallen als Zacke auf; genaue Vergleiche zwischen nicht benachbarten Achsen sind aber kaum möglich. Mehr als 6–8 Achsen und mehr als zwei Reihen überfordern das Auge." },
      { nr: 5, ziel: "nz-ansicht", anker: "links", versatz: [-4, -2], regel: "STRUCTURE – Bessere Alternative", titel: "Punkte statt Netz",
        text: "Der Schalter „Punkte“ zeigt dieselben Daten als Punktdiagramm: Kennzahlen untereinander, nach Perspektive gruppiert, ein gemeinsamer Maßstab, Plan-Ist-Abweichung als Verbindungslinie nach Wirkung und als Zahl. Für die Lehre bleibt das Netz die Hauptansicht, für den Bericht ist die Punkt- oder Balkendarstellung vorzuziehen." },
      { nr: 6, ziel: "nz-namen", anker: "links", versatz: [90, 0], regel: "SIMPLIFY – Entfärben", titel: "Perspektiven als Grautöne",
        text: "Die Perspektiven sind als Sektoren in hellen Grautönen mit Trennlinien hinterlegt, ihre Namen stehen außen. Das Original nutzte fünf Pastellfarben, die nichts bedeuteten und im Schwarz-Weiß-Druck verschwanden; Ringe sind auf 50, 100 (gestrichelt, Basisjahr) und 150 reduziert." },
      { nr: 7, ziel: "nz-label-17", anker: "links", versatz: [-8, -2], regel: "CONDENSE – Interaktion", titel: "Klick auf Kennzahl oder Reihe",
        text: "Ein Klick auf eine Kennzahl hebt ihre Achse hervor, markiert die vier Werte und nennt sie in der Aussage; ein Klick auf einen Legendeneintrag hebt die Reihe hervor. Esc hebt die Auswahl auf." },
    ],
    nachbauIntro: "Seitengröße benutzerdefiniert 727 × 560 px. Schrift Arial: Beschriftungen 10,5 pt, Titel 12 pt. Datenmodell: Tabelle Scorecard (Nr, Perspektive, Kennzahl, Reihe, Index) wie in der CSV-Datei.",
    nachbau: [
      { id: "A", ziel: "nz-reihen", versatz: [-40, 40], titel: "Netzdiagramm", visual: "Kein Standardvisual – zertifiziertes Visual „Radar Chart“ (AppSource)",
        felder: "Kategorie: Kennzahl (sortiert nach Nr); Y-Achse: Index je Reihe (Measures Ist 2025, Plan 2026, Ist 2026, Plan 2027 mit CALCULATE(SUM(Scorecard[Index]), Scorecard[Reihe] = \"…\"))",
        format: "Linien: Ist 2026 #3A3F44 3 px, Plan 2026 #3A3F44 1 px, Ist 2025 #C9C9C9, Plan 2027 #6E747A; Achse 0 bis 160",
        hinweis: "Sektoren für Perspektiven, gestrichelte Linien und die Basislinie 100 bietet das Visual nicht; Perspektive dann als Kennzahlenpräfix oder per Datenschnitt." },
      { id: "B", ziel: "nz-ansicht", anker: "links", versatz: [-4, -2], titel: "Alternative mit Standardvisuals", visual: "Gruppiertes Balkendiagramm mit kleinen Vielfachen (Small Multiples)",
        felder: "Y-Achse: Kennzahl; X-Achse: Ist 2026, Plan 2026; Kleine Vielfache: Perspektive",
        format: "Ist #3A3F44, Plan Füllung weiß mit Rahmen #3A3F44; Konstante Linie X = 100 gestrichelt #8C8C8C; daneben Tabelle mit ΔPL = [Ist 2026] − [Plan 2026], Schriftfarbe > 0 #00806B, < 0 #C62828",
        hinweis: "Die Punktansicht der Lernplattform entspricht dem; Punkte statt Balken sind zulässig, weil die Achse bei 40 beginnt (Lagen statt Längen)." },
    ],
    theme: DK.thema(),
    csv: { name: "netzdiagramm_daten.csv", text: () => ["Nr;Perspektive;Kennzahl;Rohwert_sinkt_guenstig;Reihe;Index_2024_100",
      ...K.flatMap(k => RN.map((r, j) => [k.i + 1, PE[k.p], k.name, k.sinkt ? "ja" : "nein", r, k.w[j]].join(";")))].join("\r\n") },
    tabellen: () => [{ titel: `Balanced Scorecard (Index ${BJ} = 100, außen = günstiger)`, kopf: ["Perspektive", "Kennzahl", ...RN, "ΔPL 2026"],
      zeilen: [...K.map(k => [PE[k.p], k.name, ...k.w.map(v => zahl(v)), delta(dpl(k), 0)]),
        ["", "Mittelwert", ...RN.map((r, j) => zahl(mittel(j), 1)), delta(mittel(IST) - mittel(PL), 1)]] }],
  });
  zeichnen();
})();
