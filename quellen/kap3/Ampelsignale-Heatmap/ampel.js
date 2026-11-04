/* Einzelvisual „Ampelsignale/Heatmap“ (Abb. 3.64): vier Berichtselemente mit Signal- bzw. Farbcodierung.
   Seite 727 x 640 px = 110 x 96,8 mm. Daten: ampel.json (daten_ampel.py).
   Diagrammtypen bleiben: Kennzahlenliste mit Ampel, Heatmap, Tabelle mit Signalspalte (ABC-Analyse) und Karte mit
   Signalzeichen. Barrierearm: Die drei Ampelstufen unterscheiden sich nicht nur in der Farbe, sondern auch in Form
   (Kreis, Dreieck, Quadrat), Zeichen (✓, !, ✕) und Helligkeit (heller Ring, mittleres Gelb, dunkles Rot). Die Heatmap
   nutzt eine einfarbige Helligkeitsskala statt Rot-Gelb-Grün. Die ABC-Klassen sind keine Bewertung und stehen deshalb
   in Grautönen (A anthrazit, B mittelgrau, C hell mit Kontur), nicht in Ampelfarben. Tabelle und Karte sind
   verbunden: Klick auf eine Zeile oder ein Zeichen hebt die Region in beiden hervor. */
(() => {
  "use strict";
  const { zahl, delta, NBSP, sv, el, PRINT } = DK;
  const AMBER = "#E8A317", AMBER_D = "#8A6100", ROT = "#C62828", GRAU = "#8F8F8F";
  const STUFEN = { gut: "im Ziel", warn: "beobachten", krit: "kritisch", leer: "ohne Wert" };
  const ORDNUNG = ["gut", "warn", "krit", "leer"];
  const pz = (v, nk = 1) => zahl(v, nk) + NBSP + "%";

  /* ---------- Daten ---------- */
  const STAND = DATA.stand;
  const K = DATA.kennzahlen.map(([bereich, name, lang, einheit, ist, ziel, richtung, nk], i) => {
    const q = ist == null ? null : richtung > 0 ? ist / ziel : ziel / ist;
    const stufe = q == null ? "leer" : q >= 1 ? "gut" : q >= 0.95 ? "warn" : "krit";
    return { i, bereich, name, lang, einheit, ist, ziel, richtung, nk, q, stufe };
  });
  const BEREICHE = [...new Set(K.map(k => k.bereich))];
  const JAHRE = DATA.jahre, MON = DATA.monate, HEAT = DATA.heat;
  const HMIN = Math.min(...HEAT.flat()), HMAX = Math.max(...HEAT.flat());
  const JSUM = JAHRE.map((j, n) => HEAT.reduce((s, m) => s + m[n], 0));
  const GRENZEN = DATA.grenzen;
  const RG = (() => {
    const roh = DATA.regionen.map(([plz, u, land, lon, lat], i) => ({ i, plz, u, land, lon, lat }));
    const ges = roh.reduce((s, r) => s + r.u, 0);
    let kum = 0;
    roh.forEach((r, rang) => { kum += r.u; r.rang = rang; r.kum = kum; r.anteil = r.u / ges * 100; r.kumA = kum / ges * 100;
      r.klasse = r.kumA <= GRENZEN[0] ? "A" : r.kumA <= GRENZEN[1] ? "B" : "C"; });
    roh.ges = ges;
    return roh;
  })();
  const KL_TEXT = { A: `bis ${GRENZEN[0]}${NBSP}%`, B: `bis ${GRENZEN[1]}${NBSP}%`, C: "Rest" };
  const OST = ["Berlin", "Brandenburg", "Mecklenburg-Vorpommern", "Sachsen", "Sachsen-Anhalt", "Thüringen"];
  const LANDKURZ = { "Nordrhein-Westfalen": "NRW", "Baden-Württemberg": "Baden-Württemberg" };

  /* ---------- Zustand ---------- */
  const S = { kz: null, monat: null, region: null, sort: null };
  const setze = (k, v) => { S[k] = S[k] === v ? null : v; zeichnen(); };
  addEventListener("keydown", e => {
    if (e.key === "Escape" && (S.kz !== null || S.monat !== null || S.region !== null)) { S.kz = S.monat = S.region = null; zeichnen(); }
  });

  /* ---------- Layout ---------- */
  DK.init({ titel: "Ampelsignale und Heatmap", breite: 727, hoehe: 640 });
  const bA = DK.box("v-ampel", 16, 10, 375, 290);
  const bB = DK.box("v-heatmap", 409, 10, 302, 290);
  DK.haarlinie(312);
  const bC = DK.box("v-abc", 16, 322, 375, 312);
  const bD = DK.box("v-karte", 409, 322, 302, 312);

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
  const passt = (k, b) => k.find(t => DK.tw(t) <= b) || k[k.length - 1];

  /* ---------- Ampelzeichen: Farbe + Form + Zeichen + Helligkeit ---------- */
  function signal(p, cx, cy, stufe, o = {}) {
    const s = o.gr || 1, zeichen = o.zeichen !== false, g = sv("g", {}, p);
    const linie = (x1, y1, x2, y2, farbe) => sv("line", { x1, y1, x2, y2, style: `stroke:${farbe};stroke-width:2;stroke-linecap:round` }, g);
    if (stufe === "gut") {
      sv("circle", { cx, cy, r: 7.2 * s, style: "fill:#FFFFFF;stroke:var(--gut);stroke-width:2" }, g);
      if (zeichen) sv("polyline", { points: `${cx - 3.6 * s},${cy + 0.3 * s} ${cx - 1 * s},${cy + 2.9 * s} ${cx + 3.8 * s},${cy - 2.8 * s}`,
        style: "fill:none;stroke:var(--gut);stroke-width:2;stroke-linecap:round;stroke-linejoin:round" }, g);
    } else if (stufe === "warn") {
      sv("polygon", { points: `${cx},${cy - 8.8 * s} ${cx + 9 * s},${cy + 6.8 * s} ${cx - 9 * s},${cy + 6.8 * s}`,
        style: `fill:${AMBER};stroke:${AMBER_D};stroke-width:1;stroke-linejoin:round` }, g);
      if (zeichen) { linie(cx, cy - 3.4 * s, cx, cy + 1.4 * s, "#1A1A1A"); sv("circle", { cx, cy: cy + 4.3 * s, r: 1.2, style: "fill:#1A1A1A" }, g); }
    } else if (stufe === "krit") {
      sv("rect", { x: cx - 7 * s, y: cy - 7 * s, width: 14 * s, height: 14 * s, style: `fill:${ROT}` }, g);
      if (zeichen) { linie(cx - 3.4 * s, cy - 3.4 * s, cx + 3.4 * s, cy + 3.4 * s, "#FFFFFF"); linie(cx - 3.4 * s, cy + 3.4 * s, cx + 3.4 * s, cy - 3.4 * s, "#FFFFFF"); }
    } else {
      sv("circle", { cx, cy, r: 7.2 * s, style: `fill:#FFFFFF;stroke:${GRAU};stroke-width:1.5;stroke-dasharray:2.5 2` }, g);
      if (zeichen) linie(cx - 3.4 * s, cy, cx + 3.4 * s, cy, GRAU);
    }
    return g;
  }

  /* ---------- ABC-Klassenzeichen: Grautöne und Form, keine Ampelfarben (Klasse ist keine Bewertung) ---------- */
  function klassenZeichen(p, cx, cy, kl, s = 1) {
    if (kl === "A") return sv("circle", { cx, cy, r: 7.2 * s, style: "fill:#3A3F44" }, p);
    if (kl === "B") return sv("polygon", { points: `${cx},${cy - 8.8 * s} ${cx + 9 * s},${cy + 6.8 * s} ${cx - 9 * s},${cy + 6.8 * s}`,
      style: "fill:#8F8F8F;stroke-linejoin:round" }, p);
    return sv("rect", { x: cx - 6.5 * s, y: cy - 6.5 * s, width: 13 * s, height: 13 * s, style: "fill:#D4D4D4;stroke:#6E747A;stroke-width:1" }, p);
  }

  /* ---------- A: Kennzahlenliste mit Ampel ---------- */
  const fmtK = (k, v) => v == null ? "–" : zahl(v, k.nk);
  function botschaftA(b) {
    if (S.kz !== null) {
      const k = K[S.kz];
      if (k.ist == null) return passt([`${k.name} (${k.bereich}): kein Ist-Wert gemeldet`], b);
      return passt([`${k.name}: ${fmtK(k, k.ist)} bei Ziel ${fmtK(k, k.ziel)} ${k.einheit} (${pz(k.q * 100)})`,
        `${k.name}: Zielerreichung ${pz(k.q * 100)}, ${STUFEN[k.stufe]}`], b);
    }
    const kr = K.filter(k => k.stufe === "krit"), wa = K.filter(k => k.stufe === "warn");
    return passt([`${kr.length} von ${K.length} Kennzahlen kritisch: ${kr.map(k => k.name).join(", ")}`,
      `${kr.length} kritisch: ${kr.map(k => k.name).join(", ")}`, `${kr.length} kritisch, ${wa.length} beobachten`], b);
  }
  function liste(ziel, breite, hoehe) {
    ziel.textContent = "";
    const svg = sv("svg", { width: breite, height: hoehe, role: "img", "aria-label": `Kennzahlenliste ${STAND} mit Ampel je Kennzahl` }, ziel);
    // Legende der Stufen
    const gl = sv("g", { id: "a-legende" }, svg);
    const breiten = ORDNUNG.map(s => 22 + DK.tw(STUFEN[s]));
    const abst = (breite - breiten.reduce((a, c) => a + c, 0)) / (ORDNUNG.length - 1);
    let lx = 0;
    ORDNUNG.forEach((s, n) => { signal(gl, lx + 9, 9, s); sv("text", { x: lx + 22, y: 9, dy: "0.35em", class: "muted" }, gl, STUFEN[s]); lx += breiten[n] + abst; });
    // drei Spalten je Bereich
    const sb = breite / BEREICHE.length, kopfY = 46, zh = 23;
    const gk = sv("g", { id: "a-liste" }, svg);
    BEREICHE.forEach((b, c) => {
      const x0 = c * sb;
      sv("text", { x: x0, y: kopfY, style: "font-weight:bold" }, gk, b);
      sv("line", { x1: x0, x2: x0 + sb - 12, y1: kopfY + 7.5, y2: kopfY + 7.5, stroke: "#3A3F44", "stroke-width": 1 }, gk);
      K.filter(k => k.bereich === b).forEach((k, r) => {
        const y = kopfY + 8 + zh * r + zh / 2 + 3, blass = S.kz !== null && S.kz !== k.i;
        const g = sv("g", { class: "dk-klick" + (blass ? " dk-blass" : ""), "data-name": k.name }, gk);
        signal(g, x0 + 9, y, k.stufe);
        sv("text", { x: x0 + 23, y, dy: "0.35em", style: k.stufe === "krit" ? "font-weight:bold" : "" }, g, k.name);
        const hit = sv("rect", { x: x0 - 2, y: y - zh / 2, width: sb - 8, height: zh, fill: "transparent" }, g);
        hit.addEventListener("click", () => setze("kz", k.i));
        tooltip(hit, () => [`${k.lang} (${k.bereich})`,
          k.ist == null ? `Ist: kein Wert · Ziel ${fmtK(k, k.ziel)} ${k.einheit}` : `Ist ${fmtK(k, k.ist)} · Ziel ${fmtK(k, k.ziel)} ${k.einheit}`,
          k.q == null ? "Zielerreichung: –" : `Zielerreichung ${pz(k.q * 100)}${k.richtung < 0 ? " (Ziel ÷ Ist, weniger ist besser)" : ""}`,
          `Ampel: ${STUFEN[k.stufe]} (im Ziel ab 100 %, beobachten ab 95 %)`, "Klick hebt die Kennzahl hervor"]);
      });
    });
  }

  /* ---------- B: Heatmap ---------- */
  const mische = t => {
    const a = [242, 242, 242], z = [58, 63, 68];
    return "#" + a.map((v, n) => Math.round(v + (z[n] - v) * t).toString(16).padStart(2, "0")).join("").toUpperCase();
  };
  function botschaftB(b) {
    const n = JAHRE.length - 1;
    if (S.monat !== null) {
      const m = S.monat, v = HEAT[m][n], vj = HEAT[m][n - 1];
      return passt([`${MON[m]} ${JAHRE[n]}: ${zahl(v)}, ΔVJ ${delta(v - vj, 0)} (${delta((v / vj - 1) * 100, 1, NBSP + "%")})`,
        `${MON[m]} ${JAHRE[n]}: ${zahl(v)} Tsd. €`], b);
    }
    return passt([`Jahresumsatz ${JAHRE[0]}–${JAHRE[n]} ${delta((JSUM[n] / JSUM[0] - 1) * 100, 1, NBSP + "%")}`,
      `${JAHRE[0]}–${JAHRE[n]}: ${delta((JSUM[n] / JSUM[0] - 1) * 100, 1, NBSP + "%")}`], b);
  }
  function heatmap(ziel, breite, hoehe) {
    ziel.textContent = "";
    const svg = sv("svg", { width: breite, height: hoehe, role: "img", "aria-label": `Heatmap: Umsatz je Monat ${JAHRE[0]} bis ${JAHRE[JAHRE.length - 1]}` }, ziel);
    const lw = Math.ceil(Math.max(...MON.map(m => DK.tw(m)))) + 10, cw = (breite - lw) / JAHRE.length, kopf = 20, zh = 17;
    const gk = sv("g", { id: "hm-kopf" }, svg);
    JAHRE.forEach((j, n) => sv("text", { x: lw + cw * (n + 1) - 9, y: 9, dy: "0.35em", "text-anchor": "end", class: "muted" }, gk, String(j)));
    const gz = sv("g", { id: "hm-zellen" }, svg);
    MON.forEach((m, r) => {
      const y = kopf + r * zh, blass = S.monat !== null && S.monat !== r;
      const g = sv("g", { class: blass ? "dk-blass" : "" }, gz);
      sv("text", { x: 0, y: y + zh / 2, dy: "0.35em" }, g, m);
      HEAT[r].forEach((v, n) => {
        const t = (v - HMIN) / (HMAX - HMIN), x = lw + cw * n;
        const c = sv("g", { class: "dk-klick", "data-name": `${m} ${JAHRE[n]}` }, g);
        sv("rect", { x: x + 1, y: y + 0.5, width: cw - 2, height: zh - 1, fill: mische(t) }, c);
        sv("text", { x: x + cw - 9, y: y + zh / 2, dy: "0.35em", "text-anchor": "end", style: t > 0.5 ? "fill:#FFFFFF" : "" }, c, zahl(v));
        const hit = sv("rect", { x: x + 1, y: y + 0.5, width: cw - 2, height: zh - 1, fill: "transparent" }, c);
        hit.addEventListener("click", () => setze("monat", r));
        tooltip(hit, () => {
          const z = [`${m} ${JAHRE[n]}`, `Umsatz ${zahl(v)} Tsd. €`];
          if (n > 0) z.push(`ΔVJ ${delta(v - HEAT[r][n - 1], 0)} Tsd. € (${delta((v / HEAT[r][n - 1] - 1) * 100, 1, NBSP + "%")})`);
          const rang = HEAT.map(x => x[n]).sort((a, c) => c - a).indexOf(v) + 1;
          z.push(`Rang ${rang} von 12 im Jahr ${JAHRE[n]}`, "Klick hebt den Monat hervor");
          return z;
        });
      });
    });
    const ys = kopf + MON.length * zh;
    const gs = sv("g", { id: "hm-summe" }, svg);
    sv("line", { x1: 0, x2: breite, y1: ys + 1.5, y2: ys + 1.5, stroke: "#3A3F44", "stroke-width": 1 }, gs);
    sv("text", { x: 0, y: ys + 12, dy: "0.35em", style: "font-weight:bold" }, gs, "Summe");
    JSUM.forEach((v, n) => sv("text", { x: lw + cw * (n + 1) - 9, y: ys + 12, dy: "0.35em", "text-anchor": "end", style: "font-weight:bold" }, gs, zahl(v)));
  }

  /* ---------- C: ABC-Tabelle mit Signalspalte ---------- */
  const tsd = v => zahl(v / 1000, 1);
  function botschaftC(b) {
    if (S.region !== null) {
      const r = RG[S.region];
      return passt([`PLZ ${r.plz}: ${tsd(r.u)} Tsd. € (${pz(r.anteil)}), kumuliert ${pz(r.kumA)} → Klasse ${r.klasse}`,
        `PLZ ${r.plz}: ${tsd(r.u)} Tsd. €, Klasse ${r.klasse}`], b);
    }
    const a = RG.filter(r => r.klasse === "A"), aA = a[a.length - 1].kumA;
    return passt([`${a.length} von ${RG.length} Regionen bringen ${pz(aA, 0)} des Umsatzes (Klasse A)`,
      `${a.length} Regionen = ${pz(aA, 0)} des Umsatzes (Klasse A)`], b);
  }
  function tabelle(ziel) {
    ziel.textContent = "";
    const SP = [["region", "Region", 66, "left"], ["u", "Umsatz", 72], ["kum", "kumuliert", 82], ["kumA", "kum. Anteil", 88], ["klasse", "Klasse", 67, "left"]];
    const t = el("table", { class: "dk-matrix", id: "abc-tabelle", style: "table-layout:fixed;width:375px" }, ziel);
    const kopf = el("tr", {}, el("thead", {}, t));
    SP.forEach(([key, titel, w, al]) => {
      const th = el("th", { style: `width:${w}px;${al ? "text-align:left;" : ""}`, id: "abc-kopf-" + key }, kopf, titel);
      if (!PRINT) {
        th.classList.add("dk-sortierbar"); th.title = "Klick sortiert";
        th.addEventListener("click", () => {
          S.sort = S.sort && S.sort.key === key ? { key, ab: !S.sort.ab } : { key, ab: key !== "region" && key !== "klasse" };
          zeichnen();
        });
        if (S.sort && S.sort.key === key) th.appendChild(document.createTextNode(S.sort.ab ? " ▾" : " ▴"));
      }
    });
    const tb = el("tbody", {}, t);
    const wert = (r, key) => key === "region" ? Number(r.plz) : key === "klasse" ? r.rang : r[key];
    const zeilen = RG.slice();
    if (S.sort) zeilen.sort((a, b) => (wert(a, S.sort.key) - wert(b, S.sort.key)) * (S.sort.ab ? -1 : 1));
    const H = "height:17px;line-height:15px";
    zeilen.forEach(r => {
      const tr = el("tr", { class: "dk-zeile" + (S.region !== null && S.region !== r.i ? " dk-blass" : "") }, tb);
      el("td", { style: H + ";text-align:left" }, tr, "PLZ " + r.plz);
      el("td", { style: H }, tr, tsd(r.u));
      el("td", { style: H }, tr, tsd(r.kum));
      el("td", { style: H }, tr, pz(r.kumA));
      const td = el("td", { style: H + ";text-align:left;padding-left:6px" }, tr);
      const s = sv("svg", { width: 18, height: 15, style: "display:inline-block;vertical-align:-3px;overflow:visible" }, td);
      klassenZeichen(s, 8, 7.5, r.klasse, 0.82);
      td.appendChild(document.createTextNode(" " + r.klasse));
      tr.addEventListener("click", () => setze("region", r.i));
      tooltip(tr, () => [`PLZ-Region ${r.plz} (${r.land})`, `Umsatz ${DATA.quartal}: ${tsd(r.u)} Tsd. € · Anteil ${pz(r.anteil)}`,
        `Rang ${r.rang + 1}, kumuliert ${pz(r.kumA)} → Klasse ${r.klasse} (${KL_TEXT[r.klasse]})`,
        ...(r.u < 0 ? ["Negativer Umsatz (Gutschrift): kumulierter Anteil davor über 100 %"] : []), "Klick hebt die Region auch in der Karte hervor"]);
    });
    const ts = el("tr", { class: "dk-summe" }, tb);
    ["Summe", tsd(RG.ges), "", "", ""].forEach((v, n) => el("td", { style: H + (n === 0 ? ";text-align:left" : "") }, ts, v));
  }

  /* ---------- D: Karte mit Signalzeichen ---------- */
  function botschaftD(b) {
    if (S.region !== null) {
      const r = RG[S.region];
      return passt([`PLZ ${r.plz} (${LANDKURZ[r.land] || r.land}): Klasse ${r.klasse}`, `PLZ ${r.plz}: Klasse ${r.klasse}`], b);
    }
    const zaehl = {};
    RG.forEach(r => { zaehl[r.land] = (zaehl[r.land] || 0) + 1; });
    const [land, n] = Object.entries(zaehl).sort((a, c) => c[1] - a[1])[0];
    const ost = RG.filter(r => OST.includes(r.land)).length;
    const k = `${n} von ${RG.length} in ${LANDKURZ[land] || land}`;
    return passt([`${ost ? `${ost} Regionen im Osten` : "Keine Region im Osten"}, ${k}`, k], b);
  }
  function karte(ziel, breite, hoehe) {
    ziel.textContent = "";
    const svg = sv("svg", { width: breite, height: hoehe, role: "img", "aria-label": "Karte Deutschlands mit den PLZ-Regionen, Zeichen nach ABC-Klasse" }, ziel);
    const U = DATA.umriss, KX = Math.cos(51.2 * Math.PI / 180);
    const lon0 = Math.min(...U.map(p => p[0])), lat1 = Math.max(...U.map(p => p[1])), lat0 = Math.min(...U.map(p => p[1]));
    const k = (hoehe - 8) / (lat1 - lat0), ox = 4, oy = 4;
    const px = (lon, lat) => [ox + (lon - lon0) * KX * k, oy + (lat1 - lat) * k];
    const gm = sv("g", { id: "ka-karte" }, svg);
    sv("polygon", { points: U.map(p => px(...p).join(",")).join(" "), fill: "#EFEFEF", stroke: "#C9C9C9", "stroke-width": 1, "stroke-linejoin": "round" }, gm);
    // Lage je Region; überlappende Zeichen leicht auseinanderschieben (Mindestabstand 15 px)
    const P = RG.map(r => { const [x, y] = px(r.lon, r.lat); return { r, x, y }; });
    for (let it = 0; it < 80; it++) {
      for (let a = 0; a < P.length; a++) for (let c = a + 1; c < P.length; c++) {
        let dx = P[c].x - P[a].x, dy = P[c].y - P[a].y, d = Math.hypot(dx, dy);
        if (d >= 15) continue;
        if (d < 0.01) { dx = 1; dy = 0.3; d = Math.hypot(dx, dy); }
        const m = (15 - d) / 2 / d;
        P[a].x -= dx * m; P[a].y -= dy * m; P[c].x += dx * m; P[c].y += dy * m;
      }
    }
    const gp = sv("g", { id: "ka-zeichen" }, svg);
    P.slice().sort((a, c) => (a.r.klasse > c.r.klasse ? -1 : 1)).forEach(({ r, x, y }) => {
      const g = sv("g", { class: "dk-klick" + (S.region !== null && S.region !== r.i ? " dk-blass" : ""), "data-name": "PLZ " + r.plz }, gp);
      klassenZeichen(g, x, y, r.klasse, 0.82);
      if (S.region === r.i) sv("circle", { cx: x, cy: y, r: 11, fill: "none", stroke: "#1A1A1A", "stroke-width": 1.5 }, g);
      const hit = sv("circle", { cx: x, cy: y, r: 9, fill: "transparent" }, g);
      hit.addEventListener("click", () => setze("region", r.i));
      tooltip(hit, () => [`PLZ-Region ${r.plz} (${r.land})`, `Umsatz ${tsd(r.u)} Tsd. € · Anteil ${pz(r.anteil)}`,
        `Klasse ${r.klasse} (kumuliert ${pz(r.kumA)})`, "Klick hebt die Region auch in der Tabelle hervor"]);
    });
    // Legende rechts
    const gl = sv("g", { id: "ka-legende" }, svg), lx = breite - 92, ly = hoehe - 112;
    sv("text", { x: lx, y: ly, dy: "0.35em", class: "muted" }, gl, "ABC-Klasse");
    ["A", "B", "C"].forEach((kl, n) => {
      const y = ly + 24 + n * 24;
      klassenZeichen(gl, lx + 8, y, kl, 0.82);
      const t = sv("text", { x: lx + 22, y, dy: "0.35em" }, gl);
      sv("tspan", { style: "font-weight:bold" }, t, kl + " ");
      sv("tspan", { class: "muted", style: "fill:#4D4D4D" }, t, KL_TEXT[kl]);
    });
  }

  /* ---------- Zeichnen ---------- */
  function zeichnen() {
    let v = DK.visual(bA, { titel: `Kennzahlenstatus ${STAND}`, botschaft: botschaftA(375) });
    liste(v.flaeche, v.breite, v.hoehe);
    v = DK.visual(bB, { titel: "Umsatz je Monat", einheit: "Tsd. €", botschaft: botschaftB(302) });
    heatmap(v.flaeche, v.breite, v.hoehe);
    v = DK.visual(bC, { titel: "ABC-Analyse Umsatz Q1 2027", einheit: "Tsd. €", botschaft: botschaftC(375) });
    tabelle(v.flaeche);
    v = DK.visual(bD, { titel: "ABC-Klassen nach Lage", botschaft: botschaftD(302) });
    karte(v.flaeche, v.breite, v.hoehe);
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  /* ---------- Lernplattform ---------- */
  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "v-ampel", anker: "links", versatz: [378, 24], regel: "SAY – Botschaft vermitteln", titel: "Jedes Element mit Aussage",
        text: "Über jedem der vier Elemente stehen Inhalt und eine aus den Daten berechnete Aussage – etwa „2 von 18 Kennzahlen kritisch“. Die Originale waren Ausschnitte aus Programmfenstern ohne Aussage, teils mit englischen Begriffen." },
      { nr: 2, ziel: "a-legende", anker: "links", versatz: [407, 1], regel: "UNIFY – Barrierearme Ampel", titel: "Farbe, Form, Zeichen, Helligkeit",
        text: "Die drei Stufen sind vierfach unterscheidbar: Farbe (Blaugrün, Gelb, Rot), Form (Kreis, Dreieck, Quadrat), Zeichen (✓, !, ✕) und Helligkeit (heller Ring, mittleres Gelb, dunkles Rot). Im Original waren es gleich geformte rote, gelbe und grüne Kugeln – für rot-grün-farbenfehlsichtige Leser und im Schwarz-Weiß-Druck kaum zu unterscheiden." },
      { nr: 3, ziel: "a-liste", anker: "links", versatz: [244, 29], regel: "CHECK – Grenzen der Ampel", titel: "Ampel sagt nicht, wie weit",
        text: "Eine Ampel verdichtet jede Kennzahl auf drei Stufen: „Aufträge“ mit 90 % Zielerreichung und eine Kennzahl mit 50 % sähen gleich aus, und knapp unter 95 % springt die Ampel auf Rot. Besser zeigen Abweichungsbalken nach Wirkung (Abb. 3.16) oder ein Bullet-Chart (Abb. 3.54) Ist, Ziel und Abstand. Hier stehen die Werte wenigstens im Tooltip." },
      { nr: 4, ziel: "a-liste", anker: "links", versatz: [294, 190], regel: "EXPRESS – Ausnahmen betonen", titel: "Nur Kritisches ist laut",
        text: "„Im Ziel“ ist ein heller Ring, „kritisch“ ein dunkles Quadrat mit fettem Namen – der Blick fällt zuerst auf die Ausnahmen. Im Original waren alle Punkte gleich auffällig; Unterstreichungen als Links und Glanzeffekte entfallen." },
      { nr: 5, ziel: "hm-zellen", anker: "links", versatz: [59, 70], regel: "UNIFY – Eine Farbe für die Heatmap", titel: "Helligkeit statt Rot-Gelb-Grün",
        text: "Je höher der Umsatz, desto dunkler die Zelle – eine einfarbige Skala, lesbar auch in Graustufen. Das Original bewertete die Werte mit Rot-Gelb-Grün, ohne dass ein Ziel bekannt war. Grenze der Heatmap: Farbstufen lassen sich nur grob vergleichen, deshalb stehen die Werte in den Zellen; für Verläufe sind Säulen (Abb. 3.48) genauer." },
      { nr: 6, ziel: "hm-summe", anker: "links", versatz: [81, 2], regel: "STRUCTURE – Inhalte ordnen", titel: "Monate in Folge, Summe darunter",
        text: "Monate in natürlicher Reihenfolge, Jahre nebeneinander, die Jahressumme als letzte Zeile ohne Farbe. Das Original nutzte englische Monatsnamen, Spaltenbuchstaben und Zeilennummern der Tabellenkalkulation." },
      { nr: 7, ziel: "abc-kopf-klasse", anker: "links", versatz: [81, 2], regel: "CHECK – Farbe bewertet", titel: "ABC-Klasse ist keine Bewertung",
        text: "Das Original färbte die ABC-Klassen wie eine Ampel: A grün, B gelb, C rot. Ampelfarben bewerten aber – Rot suggeriert ein Problem, obwohl C nur „kleiner Umsatzanteil“ heißt. Hier steht die Klasse als Buchstabe mit einem Zeichen in Grautönen: A anthrazit, B mittelgrau, C hell. Die Ampelfarben bleiben den Kennzahlen oben vorbehalten, die tatsächlich ein Ziel haben. Für ABC-Analysen ist eine Konzentrationskurve (Abb. 3.22) aussagekräftiger. Die Gutschrift in PLZ 81 stammt aus dem Original – davor liegt der kumulierte Anteil über 100 %." },
      { nr: 8, ziel: "ka-karte", anker: "links", versatz: [155, 100], regel: "SIMPLIFY – Karte nur mit Raumbezug", titel: "Umriss statt bunter Länder",
        text: "Die Karte zeigt nur, wo die Regionen liegen: alle im Westen und Süden, sieben in Nordrhein-Westfalen. Die bunten Länderflächen des Originals trugen keine Information und konkurrierten mit den Klassenzeichen. Tabelle und Karte sind verbunden – Klick auf eine Zeile oder ein Zeichen hebt die Region in beiden hervor, Esc hebt auf." },
    ],
    nachbauIntro: "Seitengröße benutzerdefiniert 727 × 640 px, vier Visuals. Schrift Arial: Beschriftungen 10,5 pt, Titel 12 pt. Datenmodell: drei Tabellen (Kennzahlen, Monatsumsatz, Regionsumsatz) wie in der CSV-Datei.",
    nachbau: [
      { id: "A", ziel: "a-liste", versatz: [0, 0], titel: "Kennzahlenliste", visual: "Tabelle (Standardvisual), je Bereich eine – drei nebeneinander mit Visualfilter Bereich",
        felder: "Kennzahl; Measure Zielerreichung = IF([Richtung] > 0; DIVIDE([Ist]; [Ziel]); DIVIDE([Ziel]; [Ist]))",
        format: "Bedingte Formatierung › Symbole nach Regel: ≥ 1 Häkchen, ≥ 0,95 Ausrufezeichen, < 0,95 Kreuz; Symbol links vom Wert, nur Symbol anzeigen; Spaltenkopf aus",
        hinweis: "Die Standardsymbolsätze unterscheiden sich in Form und Zeichen (z. B. „3 Symbole (eingekreist)“). Eigene Zeichen wie hier: Measure mit SVG-Text, Datenkategorie „Bild-URL“." },
      { id: "B", ziel: "hm-zellen", anker: "links", versatz: [59, 70], titel: "Heatmap", visual: "Matrix (Standardvisual)",
        felder: "Zeilen: Monat (sortiert nach Monatsnummer); Spalten: Jahr; Werte: Summe Umsatz; Gesamtergebnis für Zeilen ein",
        format: "Bedingte Formatierung › Hintergrundfarbe: Farbskala Minimum #F2F2F2, Maximum #3A3F44; Schriftfarbe nach Regel: ab 758 (Mitte) #FFFFFF; Gesamtzeile ohne Formatierung, fett" },
      { id: "C", ziel: "abc-tabelle", anker: "links", versatz: [389, 2], titel: "ABC-Tabelle", visual: "Tabelle (Standardvisual)",
        felder: "PLZ-Region; Umsatz; Measure Kumuliert = SUMX(WINDOW(1; ABS; 0; REL; ALLSELECTED(Region[PLZ]); ORDERBY([Umsatz]; DESC)); [Umsatz]); Measure kum. Anteil = DIVIDE([Kumuliert]; CALCULATE([Umsatz]; ALLSELECTED())); Measure Klasse = SWITCH(TRUE(); [kum. Anteil] <= 0,7; \"A\"; [kum. Anteil] <= 0,9; \"B\"; \"C\")",
        format: "Sortierung nach Umsatz absteigend; Spalte Klasse mit Zeichen in Grautönen (A Kreis #3A3F44, B Dreieck #8F8F8F, C Quadrat #D4D4D4 mit Kontur #6E747A)",
        hinweis: "Die Standardsymbolsätze sind farbig (Ampel); graue Zeichen über eine Measure mit SVG-Text, Datenkategorie „Bild-URL“ – oder nur den Klassenbuchstaben zeigen." },
      { id: "D", ziel: "ka-karte", anker: "links", versatz: [155, 100], titel: "Karte", visual: "Azure-Karte (Standardvisual), Blasenebene",
        felder: "Breitengrad, Längengrad je PLZ-Region; Legende: Klasse; QuickInfo: Umsatz, kum. Anteil",
        format: "Blasenfarben A #3A3F44, B #8F8F8F, C #D4D4D4 mit Rand #6E747A; Kartenstil „Graustufen hell“; Kategoriebeschriftung Klasse ein",
        hinweis: "Die Standardkarte kennt keine Formen je Kategorie; die Klasse steht deshalb als Beschriftung an der Blase. Wechselwirkung Tabelle ↔ Karte: Hervorheben (Standard)." },
    ],
    theme: DK.thema(),
    csv: { name: "ampelsignale_heatmap_daten.csv", text: () => {
      const cz = (v, nk) => zahl(v, nk).replace(/\./g, "").replace("\u2212", "-");
      const z = ["Element;Gruppe;Objekt;Periode;Einheit;Ist;Ziel;Richtung"];
      K.forEach(k => z.push(["Kennzahlenliste", k.bereich, k.name, STAND, k.einheit, k.ist == null ? "" : cz(k.ist, k.nk),
        cz(k.ziel, k.nk), k.richtung].join(";")));
      MON.forEach((m, r) => JAHRE.forEach((j, n) => z.push(["Heatmap", "", m, j, "Tsd. €", HEAT[r][n], "", ""].join(";"))));
      RG.forEach(r => z.push(["ABC-Analyse", r.land, "PLZ " + r.plz, DATA.quartal, "€", cz(r.u, 2), "", ""].join(";")));
      return z.join("\r\n"); } },
    tabellen: () => [
      { titel: `Kennzahlenstatus ${STAND}`, kopf: ["Bereich", "Kennzahl", "Einheit", "Ist", "Ziel", "Zielerreichung", "Ampel"],
        zeilen: K.map(k => [k.bereich, k.name, k.einheit, fmtK(k, k.ist), fmtK(k, k.ziel), k.q == null ? "–" : pz(k.q * 100), STUFEN[k.stufe]]) },
      { titel: "Umsatz je Monat (Tsd. €)", kopf: ["Monat", ...JAHRE.map(String)],
        zeilen: [...MON.map((m, r) => [m, ...HEAT[r].map(v => zahl(v))]), ["Summe", ...JSUM.map(v => zahl(v))]] },
      { titel: `ABC-Analyse Umsatz ${DATA.quartal} (Tsd. €)`, kopf: ["PLZ-Region", "Bundesland", "Umsatz", "Anteil", "kumuliert", "kum. Anteil", "Klasse"],
        zeilen: [...RG.map(r => ["PLZ " + r.plz, r.land, tsd(r.u), pz(r.anteil), tsd(r.kum), pz(r.kumA), r.klasse]), ["Summe", "", tsd(RG.ges), pz(100), "", "", ""]] },
    ],
  });
  zeichnen();
})();
