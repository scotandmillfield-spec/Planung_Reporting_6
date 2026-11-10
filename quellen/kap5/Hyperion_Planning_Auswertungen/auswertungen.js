/* Abb. 5.80 „Auswertungen“ – GuV und Umsatz nach Produkten aus der integrierten Planung (softwareneutraler Nachbau
   zweier Berichte einer Planungs- und Konsolidierungssoftware). Seite 1024 x 646 px.
   Daten: auswertungen.json (daten_auswertungen.py ← Planungsmodell der Serie 5.78–5.82): Plan 2028 (Version Bottom-up)
   und Ist 2027 je Gesellschaft, Produkt und Monat; Kosten je Gesellschaft, Konto und Monat.
   Links die GuV nach Quartalen mit ΔVJ (Expansions: „Fixkosten gesamt“ und „Variable Herstellkosten“ auf- und
   zuklappbar), rechts der Umsatzdetailbericht nach Produkten und die Anteile der Produkte am Nettoumsatz.
   Investigation: Klick auf den Nettoumsatz eines Quartals verlinkt zum Umsatz nach Produkten dieses Quartals.
   Klick auf eine Produktzeile oder einen Balken filtert die GuV bis zum Deckungsbeitrag; Esc hebt auf. */
(() => {
  "use strict";
  const { zahl, delta, wirkung, FARBE, NBSP, el, sv, tw } = DK;
  const D = DATA, G = D.gesellschaften, P = D.produkte, [JI, JP] = D.jahre;
  const U = D.u.map(r => ({ s: r[0], g: r[1], p: r[2], m: r[3], a: r[4], nu: r[5], bv: r[6], fm: r[7], fl: r[8], fr: r[9] }));
  const K = D.k.map(r => ({ s: r[0], g: r[1], k: r[2], m: r[3], b: r[4] }));
  const GR = [], LI = [];
  D.linien.forEach(([l, gs]) => { const li = LI.length; LI.push({ name: l, gruppen: [] });
    gs.forEach(([g, ps]) => { LI[li].gruppen.push(GR.length); GR.push({ name: g, linie: li, produkte: ps.map(p => P.indexOf(p)) }); }); });
  const SEITEN = [["Konzern", G.map((_, i) => i)]];
  D.regionen.forEach(([r, gs]) => { SEITEN.push([r, gs.map(g => G.indexOf(g))]); gs.forEach(g => SEITEN.push([g, [G.indexOf(g)]])); });
  const QN = ["Q1", "Q2", "Q3", "Q4"];
  const tsd = v => zahl(v / 1000, 0), mio = v => zahl(v / 1e6, 1);
  const pz = (v, nk = 0) => zahl(v * 100, nk) + NBSP + "%";
  const pd = (a, b, nk = 1) => (b ? delta((a / b - 1) * 100, nk, NBSP + "%") : "–");
  const passt = (k, b) => k.find(t => tw(t) <= b) || k[k.length - 1];

  /* ---------- Zustand ---------- */
  const S = { seite: "Deutschland", zeile: null, q: null, prod: null, offenGuV: new Set(["fix"]), offenProd: new Set(["l0", "l1"]) };
  addEventListener("keydown", e => { if (e.key === "Escape" && (S.zeile || S.prod || S.q !== null)) { S.zeile = null; S.q = null; S.prod = null; zeichnen(); } });
  const gis = () => SEITEN.find(s => s[0] === S.seite)[1];
  const prodAuswahl = () => !S.prod ? null : S.prod[0] === "p" ? [S.prod[1]] : S.prod[0] === "g" ? GR[S.prod[1]].produkte
    : LI[S.prod[1]].gruppen.flatMap(g => GR[g].produkte);
  const prodName = () => !S.prod ? "" : S.prod[0] === "p" ? P[S.prod[1]] : S.prod[0] === "g" ? GR[S.prod[1]].name : LI[S.prod[1]].name;

  /* ---------- Berechnung ---------- */
  const monate = q => (q === null || q === undefined ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] : [3 * q, 3 * q + 1, 3 * q + 2]);
  function guv(s, q, ps) {
    const gg = gis(), ms = monate(q);
    const u = U.filter(r => r.s === s && gg.includes(r.g) && ms.includes(r.m) && (!ps || ps.includes(r.p)));
    const su = f => u.reduce((a, r) => a + r[f], 0);
    const k = ki => (ps ? null : K.filter(r => r.s === s && gg.includes(r.g) && r.k === ki && ms.includes(r.m)).reduce((a, r) => a + r.b, 0));
    const z = { nu: su("nu"), bv: su("bv"), fm: su("fm"), fl: su("fl"), fr: su("fr"), pk: k(0), mk: k(1), vk: k(2), afa: k(3), zi: k(4) };
    z.gl = z.nu + z.bv; z.vhk = z.fm + z.fl; z.db = z.gl - z.vhk - z.fr;
    z.fix = ps ? null : z.pk + z.mk + z.vk;
    z.be = ps ? null : z.db - z.fix;
    z.evst = ps ? null : z.be - z.afa - z.zi;
    return z;
  }
  const umsatz = (s, q, ps) => { const gg = gis(), ms = monate(q);
    return U.filter(r => r.s === s && gg.includes(r.g) && ms.includes(r.m) && ps.includes(r.p)).reduce((a, r) => a + r.nu, 0); };

  const ZEILEN = [
    { key: "nu", name: "Nettoumsatz", r: +1, link: true }, { key: "bv", name: "Bestandsveränderungen", r: 0 },
    { key: "gl", name: "Gesamtleistung", r: +1, summe: true },
    { key: "vhk", name: "Variable Herstellkosten", r: -1, klapp: true }, { key: "fm", name: "Fertigungsmaterial", r: -1, eltern: "vhk" },
    { key: "fl", name: "Fertigungslöhne", r: -1, eltern: "vhk" }, { key: "fr", name: "Frachtkosten", r: -1 },
    { key: "db", name: "Deckungsbeitrag", r: +1, summe: true },
    { key: "fix", name: "Fixkosten gesamt", r: -1, klapp: true }, { key: "pk", name: "Personalkosten", r: -1, eltern: "fix" },
    { key: "mk", name: "Marketingkosten", r: -1, eltern: "fix" }, { key: "vk", name: "Verwaltungskosten", r: -1, eltern: "fix" },
    { key: "be", name: "Betriebsergebnis", r: +1, summe: true }, { key: "afa", name: "Abschreibungen", r: -1 },
    { key: "zi", name: "Zinsen", r: -1 }, { key: "evst", name: "Ergebnis vor Steuern", r: +1, summe: true },
  ];
  function guvTabelle() {
    const ps = prodAuswahl(), qs = QN.map((_, q) => guv(1, q, ps)), j = guv(1, null, ps), v = guv(0, null, ps);
    return ZEILEN.filter(z => !z.eltern || S.offenGuV.has(z.eltern)).map(z => ({ ...z, q: qs.map(x => x[z.key]), j: j[z.key], vj: v[z.key],
      d: j[z.key] === null ? null : j[z.key] - v[z.key] }));
  }
  function prodZeilen() {
    const out = [];
    LI.forEach((l, li) => {
      if (S.offenProd.has("l" + li)) l.gruppen.forEach(gi => {
        if (S.offenProd.has("g" + gi)) GR[gi].produkte.forEach(pi => out.push({ typ: "p", i: pi, name: P[pi], ebene: 2, ps: [pi] }));
        out.push({ typ: "g", i: gi, name: GR[gi].name, ebene: 1, ps: GR[gi].produkte, klapp: "g" + gi });
      });
      out.push({ typ: "l", i: li, name: l.name, ebene: 0, ps: l.gruppen.flatMap(g => GR[g].produkte), klapp: "l" + li, fett: true });
    });
    out.push({ typ: "alle", name: "Alle Produkte", ebene: 0, ps: P.map((_, i) => i), summe: true });
    out.forEach(z => { z.q = QN.map((_, q) => umsatz(1, q, z.ps)); z.j = umsatz(1, null, z.ps); z.vj = umsatz(0, null, z.ps); });
    return out;
  }
  const istGewaehlt = z => S.prod && z.typ === S.prod[0] && z.i === S.prod[1];

  /* ---------- Layout ---------- */
  DK.init({ titel: "Auswertungen der integrierten Planung" });
  const bKopf = DK.box("kopf", 16, 10, 992, 46);
  DK.haarlinie(62);
  const bFilter = DK.box("filter", 16, 68, 992, 50, "dk-filter");
  const bKpi = DK.box("kpis", 16, 128, 992, 68);
  DK.haarlinie(206);
  const bGuv = DK.box("v-guv", 16, 216, 568, 426);
  el("div", { style: "position:absolute;left:604px;top:216px;height:426px;border-left:1px solid var(--linie)" }, document.getElementById("seite"));
  const bProd = DK.box("v-produkte", 624, 216, 384, 222);
  const hProd = el("div", { class: "dk-haar", id: "haar-anteil", style: "top:446px;left:624px;right:16px" }, document.getElementById("seite"));
  const bAnteil = DK.box("v-anteil", 624, 456, 384, 186);
  DK.el("style", {}, document.head, `
    .gv { table-layout: fixed; }
    .gv td, .gv th { overflow: hidden; white-space: nowrap; padding: 0 4px; }
    .gv th { vertical-align: bottom; height: 22px; }
    .gv td.gv-lab { text-align: left; padding-left: 0; }
    .gv tr.gv-summe td { font-weight: bold; border-top: 1px solid #9A9A9A; }
    .gv tr.gv-ende td { border-top: 1px solid var(--ac); }
    .gv .gv-pfeil { display: inline-block; width: 14px; color: var(--muted); }
    body:not(.print) .gv .gv-pfeil { cursor: pointer; }
    .gv .gv-link { color: var(--muted); padding-left: 4px; }
    .gv td.gv-q { cursor: pointer; }
    .gv td.dk-blass, .gv th.dk-blass { opacity: .32; }
    .gv td.gv-leer { color: var(--muted); }
    .gv th.gv-hervor { color: var(--text); font-weight: bold; }`);

  /* ---------- Tooltip mit Ereignis (Zelle unter dem Zeiger) ---------- */
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

  /* ---------- Abweichungsbalken (wie DK.matrix, Typ delta) ---------- */
  function dbalken(td, v, r, spanne, W, H, fett) {
    const svg = sv("svg", { width: W, height: H, style: "display:block" }, td), txtW = 58;
    const k = (W - txtW - 4) / Math.max(spanne.neg + spanne.pos, 1e-9), mitte = txtW + 2 + spanne.neg * k;
    const kl = v == null ? "neutral" : wirkung(v / 1000, r, 0);
    sv("text", { x: txtW - 6, y: H / 2, dy: "0.35em", "text-anchor": "end",
      style: `font-size:14px;fill:${kl === "neutral" ? "var(--text)" : FARBE[kl]};font-weight:${fett ? "bold" : "normal"}` }, svg, v == null ? "–" : delta(v / 1000, 0));
    if (v != null && !fett) {
      const bw = Math.abs(v) * k;
      sv("rect", { x: v >= 0 ? mitte : mitte - bw, y: (H - 10) / 2, width: bw, height: 10, fill: FARBE[kl] }, svg);
    }
    sv("line", { x1: mitte, x2: mitte, y1: 1, y2: H - 1, stroke: "#8C8C8C", "stroke-width": 1 }, svg);
  }

  /* ---------- GuV ---------- */
  function guvZeichnen(Z, botschaft) {
    const f = DK.visual(bGuv, { titel: "Gewinn- und Verlustrechnung " + JP, einheit: "Tsd. €", botschaft });
    const W = [170, 58, 58, 58, 58, 66, 100];
    const t = el("table", { class: "dk-matrix gv", style: "width:568px" }, f.flaeche);
    const cg = el("colgroup", {}, t); W.forEach(w => el("col", { style: `width:${w}px` }, cg));
    const hr = el("tr", {}, el("thead", {}, t));
    ["Position", ...QN, String(JP), "ΔVJ"].forEach((h, i) => el("th", { id: i === 6 ? "gv-kopf-dvj" : i === 5 ? "gv-kopf-jahr" : undefined,
      style: i === 0 ? "text-align:left;padding-left:0" : i === 6 ? "text-align:center" : "" }, hr, h));
    const tb = el("tbody", {}, t);
    const ds = Z.filter(z => !z.summe && z.d != null).map(z => z.d);
    const spanne = { neg: Math.max(0, ...ds.map(d => -d)), pos: Math.max(0, ...ds) };
    Z.forEach(z => {
      const cls = [z.summe ? "gv-summe" : "", z.key === "evst" ? "gv-ende" : "", "dk-zeile"];
      if (S.zeile && S.zeile !== z.key) cls.push("dk-blass");
      const tr = el("tr", { class: cls.join(" "), id: "gv-" + z.key }, tb);
      const lab = el("td", { class: "gv-lab", style: z.eltern ? "padding-left:28px" : "" }, tr);
      if (z.klapp) {
        const pf = el("span", { class: "gv-pfeil", title: "Klick klappt auf oder zu" }, lab, S.offenGuV.has(z.key) ? "▾" : "▸");
        if (!DK.PRINT) pf.addEventListener("click", ev => { ev.stopPropagation(); S.offenGuV.has(z.key) ? S.offenGuV.delete(z.key) : S.offenGuV.add(z.key); zeichnen(); });
      } else if (!z.eltern) el("span", { class: "gv-pfeil" }, lab, "");
      lab.appendChild(document.createTextNode(z.name));
      if (z.link) el("span", { class: "gv-link", id: "gv-link" }, lab, "›");
      z.q.forEach((v, q) => {
        const td = el("td", { class: (v == null ? "gv-leer" : "") + (z.link ? " gv-q" : "") }, tr, v == null ? "–" : tsd(v));
        if (z.link && !DK.PRINT) td.addEventListener("click", ev => { ev.stopPropagation(); const neu = !(S.zeile === "nu" && S.q === q);
          S.zeile = neu ? "nu" : null; S.q = neu ? q : null; zeichnen(); });
      });
      el("td", { class: z.j == null ? "gv-leer" : "", style: "font-weight:bold" }, tr, z.j == null ? "–" : tsd(z.j));
      dbalken(el("td", { class: "dk-dbalken" }, tr), z.d, z.r, spanne, W[6] - 8, 18, z.summe);
      tr.addEventListener("click", () => { S.zeile = S.zeile === z.key ? null : z.key; S.q = null; zeichnen(); });
      tooltip(tr, ev => {
        const td = ev.target.closest ? ev.target.closest("td") : null, ci = td ? [...tr.children].indexOf(td) : 5;
        const per = ci >= 1 && ci <= 4 ? `${QN[ci - 1]} ${JP}` : `Jahr ${JP}`, w = ci >= 1 && ci <= 4 ? z.q[ci - 1] : z.j;
        const zeilen = [`${z.name} · ${per} · ${S.seite}${S.prod ? " · " + prodName() : ""}`];
        if (w == null) { zeilen.push("Fixkosten, Abschreibungen und Zinsen sind keinem Produkt zugerechnet („–“)"); return zeilen; }
        zeilen.push(`Plan: ${zahl(w)} €`);
        if (!(ci >= 1 && ci <= 4)) zeilen.push(`Ist ${JI}: ${zahl(z.vj)} € · ΔVJ ${delta(z.d / 1000, 0)} Tsd. € (${pd(z.j, z.vj)})`);
        if (z.link) zeilen.push("Klick auf ein Quartal: Umsatz nach Produkten für dieses Quartal");
        zeilen.push("Klick hebt die Zeile hervor, Esc hebt auf");
        return zeilen;
      });
    });
  }

  /* ---------- Umsatz nach Produkten ---------- */
  function prodZeichnen(Z, botschaft) {
    const f = DK.visual(bProd, { titel: "Umsatz nach Produkten " + JP, einheit: "Tsd. €", botschaft });
    const W = [116, 52, 52, 52, 52, 60];
    const t = el("table", { class: "dk-matrix gv", style: "width:384px" }, f.flaeche);
    const cg = el("colgroup", {}, t); W.forEach(w => el("col", { style: `width:${w}px` }, cg));
    const hr = el("tr", {}, el("thead", {}, t));
    ["Produkt", ...QN, String(JP)].forEach((h, i) => el("th", { id: "pr-kopf-" + i,
      class: S.q !== null && i >= 1 ? (i - 1 === S.q ? "gv-hervor" : "dk-blass") : "",
      style: i === 0 ? "text-align:left;padding-left:0" : "" }, hr, h));
    const tb = el("tbody", {}, t);
    Z.forEach(z => {
      const cls = [z.summe ? "gv-summe gv-ende" : "", z.typ === "l" ? "gv-summe" : "", z.summe ? "dk-summe" : "dk-zeile"];
      const sel = prodAuswahl();
      const hell = !S.prod || z.summe || istGewaehlt(z) || (S.prod[0] !== "p" && z.ps.every(p => sel.includes(p)));
      if (!hell) cls.push("dk-blass");
      const tr = el("tr", { class: cls.join(" "), id: `pr-${z.typ}${z.i ?? ""}` }, tb);
      const lab = el("td", { class: "gv-lab", style: `padding-left:${z.ebene * 14}px;${z.fett ? "font-weight:bold" : ""}` }, tr);
      if (z.klapp) {
        const pf = el("span", { class: "gv-pfeil", title: "Klick klappt auf oder zu" }, lab, S.offenProd.has(z.klapp) ? "▾" : "▸");
        // Produktgruppen einzeln aufklappen (eine zur Zeit), damit Bericht und Anteile auf die Seite passen
        if (!DK.PRINT) pf.addEventListener("click", ev => { ev.stopPropagation(); const auf = !S.offenProd.has(z.klapp);
          if (z.typ === "g") [...S.offenProd].filter(k => k[0] === "g").forEach(k => S.offenProd.delete(k));
          if (auf) S.offenProd.add(z.klapp); else S.offenProd.delete(z.klapp); zeichnen(); });
      } else el("span", { class: "gv-pfeil" }, lab, "");
      lab.appendChild(document.createTextNode(z.name));
      z.q.forEach((v, q) => el("td", { class: S.q !== null && q !== S.q ? "dk-blass" : "", style: S.q === q ? "font-weight:bold" : "" }, tr, tsd(v)));
      el("td", { class: S.q !== null ? "dk-blass" : "", style: "font-weight:bold" }, tr, tsd(z.j));
      if (!z.summe) tr.addEventListener("click", () => { S.prod = istGewaehlt(z) ? null : [z.typ, z.i]; zeichnen(); });
      tooltip(tr, ev => {
        const td = ev.target.closest ? ev.target.closest("td") : null, ci = td ? [...tr.children].indexOf(td) : 5;
        const q = ci >= 1 && ci <= 4 ? ci - 1 : null, w = q === null ? z.j : z.q[q], ges = umsatz(1, q, P.map((_, i) => i));
        const zl = [`${z.name} · ${q === null ? "Jahr " + JP : QN[q] + " " + JP} · ${S.seite}`,
          `Nettoumsatz: ${zahl(w)} € · Anteil ${pz(ges ? w / ges : 0, 1)}`];
        if (q === null) zl.push(`Ist ${JI}: ${zahl(z.vj)} € · ΔVJ ${pd(z.j, z.vj)}`);
        if (!z.summe) zl.push("Klick filtert die GuV auf diese Produkte, Esc hebt auf");
        return zl;
      });
    });
  }

  /* ---------- Anteil am Nettoumsatz ---------- */
  function anteile() {
    const ges = umsatz(1, S.q, P.map((_, i) => i));
    return P.map((p, i) => ({ key: i, label: p, wert: ges ? umsatz(1, S.q, [i]) / ges : 0 }));
  }
  function anteilZeichnen(A, botschaft) {
    const f = DK.visual(bAnteil, { titel: `Anteil am Nettoumsatz ${S.q === null ? JP : QN[S.q] + " " + JP}`, einheit: "%", botschaft });
    const sel = prodAuswahl();
    const svg = DK.balken(f.flaeche, { breite: 384, hoehe: f.hoehe, zeilenhoehe: Math.max(18, Math.min(22, Math.floor(f.hoehe / A.length))),
      zeilen: A.map(a => ({ ...a, kontur: "#3A3F44" })), fmt: v => zahl(v * 100, 1),
      onClick: k => { S.prod = S.prod && S.prod[0] === "p" && S.prod[1] === k ? null : ["p", k]; zeichnen(); },
      tooltip: z => { const ps = [z.key]; return [`${z.label} · ${S.q === null ? "Jahr " + JP : QN[S.q] + " " + JP} · ${S.seite}`,
        `Anteil am Nettoumsatz: ${zahl(z.wert * 100, 1)} %`, `Nettoumsatz ${zahl(umsatz(1, S.q, ps))} € · Ist ${JI} ${zahl(umsatz(0, S.q, ps))} €`,
        "Klick filtert die GuV auf dieses Produkt, Esc hebt auf"]; } });
    svg.id = "an-balken";
    if (sel) [...svg.querySelectorAll(":scope > g")].forEach((g, i) => g.classList.toggle("dk-blass", !sel.includes(i)));
  }

  /* ---------- Botschaften ---------- */
  function botschaften(Z, PZ, A) {
    const by = k => Z.find(z => z.key === k) || guvTabelle().find(z => z.key === k);
    const nu = by("nu"), be = by("be"), fix = by("fix"), db = by("db");
    let b1;
    if (S.prod) {
      b1 = passt([`${prodName()}: Deckungsbeitrag ${tsd(db.j)} Tsd. € (${pz(db.j / nu.j, 1)} des Nettoumsatzes), Fixkosten nicht zugerechnet`,
        `${prodName()}: Deckungsbeitrag ${tsd(db.j)} Tsd. €, ${pz(db.j / nu.j, 1)} des Nettoumsatzes`], 564);
    } else {
      const dn = (nu.j / nu.vj - 1) * 100, dbe = (be.j / be.vj - 1) * 100, df = (fix.j / fix.vj - 1) * 100;
      b1 = dbe < dn - 5
        ? passt([`Nettoumsatz ${delta(dn, 1, NBSP + "%")} ggü. Ist ${JI}, Betriebsergebnis nur ${delta(dbe, 1, NBSP + "%")}: Fixkosten ${delta(df, 1, NBSP + "%")}`,
                 `Nettoumsatz ${delta(dn, 1, NBSP + "%")}, Betriebsergebnis nur ${delta(dbe, 1, NBSP + "%")} ggü. Ist`], 564)
        : passt([`Nettoumsatz ${delta(dn, 1, NBSP + "%")} und Betriebsergebnis ${delta(dbe, 1, NBSP + "%")} ggü. Ist ${JI}`], 564);
    }
    const alle = PZ.find(z => z.typ === "alle");
    const wert = z => (S.q === null ? z.j : z.q[S.q]), ges = wert(alle);
    const grp = GR.map(g => ({ name: g.name, w: umsatz(1, S.q, g.produkte) })).sort((a, b) => b.w - a.w);
    const zub = LI.map(l => ({ name: l.name, w: umsatz(1, S.q, l.gruppen.flatMap(g => GR[g].produkte)) })).sort((a, b) => a.w - b.w)[0];
    const vor = S.q === null ? "" : QN[S.q] + ": ";
    const b2 = ges ? passt([`${vor}${grp[0].name} tragen ${pz(grp[0].w / ges)} des Nettoumsatzes, ${zub.name} nur ${pz(zub.w / ges)}`,
      `${vor}${grp[0].name} ${pz(grp[0].w / ges)}, ${zub.name} ${pz(zub.w / ges)} des Nettoumsatzes`], 380) : "keine Werte";
    const top = A.slice().sort((a, b) => b.wert - a.wert)[0];
    const b3 = passt([`${vor}${top.label} ist das umsatzstärkste Produkt mit ${zahl(top.wert * 100, 1)} %`,
      `${vor}${top.label} mit ${zahl(top.wert * 100, 1)} % vorn`], 380);
    return [b1, b2, b3];
  }

  /* ---------- Datenschnitte ---------- */
  DK.schnitt(bFilter, "Seite (Gesellschaft)", "dropdown", { optionen: SEITEN.map(s => [s[0], s[0]]), wert: S.seite, breite: 190,
    onChange: v => { S.seite = v; S.zeile = null; S.q = null; S.prod = null; zeichnen(); } });
  DK.schnitt(bFilter, "Ausgabe", "knoepfe", { optionen: [["html", "HTML"], ["pdf", "PDF"]], wert: "html",
    onChange: v => { if (v === "pdf" && !DK.PRINT) { window.open(location.href.split("?")[0] + "?print", "_blank"); } } });
  el("div", { style: "position:absolute;right:0;top:20px;color:var(--muted)", id: "pov" }, bFilter,
    `Szenario Plan ${JP} · Version Bottom-up · Ist ${JI} · Währung € zu Planwechselkursen`);

  /* ---------- Zeichnen ---------- */
  function zeichnen() {
    const Z = guvTabelle(), PZ = prodZeilen(), A = anteile();
    const [b1, b2, b3] = botschaften(Z, PZ, A);
    DK.kopf(bKopf, { titel: "Auswertungen der integrierten Planung",
      untertitel: `GuV und Umsatz nach Produkten · ${S.seite}${S.prod ? " · " + prodName() : ""} · Plan ${JP} mit Vergleich zum Ist ${JI} (ΔVJ)`,
      quelle: `Quelle: Integrierte Planung · Stand ${D.stand}`,
      legende: [["#FFFFFF", "Plan " + JP, "#3A3F44"], [FARBE.gut, "günstig"], [FARBE.schlecht, "ungünstig"]] });
    const ps = prodAuswahl(), j = guv(1, null, ps), v = guv(0, null, ps);
    const kpi = (label, key, r) => ({ label, wert: j[key] === null ? "–" : mio(j[key]), einheit: j[key] === null ? "" : "Mio. €",
      delta: j[key] === null ? "–" : pd(j[key], v[key]), klasse: j[key] === null ? "neutral" : wirkung((j[key] / v[key] - 1) * 100, r, 1) });
    DK.kpis(bKpi, [kpi("Nettoumsatz", "nu", +1), kpi("Deckungsbeitrag", "db", +1), kpi("Betriebsergebnis", "be", +1), kpi("Ergebnis vor Steuern", "evst", +1)]);
    guvZeichnen(Z, b1);
    prodZeichnen(PZ, b2);
    // Höhe des Produktberichts folgt den aufgeklappten Zeilen, die Anteile füllen den Rest der Spalte
    const hp = Math.ceil(bProd.querySelector("table").offsetHeight) + 50;
    bProd.style.height = hp + "px"; hProd.style.top = (216 + hp + 8) + "px";
    bAnteil.style.top = (216 + hp + 18) + "px"; bAnteil.style.height = (642 - 216 - hp - 18) + "px";
    anteilZeichnen(A, b3);
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  /* ---------- Lernplattform ---------- */
  const NAMEN = { nu: "Nettoumsatz", bv: "Bestandsveränderungen", fm: "Fertigungsmaterial", fl: "Fertigungslöhne", fr: "Frachtkosten" };
  const KONTEN = ["Personalkosten", "Marketingkosten", "Verwaltungskosten", "Abschreibungen", "Zinsen"];
  const region = gi => (D.regionen.find(([, gs]) => gs.includes(G[gi])) || ["–"])[0];
  const gruppeVon = pi => GR.find(g => g.produkte.includes(pi));
  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "v-guv", anker: "links", versatz: [552, 2], regel: "SAY – Botschaft vermitteln", titel: "Aussage über der GuV",
        text: "Über der GuV steht, was der Plan zeigt: Der Nettoumsatz wächst deutlich, das Betriebsergebnis kaum, weil die Fixkosten stärker steigen. Der Satz rechnet bei jeder Seite und jedem Produktfilter neu. Das Original hatte nur den Berichtsnamen." },
      { nr: 2, ziel: "gv-db", anker: "links", versatz: [182, 0], regel: "STRUCTURE – Rechenweg sichtbar", titel: "Zwischensummen der GuV",
        text: "Die GuV folgt dem Gesamtkostenverfahren mit den Zwischensummen Gesamtleistung, Deckungsbeitrag (ergänzt), Betriebsergebnis und Ergebnis vor Steuern. „Gesamterlöse“ heißt Gesamtleistung, „Bilanzergebnis“ Ergebnis vor Steuern." },
      { nr: 3, ziel: "gv-fix", anker: "links", versatz: [182, 0], regel: "CONDENSE – Expansions", titel: "Kontengruppen auf- und zuklappen",
        text: "Wie im Original lässt sich „Fixkosten gesamt“ aufklappen (▾/▸); neu auch „Variable Herstellkosten“ mit Fertigungsmaterial und Fertigungslöhnen wie im Umsatzmodell (Abb. 5.79)." },
      { nr: 4, ziel: "gv-link", versatz: [30, 0], regel: "STRUCTURE – Investigation", titel: "Vom Nettoumsatz zum Produktbericht",
        text: "Das Zeichen › am Nettoumsatz steht für die Verknüpfung zum Umsatzdetailbericht. Ein Klick auf den Nettoumsatz eines Quartals hebt dieses Quartal im Bericht nach Produkten hervor und zeigt die Anteile des Quartals." },
      { nr: 5, ziel: "gv-kopf-dvj", versatz: [-4, -6], regel: "UNIFY – Abweichung nach Wirkung", titel: "Vergleich zum Ist",
        text: "Neu ist die Abweichung zum Ist 2027 als Balken: steigende Kosten rot, steigende Erlöse und Ergebnisse blaugrün. Die Kopfzahlen oben zeigen dieselbe Abweichung in Prozent. Das Original zeigte nur Planwerte." },
      { nr: 6, ziel: "v-anteil", anker: "links", versatz: [380, 22], regel: "EXPRESS – Balken statt Torte", titel: "Anteile als Balken",
        text: "Die „Produktanalyse“ war eine gesprengte 3D-Torte in Grün, Gelb und Orange mit Prozentwerten, die nicht zu den Umsätzen passten (65,71 % statt 56 %). Jetzt zeigen Balken die Anteile aller sechs Produkte, als Planwert weiß mit Kontur." },
      { nr: 7, ziel: "pr-kopf-5", anker: "links", versatz: [28, 0], regel: "CHECK – Ein Datensatz", titel: "GuV und Produktbericht stimmen überein",
        text: "Beide Berichte rechnen aus demselben Plan wie die Maske „Zielvorgaben“ (Abb. 5.78) und die Investitionsplanung (Abb. 5.81): Alle Produkte = Nettoumsatz der GuV. Im Original passten Bilanzergebnis und Tortenanteile nicht zu den übrigen Zahlen." },
      { nr: 8, ziel: "pov", anker: "links", versatz: [0, -2], regel: "SIMPLIFY – Softwareneutral", titel: "Ohne Logo und Programmrahmen",
        text: "Browserfenster, Repository-Pfad, zwei Herstellerlogos und die Links des Benutzer-POV entfallen; Szenario, Version und Währung stehen einmal in der Filterzeile. Die Ausgabe als HTML oder PDF bleibt als Schalter: „PDF“ öffnet die Druckansicht." },
    ],
    nachbauIntro: "Seitengröße benutzerdefiniert 1024 × 646 px, Schrift Arial: Tabellen und Achsen 10,5 pt, Visualtitel 12 pt, Berichtstitel 16,5 pt, Kartenwerte 19,5 pt. " +
      "Datenmodell: Faktentabellen Umsatzplanung (Szenario, Gesellschaft, Produkt, Monat, Absatz, Nettoumsatz, Bestandsveränderung, Fertigungsmaterial, Fertigungslöhne, Frachtkosten) und Kostenplanung (Szenario, Gesellschaft, Konto, Monat, Betrag) wie in der CSV-Datei; Dimensionen Gesellschaft (Hierarchie Konzern › Region › Gesellschaft), Produkt (Linie › Gruppe › Produkt), Datum, GuV-Position (mit Sortierspalte).",
    nachbau: [
      { id: "A", ziel: "kpis", anker: "links", versatz: [122, 0], titel: "Kopfzahlen", visual: "Karte (neu)",
        felder: "Nettoumsatz, Deckungsbeitrag, Betriebsergebnis, Ergebnis vor Steuern (Plan 2028, Mio. €)",
        format: "Referenzbeschriftung ΔVJ = DIVIDE([Plan] − [Ist VJ]; [Ist VJ]); bedingte Farbe #00806B/#C62828 nach Wirkung",
        hinweis: "Measures mit CALCULATE([Betrag]; Szenario[Szenario] = \"Plan\") bzw. \"Ist\"." },
      { id: "B", ziel: "gv-nu", anker: "links", versatz: [168, 0], titel: "GuV nach Quartalen", visual: "Matrix",
        felder: "Zeilen: GuV-Position (Hierarchie Gruppe › Konto); Spalten: Quartal; Werte: Betrag (Tsd. €); zusätzlich Plan-Jahr und ΔVJ",
        format: "Layout „Gestuft“ mit +/–-Symbolen (Fixkosten gesamt aufgeklappt); Zwischensummen über berechnete Positionen fett; ΔVJ als Datenbalken mit Achse in der Mitte, Rot/Blaugrün nach Wirkung",
        hinweis: "Zwischensummen als Measures je Position (SWITCH über GuV-Position[Schlüssel]); Kosten mit Wirkungsrichtung −1." },
      { id: "C", ziel: "pr-kopf-1", anker: "links", versatz: [28, 0], titel: "Umsatz nach Produkten", visual: "Matrix",
        felder: "Zeilen: Produktlinie › Produktgruppe › Produkt; Spalten: Quartal; Werte: Nettoumsatz (Tsd. €)",
        format: "Zeilenteilsummen unten, Bezeichnung wie die Ebene; Gesamtsumme „Alle Produkte“ fett",
        hinweis: "Investigation: Drillthrough von der GuV-Zeile Nettoumsatz auf eine Seite mit dieser Matrix (Drillthrough-Feld Quartal) bzw. Interaktion „Hervorheben“." },
      { id: "D", ziel: "an-balken", versatz: [-4, 4], titel: "Anteil am Nettoumsatz", visual: "Gruppiertes Balkendiagramm",
        felder: "Y-Achse: Produkt; X-Achse: Anteil = DIVIDE([Nettoumsatz]; CALCULATE([Nettoumsatz]; ALL(Produkt)))",
        format: "Balken Füllung #FFFFFF, Rahmen #3A3F44 (Planwert); Datenbeschriftung ein, X-Achse aus, keine Gitternetzlinien" },
      { id: "E", ziel: "filter", anker: "links", versatz: [162, 2], titel: "Seite und Ausgabe", visual: "Datenschnitt (Dropdown, Hierarchie)",
        felder: "Gesellschaft (Konzern › Region › Gesellschaft), Einfachauswahl",
        hinweis: "PDF-Ausgabe über „Exportieren › PDF“; das HTML ist die Lernplattform-Fassung des Berichts." },
    ],
    theme: DK.thema(),
    csv: { name: "auswertungen_planung.csv", text: () => {
      const z = ["Szenario;Version;Jahr;Monat;Region;Gesellschaft;Produktlinie;Produktgruppe;Produkt;Position;Wert;Einheit"];
      const kopf = r => [r.s ? "Plan" : "Ist", r.s ? "Bottom-up" : "Ist", D.jahre[r.s], r.m + 1, region(r.g), G[r.g]];
      U.forEach(r => { const g = gruppeVon(r.p);
        z.push([...kopf(r), LI[g.linie].name, g.name, P[r.p], "Absatz", r.a, "Stück"].join(";"));
        Object.entries(NAMEN).forEach(([k, n]) => z.push([...kopf(r), LI[g.linie].name, g.name, P[r.p], n, r[k], "EUR"].join(";"))); });
      K.forEach(r => z.push([...kopf(r), "", "", "", KONTEN[r.k], r.b, "EUR"].join(";")));
      return z.join("\r\n"); } },
    tabellen: () => {
      const Z = guvTabelle(), PZ = prodZeilen(), A = anteile();
      return [
        { titel: `GuV ${JP} in € – ${S.seite}${S.prod ? " · " + prodName() : ""}`, kopf: ["Position", ...QN, `Plan ${JP}`, `Ist ${JI}`, "ΔVJ"],
          zeilen: Z.map(z => [z.name, ...z.q.map(v => (v == null ? "–" : zahl(v))), z.j == null ? "–" : zahl(z.j), z.vj == null ? "–" : zahl(z.vj), z.d == null ? "–" : delta(z.d, 0)]) },
        { titel: `Umsatz nach Produkten ${JP} in € – ${S.seite}`, kopf: ["Produkt", ...QN, `Plan ${JP}`, `Ist ${JI}`],
          zeilen: PZ.map(z => [z.name, ...z.q.map(v => zahl(v)), zahl(z.j), zahl(z.vj)]) },
        { titel: `Anteil am Nettoumsatz ${S.q === null ? JP : QN[S.q] + " " + JP}`, kopf: ["Produkt", "Anteil"],
          zeilen: A.map(a => [a.label, zahl(a.wert * 100, 1) + " %"]) },
      ];
    },
  });
  zeichnen();
})();
