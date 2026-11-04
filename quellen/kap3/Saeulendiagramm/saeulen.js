/* Einzelvisual „Säulendiagramm“ (Abb. 3.48): Umsatz der SGE A je Quartal, Plan und Ist.
   Seite 727 x 360 px = 110 x 54,5 mm. Daten: saeulen.json (daten_saeulen.py), Werte des Originals.
   Diagrammtyp bleibt: Säulen je Quartal für Plan und Ist. Notation nach IBCS: Ist anthrazit gefüllt, Plan weiß mit
   Kontur, leicht versetzt dahinter; darunter die Abweichung Ist − Plan, farbig nach Wirkung. Klick auf ein Quartal
   hebt es hervor. */
(() => {
  "use strict";
  const { zahl, delta, NBSP, sv, el, FARBE } = DK;
  const Q = DATA.quartale, PL = DATA.plan, IST = DATA.ist, J = DATA.jahr;
  const QLANG = ["1. Quartal", "2. Quartal", "3. Quartal", "4. Quartal"];
  const S = { auswahl: null };
  const auswaehlen = i => { S.auswahl = S.auswahl === i ? null : i; zeichnen(); };
  addEventListener("keydown", e => { if (e.key === "Escape" && S.auswahl !== null) { S.auswahl = null; zeichnen(); } });

  DK.init({ titel: "Säulendiagramm", breite: 727, hoehe: 360 });
  const bVis = DK.box("v-saeulen", 16, 10, 695, 342);

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

  function botschaft(b) {
    const passt = k => k.find(t => DK.tw(t) <= b) || k[k.length - 1];
    if (S.auswahl !== null) {
      const i = S.auswahl, d = dpl(i);
      return passt([`${QLANG[i]}: Ist ${zahl(IST[i])} bei Plan ${zahl(PL[i])} Mio. €, ΔPL ${delta(d, 0)} (${delta(d / PL[i] * 100, 1, NBSP + "%")})`]);
    }
    const idx = Q.map((q, i) => i), ueber = idx.filter(i => dpl(i) > 0), unter = idx.filter(i => dpl(i) < 0), ds = summe(IST) - summe(PL);
    const liste = is => (is.length > 2 && is[is.length - 1] - is[0] === is.length - 1 ? `${Q[is[0]]} bis ${Q[is[is.length - 1]]}` : is.map(i => Q[i]).join(", "));
    const teil = unter.length ? `${liste(unter)} ${zahl(Math.abs(summe(unter.map(dpl))))} Mio. € unter Plan` : "kein Quartal unter Plan";
    const jahr = `Jahr ${delta(ds, 0)} Mio. € (${delta(ds / summe(PL) * 100, 1, NBSP + "%")})`;
    return passt([ueber.length ? `Ist über Plan in ${liste(ueber)}, ${teil}; ${jahr}` : `${teil}; ${jahr}`, `${teil}; ${jahr}`]);
  }

  function saeulen(ziel, breite, hoehe) {
    ziel.textContent = "";
    const svg = sv("svg", { width: breite, height: hoehe, role: "img", "aria-label": `Säulendiagramm: Umsatz SGE A ${J} je Quartal, Plan und Ist` }, ziel);
    // Legende rechts oben
    const gl = sv("g", { id: "sa-legende" }, svg);
    const lx = breite - DK.tw("Plan") - DK.tw("Ist") - 60;
    sv("rect", { x: lx, y: 2, width: 12, height: 12, fill: "#3A3F44" }, gl);
    sv("text", { x: lx + 18, y: 8, dy: "0.35em", class: "muted" }, gl, "Ist");
    const lx2 = lx + 18 + DK.tw("Ist") + 16;
    sv("rect", { x: lx2 + 0.5, y: 2.5, width: 11, height: 11, fill: "#FFFFFF", stroke: "#3A3F44", "stroke-width": 1 }, gl);
    sv("text", { x: lx2 + 18, y: 8, dy: "0.35em", class: "muted" }, gl, "Plan");
    // Säulen: gemeinsamer Maßstab ab Null, Wertbeschriftung über Ist, Abweichung unter der Achse
    const oben = 40, unten = 64, H = hoehe - oben - unten, links = 60, B = breite - links;
    const max = Math.max(...PL, ...IST), sy = v => oben + H - v / max * H;
    const fach = B / Q.length, sb = Math.min(64, fach * 0.42), vers = sb * 0.28;
    const gs = sv("g", { id: "sa-saeulen" }, svg), gd = sv("g", { id: "sa-abweichung" }, svg);
    sv("line", { x1: links, x2: breite, y1: oben + H, y2: oben + H, stroke: "#8C8C8C", "stroke-width": 1 }, gs);
    sv("text", { x: 0, y: oben + H + 52, dy: "0.35em", class: "muted" }, gd, "ΔPL");
    Q.forEach((q, i) => {
      const cx = links + fach * (i + 0.5), blass = S.auswahl !== null && S.auswahl !== i;
      const g = sv("g", { class: "dk-klick" + (blass ? " dk-blass" : ""), "data-name": q }, gs);
      sv("rect", { x: cx - sb / 2 - vers, y: sy(PL[i]), width: sb, height: oben + H - sy(PL[i]), fill: "#FFFFFF", stroke: "#3A3F44", "stroke-width": 1 }, g);
      sv("rect", { x: cx - sb / 2 + vers, y: sy(IST[i]), width: sb, height: oben + H - sy(IST[i]), fill: "#3A3F44" }, g);
      sv("text", { x: cx + vers, y: sy(Math.max(IST[i], PL[i])) - 8, "text-anchor": "middle", style: "font-weight:bold" }, g, zahl(IST[i]));
      sv("text", { x: cx, y: oben + H + 18, dy: "0.35em", "text-anchor": "middle" }, g, q);
      const hit = sv("rect", { x: cx - fach / 2, y: oben - 20, width: fach, height: H + 46, fill: "transparent" }, g);
      hit.addEventListener("click", () => auswaehlen(i));
      tooltip(hit, () => [`${QLANG[i]} ${J}`, `Ist ${zahl(IST[i])} Mio. € · Plan ${zahl(PL[i])} Mio. €`,
        `ΔPL ${delta(dpl(i), 0)} Mio. € (${delta(dpl(i) / PL[i] * 100, 1, NBSP + "%")})`, "Klick hebt das Quartal hervor"]);
      const d = dpl(i);
      sv("text", { x: cx, y: oben + H + 52, dy: "0.35em", "text-anchor": "middle", class: blass ? "dk-blass" : "",
        style: `font-weight:bold;fill:${FARBE[klasse(d)]}` }, gd, delta(d, 0));
    });
  }

  function zeichnen() {
    const ds = summe(IST) - summe(PL);
    const v = DK.visual(bVis, { titel: `Umsatz SGE A ${J} je Quartal`, einheit: "Mio. €", botschaft: botschaft(695) });
    saeulen(v.flaeche, v.breite, v.hoehe);
    if (DK._ebenenNeu) DK._ebenenNeu();
    return ds;
  }

  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "v-saeulen", anker: "links", versatz: [690, 26], regel: "SAY – Botschaft vermitteln", titel: "Kernaussage unter dem Titel",
        text: "Unter dem Titel steht, was die Säulen zeigen: Ist über Plan in den ersten drei Quartalen, im vierten darunter, im Jahr insgesamt über Plan. Das Original hatte nur die Überschrift „Umsatz SGE A“." },
      { nr: 2, ziel: "sa-legende", anker: "links", versatz: [-6, -2], regel: "UNIFY – Semantische Notation", titel: "Ist gefüllt, Plan als Kontur",
        text: "Szenarien folgen einer festen Notation: Ist anthrazit gefüllt, Plan weiß mit Kontur – in allen Abbildungen des Buches gleich. Das Original unterschied Plan und Ist durch Flieder und Bordeaux." },
      { nr: 3, ziel: "sa-saeulen", anker: "links", versatz: [190, 40], regel: "STRUCTURE – Inhalte ordnen", titel: "Plan hinter Ist",
        text: "Die Plansäule steht leicht versetzt hinter der Ist-Säule. So sieht man je Quartal sofort, ob Ist über oder unter Plan liegt, ohne zwei nebeneinanderstehende Säulen vergleichen zu müssen." },
      { nr: 4, ziel: "sa-abweichung", anker: "links", versatz: [70, 0], regel: "EXPRESS – Abweichung zeigen", titel: "Abweichung farbig nach Wirkung",
        text: "Unter jedem Quartal steht die Abweichung Ist − Plan, blaugrün bei Mehrumsatz, rot bei Minderumsatz. Im Original musste man die Differenz aus den Säulenbeschriftungen selbst ausrechnen." },
      { nr: 5, ziel: "sa-saeulen", anker: "links", versatz: [500, 40], regel: "SIMPLIFY – Überflüssiges weglassen", titel: "Ohne Achse und Gitternetz",
        text: "Die Werte stehen über den Säulen, deshalb entfallen Größenachse und Gitternetz. Die Säulen beginnen bei Null, die Längen bleiben vergleichbar." },
      { nr: 6, ziel: "sa-saeulen", anker: "links", versatz: [40, 200], regel: "CONDENSE – Hervorheben", titel: "Klick auf ein Quartal",
        text: "Ein Klick auf ein Quartal hebt es hervor; die Aussage nennt Ist, Plan und Abweichung absolut und relativ. Esc hebt die Auswahl auf." },
    ],
    nachbauIntro: "Seitengröße benutzerdefiniert 727 × 360 px. Schrift Arial: Beschriftungen 10,5 pt, Titel 12 pt. Datenmodell: Tabelle Umsatz (SGE, Jahr, Quartal, Plan, Ist) wie in der CSV-Datei.",
    nachbau: [
      { id: "A", ziel: "sa-saeulen", versatz: [0, 0], titel: "Säulen Plan und Ist", visual: "Gruppiertes Säulendiagramm (Standardvisual)",
        felder: "X-Achse: Quartal; Y-Achse: Plan, Ist", format: "Plan: Füllung weiß, Rahmen #3A3F44; Ist: #3A3F44; Datenbeschriftung nur für Ist; Y-Achse und Gitternetz aus; Abstand zwischen Reihen 0",
        hinweis: "Überlappende Säulen wie hier bietet das Standardvisual nicht; mit Abstand 0 stehen Plan und Ist direkt nebeneinander." },
      { id: "B", ziel: "sa-abweichung", anker: "links", versatz: [70, 0], titel: "Abweichung", visual: "Tabelle oder Matrix unter dem Diagramm",
        felder: "Measure ΔPL = SUM(Umsatz[Ist]) − SUM(Umsatz[Plan])", format: "Bedingte Schriftfarbe: > 0 #00806B, < 0 #C62828" },
    ],
    theme: DK.thema(),
    csv: { name: "saeulendiagramm_daten.csv", text: () => ["SGE;Jahr;Quartal;Plan_Mio_EUR;Ist_Mio_EUR",
      ...Q.map((q, i) => ["SGE A", J, q, PL[i], IST[i]].join(";"))].join("\r\n") },
    tabellen: () => [{ titel: `Umsatz SGE A ${J} (Mio. €)`, kopf: ["Quartal", "Plan", "Ist", "ΔPL", "ΔPL in %"],
      zeilen: [...Q.map((q, i) => [q, zahl(PL[i]), zahl(IST[i]), delta(dpl(i), 0), delta(dpl(i) / PL[i] * 100, 1)]),
        ["Jahr", zahl(summe(PL)), zahl(summe(IST)), delta(summe(IST) - summe(PL), 0), delta((summe(IST) / summe(PL) - 1) * 100, 1)]] }],
  });
  zeichnen();
})();
