/* Einzelvisual „Vermeidung von Verzerrungen“ (Abb. 3.53): dieselben Umsätze je Kontinent zweimal als Balken –
   a) mit abgeschnittener Achse (beginnt bei 52), b) mit Achse ab 0. Seite 727 x 320 px = 110 x 48,4 mm.
   Daten: verzerrung.json (daten_verzerrung.py), Werte des Originals. Negativbeispiel: Die Verzerrung in a) bleibt
   bewusst sichtbar, beide Teile sonst gleich gestaltet. Klick auf einen Balken hebt die Region in beiden Teilen hervor. */
(() => {
  "use strict";
  const { zahl, NBSP, sv, el, FARBE } = DK;
  const W = DATA.werte.map(([name, wert], i) => ({ i, name, wert }));
  const AV = DATA.achse_verzerrt, A0 = DATA.achse_null;
  const S = { auswahl: null };
  const auswaehlen = i => { S.auswahl = S.auswahl === i ? null : i; zeichnen(); };
  addEventListener("keydown", e => { if (e.key === "Escape" && S.auswahl !== null) { S.auswahl = null; zeichnen(); } });

  DK.init({ titel: "Vermeidung von Verzerrungen", breite: 727, hoehe: 320 });
  const bA = DK.box("v-verzerrt", 16, 10, 338, 302);
  const bB = DK.box("v-null", 373, 10, 338, 302);
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
  const maxW = W.reduce((a, b) => (b.wert > a.wert ? b : a)), minW = W.reduce((a, b) => (b.wert < a.wert ? b : a));

  function balken(ziel, breite, hoehe, achse, id) {
    ziel.textContent = "";
    const [a0, a1, schritt] = achse;
    const svg = sv("svg", { width: breite, height: hoehe, role: "img", "aria-label": `Umsatz je Region, Achse von ${a0} bis ${a1}` }, ziel);
    const lw = Math.ceil(Math.max(...W.map(w => DK.tw(w.name)))) + 10, oben = 22, rechts = 14;
    const pw = breite - lw - rechts, rh = (hoehe - oben) / W.length, bh = Math.min(20, rh * 0.6);
    const sx = v => lw + (v - a0) / (a1 - a0) * pw;
    const g = sv("g", { id }, svg);
    for (let t = a0; t <= a1 + 1e-9; t += schritt) {
      sv("text", { x: sx(t), y: 8, dy: "0.35em", "text-anchor": "middle", class: "muted" }, g, zahl(t));
      sv("line", { x1: sx(t), x2: sx(t), y1: oben - 4, y2: oben, stroke: "#8C8C8C", "stroke-width": 1 }, g);
    }
    sv("line", { x1: lw, x2: lw + pw, y1: oben, y2: oben, stroke: "#8C8C8C", "stroke-width": 1 }, g);
    sv("line", { x1: lw, x2: lw, y1: oben, y2: hoehe, stroke: a0 === 0 ? "#3A3F44" : "#C62828", "stroke-width": a0 === 0 ? 1 : 2,
      ...(a0 === 0 ? {} : { "stroke-dasharray": "4 3" }) }, g);
    W.forEach((w, k) => {
      const y = oben + k * rh + rh / 2, blass = S.auswahl !== null && S.auswahl !== w.i;
      const gz = sv("g", { class: "dk-klick" + (blass ? " dk-blass" : ""), "data-name": w.name }, g);
      sv("text", { x: lw - 8, y, dy: "0.35em", "text-anchor": "end" }, gz, w.name);
      sv("rect", { x: lw, y: y - bh / 2, width: sx(w.wert) - lw, height: bh, fill: FARBE.ist }, gz);
      sv("text", { x: sx(w.wert) + 5, y, dy: "0.35em" }, gz, zahl(w.wert, 1));
      const hit = sv("rect", { x: 0, y: y - rh / 2, width: breite, height: rh, fill: "transparent" }, gz);
      hit.addEventListener("click", () => auswaehlen(w.i));
      tooltip(hit, () => [w.name, `Umsatz ${zahl(w.wert, 1)} Mio. €`,
        `Balkenlänge hier: ${zahl((w.wert - a0) / (a1 - a0) * 100, 0)} % der Skala`, "Klick hebt die Region in beiden Diagrammen hervor"]);
    });
  }

  function zeichnen() {
    const fV = (maxW.wert - AV[0]) / (minW.wert - AV[0]), fE = maxW.wert / minW.wert;
    let v = DK.visual(bA, { titel: "a) Achse ab 52", einheit: "Umsatz in Mio. €",
      botschaft: `${maxW.name} wirkt ${zahl(fV, 1)}-mal so groß wie ${minW.name}` });
    balken(v.flaeche, v.breite, v.hoehe, AV, "vz-verzerrt");
    v = DK.visual(bB, { titel: "b) Achse ab 0", einheit: "Umsatz in Mio. €",
      botschaft: `Tatsächlich nur ${zahl((fE - 1) * 100, 0)} % mehr als ${minW.name}` });
    balken(v.flaeche, v.breite, v.hoehe, A0, "vz-null");
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "vz-verzerrt", anker: "links", versatz: [255, 228], regel: "CHECK – Visuelle Integrität", titel: "Abgeschnittene Achse verzerrt",
        text: "Beginnt die Achse bei 52 statt bei 0, zeigen die Balken nur den Teil über 52 Mio. €. Asien wirkt dann mehr als doppelt so groß wie Ozeanien, obwohl der Umsatz nur um 8 % höher ist. Die rot gestrichelte Achse markiert den Abbruch – ein Warnzeichen, das im Original fehlte." },
      { nr: 2, ziel: "vz-null", anker: "links", versatz: [325, 228], regel: "CHECK – Visuelle Integrität", titel: "Balken beginnen bei 0",
        text: "Balken und Säulen vergleichen Längen; sie müssen deshalb bei 0 beginnen. Dann sind die Längen proportional zu den Werten. Sollen kleine Unterschiede sichtbar werden, zeigt man besser die Abweichungen selbst, etwa als Abweichungsbalken (Abb. 3.50)." },
      { nr: 3, ziel: "v-verzerrt", anker: "links", versatz: [320, 26], regel: "SAY – Botschaft vermitteln", titel: "Aussage benennt die Täuschung",
        text: "Die Aussagen unter den Titeln stellen gegenüber, was die beiden Darstellungen vermitteln: links den falschen Eindruck, rechts das tatsächliche Verhältnis." },
      { nr: 4, ziel: "vz-null", anker: "links", versatz: [312, -25], regel: "UNIFY – Semantische Notation", titel: "Gleiche Gestaltung in beiden Teilen",
        text: "Beide Teile sind bis auf die Achse gleich gestaltet: Ist-Werte anthrazit, Werte am Balken. So liegt der Unterschied allein in der Skala. Das Original zeigte blaue Balken in Rahmen." },
    ],
    nachbauIntro: "Seitengröße benutzerdefiniert 727 × 320 px. Schrift Arial: Beschriftungen 10,5 pt, Titel 12 pt. Datenmodell: Tabelle Umsatz (Region, Umsatz) wie in der CSV-Datei.",
    nachbau: [
      { id: "A", ziel: "v-null", versatz: [0, 0], titel: "Balken ab 0", visual: "Gruppiertes Balkendiagramm (Standardvisual)",
        felder: "Y-Achse: Region; X-Achse: Umsatz", format: "X-Achse Start 0 (Power BI setzt bei Balken standardmäßig 0; „Start“ nicht überschreiben); Datenfarbe #3A3F44; Datenbeschriftungen ein",
        hinweis: "Die verzerrte Fassung a) entsteht, wenn man unter X-Achse › Bereich › Minimum einen Wert wie 52 einträgt – genau das vermeiden." },
    ],
    theme: DK.thema(),
    csv: { name: "umsatz_kontinente_daten.csv", text: () => ["Region;Umsatz_Mio_EUR", ...W.map(w => `${w.name};${zahl(w.wert, 1)}`)].join("\r\n") },
    tabellen: () => [{ titel: "Umsatz je Region (Mio. €)", kopf: ["Region", "Umsatz", "Balken a) in % der Skala", "Balken b) in % der Skala"],
      zeilen: W.map(w => [w.name, zahl(w.wert, 1), zahl((w.wert - AV[0]) / (AV[1] - AV[0]) * 100, 0), zahl(w.wert / A0[1] * 100, 0)]) }],
  });
  zeichnen();
})();
