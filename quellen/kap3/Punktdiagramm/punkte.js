/* Einzelvisual „Punktdiagramm“ (Abb. 3.61): Umsatz der SGE A je Quartal, Plan und Ist.
   Seite 727 x 360 px = 110 x 54,5 mm. Daten: punkte.json (daten_punkte.py), Werte des Originals – dieselben wie
   im Säulendiagramm Abb. 3.48. Diagrammtyp bleibt: je Quartal ein Punkt für Plan und einer für Ist. Notation nach
   IBCS: Ist anthrazit gefüllt, Plan weiß mit Kontur; eine senkrechte Linie verbindet beide und ist nach Wirkung
   gefärbt. Da Punkte Lagen und keine Längen zeigen, beginnt die Achse bei 80. Klick hebt ein Quartal hervor. */
(() => {
  "use strict";
  const { zahl, delta, NBSP, sv, el, FARBE } = DK;
  const Q = DATA.quartale, PL = DATA.plan, IST = DATA.ist, J = DATA.jahr;
  const QLANG = ["1. Quartal", "2. Quartal", "3. Quartal", "4. Quartal"];
  const S = { auswahl: null };
  const auswaehlen = i => { S.auswahl = S.auswahl === i ? null : i; zeichnen(); };
  addEventListener("keydown", e => { if (e.key === "Escape" && S.auswahl !== null) { S.auswahl = null; zeichnen(); } });

  DK.init({ titel: "Punktdiagramm", breite: 727, hoehe: 360 });
  const bVis = DK.box("v-punkte", 16, 10, 695, 342);

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
  const ACHSE = { min: 80, max: 140, ticks: [80, 100, 120, 140] };

  function botschaft(b) {
    const passt = k => k.find(t => DK.tw(t) <= b) || k[k.length - 1];
    if (S.auswahl !== null) {
      const i = S.auswahl, d = dpl(i);
      return passt([`${QLANG[i]}: Ist ${zahl(IST[i])} bei Plan ${zahl(PL[i])} Mio. €, ΔPL ${delta(d, 0)} (${delta(d / PL[i] * 100, 1, NBSP + "%")})`]);
    }
    const idx = Q.map((q, i) => i), ueber = idx.filter(i => dpl(i) > 0), unter = idx.filter(i => dpl(i) < 0), ds = summe(IST) - summe(PL);
    const liste = is => (is.length > 2 && is[is.length - 1] - is[0] === is.length - 1 ? `${Q[is[0]]} bis ${Q[is[is.length - 1]]}` : is.map(i => Q[i]).join(", "));
    const teil = unter.length ? `${liste(unter)} ${zahl(Math.abs(summe(unter.map(dpl))))} Mio. € unter Plan` : "kein Quartal unter Plan";
    const jahr = `Jahr ${delta(ds, 0)} Mio. € (${delta(ds / summe(PL) * 100, 1, NBSP + "%")})`;
    return passt([ueber.length ? `Ist über Plan in ${liste(ueber)}, ${teil}; ${jahr}` : `${teil}; ${jahr}`, `${teil}; ${jahr}`]);
  }

  function punkte(ziel, breite, hoehe) {
    ziel.textContent = "";
    const svg = sv("svg", { width: breite, height: hoehe, role: "img", "aria-label": `Punktdiagramm: Umsatz SGE A ${J} je Quartal, Plan und Ist` }, ziel);
    // Legende rechts oben
    const gl = sv("g", { id: "pu-legende" }, svg);
    const lx = breite - DK.tw("Plan") - DK.tw("Ist") - 62;
    sv("circle", { cx: lx + 6, cy: 8, r: 6, fill: "#3A3F44" }, gl);
    sv("text", { x: lx + 18, y: 8, dy: "0.35em", class: "muted" }, gl, "Ist");
    const lx2 = lx + 18 + DK.tw("Ist") + 16;
    sv("circle", { cx: lx2 + 6, cy: 8, r: 5.5, fill: "#FFFFFF", stroke: "#3A3F44", "stroke-width": 1.5 }, gl);
    sv("text", { x: lx2 + 18, y: 8, dy: "0.35em", class: "muted" }, gl, "Plan");
    // Größenachse ab 80: helle Gitterlinien, Beschriftung links
    const oben = 40, unten = 66, H = hoehe - oben - unten, links = 56, B = breite - links;
    const sy = v => oben + H - (v - ACHSE.min) / (ACHSE.max - ACHSE.min) * H;
    const ga = sv("g", { id: "pu-achse" }, svg);
    ACHSE.ticks.forEach(t => {
      sv("line", { x1: links, x2: breite, y1: sy(t), y2: sy(t), stroke: "#E3E3E3", "stroke-width": 1 }, ga);
      sv("text", { x: links - 10, y: sy(t), dy: "0.35em", "text-anchor": "end", class: "muted" }, ga, zahl(t));
    });
    // Punkte je Quartal: Plan und Ist auf einer Senkrechten, Verbindungslinie nach Wirkung
    const fach = B / Q.length;
    const gp = sv("g", { id: "pu-punkte" }, svg), gd = sv("g", { id: "pu-abweichung" }, svg);
    sv("text", { x: 0, y: oben + H + 52, dy: "0.35em", class: "muted" }, gd, "ΔPL");
    Q.forEach((q, i) => {
      const cx = links + fach * (i + 0.5), blass = S.auswahl !== null && S.auswahl !== i, d = dpl(i);
      const g = sv("g", { class: "dk-klick" + (blass ? " dk-blass" : ""), "data-name": q }, gp);
      const yP = sy(PL[i]), yI = sy(IST[i]);
      sv("line", { x1: cx, x2: cx, y1: yP, y2: yI, stroke: FARBE[klasse(d)], "stroke-width": 3 }, g);
      sv("circle", { cx, cy: yP, r: 7, fill: "#FFFFFF", stroke: "#3A3F44", "stroke-width": 1.5 }, g);
      sv("circle", { cx, cy: yI, r: 7.5, fill: "#3A3F44" }, g);
      // Werte rechts neben den Punkten: Ist fett, Plan normal
      sv("text", { x: cx + 14, y: yI, dy: "0.35em", style: "font-weight:bold" }, g, zahl(IST[i]));
      sv("text", { x: cx + 14, y: yP, dy: "0.35em", class: "muted" }, g, zahl(PL[i]));
      sv("text", { x: cx, y: oben + H + 20, dy: "0.35em", "text-anchor": "middle" }, g, q);
      const hit = sv("rect", { x: cx - fach / 2, y: oben - 16, width: fach, height: H + 46, fill: "transparent" }, g);
      hit.addEventListener("click", () => auswaehlen(i));
      tooltip(hit, () => [`${QLANG[i]} ${J}`, `Ist ${zahl(IST[i])} Mio. € · Plan ${zahl(PL[i])} Mio. €`,
        `ΔPL ${delta(d, 0)} Mio. € (${delta(d / PL[i] * 100, 1, NBSP + "%")})`, "Klick hebt das Quartal hervor"]);
      sv("text", { x: cx, y: oben + H + 52, dy: "0.35em", "text-anchor": "middle", class: blass ? "dk-blass" : "",
        style: `font-weight:bold;fill:${FARBE[klasse(d)]}` }, gd, delta(d, 0));
    });
  }

  function zeichnen() {
    const v = DK.visual(bVis, { titel: `Umsatz SGE A ${J} je Quartal`, einheit: "Mio. €", botschaft: botschaft(695) });
    punkte(v.flaeche, v.breite, v.hoehe);
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "v-punkte", anker: "links", versatz: [690, 26], regel: "SAY – Botschaft vermitteln", titel: "Kernaussage unter dem Titel",
        text: "Unter dem Titel steht, was die Punkte zeigen: Ist über Plan in den ersten drei Quartalen, im vierten darunter, im Jahr insgesamt über Plan. Das Original hatte nur die Überschrift „Umsatz SGE A“." },
      { nr: 2, ziel: "pu-legende", anker: "links", versatz: [-6, -2], regel: "UNIFY – Semantische Notation", titel: "Ist gefüllt, Plan als Kontur",
        text: "Szenarien folgen der Notation des Buches: Ist anthrazit gefüllt, Plan weiß mit Kontur – wie im Säulendiagramm (Abb. 3.48) mit denselben Zahlen. Das Original unterschied Plan und Ist durch dunkelblaue Rauten und pinkfarbene Quadrate." },
      { nr: 3, ziel: "pu-punkte", anker: "links", versatz: [76, 103], regel: "EXPRESS – Abweichung zeigen", titel: "Verbindungslinie nach Wirkung",
        text: "Eine senkrechte Linie verbindet Plan und Ist; ihre Länge ist die Abweichung, ihre Farbe die Wirkung – blaugrün bei Mehrumsatz, rot bei Minderumsatz. Darunter steht die Abweichung als Zahl. Im Original musste man die Differenz aus zwei Beschriftungen selbst ausrechnen." },
      { nr: 4, ziel: "pu-achse", anker: "links", versatz: [68, 176], regel: "CHECK – Visuelle Integrität", titel: "Achse ab 80 – erlaubt bei Punkten",
        text: "Punkte zeigen Lagen, keine Längen. Deshalb darf die Achse über null beginnen, solange sie beschriftet ist – anders als bei Säulen und Balken (Abb. 3.53). Im Original reichte die Achse von 0 bis 140; die Punkte drängten sich im oberen Viertel, die Abstände waren kaum zu erkennen." },
      { nr: 5, ziel: "pu-punkte", anker: "links", versatz: [636, 40], regel: "SIMPLIFY – Überflüssiges weglassen", titel: "Werte am Punkt, Gitter nur hell",
        text: "Die Werte stehen rechts neben den Punkten, Ist fett. Im Original überlagerten sich Beschriftungen und Punkte im vierten Quartal, der letzte Wert war am Rand abgeschnitten. Achsentitel „Quartal“ und „Mio. €“ und die Legende unter dem Diagramm entfallen; die Einheit steht im Titel." },
      { nr: 6, ziel: "pu-abweichung", anker: "links", versatz: [70, 0], regel: "STRUCTURE – Inhalte ordnen", titel: "Gleiche Achse wie die Säulen",
        text: "Quartale in natürlicher Reihenfolge, Abweichungszeile darunter – derselbe Aufbau wie im Säulendiagramm. So lassen sich beide Darstellungsformen an denselben Zahlen vergleichen: Säulen betonen die Höhe, Punkte den Abstand zwischen Plan und Ist." },
      { nr: 7, ziel: "pu-punkte", anker: "links", versatz: [516, 177], regel: "CONDENSE – Hervorheben", titel: "Klick auf ein Quartal",
        text: "Ein Klick auf ein Quartal hebt es hervor; die Aussage nennt Ist, Plan und Abweichung absolut und relativ. Esc hebt die Auswahl auf." },
    ],
    nachbauIntro: "Seitengröße benutzerdefiniert 727 × 360 px. Schrift Arial: Beschriftungen 10,5 pt, Titel 12 pt. Datenmodell: Tabelle Umsatz (SGE, Jahr, Quartal, Plan, Ist) wie in der CSV-Datei.",
    nachbau: [
      { id: "A", ziel: "pu-punkte", versatz: [0, 0], titel: "Punkte Plan und Ist", visual: "Liniendiagramm (Standardvisual) mit ausgeblendeten Linien",
        felder: "X-Achse: Quartal (Typ kategorisch); Y-Achse: Plan, Ist", format: "Linien › Strichbreite 0; Markierungen ein, Form Kreis, Größe 7; Ist #3A3F44, Plan #FFFFFF mit Rahmen #3A3F44 (ohne Rahmenoption: Plan #9A9A9A); Datenbeschriftungen rechts; Y-Achse Start 80, Ende 140; Gitternetz #E3E3E3",
        hinweis: "Das Punktdiagramm (Streudiagramm) von Power BI braucht numerische X-Werte; für Quartale ist das Liniendiagramm ohne Linien der einfachere Weg." },
      { id: "B", ziel: "pu-punkte", anker: "links", versatz: [76, 103], titel: "Verbindungslinie", visual: "Fehlerbalken im selben Liniendiagramm (Analysebereich)",
        felder: "Measures ΔPL positiv = MAX([Ist] − [Plan]; 0) und ΔPL negativ = MIN([Ist] − [Plan]; 0); Fehlerbalken an der Reihe Plan, Obergrenze = [Plan] + [ΔPL positiv], Untergrenze = [Plan] + [ΔPL negativ]",
        format: "Fehlerbalken: Strichbreite 3, Farbe je Richtung #00806B bzw. #C62828 (zwei Reihen), keine Endmarken" },
      { id: "C", ziel: "pu-abweichung", anker: "links", versatz: [70, 0], titel: "Abweichung", visual: "Tabelle oder Matrix unter dem Diagramm",
        felder: "Measure ΔPL = SUM(Umsatz[Ist]) − SUM(Umsatz[Plan])", format: "Bedingte Schriftfarbe: > 0 #00806B, < 0 #C62828" },
    ],
    theme: DK.thema(),
    csv: { name: "punktdiagramm_daten.csv", text: () => ["SGE;Jahr;Quartal;Plan_Mio_EUR;Ist_Mio_EUR;Abweichung_Mio_EUR",
      ...Q.map((q, i) => ["SGE A", J, q, PL[i], IST[i], dpl(i)].join(";"))].join("\r\n") },
    tabellen: () => [{ titel: `Umsatz SGE A ${J} (Mio. €)`, kopf: ["Quartal", "Plan", "Ist", "ΔPL", "ΔPL in %"],
      zeilen: [...Q.map((q, i) => [q, zahl(PL[i]), zahl(IST[i]), delta(dpl(i), 0), delta(dpl(i) / PL[i] * 100, 1)]),
        ["Jahr", zahl(summe(PL)), zahl(summe(IST)), delta(summe(IST) - summe(PL), 0), delta((summe(IST) / summe(PL) - 1) * 100, 1)]] }],
  });
  zeichnen();
})();
