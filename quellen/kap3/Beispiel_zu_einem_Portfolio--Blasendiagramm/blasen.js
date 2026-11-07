/* Einzelvisual „Beispiel zu einem Portfolio-/Blasendiagramm“ (Abb. 3.46): Marktattraktivitäts-Wettbewerbsstärken-
   Portfolio der Geschäftsfelder des Bereichs Blechverarbeitung. Seite 727 x 540 px = 110 x 81,7 mm.
   Daten: blasen.json (daten_blasen.py) – je Geschäftsfeld und Jahr Wettbewerbsstärke, Marktattraktivität (0–15) und
   Umsatz in Tsd. €. Wie im Original ein Blasendiagramm mit Raster bei 5 und 10 (Neun-Felder-Matrix); die Felder
   sind nach Normstrategie hinterlegt (Investieren, Selektieren, Abschöpfen). Kreisfläche = Umsatz, Name und Wert
   am Kreis statt Farblegende. Datenschnitt Jahr; Klick auf einen Kreis zeigt die Lage im Vorjahr. */
(() => {
  "use strict";
  const { zahl, delta, NBSP, sv, el } = DK;
  const JAHRE = DATA.jahre, FELD = DATA.felder, W = DATA.werte;           // W[feld][jahrIndex] = [x, y, umsatz]
  const ZONEN = [
    { name: "Abschöpfen", lang: "Abschöpfen oder desinvestieren", fuell: "#FFFFFF" },
    { name: "Selektieren", lang: "Selektiv vorgehen", fuell: "#F6F6F6" },
    { name: "Investieren", lang: "Investieren und wachsen", fuell: "#E6E6E6" },
  ];
  const zone = (x, y) => { const s = Math.min(2, Math.floor(x / 5)) + Math.min(2, Math.floor(y / 5)); return s >= 3 ? 2 : s === 2 ? 1 : 0; };
  const mio = v => zahl(v / 1000, 1);
  const pz = (a, nk = 0) => zahl(a * 100, nk) + NBSP + "%";

  /* ---------- Zustand ---------- */
  const S = { jahr: JAHRE[JAHRE.length - 1], auswahl: null };
  const auswaehlen = i => { S.auswahl = S.auswahl === i ? null : i; zeichnen(); };
  addEventListener("keydown", e => { if (e.key === "Escape" && S.auswahl !== null) { S.auswahl = null; zeichnen(); } });

  /* ---------- Layout ---------- */
  DK.init({ titel: "Portfolio-/Blasendiagramm", breite: 727, hoehe: 540 });
  const bKopf = DK.box("kopf", 16, 8, 695, 46);
  DK.haarlinie(58);
  const bFilter = DK.box("filter", 16, 64, 695, 50, "dk-filter");
  DK.haarlinie(120);
  const bVis = DK.box("v-portfolio", 16, 128, 695, 404);

  /* ---------- Berechnungen ---------- */
  function daten(jahr = S.jahr) {
    const ji = JAHRE.indexOf(jahr);
    const felder = FELD.map((name, i) => {
      const [x, y, u] = W[i][ji], vj = ji > 0 ? W[i][ji - 1] : null;
      return { i, name, x, y, u, z: zone(x, y), vj: vj && { x: vj[0], y: vj[1], u: vj[2], z: zone(vj[0], vj[1]) } };
    });
    const ges = felder.reduce((s, f) => s + f.u, 0);
    const zonen = ZONEN.map((z, k) => ({ ...z, k, u: felder.filter(f => f.z === k).reduce((s, f) => s + f.u, 0),
      felder: felder.filter(f => f.z === k).sort((a, b) => b.u - a.u) }));
    return { felder, ges, zonen, vjGes: ji > 0 ? felder.reduce((s, f) => s + f.vj.u, 0) : null };
  }

  /* ---------- Botschaft ---------- */
  const passt = (k, b) => k.find(t => DK.tw(t) <= b) || k[k.length - 1];
  function botschaft(d, breite) {
    if (S.auswahl !== null) {
      const f = d.felder[S.auswahl];
      const k = [`${f.name}: ${mio(f.u)} Mio. € (${pz(f.u / d.ges)}), Feld ${ZONEN[f.z].name}`];
      if (f.vj) {
        const bew = f.x - f.vj.x, wort = Math.abs(bew) < 0.05 ? "unveränderte" : bew > 0 ? "stärkere" : "schwächere";
        k.unshift(`${k[0]}, ${wort} Wettbewerbsposition als im Vorjahr`);
      }
      return passt(k, breite);
    }
    const ab = d.zonen[0], inv = d.zonen[2];
    const k = [];
    if (ab.felder.length) k.push(`${pz(ab.u / d.ges)} des Umsatzes in Feldern zum Abschöpfen, vor allem ${ab.felder[0].name} (${mio(ab.felder[0].u)} Mio. €)`,
      `${pz(ab.u / d.ges)} des Umsatzes in Feldern zum Abschöpfen, vor allem ${ab.felder[0].name}`,
      `${pz(ab.u / d.ges)} des Umsatzes im Feld Abschöpfen, vor allem ${ab.felder[0].name}`);
    k.push(`${pz(inv.u / d.ges)} des Umsatzes in Feldern zum Investieren`);
    return passt(k, breite);
  }

  /* ---------- Portfolio ---------- */
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
  function portfolio(ziel, d, breite, hoehe) {
    ziel.textContent = "";
    const svg = sv("svg", { width: breite, height: hoehe, role: "img",
      "aria-label": `Portfolio ${S.jahr}: Wettbewerbsstärke und Marktattraktivität der Geschäftsfelder, Kreisfläche = Umsatz` }, ziel);
    const links = 28, rechts = 6, oben = 24, unten = 40, PW = breite - links - rechts, PH = hoehe - oben - unten;
    const sx = v => links + v / 15 * PW, sy = v => oben + PH - v / 15 * PH;
    // Felder nach Normstrategie, Raster bei 5 und 10
    const gz = sv("g", { id: "pf-felder" }, svg);
    for (let fx = 0; fx < 3; fx++) for (let fy = 0; fy < 3; fy++)
      sv("rect", { x: sx(fx * 5), y: sy(fy * 5 + 5), width: PW / 3, height: PH / 3, fill: ZONEN[zone(fx * 5 + 1, fy * 5 + 1)].fuell }, gz);
    [5, 10].forEach(t => {
      sv("line", { x1: sx(t), x2: sx(t), y1: oben, y2: oben + PH, stroke: "#C9C9C9", "stroke-width": 1 }, gz);
      sv("line", { x1: links, x2: links + PW, y1: sy(t), y2: sy(t), stroke: "#C9C9C9", "stroke-width": 1 }, gz);
    });
    // Beschriftung der Normstrategien jeweils in der Ecke des Feldes, kursiv: [Zone, x, y, Anker, unten]
    [[2, 15, 15, "end", 0], [1, 0, 15, "start", 0], [0, 0, 0, "start", 1], [1, 15, 0, "end", 1]].forEach(([k, x, y, a, unten_]) =>
      sv("text", { x: sx(x) + (a === "end" ? -6 : 6), y: unten_ ? sy(y) - 8 : sy(y) + 14, "text-anchor": a, class: "muted", style: "font-style:italic" }, gz, ZONEN[k].lang));
    // Achsen
    sv("text", { x: 0, y: 12, class: "muted" }, svg, "Marktattraktivität");
    sv("text", { x: links + PW, y: hoehe - 3, "text-anchor": "end", class: "muted" }, svg, "Wettbewerbsstärke");
    [0, 5, 10, 15].forEach(t => {
      sv("text", { x: links - 6, y: sy(t), dy: "0.35em", "text-anchor": "end", class: "muted" }, svg, String(t));
      sv("text", { x: sx(t), y: oben + PH + 16, "text-anchor": t === 15 ? "end" : "middle", class: "muted" }, svg, String(t));
    });
    sv("line", { x1: links, x2: links, y1: oben, y2: oben + PH, stroke: "#8C8C8C", "stroke-width": 1 }, svg);
    sv("line", { x1: links, x2: links + PW, y1: oben + PH, y2: oben + PH, stroke: "#8C8C8C", "stroke-width": 1 }, svg);

    // Kreise: Fläche = Umsatz (gleicher Maßstab in beiden Jahren)
    const uMax = Math.max(...W.flat().map(w => w[2])), RMAX = 32;
    const rad = u => Math.sqrt(u / uMax) * RMAX;
    const gk = sv("g", { id: "pf-kreise" }, svg), gl = sv("g", { id: "pf-namen" }, svg);
    const kreise = d.felder.slice().sort((a, b) => b.u - a.u).map(f => ({ f, cx: sx(f.x), cy: sy(f.y), r: rad(f.u) }));
    const sel = S.auswahl;
    if (sel !== null) {                                  // Vorjahreslage des gewählten Feldes
      const f = d.felder[sel];
      if (f.vj) {
        const vx = sx(f.vj.x), vy = sy(f.vj.y);
        sv("circle", { cx: vx, cy: vy, r: rad(f.vj.u), fill: "none", stroke: "#3A3F44", "stroke-width": 1, "stroke-dasharray": "3 3" }, gk);
        sv("line", { x1: vx, y1: vy, x2: sx(f.x), y2: sy(f.y), stroke: "#3A3F44", "stroke-width": 1 }, gk);
      }
    }
    const gruppen = new Map();
    kreise.forEach(({ f, cx, cy, r }) => {
      const g = sv("g", { class: "dk-klick" + (sel !== null && sel !== f.i ? " dk-blass" : ""), "data-name": f.name }, gk);
      sv("circle", { cx, cy, r, fill: "#3A3F44", "fill-opacity": 0.85, stroke: "#FFFFFF", "stroke-width": 1.5 }, g);
      const hit = sv("circle", { cx, cy, r: Math.max(r, 8), fill: "transparent" }, g);
      hit.addEventListener("click", () => auswaehlen(f.i));
      tooltip(hit, () => {
        const z = [f.name, `Umsatz ${S.jahr}: ${zahl(f.u)} Tsd. € · Anteil ${pz(f.u / d.ges, 1)}`,
          `Wettbewerbsstärke ${zahl(f.x, 1)} · Marktattraktivität ${zahl(f.y, 1)} · Feld ${ZONEN[f.z].name}`];
        if (f.vj) z.push(`Vorjahr: ${zahl(f.vj.u)} Tsd. € (ΔVJ ${delta((f.u / f.vj.u - 1) * 100, 1, NBSP + "%")}), ` +
          `Wettbewerbsstärke ${zahl(f.vj.x, 1)}, Marktattraktivität ${zahl(f.vj.y, 1)}`);
        z.push("Klick zeigt die Lage im Vorjahr");
        return z;
      });
      gruppen.set(f.i, g);
    });
    // Namen und Umsatz neben den Kreisen: erste freie Lage (rechts, links, oben, unten, schräg)
    const belegt = [];
    const schneidetKreis = (b, k) => {
      const nx = Math.max(b.x, Math.min(k.cx, b.x + b.w)), ny = Math.max(b.y, Math.min(k.cy, b.y + b.h));
      return (nx - k.cx) ** 2 + (ny - k.cy) ** 2 < (k.r + 1) ** 2;
    };
    const schneidet = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
    kreise.forEach(k => {
      const text = `${k.f.name} ${mio(k.f.u)}`, w = DK.tw(text), h = 16, { cx, cy, r } = k, q = r * 0.71;
      const lagen = [[cx + r + 4, cy - h / 2], [cx - r - 4 - w, cy - h / 2], [cx - w / 2, cy - r - 2 - h], [cx - w / 2, cy + r + 2],
        [cx + q + 2, cy - q - h], [cx + q + 2, cy + q], [cx - q - 2 - w, cy - q - h], [cx - q - 2 - w, cy + q]];
      const frei = b => b.x >= links + 2 && b.x + b.w <= links + PW && b.y >= oben && b.y + b.h <= oben + PH &&
        !kreise.some(a => a !== k && schneidetKreis(b, a)) && !belegt.some(c => schneidet(b, c));
      const b = lagen.map(([x, y]) => ({ x, y, w, h })).find(frei) || { x: lagen[0][0], y: lagen[0][1], w, h };
      belegt.push(b);
      const g = sv("g", { class: sel !== null && sel !== k.f.i ? "dk-blass" : "" }, gl);
      const t = sv("text", { x: b.x, y: b.y + h / 2, dy: "0.35em" }, g);
      sv("tspan", {}, t, k.f.name + " ");
      sv("tspan", { style: "font-weight:bold" }, t, mio(k.f.u));
    });
  }

  /* ---------- Datenschnitt und Summe ---------- */
  DK.schnitt(bFilter, "Jahr", "knoepfe", {
    optionen: JAHRE.map(y => [y, String(y)]), wert: S.jahr,
    onChange: v => { S.jahr = Number(v); zeichnen(); } });
  const gesamt = el("div", { id: "pf-gesamt", class: "dk-rechts dk-quelle", style: "align-self:flex-end;padding-bottom:6px" }, bFilter);

  /* ---------- Zeichnen ---------- */
  function zeichnen() {
    const d = daten();
    const vj = S.jahr > JAHRE[0] ? `, VJ ${S.jahr - 1}` : "";
    DK.kopf(bKopf, { titel: "Portfolio der Geschäftsfelder Blechverarbeitung",
      untertitel: `Ist ${S.jahr}${vj}, Umsatz in Mio. € · ` + botschaft(d, 695 - 140), quelle: "", legende: [] });
    const ut = bKopf.querySelector(".dk-untertitel");
    ut.style.whiteSpace = "nowrap";
    for (let px = 14; px > 9 && ut.getBoundingClientRect().width > bKopf.clientWidth; px -= 0.5) ut.style.fontSize = px + "px";
    gesamt.textContent = "";
    gesamt.appendChild(document.createTextNode(`Umsatz ${S.jahr}: `));
    el("b", { style: "color:#1A1A1A" }, gesamt, `${mio(d.ges)} Mio. €`);
    gesamt.appendChild(document.createTextNode(" · Kreisfläche = Umsatz"));
    portfolio(bVis, d, bVis.clientWidth, bVis.clientHeight);
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  /* ---------- Lernplattform: Designregeln, Nachbau, Tabellen, CSV ---------- */
  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "kopf", anker: "links", versatz: [640, 1], regel: "SAY – Botschaft vermitteln", titel: "Kernaussage unter dem Titel",
        text: "Unter dem Titel steht, was das Portfolio zeigt – wie viel Umsatz in Feldern zum Abschöpfen liegt und welches Geschäftsfeld dazu am meisten beiträgt. Das Original hatte nur die Überschrift „Strategie“." },
      { nr: 2, ziel: "pf-felder", anker: "links", versatz: [520, 26], regel: "STRUCTURE – Inhalte ordnen", titel: "Normstrategien als Felder",
        text: "Das Raster bei 5 und 10 bildet die Neun-Felder-Matrix. Die Felder sind nach Normstrategie hinterlegt: oben rechts investieren, auf der Diagonalen selektiv vorgehen, unten links abschöpfen oder desinvestieren. Im Original waren die Felder nicht erklärt." },
      { nr: 3, ziel: "pf-namen", anker: "links", versatz: [10, 56], regel: "EXPRESS – Lesbar beschriften", titel: "Name und Umsatz am Kreis",
        text: "Jeder Kreis trägt Namen und Umsatz in Mio. €. Das Original ordnete die Geschäftsfelder über sieben Farben einer Legende unter dem Diagramm zu; die Werte standen in weißer Schrift auf hellgrauem Grund." },
      { nr: 4, ziel: "pf-kreise", anker: "links", versatz: [21, 215], regel: "CHECK – Visuelle Integrität", titel: "Kreisfläche maßstabsgetreu",
        text: "Die Kreisfläche ist proportional zum Umsatz, in beiden Jahren mit demselben Maßstab. Im Original passten die Kreisgrößen nicht zu den Werten – 2.761 T€ wirkten so klein wie 1.824 T€, 11.280 T€ kaum größer als 6.682 T€." },
      { nr: 5, ziel: "pf-kreise", anker: "links", versatz: [360, 40], regel: "UNIFY – Semantische Notation", titel: "Ein Grauton für alle Kreise",
        text: "Die Geschäftsfelder unterscheiden sich durch Lage und Beschriftung, nicht durch Farbe. Rot und Blaugrün bleiben im Buch Abweichungen vorbehalten." },
      { nr: 6, ziel: "pf-gesamt", anker: "links", versatz: [-30, 2], regel: "SIMPLIFY – Überflüssiges weglassen", titel: "Softwareneutral",
        text: "Programmfenster, Menüleisten, Logos und Navigationsknöpfe des Originals entfallen; es bleibt das Portfolio mit dem Datenschnitt Jahr." },
      { nr: 7, ziel: "filter", anker: "links", versatz: [130, -2], regel: "CONDENSE – Filtern und vergleichen", titel: "Jahr und Vorjahreslage",
        text: "Der Datenschnitt wechselt das Jahr. Ein Klick auf einen Kreis zeigt gestrichelt die Lage im Vorjahr und verbindet beide Positionen – so wird die Bewegung im Portfolio sichtbar. Esc hebt die Auswahl auf." },
    ],
    nachbauIntro: "Seitengröße benutzerdefiniert 727 × 540 px. Schrift Arial: Beschriftungen 10,5 pt, Titel 16,5 pt. Datenmodell: Tabelle Portfolio (Geschäftsfeld, Jahr, Wettbewerbsstärke, Marktattraktivität, Umsatz) wie in der CSV-Datei.",
    nachbau: [
      { id: "A", ziel: "v-portfolio", versatz: [0, 0], titel: "Portfolio", visual: "Punktdiagramm (Standardvisual)",
        felder: "Werte: Geschäftsfeld; X-Achse: Wettbewerbsstärke; Y-Achse: Marktattraktivität; Größe: Umsatz",
        format: "Achsen 0 bis 15; Datenfarbe #3A3F44; Kategoriebeschriftungen ein; Legende aus",
        hinweis: "Die Felder entstehen mit Konstantenlinien bei 5 und 10 (Analysebereich › Konstante Linie X/Y) und einem Hintergrundbild mit den drei Grautönen der Normstrategien." },
      { id: "B", ziel: "filter", anker: "links", versatz: [64, -2], titel: "Datenschnitt", visual: "Datenschnitt",
        felder: "Jahr als Kacheln (Einzelauswahl)", format: "Ausgewählt #3A3F44 mit weißer Schrift, sonst weiß mit Rahmen #9A9A9A" },
      { id: "C", ziel: "kopf", anker: "links", versatz: [640, 1], titel: "Kernaussage", visual: "Textfeld mit dynamischem Wert",
        felder: "Measure Feld = SWITCH(TRUE(); …) für die Normstrategie je Geschäftsfeld; Anteil mit DIVIDE", format: "10,5 pt, #4D4D4D" },
    ],
    theme: DK.thema(),
    csv: { name: "portfolio_blechverarbeitung_daten.csv", text: () => {
      const k = ["Geschaeftsfeld;Jahr;Wettbewerbsstaerke;Marktattraktivitaet;Umsatz_TEUR"];
      FELD.forEach((n, i) => JAHRE.forEach((y, ji) => { const [x, yy, u] = W[i][ji]; k.push([n, y, zahl(x, 1), zahl(yy, 1), u].join(";")); }));
      return k.join("\r\n"); } },
    tabellen: () => {
      const d = daten();
      const zeilen = d.felder.slice().sort((a, b) => b.u - a.u).map(f => [f.name, zahl(f.x, 1), zahl(f.y, 1), zahl(f.u), pz(f.u / d.ges, 1), ZONEN[f.z].name]);
      zeilen.push(["Summe", "", "", zahl(d.ges), pz(1, 1), ""]);
      return [{ titel: `Geschäftsfelder Blechverarbeitung ${S.jahr}`, kopf: ["Geschäftsfeld", "Wettbewerbsstärke", "Marktattraktivität", "Umsatz in Tsd. €", "Anteil", "Normstrategie"], zeilen }];
    },
  });
  zeichnen();
})();
