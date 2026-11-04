/* Einzelvisual „Tachos und Thermometer“ (Abb. 3.65): drei Kennzahlen als Tacho, Ring und Thermometer.
   Seite 727 x 330 px = 110 x 49,9 mm. Daten: instrumente.json (daten_instrumente.py) – Werte des Originals
   (5.348, 85 %, 51 %), Kennzahl, Einheit, Skala, Ziel und Bereiche ergänzt.
   Diagrammtypen bleiben. Im Buchstil: Bewertungsbereiche als Grautöne wie im Bullet-Chart (Abb. 3.54) statt
   Farbverläufen, Ist anthrazit, Ziel als schwarze Marke, darunter Ziel und Abweichung farbig nach Wirkung.
   Klick auf ein Instrument hebt es hervor. */
(() => {
  "use strict";
  const { zahl, delta, NBSP, sv, el, FARBE } = DK;
  const STAND = DATA.stand;
  const BEREICH = ["schlecht", "befriedigend", "gut"], GRAU = ["#BDBDBD", "#D9D9D9", "#EFEFEF"];
  const I = DATA.instrumente.map(([typ, name, zeitraum, einheit, max, grenzen, ist, ziel, richtung, nk], i) =>
    ({ i, typ, name, zeitraum, einheit, max, grenzen, ist, ziel, richtung, nk, d: ist - ziel }));
  const TYPNAME = { tacho: "Tacho", ring: "Ring", thermometer: "Thermometer" };
  const pzt = e => (e === "%" ? NBSP + "%" : "");
  const fmt = (k, v) => zahl(v, k.nk) + pzt(k.einheit);
  const dfmt = k => delta(k.d, k.nk) + (k.einheit === "%" ? NBSP + "%-Pkt." : "");
  const wirkung = k => (k.d * k.richtung > 0 ? "gut" : k.d * k.richtung < 0 ? "schlecht" : "neutral");
  const zieltext = k => `Ziel ${k.richtung < 0 ? "≤ " : ""}${fmt(k, k.ziel)}`;
  function bereich(k) {
    if (!k.grenzen) return null;
    const [a, b] = k.grenzen;
    return k.richtung > 0 ? (k.ist < a ? 0 : k.ist < b ? 1 : 2) : (k.ist <= a ? 2 : k.ist <= b ? 1 : 0);
  }
  // Bänder [von, bis, Bereichsindex] in Wertrichtung
  const baender = k => {
    const [a, b] = k.grenzen;
    return k.richtung > 0 ? [[0, a, 0], [a, b, 1], [b, k.max, 2]] : [[0, a, 2], [a, b, 1], [b, k.max, 0]];
  };

  const S = { auswahl: null };
  const auswaehlen = i => { S.auswahl = S.auswahl === i ? null : i; zeichnen(); };
  addEventListener("keydown", e => { if (e.key === "Escape" && S.auswahl !== null) { S.auswahl = null; zeichnen(); } });

  DK.init({ titel: "Tachos und Thermometer", breite: 727, hoehe: 330 });
  const bVis = DK.box("v-instrumente", 16, 10, 695, 312);

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
      const k = I[S.auswahl], be = bereich(k);
      return passt([`${k.name}: ${fmt(k, k.ist)} bei ${zieltext(k)}, ΔZiel ${dfmt(k)}${be == null ? "" : ", Bereich " + BEREICH[be]}`,
        `${k.name}: ${fmt(k, k.ist)}, ΔZiel ${dfmt(k)}`]);
    }
    const gut = I.filter(k => wirkung(k) === "gut"), schlecht = I.filter(k => wirkung(k) === "schlecht");
    const liste = ks => ks.length > 1 ? ks.slice(0, -1).map(k => k.name).join(", ") + " und " + ks[ks.length - 1].name : ks[0].name;
    const teile = [];
    if (gut.length) teile.push(`${liste(gut)} über Ziel`);
    if (schlecht.length) teile.push(`${liste(schlecht)} ${schlecht.length > 1 ? "verfehlen" : "verfehlt"} das Ziel knapp`);
    return passt([teile.join("; "), `${gut.length} von ${I.length} Kennzahlen im Ziel`]);
  }

  /* ---------- Instrumente ---------- */
  const pol = (cx, cy, r, w) => [cx + r * Math.cos(w), cy - r * Math.sin(w)];
  function bogen(cx, cy, ri, ra, w0, w1) {      // Ringsegment von Winkel w0 nach w1 (im Uhrzeigersinn, w0 > w1)
    const [x0, y0] = pol(cx, cy, ra, w0), [x1, y1] = pol(cx, cy, ra, w1), [x2, y2] = pol(cx, cy, ri, w1), [x3, y3] = pol(cx, cy, ri, w0);
    const gross = w0 - w1 > Math.PI ? 1 : 0;
    return `M${x0},${y0} A${ra},${ra} 0 ${gross} 1 ${x1},${y1} L${x2},${y2} A${ri},${ri} 0 ${gross} 0 ${x3},${y3} Z`;
  }
  function tacho(g, k, cx, oben) {
    const R = 88, r = 62, cy = oben + R + 4, w = v => Math.PI - v / k.max * Math.PI;
    const gb = sv("g", { id: "in-tacho-baender" }, g);
    baender(k).forEach(([a, b, be]) => sv("path", { d: bogen(cx, cy, r, R, w(a), w(b)), fill: GRAU[be] }, gb));
    const [tx0, ty0] = pol(cx, cy, r - 5, w(k.ziel)), [tx1, ty1] = pol(cx, cy, R + 5, w(k.ziel));
    sv("line", { x1: tx0, y1: ty0, x2: tx1, y2: ty1, stroke: "#1A1A1A", "stroke-width": 2.5 }, g);
    const [nx, ny] = pol(cx, cy, R - 6, w(k.ist));
    sv("line", { x1: cx, y1: cy, x2: nx, y2: ny, stroke: "#3A3F44", "stroke-width": 3.5, "stroke-linecap": "round" }, g);
    sv("circle", { cx, cy, r: 6, fill: "#3A3F44" }, g);
    sv("text", { x: cx - (R + r) / 2, y: cy + 15, dy: "0.35em", "text-anchor": "middle", class: "muted" }, g, "0");
    sv("text", { x: cx + (R + r) / 2, y: cy + 15, dy: "0.35em", "text-anchor": "middle", class: "muted" }, g, zahl(k.max));
    sv("text", { x: cx, y: cy + 34, dy: "0.35em", "text-anchor": "middle", style: "font-size:26px;font-weight:bold" }, g, fmt(k, k.ist));
  }
  function ring(g, k, cx, oben) {
    const R = 64, d = 14, cy = oben + R + 4, w = v => Math.PI / 2 - v / k.max * 2 * Math.PI;
    sv("circle", { cx, cy, r: R - d / 2, fill: "none", stroke: "#EFEFEF", "stroke-width": d }, g);
    sv("path", { d: bogen(cx, cy, R - d, R, w(0), w(k.ist)), fill: "#3A3F44" }, g);
    const [tx0, ty0] = pol(cx, cy, R - d - 5, w(k.ziel)), [tx1, ty1] = pol(cx, cy, R + 5, w(k.ziel));
    sv("line", { x1: tx0, y1: ty0, x2: tx1, y2: ty1, stroke: "#1A1A1A", "stroke-width": 2.5 }, g);
    sv("text", { x: cx, y: cy, dy: "0.35em", "text-anchor": "middle", style: "font-size:26px;font-weight:bold" }, g, fmt(k, k.ist));
  }
  function thermometer(g, k, cx, oben) {
    const tb = 22, kr = 16, y0 = oben + 4, y1 = oben + 124, yk = y1 + kr - 3, sy = v => y1 - v / k.max * (y1 - y0);
    const x = cx - 14;   // Röhre etwas links der Mitte, Wert rechts daneben
    const gb = sv("g", { id: "in-thermo-baender" }, g);
    baender(k).forEach(([a, b, be]) => sv("rect", { x: x - tb / 2, y: sy(b), width: tb, height: sy(a) - sy(b), fill: GRAU[be] }, gb));
    sv("circle", { cx: x, cy: yk, r: kr, fill: GRAU[2] }, gb);
    sv("rect", { x: x - 4.5, y: sy(k.ist), width: 9, height: yk - sy(k.ist), fill: "#3A3F44" }, g);
    sv("circle", { cx: x, cy: yk, r: kr - 5, fill: "#3A3F44" }, g);
    sv("line", { x1: x - tb / 2 - 5, x2: x + tb / 2 + 5, y1: sy(k.ziel), y2: sy(k.ziel), stroke: "#1A1A1A", "stroke-width": 2.5 }, g);
    [0, 50, 100].forEach(t => {
      sv("line", { x1: x - tb / 2 - 4, x2: x - tb / 2, y1: sy(t), y2: sy(t), stroke: "#8C8C8C", "stroke-width": 1 }, g);
      sv("text", { x: x - tb / 2 - 8, y: sy(t), dy: "0.35em", "text-anchor": "end", class: "muted" }, g, String(t));
    });
    sv("text", { x: x + tb / 2 + 12, y: sy(k.ist) - 6, dy: "0.35em", style: "font-size:26px;font-weight:bold" }, g, fmt(k, k.ist));
  }

  function diagramm(ziel, breite, hoehe) {
    ziel.textContent = "";
    const svg = sv("svg", { width: breite, height: hoehe, role: "img", "aria-label": `Drei Kennzahlen ${STAND} als Tacho, Ring und Thermometer mit Ziel` }, ziel);
    // Legende wie im Bullet-Chart
    const gl = sv("g", { id: "in-legende" }, svg);
    let lx = 0;
    BEREICH.forEach((b, i) => {
      sv("rect", { x: lx, y: 2, width: 12, height: 12, fill: GRAU[i] }, gl);
      sv("text", { x: lx + 17, y: 8, dy: "0.35em", class: "muted" }, gl, b);
      lx += 17 + DK.tw(b) + 14;
    });
    sv("rect", { x: lx, y: 5, width: 18, height: 6, fill: "#3A3F44" }, gl);
    sv("text", { x: lx + 23, y: 8, dy: "0.35em", class: "muted" }, gl, "Ist");
    lx += 23 + DK.tw("Ist") + 14;
    sv("line", { x1: lx + 2, x2: lx + 2, y1: 1, y2: 15, stroke: "#1A1A1A", "stroke-width": 2.5 }, gl);
    sv("text", { x: lx + 9, y: 8, dy: "0.35em", class: "muted" }, gl, "Ziel");
    const cw = breite / I.length, top = 30, inst = top + 42, unten = hoehe - 10;
    const gi = sv("g", { id: "in-instrumente" }, svg), gz = sv("g", { id: "in-ziele" }, svg), gn = sv("g", { id: "in-namen" }, svg);
    I.forEach((k, c) => {
      const cx = cw * c + cw / 2, blass = S.auswahl !== null && S.auswahl !== k.i;
      const g = sv("g", { class: "dk-klick" + (blass ? " dk-blass" : ""), "data-name": k.name, id: "in-" + k.typ }, gi);
      const gname = sv("g", { class: blass ? "dk-blass" : "" }, gn);
      sv("text", { x: cx, y: top + 6, dy: "0.35em", "text-anchor": "middle", style: "font-weight:bold" }, gname, k.name);
      sv("text", { x: cx, y: top + 24, dy: "0.35em", "text-anchor": "middle", class: "muted" }, gname, `${k.zeitraum}, ${k.einheit}`);
      ({ tacho, ring, thermometer })[k.typ](g, k, cx, inst);
      const gzz = sv("g", { class: blass ? "dk-blass" : "" }, gz);
      const t = sv("text", { x: cx, y: unten, dy: "0.35em", "text-anchor": "middle", class: "muted" }, gzz);
      sv("tspan", {}, t, `${zieltext(k)} · ΔZiel `);
      sv("tspan", { style: `font-weight:bold;fill:${FARBE[wirkung(k)]}` }, t, dfmt(k));
      const hit = sv("rect", { x: cw * c + 4, y: top - 6, width: cw - 8, height: hoehe - top + 6, fill: "transparent" }, g);
      hit.addEventListener("click", () => auswaehlen(k.i));
      tooltip(hit, () => {
        const z = [`${k.name} (${TYPNAME[k.typ]})`, `${k.zeitraum}: Ist ${fmt(k, k.ist)} · ${zieltext(k)}`,
          `ΔZiel ${dfmt(k)} – ${wirkung(k) === "gut" ? "günstig" : wirkung(k) === "schlecht" ? "ungünstig" : "im Ziel"}${k.richtung < 0 ? " (weniger ist besser)" : ""}`];
        if (k.grenzen) {
          const [a, b] = k.grenzen, e = k.einheit === "%" ? NBSP + "%" : "";
          z.push(k.richtung > 0 ? `Bereiche: schlecht unter ${zahl(a)}${e}, befriedigend bis ${zahl(b)}${e}, gut ab ${zahl(b)}${e}`
            : `Bereiche: gut bis ${zahl(a)}${e}, befriedigend bis ${zahl(b)}${e}, schlecht darüber`, `Bewertung: ${BEREICH[bereich(k)]}`);
        }
        z.push(`Skala 0 bis ${fmt(k, k.max)}`, "Klick hebt das Instrument hervor");
        return z;
      });
    });
  }

  function zeichnen() {
    const v = DK.visual(bVis, { titel: `Kennzahlen ${STAND}`, einheit: "Tacho, Ring und Thermometer", botschaft: botschaft(695) });
    diagramm(v.flaeche, v.breite, v.hoehe);
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "v-instrumente", anker: "links", versatz: [690, 26], regel: "SAY – Botschaft vermitteln", titel: "Kernaussage unter dem Titel",
        text: "Unter dem Titel steht, welche Kennzahl ihr Ziel erreicht und welche es verfehlen. Das Original zeigte drei Instrumente ohne Namen, Einheit, Zeitraum und Ziel – was 5.348 bedeutet, blieb offen." },
      { nr: 2, ziel: "in-tacho", anker: "links", versatz: [100, 112], regel: "CHECK – Grenzen des Typs", titel: "Viel Fläche für eine Zahl",
        text: "Tacho, Ring und Thermometer brauchen viel Fläche für eine einzige Zahl, und Winkel oder Füllhöhen lassen sich zwischen Instrumenten kaum vergleichen. Das Bullet-Chart (Abb. 3.54) zeigt dieselben Angaben – Ist, Ziel, Bereiche – in einer Zeile je Kennzahl; vier Kennzahlen passen auf die Fläche eines Tachos." },
      { nr: 3, ziel: "in-legende", anker: "links", versatz: [361, 1], regel: "UNIFY – Semantische Notation", titel: "Grautöne statt Farbverlauf",
        text: "Die Bewertungsbereiche sind Grautöne wie im Bullet-Chart – dunkel schlecht, hell gut – mit festen Grenzen. Das Original nutzte Verläufe von Rot über Gelb nach Grün (Tacho) bzw. von Grün nach Rot (Thermometer): Wo ein Bereich endet, war nicht zu erkennen, und für rot-grün-farbenfehlsichtige Leser sowie im Schwarz-Weiß-Druck verschwimmen die Stufen." },
      { nr: 4, ziel: "in-ziele", anker: "links", versatz: [-3, 1], regel: "EXPRESS – Abweichung zeigen", titel: "Ziel und Abweichung nach Wirkung",
        text: "Jedes Instrument trägt eine Zielmarke; darunter stehen Ziel und Abweichung, blaugrün bei günstiger, rot bei ungünstiger Wirkung. Beim Budget ist mehr ungünstig – +1 %-Pkt. ist deshalb rot. Im Original fehlten Ziele ganz." },
      { nr: 5, ziel: "in-thermometer", anker: "links", versatz: [151, 137], regel: "SIMPLIFY – Überflüssiges weglassen", titel: "Ohne Kasten und Verläufe",
        text: "Hintergrundkasten, zehn Skalenstriche und der Farbverlauf des Thermometers entfallen; die Skala nennt 0, 50 und 100. Der Ring ist anthrazit statt hellblau, der Rest hellgrau statt dunkelgrau." },
      { nr: 6, ziel: "in-namen", anker: "links", versatz: [2, 2], regel: "STRUCTURE – Inhalte ordnen", titel: "Gleicher Aufbau je Instrument",
        text: "Alle drei Instrumente stehen nebeneinander und folgen demselben Aufbau: Name, Zeitraum und Einheit, Instrument mit Wert, darunter Ziel und Abweichung. Im Original lagen die Elemente ohne Ordnung auf der Folie." },
      { nr: 7, ziel: "in-ring", anker: "links", versatz: [128, 142], regel: "CONDENSE – Hervorheben", titel: "Klick auf ein Instrument",
        text: "Ein Klick hebt ein Instrument hervor; die Aussage nennt dann Ist, Ziel, Abweichung und Bewertungsbereich. Esc hebt die Auswahl auf." },
    ],
    nachbauIntro: "Seitengröße benutzerdefiniert 727 × 330 px. Schrift Arial: Beschriftungen 10,5 pt, Titel 12 pt, Werte 19,5 pt. Datenmodell: Tabelle Kennzahlen (Kennzahl, Zeitraum, Einheit, Skala, Grenzen, Ist, Ziel) wie in der CSV-Datei.",
    nachbau: [
      { id: "A", ziel: "in-tacho", anker: "links", versatz: [100, 112], titel: "Tacho", visual: "Messgerät (Standardvisual)",
        felder: "Wert: Ist; Minimalwert: 0; Maximalwert: Skala; Zielwert: Ziel", format: "Füllung #3A3F44, Hintergrund #EFEFEF, Ziel #1A1A1A; Datenbeschriftung aus, Zielbeschriftung aus; Wert als Karte darunter",
        hinweis: "Das Standard-Messgerät zeigt Ist als gefüllten Bogen statt Zeiger und kennt keine Bewertungsbereiche – die Grautöne wären nur mit einem Hintergrundbild möglich." },
      { id: "B", ziel: "in-ring", anker: "links", versatz: [128, 142], titel: "Ring", visual: "Ringdiagramm (Standardvisual) mit Karte in der Mitte",
        felder: "Werte: Measure Ist = [Auslastung]; Measure Rest = 1 − [Auslastung]", format: "Ist #3A3F44, Rest #EFEFEF; Innenradius 78 %; Legende und Datenbeschriftungen aus",
        hinweis: "Eine Zielmarke ist im Ringdiagramm nicht möglich." },
      { id: "C", ziel: "in-thermometer", anker: "links", versatz: [151, 137], titel: "Thermometer", visual: "Kein Standardvisual – Säulendiagramm mit einer Säule",
        felder: "Y-Achse: Ist; Analysebereich: konstante Y-Linie = Ziel", format: "Säule #3A3F44, Y-Achse fest 0–100 %; Konstantenlinie #1A1A1A, durchgezogen",
        hinweis: "Die Kugel entfällt; Bereiche über drei zusätzliche konstante Linien oder ein gestapeltes Säulendiagramm im Hintergrund." },
      { id: "D", ziel: "in-ziele", anker: "links", versatz: [-3, 1], titel: "Ziel und Abweichung", visual: "Karte (neu) mit Referenzbeschriftung",
        felder: "Measure ΔZiel = [Ist] − [Ziel]", format: "Bedingte Farbe der Referenzbeschriftung nach Wirkung: #00806B bzw. #C62828" },
    ],
    theme: DK.thema(),
    csv: { name: "tachos_thermometer_daten.csv", text: () => ["Darstellung;Kennzahl;Zeitraum;Einheit;Skala_bis;Grenze_1;Grenze_2;Ist;Ziel;Richtung",
      ...I.map(k => [TYPNAME[k.typ], k.name, k.zeitraum, k.einheit, k.max, k.grenzen ? k.grenzen[0] : "", k.grenzen ? k.grenzen[1] : "", k.ist, k.ziel, k.richtung].join(";"))].join("\r\n") },
    tabellen: () => [{ titel: `Kennzahlen ${STAND}`, kopf: ["Darstellung", "Kennzahl", "Zeitraum", "Einheit", "Ist", "Ziel", "ΔZiel", "Bewertung"],
      zeilen: I.map(k => [TYPNAME[k.typ], k.name, k.zeitraum, k.einheit, fmt(k, k.ist), zieltext(k).replace("Ziel ", ""), dfmt(k),
        bereich(k) == null ? "–" : BEREICH[bereich(k)]]) }],
  });
  zeichnen();
})();
