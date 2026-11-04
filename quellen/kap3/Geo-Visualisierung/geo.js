/* Einzelvisual „Geo-Visualisierung“ (Abb. 3.66): Marktpotenzial und Umsatzentwicklung je Bundesland als Kachelkarte.
   Seite 727 x 520 px = 110 x 78,7 mm. Daten: geo.json (daten_geo.py), erfunden.
   Softwareneutraler Nachbau eines Kartenberichts: Flächenhelligkeit = Marktpotenzial (fünf Graustufen-Klassen),
   je Land Mini-Säulen für die Umsatzveränderung zum Vorquartal (Q3, Q4) nach Wirkung mit Zahl, Kreise für
   Vertriebsbüros. Keine Kartenkacheln oder Bibliotheken: schematische Kachelkarte mit 16 gleich großen Kacheln in
   grober geografischer Lage. Schalter Vertriebsregion (statt Register „Sales Region“), Klick auf ein Land hebt es hervor. */
(() => {
  "use strict";
  const { zahl, delta, NBSP, sv, el, FARBE } = DK;
  const J = DATA.jahr, RG = DATA.regionen, KL = DATA.klassen;
  const L = DATA.laender.map(([k, name, r, zeile, spalte, pot, u, bueros]) => ({ k, name, r, zeile, spalte, pot, u, bueros }));
  const FUELL = ["#EFEFEF", "#D4D4D4", "#A9A9A9", "#6E747A", "#3A3F44"];
  const klasse = p => KL.filter(g => p >= g).length;
  const dq = (x, q) => (x.u[q] / x.u[q - 1] - 1) * 100;                 // q = 1: Q3 zu Q2, q = 2: Q4 zu Q3
  const QN = ["Q2", "Q3", "Q4"];
  const pz = (v, nk = 1) => delta(v, nk, NBSP + "%");
  const summe = (xs, f) => xs.reduce((s, x) => s + f(x), 0);
  const S = { region: null, auswahl: null };
  const auswaehlen = k => { S.auswahl = S.auswahl === k ? null : k; zeichnen(); };
  addEventListener("keydown", e => { if (e.key === "Escape" && S.auswahl !== null) { S.auswahl = null; zeichnen(); } });

  DK.init({ titel: "Geo-Visualisierung", breite: 727, hoehe: 520 });
  const bVis = DK.box("v-geo", 16, 10, 695, 502);

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
  const gesamt = xs => {
    const u = [0, 1, 2].map(q => summe(xs, x => x.u[q]));
    return { pot: summe(xs, x => x.pot), u, d3: (u[1] / u[0] - 1) * 100, d4: (u[2] / u[1] - 1) * 100, bueros: summe(xs, x => x.bueros.length) };
  };
  const auswahlLaender = () => L.filter(x => S.region === null || x.r === S.region);

  function botschaft(b) {
    const passt = x => x.find(t => DK.tw(t) <= b) || x[x.length - 1];
    const potGes = summe(L, x => x.pot);
    if (S.auswahl !== null) {
      const x = L.find(y => y.k === S.auswahl), n = x.bueros.length;
      const bu = n ? `${n} Vertriebsbüro${n > 1 ? "s" : ""}` : "kein Vertriebsbüro";
      return passt([`${x.name} (${RG[x.r]}): Potenzial ${zahl(x.pot)} Mio. €, Umsatz Q3 ${pz(dq(x, 1))}, Q4 ${pz(dq(x, 2))} zum Vorquartal; ${bu}`,
        `${x.name}: Potenzial ${zahl(x.pot)} Mio. €, Umsatz Q3 ${pz(dq(x, 1))}, Q4 ${pz(dq(x, 2))} zum Vorquartal`]);
    }
    if (S.region !== null) {
      const xs = auswahlLaender(), g = gesamt(xs), schwach = xs.slice().sort((a, c) => dq(a, 2) - dq(c, 2))[0];
      return passt([`Region ${RG[S.region]}: ${zahl(g.pot / potGes * 100)} % des Potenzials, Umsatz Q4 ${pz(g.d4)} zum Vorquartal; am schwächsten ${schwach.k} (${pz(dq(schwach, 2))})`,
        `Region ${RG[S.region]}: ${zahl(g.pot / potGes * 100)} % des Potenzials, Umsatz Q4 ${pz(g.d4)} zum Vorquartal`]);
    }
    const top = L.slice().sort((a, c) => c.pot - a.pot).slice(0, 3), anteil = summe(top, x => x.pot) / potGes * 100;
    const sinkt = L.filter(x => dq(x, 2) < 0), min = L.slice().sort((a, c) => dq(a, 2) - dq(c, 2))[0];
    return passt([`${top[0].k}, ${top[1].k} und ${top[2].k} bündeln ${zahl(anteil)} % des Potenzials; Umsatz Q4 sinkt in ${sinkt.length} Ländern, am stärksten in ${min.k} (${pz(dq(min, 2))})`,
      `Umsatz Q4 sinkt in ${sinkt.length} von ${L.length} Ländern, am stärksten in ${min.k} (${pz(dq(min, 2))})`]);
  }

  /* ---------- Karte ---------- */
  function karte(ziel, breite, hoehe) {
    ziel.textContent = "";
    const svg = sv("svg", { width: breite, height: hoehe, role: "img",
      "aria-label": `Kachelkarte der Bundesländer: Marktpotenzial ${J} als Graustufe, Umsatzveränderung zum Vorquartal als Mini-Säulen` }, ziel);
    // Legende in zwei Zeilen
    const gl = sv("g", { id: "geo-legende" }, svg);
    let x = 0;
    sv("text", { x, y: 8, dy: "0.35em", class: "muted" }, gl, `Marktpotenzial ${J}, Mio. €:`);
    x += DK.tw(`Marktpotenzial ${J}, Mio. €:`) + 12;
    const KTXT = [`unter ${zahl(KL[0])}`, ...KL.slice(1).map((g, i) => `${zahl(KL[i])}–${zahl(g)}`), `ab ${zahl(KL[KL.length - 1])}`];
    KTXT.forEach((t, i) => {
      sv("rect", { x: x + 0.5, y: 1.5, width: 13, height: 13, fill: FUELL[i], stroke: "#BDBDBD", "stroke-width": 1 }, gl);
      sv("text", { x: x + 19, y: 8, dy: "0.35em", class: "muted" }, gl, t);
      x += 19 + DK.tw(t) + 14;
    });
    const gl2 = sv("g", { id: "geo-legende2" }, svg);
    sv("circle", { cx: 6, cy: 30, r: 4.5, fill: "#FFFFFF", stroke: "#1A1A1A", "stroke-width": 1.3 }, gl2);
    sv("text", { x: 17, y: 30, dy: "0.35em", class: "muted" }, gl2, "Vertriebsbüro");
    const x2 = 17 + DK.tw("Vertriebsbüro") + 24;
    sv("rect", { x: x2, y: 24, width: 8, height: 7, fill: FARBE.gut }, gl2);
    sv("rect", { x: x2 + 11, y: 30, width: 8, height: 7, fill: FARBE.schlecht }, gl2);
    sv("text", { x: x2 + 26, y: 30, dy: "0.35em", class: "muted" }, gl2, "Umsatz zum Vorquartal in %, links Q3, rechts Q4");

    // Kachelraster
    const oben = 48, sp = 7, tw = (breite - 4 * sp) / 5, th = (hoehe - oben - 4 * sp) / 5;
    const kx = s => s * (tw + sp), ky = z => oben + z * (th + sp);
    const dmax = Math.max(...L.flatMap(y => [Math.abs(dq(y, 1)), Math.abs(dq(y, 2))]));
    const gk = sv("g", { id: "geo-karte" }, svg);
    L.forEach(y => {
      const x0 = kx(y.spalte), y0 = ky(y.zeile), c = klasse(y.pot), hell = c >= 3;
      const blass = (S.region !== null && y.r !== S.region) || (S.auswahl !== null && S.auswahl !== y.k);
      const g = sv("g", { id: `geo-${y.k}`, class: "dk-klick" + (blass ? " dk-blass" : ""), "data-name": y.name }, gk);
      sv("rect", { x: x0, y: y0, width: tw, height: th, fill: FUELL[c], stroke: S.auswahl === y.k ? "#1A1A1A" : "none", "stroke-width": 2 }, g);
      const farbe = hell ? "#FFFFFF" : "#1A1A1A";
      sv("text", { x: x0 + 8, y: y0 + 14, dy: "0.35em", style: `font-weight:bold;fill:${farbe}` }, g, y.k);
      sv("text", { x: x0 + tw - 8, y: y0 + 14, dy: "0.35em", "text-anchor": "end", style: `fill:${farbe}` }, g, zahl(y.pot));
      const gb = sv("g", { id: `geo-${y.k}-bueros` }, g);
      y.bueros.forEach((o, i) => sv("circle", { cx: x0 + 19 + DK.tw(y.k, 14, true) + i * 13, cy: y0 + 14, r: 4.5,
        fill: "#FFFFFF", stroke: "#1A1A1A", "stroke-width": 1.3 }, gb));
      // Einsatz mit Mini-Säulen
      const ix = x0 + 6, iy = y0 + 30, iw = tw - 12, ih = th - 36, mitte = iy + ih / 2;
      const gi = sv("g", { id: `geo-${y.k}-saeulen` }, g);
      sv("rect", { x: ix, y: iy, width: iw, height: ih, fill: "#FFFFFF" }, gi);
      [1, 2].forEach((q, n) => {
        const d = dq(y, q), kl = DK.wirkung(d, 1, 1), h = Math.max(1, Math.abs(d) / dmax * (ih / 2 - 3));
        const bx = ix + 6 + n * (iw / 2);
        sv("line", { x1: bx - 2, x2: bx + 12, y1: mitte, y2: mitte, stroke: "#8C8C8C", "stroke-width": 1 }, gi);
        sv("rect", { x: bx, y: d >= 0 ? mitte - h : mitte, width: 10, height: h, fill: FARBE[kl] }, gi);
        sv("text", { x: bx + 15, y: mitte, dy: "0.35em", style: `fill:${FARBE[kl]}` }, gi, delta(d, 1));
      });
      const hit = sv("rect", { x: x0, y: y0, width: tw, height: th, fill: "transparent" }, g);
      hit.addEventListener("click", () => auswaehlen(y.k));
      tooltip(hit, () => [`${y.name} (Region ${RG[y.r]})`, `Marktpotenzial ${zahl(y.pot)} Mio. € p. a.`,
        `Umsatz ${QN.map((q, i) => `${q} ${zahl(y.u[i])}`).join(" · ")} Tsd. €`,
        `Zum Vorquartal: Q3 ${pz(dq(y, 1))}, Q4 ${pz(dq(y, 2))}`,
        y.bueros.length ? `Vertriebsbüros: ${y.bueros.join(", ")}` : "Kein Vertriebsbüro", "Klick hebt das Land hervor"]);
    });

    // Summe im freien Feld unten rechts (Deutschland bzw. gewählte Region)
    const gs = sv("g", { id: "geo-summe" }, svg);
    const sx = kx(3) + 8, sy = ky(4), g = gesamt(auswahlLaender());
    sv("line", { x1: kx(3), x2: breite, y1: sy + 0.5, y2: sy + 0.5, stroke: "#3A3F44", "stroke-width": 1 }, gs);
    sv("text", { x: sx, y: sy + 15, dy: "0.35em", style: "font-weight:bold" }, gs, S.region === null ? "Deutschland gesamt" : `Region ${RG[S.region]}`);
    sv("text", { x: sx, y: sy + 35, dy: "0.35em" }, gs, `Potenzial ${zahl(g.pot)} Mio. €, ${zahl(g.bueros)} Büros`);
    const t = sv("text", { x: sx, y: sy + 55, dy: "0.35em" }, gs);
    sv("tspan", {}, t, "Umsatz Q3 ");
    sv("tspan", { style: `font-weight:bold;fill:${FARBE[DK.wirkung(g.d3, 1, 1)]}` }, t, pz(g.d3));
    sv("tspan", {}, t, ", Q4 ");
    sv("tspan", { style: `font-weight:bold;fill:${FARBE[DK.wirkung(g.d4, 1, 1)]}` }, t, pz(g.d4));
  }

  function zeichnen() {
    const v = DK.visual(bVis, { titel: `Marktpotenzial und Umsatz ${J}`, einheit: "Mio. €, %", botschaft: botschaft(695),
      schalter: { optionen: [["", "Alle"], ...RG.map((r, i) => [String(i), r])], wert: S.region === null ? "" : String(S.region),
        onChange: w => { S.region = w === "" ? null : Number(w); S.auswahl = null; zeichnen(); } } });
    bVis.querySelector(".dk-titelzeile .dk-knoepfe").id = "geo-region";
    karte(v.flaeche, v.breite, v.hoehe);
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "v-geo", anker: "links", versatz: [358, 0], regel: "SAY – Botschaft vermitteln", titel: "Kernaussage unter dem Titel",
        text: "Unter dem Titel steht, wo das Potenzial liegt und wo der Umsatz zuletzt gesunken ist – je nach Auswahl für Deutschland, eine Vertriebsregion oder ein Land. Das Original trug nur den englischen Titel „Market Potential vs. Change in Sales“." },
      { nr: 2, ziel: "geo-region", anker: "links", versatz: [-4, -2], regel: "SIMPLIFY – Software entfernen", titel: "Ohne Bedienoberfläche",
        text: "Fensterrahmen, die Bedienleiste „Map Design“, Werkzeugsymbole und Schaltflächen des Kartenwerkzeugs entfallen; sie gehören nicht zur Aussage. Die Register „States“ und „Sales Region“ des Originals werden zum Schalter Vertriebsregion." },
      { nr: 3, ziel: "geo-karte", anker: "links", versatz: [30, 2], regel: "STRUCTURE – Kachelkarte", titel: "Gleich große Kacheln statt Umrisse",
        text: "Jedes Bundesland ist eine gleich große Kachel in grober geografischer Lage. Stadtstaaten und das Saarland bleiben so lesbar, und die Mini-Diagramme haben Platz. Im Original lagen die Säulen über Staatsgrenzen hinweg, kleine Staaten im Nordosten waren kaum zu erkennen." },
      { nr: 4, ziel: "geo-legende", versatz: [28, -2], regel: "EXPRESS – Klassen statt Farbverlauf", titel: "Fünf Graustufen, verdoppelnde Grenzen",
        text: "Das Marktpotenzial ist in fünf Graustufen eingeteilt; jede Klassengrenze verdoppelt die vorige (200, 400, 800, 1.600 Mio. €), der Wert steht zusätzlich in der Kachel. Das Original nutzte zwölf kaum unterscheidbare Blautöne mit gleich breiten Klassen." },
      { nr: 5, ziel: "geo-legende2", versatz: [28, -2], regel: "UNIFY – Abweichung nach Wirkung", titel: "Mini-Säulen mit Zahl",
        text: "Je Land zeigen zwei Mini-Säulen die Umsatzveränderung zum Vorquartal (links Q3, rechts Q4): blaugrün nach oben bei Zuwachs, rot nach unten bei Rückgang, mit Zahl. Das Original färbte die Säulen in drei Ampelklassen „Bad/Average/Good“ ohne Werte; Gelb ist im Druck kaum sichtbar." },
      { nr: 6, ziel: "geo-NW-bueros", anker: "links", versatz: [26, -26], regel: "UNIFY – Symbole", titel: "Vertriebsbüros als Kreise",
        text: "Jeder Kreis ist ein Vertriebsbüro; die Orte nennt der Tooltip. Im Original standen orangefarbene Punkte an der Lage der Büros – in einer Kachelkarte zählt die Anzahl je Land." },
      { nr: 7, ziel: "geo-SN", versatz: [40, 20], regel: "CHECK – Grenzen der Karte", titel: "Raumbezug nur, wenn er etwas sagt",
        text: "Echte Umrisse lassen große Flächenländer wichtiger wirken, als ihre Werte sind; Kacheln geben jedem Land gleiches Gewicht, zeigen die Lage aber nur grob. Ist die Lage für die Aussage unerheblich, ist ein nach Potenzial sortiertes Balkendiagramm mit Abweichungsspalten genauer." },
      { nr: 8, ziel: "geo-summe", versatz: [0, 4], regel: "CONDENSE – Interaktion", titel: "Region, Klick und Summe",
        text: "Der Schalter hebt eine Vertriebsregion hervor, ein Klick ein einzelnes Land; Aussage und Summenfeld folgen der Auswahl, der Tooltip nennt Quartalsumsätze und Büros. Esc hebt die Auswahl eines Landes auf." },
    ],
    nachbauIntro: "Seitengröße benutzerdefiniert 727 × 520 px. Schrift Arial: Beschriftungen 10,5 pt, Titel 12 pt. Datenmodell: Tabelle Länder (Kürzel, Bundesland, Region, Marktpotenzial, Umsatz Q2–Q4) und Tabelle Vertriebsbüros (Ort, Bundesland) wie in der CSV-Datei.",
    nachbau: [
      { id: "A", ziel: "geo-karte", anker: "links", versatz: [30, 2], titel: "Flächenfärbung Marktpotenzial", visual: "Flächenkartogramm (Standardvisual; alternativ Azure-Maps-Visual mit Ebene „Gefüllte Karte“)",
        felder: "Ort: Bundesland (Datenkategorie „Bundesland oder Kanton“, Land Deutschland); Farbsättigung bzw. Tooltip: Marktpotenzial",
        format: "Füllfarben › fx › Regeln: < 200 #EFEFEF, < 400 #D4D4D4, < 800 #A9A9A9, < 1.600 #6E747A, sonst #3A3F44; Kartenstil Graustufen; Beschriftungen aus",
        hinweis: "Das Standardvisual zeichnet echte Landesgrenzen; Stadtstaaten werden dann winzig. Eine Kachelkarte wie hier geht nur über die Formenzuordnung (Vorschaufunktion) mit eigener TopoJSON-Datei." },
      { id: "B", ziel: "geo-NW-bueros", anker: "links", versatz: [26, -26], titel: "Vertriebsbüros", visual: "Karte (Standardvisual) bzw. Blasenebene im Azure-Maps-Visual",
        felder: "Ort: Ort des Vertriebsbüros (Datenkategorie „Ort“); Blasengröße fest", format: "Blasen weiß mit Rahmen #1A1A1A, kleine feste Größe" },
      { id: "C", ziel: "geo-legende2", versatz: [28, -2], titel: "Umsatz zum Vorquartal", visual: "Matrix neben der Karte (Diagramme in Kartenflächen bietet kein Standardvisual)",
        felder: "Zeilen: Bundesland; Werte: ΔVQ Q3 % = DIVIDE([Umsatz Q3], [Umsatz Q2]) − 1, ΔVQ Q4 % = DIVIDE([Umsatz Q4], [Umsatz Q3]) − 1",
        format: "Bedingte Formatierung › Datenbalken: positiv #00806B, negativ #C62828; Interaktionen: Karte filtert Matrix und umgekehrt",
        hinweis: "Die Karte kann je Ort Kreisdiagramme zeigen (Feld Legende) – für Veränderungen mit Vorzeichen ungeeignet." },
      { id: "D", ziel: "geo-region", anker: "links", versatz: [-4, -2], titel: "Vertriebsregion", visual: "Datenschnitt", felder: "Länder[Region]", format: "Stil Kacheln, einfache Auswahl, ausgewählt #3A3F44" },
    ],
    theme: DK.thema(),
    csv: { name: "geo_visualisierung_daten.csv", text: () => ["Kuerzel;Bundesland;Region;Marktpotenzial_Mio_EUR;Umsatz_Q2_Tsd_EUR;Umsatz_Q3_Tsd_EUR;Umsatz_Q4_Tsd_EUR;Vertriebsbueros",
      ...L.map(x => [x.k, x.name, RG[x.r], x.pot, ...x.u, x.bueros.join(", ")].join(";"))].join("\r\n") },
    tabellen: () => {
      const xs = auswahlLaender(), g = gesamt(xs);
      return [{ titel: `Marktpotenzial und Umsatz ${J}${S.region === null ? "" : ` – Region ${RG[S.region]}`}`,
        kopf: ["Land", "Region", "Potenzial Mio. €", "Umsatz Q2 Tsd. €", "Q3", "Q4", "ΔVQ Q3 %", "ΔVQ Q4 %", "Büros"],
        zeilen: [...xs.map(x => [x.name, RG[x.r], zahl(x.pot), ...x.u.map(v => zahl(v)), delta(dq(x, 1), 1), delta(dq(x, 2), 1), zahl(x.bueros.length)]),
          ["Summe", "", zahl(g.pot), ...g.u.map(v => zahl(v)), delta(g.d3, 1), delta(g.d4, 1), zahl(g.bueros)]] }];
    },
  });
  zeichnen();
})();
