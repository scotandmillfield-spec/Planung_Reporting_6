/* Abb. 5.71 „Bandbreitenplanung – Ergebnisse“ (softwareneutral nachgebaut). Seite 1024 x 646 px.
   Daten: bandbreiten.json – derselbe Datensatz wie Abb. 5.70 „Bandbreitenplanung – Eingabeparameter“ (gleiche Kopfzeile
   und Datenschnitte). Inhalt wie im Original: stufenweise Deckungsbeitragsrechnung in Worst Case, Plan und Best Case mit
   Abweichungen, DB-Quoten, DB Business Unit je Monat und kumuliert mit Ist.
   Rechenlogik: Plan = Szenario „Wahrscheinlich“; Worst/Best Case setzen jeden Treiber auf seinen ungünstigen bzw.
   günstigen Grenzwert (Szenariowert = Plan × (1 + p) / (1 + p_wahrsch.), Monat für Monat). Monte-Carlo-Simulation
   (5.000 Läufe, fester Startwert): je Lauf und Treiber eine Zufallszahl, über die Dreiecksverteilung (Min,
   Wahrscheinlich, Max) des jeweiligen Monats in eine Prämisse umgerechnet (über die Monate vollständig korreliert,
   Treiber untereinander unabhängig); daraus 5-%- und 95-%-Quantil je Monat und kumuliert.
   Werte mit Ergebnisvorzeichen: Erlöse +, Kosten −; Abweichung positiv = günstig.
   Klick auf eine Zeile zeigt die Position in den Diagrammen, Klick auf einen Monat zeigt die Erfolgsrechnung dieses
   Monats; Esc hebt auf. */
(() => {
  "use strict";
  const { zahl, delta, NBSP, el, sv, tw, FARBE } = DK;
  const D = DATA, MON = D.monate, J = D.jahr, ST = D.stichtag;
  const MLANG = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
  const POS = D.positionen.map(([key, name, vz, tr], i) => ({ i, key, name, vz, tr }));
  const TR = D.treiber.map(([key, name, richtung], i) => ({ i, key, name, richtung }));
  const TI = Object.fromEntries(TR.map(t => [t.key, t.i]));
  const N = 5000;
  const m1 = v => zahl(v, 1), d1 = v => delta(v, 1);
  const pz = (v, nk = 1) => zahl(v, nk) + NBSP + "%";
  const dpz = (v, nk = 1) => delta(v, nk) + NBSP + "%";
  const passt = (k, breite) => k.find(t => tw(t) <= breite) || k[k.length - 1];
  const zeitraumText = ms => (ms.length === 1 ? MLANG[ms[0]] : MON[ms[0]] + "–" + MON[ms[ms.length - 1]]) + " " + J;

  /* ---------- Zeilen der Erfolgsrechnung: Koeffizienten je Position (Ergebnisvorzeichen) ---------- */
  const ZDEF = [["nu", "Nettoumsatz", ["nu"]], ["bv", "Bestandsveränderung", ["bv"]], ["gl", "Gesamtleistung", ["nu", "bv"], 1],
    ["sk", "Skonti", ["sk"]], ["bo", "Boni", ["bo"]], ["fr", "Ausgangsfrachten", ["fr"]],
    ["nnu", "Netto-Netto-Umsatz", ["nu", "bv", "sk", "bo", "fr"], 1], ["ma", "Materialkosten", ["ma"]], ["fl", "Fremdleistungen", ["fl"]],
    ["re", "Rohertrag", ["nu", "bv", "sk", "bo", "fr", "ma", "fl"], 1], ["fk", "Variable Fertigungskosten", ["fk"]],
    ["db1", "DB I", ["nu", "bv", "sk", "bo", "fr", "ma", "fl", "fk"], 1], ["mgk", "Materialgemeinkosten", ["mgk"]],
    ["fgk", "Fertigungsgemeinkosten", ["fgk"]], ["db2", "DB II nach Herstellkosten", ["nu", "bv", "sk", "bo", "fr", "ma", "fl", "fk", "mgk", "fgk"], 1],
    ["vwgk", "Verwaltungsgemeinkosten", ["vwgk"]], ["vtgk", "Vertriebsgemeinkosten", ["vtgk"]],
    ["ke", "Kalkulatorisches Ergebnis", ["nu", "bv", "sk", "bo", "fr", "ma", "fl", "fk", "mgk", "fgk", "vwgk", "vtgk"], 1],
    ["bugk", "BU-Gemeinkosten", ["bugk"]], ["dbbu", "DB Business Unit", POS.map(p => p.key), 1]];
  const ZEILEN = ZDEF.map(([key, name, keys, zw]) => ({ key, name, zw: !!zw,
    c: POS.map(p => (keys.includes(p.key) ? p.vz : 0)) }));
  const ZK = Object.fromEntries(ZEILEN.map(z => [z.key, z]));

  /* ---------- Zustand ---------- */
  const S = { bu: 0, region: null, pg: null, kg: null, bis: ST - 1, zeile: null, monat: null };
  addEventListener("keydown", e => {
    if (e.key !== "Escape" || (S.zeile === null && S.monat === null)) return;
    S.zeile = null; S.monat = null; zeichnen();
  });

  /* ---------- Layout ---------- */
  DK.init({ titel: "Bandbreitenplanung – Ergebnisse" });
  const seite = document.getElementById("seite");
  const bKopf = DK.box("kopf", 16, 10, 992, 46);
  DK.haarlinie(62);
  const bFilter = DK.box("filter", 16, 68, 992, 50, "dk-filter");
  DK.haarlinie(126);
  const bTab = DK.box("v-erfolg", 16, 136, 584, 506);
  el("div", { style: "position:absolute;left:616px;top:136px;height:506px;border-left:1px solid var(--linie)" }, seite);
  const bMon = DK.box("v-monat", 632, 136, 376, 238);
  DK.haarlinie(384, 632, 16);
  const bKum = DK.box("v-kum", 632, 394, 376, 248);
  el("style", {}, document.head, `
    #v-erfolg table.dk-matrix { table-layout: fixed; }
    #v-erfolg .dk-matrix td { height: 18px; line-height: 16px; }
    #v-erfolg .dk-matrix td:first-child { padding-right: 4px; }
    #v-erfolg .dk-matrix td:nth-child(2) { padding: 0 3px 0 0; }
    #v-erfolg .dk-matrix th:nth-child(2) { padding: 0 3px 4px 0; }
    #v-erfolg tr.bb-zw td { font-weight: bold; }
    #v-erfolg tr.bb-gezeigt td { background: #EFEFEF; }
    #v-quoten { margin-top: 8px; }
    .bb-halo { paint-order: stroke; stroke: #FFFFFF; stroke-width: 3px; stroke-linejoin: round; }`);

  /* ---------- Daten im Filter ---------- */
  const imFilter = z => { const [b, r, p, k] = D.zellen[z]; return b === S.bu && (S.region === null || r === S.region) &&
    (S.pg === null || p === S.pg) && (S.kg === null || k === S.kg); };
  function aggregat(quelle) {
    const A = MON.map(() => POS.map(() => 0));
    quelle.forEach(z => { if (imFilter(z[0])) POS.forEach((p, j) => { A[z[1]][j] += z[2 + j] / 1000; }); });  // Mio. €
    return A;
  }
  const praem = () => D.praemissen[S.bu];
  const kwWorst = t => (TR[t].richtung > 0 ? 0 : 2), kwBest = t => (TR[t].richtung > 0 ? 2 : 0);
  // Faktor einer Position im Szenario (kw je Treiber: 0 Min, 1 Wahrscheinlich, 2 Max)
  function faktor(j, m, kwFn) {
    const tr = POS[j].tr;
    if (!tr) return 1;
    const t = TI[tr], pr = praem()[t];
    return (1 + pr[kwFn(t)][m] / 100) / (1 + pr[1][m] / 100);
  }
  const SZ = { wc: kwWorst, pl: () => 1, bc: kwBest };
  const wertZ = (P, z, m, sz) => z.c.reduce((s, c, j) => s + (c ? c * P[m][j] * faktor(j, m, SZ[sz]) : 0), 0);
  const istZ = (I, z, m) => z.c.reduce((s, c, j) => s + c * I[m][j], 0);
  const treiberVon = z => TR.filter(t => z.c.some((c, j) => c && POS[j].tr === t.key));

  /* ---------- Monte-Carlo-Simulation ---------- */
  function mulberry32(a) {
    return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const rng = mulberry32(20270630);
  const U = new Float64Array(N * 3).map(() => rng());
  const triInv = (u, a, c, b) => {                                   // Quantil der Dreiecksverteilung (a ≤ c ≤ b)
    if (b - a < 1e-12) return c;
    const f = (c - a) / (b - a);
    return u < f ? a + Math.sqrt(u * (b - a) * (c - a)) : b - Math.sqrt((1 - u) * (b - a) * (b - c));
  };
  const ZIEH = {};                                                    // je Business Unit: [t][m] → Prämisse je Lauf
  function ziehungen() {
    if (ZIEH[S.bu]) return ZIEH[S.bu];
    const pr = praem();
    ZIEH[S.bu] = TR.map((_, t) => MON.map((_, m) => { const a = new Float64Array(N);
      for (let r = 0; r < N; r++) a[r] = triInv(U[r * 3 + t], pr[t][0][m], pr[t][1][m], pr[t][2][m]); return a; }));
    return ZIEH[S.bu];
  }
  const quantil = (s, q) => { const x = q * (s.length - 1), i = Math.floor(x); return s[i] + (s[Math.min(i + 1, s.length - 1)] - s[i]) * (x - i); };
  function simulation(P, z) {
    const Z = ziehungen(), pr = praem();
    const basis = MON.map((_, m) => wertZ(P, z, m, "pl"));
    const A = TR.map((_, t) => MON.map((_, m) => z.c.reduce((s, c, j) => s + (c && POS[j].tr === TR[t].key ? c * P[m][j] / (1 + pr[t][1][m] / 100) / 100 : 0), 0)));
    const mon = MON.map(() => new Float64Array(N)), cum = MON.map(() => new Float64Array(N));
    for (let r = 0; r < N; r++) {
      let k = 0;
      for (let m = 0; m < 12; m++) {
        let v = basis[m];
        for (let t = 0; t < 3; t++) if (A[t][m]) v += A[t][m] * (Z[t][m][r] - pr[t][1][m]);
        mon[m][r] = v; k += v; cum[m][r] = k;
      }
    }
    const stat = arr => arr.map(a => { const s = Float64Array.from(a).sort(); return { q05: quantil(s, 0.05), q50: quantil(s, 0.5), q95: quantil(s, 0.95),
      mw: s.reduce((x, y) => x + y, 0) / N }; });
    const planJahr = basis.reduce((x, y) => x + y, 0);
    let erreicht = 0;
    for (let r = 0; r < N; r++) if (cum[11][r] >= planJahr - 1e-9) erreicht++;
    return { mon: stat(mon), cum: stat(cum), anteil: erreicht / N, streut: A.some(a => a.some(v => Math.abs(v) > 1e-12)) };
  }

  /* ---------- Berechnungen für Tabelle und Diagramme ---------- */
  const zeitraum = () => (S.monat !== null ? [S.monat] : MON.map((_, i) => i).slice(0, S.bis + 1));
  const gezeigt = () => ZK[S.zeile || "dbbu"];
  function tabelle(P, I) {
    const ms = zeitraum(), ist = ms.filter(m => m < ST);
    return ZEILEN.map(z => {
      const w = sz => ms.reduce((s, m) => s + wertZ(P, z, m, sz), 0);
      const r = { z, wc: w("wc"), pl: w("pl"), bc: w("bc"), ist: ist.length ? ist.reduce((s, m) => s + istZ(I, z, m), 0) : null, istMonate: ist };
      r.dwc = r.wc - r.pl; r.dbc = r.bc - r.pl;
      return r;
    });
  }
  function reihen(P, I, z) {
    const r = { pl: [], wc: [], bc: [], ist: [] };
    MON.forEach((_, m) => { r.pl.push(wertZ(P, z, m, "pl")); r.wc.push(wertZ(P, z, m, "wc")); r.bc.push(wertZ(P, z, m, "bc"));
      if (m < ST) r.ist.push(istZ(I, z, m)); });
    const kum = a => { let s = 0; return a.map(v => (s += v)); };
    return { mon: r, cum: { pl: kum(r.pl), wc: kum(r.wc), bc: kum(r.bc), ist: kum(r.ist) } };
  }

  /* ---------- Tooltip ---------- */
  const tip = document.querySelector(".dk-tooltip");
  function tooltip(ziel, fn) {
    ziel.addEventListener("pointermove", ev => {
      tip.textContent = "";
      fn(ev).forEach((t, i) => el(i === 0 ? "b" : "div", {}, tip, t));
      tip.style.display = "block";
      const r = tip.getBoundingClientRect();
      let x = ev.clientX + 14, y = ev.clientY + 14;
      if (x + r.width > innerWidth - 8) x = ev.clientX - r.width - 14;
      if (y + r.height > innerHeight - 8) y = ev.clientY - r.height - 14;
      tip.style.left = x + "px"; tip.style.top = y + "px";
    });
    ziel.addEventListener("pointerleave", () => { tip.style.display = "none"; });
  }

  /* ---------- Datenschnitte (wie Abb. 5.70) ---------- */
  DK.schnitt(bFilter, "Business Unit", "knoepfe", { optionen: D.bu.map((b, i) => [i, b]), wert: 0,
    onChange: v => { S.bu = Number(v); zeichnen(); } });
  const dd = (label, liste, feld, breite) => DK.schnitt(bFilter, label, "dropdown", { optionen: [["alle", "Alle"], ...liste.map((x, i) => [String(i), x])],
    wert: "alle", breite, onChange: v => { S[feld] = v === "alle" ? null : Number(v); zeichnen(); } });
  dd("Region", D.regionen, "region", 120);
  dd("Produktgruppe", D.produktgruppen, "pg", 130);
  dd("Kundengruppe", D.kundengruppen, "kg", 120);
  DK.schnitt(bFilter, "Kumuliert bis", "dropdown", { optionen: MON.map((m, i) => [String(i), m + " " + J]), wert: String(S.bis), breite: 110,
    onChange: v => { S.bis = Number(v); S.monat = null; zeichnen(); } });

  /* ---------- Matrix Erfolgsrechnung ---------- */
  const SPALTEN = [
    { key: "pos", titel: "", breite: 188 },
    { key: "wc", id: "sp-wc", titel: "Worst Case", breite: 80, fmt: m1 },
    { key: "pl", id: "sp-pl", titel: "Plan", breite: 60, fmt: m1 },
    { key: "bc", id: "sp-bc", titel: "Best Case", breite: 72, fmt: m1 },
    { key: "dwc", id: "sp-dwc", titel: "Δ Worst Case", typ: "delta", richtung: 1, nk: 1, breite: 92, textBreite: 46 },
    { key: "dbc", id: "sp-dbc", titel: "Δ Best Case", typ: "delta", richtung: 1, nk: 1, breite: 92, textBreite: 46 },
  ];
  const QSPALTEN = SPALTEN.map((s, i) => ({ ...s, id: undefined, titel: ["Quoten in %", "", "", "", "Δ in %-Pkt.", "Δ in %-Pkt."][i] }));
  const setzeZeile = key => { S.zeile = S.zeile === key ? null : key; zeichnen(); };
  const setzeMonat = m => { S.monat = S.monat === m ? null : m; zeichnen(); };
  function zeichneTabelle(f, T) {
    const box = el("div", { style: "position:absolute;left:0;right:0;top:0" }, f.flaeche);
    const haupt = el("div", { id: "v-tabelle" }, box);
    const gl = T.find(r => r.z.key === "gl");
    const tab = DK.matrix(haupt, { spalten: SPALTEN, auswahl: S.zeile, zeilenhoehe: 18,
      zeilen: T.map(r => ({ key: r.z.key, label: r.z.name, trenner: r.z.zw, r,
        werte: { wc: r.wc, pl: r.pl, bc: r.bc, dwc: r.dwc, dbc: r.dbc } })),
      onClick: setzeZeile,
      tooltip: zz => {
        const r = zz.r, tr = treiberVon(r.z), ms = zeitraum();
        const rel = d => (Math.abs(r.pl) > 1e-9 ? ` (${dpz(d / Math.abs(r.pl) * 100)})` : "");
        const z = [`${r.z.name}, ${zeitraumText(ms)}`,
          `Worst Case ${m1(r.wc)} · Plan ${m1(r.pl)} · Best Case ${m1(r.bc)} Mio. €`,
          `Δ Worst Case ${d1(r.dwc)}${rel(r.dwc)} · Δ Best Case ${d1(r.dbc)}${rel(r.dbc)} zum Plan`,
          tr.length ? "Treiber: " + tr.map(t => t.name).join(", ") : "Hängt von keinem Treiber ab (Worst Case = Plan = Best Case)",
          `Plan = ${pz(r.pl / gl.pl * 100)} der Gesamtleistung`];
        if (r.ist !== null) z.push(`Ist ${zeitraumText(r.istMonate)}: ${m1(r.ist)} Mio. €`);
        z.push(S.zeile === r.z.key ? "Klick hebt die Auswahl auf" : "Klick zeigt die Position in den Diagrammen");
        return z;
      } });
    [...tab.tBodies[0].rows].forEach((tr, i) => {
      if (T[i].z.zw) tr.classList.add("bb-zw");
      if (T[i].z.key === gezeigt().key) tr.classList.add("bb-gezeigt");
    });
    // Quoten (DB I und DB Business Unit in % der Gesamtleistung), Abweichung in %-Pkt.
    const q = key => { const r = T.find(x => x.z.key === key); const w = sz => r[sz] / gl[sz] * 100;
      return { wc: w("wc"), pl: w("pl"), bc: w("bc"), dwc: w("wc") - w("pl"), dbc: w("bc") - w("pl") }; };
    const qt = DK.matrix(el("div", { id: "v-quoten" }, box), { spalten: QSPALTEN, zeilenhoehe: 18,
      zeilen: [{ key: "q1", label: "DB I / Gesamtleistung", werte: q("db1") }, { key: "q2", label: "DB BU / Gesamtleistung", werte: q("dbbu") }],
      tooltip: zz => [zz.label.replace("DB BU", "DB Business Unit") + ", " + zeitraumText(zeitraum()),
        `Worst Case ${pz(zz.werte.wc)} · Plan ${pz(zz.werte.pl)} · Best Case ${pz(zz.werte.bc)}`,
        `Δ Worst Case ${d1(zz.werte.dwc)} %-Pkt. · Δ Best Case ${d1(zz.werte.dbc)} %-Pkt.`,
        "Gesamtleistung je Szenario als Bezugsgröße"] });
    qt.querySelectorAll("tr.dk-zeile").forEach(tr => { tr.style.cursor = "default"; });
  }

  /* ---------- Liniendiagramm mit Bandbreite ---------- */
  function bandDiagramm(f, o) {
    const W = f.breite, H = f.hoehe;
    const svg = sv("svg", { width: W, height: H, role: "img", "aria-label": o.aria }, f.flaeche);
    const alle = [...o.pl, ...o.wc, ...o.bc, ...o.ist, ...o.sim.map(s => s.q05), ...o.sim.map(s => s.q95), 0];
    let lo = Math.min(...alle), hi = Math.max(...alle);
    const roh = (hi - lo) / 4 || 1, mag = 10 ** Math.floor(Math.log10(roh));
    const schritt = [1, 2, 2.5, 5, 10].map(x => x * mag).find(x => x >= roh) || mag * 10;
    lo = Math.floor(lo / schritt + 1e-9) * schritt; hi = Math.ceil(hi / schritt - 1e-9) * schritt;
    const ticks = []; for (let v = lo; v <= hi + 1e-9; v += schritt) ticks.push(Math.round(v * 1000) / 1000);
    const tnk = schritt < 1 ? 1 : 0;
    const yl = Math.ceil(Math.max(...ticks.map(v => tw(zahl(v, tnk))))) + 8;
    const rw = Math.ceil(Math.max(...o.etiketten.map(e => Math.max(...e.zeilen.map(t => tw(t)))))) + 8;
    const oben = 10, unten = 22, PH = H - oben - unten, PW = W - yl - rw, slot = PW / 12;
    const X = m => yl + (m + 0.5) * slot, Y = v => oben + (hi - v) / (hi - lo) * PH;
    const pts = a => a.map((v, m) => `${X(m)},${Y(v)}`).join(" ");
    const flaeche = (ob, un) => pts(ob) + " " + un.map((v, m) => `${X(m)},${Y(v)}`).reverse().join(" ");
    if (o.monat !== null) sv("rect", { x: yl + o.monat * slot, y: oben - 4, width: slot, height: PH + 8, fill: "#F6F6F6" }, svg);
    ticks.forEach(v => sv("text", { x: yl - 6, y: Y(v), dy: "0.35em", "text-anchor": "end", class: "muted" }, svg, zahl(v, tnk)));
    sv("polygon", { points: flaeche(o.bc, o.wc), fill: "#EFEFEF" }, svg);
    sv("polygon", { points: flaeche(o.sim.map(s => s.q95), o.sim.map(s => s.q05)), fill: "#D4D4D4" }, svg);
    [o.bc, o.wc].forEach(a => sv("polyline", { points: pts(a), fill: "none", stroke: "#A9A9A9", "stroke-width": 1 }, svg));
    sv("line", { x1: yl, x2: yl + PW, y1: Y(0), y2: Y(0), stroke: "#8C8C8C", "stroke-width": 1 }, svg);
    sv("polyline", { points: pts(o.pl), fill: "none", stroke: "#3A3F44", "stroke-width": 1.5 }, svg);
    o.pl.forEach((v, m) => sv("circle", { cx: X(m), cy: Y(v), r: 2.6, fill: "#FFFFFF", stroke: "#3A3F44", "stroke-width": 1.2,
      class: o.monat !== null && o.monat !== m ? "dk-blass" : "" }, svg));
    if (o.ist.length) {
      sv("polyline", { points: pts(o.ist), fill: "none", stroke: "#3A3F44", "stroke-width": 2.5 }, svg);
      o.ist.forEach((v, m) => sv("circle", { cx: X(m), cy: Y(v), r: 3.5, fill: "#3A3F44",
        class: o.monat !== null && o.monat !== m ? "dk-blass" : "" }, svg));
      const m = o.ist.length - 1, v = o.ist[m], ueber = v >= o.pl[m];
      sv("text", { x: X(m) + 6, y: Y(v) + (ueber ? -10 : 14), class: "bb-halo", style: "font-weight:bold" }, svg, o.istText);
    }
    const kurz = MON.every(t => tw(t) + 4 <= slot);
    MON.forEach((t, m) => sv("text", { x: X(m), y: H - 4, "text-anchor": "middle", class: "muted" + (o.monat !== null && o.monat !== m ? " dk-blass" : "") },
      svg, kurz ? t : t[0]));
    // Beschriftung rechts (gegen Überlappung verschoben)
    const L = o.etiketten.map(e => ({ ...e, h: 16 * e.zeilen.length, y: Y(e.v) - 8 * e.zeilen.length })).sort((a, b) => a.y - b.y);
    for (let i = 1; i < L.length; i++) L[i].y = Math.max(L[i].y, L[i - 1].y + L[i - 1].h);
    const maxY = H - unten - 2;
    if (L.length && L[L.length - 1].y + L[L.length - 1].h > maxY) {
      L[L.length - 1].y = maxY - L[L.length - 1].h;
      for (let i = L.length - 2; i >= 0; i--) L[i].y = Math.min(L[i].y, L[i + 1].y - L[i].h);
    }
    L.forEach(e => e.zeilen.forEach((t, i) => sv("text", { x: yl + PW + 8, y: e.y + 8 + 16 * i, dy: "0.35em", style: e.fett ? "font-weight:bold" : "", class: e.blass ? "muted" : "" }, svg, t)));
    const hits = sv("g", { class: "dk-klick", id: o.id }, svg);
    MON.forEach((_, m) => {
      const r = sv("rect", { x: yl + m * slot, y: 0, width: slot, height: H, fill: "transparent" }, hits);
      r.addEventListener("click", () => setzeMonat(m));
      tooltip(r, () => o.tooltip(m));
    });
  }

  /* ---------- Botschaften ---------- */
  function botschaftTabelle(T) {
    const r = T.find(x => x.z.key === gezeigt().key), zr = zeitraumText(zeitraum()).replace(" " + J, "");
    if (Math.abs(r.bc - r.wc) < 0.05) return passt([`${r.z.name} ${zr}: ${m1(r.pl)} Mio. € in allen Szenarien – ohne Treiber`, `${r.z.name}: ohne Bandbreite`], 580);
    return passt([`${r.z.name} ${zr}: Worst Case ${m1(r.wc)} · Plan ${m1(r.pl)} · Best Case ${m1(r.bc)} Mio. €`,
      `${r.z.name}: ${m1(r.wc)} bis ${m1(r.bc)} Mio. €, Plan ${m1(r.pl)}`], 580);
  }
  function botschaftMonat(R) {
    const ist = R.mon.ist.reduce((s, v) => s + v, 0), pl = R.mon.pl.slice(0, ST).reduce((s, v) => s + v, 0), d = ist - pl;
    const im = R.mon.ist.filter((v, m) => v >= Math.min(R.mon.wc[m], R.mon.bc[m]) - 1e-9 && v <= Math.max(R.mon.wc[m], R.mon.bc[m]) + 1e-9).length;
    const lage = Math.abs(d) < 0.05 ? "wie Plan" : `${m1(Math.abs(d))} ${d > 0 ? "über" : "unter"} Plan`;
    return passt([`Ist Jan–${MON[ST - 1]} ${m1(ist)} Mio. €, ${lage}; ${im === ST ? "alle Monate" : im + " von " + ST + " Monaten"} im Band`,
      `Ist Jan–${MON[ST - 1]} ${m1(ist)} Mio. €, ${lage}`], 372);
  }
  function botschaftKum(R, sim) {
    if (!sim.streut) return "Keine Bandbreite – die Position hängt von keinem Treiber ab";
    const p = Math.round(sim.anteil * 100);
    return passt([`Jahresplan nur in ${p} % der Läufe erreicht, Mittel ${m1(sim.cum[11].mw)} Mio. €`,
      `Jahresplan in ${p} % der Läufe erreicht oder übertroffen`, `Jahresplan in ${p} % der Läufe erreicht`].map(t => (p >= 50 ? t.replace("nur ", "") : t)), 372);
  }

  /* ---------- Zeichnen ---------- */
  const filterText = () => [S.region === null ? "" : "Region " + D.regionen[S.region], S.pg === null ? "" : D.produktgruppen[S.pg],
    S.kg === null ? "" : D.kundengruppen[S.kg]].filter(Boolean).join(", ");
  function zeichnen() {
    const P = aggregat(D.plan), I = aggregat(D.ist), T = tabelle(P, I), z = gezeigt(), R = reihen(P, I, z), sim = simulation(P, z);
    const ft = filterText();
    DK.kopf(bKopf, { titel: "Bandbreitenplanung – Ergebnisse",
      untertitel: `Business Unit ${D.bu[S.bu]}${ft ? " (" + ft + ")" : ""} · Plan ${J} mit Bandbreiten · Ist bis 30.06.${J}`, quelle: "",
      legende: [["#3A3F44", "Ist"], ["#FFFFFF", "Plan", "#3A3F44"], ["#EFEFEF", "Worst bis Best Case", "#A9A9A9"], ["#D4D4D4", "Simulation P5–P95"],
                [FARBE.gut, "günstig"], [FARBE.schlecht, "ungünstig"]] });
    let f = DK.visual(bTab, { titel: `Erfolgsrechnung ${zeitraumText(zeitraum())}`, einheit: "Mio. €", botschaft: botschaftTabelle(T) });
    zeichneTabelle(f, T);
    const tipMonat = (art, m) => {
      const r = R[art], s = sim[art][m], kum = art === "cum";
      const z2 = [`${z.name}, ${kum ? "Januar bis " : ""}${MLANG[m]} ${J}`,
        `Plan ${m1(r.pl[m])} · Worst Case ${m1(r.wc[m])} · Best Case ${m1(r.bc[m])} Mio. €`,
        `Simulation: 90 % der Läufe zwischen ${m1(s.q05)} und ${m1(s.q95)}, Median ${m1(s.q50)}`];
      if (m < ST) z2.push(`Ist ${m1(r.ist[m])} Mio. € · Δ Plan ${d1(r.ist[m] - r.pl[m])}`);
      z2.push(S.monat === m ? "Klick hebt die Auswahl auf" : "Klick zeigt die Erfolgsrechnung dieses Monats");
      return z2;
    };
    f = DK.visual(bMon, { titel: z.name, einheit: "je Monat, Mio. €", botschaft: botschaftMonat(R) });
    bandDiagramm(f, { id: "kl-monat", aria: z.name + " je Monat", pl: R.mon.pl, wc: R.mon.wc, bc: R.mon.bc, ist: R.mon.ist, sim: sim.mon, monat: S.monat,
      istText: "Ist", tooltip: m => tipMonat("mon", m),
      etiketten: [{ v: R.mon.bc[11], zeilen: ["Best Case " + m1(R.mon.bc[11])] }, { v: R.mon.pl[11], zeilen: ["Plan " + m1(R.mon.pl[11])], fett: true },
                  { v: R.mon.wc[11], zeilen: ["Worst Case " + m1(R.mon.wc[11])] }] });
    f = DK.visual(bKum, { titel: z.name, einheit: "kumuliert, Mio. €", botschaft: botschaftKum(R, sim) });
    const c11 = sim.cum[11];
    const et = [{ v: R.cum.bc[11], zeilen: ["Best Case " + m1(R.cum.bc[11])] }, { v: R.cum.pl[11], zeilen: ["Plan " + m1(R.cum.pl[11])], fett: true },
                { v: R.cum.wc[11], zeilen: ["Worst Case " + m1(R.cum.wc[11])] }];
    if (sim.streut) et.push({ v: c11.q95, zeilen: ["P95 " + m1(c11.q95)], blass: true }, { v: c11.q05, zeilen: ["P5 " + m1(c11.q05)], blass: true });
    bandDiagramm(f, { id: "kl-kum", aria: z.name + " kumuliert", pl: R.cum.pl, wc: R.cum.wc, bc: R.cum.bc, ist: R.cum.ist, sim: sim.cum, monat: S.monat,
      istText: "Ist " + m1(R.cum.ist[ST - 1]), tooltip: m => tipMonat("cum", m), etiketten: et });
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  /* ---------- Lernplattform ---------- */
  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "v-kum", anker: "links", versatz: [350, 4], regel: "SAY – Botschaft vermitteln", titel: "Eine Aussage je Visual",
        text: "Unter jedem Titel steht ein berechneter Satz – etwa, in wie viel Prozent der Simulationsläufe der Jahresplan erreicht wird. Das Original hatte nur die Titel „DB Business Unit“ und „DB Business Unit kum.“." },
      { nr: 2, ziel: "kopf-legende", anker: "links", versatz: [-8, 0], regel: "UNIFY – Semantische Notation", titel: "Szenarien einheitlich",
        text: "Ist anthrazit mit gefüllten Punkten, Plan dünn mit hohlen Punkten, Worst bis Best Case als hellgraue Fläche. Das Original zeichnete Worst Case rot, Best Case grün und Plan blau; Rot und Blaugrün stehen hier nur für ungünstige und günstige Abweichungen." },
      { nr: 3, ziel: "v-monat", anker: "links", versatz: [350, 4], regel: "EXPRESS – Bandbreite als Fläche", titel: "Band und Simulation",
        text: "Die helle Fläche reicht vom Worst bis zum Best Case, die dunklere vom 5-%- bis zum 95-%-Quantil (P5–P95) der 5.000 Simulationsläufe – dazwischen liegen 90 % der Läufe. Worst und Best Case setzen alle Treiber zugleich auf den Rand – die Simulation zeigt, dass das selten ist und dass der Plan wegen der schiefen Einkaufspreisrisiken eher optimistisch ist." },
      { nr: 4, ziel: "sp-dwc", anker: "links", versatz: [157, -24], regel: "CHECK – Abweichung zum Plan", titel: "Bezugsgröße Plan",
        text: "Δ Worst Case und Δ Best Case beziehen sich auf den Plan, Prozentwerte stehen im Tooltip. Das Original teilte durch den Worst Case (DB Business Unit −204,2 %), und seine Best-Case-Linie (6,1–6,6 je Monat) passte nicht zur Tabelle; hier stammen alle Zahlen aus einer Rechnung." },
      { nr: 5, ziel: "v-erfolg", anker: "links", versatz: [342, 2], regel: "CHECK – Monatsgenau gerechnet", titel: "Prämissen je Monat",
        text: "Jeder Monat wird mit seinen Prämissen aus Abb. 5.70 gerechnet; das Original nahm für die Halbjahrestabelle Jahresmittel (Einkaufspreise +10,5 % statt +7,5 % im Mittel Januar bis Juni). Skonti und Boni folgen jetzt dem Verkaufspreis, im Original blieben sie konstant." },
      { nr: 6, ziel: "v-quoten", anker: "links", versatz: [214, 0], regel: "SIMPLIFY – Ampel entfällt", titel: "Quoten ohne Rot-Gelb-Grün",
        text: "Die DB-Quoten waren im Original rot, gelb und grün hinterlegt. Jetzt stehen sie mit ihrer Abweichung in %-Punkten, gefärbt nach Wirkung. Gliederungssymbole der Tabellenkalkulation, Logo und Datumsfeld entfallen; die Balken „Plan % Gesamtleistung“ stehen im Tooltip." },
      { nr: 7, ziel: "v-tabelle", anker: "links", versatz: [172, 368], regel: "CONDENSE – Klick verbindet", titel: "Zeile wählt das Diagramm",
        text: "Ein Klick auf eine Zeile zeigt diese Position in beiden Diagrammen (hinterlegt ist die gezeigte Zeile, im Original fest der DB Business Unit). Ein Klick auf einen Monat zeigt die Erfolgsrechnung dieses Monats. Esc hebt auf." },
      { nr: 8, ziel: "sp-wc", anker: "links", versatz: [-150, 2], regel: "STRUCTURE – Ergebnisvorzeichen", titel: "Erlöse plus, Kosten minus",
        text: "Die Erfolgsrechnung trägt Ergebnisvorzeichen: Erlöse positiv, Kosten negativ, Zwischensummen fett. So ist jede Abweichung einheitlich zu lesen – positiv ist günstig. Im Original standen alle Werte positiv, die Abweichungen der Kosten hatten das umgekehrte Vorzeichen." },
    ],
    nachbauIntro: "Seitengröße 1024 × 646 px, Schrift Arial: Tabelle 10,5 pt, Visualtitel 12 pt. Datenmodell wie Abb. 5.70: Faktentabellen Plan und Ist (Zelle, Monat, Position, Wert), Tabelle Prämissen, Dimensionen Business Unit, Region, Produktgruppe, Kundengruppe, Monat, Position und eine Berichtszeilentabelle (Zeile, Sortierung, Position, Vorzeichen) für die Zwischensummen. Die Simulation wird vorab gerechnet (Python-Skript in Power Query oder Notebook) und als Tabelle Simulation (Lauf, Monat, Zeile, Wert) geladen.",
    nachbau: [
      { id: "A", ziel: "v-erfolg", anker: "links", versatz: [342, 2], titel: "Erfolgsrechnung", visual: "Matrix",
        felder: "Zeilen: Berichtszeile (Sortierspalte); Werte: Plan = SUMX(Berichtszeilen; [Vorzeichen] × [Planwert]); Worst Case = SUMX(Plan; Plan[Wert] × DIVIDE(1 + [Prämisse Worst]; 1 + [Prämisse Wahrscheinlich])) mit Vorzeichen; Best Case analog; Δ = Szenario − Plan",
        format: "Zwischensummen fett über bedingte Formatierung (Spalte „Zwischensumme“); Δ-Spalten mit Datenbalken (negativ #C62828, positiv #00806B, Achse in der Mitte); Zahlenformat 0,0",
        hinweis: "Quoten als zweite Matrix: DIVIDE([DB I]; [Gesamtleistung]) je Szenario, Δ in %-Punkten. Klick auf eine Zeile filtert die Diagramme über einen Feldparameter bzw. die Kreuzfilterung." },
      { id: "B", ziel: "v-monat", anker: "links", versatz: [350, 4], titel: "Verlauf je Monat", visual: "Liniendiagramm mit Fehlerbalken",
        felder: "X-Achse: Monat; Y-Achse: Ist, Plan; Fehlerbalken am Plan: Obergrenze Best Case, Untergrenze Worst Case; zweite, unsichtbare Linie mit Fehlerbalken P5/P95 = PERCENTILEX.INC(Simulation; Simulation[Wert]; 0,05 bzw. 0,95)",
        format: "Ist #3A3F44 3 px mit Markern, Plan #3A3F44 1,5 px mit weißen Markern; Fehlerbalken als schattierter Bereich #EFEFEF bzw. #D4D4D4; Datenbeschriftung nur am letzten Punkt" },
      { id: "C", ziel: "v-kum", anker: "links", versatz: [350, 4], titel: "Verlauf kumuliert", visual: "Liniendiagramm mit Fehlerbalken",
        felder: "wie B mit kumulierten Measures, z. B. Plan kum. = CALCULATE([Plan]; WINDOW(1; ABS; 0; REL; ORDERBY(Monat[Monat]))); Simulation je Lauf kumuliert, dann Quantile",
        format: "wie B; Anteil der Läufe ≥ Jahresplan als Measure für die Botschaft (Karte bzw. dynamischer Titel)" },
      { id: "D", ziel: "filter", anker: "links", versatz: [130, -2], titel: "Datenschnitte", visual: "Datenschnitt (5×)",
        felder: "Business Unit als Kacheln; Region, Produktgruppe, Kundengruppe, Kumuliert bis als Dropdown",
        format: "Ausgewählt #3A3F44 mit weißer Schrift; synchronisiert mit der Seite „Eingabeparameter“ (Abb. 5.70)" },
    ],
    theme: DK.thema(),
    csv: { name: "bandbreitenplanung_plan_ist.csv", text: () => {
      const k = ["Ebene;Jahr;Monat;Business_Unit;Region;Produktgruppe;Kundengruppe;" + POS.map(p => p.name.replace(/ /g, "_") + "_Tsd_EUR").join(";")];
      [["Plan", D.plan], ["Ist", D.ist]].forEach(([eb, rows]) => rows.forEach(z => { const [b, r, p, kg] = D.zellen[z[0]];
        k.push([eb, J, z[1] + 1, D.bu[b], D.regionen[r], D.produktgruppen[p], D.kundengruppen[kg], ...z.slice(2)].join(";")); }));
      return k.join("\r\n"); } },
    tabellen: () => {
      const P = aggregat(D.plan), I = aggregat(D.ist), T = tabelle(P, I), z = gezeigt(), R = reihen(P, I, z), sim = simulation(P, z);
      const zr = zeitraumText(zeitraum()), ft = filterText();
      const serie = (art, titel) => ({ titel, kopf: ["Monat", "Worst Case", "Plan", "Best Case", "P5", "Median", "P95", "Ist"],
        zeilen: MON.map((m, i) => [m, m1(R[art].wc[i]), m1(R[art].pl[i]), m1(R[art].bc[i]), m1(sim[art][i].q05), m1(sim[art][i].q50), m1(sim[art][i].q95),
                                   i < ST ? m1(R[art].ist[i]) : "–"]) });
      return [
        { titel: `Erfolgsrechnung ${zr} in Mio. €, Business Unit ${D.bu[S.bu]}${ft ? ", " + ft : ""}`, kopf: ["Position", "Worst Case", "Plan", "Best Case", "Δ Worst Case", "Δ Best Case", "Ist"],
          zeilen: T.map(r => [r.z.name, m1(r.wc), m1(r.pl), m1(r.bc), d1(r.dwc), d1(r.dbc), r.ist === null ? "–" : m1(r.ist)]) },
        serie("mon", `${z.name} je Monat in Mio. € (Simulation: 5.000 Läufe)`),
        serie("cum", `${z.name} kumuliert in Mio. € · Jahresplan erreicht in ${zahl(sim.anteil * 100, 1)} % der Läufe`),
      ];
    },
  });
  zeichnen();
})();
