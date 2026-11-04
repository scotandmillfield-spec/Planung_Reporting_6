/* Einzelvisual „Verzerrungen durch 3D-Effekte“ (Abb. 3.73): Umsatz 2027 je Quartal, Plan und Ist, gesamt und je Region –
   a) als 3D-Säulendiagramm wie im Original (Negativbeispiel: der 3D-Fehler bleibt sichtbar, nachgebildet als
   Schrägprojektion in SVG), b) dieselben Werte ohne 3D als kleine Vielfache nach IBCS (Ergänzung, Muster Abb. 3.53).
   Seite 727 x 560 px = 110 x 84,7 mm. Daten: verzerrung_3d.json (daten_3d.py), Werte des Originals.
   Klick auf eine Säule hebt das Quartal in beiden Teilen hervor. */
(() => {
  "use strict";
  const { zahl, delta, NBSP, sv, el, FARBE } = DK;
  const Q = DATA.quartale, J = DATA.jahr, [A0, A1, AS] = DATA.achse;
  const summe = a => a.reduce((s, v) => s + v, 0);
  const REIHEN = [
    { name: "Gesamt", titel: "Gesamt", plan: Q.map((_, q) => DATA.plan[0][q] + DATA.plan[1][q]), ist: Q.map((_, q) => DATA.ist[0][q] + DATA.ist[1][q]) },
    ...DATA.regionen.map((r, i) => ({ name: r, titel: "Region " + r, plan: DATA.plan[i], ist: DATA.ist[i] })),
  ];
  // Kategorien des 3D-Diagramms wie im Original: Plan (gesamt, Süd, Nord), Ist (gesamt, Süd, Nord)
  const KAT = [];
  ["Plan", "Ist"].forEach(sz => REIHEN.forEach(r => KAT.push({ sz, reihe: r.name, werte: sz === "Plan" ? r.plan : r.ist })));
  const S = { q: null };
  const auswaehlen = q => { S.q = S.q === q ? null : q; zeichnen(); };
  addEventListener("keydown", e => { if (e.key === "Escape" && S.q !== null) { S.q = null; zeichnen(); } });

  DK.init({ titel: "Verzerrungen durch 3D-Effekte", breite: 727, hoehe: 560 });
  const bA = DK.box("v-3d", 16, 10, 695, 294);
  DK.haarlinie(314);
  const bB = DK.box("v-2d", 16, 324, 695, 228);

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

  /* ---------- a) 3D-Säulen in Schrägprojektion ---------- */
  const OX = 20, OY = 9, VORN = 0.2, TIEFE = 0.6;                 // Versatz je Tiefenreihe (Quartal), Säulentiefe
  const FUELL = ["#3A3F44", "#6E747A", "#A9A9A9", "#D4D4D4"];       // Q1 vorn dunkel … Q4 hinten hell
  const misch = (hex, ziel, a) => "#" + [1, 3, 5].map(i => {
    const v = parseInt(hex.slice(i, i + 2), 16), z = parseInt(ziel.slice(i, i + 2), 16);
    return Math.round(v + (z - v) * a).toString(16).padStart(2, "0");
  }).join("");
  function geometrie(hoehe) {
    const X0 = 40, Y0 = hoehe - 42, k = (Y0 - 4 * OY - 8) / A1, slot = 87, luecke = 0.3 * slot, bw = 42;
    const W = 6 * slot + luecke, xc = c => X0 + slot * (c + 0.5) + (c >= 3 ? luecke : 0);
    const P = (x, d, v) => [x + d * OX, Y0 - d * OY - v * k];
    return { X0, Y0, k, slot, bw, W, xc, P };
  }
  function quader(G, c, r, v) {
    const x0 = G.xc(c) - G.bw / 2, x1 = x0 + G.bw, d0 = r + VORN, d1 = d0 + TIEFE, P = G.P;
    return {
      front: [P(x0, d0, 0), P(x1, d0, 0), P(x1, d0, v), P(x0, d0, v)],
      oben: [P(x0, d0, v), P(x1, d0, v), P(x1, d1, v), P(x0, d1, v)],
      seite: [P(x1, d0, 0), P(x1, d1, 0), P(x1, d1, v), P(x1, d0, v)],
      huelle: [P(x0, d0, 0), P(x1, d0, 0), P(x1, d1, 0), P(x1, d1, v), P(x0, d1, v), P(x0, d0, v)],
    };
  }
  const pts = a => a.map(p => p.map(z => z.toFixed(1)).join(",")).join(" ");
  const innen = (poly, [x, y]) => {                                  // konvexes Polygon
    let vz = 0;
    for (let i = 0; i < poly.length; i++) {
      const [ax, ay] = poly[i], [bx, by] = poly[(i + 1) % poly.length];
      const k = (bx - ax) * (y - ay) - (by - ay) * (x - ax);
      if (Math.abs(k) < 1e-9) continue;
      if (vz === 0) vz = Math.sign(k); else if (Math.sign(k) !== vz) return false;
    }
    return true;
  };
  // Kennwerte der Verzerrung: Anteil der verdeckten Vorderseite, an der Rückwand abgelesener Wert
  function analyse(G) {
    const saeulen = [];
    KAT.forEach((kt, c) => Q.forEach((q, r) => saeulen.push({ c, r, kt, v: kt.werte[r], f: quader(G, c, r, kt.werte[r]) })));
    saeulen.forEach(s => {
      const davor = saeulen.filter(t => t.r < s.r);
      let n = 0, verdeckt = 0;
      const [[x0, yb], [x1]] = s.f.front, yt = s.f.front[2][1];
      for (let i = 0; i < 12; i++) for (let j = 0; j < 12; j++) {
        const p = [x0 + (x1 - x0) * (i + 0.5) / 12, yt + (yb - yt) * (j + 0.5) / 12];
        n++;
        if (davor.some(t => innen(t.f.huelle, p))) verdeckt++;
      }
      s.verdeckt = verdeckt / n;
      s.rueckwand = s.v - (4 - (s.r + VORN)) * OY / G.k;
    });
    return saeulen;
  }
  function dreiD(ziel, breite, hoehe) {
    ziel.textContent = "";
    const G = geometrie(hoehe), P = G.P, { X0, Y0, W } = G;
    const svg = sv("svg", { width: breite, height: hoehe, role: "img", "aria-label": "3D-Säulendiagramm Umsatz je Quartal, Plan und Ist, gesamt und je Region" }, ziel);
    const gR = sv("g", { id: "d3-raum" }, svg);
    sv("polygon", { points: pts([P(X0, 0, 0), P(X0 + W, 0, 0), P(X0 + W, 4, 0), P(X0, 4, 0)]), fill: "#E2E2E2" }, gR);
    sv("polygon", { points: pts([P(X0, 0, 0), P(X0, 4, 0), P(X0, 4, A1), P(X0, 0, A1)]), fill: "#F2F2F2" }, gR);
    sv("polygon", { points: pts([P(X0, 4, 0), P(X0 + W, 4, 0), P(X0 + W, 4, A1), P(X0, 4, A1)]), fill: "#F2F2F2" }, gR);
    const gA = sv("g", { id: "d3-achse" }, svg);
    for (let g = A0; g <= A1; g += AS) {
      sv("polyline", { points: pts([P(X0, 0, g), P(X0, 4, g), P(X0 + W, 4, g)]), fill: "none", stroke: "#BDBDBD", "stroke-width": 1 }, gR);
      const [x, y] = P(X0, 0, g);
      sv("text", { x: x - 6, y, dy: "0.35em", "text-anchor": "end", class: "muted" }, gA, zahl(g));
    }
    const gS = sv("g", { id: "d3-saeulen" }, svg);
    const an = analyse(G);
    for (let r = Q.length - 1; r >= 0; r--) KAT.forEach((kt, c) => {
      const s = an.find(x => x.c === c && x.r === r), f = s.f, fu = FUELL[r];
      const g = sv("g", { class: "dk-klick" + (S.q !== null && S.q !== r ? " dk-blass" : ""), "data-name": `${kt.sz} ${kt.reihe} ${Q[r]}` }, gS);
      sv("polygon", { points: pts(f.seite), fill: misch(fu, "#000000", 0.28), stroke: "#FFFFFF", "stroke-width": 0.5 }, g);
      sv("polygon", { points: pts(f.oben), fill: misch(fu, "#FFFFFF", 0.35), stroke: "#FFFFFF", "stroke-width": 0.5 }, g);
      sv("polygon", { points: pts(f.front), fill: fu, stroke: "#FFFFFF", "stroke-width": 0.5 }, g);
      const hit = sv("polygon", { points: pts(f.huelle), fill: "transparent" }, g);
      hit.addEventListener("click", () => auswaehlen(r));
      tooltip(hit, () => [`${kt.sz} ${kt.reihe === "Gesamt" ? "gesamt" : "Region " + kt.reihe}, ${Q[r]} ${J}`, `Wert ${zahl(s.v)} Mio. €`,
        `An der Rückwand abgelesen: ${zahl(s.rueckwand)} Mio. €`, `Vorderseite verdeckt: ${zahl(s.verdeckt * 100)}${NBSP}%`, "Klick hebt das Quartal in beiden Teilen hervor"]);
    });
    // Beschriftung: Kategorien unter der Vorderkante, Plan/Ist darunter, Quartale an der Tiefenachse
    const gK = sv("g", { id: "d3-kategorien" }, svg);
    KAT.forEach((kt, c) => sv("text", { x: P(G.xc(c), VORN, 0)[0], y: Y0 + 13, dy: "0.35em", "text-anchor": "middle" }, gK, kt.reihe));
    ["Plan", "Ist"].forEach((sz, i) => {
      const xa = P(G.xc(3 * i), VORN, 0)[0] - G.bw / 2, xb = P(G.xc(3 * i + 2), VORN, 0)[0] + G.bw / 2;
      sv("line", { x1: xa, x2: xb, y1: Y0 + 24.5, y2: Y0 + 24.5, stroke: "#8C8C8C", "stroke-width": 1 }, gK);
      sv("text", { x: (xa + xb) / 2, y: Y0 + 34, dy: "0.35em", "text-anchor": "middle", style: "font-weight:bold" }, gK, sz);
    });
    const gT = sv("g", { id: "d3-tiefe" }, svg);
    Q.forEach((q, r) => {
      const [x, y] = P(X0 + W, r + 0.5, 0);
      sv("text", { x: x + 5, y, dy: "0.35em", class: S.q !== null && S.q !== r ? "muted" : "", style: S.q === r ? "font-weight:bold" : "" }, gT, q);
    });
    return an;
  }

  /* ---------- b) ohne 3D: kleine Vielfache, Ist gefüllt, Plan als Kontur ---------- */
  function zweiD(ziel, breite, hoehe) {
    ziel.textContent = "";
    const svg = sv("svg", { width: breite, height: hoehe, role: "img", "aria-label": "Säulendiagramme Umsatz je Quartal, Plan und Ist: gesamt, Region Süd, Region Nord" }, ziel);
    const links = 34, abst = 20, pw = (breite - links - 2 * abst) / 3;
    const oben = 40, basis = hoehe - 44, max = Math.max(...REIHEN.flatMap(r => [...r.plan, ...r.ist])), k = (basis - oben) / max;
    const fach = pw / Q.length, sb = 20, vers = 5;
    sv("text", { x: 0, y: basis + 34, dy: "0.35em", class: "muted" }, svg, "ΔPL");
    // Legende rechts oben
    const gl = sv("g", { id: "d2-legende" }, svg);
    const lx = breite - DK.tw("Plan") - DK.tw("Ist") - 52;
    sv("rect", { x: lx, y: 2, width: 12, height: 12, fill: "#3A3F44" }, gl);
    sv("text", { x: lx + 17, y: 8, dy: "0.35em", class: "muted" }, gl, "Ist");
    const lx2 = lx + 17 + DK.tw("Ist") + 14;
    sv("rect", { x: lx2 + 0.5, y: 2.5, width: 11, height: 11, fill: "#FFFFFF", stroke: "#3A3F44", "stroke-width": 1 }, gl);
    sv("text", { x: lx2 + 17, y: 8, dy: "0.35em", class: "muted" }, gl, "Plan");
    REIHEN.forEach((R, p) => {
      const x0 = links + p * (pw + abst);
      const gp = sv("g", { id: "d2-" + R.name.toLowerCase().replace("ü", "ue") }, svg);
      sv("text", { x: x0, y: 8, dy: "0.35em", style: "font-weight:bold" }, gp, R.titel);
      sv("line", { x1: x0, x2: x0 + pw, y1: basis + 0.5, y2: basis + 0.5, stroke: "#8C8C8C", "stroke-width": 1 }, gp);
      Q.forEach((q, i) => {
        const cx = x0 + fach * (i + 0.5), pl = R.plan[i], is = R.ist[i], d = is - pl, blass = S.q !== null && S.q !== i;
        const g = sv("g", { class: "dk-klick" + (blass ? " dk-blass" : ""), "data-name": `${R.name} ${q}` }, gp);
        sv("rect", { x: cx - sb / 2 - vers + 0.5, y: basis - pl * k + 0.5, width: sb - 1, height: pl * k - 1, fill: "#FFFFFF", stroke: "#3A3F44", "stroke-width": 1 }, g);
        sv("rect", { x: cx - sb / 2 + vers, y: basis - is * k, width: sb, height: is * k, fill: "#3A3F44" }, g);
        sv("text", { x: cx + vers, y: basis - Math.max(is, pl) * k - 7, "text-anchor": "middle" }, g, zahl(is));
        sv("text", { x: cx, y: basis + 13, dy: "0.35em", "text-anchor": "middle", class: "muted" }, g, q);
        sv("text", { x: cx, y: basis + 34, dy: "0.35em", "text-anchor": "middle",
          style: `font-weight:bold;fill:${d > 0 ? FARBE.gut : d < 0 ? FARBE.schlecht : "var(--text)"}` }, g, delta(d, 0));
        const hit = sv("rect", { x: cx - fach / 2, y: oben - 22, width: fach, height: hoehe - oben + 22, fill: "transparent" }, g);
        hit.addEventListener("click", () => auswaehlen(i));
        tooltip(hit, () => [`${R.titel}, ${q} ${J}`, `Ist ${zahl(is)} Mio. € · Plan ${zahl(pl)} Mio. €`,
          `ΔPL ${delta(d, 0)} Mio. € (${delta(d / pl * 100, 1, NBSP + "%")})`, "Klick hebt das Quartal in beiden Teilen hervor"]);
      });
    });
  }

  /* ---------- Botschaften ---------- */
  function botschaftA(an, G) {
    if (S.q !== null) {
      const r = S.q, reihe = an.filter(s => s.r === r), m = reihe.filter(s => s.verdeckt > 0.05).length;
      const off = (4 - (r + VORN)) * OY / G.k;
      return passt([`${Q[r]}: an der Rückwand abgelesen wirkt jede Säule ${zahl(off)} Mio. € zu niedrig, ${m} von ${reihe.length} sind teils verdeckt`,
        `${Q[r]}: an der Rückwand ${zahl(off)} Mio. € zu niedrig, ${m} von ${reihe.length} teils verdeckt`], 695);
    }
    const vorn = an.filter(s => s.r === 0).sort((a, b) => b.v - a.v)[0];
    const n = an.filter(s => s.verdeckt > 0.5).length;
    const name = `${vorn.kt.sz} ${vorn.kt.reihe === "Gesamt" ? "gesamt" : vorn.kt.reihe} ${Q[0]}`;
    return passt([`${name} (${zahl(vorn.v)}) wirkt an der Rückwand wie ${zahl(vorn.rueckwand)}; ${n} von ${an.length} Säulen zu mehr als der Hälfte verdeckt`,
      `${name} (${zahl(vorn.v)}) wirkt wie ${zahl(vorn.rueckwand)}; ${n} von ${an.length} Säulen halb verdeckt`], 695);
  }
  function botschaftB() {
    const [Ges, ...Reg] = REIHEN;
    if (S.q !== null) {
      const i = S.q, d = r => r.ist[i] - r.plan[i];
      return passt([`${Q[i]}: Ist ${zahl(Ges.ist[i])} bei Plan ${zahl(Ges.plan[i])} Mio. € (${delta(d(Ges), 0)}), ${Reg.map(r => `${r.name} ${delta(d(r), 0)}`).join(", ")}`], 695);
    }
    const ds = summe(Ges.ist) - summe(Ges.plan);
    const reg = Reg.map(r => `${r.name} ${delta(summe(r.ist) - summe(r.plan), 0)}`).join(", ");
    let schw = null;
    Reg.forEach(r => Q.forEach((q, i) => { const d = r.ist[i] - r.plan[i]; if (!schw || d < schw.d) schw = { r, q, d }; }));
    return passt([`Jahr ΔPL ${delta(ds, 0)} Mio. € (${reg}); größte Lücke: ${schw.r.name} im ${schw.q} mit ${delta(schw.d, 0)}`,
      `Jahr ΔPL ${delta(ds, 0)} Mio. € (${reg})`], 695);
  }

  let ANALYSE = null;
  function zeichnen() {
    const G = geometrie(294 - 48);                                   // Höhe der Fläche unter Titel und Aussage
    ANALYSE = analyse(G);
    let v = DK.visual(bA, { titel: "a) Mit 3D-Effekt", einheit: `Umsatz ${J} in Mio. €`, botschaft: botschaftA(ANALYSE, G) });
    dreiD(v.flaeche, v.breite, v.hoehe);
    v = DK.visual(bB, { titel: "b) Ohne 3D-Effekt", einheit: `Umsatz ${J} in Mio. €, Plan und Ist je Quartal`, botschaft: botschaftB() });
    zweiD(v.flaeche, v.breite, v.hoehe);
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "d3-saeulen", anker: "links", versatz: [323, 70], regel: "CHECK – Visuelle Integrität", titel: "3D verschiebt die Werte",
        text: "Die Gitternetzlinien liegen auf der Rückwand, die Säulen stehen davor. Wer die Oberkante einer vorderen Säule mit der Rückwand vergleicht, liest rund 30 Mio. € zu wenig ab – Ist Q1 gesamt (120) wirkt wie 90. Je weiter vorn die Säule, desto größer der Fehler; in der hintersten Reihe sind es noch 6 Mio. €." },
      { nr: 2, ziel: "d3-saeulen", anker: "links", versatz: [420, 120], regel: "CHECK – Visuelle Integrität", titel: "Hintere Säulen verdeckt",
        text: "Die vorderen Säulen verdecken die hinteren; einzelne Werte (etwa Region Nord im 3. Quartal) sind kaum zu sehen. Dazu verlängern Deckfläche und Seitenfläche jede Säule optisch. Der Tooltip nennt je Säule den an der Rückwand abgelesenen Wert und den verdeckten Anteil." },
      { nr: 3, ziel: "v-3d", anker: "links", versatz: [690, 26], regel: "SAY – Botschaft vermitteln", titel: "Aussagen stellen gegenüber",
        text: "Die Aussage unter a) benennt, was das 3D-Diagramm vortäuscht, die unter b), was die Zahlen tatsächlich zeigen: Ist liegt im Jahr 20 Mio. € über Plan, allein durch die Region Süd." },
      { nr: 4, ziel: "d2-legende", anker: "links", versatz: [30, -22], regel: "UNIFY – Semantische Notation", titel: "Ist gefüllt, Plan als Kontur",
        text: "In b) folgen die Szenarien der Notation des Buches: Ist anthrazit, Plan weiß mit Kontur, leicht versetzt dahinter. Im Original waren Plan und Ist nur über die Achsenbeschriftung unterscheidbar; Farben (Flieder, Bordeaux, Gelb, Türkis) standen für die Quartale. In a) sind sie hier durch Grautöne ersetzt – sonst ist a) wie das Original gebaut." },
      { nr: 5, ziel: "d2-gesamt", anker: "links", versatz: [88, -2], regel: "STRUCTURE – Inhalte ordnen", titel: "Kleine Vielfache statt Tiefe",
        text: "Gesamt, Süd und Nord stehen nebeneinander, jeweils mit den Quartalen auf der Zeitachse und alle mit demselben Maßstab. Das Original reihte „Plan, Region Süd, Region Nord, Ist, Region Süd, Region Nord“ auf einer Achse und legte die Quartale in die Tiefe." },
      { nr: 6, ziel: "d2-sued", anker: "links", versatz: [8, 159], regel: "EXPRESS – Abweichung zeigen", titel: "Abweichung nach Wirkung",
        text: "Unter jedem Quartal steht Ist − Plan, blaugrün bei Mehr-, rot bei Minderumsatz. Im 3D-Diagramm hätte man Plan und Ist erst über 90 Mio. € Abstand auf der Achse hinweg vergleichen müssen." },
      { nr: 7, ziel: "d3-tiefe", anker: "links", versatz: [98, -23], regel: "SIMPLIFY – Überflüssiges weglassen", titel: "Legende und Rahmen entfallen",
        text: "Die Quartale stehen an der Tiefenachse; die zusätzliche Legende des Originals mit denselben vier Einträgen, der Rahmen und die gedrehten Achsenbeschriftungen entfallen." },
      { nr: 8, ziel: "d2-nord", anker: "links", versatz: [190, 50], regel: "CONDENSE – Hervorheben", titel: "Klick auf ein Quartal",
        text: "Ein Klick auf eine Säule hebt das Quartal in a) und b) hervor – in a) werden dabei die vorderen Reihen durchsichtig und zeigen, was sie verdecken. Esc hebt die Auswahl auf." },
    ],
    nachbauIntro: "Seitengröße benutzerdefiniert 727 × 560 px. Schrift Arial: Beschriftungen 10,5 pt, Titel 12 pt. Datenmodell: Tabelle Umsatz (Jahr, Quartal, Region, Plan, Ist) wie in der CSV-Datei.",
    nachbau: [
      { id: "A", ziel: "d3-saeulen", anker: "links", versatz: [323, 70], titel: "3D-Säulen", visual: "– (kein Standardvisual)",
        felder: "–", format: "–",
        hinweis: "Die Standardvisuals von Power BI bieten keine 3D-Darstellung – die verzerrte Fassung a) lässt sich dort gar nicht bauen. Das ist gewollt: Teil a) dient nur als Negativbeispiel." },
      { id: "B", ziel: "d2-gesamt", anker: "links", versatz: [88, -2], titel: "Plan und Ist je Quartal", visual: "Gruppiertes Säulendiagramm (Standardvisual) mit kleinen Vielfachen",
        felder: "X-Achse: Quartal; Y-Achse: Plan, Ist; Kleine Vielfache: Region (Spalte mit „Gesamt“, „Süd“, „Nord“ über eine berechnete Tabelle oder ein zweites Visual für Gesamt)",
        format: "Plan: Füllung weiß, Rahmen #3A3F44; Ist: #3A3F44; Datenbeschriftung nur Ist; Y-Achse und Gitternetz aus; gemeinsame Y-Achse der Vielfachen",
        hinweis: "Überlappende Säulen bietet das Standardvisual nicht; mit Abstand 0 stehen Plan und Ist direkt nebeneinander." },
      { id: "C", ziel: "d2-sued", anker: "links", versatz: [8, 159], titel: "Abweichung", visual: "Tabelle oder Matrix unter den Säulen",
        felder: "Measure ΔPL = SUM(Umsatz[Ist]) − SUM(Umsatz[Plan])", format: "Bedingte Schriftfarbe: > 0 #00806B, < 0 #C62828" },
    ],
    theme: DK.thema(),
    csv: { name: "verzerrung_3d_daten.csv", text: () => ["Jahr;Quartal;Region;Plan_Mio_EUR;Ist_Mio_EUR",
      ...REIHEN.slice(1).flatMap(R => Q.map((q, i) => [J, q, R.name, R.plan[i], R.ist[i]].join(";")))].join("\r\n") },
    tabellen: () => [
      { titel: `Umsatz ${J} (Mio. €)`, kopf: ["Reihe", "Quartal", "Plan", "Ist", "ΔPL", "ΔPL in %"],
        zeilen: REIHEN.flatMap(R => [...Q.map((q, i) => [R.titel, q, zahl(R.plan[i]), zahl(R.ist[i]), delta(R.ist[i] - R.plan[i], 0), delta((R.ist[i] / R.plan[i] - 1) * 100, 1)]),
          [R.titel, "Jahr", zahl(summe(R.plan)), zahl(summe(R.ist)), delta(summe(R.ist) - summe(R.plan), 0), delta((summe(R.ist) / summe(R.plan) - 1) * 100, 1)]]) },
      { titel: "a) 3D-Säulen: Wert, an der Rückwand abgelesen, verdeckt", kopf: ["Säule", "Wert", "Rückwand", "verdeckt in %"],
        zeilen: (ANALYSE || []).slice().sort((a, b) => a.c - b.c || a.r - b.r)
          .map(s => [`${s.kt.sz} ${s.kt.reihe} ${Q[s.r]}`, zahl(s.v), zahl(s.rueckwand), zahl(s.verdeckt * 100)]) },
    ],
  });
  zeichnen();
})();
