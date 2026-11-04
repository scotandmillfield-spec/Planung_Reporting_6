/* Abb. 5.44 – Dashboard „Vertriebscockpit: Umsatz und Preis je Stück“ (softwareneutraler Nachbau eines Cockpits aus
   einer Cloud-BI-Anwendung). Seite 1024 x 646 px. Daten: vertrieb.json (daten_vertrieb.py) – Umsatz, Rabatt und Absatz
   je Land, Verkaufsorganisation, Jahr, Produktkategorie und Kunde; USA Ost 2026 und alle Summen der Visuals = Original.
   Inhalte wie im Original: Preis je Stück und Umsatz je Verkaufsorganisation mit Abweichung zum Vorjahr absolut und in %,
   Tabelle Produktkategorie/Kunde mit Umsatz, Rabatt und Absatz für eine Verkaufsorganisation, Datenschnitt Land.
   Neu: KPI-Leiste, Datenschnitt Produktkategorie, Abweichung zum Vorjahr in der Tabelle. Klick auf eine Verkaufsorganisation
   hebt sie hervor und filtert KPI-Leiste und Tabelle, Klick auf eine Tabellenzeile hebt sie hervor, ▾/▸ klappt Kategorien
   auf und zu, Klick auf einen Spaltenkopf sortiert, Esc hebt auf. */
(() => {
  "use strict";
  const { zahl, delta, wirkung, FARBE, NBSP, sv, el, tw } = DK;
  const D = DATA, KAT = D.kategorien, J = D.jahre;
  const R = D.saetze.map(([l, v, j, c, k, u, r, a]) => ({ l, v, j, c, k, u, r, a }));
  const pz = (v, nk = 1) => zahl(v * 100, nk) + NBSP + "%";
  const pd = (a, b, nk = 1) => (b ? delta((a / b - 1) * 100, nk, NBSP + "%") : "–");
  const mio = c => zahl(c / 1e8, 2);
  const tsd = c => zahl(c / 1e5, 1);
  const passt = (k, b) => k.find(t => tw(t) <= b) || k[k.length - 1];

  /* ---------- Zustand ---------- */
  const S = { land: 1, kat: null, vo: null, tabVo: 1, sel: null, offen: new Set([0]), sort: null };
  addEventListener("keydown", e => {
    if (e.key === "Escape" && (S.vo !== null || S.sel !== null)) { S.vo = null; S.sel = null; zeichnen(); }
  });
  const tabVo = () => (S.vo !== null ? S.vo : S.tabVo);

  /* ---------- Layout (Seite 1024 x 646) ---------- */
  DK.init({ titel: "Vertriebscockpit: Umsatz und Preis je Stück" });
  const bKopf = DK.box("kopf", 16, 10, 992, 46);
  DK.haarlinie(62);
  const bFilter = DK.box("filter", 16, 68, 992, 50, "dk-filter");
  const bKpi = DK.box("kpis", 16, 128, 992, 68);
  DK.haarlinie(206);
  const bPreis = DK.box("v-preis", 16, 216, 468, 204);
  DK.haarlinie(428, 16, 540);
  const bUmsatz = DK.box("v-umsatz", 16, 438, 468, 204);
  el("div", { style: "position:absolute;left:502px;top:216px;height:426px;border-left:1px solid var(--linie)" }, document.getElementById("seite"));
  const bTab = DK.box("v-tabelle", 520, 216, 488, 426);
  DK.el("style", {}, document.head, `
    #v-tabelle .dk-matrix td.vt-kat { font-weight: bold; }
    #v-tabelle .dk-matrix td.vt-kunde { padding-left: 18px; }
    #v-tabelle .vt-pfeil { display: inline-block; width: 14px; color: var(--muted); cursor: pointer; font-weight: normal; }
    #v-tabelle .dk-matrix td, #v-tabelle .dk-matrix th { padding-left: 4px; padding-right: 4px; }
    #v-tabelle .dk-matrix td:first-child, #v-tabelle .dk-matrix th:first-child { padding-left: 0; }`);

  /* ---------- Tooltip ---------- */
  const tip = document.querySelector(".dk-tooltip");
  function tooltip(ziel, fn) {
    ziel.addEventListener("pointermove", ev => {
      tip.textContent = "";
      fn().filter(Boolean).forEach((z, i) => el(i === 0 ? "b" : "div", {}, tip, z));
      tip.style.display = "block";
      const r = tip.getBoundingClientRect();
      let x = ev.clientX + 14, y = ev.clientY + 14;
      if (x + r.width > innerWidth - 8) x = ev.clientX - r.width - 14;
      if (y + r.height > innerHeight - 8) y = ev.clientY - r.height - 14;
      tip.style.left = x + "px"; tip.style.top = y + "px";
    });
    ziel.addEventListener("pointerleave", () => { tip.style.display = "none"; });
  }

  /* ---------- Berechnung ---------- */
  const basis = (o = {}) => R.filter(r => r.l === S.land && (S.kat === null || r.c === S.kat) &&
    (o.vo === undefined || o.vo === null || r.v === o.vo) && (o.c === undefined || r.c === o.c) && (o.k === undefined || r.k === o.k));
  const summe = (rs, j) => {
    const t = rs.filter(r => r.j === j);
    const u = t.reduce((s, r) => s + r.u, 0), a = t.reduce((s, r) => s + r.a, 0), rb = t.reduce((s, r) => s + r.r, 0);
    return { u, a, r: rb, p: a ? u / 100 / a : null, q: u ? rb / u : null };
  };
  const kennzahlen = rs => ({ ist: summe(rs, 1), vj: summe(rs, 0) });
  const VO = () => D.vos[S.land];
  const LAND = () => D.laender[S.land];
  const kunde = (v, k) => D.kunden[`${S.land}-${v}`][k];

  /* ---------- Datenschnitte ---------- */
  const landKn = DK.schnitt(bFilter, "Land", "knoepfe", { optionen: D.laender.map((n, i) => [i, n]), wert: S.land,
    onChange: v => { S.land = Number(v); S.vo = null; S.sel = null; zeichnen(); } });
  DK.schnitt(bFilter, "Produktkategorie", "dropdown", { breite: 170, optionen: [["alle", "Alle"], ...KAT.map((n, i) => [String(i), n])],
    wert: "alle", onChange: v => { S.kat = v === "alle" ? null : Number(v); S.sel = null; zeichnen(); } });
  void landKn;

  /* ---------- Vergleich je Verkaufsorganisation: Ist und Vorjahr als Balken, ΔVJ absolut und in % ---------- */
  function vergleich(f, id, feld, o) {
    const W = f.breite, H = f.hoehe;
    const svg = sv("svg", { width: W, height: H, role: "img", id }, f.flaeche);
    const zeilen = [...VO().map((name, v) => ({ v, name, ...kennzahlen(basis({ vo: v })) })),
                    { v: null, name: LAND(), gesamt: true, ...kennzahlen(basis()) }];
    zeilen.forEach(z => { z.wi = z.ist[feld]; z.wv = z.vj[feld]; z.d = z.wi - z.wv; z.dp = z.wv ? (z.wi / z.wv - 1) * 100 : 0; });
    const kopfH = 18, rh = Math.min(42, (H - kopfH - 4) / zeilen.length), lw = Math.ceil(Math.max(...zeilen.map(z => tw(z.name, 14, true)))) + 10;
    const sp = { wert: 46, dAbs: 104, dPz: 104 };
    const bx = lw, bw = W - lw - sp.wert - sp.dAbs - sp.dPz - 16;
    const xDA = W - sp.dAbs - sp.dPz, xDP = W - sp.dPz;
    const max = Math.max(...zeilen.map(z => Math.max(z.wi, z.wv)), 1e-9);
    const k = bw / max;
    const kopf = sv("g", { id: id + "-kopf" }, svg);
    sv("text", { x: bx, y: 12, class: "muted" }, kopf, `${J[0]} und ${J[1]}`);
    sv("text", { x: xDA + sp.dAbs / 2, y: 12, "text-anchor": "middle", class: "muted" }, kopf, "ΔVJ");
    sv("text", { x: xDP + sp.dPz / 2, y: 12, "text-anchor": "middle", class: "muted", id: id + "-dpz" }, kopf, "ΔVJ %");
    const spanne = key => { const w = zeilen.filter(z => !z.gesamt).map(z => z[key]); return { neg: Math.max(0, ...w.map(v => -v)), pos: Math.max(0, ...w) }; };
    const dBalken = (g, x0, breite, z, key, txt, y) => {
      const s = spanne(key), txtW = 50, kk = (breite - txtW - 10) / Math.max(s.neg + s.pos, 1e-9), m = x0 + txtW + 4 + s.neg * kk;
      const kl = wirkung(z[key], o.richtung, key === "dp" ? 1 : o.nkD);
      sv("text", { x: x0 + txtW, y, dy: "0.35em", "text-anchor": "end", style: `fill:${kl === "neutral" ? "var(--text)" : FARBE[kl]};${z.gesamt ? "font-weight:bold" : ""}` }, g, txt);
      if (!z.gesamt) { const b = Math.abs(z[key]) * kk; sv("rect", { x: z[key] >= 0 ? m : m - b, y: y - 5, width: b, height: 10, fill: FARBE[kl] }, g); }
      sv("line", { x1: m, x2: m, y1: y - 9, y2: y + 9, stroke: "#8C8C8C", "stroke-width": 1 }, g);
    };
    zeilen.forEach((z, i) => {
      const y0 = kopfH + i * rh, ym = y0 + rh / 2 + 2, blass = S.vo !== null && !z.gesamt && z.v !== S.vo;
      const g = sv("g", { class: (z.gesamt ? "" : "dk-klick") + (blass ? " dk-blass" : ""), "data-name": z.name }, svg);
      if (z.gesamt) sv("line", { x1: 0, x2: W, y1: y0 + 1.5, y2: y0 + 1.5, stroke: "#3A3F44", "stroke-width": 1 }, g);
      sv("text", { x: 0, y: ym, dy: "0.35em", style: z.gesamt ? "font-weight:bold" : "" }, g, z.name);
      // Vorjahr hellgrau, leicht nach oben versetzt hinter dem Ist (IBCS: überlappende Balken)
      const bh = Math.min(14, rh * 0.36);
      sv("rect", { x: bx, y: ym - bh / 2 - 5, width: Math.max(1, z.wv * k), height: bh, fill: FARBE.vj }, g);
      sv("rect", { x: bx, y: ym - bh / 2 + 2, width: Math.max(1, z.wi * k), height: bh, fill: FARBE.ist }, g);
      sv("text", { x: bx + Math.max(z.wi, z.wv) * k + 5, y: ym + 2, dy: "0.35em", style: z.gesamt ? "font-weight:bold" : "" }, g, o.fmt(z.wi));
      dBalken(g, xDA, sp.dAbs, z, "d", delta(o.dWert(z.d), o.nkD), ym);
      dBalken(g, xDP, sp.dPz, z, "dp", delta(z.dp, 1), ym);
      const hit = sv("rect", { x: 0, y: y0, width: W, height: rh, fill: "transparent" }, g);
      if (!z.gesamt) hit.addEventListener("click", () => { S.vo = S.vo === z.v ? null : z.v; S.sel = null; zeichnen(); });
      tooltip(hit, () => [`${z.gesamt ? LAND() + " gesamt" : "Verkaufsorganisation " + z.name}${S.kat === null ? "" : " · " + KAT[S.kat]}`,
        `${o.name} ${J[1]}: ${o.genau(z.wi)} · ${J[0]}: ${o.genau(z.wv)}`,
        `ΔVJ ${delta(o.dWert(z.d), o.nkD)} ${o.einheit} (${delta(z.dp, 2, NBSP + "%")})`,
        `Umsatz ${mio(z.ist.u)} Mio. € · Absatz ${zahl(z.ist.a)} Stück · Rabattquote ${z.ist.q === null ? "–" : pz(z.ist.q)}`,
        z.gesamt ? "" : "Klick filtert KPI-Leiste und Tabelle auf diese Verkaufsorganisation"]);
    });
    return zeilen;
  }

  /* ---------- Tabelle Produktkategorie/Kunde ---------- */
  function tabelle(f) {
    const v = tabVo(), rs = basis({ vo: v });
    const kats = KAT.map((name, c) => ({ c, name })).filter(x => S.kat === null || x.c === S.kat);
    const zeile = (key, label, teil, art, extra = {}) => {
      const ist = summe(teil, 1), vj = summe(teil, 0);
      return { key, label, art, ist, vj, ...extra, werte: { u: ist.u, r: ist.r, a: ist.a, d: vj.u ? (ist.u / vj.u - 1) * 100 : null } };
    };
    const sortWert = z => (S.sort ? z.werte[S.sort.key] ?? -Infinity : 0);
    const sortiere = arr => (S.sort ? arr.slice().sort((a, b) => (S.sort.ab ? sortWert(b) - sortWert(a) : sortWert(a) - sortWert(b))) : arr);
    let kz = kats.map(x => zeile("c" + x.c, x.name, rs.filter(r => r.c === x.c), "kat", { c: x.c })).filter(z => z.ist.u || z.vj.u);
    kz = sortiere(kz);
    const zeilen = [];
    kz.forEach(z => {
      zeilen.push(z);
      if (!S.offen.has(z.c)) return;
      // Kunden im Original nach Umsatz absteigend („2 sorts applied“)
      let ks = D.kunden[`${S.land}-${v}`].map((_, k) => zeile(`c${z.c}k${k}`, kunde(v, k)[0], rs.filter(r => r.c === z.c && r.k === k), "kunde", { c: z.c, k }))
        .filter(x => x.ist.u || x.vj.u);
      ks = S.sort ? sortiere(ks) : ks.sort((a, b) => b.ist.u - a.ist.u);
      zeilen.push(...ks);
    });
    const ges = zeile("ges", "Summe", rs, "summe", { summe: true });
    zeilen.push(ges);
    const tab = DK.matrix(f.flaeche, {
      spalten: [
        { key: "label", titel: "Kategorie bzw. Kunde", breite: 176, typ: "text", id: "vt-kopf-label" },
        { key: "u", titel: "Umsatz", breite: 66, fmt: tsd, id: "vt-kopf-u" },
        { key: "r", titel: "Rabatt", breite: 56, fmt: tsd, id: "vt-kopf-r" },
        { key: "a", titel: "Stück", breite: 56, fmt: v => zahl(v), id: "vt-kopf-a" },
        { key: "d", titel: "ΔVJ Umsatz %", breite: 134, typ: "delta", richtung: 1, nk: 1, textBreite: 50, id: "vt-kopf-d" },
      ],
      zeilen: zeilen.map(z => ({ ...z, werte: { ...z.werte, label: z.label } })),
      zeilenhoehe: 20, auswahl: null,
      onClick: key => { S.sel = S.sel === key ? null : key; zeichnen(); },
      onSort: key => { if (key === "label") { S.sort = null; } else S.sort = S.sort && S.sort.key === key ? { key, ab: !S.sort.ab } : { key, ab: true }; zeichnen(); },
      sortierung: S.sort,
      tooltip: z => {
        const name = z.art === "kunde" ? `${z.label} (${kunde(v, z.k)[1]})` : z.label;
        return [`${name} · ${VO()[v]} ${J[1]}`, z.art === "kunde" ? `Produktkategorie ${KAT[z.c]}` : "",
          `Umsatz ${zahl(z.ist.u / 100, 2)} € · Vorjahr ${zahl(z.vj.u / 100, 2)} € (${pd(z.ist.u, z.vj.u, 1)})`,
          `Rabatt ${zahl(z.ist.r / 100, 2)} € (${z.ist.q === null ? "–" : pz(z.ist.q)} des Umsatzes)`,
          `Absatz ${zahl(z.ist.a)} Stück · Ø Preis ${z.ist.p === null ? "–" : zahl(z.ist.p) + NBSP + "€"} je Stück`,
          z.art === "kat" ? "▾/▸ klappt die Kunden auf und zu · Klick hebt hervor" : "Klick hebt hervor, Esc hebt auf"];
      },
    });
    // Nachbearbeitung: Pfeile und Einrückung, Hervorhebung einer Kategorie samt ihrer Kunden
    const trs = [...tab.querySelectorAll("tbody tr")];
    trs.forEach((tr, i) => {
      const z = zeilen[i], td = tr.firstChild;
      if (z.art === "kat") {
        td.classList.add("vt-kat");
        td.textContent = "";
        const pf = el("span", { class: "vt-pfeil", title: "Klick klappt die Kunden auf oder zu" }, td, S.offen.has(z.c) ? "▾" : "▸");
        td.appendChild(document.createTextNode(z.label));
        if (!DK.PRINT) pf.addEventListener("click", ev => { ev.stopPropagation(); if (S.offen.has(z.c)) S.offen.delete(z.c); else S.offen.add(z.c); zeichnen(); });
      } else if (z.art === "kunde") td.classList.add("vt-kunde");
      if (S.sel !== null && !z.summe) {
        const aktiv = z.key === S.sel || (S.sel.startsWith("c") && !S.sel.includes("k") && z.c === Number(S.sel.slice(1)) && z.art === "kunde");
        tr.classList.toggle("dk-blass", !aktiv);
      }
    });
    return { zeilen, ges, v };
  }

  /* ---------- Botschaften ---------- */
  function botschaftPreis(z) {
    const g = z[z.length - 1], t = z.slice(0, -1).map(x => `${x.name} ${delta(x.dp, 1, NBSP + "%")}`).join(", ");
    return passt([`Preis je Stück ${delta(g.dp, 1, NBSP + "%")} zum Vorjahr: ${t}`, `${LAND()} ${delta(g.dp, 1, NBSP + "%")}: ${t}`, t], 468);
  }
  function botschaftUmsatz(z) {
    const g = z[z.length - 1], vs = z.slice(0, -1).sort((a, b) => b.d - a.d), top = vs[0];
    const anteil = g.d ? Math.round(top.d / g.d * 100) : 0;
    return passt([
      top.d > 0 && g.d > 0 ? `Umsatz ${delta(g.dp, 1, NBSP + "%")}, davon ${anteil}${NBSP}% aus ${top.name} (${delta(top.d / 1e8, 2)} Mio. €)`
        : `Umsatz ${delta(g.dp, 1, NBSP + "%")}, ${vs[vs.length - 1].name} ${delta(vs[vs.length - 1].d / 1e8, 2)} Mio. €`,
      `Umsatz ${LAND()} ${delta(g.dp, 1, NBSP + "%")} zum Vorjahr`], 468);
  }
  function botschaftTabelle(t) {
    const vo = VO()[t.v], kats = t.zeilen.filter(z => z.art === "kat");
    if (S.sel !== null) {
      const z = t.zeilen.find(x => x.key === S.sel);
      if (z) return passt([`${z.label}: ${pz(z.ist.u / t.ges.ist.u)} des Umsatzes in ${vo}, ΔVJ ${pd(z.ist.u, z.vj.u)}`, `${z.label}: ΔVJ ${pd(z.ist.u, z.vj.u)}`], 488);
    }
    if (!kats.length || !t.ges.ist.u) return `${vo}: keine Umsätze`;
    const top = kats.slice().sort((a, b) => b.ist.u - a.ist.u)[0];
    const wachs = kats.filter(z => z.vj.u > 0).sort((a, b) => b.werte.d - a.werte.d)[0];
    if (kats.length === 1) {
      const ks = t.zeilen.filter(z => z.art === "kunde").sort((a, b) => b.ist.u - a.ist.u);
      return passt([`${vo}, ${top.label}: ${ks.length ? ks[0].label + " größter Kunde (" + pz(ks[0].ist.u / t.ges.ist.u, 0) + ")" : "ΔVJ " + pd(top.ist.u, top.vj.u)}`, `${vo}: ΔVJ ${pd(top.ist.u, top.vj.u)}`], 488);
    }
    return passt([`${vo}: ${top.label} ${pz(top.ist.u / t.ges.ist.u, 0)} des Umsatzes, ${wachs.label} wachsen am stärksten (${pd(wachs.ist.u, wachs.vj.u)})`,
      `${vo}: ${top.label} ${pz(top.ist.u / t.ges.ist.u, 0)}, ${wachs.label} ${pd(wachs.ist.u, wachs.vj.u)}`], 488);
  }

  /* ---------- Zeichnen ---------- */
  function zeichnen() {
    const vSel = S.vo !== null ? S.vo : undefined;
    DK.kopf(bKopf, { titel: "Vertriebscockpit: Umsatz und Preis je Stück",
      untertitel: `Land ${LAND()}${S.vo === null ? "" : " · " + VO()[S.vo]}${S.kat === null ? "" : " · " + KAT[S.kat]} · Ist ${J[1]} gegen Vorjahr (VJ) ${J[0]} · Berichtswährung €`,
      quelle: "", legende: [[FARBE.ist, String(J[1])], [FARBE.vj, String(J[0])], [FARBE.gut, "günstig"], [FARBE.schlecht, "ungünstig"]] });
    const K = kennzahlen(basis({ vo: vSel }));
    const kl = (d, r, nk) => wirkung(d, r, nk);
    const dU = (K.ist.u / K.vj.u - 1) * 100, dA = (K.ist.a / K.vj.a - 1) * 100, dP = (K.ist.p / K.vj.p - 1) * 100, dQ = (K.ist.q - K.vj.q) * 100;
    DK.kpis(bKpi, [
      { label: `Umsatz ${J[1]}`, wert: mio(K.ist.u), einheit: "Mio. €", delta: delta(dU, 1, NBSP + "%"), klasse: kl(dU, 1, 1) },
      { label: "Absatz", wert: zahl(K.ist.a), einheit: "Stück", delta: delta(dA, 1, NBSP + "%"), klasse: kl(dA, 1, 1) },
      { label: "Ø Preis je Stück", wert: zahl(K.ist.p), einheit: "€", delta: delta(dP, 1, NBSP + "%"), klasse: kl(dP, 1, 1) },
      { label: "Rabattquote", wert: zahl(K.ist.q * 100, 1), einheit: "% vom Umsatz", delta: delta(dQ, 1, NBSP + "%-Pkt."), klasse: kl(dQ, -1, 1) },
    ]);
    let f = DK.visual(bPreis, { titel: "Ø Preis je Stück nach Verkaufsorganisation", einheit: "Tsd. €", botschaft: "" });
    let z = vergleich(f, "vg-preis", "p", { richtung: 1, nkD: 2, fmt: v => zahl(v / 1000, 2), dWert: d => d / 1000, einheit: "Tsd. €",
      name: "Ø Preis", genau: v => zahl(v, 2) + NBSP + "€" });
    bPreis.querySelector(".dk-botschaft").textContent = botschaftPreis(z);
    f = DK.visual(bUmsatz, { titel: "Umsatz nach Verkaufsorganisation", einheit: "Mio. €", botschaft: "" });
    z = vergleich(f, "vg-umsatz", "u", { richtung: 1, nkD: 2, fmt: v => mio(v), dWert: d => d / 1e8, einheit: "Mio. €",
      name: "Umsatz", genau: v => zahl(v / 100, 2) + NBSP + "€" });
    bUmsatz.querySelector(".dk-botschaft").textContent = botschaftUmsatz(z);
    f = DK.visual(bTab, { titel: `Kategorien und Kunden ${J[1]}`, einheit: "Tsd. € bzw. Stück", botschaft: "",
      schalter: { optionen: VO().map((n, i) => [i, n]), wert: tabVo(), onChange: v => { S.tabVo = Number(v); S.vo = null; S.sel = null; zeichnen(); } } });
    const t = tabelle(f);
    bTab.querySelector(".dk-botschaft").textContent = botschaftTabelle(t);
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  /* ---------- Lernplattform ---------- */
  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "v-umsatz", anker: "links", versatz: [440, 22], regel: "SAY – Botschaft vermitteln", titel: "Aussage je Visual",
        text: "Unter jedem Titel steht, was zählt – etwa, dass der Umsatzzuwachs in den USA zu 82 % aus der Verkaufsorganisation Ost kommt. Die Sätze rechnen bei Land, Kategorie und Auswahl neu. Das Original hatte nur technische Titel („Price per PC per Calendar Year and Sales Organization“)." },
      { nr: 2, ziel: "vg-preis-kopf", anker: "links", versatz: [28, -2], regel: "UNIFY – Semantische Notation", titel: "Ist dunkel, Vorjahr hell, ein Balkenpaar",
        text: "Ist 2026 anthrazit, Vorjahr 2025 hellgrau und leicht versetzt dahinter – wie in allen Dashboards des Buches. Das Original zeigte beide Jahre als getrennte Balken in zwei Grautönen ohne Legende; welcher Ton welche Organisation war, verriet nur die Legende über dem Diagramm." },
      { nr: 3, ziel: "vg-preis-dpz", versatz: [14, -4], regel: "UNIFY – Abweichung nach Wirkung", titel: "Blaugrün und Rot statt Hellgrün und Pink",
        text: "Abweichungen zum Vorjahr stehen als Balken an einer Nulllinie, günstig blaugrün, ungünstig rot. Das Original färbte Hellgrün und Pink – rot-grün-farbenfehlsichtig kaum unterscheidbar – und hatte für ΔVJ % zusätzlich Endmarken an den Balken." },
      { nr: 4, ziel: "kpis", anker: "links", versatz: [250, 2], regel: "CONDENSE – Kennzahlen verdichten", titel: "KPI-Leiste ergänzt",
        text: "Umsatz, Absatz, Preis je Stück und Rabattquote stehen als KPI-Leiste mit Vorjahresvergleich über den Details. Im Original musste man die Summen aus der Tabelle (Kopfzeile „Totals“) ablesen." },
      { nr: 5, ziel: "v-tabelle", anker: "links", versatz: [440, 76], regel: "SIMPLIFY – Überflüssiges weglassen", titel: "Tabelle ohne Wiederholungen",
        text: "Die Spalten Verkaufsorganisation, Ort und Währung des Originals wiederholten in jeder Zeile denselben Wert; Ort und Ø Preis stehen jetzt im Tooltip, die Organisation im Schalter. Statt „1.125,00 PC“ und Cent-Beträgen: Tsd. € mit einer Nachkommastelle und Stück ohne Nachkommastellen." },
      { nr: 6, ziel: "vt-kopf-d", versatz: [-2, -4], regel: "EXPRESS – Vergleich ergänzen", titel: "Abweichung auch in der Tabelle",
        text: "Die Tabelle zeigt je Kategorie und Kunde die Abweichung des Umsatzes zum Vorjahr mit Balken. Das Original zeigte nur absolute Werte; ob ein Kunde wächst, war nicht erkennbar." },
      { nr: 7, ziel: "v-tabelle", anker: "links", versatz: [44, 124], regel: "STRUCTURE – Aufklappen statt Endlosliste", titel: "Kategorien auf- und zuklappen",
        text: "Kategorien stehen als Gruppenzeilen, ihre Kunden lassen sich mit ▾/▸ aufklappen (im Startzustand die Tourenräder). Das Original listete alle 42 Kundenzeilen untereinander und war unten abgeschnitten; Kunden sind wie dort nach Umsatz sortiert." },
      { nr: 8, ziel: "kopf-titel", versatz: [30, 0], regel: "CHECK – Stimmige Zahlen", titel: "Werte des Originals, neutral benannt",
        text: "Umsatz, Rabatt und Absatz der Verkaufsorganisation Ost sind die Werte des Originals; die Summen der Diagramme ergeben sich daraus (41,34 Mio. € : 20.956 Stück = 1,97 Tsd. € je Stück). Browserrahmen, Reiterleiste, Firmenlogo und Kundennamen der Demodaten entfallen bzw. sind neutral ersetzt." },
    ],
    nachbauIntro: "Seitengröße benutzerdefiniert 1024 × 646 px. Schrift Arial: Beschriftungen 10,5 pt, Visualtitel 12 pt, KPI-Werte 19,5 pt. Datenmodell: Faktentabelle Vertrieb (Land, Verkaufsorganisation, Jahr, Produktkategorie, Kunde, Ort, Umsatz, Rabatt, Absatz) wie in der CSV-Datei, dazu Dimensionstabellen für Organisation, Kategorie und Kunde. Measures: Umsatz, Umsatz VJ = CALCULATE([Umsatz]; Jahr[Jahr] = 2025), Ø Preis = DIVIDE([Umsatz]; [Absatz]).",
    nachbau: [
      { id: "A", ziel: "kpis", anker: "links", versatz: [130, 2], titel: "KPI-Leiste", visual: "Karte (neu) mit Referenzbeschriftung",
        felder: "Umsatz, Absatz, Ø Preis, Rabattquote = DIVIDE([Rabatt]; [Umsatz]); Referenz ΔVJ % bzw. %-Pkt.",
        format: "Wert 19,5 pt fett; Referenzbeschriftung mit bedingter Farbe (#00806B günstig, #C62828 ungünstig; Rabattquote: Anstieg ungünstig)" },
      { id: "B", ziel: "vg-preis-kopf", anker: "links", versatz: [28, -2], titel: "Ø Preis je Stück", visual: "Gruppiertes Balkendiagramm (überlappend) und zwei Tabellen mit Datenbalken",
        felder: "Y-Achse: Verkaufsorganisation; X-Achse: Ø Preis VJ, Ø Preis; daneben Matrix mit ΔVJ = [Ø Preis] − [Ø Preis VJ] und ΔVJ %",
        format: "Überlappung 60 %, Abstand innerhalb der Kategorie −40 %; Farben #C9C9C9 (VJ), #3A3F44 (Ist); Datenbalken ΔVJ mit zwei Measures (günstig/ungünstig) in #00806B bzw. #C62828",
        hinweis: "Die Zeile „Gesamt“ ist im Balkendiagramm keine Kategorie; als Karte oder über eine Hilfstabelle mit Gesamtzeile nachbauen." },
      { id: "C", ziel: "v-umsatz", anker: "links", versatz: [440, 22], titel: "Umsatz nach Verkaufsorganisation", visual: "wie B",
        felder: "Umsatz VJ, Umsatz (Mio. €: DIVIDE([Umsatz]; 1E6)), ΔVJ, ΔVJ %" },
      { id: "D", ziel: "v-tabelle", anker: "links", versatz: [440, 76], titel: "Kategorien und Kunden", visual: "Matrix",
        felder: "Zeilen: Produktkategorie, Kunde; Werte: Umsatz, Rabatt (Tsd. €), Absatz, ΔVJ Umsatz %; QuickInfo: Ort, Ø Preis",
        format: "Layout „Abgestuft“, +/–-Symbole ein, nur Produktkategorie 1 erweitert; Zeilenteilsummen oben, Gesamtsumme „Summe“; ΔVJ % mit Datenbalken (zwei Measures, Achse automatisch)" },
      { id: "E", ziel: "filter", anker: "links", versatz: [190, -2], titel: "Datenschnitte", visual: "Datenschnitt Land (Kacheln), Datenschnitt Produktkategorie (Dropdown); Schalter West/Ost als Datenschnitt (Kacheln) nur für die Matrix",
        felder: "Land; Produktkategorie; Verkaufsorganisation",
        hinweis: "„Interaktionen bearbeiten“: Der Schalter West/Ost filtert nur die Matrix; Klick auf eine Organisation im Balkendiagramm filtert KPI-Leiste und Matrix (Standard „Filtern“)." },
    ],
    theme: DK.thema(),
    csv: { name: "vertriebscockpit_daten.csv", text: () => {
      const c = v => Math.floor(v / 100) + "," + String(v % 100).padStart(2, "0");
      return ["Land;Verkaufsorganisation;Jahr;Produktkategorie;Kunde;Ort;Umsatz_EUR;Rabatt_EUR;Absatz_Stueck",
        ...R.map(r => { const [n, o] = D.kunden[`${r.l}-${r.v}`][r.k]; return [D.laender[r.l], D.vos[r.l][r.v], J[r.j], KAT[r.c], n, o, c(r.u), c(r.r), r.a].join(";"); })].join("\r\n"); } },
    tabellen: () => {
      const vz = VO().map((name, v) => ({ name, ...kennzahlen(basis({ vo: v })) })).concat([{ name: LAND() + " gesamt", ...kennzahlen(basis()) }]);
      const v = tabVo(), rs = basis({ vo: v });
      const kz = KAT.map((name, c) => ({ name, ...kennzahlen(rs.filter(r => r.c === c)) })).filter(x => x.ist.u || x.vj.u);
      const kunden = [];
      KAT.forEach((kn, c) => D.kunden[`${S.land}-${v}`].forEach(([n, o], k) => {
        const x = kennzahlen(rs.filter(r => r.c === c && r.k === k));
        if (x.ist.u || x.vj.u) kunden.push([kn, n, o, zahl(x.ist.u / 100, 2), zahl(x.ist.r / 100, 2), zahl(x.ist.a), pd(x.ist.u, x.vj.u)]);
      }));
      return [
        { titel: `Verkaufsorganisationen ${LAND()}${S.kat === null ? "" : " – " + KAT[S.kat]}`, kopf: ["Organisation", `Umsatz ${J[0]} (Mio. €)`, `Umsatz ${J[1]}`, "ΔVJ %", `Ø Preis ${J[0]} (€)`, `Ø Preis ${J[1]}`, "ΔVJ %"],
          zeilen: vz.map(x => [x.name, mio(x.vj.u), mio(x.ist.u), pd(x.ist.u, x.vj.u, 2), zahl(x.vj.p, 2), zahl(x.ist.p, 2), pd(x.ist.p, x.vj.p, 2)]) },
        { titel: `Produktkategorien ${VO()[v]} ${J[1]} (€)`, kopf: ["Kategorie", "Umsatz", "Rabatt", "Absatz", "ΔVJ Umsatz %"],
          zeilen: kz.map(x => [x.name, zahl(x.ist.u / 100, 2), zahl(x.ist.r / 100, 2), zahl(x.ist.a), pd(x.ist.u, x.vj.u)]) },
        { titel: `Kunden ${VO()[v]} ${J[1]} (€)`, kopf: ["Kategorie", "Kunde", "Ort", "Umsatz", "Rabatt", "Absatz", "ΔVJ %"], zeilen: kunden },
      ];
    },
  });
  zeichnen();
})();
