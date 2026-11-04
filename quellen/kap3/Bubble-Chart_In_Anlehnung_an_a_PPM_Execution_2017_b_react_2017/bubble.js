/* Dashboard „Bubble-Chart“ (Abb. 3.47) mit den beiden Beispielen des Originals:
   a) Projektportfolio als Blasendiagramm – Wert (x), Risiko (y, oben gering), Kreisfläche = Kapitalwert, Grauton = Kategorie;
   b) gepackte Blasen – Begriffe in Kundenbewertungen, Kreisfläche = Nennungen, Farbe = Stimmung (negativ Rot, positiv Blaugrün).
   Seite 1024 x 646 px. Daten: bubble.json (daten_bubble.py). Datenschnitte Kategorie (a) und Stimmung (b);
   Klick auf einen Kreis hebt ihn hervor. */
(() => {
  "use strict";
  const { zahl, NBSP, sv, el } = DK;
  const KAT = DATA.kategorien, ST = DATA.stimmungen;
  const PRO = DATA.projekte.map(([name, x, r, npv, k]) => ({ name, x, r, npv, k }));
  const BEG = DATA.begriffe.map(([name, n, s], i) => ({ i, name, n, s }));
  const F_KAT = ["#3A3F44", "#6E747A", "#A9A9A9", "#D4D4D4"], T_KAT = ["#FFFFFF", "#FFFFFF", "#1A1A1A", "#1A1A1A"];
  const F_ST = ["#C62828", "#A6D2CB", "#EFEFEF"], T_ST = ["#FFFFFF", "#1A1A1A", "#1A1A1A"], R_ST = ["#C62828", "#7FBFB5", "#BDBDBD"];
  const pz = (a, nk = 0) => zahl(a * 100, nk) + NBSP + "%";
  const mio = v => zahl(v, 1) + NBSP + "Mio. €";
  const quadrant = p => (p.x >= 5 ? 1 : 0) + (p.r >= 5 ? 2 : 0);        // 0 gering/gering, 1 hoch/gering, 2 gering/hoch, 3 hoch/hoch
  const TRENN = { "Rücksendung": ["Rück-", "sendung"], "Verpackung": ["Ver-", "packung"], "Versandkosten": ["Versand-", "kosten"],
    "Kundenservice": ["Kunden-", "service"], "Lieferung": ["Liefe-", "rung"], "Bestellung": ["Bestel-", "lung"],
    "Nachhaltigkeit": ["Nachhal-", "tigkeit"], "Haltbarkeit": ["Haltbar-", "keit"], "Beschreibung": ["Beschrei-", "bung"],
    "Retourenlabel": ["Retouren-", "label"], "Treuepunkte": ["Treue-", "punkte"], "Gutschein": ["Gut-", "schein"],
    "Newsletter": ["News-", "letter"], "Umtausch": ["Um-", "tausch"], "Bewertung": ["Bewer-", "tung"], "Sortiment": ["Sorti-", "ment"],
    "Abholung": ["Ab-", "holung"], "Montage": ["Mon-", "tage"], "Qualität": ["Quali-", "tät"], "Beratung": ["Bera-", "tung"],
    "Material": ["Mate-", "rial"], "Passform": ["Pass-", "form"], "Zahlung": ["Zah-", "lung"], "Website": ["Web-", "site"],
    "Garantie": ["Garan-", "tie"], "Hotline": ["Hot-", "line"], "Filiale": ["Fili-", "ale"], "Lieferzeit": ["Liefer-", "zeit"] };
  const QNAME = ["Geringer Wert, geringes Risiko", "Hoher Wert, geringes Risiko", "Geringer Wert, hohes Risiko", "Hoher Wert, hohes Risiko"];

  /* ---------- Zustand ---------- */
  const S = { kat: null, projekt: null, stimmung: null, begriff: null };
  addEventListener("keydown", e => {
    if (e.key !== "Escape") return;
    if (S.projekt !== null || S.begriff !== null) { S.projekt = null; S.begriff = null; } else { S.kat = null; S.stimmung = null; }
    zeichnen();
  });

  /* ---------- Layout (Seite 1024 x 646) ---------- */
  DK.init({ titel: "Bubble-Chart" });
  const bKopf = DK.box("kopf", 16, 10, 992, 46);
  DK.haarlinie(62);
  const bFilter = DK.box("filter", 16, 68, 992, 50, "dk-filter");
  DK.haarlinie(126);
  const bA = DK.box("v-portfolio", 16, 134, 560, 508);
  const bB = DK.box("v-begriffe", 596, 134, 412, 508);

  /* ---------- Tooltip ---------- */
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
  const passt = (k, b) => k.find(t => DK.tw(t) <= b) || k[k.length - 1];

  /* ---------- a) Projektportfolio ---------- */
  function botschaftA(b) {
    if (S.projekt !== null) {
      const p = PRO.find(x => x.name === S.projekt);
      return passt([`Projekt ${p.name}: Wert ${zahl(p.x, 1)}, Risiko ${zahl(p.r, 1)}, Kapitalwert ${mio(p.npv)} (${KAT[p.k]})`,
        `Projekt ${p.name}: Kapitalwert ${mio(p.npv)}, ${QNAME[quadrant(p)]}`], b);
    }
    if (S.kat !== null) {
      const ps = PRO.filter(p => p.k === S.kat), npv = ps.reduce((s, p) => s + p.npv, 0), hoch = ps.filter(p => p.r >= 5).length;
      return passt([`${KAT[S.kat]}: ${ps.length} Projekte, ${mio(npv)} Kapitalwert, ${hoch} davon mit hohem Risiko`,
        `${KAT[S.kat]}: ${ps.length} Projekte, ${mio(npv)} Kapitalwert`], b);
    }
    const gut = PRO.filter(p => quadrant(p) === 1).sort((a, c) => a.name.localeCompare(c.name)), npv = gut.reduce((s, p) => s + p.npv, 0);
    const namen = gut.map(p => p.name).join(gut.length === 2 ? " und " : ", ");
    return passt([`Nur ${namen} verbinden hohen Wert mit geringem Risiko (${mio(npv)} Kapitalwert)`,
      `Nur ${namen} verbinden hohen Wert mit geringem Risiko`], b);
  }
  function portfolio(ziel, breite, hoehe) {
    ziel.textContent = "";
    const svg = sv("svg", { width: breite, height: hoehe, role: "img",
      "aria-label": "Projektportfolio: Wert, Risiko und Kapitalwert der Projekte" }, ziel);
    const LEG = 112, links = 50, rechts = LEG + 8, oben = 26, unten = 50, PW = breite - links - rechts, PH = hoehe - oben - unten;
    const MIN = -0.8, MAX = 10.8;                                          // Rand, damit große Kreise nicht über den Rahmen ragen
    const sx = v => links + (v - MIN) / (MAX - MIN) * PW, sy = v => oben + (v - MIN) / (MAX - MIN) * PH;   // Risiko: oben gering
    const ga = sv("g", { id: "pa-achsen" }, svg);
    sv("line", { x1: sx(5), x2: sx(5), y1: oben, y2: oben + PH, stroke: "#9A9A9A", "stroke-width": 1 }, ga);
    sv("line", { x1: links, x2: links + PW, y1: sy(5), y2: sy(5), stroke: "#9A9A9A", "stroke-width": 1 }, ga);
    sv("rect", { x: links, y: oben, width: PW, height: PH, fill: "none", stroke: "#8C8C8C", "stroke-width": 1 }, ga);
    // Namen der vier Felder wie im Original, außen an den Ecken (oben bzw. unten), das günstige Feld fett
    const gq = sv("g", { id: "pa-quadranten" }, svg);
    [[0, links, oben - 10, "start"], [1, links + PW, oben - 10, "end"], [2, links, oben + PH + 16, "start"], [3, links + PW, oben + PH + 16, "end"]]
      .forEach(([q, x, y, a]) => sv("text", { x, y, dy: "0.35em", "text-anchor": a, class: "muted",
        style: q === 1 ? "font-weight:bold;fill:#1A1A1A" : "" }, gq, QNAME[q]));
    // Achsen: Enden beschriftet (gering/hoch), wie im Original ohne Zahlenskala
    sv("text", { x: links - 6, y: oben + 8, dy: "0.35em", "text-anchor": "end", class: "muted" }, ga, "gering");
    sv("text", { x: links - 6, y: oben + PH - 8, dy: "0.35em", "text-anchor": "end", class: "muted" }, ga, "hoch");
    sv("text", { x: links - 6, y: sy(5), dy: "0.35em", "text-anchor": "end", class: "muted" }, ga, "Risiko");
    const yx = oben + PH + 38;
    sv("text", { x: links, y: yx, dy: "0.35em", class: "muted" }, ga, "gering");
    sv("text", { x: sx(5), y: yx, dy: "0.35em", "text-anchor": "middle", class: "muted" }, ga, "Wert (Opportunity Score)");
    sv("text", { x: links + PW, y: yx, dy: "0.35em", "text-anchor": "end", class: "muted" }, ga, "hoch");
    // Kreise: Fläche = Kapitalwert
    const nMax = Math.max(...PRO.map(p => p.npv)), RMAX = 31, rad = v => Math.sqrt(v / nMax) * RMAX;
    const gk = sv("g", { id: "pa-kreise" }, svg);
    PRO.slice().sort((a, c) => c.npv - a.npv).forEach(p => {
      const blass = (S.kat !== null && p.k !== S.kat) || (S.projekt !== null && p.name !== S.projekt);
      const g = sv("g", { class: "dk-klick" + (blass ? " dk-blass" : ""), "data-name": p.name }, gk);
      const cx = sx(p.x), cy = sy(p.r), r = rad(p.npv);
      const c = sv("circle", { cx, cy, r, fill: F_KAT[p.k], stroke: p.k === 3 ? "#9A9A9A" : "#FFFFFF", "stroke-width": 1.5 }, g);
      sv("text", { x: cx, y: cy, dy: "0.35em", "text-anchor": "middle", style: `fill:${T_KAT[p.k]};font-weight:bold;pointer-events:none` }, g, p.name);
      c.addEventListener("click", () => { S.projekt = S.projekt === p.name ? null : p.name; zeichnen(); });
      tooltip(c, () => [`Projekt ${p.name} · ${KAT[p.k]}`, `Wert ${zahl(p.x, 1)} · Risiko ${zahl(p.r, 1)} (0 gering bis 10 hoch)`,
        `Kapitalwert über 5 Jahre: ${mio(p.npv)}`, QNAME[quadrant(p)], "Klick hebt das Projekt hervor"]);
    });
    // Legende rechts: Kategorien (Grauton) und Kreisgrößen
    const gl = sv("g", { id: "pa-legende" }, svg), lx = breite - LEG;
    sv("text", { x: lx, y: oben + 2, dy: "0.35em", class: "muted" }, gl, "Kategorie");
    KAT.forEach((k, i) => {
      sv("rect", { x: lx, y: oben + 16 + i * 20, width: 12, height: 12, fill: F_KAT[i], stroke: i === 3 ? "#9A9A9A" : "none" }, gl);
      sv("text", { x: lx + 18, y: oben + 22 + i * 20, dy: "0.35em" }, gl, k);
    });
    const y0 = oben + 118;
    sv("text", { x: lx, y: y0, dy: "0.35em", class: "muted" }, gl, "Kapitalwert");
    let yy = y0 + 16;
    [1, 3, 6].forEach(v => {
      const r = rad(v);
      sv("circle", { cx: lx + RMAX * 0.95, cy: yy + r, r, fill: "none", stroke: "#8C8C8C", "stroke-width": 1 }, gl);
      sv("text", { x: lx + RMAX * 0.95, y: yy + r, dy: "0.35em", "text-anchor": "middle", class: "muted" }, gl, zahl(v));
      yy += 2 * r + 8;
    });
    sv("text", { x: lx, y: yy + 6, dy: "0.35em", class: "muted" }, gl, "Mio. €");
  }

  /* ---------- b) Gepackte Blasen ---------- */
  function botschaftB(b) {
    const ges = BEG.reduce((s, x) => s + x.n, 0);
    if (S.begriff !== null) {
      const x = BEG[S.begriff];
      return passt([`${x.name}: ${zahl(x.n)} Nennungen (${pz(x.n / ges, 1)}), Stimmung ${ST[x.s]}`, `${x.name}: ${zahl(x.n)} Nennungen`], b);
    }
    if (S.stimmung !== null) {
      const xs = BEG.filter(x => x.s === S.stimmung).sort((p, q) => q.n - p.n), n = xs.reduce((s, x) => s + x.n, 0);
      return passt([`${ST[S.stimmung]}: ${pz(n / ges)} der Nennungen, vor allem ${xs[0].name} und ${xs[1].name}`,
        `${ST[S.stimmung]}: ${pz(n / ges)} der Nennungen`], b);
    }
    const neg = BEG.filter(x => x.s === 0).sort((p, q) => q.n - p.n);
    return passt([`${neg[0].name} ist der häufigste negative Begriff (${zahl(neg[0].n)} Nennungen)`,
      `${neg[0].name} ist der häufigste negative Begriff`], b);
  }
  // Kreise dicht packen: der Reihe nach (groß zuerst) an der Stelle anlegen, die der Mitte am nächsten liegt
  function packen(radien) {
    const pos = [];
    radien.forEach((r, i) => {
      if (!i) { pos.push({ x: 0, y: 0, r }); return; }
      let best = null;
      pos.forEach(p => {
        for (let k = 0; k < 36; k++) {
          const a = k * Math.PI / 18, d = p.r + r + 2, x = p.x + d * Math.cos(a), y = p.y + d * Math.sin(a);
          const dist = Math.hypot(x, y * 1.08);
          if (best && dist >= best.dist) continue;
          if (pos.every(q => Math.hypot(q.x - x, q.y - y) >= q.r + r + 1.5)) best = { x, y, dist };
        }
      });
      pos.push({ x: best.x, y: best.y, r });
    });
    return pos;
  }
  function begriffe(ziel, breite, hoehe) {
    ziel.textContent = "";
    const svg = sv("svg", { width: breite, height: hoehe, role: "img", "aria-label": "Begriffe in Kundenbewertungen, Kreisfläche = Nennungen" }, ziel);
    // Legende oben
    const gl = sv("g", { id: "pb-legende" }, svg);
    let lx = 0;
    ST.forEach((s, i) => {
      sv("rect", { x: lx, y: 2, width: 12, height: 12, fill: F_ST[i], stroke: R_ST[i] }, gl);
      sv("text", { x: lx + 18, y: 8, dy: "0.35em", class: "muted" }, gl, s);
      lx += 18 + DK.tw(s) + 18;
    });
    sv("text", { x: breite, y: 8, dy: "0.35em", "text-anchor": "end", class: "muted" }, gl, "Kreisfläche = Nennungen");
    const oben = 24, H = hoehe - oben;
    const sortiert = BEG.slice().sort((a, b) => b.n - a.n), nMax = sortiert[0].n;
    let pos = packen(sortiert.map(x => Math.sqrt(x.n / nMax) * 60));
    const minX = Math.min(...pos.map(p => p.x - p.r)), maxX = Math.max(...pos.map(p => p.x + p.r));
    const minY = Math.min(...pos.map(p => p.y - p.r)), maxY = Math.max(...pos.map(p => p.y + p.r));
    const s = Math.min((breite - 2) / (maxX - minX), (H - 2) / (maxY - minY));
    const ox = (breite - (maxX - minX) * s) / 2 - minX * s, oy = oben + (H - (maxY - minY) * s) / 2 - minY * s;
    const gk = sv("g", { id: "pb-kreise" }, svg);
    sortiert.forEach((x, j) => {
      const p = pos[j], cx = ox + p.x * s, cy = oy + p.y * s, r = p.r * s;
      const blass = (S.stimmung !== null && x.s !== S.stimmung) || (S.begriff !== null && x.i !== S.begriff);
      const g = sv("g", { class: "dk-klick" + (blass ? " dk-blass" : ""), "data-name": x.name }, gk);
      const c = sv("circle", { cx, cy, r, fill: F_ST[x.s], stroke: R_ST[x.s], "stroke-width": 1 }, g);
      c.addEventListener("click", () => { S.begriff = S.begriff === x.i ? null : x.i; zeichnen(); });
      const ges = BEG.reduce((t, y) => t + y.n, 0);
      tooltip(c, () => [x.name, `${zahl(x.n)} Nennungen · ${pz(x.n / ges, 1)} aller Nennungen`, `Stimmung: ${ST[x.s]}`, "Klick hebt den Begriff hervor"]);
      // Beschriftung: Varianten von ausführlich nach knapp; jede Zeile muss in die Sehne des Kreises auf ihrer Höhe passen
      const teile = TRENN[x.name] || null, n = zahl(x.n);
      const varianten = [[x.name, n], [x.name], ...(teile ? [[...teile, n], teile] : [])];
      const passtIn = zeilen => zeilen.every((z, j) => {
        const dy = Math.abs((j - (zeilen.length - 1) / 2) * 16) + 8;
        return dy < r && DK.tw(z, 14, z === n) <= 2 * Math.sqrt(r * r - dy * dy) - 4;
      });
      const zeilen = varianten.find(passtIn);
      if (zeilen) {
        const t = sv("text", { x: cx, y: cy - (zeilen.length - 1) * 8, dy: "0.35em", "text-anchor": "middle", style: `fill:${T_ST[x.s]};pointer-events:none` }, g);
        zeilen.forEach((z, j) => sv("tspan", { x: cx, dy: j ? 16 : 0, ...(z === n && j ? { style: "font-weight:bold" } : {}) }, t, z));
      }
    });
  }

  /* ---------- Datenschnitte ---------- */
  DK.schnitt(bFilter, "a) Kategorie", "knoepfe", {
    optionen: [["alle", "Alle"], ...KAT.map((k, i) => [String(i), k])], wert: "alle",
    onChange: v => { S.kat = v === "alle" ? null : Number(v); S.projekt = null; zeichnen(); } });
  const stSel = DK.schnitt(bFilter, "b) Stimmung", "knoepfe", {
    optionen: [["alle", "Alle"], ...ST.map((s, i) => [String(i), s])], wert: "alle",
    onChange: v => { S.stimmung = v === "alle" ? null : Number(v); S.begriff = null; zeichnen(); } });
  stSel.parentNode.style.marginLeft = "auto";

  /* ---------- Zeichnen ---------- */
  function zeichnen() {
    DK.kopf(bKopf, { titel: "Blasendiagramme",
      untertitel: "a) Projektportfolio nach Wert, Risiko und Kapitalwert · b) Begriffe in Kundenbewertungen eines Online-Shops, 1. Halbjahr 2027",
      quelle: "", legende: [] });
    let v = DK.visual(bA, { titel: "a) Projektportfolio", einheit: "Kapitalwert über 5 Jahre in Mio. €", botschaft: botschaftA(560) });
    portfolio(v.flaeche, v.breite, v.hoehe);
    v = DK.visual(bB, { titel: "b) Begriffe in Kundenbewertungen", einheit: "Nennungen", botschaft: botschaftB(412) });
    begriffe(v.flaeche, v.breite, v.hoehe);
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  /* ---------- Lernplattform: Designregeln, Nachbau, Tabellen, CSV ---------- */
  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "v-portfolio", anker: "links", versatz: [520, 26], regel: "SAY – Botschaft vermitteln", titel: "Eine Aussage je Diagramm",
        text: "Unter jedem Titel steht ein Satz, was das Diagramm zeigt – etwa, dass nur zwei Projekte hohen Wert mit geringem Risiko verbinden. Die Originale hatten keine Aussage, das zweite nicht einmal einen Titel." },
      { nr: 2, ziel: "pa-legende", anker: "links", versatz: [135, 4], regel: "UNIFY – Semantische Notation", titel: "Grautöne für Kategorien",
        text: "Die vier Projektkategorien unterscheiden sich durch Grautöne. Das Original nutzte Grün, Orange, Blau und Rot – Farben, die im Buch für günstige und ungünstige Abweichungen reserviert sind." },
      { nr: 3, ziel: "pa-legende", anker: "links", versatz: [80, 140], regel: "CHECK – Visuelle Integrität", titel: "Kreisfläche maßstabsgetreu",
        text: "Die Kreisfläche ist proportional zum Kapitalwert; die Legende zeigt Referenzkreise für 1, 3 und 6 Mio. €. Das Original teilte die Projekte in vier Größenklassen ein (unter 1 Mio. $ bis über 5 Mio. $) – ein Projekt mit 5,1 Mio. $ sah dort aus wie eines mit 20 Mio. $." },
      { nr: 4, ziel: "pa-quadranten", anker: "links", versatz: [46, 32], regel: "SIMPLIFY – Überflüssiges weglassen", titel: "Ohne Farbverlauf und Glanz",
        text: "Die grünen und roten Farbverläufe in den Ecken und der 3D-Glanz der Kreise entfallen; die Namen der vier Felder stehen außen an den Ecken, damit sie keinen Kreis verdecken, das günstige Feld fett." },
      { nr: 5, ziel: "pa-achsen", anker: "links", versatz: [7, 186], regel: "STRUCTURE – Inhalte ordnen", titel: "Risikoachse beschriftet",
        text: "Wie im Original steht geringes Risiko oben, damit das günstige Feld oben rechts liegt. Beide Achsen sind an den Enden mit „gering“ und „hoch“ beschriftet; im Original fehlte jede Angabe, Teilstriche hatten keine Werte." },
      { nr: 6, ziel: "pb-legende", anker: "links", versatz: [254, 4], regel: "UNIFY – Semantische Notation", titel: "Farbe nur für die Stimmung",
        text: "Rot sind negative, Blaugrün positive, Grau neutrale Begriffe – dieselbe Bedeutung wie bei Abweichungen. Negative Begriffe sind kräftig gefärbt, damit sie auch im Schwarz-Weiß-Druck dunkler erscheinen als positive. Im Original war die Bedeutung von Blau, Orange und Rot nicht erklärt." },
      { nr: 7, ziel: "pb-kreise", anker: "links", versatz: [40, 300], regel: "EXPRESS – Lesbar beschriften", titel: "Begriffe ungekürzt",
        text: "Ein Begriff steht nur in Kreisen, in die er vollständig passt, große Kreise nennen zusätzlich die Zahl. Das Original schnitt Wörter an („Vashingto“, „Rajnati Singh“); kleine Kreise nennen ihren Begriff hier im Tooltip." },
      { nr: 8, ziel: "filter", anker: "links", versatz: [560, -2], regel: "CONDENSE – Filtern und hervorheben", titel: "Datenschnitte und Klick",
        text: "Die Datenschnitte heben eine Kategorie (a) bzw. eine Stimmung (b) hervor, ein Klick auf einen Kreis das einzelne Projekt bzw. den Begriff; die Aussage passt sich an. Esc hebt die Auswahl auf." },
    ],
    nachbauIntro: "Seitengröße 1024 × 646 px. Schrift Arial: Beschriftungen 10,5 pt, Visualtitel 12 pt. Datenmodell: Tabelle Projekte (Projekt, Kategorie, Wert, Risiko, Kapitalwert) und Tabelle Begriffe (Begriff, Stimmung, Nennungen); in der CSV-Datei durch die Spalte „Ebene“ getrennt.",
    nachbau: [
      { id: "A", ziel: "v-portfolio", versatz: [0, 0], titel: "a) Projektportfolio", visual: "Punktdiagramm (Standardvisual)",
        felder: "Werte: Projekt; Legende: Kategorie; X-Achse: Wert; Y-Achse: Risiko; Größe: Kapitalwert",
        format: "Y-Achse umkehren (Achse › Umkehren); Konstantenlinien X = 5 und Y = 5; Datenfarben #3A3F44, #6E747A, #A9A9A9, #D4D4D4; Kategoriebeschriftung ein; Legende rechts",
        hinweis: "Die Feldnamen in den Ecken sind Textfelder über dem Visual." },
      { id: "B", ziel: "v-begriffe", versatz: [0, 0], titel: "b) Begriffe", visual: "Kein Standardvisual – Wortwolke (zertifiziertes Visual „Word Cloud“) oder Treemap",
        felder: "Kategorie: Begriff; Werte: Nennungen; Farbe nach Stimmung über bedingte Formatierung",
        format: "Negativ #C62828, positiv #A6D2CB, neutral #EFEFEF",
        hinweis: "Gepackte Blasen bieten Power BI und Excel nicht an; die Treemap zeigt dieselbe Information mit genauer vergleichbaren Flächen." },
      { id: "C", ziel: "filter", anker: "links", versatz: [124, -2], titel: "Datenschnitte", visual: "Datenschnitt (2×)",
        felder: "Kategorie und Stimmung als Kacheln", format: "Ausgewählt #3A3F44 mit weißer Schrift, sonst weiß mit Rahmen #9A9A9A" },
    ],
    theme: DK.thema(),
    csv: { name: "bubble_chart_daten.csv", text: () => {
      const k = ["Ebene;Name;Kategorie_oder_Stimmung;Wert;Risiko;Kapitalwert_Mio_EUR;Nennungen"];
      PRO.forEach(p => k.push(["Projekt", p.name, KAT[p.k], zahl(p.x, 1), zahl(p.r, 1), zahl(p.npv, 1), ""].join(";")));
      BEG.forEach(b => k.push(["Begriff", b.name, ST[b.s], "", "", "", b.n].join(";")));
      return k.join("\r\n"); } },
    tabellen: () => {
      const ges = BEG.reduce((s, x) => s + x.n, 0);
      return [
        { titel: "a) Projekte", kopf: ["Projekt", "Kategorie", "Wert", "Risiko", "Kapitalwert in Mio. €", "Feld"],
          zeilen: PRO.slice().sort((a, b) => b.npv - a.npv).map(p => [p.name, KAT[p.k], zahl(p.x, 1), zahl(p.r, 1), zahl(p.npv, 1), QNAME[quadrant(p)]]) },
        { titel: "b) Begriffe", kopf: ["Begriff", "Stimmung", "Nennungen", "Anteil"],
          zeilen: BEG.slice().sort((a, b) => b.n - a.n).map(b => [b.name, ST[b.s], zahl(b.n), pz(b.n / ges, 1)]) },
      ];
    },
  });
  zeichnen();
})();
