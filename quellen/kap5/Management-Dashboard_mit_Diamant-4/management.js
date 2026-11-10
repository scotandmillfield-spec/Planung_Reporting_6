/* Dashboard „Management-Dashboard“ – Abb. 5.54 (Produktscreenshot softwareneutral nachgebaut). Seite 1024 x 646 px.
   Daten: management.json (daten_management.py) – BWA-Monatswerte je Haus und Position (Ist, Plan), Belegung und
   Personaldaten je Haus und Monat. Inhalte wie im Original: BWA als Plan-Ist-Vergleich, Kennzahlen (Erlöse,
   Personalkosten, Ergebnis je Belegungstag, Betriebsergebnis, Teilzeitquote, Verhältnis Fach-/Assistenzkräfte),
   Erlöse je Monat, Auslastungsgrad mit Benchmark, Krankheits- und Überstundenquote, Kostenstruktur und Kosten je
   Berechnungstag. Klick auf eine BWA-Zeile oder Kostenart zeigt deren Monatsverlauf, Klick auf ein Haus filtert,
   Klick auf einen Monat wählt den Berichtsmonat, Esc hebt auf. */
(() => {
  "use strict";
  const { zahl, delta, wirkung, FARBE, NBSP, sv, el, tw } = DK;
  const MON = DATA.monate, NM = MON.length, H = DATA.haeuser, P = DATA.positionen;
  const MNAME = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
  const mLang = m => MNAME[Number(MON[m].slice(5)) - 1];
  const mKurz = m => mLang(m).slice(0, 3);
  const PM = DATA.personal_monate, PN = PM.length;
  const pmKurz = i => MNAME[Number(PM[i].slice(5)) - 1].slice(0, 3);
  const pmLang = i => `${MNAME[Number(PM[i].slice(5)) - 1]} ${PM[i].slice(0, 4)}`;
  const haus = i => H[i][1].replace("Haus ", "");

  /* ---------- Würfel: W[art][pos][haus][monat] in Cent ---------- */
  const PI = {};
  P.forEach((p, i) => { PI[p[0]] = i; });
  const leer = () => P.map(() => H.map(() => Array(NM).fill(0)));
  const W = { ist: leer(), plan: leer() };
  DATA.bwa.forEach(([h, m, pi, ist, plan]) => { W.ist[pi][h][m] = ist; W.plan[pi][h][m] = plan; });
  const BEL = H.map(() => Array(NM).fill(null));
  DATA.belegung.forEach(([h, m, kap, bi, bp, ai, ap]) => { BEL[h][m] = { kap, bi, bp, ai, ap }; });
  const PERS = H.map(() => Array(PN).fill(null));
  DATA.personal.forEach(([h, i, fach, ass, vk, ko, tz, soll, krank, ueber]) => { PERS[h][i] = { fach, ass, vk, ko, tz, soll, krank, ueber }; });

  /* ---------- BWA-Zeilen (Reihenfolge des Originals) ---------- */
  const ZEILEN = [
    { key: "erl", label: "Gesamterlöse", kurz: "Erlöse", teile: ["pfl", "uv"], r: 1, stufe: "gruppe" },
    { key: "pfl", r: 1, stufe: "kind", kurz: "Pflegeleistungen" },
    { key: "uv", r: 1, stufe: "kind", kurz: "Unterkunft/Verpflegung" },
    { key: "gk", label: "Gemeinkosten", kurz: "Gemeinkosten", teile: ["sach", "ener", "verw"], r: -1, stufe: "gruppe" },
    { key: "sach", r: -1, stufe: "kind", kurz: "Sachbedarf" },
    { key: "ener", r: -1, stufe: "kind", kurz: "Energie, Wasser" },
    { key: "verw", r: -1, stufe: "kind", kurz: "Verwaltungsbedarf" },
    { key: "ze", label: "Zwischenergebnis", kurz: "Zwischenergebnis", r: 1, stufe: "ergebnis" },
    { key: "pers", r: -1, stufe: "oben", kurz: "Personalkosten" },
    { key: "vek", label: "Variable Einzelkosten", kurz: "Variable Einzelkosten", teile: ["leb", "steu", "afa"], r: -1, stufe: "gruppe" },
    { key: "leb", r: -1, stufe: "kind", kurz: "Lebensmittel" },
    { key: "steu", r: -1, stufe: "kind", kurz: "Steuern, Abgaben" },
    { key: "afa", r: -1, stufe: "kind", kurz: "Abschreibungen" },
    { key: "soe", r: 1, stufe: "oben", kurz: "Sonstige Erträge" },
    { key: "be", label: "Betriebsergebnis", kurz: "Betriebsergebnis", r: 1, stufe: "ergebnis" },
  ];
  ZEILEN.forEach(z => { if (!z.label) z.label = P[PI[z.key]][1]; });
  const ZI = {};
  ZEILEN.forEach(z => { ZI[z.key] = z; });
  const KOSTEN = ["sach", "ener", "verw", "pers", "leb", "steu", "afa"];        // Kostenarten in BWA-Reihenfolge
  const KOSTEN_KURZ = { sach: "Sachbedarf", ener: "Energie, Wasser", verw: "Verwaltung", pers: "Personal", leb: "Lebensmittel",
                        steu: "Steuern, Abgaben", afa: "Abschreibungen" };

  /* ---------- Zustand ---------- */
  const S = { m: 2, haus: null, pos: null };
  addEventListener("keydown", e => {
    if (e.key !== "Escape") return;
    if (S.pos) S.pos = null; else if (S.haus !== null) S.haus = null; else return;
    zeichnen();
  });
  const waehlen = key => { S.pos = S.pos === key ? null : key; zeichnen(); };
  const hausSetzen = h => { S.haus = S.haus === h ? null : h; zeichnen(); };

  /* ---------- Berechnung ---------- */
  const bis = m => [...Array(m + 1).keys()];
  const hs = (ohne) => (ohne === "haus" || S.haus === null ? H.map((_, i) => i) : [S.haus]);
  function wert(key, art, ms, hl) {
    const z = ZI[key];
    if (key === "ze") return wert("erl", art, ms, hl) - wert("gk", art, ms, hl);
    if (key === "be") return wert("ze", art, ms, hl) - wert("pers", art, ms, hl) - wert("vek", art, ms, hl) + wert("soe", art, ms, hl);
    if (z && z.teile) return z.teile.reduce((s, k) => s + wert(k, art, ms, hl), 0);
    const pi = PI[key];
    let s = 0;
    hl.forEach(h => ms.forEach(m => { s += W[art][pi][h][m]; }));
    return s;
  }
  const bel = (feld, ms, hl) => hl.reduce((s, h) => s + ms.reduce((t, m) => t + BEL[h][m][feld], 0), 0);
  const pers = (feld, i, hl) => hl.reduce((s, h) => s + PERS[h][i][feld], 0);
  const tsd = c => zahl(c / 1e5, 0);
  const eur = c => zahl(c / 100, 2) + NBSP + "€";
  const pd = (a, b) => (b ? delta((a / b - 1) * 100, 1, NBSP + "%") : "–");
  const pz = (a, b, nk = 1) => (b ? zahl(a / b * 100, nk) : "–") + NBSP + "%";
  const passt = (k, breite, px = 14, fett = false) => k.find(t => tw(t, px, fett) <= breite) || k[k.length - 1];
  const zeitraum = (kurz = false) => (S.m === 0 ? `${kurz ? "Jan" : "Januar"} 2027` : kurz ? `Jan–${mKurz(S.m)} 2027 kum.` : `Januar–${mLang(S.m)} 2027 kumuliert`);

  /* ---------- Layout ---------- */
  DK.init({ titel: "Management-Dashboard" });
  const bKopf = DK.box("kopf", 16, 10, 992, 46);
  DK.haarlinie(62);
  const bFilter = DK.box("filter", 16, 68, 992, 50, "dk-filter");
  const bKpi = DK.box("kpis", 16, 128, 992, 68);
  DK.haarlinie(206);
  const bBwa = DK.box("v-bwa", 16, 216, 450, 426);
  const bMon = DK.box("v-monat", 486, 216, 241, 200);
  const bAus = DK.box("v-auslastung", 747, 216, 261, 200);
  DK.haarlinie(426, 486, 16);
  const bQuo = DK.box("v-quoten", 486, 436, 241, 206);
  const bKos = DK.box("v-kosten", 747, 436, 261, 206);

  /* ---------- lokaler Tooltip (wie DK, leere Zeilen entfallen) ---------- */
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

  /* ---------- Datenschnitte ---------- */
  const knopfMonat = DK.schnitt(bFilter, "Berichtsmonat 2027 (Werte kumuliert)", "knoepfe", {
    optionen: MON.map((_, m) => [m, mKurz(m)]), wert: S.m, onChange: v => { S.m = Number(v); zeichnen(); } });
  const knopfHaus = DK.schnitt(bFilter, "Haus", "knoepfe", {
    optionen: [["alle", "Alle"], ...H.map((_, i) => [String(i), haus(i)])], wert: "alle",
    onChange: v => { S.haus = v === "alle" ? null : Number(v); zeichnen(); } });

  /* ---------- Berechnungen je Visual (auch für „Werte als Tabelle“) ---------- */
  function kennzahlen() {
    const ms = bis(S.m), hl = hs(), pi = 12 + S.m;
    const k = {};
    ["erl", "pers", "be"].forEach(key => { k[key] = { ist: wert(key, "ist", ms, hl), plan: wert(key, "plan", ms, hl) }; });
    const bi = bel("bi", ms, hl), bp = bel("bp", ms, hl);
    k.ebt = { ist: k.be.ist / 100 / bi, plan: k.be.plan / 100 / bp, bi, bp };
    const fach = pers("fach", pi, hl), ass = pers("ass", pi, hl);
    k.fq = { ist: fach / (fach + ass), plan: DATA.fk_soll, fach, ass };
    k.tz = { ist: pers("tz", pi, hl) / pers("ko", pi, hl), vj: pers("tz", pi - 12, hl) / pers("ko", pi - 12, hl), ko: pers("ko", pi, hl) };
    return k;
  }
  function datenBwa() {
    const ms = bis(S.m), hl = hs();
    return ZEILEN.map(z => {
      const ist = wert(z.key, "ist", ms, hl), plan = wert(z.key, "plan", ms, hl);
      return { z, ist, plan, d: Math.round(ist / 1e5) - Math.round(plan / 1e5) };
    });
  }
  function datenMonat() {
    const key = S.pos || "erl", hl = hs();
    return MON.map((_, m) => ({ m, ist: m <= S.m ? wert(key, "ist", [m], hl) : null, plan: wert(key, "plan", [m], hl) }));
  }
  function datenAuslastung() {
    const ms = bis(S.m);
    const vg = ms.reduce((s, m) => s + DATA.vergleich[m] * DATA.tage[m], 0) / ms.reduce((s, m) => s + DATA.tage[m], 0);
    const zeile = (key, hl, label) => {
      const kap = bel("kap", ms, hl), bi = bel("bi", ms, hl), bp = bel("bp", ms, hl);
      const ist = bi / kap * 100, plan = bp / kap * 100;
      const pl = hl.reduce((s, h) => s + H[h][2], 0);
      return { key, label, ist, plan, vg, pl, bi, bp, werte: { ist, dpl: Number(ist.toFixed(1)) - Number(plan.toFixed(1)), dvg: Number(ist.toFixed(1)) - Number(vg.toFixed(1)) } };
    };
    return { vg, zeilen: [...H.map((_, i) => zeile(i, [i], haus(i))), { ...zeile("ges", H.map((_, i) => i), "Gesamt"), summe: true }] };
  }
  function datenQuoten() {
    const hl = hs(), ende = 12 + S.m;
    return [...Array(12).keys()].map(j => {
      const i = ende - 11 + j, soll = pers("soll", i, hl);
      return { i, kq: pers("krank", i, hl) / soll * 100, uq: pers("ueber", i, hl) / soll * 100, soll };
    });
  }
  function datenKosten() {
    const ms = bis(S.m), hl = hs(), bt = bel("bi", ms, hl) + bel("ai", ms, hl), btp = bel("bp", ms, hl) + bel("ap", ms, hl);
    const z = KOSTEN.map(key => {
      const ist = wert(key, "ist", ms, hl), plan = wert(key, "plan", ms, hl);
      return { key, label: KOSTEN_KURZ[key], name: ZI[key].label, ist, plan, wert: ist / 100 / bt, wPlan: plan / 100 / btp };
    });
    const ges = z.reduce((s, x) => s + x.ist, 0);
    z.forEach(x => { x.anteil = x.ist / ges; });
    return { zeilen: z, bt, btp, ges };
  }

  /* ---------- BWA-Matrix (eigene Funktion: Wirkungsrichtung je Zeile, Gruppen und Ergebniszeilen) ---------- */
  const SP = { pos: 238, ist: 54, plan: 54, d: 104 }, DTXT = 46;
  function bwaTabelle(f, daten) {
    const t = el("table", { class: "dk-matrix", id: "bwa-tabelle", style: "table-layout:fixed;width:450px" }, f.flaeche);
    const cg = el("colgroup", {}, t);
    Object.values(SP).forEach(w => el("col", { style: `width:${w}px` }, cg));
    const kopf = el("tr", {}, el("thead", {}, t));
    el("th", {}, kopf, "Position");
    el("th", {}, kopf, "Ist");
    el("th", {}, kopf, "Plan");
    el("th", { id: "bwa-delta-kopf", style: "text-align:center" }, kopf, "ΔPL");
    const tb = el("tbody", {}, t);
    // ein Maßstab für alle Zeilen, Nulllinie nach Spannweite (wie Datenbalken mit automatischer Achse)
    const neg = Math.max(0, ...daten.map(x => -x.d)), pos = Math.max(0, ...daten.map(x => x.d));
    const k = (SP.d - 8 - DTXT - 6) / Math.max(neg + pos, 1), mitte = DTXT + 2 + neg * k;
    daten.forEach(x => {
      const z = x.z, fett = z.stufe === "gruppe" || z.stufe === "ergebnis";
      const blass = S.pos && S.pos !== z.key;
      const tr = el("tr", { class: "dk-zeile" + (blass ? " dk-blass" : ""), id: "bwa-" + z.key }, tb);
      const st = "height:23px;" + (fett ? "font-weight:bold;" : "") + (z.stufe === "ergebnis" ? "border-top:1px solid var(--ac);" : "");
      el("td", { style: st + (z.stufe === "kind" ? "padding-left:14px;" : "") }, tr, z.label);
      el("td", { style: st }, tr, tsd(x.ist));
      el("td", { style: st }, tr, tsd(x.plan));
      const td = el("td", { class: "dk-dbalken", style: st }, tr);
      const svg = sv("svg", { width: SP.d - 8, height: 20, style: "display:block" }, td);
      const kl = wirkung(x.d, z.r, 0);
      sv("text", { x: DTXT - 4, y: 10, dy: "0.35em", "text-anchor": "end",
                   style: `font-size:14px;fill:${kl === "neutral" ? "var(--text)" : FARBE[kl]};font-weight:${fett ? "bold" : "normal"}` }, svg, delta(x.d, 0));
      const bw = Math.abs(x.d) * k;
      if (bw > 0) sv("rect", { x: x.d >= 0 ? mitte : mitte - bw, y: 5, width: bw, height: 10, fill: FARBE[kl] }, svg);
      sv("line", { x1: mitte, x2: mitte, y1: 1, y2: 19, stroke: "#8C8C8C", "stroke-width": 1 }, svg);
      tr.addEventListener("click", () => waehlen(z.key));
      tooltip(tr, () => [z.label, `Ist ${zeitraum(true)}: ${eur(x.ist)}`, `Plan: ${eur(x.plan)}`,
        `ΔPL ${delta((x.ist - x.plan) / 100, 2, NBSP + "€")} (${pd(x.ist, x.plan)}) · ${kl === "gut" ? "günstig" : kl === "schlecht" ? "ungünstig" : "neutral"}`,
        "Klick zeigt den Monatsverlauf"]);
    });
  }

  /* ---------- Säulen je Monat: Ist vor Plan (weiß mit Kontur); Klick wählt den Berichtsmonat ---------- */
  function monatsSaeulen(f, spalten, kurz) {
    const Wd = f.breite, Hd = f.hoehe, n = spalten.length;
    const svg = sv("svg", { width: Wd, height: Hd, role: "img", "aria-label": `${kurz} je Monat`, id: "monat-svg" }, f.flaeche);
    const oben = 18, unten = 22, PH = Hd - oben - unten, slot = Wd / n, bw = 19, vers = 5;
    const max = Math.max(...spalten.map(s => Math.max(s.ist || 0, s.plan)), 1), basis = oben + PH;
    spalten.forEach((s, i) => {
      const cx = slot * i + slot / 2, akt = s.m === S.m;
      const g = sv("g", { class: "dk-klick", id: "monat-" + i }, svg);
      const hp = Math.max(0, s.plan) / max * PH;
      sv("rect", { x: cx - bw / 2 + vers + 0.5, y: basis - hp + 0.5, width: bw - 1, height: Math.max(0, hp - 1), fill: "#FFFFFF", stroke: "#3A3F44", "stroke-width": 1 }, g);
      if (s.ist !== null) {
        const hi = Math.max(0, s.ist) / max * PH;
        sv("rect", { x: cx - bw / 2 - vers / 2, y: basis - hi, width: bw, height: Math.max(s.ist > 0 ? 1 : 0, hi), fill: FARBE.ist }, g);
        sv("text", { x: cx, y: basis - Math.max(hi, hp) - 5, "text-anchor": "middle", style: akt ? "font-weight:bold" : "" }, g, tsd(s.ist));
      }
      sv("text", { x: cx, y: Hd - 4, "text-anchor": "middle", style: akt ? "font-weight:bold" : "", class: s.m <= S.m ? "" : "muted" }, g, mKurz(s.m));
      if (akt) sv("line", { x1: cx - 15, x2: cx + 15, y1: Hd - 1, y2: Hd - 1, stroke: "#3A3F44", "stroke-width": 2 }, g);
      // Trefferfläche bewusst nicht „transparent“: der Klick wählt den Berichtsmonat, keine Auswahl
      const hit = sv("rect", { x: slot * i, y: 0, width: slot, height: Hd, fill: "#FFFFFF", "fill-opacity": 0 }, g);
      hit.addEventListener("click", () => { S.m = s.m; zeichnen(); });
      tooltip(hit, () => [`${kurz}, ${mLang(s.m)} 2027`, s.ist !== null ? `Ist ${tsd(s.ist)} Tsd. € · Plan ${tsd(s.plan)} Tsd. €` : `Plan ${tsd(s.plan)} Tsd. € (noch kein Ist)`,
        s.ist !== null ? `ΔPL ${delta(Math.round(s.ist / 1e5) - Math.round(s.plan / 1e5), 0, NBSP + "Tsd. €")} (${pd(s.ist, s.plan)})` : null,
        akt ? "Gewählter Berichtsmonat" : "Klick wählt diesen Berichtsmonat"]);
    });
    sv("line", { x1: 0, x2: Wd, y1: basis + 0.5, y2: basis + 0.5, stroke: "#8C8C8C", "stroke-width": 1 }, svg);
  }

  /* ---------- Linien: Krankheits- und Überstundenquote, 12 Monate rollierend ---------- */
  function quotenLinien(f, d) {
    const Wd = f.breite, Hd = f.hoehe;
    const svg = sv("svg", { width: Wd, height: Hd, role: "img", "aria-label": "Krankheits- und Überstundenquote", id: "quoten-svg" }, f.flaeche);
    const rechts = 92, oben = 10, unten = 22, PW = Wd - rechts, PH = Hd - oben - unten, n = d.length;
    const ymax = Math.max(10, Math.ceil(Math.max(...d.map(x => x.kq)) + 1));
    const sx = j => 6 + j * (PW - 12) / (n - 1), sy = v => oben + PH - v / ymax * PH;
    sv("line", { x1: 0, x2: PW, y1: oben + PH + 0.5, y2: oben + PH + 0.5, stroke: "#8C8C8C", "stroke-width": 1 }, svg);
    const reihen = [{ f: "kq", name: "Krankheit", farbe: "#3A3F44" }, { f: "uq", name: "Überstunden", farbe: "#A9A9A9" }];
    reihen.forEach(r => {
      sv("polyline", { points: d.map((x, j) => `${sx(j).toFixed(1)},${sy(x[r.f]).toFixed(1)}`).join(" "), fill: "none", stroke: r.farbe, "stroke-width": 2,
                       "stroke-linejoin": "round", id: "linie-" + r.f }, svg);
      sv("circle", { cx: sx(n - 1), cy: sy(d[n - 1][r.f]), r: 3.5, fill: r.farbe }, svg);
    });
    // Beschriftung am Linienende, Abstand mindestens 17 px
    let y1 = sy(d[n - 1].kq), y2 = sy(d[n - 1].uq);
    if (y2 - y1 < 17) { const m = (y1 + y2) / 2; y1 = m - 8.5; y2 = m + 8.5; }
    sv("text", { x: PW + 6, y: y1, dy: "0.35em", style: "font-weight:bold", id: "quoten-kq" }, svg, `${zahl(d[n - 1].kq, 1)} Krankheit`);
    sv("text", { x: PW + 6, y: y2, dy: "0.35em" }, svg, `${zahl(d[n - 1].uq, 1)} Überstd.`);
    d.forEach((x, j) => {
      sv("text", { x: sx(j), y: Hd - 4, "text-anchor": "middle", class: "muted", style: j === n - 1 ? "font-weight:bold;fill:var(--text)" : "" }, svg, pmKurz(x.i)[0]);
      const hit = sv("rect", { x: sx(j) - (PW - 12) / (n - 1) / 2, y: 0, width: (PW - 12) / (n - 1), height: Hd, fill: "#FFFFFF", "fill-opacity": 0 }, svg);
      tooltip(hit, () => [pmLang(x.i), `Krankheitsquote ${zahl(x.kq, 1)} %`, `Überstundenquote ${zahl(x.uq, 1)} %`, `Sollstunden ${zahl(x.soll)}`]);
    });
  }

  /* ---------- Zeichnen ---------- */
  function zeichnen() {
    [...knopfMonat.querySelectorAll("button")].forEach((b, i) => b.setAttribute("aria-pressed", String(i === S.m)));
    [...knopfHaus.querySelectorAll("button")].forEach((b, i) => b.setAttribute("aria-pressed", String(i === 0 ? S.haus === null : S.haus === i - 1)));
    const hausText = S.haus === null ? "alle Häuser" : H[S.haus][1];
    DK.kopf(bKopf, { titel: "Management-Dashboard",
      untertitel: passt([`Stationäre Pflege · ${zeitraum()} · ${hausText} · Plan-Ist-Vergleich (ΔPL)`,
                         `Stationäre Pflege · ${zeitraum(true)} · ${hausText} · ΔPL`, `${zeitraum(true)} · ${hausText} · ΔPL`], 560),
      quelle: "Quelle: Rechnungswesen, Personalwirtschaft",
      legende: [[FARBE.ist, "Ist"], ["#FFFFFF", "Plan", "#3A3F44"], [FARBE.gut, "günstig"], [FARBE.schlecht, "ungünstig"]] });

    // KPI-Leiste
    const k = kennzahlen();
    const kl = (a, b, r) => wirkung((a / b - 1) * 100, r, 1);
    DK.kpis(bKpi, [
      { label: "Erlöse, Tsd. €", wert: tsd(k.erl.ist), bezug: "ΔPL", delta: pd(k.erl.ist, k.erl.plan), klasse: kl(k.erl.ist, k.erl.plan, 1) },
      { label: "Personalkosten, Tsd. €", wert: tsd(k.pers.ist), bezug: "ΔPL", delta: pd(k.pers.ist, k.pers.plan), klasse: kl(k.pers.ist, k.pers.plan, -1) },
      { label: "Betriebsergebnis, Tsd. €", wert: tsd(k.be.ist), bezug: "ΔPL", delta: pd(k.be.ist, k.be.plan),
        klasse: wirkung(k.be.ist - k.be.plan, 1, 0) },
      { label: "Ergebnis je Belegungstag, €", wert: zahl(k.ebt.ist, 2), bezug: "ΔPL", delta: delta(k.ebt.ist - k.ebt.plan, 2, NBSP + "€"),
        klasse: wirkung(k.ebt.ist - k.ebt.plan, 1, 2) },
      { label: "Fachkraftquote Pflege", wert: zahl(k.fq.ist * 100, 1), einheit: "%", bezug: "ΔPL",
        delta: delta((k.fq.ist - k.fq.plan) * 100, 1, NBSP + "%-Pkt."), klasse: wirkung((k.fq.ist - k.fq.plan) * 100, 1, 1) },
      { label: "Teilzeitquote", wert: zahl(k.tz.ist * 100, 1), einheit: "%", bezug: "ΔVJ", delta: delta((k.tz.ist - k.tz.vj) * 100, 1, NBSP + "%-Pkt."), klasse: "neutral" },
    ]);
    [...bKpi.querySelectorAll(".dk-kpi")].forEach((c, i) => { c.id = "kpi-" + i; c.style.flex = "1 1 auto"; });

    // BWA
    const b = datenBwa(), be = b.find(x => x.z.key === "be"), erl = b.find(x => x.z.key === "erl");
    const tr = b.filter(x => ZI[x.z.key].stufe !== "ergebnis" && !ZI[x.z.key].teile)
      .map(x => ({ x, w: x.d * x.z.r })).sort((p, q) => p.w - q.w);
    const sel = S.pos ? b.find(x => x.z.key === S.pos) : null;
    const bBwa_ = sel ? passt([`${sel.z.label}: ${tsd(sel.ist)} Tsd. €, ΔPL ${delta(sel.d, 0)} Tsd. € (${pd(sel.ist, sel.plan)})`,
                               `${sel.z.kurz}: ΔPL ${delta(sel.d, 0)} Tsd. € (${pd(sel.ist, sel.plan)})`], 450)
      : passt([`Betriebsergebnis ${zahl(Math.abs(be.d))} Tsd. € ${be.d < 0 ? "unter" : "über"} Plan, v. a. durch ${tr[0].x.z.kurz} und ${tr[1].x.z.kurz}`,
                `Betriebsergebnis ${zahl(Math.abs(be.d))} Tsd. € ${be.d < 0 ? "unter" : "über"} Plan, v. a. ${tr[0].x.z.kurz} und ${tr[1].x.z.kurz}`,
                `Ergebnis ${zahl(Math.abs(be.d))} Tsd. € ${be.d < 0 ? "unter" : "über"} Plan, v. a. ${tr[0].x.z.kurz} und ${tr[1].x.z.kurz}`,
                `Betriebsergebnis ${pd(be.ist, be.plan)}, v. a. ${tr[0].x.z.kurz} und ${tr[1].x.z.kurz}`,
                `Betriebsergebnis ${zahl(Math.abs(be.d))} Tsd. € ${be.d < 0 ? "unter" : "über"} Plan (${pd(be.ist, be.plan)})`], 450);
    let f = DK.visual(bBwa, { titel: "BWA: Plan-Ist-Vergleich", einheit: `Tsd. €, ${zeitraum(true)}`, botschaft: bBwa_ });
    bwaTabelle(f, b);

    // Monatsverlauf (Erlöse oder gewählte Position)
    const mz = datenMonat(), kurz = S.pos ? ZI[S.pos].kurz : "Erlöse", akt = mz[S.m];
    const r = S.pos ? ZI[S.pos].r : 1, dm = akt.ist / akt.plan - 1;
    const besser = dm * r > 0 ? (r > 0 ? "über" : "über") : "unter";
    f = DK.visual(bMon, { titel: passt([`${kurz} je Monat`, kurz], 241 - tw(", Tsd. €", 16, true), 16, true), einheit: "Tsd. €",
      botschaft: passt([`${mLang(S.m)}: ${zahl(Math.abs(dm) * 100, 1)} % ${Math.abs(dm) < 0.0005 ? "wie" : dm > 0 ? "über" : "unter"} Plan`,
                        `${mKurz(S.m)}: ΔPL ${pd(akt.ist, akt.plan)}`], 241) });
    void besser;
    monatsSaeulen(f, mz, kurz);

    // Auslastung
    const a = datenAuslastung(), aGes = a.zeilen[3];
    const schw = a.zeilen.slice(0, 3).sort((p, q) => p.werte.dpl - q.werte.dpl)[0];
    const aSel = S.haus !== null ? a.zeilen[S.haus] : null;
    f = DK.visual(bAus, { titel: "Auslastungsgrad je Haus", einheit: "%",
      botschaft: aSel ? passt([`${aSel.label}: ${zahl(aSel.ist, 1)} %, ΔPL ${delta(aSel.werte.dpl, 1)} %-Pkt.`, `${aSel.label}: ${zahl(aSel.ist, 1)} %`], 241)
        : passt([`${schw.label} ${zahl(Math.abs(schw.werte.dpl), 1)} %-Pkt. ${schw.werte.dpl < 0 ? "unter" : "über"} Plan`, `Gesamt ${zahl(aGes.ist, 1)} %`], 241) });
    const tabA = el("div", { id: "auslastung-tabelle" }, f.flaeche);
    DK.matrix(tabA, {
      spalten: [{ key: "label", titel: "Haus", breite: 80 }, { key: "ist", titel: "Ist", breite: 44, fmt: v => zahl(v, 1) },
                { key: "dpl", titel: "ΔPL", typ: "delta", breite: 68, richtung: 1, nk: 1, textBreite: 32, id: "aus-dpl" },
                { key: "dvg", titel: "ΔBM", typ: "delta", breite: 68, richtung: 1, nk: 1, textBreite: 32, id: "aus-dvg" }],
      zeilen: a.zeilen, zeilenhoehe: 26, auswahl: S.haus, onClick: key => hausSetzen(key),
      tooltip: z => [H[z.key][1], `${zahl(z.pl)} Plätze · ${zahl(z.bi)} Belegungstage`, `Auslastungsgrad ${zahl(z.ist, 1)} % · Plan ${zahl(z.plan, 1)} %`,
                     `ΔPL ${delta(z.werte.dpl, 1)} %-Pkt. · Benchmark (Vergleichsgruppe) ${zahl(z.vg, 1)} %`, "Klick filtert das Dashboard"] });
    el("div", { style: "margin-top:6px;color:var(--muted);white-space:nowrap", id: "auslastung-bm" }, f.flaeche,
      passt([`Δ in %-Pkt.; Benchmark (Vergleichsgruppe) ${zahl(a.vg, 1)} %`, `Δ in %-Pkt.; Benchmark ${zahl(a.vg, 1)} %`], 261));

    // Quoten
    const q = datenQuoten(), q1 = q[q.length - 1], hlq = hs(), ivj = q1.i - 12;
    const kqVj = pers("krank", ivj, hlq) / pers("soll", ivj, hlq) * 100, dkq = Number(q1.kq.toFixed(1)) - Number(kqVj.toFixed(1));
    f = DK.visual(bQuo, { titel: "Krankheit, Überstunden", einheit: "%",
      botschaft: passt([`Krankheitsquote ${delta(dkq, 1)} %-Pkt. zum Vorjahr`, `Krankheit ${delta(dkq, 1)} %-Pkt. zum Vorjahr`, `Krankheit ΔVJ ${delta(dkq, 1)} %-Pkt.`], 241) });
    quotenLinien(f, q);

    // Kosten je Berechnungstag
    const kd = datenKosten(), kp = kd.zeilen.find(x => x.key === "pers");
    const sach = kd.zeilen.filter(x => x.key !== "pers").reduce((s, x) => s + x.wert, 0);
    const kSel = S.pos ? kd.zeilen.find(x => x.key === S.pos) : null;
    f = DK.visual(bKos, { titel: "Kosten je Berechnungstag", einheit: "€",
      botschaft: kSel ? passt([`${kSel.label}: ΔPL ${delta(kSel.wert - kSel.wPlan, 2, NBSP + "€")}`, `${kSel.label}: ${zahl(kSel.wert, 2)} €`], 241)
        : passt([`Personal ${pz(kp.anteil, 1, 0)}, Sachkosten ${zahl(sach, 2)} €`, `Personal ${pz(kp.anteil, 1, 0)} der Kosten`], 241) });
    DK.balken(f.flaeche, { breite: f.breite, hoehe: f.hoehe, zeilenhoehe: 22, aria: "Kosten je Berechnungstag nach Kostenart",
      zeilen: kd.zeilen, fmt: v => zahl(v, 2), auswahl: S.pos && KOSTEN.includes(S.pos) ? S.pos : null, onClick: key => waehlen(key),
      tooltip: z => [z.name, `${zahl(z.wert, 2)} € je Berechnungstag · Plan ${zahl(z.wPlan, 2)} €`,
                     `ΔPL ${delta(z.wert - z.wPlan, 2, NBSP + "€")} (${pd(z.wert, z.wPlan)})`, `Anteil an den Kosten ${pz(z.anteil, 1)} · ${tsd(z.ist)} Tsd. €`,
                     "Klick zeigt Zeile und Monatsverlauf"] });
    bKos.querySelector("svg").id = "kosten-svg";

    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  /* ---------- Lernplattform: Designregeln, Nachbau, Tabellen, CSV ---------- */
  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "v-bwa", anker: "links", versatz: [440, 2], regel: "SAY – Botschaft vermitteln", titel: "Eine Aussage je Visual",
        text: "Unter jedem Titel steht ein aus den Daten berechneter Satz, der sich mit Berichtsmonat, Haus und Auswahl ändert – etwa wie weit das Betriebsergebnis unter Plan liegt und welche Positionen das verursachen. Das Original hatte nur Überschriften („BWA“, „Meine Kennzahlen“, „Auslastung“)." },
      { nr: 2, ziel: "kopf-legende", anker: "links", versatz: [-6, -2], regel: "UNIFY – Semantische Notation", titel: "Ist, Plan und Wirkung einheitlich",
        text: "Ist ist anthrazit gefüllt, Plan weiß mit Kontur; Abweichungen sind blaugrün (günstig) oder rot (ungünstig) nach ihrer Wirkung – Kosten über Plan sind rot, Erlöse über Plan blaugrün. Das Original nutzte Orange ohne feste Bedeutung (Kennzahlen, ein hervorgehobener Monat) und graue Säulen ohne Szenario." },
      { nr: 3, ziel: "bwa-delta-kopf", versatz: [0, 0], regel: "EXPRESS – Abweichung zeigen", titel: "ΔPL als Balken nach Wirkung",
        text: "Die Abweichung zum Plan steht als Zahl mit echtem Vorzeichen und als Balken an einer Nulllinie, ein Maßstab für alle Zeilen. Das Original zeigte Beträge mit nachgestelltem Minus („13.063.338,84−“) und ohne Farbe, ob die Abweichung gut oder schlecht ist." },
      { nr: 4, ziel: "kpi-3", anker: "links", versatz: [190, 22], regel: "CHECK – Stimmige Zahlen", titel: "Eine Datenbasis für alle Werte",
        text: "Kennzahlen, BWA und Visuals rechnen aus denselben Monatswerten: Erlöse und Betriebsergebnis der Kacheln sind die Zeilen der BWA, das Ergebnis je Belegungstag ist Betriebsergebnis durch Belegungstage. Im Original passte das Ergebnis je Belegungstag (−39) nicht zum positiven Betriebsergebnis, der Plan für März kumuliert (28,1 Mio. € Erlöse) nicht zum Ist (15,0 Mio. €), und die Erlössäule „Ist-Daten 15.007.921 EUR“ stand beim Mai." },
      { nr: 5, ziel: "v-kosten", anker: "links", versatz: [254, 2], regel: "CONDENSE – Verdichten", titel: "Ein Visual statt zwei",
        text: "Kostenstrukturanalyse und Sachkosten je Berechnungstag des Originals teilen dieselbe Bezugsgröße – die Balkenlängen wären gleich. Ein Visual zeigt jetzt die Kosten je Berechnungstag nach Kostenart, der Anteil an den Kosten steht im Tooltip. Ebenso gehen Auslastungsgrad und Benchmark in einer Tabelle mit ΔPL und ΔBM auf." },
      { nr: 6, ziel: "v-auslastung", anker: "links", versatz: [248, 2], regel: "SIMPLIFY – Klar beschriften", titel: "Namen statt Buchstaben",
        text: "Häuser, Kostenarten und Monate sind ausgeschrieben, Werte stehen direkt an Balken und Säulen. Im Original trugen die Säulen nur Kürzel (B, F, M; M, P, G, V, L; W, A, A, V, L) ohne Erläuterung und ohne Werte; auch die Einheit „€“ beim Ergebnis je Belegungstag fehlte." },
      { nr: 7, ziel: "v-quoten", anker: "links", versatz: [244, 2], regel: "EXPRESS – Passende Darstellung", titel: "Linien mit Beschriftung am Ende",
        text: "Krankheits- und Überstundenquote über zwölf Monate als Linien, Werte des Berichtsmonats direkt am Linienende, Monate chronologisch. Das Original zeigte eine blaue gestrichelte und eine orangefarbene Linie ohne Werte und ohne Achse, die Legende stand unter dem Diagramm." },
      { nr: 8, ziel: "filter", anker: "links", versatz: [700, -2], regel: "STRUCTURE – Gliederung", titel: "Ohne Programmrahmen, mit Datenschnitten",
        text: "Programmleiste, Navigationsspalte, Logo, Kachelrahmen, Bildlaufleiste und „Dashboard bearbeiten“ entfallen. Berichtsmonat und Haus filtern das Dashboard; ein Klick auf eine BWA-Zeile oder eine Kostenart zeigt deren Monatsverlauf, ein Klick auf ein Haus filtert, Esc hebt die Auswahl auf." },
    ],
    nachbauIntro: "Seitengröße benutzerdefiniert 1024 × 646 px. Schrift Arial: Beschriftungen 10,5 pt, Visualtitel 12 pt, KPI-Werte 19,5 pt. " +
      "Datenmodell: Faktentabelle BWA (Monat, Haus, Position, Ist, Plan), Tabelle Positionen (Gruppe, Sortierung, Richtung +1/−1), Belegung (Belegungs-, Abwesenheits-, Platztage), Personal (Stunden, Vollkräfte, Köpfe) und eine Datumstabelle. " +
      "Measures: Ist kum = CALCULATE(SUM(BWA[Ist]); DATESYTD(Datum[Datum])); Plan kum analog; ΔPL = [Ist kum] − [Plan kum]; Wirkung = [ΔPL] * SELECTEDVALUE(Positionen[Richtung]); Zwischen- und Betriebsergebnis als Measures über die Positionsgruppen (Vorzeichen über Richtung).",
    nachbau: [
      { id: "A", ziel: "kpi-5", versatz: [0, 0], titel: "Kennzahlen", visual: "Karte (neu) mit sechs Kennzahlen und Referenzbeschriftungen",
        felder: "Erlöse, Personalkosten, Betriebsergebnis (je Ist kum mit ΔPL %), Ergebnis je Belegungstag = DIVIDE([Betriebsergebnis]; [Belegungstage]), Fachkraftquote = DIVIDE([VK Fach]; [VK Fach] + [VK Assistenz]) gegen 50 %, Teilzeitquote mit ΔVJ über SAMEPERIODLASTYEAR",
        format: "Wert 19,5 pt fett; Referenzbeschriftung 10,5 pt; Farbe über bedingte Formatierung (#00806B günstig, #C62828 ungünstig), Teilzeitquote neutral" },
      { id: "B", ziel: "v-bwa", versatz: [0, 0], titel: "BWA: Plan-Ist-Vergleich", visual: "Matrix",
        felder: "Zeilen: Positionsgruppe › Position (Ergebniszeilen als eigene Positionen mit Measure); Werte: Ist kum, Plan kum, ΔPL",
        format: "Gruppen und Ergebnisse fett (Format › Zeilenüberschriften › Stufen), Einzug der Positionen; ΔPL: bedingte Formatierung › Datenbalken (Achse Mitte) und Schriftfarbe nach Regel auf [Wirkung]: > 0 #00806B, < 0 #C62828",
        hinweis: "Datenbalken lassen sich nur nach dem Wert selbst färben; für die Wirkung je Zeile eine zweite Spalte mit [Wirkung] als Datenbalken verwenden und die Zahl über [ΔPL] beschriften." },
      { id: "C", ziel: "v-monat", versatz: [0, 0], titel: "Erlöse je Monat", visual: "Gruppiertes Säulendiagramm",
        felder: "X-Achse: Monat; Y-Achse: Ist (Monat), Plan (Monat); Feldparameter oder Interaktion mit der Matrix für die gewählte Position",
        format: "Ist #3A3F44, Plan Füllung #FFFFFF mit Rahmen #3A3F44; Datenbeschriftungen nur Ist; Y-Achse und Gitternetz aus; Interaktion „Filtern“ von der Matrix" },
      { id: "D", ziel: "v-auslastung", versatz: [0, 0], titel: "Auslastungsgrad je Haus", visual: "Tabelle",
        felder: "Haus; Auslastungsgrad = DIVIDE([Belegungstage]; [Platztage]); ΔPL und ΔBM in %-Pkt. (Benchmark als Measure aus der Vergleichstabelle)",
        format: "ΔPL und ΔBM mit Datenbalken (Achse Mitte, positiv #00806B, negativ #C62828); Gesamtzeile fett" },
      { id: "E", ziel: "v-quoten", versatz: [0, 0], titel: "Krankheit, Überstunden", visual: "Liniendiagramm",
        felder: "X-Achse: Monat (Filter: letzte 12 Monate bis Berichtsmonat, DATESINPERIOD); Y-Achse: Krankheitsquote = DIVIDE([Krankheitsstunden]; [Sollstunden]), Überstundenquote analog",
        format: "Krankheit #3A3F44, Überstunden #A9A9A9, je 2 px; Reihenbeschriftung am Linienende; Markierung nur letzter Punkt; Legende und Gitternetz aus" },
      { id: "F", ziel: "v-kosten", versatz: [0, 0], titel: "Kosten je Berechnungstag", visual: "Gruppiertes Balkendiagramm",
        felder: "Y-Achse: Kostenart (Sortierspalte = BWA-Reihenfolge); X-Achse: DIVIDE([Ist kum]; [Belegungstage] + [Abwesenheitstage]); Tooltip: Plan je Tag, Anteil",
        format: "#3A3F44, Datenbeschriftungen ein (2 Nachkommastellen), X-Achse aus" },
      { id: "G", ziel: "filter", anker: "links", versatz: [700, -2], titel: "Datenschnitte", visual: "Datenschnitt (2×)",
        felder: "Berichtsmonat als Kacheln, Einzelauswahl (steuert DATESYTD); Haus als Kacheln", format: "Ausgewählt #3A3F44 mit weißer Schrift, sonst weiß mit Rahmen #9A9A9A" },
    ],
    theme: DK.thema(),
    csv: { name: "management_dashboard.csv", text: () => {
      const de = c => (c < 0 ? "-" : "") + `${Math.floor(Math.abs(c) / 100)},${String(Math.abs(c) % 100).padStart(2, "0")}`;
      const z = ["Bereich;Monat;Haus;Kennzahl;Ist;Plan"];
      DATA.bwa.forEach(([h, m, pi, ist, plan]) => z.push(["BWA (EUR)", MON[m], H[h][1], P[pi][1], de(ist), de(plan)].join(";")));
      DATA.belegung.forEach(([h, m, kap, bi, bp, ai, ap]) => {
        z.push(["Belegung (Tage)", MON[m], H[h][1], "Platztage", kap, kap].join(";"));
        z.push(["Belegung (Tage)", MON[m], H[h][1], "Belegungstage", bi, bp].join(";"));
        z.push(["Belegung (Tage)", MON[m], H[h][1], "Abwesenheitstage", ai, ap].join(";"));
      });
      DATA.vergleich.forEach((v, m) => z.push(["Belegung (%)", MON[m], "Vergleichsgruppe", "Auslastungsgrad", String(v).replace(".", ","), ""].join(";")));
      const namen = ["Vollkräfte Fachkräfte Pflege", "Vollkräfte Assistenzkräfte Pflege", "Vollkräfte gesamt", "Köpfe", "Köpfe Teilzeit", "Sollstunden", "Krankheitsstunden", "Überstunden"];
      DATA.personal.forEach(p => namen.forEach((n, k) => z.push(["Personal", PM[p[1]], H[p[0]][1], n, String(p[2 + k]).replace(".", ","), ""].join(";"))));
      return z.join("\r\n"); } },
    tabellen: () => {
      const k = kennzahlen(), zus = ` – ${zeitraum(true)}, ${S.haus === null ? "alle Häuser" : H[S.haus][1]}`;
      const a = datenAuslastung(), kd = datenKosten();
      return [
        { titel: "Kennzahlen" + zus, kopf: ["Kennzahl", "Ist", "Plan/VJ"], zeilen: [
          ["Erlöse, Tsd. €", tsd(k.erl.ist), tsd(k.erl.plan)], ["Personalkosten, Tsd. €", tsd(k.pers.ist), tsd(k.pers.plan)],
          ["Betriebsergebnis, Tsd. €", tsd(k.be.ist), tsd(k.be.plan)], ["Ergebnis je Belegungstag, €", zahl(k.ebt.ist, 2), zahl(k.ebt.plan, 2)],
          ["Fachkraftquote Pflege, %", zahl(k.fq.ist * 100, 1), zahl(k.fq.plan * 100, 1)], ["Teilzeitquote, % (VJ)", zahl(k.tz.ist * 100, 1), zahl(k.tz.vj * 100, 1)]] },
        { titel: "BWA: Plan-Ist-Vergleich, Tsd. €", kopf: ["Position", "Ist", "Plan", "ΔPL"], zeilen: datenBwa().map(x => [x.z.label, tsd(x.ist), tsd(x.plan), delta(x.d, 0)]) },
        { titel: `${S.pos ? ZI[S.pos].kurz : "Erlöse"} je Monat, Tsd. €`, kopf: ["Monat", "Ist", "Plan"], zeilen: datenMonat().map(x => [mLang(x.m), x.ist === null ? "–" : tsd(x.ist), tsd(x.plan)]) },
        { titel: "Auslastungsgrad je Haus, %", kopf: ["Haus", "Ist", "Plan", "Benchmark"], zeilen: a.zeilen.map(z => [z.label, zahl(z.ist, 1), zahl(z.plan, 1), zahl(z.vg, 1)]) },
        { titel: "Krankheits- und Überstundenquote, %", kopf: ["Monat", "Krankheit", "Überstunden"], zeilen: datenQuoten().map(x => [pmLang(x.i), zahl(x.kq, 1), zahl(x.uq, 1)]) },
        { titel: "Kosten je Berechnungstag, €", kopf: ["Kostenart", "Ist", "Plan", "Anteil"], zeilen: kd.zeilen.map(x => [x.name, zahl(x.wert, 2), zahl(x.wPlan, 2), pz(x.anteil, 1)]) },
      ];
    },
  });
  zeichnen();
})();
