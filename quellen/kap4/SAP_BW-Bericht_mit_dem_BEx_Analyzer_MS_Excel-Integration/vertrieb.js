/* Abb. 4.19 – Bericht „Vertriebsbeauftragte im Quartalsvergleich“ mit Navigationsbereich, wie er in einer
   Tabellenkalkulation an ein Data Warehouse angebunden ist (softwareneutraler Nachbau). Seite 1024 x 646 px.
   Daten: vertrieb.json (daten_vertrieb.py) – Absatz, Erlös und Deckungsbeitrag I je Vertriebsbeauftragtem, Kunde,
   Warengruppe und Quartal; Werte des Originals.
   Links der Navigationsbereich: feste Filter und freie Merkmale; je Merkmal „Zeilen“ (Aufriss) bzw. „Spalten“ oder „–“
   (entfernen) und eine Auswahlliste als Filter. Rechts die Ergebnistabelle mit Kennzahlen in den Zeilen, Quartalen in
   den Spalten und Ergebniszeilen je Gruppe. Startzustand wie im Original: Aufriss Vertriebsbeauftragter › Kunde ›
   Kennzahlen, Spalten Quartal. Gruppen lassen sich zu- und aufklappen (Herr Vogt startet zugeklappt, damit der Bericht
   auf eine Seite passt), Klick auf eine Zeile hebt die Gruppe hervor, Klick auf einen Spaltenkopf sortiert, Esc hebt auf. */
(() => {
  "use strict";
  const { zahl, delta, NBSP, el, tw } = DK;
  const D = DATA;
  const R = D.saetze.map(([k, w, q, a, e, d]) => ({ vb: D.kunden[k][1], kunde: k, branche: D.kunden[k][2], wg: w, q, a, e, d }));
  const DIMS = {
    vb: { name: "Vertriebsbeauftragter", mitglieder: D.vertriebsbeauftragte },
    kunde: { name: "Kunde", mitglieder: D.kunden.map(k => k[0]) },
    branche: { name: "Branche", mitglieder: D.branchen },
    wg: { name: "Warengruppe", mitglieder: D.warengruppen },
  };
  const KZ = [
    { key: "a", name: "Absatz", lang: "Absatz in Stück", fmt: v => zahl(v), einheit: "Stück", exakt: v => zahl(v) + NBSP + "Stück" },
    { key: "e", name: "Erlös", lang: "Erlös in Tsd. €", fmt: v => zahl(v / 1000, 1), einheit: "Tsd. €", exakt: v => zahl(v) + NBSP + "€" },
    { key: "d", name: "DB I", lang: "Deckungsbeitrag I in Tsd. €", fmt: v => zahl(v / 1000, 1), einheit: "Tsd. €", exakt: v => zahl(v) + NBSP + "€" },
  ];
  const QN = D.quartale, QLANG = q => `${q + 1}. Quartal ${D.jahr}`;
  const pz = (a, b, nk = 0) => (b ? zahl(a / b * 100, nk) : "–") + NBSP + "%";
  const passt = (k, breite) => k.find(t => tw(t) <= breite) || k[k.length - 1];

  /* ---------- Zustand (Start = Original) ---------- */
  const S = { zeilen: ["vb", "kunde"], quartalAchse: true, filter: { vb: null, kunde: null, branche: null, wg: null, kz: null, q: null },
              zu: new Set(["vb:2"]), sel: null, sort: null };
  addEventListener("keydown", e => { if (e.key === "Escape" && S.sel) { S.sel = null; zeichnen(); } });

  /* ---------- Layout ---------- */
  DK.init({ titel: "Vertriebsbeauftragte im Quartalsvergleich" });
  const seite = document.getElementById("seite");
  const bNav = DK.box("navigation", 16, 8, 248, 630);
  el("div", { style: "position:absolute;left:278px;top:8px;height:630px;border-left:1px solid var(--linie)" }, seite);
  const bTitel = DK.box("v-titel", 292, 8, 716, 46);
  const bTab = DK.box("v-tabelle", 292, 62, 716, 576);
  DK.el("style", {}, document.head, `
    #v-tabelle { overflow: ${DK.PRINT ? "hidden" : "auto"}; }
    .bw { table-layout: fixed; }
    .bw td, .bw th { overflow: hidden; text-overflow: ellipsis; }
    .bw td { height: 19px; }
    .bw th { vertical-align: bottom; height: 22px; }
    .bw td.bw-lab { text-align: left; }
    .bw td.bw-kz { text-align: left; color: var(--muted); }
    .bw tr.bw-erg td { font-weight: bold; }
    .bw tr.bw-erg td.bw-kz { color: var(--text); }
    .bw tr.bw-ergkopf td { border-top: 1px solid #BDBDBD; }
    .bw tr.dk-summe td { border-top: none; }
    .bw tr.dk-summe.bw-gesamtkopf td { border-top: 1px solid var(--ac); }
    .bw tr.bw-gruppe td { border-top: 1px solid #9A9A9A; }
    .bw tr.dk-summe td.bw-kz { color: var(--text); }
    .bw .bw-pfeil { display: inline-block; width: 14px; color: var(--muted); cursor: pointer; }
    .bw td.bw-leer { color: var(--muted); }
    #navigation { font-size: 14px; }
    .nv-kopf { font-size: 16px; font-weight: bold; }
    .nv-unter { color: var(--muted); margin: 2px 0 10px; }
    .nv-block { color: var(--muted); font-weight: bold; margin: 12px 0 4px; padding-bottom: 3px; border-bottom: 1px solid var(--ac); }
    .nv-fest { display: grid; grid-template-columns: 1fr auto; row-gap: 3px; }
    .nv-fest span:nth-child(even) { text-align: right; }
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
  const gefiltert = () => R.filter(r => ["vb", "kunde", "branche", "wg"].every(f => S.filter[f] === null || r[f] === S.filter[f]) &&
                                        (S.filter.q === null || r.q === S.filter.q));
  const kzListe = () => (S.filter.kz === null ? KZ : [KZ[S.filter.kz]]);
  const spalten = () => [...(S.quartalAchse ? QN.map((_, q) => q).filter(q => S.filter.q === null || q === S.filter.q) : []), "ges"];
  const wert = (rs, kz, sp) => { const t = rs.filter(r => sp === "ges" || r.q === sp); return t.length ? t.reduce((s, r) => s + r[kz], 0) : null; };
  const pfadName = p => p.split("/").filter(Boolean).map(x => { const [d, m] = x.split(":"); return DIMS[d].mitglieder[+m]; }).join(" › ");

  // Zeilen der Ergebnistabelle: Gruppen je Aufrissmerkmal, Kennzahlen innen, Ergebnis je Gruppe (außer letzter Ebene)
  function zeilenBauen() {
    const rs = gefiltert(), dims = S.zeilen, n = dims.length, sp = spalten(), kzs = kzListe(), out = [];
    const sortKz = (kzs.find(k => k.key === "e") || kzs[0]).key;
    const kzZeilen = (teil, pfad, typ, labels, ebene) => kzs.forEach((k, i) => out.push({
      pfad, typ, kz: k, ebene, labels: i === 0 ? labels : labels.map(() => ""), erste: i === 0,
      werte: sp.map(s => wert(teil, k.key, s)), rs: teil }));
    function rek(teil, ebene, pfad) {
      const d = dims[ebene];
      let ms = DIMS[d].mitglieder.map((_, m) => m).filter(m => teil.some(r => r[d] === m));
      if (S.sort) {
        const v = m => wert(teil.filter(r => r[d] === m), sortKz, S.sort.sp) ?? -Infinity;
        ms = ms.slice().sort((x, y) => (S.sort.ab ? v(y) - v(x) : v(x) - v(y)) || x - y);
      }
      ms.forEach(m => {
        const t = teil.filter(r => r[d] === m), p = pfad + "/" + d + ":" + m;
        const lab = dims.map((_, i) => (i === ebene ? { text: DIMS[d].mitglieder[m], pfad: p, klapp: ebene < n - 1 } : ""));
        if (ebene === n - 1) { kzZeilen(t, p, "zeile", lab, ebene); return; }
        if (S.zu.has(p.slice(1))) {
          lab[ebene + 1] = { text: "Ergebnis" };
          kzZeilen(t, p, "erg", lab, ebene);
          return;
        }
        const vor = out.length;
        rek(t, ebene + 1, p);
        if (out[vor]) out[vor].labels[ebene] = lab[ebene];
        kzZeilen(t, p, "erg", dims.map((_, i) => (i === ebene + 1 ? { text: "Ergebnis" } : "")), ebene);
      });
    }
    if (n) rek(rs, 0, "");
    kzZeilen(rs, "", "gesamt", dims.length ? dims.map((_, i) => (i === 0 ? { text: "Gesamtergebnis" } : "")) : [], -1);
    if (!dims.length) out.filter(z => z.typ === "gesamt").forEach(z => { z.labels = []; });
    return { out, sp, rs };
  }
  const unter = (pfad, sel) => sel !== null && (pfad === sel || pfad.startsWith(sel + "/"));

  /* ---------- Navigationsbereich (einmal aufbauen, dann nur Zustände setzen) ---------- */
  const NAV = {};
  (function navigation() {
    el("div", { class: "nv-kopf" }, bNav, "Navigationsbereich");
    el("div", { class: "nv-unter" }, bNav, "Aufriss und Filter des Berichts");
    el("div", { class: "nv-block" }, bNav, "Feste Filter");
    const f = el("div", { class: "nv-fest", id: "nv-fest" }, bNav);
    [["Verkaufsorganisation", D.vkorg], ["Geschäftsjahr", `Jan.–Dez. ${D.jahr}`]].forEach(([a, b]) => { el("span", {}, f, a); el("span", {}, f, b); });
    el("div", { class: "nv-block", id: "nv-merkmale" }, bNav, "Freie Merkmale");
    const merkmal = (key, name, achse, optionen) => {
      const m = el("div", { class: "nv-merkmal", id: "nv-" + key }, bNav);
      const z = el("div", { class: "nv-zeile" }, m);
      const nm = el("span", { class: "nv-name" }, z, name);
      let kn = null;
      if (achse === "fix") el("span", { class: "nv-fix" }, z, "Zeilen (innen)");
      else kn = DK.knoepfe(z, { optionen: [[achse, achse === "zeilen" ? "Zeilen" : "Spalten"], ["aus", "–"]], wert: "aus",
        onChange: v => { achseSetzen(key, v !== "aus"); } });
      const sel = el("select", { "aria-label": "Filter " + name }, m);
      [["alle", "Alle"], ...optionen.map((t, i) => [String(i), t])].forEach(([v, t]) => el("option", { value: v }, sel, t));
      sel.addEventListener("change", () => { S.filter[key] = sel.value === "alle" ? null : Number(sel.value); S.sel = null; zeichnen(); });
      NAV[key] = { nm, kn, sel };
    };
    merkmal("vb", "Vertriebsbeauftragter", "zeilen", DIMS.vb.mitglieder);
    merkmal("kunde", "Kunde", "zeilen", DIMS.kunde.mitglieder);
    merkmal("kz", "Kennzahlen", "fix", KZ.map(k => k.lang));
    merkmal("q", "Quartal", "spalten", QN);
    merkmal("branche", "Branche", "zeilen", DIMS.branche.mitglieder);
    merkmal("wg", "Warengruppe", "zeilen", DIMS.wg.mitglieder);
    el("div", { class: "nv-hinweis" }, bNav, "„Zeilen“ nimmt ein Merkmal in den Aufriss, „–“ entfernt es; die Liste filtert.");
  })();
  function achseSetzen(key, an) {
    if (key === "q") S.quartalAchse = an;
    else {
      S.zeilen = S.zeilen.filter(k => k !== key);
      if (an) S.zeilen.push(key);
    }
    S.sel = null; S.sort = null;
    zeichnen();
  }
  function navZustand() {
    Object.entries(NAV).forEach(([key, { nm, kn, sel }]) => {
      const an = key === "kz" ? true : key === "q" ? S.quartalAchse : S.zeilen.includes(key);
      nm.classList.toggle("aus", !an);
      nm.textContent = key === "kz" || key === "q" ? { kz: "Kennzahlen", q: "Quartal" }[key] : DIMS[key].name;
      if (kn) [...kn.querySelectorAll("button")].forEach((b, i) => b.setAttribute("aria-pressed", String(i === 0 ? an : !an)));
      const f = S.filter[key];
      sel.value = f === null ? "alle" : String(f);
      sel.classList.toggle("gefiltert", f !== null);
    });
  }

  /* ---------- Ergebnistabelle ---------- */
  function tabelle(Z) {
    bTab.textContent = "";
    const { out, sp } = Z, dims = S.zeilen;
    const kopfLab = [...dims.map(d => DIMS[d].name), "Kennzahl"];
    const spName = s => (s === "ges" ? "Gesamt" : QN[s]);
    // Kopf der Merkmalsspalten darf umbrechen (z. B. „Vertriebs-beauftragter“): Breite aus dem längsten Wortteil
    const kopfBreite = name => Math.max(...name.replace("Vertriebsbeauftragter", "Vertriebs- beauftragter").split(" ").map(w => tw(w)));
    const wLab = dims.map((d, i) => Math.ceil(Math.max(kopfBreite(DIMS[d].name), ...out.map(z => (z.typ !== "gesamt" && z.labels[i] && z.labels[i].text ?
      tw(z.labels[i].text, 14, z.typ !== "zeile" || !!z.labels[i].pfad) + (z.labels[i].klapp ? 14 : 0) : 0)))) + 16);
    const wKz = Math.ceil(Math.max(tw("Kennzahl"), ...kzListe().map(k => tw(k.name, 14, true)))) + 16;
    const wW = sp.map(s => Math.max(62, Math.ceil(Math.max(tw(spName(s)), ...out.map(z => tw(fmtWert(z, sp.indexOf(s)), 14, true)))) + 18));
    const summe = wLab.reduce((a, b) => a + b, 0) + wKz + wW.reduce((a, b) => a + b, 0);
    const frei = Math.max(0, 716 - summe);
    const W = [...wLab.map(w => w + frei * 0.5 / Math.max(1, wLab.length + 1)), wKz + frei * 0.5 / Math.max(1, wLab.length + 1),
               ...wW.map(w => w + frei * 0.5 / wW.length)];
    if (!dims.length) W[0] += frei * 0.5;
    const t = el("table", { class: "dk-matrix bw", style: `width:${Math.max(716, summe)}px` }, bTab);
    const cg = el("colgroup", {}, t);
    W.forEach(w => el("col", { style: `width:${w}px` }, cg));
    const hr = el("tr", {}, el("thead", {}, t));
    kopfLab.forEach((h, i) => {
      const th = el("th", { style: "text-align:left;white-space:normal", id: i === kopfLab.length - 1 ? "bw-kopf-kz" : "bw-kopf-" + i }, hr,
                    h === "Vertriebsbeauftragter" ? "Vertriebs" + String.fromCharCode(0xAD) + "beauftragter" : h);
      if (i === 0 && !DK.PRINT) { th.classList.add("dk-sortierbar"); th.title = "Klick: ursprüngliche Reihenfolge"; th.addEventListener("click", () => { S.sort = null; zeichnen(); }); }
    });
    sp.forEach(s => {
      const th = el("th", { id: "bw-kopf-" + s }, hr, spName(s));
      if (DK.PRINT) return;
      th.classList.add("dk-sortierbar"); th.title = "Klick sortiert die Gruppen nach Erlös";
      th.addEventListener("click", () => { S.sort = S.sort && S.sort.sp === s ? { sp: s, ab: !S.sort.ab } : { sp: s, ab: true }; zeichnen(); });
      if (S.sort && S.sort.sp === s) th.appendChild(document.createTextNode(S.sort.ab ? " ▾" : " ▴"));
    });
    const tb = el("tbody", {}, t);
    out.forEach((z, zi) => {
      const cls = [z.typ === "gesamt" ? "dk-summe" : "dk-zeile"];
      if (z.typ === "erg") cls.push("bw-erg");
      if (z.typ === "gesamt" && z.erste) cls.push("bw-gesamtkopf");
      if (z.erste && zi > 0 && z.typ !== "gesamt" && z.labels[0] && z.labels[0].text) cls.push("bw-gruppe");
      else if (z.erste && z.typ === "erg") cls.push("bw-ergkopf");
      if (z.typ !== "gesamt" && S.sel !== null && !unter(z.pfad, S.sel)) cls.push("dk-blass");
      const tr = el("tr", { class: cls.filter(Boolean).join(" ") }, tb);
      z.labels.forEach((l, i) => {
        const td = el("td", { class: "bw-lab", "data-ebene": i }, tr);
        if (!l) return;
        if (l.klapp && !DK.PRINT) {
          const pf = el("span", { class: "bw-pfeil", title: "Klick klappt zu oder auf" }, td, S.zu.has(l.pfad.slice(1)) ? "▸" : "▾");
          pf.addEventListener("click", ev => { ev.stopPropagation(); const k = l.pfad.slice(1); if (S.zu.has(k)) S.zu.delete(k); else S.zu.add(k); zeichnen(); });
        } else if (l.klapp && DK.PRINT) el("span", { class: "bw-pfeil" }, td, S.zu.has(l.pfad.slice(1)) ? "▸" : "▾");
        td.appendChild(document.createTextNode(l.text));
        if (z.typ === "gesamt") td.style.overflow = "visible";            // „Gesamtergebnis“ darf in die leere Nachbarspalte ragen
        if (l.pfad && z.typ !== "gesamt") td.style.fontWeight = "bold";
      });
      el("td", { class: "bw-kz" }, tr, z.kz.name);
      z.werte.forEach((v, j) => el("td", { "data-j": j, class: v === null ? "bw-leer" : "" }, tr, fmtWert(z, j)));
      if (z.typ !== "gesamt") tr.addEventListener("click", ev => {
        const td = ev.target.closest("td"), e = td && td.dataset.ebene !== undefined ? +td.dataset.ebene : null;
        // Klick in eine Merkmalsspalte wählt die Gruppe dieser Ebene, sonst die innerste Gruppe der Zeile
        let p = z.pfad;
        if (e !== null) p = z.pfad.split("/").slice(0, e + 2).join("/");
        S.sel = S.sel === p ? null : p;
        zeichnen();
      });
      tooltip(tr, ev => {
        const td = ev.target.closest ? ev.target.closest("td") : null, j = td && td.dataset.j !== undefined ? +td.dataset.j : sp.length - 1;
        const s = sp[j], v = z.werte[j];
        const wer = z.typ === "gesamt" ? "Gesamtergebnis" : pfadName(z.pfad) + (z.typ === "erg" ? " (Ergebnis)" : "");
        const zeilen = [`${wer} · ${s === "ges" ? "Gesamtjahr " + D.jahr : QLANG(s)}`];
        if (v === null) { zeilen.push(`${z.kz.lang}: kein Wert („–“)`); return zeilen; }
        zeilen.push(`${z.kz.name === "DB I" ? "Deckungsbeitrag I" : z.kz.name}: ${z.kz.exakt(v)}`);
        if (s !== "ges" && s > 0) { const vq = wert(z.rs, z.kz.key, s - 1); if (vq) zeilen.push(`Vorquartal ${z.kz.exakt(vq)} · ΔVQ ${delta((v / vq - 1) * 100, 1, NBSP + "%")}`); }
        const e = wert(z.rs, "e", s), d = wert(z.rs, "d", s);
        if (e && d !== null) zeilen.push(`DB-I-Quote ${pz(d, e, 1)} des Erlöses`);
        const fl = filterText();
        if (fl) zeilen.push("Filter: " + fl);
        if (z.typ !== "gesamt") zeilen.push("Klick hebt die Gruppe hervor, Esc hebt auf");
        return zeilen;
      });
    });
  }
  const fmtWert = (z, j) => (z.werte[j] === null || z.werte[j] === undefined ? "–" : z.kz.fmt(z.werte[j]));
  const filterText = () => [...Object.keys(DIMS), "q", "kz"].filter(k => S.filter[k] !== null)
    .map(k => k === "q" ? `Quartal ${QN[S.filter.q]}` : k === "kz" ? KZ[S.filter.kz].lang : `${DIMS[k].name} ${DIMS[k].mitglieder[S.filter[k]]}`).join("; ");

  /* ---------- Botschaft ---------- */
  function botschaft(Z) {
    const rs = S.sel ? Z.rs.filter(r => S.sel.split("/").filter(Boolean).every(x => { const [d, m] = x.split(":"); return r[d] === +m; })) : Z.rs;
    const wer = S.sel ? pfadName(S.sel) + ": " : "";
    const qs = Z.sp.filter(s => s !== "ges");
    const e = s => wert(rs, "e", s), d = s => wert(rs, "d", s);
    const B = 712;
    if (qs.length >= 2) {
      const a = qs[qs.length - 2], b = qs[qs.length - 1], ea = e(a), eb = e(b);
      if (ea && eb !== null) {
        const dq = (eb / ea - 1) * 100, qa = d(a) / ea, qb = d(b) / eb;
        const richtung = dq < 0 ? `${zahl(-dq, 0)} % unter` : `${zahl(dq, 0)} % über`;
        return passt([`${wer}Erlös im ${QLANG(b).split(" ").slice(0, 2).join(" ")} ${richtung} dem Vorquartal, DB-I-Quote von ${pz(qa * ea, ea)} auf ${pz(qb * eb, eb)} ${qb < qa ? "gesunken" : "gestiegen"}`,
          `${wer}Erlös ${QN[b].slice(0, 2)} ${richtung} ${QN[a].slice(0, 2)}, DB-I-Quote ${pz(qa * ea, ea)} → ${pz(qb * eb, eb)}`,
          `${wer}Erlös ${QN[b].slice(0, 2)} ${richtung} ${QN[a].slice(0, 2)}`], B);
      }
    }
    const eg = e("ges"), dg = d("ges");
    return eg ? passt([`${wer}Erlös ${D.jahr} ${zahl(eg / 1000, 1)} Tsd. €, DB-I-Quote ${pz(dg, eg)}`, `${wer}Erlös ${zahl(eg / 1000, 1)} Tsd. €`], B)
      : `${wer}keine Werte für diese Auswahl`;
  }

  /* ---------- Zeichnen ---------- */
  function zeichnen() {
    navZustand();
    const Z = zeilenBauen();
    DK.visual(bTitel, { titel: "Vertriebsbeauftragte im Quartalsvergleich", einheit: "Absatz in Stück, Erlös und DB I in Tsd. €", botschaft: botschaft(Z) });
    tabelle(Z);
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  /* ---------- Lernplattform ---------- */
  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "nv-merkmale", anker: "links", versatz: [222, -2], regel: "STRUCTURE – Navigation neben der Tabelle", titel: "Navigationsbereich mit Aufriss und Filter",
        text: "Wie im Original steht der Bericht als Tabelle mit einem Navigationsbereich: feste Filter (Verkaufsorganisation, Geschäftsjahr) und freie Merkmale. Je Merkmal zeigt der gedrückte Knopf, ob es im Aufriss steht (im Original schraffiert), die Auswahlliste filtert. Probieren Sie z. B. Branche → „Zeilen“ oder Warengruppe als Filter." },
      { nr: 2, ziel: "v-titel", anker: "links", versatz: [600, 22], regel: "SAY – Botschaft vermitteln", titel: "Aussage über der Tabelle",
        text: "Über der Tabelle steht, was der Quartalsvergleich zeigt: Der Erlös fällt im 4. Quartal deutlich unter das Vorquartal, und die DB-I-Quote sinkt. Der Satz rechnet bei jedem Aufriss, Filter und jeder hervorgehobenen Gruppe neu. Das Original hatte nur den Berichtsnamen." },
      { nr: 3, ziel: "v-titel", anker: "links", versatz: [690, 0], regel: "SIMPLIFY – Einheit einmal", titel: "Einheiten im Titel statt an jeder Zahl",
        text: "Das Original schrieb die Einheit an jede Zahl („443.419 EUR“, „2.716 ST“, „4.240 KAR“). Jetzt stehen die Einheiten einmal im Titel; Erlös und Deckungsbeitrag I in Tsd. € mit einer Nachkommastelle, die genauen Euro-Werte im Tooltip. Die Mengeneinheiten Stück und Karton sind einheitlich als Stück geführt." },
      { nr: 4, ziel: "bw-kopf-kz", anker: "links", versatz: [-4, -4], regel: "UNIFY – Begriffe ausschreiben", titel: "Lesbare Spaltenköpfe",
        text: "Technische Feldnamen und Codes sind ersetzt: „VertrBeauftragter“ → Vertriebsbeauftragter, „KalJahr/Quartal“ mit „19991“ → Q1 2026, „Gesamtergebnis“ als Spalte → Gesamt. „DB I“ steht für Deckungsbeitrag I (ausgeschrieben im Tooltip und in der Auswahlliste)." },
      { nr: 5, ziel: "v-tabelle", anker: "links", versatz: [76, 170], regel: "EXPRESS – Hervorheben ohne Farbflächen", titel: "Ergebnisse fett statt gelb",
        text: "Ergebniszeilen sind fett und durch Linien abgesetzt; Gruppen beginnen mit einer grauen Linie. Das Original hob sie mit gelbem Hintergrund und orangefarbener Schrift hervor und färbte Kopfbereich und Ränder blau und grau." },
      { nr: 6, ziel: "v-tabelle", anker: "links", versatz: [150, 300], regel: "CONDENSE – Auf- und Zuklappen", titel: "Gruppen zuklappbar",
        text: "Jede Gruppe lässt sich mit ▾/▸ zu- und aufklappen; zugeklappt bleiben nur ihre Ergebniszeilen. Herr Vogt ist im Startzustand zugeklappt, damit der Bericht vollständig auf eine Seite passt – das Original war unten abgeschnitten." },
      { nr: 7, ziel: "bw-kopf-ges", versatz: [0, 0], regel: "CHECK – Werte des Originals", titel: "Summen aus den Zeilen",
        text: "Absatz, Erlös und Deckungsbeitrag I je Kunde und Quartal sind die Werte des Originals; nur der abgeschnittene Deckungsbeitrag des letzten Kunden ist ergänzt. Ergebnisse und die Spalte Gesamt werden aus den Kundenzeilen gerechnet; im Original wichen einzelne Ergebnisse um 1 € davon ab (verdeckte Nachkommastellen)." },
      { nr: 8, ziel: "nv-fest", anker: "links", versatz: [196, -30], regel: "SIMPLIFY – Softwareneutral", titel: "Ohne Programmrahmen",
        text: "Menüleiste, Spalten- und Zeilenköpfe der Tabellenkalkulation, Herstellerlogo und das Fenster „Ganzer Bildschirm“ entfallen; Kunden und Vertriebsbeauftragte tragen neutrale Namen. Die Anbindung an das Data Warehouse erkennt man am Navigationsbereich: Aufriss und Filter fragen die Daten neu ab." },
    ],
    nachbauIntro: "Seitengröße benutzerdefiniert 1024 × 646 px, Schrift Arial: Tabelle 10,5 pt, Titel 12 pt. Datenmodell: Faktentabelle Vertrieb (Quartal, Vertriebsbeauftragter, Kunde, Branche, Warengruppe, Absatz, Erlös, Deckungsbeitrag I) wie in der CSV-Datei. " +
      "Die Anbindung an die Tabellenkalkulation entspricht „In Excel analysieren“: Das veröffentlichte Semantikmodell wird als Pivottabelle mit Feldliste geöffnet; Aufriss und Filter fragen das Modell neu ab.",
    nachbau: [
      { id: "A", ziel: "v-tabelle", anker: "links", versatz: [76, 120], titel: "Ergebnistabelle", visual: "Matrix",
        felder: "Zeilen: Vertriebsbeauftragter, Kunde; Spalten: Quartal; Werte: Absatz, Erlös (Tsd. €), Deckungsbeitrag I (Tsd. €)",
        format: "Werte › Optionen › „In Zeilen umschalten“ (Kennzahlen in den Zeilen); Layout „Tabellarisch“ (Zeilenköpfe in eigenen Spalten); Zeilenteilsummen ein, Bezeichnung „Ergebnis“, fett; +/–-Symbole ein; Spaltengesamtsumme „Gesamt“",
        hinweis: "Erlös und Deckungsbeitrag als Measures DIVIDE(SUM(…); 1000) mit einer Dezimalstelle; Tooltip mit den genauen Euro-Werten." },
      { id: "B", ziel: "nv-merkmale", anker: "links", versatz: [222, -2], titel: "Navigationsbereich", visual: "Datenschnitte (Dropdown) bzw. Filterbereich, dazu „Visuals personalisieren“",
        felder: "Filter: Verkaufsorganisation, Geschäftsjahr (Seitenfilter, gesperrt); Vertriebsbeauftragter, Kunde, Kennzahlen (Feldparameter), Quartal, Branche, Warengruppe",
        hinweis: "Den Aufriss (Merkmal in die Zeilen nehmen oder entfernen) bieten im Lesemodus „Visuals personalisieren“ oder ein Feldparameter für die Zeilen der Matrix." },
    ],
    theme: DK.thema(),
    csv: { name: "vertrieb_quartalsvergleich.csv", text: () =>
      ["Verkaufsorganisation;Quartal;Vertriebsbeauftragter;Kunde;Branche;Warengruppe;Absatz_Stueck;Erloes_EUR;Deckungsbeitrag_I_EUR",
       ...R.map(r => [D.vkorg, QN[r.q], DIMS.vb.mitglieder[r.vb], DIMS.kunde.mitglieder[r.kunde], DIMS.branche.mitglieder[r.branche],
                      DIMS.wg.mitglieder[r.wg], r.a, r.e, r.d].join(";"))].join("\r\n") },
    tabellen: () => {
      const Z = zeilenBauen(), sp = Z.sp, fl = filterText();
      return [{ titel: `Ergebnistabelle (Absatz in Stück, Erlös und DB I in €)${fl ? " – Filter: " + fl : ""}`,
        kopf: ["Gruppe", "Kennzahl", ...sp.map(s => (s === "ges" ? "Gesamt" : QN[s]))],
        zeilen: Z.out.map(z => [z.typ === "gesamt" ? "Gesamtergebnis" : pfadName(z.pfad) + (z.typ === "erg" ? " (Ergebnis)" : ""), z.kz.name,
                                ...z.werte.map(v => (v === null ? "–" : zahl(v)))]) }];
    },
  });
  zeichnen();
})();
