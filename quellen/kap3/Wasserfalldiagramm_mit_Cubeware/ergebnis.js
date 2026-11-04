/* Einzelvisual „Wasserfalldiagramm in einem BI-Werkzeug“ (Abb. 3.56), softwareneutral nachgebaut: Ergebnisüberleitung eines
   Autohandelskonzerns 2025 → 2026 → 2027 nach GuV-Positionen als Wasserfall, darunter die Detailanalyse der gewählten
   Position nach Konten oder Gesellschaften. Seite 727 x 560 px = 110 x 84,7 mm.
   Daten: ergebnis.json (daten_ergebnis.py) – Einzelwerte Gesellschaft × Konto × Jahr in 0,1 Tsd. €; alle angezeigten
   Werte des Originals (Wasserfall, Konten des Rohertrags, sichtbare Gesellschaften) ergeben sich daraus.
   Vorzeichen in Ergebnisrichtung (Aufwand negativ): Jede Spalte summiert sich zum Rohertrag bzw. Ergebnis, jede
   positive Veränderung ist günstig. Klick auf eine Position im Wasserfall wählt die Detailtabelle, Klick auf eine
   Tabellenzeile hebt sie hervor, Esc hebt beides auf; Spaltenköpfe sortieren. */
(() => {
  "use strict";
  const { zahl, delta, NBSP, sv, el, FARBE } = DK;
  const J = DATA.jahre, T = J.length;
  const POS = DATA.positionen.map(([key, name]) => ({ key, name }));
  const PNAME = Object.fromEntries(POS.map(p => [p.key, p.name]));
  const GRUPPEN = DATA.gruppen;
  const KO = DATA.konten.map(([key, label, nr, pos, gruppe], i) => ({ i, key, label, nr, pos, gruppe }));
  const GE = DATA.gesellschaften.map(([key, name, region], i) => ({ i, key, name, region }));
  const REGIONEN = [...new Set(GE.map(g => g.region))];
  const W = DATA.werte;                                     // [Gesellschaft][Konto][Jahr] in 0,1 Tsd. €
  // Summen in ganzen Zehnteln, Anzeige in Tsd. €
  const zehntel = (ges, konten, t) => ges.reduce((s, g) => s + konten.reduce((u, k) => u + W[g.i][k.i][t], 0), 0);
  const wert = (ges, konten, t) => zehntel(ges, konten, t) / 10;
  const kontenVon = p => KO.filter(k => k.pos === p);
  const ERG = Array.from({ length: T }, (_, t) => wert(GE, KO, t));
  const PW = Object.fromEntries(POS.map(p => [p.key, Array.from({ length: T }, (_, t) => wert(GE, kontenVon(p.key), t))]));

  const S = { pos: null, sicht: "konten", zeile: null, sort: null };
  addEventListener("keydown", e => {
    if (e.key === "Escape" && (S.pos !== null || S.zeile !== null)) { S.pos = null; S.zeile = null; zeichnen(); }
  });

  DK.init({ titel: "Ergebnisüberleitung", breite: 727, hoehe: 560 });
  el("style", {}, document.head, "body.print #v-detail .dk-titelzeile .dk-knoepfe { display: none; }");
  const RH = 19;
  const bWF = DK.box("v-wasserfall", 16, 10, 695, 48 + 11 * RH);
  DK.haarlinie(10 + 48 + 11 * RH + 8);
  const bTab = DK.box("v-detail", 16, 10 + 48 + 11 * RH + 16, 695, 560 - (10 + 48 + 11 * RH + 16) - 8);
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
  const pz = (d, b) => (b ? delta(d / Math.abs(b) * 100, 1, NBSP + "%") : "–");

  /* ---------- Wasserfall: Zeilen ---------- */
  function wfZeilen() {
    const z = [{ typ: "summe", t: 0, label: `Ergebnis ${J[0]}`, wert: ERG[0] }];
    for (let t = 1; t < T; t++) {
      POS.forEach(p => z.push({ typ: "schritt", t, pos: p.key, label: p.name, d: PW[p.key][t] - PW[p.key][t - 1] }));
      z.push({ typ: "summe", t, label: `Ergebnis ${J[t]}`, wert: ERG[t] });
    }
    let lauf = 0;
    z.forEach(r => { if (r.typ === "summe") { r.a = 0; r.e = r.wert; lauf = r.wert; } else { r.a = lauf; lauf += r.d; r.e = lauf; } });
    return z;
  }
  function botschaftWF(b) {
    const passt = k => k.find(t => DK.tw(t) <= b) || k[k.length - 1];
    const n = T - 1;
    if (S.pos) {
      const w = PW[S.pos], ds = w.slice(1).map((v, t) => v - w[t]);
      return passt([`${PNAME[S.pos]}: ${ds.map((d, t) => `${delta(d, 0)} (${J[t + 1]})`).join(" und ")} Tsd. €, zusammen ${delta(w[n] - w[0], 0)}`,
        `${PNAME[S.pos]}: ${ds.map(d => delta(d, 0)).join(" und ")} Tsd. €`]);
    }
    const dre = PW.RE[n] - PW.RE[0], dk = (ERG[n] - ERG[0]) - dre;
    return passt([`Ergebnis steigt von ${zahl(ERG[0])} auf ${zahl(ERG[n])} Tsd. € – Rohertrag ${delta(dre, 0)}, Kosten ${delta(dk, 0)}`,
      `Ergebnis steigt von ${zahl(ERG[0])} auf ${zahl(ERG[n])} Tsd. €`]);
  }
  function wasserfall(ziel, breite, hoehe) {
    ziel.textContent = "";
    const Z = wfZeilen();
    const svg = sv("svg", { width: breite, height: hoehe, role: "img", "aria-label": `Wasserfall: Ergebnis ${J[0]} bis ${J[T - 1]} nach GuV-Positionen` }, ziel);
    const lw = 186, xa = lw + 56, xb = breite - 60;
    const vmin = Math.min(0, ...Z.map(r => Math.min(r.a, r.e))), vmax = Math.max(0, ...Z.map(r => Math.max(r.a, r.e)));
    const sx = v => xa + (v - vmin) / (vmax - vmin) * (xb - xa), bh = 13;
    const gs = sv("g", { id: "wf-ergebnis" }, svg), gv = sv("g", { id: "wf-schritte" }, svg), gn = sv("g", { id: "wf-null" }, svg);
    sv("line", { x1: sx(0), x2: sx(0), y1: 0, y2: Z.length * RH, stroke: "#8C8C8C", "stroke-width": 1 }, gn);
    Z.forEach((r, i) => {
      const y = i * RH, yc = y + RH / 2;
      // Verbinder zur nächsten Zeile
      if (i < Z.length - 1) sv("line", { x1: sx(r.e), x2: sx(r.e), y1: yc + bh / 2, y2: yc + RH - bh / 2, stroke: "#8C8C8C", "stroke-width": 1 }, gn);
      const x0 = sx(Math.min(r.a, r.e)), x1 = sx(Math.max(r.a, r.e));
      if (r.typ === "summe") {
        const g = sv("g", { "data-name": r.label }, gs);
        sv("text", { x: lw - 10, y: yc, dy: "0.35em", "text-anchor": "end", style: "font-weight:bold" }, g, r.label);
        sv("rect", { x: x0, y: yc - bh / 2, width: Math.max(1, x1 - x0), height: bh, fill: "#3A3F44" }, g);
        sv("text", { x: r.wert >= 0 ? x1 + 6 : x0 - 6, y: yc, dy: "0.35em", "text-anchor": r.wert >= 0 ? "start" : "end", style: "font-weight:bold" }, g, zahl(r.wert));
        const hit = sv("rect", { x: 0, y, width: breite, height: RH, fill: "transparent" }, g);
        tooltip(hit, () => [r.label, `${zahl(r.wert)} Tsd. €`, r.t ? `zum Vorjahr ${delta(r.wert - ERG[r.t - 1], 0)} Tsd. €` : "Ausgangswert der Überleitung",
          "Ergebnis = Rohertrag + Raum-, Personal- und sonstige Kosten (negativ)"]);
        return;
      }
      const blass = S.pos !== null && S.pos !== r.pos;
      const g = sv("g", { class: "dk-klick" + (blass ? " dk-blass" : ""), "data-name": `${r.label} ${J[r.t]}` }, gv);
      sv("text", { x: lw - 10, y: yc, dy: "0.35em", "text-anchor": "end" }, g, r.label);
      sv("rect", { x: x0, y: yc - bh / 2, width: Math.max(1, x1 - x0), height: bh, fill: r.d >= 0 ? FARBE.gut : FARBE.schlecht }, g);
      sv("text", { x: r.d >= 0 ? x1 + 6 : x0 - 6, y: yc, dy: "0.35em", "text-anchor": r.d >= 0 ? "start" : "end" }, g, delta(r.d, 0));
      const hit = sv("rect", { x: 0, y, width: breite, height: RH, fill: "transparent" }, g);
      hit.addEventListener("click", () => { S.pos = S.pos === r.pos ? null : r.pos; S.zeile = null; zeichnen(); });
      const alt = PW[r.pos][r.t - 1], neu = PW[r.pos][r.t];
      tooltip(hit, () => [`${r.label}, Veränderung ${J[r.t]} zu ${J[r.t - 1]}`, `${delta(r.d, 0)} Tsd. € (${pz(r.d, alt)})`,
        `von ${zahl(alt)} auf ${zahl(neu)} Tsd. €`, r.pos === "RE" ? "Anstieg verbessert das Ergebnis" : "Kosten negativ: Rückgang = Kostenanstieg",
        "Klick zeigt die Konten der Position in der Tabelle"]);
    });
  }

  /* ---------- Detailtabelle ---------- */
  const posAktiv = () => S.pos || "RE";
  function zeileAus(key, label, ges, konten, extra) {
    const w = Array.from({ length: T }, (_, t) => wert(ges, konten, t));
    return { key, label, w, werte: { w0: w[0], d1: w[1] - w[0], w1: w[1], d2: w[2] - w[1], w2: w[2] }, ...extra };
  }
  function detailZeilen() {
    const p = posAktiv(), kon = kontenVon(p), z = [];
    if (S.sicht === "konten") {
      if (p === "RE") {
        Object.entries(GRUPPEN).forEach(([gk, gname]) => {
          const ks = kon.filter(k => k.gruppe === gk);
          ks.forEach(k => z.push(zeileAus(k.key, k.label, GE, [k], { blatt: true, nr: k.nr })));
          z.push(zeileAus(gk, gname, GE, ks, { summe: true, trenner: true }));
        });
        kon.filter(k => !k.gruppe).forEach(k => z.push(zeileAus(k.key, k.label, GE, [k], { blatt: true, nr: k.nr })));
      } else kon.forEach(k => z.push(zeileAus(k.key, k.label, GE, [k], { blatt: true, nr: k.nr })));
      z.push(zeileAus("gesamt", PNAME[p], GE, kon, { summe: true, gesamt: true, trenner: true }));
    } else {
      REGIONEN.forEach(reg => {
        const gs = GE.filter(g => g.region === reg);
        gs.forEach(g => z.push(zeileAus(g.key, g.name, [g], kon, { blatt: true, region: reg })));
        z.push(zeileAus(reg, reg, gs, kon, { summe: true, trenner: true }));
      });
      z.push(zeileAus("gesamt", "Konzern", GE, kon, { summe: true, gesamt: true, trenner: true }));
    }
    if (!S.sort) return z;
    const { key, ab } = S.sort, blaetter = z.filter(r => r.blatt);
    blaetter.sort((a, b) => { const c = key === "label" ? a.label.localeCompare(b.label, "de") : a.werte[key] - b.werte[key]; return ab ? -c : c; });
    return [...blaetter, z[z.length - 1]];
  }
  function sortieren(key) {
    if (!S.sort || S.sort.key !== key) S.sort = { key, ab: key !== "label" };
    else if (S.sort.ab === (key !== "label")) S.sort = { key, ab: !S.sort.ab };
    else S.sort = null;
    zeichnen();
  }
  function botschaftTab(b, Z) {
    const passt = k => k.find(t => DK.tw(t) <= b) || k[k.length - 1];
    const n = T - 1, ges = Z.find(r => r.gesamt), dg = ges.werte.d2, p = posAktiv();
    if (S.zeile) {
      const r = Z.find(x => x.key === S.zeile);
      if (r) return passt([`${r.label}: ${r.w.map(v => zahl(v)).join(" → ")} Tsd. € (${J[0]} bis ${J[n]})`, `${r.label}: ${zahl(r.w[0])} → ${zahl(r.w[n])} Tsd. €`]);
    }
    const blaetter = Z.filter(r => r.blatt);
    const kopf = `${PNAME[p]} ${J[n]} ${delta(dg, 0)}`;
    if (S.sicht === "ges") {
      const reg = REGIONEN.map(rg => Z.find(r => r.key === rg)).sort((a, c) => Math.abs(c.werte.d2) - Math.abs(a.werte.d2))[0];
      return passt([`${kopf}: davon ${reg.label} ${delta(reg.werte.d2, 0)} (${zahl(reg.werte.d2 / dg * 100, 0)}${NBSP}%)`, kopf]);
    }
    const plus = blaetter.filter(r => r.werte.d2 > 0).sort((a, c) => c.werte.d2 - a.werte.d2)[0];
    const minus = blaetter.filter(r => r.werte.d2 < 0).sort((a, c) => a.werte.d2 - c.werte.d2)[0];
    const teile = [plus, minus].filter(Boolean).map(r => `${r.label} ${delta(r.werte.d2, 0)}`);
    return passt([`${kopf}: ${plus && minus ? "" : "vor allem "}${teile.join(", ")}`, `${kopf}: ${teile[0]}`, kopf]);
  }
  function tabelle(ziel, Z) {
    const fmt = v => zahl(v);
    const spalten = [
      { key: "label", titel: "", breite: 186 },
      { key: "w0", id: "dt-j0", titel: String(J[0]), breite: 68, fmt },
      { key: "d1", id: "dt-d1", titel: "ΔVJ", breite: 152, typ: "delta", richtung: 1, nk: 0, textBreite: 60 },
      { key: "w1", titel: String(J[1]), breite: 68, fmt },
      { key: "d2", id: "dt-d2", titel: "ΔVJ", breite: 152, typ: "delta", richtung: 1, nk: 0, textBreite: 60 },
      { key: "w2", titel: String(J[2]), breite: 68, fmt },
    ];
    DK.matrix(ziel, { spalten, zeilen: Z, zeilenhoehe: 20, auswahl: S.zeile, sortierung: S.sort, onSort: sortieren,
      onClick: k => { S.zeile = S.zeile === k ? null : k; zeichnen(); },
      tooltip: r => [r.label + (r.nr ? ` (Konto ${r.nr})` : r.region ? ` (${r.region})` : ""),
        J.map((j, t) => `${j}: ${zahl(r.w[t])}`).join(" · ") + " Tsd. €",
        `ΔVJ ${J[1]}: ${delta(r.werte.d1, 0)} (${pz(r.werte.d1, r.w[0])}) · ${J[2]}: ${delta(r.werte.d2, 0)} (${pz(r.werte.d2, r.w[1])})`,
        r.w[0] < 0 ? "Aufwand negativ: Rückgang = Mehraufwand (rot)" : "Anstieg verbessert das Ergebnis (blaugrün)",
        "Klick hebt die Zeile hervor, Klick auf einen Spaltenkopf sortiert"] });
    ziel.querySelector("table").id = "dt-tabelle";
  }

  function zeichnen() {
    let v = DK.visual(bWF, { titel: `Ergebnisüberleitung ${J[0]} bis ${J[T - 1]} nach GuV-Positionen`, einheit: "Tsd. €", botschaft: botschaftWF(695) });
    wasserfall(v.flaeche, v.breite, v.hoehe);
    const Z = detailZeilen();
    v = DK.visual(bTab, { titel: `${PNAME[posAktiv()]} nach ${S.sicht === "konten" ? "Konten" : "Gesellschaften"}`, einheit: "Tsd. €",
      botschaft: botschaftTab(695, Z),
      schalter: { optionen: [["konten", "Konten"], ["ges", "Gesellschaften"]], wert: S.sicht,
                  onChange: w => { S.sicht = w; S.zeile = null; S.sort = null; zeichnen(); } } });
    tabelle(v.flaeche, Z);
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "v-wasserfall", anker: "links", versatz: [690, 26], regel: "SAY – Botschaft vermitteln", titel: "Kernaussage statt dreizeiligem Kopf",
        text: "Unter dem Titel steht, wohin sich das Ergebnis entwickelt und was dazu beiträgt; unter der Tabelle, welche Konten die Veränderung tragen. Beide Aussagen rechnen bei jeder Auswahl neu. Das Original hatte einen dreizeiligen Kopf („Ergebnisüberleitung und Detailanalyse GuV …, Überleitung von 2008 auf 2010 …, Ist in T€“) ohne Aussage." },
      { nr: 2, ziel: "wf-schritte", anker: "links", versatz: [40, 0], regel: "STRUCTURE – Inhalte ordnen", titel: "Waagerechter Wasserfall",
        text: "Die Positionen stehen untereinander, ihre Namen ausgeschrieben; die Tabelle darunter folgt derselben Zeilenlogik. Das Original zeigte die Überleitung als senkrechten Wasserfall mit abgekürzten Achsenbeschriftungen („Sonst.betr.Aufw.“, „Raumko.“, „Personalko.“)." },
      { nr: 3, ziel: "wf-ergebnis", anker: "links", versatz: [672, 190], regel: "UNIFY – Semantische Notation", titel: "Ergebnis anthrazit, Veränderung nach Wirkung",
        text: "Die Ergebnissäulen sind anthrazit, Veränderungen blaugrün, wenn sie das Ergebnis verbessern, und rot, wenn sie es belasten. Das Original nutzte Grau, reines Grün und Rot, die bei Rot-Grün-Sehschwäche kaum zu unterscheiden sind." },
      { nr: 4, ziel: "dt-d2", versatz: [-6, -2], regel: "EXPRESS – Abweichungen zeigen", titel: "Abweichungsbalken statt Ampelfähnchen",
        text: "Die Veränderung zum Vorjahr steht als Zahl mit Balken nach Wirkung neben den Jahreswerten. Das Original markierte jede Zahl mit einem grünen oder orangefarbenen Fähnchen (Ampelfunktion), das nur die Richtung, nicht die Größe zeigte." },
      { nr: 5, ziel: "dt-tabelle", anker: "links", versatz: [162, 103], regel: "CHECK – Vorzeichen in Ergebnisrichtung", titel: "Aufwand negativ",
        text: "Aufwand steht mit negativem Vorzeichen; so ergibt jede Spalte den Rohertrag, und jede positive Veränderung ist günstig. Im Original standen Aufwendungen in der linken Tabelle positiv, in der rechten negativ – dieselbe Größe mit zwei Vorzeichen." },
      { nr: 6, ziel: "v-detail", anker: "links", versatz: [430, -2], regel: "CONDENSE – Eine Tabelle, zwei Sichten", titel: "Klick und Umschalter statt Kontrollkästchen",
        text: "Ein Klick auf eine Position im Wasserfall zeigt ihre Konten; der Umschalter wechselt zur Sicht nach Gesellschaften. Das Original brauchte dafür vier Kontrollkästchen, einen Knopf „Select Position“ und eine zweite Tabelle mit Bildlaufleiste. Die Auswahl Plan/Ist sowie Gesellschaft und Währung entfallen, weil nur Ist-Werte gezeigt werden." },
      { nr: 7, ziel: "dt-tabelle", anker: "links", versatz: [187, 182], regel: "SIMPLIFY – Überflüssiges weglassen", titel: "Doppelte Ebenen und Navigation entfernt",
        text: "Hierarchieebenen, die nur eine Zeile wiederholen (Verkaufserlöse = Umsatzerlöse, Provisionen = Konto 67710), entfallen, ebenso die Zwischenebene „Einkauf Fahrzeuge“ im Materialaufwand; Kontonummern stehen im Tooltip. Logo, Fensterrahmen und die Knöpfe „Zurück“ und „Home“ entfallen." },
      { nr: 8, ziel: "dt-tabelle", anker: "links", versatz: [142, 162], regel: "UNIFY – Rechenschema", titel: "Zwischensummen unter ihren Konten",
        text: "Umsatzerlöse und Materialaufwand stehen als fette Zwischensummen unter ihren Konten, der Rohertrag als Gesamtsumme am Ende – wie in einem Rechenschema. Das Original stellte die Summen über die Konten. Ein Klick auf einen Spaltenkopf sortiert die Konten, ein dritter Klick stellt das Rechenschema wieder her." },
    ],
    nachbauIntro: "Seitengröße benutzerdefiniert 727 × 560 px. Schrift Arial: Beschriftungen 10,5 pt, Titel 12 pt. Datenmodell: Faktentabelle GuV (Gesellschaft, Region, Position, Konto, Kontobezeichnung, Jahr, Wert) wie in der CSV-Datei; Aufwand mit negativem Vorzeichen; Dimension Konto mit Sortierspalte für das Rechenschema.",
    nachbau: [
      { id: "A", ziel: "wf-schritte", anker: "links", versatz: [40, 0], titel: "Wasserfall", visual: "Wasserfalldiagramm (Standardvisual)",
        felder: "Kategorie: Jahr; Aufschlüsselung: Position (max. 4 Aufschlüsselungen); Y-Achse: Summe von Wert",
        format: "Anstieg #00806B, Rückgang #C62828, Gesamt #3A3F44; Datenbeschriftungen ein; Y-Achse und Gitternetz aus; Legende aus",
        hinweis: "Mit Aufschlüsselung zeigt das Standardvisual je Jahr die Veränderungen der Positionen gegenüber dem Vorjahr. Es ist nur senkrecht verfügbar; Zwischensummen je Jahr entstehen über die Kategorie Jahr." },
      { id: "B", ziel: "dt-tabelle", anker: "links", versatz: [162, 103], titel: "Detailtabelle", visual: "Matrix (Standardvisual)",
        felder: "Zeilen: Feldparameter „Sicht“ mit Gruppe › Kontobezeichnung bzw. Region › Gesellschaft; Spalten: Jahr; Werte: Wert, Measure ΔVJ = [Wert] − CALCULATE([Wert]; DATEADD(Kalender[Datum]; −1; YEAR))",
        format: "Zwischensummen unten (Zeilenteilsummen: Position „Unten“), fett; bedingte Formatierung ΔVJ: Datenbalken, positiv #00806B, negativ #C62828, Achse automatisch; 0 Dezimalstellen",
        hinweis: "Den Umschalter Konten/Gesellschaften bildet ein Feldparameter mit Datenschnitt nach. ΔVJ für das erste Jahr in der Matrix ausblenden." },
      { id: "C", ziel: "v-detail", anker: "links", versatz: [430, -2], titel: "Interaktion", visual: "Kreuzfilterung",
        felder: "Format › Interaktionen bearbeiten: Wasserfall filtert die Matrix (Filter), Matrix hebt im Wasserfall nur hervor",
        format: "Kernaussagen als Textfelder mit dynamischem Measure (z. B. TOPN(1; …; [ΔVJ]))" },
    ],
    theme: DK.thema(),
    csv: { name: "ergebnisueberleitung_daten.csv", text: () => {
      const z = ["Gesellschaft;Region;Position;Konto;Kontobezeichnung;Jahr;Wert_Tsd_EUR"];
      GE.forEach(g => KO.forEach(k => J.forEach((j, t) => z.push([g.name, g.region, PNAME[k.pos], k.nr, k.label, j, zahl(W[g.i][k.i][t] / 10, 1)].join(";")))));
      return z.join("\r\n"); } },
    tabellen: () => {
      const Z = wfZeilen(), D = detailZeilen();
      return [{ titel: "Ergebnisüberleitung (Tsd. €)", kopf: ["Zeile", "Veränderung", "Stand"],
          zeilen: Z.map(r => [r.typ === "summe" ? r.label : `${r.label} ${J[r.t]}`, r.typ === "summe" ? "" : delta(r.d, 0), zahl(r.e)]) },
        { titel: `${PNAME[posAktiv()]} nach ${S.sicht === "konten" ? "Konten" : "Gesellschaften"} (Tsd. €)`,
          kopf: ["", String(J[0]), "ΔVJ", String(J[1]), "ΔVJ", String(J[2])],
          zeilen: D.map(r => [r.label, zahl(r.w[0]), delta(r.werte.d1, 0), zahl(r.w[1]), delta(r.werte.d2, 0), zahl(r.w[2])]) }];
    },
  });
  zeichnen();
})();
