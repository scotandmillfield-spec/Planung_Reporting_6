/* Einzelvisual „Beispiel Chartanalysediagramm“ (Abb. 3.71): Tageskerzen einer namenlosen Aktie A mit gleitenden
   Durchschnitten (20 und 50 Tage) und Analystenzeichnung – Abwärtstrend, Dreieck, Unterstützung, Hoch und Tief,
   dazu zwei Szenarioskizzen (bevorzugt, alternativ) über den Stand hinaus.
   Seite 727 x 500 px = 110 x 75,6 mm. Daten: chart.json (daten_chart.py), Verlauf in Anlehnung an das Original,
   beschriftete Marken des Originals (43,33 / 37,82 / 33,53 / Schluss 42,88). Softwareneutral: ohne Wertpapiername,
   Kopfzeile mit Kürzeln, Herstellerhinweis und Web-Adresse. Schalter „mit Analyse | nur Kurs“; Klick auf eine
   Kerze hebt ihren Monat hervor, Tooltip mit allen Tageswerten. */
(() => {
  "use strict";
  const { zahl, delta, NBSP, sv, el, FARBE } = DK;
  const K = DATA.kerzen, T = DATA.tage, ST = DATA.start, N = K.length - ST, Z = DATA.zukunft, AN = DATA.analyse;
  const o = i => K[ST + i][0], h = i => K[ST + i][1], l = i => K[ST + i][2], c = i => K[ST + i][3];
  const datum = i => (i < N ? T[ST + i] : Z[i - N]);
  const MON = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
  const MK = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
  const WT = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
  const tt = d => `${d.slice(8, 10)}.${d.slice(5, 7)}.${d.slice(0, 4)}`;
  const nk = v => (Math.abs(v * 100 - Math.round(v * 100)) > 1e-4 ? 3 : 2);
  const eur = v => zahl(v, nk(v));
  const gd = (n, i) => { let s = 0; for (let k = ST + i - n + 1; k <= ST + i; k++) s += K[k][3]; return s / n; };
  const linie = (p, d) => p[0][1] + (p[1][1] - p[0][1]) * (d - p[0][0]) / (p[1][0] - p[0][0]);
  const GRUEN = "#00806B", ROT = "#C62828";
  // Monate im sichtbaren Bereich
  const MONATE = [];
  for (let i = 0; i < N; i++) {
    const m = datum(i).slice(0, 7);
    if (!MONATE.length || MONATE[MONATE.length - 1].key !== m) MONATE.push({ key: m, von: i, bis: i }); else MONATE[MONATE.length - 1].bis = i;
  }
  const monatVon = i => MONATE.find(m => i >= m.von && i <= m.bis);
  const mName = m => `${MON[Number(m.key.slice(5)) - 1]} ${m.key.slice(0, 4)}`;

  const S = { analyse: "ein", monat: null };
  const auswaehlen = i => { const m = monatVon(i).key; S.monat = S.monat === m ? null : m; zeichnen(); };
  addEventListener("keydown", e => { if (e.key === "Escape" && S.monat !== null) { S.monat = null; zeichnen(); } });

  DK.init({ titel: "Beispiel Chartanalysediagramm", breite: 727, hoehe: 500 });
  const bVis = DK.box("v-chart", 16, 10, 695, 482);

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

  /* ---------- Kennwerte ---------- */
  function monatsWerte(m) {
    const is = []; for (let i = m.von; i <= m.bis; i++) is.push(i);
    const vor = m.von > 0 ? c(m.von - 1) : K[ST - 1][3];
    return { eroeff: o(m.von), hoch: Math.max(...is.map(h)), tief: Math.min(...is.map(l)), schluss: c(m.bis), dvm: (c(m.bis) / vor - 1) * 100 };
  }
  function botschaft(b) {
    if (S.monat !== null) {
      const m = MONATE.find(x => x.key === S.monat), w = monatsWerte(m);
      return passt([`${mName(m)}: Schluss ${eur(w.schluss)} € (${delta(w.dvm, 1, NBSP + "%")} zum Vormonat), Hoch ${eur(w.hoch)}, Tief ${eur(w.tief)} €`,
        `${mName(m)}: Schluss ${eur(w.schluss)} € (${delta(w.dvm, 1, NBSP + "%")}), Hoch ${eur(w.hoch)}, Tief ${eur(w.tief)}`], b);
    }
    const i = N - 1, dvt = (c(i) / c(i - 1) - 1) * 100, ueber = [];
    if (c(i) > linie(AN.abwaertstrend, i)) ueber.push("Abwärtstrend");
    if (c(i) > linie(AN.dreieck_oben, i)) ueber.push("Dreieck");
    if (c(i) > gd(20, i)) ueber.push("GD 20");
    if (c(i) > gd(50, i)) ueber.push("GD 50");
    const liste = ueber.length > 1 ? ueber.slice(0, -1).join(", ") + " und " + ueber[ueber.length - 1] : ueber[0];
    const anfang = `Schluss ${eur(c(i))} € (${delta(dvt, 1, NBSP + "%")} zum Vortag)`;
    if (!ueber.length) return anfang;
    return passt([`${anfang} über ${liste} – Ausbruch nach oben`, `${anfang} über ${liste}`, anfang], b);
  }

  /* ---------- Diagramm ---------- */
  function diagramm(ziel, breite, hoehe) {
    ziel.textContent = "";
    const svg = sv("svg", { width: breite, height: hoehe, role: "img", "aria-label": "Kerzendiagramm Aktie A mit gleitenden Durchschnitten, Trendlinien und Szenarioskizzen" }, ziel);
    const PW = breite - 50, oben = 6, unten = hoehe - 38, Y0 = 30, Y1 = 47;
    const tage = N + Z.length, dx = PW / tage, X = i => (i + 0.5) * dx, Y = v => unten - (v - Y0) / (Y1 - Y0) * (unten - oben);
    const mitA = S.analyse === "ein";
    // Gitternetz und Kursachse rechts
    const gA = sv("g", { id: "ca-achse" }, svg);
    for (let v = 30; v <= 46; v += 2) {
      sv("line", { x1: 0, x2: PW, y1: Y(v), y2: Y(v), stroke: "#E6E6E6", "stroke-width": 1 }, gA);
      sv("text", { x: PW + 6, y: Y(v), dy: "0.35em", class: "muted" }, gA, zahl(v));
    }
    // Monate unten
    const gM = sv("g", { id: "ca-monate" }, svg);
    const starts = [];
    for (let i = 0; i < tage; i++) { const m = datum(i).slice(0, 7); if (i === 0 || datum(i - 1).slice(0, 7) !== m) starts.push([i, m]); }
    let jahr = null;
    starts.forEach(([i, m]) => {
      if (i === 0) return;                                               // angebrochener Oktober ohne Beschriftung
      const x = i * dx;
      sv("line", { x1: x, x2: x, y1: unten, y2: unten + 5, stroke: "#8C8C8C", "stroke-width": 1 }, gM);
      sv("text", { x: x + 3, y: unten + 13, dy: "0.35em", class: "muted" }, gM, MK[Number(m.slice(5)) - 1]);
      if (m.slice(0, 4) !== jahr) sv("text", { x: x + 3, y: unten + 29, dy: "0.35em", class: "muted" }, gM, m.slice(0, 4));
      jahr = m.slice(0, 4);
    });
    sv("line", { x1: 0, x2: PW, y1: unten + 0.5, y2: unten + 0.5, stroke: "#8C8C8C", "stroke-width": 1 }, gM);
    // Legende links oben (dort liegen keine Kurse)
    const gL = sv("g", { id: "ca-legende" }, svg);
    let lx = 4;
    const lgEintrag = (zeichne, text) => { zeichne(lx); sv("text", { x: lx + 18, y: oben + 9, dy: "0.35em", class: "muted" }, gL, text); lx += 18 + DK.tw(text) + 16; };
    lgEintrag(x => { sv("line", { x1: x + 6, x2: x + 6, y1: oben + 1, y2: oben + 17, stroke: "#3A3F44", "stroke-width": 1 }, gL);
      sv("rect", { x: x + 3, y: oben + 4, width: 6, height: 10, fill: "#FFFFFF", stroke: "#3A3F44", "stroke-width": 1 }, gL); }, "steigend");
    lgEintrag(x => { sv("line", { x1: x + 6, x2: x + 6, y1: oben + 1, y2: oben + 17, stroke: "#3A3F44", "stroke-width": 1 }, gL);
      sv("rect", { x: x + 3, y: oben + 4, width: 6, height: 10, fill: "#3A3F44" }, gL); }, "fallend");
    if (mitA) {
      lgEintrag(x => sv("line", { x1: x, x2: x + 14, y1: oben + 9, y2: oben + 9, stroke: "#A9A9A9", "stroke-width": 2 }, gL), "GD 20 Tage");
      lgEintrag(x => sv("line", { x1: x, x2: x + 14, y1: oben + 9, y2: oben + 9, stroke: "#6E747A", "stroke-width": 1.5, "stroke-dasharray": "4 2" }, gL), "GD 50 Tage");
    }
    // Unterstützung unter den Kerzen
    const gAn = sv("g", { id: "ca-analyse", style: "pointer-events:none" }, svg);
    const gUs = sv("g", { id: "ca-unterstuetzung", style: "pointer-events:none" }, svg);
    if (mitA) {
      sv("line", { x1: 0, x2: PW, y1: Y(AN.unterstuetzung), y2: Y(AN.unterstuetzung), stroke: "#8F8F8F", "stroke-width": 1 }, gUs);
      sv("text", { x: X(118), y: Y(AN.unterstuetzung) - 9, class: "muted" }, gUs, `Unterstützung ${eur(AN.unterstuetzung)}`);
    }
    // Kerzen
    const gK = sv("g", { id: "ca-kerzen" }, svg);
    const bw = Math.max(1.6, dx * 0.72);
    for (let i = 0; i < N; i++) {
      const steigt = c(i) >= o(i), m = monatVon(i).key, blass = S.monat !== null && S.monat !== m;
      const g = sv("g", { class: "dk-klick" + (blass ? " dk-blass" : ""), "data-name": datum(i) }, gK);
      sv("line", { x1: X(i), x2: X(i), y1: Y(h(i)), y2: Y(l(i)), stroke: "#3A3F44", "stroke-width": 0.8 }, g);
      const yo = Y(Math.max(o(i), c(i))), hh = Math.max(0.8, Math.abs(Y(o(i)) - Y(c(i))));
      if (steigt) sv("rect", { x: X(i) - bw / 2 + 0.3, y: yo, width: bw - 0.6, height: hh, fill: "#FFFFFF", stroke: "#3A3F44", "stroke-width": 0.6 }, g);
      else sv("rect", { x: X(i) - bw / 2, y: yo, width: bw, height: hh, fill: "#3A3F44" }, g);
      const hit = sv("rect", { x: X(i) - dx / 2, y: oben, width: dx, height: unten - oben, fill: "transparent" }, g);
      hit.addEventListener("click", () => auswaehlen(i));
      tooltip(hit, () => {
        const d = datum(i), wt = WT[new Date(d + "T12:00:00").getDay()];
        const z = [`${wt}, ${tt(d)}`, `Eröffnung ${eur(o(i))} · Hoch ${eur(h(i))} €`, `Tief ${eur(l(i))} · Schluss ${eur(c(i))} €`];
        const vt = i > 0 ? c(i - 1) : K[ST - 1][3];
        z.push(`Veränderung zum Vortag ${delta(c(i) - vt, nk(c(i) - vt))} € (${delta((c(i) / vt - 1) * 100, 1, NBSP + "%")})`);
        z.push(`GD 20 ${eur(Math.round(gd(20, i) * 100) / 100)} · GD 50 ${eur(Math.round(gd(50, i) * 100) / 100)} €`);
        z.push(`Klick hebt ${mName(monatVon(i))} hervor`);
        return z;
      });
    }
    if (!mitA) return;
    // gleitende Durchschnitte
    const clip = sv("clipPath", { id: "ca-clip" }, sv("defs", {}, svg));
    sv("rect", { x: 0, y: oben, width: PW, height: unten - oben }, clip);
    const gG = sv("g", { id: "ca-gd", style: "pointer-events:none", "clip-path": "url(#ca-clip)" }, svg);
    const pfad = n => { let p = ""; for (let i = 0; i < N; i++) p += (i ? "L" : "M") + X(i).toFixed(1) + "," + Y(gd(n, i)).toFixed(1); return p; };
    sv("path", { d: pfad(50), fill: "none", stroke: "#6E747A", "stroke-width": 1.5, "stroke-dasharray": "4 2" }, gG);
    sv("path", { d: pfad(20), fill: "none", stroke: "#A9A9A9", "stroke-width": 2 }, gG);
    // Trendlinien
    const strecke = (p, d0, d1, attr, ziel = gAn) => sv("line", { x1: X(d0), y1: Y(linie(p, d0)), x2: X(d1), y2: Y(linie(p, d1)), ...attr }, ziel);
    const gT = sv("g", { id: "ca-trend", style: "pointer-events:none" }, svg);
    strecke(AN.abwaertstrend, AN.abwaertstrend[0][0], 187, { stroke: "#3A3F44", "stroke-width": 1.3 }, gT);
    const xa = X(147), ya = Y(linie(AN.abwaertstrend, 147));
    sv("text", { x: xa + 4, y: ya - 6, style: "font-weight:bold" }, gT, "Abwärtstrend");
    const gD = sv("g", { id: "ca-dreieck", style: "pointer-events:none" }, svg);
    strecke(AN.dreieck_oben, AN.dreieck_oben[0][0] - 2, 198, { stroke: "#3A3F44", "stroke-width": 1 }, gD);
    strecke(AN.dreieck_unten, AN.dreieck_unten[0][0], 199, { stroke: "#3A3F44", "stroke-width": 1 }, gD);
    sv("text", { x: X(191) + 2, y: Y((linie(AN.dreieck_oben, 196) + linie(AN.dreieck_unten, 196)) / 2), dy: "0.35em", style: "font-weight:bold" }, gD, "Dreieck");
    // Hoch und Tief
    const gHT = sv("g", { id: "ca-marken", style: "pointer-events:none" }, svg);
    sv("text", { x: X(AN.hoch[0]), y: Y(AN.hoch[1]) - 7, "text-anchor": "middle" }, gHT, `Hoch ${eur(AN.hoch[1])}`);
    sv("text", { x: X(AN.tief[0]), y: Y(AN.tief[1]) + 9, dy: "0.7em", "text-anchor": "middle" }, gHT, `Tief ${eur(AN.tief[1])}`);
    // Szenarioskizzen
    const gS = sv("g", { id: "ca-szenarien", style: "pointer-events:none" }, svg);
    const zug = (pts, farbe) => sv("polyline", { points: pts.map(([d, v]) => `${X(d).toFixed(1)},${Y(v).toFixed(1)}`).join(" "),
      fill: "none", stroke: farbe, "stroke-width": 2.5, "stroke-dasharray": "7 4", "stroke-linejoin": "round" }, gS);
    zug(AN.szenario_bevorzugt, GRUEN);
    zug(AN.szenario_alternativ, ROT);
    const pb = AN.szenario_bevorzugt[AN.szenario_bevorzugt.length - 1];
    sv("text", { x: X(pb[0]) - 8, y: Y(pb[1]) + 2, dy: "0.35em", "text-anchor": "end", style: `font-weight:bold;fill:${GRUEN}` }, gS, "bevorzugtes Szenario");
    const [pa1, pa2] = AN.szenario_alternativ.slice(1, 3);
    sv("text", { x: X((pa1[0] + pa2[0]) / 2) - 8, y: Y((pa1[1] + pa2[1]) / 2), dy: "0.35em", "text-anchor": "end", style: `font-weight:bold;fill:${ROT}` }, gS, "Alternativszenario");
    // letzter Kurs an der Achse
    const gZ = sv("g", { id: "ca-schluss" }, svg), wz = DK.tw(eur(c(N - 1)), 14, true) + 8;
    sv("rect", { x: PW + 2, y: Y(c(N - 1)) - 9, width: wz, height: 18, fill: "#3A3F44" }, gZ);
    sv("text", { x: PW + 6, y: Y(c(N - 1)), dy: "0.35em", style: "fill:#FFFFFF;font-weight:bold" }, gZ, eur(c(N - 1)));
    sv("line", { x1: X(N - 1) + bw / 2 + 1, x2: PW + 2, y1: Y(c(N - 1)), y2: Y(c(N - 1)), stroke: "#3A3F44", "stroke-width": 0.8, "stroke-dasharray": "2 2" }, gZ);
  }

  function zeichnen() {
    const v = DK.visual(bVis, { titel: "Kursverlauf Aktie A mit Chartanalyse", einheit: "€ je Aktie, Tageskerzen",
      botschaft: botschaft(695), schalter: { optionen: [["ein", "mit Analyse"], ["aus", "nur Kurs"]], wert: S.analyse,
        onChange: w => { S.analyse = w; zeichnen(); } } });
    diagramm(v.flaeche, v.breite, v.hoehe);
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "v-chart", anker: "links", versatz: [696, 30], regel: "SAY – Botschaft vermitteln", titel: "Kernaussage unter dem Titel",
        text: "Unter dem Titel steht, was die Analyse ergibt: Der Schlusskurs liegt über Abwärtstrend, Dreieck und beiden Durchschnitten – ein Ausbruch nach oben. Das Original hatte nur eine Kopfzeile mit Kürzeln (C, O, H, L, TckV, LV, TotV, mova, movs)." },
      { nr: 2, ziel: "ca-szenarien", anker: "links", versatz: [4, 0], regel: "UNIFY – Semantische Notation", titel: "Szenarien direkt beschriftet",
        text: "Die Szenarioskizzen sind gestrichelt (Skizze, keine Kurse) und am Linienende benannt: bevorzugt blaugrün (steigend), alternativ rot (fallend). Das Original erklärte Blau und Grau in einem Kasten unter dem Diagramm." },
      { nr: 3, ziel: "ca-trend", anker: "links", versatz: [156, 1], regel: "EXPRESS – Lesbar beschriften", titel: "Linien mit Namen",
        text: "Abwärtstrend, Dreieck, Unterstützung, Hoch und Tief tragen Namen und Werte. Im Original standen nur die Zahlen 43,33, 37,82 und 33,53; die Bedeutung der roten und grauen Linien musste man kennen." },
      { nr: 4, ziel: "ca-legende", anker: "links", versatz: [398, 0], regel: "UNIFY – Semantische Notation", titel: "Kerzen schwarz-weiß, Linien grau",
        text: "Steigende Tage hohl, fallende gefüllt, die gleitenden Durchschnitte in zwei Grautönen (GD 50 gestrichelt). Das Original zeigte die Durchschnitte rot und blau, die Trendlinie rot. Die kleine Legende steht im leeren Bereich links oben." },
      { nr: 5, ziel: "ca-achse", anker: "links", versatz: [680, 299], regel: "CHECK – Visuelle Integrität", titel: "Lineare Kursachse",
        text: "Das Original nutzte eine logarithmische Kursachse. Bei einer Spanne von 30 bis 47 € ist der Unterschied gering; die lineare Achse ist leichter zu lesen, und eingezeichnete Trendlinien bleiben Geraden. Für lange Zeiträume mit starken Kursänderungen ist die logarithmische Achse besser." },
      { nr: 6, ziel: "ca-schluss", anker: "links", versatz: [26, -26], regel: "SIMPLIFY – Überflüssiges weglassen", titel: "Ohne Namen, Logo und Adresse",
        text: "Wertpapiername, Programmhinweis („Chart erstellt mit …“), Web-Adresse und Symbolleiste entfallen; der letzte Kurs steht als Marke an der Achse. Das Beispiel ist softwareneutral und zeigt eine namenlose Aktie A mit erfundenem Verlauf." },
      { nr: 7, ziel: "ca-kerzen", anker: "links", versatz: [60, 250], regel: "CONDENSE – Filtern und hervorheben", titel: "Schalter, Klick und Tooltip",
        text: "„nur Kurs“ blendet Durchschnitte und Zeichnung aus. Ein Klick auf eine Kerze hebt ihren Monat hervor, die Aussage nennt dann Schluss, Hoch und Tief des Monats; der Tooltip zeigt alle Tageswerte. Esc hebt die Auswahl auf." },
    ],
    nachbauIntro: "Seitengröße benutzerdefiniert 727 × 500 px. Schrift Arial: Beschriftungen 10,5 pt, Titel 12 pt. Datenmodell: Tabelle Kurse (Datum, Eröffnung, Hoch, Tief, Schluss) wie in der CSV-Datei, Datumstabelle nur mit Handelstagen, Spalte Handelstag-Nr. für gleitende Durchschnitte und Linien.",
    nachbau: [
      { id: "A", ziel: "ca-kerzen", anker: "links", versatz: [60, 250], titel: "Kerzen", visual: "Liniendiagramm mit Fehlerbalken (Näherung)",
        felder: "X-Achse: Datum (kategorisch); Y-Achse: Schluss; Fehlerbalken: Obergrenze Hoch, Untergrenze Tief",
        format: "Linie aus, Markierung als kurzer Strich #3A3F44; Fehlerbalken #3A3F44, 1 px",
        hinweis: "Kerzendiagramme sind in Power BI kein Standardvisual; echte Kerzen gibt es nur als Zusatzvisual. Die Näherung zeigt Spanne und Schlusskurs, aber nicht die Eröffnung." },
      { id: "B", ziel: "ca-legende", anker: "links", versatz: [398, 0], titel: "Gleitende Durchschnitte", visual: "Weitere Reihen im selben Liniendiagramm",
        felder: "GD 20 = AVERAGEX(FILTER(ALL(Kurse); Kurse[Nr] > MAX(Kurse[Nr]) − 20 && Kurse[Nr] <= MAX(Kurse[Nr])); Kurse[Schluss]); GD 50 analog",
        format: "GD 20 #A9A9A9 2 px; GD 50 #6E747A 1,5 px gestrichelt" },
      { id: "C", ziel: "ca-trend", anker: "links", versatz: [156, 1], titel: "Trendlinien und Unterstützung", visual: "Weitere Reihen bzw. Analysebereich",
        felder: "Je Linie ein Measure aus zwei Stützpunkten (Handelstag, Kurs): Kurs1 + (Kurs2 − Kurs1) × (Nr − Tag1) / (Tag2 − Tag1), außerhalb des Bereichs BLANK(); Unterstützung als konstante Linie 33,53",
        format: "#3A3F44 1 px; Unterstützung #8F8F8F",
        hinweis: "Die Trendlinie aus dem Analysebereich ist eine Regressionsgerade – etwas anderes als die gezeichnete Linie durch zwei Hochpunkte." },
      { id: "D", ziel: "ca-szenarien", anker: "links", versatz: [4, 0], titel: "Szenarioskizzen", visual: "Weitere Reihen über künftige Handelstage",
        felder: "Tabelle Szenarien (Szenario, Handelstag, Kurs), Measures je Szenario", format: "bevorzugt #00806B, alternativ #C62828, 2,5 px gestrichelt" },
    ],
    theme: DK.thema(),
    csv: { name: "chartanalyse_kurse_daten.csv", text: () => ["Datum;Eroeffnung_EUR;Hoch_EUR;Tief_EUR;Schluss_EUR",
      ...K.map((k, i) => [T[i], ...k.map(eur)].join(";"))].join("\r\n") },
    tabellen: () => {
      const m = S.monat !== null ? MONATE.find(x => x.key === S.monat) : MONATE[MONATE.length - 1];
      const tage = []; for (let i = m.von; i <= m.bis; i++) tage.push(i);
      return [
        { titel: "Monatswerte (€)", kopf: ["Monat", "Eröffnung", "Hoch", "Tief", "Schluss", "ΔVM in %"],
          zeilen: MONATE.map(x => { const w = monatsWerte(x); return [mName(x), eur(w.eroeff), eur(w.hoch), eur(w.tief), eur(w.schluss), delta(w.dvm, 1)]; }) },
        { titel: `Tageswerte ${mName(m)} (€)`, kopf: ["Datum", "Eröffnung", "Hoch", "Tief", "Schluss", "GD 20", "GD 50"],
          zeilen: tage.map(i => [tt(datum(i)), eur(o(i)), eur(h(i)), eur(l(i)), eur(c(i)), zahl(gd(20, i), 2), zahl(gd(50, i), 2)]) },
        { titel: "Analystenzeichnung (Stützpunkte)", kopf: ["Element", "von", "Kurs", "bis", "Kurs"],
          zeilen: [["Abwärtstrend", ...AN.abwaertstrend.flatMap(([d, v]) => [tt(datum(d)), eur(v)])],
            ["Dreieck oben", ...AN.dreieck_oben.flatMap(([d, v]) => [tt(datum(d)), eur(v)])],
            ["Dreieck unten", ...AN.dreieck_unten.flatMap(([d, v]) => [tt(datum(d)), eur(v)])],
            ["Unterstützung", "–", eur(AN.unterstuetzung), "–", eur(AN.unterstuetzung)],
            ["bevorzugtes Szenario", tt(datum(AN.szenario_bevorzugt[0][0])), eur(AN.szenario_bevorzugt[0][1]),
              tt(datum(AN.szenario_bevorzugt.at(-1)[0])), eur(AN.szenario_bevorzugt.at(-1)[1])],
            ["Alternativszenario", tt(datum(AN.szenario_alternativ[0][0])), eur(AN.szenario_alternativ[0][1]),
              tt(datum(AN.szenario_alternativ.at(-1)[0])), eur(AN.szenario_alternativ.at(-1)[1])]] },
      ];
    },
  });
  zeichnen();
})();
