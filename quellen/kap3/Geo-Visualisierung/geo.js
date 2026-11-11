/* Einzelvisual „Geo-Visualisierung“ (Abb. 3.66, eigene Abbildung): Marktpotenzial und Umsatzentwicklung je Bundesland.
   Seite 727 x 520 px = 110 x 78,7 mm. Daten: geo.json (daten_geo.py), Werte erfunden.
   Links eine Karte der Bundesländer (Grenzen Natural Earth, gemeinfrei; als SVG-Pfade in geo.json, keine
   Kartenkacheln oder Bibliotheken): Flächenhelligkeit = Marktpotenzial (fünf Graustufen-Klassen), Kreise für
   Vertriebsbüros an ihrem Standort. Rechts je Land Potenzial und Umsatzveränderung zum Vorquartal (Q3, Q4) als
   Abweichungsbalken nach Wirkung. Schalter Vertriebsregion, Klick auf Land oder Zeile hebt das Land hervor. */
(() => {
  "use strict";
  const { zahl, delta, NBSP, sv, el, FARBE } = DK;
  const J = DATA.jahr, RG = DATA.regionen, KL = DATA.klassen;
  const L = DATA.laender.map(([k, name, r, , , pot, u, bueros]) => ({ k, name, r, pot, u, bueros }));
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

  /* ---------- Karte und Werteliste ---------- */
  const KA = DATA.karte;
  const REIHE = L.slice().sort((a, c) => a.r - c.r || c.pot - a.pot);           // nach Region, darin nach Potenzial
  function karte(ziel, breite, hoehe) {
    ziel.textContent = "";
    const svg = sv("svg", { width: breite, height: hoehe, role: "img",
      "aria-label": `Karte der Bundesländer: Marktpotenzial ${J} als Graustufe, Vertriebsbüros an ihren Standorten; daneben Umsatzveränderung zum Vorquartal je Land` }, ziel);
    // Legende
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
    sv("text", { x: 17, y: 30, dy: "0.35em", class: "muted" }, gl2, "Vertriebsbüro (Standort)");

    // Karte
    const oben = 50, mh = hoehe - oben, k = Math.min(310 / KA.breite, mh / KA.hoehe), mw = KA.breite * k;
    const P = ([px, py]) => [px * k, oben + py * k];
    const blassL = y => (S.region !== null && y.r !== S.region) || (S.auswahl !== null && S.auswahl !== y.k);
    const gk = sv("g", { id: "geo-karte" }, svg);
    const gf = sv("g", { transform: `translate(0 ${oben}) scale(${k})` }, gk);
    L.forEach(y => {
      const g = sv("g", { id: `geo-${y.k}`, class: "dk-klick" + (blassL(y) ? " dk-blass" : ""), "data-name": y.name }, gf);
      const pf = sv("path", { d: KA.pfade[y.k], fill: FUELL[klasse(y.pot)], stroke: "#FFFFFF", "stroke-width": 1,
        "vector-effect": "non-scaling-stroke", "fill-rule": "evenodd", "stroke-linejoin": "round" }, g);
      pf.addEventListener("click", () => auswaehlen(y.k));
      tooltip(pf, () => tipLand(y));
    });
    if (S.auswahl !== null)
      sv("path", { d: KA.pfade[S.auswahl], fill: "none", stroke: "#1A1A1A", "stroke-width": 2, "vector-effect": "non-scaling-stroke",
        "fill-rule": "evenodd", "pointer-events": "none" }, gf);
    // Landeskürzel, Stadtstaaten und Saarland mit Hinweislinie
    const gt = sv("g", { id: "geo-kuerzel", "pointer-events": "none" }, gk);
    L.forEach(y => {
      const v = KA.kuerzel[y.k], [lx, ly] = P(v), aussen = v.length > 2;
      const op = blassL(y) ? 0.32 : 1;
      if (aussen) {
        const [ax, ay] = P(v.slice(2)), w = DK.tw(y.k, 14, true) / 2 + 3;
        const ex = lx + (ax > lx ? w : -w);
        sv("line", { x1: ex, y1: ly, x2: ax, y2: ay, stroke: "#1A1A1A", "stroke-width": 1, opacity: op }, gt);
      }
      const dunkel = !aussen && klasse(y.pot) >= 3;
      sv("text", { x: lx, y: ly, dy: "0.35em", "text-anchor": "middle", opacity: op,
        style: `font-weight:bold;fill:${dunkel ? "#FFFFFF" : "#1A1A1A"}` + (aussen ? ";paint-order:stroke;stroke:#FFFFFF;stroke-width:3px" : "") }, gt, y.k);
    });
    // Vertriebsbüros
    const gb = sv("g", { id: "geo-bueros" }, gk);
    L.forEach(y => y.bueros.forEach(o => {
      const [cx, cy] = P(KA.orte[o]);
      const c = sv("circle", { cx, cy, r: 4.5, fill: "#FFFFFF", stroke: "#1A1A1A", "stroke-width": 1.3,
        class: blassL(y) ? "dk-blass" : "" }, gb);
      tooltip(c, () => [`Vertriebsbüro ${o}`, `${y.name} (Region ${RG[y.r]})`]);
    }));

    // Werteliste rechts: Land, Potenzial, Umsatz zum Vorquartal Q3 und Q4
    const x0 = Math.ceil(mw) + 16, tb = breite - x0;
    const nameW = Math.ceil(Math.max(...L.map(y => DK.tw(y.name)))) + 8;
    const potR = x0 + nameW + 40, blockW = (breite - potR - 8) / 2;
    const txtW = 34, kopfH = 20, zh = Math.min(22, Math.floor((hoehe - oben - kopfH - 26) / L.length));
    // ein Maßstab für beide Spalten, Nulllinie nach Spanne der Werte (wie Datenbalken „Achse automatisch“)
    const alle = L.flatMap(y => [dq(y, 1), dq(y, 2)]);
    const neg = Math.max(0, ...alle.map(v => -v)), pos = Math.max(0, ...alle);
    const bk = (blockW - txtW - 6) / (neg + pos);
    const gw = sv("g", { id: "geo-liste" }, svg);
    const ty0 = oben;
    sv("text", { x: x0, y: ty0 + 8, dy: "0.35em", class: "muted" }, gw, "Land");
    sv("text", { x: potR, y: ty0 + 8, dy: "0.35em", "text-anchor": "end", class: "muted" }, gw, "Mio. €");
    const gq = sv("g", { id: "geo-delta-kopf" }, gw);
    ["ΔVQ Q3", "ΔVQ Q4"].forEach((t, n) => sv("text", { x: potR + 8 + n * blockW + blockW / 2, y: ty0 + 8, dy: "0.35em",
      "text-anchor": "middle", class: "muted" }, gq, t));
    sv("line", { x1: x0, x2: breite, y1: ty0 + kopfH - 0.5, y2: ty0 + kopfH - 0.5, stroke: "#3A3F44", "stroke-width": 1 }, gw);
    const spalte = (g, yy, d, n, fett, balken) => {
      const bx = potR + 8 + n * blockW, kl = DK.wirkung(d, 1, 1), mitte = bx + txtW + 4 + neg * bk;
      sv("text", { x: bx + txtW, y: yy, dy: "0.35em", "text-anchor": "end",
        style: `fill:${kl === "neutral" ? "#1A1A1A" : FARBE[kl]};font-weight:${fett ? "bold" : "normal"}` }, g, delta(d, 1));
      if (!balken) return;
      const w = Math.max(1, Math.abs(d) * bk);
      sv("rect", { x: d >= 0 ? mitte : mitte - w, y: yy - 5, width: w, height: 10, fill: FARBE[kl] }, g);
      sv("line", { x1: mitte, x2: mitte, y1: yy - zh / 2 + 2, y2: yy + zh / 2 - 2, stroke: "#8C8C8C", "stroke-width": 1 }, g);
    };
    REIHE.forEach((y, i) => {
      const yy = ty0 + kopfH + i * zh + zh / 2, g = sv("g", { id: `geo-zeile-${y.k}`, class: "dk-klick" + (blassL(y) ? " dk-blass" : "") }, gw);
      if (i > 0 && REIHE[i - 1].r !== y.r)
        sv("line", { x1: x0, x2: breite, y1: yy - zh / 2 + 0.5, y2: yy - zh / 2 + 0.5, stroke: "#9A9A9A", "stroke-width": 1 }, gw);
      sv("text", { x: x0, y: yy, dy: "0.35em", style: S.auswahl === y.k ? "font-weight:bold" : "" }, g, y.name);
      sv("text", { x: potR, y: yy, dy: "0.35em", "text-anchor": "end" }, g, zahl(y.pot));
      spalte(g, yy, dq(y, 1), 0, false, true);
      spalte(g, yy, dq(y, 2), 1, false, true);
      const hit = sv("rect", { x: x0, y: yy - zh / 2, width: tb, height: zh, fill: "transparent" }, g);
      hit.addEventListener("click", () => auswaehlen(y.k));
      tooltip(hit, () => tipLand(y));
    });
    // Summenzeile: Deutschland bzw. gewählte Region
    const ys = ty0 + kopfH + L.length * zh, g = gesamt(auswahlLaender()), gs = sv("g", { id: "geo-summe" }, gw);
    sv("line", { x1: x0, x2: breite, y1: ys + 0.5, y2: ys + 0.5, stroke: "#3A3F44", "stroke-width": 1 }, gs);
    const yy = ys + 13;
    sv("text", { x: x0, y: yy, dy: "0.35em", style: "font-weight:bold" }, gs, S.region === null ? "Deutschland" : `Region ${RG[S.region]}`);
    sv("text", { x: potR, y: yy, dy: "0.35em", "text-anchor": "end", style: "font-weight:bold" }, gs, zahl(g.pot));
    spalte(gs, yy, g.d3, 0, true, false);
    spalte(gs, yy, g.d4, 1, true, false);
  }
  const tipLand = y => [`${y.name} (Region ${RG[y.r]})`, `Marktpotenzial ${zahl(y.pot)} Mio. € p. a.`,
    `Umsatz ${QN.map((q, i) => `${q} ${zahl(y.u[i])}`).join(" · ")} Tsd. €`,
    `Zum Vorquartal: Q3 ${pz(dq(y, 1))}, Q4 ${pz(dq(y, 2))}`,
    y.bueros.length ? `Vertriebsbüros: ${y.bueros.join(", ")}` : "Kein Vertriebsbüro", "Klick hebt das Land hervor"];

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
      { nr: 3, ziel: "geo-karte", anker: "links", versatz: [30, 2], regel: "STRUCTURE – Karte und Liste", titel: "Karte für die Lage, Liste für die Werte",
        text: "Die Karte zeigt die Bundesländer mit ihren Grenzen; Stadtstaaten und das Saarland sind über Hinweislinien beschriftet. Die genauen Werte stehen in einer Liste daneben, nach Vertriebsregion gruppiert. Im Original lagen Mini-Säulen auf der Karte über Staatsgrenzen hinweg, kleine Staaten im Nordosten waren kaum zu erkennen." },
      { nr: 4, ziel: "geo-legende", versatz: [28, -2], regel: "EXPRESS – Klassen statt Farbverlauf", titel: "Fünf Graustufen, verdoppelnde Grenzen",
        text: "Das Marktpotenzial ist in fünf Graustufen eingeteilt; jede Klassengrenze verdoppelt die vorige (200, 400, 800, 1.600 Mio. €), der Wert steht zusätzlich in der Liste. Das Original nutzte zwölf kaum unterscheidbare Blautöne mit gleich breiten Klassen." },
      { nr: 5, ziel: "geo-delta-kopf", versatz: [0, -26], regel: "UNIFY – Abweichung nach Wirkung", titel: "Abweichungsbalken mit Zahl",
        text: "Je Land zeigen zwei Abweichungsbalken die Umsatzveränderung zum Vorquartal (Q3, Q4): blaugrün nach rechts bei Zuwachs, rot nach links bei Rückgang, mit Zahl und einem Maßstab für beide Spalten. Das Original färbte Mini-Säulen in drei Ampelklassen „Bad/Average/Good“ ohne Werte; Gelb ist im Druck kaum sichtbar." },
      { nr: 6, ziel: "geo-bueros", anker: "links", versatz: [26, 40], regel: "UNIFY – Symbole", titel: "Vertriebsbüros als Kreise",
        text: "Jeder Kreis ist ein Vertriebsbüro an seinem Standort; den Ort nennt der Tooltip. Weiß mit dunklem Rand bleibt der Kreis auf hellen und dunklen Flächen sichtbar – im Original waren es orangefarbene Punkte." },
      { nr: 7, ziel: "geo-SN", versatz: [10, 20], regel: "CHECK – Grenzen der Karte", titel: "Raumbezug nur, wenn er etwas sagt",
        text: "Große Flächenländer wirken auf der Karte wichtiger, als ihre Werte sind, Stadtstaaten gehen fast unter. Deshalb zeigt die Fläche nur Klassen, die Werte stehen in der Liste. Ist die Lage für die Aussage unerheblich, genügt ein nach Potenzial sortiertes Balkendiagramm mit Abweichungsspalten." },
      { nr: 8, ziel: "geo-summe", versatz: [0, 4], regel: "CONDENSE – Interaktion", titel: "Region, Klick und Summe",
        text: "Der Schalter hebt eine Vertriebsregion hervor, ein Klick auf Land oder Zeile ein einzelnes Land; Aussage und Summenzeile folgen der Auswahl, der Tooltip nennt Quartalsumsätze und Büros. Esc hebt die Auswahl eines Landes auf." },
    ],
    nachbauIntro: "Seitengröße benutzerdefiniert 727 × 520 px. Schrift Arial: Beschriftungen 10,5 pt, Titel 12 pt. Datenmodell: Tabelle Länder (Kürzel, Bundesland, Region, Marktpotenzial, Umsatz Q2–Q4, Vertriebsbüros) wie in der CSV-Datei, dazu eine Tabelle Vertriebsbüros (Ort, Bundesland, Breite, Länge).",
    nachbau: [
      { id: "A", ziel: "geo-karte", anker: "links", versatz: [30, 2], titel: "Flächenfärbung Marktpotenzial", visual: "Flächenkartogramm (Standardvisual; alternativ Azure-Maps-Visual mit Ebene „Gefüllte Karte“)",
        felder: "Ort: Bundesland (Datenkategorie „Bundesland oder Kanton“, Land Deutschland); Farbsättigung bzw. Tooltip: Marktpotenzial",
        format: "Füllfarben › fx › Regeln: < 200 #EFEFEF, < 400 #D4D4D4, < 800 #A9A9A9, < 1.600 #6E747A, sonst #3A3F44; Rahmen weiß; Kartenstil Graustufen oder leer; Beschriftungen aus",
        hinweis: "Alternativ die Formenzuordnung (Vorschaufunktion) mit der Karte „Deutschland: Bundesländer“; Hinweislinien für Stadtstaaten lassen sich nicht automatisch setzen." },
      { id: "B", ziel: "geo-bueros", anker: "links", versatz: [26, 40], titel: "Vertriebsbüros", visual: "Blasenebene im Azure-Maps-Visual (über der Flächenebene)",
        felder: "Breitengrad, Längengrad bzw. Ort des Vertriebsbüros; Blasengröße fest", format: "Blasen weiß mit Rahmen #1A1A1A, kleine feste Größe" },
      { id: "C", ziel: "geo-delta-kopf", versatz: [0, -26], titel: "Werteliste", visual: "Matrix neben der Karte (Zeilen: Region, Bundesland; Layout tabellarisch)",
        felder: "Zeilen: Region, Bundesland; Werte: Marktpotenzial, ΔVQ Q3 % = DIVIDE([Umsatz Q3], [Umsatz Q2]) − 1, ΔVQ Q4 % = DIVIDE([Umsatz Q4], [Umsatz Q3]) − 1",
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
