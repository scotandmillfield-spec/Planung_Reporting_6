/* Visual „Pivottabelle“ (Abb. 3.32) – softwareneutraler Nachbau einer Pivottabelle mit bedienbarer Feldliste.
   Seite 1024 x 460 px = 155 x 69,6 mm (Querformat wegen der Feldliste neben der Tabelle).
   Daten: pivot.json (daten_pivot.py) – Einzelsätze Material × Verkaufsorganisation × Vertriebsweg × Jahr mit Absatz und
   Umsatz in Cent. Standardzustand wie im Original: Filter Jahr (2026 und 2027), Material, Vertriebsweg; Spalten
   Verkaufsorganisation; Zeilen Produktgruppe; Werte Summe von Umsatz – alle angezeigten Zahlen = Original.
   Bedienung: Felder in der Feldliste ankreuzen oder in die Bereiche Filter, Spalten, Zeilen, Werte ziehen; Klick auf ein
   Feld im Bereich öffnet ein Menü (verschieben, Reihenfolge, entfernen). Mehrere Zeilen- bzw. Spaltenfelder ergeben eine
   Hierarchie mit Teilsummen (Zeilen auf- und zuklappbar). Klick auf eine Zelle hebt Zeile und Spalte hervor, Esc hebt auf,
   Klick auf einen Spaltenkopf sortiert, Tooltip mit Anteilen. Eigene Hilfsfunktionen (Tabelle mit Mehrfachkopf,
   Feldliste mit Drag & Drop) liegen lokal in dieser Datei. */
(() => {
  "use strict";
  const { zahl, NBSP, el } = DK;
  const D = DATA;
  const R = D.saetze.map(([m, vo, weg, jahr, absatz, cent]) => ({ m, g: D.materialien[m][1], vo, weg, jahr, absatz, cent }));
  const FELDER = {
    gruppe: { name: "Produktgruppe", dim: true, mitglieder: D.gruppen, idx: r => r.g, stark: "die stärkste Produktgruppe" },
    material: { name: "Material", dim: true, mitglieder: D.materialien.map(m => m[0]), idx: r => r.m, stark: "das stärkste Material" },
    vo: { name: "Verkaufsorganisation", dim: true, mitglieder: D.vos, idx: r => r.vo, stark: "die stärkste Verkaufsorganisation" },
    weg: { name: "Vertriebsweg", dim: true, mitglieder: D.wege, idx: r => r.weg, stark: "der stärkste Vertriebsweg" },
    jahr: { name: "Jahr", dim: true, mitglieder: D.jahre.map(String), idx: r => r.jahr, stark: "das stärkste Jahr" },
    absatz: { name: "Absatz", einheit: "Stück", wert: r => r.absatz, genitiv: "Absatzes", fmt: v => zahl(v) },
    umsatz: { name: "Umsatz", einheit: "€", wert: r => r.cent, genitiv: "Umsatzes", fmt: v => zahl(v / 100) },
  };
  const REIHENFOLGE = ["gruppe", "material", "vo", "weg", "jahr", "absatz", "umsatz"];
  const BEREICHE = [["filter", "Filter"], ["spalten", "Spalten"], ["zeilen", "Zeilen"], ["werte", "Werte"]];
  const pz = (a, b) => zahl(b ? a / b * 100 : 0, 0) + NBSP + "%";
  const und = l => (l.length < 2 ? l.join("") : l.slice(0, -1).join(", ") + " und " + l[l.length - 1]);

  /* ---------- Zustand (Standard = Original) ---------- */
  const START = () => ({ filter: ["jahr", "material", "weg"], spalten: ["vo"], zeilen: ["gruppe"], werte: ["umsatz"] });
  const S = { b: START(), fw: { jahr: D.filter_jahr.slice() }, zu: new Set(), sel: { z: null, s: null }, sort: null, menue: null };
  const bereichVon = key => BEREICHE.map(b => b[0]).find(b => S.b[b].includes(key)) || null;
  const keineAuswahl = () => S.sel.z == null && S.sel.s == null;
  function waehlen(z, s) {
    S.sel = S.sel.z === z && S.sel.s === s ? { z: null, s: null } : { z, s };
    zeichnen();
  }
  addEventListener("keydown", e => {
    if (e.key !== "Escape") return;
    if (S.menue) { menueZu(); return; }
    if (!keineAuswahl()) { S.sel = { z: null, s: null }; zeichnen(); }
  });

  /* ---------- Layout ---------- */
  DK.init({ titel: "Pivottabelle", breite: 1024, hoehe: 460 });
  const bTitel = DK.box("v-titel", 16, 8, 648, 46);
  const bFilter = DK.box("filter", 16, 60, 648, 50, "dk-filter");
  DK.haarlinie(116, 16, 360);
  const bTab = DK.box("v-tabelle", 16, 124, 648, 326);
  DK.el("div", { style: "position:absolute;left:674px;top:8px;width:0;height:444px;border-left:1px solid var(--linie)" }, document.getElementById("seite"));
  const bFeld = DK.box("feldliste", 684, 8, 324, 444);
  DK.el("style", {}, document.head, `
    #v-tabelle { overflow: ${DK.PRINT ? "hidden" : "auto"}; }
    .pv { table-layout: fixed; }
    .pv td { height: 24px; overflow: hidden; text-overflow: ellipsis; }
    .pv th { height: 22px; vertical-align: bottom; overflow: hidden; text-overflow: ellipsis; }
    .pv tr.pv-oben th { border-bottom: none; padding-bottom: 7px; }
    .pv tr.pv-oben th.pv-unten { border-bottom: 1px solid var(--ac); padding-bottom: 4px; }
    .pv th.pv-gruppe { position: relative; text-align: center; color: var(--text); }
    .pv th.pv-gruppe::after { content: ""; position: absolute; left: 8px; right: 8px; bottom: 2px; border-bottom: 1px solid #9A9A9A; }
    .pv th.pv-feldname { text-align: center; color: var(--muted); }
    .pv th.pv-ecke { text-align: left; color: var(--muted); }
    .pv th.pv-aktiv { color: var(--text); font-weight: bold; }
    .pv td.pv-teil { font-weight: bold; }
    .pv tr.dk-summe { cursor: pointer; }
    .pv .pv-pfeil { display: inline-block; width: 14px; color: var(--muted); cursor: pointer; }
    .pv td.pv-leer { color: var(--muted); }
    .pv-hinweis { color: var(--muted); font-size: 14px; padding-top: 8px; }
    #feldliste { font-size: 14px; }
    .pv-kopf { font-size: 16px; font-weight: bold; }
    .pv-unterkopf { color: var(--muted); margin: 2px 0 8px; }
    .pv-feld { display: flex; align-items: center; gap: 8px; height: 22px; cursor: pointer; user-select: none; }
    .pv-feld:hover { background: var(--flaeche); }
    .pv-box { width: 14px; height: 14px; border: 1px solid #6E747A; border-radius: 2px; display: inline-flex;
      align-items: center; justify-content: center; font-size: 12px; line-height: 1; color: #FFFFFF; flex: none; }
    .pv-feld.an .pv-box { background: var(--ac); border-color: var(--ac); }
    .pv-feld.an .pv-name { font-weight: bold; }
    .pv-feld .pv-neben { margin-left: auto; color: var(--muted); }
    .pv-bereiche { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px; }
    .pv-bereich { border: 1px solid var(--linie); border-radius: 3px; padding: 5px 6px; height: 108px; overflow: hidden; }
    .pv-bereich.pv-ziel { border-color: var(--ac); background: var(--flaeche); }
    .pv-bereich-titel { color: var(--muted); margin-bottom: 4px; }
    .pv-chip { display: flex; align-items: center; height: 24px; padding: 0 6px; margin-top: 3px; background: #FFFFFF;
      border: 1px solid #9A9A9A; border-radius: 3px; cursor: grab; white-space: nowrap; overflow: hidden; }
    .pv-chip span { overflow: hidden; text-overflow: ellipsis; }
    .pv-chip b { margin-left: auto; padding-left: 6px; font-weight: normal; color: var(--muted); }
    .pv-chip:focus { outline: 2px solid var(--ac); outline-offset: 1px; }
    .pv-menue { position: absolute; z-index: 15; background: #FFFFFF; border: 1px solid #9A9A9A; border-radius: 3px;
      box-shadow: 0 1px 4px rgba(0,0,0,.15); padding: 4px 0; font-size: 14px; min-width: 190px; }
    .pv-menue button { display: block; width: 100%; text-align: left; font: inherit; background: none; border: none;
      padding: 4px 12px; color: var(--text); cursor: pointer; }
    .pv-menue button:hover { background: var(--flaeche); }
    .pv-menue button:disabled { color: #A9A9A9; cursor: default; background: none; }`);

  /* ---------- lokaler Tooltip mit Ereignis ---------- */
  const tipEl = document.querySelector(".dk-tooltip");
  function tooltip(ziel, zeilenFn) {
    ziel.addEventListener("pointermove", ev => {
      const zeilen = zeilenFn(ev);
      if (!zeilen || !zeilen.length) { tipEl.style.display = "none"; return; }
      tipEl.textContent = "";
      zeilen.forEach((z, i) => el(i === 0 ? "b" : "div", {}, tipEl, z));
      tipEl.style.display = "block";
      const r = tipEl.getBoundingClientRect();
      let x = ev.clientX + 14, y = ev.clientY + 14;
      if (x + r.width > innerWidth - 8) x = ev.clientX - r.width - 14;
      if (y + r.height > innerHeight - 8) y = ev.clientY - r.height - 14;
      tipEl.style.left = x + "px"; tipEl.style.top = y + "px";
    });
    ziel.addEventListener("pointerleave", () => { tipEl.style.display = "none"; });
  }

  /* ---------- Pivot-Berechnung ---------- */
  const mass = () => S.b.werte[0] || null;
  const gefiltert = () => R.filter(r => S.b.filter.every(f => !S.fw[f] || S.fw[f].includes(FELDER[f].idx(r))));
  function aggregat() {
    const M = new Map(), f = mass() ? FELDER[mass()].wert : () => 0;
    const zf = S.b.zeilen, sf = S.b.spalten;
    gefiltert().forEach(r => {
      const zp = zf.map(k => FELDER[k].idx(r)), sp = sf.map(k => FELDER[k].idx(r)), v = f(r);
      for (let i = 0; i <= zp.length; i++)
        for (let j = 0; j <= sp.length; j++) {
          const key = zp.slice(0, i).join(",") + "|" + sp.slice(0, j).join(",");
          M.set(key, (M.get(key) || 0) + v);
        }
    });
    return M;
  }
  const pfad = (pre, m) => (pre === "" ? String(m) : pre + "," + m);
  const glied = (feldKeys, p) => (p === "" ? [] : p.split(",").map((m, i) => FELDER[feldKeys[i]].mitglieder[+m]));
  function kinder(M, pre, ebene, achse) {
    const feld = achse === "z" ? S.b.zeilen[ebene] : S.b.spalten[ebene];
    return FELDER[feld].mitglieder.map((_, m) => m)
      .filter(m => M.has(achse === "z" ? pfad(pre, m) + "|" : "|" + pfad(pre, m)));
  }
  function spaltenListe(M) {
    const n = S.b.spalten.length, out = [];
    const rek = (pre, e) => kinder(M, pre, e, "s").forEach(m => {
      const p = pfad(pre, m);
      if (e === n - 1) out.push({ p, typ: "blatt", tiefe: e + 1 });
      else { rek(p, e + 1); out.push({ p, typ: "teil", tiefe: e + 1 }); }
    });
    if (n) rek("", 0);
    out.push({ p: "", typ: "gesamt", tiefe: 0 });
    return out;
  }
  function zeilenListe(M) {
    const n = S.b.zeilen.length, out = [];
    const rek = (pre, e) => {
      let ms = kinder(M, pre, e, "z");
      if (S.sort) {
        const f = m => (S.sort.s === "__name" ? m : M.get(pfad(pre, m) + "|" + S.sort.s) ?? -Infinity);
        ms = ms.slice().sort((a, b) => { const c = f(a) - f(b); return (S.sort.ab ? -c : c) || a - b; });
      }
      ms.forEach(m => {
        const p = pfad(pre, m);
        out.push({ p, ebene: e, blatt: e === n - 1 });
        if (e < n - 1 && !S.zu.has(p)) rek(p, e + 1);
      });
    };
    if (n) rek("", 0);
    out.push({ p: "", ebene: -1, gesamt: true });
    return out;
  }
  const zName = p => (p === "" ? "Gesamt" : glied(S.b.zeilen, p).slice(-1)[0]);
  const sName = c => (c.typ === "gesamt" ? (S.b.spalten.length ? "Gesamt" : werteName()) :
    (c.typ === "teil" ? "Summe " : "") + glied(S.b.spalten, c.p).slice(-1)[0]);
  const werteName = () => (mass() ? "Summe von " + FELDER[mass()].name : "Werte");
  const fmt = v => (v == null ? "–" : FELDER[mass()].fmt(v));
  const unter = (p, auswahl) => auswahl != null && (p === auswahl || (auswahl !== "" && p.startsWith(auswahl + ",")));
  const sichtbar = (zp, sp) => keineAuswahl() || unter(zp, S.sel.z) || unter(sp, S.sel.s) ||
    (S.sel.z === "" && zp === "") || (S.sel.s === "" && sp === "");

  /* ---------- Botschaft ---------- */
  function botschaft(M) {
    if (!mass()) return "Kein Wertfeld – Umsatz oder Absatz in den Bereich „Werte“ ziehen";
    const F = FELDER[mass()], ges = M.get("|") || 0, e = F.einheit === "€" ? "€" : F.einheit;
    const v = (zp, sp) => M.get(zp + "|" + sp);
    const txt = (zp, sp) => `${F.fmt(v(zp, sp) || 0)} ${e}`;
    const { z, s } = S.sel;
    const zl = p => glied(S.b.zeilen, p).join(" › "), sl = p => glied(S.b.spalten, p).join(" › ");
    if (z && s) return `${zl(z)} × ${sl(s)}: ${txt(z, s)} – ${pz(v(z, s) || 0, v(z, ""))} der Zeile, ${pz(v(z, s) || 0, v("", s))} der Spalte`;
    if (z) {
      const sp = S.b.spalten.length ? kinder(M, "", 0, "s") : [];
      const top = sp.length ? sp.reduce((a, b) => ((v(z, String(b)) || 0) > (v(z, String(a)) || 0) ? b : a)) : null;
      return `${zl(z)}: ${txt(z, "")} (${pz(v(z, ""), ges)} des ${F.genitiv})` +
        (top != null ? `, davon ${pz(v(z, String(top)) || 0, v(z, ""))} in ${FELDER[S.b.spalten[0]].mitglieder[top]}` : "");
    }
    if (s) return `${sl(s)}: ${txt("", s)} (${pz(v("", s), ges)} des ${F.genitiv})`;
    const teile = [];
    if (S.b.zeilen.length) {
      const ms = kinder(M, "", 0, "z"), top = ms.reduce((a, b) => (v(String(b), "") > v(String(a), "") ? b : a));
      teile.push(`${FELDER[S.b.zeilen[0]].mitglieder[top]} trägt ${pz(v(String(top), ""), ges)} des ${F.genitiv}`);
    }
    if (S.b.spalten.length) {
      const ms = kinder(M, "", 0, "s"), top = ms.reduce((a, b) => (v("", String(b)) > v("", String(a)) ? b : a));
      teile.push(`${FELDER[S.b.spalten[0]].mitglieder[top]} ist mit ${pz(v("", String(top)), ges)} ${FELDER[S.b.spalten[0]].stark}`);
    }
    const lang = teile.length ? teile.join(", ") : `${F.name} gesamt ${txt("", "")}`;
    return DK.tw(lang) <= 640 ? lang : teile[0];
  }

  /* ---------- Tabelle mit Mehrfachkopf ---------- */
  function tabelle(M) {
    bTab.textContent = "";
    if (!mass()) { el("div", { class: "pv-hinweis" }, bTab, "Ziehen Sie Umsatz oder Absatz in den Bereich „Werte“."); return; }
    const sp = spaltenListe(M), zl = zeilenListe(M), n = S.b.spalten.length;
    const zFelder = S.b.zeilen.map(k => FELDER[k].name).join(" / ");
    // Breiten aus dem Inhalt
    const breiteZ = Math.max(DK.tw(zFelder || " ") + 18, ...zl.map(z => DK.tw(zName(z.p), 14, !z.blatt) + 16 * Math.max(0, z.ebene) + 30), 110);
    const breiten = sp.map(c => Math.max(DK.tw(sName(c), 14, c.typ !== "blatt") + 18,
      ...zl.map(z => DK.tw(fmt(M.get(z.p + "|" + c.p)), 14, true) + 18), 76));
    const summe = breiteZ + breiten.reduce((a, b) => a + b, 0), frei = 648 - summe;
    const W = frei > 0 ? [breiteZ + frei * 0.25, ...breiten.map(b => b + frei * 0.75 / breiten.length)] : [breiteZ, ...breiten];
    const t = el("table", { class: "dk-matrix pv", style: `width:${Math.max(648, summe)}px` }, bTab);
    const cg = el("colgroup", {}, t);
    W.forEach(b => el("col", { style: `width:${b}px` }, cg));
    const kopf = el("thead", {}, t);
    const sortKlick = (th, key) => {
      if (DK.PRINT) return;
      th.classList.add("dk-sortierbar"); th.title = "Klick sortiert";
      th.addEventListener("click", () => {
        S.sort = S.sort && S.sort.s === key ? { s: key, ab: !S.sort.ab } : { s: key, ab: key !== "__name" };
        zeichnen();
      });
      if (S.sort && S.sort.s === key) th.appendChild(document.createTextNode(S.sort.ab ? " ▾" : " ▴"));
    };
    // Kopfzeile 0: Wertname in der Ecke, Feldnamen der Spalten über allen Spalten außer „Gesamt“
    if (n) {
      const tr = el("tr", { class: "pv-oben" }, kopf);
      el("th", { class: "pv-ecke", id: "pv-wertname" }, tr, werteName());
      el("th", { class: "pv-feldname", colspan: sp.length - 1 }, tr, S.b.spalten.map(k => FELDER[k].name).join(" / "));
      el("th", {}, tr, "");
    }
    // Kopfzeilen je Spaltenebene
    for (let e = 0; e < Math.max(1, n); e++) {
      const letzte = e === Math.max(1, n) - 1;
      const tr = el("tr", { class: letzte ? "" : "pv-oben" }, kopf);
      const ecke = el("th", { class: letzte ? "" : "", id: letzte ? "pv-zeilenfelder" : null }, tr, letzte ? zFelder : (n ? "" : ""));
      if (!letzte) ecke.removeAttribute("id");
      if (letzte && zFelder) sortKlick(ecke, "__name");
      if (!n) { const th = el("th", { id: "pv-gesamt" }, tr, werteName()); sortKlick(th, ""); break; }
      let i = 0;
      while (i < sp.length) {
        const c = sp[i];
        const eigeneEbene = c.typ === "gesamt" ? 0 : c.tiefe - 1;
        if (c.typ !== "blatt" && eigeneEbene === e) {
          const th = el("th", { rowspan: n - e, class: (e < n - 1 ? "pv-unten " : "") + (S.sel.s === c.p ? "pv-aktiv" : ""),
                                id: c.typ === "gesamt" ? "pv-gesamt" : null }, tr, sName(c));
          if (c.typ !== "gesamt") th.removeAttribute("id");
          sortKlick(th, c.p);
          i++; continue;
        }
        if (c.typ !== "blatt" && eigeneEbene < e) { i++; continue; }
        // Gruppe gleicher Vorfahren auf Ebene e (ohne die eigene Teilsumme der Gruppe)
        const vorn = c.p.split(",").slice(0, e + 1).join(",");
        let j = i;
        while (j < sp.length && sp[j].typ !== "gesamt" && sp[j].p.split(",").slice(0, e + 1).join(",") === vorn &&
               !(sp[j].typ === "teil" && sp[j].tiefe - 1 === e)) j++;
        const th = el("th", { colspan: j - i, class: (e < n - 1 ? "pv-gruppe" : "") + (S.sel.s === vorn ? " pv-aktiv" : ""),
                              "data-p": vorn }, tr, glied(S.b.spalten, vorn).slice(-1)[0]);
        if (e === n - 1) sortKlick(th, vorn);
        i = j;
      }
    }
    // Zeilen
    const tb = el("tbody", {}, t);
    const spalteVon = ev => { const td = ev.target.closest ? ev.target.closest("td") : null; return td ? +td.dataset.j : null; };
    zl.forEach(z => {
      const tr = el("tr", { class: z.gesamt ? "dk-summe" : "dk-zeile" }, tb);
      const lab = el("td", { "data-j": 0, class: !z.blatt && !z.gesamt ? "pv-teil" : "",
                             style: `padding-left:${16 * Math.max(0, z.ebene)}px` }, tr);
      if (!z.gesamt && !z.blatt && !DK.PRINT) {
        const pf = el("span", { class: "pv-pfeil", title: "Klick klappt auf oder zu" }, lab, S.zu.has(z.p) ? "▸" : "▾");
        pf.addEventListener("click", ev => { ev.stopPropagation(); if (S.zu.has(z.p)) S.zu.delete(z.p); else S.zu.add(z.p); zeichnen(); });
      }
      lab.appendChild(document.createTextNode(zName(z.p)));
      if (!z.gesamt && !keineAuswahl() && !(S.sel.z == null || unter(z.p, S.sel.z))) lab.classList.add("dk-blass");
      sp.forEach((c, j) => {
        const v = M.get(z.p + "|" + c.p);
        const td = el("td", { "data-j": j + 1, class: (v == null ? "pv-leer " : "") + ((c.typ !== "blatt" || (!z.blatt && !z.gesamt)) ? "pv-teil" : "") }, tr, fmt(v));
        if (!sichtbar(z.p, c.p)) td.classList.add("dk-blass");
      });
      tr.addEventListener("click", ev => {
        const j = spalteVon(ev), c = j ? sp[j - 1] : null;
        if (z.gesamt) { if (c && c.typ !== "gesamt") waehlen(null, c.p); else if (!keineAuswahl()) waehlen(S.sel.z, S.sel.s); return; }
        waehlen(z.p, c && c.typ !== "gesamt" ? c.p : null);
      });
      tooltip(tr, ev => {
        const j = spalteVon(ev), c = j ? sp[j - 1] : sp[sp.length - 1], v = M.get(z.p + "|" + c.p);
        const F = FELDER[mass()], e = F.einheit;
        const zt = z.gesamt ? "alle Zeilen" : glied(S.b.zeilen, z.p).join(" › ");
        const st = c.typ === "gesamt" ? "alle Spalten" : glied(S.b.spalten, c.p).join(" › ");
        const t = [`${zt} · ${st}`];
        if (v == null) { t.push("Keine Datensätze für diese Kombination („–“)"); return t; }
        t.push(`${werteName()}: ${F.fmt(v)} ${e}`);
        t.push(`Anteil an der Zeile ${pz(v, M.get(z.p + "|"))} · an der Spalte ${pz(v, M.get("|" + c.p))} · gesamt ${pz(v, M.get("|"))}`);
        const fl = filterText();
        if (fl) t.push("Filter: " + fl);
        t.push("Klick hebt Zeile und Spalte hervor, Esc hebt auf");
        return t;
      });
    });
  }
  function filterText() {
    return S.b.filter.filter(f => S.fw[f]).map(f => `${FELDER[f].name} ${und(S.fw[f].map(i => FELDER[f].mitglieder[i]))}`).join("; ");
  }

  /* ---------- Berichtsfilter (Dropdowns) ---------- */
  function filterZeile() {
    bFilter.textContent = "";
    const fs = S.b.filter;
    if (!fs.length) { el("div", { class: "pv-hinweis", style: "align-self:center" }, bFilter, "Keine Berichtsfilter – Felder in den Bereich „Filter“ ziehen"); return; }
    const breite = Math.min(170, Math.floor((648 - 24 * (fs.length - 1)) / fs.length));
    fs.forEach(f => {
      const F = FELDER[f], aktuell = S.fw[f];
      const optionen = [["alle", "(Alle)"]];
      if (f === "jahr") optionen.push(["m:" + D.filter_jahr.join(","), und(D.filter_jahr.map(i => F.mitglieder[i]))]);
      F.mitglieder.forEach((m, i) => optionen.push(["m:" + i, m]));
      let wert = aktuell ? "m:" + aktuell.join(",") : "alle";
      if (!optionen.some(o => o[0] === wert)) { optionen.splice(1, 0, [wert, "(Mehrere Elemente)"]); }
      const sel = DK.schnitt(bFilter, F.name, "dropdown", { breite, optionen, wert,
        onChange: v => { S.fw[f] = v === "alle" ? null : v.slice(2).split(",").map(Number); S.sel = { z: null, s: null }; zeichnen(); } });
      sel.id = "pv-filter-" + f;
    });
  }

  /* ---------- Feldliste mit Bereichen ---------- */
  let ziehen = null;
  function verschieben(key, ziel, vor) {
    const istMass = !FELDER[key].dim;
    if (ziel && (ziel === "werte") !== istMass) return;            // Kennzahlen nur in „Werte“, Dimensionen nicht
    BEREICHE.forEach(([b]) => { S.b[b] = S.b[b].filter(k => k !== key); });
    if (ziel) {
      if (ziel === "werte") S.b.werte = [];
      const liste = S.b[ziel], i = vor != null ? liste.indexOf(vor) : -1;
      if (i >= 0) liste.splice(i, 0, key); else liste.push(key);
    }
    S.sel = { z: null, s: null }; S.sort = null; S.zu.clear();
    menueZu(false);
    zeichnen();
  }
  function menueZu(neu = true) {
    if (S.menue) { S.menue.remove(); S.menue = null; }
    if (neu === undefined) zeichnen();
  }
  function menueAuf(chip, key) {
    menueZu(false);
    const seite = document.getElementById("seite"), sr = seite.getBoundingClientRect(), r = chip.getBoundingClientRect();
    const sk = sr.width / 1024;
    const m = el("div", { class: "pv-menue", role: "menu" }, seite);
    const hier = bereichVon(key), liste = S.b[hier], i = liste.indexOf(key);
    const punkt = (text, fn, aus) => { const b = el("button", { type: "button", role: "menuitem" }, m, text); if (aus) b.disabled = true; else b.addEventListener("click", fn); };
    if (FELDER[key].dim) {
      BEREICHE.filter(([b]) => b !== "werte" && b !== hier).forEach(([b, name]) => punkt(`In „${name}“ verschieben`, () => verschieben(key, b)));
      punkt("Nach oben", () => { liste.splice(i, 1); liste.splice(i - 1, 0, key); menueZu(false); S.sel = { z: null, s: null }; S.zu.clear(); zeichnen(); }, i === 0);
      punkt("Nach unten", () => { liste.splice(i, 1); liste.splice(i + 1, 0, key); menueZu(false); S.sel = { z: null, s: null }; S.zu.clear(); zeichnen(); }, i === liste.length - 1);
    } else {
      const ander = key === "umsatz" ? "absatz" : "umsatz";
      punkt(`Durch „${FELDER[ander].name}“ ersetzen`, () => verschieben(ander, "werte"));
    }
    punkt("Feld entfernen", () => verschieben(key, null));
    const x = Math.min((r.left - sr.left) / sk, 1024 - 200), y = (r.bottom - sr.top) / sk + 2;
    m.style.left = x + "px";
    m.style.top = Math.min(y, 460 - m.offsetHeight - 4) + "px";
    S.menue = m;
    const zu = ev => { if (!m.contains(ev.target) && ev.target !== chip) { menueZu(false); document.removeEventListener("pointerdown", zu, true); } };
    document.addEventListener("pointerdown", zu, true);
  }
  function feldliste() {
    bFeld.textContent = "";
    el("div", { class: "pv-kopf" }, bFeld, "Feldliste");
    el("div", { class: "pv-unterkopf" }, bFeld, "Felder ankreuzen oder in einen Bereich ziehen");
    const liste = el("div", { id: "pv-felder" }, bFeld);
    REIHENFOLGE.forEach(key => {
      const F = FELDER[key], an = bereichVon(key) != null;
      const d = el("div", { class: "pv-feld" + (an ? " an" : ""), draggable: DK.PRINT ? "false" : "true", id: "pv-feld-" + key }, liste);
      el("span", { class: "pv-box" }, d, an ? "✓" : "");
      el("span", { class: "pv-name" }, d, F.name + (F.einheit ? ` (${F.einheit})` : ""));
      if (S.fw[key] && S.b.filter.includes(key)) el("span", { class: "pv-neben" }, d, "gefiltert");
      if (DK.PRINT) return;
      d.addEventListener("click", () => verschieben(key, an ? null : F.dim ? "zeilen" : "werte"));
      d.addEventListener("dragstart", ev => { ziehen = key; ev.dataTransfer.setData("text/plain", key); ev.dataTransfer.effectAllowed = "move"; });
    });
    if (!DK.PRINT) {
      liste.addEventListener("dragover", ev => { if (ziehen) ev.preventDefault(); });
      liste.addEventListener("drop", ev => { ev.preventDefault(); if (ziehen && bereichVon(ziehen)) verschieben(ziehen, null); ziehen = null; });
    }
    const raster = el("div", { class: "pv-bereiche" }, bFeld);
    BEREICHE.forEach(([b, name]) => {
      const z = el("div", { class: "pv-bereich", id: "pv-bereich-" + b }, raster);
      el("div", { class: "pv-bereich-titel" }, z, b === "werte" ? "Σ Werte" : name);
      S.b[b].forEach(key => {
        const F = FELDER[key];
        const chip = el("div", { class: "pv-chip", draggable: DK.PRINT ? "false" : "true", tabindex: "0", "data-feld": key,
                                 title: "Ziehen oder klicken" }, z);
        el("span", {}, chip, b === "werte" ? "Summe von " + F.name : F.name);
        if (!DK.PRINT) {
          el("b", {}, chip, "▾");
          chip.addEventListener("click", ev => { ev.stopPropagation(); if (S.menue) menueZu(false); else menueAuf(chip, key); });
          chip.addEventListener("keydown", ev => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); menueAuf(chip, key); } });
          chip.addEventListener("dragstart", ev => { ziehen = key; ev.dataTransfer.setData("text/plain", key); ev.dataTransfer.effectAllowed = "move"; menueZu(false); });
          chip.addEventListener("drop", ev => { ev.preventDefault(); ev.stopPropagation(); z.classList.remove("pv-ziel");
            if (ziehen && ziehen !== key) verschieben(ziehen, b, key); ziehen = null; });
        }
      });
      if (DK.PRINT) return;
      z.addEventListener("dragover", ev => { if (ziehen && (b === "werte") === !FELDER[ziehen].dim) { ev.preventDefault(); z.classList.add("pv-ziel"); } });
      z.addEventListener("dragleave", () => z.classList.remove("pv-ziel"));
      z.addEventListener("drop", ev => { ev.preventDefault(); z.classList.remove("pv-ziel"); if (ziehen) verschieben(ziehen, b); ziehen = null; });
    });
  }

  /* ---------- Zeichnen ---------- */
  function zeichnen() {
    const M = aggregat();
    const F = mass() ? FELDER[mass()] : null;
    const titel = F ? F.name + (S.b.zeilen.length || S.b.spalten.length ? " nach " + und([...S.b.zeilen, ...S.b.spalten].map(k => FELDER[k].name)) : "") : "Pivottabelle";
    DK.visual(bTitel, { titel, einheit: F ? F.einheit : "", botschaft: botschaft(M) });
    filterZeile();
    tabelle(M);
    feldliste();
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  /* ---------- Lernplattform: Designregeln, Nachbau, Tabellen, CSV ---------- */
  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "pv-bereich-filter", anker: "links", versatz: [6, 0], regel: "STRUCTURE – Inhalte ordnen", titel: "Vier Bereiche bestimmen die Tabelle",
        text: "Wie im Original legt die Feldliste fest, was die Tabelle zeigt: Felder im Bereich Filter schränken die Daten ein, Spalten- und Zeilenfelder spannen die Kreuztabelle auf, das Feld unter Werte wird summiert. Ziehen Sie z. B. Material unter Produktgruppe in die Zeilen – es entsteht eine Hierarchie mit Teilsummen, die sich auf- und zuklappen lässt." },
      { nr: 2, ziel: "pv-felder", anker: "links", versatz: [222, -2], regel: "SIMPLIFY – Weglassen", titel: "Sieben statt sechzehn Felder",
        text: "Die Feldliste des Originals zeigte 16 Felder, darunter doppelte (Code und Text) und für das Beispiel unnötige wie Mengeneinheit, Währung oder Rabatt. Übrig bleiben fünf Dimensionen und zwei Kennzahlen; ein Haken zeigt, ob ein Feld verwendet wird." },
      { nr: 3, ziel: "v-titel", anker: "links", versatz: [446, 0], regel: "SIMPLIFY – Einheit einmal", titel: "Einheit im Titel statt an jeder Zahl",
        text: "Das Original setzte „€“ hinter jede Zahl und nannte die Summen „Gesamtergebnis“. Jetzt steht die Einheit einmal im Titel, die Summen heißen „Gesamt“ und sind fett; der Titel benennt die gewählten Felder." },
      { nr: 4, ziel: "v-titel", anker: "links", versatz: [646, 22], regel: "SAY – Botschaft vermitteln", titel: "Aussage unter dem Titel",
        text: "Unter dem Titel steht in einem Satz, was die aktuelle Pivottabelle zeigt – hier den größten Anteil je Zeilen- und Spaltenfeld. Die Aussage rechnet bei jeder neuen Feldzuordnung, jedem Filter und jeder Auswahl neu." },
      { nr: 5, ziel: "v-tabelle", anker: "links", versatz: [130, 52], regel: "UNIFY – Softwareneutral und deutsch", titel: "Deutsche Feldnamen, keine Programmoberfläche",
        text: "Fensterrahmen, Menüband und Programmname entfallen. Feldnamen sind deutsch (Produktgruppe, Verkaufsorganisation, Vertriebsweg, Umsatz), die Codes GER1–GER3 heißen Nord, Mitte und Süd, die englischen Produktgruppen Citybike, Kinderrad, Mountainbike, Rennrad und Trekkingrad." },
      { nr: 6, ziel: "pv-gesamt", versatz: [-62, 2], regel: "CHECK – Werte des Originals", titel: "Rundung in den Summen",
        text: "Alle angezeigten Werte entsprechen dem Original. Die Zellen enthalten Cent-Beträge; deshalb ergibt z. B. Rennrad 4.291.450 + 3.325.792 + 5.044.376 = 12.661.618 €, angezeigt wird wie im Original 12.661.619 €. Summen werden stets aus den ungerundeten Werten gebildet." },
      { nr: 7, ziel: "filter", anker: "links", versatz: [560, 6], regel: "EXPRESS – Filter sichtbar machen", titel: "Berichtsfilter über der Tabelle",
        text: "Die Filter stehen als Auswahllisten über der Tabelle. Statt „(Mehrere Elemente)“ zeigt der Jahresfilter die gewählten Jahre „2026 und 2027“; in der Feldliste ist das Feld als „gefiltert“ markiert, der Tooltip nennt den Filter." },
      { nr: 8, ziel: "v-tabelle", anker: "links", versatz: [130, 100], regel: "EXPRESS – Hervorheben statt Farbe", titel: "Fadenkreuz und Sortierung",
        text: "Ein Klick auf eine Zelle hebt ihre Zeile und Spalte hervor, ein Klick auf eine Zeilenbeschriftung die Zeile samt Unterzeilen; Esc hebt auf. Ein Klick auf einen Spaltenkopf sortiert die Zeilen, ein zweiter Klick kehrt die Richtung um." },
    ],
    nachbauIntro: "Standard-Visuals von Power BI Desktop. Seitengröße benutzerdefiniert 1024 × 460 px. Schrift Arial: Matrix und Datenschnitte 10,5 pt, Visualtitel 12 pt. Datenmodell: Faktentabelle Verkauf (Jahr, Produktgruppe, Material, Verkaufsorganisation, Vertriebsweg, Absatz, Umsatz) wie in der CSV-Datei.",
    nachbau: [
      { id: "A", ziel: "v-tabelle", anker: "links", versatz: [130, 52], titel: "Pivottabelle", visual: "Matrix",
        felder: "Zeilen: Produktgruppe; Spalten: Verkaufsorganisation; Werte: Umsatz (Summe)",
        format: "Zeilen- und Spaltensummen an, Beschriftung „Gesamt“, fett; Layout „Kompakt“ mit +/–-Symbolen für mehrere Zeilenfelder; Werte ohne Dezimalstellen, Einheit im Titel; Spaltenkopf mit Unterstrich #3A3F44",
        hinweis: "Eine Feldliste für Leser bietet Power BI über „Visuals personalisieren“ (Berichtseinstellungen): Betrachter können dann Felder in Zeilen, Spalten und Werte tauschen, ohne den Bericht zu bearbeiten." },
      { id: "B", ziel: "filter", anker: "links", versatz: [560, 6], titel: "Berichtsfilter", visual: "Datenschnitt (3×) oder Filterbereich",
        felder: "Jahr, Material, Vertriebsweg; Jahr mit Mehrfachauswahl 2026 und 2027",
        format: "Dropdown, Kopfzeile 10,5 pt #4D4D4D; alternativ „Filter für diese Seite“ im Filterbereich (entspricht dem Berichtsfilter des Originals)" },
      { id: "C", ziel: "pv-bereich-filter", anker: "links", versatz: [6, 0], titel: "Feldliste", visual: "Bereich „Daten“ und Felder des Visuals",
        felder: "Beim Bearbeiten: Felder aus dem Bereich „Daten“ in die Felder Zeilen, Spalten und Werte des Visuals ziehen",
        hinweis: "Die Feldliste ist in Power BI kein Teil der Berichtsseite; im Lesemodus übernimmt „Visuals personalisieren“ diese Rolle." },
    ],
    theme: DK.thema(),
    csv: { name: "verkauf_pivot_daten.csv", text: () => {
      const de = c => `${Math.floor(c / 100)},${String(c % 100).padStart(2, "0")}`;
      return ["Jahr;Produktgruppe;Material;Verkaufsorganisation;Vertriebsweg;Absatz_Stueck;Umsatz_EUR",
        ...R.map(r => [D.jahre[r.jahr], D.gruppen[r.g], D.materialien[r.m][0], D.vos[r.vo], D.wege[r.weg], r.absatz, de(r.cent)].join(";"))].join("\r\n"); } },
    tabellen: () => {
      const M = aggregat();
      if (!mass()) return [{ titel: "Kein Wertfeld gewählt", kopf: [""], zeilen: [] }];
      const sp = spaltenListe(M);
      const zl = []; const n = S.b.zeilen.length;
      const rek = (pre, e) => kinder(M, pre, e, "z").forEach(m => { const p = pfad(pre, m); zl.push(p); if (e < n - 1) rek(p, e + 1); });
      if (n) rek("", 0);
      zl.push("");
      const F = FELDER[mass()], fl = filterText();
      return [{ titel: `${werteName()} (${F.einheit})${fl ? " – Filter: " + fl : ""}`,
        kopf: [S.b.zeilen.map(k => FELDER[k].name).join(" / ") || "", ...sp.map(c => c.typ === "gesamt" ? "Gesamt" : (c.typ === "teil" ? "Summe " : "") + glied(S.b.spalten, c.p).join(" › "))],
        zeilen: zl.map(p => [p === "" ? "Gesamt" : glied(S.b.zeilen, p).join(" › "), ...sp.map(c => fmt(M.get(p + "|" + c.p)))]) }];
    },
  });
  zeichnen();
})();
