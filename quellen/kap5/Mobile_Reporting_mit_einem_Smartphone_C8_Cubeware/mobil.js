/* Mobiler Bericht „Vertrieb Europa“ – Abb. 5.59 (Smartphone, hochkant, eine Spalte) und Abb. 5.60 (Tablet, quer,
   zwei Spalten). Derselbe Bericht, dieselben Daten (mobil.json aus daten_mobil.py), nur das Layout folgt dem Gerät.
   Smartphone: Seite 376 x 796 px (Anzeigefläche 360 x 780 px im angedeuteten Gerät); Tablet: 1024 x 646 px.
   Inhalte aus beiden Originalen: Umsatz nach Produktlinie mit 12-Monats-Verlauf und Budgetvergleich (5.59) und
   ABC-Analyse der Länder mit kumuliertem Anteil (5.60), Ergebnis nach Land. Bedienung für Touch: große Trefferflächen,
   Tippen auf eine Zeile filtert den Bericht, „✕ Auswahl“ (oder Esc) hebt auf.
   Abb. 5.59 und 5.60 verwenden diese Datei unverändert bis auf GERAET. */
(() => {
  "use strict";
  const GERAET = "smartphone";                   // Abb. 5.59: "smartphone" · Abb. 5.60: "tablet"
  const PHONE = GERAET === "smartphone";
  const { zahl, delta, wirkung, FARBE, NBSP, sv, el, tw } = DK;
  const MON = DATA.monate, NM = MON.length, LA = DATA.laender, LIN = DATA.linien, [GRENZE_A, GRENZE_B] = DATA.abc;
  const MNAME = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
  const mName = m => MNAME[Number(MON[m].slice(5)) - 1];
  const mKurz = m => `${mName(m).slice(0, 3)} ${MON[m].slice(0, 4)}`;
  const mLang = m => `${mName(m)} ${MON[m].slice(0, 4)}`;
  const REGION = { dach: "DACH", uebrige: "übrige Länder" };

  /* ---------- Würfel: [land][linie][monat] in Tsd. € ---------- */
  const leer = () => LA.map(() => LIN.map(() => Array(NM).fill(0)));
  const U = leer(), B = leer(), E = leer(), EB = leer();
  DATA.zeilen.forEach(([l, p, m, u, b, e, eb]) => { U[l][p][m] = u; B[l][p][m] = b; E[l][p][m] = e; EB[l][p][m] = eb; });

  /* ---------- Zustand ---------- */
  const ENDEN = [...Array(8).keys()].map(i => NM - 8 + i);           // 12 Monate bis Januar … August 2027
  const S = { ende: NM - 1, region: "alle", sel: null };
  addEventListener("keydown", e => { if (e.key === "Escape" && S.sel) { S.sel = null; zeichnen(); } });
  const waehlen = (typ, key) => { S.sel = S.sel && S.sel.typ === typ && S.sel.key === key ? null : { typ, key }; zeichnen(); };

  /* ---------- Berechnung ---------- */
  const fenster = () => [...Array(12).keys()].map(i => S.ende - 11 + i);
  const laender = ohne => LA.map((_, i) => i).filter(i => (S.region === "alle" || LA[i][2] === S.region) &&
                                                       (ohne === "land" || !S.sel || S.sel.typ !== "land" || S.sel.key === i));
  const linien = ohne => LIN.map((_, i) => i).filter(i => ohne === "linie" || !S.sel || S.sel.typ !== "linie" || S.sel.key === i);
  const summe = (W, ls, ps, ms) => { let s = 0; ls.forEach(l => ps.forEach(p => ms.forEach(m => { s += W[l][p][m]; }))); return s; };
  const mio = t => zahl(t / 1000, 1);
  const pd = (a, b) => (b ? delta((a / b - 1) * 100, 1, NBSP + "%") : "–");
  const pz = (a, b, nk = 1) => (b ? zahl(a / b * 100, nk) : "–") + NBSP + "%";
  const passt = (k, breite, px = 14, fett = false) => k.find(t => tw(t, px, fett) <= breite) || k[k.length - 1];

  function kennzahlen() {
    const ls = laender(), ps = linien(), ms = fenster();
    return { u: summe(U, ls, ps, ms), b: summe(B, ls, ps, ms), e: summe(E, ls, ps, ms), eb: summe(EB, ls, ps, ms) };
  }
  function datenLinien() {
    const ls = laender(), ms = fenster();
    return LIN.map((name, p) => {
      const u = summe(U, ls, [p], ms), b = summe(B, ls, [p], ms), e = summe(E, ls, [p], ms);
      return { key: p, label: name, u, b, e, d: (u / b - 1) * 100, spark: ms.map(m => summe(U, ls, [p], [m])) };
    });
  }
  function datenLaender() {
    const ps = linien(), ms = fenster();
    const z = laender("land").map(l => ({ key: l, label: LA[l][1], region: LA[l][2], u: summe(U, [l], ps, ms), b: summe(B, [l], ps, ms),
                                          e: summe(E, [l], ps, ms), eb: summe(EB, [l], ps, ms) }))
      .sort((a, b) => b.u - a.u);
    const ges = z.reduce((s, x) => s + x.u, 0);
    let kum = 0;
    z.forEach((x, i) => { kum += x.u; x.anteil = x.u / ges; x.kum = kum / ges;
                          x.klasse = i === 0 || x.kum <= GRENZE_A + 1e-9 ? "A" : x.kum <= GRENZE_B + 1e-9 ? "B" : "C"; });
    return { zeilen: z, ges };
  }

  /* ---------- Seite, Gerät, Raster ---------- */
  const SEITE = PHONE ? [376, 796] : [1024, 646];
  DK.init({ titel: PHONE ? "Vertrieb Europa (Smartphone)" : "Vertrieb Europa (Tablet)", breite: SEITE[0], hoehe: SEITE[1] });
  DK.el("style", {}, document.head, `
    .mb-rahmen { position: absolute; inset: 4px; border: 1.5px solid #9A9A9A; border-radius: ${PHONE ? 26 : 22}px; pointer-events: none; }
    #seite .dk-knoepfe button { height: 40px; min-width: 0; padding: 0 ${PHONE ? 10 : 14}px; }
    #seite select { height: 40px; font: inherit; font-size: 14px; color: var(--text); background: #FFFFFF; border: 1px solid #9A9A9A;
      border-radius: 3px; padding: 0 8px; }
    .mb-titel { font-size: 20px; font-weight: bold; }
    .mb-chip { height: 36px; padding: 0 12px; border: 1px solid #9A9A9A; border-radius: 18px; background: #FFFFFF; color: var(--text);
      font: inherit; font-size: 14px; cursor: pointer; white-space: nowrap; }
    body.print .mb-chip { display: none; }`);
  const seite = document.getElementById("seite");
  el("div", { class: "mb-rahmen", id: "geraet" }, seite);
  const R = PHONE
    ? { kopf: [24, 18, 328, 44], filter: [24, 70, 328, 40], h1: 120, kpis: [24, 128, 328, 66], h2: 202,
        v1: [24, 210, 328, 254], h3: 470, v2: [24, 478, 328, 306] }
    : { kopf: [24, 18, 976, 46], h1: 72, filter: [24, 80, 470, 60], kpis: [514, 80, 486, 66], h2: 154,
        v1: [24, 164, 466, 466], v2: [510, 164, 490, 466] };
  const bKopf = DK.box("kopf", ...R.kopf);
  DK.haarlinie(R.h1, 24, 24);
  const bFilter = DK.box("filter", ...R.filter, "dk-filter");
  const bKpi = DK.box("kpis", ...R.kpis);
  DK.haarlinie(R.h2, 24, 24);
  const bV1 = DK.box("v-linien", ...R.v1);
  if (PHONE) DK.haarlinie(R.h3, 24, 24);
  const bV2 = DK.box("v-laender", ...R.v2);

  /* ---------- Tooltip: Maus über pointermove, Touch über Tippen (verschwindet nach 2,5 s) ---------- */
  const tip = document.querySelector(".dk-tooltip");
  let tipUhr = null;
  function tooltip(ziel, zeilenFn) {
    const zeigen = ev => {
      tip.textContent = "";
      zeilenFn().filter(Boolean).forEach((z, i) => el(i === 0 ? "b" : "div", {}, tip, z));
      tip.style.display = "block";
      const r = tip.getBoundingClientRect();
      let x = ev.clientX + 14, y = ev.clientY + 14;
      if (x + r.width > innerWidth - 8) x = ev.clientX - r.width - 14;
      if (y + r.height > innerHeight - 8) y = ev.clientY - r.height - 14;
      tip.style.left = Math.max(8, x) + "px"; tip.style.top = Math.max(8, y) + "px";
    };
    ziel.addEventListener("pointermove", ev => { if (ev.pointerType !== "touch") zeigen(ev); });
    ziel.addEventListener("pointerdown", ev => {
      if (ev.pointerType !== "touch") return;
      zeigen(ev); clearTimeout(tipUhr); tipUhr = setTimeout(() => { tip.style.display = "none"; }, 2500);
    });
    ziel.addEventListener("pointerleave", ev => { if (ev.pointerType !== "touch") tip.style.display = "none"; });
  }

  /* ---------- Datenschnitte (40 px hoch); Smartphone ohne Beschriftung, Tablet mit ---------- */
  let selMonat, knopfRegion, chip;
  const monatOpt = ENDEN.map(m => [String(m), PHONE ? `bis ${mKurz(m)}` : mLang(m)]);
  const regionOpt = [["alle", "Alle"], ["dach", "DACH"], ["uebrige", "Übrige"]];
  const regionWahl = v => { S.region = v; if (S.sel && S.sel.typ === "land" && S.region !== "alle" && LA[S.sel.key][2] !== S.region) S.sel = null; zeichnen(); };
  if (PHONE) {
    bFilter.style.gap = "10px";
    selMonat = el("select", { "aria-label": "12 Monate bis", style: "width:118px" }, bFilter);
    monatOpt.forEach(([w, t]) => { const o = el("option", { value: w }, selMonat, t); if (Number(w) === S.ende) o.selected = true; });
    selMonat.addEventListener("change", () => { S.ende = Number(selMonat.value); zeichnen(); });
    knopfRegion = DK.knoepfe(bFilter, { optionen: regionOpt, wert: "alle", onChange: regionWahl });
    knopfRegion.id = "region";
    knopfRegion.style.flex = "1 1 auto";
    [...knopfRegion.children].forEach(b => { b.style.flex = "1 1 0"; });
  } else {
    selMonat = DK.schnitt(bFilter, "12 Monate bis", "dropdown", { optionen: monatOpt, wert: String(S.ende), breite: 150,
                                                                 onChange: v => { S.ende = Number(v); zeichnen(); } });
    knopfRegion = DK.schnitt(bFilter, "Region", "knoepfe", { optionen: regionOpt, wert: "alle", onChange: regionWahl });
    knopfRegion.id = "region";
    chip = el("button", { type: "button", class: "mb-chip", style: "margin-left:auto;visibility:hidden" }, bFilter, "✕ Auswahl");
    chip.addEventListener("click", () => { S.sel = null; zeichnen(); });
  }

  /* ---------- Kopf ---------- */
  function kopf(sub) {
    if (!PHONE) {
      DK.kopf(bKopf, { titel: "Vertrieb Europa", untertitel: sub, quelle: "Quelle: Vertriebscontrolling",
                       legende: [[FARBE.ist, "Ist"], [FARBE.gut, "günstig"], [FARBE.schlecht, "ungünstig"]] });
      return;
    }
    bKopf.textContent = "";
    const l = el("div", { id: "kopf-titel", style: "position:absolute;left:0;top:0;white-space:nowrap" }, bKopf);
    el("div", { class: "mb-titel" }, l, "Vertrieb Europa");
    el("div", { class: "dk-untertitel", style: "margin-top:3px" }, l, sub);
    chip = el("button", { type: "button", class: "mb-chip", style: `position:absolute;right:0;top:2px;visibility:${S.sel ? "visible" : "hidden"}` }, bKopf, "✕ Auswahl");
    chip.addEventListener("click", () => { S.sel = null; zeichnen(); });
  }

  /* ---------- V1: Umsatz nach Produktlinie – Verlauf, Ist, (Budget), ΔBU ---------- */
  const SP1 = PHONE ? { l: 74, s: 72, i: 52, b: 0, d: 130, rh: 37, sh: 22 } : { l: 96, s: 130, i: 60, b: 60, d: 120, rh: 76, sh: 44 };
  function linienVisual(f, d) {
    const n = d.length, kopfH = 18, Wd = f.breite, Hd = kopfH + n * SP1.rh;
    const svg = sv("svg", { width: Wd, height: Hd, role: "img", "aria-label": "Umsatz nach Produktlinie", id: "li-svg" }, f.flaeche);
    const xs = SP1.l, xi = xs + SP1.s, xb = xi + SP1.i, xd = xb + SP1.b, TXT = 58;
    const neg = Math.max(0, ...d.map(z => -z.d)), pos = Math.max(0, ...d.map(z => z.d));
    const k = (SP1.d - TXT - 6) / Math.max(neg + pos, 1e-9), mitte = xd + TXT + 2 + neg * k;
    sv("text", { x: xs, y: 12, class: "muted" }, svg, PHONE ? "12 Monate" : "Verlauf 12 Monate");
    sv("text", { x: xi + SP1.i - 4, y: 12, "text-anchor": "end", class: "muted" }, svg, "Ist");
    if (SP1.b) sv("text", { x: xb + SP1.b - 4, y: 12, "text-anchor": "end", class: "muted" }, svg, "Budget");
    sv("text", { x: xd + SP1.d / 2 + 6, y: 12, "text-anchor": "middle", class: "muted", id: "li-kopf-dbu" }, svg, "ΔBU");
    sv("line", { x1: 0, x2: Wd, y1: kopfH - 0.5, y2: kopfH - 0.5, stroke: "#3A3F44", "stroke-width": 1 }, svg);
    d.forEach((z, i) => {
      const y = kopfH + i * SP1.rh, ym = y + SP1.rh / 2;
      const blass = S.sel && S.sel.typ === "linie" && S.sel.key !== z.key;
      const g = sv("g", { class: "dk-klick" + (blass ? " dk-blass" : ""), id: "li-" + i }, svg);
      sv("text", { x: 0, y: ym, dy: "0.35em" }, g, z.label);
      const mn = Math.min(...z.spark), mx = Math.max(...z.spark), sw = SP1.s - 14;
      const px = j => xs + 2 + j * sw / (z.spark.length - 1), py = v => ym + SP1.sh / 2 - (mx > mn ? (v - mn) / (mx - mn) : 0.5) * SP1.sh;
      sv("polyline", { points: z.spark.map((v, j) => `${px(j).toFixed(1)},${py(v).toFixed(1)}`).join(" "), fill: "none", stroke: "#3A3F44",
                       "stroke-width": 1.5, "stroke-linejoin": "round" }, g);
      sv("circle", { cx: px(z.spark.length - 1), cy: py(z.spark[z.spark.length - 1]), r: 2.5, fill: "#3A3F44" }, g);
      sv("text", { x: xi + SP1.i - 4, y: ym, dy: "0.35em", "text-anchor": "end" }, g, mio(z.u));
      if (SP1.b) sv("text", { x: xb + SP1.b - 4, y: ym, dy: "0.35em", "text-anchor": "end", class: "muted" }, g, mio(z.b));
      const kl = wirkung(z.d, 1, 1);
      sv("text", { x: xd + TXT - 2, y: ym, dy: "0.35em", "text-anchor": "end", style: `fill:${kl === "neutral" ? "var(--text)" : FARBE[kl]}` }, g,
         delta(z.d, 1, NBSP + "%"));
      const bw = Math.abs(z.d) * k;
      if (bw > 0) sv("rect", { x: z.d >= 0 ? mitte : mitte - bw, y: ym - 6, width: bw, height: 12, fill: FARBE[kl] }, g);
      sv("line", { x1: mitte, x2: mitte, y1: y + 4, y2: y + SP1.rh - 4, stroke: "#8C8C8C", "stroke-width": 1 }, g);
      if (i < n - 1) sv("line", { x1: 0, x2: Wd, y1: y + SP1.rh - 0.5, y2: y + SP1.rh - 0.5, stroke: "#EFEFEF", "stroke-width": 1 }, g);
      const hit = sv("rect", { x: 0, y, width: Wd, height: SP1.rh, fill: "transparent" }, g);
      hit.addEventListener("click", () => waehlen("linie", z.key));
      const ms = fenster();
      tooltip(hit, () => [z.label, `Umsatz ${mio(z.u)} Mio. € · Budget ${mio(z.b)} Mio. €`, `ΔBU ${delta((z.u - z.b) / 1000, 1, NBSP + "Mio. €")} (${pd(z.u, z.b)})`,
        `Ergebnis ${mio(z.e)} Mio. € · Umsatzrendite ${pz(z.e, z.u)}`,
        `Verlauf ${mKurz(ms[0])} bis ${mKurz(ms[11])}: ${mio(mn)}–${mio(mx)} Mio. € je Monat`, PHONE ? "Tippen filtert den Bericht" : "Tippen oder Klick filtert den Bericht"]);
    });
  }

  /* ---------- V2: ABC-Analyse nach Land – Umsatz (Balken), (Anteil), kum. Anteil, Klasse, (Ergebnis) ---------- */
  const SP2 = PHONE ? { l: 101, u: 141, a: 0, k: 52, c: 34, e: 0, rh: 29 } : { l: 112, u: 140, a: 56, k: 80, c: 42, e: 60, rh: 48 };
  function laenderVisual(f, d) {
    const z = d.zeilen, n = z.length, kopfH = 18, Wd = f.breite, Hd = kopfH + Math.max(1, n) * SP2.rh;
    const svg = sv("svg", { width: Wd, height: Hd, role: "img", "aria-label": "ABC-Analyse nach Land", id: "la-svg" }, f.flaeche);
    const xa = SP2.l + SP2.u, xk = xa + SP2.a, xc = xk + SP2.k, xe = xc + SP2.c;
    const vw = Math.ceil(Math.max(...z.map(x => tw(mio(x.u))), 10)) + 6, max = Math.max(...z.map(x => x.u), 1);
    sv("text", { x: SP2.l, y: 12, class: "muted" }, svg, "Umsatz");
    if (SP2.a) sv("text", { x: xa + SP2.a - 4, y: 12, "text-anchor": "end", class: "muted" }, svg, "Anteil");
    sv("text", { x: xk + SP2.k - 4, y: 12, "text-anchor": "end", class: "muted" }, svg, PHONE ? "kum." : "kum. Anteil");
    sv("text", { x: xc + SP2.c / 2 + 2, y: 12, "text-anchor": "middle", class: "muted", id: "la-kopf-abc" }, svg, "ABC");
    if (SP2.e) sv("text", { x: xe + SP2.e, y: 12, "text-anchor": "end", class: "muted" }, svg, "Ergebnis");
    sv("line", { x1: 0, x2: Wd, y1: kopfH - 0.5, y2: kopfH - 0.5, stroke: "#3A3F44", "stroke-width": 1 }, svg);
    z.forEach((x, i) => {
      const y = kopfH + i * SP2.rh, ym = y + SP2.rh / 2;
      const blass = S.sel && S.sel.typ === "land" && S.sel.key !== x.key;
      const g = sv("g", { class: "dk-klick" + (blass ? " dk-blass" : ""), id: "la-" + i }, svg);
      sv("text", { x: 0, y: ym, dy: "0.35em" }, g, x.label);
      const bw = Math.max(1, x.u / max * (SP2.u - vw - 6)), bh = Math.min(16, Math.round(SP2.rh * 0.55));
      sv("rect", { x: SP2.l, y: ym - bh / 2, width: bw, height: bh, fill: FARBE.ist }, g);
      sv("text", { x: SP2.l + bw + 5, y: ym, dy: "0.35em" }, g, mio(x.u));
      if (SP2.a) sv("text", { x: xa + SP2.a - 4, y: ym, dy: "0.35em", "text-anchor": "end" }, g, pz(x.anteil, 1));
      sv("text", { x: xk + SP2.k - 4, y: ym, dy: "0.35em", "text-anchor": "end" }, g, pz(x.kum, 1).replace(NBSP + "%", PHONE ? NBSP + "%" : NBSP + "%"));
      sv("text", { x: xc + SP2.c / 2 + 2, y: ym, dy: "0.35em", "text-anchor": "middle", style: "font-weight:bold" }, g, x.klasse);
      if (SP2.e) sv("text", { x: xe + SP2.e, y: ym, dy: "0.35em", "text-anchor": "end" }, g, mio(x.e));
      const naechste = z[i + 1];
      if (naechste) {
        const grenze = naechste.klasse !== x.klasse;
        sv("line", { x1: 0, x2: Wd, y1: y + SP2.rh - 0.5, y2: y + SP2.rh - 0.5, stroke: grenze ? "#6E747A" : "#EFEFEF", "stroke-width": 1 }, g);
      }
      const hit = sv("rect", { x: 0, y, width: Wd, height: SP2.rh, fill: "transparent" }, g);
      hit.addEventListener("click", () => waehlen("land", x.key));
      tooltip(hit, () => [`${x.label} (${REGION[x.region]})`, `Umsatz ${zahl(x.u)} Tsd. € · ΔBU ${pd(x.u, x.b)}`,
        `Anteil ${pz(x.anteil, 2)} · kumuliert ${pz(x.kum, 2)} · Klasse ${x.klasse}`,
        `Ergebnis ${mio(x.e)} Mio. € (Budget ${mio(x.eb)}) · Rendite ${pz(x.e, x.u)}`, PHONE ? "Tippen filtert den Bericht" : "Tippen oder Klick filtert den Bericht"]);
    });
    if (!n) sv("text", { x: 0, y: kopfH + 18, class: "muted" }, svg, "Keine Länder in der Auswahl");
  }

  /* ---------- Zeichnen ---------- */
  function zeichnen() {
    selMonat.value = String(S.ende);
    [...knopfRegion.querySelectorAll("button")].forEach((b, i) => b.setAttribute("aria-pressed", String(regionOpt[i][0] === S.region)));
    const ms = fenster();
    const auswahl = S.sel ? (S.sel.typ === "land" ? LA[S.sel.key][1] : LIN[S.sel.key]) : null;
    const reg = S.region === "alle" ? "alle Länder" : REGION[S.region];
    const zeit = `12 Monate bis ${mKurz(S.ende)}`;
    kopf(PHONE ? passt([`${zeit} · ${auswahl || reg}`, `bis ${mKurz(S.ende)} · ${auswahl || reg}`], S.sel ? 230 : 328)
               : passt([`Umsatz und Ergebnis · ${zeit} (${mKurz(ms[0])} bis ${mKurz(S.ende)}) · ${reg}${auswahl ? " · " + auswahl : ""} · Vergleich zum Budget (ΔBU)`,
                        `Umsatz und Ergebnis · ${zeit} · ${reg}${auswahl ? " · " + auswahl : ""} · Vergleich zum Budget (ΔBU)`,
                        `${zeit} · ${reg}${auswahl ? " · " + auswahl : ""} · ΔBU`], 600));
    if (chip) chip.style.visibility = S.sel ? "visible" : "hidden";

    const k = kennzahlen();
    DK.kpis(bKpi, [
      { label: "Umsatz, Mio. €", wert: mio(k.u), bezug: "ΔBU", delta: pd(k.u, k.b), klasse: wirkung((k.u / k.b - 1) * 100, 1, 1) },
      { label: "Ergebnis, Mio. €", wert: mio(k.e), bezug: "ΔBU", delta: k.eb > 0 ? pd(k.e, k.eb) : delta((k.e - k.eb) / 1000, 1),
        klasse: wirkung(k.e - k.eb, 1, 0) },
    ]);
    [...bKpi.querySelectorAll(".dk-kpi")].forEach((c, i) => { c.id = "kpi-" + i; });

    // V1
    const d1 = datenLinien(), s1 = S.sel && S.sel.typ === "linie" ? d1[S.sel.key] : null;
    const sort = d1.slice().sort((a, b) => b.d - a.d), best = sort[0], worst = sort[sort.length - 1];
    const vor = S.sel && S.sel.typ === "land" ? `${LA[S.sel.key][1]}: ` : "";
    let f = DK.visual(bV1, { titel: "Umsatz nach Produktlinie", einheit: "Mio. €",
      botschaft: s1 ? passt([`${s1.label}: ${mio(s1.u)} Mio. €, ${pd(s1.u, s1.b)} zum Budget`, `${s1.label}: ΔBU ${pd(s1.u, s1.b)}`], R.v1[2])
        : passt([`${vor}${best.label} ${pd(best.u, best.b)} über Budget, ${worst.label} ${pd(worst.u, worst.b)}`,
                 `${vor}${best.label} ${pd(best.u, best.b)}, ${worst.label} ${pd(worst.u, worst.b)} zum Budget`,
                 `${best.label} ${pd(best.u, best.b)}, ${worst.label} ${pd(worst.u, worst.b)} zum Budget`], R.v1[2]) });
    linienVisual(f, d1);

    // V2
    const d2 = datenLaender(), z2 = d2.zeilen, nA = z2.filter(x => x.klasse === "A"), uA = nA.reduce((s, x) => s + x.u, 0);
    const verlust = z2.filter(x => x.e < 0).sort((a, b) => a.e - b.e)[0];
    const s2 = S.sel && S.sel.typ === "land" ? z2.find(x => x.key === S.sel.key) : null;
    const nachLinie = S.sel && S.sel.typ === "linie" ? `${LIN[S.sel.key]}: ` : "";
    f = DK.visual(bV2, { titel: "ABC-Analyse nach Land", einheit: "Umsatz in Mio. €",
      botschaft: s2 ? passt([`${s2.label}: Klasse ${s2.klasse}, ${pz(s2.anteil, 1)} des Umsatzes, Ergebnis ${mio(s2.e)} Mio. €`,
                             `${s2.label}: Klasse ${s2.klasse}, ${pz(s2.anteil, 1)} des Umsatzes`], R.v2[2])
        : !z2.length ? "Keine Länder in der Auswahl"
        : passt([`${nachLinie}${nA.length} von ${z2.length} Ländern bringen ${pz(uA, d2.ges, 0)} des Umsatzes${verlust ? ` – ${verlust.label} mit Verlust` : ""}`,
                 `${nachLinie}${nA.length} von ${z2.length} Ländern bringen ${pz(uA, d2.ges, 0)} des Umsatzes`,
                 `${nA.length} von ${z2.length} Ländern: ${pz(uA, d2.ges, 0)} des Umsatzes`], R.v2[2]) });
    laenderVisual(f, d2);

    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  /* ---------- Lernplattform: Designregeln, Nachbau, Tabellen, CSV ---------- */
  const regeln = [
    { nr: 1, ziel: "v-linien", anker: "links", versatz: PHONE ? [290, 2] : [284, 2], regel: "SAY – Botschaft vermitteln", titel: "Eine Aussage je Visual",
      text: "Unter jedem Titel steht ein aus den Daten berechneter Satz – welche Produktlinie am weitesten über bzw. unter Budget liegt, wie viele Länder den Großteil des Umsatzes bringen. Er ändert sich mit Zeitraum, Region und Auswahl. Das Original hatte nur englische Überschriften." },
    { nr: 2, ziel: "geraet", anker: "links", versatz: PHONE ? [24, 64] : [464, 96], regel: "STRUCTURE – Layout je Gerät", titel: PHONE ? "Eine Spalte im Hochformat" : "Zwei Spalten im Querformat",
      text: PHONE
        ? "Derselbe Bericht wie auf dem Tablet (Abb. 5.60), aber in einer Spalte: Kopf, Datenschnitte, Kennzahlen und zwei Visuals untereinander, in voller Breite lesbar. Nebenspalten (Budget, Anteil, Ergebnis) stehen im Tooltip. Das Original zeigte einen verkleinerten Desktop-Bericht mit vier Diagrammen in zwei Spalten, senkrechter Achsenbeschriftung und kaum lesbarer Schrift."
        : "Derselbe Bericht wie auf dem Smartphone (Abb. 5.59), aber in zwei Spalten: links die Produktlinien, rechts die Länder; die Nebenspalten Budget, Anteil und Ergebnis sind sichtbar. Das Original zeigte eine kleine Tabelle neben einer großen Karte; die Rangfolge der Länder war nur in der Tabelle ablesbar." },
    { nr: 3, ziel: PHONE ? "kopf" : "region", anker: "links", versatz: PHONE ? [334, 2] : [-4, -22], regel: "SIMPLIFY – Für Touch bedienbar", titel: "Große Trefferflächen",
      text: `Knöpfe und Auswahlliste sind 40 px hoch, jede Zeile ist ganz antippbar (${PHONE ? "37 bzw. 29 px" : "76 bzw. 48 px"} hoch). Tippen filtert den Bericht, „✕ Auswahl“ hebt die Auswahl auf (am Rechner auch Esc), ein Tooltip erscheint beim Tippen für 2,5 Sekunden. Das Original hatte kleine Pfeilknöpfe für die Klassengrenzen und eine Symbolleiste.` },
    { nr: 4, ziel: "li-kopf-dbu", anker: "links", versatz: [-14, -4], regel: "EXPRESS – Abweichung zeigen", titel: "ΔBU statt Dreiecken",
      text: "Die Abweichung zum Budget steht als Zahl mit Vorzeichen und als Balken nach Wirkung (blaugrün über, rot unter Budget). Das Original zeigte das Budget als orangefarbene Dreiecke auf roten Balken ohne Abweichungswert und stapelte Ist und Budget bei den Händlern; ein Verlust von −193.742,91 erschien als langer Balken nach rechts." },
    { nr: 5, ziel: "kpis", anker: "links", versatz: PHONE ? [282, 22] : [440, 22], regel: "UNIFY – Einheitliche Zahlen", titel: "Mio. € mit einer Nachkommastelle",
      text: "Alle Beträge in Mio. € mit einer Nachkommastelle, Einheit im Titel; exakte Werte in Tsd. € im Tooltip. Das Original mischte „6.761.734,26“, „414“ und „-193.742,91“ (US$) mit T€-Werten und Prozenten mit zwei Nachkommastellen." },
    { nr: 6, ziel: "la-svg", anker: "links", versatz: PHONE ? [96, -2] : [108, -2], regel: "CONDENSE – ABC als Rangfolge", titel: "Balken, kumulierter Anteil, Klassen",
      text: "Die Länder stehen nach Umsatz geordnet, mit kumuliertem Anteil und Klasse; Linien trennen die Klassen A (bis 65 %), B (bis 80 %) und C wie die Klassengrenzen des Originals. Ampelfarben in Tabelle und Karte entfallen – die Klasse steht als Buchstabe." },
    { nr: 7, ziel: "v-laender", anker: "links", versatz: PHONE ? [330, 22] : [358, 2], regel: "CHECK – Titel und Inhalt stimmig", titel: "Region als Datenschnitt",
      text: "Das Original hieß „ABC-Analyse DACH“, zeigte aber acht europäische Länder. Jetzt wählt der Datenschnitt Region alle Länder, DACH oder die übrigen; die Klassen werden für die Auswahl neu gebildet. Werte des Originals (T€) für die 12 Monate bis August 2027 übernommen." },
    { nr: 8, ziel: "kopf", anker: "links", versatz: PHONE ? [200, 0] : [260, 0], regel: "SIMPLIFY – Ohne App-Rahmen", titel: "Gerät nur angedeutet",
      text: "Statusleiste, Symbolleisten, Navigationsknöpfe („Car Sales“, „Arena“, „Back“), Markennamen und Logos entfallen; das Gerät ist nur durch einen dünnen Rahmen angedeutet. Marken wurden zu Produktlinien, englische Begriffe zu deutschen." },
  ];
  DK.ebenen({
    regeln,
    nachbauIntro: (PHONE
      ? "Smartphone: In Power BI Desktop Ansicht › Mobiles Layout öffnen und die Visuals der Berichtsseite untereinander auf die Hochformat-Zeichenfläche ziehen (Breite der Anzeigefläche hier 360 px); Schriftgrade im mobilen Layout getrennt einstellbar. "
      : "Tablet: Seitengröße benutzerdefiniert 1024 × 646 px (Querformat); die Power-BI-App zeigt die Seite auf dem Tablet so an. Für das Smartphone (Abb. 5.59) dieselben Visuals im mobilen Layout untereinander. ") +
      "Schrift Arial: Beschriftungen 10,5 pt, Titel 12 pt, Kennzahlen 19,5 pt. Datenmodell: Faktentabelle Vertrieb (Monat, Land, Produktlinie, Umsatz und Ergebnis, Ist und Budget), Tabellen Land (mit Region) und Datum. " +
      "Measures: Umsatz 12M = CALCULATE([Umsatz]; DATESINPERIOD(Datum[Datum]; MAX(Datum[Datum]); −12; MONTH)); ΔBU % = DIVIDE([Umsatz 12M]; [Budget 12M]) − 1.",
    nachbau: [
      { id: "A", ziel: "filter", anker: "links", versatz: PHONE ? [294, -22] : [430, -2], titel: "Datenschnitte", visual: "Datenschnitt (2×)",
        felder: "Monat (Dropdown, Einzelauswahl; bestimmt das Ende der 12 Monate); Region als Kacheln (Alle, DACH, Übrige)",
        format: "Höhe mind. 40 px (Touch); ausgewählt #3A3F44 mit weißer Schrift" },
      { id: "B", ziel: "kpis", anker: "links", versatz: PHONE ? [282, 22] : [440, 22], titel: "Kennzahlen", visual: "Karte (neu) mit zwei Kennzahlen",
        felder: "Umsatz 12M, Ergebnis 12M; Referenzbeschriftung ΔBU %", format: "Wert 19,5 pt fett; ΔBU über bedingte Formatierung #00806B / #C62828" },
      { id: "C", ziel: "v-linien", versatz: [0, 0], titel: "Umsatz nach Produktlinie", visual: "Tabelle mit Sparklines",
        felder: `Zeilen: Produktlinie; Werte: Umsatz 12M (Sparkline über Monat), Umsatz 12M${PHONE ? "" : ", Budget 12M"}, ΔBU %`,
        format: "Sparkline Linie #3A3F44, Markierung „Letzter“; ΔBU %: Datenbalken (Achse Mitte, positiv #00806B, negativ #C62828); Zeilenabstand groß (Raster › Zeilenabstand)",
        hinweis: PHONE ? "Die Spalte Budget steht nur auf dem Tablet: für das Smartphone eine schmalere Kopie der Tabelle anlegen, im Weblayout ausblenden und nur ins mobile Layout ziehen." : "" },
      { id: "D", ziel: "v-laender", versatz: PHONE ? [0, 22] : [0, 0], titel: "ABC-Analyse nach Land", visual: "Tabelle",
        felder: `Land; Umsatz 12M (Datenbalken)${PHONE ? "" : "; Anteil = DIVIDE([Umsatz 12M]; CALCULATE([Umsatz 12M]; ALLSELECTED(Land)))"}; kum. Anteil = Summe der Umsätze aller Länder mit Umsatz ≥ dem eigenen (FILTER(ALLSELECTED(Land[Land]); …)) / Gesamt; Klasse = SWITCH(TRUE(); [kum. Anteil] <= 0,65; "A"; [kum. Anteil] <= 0,8; "B"; "C")${PHONE ? "" : "; Ergebnis 12M"}`,
        format: "Sortierung nach Umsatz absteigend; Datenbalken #3A3F44 ab 0; Klasse fett",
        hinweis: "Das größte Land ist immer A, auch wenn es allein mehr als 65 % hat (eigene Regel im Measure)." },
    ],
    theme: DK.thema(),
    csv: { name: "vertrieb_europa.csv", text: () => ["Monat;Land;Region;Produktlinie;Umsatz_Ist_TEUR;Umsatz_Budget_TEUR;Ergebnis_Ist_TEUR;Ergebnis_Budget_TEUR",
      ...DATA.zeilen.map(([l, p, m, u, b, e, eb]) => [MON[m], LA[l][1], LA[l][2] === "dach" ? "DACH" : "Übrige", LIN[p], u, b, e, eb].join(";"))].join("\r\n") },
    tabellen: () => {
      const k = kennzahlen(), ms = fenster();
      return [
        { titel: `Kennzahlen, 12 Monate bis ${mKurz(S.ende)}`, kopf: ["Kennzahl", "Ist", "Budget", "ΔBU"],
          zeilen: [["Umsatz, Mio. €", mio(k.u), mio(k.b), pd(k.u, k.b)], ["Ergebnis, Mio. €", mio(k.e), mio(k.eb), pd(k.e, k.eb)]] },
        { titel: "Umsatz nach Produktlinie, Mio. €", kopf: ["Produktlinie", "Ist", "Budget", "ΔBU", ...ms.map(m => mName(m).slice(0, 3))],
          zeilen: datenLinien().map(z => [z.label, mio(z.u), mio(z.b), pd(z.u, z.b), ...z.spark.map(v => mio(v))]) },
        { titel: "ABC-Analyse nach Land", kopf: ["Land", "Umsatz Tsd. €", "Anteil", "kum. Anteil", "Klasse", "Ergebnis Tsd. €"],
          zeilen: datenLaender().zeilen.map(x => [x.label, zahl(x.u), pz(x.anteil, 2), pz(x.kum, 2), x.klasse, zahl(x.e)]) },
      ];
    },
  });
  zeichnen();
})();
