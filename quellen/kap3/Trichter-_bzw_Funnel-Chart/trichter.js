/* Einzelvisual „Trichter- bzw. Funnel-Chart“ (Abb. 3.58): sieben Stufen der Kundengewinnung von der Website bis
   zum Folgekauf. Seite 727 x 370 px = 110 x 56 mm. Daten: trichter.json (daten_trichter.py), Werte des Originals.
   Diagrammtyp bleibt: zentrierte Balken untereinander, Breite proportional zur Anzahl, hellgraue Verbinder zeigen den
   Schwund zwischen den Stufen. Rechts Anzahl und Konversionsraten (zur Vorstufe, vom Start). Klick hebt eine Stufe hervor. */
(() => {
  "use strict";
  const { zahl, NBSP, sv, el } = DK;
  const ST = DATA.stufen.map(([name, n], i) => ({ i, name, n }));
  const START = ST[0].n;
  const pr = (a, b, nk = 1) => zahl(a / b * 100, nk) + NBSP + "%";
  const S = { auswahl: null };
  const auswaehlen = i => { S.auswahl = S.auswahl === i ? null : i; zeichnen(); };
  addEventListener("keydown", e => { if (e.key === "Escape" && S.auswahl !== null) { S.auswahl = null; zeichnen(); } });

  DK.init({ titel: "Trichterdiagramm", breite: 727, hoehe: 370 });
  const bVis = DK.box("v-trichter", 16, 10, 695, 352);
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
  const quote = s => (s.i ? s.n / ST[s.i - 1].n : null);
  // Stufe mit dem größten relativen Verlust zur Vorstufe
  const engpass = ST.slice(1).reduce((a, s) => (quote(s) < quote(a) ? s : a));
  const kauf = ST.find(s => s.name === "Käufe");

  function botschaft(b) {
    const passt = k => k.find(t => DK.tw(t) <= b) || k[k.length - 1];
    if (S.auswahl !== null) {
      const s = ST[S.auswahl];
      if (!s.i) return passt([`${s.name}: ${zahl(s.n)} – Ausgangsgröße des Trichters (100${NBSP}%)`]);
      const v = ST[s.i - 1];
      return passt([`${s.name}: ${zahl(s.n)}, das sind ${pr(s.n, v.n)} der Stufe „${v.name}“ und ${pr(s.n, START)} der Website-Besuche`,
        `${s.name}: ${zahl(s.n)} (${pr(s.n, v.n)} der Vorstufe, ${pr(s.n, START)} vom Start)`]);
    }
    return passt([`Von ${zahl(START)} Besuchen führen ${zahl(kauf.n)} zum Kauf (${pr(kauf.n, START)}); größter Schwund vor „${engpass.name}“ (${DK.delta(-(1 - quote(engpass)) * 100, 0, NBSP + "%")})`,
      `Von ${zahl(START)} Besuchen führen ${zahl(kauf.n)} zum Kauf (${pr(kauf.n, START)})`]);
  }

  function trichter(ziel, breite, hoehe) {
    ziel.textContent = "";
    const svg = sv("svg", { width: breite, height: hoehe, role: "img", "aria-label": "Trichterdiagramm: sieben Stufen von 300 Website-Besuchen bis 18 Folgekäufen" }, ziel);
    const kopf = 24, rh = (hoehe - kopf) / ST.length, bh = Math.round(rh * 0.64);
    const lw = Math.ceil(Math.max(...ST.map(s => DK.tw(s.name)))) + 14;
    const spalten = [["Anzahl", 62], ["zur Vorstufe", 104], ["vom Start", 86]];
    const rw = spalten.reduce((s, x) => s + x[1], 0) + 12, bw = breite - lw - rw, mx = lw + bw / 2;
    const w = s => Math.max(2, s.n / START * bw);
    const yb = s => kopf + s.i * rh + (rh - bh) / 2;
    // Spaltenköpfe
    const gk = sv("g", { id: "tr-kopf" }, svg);
    let x0 = lw + bw + 12;
    spalten.forEach(([t, b]) => { sv("text", { x: x0 + b, y: 9, dy: "0.35em", "text-anchor": "end", class: "muted" }, gk, t); x0 += b; });
    sv("line", { x1: lw + bw + 12, x2: breite, y1: kopf - 4.5, y2: kopf - 4.5, stroke: "#3A3F44", "stroke-width": 1 }, gk);
    // Verbinder zwischen den Stufen (Schwund)
    const gv = sv("g", { id: "tr-verbinder" }, svg);
    ST.slice(1).forEach(s => {
      const v = ST[s.i - 1], y1 = yb(v) + bh, y2 = yb(s);
      sv("polygon", { points: `${mx - w(v) / 2},${y1} ${mx + w(v) / 2},${y1} ${mx + w(s) / 2},${y2} ${mx - w(s) / 2},${y2}`, fill: "#EFEFEF" }, gv);
    });
    const gb = sv("g", { id: "tr-balken" }, svg), gw = sv("g", { id: "tr-werte" }, svg);
    ST.forEach(s => {
      const y = yb(s), yc = y + bh / 2, blass = S.auswahl !== null && S.auswahl !== s.i;
      const g = sv("g", { class: "dk-klick" + (blass ? " dk-blass" : ""), "data-name": s.name }, gb);
      sv("text", { x: lw - 12, y: yc, dy: "0.35em", "text-anchor": "end" }, g, s.name);
      sv("rect", { x: mx - w(s) / 2, y, width: w(s), height: bh, fill: "#3A3F44" }, g);
      const gz = sv("g", { class: blass ? "dk-blass" : "" }, gw);
      let x = lw + bw + 12;
      const werte = [zahl(s.n), s.i ? pr(s.n, ST[s.i - 1].n) : "–", pr(s.n, START)];
      werte.forEach((t, k) => { x += spalten[k][1]; sv("text", { x, y: yc, dy: "0.35em", "text-anchor": "end", style: k ? "" : "font-weight:bold" }, gz, t); });
      const hit = sv("rect", { x: 0, y: kopf + s.i * rh, width: breite, height: rh, fill: "transparent" }, g);
      hit.addEventListener("click", () => auswaehlen(s.i));
      tooltip(hit, () => {
        const z = [`${s.i + 1}. Stufe: ${s.name}`, `Anzahl ${zahl(s.n)}`];
        if (s.i) {
          const v = ST[s.i - 1];
          z.push(`zur Vorstufe „${v.name}“: ${pr(s.n, v.n)} (Schwund ${zahl(v.n - s.n)})`, `vom Start (Website-Besuche): ${pr(s.n, START)}`);
        } else z.push("Ausgangsgröße des Trichters (100 %)");
        z.push("Klick hebt die Stufe hervor");
        return z;
      });
    });
  }

  function zeichnen() {
    const v = DK.visual(bVis, { titel: "Kundengewinnung von der Website bis zum Folgekauf", einheit: "Anzahl je Stufe", botschaft: botschaft(695) });
    trichter(v.flaeche, v.breite, v.hoehe);
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "v-trichter", anker: "links", versatz: [690, 26], regel: "SAY – Botschaft vermitteln", titel: "Kernaussage unter dem Titel",
        text: "Unter dem Titel steht, wie viele Besuche am Ende zum Kauf führen und wo der Trichter am stärksten schrumpft. Das Original hatte weder Titel noch Aussage." },
      { nr: 2, ziel: "tr-balken", anker: "links", versatz: [300, 4], regel: "CHECK – Visuelle Integrität", titel: "Breite proportional zur Anzahl",
        text: "Jede Stufe ist ein zentrierter Balken, dessen Breite der Anzahl entspricht; alle Stufen sind gleich hoch. Im Original bestimmte die Höhe der Segmente den Wert, die Breite folgte nur der Trichterform – ab „Requested prices“ waren alle Stufen gleich breit, obwohl die Werte von 98 auf 18 fallen." },
      { nr: 3, ziel: "tr-balken", anker: "links", versatz: [300, 150], regel: "UNIFY – Semantische Notation", titel: "Eine Farbe statt sieben",
        text: "Alle Stufen sind anthrazit wie Ist-Werte im ganzen Buch. Das Original färbte jede Stufe anders (Blau, Gelb, Grün, Rot, Rosa, Dunkelblau, Grün), ohne dass die Farben etwas bedeuteten." },
      { nr: 4, ziel: "tr-kopf", anker: "links", versatz: [0, 0], regel: "EXPRESS – Verhältnisse zeigen", titel: "Konversionsraten als Zahlen",
        text: "Rechts stehen Anzahl, Anteil zur Vorstufe und Anteil vom Start. Erst die Quote zur Vorstufe zeigt, wo Interessenten verloren gehen; im Original standen nur die absoluten Werte an Hinweislinien." },
      { nr: 5, ziel: "tr-verbinder", anker: "links", versatz: [130, 40], regel: "SIMPLIFY – Direkt beschriften", titel: "Namen links, Schwund grau",
        text: "Die Stufennamen stehen links neben den Balken; die Hinweislinien des Originals entfallen. Hellgraue Verbinder zwischen den Balken machen den Schwund sichtbar, ohne mit den Werten zu konkurrieren." },
      { nr: 6, ziel: "tr-balken", anker: "links", versatz: [52, 173], regel: "STRUCTURE – Prozessfolge", titel: "Reihenfolge der Stufen",
        text: "Die Stufen stehen in der Reihenfolge des Prozesses, nicht nach Größe. Ein Trichter setzt voraus, dass jede Stufe eine Teilmenge der vorherigen ist; „Supportanfragen“ gehört streng genommen nicht in diese Kette, sondern betrifft nur die Käufer." },
      { nr: 7, ziel: "tr-balken", anker: "links", versatz: [34, 250], regel: "CHECK – Grenzen des Typs", titel: "Zentrierte Balken vergleichen schlecht",
        text: "Zentrierte Balken haben keine gemeinsame Grundlinie; kleine Unterschiede (Supportanfragen 25, Folgekäufe 18) sind kaum zu erkennen. Für genaue Vergleiche eignet sich ein linksbündiges Balkendiagramm mit der Konversionsrate als zweiter Spalte besser. Der Trichter bleibt sinnvoll, wenn die Prozessform selbst die Botschaft ist." },
      { nr: 8, ziel: "tr-werte", anker: "links", versatz: [95, 0], regel: "CONDENSE – Hervorheben", titel: "Klick auf eine Stufe",
        text: "Ein Klick auf eine Stufe hebt sie hervor; die Aussage nennt Anzahl und beide Quoten. Der Tooltip zeigt zusätzlich den Schwund zur Vorstufe. Esc hebt die Auswahl auf." },
    ],
    nachbauIntro: "Seitengröße benutzerdefiniert 727 × 370 px. Schrift Arial: Beschriftungen 10,5 pt, Titel 12 pt. Datenmodell: Tabelle Trichter (Stufe_Nr, Stufe, Anzahl) wie in der CSV-Datei; Stufe nach Stufe_Nr sortieren („Nach Spalte sortieren“).",
    nachbau: [
      { id: "A", ziel: "tr-balken", anker: "links", versatz: [300, 4], titel: "Trichter", visual: "Trichterdiagramm (Standardvisual)",
        felder: "Kategorie: Stufe; Werte: Anzahl",
        format: "Farben: alle Datenpunkte #3A3F44; Datenbeschriftungen ein (Wert); Konversionsratenbeschriftung aus (sie steht in der Tabelle B); Kategoriebeschriftungen ein",
        hinweis: "Das Standardvisual zeigt die Quote „Prozentsatz vom ersten“ und „vom vorherigen“ automatisch im Tooltip. Hellgraue Verbinder zwischen den Stufen bietet es nicht." },
      { id: "B", ziel: "tr-kopf", anker: "links", versatz: [0, 0], titel: "Konversionsraten", visual: "Tabelle rechts neben dem Trichter",
        felder: "Stufe (ausgeblendet über Spaltenbreite 0), Anzahl; Measures „zur Vorstufe“ = DIVIDE([Anzahl]; CALCULATE([Anzahl]; Trichter[Stufe_Nr] = MAX(Trichter[Stufe_Nr]) − 1; ALL(Trichter))), „vom Start“ = DIVIDE([Anzahl]; CALCULATE([Anzahl]; Trichter[Stufe_Nr] = 1; ALL(Trichter)))",
        format: "Prozent mit einer Dezimalstelle; Zeilenhöhe an die Stufen des Trichters angleichen; keine Gitternetzlinien" },
    ],
    theme: DK.thema(),
    csv: { name: "trichter_daten.csv", text: () => ["Stufe_Nr;Stufe;Anzahl", ...ST.map(s => `${s.i + 1};${s.name};${s.n}`)].join("\r\n") },
    tabellen: () => [{ titel: "Kundengewinnung je Stufe (Anzahl)", kopf: ["Stufe", "Anzahl", "zur Vorstufe", "vom Start"],
      zeilen: ST.map(s => [s.name, zahl(s.n), s.i ? pr(s.n, ST[s.i - 1].n) : "–", pr(s.n, START)]) }],
  });
  zeichnen();
})();
