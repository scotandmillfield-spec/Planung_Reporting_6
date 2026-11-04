/* Einzelvisual „Liniendiagramm mit Prognosewerten sowie Prognoseintervallen“ (Abb. 3.194): Absatz je Monat,
   Ist Januar 2024 bis Juni 2027, Prognose Juli 2027 bis Dezember 2028 mit Prognoseintervall.
   Seite 727 x 400 px = 110 x 60,5 mm. Daten: prognose.json (daten_prognose.py) – Ist erfunden (fester Seed),
   Modellwerte, Prognose und Intervalle aus einer saisonalen Regression (Trend + Monatsdummies) tatsächlich berechnet.
   Softwareneutraler Nachbau eines Produktscreenshots: Ist anthrazit, Modellwerte dünn grau, Prognose grau
   gestrichelt, Prognoseintervall als helles Band; Modellgüte (MAPE) im Diagramm. Schalter 80 %/95 % wechselt das
   Intervall; Klick auf einen Monat hebt ihn hervor, Esc hebt die Auswahl auf. */
(() => {
  "use strict";
  const { zahl, delta, NBSP, sv, el } = DK;
  const M = DATA.monate, N = M.length, NI = DATA.nIst, IST = DATA.ist, MOD = DATA.modell;
  const LANG = { Jan: "Januar", Feb: "Februar", "Mär": "März", Apr: "April", Mai: "Mai", Jun: "Juni", Jul: "Juli",
                 Aug: "August", Sep: "September", Okt: "Oktober", Nov: "November", Dez: "Dezember" };
  const lang = i => { const [m, j] = M[i].split(" "); return `${LANG[m]} ${j}`; };
  const jahrVon = i => Number(M[i].split(" ")[1]);
  const JAHRE = [...new Set(M.map((_, i) => jahrVon(i)))];
  const PZ = NBSP + "%";

  /* ---------- Zustand ---------- */
  const S = { niveau: 95, auswahl: null };
  const auswaehlen = i => { S.auswahl = S.auswahl === i ? null : i; zeichnen(); };
  addEventListener("keydown", e => { if (e.key === "Escape" && S.auswahl !== null) { S.auswahl = null; zeichnen(); } });
  const grenzen = () => (S.niveau === 95 ? [DATA.u95, DATA.o95] : [DATA.u80, DATA.o80]);

  /* ---------- Layout ---------- */
  DK.init({ titel: "Liniendiagramm mit Prognosewerten sowie Prognoseintervallen", breite: 727, hoehe: 400 });
  const bVis = DK.box("v-prognose", 16, 10, 695, 382);
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

  /* ---------- Berechnungen ---------- */
  const wert = i => (i < NI ? IST[i] : MOD[i]);                   // Ist bzw. Prognose
  const jahressumme = j => M.reduce((s, _, i) => s + (jahrVon(i) === j ? wert(i) : 0), 0);
  const abw = i => (IST[i] - MOD[i]) / MOD[i] * 100;              // Ist gegenüber Modellwert in %
  const halbbreite = () => { const [u, o] = grenzen(); return o.reduce((s, v, k) => s + (v - u[k]) / 2, 0) / o.length; };
  const mape = zahl(DATA.mape, 1) + PZ;

  /* ---------- Botschaft ---------- */
  function botschaft(b) {
    const passt = k => k.find(t => DK.tw(t) <= b) || k[k.length - 1];
    const i = S.auswahl;
    if (i !== null && i < NI) {
      const k = `${lang(i)}: Ist ${zahl(IST[i])} Stück, Modellwert ${zahl(MOD[i])}`;
      return passt([`${k} (Abweichung ${delta(abw(i), 1, PZ)})`, k]);
    }
    if (i !== null) {
      const [u, o] = grenzen(), f = i - NI;
      return passt([`${lang(i)}: Prognose ${zahl(MOD[i])} Stück, ${S.niveau}-%-Intervall ${zahl(u[f])} bis ${zahl(o[f])} Stück`,
        `${lang(i)}: Prognose ${zahl(MOD[i])}, Intervall ${zahl(u[f])} bis ${zahl(o[f])} Stück`]);
    }
    const jn = JAHRE[JAHRE.length - 1], jv = jn - 1, sn = jahressumme(jn), svj = jahressumme(jv);
    const dvj = delta((sn / svj - 1) * 100, 1, PZ);
    return passt([`Prognose ${jn}: ${zahl(sn)} Stück (${dvj} zu ${jv}); ${S.niveau}-%-Intervall je Monat rund ±${zahl(halbbreite(), 0)} Stück`,
      `Prognose ${jn}: ${zahl(sn)} Stück (${dvj} zu ${jv})`]);
  }

  /* ---------- Diagramm ---------- */
  function diagramm(ziel, breite, hoehe) {
    ziel.textContent = "";
    const svg = sv("svg", { width: breite, height: hoehe, role: "img",
      "aria-label": `Liniendiagramm: Absatz je Monat, Ist ${M[0]} bis ${M[NI - 1]}, Prognose bis ${M[N - 1]} mit ${S.niveau}-%-Prognoseintervall` }, ziel);
    const links = 46, rechts = 96, oben = 30, unten = 26, PW = breite - links - rechts, PH = hoehe - oben - unten;
    const YMAX = 1500, fach = PW / N, x = i => links + fach * (i + 0.5), y = v => oben + PH - v / YMAX * PH;
    const [u, o] = grenzen();
    const blass = S.auswahl !== null ? "dk-blass" : "";

    // Gitter und Größenachse (viele Zeitpunkte: Werte nicht einzeln beschriftet)
    const ga = sv("g", { id: "pg-achse" }, svg);
    [0, 500, 1000, 1500].forEach(v => {
      sv("line", { x1: links, x2: links + PW, y1: y(v) + 0.5, y2: y(v) + 0.5, stroke: v ? "#E3E3E3" : "#8C8C8C", "stroke-width": 1 }, ga);
      sv("text", { x: links - 8, y: y(v), dy: "0.35em", "text-anchor": "end", class: "muted" }, ga, zahl(v));
    });
    // Zeitachse: Jahre unter ihren Monaten, Teilstriche an den Jahreswechseln
    const gz = sv("g", { id: "pg-zeit" }, svg);
    JAHRE.forEach(j => {
      const is = M.map((_, i) => i).filter(i => jahrVon(i) === j), a = is[0], e = is[is.length - 1];
      const xa = links + fach * a, xe = links + fach * (e + 1);
      sv("line", { x1: xa, x2: xa, y1: oben + PH, y2: oben + PH + 6, stroke: "#8C8C8C", "stroke-width": 1 }, gz);
      sv("text", { x: (xa + xe) / 2, y: oben + PH + 18, "text-anchor": "middle" }, gz, String(j));
    });
    sv("line", { x1: links + PW, x2: links + PW, y1: oben + PH, y2: oben + PH + 6, stroke: "#8C8C8C", "stroke-width": 1 }, gz);

    // Grenze Ist | Prognose
    const xt = links + fach * NI;
    const gt = sv("g", { id: "pg-trenner" }, svg);
    sv("line", { x1: xt, x2: xt, y1: 4, y2: oben + PH, stroke: "#6E747A", "stroke-width": 1, "stroke-dasharray": "3 3" }, gt);
    sv("text", { x: xt + 6, y: 12, class: "muted" }, gt, "Prognose");

    // Schlüssel links oben: Ist und Modellwerte mit Modellgüte
    const gs = sv("g", { id: "pg-schluessel" }, svg);
    let kx = links;
    sv("line", { x1: kx, x2: kx + 18, y1: 8, y2: 8, stroke: "#3A3F44", "stroke-width": 2.5 }, gs);
    sv("text", { x: kx + 24, y: 8, dy: "0.35em", style: "font-weight:bold" }, gs, "Ist");
    kx += 24 + DK.tw("Ist", 14, true) + 18;
    sv("line", { x1: kx, x2: kx + 18, y1: 8, y2: 8, stroke: "#8F8F8F", "stroke-width": 1.5 }, gs);
    sv("text", { x: kx + 24, y: 8, dy: "0.35em", class: "muted" }, gs, `Modellwerte, MAPE ${mape}`);

    // Prognoseintervall als Band
    const fi = M.map((_, i) => i).filter(i => i >= NI);
    const band = fi.map(i => `${x(i).toFixed(1)},${y(o[i - NI]).toFixed(1)}`).concat(
      fi.slice().reverse().map(i => `${x(i).toFixed(1)},${y(u[i - NI]).toFixed(1)}`));
    sv("polygon", { id: "pg-band", points: band.join(" "), fill: "#E3E3E3", class: blass }, svg);

    // Linien
    const pfad = is => is.map((i, k) => `${k ? "L" : "M"}${x(i).toFixed(1)},${y(MOD[i]).toFixed(1)}`).join(" ");
    const hist = M.map((_, i) => i).filter(i => i < NI);
    const gl = sv("g", { id: "pg-linien", class: blass }, svg);
    sv("path", { id: "pg-modell", d: pfad(hist), fill: "none", stroke: "#8F8F8F", "stroke-width": 1.5 }, gl);
    sv("path", { id: "pg-fc", d: pfad([NI - 1, ...fi]), fill: "none", stroke: "#8F8F8F", "stroke-width": 2.5,
                 "stroke-dasharray": "6 4" }, gl);
    sv("path", { id: "pg-ist", d: hist.map((i, k) => `${k ? "L" : "M"}${x(i).toFixed(1)},${y(IST[i]).toFixed(1)}`).join(" "),
                 fill: "none", stroke: "#3A3F44", "stroke-width": 2.5, "stroke-linejoin": "round" }, gl);
    hist.forEach(i => sv("circle", { cx: x(i), cy: y(IST[i]), r: 2.6, fill: "#3A3F44" }, gl));
    fi.forEach(i => sv("circle", { cx: x(i), cy: y(MOD[i]), r: 2.6, fill: "#8F8F8F" }, gl));

    // Beschriftung am Ende des Bands statt Legende
    const ge = sv("g", { id: "pg-ende" }, svg), xe = x(N - 1) + 10, f = N - 1 - NI;
    sv("text", { x: xe, y: y(o[f]), dy: "0.35em", class: "muted" }, ge, "Obergrenze");
    sv("text", { x: xe, y: y(MOD[N - 1]), dy: "0.35em", style: "font-weight:bold;fill:#4D4D4D" }, ge, "Prognose");
    sv("text", { x: xe, y: y(u[f]), dy: "0.35em", class: "muted" }, ge, "Untergrenze");

    // Ausgewählter Monat
    if (S.auswahl !== null) {
      const i = S.auswahl, xi = x(i), gw = sv("g", { id: "pg-auswahl" }, svg);
      sv("line", { x1: xi, x2: xi, y1: oben, y2: oben + PH, stroke: "#6E747A", "stroke-width": 1 }, gw);
      const pkt = i < NI ? [[IST[i], "#3A3F44", true], [MOD[i], "#8F8F8F", false]]
                         : [[o[i - NI], "#8F8F8F", false], [MOD[i], "#8F8F8F", true], [u[i - NI], "#8F8F8F", false]];
      const rechtsDavon = xi < links + PW - 60;
      pkt.forEach(([v, farbe, fett]) => {
        sv("circle", { cx: xi, cy: y(v), r: 4, fill: farbe, stroke: "#FFFFFF", "stroke-width": 1 }, gw);
        sv("text", { x: rechtsDavon ? xi + 8 : xi - 8, y: y(v), dy: "0.35em", "text-anchor": rechtsDavon ? "start" : "end",
                     stroke: "#FFFFFF", "stroke-width": 4, "paint-order": "stroke", "stroke-linejoin": "round",
                     style: fett ? "font-weight:bold" : "" }, gw, zahl(v));
      });
    }

    // Trefferflächen je Monat
    const gh = sv("g", { id: "pg-monate" }, svg);
    M.forEach((_, i) => {
      const g = sv("g", { class: "dk-klick" }, gh);
      const hit = sv("rect", { x: links + fach * i, y: oben, width: fach, height: PH, fill: "transparent" }, g);
      hit.addEventListener("click", () => auswaehlen(i));
      tooltip(hit, () => {
        if (i < NI) return [lang(i) + " (Ist)", `Ist: ${zahl(IST[i])} Stück`, `Modellwert: ${zahl(MOD[i])} Stück`,
          `Abweichung Ist zu Modell: ${delta(IST[i] - MOD[i], 0)} Stück (${delta(abw(i), 1, PZ)})`, "Klick hebt den Monat hervor"];
        const k = i - NI;
        return [lang(i) + " (Prognose)", `Prognose: ${zahl(MOD[i])} Stück`,
          `80-%-Intervall: ${zahl(DATA.u80[k])} bis ${zahl(DATA.o80[k])}`, `95-%-Intervall: ${zahl(DATA.u95[k])} bis ${zahl(DATA.o95[k])}`,
          `Vorjahresmonat: ${zahl(wert(i - 12))} Stück${i - 12 < NI ? " (Ist)" : ""}`, "Klick hebt den Monat hervor"];
      });
    });
  }

  /* ---------- Zeichnen ---------- */
  function zeichnen() {
    const v = DK.visual(bVis, { titel: "Absatz je Monat mit Prognoseintervall", einheit: "Stück", botschaft: botschaft(695),
      schalter: { optionen: [[80, "80" + PZ], [95, "95" + PZ]], wert: S.niveau, onChange: w => { S.niveau = w; zeichnen(); } } });
    diagramm(v.flaeche, v.breite, v.hoehe);
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "v-prognose", anker: "links", versatz: [602, 24], regel: "SAY – Botschaft vermitteln", titel: "Kernaussage unter dem Titel",
        text: "Unter dem Titel stehen der prognostizierte Jahresabsatz 2028, die Veränderung zu 2027 (Ist Januar bis Juni plus Prognose) und die Breite des Prognoseintervalls; bei Auswahl eines Monats dessen Werte. Das Original zeigte nur „Prognose vs. Ist“." },
      { nr: 2, ziel: "pg-ist", anker: "links", versatz: [150, -26], regel: "UNIFY – Semantische Notation", titel: "Ist dunkel, Prognose grau",
        text: "Ist ist anthrazit und kräftig, die Prognose grau gestrichelt – dieselbe Notation wie bei Vorschauwerten im ganzen Buch. Im Original war Ist hellblau und die Prognose dunkelblau, also gerade umgekehrt gewichtet." },
      { nr: 3, ziel: "pg-band", anker: "links", versatz: [40, -24], regel: "EXPRESS – Bandbreite zeigen", titel: "Intervall als Fläche",
        text: "Das Prognoseintervall ist ein helles Band zwischen Unter- und Obergrenze. Im Original waren es zwei gestrichelte Linien mit Punkten, die sich mit der Prognoselinie kreuzten und wie weitere Prognosen aussahen." },
      { nr: 4, ziel: "pg-trenner", anker: "links", versatz: [10, 28], regel: "STRUCTURE – Zeiträume trennen", titel: "Grenze Ist | Prognose",
        text: "Eine gestrichelte Senkrechte trennt die Istmonate von den Prognosemonaten. Die Jahre stehen unter ihren Monaten; im Original wechselten Monats- und Jahresbeschriftungen in zwei Zeilen." },
      { nr: 5, ziel: "pg-schluessel", anker: "links", versatz: [312, -2], regel: "CONDENSE – Modellgüte im Bild", titel: "MAPE bei den Modellwerten",
        text: "Die dünne graue Linie zeigt die Modellwerte für die Istmonate (Ex-post-Prognose), daneben steht die Modellgüte: mittlerer absoluter Prozentfehler (MAPE) der Modellwerte gegenüber Ist. Das Original zeigte den „erwarteten MAPE“ in einem eigenen Kasten über dem Diagramm." },
      { nr: 6, ziel: "pg-band", anker: "links", versatz: [114, 220], regel: "CHECK – Rechnung nachvollziehbar", titel: "Intervall aus dem Modell berechnet",
        text: `Prognose und Intervall stammen aus einer saisonalen Regression (Trend plus Monatseffekte, ${DATA.df} Freiheitsgrade): Prognose ± t-Wert × Standardfehler der Prognose. Das Band wird nach rechts nur wenig breiter, weil hier die Streuung der Istwerte überwiegt; Verfahren wie die exponentielle Glättung öffnen es stärker. Der Schalter zeigt, wie das Sicherheitsniveau (80 % oder 95 %) die Breite bestimmt.` },
      { nr: 7, ziel: "pg-ende", anker: "links", versatz: [48, 127], regel: "SIMPLIFY – Direkt beschriften", titel: "Ohne Legende und Bedienelemente",
        text: "Prognose, Ober- und Untergrenze sind am Ende des Bands beschriftet, Ist und Modellwerte oben links. Entfallen sind Navigationsleiste, Symbole, Zoom-Knöpfe, Produktname und der Legendeneintrag „Ausreißer“ ohne Datenpunkt." },
    ],
    nachbauIntro: "Seitengröße benutzerdefiniert 727 × 400 px. Schrift Arial: Beschriftungen 10,5 pt, Titel 12 pt. Datenmodell: Tabelle Absatz (Monat, Jahr, Monat_Nr, Art, Ist_Stueck, Modellwert_Stueck, Unter- und Obergrenzen) wie in der CSV-Datei; Modellwerte und Grenzen außerhalb von Power BI gerechnet (z. B. in R oder Python) und importiert.",
    nachbau: [
      { id: "A", ziel: "pg-linien", anker: "links", versatz: [61, -30], titel: "Linien und Band", visual: "Liniendiagramm (Standardvisual)",
        felder: "X-Achse: Monat (fortlaufend, Datum); Y-Achse: Ist_Stueck, Modellwert (Measure: Modellwert für Istmonate), Prognose (Measure: Modellwert für Prognosemonate)",
        format: "Ist #3A3F44, 2,5 px, Markierung Kreis; Modellwert #8F8F8F, 1,5 px; Prognose #8F8F8F, 2,5 px, Linienstil gestrichelt; Analysebereich › Fehlerbalken für Prognose: Obergrenze/Untergrenze aus den Grenzfeldern, Darstellung Fehlerband #E3E3E3; Y-Achse 0 bis 1.500, Gitternetz #E3E3E3; Legende aus",
        hinweis: "Ohne eigene Modellwerte bietet das Liniendiagramm unter Analysebereich › Prognose eine eingebaute Prognose (exponentielle Glättung) mit Konfidenzband: Prognoselänge 18 Monate, Konfidenzintervall 80 % oder 95 %, Saisonalität 12 Punkte. Deren Werte weichen von der Regression ab." },
      { id: "B", ziel: "v-prognose", anker: "links", versatz: [588, 0], titel: "Schalter 80 %/95 %", visual: "Datenschnitt (Kacheln) auf einer Hilfstabelle Niveau",
        felder: "Niveau (80; 95); Measures Untergrenze = SWITCH( SELECTEDVALUE( Niveau[Niveau] ); 80; MIN( Absatz[Untergrenze_80] ); MIN( Absatz[Untergrenze_95] ) ), Obergrenze entsprechend",
        format: "Einfachauswahl, ausgewählt #3A3F44 mit weißer Schrift" },
      { id: "C", ziel: "pg-schluessel", anker: "links", versatz: [312, -2], titel: "Modellgüte und Kernaussage", visual: "Textfeld mit dynamischen Werten",
        felder: "MAPE = AVERAGEX( FILTER( Absatz; NOT ISBLANK( Absatz[Ist_Stueck] ) ); ABS( Absatz[Ist_Stueck] − Absatz[Modellwert_Stueck] ) / Absatz[Ist_Stueck] )",
        format: "10,5 pt, #4D4D4D; Format 0,0 %" },
    ],
    theme: DK.thema(),
    csv: { name: "prognose_daten.csv", text: () => ["Monat;Art;Ist_Stueck;Modellwert_Stueck;Untergrenze_80;Obergrenze_80;Untergrenze_95;Obergrenze_95",
      ...M.map((m, i) => (i < NI ? [m, "Ist", IST[i], MOD[i], "", "", "", ""]
        : [m, "Prognose", "", MOD[i], DATA.u80[i - NI], DATA.o80[i - NI], DATA.u95[i - NI], DATA.o95[i - NI]]).join(";"))].join("\r\n") },
    tabellen: () => {
      const [u, o] = grenzen();
      return [
        { titel: "Modellkennwerte", kopf: ["Kennwert", "Wert"], zeilen: [
          ["Modell", "Trend + Monatseffekte"], ["Trend je Monat", zahl(DATA.trend, 2) + " Stück"], ["R²", zahl(DATA.r2, 3)],
          ["MAPE", mape], ["Standardfehler", zahl(DATA.s, 1) + " Stück"], ["Freiheitsgrade", String(DATA.df)],
          [`t-Wert ${S.niveau}${NBSP}%`, zahl(S.niveau === 95 ? DATA.t95 : DATA.t80, 3)]] },
        { titel: "Absatz je Jahr (Stück)", kopf: ["Jahr", "Absatz", "Δ VJ in %", "davon Prognose"],
          zeilen: JAHRE.map((j, k) => [String(j), zahl(jahressumme(j)), k ? delta((jahressumme(j) / jahressumme(JAHRE[k - 1]) - 1) * 100, 1) : "–",
            zahl(M.reduce((s, _, i) => s + (jahrVon(i) === j && i >= NI ? MOD[i] : 0), 0))]) },
        { titel: `Absatz je Monat (Stück), ${S.niveau}-%-Intervall`, kopf: ["Monat", "Ist", "Modell/Prognose", "Untergrenze", "Obergrenze"],
          zeilen: M.map((m, i) => [m, i < NI ? zahl(IST[i]) : "–", zahl(MOD[i]), i < NI ? "–" : zahl(u[i - NI]), i < NI ? "–" : zahl(o[i - NI])]) },
      ];
    },
  });
  zeichnen();
})();
