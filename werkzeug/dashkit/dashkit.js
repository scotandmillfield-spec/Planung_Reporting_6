/* dashkit.js – Bausteine für die Buch-Dashboards (6. Auflage)
   Jeder Baustein entspricht einem Standard-Visual von Power BI.
   Seite: 1024 x 646 px. Parameter: ?print (Druckansicht ohne Leiste), ?gut=gruen (Farbvariante). */
const DK = (() => {
  "use strict";
  const NS = "http://www.w3.org/2000/svg";
  const Q = new URLSearchParams(location.search);
  const PRINT = Q.has("print");
  let SEITE_B = 1024, SEITE_H = 646;          // Dashboard; Einzelvisual: init({breite: 727, hoehe: …})
  if (Q.get("gut") === "gruen") document.body.dataset.gut = "gruen";
  if (PRINT) document.body.classList.add("print");

  /* ---------------- Format ---------------- */
  const NF = {};
  const nf = nk => NF[nk] || (NF[nk] = new Intl.NumberFormat("de-DE", { minimumFractionDigits: nk, maximumFractionDigits: nk }));
  const MINUS = "−", NBSP = String.fromCharCode(0xA0);
  function zahl(v, nk = 0) { return (v < 0 ? MINUS : "") + nf(nk).format(Math.abs(v)); }
  function delta(v, nk = 0, einheit = "") {
    const r = Number(v.toFixed(nk));
    const vz = r > 0 ? "+" : r < 0 ? MINUS : "±";
    return vz + nf(nk).format(Math.abs(r)) + einheit;
  }
  function prozent(v, nk = 1) { return zahl(v * 100, nk) + NBSP + "%"; }
  /* Wirkung: richtung +1 = Anstieg günstig, -1 = Anstieg ungünstig, 0 = neutral */
  function wirkung(d, richtung, nk = 1) {
    if (!richtung || Number(d.toFixed(nk)) === 0) return "neutral";
    return d * richtung > 0 ? "gut" : "schlecht";
  }
  const FARBE = { gut: "var(--gut)", schlecht: "var(--schlecht)", neutral: "var(--ac)",
                  ist: "var(--ac)", fc: "var(--fc)", vj: "var(--py)" };

  /* ---------------- Textmessung ---------------- */
  const ctx = document.createElement("canvas").getContext("2d");
  function tw(t, px = 14, bold = false) {
    ctx.font = (bold ? "bold " : "") + px + "px Arial, 'Liberation Sans', Helvetica, sans-serif";
    return ctx.measureText(String(t)).width;
  }

  /* ---------------- DOM/SVG ---------------- */
  function el(tag, attrs = {}, parent, text) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "class") e.className = v; else if (k === "style") e.style.cssText = v; else e.setAttribute(k, v);
    }
    if (text !== undefined) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }
  function sv(tag, attrs = {}, parent, text) {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    if (text !== undefined) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }

  /* ---------------- Tooltip ---------------- */
  let tip;
  function tooltip(ziel, zeilenFn) {
    ziel.addEventListener("pointermove", ev => {
      const zeilen = zeilenFn();
      tip.textContent = "";
      zeilen.forEach((z, i) => el(i === 0 ? "b" : "div", {}, tip, z));
      tip.style.display = "block";
      const r = tip.getBoundingClientRect();
      let x = ev.clientX + 14, y = ev.clientY + 14;
      if (x + r.width > innerWidth - 8) x = ev.clientX - r.width - 14;
      if (y + r.height > innerHeight - 8) y = ev.clientY - r.height - 14;
      tip.style.left = x + "px"; tip.style.top = y + "px";
    });
    ziel.addEventListener("pointerleave", () => { tip.style.display = "none"; });
  }

  /* ---------------- Seite, Skalierung, Leiste ---------------- */
  let seite, rahmen, buehne, panel;
  function init(o) {
    document.title = o.titel;
    if (o.breite) SEITE_B = o.breite;
    if (o.hoehe) SEITE_H = o.hoehe;
    if (!PRINT) {
      const leiste = el("div", { class: "dk-leiste" }, document.body);
      el("div", { class: "dk-leiste-titel" }, leiste, o.titel);
      o.knoepfe = leiste;
    }
    buehne = el("div", { class: "dk-buehne" }, document.body);
    rahmen = el("div", { class: "dk-rahmen" }, buehne);
    seite = el("div", { class: "dk-seite", id: "seite", style: `width:${SEITE_B}px;height:${SEITE_H}px` }, rahmen);
    panel = el("div", { class: "dk-panel" }, document.body);
    tip = el("div", { class: "dk-tooltip" }, document.body);
    const skalieren = () => {
      if (PRINT) { rahmen.style.width = SEITE_B + "px"; rahmen.style.height = SEITE_H + "px"; return; }
      const frei = panel.style.display === "block" ? 380 : 0;
      const s = Math.max(0.4, Math.min((innerWidth - frei - 32) / SEITE_B, (innerHeight - 44 - 32) / SEITE_H));
      seite.style.transform = `scale(${s})`;
      rahmen.style.width = SEITE_B * s + "px"; rahmen.style.height = SEITE_H * s + "px";
      rahmen.style.marginLeft = frei ? "16px" : "auto";
    };
    addEventListener("resize", skalieren);
    DK._skalieren = skalieren;
    skalieren();
    return seite;
  }
  function box(id, x, y, w, h, cls = "") {
    return el("div", { id, class: "dk-abs " + cls, style: `left:${x}px;top:${y}px;width:${w}px;height:${h}px` }, seite);
  }
  function haarlinie(y, links = 16, rechts = 16) {
    el("div", { class: "dk-haar", style: `top:${y}px;left:${links}px;right:${rechts}px` }, seite);
  }

  /* ---------------- Kopf ---------------- */
  function kopf(ziel, o) {
    ziel.textContent = "";
    const l = el("div", { id: "kopf-titel", style: "position:absolute;left:0;top:0" }, ziel);
    el("div", { class: "dk-titel" }, l, o.titel);
    el("div", { class: "dk-untertitel", style: "margin-top:3px" }, l, o.untertitel);
    const r = el("div", { style: "position:absolute;right:0;top:2px;text-align:right" }, ziel);
    el("div", { class: "dk-quelle" }, r, o.quelle);
    const lg = el("div", { id: "kopf-legende", class: "dk-legende", style: "margin-top:8px" }, r);
    o.legende.forEach(([farbe, text, rahmenFarbe]) => {
      const s = el("span", {}, lg);
      el("i", { style: `background:${farbe};${rahmenFarbe ? "outline:1px solid " + rahmenFarbe + ";outline-offset:-1px" : ""}` }, s);
      s.appendChild(document.createTextNode(text));
    });
  }

  /* ---------------- Datenschnitte (Slicer) ---------------- */
  function knoepfe(ziel, o) {
    const g = el("div", { class: "dk-knoepfe", role: "group" }, ziel);
    const bs = o.optionen.map(([wert, text]) => {
      const b = el("button", { type: "button", "aria-pressed": String(wert === o.wert) }, g, text);
      b.addEventListener("click", () => { bs.forEach(x => x.setAttribute("aria-pressed", String(x === b))); o.onChange(wert); });
      return b;
    });
    return g;
  }
  function schnitt(ziel, label, typ, o) {
    const s = el("div", { class: "dk-schnitt" }, ziel);
    el("label", {}, s, label);
    if (typ === "knoepfe") return knoepfe(s, o);
    const sel = el("select", { "aria-label": label, style: o.breite ? `width:${o.breite}px` : "" }, s);
    o.optionen.forEach(([wert, text]) => { const op = el("option", { value: wert }, sel, text); if (wert === o.wert) op.selected = true; });
    sel.addEventListener("change", () => o.onChange(sel.value));
    return sel;
  }

  /* ---------------- KPI-Leiste (Karte mit Referenzbeschriftung) ---------------- */
  function kpis(ziel, items) {
    ziel.textContent = "";
    const w = el("div", { class: "dk-kpis" }, ziel);
    items.forEach(k => {
      const c = el("div", { class: "dk-kpi" }, w);
      el("div", { class: "dk-kpi-label" }, c, k.label);
      const wz = el("div", { class: "dk-kpi-wert" + (k.wertKlasse ? " " + k.wertKlasse : "") }, c, k.wert);
      if (k.einheit) el("span", { class: "dk-kpi-einheit" }, wz, k.einheit);
      const d = el("div", { class: "dk-kpi-delta" }, c, (k.bezug ?? "ΔVJ") + " ");
      el("b", { class: k.klasse }, d, k.delta);
    });
  }

  /* ---------------- Visual-Rahmen: Titel + Botschaft ---------------- */
  function visual(ziel, o) {
    ziel.textContent = "";
    ziel.classList.add("dk-visual");
    const tz = el("div", { class: "dk-titelzeile" }, ziel);
    const t = el("div", { class: "dk-visual-titel" }, tz, o.titel);
    if (o.einheit) { t.appendChild(document.createTextNode(", ")); el("span", { class: "dk-einheit" }, t, o.einheit); }
    if (o.schalter) knoepfe(tz, o.schalter);
    if (o.botschaft !== undefined) el("div", { class: "dk-botschaft", title: o.botschaft }, ziel, o.botschaft);
    const top = (o.botschaft !== undefined ? 42 : 24) + (o.abstand || 6);
    return { flaeche: el("div", { style: `position:absolute;left:0;top:${top}px;right:0;bottom:0` }, ziel),
             breite: ziel.clientWidth, hoehe: ziel.clientHeight - top };
  }

  /* ---------------- Balkendiagramm (gruppiertes Balkendiagramm) ---------------- */
  function balken(ziel, o) {
    const W = o.breite, n = o.zeilen.length;
    const rh = o.zeilenhoehe || Math.floor(o.hoehe / n), bh = Math.round(rh * 0.7);
    const H = rh * n;
    const svg = sv("svg", { width: W, height: H, role: "img", "aria-label": o.aria || "" }, ziel);
    const lw = o.labelBreite || Math.ceil(Math.max(...o.zeilen.map(z => tw(z.label)))) + 10;
    const vw = Math.ceil(Math.max(...o.zeilen.map(z => tw(o.fmt(z.wert))))) + 8;
    const max = Math.max(...o.zeilen.map(z => z.wert), 1e-9);
    const pw = W - lw - vw;
    o.zeilen.forEach((z, i) => {
      const y = i * rh, blass = o.auswahl != null && o.auswahl !== z.key;
      const g = sv("g", { class: (blass ? "dk-blass " : "") + (o.onClick ? "dk-klick" : "") }, svg);
      sv("text", { x: lw - 10, y: y + rh / 2, dy: "0.35em", "text-anchor": "end" }, g, z.label);
      const bw = Math.max(z.wert > 0 ? 1 : 0, z.wert / max * pw);
      if (z.kontur) sv("rect", { x: lw + 0.5, y: y + (rh - bh) / 2 + 0.5, width: Math.max(0, bw - 1), height: bh - 1,
                                 fill: "#FFFFFF", stroke: z.kontur, "stroke-width": 1 }, g);
      else sv("rect", { x: lw, y: y + (rh - bh) / 2, width: bw, height: bh, fill: z.farbe || FARBE.ist }, g);
      sv("text", { x: lw + bw + 5, y: y + rh / 2, dy: "0.35em" }, g, o.fmt(z.wert));
      const hit = sv("rect", { x: 0, y, width: W, height: rh, fill: "transparent" }, g);
      if (o.onClick) hit.addEventListener("click", () => o.onClick(z.key));
      if (o.tooltip) tooltip(hit, () => o.tooltip(z));
    });
    return svg;
  }

  /* ---------------- Bevölkerungspyramide (gestapeltes Balkendiagramm, Männer negativ) ---------------- */
  function pyramide(ziel, o) {
    const W = o.breite, n = o.zeilen.length, kopfH = 18;
    const rh = o.zeilenhoehe || Math.floor((o.hoehe - kopfH) / n), bh = Math.round(rh * 0.72);
    const H = kopfH + rh * n;
    const svg = sv("svg", { width: W, height: H, role: "img", "aria-label": o.aria || "" }, ziel);
    const lw = Math.ceil(Math.max(...o.zeilen.map(z => tw(z.label)))) + 10;
    const vl = Math.ceil(Math.max(...o.zeilen.map(z => tw(o.fmt(z.m))))) + 7;
    const vr = Math.ceil(Math.max(...o.zeilen.map(z => tw(o.fmt(z.w))))) + 7;
    const maxM = Math.max(...o.zeilen.map(z => z.m), 1e-9), maxW = Math.max(...o.zeilen.map(z => z.w), 1e-9);
    const k = (W - lw - vl - vr - 2) / (maxM + maxW);      // ein Maßstab für beide Seiten
    const x0 = lw + vl + maxM * k + 1;
    sv("text", { x: x0 - 6, y: 12, "text-anchor": "end", class: "muted" }, svg, o.kopf[0]);
    sv("text", { x: x0 + 6, y: 12, class: "muted" }, svg, o.kopf[1]);
    o.zeilen.forEach((z, i) => {
      const y = kopfH + i * rh, blass = o.auswahl != null && o.auswahl !== z.key;
      const g = sv("g", { class: (blass ? "dk-blass " : "") + (o.onClick ? "dk-klick" : "") }, svg);
      sv("text", { x: 0, y: y + rh / 2, dy: "0.35em" }, g, z.label);
      const bm = z.m * k, bw = z.w * k;
      sv("rect", { x: x0 - 1 - bm, y: y + (rh - bh) / 2, width: bm, height: bh, fill: FARBE.ist }, g);
      sv("rect", { x: x0 + 1, y: y + (rh - bh) / 2, width: bw, height: bh, fill: FARBE.ist }, g);
      sv("text", { x: x0 - 1 - bm - 5, y: y + rh / 2, dy: "0.35em", "text-anchor": "end" }, g, o.fmt(z.m));
      sv("text", { x: x0 + 1 + bw + 5, y: y + rh / 2, dy: "0.35em" }, g, o.fmt(z.w));
      const hit = sv("rect", { x: 0, y, width: W, height: rh, fill: "transparent" }, g);
      if (o.onClick) hit.addEventListener("click", () => o.onClick(z.key));
      if (o.tooltip) tooltip(hit, () => o.tooltip(z));
    });
    sv("line", { x1: x0, x2: x0, y1: kopfH - 2, y2: H, stroke: "#FFFFFF", "stroke-width": 2 }, svg);
    return svg;
  }

  /* ---------------- Gestapeltes Säulendiagramm ---------------- */
  function saeulen(ziel, o) {
    const W = o.breite, H = o.hoehe, n = o.spalten.length;
    const svg = sv("svg", { width: W, height: H, role: "img", "aria-label": o.aria || "" }, ziel);
    const lw = Math.ceil(Math.max(...o.segNamen.map(t => tw(t)))) + 10;
    const oben = 20, unten = 20, PH = H - oben - unten;
    const slot = (W - lw) / n, bw = Math.min(26, slot * 0.72);
    const max = Math.max(...o.spalten.map(s => s.segs.reduce((a, b) => a + b, 0)), 1e-9);
    const k = PH / max, basis = oben + PH;
    o.spalten.forEach((s, i) => {
      const cx = lw + slot * i + slot / 2, x = cx - bw / 2;
      const g = sv("g", {}, svg);
      let y = basis, summe = 0;
      s.segs.forEach((v, j) => {
        const h = v * k;
        sv("rect", { x, y: y - h, width: bw, height: Math.max(0, h - (j < s.segs.length - 1 ? 0 : 0)),
                     fill: FARBE[s.szenario] }, g);
        if (j > 0) sv("line", { x1: x - 1, x2: x + bw + 1, y1: y, y2: y, stroke: "#FFFFFF", "stroke-width": 2 }, g);
        if (i === 0 && h >= 15) sv("text", { x: lw - 10, y: y - h / 2, dy: "0.35em", "text-anchor": "end", class: "muted" }, svg, o.segNamen[j]);
        y -= h; summe += v;
      });
      sv("text", { x: cx, y: y - 5, "text-anchor": "middle" }, g, o.fmt(summe));
      sv("text", { x: cx, y: H - 3, "text-anchor": "middle" }, g, s.label);
      const hit = sv("rect", { x: lw + slot * i, y: 0, width: slot, height: H, fill: "transparent" }, g);
      if (o.tooltip) tooltip(hit, () => o.tooltip(s, summe));
    });
    sv("line", { x1: lw - 2, x2: W, y1: basis + 0.5, y2: basis + 0.5, stroke: "#8C8C8C", "stroke-width": 1 }, svg);
    return svg;
  }

  /* ---------------- Matrix / Tabelle mit Datenbalken ----------------
     Spaltentypen: (leer) Zahl rechtsbündig über s.fmt · "text" linksbündig · "delta" Abweichung mit Balken
     an einer Mittellinie, gefärbt nach Wirkung (s.richtung) · "anteil" Fortschritt 0..1 als Balken ab Null.
     null-Werte erscheinen als „–“ ohne Balken. o.zeilenhoehe (Standard 21), o.onSort(key) macht Köpfe klickbar. */
  function matrix(ziel, o) {
    ziel.textContent = "";
    const zh = o.zeilenhoehe || 21, H = zh - 3;
    const t = el("table", { class: "dk-matrix" }, ziel);
    const kopf = el("tr", {}, el("thead", {}, t));
    o.spalten.forEach(s => {
      const st = (s.breite ? `width:${s.breite}px;` : "") + (s.typ === "delta" || s.typ === "anteil" ? "text-align:center;" : "") +
                 (s.typ === "text" ? "text-align:left;" : "");
      const th = el("th", s.id ? { style: st, id: s.id } : { style: st }, kopf, s.titel);
      if (o.onSort && !PRINT) {
        th.classList.add("dk-sortierbar");
        th.title = "Klick sortiert";
        th.addEventListener("click", () => o.onSort(s.key));
        if (o.sortierung && o.sortierung.key === s.key) th.appendChild(document.createTextNode(o.sortierung.ab ? " ▾" : " ▴"));
      }
    });
    const tb = el("tbody", {}, t);
    // Achse der Abweichungsbalken proportional (wie „Achse: automatisch“ bei Datenbalken in Power BI)
    const spanne = {};
    o.spalten.filter(s => s.typ === "delta").forEach(s => {
      const w = o.zeilen.filter(z => !z.summe && z.werte[s.key] != null).map(z => z.werte[s.key]);
      spanne[s.key] = { neg: Math.max(0, ...w.map(v => -v)), pos: Math.max(0, ...w) };
    });
    const hoehe = o.zeilenhoehe ? `height:${zh}px` : "";
    o.zeilen.forEach(z => {
      const blass = !z.summe && o.auswahl != null && o.auswahl !== z.key;
      // Trennlinie über einer neuen Gruppe: an der Vorzeile setzen (im border-collapse gewinnt die obere Zelle)
      if (z.trenner && tb.lastChild) tb.lastChild.classList.add("dk-trenner");
      const tr = el("tr", { class: (z.summe ? "dk-summe" : "dk-zeile") + (blass ? " dk-blass" : "") }, tb);
      o.spalten.forEach((s, j) => {
        if (j === 0) { el("td", { style: hoehe }, tr, z.label); return; }
        const v = z.werte[s.key];
        if (s.typ === "text") { el("td", { style: "text-align:left;" + hoehe }, tr, v); return; }
        if (s.typ !== "delta" && s.typ !== "anteil") { el("td", { style: hoehe }, tr, v == null ? "–" : s.fmt(v)); return; }
        const td = el("td", { class: "dk-dbalken", style: hoehe }, tr);
        const W = s.breite - 8, svg = sv("svg", { width: W, height: H, style: "display:block" }, td);
        if (s.typ === "anteil") {
          const txtW = s.textBreite || 48, pw = W - txtW - 2;
          sv("text", { x: txtW - 6, y: H / 2, dy: "0.35em", "text-anchor": "end", style: "font-size:14px" }, svg,
             v == null ? "–" : zahl(v * 100, 0) + NBSP + "%");
          if (v != null) sv("rect", { x: txtW, y: (H - 10) / 2, width: Math.max(v > 0 ? 1 : 0, Math.min(1, v) * pw), height: 10, fill: FARBE.ist }, svg);
          sv("line", { x1: txtW, x2: txtW, y1: 1, y2: H - 1, stroke: "#8C8C8C", "stroke-width": 1 }, svg);
          return;
        }
        const txtW = s.textBreite || 50, sp = spanne[s.key];
        const k = (W - txtW - 4) / Math.max(sp.neg + sp.pos, 1e-9), mitte = txtW + 2 + sp.neg * k;
        const kl = v == null ? "neutral" : wirkung(v, s.richtung, s.nk ?? 1);
        sv("text", { x: txtW - 6, y: H / 2, dy: "0.35em", "text-anchor": "end",
                     style: `font-size:14px;fill:${kl === "neutral" ? "var(--text)" : FARBE[kl]};font-weight:${z.summe ? "bold" : "normal"}` },
           svg, v == null ? "–" : delta(v, s.nk ?? 1));
        if (!z.summe && v != null) {
          const bwid = Math.abs(v) * k;
          sv("rect", { x: v >= 0 ? mitte : mitte - bwid, y: (H - 10) / 2, width: bwid, height: 10, fill: FARBE[kl] }, svg);
        }
        sv("line", { x1: mitte, x2: mitte, y1: 1, y2: H - 1, stroke: "#8C8C8C", "stroke-width": 1 }, svg);
      });
      if (!z.summe && o.onClick) tr.addEventListener("click", () => o.onClick(z.key));
      if (o.tooltip && !z.summe) tooltip(tr, () => o.tooltip(z));
    });
    return t;
  }

  /* ---------------- Streudiagramm (Punktdiagramm mit Größe) ----------------
     o.punkte: [{key, x, y, g}] – g bestimmt die Kreisfläche. o.x / o.y: {min, max, ticks, titel, fmt}.
     o.linien: {x, y} Konstantenlinien; o.felder: [{ecke: "ol"|"or"|"ul"|"ur", text}] Beschriftung der Quadranten. */
  function streuung(ziel, o) {
    const W = o.breite, H = o.hoehe;
    const svg = sv("svg", { width: W, height: H, role: "img", "aria-label": o.aria || "" }, ziel);
    const fx = o.x.fmt || String, fy = o.y.fmt || String;
    const links = Math.ceil(Math.max(...o.y.ticks.map(t => tw(fy(t))))) + 8;
    const rechts = Math.ceil(tw(fx(o.x.ticks[o.x.ticks.length - 1])) / 2) + 2;
    const oben = 22, unten = 38, PW = W - links - rechts, PH = H - oben - unten;
    const sx = v => links + (v - o.x.min) / (o.x.max - o.x.min) * PW;
    const sy = v => oben + PH - (v - o.y.min) / (o.y.max - o.y.min) * PH;
    sv("text", { x: 0, y: 12, class: "muted" }, svg, o.y.titel);
    sv("text", { x: links + PW, y: H - 3, "text-anchor": "end", class: "muted" }, svg, o.x.titel);
    o.y.ticks.forEach(t => sv("text", { x: links - 6, y: sy(t), dy: "0.35em", "text-anchor": "end", class: "muted" }, svg, fy(t)));
    o.x.ticks.forEach(t => sv("text", { x: sx(t), y: oben + PH + 16, "text-anchor": "middle", class: "muted" }, svg, fx(t)));
    if (o.linien) {
      const st = { stroke: "#9A9A9A", "stroke-width": 1, "stroke-dasharray": "3 3" };
      if (o.linien.x != null) sv("line", { x1: sx(o.linien.x), x2: sx(o.linien.x), y1: oben, y2: oben + PH, ...st }, svg);
      if (o.linien.y != null) sv("line", { x1: links, x2: links + PW, y1: sy(o.linien.y), y2: sy(o.linien.y), ...st }, svg);
    }
    (o.felder || []).forEach(f => {
      const l = f.ecke[1] === "l", ob = f.ecke[0] === "o";
      sv("text", { x: l ? links + 6 : links + PW - 6, y: ob ? oben + 13 : oben + PH - 6, "text-anchor": l ? "start" : "end",
                   class: "muted" }, svg, f.text);
    });
    sv("line", { x1: links, x2: links, y1: oben, y2: oben + PH, stroke: "#8C8C8C", "stroke-width": 1 }, svg);
    sv("line", { x1: links, x2: links + PW, y1: oben + PH, y2: oben + PH, stroke: "#8C8C8C", "stroke-width": 1 }, svg);
    const gMax = Math.max(...o.punkte.map(p => p.g || 0), 1e-9), rMax = o.rMax || 13, rMin = o.rMin || 3;
    const kreise = o.punkte.slice().sort((a, b) => (b.g || 0) - (a.g || 0))
      .map(p => ({ p, cx: sx(p.x), cy: sy(p.y), r: Math.max(rMin, Math.sqrt((p.g || 0) / gMax) * rMax) }));
    const gruppen = new Map();
    kreise.forEach(({ p, cx, cy, r }) => {
      const blass = o.auswahl && !o.auswahl(p);
      const g = sv("g", { class: (blass ? "dk-blass " : "") + (o.onClick ? "dk-klick" : "") }, svg);
      sv("circle", { cx, cy, r, fill: p.farbe || FARBE.ist, "fill-opacity": 0.8, stroke: "#FFFFFF", "stroke-width": 1 }, g);
      const hit = sv("circle", { cx, cy, r: Math.max(r, 6), fill: "transparent" }, g);
      if (o.onClick) hit.addEventListener("click", () => o.onClick(p.key));
      if (o.tooltip) tooltip(hit, () => o.tooltip(p));
      gruppen.set(p, g);
    });
    // Beschriftungen nach allen Kreisen: rechts, links, oben, unten – erste Lage ohne Überdeckung
    const belegt = [];
    const schneidetKreis = (b, k) => {
      const nx = Math.max(b.x, Math.min(k.cx, b.x + b.w)), ny = Math.max(b.y, Math.min(k.cy, b.y + b.h));
      return (nx - k.cx) ** 2 + (ny - k.cy) ** 2 < (k.r + 1) ** 2;
    };
    const schneidet = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
    kreise.filter(k => k.p.label).forEach(k => {
      const w = tw(k.p.label), h = 16, { cx, cy, r } = k;
      const lagen = [[cx + r + 4, cy - h / 2], [cx - r - 4 - w, cy - h / 2], [cx - w / 2, cy - r - 2 - h], [cx - w / 2, cy + r + 2]];
      const frei = b => b.x >= links && b.x + b.w <= links + PW && b.y >= oben && b.y + b.h <= oben + PH &&
        !kreise.some(a => a !== k && schneidetKreis(b, a)) && !belegt.some(c => schneidet(b, c));
      const b = lagen.map(([x, y]) => ({ x, y, w, h })).find(frei) || { x: lagen[0][0], y: lagen[0][1], w, h };
      belegt.push(b);
      sv("text", { x: b.x, y: b.y + h / 2, dy: "0.35em" }, gruppen.get(k.p), k.p.label);
    });
    return svg;
  }

  /* ---------------- Berichtsdesign für Power BI (Theme-JSON) ---------------- */
  function thema() {
    const GUT = getComputedStyle(document.body).getPropertyValue("--gut").trim() || "#00806B";
    return { name: "6. Auflage – Buchstil", dataColors: ["#3A3F44", "#8F8F8F", "#C9C9C9", GUT, "#C62828"],
      background: "#FFFFFF", foreground: "#1A1A1A", tableAccent: "#3A3F44", good: GUT, neutral: "#8F8F8F", bad: "#C62828",
      maximum: "#3A3F44", center: "#C9C9C9", minimum: "#F6F6F6",
      textClasses: { callout: { fontSize: 19.5, fontFace: "Arial", color: "#1A1A1A" },
                     title: { fontSize: 12, fontFace: "Arial", color: "#1A1A1A" },
                     header: { fontSize: 10.5, fontFace: "Arial", color: "#4D4D4D" },
                     label: { fontSize: 10.5, fontFace: "Arial", color: "#1A1A1A" } },
      visualStyles: { "*": { "*": { border: [{ show: false }], dropShadow: [{ show: false }], background: [{ show: false }] } } } };
  }

  /* ---------------- Ebenen der Lernplattform ---------------- */
  function download(name, inhalt, typ = "text/csv;charset=utf-8") {
    const blob = new Blob([String.fromCharCode(0xFEFF) + inhalt], { type: typ });
    const a = el("a", { href: URL.createObjectURL(blob), download: name }, document.body);
    a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function ebenen(o) {
    if (PRINT) return;
    const leiste = document.querySelector(".dk-leiste");
    let modus = null;
    const marken = [];
    const knopf = (text, fn) => { const b = el("button", { type: "button", "aria-pressed": "false" }, leiste, text); b.addEventListener("click", fn); return b; };
    const kRegeln = knopf("Designregeln", () => umschalten("regeln"));
    const kNachbau = knopf("Nachbau in Power BI", () => umschalten("nachbau"));
    const kTab = knopf("Werte als Tabelle", () => umschalten("tabelle"));
    knopf("Daten (CSV)", () => download(o.csv.name, o.csv.text()));
    function markenWeg() { marken.forEach(m => m.remove()); marken.length = 0; }
    function markeSetzen(eintrag, text, cls) {
      const z = document.getElementById(eintrag.ziel);
      if (!z) return;
      const [dx, dy] = eintrag.versatz || [0, 0];
      const sr = seite.getBoundingClientRect(), r = z.getBoundingClientRect(), sk = sr.width / SEITE_B;
      // anker "rechts" (Standard): Marke auf der rechten oberen Ecke des Ziels; "links": links neben dem Ziel
      const x = eintrag.anker === "links" ? (r.left - sr.left) / sk - 28 : (r.right - sr.left) / sk - 22;
      const m = el("div", { class: "dk-marke " + cls, style: `left:${x + dx}px;top:${(r.top - sr.top) / sk - 4 + dy}px` }, seite, text);
      m.addEventListener("click", () => aktiv(text));
      marken.push(m);
    }
    function aktiv(text) {
      panel.querySelectorAll(".dk-eintrag").forEach(e => e.classList.toggle("aktiv", e.dataset.marke === text));
      marken.forEach(m => m.classList.toggle("aktiv", m.textContent === text));
      const e = panel.querySelector(`.dk-eintrag[data-marke="${text}"]`);
      if (e) e.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
    function umschalten(m) {
      modus = modus === m ? null : m;
      [kRegeln, kNachbau, kTab].forEach((b, i) => b.setAttribute("aria-pressed", String(modus === ["regeln", "nachbau", "tabelle"][i])));
      markenWeg(); panel.textContent = "";
      panel.style.display = modus ? "block" : "none";
      DK._skalieren();
      if (modus === "regeln") {
        el("h2", {}, panel, "Designregeln (SUCCESS)");
        el("div", { class: "dk-panel-intro" }, panel, "SUCCESS-Formel nach Hichert/Faisst (IBCS): Say, Unify, Condense, Check, Express, Simplify, Structure. Die Nummern im Dashboard zeigen, wo eine Regel angewendet ist.");
        o.regeln.forEach(r => {
          const e = el("div", { class: "dk-eintrag", "data-marke": String(r.nr) }, panel);
          const k = el("div", { class: "dk-eintrag-kopf" }, e);
          el("span", {}, k, r.nr + "."); el("span", {}, k, r.titel);
          el("div", { class: "dk-regel" }, e, r.regel);
          el("div", {}, e, r.text);
          markeSetzen(r, String(r.nr), "");
        });
      } else if (modus === "nachbau") {
        el("h2", {}, panel, "Nachbau in Power BI");
        el("div", { class: "dk-panel-intro" }, panel, o.nachbauIntro);
        if (o.theme) { const b = el("button", { type: "button", style: "margin-bottom:10px;font:inherit;padding:5px 10px;border:1px solid #9A9A9A;background:#fff;border-radius:3px;cursor:pointer" }, panel, "Berichtsdesign (JSON) herunterladen");
          b.addEventListener("click", () => download("berichtsdesign.json", JSON.stringify(o.theme, null, 2), "application/json")); }
        o.nachbau.forEach(n => {
          const e = el("div", { class: "dk-eintrag", "data-marke": n.id }, panel);
          const k = el("div", { class: "dk-eintrag-kopf" }, e);
          el("span", {}, k, n.id); el("span", {}, k, n.titel);
          const dl = el("dl", {}, e);
          [["Visual", n.visual], ["Felder", n.felder], ["Format", n.format], ["Hinweis", n.hinweis]].forEach(([a, b]) => {
            if (!b) return; el("dt", {}, dl, a); el("dd", {}, dl, b);
          });
          markeSetzen(n, n.id, "nachbau");
        });
      } else if (modus === "tabelle") {
        el("h2", {}, panel, "Werte als Tabelle");
        el("div", { class: "dk-panel-intro" }, panel, "Alle Werte der Visuals in der aktuellen Filterung (entspricht „Als Tabelle anzeigen“ in Power BI).");
        o.tabellen().forEach(tab => {
          el("div", { style: "font-weight:bold;margin:12px 0 4px" }, panel, tab.titel);
          const t = el("table", { class: "dk-matrix" }, panel);
          const hr = el("tr", {}, el("thead", {}, t));
          tab.kopf.forEach(h => el("th", {}, hr, h));
          const tb = el("tbody", {}, t);
          tab.zeilen.forEach(z => { const tr = el("tr", {}, tb); z.forEach(c => el("td", {}, tr, c)); });
        });
      }
    }
    DK._ebenenNeu = () => { if (modus) { const m = modus; modus = null; umschalten(m); } };
  }

  return { PRINT, NBSP, zahl, delta, prozent, wirkung, FARBE, tw, el, sv, init, box, haarlinie, kopf, schnitt, knoepfe,
           kpis, visual, balken, pyramide, saeulen, matrix, streuung, thema, ebenen, download };
})();
