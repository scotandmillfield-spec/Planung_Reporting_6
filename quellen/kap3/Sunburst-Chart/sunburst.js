/* Einzelvisual „Sunburst-Chart“ (Abb. 3.44): Umsatz nach Region, Produktgruppe und Kaufgrund als Sunburst.
   Seite 727 x 600 px = 110 x 90,8 mm. Daten: sunburst.json (daten_sunburst.py) – Umsatz je Region, Produktgruppe,
   Kaufgrund und Jahr. Wie im Original drei Ringe von innen nach außen; die Ebene Kategorie mit nur einem Element
   („Bikes“) entfällt. Ebenen durch Helligkeit unterschieden statt Farbe je Gebiet, waagerechte Beschriftung nur dort,
   wo sie ins Segment passt, Gesamtumsatz in der Mitte. Datenschnitte Jahr und Region; Klick auf ein Segment hebt
   dieses Element in allen Regionen hervor (z. B. den Kaufgrund Preis in allen Produktgruppen). */
(() => {
  "use strict";
  const { zahl, delta, NBSP, sv, el } = DK;
  const JAHRE = DATA.jahre, REG = DATA.regionen, PROD = DATA.produkte, GRUND = DATA.gruende;
  const Z = DATA.zeilen.map(([r, p, g, u]) => ({ r, p, g, u }));
  const NAMEN = [REG, PROD, GRUND], EBENE = ["Region", "Produktgruppe", "Kaufgrund"];
  const FUELL = ["#3A3F44", "#C9C9C9", "#EFEFEF"], SCHRIFT = ["#FFFFFF", "#1A1A1A", "#1A1A1A"];
  const mio = v => zahl(v / 1e6, 1);
  const pz = (a, nk = 0) => zahl(a * 100, nk) + NBSP + "%";
  const TAU = 2 * Math.PI;

  /* ---------- Zustand ---------- */
  const S = { jahr: JAHRE[JAHRE.length - 1], region: "alle", auswahl: null };   // auswahl = { ebene, idx }
  const auswaehlen = (ebene, idx) => {
    S.auswahl = S.auswahl && S.auswahl.ebene === ebene && S.auswahl.idx === idx ? null : { ebene, idx };
    zeichnen();
  };
  addEventListener("keydown", e => { if (e.key === "Escape" && S.auswahl) { S.auswahl = null; zeichnen(); } });

  /* ---------- Layout ---------- */
  DK.init({ titel: "Sunburst-Chart", breite: 727, hoehe: 600 });
  const bFilter = DK.box("filter", 16, 8, 695, 50, "dk-filter");
  DK.haarlinie(66);
  const bVis = DK.box("v-sunburst", 16, 76, 695, 516);

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
      }).filter(k => k.wert > 0);
    };
    const regionen = knoten(0, []).sort((a, b) => b.wert - a.wert);   // Regionen nach Umsatz, darunter feste Reihenfolge
    // je Element der Ebenen 1 und 2 die Summe über alle Regionen (für Botschaft und Tabellen)
    const je = (ebene, idx) => summe(z => [z.r, z.p, z.g][ebene] === idx);
    return { ges, regionen, je };
  }
  const regionText = () => (S.region === "alle" ? "alle Regionen" : S.region);

  /* ---------- Botschaft ---------- */
  const passt = (kandidaten, breite) => kandidaten.find(t => DK.tw(t) <= breite) || kandidaten[kandidaten.length - 1];
  const ART = { Preis: "der", "Qualität": "die", Marke: "die", Aktion: "die", Testbericht: "der" };
  const inRegion = r => (r === "Niederlande" ? "in den Niederlanden" : "in " + r);
  function botschaft(d, breite) {
    const a = S.auswahl;
    if (a) {
      const name = NAMEN[a.ebene][a.idx], wert = d.je(a.ebene, a.idx);
      const k = [];
      // wo ist der Anteil des Elements an der übergeordneten Ebene am höchsten?
      let best = null;
      d.regionen.forEach(r => {
        const eltern = a.ebene === 1 ? [r] : a.ebene === 2 ? r.kinder : [];
        eltern.forEach(e => e.kinder.filter(c => c.idx === a.idx).forEach(c => {
          const q = c.wert / e.wert;
          if (!best || q > best.q) best = { q, wo: a.ebene === 1 ? inRegion(r.name) : `bei ${e.name}s ${inRegion(r.name)}` };
        }));
      });
      const anteil = `${name}: ${mio(wert)} Mio. € = ${pz(wert / d.ges)} des Umsatzes`;
      if (best && (a.ebene === 2 || d.regionen.length > 1)) {
        const hoch = `am höchsten ${best.wo} (${pz(best.q)})`;
        k.push(`${anteil}, Anteil ${hoch}`, `${name}: ${pz(wert / d.ges)} des Umsatzes, Anteil ${hoch}`);
      }
      if (a.ebene === 0) {
        const r = d.regionen.find(x => x.idx === a.idx), c = r && r.kinder.slice().sort((u, v) => v.wert - u.wert)[0];
        if (c) k.push(`${anteil}, größte Produktgruppe ${c.name} (${pz(c.wert / r.wert)})`);
        k.push(anteil);
      }
      k.push(`${anteil} (${regionText()})`, anteil);
      return passt(k, breite);
    }
    const ji = JAHRE.indexOf(S.jahr), inFilter = z => S.region === "alle" || REG[z.r] === S.region;
    const g = GRUND.map((n, i) => ({ n, w: d.je(2, i) })).sort((x, y) => y.w - x.w)[0];
    const abw = [];
    PROD.forEach((p, pi) => {
      const top = GRUND.map((n, gi) => ({ n, w: Z.filter(z => z.p === pi && z.g === gi && inFilter(z)).reduce((s, z) => s + z.u[ji], 0) }))
        .sort((x, y) => y.w - x.w)[0];
      if (top.w > 0 && top.n !== g.n) abw.push(`bei ${p}s ${ART[top.n]} ${top.n}`);
    });
    const k = [], kopf = `${g.n} ist der häufigste Kaufgrund (${pz(g.w / d.ges)})`;
    if (abw.length) k.push(`${kopf}, ${abw.join(", ")}`);
    if (abw.length > 1) k.push(`${kopf}, ${abw[0]}`);
    k.push(kopf);
    return passt(k, breite);
  }

  /* ---------- Sunburst ---------- */
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
  const P = (cx, cy, r, a) => [cx + r * Math.sin(a), cy - r * Math.cos(a)];      // a im Uhrzeigersinn ab 12 Uhr
  function sektor(cx, cy, r0, r1, a0, a1) {
    if (a1 - a0 >= TAU - 1e-6) {                       // geschlossener Ring
      const [x0, y0] = P(cx, cy, r1, 0), [x1, y1] = P(cx, cy, r1, Math.PI);
      const [x2, y2] = P(cx, cy, r0, 0), [x3, y3] = P(cx, cy, r0, Math.PI);
      return `M${x0},${y0}A${r1},${r1} 0 1 1 ${x1},${y1}A${r1},${r1} 0 1 1 ${x0},${y0}Z` +
             `M${x2},${y2}A${r0},${r0} 0 1 0 ${x3},${y3}A${r0},${r0} 0 1 0 ${x2},${y2}Z`;
    }
    const gross = a1 - a0 > Math.PI ? 1 : 0;
    const [ax, ay] = P(cx, cy, r1, a0), [bx, by] = P(cx, cy, r1, a1), [c_x, c_y] = P(cx, cy, r0, a1), [dx, dy] = P(cx, cy, r0, a0);
    return `M${ax},${ay}A${r1},${r1} 0 ${gross} 1 ${bx},${by}L${c_x},${c_y}A${r0},${r0} 0 ${gross} 0 ${dx},${dy}Z`;
  }
  // Lage für einen waagerechten Textblock w x h im Sektor: geprüft werden Ecken und Kantenmitten mit Abstand zum Rand.
  // Gesucht wird ab der Mitte des Sektors nach beiden Seiten; nahe 12 und 6 Uhr passt waagerechter Text am besten.
  function lage(cx, cy, r0, r1, a0, a1, w, h) {
    const voll = a1 - a0 >= TAU - 1e-6;
    const passtBei = (am, rm) => {
      const [mx, my] = P(cx, cy, rm, am);
      const ok = [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2], [0, -h / 2], [0, h / 2], [-w / 2, 0], [w / 2, 0]]
        .every(([ddx, ddy]) => {
          const x = mx + ddx - cx, y = my + ddy - cy, r = Math.hypot(x, y);
          if (r < r0 + 3 || r > r1 - 3) return false;
          if (voll) return true;
          let a = Math.atan2(x, -y);
          while (a < a0) a += TAU;
          while (a > a0 + TAU) a -= TAU;
          return a >= a0 + 3 / r && a <= a1 - 3 / r;
        });
      return ok ? [mx, my] : null;
    };
    const mitte = voll ? 0 : (a0 + a1) / 2, spanne = voll ? Math.PI : (a1 - a0) / 2, schritt = Math.PI / 90;
    const dr = (r1 - r0) * 0.12, radien = [(r0 + r1) / 2, (r0 + r1) / 2 - dr, (r0 + r1) / 2 + dr];
    for (let i = 0; i * schritt <= spanne; i++) {
      for (const am of i ? [mitte - i * schritt, mitte + i * schritt] : [mitte]) {
        for (const rm of radien) { const m = passtBei(am, rm); if (m) return m; }
      }
    }
    return null;
  }
  function etikett(k, d) {
    if (k.ebene === 0) return [[k.name, pz(k.wert / d.ges)], [k.name]];
    if (k.ebene === 1) return [[k.name.replace(/ Bike$/, "")]];        // Produktgruppen kurz: City, Mountain …
    return [[k.name]];
  }
  // Segmente mit Winkeln; start = Drehung des Diagramms (0 = Beginn bei 12 Uhr)
  function segmente(d, start) {
    const out = [];
    const geh = (k, a0, a1, eltern) => {
      out.push({ k, a0, a1, eltern });
      if (k.kinder) {
        let w0 = a0;
        k.kinder.forEach(c => { const w1 = w0 + (a1 - a0) * c.wert / k.wert; geh(c, w0, w1, [...eltern, k]); w0 = w1; });
      }
    };
    let a0 = start;
    d.regionen.forEach(r => { const a1 = a0 + TAU * r.wert / d.ges; geh(r, a0, a1, []); a0 = a1; });
    return out;
  }
  // Beschriftung je Segment: erste Variante, die waagerecht ins Segment passt
  function beschriften(segs, cx, cy, RAD, d) {
    return segs.map(s => {
      for (const zeilen of etikett(s.k, d)) {
        const w = Math.max(...zeilen.map(t => DK.tw(t))) + 2, h = zeilen.length * 16;
        const m = lage(cx, cy, RAD[s.k.ebene], RAD[s.k.ebene + 1], s.a0, s.a1, w, h);
        if (m) return { zeilen, m };
      }
      return null;
    });
  }
  function sunburst(ziel, d, breite, hoehe) {
    ziel.textContent = "";
    const svg = sv("svg", { width: breite, height: hoehe, role: "img",
      "aria-label": `Sunburst: Umsatz ${S.jahr} nach Region, Produktgruppe und Kaufgrund` }, ziel);
    const R3 = Math.min(hoehe / 2 - 4, 232), cx = breite / 2, cy = hoehe / 2;
    const RAD = [R3 * 0.20, R3 * 0.54, R3 * 0.77, R3];
    // Drehung so wählen, dass möglichst viele Namen waagerecht passen (Regionen zuerst); bei Gleichstand 12 Uhr
    let best = null;
    for (let grad = 0; grad < 360; grad += 15) {
      const segs = segmente(d, grad * Math.PI / 180), lab = beschriften(segs, cx, cy, RAD, d);
      const wert = lab.reduce((s, l, i) => s + (l ? [1000, 30, 1][segs[i].k.ebene] + (l.zeilen.length > 1 ? 300 : 0) : 0), 0);
      if (!best || wert > best.wert) best = { wert, segs, lab };
    }
    const a = S.auswahl;
    const blass = k => a && k.ebene >= a.ebene && k.pfad[a.ebene] !== a.idx;
    const gewaehlt = k => a && k.ebene >= a.ebene && k.pfad[a.ebene] === a.idx;
    const fuell = k => (gewaehlt(k) && k.ebene > 0 ? "#8F8F8F" : FUELL[k.ebene]);   // Auswahl in den hellen Ringen dunkler
    const ringe = sv("g", { id: "sb-ringe" }, svg), texte = sv("g", { id: "sb-texte" }, svg);
    best.segs.forEach(({ k, a0, a1, eltern }, i) => {
      const g = sv("g", { class: "dk-klick" + (blass(k) ? " dk-blass" : "") }, ringe);
      const p = sv("path", { d: sektor(cx, cy, RAD[k.ebene], RAD[k.ebene + 1], a0, a1), fill: fuell(k),
        stroke: "#FFFFFF", "stroke-width": 1.5, "data-ebene": k.ebene, "data-name": k.name }, g);
      p.addEventListener("click", () => auswaehlen(k.ebene, k.idx));
      tooltip(p, () => {
        const z = [[...eltern.map(e => e.name), k.name].join(" · "),
          `Umsatz ${S.jahr}: ${zahl(k.wert / 1e6, 2)} Mio. € · Anteil am Umsatz ${pz(k.wert / d.ges, 1)}`];
        if (eltern.length) z.push(`Anteil an ${eltern[eltern.length - 1].name}: ${pz(k.wert / eltern[eltern.length - 1].wert, 1)}`);
        if (k.vj) z.push(`Vorjahr ${zahl(k.vj / 1e6, 2)} Mio. € · ΔVJ ${delta((k.wert / k.vj - 1) * 100, 1, NBSP + "%")}`);
        z.push(k.ebene === 0 ? "Klick hebt die Region hervor" : `Klick hebt ${k.name} in allen Regionen hervor`);
        return z;
      });
      const l = best.lab[i];
      if (l) {
        const t = sv("text", { x: l.m[0], y: l.m[1] - (l.zeilen.length - 1) * 8, "text-anchor": "middle", dy: "0.35em",
          class: blass(k) ? "dk-blass" : "", style: `fill:${SCHRIFT[k.ebene]};pointer-events:none` }, texte);
        l.zeilen.forEach((z, j) => sv("tspan", { x: l.m[0], dy: j ? 16 : 0 }, t, z));
      }
    });
    // Mitte: Gesamtumsatz
    const m = sv("g", { id: "sb-mitte" }, svg);
    sv("text", { x: cx, y: cy - 9, "text-anchor": "middle", dy: "0.35em", class: "muted" }, m, `Umsatz ${S.jahr}`);
    sv("text", { x: cx, y: cy + 10, "text-anchor": "middle", dy: "0.35em", style: "font-weight:bold" }, m, `${mio(d.ges)} Mio. €`);
    // Legende der Ebenen (Helligkeit von innen nach außen)
    const lg = sv("g", { id: "sb-legende" }, svg), lx = breite - 150;
    ["Region (innen)", "Produktgruppe", "Kaufgrund (außen)"].forEach((t, i) => {
      sv("rect", { x: lx, y: 4 + i * 22, width: 12, height: 12, fill: FUELL[i], stroke: i === 2 ? "#9A9A9A" : "none" }, lg);
      sv("text", { x: lx + 18, y: 10 + i * 22, dy: "0.35em", class: "muted" }, lg, t);
    });
  }

  /* ---------- Datenschnitte ---------- */
  DK.schnitt(bFilter, "Jahr", "knoepfe", {
    optionen: JAHRE.map(y => [y, String(y)]), wert: S.jahr,
    onChange: v => { S.jahr = Number(v); S.auswahl = null; zeichnen(); } });
  DK.schnitt(bFilter, "Region", "dropdown", {
    breite: 170, optionen: [["alle", "Alle Regionen"], ...REG.map(r => [r, r])], wert: S.region,
    onChange: v => { S.region = v; S.auswahl = null; zeichnen(); } });

  /* ---------- Zeichnen ---------- */
  function zeichnen() {
    const d = daten();
    const v = DK.visual(bVis, { titel: `Umsatz ${S.jahr} nach Region, Produktgruppe und Kaufgrund`, einheit: "Mio. €",
      botschaft: botschaft(d, bVis.clientWidth || 695) });
    sunburst(v.flaeche, d, v.breite, v.hoehe);
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  /* ---------- Lernplattform: Designregeln, Nachbau, Tabellen, CSV ---------- */
  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "v-sunburst", anker: "links", versatz: [552, 1], regel: "SAY – Botschaft vermitteln", titel: "Kernaussage unter dem Titel",
        text: "Unter dem Titel steht in einem Satz, was das Diagramm zeigt – den häufigsten Kaufgrund und wo andere Gründe überwiegen; nach einem Klick die Aussage zum gewählten Element. Das Original hatte nur die Überschrift „Categorized Sales by Territory, with sales reason“." },
      { nr: 2, ziel: "sb-legende", anker: "links", versatz: [-30, 4], regel: "UNIFY – Semantische Notation", titel: "Helligkeit je Ebene statt Farbe je Gebiet",
        text: "Die Ringe sind von innen nach außen von Anthrazit nach Hellgrau abgestuft; die Ebene erkennt man an der Helligkeit, das Element an der Beschriftung. Das Original färbte jedes Gebiet anders (sieben Blau-, Gelb- und Rottöne) – Farben, die im Buch für Szenarien und Abweichungen reserviert sind." },
      { nr: 3, ziel: "sb-legende", anker: "links", versatz: [-14, 50], regel: "SIMPLIFY – Überflüssiges weglassen", titel: "Ebene „Bikes“ entfällt",
        text: "Die Kategorie hatte nur ein Element (Bikes) und bildete einen Ring ohne Information; es bleiben Region, Produktgruppe und Kaufgrund. Die Farblegende unter dem Diagramm entfällt, die Namen stehen in den Segmenten." },
      { nr: 4, ziel: "sb-ringe", anker: "links", versatz: [40, 50], regel: "STRUCTURE – Inhalte ordnen", titel: "Gleiche Reihenfolge in jeder Region",
        text: "Die Regionen folgen im Uhrzeigersinn ihrem Umsatz; Produktgruppen und Kaufgründe stehen in jeder Region in derselben Reihenfolge. So lassen sich Muster vergleichen, etwa der hohe Anteil der City Bikes in den Niederlanden." },
      { nr: 5, ziel: "sb-texte", anker: "links", versatz: [10, 330], regel: "EXPRESS – Lesbar beschriften", titel: "Waagerecht und ungetrennt",
        text: "Namen stehen waagerecht und nur dort, wo sie ganz ins Segment passen. Das Original drehte die Beschriftung und trennte mitten im Wort („Manuf acturer“, „Mountai n Bikes“). Kleine Segmente nennen ihre Werte im Tooltip." },
      { nr: 6, ziel: "sb-mitte", versatz: [-40, 40], regel: "CONDENSE – Mitte nutzen", titel: "Gesamtumsatz in der Mitte",
        text: "Die leere Mitte des Originals zeigt jetzt den Umsatz, auf den sich alle Anteile beziehen. Die Anteile der Regionen stehen im inneren Ring." },
      { nr: 7, ziel: "sb-ringe", anker: "links", versatz: [440, 370], regel: "CHECK – Visuelle Integrität", titel: "Winkel lesen ist ungenau",
        text: "Jeder Ring ergibt den Gesamtumsatz, die Winkel sind maßstabsgetreu. Winkel und Bogenlängen lassen sich aber schlecht vergleichen – genaue Werte zeigen Tooltip und „Werte als Tabelle“. Für Vergleiche ist ein Balkendiagramm besser, für Strukturen über mehrere Ebenen eine Treemap (Abb. 3.45)." },
      { nr: 8, ziel: "filter", anker: "links", versatz: [325, -2], regel: "CONDENSE – Filtern und hervorheben", titel: "Datenschnitte und Klick",
        text: "Jahr und Region filtern das Diagramm. Ein Klick auf ein Segment hebt dieses Element in allen Regionen hervor – etwa den Kaufgrund Preis in allen Produktgruppen: Die gewählten Segmente werden dunkler, die übrigen blasser. So wird der Vergleich möglich, den der Sunburst sonst schwer macht. Esc hebt die Auswahl auf." },
    ],
    nachbauIntro: "Seitengröße benutzerdefiniert 727 × 600 px. Schrift Arial: Beschriftungen 10,5 pt, Visualtitel 12 pt. Ein Sunburst ist in Power BI kein Standardvisual; Excel bietet ihn seit 2016 als Diagrammtyp (Einfügen › Hierarchiediagramm › Sunburst). Datenmodell: Tabelle Umsatz (Region, Produktgruppe, Kaufgrund, Jahr, Umsatz) wie in der CSV-Datei.",
    nachbau: [
      { id: "A", ziel: "v-sunburst", versatz: [0, 0], titel: "Sunburst", visual: "Zertifiziertes Visual „Sunburst“ (Microsoft, AppSource) – ersatzweise Ringdiagramm mit Drilldown",
        felder: "Gruppe: Region, Produktgruppe, Kaufgrund (in dieser Reihenfolge); Werte: Umsatz",
        format: "Farben der Elemente nach Ebene: Regionen #3A3F44, Produktgruppen #C9C9C9, Kaufgründe #EFEFEF; Trennlinien weiß; Legende aus; Datenbeschriftung Kategorie",
        hinweis: "Mit Standardmitteln: Ringdiagramm, Legende = Hierarchie Region › Produktgruppe › Kaufgrund, Drilldown aktiv – es zeigt je Ebene einen Ring. Für Vergleiche über Ebenen: Treemap oder Dekompositionsstruktur." },
      { id: "B", ziel: "sb-mitte", versatz: [-40, 40], titel: "Gesamtumsatz in der Mitte", visual: "Karte (neu)",
        felder: "Measure Umsatz = SUM(Umsatz[Umsatz])", format: "Ohne Hintergrund und Rahmen über die Mitte des Diagramms legen; Anzeigeeinheit Millionen, 1 Dezimalstelle" },
      { id: "C", ziel: "filter", anker: "links", versatz: [124, -2], titel: "Datenschnitte", visual: "Datenschnitt (2×)",
        felder: "Jahr als Kacheln (Einzelauswahl), Region als Dropdown",
        format: "Ausgewählt #3A3F44 mit weißer Schrift, sonst weiß mit Rahmen #9A9A9A" },
      { id: "D", ziel: "v-sunburst", anker: "links", versatz: [552, 1], titel: "Kernaussage", visual: "Textfeld mit dynamischem Wert",
        felder: "Text-Measure mit TOPN(1; VALUES(Umsatz[Kaufgrund]); [Umsatz]) und DIVIDE für den Anteil", format: "10,5 pt, #4D4D4D" },
    ],
    theme: DK.thema(),
    csv: { name: "sunburst_umsatz_daten.csv", text: () => {
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
