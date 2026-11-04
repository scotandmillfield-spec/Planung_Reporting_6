/* Einzelvisual „Normales Kurven- bzw. Liniendiagramm“ (Abb. 3.59): Umsatz der SGE A je Quartal, Plan und Ist als Linien.
   Seite 727 x 360 px = 110 x 54,5 mm. Daten: linie.json (daten_linie.py), Werte des Originals (wie Abb. 3.48).
   Diagrammtyp bleibt: zwei Linien über die Quartale. Notation wie in den übrigen Abbildungen: Ist kräftig mit gefüllten
   Punkten, Plan dünn mit hohlen Punkten; Linien am Ende direkt beschriftet, darunter die Abweichung Ist − Plan nach
   Wirkung. Klick auf ein Quartal hebt es hervor. */
(() => {
  "use strict";
  const { zahl, delta, NBSP, sv, el, FARBE } = DK;
  const Q = DATA.quartale, PL = DATA.plan, IST = DATA.ist, J = DATA.jahr, SGE = DATA.sge;
  const QLANG = ["1. Quartal", "2. Quartal", "3. Quartal", "4. Quartal"];
  const S = { auswahl: null };
  const auswaehlen = i => { S.auswahl = S.auswahl === i ? null : i; zeichnen(); };
  addEventListener("keydown", e => { if (e.key === "Escape" && S.auswahl !== null) { S.auswahl = null; zeichnen(); } });

  DK.init({ titel: "Liniendiagramm", breite: 727, hoehe: 360 });
  const bVis = DK.box("v-linie", 16, 10, 695, 342);
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
  const pz = (d, b) => delta(d / b * 100, 1, NBSP + "%");

  function botschaft(b) {
    const passt = k => k.find(t => DK.tw(t) <= b) || k[k.length - 1];
    if (S.auswahl !== null) {
      const i = S.auswahl, d = dpl(i);
      return passt([`${QLANG[i]}: Ist ${zahl(IST[i])} bei Plan ${zahl(PL[i])} Mio. €, ΔPL ${delta(d, 0)} (${pz(d, PL[i])})`]);
    }
    const idx = Q.map((q, i) => i), ueber = idx.filter(i => dpl(i) > 0), unter = idx.filter(i => dpl(i) < 0);
    const ds = summe(IST) - summe(PL);
    const liste = is => (is.length > 2 && is[is.length - 1] - is[0] === is.length - 1 ? `${Q[is[0]]} bis ${Q[is[is.length - 1]]}` : is.map(i => Q[i]).join(", "));
    const teil = unter.length ? `${liste(unter)} ${zahl(Math.abs(summe(unter.map(dpl))))} Mio. € darunter` : "kein Quartal unter Plan";
    const jahr = `Jahr ${delta(ds, 0)} Mio. € (${pz(ds, summe(PL))})`;
    return passt([ueber.length ? `Ist liegt in ${liste(ueber)} über Plan, ${teil}; ${jahr}` : `${teil}; ${jahr}`, `${teil}; ${jahr}`]);
  }

  function linien(ziel, breite, hoehe) {
    ziel.textContent = "";
    const svg = sv("svg", { width: breite, height: hoehe, role: "img", "aria-label": `Liniendiagramm: Umsatz ${SGE} ${J} je Quartal, Plan und Ist` }, ziel);
    const oben = 26, unten = 64, links = 60, rechts = 58, H = hoehe - oben - unten, B = breite - links - rechts;
    const max = Math.max(...PL, ...IST), sy = v => oben + H - v / max * H;
    const fach = B / Q.length, cx = i => links + fach * (i + 0.5);
    const gl = sv("g", { id: "li-linien" }, svg), gq = sv("g", { id: "li-quartale" }, svg), gd = sv("g", { id: "li-abweichung" }, svg);
    // Nulllinie (Skala ab 0)
    sv("line", { x1: links, x2: links + B, y1: oben + H + 0.5, y2: oben + H + 0.5, stroke: "#8C8C8C", "stroke-width": 1 }, gl);
    // Linien: Plan dünn, Ist kräftig
    const pfad = w => w.map((v, i) => `${i ? "L" : "M"}${cx(i).toFixed(1)},${sy(v).toFixed(1)}`).join(" ");
    sv("path", { id: "li-plan", d: pfad(PL), fill: "none", stroke: "#3A3F44", "stroke-width": 1.5 }, gl);
    sv("path", { id: "li-ist", d: pfad(IST), fill: "none", stroke: "#3A3F44", "stroke-width": 3, "stroke-linejoin": "round" }, gl);
    // Reihenbeschriftung am Linienende statt Legende
    const gr = sv("g", { id: "li-reihen" }, svg);
    const xe = cx(Q.length - 1) + 12, n = Q.length - 1;
    sv("text", { x: xe, y: sy(IST[n]), dy: "0.35em", style: "font-weight:bold" }, gr, "Ist");
    sv("text", { x: xe, y: sy(PL[n]), dy: "0.35em", class: "muted" }, gr, "Plan");
    sv("text", { x: 0, y: oben + H + 52, dy: "0.35em", class: "muted" }, gd, "ΔPL");
    Q.forEach((q, i) => {
      const x = cx(i), blass = S.auswahl !== null && S.auswahl !== i, istOben = IST[i] >= PL[i];
      const g = sv("g", { class: "dk-klick" + (blass ? " dk-blass" : ""), "data-name": q }, gq);
      sv("circle", { cx: x, cy: sy(PL[i]), r: 4.5, fill: "#FFFFFF", stroke: "#3A3F44", "stroke-width": 1.5 }, g);
      sv("circle", { cx: x, cy: sy(IST[i]), r: 5, fill: "#3A3F44" }, g);
      // Ist-Wert fett auf der Außenseite, Planwert normal auf der anderen Seite
      sv("text", { x, y: istOben ? sy(IST[i]) - 13 : sy(IST[i]) + 15, dy: istOben ? "0" : "0.7em", "text-anchor": "middle", style: "font-weight:bold" }, g, zahl(IST[i]));
      sv("text", { x, y: istOben ? sy(PL[i]) + 15 : sy(PL[i]) - 13, dy: istOben ? "0.7em" : "0", "text-anchor": "middle", class: "muted" }, g, zahl(PL[i]));
      sv("text", { x, y: oben + H + 18, dy: "0.35em", "text-anchor": "middle" }, g, q);
      const d = dpl(i);
      sv("text", { x, y: oben + H + 52, dy: "0.35em", "text-anchor": "middle", style: `font-weight:bold;fill:${FARBE[klasse(d)]}` }, g, delta(d, 0));
      const hit = sv("rect", { x: x - fach / 2, y: 0, width: fach, height: hoehe, fill: "transparent" }, g);
      hit.addEventListener("click", () => auswaehlen(i));
      tooltip(hit, () => [`${QLANG[i]} ${J}`, `Ist ${zahl(IST[i])} Mio. € · Plan ${zahl(PL[i])} Mio. €`,
        `ΔPL ${delta(d, 0)} Mio. € (${pz(d, PL[i])})`,
        i > 0 ? `Ist zum Vorquartal ${delta(IST[i] - IST[i - 1], 0)} Mio. €` : "Erstes Quartal des Jahres", "Klick hebt das Quartal hervor"]);
    });
  }

  function zeichnen() {
    const v = DK.visual(bVis, { titel: `Umsatz ${SGE} ${J} je Quartal`, einheit: "Mio. €", botschaft: botschaft(695) });
    linien(v.flaeche, v.breite, v.hoehe);
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "v-linie", anker: "links", versatz: [690, 26], regel: "SAY – Botschaft vermitteln", titel: "Kernaussage unter dem Titel",
        text: "Unter dem Titel steht, was der Verlauf zeigt: Ist über Plan in den ersten drei Quartalen, im vierten darunter, im Jahr insgesamt über Plan. Das Original hatte nur die Überschrift „Umsatz SGE A“." },
      { nr: 2, ziel: "li-ist", anker: "links", versatz: [120, -30], regel: "UNIFY – Semantische Notation", titel: "Ist kräftig, Plan dünn und hohl",
        text: "Ist ist eine kräftige anthrazitfarbene Linie mit gefüllten Punkten, Plan eine dünne Linie mit hohlen Punkten – dieselbe Unterscheidung „gefüllt/hohl“ wie bei den Säulen in Abb. 3.48. Das Original unterschied die Reihen durch Magenta und Dunkelblau mit Quadraten und Rauten." },
      { nr: 3, ziel: "li-reihen", anker: "links", versatz: [70, 0], regel: "SIMPLIFY – Direkt beschriften", titel: "Beschriftung am Linienende",
        text: "„Ist“ und „Plan“ stehen direkt am Ende der Linien. Die Legende unter dem Diagramm, Größenachse und Gitternetz entfallen; die Werte stehen an den Punkten – Ist fett auf der Außenseite, Plan normal auf der anderen Seite, sodass sich nichts überlagert." },
      { nr: 4, ziel: "li-abweichung", anker: "links", versatz: [70, 0], regel: "EXPRESS – Abweichung zeigen", titel: "Abweichung farbig nach Wirkung",
        text: "Unter jedem Quartal steht die Abweichung Ist − Plan, blaugrün bei Mehrumsatz, rot bei Minderumsatz. Im Original musste man die Differenz aus den Punktbeschriftungen selbst ausrechnen." },
      { nr: 5, ziel: "li-linien", anker: "links", versatz: [100, 186], regel: "CHECK – Visuelle Integrität", titel: "Skala ab null",
        text: "Wie im Original beginnt die Skala bei null. Linien dürfen grundsätzlich auch mit abgeschnittener Achse gezeichnet werden, weil sie Verläufe und keine Längen vergleichen; ein enger Ausschnitt lässt kleine Schwankungen aber dramatisch wirken (vgl. Abb. 3.53 und 3.60)." },
      { nr: 6, ziel: "li-quartale", anker: "links", versatz: [40, 180], regel: "STRUCTURE – Passenden Typ wählen", titel: "Linie oder Säule?",
        text: "Linien betonen den Verlauf über die Zeit und eignen sich besonders für viele Zeitpunkte (Monate, Wochen) oder mehrere Reihen. Bei nur vier Quartalen und einem Plan-Ist-Vergleich sind Säulen mit versetzter Plansäule (Abb. 3.48) gleichwertig; die Verbindungslinie zwischen Q3 und Q4 suggeriert sonst einen gleichmäßigen Übergang, den es nicht gibt." },
      { nr: 7, ziel: "li-quartale", anker: "links", versatz: [560, 180], regel: "CONDENSE – Hervorheben", titel: "Klick auf ein Quartal",
        text: "Ein Klick auf ein Quartal hebt es hervor; die Aussage nennt Ist, Plan und Abweichung absolut und relativ, der Tooltip zusätzlich die Veränderung zum Vorquartal. Esc hebt die Auswahl auf." },
    ],
    nachbauIntro: "Seitengröße benutzerdefiniert 727 × 360 px. Schrift Arial: Beschriftungen 10,5 pt, Titel 12 pt. Datenmodell: Tabelle Umsatz (SGE, Jahr, Quartal, Plan, Ist) wie in der CSV-Datei.",
    nachbau: [
      { id: "A", ziel: "li-linien", versatz: [0, 0], titel: "Linien Plan und Ist", visual: "Liniendiagramm (Standardvisual)",
        felder: "X-Achse: Quartal; Y-Achse: Ist, Plan (Measures SUM(Umsatz[Ist]), SUM(Umsatz[Plan]))",
        format: "Linien › Ist: Farbe #3A3F44, Breite 3 px; Plan: Farbe #3A3F44, Breite 1,5 px. Markierungen ein, Form Kreis; Ist gefüllt, Plan Füllung #FFFFFF mit Rahmen #3A3F44. Datenbeschriftungen ein (Ist fett); Reihenbeschriftungen ein, Legende aus; Y-Achse aus, Bereich Start 0; Gitternetz aus",
        hinweis: "Die Lage der Datenbeschriftung (oben/unten) lässt sich je Reihe einstellen, aber nicht je Punkt; im Standardvisual die Planwerte ggf. nur im Tooltip zeigen." },
      { id: "B", ziel: "li-abweichung", anker: "links", versatz: [70, 0], titel: "Abweichung", visual: "Tabelle oder Matrix unter dem Diagramm",
        felder: "Measure ΔPL = SUM(Umsatz[Ist]) − SUM(Umsatz[Plan]); Spalten: Quartal",
        format: "Bedingte Schriftfarbe: > 0 #00806B, < 0 #C62828; Spaltenbreiten an die Quartale des Liniendiagramms angleichen" },
    ],
    theme: DK.thema(),
    csv: { name: "liniendiagramm_daten.csv", text: () => ["SGE;Jahr;Quartal;Plan_Mio_EUR;Ist_Mio_EUR",
      ...Q.map((q, i) => [SGE, J, q, PL[i], IST[i]].join(";"))].join("\r\n") },
    tabellen: () => [{ titel: `Umsatz ${SGE} ${J} (Mio. €)`, kopf: ["Quartal", "Plan", "Ist", "ΔPL", "ΔPL in %"],
      zeilen: [...Q.map((q, i) => [q, zahl(PL[i]), zahl(IST[i]), delta(dpl(i), 0), delta(dpl(i) / PL[i] * 100, 1)]),
        ["Jahr", zahl(summe(PL)), zahl(summe(IST)), delta(summe(IST) - summe(PL), 0), delta((summe(IST) / summe(PL) - 1) * 100, 1)]] }],
  });
  zeichnen();
})();
