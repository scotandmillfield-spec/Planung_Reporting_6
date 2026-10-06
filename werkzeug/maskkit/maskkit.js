/* maskkit.js – softwareneutrale Eingabemasken im Buchstil (6. Auflage)
   Die Maske ist HTML5 (<form class="mk-maske">) mit den Klassen aus maskkit.css.
   ?print: Druckfassung – Steuerelemente werden zu statischen Elementen gleicher Geometrie, ohne Leiste.
   MK.exportieren() liefert alle Flächen, Linien, Formen und Textzeilen in px für die PowerPoint-Ausgabe. */
const MK = (() => {
  "use strict";
  const Q = new URLSearchParams(location.search);
  const PRINT = Q.has("print");
  if (PRINT) document.body.classList.add("print");
  const NS = "http://www.w3.org/2000/svg";
  const NBSP = String.fromCharCode(0xA0), MINUS = String.fromCharCode(0x2212);

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
  function sv(tag, attrs = {}, parent) {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    if (parent) parent.appendChild(e);
    return e;
  }
  // Pfeil nach unten (Auswahlfeld) bzw. oben (Klappband), 8 x 5 px
  function pfeil(cls, oben = false) {
    const s = sv("svg", { width: 8, height: 5, viewBox: "0 0 8 5", class: cls, "aria-hidden": "true" });
    sv("polygon", { points: oben ? "0,5 8,5 4,0" : "0,0 8,0 4,5", fill: "#3A3F44" }, s);
    return s;
  }

  /* ---------------- Zahlen und Datum (deutsches Format) ---------------- */
  const NF = {};
  const nf = nk => NF[nk] || (NF[nk] = new Intl.NumberFormat("de-DE", { minimumFractionDigits: nk, maximumFractionDigits: nk }));
  function zahl(v, nk = 1) { return v == null || isNaN(v) ? "" : (v < 0 ? MINUS : "") + nf(nk).format(Math.abs(v)); }
  function leseZahl(text) {
    const t = String(text).trim().replace(MINUS, "-").replace(/\s/g, "");
    if (!t) return null;
    if (!/^-?(\d{1,3}(\.\d{3})+|\d+)(,\d+)?$/.test(t)) return NaN;
    return parseFloat(t.replace(/\./g, "").replace(",", "."));
  }
  function leseDatum(text) {
    const m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(String(text).trim());
    if (!m) return null;
    const d = new Date(+m[3], +m[2] - 1, +m[1]);
    return d.getMonth() === +m[2] - 1 ? d : null;
  }
  function datum(d) { return d ? String(d.getDate()).padStart(2, "0") + "." + String(d.getMonth() + 1).padStart(2, "0") + "." + d.getFullYear() : ""; }
  // Eingabe prüfen und markieren; liefert den Wert oder null
  function pruefeFeld(feld, art = "zahl", opt = {}) {
    const t = feld.value;
    let v = null, ok = true;
    if (art === "zahl") {
      v = leseZahl(t);
      ok = v === null ? !opt.pflicht : !isNaN(v) && (opt.min == null || v >= opt.min) && (opt.max == null || v <= opt.max);
    } else if (art === "datum") {
      v = leseDatum(t);
      ok = t.trim() === "" ? !opt.pflicht : v !== null;
    }
    feld.classList.toggle("mk-fehler", !ok);
    feld.title = ok ? (feld.dataset.hilfe || "") : (opt.meldung || "Eingabe prüfen");
    return ok ? v : null;
  }

  /* ---------------- Seite, Skalierung, Leiste ---------------- */
  let seite, rahmen, buehne, panel, maske, meldungEl, leiste, B = 727, H = 0;
  function init(o = {}) {
    document.title = o.titel || document.title;
    maske = document.querySelector(o.maske || ".mk-maske");
    if (!maske) throw new Error("Keine .mk-maske gefunden");
    if (!PRINT) {
      leiste = el("div", { class: "mk-leiste" }, document.body);
      el("div", { class: "mk-leiste-titel" }, leiste, o.titel || "");
    }
    buehne = el("div", { class: "mk-buehne" }, document.body);
    rahmen = el("div", { class: "mk-rahmen" }, buehne);
    seite = el("div", { class: "mk-seite", id: "seite" }, rahmen);
    seite.appendChild(maske);
    panel = el("div", { class: "mk-panel" }, document.body);
    meldungEl = el("div", { class: "mk-meldung", role: "status" }, document.body);
    // Klappbänder: Klick auf das Band klappt den Abschnitt auf und zu (nur interaktiv)
    maske.querySelectorAll(".mk-abschnitt > .mk-band").forEach(b => {
      if (PRINT || b.dataset.klappbar === "nein") return;
      b.appendChild(pfeil("mk-klapp mk-nur-interaktiv", true));
      b.setAttribute("role", "button"); b.tabIndex = 0;
      const klapp = () => { b.parentElement.classList.toggle("zu"); skalieren(); if (MK._ebenenNeu) MK._ebenenNeu(); };
      b.addEventListener("click", klapp);
      b.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); klapp(); } });
    });
    maske.addEventListener("submit", e => e.preventDefault());
    addEventListener("resize", skalieren);
    return maske;
  }
  function skalieren() {
    B = maske.offsetWidth; H = maske.offsetHeight;
    seite.style.width = B + "px"; seite.style.height = H + "px";
    if (PRINT) { rahmen.style.width = B + "px"; rahmen.style.height = H + "px"; seite.style.transform = ""; return; }
    const frei = panel.style.display === "block" ? 380 : 0;
    const s = Math.max(0.4, Math.min(1.6, (innerWidth - frei - 32) / B, (innerHeight - 44 - 32) / H));
    seite.style.transform = `scale(${s})`;
    rahmen.style.width = B * s + "px"; rahmen.style.height = H * s + "px";
    rahmen.style.marginLeft = frei ? "16px" : "auto";
  }
  function meldung(text) {
    meldungEl.textContent = text; meldungEl.style.display = "block";
    clearTimeout(meldung._t); meldung._t = setTimeout(() => { meldungEl.style.display = "none"; }, 2600);
  }

  /* ---------------- Druckfassung: Steuerelemente -> statische Elemente ---------------- */
  let fertigGemeldet = false;
  function kopieAttribute(von, nach) {
    ["id", "style", "title"].forEach(a => { if (von.getAttribute(a)) nach.setAttribute(a, von.getAttribute(a)); });
    Object.entries(von.dataset).forEach(([k, v]) => { nach.dataset[k] = v; });
  }
  function druckfassung() {
    maske.querySelectorAll("input, select, textarea, button").forEach(f => {
      let d;
      if (f.matches("input.mk-check")) {
        d = sv("svg", { width: 14, height: 14, viewBox: "0 0 14 14", class: "mk-check-druck" });
        if (f.type === "radio") {
          sv("circle", { cx: 7, cy: 7, r: 6.5, fill: "#FFFFFF", stroke: "#9A9A9A", "stroke-width": 1 }, d);
          if (f.checked) sv("circle", { cx: 7, cy: 7, r: 3, fill: "#3A3F44" }, d);
        } else {
          sv("rect", { x: 0.5, y: 0.5, width: 13, height: 13, rx: 2, fill: f.checked ? "#3A3F44" : "#FFFFFF",
                       stroke: f.checked ? "#3A3F44" : "#9A9A9A", "stroke-width": 1 }, d);
          if (f.checked) sv("polyline", { points: "3.5,7.2 6,9.6 10.5,4.4", fill: "none", stroke: "#FFFFFF", "stroke-width": 2 }, d);
        }
      } else if (f.tagName === "SELECT") {
        d = el("div", { class: f.className + " mk-auswahl" });
        el("span", {}, d, f.selectedIndex >= 0 ? f.options[f.selectedIndex].text : "");
        d.appendChild(pfeil("mk-pfeil"));
      } else if (f.tagName === "TEXTAREA") {
        d = el("div", { class: f.className + " mk-mehrzeilig" }, undefined, f.value);
        d.style.height = f.offsetHeight + "px";               // Höhe aus rows übernehmen
      } else if (f.tagName === "BUTTON") {
        d = el("div", { class: f.className }, undefined, f.textContent);
      } else if (f.type === "hidden") {
        return;
      } else {
        d = el("div", { class: f.className }, undefined, f.value);
      }
      if (!(d instanceof SVGElement)) { const h = d.style.height; kopieAttribute(f, d); if (h) d.style.height = h; }
      f.replaceWith(d);
    });
  }
  // Am Ende des Masken-Skripts aufrufen: setzt die Druckfassung und skaliert
  function fertig() {
    if (fertigGemeldet) return;
    fertigGemeldet = true;
    if (PRINT) druckfassung();
    skalieren();
    if (MK._ebenenNeu) MK._ebenenNeu();
  }

  /* ---------------- Ebenen der Lernplattform: Erläuterungen und Gestaltung ---------------- */
  function zielElement(z) { return !z ? null : document.getElementById(z) || maske.querySelector(z); }
  function ebenen(o) {
    if (PRINT) return;
    let modus = null;
    const marken = [], knoepfe = {};
    const arten = [["erlaeuterungen", "Erläuterungen", ""], ["gestaltung", "Gestaltung", "gestaltung"]].filter(([k]) => o[k]);
    arten.forEach(([k, text]) => {
      const b = el("button", { type: "button", "aria-pressed": "false" }, leiste, text);
      b.addEventListener("click", () => umschalten(k));
      knoepfe[k] = b;
    });
    function markenWeg() { marken.forEach(m => m.remove()); marken.length = 0; maske.querySelectorAll(".mk-markiert").forEach(e => e.classList.remove("mk-markiert")); }
    function markeSetzen(eintrag, text, cls) {
      const z = zielElement(eintrag.ziel);
      if (!z || !z.offsetParent) return;
      const [dx, dy] = eintrag.versatz || [0, 0];
      const sr = seite.getBoundingClientRect(), r = z.getBoundingClientRect(), sk = sr.width / B;
      // anker "rechts" (Standard): Marke an der rechten oberen Ecke des Ziels; "links": links neben dem Ziel
      const x = eintrag.anker === "links" ? (r.left - sr.left) / sk - 28 : (r.right - sr.left) / sk - 22;
      const m = el("div", { class: "mk-marke " + cls, style: `left:${x + dx}px;top:${(r.top - sr.top) / sk - 4 + dy}px` }, seite, text);
      m.addEventListener("click", () => aktiv(text, eintrag));
      marken.push(m);
    }
    function aktiv(text, eintrag) {
      panel.querySelectorAll(".mk-eintrag").forEach(e => e.classList.toggle("aktiv", e.dataset.marke === text));
      marken.forEach(m => m.classList.toggle("aktiv", m.textContent === text));
      maske.querySelectorAll(".mk-markiert").forEach(e => e.classList.remove("mk-markiert"));
      const z = eintrag && zielElement(eintrag.ziel);
      if (z) z.classList.add("mk-markiert");
      const e = panel.querySelector(`.mk-eintrag[data-marke="${text}"]`);
      if (e) e.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
    function umschalten(k) {
      modus = modus === k ? null : k;
      Object.entries(knoepfe).forEach(([a, b]) => b.setAttribute("aria-pressed", String(modus === a)));
      markenWeg(); panel.textContent = "";
      panel.style.display = modus ? "block" : "none";
      skalieren();
      if (!modus) return;
      const def = o[modus], cls = modus === "gestaltung" ? "gestaltung" : "";
      el("h2", {}, panel, def.titel || (modus === "gestaltung" ? "Gestaltung" : "Erläuterungen"));
      if (def.intro) el("div", { class: "mk-panel-intro" }, panel, def.intro);
      def.eintraege.forEach(r => {
        const nr = String(r.nr);
        const e = el("div", { class: "mk-eintrag", "data-marke": nr }, panel);
        const kopf = el("div", { class: "mk-eintrag-kopf" }, e);
        el("span", {}, kopf, modus === "gestaltung" ? nr : nr + "."); el("span", {}, kopf, r.titel);
        if (r.regel) el("div", { class: "mk-regel" }, e, r.regel);
        el("div", {}, e, r.text);
        e.addEventListener("click", () => aktiv(nr, r));
        markeSetzen(r, nr, cls);
      });
    }
    MK._ebenenNeu = () => { if (modus) { const m = modus; modus = null; umschalten(m); } };
    addEventListener("keydown", e => { if (e.key === "Escape" && modus) umschalten(modus); });
  }

  /* ---------------- Export für PowerPoint (Druckfassung) ---------------- */
  function farbe(c) {
    const m = /rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/.exec(c || "");
    if (!m) return null;
    const a = m[4] === undefined ? 1 : parseFloat(m[4]);
    const hex = [m[1], m[2], m[3]].map(v => Math.round(+v).toString(16).padStart(2, "0")).join("").toUpperCase();
    return { hex, a };
  }
  function exportieren() {
    const R = maske.getBoundingClientRect();
    const formen = [];
    const name = e => e.id || e.dataset.name || (e.className && typeof e.className === "string" ? e.className.split(" ")[0] : e.tagName);
    const sichtbar = s => s.w > 0 && s.st !== "none" && s.st !== "hidden" && s.c && s.c.a > 0;
    function kasten(e, cs) {
      const r = e.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const bg = farbe(cs.backgroundColor);
      const seiten = ["Top", "Right", "Bottom", "Left"].map(s => ({ w: parseFloat(cs["border" + s + "Width"]) || 0,
        c: farbe(cs["border" + s + "Color"]), st: cs["border" + s + "Style"] }));
      const gleich = seiten.every(s => sichtbar(s) && s.w === seiten[0].w && s.c.hex === seiten[0].c.hex && s.st === seiten[0].st);
      const x = r.left - R.left, y = r.top - R.top, rad = parseFloat(cs.borderTopLeftRadius) || 0;
      const fuell = bg && bg.a > 0.01 ? bg.hex : null;
      if (fuell || gleich) {
        const lw = gleich ? seiten[0].w : 0;
        formen.push({ t: "rect", name: name(e), x: x + lw / 2, y: y + lw / 2, w: r.width - lw, h: r.height - lw,
                      fill: fuell, line: gleich ? seiten[0].c.hex : null, lw, dash: gleich && seiten[0].st === "dashed", r: rad });
      }
      if (!gleich) seiten.forEach((s, i) => {
        if (!sichtbar(s)) return;
        const h = s.w / 2;
        const p = [[x, y + h, x + r.width, y + h], [x + r.width - h, y, x + r.width - h, y + r.height],
                   [x, y + r.height - h, x + r.width, y + r.height - h], [x + h, y, x + h, y + r.height]][i];
        formen.push({ t: "linie", name: name(e), x1: p[0], y1: p[1], x2: p[2], y2: p[3], farbe: s.c.hex, lw: s.w, dash: s.st === "dashed" });
      });
    }
    function svgFormen(svg) {
      svg.querySelectorAll("polygon, polyline, rect, circle, line").forEach(k => {
        const cs = getComputedStyle(k), M = k.getScreenCTM();
        const pt = (x, y) => { const p = new DOMPoint(x, y).matrixTransform(M); return [p.x - R.left, p.y - R.top]; };
        const f = farbe(cs.fill), s = farbe(cs.stroke), lw = parseFloat(cs.strokeWidth) || 0;
        const fill = f && f.a > 0.01 ? f.hex : null, line = s && s.a > 0.01 && lw > 0 ? s.hex : null;
        const tag = k.tagName.toLowerCase();
        if (tag === "polygon" || tag === "polyline") {
          const pts = [...k.points].map(p => pt(p.x, p.y));
          formen.push({ t: "poly", name: "Form", pts, zu: tag === "polygon", fill: tag === "polygon" ? fill : null, line, lw });
        } else if (tag === "rect") {
          const x = +k.getAttribute("x") || 0, y = +k.getAttribute("y") || 0, w = +k.getAttribute("width"), h = +k.getAttribute("height");
          const a = pt(x, y), b = pt(x + w, y + h);
          formen.push({ t: "rect", name: "Form", x: a[0], y: a[1], w: b[0] - a[0], h: b[1] - a[1], fill, line, lw, r: +k.getAttribute("rx") || 0 });
        } else if (tag === "circle") {
          const cx = +k.getAttribute("cx"), cy = +k.getAttribute("cy"), r = +k.getAttribute("r");
          const a = pt(cx - r, cy - r), b = pt(cx + r, cy + r);
          formen.push({ t: "oval", name: "Form", x: a[0], y: a[1], w: b[0] - a[0], h: b[1] - a[1], fill, line, lw });
        } else if (tag === "line") {
          const a = pt(+k.getAttribute("x1"), +k.getAttribute("y1")), b = pt(+k.getAttribute("x2"), +k.getAttribute("y2"));
          formen.push({ t: "linie", name: "Linie", x1: a[0], y1: a[1], x2: b[0], y2: b[1], farbe: line, lw });
        }
      });
    }
    function text(n) {
      const t = n.textContent;
      if (!t.trim()) return;
      const p = n.parentElement, cs = getComputedStyle(p);
      const woerter = [], re = /[^\s]+/g;
      let m;
      while ((m = re.exec(t))) {
        const rg = document.createRange();
        rg.setStart(n, m.index); rg.setEnd(n, m.index + m[0].length);
        const rs = [...rg.getClientRects()].filter(r => r.width > 0);
        if (rs.length) woerter.push({ a: m.index, b: m.index + m[0].length, r: rs[0] });
      }
      if (!woerter.length) return;
      const zeilen = [];
      woerter.forEach(w => {
        const z = zeilen[zeilen.length - 1];
        if (z && Math.abs(z.top - w.r.top) < 2) { z.b = w.b; z.right = Math.max(z.right, w.r.right); z.bottom = Math.max(z.bottom, w.r.bottom); }
        else zeilen.push({ a: w.a, b: w.b, left: w.r.left, right: w.r.right, top: w.r.top, bottom: w.r.bottom });
      });
      const gross = cs.textTransform === "uppercase";
      const unter = (cs.textDecorationLine || cs.textDecoration || "").includes("underline");
      formen.push({ t: "text", name: name(p), groesse: parseFloat(cs.fontSize), fett: parseInt(cs.fontWeight, 10) >= 600,
        kursiv: cs.fontStyle === "italic", farbe: (farbe(cs.color) || { hex: "1A1A1A" }).hex, unter,
        ausr: { right: "r", end: "r", center: "c" }[cs.textAlign] || "l",
        sperr: parseFloat(cs.letterSpacing) || 0,
        zeilen: zeilen.map(z => {
          let s = t.slice(z.a, z.b).replace(/[ \t\n\r]+/g, " ");
          if (gross) s = s.toUpperCase();
          return { x: z.left - R.left, y: z.top - R.top, w: z.right - z.left, h: z.bottom - z.top, text: s };
        }) });
    }
    function gehe(n) {
      if (n.nodeType === 3) { text(n); return; }
      if (n.nodeType !== 1) return;
      const cs = getComputedStyle(n);
      if (cs.display === "none" || cs.visibility === "hidden") return;
      if (n.tagName.toLowerCase() === "svg") { svgFormen(n); return; }
      kasten(n, cs);
      n.childNodes.forEach(gehe);
    }
    gehe(maske);
    return { breite: R.width, hoehe: R.height, formen };
  }

  /* ---------------- Prüfungen (Druckfassung) ---------------- */
  function kontrast(a, b) {
    const lin = c => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
    const L = h => 0.2126 * lin(parseInt(h.slice(0, 2), 16)) + 0.7152 * lin(parseInt(h.slice(2, 4), 16)) + 0.0722 * lin(parseInt(h.slice(4, 6), 16));
    const [x, y] = [L(a), L(b)].sort((p, q) => q - p);
    return (x + 0.05) / (y + 0.05);
  }
  function pruefen() {
    const R = maske.getBoundingClientRect(), probleme = [];
    const kurz = s => s.trim().replace(/\s+/g, " ").slice(0, 40);
    maske.querySelectorAll("*").forEach(e => {
      const cs = getComputedStyle(e);
      if (cs.display === "none" || e.closest("svg")) return;
      const r = e.getBoundingClientRect();
      if (r.width && (r.left < R.left - 0.5 || r.right > R.right + 0.5 || r.bottom > R.bottom + 0.5))
        probleme.push(`Überlauf aus der Maske: ${e.className || e.tagName} „${kurz(e.textContent)}“`);
      if (e.textContent.trim() && (cs.overflow === "hidden" || cs.overflowX === "hidden") &&
          (e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 1))
        probleme.push(`Text abgeschnitten: „${kurz(e.textContent)}“`);
    });
    const tw = document.createTreeWalker(maske, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = tw.nextNode())) {
      if (!n.textContent.trim()) continue;
      const p = n.parentElement, cs = getComputedStyle(p);
      if (cs.display === "none") continue;
      if (parseFloat(cs.fontSize) < 13.9) probleme.push(`Schrift unter 6 pt (${cs.fontSize}): „${kurz(n.textContent)}“`);
      let a = p, bg = null;
      while (a && !bg) { const f = farbe(getComputedStyle(a).backgroundColor); if (f && f.a > 0.5) bg = f.hex; a = a.parentElement; }
      const fg = farbe(cs.color);
      if (fg && kontrast(fg.hex, bg || "FFFFFF") < 4.5) probleme.push(`Kontrast < 4,5:1: „${kurz(n.textContent)}“`);
    }
    return [...new Set(probleme)];
  }

  return { PRINT, NBSP, MINUS, el, sv, pfeil, zahl, leseZahl, leseDatum, datum, pruefeFeld, init, fertig, skalieren,
           meldung, ebenen, exportieren, pruefen, druckfassung };
})();
