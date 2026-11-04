/* Einzelvisual „Bullet-Chart“ (Abb. 3.54): vier Kennzahlen als Bullet-Charts nach Stephen Few untereinander.
   Seite 727 x 330 px = 110 x 49,9 mm. Daten: bullet.json (daten_bullet.py); erste Kennzahl mit den Werten des
   Originals (65, Ziel 78). Je Kennzahl: Bewertungsbereiche als Grautöne (dunkel = schlecht, hell = gut), Ist als
   anthrazitfarbener Balken, Ziel als senkrechter Strich, rechts Ist, Ziel und Abweichung farbig nach Wirkung.
   Klick auf eine Zeile hebt die Kennzahl hervor. */
(() => {
  "use strict";
  const { zahl, delta, NBSP, sv, el, FARBE } = DK;
  const J = DATA.jahr;
  const K = DATA.kennzahlen.map(([name, einheit, max, [b, g], ist, ziel, nk], i) => ({ i, name, einheit, max, b, g, ist, ziel, nk }));
  const BEREICH = ["schlecht", "befriedigend", "gut"], GRAU = ["#BDBDBD", "#D9D9D9", "#EFEFEF"];
  const bewertung = k => (k.ist >= k.g ? 2 : k.ist >= k.b ? 1 : 0);
  const S = { auswahl: null };
  const auswaehlen = i => { S.auswahl = S.auswahl === i ? null : i; zeichnen(); };
  addEventListener("keydown", e => { if (e.key === "Escape" && S.auswahl !== null) { S.auswahl = null; zeichnen(); } });

  DK.init({ titel: "Bullet-Chart", breite: 727, hoehe: 330 });
  const bVis = DK.box("v-bullet", 16, 10, 695, 312);
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
  const dz = k => k.ist - k.ziel;
  const fmt = (k, v) => zahl(v, k.nk);

  function botschaft(b) {
    const passt = x => x.find(t => DK.tw(t) <= b) || x[x.length - 1];
    if (S.auswahl !== null) {
      const k = K[S.auswahl];
      return passt([`${k.name}: ${fmt(k, k.ist)} bei Ziel ${fmt(k, k.ziel)} (${delta(dz(k), k.nk)}), Bereich ${BEREICH[bewertung(k)]}`]);
    }
    const ueber = K.filter(k => dz(k) >= 0), unter = K.filter(k => dz(k) < 0);
    const schlimm = unter.slice().sort((a, c) => dz(a) / a.ziel - dz(c) / c.ziel)[0];
    return passt([`${ueber.map(k => k.name).join(", ")} über Ziel; ${schlimm.name} am weitesten darunter (${delta(dz(schlimm), schlimm.nk)})`,
      `${ueber.length} von ${K.length} Kennzahlen erreichen ihr Ziel`]);
  }

  function diagramm(ziel, breite, hoehe) {
    ziel.textContent = "";
    const svg = sv("svg", { width: breite, height: hoehe, role: "img", "aria-label": `Bullet-Charts: vier Kennzahlen ${J} gegen Ziel` }, ziel);
    const lw = Math.ceil(Math.max(...K.map(k => Math.max(DK.tw(k.name, 14, true), DK.tw(k.einheit))))) + 14;
    const spalten = [["Ist", 46], ["Ziel", 46], ["ΔZiel", 58]], rw = spalten.reduce((s, x) => s + x[1], 0) + 10;
    const kopf = 24, rh = (hoehe - kopf) / K.length, bw = breite - lw - rw;
    // Legende und Spaltenköpfe
    const gl = sv("g", { id: "bu-legende" }, svg);
    let lx = lw;
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
    let sx0 = breite - rw + 10;
    spalten.forEach(([t, w]) => { sv("text", { x: sx0 + w, y: 8, dy: "0.35em", "text-anchor": "end", class: "muted" }, gl, t); sx0 += w; });
    const gb = sv("g", { id: "bu-balken" }, svg), gw = sv("g", { id: "bu-werte" }, svg);
    K.forEach((k, j) => {
      const y = kopf + j * rh, yc = y + rh / 2, blass = S.auswahl !== null && S.auswahl !== k.i;
      const sx = v => lw + v / k.max * bw;
      const g = sv("g", { class: "dk-klick" + (blass ? " dk-blass" : ""), "data-name": k.name }, gb);
      sv("text", { x: 0, y: yc - 8, dy: "0.35em", style: "font-weight:bold" }, g, k.name);
      sv("text", { x: 0, y: yc + 9, dy: "0.35em", class: "muted" }, g, k.einheit);
      const bh = Math.min(26, rh * 0.62);
      [[0, k.b], [k.b, k.g], [k.g, k.max]].forEach(([a, c], b) => sv("rect", { x: sx(a), y: yc - bh / 2, width: sx(c) - sx(a), height: bh, fill: GRAU[b] }, g));
      sv("rect", { x: lw, y: yc - bh / 6, width: sx(k.ist) - lw, height: bh / 3, fill: "#3A3F44" }, g);
      sv("line", { x1: sx(k.ziel), x2: sx(k.ziel), y1: yc - bh * 0.38, y2: yc + bh * 0.38, stroke: "#1A1A1A", "stroke-width": 2.5 }, g);
      sv("text", { x: lw, y: yc + bh / 2 + 9, dy: "0.35em", "text-anchor": "start", class: "muted", style: "font-size:14px" }, g, "0");
      sv("text", { x: lw + bw, y: yc + bh / 2 + 9, dy: "0.35em", "text-anchor": "end", class: "muted" }, g, zahl(k.max));
      // Werte rechts
      const gv = sv("g", { class: blass ? "dk-blass" : "" }, gw);
      let x = breite - rw + 10;
      const d = dz(k);
      [[fmt(k, k.ist), "font-weight:bold"], [fmt(k, k.ziel), ""], [delta(d, k.nk), `font-weight:bold;fill:${FARBE[d > 0 ? "gut" : d < 0 ? "schlecht" : "neutral"]}`]]
        .forEach(([t, st], c) => { x += spalten[c][1]; sv("text", { x, y: yc, dy: "0.35em", "text-anchor": "end", style: st }, gv, t); });
      const hit = sv("rect", { x: 0, y, width: breite, height: rh, fill: "transparent" }, g);
      hit.addEventListener("click", () => auswaehlen(k.i));
      tooltip(hit, () => [`${k.name} ${J} (${k.einheit})`, `Ist ${fmt(k, k.ist)} · Ziel ${fmt(k, k.ziel)} · ΔZiel ${delta(d, k.nk)}`,
        `Bereiche: schlecht unter ${zahl(k.b)}, befriedigend bis ${zahl(k.g)}, gut ab ${zahl(k.g)}`, `Bewertung: ${BEREICH[bewertung(k)]}`, "Klick hebt die Kennzahl hervor"]);
    });
  }

  function zeichnen() {
    const v = DK.visual(bVis, { titel: `Kennzahlen ${J} im Vergleich zum Ziel`, einheit: "", botschaft: botschaft(695) });
    diagramm(v.flaeche, v.breite, v.hoehe);
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "v-bullet", anker: "links", versatz: [690, 26], regel: "SAY – Botschaft vermitteln", titel: "Kernaussage unter dem Titel",
        text: "Unter dem Titel steht, welche Kennzahlen ihr Ziel erreichen und welche am weitesten darunter liegen. Das Original zeigte eine einzige Kennzahl ohne Namen („Evaluation“) und ohne Aussage." },
      { nr: 2, ziel: "bu-legende", anker: "links", versatz: [-6, -2], regel: "UNIFY – Semantische Notation", titel: "Grautöne statt Ampelfarben",
        text: "Die Bewertungsbereiche sind Grautöne – dunkel für schlecht, hell für gut –, wie es Stephen Few für Bullet-Charts vorschlägt. Das Original nutzte eine Ampel von Grün bis Rot, im zweiten Beispiel sogar als Verlauf: Wo ein Bereich endet, war nicht mehr zu erkennen, und rot-grün-farbenfehlsichtige Leser sehen den Unterschied kaum." },
      { nr: 3, ziel: "bu-balken", anker: "links", versatz: [180, 20], regel: "CONDENSE – Verdichten", titel: "Mehrere Kennzahlen untereinander",
        text: "Bullet-Charts brauchen wenig Platz; ihr Vorteil zeigt sich, wenn mehrere Kennzahlen untereinander stehen – jede mit eigener Skala, Zielmarke und eigenen Bereichen. Das Original zeigte dieselbe Kennzahl zweimal." },
      { nr: 4, ziel: "bu-werte", anker: "links", versatz: [9, -63], regel: "EXPRESS – Werte nennen", titel: "Ist, Ziel und Abweichung als Zahl",
        text: "Rechts stehen Ist, Ziel und Abweichung; die Abweichung ist blaugrün, wenn das Ziel erreicht ist, sonst rot. Im Original musste man Wert und Ziel an der Achse ablesen." },
      { nr: 5, ziel: "bu-balken", anker: "links", versatz: [420, 120], regel: "SIMPLIFY – Überflüssiges weglassen", titel: "Ohne Sprechblase und Raster",
        text: "Die Sprechblase am Balkenende und die Skala mit Teilstrichen alle 10 Punkte entfallen; Anfang und Ende der Skala stehen unter jedem Bullet-Chart." },
    ],
    nachbauIntro: "Seitengröße benutzerdefiniert 727 × 330 px. Schrift Arial: Beschriftungen 10,5 pt, Titel 12 pt. Datenmodell: Tabelle Kennzahlen (Kennzahl, Einheit, Skala, Grenzen, Ist, Ziel) wie in der CSV-Datei.",
    nachbau: [
      { id: "A", ziel: "bu-balken", versatz: [0, 0], titel: "Bullet-Charts", visual: "Kein Standardvisual – zertifiziertes Visual „Bullet Chart“ (AppSource) oder Kombination aus gruppiertem Balkendiagramm und Fehlerbalken",
        felder: "Kategorie: Kennzahl; Wert: Ist; Zielwert: Ziel; Bereiche: Grenzen befriedigend und gut, Maximum", format: "Bereiche #BDBDBD, #D9D9D9, #EFEFEF; Ist #3A3F44; Zielmarke #1A1A1A",
        hinweis: "Mit Standardmitteln: gestapeltes Balkendiagramm für die Bereiche, darüber ein schmaler Balken für Ist und eine Konstantenlinie bzw. Fehlerbalken für das Ziel – je Kennzahl ein eigenes Visual wegen der unterschiedlichen Skalen." },
      { id: "B", ziel: "bu-werte", anker: "links", versatz: [24, -2], titel: "Werte", visual: "Tabelle",
        felder: "Ist, Ziel, Measure ΔZiel = [Ist] − [Ziel]", format: "Bedingte Schriftfarbe für ΔZiel: ≥ 0 #00806B, < 0 #C62828" },
    ],
    theme: DK.thema(),
    csv: { name: "bullet_chart_daten.csv", text: () => ["Kennzahl;Einheit;Skala_bis;Befriedigend_ab;Gut_ab;Ist;Ziel",
      ...K.map(k => [k.name, k.einheit, k.max, k.b, k.g, fmt(k, k.ist), fmt(k, k.ziel)].join(";"))].join("\r\n") },
    tabellen: () => [{ titel: `Kennzahlen ${J}`, kopf: ["Kennzahl", "Einheit", "Ist", "Ziel", "ΔZiel", "Bewertung"],
      zeilen: K.map(k => [k.name, k.einheit, fmt(k, k.ist), fmt(k, k.ziel), delta(dz(k), k.nk), BEREICH[bewertung(k)]]) }],
  });
  zeichnen();
})();
