/* Dashboard „Forderungs-Cockpit“ – Abb. 4.21 (Bericht im Webbrowser) und Abb. 4.22 (derselbe Bericht als
   Registerkarte im Kanal eines Kollaborationswerkzeugs, mit Unterhaltung daneben). Seite 1024 x 646 px.
   Daten: forderungen.json (daten_forderungen.py) – Ausgangsrechnungen mit Fälligkeit und Zahlungseingang; die offenen
   Posten je Monatsultimo, Überfälligkeit, Fälligkeitsband und Mahnstufe rechnet dieses Skript.
   Inhalte wie im Original: Forderungen, überfällige Forderungen, Anzahl offener Posten, Forderungsreichweite (DSO),
   gemahnte Forderungen; offene Posten nach Fälligkeit, Mahnstufe, Sammelkonto und Debitor. Neu: überfällige Posten
   je Monatsultimo (Zeitvergleich). Klick auf Band, Mahnstufe oder Debitor filtert die übrigen Visuals (das angeklickte
   hebt hervor), Klick auf ein Sammelkonto wirkt wie der Datenschnitt, Klick auf einen Monat wählt den Stichtag, Esc hebt auf.
   Abb. 4.21 und 4.22 verwenden diese Datei unverändert bis auf UMGEBUNG.
   Revision 13.11.2026 (Abb. 4.21): In der interaktiven Fassung listet „Offene Posten nach Debitor“ alle Debitoren in
   einer Bildlaufliste; ein Klick auf einen Debitor filtert wie bisher und klappt seine offenen Posten bis auf den
   einzelnen Beleg auf (Rechnungsdatum, Fälligkeit, Tage überfällig, Mahnstufe, Betrag). Die Druckfassung bleibt bei
   Top 6 und „Übrige“. */
(() => {
  "use strict";
  const UMGEBUNG = "browser";                    // Abb. 4.21: "browser" · Abb. 4.22: "kanal"
  const KANAL = UMGEBUNG === "kanal";
  const { zahl, delta, wirkung, FARBE, NBSP, sv, el, tw } = DK;
  const ST = DATA.stichtage, NS = ST.length, DEB = DATA.debitoren, KON = DATA.konten;
  const T0 = Date.parse(DATA.start + "T00:00:00Z");
  const dat = (t, jahr = true) => { const d = new Date(T0 + t * 864e5);
    return `${String(d.getUTCDate()).padStart(2, "0")}.${String(d.getUTCMonth() + 1).padStart(2, "0")}.${jahr ? d.getUTCFullYear() : ""}`; };
  const MON = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
  const monat = (m, lang = false) => { const d = new Date(T0 + ST[m] * 864e5), n = MON[d.getUTCMonth()];
    return lang ? `${n} ${d.getUTCFullYear()}` : n.slice(0, 3); };
  const R = DATA.rechnungen.map(([b, di, rd, fd, c, zd]) => ({ b, di, k: DEB[di][2], rd, fd, c, zd }));
  const UE = "var(--ac)", NF = "#D4D4D4";                    // überfällig anthrazit, noch nicht fällig hellgrau
  const BAENDER = [
    { key: 0, kurz: "> 28", lang: "über 28 Tage überfällig", ue: true },
    { key: 1, kurz: "15–28", lang: "15–28 Tage überfällig", ue: true },
    { key: 2, kurz: "1–14", lang: "1–14 Tage überfällig", ue: true },
    { key: 3, kurz: "0–7", lang: "fällig in 0–7 Tagen", ue: false },
    { key: 4, kurz: "8–14", lang: "fällig in 8–14 Tagen", ue: false },
    { key: 5, kurz: "15–21", lang: "fällig in 15–21 Tagen", ue: false },
    { key: 6, kurz: "22–30", lang: "fällig in 22–30 Tagen", ue: false },
  ];
  const STUFEN = ["ohne Mahnung", "Mahnstufe 1", "Mahnstufe 2", "Mahnstufe 3"];
  const STUFE_TAGE = ["bis 7 Tage überfällig oder nicht fällig", "8–21 Tage überfällig", "22–35 Tage überfällig", "über 35 Tage überfällig"];
  const TOP = DK.PRINT ? 6 : Infinity;          // interaktiv: alle Debitoren in der Bildlaufliste
  const tsd = c => zahl(c / 1e5, 0);
  const pz = (a, b, nk = 1) => (b ? zahl(a / b * 100, nk) : "–") + NBSP + "%";
  const pd = (a, b) => (b ? delta((a / b - 1) * 100, 1, NBSP + "%") : "–");
  const passt = (k, breite) => k.find(t => tw(t) <= breite) || k[k.length - 1];
  const summe = (l, f = x => x.c) => l.reduce((s, x) => s + f(x), 0);

  /* ---------- offene Posten je Stichtag ---------- */
  const OP = ST.map(t => R.filter(r => r.rd <= t && (r.zd < 0 || r.zd > t)).map(r => {
    const tage = t - r.fd, bis = r.fd - t;
    const band = tage > 28 ? 0 : tage > 14 ? 1 : tage > 0 ? 2 : bis <= 7 ? 3 : bis <= 14 ? 4 : bis <= 21 ? 5 : 6;
    const stufe = tage <= 7 ? 0 : tage <= 21 ? 1 : tage <= 35 ? 2 : 3;
    return { ...r, tage, band, stufe, ue: tage > 0 };
  }));

  /* ---------- Zustand ---------- */
  const S = { m: NS - 1, konto: null, sel: null };
  addEventListener("keydown", e => {
    if (e.key !== "Escape") return;
    if (S.sel) S.sel = null; else if (S.konto !== null) S.konto = null; else return;
    zeichnen();
  });
  const waehlen = (typ, key) => { S.sel = S.sel && S.sel.typ === typ && S.sel.key === key ? null : { typ, key }; zeichnen(); };
  const kontoSetzen = k => { S.konto = S.konto === k ? null : k; if (S.sel && S.sel.typ === "deb") S.sel = null; zeichnen(); };

  // Rangfolge der Debitoren im Stichtag (nur Kontofilter): Top 6 einzeln, Rest als „Übrige“
  function rangfolge(m) {
    const je = new Map();
    OP[m].forEach(o => { if (S.konto === null || o.k === S.konto) je.set(o.di, (je.get(o.di) || 0) + o.c); });
    const r = [...je.entries()].sort((a, b) => b[1] - a[1]).map(x => x[0]);
    return { top: r.slice(0, TOP), rest: new Set(r.slice(TOP)) };
  }
  let RANG = rangfolge(S.m);
  const debPasst = (di, key) => (key === "rest" ? RANG.rest.has(di) : di === key);
  function passtSel(o, sel) {
    if (sel.typ === "band") return o.band === sel.key;
    if (sel.typ === "stufe") return o.stufe === sel.key;
    return debPasst(o.di, sel.key);
  }
  // ohne: Auswahltyp des Visuals, das selbst hervorhebt statt zu filtern
  const filt = (o, ohne) => (ohne === "konto" || S.konto === null || o.k === S.konto) &&
                            (!S.sel || S.sel.typ === ohne || passtSel(o, S.sel));
  const posten = (m, ohne) => OP[m].filter(o => filt(o, ohne));
  // Forderungsreichweite: Forderungen / Umsatz der letzten 90 Tage x 90 (nur Sammelkonto und Debitor filtern)
  function dso(m, roh = false) {
    const t = ST[m], deb = !roh && S.sel && S.sel.typ === "deb" ? S.sel.key : null, konto = roh ? null : S.konto;
    const ok = r => (konto === null || r.k === konto) && (deb === null || debPasst(r.di, deb));
    const um = summe(R.filter(r => ok(r) && r.rd > t - 90 && r.rd <= t));
    return um ? summe(OP[m].filter(ok)) / um * 90 : null;
  }
  function kennzahlen(m) {
    const p = posten(m);
    return { ges: summe(p), ue: summe(p.filter(o => o.ue)), n: p.length, dso: dso(m), gem: summe(p.filter(o => o.stufe > 0)),
             ue28: summe(p.filter(o => o.band === 0)) };
  }

  /* ---------- Layout ---------- */
  DK.init({ titel: "Forderungs-Cockpit" });
  const L = KANAL
    ? { kopf: [16, 48, 730, 46], h1: 100, filter: [16, 106, 730, 50], kpis: [16, 162, 730, 68], h2: 236, re: 278,
        A: [16, 244, 420, 186], hL: 438, E: [16, 446, 420, 196], B: [456, 244, 290, 150], hB: 400,
        C: [456, 406, 290, 118], hC: 530, D: [456, 536, 290, 106] }
    : { kopf: [16, 10, 992, 46], h1: 62, filter: [16, 68, 992, 50], kpis: [16, 128, 992, 68], h2: 206, re: 16,
        A: [16, 216, 600, 206], hL: 430, E: [16, 438, 600, 204], B: [636, 216, 372, 156], hB: 380,
        C: [636, 388, 372, 122], hC: 518, D: [636, 526, 372, 116] };
  const seite = document.getElementById("seite");
  if (KANAL) kanalRahmen();
  const bKopf = DK.box("kopf", ...L.kopf);
  DK.haarlinie(L.h1, 16, L.re);
  const bFilter = DK.box("filter", ...L.filter, "dk-filter");
  const bKpi = DK.box("kpis", ...L.kpis);
  DK.haarlinie(L.h2, 16, L.re);
  const bA = DK.box("v-faelligkeit", ...L.A);
  DK.haarlinie(L.hL, 16, 1024 - L.A[0] - L.A[2]);
  const bE = DK.box("v-debitoren", ...L.E);
  const bB = DK.box("v-verlauf", ...L.B);
  DK.haarlinie(L.hB, L.B[0], L.re);
  const bC = DK.box("v-mahnstufe", ...L.C);
  DK.haarlinie(L.hC, L.B[0], L.re);
  const bD = DK.box("v-konto", ...L.D);
  let bU = null;
  if (KANAL) bU = DK.box("unterhaltung", 776, 48, 232, 594);

  /* ---------- Rahmen des Kollaborationswerkzeugs (nur Abb. 4.22): Kanal, Registerkarten, Unterhaltung ---------- */
  function kanalRahmen() {
    DK.el("style", {}, document.head, `
      #kanal { font-size: 14px; }
      #kanal .kn-name { position: absolute; left: 0; top: 11px; font-size: 16px; font-weight: bold; }
      #kanal .kn-name span { font-weight: normal; color: var(--muted); }
      #kanal .kn-reiter { position: absolute; top: 0; height: 40px; display: flex; gap: 22px; }
      #kanal .kn-reiter div { padding-top: 12px; color: var(--muted); }
      #kanal .kn-reiter div.an { color: var(--text); font-weight: bold; border-bottom: 3px solid var(--ac); }
      #unterhaltung { display: flex; flex-direction: column; }
      #unterhaltung .un-kopf { font-size: 16px; font-weight: bold; }
      #unterhaltung .un-unter { color: var(--muted); margin: 2px 0 6px; }
      #unterhaltung .un-liste { flex: 1 1 auto; overflow: hidden; }
      #unterhaltung .un-tag { color: var(--muted); text-align: center; padding: 4px 0 6px; border-top: 1px solid var(--linie); }
      #unterhaltung .un-msg { padding: 8px 0 9px; border-top: 1px solid #EFEFEF; }
      #unterhaltung .un-msg.bezug { cursor: pointer; }
      #unterhaltung .un-msg.bezug:hover { background: var(--flaeche); }
      #unterhaltung .un-msg.an { background: var(--flaeche); box-shadow: inset 3px 0 0 var(--ac); }
      #unterhaltung .un-wer { display: flex; align-items: baseline; gap: 6px; }
      #unterhaltung .un-wer b { white-space: nowrap; }
      #unterhaltung .un-wer span { color: var(--muted); white-space: nowrap; }
      #unterhaltung .un-text { margin-top: 3px; line-height: 1.3; }
      #unterhaltung .un-verweis { margin-top: 3px; color: var(--muted); }
      #unterhaltung .un-eingabe { height: 34px; border: 1px solid #9A9A9A; border-radius: 3px; padding: 0 8px; font: inherit;
        font-size: 14px; color: var(--text); width: 100%; margin-top: 6px; background: #FFFFFF; }
      #unterhaltung .un-eingabe::placeholder { color: var(--muted); }`);
    const k = DK.box("kanal", 16, 0, 992, 40);
    const n = el("div", { class: "kn-name" }, k, "Finanzen ");
    el("span", {}, n, "› Kanal Forderungsmanagement");
    const reiter = el("div", { class: "kn-reiter", style: `left:${Math.ceil(tw("Finanzen › Kanal Forderungsmanagement", 16, true)) + 36}px` }, k);
    ["Beiträge", "Forderungs-Cockpit", "Dateien"].forEach((t, i) => el("div", { class: i === 1 ? "an" : "" }, reiter, t));
    el("div", { class: "dk-haar", style: "top:40px;left:0;right:0" }, seite);
    el("div", { style: "position:absolute;left:762px;top:40px;bottom:0;border-left:1px solid var(--linie)" }, seite);
  }
  // Unterhaltung: Beiträge zum Stichtag 30.06.2027, Zahlen aus den Daten; Beiträge mit Bezug wählen im Bericht aus
  const eigene = [];
  function unterhaltung() {
    if (!bU) return;
    const m = NS - 1, alle = OP[m], ges = summe(alle), ue = summe(alle.filter(o => o.ue));
    const je = new Map();
    alle.filter(o => o.ue).forEach(o => je.set(o.di, (je.get(o.di) || 0) + o.c));
    const [spitze, betrag] = [...je.entries()].sort((a, b) => b[1] - a[1])[0];
    const st2 = summe(alle.filter(o => o.stufe === 2)), d0 = dso(m, true), d1 = dso(m - 1, true);
    const kd = Math.round(d0) - Math.round(d1), te = c => tsd(c) + NBSP + "Tsd." + NBSP + "€";
    const msgs = [
      { wer: "Frau Brandt", rolle: "Debitoren", zeit: "08:42",
        text: `Das Cockpit ist auf den ${dat(ST[m])} aktualisiert: ${te(ges)} offen, davon ${te(ue)} überfällig.` },
      { wer: "Herr Tal", rolle: "Vertrieb", zeit: "09:05", bezug: { typ: "deb", key: spitze },
        text: `${DEB[spitze][1]}: ${te(betrag)} überfällig. Ich rufe dort heute an.` },
      { wer: "Frau Brandt", rolle: "Debitoren", zeit: "09:18", bezug: { typ: "stufe", key: 2 },
        text: `Danke! Mahnstufe 2 betrifft ${te(st2)}; der nächste Mahnlauf ist am Freitag.` },
      { wer: "Herr Ohm", rolle: "Controlling", zeit: "10:31",
        text: `Reichweite ${zahl(d0, 0)}${NBSP}Tage, ${kd === 0 ? "unverändert zum" : (kd > 0 ? kd + " mehr als im" : -kd + " weniger als im")} Vormonat. Kommt in den Monatsbericht.` },
      ...eigene,
    ];
    bU.textContent = "";
    el("div", { class: "un-kopf" }, bU, "Unterhaltung");
    el("div", { class: "un-unter" }, bU, "Beiträge zum Bericht");
    el("div", { class: "un-tag" }, bU, "Donnerstag, 01.07.2027");
    const liste = el("div", { class: "un-liste", id: "un-liste" }, bU);
    msgs.slice(-5).forEach((x, i) => {
      const an = x.bezug && S.sel && S.sel.typ === x.bezug.typ && S.sel.key === x.bezug.key;
      const d = el("div", { class: "un-msg" + (x.bezug ? " bezug" : "") + (an ? " an" : ""), id: "un-msg-" + i }, liste);
      const w = el("div", { class: "un-wer" }, d);
      el("b", {}, w, x.wer); el("span", {}, w, `${x.rolle} · ${x.zeit}`);
      el("div", { class: "un-text" }, d, x.text);
      if (x.bezug) {
        el("div", { class: "un-verweis" }, d, x.bezug.typ === "deb" ? "↗ Debitor im Bericht zeigen" : "↗ Mahnstufe im Bericht zeigen");
        if (!DK.PRINT) d.addEventListener("click", () => waehlen(x.bezug.typ, x.bezug.key));
      }
    });
    const inp = el("input", { class: "un-eingabe", type: "text", placeholder: "Antworten …", "aria-label": "Antworten" }, bU);
    inp.addEventListener("keydown", e => {
      if (e.key !== "Enter" || !inp.value.trim()) return;
      eigene.push({ wer: "Sie", rolle: "Leser", zeit: "jetzt", text: inp.value.trim() });
      zeichnen();
      const neu = document.querySelector("#unterhaltung .un-eingabe");
      if (neu) neu.focus();
    });
  }

  /* ---------- lokaler Tooltip (wie DK) ---------- */
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

  /* ---------- A: offene Posten nach Fälligkeitsband (Säulen, überfällig anthrazit, nicht fällig hellgrau) ---------- */
  function faelligkeit(f, werte) {
    const W = f.breite, H = f.hoehe, n = BAENDER.length;
    const svg = sv("svg", { width: W, height: H, role: "img", "aria-label": "Offene Posten nach Fälligkeit" }, f.flaeche);
    const oben = 32, unten = 38, PH = H - oben - unten, slot = W / n, bw = Math.min(46, slot * 0.62);   // oben: Zeile für „Stichtag“
    const max = Math.max(...werte.map(w => w.c), 1);
    const basis = oben + PH;
    werte.forEach((w, i) => {
      const b = BAENDER[i], cx = slot * i + slot / 2, h = w.c / max * PH;
      const blass = S.sel && S.sel.typ === "band" && S.sel.key !== b.key;
      const g = sv("g", { class: "dk-klick" + (blass ? " dk-blass" : ""), id: "a-band-" + i }, svg);
      sv("rect", { x: cx - bw / 2, y: basis - h, width: bw, height: Math.max(w.c > 0 ? 1 : 0, h), fill: b.ue ? UE : NF }, g);
      sv("text", { x: cx, y: basis - h - 5, "text-anchor": "middle", style: b.ue ? "font-weight:bold" : "" }, g, tsd(w.c));
      sv("text", { x: cx, y: basis + 16, "text-anchor": "middle" }, g, b.kurz);
      const hit = sv("rect", { x: slot * i, y: 0, width: slot, height: H, fill: "transparent" }, g);
      hit.addEventListener("click", () => waehlen("band", b.key));
      tooltip(hit, () => w.tip);
    });
    sv("line", { x1: 0, x2: W, y1: basis + 0.5, y2: basis + 0.5, stroke: "#8C8C8C", "stroke-width": 1 }, svg);
    // Stichtag zwischen überfällig und fällig, Gruppenbeschriftung unter der Achse
    const xs = slot * 3;
    sv("line", { x1: xs, x2: xs, y1: 2, y2: basis + 20, stroke: "#9A9A9A", "stroke-width": 1, "stroke-dasharray": "3 3", id: "a-stichtag" }, svg);
    sv("text", { x: xs - 6, y: 11, "text-anchor": "end", class: "muted", id: "a-stichtag-text" }, svg, `Stichtag ${dat(ST[S.m])}`);
    sv("text", { x: xs - 6, y: H - 3, "text-anchor": "end", class: "muted" }, svg, "Tage überfällig");
    sv("text", { x: xs + 6, y: H - 3, class: "muted", id: "a-faellig" }, svg, "fällig in … Tagen");
  }

  /* ---------- B: Verlauf je Monatsultimo (Säulen); Klick wählt den Stichtag ---------- */
  function verlauf(f, spalten) {
    const W = f.breite, H = f.hoehe, n = spalten.length;
    const svg = sv("svg", { width: W, height: H, role: "img", "aria-label": "Verlauf je Monatsultimo" }, f.flaeche);
    const oben = 18, unten = 20, PH = H - oben - unten, slot = W / n, bw = Math.min(34, slot * 0.6);
    const max = Math.max(...spalten.map(s => s.c), 1), basis = oben + PH;
    spalten.forEach((s, i) => {
      const cx = slot * i + slot / 2, h = s.c / max * PH, akt = s.m === S.m;
      const g = sv("g", { class: "dk-klick", id: "b-monat-" + s.m }, svg);
      sv("rect", { x: cx - bw / 2, y: basis - h, width: bw, height: Math.max(s.c > 0 ? 1 : 0, h), fill: s.farbe }, g);
      sv("text", { x: cx, y: basis - h - 5, "text-anchor": "middle", style: akt ? "font-weight:bold" : "" }, g, tsd(s.c));
      sv("text", { x: cx, y: H - 3, "text-anchor": "middle", style: akt ? "font-weight:bold" : "", class: akt ? "" : "muted" }, g, monat(s.m));
      if (akt) sv("line", { x1: cx - bw / 2 - 3, x2: cx + bw / 2 + 3, y1: H - 1, y2: H - 1, stroke: "#3A3F44", "stroke-width": 2 }, g);
      // Trefferfläche bewusst nicht „transparent“: der Klick wählt den Stichtag, keine Auswahl
      const hit = sv("rect", { x: slot * i, y: 0, width: slot, height: H, fill: "#FFFFFF", "fill-opacity": 0 }, g);
      hit.addEventListener("click", () => { S.m = s.m; RANG = rangfolge(S.m); if (S.sel && S.sel.typ === "deb" && S.sel.key !== "rest" &&
        !RANG.top.includes(S.sel.key)) S.sel = null; zeichnen(); });
      tooltip(hit, () => s.tip);
    });
    sv("line", { x1: 0, x2: W, y1: basis + 0.5, y2: basis + 0.5, stroke: "#8C8C8C", "stroke-width": 1 }, svg);
  }

  /* ---------- C, D, E: gestapelte Balken (überfällig + nicht fällig), Summe am Balken, optional Spalte „überfällig“ ---------- */
  function stapel(f, o) {
    const W = f.breite, n = o.zeilen.length, kopfH = o.spalteUe ? 18 : 0;
    const rh = o.zeilenhoehe, H = kopfH + rh * n, bh = Math.round(rh * 0.66);
    const svg = sv("svg", { width: W, height: H, role: "img", "aria-label": o.aria, id: o.id }, f.flaeche);
    const lw = Math.ceil(Math.max(...o.zeilen.map(z => tw(z.label, 14, !!z.fett)))) + 10;
    const sw = o.spalteUe ? Math.max(Math.ceil(tw("überfällig")), ...o.zeilen.map(z => Math.ceil(tw(tsd(z.ue))))) + 12 : 0;
    const vw = Math.ceil(Math.max(...o.zeilen.map(z => tw(tsd(z.ue + z.nf), 14, true)))) + 8;
    const pw = W - lw - vw - sw, max = Math.max(...o.zeilen.map(z => z.ue + z.nf), 1);
    if (o.spalteUe) {
      sv("text", { x: W, y: 12, "text-anchor": "end", class: "muted" }, svg, "überfällig");
      if (lw + tw("offene Posten gesamt") + 12 < W - tw("überfällig")) sv("text", { x: lw, y: 12, class: "muted" }, svg, "offene Posten gesamt");
    }
    o.zeilen.forEach((z, i) => {
      const y = kopfH + i * rh, ym = y + rh / 2;
      const g = sv("g", { class: "dk-klick" + (o.blass(z) ? " dk-blass" : "") }, svg);
      sv("text", { x: lw - 10, y: ym, dy: "0.35em", "text-anchor": "end", style: z.fett ? "font-weight:bold" : "" }, g, z.label);
      const wu = z.ue / max * pw, wn = z.nf / max * pw;
      if (z.ue > 0) sv("rect", { x: lw, y: ym - bh / 2, width: Math.max(1, wu), height: bh, fill: UE }, g);
      if (z.nf > 0) sv("rect", { x: lw + wu, y: ym - bh / 2, width: wn, height: bh, fill: NF }, g);
      sv("text", { x: lw + wu + wn + 5, y: ym, dy: "0.35em" }, g, tsd(z.ue + z.nf));
      if (o.spalteUe) sv("text", { x: W, y: ym, dy: "0.35em", "text-anchor": "end",
                                   style: z.ue > 0 ? "font-weight:bold" : "" }, g, tsd(z.ue));
      if (i < n - 1 && o.trenner) sv("line", { x1: 0, x2: W, y1: y + rh - 0.5, y2: y + rh - 0.5, stroke: "#EFEFEF", "stroke-width": 1 }, g);
      const hit = sv("rect", { x: 0, y, width: W, height: rh, fill: "transparent" }, g);
      hit.addEventListener("click", () => o.onClick(z));
      tooltip(hit, () => z.tip);
    });
    return svg;
  }

  /* ---------- E interaktiv: alle Debitoren als Bildlaufliste, Klick klappt die offenen Posten auf (Detailebene) ---------- */
  DK.el("style", {}, document.head, `
    #e-debitoren { position: absolute; inset: 0; overflow-y: auto; overflow-x: hidden; scrollbar-width: thin; }
    #e-debitoren .fd-kopf { position: sticky; top: 0; background: #FFFFFF; z-index: 1; }
    #e-debitoren table { width: calc(100% - 8px); border-collapse: collapse; margin: 0 0 6px 0; font-size: 12.5px; }
    #e-debitoren th { font-weight: normal; color: var(--muted); text-align: right; padding: 2px 6px 2px 0; border-bottom: 1px solid #D4D4D4; }
    #e-debitoren td { text-align: right; padding: 2px 6px 2px 0; border-bottom: 1px solid #EFEFEF; white-space: nowrap; }
    #e-debitoren th:first-child, #e-debitoren td:first-child { text-align: left; padding-left: 18px; }
    #e-debitoren tr.ue td.tage { font-weight: bold; }
    #e-debitoren tr.fd-summe td { font-weight: bold; border-bottom: none; }`);
  function debListe(f, zeilen, m) {
    const box = el("div", { id: "e-debitoren", role: "list", "aria-label": "Offene Posten nach Debitor, mit Einzelposten" }, f.flaeche);
    const W = f.breite - 12, rh = 19, bh = Math.round(rh * 0.66);
    const label = z => (S.sel && S.sel.typ === "deb" && S.sel.key === z.key ? "▾ " : "▸ ") + z.label;
    const lw = Math.ceil(Math.max(...zeilen.map(z => tw(label(z))))) + 10;
    const sw = Math.max(Math.ceil(tw("überfällig")), ...zeilen.map(z => Math.ceil(tw(tsd(z.ue))))) + 12;
    const vw = Math.ceil(Math.max(...zeilen.map(z => tw(tsd(z.ue + z.nf), 14, true)))) + 8;
    const pw = W - lw - vw - sw, max = Math.max(...zeilen.map(z => z.ue + z.nf), 1);
    const kopf = sv("svg", { width: W, height: 18, class: "fd-kopf" }, box);
    sv("text", { x: W, y: 12, "text-anchor": "end", class: "muted" }, kopf, "überfällig");
    sv("text", { x: lw, y: 12, class: "muted" }, kopf, passt(["offene Posten gesamt · Klick: Einzelposten", "offene Posten gesamt"],
      W - lw - tw("überfällig") - 16));
    const p = posten(m, "deb");
    zeilen.forEach(z => {
      const auf = S.sel && S.sel.typ === "deb" && S.sel.key === z.key;
      const svg = sv("svg", { width: W, height: rh, role: "listitem", id: "e-deb-" + z.key }, box);
      const g = sv("g", { class: "dk-klick" + (S.sel && S.sel.typ === "deb" && !auf ? " dk-blass" : "") }, svg);
      sv("text", { x: lw - 10, y: rh / 2, dy: "0.35em", "text-anchor": "end", style: auf ? "font-weight:bold" : "" }, g, label(z));
      const wu = z.ue / max * pw, wn = z.nf / max * pw;
      if (z.ue > 0) sv("rect", { x: lw, y: rh / 2 - bh / 2, width: Math.max(1, wu), height: bh, fill: UE }, g);
      if (z.nf > 0) sv("rect", { x: lw + wu, y: rh / 2 - bh / 2, width: wn, height: bh, fill: NF }, g);
      sv("text", { x: lw + wu + wn + 5, y: rh / 2, dy: "0.35em" }, g, tsd(z.ue + z.nf));
      sv("text", { x: W, y: rh / 2, dy: "0.35em", "text-anchor": "end", style: z.ue > 0 ? "font-weight:bold" : "" }, g, tsd(z.ue));
      sv("line", { x1: 0, x2: W, y1: rh - 0.5, y2: rh - 0.5, stroke: "#EFEFEF", "stroke-width": 1 }, g);
      const hit = sv("rect", { x: 0, y: 0, width: W, height: rh, fill: "transparent" }, g);
      hit.addEventListener("click", () => waehlen("deb", z.key));
      tooltip(hit, () => z.tip);
      if (!auf) return;
      // Detailebene: einzelne offene Posten des Debitors, älteste Fälligkeit zuerst
      const q = p.filter(o => o.di === z.key).sort((a, b) => a.fd - b.fd || a.rd - b.rd);
      const t = el("table", { id: "e-posten" }, box);
      const kr = el("tr", {}, el("thead", {}, t));
      ["Beleg", "Rechnung", "Fällig", "Tage überfällig", "Mahnstufe", "Betrag, €"].forEach(h => el("th", {}, kr, h));
      const tb = el("tbody", {}, t);
      q.forEach(o => {
        const tr = el("tr", { class: o.ue ? "ue" : "" }, tb);
        [String(o.b), dat(o.rd), dat(o.fd), o.ue ? zahl(o.tage) : "–", o.stufe ? String(o.stufe) : "–", zahl(o.c / 100, 2)]
          .forEach((v, i) => el("td", { class: i === 3 ? "tage" : "" }, tr, v));
      });
      const sr = el("tr", { class: "fd-summe" }, tb);
      [`${zahl(q.length)} Posten`, "", "", "", "", zahl(summe(q) / 100, 2)].forEach(v => el("td", {}, sr, v));
    });
    const an = box.querySelector("#e-posten");
    if (an) { const zeile = an.previousElementSibling; box.scrollTop = Math.max(0, zeile.offsetTop - 18); }
  }

  /* ---------- Datenschnitte ---------- */
  const monate = ST.map((_, m) => m).slice(1);                 // Dezember 2026 nur als Vormonat
  const knopfMonat = DK.schnitt(bFilter, "Stichtag (Monatsultimo 2027)", "knoepfe", {
    optionen: monate.map(m => [m, monat(m)]), wert: S.m,
    onChange: v => { S.m = Number(v); RANG = rangfolge(S.m); if (S.sel && S.sel.typ === "deb" && S.sel.key !== "rest" && !RANG.top.includes(S.sel.key)) S.sel = null; zeichnen(); } });
  const knopfKonto = DK.schnitt(bFilter, "Sammelkonto", "knoepfe", {
    optionen: [["alle", "Alle"], ...KON.map((k, i) => [String(i), `${k[0]} ${k[1]}`])], wert: "alle",
    onChange: v => { S.konto = v === "alle" ? null : Number(v); if (S.sel && S.sel.typ === "deb") S.sel = null; zeichnen(); } });

  /* ---------- Berechnungen je Visual (auch für „Werte als Tabelle“) ---------- */
  const auswahlText = () => {
    const t = [];
    if (S.konto !== null) t.push(`Konto ${KON[S.konto][0]} ${KON[S.konto][1]}`);
    if (S.sel) t.push(S.sel.typ === "band" ? BAENDER[S.sel.key].lang : S.sel.typ === "stufe" ? STUFEN[S.sel.key]
      : S.sel.key === "rest" ? `übrige Debitoren (${RANG.rest.size})` : DEB[S.sel.key][1]);
    return t;
  };
  function datenA(m = S.m) {
    const p = posten(m, "band"), ges = summe(p), vm = m > 0 ? posten(m - 1, "band") : null;
    return BAENDER.map(b => {
      const q = p.filter(o => o.band === b.key), c = summe(q), cv = vm ? summe(vm.filter(o => o.band === b.key)) : null;
      const fd = q.length ? [Math.min(...q.map(o => o.fd)), Math.max(...q.map(o => o.fd))] : null;
      return { b, c, n: q.length, cv, ges, tip: [
        b.lang[0].toUpperCase() + b.lang.slice(1),
        `${tsd(c)} Tsd. € in ${zahl(q.length)} Posten · ${pz(c, ges)} der Forderungen`,
        cv !== null ? `Vormonat ${tsd(cv)} Tsd. € · ΔVM ${pd(c, cv)}` : null,
        fd ? `Fälligkeit ${dat(fd[0], false)}–${dat(fd[1])}` : "keine Posten",
        "Klick filtert das Dashboard"] };
    });
  }
  function datenB() {
    const band = S.sel && S.sel.typ === "band" ? S.sel.key : null;
    return monate.map(m => {
      const p = posten(m, "band"), ue = p.filter(o => o.ue), ges = summe(p);
      const c = band === null ? summe(ue) : summe(p.filter(o => o.band === band));
      const kl = [0, 1, 2].map(k => summe(ue.filter(o => o.band === k)));
      return { m, c, ges, farbe: band === null || BAENDER[band].ue ? UE : NF, tip: [
        `Stichtag ${dat(ST[m])}`,
        band === null ? `Überfällig ${tsd(c)} Tsd. € (${pz(c, ges)} der Forderungen)` : `${BAENDER[band].lang}: ${tsd(c)} Tsd. €`,
        `über 28 Tage ${tsd(kl[0])} · 15–28 Tage ${tsd(kl[1])} · 1–14 Tage ${tsd(kl[2])} Tsd. €`,
        `Forderungen ${tsd(ges)} Tsd. € in ${zahl(p.length)} Posten`,
        m === S.m ? "Gewählter Stichtag" : "Klick wählt diesen Stichtag"] };
    });
  }
  function datenC(m = S.m) {
    const p = posten(m, "stufe"), vm = m > 0 ? posten(m - 1, "stufe") : null;
    return STUFEN.map((name, s) => {
      const q = p.filter(o => o.stufe === s), ue = summe(q.filter(o => o.ue)), c = summe(q);
      const cv = vm ? summe(vm.filter(o => o.stufe === s)) : null, nd = new Set(q.map(o => o.di)).size;
      return { key: s, label: name, ue, nf: c - ue, n: q.length, nd, tip: [
        `${name} (${STUFE_TAGE[s]})`, `${tsd(c)} Tsd. € in ${zahl(q.length)} Posten bei ${zahl(nd)} Debitor${nd === 1 ? "" : "en"}`,
        s === 0 ? `davon überfällig (bis 7 Tage) ${tsd(ue)} Tsd. €` : null,
        cv !== null ? `Vormonat ${tsd(cv)} Tsd. € · ΔVM ${pd(c, cv)}` : null, "Klick filtert das Dashboard"] };
    });
  }
  function datenD(m = S.m) {
    const p = posten(m, "konto"), ges = summe(p);
    return KON.map((k, i) => {
      const q = p.filter(o => o.k === i), ue = summe(q.filter(o => o.ue)), c = summe(q);
      return { key: i, label: `${k[0]} ${k[1]}`, ue, nf: c - ue, n: q.length, ges, tip: [
        `${k[0]} ${k[2]}`, `${tsd(c)} Tsd. € · ${pz(c, ges)} der Forderungen · ${zahl(q.length)} Posten`,
        `überfällig ${tsd(ue)} Tsd. € (${pz(ue, c)})`, `Genau: ${zahl(c / 100, 2)} €`, "Klick filtert das Dashboard"] };
    });
  }
  function datenE(m = S.m) {
    const p = posten(m, "deb"), zeile = (key, label, q, fett) => {
      const ue = summe(q.filter(o => o.ue)), c = summe(q);
      const aelteste = q.filter(o => o.ue).sort((a, b) => a.fd - b.fd)[0], ms = Math.max(0, ...q.map(o => o.stufe));
      const kopf = key === "rest" ? `${RANG.rest.size} übrige Debitoren` : `${DEB[key][0]} ${DEB[key][1]}`;
      return { key, label, fett, ue, nf: c - ue, n: q.length, tip: [
        kopf, `Offen ${tsd(c)} Tsd. € in ${zahl(q.length)} Posten · überfällig ${tsd(ue)} Tsd. €`,
        aelteste ? `Älteste Fälligkeit ${dat(aelteste.fd)} (${aelteste.tage} Tage überfällig)` : "Keine überfälligen Posten",
        `Höchste Mahnstufe ${ms ? ms : "–"}${key === "rest" ? "" : ` · Zahlungsziel ${DEB[key][3]} Tage`}`, "Klick filtert das Dashboard"] };
    };
    const z = RANG.top.map(di => zeile(di, DEB[di][1], p.filter(o => o.di === di), false));
    if (RANG.rest.size) z.push(zeile("rest", `Übrige (${RANG.rest.size})`, p.filter(o => RANG.rest.has(o.di)), false));
    return z;
  }

  /* ---------- Zeichnen ---------- */
  function zeichnen() {
    [...knopfMonat.querySelectorAll("button")].forEach((b, i) => b.setAttribute("aria-pressed", String(monate[i] === S.m)));
    [...knopfKonto.querySelectorAll("button")].forEach((b, i) =>
      b.setAttribute("aria-pressed", String(i === 0 ? S.konto === null : S.konto === i - 1)));
    const at = auswahlText();
    const kopfBreite = L.kopf[2] - 400;
    DK.kopf(bKopf, { titel: "Forderungs-Cockpit",
      untertitel: passt([`Offene Posten Debitoren · Stichtag ${dat(ST[S.m])} · ${at.length ? at.join(", ") : "alle Sammelkonten"} · Vergleich zum Vormonat (ΔVM)`,
        `Offene Posten · Stichtag ${dat(ST[S.m])} · ${at.length ? at.join(", ") : "alle Sammelkonten"} · ΔVM`,
        `Stichtag ${dat(ST[S.m])} · ${at.length ? at.join(", ") : "alle Sammelkonten"} · ΔVM`, `Stichtag ${dat(ST[S.m])} · ΔVM`], kopfBreite),
      quelle: "Quelle: Debitorenbuchhaltung",
      legende: [[UE, "überfällig"], [NF, "nicht fällig"], [FARBE.gut, "günstig"], [FARBE.schlecht, "ungünstig"]] });

    // KPI-Leiste
    const k = kennzahlen(S.m), v = kennzahlen(S.m - 1);
    const kl = (a, b, r) => wirkung((a / b - 1) * 100, r, 1);
    DK.kpis(bKpi, [
      { label: "Forderungen, Tsd. €", wert: tsd(k.ges), bezug: "ΔVM", delta: pd(k.ges, v.ges), klasse: "neutral" },
      { label: "Überfällig, Tsd. €", wert: tsd(k.ue), bezug: "ΔVM", delta: pd(k.ue, v.ue), klasse: v.ue ? kl(k.ue, v.ue, -1) : "neutral" },
      { label: "Offene Posten", wert: zahl(k.n), bezug: "ΔVM", delta: delta(k.n - v.n, 0), klasse: "neutral" },
      { label: "Reichweite (DSO)", wert: k.dso == null ? "–" : zahl(k.dso, 0), einheit: "Tage", bezug: "ΔVM",
        delta: k.dso == null || v.dso == null ? "–" : delta(Math.round(k.dso) - Math.round(v.dso), 0, NBSP + "Tage"),
        klasse: k.dso == null || v.dso == null ? "neutral" : wirkung(Math.round(k.dso) - Math.round(v.dso), -1, 0) },
      { label: "Gemahnt, Tsd. €", wert: tsd(k.gem), bezug: "ΔVM", delta: pd(k.gem, v.gem), klasse: v.gem ? kl(k.gem, v.gem, -1) : "neutral" },
    ]);
    [...bKpi.querySelectorAll(".dk-kpi")].forEach((c, i) => { c.id = "kpi-" + i; });

    // A: Fälligkeit
    const a = datenA(), ges = a[0].ges, ueA = summe(a.filter(x => x.b.ue)), ue28 = a[0].c;
    const sb = S.sel && S.sel.typ === "band" ? a[S.sel.key] : null;
    const bA_ = sb ? passt([`${sb.b.lang[0].toUpperCase() + sb.b.lang.slice(1)}: ${tsd(sb.c)} Tsd. € in ${zahl(sb.n)} Posten (${pz(sb.c, ges)})`,
                            `${sb.b.lang[0].toUpperCase() + sb.b.lang.slice(1)}: ${tsd(sb.c)} Tsd. €`], L.A[2])
      : passt([`${tsd(ueA)} Tsd. € überfällig (${pz(ueA, ges)}), davon ${tsd(ue28)} Tsd. € seit über 28 Tagen`,
                `${tsd(ueA)} Tsd. € überfällig (${pz(ueA, ges)}), ${tsd(ue28)} Tsd. € über 28 Tage`,
                `${tsd(ueA)} Tsd. € überfällig (${pz(ueA, ges)})`], L.A[2]);
    let f = DK.visual(bA, { titel: "Offene Posten nach Fälligkeit", einheit: "Tsd. €", botschaft: bA_ });
    faelligkeit(f, a);

    // B: Verlauf
    const b = datenB(), b0 = b[0], b1 = b[b.length - 1], band = S.sel && S.sel.typ === "band" ? BAENDER[S.sel.key] : null;
    const verb = (x, y) => (y > x * 1.02 ? "gestiegen" : y < x * 0.98 ? "gesunken" : "nahezu unverändert");
    const bB_ = passt([`Von ${tsd(b0.c)} Tsd. € im ${monat(b0.m, true).split(" ")[0]} auf ${tsd(b1.c)} Tsd. € im ${monat(b1.m, true).split(" ")[0]} ${verb(b0.c, b1.c)}`,
                       `${monat(b0.m)}–${monat(b1.m)}: ${tsd(b0.c)} → ${tsd(b1.c)} Tsd. € (${verb(b0.c, b1.c)})`,
                       `${monat(b0.m)}–${monat(b1.m)}: ${verb(b0.c, b1.c)}`], L.B[2]);
    f = DK.visual(bB, { titel: band ? (band.ue ? "Überfällig " + band.kurz + " Tage" : "Fällig in " + band.kurz + " Tagen") : "Überfällig je Monatsultimo",
                        einheit: "Tsd. €", botschaft: bB_ });
    verlauf(f, b);

    // C: Mahnstufe
    const c = datenC(), gem = summe(c.slice(1), x => x.ue + x.nf), s3 = c[3];
    const sc = S.sel && S.sel.typ === "stufe" ? c[S.sel.key] : null;
    const bC_ = sc ? passt([`${sc.label}: ${tsd(sc.ue + sc.nf)} Tsd. € bei ${zahl(sc.nd)} Debitor${sc.nd === 1 ? "" : "en"}`, `${sc.label}: ${tsd(sc.ue + sc.nf)} Tsd. €`], L.C[2])
      : passt([`Gemahnt ${tsd(gem)} Tsd. €, davon Mahnstufe 3: ${tsd(s3.ue + s3.nf)} Tsd. €`, `Gemahnt ${tsd(gem)} Tsd. €, Stufe 3: ${tsd(s3.ue + s3.nf)} Tsd. €`,
               `Gemahnt ${tsd(gem)} Tsd. €`], L.C[2]);
    f = DK.visual(bC, { titel: "Nach Mahnstufe", einheit: "Tsd. €", botschaft: bC_ });
    stapel(f, { id: "c-stufen", aria: "Forderungen nach Mahnstufe", zeilen: c, zeilenhoehe: 18, spalteUe: false,
      blass: z => S.sel && S.sel.typ === "stufe" && S.sel.key !== z.key, onClick: z => waehlen("stufe", z.key) });

    // D: Sammelkonto
    const d = datenD(), dg = summe(d, x => x.ue + x.nf);
    const dk = S.konto !== null ? d[S.konto] : null;
    const bD_ = dk ? passt([`${KON[S.konto][1]}: ${pz(dk.ue + dk.nf, dg, 0)} der Forderungen, ${pz(dk.ue, dk.ue + dk.nf, 0)} überfällig`, `${KON[S.konto][1]}: ${pz(dk.ue + dk.nf, dg, 0)} der Forderungen`], L.D[2])
      : passt([`${pz(d[0].ue + d[0].nf, dg, 0)} im Inland; Ausland ${pz(d[1].ue, d[1].ue + d[1].nf, 0)} überfällig`, `${pz(d[0].ue + d[0].nf, dg, 0)} der Forderungen im Inland`], L.D[2]);
    f = DK.visual(bD, { titel: "Nach Sammelkonto", einheit: "Tsd. €", botschaft: bD_ });
    stapel(f, { id: "d-konten", aria: "Forderungen nach Sammelkonto", zeilen: d, zeilenhoehe: 20, spalteUe: true,
      blass: z => S.konto !== null && S.konto !== z.key, onClick: z => kontoSetzen(z.key) });

    // E: Debitoren
    const e = datenE(), eu = e.filter(z => z.key !== "rest").sort((x, y) => y.ue - x.ue)[0], eg = summe(e, x => x.ue + x.nf);
    const ueE = summe(e, x => x.ue);
    const se = S.sel && S.sel.typ === "deb" ? e.find(z => z.key === S.sel.key) : null;
    const bE_ = se ? passt([`${se.label}: ${tsd(se.ue + se.nf)} Tsd. € offen (${pz(se.ue + se.nf, eg)}), davon ${tsd(se.ue)} Tsd. € überfällig`,
                            `${se.label}: ${tsd(se.ue + se.nf)} Tsd. € offen, ${tsd(se.ue)} überfällig`], L.E[2])
      : eu && eu.ue > 0 ? passt([`${eu.label} trägt ${pz(eu.ue, ueE, 0)} der Überfälligkeit (${tsd(eu.ue)} von ${tsd(ueE)} Tsd. €)`,
                                 `${eu.label}: ${pz(eu.ue, ueE, 0)} der Überfälligkeit`], L.E[2])
      : passt([`Größter Debitor: ${e[0].label} mit ${pz(e[0].ue + e[0].nf, eg)}`], L.E[2]);
    f = DK.visual(bE, { titel: "Offene Posten nach Debitor", einheit: "Tsd. €", botschaft: bE_ });
    if (DK.PRINT) stapel(f, { id: "e-debitoren", aria: "Offene Posten nach Debitor", zeilen: e, zeilenhoehe: KANAL ? 18 : 19, spalteUe: true, trenner: true,
      blass: z => S.sel && S.sel.typ === "deb" && S.sel.key !== z.key, onClick: z => waehlen("deb", z.key) });
    else debListe(f, e, S.m);

    unterhaltung();
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  /* ---------- Lernplattform: Designregeln, Nachbau, Tabellen, CSV ---------- */
  const regeln = [
    { nr: 1, ziel: "v-faelligkeit", anker: "links", versatz: [KANAL ? 395 : 560, 2], regel: "SAY – Botschaft vermitteln", titel: "Eine Aussage je Visual",
      text: "Unter jedem Titel steht ein aus den Daten berechneter Satz, der sich mit Stichtag, Konto und Auswahl ändert – etwa wie viel überfällig ist und welcher Debitor den größten Teil davon trägt. Das Original hatte nur Überschriften." },
    { nr: 2, ziel: "a-stichtag", anker: "links", versatz: [-6, 18], regel: "STRUCTURE – Natürliche Reihenfolge", titel: "Fälligkeitsbänder statt 40 Einzeltage",
      text: "Die offenen Posten stehen in Fälligkeitsbändern in zeitlicher Folge: links die überfälligen (über 28, 15–28, 1–14 Tage, wie die Fälligkeitsklassen des Originals), rechts die in den nächsten Wochen fälligen, getrennt durch den Stichtag. Das Original zeigte jedes Fälligkeitsdatum einzeln, absteigend sortiert und nur mit Bildlauf vollständig; das Ringdiagramm der Fälligkeitsklassen geht darin auf." },
    { nr: 3, ziel: "kopf-legende", anker: "links", versatz: [-6, -2], regel: "UNIFY – Semantische Notation", titel: "Anthrazit heißt überfällig",
      text: "In allen Visuals ist der überfällige Teil anthrazit, der noch nicht fällige hellgrau; Blaugrün und Rot gibt es nur für Abweichungen zum Vormonat nach Wirkung (mehr Überfälliges, mehr Gemahntes und längere Reichweite sind ungünstig). Das Original nutzte Ampelfarben für Mahnstufen und Blautöne für Fälligkeitsklassen." },
    { nr: 4, ziel: "kpis", anker: "links", versatz: KANAL ? [122, 48] : [180, 4], regel: "EXPRESS – Vergleich mit Maß", titel: "Kennzahlen mit Vormonat",
      text: "Jede Kennzahl nennt die Veränderung zum Vormonat; die Einheit steht einmal im Label. Das Original zeigte die Werte ohne Vergleich und in wechselnden Formaten („1.768,74 Tsd.“ neben „1,77 Mio.“)." },
    { nr: 5, ziel: "kpi-1", anker: "links", versatz: [KANAL ? 98 : 150, 22], regel: "CHECK – Stimmige Zahlen", titel: "Eine Datenbasis für alle Werte",
      text: "Alle Werte rechnen aus denselben offenen Posten: Kennzahlen = Summen der Visuals, Sammelkonten zusammen = Forderungen. Im Original waren die „überfälligen Forderungen“ (1,77 Mio.) so hoch wie alle Forderungen, die Fälligkeitsklassen zusammen aber nur 89,5 Tsd. €; die drei Auslandsdebitoren überstiegen das Sammelkonto Ausland." },
    { nr: 6, ziel: "c-stufen", anker: "links", versatz: [KANAL ? 160 : 212, 22], regel: "EXPRESS – Passende Darstellung", titel: "Balken statt Ringdiagrammen",
      text: "Mahnstufen und Sammelkonten sind Balken in natürlicher Reihenfolge mit direkter Beschriftung. Im Original waren es Ringdiagramme mit Legende, deren kleine Segmente (Mahnstufe 1–3) kaum zu erkennen waren." },
    { nr: 7, ziel: "e-debitoren", anker: "links", versatz: [KANAL ? 342 : 430, 0], regel: "CONDENSE – Verdichten", titel: "Top 6 und Übrige, Überfälligkeit je Kunde",
      text: "In der Buchabbildung stehen die sechs größten Debitoren einzeln, der Rest als „Übrige“; hier lassen sich alle Debitoren durchblättern. Jede Zeile zeigt den überfälligen Teil im Balken und als Zahl, Debitorennummer, älteste Fälligkeit, Mahnstufe und Zahlungsziel stehen im Tooltip. Ein Klick auf einen Debitor filtert das Dashboard und klappt seine offenen Posten bis auf den einzelnen Beleg auf – mit Rechnungsdatum, Fälligkeit, Tagen überfällig, Mahnstufe und Betrag. Das Original zeigte nur Gesamtbeträge mit Bildlaufleiste." },
    { nr: 8, ziel: "filter", anker: "links", versatz: [KANAL ? 600 : 650, -2], regel: "SIMPLIFY – Überflüssiges weglassen", titel: "Ohne Logo, Navigation und Programmrahmen",
      text: KANAL
        ? "Programmleisten, Logo, Navigationsknöpfe und Menüs entfallen; vom Kollaborationswerkzeug bleiben nur der Kanalname, die Registerkarte des Berichts und die Unterhaltung. Monat und Sammelkonto filtern das Dashboard, ein Klick auf Band, Mahnstufe oder Debitor filtert die übrigen Visuals, Esc hebt auf."
        : "Browser- und Programmleisten, Logo, Navigationsknöpfe und Seitenliste entfallen. Monat und Sammelkonto filtern das Dashboard, ein Klick auf Band, Mahnstufe oder Debitor filtert die übrigen Visuals, ein Klick auf einen Monat im Verlauf wählt den Stichtag; Esc hebt die Auswahl auf." },
  ];
  if (KANAL) regeln.push({ nr: 9, ziel: "unterhaltung", anker: "links", versatz: [212, 4], regel: "STRUCTURE – Bericht im Arbeitskontext", titel: "Unterhaltung neben dem Bericht",
    text: "Der Bericht ist als Registerkarte in den Kanal „Forderungsmanagement“ eingebunden; daneben läuft die Unterhaltung. Beiträge mit Bezug (↗) wählen per Klick den genannten Debitor bzw. die Mahnstufe im Bericht aus. Die Zahlen in den Beiträgen stammen aus denselben Daten wie der Bericht. Eigene Antworten lassen sich unten eingeben." });

  DK.ebenen({
    regeln,
    nachbauIntro: "Seitengröße benutzerdefiniert 1024 × 646 px. Schrift Arial: Beschriftungen 10,5 pt, Visualtitel 12 pt, KPI-Werte 19,5 pt. " +
      "Datenmodell: Tabelle Rechnungen (CSV) und eine Stichtagstabelle (Monatsultimo). Measures: Offen = CALCULATE(SUM(Rechnungen[Betrag]); FILTER(Rechnungen; Rechnungen[Rechnungsdatum] <= [Stichtag] && (ISBLANK(Rechnungen[Zahlungseingang]) || Rechnungen[Zahlungseingang] > [Stichtag]))); " +
      "Tage überfällig = [Stichtag] − Rechnungen[Fälligkeit] (berechnete Spalte je Stichtag in einer Snapshot-Tabelle ist einfacher); Überfällig = CALCULATE([Offen]; [Tage überfällig] > 0); DSO = DIVIDE([Offen]; CALCULATE(SUM(Rechnungen[Betrag]); DATESINPERIOD(Datum[Datum]; [Stichtag]; −90; DAY))) * 90." +
      (KANAL ? " Einbindung: Bericht im Power-BI-Dienst veröffentlichen und als Registerkarte im Kanal des Kollaborationswerkzeugs anheften; die Unterhaltung sind die Kanalbeiträge, kein Teil des Berichts." : " Bereitstellung: Bericht im Power-BI-Dienst veröffentlichen und im Webbrowser öffnen (Lesemodus)."),
    nachbau: [
      { id: "A", ziel: "kpis", anker: "links", versatz: KANAL ? [122, 48] : [180, 4], titel: "Kennzahlen", visual: "Karte (neu) mit fünf Kennzahlen und Referenzbeschriftungen",
        felder: "Offen, Überfällig, Anzahl offene Posten (COUNTROWS), DSO, Gemahnt; Referenz ΔVM mit DATEADD(Stichtag[Datum]; −1; MONTH)",
        format: "Wert 19,5 pt fett; Referenzbeschriftung 10,5 pt; Farbe über bedingte Formatierung (#00806B günstig, #C62828 ungünstig), Forderungen und Anzahl neutral" },
      { id: "B", ziel: "v-faelligkeit", versatz: [0, 0], titel: "Offene Posten nach Fälligkeit", visual: "Gruppiertes Säulendiagramm",
        felder: "X-Achse: Fälligkeitsband (berechnete Spalte mit Sortierspalte); Y-Achse: Offen",
        format: "Spaltenfarbe bedingt: überfällige Bänder #3A3F44, nicht fällige #D4D4D4; Datenbeschriftungen ein, Y-Achse und Gitternetz aus",
        hinweis: "Die gestrichelte Stichtagslinie ist eine Form (Linie) über dem Visual; eine Konstantenlinie gibt es bei kategorischer X-Achse nicht." },
      { id: "C", ziel: "v-verlauf", versatz: [0, 0], titel: "Überfällig je Monatsultimo", visual: "Säulendiagramm",
        felder: "X-Achse: Stichtag (Monat); Y-Achse: Überfällig", format: "#3A3F44, Datenbeschriftungen ein, Y-Achse aus",
        hinweis: "Interaktion „Filtern“ auf die übrigen Visuals ergibt den Stichtagswechsel per Klick." },
      { id: "D", ziel: "v-mahnstufe", versatz: [0, 0], titel: "Nach Mahnstufe", visual: "Gestapeltes Balkendiagramm",
        felder: "Y-Achse: Mahnstufe (0–3); X-Achse: Überfällig und Nicht fällig (zwei Measures)", format: "Reihen #3A3F44 und #D4D4D4; Gesamtbeschriftung ein; Legende aus" },
      { id: "E", ziel: "v-konto", versatz: [0, 0], titel: "Nach Sammelkonto", visual: "Gestapeltes Balkendiagramm wie D",
        felder: "Y-Achse: Sammelkonto (1400, 1401)", format: "wie D; Spalte „überfällig“ als Tabelle daneben oder im Tooltip" },
      { id: "F", ziel: "v-debitoren", versatz: [0, 0], titel: "Offene Posten nach Debitor", visual: "Gestapeltes Balkendiagramm wie D",
        felder: "Y-Achse: Debitor (Gruppe „Übrige“ über TOPN bzw. eine Gruppierung); Tooltip: Debitor-Nr., älteste Fälligkeit, Mahnstufe",
        format: "Sortierung nach Offen absteigend, „Übrige“ zuletzt (Sortierspalte)" },
      { id: "G", ziel: "filter", anker: "links", versatz: [KANAL ? 600 : 650, -2], titel: "Datenschnitte", visual: "Datenschnitt (2×)",
        felder: "Stichtag (Monat) als Kacheln, Einzelauswahl; Sammelkonto als Kacheln", format: "Ausgewählt #3A3F44 mit weißer Schrift, sonst weiß mit Rahmen #9A9A9A" },
    ],
    theme: DK.thema(),
    csv: { name: "forderungen_rechnungen.csv", text: () => {
      const iso = t => { const x = new Date(T0 + t * 864e5); return x.toISOString().slice(0, 10); };
      const de = c => `${Math.floor(c / 100)},${String(c % 100).padStart(2, "0")}`;
      return ["Beleg;Debitor_Nr;Debitor;Sammelkonto;Rechnungsdatum;Faelligkeit;Betrag_EUR;Zahlungseingang",
        ...R.map(r => [r.b, DEB[r.di][0], DEB[r.di][1], KON[r.k][0], iso(r.rd), iso(r.fd), de(r.c), r.zd >= 0 ? iso(r.zd) : ""].join(";"))].join("\r\n"); } },
    tabellen: () => {
      const k = kennzahlen(S.m), v = kennzahlen(S.m - 1), at = auswahlText().join(", ");
      const zus = at ? ` – ${at}` : "";
      return [
        { titel: `Kennzahlen, Stichtag ${dat(ST[S.m])}${zus}`, kopf: ["Kennzahl", dat(ST[S.m]), dat(ST[S.m - 1])],
          zeilen: [["Forderungen, Tsd. €", tsd(k.ges), tsd(v.ges)], ["Überfällig, Tsd. €", tsd(k.ue), tsd(v.ue)],
                   ["Offene Posten", zahl(k.n), zahl(v.n)], ["Reichweite (DSO), Tage", k.dso == null ? "–" : zahl(k.dso, 1), v.dso == null ? "–" : zahl(v.dso, 1)],
                   ["Gemahnt, Tsd. €", tsd(k.gem), tsd(v.gem)]] },
        { titel: "Offene Posten nach Fälligkeit", kopf: ["Band", "Tsd. €", "Posten", "Anteil"],
          zeilen: datenA().map(x => [x.b.lang, tsd(x.c), zahl(x.n), pz(x.c, x.ges)]) },
        { titel: "Verlauf je Monatsultimo", kopf: ["Stichtag", "Tsd. €", "Forderungen Tsd. €"], zeilen: datenB().map(x => [dat(ST[x.m]), tsd(x.c), tsd(x.ges)]) },
        { titel: "Nach Mahnstufe", kopf: ["Mahnstufe", "Tsd. €", "Posten", "Debitoren"], zeilen: datenC().map(x => [x.label, tsd(x.ue + x.nf), zahl(x.n), zahl(x.nd)]) },
        { titel: "Nach Sammelkonto", kopf: ["Konto", "Tsd. €", "überfällig", "Posten"], zeilen: datenD().map(x => [x.label, tsd(x.ue + x.nf), tsd(x.ue), zahl(x.n)]) },
        { titel: "Nach Debitor", kopf: ["Debitor", "Tsd. €", "überfällig", "Posten"], zeilen: datenE().map(x => [x.label, tsd(x.ue + x.nf), tsd(x.ue), zahl(x.n)]) },
      ];
    },
  });
  zeichnen();
})();
