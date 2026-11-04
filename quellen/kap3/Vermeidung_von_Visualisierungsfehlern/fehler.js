/* Einzelvisual „Vermeidung von Visualisierungsfehlern“ (Abb. 3.41) – Negativbeispiel mit Korrektur.
   Seite 727 x 592 px = 110 x 89,6 mm. Daten: fehler.json (daten_fehler.py), Werte des Originals (Umsatz je
   Produktgruppe: Luxusmodelle 6,12, Sondermodelle 3,82, Standardmodelle 8,53 Mio. €).
   a) die fehlerhafte Darstellung des Originals – die acht Fehler bleiben bewusst sichtbar (übergenaue Skala,
      grauer Hintergrund, Gitterlinien, fehlende Werte, Rahmen, breite Säulen mit Rahmen, Legende, alphabetische
      Sortierung); nur Schrift und Farben im Buchstil, nummerierte Punkte statt Pfeilen mit Text.
   b) die korrigierte Darstellung (waagerechte Balken, absteigend, Werte direkt beschriftet).
   Interaktion: Klick auf einen Fehler (Liste oder Punkt) hebt ihn im Diagramm hervor; das Kästchen davor behebt ihn in a),
   „Alle behoben“ verwandelt a) in b). Klick auf eine Säule bzw. einen Balken hebt die Produktgruppe in a) und b) hervor;
   Esc hebt auf. */
(() => {
  "use strict";
  const { zahl, NBSP, el, sv, FARBE } = DK;
  const W0 = DATA.werte.map(([name, wert], i) => ({ i, name, wert }));
  const MAXA = DATA.achse_max, SCHRITT = DATA.achse_schritt;
  const GES = W0.reduce((s, w) => s + w.wert, 0);
  const SORT = W0.slice().sort((a, b) => b.wert - a.wert);
  const mio = (v, nk = 2) => zahl(v / 1e6, nk);
  const pz = (a, b) => zahl(a / b * 100, 0) + NBSP + "%";
  const ROT = "#C62828";
  const FEHLER = [
    { kurz: "Skala übergenau", orig: "Skala übergenau", fixKurz: "Werte in Mio. € statt neunstelliger Skala",
      warum: "Neun Stellen je Achsenwert (9.000.000), gelesen werden nur die Millionen." },
    { kurz: "Störender Hintergrund", orig: "unnötiger, störender Hintergrund", fixKurz: "weißer statt grauer Hintergrund",
      warum: "Die graue Fläche trägt keine Information und senkt den Kontrast." },
    { kurz: "Hilfslinien ohne Nutzen", orig: "Hilfslinien, die nicht helfen", fixKurz: "Gitterlinien weglassen",
      warum: "Dunkle Gitterlinien konkurrieren mit den Säulen; genaue Werte liefern sie trotzdem nicht." },
    { kurz: "Fehlende Zahlenwerte", orig: "fehlende Zahlenbeschriftung", fixKurz: "Werte direkt an die Balken schreiben",
      warum: "Die Umsätze lassen sich nur an der Skala schätzen." },
    { kurz: "Überflüssiger Rahmen", orig: "Überflüssiger Rahmen", fixKurz: "Rahmen weglassen",
      warum: "Der Rahmen um das Diagramm trennt nichts, was getrennt werden müsste." },
    { kurz: "Säulen zu breit, mit Rahmen", orig: "Säulen zu groß, zu breit, überflüssiger Rahmen", fixKurz: "schmalere Balken ohne Rahmen",
      warum: "Breite, umrandete Säulen wirken schwer; der Rahmen verdoppelt jede Kante." },
    { kurz: "Umständliche Legende", orig: "umständliche Legende", fixKurz: "Legende weglassen, Einheit in den Titel",
      warum: "Eine Legende für eine einzige Datenreihe wiederholt nur den Titel – und das weit entfernt vom Inhalt." },
    { kurz: "Falsche Sortierung, Diagrammtyp", orig: "Falsche Sortierung, besseren Grafiktyp wählen", fixKurz: "waagerechte Balken, absteigend sortiert",
      warum: "Alphabetische Reihenfolge erschwert den Vergleich; lange Namen passen schlecht unter Säulen." },
  ].map((f, i) => ({ nr: i + 1, ...f }));

  /* ---------- Zustand ---------- */
  const S = { behoben: new Set(), fehler: null, produkt: null };
  const fehlerWaehlen = nr => { S.fehler = S.fehler === nr ? null : nr; S.produkt = null; zeichnen(); };
  const produktWaehlen = i => { S.produkt = S.produkt === i ? null : i; S.fehler = null; zeichnen(); };
  const umschalten = nr => { if (S.behoben.has(nr)) S.behoben.delete(nr); else S.behoben.add(nr); zeichnen(); };
  addEventListener("keydown", e => {
    if (e.key === "Escape" && (S.fehler != null || S.produkt != null)) { S.fehler = null; S.produkt = null; zeichnen(); }
  });

  /* ---------- Layout ---------- */
  DK.init({ titel: "Vermeidung von Visualisierungsfehlern", breite: 727, hoehe: 592 });
  const bTA = DK.box("v-titel-a", 16, 8, 695, 46);
  const bA = DK.box("v-a", 16, 60, 695, 250);
  const bL = DK.box("v-liste", 16, 318, 695, 100);
  DK.haarlinie(426);
  const bB = DK.box("v-b", 16, 434, 695, 150);
  const tipEl = document.querySelector(".dk-tooltip");
  function tooltip(ziel, zeilenFn) {
    ziel.addEventListener("pointermove", ev => {
      tipEl.textContent = "";
      zeilenFn().forEach((z, i) => el(i === 0 ? "b" : "div", {}, tipEl, z));
      tipEl.style.display = "block";
      const r = tipEl.getBoundingClientRect();
      let x = ev.clientX + 14, y = ev.clientY + 14;
      if (x + r.width > innerWidth - 8) x = ev.clientX - r.width - 14;
      if (y + r.height > innerHeight - 8) y = ev.clientY - r.height - 14;
      tipEl.style.left = x + "px"; tipEl.style.top = y + "px";
    });
    ziel.addEventListener("pointerleave", () => { tipEl.style.display = "none"; });
  }
  const tipProdukt = w => [w.name, `Umsatz ${mio(w.wert)} Mio. € (${zahl(w.wert)} €)`,
    `Anteil ${pz(w.wert, GES)} von ${mio(GES)} Mio. € · Rang ${SORT.indexOf(w) + 1} von ${W0.length}`,
    "Klick hebt die Produktgruppe in a) und b) hervor"];
  const tipFehler = F => [`${F.nr}. ${F.kurz}`, `Im Original: „${F.orig}“`, F.warum, `Korrektur in b): ${F.fixKurz}`,
    S.behoben.has(F.nr) ? "In a) behoben – Kästchen stellt den Fehler wieder her" : "Klick hebt hervor, Kästchen behebt den Fehler in a)"];
  const blassP = w => S.produkt != null && S.produkt !== w.i;

  /* ---------- a) fehlerhafte Darstellung, abhängig von den behobenen Fehlern ---------- */
  function zeichneA() {
    bA.textContent = "";
    const W = 695, H = 250, f = n => S.behoben.has(n);
    const svg = sv("svg", { width: W, height: H, role: "img", "aria-label": "Fehlerhaftes Säulendiagramm Umsatz je Produktgruppe" }, bA);
    const quer = f(8), achse = !(f(1) && f(3) && f(4)), legende = !f(7);
    const liste = quer ? SORT : W0;
    const plotR = legende ? W - 160 : W - 24;
    const fuell = f(6) ? FARBE.ist : "#6E747A";
    const rahmenS = f(6) ? {} : { stroke: "#1A1A1A", "stroke-width": 2.5 };
    const marken = [], regionen = {};
    if (!f(5)) { sv("rect", { x: 0.5, y: 0.5, width: W - 1, height: H - 1, fill: "none", stroke: "#8C8C8C" }, svg);
                 marken.push([5, W - 18, 18]); regionen[5] = [[2, 2, W - 4, H - 4]]; }
    const tickText = v => (f(1) ? zahl(v / 1e6) : zahl(v));
    const schritt = quer && !f(1) ? 3 * SCHRITT : SCHRITT;
    const ticks = []; for (let v = 0; v <= MAXA; v += schritt) ticks.push(v);
    const gitter = []; for (let v = SCHRITT; v <= MAXA; v += SCHRITT) gitter.push(v);
    const gitterFarbe = S.fehler === 3 && !f(3) ? ROT : "#6E747A";
    const T = 44;
    let L;
    if (!quer) {
      const lw = achse ? Math.ceil(Math.max(...ticks.map(v => DK.tw(tickText(v))))) + 12 : 0;
      L = 16 + lw;
      const B = H - 40, y = v => B - v / MAXA * (B - T);
      sv("text", { x: (L + plotR) / 2, y: 26, "text-anchor": "middle", style: "font-size:16px;font-weight:bold" }, svg,
         "Umsatz" + (f(1) ? " in Mio. €" : ""));
      if (!f(2)) { sv("rect", { x: L, y: T, width: plotR - L, height: B - T, fill: "#D4D4D4" }, svg); regionen[2] = [[L, T, plotR - L, B - T]]; }
      if (!f(3)) gitter.forEach(v => sv("line", { x1: L, x2: plotR, y1: y(v), y2: y(v), stroke: gitterFarbe, "stroke-width": 1 }, svg));
      if (achse) {
        const g = sv("g", { id: "va-achse" }, svg);
        ticks.forEach(v => sv("text", { x: L - 8, y: y(v), dy: "0.35em", "text-anchor": "end" }, g, tickText(v)));
        if (!f(1)) { marken.push([1, L - 44, 22]); regionen[1] = [[14, T - 10, lw - 2, B - T + 20]]; }
      }
      sv("line", { x1: L, x2: plotR, y1: B + 0.5, y2: B + 0.5, stroke: "#8C8C8C" }, svg);
      const slot = (plotR - L) / liste.length, cw = slot * (f(6) ? 0.42 : 0.62);
      const sg = sv("g", { id: "va-saeulen" }, svg);
      liste.forEach((w, k) => {
        const cx = L + slot * (k + 0.5);
        const g = sv("g", { class: "dk-klick" + (blassP(w) ? " dk-blass" : "") }, sg);
        sv("rect", { x: cx - cw / 2, y: y(w.wert), width: cw, height: B - y(w.wert), fill: fuell, ...rahmenS }, g);
        if (f(4)) sv("text", { x: cx, y: y(w.wert) - 7, "text-anchor": "middle" }, g, mio(w.wert));
        sv("text", { x: cx, y: H - 15, "text-anchor": "middle" }, g, w.name);
        const hit = sv("rect", { x: cx - slot / 2, y: T, width: slot, height: H - T, fill: "transparent" }, g);
        hit.addEventListener("click", () => produktWaehlen(w.i));
        tooltip(hit, () => tipProdukt(w));
      });
      const max = liste.reduce((a, b) => (b.wert > a.wert ? b : a)), kMax = liste.indexOf(max);
      if (!f(2)) marken.push([2, L + 20, T + 30]);
      if (!f(3)) marken.push([3, L + 2 * slot, y(7 * SCHRITT)]);
      if (!f(4)) { marken.push([4, L + slot * (kMax + 0.5), y(max.wert) - 16]);
                   regionen[4] = liste.map((w, k) => [L + slot * (k + 0.5) - 26, y(w.wert) - 24, 52, 20]); }
      if (!f(6)) { marken.push([6, L + slot * 0.5, y(2 * SCHRITT)]);
                   regionen[6] = liste.map((w, k) => [L + slot * (k + 0.5) - cw / 2 - 4, y(w.wert) - 4, cw + 8, B - y(w.wert) + 8]); }
      marken.push([8, L + slot, H - 20]); regionen[8] = [[L, H - 32, plotR - L, 24]];
    } else {
      const lw = Math.ceil(Math.max(...liste.map(w => DK.tw(w.name)))) + 12;
      L = 16 + lw;
      const B = H - (achse ? 36 : 10), rechts = f(4) ? plotR - 44 : plotR;
      const x = v => L + v / MAXA * (rechts - L);
      sv("text", { x: (L + plotR) / 2, y: 26, "text-anchor": "middle", style: "font-size:16px;font-weight:bold" }, svg,
         "Umsatz" + (f(1) ? " in Mio. €" : ""));
      if (!f(2)) { sv("rect", { x: L, y: T, width: plotR - L, height: B - T, fill: "#D4D4D4" }, svg); regionen[2] = [[L, T, plotR - L, B - T]]; }
      if (!f(3)) gitter.forEach(v => sv("line", { x1: x(v), x2: x(v), y1: T, y2: B, stroke: gitterFarbe, "stroke-width": 1 }, svg));
      if (achse) {
        const g = sv("g", { id: "va-achse" }, svg);
        ticks.forEach(v => sv("text", { x: x(v), y: H - 14, "text-anchor": "middle" }, g, tickText(v)));
        if (!f(1)) { marken.push([1, L - 24, H - 19]); regionen[1] = [[L - 40, H - 30, rechts - L + 80, 24]]; }
      }
      sv("line", { x1: L - 0.5, x2: L - 0.5, y1: T, y2: B, stroke: "#8C8C8C" }, svg);
      const rh = (B - T) / liste.length, bh = rh * (f(6) ? 0.5 : 0.72);
      const sg = sv("g", { id: "va-saeulen" }, svg);
      liste.forEach((w, k) => {
        const cy = T + rh * (k + 0.5);
        const g = sv("g", { class: "dk-klick" + (blassP(w) ? " dk-blass" : "") }, sg);
        sv("text", { x: L - 8, y: cy, dy: "0.35em", "text-anchor": "end" }, g, w.name);
        sv("rect", { x: L, y: cy - bh / 2, width: x(w.wert) - L, height: bh, fill: fuell, ...rahmenS }, g);
        if (f(4)) sv("text", { x: x(w.wert) + 6, y: cy, dy: "0.35em" }, g, mio(w.wert));
        const hit = sv("rect", { x: 0, y: cy - rh / 2, width: plotR, height: rh, fill: "transparent" }, g);
        hit.addEventListener("click", () => produktWaehlen(w.i));
        tooltip(hit, () => tipProdukt(w));
      });
      if (!f(2)) marken.push([2, plotR - 20, B - 16]);
      if (!f(3)) marken.push([3, x(6 * SCHRITT), T + rh * 2.5]);
      if (!f(4)) { marken.push([4, x(liste[0].wert) + 18, T + rh * 0.5]);
                   regionen[4] = liste.map((w, k) => [x(w.wert) + 2, T + rh * (k + 0.5) - 11, 48, 22]); }
      if (!f(6)) { marken.push([6, x(2 * SCHRITT), T + rh * 0.5]);
                   regionen[6] = liste.map((w, k) => [L - 3, T + rh * (k + 0.5) - bh / 2 - 3, x(w.wert) - L + 6, bh + 6]); }
    }
    if (legende) {
      const lx = plotR + 22, ly = H / 2, g = sv("g", { id: "va-legende" }, svg);
      sv("rect", { x: lx, y: ly - 6, width: 12, height: 12, fill: fuell, ...rahmenS, "stroke-width": f(6) ? 0 : 1.5 }, g);
      sv("text", { x: lx + 18, y: ly, dy: "0.35em" }, g, "Umsatz");
      marken.push([7, lx + 18 + DK.tw("Umsatz") + 20, ly]); regionen[7] = [[lx - 8, ly - 14, DK.tw("Umsatz") + 34, 28]];
    }
    // Hervorhebung des gewählten Fehlers
    if (S.fehler != null && regionen[S.fehler])
      regionen[S.fehler].forEach(([x, y, w, h]) => sv("rect", { x, y, width: w, height: h, fill: "none", stroke: ROT,
        "stroke-width": 2, "stroke-dasharray": "5 3", "pointer-events": "none" }, svg));
    // nummerierte Fehlerpunkte
    marken.forEach(([nr, x, y]) => {
      const g = sv("g", { class: "dk-klick" + (S.fehler != null && S.fehler !== nr ? " dk-blass" : ""), id: "va-punkt-" + nr }, svg);
      sv("circle", { cx: x, cy: y, r: 11, fill: ROT, stroke: "#FFFFFF", "stroke-width": 1.5 }, g);
      sv("text", { x, y, dy: "0.35em", "text-anchor": "middle", style: "font-size:13px;font-weight:bold;fill:#FFFFFF" }, g, String(nr));
      g.addEventListener("click", () => fehlerWaehlen(nr));
      tooltip(g, () => tipFehler(FEHLER[nr - 1]));
    });
  }

  /* ---------- Fehlerliste ---------- */
  function zeichneListe() {
    bL.textContent = "";
    const svg = sv("svg", { width: 695, height: 100, role: "list" }, bL);
    FEHLER.forEach((F, i) => {
      const x0 = i < 4 ? 0 : 352, y = (i % 4) * 25, cy = y + 12.5, weg = S.behoben.has(F.nr);
      const g = sv("g", { class: "dk-klick" + (S.fehler != null && S.fehler !== F.nr ? " dk-blass" : ""), id: "vl-" + F.nr, role: "listitem" }, svg);
      const hit = sv("rect", { x: x0, y, width: 340, height: 25, fill: "transparent" }, g);
      hit.addEventListener("click", () => fehlerWaehlen(F.nr));
      tooltip(hit, () => tipFehler(F));
      const xm = DK.PRINT ? x0 + 11 : x0 + 34;
      if (!DK.PRINT) {
        const k = sv("g", { class: "dk-klick", "aria-label": "Fehler " + F.nr + " beheben" }, g);
        sv("rect", { x: x0 + 1.5, y: cy - 7.5, width: 15, height: 15, rx: 2, fill: weg ? FARBE.ist : "#FFFFFF", stroke: "#6E747A" }, k);
        if (weg) sv("path", { d: `M${x0 + 5} ${cy} l3 3.5 l6 -7`, fill: "none", stroke: "#FFFFFF", "stroke-width": 2 }, k);
        k.addEventListener("click", ev => { ev.stopPropagation(); umschalten(F.nr); });
        tooltip(k, () => [weg ? `Fehler ${F.nr} wiederherstellen` : `Fehler ${F.nr} in a) beheben`, `Korrektur: ${F.fixKurz}`]);
      }
      sv("circle", { cx: xm, cy, r: 10, fill: weg ? "#A9A9A9" : ROT }, g);
      sv("text", { x: xm, y: cy, dy: "0.35em", "text-anchor": "middle", style: "font-size:13px;font-weight:bold;fill:#FFFFFF" }, g, String(F.nr));
      sv("text", { x: xm + 18, y: cy, dy: "0.35em", class: weg ? "muted" : "",
                   style: weg ? "text-decoration:line-through" : "" }, g, F.kurz + (weg ? " – behoben" : ""));
    });
  }

  /* ---------- Botschaften ---------- */
  function botschaftA() {
    if (S.fehler != null) { const F = FEHLER[S.fehler - 1]; return `Fehler ${F.nr}: ${F.kurz} – besser: ${F.fixKurz}`; }
    if (S.produkt != null) {
      const w = W0[S.produkt];
      if (S.behoben.has(4)) return `${w.name}: ${mio(w.wert)} Mio. € – jetzt direkt ablesbar`;
      const a = Math.floor(w.wert / SCHRITT) * SCHRITT;
      return `${w.name}: an der Skala nur grob ablesbar, zwischen ${zahl(a)} und ${zahl(a + SCHRITT)} €`;
    }
    const k = FEHLER.length - S.behoben.size;
    if (k === FEHLER.length) return "8 Gestaltungsfehler – die Umsätze lassen sich nur an der übergenauen Skala schätzen";
    if (k === 0) return "Alle 8 Fehler behoben – die Darstellung entspricht jetzt b)";
    return `Noch ${k} von 8 Fehlern sichtbar – die Kästchen in der Liste beheben sie einzeln`;
  }
  function botschaftB() {
    if (S.produkt != null) { const w = W0[S.produkt]; return `${w.name}: ${mio(w.wert)} Mio. € = ${pz(w.wert, GES)} des Umsatzes von ${mio(GES)} Mio. €`; }
    const t = SORT[0];
    return `${t.name} bringen mit ${mio(t.wert)} Mio. € ${pz(t.wert, GES)} des Umsatzes, Sondermodelle nur ${pz(SORT[SORT.length - 1].wert, GES)}`;
  }

  /* ---------- Zeichnen ---------- */
  function zeichnen() {
    const zustand = S.behoben.size === 0 ? "alle" : S.behoben.size === FEHLER.length ? "keine" : "teil";
    DK.visual(bTA, { titel: "a) Mit Gestaltungsfehlern", einheit: "Umsatz in €", botschaft: botschaftA(),
      schalter: DK.PRINT ? undefined : { optionen: [["alle", "Alle Fehler"], ["keine", "Alle behoben"]], wert: zustand,
        onChange: v => { S.behoben = v === "keine" ? new Set(FEHLER.map(F => F.nr)) : new Set(); zeichnen(); } } });
    zeichneA();
    zeichneListe();
    const v = DK.visual(bB, { titel: "b) Korrigiert", einheit: "Umsatz je Produktgruppe in Mio. €", botschaft: botschaftB() });
    v.flaeche.id = "vb-balken";
    DK.balken(v.flaeche, { breite: v.breite - 40, hoehe: v.hoehe, zeilenhoehe: 32,
      zeilen: SORT.map(w => ({ key: w.i, label: w.name, wert: w.wert / 1e6 })), fmt: x => zahl(x, 2),
      auswahl: S.produkt, onClick: produktWaehlen, tooltip: z => tipProdukt(W0[z.key]), aria: "Umsatz je Produktgruppe in Mio. €" });
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  /* ---------- Lernplattform: Designregeln, Nachbau, Tabellen, CSV ---------- */
  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "v-a", anker: "links", versatz: [690, 52], regel: "CHECK – Negativbeispiel bleibt sichtbar", titel: "Die Fehler des Originals bleiben",
        text: "Teil a) zeigt die acht Gestaltungsfehler des Originals bewusst weiter: übergenaue Skala, grauer Hintergrund, Gitterlinien, fehlende Werte, Rahmen, breite umrandete Säulen, Legende und alphabetische Sortierung. Nur Schrift und Farben folgen dem Buchstil; nummerierte Punkte ersetzen die Pfeile mit Text." },
      { nr: 2, ziel: "v-liste", anker: "links", versatz: [690, 2], regel: "EXPRESS – Fehler einzeln beheben", titel: "Schritt für Schritt von a) nach b)",
        text: "Ein Klick auf einen Eintrag hebt den Fehler im Diagramm rot gestrichelt hervor; das Kästchen davor behebt ihn in a). „Alle behoben“ verwandelt a) in die Darstellung b). Esc hebt die Hervorhebung auf." },
      { nr: 3, ziel: "vb-balken", anker: "links", versatz: [500, 36], regel: "SIMPLIFY – Weglassen", titel: "Kein Hintergrund, Gitter, Rahmen, Legende",
        text: "Hintergrundfläche, Gitterlinien, Rahmen, Achse und Legende entfallen in b) ersatzlos – keines dieser Elemente trägt einen Wert. Was bleibt, sind Balken, Namen und Zahlen." },
      { nr: 4, ziel: "vb-balken", anker: "links", versatz: [500, 4], regel: "EXPRESS – Werte direkt beschriften", titel: "Zahlen am Balken statt Skala",
        text: "Jeder Balken trägt seinen Wert in Mio. € mit zwei Nachkommastellen. Die Skala „9.000.000“ in a) ist übergenau und lässt den Wert trotzdem nur auf eine Million genau schätzen." },
      { nr: 5, ziel: "vb-balken", anker: "links", versatz: [130, 4], regel: "STRUCTURE – Inhalte ordnen", titel: "Waagerechte Balken, absteigend sortiert",
        text: "Ohne natürliche Reihenfolge werden Kategorien nach Wert sortiert. Waagerechte Balken lassen links Platz für lange Namen; in a) stehen die Säulen alphabetisch und die Namen gedrängt darunter." },
      { nr: 6, ziel: "va-saeulen", anker: "links", versatz: [620, 60], regel: "UNIFY – Semantische Notation", titel: "Ist anthrazit, ohne Rahmen",
        text: "Die Balken in b) sind schmal, anthrazit und ohne Rahmen – die Notation für Istwerte im ganzen Buch. In a) sind die Säulen mittelgrau mit schwarzem Rahmen, damit der Fehler „Rahmen“ sichtbar bleibt; das Original zeigte blaue Säulen." },
      { nr: 7, ziel: "v-b", anker: "links", versatz: [690, 0], regel: "SAY – Botschaft vermitteln", titel: "Titel mit Einheit und Aussage",
        text: "Der Titel von b) nennt Inhalt und Einheit, die Zeile darunter die Erkenntnis. In a) steht wie im Original nur „Umsatz“ ohne Einheit, und die Legende wiederholt das Wort." },
    ],
    nachbauIntro: "Standard-Visuals von Power BI Desktop. Seitengröße benutzerdefiniert 727 × 592 px. Schrift Arial: Beschriftungen 10,5 pt, Titel 12 pt. Datenmodell: Tabelle Umsatz (Produktgruppe, Umsatz) wie in der CSV-Datei.",
    nachbau: [
      { id: "A", ziel: "vb-balken", anker: "links", versatz: [500, 4], titel: "b) Korrigierte Darstellung", visual: "Gruppiertes Balkendiagramm",
        felder: "Y-Achse: Produktgruppe; X-Achse: Umsatz (Summe); Sortierung absteigend nach Umsatz",
        format: "Datenbeschriftungen an, Anzeigeeinheit Millionen, 2 Dezimalstellen; X-Achse aus; Gitternetzlinien aus; Legende aus; Hintergrund und Rahmen des Visuals aus; Datenfarbe #3A3F44; Titel „Umsatz je Produktgruppe in Mio. €“" },
      { id: "B", ziel: "va-saeulen", anker: "links", versatz: [620, 60], titel: "a) Fehlerhafte Darstellung (zum Vergleich)", visual: "Gruppiertes Säulendiagramm",
        felder: "X-Achse: Produktgruppe (Sortierung nach Produktgruppe aufsteigend); Y-Achse: Umsatz",
        format: "Plotbereich-Hintergrund #D4D4D4; Gitternetzlinien an; Y-Achse Anzeigeeinheit „Keine“; Legende rechts an; Rahmen des Visuals an; Spaltenrahmen an",
        hinweis: "Nur zur Demonstration: Jeder Fehler aus a) entspricht einer Einstellung, die man für b) ausschaltet oder ändert." },
    ],
    theme: DK.thema(),
    csv: { name: "umsatz_produktgruppen_daten.csv", text: () => ["Produktgruppe;Umsatz_EUR;Umsatz_Mio_EUR",
      ...W0.map(w => `${w.name};${w.wert};${zahl(w.wert / 1e6, 2)}`)].join("\r\n") },
    tabellen: () => [
      { titel: "Umsatz je Produktgruppe", kopf: ["Produktgruppe", "Umsatz (€)", "Umsatz (Mio. €)", "Anteil"],
        zeilen: [...SORT.map(w => [w.name, zahl(w.wert), mio(w.wert), pz(w.wert, GES)]), ["Summe", zahl(GES), mio(GES), "100" + NBSP + "%"]] },
      { titel: "Gestaltungsfehler in a)", kopf: ["Nr.", "Fehler", "Status in a)", "Korrektur in b)"],
        zeilen: FEHLER.map(F => [String(F.nr), F.kurz, S.behoben.has(F.nr) ? "behoben" : "sichtbar", F.fixKurz]) },
    ],
  });
  zeichnen();
})();
