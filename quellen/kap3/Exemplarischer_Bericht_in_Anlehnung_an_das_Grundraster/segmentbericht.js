/* Abb. 3.30 „Exemplarischer Bericht in Anlehnung an das Grundraster“ (6. Auflage) – Dashboard 1024 x 646 px.
   Segmenterfolgsbericht nach dem Grundraster aus Abb. 3.28: Kopf mit generellen Berichtsinformationen (rechts statt
   Logo Stand und Legende), darunter Selektionskriterien (links) und Funktionen (rechts), dann die Auswertungsbereiche:
   oben die Erfolgsrechnung (Tabelle), unten links der Cash-to-Cash-Cycle (Grafik), unten rechts der Kommentar.
   Daten: segmentbericht.json (daten_segmentbericht.py) – Sparte A über alle Vertriebswege = Werte des Originals.
   Kommentare sind mit Positionen verknüpft: Klick auf eine Zeile hebt die zugehörigen Kommentare hervor und umgekehrt. */
(() => {
  "use strict";
  const { zahl, delta, wirkung, FARBE, sv, el, tw, NBSP } = DK;
  const SPARTEN = DATA.sparten, WEGE = DATA.wege, STAND = DATA.stand, MONAT = DATA.monat, JAHR = DATA.jahr;
  const POS = DATA.positionen.map(([key, label, richtung, gruppe], i) => ({ i, key, label, richtung, gruppe }));
  const R = DATA.zeilen.map(z => ({ s: z[0], w: z[1], p: z[2], v: z.slice(3) }));   // v: Monat Ist, Monat Plan, FC, Plan Jahr (€)
  const KOM = DATA.kommentare;
  const C2C = [
    { key: "M", label: "Materialumschlag", richtung: -1, vz: 1 },
    { key: "E", label: "Erzeugnisumschlag", richtung: -1, vz: 1 },
    { key: "D", label: "Debitorenziel", richtung: -1, vz: 1 },
    { key: "K", label: "Kreditorenziel", richtung: 1, vz: -1 },
    { key: "C", label: "Cash-to-Cash-Cycle", richtung: -1, summe: true },
  ];

  /* ---------- Zustand ---------- */
  const S = { sparte: "0", weg: "alle", auswahl: null };       // auswahl: {typ: "pos" | "c2c" | "kom", key}
  addEventListener("keydown", e => { if (e.key === "Escape" && S.auswahl) { S.auswahl = null; zeichnen(); } });
  function waehlen(typ, key) {
    S.auswahl = S.auswahl && S.auswahl.typ === typ && S.auswahl.key === key ? null : { typ, key };
    zeichnen();
  }
  const spartenName = () => (S.sparte === "alle" ? "Alle Sparten" : SPARTEN[+S.sparte]);
  const wegName = () => (S.weg === "alle" ? "alle Vertriebswege" : "Vertriebsweg " + WEGE[+S.weg]);
  const imFilter = r => (S.sparte === "alle" || r.s === +S.sparte) && (S.weg === "alle" || r.w === +S.weg);

  /* ---------- Erfolgsrechnung ---------- */
  function erfolg() {
    const sum = POS.map(() => [0, 0, 0, 0]);
    R.filter(imFilter).forEach(r => r.v.forEach((x, j) => { sum[r.p][j] += x; }));
    const proz = (a, b) => (b && a * b >= 0 ? (a - b) / Math.abs(b) * 100 : null);   // kein Δ % bei Vorzeichenwechsel
    const zeile = (key, label, richtung, v, art) => ({ key, label, richtung, v, art,
      dm: v[0] - v[1], dmp: proz(v[0], v[1]), dj: v[2] - v[3], djp: proz(v[2], v[3]) });
    const gruppe = g => [0, 1, 2, 3].map(j => POS.filter(p => p.gruppe === g).reduce((s, p) => s + sum[p.i][j], 0));
    const gl = gruppe("L"), gk = gruppe("K");
    const z = [];
    POS.filter(p => p.gruppe === "L").forEach(p => z.push(zeile(p.key, p.label, p.richtung, sum[p.i], "pos")));
    z.push(zeile("GL", "= Gesamtleistung", 1, gl, "summe"));
    POS.filter(p => p.gruppe === "K").forEach(p => z.push(zeile(p.key, p.label, p.richtung, sum[p.i], "pos")));
    z.push(zeile("GK", "= Gesamtkosten", -1, gk, "summe"));
    z.push(zeile("ER", "= Erfolg", 1, gl.map((x, j) => x - gk[j]), "erfolg"));
    return z;
  }

  /* ---------- Cash-to-Cash-Cycle: Tage, gewichtet (Debitoren/Erzeugnisse mit Umsatz, Material/Kreditoren mit Materialkosten) ---------- */
  function cashToCash() {
    const iU = POS.find(p => p.key === "U").i, iM = POS.find(p => p.key === "M").i;
    const zellen = {};
    R.filter(imFilter).forEach(r => {
      const k = r.s + "-" + r.w;
      zellen[k] = zellen[k] || { s: r.s, w: r.w, u: 0, m: 0 };
      if (r.p === iU) zellen[k].u += r.v[0];
      if (r.p === iM) zellen[k].m += r.v[0];
    });
    const zs = Object.values(zellen), wert = {};
    ["M", "E", "D", "K"].forEach(k => {
      const gew = z => (k === "D" || k === "E" ? z.u : z.m);
      const ist = z => (k === "D" || k === "E" ? DATA.c2c.wege[z.s][k][z.w] : DATA.c2c.sparte[z.s][k][0]);
      const plan = z => DATA.c2c.sparte[z.s][k][1];
      const g = zs.reduce((s, z) => s + gew(z), 0) || 1e-9;
      wert[k] = [zs.reduce((s, z) => s + gew(z) * ist(z), 0) / g, zs.reduce((s, z) => s + gew(z) * plan(z), 0) / g];
    });
    wert.C = [0, 1].map(j => wert.M[j] + wert.E[j] + wert.D[j] - wert.K[j]);
    return C2C.map(c => ({ ...c, ist: wert[c.key][0], plan: wert[c.key][1], d: wert[c.key][0] - wert[c.key][1] }));
  }

  /* ---------- Kommentare und Verknüpfungen ---------- */
  const kommentare = () => {
    const k = KOM[S.sparte];
    return [...k.status.map(([text, bezug], i) => ({ id: "s" + i, art: "status", text, bezug })),
            ...k.massnahmen.map(([text, wer, termin, bezug], i) => ({ id: "m" + i, art: "massnahme", text, wer, termin, bezug }))];
  };
  function bezug() {                                          // was ist bei der aktuellen Auswahl hervorgehoben?
    if (!S.auswahl) return null;
    const a = S.auswahl, ks = kommentare(), b = { pos: new Set(), c2c: new Set(), kom: new Set() };
    if (a.typ === "kom") {
      const k = ks.find(x => x.id === a.key);
      b.kom.add(a.key);
      if (k) k.bezug.forEach(x => (x.startsWith("c2c:") ? b.c2c.add(x.slice(4)) : b.pos.add(x)));
    } else {
      b[a.typ].add(a.key);
      const ziel = a.typ === "c2c" ? "c2c:" + a.key : a.key;
      ks.filter(k => k.bezug.includes(ziel)).forEach(k => b.kom.add(k.id));
    }
    return b;
  }
  const kommentarZu = ziel => kommentare().filter(k => k.bezug.includes(ziel)).map(k => "Kommentar: " + k.text);

  /* ---------- Layout (Seite 1024 x 646, Grundraster) ---------- */
  DK.init({ titel: "Segmenterfolgsbericht" });
  const bKopf = DK.box("kopf", 16, 10, 992, 46);
  DK.haarlinie(62);
  const bFilter = DK.box("filter", 16, 68, 992, 50, "dk-filter");
  DK.haarlinie(128);
  const bErfolg = DK.box("v-erfolg", 16, 136, 992, 304);
  DK.haarlinie(447);
  const bC2C = DK.box("v-c2c", 16, 455, 470, 187);
  const bKom = DK.box("v-kommentar", 514, 455, 494, 187);
  DK.el("style", {}, document.head, `
    table.sb-tab { table-layout: fixed; width: 992px; }
    .sb-tab th, .sb-tab td { padding: 0 6px; }
    .sb-tab th:first-child, .sb-tab td:first-child { padding-left: 0; }
    .sb-tab td { height: 19px; }
    .sb-tab tr.sb-gruppe th { height: 19px; border-bottom: none; text-align: left; padding: 0 0 0 18px; vertical-align: bottom; }
    .sb-tab tr.sb-gruppe th div { border-bottom: 1px solid #9A9A9A; padding: 0 0 2px 0; }
    .sb-tab tr.sb-kopf th { height: 27px; vertical-align: bottom; padding-bottom: 9px; position: relative; }
    .sb-tab .sb-neu { padding-left: 18px; }
    .sb-tab td.sb-db { padding: 0 2px 0 6px; }
    .sb-tab tr.sb-summe td { font-weight: bold; border-top: 1px solid var(--ac); }
    .sb-tab tr.sb-erfolg td { font-weight: bold; border-top: 1px solid var(--ac); border-bottom: 1px solid var(--ac); }
    .sb-tab th.sb-ist::after, .sb-tab th.sb-plan::after, .sb-tab th.sb-fc::after {
      content: ""; position: absolute; left: 14px; right: 6px; bottom: 3px; height: 5px; }
    .sb-tab th.sb-ist::after { background: var(--ac); }
    .sb-tab th.sb-plan::after { background: #FFFFFF; box-shadow: inset 0 0 0 1px var(--ac); }
    .sb-tab th.sb-fc::after { background: var(--fc); }
    .sb-tab th.sb-neu.sb-fc::after { left: 26px; }
    table.kom-tab { table-layout: fixed; width: 494px; }
    .kom-tab td, .kom-tab th { padding: 0 6px 0 0; height: 19px; text-align: left; border-bottom: none; white-space: nowrap; }
    .kom-tab th { font-weight: bold; color: var(--text); }
    .kom-tab tr.kom-kopf2 th { font-weight: normal; color: var(--muted); border-bottom: 1px solid var(--ac); padding-top: 4px; }
    .kom-tab td.kom-strich { color: var(--muted); }
    .sb-funktionen { display: flex; gap: 8px; }
    .sb-funktionen button { font: inherit; font-size: 14px; height: 30px; padding: 0 14px; color: var(--text); background: #FFFFFF;
      border: 1px solid #9A9A9A; border-radius: 3px; cursor: pointer; }
    .sb-funktionen button:hover { border-color: var(--ac); }
    .dk-panel dd { overflow-wrap: anywhere; }
    .dk-panel table.dk-matrix td:first-child { white-space: normal; }`);

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
  const T = v => v / 1000;                                   // € → Tsd. €
  const pz = v => (v == null ? "–" : delta(v, 1));
  const WIRK = { gut: "günstig", schlecht: "ungünstig", neutral: "ohne Wertung" };

  /* ---------- Kopf, Selektionskriterien, Funktionen ---------- */
  DK.schnitt(bFilter, "Sparte", "dropdown", { breite: 150,
    optionen: [...SPARTEN.map((s, i) => [String(i), s]), ["alle", "Alle Sparten"]], wert: S.sparte,
    onChange: v => { S.sparte = v; S.auswahl = null; zeichnen(); } });
  DK.schnitt(bFilter, "Vertriebsweg", "dropdown", { breite: 190,
    optionen: [["alle", "Alle Vertriebswege"], ...WEGE.map((w, i) => [String(i), w])], wert: S.weg,
    onChange: v => { S.weg = v; S.auswahl = null; zeichnen(); } });
  const fk = el("div", { class: "dk-schnitt dk-rechts", id: "funktionen" }, bFilter);
  el("label", {}, fk, "Funktionen");
  const fkn = el("div", { class: "sb-funktionen" }, fk);
  const bMail = el("button", { type: "button", title: "Bericht per E-Mail versenden" }, fkn, "E-Mail");
  const bDruck = el("button", { type: "button", title: "Druckansicht öffnen" }, fkn, "Drucken");
  bMail.addEventListener("click", () => {
    const betreff = encodeURIComponent(`Segmenterfolgsbericht ${spartenName()}, ${MONAT} ${JAHR}`);
    location.href = `mailto:?subject=${betreff}&body=${encodeURIComponent(location.href.split("?")[0])}`;
  });
  bDruck.addEventListener("click", () => open(location.href.split("?")[0] + "?print", "_blank"));

  /* ---------- Auswertungsbereich 1: Erfolgsrechnung ---------- */
  const SP = [
    { key: "label", titel: "", breite: 200, id: "sp-pos" },
    { key: "i", titel: "Ist", breite: 66, cls: "sb-ist", id: "sp-ist" },
    { key: "p", titel: "Plan", breite: 66, cls: "sb-plan" },
    { key: "dm", titel: "ΔPL", breite: 183, typ: "balken", id: "sp-dm" },
    { key: "dmp", titel: "ΔPL %", breite: 72, typ: "pz" },
    { key: "f", titel: "FC", breite: 84, cls: "sb-fc", neu: true, id: "sp-fc" },
    { key: "pj", titel: "Plan", breite: 66, cls: "sb-plan" },
    { key: "dj", titel: "ΔPL", breite: 183, typ: "balken", id: "sp-dj" },
    { key: "djp", titel: "ΔPL %", breite: 72, typ: "pz" },
  ];
  const TXT = 50;
  function tabelle(ziel, z, b) {
    ziel.textContent = "";
    const t = el("table", { class: "dk-matrix sb-tab" }, ziel);
    const cg = el("colgroup", {}, t);                         // Spaltenbreiten (table-layout: fixed liest sonst die Gruppenzeile)
    SP.forEach(s => el("col", { style: `width:${s.breite}px` }, cg));
    const thead = el("thead", {}, t);
    const gr = el("tr", { class: "sb-gruppe" }, thead);
    el("th", { style: "padding:0" }, gr);
    el("div", {}, el("th", { colspan: 4, id: "gr-monat" }, gr), `${MONAT} ${JAHR} (kumuliert)`);
    el("div", {}, el("th", { colspan: 4, id: "gr-jahr" }, gr), `Forecast Gesamtjahr ${JAHR}`);
    const kopf = el("tr", { class: "sb-kopf" }, thead);
    SP.forEach(s => el("th", { ...(s.id ? { id: s.id } : {}), class: [s.cls, s.neu ? "sb-neu" : ""].filter(Boolean).join(" "),
      style: `width:${s.breite}px;` + (s.typ === "balken" ? "text-align:left;" : "") }, kopf,
      s.typ === "balken" ? undefined : s.titel));
    // Kopf der Balkenspalten rechtsbündig über den Zahlen
    [3, 7].forEach(j => el("span", { style: `display:inline-flex;justify-content:flex-end;width:${TXT - 6}px` },
                           kopf.children[j], SP[j].titel));
    const tb = el("tbody", {}, t);
    const skala = k => {
      const w = z.filter(r => r.art === "pos").map(r => r[k] / 1000);
      return { neg: Math.max(0, ...w.map(v => -v)), pos: Math.max(0, ...w) };
    };
    const sk = { dm: skala("dm"), dj: skala("dj") };
    z.forEach(r => {
      const blass = b && r.art === "pos" && !b.pos.has(r.key);
      const cls = (r.art === "pos" ? "dk-zeile" : r.art === "summe" ? "sb-summe" : "sb-erfolg") + (blass ? " dk-blass" : "");
      const tr = el("tr", { class: cls }, tb);
      const klM = wirkung(r.dm / 1000, r.richtung, 0), klJ = wirkung(r.dj / 1000, r.richtung, 0);
      const farbe = kl => (kl === "neutral" ? "var(--text)" : FARBE[kl]);
      SP.forEach((s, j) => {
        if (j === 0) { el("td", {}, tr, r.label); return; }
        const neu = s.neu ? "sb-neu" : "";
        if (s.key === "i" || s.key === "p" || s.key === "f" || s.key === "pj") {
          el("td", { class: neu }, tr, zahl(T(r.v[{ i: 0, p: 1, f: 2, pj: 3 }[s.key]]), 0)); return;
        }
        const kl = s.key.startsWith("dm") ? klM : klJ;
        if (s.typ === "pz") { el("td", { style: `color:${farbe(kl)}` }, tr, pz(r[s.key])); return; }
        const v = r[s.key] / 1000, td = el("td", { class: "sb-db" }, tr);
        const W = s.breite - 8, H = 17;
        const svg = sv("svg", { width: W, height: H, style: "display:block" }, td);
        sv("text", { x: TXT - 6, y: H / 2, dy: "0.35em", "text-anchor": "end",
                     style: `font-size:14px;fill:${farbe(kl)};font-weight:${r.art === "pos" ? "normal" : "bold"}` }, svg, delta(v, 0));
        if (r.art !== "pos") return;
        const sc = sk[s.key], k0 = (W - TXT - 6) / Math.max(sc.neg + sc.pos, 1e-9), mitte = TXT + 2 + sc.neg * k0;
        const bw = Math.abs(v) * k0;
        if (kl !== "neutral" && bw > 0.3) sv("rect", { x: v >= 0 ? mitte : mitte - bw, y: (H - 9) / 2, width: bw, height: 9, fill: FARBE[kl] }, svg);
        sv("line", { x1: mitte, x2: mitte, y1: 0, y2: H + 2, stroke: "#8C8C8C", "stroke-width": 1 }, svg);
      });
      if (r.art === "pos") {
        tr.addEventListener("click", () => waehlen("pos", r.key));
        tooltip(tr, () => [`${r.label} · ${spartenName()}, ${wegName()}`,
          `${MONAT} ${JAHR}: Ist ${zahl(T(r.v[0]), 1)} · Plan ${zahl(T(r.v[1]), 1)} · ΔPL ${delta(T(r.dm), 1)} Tsd. €` + (r.dmp == null ? "" : ` (${pz(r.dmp)}${NBSP}%)`),
          `Gesamtjahr: Forecast ${zahl(T(r.v[2]), 0)} · Plan ${zahl(T(r.v[3]), 0)} · ΔPL ${delta(T(r.dj), 0)} Tsd. €` + (r.djp == null ? "" : ` (${pz(r.djp)}${NBSP}%)`),
          `Wirkung: ${r.richtung > 0 ? "mehr ist günstig" : "mehr ist ungünstig"} – ${WIRK[klJ]} im Forecast`,
          ...kommentarZu(r.key), "Klick hebt die Zeile und ihre Kommentare hervor"]);
      }
    });
  }

  /* ---------- Auswertungsbereich 2: Cash-to-Cash-Cycle als Wasserfall (Balken waagerecht) ---------- */
  function wasserfall(v, cs, b) {
    const W = v.breite, KOPF = 18, rh = Math.floor((v.hoehe - KOPF) / cs.length), bh = 13;
    const svg = sv("svg", { width: W, height: KOPF + rh * cs.length, role: "img", "aria-label": "Cash-to-Cash-Cycle als Wasserfall" }, v.flaeche);
    const LW = Math.ceil(Math.max(...cs.map(c => tw(c.label, 14, !!c.summe)))) + 10;
    const xPlan = W - 62, xDelta = W - 2, BA = xPlan - 44 - 34 - LW;     // Balkenfläche zwischen Beschriftung und Planspalte
    const lauf = [];
    let s = 0;
    cs.forEach(c => { if (c.summe) { lauf.push([0, c.ist]); return; }
      const e = s + c.vz * c.ist; lauf.push([Math.min(s, e), Math.max(s, e)]); s = e; });
    const max = Math.max(...lauf.map(l => l[1]), 1e-9), sx = t => LW + t / max * BA;
    sv("text", { x: xPlan, y: 12, "text-anchor": "end", class: "muted", id: "c2c-plan" }, svg, "Plan");
    sv("text", { x: xDelta, y: 12, "text-anchor": "end", class: "muted" }, svg, "ΔPL");
    sv("line", { x1: 0, x2: W, y1: KOPF - 2.5, y2: KOPF - 2.5, stroke: "#3A3F44", "stroke-width": 1 }, svg);
    cs.forEach((c, i) => {
      const y = KOPF + i * rh, blass = b && !b.c2c.has(c.key);
      const g = sv("g", { class: "dk-klick" + (blass ? " dk-blass" : "") }, svg);
      const fett = c.summe ? "bold" : "normal";
      sv("text", { x: 0, y: y + rh / 2, dy: "0.35em", "font-weight": fett }, g, c.label);
      const [a, e] = lauf[i];
      sv("rect", { x: sx(a), y: y + (rh - bh) / 2, width: Math.max(1, sx(e) - sx(a)), height: bh, fill: FARBE.ist }, g);
      sv("text", { x: sx(e) + 5, y: y + rh / 2, dy: "0.35em", "font-weight": fett }, g,
         (c.vz < 0 ? "−" : "") + zahl(c.ist, 0));
      sv("text", { x: xPlan, y: y + rh / 2, dy: "0.35em", "text-anchor": "end", "font-weight": fett }, g, zahl(c.plan, 0));
      const kl = wirkung(c.d, c.richtung, 0);
      sv("text", { x: xDelta, y: y + rh / 2, dy: "0.35em", "text-anchor": "end", "font-weight": fett,
                   style: `fill:${kl === "neutral" ? "var(--text)" : FARBE[kl]}` }, g, delta(c.d, 0));
      if (i < cs.length - 2) {                                // Verbindungslinie zum nächsten Schritt
        const xv = sx(c.vz < 0 ? lauf[i][0] : lauf[i][1]);
        sv("line", { x1: xv, x2: xv, y1: y + (rh + bh) / 2, y2: y + rh + (rh - bh) / 2, stroke: "#8C8C8C", "stroke-width": 1 }, svg);
      }
      if (c.summe) sv("line", { x1: 0, x2: W, y1: y + 0.5, y2: y + 0.5, stroke: "#3A3F44", "stroke-width": 1 }, svg);
      const hit = sv("rect", { x: 0, y, width: W, height: rh, fill: "transparent" }, g);
      hit.addEventListener("click", () => waehlen("c2c", c.key));
      tooltip(hit, () => [`${c.label} · ${spartenName()}, ${wegName()}`,
        `Ist ${zahl(c.ist, 1)} Tage · Plan ${zahl(c.plan, 1)} Tage · ΔPL ${delta(c.d, 1)} Tage – ${WIRK[kl]}`,
        c.summe ? "Materialumschlag + Erzeugnisumschlag + Debitorenziel − Kreditorenziel"
          : c.key === "K" ? "Lieferantenziel verkürzt den Zyklus (längeres Ziel ist günstig)"
          : `${c.key === "D" ? "Umsatzgewichtet" : c.key === "E" ? "Umsatzgewichtet" : "Mit Materialkosten gewichtet"} über die gewählten Vertriebswege`,
        ...kommentarZu("c2c:" + c.key), "Klick hebt die Zeile und ihre Kommentare hervor"]);
    });
  }

  /* ---------- Auswertungsbereich 3: Kommentar ---------- */
  function kommentarTabelle(ziel, b) {
    const t = el("table", { class: "dk-matrix kom-tab" }, ziel);
    const cg = el("colgroup", {}, t);
    [14, 312, 104, 64].forEach(w => el("col", { style: `width:${w}px` }, cg));
    const tb = el("tbody", {}, t);
    const kopf1 = el("tr", {}, tb); el("th", { colspan: 4, id: "kom-status" }, kopf1, "Status");
    const ks = kommentare();
    const zeile = k => {
      const tr = el("tr", { class: "dk-zeile" + (b && !b.kom.has(k.id) ? " dk-blass" : "") }, tb);
      el("td", { class: "kom-strich" }, tr, "–");
      if (k.art === "status") el("td", { colspan: 3 }, tr, k.text);
      else { el("td", {}, tr, k.text); el("td", {}, tr, k.wer); el("td", {}, tr, k.termin); }
      const breite = k.art === "status" ? 480 : 306;
      if (tw(k.text) > breite) console.error("Kommentar zu lang: " + k.text);
      tr.addEventListener("click", () => waehlen("kom", k.id));
      const bz = k.bezug.map(x => (x.startsWith("c2c:") ? C2C.find(c => c.key === x.slice(4)).label : POS.find(p => p.key === x).label));
      tooltip(tr, () => [k.art === "status" ? "Status" : "Geplante Maßnahme", k.text,
        k.art === "massnahme" ? `Verantwortlich: ${k.wer} · Termin: ${k.termin}` : "", `Bezug: ${bz.join(", ")}`,
        "Klick hebt die zugehörigen Zeilen hervor"]);
    };
    ks.filter(k => k.art === "status").forEach(zeile);
    const kopf2 = el("tr", { class: "kom-kopf2" }, tb);
    el("th", { colspan: 2, id: "kom-massnahmen" }, kopf2, "Geplante Maßnahmen");
    el("th", {}, kopf2, "Verantwortlich"); el("th", {}, kopf2, "Termin");
    ks.filter(k => k.art === "massnahme").forEach(zeile);
  }

  /* ---------- Botschaften ---------- */
  function botschaftErfolg(z) {
    const e = z.find(r => r.key === "ER");
    const dm = T(e.dm), dj = T(e.dj);
    const teil1 = Math.abs(dm) < 0.5 ? `Erfolg ${MONAT} im Plan`
      : `Erfolg ${MONAT} ${delta(dm, 0)} Tsd. € ${dm > 0 ? "über" : "unter"} Plan` + (e.dmp == null ? "" : ` (${pz(e.dmp)}${NBSP}%)`);
    const teil2 = `Forecast ${Math.abs(dj) < 0.5 ? "im Plan" : delta(dj, 0) + " Tsd. €"}`;
    const schlecht = z.filter(r => r.art === "pos" && wirkung(T(r.dj), r.richtung, 0) === "schlecht")
      .sort((a, b) => Math.abs(b.dj) - Math.abs(a.dj))[0];
    const teil3 = schlecht ? ` – größte Planlücke im Forecast: ${schlecht.label} ${delta(T(schlecht.dj), 0)}` : "";
    return `${teil1}, ${teil2}${teil3}`;
  }
  function botschaftC2C(cs) {
    const c = cs.find(x => x.key === "C"), d = Math.round(c.d);
    if (d === 0) return `${zahl(c.ist, 0)} Tage, im Plan`;
    const treiber = cs.filter(x => !x.summe).map(x => ({ x, effekt: x.vz * x.d })).sort((a, b) => b.effekt * Math.sign(d) - a.effekt * Math.sign(d))[0];
    return `${zahl(c.ist, 0)} Tage, ${Math.abs(d)} ${d > 0 ? "über" : "unter"} Plan – vor allem ${treiber.x.label} (${delta(treiber.x.d, 0)})`;
  }

  /* ---------- Zeichnen ---------- */
  function zeichnen() {
    const z = erfolg(), cs = cashToCash(), b = bezug();
    DK.kopf(bKopf, { titel: "Segmenterfolgsbericht",
      untertitel: `${spartenName()} · ${wegName()} · Periode ${MONAT} ${JAHR} · Währung Tsd. €`,
      quelle: `Stand ${STAND}`,
      legende: [[FARBE.ist, "Ist"], ["#FFFFFF", "Plan", "#3A3F44"], [FARBE.fc, "Forecast"], [FARBE.gut, "günstig"], [FARBE.schlecht, "ungünstig"]] });
    bKopf.querySelector(".dk-quelle").id = "kopf-stand";

    let v = DK.visual(bErfolg, { titel: `Erfolgsrechnung ${MONAT} und Forecast ${JAHR}`, einheit: "Tsd. €", botschaft: botschaftErfolg(z) });
    tabelle(v.flaeche, z, b);

    v = DK.visual(bC2C, { titel: "Cash-to-Cash-Cycle", einheit: "Tage", botschaft: botschaftC2C(cs) });
    wasserfall(v, cs, b);

    v = DK.visual(bKom, { titel: "Kommentar", einheit: `${spartenName()}, Stand ${STAND}`, abstand: 2 });
    kommentarTabelle(v.flaeche, b);
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  /* ---------- Lernplattform: Designregeln, Nachbau, Tabellen, CSV ---------- */
  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "kopf-titel", anker: "links", versatz: [290, 0], regel: "STRUCTURE – Grundraster", titel: "Aufbau nach dem Grundraster",
        text: "Der Bericht folgt dem Grundraster (Abb. 3.28): Kopf mit den generellen Berichtsinformationen (Bericht, Segment, Vertriebsweg, Periode, Währung, Stand), darunter links die Selektionskriterien und rechts die Funktionen, dann die Auswertungsbereiche – oben die Tabelle, unten Grafik und Kommentar. Den Platz der Corporate Identity rechts oben nehmen Stand und Legende ein; ein Navigationsmenü braucht der Einzelbericht nicht." },
      { nr: 2, ziel: "v-erfolg", anker: "links", versatz: [782, 26], regel: "SAY – Botschaft vermitteln", titel: "Aussage über jedem Bereich",
        text: "Unter den Titeln steht, was zählt: Der Erfolg liegt im Januar 22 Tsd. € über Plan, im Forecast aber nur noch 2 – weil die Personalkosten 99 Tsd. € über Plan liegen. Der Zyklus liegt 14 Tage über Plan, getrieben vom Materialumschlag. Beides rechnet sich bei jeder Auswahl neu." },
      { nr: 3, ziel: "sp-ist", anker: "links", versatz: [6, 2], regel: "UNIFY – Semantische Notation", titel: "Szenarien im Spaltenkopf",
        text: "Marken unter den Spaltenköpfen zeigen die Szenarien: Ist anthrazit, Plan weiß mit Rahmen, Forecast grau – wie in der Legende im Kopf und in allen Abbildungen des Buchs. Das Original hatte keine Szenario-Kennzeichnung (und schrieb „Forcast“)." },
      { nr: 4, ziel: "sp-dj", anker: "links", versatz: [96, 2], regel: "UNIFY – Farbe nach Wirkung", titel: "Blaugrün günstig, Rot ungünstig",
        text: "Abweichungen sind nach ihrer Wirkung gefärbt: Kosten über Plan rot, unter Plan blaugrün; Erträge umgekehrt. Das Original markierte nur ungünstige Werte rot und ließ günstige schwarz, etwa die um 29 Tsd. € geringeren Fremdleistungen." },
      { nr: 5, ziel: "sp-dm", anker: "links", versatz: [96, 2], regel: "EXPRESS – Passende Darstellung", titel: "Abweichungsbalken je Zeitraum",
        text: "Die Planabweichungen haben Balken an einer Nulllinie, ein Maßstab je Zeitraum. So fallen im Januar die Umsatzerlöse und im Forecast die Personalkosten sofort auf. Summenzeilen bleiben ohne Balken, sie sind ein anderes Aggregat." },
      { nr: 6, ziel: "v-c2c", anker: "links", versatz: [242, 0], regel: "EXPRESS – Passende Darstellung", titel: "Wasserfall statt Einzelbalken",
        text: "Der Cash-to-Cash-Cycle ist eine Rechnung: Materialumschlag + Erzeugnisumschlag + Debitorenziel − Kreditorenziel. Der Wasserfall zeigt sie; das Original stellte die vier Größen und das Ergebnis als gleichrangige lila Balken mit Gitternetz dar. Plan und ΔPL sind ergänzt, damit „Materialumschlag zu hoch“ belegt ist." },
      { nr: 7, ziel: "v-kommentar", anker: "links", versatz: [344, 0], regel: "CONDENSE – Kommentar mit Bezug", titel: "Kommentare verknüpft",
        text: "Status und Maßnahmen gehören zu Zeilen des Berichts: Ein Klick auf „Personalkosten“ hebt den Status und die Maßnahme dazu hervor, ein Klick auf einen Kommentar die Zeilen, auf die er sich bezieht. Maßnahmen stehen als Tabelle mit Verantwortlichen und Terminen." },
      { nr: 8, ziel: "funktionen", anker: "links", versatz: [-4, 22], regel: "SIMPLIFY – Überflüssiges weglassen", titel: "Ohne Logo und Schmuck",
        text: "Das Logo mit Schatten, die Rahmen, Gitternetze und Dropdown-Pfeile des Originals entfallen. Die Positionen stehen links statt in der Tabellenmitte; Funktionen sind schlichte Schaltflächen. Die Werte sind die des Originals, auch dessen scheinbare Rundungsdifferenzen (138 − 118 = 19) – sie entstehen durch Rundung." },
    ],
    nachbauIntro: "Standard-Visuals von Power BI Desktop. Seitengröße benutzerdefiniert 1024 × 646 px. Schrift Arial: Beschriftungen 10,5 pt, Visualtitel 12 pt, Berichtstitel 16,5 pt. Das Berichtsdesign (JSON) setzt Farben und Schriften. Datenmodell: Faktentabelle Segmentergebnis (Sparte, Vertriebsweg, Position, Januar Ist, Januar Plan, Forecast, Plan Jahr) wie in der CSV-Datei, Positionstabelle mit Reihenfolge, Wirkung und Rechenlogik, Tabelle Kommentare (Sparte, Art, Text, Verantwortlich, Termin, Bezug).",
    nachbau: [
      { id: "A", ziel: "kopf-titel", anker: "links", versatz: [290, 0], titel: "Generelle Berichtsinformationen", visual: "Textfeld mit dynamischen Werten",
        felder: "Measures für Sparte und Vertriebsweg (SELECTEDVALUE mit „Alle …“ als Ersatz), Periode, Währung und Stand",
        format: "Titel 16,5 pt fett, Zeile darunter 10,5 pt #4D4D4D; rechts Stand und Legende als Textfeld" },
      { id: "B", ziel: "filter", anker: "links", versatz: [179, 22], titel: "Selektionskriterien", visual: "Datenschnitt (2×, Dropdown)",
        felder: "Segmentergebnis[Sparte] und Segmentergebnis[Vertriebsweg], Einfachauswahl mit „Alle auswählen“",
        format: "Kopfzeile 10,5 pt #4D4D4D, Rahmen #9A9A9A" },
      { id: "C", ziel: "funktionen", anker: "links", versatz: [-4, 22], titel: "Funktionen", visual: "Schaltfläche (2×)",
        felder: "E-Mail: Aktion Web-URL (mailto:) – im Power-BI-Dienst besser „Abonnieren“; Drucken: im Dienst „Exportieren > PDF“",
        format: "Text 10,5 pt, Füllung weiß, Rahmen #9A9A9A, Radius 3 px" },
      { id: "D", ziel: "v-erfolg", anker: "links", versatz: [782, 26], titel: "Erfolgsrechnung", visual: "Matrix",
        felder: "Zeilen: Positionen[Bezeichnung] (sortiert nach Reihenfolge); Werte: Ist, Plan, ΔPL, ΔPL %, Forecast, Plan Jahr, ΔPL, ΔPL % – je ein Measure, Summenzeilen über SWITCH auf die Rechenlogik der Positionstabelle (Gesamtleistung = Summe der Leistungspositionen …)",
        format: "Ganze Tsd. €, ΔPL % mit einer Stelle; Schriftfarbe der Abweichungen über Measure Wirkungsfarbe (#00806B / #C62828); Datenbalken für ΔPL nur in Positionszeilen; Summenzeilen fett mit Linie oben #3A3F44",
        hinweis: "Gruppenköpfe „Januar“ und „Forecast“ sowie die Szenario-Marken unter den Spaltenköpfen sind kein Standard – ersatzweise Spaltennamen mit Präfix (Jan Ist, FC …)." },
      { id: "E", ziel: "v-c2c", anker: "links", versatz: [242, 0], titel: "Cash-to-Cash-Cycle", visual: "Wasserfalldiagramm",
        felder: "Kategorie: Kennzahl (Materialumschlag, Erzeugnisumschlag, Debitorenziel, Kreditorenziel negativ); Gesamt = Zyklus; Plan und ΔPL als Tabelle daneben",
        format: "Erhöhung, Verringerung und Gesamt in #3A3F44; Datenbeschriftung an; keine Gitternetzlinien",
        hinweis: "Das Wasserfalldiagramm von Power BI ist senkrecht; waagerecht nur über ein gestapeltes Balkendiagramm mit transparenter Basisreihe." },
      { id: "F", ziel: "v-kommentar", anker: "links", versatz: [344, 0], titel: "Kommentar", visual: "Tabelle",
        felder: "Kommentare[Text], [Verantwortlich], [Termin], gefiltert über die Sparte; Hervorheben über eine Brückentabelle Kommentar–Position",
        format: "Ohne Raster, Kopfzeile #4D4D4D; Status als eigene Tabelle ohne Spaltenkopf" },
    ],
    theme: DK.thema(),
    csv: { name: "segmenterfolg_einzelsaetze.csv", text: () => {
      const k = ["Sparte;Vertriebsweg;Position;Januar_Ist_EUR;Januar_Plan_EUR;Forecast_2027_EUR;Plan_2027_EUR"];
      R.forEach(r => k.push([SPARTEN[r.s], WEGE[r.w], POS[r.p].label, ...r.v].join(";")));
      return k.join("\r\n"); } },
    tabellen: () => {
      const z = erfolg(), cs = cashToCash(), ks = kommentare();
      return [
        { titel: `Erfolgsrechnung ${MONAT} ${JAHR} (kumuliert), ${spartenName()}, ${wegName()} (Tsd. €)`,
          kopf: ["Position", "Ist", "Plan", "ΔPL", "ΔPL %"],
          zeilen: z.map(r => [r.label.replace("= ", ""), zahl(T(r.v[0]), 0), zahl(T(r.v[1]), 0), delta(T(r.dm), 0), pz(r.dmp)]) },
        { titel: `Forecast Gesamtjahr ${JAHR}, ${spartenName()}, ${wegName()} (Tsd. €)`,
          kopf: ["Position", "FC", "Plan", "ΔPL", "ΔPL %"],
          zeilen: z.map(r => [r.label.replace("= ", ""), zahl(T(r.v[2]), 0), zahl(T(r.v[3]), 0), delta(T(r.dj), 0), pz(r.djp)]) },
        { titel: "Cash-to-Cash-Cycle (Tage)", kopf: ["Kennzahl", "Ist", "Plan", "ΔPL"],
          zeilen: cs.map(c => [c.label, zahl(c.ist, 1), zahl(c.plan, 1), delta(c.d, 1)]) },
        { titel: `Kommentar ${spartenName()}`, kopf: ["Text", "Art", "Verantwortlich", "Termin"],
          zeilen: ks.map(k => [k.text, k.art === "status" ? "Status" : "Maßnahme", k.wer || "–", k.termin || "–"]) },
      ];
    },
  });
  zeichnen();
})();
