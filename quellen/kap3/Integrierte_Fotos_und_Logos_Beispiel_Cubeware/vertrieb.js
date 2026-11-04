/* Dashboard „Integrierte Fotos und Logos“ (Abb. 3.78): Monatsübersicht eines Automobilvertriebs mit Logo im Kopf,
   Foto der Verkäuferin/des Verkäufers des Monats und Produktfoto des Modells des Monats.
   Seite 1024 x 646 px. Daten: vertrieb.json (daten_vertrieb.py) – Ergebnisübersicht März mit den Werten des Originals,
   Ergebnis je Quartal, Verkäufer und Absatz je Modell (erfunden). Die Bildflächen sind bewusst neutrale Platzhalter
   (graue Fläche mit Symbol und Beschriftung) – keine echten Fotos und Logos.
   Datenschnitt Region; Klick auf eine Region (Diagramm, Tabelle) wirkt wie der Datenschnitt, Esc hebt auf. */
(() => {
  "use strict";
  const { zahl, delta, wirkung, FARBE, NBSP, sv, el } = DK;
  const RG = DATA.regionen, KZ = DATA.kennzahlen, MOD = DATA.modelle, QN = ["Q1", "Q2", "Q3", "Q4"];
  const pdl = (ist, plan) => (ist - plan) / Math.abs(plan) * 100;       // bei negativem Plan auf |Plan| bezogen
  const pz = (a, nk = 0) => zahl(a * 100, nk) + NBSP + "%";
  const tsd = v => zahl(v / 1000);
  const liste = a => (a.length > 1 ? a.slice(0, -1).join(", ") + " und " + a[a.length - 1] : a[0]);

  /* ---------- Zustand ---------- */
  const S = { region: null, sort: { key: "reihe", ab: false } };
  addEventListener("keydown", e => { if (e.key === "Escape" && S.region !== null) { S.region = null; zeichnen(); } });
  const regionSetzen = ri => { S.region = S.region === ri ? null : ri; zeichnen(); };

  /* ---------- Layout ---------- */
  DK.init({ titel: "Integrierte Fotos und Logos" });
  const bKopf = DK.box("kopf", 16, 10, 856, 46);
  const bLogo = DK.box("logo", 888, 10, 120, 46);
  DK.haarlinie(62);
  const bFilter = DK.box("filter", 16, 68, 992, 50, "dk-filter");
  const bKpi = DK.box("kpis", 16, 128, 992, 68);
  DK.haarlinie(206);
  const bQuartal = DK.box("v-quartal", 16, 216, 640, 212);
  const bTabelle = DK.box("v-tabelle", 16, 444, 640, 198);
  const bVerk = DK.box("v-verkaeufer", 680, 216, 328, 212);
  const bProd = DK.box("v-produkt", 680, 444, 328, 198);
  DK.haarlinie(436, 16, 368);
  DK.haarlinie(436, 680, 16);

  /* ---------- Berechnungen ---------- */
  const maerz = (ri, ki) => { const z = DATA.maerz.find(x => x[0] === ri && x[1] === ki); return { ist: z[2], plan: z[3] }; };
  const quartal = ri => QN.map((q, qi) => { const z = DATA.quartal.find(x => x[0] === ri && x[1] === qi); return { ist: z[2], plan: z[3] }; });
  const imFilter = ri => S.region === null || ri === S.region;
  function summeMaerz(ki) {
    let ist = 0, plan = 0;
    RG.forEach((r, ri) => { if (imFilter(ri)) { const m = maerz(ri, ki); ist += m.ist; plan += m.plan; } });
    return { ist, plan };
  }
  function summeQ1() {
    let ist = 0, plan = 0;
    RG.forEach((r, ri) => { if (imFilter(ri)) { const q = quartal(ri)[0]; ist += q.ist; plan += q.plan; } });
    return { ist, plan };
  }
  const zeileTab = ri => {
    const [u, r, e] = [0, 1, 2].map(ki => maerz(ri, ki));
    return { ri, u, r, e, werte: { reihe: ri, umsatz: u.ist, du: pdl(u.ist, u.plan), roh: r.ist, dr: pdl(r.ist, r.plan), erg: e.ist, de: pdl(e.ist, e.plan) } };
  };
  function verkaeufer() {
    const vs = DATA.verkaeufer.filter(v => imFilter(v[0])).map(([ri, name, fz, ums, ziel]) => ({ ri, name, fz, ums, ziel }))
      .sort((a, b) => b.fz - a.fz || b.fz / b.ziel - a.fz / a.ziel);
    return vs;
  }
  function modelle() {
    const m = MOD.map((name, mi) => ({ mi, name, n: DATA.absatz.filter(a => a[1] === mi && imFilter(a[0])).reduce((s, a) => s + a[2], 0) }));
    const ges = m.reduce((s, x) => s + x.n, 0);
    return { liste: m.sort((a, b) => b.n - a.n), ges };
  }

  /* ---------- Tooltip ---------- */
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
  const passt = (k, b) => k.find(t => DK.tw(t) <= b) || k[k.length - 1];

  /* ---------- Bildplatzhalter (keine echten Fotos/Logos) ---------- */
  function platzhalter(svg, x, y, w, h, art, zeilen, id) {
    const g = sv("g", { id }, svg);
    sv("rect", { x: x + 0.5, y: y + 0.5, width: w - 1, height: h - 1, fill: "#EFEFEF", stroke: "#A9A9A9", "stroke-width": 1, "stroke-dasharray": "4 3" }, g);
    const cx = x + w / 2, ic = art === "logo" ? { x: x + 12, y: y + h / 2 - 8 } : { x: cx - 16, y: y + h / 2 - 30 };
    if (art === "person") {
      sv("circle", { cx: cx, cy: ic.y + 9, r: 9, fill: "#C9C9C9" }, g);
      sv("path", { d: `M${cx - 17},${ic.y + 36}Q${cx - 17},${ic.y + 20} ${cx},${ic.y + 20}Q${cx + 17},${ic.y + 20} ${cx + 17},${ic.y + 36}Z`, fill: "#C9C9C9" }, g);
    } else if (art === "bild") {
      sv("polygon", { points: `${cx - 20},${ic.y + 34} ${cx - 6},${ic.y + 14} ${cx + 4},${ic.y + 26} ${cx + 10},${ic.y + 19} ${cx + 22},${ic.y + 34}`, fill: "#C9C9C9" }, g);
      sv("circle", { cx: cx + 12, cy: ic.y + 6, r: 5, fill: "#C9C9C9" }, g);
    } else {
      sv("rect", { x: ic.x, y: ic.y, width: 16, height: 16, rx: 3, fill: "#C9C9C9" }, g);
    }
    if (art === "logo") {
      sv("text", { x: x + 36, y: y + h / 2 - 8, dy: "0.35em", style: "font-weight:bold;fill:#4D4D4D" }, g, zeilen[0]);
      sv("text", { x: x + 36, y: y + h / 2 + 9, dy: "0.35em", class: "muted" }, g, zeilen[1]);
    } else {
      zeilen.forEach((t, i) => sv("text", { x: cx, y: ic.y + 50 + i * 17, dy: "0.35em", "text-anchor": "middle", class: i ? "muted" : "", style: i ? "" : "fill:#4D4D4D" }, g, t));
    }
    return g;
  }

  /* ---------- Datenschnitt ---------- */
  const regKnoepfe = DK.schnitt(bFilter, "Region", "knoepfe", {
    optionen: [["alle", "Alle"], ...RG.map((r, i) => [String(i), r])], wert: "alle",
    onChange: v => { S.region = v === "alle" ? null : Number(v); zeichnen(); } });

  /* ---------- Visuals ---------- */
  function quartalsDiagramm(ziel, breite, hoehe) {
    ziel.textContent = "";
    const svg = sv("svg", { width: breite, height: hoehe, role: "img", "aria-label": "Ergebnis je Quartal 2027 nach Region, Q1 Ist und Plan, Q2 bis Q4 Plan" }, ziel);
    const abst = 18, pw = (breite - 3 * abst) / 4, yA = 36, yB = hoehe - 62;
    const alle = RG.flatMap((r, ri) => quartal(ri).flatMap(q => [q.plan, q.ist ?? 0]));
    const max = Math.max(0, ...alle), min = Math.min(0, ...alle), k = (yB - yA) / (max - min), Y = v => yA + (max - v) * k;
    const fach = pw / 4, sb = 18, vers = 5;
    RG.forEach((r, ri) => {
      const x0 = ri * (pw + abst), qs = quartal(ri), blass = S.region !== null && S.region !== ri;
      const g = sv("g", { class: "dk-klick" + (blass ? " dk-blass" : ""), "data-name": r, id: "qd-" + ri }, svg);
      sv("text", { x: x0, y: 8, dy: "0.35em", style: "font-weight:bold" }, g, r);
      qs.forEach((q, qi) => {
        const cx = x0 + fach * (qi + 0.5), mitIst = q.ist !== null;
        const px = mitIst ? cx - sb / 2 - vers : cx - sb / 2;
        sv("rect", { x: px + 0.5, y: Math.min(Y(q.plan), Y(0)) + 0.5, width: sb - 1, height: Math.max(1, Math.abs(Y(q.plan) - Y(0)) - 1), fill: "#FFFFFF", stroke: "#3A3F44", "stroke-width": 1 }, g);
        let wert = q.plan, xl = cx;
        if (mitIst) {
          sv("rect", { x: cx - sb / 2 + vers, y: Math.min(Y(q.ist), Y(0)), width: sb, height: Math.max(1, Math.abs(Y(q.ist) - Y(0))), fill: "#3A3F44" }, g);
          wert = q.ist; xl = cx + vers;
        }
        const oben = Math.max(q.plan, q.ist ?? -Infinity), unten = Math.min(q.plan, q.ist ?? Infinity);
        const yl = wert >= 0 ? Y(Math.max(oben, 0)) - 6 : Y(Math.min(unten, 0)) + 14;
        sv("text", { x: xl, y: yl, "text-anchor": "middle", style: mitIst ? "font-weight:bold" : "" }, g, zahl(wert));
        sv("text", { x: cx, y: hoehe - 30, dy: "0.35em", "text-anchor": "middle", class: "muted" }, g, QN[qi]);
      });
      sv("line", { x1: x0, x2: x0 + pw, y1: Y(0) + 0.5, y2: Y(0) + 0.5, stroke: "#8C8C8C", "stroke-width": 1 }, g);
      const d = qs[0].ist - qs[0].plan;
      sv("text", { x: x0 + fach * 0.5, y: hoehe - 10, dy: "0.35em", "text-anchor": "middle", style: `font-weight:bold;fill:${FARBE[wirkung(d, 1, 0)] || "var(--text)"}` }, g, delta(d, 0));
      sv("text", { x: x0 + fach * 1.2, y: hoehe - 10, dy: "0.35em", class: "muted" }, g, "ΔPL Q1");
      const hit = sv("rect", { x: x0, y: 0, width: pw, height: hoehe, fill: "transparent" }, g);
      hit.addEventListener("click", () => regionSetzen(ri));
      tooltip(hit, () => [r, `Q1 Ist ${zahl(qs[0].ist)} · Plan ${zahl(qs[0].plan)} Tsd. € · ΔPL ${delta(d, 0)} (${delta(pdl(qs[0].ist, qs[0].plan), 1, NBSP + "%")})`,
        `Plan Q2 ${zahl(qs[1].plan)} · Q3 ${zahl(qs[2].plan)} · Q4 ${zahl(qs[3].plan)} Tsd. €`,
        `Jahr: Q1 Ist + Plan Q2–Q4 = ${zahl(qs[0].ist + qs[1].plan + qs[2].plan + qs[3].plan)} Tsd. € (Plan ${zahl(qs.reduce((s, q) => s + q.plan, 0))})`,
        "Klick filtert das Dashboard auf die Region"]);
    });
  }

  function tabelle(ziel) {
    let zeilen = RG.map((r, ri) => ({ ...zeileTab(ri), key: ri, label: r }));
    const s = S.sort;
    if (s.key !== "reihe") zeilen.sort((a, b) => (s.ab ? b.werte[s.key] - a.werte[s.key] : a.werte[s.key] - b.werte[s.key]));
    DK.matrix(ziel, {
      spalten: [
        { key: "region", titel: "Region", breite: 136, id: "tb-region" },
        { key: "umsatz", titel: "Umsatz", breite: 66, fmt: tsd },
        { key: "du", titel: "ΔPL in %", breite: 98, typ: "delta", richtung: 1, nk: 1, textBreite: 50, id: "tb-du" },
        { key: "roh", titel: "Rohertrag", breite: 74, fmt: tsd },
        { key: "dr", titel: "ΔPL in %", breite: 98, typ: "delta", richtung: 1, nk: 1, textBreite: 50 },
        { key: "erg", titel: "Ergebnis", breite: 68, fmt: tsd, id: "tb-erg" },
        { key: "de", titel: "ΔPL in %", breite: 100, typ: "delta", richtung: 1, nk: 1, textBreite: 54 },
      ],
      zeilen: zeilen.map(z => ({ key: z.key, label: z.label, werte: z.werte })),
      zeilenhoehe: 26, auswahl: S.region, onClick: regionSetzen, sortierung: s.key === "reihe" ? null : s,
      onSort: key => { if (key === "region") S.sort = { key: "reihe", ab: false }; else S.sort = { key, ab: S.sort.key === key ? !S.sort.ab : true }; zeichnen(); },
      tooltip: z => { const t = zeileTab(z.key);
        return [z.label, ...[["Umsatzerlöse", t.u], ["Rohertrag", t.r], ["Ergebnis", t.e]].map(([n, m]) =>
          `${n}: Ist ${zahl(m.ist)} € · Plan ${zahl(m.plan)} € · ΔPL ${delta(pdl(m.ist, m.plan), 1, NBSP + "%")}`), "Klick filtert das Dashboard auf die Region"]; },
    });
    ziel.querySelector("table").id = "tb-matrix";
  }

  function verkaeuferBox(ziel, breite, hoehe, vs) {
    ziel.textContent = "";
    const svg = sv("svg", { width: breite, height: hoehe, role: "img", "aria-label": "Verkäufer des Monats mit Fotoplatzhalter" }, ziel);
    platzhalter(svg, 0, 4, 108, 140, "person", ["Foto", "(Platzhalter)"], "vk-foto");
    const v = vs[0], x = 126, g = sv("g", { id: "vk-text" }, svg);
    sv("text", { x, y: 14, dy: "0.35em", style: "font-weight:bold;font-size:16px" }, g, v.name);
    sv("text", { x, y: 36, dy: "0.35em", class: "muted" }, g, RG[v.ri]);
    sv("text", { x, y: 66, dy: "0.35em" }, g, `${zahl(v.fz)} Fahrzeuge, Ziel ${zahl(v.ziel)}`);
    sv("text", { x, y: 86, dy: "0.35em", style: `font-weight:bold;fill:${FARBE[wirkung(v.fz - v.ziel, 1, 0)] || "var(--text)"}` }, g,
      `${delta(v.fz - v.ziel, 0)} Fahrzeuge (${pz(v.fz / v.ziel)})`);
    sv("text", { x, y: 106, dy: "0.35em" }, g, `Umsatz ${zahl(v.ums / 1000, 2)} Mio. €`);
    if (vs[1]) sv("text", { x, y: 136, dy: "0.35em", class: "muted" }, g, `danach ${vs[1].name} (${zahl(vs[1].fz)})`);
  }

  function produktBox(ziel, breite, hoehe, m) {
    ziel.textContent = "";
    const svg = sv("svg", { width: breite, height: hoehe, role: "img", "aria-label": "Modell des Monats mit Produktfotoplatzhalter" }, ziel);
    platzhalter(svg, 0, 4, 150, 104, "bild", ["Produktfoto", "(Platzhalter)"], "pd-foto");
    const [a, b] = m.liste, x = 166, g = sv("g", { id: "pd-text" }, svg);
    sv("text", { x, y: 14, dy: "0.35em", style: "font-weight:bold;font-size:16px" }, g, a.name);
    sv("text", { x, y: 42, dy: "0.35em" }, g, `${zahl(a.n)} Fahrzeuge`);
    sv("text", { x, y: 62, dy: "0.35em" }, g, `${pz(a.n / m.ges)} des Absatzes`);
    if (b) sv("text", { x, y: 92, dy: "0.35em", class: "muted" }, g, `vor ${b.name} (${zahl(b.n)})`);
  }

  /* ---------- Botschaften ---------- */
  function botQuartal() {
    if (S.region !== null) {
      const qs = quartal(S.region), d = qs[0].ist - qs[0].plan;
      return passt([`${RG[S.region]}: Q1 Ist ${zahl(qs[0].ist)} bei Plan ${zahl(qs[0].plan)} Tsd. € (${delta(d, 0)}), Plan Q2–Q4 ${zahl(qs[1].plan + qs[2].plan + qs[3].plan)}`,
        `${RG[S.region]}: Q1 Ist ${zahl(qs[0].ist)} bei Plan ${zahl(qs[0].plan)} Tsd. € (${delta(d, 0)})`], 640);
    }
    const q = summeQ1(), ueber = RG.filter((r, ri) => { const x = quartal(ri)[0]; return x.ist > x.plan; });
    const teil = ueber.length === 0 ? "keine Region über Plan" : ueber.length === 1 ? `nur ${ueber[0]} über Plan` : `${liste(ueber)} über Plan`;
    return passt([`Q1 Ist ${zahl(q.ist)} bei Plan ${zahl(q.plan)} Tsd. € (${delta(q.ist - q.plan, 0)}); ${teil}`], 640);
  }
  function botTabelle() {
    if (S.region !== null) {
      const t = zeileTab(S.region).werte;
      return passt([`${RG[S.region]}: Umsatz ${delta(t.du, 1, NBSP + "%")}, Rohertrag ${delta(t.dr, 1, NBSP + "%")}, Ergebnis ${delta(t.de, 1, NBSP + "%")} zum Plan`], 640);
    }
    const ts = RG.map((r, ri) => zeileTab(ri)), nU = ts.filter(t => t.werte.du < 0).length;
    const eNeg = ts.filter(t => t.werte.de < 0).map(t => RG[t.ri]);
    const a = nU === RG.length ? "Umsatz in allen Regionen unter Plan" : `Umsatz in ${nU} von ${RG.length} Regionen unter Plan`;
    const b = eNeg.length === 0 ? "Ergebnis überall über Plan" : `Ergebnis nur in ${liste(eNeg)} unter Plan`;
    return passt([`${a}, ${b}`, a], 640);
  }

  /* ---------- Zeichnen ---------- */
  function zeichnen() {
    [...regKnoepfe.querySelectorAll("button")].forEach((b, i) => b.setAttribute("aria-pressed", String(i === 0 ? S.region === null : S.region === i - 1)));
    DK.kopf(bKopf, { titel: "Monatsübersicht Vertrieb",
      untertitel: `Ergebnis nach Regionen · März 2027 · ${S.region === null ? "alle Regionen" : RG[S.region]} · Vergleich mit Plan (ΔPL)`,
      quelle: "Stand 31.03.2027",
      legende: [["#3A3F44", "Ist"], ["#FFFFFF", "Plan", "#3A3F44"], [FARBE.gut, "günstig"], [FARBE.schlecht, "ungünstig"]] });
    const kpi = (label, s, fmt, einheit) => ({ label, wert: fmt(s.ist), einheit, bezug: "ΔPL",
      delta: delta(pdl(s.ist, s.plan), 1, NBSP + "%"), klasse: wirkung(pdl(s.ist, s.plan), 1, 1) });
    DK.kpis(bKpi, [
      kpi("Umsatzerlöse März", summeMaerz(0), v => zahl(v / 1e6, 2), "Mio. €"),
      kpi("Rohertrag März", summeMaerz(1), v => zahl(v / 1000), "Tsd. €"),
      kpi("Ergebnis März", summeMaerz(2), v => zahl(v / 1000), "Tsd. €"),
      kpi("Ergebnis 1. Quartal", summeQ1(), v => zahl(v), "Tsd. €"),
    ]);
    let v = DK.visual(bQuartal, { titel: "Ergebnis je Quartal 2027", einheit: "Tsd. €, Q1 Ist, Q2–Q4 Plan", botschaft: botQuartal() });
    quartalsDiagramm(v.flaeche, v.breite, v.hoehe);
    v = DK.visual(bTabelle, { titel: "Ergebnisübersicht nach Regionen, März 2027", einheit: "Tsd. €", botschaft: botTabelle() });
    tabelle(v.flaeche);
    const vs = verkaeufer(), w = vs[0];
    v = DK.visual(bVerk, { titel: "Verkäufer des Monats", einheit: "März 2027",
      botschaft: passt([`${w.name}: ${zahl(w.fz)} Fahrzeuge, ${pz(w.fz / w.ziel)} des Ziels`, `${w.name}: ${zahl(w.fz)} Fahrzeuge`], 328) });
    verkaeuferBox(v.flaeche, v.breite, v.hoehe, vs);
    const m = modelle(), a = m.liste[0];
    v = DK.visual(bProd, { titel: "Modell des Monats", einheit: "März 2027",
      botschaft: passt([`${a.name}: ${zahl(a.n)} Fahrzeuge, ${pz(a.n / m.ges)} des Absatzes`, `${a.name}: ${zahl(a.n)} Fahrzeuge (${pz(a.n / m.ges)})`], 328) });
    produktBox(v.flaeche, v.breite, v.hoehe, m);
    bLogo.textContent = "";
    platzhalter(sv("svg", { width: 120, height: 46, role: "img", "aria-label": "Platzhalter für das Logo" }, bLogo), 0, 0, 120, 46, "logo", ["Logo", "(Platzhalter)"], "lg-logo");
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  /* ---------- Lernplattform ---------- */
  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "v-quartal", anker: "links", versatz: [600, 26], regel: "SAY – Botschaft vermitteln", titel: "Aussage statt Begrüßung",
        text: "Jedes Visual nennt in einem Satz, was es zeigt – etwa, dass im ersten Quartal nur Kontinentaleuropa über Plan liegt. Das Original begann mit „Hallo User Admin, willkommen beim … Info-System“." },
      { nr: 2, ziel: "vk-foto", anker: "links", versatz: [71, 148], regel: "SIMPLIFY – Bilder mit Informationswert", titel: "Fotos nur, wo sie etwas sagen",
        text: "Fotos stehen dort, wo sie Inhalt tragen: bei der Verkäuferin oder dem Verkäufer des Monats und beim Modell des Monats; das Logo klein im Kopf. Das dekorative Fahrzeugbild im Kopfbanner und das Hintergrundbild hinter dem ganzen Bericht entfallen. Hier sind alle Bildflächen bewusst neutrale Platzhalter. Fotos von Beschäftigten nur mit deren Einwilligung verwenden." },
      { nr: 3, ziel: "v-quartal", anker: "links", versatz: [272, 149], regel: "EXPRESS – Passende Visualisierung", titel: "Säulen statt überlagerter Flächen",
        text: "Das Original zeigte vier geglättete, halbtransparente Flächen übereinander; wo sie sich überlagerten, entstanden Mischfarben, und negative Werte verschwanden hinter anderen Flächen. Jetzt hat jede Region ein eigenes kleines Diagramm mit gleichem Maßstab." },
      { nr: 4, ziel: "kopf-legende", anker: "links", versatz: [-6, -2], regel: "UNIFY – Semantische Notation", titel: "Ist, Plan und Wirkung",
        text: "Ist anthrazit, Plan weiß mit Kontur; Abweichungen blaugrün (günstig) oder rot (ungünstig) nach Wirkung. Das Original nutzte rote Abwärtspfeile und gelbe Rechtspfeile – auch für eine Ergebnisverbesserung um 331 %." },
      { nr: 5, ziel: "tb-erg", anker: "links", versatz: [53, -23], regel: "CHECK – Richtige Inhalte", titel: "Abweichung bei negativem Plan",
        text: "Die Abweichung ist auf den Betrag des Plans bezogen: Großbritannien liegt mit −74,8 Tsd. € Ergebnis über dem Plan von −84,1 Tsd. € (+11,1 %), also günstig. Werte in Tsd. € statt auf den Euro genau." },
      { nr: 6, ziel: "tb-region", anker: "links", versatz: [80, -4], regel: "STRUCTURE – Inhalte ordnen", titel: "Gleiche Reihenfolge überall",
        text: "Die Regionen stehen nach Umsatz geordnet – in Diagramm und Tabelle in derselben Reihenfolge; die Tabelle lässt sich per Klick auf den Spaltenkopf sortieren. Im Original waren Tabelle und Legende unterschiedlich geordnet, die Namen der Gesellschaften nannten die Region nur indirekt." },
      { nr: 7, ziel: "kpis", anker: "links", versatz: [662, 26], regel: "CONDENSE – Verdichten", titel: "KPI-Leiste ergänzt",
        text: "Neu ist die Leiste mit den Summen für März und das erste Quartal. Sie zeigt sofort den Widerspruch, den das Original verbarg: Im März liegt das Ergebnis über Plan, im Quartal deutlich darunter." },
      { nr: 8, ziel: "filter", anker: "links", versatz: [680, -2], regel: "CONDENSE – Filtern", titel: "Region filtern",
        text: "Der Datenschnitt Region filtert Kennzahlen, Verkäufer und Modell des Monats; ein Klick auf eine Region im Diagramm oder in der Tabelle wirkt genauso und hebt sie dort hervor. Esc hebt die Auswahl auf. Das Original bot nur die Periodenauswahl „März“." },
    ],
    nachbauIntro: "Seitengröße 1024 × 646 px. Schrift Arial: Beschriftungen 10,5 pt, Visualtitel 12 pt, KPI-Werte 19,5 pt. Datenmodell: Tabellen Monatswerte (Region, Periode, Kennzahl, Ist, Plan), Quartale (Region, Quartal, Ist, Plan), Verkäufer (Region, Name, Fahrzeuge, Umsatz, Ziel, Foto-URL) und Absatz (Region, Modell, Fahrzeuge) mit Dimension Region; in der CSV-Datei durch die Spalte „Ebene“ getrennt.",
    nachbau: [
      { id: "A", ziel: "kpis", anker: "links", versatz: [190, 26], titel: "Kennzahlen", visual: "Karte (neu) mit Referenzbeschriftung",
        felder: "Ist = SUM(Monatswerte[Ist]) je Kennzahl; ΔPL % = DIVIDE([Ist] − [Plan]; ABS([Plan]))", format: "Wert 19,5 pt fett; Referenz farbig über bedingte Formatierung (#00806B / #C62828)" },
      { id: "B", ziel: "v-quartal", anker: "links", versatz: [272, 149], titel: "Ergebnis je Quartal", visual: "Gruppiertes Säulendiagramm (Standardvisual) mit kleinen Vielfachen",
        felder: "X-Achse: Quartal; Y-Achse: Plan, Ist; Kleine Vielfache: Region", format: "Plan weiß mit Rahmen #3A3F44, Ist #3A3F44; Datenbeschriftung; gemeinsame Y-Achse, Achse und Gitternetz aus" },
      { id: "C", ziel: "tb-region", anker: "links", versatz: [80, -4], titel: "Ergebnisübersicht", visual: "Matrix (Standardvisual)",
        felder: "Zeilen: Region; Werte: Ist und ΔPL % je Kennzahl", format: "ΔPL % mit Datenbalken (positiv #00806B, negativ #C62828) und Schriftfarbe nach Wirkung; Werte in Tsd. €" },
      { id: "D", ziel: "vk-foto", anker: "links", versatz: [71, 148], titel: "Foto Verkäufer des Monats", visual: "Tabelle oder Karte (neu) mit Bild",
        felder: "Spalte Foto-URL mit Datenkategorie „Bild-URL“; Filter TOPN(1; Verkäufer; [Fahrzeuge])", format: "Bildgröße fest (z. B. 108 × 140 px), ohne Rahmen",
        hinweis: "Bilder werden über eine URL eingebunden und folgen dem Datenschnitt; das Foto wechselt mit der Region." },
      { id: "E", ziel: "pd-foto", anker: "links", versatz: [92, 112], titel: "Produktfoto", visual: "Tabelle oder Karte (neu) mit Bild",
        felder: "Modell, Bild-URL; TOPN(1; Absatz; [Fahrzeuge])", format: "wie D" },
      { id: "F", ziel: "logo", anker: "links", versatz: [80, 52], titel: "Logo", visual: "Bild (Einfügen › Bild)",
        felder: "–", format: "Höhe 46 px, rechts oben", hinweis: "Statisches Bild; alternativ im Berichtsdesign hinterlegt." },
      { id: "G", ziel: "filter", anker: "links", versatz: [120, -2], titel: "Datenschnitt", visual: "Datenschnitt",
        felder: "Region als Kacheln (Einzelauswahl)", format: "Ausgewählt #3A3F44 mit weißer Schrift, sonst weiß mit Rahmen #9A9A9A" },
    ],
    theme: DK.thema(),
    csv: { name: "vertrieb_fotos_logos_daten.csv", text: () => {
      const z = ["Ebene;Region;Periode;Kennzahl_oder_Name;Ist;Plan;Ziel"];
      DATA.maerz.forEach(([ri, ki, i, p]) => z.push(["Monat", RG[ri], DATA.monat, KZ[ki] + " (€)", i, p, ""].join(";")));
      DATA.quartal.forEach(([ri, qi, i, p]) => z.push(["Quartal", RG[ri], "2027-" + QN[qi], "Ergebnis (Tsd. €)", i ?? "", p, ""].join(";")));
      DATA.verkaeufer.forEach(([ri, n, f, u, zi]) => z.push(["Verkäufer", RG[ri], DATA.monat, n, f, "", zi].join(";")));
      DATA.absatz.forEach(([ri, mi, s]) => z.push(["Modell", RG[ri], DATA.monat, MOD[mi], s, "", ""].join(";")));
      return z.join("\r\n"); } },
    tabellen: () => {
      const reg = S.region === null ? "alle Regionen" : RG[S.region];
      return [
        { titel: "Ergebnisübersicht März 2027 (€)", kopf: ["Region", "Kennzahl", "Ist", "Plan", "ΔPL in %"],
          zeilen: RG.flatMap((r, ri) => KZ.map((k, ki) => { const m = maerz(ri, ki); return [r, k, zahl(m.ist), zahl(m.plan), delta(pdl(m.ist, m.plan), 1)]; })) },
        { titel: "Ergebnis je Quartal 2027 (Tsd. €)", kopf: ["Region", "Quartal", "Ist", "Plan"],
          zeilen: RG.flatMap((r, ri) => quartal(ri).map((q, qi) => [r, QN[qi], q.ist === null ? "–" : zahl(q.ist), zahl(q.plan)])) },
        { titel: `Verkäufer März 2027, ${reg}`, kopf: ["Name", "Region", "Fahrzeuge", "Ziel", "Umsatz Tsd. €"],
          zeilen: verkaeufer().map(v => [v.name, RG[v.ri], zahl(v.fz), zahl(v.ziel), zahl(v.ums)]) },
        { titel: `Absatz März 2027 je Modell, ${reg}`, kopf: ["Modell", "Fahrzeuge", "Anteil"],
          zeilen: (() => { const m = modelle(); return m.liste.map(x => [x.name, zahl(x.n), pz(x.n / m.ges, 1)]); })() },
      ];
    },
  });
  zeichnen();
})();
