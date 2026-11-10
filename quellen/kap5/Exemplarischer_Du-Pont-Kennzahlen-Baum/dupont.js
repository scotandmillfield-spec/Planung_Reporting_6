/* Abb. 5.50 „Exemplarischer Du-Pont-Kennzahlen-Baum“ (6. Auflage) – Einzelvisual 727 x 510 px = 110 x 77,2 mm.
   Kennzahlenbaum wie im Original: ROI = Umsatzrendite × Kapitalumschlag, Umsatzrendite = Gewinn ÷ Umsatz,
   Kapitalumschlag = Umsatz ÷ Kapital. Das Original zeigte je Knoten ein Diagramm über sieben Jahre; hier trägt jeder
   Knoten den Wert des Stichjahres mit Vorjahr und Abweichung nach Wirkung und darunter die sieben Jahre als
   Mini-Säulen (Ist anthrazit, Plan weiß umrandet). Umsatz steht – wie im klassischen Du-Pont-Schema – unter beiden
   Ästen. Daten: dupont.json (daten_dupont.py) – nur die Blätter Gewinn, Umsatz, Kapital (Werte des Originals);
   alle übrigen Knoten rechnet die Seite aus den Blättern.
   Online: Klick auf einen Knoten klappt seine Äste ein und aus, Klick auf eine Säule wählt das Jahr für den
   ganzen Baum, Esc kehrt zum Stichjahr 2027 zurück. */
(() => {
  "use strict";
  const { zahl, delta, wirkung, FARBE, NBSP, sv, el, tw } = DK;
  const J = DATA.jahre, SZ = DATA.szenario, N = J.length;
  const STICH = J.indexOf(DATA.stichjahr);
  const S = { auswahl: null, zu: new Set() };                 // auswahl: Jahresindex; zu: eingeklappte Knoten
  const jahr = () => (S.auswahl === null ? STICH : S.auswahl);

  /* ---------- Kennzahlen: Blätter aus den Daten, Knoten gerechnet ---------- */
  const reihe = f => J.map((_, i) => f(i));
  const G = DATA.gewinn, U = DATA.umsatz, K = DATA.kapital;
  const ROS = reihe(i => G[i] / U[i] * 100), KU = reihe(i => U[i] / K[i]), ROI = reihe(i => ROS[i] * KU[i]);
  const KNOTEN = {
    roi: { name: "Return on Investment", einheit: "%", werte: ROI, nk: 1, richtung: 1, dEinheit: NBSP + "%-Pkt.",
           formel: i => `= Umsatzrendite × Kapitalumschlag = ${zahl(ROS[i], 2)} % × ${zahl(KU[i], 3)} = ${zahl(ROI[i], 2)} %`,
           kinder: ["ros", "ku"], op: "×", erkl: "Verzinsung des eingesetzten Kapitals" },
    ros: { name: "Umsatzrendite", einheit: "%", werte: ROS, nk: 1, richtung: 1, dEinheit: NBSP + "%-Pkt.",
           formel: i => `= Gewinn ÷ Umsatz = ${zahl(G[i])} ÷ ${zahl(U[i])} = ${zahl(ROS[i], 2)} %`,
           kinder: ["gewinn", "umsatz1"], op: "÷", erkl: "Gewinn je 100 € Umsatz" },
    ku: { name: "Kapitalumschlag", einheit: "", werte: KU, nk: 2, richtung: 1, dEinheit: "",
          formel: i => `= Umsatz ÷ Kapital = ${zahl(U[i])} ÷ ${zahl(K[i])} = ${zahl(KU[i], 3)}`,
          kinder: ["umsatz2", "kapital"], op: "÷", erkl: "Wie oft das Kapital im Jahr über den Umsatz zurückfließt" },
    gewinn: { name: "Gewinn", einheit: "Mio. €", werte: G, nk: 0, richtung: 1, dEinheit: "", erkl: "Blatt – Wert aus den Daten" },
    umsatz1: { name: "Umsatz", einheit: "Mio. €", werte: U, nk: 0, richtung: 1, dEinheit: "", erkl: "Blatt – Wert aus den Daten (auch unter Kapitalumschlag)" },
    umsatz2: { name: "Umsatz", einheit: "Mio. €", werte: U, nk: 0, richtung: 1, dEinheit: "", erkl: "Blatt – Wert aus den Daten (auch unter Umsatzrendite)" },
    kapital: { name: "Kapital", einheit: "Mio. €", werte: K, nk: 0, richtung: -1, dEinheit: "", erkl: "Blatt – Wert aus den Daten; ein Anstieg senkt den Kapitalumschlag" },
  };
  const ELTERN = {};
  Object.entries(KNOTEN).forEach(([id, k]) => (k.kinder || []).forEach(c => { ELTERN[c] = id; }));
  const sichtbar = id => { for (let p = ELTERN[id]; p; p = ELTERN[p]) if (S.zu.has(p)) return false; return true; };
  const fmt = (k, v) => zahl(v, k.nk) + (k.einheit === "%" ? NBSP + "%" : "");
  const dlt = (k, i) => (i > 0 ? k.werte[i] - k.werte[i - 1] : null);
  const proz = (a, b) => (a / b - 1) * 100;

  /* ---------- Zustand ---------- */
  addEventListener("keydown", e => { if (e.key === "Escape" && S.auswahl !== null) { S.auswahl = null; zeichnen(); } });
  const waehlen = i => { S.auswahl = S.auswahl === i ? null : i; zeichnen(); };
  const klappen = id => { if (S.zu.has(id)) S.zu.delete(id); else S.zu.add(id); zeichnen(); };

  /* ---------- Layout ---------- */
  DK.init({ titel: "Du-Pont-Kennzahlenbaum", breite: 727, hoehe: 510 });
  const bVis = DK.box("v-baum", 16, 10, 695, 492);
  const NB = 196, NH = 100, GAP = 14, X = [0, 250, 499];
  const yBlatt = i => i * (NH + GAP);
  const mitteY = y => y + NH / 2;
  const LAGE = {
    gewinn: [2, yBlatt(0)], umsatz1: [2, yBlatt(1)], umsatz2: [2, yBlatt(2)], kapital: [2, yBlatt(3)],
  };
  LAGE.ros = [1, (yBlatt(0) + yBlatt(1)) / 2];
  LAGE.ku = [1, (yBlatt(2) + yBlatt(3)) / 2];
  LAGE.roi = [0, (LAGE.ros[1] + LAGE.ku[1]) / 2];

  /* ---------- Tooltip (gleiches Verhalten wie die Bausteine von DK) ---------- */
  const tip = document.querySelector(".dk-tooltip");
  function tooltip(ziel, zeilenFn) {
    ziel.addEventListener("pointermove", ev => {
      tip.textContent = "";
      zeilenFn().filter(Boolean).forEach((z, i) => el(i === 0 ? "b" : "div", {}, tip, z));
      tip.style.display = "block";
      const r = tip.getBoundingClientRect();
      let x = ev.clientX + 14, y = ev.clientY + 14;
      if (x + r.width > innerWidth - 8) x = ev.clientX - r.width - 14;
      if (y + r.height > innerHeight - 8) y = ev.clientY - r.height - 14;
      tip.style.left = x + "px"; tip.style.top = y + "px";
    });
    ziel.addEventListener("pointerleave", () => { tip.style.display = "none"; });
  }
  el("style", {}, document.head, `#v-baum .kb-knoten { cursor: pointer; } #v-baum .kb-knoten:hover > rect.kb-flaeche { fill: #EFEFEF; }`);

  /* ---------- Botschaft ---------- */
  function botschaft() {
    const i = jahr(), lbl = `${SZ[i] === "Plan" ? "Plan " : ""}${J[i]}`;
    const kopf = `${lbl}: ROI ${zahl(ROI[i], 1)}${NBSP}%`;
    if (i === 0) return `${kopf} – erstes Jahr der Reihe, ohne Vorjahr; bis 2027 steigt der ROI auf ${zahl(ROI[STICH], 1)}${NBSP}%`;
    const d = delta(ROI[i] - ROI[i - 1], 1, NBSP + "%-Pkt.");
    const rRos = ROS[i] / ROS[i - 1] - 1, rKu = KU[i] / KU[i - 1] - 1;
    const p = (a, b) => delta(proz(a, b), 1, NBSP + "%");
    let satz;
    if (Math.abs(rKu) >= Math.abs(rRos)) {
      satz = `Kapitalumschlag ${rKu < 0 ? "sinkt" : "steigt"}: Umsatz ${p(U[i], U[i - 1])}, Kapital ${p(K[i], K[i - 1])}`;
    } else {
      satz = `Umsatzrendite ${rRos < 0 ? "sinkt" : "steigt"}: Gewinn ${p(G[i], G[i - 1])}, Umsatz ${p(U[i], U[i - 1])}`;
    }
    const passt = k => k.find(t => tw(t) <= 695) || k[k.length - 1];
    return passt([`${kopf} (${d} zum Vorjahr) – ${satz}`, `${kopf} (${d}) – ${satz}`, `${kopf} (${d} zum Vorjahr)`]);
  }

  /* ---------- Knoten ---------- */
  function knoten(svg, id) {
    const k = KNOTEN[id], [spalte, y] = LAGE[id], x = X[spalte], i = jahr();
    const g = sv("g", { id: "kn-" + id }, svg);
    const kn = sv("g", { class: k.kinder ? "kb-knoten" : "", id: "kopf-" + id }, g);
    sv("rect", { class: "kb-flaeche", x, y, width: NB, height: NH, fill: "#F6F6F6" }, kn);
    const t = sv("text", { x: x + 8, y: y + 15, style: "font-weight:bold" }, kn, k.name);
    if (k.einheit) { t.appendChild(document.createTextNode(", ")); sv("tspan", { class: "muted", style: "font-weight:normal" }, t, k.einheit); }
    // Wert des Jahres, rechts Vorjahr und Abweichung nach Wirkung
    sv("text", { x: x + 8, y: y + 42, style: "font-weight:bold;font-size:22px" }, kn, zahl(k.werte[i], k.nk));
    const d = dlt(k, i), kl = d == null ? "neutral" : wirkung(d, k.richtung, k.nk);
    const xr = x + 84;
    sv("text", { x: xr, y: y + 30, class: "muted" }, kn, i > 0 ? `VJ ${zahl(k.werte[i - 1], k.nk)}` : "VJ –");
    const tz = sv("text", { x: xr, y: y + 46, class: "muted" }, kn, "Δ ");
    sv("tspan", { style: `font-weight:bold;fill:${kl === "neutral" ? "var(--text)" : FARBE[kl]}` }, tz, d == null ? "–" : delta(d, k.nk, k.dEinheit));
    const hit = sv("rect", { x, y, width: NB, height: 52, fill: "transparent" }, kn);
    if (k.kinder && !DK.PRINT) {
      const zu = S.zu.has(id);
      const kx = x + NB, ky = mitteY(y);
      sv("circle", { cx: kx, cy: ky, r: 8, fill: "#FFFFFF", stroke: "#3A3F44", "stroke-width": 1 }, kn);
      sv("line", { x1: kx - 4, x2: kx + 4, y1: ky, y2: ky, stroke: "#3A3F44", "stroke-width": 1.5 }, kn);
      if (zu) sv("line", { x1: kx, x2: kx, y1: ky - 4, y2: ky + 4, stroke: "#3A3F44", "stroke-width": 1.5 }, kn);
    }
    if (k.kinder) kn.addEventListener("click", () => klappen(id));
    tooltip(hit, () => [k.name + (k.einheit ? ", " + k.einheit : ""), k.erkl,
      k.formel ? k.formel(i) : `${SZ[i]} ${J[i]}: ${zahl(k.werte[i], k.nk)} ${k.einheit}`,
      i > 0 ? `Vorjahr ${zahl(k.werte[i - 1], k.nk)} · ΔVJ ${delta(d, k.nk, k.dEinheit)}` + (k.richtung < 0 ? " (Anstieg ungünstig)" : "") : "",
      k.kinder ? (S.zu.has(id) ? "Klick klappt die Äste aus" : "Klick klappt die Äste ein") : ""]);
    // Mini-Säulen der sieben Jahre (Ist anthrazit, Plan weiß umrandet), Achse ab null
    const max = Math.max(...k.werte), slot = 26, x0 = x + 8, base = y + NH - 20, hMax = 28;
    J.forEach((jj, j) => {
      const blass = S.auswahl !== null && S.auswahl !== j;
      const gs = sv("g", { class: "dk-klick" + (blass ? " dk-blass" : "") }, g);
      const h = Math.max(1, k.werte[j] / max * hMax), bx = x0 + j * slot + 4, bw = slot - 8;
      if (SZ[j] === "Plan") sv("rect", { x: bx + 0.5, y: base - h + 0.5, width: bw - 1, height: h - 1, fill: "#FFFFFF", stroke: "#3A3F44", "stroke-width": 1 }, gs);
      else sv("rect", { x: bx, y: base - h, width: bw, height: h, fill: FARBE.ist }, gs);
      sv("text", { x: bx + bw / 2, y: base + 15, "text-anchor": "middle", class: j === i ? "" : "muted",
                   style: j === i ? "font-weight:bold" : "" }, gs, "’" + String(jj).slice(2));
      const h2 = sv("rect", { x: x0 + j * slot, y: base - hMax - 2, width: slot, height: hMax + 20, fill: "transparent" }, gs);
      h2.addEventListener("click", ev => { ev.stopPropagation(); waehlen(j); });
      tooltip(h2, () => [`${k.name} · ${SZ[j]} ${jj}`, `${zahl(k.werte[j], k.nk === 0 ? 0 : k.nk + 1)} ${k.einheit}`.trim(),
        j > 0 ? `ΔVJ ${delta(k.werte[j] - k.werte[j - 1], k.nk, k.dEinheit)}` : "kein Vorjahr in der Reihe",
        "Klick wählt das Jahr für den ganzen Baum"]);
    });
    sv("line", { x1: x0, x2: x0 + N * slot, y1: base + 0.5, y2: base + 0.5, stroke: "#8C8C8C", "stroke-width": 1 }, g);
  }

  /* ---------- Verbindungen mit Rechenzeichen ---------- */
  function verbindung(svg, id) {
    const k = KNOTEN[id], [sp, y] = LAGE[id], xa = X[sp] + NB + 8, xm = (X[sp] + NB + X[sp + 1]) / 2, xe = X[sp + 1];
    const ys = k.kinder.map(c => mitteY(LAGE[c][1]));
    const g = sv("g", { id: "vb-" + id }, svg);
    const st = { stroke: "#6E747A", "stroke-width": 1.5, fill: "none" };
    sv("path", { d: `M${xa},${mitteY(y)} H${xm}`, ...st }, g);
    sv("path", { d: `M${xm},${ys[0]} V${ys[1]}`, ...st }, g);
    ys.forEach(yy => sv("path", { d: `M${xm},${yy} H${xe}`, ...st }, g));
    const ym = mitteY(y);
    sv("circle", { cx: xm, cy: ym, r: 10, fill: "#FFFFFF", stroke: "#6E747A", "stroke-width": 1.5 }, g);
    sv("text", { x: xm, y: ym, dy: "0.35em", "text-anchor": "middle", style: "font-weight:bold" }, g, k.op);
  }

  /* ---------- Zeichnen ---------- */
  function zeichnen() {
    const v = DK.visual(bVis, { titel: "Du-Pont-Kennzahlenbaum", einheit: "Ist 2023–2027, Plan 2028–2029", botschaft: botschaft() });
    const svg = sv("svg", { width: v.breite, height: v.hoehe, role: "img", "aria-label": "Du-Pont-Kennzahlenbaum: ROI gleich Umsatzrendite mal Kapitalumschlag" }, v.flaeche);
    const ids = Object.keys(KNOTEN);
    ids.filter(id => KNOTEN[id].kinder && sichtbar(id) && !S.zu.has(id)).forEach(id => verbindung(svg, id));
    // ROI zuerst: seine erste Säule ist das erste Klickziel des Visuals
    ["roi", "ros", "ku", "gewinn", "umsatz1", "umsatz2", "kapital"].filter(sichtbar).forEach(id => knoten(svg, id));
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  /* ---------- Lernplattform: Designregeln, Nachbau, Tabellen, CSV ---------- */
  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "v-baum", anker: "links", versatz: [664, 24], regel: "SAY – Botschaft vermitteln", titel: "Aussage zum Stichjahr",
        text: "Unter dem Titel steht, wie sich der ROI im gewählten Jahr verändert und welcher Ast das treibt: 2027 sinkt der Kapitalumschlag, weil das Kapital stärker wächst als der Umsatz. Das Original hatte nur Diagrammtitel." },
      { nr: 2, ziel: "vb-roi", anker: "links", versatz: [38, 143], regel: "STRUCTURE – Rechenweg zeigen", titel: "Baum mit Rechenzeichen",
        text: "Die Verbindungen tragen die Rechenart: ROI = Umsatzrendite × Kapitalumschlag, darunter jeweils ÷. Der Umsatz steht unter beiden Ästen, wie im klassischen Du-Pont-Schema. Im Original liefen zwei Linien in ein gemeinsames Umsatzdiagramm, die Rechenregel fehlte." },
      { nr: 3, ziel: "kopf-roi", anker: "links", versatz: [124, -20], regel: "EXPRESS – Vergleich mit Maß", titel: "Wert, Vorjahr und Abweichung",
        text: "Jeder Knoten nennt den Wert des Stichjahres groß, daneben Vorjahr und Abweichung, farbig nach Wirkung: Beim Kapital ist ein Anstieg ungünstig, weil er den Kapitalumschlag senkt. Das Original zeigte nur Zeitreihen ohne Vergleich." },
      { nr: 4, ziel: "kn-kapital", anker: "links", versatz: [193, 6], regel: "UNIFY – Semantische Notation", titel: "Ist dunkel, Plan umrandet",
        text: "Ist 2023–2027 anthrazit, Plan 2028–2029 weiß mit Kontur, in allen sechs Knoten gleich. Das Original färbte die Planjahre uneinheitlich (Gewinn: zwei Töne, Kapital: einer, Umsatz: keiner) und mischte Linien- und Säulendiagramme." },
      { nr: 5, ziel: "kn-umsatz2", anker: "links", versatz: [193, 6], regel: "CHECK – Visuelle Integrität", titel: "Säulen ab null, nachgerechnet",
        text: "Alle Mini-Säulen beginnen bei null. Im Original begann die Kapitalachse bei 150 – die Säule 2025 (170) wirkte halb so hoch wie 2029 (202); andere Achsen reichten ohne Grund bis −20 % oder −1.000. Umsatzrendite, Kapitalumschlag und ROI sind aus den Blättern gerechnet." },
      { nr: 6, ziel: "kn-gewinn", anker: "links", versatz: [193, 6], regel: "SIMPLIFY – Überflüssiges weglassen", titel: "Ohne Achsen, Gitter und Rahmen",
        text: "Gitternetzlinien, Achsenskalen, Rahmen, die Beschriftung „Year“ und Datenbeschriftungen an jedem Punkt entfallen; die genauen Werte stehen im Tooltip und in „Werte als Tabelle“. Englische Titel sind übersetzt." },
      { nr: 7, ziel: "kopf-ros", anker: "links", versatz: [192, 6], regel: "CONDENSE – Bei Bedarf vertiefen", titel: "Äste klappen, Jahr wählen",
        text: "Ein Klick auf einen Knoten klappt seine Äste ein oder aus, ein Klick auf eine Säule wählt das Jahr für den ganzen Baum; Esc führt zurück zu 2027. So bleibt der Baum übersichtlich und lässt sich bis zu den Blättern verfolgen." },
    ],
    nachbauIntro: "Seitengröße benutzerdefiniert 727 × 510 px. Schrift Arial: Beschriftungen 10,5 pt, Titel 12 pt, Knotenwerte 16,5 pt. Datenmodell: Tabelle Kennzahlen (Jahr, Szenario, Gewinn, Umsatz, Kapital) wie in der CSV-Datei, Jahr als Dimension. Der Dekompositionsbaum von Power BI zerlegt nur additiv; ein multiplikativer Kennzahlenbaum wird aus Karten, kleinen Säulendiagrammen und Linienformen zusammengesetzt.",
    nachbau: [
      { id: "A", ziel: "kopf-roi", anker: "links", versatz: [124, -20], titel: "Knotenwert", visual: "Karte (neu) mit Referenzbeschriftung (6×)",
        felder: "ROI = DIVIDE( [Gewinn]; [Kapital] ); Umsatzrendite = DIVIDE( [Gewinn]; [Umsatz] ); Kapitalumschlag = DIVIDE( [Umsatz]; [Kapital] ); Vorjahr = CALCULATE( [ROI]; Kennzahlen[Jahr] = MAX( Kennzahlen[Jahr] ) − 1 )",
        format: "Wert 16,5 pt fett; Referenzbeschriftung ΔVJ mit bedingter Farbe (#00806B / #C62828, beim Kapital umgekehrt); Hintergrund #F6F6F6" },
      { id: "B", ziel: "kn-gewinn", anker: "links", versatz: [193, 6], titel: "Zeitreihe je Knoten", visual: "Gruppiertes Säulendiagramm (6×)",
        felder: "X-Achse: Jahr; Y-Achse: Measure des Knotens; Legende: Szenario", format: "Ist #3A3F44, Plan weiß mit Rahmen #3A3F44; Y-Achse aus, Start bei 0; Gitternetz aus",
        hinweis: "Klick auf eine Säule filtert per Kreuzfilterung alle Karten auf dieses Jahr." },
      { id: "C", ziel: "vb-ros", anker: "links", versatz: [35, 81], titel: "Verbindungen und Rechenzeichen", visual: "Formen (Linie) und Textfeld",
        felder: "–", format: "Linien 1,5 pt #6E747A, Kreis mit „×“ bzw. „÷“ 10,5 pt fett" },
      { id: "D", ziel: "kopf-ku", anker: "links", versatz: [192, 6], titel: "Äste ein- und ausklappen", visual: "Schaltfläche mit Lesezeichen",
        felder: "Je Ast zwei Lesezeichen (Visuals ein- bzw. ausgeblendet über den Auswahlbereich)", format: "Schaltfläche „+“/„−“ am Knoten" },
    ],
    theme: DK.thema(),
    csv: { name: "du_pont_kennzahlen.csv", text: () => {
      const d = (v, nk) => v.toFixed(nk).replace(".", ",");
      const z = ["Jahr;Szenario;Gewinn_MioEUR;Umsatz_MioEUR;Kapital_MioEUR;Umsatzrendite_Prozent;Kapitalumschlag;ROI_Prozent"];
      J.forEach((jj, i) => z.push([jj, SZ[i], G[i], U[i], K[i], d(ROS[i], 2), d(KU[i], 3), d(ROI[i], 2)].join(";")));
      return z.join("\r\n"); } },
    tabellen: () => [
      { titel: "Du-Pont-Kennzahlen 2023–2029", kopf: ["Jahr", "Szenario", "Gewinn", "Umsatz", "Kapital", "Umsatzrendite %", "Kapitalumschlag", "ROI %"],
        zeilen: J.map((jj, i) => [String(jj), SZ[i], zahl(G[i]), zahl(U[i]), zahl(K[i]), zahl(ROS[i], 1), zahl(KU[i], 2), zahl(ROI[i], 1)]) },
      { titel: `Abweichung zum Vorjahr, ${SZ[jahr()]} ${J[jahr()]}`, kopf: ["Kennzahl", "Wert", "Vorjahr", "ΔVJ"],
        zeilen: ["roi", "ros", "ku", "gewinn", "umsatz1", "kapital"].map(id => {
          const k = KNOTEN[id], i = jahr();
          return [k.name, fmt(k, k.werte[i]), i > 0 ? fmt(k, k.werte[i - 1]) : "–", i > 0 ? delta(dlt(k, i), k.nk, k.dEinheit) : "–"];
        }) },
    ],
  });
  zeichnen();
})();
