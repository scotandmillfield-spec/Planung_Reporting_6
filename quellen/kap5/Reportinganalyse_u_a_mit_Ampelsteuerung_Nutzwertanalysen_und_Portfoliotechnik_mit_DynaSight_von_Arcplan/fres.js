/* Abb. 5.42 – Dashboard „Frühwarn-, Risiko- und Erfolgsreporting“ (Projektcontrolling): Reportinganalyse mit
   Ampelsteuerung, Nutzwertanalyse und Portfoliotechnik (softwareneutraler Nachbau von vier Bildschirmen einer
   BI-Anwendung). Seite 1024 x 646 px. Daten: fres.json (daten_fres.py).
   Aufbau: oben die Spitzenkennzahlen der fünf Projekte mit Ampel je Kennzahl (barrierearm wie Abb. 3.64: Farbe, Form,
   Zeichen und Helligkeit), unten die Soft Facts des gewählten Projekts als Nutzwertanalyse (Profil 1–5 mit Gewichten),
   das Portfolio Kosten-/Terminabweichung der Projekte und das Marktportfolio der Produktfelder.
   Datenschnitt Periode (Jan–Apr 2027) und Projekt; Klick auf ein Projekt (Zeile, Kreis) wählt es in allen Visuals,
   Klick auf ein Kriterium oder Produktfeld hebt es hervor, Klick auf einen Spaltenkopf sortiert, Esc hebt auf. */
(() => {
  "use strict";
  const { zahl, delta, NBSP, sv, el, tw, PRINT } = DK;
  const D = DATA, PR = D.projekte, KR = D.kriterien, FE = D.felder, MON = D.monate, JAHR = D.jahr;
  const MLANG = ["Januar", "Februar", "März", "April"];
  const AMBER = "#E8A317", AMBER_D = "#8A6100", ROT = "#C62828", GRAU = "#8F8F8F";
  const STUFEN = { gut: "im Ziel", warn: "beobachten", krit: "kritisch" };
  const passt = (k, b) => k.find(t => tw(t) <= b) || k[k.length - 1];
  const pz = (v, nk = 1) => zahl(v, nk) + NBSP + "%";

  /* ---------- Kennzahlen und Ampelregeln ---------- */
  const nutzwert = p => KR.reduce((s, k, i) => s + k[1] * p.sf[i], 0) / 100;
  const kostenRegel = (v, p) => (v / p.pw <= 0.01 ? "gut" : v / p.pw <= 0.02 ? "warn" : "krit");
  const KOSTEN_SCHWELLE = "im Ziel ≤ 1 % des Projektwerts · beobachten ≤ 2 % · kritisch > 2 %";
  const GRUPPEN = ["Eckwerte", "Angebotsphase", "Projektphase"];
  const SP = [
    { key: "pw", g: 0, kopf: ["Projekt-", "wert"], einheit: "Tsd. €", nk: 0, wert: p => p.pw, lang: "Projektwert (Prognose)" },
    { key: "erg", g: 0, kopf: ["Projekt-", "ergebnis"], einheit: "Tsd. €", nk: 0, wert: (p, i) => p.erg[i], lang: "Projektergebnis (Prognose)" },
    { key: "sf", g: 1, kopf: ["Soft", "Facts"], einheit: "Ø 1–5", nk: 2, wert: p => nutzwert(p), lang: "Soft Facts: Nutzwert (gewichtete Punkte, 1 günstig … 5 ungünstig)",
      regel: v => (v <= 2.5 ? "gut" : v <= 3 ? "warn" : "krit"), schwelle: "im Ziel ≤ 2,5 · beobachten ≤ 3,0 · kritisch > 3,0 Punkte" },
    { key: "dbaw", g: 1, kopf: ["", "DB/AW"], einheit: "%", nk: 1, wert: p => p.dbaw, lang: "Deckungsbeitrag / Auftragswert (Angebotskalkulation)",
      regel: v => (v >= 3 ? "gut" : v >= 1 ? "warn" : "krit"), schwelle: "im Ziel ≥ 3 % · beobachten ≥ 1 % · kritisch < 1 %" },
    { key: "dbpw", g: 2, kopf: ["", "DB/PW"], einheit: "%", nk: 1, wert: (p, i) => p.erg[i] / p.pw * 100, lang: "Auftragserfolg: Deckungsbeitrag / Projektwert (Prognose)",
      regel: v => (v >= 10 ? "gut" : v >= 5 ? "warn" : "krit"), schwelle: "im Ziel ≥ 10 % · beobachten ≥ 5 % · kritisch < 5 %" },
    { key: "cf", g: 2, kopf: ["Cash-", "flow"], einheit: "Tsd. €", nk: 0, wert: (p, i) => p.cf[i], lang: "Finanzen: Cashflow kumuliert (Ist)",
      regel: (v, p) => (v / p.pw >= 0.05 ? "gut" : v >= 0 ? "warn" : "krit"), schwelle: "im Ziel ≥ 5 % des Projektwerts · beobachten ≥ 0 · kritisch < 0" },
    { key: "delk", g: 2, kopf: ["", "ΔELK"], einheit: "Tsd. €", nk: 0, wert: (p, i) => p.delk[i], lang: "Wertschöpfung: Δ Eigenleistungskosten (Prognose − Arbeitskalkulation)",
      regel: kostenRegel, schwelle: KOSTEN_SCHWELLE },
    { key: "dflk", g: 2, kopf: ["", "ΔFLK"], einheit: "Tsd. €", nk: 0, wert: (p, i) => p.dflk[i], lang: "Fremdleistung: Δ Fremdleistungskosten (Prognose − Arbeitskalkulation)",
      regel: kostenRegel, schwelle: KOSTEN_SCHWELLE },
    { key: "drisk", g: 2, kopf: ["ΔRisiko-", "vorsorge"], einheit: "Tsd. €", nk: 0, wert: (p, i) => p.drisk[i], lang: "Chance/Risiko: Δ Risikovorsorge (Prognose − Arbeitskalkulation)",
      regel: kostenRegel, schwelle: KOSTEN_SCHWELLE },
    { key: "tv", g: 2, kopf: ["Termin-", "verzug"], einheit: "Tage", nk: 0, wert: (p, i) => p.tv[i], lang: "Projektfortschritt: Terminverzug gesamt (Prognose)",
      regel: v => (v <= 14 ? "gut" : v <= 60 ? "warn" : "krit"), schwelle: "im Ziel ≤ 14 Tage · beobachten ≤ 60 · kritisch > 60" },
  ];
  const stufe = (s, p, i) => (s.regel ? s.regel(s.wert(p, i), p) : null);
  const signale = (p, i) => SP.filter(s => s.regel).map(s => ({ s, st: stufe(s, p, i) }));
  const kostenRel = (p, i) => (p.delk[i] + p.dflk[i] + p.drisk[i]) / p.pw * 100;
  const zeitRel = (p, i) => p.tv[i] / p.dauer * 100;
  const feldProjekte = f => PR.map((p, j) => j).filter(j => PR[j].feld === f);

  /* ---------- Zustand ---------- */
  const S = { m: MON.length - 1, projekt: null, krit: null, feld: null, sort: null };
  const auswahlWeg = () => { S.projekt = null; S.krit = null; S.feld = null; };
  addEventListener("keydown", e => {
    if (e.key === "Escape" && (S.projekt !== null || S.krit !== null || S.feld !== null)) { auswahlWeg(); zeichnen(); }
  });
  const sfProjekt = () => (S.projekt !== null ? S.projekt : 0);       // Soft Facts ohne Auswahl: erstes Projekt (wie im Original)
  const aktiv = j => (S.projekt === null || S.projekt === j) && (S.feld === null || PR[j].feld === S.feld);

  /* ---------- Layout (Seite 1024 x 646) ---------- */
  DK.init({ titel: "Frühwarn-, Risiko- und Erfolgsreporting" });
  const seite = document.getElementById("seite");
  const bKopf = DK.box("kopf", 16, 10, 992, 46);
  DK.haarlinie(62);
  const bFilter = DK.box("filter", 16, 68, 992, 50, "dk-filter");
  const bAmpel = DK.box("v-ampel", 16, 128, 992, 224);
  DK.haarlinie(360);
  const bSf = DK.box("v-softfacts", 16, 368, 320, 274);
  const bAbg = DK.box("v-abgleich", 352, 368, 320, 274);
  const bStr = DK.box("v-strategie", 688, 368, 320, 274);
  [344, 680].forEach(x => el("div", { style: `position:absolute;left:${x}px;top:368px;height:274px;border-left:1px solid var(--linie)` }, seite));
  DK.el("style", {}, document.head, `
    table.fr-tab { border-collapse: collapse; table-layout: fixed; width: 992px; font-size: 14px; }
    .fr-tab th { font-weight: normal; color: var(--muted); padding: 0 6px; line-height: 16px; text-align: right; white-space: nowrap; }
    .fr-tab th.fr-lab, .fr-tab td:first-child { text-align: left; padding-left: 0; }
    .fr-tab tr.fr-gruppe th { color: var(--text); font-weight: bold; text-align: center; height: 18px; vertical-align: top; }
    .fr-tab tr.fr-gruppe th.fr-g { border-bottom: 1px solid #BDBDBD; }
    .fr-tab tr.fr-name th { height: 32px; vertical-align: bottom; }
    .fr-tab tr.fr-einheit th { height: 16px; font-size: 14px; border-bottom: 1px solid var(--ac); vertical-align: bottom; padding-bottom: 2px; }
    .fr-tab td { height: 22px; padding: 0 6px; border-bottom: 1px solid #EFEFEF; white-space: nowrap; font-variant-numeric: tabular-nums; }
    .fr-tab .fr-start { border-left: 1px solid #D9D9D9; }
    .fr-tab td .fr-zelle { display: flex; justify-content: space-between; align-items: center; }
    .fr-tab td .fr-zelle.ohne { justify-content: flex-end; }
    .fr-tab td.fr-krit .fr-zelle span { font-weight: bold; }
    .fr-tab tbody tr.dk-zeile { cursor: pointer; }
    .fr-tab tbody tr.dk-zeile:hover td { background: var(--flaeche); }
    .fr-tab tr.dk-blass td { opacity: .32; }
    .fr-tab th.dk-sortierbar { cursor: pointer; }
    .fr-tab th.dk-sortierbar:hover { color: var(--text); text-decoration: underline; }`);

  /* ---------- Tooltip ---------- */
  const tip = document.querySelector(".dk-tooltip");
  function tooltip(ziel, fn) {
    ziel.addEventListener("pointermove", ev => {
      tip.textContent = "";
      fn(ev).filter(Boolean).forEach((z, i) => el(i === 0 ? "b" : "div", {}, tip, z));
      tip.style.display = "block";
      const r = tip.getBoundingClientRect();
      let x = ev.clientX + 14, y = ev.clientY + 14;
      if (x + r.width > innerWidth - 8) x = ev.clientX - r.width - 14;
      if (y + r.height > innerHeight - 8) y = ev.clientY - r.height - 14;
      tip.style.left = x + "px"; tip.style.top = y + "px";
    });
    ziel.addEventListener("pointerleave", () => { tip.style.display = "none"; });
  }

  /* ---------- Ampelzeichen wie Abb. 3.64: Farbe + Form + Zeichen + Helligkeit ---------- */
  function signal(p, cx, cy, st, gr = 1) {
    const s = gr, g = sv("g", {}, p);
    const linie = (x1, y1, x2, y2, farbe) => sv("line", { x1, y1, x2, y2, style: `stroke:${farbe};stroke-width:2;stroke-linecap:round` }, g);
    if (st === "gut") {
      sv("circle", { cx, cy, r: 7.2 * s, style: "fill:#FFFFFF;stroke:var(--gut);stroke-width:2" }, g);
      sv("polyline", { points: `${cx - 3.6 * s},${cy + 0.3 * s} ${cx - 1 * s},${cy + 2.9 * s} ${cx + 3.8 * s},${cy - 2.8 * s}`,
        style: "fill:none;stroke:var(--gut);stroke-width:2;stroke-linecap:round;stroke-linejoin:round" }, g);
    } else if (st === "warn") {
      sv("polygon", { points: `${cx},${cy - 8.8 * s} ${cx + 9 * s},${cy + 6.8 * s} ${cx - 9 * s},${cy + 6.8 * s}`,
        style: `fill:${AMBER};stroke:${AMBER_D};stroke-width:1;stroke-linejoin:round` }, g);
      linie(cx, cy - 3.4 * s, cx, cy + 1.4 * s, "#1A1A1A"); sv("circle", { cx, cy: cy + 4.3 * s, r: 1.2, style: "fill:#1A1A1A" }, g);
    } else {
      sv("rect", { x: cx - 7 * s, y: cy - 7 * s, width: 14 * s, height: 14 * s, style: `fill:${ROT}` }, g);
      linie(cx - 3.4 * s, cy - 3.4 * s, cx + 3.4 * s, cy + 3.4 * s, "#FFFFFF"); linie(cx - 3.4 * s, cy + 3.4 * s, cx + 3.4 * s, cy - 3.4 * s, "#FFFFFF");
    }
    return g;
  }

  /* ---------- Datenschnitte ---------- */
  DK.schnitt(bFilter, `Periode ${JAHR}`, "knoepfe", { optionen: MON.map((m, i) => [i, m]), wert: S.m,
    onChange: v => { S.m = Number(v); zeichnen(); } });
  const projSel = DK.schnitt(bFilter, "Projekt", "dropdown", { breite: 230, optionen: [["alle", "Alle"], ...PR.map((p, j) => [String(j), p.name])],
    wert: "alle", onChange: v => { auswahlWeg(); S.projekt = v === "alle" ? null : Number(v); zeichnen(); } });
  const projektWaehlen = j => { const neu = S.projekt === j ? null : j; auswahlWeg(); S.projekt = neu; zeichnen(); };

  /* ---------- A: Spitzenkennzahlen mit Ampel ---------- */
  function tabelle(f) {
    const i = S.m, W = [176, ...SP.map(() => (992 - 176) / SP.length)];
    const t = el("table", { class: "fr-tab", id: "fr-tabelle" }, f.flaeche);
    const cg = el("colgroup", {}, t);
    W.forEach(w => el("col", { style: `width:${w}px` }, cg));
    const th = el("thead", {}, t);
    const r1 = el("tr", { class: "fr-gruppe" }, th);
    el("th", { class: "fr-lab" }, r1, "");
    GRUPPEN.forEach((g, gi) => el("th", { class: "fr-g fr-start", colspan: String(SP.filter(s => s.g === gi).length), id: "fr-gruppe-" + gi }, r1, g));
    const r2 = el("tr", { class: "fr-name" }, th), r3 = el("tr", { class: "fr-einheit" }, th);
    const kl = el("th", { class: "fr-lab", rowspan: "2", style: "vertical-align:bottom;border-bottom:1px solid var(--ac);padding-bottom:2px", id: "fr-kopf-projekt" }, r2, "Projekt");
    if (!PRINT) { kl.classList.add("dk-sortierbar"); kl.title = "Klick: ursprüngliche Reihenfolge"; kl.addEventListener("click", () => { S.sort = null; zeichnen(); }); }
    SP.forEach((s, j) => {
      const start = j === 0 || SP[j - 1].g !== s.g ? " fr-start" : "";
      const c = el("th", { class: start.trim(), id: "fr-kopf-" + s.key }, r2);
      c.appendChild(document.createTextNode(s.kopf[0])); el("br", {}, c); c.appendChild(document.createTextNode(s.kopf[1] + (S.sort && S.sort.key === s.key ? (S.sort.ab ? " ▾" : " ▴") : "")));
      el("th", { class: start.trim() }, r3, s.einheit);
      if (!PRINT) {
        c.classList.add("dk-sortierbar"); c.title = "Klick sortiert";
        c.addEventListener("click", () => { S.sort = S.sort && S.sort.key === s.key ? { key: s.key, ab: !S.sort.ab } : { key: s.key, ab: true }; zeichnen(); });
      }
    });
    const tb = el("tbody", {}, t);
    let reihen = PR.map((p, j) => j);
    if (S.sort) { const s = SP.find(x => x.key === S.sort.key); reihen.sort((a, b) => (s.wert(PR[b], i) - s.wert(PR[a], i)) * (S.sort.ab ? 1 : -1)); }
    reihen.forEach(j => {
      const p = PR[j];
      const tr = el("tr", { class: "dk-zeile" + (aktiv(j) ? "" : " dk-blass"), "data-projekt": j }, tb);
      el("td", { style: "font-weight:bold" }, tr, p.name);
      SP.forEach((s, k) => {
        const v = s.wert(p, i), st = stufe(s, p, i), start = k === 0 || SP[k - 1].g !== s.g ? "fr-start" : "";
        const td = el("td", { class: [start, st === "krit" ? "fr-krit" : ""].join(" ").trim(), "data-sp": k }, tr);
        const z = el("div", { class: "fr-zelle" + (st ? "" : " ohne") }, td);
        if (st) { const g = sv("svg", { width: 18, height: 18, style: "overflow:visible;flex:none" }, z); signal(g, 8, 9, st, 0.82); }
        el("span", {}, z, zahl(v, s.nk));
      });
      tr.addEventListener("click", () => projektWaehlen(j));
      tooltip(tr, ev => {
        const td = ev.target.closest ? ev.target.closest("td") : null, k = td && td.dataset.sp !== undefined ? +td.dataset.sp : null;
        const sig = signale(p, i), nK = sig.filter(x => x.st === "krit").length, nW = sig.filter(x => x.st === "warn").length;
        const zeilen = [`${p.name} · ${MLANG[i]} ${JAHR}`];
        if (k !== null) {
          const s = SP[k], v = s.wert(p, i), st = stufe(s, p, i);
          zeilen.push(`${s.lang}: ${zahl(v, s.nk)}${s.einheit.startsWith("Ø") ? " Punkte" : NBSP + s.einheit}`);
          if (["cf", "delk", "dflk", "drisk"].includes(s.key)) zeilen.push(`${pz(v / p.pw * 100)} des Projektwerts`);
          if (i > 0 && s.key !== "pw" && s.key !== "dbaw" && s.key !== "sf") zeilen.push(`Vormonat ${zahl(s.wert(p, i - 1), s.nk)} (${STUFEN[stufe(s, p, i - 1)] || "ohne Ampel"})`);
          if (st) zeilen.push(`Ampel: ${STUFEN[st]} (${s.schwelle})`);
        }
        zeilen.push(`${nK} kritisch, ${nW} beobachten, ${sig.length - nK - nW} im Ziel`, "Klick wählt das Projekt in allen Visuals");
        return zeilen;
      });
    });
  }
  function botschaftTabelle() {
    const i = S.m, B = 988;
    if (S.projekt !== null) {
      const p = PR[S.projekt], sig = signale(p, i), k = sig.filter(x => x.st === "krit"), w = sig.filter(x => x.st === "warn");
      return passt([`${p.name}: ${k.length} von ${sig.length} Kennzahlen kritisch${k.length ? " (" + k.map(x => x.s.kopf.join("").replace("-", "")).join(", ") + ")" : ""}, ${w.length} beobachten`,
        `${p.name}: ${k.length} kritisch, ${w.length} beobachten`], B);
    }
    const alle = PR.flatMap((p, j) => signale(p, i).map(x => ({ ...x, j })));
    const krit = alle.filter(x => x.st === "krit");
    const je = PR.map((p, j) => krit.filter(x => x.j === j).length), top = je.indexOf(Math.max(...je));
    let neu = [];
    if (i > 0) neu = PR.flatMap((p, j) => signale(p, i).filter(x => x.st === "krit" && stufe(x.s, p, i - 1) !== "krit").map(x => `${p.kurz} ${x.s.kopf.join("").replace("-", "")}`));
    const teil = `${krit.length} von ${alle.length} Signalen kritisch, ${je[top]} davon bei ${PR[top].name}`;
    return passt([neu.length ? `${teil}; neu kritisch seit ${MLANG[i - 1]}: ${neu.join(", ")}` : `${teil}; keine neuen kritischen Signale`, teil], B);
  }

  /* ---------- B: Soft Facts als Nutzwertanalyse ---------- */
  function softfacts(f) {
    const W = f.breite, H = f.hoehe, p = PR[sfProjekt()], nw = nutzwert(p);
    const svg = sv("svg", { width: W, height: H, role: "img", id: "sf-profil", "aria-label": `Soft-Facts-Profil ${p.name}` }, f.flaeche);
    const xG = 182, x0 = 192, cw = (W - x0) / 5, kopf = 34, rh = 21, cx = s => x0 + (s - 0.5) * cw;
    const gk = sv("g", { id: "sf-kopf" }, svg);
    sv("text", { x: x0, y: 8, dy: "0.35em", class: "muted" }, gk, "günstig");
    sv("text", { x: W, y: 8, dy: "0.35em", "text-anchor": "end", class: "muted" }, gk, "ungünstig");
    sv("text", { x: 0, y: 25, dy: "0.35em", class: "muted" }, gk, "Kriterium");
    sv("text", { x: xG, y: 25, dy: "0.35em", "text-anchor": "end", class: "muted" }, gk, "Gew.");
    [1, 2, 3, 4, 5].forEach(s => sv("text", { x: cx(s), y: 25, dy: "0.35em", "text-anchor": "middle", class: "muted" }, gk, String(s)));
    sv("line", { x1: 0, x2: W, y1: kopf + 0.5, y2: kopf + 0.5, stroke: "#3A3F44", "stroke-width": 1 }, svg);
    const yE = kopf + KR.length * rh;
    [1, 2, 3, 4, 5].forEach(s => sv("line", { x1: cx(s), x2: cx(s), y1: kopf + 2, y2: yE, stroke: "#E3E3E3", "stroke-width": 1 }, svg));
    // Nutzwert als gestrichelte Linie über alle Kriterien
    sv("line", { x1: cx(nw), x2: cx(nw), y1: kopf + 2, y2: yE + rh / 2 - 8, stroke: GRAU, "stroke-width": 1.5, "stroke-dasharray": "3 3" }, svg);
    const pts = p.sf.map((s, r) => [cx(s), kopf + r * rh + rh / 2]);
    sv("polyline", { points: pts.map(q => q.join(",")).join(" "), fill: "none", stroke: "#3A3F44", "stroke-width": 1.5,
                     class: S.krit !== null ? "dk-blass" : "" }, svg);
    KR.forEach((k, r) => {
      const y = kopf + r * rh, s = p.sf[r], st = s <= 2 ? "gut" : s === 3 ? "warn" : "krit";
      const g = sv("g", { class: "dk-klick" + (S.krit !== null && S.krit !== r ? " dk-blass" : ""), "data-name": k[0] }, svg);
      if (r < KR.length - 1) sv("line", { x1: 0, x2: x0 - 6, y1: y + rh - 0.5, y2: y + rh - 0.5, stroke: "#EFEFEF", "stroke-width": 1 }, g);
      sv("text", { x: 0, y: y + rh / 2, dy: "0.35em", style: st === "krit" ? "font-weight:bold" : "" }, g, k[0]);
      sv("text", { x: xG, y: y + rh / 2, dy: "0.35em", "text-anchor": "end", class: "muted" }, g, k[1] + NBSP + "%");
      signal(g, cx(s), y + rh / 2, st, 0.72);
      const hit = sv("rect", { x: 0, y, width: W, height: rh, fill: "transparent" }, g);
      hit.addEventListener("click", () => { const neu = S.krit === r ? null : r; S.krit = neu; S.feld = null; zeichnen(); });
      tooltip(hit, () => [`${k[0]} · ${p.name}`, `${s} Punkte: ${s === 1 ? k[2] : s === 5 ? k[3] : s === 3 ? "ausgewogen" : s < 3 ? "eher " + k[2] : "eher " + k[3]}`,
        `Skala 1 = ${k[2]} (günstig) … 5 = ${k[3]} (ungünstig)`, `Gewicht ${k[1]} % · Beitrag ${zahl(k[1] * s / 100, 2)} Punkte zum Nutzwert`,
        "Klick hebt das Kriterium hervor"]);
    });
    // Ergebniszeile: Nutzwert mit Ampel der Spalte „Soft Facts“
    const gs = sv("g", { id: "sf-nutzwert" }, svg), yN = yE + rh / 2, stN = SP[2].regel(nw);
    sv("line", { x1: 0, x2: W, y1: yE + 0.5, y2: yE + 0.5, stroke: "#3A3F44", "stroke-width": 1 }, gs);
    sv("text", { x: 0, y: yN, dy: "0.35em", style: "font-weight:bold" }, gs, "Nutzwert");
    sv("text", { x: xG, y: yN, dy: "0.35em", "text-anchor": "end", class: "muted" }, gs, "100" + NBSP + "%");
    signal(gs, cx(nw), yN, stN, 0.72);
    const txt = zahl(nw, 2), rechts = cx(nw) + 12 + tw(txt, 14, true) <= W;
    sv("text", { x: rechts ? cx(nw) + 12 : cx(nw) - 12, y: yN, dy: "0.35em", "text-anchor": rechts ? "start" : "end", style: "font-weight:bold" }, gs, txt);
    return { p, nw, stN };
  }
  function botschaftSf(r) {
    if (S.krit !== null) {
      const k = KR[S.krit], s = r.p.sf[S.krit];
      return passt([`${k[0]}: ${s} Punkte (${s === 1 ? k[2] : s === 5 ? k[3] : s === 3 ? "ausgewogen" : s < 3 ? "eher " + k[2] : "eher " + k[3]}), Gewicht ${k[1]} %`, `${k[0]}: ${s} Punkte`], 320);
    }
    const max = Math.max(...r.p.sf), schlecht = KR.filter((k, i) => r.p.sf[i] === max).map(k => k[0]);
    return passt([`${r.p.name}: Nutzwert ${zahl(r.nw, 2)}, ${STUFEN[r.stN]}`, `${r.p.kurz}: ${zahl(r.nw, 2)} Punkte, ${STUFEN[r.stN]}`,
      `${schlecht[0]} ${max} Punkte`], 320);
  }

  /* ---------- C: Portfolio Kosten-/Terminabweichung (Strategieabgleich) ---------- */
  function abgleich(f) {
    const i = S.m;
    DK.streuung(f.flaeche, { breite: f.breite, hoehe: f.hoehe, rMax: 17, rMin: 4,
      punkte: PR.map((p, j) => ({ key: j, x: zeitRel(p, i), y: kostenRel(p, i), g: p.pw, label: p.kurz })),
      x: { min: -10, max: 60, ticks: [0, 20, 40, 60], titel: "Terminverzug in % der Dauer", fmt: v => zahl(v) },
      y: { min: -20, max: 70, ticks: [-20, 0, 20, 40, 60], titel: "Kostenabweichung in % des Projektwerts", fmt: v => zahl(v) },
      linien: { x: 0, y: 0 }, felder: [{ ecke: "or", text: "teurer, später" }, { ecke: "ur", text: "günstiger, später" }],
      auswahl: pt => aktiv(pt.key), onClick: j => projektWaehlen(j),
      tooltip: pt => { const p = PR[pt.key]; return [`${p.name} · ${MLANG[i]} ${JAHR}`,
        `Kostenabweichung ${delta(pt.y, 1, NBSP + "%")} des Projektwerts (ΔELK ${delta(p.delk[i], 0)}, ΔFLK ${delta(p.dflk[i], 0)}, ΔRisikovorsorge ${delta(p.drisk[i], 0)} Tsd. €)`,
        `Terminverzug ${p.tv[i]} von ${p.dauer} geplanten Tagen (${pz(pt.x)})`, `Kreisfläche: Projektwert ${zahl(p.pw)} Tsd. €`, "Klick wählt das Projekt in allen Visuals"]; } });
    const svg = f.flaeche.querySelector("svg");
    svg.id = "ab-portfolio";
  }
  function botschaftAbg() {
    const i = S.m;
    const js = S.projekt !== null ? [S.projekt] : PR.map((p, j) => j);
    if (S.projekt !== null) {
      const p = PR[S.projekt];
      return passt([`${p.kurz}: Kosten ${delta(kostenRel(p, i), 0, NBSP + "%")}, Termine ${delta(zeitRel(p, i), 0, NBSP + "%")}`], 320);
    }
    const beide = js.filter(j => kostenRel(PR[j], i) > 0 && zeitRel(PR[j], i) > 0);
    const w = js.slice().sort((a, b) => kostenRel(PR[b], i) - kostenRel(PR[a], i))[0];
    return passt([`${beide.length} von ${js.length} Projekten teurer und später`, `${PR[w].kurz}: Kosten ${delta(kostenRel(PR[w], i), 0, NBSP + "%")}`], 320);
  }

  /* ---------- D: Marktportfolio der Produktfelder (Strategie) ---------- */
  function strategie(f) {
    DK.streuung(f.flaeche, { breite: f.breite, hoehe: f.hoehe, rMax: 14, rMin: 4,
      punkte: FE.map((fe, k) => { const pj = feldProjekte(k); return { key: k, x: fe[1], y: fe[2], g: fe[3], label: pj.length ? PR[pj[0]].kurz : "",
        farbe: pj.length ? "#3A3F44" : "#A9A9A9" }; }),
      x: { min: 0, max: 15, ticks: [0, 5, 10, 15], titel: "Wettbewerbsstärke", fmt: v => zahl(v) },
      y: { min: 0, max: 15, ticks: [0, 5, 10, 15], titel: "Marktattraktivität", fmt: v => zahl(v) },
      linien: { x: 7.5, y: 7.5 }, felder: [{ ecke: "or", text: "investieren" }, { ecke: "ul", text: "abschöpfen" }],
      auswahl: pt => (S.projekt === null || PR[S.projekt].feld === pt.key) && (S.feld === null || S.feld === pt.key),
      onClick: k => { const pj = feldProjekte(k); if (pj.length) projektWaehlen(pj[0]); else { const neu = S.feld === k ? null : k; auswahlWeg(); S.feld = neu; zeichnen(); } },
      tooltip: pt => { const fe = FE[pt.key], pj = feldProjekte(pt.key);
        return [`Produktfeld ${fe[0]}`, `Wettbewerbsstärke ${zahl(fe[1], 1)} · Marktattraktivität ${zahl(fe[2], 1)} (Skala 0–15)`,
          `Kreisfläche: Auftragsvolumen ${zahl(fe[3])} Tsd. €`, pj.length ? `Projekt: ${pj.map(j => PR[j].name).join(", ")}` : "kein laufendes Projekt (grau)",
          pj.length ? "Klick wählt das Projekt in allen Visuals" : "Klick hebt das Produktfeld hervor"]; } });
    f.flaeche.querySelector("svg").id = "st-portfolio";
  }
  const quadrant = fe => (fe[1] >= 7.5 && fe[2] >= 7.5 ? "investieren" : fe[1] < 7.5 && fe[2] < 7.5 ? "abschöpfen" : "selektiv");
  function botschaftStr() {
    if (S.projekt !== null) { const p = PR[S.projekt], fe = FE[p.feld]; return passt([`${p.kurz}: Feld ${fe[0]}, ${quadrant(fe)}`, `${p.kurz}: ${quadrant(fe)}`], 320); }
    if (S.feld !== null) { const fe = FE[S.feld]; return passt([`${fe[0]}: ${quadrant(fe)}, ohne Projekt`], 320); }
    const inv = PR.filter(p => quadrant(FE[p.feld]) === "investieren").length, ab = PR.filter(p => quadrant(FE[p.feld]) === "abschöpfen");
    return passt([`${inv} von ${PR.length} Projekten in Feldern zum Investieren${ab.length ? ", " + ab.map(p => p.kurz).join(", ") + " abschöpfen" : ""}`,
      `${inv} von ${PR.length} Projekten in Feldern zum Investieren`], 320);
  }

  /* ---------- Zeichnen ---------- */
  function zeichnen() {
    projSel.value = S.projekt === null ? "alle" : String(S.projekt);
    DK.kopf(bKopf, { titel: "Frühwarn-, Risiko- und Erfolgsreporting",
      untertitel: `Projektcontrolling konsolidiert · ${MLANG[S.m]} ${JAHR} · Prognose gegen Angebots- (AK) und Arbeitskalkulation (ArK)`,
      quelle: "", legende: [] });
    const lg = document.getElementById("kopf-legende");
    ["gut", "warn", "krit"].forEach(st => {
      const sp = el("span", { id: "legende-" + st }, lg);
      const s = sv("svg", { width: 18, height: 18, style: "overflow:visible" }, sp);
      signal(s, 9, 9, st, 0.82);
      sp.appendChild(document.createTextNode(STUFEN[st]));
    });
    let f = DK.visual(bAmpel, { titel: "Spitzenkennzahlen mit Ampel", einheit: "fünf Projekte", botschaft: botschaftTabelle() });
    tabelle(f);
    f = DK.visual(bSf, { titel: "Soft Facts (Nutzwertanalyse)", einheit: "Punkte", botschaft: "" });
    const r = softfacts(f);
    bSf.querySelector(".dk-botschaft").textContent = botschaftSf(r);
    f = DK.visual(bAbg, { titel: "Kosten- und Terminabweichung", einheit: "%", botschaft: botschaftAbg() });
    abgleich(f);
    f = DK.visual(bStr, { titel: "Marktportfolio Produktfelder", einheit: "0–15", botschaft: botschaftStr() });
    strategie(f);
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  /* ---------- Lernplattform ---------- */
  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "kopf-legende", anker: "links", versatz: [-2, 0], regel: "UNIFY – Barrierearme Ampel", titel: "Farbe, Form, Zeichen, Helligkeit",
        text: "Die Ampel bleibt, weil sie hier das Thema ist – aber barrierearm wie in Abb. 3.64: Kreis mit Häkchen (im Ziel), gelbes Dreieck mit Ausrufezeichen (beobachten), rotes Quadrat mit Kreuz (kritisch). Das Original füllte ganze Zellen rot, gelb, grün und rosa – für Farbenfehlsichtige und im Schwarz-Weiß-Druck nicht unterscheidbar." },
      { nr: 2, ziel: "v-ampel", anker: "links", versatz: [968, 22], regel: "SAY – Botschaft vermitteln", titel: "Was ist kritisch, was ist neu?",
        text: "Die Aussage zählt die kritischen Signale, nennt das Projekt mit den meisten und – als Frühwarnung – die seit dem Vormonat neu kritischen. Wechseln Sie die Periode: Sensortechnik Malmö kippt im Februar von „beobachten“ auf „kritisch“." },
      { nr: 3, ziel: "fr-kopf-erg", anker: "links", versatz: [40, -2], regel: "CONDENSE – Doppelte Ampel weglassen", titel: "Eine Ampel je Aussage",
        text: "DB/PW ist Projektergebnis geteilt durch Projektwert; das Original färbte beide Spalten gleich. Hier trägt nur DB/PW die Ampel, Projektwert und -ergebnis stehen als Eckwerte ohne Signal. Werte bleiben in jeder Zelle sichtbar – die Ampel sagt nicht, wie weit eine Kennzahl vom Ziel entfernt ist." },
      { nr: 4, ziel: "fr-tabelle", anker: "links", versatz: [600, 74], regel: "EXPRESS – Ausnahmen betonen", titel: "Nur Kritisches ist laut",
        text: "„Im Ziel“ ist ein heller Ring, „kritisch“ ein dunkles Quadrat mit fetter Zahl. Die Schwellenwerte je Kennzahl stehen im Tooltip; Kostenabweichungen werden relativ zum Projektwert bewertet, damit 47 Tsd. € beim kleinen Projekt Aue und 465 Tsd. € beim großen Projekt Lima vergleichbar sind." },
      { nr: 5, ziel: "sf-kopf", anker: "links", versatz: [190, -6], regel: "STRUCTURE – Nutzwertanalyse vollständig", titel: "Gewichte und Nutzwert ergänzt",
        text: "Die Soft Facts sind eine Nutzwertanalyse: acht Kriterien mit Gewicht, Punkte 1 (günstig) bis 5 (ungünstig), Nutzwert als gewichteter Durchschnitt – er ist der Wert der Spalte „Soft Facts“. Das Original zeigte das Profil ohne Gewichte vor rot-gelb-grünen Bändern; bei der Projektkomplexität war die Skala vertauscht (1 = sehr hoch)." },
      { nr: 6, ziel: "ab-portfolio", anker: "links", versatz: [260, 26], regel: "CHECK – Eine Zahlenbasis", titel: "Portfolio aus den Kennzahlen gerechnet",
        text: "Kosten- und Terminabweichung werden aus der Tabelle gerechnet (ΔELK + ΔFLK + ΔRisikovorsorge im Verhältnis zum Projektwert, Terminverzug zur geplanten Dauer). Im Original passten Portfolio und Tabelle nicht zusammen: Hoyerswerda lag trotz 100 Tagen Verzug und Mehrkosten links unten, Malmö trug 13.655 statt 13.684 Tsd. €." },
      { nr: 7, ziel: "st-portfolio", anker: "links", versatz: [200, 30], regel: "SIMPLIFY – Weniger Felder, keine Farblegende", titel: "Projekte im Marktportfolio",
        text: "Das Marktportfolio zeigt zehn Produktfelder; dunkel sind die Felder mit laufendem Projekt, beschriftet mit dem Projektnamen. Das Original hatte 25 bunte Kreise mit einer Farblegende aus 25 Einträgen, grauen Hintergrund und Rahmen." },
      { nr: 8, ziel: "filter", anker: "links", versatz: [520, 4], regel: "STRUCTURE – Ein Dashboard statt vier Fenster", titel: "Verbundene Sichten",
        text: "Die vier Fenster des Originals (Spitzenkennzahlen, Soft Facts, Strategieabgleich, Strategie) stehen auf einer Seite und sind verbunden: Klick auf ein Projekt in der Tabelle oder in einem Portfolio wählt es überall, die Soft Facts zeigen dann dieses Projekt. Fensterrahmen, Logos und Zurück-Schaltflächen entfallen." },
    ],
    nachbauIntro: "Seitengröße benutzerdefiniert 1024 × 646 px. Schrift Arial: Beschriftungen 10,5 pt, Visualtitel 12 pt. Datenmodell: Faktentabelle Projektkennzahlen (Projekt, Monat, Kennzahlen wie in der CSV-Datei), Tabelle Soft Facts (Projekt, Kriterium, Gewicht, Punkte) und Tabelle Produktfelder (Feld, Wettbewerbsstärke, Marktattraktivität, Auftragsvolumen), Projekt → Produktfeld.",
    nachbau: [
      { id: "A", ziel: "fr-tabelle", anker: "links", versatz: [600, 74], titel: "Spitzenkennzahlen mit Ampel", visual: "Matrix",
        felder: "Zeilen: Projekt; Werte: Projektwert, Projektergebnis, Soft Facts (Nutzwert), DB/AW, DB/PW = DIVIDE([Projektergebnis]; [Projektwert]), Cashflow, ΔELK, ΔFLK, ΔRisikovorsorge, Terminverzug",
        format: "Bedingte Formatierung › Symbole nach Regel je Kennzahl (z. B. DB/PW: ≥ 0,10 Häkchen, ≥ 0,05 Ausrufezeichen, sonst Kreuz), Symbol links vom Wert; Symbolsatz „3 Symbole (eingekreist)“ oder eigene SVG-Symbole; Spaltengruppen über Spaltenüberschriften „Eckwerte“, „Angebotsphase“, „Projektphase“ (Textfelder über der Matrix)",
        hinweis: "Kostenabweichungen relativ bewerten: Measure DIVIDE([ΔELK]; [Projektwert]) als Grundlage der Symbolregel." },
      { id: "B", ziel: "sf-kopf", anker: "links", versatz: [190, -6], titel: "Soft Facts", visual: "Liniendiagramm (gedreht nicht möglich) → Punktdiagramm",
        felder: "Y-Achse: Kriterium (Sortierreihenfolge), X-Achse: Punkte (1–5); Tabelle daneben mit Kriterium und Gewicht; Nutzwert = SUMX(SoftFacts; [Gewicht] * [Punkte]) / 100",
        format: "Markierungen nach Stufe (Form über bedingte Formatierung nicht möglich: Farbe #00806B / #E8A317 / #C62828 und Datenbeschriftung ✓ ! ✕); Konstantenlinie X = Nutzwert gestrichelt #8F8F8F",
        hinweis: "Die verbindende Profillinie bietet das Punktdiagramm nicht; alternativ Liniendiagramm mit Kriterium auf der X-Achse (Profil waagerecht)." },
      { id: "C", ziel: "ab-portfolio", anker: "links", versatz: [260, 26], titel: "Kosten- und Terminabweichung", visual: "Punktdiagramm",
        felder: "X-Achse: Terminverzug % = DIVIDE([Terminverzug]; [Geplante Dauer]) * 100; Y-Achse: Kostenabweichung % = DIVIDE([ΔELK] + [ΔFLK] + [ΔRisikovorsorge]; [Projektwert]) * 100; Größe: Projektwert; Werte: Projekt",
        format: "Markierung #3A3F44, 80 % Deckkraft; Konstantenlinien X = 0 und Y = 0 gestrichelt; Kategoriebeschriftung ein" },
      { id: "D", ziel: "st-portfolio", anker: "links", versatz: [200, 30], titel: "Marktportfolio", visual: "Punktdiagramm",
        felder: "X-Achse: Wettbewerbsstärke; Y-Achse: Marktattraktivität; Größe: Auftragsvolumen; Werte: Produktfeld; Legende: „mit Projekt“ (ja/nein)",
        format: "Farben ja #3A3F44, nein #A9A9A9; Achsen 0–15; Konstantenlinien bei 7,5; Beschriftung über Measure (Projektname, sonst leer)" },
      { id: "E", ziel: "filter", anker: "links", versatz: [520, 4], titel: "Datenschnitte", visual: "Datenschnitt Periode (Kacheln), Datenschnitt Projekt (Dropdown)",
        felder: "Monat; Projekt", hinweis: "Wechselwirkungen: Auswahl eines Projekts filtert die Soft Facts und hebt in Matrix und Portfolios hervor (Standard „Hervorheben“)." },
    ],
    theme: DK.thema(),
    csv: { name: "fruehwarn_risiko_erfolgsreporting.csv", text: () => {
      const z = ["Projekt;Monat;Projektwert_TsdEUR;Projektergebnis_Prog_TsdEUR;DB_AW_AK_Prozent;Cashflow_Ist_TsdEUR;Delta_ELK_TsdEUR;Delta_FLK_TsdEUR;Delta_Risikovorsorge_TsdEUR;Terminverzug_Tage;Geplante_Dauer_Tage;Produktfeld;" +
        KR.map(k => "SoftFacts_" + k[0]).join(";")];
      PR.forEach(p => MON.forEach((m, i) => z.push([p.name, `${JAHR}-${String(i + 1).padStart(2, "0")}`, p.pw, p.erg[i], String(p.dbaw).replace(".", ","), p.cf[i], p.delk[i], p.dflk[i], p.drisk[i], p.tv[i], p.dauer, FE[p.feld][0], ...p.sf].join(";"))));
      return z.join("\r\n"); } },
    tabellen: () => {
      const i = S.m, p = PR[sfProjekt()];
      return [
        { titel: `Spitzenkennzahlen ${MLANG[i]} ${JAHR}`, kopf: ["Projekt", ...SP.map(s => `${s.kopf.join("").replace("-", "")} (${s.einheit})`)],
          zeilen: PR.map(q => [q.name, ...SP.map(s => { const st = stufe(s, q, i); return zahl(s.wert(q, i), s.nk) + (st ? ` – ${STUFEN[st]}` : ""); })]) },
        { titel: `Soft Facts ${p.name}`, kopf: ["Kriterium", "Gewicht", "Punkte", "Skala 1 … 5"],
          zeilen: [...KR.map((k, r) => [k[0], k[1] + " %", String(p.sf[r]), `${k[2]} … ${k[3]}`]), ["Nutzwert", "100 %", zahl(nutzwert(p), 2), ""]] },
        { titel: `Kosten- und Terminabweichung ${MLANG[i]} ${JAHR}`, kopf: ["Projekt", "Kostenabweichung % des Projektwerts", "Terminverzug % der Dauer", "Projektwert (Tsd. €)"],
          zeilen: PR.map(q => [q.name, delta(kostenRel(q, i), 1), zahl(zeitRel(q, i), 1), zahl(q.pw)]) },
        { titel: "Marktportfolio Produktfelder", kopf: ["Produktfeld", "Wettbewerbsstärke", "Marktattraktivität", "Auftragsvolumen (Tsd. €)", "Projekt"],
          zeilen: FE.map((fe, k) => [fe[0], zahl(fe[1], 1), zahl(fe[2], 1), zahl(fe[3]), feldProjekte(k).map(j => PR[j].name).join(", ") || "–"]) },
      ];
    },
  });
  zeichnen();
})();
