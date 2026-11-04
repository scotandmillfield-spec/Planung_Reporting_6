/* Einzelvisual „Treemap-Chart“ (Abb. 3.45): Umsatz nach Region, Produktgruppe und Kaufgrund als Treemap.
   Seite 727 x 560 px = 110 x 84,7 mm. Daten wie Abb. 3.44 (treemap.json = sunburst.json): Umsatz je Region,
   Produktgruppe, Kaufgrund und Jahr. Wie im Original drei Ebenen ineinander (Gebiet → Unterkategorie → Produkt);
   Ebenen durch Helligkeit wie im Sunburst: Region mit anthrazitfarbener Kopfzeile, Produktgruppe mit grauer
   Kopfzeile, Kaufgründe hellgrau. Squarified-Layout (größte Felder oben links); die Kopfzeilen sind aus den Flächen
   herausgerechnet, sodass jede hellgraue Fläche maßstabsgetreu dem Umsatz entspricht. Datenschnitte Jahr und Region;
   Klick auf ein Feld hebt dieses Element in allen Regionen hervor. */
(() => {
  "use strict";
  const { zahl, delta, NBSP, sv, el } = DK;
  const JAHRE = DATA.jahre, REG = DATA.regionen, PROD = DATA.produkte, GRUND = DATA.gruende;
  const Z = DATA.zeilen.map(([r, p, g, u]) => ({ r, p, g, u }));
  const NAMEN = [REG, PROD, GRUND];
  const FUELL = ["#3A3F44", "#C9C9C9", "#EFEFEF"], SCHRIFT = ["#FFFFFF", "#1A1A1A", "#1A1A1A"], AUSWAHL = "#8F8F8F";
  const mio = (v, nk = 2) => zahl(v / 1e6, nk);
  const pz = (a, nk = 0) => zahl(a * 100, nk) + NBSP + "%";
  const HR = 22, PR = 3, HP = 19, ZL = 16;        // Kopf Region, Rand Region, Kopf Produktgruppe, Zeilenhöhe Text

  /* ---------- Zustand ---------- */
  const S = { jahr: JAHRE[JAHRE.length - 1], region: "alle", auswahl: null };   // auswahl = { ebene, idx }
  const auswaehlen = (ebene, idx) => {
    S.auswahl = S.auswahl && S.auswahl.ebene === ebene && S.auswahl.idx === idx ? null : { ebene, idx };
    zeichnen();
  };
  addEventListener("keydown", e => { if (e.key === "Escape" && S.auswahl) { S.auswahl = null; zeichnen(); } });

  /* ---------- Layout ---------- */
  DK.init({ titel: "Treemap-Chart", breite: 727, hoehe: 560 });
  const bKopf = DK.box("kopf", 16, 8, 695, 46);
  DK.haarlinie(58);
  const bFilter = DK.box("filter", 16, 64, 695, 50, "dk-filter");
  DK.haarlinie(120);
  const bVis = DK.box("v-treemap", 16, 130, 695, 422);

  /* ---------- Berechnungen ---------- */
  function daten(jahr = S.jahr) {
    const ji = JAHRE.indexOf(jahr);
    const zeilen = Z.filter(z => S.region === "alle" || REG[z.r] === S.region);
    const summe = (f, j = ji) => zeilen.filter(f).reduce((s, z) => s + z.u[j], 0);
    const ges = summe(() => true);
    const knoten = (ebene, pfad) => {
      const f = z => pfad.every((idx, e) => [z.r, z.p, z.g][e] === idx);
      return NAMEN[ebene].map((name, idx) => {
        const p = [...pfad, idx], g = z => f(z) && [z.r, z.p, z.g][ebene] === idx;
        const k = { ebene, idx, name, pfad: p, wert: summe(g), vj: ji > 0 ? summe(g, ji - 1) : null };
        if (ebene < 2) k.kinder = knoten(ebene + 1, p);
        return k;
      }).filter(k => k.wert > 0).sort((a, b) => b.wert - a.wert);   // je Ebene nach Umsatz: größte Felder oben links
    };
    const regionen = knoten(0, []);
    const je = (ebene, idx) => summe(z => [z.r, z.p, z.g][ebene] === idx);
    return { ges, regionen, je };
  }
  const regionText = () => (S.region === "alle" ? "alle Regionen" : S.region);
  const inRegion = r => (r === "Niederlande" ? "in den Niederlanden" : "in " + r);
  const plural = p => p + "s";

  /* ---------- Botschaft ---------- */
  const passt = (kandidaten, breite) => kandidaten.find(t => DK.tw(t) <= breite) || kandidaten[kandidaten.length - 1];
  function botschaft(d, breite) {
    const a = S.auswahl;
    if (a) {
      const name = NAMEN[a.ebene][a.idx], wert = d.je(a.ebene, a.idx);
      const anteil = `${name}: ${mio(wert)} Mio. € = ${pz(wert / d.ges)} des Umsatzes`;
      const k = [];
      let best = null;                     // wo ist der Anteil des Elements an der übergeordneten Ebene am höchsten?
      d.regionen.forEach(r => {
        const eltern = a.ebene === 1 ? [r] : a.ebene === 2 ? r.kinder : [];
        eltern.forEach(e => e.kinder.filter(c => c.idx === a.idx).forEach(c => {
          const q = c.wert / e.wert;
          if (!best || q > best.q) best = { q, wo: a.ebene === 1 ? inRegion(r.name) : `bei ${plural(e.name)} ${inRegion(r.name)}` };
        }));
      });
      if (best && (a.ebene === 2 || d.regionen.length > 1)) {
        const hoch = `am höchsten ${best.wo} (${pz(best.q)})`;
        k.push(`${anteil}, Anteil ${hoch}`, `${name}: ${pz(wert / d.ges)} des Umsatzes, Anteil ${hoch}`);
      }
      if (a.ebene === 0) {
        const r = d.regionen.find(x => x.idx === a.idx), c = r && r.kinder[0];
        if (c) k.push(`${anteil}, größtes Feld ${plural(c.name)} (${pz(c.wert / r.wert)})`);
      }
      k.push(anteil);
      return passt(k, breite);
    }
    // ohne Auswahl: größtes Feld Region x Produktgruppe und Regionen, in denen eine Produktgruppe dominiert
    const felder = d.regionen.flatMap(r => r.kinder.map(p => ({ r, p })));
    const top = felder.sort((x, y) => y.p.wert - x.p.wert)[0];
    if (d.regionen.length === 1) {
      const r = d.regionen[0], p = r.kinder[0];
      const g = GRUND.map((n, i) => ({ n, w: d.je(2, i) })).sort((x, y) => y.w - x.w)[0];
      return passt([`${plural(p.name)} tragen ${pz(p.wert / r.wert)} des Umsatzes ${inRegion(r.name)}, häufigster Kaufgrund ist ${g.n} (${pz(g.w / d.ges)})`,
        `${plural(p.name)} tragen ${pz(p.wert / r.wert)} des Umsatzes ${inRegion(r.name)}`], breite);
    }
    const dom = d.regionen.map(r => ({ r, p: r.kinder[0], q: r.kinder[0].wert / r.wert })).filter(x => x.q >= 0.4)
      .sort((x, y) => y.q - x.q).map(x => `${plural(x.p.name)} ${x.r.name === "Niederlande" ? "die Niederlande" : x.r.name} (${pz(x.q)})`);
    const kopf = `Größtes Feld: ${plural(top.p.name)} ${inRegion(top.r.name)} (${mio(top.p.wert)} Mio. €)`;
    const praegen = t => t.replace(/^(\S+ \S+) /, "$1 prägen ");               // „City Bikes prägen die Niederlande (51 %)“
    const k = [];
    if (dom.length > 1) k.push(`${praegen(dom[0])}, ${dom.slice(1).join(", ")}`);
    if (dom.length) k.push(`${kopf}, ${praegen(dom[0])}`, praegen(dom[0]));
    k.push(kopf);
    return passt(k, breite);
  }

  /* ---------- Treemap (Squarified, Bruls et al.) ---------- */
  function squarify(items, x, y, w, h) {
    const sum = items.reduce((s, it) => s + it.W, 0);
    if (!items.length || sum <= 0 || w <= 0 || h <= 0) { items.forEach(it => (it.rect = { x, y, w: 0, h: 0 })); return; }
    const f = (w * h) / sum, A = items.map(it => it.W * f);
    let rest = items.map((it, i) => ({ it, a: A[i] })), R = { x, y, w, h };
    const schlecht = (zeile, seite) => {
      const s = zeile.reduce((t, z) => t + z.a, 0);
      return Math.max(...zeile.map(z => Math.max((seite * seite * z.a) / (s * s), (s * s) / (seite * seite * z.a))));
    };
    while (rest.length) {
      const seite = Math.min(R.w, R.h);
      let n = 1;
      while (n < rest.length && schlecht(rest.slice(0, n + 1), seite) <= schlecht(rest.slice(0, n), seite)) n++;
      const zeile = rest.slice(0, n), s = zeile.reduce((t, z) => t + z.a, 0);
      if (n === rest.length) {                           // letzte Zeile füllt den Rest exakt
        if (R.w >= R.h) { let yy = R.y; zeile.forEach(z => { const hh = R.h * z.a / s; z.it.rect = { x: R.x, y: yy, w: R.w, h: hh }; yy += hh; }); }
        else { let xx = R.x; zeile.forEach(z => { const ww = R.w * z.a / s; z.it.rect = { x: xx, y: R.y, w: ww, h: R.h }; xx += ww; }); }
      } else if (R.w >= R.h) {                           // Spalte links
        const cw = s / R.h; let yy = R.y;
        zeile.forEach(z => { const hh = z.a / cw; z.it.rect = { x: R.x, y: yy, w: cw, h: hh }; yy += hh; });
        R = { x: R.x + cw, y: R.y, w: R.w - cw, h: R.h };
      } else {                                           // Zeile oben
        const rh = s / R.w; let xx = R.x;
        zeile.forEach(z => { const ww = z.a / rh; z.it.rect = { x: xx, y: R.y, w: ww, h: rh }; xx += ww; });
        R = { x: R.x, y: R.y + rh, w: R.w, h: R.h - rh };
      }
      rest = rest.slice(n);
    }
  }
  const kurzP = n => n.replace(/ Bike$/, "");
  const KURZ = { Mountain: "Mount.", Trekking: "Trek.", "Qualität": "Qual.", Testbericht: "Test", Aktion: "Akt." };
  // Innenflächen: Region ohne Kopf und Rand, Produktgruppe ohne 1-px-Fuge und (wenn sie hineinpasst) ohne Kopfzeile
  const innenR = r => ({ x: r.x + PR, y: r.y + HR, w: Math.max(0, r.w - 2 * PR), h: Math.max(0, r.h - HR - PR) });
  const fuge = r => ({ x: r.x + 1, y: r.y + 1, w: Math.max(0, r.w - 2), h: Math.max(0, r.h - 2) });
  const kopfP = (q, name) => q.h >= HP + 18 && q.w >= DK.tw(KURZ[kurzP(name)] || kurzP(name)) + 10;
  const innenP = (r, name) => { const q = fuge(r), k = kopfP(q, name) ? HP : 0; return { x: q.x, y: q.y + k, w: q.w, h: Math.max(0, q.h - k), kopf: k }; };
  const fl = r => r.w * r.h;

  // Layout mit herausgerechneten Kopfzeilen: Gewicht W = Umsatz + Verwaltungsfläche (Kopf, Rand, Fugen) / c,
  // c = Fläche je €; einige Durchläufe, bis die Kopfflächen zur Form der Felder passen (Fixpunkt).
  function layout(d, B) {
    const T = fl(B), V = d.ges;
    d.regionen.forEach(r => { r.oh = 0; r.kinder.forEach(p => { p.oh = 0; }); });
    for (let lauf = 0; lauf < 8; lauf++) {
      const OH = d.regionen.reduce((s, r) => s + r.oh + r.kinder.reduce((t, p) => t + p.oh, 0), 0);
      const c = (T - OH) / V;
      d.regionen.forEach(r => {
        r.kinder.forEach(p => { p.W = p.wert + p.oh / c; });
        r.W = r.wert + (r.oh + r.kinder.reduce((t, p) => t + p.oh, 0)) / c;
      });
      squarify(d.regionen, B.x, B.y, B.w, B.h);
      d.regionen.forEach(r => {
        const i = innenR(r.rect);
        r.oh = fl(r.rect) - fl(i);
        squarify(r.kinder, i.x, i.y, i.w, i.h);
        r.kinder.forEach(p => {
          p.oh = fl(p.rect) - fl(innenP(p.rect, p.name));
          p.kinder.forEach(g => { g.W = g.wert; });
          const q = innenP(p.rect, p.name);
          squarify(p.kinder, q.x, q.y, q.w, q.h);
        });
      });
    }
    return (T - d.regionen.reduce((s, r) => s + r.oh + r.kinder.reduce((t, p) => t + p.oh, 0), 0)) / V;  // Fläche je €
  }

  /* ---------- Zeichnen der Treemap ---------- */
  const tip = document.querySelector(".dk-tooltip");          // von DK.init angelegt
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
  function tipZeilen(k, eltern, d) {
    const z = [[...eltern.map(e => e.name), k.name].join(" · "),
      `Umsatz ${S.jahr}: ${mio(k.wert)} Mio. € · Anteil am Umsatz ${pz(k.wert / d.ges, 1)}`];
    if (eltern.length) z.push(`Anteil an ${eltern[eltern.length - 1].name}: ${pz(k.wert / eltern[eltern.length - 1].wert, 1)}`);
    if (k.vj) z.push(`Vorjahr ${mio(k.vj)} Mio. € · ΔVJ ${delta((k.wert / k.vj - 1) * 100, 1, NBSP + "%")}`);
    z.push(k.ebene === 0 ? "Klick hebt die Region hervor" : `Klick hebt ${k.name} in allen Regionen hervor`);
    return z;
  }
  // Text links oben in ein Feld setzen; Varianten von lang nach kurz, nur was ganz hineinpasst
  function beschriften(g, r, varianten, farbe) {
    for (const zeilen of varianten) {
      const w = Math.max(...zeilen.map(t => DK.tw(t))) + 10;
      if (w <= r.w && zeilen.length * ZL + 6 <= r.h) {
        const t = sv("text", { x: r.x + 5, y: r.y + 3 + ZL / 2, dy: "0.35em", style: `fill:${farbe};pointer-events:none` }, g);
        zeilen.forEach((z, j) => sv("tspan", { x: r.x + 5, dy: j ? ZL : 0 }, t, z));
        return t;
      }
    }
    return null;
  }
  // Kopfzeile: Name links (erste Variante, die passt), Wert rechtsbündig, wenn daneben noch Platz ist
  function kopfzeile(g, r, namen, werte, farbe, fett) {
    const n = namen.find(t => DK.tw(t, 14, fett) + 10 <= r.w);
    if (!n) return;
    const y = r.y + r.h / 2;
    sv("text", { x: r.x + 5, y, dy: "0.35em", style: `fill:${farbe};pointer-events:none${fett ? ";font-weight:bold" : ""}` }, g, n);
    const w = werte.find(t => DK.tw(n, 14, fett) + DK.tw(t) + 22 <= r.w);
    if (w) sv("text", { x: r.x + r.w - 5, y, dy: "0.35em", "text-anchor": "end", style: `fill:${farbe};pointer-events:none` }, g, w);
  }
  function treemap(ziel, d, breite, hoehe) {
    ziel.textContent = "";
    const svg = sv("svg", { width: breite, height: hoehe, role: "img",
      "aria-label": `Treemap: Umsatz ${S.jahr} nach Region, Produktgruppe und Kaufgrund` }, ziel);
    layout(d, { x: 0, y: 0, w: breite, h: hoehe });
    const a = S.auswahl;
    const blass = k => a && k.ebene >= a.ebene && k.pfad[a.ebene] !== a.idx;
    const gewaehlt = k => a && k.ebene === a.ebene && k.idx === a.idx;
    const ebeneG = [sv("g", { id: "tm-regionen" }, svg), sv("g", { id: "tm-produkte" }, svg), sv("g", { id: "tm-kaufgruende" }, svg)];
    d.regionen.forEach(r => {
      // Region: anthrazitfarbene Fläche, sichtbar als Kopfzeile, Rand und Fugen; weiße Trennlinie zwischen Regionen
      const gr = sv("g", { class: "dk-klick" + (blass(r) ? " dk-blass" : ""), "data-ebene": 0, "data-name": r.name }, ebeneG[0]);
      const rr = r.rect;
      const pr = sv("rect", { x: rr.x, y: rr.y, width: rr.w, height: rr.h, fill: FUELL[0], stroke: "#FFFFFF", "stroke-width": 3 }, gr);
      pr.addEventListener("click", () => auswaehlen(0, r.idx));
      tooltip(pr, () => tipZeilen(r, [], d));
      kopfzeile(gr, { x: rr.x + 1.5, y: rr.y + 1.5, w: rr.w - 3, h: HR - 1.5 }, [r.name],
        [`${mio(r.wert, 1)} Mio. € · ${pz(r.wert / d.ges)}`, pz(r.wert / d.ges)], SCHRIFT[0], true);
      r.kinder.forEach(p => {
        const gp = sv("g", { class: "dk-klick" + (blass(p) ? " dk-blass" : ""), "data-ebene": 1, "data-name": p.name }, ebeneG[1]);
        const q = fuge(p.rect), innen = innenP(p.rect, p.name);
        const fp = sv("rect", { x: q.x, y: q.y, width: q.w, height: q.h, fill: gewaehlt(p) ? AUSWAHL : FUELL[1] }, gp);
        fp.addEventListener("click", () => auswaehlen(1, p.idx));
        tooltip(fp, () => tipZeilen(p, [r], d));
        if (innen.kopf) {
          const n = kurzP(p.name);
          kopfzeile(gp, { x: q.x, y: q.y, w: q.w, h: HP }, KURZ[n] ? [n, KURZ[n]] : [n], [mio(p.wert)], SCHRIFT[1], false);
        }
        p.kinder.forEach(g => {
          const gg = sv("g", { class: "dk-klick" + (blass(g) ? " dk-blass" : ""), "data-ebene": 2, "data-name": g.name }, ebeneG[2]);
          const gr2 = g.rect;
          const fg = sv("rect", { x: gr2.x, y: gr2.y, width: gr2.w, height: gr2.h, fill: gewaehlt(g) ? AUSWAHL : FUELL[2],
            stroke: "#FFFFFF", "stroke-width": 1 }, gg);
          fg.addEventListener("click", () => auswaehlen(2, g.idx));
          tooltip(fg, () => tipZeilen(g, [r, p], d));
          const n = g.name, kurz = KURZ[n] || n, w = mio(g.wert);
          beschriften(gg, gr2, [[n, w], [kurz, w], [n], [kurz]], SCHRIFT[2]);
        });
      });
    });
  }

  /* ---------- Datenschnitte, Summe und Legende ---------- */
  DK.schnitt(bFilter, "Jahr", "knoepfe", {
    optionen: JAHRE.map(y => [y, String(y)]), wert: S.jahr,
    onChange: v => { S.jahr = Number(v); S.auswahl = null; zeichnen(); } });
  DK.schnitt(bFilter, "Region", "dropdown", {
    breite: 170, optionen: [["alle", "Alle Regionen"], ...REG.map(r => [r, r])], wert: S.region,
    onChange: v => { S.region = v; S.auswahl = null; zeichnen(); } });
  const rechts = el("div", { class: "dk-rechts", style: "display:flex;flex-direction:column;align-items:flex-end;gap:9px" }, bFilter);
  const gesamt = el("div", { id: "tm-gesamt", class: "dk-quelle" }, rechts);
  const lg = el("div", { id: "tm-legende", class: "dk-legende" }, rechts);
  [["Region", 0], ["Produktgruppe", 1], ["Kaufgrund", 2]].forEach(([t, i]) => {
    const s = el("span", {}, lg);
    el("i", { style: `background:${FUELL[i]};${i === 2 ? "outline:1px solid #9A9A9A;outline-offset:-1px" : ""}` }, s);
    s.appendChild(document.createTextNode(t));
  });

  /* ---------- Zeichnen ---------- */
  function zeichnen() {
    const d = daten();
    const vj = S.jahr > JAHRE[0] ? `, VJ ${S.jahr - 1}` : "";
    DK.kopf(bKopf, { titel: "Umsatz nach Region, Produktgruppe, Kaufgrund",
      untertitel: `Ist ${S.jahr}${vj}, Mio. € · ` + botschaft(d, 695 - 130), quelle: "", legende: [] });
    const ut = bKopf.querySelector(".dk-untertitel");           // Zeile unter dem Titel: bei langer Aussage kleiner setzen, nie umbrechen
    ut.style.whiteSpace = "nowrap";
    for (let px = 14; px > 9 && ut.getBoundingClientRect().width > bKopf.clientWidth; px -= 0.5) ut.style.fontSize = px + "px";
    gesamt.textContent = "";
    gesamt.appendChild(document.createTextNode(`Umsatz ${S.jahr}${S.region === "alle" ? "" : " " + S.region}: `));
    el("b", { style: "color:#1A1A1A" }, gesamt, `${mio(d.ges, 1)} Mio. €`);
    bVis.textContent = "";
    treemap(bVis, d, bVis.clientWidth, bVis.clientHeight);
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  /* ---------- Lernplattform: Designregeln, Nachbau, Tabellen, CSV ---------- */
  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "kopf", anker: "links", versatz: [552, 1], regel: "SAY – Botschaft vermitteln", titel: "Kernaussage unter dem Titel",
        text: "Unter dem Titel steht in einem Satz, was die Treemap zeigt – das größte Feld und die Regionen, die eine Produktgruppe prägt; nach einem Klick die Aussage zum gewählten Element. Das Original hatte nur die Überschrift „Categorized Sales by Territory“." },
      { nr: 2, ziel: "tm-legende", anker: "links", versatz: [-30, 4], regel: "UNIFY – Semantische Notation", titel: "Helligkeit je Ebene statt Farbe je Gebiet",
        text: "Wie im Sunburst (Abb. 3.44) zeigt die Helligkeit die Ebene: Regionen mit anthrazitfarbener, Produktgruppen mit grauer Kopfzeile, Kaufgründe hellgrau. Das Original färbte jedes der neun Gebiete anders – Farben, die im Buch für Szenarien und Abweichungen reserviert sind. Beide Abbildungen zeigen dieselben Daten, so lassen sich die Diagrammtypen vergleichen." },
      { nr: 3, ziel: "tm-gesamt", anker: "links", versatz: [-30, 2], regel: "SIMPLIFY – Überflüssiges weglassen", titel: "Legende der Gebiete entfällt",
        text: "Die Namen stehen in den Feldern; die Farblegende mit neun Gebieten unter dem Diagramm entfällt. Übrig bleibt die Legende der drei Ebenen und der Gesamtumsatz, auf den sich alle Flächen beziehen." },
      { nr: 4, ziel: "tm-regionen", anker: "links", versatz: [117, 82], regel: "STRUCTURE – Inhalte ordnen", titel: "Größte Felder oben links",
        text: "Auf jeder Ebene sind die Felder nach Umsatz geordnet: Die größte Region steht oben links, darin die größte Produktgruppe, darin der häufigste Kaufgrund. So liest man von groß nach klein, und die Felder bleiben möglichst quadratisch." },
      { nr: 5, ziel: "tm-kaufgruende", anker: "links", versatz: [70, 120], regel: "EXPRESS – Lesbar beschriften", titel: "Name und Wert im Feld",
        text: "Jedes Feld nennt Namen und Umsatz, sofern beides waagerecht hineinpasst; die Regionen zusätzlich ihren Anteil. Im Original verdeckten sich Beschriftungen („Northeast“ unter „Road Bikes“), Werte gab es nur im Tooltip. Kleine Felder nennen ihre Werte im Tooltip." },
      { nr: 6, ziel: "tm-produkte", anker: "links", versatz: [344, 50], regel: "CHECK – Visuelle Integrität", titel: "Fläche entspricht dem Umsatz",
        text: "Die Kopfzeilen sind aus den Flächen herausgerechnet: Jede hellgraue Fläche ist maßstabsgetreu zum Umsatz, über alle Regionen hinweg. Flächen lassen sich trotzdem schlechter vergleichen als Längen – genaue Werte zeigen Tooltip und „Werte als Tabelle“; für Rangfolgen ist ein Balkendiagramm besser." },
      { nr: 7, ziel: "filter", anker: "links", versatz: [325, -2], regel: "CONDENSE – Filtern und hervorheben", titel: "Datenschnitte und Klick",
        text: "Jahr und Region filtern die Treemap; mit einer Region füllt sie die ganze Fläche (Drilldown). Ein Klick auf ein Feld hebt dieses Element in allen Regionen hervor – etwa den Kaufgrund Preis in allen Produktgruppen –, die übrigen Felder werden blasser. Esc hebt die Auswahl auf." },
    ],
    nachbauIntro: "Seitengröße benutzerdefiniert 727 × 560 px. Schrift Arial: Beschriftungen 10,5 pt, Titel 16,5 pt. Die Treemap ist in Power BI ein Standardvisual (wie in Excel: Einfügen › Hierarchiediagramm › Treemap). Datenmodell: Tabelle Umsatz (Region, Produktgruppe, Kaufgrund, Jahr, Umsatz) wie in der CSV-Datei.",
    nachbau: [
      { id: "A", ziel: "v-treemap", versatz: [0, 0], titel: "Treemap", visual: "Treemap (Standardvisual)",
        felder: "Kategorie: Region; Details: Produktgruppe; Werte: Umsatz; Kaufgrund über die Hierarchie Region › Produktgruppe › Kaufgrund in Kategorie und Drilldown",
        format: "Datenfarben aller Regionen #C9C9C9 (Kategorie-Beschriftung zeigt die Region), Trennlinien weiß; Legende aus; Datenbeschriftungen ein, Anzeigeeinheit Millionen, 2 Dezimalstellen",
        hinweis: "Kopfzeilen je Region und Helligkeit je Ebene sind in Power BI nicht einstellbar; die Treemap zeigt zwei Ebenen gleichzeitig (Kategorie und Details), die dritte über Drilldown. Herausgerechnete Kopfzeilen entfallen dort, weil Power BI keine Kopfzeilen zeichnet." },
      { id: "B", ziel: "tm-gesamt", anker: "links", versatz: [-30, 2], titel: "Gesamtumsatz", visual: "Karte (neu)",
        felder: "Measure Umsatz = SUM(Umsatz[Umsatz])", format: "Ohne Hintergrund und Rahmen; Anzeigeeinheit Millionen, 1 Dezimalstelle" },
      { id: "C", ziel: "filter", anker: "links", versatz: [124, -2], titel: "Datenschnitte", visual: "Datenschnitt (2×)",
        felder: "Jahr als Kacheln (Einzelauswahl), Region als Dropdown",
        format: "Ausgewählt #3A3F44 mit weißer Schrift, sonst weiß mit Rahmen #9A9A9A" },
      { id: "D", ziel: "kopf", anker: "links", versatz: [552, 1], titel: "Kernaussage", visual: "Textfeld mit dynamischem Wert",
        felder: "Text-Measure mit TOPN(1; SUMMARIZE(Umsatz; Umsatz[Region]; Umsatz[Produktgruppe]); [Umsatz]) für das größte Feld und DIVIDE für den Anteil", format: "10,5 pt, #4D4D4D" },
    ],
    theme: DK.thema(),
    csv: { name: "treemap_umsatz_daten.csv", text: () => {
      const k = ["Region;Produktgruppe;Kaufgrund;Jahr;Umsatz_EUR"];
      Z.forEach(z => JAHRE.forEach((y, i) => k.push([REG[z.r], PROD[z.p], GRUND[z.g], y, z.u[i]].join(";"))));
      return k.join("\r\n"); } },
    tabellen: () => {
      const d = daten(), tsd = v => zahl(v / 1000, 0);
      const zeilen = [];
      d.regionen.forEach(r => r.kinder.forEach(p =>
        zeilen.push([r.name, p.name, ...GRUND.map((_, gi) => { const c = p.kinder.find(x => x.idx === gi); return c ? tsd(c.wert) : "–"; }), tsd(p.wert)])));
      zeilen.push(["Summe", "", ...GRUND.map((_, gi) => tsd(d.je(2, gi))), tsd(d.ges)]);
      return [{ titel: `Umsatz ${S.jahr}, ${regionText()} (Tsd. €)`, kopf: ["Region", "Produktgruppe", ...GRUND, "Summe"], zeilen }];
    },
  });
  zeichnen();
})();
