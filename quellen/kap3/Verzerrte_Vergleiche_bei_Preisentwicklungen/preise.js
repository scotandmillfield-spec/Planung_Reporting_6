/* Einzelvisual „Verzerrte Vergleiche bei Preisentwicklungen“ (Abb. 3.60): dieselben Preisreihen dreier Segmente
   zweimal als Liniendiagramm – a) lineare Skala, b) logarithmische Skala. Seite 727 x 340 px = 110 x 51,4 mm.
   Daten: preise.json (daten_preise.py), Werte aus dem Original abgelesen. Negativbeispiel: Der verzerrte Eindruck in a)
   bleibt bewusst sichtbar (A scheint viel stärker zu steigen als C, obwohl sich alle drei Preise verdoppeln); beide Teile
   sonst gleich gestaltet. Klick auf eine Linie hebt das Segment in beiden Teilen hervor. */
(() => {
  "use strict";
  const { zahl, delta, NBSP, sv, el } = DK;
  const J = DATA.jahre;
  const SEG = DATA.segmente.map(([name, w], i) => ({ i, name, kurz: name.replace("Segment ", ""), w }));
  const [L0, L1, LS] = DATA.achse_linear, [G0, G1, GT] = DATA.achse_log;
  const S = { auswahl: null };
  const auswaehlen = i => { S.auswahl = S.auswahl === i ? null : i; zeichnen(); };
  addEventListener("keydown", e => { if (e.key === "Escape" && S.auswahl !== null) { S.auswahl = null; zeichnen(); } });

  DK.init({ titel: "Verzerrte Vergleiche bei Preisentwicklungen", breite: 727, hoehe: 340 });
  const bA = DK.box("v-linear", 16, 10, 338, 322);
  const bB = DK.box("v-log", 373, 10, 338, 322);
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
  const eur = v => zahl(v, 1) + NBSP + "€";
  const anstieg = s => s.w[s.w.length - 1] - s.w[0];
  const rate = s => s.w[s.w.length - 1] / s.w[0] - 1;
  const pz = v => delta(v * 100, 0, NBSP + "%");
  const groesst = SEG.reduce((a, b) => (anstieg(b) > anstieg(a) ? b : a)), kleinst = SEG.reduce((a, b) => (anstieg(b) < anstieg(a) ? b : a));

  function diagramm(ziel, breite, hoehe, log, id) {
    ziel.textContent = "";
    const svg = sv("svg", { width: breite, height: hoehe, role: "img",
      "aria-label": `Preisentwicklung ${J[0]} bis ${J[J.length - 1]}, ${log ? "logarithmische" : "lineare"} Skala` }, ziel);
    const ticks = log ? GT : Array.from({ length: Math.round((L1 - L0) / LS) + 1 }, (_, k) => L0 + k * LS);
    const links = Math.ceil(Math.max(...ticks.map(t => DK.tw(zahl(t))))) + 8;
    const endText = s => `${s.kurz} ${log ? pz(rate(s)) : delta(anstieg(s), 1, NBSP + "€")}`;
    const rechts = Math.ceil(Math.max(...SEG.map(s => DK.tw(endText(s), 14, true)))) + 10;
    const oben = 8, unten = 30, PW = breite - links - rechts, PH = hoehe - oben - unten;
    const sx = k => links + k / (J.length - 1) * PW;
    const sy = log ? v => oben + PH - (Math.log10(v) - Math.log10(G0)) / (Math.log10(G1) - Math.log10(G0)) * PH
                   : v => oben + PH - (v - L0) / (L1 - L0) * PH;
    const ga = sv("g", { id: id + "-achse" }, svg);
    ticks.forEach(t => {
      sv("line", { x1: links, x2: links + PW, y1: sy(t), y2: sy(t), stroke: t === (log ? G0 : L0) ? "#8C8C8C" : "#E3E3E3", "stroke-width": 1 }, ga);
      sv("text", { x: links - 6, y: sy(t), dy: "0.35em", "text-anchor": "end", class: "muted" }, ga, zahl(t));
    });
    J.forEach((j, k) => {
      if ((j - J[0]) % 4) return;
      sv("line", { x1: sx(k), x2: sx(k), y1: oben + PH, y2: oben + PH + 4, stroke: "#8C8C8C", "stroke-width": 1 }, ga);
      sv("text", { x: sx(k), y: oben + PH + 20, dy: "0.1em", "text-anchor": "middle", class: "muted" }, ga, String(j));
    });
    const gl = sv("g", { id: id + "-linien" }, svg), ge = sv("g", { id: id + "-ende" }, svg);
    SEG.forEach(s => {
      const blass = S.auswahl !== null && S.auswahl !== s.i;
      const g = sv("g", { class: "dk-klick" + (blass ? " dk-blass" : ""), "data-name": s.name }, gl);
      const d = s.w.map((v, k) => `${k ? "L" : "M"}${sx(k).toFixed(1)},${sy(v).toFixed(1)}`).join(" ");
      sv("path", { d, fill: "none", stroke: "#3A3F44", "stroke-width": 2.5, "stroke-linejoin": "round" }, g);
      const n = s.w.length - 1;
      sv("text", { x: sx(n) + 6, y: sy(s.w[n]), dy: "0.35em", style: "font-weight:bold", class: blass ? "dk-blass" : "" }, ge, endText(s));
      const hit = sv("path", { d, fill: "transparent", stroke: "transparent", "stroke-width": 14, "pointer-events": "stroke" }, g);
      hit.addEventListener("click", () => auswaehlen(s.i));
      tooltip(hit, ev => {
        const r = svg.getBoundingClientRect(), sk = r.width / breite;
        const k = Math.max(0, Math.min(n, Math.round(((ev.clientX - r.left) / sk - links) / PW * n)));
        return [`${s.name}, ${J[k]}`, `Preis ${eur(s.w[k])}`, `seit ${J[0]}: ${delta(s.w[k] - s.w[0], 1, NBSP + "€")} (${pz(s.w[k] / s.w[0] - 1)})`,
          `${J[0]}–${J[n]}: ${eur(s.w[0])} → ${eur(s.w[n])}, ${pz(rate(s))}`, "Klick hebt das Segment in beiden Diagrammen hervor"];
      });
    });
  }

  function zeichnen() {
    const sel = S.auswahl !== null ? SEG[S.auswahl] : null;
    const n = J.length - 1;
    let v = DK.visual(bA, { titel: "a) Lineare Skala", einheit: "Preis in €",
      botschaft: sel ? `${sel.name}: ${delta(anstieg(sel), 1, NBSP + "€")} (${eur(sel.w[0])} → ${eur(sel.w[n])})`
                     : `${groesst.kurz} steigt scheinbar ${zahl(anstieg(groesst) / anstieg(kleinst), 0)}-mal so stark wie ${kleinst.kurz}` });
    diagramm(v.flaeche, v.breite, v.hoehe, false, "pl");
    const gleich = SEG.every(s => Math.abs(rate(s) - rate(SEG[0])) < 0.005);
    v = DK.visual(bB, { titel: "b) Logarithmische Skala", einheit: "Preis in €",
      botschaft: sel ? `${sel.name}: ${pz(rate(sel))}, Faktor ${zahl(sel.w[n] / sel.w[0], 1)}`
                     : gleich ? `Tatsächlich verdoppeln sich alle drei Preise` : `Wachstumsraten ${SEG.map(s => pz(rate(s))).join(", ")}` });
    diagramm(v.flaeche, v.breite, v.hoehe, true, "pg");
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "pl-linien", anker: "links", versatz: [150, 120], regel: "CHECK – Visuelle Integrität", titel: "Lineare Skala verzerrt Wachstumsraten",
        text: "Auf der linearen Skala zeigt die Steigung einer Linie den absoluten Anstieg in Euro. Segment A gewinnt 31,8 €, Segment C nur 3,1 € – A wirkt deshalb, als wachse es zehnmal so stark. Relativ verdoppeln sich aber alle drei Preise. Für den Vergleich von Wachstumsraten ist diese Darstellung irreführend." },
      { nr: 2, ziel: "pg-linien", anker: "links", versatz: [150, 70], regel: "CHECK – Visuelle Integrität", titel: "Logarithmische Skala: gleiche Rate, gleiche Steigung",
        text: "Auf der logarithmischen Skala hat jede Verdopplung dieselbe Höhe, gleich hohe Wachstumsraten erscheinen als gleich steile Linien. Die drei Linien steigen über den Zeitraum gleich stark an, nur in unterschiedlichen Jahren. Die Teilstriche 1, 2, 5, 10, 20, 50, 100 zeigen die ungleichmäßige Teilung der Achse." },
      { nr: 3, ziel: "v-linear", anker: "links", versatz: [320, 26], regel: "SAY – Botschaft vermitteln", titel: "Aussagen benennen die Täuschung",
        text: "Die Aussagen unter den Titeln stellen gegenüber, was die beiden Darstellungen vermitteln: links den falschen Eindruck, rechts das tatsächliche Verhältnis. Im Original trugen beide Diagramme nur die Überschrift „Preisentwicklung“." },
      { nr: 4, ziel: "pl-ende", anker: "links", versatz: [56, -26], regel: "EXPRESS – Werte am Linienende", titel: "Absolut links, relativ rechts",
        text: "Am Ende jeder Linie steht links der absolute Anstieg in Euro, rechts der relative in Prozent. So wird sichtbar, dass beide Diagramme dieselben Daten zeigen und nur unterschiedliche Fragen beantworten. Das Original nannte „+100 %“ in beiden Legenden." },
      { nr: 5, ziel: "pg-ende", anker: "links", versatz: [36, 145], regel: "UNIFY – Semantische Notation", titel: "Eine Farbe für alle Segmente",
        text: "Alle drei Reihen sind Ist-Preise und deshalb anthrazit; sie kreuzen sich nicht und werden am Linienende benannt. Das Original färbte Segment A rot, B gelb und C oliv – Rot steht im Buch aber für ungünstige Abweichungen." },
      { nr: 6, ziel: "pg-achse", anker: "links", versatz: [207, 192], regel: "SIMPLIFY – Überflüssiges weglassen", titel: "Ohne Rahmen und Legende",
        text: "Rahmen, Legenden unter den Diagrammen und das Euro-Zeichen an jeder Achsenbeschriftung entfallen; die Einheit steht im Titel. Gitternetzlinien bleiben hell, weil die Achsen hier die Botschaft tragen." },
      { nr: 7, ziel: "v-log", anker: "links", versatz: [320, 26], regel: "STRUCTURE – Bessere Alternative", titel: "Index statt Logarithmus",
        text: "Für Leser ohne Übung mit logarithmischen Achsen ist ein Index besser: Jede Reihe wird auf das Anfangsjahr bezogen (2011 = 100). Dann enden alle drei Linien bei 200, und die lineare Skala zeigt die Wachstumsraten unverzerrt." },
      { nr: 8, ziel: "pl-linien", anker: "links", versatz: [73, 114], regel: "CONDENSE – Hervorheben", titel: "Klick auf eine Linie",
        text: "Ein Klick auf eine Linie hebt das Segment in beiden Diagrammen hervor; die Aussagen nennen dann den absoluten und den relativen Anstieg. Der Tooltip zeigt den Preis im gewählten Jahr. Esc hebt die Auswahl auf." },
    ],
    nachbauIntro: "Seitengröße benutzerdefiniert 727 × 340 px. Schrift Arial: Beschriftungen 10,5 pt, Titel 12 pt. Datenmodell: Tabelle Preise (Segment, Jahr, Preis) wie in der CSV-Datei.",
    nachbau: [
      { id: "A", ziel: "pl-linien", anker: "links", versatz: [150, 120], titel: "a) Lineare Skala", visual: "Liniendiagramm (Standardvisual)",
        felder: "X-Achse: Jahr; Y-Achse: Preis (Durchschnitt oder Summe); Legende: Segment",
        format: "Alle Linien #3A3F44, Breite 2,5 px; Y-Achse Bereich 0 bis 80, Gitternetz #E3E3E3; Legende aus, Reihenbeschriftungen ein; Rahmen aus" },
      { id: "B", ziel: "pg-linien", anker: "links", versatz: [150, 70], titel: "b) Logarithmische Skala", visual: "Liniendiagramm (Standardvisual)",
        felder: "wie A",
        format: "Y-Achse › Bereich › Skalierungstyp „Logarithmisch“, Minimum 1, Maximum 100; sonst wie A",
        hinweis: "Die Teilstriche 2, 5, 20 und 50 setzt Power BI nicht selbst; ersatzweise Konstantenlinien über das Analysefenster. Alternative ohne Logarithmus: Measure Index = DIVIDE([Preis]; CALCULATE([Preis]; Preise[Jahr] = 2011)) × 100." },
    ],
    theme: DK.thema(),
    csv: { name: "preisentwicklung_daten.csv", text: () => ["Segment;Jahr;Preis_EUR",
      ...SEG.flatMap(s => s.w.map((v, k) => `${s.name};${J[k]};${zahl(v, 1)}`))].join("\r\n") },
    tabellen: () => [{ titel: "Preisentwicklung (€)", kopf: ["Jahr", ...SEG.map(s => s.name)],
      zeilen: [...J.map((j, k) => [String(j), ...SEG.map(s => zahl(s.w[k], 1))]),
        ["Anstieg in €", ...SEG.map(s => delta(anstieg(s), 1))], ["Anstieg in %", ...SEG.map(s => delta(rate(s) * 100, 0))]] }],
  });
  zeichnen();
})();
