/* Einzelvisual „Prozentual gewichtete Stapelsäulen“ (Abb. 3.52): Umsatz Ist je Quartal nach Region als 100-%-Stapelsäulen.
   Seite 727 x 340 px = 110 x 51,4 mm. Daten: stapel.json (daten_stapel.py), Werte des Originals.
   Gleiche Daten und Gestaltung wie das Gegenstück (Abb. 3.51 absolut, Abb. 3.52 in %), damit der Unterschied der
   beiden Darstellungen sichtbar wird. Region Süd anthrazit, Region Nord grau, Namen direkt rechts neben der letzten
   Säule statt Legende. Klick auf ein Segment hebt die Region hervor. */
(() => {
  "use strict";
  const MODUS = "prozent";                              // "absolut" | "prozent"
  const { zahl, NBSP, sv, el } = DK;
  const Q = DATA.quartale, REG = DATA.regionen, IST = DATA.ist, J = DATA.jahr;
  const QLANG = ["1. Quartal", "2. Quartal", "3. Quartal", "4. Quartal"];
  const FUELL = ["#3A3F44", "#A9A9A9"], TEXT = ["#FFFFFF", "#1A1A1A"];
  const SUM = Q.map((_, i) => IST[0][i] + IST[1][i]);
  const anteil = (r, i) => IST[r][i] / SUM[i];
  const pz = (a, nk = 0) => zahl(a * 100, nk) + NBSP + "%";
  const S = { auswahl: null };
  const auswaehlen = r => { S.auswahl = S.auswahl === r ? null : r; zeichnen(); };
  addEventListener("keydown", e => { if (e.key === "Escape" && S.auswahl !== null) { S.auswahl = null; zeichnen(); } });

  DK.init({ titel: "Prozentual gewichtete Stapelsäulen", breite: 727, hoehe: 340 });
  const bVis = DK.box("v-stapel", 16, 10, 695, 322);
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

  function botschaft(b) {
    const passt = k => k.find(t => DK.tw(t) <= b) || k[k.length - 1];
    if (S.auswahl !== null) {
      const r = S.auswahl;
      return passt([`${REG[r]}: ${Q.map((q, i) => MODUS === "prozent" ? `${q} ${pz(anteil(r, i))}` : `${q} ${zahl(IST[r][i])}`).join(", ")}`]);
    }
    if (MODUS === "prozent") {
      const a0 = anteil(0, 0), a3 = anteil(0, Q.length - 1);
      return passt([`Anteil der Region Süd steigt von ${pz(a0)} im ${Q[0]} auf ${pz(a3)} im ${Q[Q.length - 1]}`]);
    }
    const s0 = summe(IST[0]), ges = summe(SUM), nMin = Math.min(...IST[1]), qMin = IST[1].indexOf(nMin);
    return passt([`Region Süd trägt ${zahl(s0)} von ${zahl(ges)} Mio. € (${pz(s0 / ges)}); Nord fällt im ${Q[qMin]} auf ${zahl(nMin)} Mio. €`,
      `Region Süd trägt ${pz(s0 / ges)} des Umsatzes`]);
  }

  function diagramm(ziel, breite, hoehe) {
    ziel.textContent = "";
    const svg = sv("svg", { width: breite, height: hoehe, role: "img", "aria-label": `${MODUS === "prozent" ? "Prozentual gewichtete" : "Normale"} Stapelsäulen: Umsatz Ist ${J} je Quartal nach Region` }, ziel);
    const namenB = Math.ceil(Math.max(...REG.map(r => DK.tw(r)))) + 16;
    const oben = MODUS === "prozent" ? 6 : 26, unten = 30, H = hoehe - oben - unten, links = 4, B = breite - links - namenB;
    const max = MODUS === "prozent" ? 1 : Math.max(...SUM);
    const wert = (r, i) => (MODUS === "prozent" ? anteil(r, i) : IST[r][i]);
    const sy = v => oben + H - v / max * H;
    const fach = B / Q.length, sb = Math.min(76, fach * 0.5);
    const gs = sv("g", { id: "st-saeulen" }, svg), gn = sv("g", { id: "st-namen" }, svg);
    Q.forEach((q, i) => {
      const cx = links + fach * (i + 0.5);
      let basis = 0;
      REG.forEach((rg, r) => {
        const v = wert(r, i), y1 = sy(basis + v), y0 = sy(basis), blass = S.auswahl !== null && S.auswahl !== r;
        const g = sv("g", { class: "dk-klick" + (blass ? " dk-blass" : ""), "data-name": rg }, gs);
        const rect = sv("rect", { x: cx - sb / 2, y: y1, width: sb, height: y0 - y1, fill: FUELL[r], stroke: "#FFFFFF", "stroke-width": 1 }, g);
        sv("text", { x: cx, y: (y0 + y1) / 2, dy: "0.35em", "text-anchor": "middle", style: `fill:${TEXT[r]};pointer-events:none` }, g,
          MODUS === "prozent" ? pz(v) : zahl(v));
        rect.addEventListener("click", () => auswaehlen(r));
        tooltip(rect, () => [`${rg} · ${QLANG[i]} ${J}`, `Umsatz Ist ${zahl(IST[r][i])} Mio. € · Anteil ${pz(anteil(r, i), 1)}`,
          `Quartal gesamt ${zahl(SUM[i])} Mio. €`, "Klick hebt die Region hervor"]);
        if (i === Q.length - 1) sv("text", { x: cx + sb / 2 + 10, y: (y0 + y1) / 2, dy: "0.35em", class: blass ? "dk-blass" : "" }, gn, rg);
        basis += v;
      });
      if (MODUS === "absolut") sv("text", { x: cx, y: sy(SUM[i]) - 8, "text-anchor": "middle", style: "font-weight:bold" }, gs, zahl(SUM[i]));
      sv("text", { x: cx, y: oben + H + 18, dy: "0.35em", "text-anchor": "middle" }, gs, q);
    });
    sv("line", { x1: links, x2: links + B, y1: oben + H + 0.5, y2: oben + H + 0.5, stroke: "#8C8C8C", "stroke-width": 1 }, gs);   // Grundlinie über den Säulen
  }

  function zeichnen() {
    const v = DK.visual(bVis, { titel: MODUS === "prozent" ? `Umsatzanteile Ist ${J} je Quartal nach Region` : `Umsatz Ist ${J} je Quartal nach Region`,
      einheit: MODUS === "prozent" ? "in % des Quartalsumsatzes" : "Mio. €", botschaft: botschaft(695) });
    diagramm(v.flaeche, v.breite, v.hoehe);
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  const REGELN = [
    { nr: 1, ziel: "v-stapel", anker: "links", versatz: [690, 26], regel: "SAY – Botschaft vermitteln", titel: "Kernaussage unter dem Titel",
      text: MODUS === "prozent" ? "Unter dem Titel steht, was die Anteile zeigen: Die Region Süd gewinnt im Jahresverlauf an Gewicht. Das Original hatte nur die Überschrift „Umsatz Ist“."
        : "Unter dem Titel steht, was die Stapel zeigen: wie viel die Region Süd beiträgt und wo die Region Nord einbricht. Das Original hatte nur die Überschrift „Umsatz Ist“." },
    { nr: 2, ziel: "st-namen", anker: "links", versatz: [118, -4], regel: "SIMPLIFY – Überflüssiges weglassen", titel: "Namen statt Legende",
      text: "Die Regionen sind rechts neben der letzten Säule benannt, auf Höhe ihres Segments; die Legende unter dem Diagramm entfällt, ebenso Achse und Gitternetz – die Werte stehen in den Segmenten." },
    { nr: 3, ziel: "st-saeulen", anker: "links", versatz: [40, 60], regel: "UNIFY – Semantische Notation", titel: "Grautöne statt Grün und Orange",
      text: "Beide Segmente sind Ist-Werte und deshalb Abstufungen derselben Farbe: Süd anthrazit, Nord grau. Grün und Orange des Originals wirkten wie Wertungen; Blaugrün und Rot stehen im Buch für günstige und ungünstige Abweichungen." },
    MODUS === "prozent"
      ? { nr: 4, ziel: "st-saeulen", anker: "links", versatz: [300, 60], regel: "CHECK – Richtige Einheit", titel: "Prozent statt Mio. €",
          text: "Die Segmente nennen ihren Anteil in %, die Einheit steht im Titel. Das Original beschriftete die Achse mit „Mio. €“ und die Segmente mit absoluten Werten, obwohl die Säulen Anteile zeigen – die Höhen passten nicht zu den Zahlen. Absolute Werte zeigt Abb. 3.51." }
      : { nr: 4, ziel: "st-saeulen", anker: "links", versatz: [300, 30], regel: "EXPRESS – Summe zeigen", titel: "Summe über der Säule",
          text: "Über jeder Säule steht die Quartalssumme, in den Segmenten der Beitrag der Region. Im Original musste man die Summe aus den Segmenten addieren. Anteile statt absoluter Werte zeigt Abb. 3.52." },
    { nr: 5, ziel: "st-saeulen", anker: "links", versatz: [415, 215], regel: "CONDENSE – Hervorheben", titel: "Klick auf eine Region",
      text: "Ein Klick auf ein Segment hebt die Region in allen Quartalen hervor; die Aussage nennt ihre Werte je Quartal. Esc hebt die Auswahl auf." },
  ];
  DK.ebenen({
    regeln: REGELN,
    nachbauIntro: "Seitengröße benutzerdefiniert 727 × 340 px. Schrift Arial: Beschriftungen 10,5 pt, Titel 12 pt. Datenmodell: Tabelle Umsatz (Jahr, Quartal, Region, Umsatz Ist) wie in der CSV-Datei.",
    nachbau: [
      { id: "A", ziel: "st-saeulen", versatz: [0, 0], titel: MODUS === "prozent" ? "100-%-Stapelsäulen" : "Stapelsäulen",
        visual: MODUS === "prozent" ? "Gestapeltes Säulendiagramm (100 %) (Standardvisual)" : "Gestapeltes Säulendiagramm (Standardvisual)",
        felder: "X-Achse: Quartal; Y-Achse: Umsatz Ist; Legende: Region", format: "Datenfarben Süd #3A3F44, Nord #A9A9A9; Datenbeschriftungen in den Segmenten" + (MODUS === "prozent" ? " als Prozentsatz des Spaltengesamtwerts" : ", Gesamtbeschriftung ein") + "; Y-Achse, Gitternetz und Legende aus",
        hinweis: "Die Namen der Regionen rechts sind Textfelder; alternativ Legende rechts oben." },
    ],
    theme: DK.thema(),
    csv: { name: "umsatz_regionen_daten.csv", text: () => ["Jahr;Quartal;Region;Umsatz_Ist_Mio_EUR",
      ...REG.flatMap((r, ri) => Q.map((q, i) => [J, q, r, IST[ri][i]].join(";")))].join("\r\n") },
    tabellen: () => [{ titel: `Umsatz Ist ${J} nach Region (Mio. € und Anteil)`, kopf: ["Quartal", ...REG.flatMap(r => [r, "Anteil"]), "Summe"],
      zeilen: Q.map((q, i) => [q, ...REG.flatMap((r, ri) => [zahl(IST[ri][i]), pz(anteil(ri, i))]), zahl(SUM[i])]) }],
  });
  zeichnen();
})();
