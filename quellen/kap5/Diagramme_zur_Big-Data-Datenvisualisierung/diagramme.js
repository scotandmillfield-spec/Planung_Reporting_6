/* Übersicht „Diagramme zur Big-Data-Datenvisualisierung“ (Abb. 5.66): zwölf Diagrammarten als kleine Vielfache.
   Seite 1024 x 646 px. Daten: diagramme.json (daten_diagramme.py), erfunden – ein Online-Händler ohne Namen.
   Genau die Arten des Originals (Collage aus einer Visualisierungsbibliothek), im Buchstil gezeichnet und nach
   Analyseaufgabe geordnet: Zeile 1 Hierarchie (Baumdiagramm, eingerückter Baum, Treemap, Sunburst – alle mit
   denselben Sortimentsdaten), Zeile 2 Netzwerk (Kantenbündelung, Sehnendiagramm) und Vergleich (Blasendiagramm,
   Balkendiagramm), Zeile 3 Raum (Flächenkartogramm als Kachelkarte, Globus mit Säulen), Zeit (Kalender-Heatmap)
   und Text (Wortwolke). Datenschnitt Analyseaufgabe hebt die passenden Kacheln hervor; Klick auf eine Kachel hebt
   sie hervor und nennt im Kopf, wofür die Art geeignet ist; Tooltip mit Werten, Eignung, Grenzen und Power-BI-Visual.
   Grenzen im Buchstil: 3D-Globus als flache orthografische Ansicht mit Gradnetz (ohne Küstenlinien), Karte als
   Kachelkarte der 16 Länder (wie Abb. 3.66), Wortwolke nur waagerecht. */
(() => {
  "use strict";
  const { zahl, NBSP, sv, el, tw } = DK;
  const D = DATA;
  const GRAU = ["#EFEFEF", "#D4D4D4", "#A9A9A9", "#6E747A", "#3A3F44"];
  const AC = "#3A3F44", LINIE = "#8C8C8C";
  const schrift = f => (f === "#6E747A" || f === "#3A3F44" || f === "#8F8F8F") ? "#FFFFFF" : "#1A1A1A";
  const TAU = 2 * Math.PI, NDASH = String.fromCharCode(0x2013);
  const pz = (a, nk = 0) => zahl(a * 100, nk) + NBSP + "%";
  const W = 233, H = 130;

  /* ---------- Analyseaufgaben und Diagrammarten ---------- */
  const KAT = {
    hierarchie: ["Hierarchie", "Teile eines Ganzen über mehrere Ebenen"],
    netzwerk: ["Netzwerk", "Beziehungen und Flüsse zwischen Objekten"],
    vergleich: ["Vergleich", "Größen und Rangfolgen vergleichen"],
    raum: ["Raum", "Kennzahlen mit Ortsbezug"],
    zeit: ["Zeit", "Muster im Zeitverlauf"],
    text: ["Text", "Häufigkeit von Begriffen in Freitexten"],
  };
  const TYPEN = [
    { key: "baum", name: "Baumdiagramm", kat: "hierarchie", inhalt: "Sortiment: Bereiche und Warengruppen",
      geeignet: "die Struktur einer Hierarchie mit Ebenen und Zweigen (Sortiment, Konten, Organisation)",
      grenzen: "zeigt Struktur, keine Größen; bei vielen Blättern sehr hoch", pbi: "Decomposition Tree (Standardvisual)" },
    { key: "eingerueckt", name: "Eingerückter Baum", kat: "hierarchie", inhalt: "Umsatz je Ebene, Mio. €",
      geeignet: "lange Hierarchien mit Werten, auf- und zuklappbar wie eine Kontenstruktur",
      grenzen: "nur wenige Zweige zugleich gut lesbar", pbi: "Matrix mit Zeilenhierarchie und Datenbalken" },
    { key: "treemap", name: "Treemap", kat: "hierarchie", inhalt: "Umsatz je Warengruppe, Mio. €",
      geeignet: "Anteile vieler Elemente an einem Ganzen, gruppiert nach Ebenen",
      grenzen: "Flächen nur grob vergleichbar, kleine Felder ohne Beschriftung", pbi: "Treemap (Standardvisual)" },
    { key: "sunburst", name: "Sunburst", kat: "hierarchie", inhalt: "Umsatz je Bereich (innen) und Warengruppe, Mio. €",
      geeignet: "Anteile über mehrere Ebenen von innen nach außen",
      grenzen: "Winkel und Ringflächen schwer vergleichbar, äußere Ringe wirken größer",
      pbi: "kein Standardvisual – Treemap oder Matrix" },
    { key: "kanten", name: "Kantenbündelung", kat: "netzwerk", inhalt: "Datenflüsse zwischen IT-Systemen",
      geeignet: "viele Verbindungen zwischen gruppierten Objekten, z. B. Datenflüsse zwischen Systemen",
      grenzen: "einzelne Verbindungen schwer verfolgbar, keine Mengen", pbi: "kein Standardvisual – Matrix Quelle × Ziel" },
    { key: "sehnen", name: "Sehnendiagramm", kat: "netzwerk", inhalt: "Wechsel des Hauptkanals, Tsd. Kunden",
      geeignet: "Mengenflüsse zwischen wenigen Gruppen in beide Richtungen, z. B. Kanalwechsel",
      grenzen: "Bandbreiten schwer ablesbar, ab etwa acht Gruppen unübersichtlich",
      pbi: "kein Standardvisual – Matrix Von × Nach mit Datenbalken" },
    { key: "blasen", name: "Blasendiagramm", kat: "vergleich", inhalt: "Themen im Kundenfeedback, Nennungen",
      geeignet: "einen Überblick über Größenordnungen vieler Objekte",
      grenzen: "Kreisflächen werden unterschätzt; für Rangfolgen besser Balken",
      pbi: "kein Standardvisual für gepackte Blasen – Balken- oder Punktdiagramm mit Größe" },
    { key: "balken", name: "Balkendiagramm", kat: "vergleich", inhalt: "Umsatz je Warengruppe, Mio. €",
      geeignet: "Rangfolgen und genaue Vergleiche – Referenz für alle anderen Arten",
      grenzen: "zeigt weder Hierarchie noch Raum", pbi: "Gruppiertes Balkendiagramm (Standardvisual)" },
    { key: "karte", name: "Flächenkartogramm", kat: "raum", inhalt: "Online-Umsatz je Einwohner, €",
      geeignet: "regionale Unterschiede einer Quote, z. B. Umsatz je Einwohner nach Bundesland",
      grenzen: "nur für Quoten je Fläche; auf Umrisskarten dominieren große Länder – hier gleich große Kacheln",
      pbi: "Flächenkartogramm (Standardvisual)" },
    { key: "globus", name: "Globus mit Säulen", kat: "raum", inhalt: "Webshop-Sitzungen nach Standort, Tsd.",
      geeignet: "die weltweite Verteilung von Ereignissen auf einen Blick",
      grenzen: "Rückseite verdeckt, Säulen zur Mitte hin verkürzt – für Vergleiche ungeeignet",
      pbi: "kein Standardvisual – Karte mit Blasengröße" },
    { key: "kalender", name: "Kalender-Heatmap", kat: "zeit", inhalt: "Bestellungen je Tag, 1. Quartal 2027",
      geeignet: "Tages- und Wochenmuster über Monate, z. B. Bestellungen je Tag",
      grenzen: "Graustufen nur in Klassen ablesbar, genaue Werte im Tooltip",
      pbi: "Matrix Wochentag × Kalenderwoche mit bedingter Hintergrundfarbe" },
    { key: "wolke", name: "Wortwolke", kat: "text", inhalt: "Begriffe in Kundenbewertungen, Anzahl",
      geeignet: "einen ersten Eindruck häufiger Begriffe in Freitexten wie Kundenbewertungen",
      grenzen: "Größe hängt auch von der Wortlänge ab, keine genauen Werte",
      pbi: "kein Standardvisual – Balkendiagramm der häufigsten Begriffe" },
  ];

  /* ---------- Zustand ---------- */
  const S = { kat: "alle", typ: null };
  addEventListener("keydown", e => { if (e.key === "Escape" && S.typ) { S.typ = null; zeichnen(); } });

  /* ---------- Layout ---------- */
  DK.init({ titel: "Diagramme zur Big-Data-Datenvisualisierung" });
  const bKopf = DK.box("kopf", 16, 10, 992, 46);
  DK.haarlinie(62);
  const bFilter = DK.box("filter", 16, 68, 992, 50, "dk-filter");
  DK.haarlinie(125);
  DK.haarlinie(299.5);
  DK.haarlinie(474.5);
  const boxen = TYPEN.map((t, i) => DK.box("k-" + t.key, 16 + (i % 4) * 253, 132 + Math.floor(i / 4) * 175, W, 160));

  /* ---------- Tooltip ---------- */
  const tip = document.querySelector(".dk-tooltip");
  function tooltip(ziel, zeilenFn) {
    ziel.addEventListener("pointermove", ev => {
      tip.textContent = "";
      zeilenFn(ev).forEach((z, i) => el(i === 0 ? "b" : "div", {}, tip, z));
      tip.style.display = "block";
      const r = tip.getBoundingClientRect();
      let x = ev.clientX + 14, y = ev.clientY + 14;
      if (x + r.width > innerWidth - 8) x = ev.clientX - r.width - 14;
      if (y + r.height > innerHeight - 8) y = ev.clientY - r.height - 14;
      tip.style.left = x + "px"; tip.style.top = y + "px";
    });
    ziel.addEventListener("pointerleave", () => { tip.style.display = "none"; });
  }
  const T = (e, zeilen) => { e._tip = zeilen; return e; };          // Element-Tooltip (erste Zeile fett)
  const text = (g, x, y, s, o = {}) => sv("text", { x, y, dy: o.dy ?? "0.35em", "text-anchor": o.anker || "start",
    style: (o.farbe ? `fill:${o.farbe};` : "") + (o.fett ? "font-weight:bold;" : "") + (o.px ? `font-size:${o.px}px;` : "") +
      (o.muted ? "fill:#4D4D4D;" : "") }, g, s);

  /* ---------- Daten ---------- */
  const SORT = D.sortiment.map(([b, n, v]) => ({ b, n, v }));
  const BEREICHE = [...new Set(SORT.map(s => s.b))].map(b => ({ b, v: SORT.filter(s => s.b === b).reduce((a, s) => a + s.v, 0) }));
  const GES = SORT.reduce((a, s) => a + s.v, 0);
  const BFARBE = { Mode: "#3A3F44", Wohnen: "#6E747A", Technik: "#A9A9A9" };
  const BFARBE2 = { Mode: "#6E747A", Wohnen: "#A9A9A9", Technik: "#D4D4D4" };
  const mio = v => zahl(v, 1);
  const sortTip = s => [`${s.n} (${s.b})`, `Umsatz ${mio(s.v)}${NBSP}Mio.${NBSP}€ · ${pz(s.v / GES, 1)} des Sortiments`];
  const berTip = b => [b.b, `Umsatz ${mio(b.v)}${NBSP}Mio.${NBSP}€ · ${pz(b.v / GES, 1)} des Sortiments`];

  /* ---------- 1 Baumdiagramm ---------- */
  function baum(g) {
    const e1 = Math.ceil(tw("Sortiment")) + 8;
    const bx = e1 + Math.ceil(Math.max(...BEREICHE.map(b => tw(b.b)))) + 10;
    const lx = W - Math.ceil(Math.max(...SORT.map(s => tw(s.n)))) - 9, e2 = (bx + lx) / 2;
    const rh = H / SORT.length, ly = SORT.map((_, i) => rh * (i + 0.5));
    const by = BEREICHE.map(b => { const ys = ly.filter((_, i) => SORT[i].b === b.b); return (Math.min(...ys) + Math.max(...ys)) / 2; });
    const ry = (Math.min(...by) + Math.max(...by)) / 2;
    const L = (pts) => sv("polyline", { points: pts.map(p => p.join(",")).join(" "), fill: "none", stroke: LINIE, "stroke-width": 1 }, g);
    L([[4, ry], [e1, ry]]); L([[e1, Math.min(...by)], [e1, Math.max(...by)]]);
    BEREICHE.forEach((b, k) => {
      const ys = ly.filter((_, i) => SORT[i].b === b.b);
      L([[e1, by[k]], [e2, by[k]]]); L([[e2, Math.min(...ys)], [e2, Math.max(...ys)]]);
      ys.forEach(y => L([[e2, y], [lx, y]]));
    });
    T(sv("circle", { cx: 4, cy: ry, r: 3.5, fill: AC }, g), ["Sortiment", `Umsatz ${mio(GES)}${NBSP}Mio.${NBSP}€`]);
    T(text(g, 0, ry - 9, "Sortiment", { dy: 0 }), ["Sortiment", `Umsatz ${mio(GES)}${NBSP}Mio.${NBSP}€`]);
    BEREICHE.forEach((b, k) => {
      T(text(g, bx - 6, by[k] - 6, b.b, { anker: "end", dy: 0 }), berTip(b));
      T(sv("circle", { cx: bx, cy: by[k], r: 3.5, fill: AC }, g), berTip(b));
    });
    SORT.forEach((s, i) => {
      T(sv("circle", { cx: lx, cy: ly[i], r: 3.5, fill: AC }, g), sortTip(s));
      T(text(g, lx + 6, ly[i], s.n), sortTip(s));
    });
  }

  /* ---------- 2 Eingerückter Baum ---------- */
  function eingerueckt(g) {
    const zeilen = [{ n: "Sortiment", e: 0, v: GES, auf: true, tip: ["Sortiment", `Umsatz ${mio(GES)}${NBSP}Mio.${NBSP}€`] }];
    BEREICHE.forEach(b => {
      const auf = b.b === "Mode";
      zeilen.push({ n: b.b, e: 1, v: b.v, auf, kinder: true, tip: berTip(b).concat(auf ? [] : ["zugeklappt"]) });
      if (auf) SORT.filter(s => s.b === b.b).forEach(s => zeilen.push({ n: s.n, e: 2, v: s.v, tip: sortTip(s) }));
    });
    zeilen[0].kinder = true;
    const rh = H / zeilen.length, BX = 112, vw = Math.ceil(tw("48,2")) + 6, bmax = W - BX - vw;
    zeilen.forEach((z, i) => {
      const y = rh * (i + 0.5), x0 = z.e * 14, gz = sv("g", {}, g);
      if (z.kinder) sv("polygon", { points: z.auf ? `${x0},${y - 3} ${x0 + 9},${y - 3} ${x0 + 4.5},${y + 3}`
                                               : `${x0 + 2},${y - 4.5} ${x0 + 8},${y} ${x0 + 2},${y + 4.5}`, fill: AC }, gz);
      text(gz, x0 + 13, y, z.n, { fett: !!z.kinder });
      const bw = Math.max(1, z.v / GES * bmax);
      sv("rect", { x: BX, y: y - 5.5, width: bw, height: 11, fill: AC }, gz);
      text(gz, BX + bw + 4, y, mio(z.v));
      T(sv("rect", { x: 0, y: y - rh / 2, width: W, height: rh, fill: "#FFFFFF", "fill-opacity": 0 }, gz), z.tip);
    });
  }

  /* ---------- 3 Treemap ---------- */
  function squarify(items, x, y, w, h) {
    const tot = items.reduce((a, o) => a + o.v, 0), k = w * h / tot;
    const rest = items.map(o => ({ ...o, a: o.v * k })).sort((p, q) => q.a - p.a), out = [];
    let row = [], rx = x, ry = y, rw = w, rh = h;
    const worst = (r, s) => { const sum = r.reduce((a, o) => a + o.a, 0), mx = Math.max(...r.map(o => o.a)), mn = Math.min(...r.map(o => o.a));
      return Math.max(s * s * mx / (sum * sum), sum * sum / (s * s * mn)); };
    const legen = () => {
      const sum = row.reduce((a, o) => a + o.a, 0);
      if (rw >= rh) { const cw = sum / rh; let yy = ry; row.forEach(o => { const hh = o.a / cw; out.push({ ...o, x: rx, y: yy, w: cw, h: hh }); yy += hh; }); rx += cw; rw -= cw; }
      else { const ch = sum / rw; let xx = rx; row.forEach(o => { const ww = o.a / ch; out.push({ ...o, x: xx, y: ry, w: ww, h: ch }); xx += ww; }); ry += ch; rh -= ch; }
      row = [];
    };
    while (rest.length) {
      const s = Math.min(rw, rh);
      if (!row.length || worst(row.concat([rest[0]]), s) <= worst(row, s)) row.push(rest.shift()); else legen();
    }
    if (row.length) legen();
    return out;
  }
  function treemap(g) {
    squarify(BEREICHE, 0, 0, W, H).forEach(B => {
      const f = BFARBE[B.b];
      squarify(SORT.filter(s => s.b === B.b), B.x, B.y, B.w, B.h).forEach(r => {
        const gz = sv("g", {}, g);
        T(sv("rect", { x: r.x + 1, y: r.y + 1, width: Math.max(0, r.w - 2), height: Math.max(0, r.h - 2), fill: f }, gz), sortTip(r));
        if (tw(r.n) <= r.w - 10 && r.h >= 22) {
          text(gz, r.x + 6, r.y + 13, r.n, { farbe: schrift(f) }).style.pointerEvents = "none";
          if (r.h >= 40) text(gz, r.x + 6, r.y + 30, mio(r.v), { farbe: schrift(f) }).style.pointerEvents = "none";
        }
      });
    });
  }

  /* ---------- 4 Sunburst (Ringsegmente wie Abb. 3.43/3.44) ---------- */
  const P = (cx, cy, r, a) => [cx + r * Math.sin(a), cy - r * Math.cos(a)];
  function ring(cx, cy, r0, r1, a0, a1) {
    const gr = a1 - a0 > Math.PI ? 1 : 0;
    const [ax, ay] = P(cx, cy, r1, a0), [bx, by] = P(cx, cy, r1, a1), [c_x, c_y] = P(cx, cy, r0, a1), [dx, dy] = P(cx, cy, r0, a0);
    return `M${ax},${ay}A${r1},${r1} 0 ${gr} 1 ${bx},${by}L${c_x},${c_y}A${r0},${r0} 0 ${gr} 0 ${dx},${dy}Z`;
  }
  function lage(cx, cy, r0, r1, a0, a1, w, h) {
    const passt = (am, rm) => {
      const [mx, my] = P(cx, cy, rm, am);
      const ok = [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2], [0, -h / 2], [0, h / 2]].every(([ddx, ddy]) => {
        const x = mx + ddx - cx, y = my + ddy - cy, r = Math.hypot(x, y);
        if (r < r0 + 1.5 || r > r1 - 1.5) return false;
        let a = Math.atan2(x, -y);
        while (a < a0) a += TAU;
        while (a > a0 + TAU) a -= TAU;
        return a >= a0 + 2 / r && a <= a1 - 2 / r;
      });
      return ok ? [mx, my] : null;
    };
    const mitte = (a0 + a1) / 2, sp = (a1 - a0) / 2, st = Math.PI / 90, rm = (r0 + r1) / 2;
    for (let i = 0; i * st <= sp; i++) for (const am of i ? [mitte - i * st, mitte + i * st] : [mitte]) { const m = passt(am, rm); if (m) return m; }
    return null;
  }
  function sunburst(g) {
    const cx = W / 2, cy = 62, R = [16, 41, 43, 60];
    let a = 0;
    BEREICHE.forEach(b => {
      const a1 = a + TAU * b.v / GES, f = BFARBE[b.b];
      T(sv("path", { d: ring(cx, cy, R[0], R[1], a, a1), fill: f, stroke: "#FFFFFF", "stroke-width": 1.5 }, g), berTip(b));
      // Bereichsnamen passen waagerecht nicht in den inneren Ring: außen an der Mitte des Bereichs
      const am = (a + a1) / 2, [lx, ly] = P(cx, cy, R[3] + 5, am), sn = Math.sin(am), cs = Math.cos(am);
      T(text(g, lx, cs > 0.6 ? ly - 3 : cs < -0.6 ? ly + 5 : ly, b.b, { anker: sn > 0.25 ? "start" : sn < -0.25 ? "end" : "middle", fett: true }), berTip(b));
      let a2 = a;
      SORT.filter(s => s.b === b.b).forEach(s => {
        const a3 = a2 + TAU * s.v / GES, f2 = BFARBE2[b.b];
        T(sv("path", { d: ring(cx, cy, R[2], R[3], a2, a3), fill: f2, stroke: "#FFFFFF", "stroke-width": 1.5 }, g), sortTip(s));
        const m2 = lage(cx, cy, R[2], R[3], a2, a3, tw(s.n) + 2, 15);
        if (m2) text(g, m2[0], m2[1], s.n, { anker: "middle", farbe: schrift(f2) }).style.pointerEvents = "none";
        a2 = a3;
      });
      a = a1;
    });
    T(text(g, cx, cy, mio(GES), { anker: "middle" }), ["Sortiment", `Umsatz ${mio(GES)}${NBSP}Mio.${NBSP}€`]);
  }

  /* ---------- 5 Kantenbündelung ---------- */
  function kanten(g) {
    const cx = W / 2, cy = 62, r = 42, gruppen = [...new Set(D.systeme.map(s => s[1]))];
    // Reihenfolge im Kreis: Analyse, Kanäle, operative Systeme – je Gruppe eine Lücke
    const WINKEL = { DWH: 15, "Data Lake": 50, Shop: 105, App: 145, "Social Media": 195, CRM: 245, ERP: 280, Lager: 315 };
    const pos = {}, gwink = {};
    D.systeme.forEach(([n, gr]) => { pos[n] = { a: WINKEL[n] * Math.PI / 180, gr }; });
    gruppen.forEach(gr => { const as = Object.values(pos).filter(p => p.gr === gr).map(p => p.a); gwink[gr] = (Math.min(...as) + Math.max(...as)) / 2; });
    const knoten = n => P(cx, cy, r, pos[n].a), kontroll = gr => P(cx, cy, r * 0.32, gwink[gr]);
    const zeichne = (fl, schwarz) => fl.forEach(([a, b]) => {
      const [ax, ay] = knoten(a), [bx, by] = knoten(b), [c1x, c1y] = kontroll(pos[a].gr), [c2x, c2y] = kontroll(pos[b].gr);
      T(sv("path", { d: `M${ax},${ay}C${c1x},${c1y} ${c2x},${c2y} ${bx},${by}`, fill: "none", stroke: schwarz ? AC : "#A9A9A9",
        "stroke-width": schwarz ? 1.8 : 1.2 }, g), [`${a} → ${b}`, "Datenfluss" + (schwarz ? " des Data Lake" : "")]);
    });
    const dl = D.fluesse.filter(f => f.includes("Data Lake"));
    zeichne(D.fluesse.filter(f => !f.includes("Data Lake")), false);
    zeichne(dl, true);
    Object.entries(pos).forEach(([n, p]) => {
      const [x, y] = knoten(n), s = Math.sin(p.a), c = Math.cos(p.a);
      const nf = D.fluesse.filter(f => f.includes(n)).length, zt = [n, `${p.gr} · ${nf} Datenflüsse`];
      T(sv("circle", { cx: x, cy: y, r: 3.5, fill: AC }, g), zt);
      const [lx, ly] = P(cx, cy, r + 7, p.a);
      T(text(g, lx, c > 0.6 ? ly - 3 : c < -0.6 ? ly + 9 : ly, n, { anker: s > 0.25 ? "start" : s < -0.25 ? "end" : "middle",
        fett: n === "Data Lake" }), zt);
    });
  }

  /* ---------- 6 Sehnendiagramm ---------- */
  function sehnen(g) {
    const K = D.kanaele, M = D.wechsel, n = K.length, cx = W / 2, cy = H / 2, r1 = 53, r0 = 46, pad = 0.07;
    const FARBEN = ["#3A3F44", "#8F8F8F", "#6E747A", "#D4D4D4", "#A9A9A9"];
    const zs = M.map(z => z.reduce((a, v) => a + v, 0)), tot = zs.reduce((a, v) => a + v, 0), k = (TAU - n * pad) / tot;
    const grp = [], sub = {};
    let a = 0;
    K.forEach((_, i) => {
      const a0 = a; grp.push({ a0, a1: a0 + zs[i] * k });
      M[i].forEach((v, j) => { sub[i + "-" + j] = [a, a + v * k]; a += v * k; });
      a += pad;
    });
    const bogen = (r, a0, a1) => { const [x, y] = P(cx, cy, r, a1); return `A${r},${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${x},${y}`; };
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      if (!M[i][j] && !M[j][i]) continue;
      const [s0, s1] = sub[i + "-" + j], [t0, t1] = sub[j + "-" + i], [sx, sy] = P(cx, cy, r0, s0), [tx, ty] = P(cx, cy, r0, t0);
      const quelle = M[i][j] >= M[j][i] ? i : j;
      T(sv("path", { d: `M${sx},${sy}${bogen(r0, s0, s1)}Q${cx},${cy} ${tx},${ty}${bogen(r0, t0, t1)}Q${cx},${cy} ${sx},${sy}Z`,
        fill: FARBEN[quelle], "fill-opacity": 0.6, stroke: "#FFFFFF", "stroke-width": 0.5 }, g),
        [`${K[i]} ↔ ${K[j]}`, `${K[i]} → ${K[j]}: ${zahl(M[i][j])}${NBSP}Tsd. Kunden`, `${K[j]} → ${K[i]}: ${zahl(M[j][i])}${NBSP}Tsd. Kunden`]);
    }
    grp.forEach((gp, i) => {
      const ein = M.reduce((s, z) => s + z[i], 0);
      const zt = [K[i], `wechselten weg: ${zahl(zs[i])}${NBSP}Tsd. Kunden`, `kamen dazu: ${zahl(ein)}${NBSP}Tsd. Kunden`];
      T(sv("path", { d: ring(cx, cy, r0 + 1, r1, gp.a0, gp.a1), fill: FARBEN[i] }, g), zt);
      const am = (gp.a0 + gp.a1) / 2, [lx, ly] = P(cx, cy, r1 + 6, am), s = Math.sin(am), c = Math.cos(am);
      T(text(g, lx, c > 0.6 ? ly - 4 : c < -0.6 ? ly + 9 : ly, K[i], { anker: s > 0.25 ? "start" : s < -0.25 ? "end" : "middle" }), zt);
    });
  }

  /* ---------- 7 Blasendiagramm (gepackte Kreise) ---------- */
  function packen(items, w, h, pad = 2) {
    const cx = w / 2, cy = h / 2, gesetzt = [];
    const frei = (x, y, r) => x - r >= 0 && x + r <= w && y - r >= 0 && y + r <= h &&
      gesetzt.every(o => Math.hypot(o.x - x, o.y - y) >= o.r + r + pad - 1e-6);
    const guete = (x, y) => ((x - cx) / 1.6) ** 2 + (y - cy) ** 2;
    items.forEach(it => {
      if (!gesetzt.length) { gesetzt.push({ ...it, x: cx, y: cy }); return; }
      let best = null;
      const pruefe = (x, y) => { if (frei(x, y, it.r) && (!best || guete(x, y) < best.q)) best = { x, y, q: guete(x, y) }; };
      gesetzt.forEach((a, i) => {
        for (let t = 0; t < 36; t++) { const w_ = t * TAU / 36, d = a.r + it.r + pad; pruefe(a.x + d * Math.cos(w_), a.y + d * Math.sin(w_)); }
        gesetzt.slice(i + 1).forEach(b => {
          const ra = a.r + it.r + pad, rb = b.r + it.r + pad, dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
          if (d > ra + rb || d < Math.abs(ra - rb) || d === 0) return;
          const l = (ra * ra - rb * rb + d * d) / (2 * d), hh = Math.sqrt(Math.max(0, ra * ra - l * l));
          const mx = a.x + l * dx / d, my = a.y + l * dy / d;
          pruefe(mx + hh * dy / d, my - hh * dx / d); pruefe(mx - hh * dy / d, my + hh * dx / d);
        });
      });
      if (best) gesetzt.push({ ...it, x: best.x, y: best.y });
    });
    return gesetzt;
  }
  let BLASEN = null;
  function blasen(g) {
    const sum = D.themen.reduce((a, t) => a + t[1], 0);
    // Dichte 53 %; passt eine Blase nicht, alle Radien um 3 % verkleinern und neu packen
    for (let dichte = 0.53; !BLASEN || BLASEN.length < D.themen.length; dichte *= 0.94) {
      const k = Math.sqrt(W * H * dichte / (Math.PI * sum));
      BLASEN = packen(D.themen.map(([n, v], i) => ({ n, v, i, r: k * Math.sqrt(v) })), W, H);
    }
    BLASEN.forEach(b => {
      const f = b.i < 2 ? AC : "#D4D4D4", gz = sv("g", {}, g);
      T(sv("circle", { cx: b.x, cy: b.y, r: b.r, fill: f }, gz), [b.n, `${zahl(b.v)} Nennungen · ${pz(b.v / sum, 1)} · Rang ${b.i + 1}`]);
      if (tw(b.n) <= 2 * b.r - 4) text(gz, b.x, b.y, b.n, { anker: "middle", farbe: schrift(f) }).style.pointerEvents = "none";
    });
    if (BLASEN.length !== D.themen.length) console.warn("Nicht alle Blasen gesetzt");
  }

  /* ---------- 8 Balkendiagramm ---------- */
  function balken(g) {
    const z = SORT.slice().sort((p, q) => q.v - p.v), rh = H / z.length;
    const lw = Math.ceil(Math.max(...z.map(s => tw(s.n)))) + 8, vw = Math.ceil(tw("9,8")) + 6, max = z[0].v;
    z.forEach((s, i) => {
      const y = rh * (i + 0.5), bw = s.v / max * (W - lw - vw), gz = sv("g", {}, g);
      text(gz, lw - 8, y, s.n, { anker: "end" });
      sv("rect", { x: lw, y: y - 6, width: bw, height: 12, fill: AC }, gz);
      text(gz, lw + bw + 4, y, mio(s.v));
      T(sv("rect", { x: 0, y: y - rh / 2, width: W, height: rh, fill: "#FFFFFF", "fill-opacity": 0 }, gz), sortTip(s).concat([`Rang ${i + 1}`]));
    });
  }

  /* ---------- 9 Flächenkartogramm als Kachelkarte ---------- */
  const klasse = v => D.klassen.filter(gr => v >= gr).length;
  const KL_TEXT = [`unter ${D.klassen[0]}`, ...D.klassen.slice(0, -1).map((a, i) => `${a}${NDASH}${D.klassen[i + 1]}`), `ab ${D.klassen[D.klassen.length - 1]}`];
  function karte(g) {
    const K = 25, PI = 26;
    D.laender.forEach(([kz, name, zl, sp, v]) => {
      const k = klasse(v), f = GRAU[k], gz = sv("g", {}, g);
      T(sv("rect", { x: sp * PI, y: zl * PI, width: K, height: K, fill: f }, gz), [name, `Online-Umsatz je Einwohner: ${zahl(v)}${NBSP}€`, `Klasse ${KL_TEXT[k]}${NBSP}€`]);
      text(gz, sp * PI + K / 2, zl * PI + K / 2, kz, { anker: "middle", farbe: schrift(f) }).style.pointerEvents = "none";
    });
    const lx = 5 * PI + 14;
    text(g, lx, 8, `€ je Einw.`, { muted: true });
    KL_TEXT.slice().reverse().forEach((t, i) => {
      const k = KL_TEXT.length - 1 - i, y = 30 + i * 20;
      sv("rect", { x: lx, y: y - 6, width: 12, height: 12, fill: GRAU[k], stroke: k === 0 ? "#A9A9A9" : "none", "stroke-width": 1 }, g);
      text(g, lx + 18, y, t);
    });
  }

  /* ---------- 10 Globus mit Säulen (flache orthografische Ansicht) ---------- */
  function globus(g) {
    const cx = 92, cy = H / 2, R = 58, la0 = 20 * Math.PI / 180, lo0 = -40 * Math.PI / 180, rad = Math.PI / 180;
    const proj = (la, lo) => {
      const f = la * rad, l = lo * rad - lo0;
      const c = Math.sin(la0) * Math.sin(f) + Math.cos(la0) * Math.cos(f) * Math.cos(l);
      return { x: R * Math.cos(f) * Math.sin(l), y: -R * (Math.cos(la0) * Math.sin(f) - Math.sin(la0) * Math.cos(f) * Math.cos(l)), sicht: c > 0 };
    };
    sv("circle", { cx, cy, r: R, fill: "#F6F6F6", stroke: LINIE, "stroke-width": 1 }, g);
    const linie = (pts, st, sw) => {
      let seg = [];
      const raus = () => { if (seg.length > 1) sv("polyline", { points: seg.map(p => `${cx + p.x},${cy + p.y}`).join(" "), fill: "none", stroke: st, "stroke-width": sw }, g); seg = []; };
      pts.forEach(p => { if (p.sicht) seg.push(p); else raus(); });
      raus();
    };
    for (let lo = -180; lo < 180; lo += 30) linie([...Array(61).keys()].map(i => proj(-90 + i * 3, lo)), "#D4D4D4", 1);
    for (let la = -60; la <= 60; la += 30) linie([...Array(121).keys()].map(i => proj(la, -180 + i * 3)), la === 0 ? "#A9A9A9" : "#D4D4D4", 1);
    const vmax = Math.max(...D.standorte.map(s => s[3]));
    D.standorte.map(([n, la, lo, v]) => ({ n, v, p: proj(la, lo) })).filter(s => s.p.sicht).sort((a, b) => a.v - b.v).forEach(s => {
      const h = 1 + 0.6 * s.v / vmax, x0 = cx + s.p.x, y0 = cy + s.p.y, x1 = cx + s.p.x * h, y1 = cy + s.p.y * h;
      const zt = [s.n, `${zahl(s.v)}${NBSP}Tsd. Sitzungen`, `sichtbare Säulenlänge ${zahl(Math.hypot(x1 - x0, y1 - y0))}${NBSP}px`];
      sv("line", { x1: x0, y1: y0, x2: x1, y2: y1, stroke: AC, "stroke-width": 2, "stroke-linecap": "round" }, g);
      T(sv("line", { x1: x0, y1: y0, x2: x1, y2: y1, stroke: "#FFFFFF", "stroke-opacity": 0, "stroke-width": 9 }, g), zt);
    });
    const verdeckt = D.standorte.filter(([, la, lo]) => !proj(la, lo).sicht).map(s => s[0]);
    T(sv("circle", { cx, cy, r: R * 0.25, fill: "#FFFFFF", "fill-opacity": 0 }, g), ["Rückseite verdeckt", verdeckt.length ? "nicht sichtbar: " + verdeckt.join(", ") : "alle Standorte sichtbar"]);
  }

  /* ---------- 11 Kalender-Heatmap ---------- */
  const TAGKL = [1100, 1250, 1450, 1800];
  function kalender(g) {
    const start = new Date(D.tage_start + "T00:00:00"), off = (start.getDay() + 6) % 7, C = 12, PI = 14, X0 = 24, Y0 = 16;
    const WT = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"], MON = ["Jan", "Feb", "Mär"];
    [0, 2, 4, 6].forEach(r => text(g, 0, Y0 + r * PI + C / 2, WT[r], { muted: true }));
    D.tage.forEach((v, i) => {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i), col = Math.floor((i + off) / 7), row = (i + off) % 7;
      if (d.getDate() === 1) text(g, X0 + col * PI, 6, MON[d.getMonth()], { muted: true });
      const k = TAGKL.filter(t => v >= t).length;
      T(sv("rect", { x: X0 + col * PI, y: Y0 + row * PI, width: C, height: C, fill: GRAU[k], stroke: k === 0 ? "#D4D4D4" : "none", "stroke-width": 0.8 }, g),
        [`${WT[row]}, ${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`, `${zahl(v)} Bestellungen`]);
    });
    const ly = Y0 + 7 * PI + 4;
    text(g, X0, ly + 5, "weniger", { muted: true });
    const lx = X0 + Math.ceil(tw("weniger")) + 6;
    GRAU.forEach((f, k) => sv("rect", { x: lx + k * PI, y: ly, width: C, height: C, fill: f, stroke: k === 0 ? "#D4D4D4" : "none", "stroke-width": 0.8 }, g));
    text(g, lx + 5 * PI + 4, ly + 5, "mehr", { muted: true });
  }

  /* ---------- 12 Wortwolke (nur waagerecht) ---------- */
  let WOLKE = null;
  function wolkeLegen() {
    const w = D.woerter, vmax = w[0][1], vmin = w[w.length - 1][1], gesetzt = [];
    w.forEach(([t, v], i) => {
      const px = Math.round(14 + (v - vmin) / (vmax - vmin) * 16), bw = tw(t, px, i < 3) + 4, bh = px * 0.92;
      for (let s = 0; s < 900; s++) {
        const a = s * 0.18, rr = 0.55 * a, x = W / 2 + rr * 1.9 * Math.cos(a) - bw / 2, y = H / 2 + rr * Math.sin(a) - bh / 2;
        if (x < 0 || y < 0 || x + bw > W || y + bh > H) continue;
        if (gesetzt.some(o => x < o.x + o.w && o.x < x + bw && y < o.y + o.h && o.y < y + bh)) continue;
        gesetzt.push({ t, v, i, px, x, y, w: bw, h: bh }); break;
      }
    });
    return gesetzt;
  }
  function wolke(g) {
    if (!WOLKE) WOLKE = wolkeLegen();
    const sum = D.woerter.reduce((a, x) => a + x[1], 0);
    WOLKE.forEach(o => T(text(g, o.x + 2, o.y + o.h / 2, o.t, { px: o.px, fett: o.i < 3, farbe: o.i < 3 ? AC : "#6E747A" }),
      [o.t, `${zahl(o.v)} Nennungen · ${pz(o.v / sum, 1)} · Rang ${o.i + 1}`]));
    if (WOLKE.length !== D.woerter.length) console.warn("Nicht alle Wörter gesetzt");
  }

  const ZEICHNER = { baum, eingerueckt, treemap, sunburst, kanten, sehnen, blasen, balken, karte, globus, kalender, wolke };

  /* ---------- Kopf, Datenschnitt, Kacheln ---------- */
  DK.schnitt(bFilter, "Analyseaufgabe", "knoepfe", {
    optionen: [["alle", "Alle"], ...Object.entries(KAT).map(([k, v]) => [k, v[0]])], wert: "alle",
    onChange: v => { S.kat = v; S.typ = null; zeichnen(); } });
  const typLinien = t => [`Diagrammart: ${t.name} · ${KAT[t.kat][0]}`, `Beispiel: ${t.inhalt}`, `Geeignet für ${t.geeignet}`,
    `Grenzen: ${t.grenzen}`, `Power BI: ${t.pbi}`, "Klick hebt die Diagrammart hervor"];
  const passt = (k, b) => k.find(t => tw(t) <= b) || k[k.length - 1];

  function zeichnen() {
    const sel = TYPEN.find(t => t.key === S.typ);
    let unter;
    if (sel) unter = passt([`${sel.name}: geeignet für ${sel.geeignet}`, `${sel.name}: ${KAT[sel.kat][1]}`], 960);
    else if (S.kat !== "alle") { const n = TYPEN.filter(t => t.kat === S.kat).length;
      unter = `${KAT[S.kat][0]}: ${n} ${n === 1 ? "Diagrammart" : "Diagrammarten"} für ${KAT[S.kat][1]}`; }
    else unter = "Zwölf Diagrammarten nach Analyseaufgabe · Beispiel eines Online-Händlers, Daten erfunden";
    DK.kopf(bKopf, { titel: "Diagrammarten für die Big-Data-Visualisierung", untertitel: unter, quelle: "", legende: [] });
    TYPEN.forEach((t, i) => {
      const box = boxen[i];
      const f = DK.visual(box, { titel: t.name, einheit: KAT[t.kat][0] });
      box.querySelector(".dk-visual-titel").id = "t-" + t.key;
      const svg = sv("svg", { width: W, height: H, role: "img", "aria-label": `${t.name}: ${t.inhalt}` }, f.flaeche);
      const g = sv("g", { class: "dk-klick", id: "g-" + t.key }, svg);
      const hit = sv("rect", { x: 0, y: 0, width: W, height: H, fill: "transparent" }, g);
      ZEICHNER[t.key](g);
      g.addEventListener("click", () => { S.typ = S.typ === t.key ? null : t.key; zeichnen(); });
      tooltip(g, ev => {
        let e = ev.target;
        while (e && e !== g && !e._tip) e = e.parentNode;
        return e && e._tip ? [...e._tip, ...typLinien(t).slice(0, 1), typLinien(t)[2], typLinien(t)[5]] : [t.name, ...typLinien(t).slice(1)];
      });
      void hit;
      const blass = S.typ ? S.typ !== t.key : S.kat !== "alle" && t.kat !== S.kat;
      box.classList.toggle("dk-blass", blass);
    });
    if (DK._ebenenNeu) DK._ebenenNeu();
  }
  zeichnen();

  /* ---------- Lernplattform: Designregeln, Nachbau, Tabellen, CSV ---------- */
  // Marke direkt hinter dem Kacheltitel; ist der Titel zu lang, links neben der Kachel (Lücke zwischen den Spalten)
  const hinterTitel = key => {
    const i = TYPEN.findIndex(x => x.key === key), t = TYPEN[i], b = tw(t.name, 16, true) + tw(", " + KAT[t.kat][0], 16);
    const ueber = b + 26 - W;                                   // Überstand in die Spaltenlücke (20 px) bzw. den Rand
    return ueber <= (i % 4 === 3 ? 12 : 16) || i % 4 === 0 ? { ziel: "t-" + key, versatz: [26, 0] }
      : { ziel: "k-" + key, anker: "links", versatz: [3, -2] };
  };
  // Eingerückter Baum: Titel füllt die Kachel, Marke unten rechts im Visual (dort steht nichts)
  const nachbauOrt = key => key === "eingerueckt" ? { ziel: "g-eingerueckt", versatz: [0, 112] } : hinterTitel(key);
  const nachbau = TYPEN.map((t, i) => ({ id: String.fromCharCode(65 + i), ...nachbauOrt(t.key), titel: t.name, visual: t.pbi,
    felder: {
      baum: "Analysieren: Umsatz; Erklären durch: Bereich, Warengruppe", eingerueckt: "Zeilen: Bereich, Warengruppe (Abstufungslayout); Werte: Umsatz",
      treemap: "Kategorie: Bereich; Details: Warengruppe; Werte: Umsatz", sunburst: "Ersatz: Treemap (Bereich, Warengruppe) oder Matrix mit Teilergebnissen",
      kanten: "Ersatz: Matrix Zeilen Quelle, Spalten Ziel, Wert Anzahl Datenflüsse", sehnen: "Ersatz: Matrix Zeilen Von-Kanal, Spalten Nach-Kanal, Werte Tsd. Kunden",
      blasen: "Ersatz: Balkendiagramm Achse Thema, Werte Nennungen (absteigend sortiert)", balken: "Y-Achse: Warengruppe; X-Achse: Umsatz; Sortierung absteigend",
      karte: "Ort: Bundesland; Farbsättigung: Umsatz je Einwohner (Measure DIVIDE(Umsatz; Einwohner))", globus: "Ersatz: Karte, Breitengrad/Längengrad, Blasengröße: Sitzungen",
      kalender: "Zeilen: Wochentag; Spalten: Kalenderwoche; Werte: Bestellungen", wolke: "Ersatz: Balkendiagramm Achse Begriff, Werte Anzahl (Top 10)" }[t.key],
    format: t.key === "karte" ? "Bedingte Formatierung in fünf Klassen #EFEFEF, #D4D4D4, #A9A9A9, #6E747A, #3A3F44"
      : t.key === "kalender" ? "Hintergrundfarbe nach Regeln (fünf Graustufen), Zellen ohne Werte, Spaltenbreite 14 px"
      : "Graustufen #3A3F44, #6E747A, #A9A9A9, #D4D4D4; Datenbeschriftungen 10,5 pt; ohne Legende und Gitternetz" }));

  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "kopf-titel", versatz: [26, 2], regel: "SAY – Botschaft vermitteln", titel: "Jede Art benannt und erklärt",
        text: "Jede Kachel trägt den Namen der Diagrammart und die Analyseaufgabe; Tooltip und Kopfzeile sagen, wofür die Art geeignet ist und wo ihre Grenzen liegen. Das Original war eine Collage ohne Namen und Erklärung." },
      { nr: 2, ziel: "filter", versatz: [-4, 6], regel: "STRUCTURE – Inhalte ordnen", titel: "Nach Analyseaufgabe geordnet",
        text: "Zeile 1 zeigt Hierarchien, Zeile 2 Netzwerke und Vergleiche, Zeile 3 Raum, Zeit und Text. Der Datenschnitt hebt die Arten einer Aufgabe hervor. Im Original lagen die Diagramme ungeordnet und überlappend nebeneinander." },
      { nr: 3, ziel: hinterTitel("treemap").ziel, versatz: hinterTitel("treemap").versatz, anker: hinterTitel("treemap").anker, regel: "CONDENSE – Kleine Vielfache", titel: "Gleiche Daten, gleiche Größe",
        text: "Alle Kacheln sind gleich groß; Baumdiagramm, eingerückter Baum, Treemap, Sunburst und Balkendiagramm zeigen dasselbe Sortiment (48,2 Mio. €). So sieht man, was jede Art betont: Struktur, Werte, Anteile oder Rangfolge." },
      { nr: 4, ziel: hinterTitel("sunburst").ziel, versatz: hinterTitel("sunburst").versatz, regel: "UNIFY – Semantische Notation", titel: "Graustufen statt Bunt",
        text: "Flächen in Graustufen, Anthrazit für das Wichtigste (größte Themen, Datenflüsse des Data Lake). Das Original verwendete die bunten Standardfarben der Bibliothek, jede Grafik anders." },
      { nr: 5, ziel: hinterTitel("globus").ziel, versatz: hinterTitel("globus").versatz, regel: "SIMPLIFY – Überflüssiges weglassen", titel: "Flacher Globus, waagerechte Wörter",
        text: "Der 3D-Globus mit schwarzem Hintergrund und Leuchtrand wird zur flachen orthografischen Ansicht mit Gradnetz (ohne Küstenlinien); die Wortwolke steht waagerecht statt kreuz und quer. Verkürzte Säulen und verdeckte Rückseite zeigen, warum 3D für Vergleiche ungeeignet ist." },
      { nr: 6, ziel: hinterTitel("balken").ziel, versatz: hinterTitel("balken").versatz, regel: "CHECK – Integrität", titel: "Balken als Referenz",
        text: "Nur das Balkendiagramm erlaubt genaues Ablesen und Vergleichen. Blasen, Sunburst, Sehnen und Wortwolke vermitteln Größenordnungen, verzerren aber Flächen und Winkel – im Tooltip stehen deshalb die genauen Werte und eine bessere Alternative." },
      { nr: 7, ziel: hinterTitel("karte").ziel, versatz: hinterTitel("karte").versatz, regel: "EXPRESS – Passende Darstellung", titel: "Kachelkarte statt Umrisskarte",
        text: "Das Flächenkartogramm zeigt eine Quote (€ je Einwohner) in fünf Graustufen auf gleich großen Kacheln wie Abb. 3.66 – Stadtstaaten bleiben sichtbar. Das Original färbte eine Umrisskarte in Blautönen ohne Legende." },
      { nr: 8, ziel: hinterTitel("kalender").ziel, versatz: hinterTitel("kalender").versatz, regel: "EXPRESS – Lesbar beschriften", titel: "Beschriftung und Legende",
        text: "Monate, Wochentage und eine Graustufenlegende machen die Kalender-Heatmap lesbar; der Winterschlussverkauf Ende Januar fällt sofort auf. Im Original fehlten Beschriftungen, Achsen und Legenden fast überall." },
    ],
    nachbauIntro: "Seitengröße 1024 × 646 px, zwölf gleich große Visuals (233 × 160 px) in drei Zeilen. Schrift Arial: Beschriftungen 10,5 pt, Titel 12 pt fett, Berichtstitel 16,5 pt. Datenmodell: Tabellen Sortiment, Feedback, Bewertungen, Länder, Standorte, Bestellungen, Datenflüsse und Kanalwechsel (in der CSV-Datei durch die Spalte „Datensatz“ getrennt). Sieben Arten gibt es als Standardvisual; für die übrigen ist der Ersatz genannt.",
    nachbau: [...nachbau, { id: "M", ziel: "filter", anker: "links", versatz: [540, 22], titel: "Datenschnitt Analyseaufgabe", visual: "Datenschnitt (Kacheln) oder Lesezeichen",
      felder: "Tabelle Diagrammarten (Art, Aufgabe); Lesezeichen je Aufgabe, die nicht passende Visuals abblenden", format: "Ausgewählt #3A3F44 mit weißer Schrift, sonst weiß mit Rahmen #9A9A9A" }],
    theme: DK.thema(),
    csv: { name: "big_data_diagramme_daten.csv", text: () => {
      const de = v => String(v).replace(".", ","), k = ["Datensatz;Schluessel_1;Schluessel_2;Wert;Einheit"];
      SORT.forEach(s => k.push(["Umsatz Sortiment 2026", s.b, s.n, de(s.v), "Mio. EUR"].join(";")));
      D.themen.forEach(([t, v]) => k.push(["Themen im Kundenfeedback 2026", t, "", v, "Nennungen"].join(";")));
      D.woerter.forEach(([t, v]) => k.push(["Begriffe in Kundenbewertungen 2026", t, "", v, "Anzahl"].join(";")));
      D.laender.forEach(([kz, n, , , v]) => k.push(["Online-Umsatz je Einwohner 2026", kz, n, v, "EUR"].join(";")));
      D.standorte.forEach(([n, la, lo, v]) => k.push(["Webshop-Sitzungen nach Standort 2026", n, `${de(la)}/${de(lo)}`, v, "Tsd."].join(";")));
      const st = new Date(D.tage_start + "T00:00:00");
      D.tage.forEach((v, i) => { const d = new Date(st.getFullYear(), st.getMonth(), st.getDate() + i);
        k.push(["Bestellungen je Tag", `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`, "", v, "Anzahl"].join(";")); });
      D.fluesse.forEach(([a, b]) => k.push(["Datenfluss zwischen Systemen", a, b, 1, "Fluss"].join(";")));
      D.kanaele.forEach((a, i) => D.kanaele.forEach((b, j) => { if (D.wechsel[i][j]) k.push(["Wechsel des Hauptkanals 2026", a, b, D.wechsel[i][j], "Tsd. Kunden"].join(";")); }));
      return k.join("\r\n"); } },
    tabellen: () => {
      const sumT = D.themen.reduce((a, t) => a + t[1], 0), sumW = D.woerter.reduce((a, t) => a + t[1], 0);
      const st = new Date(D.tage_start + "T00:00:00"), mon = [0, 0, 0], tg = [0, 0, 0];
      D.tage.forEach((v, i) => { const m = new Date(st.getFullYear(), st.getMonth(), st.getDate() + i).getMonth(); mon[m] += v; tg[m]++; });
      return [
        { titel: "Sortiment (Baum, eingerückter Baum, Treemap, Sunburst, Balken), Mio. €", kopf: ["Bereich", "Warengruppe", "Umsatz", "Anteil"],
          zeilen: [...BEREICHE.flatMap(b => [...SORT.filter(s => s.b === b.b).map(s => [b.b, s.n, mio(s.v), pz(s.v / GES, 1)]), [b.b, "Summe", mio(b.v), pz(b.v / GES, 1)]]),
                   ["Sortiment", "Gesamt", mio(GES), pz(1, 1)]] },
        { titel: "Themen im Kundenfeedback (Blasendiagramm)", kopf: ["Thema", "Nennungen", "Anteil"], zeilen: D.themen.map(([t, v]) => [t, zahl(v), pz(v / sumT, 1)]) },
        { titel: "Begriffe in Kundenbewertungen (Wortwolke)", kopf: ["Begriff", "Anzahl", "Anteil"], zeilen: D.woerter.map(([t, v]) => [t, zahl(v), pz(v / sumW, 1)]) },
        { titel: "Online-Umsatz je Einwohner (Flächenkartogramm), €", kopf: ["Land", "€ je Einwohner", "Klasse"], zeilen: D.laender.map(([kz, n, , , v]) => [n, zahl(v), KL_TEXT[klasse(v)]]) },
        { titel: "Webshop-Sitzungen nach Standort (Globus), Tsd.", kopf: ["Standort", "Sitzungen"], zeilen: D.standorte.map(([n, , , v]) => [n, zahl(v)]) },
        { titel: "Bestellungen 1. Quartal 2027 (Kalender-Heatmap)", kopf: ["Monat", "Bestellungen", "Ø je Tag"], zeilen: ["Januar", "Februar", "März"].map((m, i) => [m, zahl(mon[i]), zahl(mon[i] / tg[i])]) },
        { titel: "Wechsel des Hauptkanals (Sehnendiagramm), Tsd. Kunden", kopf: ["Von \\ Nach", ...D.kanaele, "Summe"],
          zeilen: D.kanaele.map((a, i) => [a, ...D.wechsel[i].map(v => v ? zahl(v) : NDASH), zahl(D.wechsel[i].reduce((s, v) => s + v, 0))]) },
        { titel: "Datenflüsse zwischen Systemen (Kantenbündelung)", kopf: ["Von", "Nach"], zeilen: D.fluesse.map(f => [f[0], f[1]]) },
      ];
    },
  });
})();
