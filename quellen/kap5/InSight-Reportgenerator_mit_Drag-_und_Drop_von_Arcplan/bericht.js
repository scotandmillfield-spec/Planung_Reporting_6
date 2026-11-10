/* Abb. 5.41 „Reportgenerator mit Drag & Drop“ – Logik des Berichtsentwurfs.
   Berichtsobjekte (Tabelle, Spalte, Grafik …) und Datenbankfelder werden per Drag & Drop in den Bericht gezogen:
   Merkmal auf freie Fläche → Spalte (Auswahlliste), Kennzahl auf freie Fläche → Einzelfeld, Feld auf eine Tabelle
   oder Grafik → neue Zeilen bzw. Wertspalte, Kennzahl auf eine Spalte → Tabelle. Auswahl in einer Spalte filtert
   die verbundenen Objekte. Datenbank wie in Abb. 5.40 (Kunden, Auftrag, Artikel, Farbe), Werte erfunden
   (fester Startwert), Ist in Tsd. €. Druckfassung: Bericht im Aufbau – „Skonto“ wird in die Tabelle gezogen. */
(() => {
  "use strict";
  const { el, sv, zahl } = MK;
  MK.init({ titel: "Reportgenerator mit Drag & Drop" });
  const $ = id => document.getElementById(id);
  const PRINT = MK.PRINT;
  const maske = $("bericht"), flaeche = $("flaeche"), verb = $("verb");
  const FB = 695, FH = 240;                                   // Berichtsfläche

  /* ---------- Datenbank: Tabellen, Felder, Würfel ---------- */
  const TABELLEN = {
    Artikel: { m: ["ARTNR", "Bezeichnung", "Farbe"], k: [] },
    Auftrag: { m: ["PLIKZ", "KNDNR", "ARTNR", "FKART", "KHIER"],
               k: ["Umsatz Flaschen", "Umsatz Verpackung", "Rabatt", "Skonto", "Bonus", "Fracht", "Gruppenbonus",
                   "Herstellkosten", "Menge", "Provision", "Sonderbonus"] },
    Farbe: { m: ["Farbnr", "Farbe"], k: [] },
    Kunden: { m: ["KNDNR", "Name", "PLZ", "Ort", "Land", "Kundenbezirk"], k: [] },
  };
  // Merkmale mit hinterlegten Elementen (Tabelle.Feld → Dimension des Würfels)
  const DIM = { "Kunden.Kundenbezirk": "bezirk", "Artikel.Bezeichnung": "artikel", "Artikel.Farbe": "farbe",
                "Farbe.Farbe": "farbe", "Auftrag.PLIKZ": "plikz" };
  const DIMNAME = { bezirk: "Kundenbezirk", artikel: "Artikel", farbe: "Farbe", plikz: "Plan/Ist" };
  const EL = { bezirk: ["Nord", "Ost", "Süd", "West"],
               artikel: ["Bierflasche 0,33 l", "Bierflasche 0,5 l", "Weinflasche 0,75 l", "Saftflasche 1,0 l"],
               farbe: ["Braunglas", "Grünglas", "Weißglas"], plikz: ["Ist", "Plan"] };
  const KZ = TABELLEN.Auftrag.k;
  const EINHEIT = k => (k === "Menge" ? "Tsd. Stück" : "Tsd. €");
  // Würfel: Kundenbezirk × Artikel × Farbe × Plan/Ist; Menge in Tsd. Stück, Werte in Tsd. €
  const WUERFEL = (() => {
    let s = 20260541;
    const zufall = () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const MENGE = [5200, 3900, 6100, 4700], ANTEIL = [0.30, 0.35, 0.20, 0.15], PREIS = [0.16, 0.21, 0.34, 0.29];
    const FARBE = [[0.70, 0.25, 0.05], [0.70, 0.25, 0.05], [0.05, 0.60, 0.35], [0.05, 0.15, 0.80]];
    const SATZ = { "Umsatz Verpackung": 0.12, Rabatt: 0.030, Skonto: 0.015, Bonus: 0.020, Fracht: 0.040, Gruppenbonus: 0.010,
                   Herstellkosten: 0.620, Provision: 0.025, Sonderbonus: 0.005 };
    const z = [];
    MENGE.forEach((mb, b) => ANTEIL.forEach((an, a) => FARBE[a].forEach((fa, f) => {
      const ist = mb * an * fa * (0.92 + 0.16 * zufall());
      [["Ist", ist], ["Plan", ist * (0.95 + 0.15 * zufall())]].forEach(([p, menge]) => {
        const r = { bezirk: EL.bezirk[b], artikel: EL.artikel[a], farbe: EL.farbe[f], plikz: p, Menge: menge,
                    "Umsatz Flaschen": menge * PREIS[a] };
        Object.entries(SATZ).forEach(([k, q]) => { r[k] = r["Umsatz Flaschen"] * q * (0.85 + 0.3 * zufall()); });
        z.push(r);
      });
    })));
    return z;
  })();

  /* ---------- Zustand des Berichts ---------- */
  const START = () => ({
    demo: true, pfeile: false, gewaehlt: null, naechste: 4,
    objekte: [
      { id: "o1", typ: "Text", x: 16, y: 12, text: "Erlösschmälerungen nach Kundenbezirk", rahmen: false },
      { id: "o2", typ: "Spalte", x: 16, y: 52, dim: "farbe", sel: [] },
      { id: "o3", typ: "Tabelle", x: 170, y: 52, dim: "bezirk", kz: ["Umsatz Flaschen", "Rabatt"], sel: [] },
    ],
  });
  let S = START(), verlauf = [], vorwaerts = [], anfang = null;
  const kopie = o => JSON.parse(JSON.stringify(o));
  function merken() { verlauf.push(kopie(S)); if (verlauf.length > 40) verlauf.shift(); vorwaerts = []; }
  const obj = id => S.objekte.find(o => o.id === id);
  const LISTEN = ["Spalte", "Zeile", "Menü", "Optionsfeld", "Kontrollkästchen", "Vertikale Hierarchie", "Horizontale Hierarchie", "Menühierarchie"];
  const DATEN = ["Tabelle", "Grafik", "Einzelfeld"];
  const OBJEKTARTEN = ["Tabelle", "Spalte", "Zeile", "Einzelfeld", "Menü", "Optionsfeld", "Kontrollkästchen", "Schaltfläche",
                       "Tastenfeld", "Text", "Bild", "Grafik", "Internet", "Vertikale Hierarchie", "Horizontale Hierarchie", "Menühierarchie"];

  /* ---------- Werte: Filter aus den Auswahlobjekten (Verbindungen) ---------- */
  function filter(o) {
    const f = {};
    if (!o.lokal) S.objekte.forEach(l => {
      if (LISTEN.includes(l.typ) && l.dim && l.sel && l.sel.length && l.sichtbar !== false && l.dim !== o.dim) f[l.dim] = l.sel;
    });
    if (!f.plikz && o.dim !== "plikz") f.plikz = ["Ist"];
    return f;
  }
  function wert(o, k, el2) {
    const f = filter(o);
    return WUERFEL.reduce((s, r) => (Object.entries(f).every(([d, v]) => v.includes(r[d])) && (!el2 || r[o.dim] === el2) ? s + r[k] : s), 0);
  }
  const fmt = (v, o) => zahl(v, o.nk || 0);
  function elemente(o) {
    let e = EL[o.dim].slice();
    if (o.nur && o.sel.length) e = e.filter(x => o.sel.includes(x));
    if (o.aus && o.aus.length) e = e.filter(x => !o.aus.includes(x));
    if (o.sort && o.kz && o.kz.length) {
      const k = o.kz[0], gerundet = x => Math.round(wert(o, k, x) * 10 ** (o.nk || 0));
      e.sort((a, b) => (gerundet(a) - gerundet(b)) * (o.sort === "ab" ? -1 : 1));
    }
    return e;
  }

  /* ---------- Darstellung ---------- */
  function zeichnen() {
    flaeche.querySelectorAll(".obj, .geist").forEach(e => e.remove());
    S.objekte.forEach(o => {
      const k = ["obj"];
      if (o.rahmen !== false) k.push("rahmen");
      if (o.grau) k.push("grau");
      if (o.sichtbar === false) k.push("blass");
      if (S.gewaehlt === o.id) k.push("gewaehlt");
      const d = el("div", { class: k.join(" "), id: o.id, style: `left:${o.x}px;top:${o.y}px`, "data-typ": o.typ }, flaeche);
      if (o.typ === "Text") {
        d.classList.remove("rahmen");
        if (o.rahmen === true) d.classList.add("rahmen");
        el("div", { class: "o-text" + (o.fett === false ? " normal" : ""), style: o.ausr ? `text-align:${o.ausr}` : "" }, d, o.text);
      } else if (o.typ === "Tabelle") tabelle(o, d);
      else if (o.typ === "Grafik") grafik(o, d);
      else if (o.typ === "Einzelfeld") einzelfeld(o, d);
      else if (LISTEN.includes(o.typ)) liste(o, d);
      else {
        el("div", { class: "o-kopf" }, d, o.typ);
        el("div", { class: "o-hinweis" }, d, o.typ === "Schaltfläche" || o.typ === "Tastenfeld" ? "Aktion zuweisen" : o.typ === "Bild" ? "Bilddatei zuweisen" : "Adresse zuweisen");
      }
      if (o.breite) d.style.minWidth = o.breite + "px";
    });
    // Position begrenzen: Objekte bleiben auf der Fläche
    S.objekte.forEach(o => {
      const d = $(o.id);
      o.x = Math.max(0, Math.min(o.x, FB - 2 - d.offsetWidth));
      o.y = Math.max(0, Math.min(o.y, FH - 2 - d.offsetHeight));
      d.style.left = o.x + "px"; d.style.top = o.y + "px";
    });
    if (S.demo) demoGeist();
    pfeile();
    demoPfeil();
  }
  function kopfText(o) { return o.dim ? DIMNAME[o.dim] : o.typ; }
  function liste(o, d) {
    el("div", { class: "o-kopf" }, d, kopfText(o));
    if (!o.dim) { el("div", { class: "o-hinweis" }, d, "Merkmal hierher ziehen"); return; }
    const quer = /Zeile|Horizontale/.test(o.typ);
    const box = el("div", { class: quer ? "o-quer" : "" }, d);
    const nurEins = /Menü|Option/.test(o.typ);
    const e = nurEins && !o.offen ? [o.sel[0] || EL[o.dim][0]] : elemente(o);
    e.forEach(x => {
      const z = el("div", { class: "o-el" + (o.sel.includes(x) ? " sel" : ""), "data-el": x }, box,
        (o.typ === "Kontrollkästchen" ? (o.sel.includes(x) ? "[x] " : "[ ] ") : "") + x);
      z.dataset.obj = o.id;
    });
  }
  function tabelle(o, d) {
    const kz = o.kz || [];
    el("div", { class: "o-unter" }, d, `Ist · ${kz.includes("Menge") && kz.length > 1 ? "Tsd. € bzw. Tsd. Stück" : kz.length ? EINHEIT(kz[0]) : "Kennzahl hierher ziehen"}`);
    if (!o.dim) { el("div", { class: "o-hinweis" }, d, "Merkmal hierher ziehen"); return; }
    const t = el("table", { class: "o-tab" }, d);
    const h = el("tr", {}, t);
    el("th", { style: `min-width:${o.breite ? 0 : 96}px` }, h, DIMNAME[o.dim]);
    kz.forEach(k => el("th", { style: `min-width:${o.spalte || 80}px` }, h, k));
    const schlitz = S.demo && o.id === "o3";
    if (schlitz) el("th", { class: "schlitz", id: "schlitz-kopf" }, h, "");
    const e = elemente(o);
    const sum = kz.map(() => 0);
    e.forEach(x => {
      const r = el("tr", {}, t);
      el("td", { class: o.sel.includes(x) ? "sel" : "", "data-el": x, "data-obj": o.id }, r, x);
      kz.forEach((k, i) => {
        const v = Math.round(wert(o, k, x) * 10 ** (o.nk || 0)) / 10 ** (o.nk || 0);
        sum[i] += v;
        el("td", { style: o.ausr ? `text-align:${o.ausr}` : "" }, r, fmt(v, o));
      });
      if (schlitz) el("td", { class: "schlitz" }, r, "");
    });
    const r = el("tr", { class: "summe" }, t);
    el("td", {}, r, "Gesamt");
    sum.forEach(v => el("td", { style: o.ausr ? `text-align:${o.ausr}` : "" }, r, fmt(v, o)));
    if (schlitz) el("td", { class: "schlitz" }, r, "");
  }
  function grafik(o, d) {
    const k = (o.kz || [])[0];
    el("div", { class: "o-unter" }, d, k ? `${k}, ${EINHEIT(k)}` : "Kennzahl hierher ziehen");
    if (!o.dim || !k) { el("div", { class: "o-hinweis" }, d, o.dim ? "Kennzahl hierher ziehen" : "Merkmal hierher ziehen"); return; }
    const g = el("div", { class: "o-balken" }, d);
    const e = elemente(o), w = e.map(x => wert(o, k, x)), max = Math.max(1, ...w);
    e.forEach((x, i) => {
      el("div", {}, g, x);
      const z = el("div", {}, g);
      el("div", { class: "b", style: `width:${Math.max(1, Math.round(w[i] / max * 150))}px` }, z);
      el("div", { class: "w" }, g, fmt(w[i], o));
    });
  }
  function einzelfeld(o, d) {
    const k = (o.kz || [])[0];
    el("div", { class: "o-unter" }, d, k ? `${k}, ${EINHEIT(k)}` : "Einzelfeld");
    if (!k) { el("div", { class: "o-hinweis" }, d, "Kennzahl hierher ziehen"); return; }
    el("div", { class: "o-wert" }, d, fmt(wert(o, k), o));
  }
  // Druckfassung: „Skonto“ wird gerade in die Tabelle gezogen
  function demoGeist() {
    const k = $("schlitz-kopf");
    if (!k) return;
    const t = $("o3");
    el("div", { class: "geist", id: "geist", style: `left:${t.offsetLeft + k.offsetLeft + 22}px;top:${t.offsetTop + k.offsetTop + 10}px` }, flaeche, "Skonto");
  }
  const relativ = (e, bezug) => {
    const a = e.getBoundingClientRect(), b = bezug.getBoundingClientRect(), sk = b.width / bezug.offsetWidth;
    return { x: (a.left - b.left) / sk, y: (a.top - b.top) / sk, w: a.width / sk, h: a.height / sk };
  };
  function demoPfeil() {
    const p = $("demo-pfeil");
    p.textContent = "";
    const g = $("geist"), q = S.demo && document.querySelector('#felder .fl[data-feld="Auftrag.Skonto"]');
    if (!g || !q || !q.offsetParent || !g.offsetParent) return;
    p.setAttribute("height", maske.offsetHeight);
    const a = relativ(q, maske), b = relativ(g, maske);
    const xr = 721, y0 = a.y + a.h / 2, y1 = b.y + b.h / 2, x0 = a.x + a.w + 2, x1 = b.x + b.w + 9;
    sv("polyline", { points: `${x0},${y0} ${xr},${y0} ${xr},${y1} ${x1},${y1}`, fill: "none", stroke: "#3A3F44", "stroke-width": 1.5 }, p);
    sv("polygon", { points: `${x1 - 8},${y1} ${x1 + 1},${y1 - 4.5} ${x1 + 1},${y1 + 4.5}`, fill: "#3A3F44" }, p);
  }
  // Verbindungen: Auswahlobjekte → Datenobjekte (nur mit „Pfeile“)
  function pfeile() {
    verb.textContent = "";
    if (!S.pfeile) return;
    S.objekte.filter(l => LISTEN.includes(l.typ) && l.dim).forEach(l => {
      S.objekte.filter(o => DATEN.includes(o.typ) && !o.lokal && o.dim !== l.dim).forEach(o => {
        const a = $(l.id), b = $(o.id);
        const ax = a.offsetLeft + a.offsetWidth, ay = a.offsetTop + 11, bx = b.offsetLeft, by = b.offsetTop + 11;
        const xm = Math.round((ax + bx) / 2);
        const pts = bx > ax + 12 ? `${ax},${ay} ${xm},${ay} ${xm},${by} ${bx - 1},${by}` : `${a.offsetLeft + 20},${a.offsetTop + a.offsetHeight} ${a.offsetLeft + 20},${by} ${bx - 1},${by}`;
        sv("polyline", { points: pts, fill: "none", stroke: "#3A3F44", "stroke-width": 1.5, "stroke-dasharray": "4 3" }, verb);
        sv("polygon", { points: `${bx - 1},${by} ${bx - 9},${by - 4} ${bx - 9},${by + 4}`, fill: "#3A3F44" }, verb);
      });
    });
  }

  /* ---------- Objektpalette, Tabellen und Felder ---------- */
  const palette = $("objekte");
  OBJEKTARTEN.forEach(t => {
    const q = el("div", { class: "oq", "data-art": t, tabindex: "0", role: "button", title: `${t}: in den Bericht ziehen oder Enter` }, palette, t);
    if (PRINT) { q.removeAttribute("tabindex"); q.removeAttribute("role"); return; }
    ziehbar(q, () => t, ziel => ablegen({ art: t }, ziel));
    q.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); ablegen({ art: t }, frei()); } });
    q.addEventListener("dblclick", () => ablegen({ art: t }, frei()));
  });
  let tabAktiv = "Auftrag";
  function tabellenListe() {
    const t = $("tabellen");
    t.textContent = "";
    Object.keys(TABELLEN).forEach(n => {
      const z = el("div", { class: "tl" + (n === tabAktiv ? " aktiv" : ""), id: "tab-" + n, tabindex: PRINT ? "-1" : "0" }, t, n);
      if (PRINT) { z.removeAttribute("tabindex"); return; }
      const w = () => { tabAktiv = n; tabellenListe(); felderListe(); demoPfeil(); };
      z.addEventListener("click", w);
      z.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); w(); } });
    });
  }
  function felderListe() {
    const f = $("felder"), T = TABELLEN[tabAktiv];
    f.textContent = "";
    $("felder-kopf").textContent = `Felder der Tabelle ${tabAktiv}`;
    const gruppe = (titel, liste, kz) => {
      if (!liste.length) return;
      el("div", { class: "art" }, f, titel);
      liste.forEach(n => {
        const key = `${tabAktiv}.${n}`;
        const z = el("div", { class: "fl" + (kz ? " kz" : "") + (S.demo && key === "Auftrag.Skonto" ? " quelle" : ""), "data-feld": key,
          id: "feld-" + key.replace(/\W/g, ""), tabindex: "0",
          title: `${kz ? "Kennzahl" : "Merkmal"} ${n} – in den Bericht oder auf ein Objekt ziehen` }, f, n);
        if (PRINT) { z.removeAttribute("tabindex"); return; }
        const quelle = { feld: n, tab: tabAktiv, kz };
        ziehbar(z, () => n, ziel => ablegen(quelle, ziel));
        z.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); ablegen(quelle, S.gewaehlt ? { obj: S.gewaehlt } : frei()); } });
        z.addEventListener("dblclick", () => ablegen(quelle, S.gewaehlt ? { obj: S.gewaehlt } : frei()));
      });
    };
    gruppe("Merkmale", T.m, false);
    gruppe("Kennzahlen (kursiv)", T.k, true);
  }
  tabellenListe();
  felderListe();

  /* ---------- Ablegen: was beim Drop entsteht ---------- */
  function frei() {                                           // freier Platz unten links, Objekte stapeln sich versetzt
    const n = S.objekte.length;
    return { x: 16 + (n % 5) * 14, y: 160 + (n % 5) * 8 };
  }
  function neu(typ, x, y, extra = {}) {
    const o = Object.assign({ id: "o" + S.naechste++, typ, x: Math.round(x), y: Math.round(y), sel: [] }, extra);
    S.objekte.push(o);
    S.gewaehlt = o.id;
    return o;
  }
  function ablegen(q, ziel) {
    if (!ziel) return;
    S.demo = false;
    merken();
    let o = ziel.obj ? obj(ziel.obj) : null, text = "";
    if (q.art) {                                              // Objektart aus der Palette
      const extra = q.art === "Text" ? { text: "Text", rahmen: false } : q.art === "Tabelle" || q.art === "Grafik" || q.art === "Einzelfeld" ? { kz: [] } : {};
      const p = o ? { x: o.x + 24, y: o.y + 24 } : ziel;
      o = neu(q.art, p.x, p.y, extra);
      text = `Objekt ${q.art} eingefügt – Felder aus der Datenbank darauf ziehen.`;
    } else {
      const key = `${q.tab}.${q.feld}`, dim = DIM[key];
      if (!q.kz && !dim) { verlauf.pop(); MK.meldung(`Für ${key} sind in der Beispielmaske keine Elemente hinterlegt – z. B. Kundenbezirk, Bezeichnung, Farbe oder PLIKZ ziehen.`); return; }
      if (!o) {
        o = q.kz ? neu("Einzelfeld", ziel.x, ziel.y, { kz: [q.feld] }) : neu("Spalte", ziel.x, ziel.y, { dim });
        text = q.kz ? `Einzelfeld ${q.feld} angelegt.` : `Spalte ${DIMNAME[dim]} angelegt – Elemente anklicken, um verbundene Objekte zu filtern.`;
      } else if (q.kz) {
        if (o.typ === "Tabelle") {
          o.kz = o.kz || [];
          if (o.kz.includes(q.feld)) text = `${q.feld} steht schon in der Tabelle.`;
          else { if (o.kz.length >= 4) o.kz.pop(); o.kz.push(q.feld); text = `${q.feld} als Wertspalte in die Tabelle übernommen.`; }
        } else if (o.typ === "Grafik" || o.typ === "Einzelfeld") { o.kz = [q.feld]; text = `${o.typ} zeigt jetzt ${q.feld}.`; }
        else if (LISTEN.includes(o.typ) && o.dim) { o.typ = "Tabelle"; o.kz = [q.feld]; text = `Aus der Spalte ${DIMNAME[o.dim]} wird eine Tabelle mit ${q.feld}.`; }
        else { verlauf.pop(); MK.meldung(`Eine Kennzahl passt nicht auf das Objekt ${o.typ} – auf Tabelle, Grafik oder Einzelfeld ziehen.`); return; }
      } else {
        if (DATEN.includes(o.typ) || LISTEN.includes(o.typ)) {
          if (o.typ === "Einzelfeld") { verlauf.pop(); MK.meldung("Ein Einzelfeld zeigt nur eine Kennzahl – Merkmal auf eine Tabelle oder freie Fläche ziehen."); return; }
          o.dim = dim; o.sel = []; o.nur = false; o.aus = [];
          text = `${o.typ} gliedert jetzt nach ${DIMNAME[dim]}.`;
        } else { verlauf.pop(); MK.meldung(`Auf das Objekt ${o.typ} lässt sich kein Merkmal ziehen.`); return; }
      }
      S.gewaehlt = o.id;
    }
    zeichnen(); felderListe();
    MK.meldung(text);
  }

  /* ---------- Ziehen mit Zeiger (Maus, Stift, Finger) ---------- */
  function zielBei(x, y, ohne) {
    const r = flaeche.getBoundingClientRect();
    if (x < r.left || x > r.right || y < r.top || y > r.bottom) return null;
    const sk = r.width / flaeche.offsetWidth;
    const treffer = document.elementsFromPoint(x, y).map(e => e.closest && e.closest(".obj")).find(e => e && e.id !== ohne);
    return treffer ? { obj: treffer.id } : { x: (x - r.left) / sk - 8, y: (y - r.top) / sk - 8 };
  }
  function ziehbar(q, text, fertig) {
    q.addEventListener("pointerdown", e => {
      if (e.button !== 0) return;
      e.preventDefault(); q.focus();
      const x0 = e.clientX, y0 = e.clientY;
      let geist = null, ziel = null, markiert = null;
      const bewegen = ev => {
        if (!geist && Math.hypot(ev.clientX - x0, ev.clientY - y0) < 5) return;
        if (!geist) {
          geist = el("div", { class: "zieh-geist" }, document.body, text());
          const sk = $("seite").getBoundingClientRect().width / maske.offsetWidth;
          geist.style.fontSize = 14 * sk + "px"; geist.style.lineHeight = 18 * sk + "px";
          if (S.demo) { S.demo = false; zeichnen(); felderListe(); }
        }
        geist.style.left = ev.clientX + 12 + "px"; geist.style.top = ev.clientY + 10 + "px";
        ziel = zielBei(ev.clientX, ev.clientY);
        const m = ziel && ziel.obj ? $(ziel.obj) : null;
        if (markiert && markiert !== m) markiert.classList.remove("ziel");
        if (m) m.classList.add("ziel");
        markiert = m;
      };
      const ende = () => {
        removeEventListener("pointermove", bewegen); removeEventListener("pointerup", ende); removeEventListener("pointercancel", ende);
        if (markiert) markiert.classList.remove("ziel");
        if (!geist) return;
        geist.remove();
        fertig(ziel);
      };
      addEventListener("pointermove", bewegen); addEventListener("pointerup", ende); addEventListener("pointercancel", ende);
    });
  }
  // Objekte verschieben, wählen, Elemente anklicken
  if (!PRINT) flaeche.addEventListener("pointerdown", e => {
    const d = e.target.closest(".obj");
    if (!d) { if (S.gewaehlt) { S.gewaehlt = null; zeichnen(); } return; }
    e.preventDefault();
    const o = obj(d.id), r = flaeche.getBoundingClientRect(), sk = r.width / flaeche.offsetWidth;
    const x0 = e.clientX, y0 = e.clientY, ox = o.x, oy = o.y;
    const elem = e.target.closest("[data-el]");
    let bewegt = false;
    const bewegen = ev => {
      const dx = (ev.clientX - x0) / sk, dy = (ev.clientY - y0) / sk;
      if (!bewegt && Math.hypot(dx, dy) < 4) return;
      if (!bewegt) { bewegt = true; merken(); S.demo = false; }
      o.x = Math.round(ox + dx); o.y = Math.round(oy + dy);
      d.style.left = o.x + "px"; d.style.top = o.y + "px";
      pfeile();
    };
    const ende = () => {
      removeEventListener("pointermove", bewegen); removeEventListener("pointerup", ende); removeEventListener("pointercancel", ende);
      if (!bewegt && elem && o.sel && o.selektion !== false) {
        merken();
        const x = elem.dataset.el;
        if (/Menü|Option/.test(o.typ)) o.sel = [x];
        else o.sel = o.sel.includes(x) ? o.sel.filter(v => v !== x) : o.sel.concat(x);
      }
      if (S.demo && !bewegt) S.demo = false;
      S.gewaehlt = o.id;
      zeichnen(); felderListe();
    };
    addEventListener("pointermove", bewegen); addEventListener("pointerup", ende); addEventListener("pointercancel", ende);
  });
  addEventListener("keydown", e => {
    if ((e.key === "Delete" || e.key === "Backspace") && S.gewaehlt && !/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) {
      e.preventDefault(); merken();
      S.objekte = S.objekte.filter(o => o.id !== S.gewaehlt); S.gewaehlt = null; S.demo = false;
      zeichnen(); felderListe(); MK.meldung("Objekt gelöscht – „Zurück“ stellt es wieder her.");
    }
  });

  /* ---------- Werkzeuge ---------- */
  const brauchtObjekt = () => { const o = S.gewaehlt && obj(S.gewaehlt); if (!o) MK.meldung("Bitte zuerst ein Objekt im Bericht anklicken."); return o; };
  const FUNK = {
    zurueck: () => { if (!verlauf.length) return "Nichts rückgängig zu machen."; vorwaerts.push(kopie(S)); S = verlauf.pop(); return "Letzter Schritt zurückgenommen."; },
    vor: () => { if (!vorwaerts.length) return "Kein Schritt zum Wiederholen."; verlauf.push(kopie(S)); S = vorwaerts.pop(); return "Schritt wiederholt."; },
    start: () => { merken(); const d = S.demo; S = START(); S.demo = d; return "Bericht im Startzustand."; },
    pfeile: () => { S.pfeile = !S.pfeile; $("k-pfeile").setAttribute("aria-pressed", String(S.pfeile));
      return S.pfeile ? "Verbindungen sichtbar: Auswahl in Spalten filtert die Tabellen, Grafiken und Einzelfelder." : "Verbindungspfeile ausgeblendet."; },
    lokal: o => { o.lokal = !o.lokal; return o.lokal ? `${o.typ} rechnet lokal – ohne Filter aus verbundenen Objekten.` : `${o.typ} folgt wieder den Verbindungen.`; },
    optimieren: () => `Abfragen zusammengefasst: ${S.objekte.filter(o => DATEN.includes(o.typ)).length} Datenobjekte, ein Datenbankzugriff.`,
    sortierung: o => { if (!o.kz || !o.kz.length) return "Sortiert werden Tabellen und Grafiken nach ihrer ersten Kennzahl.";
      o.sort = o.sort === "ab" ? "auf" : o.sort === "auf" ? null : "ab";
      return o.sort ? `${o.typ} nach ${o.kz[0]} ${o.sort === "ab" ? "absteigend" : "aufsteigend"} sortiert.` : "Sortierung aufgehoben."; },
    nur: o => { if (!o.sel || !o.sel.length) return "Zuerst Elemente im Objekt anklicken."; o.nur = true; o.aus = []; return `Nur ${o.sel.join(", ")} sichtbar.`; },
    aus: o => { if (!o.sel || !o.sel.length) return "Zuerst Elemente im Objekt anklicken."; o.aus = (o.aus || []).concat(o.sel); o.sel = []; o.nur = false; return "Gewählte Elemente ausgeblendet."; },
    anfang: o => { anfang = { id: o.id, sel: (o.sel || []).slice(), aus: (o.aus || []).slice(), nur: !!o.nur }; return "Aktuelle Auswahl als Anfangszustand gespeichert."; },
    zuruecksetzen: o => { const a = anfang && anfang.id === o.id ? anfang : { sel: [], aus: [], nur: false };
      o.sel = a.sel.slice(); o.aus = a.aus.slice(); o.nur = a.nur; return "Auswahl auf den Anfangszustand zurückgesetzt."; },
    zeichensatz: o => { o.fett = o.fett === false; return o.fett === false ? "Schrift normal." : "Schrift fett."; },
    schriftfarbe: o => { o.grau = !o.grau; return o.grau ? "Fläche grau hinterlegt." : "Fläche weiß."; },
    ausrichtung: o => { o.ausr = o.ausr === "left" ? "center" : o.ausr === "center" ? null : "left"; return `Ausrichtung ${o.ausr === "left" ? "links" : o.ausr === "center" ? "zentriert" : "Standard (Zahlen rechts)"}.`; },
    farbe: o => { o.grau = !o.grau; return o.grau ? "Hintergrund grau." : "Hintergrund weiß."; },
    rahmen: o => { o.rahmen = o.rahmen === false; return o.rahmen ? "Rahmen ein." : "Rahmen aus."; },
    zahlenformat: o => { o.nk = o.nk ? 0 : 1; return `Zahlen mit ${o.nk} Nachkommastelle${o.nk === 1 ? "" : "n"}.`; },
    grafik: o => { if (o.typ === "Tabelle" && o.dim && o.kz && o.kz.length) { o.typ = "Grafik"; return `Tabelle als Balkengrafik (${o.kz[0]}).`; }
      if (o.typ === "Grafik") { o.typ = "Tabelle"; return "Grafik wieder als Tabelle."; } return "Grafik: zuerst eine Tabelle mit Kennzahl wählen."; },
    spalten: o => { o.spalte = o.spalte === 110 ? 80 : (o.spalte || 80) + 15; return `Spaltenbreite ${o.spalte} px.`; },
    sichtbar: o => { o.sichtbar = o.sichtbar === false; return o.sichtbar ? "Objekt im Bericht sichtbar." : "Objekt im Bericht unsichtbar (im Entwurf blass)."; },
    selektion: o => { o.selektion = o.selektion === false; return o.selektion ? "Elemente sind anklickbar." : "Elemente sind nicht mehr anklickbar."; },
    position: o => `Position ${o.x} / ${o.y} px, ${$(o.id).offsetWidth} × ${$(o.id).offsetHeight} px.`,
    eigenschaften: o => `${o.typ}${o.dim ? " · Merkmal " + DIMNAME[o.dim] : ""}${o.kz && o.kz.length ? " · Kennzahlen " + o.kz.join(", ") : ""}${o.lokal ? " · lokal" : ""}.`,
    "db-neu": () => "Neue Datenbankverbindung: in der Beispielmaske nicht hinterlegt.",
    "db-oeffnen": () => "Verbindung „Auftragsdatenbank“ ist geöffnet.",
    "db-info": () => "Auftragsdatenbank: 4 Tabellen, Würfel Kundenbezirk × Artikel × Farbe × Plan/Ist.",
    "db-offline": () => "Offline: Der Bericht rechnet mit zwischengespeicherten Werten.",
    "db-suchen": () => "Suchen: Feldnamen eingeben – in der Beispielmaske nicht hinterlegt.",
    "db-tabneu": () => "Neue Tabelle: in der Beispielmaske nicht hinterlegt.",
    "db-tabinfo": () => `Tabelle ${tabAktiv}: ${TABELLEN[tabAktiv].m.length} Merkmale, ${TABELLEN[tabAktiv].k.length} Kennzahlen.`,
    "db-browse": () => `Durchsuchen: Elemente der Tabelle ${tabAktiv} – Merkmal in den Bericht ziehen, um sie zu sehen.`,
    "db-feldinfo": () => "Feld-Info: Merkmale gliedern (Kundenbezirk, Farbe …), Kennzahlen sind Werte (kursiv).",
  };
  const OHNE_OBJEKT = ["zurueck", "vor", "start", "pfeile", "optimieren"];
  maske.querySelectorAll("button.wz").forEach(b => b.addEventListener("click", () => {
    const f = b.dataset.f;
    if (f.startsWith("db-") || OHNE_OBJEKT.includes(f)) { const t = FUNK[f](); zeichnen(); felderListe(); MK.meldung(t); return; }
    const o = brauchtObjekt();
    if (!o) return;
    merken();
    const t = FUNK[f](o);
    zeichnen(); MK.meldung(t);
  }));
  $("f-verbindung").addEventListener("change", e => {
    if (e.target.value !== "auftrag") { MK.meldung("Beispielmaske: Nur die Auftragsdatenbank ist hinterlegt."); e.target.value = "auftrag"; }
  });

  /* ---------- Klappen ohne Maßstabssprung (wie Abb. 3.7), Pfeil der Druckfassung nachziehen ---------- */
  if (!PRINT) {
    const seite = $("seite"), rahmen = seite.parentElement;
    let alt = null;
    const merkenK = e => { if (e.target.closest && e.target.closest(".mk-band")) alt = seite.style.transform; };
    const halten = e => {
      if (alt === null || !(e.target.closest && e.target.closest(".mk-band"))) return;
      const s = parseFloat((/scale\(([\d.]+)\)/.exec(alt) || [0, 1])[1]);
      seite.style.transform = alt; alt = null;
      rahmen.style.width = maske.offsetWidth * s + "px"; rahmen.style.height = maske.offsetHeight * s + "px";
      demoPfeil();
      if (MK._ebenenNeu) MK._ebenenNeu();
    };
    ["click", "keydown"].forEach(t => { maske.addEventListener(t, merkenK, true); maske.addEventListener(t, halten); });
  }
  zeichnen();

  /* ---------- Lernplattform: Erläuterungen und Gestaltung ---------- */
  MK.ebenen({
    erlaeuterungen: {
      titel: "Erläuterungen",
      intro: "Wie ein Bericht im Reportgenerator per Drag & Drop entsteht. Ziehen Sie Objekte und Felder in den Bericht, klicken Sie Elemente einer Spalte an und probieren Sie die Werkzeuge am gewählten Objekt.",
      eintraege: [
        { nr: 1, ziel: "g-objekte", versatz: [-4, 2], titel: "Berichtsobjekte",
          text: "Tabelle, Spalte, Zeile, Einzelfeld, Grafik, Auswahlobjekte wie Menü oder Optionsfeld sowie Text, Bild und Schaltfläche werden aus der Palette in den Bericht gezogen und dort frei angeordnet." },
        { nr: 2, ziel: "g-felder", versatz: [-4, 2], titel: "Datenbank: Merkmale und Kennzahlen",
          text: "Die Verbindung öffnet die Datenbank (hier die Auftragsdatenbank aus Abb. 5.40). Zu jeder Tabelle stehen ihre Felder bereit: Merkmale gliedern den Bericht, Kennzahlen (kursiv) liefern die Werte." },
        { nr: 3, ziel: "geist", versatz: [0, -24], titel: "Drag & Drop",
          text: "Ein Feld auf eine Tabelle gezogen ergibt eine neue Wertspalte – im Bild wird „Skonto“ gerade in die Tabelle gezogen. Auf freier Fläche wird aus einem Merkmal eine Spalte, aus einer Kennzahl ein Einzelfeld. Programmieren muss niemand." },
        { nr: 4, ziel: "o3", anker: "links", versatz: [6, 40], titel: "Tabelle mit Gesamtzeile",
          text: "Die Tabelle gliedert nach Kundenbezirk und zeigt Umsatz und Rabatt im Ist in Tsd. €; die Gesamtzeile rechnet der Generator selbst. Ziehen Sie z. B. „Bezeichnung“ auf die Tabelle, gliedert sie nach Artikeln." },
        { nr: 5, ziel: "o2", versatz: [12, 1], titel: "Auswahl und Verbindungen",
          text: "Die Spalte „Farbe“ ist ein Auswahlobjekt: Ein Klick auf Braunglas filtert alle verbundenen Objekte. „Pfeile“ zeigt diese Verbindungen; im Original waren Datenbank- und Sortierverbindungen rot bzw. blau gekennzeichnet." },
        { nr: 6, ziel: "g-verbindungen", versatz: [-4, 2], titel: "Verbindungen",
          text: "Zurück und Vor nehmen Schritte zurück bzw. wiederholen sie, Start stellt den Ausgangsbericht her. „Lokal“ löst ein Objekt aus den Verbindungen, „Sortierung“ ordnet nach der ersten Kennzahl." },
        { nr: 7, ziel: "g-hierarchie", versatz: [-4, 2], titel: "Hierarchie",
          text: "Angeklickte Elemente lassen sich allein zeigen oder ausblenden; der Anfangszustand speichert eine Auswahl, „Zurücksetzen“ stellt sie wieder her – so entstehen Drill-down und Ausschnitte ohne neue Abfrage." },
        { nr: 8, ziel: "g-format", versatz: [-4, 2], titel: "Formatierung",
          text: "Die Formatierung gilt für das gewählte Objekt: Schrift, Ausrichtung, Hintergrund, Rahmen, Zahlenformat, Spaltenbreite, Sichtbarkeit und Selektion. „Grafik“ stellt eine Tabelle als Balkengrafik dar." },
      ],
    },
    gestaltung: {
      titel: "Gestaltung",
      intro: "Was gegenüber dem Original geändert wurde – softwareneutral im Buchstil und nach den Interaktionsprinzipien der DIN EN ISO 9241-110.",
      eintraege: [
        { nr: "A", ziel: "kopf-titel", versatz: [-4, 4], regel: "BUCHSTIL – SOFTWARENEUTRAL", titel: "Kein Programmfenster",
          text: "Fensterrahmen, Menüleiste, die Symbolleiste (Neu, Öffnen, Sichern … Zoom), Statusleiste, Produktname und der Texturhintergrund der Arbeitsfläche entfallen. Übrig bleiben die Werkzeuge und der Bericht." },
        { nr: "B", ziel: "band-werkzeuge", versatz: [-24, 2], regel: "ERWARTUNGSKONFORMITÄT", titel: "Feste Gruppen statt schwebender Fenster",
          text: "Die schwebenden Werkzeugfenster stehen als feste Gruppen in der Lage des Originals: Verbindungen und Hierarchie oben links, Formatierung darunter, Objekte und Datenbank unten. Nichts verdeckt den Bericht." },
        { nr: "C", ziel: "g-format", versatz: [-4, 2], regel: "SELBSTBESCHREIBUNGSFÄHIGKEIT", titel: "Text statt Symbol",
          text: "Die Symbole entfallen, die abgeschnittenen Beschriftungen („Zeichen..“, „Schriftf..“, „Positioni..“, „Eigensc..“) sind ausgeschrieben. Grau dargestellte, inaktive Werkzeuge melden jetzt, worauf sie wirken." },
        { nr: "D", ziel: "schlitz-kopf", versatz: [26, -14], regel: "AUFGABENANGEMESSENHEIT", titel: "Drag & Drop sichtbar",
          text: "Das Original zeigte einen leeren Entwurf. Jetzt zeigt das Bild einen Bericht im Aufbau: Das gezogene Feld, die gestrichelte Zielspalte und der Pfeil von der Feldliste machen die Aussage der Caption sichtbar." },
        { nr: "E", ziel: "felder-kopf", versatz: [-4, 2], regel: "SELBSTBESCHREIBUNGSFÄHIGKEIT", titel: "Merkmale und Kennzahlen getrennt",
          text: "Die leeren Listen „Tabellen“ und „Felder“ des Originals sind gefüllt; die Felder stehen getrennt nach Merkmalen und Kennzahlen, damit klar ist, was gliedert und was rechnet." },
        { nr: "F", ziel: "g-tabellen", versatz: [-4, 2], regel: "STEUERBARKEIT", titel: "Ziehen, Doppelklick oder Tastatur",
          text: "Objekte und Felder lassen sich ziehen, doppelklicken oder mit Tabulator und Enter einfügen; Entf löscht das gewählte Objekt, „Zurück“ nimmt jeden Schritt zurück." },
        { nr: "G", ziel: "o1", versatz: [26, 0], regel: "ROBUSTHEIT GEGEN BENUTZUNGSFEHLER", titel: "Meldung statt Fehler",
          text: "Passt ein Feld nicht auf das Zielobjekt – etwa ein Merkmal auf ein Einzelfeld –, erklärt eine Meldung, wohin es gehört; der Bericht bleibt unverändert. Objekte bleiben stets auf der Berichtsfläche." },
        { nr: "H", ziel: "kopf-unter", versatz: [-4, 2], regel: "BUCHSTIL – NEUTRAL UND AKTUELL", titel: "Grau statt Farbe, erfundene Werte",
          text: "Dunkelblaue Kopfzeilen, gelbe Fläche und die farbige Pfeillegende der Statusleiste entfallen. Bericht und Werte sind erfunden und nutzen die Datenbank aus Abb. 5.40; der Titel „Ohne Titel 1“ wird zum Bericht „Erlösschmälerungen“." },
      ],
    },
  });
  MK.fertig();
})();
