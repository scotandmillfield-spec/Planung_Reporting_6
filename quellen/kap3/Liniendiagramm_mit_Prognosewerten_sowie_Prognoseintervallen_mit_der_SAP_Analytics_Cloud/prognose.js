/* Dashboard „Liniendiagramm mit Prognosewerten sowie Prognoseintervallen“ (Abb. 3.194): Absatzprognose je Produktgruppe
   bzw. Einzelprodukt mit Vergleich von vier statistischen Modellen (saisonale Regression, ARIMA, Holt-Winters,
   Prophet-Ansatz). Seite 1024 x 646 px. Daten: prognose.json (daten_prognose.py) – Ist erfunden (fester Seed),
   Modellwerte, Prognosen, Intervalle und Gütemaße tatsächlich berechnet.
   Datenschnitte: Produktgruppe/Produkt, Modell („Bestes Modell“ = kleinster MAPE im Testjahr), Intervall 80 %/95 %.
   Klick auf eine Tabellenzeile wählt das Modell, Klick auf einen Monat hebt ihn hervor, Esc hebt beides auf.
   Druckansicht: Produktgruppe Küchengeräte mit dem besten Modell. */
(() => {
  "use strict";
  const { zahl, delta, NBSP, sv, el, FARBE } = DK;
  const M = DATA.monate, N = M.length, NI = DATA.nIst, NT = DATA.nTest, MOD = DATA.modelle, RH = DATA.reihen;
  const LANG = { Jan: "Januar", Feb: "Februar", "Mär": "März", Apr: "April", Mai: "Mai", Jun: "Juni", Jul: "Juli",
                 Aug: "August", Sep: "September", Okt: "Oktober", Nov: "November", Dez: "Dezember" };
  const lang = i => { const [m, j] = M[i].split(" "); return `${LANG[m]} ${j}`; };
  const jahrVon = i => Number(M[i].split(" ")[1]);
  const JAHRE = [...new Set(M.map((_, i) => jahrVon(i)))];
  const PZ = NBSP + "%", T0 = NI - NT;                       // T0 = erster Testmonat
  const KURZ = ["Regression", "ARIMA", "Holt-Winters", "Prophet"];

  /* ---------- Zustand ---------- */
  const S = { reihe: RH.findIndex(r => r.name === "Küchengeräte"), modell: "best", niveau: 95, monat: null };
  const R = () => RH[S.reihe];
  const mi = () => (S.modell === "best" ? R().bestes : S.modell);
  const E = (k = mi()) => R().modelle[k];
  const grenzen = (k = mi()) => (S.niveau === 95 ? [E(k).u95, E(k).o95] : [E(k).u80, E(k).o80]);
  addEventListener("keydown", e => {
    if (e.key === "Escape" && (S.monat !== null || S.modell !== "best")) { S.monat = null; S.modell = "best"; zeichnen(); }
  });

  /* ---------- Layout ---------- */
  DK.init({ titel: "Liniendiagramm mit Prognosewerten sowie Prognoseintervallen" });
  const bKopf = DK.box("kopf", 16, 10, 992, 46);
  DK.haarlinie(62);
  const bFilter = DK.box("filter", 16, 68, 992, 50, "dk-filter");
  const bKpi = DK.box("kpis", 16, 128, 992, 68);
  DK.haarlinie(206);
  const bVis = DK.box("v-prognose", 16, 216, 992, 246);
  DK.haarlinie(470);
  const bTab = DK.box("v-modelle", 16, 478, 992, 164);
  const tip = document.querySelector(".dk-tooltip");
  function tooltip(ziel, zeilenFn) {
    ziel.addEventListener("pointermove", ev => {
      tip.textContent = "";
      zeilenFn().forEach((z, i) => el(i === 0 ? "b" : "div", {}, tip, z));
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
  const einr = r => (r.ebene === "produkt" ? NBSP.repeat(4) : r.ebene === "gruppe" ? NBSP.repeat(2) : "") + r.name;
  DK.schnitt(bFilter, "Produktgruppe / Produkt", "dropdown", { breite: 214, optionen: RH.map((r, i) => [String(i), einr(r)]),
    wert: String(S.reihe), onChange: v => { S.reihe = Number(v); S.monat = null; zeichnen(); } });
  const mKnoepfe = DK.schnitt(bFilter, "Modell", "knoepfe", { optionen: [["best", "Bestes Modell"], ...MOD.map((m, i) => [i, m])],
    wert: "best", onChange: v => { S.modell = v; zeichnen(); } });
  const rechts = el("div", { class: "dk-rechts" }, bFilter);
  DK.schnitt(rechts, "Intervall", "knoepfe", { optionen: [[80, "80" + PZ], [95, "95" + PZ]], wert: 95,
    onChange: v => { S.niveau = v; zeichnen(); } });

  /* ---------- Berechnungen ---------- */
  const wert = (i, k = mi()) => (i < NI ? R().ist[i] : E(k).fc[i - NI]);
  const jahr = (j, k = mi()) => M.reduce((s, _, i) => s + (jahrVon(i) === j ? wert(i, k) : 0), 0);
  const halb = k => { const [u, o] = grenzen(k); let s = 0, n = 0;
    o.forEach((v, f) => { if (jahrVon(NI + f) === 2028) { s += (v - u[f]) / 2; n++; } }); return s / n; };
  const rangfolge = () => R().modelle.map((e, k) => ({ k, m: e.mapeTest })).sort((a, b) => a.m - b.m).map(x => x.k);
  const kennText = k => { const q = E(k).kenn, z = (v, nk) => zahl(v, nk);
    return [() => `R² ${z(q.R2, 2)}, Trend ${delta(q.trend, 1)} Stück/Monat`,
            () => `(0,1,1)(0,1,1)₁₂, θ ${z(q.theta, 2)}, Θ ${z(q.Theta, 2)}`,
            () => `α ${z(q.alpha, 2)}, β ${z(q.beta, 2)}, γ ${z(q.gamma, 2)}`,
            () => `${q.knicke === 0 ? "kein" : z(q.knicke, 0)} Trendknick${q.knicke === 1 || q.knicke === 0 ? "" : "e"}, Fourier-Ordnung ${z(q.K, 0)}`][k](); };
  const pz1 = v => zahl(v, 1);

  function kpiDaten() {
    const k = mi(), rang = rangfolge().indexOf(k) + 1;
    const j25 = jahr(2025), j26 = jahr(2026), j27 = jahr(2027), j28 = jahr(2028);
    const d = (a, b) => ({ delta: delta((a / b - 1) * 100, 1, PZ), klasse: DK.wirkung(a / b - 1, 1, 3) });
    return [
      { label: "Absatz 2026 (Ist), Stück", wert: zahl(j26), ...d(j26, j25) },
      { label: "2027 (Ist + Prognose), Stück", wert: zahl(j27), ...d(j27, j26) },
      { label: "Prognose 2028, Stück", wert: zahl(j28), ...d(j28, j27) },
      { label: "MAPE im Testjahr", wert: pz1(E(k).mapeTest), einheit: "%", bezug: "Rang", delta: `${rang} von ${MOD.length}`, klasse: "neutral" },
      { label: `Ø Intervall 2028 (${S.niveau}${NBSP}%), Stück`, wert: "±" + zahl(halb(k)), bezug: "zum Ø Monat",
        delta: "±" + pz1(halb(k) / (j28 / 12) * 100) + PZ, klasse: "neutral" },
    ];
  }

  /* ---------- Botschaften ---------- */
  const passt = (k, b) => k.find(t => DK.tw(t) <= b) || k[k.length - 1];
  function botschaftDiagramm() {
    const i = S.monat, k = mi(), [u, o] = grenzen(k);
    if (i !== null && i >= NI) {
      const f = i - NI;
      return passt([`${lang(i)}: Prognose ${zahl(E(k).fc[f])} Stück (${MOD[k]}), ${S.niveau}-%-Intervall ${zahl(u[f])} bis ${zahl(o[f])} Stück`,
        `${lang(i)}: Prognose ${zahl(E(k).fc[f])}, Intervall ${zahl(u[f])} bis ${zahl(o[f])} Stück`], 980);
    }
    if (i !== null) {
      const t = i >= T0 ? `, Testprognose ${zahl(E(k).test[i - T0])} (${delta((E(k).test[i - T0] / R().ist[i] - 1) * 100, 1, PZ)})` : "";
      return passt([`${lang(i)}: Ist ${zahl(R().ist[i])} Stück${t}`], 980);
    }
    const j27 = jahr(2027), j28 = jahr(2028);
    return passt([`${R().name}: Prognose 2028 ${zahl(j28)} Stück (${delta((j28 / j27 - 1) * 100, 1, PZ)} zu 2027) mit ${MOD[k]}; ${S.niveau}-%-Intervall je Monat rund ±${zahl(halb(k))} Stück`,
      `${R().name}: Prognose 2028 ${zahl(j28)} Stück (${delta((j28 / j27 - 1) * 100, 1, PZ)} zu 2027) mit ${MOD[k]}`], 980);
  }
  function botschaftTabelle() {
    const [a, b] = rangfolge(), ea = E(a), eb = E(b);
    const zus = S.modell !== "best" && S.modell !== a ? `; angezeigt: ${MOD[S.modell]} (${pz1(E(S.modell).mapeTest)}${PZ})` : "";
    return passt([`${MOD[a]} trifft das Testjahr am besten (MAPE ${pz1(ea.mapeTest)}${PZ}), vor ${MOD[b]} (${pz1(eb.mapeTest)}${PZ})${zus}`,
      `${MOD[a]} trifft das Testjahr am besten (MAPE ${pz1(ea.mapeTest)}${PZ})${zus}`], 980);
  }

  /* ---------- Diagramm ---------- */
  function schoen(v) { const p = Math.pow(10, Math.floor(Math.log10(v))); return [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].map(f => f * p).find(x => x >= v); }
  function diagramm(ziel, breite, hoehe) {
    ziel.textContent = "";
    const k = mi(), e = E(k), r = R(), [u, o] = grenzen(k);
    const svg = sv("svg", { width: breite, height: hoehe, role: "img",
      "aria-label": `Liniendiagramm: Absatz ${r.name} je Monat, Ist ${M[0]} bis ${M[NI - 1]}, Prognose ${MOD[k]} bis ${M[N - 1]} mit ${S.niveau}-%-Intervall` }, ziel);
    const links = 52, rechts = 96, oben = 26, unten = 24, PW = breite - links - rechts, PH = hoehe - oben - unten;
    const YMAX = schoen(Math.max(...r.ist, ...E(k).o95, ...e.test) * 1.02);
    const fach = PW / N, x = i => links + fach * (i + 0.5), y = v => oben + PH - v / YMAX * PH;
    const blass = S.monat !== null ? "dk-blass" : "";

    const ga = sv("g", { id: "pg-achse" }, svg);
    [0, 0.25, 0.5, 0.75, 1].map(f => f * YMAX).forEach(v => {
      sv("line", { x1: links, x2: links + PW, y1: y(v) + 0.5, y2: y(v) + 0.5, stroke: v ? "#E3E3E3" : "#8C8C8C", "stroke-width": 1 }, ga);
      sv("text", { x: links - 8, y: y(v), dy: "0.35em", "text-anchor": "end", class: "muted" }, ga, zahl(v));
    });
    const gz = sv("g", { id: "pg-zeit" }, svg);
    JAHRE.forEach(j => {
      const is = M.map((_, i) => i).filter(i => jahrVon(i) === j), a = is[0], b = is[is.length - 1];
      const xa = links + fach * a, xb = links + fach * (b + 1);
      sv("line", { x1: xa, x2: xa, y1: oben + PH, y2: oben + PH + 6, stroke: "#8C8C8C", "stroke-width": 1 }, gz);
      sv("text", { x: (xa + xb) / 2, y: oben + PH + 18, "text-anchor": "middle" }, gz, String(j));
    });
    sv("line", { x1: links + PW, x2: links + PW, y1: oben + PH, y2: oben + PH + 6, stroke: "#8C8C8C", "stroke-width": 1 }, gz);

    // Testjahr und Grenze Ist | Prognose
    const xs = links + fach * T0, xt = links + fach * NI;
    const gt = sv("g", { id: "pg-test" }, svg);
    sv("rect", { x: xs, y: oben, width: xt - xs, height: PH, fill: "#F6F6F6" }, gt);
    sv("text", { x: (xs + xt) / 2, y: 12, "text-anchor": "middle", class: "muted" }, gt, "Testjahr");
    const gp = sv("g", { id: "pg-trenner" }, svg);
    sv("line", { x1: xt, x2: xt, y1: 2, y2: oben + PH, stroke: "#6E747A", "stroke-width": 1, "stroke-dasharray": "3 3" }, gp);
    sv("text", { x: xt + 6, y: 12, class: "muted" }, gp, "Prognose");

    // Schlüssel
    const gs = sv("g", { id: "pg-schluessel" }, svg);
    let kx = links + 4;
    sv("line", { x1: kx, x2: kx + 18, y1: 8, y2: 8, stroke: "#3A3F44", "stroke-width": 2.5 }, gs);
    sv("text", { x: kx + 24, y: 8, dy: "0.35em", style: "font-weight:bold" }, gs, "Ist");
    kx += 24 + DK.tw("Ist", 14, true) + 18;
    sv("line", { x1: kx, x2: kx + 18, y1: 8, y2: 8, stroke: "#8F8F8F", "stroke-width": 1.5, "stroke-dasharray": "2 3" }, gs);
    sv("text", { x: kx + 24, y: 8, dy: "0.35em", class: "muted" }, gs, `Testprognose ${MOD[k]}, MAPE ${pz1(e.mapeTest)}${PZ}`);

    // Band
    const fi = M.map((_, i) => i).filter(i => i >= NI);
    const band = fi.map(i => `${x(i).toFixed(1)},${y(o[i - NI]).toFixed(1)}`).concat(
      fi.slice().reverse().map(i => `${x(i).toFixed(1)},${y(u[i - NI]).toFixed(1)}`));
    sv("polygon", { id: "pg-band", points: band.join(" "), fill: "#E3E3E3", class: blass }, svg);

    // Linien
    const gl = sv("g", { id: "pg-linien", class: blass }, svg);
    const ti = M.map((_, i) => i).filter(i => i >= T0 && i < NI);
    sv("path", { id: "pg-testlinie", d: ti.map((i, n) => `${n ? "L" : "M"}${x(i).toFixed(1)},${y(e.test[i - T0]).toFixed(1)}`).join(" "),
                 fill: "none", stroke: "#8F8F8F", "stroke-width": 1.5, "stroke-dasharray": "2 3" }, gl);
    const hist = M.map((_, i) => i).filter(i => i < NI);
    sv("path", { id: "pg-fc", d: [NI - 1, ...fi].map((i, n) => `${n ? "L" : "M"}${x(i).toFixed(1)},${y(wert(i, k)).toFixed(1)}`).join(" "),
                 fill: "none", stroke: "#8F8F8F", "stroke-width": 2.5, "stroke-dasharray": "6 4" }, gl);
    sv("path", { id: "pg-ist", d: hist.map((i, n) => `${n ? "L" : "M"}${x(i).toFixed(1)},${y(r.ist[i]).toFixed(1)}`).join(" "),
                 fill: "none", stroke: "#3A3F44", "stroke-width": 2.5, "stroke-linejoin": "round" }, gl);
    hist.forEach(i => sv("circle", { cx: x(i), cy: y(r.ist[i]), r: 2.4, fill: "#3A3F44" }, gl));
    fi.forEach(i => sv("circle", { cx: x(i), cy: y(e.fc[i - NI]), r: 2.4, fill: "#8F8F8F" }, gl));

    // Endbeschriftung (Abstände sichern)
    const ge = sv("g", { id: "pg-ende" }, svg), xe = x(N - 1) + 10, f = N - 1 - NI;
    let yo = y(o[f]), ym = y(e.fc[f]), yu = y(u[f]);
    ym = Math.min(Math.max(ym, yo + 16), yu - 16);
    if (ym - yo < 16) { yo = ym - 16; } if (yu - ym < 16) { yu = ym + 16; }
    sv("text", { x: xe, y: yo, dy: "0.35em", class: "muted" }, ge, "Obergrenze");
    sv("text", { x: xe, y: ym, dy: "0.35em", style: "font-weight:bold;fill:#4D4D4D" }, ge, "Prognose");
    sv("text", { x: xe, y: yu, dy: "0.35em", class: "muted" }, ge, "Untergrenze");

    if (S.monat !== null) {
      const i = S.monat, xi = x(i), gw = sv("g", { id: "pg-auswahl" }, svg);
      sv("line", { x1: xi, x2: xi, y1: oben, y2: oben + PH, stroke: "#6E747A", "stroke-width": 1 }, gw);
      const pkt = i >= NI ? [[o[i - NI], "#8F8F8F", false], [e.fc[i - NI], "#8F8F8F", true], [u[i - NI], "#8F8F8F", false]]
        : i >= T0 ? [[r.ist[i], "#3A3F44", true], [e.test[i - T0], "#8F8F8F", false]] : [[r.ist[i], "#3A3F44", true]];
      const re = xi < links + PW - 60;
      pkt.forEach(([v, farbe, fett]) => {
        sv("circle", { cx: xi, cy: y(v), r: 4, fill: farbe, stroke: "#FFFFFF", "stroke-width": 1 }, gw);
        sv("text", { x: re ? xi + 8 : xi - 8, y: y(v), dy: "0.35em", "text-anchor": re ? "start" : "end", stroke: "#FFFFFF",
                     "stroke-width": 4, "paint-order": "stroke", "stroke-linejoin": "round", style: fett ? "font-weight:bold" : "" }, gw, zahl(v));
      });
    }

    const gh = sv("g", { id: "pg-monate" }, svg);
    M.forEach((_, i) => {
      const g = sv("g", { class: "dk-klick" }, gh);
      const hit = sv("rect", { x: links + fach * i, y: oben, width: fach, height: PH, fill: "transparent" }, g);
      hit.addEventListener("click", () => { S.monat = S.monat === i ? null : i; zeichnen(); });
      tooltip(hit, () => {
        if (i < NI) return [lang(i) + (i >= T0 ? " (Ist, Testjahr)" : " (Ist)"), `Ist: ${zahl(r.ist[i])} Stück`,
          ...(i >= T0 ? MOD.map((m, kk) => `Testprognose ${KURZ[kk]}: ${zahl(r.modelle[kk].test[i - T0])}`) : []), "Klick hebt den Monat hervor"];
        const ff = i - NI;
        return [lang(i) + " (Prognose)", ...MOD.map((m, kk) => { const [uu, oo] = grenzen(kk);
          return `${KURZ[kk]}${kk === r.bestes ? " (bestes)" : ""}: ${zahl(r.modelle[kk].fc[ff])} (${zahl(uu[ff])} bis ${zahl(oo[ff])})`; }),
          `Intervall ${S.niveau}${NBSP}%; Vorjahresmonat ${zahl(wert(i - 12, k))} Stück`, "Klick hebt den Monat hervor"];
      });
    });
  }

  /* ---------- Modellvergleich ---------- */
  const SPALTEN = [
    { key: "modell", titel: "Modell", breite: 236 },
    { key: "rang", titel: "Rang", breite: 50, fmt: v => zahl(v) },
    { key: "mt", titel: "MAPE Testjahr in %", breite: 138, fmt: pz1, id: "sp-mape" },
    { key: "mf", titel: "MAPE Anpassung in %", breite: 150, fmt: pz1 },
    { key: "p28", titel: "Prognose 2028", breite: 108, fmt: v => zahl(v) },
    { key: "iv", titel: "Ø ± Intervall 2028", breite: 130, fmt: v => "±" + zahl(v) },
    { key: "kenn", titel: "Kennwerte des Modells", typ: "text" },
  ];
  function tabellenDaten() {
    const best = R().bestes;
    return rangfolge().map((k, n) => ({ key: k, label: MOD[k] + (k === best ? " · bestes Modell" : ""),
      werte: { rang: n + 1, mt: E(k).mapeTest, mf: E(k).mapeFit, p28: jahr(2028, k), iv: halb(k), kenn: kennText(k) } }));
  }

  /* ---------- Zeichnen ---------- */
  function zeichnen() {
    [...mKnoepfe.querySelectorAll("button")].forEach((b, i) => b.setAttribute("aria-pressed", String(i === 0 ? S.modell === "best" : S.modell === i - 1)));
    DK.kopf(bKopf, { titel: "Absatzprognose mit Modellvergleich",
      untertitel: `Absatz in Stück · ${R().name} · Ist ${M[0]} bis ${M[NI - 1]} · Prognose bis ${M[N - 1]}`,
      quelle: "Quelle: Absatzstatistik · Stand 30.06.2027",
      legende: [[FARBE.ist, "Ist"], [FARBE.fc, "Prognose"], ["#E3E3E3", `Intervall ${S.niveau}${NBSP}%`], [FARBE.gut, "günstig"], [FARBE.schlecht, "ungünstig"]] });
    DK.kpis(bKpi, kpiDaten());
    let v = DK.visual(bVis, { titel: `Absatz je Monat, ${R().name}`, einheit: `Stück, Prognose ${MOD[mi()]}${S.modell === "best" ? " (bestes Modell)" : ""}`,
      botschaft: botschaftDiagramm() });
    diagramm(v.flaeche, v.breite, v.hoehe);
    v = DK.visual(bTab, { titel: "Modellvergleich", einheit: `Testjahr ${M[T0]} bis ${M[NI - 1]}, Prognose und Intervall in Stück`, botschaft: botschaftTabelle() });
    const td = tabellenDaten();
    DK.matrix(v.flaeche, { spalten: SPALTEN, zeilen: td, zeilenhoehe: 24, auswahl: S.modell === "best" ? null : S.modell,
      onClick: k => { S.modell = S.modell === k ? "best" : k; zeichnen(); },
      tooltip: z => [MOD[z.key], `MAPE Testjahr ${pz1(z.werte.mt)}${PZ} (Prognose der 12 Testmonate aus den 30 Monaten davor)`,
        `MAPE Anpassung ${pz1(z.werte.mf)}${PZ} (Modellwerte gegenüber Ist)`, `Prognose 2028: ${zahl(z.werte.p28)} Stück`, kennText(z.key),
        "Klick zeigt das Modell im Diagramm"] });
    const zeilen = v.flaeche.querySelectorAll("tbody tr");
    td.forEach((z, n) => { if (z.key === R().bestes) zeilen[n].style.fontWeight = "bold"; });
    v.flaeche.querySelector("table").id = "tb-modelle";
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  /* ---------- Lernplattform ---------- */
  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "v-prognose", anker: "links", versatz: [990, 26], regel: "SAY – Botschaft vermitteln", titel: "Kernaussage unter dem Titel",
        text: "Unter jedem Titel steht ein Satz: Jahresprognose 2028 mit Veränderung zu 2027 und Intervallbreite; beim Modellvergleich, welches Modell das Testjahr am besten getroffen hat. Das Original zeigte nur „Prognose vs. Ist“." },
      { nr: 2, ziel: "kopf-legende", anker: "links", versatz: [-6, -2], regel: "UNIFY – Semantische Notation", titel: "Ist dunkel, Prognose grau",
        text: "Ist ist anthrazit, Prognose grau gestrichelt, das Intervall eine helle Fläche – dieselbe Notation wie bei Vorschauwerten im ganzen Buch. Im Original war Ist hellblau und die Prognose dunkelblau." },
      { nr: 3, ziel: "pg-band", anker: "links", versatz: [40, -24], regel: "EXPRESS – Bandbreite zeigen", titel: "Intervall als Fläche",
        text: "Das Prognoseintervall ist ein Band zwischen Unter- und Obergrenze. Seine Form verrät das Modell: Bei der Regression bleibt es fast gleich breit, bei ARIMA und Holt-Winters öffnet es sich mit dem Abstand zum letzten Ist, beim Prophet-Ansatz durch simulierte künftige Trendknicke." },
      { nr: 4, ziel: "pg-test", anker: "links", versatz: [60, 22], regel: "CHECK – Güte ehrlich messen", titel: "Testjahr statt Anpassung",
        text: "Jedes Modell wird auf den Monaten bis Juni 2026 geschätzt und muss das Testjahr Juli 2026 bis Juni 2027 vorhersagen (graue Fläche, gepunktete Testprognose). Maßgeblich ist der MAPE im Testjahr; der MAPE der Anpassung schmeichelt Modellen mit vielen Parametern." },
      { nr: 5, ziel: "tb-modelle", anker: "links", versatz: [180, -4], regel: "CONDENSE – Modelle vergleichen", titel: "Ein Modellvergleich statt eines Modells",
        text: "Die Tabelle stellt vier Verfahren nebeneinander, nach Test-MAPE geordnet: Prognose 2028, mittlere Intervallbreite und die je Modell typischen Kennwerte (R² und Trend, ARIMA-Parameter, Glättungsparameter, Trendknicke). Das beste Modell ist fett und vorausgewählt." },
      { nr: 6, ziel: "filter", anker: "links", versatz: [990, -2], regel: "STRUCTURE – Auswahl ordnen", titel: "Produkte als Hierarchie",
        text: "Gesamt, Produktgruppen und Einzelprodukte stehen eingerückt in einem Datenschnitt; Modell und Sicherheitsniveau daneben. Für jede Reihe wird das beste Modell eigens bestimmt – es ist nicht überall dasselbe." },
      { nr: 7, ziel: "pg-ende", anker: "links", versatz: [40, 84], regel: "SIMPLIFY – Direkt beschriften", titel: "Ohne Legende im Diagramm",
        text: "Prognose, Ober- und Untergrenze stehen am Ende des Bands, Ist und Testprognose oben links. Entfallen sind Navigationsleiste, Symbole, Zoom-Knöpfe und der Legendeneintrag „Ausreißer“ ohne Datenpunkt." },
    ],
    nachbauIntro: "Seitengröße benutzerdefiniert 1024 × 646 px. Schrift Arial: Beschriftungen 10,5 pt, Visualtitel 12 pt, KPI-Werte 19,5 pt. Die Modelle werden außerhalb von Power BI gerechnet (Python- oder R-Skript in Power Query, z. B. statsmodels, pmdarima, prophet) und als Tabelle Prognose (Reihe, Modell, Monat, Art, Ist, Modellwert, Testprognose, Grenzen 80/95, MAPE) importiert – wie in der CSV-Datei.",
    nachbau: [
      { id: "A", ziel: "filter", anker: "links", versatz: [222, -2], titel: "Datenschnitte", visual: "Datenschnitt (Dropdown mit Hierarchie; Kacheln)",
        felder: "Produkthierarchie Gesamt › Produktgruppe › Produkt; Modellwahl (entkoppelte Tabelle: Bestes Modell, 4 Modelle); Niveau (80; 95)",
        format: "Einfachauswahl, ausgewählt #3A3F44 mit weißer Schrift",
        hinweis: "Measure Modell gewählt = IF( SELECTEDVALUE( Modellwahl[Modell] ) = \"Bestes Modell\"; [Bestes Modell]; SELECTEDVALUE( Modellwahl[Modell] ) ), Bestes Modell = Modell mit MIN( MAPE_Test ) über TOPN( 1; …; [MAPE Test]; ASC )." },
      { id: "B", ziel: "kpis", anker: "links", versatz: [190, 26], titel: "Kennzahlen", visual: "Karte (neu) mit Referenzbeschriftung",
        felder: "Absatz 2026, 2027 (Ist + Prognose), Prognose 2028 je mit ΔVJ; MAPE Testjahr mit Rang (RANKX); Ø Intervallhalbbreite 2028",
        format: "ΔVJ farbig über bedingte Formatierung (#00806B / #C62828)" },
      { id: "C", ziel: "pg-linien", anker: "links", versatz: [61, -30], titel: "Linien, Testprognose und Band", visual: "Liniendiagramm (Standardvisual)",
        felder: "X-Achse: Monat; Y-Achse: Ist, Testprognose, Prognose (je Measure gefiltert auf [Modell gewählt])",
        format: "Ist #3A3F44, 2,5 px; Testprognose #8F8F8F, 1,5 px, gepunktet; Prognose #8F8F8F, 2,5 px, gestrichelt; Fehlerbalken für Prognose mit Ober-/Untergrenze, Darstellung Fehlerband #E3E3E3; Testjahr als Konstantenlinienbereich bzw. Hintergrundform #F6F6F6; Legende aus",
        hinweis: "Die eingebaute Prognose des Liniendiagramms (Analysebereich) kennt nur die exponentielle Glättung; für den Modellvergleich müssen die Werte importiert werden." },
      { id: "D", ziel: "tb-modelle", anker: "links", versatz: [180, -4], titel: "Modellvergleich", visual: "Tabelle (Standardvisual)",
        felder: "Modell, Rang, MAPE Testjahr, MAPE Anpassung, Prognose 2028, Ø ± Intervall 2028, Kennwerte (Textspalte)",
        format: "Sortierung nach MAPE Testjahr aufsteigend; bestes Modell fett über bedingte Formatierung (Schriftstil per Feldwert nicht möglich: stattdessen Symbol oder Hintergrund #F6F6F6 per Regel); Klick auf eine Zeile filtert das Liniendiagramm" },
      { id: "E", ziel: "v-prognose", anker: "links", versatz: [940, 0], titel: "Kernaussagen", visual: "Textfeld mit dynamischen Werten",
        felder: "Je Visual ein Text-Measure aus Jahressummen, [Modell gewählt] und MAPE", format: "10,5 pt, #4D4D4D" },
    ],
    theme: DK.thema(),
    csv: { name: "prognose_modellvergleich_daten.csv", text: () => {
      const z = ["Reihe;Ebene;Modell;Bestes_Modell;Monat;Art;Ist_Stueck;Modellwert_Stueck;Testprognose_Stueck;Untergrenze_80;Obergrenze_80;Untergrenze_95;Obergrenze_95;MAPE_Test_Prozent;MAPE_Anpassung_Prozent"];
      const k1 = v => String(v).replace(".", ",");
      RH.forEach(r => r.modelle.forEach((e, k) => M.forEach((m, i) => {
        const f = i - NI, ist = i < NI;
        z.push([r.name, r.ebene, MOD[k], k === r.bestes ? "ja" : "nein", m, ist ? "Ist" : "Prognose", ist ? r.ist[i] : "", ist ? e.fit[i] : e.fc[f],
          i >= T0 && ist ? e.test[i - T0] : "", ...(ist ? ["", "", "", ""] : [e.u80[f], e.o80[f], e.u95[f], e.o95[f]]), k1(e.mapeTest), k1(e.mapeFit)].join(";"));
      })));
      return z.join("\r\n"); } },
    tabellen: () => {
      const k = mi(), [u, o] = grenzen(k);
      return [
        { titel: "Kennzahlen", kopf: ["Kennzahl", "Wert", "Vergleich"], zeilen: kpiDaten().map(x => [x.label, x.wert + (x.einheit ? " " + x.einheit : ""), (x.bezug ?? "ΔVJ") + " " + x.delta]) },
        { titel: `Modellvergleich, ${R().name}`, kopf: SPALTEN.map(s => s.titel),
          zeilen: tabellenDaten().map(z => [MOD[z.key] + (z.key === R().bestes ? " (bestes)" : ""), String(z.werte.rang), pz1(z.werte.mt), pz1(z.werte.mf), zahl(z.werte.p28), "±" + zahl(z.werte.iv), z.werte.kenn]) },
        { titel: `Absatz je Monat, ${R().name}, ${MOD[k]}, ${S.niveau}-%-Intervall (Stück)`, kopf: ["Monat", "Ist", "Testprognose", "Prognose", "Untergrenze", "Obergrenze"],
          zeilen: M.map((m, i) => [m, i < NI ? zahl(R().ist[i]) : "–", i >= T0 && i < NI ? zahl(E(k).test[i - T0]) : "–",
            i >= NI ? zahl(E(k).fc[i - NI]) : "–", i >= NI ? zahl(u[i - NI]) : "–", i >= NI ? zahl(o[i - NI]) : "–"]) },
      ];
    },
  });
  zeichnen();
})();
