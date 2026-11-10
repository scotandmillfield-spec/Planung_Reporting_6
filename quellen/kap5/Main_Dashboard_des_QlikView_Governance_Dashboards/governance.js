/* Abb. 5.48 „Main Dashboard des Governance Dashboards“ (6. Auflage) – Dashboard 1024 x 646 px, softwareneutral nach dem
   Produktscreenshot. Bereiche wie im Original: Serverbetrieb und Nutzung (Heute, Gestern, 7 Tage, 28 Tage, Verlauf),
   Ladevorgänge (Publisher) mit Ladedauer und Fehlern, Tage seit letzter Aktualisierung, Sitzungen der letzten 90 Tage
   (aktivste Nutzer, genutzte Apps) und Anwendungen (komplexeste Apps, Datenquellen; Kreis → Balken).
   Daten: governance.json (daten_governance.py) – Sitzungen als Einzelsätze, Server je Tag; 28- und 90-Tage-Werte des
   Originals. Klick auf einen Nutzer oder eine App filtert die Nutzungstabelle, Klick auf Zeilen und Balken hebt hervor,
   Esc hebt auf. */
(() => {
  "use strict";
  const { zahl, delta, FARBE, NBSP, sv, el, tw } = DK;
  const T = DATA.tage, HEUTE = T - 1, AB28 = T - 28, NAMEN = DATA.nutzer, APPS = DATA.apps;
  const SZ = DATA.sitzungen.map(([t, u, a]) => ({ t, u, a }));
  const SRV = DATA.server;                                 // je Tag der letzten 28 Tage
  const L = DATA.laden, AK = DATA.aktual;
  const st = new Date(DATA.stichtag + "T00:00:00Z");
  const datum = t => new Date(st.getTime() - (HEUTE - t) * 864e5);
  const tm = t => { const d = datum(t); return `${String(d.getUTCDate()).padStart(2, "0")}.${String(d.getUTCMonth() + 1).padStart(2, "0")}.`; };
  const STICH = `${tm(HEUTE)}${st.getUTCFullYear()}`;
  const pz = (a, nk = 1) => zahl(a * 100, nk) + NBSP + "%";
  const PERIODEN = [["Heute", HEUTE, HEUTE], ["Gestern", HEUTE - 1, HEUTE - 1], ["7 Tage", HEUTE - 6, HEUTE], ["28 Tage", AB28, HEUTE]];

  /* ---------- Zustand ---------- */
  const S = { sel: null };                                 // {typ, key}; typ "nutzer"/"app" filtert die Nutzung
  addEventListener("keydown", e => { if (e.key === "Escape" && S.sel) { S.sel = null; zeichnen(); } });
  const waehlen = (typ, key) => { S.sel = S.sel && S.sel.typ === typ && S.sel.key === key ? null : { typ, key }; zeichnen(); };
  const gewaehlt = typ => (S.sel && S.sel.typ === typ ? S.sel.key : null);

  /* ---------- Kennzahlen ---------- */
  const srvTag = (t, i) => SRV[t - AB28][i];
  const KZ_SERVER = [
    { key: "fehler", label: "Serverfehler", i: 1, art: "summe", rot: true },
    { key: "warn", label: "Serverwarnungen", i: 0, art: "summe", rot: true },
    { key: "ram", label: "Arbeitsspeicher max., GB", i: 2, art: "max" },
    { key: "cpu", label: "CPU-Last max., %", i: 3, art: "max" },
    { key: "geladen", label: "Geladene Apps max.", i: 4, art: "max" },
  ];
  function sitzungen() {
    const f = S.sel;
    return SZ.filter(s => !f || (f.typ === "nutzer" ? s.u === f.key : f.typ === "app" ? s.a === f.key : true));
  }
  function nutzungKz() {
    const ss = sitzungen(), gef = S.sel && (S.sel.typ === "nutzer" || S.sel.typ === "app");
    const imZeitraum = (a, b) => ss.filter(s => s.t >= a && s.t <= b);
    return [
      { key: "nutzer", label: "Aktive Nutzer", art: "distinkt", wert: (a, b) => new Set(imZeitraum(a, b).filter(s => s.u > 0).map(s => s.u)).size },
      { key: "apps", label: "Genutzte Apps", art: "distinkt", wert: (a, b) => new Set(imZeitraum(a, b).map(s => s.a)).size },
      { key: "sitz", label: "Sitzungen", art: "summe", wert: (a, b) => imZeitraum(a, b).length },
      { key: "gleich", label: "Gleichzeitige Sitzungen max.", art: "max", wert: gef ? null : (a, b) => Math.max(...range(a, b).map(t => srvTag(t, 5))) },
    ];
  }
  const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
  const srvWert = (k, a, b) => (k.art === "summe" ? range(a, b).reduce((s, t) => s + srvTag(t, k.i), 0) : Math.max(...range(a, b).map(t => srvTag(t, k.i))));

  /* ---------- Layout (Seite 1024 x 646) ---------- */
  DK.init({ titel: "Governance-Dashboard" });
  const bKopf = DK.box("kopf", 16, 10, 992, 46);
  DK.haarlinie(62);
  const bServer = DK.box("v-server", 16, 70, 600, 168);
  DK.haarlinie(243, 16, 408);
  const bNutzung = DK.box("v-nutzung", 16, 250, 600, 150);
  const bLaden = DK.box("v-laden", 640, 70, 368, 166);
  DK.haarlinie(243, 640, 16);
  const bAktual = DK.box("v-aktual", 640, 250, 368, 150);
  DK.haarlinie(406);
  const gruppe = (id, x, b, text) => el("div", { id, class: "dk-abs gv-gruppe", style: `left:${x}px;top:410px;width:${b}px;height:18px` }, document.getElementById("seite"), text);
  gruppe("gr-90", 16, 482, "Sitzungen der letzten 90 Tage (ohne anonyme Zugriffe)");
  gruppe("gr-apps", 516, 492, `Anwendungen am ${STICH}`);
  const bNutzer = DK.box("v-nutzer", 16, 434, 232, 208);
  const bApps = DK.box("v-apps", 266, 434, 232, 208);
  const bKomplex = DK.box("v-komplex", 516, 434, 232, 208);
  const bQuellen = DK.box("v-quellen", 766, 434, 242, 208);
  el("style", {}, document.head, `.gv-gruppe { font-size: 14px; color: var(--muted); border-bottom: 1px solid #9A9A9A; white-space: nowrap; }`);

  /* ---------- Tooltip (gleiches Verhalten wie die Bausteine von DK) ---------- */
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
  const passt = (k, b) => k.find(t => tw(t) <= b) || k[k.length - 1];

  /* ---------- Tabelle mit Zeiträumen und Verlauf (Server, Nutzung) ---------- */
  const C = { label: 0, p: [262, 336, 410, 490], spark: 506, sparkB: 94 };
  function zeitTabelle(f, breite, zeilen, typ) {
    const RH = 20, svg = sv("svg", { width: breite, height: 20 + RH * zeilen.length, role: "img" }, f);
    PERIODEN.forEach(([n], j) => sv("text", { x: C.p[j], y: 14, "text-anchor": "end", class: "muted", ...(j === 3 ? { id: "sp-28-" + typ } : {}) }, svg, n));
    const vk = sv("text", { x: C.spark, y: 14, class: "muted", id: "sp-verlauf-" + typ }, svg, "Verlauf");
    tooltip(vk, () => ["Verlauf", `Tageswerte ${tm(AB28)}–${tm(HEUTE)}, Achse ab null`, "Säulen: Summen je Tag · Linie: Höchst- bzw. Distinktwerte je Tag"]);
    sv("line", { x1: 0, x2: breite, y1: 19.5, y2: 19.5, stroke: "#3A3F44", "stroke-width": 1 }, svg);
    zeilen.forEach((z, r) => {
      const y = 20 + r * RH, cy = y + RH / 2, sel = gewaehlt(typ);
      const g = sv("g", { class: "dk-klick" + (sel !== null && sel !== z.key ? " dk-blass" : ""), id: `zt-${z.key}` }, svg);
      if (r < zeilen.length - 1) sv("line", { x1: 0, x2: breite, y1: y + RH - 0.5, y2: y + RH - 0.5, stroke: "#EFEFEF", "stroke-width": 1 }, g);
      sv("text", { x: C.label, y: cy, dy: "0.35em" }, g, z.label);
      z.werte.forEach((v, j) => sv("text", { x: C.p[j], y: cy, dy: "0.35em", "text-anchor": "end",
        style: `${j === 3 ? "font-weight:bold;" : ""}${z.rot && v > 0 ? "fill:" + FARBE.schlecht : ""}` }, g, v == null ? "–" : zahl(v)));
      // Verlauf: Summen als Mini-Säulen, Höchstwerte als Linie, Achse ab null
      const reihe = z.reihe, max = Math.max(...reihe.filter(v => v != null), 1), h = RH - 6, x0 = C.spark, w = C.sparkB / reihe.length;
      if (reihe.some(v => v == null)) sv("text", { x: x0, y: cy, dy: "0.35em", class: "muted" }, g, "–");
      else if (z.art !== "summe") sv("polyline", { points: reihe.map((v, i) => `${(x0 + w * (i + 0.5)).toFixed(1)},${(y + 3 + h - v / max * h).toFixed(1)}`).join(" "),
        fill: "none", stroke: FARBE.ist, "stroke-width": 1.2 }, g);
      else reihe.forEach((v, i) => { if (v > 0) sv("rect", { x: x0 + w * i + 0.4, y: y + 3 + h - v / max * h, width: Math.max(1, w - 0.8), height: v / max * h,
        fill: z.rot ? FARBE.schlecht : FARBE.ist }, g); });
      sv("line", { x1: x0, x2: x0 + C.sparkB, y1: y + 3 + h + 0.5, y2: y + 3 + h + 0.5, stroke: "#C9C9C9", "stroke-width": 1 }, g);
      const hit = sv("rect", { x: 0, y, width: breite, height: RH, fill: "transparent" }, g);
      hit.addEventListener("click", () => waehlen(typ, z.key));
      tooltip(hit, () => z.tip());
    });
  }
  const tagMax = reihe => { let m = 0; reihe.forEach((v, i) => { if (v != null && v > reihe[m]) m = i; }); return m; };

  function server() {
    const zeilen = KZ_SERVER.map(k => {
      const reihe = range(AB28, HEUTE).map(t => srvTag(t, k.i));
      return { ...k, reihe, werte: PERIODEN.map(([, a, b]) => srvWert(k, a, b)),
        tip: () => { const m = tagMax(reihe);
          return [k.label, `${k.art === "summe" ? "Summe" : "Höchstwert"} 28 Tage: ${zahl(srvWert(k, AB28, HEUTE))}`,
            `höchster Tageswert ${zahl(reihe[m])} am ${tm(AB28 + m)} · heute ${zahl(reihe[27])}`,
            k.rot ? "rot: Wert über 0 (ungünstig)" : "", "Klick hebt die Kennzahl hervor"]; } };
    });
    const sel = gewaehlt("server"), z = zeilen.find(x => x.key === sel);
    const w28 = k => zeilen.find(x => x.key === k).werte[3];
    const b = z ? (z.art === "summe" ? `${z.label}: ${zahl(z.werte[3])} in 28 Tagen, höchster Tageswert ${zahl(z.reihe[tagMax(z.reihe)])} am ${tm(AB28 + tagMax(z.reihe))}`
                                    : `${z.label}: höchstens ${zahl(z.werte[3])} am ${tm(AB28 + tagMax(z.reihe))}, heute ${zahl(z.werte[0])}`)
      : passt([`${zahl(w28("warn"))} Warnungen in 28 Tagen, ${w28("fehler") ? zahl(w28("fehler")) + " Fehler" : "keine Fehler"}; Spitzen: Arbeitsspeicher ${w28("ram")} GB, CPU ${w28("cpu")} %`,
               `${zahl(w28("warn"))} Warnungen in 28 Tagen, ${w28("fehler") ? zahl(w28("fehler")) + " Fehler" : "keine Fehler"}`], 600);
    const v = DK.visual(bServer, { titel: "Serverbetrieb", einheit: "Anzahl bzw. Höchstwert", botschaft: b });
    zeitTabelle(v.flaeche, v.breite, zeilen, "server");
  }

  function nutzung() {
    const kz = nutzungKz(), f = S.sel && (S.sel.typ === "nutzer" || S.sel.typ === "app") ? S.sel : null;
    const fName = f ? (f.typ === "nutzer" ? NAMEN[f.key] : APPS[f.key]) : "";
    const zeilen = kz.map(k => {
      const reihe = range(AB28, HEUTE).map(t => (k.wert ? k.wert(t, t) : null));
      return { ...k, reihe, werte: PERIODEN.map(([, a, b]) => (k.wert ? k.wert(a, b) : null)),
        tip: () => { const m = tagMax(reihe);
          return [k.label + (f ? " · " + fName : ""), k.wert ? `28 Tage: ${zahl(k.wert(AB28, HEUTE))}${k.art === "distinkt" ? " (verschiedene)" : ""}` : "je Nutzer bzw. App nicht erfasst",
            k.wert ? `höchster Tageswert ${zahl(reihe[m])} am ${tm(AB28 + m)}` : "", k.key === "nutzer" ? "ohne anonyme Zugriffe" : "",
            "Klick hebt die Kennzahl hervor"]; } };
    });
    const w = (k, j) => zeilen.find(x => x.key === k).werte[j];
    const sel = gewaehlt("nutzung"), z = zeilen.find(x => x.key === sel);
    let b;
    if (z && z.werte[3] != null) b = `${z.label}${f ? " (" + fName + ")" : ""}: ${zahl(z.werte[3])} in 28 Tagen, ${zahl(z.werte[2])} in 7 Tagen, heute ${zahl(z.werte[0])}`;
    else if (f) b = passt([`${fName}: ${zahl(w("sitz", 3))} Sitzungen in 28 Tagen, ${zahl(w("sitz", 2))} in 7 Tagen, ${zahl(w("sitz", 0))} heute`,
                           `${fName}: ${zahl(w("sitz", 3))} Sitzungen in 28 Tagen`], 600);
    else b = passt([`${zahl(w("nutzer", 3))} aktive Nutzer mit ${zahl(w("sitz", 3))} Sitzungen in 28 Tagen, ${w("apps", 3) === 1 ? "alle in einer App" : "in " + w("apps", 3) + " Apps"}`,
                    `${zahl(w("nutzer", 3))} aktive Nutzer mit ${zahl(w("sitz", 3))} Sitzungen in 28 Tagen`], 600);
    const v = DK.visual(bNutzung, { titel: "Nutzung", einheit: f ? "gefiltert: " + fName : "Anzahl bzw. Höchstwert", botschaft: b });
    zeitTabelle(v.flaeche, v.breite, zeilen, "nutzung");
  }

  /* ---------- Ladevorgänge: gestapelte Balken, fehlerhafte Anteile rot ---------- */
  function laden() {
    const ges = L.anzahl.reduce((a, b) => a + b, 0), fe = L.fehler.reduce((a, b) => a + b, 0), sel = gewaehlt("laden");
    const b = sel !== null ? `${L.klassen[sel]}: ${zahl(L.anzahl[sel])} Ladevorgänge, davon ${zahl(L.fehler[sel])} fehlerhaft (${pz(L.fehler[sel] / L.anzahl[sel])})`
      : passt([`${L.auftraege} Ladeaufträge: ${zahl(fe)} von ${zahl(ges)} Ladevorgängen fehlerhaft (${pz(fe / ges)})`,
               `${L.auftraege} Ladeaufträge: ${zahl(fe)} von ${zahl(ges)} fehlerhaft (${pz(fe / ges)})`,
               `${zahl(fe)} von ${zahl(ges)} fehlerhaft (${pz(fe / ges)})`], 368);
    const v = DK.visual(bLaden, { titel: "Ladevorgänge nach Dauer", einheit: "Anzahl, 90 Tage", botschaft: b });
    const RH = 22, svg = sv("svg", { width: v.breite, height: RH * L.klassen.length, role: "img", id: "laden-balken" }, v.flaeche);
    const lw = Math.ceil(Math.max(...L.klassen.map(k => tw(k)))) + 10, vw = Math.ceil(tw(zahl(Math.max(...L.anzahl)))) + 8;
    const k = (v.breite - lw - vw) / Math.max(...L.anzahl);
    L.klassen.forEach((kl, i) => {
      const y = i * RH, g = sv("g", { class: "dk-klick" + (sel !== null && sel !== i ? " dk-blass" : "") }, svg);
      sv("text", { x: lw - 10, y: y + RH / 2, dy: "0.35em", "text-anchor": "end" }, g, kl);
      const bo = (L.anzahl[i] - L.fehler[i]) * k, bf = L.fehler[i] * k, bh = Math.round(RH * 0.68), by = y + (RH - bh) / 2;
      sv("rect", { x: lw, y: by, width: Math.max(bo, L.anzahl[i] > L.fehler[i] ? 1 : 0), height: bh, fill: FARBE.ist }, g);
      if (L.fehler[i]) sv("rect", { x: lw + bo, y: by, width: Math.max(bf, 1), height: bh, fill: FARBE.schlecht }, g);
      if (bo > 0 && L.fehler[i]) sv("line", { x1: lw + bo, x2: lw + bo, y1: by, y2: by + bh, stroke: "#FFFFFF", "stroke-width": 1 }, g);
      sv("text", { x: lw + Math.max(bo + bf, 1) + 5, y: y + RH / 2, dy: "0.35em" }, g, zahl(L.anzahl[i]));
      const hit = sv("rect", { x: 0, y, width: v.breite, height: RH, fill: "transparent" }, g);
      hit.addEventListener("click", () => waehlen("laden", i));
      tooltip(hit, () => [`Ladedauer ${kl}`, `${zahl(L.anzahl[i])} Ladevorgänge (${pz(L.anzahl[i] / ges)})`,
        `davon fehlerhaft ${zahl(L.fehler[i])} (${pz(L.fehler[i] / L.anzahl[i])})`, "Klick hebt die Klasse hervor"]);
    });
  }

  /* ---------- Balkenlisten (Standardbaustein) ---------- */
  function liste(box, o) {
    const sel = gewaehlt(o.typ);
    const v = DK.visual(box, { titel: o.titel, einheit: o.einheit, botschaft: passt(o.botschaft, box.clientWidth) });
    DK.balken(v.flaeche, { breite: v.breite, hoehe: v.hoehe, zeilenhoehe: o.zh, zeilen: o.zeilen, fmt: o.fmt || (x => zahl(x)),
      auswahl: sel, onClick: key => waehlen(o.typ, key), tooltip: o.tooltip, aria: o.titel });
  }

  function listen() {
    // Aktualität
    const nApps = AK.anzahl.reduce((a, b) => a + b, 0), alt = AK.anzahl[AK.anzahl.length - 1];
    liste(bAktual, { typ: "aktual", titel: "Apps nach letzter Aktualisierung", einheit: "Anzahl", zh: 22,
      botschaft: [`${zahl(alt)} von ${zahl(nApps)} Apps über 60 Tage nicht aktualisiert`, `${zahl(alt)} von ${zahl(nApps)} Apps veraltet`],
      zeilen: AK.klassen.map((k, i) => ({ key: i, label: k, wert: AK.anzahl[i], farbe: i === AK.klassen.length - 1 ? FARBE.schlecht : FARBE.ist })),
      tooltip: z => [`Letzte Aktualisierung vor ${z.label}`, `${zahl(z.wert)} Apps (${pz(z.wert / nApps)})`,
        z.key === AK.klassen.length - 1 ? `ohne Ladeauftrag, rot: veraltet (ungünstig)` : "mit Ladeauftrag", "Klick hebt hervor"] });
    // Aktivste Nutzer (90 Tage, ohne anonym)
    const proN = {}, proA = {};
    SZ.forEach(s => { if (s.u > 0) proN[s.u] = (proN[s.u] || 0) + 1; proA[s.a] = (proA[s.a] || 0) + 1; });
    const top = Object.entries(proN).map(([u, n]) => ({ u: +u, n })).sort((a, b) => b.n - a.n).slice(0, 5);
    const gesamt = SZ.length, topSumme = top.reduce((s, x) => s + x.n, 0);
    const info = (filter) => { const ss = SZ.filter(filter), n28 = ss.filter(s => s.t >= AB28).length, letzte = Math.max(...ss.map(s => s.t));
      return [`${zahl(ss.length)} Sitzungen in 90 Tagen, ${zahl(n28)} in 28 Tagen`, `letzte Sitzung am ${tm(letzte)}${datum(letzte).getUTCFullYear()}`]; };
    liste(bNutzer, { typ: "nutzer", titel: "Aktivste Nutzer", einheit: "Sitzungen", zh: 28,
      botschaft: [`Top 5 mit ${pz(topSumme / gesamt)} aller Sitzungen`, `Top 5: ${pz(topSumme / gesamt)} der Sitzungen`],
      zeilen: top.map(x => ({ key: x.u, label: NAMEN[x.u], wert: x.n })),
      tooltip: z => [z.label, ...info(s => s.u === z.key), "Klick filtert die Nutzung"] });
    // Genutzte Apps
    const genutzt = Object.keys(proA).length;
    liste(bApps, { typ: "app", titel: "Genutzte Apps", einheit: "Sitzungen", zh: 28,
      botschaft: [`${genutzt} von ${zahl(nApps)} Apps genutzt`],
      zeilen: Object.entries(proA).map(([a, n]) => ({ key: +a, label: APPS[+a], wert: n })).sort((a, b) => b.wert - a.wert),
      tooltip: z => [z.label, ...info(s => s.a === z.key), `${zahl(new Set(SZ.filter(s => s.a === z.key && s.u > 0).map(s => s.u)).size)} verschiedene Nutzer`, "Klick filtert die Nutzung"] });
    // Komplexeste Apps
    const kmax = Math.max(...DATA.komplex.map(k => k[1]));
    liste(bKomplex, { typ: "komplex", titel: "Komplexeste Apps", einheit: "Index", zh: 28,
      botschaft: [`${DATA.komplex.filter(k => k[1] === kmax).length} Apps am Höchstwert ${kmax}`],
      zeilen: DATA.komplex.map(([n, v], i) => ({ key: i, label: n, wert: v })),
      tooltip: z => [z.label, `Komplexitätsindex ${z.wert} von höchstens 25`, "aus Umfang von Datenmodell, Objekten und Formeln", "Klick hebt hervor"] });
    // Datenquellen (statt Kreisdiagramm)
    const qs = DATA.quellen.reduce((s, q) => s + q[1], 0);
    const ERKL = { Datenbank: "direkt aus Datenbanken geladen", Zwischendatei: "Zwischenspeicher im Dateiformat der BI-Plattform",
      Speichertabelle: "bereits geladene Tabelle, im Arbeitsspeicher weiterverarbeitet", Tabellenkalkulation: "Tabellenkalkulationsdateien", Sonstige: "Textdateien, Webdienste u. a." };
    liste(bQuellen, { typ: "quelle", titel: "Datenquellen", einheit: "Anzahl", zh: 28,
      botschaft: [`Datenbanken: ${pz(DATA.quellen[0][1] / qs)} der Quellen`],
      zeilen: DATA.quellen.map(([n, v], i) => ({ key: i, label: n, wert: v })),
      tooltip: z => [z.label, `${zahl(z.wert)} Quellen (${pz(z.wert / qs)})`, ERKL[z.label], "Klick hebt hervor"] });
  }

  /* ---------- Zeichnen ---------- */
  function zeichnen() {
    const f = S.sel && (S.sel.typ === "nutzer" || S.sel.typ === "app") ? (S.sel.typ === "nutzer" ? NAMEN[S.sel.key] : APPS[S.sel.key]) : null;
    DK.kopf(bKopf, { titel: "Governance-Dashboard der BI-Plattform",
      untertitel: `Betrieb, Nutzung und Anwendungen · Stichtag ${STICH}${f ? " · Nutzung gefiltert: " + f : ""}`,
      quelle: "", legende: [[FARBE.schlecht, "ungünstig (Fehler, Warnungen, veraltet)"]] });
    server(); nutzung(); laden(); listen();
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  /* ---------- Lernplattform: Designregeln, Nachbau, Tabellen, CSV ---------- */
  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "v-aktual", anker: "links", versatz: [360, 22], regel: "SAY – Botschaft vermitteln", titel: "Befund statt Überschrift",
        text: "Jedes Visual nennt seinen Befund: 252 von 280 Apps seit über 60 Tagen nicht aktualisiert, nur 2 Apps genutzt, 40 % der Ladevorgänge fehlerhaft. Das Original hatte nur Überschriften in Großbuchstaben (SERVER, USAGE SUMMARY, PUBLISHER)." },
      { nr: 2, ziel: "sp-28-server", anker: "links", versatz: [62, -4], regel: "CHECK – Stimmige Zahlen", titel: "Werte aus Einzelsätzen",
        text: "Alle Zeiträume rechnen aus denselben Sitzungen und Tageswerten; die 28- und 90-Tage-Werte entsprechen dem Original. Dort standen bei Heute, Gestern und 7 Tagen überall 0 oder „–“, die Ladedauer-Klassen ergaben 9.008 statt 9.009 Ladevorgänge und die Klasse „0–7 Tage“ fehlte." },
      { nr: 3, ziel: "laden-balken", anker: "links", versatz: [360, 0], regel: "UNIFY – Semantische Notation", titel: "Rot nur für Ungünstiges",
        text: "Rot markiert Warnungen, fehlerhafte Ladevorgänge und veraltete Apps, alles andere ist anthrazit. Das Original färbte alle Balken grün oder rot ohne Bedeutung – die komplexesten Apps rot, die Nutzer grün." },
      { nr: 4, ziel: "v-quellen", anker: "links", versatz: [236, 22], regel: "EXPRESS – Passende Darstellung", titel: "Balken statt Kreis",
        text: "Die Datenquellen stehen als Balken mit Anzahl statt als Kreis mit fünf Segmenten, Verlaufsfarben und Legende; die Anteile stehen in Botschaft und Tooltip. Produktbezeichnungen sind neutral: Zwischendatei, Speichertabelle, Tabellenkalkulation." },
      { nr: 5, ziel: "sp-verlauf-server", anker: "links", versatz: [124, -4], regel: "EXPRESS – Verlauf mit Maß", titel: "Verlauf über 28 Tage, ab null",
        text: "Der Verlauf deckt denselben Zeitraum ab wie die Spalte „28 Tage“: Summen als Mini-Säulen, Höchst- und Distinktwerte als Linie, jeweils ab null. Im Original zeigten die Verläufe nur zwei Wochen (Dec-01 bis Dec-15) ohne Bezug zu den Spalten." },
      { nr: 6, ziel: "gr-90", anker: "links", versatz: [400, -3], regel: "STRUCTURE – Inhalte ordnen", titel: "Zeiträume als Gruppen",
        text: "Oben stehen Betrieb und Nutzung mit gleichen Spalten (Heute, Gestern, 7 Tage, 28 Tage), rechts die Ladevorgänge, unten die Gruppen „Sitzungen der letzten 90 Tage“ und „Anwendungen am Stichtag“. Der Hinweis „Excludes Anonymous“ steht in der Gruppenüberschrift." },
      { nr: 7, ziel: "kopf-titel", anker: "links", versatz: [400, 2], regel: "SIMPLIFY – Überflüssiges weglassen", titel: "Ohne Reiter, Logo und Hilfesymbol",
        text: "Reiterleiste (Operations, Applications, Scan Details …), grüner Produkttitel, Hilfesymbol und die unscharf gemachten Nutzer- und App-Namen entfallen; Namen sind erfunden. Die Einheiten stehen einmal in der Zeile (GB, %)." },
      { nr: 8, ziel: "v-nutzer", anker: "links", versatz: [226, 22], regel: "CONDENSE – Filtern und vertiefen", titel: "Klick filtert die Nutzung",
        text: "Ein Klick auf einen Nutzer oder eine App filtert die Nutzungstabelle samt Verlauf; Zeilen und Balken lassen sich hervorheben, Esc hebt auf. Tooltips nennen Details wie die Fehlerquote je Ladedauer oder die letzte Sitzung." },
    ],
    nachbauIntro: "Seitengröße 1024 × 646 px. Schrift Arial: Beschriftungen 10,5 pt, Visualtitel 12 pt, Berichtstitel 16,5 pt. Datenmodell: Sitzungen (Datum, Nutzer, App), Servertage (Datum, Warnungen, Fehler, Arbeitsspeicher, CPU, geladene Apps, gleichzeitige Sitzungen) und Datumstabelle; Ladevorgänge, Aktualität, Komplexität und Datenquellen als kleine Faktentabellen (siehe CSV-Datei, Spalte „Ebene“).",
    nachbau: [
      { id: "A", ziel: "v-server", anker: "links", versatz: [130, 4], titel: "Serverbetrieb und Nutzung", visual: "Matrix mit Sparklines (2×)",
        felder: "Zeilen: Kennzahl (Hilfstabelle); Werte: Heute, Gestern, 7 Tage, 28 Tage über DATESINPERIOD( Datum[Datum]; MAX( Datum[Datum] ); −7; DAY ) usw.; Sparkline: Measure je Tag über Datum",
        format: "Sparkline Säule bzw. Linie #3A3F44, Warnungen #C62828; 28 Tage fett; Schriftfarbe rot über bedingte Formatierung (Wert > 0)",
        hinweis: "Aktive Nutzer = CALCULATE( DISTINCTCOUNT( Sitzungen[Nutzer] ); Sitzungen[Nutzer] <> \"anonym\" ) – verschiedene Nutzer, keine Summe der Tage." },
      { id: "B", ziel: "laden-balken", anker: "links", versatz: [360, 0], titel: "Ladevorgänge nach Dauer", visual: "Gestapeltes Balkendiagramm",
        felder: "Y-Achse: Dauerklasse (Sortierspalte); Werte: erfolgreich, fehlerhaft", format: "erfolgreich #3A3F44, fehlerhaft #C62828; Datenbeschriftung Gesamtsumme; Achsen und Legende aus" },
      { id: "C", ziel: "v-aktual", anker: "links", versatz: [360, 22], titel: "Apps nach letzter Aktualisierung", visual: "Gruppiertes Balkendiagramm",
        felder: "Y-Achse: Klasse der Tage seit letzter Aktualisierung; Wert: Anzahl Apps", format: "Balkenfarbe bedingt: über 60 Tage #C62828, sonst #3A3F44" },
      { id: "D", ziel: "v-apps", anker: "links", versatz: [226, 22], titel: "Nutzer, Apps, Komplexität, Datenquellen", visual: "Gruppiertes Balkendiagramm (4×)",
        felder: "Nutzer: Filter Top N = 5 nach Sitzungen, ohne „anonym“; Apps: Sitzungen je App; Komplexität: Index je App; Datenquellen: Anzahl je Art",
        format: "#3A3F44, Datenbeschriftung außen, Achsen aus", hinweis: "Kreuzfilterung: Klick auf Nutzer oder App filtert die Matrix „Nutzung“, die übrigen Visuals über „Interaktionen bearbeiten“ auf Keine stellen." },
      { id: "E", ziel: "gr-apps", anker: "links", versatz: [190, -3], titel: "Gruppenüberschriften", visual: "Textfeld mit Linie (Form)", felder: "–",
        format: "10,5 pt #4D4D4D, Linie 0,75 pt #9A9A9A" },
    ],
    theme: DK.thema(),
    csv: { name: "governance_dashboard_daten.csv", text: () => {
      const iso = t => datum(t).toISOString().slice(0, 10);
      const z = ["Ebene;Datum;Nutzer;App;Kennzahl;Wert"];
      SZ.forEach(s => z.push(["Sitzung", iso(s.t), NAMEN[s.u], APPS[s.a], "Sitzung", 1].join(";")));
      const K = ["Serverwarnungen", "Serverfehler", "Arbeitsspeicher_max_GB", "CPU_Last_max_Prozent", "Geladene_Apps_max", "Gleichzeitige_Sitzungen_max"];
      SRV.forEach((r, i) => r.forEach((v, j) => z.push(["Server", iso(AB28 + i), "", "", K[j], v].join(";"))));
      L.klassen.forEach((k, i) => { z.push(["Ladevorgänge 90 Tage", "", "", "", "Ladedauer " + k, L.anzahl[i]].join(";"));
        z.push(["Ladevorgänge 90 Tage", "", "", "", `Ladedauer ${k}, fehlerhaft`, L.fehler[i]].join(";")); });
      AK.klassen.forEach((k, i) => z.push(["Apps", iso(HEUTE), "", "", "Letzte Aktualisierung " + k, AK.anzahl[i]].join(";")));
      DATA.komplex.forEach(([a, v]) => z.push(["Komplexität", iso(HEUTE), "", a, "Komplexitätsindex", v].join(";")));
      DATA.quellen.forEach(([q, v]) => z.push(["Datenquellen", iso(HEUTE), "", "", q, v].join(";")));
      return z.join("\r\n"); } },
    tabellen: () => {
      const kopf = ["Kennzahl", ...PERIODEN.map(p => p[0])];
      const nz = nutzungKz();
      const proN = {}, proA = {};
      SZ.forEach(s => { if (s.u > 0) proN[s.u] = (proN[s.u] || 0) + 1; proA[s.a] = (proA[s.a] || 0) + 1; });
      return [
        { titel: "Serverbetrieb", kopf, zeilen: KZ_SERVER.map(k => [k.label, ...PERIODEN.map(([, a, b]) => zahl(srvWert(k, a, b)))]) },
        { titel: "Nutzung" + (S.sel && (S.sel.typ === "nutzer" || S.sel.typ === "app") ? " (gefiltert)" : ""), kopf,
          zeilen: nz.map(k => [k.label, ...PERIODEN.map(([, a, b]) => (k.wert ? zahl(k.wert(a, b)) : "–"))]) },
        { titel: "Ladevorgänge nach Dauer (90 Tage)", kopf: ["Dauer", "Ladevorgänge", "fehlerhaft", "Fehlerquote"],
          zeilen: L.klassen.map((k, i) => [k, zahl(L.anzahl[i]), zahl(L.fehler[i]), pz(L.fehler[i] / L.anzahl[i])])
            .concat([["Summe", zahl(L.anzahl.reduce((a, b) => a + b)), zahl(L.fehler.reduce((a, b) => a + b)), pz(L.fehler.reduce((a, b) => a + b) / L.anzahl.reduce((a, b) => a + b))]]) },
        { titel: "Apps nach letzter Aktualisierung", kopf: ["Tage", "Apps"], zeilen: AK.klassen.map((k, i) => [k, zahl(AK.anzahl[i])]) },
        { titel: "Aktivste Nutzer (90 Tage)", kopf: ["Nutzer", "Sitzungen"],
          zeilen: Object.entries(proN).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([u, n]) => [NAMEN[+u], zahl(n)]) },
        { titel: "Genutzte Apps (90 Tage)", kopf: ["App", "Sitzungen"], zeilen: Object.entries(proA).map(([a, n]) => [APPS[+a], zahl(n)]) },
        { titel: "Komplexeste Apps", kopf: ["App", "Index"], zeilen: DATA.komplex.map(([a, v]) => [a, zahl(v)]) },
        { titel: "Datenquellen", kopf: ["Art", "Anzahl"], zeilen: DATA.quellen.map(([q, v]) => [q, zahl(v)]) },
      ];
    },
  });
  zeichnen();
})();
