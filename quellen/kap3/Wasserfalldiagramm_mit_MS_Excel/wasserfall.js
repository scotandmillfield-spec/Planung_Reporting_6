/* Einzelvisual „Wasserfalldiagramm mit MS Excel“ (Abb. 3.55): Monatsumsatz Dezember 2026 → Juni 2027 über die
   monatlichen Veränderungen. Seite 727 x 360 px = 110 x 54,5 mm. Daten: wasserfall.json (daten_wasserfall.py),
   Werte des Originals. Diagrammtyp bleibt: schwebende Säulen für die Veränderungen; neu sind Anfangs- und Endsäule,
   Vorzeichen an den Werten und Farbe nach Wirkung (Blaugrün/Rot). Klick auf eine Säule hebt sie hervor. */
(() => {
  "use strict";
  const { zahl, delta, NBSP, sv, el, FARBE } = DK;
  const [S0, V0] = DATA.start, [S1, V1] = DATA.ende;
  const D = DATA.deltas.map(([m, d], i) => ({ i, m, d }));
  const MLANG = { Jan: "Januar", Feb: "Februar", "Mär": "März", Apr: "April", Mai: "Mai", Jun: "Juni" };
  const S = { auswahl: null };
  const auswaehlen = i => { S.auswahl = S.auswahl === i ? null : i; zeichnen(); };
  addEventListener("keydown", e => { if (e.key === "Escape" && S.auswahl !== null) { S.auswahl = null; zeichnen(); } });

  DK.init({ titel: "Wasserfalldiagramm", breite: 727, hoehe: 360 });
  const bVis = DK.box("v-wasserfall", 16, 10, 695, 342);
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
      const x = D[S.auswahl], vor = V0 + D.slice(0, x.i).reduce((s, y) => s + y.d, 0);
      return passt([`${MLANG[x.m]}: ${delta(x.d, 0)} Mio. € (${delta(x.d / vor * 100, 1, NBSP + "%")}), von ${zahl(vor)} auf ${zahl(vor + x.d)} Mio. €`]);
    }
    const min = D.reduce((a, c) => (c.d < a.d ? c : a));
    return passt([`Umsatz steigt von ${zahl(V0)} auf ${zahl(V1)} Mio. € (${delta(V1 - V0, 0)}); stärkster Rückgang im ${MLANG[min.m]} (${delta(min.d, 0)})`,
      `Umsatz steigt von ${zahl(V0)} auf ${zahl(V1)} Mio. € (${delta(V1 - V0, 0)})`]);
  }

  function diagramm(ziel, breite, hoehe) {
    ziel.textContent = "";
    const svg = sv("svg", { width: breite, height: hoehe, role: "img", "aria-label": `Wasserfalldiagramm: Monatsumsatz ${S0} bis ${S1}` }, ziel);
    const n = D.length + 2, oben = 24, unten = 30, H = hoehe - oben - unten, fach = breite / n, sb = Math.min(58, fach * 0.62);
    let lauf = V0;
    const stufen = D.map(x => { const a = lauf; lauf += x.d; return { ...x, a, e: lauf }; });
    const max = Math.max(V0, V1, ...stufen.map(s => Math.max(s.a, s.e))), sy = v => oben + H - v / max * H;
    const gs = sv("g", { id: "wf-saeulen" }, svg), gv = sv("g", { id: "wf-veraenderung" }, svg);
    const summe = (k, wert, label, id) => {
      const cx = fach * (k + 0.5), g = sv("g", { id }, gs);
      sv("rect", { x: cx - sb / 2, y: sy(wert), width: sb, height: oben + H - sy(wert), fill: "#3A3F44" }, g);
      sv("text", { x: cx, y: sy(wert) - 8, "text-anchor": "middle", style: "font-weight:bold" }, g, zahl(wert));
      sv("text", { x: cx, y: oben + H + 16, dy: "0.35em", "text-anchor": "middle", style: "font-weight:bold" }, g, label);
      const hit = sv("rect", { x: cx - fach / 2, y: oben - 20, width: fach, height: H + 40, fill: "transparent" }, g);
      tooltip(hit, () => [label, `Monatsumsatz ${zahl(wert)} Mio. €`]);
    };
    summe(0, V0, S0, "wf-start");
    stufen.forEach((s, k) => {
      const cx = fach * (k + 1.5), blass = S.auswahl !== null && S.auswahl !== s.i;
      const g = sv("g", { class: "dk-klick" + (blass ? " dk-blass" : ""), "data-name": s.m }, gv);
      const y0 = sy(Math.max(s.a, s.e)), y1 = sy(Math.min(s.a, s.e));
      sv("line", { x1: cx - fach + sb / 2, x2: cx - sb / 2, y1: sy(s.a), y2: sy(s.a), stroke: "#8C8C8C", "stroke-width": 1 }, g);   // Verbinder
      sv("rect", { x: cx - sb / 2, y: y0, width: sb, height: Math.max(1, y1 - y0), fill: s.d >= 0 ? FARBE.gut : FARBE.schlecht }, g);
      sv("text", { x: cx, y: s.d >= 0 ? y0 - 8 : y1 + 16, dy: s.d >= 0 ? "0" : "0.35em", "text-anchor": "middle", style: "font-weight:bold" }, g, delta(s.d, 0));
      sv("text", { x: cx, y: oben + H + 16, dy: "0.35em", "text-anchor": "middle" }, g, s.m);
      const hit = sv("rect", { x: cx - fach / 2, y: oben - 20, width: fach, height: H + 40, fill: "transparent" }, g);
      hit.addEventListener("click", () => auswaehlen(s.i));
      tooltip(hit, () => [`${MLANG[s.m]} 2027`, `Veränderung ${delta(s.d, 0)} Mio. € (${delta(s.d / s.a * 100, 1, NBSP + "%")})`,
        `von ${zahl(s.a)} auf ${zahl(s.e)} Mio. €`, "Klick hebt den Monat hervor"]);
    });
    sv("line", { x1: fach * (n - 1.5) + sb / 2, x2: fach * (n - 0.5) - sb / 2, y1: sy(V1), y2: sy(V1), stroke: "#8C8C8C", "stroke-width": 1 }, gv);
    summe(n - 1, V1, S1, "wf-ende");
    sv("line", { x1: 0, x2: breite, y1: oben + H + 0.5, y2: oben + H + 0.5, stroke: "#8C8C8C", "stroke-width": 1 }, gs);
  }

  function zeichnen() {
    const v = DK.visual(bVis, { titel: "Monatsumsatz und Veränderung zum Vormonat", einheit: "Mio. €", botschaft: botschaft(695) });
    diagramm(v.flaeche, v.breite, v.hoehe);
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "v-wasserfall", anker: "links", versatz: [690, 26], regel: "SAY – Botschaft vermitteln", titel: "Kernaussage unter dem Titel",
        text: "Unter dem Titel steht, wohin die Veränderungen insgesamt führen und wo der stärkste Rückgang liegt. Das Original hatte nur die Überschrift „Umsatzveränderungen in Mio. €“." },
      { nr: 2, ziel: "wf-start", anker: "links", versatz: [61, 186], regel: "CHECK – Vollständige Rechnung", titel: "Anfangs- und Endsäule",
        text: "Ein Wasserfall erklärt den Weg von einem Anfangs- zu einem Endwert. Das Original zeigte nur die Veränderungen: Wo die Januar-Säule bei 110 beginnt und wo der Juni bei 200 endet, musste man an der Achse ablesen. Jetzt stehen Dezember 2026 (110) und Juni 2027 (200) als volle Säulen daneben." },
      { nr: 3, ziel: "wf-veraenderung", anker: "links", versatz: [190, 60], regel: "UNIFY – Semantische Notation", titel: "Blaugrün und Rot nach Wirkung",
        text: "Zuwächse sind blaugrün, Rückgänge rot – die Farben der Abweichungen im ganzen Buch. Das Original nutzte reines Grün und Rot, die bei Rot-Grün-Sehschwäche kaum zu unterscheiden sind." },
      { nr: 4, ziel: "wf-veraenderung", anker: "links", versatz: [330, 200], regel: "EXPRESS – Vorzeichen zeigen", titel: "Werte mit Vorzeichen",
        text: "Jede Veränderung trägt ihr Vorzeichen über bzw. unter der Säule. Im Original standen Zuwächse und Rückgänge ohne Vorzeichen in den Säulen; kleine Werte wie „10“ waren kaum lesbar." },
      { nr: 5, ziel: "wf-veraenderung", anker: "links", versatz: [520, 60], regel: "SIMPLIFY – Überflüssiges weglassen", titel: "Ohne Achse und Rahmen",
        text: "Werte stehen an den Säulen; Größenachse und Rahmen entfallen. Dünne Verbinder führen von einer Säule zur nächsten." },
    ],
    nachbauIntro: "Seitengröße benutzerdefiniert 727 × 360 px. Schrift Arial: Beschriftungen 10,5 pt, Titel 12 pt. Datenmodell: Tabelle Umsatz (Position, Art, Wert) wie in der CSV-Datei.",
    nachbau: [
      { id: "A", ziel: "wf-veraenderung", versatz: [0, 0], titel: "Wasserfall", visual: "Wasserfalldiagramm (Standardvisual)",
        felder: "Kategorie: Monat (Januar bis Juni); Y-Achse: Veränderung", format: "Anstieg #00806B, Rückgang #C62828, Gesamt #3A3F44; Datenbeschriftungen ein; Y-Achse und Gitternetz aus",
        hinweis: "Das Standardvisual zeigt die Gesamtsäule am Ende automatisch; den Anfangswert (Dezember 2026) als erste Kategorie mit dem Wert 110 aufnehmen und als Gesamt formatieren. In Excel seit 2016: Einfügen › Wasserfall; Anfangs- und Endsäule über „Als Summe festlegen“." },
    ],
    theme: DK.thema(),
    csv: { name: "wasserfall_daten.csv", text: () => ["Position;Art;Wert_Mio_EUR", `${S0};Ausgangswert;${V0}`,
      ...D.map(x => `${x.m} 2027;Veraenderung;${x.d}`), `${S1};Endwert;${V1}`].join("\r\n") },
    tabellen: () => {
      let lauf = V0;
      return [{ titel: "Monatsumsatz und Veränderung (Mio. €)", kopf: ["Monat", "Veränderung", "Umsatz"],
        zeilen: [[S0, "", zahl(V0)], ...D.map(x => { lauf += x.d; return [MLANG[x.m] + " 2027", delta(x.d, 0), zahl(lauf)]; })] }];
    },
  });
  zeichnen();
})();
