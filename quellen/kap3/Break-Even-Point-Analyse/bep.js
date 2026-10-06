/* Dashboard „Break-Even-Point-Analyse“ (Abb. 3.26).
   Daten: bep.json (daten_bep.py) – Ausgangsdaten des Originals, gelesen als Stück, € je Stück und Tsd. €, dazu die
   Optionen der Was-wäre-wenn-Datenschnitte. Alle Kennzahlen, Linien und Monatswerte werden hier aus den Parametern
   berechnet (gleiche Formeln wie der Generator). */
(() => {
  "use strict";
  const { zahl, delta, wirkung, FARBE, sv, tw, el, NBSP } = DK;
  const MONATE = DATA.monate, KURZ = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
  const OPT = DATA.optionen, BASIS = DATA.basis;
  const TINT = { gut: "color-mix(in srgb, var(--gut) 35%, white)", schlecht: "color-mix(in srgb, var(--schlecht) 35%, white)" };

  /* ---------- Zustand ---------- */
  const S = { ...BASIS, auswahl: null };
  function rechnen() {
    const db = S.preis - S.kv, qEnde = 12 * S.menge;
    const bep = db > 0 ? S.kf * 1000 / db : Infinity;
    const monate = MONATE.map((name, i) => {
      const absatz = S.menge * (i + 1), umsatz = absatz * S.preis / 1000, var_ = absatz * S.kv / 1000;
      return { i, name, kurz: KURZ[i], absatz, umsatz, varKum: var_, kosten: S.kf + var_, ergebnis: umsatz - S.kf - var_,
               umsatzM: S.menge * S.preis / 1000, varM: S.menge * S.kv / 1000 };
    });
    const ergebnis = monate[11].ergebnis;
    const bepMonat = bep <= qEnde ? Math.ceil(bep / S.menge - 1e-9) - 1 : null;
    return { db, qEnde, bep, bepU: bep * S.preis / 1000, monate, ergebnis, bepMonat };
  }
  function auswaehlen(i) { S.auswahl = S.auswahl === i ? null : i; zeichnen(); }
  addEventListener("keydown", e => { if (e.key === "Escape" && S.auswahl != null) { S.auswahl = null; zeichnen(); } });

  /* ---------- Layout (Seite 1024 x 646) ---------- */
  DK.init({ titel: "Break-Even-Point-Analyse" });
  const bKopf = DK.box("kopf", 16, 10, 992, 46);
  DK.haarlinie(62);
  const bFilter = DK.box("filter", 16, 68, 992, 50, "dk-filter");
  const bKpi = DK.box("kpis", 16, 128, 992, 68);
  DK.haarlinie(206);
  const bBep = DK.box("v-bep", 16, 216, 562, 426);
  const bMon = DK.box("v-monate", 598, 216, 410, 426);

  /* ---------- Tooltip (gleiches Verhalten wie die Bausteine von DK) ---------- */
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

  /* ---------- Datenschnitte: Was-wäre-wenn-Parameter, Basis vorgewählt ---------- */
  const parameter = [["menge", "Absatz je Monat in Stück"], ["preis", "Preis je Stück in €"], ["kv", "Variable Kosten je Stück in €"],
                     ["kf", "Fixkosten je Jahr in Tsd. €"]];
  parameter.forEach(([key, label]) => DK.schnitt(bFilter, label, "knoepfe", { optionen: OPT[key].map(v => [v, zahl(v, 0)]), wert: S[key],
    onChange: v => { S[key] = v; zeichnen(); } }));

  /* ---------- Berechnungen für KPI-Leiste und Tabellen ---------- */
  function kpiDaten(r) {
    const erreicht = r.bep <= r.qEnde, menge = Math.ceil(r.bep - 1e-9);
    return [
      { label: "Deckungsbeitrag je Stück", wert: zahl(r.db, 0), einheit: "€", bezug: `${zahl(S.preis, 0)} € − ${zahl(S.kv, 0)} €` },
      { label: "Break-Even-Menge", wert: isFinite(r.bep) ? zahl(menge, 0) : "–", einheit: "Stück", bezug: `${zahl(S.kf, 0)} Tsd. € : ${zahl(r.db, 0)} €` },
      { label: "Break-Even-Umsatz", wert: isFinite(r.bep) ? zahl(r.bepU, 0) : "–", einheit: "Tsd. €", bezug: `${zahl(menge, 0)} Stück × ${zahl(S.preis, 0)} €` },
      { label: "Break-Even erreicht", wert: erreicht ? MONATE[r.bepMonat] : "–", einheit: "",
        bezug: erreicht ? `nach ${zahl(r.bep / S.menge, 1)} Monaten` : "nicht im Planjahr" },
      { label: "Jahresergebnis", wert: delta(r.ergebnis, 0), einheit: "Tsd. €", wertKlasse: wirkung(r.ergebnis, +1, 0),
        bezug: `${zahl(Math.abs(r.qEnde - r.bep), 0)} Stück ${r.ergebnis >= 0 ? "über" : "unter"} BEP × ${zahl(r.db, 0)} €` },
    ].map(k => ({ ...k, delta: "", klasse: "neutral" }));
  }
  const SPALTEN = [
    { key: "kurz", titel: "Monat", breite: 46 },
    { key: "absatz", titel: "Absatz", breite: 70, fmt: v => zahl(v, 0) },
    { key: "umsatz", titel: "Umsatz", breite: 68, fmt: v => zahl(v, 0) },
    { key: "kosten", id: "sp-kosten", titel: "Gesamtkosten", breite: 108, fmt: v => zahl(v, 0) },
    { key: "ergebnis", id: "sp-ergebnis", titel: "Ergebnis", breite: 118, typ: "delta", richtung: +1, nk: 0, textBreite: 54 },
  ];
  function tooltipMonat(r, m) {
    return [`${m.name}`, `Absatz: ${zahl(S.menge, 0)} Stück, kumuliert ${zahl(m.absatz, 0)}`,
      `Umsatz: ${zahl(m.umsatzM, 1)} Tsd. €, kumuliert ${zahl(m.umsatz, 0)}`,
      `Variable Kosten: ${zahl(m.varM, 1)} Tsd. €, kumuliert ${zahl(m.varKum, 0)}`,
      `Fixkosten: ${zahl(S.kf, 0)} Tsd. € je Jahr`, `Gesamtkosten kumuliert: ${zahl(m.kosten, 0)} Tsd. €`,
      `Ergebnis kumuliert: ${delta(m.ergebnis, 0)} Tsd. €`, "Klick hebt den Monat hervor"];
  }

  /* ---------- Break-Even-Diagramm (Mengen-Break-Even, Monate unter der Achse) ---------- */
  function diagramm(ziel, breite, hoehe, r) {
    const U = q => q * S.preis / 1000, K = q => S.kf + q * S.kv / 1000;
    const xmax = Math.ceil(r.qEnde / 2000) * 2000, ymax = Math.ceil(Math.max(U(r.qEnde), K(r.qEnde)) / 1000) * 1000;
    const yTicks = Array.from({ length: ymax / 1000 + 1 }, (_, i) => i * 1000);
    const xTicks = Array.from({ length: xmax / 2000 + 1 }, (_, i) => i * 2000);
    const L = Math.ceil(Math.max(...yTicks.map(t => tw(zahl(t, 0))))) + 8;
    const R = Math.ceil(Math.max(tw("Gesamtkosten"), tw("variable Kosten"), tw("Fixkosten"))) + 14;
    const oben = 22, unten = 58, PW = breite - L - R, PH = hoehe - oben - unten;
    const sx = q => L + q / xmax * PW, sy = v => oben + PH - v / ymax * PH;
    const svg = sv("svg", { width: breite, height: hoehe, role: "img", "aria-label": "Break-Even-Diagramm aus Umsatz und Kosten über der Absatzmenge" }, ziel);
    const ende = r.qEnde, xe = sx(ende);

    // Achsen, Beschriftung
    sv("text", { x: 0, y: 12, class: "muted" }, svg, "Tsd. €");
    yTicks.forEach(t => sv("text", { x: L - 6, y: sy(t), dy: "0.35em", "text-anchor": "end", class: "muted" }, svg, zahl(t, 0)));
    xTicks.forEach(t => sv("text", { x: sx(t), y: oben + PH + 16, "text-anchor": "middle", class: "muted" }, svg, zahl(t, 0)));
    const mon = sv("g", { id: "x-monate" }, svg);
    r.monate.forEach(m => sv("text", { x: sx((m.i + 0.5) * S.menge), y: oben + PH + 34, "text-anchor": "middle", class: "muted" }, mon, m.kurz));
    sv("text", { x: L + PW, y: hoehe - 3, "text-anchor": "end", class: "muted" }, svg, "Absatzmenge kumuliert in Stück");
    if (S.auswahl != null) {
      const m = r.monate[S.auswahl];
      sv("rect", { x: sx(m.i * S.menge), y: oben, width: sx(S.menge) - sx(0), height: PH, fill: "#EFEFEF" }, svg);
    }

    // Verlust- und Gewinnzone zwischen Umsatz- und Gesamtkostenlinie
    const zone = (a, b, klasse) => {
      if (b <= a) return;
      sv("path", { d: `M${sx(a)},${sy(U(a))}L${sx(b)},${sy(U(b))}L${sx(b)},${sy(K(b))}L${sx(a)},${sy(K(a))}Z`, fill: TINT[klasse] }, svg);
    };
    const bq = Math.min(r.bep, ende);
    zone(0, bq, "schlecht");
    zone(bq, ende, "gut");

    // Linien
    sv("line", { x1: sx(0), x2: xe, y1: sy(S.kf), y2: sy(S.kf), stroke: "#8F8F8F", "stroke-width": 1.5 }, svg);
    sv("line", { x1: sx(0), x2: xe, y1: sy(K(0)), y2: sy(K(ende)), stroke: "#8F8F8F", "stroke-width": 2 }, svg);
    sv("line", { x1: sx(0), x2: xe, y1: sy(0), y2: sy(U(ende)), stroke: "#3A3F44", "stroke-width": 2 }, svg);
    sv("line", { x1: L, x2: L, y1: oben, y2: oben + PH, stroke: "#8C8C8C", "stroke-width": 1 }, svg);
    sv("line", { x1: L, x2: L + PW, y1: oben + PH, y2: oben + PH, stroke: "#8C8C8C", "stroke-width": 1 }, svg);

    // Klammer „variable Kosten“ rechts neben dem Planjahresende, zwischen Fix- und Gesamtkostenlinie
    const kx = xe + 4, ky0 = sy(S.kf), ky1 = sy(K(ende));
    sv("path", { d: `M${xe + 1},${ky0}H${kx}V${ky1}H${xe + 1}`, fill: "none", stroke: "#8F8F8F", "stroke-width": 1 }, svg);
    if (ky0 - ky1 > 50) sv("text", { x: xe + 10, y: (ky0 + ky1) / 2, dy: "0.35em", class: "muted", id: "lab-varkosten" }, svg, "variable Kosten");

    // Beschriftungen am Linienende, Mindestabstand 16 px
    const lab = [{ t: "Umsatz", y: sy(U(ende)) }, { t: "Gesamtkosten", y: sy(K(ende)) }, { t: "Fixkosten", y: sy(S.kf) }]
      .sort((a, b) => a.y - b.y);
    for (let i = 1; i < lab.length; i++) lab[i].y = Math.max(lab[i].y, lab[i - 1].y + 16);
    const gl = sv("g", { id: "lab-ende" }, svg);
    lab.forEach(l => sv("text", { x: xe + 10, y: l.y, dy: "0.35em" }, gl, l.t));

    // Zonenbeschriftung
    // „Verlust“ dort, wo das Wort über seine ganze Breite zwischen zwei Linien passt (Fixkostenlinie teilt die Zone)
    if (bq > 0) {
      const w = tw("Verlust") + 8, teile = [[q => Math.max(U(q), S.kf), q => K(q)], [q => U(q), q => Math.min(S.kf, K(q))]];
      let best = null;
      for (let f = 0.1; f <= 0.8; f += 0.05) {
        const x = sx(bq * f), qa = (x - w / 2 - L) / PW * xmax, qb = (x + w / 2 - L) / PW * xmax;
        if (qa < 0 || qb > bq) continue;
        teile.forEach(([lo, hi]) => {
          const unten = Math.min(sy(lo(qa)), sy(lo(qb))), oben = Math.max(sy(hi(qa)), sy(hi(qb))), platz = unten - oben;
          if (platz >= 20 && (!best || platz > best.platz)) best = { x, y: (unten + oben) / 2, platz };
        });
      }
      if (best) sv("text", { x: best.x, y: best.y, dy: "0.35em", "text-anchor": "middle", id: "lab-verlust" }, svg, "Verlust");
    }
    if (bq < ende) {
      // rechtsbündig über der Umsatzlinie: Die Linie steigt nach rechts, der Text bleibt über ihr
      // nur, wenn die Gewinnzone breit genug ist; sonst genügt die Legende
      const q = bq + (ende - bq) * 0.75;
      if (sx(q) - tw("Gewinn") > sx(bq) + 6) sv("text", { x: sx(q), y: sy(U(q)) - 6, "text-anchor": "end", id: "lab-gewinn" }, svg, "Gewinn");
    }

    // Break-Even-Point
    if (r.bep <= xmax) {
      const px = sx(r.bep), py = sy(r.bepU);
      sv("line", { x1: px, x2: px, y1: py, y2: oben + PH, stroke: "#1A1A1A", "stroke-width": 1, "stroke-dasharray": "3 2" }, svg);
      sv("circle", { cx: px, cy: py, r: 4.5, fill: "#3A3F44", stroke: "#FFFFFF", "stroke-width": 1.5 }, svg);
      // Beschriftung links über dem Punkt; reicht der Platz bis zur Achse nicht, rechts darunter (zwischen den Kostenlinien)
      const g = sv("g", { id: "bep-punkt" }, svg);
      const zeile2 = `${zahl(Math.ceil(r.bep - 1e-9), 0)} Stück · ${zahl(r.bepU, 0)} Tsd. €`;
      const links = px - 10 - Math.max(tw("Break-Even-Point", 14, true), tw(zeile2)) >= L + 6;
      const [ax, anker, y1] = links ? [px - 10, "end", py - 28] : [px + 10, "start", py + 24];
      sv("text", { x: ax, y: y1, "text-anchor": anker, style: "font-weight:bold" }, g, "Break-Even-Point");
      sv("text", { x: ax, y: y1 + 16, "text-anchor": anker }, g, zeile2);
    }

    // Monate als Klickflächen (Tooltip mit den Monatswerten)
    r.monate.forEach(m => {
      const blass = S.auswahl != null && S.auswahl !== m.i;
      const g = sv("g", { class: "dk-klick" + (blass ? " dk-blass" : "") }, svg);
      const hit = sv("rect", { x: sx(m.i * S.menge), y: oben, width: sx(S.menge) - sx(0), height: PH, fill: "transparent" }, g);
      hit.addEventListener("click", () => auswaehlen(m.i));
      tooltip(hit, () => tooltipMonat(r, m));
    });
    return svg;
  }

  /* ---------- Zeichnen ---------- */
  function zeichnen() {
    const r = rechnen();
    DK.kopf(bKopf, { titel: "Break-Even-Point-Analyse",
      untertitel: "Absatz, Umsatz und Kosten eines Produkts im Planjahr, kumuliert · Ausgangsdaten in den Datenschnitten",
      quelle: "Quelle: Absatz- und Kostenplanung",
      legende: [[TINT.gut, "Gewinn"], [TINT.schlecht, "Verlust"]] });
    DK.kpis(bKpi, kpiDaten(r));

    const erreicht = r.bep <= r.qEnde, menge = zahl(Math.ceil(r.bep - 1e-9), 0);
    const lang = `Bis ${menge} Stück Verlust, darüber Gewinn – je Stück ${zahl(r.db, 0)} € Deckungsbeitrag`;
    let v = DK.visual(bBep, { titel: "Break-Even-Diagramm", einheit: "Umsatz und Kosten in Tsd. €",
      botschaft: !isFinite(r.bep) ? "Kein Break-Even: Der Preis deckt die variablen Kosten nicht"
        : erreicht ? (DK.tw(lang) <= 562 ? lang : `Bis ${menge} Stück Verlust, darüber Gewinn`)
        : `Break-Even erst bei ${menge} Stück – im Planjahr Verlust` });
    diagramm(v.flaeche, v.breite, v.hoehe, r);

    const ab = r.monate.find(m => m.ergebnis >= 0);
    const langT = ab ? `Kumuliertes Ergebnis ab ${ab.name} positiv, im Dezember ${delta(r.ergebnis, 0)}` : "";
    v = DK.visual(bMon, { titel: "Monate kumuliert", einheit: "Absatz in Stück, sonst Tsd. €",
      botschaft: !ab ? "Kumuliertes Ergebnis bleibt im Planjahr negativ" : DK.tw(langT) <= 410 ? langT : `Kumuliertes Ergebnis ab ${ab.name} positiv` });
    DK.matrix(v.flaeche, { spalten: SPALTEN, zeilenhoehe: 24, zeilen: r.monate.map(m => ({ key: m.i, label: m.kurz, m, werte: m })),
      auswahl: S.auswahl, onClick: k => auswaehlen(k), tooltip: z => tooltipMonat(r, z.m) });
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  /* ---------- Lernplattform: Designregeln, Nachbau, Tabellen, CSV ---------- */
  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "v-bep", versatz: [0, 30], regel: "SAY – Botschaft vermitteln", titel: "Kernaussage je Visual",
        text: "Unter den Titeln steht, ab welcher Menge Gewinn entsteht und ab welchem Monat das kumulierte Ergebnis positiv ist. Die Sätze folgen den Datenschnitten. Das Original hatte nur den Diagrammtitel „Break-Even-Point“." },
      { nr: 2, ziel: "kopf-legende", anker: "links", regel: "UNIFY – Semantische Notation", titel: "Gewinn blaugrün, Verlust rot",
        text: "Die Fläche zwischen Umsatz- und Gesamtkostenlinie ist links vom Break-Even rot (Verlust), rechts blaugrün (Gewinn) – wie günstige und ungünstige Abweichungen in allen Dashboards. Das Original färbte Fix- und variable Kosten hell- und mittelblau und nur den Gewinn grün; der Verlust war nicht zu sehen." },
      { nr: 3, ziel: "filter", versatz: [-28, 0], regel: "UNIFY – Einheiten und Begriffe", titel: "Plausible Einheiten, ein Begriff",
        text: "Das Original nannte für alle Beträge „(in Euro)“ – 1.000 Stück hätten dann 375 € Erlös gebracht. Die Zahlen bleiben, gelesen als € je Stück und Tsd. €. „Erlöse“ und „Umsatz“ heißen einheitlich Umsatz, die Monate einheitlich Jan bis Dez statt „Jan.“, „Mrz“, „Apr“." },
      { nr: 4, ziel: "kpis", versatz: [-28, 0], regel: "CONDENSE – Informationsdichte", titel: "Ausgangsdaten als Datenschnitte, Rechenweg in der KPI-Leiste",
        text: "Vier Zeilen des Originals wiederholten zwölfmal denselben Monatswert. Jetzt stehen Absatz, Preis, variable Kosten und Fixkosten einmal in den Datenschnitten – und lassen sich ändern. Die KPI-Leiste zeigt Ergebnis und Rechenweg des Break-Even." },
      { nr: 5, ziel: "sp-ergebnis", anker: "links", versatz: [90, 243], regel: "EXPRESS – Passende Darstellung", titel: "Ergebnis als Abweichungsbalken",
        text: "Das kumulierte Ergebnis (Umsatz minus Gesamtkosten) steht als Balken an einer Nulllinie: rot bis September, blaugrün ab Oktober. Im Original musste man es aus zwei Tabellenzeilen selbst ausrechnen." },
      { nr: 6, ziel: "x-monate", anker: "links", versatz: [0, 5], regel: "CHECK – Visuelle Integrität", titel: "Menge und Monat auf einer Achse",
        text: "Die Absatzmenge ist linear skaliert; unter jedem Tausend steht der Monat, in dem es erreicht wird. So ist der Mengen-Break-Even (9.200 Stück) zugleich als Zeitpunkt (Oktober) ablesbar. Beide Achsen beginnen bei null." },
      { nr: 7, ziel: "lab-ende", versatz: [26, -2], regel: "SIMPLIFY – Überflüssiges weglassen", titel: "Wörter statt Kürzel",
        text: "Die Linien sind am Ende ausgeschrieben beschriftet statt mit U, Kg, Kv, Kf, p und BEPM. Diagrammrahmen, Titel im Diagramm, Gitternetz und die blauen Kostenflächen entfallen; die variablen Kosten zeigt eine Klammer." },
      { nr: 8, ziel: "v-monate", versatz: [0, 30], regel: "STRUCTURE – Inhalte ordnen", titel: "Monate untereinander",
        text: "Die Monatswerte stehen in natürlicher Reihenfolge untereinander, nicht als zwölf Spalten. Klick auf einen Monat in der Tabelle oder im Diagramm hebt ihn in beiden hervor." },
    ],
    nachbauIntro: "Alle Elemente sind Standard-Visuals von Power BI Desktop. Seitengröße benutzerdefiniert 1024 × 646 px. Schrift Arial: Beschriftungen 10,5 pt, Visualtitel 12 pt, Kennzahlen 19,5 pt. Das Berichtsdesign (JSON) setzt Farben und Schriften.",
    nachbau: [
      { id: "A", ziel: "kopf-titel", versatz: [26, 0], titel: "Kopfzeile und Legende", visual: "Textfeld; Formen (Rechteck)",
        felder: "–", format: "Titel 16,5 pt fett; Legende: Rechtecke 9 × 9 px in #A6D3CB (Gewinn) und #EEB4B4 (Verlust)" },
      { id: "B", ziel: "filter", versatz: [-28, 0], titel: "Was-wäre-wenn-Parameter", visual: "Modellierung › Neuer Parameter › Numerischer Bereich, je mit Datenschnitt (Stil Kacheln)",
        felder: "Absatz je Monat 900–1.100 (Schritt 100), Preis 350–400 (25), variable Kosten 225–275 (25), Fixkosten 1.000–1.300 (150); Standardwert = Basis",
        format: "Ausgewählt: Füllung #3A3F44, Schrift weiß; nicht ausgewählt: weiß, Rahmen #9A9A9A",
        hinweis: "Jeder Parameter erzeugt eine Tabelle mit GENERATESERIES und ein Measure mit SELECTEDVALUE; alle weiteren Measures verwenden nur diese vier." },
      { id: "C", ziel: "kpis", versatz: [-28, 0], titel: "KPI-Leiste", visual: "Karte (neu) mit 5 Measures",
        felder: "Deckungsbeitrag = [Preis] − [Variable Kosten]; Break-Even-Menge = ROUNDUP(DIVIDE([Fixkosten] * 1000; [Deckungsbeitrag]); 0); Break-Even-Umsatz; Break-Even-Monat = ROUNDUP(DIVIDE([Break-Even-Menge]; [Absatz je Monat]); 0); Jahresergebnis",
        format: "Referenzbeschriftung: Text-Measure mit dem Rechenweg, #4D4D4D; Jahresergebnis bedingt #00806B bzw. #C62828" },
      { id: "D", ziel: "x-monate", anker: "links", versatz: [0, 5], titel: "Break-Even-Diagramm – Zonen", visual: "Gestapeltes Flächendiagramm",
        felder: "X-Achse: Absatzmenge aus GENERATESERIES(0; 12000; 1000) plus der Break-Even-Menge (kontinuierlich); Werte: Basis = MIN([Umsatz]; [Gesamtkosten]) ohne Füllung, Verlust = MAX(0; [Gesamtkosten] − [Umsatz]), Gewinn = MAX(0; [Umsatz] − [Gesamtkosten])",
        format: "Verlust #C62828, Gewinn #00806B, je 65 % Transparenz; Linien aus; Achsen fest ab 0",
        hinweis: "Ohne den Stützpunkt bei der Break-Even-Menge würde die Zone zwischen 9.000 und 10.000 Stück falsch geknickt." },
      { id: "E", ziel: "lab-ende", versatz: [26, -2], titel: "Break-Even-Diagramm – Linien", visual: "Liniendiagramm, deckungsgleich über dem Flächendiagramm (Hintergrund transparent)",
        felder: "X-Achse wie D; Werte: Umsatz, Gesamtkosten, Fixkosten",
        format: "Umsatz #3A3F44 2 px, Gesamtkosten #8F8F8F 2 px, Fixkosten #8F8F8F 1 px; Reihenbeschriftung am Linienende an; X-Konstantenlinie bei [Break-Even-Menge] (Wert per fx), gestrichelt #1A1A1A, Datenbeschriftung „Break-Even-Point“",
        hinweis: "Die Monatsnamen unter der Achse sind ein Textfeld; die Klammer der variablen Kosten eine Form." },
      { id: "F", ziel: "v-monate", versatz: [0, 0], titel: "Monate kumuliert", visual: "Tabelle",
        felder: "Monat (Sortierspalte 1–12), Absatz kumuliert, Umsatz kumuliert, Gesamtkosten kumuliert, Ergebnis kumuliert – jeweils mit WINDOW bzw. einer laufenden Summe über den Monat",
        format: "Ergebnis: bedingte Formatierung „Datenbalken“, positiv #00806B, negativ #C62828, Achse automatisch; Zeilenrasterlinien #EFEFEF" },
      { id: "G", ziel: "v-bep", versatz: [0, 30], titel: "Kernaussagen", visual: "Textfeld mit dynamischem Wert",
        felder: "Text-Measures aus [Break-Even-Menge], [Deckungsbeitrag] und dem ersten Monat mit positivem kumuliertem Ergebnis",
        format: "10,5 pt, #4D4D4D" },
    ],
    theme: DK.thema(),
    csv: { name: "break_even_point_daten.csv", text: () => {
      const de = v => String(Number.isInteger(v) ? v : Number(v.toFixed(2))).replace(".", ",");
      return ["Monat;Absatz_Stueck;Absatz_kum_Stueck;Umsatz_TEUR;Umsatz_kum_TEUR;Variable_Kosten_TEUR;Variable_Kosten_kum_TEUR;Fixkosten_Jahr_TEUR;Gesamtkosten_kum_TEUR;Ergebnis_kum_TEUR",
        ...rechnen().monate.map(m => [m.name, S.menge, m.absatz, m.umsatzM, m.umsatz, m.varM, m.varKum, S.kf, m.kosten, m.ergebnis].map((v, i) => (i ? de(v) : v)).join(";"))]
        .join("\r\n"); } },
    tabellen: () => {
      const r = rechnen();
      return [
        { titel: "Ausgangsdaten (Datenschnitte)", kopf: ["Parameter", "Wert"], zeilen: parameter.map(([k, label]) => [label, zahl(S[k], 0)]) },
        { titel: "KPI-Leiste", kopf: ["Kennzahl", "Wert", "Rechenweg"], zeilen: kpiDaten(r).map(k => [k.label, k.wert + (k.einheit ? NBSP + k.einheit : ""), k.bezug]) },
        { titel: "Monate kumuliert (Stück, Tsd. €)", kopf: ["Monat", "Absatz", "Umsatz", "Kosten", "Ergebnis"],
          zeilen: r.monate.map(m => [m.kurz, zahl(m.absatz, 0), zahl(m.umsatz, 0), zahl(m.kosten, 0), delta(m.ergebnis, 0)]) },
      ];
    },
  });
  zeichnen();
})();
