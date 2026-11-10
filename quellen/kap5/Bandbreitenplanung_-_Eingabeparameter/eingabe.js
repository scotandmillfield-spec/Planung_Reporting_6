/* Abb. 5.70 „Bandbreitenplanung – Eingabeparameter“ (softwareneutral nachgebaut). Seite 1024 x 646 px.
   Daten: bandbreiten.json (daten_bandbreiten.py) – derselbe Datensatz wie Abb. 5.71 „Bandbreitenplanung – Ergebnisse“;
   gleiche Kopfzeile und Datenschnitte. Inhalt wie im Original: die Prämissen der Erfolgsplanung je Monat für drei
   Treiber (Verkaufspreise, Einkaufspreise, Tarifsteigerung der Fertigungslöhne) in drei Ausprägungen. Neu geordnet als
   Dreipunktschätzung Min / Wahrscheinlich / Max je Treiber (Grundlage für Worst Case, Plan, Best Case und die
   Monte-Carlo-Simulation in Abb. 5.71); Spalte „Ø Jahr“ = Spalte „Worst“ des Originals (Mittel der Monate).
   Ergänzt: Wirkung jeder Bandbreite auf den DB Business Unit im gewählten Zeitraum (Tornado) und die Bandbreite des
   gewählten Treibers je Monat. Klick auf einen Treiber (Zeile, Balken, Diagramm) hebt ihn hervor, Esc hebt auf. */
(() => {
  "use strict";
  const { zahl, delta, NBSP, el, sv, tw, FARBE } = DK;
  const D = DATA, MON = D.monate, J = D.jahr;
  const MLANG = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
  const POS = D.positionen.map(([key, name, vz, tr], i) => ({ i, key, name, vz, tr }));
  const TR = D.treiber.map(([key, name, richtung], i) => ({ i, key, name, richtung }));
  const TLANG = { vkp: "Preisveränderung der Verkaufspreise", ekp: "Preisveränderung der Einkaufspreise", tarif: "Tarifsteigerung der Fertigungslöhne" };
  const KW = ["Min", "Wahrscheinlich", "Max"];
  const mio = (v, nk = 1) => zahl(v / 1000, nk);
  const dmio = (v, nk = 1) => delta(v / 1000, nk);
  const pz = (v, nk = 1) => delta(v, nk) + NBSP + "%";
  const pp = (v, nk = 1) => zahl(v, nk) + NBSP + "%-Pkt.";
  const passt = (k, breite) => k.find(t => tw(t) <= breite) || k[k.length - 1];
  const zeitraum = bis => (bis === 0 ? MON[0] : MON[0] + "–" + MON[bis]) + " " + J;

  /* ---------- Zustand ---------- */
  const S = { bu: 0, region: null, pg: null, kg: null, bis: D.stichtag - 1, treiber: null };
  addEventListener("keydown", e => { if (e.key === "Escape" && S.treiber !== null) { S.treiber = null; zeichnen(); } });

  /* ---------- Layout ---------- */
  DK.init({ titel: "Bandbreitenplanung – Eingabeparameter" });
  const bKopf = DK.box("kopf", 16, 10, 992, 46);
  DK.haarlinie(62);
  const bFilter = DK.box("filter", 16, 68, 992, 50, "dk-filter");
  DK.haarlinie(126);
  const bMat = DK.box("v-praemissen", 16, 136, 992, 262);
  DK.haarlinie(408);
  const bWirk = DK.box("v-wirkung", 16, 418, 470, 224);
  const bBand = DK.box("v-band", 508, 418, 500, 224);
  el("div", { style: "position:absolute;left:497px;top:418px;height:224px;border-left:1px solid var(--linie)" }, document.getElementById("seite"));
  el("style", {}, document.head, `
    #v-praemissen .dk-matrix td, #v-praemissen .dk-matrix th { padding: 0 6px; }
    #v-praemissen .dk-matrix td:first-child, #v-praemissen .dk-matrix th:first-child { padding-left: 0; font-weight: bold; }
    #v-praemissen .dk-matrix td:nth-child(4), #v-praemissen .dk-matrix th:nth-child(4) { border-right: 1px solid #D9D9D9; }
    #v-praemissen .dk-matrix td:nth-child(3) { color: var(--muted); }
    .bb-halo { paint-order: stroke; stroke: #FFFFFF; stroke-width: 3px; stroke-linejoin: round; }`);

  /* ---------- Berechnungen ---------- */
  const imFilter = z => { const [b, r, p, k] = D.zellen[z]; return b === S.bu && (S.region === null || r === S.region) &&
    (S.pg === null || p === S.pg) && (S.kg === null || k === S.kg); };
  // Plan je Monat und Position (Tsd. €) im Filter
  function planwerte() {
    const P = MON.map(() => POS.map(() => 0));
    D.plan.forEach(z => { if (imFilter(z[0])) POS.forEach((p, j) => { P[z[1]][j] += z[2 + j]; }); });
    return P;
  }
  const praem = (t, bu = S.bu) => D.praemissen[bu][t];              // [Min[12], Wahrscheinlich[12], Max[12]]
  const kwWorst = t => (TR[t].richtung > 0 ? 0 : 2), kwBest = t => (TR[t].richtung > 0 ? 2 : 0);
  const mittel = a => a.reduce((s, x) => s + x, 0) / a.length;
  // Wirkung eines Treibers auf den DB Business Unit (Tsd. €), Kennwert kw statt „Wahrscheinlich“, Monate 0..bis
  function wirkung(P, t, kw, bis = S.bis) {
    const pr = praem(t);
    let s = 0;
    for (let m = 0; m <= bis; m++)
      POS.forEach((p, j) => { if (p.tr === TR[t].key) s += p.vz * P[m][j] * ((1 + pr[kw][m] / 100) / (1 + pr[1][m] / 100) - 1); });
    return s;
  }
  const betroffen = t => POS.filter(p => p.tr === TR[t].key);
  function tornado() {
    const P = planwerte();
    const zeilen = TR.map((t, i) => ({ key: t.key, t: i, name: t.name, wc: wirkung(P, i, kwWorst(i)), bc: wirkung(P, i, kwBest(i)),
      basis: betroffen(i).reduce((s, p) => s + P.slice(0, S.bis + 1).reduce((a, z) => a + z[p.i], 0), 0) }));
    const ges = { key: "alle", name: "Alle Treiber zusammen", wc: zeilen.reduce((s, z) => s + z.wc, 0), bc: zeilen.reduce((s, z) => s + z.bc, 0), summe: true };
    let db = 0;
    for (let m = 0; m <= S.bis; m++) POS.forEach((p, j) => { db += p.vz * P[m][j]; });
    return { zeilen, ges, db };
  }
  // Treiber, der im Diagramm gezeigt wird: gewählter oder der mit der größten mittleren Spanne
  function gezeigt() {
    if (S.treiber !== null) return S.treiber;
    const sp = TR.map((_, t) => mittel(praem(t)[2].map((v, m) => v - praem(t)[0][m])));
    return sp.indexOf(Math.max(...sp));
  }

  /* ---------- Tooltip ---------- */
  const tip = document.querySelector(".dk-tooltip");
  function tooltip(ziel, fn) {
    ziel.addEventListener("pointermove", ev => {
      tip.textContent = "";
      fn(ev).forEach((z, i) => el(i === 0 ? "b" : "div", {}, tip, z));
      tip.style.display = "block";
      const r = tip.getBoundingClientRect();
      let x = ev.clientX + 14, y = ev.clientY + 14;
      if (x + r.width > innerWidth - 8) x = ev.clientX - r.width - 14;
      if (y + r.height > innerHeight - 8) y = ev.clientY - r.height - 14;
      tip.style.left = x + "px"; tip.style.top = y + "px";
    });
    ziel.addEventListener("pointerleave", () => { tip.style.display = "none"; });
  }
  const dreieck = (a, c, b) => (a + b + c) / 3;                     // Erwartungswert der Dreiecksverteilung

  /* ---------- Datenschnitte (wie Abb. 5.71) ---------- */
  const setzeTreiber = t => { S.treiber = S.treiber === t ? null : t; zeichnen(); };
  DK.schnitt(bFilter, "Business Unit", "knoepfe", { optionen: D.bu.map((b, i) => [i, b]), wert: 0,
    onChange: v => { S.bu = Number(v); zeichnen(); } });
  const dd = (label, liste, feld, breite) => DK.schnitt(bFilter, label, "dropdown", { optionen: [["alle", "Alle"], ...liste.map((x, i) => [String(i), x])],
    wert: "alle", breite, onChange: v => { S[feld] = v === "alle" ? null : Number(v); zeichnen(); } });
  dd("Region", D.regionen, "region", 120);
  dd("Produktgruppe", D.produktgruppen, "pg", 130);
  dd("Kundengruppe", D.kundengruppen, "kg", 120);
  DK.schnitt(bFilter, "Kumuliert bis", "dropdown", { optionen: MON.map((m, i) => [String(i), m + " " + J]), wert: String(S.bis), breite: 110,
    onChange: v => { S.bis = Number(v); zeichnen(); } });

  /* ---------- Prämissenmatrix ---------- */
  const SPALTEN = [
    { key: "treiber", titel: "Treiber", breite: 116 },
    { key: "kw", titel: "Kennwert", typ: "text", breite: 108 },
    { key: "sz", titel: "Szenario", typ: "text", breite: 88 },
    { key: "oj", titel: "Ø Jahr", id: "sp-oj", breite: 60, fmt: v => delta(v, 1) },
    ...MON.map((m, i) => ({ key: "m" + i, titel: m, id: "sp-m" + i, breite: 52, fmt: v => delta(v, 1) })),
  ];
  const szenario = (t, kw) => (kw === 1 ? "Plan" : kw === kwWorst(t) ? "Worst Case" : "Best Case");
  function matrixZeilen() {
    const z = [];
    TR.forEach((t, i) => {
      const pr = praem(i);
      [0, 1, 2].forEach(kw => {
        const werte = { kw: KW[kw], sz: szenario(i, kw), oj: mittel(pr[kw]) };
        pr[kw].forEach((v, m) => { werte["m" + m] = v; });
        z.push({ key: t.key, label: kw === 0 ? t.name : "", trenner: kw === 0 && i > 0, werte, t: i, kwi: kw });
      });
    });
    return z;
  }

  /* ---------- Tornado: Wirkung auf den DB Business Unit ---------- */
  function zeichneTornado(f, T) {
    const W = f.breite, H = f.hoehe, kopfH = 20, n = 4, rh = Math.floor((H - kopfH - 8) / n), bh = 16;
    const svg = sv("svg", { width: W, height: H, role: "img", "aria-label": "Wirkung der Bandbreiten auf den DB Business Unit" }, f.flaeche);
    const alle = [...T.zeilen, T.ges];
    const lw = Math.ceil(Math.max(...alle.map(z => tw(z.name, 14, !!z.summe)))) + 12;
    const vw = Math.ceil(Math.max(...alle.map(z => Math.max(tw(dmio(z.wc)), tw(dmio(z.bc)))))) + 8;
    const neg = Math.max(1e-9, ...alle.map(z => -Math.min(0, z.wc))), pos = Math.max(1e-9, ...alle.map(z => Math.max(0, z.bc)));
    const pw = W - lw - 2 * vw, k = pw / (neg + pos), x0 = lw + vw + neg * k;
    sv("text", { x: x0 - 6, y: 13, "text-anchor": "end", class: "muted" }, svg, "Worst Case");
    sv("text", { x: x0 + 6, y: 13, class: "muted" }, svg, "Best Case");
    alle.forEach((z, i) => {
      const y = kopfH + i * rh + (z.summe ? 8 : 0), blass = !z.summe && S.treiber !== null && S.treiber !== z.t;
      const g = sv("g", { class: (blass ? "dk-blass " : "") + (z.summe ? "" : "dk-klick"), id: "wk-" + z.key }, svg);
      if (z.summe) sv("line", { x1: 0, x2: W, y1: y - 4.5, y2: y - 4.5, stroke: "#3A3F44", "stroke-width": 1 }, svg);
      sv("text", { x: 0, y: y + rh / 2, dy: "0.35em", style: z.summe ? "font-weight:bold" : "" }, g, z.name);
      const kw = wert => (Math.abs(wert) < 50 ? "neutral" : wert > 0 ? "gut" : "schlecht");   // < 0,05 Mio. € ohne Farbe
      [["wc", z.wc], ["bc", z.bc]].forEach(([art, v]) => {
        const b = Math.abs(v) * k, x = v < 0 ? x0 - b : x0;
        if (b >= 0.5) sv("rect", { x, y: y + (rh - bh) / 2, width: b, height: bh, fill: FARBE[kw(v)] }, g);
        const tx = v < 0 ? x0 - b - 5 : art === "wc" ? x0 - 5 : x0 + b + 5;
        sv("text", { x: tx, y: y + rh / 2, dy: "0.35em", "text-anchor": v < 0 || art === "wc" ? "end" : "start",
                     style: z.summe ? "font-weight:bold" : "" }, g, dmio(v));
      });
      if (z.summe) return;
      const hit = sv("rect", { x: 0, y, width: W, height: rh, fill: "transparent" }, g);
      hit.addEventListener("click", () => setzeTreiber(z.t));
      tooltip(hit, () => {
        const pr = praem(z.t), wcK = kwWorst(z.t), bcK = kwBest(z.t);
        return [`${TLANG[z.key]}, ${zeitraum(S.bis)}`,
          `Worst Case (${KW[wcK]}, Ø ${pz(mittel(pr[wcK].slice(0, S.bis + 1)))}): ${dmio(z.wc, 2)} Mio. €`,
          `Best Case (${KW[bcK]}, Ø ${pz(mittel(pr[bcK].slice(0, S.bis + 1)))}): ${dmio(z.bc, 2)} Mio. €`,
          `Wirkt auf ${betroffen(z.t).map(p => p.name).join(", ")} (Plan ${mio(z.basis)} Mio. €)`,
          "Klick hebt den Treiber hervor"];
      });
    });
    sv("line", { x1: x0, x2: x0, y1: kopfH - 2, y2: kopfH + n * rh + 8, stroke: "#8C8C8C", "stroke-width": 1 }, svg);
  }

  /* ---------- Bandbreite des gezeigten Treibers je Monat ---------- */
  function zeichneBand(f, t) {
    const pr = praem(t), W = f.breite, H = f.hoehe;
    const svg = sv("svg", { width: W, height: H, role: "img", "aria-label": "Bandbreite " + TR[t].name }, f.flaeche);
    const lab = [{ v: pr[2][11], t: "Max " + delta(pr[2][11], 1) }, { v: pr[1][11], t: "Wahrscheinlich " + delta(pr[1][11], 1) },
                 { v: pr[0][11], t: "Min " + delta(pr[0][11], 1) }];
    const rw = Math.ceil(Math.max(...lab.map(l => tw(l.t)))) + 10;
    let lo = Math.min(0, ...pr[0]), hi = Math.max(0, ...pr[2]);
    const roh = (hi - lo) / 4, mag = 10 ** Math.floor(Math.log10(Math.max(roh, 1e-9)));
    const schritt = [1, 2, 2.5, 5, 10].map(x => x * mag).find(x => x >= roh) || mag * 10;
    lo = Math.floor(lo / schritt - 1e-9) * schritt; hi = Math.ceil(hi / schritt + 1e-9) * schritt;
    if (hi - lo < 1e-9) { hi = 1; }
    const ticks = []; for (let v = lo; v <= hi + 1e-9; v += schritt) ticks.push(Math.round(v * 100) / 100);
    const yl = Math.ceil(Math.max(...ticks.map(v => tw(zahl(v, 0))))) + 8;
    const oben = 8, unten = 22, PH = H - oben - unten, PW = W - yl - rw, slot = PW / 12;
    const X = m => yl + (m + 0.5) * slot, Y = v => oben + (hi - v) / (hi - lo) * PH;
    ticks.forEach(v => sv("text", { x: yl - 6, y: Y(v), dy: "0.35em", "text-anchor": "end", class: "muted" }, svg, zahl(v, 0)));
    const g = sv("g", { id: "band-flaeche" }, svg);
    const pts = (a) => a.map((v, m) => `${X(m)},${Y(v)}`).join(" ");
    sv("polygon", { points: pts(pr[2]) + " " + pr[0].map((v, m) => `${X(m)},${Y(v)}`).reverse().join(" "), fill: "#D4D4D4" }, g);
    sv("line", { x1: yl, x2: yl + PW, y1: Y(0), y2: Y(0), stroke: "#8C8C8C", "stroke-width": 1 }, svg);
    sv("polyline", { points: pts(pr[1]), fill: "none", stroke: "#3A3F44", "stroke-width": 2 }, g);
    const kurz = MON.every(m => tw(m) + 4 <= slot);
    MON.forEach((m, i) => sv("text", { x: X(i), y: H - 4, "text-anchor": "middle", class: "muted" }, svg, kurz ? m : m[0]));
    // Beschriftung rechts, gegen Überlappung verschoben
    const L = lab.map(l => ({ ...l, y: Y(l.v) })).sort((a, b) => a.y - b.y);
    for (let i = 1; i < L.length; i++) L[i].y = Math.max(L[i].y, L[i - 1].y + 16);
    for (let i = L.length - 2; i >= 0; i--) L[i].y = Math.min(L[i].y, L[i + 1].y - 16);
    L.forEach(l => sv("text", { x: yl + PW + 8, y: l.y, dy: "0.35em" }, svg, l.t));
    const hits = sv("g", { class: "dk-klick" }, svg);
    MON.forEach((_, m) => {
      const r = sv("rect", { x: yl + m * slot, y: 0, width: slot, height: H, fill: "transparent" }, hits);
      r.addEventListener("click", () => setzeTreiber(t));
      tooltip(r, () => [`${TR[t].name}, ${MLANG[m]} ${J}`,
        `Min ${pz(pr[0][m])} · Wahrscheinlich ${pz(pr[1][m])} · Max ${pz(pr[2][m])}`,
        `Spanne ${pp(pr[2][m] - pr[0][m])} · Erwartungswert ${pz(dreieck(pr[0][m], pr[1][m], pr[2][m]))} (Dreiecksverteilung)`,
        S.treiber === t ? "Klick hebt die Hervorhebung auf" : "Klick hebt den Treiber hervor"]);
    });
  }

  /* ---------- Botschaften ---------- */
  function botschaftMatrix() {
    const sp = TR.map((_, t) => { const pr = praem(t); const r = pr[2].map((v, m) => v - pr[0][m]); return { t, max: Math.max(...r), m: r.indexOf(Math.max(...r)) }; });
    const b = sp.slice().sort((a, c) => c.max - a.max)[0], pr = praem(b.t);
    return passt([`${TR[b.t].name} mit der größten Bandbreite: ${pz(pr[0][b.m])} bis ${pz(pr[2][b.m])} im ${MLANG[b.m]}, Plan ${pz(pr[1][b.m])}`,
      `${TR[b.t].name} mit der größten Bandbreite: ${pz(pr[0][b.m])} bis ${pz(pr[2][b.m])} im ${MLANG[b.m]}`], 980);
  }
  function botschaftTornado(T) {
    const b = T.zeilen.slice().sort((a, c) => (c.bc - c.wc) - (a.bc - a.wc))[0];
    return passt([`${b.name} wirken am stärksten: ${dmio(b.wc)} bis ${dmio(b.bc)} Mio. €`,
      `${b.name}: ${dmio(b.wc)} bis ${dmio(b.bc)} Mio. €`], 466);
  }
  function botschaftBand(t) {
    const pr = praem(t), r = pr[2].map((v, m) => v - pr[0][m]);
    const f = r.findIndex(x => x > 1e-9);
    if (f < 0) return `${TR[t].name}: keine Bandbreite`;
    if (r.every(x => Math.abs(x - r[0]) < 1e-9)) return `Spanne in allen Monaten ${pp(r[0])}, Plan ${pz(pr[1][0])}`;
    if (f > 0) return passt([`Keine Spanne bis ${MLANG[f - 1]}, ab ${MLANG[f]} ${pp(r[f])} (Plan ${pz(pr[1][f])})`,
      `Ab ${MLANG[f]} Spanne ${pp(r[f])}`], 496);
    return passt([`Spanne ${r[11] > r[0] ? "wächst" : "sinkt"} von ${pp(r[0])} im Januar auf ${pp(r[11])} im Dezember`,
      `Spanne ${r[11] > r[0] ? "wächst" : "sinkt"} von ${pp(r[0])} auf ${pp(r[11])}`], 496);
  }

  /* ---------- Zeichnen ---------- */
  const filterText = () => [S.region === null ? "alle Regionen" : D.regionen[S.region], S.pg === null ? "alle Produktgruppen" : D.produktgruppen[S.pg],
    S.kg === null ? "alle Kundengruppen" : D.kundengruppen[S.kg]].join(", ");
  function zeichnen() {
    DK.kopf(bKopf, { titel: "Bandbreitenplanung – Eingabeparameter",
      untertitel: `Business Unit ${D.bu[S.bu]} · Prämissen ${J} je Monat · Dreipunktschätzung`, quelle: "",
      legende: [["#D4D4D4", "Bandbreite Min–Max"], ["#3A3F44", "Wahrscheinlich (Plan)"], [FARBE.gut, "günstig"], [FARBE.schlecht, "ungünstig"]] });
    let f = DK.visual(bMat, { titel: "Prämissen je Monat", einheit: "Veränderung in %", botschaft: botschaftMatrix() });
    const mt = el("div", { style: "position:absolute;left:0;right:0;top:0" }, f.flaeche);
    DK.matrix(mt, { spalten: SPALTEN, zeilen: matrixZeilen(), auswahl: S.treiber === null ? null : TR[S.treiber].key,
      onClick: key => setzeTreiber(TR.findIndex(t => t.key === key)),
      tooltip: z => {
        const pr = praem(z.t)[z.kwi];
        const z2 = [`${TLANG[TR[z.t].key]} – ${z.werte.kw} (${z.werte.sz})`,
          `Ø Jahr ${pz(mittel(pr))} · Spanne der Monate ${pz(Math.min(...pr))} bis ${pz(Math.max(...pr))}`];
        if (z.kwi === 1) z2.push("„Wahrscheinlich“ ist die Prämisse des Plans");
        else z2.push(`${z.werte.sz}: ${z.kwi === 0 ? "untere" : "obere"} Grenze der Dreiecksverteilung`);
        z2.push(`Wirkt auf ${betroffen(z.t).map(p => p.name).join(", ")}`);
        z2.push("Klick hebt den Treiber hervor");
        return z2;
      } });
    const T = tornado();
    f = DK.visual(bWirk, { titel: `Wirkung auf den DB Business Unit, ${zeitraum(S.bis).replace(" " + J, "")}`, einheit: "Mio. €", botschaft: botschaftTornado(T) });
    zeichneTornado(f, T);
    const t = gezeigt();
    f = DK.visual(bBand, { titel: `Bandbreite ${TR[t].name} je Monat`, einheit: "Veränderung in %", botschaft: botschaftBand(t) });
    zeichneBand(f, t);
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  /* ---------- Lernplattform ---------- */
  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "v-praemissen", anker: "links", versatz: [347, 2], regel: "STRUCTURE – Inhalte ordnen", titel: "Je Treiber Min, Wahrscheinlich, Max",
        text: "Die Prämissen stehen je Treiber als Dreipunktschätzung untereinander; die Spalte „Szenario“ sagt, welcher Wert in den Worst Case, den Plan und den Best Case eingeht – bei den Einkaufspreisen ist der Worst Case das Maximum. Das Original ordnete nach Worst, Mittel und Best und wiederholte jeden Treiber dreimal." },
      { nr: 2, ziel: "sp-oj", anker: "links", versatz: [6, 2], regel: "CHECK – Eindeutige Beschriftung", titel: "„Ø Jahr“ statt „Worst“",
        text: "Die erste Zahlenspalte ist das Mittel der zwölf Monate, z. B. +10,5 % für die Einkaufspreise im Worst Case. Im Original hieß die Spalte „Worst“ – zugleich Szenarioname und Spaltenkopf; leere Zellen der Tarifsteigerung (Januar bis Juni) stehen jetzt als ±0,0." },
      { nr: 3, ziel: "sp-m5", anker: "links", versatz: [28, 2], regel: "EXPRESS – Zahlen lesbar", titel: "Vorzeichen und Einheit einmal",
        text: "Veränderungen tragen ein echtes Vorzeichen (+5,0, −5,0, ±0,0), die Einheit % steht einmal im Titel. Das Original schrieb „-5,0%“ mit Bindestrich und Prozentzeichen in jede Zelle." },
      { nr: 4, ziel: "v-praemissen", anker: "links", versatz: [812, 26], regel: "UNIFY – Semantische Notation", titel: "Keine gelben Eingabezellen",
        text: "Das Original hinterlegte alle Werte gelb (Eingabezellen der Tabellenkalkulation) und die Filter blau. Hier ist der Bericht neutral; Farbe tragen nur Wirkungen: Rot für ungünstig, Blaugrün für günstig. Erfasst werden die Prämissen in einer Planungsmaske." },
      { nr: 5, ziel: "v-wirkung", anker: "links", versatz: [452, 4], regel: "CONDENSE – Wirkung statt nur Prozent", titel: "Was eine Bandbreite kostet",
        text: "Der Tornado rechnet jede Bandbreite in Mio. € Deckungsbeitrag um: Treiber einzeln auf Worst bzw. Best Case, die übrigen auf Plan, im gewählten Zeitraum. „Alle Treiber zusammen“ ist die Spanne zwischen Worst und Best Case in Abb. 5.71. Das Original zeigte nur Prozentsätze." },
      { nr: 6, ziel: "v-band", anker: "links", versatz: [470, 4], regel: "EXPRESS – Bandbreite als Fläche", titel: "Bandbreite je Monat",
        text: "Die Fläche zeigt den Bereich zwischen Min und Max, die Linie den wahrscheinlichen Wert. So ist sofort sichtbar, dass die Unsicherheit der Einkaufspreise zum Jahresende wächst und die Tarifsteigerung erst ab Juli wirkt. Klick auf eine Zeile oder einen Balken zeigt den Treiber hier." },
      { nr: 7, ziel: "kopf-titel", versatz: [42, 8], regel: "SAY – Botschaft vermitteln", titel: "Eine Aussage je Visual",
        text: "Unter jedem Titel steht ein aus den Daten berechneter Satz, etwa welcher Treiber die größte Bandbreite hat. Das Original trug nur den Berichtsnamen „Erfolg Bandbreitenplanung“." },
      { nr: 8, ziel: "filter", anker: "links", versatz: [270, -2], regel: "SIMPLIFY – Softwareneutral", titel: "Filter als Datenschnitte",
        text: "Logo „BI-Controlling“, Datumsfeld mit Symbol und Firmenname entfallen. Die Filter des Originals (Business Unit, Region, Produkt- und Kundengruppe, Monat) sind Datenschnitte wie in Abb. 5.71; Region, Produkt- und Kundengruppe wirken auf die Planwerte hinter dem Tornado." },
    ],
    nachbauIntro: "Seitengröße 1024 × 646 px, Schrift Arial: Beschriftungen 10,5 pt, Visualtitel 12 pt. Datenmodell: Tabelle Prämissen (Business Unit, Treiber, Kennwert Min/Wahrscheinlich/Max, Monat, Prozent) und Faktentabelle Plan (Zelle, Monat, Position, Wert) mit Dimensionen Business Unit, Region, Produktgruppe, Kundengruppe, Monat und Position (Treiber als Spalte der Position). Die CSV-Datei enthält die Prämissen.",
    nachbau: [
      { id: "A", ziel: "v-praemissen", anker: "links", versatz: [347, 2], titel: "Prämissen je Monat", visual: "Matrix",
        felder: "Zeilen: Treiber, Kennwert (Sortierspalte 1–3), Szenario; Spalten: Monat; Werte: Prozent = AVERAGE(Prämissen[Prozent])",
        format: "Zeilenteilsummen aus, Spaltengesamtsumme „Ø Jahr“ als erste Spalte (Measure mit AVERAGE, Gesamtsumme links über die Spaltenposition); Zahlenformat +0,0;−0,0;±0,0",
        hinweis: "Der Bericht zeigt die Prämissen; erfasst werden sie in einer Planungsmaske oder über eine Write-back-Lösung, nicht in der Matrix." },
      { id: "B", ziel: "v-wirkung", anker: "links", versatz: [452, 4], titel: "Wirkung auf den DB Business Unit", visual: "Gestapeltes Balkendiagramm (Tornado)",
        felder: "Y-Achse: Treiber; Werte: Wirkung Worst = SUMX(Plan; Plan[Vorzeichen] × Plan[Wert] × (DIVIDE(1 + [Prämisse Worst]; 1 + [Prämisse Wahrscheinlich]) − 1)) und Wirkung Best analog; Filter Monat ≤ Kumuliert bis",
        format: "Wirkung Worst #C62828, Wirkung Best #00806B, Überlappung 100 %, Datenbeschriftungen außen; X-Achse aus; Zeile „Alle Treiber zusammen“ als eigene Kategorie (Sortierspalte)" },
      { id: "C", ziel: "v-band", anker: "links", versatz: [470, 4], titel: "Bandbreite je Monat", visual: "Liniendiagramm mit Fehlerbalken",
        felder: "X-Achse: Monat; Y-Achse: Prozent Wahrscheinlich; Fehlerbalken: Obergrenze Max, Untergrenze Min",
        format: "Linie #3A3F44, 2 px; Fehlerbalken als schattierter Bereich #D4D4D4; Treiber über Datenschnitt bzw. Interaktion mit A und B" },
      { id: "D", ziel: "filter", anker: "links", versatz: [130, -2], titel: "Datenschnitte", visual: "Datenschnitt (5×)",
        felder: "Business Unit als Kacheln; Region, Produktgruppe, Kundengruppe, Kumuliert bis als Dropdown",
        format: "Ausgewählt #3A3F44 mit weißer Schrift; Synchronisierung mit der Seite „Ergebnisse“ (Abb. 5.71) über „Datenschnitte synchronisieren“" },
    ],
    theme: DK.thema(),
    csv: { name: "bandbreitenplanung_praemissen.csv", text: () => {
      const z = ["Business_Unit;Treiber;Kennwert;Szenario;Monat;Veraenderung_Prozent"];
      D.bu.forEach((b, bi) => TR.forEach((t, ti) => [0, 1, 2].forEach(kw => D.praemissen[bi][ti][kw].forEach((v, m) =>
        z.push([b, t.name, KW[kw], szenario(ti, kw), `${J}-${String(m + 1).padStart(2, "0")}`, String(v).replace(".", ",")].join(";"))))));
      return z.join("\r\n"); } },
    tabellen: () => {
      const T = tornado();
      return [
        { titel: `Prämissen in %, Business Unit ${D.bu[S.bu]}`, kopf: ["Treiber", "Kennwert", "Szenario", "Ø Jahr", ...MON],
          zeilen: matrixZeilen().map(z => [TR[z.t].name, z.werte.kw, z.werte.sz, delta(z.werte.oj, 2), ...MON.map((_, m) => delta(z.werte["m" + m], 1))]) },
        { titel: `Wirkung auf den DB Business Unit in Mio. €, ${zeitraum(S.bis)}, ${filterText()}`, kopf: ["Treiber", "Worst Case", "Best Case", "Spanne"],
          zeilen: [...T.zeilen, T.ges].map(z => [z.name, dmio(z.wc, 2), dmio(z.bc, 2), zahl((z.bc - z.wc) / 1000, 2)]).concat([["DB Business Unit Plan", mio(T.db, 2), "", ""]]) },
        { titel: `Bandbreite ${TR[gezeigt()].name} je Monat in %`, kopf: ["Monat", "Min", "Wahrscheinlich", "Max", "Erwartungswert"],
          zeilen: MON.map((m, i) => { const pr = praem(gezeigt()); return [m, delta(pr[0][i], 1), delta(pr[1][i], 1), delta(pr[2][i], 1), delta(dreieck(pr[0][i], pr[1][i], pr[2][i]), 2)]; }) },
      ];
    },
  });
  zeichnen();
})();
