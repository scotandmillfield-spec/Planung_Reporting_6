/* Abb. 5.46 „What-If-Simulation“ (6. Auflage) – Dashboard 1024 x 646 px, softwareneutral nach dem Produktscreenshot.
   Aufbau wie im Original: Annahmen zu Absatzmenge, Verkaufspreis und Stückkosten (im Original drei Optionslisten
   −20 % … +20 %, hier Schieberegler in derselben Schrittweite), Dimension der Analyse (Warengruppe, Region,
   Kundensegment) und die Tabelle Ist | Simulation | Abweichung. Neu: KPI-Leiste mit den Gesamtwerten und die
   Zerlegung der Margenänderung in Mengen-, Preis- und Kosteneffekt.
   Daten: whatif.json (daten_whatif.py) – Ist Juli 2026 je Warengruppe = Werte des Originals; die Seite rechnet:
     Menge neu = Menge × (1 + m) · Umsatz neu = Umsatz × (1 + m) × (1 + p)
     Kosten neu = (Umsatz − Marge) × (1 + m) × (1 + k) · Marge neu = Umsatz neu − Kosten neu
   Klick auf eine Zeile filtert KPI-Leiste und Margeneffekte, Klick auf einen Spaltenkopf sortiert, Esc hebt auf. */
(() => {
  "use strict";
  const { zahl, delta, wirkung, FARBE, NBSP, sv, el, tw } = DK;
  const DIM = [
    { name: "Warengruppe", plural: "Warengruppen", werte: DATA.warengruppen, idx: 0 },
    { name: "Region", plural: "Regionen", werte: DATA.regionen, idx: 1 },
    { name: "Kundensegment", plural: "Kundensegmente", werte: DATA.segmente, idx: 2 },
  ];
  const Z = DATA.zeilen;                                     // [Warengruppe, Region, Segment, Menge, Umsatz €, Marge €]
  const TREIBER = [
    { key: "menge", label: "Absatzmenge", effekt: "Mengeneffekt" },
    { key: "preis", label: "Verkaufspreis", effekt: "Preiseffekt" },
    { key: "kosten", label: "Stückkosten", effekt: "Kosteneffekt" },
  ];
  const S = { dim: 0, menge: DATA.start.menge, preis: DATA.start.preis, kosten: DATA.start.kosten, auswahl: null, sort: null };
  const pz = v => delta(v, 0, NBSP + "%");                           // Annahme: −15 %, +5 %, ±0 %
  const tsd = v => zahl(v / 1000, 1);
  const eur = v => zahl(v) + NBSP + "€";
  // Bezug auf den Betrag (auch bei negativer Basis); auf 1e-9 gerundet, damit −10,75 % nicht als −10,7499… erscheint
  const proz = (a, b) => (b ? Math.round((a - b) / Math.abs(b) * 1e11) / 1e9 : null);

  /* ---------- Rechnen ---------- */
  function sim(x) {
    const m = S.menge / 100, p = S.preis / 100, k = S.kosten / 100, C = x.R - x.M;
    const NV = x.V * (1 + m), NR = x.R * (1 + m) * (1 + p), NC = C * (1 + m) * (1 + k), NM = NR - NC;
    return { ...x, C, NV, NR, NC, NM, dR: NR - x.R, dM: NM - x.M, dMp: proz(NM, x.M), dRp: proz(NR, x.R),
             eff: [x.M * m, x.R * (1 + m) * p, -C * (1 + m) * k] };    // Menge, Preis, Stückkosten (Summe = dM)
  }
  function gruppen() {
    const d = DIM[S.dim], g = d.werte.map((label, key) => ({ key, label, V: 0, R: 0, M: 0 }));
    Z.forEach(z => { const x = g[z[d.idx]]; x.V += z[3]; x.R += z[4]; x.M += z[5]; });
    return g.map(sim);
  }
  function gesamt(gs) {
    return sim(gs.reduce((s, x) => ({ ...s, V: s.V + x.V, R: s.R + x.R, M: s.M + x.M }), { key: "ges", label: "Gesamt", V: 0, R: 0, M: 0 }));
  }
  function sortiert(gs) {
    const r = gs.slice();
    if (S.sort) {
      const f = S.sort.key === "label" ? null : S.sort.key;
      r.sort((a, b) => (f === null ? a.label.localeCompare(b.label, "de") * (S.sort.ab ? -1 : 1)
        : ((a[f] ?? -Infinity) - (b[f] ?? -Infinity)) * (S.sort.ab ? -1 : 1)) || a.key - b.key);
    } else if (S.dim === 0) r.sort((a, b) => b.R - a.R);              // Warengruppen nach Umsatz Ist, sonst natürliche Reihenfolge
    return r;
  }

  /* ---------- Zustand ---------- */
  addEventListener("keydown", e => { if (e.key === "Escape" && S.auswahl !== null) { S.auswahl = null; zeichnen(); } });
  const auswaehlen = k => { S.auswahl = S.auswahl === k ? null : k; zeichnen(); };
  function sortieren(key) {
    if (!S.sort || S.sort.key !== key) S.sort = { key, ab: true };
    else if (S.sort.ab) S.sort.ab = false;
    else S.sort = null;
    zeichnen();
  }

  /* ---------- Layout (Seite 1024 x 646) ---------- */
  DK.init({ titel: "What-If-Simulation" });
  const bKopf = DK.box("kopf", 16, 10, 992, 46);
  DK.haarlinie(62);
  const bFilter = DK.box("filter", 16, 68, 992, 50, "dk-filter");
  const bKpi = DK.box("kpis", 16, 128, 600, 68);
  const bEff = DK.box("v-effekte", 640, 128, 368, 68, "dk-visual");
  DK.haarlinie(206);
  const bTab = DK.box("v-tabelle", 16, 216, 992, 426);

  el("style", {}, document.head, `
    .wi-regler .wi-zeile { display: flex; align-items: center; gap: 8px; height: 30px; position: relative; }
    .wi-regler input[type=range] { -webkit-appearance: none; appearance: none; width: 140px; height: 30px; margin: 0;
      background: transparent; cursor: pointer; position: relative; z-index: 1; }
    .wi-regler input[type=range]:focus { outline: none; }
    .wi-regler input[type=range]:focus-visible { outline: 2px solid #8F8F8F; outline-offset: 2px; }
    .wi-regler input[type=range]::-webkit-slider-runnable-track { height: 4px; background: #A9A9A9; border-radius: 2px; }
    .wi-regler input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 16px; height: 16px;
      border-radius: 50%; background: #3A3F44; margin-top: -6px; border: none; }
    .wi-regler input[type=range]::-moz-range-track { height: 4px; background: #A9A9A9; border-radius: 2px; }
    .wi-regler input[type=range]::-moz-range-thumb { width: 16px; height: 16px; border-radius: 50%; background: #3A3F44; border: none; }
    .wi-regler .wi-skala { position: absolute; left: 0; top: 21px; width: 140px; height: 6px; pointer-events: none; }
    .wi-regler .wi-skala i { position: absolute; top: 0; width: 1px; height: 4px; background: #A9A9A9; }
    .wi-regler .wi-skala i.null { height: 6px; background: #3A3F44; }
    .wi-regler .wi-wert { font-weight: bold; min-width: 42px; text-align: right; font-variant-numeric: tabular-nums; }
    .wi-zurueck { font: inherit; font-size: 14px; height: 30px; padding: 0 12px; background: #FFFFFF; color: var(--text);
      border: 1px solid #9A9A9A; border-radius: 3px; cursor: pointer; }
    .wi-gruppe { position: absolute; top: 0; height: 18px; font-size: 14px; color: var(--muted); text-align: center;
      border-bottom: 1px solid #9A9A9A; white-space: nowrap; }
    #v-effekte .wi-eff-titel { font-size: 14px; color: var(--muted); white-space: nowrap; }`);

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

  /* ---------- Filterzeile: Dimension, drei Annahmen, Zurücksetzen ---------- */
  DK.schnitt(bFilter, "Analyse nach", "dropdown", { breite: 160, optionen: DIM.map((d, i) => [String(i), d.name]), wert: "0",
    onChange: w => { S.dim = Number(w); S.auswahl = null; S.sort = null; zeichnen(); } });
  const REGLER = TREIBER.map(t => {
    const s = el("div", { class: "dk-schnitt wi-regler", id: "regler-" + t.key }, bFilter);
    el("label", { for: "in-" + t.key }, s, t.label);
    const zeile = el("div", { class: "wi-zeile" }, s);
    const inp = el("input", { type: "range", id: "in-" + t.key, min: -20, max: 20, step: 5, value: S[t.key],
                              "aria-label": t.label + ", Veränderung in %" }, zeile);
    const skala = el("div", { class: "wi-skala" }, zeile);
    for (let i = 0; i <= 8; i++) el("i", { class: i === 4 ? "null" : "", style: `left:${8 + i * (140 - 16) / 8 - 0.5}px` }, skala);
    const wert = el("span", { class: "wi-wert", id: "wert-" + t.key }, zeile, pz(S[t.key]));
    inp.addEventListener("input", () => { S[t.key] = Number(inp.value); zeichnen(); });
    tooltip(s, () => [t.label, `Annahme: ${pz(S[t.key])} gegenüber Ist ${DATA.stand}`, "Schrittweite 5 %, Bereich −20 % bis +20 %",
      t.key === "menge" ? "wirkt auf Menge, Umsatz und Kosten" : t.key === "preis" ? "wirkt auf den Umsatz" : "wirkt auf die Kosten je Stück"]);
    return { t, inp, wert };
  });
  if (!DK.PRINT) {
    const b = el("button", { type: "button", class: "wi-zurueck dk-rechts", id: "zurueck" }, bFilter, "Annahmen auf ±0 %");
    b.addEventListener("click", () => { TREIBER.forEach(t => { S[t.key] = 0; }); zeichnen(); });
  }

  /* ---------- Margeneffekte (Balken an einer Nulllinie) ---------- */
  function effekte(g) {
    bEff.textContent = "";
    el("div", { class: "wi-eff-titel" }, bEff, "Wirkung auf die Marge" + (S.auswahl === null ? "" : " · " + g.label) + ", Tsd. €");
    const W = 368, RH = 17, LW = 150, TW = 58;
    const svg = sv("svg", { width: W, height: RH * 3, role: "img", "aria-label": "Margeneffekte", style: "margin-top:0" }, bEff);
    const neg = Math.max(0, ...g.eff.map(v => -v)), pos = Math.max(0, ...g.eff);
    const pw = W - LW - TW - 6, k = pw / Math.max(neg + pos, 1e-9), mitte = LW + TW + 4 + neg * k;
    TREIBER.forEach((t, i) => {
      const v = g.eff[i], kl = wirkung(v, 1, 1), y = i * RH;
      const gg = sv("g", { id: "eff-" + t.key }, svg);
      sv("text", { x: 0, y: y + RH / 2, dy: "0.35em" }, gg, `${t.label} ${pz(S[t.key])}`);
      sv("text", { x: LW + TW - 4, y: y + RH / 2, dy: "0.35em", "text-anchor": "end",
                   style: `fill:${kl === "neutral" ? "var(--text)" : FARBE[kl]}` }, gg, delta(v / 1000, 1));
      const bw = Math.abs(v) * k;
      if (bw > 0.5) sv("rect", { x: v >= 0 ? mitte : mitte - bw, y: y + (RH - 10) / 2, width: bw, height: 10, fill: FARBE[kl] }, gg);
      const hit = sv("rect", { x: 0, y, width: W, height: RH, fill: "#FFFFFF", "fill-opacity": 0 }, gg);
      tooltip(hit, () => [t.effekt + (S.auswahl === null ? "" : " · " + g.label),
        i === 0 ? `Marge Ist ${eur(g.M)} × ${pz(S.menge)}` : i === 1 ? `Umsatz Ist ${eur(g.R)} × (1 ${S.menge < 0 ? "−" : "+"} ${Math.abs(S.menge)} %) × ${pz(S.preis)}`
          : `Kosten Ist ${eur(g.C)} × (1 ${S.menge < 0 ? "−" : "+"} ${Math.abs(S.menge)} %) × ${pz(S.kosten)}, Vorzeichen umgekehrt`,
        `= ${delta(v, 0)} €`, `Summe der drei Effekte: Δ Marge ${delta(g.dM, 0)} €`]);
    });
    sv("line", { x1: mitte, x2: mitte, y1: 1, y2: RH * 3 - 1, stroke: "#8C8C8C", "stroke-width": 1 }, svg);
  }

  /* ---------- Botschaft der Tabelle ---------- */
  const passt = (k, b) => k.find(t => tw(t) <= b) || k[k.length - 1];
  function botschaft(gs, ges) {
    const d = DIM[S.dim];
    if (S.menge === 0 && S.preis === 0 && S.kosten === 0) return "Alle Annahmen ±0 %: Die Simulation entspricht dem Ist – Regler verschieben, um neu zu rechnen";
    const kopf = `Umsatz ${delta(ges.dRp, 1, NBSP + "%")}, Marge ${delta(ges.dMp, 1, NBSP + "%")}`;
    if (S.auswahl !== null) {
      const x = gs.find(g => g.key === S.auswahl);
      return passt([`${x.label}: Umsatz ${delta(x.dR / 1000, 1)} Tsd. € (${delta(x.dRp, 1, NBSP + "%")}), Marge ${delta(x.dM / 1000, 1)} Tsd. € (${delta(x.dMp, 1, NBSP + "%")}); gesamt ${kopf}`,
        `${x.label}: Umsatz ${delta(x.dRp, 1, NBSP + "%")}, Marge ${delta(x.dM / 1000, 1)} Tsd. € (${delta(x.dMp, 1, NBSP + "%")})`], 992);
    }
    const verlierer = gs.filter(g => Math.round(g.dM) < 0).sort((a, b) => a.dM - b.dM);      // auf ganze € gerundet
    const gewinner = gs.filter(g => Math.round(g.dM) > 0).sort((a, b) => b.dM - a.dM);
    const k = [];
    if (verlierer.length && gewinner.length) {
      k.push(`${kopf}: Marge sinkt in ${verlierer.length} von ${gs.length} ${d.plural}, am stärksten bei ${verlierer[0].label} (${delta(verlierer[0].dM / 1000, 1)} Tsd. €); größter Zuwachs ${gewinner[0].label} (${delta(gewinner[0].dM / 1000, 1)})`);
      k.push(`${kopf}: Marge sinkt in ${verlierer.length} von ${gs.length} ${d.plural}, am stärksten bei ${verlierer[0].label} (${delta(verlierer[0].dM / 1000, 1)} Tsd. €)`);
    } else if (verlierer.length) {
      k.push(`${kopf}: Marge sinkt in allen ${d.plural}, am stärksten bei ${verlierer[0].label} (${delta(verlierer[0].dM / 1000, 1)} Tsd. €)`);
    } else if (gewinner.length) {
      k.push(`${kopf}: Marge steigt in ${gewinner.length === gs.length ? "allen" : gewinner.length + " von " + gs.length} ${d.plural}, am stärksten bei ${gewinner[0].label} (${delta(gewinner[0].dM / 1000, 1)} Tsd. €)`);
    }
    k.push(kopf);
    return passt(k, 992);
  }

  /* ---------- Tabelle Ist | Simulation | Abweichung ---------- */
  const SP = [
    { key: "label", titel: "", breite: 172, typ: "text0" },
    { key: "V", titel: "Menge", breite: 68, fmt: v => zahl(v) },
    { key: "R", titel: "Umsatz", breite: 78, fmt: tsd },
    { key: "M", titel: "Marge", breite: 78, fmt: tsd, id: "sp-marge-ist" },
    { key: "NV", titel: "Menge", breite: 68, fmt: v => zahl(v), id: "sp-menge-sim" },
    { key: "NR", titel: "Umsatz", breite: 78, fmt: tsd },
    { key: "NM", titel: "Marge", breite: 78, fmt: tsd },
    { key: "dR", titel: "Umsatz", breite: 140, typ: "delta", richtung: 1, nk: 1, textBreite: 62, id: "sp-dumsatz" },
    { key: "dM", titel: "Marge", breite: 140, typ: "delta", richtung: 1, nk: 1, textBreite: 56, id: "sp-dmarge" },
    { key: "dMp", titel: "Marge %", breite: 92, fmt: v => delta(v, 1, NBSP + "%"), id: "sp-dmargep" },
  ];
  const GRUPPEN = [["Ist " + DATA.stand, 1, 3, "gr-ist"], ["Simulation", 4, 6, "gr-sim"], ["Simulation zu Ist", 7, 9, "gr-delta"]];

  function tabelle(gs, ges) {
    const d = DIM[S.dim];
    const v = DK.visual(bTab, { titel: `Was-wäre-wenn-Rechnung je ${d.name}`, einheit: "Menge in Stück, Werte in Tsd. €", botschaft: botschaft(gs, ges) });
    const f = v.flaeche;
    let x = 0;
    const xs = SP.map(s => { const a = x; x += s.breite; return a; });
    GRUPPEN.forEach(([text, a, b, id]) => el("div", { class: "wi-gruppe", id, style: `left:${xs[a] + 8}px;width:${xs[b] + SP[b].breite - xs[a] - 8}px` }, f, text));
    const tz = el("div", { style: "position:absolute;left:0;right:0;top:22px" }, f);
    const zeilen = sortiert(gs).map(g => ({ key: g.key, label: g.label,
      werte: { V: g.V, R: g.R, M: g.M, NV: g.NV, NR: g.NR, NM: g.NM, dR: g.dR / 1000, dM: g.dM / 1000, dMp: g.dMp } }));
    DK.matrix(tz, {
      spalten: SP.map((s, i) => (i === 0 ? { ...s, titel: d.name, typ: undefined } : s)),
      zeilen, zeilenhoehe: S.dim === 0 ? 19 : 24, auswahl: S.auswahl, onClick: auswaehlen,
      sortierung: S.sort ? { key: S.sort.key, ab: S.sort.ab } : null, onSort: sortieren,
      tooltip: z => {
        const g = gs.find(y => y.key === z.key);
        return [g.label, `Ist: Menge ${zahl(g.V)} · Umsatz ${eur(g.R)} · Kosten ${eur(g.C)} · Marge ${eur(g.M)}`,
          `Simulation: Menge ${zahl(g.NV)} · Umsatz ${eur(g.NR)} · Kosten ${eur(g.NC)} · Marge ${eur(g.NM)}`,
          `Δ Umsatz ${delta(g.dR, 0)} € (${delta(g.dRp, 1, NBSP + "%")}) · Δ Marge ${delta(g.dM, 0)} € (${g.dMp == null ? "–" : delta(g.dMp, 1, NBSP + "%")})`,
          `Effekte: Menge ${delta(g.eff[0], 0)} · Preis ${delta(g.eff[1], 0)} · Stückkosten ${delta(g.eff[2], 0)} €`,
          g.M < 0 ? "Negative Marge: Δ % bezogen auf den Betrag der Marge" : "",
          "Klick filtert Kennzahlen und Margeneffekte"];
      } });
    // Zeilenkopf: Dimension; Spalte 1 linksbündig
    const th0 = tz.querySelector("th");
    if (th0) th0.id = "sp-dimension";
  }

  /* ---------- Zeichnen ---------- */
  function zeichnen() {
    const gs = gruppen(), ges = gesamt(gs), d = DIM[S.dim];
    if (S.auswahl !== null && !gs.some(g => g.key === S.auswahl)) S.auswahl = null;
    const sel = S.auswahl === null ? ges : gs.find(g => g.key === S.auswahl);
    REGLER.forEach(r => { r.inp.value = S[r.t.key]; r.wert.textContent = pz(S[r.t.key]); });
    DK.kopf(bKopf, { titel: "What-If-Simulation: Umsatz und Marge",
      untertitel: `Basis Ist ${DATA.stand} · Analyse nach ${d.name}${S.auswahl === null ? "" : " · Auswahl " + sel.label} · Simulation gegen Ist (ΔIst)`,
      quelle: "", legende: [[FARBE.gut, "günstig"], [FARBE.schlecht, "ungünstig"]] });
    const kpi = (label, wert, nk, einheit, dWert, dnk, suffix) => ({ label, wert: zahl(wert, nk), einheit, bezug: "ΔIst",
      delta: dWert == null ? "–" : delta(dWert, dnk, suffix), klasse: dWert == null ? "neutral" : wirkung(dWert, 1, dnk) });
    DK.kpis(bKpi, [
      kpi("Absatzmenge", sel.NV, 0, "Stück", proz(sel.NV, sel.V), 1, NBSP + "%"),
      kpi("Umsatz", sel.NR / 1000, 1, "Tsd. €", sel.dRp, 1, NBSP + "%"),
      kpi("Marge", sel.NM / 1000, 1, "Tsd. €", sel.dMp, 1, NBSP + "%"),
      kpi("Margenquote", sel.NR ? sel.NM / sel.NR * 100 : 0, 1, "%", sel.NR && sel.R ? (sel.NM / sel.NR - sel.M / sel.R) * 100 : null, 1, NBSP + "%-Pkt."),
    ]);
    bKpi.querySelectorAll(".dk-kpi").forEach((c, i) => {
      c.id = "kpi-" + i;
      tooltip(c, () => [["Absatzmenge", "Umsatz", "Marge", "Margenquote"][i] + (S.auswahl === null ? " gesamt" : " · " + sel.label),
        i === 0 ? `Ist ${zahl(sel.V)} Stück → Simulation ${zahl(sel.NV)} Stück` : i === 1 ? `Ist ${eur(sel.R)} → Simulation ${eur(sel.NR)} (${delta(sel.dR, 0)} €)`
          : i === 2 ? `Ist ${eur(sel.M)} → Simulation ${eur(sel.NM)} (${delta(sel.dM, 0)} €)`
          : `Ist ${zahl(sel.M / sel.R * 100, 1)} % → Simulation ${zahl(sel.NM / sel.NR * 100, 1)} %`]);
    });
    effekte(sel);
    tabelle(gs, ges);
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  /* ---------- Lernplattform: Designregeln, Nachbau, Tabellen, CSV ---------- */
  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "v-tabelle", anker: "links", versatz: [604, 2], regel: "SAY – Botschaft vermitteln", titel: "Ergebnis der Simulation in einem Satz",
        text: "Unter dem Titel steht, was die Annahmen bewirken: Umsatz −10,8 %, Marge +1,0 %, und wo die Marge am stärksten sinkt. Der Satz rechnet bei jeder Reglerstellung neu. Das Original hatte nur die Überschrift „What if Analysis“." },
      { nr: 2, ziel: "regler-menge", anker: "links", versatz: [122, 0], regel: "EXPRESS – Passende Bedienelemente", titel: "Schieberegler statt Optionslisten",
        text: "Absatzmenge, Verkaufspreis und Stückkosten werden mit Reglern von −20 % bis +20 % in 5-%-Schritten gesetzt, der Wert steht daneben. Das Original nutzte drei Listen mit je neun Optionsfeldern, die den halben Bildschirm belegten." },
      { nr: 3, ziel: "v-effekte", anker: "links", versatz: [232, 2], regel: "CONDENSE – Ursachen zeigen", titel: "Margeneffekte zerlegt",
        text: "Warum steigt die Marge, obwohl der Umsatz sinkt? Die Zerlegung zeigt es: Der Mengenrückgang kostet 385 Tsd. €, Preis- und Kosteneffekt bringen 260 und 151 Tsd. € zurück. Das Original zeigte nur Ergebnisspalten." },
      { nr: 4, ziel: "kpis", anker: "links", versatz: [140, 4], regel: "CONDENSE – Kennzahlen bündeln", titel: "Gesamtwerte oben, Margenquote neu",
        text: "Absatzmenge, Umsatz und Marge der Simulation stehen mit ihrer Abweichung zum Ist in der KPI-Leiste; sie ersetzt die Summenzeile der Tabelle. Neu ist die Margenquote (42,0 % → 47,5 %). Ein Klick auf eine Zeile zeigt die Werte dieser Zeile." },
      { nr: 5, ziel: "sp-dmarge", anker: "links", versatz: [120, 2], regel: "UNIFY – Semantische Notation", titel: "Abweichung als Balken nach Wirkung",
        text: "Abweichungen stehen als Balken an einer Nulllinie, blaugrün günstig, rot ungünstig, ein Maßstab je Spalte. Das Original füllte ganze Zellen rot und grün – auch für die Umsatzänderung, die in jeder Zeile gleich −10,8 % beträgt; dieser Prozentwert steht jetzt nur in der KPI-Leiste." },
      { nr: 6, ziel: "sp-dmargep", anker: "links", versatz: [26, 2], regel: "CHECK – Richtige Prozentwerte", titel: "Prozent bei negativer Basis",
        text: "Bei den alkoholischen Getränken steigt die Marge von −79,7 auf −58,8 Tsd. € – eine Verbesserung. Das Original wies −26,2 % aus, weil es durch die negative Marge teilte. Hier bezieht sich die Veränderung auf den Betrag der Basis: +26,2 %." },
      { nr: 7, ziel: "gr-sim", anker: "links", versatz: [188, -1], regel: "STRUCTURE – Inhalte ordnen", titel: "Ist | Simulation | Abweichung",
        text: "Die Spalten sind in drei Gruppen mit Überschrift geordnet; die Warengruppen stehen nach Umsatz statt nach der zufälligen Margenänderung, ein Klick auf einen Spaltenkopf sortiert. Die Dimension (Warengruppe, Region, Kundensegment) wird oben gewählt, wie im Original." },
      { nr: 8, ziel: "kopf-titel", anker: "links", versatz: [444, 4], regel: "SIMPLIFY – Überflüssiges weglassen", titel: "Ohne Browser, Logo und Reiter",
        text: "Browserfenster, Logo, Reiterleiste, Lesezeichen, Schaltflächen „Lock/Unlock“ und die Schnellsuche entfallen; Jahr und Monat stehen als Basis im Untertitel. Beträge in Tsd. € mit einer Nachkommastelle statt Dollar-Beträgen; die genauen Werte stehen im Tooltip." },
    ],
    nachbauIntro: "Seitengröße benutzerdefiniert 1024 × 646 px. Schrift Arial: Beschriftungen 10,5 pt, Visualtitel 12 pt, KPI-Werte 19,5 pt, Berichtstitel 16,5 pt. Datenmodell: Faktentabelle (Warengruppe, Region, Kundensegment, Menge, Umsatz, Marge) wie in der CSV-Datei, dazu drei Was-wäre-wenn-Parameter. Kosten = Umsatz − Marge.",
    nachbau: [
      { id: "A", ziel: "regler-preis", anker: "links", versatz: [122, 0], titel: "Annahmen (3×)", visual: "Was-wäre-wenn-Parameter mit Datenschnitt",
        felder: "Modellierung › Neuer Parameter › Numerischer Bereich: −0,20 bis 0,20, Schrittweite 0,05, Standard −0,15 / 0,05 / −0,05; erzeugt Tabelle und Measure „Absatzmenge Wert“ = SELECTEDVALUE(…)",
        format: "Datenschnitt „Einzelner Wert“ (Schieberegler), Format Prozent ohne Nachkommastelle; Kopfzeile 10,5 pt #4D4D4D" },
      { id: "B", ziel: "kpis", anker: "links", versatz: [140, 4], titel: "Kennzahlen der Simulation", visual: "Karte (neu) mit Referenzbeschriftung",
        felder: "Umsatz Sim = SUMX( Fakten; Fakten[Umsatz] * (1 + [Absatzmenge Wert]) * (1 + [Verkaufspreis Wert]) ); Kosten Sim = SUMX( Fakten; (Fakten[Umsatz] − Fakten[Marge]) * (1 + [Absatzmenge Wert]) * (1 + [Stückkosten Wert]) ); Marge Sim = [Umsatz Sim] − [Kosten Sim]",
        format: "Referenzbeschriftung „ΔIst“ = DIVIDE( [Marge Sim] − [Marge]; ABS( [Marge] ) ); Farbe über bedingte Formatierung #00806B / #C62828" },
      { id: "C", ziel: "v-effekte", anker: "links", versatz: [232, 2], titel: "Margeneffekte", visual: "Gruppiertes Balkendiagramm",
        felder: "Achse: Hilfstabelle Effekt (Absatzmenge, Verkaufspreis, Stückkosten); Wert: SWITCH( SELECTEDVALUE( Effekt[Effekt] ); \"Absatzmenge\"; [Marge] * [Absatzmenge Wert]; \"Verkaufspreis\"; [Umsatz] * (1 + [Absatzmenge Wert]) * [Verkaufspreis Wert]; −[Kosten] * (1 + [Absatzmenge Wert]) * [Stückkosten Wert] )",
        format: "Balkenfarbe bedingt nach Vorzeichen (#00806B / #C62828), Datenbeschriftung links, Achsen aus" },
      { id: "D", ziel: "v-tabelle", anker: "links", versatz: [604, 2], titel: "Was-wäre-wenn-Rechnung", visual: "Matrix",
        felder: "Zeilen: Feldparameter Dimension (Warengruppe, Region, Kundensegment); Werte: Menge, Umsatz, Marge, Menge Sim, Umsatz Sim, Marge Sim, Δ Umsatz, Δ Marge, Δ Marge %",
        format: "Spaltengruppen über Berechnungsgruppe oder Textfelder; Δ-Spalten mit Datenbalken: je zwei Measures „Δ günstig“/„Δ ungünstig“ (#00806B / #C62828); Zeilenhöhe kompakt",
        hinweis: "Δ Marge % = DIVIDE( [Marge Sim] − [Marge]; ABS( [Marge] ) ) – mit ABS, sonst kehrt sich das Vorzeichen bei negativer Marge um." },
      { id: "E", ziel: "filter", anker: "links", versatz: [126, -2], titel: "Dimension der Analyse", visual: "Datenschnitt (Dropdown) auf einem Feldparameter",
        felder: "Modellierung › Neuer Parameter › Felder: Warengruppe, Region, Kundensegment", format: "Einfachauswahl, Kopfzeile links oben" },
    ],
    theme: DK.thema(),
    csv: { name: "what_if_simulation_daten.csv", text: () => {
      const d = v => v.toFixed(2).replace(".", ",");
      const k = ["Periode;Warengruppe;Region;Kundensegment;Menge_Stueck;Umsatz_EUR;Marge_EUR;Kosten_EUR"];
      Z.forEach(([w, r, s, m, u, g]) => k.push(["2026-07", DATA.warengruppen[w], DATA.regionen[r], DATA.segmente[s], m, d(u), d(g), d(u - g)].join(";")));
      return k.join("\r\n"); } },
    tabellen: () => {
      const gs = gruppen(), ges = gesamt(gs), d = DIM[S.dim];
      const zeile = g => [g.label, zahl(g.V), tsd(g.R), tsd(g.M), zahl(g.NV), tsd(g.NR), tsd(g.NM), delta(g.dR / 1000, 1), delta(g.dM / 1000, 1),
        g.dMp == null ? "–" : delta(g.dMp, 1, NBSP + "%")];
      return [
        { titel: "Annahmen", kopf: ["Treiber", "Veränderung"], zeilen: TREIBER.map(t => [t.label, pz(S[t.key])]) },
        { titel: `Was-wäre-wenn-Rechnung je ${d.name} (Menge in Stück, Werte in Tsd. €)`,
          kopf: [d.name, "Menge Ist", "Umsatz Ist", "Marge Ist", "Menge Sim.", "Umsatz Sim.", "Marge Sim.", "Δ Umsatz", "Δ Marge", "Δ Marge %"],
          zeilen: sortiert(gs).map(zeile).concat([zeile({ ...ges, label: "Summe" })]) },
        { titel: "Margeneffekte gesamt (Tsd. €)", kopf: ["Effekt", "Wert"],
          zeilen: TREIBER.map((t, i) => [t.effekt, delta(ges.eff[i] / 1000, 1)]).concat([["Δ Marge", delta(ges.dM / 1000, 1)]]) },
      ];
    },
  });
  zeichnen();
})();
