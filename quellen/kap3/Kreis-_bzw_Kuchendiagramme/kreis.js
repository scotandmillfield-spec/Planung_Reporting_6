/* Einzelvisual „Kreis- bzw. Kuchendiagramme“ (Abb. 3.42): Umsatz je strategischer Geschäftseinheit als Kreisdiagramm.
   Seite 727 x 480 px = 110 x 72,6 mm. Daten: kreis.json (daten_kreis.py) – Umsatz je SGE und Jahr in Mio. €;
   2027 mit den Werten des Originals. Diagrammtyp bleibt: ein Kreis, Beginn bei 12 Uhr, Segmente absteigend im
   Uhrzeigersinn. Grautöne nach Größe statt bunter Farben, Name, Wert und Anteil direkt am Segment statt Legende
   (deren Namen im Original falsch waren). Datenschnitt Jahr; Klick auf ein Segment hebt es hervor. */
(() => {
  "use strict";
  const { zahl, delta, NBSP, sv, el } = DK;
  const JAHRE = DATA.jahre, SGE = DATA.sge, U = DATA.umsatz;          // U[jahrIndex][sgeIndex]
  const FUELL = ["#3A3F44", "#6E747A", "#A9A9A9", "#D4D4D4"];          // nach Größe von dunkel nach hell
  const pz = (a, nk = 0) => zahl(a * 100, nk) + NBSP + "%";
  const TAU = 2 * Math.PI;

  /* ---------- Zustand ---------- */
  const S = { jahr: JAHRE[JAHRE.length - 1], auswahl: null };
  const auswaehlen = i => { S.auswahl = S.auswahl === i ? null : i; zeichnen(); };
  addEventListener("keydown", e => { if (e.key === "Escape" && S.auswahl !== null) { S.auswahl = null; zeichnen(); } });

  /* ---------- Layout ---------- */
  DK.init({ titel: "Kreis- bzw. Kuchendiagramme", breite: 727, hoehe: 480 });
  const bKopf = DK.box("kopf", 16, 8, 695, 46);
  DK.haarlinie(58);
  const bFilter = DK.box("filter", 16, 64, 695, 50, "dk-filter");
  DK.haarlinie(120);
  const bVis = DK.box("v-kreis", 16, 130, 695, 342);

  /* ---------- Berechnungen ---------- */
  function daten(jahr = S.jahr) {
    const ji = JAHRE.indexOf(jahr);
    const ges = U[ji].reduce((s, v) => s + v, 0);
    const teile = SGE.map((name, i) => ({ i, name, wert: U[ji][i], vj: ji > 0 ? U[ji - 1][i] : null }))
      .sort((a, b) => b.wert - a.wert);                                // absteigend im Uhrzeigersinn
    teile.forEach((t, rang) => { t.rang = rang; t.anteil = t.wert / ges; });
    return { ges, teile, vjGes: ji > 0 ? U[ji - 1].reduce((s, v) => s + v, 0) : null };
  }

  /* ---------- Botschaft ---------- */
  const passt = (k, breite) => k.find(t => DK.tw(t) <= breite) || k[k.length - 1];
  const dvj = t => delta((t.wert / t.vj - 1) * 100, 1, NBSP + "%");
  function botschaft(d, breite) {
    if (S.auswahl !== null) {
      const t = d.teile.find(x => x.i === S.auswahl);
      const k = [`${t.name}: ${zahl(t.wert)} Mio. € = ${pz(t.anteil)} des Umsatzes`];
      if (t.vj) k.unshift(`${k[0]}, ΔVJ ${dvj(t)}`);
      return passt(k, breite);
    }
    const [a, b] = d.teile, zwei = `${a.name} und ${b.name.replace("SGE ", "")} erwirtschaften ${pz(a.anteil + b.anteil)} des Umsatzes`;
    const k = [];
    if (a.vj) {
      const wachs = d.teile.filter(t => t.vj).sort((x, y) => (y.wert / y.vj) - (x.wert / x.vj))[0];
      k.push(`${zwei}, am stärksten wächst ${wachs.name} (${dvj(wachs)})`);
    }
    k.push(zwei);
    return passt(k, breite);
  }

  /* ---------- Kreisdiagramm ---------- */
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
  const P = (cx, cy, r, a) => [cx + r * Math.sin(a), cy - r * Math.cos(a)];       // a im Uhrzeigersinn ab 12 Uhr
  function sektor(cx, cy, r, a0, a1) {
    if (a1 - a0 >= TAU - 1e-6) return `M${cx},${cy - r}A${r},${r} 0 1 1 ${cx},${cy + r}A${r},${r} 0 1 1 ${cx},${cy - r}Z`;
    const [ax, ay] = P(cx, cy, r, a0), [bx, by] = P(cx, cy, r, a1);
    return `M${cx},${cy}L${ax},${ay}A${r},${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${bx},${by}Z`;
  }
  function kreis(ziel, d, breite, hoehe) {
    ziel.textContent = "";
    const svg = sv("svg", { width: breite, height: hoehe, role: "img",
      "aria-label": `Kreisdiagramm: Umsatz ${S.jahr} nach strategischen Geschäftseinheiten` }, ziel);
    const R = Math.min(hoehe / 2 - 12, 150), cx = breite / 2, cy = hoehe / 2;
    const gs = sv("g", { id: "kr-segmente" }, svg), gl = sv("g", { id: "kr-beschriftung" }, svg);
    const blass = t => S.auswahl !== null && t.i !== S.auswahl;
    let a0 = 0;
    const labels = [];
    d.teile.forEach(t => {
      const a1 = a0 + TAU * t.anteil, am = (a0 + a1) / 2;
      const g = sv("g", { class: "dk-klick" + (blass(t) ? " dk-blass" : ""), "data-name": t.name }, gs);
      const p = sv("path", { d: sektor(cx, cy, R, a0, a1), fill: FUELL[t.rang], stroke: "#FFFFFF", "stroke-width": 2 }, g);
      p.addEventListener("click", () => auswaehlen(t.i));
      tooltip(p, () => {
        const z = [t.name, `Umsatz ${S.jahr}: ${zahl(t.wert)} Mio. € · Anteil ${pz(t.anteil, 1)}`];
        if (t.vj) z.push(`Vorjahr ${zahl(t.vj)} Mio. € · ΔVJ ${dvj(t)}`);
        z.push("Klick hebt das Segment hervor");
        return z;
      });
      const rechts = Math.sin(am) >= 0;
      const [px, py] = P(cx, cy, R + 4, am);
      labels.push({ t, am, rechts, px, py, y: P(cx, cy, R + 22, am)[1] });
      a0 = a1;
    });
    // Beschriftung außen, links und rechts getrennt; überlappende Etiketten auseinanderschieben, Führungslinie mit Knick
    const H = 36, oben = 18, unten = hoehe - 18;
    [true, false].forEach(seite => {
      const L = labels.filter(l => l.rechts === seite).sort((a, b) => a.y - b.y);
      L.forEach((l, k) => { l.y = Math.max(l.y, oben, k ? L[k - 1].y + H : -Infinity); });
      for (let k = L.length - 1; k >= 0; k--) l2(L, k);
      function l2(arr, k) { arr[k].y = Math.min(arr[k].y, unten - (arr.length - 1 - k) * H, k < arr.length - 1 ? arr[k + 1].y - H : Infinity); }
    });
    labels.forEach(l => {
      const { t, rechts, px, py } = l;
      const x = rechts ? cx + R + 30 : cx - R - 30, ende = rechts ? x - 5 : x + 5;
      const g = sv("g", { class: blass(t) ? "dk-blass" : "" }, gl);
      const [kx, ky] = P(cx, cy, R + 14, l.am);
      sv("polyline", { points: `${px},${py} ${kx},${ky} ${ende},${l.y}`, fill: "none", stroke: "#8C8C8C", "stroke-width": 1 }, g);
      const anker = rechts ? "start" : "end";
      sv("text", { x, y: l.y - 8, dy: "0.35em", "text-anchor": anker, style: "font-weight:bold" }, g, t.name);
      sv("text", { x, y: l.y + 9, dy: "0.35em", "text-anchor": anker }, g, `${zahl(t.wert)} · ${pz(t.anteil)}`);
    });
  }

  /* ---------- Datenschnitt und Summe ---------- */
  DK.schnitt(bFilter, "Jahr", "knoepfe", {
    optionen: JAHRE.map(y => [y, String(y)]), wert: S.jahr,
    onChange: v => { S.jahr = Number(v); S.auswahl = null; zeichnen(); } });
  const gesamt = el("div", { id: "kr-gesamt", class: "dk-rechts dk-quelle", style: "align-self:flex-end;padding-bottom:6px" }, bFilter);

  /* ---------- Zeichnen ---------- */
  function zeichnen() {
    const d = daten();
    const vj = S.jahr > JAHRE[0] ? `, VJ ${S.jahr - 1}` : "";
    DK.kopf(bKopf, { titel: "Umsatz nach strategischen Geschäftseinheiten (SGE)",
      untertitel: `Ist ${S.jahr}${vj}, Mio. € · ` + botschaft(d, 695 - 130), quelle: "", legende: [] });
    const ut = bKopf.querySelector(".dk-untertitel");           // Zeile unter dem Titel: bei langer Aussage kleiner setzen, nie umbrechen
    ut.style.whiteSpace = "nowrap";
    for (let px = 14; px > 9 && ut.getBoundingClientRect().width > bKopf.clientWidth; px -= 0.5) ut.style.fontSize = px + "px";
    gesamt.textContent = "";
    gesamt.appendChild(document.createTextNode(`Umsatz ${S.jahr}: `));
    el("b", { style: "color:#1A1A1A" }, gesamt, `${zahl(d.ges)} Mio. €`);
    if (d.vjGes) gesamt.appendChild(document.createTextNode(` · ΔVJ ${delta((d.ges / d.vjGes - 1) * 100, 1, NBSP + "%")}`));
    kreis(bVis, d, bVis.clientWidth, bVis.clientHeight);
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  /* ---------- Lernplattform: Designregeln, Nachbau, Tabellen, CSV ---------- */
  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "kopf", anker: "links", versatz: [600, 1], regel: "SAY – Botschaft vermitteln", titel: "Kernaussage unter dem Titel",
        text: "Unter dem Titel steht in einem Satz, was das Diagramm zeigt – wie viel die beiden größten Einheiten zusammen beitragen und welche am stärksten wächst; nach einem Klick die Aussage zum gewählten Segment. Das Original hatte nur die Überschrift „Umsatz (Mio €)“." },
      { nr: 2, ziel: "kr-beschriftung", anker: "links", versatz: [-12, 30], regel: "CHECK – Richtige Inhalte", titel: "Namen korrigiert",
        text: "Die Legende des Originals nannte die dritte und vierte Einheit noch einmal „SGE A“ und „SGE B“ – ein Fehler der Vorlage. Jetzt heißen sie SGE C und SGE D, und der Name steht direkt am Segment." },
      { nr: 3, ziel: "kr-beschriftung", anker: "links", versatz: [600, 110], regel: "SIMPLIFY – Überflüssiges weglassen", titel: "Legende entfällt",
        text: "Name, Wert und Anteil stehen am Segment; die Legende rechts neben dem Kreis entfällt, das Auge muss nicht mehr zwischen Farbe und Legende springen." },
      { nr: 4, ziel: "kr-segmente", anker: "links", versatz: [270, 10], regel: "UNIFY – Semantische Notation", titel: "Grautöne nach Größe",
        text: "Die Segmente sind von dunkel nach hell nach ihrem Umsatz abgestuft. Das Original nutzte Violett, Bordeaux, Gelb und Türkis ohne Bedeutung; im Buch sind Farben für Szenarien und Abweichungen reserviert." },
      { nr: 5, ziel: "kr-segmente", anker: "links", versatz: [130, 250], regel: "STRUCTURE – Inhalte ordnen", titel: "Beginn bei 12 Uhr, absteigend",
        text: "Das größte Segment beginnt bei 12 Uhr, die übrigen folgen im Uhrzeigersinn nach Größe – wie im Original. So ist die Rangfolge auch ohne Zahlen erkennbar." },
      { nr: 6, ziel: "kr-segmente", anker: "links", versatz: [420, 250], regel: "CHECK – Visuelle Integrität", titel: "Nur wenige Segmente",
        text: "Ein Kreis zeigt Anteile an einem Ganzen und funktioniert nur mit wenigen Segmenten; Winkel lassen sich schlecht vergleichen. Genaue Werte zeigen Beschriftung, Tooltip und „Werte als Tabelle“, für Vergleiche über Jahre ist ein Balken- oder Säulendiagramm besser." },
      { nr: 7, ziel: "filter", anker: "links", versatz: [150, -2], regel: "CONDENSE – Filtern und hervorheben", titel: "Jahr und Klick",
        text: "Der Datenschnitt wechselt das Jahr; ein Klick auf ein Segment hebt es hervor, der Tooltip nennt Vorjahr und Veränderung. Esc hebt die Auswahl auf." },
    ],
    nachbauIntro: "Seitengröße benutzerdefiniert 727 × 480 px. Schrift Arial: Beschriftungen 10,5 pt, Titel 16,5 pt. Datenmodell: Tabelle Umsatz (SGE, Jahr, Umsatz in Mio. €) wie in der CSV-Datei.",
    nachbau: [
      { id: "A", ziel: "v-kreis", versatz: [0, 0], titel: "Kreisdiagramm", visual: "Kreisdiagramm (Standardvisual)",
        felder: "Legende: SGE; Werte: Umsatz",
        format: "Farben nach Größe #3A3F44, #6E747A, #A9A9A9, #D4D4D4; Trennlinien weiß; Legende aus; Detailbeschriftungen außen: Kategorie, Datenwert, Prozentsatz des Gesamtwerts; Drehung 0°",
        hinweis: "Sortierung nach Umsatz absteigend, damit das größte Segment bei 12 Uhr beginnt." },
      { id: "B", ziel: "kr-gesamt", anker: "links", versatz: [-30, 2], titel: "Gesamtumsatz", visual: "Karte (neu) mit Referenzbeschriftung",
        felder: "Measure Umsatz = SUM(Umsatz[Umsatz]); Referenz ΔVJ = DIVIDE([Umsatz]; CALCULATE([Umsatz]; SAMEPERIODLASTYEAR(…))) − 1", format: "Ohne Hintergrund und Rahmen" },
      { id: "C", ziel: "filter", anker: "links", versatz: [64, -2], titel: "Datenschnitt", visual: "Datenschnitt",
        felder: "Jahr als Kacheln (Einzelauswahl)", format: "Ausgewählt #3A3F44 mit weißer Schrift, sonst weiß mit Rahmen #9A9A9A" },
      { id: "D", ziel: "kopf", anker: "links", versatz: [600, 1], titel: "Kernaussage", visual: "Textfeld mit dynamischem Wert",
        felder: "Text-Measure mit TOPN(2; VALUES(Umsatz[SGE]); [Umsatz]) und DIVIDE für den Anteil", format: "10,5 pt, #4D4D4D" },
    ],
    theme: DK.thema(),
    csv: { name: "kreisdiagramm_umsatz_daten.csv", text: () => {
      const k = ["SGE;Jahr;Umsatz_Mio_EUR"];
      JAHRE.forEach((y, ji) => SGE.forEach((s, i) => k.push([s, y, U[ji][i]].join(";"))));
      return k.join("\r\n"); } },
    tabellen: () => {
      const d = daten();
      const zeilen = d.teile.map(t => [t.name, zahl(t.wert), pz(t.anteil, 1), t.vj ? zahl(t.vj) : "–", t.vj ? dvj(t) : "–"]);
      zeilen.push(["Summe", zahl(d.ges), pz(1, 1), d.vjGes ? zahl(d.vjGes) : "–",
        d.vjGes ? delta((d.ges / d.vjGes - 1) * 100, 1, NBSP + "%") : "–"]);
      return [{ titel: `Umsatz ${S.jahr} nach SGE (Mio. €)`, kopf: ["SGE", "Umsatz", "Anteil", "Vorjahr", "ΔVJ"], zeilen }];
    },
  });
  zeichnen();
})();
