/* Einzelvisual „Prognosemodelle mit R-Studio“ (Abb. 3.195, in Anlehnung an Oehler 2019, S. 111): Modellwert
   (vorhergesagt) gegenüber Ist (beobachtet) für den monatlichen Absatz, mit Diagonale „Modell = Ist“ und
   Ausgleichsgerade der Punkte; rechts Modellgleichung, Modellgüte und R² der drei Modelle.
   Seite 727 x 480 px = 110 x 72,6 mm. Daten: modelle.json (daten_modelle.py) – 48 Monate, Treiber Preis und
   Werbung erfunden; alle Modelle tatsächlich per Kleinste-Quadrate-Schätzung gerechnet.
   Softwareneutraler Nachbau eines Produktscreenshots (ohne Programmoberfläche). Schalter wählt das Modell,
   Klick auf einen Punkt hebt den Monat hervor und zeigt seine Abweichung, Esc hebt die Auswahl auf. */
(() => {
  "use strict";
  const { zahl, delta, NBSP, sv, el } = DK;
  const MON = DATA.monate, IST = DATA.absatz, PREIS = DATA.preis, WERB = DATA.werbung, QU = DATA.quartal;
  const MOD = Object.fromEntries(DATA.modelle.map(m => [m.key, m]));
  const N = MON.length, PZ = NBSP + "%", MINUS = "−";
  const ERKL = { M1: "Der Preis allein erklärt", M2: "Preis und Werbung erklären", M3: "Preis, Werbung und Quartal erklären" };
  const KURZ = { M1: "Preis", M2: "+ Werbung", M3: "+ Quartal" };

  /* ---------- Zustand ---------- */
  const S = { modell: DATA.standard, auswahl: null };
  const auswaehlen = i => { S.auswahl = S.auswahl === i ? null : i; zeichnen(); };
  addEventListener("keydown", e => { if (e.key === "Escape" && S.auswahl !== null) { S.auswahl = null; zeichnen(); } });
  const m = () => MOD[S.modell];
  const abw = i => (m().wert[i] - IST[i]) / IST[i] * 100;          // Modell gegenüber Ist in %
  const groesste = () => MON.map((_, i) => i).reduce((a, i) => (Math.abs(abw(i)) > Math.abs(abw(a)) ? i : a), 0);

  /* ---------- Layout ---------- */
  DK.init({ titel: "Prognosemodelle", breite: 727, hoehe: 480 });
  const bVis = DK.box("v-modelle", 16, 10, 695, 462);
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
  const r2 = (v, nk = 2) => zahl(v, nk);
  const koeff = name => m().koeff.find(k => k.name === name);

  /* ---------- Botschaft ---------- */
  function botschaft(b) {
    const passt = k => k.find(t => DK.tw(t) <= b) || k[k.length - 1];
    if (S.auswahl !== null) {
      const i = S.auswahl;
      return passt([`${MON[i]}: Ist ${zahl(IST[i])} Stück, Modell ${zahl(m().wert[i])} (${delta(abw(i), 1, PZ)}); Preis ${zahl(PREIS[i], 1)} €, Werbung ${zahl(WERB[i])} Tsd. €`,
        `${MON[i]}: Ist ${zahl(IST[i])} Stück, Modell ${zahl(m().wert[i])} (${delta(abw(i), 1, PZ)})`]);
    }
    return passt([`${ERKL[S.modell]} ${zahl(m().r2 * 100, 0)}${PZ} der Absatzschwankung (R² ${r2(m().r2)}), mittlerer Fehler ${zahl(m().mape, 1)}${PZ} (MAPE)`,
      `${ERKL[S.modell]} ${zahl(m().r2 * 100, 0)}${PZ} der Absatzschwankung (R² ${r2(m().r2)})`]);
  }

  /* ---------- Streudiagramm Modellwert gegenüber Ist ---------- */
  function streuung(svg, hoehe) {
    const links = 50, oben = 24, unten = 40, PH = hoehe - oben - unten, PW = PH;      // gleicher Maßstab auf beiden Achsen
    const MIN = 500, MAX = 3000, k = PH / (MAX - MIN);
    const sx = v => links + (v - MIN) * k, sy = v => oben + PH - (v - MIN) * k;
    const TICKS = [500, 1000, 1500, 2000, 2500, 3000];
    const ga = sv("g", { id: "mo-achsen" }, svg);
    TICKS.forEach(t => {
      if (t > MIN) {
        sv("line", { x1: links, x2: links + PW, y1: sy(t) + 0.5, y2: sy(t) + 0.5, stroke: "#EBEBEB", "stroke-width": 1 }, ga);
        sv("line", { x1: sx(t) + 0.5, x2: sx(t) + 0.5, y1: oben, y2: oben + PH, stroke: "#EBEBEB", "stroke-width": 1 }, ga);
      }
      sv("text", { x: links - 8, y: sy(t), dy: "0.35em", "text-anchor": "end", class: "muted" }, ga, zahl(t));
      sv("text", { x: sx(t), y: oben + PH + 17, "text-anchor": "middle", class: "muted" }, ga, zahl(t));
    });
    sv("line", { x1: links, x2: links, y1: oben, y2: oben + PH, stroke: "#8C8C8C", "stroke-width": 1 }, ga);
    sv("line", { x1: links, x2: links + PW, y1: oben + PH, y2: oben + PH, stroke: "#8C8C8C", "stroke-width": 1 }, ga);
    sv("text", { x: 0, y: 10, class: "muted" }, ga, "Modellwert (vorhergesagt)");
    sv("text", { x: links + PW, y: hoehe - 3, "text-anchor": "end", class: "muted" }, ga, "Ist (beobachtet)");

    // Referenzlinien: Diagonale Modell = Ist und Ausgleichsgerade der Punkte
    const gl = sv("g", { id: "mo-linien" }, svg);
    sv("line", { id: "mo-diagonale", x1: sx(MIN), y1: sy(MIN), x2: sx(MAX), y2: sy(MAX), stroke: "#6E747A",
                 "stroke-width": 1.5, "stroke-dasharray": "6 4" }, gl);
    const [a, b] = m().gerade, ya = a + b * MIN, yb = a + b * MAX;
    sv("line", { id: "mo-gerade", x1: sx(MIN), y1: sy(ya), x2: sx(MAX), y2: sy(yb), stroke: "#6E747A", "stroke-width": 1.5 }, gl);
    // Linienschlüssel im leeren Feld unten rechts
    const gk = sv("g", { id: "mo-schluessel" }, svg), kx = sx(1950);
    [[sy(860), "6 4", "Modell = Ist"], [sy(660), null, "Ausgleichsgerade"]].forEach(([y, dash, txt]) => {
      sv("line", { x1: kx, x2: kx + 22, y1: y, y2: y, stroke: "#6E747A", "stroke-width": 1.5, ...(dash ? { "stroke-dasharray": dash } : {}) }, gk);
      sv("text", { x: kx + 28, y, dy: "0.35em", class: "muted" }, gk, txt);
    });

    // Punkte
    const gp = sv("g", { id: "mo-punkte" }, svg), max = groesste();
    MON.forEach((mo, i) => {
      const blass = S.auswahl !== null && S.auswahl !== i;
      const g = sv("g", { class: "dk-klick" + (blass ? " dk-blass" : "") }, gp);
      const cx = sx(IST[i]), cy = sy(m().wert[i]);
      if (S.auswahl === i) sv("line", { x1: cx, x2: cx, y1: cy, y2: sy(IST[i]), stroke: "#3A3F44", "stroke-width": 1.5 }, g);
      sv("circle", { cx, cy, r: S.auswahl === i ? 6 : 4.5, fill: "#3A3F44", "fill-opacity": 0.8, stroke: "#FFFFFF", "stroke-width": 1 }, g);
      if ((S.auswahl === null && i === max) || S.auswahl === i) {
        const rechts = cx < sx(2300);
        sv("text", { x: rechts ? cx + 9 : cx - 9, y: cy, dy: "0.35em", "text-anchor": rechts ? "start" : "end",
                     stroke: "#FFFFFF", "stroke-width": 4, "paint-order": "stroke", "stroke-linejoin": "round" }, g,
           `${mo} (${delta(abw(i), 0, PZ)})`);
      }
      const hit = sv("circle", { cx, cy, r: 7, fill: "transparent" }, g);
      hit.addEventListener("click", () => auswaehlen(i));
      tooltip(hit, () => [`${mo}`, `Ist: ${zahl(IST[i])} Stück`, `Modellwert (${S.modell}): ${zahl(m().wert[i])} Stück`,
        `Abweichung: ${delta(m().wert[i] - IST[i], 0)} Stück (${delta(abw(i), 1, PZ)})`,
        `Preis ${zahl(PREIS[i], 1)} € · Werbung ${zahl(WERB[i])} Tsd. € · Q${QU[i]}`, "Klick hebt den Monat hervor"]);
    });
    return links + PW;
  }

  /* ---------- Modellgleichung, Modellgüte, R² der Modelle ---------- */
  function kennwerte(svg, x0, breite) {
    let y = 10;
    const zeile = (txt, o = {}) => { sv("text", { x: x0 + (o.ein || 0), y, dy: "0.35em", ...(o.fett ? { style: "font-weight:bold" } : {}),
                                                  ...(o.muted ? { class: "muted" } : {}) }, o.g, txt); y += o.h || 19; };
    const g1 = sv("g", { id: "mo-gleichung" }, svg);
    zeile("Modellgleichung", { fett: true, g: g1, h: 22 });
    const c = koeff("Konstante"), p = koeff("Preis"), w = koeff("Werbung");
    zeile(`Absatz = ${zahl(c.b, 0)}`, { g: g1 });
    zeile(`${p.b < 0 ? MINUS : "+"} ${zahl(Math.abs(p.b), 1)} × Preis (€)`, { g: g1, ein: 12 });
    if (w) zeile(`+ ${zahl(w.b, 1)} × Werbung (Tsd. €)`, { g: g1, ein: 12 });
    if (S.modell === "M3") {
      zeile("+ Quartalseffekt", { g: g1, ein: 12 });
      zeile(["Q2", "Q3", "Q4"].map(q => `${q} ${delta(koeff(q).b, 0)}`).join(", "), { g: g1, ein: 24, muted: true });
    }
    y += 10;
    const g2 = sv("g", { id: "mo-guete" }, svg);
    zeile("Modellgüte", { fett: true, g: g2, h: 22 });
    zeile(`R² ${r2(m().r2)} (korrigiert ${r2(m().r2k)})`, { g: g2 });
    zeile(`MAPE ${zahl(m().mape, 1)}${PZ}`, { g: g2 });
    zeile(`Standardfehler ${zahl(m().s, 0)} Stück`, { g: g2 });
    zeile(`${N} Monate (${MON[0].slice(-4)} bis ${MON[N - 1].slice(-4)})`, { g: g2, muted: true });
    y += 10;
    // R² je Modell als Balken (Auswahl über den Schalter im Titel)
    const g3 = sv("g", { id: "mo-vergleich" }, svg);
    zeile("R² der Modelle", { fett: true, g: g3, h: 24 });
    const lw = 82, bw = breite - lw - 44;
    DATA.modelle.forEach(mm => {
      const an = mm.key === S.modell;
      sv("text", { x: x0, y, dy: "0.35em", ...(an ? { style: "font-weight:bold" } : {}) }, g3, KURZ[mm.key]);
      sv("rect", { x: x0 + lw, y: y - 7, width: Math.max(1, mm.r2 * bw), height: 14, fill: an ? "#3A3F44" : "#A9A9A9" }, g3);
      sv("text", { x: x0 + lw + mm.r2 * bw + 5, y, dy: "0.35em", ...(an ? { style: "font-weight:bold" } : {}) }, g3, r2(mm.r2));
      const hit = sv("rect", { x: x0, y: y - 10, width: breite, height: 20, fill: "transparent" }, g3);
      tooltip(hit, () => [`${mm.key}: ${mm.name}`, `R² ${r2(mm.r2, 3)} · korrigiert ${r2(mm.r2k, 3)}`,
        `MAPE ${zahl(mm.mape, 1)}${PZ} · Standardfehler ${zahl(mm.s, 0)} Stück`, "Modell über den Schalter im Titel wählen"]);
      y += 22;
    });
  }

  /* ---------- Zeichnen ---------- */
  function zeichnen() {
    const v = DK.visual(bVis, { titel: "Absatz: Modellwert gegenüber Ist", einheit: "Stück", botschaft: botschaft(695),
      schalter: { optionen: DATA.modelle.map(mm => [mm.key, KURZ[mm.key]]), wert: S.modell,
                  onChange: w => { S.modell = w; zeichnen(); } } });
    v.flaeche.textContent = "";
    const svg = sv("svg", { width: v.breite, height: v.hoehe, role: "img",
      "aria-label": `Streudiagramm: Modellwert gegenüber Ist, Modell ${m().name}, R² ${r2(m().r2)}` }, v.flaeche);
    const rechts = streuung(svg, v.hoehe);
    kennwerte(svg, rechts + 40, v.breite - rechts - 40);
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "v-modelle", anker: "links", versatz: [647, 29], regel: "SAY – Botschaft vermitteln", titel: "Kernaussage unter dem Titel",
        text: "Unter dem Titel steht, wie viel der Absatzschwankung das gewählte Modell erklärt und wie groß der mittlere Fehler ist. Die Vorlage überschrieb das Diagramm technisch mit „Vorhergesagt vs. Beobachtet – Linear Modell – ra_absatz.csv [**Training**]“." },
      { nr: 2, ziel: "mo-diagonale", anker: "links", versatz: [92, 291], regel: "EXPRESS – Gleicher Maßstab", titel: "Beide Achsen 500 bis 3.000",
        text: "Ist und Modellwert haben denselben Maßstab, die Diagonale „Modell = Ist“ liegt deshalb im 45-Grad-Winkel: Punkte darüber sind überschätzte, Punkte darunter unterschätzte Monate. In der Vorlage hatten die Achsen verschiedene Bereiche, die Diagonale war steiler und die Lage der Punkte schwer zu deuten." },
      { nr: 3, ziel: "mo-schluessel", anker: "links", versatz: [0, -28], regel: "CHECK – Richtig deuten", titel: "Ausgleichsgerade flacher als die Diagonale",
        text: "Die durchgezogene Linie ist die Regressionsgerade der Punkte (Modellwert auf Ist, in der Vorlage „Linear Anpassung auf die Punkte“). Ihre Steigung entspricht bei linearer Regression genau R²; sie ist flacher als die Diagonale, weil jedes Modell extreme Monate zur Mitte hin schätzt. Das „Pseudo-R²“ der Vorlage ist bei linearer Regression gleich R²." },
      { nr: 4, ziel: "mo-gleichung", anker: "links", versatz: [154, -2], regel: "CONDENSE – Modell im Bild", titel: "Gleichung und Kennwerte",
        text: "Rechts stehen die Modellgleichung mit Koeffizienten und Einheiten sowie R², korrigiertes R², MAPE und Standardfehler. Die Vorlage zeigte nur das Pseudo-R² im Diagramm; die Gleichung musste man in einem anderen Reiter suchen." },
      { nr: 5, ziel: "mo-vergleich", anker: "links", versatz: [150, -2], regel: "STRUCTURE – Modelle vergleichen", titel: "Drei Modelle, ein Schalter",
        text: "Der Schalter im Titel wechselt zwischen drei Modellen, die nacheinander um einen Treiber erweitert sind; die Balken zeigen deren R². Der Preis allein erklärt wenig, mit der Werbung steigt R² auf 0,85 (wie in der Vorlage), das Quartal bringt nur noch wenig dazu – ein Grund, auch das korrigierte R² zu beachten." },
      { nr: 6, ziel: "mo-punkte", anker: "links", versatz: [20, 60], regel: "SIMPLIFY – Ohne Programmoberfläche", titel: "Nur das Ergebnis",
        text: "Fensterrahmen, Menüs, Reiter, Optionsfelder, englischer Hilfetext, Dateiname, Zeitstempel und Benutzername der Vorlage entfallen. Die hohlen Kreise sind gefüllte, leicht transparente Punkte; Überlagerungen bleiben sichtbar." },
      { nr: 7, ziel: "mo-punkte", anker: "links", versatz: [252, 154], regel: "UNIFY – Einheitliche Notation", titel: "Ist-Daten anthrazit, Linien grau",
        text: "Die Monatswerte sind anthrazit wie Istwerte im ganzen Buch, Diagonale und Ausgleichsgerade grau, gestrichelt bzw. durchgezogen. Die Vorlage nutzte Blau für Punkte, Linien und Rahmen." },
    ],
    nachbauIntro: "Seitengröße benutzerdefiniert 727 × 480 px. Schrift Arial: Beschriftungen 10,5 pt, Titel 12 pt. Datenmodell: Tabelle Absatz (Monat, Jahr, Quartal, Preis_EUR, Werbung_TEUR, Absatz_Stueck, Modellwert_M1 bis _M3) wie in der CSV-Datei; Hilfstabelle Modell (M1, M2, M3) für den Schalter. Die Modellwerte können importiert oder mit DAX berechnet werden (LINESTX).",
    nachbau: [
      { id: "A", ziel: "mo-punkte", anker: "links", versatz: [20, 60], titel: "Modellwert gegenüber Ist", visual: "Punktdiagramm",
        felder: "Werte: Monat; X-Achse: Absatz_Stueck; Y-Achse: Measure Modellwert = SWITCH( SELECTEDVALUE( Modell[Modell] ); \"M1\"; SUM( Absatz[Modellwert_M1] ); \"M3\"; SUM( Absatz[Modellwert_M3] ); SUM( Absatz[Modellwert_M2] ) )",
        format: "Markierung Kreis, #3A3F44, Transparenz 20 %; X- und Y-Achse jeweils 500 bis 3.000, gleich hoch wie breit; Gitternetz #EBEBEB; Analysebereich: Trendlinie ein (#6E747A, durchgezogen) = Ausgleichsgerade, Symmetrieschattierung ein (zeigt die Diagonale Modell = Ist)",
        hinweis: "Die Trendlinie des Punktdiagramms ist die Regressionsgerade Y auf X – genau die Ausgleichsgerade der Vorlage." },
      { id: "B", ziel: "v-modelle", anker: "links", versatz: [470, 0], titel: "Modellwahl", visual: "Datenschnitt (Kacheln)",
        felder: "Modell[Modell] mit Anzeigenamen Preis, + Werbung, + Quartal", format: "Einfachauswahl, ausgewählt #3A3F44 mit weißer Schrift" },
      { id: "C", ziel: "mo-gleichung", anker: "links", versatz: [154, -2], titel: "Gleichung und Modellgüte", visual: "Karte (neu) bzw. Textfeld mit dynamischen Werten",
        felder: "Koeffizienten und R² aus LINESTX( Absatz; Absatz[Absatz_Stueck]; Absatz[Preis_EUR]; Absatz[Werbung_TEUR] ) – Spalten Slope1, Slope2, Intercept und CoefficientOfDetermination; MAPE = AVERAGEX(Absatz; ABS([Modellwert] − Absatz[Absatz_Stueck]) / Absatz[Absatz_Stueck])",
        format: "10,5 pt; Überschriften fett; R² mit zwei Nachkommastellen, MAPE 0,0 %" },
      { id: "D", ziel: "mo-vergleich", anker: "links", versatz: [150, -2], titel: "R² der Modelle", visual: "Gruppiertes Balkendiagramm",
        felder: "Y-Achse: Modell; X-Achse: Measure R² je Modell", format: "Bedingte Farbe: gewähltes Modell #3A3F44, übrige #A9A9A9; Datenbeschriftung ein; X-Achse 0 bis 1, aus" },
      { id: "E", ziel: "mo-schluessel", anker: "links", versatz: [0, -28], titel: "Gegenprobe in R", visual: "– (Skript)",
        felder: "datei <- \"prognosemodelle_daten.csv\"; absatz <- read.csv2(datei, fileEncoding = \"UTF-8-BOM\"); m2 <- lm(Absatz_Stueck ~ Preis_EUR + Werbung_TEUR, data = absatz); summary(m2)",
        format: "plot(absatz$Absatz_Stueck, fitted(m2), xlim = c(500, 3000), ylim = c(500, 3000)); abline(0, 1, lty = 2); abline(lm(fitted(m2) ~ absatz$Absatz_Stueck))",
        hinweis: "summary(m2) liefert dieselben Koeffizienten, Standardfehler und R² wie „Werte als Tabelle“." },
    ],
    theme: DK.thema(),
    csv: { name: "prognosemodelle_daten.csv", text: () => ["Monat;Quartal;Preis_EUR;Werbung_TEUR;Absatz_Stueck;Modellwert_M1;Modellwert_M2;Modellwert_M3",
      ...MON.map((mo, i) => [mo, QU[i], zahl(PREIS[i], 1), WERB[i], IST[i], ...DATA.modelle.map(mm => mm.wert[i])].join(";"))].join("\r\n") },
    tabellen: () => [
      { titel: `Koeffizienten ${S.modell} (${m().name})`, kopf: ["Koeffizient", "Schätzwert", "Standardfehler", "t-Wert"],
        zeilen: m().koeff.map(k => [k.name, zahl(k.b, 2), zahl(k.se, 2), zahl(k.t, 2)]) },
      { titel: "Modellgüte im Vergleich", kopf: ["Modell", "R²", "korr. R²", "Standardfehler", "MAPE in %"],
        zeilen: DATA.modelle.map(mm => [`${mm.key} ${mm.name}`, r2(mm.r2, 3), r2(mm.r2k, 3), zahl(mm.s, 1), zahl(mm.mape, 1)]) },
      { titel: `Absatz je Monat (Stück), Modell ${S.modell}`, kopf: ["Monat", "Preis €", "Werbung Tsd. €", "Ist", "Modell", "Abw. in %"],
        zeilen: MON.map((mo, i) => [mo, zahl(PREIS[i], 1), zahl(WERB[i]), zahl(IST[i]), zahl(m().wert[i]), delta(abw(i), 1)]) },
    ],
  });
  zeichnen();
})();
