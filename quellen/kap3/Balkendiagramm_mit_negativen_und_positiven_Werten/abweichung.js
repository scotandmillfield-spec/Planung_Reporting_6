/* Einzelvisual „Balkendiagramm mit negativen und positiven Werten“ (Abb. 3.50): Veränderung von Absatz, Umsatz und
   EBIT der Tochtergesellschaften zum Vorjahr in %. Seite 727 x 300 px = 110 x 45,4 mm.
   Daten: abweichung.json (daten_abweichung.py), Werte des Originals. Diagrammtyp bleibt: waagerechte Balken nach
   links (negativ) und rechts (positiv) von einer Nulllinie. Statt drei gruppierter Farben je Gesellschaft drei
   Spalten je Kennzahl mit gemeinsamem Maßstab; Farbe nach Wirkung (Blaugrün Zuwachs, Rot Rückgang).
   Klick auf eine Gesellschaft hebt sie hervor. */
(() => {
  "use strict";
  const { zahl, delta, NBSP, sv, el, FARBE } = DK;
  const GES = DATA.gesellschaften, KZ = DATA.kennzahlen, W = DATA.werte, J = DATA.jahr;
  const pc = v => delta(v, 1, NBSP + "%");
  const S = { auswahl: null };
  const auswaehlen = i => { S.auswahl = S.auswahl === i ? null : i; zeichnen(); };
  addEventListener("keydown", e => { if (e.key === "Escape" && S.auswahl !== null) { S.auswahl = null; zeichnen(); } });

  DK.init({ titel: "Balkendiagramm mit negativen und positiven Werten", breite: 727, hoehe: 300 });
  const bVis = DK.box("v-abweichung", 16, 10, 695, 282);
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

  function botschaft(b) {
    const passt = k => k.find(t => DK.tw(t) <= b) || k[k.length - 1];
    if (S.auswahl !== null) {
      const g = S.auswahl;
      return passt([`${GES[g]}: ${KZ.map((k, i) => `${k} ${pc(W[g][i])}`).join(", ")}`]);
    }
    const ebit = KZ.indexOf("EBIT"), ums = KZ.indexOf("Umsatz");
    const schlecht = GES.map((g, i) => i).filter(i => W[i][ums] < 0 && W[i][ebit] < 0);
    const ebitPlus = GES.map((g, i) => i).filter(i => W[i][ebit] > 0);
    const k = [];
    if (schlecht.length === 1) {
      const i = schlecht[0];
      k.push(`${GES[i]} verliert Umsatz (${pc(W[i][ums])}) und EBIT (${pc(W[i][ebit])}) trotz Absatzplus; nur ${ebitPlus.map(j => GES[j].replace("Tochter ", "")).join(", ")} steigert das EBIT`,
        `${GES[i]} verliert Umsatz und EBIT trotz Absatzplus`);
    }
    k.push(`EBIT steigt nur bei ${ebitPlus.map(j => GES[j]).join(", ")}`);
    return passt(k);
  }

  function diagramm(ziel, breite, hoehe) {
    ziel.textContent = "";
    const svg = sv("svg", { width: breite, height: hoehe, role: "img", "aria-label": `Veränderung von Absatz, Umsatz und EBIT der Tochtergesellschaften ${J} zum Vorjahr` }, ziel);
    const lw = Math.ceil(Math.max(...GES.map(g => DK.tw(g)))) + 14, kopf = 26, gap = 12;
    const sp = (breite - lw - 2 * gap) / KZ.length, rh = (hoehe - kopf - 4) / GES.length, bh = Math.min(26, rh * 0.62);
    const pos = Math.max(0, ...W.flat()), neg = Math.max(0, ...W.flat().map(v => -v));
    const vw = Math.ceil(Math.max(...W.flat().map(v => DK.tw(pc(v))))) + 6;
    const k = (sp - 2 * vw) / (pos + neg), halb = neg * k;     // ein Maßstab für alle drei Spalten, Nulllinie je Spalte gleich weit links
    const gk = sv("g", { id: "ab-kennzahlen" }, svg), gb = sv("g", { id: "ab-balken" }, svg), gn = sv("g", { id: "ab-namen" }, svg);
    KZ.forEach((kz, j) => {
      const x0 = lw + j * (sp + gap), xm = x0 + vw + halb;
      sv("text", { x: xm, y: 10, dy: "0.35em", "text-anchor": "middle", style: "font-weight:bold" }, gk, kz);
      sv("line", { x1: xm, x2: xm, y1: kopf - 2, y2: hoehe - 2, stroke: "#3A3F44", "stroke-width": 1 }, gb);
    });
    GES.forEach((g, i) => {
      const y = kopf + i * rh, yc = y + rh / 2, blass = S.auswahl !== null && S.auswahl !== i;
      const zg = sv("g", { class: "dk-klick" + (blass ? " dk-blass" : ""), "data-name": g }, gn);
      sv("text", { x: 0, y: yc, dy: "0.35em" }, zg, g);
      KZ.forEach((kz, j) => {
        const v = W[i][j], x0 = lw + j * (sp + gap), xm = x0 + vw + halb, w = Math.abs(v) * k;
        const bg = sv("g", { class: blass ? "dk-blass" : "" }, gb);
        sv("rect", { x: v >= 0 ? xm : xm - w, y: yc - bh / 2, width: Math.max(1, w), height: bh, fill: v > 0 ? FARBE.gut : v < 0 ? FARBE.schlecht : "#8F8F8F" }, bg);
        sv("text", { x: v >= 0 ? xm + w + 5 : xm - w - 5, y: yc, dy: "0.35em", "text-anchor": v >= 0 ? "start" : "end" }, bg, pc(v));
      });
      const hit = sv("rect", { x: 0, y, width: breite, height: rh, fill: "transparent" }, zg);
      hit.addEventListener("click", () => auswaehlen(i));
      tooltip(hit, () => [g, ...KZ.map((kz, j) => `${kz}: ${pc(W[i][j])} zum Vorjahr`), "Klick hebt die Gesellschaft hervor"]);
    });
  }

  function zeichnen() {
    const v = DK.visual(bVis, { titel: `Entwicklung der Tochtergesellschaften ${J}`, einheit: "Veränderung zum Vorjahr in %", botschaft: botschaft(695) });
    diagramm(v.flaeche, v.breite, v.hoehe);
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "v-abweichung", anker: "links", versatz: [690, 26], regel: "SAY – Botschaft vermitteln", titel: "Kernaussage unter dem Titel",
        text: "Unter dem Titel steht, was die Balken zeigen: Tochter A verliert Umsatz und EBIT, obwohl sie mehr absetzt. Das Original hatte nur die Überschrift „Entwicklung Tochtergesellschaften in 2014“ und nannte die Einheit nicht." },
      { nr: 2, ziel: "ab-balken", anker: "links", versatz: [137, 26], regel: "UNIFY – Semantische Notation", titel: "Farbe nach Wirkung",
        text: "Zuwächse sind blaugrün, Rückgänge rot. Im Original war Rot die Farbe der Gesellschaft B – deren Zuwächse erschienen rot, die Rückgänge von A grün." },
      { nr: 3, ziel: "ab-kennzahlen", anker: "links", versatz: [-12, -2], regel: "STRUCTURE – Inhalte ordnen", titel: "Eine Spalte je Kennzahl",
        text: "Absatz, Umsatz und EBIT stehen in eigenen Spalten nebeneinander, die Gesellschaften in Zeilen. So liest man eine Gesellschaft von links nach rechts – vom Absatz zum Ergebnis – und vergleicht die Gesellschaften untereinander. Im Original überlagerten die Beschriftungen der Kennzahlen die Balken („EBIT“)." },
      { nr: 4, ziel: "ab-balken", anker: "links", versatz: [520, 150], regel: "CHECK – Visuelle Integrität", titel: "Ein Maßstab für alle Spalten",
        text: "Alle drei Spalten haben denselben Maßstab, die Balkenlängen sind über die Kennzahlen vergleichbar. Die Achse des Originals war falsch beschriftet („08 %“ statt 8 %)." },
      { nr: 5, ziel: "ab-balken", anker: "links", versatz: [345, 150], regel: "SIMPLIFY – Überflüssiges weglassen", titel: "Werte statt Achse",
        text: "Jeder Balken trägt seinen Wert mit Vorzeichen; Achse, Gitternetz und Farblegende entfallen. Die Nulllinie bleibt als Bezug." },
    ],
    nachbauIntro: "Seitengröße benutzerdefiniert 727 × 300 px. Schrift Arial: Beschriftungen 10,5 pt, Titel 12 pt. Datenmodell: Tabelle Entwicklung (Gesellschaft, Jahr, Kennzahl, Veränderung) wie in der CSV-Datei.",
    nachbau: [
      { id: "A", ziel: "ab-balken", versatz: [0, 0], titel: "Abweichungsbalken", visual: "Gruppiertes Balkendiagramm mit kleinen Vielfachen (Standardvisual)",
        felder: "Y-Achse: Gesellschaft; X-Achse: Veränderung; Kleine Vielfache: Kennzahl", format: "Bedingte Farbe: > 0 #00806B, < 0 #C62828; X-Achse für alle Vielfachen gleich (−6 bis +8); Datenbeschriftungen ein; Gitternetz aus" },
    ],
    theme: DK.thema(),
    csv: { name: "tochtergesellschaften_daten.csv", text: () => ["Gesellschaft;Jahr;Kennzahl;Veraenderung_VJ_Prozent",
      ...GES.flatMap((g, i) => KZ.map((kz, j) => [g, J, kz, zahl(W[i][j], 1)].join(";")))].join("\r\n") },
    tabellen: () => [{ titel: `Veränderung zum Vorjahr ${J} in %`, kopf: ["Gesellschaft", ...KZ], zeilen: GES.map((g, i) => [g, ...W[i].map(v => delta(v, 1))]) }],
  });
  zeichnen();
})();
