/* Einzelvisual „Lieferantenvergleich mit Schwellenwert“ (Abb. 3.67): Bewertungsprofil zweier Lieferanten in sechs
   Kriterien (0–10 Punkte) mit Schwellenwert (Mindestpunktzahl je Kriterium).
   Seite 727 x 400 px = 110 x 60,5 mm. Daten: lieferanten.json (daten_lieferanten.py), Werte des Originals.
   Diagrammtyp bleibt: waagerechtes Profil (Polaritätsprofil) – je Lieferant eine Linie über die Kriterien, senkrechte
   Schwellenwertlinie. Lieferanten in Grautönen mit eigener Markerform statt Rot/Grün; Bereich unter dem Schwellenwert
   grau hinterlegt, Unterschreitungen rot markiert; rechts die Punktwerte. Schalter Schwellenwert 3/4/5, Klick auf ein
   Kriterium hebt es hervor. */
(() => {
  "use strict";
  const { zahl, NBSP, sv, el } = DK;
  const J = DATA.jahr, K = DATA.kriterien, L = DATA.lieferanten, P = DATA.punkte, MAX = DATA.skala;
  const KURZ = L.map(l => l.replace("Lieferant ", ""));
  const STIL = [ // Lieferant A dunkel mit Quadrat, B hell mit Dreieck – Unterscheidung auch ohne Farbe
    { farbe: "#3A3F44", form: "quadrat" },
    { farbe: "#A9A9A9", form: "dreieck" },
  ];
  const ROT = "#C62828";
  const S = { schwelle: DATA.schwelle, auswahl: null };
  const auswaehlen = i => { S.auswahl = S.auswahl === i ? null : i; zeichnen(); };
  addEventListener("keydown", e => { if (e.key === "Escape" && S.auswahl !== null) { S.auswahl = null; zeichnen(); } });

  DK.init({ titel: "Lieferantenvergleich mit Schwellenwert", breite: 727, hoehe: 400 });
  const bVis = DK.box("v-profil", 16, 10, 695, 382);

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

  /* ---------- Berechnungen ---------- */
  const pkt = v => zahl(v, 1);
  const unter = (l, s = S.schwelle) => K.map((k, i) => i).filter(i => P[l][i] < s);
  const mittel = l => P[l].reduce((s, v) => s + v, 0) / K.length;
  const liste = is => (is.length > 1 ? is.slice(0, -1).map(i => K[i]).join(", ") + " und " + K[is[is.length - 1]] : K[is[0]]);

  function botschaft(b) {
    const passt = x => x.find(t => DK.tw(t) <= b) || x[x.length - 1];
    const s = S.schwelle;
    if (S.auswahl !== null) {
      const i = S.auswahl;
      const teil = l => `${KURZ[l]} ${pkt(P[l][i])}${P[l][i] < s ? " (unter Schwellenwert)" : ""}`;
      return passt([`${K[i]}: ${teil(0)}, ${teil(1)} – Schwellenwert ${s} Punkte`, `${K[i]}: ${teil(0)}, ${teil(1)}`]);
    }
    const u = L.map((l, j) => unter(j)), ok = L.map((l, j) => j).filter(j => !u[j].length);
    const mi = `im Mittel ${pkt(mittel(0))} zu ${pkt(mittel(1))} Punkten`;
    if (ok.length === L.length) return passt([`Beide Lieferanten erreichen in allen Kriterien mindestens ${s} Punkte; A ${mi}`]);
    if (ok.length === 1) {
      const n = 1 - ok[0];
      return passt([`Nur ${L[ok[0]]} erfüllt alle Kriterien; ${KURZ[n]} verfehlt ${s} Punkte bei ${liste(u[n])}`,
        `Nur ${L[ok[0]]} erfüllt alle Kriterien; ${KURZ[n]} verfehlt ${s} Punkte in ${u[n].length} Kriterien`]);
    }
    return passt([`Kein Lieferant erfüllt alle Kriterien: A verfehlt ${s} Punkte bei ${liste(u[0])}, B bei ${liste(u[1])}`,
      `Keiner erfüllt alle Kriterien: A verfehlt ${s} Punkte bei ${liste(u[0])}, B bei ${liste(u[1])}`,
      `Kein Lieferant erfüllt alle Kriterien: A verfehlt ${s} Punkte in ${u[0].length}, B in ${u[1].length} von ${K.length} Kriterien`]);
  }

  /* ---------- Marker ---------- */
  function marker(g, form, x, y, farbe, rot) {
    const st = rot ? { stroke: ROT, "stroke-width": 2.2 } : { stroke: "#FFFFFF", "stroke-width": 1 };
    if (form === "quadrat") return sv("rect", { x: x - 5.5, y: y - 5.5, width: 11, height: 11, fill: farbe, ...st }, g);
    return sv("path", { d: `M${x},${y - 7} L${x + 6.5},${y + 5} L${x - 6.5},${y + 5} Z`, fill: farbe, ...st }, g);
  }

  /* ---------- Profil ---------- */
  function profil(ziel, breite, hoehe) {
    ziel.textContent = "";
    const s = S.schwelle;
    const svg = sv("svg", { width: breite, height: hoehe, role: "img",
      "aria-label": `Profildiagramm: Bewertung von ${L.join(" und ")} in ${K.length} Kriterien, Schwellenwert ${s} Punkte` }, ziel);
    const lw = Math.ceil(Math.max(...K.map(k => DK.tw(k)))) + 16;
    const sp = 52, lm = Math.ceil(DK.tw("verfehlt")) + 6, rw = lm + 2 * sp + 8;   // Wertespalten rechts
    const oben = 30, unten = 52, PW = breite - lw - rw - 14, H = hoehe - oben - unten;
    const rh = H / K.length, cy = i => oben + rh * (i + 0.5);
    const sx = v => lw + v / MAX * PW;
    const xr = breite - rw, xs = j => xr + 8 + lm + sp * (j + 1) - 4;   // Beginn und rechte Kante der Wertespalten

    // Zone unter dem Schwellenwert und Schwellenwertlinie
    const gz = sv("g", { id: "pr-zone" }, svg);
    sv("rect", { x: sx(0), y: oben, width: sx(s) - sx(0), height: H, fill: "#EFEFEF" }, gz);
    sv("text", { x: sx(0) + 6, y: oben - 12, dy: "0.35em", class: "muted" }, gz, "unter Schwellenwert");
    const gs = sv("g", { id: "pr-schwelle" }, svg);
    sv("line", { x1: sx(s), x2: sx(s), y1: oben - 4, y2: oben + H, stroke: "#1A1A1A", "stroke-width": 2 }, gs);
    const ts = `Schwellenwert ${s}`;
    const tsx = Math.max(sx(s) + 6, sx(0) + 6 + DK.tw("unter Schwellenwert") + 14);
    sv("text", { x: tsx, y: oben - 12, dy: "0.35em", style: "font-weight:bold" }, gs, ts);

    // Achse unten
    const ga = sv("g", { id: "pr-achse" }, svg);
    sv("line", { x1: sx(0), x2: sx(MAX), y1: oben + H + 0.5, y2: oben + H + 0.5, stroke: "#8C8C8C", "stroke-width": 1 }, ga);
    for (let t = 0; t <= MAX; t += 2) {
      sv("line", { x1: sx(t), x2: sx(t), y1: oben + H, y2: oben + H + 5, stroke: "#8C8C8C", "stroke-width": 1 }, ga);
      sv("text", { x: sx(t), y: oben + H + 16, dy: "0.35em", "text-anchor": "middle", class: "muted" }, ga, zahl(t));
    }
    sv("text", { x: sx(MAX), y: oben + H + 38, dy: "0.35em", "text-anchor": "end", class: "muted" }, ga, "Punkte (10 = sehr gut)");

    // Kopf der Wertespalten mit Markerform
    const gk = sv("g", { id: "pr-kopf" }, svg);
    KURZ.forEach((k, l) => {
      const xc = xs(l);
      marker(gk, STIL[l].form, xc - DK.tw(k) - 12, oben - 12, STIL[l].farbe, false);
      sv("text", { x: xc, y: oben - 12, dy: "0.35em", "text-anchor": "end", class: "muted" }, gk, k);
    });
    sv("line", { x1: xr + 8, x2: breite, y1: oben - 1.5, y2: oben - 1.5, stroke: "#3A3F44", "stroke-width": 1 }, gk);

    // Zeilen: Kriterium, Hilfslinie, Werte rechts
    const gzeilen = sv("g", { id: "pr-kriterien" }, svg), gw = sv("g", { id: "pr-werte" }, svg);
    K.forEach((k, i) => {
      const blass = S.auswahl !== null && S.auswahl !== i;
      const g = sv("g", { class: "dk-klick" + (blass ? " dk-blass" : ""), "data-name": k }, gzeilen);
      sv("text", { x: 0, y: cy(i), dy: "0.35em" }, g, k);
      sv("line", { x1: sx(0), x2: sx(MAX), y1: cy(i), y2: cy(i), stroke: "#D9D9D9", "stroke-width": 1, "stroke-dasharray": "2 3" }, g);
      const gv = sv("g", { class: blass ? "dk-blass" : "" }, gw);
      L.forEach((l, j) => {
        const v = P[j][i], rot = v < s;
        sv("text", { x: xs(j), y: cy(i), dy: "0.35em", "text-anchor": "end",
          style: rot ? `font-weight:bold;fill:${ROT}` : "" }, gv, pkt(v));
      });
      const hit = sv("rect", { x: 0, y: oben + rh * i, width: breite, height: rh, fill: "transparent" }, g);
      hit.addEventListener("click", () => auswaehlen(i));
      tooltip(hit, () => [`${k} (${J})`, ...L.map((l, j) => `${l}: ${pkt(P[j][i])} Punkte – ${P[j][i] < s ? "unter Schwellenwert" : "erfüllt"}`),
        `Schwellenwert ${s} Punkte`, "Klick hebt das Kriterium hervor"]);
    });
    // Mittelwerte unter den Wertespalten
    const gm = sv("g", { id: "pr-mittel" }, svg);
    sv("line", { x1: xr + 8, x2: breite, y1: oben + H + 0.5, y2: oben + H + 0.5, stroke: "#3A3F44", "stroke-width": 1 }, gm);
    sv("text", { x: xr + 8, y: oben + H + 16, dy: "0.35em", class: "muted" }, gm, "Mittel");
    sv("text", { x: xr + 8, y: oben + H + 38, dy: "0.35em", class: "muted" }, gm, "verfehlt");
    L.forEach((l, j) => {
      const x = xs(j);
      sv("text", { x, y: oben + H + 16, dy: "0.35em", "text-anchor": "end", style: "font-weight:bold" }, gm, pkt(mittel(j)));
      const n = unter(j).length;
      sv("text", { x, y: oben + H + 38, dy: "0.35em", "text-anchor": "end",
        style: n ? `font-weight:bold;fill:${ROT}` : "font-weight:bold" }, gm, zahl(n));
    });

    // Profillinien und Marker; Beschriftung am weitesten rechts liegenden Punkt
    const gl = sv("g", { id: "pr-linien" }, svg);
    L.forEach((l, j) => {
      const d = P[j].map((v, i) => `${i ? "L" : "M"}${sx(v).toFixed(1)},${cy(i).toFixed(1)}`).join(" ");
      sv("path", { id: `pr-linie-${j}`, d, fill: "none", stroke: STIL[j].farbe, "stroke-width": 2.5, "stroke-linejoin": "round" }, gl);
    });
    L.forEach((l, j) => P[j].forEach((v, i) => {
      const g = sv("g", { class: S.auswahl !== null && S.auswahl !== i ? "dk-blass" : "" }, gl);
      marker(g, STIL[j].form, sx(v), cy(i), STIL[j].farbe, v < s);
    }));
    const gb = sv("g", { id: "pr-reihen" }, svg);
    L.forEach((l, j) => {
      const i = P[j].indexOf(Math.max(...P[j]));
      sv("text", { x: sx(P[j][i]) + 13, y: cy(i), dy: "0.35em", style: j === 0 ? "font-weight:bold" : "" }, gb, l);
    });
  }

  /* ---------- Schalter Schwellenwert ---------- */
  function zeichnen() {
    const v = DK.visual(bVis, { titel: `Lieferantenbewertung ${J} je Kriterium`, einheit: "Punkte 0–10", botschaft: botschaft(695),
      schalter: { optionen: DATA.schwellen.map(s => [s, String(s)]), wert: S.schwelle,
        onChange: w => { S.schwelle = Number(w); S.auswahl = null; zeichnen(); } } });
    const tz = bVis.querySelector(".dk-titelzeile"), kn = tz.querySelector(".dk-knoepfe");
    kn.id = "pr-schalter";
    kn.style.marginLeft = "0";
    tz.insertBefore(el("span", { id: "pr-schalter-label", style: "margin-left:auto;font-size:14px;color:#4D4D4D" }, null, "Schwellenwert"), kn);
    profil(v.flaeche, v.breite, v.hoehe);
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "v-profil", anker: "links", versatz: [690, 26], regel: "SAY – Botschaft vermitteln", titel: "Kernaussage unter dem Titel",
        text: "Unter dem Titel steht, welcher Lieferant den Schwellenwert in welchen Kriterien verfehlt – beim Umschalten des Schwellenwerts neu berechnet. Das Original hatte nur die Überschrift „Lieferantenanalyse“." },
      { nr: 2, ziel: "pr-kopf", anker: "links", versatz: [-4, -4], regel: "UNIFY – Semantische Notation", titel: "Grautöne und Formen statt Rot und Grün",
        text: "Lieferant A ist anthrazit mit Quadraten, Lieferant B hellgrau mit Dreiecken; die Formen tragen die Unterscheidung auch im Schwarz-Weiß-Druck. Im Original war A rot und B grün – Farben, die man als „schlecht“ und „gut“ liest und die bei Rot-Grün-Sehschwäche kaum zu unterscheiden sind. Rot bleibt hier den Unterschreitungen vorbehalten." },
      { nr: 3, ziel: "pr-zone", anker: "links", versatz: [40, 20], regel: "STRUCTURE – Bezugsgröße zeigen", titel: "Schwellenwert als Zone",
        text: "Der Bereich unter dem Schwellenwert ist grau hinterlegt, die Linie ist beschriftet. Im Original stand eine schwarze Linie ohne Beschriftung im Diagramm; dass sie die Mindestpunktzahl zeigt, verriet nur der Titel der Abbildung." },
      { nr: 4, ziel: "pr-werte", anker: "links", versatz: [10, 60], regel: "EXPRESS – Abweichung zeigen", titel: "Unterschreitungen rot",
        text: "Punkte unter dem Schwellenwert erhalten eine rote Kontur, ihre Werte stehen rot rechts in der Tabelle; darunter Mittelwert und Zahl der verfehlten Kriterien je Lieferant. Im Original musste man die Lage jedes Markers zur Linie selbst prüfen." },
      { nr: 5, ziel: "pr-reihen", anker: "links", versatz: [150, 0], regel: "SIMPLIFY – Direkt beschriften", titel: "Beschriftung an der Linie",
        text: "Die Lieferanten sind am jeweils äußersten Punkt ihrer Linie beschriftet; die Legende unter dem Diagramm entfällt, das Gitternetz ist auf gepunktete Zeilenlinien reduziert." },
      { nr: 6, ziel: "pr-linien", anker: "links", versatz: [-30, 205], regel: "CHECK – Grenzen des Diagrammtyps", titel: "Linien zwischen Kriterien",
        text: "Die Verbindungslinien zwischen den Kriterien haben keine inhaltliche Bedeutung: Kriterien sind keine Zeitreihe, eine andere Reihenfolge ergibt ein anderes Zickzack. Für genaue Vergleiche eignet sich ein Punktdiagramm ohne Linien oder ein gruppiertes Balkendiagramm. Der Mittelwert ist ungewichtet; sind Kriterien unterschiedlich wichtig, hilft eine Scoring-Analyse." },
      { nr: 7, ziel: "pr-schalter-label", anker: "links", versatz: [-2, -2], regel: "CONDENSE – Interaktion", titel: "Schwellenwert umschalten",
        text: "Der Schalter setzt den Schwellenwert auf 3, 4 oder 5 Punkte; Zone, Markierungen, Zähler und Aussage folgen. Ein Klick auf ein Kriterium hebt es hervor, Esc hebt die Auswahl auf." },
    ],
    nachbauIntro: "Seitengröße benutzerdefiniert 727 × 400 px. Schrift Arial: Beschriftungen 10,5 pt, Titel 12 pt. Datenmodell: Tabelle Bewertung (Jahr, Lieferant, Kriterium, Punkte) wie in der CSV-Datei, dazu ein Was-wäre-wenn-Parameter Schwellenwert.",
    nachbau: [
      { id: "A", ziel: "pr-linien", versatz: [-30, 0], titel: "Profil", visual: "Liniendiagramm (Standardvisual)",
        felder: "X-Achse: Kriterium (nach Kriteriennummer sortiert); Y-Achse: Measure Punkte = SUM(Bewertung[Punkte]); Legende: Lieferant",
        format: "Linie A #3A3F44, B #A9A9A9, Breite 2,5 px; Markierungen ein, Form je Reihe Quadrat bzw. Dreieck; Y-Achse 0 bis 10. Analysebereich: Konstante Linie, Wert über fx = [Schwellenwert-Wert], Farbe #1A1A1A, Schattierungsbereich „Davor“ #EFEFEF",
        hinweis: "Das Liniendiagramm stellt die Kriterien auf die X-Achse; das Profil steht damit senkrecht statt waagerecht. Einzelne Marker lassen sich nicht bedingt einfärben – Unterschreitungen zeigt die Tabelle B." },
      { id: "B", ziel: "pr-kopf", anker: "links", versatz: [-4, -4], titel: "Punktwerte", visual: "Matrix",
        felder: "Zeilen: Kriterium; Spalten: Lieferant; Werte: Punkte. Gesamtergebnis als Mittelwert (AVERAGE)",
        format: "Bedingte Formatierung › Schriftfarbe: Regel Wert < [Schwellenwert-Wert] → #C62828, fett; Zeilenreihenfolge wie im Liniendiagramm" },
      { id: "C", ziel: "pr-schalter-label", anker: "links", versatz: [-2, -2], titel: "Schwellenwert", visual: "Datenschnitt (aus Was-wäre-wenn-Parameter)",
        felder: "Modellierung › Neuer Parameter › Numerischer Bereich: 3 bis 5, Schrittweite 1, Standard 4; Measure [Schwellenwert-Wert] = SELECTEDVALUE(Schwellenwert[Schwellenwert], 4)",
        format: "Datenschnitt als Kacheln (einfache Auswahl), ausgewählt #3A3F44" },
    ],
    theme: DK.thema(),
    csv: { name: "lieferantenvergleich_daten.csv", text: () => ["Jahr;Lieferant;Kriterium;Punkte_0_bis_10;Schwellenwert",
      ...L.flatMap((l, j) => K.map((k, i) => [J, l, k, pkt(P[j][i]), S.schwelle].join(";")))].join("\r\n") },
    tabellen: () => [{ titel: `Lieferantenbewertung ${J} (Punkte 0–10), Schwellenwert ${S.schwelle}`, kopf: ["Kriterium", ...L, "Bewertung"],
      zeilen: [...K.map((k, i) => {
        const u = L.filter((l, j) => P[j][i] < S.schwelle);
        return [k, pkt(P[0][i]), pkt(P[1][i]), u.length ? `unter Schwellenwert: ${u.join(", ")}` : "beide erfüllt"];
      }),
        ["Mittelwert", pkt(mittel(0)), pkt(mittel(1)), ""], ["Kriterien unter Schwellenwert", zahl(unter(0).length), zahl(unter(1).length), ""]] }],
  });
  zeichnen();
})();
