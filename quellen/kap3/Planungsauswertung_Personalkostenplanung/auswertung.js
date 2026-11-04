/* Dashboard „Planungsauswertung Personalkostenplanung“ (Abb. 3.190). Seite 1024 x 646 px.
   Daten: personalkosten.json (daten_personalkosten.py) – dieselben Planstellen, FTE, Entgelte und Prämissen wie im
   Planungsformular (Abb. 3.189), je Planstelle, Monat und Kostenart in Cent; dazu FTE je Planstelle und Monat.
   Aufbau wie im Original (Reiter „Reporting“ der Planungsanwendung): Kostenarten-Hierarchie Personalkosten →
   Anwesenheitslohn / Lohnnebenkosten (hier KPI-Leiste und Kostenartendiagramm) und Monatsverlauf als Säulen;
   die „freien Merkmale“ des Originals (Planstelle, Vertragsart …) sind Datenschnitte bzw. die Planstellentabelle.
   Szenario Plan: weiß mit Kontur; Lohnnebenkosten hellgrau gefüllt. Klick auf Planstelle, Monat oder Kostenart
   filtert die übrigen Visuals und die KPI-Leiste, das angeklickte Visual hebt hervor; Esc hebt auf. */
(() => {
  "use strict";
  const { zahl, NBSP, sv, el } = DK;
  const ST = DATA.stellen.map(([ps, bez, vertrag, fte, entgelt, von, bis], i) => ({ i, ps, bez, vertrag, fte, entgelt, von, bis }));
  const KA = DATA.kostenarten.map(([name, gruppe], i) => ({ i, name, gruppe, lnk: gruppe === "Lohnnebenkosten" }));
  const MK = DATA.monate, JAHR = DATA.jahr, P = DATA.praemissen;
  const MNAME = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
  const BEZ = [...new Set(ST.map(s => s.bez))], VERTRAG = [...new Set(ST.map(s => s.vertrag))];
  const KST = DATA.kostenstelle.join(" ");
  const F_AL = "#FFFFFF", F_LNK = "#D4D4D4", KONTUR = "#3A3F44";
  const eur = c => zahl(c / 100, 0);
  const tsd = (c, nk = 0) => zahl(c / 1e5, nk);
  const pz = (a, nk = 1) => zahl(a * 100, nk) + NBSP + "%";
  const fteTxt = v => zahl(v, 1);
  const monatVon = t => Number(t.slice(3, 5)) - 1;
  const zeitraum = s => { const a = monatVon(s.von), b = monatVon(s.bis); return a === 0 && b === 11 ? "ganzjährig" : `${MK[a]}–${MK[b]}`; };

  /* ---------- Zustand ---------- */
  const S = { bez: null, vertrag: null, ps: null, monat: null, ka: null, sort: { key: "ps", ab: false } };
  addEventListener("keydown", e => {
    if (e.key !== "Escape") return;
    if (S.ka !== null) S.ka = null; else if (S.monat !== null) S.monat = null; else if (S.ps !== null) S.ps = null; else return;
    zeichnen();
  });

  /* ---------- Layout (Seite 1024 x 646) ---------- */
  DK.init({ titel: "Planungsauswertung Personalkostenplanung" });
  const bKopf = DK.box("kopf", 16, 10, 992, 46);
  DK.haarlinie(62);
  const bFilter = DK.box("filter", 16, 68, 992, 50, "dk-filter");
  const bKpi = DK.box("kpis", 16, 128, 992, 68);
  DK.haarlinie(206);
  const bStellen = DK.box("v-stellen", 16, 216, 560, 426);
  const bMonat = DK.box("v-monat", 596, 216, 412, 228);
  DK.haarlinie(454, 596, 16);
  const bKart = DK.box("v-kostenart", 596, 464, 412, 178);

  /* ---------- Filter und Berechnungen ---------- */
  const stelleOk = s => (S.bez === null || s.bez === S.bez) && (S.vertrag === null || s.vertrag === S.vertrag);
  // Einzelsätze nach Datenschnitten und Auswahl; „ohne“ nennt die Auswahl, die für das jeweilige Visual nicht filtert
  function werte(ohne = "") {
    return DATA.werte.filter(([si, mi, ki]) => stelleOk(ST[si]) &&
      (ohne === "ps" || S.ps === null || si === S.ps) && (ohne === "monat" || S.monat === null || mi === S.monat) &&
      (ohne === "ka" || S.ka === null || ki === S.ka));
  }
  const summe = (z, f = () => true) => z.reduce((s, x) => s + (f(x) ? x[3] : 0), 0);
  // FTE je Monat (DATA.fte in Tausendstel) für die gefilterten Planstellen
  function fteMonat(ohne = "") {
    return MK.map((_, mi) => DATA.fte.reduce((s, f, si) => s + (stelleOk(ST[si]) && (ohne === "ps" || S.ps === null || si === S.ps) ? f[mi] : 0), 0) / 1000);
  }
  function kennzahlen() {
    const z = werte(), fm = fteMonat();
    const al = summe(z, x => !KA[x[2]].lnk), lnk = summe(z, x => KA[x[2]].lnk);
    const fte = S.monat === null ? fm.reduce((a, b) => a + b, 0) / 12 : fm[S.monat];
    return { pk: al + lnk, al, lnk, fte, fm };
  }
  // Personalkosten je FTE und Monat im Jahresdurchschnitt (Auswahl ohne Monat)
  function jahrJeFte(k) {
    const pk = summe(werte("monat")), fte = fteMonat().reduce((a, b) => a + b, 0) / 12;
    return fte && k.fte ? eur(pk / fte / 12) + NBSP + "€" : "–";
  }
  function stellenDaten() {
    const z = werte("ps");
    const ges = summe(z);
    return ST.filter(stelleOk).map(s => {
      const pk = summe(z, x => x[0] === s.i);
      return { s, pk, al: summe(z, x => x[0] === s.i && !KA[x[2]].lnk), lnk: summe(z, x => x[0] === s.i && KA[x[2]].lnk), anteil: ges ? pk / ges : 0 };
    });
  }
  function monatsDaten() {
    const z = werte("monat"), fm = fteMonat();
    return MK.map((name, mi) => ({ mi, name, al: summe(z, x => x[1] === mi && !KA[x[2]].lnk), lnk: summe(z, x => x[1] === mi && KA[x[2]].lnk),
      sonder: summe(z, x => x[1] === mi && x[2] === 2), fte: fm[mi] }));
  }
  function kostenartDaten() {
    const z = werte("ka"), ges = summe(z);
    return KA.map(k => ({ k, wert: summe(z, x => x[2] === k.i), anteil: ges ? summe(z, x => x[2] === k.i) / ges : 0 }));
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

  /* ---------- Gestapelte Plansäulen (weiß mit Kontur, Lohnnebenkosten hellgrau) ---------- */
  function saeulenPlan(ziel, o) {
    const W = o.breite, H = o.hoehe, n = o.spalten.length;
    const svg = sv("svg", { width: W, height: H, role: "img", "aria-label": o.aria }, ziel);
    const oben = 20, unten = 20, PH = H - oben - unten, slot = W / n, bw = Math.min(24, Math.floor(slot * 0.66));
    const max = Math.max(...o.spalten.map(s => s.segs.reduce((a, b) => a + b, 0)), 1e-9), k = PH / max, basis = oben + PH;
    o.spalten.forEach((s, i) => {
      const cx = slot * i + slot / 2, x = Math.round(cx - bw / 2);
      const g = sv("g", { class: "dk-klick" + (o.auswahl !== null && o.auswahl !== s.key ? " dk-blass" : "") }, svg);
      let y = basis, ges = 0;
      s.segs.forEach((v, j) => {
        const h = v * k;
        // oberes Segment teilt sich die Trennlinie mit dem unteren (keine doppelte Kontur)
        if (h > 0.5) sv("rect", { x: x + 0.5, y: y - h + 0.5, width: bw - 1, height: Math.max(0, j && ges > 0 ? h : h - 1), fill: o.fuellung[j], stroke: KONTUR, "stroke-width": 1 }, g);
        y -= h; ges += v;
      });
      sv("text", { x: cx, y: y - 5, "text-anchor": "middle" }, g, o.fmt(ges));
      sv("text", { x: cx, y: H - 3, "text-anchor": "middle" }, g, s.label);
      const hit = sv("rect", { x: slot * i, y: 0, width: slot, height: H, fill: "transparent" }, g);
      hit.addEventListener("click", () => o.onClick(s.key));
      tooltip(hit, () => o.tooltip(s, ges));
    });
    sv("line", { x1: 0, x2: W, y1: basis + 0.5, y2: basis + 0.5, stroke: "#8C8C8C", "stroke-width": 1 }, svg);
    return svg;
  }

  /* ---------- Planbalken (weiß mit Kontur bzw. hellgrau mit Kontur) ---------- */
  function balkenPlan(ziel, o) {
    const W = o.breite, n = o.zeilen.length, rh = o.zeilenhoehe, bh = Math.round(rh * 0.62), H = rh * n;
    const svg = sv("svg", { width: W, height: H, role: "img", "aria-label": o.aria }, ziel);
    const lw = Math.ceil(Math.max(...o.zeilen.map(z => DK.tw(z.label)))) + 10;
    const vw = Math.ceil(Math.max(...o.zeilen.map(z => DK.tw(o.fmt(z.wert))))) + 8;
    const max = Math.max(...o.zeilen.map(z => z.wert), 1e-9), pw = W - lw - vw;
    o.zeilen.forEach((z, i) => {
      const y = i * rh, g = sv("g", { class: "dk-klick" + (o.auswahl !== null && o.auswahl !== z.key ? " dk-blass" : "") }, svg);
      sv("text", { x: lw - 10, y: y + rh / 2, dy: "0.35em", "text-anchor": "end" }, g, z.label);
      const bwid = z.wert > 0 ? Math.max(2, z.wert / max * pw) : 0;
      if (bwid) sv("rect", { x: lw + 0.5, y: y + (rh - bh) / 2 + 0.5, width: bwid - 1, height: bh - 1, fill: z.fuellung, stroke: KONTUR, "stroke-width": 1 }, g);
      sv("text", { x: lw + bwid + 5, y: y + rh / 2, dy: "0.35em" }, g, o.fmt(z.wert));
      const hit = sv("rect", { x: 0, y, width: W, height: rh, fill: "transparent" }, g);
      hit.addEventListener("click", () => o.onClick(z.key));
      tooltip(hit, () => o.tooltip(z));
    });
    sv("line", { x1: lw + 0.5, x2: lw + 0.5, y1: 0, y2: H, stroke: "#8C8C8C", "stroke-width": 1 }, svg);
    return svg;
  }

  /* ---------- Botschaften ---------- */
  const passt = (k, breite) => k.find(t => DK.tw(t) <= breite) || k[k.length - 1];
  const liste = a => a.length < 2 ? a.join("") : a.slice(0, -1).join(", ") + " und " + a[a.length - 1];
  function botschaftStellen(d) {
    if (!d.length) return "Keine Planstellen in der Auswahl";
    if (S.ps !== null) {
      const x = d.find(r => r.s.i === S.ps) || d[0];
      return passt([`${x.s.ps} ${x.s.bez}: ${eur(x.pk)} € Personalkosten, ${pz(x.anteil, 0)} der Auswahl`, `${x.s.ps}: ${pz(x.anteil, 0)} der Personalkosten`], 556);
    }
    const top = d.slice().sort((a, b) => b.pk - a.pk)[0];
    return passt([`${top.s.ps} ${top.s.bez} (${zahl(top.s.fte, 2)} FTE, ${zeitraum(top.s)}): ${pz(top.anteil, 0)} der Personalkosten`,
      `${top.s.ps} ${top.s.bez}: ${pz(top.anteil, 0)} der Personalkosten`], 556);
  }
  function botschaftMonat(d) {
    const teile = [];
    const wechsel = d.findIndex((m, i) => i > 0 && Math.abs(m.fte - d[i - 1].fte) > 1e-6);
    if (wechsel > 0) teile.push(`ab ${MNAME[wechsel]} ${fteTxt(d[wechsel].fte)} statt ${fteTxt(d[wechsel - 1].fte)} FTE`);
    const sz = d.filter(m => m.sonder > 0).map(m => MNAME[m.mi]);
    const max = d.slice().sort((a, b) => b.al + b.lnk - a.al - a.lnk)[0];
    const kand = [], gross = t => t.charAt(0).toUpperCase() + t.slice(1);
    if (sz.length && (S.ka === null || S.ka === 2)) {
      kand.push(gross([...teile, `Sonderzahlungen im ${liste(sz)}`].join(", ")), gross([...teile, `Sonderzahlungen ${liste(sz)}`].join(", ")));
      if (!teile.length) teile.push(`Sonderzahlungen im ${liste(sz)}`);
    }
    if (teile.length) kand.push(gross(teile[0]));
    kand.push(`${MNAME[max.mi]} am höchsten: ${tsd(max.al + max.lnk)} Tsd. €`);
    return passt(kand, 408);
  }
  function botschaftKostenart(d) {
    const al = d.filter(x => !x.k.lnk).reduce((s, x) => s + x.wert, 0), lnk = d.filter(x => x.k.lnk).reduce((s, x) => s + x.wert, 0);
    if (al > 0 && lnk > 0) return passt([`Lohnnebenkosten betragen ${pz(lnk / al)} des Anwesenheitslohns`, `Lohnnebenkosten ${pz(lnk / al)} des Anwesenheitslohns`], 408);
    const top = d.slice().sort((a, b) => b.wert - a.wert)[0];
    return top.wert ? `${top.k.name} größte Kostenart (${pz(top.anteil, 0)})` : "Keine Kosten in der Auswahl";
  }

  /* ---------- Datenschnitte ---------- */
  const schnittBez = DK.schnitt(bFilter, "Stellenbezeichnung", "knoepfe", {
    optionen: [["alle", "Alle"], ...BEZ.map(b => [b, b])], wert: "alle",
    onChange: v => { S.bez = v === "alle" ? null : v; if (S.ps !== null && !stelleOk(ST[S.ps])) S.ps = null; zeichnen(); } });
  const schnittVertrag = DK.schnitt(bFilter, "Vertragsart", "knoepfe", {
    optionen: [["alle", "Alle"], ...VERTRAG.map(b => [b, b])], wert: "alle",
    onChange: v => { S.vertrag = v === "alle" ? null : v; if (S.ps !== null && !stelleOk(ST[S.ps])) S.ps = null; zeichnen(); } });
  const setze = (k, v) => { S[k] = S[k] === v ? null : v; zeichnen(); };

  /* ---------- Zeichnen ---------- */
  function zeichnen() {
    [...schnittBez.querySelectorAll("button")].forEach((b, i) => b.setAttribute("aria-pressed", String(i === 0 ? S.bez === null : S.bez === BEZ[i - 1])));
    [...schnittVertrag.querySelectorAll("button")].forEach((b, i) => b.setAttribute("aria-pressed", String(i === 0 ? S.vertrag === null : S.vertrag === VERTRAG[i - 1])));
    const auswahl = [S.ps !== null ? "Planstelle " + ST[S.ps].ps : null, S.monat !== null ? MNAME[S.monat] : null, S.ka !== null ? KA[S.ka].name : null].filter(Boolean);
    DK.kopf(bKopf, { titel: "Planungsauswertung Personalkosten",
      untertitel: `Kostenstelle ${KST} · Plan ${JAHR}, Planversion ${DATA.planversion} · ${auswahl.length ? auswahl.join(", ") : "ganzes Jahr"}`,
      quelle: "Quelle: Personalkostenplanung (Planstellen) · Stand 15.10.2026",
      legende: [[F_AL, "Anwesenheitslohn", KONTUR], [F_LNK, "Lohnnebenkosten", KONTUR]] });

    // KPI-Leiste
    const k = kennzahlen();
    const imJahr = S.monat === null;
    const h1 = k.fm.slice(0, 6).reduce((a, b) => a + b, 0) / 6, h2 = k.fm.slice(6).reduce((a, b) => a + b, 0) / 6;
    DK.kpis(bKpi, [
      { label: imJahr ? "Personalkosten" : `Personalkosten ${MNAME[S.monat]}`, wert: eur(k.pk), einheit: "€",
        bezug: imJahr ? "Ø je Monat" : "Anteil am Jahr", delta: imJahr ? eur(k.pk / 12) + NBSP + "€" : pz(k.pk / Math.max(1, summe(werte("monat"))), 1), klasse: "neutral" },
      { label: "Anwesenheitslohn", wert: eur(k.al), einheit: "€", bezug: "Anteil", delta: k.pk ? pz(k.al / k.pk) : "–", klasse: "neutral" },
      { label: "Lohnnebenkosten", wert: eur(k.lnk), einheit: "€", bezug: "auf Anwesenheitslohn", delta: k.al ? pz(k.lnk / k.al) : "–", klasse: "neutral" },
      { label: imJahr ? "FTE im Jahresmittel" : `FTE ${MNAME[S.monat]}`, wert: fteTxt(k.fte),
        bezug: imJahr ? "1. Hj. | 2. Hj." : "Jahresmittel", delta: imJahr ? `${fteTxt(h1)} | ${fteTxt(h2)}` : fteTxt(k.fm.reduce((a, b) => a + b, 0) / 12), klasse: "neutral" },
      { label: "Personalkosten je FTE", wert: k.fte ? eur(k.pk / k.fte) : "–", einheit: "€",
        bezug: imJahr ? "je Monat" : "Ø Jahr je Monat", delta: jahrJeFte(k), klasse: "neutral" },
    ]);

    // Planstellen (Matrix)
    const ds = stellenDaten();
    const sk = S.sort.key, ab = S.sort.ab ? -1 : 1;
    const wertFuer = { ps: r => r.s.ps, bez: r => r.s.bez, fte: r => r.s.fte, zeit: r => monatVon(r.s.von) * 12 + monatVon(r.s.bis), pk: r => r.pk, anteil: r => r.anteil };
    ds.sort((a, b) => { const x = wertFuer[sk](a), y = wertFuer[sk](b); return (x < y ? -1 : x > y ? 1 : a.s.i - b.s.i) * ab; });
    let f = DK.visual(bStellen, { titel: "Personalkosten nach Planstelle", einheit: "€", botschaft: botschaftStellen(ds) });
    const t = DK.matrix(f.flaeche, {
      spalten: [
        { key: "ps", titel: "Planstelle", breite: 74, id: "m-ps" },
        { key: "bez", titel: "Bezeichnung", breite: 150, typ: "text", id: "m-bez" },
        { key: "fte", titel: "FTE", breite: 48, fmt: v => zahl(v, 2), id: "m-fte" },
        { key: "zeit", titel: "Zeitraum", breite: 80, typ: "text", id: "m-zeit" },
        { key: "pk", titel: "Personalkosten", breite: 100, fmt: v => eur(v), id: "m-pk" },
        { key: "anteil", titel: "Anteil", breite: 108, typ: "anteil", textBreite: 48, id: "m-anteil" },
      ],
      zeilen: ds.map(r => ({ key: r.s.i, label: r.s.ps, werte: { bez: r.s.bez, fte: r.s.fte, zeit: zeitraum(r.s), pk: r.pk, anteil: r.anteil }, r })),
      zeilenhoehe: 32, auswahl: S.ps, onClick: v => setze("ps", v),
      sortierung: S.sort, onSort: key => { S.sort = { key, ab: S.sort.key === key ? !S.sort.ab : !["ps", "bez", "zeit"].includes(key) }; zeichnen(); },
      tooltip: z => { const r = z.r, s = r.s; return [`${s.ps} ${s.bez}`, `${zahl(s.fte, 2)} FTE · ${s.vertrag} · ${s.von}–${s.bis}`,
        `Monatsentgelt ${zahl(s.entgelt, 0)} € je FTE`, `Anwesenheitslohn ${eur(r.al)} € · Lohnnebenkosten ${eur(r.lnk)} €`,
        `Personalkosten ${eur(r.pk)} € · ${pz(r.anteil)}`, "Klick filtert das Dashboard"]; },
    });
    // Anteilsbalken als Planwert: weiß mit Kontur statt gefüllt, Maßstab = größter Anteil (wie „Max automatisch“)
    const maxAnteil = Math.max(...ds.map(r => r.anteil), 1e-9);
    t.querySelectorAll("td.dk-dbalken svg rect").forEach(r => {
      const w = parseFloat(r.getAttribute("width")) / maxAnteil;
      r.setAttribute("x", parseFloat(r.getAttribute("x")) + 0.5); r.setAttribute("y", parseFloat(r.getAttribute("y")) + 0.5);
      r.setAttribute("width", Math.max(0, w - 1)); r.setAttribute("height", 9);
      r.setAttribute("fill", "#FFFFFF"); r.setAttribute("stroke", KONTUR); r.setAttribute("stroke-width", 1);
    });

    // Monatsverlauf
    const dm = monatsDaten();
    f = DK.visual(bMonat, { titel: "Personalkosten nach Monat", einheit: "Tsd. €", botschaft: botschaftMonat(dm) });
    saeulenPlan(f.flaeche, { breite: f.breite, hoehe: f.hoehe, aria: "Personalkosten je Monat, Plan " + JAHR,
      spalten: dm.map(m => ({ key: m.mi, label: m.name, segs: [m.al, m.lnk], m })), fuellung: [F_AL, F_LNK],
      fmt: c => tsd(c), auswahl: S.monat, onClick: v => setze("monat", v),
      tooltip: (s, ges) => { const m = s.m; return [`${MNAME[m.mi]} ${JAHR}`, `Personalkosten ${eur(ges)} €`,
        `Anwesenheitslohn ${eur(m.al)} € · Lohnnebenkosten ${eur(m.lnk)} €`,
        ...(m.sonder ? [`darin Sonderzahlungen ${eur(m.sonder)} € (${m.mi + 1 === P.urlaubsgeld_monat ? "Urlaubsgeld" : "Weihnachtsgeld"})`] : []),
        `FTE ${fteTxt(m.fte)}`, "Klick filtert das Dashboard"]; } });
    f.flaeche.firstChild.id = "svg-monat";

    // Kostenarten
    const dk = kostenartDaten();
    f = DK.visual(bKart, { titel: "Personalkosten nach Kostenart", einheit: "Tsd. €", botschaft: botschaftKostenart(dk) });
    balkenPlan(f.flaeche, { breite: f.breite, zeilenhoehe: 31, aria: "Personalkosten nach Kostenart",
      zeilen: dk.map(x => ({ key: x.k.i, label: x.k.name, wert: x.wert, fuellung: x.k.lnk ? F_LNK : F_AL, x })),
      fmt: c => tsd(c, 1), auswahl: S.ka, onClick: v => setze("ka", v),
      tooltip: z => { const x = z.x; const satz = [`Satz ${zahl(P.zulagen, 1)} % des Grundentgelts`, `Satz ${zahl(P.zulagen, 1)} % des Grundentgelts`,
        `Urlaubsgeld ${zahl(P.urlaubsgeld, 0)} % (Juli), Weihnachtsgeld ${zahl(P.weihnachtsgeld, 0)} % (Nov.)`, `Satz ${zahl(P.sozialabgaben, 1)} % auf Anwesenheitslohn und Sonderzahlungen`];
        return [`${x.k.name} (${x.k.gruppe})`, `${eur(x.wert)} € · ${pz(x.anteil)} der Personalkosten`,
          x.k.i === 0 ? "FTE × Monatsentgelt × Monate" : satz[x.k.i], "Klick filtert das Dashboard"]; } });
    f.flaeche.firstChild.id = "svg-kostenart";
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  /* ---------- Lernplattform: Designregeln, Nachbau, Tabellen, CSV ---------- */
  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "v-monat", anker: "links", versatz: [392, 4], regel: "SAY – Botschaft vermitteln", titel: "Eine Aussage je Visual",
        text: "Unter jedem Titel steht ein Satz aus den Daten – etwa, dass ab Juli 13 statt 9 FTE geplant sind und Juli und November Sonderzahlungen tragen. Das Original überschrieb die Seite nur mit „BEx Adhoc Analyse“ und „IP-HR Kostenstellenplanung periodisch“." },
      { nr: 2, ziel: "kopf-legende", anker: "links", versatz: [-4, -2], regel: "UNIFY – Semantische Notation", titel: "Plan als Umriss",
        text: "Alle Werte sind Planwerte und deshalb weiß mit dunkler Kontur gezeichnet; der Anteil der Lohnnebenkosten ist hellgrau gefüllt – in Säulen und Kostenartenbalken gleich, erklärt einmal im Kopf. Das Original zeigte gelbe Säulen mit der Legende „BAB Personalkosten“." },
      { nr: 3, ziel: "kpis", anker: "links", versatz: [366, 4], regel: "CONDENSE – Verdichten", titel: "Kostenarten-Hierarchie in der KPI-Leiste",
        text: "Personalkosten, Anwesenheitslohn und Lohnnebenkosten stehen als Kennzahlen oben, ergänzt um FTE und Kosten je FTE. Das Original zeigte Personalkosten und Lohnkosten mit demselben Wert (alle Planstellen sind gewerblich) – die Zwischenstufe Lohnkosten entfällt." },
      { nr: 4, ziel: "svg-monat", anker: "links", versatz: [34, 70], regel: "CHECK – Korrekte Skalen", titel: "Werte statt Achse",
        text: "Säulen beginnen bei null und tragen ihren Wert in Tsd. €. Das Original hatte eine Achse 0 … 80000 ohne Tausenderpunkt, Monatsnamen und Legende in sehr kleiner Schrift." },
      { nr: 5, ziel: "m-anteil", versatz: [0, -2], regel: "EXPRESS – Passende Darstellung", titel: "Planstellen mit Anteilsbalken",
        text: "Die Planstellen des Formulars erscheinen mit FTE, Zeitraum, Personalkosten und Anteil; der Balken zeigt sofort, dass die Sammelplanstelle mit 5 FTE ab Juli gut ein Viertel der Kosten trägt. Im Original war die Planstelle nur ein „freies Merkmal“ im Navigationsblock." },
      { nr: 6, ziel: "filter", anker: "links", versatz: [752, 28], regel: "SIMPLIFY – Überflüssiges weglassen", titel: "Ohne Navigationsblock und Knopfleiste",
        text: "Browserrahmen, Reiter (Datenanalyse, Grafische Darstellung, Information …), die Knöpfe View sichern, Bookmark, Variablenbild, Exceptions, Notizen und Export sowie der Navigationsblock Zeilen/Spalten/Freie Merkmale entfallen. Die freien Merkmale werden zu Datenschnitten, der Export zur Ebene „Daten (CSV)“." },
      { nr: 7, ziel: "svg-kostenart", anker: "links", versatz: [262, 39], regel: "STRUCTURE – Inhalte ordnen", titel: "Natürliche Reihenfolge",
        text: "Planstellen in der Folge des Formulars, Monate von Januar bis Dezember, Kostenarten in der Reihenfolge der Rechnung: Grundentgelt, Zulagen, Sonderzahlungen, Sozialabgaben. Anwesenheitslohn und Lohnnebenkosten sind über die Füllung gruppiert." },
      { nr: 8, ziel: "v-stellen", anker: "links", versatz: [482, 400], regel: "CHECK – Stimmige Zahlen", titel: "Dieselben Zahlen wie das Formular",
        text: "Die Auswertung rechnet aus den Planstellen des Planungsformulars (Abb. „Planungsformular Personalkostenplanung“): 789.449 € Personalkosten, 567.072 € Anwesenheitslohn, 222.377 € Lohnnebenkosten, 11,0 FTE im Jahresmittel. Jede Zahl lässt sich dort je Zeile nachvollziehen." },
    ],
    nachbauIntro: "Seitengröße 1024 × 646 px. Schrift Arial: Beschriftungen 10,5 pt, Visualtitel 12 pt, KPI-Werte 19,5 pt. Datenmodell: Faktentabelle Personalkosten (Planstelle, Monat, Kostenart, Betrag) mit den Dimensionen Planstelle (Bezeichnung, Vertragsart, FTE, Monatsentgelt, gültig von/bis), Kalender (Monat) und Kostenart (Kostenart, Kostenartengruppe, Sortierung); FTE je Planstelle und Monat als zweite Faktentabelle.",
    nachbau: [
      { id: "A", ziel: "kpis", anker: "links", versatz: [140, 4], titel: "Kennzahlen", visual: "Karte (neu) mit Referenzbeschriftung",
        felder: "Personalkosten = SUM(Personalkosten[Betrag]); Anwesenheitslohn = CALCULATE([Personalkosten]; Kostenart[Gruppe] = \"Anwesenheitslohn\"); Lohnnebenkosten analog; FTE = DIVIDE(SUM(FTE[FTE]); DISTINCTCOUNT(Kalender[Monat])); Personalkosten je FTE = DIVIDE([Personalkosten]; [FTE])",
        format: "Wert 19,5 pt fett, Referenzbeschriftung 10,5 pt #4D4D4D (Anteil, Zuschlag, Halbjahre)" },
      { id: "B", ziel: "v-stellen", versatz: [0, 0], titel: "Personalkosten nach Planstelle", visual: "Tabelle",
        felder: "Planstelle, Bezeichnung, FTE, Zeitraum (berechnete Spalte aus gültig von/bis), Personalkosten, Anteil = DIVIDE([Personalkosten]; CALCULATE([Personalkosten]; ALLSELECTED(Planstelle)))",
        format: "Datenbalken auf Anteil: Min 0, Max automatisch (größter Anteil), positive Balken #FFFFFF mit Rahmen #3A3F44 (Rahmen über bedingte Formatierung); Zeilenabstand vergrößert, Gitternetz horizontal #EFEFEF",
        hinweis: "Sortierung per Spaltenkopf ist Standard; die Ausgangssortierung nach Planstelle entspricht dem Planungsformular." },
      { id: "C", ziel: "v-monat", versatz: [0, 0], titel: "Personalkosten nach Monat", visual: "Gestapeltes Säulendiagramm",
        felder: "X-Achse: Kalender[Monat]; Y-Achse: Personalkosten; Legende: Kostenart[Gruppe]",
        format: "Farben Anwesenheitslohn #FFFFFF, Lohnnebenkosten #D4D4D4, Rahmen #3A3F44 (Spaltenrahmen ein); Gesamtsummenbeschriftung ein, Anzeigeeinheit Tausend, 0 Dezimalstellen; Y-Achse und Gitternetz aus" },
      { id: "D", ziel: "v-kostenart", versatz: [0, 0], titel: "Personalkosten nach Kostenart", visual: "Gruppiertes Balkendiagramm",
        felder: "Y-Achse: Kostenart (sortiert nach Sortierspalte); X-Achse: Personalkosten",
        format: "Farbe je Kostenart über bedingte Formatierung (Gruppe Anwesenheitslohn #FFFFFF, Lohnnebenkosten #D4D4D4), Rahmen #3A3F44; Datenbeschriftung in Tausend mit 1 Dezimalstelle; X-Achse aus" },
      { id: "E", ziel: "filter", anker: "links", versatz: [162, -2], titel: "Datenschnitte", visual: "Datenschnitt (2×)",
        felder: "Planstelle[Bezeichnung] und Planstelle[Vertragsart] als Kacheln, Einzelauswahl mit „Alle“",
        format: "Ausgewählt #3A3F44 mit weißer Schrift, sonst weiß mit Rahmen #9A9A9A",
        hinweis: "Kreuzfilterung zwischen Tabelle, Säulen und Balken: Standardinteraktion „Filtern“ statt „Hervorheben“ für die jeweils anderen Visuals." },
    ],
    theme: DK.thema(),
    csv: { name: "personalkostenplanung_daten.csv", text: () => {
      const k = ["Planjahr;Kostenstelle;Planstelle;Bezeichnung;Vertragsart;FTE;Monatsentgelt_EUR;Gueltig_von;Gueltig_bis;Monat;Kostenartengruppe;Kostenart;Betrag_EUR"];
      DATA.werte.forEach(([si, mi, ki, c]) => { const s = ST[si];
        k.push([JAHR, KST, s.ps, s.bez, s.vertrag, zahl(s.fte, 2), s.entgelt, s.von, s.bis, `${JAHR}-${String(mi + 1).padStart(2, "0")}`,
          KA[ki].gruppe, KA[ki].name, zahl(c / 100, 2).replace(/\./g, "")].join(";")); });
      return k.join("\r\n"); } },
    tabellen: () => {
      const ds = stellenDaten(), dm = monatsDaten(), dk = kostenartDaten();
      return [
        { titel: "Personalkosten nach Planstelle in €", kopf: ["Planstelle", "Bezeichnung", "Vertragsart", "FTE", "Zeitraum", "Anwesenheitslohn", "Lohnnebenkosten", "Personalkosten", "Anteil"],
          zeilen: ds.map(r => [r.s.ps, r.s.bez, r.s.vertrag, zahl(r.s.fte, 2), zeitraum(r.s), eur(r.al), eur(r.lnk), eur(r.pk), pz(r.anteil)]) },
        { titel: "Personalkosten nach Monat in €", kopf: ["Monat", "Anwesenheitslohn", "Lohnnebenkosten", "darin Sonderzahlungen", "Personalkosten", "FTE"],
          zeilen: dm.map(m => [MNAME[m.mi], eur(m.al), eur(m.lnk), eur(m.sonder), eur(m.al + m.lnk), fteTxt(m.fte)]) },
        { titel: "Personalkosten nach Kostenart in €", kopf: ["Kostenart", "Gruppe", "Personalkosten", "Anteil"],
          zeilen: dk.map(x => [x.k.name, x.k.gruppe, eur(x.wert), pz(x.anteil)]) },
      ];
    },
  });
  zeichnen();
})();
