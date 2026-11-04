/* Einzelvisual „Histogramm und Box-Plot“ (Abb. 3.57): a) Histogramm der Körpergröße von 237 Personen mit
   Normalverteilungskurve, b) Box-Plot des diastolischen Blutdrucks. Seite 727 x 370 px = 110 x 56 mm.
   Daten: verteilung.json (daten_verteilung.py) – Einzelwerte, aus denen Klassen, Kennwerte und Kurve berechnet werden;
   mit den Originalklassen (1,164 cm) ergibt sich das Histogramm des Originals, Box-Plot-Kennwerte wie im Original.
   Diagrammtypen bleiben. Klassenbreite umschaltbar (Druck: 2,5 cm); Klick auf eine Klasse bzw. einen Kennwert hebt hervor. */
(() => {
  "use strict";
  const { zahl, NBSP, sv, el } = DK;
  const G = DATA.groesse, [OLO, OW, ON] = DATA.klassen_original, BD = DATA.blutdruck.slice().sort((a, b) => a - b);
  const N = G.length, MW = G.reduce((s, v) => s + v, 0) / N;
  const SD = Math.sqrt(G.reduce((s, v) => s + (v - MW) ** 2, 0) / (N - 1));
  const median = a => (a.length % 2 ? a[(a.length - 1) / 2] : (a[a.length / 2 - 1] + a[a.length / 2]) / 2);
  const h = Math.floor(BD.length / 2);
  const KW = { min: BD[0], q1: median(BD.slice(0, h)), med: median(BD), q3: median(BD.slice(BD.length - h)), max: BD[BD.length - 1] };
  const KN = [["max", "Maximum", "größter Wert"], ["q3", "3. Quartil", "oberes Viertel beginnt"], ["med", "Median", "Mitte der Werte"],
              ["q1", "1. Quartil", "unteres Viertel endet"], ["min", "Minimum", "kleinster Wert"]];
  const KTIP = { max: "größter Wert (innerhalb des 1,5-fachen Quartilsabstands, sonst Ausreißer)",
                 q3: "drei Viertel der Werte liegen darunter (Median der oberen Hälfte)",
                 med: "die Hälfte der Werte liegt darunter, die Hälfte darüber",
                 q1: "ein Viertel der Werte liegt darunter (Median der unteren Hälfte)", min: "kleinster Wert" };
  const cm = (v, nk = 1) => zahl(v, nk);

  const S = { klasse: "2.5", auswahl: null, kennwert: null };
  addEventListener("keydown", e => { if (e.key === "Escape" && (S.auswahl !== null || S.kennwert !== null)) { S.auswahl = null; S.kennwert = null; zeichnen(); } });

  DK.init({ titel: "Histogramm und Box-Plot", breite: 727, hoehe: 370 });
  // Umschalter der Klassenbreite nur am Bildschirm, nicht im Druck (die Breite steht an der Achse)
  el("style", {}, document.head, "body.print #v-histogramm .dk-titelzeile .dk-knoepfe { display: none; }");
  const bA = DK.box("v-histogramm", 16, 10, 420, 352);
  const bB = DK.box("v-boxplot", 456, 10, 255, 352);
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

  /* ---------- Klassen ---------- */
  function klassen() {
    const w = S.klasse === "orig" ? OW : Number(S.klasse), lo = S.klasse === "orig" ? OLO : 130;
    const n = S.klasse === "orig" ? ON : Math.round(60 / w);
    const k = Array.from({ length: n }, (_, i) => ({ i, a: lo + i * w, b: lo + (i + 1) * w, n: 0 }));
    G.forEach(v => { const i = Math.min(n - 1, Math.floor((v - lo) / w + 1e-9)); k[i].n++; });
    return { w, lo, k };
  }
  const wtext = w => (w === OW ? zahl(w, 2) : zahl(w, 1)) + NBSP + "cm";
  const pdf = x => Math.exp(-0.5 * ((x - MW) / SD) ** 2) / (SD * Math.sqrt(2 * Math.PI));
  const imSigma = G.filter(v => v >= MW - SD && v <= MW + SD).length / N;

  function botschaftA(b, K) {
    const passt = k => k.find(t => DK.tw(t) <= b) || k[k.length - 1];
    if (S.auswahl !== null) {
      const x = K.k[S.auswahl];
      if (x) return passt([`${cm(x.a)} bis unter ${cm(x.b)} cm: ${x.n} Personen (${zahl(x.n / N * 100, 1)}${NBSP}%)`]);
    }
    return passt([`Ø ${cm(MW)} cm bei ${N} Personen; ${zahl(imSigma * 100, 0)}${NBSP}% liegen zwischen ${zahl(MW - SD, 0)} und ${zahl(MW + SD, 0)} cm`,
      `Ø ${cm(MW)} cm; ${zahl(imSigma * 100, 0)}${NBSP}% zwischen ${zahl(MW - SD, 0)} und ${zahl(MW + SD, 0)} cm`]);
  }
  function botschaftB(b) {
    const passt = k => k.find(t => DK.tw(t) <= b) || k[k.length - 1];
    if (S.kennwert) { const [key, name, kurz] = KN.find(x => x[0] === S.kennwert); return passt([`${name} ${zahl(KW[key])}: ${kurz}`, `${name} ${zahl(KW[key])}`]); }
    return passt([`Mittlere 50${NBSP}% zwischen ${zahl(KW.q1)} und ${zahl(KW.q3)} mmHg`, `Mittlere 50${NBSP}%: ${zahl(KW.q1)} bis ${zahl(KW.q3)}`]);
  }

  /* ---------- a) Histogramm ---------- */
  function histogramm(ziel, breite, hoehe, K) {
    ziel.textContent = "";
    const svg = sv("svg", { width: breite, height: hoehe, role: "img", "aria-label": `Histogramm der Körpergröße von ${N} Personen, Klassenbreite ${wtext(K.w)}` }, ziel);
    const peak = N * K.w * pdf(MW), maxN = Math.max(...K.k.map(x => x.n), peak);
    const schritt = maxN > 30 ? 10 : 5, ymax = Math.ceil(maxN * 1.05 / schritt) * schritt;
    const ticks = Array.from({ length: ymax / schritt + 1 }, (_, i) => i * schritt);
    const links = Math.ceil(DK.tw(String(ymax))) + 8, rechts = 12, oben = 26, unten = 26;
    const PW = breite - links - rechts, PH = hoehe - oben - unten;
    const sx = v => links + (v - 130) / 60 * PW, sy = v => oben + PH - v / ymax * PH;
    const ga = sv("g", { id: "hi-achse" }, svg);
    sv("text", { x: 0, y: 8, dy: "0.35em", class: "muted" }, ga, `Personen je Klasse (${wtext(K.w)})`);
    ticks.forEach(t => {
      if (t) sv("line", { x1: links, x2: links + PW, y1: sy(t), y2: sy(t), stroke: "#E3E3E3", "stroke-width": 1 }, ga);
      sv("text", { x: links - 6, y: sy(t), dy: "0.35em", "text-anchor": "end", class: "muted" }, ga, zahl(t));
    });
    const gb = sv("g", { id: "hi-balken" }, svg);
    K.k.forEach(x => {
      const blass = S.auswahl !== null && S.auswahl !== x.i;
      const g = sv("g", { class: "dk-klick" + (blass ? " dk-blass" : "") }, gb);
      const x0 = sx(x.a), x1 = sx(x.b);
      if (x.n) sv("rect", { x: x0, y: sy(x.n), width: Math.max(1, x1 - x0 - 1), height: oben + PH - sy(x.n), fill: "#A9A9A9" }, g);
      const hit = sv("rect", { x: x0, y: oben, width: x1 - x0, height: PH, fill: "transparent" }, g);
      hit.addEventListener("click", () => { S.auswahl = S.auswahl === x.i ? null : x.i; S.kennwert = null; zeichnen(); });
      tooltip(hit, () => [`${cm(x.a)} bis unter ${cm(x.b)} cm`, `${x.n} Personen (${zahl(x.n / N * 100, 1)}${NBSP}% von ${N})`,
        `Dichte ${zahl(x.n / N / K.w, 4)} je cm`, `Normalverteilung erwartet hier ${zahl(N * K.w * pdf((x.a + x.b) / 2), 1)}`, "Klick hebt die Klasse hervor"]);
    });
    sv("line", { x1: links, x2: links + PW, y1: oben + PH + 0.5, y2: oben + PH + 0.5, stroke: "#8C8C8C", "stroke-width": 1 }, ga);
    for (let t = 130; t <= 190; t += 10) {
      sv("line", { x1: sx(t), x2: sx(t), y1: oben + PH, y2: oben + PH + 4, stroke: "#8C8C8C", "stroke-width": 1 }, ga);
      sv("text", { x: sx(t), y: oben + PH + 18, dy: "0.1em", "text-anchor": "middle", class: "muted" }, ga, String(t));
    }
    // Normalverteilungskurve und Mittelwert
    const gk = sv("g", { id: "hi-kurve" }, svg);
    let d = "";
    for (let v = 130; v <= 190.001; v += 0.5) d += `${d ? "L" : "M"}${sx(v).toFixed(1)},${sy(N * K.w * pdf(v)).toFixed(1)}`;
    sv("path", { d, fill: "none", stroke: "#3A3F44", "stroke-width": 2 }, gk);
    sv("line", { x1: sx(MW), x2: sx(MW), y1: oben - 4, y2: oben + PH, stroke: "#3A3F44", "stroke-width": 1, "stroke-dasharray": "4 3" }, gk);
    sv("text", { x: sx(MW) + 5, y: oben - 2, class: "muted" }, gk, `Ø ${cm(MW)}`);
    const lx = links + PW - DK.tw("Normalverteilung") - 26, ly = oben + 12;
    sv("line", { x1: lx, x2: lx + 18, y1: ly, y2: ly, stroke: "#3A3F44", "stroke-width": 2 }, gk);
    sv("text", { x: lx + 24, y: ly, dy: "0.35em", class: "muted" }, gk, "Normalverteilung");
    sv("text", { x: lx + 24, y: ly + 18, dy: "0.35em", class: "muted" }, gk, `σ = ${cm(SD)} cm`);
  }

  /* ---------- b) Box-Plot ---------- */
  function boxplot(ziel, breite, hoehe) {
    ziel.textContent = "";
    const svg = sv("svg", { width: breite, height: hoehe, role: "img",
      "aria-label": `Box-Plot des diastolischen Blutdrucks: Minimum ${KW.min}, 1. Quartil ${KW.q1}, Median ${KW.med}, 3. Quartil ${KW.q3}, Maximum ${KW.max} mmHg` }, ziel);
    const v0 = 59, v1 = 83, oben = 10, unten = 12, PH = hoehe - oben - unten;
    const sy = v => oben + PH - (v - v0) / (v1 - v0) * PH;
    const cx = 108, bw = 56, kap = 30, xl = 160, xw = breite;
    const gk = sv("g", { id: "bp-box" }, svg);
    sv("line", { x1: cx, x2: cx, y1: sy(KW.max), y2: sy(KW.q3), stroke: "#3A3F44", "stroke-width": 1.5 }, gk);
    sv("line", { x1: cx, x2: cx, y1: sy(KW.q1), y2: sy(KW.min), stroke: "#3A3F44", "stroke-width": 1.5 }, gk);
    sv("rect", { x: cx - bw / 2, y: sy(KW.q3), width: bw, height: sy(KW.q1) - sy(KW.q3), fill: "#D4D4D4", stroke: "#3A3F44", "stroke-width": 1.5 }, gk);
    // Klammer „mittlere 50 %“
    const gq = sv("g", { id: "bp-iqr" }, svg), bx = cx - bw / 2 - 12;
    sv("path", { d: `M${bx + 5},${sy(KW.q3)} H${bx} V${sy(KW.q1)} H${bx + 5}`, fill: "none", stroke: "#8C8C8C", "stroke-width": 1 }, gq);
    const ym = (sy(KW.q1) + sy(KW.q3)) / 2;
    sv("text", { x: bx - 6, y: ym - 9, dy: "0.35em", "text-anchor": "end", class: "muted" }, gq, "mittlere");
    sv("text", { x: bx - 6, y: ym + 9, dy: "0.35em", "text-anchor": "end", class: "muted" }, gq, `50${NBSP}%`);
    // Kennwerte: Linie, Hinweislinie, Name links, Wert rechts
    const gl = sv("g", { id: "bp-kennwerte" }, svg);
    KN.forEach(([key, name]) => {
      const y = sy(KW[key]), blass = S.kennwert !== null && S.kennwert !== key;
      const g = sv("g", { class: "dk-klick" + (blass ? " dk-blass" : ""), "data-name": name }, gl);
      const breiteLinie = key === "min" || key === "max" ? kap : bw;
      sv("line", { x1: cx - breiteLinie / 2, x2: cx + breiteLinie / 2, y1: y, y2: y, stroke: "#3A3F44", "stroke-width": key === "med" ? 3 : 1.5 }, g);
      sv("line", { x1: cx + breiteLinie / 2 + 4, x2: xl - 6, y1: y, y2: y, stroke: "#BDBDBD", "stroke-width": 1, "stroke-dasharray": "2 2" }, g);
      sv("text", { x: xl, y, dy: "0.35em" }, g, name);
      sv("text", { x: xw, y, dy: "0.35em", "text-anchor": "end", style: "font-weight:bold" }, g, zahl(KW[key]));
      const hit = sv("rect", { x: cx - bw / 2, y: y - 10, width: xw - cx + bw / 2, height: 20, fill: "transparent" }, g);
      hit.addEventListener("click", () => { S.kennwert = S.kennwert === key ? null : key; S.auswahl = null; zeichnen(); });
      tooltip(hit, () => [`${name}: ${zahl(KW[key])} mmHg`, KTIP[key], `Einzelwerte (n = ${BD.length}): ${BD.join(", ")}`,
        key === "q1" || key === "q3" ? `Quartilsabstand ${zahl(KW.q3 - KW.q1)} mmHg` : `Spannweite ${zahl(KW.max - KW.min)} mmHg`, "Klick hebt den Kennwert hervor"]);
    });
  }

  function zeichnen() {
    const K = klassen();
    let v = DK.visual(bA, { titel: "a) Histogramm", einheit: "Körpergröße in cm", botschaft: botschaftA(420, K),
      schalter: { optionen: [["orig", "1,16"], ["2.5", "2,5"], ["5", "5"]], wert: S.klasse,
                  onChange: w => { S.klasse = w; S.auswahl = null; zeichnen(); } } });
    histogramm(v.flaeche, v.breite, v.hoehe, K);
    v = DK.visual(bB, { titel: "b) Box-Plot", einheit: "Blutdruck in mmHg", botschaft: botschaftB(255) });
    boxplot(v.flaeche, v.breite, v.hoehe);
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "v-histogramm", anker: "links", versatz: [328, 26], regel: "SAY – Botschaft vermitteln", titel: "Aussagen unter den Titeln",
        text: "Unter jedem Titel steht, was die Verteilung zeigt: Mittelwert und Anteil innerhalb einer Standardabweichung bzw. die Lage der mittleren 50 %. Das Original hatte nur die Überschriften „Histogramm“ und „Box-Plot“ und englische Achsentitel (Height, Density, Diastolic Blood Pressure)." },
      { nr: 2, ziel: "hi-achse", anker: "links", versatz: [212, 0], regel: "SIMPLIFY – Verständliche Größen", titel: "Anzahl statt Dichte",
        text: "Die Höhe der Säulen zeigt die Anzahl Personen je Klasse, die Klassenbreite steht im Achsentitel. Das Original zeigte die Dichte (0,00 bis 0,08), die man erst mit Klassenbreite und Fallzahl in Personen umrechnen muss." },
      { nr: 3, ziel: "hi-balken", anker: "links", versatz: [200, 150], regel: "CONDENSE – Klassen sinnvoll wählen", titel: "Klassenbreite 2,5 cm",
        text: "Das Original nutzte 49 Klassen von je 1,16 cm. So schmale Klassen erzeugen Zufallsspitzen – etwa 21 Personen bei 160 cm, vermutlich gerundete Angaben. Mit 2,5 cm tritt die Form der Verteilung hervor. Der Umschalter neben dem Titel zeigt die Originalklassen und 5-cm-Klassen; die Wahl der Klassen verändert den Eindruck erheblich." },
      { nr: 4, ziel: "hi-kurve", anker: "links", versatz: [372, 4], regel: "UNIFY – Semantische Notation", titel: "Grau und Anthrazit statt Grün und Rot",
        text: "Die Säulen sind grau, die Normalverteilungskurve anthrazit, der Kasten des Box-Plots hellgrau. Das Original nutzte Hellgrün, Rot und Cyan; Rot ist im Buch ungünstigen Abweichungen vorbehalten." },
      { nr: 5, ziel: "hi-kurve", anker: "links", versatz: [278, 2], regel: "EXPRESS – Bezug zeigen", titel: "Mittelwert und Normalverteilung benannt",
        text: "Eine gestrichelte Linie markiert den Mittelwert (159,5 cm), die Kurve ist die Normalverteilung mit Mittelwert und Standardabweichung der Daten, auf Personen je Klasse umgerechnet. Im Original standen die Parameter nur in der Legende („Normal(159,548;10,258)“)." },
      { nr: 6, ziel: "bp-kennwerte", anker: "links", versatz: [108, -22], regel: "SIMPLIFY – Direkt beschriften", titel: "Kennwerte am Element",
        text: "Name und Wert jedes Kennwerts stehen auf seiner Höhe, verbunden durch eine feine Hinweislinie. Pfeile, Achse, Rahmen und der rote Punkt im Median (Bedeutung im Original unklar) entfallen." },
      { nr: 7, ziel: "bp-iqr", anker: "links", versatz: [36, 40], regel: "STRUCTURE – Aufbau erklären", titel: "Der Kasten umfasst die mittlere Hälfte",
        text: "Die Klammer zeigt, wofür der Kasten steht: Zwischen 1. und 3. Quartil liegen die mittleren 50 % der Werte, die Antennen reichen bis Minimum und Maximum. Grenze des Typs: Der Box-Plot verdeckt Lücken und mehrere Gipfel und täuscht bei kleinen Stichproben (hier zehn Werte) Genauigkeit vor – dann besser die Einzelwerte als Punkte zeigen." },
      { nr: 8, ziel: "v-boxplot", anker: "links", versatz: [42, 294], regel: "CHECK – Vergleichbarkeit", titel: "Zwei verschiedene Datensätze",
        text: "Wie im Original zeigen beide Teile unterschiedliche Merkmale. Histogramm und Box-Plot ergänzen sich am besten für denselben Datensatz: Das Histogramm zeigt die Form, der Box-Plot die Lage und Streuung – mehrere Box-Plots nebeneinander eignen sich für den Vergleich von Gruppen." },
    ],
    nachbauIntro: "Seitengröße benutzerdefiniert 727 × 370 px. Schrift Arial: Beschriftungen 10,5 pt, Titel 12 pt. Datenmodell: Tabelle Messwerte (Teil, Merkmal, Nr, Wert, Einheit) wie in der CSV-Datei.",
    nachbau: [
      { id: "A", ziel: "hi-balken", anker: "links", versatz: [200, 150], titel: "Histogramm", visual: "Linien- und gruppiertes Säulendiagramm (Standardvisual)",
        felder: "X-Achse: Gruppe „Klasse“ (Rechtsklick auf Wert › Neue Gruppe › Behälter, Behältergröße 2,5); Spalten-Y-Achse: Anzahl von Nr; Zeilen-Y-Achse: Measure Normal = NORM.DIST(MAX(Klasse) + 1,25; [Mittelwert]; [Std.-Abw.]; FALSE) × [Anzahl gesamt] × 2,5",
        format: "Säulen #A9A9A9, Abstand zwischen Kategorien 0; Linie #3A3F44, 2 px; beide Y-Achsen gleich skalieren; Konstantenlinie für den Mittelwert über das Analysefenster",
        hinweis: "Ein eigenes Histogramm-Visual gibt es in Power BI nicht; Klassen entstehen über Gruppen (Behälter). Der Umschalter der Klassenbreite lässt sich mit einem Parameter für die Behältergröße nachbilden." },
      { id: "B", ziel: "bp-box", anker: "links", versatz: [-8, -7], titel: "Box-Plot", visual: "Gestapeltes Säulendiagramm (Standardvisual) mit Fehlerbalken",
        felder: "Drei Measures gestapelt: Basis = [Q1] − 59 (Füllung transparent), Unten = [Median] − [Q1], Oben = [Q3] − [Median]; Fehlerbalken (Analysefenster) bis [Minimum] und [Maximum]",
        format: "Unten und Oben #D4D4D4 mit Rahmen #3A3F44; Y-Achse 59 bis 83, ausgeblendet; Datenbeschriftungen über Textfelder bzw. Tabelle der Kennwerte",
        hinweis: "Box-Plots sind kein Standardvisual (nur als zertifiziertes AppSource-Visual). Achtung: PERCENTILE.INC liefert für die zehn Werte 64,75 und 76,75; das Original bildet die Quartile als Median der unteren bzw. oberen Hälfte (64 und 77)." },
    ],
    theme: DK.thema(),
    csv: { name: "histogramm_boxplot_daten.csv", text: () => ["Teil;Merkmal;Nr;Wert;Einheit",
      ...G.map((v, i) => `a) Histogramm;Körpergröße;${i + 1};${zahl(v, 1)};cm`),
      ...BD.map((v, i) => `b) Box-Plot;Diastolischer Blutdruck;${i + 1};${v};mmHg`)].join("\r\n") },
    tabellen: () => {
      const K = klassen();
      return [{ titel: `a) Körpergröße, Klassenbreite ${wtext(K.w)} (Personen)`, kopf: ["Klasse (cm)", "Personen", "Anteil", "Normalverteilung"],
          zeilen: [...K.k.map(x => [`${cm(x.a)} bis unter ${cm(x.b)}`, zahl(x.n), zahl(x.n / N * 100, 1) + NBSP + "%", zahl(N * K.w * pdf((x.a + x.b) / 2), 1)]),
            ["Summe", zahl(N), "100,0" + NBSP + "%", ""], ["Mittelwert / Std.-Abw.", `${cm(MW, 2)} / ${cm(SD, 2)} cm`, "", ""]] },
        { titel: "b) Diastolischer Blutdruck (mmHg)", kopf: ["Kennwert", "Wert"], zeilen: [...KN.map(([key, name]) => [name, zahl(KW[key])]),
          ["Quartilsabstand", zahl(KW.q3 - KW.q1)], ["Einzelwerte", BD.join(", ")]] }];
    },
  });
  zeichnen();
})();
