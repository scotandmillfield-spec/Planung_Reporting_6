/* Abb. 4.23 – Multidimensionale Analyse der Balanced Chance and Risk Card (softwareneutraler Nachbau eines
   OLAP-Analysewerkzeugs). Seite 1024 x 646 px. Daten: bcr_olap.json (daten_bcr_olap.py) – additive Basisgrößen je
   Jahr, Quartal, Standort und Produkt; alle Kennzahlen werden aus Zähler und Nenner gerechnet.
   Aufbau wie im Original: links der Dimensionsbaum (Jahr, Standort, Produkt, Kennzahlen), oben die Dimensionsleiste mit
   der Schicht (Perspektive, „Schicht 1 von 4“) und der Spaltendimension, rechts die Kreuztabelle mit Chancen und
   Risiken je Perspektive, Jahren und Veränderungen; neu darunter ein Diagramm der gewählten Kennzahl.
   Drill-down: Klick auf einen Jahres- bzw. Standortkopf (oder die Säule, oder das Element im Baum) zeigt die nächste
   Ebene (Quartale bzw. Produkte des Standorts), „↑ Ebene höher“ oder Esc gehen zurück. Elemente im Baum, deren
   Dimension nicht in den Spalten steht, filtern (Schnitt). Klick auf eine Zeile wählt die Kennzahl für das Diagramm. */
(() => {
  "use strict";
  const { zahl, delta, wirkung, FARBE, NBSP, sv, el, tw } = DK;
  const D = DATA, J = D.jahre, STO = D.standorte, PRO = D.produkte, PER = D.perspektiven;
  const FI = Object.fromEntries(D.felder.map((f, i) => [f, 4 + i]));
  const R = D.saetze;
  const KZ = D.kennzahlen.map(([p, art, name, einheit, zaehler, nenner, faktor, nk, richtung, dmodus], i) =>
    ({ i, p, art, name, einheit, zaehler, nenner, faktor, nk, richtung, dmodus }));
  const FELDNAME = { eva: "EVA", kapitalkosten: "Kapitalkosten", kapital: "Kapital", ebt: "EBT", umsatz: "Umsatz", cashflow: "Cash Flow",
    bruttoertrag: "Bruttoertrag", rv_int: "Risikovorsorge intern", rv_ext: "Risikovorsorge extern", ausfall: "Forderungsausfälle", fk: "Fremdkapital",
    absatz: "Absatz", marktvolumen: "Marktvolumen", zufr_punkte: "Zufriedenheitspunkte", kunden: "Kunden", neukundenumsatz: "Umsatz mit Neukunden",
    grosskundenumsatz: "Umsatz mit Großkunden", reklamationen: "Reklamationen", auftraege: "Aufträge", puenktlich: "pünktliche Lieferungen",
    lieferungen: "Lieferungen", dlz_tage: "Durchlaufzeit (Tage)", ausschuss: "Ausschuss", produktion: "Produktion", neuproduktumsatz: "Umsatz neuer Produkte",
    vorschlaege: "Verbesserungsvorschläge", kranktage: "Krankheitstage", solltage: "Sollarbeitstage", austritte: "Austritte" };
  const passt = (k, breite) => k.find(t => tw(t) <= breite) || k[k.length - 1];
  const kurzJ = j => "’" + String(J[j]).slice(2);

  /* ---------- Rechnen ---------- */
  function wert(k, rs) {
    let z = 0, n = 0;
    for (const r of rs) { for (const f of k.zaehler) z += r[FI[f]]; if (k.nenner) n += r[FI[k.nenner]]; }
    if (!rs.length) return null;
    return k.nenner ? (n ? z / n * k.faktor : null) : z * k.faktor;
  }
  const fmt = (k, v) => (v == null ? "–" : zahl(v, k.nk));
  function dWert(k, a, b) {
    if (a == null || b == null) return null;
    if (k.dmodus === "rel") return a ? (b / a - 1) * 100 : null;
    return b - a;
  }
  const dFmt = (k, d) => (d == null ? "–" : k.dmodus === "rel" ? delta(d, 1, NBSP + "%") : k.dmodus === "pp" ? delta(d, k.nk, NBSP + "%-Pkt.") : delta(d, k.nk));
  const relAenderung = (k, a, b) => (a ? (b / a - 1) * 100 : 0);

  /* ---------- Zustand ---------- */
  const S = { persp: 0, spalten: "jahr", drillJahr: null, drillStandort: null, jahr: 2, standort: null, produkt: null, kz: null };
  const gedrillt = () => (S.spalten === "jahr" && S.drillJahr !== null) || (S.spalten === "standort" && S.drillStandort !== null);
  function hoch() { if (S.spalten === "jahr") S.drillJahr = null; else S.drillStandort = null; zeichnen(); }
  addEventListener("keydown", e => {
    if (e.key !== "Escape") return;
    if (S.kz !== null) { S.kz = null; zeichnen(); } else if (gedrillt()) hoch();
  });

  // Schnitte der Dimensionen, die nicht in den Spalten stehen
  const basis = () => R.filter(r => (S.spalten === "jahr" || r[0] === S.jahr) &&
    (S.spalten === "standort" || S.standort === null || r[2] === S.standort) &&
    (S.spalten === "produkt" || (S.spalten === "standort" && S.drillStandort !== null) || S.produkt === null || r[3] === S.produkt));
  function spaltenListe() {
    if (S.spalten === "jahr") {
      if (S.drillJahr === null) return [
        ...J.map((y, j) => ({ key: "j" + j, titel: String(y), lang: `Jahr ${y}`, pred: r => r[0] === j, drill: () => { S.drillJahr = j; } })),
        ...[[0, 1], [1, 2], [0, 2]].map(([a, b]) => ({ key: `d${a}${b}`, titel: `Δ ${J[a]}–${kurzJ(b)}`, lang: `Veränderung ${J[a]}–${J[b]}`, delta: [a, b] }))];
      const dj = S.drillJahr;
      return [...[0, 1, 2, 3].map(q => ({ key: "q" + q, titel: `Q${q + 1} ${J[dj]}`, lang: `${q + 1}. Quartal ${J[dj]}`, pred: r => r[0] === dj && r[1] === q })),
              { key: "jg", titel: `Jahr ${J[dj]}`, lang: `Jahr ${J[dj]}`, pred: r => r[0] === dj, summe: true }];
    }
    if (S.spalten === "standort") {
      if (S.drillStandort === null) return [
        ...STO.map((n, s) => ({ key: "s" + s, titel: n, lang: `Standort ${n}`, pred: r => r[2] === s, drill: () => { S.drillStandort = s; } })),
        { key: "k", titel: "Konzern", lang: "Konzern", pred: () => true, summe: true }];
      const ds = S.drillStandort;
      return [...PRO.map((n, p) => ({ key: "p" + p, titel: n, lang: `${STO[ds]} · ${n}`, pred: r => r[2] === ds && r[3] === p })),
              { key: "sg", titel: STO[ds], lang: `Standort ${STO[ds]} gesamt`, pred: r => r[2] === ds, summe: true }];
    }
    return [...PRO.map((n, p) => ({ key: "p" + p, titel: n, lang: n, pred: r => r[3] === p })),
            { key: "pa", titel: "alle Produkte", lang: "alle Produkte", pred: () => true, summe: true }];
  }
  function matrixDaten() {
    const rs = basis(), sp = spaltenListe(), ks = KZ.filter(k => k.p === S.persp);
    const zeilen = ks.map(k => {
      const w = {};
      sp.forEach(c => { if (!c.delta) w[c.key] = wert(k, rs.filter(c.pred)); });
      sp.forEach(c => { if (c.delta) w[c.key] = dWert(k, w["j" + c.delta[0]], w["j" + c.delta[1]]); });
      return { k, w };
    });
    return { rs, sp, zeilen };
  }
  const dimName = () => (S.spalten === "jahr" ? (S.drillJahr === null ? "Jahren" : `Quartalen ${J[S.drillJahr]}`)
    : S.spalten === "standort" ? (S.drillStandort === null ? "Standorten" : `Produkten in ${STO[S.drillStandort]}`) : "Produkten");
  function schnittText() {
    const t = [];
    if (S.spalten !== "jahr") t.push(`Jahr ${J[S.jahr]}`);
    if (S.spalten !== "standort") t.push(S.standort === null ? "Konzern" : `Standort ${STO[S.standort]}`);
    if (S.spalten !== "produkt" && !(S.spalten === "standort" && S.drillStandort !== null)) t.push(S.produkt === null ? "alle Produkte" : PRO[S.produkt]);
    return t;
  }

  /* ---------- Layout ---------- */
  DK.init({ titel: "Balanced Chance and Risk Card – multidimensionale Analyse" });
  const seite = document.getElementById("seite");
  const bBaum = DK.box("dimensionen", 16, 10, 190, 630);
  el("div", { style: "position:absolute;left:218px;top:10px;height:630px;border-left:1px solid var(--linie)" }, seite);
  const bKopf = DK.box("kopf", 232, 10, 776, 46);
  DK.haarlinie(62, 232, 16);
  const bFilter = DK.box("filter", 232, 68, 776, 50, "dk-filter");
  DK.haarlinie(124, 232, 16);
  const bTab = DK.box("v-kreuztabelle", 232, 132, 776, 350);
  DK.haarlinie(488, 232, 16);
  const bDia = DK.box("v-diagramm", 232, 496, 776, 146);
  DK.el("style", {}, document.head, `
    .kt { table-layout: fixed; }
    .kt td { height: 18px; overflow: hidden; text-overflow: ellipsis; }
    .kt th { height: 20px; }
    .kt tr.kt-gruppe td { font-weight: bold; color: var(--muted); border-top: 1px solid #9A9A9A; padding-top: 2px; }
    .kt tr.kt-gruppe.erste td { border-top: none; }
    .kt td.kt-summe, .kt th.kt-summe { font-weight: bold; }
    .kt th.kt-drill { cursor: pointer; text-decoration: underline; text-decoration-color: #BDBDBD; text-underline-offset: 3px; }
    .kt th.kt-drill:hover { color: var(--text); text-decoration-color: var(--text); }
    .kt td.kt-delta { border-left: none; }
    .kt th.kt-trenner, .kt td.kt-trenner { border-left: 1px solid var(--linie); }
    .kt-hoch { margin-left: auto; font: inherit; font-size: 14px; height: 24px; padding: 0 8px; border: 1px solid #9A9A9A; border-radius: 3px;
      background: #FFFFFF; color: var(--text); cursor: pointer; }
    #dimensionen { font-size: 14px; }
    .bm-kopf { font-size: 16px; font-weight: bold; }
    .bm-unter { color: var(--muted); margin: 2px 0 8px; }
    .bm-dim { margin-top: 10px; padding-bottom: 3px; border-bottom: 1px solid var(--ac); display: flex; justify-content: space-between; font-weight: bold; }
    .bm-dim span { font-weight: normal; color: var(--muted); }
    .bm-el { height: 22px; display: flex; align-items: center; padding-left: 10px; cursor: pointer; border-left: 3px solid transparent; }
    .bm-el.tief { padding-left: 24px; }
    .bm-el:hover { background: var(--flaeche); }
    .bm-el.an { font-weight: bold; border-left-color: var(--ac); }
    .bm-el.aus { color: #8F8F8F; cursor: default; }
    .bm-el.aus:hover { background: none; }
    .bm-hinweis { color: var(--muted); margin-top: 12px; line-height: 1.35; }`);

  /* ---------- lokaler Tooltip mit Ereignis ---------- */
  const tip = document.querySelector(".dk-tooltip");
  function tooltip(ziel, fn) {
    ziel.addEventListener("pointermove", ev => {
      const z = (fn(ev) || []).filter(Boolean);
      if (!z.length) { tip.style.display = "none"; return; }
      tip.textContent = "";
      z.forEach((t, i) => el(i === 0 ? "b" : "div", {}, tip, t));
      tip.style.display = "block";
      const r = tip.getBoundingClientRect();
      let x = ev.clientX + 14, y = ev.clientY + 14;
      if (x + r.width > innerWidth - 8) x = ev.clientX - r.width - 14;
      if (y + r.height > innerHeight - 8) y = ev.clientY - r.height - 14;
      tip.style.left = x + "px"; tip.style.top = y + "px";
    });
    ziel.addEventListener("pointerleave", () => { tip.style.display = "none"; });
  }

  /* ---------- Dimensionsleiste: Schicht und Spaltendimension ---------- */
  const knopfSchicht = DK.schnitt(bFilter, "Schicht (Perspektive)", "knoepfe", { optionen: PER.map((n, i) => [i, n]), wert: 0,
    onChange: v => { S.persp = Number(v); S.kz = null; zeichnen(); } });
  const knopfSpalten = DK.schnitt(bFilter, "Spalten", "knoepfe", { optionen: [["jahr", "Jahr"], ["standort", "Standort"], ["produkt", "Produkt"]], wert: "jahr",
    onChange: v => { S.spalten = v; S.drillJahr = null; S.drillStandort = null; zeichnen(); } });

  /* ---------- Dimensionsbaum ---------- */
  function baum() {
    bBaum.textContent = "";
    el("div", { class: "bm-kopf" }, bBaum, "Dimensionen");
    el("div", { class: "bm-unter" }, bBaum, "Klick filtert oder öffnet die Ebene");
    const dim = (name, achse, id) => { const d = el("div", { class: "bm-dim", id }, bBaum, name); if (achse) el("span", {}, d, "Spalten"); };
    const eintrag = (text, an, fn, tief = false, aus = false, id) => {
      const e = el("div", { class: "bm-el" + (tief ? " tief" : "") + (an ? " an" : "") + (aus ? " aus" : ""), ...(id ? { id } : {}) }, bBaum, text);
      if (!aus && !DK.PRINT) e.addEventListener("click", fn);
      return e;
    };
    dim("Jahr", S.spalten === "jahr", "bm-jahr");
    J.forEach((y, j) => eintrag(String(y) + (S.spalten === "jahr" ? " › Quartale" : ""), S.spalten === "jahr" ? S.drillJahr === j : S.jahr === j,
      () => { if (S.spalten === "jahr") S.drillJahr = S.drillJahr === j ? null : j; else S.jahr = j; zeichnen(); }, true));
    dim("Standort", S.spalten === "standort", "bm-standort");
    eintrag("Konzern", S.spalten === "standort" ? S.drillStandort === null : S.standort === null,
      () => { if (S.spalten === "standort") S.drillStandort = null; else S.standort = null; zeichnen(); });
    STO.forEach((n, s) => eintrag(n + (S.spalten === "standort" ? " › Produkte" : ""), S.spalten === "standort" ? S.drillStandort === s : S.standort === s,
      () => { if (S.spalten === "standort") S.drillStandort = S.drillStandort === s ? null : s; else S.standort = S.standort === s ? null : s; zeichnen(); }, true));
    const prodAus = S.spalten === "produkt" || (S.spalten === "standort" && S.drillStandort !== null);
    dim("Produkt", S.spalten === "produkt", "bm-produkt");
    eintrag("alle Produkte", !prodAus && S.produkt === null, () => { S.produkt = null; zeichnen(); }, false, prodAus);
    PRO.forEach((n, p) => eintrag(n, !prodAus && S.produkt === p, () => { S.produkt = S.produkt === p ? null : p; zeichnen(); }, true, prodAus));
    dim("Kennzahlen", false, "bm-kennzahlen");
    PER.forEach((n, i) => eintrag(n, S.persp === i, () => { S.persp = i; S.kz = null; zeichnen(); }, true));
    el("div", { class: "bm-hinweis" }, bBaum, "Steht die Dimension in den Spalten, öffnet der Klick die nächste Ebene (Drill-down).");
  }

  /* ---------- Kreuztabelle ---------- */
  function kreuztabelle(f, M) {
    const { sp, zeilen } = M;
    const lw = Math.ceil(Math.max(tw("Kennzahl"), ...zeilen.map(z => tw(`${z.k.name} (${z.k.einheit})`) + 12))) + 14;
    const ww = sp.map(c => Math.ceil(Math.max(tw(c.titel, 14, !!c.summe), ...zeilen.map(z => tw(c.delta ? dFmt(z.k, z.w[c.key]) : fmt(z.k, z.w[c.key]), 14, true)))) + 18);
    const summe = lw + ww.reduce((a, b) => a + b, 0), frei = Math.max(0, f.breite - summe);
    const W = [lw + frei * 0.3, ...ww.map(w => w + frei * 0.7 / ww.length)];
    const t = el("table", { class: "dk-matrix kt", id: "kt-tabelle", style: `width:${Math.max(f.breite, summe)}px` }, f.flaeche);
    const cg = el("colgroup", {}, t);
    W.forEach(w => el("col", { style: `width:${w}px` }, cg));
    const hr = el("tr", {}, el("thead", {}, t));
    el("th", { id: "kt-kopf-kz" }, hr, "Kennzahl");
    sp.forEach((c, i) => {
      const th = el("th", { id: "kt-kopf-" + c.key, class: (c.summe ? "kt-summe" : "") + (c.delta && !sp[i - 1].delta ? " kt-trenner" : "") + (c.drill && !DK.PRINT ? " kt-drill" : "") }, hr, c.titel);
      if (c.drill && !DK.PRINT) { th.title = "Klick: nächste Ebene (Drill-down)"; th.addEventListener("click", () => { c.drill(); zeichnen(); }); }
    });
    const tb = el("tbody", {}, t);
    let art = null;
    zeilen.forEach(z => {
      if (z.k.art !== art) {
        art = z.k.art;
        const g = el("tr", { class: "kt-gruppe" + (tb.children.length ? "" : " erste") }, tb);
        el("td", { colspan: sp.length + 1 }, g, art === "C" ? "Chancen" : "Risiken");
      }
      const tr = el("tr", { class: "dk-zeile" + (S.kz !== null && S.kz !== z.k.i ? " dk-blass" : "") }, tb);
      const lt = el("td", { style: "padding-left:12px" }, tr, z.k.name + " ");
      el("span", { style: "color:var(--muted)" }, lt, `(${z.k.einheit})`);
      sp.forEach((c, i) => {
        const v = z.w[c.key], cls = [c.summe ? "kt-summe" : "", c.delta && !sp[i - 1].delta ? "kt-trenner" : ""];
        if (c.delta) {
          const kl = v == null ? "neutral" : wirkung(v, z.k.richtung, z.k.dmodus === "rel" ? 1 : z.k.nk);
          el("td", { class: cls.join(" ") + " " + kl, "data-j": i }, tr, dFmt(z.k, v));
        } else el("td", { class: cls.join(" "), "data-j": i }, tr, fmt(z.k, v));
      });
      tr.addEventListener("click", () => { S.kz = S.kz === z.k.i ? null : z.k.i; zeichnen(); });
      tooltip(tr, ev => {
        const td = ev.target.closest ? ev.target.closest("td") : null, j = td && td.dataset.j !== undefined ? +td.dataset.j : null;
        const c = j === null ? null : sp[j], k = z.k;
        const def = k.nenner ? `${k.zaehler.map(f => FELDNAME[f]).join(" + ")} : ${FELDNAME[k.nenner]}${k.faktor === 100 ? " × 100" : ""}`
          : k.zaehler.map(f => FELDNAME[f]).join(" + ");
        const out = [`${k.name} (${k.einheit}) · ${k.art === "C" ? "Chance" : "Risiko"} · ${PER[k.p]}`];
        if (c && c.delta) out.push(`${c.lang}: ${dFmt(k, z.w[c.key])} (${fmt(k, z.w["j" + c.delta[0]])} → ${fmt(k, z.w["j" + c.delta[1]])})`,
          k.dmodus === "pp" ? "Bei Quoten Veränderung in Prozentpunkten" : null,
          `Wirkung: ${k.richtung > 0 ? "Anstieg günstig" : "Anstieg ungünstig"}`);
        else if (c) out.push(`${c.lang}: ${fmt(k, z.w[c.key])} ${k.einheit}`);
        out.push(`Berechnung: ${def}`);
        const st = schnittText();
        if (st.length) out.push("Schnitt: " + st.join(", "));
        out.push("Klick wählt die Kennzahl für das Diagramm");
        return out;
      });
    });
    requestAnimationFrame(() => t.querySelectorAll("td").forEach(td => { if (!td.colSpan || td.colSpan === 1) if (td.scrollWidth > td.clientWidth + 1) console.error("Text zu lang: " + td.textContent); }));
  }

  /* ---------- Diagramm der gewählten Kennzahl über die Spaltenelemente (ohne Summen und Veränderungen) ---------- */
  function diagramm(f, k, M) {
    const sp = M.sp.filter(c => !c.delta && !c.summe), W = f.breite, H = f.hoehe;
    const z = M.zeilen.find(x => x.k.i === k.i), werte = sp.map(c => z.w[c.key]);
    const svg = sv("svg", { width: W, height: H, role: "img", "aria-label": `${k.name} nach ${dimName()}`, id: "dia-svg" }, f.flaeche);
    const oben = 18, unten = 20, PH = H - oben - unten, slot = Math.min(150, W / sp.length), bw = Math.min(56, slot * 0.5);
    const max = Math.max(...werte.map(v => Math.abs(v || 0)), 1e-9), basisY = oben + PH;
    sp.forEach((c, i) => {
      const v = werte[i], cx = slot * i + slot / 2, h = Math.abs(v || 0) / max * PH;
      const g = sv("g", { class: c.drill ? "dk-klick" : "" }, svg);
      sv("rect", { x: cx - bw / 2, y: basisY - h, width: bw, height: Math.max(v ? 1 : 0, h), fill: FARBE.ist }, g);
      sv("text", { x: cx, y: basisY - h - 5, "text-anchor": "middle" }, g, fmt(k, v));
      sv("text", { x: cx, y: H - 3, "text-anchor": "middle", class: "muted" }, g, c.titel);
      // Trefferfläche bewusst nicht „transparent“: Klick öffnet die nächste Ebene, keine Auswahl
      const hit = sv("rect", { x: slot * i, y: 0, width: slot, height: H, fill: "#FFFFFF", "fill-opacity": 0 }, g);
      if (c.drill && !DK.PRINT) hit.addEventListener("click", () => { c.drill(); zeichnen(); });
      tooltip(hit, () => [`${k.name} · ${c.lang}`, `${fmt(k, v)} ${k.einheit}`, c.drill ? "Klick: nächste Ebene (Drill-down)" : null]);
    });
    sv("line", { x1: 0, x2: slot * sp.length, y1: basisY + 0.5, y2: basisY + 0.5, stroke: "#8C8C8C", "stroke-width": 1 }, svg);
  }

  /* ---------- Zeichnen ---------- */
  function zeichnen() {
    [...knopfSchicht.querySelectorAll("button")].forEach((b, i) => b.setAttribute("aria-pressed", String(i === S.persp)));
    [...knopfSpalten.querySelectorAll("button")].forEach((b, i) => b.setAttribute("aria-pressed", String(["jahr", "standort", "produkt"][i] === S.spalten)));
    const st = schnittText();
    DK.kopf(bKopf, { titel: "Balanced Chance and Risk Card",
      untertitel: passt([`Multidimensionale Analyse · Schicht ${S.persp + 1} von ${PER.length}: ${PER[S.persp]} · ${st.length ? st.join(" · ") + " · " : ""}Spalten nach ${dimName()}`,
                         `Schicht ${S.persp + 1} von ${PER.length}: ${PER[S.persp]} · ${st.join(" · ")}`], 560),
      quelle: "Quelle: Konzern-Controlling", legende: [[FARBE.gut, "günstig"], [FARBE.schlecht, "ungünstig"]] });
    baum();

    const M = matrixDaten(), k = KZ.find(x => x.i === S.kz) || M.zeilen[0].k;
    // Botschaft der Kreuztabelle
    let bT;
    if (S.spalten === "jahr" && S.drillJahr === null) {
      const bew = M.zeilen.map(z => ({ z, d: z.w.d02, kl: z.w.d02 == null ? "neutral" : wirkung(z.w.d02, z.k.richtung, z.k.dmodus === "rel" ? 1 : z.k.nk),
                                     rel: relAenderung(z.k, z.w.j0, z.w.j2) }));
      const gut = bew.filter(b => b.kl === "gut"), schlecht = bew.filter(b => b.kl === "schlecht").sort((a, b) => Math.abs(b.rel) - Math.abs(a.rel));
      bT = passt([`${gut.length} von ${bew.length} Kennzahlen seit ${J[0]} verbessert` + (schlecht.length ? `; ungünstig vor allem ${schlecht[0].z.k.name} (${dFmt(schlecht[0].z.k, schlecht[0].d)})` : ""),
                  `${gut.length} von ${bew.length} Kennzahlen seit ${J[0]} verbessert`], 772);
    } else {
      const z = M.zeilen.find(x => x.k.i === k.i), sp = M.sp.filter(c => !c.summe);
      const o = sp.map(c => ({ c, v: z.w[c.key] })).filter(x => x.v != null).sort((a, b) => b.v - a.v);
      bT = o.length ? passt([`${k.name}: höchster Wert ${o[0].c.titel} (${fmt(k, o[0].v)} ${k.einheit}), niedrigster ${o[o.length - 1].c.titel} (${fmt(k, o[o.length - 1].v)} ${k.einheit})`,
                             `${k.name}: ${o[0].c.titel} am höchsten, ${o[o.length - 1].c.titel} am niedrigsten`], 772) : "Keine Werte";
    }
    let f = DK.visual(bTab, { titel: `${PER[S.persp]} nach ${dimName()}`, einheit: "Einheit je Zeile", botschaft: bT });
    if (gedrillt() && !DK.PRINT) {
      const b = el("button", { type: "button", class: "kt-hoch", id: "kt-hoch" }, bTab.querySelector(".dk-titelzeile"), "↑ Ebene höher");
      b.addEventListener("click", hoch);
    }
    kreuztabelle(f, M);

    // Diagramm
    const zk = M.zeilen.find(x => x.k.i === k.i), spd = M.sp.filter(c => !c.delta && !c.summe), wv = spd.map(c => zk.w[c.key]);
    let bD;
    if (S.spalten === "jahr" && S.drillJahr === null) {
      const d = dWert(k, wv[0], wv[wv.length - 1]), kl = d == null ? "neutral" : wirkung(d, k.richtung, k.dmodus === "rel" ? 1 : k.nk);
      bD = passt([`${k.name} ${J[0]}–${J[J.length - 1]}: ${fmt(k, wv[0])} → ${fmt(k, wv[wv.length - 1])} ${k.einheit} (${dFmt(k, d)}, ${kl === "gut" ? "günstig" : kl === "schlecht" ? "ungünstig" : "neutral"})`,
                  `${k.name}: ${fmt(k, wv[0])} → ${fmt(k, wv[wv.length - 1])} ${k.einheit}`], 772);
    } else {
      const mx = Math.max(...wv.filter(v => v != null)), i = wv.indexOf(mx);
      bD = passt([`${k.name}: ${spd[i].titel} vorn mit ${fmt(k, mx)} ${k.einheit}` + (spd[i].drill ? " – Klick auf eine Säule öffnet die nächste Ebene" : ""),
                  `${k.name}: ${spd[i].titel} vorn`], 772);
    }
    f = DK.visual(bDia, { titel: `${k.name} nach ${dimName()}`, einheit: k.einheit, botschaft: bD });
    diagramm(f, k, M);
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  /* ---------- Lernplattform ---------- */
  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "kt-kopf-j2", anker: "links", versatz: [30, -2], regel: "STRUCTURE – Hierarchien öffnen", titel: "Echter Drill-down",
        text: "Ein Klick auf einen Jahres- oder Standortkopf, auf eine Säule oder auf das Element im Dimensionsbaum zeigt die nächste Ebene: Jahr › Quartale, Konzern › Standorte › Produkte. „↑ Ebene höher“ oder Esc gehen zurück. Alle Kennzahlen werden dabei aus additiven Basisgrößen neu gerechnet, so stimmen Quoten wie ROI oder Risikovorsorgequote auf jeder Ebene." },
      { nr: 2, ziel: "dimensionen", anker: "links", versatz: [180, 2], regel: "CONDENSE – Schnitt und Würfel", titel: "Dimensionsbaum und Dimensionsleiste",
        text: "Wie im Original stehen links die Dimensionen Jahr, Standort, Produkt und Kennzahlen. Ein Klick auf ein Element einer Dimension, die nicht in den Spalten steht, schneidet den Würfel (z. B. nur Hamburg oder nur Produkt B). Die Dimensionsleiste wählt die Schicht – die Perspektive, im Original „Schicht 1 von 4“ – und die Spaltendimension (Pivotieren)." },
      { nr: 3, ziel: "kt-kopf-d02", anker: "links", versatz: [26, -2], regel: "EXPRESS – Richtige Veränderung", titel: "Prozentpunkte bei Quoten, Farbe nach Wirkung",
        text: "Bei Quoten steht die Veränderung in Prozentpunkten: ROI 7,68 % → 6,70 % ist −0,98 %-Pkt.; das Original zeigte −12,68 % (Veränderung der Quote in Prozent). Die Farbe folgt der Wirkung – bei Risiken ist ein Anstieg ungünstig. Das Original färbte alle Chancen grün und alle Risiken rot, unabhängig von der Entwicklung." },
      { nr: 4, ziel: "v-diagramm", anker: "links", versatz: [250, 2], regel: "SAY – Botschaft vermitteln", titel: "Diagramm der gewählten Kennzahl",
        text: "Unter der Kreuztabelle zeigt ein Säulendiagramm die gewählte Kennzahl über die Elemente der Spaltendimension, mit einer berechneten Aussage. Ein Klick auf eine Zeile der Tabelle wählt die Kennzahl, ein Klick auf eine Säule öffnet die nächste Ebene. Im Original gab es Diagramme nur als eigene Ansicht über die Symbolleiste." },
      { nr: 5, ziel: "kt-tabelle", anker: "links", versatz: [100, 24], regel: "UNIFY – Ohne Farbflächen", titel: "Chancen und Risiken als Gruppen",
        text: "Perspektive, Chancen und Risiken sind Gruppenüberschriften mit Linien statt dunkel- und hellblauer Bänder; grüne und rote Schrift für Chancen und Risiken entfällt. Die Einheit steht an der Kennzahl statt an jeder Zahl, Beträge in Tsd. €." },
      { nr: 6, ziel: "kt-kopf-j0", anker: "links", versatz: [-6, -4], regel: "CHECK – Werte des Originals", titel: "Konzernwerte wie im Original",
        text: "Die Konzernwerte der Finanzperspektive entsprechen dem Original (2000–2002 als 2024–2026): EVA, EBT, Cash Flow, Umsatz, Bruttoertrag und Risikovorsorgekosten exakt, WACC, ROI, ROS und die Risikoquoten auf zwei Nachkommastellen. Die Verteilung auf Quartale, Standorte und Produkte und die übrigen Perspektiven sind erfunden." },
      { nr: 7, ziel: "kopf-titel", anker: "links", versatz: [384, 0], regel: "SIMPLIFY – Ohne Programmrahmen", titel: "Ohne Menüs, Symbolleisten und Logo",
        text: "Titelleiste, Menü- und Symbolleisten, Statuszeile, Bildlaufleisten und die Titelgrafik mit Namen entfallen. Die Analyse heißt nach ihrem Inhalt; Standorte und Produkte bleiben als Dimensionselemente erhalten." },
    ],
    nachbauIntro: "Seitengröße benutzerdefiniert 1024 × 646 px, Schrift Arial: Beschriftungen 10,5 pt, Visualtitel 12 pt. Datenmodell: Faktentabelle mit den Basisgrößen je Jahr, Quartal, Standort und Produkt (CSV), Dimensionstabellen Datum (Jahr › Quartal), Standort, Produkt sowie eine Kennzahlentabelle (Perspektive, Art, Kennzahl) für einen Feldparameter. Quoten als Measures mit DIVIDE, z. B. ROI = DIVIDE(SUM(Fakten[ebt]); SUM(Fakten[kapital])); Δ in %-Pkt. als Differenz der Quoten.",
    nachbau: [
      { id: "A", ziel: "v-kreuztabelle", versatz: [0, 0], titel: "Kreuztabelle", visual: "Matrix",
        felder: "Zeilen: Art (Chance/Risiko), Kennzahl (Feldparameter oder berechnete Gruppe); Spalten: Datum[Jahr] › Datum[Quartal] bzw. Standort › Produkt; Werte: [Kennzahlwert], dazu Δ-Measures",
        format: "Drill-down über die Symbole „Eine Ebene nach unten“ bzw. „Zur nächsten Ebene wechseln“ (Spaltenhierarchie); Δ-Schriftfarbe bedingt nach Wirkung (#00806B/#C62828); Gruppenüberschriften fett ohne Hintergrund",
        hinweis: "Die Schicht (Perspektive) entspricht einem Filter auf die Kennzahlentabelle." },
      { id: "B", ziel: "v-diagramm", versatz: [0, 0], titel: "Diagramm der Kennzahl", visual: "Gruppiertes Säulendiagramm",
        felder: "X-Achse: dieselbe Hierarchie wie die Matrixspalten; Y-Achse: [Kennzahlwert] der in der Matrix gewählten Kennzahl (Interaktion „Filtern“)",
        format: "#3A3F44, Datenbeschriftungen ein, Y-Achse aus; Drill-down-Modus ein" },
      { id: "C", ziel: "dimensionen", anker: "links", versatz: [180, 2], titel: "Dimensionsbaum", visual: "Datenschnitt (Hierarchie) je Dimension",
        felder: "Datum (Jahr › Quartal), Standort, Produkt, Perspektive", format: "Stil „Vertikale Liste“, Einzelauswahl; Kopfzeile fett" },
      { id: "D", ziel: "filter", anker: "links", versatz: [180, -2], titel: "Dimensionsleiste", visual: "Datenschnitt (Kacheln) und Feldparameter",
        felder: "Schicht: Perspektive; Spalten: Feldparameter mit Jahr, Standort, Produkt für die Matrixspalten", format: "Ausgewählt #3A3F44 mit weißer Schrift" },
    ],
    theme: DK.thema(),
    csv: { name: "bcr_wuerfel_basisgroessen.csv", text: () =>
      [["Jahr", "Quartal", "Standort", "Produkt", ...D.felder].join(";"),
       ...R.map(z => [J[z[0]], "Q" + (z[1] + 1), STO[z[2]], PRO[z[3]], ...z.slice(4)].join(";"))].join("\r\n") },
    tabellen: () => {
      const M = matrixDaten(), st = schnittText();
      return [{ titel: `${PER[S.persp]} nach ${dimName()}${st.length ? " – " + st.join(", ") : ""}`, kopf: ["Kennzahl", "Einheit", ...M.sp.map(c => c.titel)],
        zeilen: M.zeilen.map(z => [z.k.name, z.k.einheit, ...M.sp.map(c => (c.delta ? dFmt(z.k, z.w[c.key]) : fmt(z.k, z.w[c.key])))]) }];
    },
  });
  zeichnen();
})();
