/* Abb. 3.25 „Benchmark-Vergleich“ (6. Auflage) – Einzelvisual 727 x 366 px = 110 x 55 mm.
   Inhalt wie im Original: Geschäftszahlen eines Standorts (Hamburg) gegen den besten Standort und gegen den
   Durchschnitt aller Standorte, jeweils mit absoluter und relativer Differenz.
   Daten: standorte.json (daten_standorte.py, derselbe Datensatz wie Abb. 3.24). Bester Standort = höchster Gewinn
   unter den übrigen Standorten (für Hamburg: Frankfurt, Werte des Originals); Durchschnitt über alle zehn Standorte
   (Werte des Originals). Datenschnitt Standort; Δ = Standort − Vergleichswert. */
(() => {
  "use strict";
  const { zahl, delta, wirkung, FARBE, sv, el, tw, NBSP } = DK;
  const JAHR = DATA.jahr, EINHEIT = DATA.einheit;
  const ST = DATA.standorte.map(([name, e, a, inv, fcf], i) => ({ i, name, e, a, g: e - a, r: (e - a) / e * 100, inv, fcf }));
  const N = ST.length;
  const KZ = [
    { key: "e", label: "Betriebsertrag", richtung: 1, nk: 0 },
    { key: "a", label: "Betriebsaufwand", richtung: -1, nk: 0 },
    { key: "g", label: "Gewinn", richtung: 1, nk: 0 },
    { key: "r", label: "Umsatzrendite in %", richtung: 1, nk: 1, quote: true },
    { key: "inv", label: "Investitionen", richtung: 0, nk: 0 },
    { key: "fcf", label: "Free Cashflow", richtung: 1, nk: 0 },
  ];
  const WIRKUNG = { gut: "günstig", schlecht: "ungünstig", neutral: "ohne Wertung" };
  const st = name => ST.find(s => s.name === name);

  /* Durchschnitt aller Standorte: Beträge arithmetisch, Umsatzrendite = Ø Gewinn / Ø Ertrag */
  const OD = { name: "Durchschnitt" };
  ["e", "a", "g", "inv", "fcf"].forEach(k => { OD[k] = ST.reduce((s, x) => s + x[k], 0) / N; });
  OD.r = OD.g / OD.e * 100;

  /* ---------- Zustand ---------- */
  const S = { standort: "Hamburg", sort: null, auswahl: null };
  addEventListener("keydown", e => { if (e.key === "Escape" && S.auswahl != null) { S.auswahl = null; zeichnen(); } });

  /* ---------- Layout ---------- */
  DK.init({ titel: "Benchmark-Vergleich", breite: 727, hoehe: 366 });
  const bTitel = DK.box("v-titel", 16, 8, 695, 46);
  const bFilter = DK.box("filter", 16, 60, 695, 50, "dk-filter");
  DK.haarlinie(116);
  const bTab = DK.box("v-tabelle", 16, 124, 695, 192);
  const bFuss = DK.box("fussnote", 16, 320, 695, 40);
  DK.el("style", {}, document.head, `
    table.vg-tab { table-layout: fixed; width: auto; }
    .vg-tab th, .vg-tab td { padding: 0 6px; }
    .vg-tab th:first-child, .vg-tab td:first-child { padding-left: 0; }
    .vg-tab tr.vg-kopf th { height: 24px; vertical-align: bottom; }
    .vg-tab tr.vg-gruppe th { height: 20px; border-bottom: none; text-align: left; padding: 0 0 0 14px; vertical-align: bottom; }
    .vg-tab tr.vg-gruppe th div { border-bottom: 1px solid #9A9A9A; padding: 0 0 2px 0; }
    .vg-tab .vg-neu { padding-left: 14px; }
    .vg-tab td.vg-db { padding: 0 2px 0 6px; }
    #fussnote { font-size: 14px; color: var(--muted); line-height: 1.35; white-space: nowrap; }
    .dk-panel dd { overflow-wrap: anywhere; }`);

  /* ---------- Berechnungen ---------- */
  function rang(s, k) {                                     // Rang 1 = günstigster Wert (neutral: höchster Wert)
    const r = k.richtung || 1;
    return 1 + ST.filter(x => x[k.key] * r > s[k.key] * r).length;
  }
  const besterVon = name => ST.filter(s => s.name !== name).sort((a, b) => b.g - a.g || a.i - b.i)[0];
  function daten() {
    const A = st(S.standort), B = besterVon(S.standort);
    const zeilen = KZ.map(k => {
      const va = A[k.key], vb = B[k.key], vd = OD[k.key];
      const db = va - vb, dd = va - vd;
      // kein Δ % bei Vorzeichenwechsel oder Basis null
      const dbp = vb && va * vb >= 0 ? db / Math.abs(vb) * 100 : null, ddp = vd && va * vd >= 0 ? dd / Math.abs(vd) * 100 : null;
      return { k, key: k.key, va, vb, db, dbp, vd, dd, ddp, rang: rang(A, k),
               klB: wirkung(dbp ?? db, k.richtung, 1), klD: wirkung(ddp ?? dd, k.richtung, 1) };
    });
    return { A, B, zeilen };
  }
  const fw = (k, v) => zahl(v, k.nk);

  /* ---------- Tooltip (gleiches Verhalten wie die Bausteine von DK) ---------- */
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
  function tipZeile(z, B) {
    const k = z.k, e = k.quote ? "%" : EINHEIT, de = k.quote ? "%-Pkt." : EINHEIT;
    const pz = v => (v == null ? "Δ % entfällt (Vorzeichenwechsel)" : delta(v, 1) + NBSP + "%");
    return [k.label.replace(" in %", "") + " · " + S.standort,
      `${S.standort}: ${fw(k, z.va)} ${e} (Rang ${z.rang} von ${N})`,
      `Bester Standort ${B.name}: ${fw(k, z.vb)} ${e} · Δ ${delta(z.db, k.nk)} ${de} (${pz(z.dbp)}) – ${WIRKUNG[z.klB]}`,
      `Durchschnitt: ${fw(k, z.vd)} ${e} · Δ ${delta(z.dd, k.nk)} ${de} (${pz(z.ddp)}) – ${WIRKUNG[z.klD]}`,
      "Klick hebt hervor, Klick auf einen Spaltenkopf sortiert"];
  }

  /* ---------- Tabelle mit Abweichungsbalken (Wirkung je Zeile, ein Maßstab für beide Δ-%-Spalten) ---------- */
  const SP = [
    { key: "label", titel: "Geschäftszahlen", breite: 133, id: "sp-kz" },
    { key: "va", titel: () => S.standort, breite: 80, id: "sp-a" },
    { key: "vb", titel: () => besterVon(S.standort).name, breite: 76, id: "sp-b", neu: true },
    { key: "db", titel: "Δ", breite: 56, id: "sp-db", kl: "klB" },
    { key: "dbp", titel: "Δ %", breite: 116, typ: "balken", kl: "klB", id: "sp-dbp" },
    { key: "vd", titel: "Ø", breite: 58, id: "sp-d", neu: true },
    { key: "dd", titel: "Δ", breite: 60, id: "sp-dd", kl: "klD" },
    { key: "ddp", titel: "Δ %", breite: 116, typ: "balken", kl: "klD", id: "sp-ddp" },
  ];
  const TXT = 52;                                           // Textbreite in den Balkenspalten
  function tabelle(ziel, d, zeilen) {
    ziel.textContent = "";
    const t = el("table", { class: "dk-matrix vg-tab" }, ziel);
    const cg = el("colgroup", {}, t);                         // Spaltenbreiten (table-layout: fixed liest sonst die Gruppenzeile)
    SP.forEach(s => el("col", { style: `width:${s.breite}px` }, cg));
    const thead = el("thead", {}, t);
    const gr = el("tr", { class: "vg-gruppe" }, thead);
    el("th", { class: "vg-leer", colspan: 2 }, gr);
    el("div", {}, el("th", { colspan: 3, id: "gr-bester" }, gr), "Bester Standort");
    el("div", {}, el("th", { colspan: 3, id: "gr-schnitt" }, gr), `Durchschnitt aller ${N} Standorte`);
    const kopf = el("tr", { class: "vg-kopf" }, thead);
    SP.forEach(s => {
      const th = el("th", { id: s.id, class: s.neu ? "vg-neu" : "", style: `width:${s.breite}px;` + (s.typ === "balken" ? "text-align:center" : "") },
                   kopf, typeof s.titel === "function" ? s.titel() : s.titel);
      if (!DK.PRINT) {
        th.classList.add("dk-sortierbar"); th.title = "Klick sortiert";
        th.addEventListener("click", () => sortieren(s.key));
        if (S.sort && S.sort.key === s.key) th.appendChild(document.createTextNode(S.sort.ab ? " ▾" : " ▴"));
      }
    });
    const tb = el("tbody", {}, t);
    const alle = d.zeilen.flatMap(z => [z.dbp ?? 0, z.ddp ?? 0]);
    const neg = Math.max(0, ...alle.map(v => -v)), pos = Math.max(0, ...alle);
    zeilen.forEach(z => {
      const k = z.k, blass = S.auswahl != null && S.auswahl !== z.key;
      const tr = el("tr", { class: "dk-zeile" + (blass ? " dk-blass" : "") }, tb);
      SP.forEach((s, j) => {
        if (j === 0) { el("td", { style: "height:24px" }, tr, k.label); return; }
        const v = z[s.key], kl = s.kl ? z[s.kl] : null;
        const farbe = !kl || kl === "neutral" ? "var(--text)" : FARBE[kl];
        if (s.typ !== "balken") {
          el("td", { class: s.neu ? "vg-neu" : "", style: kl ? `color:${farbe}` : "" }, tr,
             s.kl ? delta(v, k.nk) : fw(k, v));
          return;
        }
        const td = el("td", { class: "vg-db" }, tr);
        const W = s.breite - 8, H = 21;
        const svg = sv("svg", { width: W, height: H, style: "display:block" }, td);
        sv("text", { x: TXT - 6, y: H / 2, dy: "0.35em", "text-anchor": "end", style: `font-size:14px;fill:${farbe}` }, svg,
           v == null ? "–" : delta(v, 1));
        const k0 = (W - TXT - 6) / Math.max(neg + pos, 1e-9), mitte = TXT + 2 + neg * k0;
        if (v != null) {
          const bw = Math.abs(v) * k0;
          sv("rect", { x: v >= 0 ? mitte : mitte - bw, y: (H - 10) / 2, width: bw, height: 10, fill: FARBE[kl] }, svg);
        }
        sv("line", { x1: mitte, x2: mitte, y1: 1, y2: H - 1, stroke: "#8C8C8C", "stroke-width": 1 }, svg);
      });
      tr.addEventListener("click", () => { S.auswahl = S.auswahl === z.key ? null : z.key; zeichnen(); });
      tooltip(tr, () => tipZeile(z, d.B));
    });
  }
  function sortieren(key) {
    if (key === "label") S.sort = null;                       // Kennzahl: zurück zur Reihenfolge des Rechenschemas
    else if (S.sort && S.sort.key === key) S.sort = { key, ab: !S.sort.ab };
    else S.sort = { key, ab: true };
    zeichnen();
  }
  function sortiert(zeilen) {
    if (!S.sort) return zeilen;
    const k = S.sort.key, wert = z => (z[k] == null ? -Infinity : z[k]);
    return zeilen.slice().sort((a, b) => (S.sort.ab ? wert(b) - wert(a) : wert(a) - wert(b)) || KZ.indexOf(a.k) - KZ.indexOf(b.k));
  }

  /* ---------- Botschaft ---------- */
  function botschaft(d, breite) {
    const g = d.zeilen.find(z => z.key === "g");
    const pz = v => delta(v, 1) + NBSP + "%";
    const kl = v => (v == null ? "" : ` (${pz(v)})`);
    const lang = `${S.standort}: Gewinn ${delta(g.db, 0)} Mio. €${kl(g.dbp)} zum besten Standort ${d.B.name}, ` +
                 `${delta(g.dd, 0)} Mio. €${kl(g.ddp)} zum Durchschnitt`;
    const kurz = g.dbp == null || g.ddp == null
      ? `${S.standort}: Gewinn ${delta(g.db, 0)} Mio. € zum besten Standort ${d.B.name}, ${delta(g.dd, 0)} zum Durchschnitt`
      : `${S.standort}: Gewinn ${pz(g.dbp)} zum besten Standort ${d.B.name}, ${pz(g.ddp)} zum Durchschnitt`;
    return tw(lang) <= breite ? lang : kurz;
  }

  /* ---------- Datenschnitt und Legende ---------- */
  DK.schnitt(bFilter, "Standort", "dropdown", { breite: 150, optionen: ST.map(s => [s.name, s.name]), wert: S.standort,
    onChange: v => { S.standort = v; S.auswahl = null; zeichnen(); } });
  const lg = el("div", { id: "vg-legende", class: "dk-rechts dk-legende", style: "align-self:flex-end;margin-bottom:6px" }, bFilter);
  [[FARBE.gut, "günstig"], [FARBE.schlecht, "ungünstig"]].forEach(([f, t]) => {
    const s = el("span", {}, lg); el("i", { style: `background:${f}` }, s); s.appendChild(document.createTextNode(t));
  });
  const lgText = el("span", {}, lg);

  /* ---------- Zeichnen ---------- */
  function zeichnen() {
    const d = daten();
    DK.visual(bTitel, { titel: `Geschäftszahlen ${S.standort} im Standortvergleich ${JAHR}`, einheit: EINHEIT, botschaft: botschaft(d, 695) });
    lgText.textContent = "für " + S.standort + ", Investitionen ohne Wertung";
    tabelle(bTab, d, sortiert(d.zeilen));
    bFuss.textContent = "";
    el("div", {}, bFuss, `Δ = ${S.standort} − Vergleichswert; Δ % bezogen auf den Vergleichswert; Umsatzrendite: Δ in %-Pkt.`);
    el("div", {}, bFuss, `Bester Standort: höchster Gewinn ohne ${S.standort}; Ø: Mittel aller ${N} Standorte, Rendite = Ø Gewinn / Ø Ertrag`);
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  /* ---------- Lernplattform: Designregeln, Nachbau, Tabellen, CSV ---------- */
  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "v-titel", anker: "links", versatz: [600, 0], regel: "SAY – Botschaft vermitteln", titel: "Zwei Benchmarks in einem Satz",
        text: "Die Kernaussage nennt den Abstand des Gewinns zum besten Standort und zum Durchschnitt. Hamburg liegt deutlich hinter Frankfurt (−24,4 %), aber weit über dem Durchschnitt (+76,9 %). Das Original zeigte nur die Tabelle." },
      { nr: 2, ziel: "sp-db", anker: "links", versatz: [33, 0], regel: "UNIFY – Farbe nach Wirkung", titel: "Rot ist ungünstig, nicht negativ",
        text: "Das Original färbte alle negativen Differenzen rot und alle positiven schwarz. So erschien der um 180 Mio. € höhere Betriebsaufwand unauffällig und geringere Investitionen als Mangel. Jetzt zeigt die Farbe die Wirkung: höherer Aufwand ist rot, Investitionen sind ohne Wertung." },
      { nr: 3, ziel: "sp-ddp", anker: "links", versatz: [109, 125], regel: "CHECK – Visuelle Integrität", titel: "Ein Maßstab für beide Benchmarks",
        text: "Beide Δ-%-Spalten nutzen denselben Maßstab. So ist sichtbar, dass Hamburg vom Durchschnitt viel weiter entfernt ist als vom besten Standort. Eigene Maßstäbe je Spalte würden −24,4 % und +76,9 % gleich lang zeichnen." },
      { nr: 4, ziel: "gr-bester", anker: "links", versatz: [150, 0], regel: "UNIFY – Klare Bezeichnungen", titel: "Lesbare Spaltenköpfe",
        text: "Die Kürzel „Δ +S“ und „Δ ⌀S“ des Originals sind durch Gruppenköpfe ersetzt: „Bester Standort“ mit seinem Namen und „Durchschnitt aller 10 Standorte“, darunter jeweils Wert, Δ und Δ %. Die Fußzeile nennt die Regeln für Bestwert und Durchschnitt." },
      { nr: 5, ziel: "sp-dd", anker: "links", versatz: [33, 0], regel: "UNIFY – Einheitliche Zahlen", titel: "Vorzeichen und Prozentpunkte",
        text: "Differenzen tragen ein Vorzeichen (+, −, ±) und ein echtes Minuszeichen. Die Differenz der Umsatzrendite steht in Prozentpunkten (−6,2 %-Pkt. zum besten Standort); das Original schrieb sie wie einen Anteil als „−6,2%“." },
      { nr: 6, ziel: "sp-dbp", anker: "links", versatz: [118, 104], regel: "EXPRESS – Passende Darstellung", titel: "Balken für relative Abstände",
        text: "Δ % hat Balken an einer Nulllinie, die absoluten Differenzen bleiben Zahlen, weil die Zeilen verschiedene Einheiten haben. Der Gewinn fällt in beiden Richtungen am stärksten auf." },
      { nr: 7, ziel: "filter", anker: "links", versatz: [190, 26], regel: "CONDENSE – Filtern statt vervielfachen", titel: "Jeder Standort im Benchmark",
        text: "Der Datenschnitt stellt jeden der zehn Standorte dem besten anderen Standort und dem Durchschnitt gegenüber; der Tooltip ergänzt den Rang. Dieselben Daten zeigt der Objekt-Vergleich (Abb. 3.24)." },
      { nr: 8, ziel: "sp-kz", anker: "links", versatz: [136, 0], regel: "SIMPLIFY – Überflüssiges weglassen", titel: "Weißraum statt Linien",
        text: "Die senkrechten Trennlinien und die fetten Spaltenköpfe des Originals entfallen; die beiden Vergleiche sind durch Gruppenköpfe und Abstand getrennt. Die Zeilen folgen dem Rechenschema, ein Klick auf einen Spaltenkopf sortiert." },
    ],
    nachbauIntro: "Standard-Visuals von Power BI Desktop. Seitengröße benutzerdefiniert 727 × 366 px. Schrift Arial: Tabelle 10,5 pt, Visualtitel 12 pt. Das Berichtsdesign (JSON) setzt Farben und Schriften. Datenmodell: Tabelle Standorte wie in der CSV-Datei und eine Tabelle Kennzahlen (Name, Reihenfolge, Wirkung) für die Zeilen.",
    nachbau: [
      { id: "A", ziel: "v-tabelle", anker: "links", versatz: [142, 22], titel: "Standortvergleich", visual: "Matrix",
        felder: "Zeilen: Kennzahlen[Name]; Werte: Standort (Wert des gewählten Standorts), Bester = Wert des Standorts mit TOPN(1; FILTER(ALL(Standorte); Standorte[Standort] <> SELECTEDVALUE(Standorte[Standort])); [Gewinn]), Ø = AVERAGEX(ALL(Standorte); …), jeweils Δ = [Standort] − [Vergleich] und Δ % = DIVIDE(Δ; ABS([Vergleich])); Umsatzrendite im Durchschnitt = DIVIDE(Ø Gewinn; Ø Betriebsertrag)",
        format: "Ganze Zahlen mit Tausenderpunkt, Umsatzrendite 0,0; Schriftfarbe von Δ und Δ % über Measure Wirkungsfarbe (#00806B / #C62828 / #1A1A1A); Datenbalken in beiden Δ-%-Spalten mit fester Achse (Min −30, Max 80), damit der Maßstab gleich ist",
        hinweis: "Gruppenköpfe gibt es in der Matrix nicht direkt; entweder Spaltenfeld „Vergleich“ (Bester, Durchschnitt) mit Werten Wert, Δ, Δ % oder zwei Tabellen nebeneinander." },
      { id: "B", ziel: "filter", anker: "links", versatz: [96, 0], titel: "Datenschnitt", visual: "Datenschnitt (Dropdown, Einfachauswahl)",
        felder: "Standorte[Standort]; die Measures für Bestwert und Durchschnitt heben den Filter mit ALL() auf",
        format: "Kopfzeile 10,5 pt #4D4D4D, Rahmen #9A9A9A" },
      { id: "C", ziel: "v-titel", anker: "links", versatz: [636, 0], titel: "Titel und Kernaussage", visual: "Textfeld mit dynamischem Wert",
        felder: "Text-Measure aus Δ Gewinn zum besten Standort und zum Durchschnitt", format: "Titel 12 pt fett, Aussage 10,5 pt #4D4D4D" },
      { id: "D", ziel: "fussnote", anker: "links", versatz: [637, 0], titel: "Fußzeile", visual: "Textfeld mit dynamischem Wert",
        felder: "Measure mit dem gewählten Standortnamen", format: "10,5 pt #4D4D4D" },
    ],
    theme: DK.thema(),
    csv: { name: "standorte_geschaeftszahlen.csv", text: () => {
      const de = (v, nk) => v.toFixed(nk).replace(".", ",");
      const k = ["Standort;Jahr;Betriebsertrag_Mio_EUR;Betriebsaufwand_Mio_EUR;Gewinn_Mio_EUR;Umsatzrendite_Prozent;Investitionen_Mio_EUR;Free_Cashflow_Mio_EUR"];
      ST.forEach(s => k.push([s.name, JAHR, s.e, s.a, s.g, de(s.r, 1), s.inv, s.fcf].join(";")));
      return k.join("\r\n"); } },
    tabellen: () => {
      const d = daten(), pz = v => (v == null ? "–" : delta(v, 1));
      return [{ titel: `Geschäftszahlen ${S.standort} im Standortvergleich ${JAHR} (${EINHEIT}; Umsatzrendite in %, Δ in %-Pkt.)`,
        kopf: ["Geschäftszahlen", S.standort, `Bester (${d.B.name})`, "Δ", "Δ %", "Ø", "Δ", "Δ %"],
        zeilen: d.zeilen.map(z => [z.k.label, fw(z.k, z.va), fw(z.k, z.vb), delta(z.db, z.k.nk), pz(z.dbp),
                                   fw(z.k, z.vd), delta(z.dd, z.k.nk), pz(z.ddp)]) }];
    },
  });
  zeichnen();
})();
