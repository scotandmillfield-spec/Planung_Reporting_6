/* Dashboard „Durch Selektion änderbare dynamische Diagramme“ – Abb. 3.74 (vorher) und Abb. 3.75 (nachher).
   Seite 1024 x 646 px. Daten: marktanteile.json (daten_marktanteile.py) – Absatz in Tsd. Stück je Quartal,
   Unterkategorie, Untersegment, Region und Anbieter; Marktanteil = Absatz des Anbieters / Absatz aller Anbieter.
   Aufbau wie das Original (Demo „Market Share“): eigener Marktanteil mit Vorquartal und Vorjahresquartal, Kategorien
   und Segmente als Tabellen mit Unterebene, Regionen, Anbieter und Zeitverlauf der Marktanteile.
   Selektion: Datenschnitt oder Klick auf eine Zeile filtert alle übrigen Visuals, das angeklickte Visual hebt hervor;
   Klick auf ein Quartal im Zeitverlauf wählt das Berichtsquartal, Klick auf einen Anbieter hebt ihn hervor; Esc hebt auf.
   Abb. 3.74 und 3.75 verwenden diese Datei unverändert bis auf den Startzustand START. */
(() => {
  "use strict";
  const START = { kat: null, seg: null };                                  // Abb. 3.74: ohne Selektion
  const { zahl, delta, wirkung, FARBE, NBSP, sv, el, tw } = DK;
  const Q = DATA.quartale, NQ = Q.length, KAT = DATA.kategorien, UK = DATA.unterkat, SEG = DATA.segmente,
        US = DATA.untersegmente, REG = DATA.regionen, ANB = DATA.anbieter, NA = ANB.length, EIGEN = 0, UEBRIGE = NA - 1;
  const Z = DATA.zeilen.map(z => {
    const u = z.slice(4);
    return { q: z[0], uk: z[1], k: UK[z[1]][1], us: z[2], s: US[z[2]][1], r: z[3], u, m: u.reduce((a, b) => a + b, 0) };
  });
  const QLANG = q => `${Q[q].slice(1, 2)}. Quartal ${Q[q].slice(3)}`;
  const pz = (a, nk = 1) => (a == null ? "–" : zahl(a * 100, nk) + NBSP + "%");
  const pp = d => (d == null ? "–" : delta(d * 100, 1, NBSP + "%-Pkt."));
  const pd = (a, b) => (b ? delta((a / b - 1) * 100, 1, NBSP + "%") : "–");
  const wk = d => (d == null ? "neutral" : wirkung(d * 100, +1, 1));
  const passt = (k, breite) => k.find(t => tw(t) <= breite) || k[k.length - 1];

  /* ---------- Zustand ---------- */
  const S = { kat: START.kat, seg: START.seg, reg: null, q: null, anb: null };
  const qc = () => (S.q === null ? NQ - 1 : S.q);
  addEventListener("keydown", e => {
    if (e.key !== "Escape" || Object.values(S).every(v => v === null)) return;
    Object.keys(S).forEach(k => { S[k] = null; });
    zeichnen();
  });

  /* ---------- Filter und Summen ---------- */
  const trifft = (sel, grob, fein) => sel === null || (sel.e === 0 ? grob === sel.i : fein === sel.i);
  // ohne: Dimension, die das jeweilige Visual selbst zeigt (dort wird hervorgehoben statt gefiltert)
  const filt = (z, ohne) => (ohne === "kat" || trifft(S.kat, z.k, z.uk)) && (ohne === "seg" || trifft(S.seg, z.s, z.us)) &&
                            (ohne === "reg" || S.reg === null || z.r === S.reg);
  function summe(pred) {
    const o = { v: ANB.map(() => new Array(NQ).fill(0)), m: new Array(NQ).fill(0) };
    for (const z of Z) if (pred(z)) { for (let a = 0; a < NA; a++) o.v[a][z.q] += z.u[a]; o.m[z.q] += z.m; }
    return o;
  }
  const ant = (o, q, a = EIGEN) => (q < 0 || !o.m[q] ? null : o.v[a][q] / o.m[q]);
  const dif = (o, q, qv, a = EIGEN) => { const x = ant(o, q, a), y = ant(o, qv, a); return x == null || y == null ? null : x - y; };
  const selName = (dim, s) => (s === null ? "" : dim === "reg" ? REG[s] : s.e === 0 ? (dim === "kat" ? KAT : SEG)[s.i]
    : `${(dim === "kat" ? UK : US)[s.i][0]} (${(dim === "kat" ? KAT : SEG)[(dim === "kat" ? UK : US)[s.i][1]]})`);

  /* Zeilen der Tabellen Kategorien, Segmente, Regionen: Obergruppe und Unterebene */
  function knoten(dim) {
    const q = qc(), out = [];
    const add = (key, label, ebene, sel, pred, eltern) => {
      const o = summe(z => filt(z, dim) && pred(z));
      out.push({ key, label, ebene, sel, eltern, o, a: ant(o, q), d: dif(o, q, q - 4), vq: ant(o, q - 1), vj: ant(o, q - 4) });
    };
    if (dim === "reg") REG.forEach((n, r) => add("r" + r, n, 0, r, z => z.r === r));
    else {
      const G = dim === "kat" ? KAT : SEG, F = dim === "kat" ? UK : US, gk = dim === "kat" ? "k" : "s", fk = dim === "kat" ? "uk" : "us";
      G.forEach((n, i) => {
        add("g" + i, n, 0, { e: 0, i }, z => z[gk] === i);
        F.forEach(([fn, p], j) => { if (p === i) add("f" + j, fn, 1, { e: 1, i: j }, z => z[fk] === j, i); });
      });
    }
    return out;
  }
  function aktivZeile(dim, n) {
    const s = S[dim];
    if (s === null) return true;
    if (dim === "reg") return n.sel === s;
    if (s.e === 0) return n.ebene === 0 ? n.sel.i === s.i : n.eltern === s.i;
    return n.ebene === 1 && n.sel.i === s.i;
  }
  function waehlen(dim, sel) {
    const gleich = dim === "reg" ? S.reg === sel : S[dim] !== null && S[dim].e === sel.e && S[dim].i === sel.i;
    S[dim] = gleich ? null : sel;
    zeichnen();
  }

  /* ---------- Layout (Seite 1024 x 646) ---------- */
  DK.init({ titel: "Marktanteilsanalyse" });
  const bKopf = DK.box("kopf", 16, 10, 992, 46);
  DK.haarlinie(62);
  const bFilter = DK.box("filter", 16, 68, 992, 50, "dk-filter");
  const bKpi = DK.box("kpis", 16, 128, 992, 68);
  DK.haarlinie(206);
  const bKat = DK.box("v-kat", 16, 216, 318, 222);
  const bSeg = DK.box("v-seg", 353, 216, 318, 222);
  const bReg = DK.box("v-reg", 690, 216, 318, 222);
  DK.haarlinie(447);
  const bAnb = DK.box("v-anb", 16, 456, 318, 186);
  const bZeit = DK.box("v-zeit", 353, 456, 655, 186);

  /* ---------- Tooltip (gleiches Verhalten wie die Bausteine von DK) ---------- */
  const tip = document.querySelector(".dk-tooltip");
  function tooltip(ziel, zeilenFn) {
    ziel.addEventListener("pointermove", ev => {
      tip.textContent = "";
      zeilenFn().filter(Boolean).forEach((z, i) => el(i === 0 ? "b" : "div", {}, tip, z));
      tip.style.display = "block";
      const r = tip.getBoundingClientRect();
      let x = ev.clientX + 14, y = ev.clientY + 14;
      if (x + r.width > innerWidth - 8) x = ev.clientX - r.width - 14;
      if (y + r.height > innerHeight - 8) y = ev.clientY - r.height - 14;
      tip.style.left = x + "px"; tip.style.top = y + "px";
    });
    ziel.addEventListener("pointerleave", () => { tip.style.display = "none"; });
  }

  /* ---------- Tabelle mit Anteilsbalken (0–100 %) und Abweichungsbalken ΔVJ ----------
     Spalten c: aEnde (rechter Rand der Anteilszahl), bar0 (Beginn Anteilsbalken), dEnde (rechter Rand ΔVJ),
     d0/d1 (Bereich der Abweichungsbalken; fehlt bei der Anbietertabelle). skala: {neg, pos} für alle Tabellen gleich. */
  const KOPF_H = 20, BAR100 = 60;
  function tabelle(f, o) {
    const c = o.spalten, H = KOPF_H + o.zeilen.length * o.zh, W = f.breite;
    const svg = sv("svg", { width: W, height: H, role: "img", "aria-label": o.aria }, f.flaeche);
    const g0 = sv("g", { id: o.id }, svg);
    sv("text", { id: o.id + "-kopf-a", x: c.bar0 - 2, y: 14, "text-anchor": "middle", class: "muted" }, g0, Q[qc()]);
    sv("text", { id: o.id + "-kopf-d", x: c.d0 === undefined ? c.dEnde : (c.dEnde - 34 + c.d1) / 2, y: 14,
                 "text-anchor": c.d0 === undefined ? "end" : "middle", class: "muted" }, g0, "ΔVJ %-Pkt.");
    sv("line", { x1: 0, x2: W, y1: KOPF_H - 2.5, y2: KOPF_H - 2.5, stroke: "#3A3F44", "stroke-width": 1 }, g0);
    const k = c.d0 === undefined ? 0 : (c.d1 - c.d0) / Math.max(o.skala.neg + o.skala.pos, 1e-9);
    const mitte = c.d0 === undefined ? 0 : c.d0 + o.skala.neg * k;
    o.zeilen.forEach((z, i) => {
      const y = KOPF_H + i * o.zh, ym = y + o.zh / 2;
      const g = sv("g", { class: "dk-klick" + (o.aktiv(z) ? "" : " dk-blass") }, g0);
      const hit = sv("rect", { x: 0, y, width: W, height: o.zh, fill: "transparent" }, g);
      hit.addEventListener("click", () => o.onClick(z));
      tooltip(hit, () => o.tooltip(z));
      const naechste = o.zeilen[i + 1];
      if (naechste) sv("line", { x1: 0, x2: W, y1: y + o.zh - 0.5, y2: y + o.zh - 0.5,
                                 stroke: naechste.ebene === 0 && o.gruppen ? "#D9D9D9" : "#EFEFEF", "stroke-width": 1 }, g);
      const fett = o.fett(z);
      const lt = sv("text", { x: z.ebene ? 12 : 0, y: ym, dy: "0.35em", style: `pointer-events:none;font-weight:${fett ? "bold" : "normal"}` }, g, z.label);
      if (tw(z.label, 14, fett) + (z.ebene ? 12 : 0) > c.aEnde - 40) console.error("Beschriftung zu lang: " + z.label);
      sv("text", { x: c.aEnde, y: ym, dy: "0.35em", "text-anchor": "end", style: "pointer-events:none" }, g, z.a == null ? "–" : zahl(z.a * 100, 1));
      if (z.a != null) sv("rect", { x: c.bar0, y: ym - 5, width: Math.max(z.a > 0 ? 1 : 0, z.a * BAR100), height: 10, fill: FARBE.ist,
                                    style: "pointer-events:none" }, g);
      sv("line", { x1: c.bar0, x2: c.bar0, y1: ym - 7, y2: ym + 7, stroke: "#8C8C8C", "stroke-width": 1 }, g);
      const kl = o.wertung(z) ? wk(z.d) : "neutral";
      sv("text", { x: c.dEnde, y: ym, dy: "0.35em", "text-anchor": "end",
                   style: `pointer-events:none;fill:${kl === "neutral" ? "var(--text)" : FARBE[kl]}` }, g, z.d == null ? "–" : delta(z.d * 100, 1));
      if (c.d0 !== undefined) {
        if (z.d != null) {
          const bw = Math.abs(z.d) * k;
          sv("rect", { x: z.d >= 0 ? mitte : mitte - bw, y: ym - 5, width: bw, height: 10, fill: FARBE[kl], style: "pointer-events:none" }, g);
        }
        sv("line", { x1: mitte, x2: mitte, y1: ym - 7, y2: ym + 7, stroke: "#8C8C8C", "stroke-width": 1 }, g);
      }
    });
  }
  const SP3 = { aEnde: 166, bar0: 171, dEnde: 270, d0: 276, d1: 318 };     // Kategorien, Segmente, Regionen
  const SP_ANB = { aEnde: 196, bar0: 201, dEnde: 318 };                      // Anbieter (ΔVJ ohne Balken)

  function tipKnoten(dim, n) {
    const q = qc(), andere = ["kat", "seg", "reg"].filter(d => d !== dim && S[d] !== null).map(d => selName(d, S[d]));
    return [n.label + (n.ebene ? ` (${(dim === "kat" ? KAT : SEG)[n.eltern]})` : "") + (andere.length ? " · " + andere.join(", ") : ""),
      `Marktanteil ${Q[q]}: ${pz(n.a)}`,
      `Vorquartal ${pz(n.vq)} · Vorjahresquartal ${pz(n.vj)} · ΔVJ ${pp(n.d)}`,
      `Absatz ${zahl(n.o.v[EIGEN][q])} von ${zahl(n.o.m[q])} Tsd. Stück (Marktvolumen)`,
      "Klick filtert das Dashboard"];
  }

  /* ---------- Zeitverlauf: Liniendiagramm, eigenes Unternehmen hervorgehoben ---------- */
  function zeitverlauf(f, o) {
    const W = f.breite, H = f.hoehe, q = qc();
    const svg = sv("svg", { width: W, height: H, role: "img", "aria-label": "Marktanteile der Anbieter je Quartal" }, f.flaeche);
    const reihen = o.reihen;                                                   // [{a, w: [NQ]}], eigenes Unternehmen zuerst
    const ende = r => `${ANB[r.a]} ${zahl(r.w[NQ - 1] * 100, 1)}`;
    const lw = Math.max(...reihen.map(r => tw(ende(r), 14, r.a === EIGEN || r.a === S.anb))) + 14;
    const oben = 18, unten = 36, PH = H - oben - unten, x0 = 14, x1 = W - lw - 8, st = (x1 - x0) / (NQ - 1);
    const xq = i => x0 + i * st;
    const max = Math.max(...reihen.flatMap(r => r.w), 0.05);
    const ymax = Math.ceil(max * 10 + 0.3) / 10, sy = v => oben + PH - v / ymax * PH;
    // Quartale: Trefferfläche, Achsenbeschriftung (Klick wählt das Berichtsquartal)
    const gq = sv("g", { id: "zeit-quartale" }, svg);
    for (let i = 0; i < NQ; i++) {
      const g = sv("g", { class: "dk-klick" + (S.q !== null && S.q !== i ? " dk-blass" : "") }, gq);
      const hit = sv("rect", { x: xq(i) - st / 2, y: 0, width: st, height: H, fill: "transparent" }, g);
      hit.addEventListener("click", () => { S.q = S.q === i ? null : i; zeichnen(); });
      tooltip(hit, () => o.tipQuartal(i));
      const neuesJahr = i === 0 || Q[i].startsWith("Q1");
      sv("text", { x: xq(i), y: H - 21, "text-anchor": "middle", class: "muted", style: "pointer-events:none" }, g, Q[i].slice(0, 2));
      if (neuesJahr) sv("text", { x: xq(i), y: H - 3, "text-anchor": "middle", class: "muted", style: "pointer-events:none" }, g, Q[i].slice(3));
    }
    sv("line", { x1: x0 - 8, x2: x1 + 4, y1: sy(0) + 0.5, y2: sy(0) + 0.5, stroke: "#8C8C8C", "stroke-width": 1 }, svg);
    if (S.q !== null) sv("line", { x1: xq(q), x2: xq(q), y1: oben - 6, y2: sy(0), stroke: "#9A9A9A", "stroke-width": 1,
                                   "stroke-dasharray": "3 3", style: "pointer-events:none" }, svg);
    // Linien: Wettbewerber grau, eigenes Unternehmen kräftig (zuletzt gezeichnet)
    const pfad = w => w.map((v, i) => `${i ? "L" : "M"}${xq(i).toFixed(1)},${sy(v).toFixed(1)}`).join("");
    const gl = sv("g", { id: "zeit-linien", style: "pointer-events:none" }, svg);
    reihen.slice().reverse().forEach(r => {
      const eigen = r.a === EIGEN, gew = r.a === S.anb, blass = S.anb !== null && !eigen && !gew;
      sv("path", { id: eigen ? "zeit-eigen" : null, d: pfad(r.w), fill: "none", class: blass ? "dk-blass" : "",
                   stroke: eigen ? "#3A3F44" : gew ? "#6E747A" : "#A9A9A9", "stroke-width": eigen ? 3 : gew ? 2.5 : 1.5,
                   "stroke-linejoin": "round" }, gl);
    });
    // eigene Werte an Vorjahresquartal, Vorquartal und Berichtsquartal (die drei Werte der KPI-Leiste)
    const eigen = reihen[0];
    [q - 4, q - 1, q].filter(i => i >= 0).forEach(i => {
      sv("circle", { cx: xq(i), cy: sy(eigen.w[i]), r: 3.5, fill: "#3A3F44", stroke: "#FFFFFF", "stroke-width": 1 }, gl);
      sv("text", { x: xq(i), y: sy(eigen.w[i]) - 9, "text-anchor": "middle", style: `font-weight:${i === q ? "bold" : "normal"};paint-order:stroke;stroke:#FFFFFF;stroke-width:3px` }, gl,
         zahl(eigen.w[i] * 100, 1));
    });
    // Beschriftung am Linienende statt Legende; Abstände mindestens 15 px
    const L = reihen.map(r => ({ r, y0: sy(r.w[NQ - 1]), y: sy(r.w[NQ - 1]) })).sort((a, b) => a.y0 - b.y0);
    L.forEach((l, i) => { l.y = Math.max(l.y, i ? L[i - 1].y + 15 : oben - 4); });
    for (let i = L.length - 1; i >= 0; i--) L[i].y = Math.min(L[i].y, i < L.length - 1 ? L[i + 1].y - 15 : sy(0) - 6);
    L.forEach((l, i) => { if (i) l.y = Math.max(l.y, L[i - 1].y + 15); });
    const ge = sv("g", { id: "zeit-namen" }, svg);
    L.forEach(l => {
      const a = l.r.a, eigenR = a === EIGEN, gew = a === S.anb;
      const g = sv("g", { class: "dk-klick" + (S.anb !== null && !eigenR && !gew ? " dk-blass" : "") }, ge);
      const hit = sv("rect", { x: x1 + 2, y: l.y - 8, width: W - x1 - 2, height: 15, fill: "transparent" }, g);
      hit.addEventListener("click", () => { S.anb = S.anb === a ? null : a; zeichnen(); });
      tooltip(hit, () => o.tipAnbieter(a));
      if (Math.abs(l.y - l.y0) > 3) sv("polyline", { points: `${x1 + 3},${l.y0} ${x1 + 8},${l.y}`, fill: "none", stroke: "#BDBDBD", "stroke-width": 1 }, g);
      sv("text", { x: x1 + 10, y: l.y, dy: "0.35em", style: `pointer-events:none;font-weight:${eigenR || gew ? "bold" : "normal"};fill:${eigenR || gew ? "var(--text)" : "var(--muted)"}` }, g, ende(l.r));
    });
  }

  /* ---------- Datenschnitte ---------- */
  const knopfKat = DK.schnitt(bFilter, "Kategorie", "knoepfe", { optionen: [["alle", "Alle"], ...KAT.map((n, i) => [String(i), n])],
    wert: "alle", onChange: v => { S.kat = v === "alle" ? null : { e: 0, i: Number(v) }; zeichnen(); } });
  const knopfSeg = DK.schnitt(bFilter, "Segment", "knoepfe", { optionen: [["alle", "Alle"], ...SEG.map((n, i) => [String(i), n])],
    wert: "alle", onChange: v => { S.seg = v === "alle" ? null : { e: 0, i: Number(v) }; zeichnen(); } });
  const selReg = DK.schnitt(bFilter, "Region", "dropdown", { optionen: [["alle", "Alle"], ...REG.map((n, i) => [String(i), n])],
    wert: "alle", breite: 150, onChange: v => { S.reg = v === "alle" ? null : Number(v); zeichnen(); } });
  const knoepfeSetzen = (gr, s) => [...gr.querySelectorAll("button")].forEach((b, i) =>
    b.setAttribute("aria-pressed", String(s === null ? i === 0 : s.e === 0 && i === s.i + 1)));

  /* ---------- Zeichnen ---------- */
  function zeichnen() {
    const q = qc();
    knoepfeSetzen(knopfKat, S.kat);
    knoepfeSetzen(knopfSeg, S.seg);
    selReg.value = S.reg === null ? "alle" : String(S.reg);

    const teile = ["kat", "seg", "reg"].filter(d => S[d] !== null).map(d => selName(d, S[d]));
    const auswahl = teile.length ? "Selektion: " + teile.join(", ") : "ohne Selektion";
    DK.kopf(bKopf, { titel: "Marktanteile nach Kategorie, Segment und Region",
      untertitel: passt([`Eigenes Unternehmen · ${Q[q]} · ${auswahl} · Vergleich Vorquartal (ΔVQ) und Vorjahresquartal (ΔVJ)`,
        `Eigenes Unternehmen · ${Q[q]} · ${auswahl} · Vergleich ΔVQ, ΔVJ`, `${Q[q]} · ${auswahl}`], 790),
      quelle: "", legende: [[FARBE.gut, "günstig"], [FARBE.schlecht, "ungünstig"]] });

    // KPI-Leiste: Marktanteil mit Vorquartal und Vorjahresquartal, Absatz, Marktvolumen
    const og = summe(z => filt(z));
    const dvq = dif(og, q, q - 1), dvj = dif(og, q, q - 4);
    const abs = og.v[EIGEN][q], absVj = q >= 4 ? og.v[EIGEN][q - 4] : null, m = og.m[q], mVj = q >= 4 ? og.m[q - 4] : null;
    DK.kpis(bKpi, [
      { label: `Marktanteil eigenes Unternehmen ${Q[q]}`, wert: zahl(ant(og, q) * 100, 1), einheit: "%", bezug: "ΔVQ", delta: pp(dvq), klasse: wk(dvq) },
      { label: `Absatz eigenes Unternehmen ${Q[q]}`, wert: zahl(abs), einheit: "Tsd. Stück", delta: absVj ? pd(abs, absVj) : "–",
        klasse: absVj ? wirkung((abs / absVj - 1) * 100, +1, 1) : "neutral" },
      { label: `Marktvolumen ${Q[q]}`, wert: zahl(m), einheit: "Tsd. Stück", delta: mVj ? pd(m, mVj) : "–", klasse: "neutral" },
    ]);
    const d0 = bKpi.querySelector(".dk-kpi-delta");
    d0.appendChild(document.createTextNode(` (Vorquartal ${pz(ant(og, q - 1))}) · ΔVJ `));
    el("b", { class: wk(dvj) }, d0, pp(dvj));
    d0.appendChild(document.createTextNode(` (Vorjahresquartal ${pz(ant(og, q - 4))})`));

    // Kategorien, Segmente, Regionen: gemeinsamer Maßstab der Abweichungsbalken
    const N = { kat: knoten("kat"), seg: knoten("seg"), reg: knoten("reg") };
    const ds = Object.values(N).flat().map(n => n.d).filter(d => d != null);
    const skala = { neg: Math.max(0, ...ds.map(d => -d)), pos: Math.max(0, ...ds) };
    const botschaftDim = (dim, wort) => {
      const s = S[dim], g = N[dim].filter(n => n.ebene === 0 && n.a != null);
      if (s !== null) {
        const n = N[dim].find(x => (dim === "reg" ? x.sel === s : x.sel.e === s.e && x.sel.i === s.i));
        return passt([`${n.label}: ${pz(n.a)} Marktanteil, ΔVJ ${pp(n.d)}`, `${n.label}: ${pz(n.a)}, ΔVJ ${pp(n.d)}`, `${n.label}: ${pz(n.a)}`], 318);
      }
      const so = g.slice().sort((x, y) => y.a - x.a), top = so[0], low = so[so.length - 1];
      return passt([`${top.label} ${pz(top.a)}, ${low.label} nur ${pz(low.a)}`, `${top.label} mit ${pz(top.a)} ${wort}`, `${top.label} ${pz(top.a)}`], 318);
    };
    const gemeinsam = dim => ({ skala, gruppen: dim !== "reg", spalten: SP3, wertung: () => true,
      aktiv: n => aktivZeile(dim, n), fett: n => n.ebene === 0 && dim !== "reg", onClick: n => waehlen(dim, n.sel),
      tooltip: n => tipKnoten(dim, n) });
    let f = DK.visual(bKat, { titel: "Kategorien", einheit: "Marktanteil in %", botschaft: botschaftDim("kat", "am stärksten") });
    tabelle(f, { id: "kat", aria: "Marktanteil nach Kategorie", zeilen: N.kat, zh: 17, ...gemeinsam("kat") });
    f = DK.visual(bSeg, { titel: "Segmente", einheit: "Marktanteil in %", botschaft: botschaftDim("seg", "am stärksten") });
    tabelle(f, { id: "seg", aria: "Marktanteil nach Segment", zeilen: N.seg, zh: 17, ...gemeinsam("seg") });
    f = DK.visual(bReg, { titel: "Regionen", einheit: "Marktanteil in %", botschaft: botschaftDim("reg", "vorn") });
    tabelle(f, { id: "reg", aria: "Marktanteil nach Region", zeilen: N.reg, zh: 30, ...gemeinsam("reg") });

    // Anbieter im Berichtsquartal (nach Marktanteil, Übrige zuletzt)
    const ab = ANB.map((name, a) => ({ key: a, label: name, ebene: 0, a: ant(og, q, a), d: dif(og, q, q - 4, a),
      vq: ant(og, q - 1, a), vj: ant(og, q - 4, a), abs: og.v[a][q] }));
    const rang = ab.filter(x => x.key !== UEBRIGE).sort((x, y) => y.a - x.a);
    const zeilenAnb = [...rang, ab[UEBRIGE]];
    const platz = rang.findIndex(x => x.key === EIGEN) + 1, eig = ab[EIGEN];
    const fuehrer = rang[0], zweiter = rang[1];
    const bAnbText = platz === 1
      ? passt([`Marktführer, ${pp(eig.a - zweiter.a).slice(1)} vor ${zweiter.label}`, `Marktführer mit ${pz(eig.a)}`], 318)
      : passt([`Rang ${platz}, ${pp(fuehrer.a - eig.a).slice(1)} hinter ${fuehrer.label}`, `Rang ${platz} von ${rang.length} Anbietern`], 318);
    f = DK.visual(bAnb, { titel: "Anbieter", einheit: "Marktanteil in %", botschaft: bAnbText });
    tabelle(f, { id: "anb", aria: "Marktanteile der Anbieter", zeilen: zeilenAnb, zh: 17, skala, gruppen: false, spalten: SP_ANB,
      wertung: z => z.key === EIGEN, aktiv: z => S.anb === null || S.anb === z.key, fett: z => z.key === EIGEN,
      onClick: z => { S.anb = S.anb === z.key ? null : z.key; zeichnen(); },
      tooltip: z => [`${z.label} · ${Q[q]}`, `Marktanteil ${pz(z.a)} · ΔVJ ${pp(z.d)}`, `Vorquartal ${pz(z.vq)} · Vorjahresquartal ${pz(z.vj)}`,
        `Absatz ${zahl(z.abs)} Tsd. Stück`, z.key === UEBRIGE ? "Klick hebt hervor" : "Klick hebt den Anbieter auch im Zeitverlauf hervor"] });

    // Zeitverlauf der Marktanteile
    const reihen = ab.filter(x => x.key !== UEBRIGE).map(x => ({ a: x.key, w: Q.map((_, i) => ant(og, i, x.key)) }));
    const ew = reihen[0].w, sel = S.anb !== null && S.anb !== EIGEN && S.anb !== UEBRIGE ? reihen.find(r => r.a === S.anb) : null;
    const verb = (v0, v1) => (v1 > v0 + 0.0005 ? "gestiegen" : v1 < v0 - 0.0005 ? "gesunken" : "unverändert");
    const bZeitText = sel
      ? `${ANB[sel.a]}: ${Q[0]} ${pz(sel.w[0])}, ${Q[q]} ${pz(sel.w[q])} – eigenes Unternehmen ${pz(ew[q])}`
      : `Eigener Marktanteil seit ${Q[0]} von ${pz(ew[0])} auf ${pz(ew[q])} ${verb(ew[0], ew[q])}` +
        (q < NQ - 1 ? ` (bis ${Q[q]})` : "") + `; ${fuehrer.key === EIGEN ? "Marktführer" : "stärkster Wettbewerber " + fuehrer.label + " " + pz(fuehrer.a)}`;
    f = DK.visual(bZeit, { titel: "Marktanteile im Zeitverlauf", einheit: "%", botschaft: passt([bZeitText,
      `Eigener Marktanteil seit ${Q[0]} von ${pz(ew[0])} auf ${pz(ew[q])} ${verb(ew[0], ew[q])}`], 655) });
    zeitverlauf(f, { reihen,
      tipQuartal: i => [QLANG(i) + (teile.length ? " · " + teile.join(", ") : ""),
        ...ab.map(x => `${x.label}: ${pz(ant(og, i, x.key))}`), `Marktvolumen ${zahl(og.m[i])} Tsd. Stück`,
        "Klick wählt das Quartal für das ganze Dashboard"],
      tipAnbieter: a => [ANB[a], `Marktanteil ${Q[0]}: ${pz(ant(og, 0, a))}`, `Marktanteil ${Q[NQ - 1]}: ${pz(ant(og, NQ - 1, a))}`,
        `Höchster Wert ${pz(Math.max(...Q.map((_, i) => ant(og, i, a))))}`, "Klick hebt den Anbieter hervor"] });
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  /* ---------- Lernplattform: Designregeln, Nachbau, Tabellen, CSV ---------- */
  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "filter", anker: "links", versatz: [560, -2], regel: "CONDENSE – Selektion", titel: "Auswahl filtert alle Visuals",
        text: "Ein Datenschnitt oder ein Klick auf eine Zeile filtert alle übrigen Visuals; das angeklickte Visual hebt die Auswahl hervor und zeigt den Rest blass. Abb. 3.75 zeigt die Selektion Smartphones und Privatkunden: Der eigene Marktanteil steigt dort auf 58,7 %. Ein Klick auf ein Quartal im Zeitverlauf wählt das Berichtsquartal, Esc hebt die Selektion auf. Im Original blieben Zeitverlauf und Wettbewerber bei einer Selektion unverändert; die Auswahl stand in einem eigenen Feld „Current Selections“, hier im Untertitel und in den gedrückten Datenschnitten." },
      { nr: 2, ziel: "kat", anker: "links", versatz: [222, -22], regel: "SAY – Botschaft vermitteln", titel: "Aussage je Visual",
        text: "Unter jedem Titel steht ein aus den Daten berechneter Satz, der sich mit der Selektion ändert – etwa welche Kategorie den höchsten und welche den niedrigsten Marktanteil hat. Das Original hatte nur Überschriften („Category“, „Segment“, „Geography“) mit Symbolen." },
      { nr: 3, ziel: "kat-kopf-d", anker: "links", versatz: [-2, -4], regel: "UNIFY – Semantische Notation", titel: "Abweichung nach Wirkung",
        text: "ΔVJ steht als Balken an einer Nulllinie in Prozentpunkten, blaugrün bei steigendem, rot bei sinkendem Marktanteil – ein Maßstab für alle drei Tabellen. Das Original zeigte graue und rote Dreiecke mit „%“ statt Prozentpunkten." },
      { nr: 4, ziel: "reg", anker: "links", versatz: [140, 128], regel: "EXPRESS – Passende Darstellung", titel: "Balken statt Torten und Weltkarte",
        text: "Marktanteile sind Balken auf einer gemeinsamen Skala von 0 bis 100 %. Das Original zeigte zusätzlich Kreisdiagramme neben den Tabellen und vier Ringdiagramme auf einer grauen Weltkarte, die keinen weiteren Raumbezug liefert." },
      { nr: 5, ziel: "kpis", anker: "links", versatz: [660, 4], regel: "CHECK – Visuelle Integrität", titel: "Eine Zahlenbasis",
        text: "KPI-Leiste, Tabellen und Zeitverlauf rechnen aus denselben Absatzzahlen; jeder Anteil ist das mit dem Marktvolumen gewichtete Mittel seiner Zeilen. Im Original lagen alle drei Kategorien (55,1 %, 41,8 %, 26,9 %) über dem Gesamtanteil von 15,0 % – das kann nicht stimmen." },
      { nr: 6, ziel: "seg", anker: "links", versatz: [80, 150], regel: "STRUCTURE – Inhalte ordnen", titel: "Gleicher Aufbau, eingerückte Unterebene",
        text: "Kategorien, Segmente und Regionen stehen in gleich aufgebauten Tabellen mit denselben Spalten; Unterkategorien und Untersegmente sind eingerückt statt mit Plus-/Minus-Symbolen aufgeklappt, Obergruppen fett. Die Spalte „Total Share“ des Originals (ohne Einheit) steht als Absatz in Tsd. Stück im Tooltip." },
      { nr: 7, ziel: "zeit-namen", anker: "links", versatz: [20, -10], regel: "UNIFY – Hervorheben", titel: "Eigenes Unternehmen anthrazit",
        text: "Die eigene Linie ist kräftig und an Vorjahresquartal, Vorquartal und Berichtsquartal beschriftet, die Wettbewerber sind grau und am Linienende benannt. Das Original zeigte elf bunte Linien mit Legende und daneben dieselben Werte als Tabelle „Market Share against Time“; diese Werte stehen jetzt im Tooltip je Quartal." },
      { nr: 8, ziel: "kopf-titel", anker: "links", versatz: [560, 0], regel: "SIMPLIFY – Überflüssiges weglassen", titel: "Ohne Programmrahmen",
        text: "Menü- und Symbolleisten, Lesezeichen- und Berichtsauswahl, Reiter „Market Size/Market Share“, Symbole und Herstellerlogo entfallen. Das Marktvolumen (Reiter „Market Size“) steht als Kennzahl in der KPI-Leiste; die Anbieternamen sind neutral (Anbieter A bis E)." },
    ],
    nachbauIntro: "Seitengröße benutzerdefiniert 1024 × 646 px. Schrift Arial: Beschriftungen 10,5 pt, Visualtitel 12 pt, KPI-Werte 19,5 pt. Datenmodell: die CSV-Datei in Power Query entpivotieren (Spalten „Absatz_Tsd_Stueck_…“ → Anbieter und Absatz), dazu eine Datumstabelle auf Quartalsebene. Measures: Absatz = SUM(Absatz[Tsd_Stueck]); Marktvolumen = CALCULATE([Absatz]; REMOVEFILTERS(Absatz[Anbieter])); Marktanteil = DIVIDE([Absatz]; [Marktvolumen]); Marktanteil eigen = CALCULATE([Marktanteil]; Absatz[Anbieter] = \"Eigenes Unternehmen\"). Interaktionen (Format › Interaktionen bearbeiten): alle Visuals „Filtern“, das auslösende Visual hebt hervor.",
    nachbau: [
      { id: "A", ziel: "kpis", anker: "links", versatz: [130, 4], titel: "KPI-Leiste", visual: "Karte (neu) mit drei Kennzahlen und Referenzbeschriftungen",
        felder: "Marktanteil eigen, Absatz eigen, Marktvolumen; Referenzen ΔVQ = [Marktanteil eigen] − CALCULATE([Marktanteil eigen]; DATEADD('Datum'[Datum]; −1; QUARTER)), ΔVJ mit SAMEPERIODLASTYEAR",
        format: "Wert 19,5 pt fett; Referenzbeschriftung 10,5 pt, Farbe über bedingte Formatierung (#00806B steigend, #C62828 fallend)" },
      { id: "B", ziel: "v-kat", titel: "Kategorien", visual: "Matrix (Layout gestuft, Zwischensummen oben)",
        felder: "Zeilen: Kategorie, Unterkategorie; Werte: Marktanteil eigen, ΔVJ",
        format: "Datenbalken Marktanteil Min 0, Max 1, #3A3F44, „Nur Balken anzeigen“ aus; ΔVJ als Datenbalken positiv #00806B, negativ #C62828, Achse in der Mitte; Plus-/Minus-Symbole aus",
        hinweis: "Obergruppen fett über Format › Zeilenkopfzeilen › Zwischensummen (Schriftschnitt fett)." },
      { id: "C", ziel: "v-seg", titel: "Segmente", visual: "Matrix wie B", felder: "Zeilen: Segment, Untersegment; Werte wie B", format: "wie B" },
      { id: "D", ziel: "v-reg", titel: "Regionen", visual: "Tabelle wie B", felder: "Region; Werte wie B",
        format: "wie B, Zeilenabstand größer (Format › Raster › Zeilenabstand)" },
      { id: "E", ziel: "v-anb", titel: "Anbieter", visual: "Tabelle",
        felder: "Anbieter, Marktanteil, ΔVJ; Sortierung nach Marktanteil absteigend, „Übrige“ über eine Sortierspalte zuletzt",
        format: "Datenbalken Marktanteil wie B; ΔVJ ohne Balken, Schriftfarbe nach Wirkung nur für das eigene Unternehmen" },
      { id: "F", ziel: "v-zeit", titel: "Marktanteile im Zeitverlauf", visual: "Liniendiagramm",
        felder: "X-Achse: Quartal (kategorisch); Y-Achse: Marktanteil; Legende: Anbieter (Filter ohne „Übrige“)",
        format: "Linien: eigenes Unternehmen #3A3F44, 3 px, Wettbewerber #A9A9A9, 1,5 px; Reihenbeschriftungen ein, Legende aus; Datenbeschriftungen nur für die eigene Reihe; Y-Achse aus, Start 0",
        hinweis: "Klick auf ein Quartal filtert die übrigen Visuals auf dieses Quartal (Interaktion „Filtern“)." },
      { id: "G", ziel: "filter", anker: "links", versatz: [124, -2], titel: "Datenschnitte", visual: "Datenschnitt (3×)",
        felder: "Kategorie und Segment als Kacheln (Einzelauswahl), Region als Dropdown", format: "Ausgewählt #3A3F44 mit weißer Schrift, sonst weiß mit Rahmen #9A9A9A" },
    ],
    theme: DK.thema(),
    csv: { name: "marktanteile_daten.csv", text: () => {
      const k = ["Quartal;Kategorie;Unterkategorie;Segment;Untersegment;Region;" + ANB.map(a => "Absatz_Tsd_Stueck_" + a.replace(/ /g, "_").replace("Ü", "Ue")).join(";")];
      Z.forEach(z => k.push([Q[z.q], KAT[z.k], UK[z.uk][0], SEG[z.s], US[z.us][0], REG[z.r], ...z.u].join(";")));
      return k.join("\r\n"); } },
    tabellen: () => {
      const q = qc(), og = summe(z => filt(z));
      const zeile = (dim, n) => [(n.ebene ? "  " : "") + n.label, pz(n.a), pp(n.d), zahl(n.o.v[EIGEN][q]), zahl(n.o.m[q])];
      const kopf = [`Marktanteil ${Q[q]}`, "ΔVJ", "Absatz Tsd. Stück", "Markt Tsd. Stück"];
      return [
        { titel: `Kennzahlen ${Q[q]}`, kopf: ["Kennzahl", Q[q], "Vorquartal", "Vorjahresquartal"],
          zeilen: [["Marktanteil eigen", pz(ant(og, q)), pz(ant(og, q - 1)), pz(ant(og, q - 4))],
                   ["Absatz Tsd. Stück", zahl(og.v[EIGEN][q]), q >= 1 ? zahl(og.v[EIGEN][q - 1]) : "–", q >= 4 ? zahl(og.v[EIGEN][q - 4]) : "–"],
                   ["Marktvolumen Tsd. Stück", zahl(og.m[q]), q >= 1 ? zahl(og.m[q - 1]) : "–", q >= 4 ? zahl(og.m[q - 4]) : "–"]] },
        { titel: "Kategorien", kopf: ["Kategorie", ...kopf], zeilen: knoten("kat").map(n => zeile("kat", n)) },
        { titel: "Segmente", kopf: ["Segment", ...kopf], zeilen: knoten("seg").map(n => zeile("seg", n)) },
        { titel: "Regionen", kopf: ["Region", ...kopf], zeilen: knoten("reg").map(n => zeile("reg", n)) },
        { titel: "Marktanteile im Zeitverlauf (%)", kopf: ["Quartal", ...ANB],
          zeilen: Q.map((qq, i) => [qq, ...ANB.map((_, a) => zahl(ant(og, i, a) * 100, 1))]) },
      ];
    },
  });
  zeichnen();
})();
