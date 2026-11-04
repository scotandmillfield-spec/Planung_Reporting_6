/* Einzelvisual „Flächendiagramm“ (Abb. 3.63): Kapazität je Quartal, Plan und Ist in Tonnen.
   Seite 727 x 370 px = 110 x 56,0 mm. Daten: flaeche.json (daten_flaeche.py), Werte des Originals.
   Diagrammtyp bleibt: Flächen über die Quartale. Ist als anthrazitfarbene Fläche, Plan als Kontur darüber; die
   Fläche zwischen Ist und Plan ist nach Wirkung getönt (hellrot = Ist unter Plan). Fläche ab null, Werte direkt
   beschriftet, Abweichung je Quartal darunter. Klick auf ein Quartal hebt es hervor. */
(() => {
  "use strict";
  const { zahl, delta, NBSP, sv, el, FARBE } = DK;
  const Q = DATA.quartale, PL = DATA.plan, IST = DATA.ist, J = DATA.jahr;
  const QLANG = ["1. Quartal", "2. Quartal", "3. Quartal", "4. Quartal"];
  const TOENUNG = { schlecht: "#F1C9C9", gut: "#BFDFDA" };   // 25 % Rot bzw. Blaugrün auf Weiß
  const S = { auswahl: null };
  const auswaehlen = i => { S.auswahl = S.auswahl === i ? null : i; zeichnen(); };
  addEventListener("keydown", e => { if (e.key === "Escape" && S.auswahl !== null) { S.auswahl = null; zeichnen(); } });

  DK.init({ titel: "Flächendiagramm", breite: 727, hoehe: 370 });
  const bVis = DK.box("v-flaeche", 16, 10, 695, 352);

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
  const summe = a => a.reduce((s, v) => s + v, 0);
  const dpl = i => IST[i] - PL[i];
  const klasse = d => (d > 0 ? "gut" : d < 0 ? "schlecht" : "neutral");
  const t = v => `${zahl(v)}${NBSP}t`;

  function botschaft(b) {
    const passt = k => k.find(x => DK.tw(x) <= b) || k[k.length - 1];
    if (S.auswahl !== null) {
      const i = S.auswahl, d = dpl(i);
      return passt([`${QLANG[i]}: Ist ${t(IST[i])} bei Plan ${t(PL[i])}, ΔPL ${delta(d, 0)}${NBSP}t (${delta(d / PL[i] * 100, 1, NBSP + "%")})`]);
    }
    const idx = Q.map((q, i) => i), unter = idx.filter(i => dpl(i) < 0), ds = summe(IST) - summe(PL);
    const groesste = idx.slice().sort((a, c) => dpl(a) - dpl(c))[0];
    const jahr = `Jahr ${delta(ds, 0)}${NBSP}t (${delta(ds / summe(PL) * 100, 1, NBSP + "%")})`;
    const teil = unter.length === Q.length ? "Ist in allen Quartalen unter Plan" : unter.length ? `Ist in ${unter.length} Quartalen unter Plan` : "Ist in keinem Quartal unter Plan";
    return passt([`${teil}, größte Lücke in ${Q[groesste]} (${delta(dpl(groesste), 0)}${NBSP}t); ${jahr}`, `${teil}; ${jahr}`]);
  }

  // Fläche zwischen zwei Linienzügen, je Abschnitt nach Vorzeichen getrennt (Schnittpunkte werden geteilt)
  function abweichungsflaechen(xs, ist, plan, sy) {
    const teile = [];
    for (let i = 0; i < xs.length - 1; i++) {
      const d0 = ist[i] - plan[i], d1 = ist[i + 1] - plan[i + 1];
      const seg = (xa, ia, pa, xb, ib, pb, d) => d && teile.push({ k: klasse(d),
        pkt: [[xa, sy(ia)], [xb, sy(ib)], [xb, sy(pb)], [xa, sy(pa)]] });
      if (d0 * d1 < 0) {
        const f = d0 / (d0 - d1), xm = xs[i] + f * (xs[i + 1] - xs[i]), vm = ist[i] + f * (ist[i + 1] - ist[i]);
        seg(xs[i], ist[i], plan[i], xm, vm, vm, d0); seg(xm, vm, vm, xs[i + 1], ist[i + 1], plan[i + 1], d1);
      } else seg(xs[i], ist[i], plan[i], xs[i + 1], ist[i + 1], plan[i + 1], d0 || d1);
    }
    return teile;
  }

  function flaeche(ziel, breite, hoehe) {
    ziel.textContent = "";
    const svg = sv("svg", { width: breite, height: hoehe, role: "img", "aria-label": `Flächendiagramm: Kapazität ${J} je Quartal in Tonnen, Plan und Ist` }, ziel);
    // Legende rechts oben
    const gl = sv("g", { id: "fl-legende" }, svg);
    const eintraege = [["Ist", { fill: "#3A3F44" }], ["Plan", { fill: "#FFFFFF", stroke: "#3A3F44", "stroke-width": 1.5 }],
      ["Ist unter Plan", { fill: TOENUNG.schlecht }]];
    let lx = breite - eintraege.reduce((s, [n]) => s + 18 + DK.tw(n) + 16, 0) + 16;
    eintraege.forEach(([n, st]) => {
      sv("rect", { x: lx + 0.75, y: 2.75, width: 11.5, height: 11.5, ...st }, gl);
      sv("text", { x: lx + 18, y: 8, dy: "0.35em", class: "muted" }, gl, n);
      lx += 18 + DK.tw(n) + 16;
    });
    const oben = 44, unten = 66, H = hoehe - oben - unten, links = 56, B = breite - links;
    const max = Math.max(...PL, ...IST), sy = v => oben + H - v / max * H, basis = oben + H;
    const fach = B / Q.length, xs = Q.map((q, i) => links + fach * (i + 0.5));
    // Abweichungsfläche zwischen Ist und Plan, getönt nach Wirkung (zuerst, damit die Ist-Fläche die Kante deckt;
    // Kontur in Flächenfarbe schließt die Fugen zwischen den Abschnitten)
    const gd = sv("g", { id: "fl-luecke" }, svg);
    abweichungsflaechen(xs, IST, PL, sy).forEach(p => sv("polygon", { points: p.pkt.map(q => q.join(",")).join(" "),
      fill: TOENUNG[p.k], stroke: TOENUNG[p.k], "stroke-width": 1, "stroke-linejoin": "round" }, gd));
    // Ist-Fläche ab null
    const gf = sv("g", { id: "fl-flaechen" }, svg);
    const istPkt = xs.map((x, i) => `${x},${sy(IST[i])}`).join(" ");
    sv("polygon", { points: `${xs[0]},${basis} ${istPkt} ${xs[xs.length - 1]},${basis}`, fill: "#3A3F44" }, gf);
    // Plan als Kontur
    sv("polyline", { id: "fl-plan", points: xs.map((x, i) => `${x},${sy(PL[i])}`).join(" "), fill: "none", stroke: "#3A3F44", "stroke-width": 1.5 }, svg);
    sv("line", { x1: links, x2: breite, y1: basis + 0.5, y2: basis + 0.5, stroke: "#8C8C8C", "stroke-width": 1 }, svg);
    // Beschriftung, Abweichungszeile, Klickflächen
    const gw = sv("g", { id: "fl-werte" }, svg), ga = sv("g", { id: "fl-abweichung" }, svg), gk = sv("g", {}, svg);
    sv("text", { x: 0, y: basis + 52, dy: "0.35em", class: "muted" }, ga, "ΔPL");
    Q.forEach((q, i) => {
      const x = xs[i], d = dpl(i), blass = S.auswahl !== null && S.auswahl !== i;
      if (S.auswahl === i) sv("line", { x1: x, x2: x, y1: sy(Math.max(PL[i], IST[i])) - 4, y2: basis, stroke: "#1A1A1A", "stroke-width": 1, "stroke-dasharray": "3 3" }, gf);
      const g = sv("g", { class: blass ? "dk-blass" : "" }, gw);
      sv("text", { x, y: sy(PL[i]) - 10, "text-anchor": "middle", class: "muted" }, g, zahl(PL[i]));
      // Ist-Wert weiß in der Fläche; am ersten und letzten Punkt nach innen gerückt, damit er in der Fläche bleibt
      const rand = i === 0 ? ["start", x + 8] : i === Q.length - 1 ? ["end", x - 8] : ["middle", x];
      sv("text", { x: rand[1], y: sy(IST[i]) + 18, dy: "0.35em", "text-anchor": rand[0], style: "font-weight:bold;fill:#FFFFFF" }, g, zahl(IST[i]));
      sv("text", { x, y: basis + 20, dy: "0.35em", "text-anchor": "middle" }, g, q);
      sv("text", { x, y: basis + 52, dy: "0.35em", "text-anchor": "middle", class: blass ? "dk-blass" : "",
        style: `font-weight:bold;fill:${FARBE[klasse(d)]}` }, ga, delta(d, 0));
      const k = sv("g", { class: "dk-klick", "data-name": q }, gk);
      const hit = sv("rect", { x: x - fach / 2, y: oben - 20, width: fach, height: H + 86, fill: "transparent" }, k);
      hit.addEventListener("click", () => auswaehlen(i));
      tooltip(hit, () => [`${QLANG[i]} ${J}`, `Ist ${t(IST[i])} · Plan ${t(PL[i])}`,
        `ΔPL ${delta(d, 0)}${NBSP}t (${delta(d / PL[i] * 100, 1, NBSP + "%")})`, "Klick hebt das Quartal hervor"]);
    });
  }

  function zeichnen() {
    const v = DK.visual(bVis, { titel: `Kapazität ${J} je Quartal`, einheit: "t", botschaft: botschaft(695) });
    flaeche(v.flaeche, v.breite, v.hoehe);
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "v-flaeche", anker: "links", versatz: [690, 26], regel: "SAY – Botschaft vermitteln", titel: "Kernaussage unter dem Titel",
        text: "Unter dem Titel steht, was die Flächen zeigen: Ist in allen Quartalen unter Plan, die größte Lücke im vierten Quartal. Das Original hatte nur die Überschrift „Kapazität in Tonnen 2011“." },
      { nr: 2, ziel: "fl-legende", anker: "links", versatz: [-6, -2], regel: "UNIFY – Semantische Notation", titel: "Ist gefüllt, Plan als Kontur",
        text: "Ist ist die anthrazitfarbene Fläche, Plan die Kontur darüber – dieselbe Notation wie in allen Abbildungen des Buches. Das Original zeigte Plan als fliederfarbene, Ist als bordeauxrote Fläche; die Planfläche wirkte wie ein gestapelter Anteil, als sei Plan die Menge oberhalb von Ist." },
      { nr: 3, ziel: "fl-luecke", anker: "links", versatz: [436, 42], regel: "EXPRESS – Abweichung zeigen", titel: "Lücke nach Wirkung getönt",
        text: "Die Fläche zwischen Ist und Plan ist hellrot, weil Ist unter Plan liegt; läge Ist darüber, wäre sie hellblaugrün. Darunter steht die Abweichung je Quartal in Tonnen." },
      { nr: 4, ziel: "fl-flaechen", anker: "links", versatz: [-6, 140], regel: "CHECK – Visuelle Integrität", titel: "Fläche ab null, wenige Stützpunkte",
        text: "Flächen zeigen Mengen und beginnen deshalb immer bei null. Grenze des Typs: Die Fläche verbindet die Quartale, als gäbe es Werte dazwischen. Bei wenigen Perioden zeigen Säulen (Abb. 3.48) die Werte genauer; Flächen eignen sich für lange Zeitreihen und für Anteile, die sich über die Zeit verschieben." },
      { nr: 5, ziel: "fl-werte", anker: "links", versatz: [71, 99], regel: "SIMPLIFY – Überflüssiges weglassen", titel: "Werte statt Achse",
        text: "Planwerte stehen über der Kontur, Ist-Werte weiß in der Fläche. Größenachse, Gitternetz und die Legende rechts neben dem Diagramm entfallen; die Legende steht klein über dem Diagramm." },
      { nr: 6, ziel: "fl-abweichung", anker: "links", versatz: [70, 0], regel: "STRUCTURE – Inhalte ordnen", titel: "Abweichungszeile",
        text: "Quartale in natürlicher Reihenfolge, die Abweichung Ist − Plan in einer eigenen Zeile darunter – derselbe Aufbau wie bei Säulen- und Punktdiagramm (Abb. 3.48 und 3.61)." },
      { nr: 7, ziel: "fl-flaechen", anker: "links", versatz: [336, 120], regel: "CONDENSE – Hervorheben", titel: "Klick auf ein Quartal",
        text: "Ein Klick auf ein Quartal markiert es mit einer Linie; die Aussage nennt Ist, Plan und Abweichung absolut und relativ. Esc hebt die Auswahl auf." },
    ],
    nachbauIntro: "Seitengröße benutzerdefiniert 727 × 370 px. Schrift Arial: Beschriftungen 10,5 pt, Titel 12 pt. Datenmodell: Tabelle Kapazität (Jahr, Quartal, Plan, Ist) wie in der CSV-Datei.",
    nachbau: [
      { id: "A", ziel: "fl-flaechen", versatz: [-24, 70], anker: "links", titel: "Ist und Lücke", visual: "Gestapeltes Flächendiagramm (Standardvisual)",
        felder: "X-Achse: Quartal; Y-Achse: Ist und Measure Lücke = MAX(SUM([Plan]) − SUM([Ist]); 0)",
        format: "Ist #3A3F44, Lücke #F1C9C9, Transparenz 0 %; Y-Achse fest 0–120, ausgeblendet; Gitternetz aus; Datenbeschriftungen nur für Ist (weiß, fett)",
        hinweis: "Die Oberkante des Stapels ist der Plan. Liegt Ist über Plan, ist eine zweite Measure „Überschreitung“ (#BFDFDA) nötig." },
      { id: "B", ziel: "fl-plan", anker: "links", versatz: [425, -14], titel: "Plankontur", visual: "Liniendiagramm mit transparentem Hintergrund deckungsgleich darüber",
        felder: "X-Achse: Quartal; Y-Achse: Plan", format: "Linie #3A3F44, 1,5 pt; Y-Achse fest 0–120 wie das Flächendiagramm; Datenbeschriftung oben, #4D4D4D" },
      { id: "C", ziel: "fl-abweichung", anker: "links", versatz: [70, 0], titel: "Abweichung", visual: "Tabelle oder Matrix unter dem Diagramm",
        felder: "Measure ΔPL = SUM([Ist]) − SUM([Plan])", format: "Bedingte Schriftfarbe: > 0 #00806B, < 0 #C62828" },
    ],
    theme: DK.thema(),
    csv: { name: "flaechendiagramm_daten.csv", text: () => ["Jahr;Quartal;Plan_t;Ist_t;Abweichung_t",
      ...Q.map((q, i) => [J, q, PL[i], IST[i], dpl(i)].join(";"))].join("\r\n") },
    tabellen: () => [{ titel: `Kapazität ${J} (t)`, kopf: ["Quartal", "Plan", "Ist", "ΔPL", "ΔPL in %"],
      zeilen: [...Q.map((q, i) => [q, zahl(PL[i]), zahl(IST[i]), delta(dpl(i), 0), delta(dpl(i) / PL[i] * 100, 1)]),
        ["Jahr", zahl(summe(PL)), zahl(summe(IST)), delta(summe(IST) - summe(PL), 0), delta((summe(IST) / summe(PL) - 1) * 100, 1)]] }],
  });
  zeichnen();
})();
