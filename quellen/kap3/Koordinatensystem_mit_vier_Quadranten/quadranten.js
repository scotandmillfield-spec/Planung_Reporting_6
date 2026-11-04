/* Einzelvisual „Koordinatensystem mit vier Quadranten“ (Abb. 3.62): Entwicklung der Geschäftsfelder 2027.
   Seite 727 x 500 px = 110 x 75,6 mm. Daten: quadranten.json (daten_quadranten.py) – Umsatz und Gewinn je
   Geschäftsfeld 2026 und 2027; Wachstumsrate und Gewinnanstieg werden hier berechnet (Lage wie im Original).
   Diagrammtyp bleibt: Achsenkreuz bei null, beide Achsen −15 % bis +15 %; die vier Quadranten sind benannt.
   Alle Geschäftsfelder als gleiche anthrazitfarbene Punkte, Name und Werte am Punkt. Klick hebt hervor. */
(() => {
  "use strict";
  const { zahl, delta, NBSP, sv, el } = DK;
  const [VJ, J] = DATA.jahre;
  const F = DATA.felder.map(([name, u0, u1, g0, g1], i) => ({ i, name, u0, u1, g0, g1,
    x: (u1 / u0 - 1) * 100, y: (g1 / g0 - 1) * 100 }));
  const SUM = k => F.reduce((s, f) => s + f[k], 0);
  const GES = { u0: SUM("u0"), u1: SUM("u1"), g0: SUM("g0"), g1: SUM("g1") };
  GES.x = (GES.u1 / GES.u0 - 1) * 100; GES.y = (GES.g1 / GES.g0 - 1) * 100;
  const QUAD = {   // Ecke: Name des Quadranten
    or: "Umsatz und Gewinn steigen", ol: "Gewinn steigt, Umsatz sinkt",
    ul: "Umsatz und Gewinn sinken", ur: "Umsatz steigt, Gewinn sinkt" };
  const quadrant = f => (f.y >= 0 ? "o" : "u") + (f.x >= 0 ? "r" : "l");
  const pz = (v, nk = 0) => delta(v, nk, NBSP + "%");
  const achse = t => (t === 0 ? "0" + NBSP + "%" : pz(t));
  const S = { auswahl: null };
  const auswaehlen = i => { S.auswahl = S.auswahl === i ? null : i; zeichnen(); };
  addEventListener("keydown", e => { if (e.key === "Escape" && S.auswahl !== null) { S.auswahl = null; zeichnen(); } });

  DK.init({ titel: "Koordinatensystem mit vier Quadranten", breite: 727, hoehe: 500 });
  const bVis = DK.box("v-quadranten", 16, 10, 695, 482);

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
  const namen = fs => fs.length > 1 ? fs.slice(0, -1).map(f => f.name).join(", ") + " und " + fs[fs.length - 1].name : fs[0].name;
  function botschaft(b) {
    if (S.auswahl !== null) {
      const f = F[S.auswahl];
      return passt([`${f.name}: Umsatz ${pz(f.x, 1)} auf ${zahl(f.u1, 1)} Mio. €, Gewinn ${pz(f.y, 1)} auf ${zahl(f.g1, 1)} Mio. €`,
        `${f.name}: Umsatz ${pz(f.x, 1)}, Gewinn ${pz(f.y, 1)} – ${QUAD[quadrant(f)]}`], b);
    }
    const q = k => F.filter(f => quadrant(f) === k);
    const or = q("or"), ul = q("ul"), ur = q("ur"), teile = [], kurz = [];
    if (or.length) { teile.push(`${namen(or)} steigern Umsatz und Gewinn`); kurz.push(teile[0]); }
    if (ul.length) { const t = `${namen(ul)} ${ul.length > 1 ? "verlieren" : "verliert"} beides`; teile.push(t); kurz.push(t); }
    if (ur.length) teile.push(`${namen(ur)} ${ur.length > 1 ? "wachsen" : "wächst"} bei sinkendem Gewinn`);
    return passt([teile.join("; ").replace(/; ([^;]*)$/, ", $1"), kurz.join("; "), teile[0] || ""], b);
  }

  function diagramm(ziel, breite, hoehe) {
    ziel.textContent = "";
    const svg = sv("svg", { width: breite, height: hoehe, role: "img",
      "aria-label": `Koordinatensystem: Wachstumsrate und Gewinnanstieg der Geschäftsfelder ${J} zum Vorjahr` }, ziel);
    const MIN = -15, MAX = 15, TICKS = [-15, -10, -5, 0, 5, 10, 15];
    const links = Math.ceil(Math.max(...TICKS.map(t => DK.tw(achse(t))))) + 10, rechts = 22, oben = 26, unten = 44;
    const PW = breite - links - rechts, PH = hoehe - oben - unten;
    const sx = v => links + (v - MIN) / (MAX - MIN) * PW, sy = v => oben + PH - (v - MIN) / (MAX - MIN) * PH;
    // Gitter, Achsenkreuz, Beschriftung
    const ga = sv("g", { id: "qu-achsen" }, svg);
    TICKS.forEach(t => {
      if (t !== 0 && t !== MIN && t !== MAX) {     // ohne äußere Linien: kein Rahmen
        sv("line", { x1: sx(t), x2: sx(t), y1: oben, y2: oben + PH, stroke: "#EBEBEB", "stroke-width": 1 }, ga);
        sv("line", { x1: links, x2: links + PW, y1: sy(t), y2: sy(t), stroke: "#EBEBEB", "stroke-width": 1 }, ga);
      }
      sv("text", { x: links - 8, y: sy(t), dy: "0.35em", "text-anchor": "end", class: "muted" }, ga, achse(t));
      sv("text", { x: sx(t), y: oben + PH + 17, "text-anchor": t === MIN ? "start" : t === MAX ? "end" : "middle", class: "muted" }, ga, achse(t));
    });
    sv("line", { x1: sx(0), x2: sx(0), y1: oben, y2: oben + PH, stroke: "#6E747A", "stroke-width": 1.2 }, ga);
    sv("line", { x1: links, x2: links + PW, y1: sy(0), y2: sy(0), stroke: "#6E747A", "stroke-width": 1.2 }, ga);
    sv("text", { x: 0, y: 12, class: "muted" }, ga, "Gewinnanstieg");
    sv("text", { x: links + PW, y: hoehe - 3, "text-anchor": "end", class: "muted" }, ga, "Wachstumsrate (Umsatz)");
    // Namen der Quadranten in den Ecken
    const gq = sv("g", { id: "qu-felder" }, svg), belegt = [];
    Object.entries(QUAD).forEach(([ecke, text]) => {
      const l = ecke[1] === "l", ob = ecke[0] === "o", w = DK.tw(text, 14, ecke === "or");
      const x = l ? links + 8 : links + PW - 8, y = ob ? oben + 14 : oben + PH - 10;
      sv("text", { x, y, dy: "0.35em", "text-anchor": l ? "start" : "end", class: ecke === "or" ? "" : "muted",
        style: ecke === "or" ? "font-weight:bold" : "" }, gq, text);
      belegt.push({ x: l ? x : x - w, y: y - 9, w, h: 18 });
    });
    // Punkte
    const R = 8, gp = sv("g", { id: "qu-punkte" }, svg), gn = sv("g", { id: "qu-namen" }, svg);
    const kreise = F.map(f => ({ f, cx: sx(f.x), cy: sy(f.y) }));
    kreise.forEach(({ f, cx, cy }) => {
      const blass = S.auswahl !== null && S.auswahl !== f.i;
      const g = sv("g", { class: "dk-klick" + (blass ? " dk-blass" : ""), "data-name": f.name }, gp);
      sv("circle", { cx, cy, r: R, fill: "#3A3F44", stroke: "#FFFFFF", "stroke-width": 1.5 }, g);
      const hit = sv("circle", { cx, cy, r: 16, fill: "transparent" }, g);
      hit.addEventListener("click", () => auswaehlen(f.i));
      tooltip(hit, () => [f.name, `Umsatz ${VJ}: ${zahl(f.u0, 1)} → ${J}: ${zahl(f.u1, 1)} Mio. € (${pz(f.x, 1)})`,
        `Gewinn ${VJ}: ${zahl(f.g0, 1)} → ${J}: ${zahl(f.g1, 1)} Mio. € (${pz(f.y, 1)})`,
        `Umsatzrendite ${J}: ${zahl(f.g1 / f.u1 * 100, 1)}${NBSP}% · ${QUAD[quadrant(f)]}`, "Klick hebt hervor"]);
    });
    // Name (fett) und Werte unter- bzw. nebeneinander: erste freie Lage rechts, links, oben, unten
    const schneidet = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
    const achsen = [{ x: sx(0) - 1, y: oben, w: 2, h: PH }, { x: links, y: sy(0) - 1, w: PW, h: 2 }];
    kreise.forEach(k => {
      const z2 = `Umsatz ${pz(k.f.x)}, Gewinn ${pz(k.f.y)}`;
      const w = Math.max(DK.tw(k.f.name, 14, true), DK.tw(z2)), h = 36, { cx, cy } = k, a = R + 6;
      const lagen = [[cx + a, cy - h / 2, "start"], [cx - a - w, cy - h / 2, "end"], [cx - w / 2, cy - a - h, "middle"],
        [cx - w / 2, cy + a, "middle"], [cx + a - 4, cy - a - h + 6, "start"], [cx - a - w + 4, cy - a - h + 6, "end"],
        [cx + a - 4, cy + a - 6, "start"], [cx - a - w + 4, cy + a - 6, "end"]];
      const innen = b => b.x >= links + 2 && b.x + b.w <= links + PW - 2 && b.y >= oben && b.y + b.h <= oben + PH;
      const frei = (b, streng) => innen(b) && !belegt.some(c => schneidet(b, c)) &&
        !kreise.some(o => schneidet(b, { x: o.cx - R - 2, y: o.cy - R - 2, w: 2 * R + 4, h: 2 * R + 4 })) &&
        (!streng || !achsen.some(c => schneidet(b, c)));
      const kand = lagen.map(([x, y, anker]) => ({ x, y, w, h, anker }));
      const b = kand.find(c => frei(c, true)) || kand.find(c => frei(c, false)) || kand[0];
      belegt.push(b);
      const tx = b.anker === "start" ? b.x : b.anker === "end" ? b.x + b.w : b.x + b.w / 2;
      const g = sv("g", { class: S.auswahl !== null && S.auswahl !== k.f.i ? "dk-blass" : "" }, gn);
      sv("text", { x: tx, y: b.y + 9, dy: "0.35em", "text-anchor": b.anker, style: "font-weight:bold" }, g, k.f.name);
      sv("text", { x: tx, y: b.y + 27, dy: "0.35em", "text-anchor": b.anker, class: "muted" }, g, z2);
    });
  }

  function zeichnen() {
    const v = DK.visual(bVis, { titel: `Entwicklung der Geschäftsfelder ${J}`, einheit: "Veränderung zum Vorjahr in %", botschaft: botschaft(695) });
    diagramm(v.flaeche, v.breite, v.hoehe);
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "v-quadranten", anker: "links", versatz: [692, 56], regel: "SAY – Botschaft vermitteln", titel: "Kernaussage unter dem Titel",
        text: "Unter dem Titel steht, was das Achsenkreuz zeigt: welche Geschäftsfelder Umsatz und Gewinn steigern und welche zurückfallen. Das Original hatte nur die Überschrift „Entwicklung Geschäftsfelder in 2014“." },
      { nr: 2, ziel: "qu-felder", anker: "links", versatz: [421, 0], regel: "STRUCTURE – Inhalte ordnen", titel: "Quadranten benannt",
        text: "Jeder Quadrant trägt in seiner Ecke eine Bedeutung – „Umsatz und Gewinn steigen“ oben rechts, hervorgehoben, „Umsatz und Gewinn sinken“ unten links. Im Original musste der Leser die Bedeutung der vier Felder selbst herleiten." },
      { nr: 3, ziel: "qu-punkte", anker: "links", versatz: [321, 93], regel: "UNIFY – Semantische Notation", titel: "Ein Zeichen für alle Geschäftsfelder",
        text: "Alle Geschäftsfelder sind gleiche anthrazitfarbene Punkte; sie unterscheiden sich durch Lage und Namen. Das Original nutzte vier Farben und vier Formen (Raute, Quadrat, Dreieck, Kreis), die nichts bedeuteten – Rot und Grün bleiben im Buch Abweichungen vorbehalten." },
      { nr: 4, ziel: "qu-namen", anker: "links", versatz: [363, 215], regel: "EXPRESS – Werte nennen", titel: "Name und Werte am Punkt",
        text: "Neben jedem Punkt stehen Name, Wachstumsrate und Gewinnanstieg. Im Original standen nur die Namen; die Werte waren nur an den Achsen abzuschätzen. Umsatz und Gewinn in Mio. € stehen im Tooltip." },
      { nr: 5, ziel: "qu-achsen", anker: "links", versatz: [396, 219], regel: "CHECK – Visuelle Integrität", titel: "Symmetrische Achsen, Kreuz bei null",
        text: "Beide Achsen reichen von −15 % bis +15 %, das Achsenkreuz liegt bei null und trennt die Quadranten – diese Stärke des Originals bleibt. Neu: Vorzeichen an den Achsenwerten, damit Zuwachs und Rückgang ohne Nachdenken lesbar sind." },
      { nr: 6, ziel: "qu-achsen", anker: "links", versatz: [515, 420], regel: "SIMPLIFY – Überflüssiges weglassen", titel: "Ohne Rahmen, Gitter hell",
        text: "Der Rahmen um die Zeichenfläche entfällt, das Gitter ist hellgrau und tritt hinter das Achsenkreuz zurück. Jahr und Vergleichsbasis stehen im Titel statt in einer zweizeiligen Überschrift." },
      { nr: 7, ziel: "qu-punkte", anker: "links", versatz: [32, 227], regel: "CONDENSE – Hervorheben", titel: "Klick auf einen Punkt",
        text: "Ein Klick hebt ein Geschäftsfeld hervor; die Aussage nennt dann Umsatz und Gewinn. Esc hebt die Auswahl auf. Soll zusätzlich die Größe der Geschäftsfelder sichtbar werden, wird aus dem Achsenkreuz ein Blasendiagramm mit dem Umsatz als Kreisfläche (Abb. 3.46)." },
    ],
    nachbauIntro: "Seitengröße benutzerdefiniert 727 × 500 px. Schrift Arial: Beschriftungen 10,5 pt, Titel 12 pt. Datenmodell: Tabelle Geschäftsfelder (Geschäftsfeld, Jahr, Umsatz, Gewinn) wie in der CSV-Datei.",
    nachbau: [
      { id: "A", ziel: "qu-punkte", anker: "links", versatz: [225, 127], titel: "Achsenkreuz", visual: "Punktdiagramm (Standardvisual)",
        felder: "Werte: Geschäftsfeld; X-Achse: Measure Wachstumsrate = DIVIDE(CALCULATE(SUM([Umsatz]); [Jahr] = 2027); CALCULATE(SUM([Umsatz]); [Jahr] = 2026)) − 1; Y-Achse: Measure Gewinnanstieg analog mit [Gewinn]",
        format: "X- und Y-Achse fest −0,15 bis 0,15, Format Prozent mit Vorzeichen; Markierung Kreis #3A3F44, Größe 8; Kategoriebeschriftungen ein; Gitternetz #EBEBEB",
        hinweis: "Achsenkreuz über den Analysebereich: konstante X-Linie und konstante Y-Linie bei 0, #6E747A, durchgezogen." },
      { id: "B", ziel: "qu-felder", anker: "links", versatz: [421, 0], titel: "Namen der Quadranten", visual: "Vier Textfelder über dem Visual",
        felder: "statischer Text", format: "10,5 pt, #4D4D4D; „Umsatz und Gewinn steigen“ fett #1A1A1A" },
    ],
    theme: DK.thema(),
    csv: { name: "geschaeftsfelder_daten.csv", text: () => ["Geschaeftsfeld;Jahr;Umsatz_Mio_EUR;Gewinn_Mio_EUR",
      ...F.flatMap(f => [[f.name, VJ, zahl(f.u0, 1), zahl(f.g0, 1)].join(";"), [f.name, J, zahl(f.u1, 1), zahl(f.g1, 1)].join(";")])]
      .join("\r\n") },
    tabellen: () => [{ titel: `Geschäftsfelder ${J} zum Vorjahr (Mio. €)`, kopf: ["Geschäftsfeld", `Umsatz ${VJ}`, `Umsatz ${J}`, "Wachstumsrate", `Gewinn ${VJ}`, `Gewinn ${J}`, "Gewinnanstieg", "Quadrant"],
      zeilen: [...F.map(f => [f.name, zahl(f.u0, 1), zahl(f.u1, 1), pz(f.x, 1), zahl(f.g0, 1), zahl(f.g1, 1), pz(f.y, 1), QUAD[quadrant(f)]]),
        ["Gesamt", zahl(GES.u0, 1), zahl(GES.u1, 1), pz(GES.x, 1), zahl(GES.g0, 1), zahl(GES.g1, 1), pz(GES.y, 1), ""]] }],
  });
  zeichnen();
})();
