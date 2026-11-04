/* Dashboard „Dynamische Vollkräfte-Statistik“ – Abb. 3.76 (vorher) und Abb. 3.77 (nachher).
   Seite 1024 x 646 px. Daten: vollkraefte.json (daten_vollkraefte.py) – je Monat (Januar 2017 bis Dezember 2029),
   Kostenstelle und Dienstart Köpfe in Voll- und Teilzeit und Vollkräfte (VK); Ist bis Juni 2027, danach Plan.
   Aufbau wie im Original (VK-Statistik eines Krankenhauses): Filterzeile, Kennzahlen des aktuellen Monats, VK je Monat,
   darunter die Tabelle je Planungseinheit (Schalter: Dienstart).
   Dynamik: Ziehen über die Säulen wählt einen Zeitraum, Klick auf eine Säule das ganze Jahr – die Tabelle zeigt dann
   Anfang, Ende und Veränderung im Zeitraum. Klick auf eine Tabellenzeile filtert Diagramm und Kennzahlen; Esc hebt auf.
   Abb. 3.76 und 3.77 verwenden diese Datei unverändert bis auf den Startzustand START. */
(() => {
  "use strict";
  const START = { standort: "alle", zeitraum: null };                       // Abb. 3.76: alle Standorte, ohne Zeitraum
  const { zahl, delta, NBSP, sv, el, tw, FARBE } = DK;
  const MON = DATA.monate, NM = MON.length, AKT = DATA.aktuell, ST = DATA.standorte, PE = DATA.planungseinheiten,
        KST = DATA.kostenstellen, DA = DATA.dienstarten;
  const MNAME = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
  const MKURZ = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
  const mLang = m => `${MNAME[m % 12]} ${2017 + Math.floor(m / 12)}`;
  const mKurz = m => `${MKURZ[m % 12]} ${2017 + Math.floor(m / 12)}`;
  const jahr = m => 2017 + Math.floor(m / 12);
  const K = DATA.kombis.map(([k, da, vz, tz, tv, pl]) => ({ k, da, pe: KST[k][1], st: KST[k][2], vz, tz, tv,
    vk: MON.map((_, m) => (m <= AKT ? vz[m] + tv[m] / 100 : pl[m - AKT - 1] / 100)) }));
  const pz = (a, nk = 1) => (a == null ? "–" : zahl(a * 100, nk) + NBSP + "%");
  const pp = d => (d == null ? "–" : delta(d * 100, 1, NBSP + "%-Pkt."));
  const pd = (a, b) => (b ? delta((a / b - 1) * 100, 1, NBSP + "%") : "–");
  const passt = (k, breite) => k.find(t => tw(t) <= breite) || k[k.length - 1];

  /* ---------- Zustand ---------- */
  const S = { st: START.standort, pe: "alle", kst: "alle", da: "alle", zeitraum: START.zeitraum, zeile: null, ansicht: "pe" };
  addEventListener("keydown", e => {
    if (e.key !== "Escape" || (S.zeitraum === null && S.zeile === null)) return;
    S.zeitraum = null; S.zeile = null;
    zeichnen();
  });
  const zr = () => S.zeitraum || [0, AKT];                                   // ohne Auswahl: alle Ist-Monate
  const zeilenKey = c => (S.ansicht === "pe" ? c.pe : c.da);
  const filt = (c, ohneZeile) => (S.st === "alle" || c.st === +S.st) && (S.pe === "alle" || c.pe === +S.pe) &&
    (S.kst === "alle" || c.k === +S.kst) && (S.da === "alle" || c.da === +S.da) &&
    (ohneZeile || S.zeile === null || zeilenKey(c) === S.zeile);

  /* ---------- Berechnungen ---------- */
  function reihe(cs) {
    const vk = new Array(NM).fill(0);
    cs.forEach(c => c.vk.forEach((v, m) => { vk[m] += v; }));
    return vk.map(v => Math.round(v * 100) / 100);
  }
  function kennz(cs, m) {
    if (m < 0 || m > AKT || !cs.length) return null;
    let vz = 0, tz = 0, tv = 0;
    cs.forEach(c => { vz += c.vz[m]; tz += c.tz[m]; tv += c.tv[m] / 100; });
    const kp = vz + tz, vk = vz + tv;
    return kp ? { vk, kp, qk: tz / kp, qv: tv / vk } : null;
  }
  const zeilenName = key => (S.ansicht === "pe" ? PE[key] : DA[key]);
  function tabelleDaten() {
    const [a, b] = zr(), basis = K.filter(c => filt(c, true));
    const zeile = (key, label, cs, summe) => {
      const vk = reihe(cs), k = kennz(cs, b);
      return { key, label, summe, vk, va: vk[a], vb: vk[b], d: vk[b] - vk[a], dp: vk[a] ? vk[b] / vk[a] - 1 : null,
               qk: k ? k.qk : null, kb: k, n: cs.length };
    };
    const keys = S.ansicht === "pe" ? PE.map((_, i) => i) : DA.map((_, i) => i);
    const zs = keys.map(key => zeile(key, zeilenName(key), basis.filter(c => zeilenKey(c) === key), false)).filter(z => z.n);
    return { zs, ges: zeile(null, "Gesamt", basis, true), a, b };
  }

  /* ---------- Layout (Seite 1024 x 646) ---------- */
  DK.init({ titel: "Vollkräftestatistik" });
  const bKopf = DK.box("kopf", 16, 10, 992, 46);
  DK.haarlinie(62);
  const bFilter = DK.box("filter", 16, 68, 992, 50, "dk-filter");
  const bKpi = DK.box("kpis", 16, 128, 992, 68);
  DK.haarlinie(206);
  const bVerlauf = DK.box("v-verlauf", 16, 216, 992, 188);
  DK.haarlinie(413);
  const bTab = DK.box("v-tabelle", 16, 422, 992, 220);

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

  /* ---------- Säulendiagramm VK je Monat mit Zeitraumauswahl ---------- */
  let gezogen = 0;                                                         // Zeitpunkt der letzten Zieh-Auswahl
  function saeulen(f, vk, cs) {
    const W = f.breite, H = f.hoehe, [a, b] = zr();
    const svg = sv("svg", { width: W, height: H, role: "img", "aria-label": "Vollkräfte je Monat, Ist und Plan" }, f.flaeche);
    const x0 = 20, x1 = W - 20, slot = (x1 - x0) / NM, bw = slot * 0.72, basis = H - 24, oben = 40;
    const max = Math.max(...vk, 1e-9), sy = v => basis - v / max * (basis - oben);
    const xm = m => x0 + slot * (m + 0.5);
    const gs = sv("g", { id: "vk-saeulen" }, svg);
    for (let m = 0; m < NM; m++) {
      const aus = S.zeitraum !== null && (m < a || m > b);
      const g = sv("g", { class: "dk-klick" + (aus ? " dk-blass" : "") }, gs);
      const h = basis - sy(vk[m]);
      if (m <= AKT) sv("rect", { x: xm(m) - bw / 2, y: sy(vk[m]), width: bw, height: Math.max(0, h), fill: FARBE.ist }, g);
      else sv("rect", { x: xm(m) - bw / 2 + 0.5, y: sy(vk[m]) + 0.5, width: bw - 1, height: Math.max(0, h - 1), fill: "#FFFFFF",
                        stroke: "#3A3F44", "stroke-width": 1 }, g);
      const hit = sv("rect", { x: x0 + slot * m, y: 0, width: slot, height: H, fill: "transparent" }, g);
      hit.addEventListener("click", () => {
        if (Date.now() - gezogen < 400) return;
        const j0 = m - (m % 12), j1 = j0 + 11;
        S.zeitraum = S.zeitraum && S.zeitraum[0] === j0 && S.zeitraum[1] === j1 ? null : [j0, j1];
        zeichnen();
      });
      tooltip(hit, () => {
        const k = kennz(cs, m), kv = kennz(cs, m - 12);
        return [`${mLang(m)} · ${m <= AKT ? "Ist" : "Plan"}`, `Vollkräfte ${zahl(vk[m], 1)} VK` + (m >= 12 ? ` · ΔVJ ${delta(vk[m] - vk[m - 12], 1)}` : ""),
          k && `Köpfe ${zahl(k.kp)} · Teilzeitquote ${pz(k.qk)} nach Köpfen, ${pz(k.qv)} nach VK`,
          k && kv && `Teilzeitquote ΔVJ ${pp(k.qk - kv.qk)} nach Köpfen`,
          "Klick wählt das Jahr, Ziehen einen Zeitraum"];
      });
    }
    // Planbereich (für die Marke der Designregeln), Grundlinie, Jahre
    const gp = sv("g", { id: "vk-plan", style: "pointer-events:none" }, svg);
    sv("rect", { x: xm(AKT + 1) - bw / 2, y: oben, width: xm(NM - 1) - xm(AKT + 1) + bw, height: basis - oben, fill: "transparent" }, gp);
    sv("line", { x1: x0 - 4, x2: x1 + 4, y1: basis + 0.5, y2: basis + 0.5, stroke: "#8C8C8C", "stroke-width": 1 }, svg);
    const ga = sv("g", { id: "vk-achse", style: "pointer-events:none" }, svg);
    for (let j = 0; j < NM / 12; j++) {
      sv("line", { x1: x0 + slot * 12 * j, x2: x0 + slot * 12 * j, y1: basis, y2: basis + 6, stroke: "#8C8C8C", "stroke-width": 1 }, ga);
      sv("text", { x: x0 + slot * (12 * j + 6), y: H - 5, "text-anchor": "middle", class: "muted" }, ga, String(2017 + j));
    }
    // Werte: aktueller Monat, Anfang und Ende des Zeitraums, Dezemberwerte (ohne Überlappung)
    const kand = [{ m: AKT, fett: true }];
    if (S.zeitraum) kand.push({ m: a, fett: true }, { m: b, fett: true });
    for (let m = 11; m < NM; m += 12) kand.push({ m, fett: false });
    const belegt = [], gw = sv("g", { id: "vk-werte", style: "pointer-events:none" }, svg);
    kand.forEach(({ m, fett }) => {
      const t = zahl(vk[m]), w = tw(t, 14, fett) + 4, x = Math.min(Math.max(xm(m), w / 2), W - w / 2), y = sy(vk[m]) - 5;
      const box = { x0: x - w / 2, x1: x + w / 2, y0: y - 13, y1: y + 2 };
      if (belegt.some(q => box.x0 < q.x1 && q.x0 < box.x1 && box.y0 < q.y1 && q.y0 < box.y1)) return;
      belegt.push(box);
      sv("text", { x, y, "text-anchor": "middle", class: m > AKT && !fett ? "muted" : "",
                   style: `font-weight:${fett ? "bold" : "normal"};paint-order:stroke;stroke:#FFFFFF;stroke-width:3px` }, gw, t);
    });
    // Zeitraum: Klammer über den Säulen
    if (S.zeitraum) {
      const gz = sv("g", { id: "vk-zeitraum", style: "pointer-events:none" }, svg), xa = xm(a) - slot / 2, xb = xm(b) + slot / 2;
      sv("path", { d: `M${xa},21V16H${xb}V21`, fill: "none", stroke: "#3A3F44", "stroke-width": 1 }, gz);
      const t = `${mKurz(a)} – ${mKurz(b)}`, w = tw(t) + 12, xc = Math.min(Math.max((xa + xb) / 2, w / 2), W - w / 2);
      sv("rect", { x: xc - w / 2, y: 6, width: w, height: 16, fill: "#FFFFFF" }, gz);
      sv("text", { x: xc, y: 15, dy: "0.35em", "text-anchor": "middle" }, gz, t);
    }
    // Ziehen wählt einen Zeitraum
    const monatBei = ev => { const r = svg.getBoundingClientRect(); return Math.max(0, Math.min(NM - 1, Math.floor(((ev.clientX - r.left) / r.width * W - x0) / slot))); };
    let zug = null, overlay = null;
    svg.addEventListener("pointerdown", ev => {
      if (ev.button !== 0) return;
      zug = { m0: monatBei(ev), m1: monatBei(ev) };
      svg.setPointerCapture(ev.pointerId);
    });
    svg.addEventListener("pointermove", ev => {
      if (!zug) return;
      zug.m1 = monatBei(ev);
      if (zug.m1 === zug.m0) return;
      const lo = Math.min(zug.m0, zug.m1), hi = Math.max(zug.m0, zug.m1);
      if (!overlay) overlay = sv("rect", { y: oben - 8, height: basis - oben + 8, fill: "#3A3F44", "fill-opacity": 0.12, style: "pointer-events:none" }, svg);
      overlay.setAttribute("x", x0 + slot * lo);
      overlay.setAttribute("width", slot * (hi - lo + 1));
    });
    svg.addEventListener("pointerup", ev => {
      if (!zug) return;
      const { m0, m1 } = zug;
      zug = null;
      svg.releasePointerCapture(ev.pointerId);
      if (m0 === m1) return;
      gezogen = Date.now();
      S.zeitraum = [Math.min(m0, m1), Math.max(m0, m1)];
      zeichnen();
    });
  }

  /* ---------- Tabelle je Planungseinheit bzw. Dienstart ---------- */
  const T = { spark0: 250, spark1: 460, va: 548, vb: 630, dEnde: 696, d0: 702, d1: 822, dp: 880, q: 992 };
  const ZH = 17, KOPF_H = 20;
  function tabelle(f, td) {
    const W = f.breite, zeilen = [...td.zs, td.ges], H = KOPF_H + zeilen.length * ZH;
    const svg = sv("svg", { width: W, height: H, role: "img", "aria-label": "Vollkräfte je Zeile im Zeitraum" }, f.flaeche);
    const kopf = (x, t, anker, id) => sv("text", { x, y: 14, "text-anchor": anker, class: "muted", ...(id ? { id } : {}) }, svg, t);
    kopf((T.spark0 + T.spark1) / 2, "Verlauf", "middle", "tab-verlauf");
    kopf(T.va, mKurz(td.a), "end");
    kopf(T.vb, mKurz(td.b) + (td.b > AKT ? " (Plan)" : ""), "end");
    kopf((T.dEnde - 40 + T.d1) / 2, "Δ VK", "middle", "tab-delta");
    kopf(T.dp, "Δ %", "end");
    kopf(T.q, "Teilzeitquote", "end", "tab-quote");
    sv("line", { x1: 0, x2: W, y1: KOPF_H - 2.5, y2: KOPF_H - 2.5, stroke: "#3A3F44", "stroke-width": 1 }, svg);
    const ds = td.zs.map(z => z.d);
    const neg = Math.max(0, ...ds.map(d => -d)), pos = Math.max(0, ...ds), k = (T.d1 - T.d0) / Math.max(neg + pos, 1e-9), mitte = T.d0 + neg * k;
    zeilen.forEach((z, i) => {
      const y = KOPF_H + i * ZH, ym = y + ZH / 2, blass = !z.summe && S.zeile !== null && S.zeile !== z.key;
      const g = sv("g", { class: (z.summe ? "" : "dk-klick") + (blass ? " dk-blass" : "") }, svg);
      if (z.summe) sv("line", { x1: 0, x2: W, y1: y + 0.5, y2: y + 0.5, stroke: "#3A3F44", "stroke-width": 1 }, g);
      else if (i < td.zs.length - 1) sv("line", { x1: 0, x2: W, y1: y + ZH - 0.5, y2: y + ZH - 0.5, stroke: "#EFEFEF", "stroke-width": 1 }, g);
      const fw = z.summe ? "bold" : "normal", txt = (x, t, anker = "end", stil = "") =>
        sv("text", { x, y: ym, dy: "0.35em", "text-anchor": anker, style: `pointer-events:none;font-weight:${fw};${stil}` }, g, t);
      txt(0, z.label, "start");
      if (tw(z.label) > T.spark0 - 12) console.error("Beschriftung zu lang: " + z.label);
      // Sparkline: Ist anthrazit, Plan grau; eigener Maßstab je Zeile
      const w = z.vk.slice(td.a, td.b + 1), lo = Math.min(...w), hi = Math.max(...w), sx = j => T.spark0 + (w.length > 1 ? j / (w.length - 1) : 0.5) * (T.spark1 - T.spark0);
      const syy = v => (hi > lo ? ym + 6 - (v - lo) / (hi - lo) * 12 : ym);
      const pfad = (j0, j1) => w.slice(j0, j1 + 1).map((v, j) => `${j ? "L" : "M"}${sx(j0 + j).toFixed(1)},${syy(v).toFixed(1)}`).join("");
      const jAkt = AKT - td.a;
      if (jAkt >= 0) sv("path", { d: pfad(0, Math.min(jAkt, w.length - 1)), fill: "none", stroke: "#3A3F44", "stroke-width": 1.5, style: "pointer-events:none" }, g);
      if (jAkt < w.length - 1) sv("path", { d: pfad(Math.max(0, jAkt), w.length - 1), fill: "none", stroke: "#8F8F8F", "stroke-width": 1.5, style: "pointer-events:none" }, g);
      sv("circle", { cx: sx(w.length - 1), cy: syy(w[w.length - 1]), r: 2.5, fill: td.b > AKT ? "#8F8F8F" : "#3A3F44", style: "pointer-events:none" }, g);
      txt(T.va, z.va ? zahl(z.va, 1) : "–");
      txt(T.vb, z.vb ? zahl(z.vb, 1) : "–");
      txt(T.dEnde, z.va || z.vb ? delta(z.d, 1) : "–");
      if (!z.summe && (z.va || z.vb)) {
        const bwid = Math.abs(z.d) * k;
        sv("rect", { x: z.d >= 0 ? mitte : mitte - bwid, y: ym - 5, width: bwid, height: 10, fill: FARBE.ist, style: "pointer-events:none" }, g);
      }
      if (!z.summe) sv("line", { x1: mitte, x2: mitte, y1: ym - 7, y2: ym + 7, stroke: "#8C8C8C", "stroke-width": 1 }, g);
      txt(T.dp, z.dp == null ? "–" : delta(z.dp * 100, 1));
      txt(T.q, z.qk == null ? "–" : zahl(z.qk * 100, 1));
      if (!z.summe) {
        const hit = sv("rect", { x: 0, y, width: W, height: ZH, fill: "transparent" }, g);
        g.insertBefore(hit, g.firstChild);
        hit.addEventListener("click", () => { S.zeile = S.zeile === z.key ? null : z.key; zeichnen(); });
        tooltip(hit, () => [z.label + (S.st === "alle" ? "" : " · Standort " + ST[+S.st]),
          `${mLang(td.a)}: ${zahl(z.va, 1)} VK · ${mLang(td.b)}: ${zahl(z.vb, 1)} VK`,
          `Veränderung ${delta(z.d, 1)} VK (${z.dp == null ? "–" : delta(z.dp * 100, 1, NBSP + "%")})`,
          z.kb && `Köpfe ${zahl(z.kb.kp)} · Teilzeitquote ${pz(z.kb.qk)} nach Köpfen, ${pz(z.kb.qv)} nach VK (${mKurz(td.b)})`,
          "Klick filtert Diagramm und Kennzahlen"]);
      }
    });
  }

  /* ---------- Datenschnitte (Kostenstellen und Planungseinheiten passend zum Standort) ---------- */
  const selSt = DK.schnitt(bFilter, "Standort", "dropdown", { optionen: [["alle", "Alle"], ...ST.map((n, i) => [String(i), n])],
    wert: S.st, breite: 130, onChange: v => { S.st = v; zeichnen(); } });
  const selPe = DK.schnitt(bFilter, "Planungseinheit", "dropdown", { optionen: [["alle", "Alle"]], wert: "alle", breite: 245,
    onChange: v => { S.pe = v; zeichnen(); } });
  const selKst = DK.schnitt(bFilter, "Kostenstelle", "dropdown", { optionen: [["alle", "Alle"]], wert: "alle", breite: 230,
    onChange: v => { S.kst = v; zeichnen(); } });
  const selDa = DK.schnitt(bFilter, "Dienstart", "dropdown", { optionen: [["alle", "Alle"], ...DA.map((n, i) => [String(i), n])],
    wert: "alle", breite: 255, onChange: v => { S.da = v; zeichnen(); } });
  function optionen(sel, liste, feld) {
    const soll = [["alle", "Alle"], ...liste];
    if (!soll.some(([w]) => w === S[feld])) S[feld] = "alle";
    if (sel.options.length !== soll.length || soll.some(([w], i) => sel.options[i].value !== w)) {
      sel.textContent = "";
      soll.forEach(([w, t]) => el("option", { value: w }, sel, t));
    }
    sel.value = S[feld];
  }

  /* ---------- Zeichnen ---------- */
  function zeichnen() {
    const imSt = c => S.st === "alle" || c.st === +S.st;
    optionen(selPe, PE.map((n, i) => [String(i), n]).filter(([w]) => K.some(c => imSt(c) && c.pe === +w)), "pe");
    optionen(selKst, KST.map((x, i) => [String(i), x[0]]).filter(([w]) => K.some(c => imSt(c) && c.k === +w && (S.pe === "alle" || c.pe === +S.pe))), "kst");
    selSt.value = S.st;
    selDa.value = S.da;
    const cs = K.filter(c => filt(c, false)), vk = reihe(cs), td = tabelleDaten(), [a, b] = zr();

    const teile = [S.st === "alle" ? "alle Standorte" : "Standort " + ST[+S.st]];
    if (S.pe !== "alle") teile.push(PE[+S.pe]);
    if (S.kst !== "alle") teile.push(KST[+S.kst][0]);
    if (S.da !== "alle") teile.push(DA[+S.da]);
    if (S.zeile !== null) teile.push(zeilenName(S.zeile));
    const zeitText = S.zeitraum ? `Zeitraum ${mKurz(a)} bis ${mKurz(b)}` : "Ist bis Juni 2027, Plan bis Dezember 2029";
    DK.kopf(bKopf, { titel: "Vollkräftestatistik",
      untertitel: passt([`Vollkräfte (VK) und Köpfe · ${teile.join(", ")} · ${zeitText} · Vergleich zum Vorjahresmonat (ΔVJ)`,
        `VK und Köpfe · ${teile.join(", ")} · ${zeitText} · ΔVJ`, `${teile.join(", ")} · ${zeitText}`], 800),
      quelle: "", legende: [[FARBE.ist, "Ist"], ["#FFFFFF", "Plan", "#3A3F44"]] });

    // Kennzahlen des aktuellen Monats (unabhängig vom Zeitraum)
    const k = kennz(cs, AKT), kv = kennz(cs, AKT - 12), plan = vk[NM - 1];
    const neutral = (label, wert, einheit, d, bezug) => ({ label, wert, einheit, delta: d, klasse: "neutral", bezug });
    DK.kpis(bKpi, [
      neutral(`Vollkräfte Ist ${mLang(AKT)}`, k ? zahl(k.vk) : "–", "VK", k && kv ? delta(k.vk - kv.vk, 0) : "–"),
      neutral("Köpfe Ist", k ? zahl(k.kp) : "–", "", k && kv ? delta(k.kp - kv.kp, 0) : "–"),
      neutral("Teilzeitquote nach Köpfen", k ? zahl(k.qk * 100, 1) : "–", "%", k && kv ? pp(k.qk - kv.qk) : "–"),
      neutral("Teilzeitquote nach VK", k ? zahl(k.qv * 100, 1) : "–", "%", k && kv ? pp(k.qv - kv.qv) : "–"),
      neutral(`Plan ${mLang(NM - 1)}`, cs.length ? zahl(plan) : "–", "VK", k ? delta(plan - k.vk, 0) : "–", "zum Ist"),
    ]);

    // Verlauf
    const ist = vk.slice(0, AKT + 1), mx = ist.indexOf(Math.max(...ist));
    let bv;
    if (!cs.length) bv = "Keine Daten für diese Auswahl";
    else if (S.zeitraum) bv = passt([`${mLang(a)} bis ${mLang(b)}: ${delta(vk[b] - vk[a], 0)} VK (${pd(vk[b], vk[a])}), von ${zahl(vk[a])} auf ${zahl(vk[b])} VK`,
      `${mKurz(a)} bis ${mKurz(b)}: ${delta(vk[b] - vk[a], 0)} VK (${pd(vk[b], vk[a])})`], 992);
    else bv = passt([`Höchststand ${zahl(ist[mx])} VK im ${mLang(mx)}, bis ${mLang(AKT)} ${delta(ist[AKT] - ist[mx], 0)} VK; Plan ${mLang(NM - 1)}: ${zahl(plan)} VK (${pd(plan, ist[AKT])})`,
      `Höchststand ${zahl(ist[mx])} VK im ${mLang(mx)}; Plan ${mLang(NM - 1)}: ${zahl(plan)} VK`], 992);
    let f = DK.visual(bVerlauf, { titel: "Vollkräfte je Monat", einheit: "VK", botschaft: bv });
    saeulen(f, vk, cs);

    // Tabelle
    const groesste = td.zs.slice().sort((x, y) => Math.abs(y.d) - Math.abs(x.d))[0];
    const bt = !groesste ? "Keine Daten für diese Auswahl"
      : passt([`${mKurz(td.a)} bis ${mKurz(td.b)}: ${groesste.d >= 0 ? "größter Zuwachs" : "größter Rückgang"} ${groesste.label} ${delta(groesste.d, 0)} VK (${groesste.dp == null ? "neu" : delta(groesste.dp * 100, 1, NBSP + "%")}), gesamt ${delta(td.ges.d, 0)} VK`,
        `${groesste.d >= 0 ? "Größter Zuwachs" : "Größter Rückgang"}: ${groesste.label} ${delta(groesste.d, 0)} VK`], 760);
    f = DK.visual(bTab, { titel: S.ansicht === "pe" ? "Vollkräfte je Planungseinheit" : "Vollkräfte je Dienstart",
      einheit: "VK, Teilzeitquote nach Köpfen in %", botschaft: bt,
      schalter: { optionen: [["pe", "Planungseinheiten"], ["da", "Dienstarten"]], wert: S.ansicht,
                  onChange: v => { S.ansicht = v; S.zeile = null; zeichnen(); } } });
    tabelle(f, td);
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  /* ---------- Lernplattform: Designregeln, Nachbau, Tabellen, CSV ---------- */
  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "v-verlauf", anker: "links", versatz: [230, -2], regel: "SAY – Botschaft vermitteln", titel: "Aussage zum Verlauf",
        text: "Unter den Titeln steht, was die Zahlen zeigen: Höchststand und Plan, nach einer Zeitraumauswahl die Veränderung im Zeitraum und die Zeile mit dem größten Zuwachs. Das Original hatte nur die Überschrift „∑ Vollkräfte“." },
      { nr: 2, ziel: "vk-plan", anker: "links", versatz: [60, -30], regel: "UNIFY – Semantische Notation", titel: "Ist und Plan unterscheidbar",
        text: "Ist-Monate sind anthrazit gefüllt, Planmonate ab Juli 2027 weiß mit Kontur, die Legende steht einmal im Kopf. Im Original lagen Ist und künftige Monate in derselben blauen Fläche – nicht zu erkennen, ab wann Planwerte folgen." },
      { nr: 3, ziel: "v-verlauf", anker: "links", versatz: [732, 32], regel: "CONDENSE – Zeitraum wählen", titel: "Zeitraum direkt im Diagramm",
        text: "Ziehen über die Säulen markiert einen Zeitraum, ein Klick auf eine Säule das ganze Jahr; Monate außerhalb werden blass, die Tabelle zeigt Anfang, Ende und Veränderung im Zeitraum. Abb. 3.77 zeigt November 2021 bis August 2025 am Standort Ost. Die Kennzahlen oben gelten immer für den aktuellen Monat; Esc hebt die Auswahl auf. Im Original musste die Auswahl mit Haken bestätigt werden, dazu gab es einen Navigator unter dem Diagramm." },
      { nr: 4, ziel: "tab-verlauf", anker: "links", versatz: [0, -4], regel: "CONDENSE – Informationsdichte", titel: "Verlauf als Sparkline",
        text: "Statt 24 Monatsspalten mit waagerechtem Scrollen zeigt jede Zeile ihren Verlauf im Zeitraum als Linie (eigener Maßstab je Zeile), dazu Anfangs- und Endwert, Veränderung absolut als Balken und relativ." },
      { nr: 5, ziel: "vk-saeulen", anker: "links", versatz: [32, 12], regel: "EXPRESS – Passende Darstellung", titel: "Säulen ab null, wenige Werte",
        text: "Die Monatswerte stehen als Säulen auf einer Achse ab null. Beschriftet sind die Dezemberwerte, der aktuelle Monat sowie Anfang und Ende des Zeitraums – das Original beschriftete jeden zweiten Punkt der Fläche, die Zahlen überlagerten sich." },
      { nr: 6, ziel: "kpis", anker: "links", versatz: [300, 2], regel: "CHECK – Visuelle Integrität", titel: "Kennzahlen mit Einheit und Vergleich",
        text: "Jede Kennzahl hat Einheit und Vorjahresvergleich; die VK des aktuellen Monats entsprechen der Gesamtzeile der Tabelle, wenn der Zeitraum im aktuellen Monat endet. Keine Farbe, weil mehr Personal weder gut noch schlecht ist – das Original färbte die Teilzeitquoten ohne Bezug grün." },
      { nr: 7, ziel: "tab-quote", anker: "links", versatz: [0, -4], regel: "STRUCTURE – Inhalte ordnen", titel: "Natürliche Reihenfolge, Summe unten",
        text: "Planungseinheiten von den Fachabteilungen zu Funktions- und Verwaltungsbereichen, Dienstarten in der Reihenfolge der KHBV; der Schalter wechselt die Zeilen. Das Original listete Planungseinheiten alphabetisch, mit leeren Zeilen („-“, „Ambulanz Frauenklinik“ ohne Werte), die Gesamtzeile stand oben." },
      { nr: 8, ziel: "kopf-titel", anker: "links", versatz: [230, 0], regel: "SIMPLIFY – Überflüssiges weglassen", titel: "Ohne Programmrahmen",
        text: "Produktname und Logo, Navigationspfad, Benutzername, Lasso-, Verlaufs-, Zurück- und Vor-Schaltflächen entfallen. Der Filter „Mitarbeiter“ entfällt, weil ein Steuerungsbericht keine Personendaten zeigt; „Jahr“ ersetzt der Klick ins Diagramm, „Organisationsstruktur“ der Standort." },
    ],
    nachbauIntro: "Seitengröße benutzerdefiniert 1024 × 646 px. Schrift Arial: Beschriftungen 10,5 pt, Visualtitel 12 pt, KPI-Werte 19,5 pt. Datenmodell: Tabelle Personal wie in der CSV-Datei (Monat, Szenario Ist/Plan, Standort, Planungseinheit, Kostenstelle, Dienstart, Köpfe Vollzeit, Köpfe Teilzeit, VK Teilzeit, VK) mit Datumstabelle auf Monatsebene. Measures: VK = SUM(Personal[VK]); Köpfe = SUM(Personal[Koepfe_Vollzeit]) + SUM(Personal[Koepfe_Teilzeit]); Teilzeitquote Köpfe = DIVIDE(SUM(Personal[Koepfe_Teilzeit]); [Köpfe]); Teilzeitquote VK = DIVIDE(SUM(Personal[VK_Teilzeit]); [VK]).",
    nachbau: [
      { id: "A", ziel: "kpis", anker: "links", versatz: [300, 2], titel: "Kennzahlen des aktuellen Monats", visual: "Karte (neu) mit fünf Kennzahlen und Referenzbeschriftungen",
        felder: "Je Kennzahl ein Measure mit festem Monat, z. B. VK aktuell = CALCULATE([VK]; REMOVEFILTERS('Datum'); 'Datum'[Monat] = DATE(2027; 6; 1)); Referenz ΔVJ mit DATE(2026; 6; 1); Plan Dezember 2029 analog mit Szenario „Plan“",
        format: "Wert 19,5 pt fett, Referenzbeschriftung 10,5 pt ohne Farbregel",
        hinweis: "REMOVEFILTERS('Datum') sorgt dafür, dass die Zeitraumauswahl im Diagramm die Kennzahlen nicht verändert." },
      { id: "B", ziel: "v-verlauf", titel: "Vollkräfte je Monat", visual: "Gestapeltes Säulendiagramm",
        felder: "X-Achse: Monat (Typ kategorisch); Y-Achse: VK; Legende: Szenario",
        format: "Ist #3A3F44; Plan Füllung #FFFFFF mit Rahmen #3A3F44 (Spalten › Rahmen); Abstand zwischen Kategorien 30 %; Y-Achse aus, Start 0; Datenbeschriftungen über „Benutzerdefinierter Beschriftungswert“ mit einem Measure, das nur im Dezember und im aktuellen Monat einen Wert liefert",
        hinweis: "Zeitraum: Klick mit Strg auf mehrere Säulen oder ein Datenschnitt „Zwischen“ auf Monat; Ziehen über die Säulen ist im Standardvisual nicht vorgesehen. Die Interaktion zur Matrix auf „Filtern“ stellen." },
      { id: "C", ziel: "v-tabelle", anker: "links", versatz: [517, 2], titel: "Tabelle im Zeitraum", visual: "Matrix (Layout tabellarisch)",
        felder: "Zeilen: Feldparameter Planungseinheit/Dienstart; Werte: Sparkline „Verlauf“ (VK nach Monat), VK Anfang = CALCULATE([VK]; 'Datum'[Monat] = MIN('Datum'[Monat])), VK Ende mit MAX, Δ VK = [VK Ende] − [VK Anfang], Δ % = DIVIDE([Δ VK]; [VK Anfang]), Teilzeitquote am Ende",
        format: "Sparkline Linie #3A3F44, Endpunkt markiert; Δ VK als Datenbalken #3A3F44 mit Achse in der Mitte; Gesamtsumme unten fett" },
      { id: "D", ziel: "filter", anker: "links", versatz: [124, -2], titel: "Datenschnitte", visual: "Datenschnitt (4×, Dropdown, Einfachauswahl)",
        felder: "Standort, Planungseinheit, Kostenstelle, Dienstart; die Datenschnitte filtern sich gegenseitig (nur Werte mit Daten)",
        format: "Kopfzeile 10,5 pt #4D4D4D, Rahmen #9A9A9A" },
    ],
    theme: DK.thema(),
    csv: { name: "vollkraefte_daten.csv", text: () => {
      const d2 = c => `${Math.floor(c / 100)},${String(c % 100).padStart(2, "0")}`;
      const z = ["Monat;Szenario;Standort;Planungseinheit;Kostenstelle;Dienstart;Koepfe_Vollzeit;Koepfe_Teilzeit;VK_Teilzeit;VK"];
      DATA.kombis.forEach(([k, da, vz, tz, tv, pl]) => {
        const [name, pe, st] = KST[k], kopf = [ST[st], PE[pe], name, DA[da]].join(";");
        MON.forEach((mo, m) => {
          if (m <= AKT) { if (vz[m] + tz[m]) z.push(`${mo};Ist;${kopf};${vz[m]};${tz[m]};${d2(tv[m])};${d2(vz[m] * 100 + tv[m])}`); }
          else z.push(`${mo};Plan;${kopf};;;;${d2(pl[m - AKT - 1])}`);
        });
      });
      return z.join("\r\n"); } },
    tabellen: () => {
      const cs = K.filter(c => filt(c, false)), vk = reihe(cs), td = tabelleDaten(), k = kennz(cs, AKT), kv = kennz(cs, AKT - 12);
      const f1 = v => (v == null ? "–" : zahl(v, 1));
      return [
        { titel: `Kennzahlen ${mLang(AKT)}`, kopf: ["Kennzahl", mLang(AKT), mLang(AKT - 12), "ΔVJ"],
          zeilen: k && kv ? [["Vollkräfte (VK)", f1(k.vk), f1(kv.vk), delta(k.vk - kv.vk, 1)], ["Köpfe", zahl(k.kp), zahl(kv.kp), delta(k.kp - kv.kp, 0)],
            ["Teilzeitquote nach Köpfen", pz(k.qk), pz(kv.qk), pp(k.qk - kv.qk)], ["Teilzeitquote nach VK", pz(k.qv), pz(kv.qv), pp(k.qv - kv.qv)]] : [] },
        { titel: `${S.ansicht === "pe" ? "Planungseinheiten" : "Dienstarten"}, ${mKurz(td.a)} bis ${mKurz(td.b)}`,
          kopf: ["Zeile", `VK ${mKurz(td.a)}`, `VK ${mKurz(td.b)}`, "Δ VK", "Δ %", "Teilzeitquote Köpfe"],
          zeilen: [...td.zs, td.ges].map(z => [z.label, f1(z.va), f1(z.vb), delta(z.d, 1), z.dp == null ? "–" : delta(z.dp * 100, 1), z.qk == null ? "–" : pz(z.qk)]) },
        { titel: `Vollkräfte je Monat, ${mKurz(td.a)} bis ${mKurz(td.b)}`, kopf: ["Monat", "Szenario", "VK", "Köpfe", "Teilzeitquote Köpfe"],
          zeilen: vk.slice(td.a, td.b + 1).map((v, j) => { const m = td.a + j, kk = kennz(cs, m);
            return [mKurz(m), m <= AKT ? "Ist" : "Plan", f1(v), kk ? zahl(kk.kp) : "–", kk ? pz(kk.qk) : "–"]; }) },
      ];
    },
  });
  zeichnen();
})();
