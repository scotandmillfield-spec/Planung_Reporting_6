/* Abb. 5.45 – Bericht „Absatz und Umsatz nach Vertriebsweg“, wie er über ein Add-in in einer Tabellenkalkulation
   an ein Data Warehouse angebunden ist (softwareneutraler Nachbau, gleiche Gestaltung wie Abb. 4.19). Seite 1024 x 646 px.
   Daten: vertriebsweg.json (daten_vertriebsweg.py) – Absatz und Umsatz je Vertriebsweg, Verkaufsorganisation und Monat;
   Summen je Vertriebsweg und Verkaufsorganisation = Werte des Originals.
   Links der Navigationsbereich: Anzeige (Information, Diagramm – im Original die Schaltflächen über dem Bericht) und
   freie Merkmale mit „Zeilen“ bzw. „Spalten“ oder „–“ und einer Auswahlliste als Filter. Rechts Berichtsinformationen,
   Ergebnistabelle (Merkmale in den Zeilen, Kennzahlen in den Spalten, Ergebnis je Gruppe, Gesamtergebnis) und Diagramm.
   Klick auf eine Zeile oder einen Balken hebt die Gruppe hervor, Klick auf einen Spaltenkopf sortiert, Esc hebt auf. */
(() => {
  "use strict";
  const { zahl, NBSP, el, tw } = DK;
  const D = DATA;
  const MNAME = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
  const JAHRE = ["2025", "2026"];
  const JLANG = ["2025", "2026 (Jan.–Jun.)"];
  const R = D.saetze.map(([w, o, m, a, u]) => ({ vw: w, vo: o, jahr: Number(D.monate[m].slice(0, 4)) - 2025,
                                                 mon: Number(D.monate[m].slice(5)) - 1, a, u }));
  const DIMS = {
    vw: { name: "Vertriebsweg", mitglieder: D.vertriebswege },
    vo: { name: "Verkaufsorganisation", mitglieder: D.vos },
    mon: { name: "Kalendermonat", mitglieder: MNAME },
  };
  const KZ = [
    { key: "a", name: "Absatz", lang: "Absatz in Stück", fmt: v => zahl(v), exakt: v => zahl(v) + NBSP + "Stück" },
    { key: "u", name: "Umsatz", lang: "Umsatz in Tsd. €", fmt: v => zahl(v / 1e5, 1), exakt: v => zahl(v / 100, 2) + NBSP + "€" },
  ];
  const pz = (a, b, nk = 1) => (b ? zahl(a / b * 100, nk) : "–") + NBSP + "%";
  const passt = (k, breite) => k.find(t => tw(t) <= breite) || k[k.length - 1];

  /* ---------- Zustand (Start = Original: Vertriebsweg › Verkaufsorganisation, Kennzahlen in den Spalten) ---------- */
  const S = { zeilen: ["vw", "vo"], jahrAchse: false, filter: { vw: null, vo: null, mon: null, jahr: null, kz: null },
              zu: new Set(), sel: null, sort: null, info: true, diagramm: true };
  addEventListener("keydown", e => { if (e.key === "Escape" && S.sel) { S.sel = null; zeichnen(); } });

  /* ---------- Layout ---------- */
  DK.init({ titel: "Absatz und Umsatz nach Vertriebsweg" });
  const seite = document.getElementById("seite");
  const bNav = DK.box("navigation", 16, 8, 248, 630);
  el("div", { style: "position:absolute;left:278px;top:8px;height:630px;border-left:1px solid var(--linie)" }, seite);
  const bTitel = DK.box("v-titel", 292, 8, 716, 46);
  const bInhalt = DK.box("v-inhalt", 292, 62, 716, 576);
  DK.el("style", {}, document.head, `
    #v-inhalt { overflow: ${DK.PRINT ? "hidden" : "auto"}; }
    .ea-block { color: var(--muted); font-weight: bold; margin: 0 0 4px; padding-bottom: 3px; border-bottom: 1px solid var(--ac); }
    .ea-info { display: grid; grid-template-columns: 150px 1fr 150px 1fr; row-gap: 2px; column-gap: 8px; margin-bottom: 16px; }
    .ea-info span:nth-child(4n+1), .ea-info span:nth-child(4n+3) { color: var(--muted); }
    .bw { table-layout: fixed; }
    .bw td, .bw th { overflow: hidden; text-overflow: ellipsis; }
    .bw td { height: 21px; }
    .bw th { vertical-align: bottom; height: 22px; }
    .bw th.bw-gruppe-kopf { text-align: center; border-bottom: 1px solid #BDBDBD; height: 20px; }
    .bw td.bw-lab { text-align: left; }
    .bw tr.bw-erg td { font-weight: bold; }
    .bw tr.ea-vorsumme td { border-bottom: 1px solid var(--ac); }
    .bw .bw-pfeil { display: inline-block; width: 14px; color: var(--muted); cursor: pointer; }
    .bw td.bw-leer { color: var(--muted); }
    #v-tabelle { margin-bottom: 16px; }
    #navigation { font-size: 14px; }
    .nv-kopf { font-size: 16px; font-weight: bold; }
    .nv-unter { color: var(--muted); margin: 2px 0 10px; }
    .nv-block { color: var(--muted); font-weight: bold; margin: 12px 0 4px; padding-bottom: 3px; border-bottom: 1px solid var(--ac); }
    .nv-anzeige { display: flex; gap: 6px; padding: 4px 0 2px; }
    .nv-anzeige button { font: inherit; font-size: 14px; height: 26px; padding: 0 10px; background: #FFFFFF; color: var(--text);
      border: 1px solid #9A9A9A; border-radius: 3px; cursor: pointer; }
    .nv-anzeige button[aria-pressed="true"] { background: var(--ac); border-color: var(--ac); color: #FFFFFF; }
    .nv-merkmal { padding: 5px 0 6px; border-bottom: 1px solid #EFEFEF; }
    .nv-zeile { display: flex; align-items: center; justify-content: space-between; height: 24px; }
    .nv-name { font-weight: bold; }
    .nv-name.aus { font-weight: normal; color: var(--muted); }
    .nv-fix { color: var(--muted); padding-right: 2px; }
    .nv-merkmal .dk-knoepfe button { height: 24px; min-width: 0; padding: 0 9px; }
    .nv-merkmal select { font: inherit; font-size: 14px; height: 26px; width: 100%; margin-top: 4px; padding: 0 6px;
      color: var(--text); background: #FFFFFF; border: 1px solid #9A9A9A; border-radius: 3px; }
    .nv-merkmal select.gefiltert { border-color: var(--ac); font-weight: bold; }
    .nv-hinweis { color: var(--muted); margin-top: 10px; line-height: 1.35; }`);

  /* ---------- lokaler Tooltip mit Ereignis (Zelle unter dem Zeiger) ---------- */
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

  /* ---------- Berechnung ---------- */
  const gefiltert = () => R.filter(r => ["vw", "vo", "mon", "jahr"].every(f => S.filter[f] === null || r[f] === S.filter[f]));
  const kzListe = () => (S.filter.kz === null ? KZ : [KZ[S.filter.kz]]);
  // Spalten: je Kennzahl ein Gesamtwert, mit Kalenderjahr in den Spalten zusätzlich je Jahr
  const spalten = () => kzListe().flatMap(kz => [
    ...(S.jahrAchse ? JAHRE.map((_, j) => j).filter(j => S.filter.jahr === null || S.filter.jahr === j).map(j => ({ kz, jahr: j })) : []),
    { kz, jahr: null }]);
  const wert = (rs, kz, jahr) => { const t = rs.filter(r => jahr === null || r.jahr === jahr); return t.length ? t.reduce((s, r) => s + r[kz], 0) : null; };
  const pfadName = p => p.split("/").filter(Boolean).map(x => { const [d, m] = x.split(":"); return DIMS[d].mitglieder[+m]; }).join(" › ");
  const unter = (pfad, sel) => sel !== null && (pfad === sel || pfad.startsWith(sel + "/"));
  const imPfad = (r, pfad) => pfad.split("/").filter(Boolean).every(x => { const [d, m] = x.split(":"); return r[d] === +m; });

  // Zeilen der Ergebnistabelle: Gruppen je Aufrissmerkmal, Ergebnis je Gruppe (außer letzter Ebene), Gesamtergebnis
  function zeilenBauen() {
    const rs = gefiltert(), dims = S.zeilen, n = dims.length, sp = spalten(), out = [];
    const sortSp = S.sort ? sp[S.sort.j] : null;
    const zeile = (teil, pfad, typ, labels) => out.push({ pfad, typ, labels, werte: sp.map(s => wert(teil, s.kz.key, s.jahr)), rs: teil });
    function rek(teil, ebene, pfad) {
      const d = dims[ebene];
      let ms = DIMS[d].mitglieder.map((_, m) => m).filter(m => teil.some(r => r[d] === m));
      if (sortSp) {
        const v = m => wert(teil.filter(r => r[d] === m), sortSp.kz.key, sortSp.jahr) ?? -Infinity;
        ms = ms.slice().sort((x, y) => (S.sort.ab ? v(y) - v(x) : v(x) - v(y)) || x - y);
      }
      ms.forEach(m => {
        const t = teil.filter(r => r[d] === m), p = pfad + "/" + d + ":" + m;
        const lab = dims.map((_, i) => (i === ebene ? { text: DIMS[d].mitglieder[m], pfad: p, klapp: ebene < n - 1 } : ""));
        if (ebene === n - 1) { zeile(t, p, "zeile", lab); return; }
        if (S.zu.has(p.slice(1))) { lab[ebene + 1] = { text: "Ergebnis" }; zeile(t, p, "erg", lab); return; }
        const vor = out.length;
        rek(t, ebene + 1, p);
        if (out[vor]) out[vor].labels[ebene] = lab[ebene];
        zeile(t, p, "erg", dims.map((_, i) => (i === ebene + 1 ? { text: "Ergebnis" } : "")));
      });
    }
    if (n) rek(rs, 0, "");
    zeile(rs, "", "gesamt", n ? dims.map((_, i) => (i === 0 ? { text: "Gesamtergebnis" } : "")) : [{ text: "Gesamtergebnis" }]);
    return { out, sp, rs };
  }

  /* ---------- Navigationsbereich (einmal aufbauen, dann nur Zustände setzen) ---------- */
  const NAV = {};
  let kInfo, kDia;
  (function navigation() {
    el("div", { class: "nv-kopf" }, bNav, "Navigationsbereich");
    el("div", { class: "nv-unter" }, bNav, "Aufriss, Filter und Anzeige des Berichts");
    el("div", { class: "nv-block" }, bNav, "Anzeige");
    const an = el("div", { class: "nv-anzeige", id: "nv-anzeige" }, bNav);
    kInfo = el("button", { type: "button", "aria-pressed": "true" }, an, "Information");
    kDia = el("button", { type: "button", "aria-pressed": "true" }, an, "Diagramm");
    kInfo.addEventListener("click", () => { S.info = !S.info; zeichnen(); });
    kDia.addEventListener("click", () => { S.diagramm = !S.diagramm; zeichnen(); });
    el("div", { class: "nv-block", id: "nv-merkmale" }, bNav, "Freie Merkmale");
    const merkmal = (key, name, achse, optionen) => {
      const m = el("div", { class: "nv-merkmal", id: "nv-" + key }, bNav);
      const z = el("div", { class: "nv-zeile" }, m);
      const nm = el("span", { class: "nv-name" }, z, name);
      let kn = null;
      if (achse === "fix") el("span", { class: "nv-fix" }, z, "Spalten");
      else kn = DK.knoepfe(z, { optionen: [[achse, achse === "zeilen" ? "Zeilen" : "Spalten"], ["aus", "–"]], wert: "aus",
        onChange: v => { achseSetzen(key, v !== "aus"); } });
      const sel = el("select", { "aria-label": "Filter " + name }, m);
      [["alle", "Alle"], ...optionen.map((t, i) => [String(i), t])].forEach(([v, t]) => el("option", { value: v }, sel, t));
      sel.addEventListener("change", () => { S.filter[key] = sel.value === "alle" ? null : Number(sel.value); S.sel = null; zeichnen(); });
      NAV[key] = { nm, kn, sel, name };
    };
    merkmal("vw", "Vertriebsweg", "zeilen", DIMS.vw.mitglieder);
    merkmal("vo", "Verkaufsorganisation", "zeilen", DIMS.vo.mitglieder);
    merkmal("kz", "Kennzahlen", "fix", KZ.map(k => k.lang));
    merkmal("jahr", "Kalenderjahr", "spalten", JLANG);
    merkmal("mon", "Kalendermonat", "zeilen", MNAME);
    el("div", { class: "nv-hinweis" }, bNav, "„Zeilen“ bzw. „Spalten“ nimmt ein Merkmal in den Aufriss, „–“ entfernt es; die Liste filtert.");
  })();
  function achseSetzen(key, an) {
    if (key === "jahr") S.jahrAchse = an;
    else {
      S.zeilen = S.zeilen.filter(k => k !== key);
      if (an) S.zeilen.push(key);
    }
    S.sel = null; S.sort = null;
    zeichnen();
  }
  function navZustand() {
    kInfo.setAttribute("aria-pressed", String(S.info));
    kDia.setAttribute("aria-pressed", String(S.diagramm));
    Object.entries(NAV).forEach(([key, { nm, kn, sel }]) => {
      const an = key === "kz" ? true : key === "jahr" ? S.jahrAchse : S.zeilen.includes(key);
      nm.classList.toggle("aus", !an);
      if (kn) [...kn.querySelectorAll("button")].forEach((b, i) => b.setAttribute("aria-pressed", String(i === 0 ? an : !an)));
      const f = S.filter[key];
      sel.value = f === null ? "alle" : String(f);
      sel.classList.toggle("gefiltert", f !== null);
    });
  }
  const filterText = () => ["vw", "vo", "jahr", "mon", "kz"].filter(k => S.filter[k] !== null)
    .map(k => k === "kz" ? KZ[S.filter.kz].lang : k === "jahr" ? `Kalenderjahr ${JLANG[S.filter.jahr]}` : `${DIMS[k].name} ${DIMS[k].mitglieder[S.filter[k]]}`).join("; ");

  /* ---------- Berichtsinformationen ---------- */
  function information(ziel) {
    const w = el("div", { id: "v-info" }, ziel);
    el("div", { class: "ea-block" }, w, "Berichtsinformationen");
    const g = el("div", { class: "ea-info" }, w);
    D.info.forEach(([a, b]) => { el("span", {}, g, a); el("span", {}, g, b); });
  }

  /* ---------- Ergebnistabelle ---------- */
  const fmtWert = (z, j, sp) => (z.werte[j] === null ? "–" : sp[j].kz.fmt(z.werte[j]));
  function tabelle(ziel, Z) {
    const w = el("div", { id: "v-tabelle" }, ziel);
    el("div", { class: "ea-block" }, w, "Ergebnistabelle");
    const { out, sp } = Z, dims = S.zeilen;
    const kopfLab = dims.length ? dims.map(d => DIMS[d].name) : [""];
    const spName = s => (s.jahr === null ? (S.jahrAchse ? "Gesamt" : s.kz.name) : JAHRE[s.jahr]);
    const wLab = kopfLab.map((name, i) => Math.ceil(Math.max(tw(name), ...out.map(z => (z.labels[i] && z.labels[i].text ?
      tw(z.labels[i].text, 14, z.typ !== "zeile" || !!z.labels[i].pfad) + (z.labels[i].klapp ? 14 : 0) : 0)))) + 16);
    const wW = sp.map((s, j) => Math.max(76, Math.ceil(Math.max(tw(spName(s)) + (S.sort && S.sort.j === j ? tw(" ▾") : 0),
      ...out.map(z => tw(fmtWert(z, j, sp), 14, true)))) + 18));
    const summe = wLab.reduce((a, b) => a + b, 0) + wW.reduce((a, b) => a + b, 0);
    const frei = Math.max(0, 716 - summe);
    const W = [...wLab.map(x => x + frei * 0.4 / wLab.length), ...wW.map(x => x + frei * 0.6 / wW.length)];
    const t = el("table", { class: "dk-matrix bw", style: `width:${Math.max(716, summe)}px` }, w);
    const cg = el("colgroup", {}, t);
    W.forEach(x => el("col", { style: `width:${x}px` }, cg));
    const th = el("thead", {}, t);
    // Kopf: mit Kalenderjahr in den Spalten zwei Zeilen (Kennzahl über den Jahren)
    if (S.jahrAchse) {
      const r1 = el("tr", {}, th);
      kopfLab.forEach(() => el("th", { style: "border-bottom:none" }, r1, ""));
      kzListe().forEach(kz => el("th", { class: "bw-gruppe-kopf", colspan: String(sp.filter(s => s.kz === kz).length) }, r1, kz.name));
    }
    const hr = el("tr", {}, th);
    kopfLab.forEach((h, i) => {
      const c = el("th", { style: "text-align:left", id: "bw-kopf-" + i }, hr, h);
      if (i === 0 && !DK.PRINT && dims.length) { c.classList.add("dk-sortierbar"); c.title = "Klick: ursprüngliche Reihenfolge"; c.addEventListener("click", () => { S.sort = null; zeichnen(); }); }
    });
    sp.forEach((s, j) => {
      const c = el("th", { id: `bw-kopf-${s.kz.key}${s.jahr === null ? "" : "-" + s.jahr}` }, hr, spName(s));
      if (DK.PRINT) return;
      c.classList.add("dk-sortierbar"); c.title = "Klick sortiert die Gruppen";
      c.addEventListener("click", () => { S.sort = S.sort && S.sort.j === j ? { j, ab: !S.sort.ab } : { j, ab: true }; zeichnen(); });
      if (S.sort && S.sort.j === j) c.appendChild(document.createTextNode(S.sort.ab ? " ▾" : " ▴"));
    });
    const tb = el("tbody", {}, t);
    out.forEach((z, zi) => {
      const cls = [z.typ === "gesamt" ? "dk-summe" : "dk-zeile"];
      if (z.typ === "erg") cls.push("bw-erg");
      // Trennlinie vor einer neuen Gruppe an der Vorzeile (im border-collapse gewinnt die obere Zelle)
      if (zi > 0 && z.typ !== "gesamt" && z.labels[0] && z.labels[0].pfad && dims.length > 1 && tb.lastChild) tb.lastChild.classList.add("dk-trenner");
      if (z.typ !== "gesamt" && S.sel !== null && !unter(z.pfad, S.sel)) cls.push("dk-blass");
      if (z.typ === "gesamt" && tb.lastChild) tb.lastChild.classList.add("ea-vorsumme");
      const tr = el("tr", { class: cls.join(" ") }, tb);
      z.labels.forEach((l, i) => {
        const td = el("td", { class: "bw-lab", "data-ebene": i }, tr);
        if (!l) return;
        if (l.klapp) {
          const pf = el("span", { class: "bw-pfeil", title: "Klick klappt zu oder auf" }, td, S.zu.has(l.pfad.slice(1)) ? "▸" : "▾");
          if (!DK.PRINT) pf.addEventListener("click", ev => { ev.stopPropagation(); const k = l.pfad.slice(1); if (S.zu.has(k)) S.zu.delete(k); else S.zu.add(k); zeichnen(); });
        }
        td.appendChild(document.createTextNode(l.text));
        if (z.typ === "gesamt") td.style.overflow = "visible";
        if (l.pfad && (l.klapp || z.typ !== "zeile")) td.style.fontWeight = "bold";   // Gruppen fett, unterste Ebene normal
      });
      z.werte.forEach((v, j) => el("td", { "data-j": j, class: v === null ? "bw-leer" : "" }, tr, fmtWert(z, j, sp)));
      if (z.typ !== "gesamt") tr.addEventListener("click", ev => {
        const td = ev.target.closest("td"), e = td && td.dataset.ebene !== undefined ? +td.dataset.ebene : null;
        let p = z.pfad;
        if (e !== null) p = z.pfad.split("/").slice(0, e + 2).join("/");
        S.sel = S.sel === p ? null : p;
        zeichnen();
      });
      tooltip(tr, ev => {
        const td = ev.target.closest ? ev.target.closest("td") : null;
        const j = td && td.dataset.j !== undefined ? +td.dataset.j : sp.length - 1, s = sp[j], v = z.werte[j];
        const wer = z.typ === "gesamt" ? "Gesamtergebnis" : pfadName(z.pfad) + (z.typ === "erg" ? " (Ergebnis)" : "");
        const zeilen = [`${wer}${s.jahr === null ? "" : " · " + JLANG[s.jahr]}`];
        if (v === null) { zeilen.push(`${s.kz.lang}: kein Wert („–“)`); return zeilen; }
        zeilen.push(`${s.kz.name}: ${s.kz.exakt(v)}`);
        const ges = s.kz.key === "u" ? wert(Z.rs, "u", s.jahr) : wert(Z.rs, "a", s.jahr);
        if (z.typ !== "gesamt" && ges) zeilen.push(`Anteil am Gesamtergebnis ${pz(v, ges)}`);
        const a = wert(z.rs, "a", s.jahr), u = wert(z.rs, "u", s.jahr);
        if (a && u) zeilen.push(`Ø Preis ${zahl(u / 100 / a)}${NBSP}€ je Stück`);
        const fl = filterText();
        if (fl) zeilen.push("Filter: " + fl);
        if (z.typ !== "gesamt") zeilen.push("Klick hebt die Gruppe hervor, Esc hebt auf");
        return zeilen;
      });
    });
  }

  /* ---------- Diagramm: Umsatz (bzw. gefilterte Kennzahl) je Zeile der untersten Ebene ---------- */
  function diagramm(ziel, Z) {
    const kz = kzListe().find(k => k.key === "u") || kzListe()[0];
    const blatt = Z.out.filter(z => z.typ === "zeile" || (z.typ === "erg" && S.zu.has(z.pfad.slice(1))));
    let zeilen = blatt.map(z => ({ key: z.pfad, label: pfadName(z.pfad), wert: wert(z.rs, kz.key, null) || 0, rs: z.rs }));
    const viele = zeilen.length > 8;
    if (viele) zeilen = zeilen.slice().sort((a, b) => b.wert - a.wert).slice(0, 8);
    if (!S.zeilen.length) zeilen = [{ key: "", label: "Gesamtergebnis", wert: wert(Z.rs, kz.key, null) || 0, rs: Z.rs }];
    const w = el("div", { id: "v-diagramm" }, ziel);
    const titel = `${kz.name} nach ${S.zeilen.length ? S.zeilen.map(d => DIMS[d].name).join(" und ") : "Gesamtergebnis"}, ${kz.key === "u" ? "Tsd. €" : "Stück"}${viele ? " (die 8 größten)" : ""}`;
    el("div", { class: "ea-block" }, w, "Diagramm: " + titel);
    const f = el("div", { class: "dk-visual", style: "position:relative" }, w);
    const ges = wert(Z.rs, kz.key, null);
    const svg = DK.balken(f, { breite: 716, zeilenhoehe: 22, hoehe: 22 * zeilen.length, zeilen, fmt: kz.fmt, auswahl: null,
      labelBreite: Math.ceil(Math.max(...zeilen.map(z => tw(z.label)))) + 12,
      onClick: k => { S.sel = S.sel === k ? null : k; zeichnen(); },
      tooltip: z => [z.label, `${kz.name}: ${kz.exakt(z.wert)}`, ges ? `Anteil am Gesamtergebnis ${pz(z.wert, ges)}` : "",
        "Klick hebt die Gruppe auch in der Tabelle hervor"].filter(Boolean) });
    // Hervorhebung auch für übergeordnete Gruppen (Balken unterhalb der gewählten Gruppe bleiben kräftig)
    [...svg.children].forEach((g, i) => { if (S.sel !== null && zeilen[i] && !unter(zeilen[i].key, S.sel)) g.classList.add("dk-blass"); });
  }

  /* ---------- Botschaft ---------- */
  function botschaft(Z) {
    const B = 712, rs = Z.rs, kz = kzListe().find(k => k.key === "u") || kzListe()[0];
    const ges = wert(rs, kz.key, null);
    if (!ges) return "keine Werte für diese Auswahl";
    const anteil = v => pz(v, ges);
    if (S.sel) {
      const t = rs.filter(r => imPfad(r, S.sel)), v = wert(t, kz.key, null) || 0, a = wert(t, "a", null), u = wert(t, "u", null);
      const preis = a && u ? `, Ø ${zahl(u / 100 / a)} € je Stück` : "";
      return passt([`${pfadName(S.sel)}: ${kz.name} ${kz.fmt(v)} ${kz.key === "u" ? "Tsd. €" : "Stück"} (${anteil(v)} des Gesamtergebnisses)${preis}`,
        `${pfadName(S.sel)}: ${anteil(v)} des ${kz.name === "Umsatz" ? "Umsatzes" : "Absatzes"}`], B);
    }
    const nomen = kz.key === "u" ? "des Umsatzes" : "des Absatzes";
    const groesst = d => DIMS[d].mitglieder.map((n, m) => ({ n, v: wert(rs.filter(r => r[d] === m), kz.key, null) || 0 })).sort((a, b) => b.v - a.v)[0];
    const dims = S.zeilen;
    if (!dims.length) return passt([`Gesamtergebnis: ${zahl(wert(rs, "a", null))} Stück, ${zahl(wert(rs, "u", null) / 1e5, 1)} Tsd. € Umsatz`], B);
    const g1 = groesst(dims[0]);
    const teil1 = `${g1.n} ${dims[0] === "mon" ? "ist der stärkste Monat" : "bringt"} ${dims[0] === "mon" ? "mit " + anteil(g1.v) : anteil(g1.v) + " " + nomen}`;
    if (dims.length > 1) {
      const g2 = groesst(dims[1]);
      const was = { vw: "größter Vertriebsweg", vo: "größte Verkaufsorganisation", mon: "stärkster Monat" }[dims[1]];
      return passt([`${teil1}; ${was} ist ${g2.n} mit ${anteil(g2.v)}`, teil1], B);
    }
    return passt([teil1], B);
  }

  /* ---------- Zeichnen ---------- */
  function zeichnen() {
    navZustand();
    const Z = zeilenBauen();
    DK.visual(bTitel, { titel: "Absatz und Umsatz nach Vertriebsweg", einheit: "Absatz in Stück, Umsatz in Tsd. €", botschaft: botschaft(Z) });
    bInhalt.textContent = "";
    if (S.info) information(bInhalt);
    tabelle(bInhalt, Z);
    if (S.diagramm) diagramm(bInhalt, Z);
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  /* ---------- Lernplattform ---------- */
  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "nv-merkmale", anker: "links", versatz: [222, -2], regel: "STRUCTURE – Navigation neben der Tabelle", titel: "Navigationsbereich mit Aufriss und Filter",
        text: "Wie im Original steht neben dem Bericht ein Navigationsbereich: je Merkmal zeigt der gedrückte Knopf, ob es im Aufriss steht, die Auswahlliste filtert. Probieren Sie Kalenderjahr → „Spalten“ oder Kalendermonat → „Zeilen“ – das Add-in fragt die Daten im Data Warehouse neu ab. Gestaltung wie in Abb. 4.19." },
      { nr: 2, ziel: "v-titel", anker: "links", versatz: [600, 22], regel: "SAY – Botschaft vermitteln", titel: "Aussage über der Tabelle",
        text: "Über der Tabelle steht, was der Bericht zeigt: Internet und Großhandel sind fast gleich groß, Süd ist die größte Verkaufsorganisation. Der Satz rechnet bei jedem Aufriss, Filter und jeder hervorgehobenen Gruppe neu. Das Original hatte nur den Berichtsnamen „… Sales – Case 1“." },
      { nr: 3, ziel: "bw-kopf-u", anker: "links", versatz: [44, 0], regel: "SIMPLIFY – Einheit einmal", titel: "Einheiten im Titel statt an jeder Zahl",
        text: "Das Original schrieb „IT“ und „AUD“ hinter jede Zahl und den Umsatz mit Cent (147.685.911,83). Jetzt stehen die Einheiten einmal im Titel, der Umsatz in Tsd. € mit einer Nachkommastelle; die genauen Werte und der Ø Preis je Stück stehen im Tooltip." },
      { nr: 4, ziel: "bw-kopf-0", anker: "links", versatz: [128, 0], regel: "UNIFY – Begriffe statt Schlüssel", titel: "Text statt Schlüssel und Text",
        text: "Das Original zeigte jedes Merkmal doppelt – Schlüssel und Text („IN Internet“, „AUS1 AUS1“) – und englische Feldnamen. Hier steht nur der Text, Spaltenköpfe sind deutsch und ausgeschrieben; Schlüssel braucht nur, wer Daten weiterverarbeitet (CSV)." },
      { nr: 5, ziel: "v-tabelle", anker: "links", versatz: [76, 100], regel: "EXPRESS – Hervorheben ohne Farbflächen", titel: "Ergebnisse fett statt gelb",
        text: "Ergebniszeilen sind fett, das Gesamtergebnis steht über einer dunklen Linie. Das Original hob Ergebnisse mit gelben Flächen hervor und rahmte Kopf und Blöcke blau. Gruppen lassen sich mit ▾/▸ zu- und aufklappen." },
      { nr: 6, ziel: "v-info", anker: "links", versatz: [400, -4], regel: "CONDENSE – Metadaten bündeln", titel: "Berichtsinformationen kompakt",
        text: "Autor, Änderung, Datenquelle, Datenstand und Stichtag stehen in einem Block in zwei Spalten. Das Original zeigte elf Zeilen, darunter technische Namen der Abfrage und des Datenwürfels sowie Datenstand und Datenaktualität doppelt. Der Block lässt sich über „Information“ ausblenden." },
      { nr: 7, ziel: "v-diagramm", anker: "links", versatz: [600, -4], regel: "CHECK – Ergebnisse aus den Zeilen", titel: "Summen stimmen, Diagramm aus der Tabelle",
        text: "Absatz und Umsatz je Vertriebsweg und Verkaufsorganisation sind die Werte des Originals; Ergebnisse und Gesamtergebnis werden aus den Zeilen gerechnet und stimmen mit dem Original überein. Das Diagramm (im Original die Schaltfläche „Chart“) zeigt dieselben Zeilen als Balken mit einem Maßstab." },
      { nr: 8, ziel: "nv-anzeige", anker: "links", versatz: [224, 4], regel: "SIMPLIFY – Softwareneutral", titel: "Ohne Programmrahmen",
        text: "Spaltenbuchstaben, Zeilennummern und Gitternetz der Tabellenkalkulation, Sortierpfeile in jedem Kopf und die blaue Farbgebung des Add-ins entfallen. Die Schaltflächen „Information“ und „Diagramm“ stehen im Navigationsbereich; Kunden- und Personennamen sind neutral." },
    ],
    nachbauIntro: "Seitengröße benutzerdefiniert 1024 × 646 px, Schrift Arial: Tabelle 10,5 pt, Titel 12 pt. Datenmodell: Faktentabelle Vertrieb (Monat, Vertriebsweg, Verkaufsorganisation, Absatz, Umsatz) mit Datumstabelle (Kalenderjahr, Kalendermonat) wie in der CSV-Datei. " +
      "Die Tabellenkalkulations-Oberfläche entspricht „In Excel analysieren“: Das veröffentlichte Semantikmodell wird als Pivottabelle mit Feldliste und Datenschnitten geöffnet; Aufriss und Filter fragen das Modell neu ab.",
    nachbau: [
      { id: "A", ziel: "v-tabelle", anker: "links", versatz: [76, 100], titel: "Ergebnistabelle", visual: "Matrix",
        felder: "Zeilen: Vertriebsweg, Verkaufsorganisation; Spalten: (Kalenderjahr); Werte: Absatz, Umsatz (Tsd. €)",
        format: "Layout „Tabellarisch“ (Zeilenköpfe in eigenen Spalten); Zeilenteilsummen ein, Bezeichnung „Ergebnis“, fett; Gesamtsumme „Gesamtergebnis“; +/–-Symbole ein",
        hinweis: "Umsatz Tsd. € = DIVIDE(SUM(Vertrieb[Umsatz]); 1000), eine Dezimalstelle; Tooltip mit Anteil = DIVIDE([Umsatz]; CALCULATE([Umsatz]; ALLSELECTED())) und Ø Preis = DIVIDE([Umsatz]; [Absatz])." },
      { id: "B", ziel: "nv-merkmale", anker: "links", versatz: [222, -2], titel: "Navigationsbereich", visual: "Datenschnitte (Dropdown) bzw. Filterbereich, dazu „Visuals personalisieren“",
        felder: "Vertriebsweg, Verkaufsorganisation, Kennzahlen (Feldparameter), Kalenderjahr, Kalendermonat",
        hinweis: "Den Aufriss (Merkmal in Zeilen oder Spalten nehmen oder entfernen) bieten im Lesemodus „Visuals personalisieren“ oder Feldparameter für Zeilen und Spalten der Matrix." },
      { id: "C", ziel: "v-info", anker: "links", versatz: [400, -4], titel: "Berichtsinformationen", visual: "Karte (neu) bzw. Textfeld mit dynamischen Werten",
        felder: "Autor, Datenquelle als Text; Datenstand = MAX(Vertrieb[Ladezeitpunkt]); Stichtag aus Parameter",
        hinweis: "Ein- und Ausblenden über eine Schaltfläche mit Lesezeichen (Anzeige „Information“)." },
      { id: "D", ziel: "v-diagramm", anker: "links", versatz: [600, -4], titel: "Diagramm", visual: "Gruppiertes Balkendiagramm",
        felder: "Y-Achse: Vertriebsweg, Verkaufsorganisation (Hierarchie, Beschriftung verketten); X-Achse: Umsatz (Tsd. €)",
        format: "Balken #3A3F44, Datenbeschriftung ein, X-Achse und Gitternetz aus; Ein- und Ausblenden über Lesezeichen (Anzeige „Diagramm“)" },
    ],
    theme: DK.thema(),
    csv: { name: "absatz_umsatz_vertriebsweg.csv", text: () =>
      ["Vertriebsweg;Verkaufsorganisation;Kalenderjahr;Kalendermonat;Absatz_Stueck;Umsatz_EUR",
       ...D.saetze.map(([w, o, m, a, u]) => [D.vertriebswege[w], D.vos[o], D.monate[m].slice(0, 4), D.monate[m].slice(5), a,
                                             Math.floor(u / 100) + "," + String(u % 100).padStart(2, "0")].join(";"))].join("\r\n") },
    tabellen: () => {
      const Z = zeilenBauen(), sp = Z.sp, fl = filterText();
      return [{ titel: `Ergebnistabelle (Absatz in Stück, Umsatz in €)${fl ? " – Filter: " + fl : ""}`,
        kopf: ["Gruppe", ...sp.map(s => s.kz.name + (s.jahr === null ? "" : " " + JAHRE[s.jahr]))],
        zeilen: Z.out.map(z => [z.typ === "gesamt" ? "Gesamtergebnis" : pfadName(z.pfad) + (z.typ === "erg" ? " (Ergebnis)" : ""),
                                ...z.werte.map((v, j) => (v === null ? "–" : sp[j].kz.key === "u" ? zahl(v / 100, 2) : zahl(v)))]) }];
    },
  });
  zeichnen();
})();
