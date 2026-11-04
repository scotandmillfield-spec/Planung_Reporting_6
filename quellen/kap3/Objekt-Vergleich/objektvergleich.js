/* Abb. 3.24 „Objekt-Vergleich“ (6. Auflage) – Einzelvisual 727 x 330 px = 110 x 50 mm.
   Inhalt wie im Original: Geschäftszahlen zweier Standorte (Hamburg, München) mit absoluter und relativer Differenz.
   Daten: standorte.json (daten_standorte.py, derselbe Datensatz wie Abb. 3.25) – Werte von Hamburg und München
   unverändert aus dem Original. Zwei Datenschnitte wählen die verglichenen Standorte; Δ = Standort − Vergleich. */
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
  const und = l => (l.length < 2 ? l.join("") : l.slice(0, -1).join(", ") + " und " + l[l.length - 1]);

  /* ---------- Zustand ---------- */
  const S = { a: "Hamburg", b: "München", sort: null, auswahl: null };
  addEventListener("keydown", e => { if (e.key === "Escape" && S.auswahl != null) { S.auswahl = null; zeichnen(); } });

  /* ---------- Layout ---------- */
  DK.init({ titel: "Objekt-Vergleich", breite: 727, hoehe: 330 });
  const bTitel = DK.box("v-titel", 16, 8, 695, 46);
  const bFilter = DK.box("filter", 16, 60, 695, 50, "dk-filter");
  DK.haarlinie(116);
  const bTab = DK.box("v-tabelle", 16, 126, 695, 172);
  const bFuss = DK.box("fussnote", 16, 304, 695, 20);
  DK.el("style", {}, document.head, `
    table.vg-tab { table-layout: fixed; width: auto; }
    .vg-tab th, .vg-tab td { padding: 0 6px; }
    .vg-tab th:first-child, .vg-tab td:first-child { padding-left: 0; }
    .vg-tab th { height: 24px; vertical-align: bottom; }
    .vg-tab td.vg-db { padding: 0 2px 0 6px; }
    #fussnote { font-size: 14px; color: var(--muted); white-space: nowrap; }
    .dk-panel dd { overflow-wrap: anywhere; }`);

  /* ---------- Berechnungen ---------- */
  function rang(s, k) {                                     // Rang 1 = günstigster Wert (neutral: höchster Wert)
    const r = k.richtung || 1;
    return 1 + ST.filter(x => x[k.key] * r > s[k.key] * r).length;
  }
  function daten() {
    const A = st(S.a), B = st(S.b);
    return KZ.map(k => {
      const va = A[k.key], vb = B[k.key], d = va - vb;
      const dp = vb && va * vb >= 0 ? d / Math.abs(vb) * 100 : null;     // kein Δ % bei Vorzeichenwechsel
      return { k, key: k.key, va, vb, d, dp, kl: wirkung(dp ?? d, k.richtung, 1), rang: rang(A, k) };
    });
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
  function tipZeile(z) {
    const k = z.k, e = k.quote ? "%" : EINHEIT, de = k.quote ? "%-Pkt." : EINHEIT;
    return [k.label.replace(" in %", ""), `${S.a}: ${fw(k, z.va)} ${e} · ${S.b}: ${fw(k, z.vb)} ${e}`,
      `Δ ${delta(z.d, k.nk)} ${de}` + (z.dp == null ? " · Δ % entfällt (Vorzeichenwechsel)" : ` · Δ ${delta(z.dp, 1)}${NBSP}% (bezogen auf ${S.b})`),
      `Wirkung für ${S.a}: ${WIRKUNG[z.kl]}` + (k.richtung ? "" : " (mehr Investitionen sind weder gut noch schlecht)"),
      `${S.a} auf Rang ${z.rang} von ${N} Standorten`, "Klick hebt hervor, Klick auf einen Spaltenkopf sortiert"];
  }

  /* ---------- Tabelle mit Abweichungsbalken (Wirkung je Zeile) ---------- */
  const SP = [
    { key: "label", titel: "Geschäftszahlen", breite: 186, id: "sp-kz" },
    { key: "va", titel: () => S.a, breite: 100, id: "sp-a" },
    { key: "vb", titel: () => S.b, breite: 100, id: "sp-b" },
    { key: "d", titel: "Δ", breite: 84, id: "sp-d" },
    { key: "dp", titel: "Δ %", breite: 225, typ: "balken", textBreite: 56, id: "sp-dp" },
  ];
  function tabelle(ziel, zeilen) {
    ziel.textContent = "";
    const t = el("table", { class: "dk-matrix vg-tab" }, ziel);
    const kopf = el("tr", {}, el("thead", {}, t));
    SP.forEach(s => {
      const th = el("th", { id: s.id, style: `width:${s.breite}px;` + (s.typ === "balken" ? "text-align:center" : "") }, kopf,
                   typeof s.titel === "function" ? s.titel() : s.titel);
      if (!DK.PRINT) {
        th.classList.add("dk-sortierbar"); th.title = "Klick sortiert";
        th.addEventListener("click", () => sortieren(s.key));
        if (S.sort && S.sort.key === s.key) th.appendChild(document.createTextNode(S.sort.ab ? " ▾" : " ▴"));
      }
    });
    const tb = el("tbody", {}, t);
    const neg = Math.max(0, ...zeilen.map(z => -(z.dp ?? 0))), pos = Math.max(0, ...zeilen.map(z => z.dp ?? 0));
    zeilen.forEach(z => {
      const k = z.k, blass = S.auswahl != null && S.auswahl !== z.key;
      const tr = el("tr", { class: "dk-zeile" + (blass ? " dk-blass" : "") }, tb);
      el("td", { style: "height:24px" }, tr, k.label);
      el("td", {}, tr, fw(k, z.va));
      el("td", {}, tr, fw(k, z.vb));
      const farbe = z.kl === "neutral" ? "var(--text)" : FARBE[z.kl];
      el("td", { style: `color:${farbe}` }, tr, delta(z.d, k.nk));
      const td = el("td", { class: "vg-db" }, tr);
      const s = SP[4], W = s.breite - 8, H = 21;
      const svg = sv("svg", { width: W, height: H, style: "display:block" }, td);
      sv("text", { x: s.textBreite - 6, y: H / 2, dy: "0.35em", "text-anchor": "end", style: `font-size:14px;fill:${farbe}` }, svg,
         z.dp == null ? "–" : delta(z.dp, 1));
      const k0 = (W - s.textBreite - 6) / Math.max(neg + pos, 1e-9), mitte = s.textBreite + 2 + neg * k0;
      if (z.dp != null) {
        const bw = Math.abs(z.dp) * k0;
        sv("rect", { x: z.dp >= 0 ? mitte : mitte - bw, y: (H - 10) / 2, width: bw, height: 10, fill: FARBE[z.kl] }, svg);
      }
      sv("line", { x1: mitte, x2: mitte, y1: 1, y2: H - 1, stroke: "#8C8C8C", "stroke-width": 1 }, svg);
      tr.addEventListener("click", () => { S.auswahl = S.auswahl === z.key ? null : z.key; zeichnen(); });
      tooltip(tr, () => tipZeile(z));
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
  function botschaft(zs, breite) {
    if (S.a === S.b) return "Beide Datenschnitte zeigen denselben Standort – bitte zwei Standorte wählen";
    const g = zs.find(z => z.key === "g");
    const anfang = `${S.a}: Gewinn ${delta(g.d, 0)} Mio. €` + (g.dp == null ? "" : ` (${delta(g.dp, 1)}${NBSP}%)`) +
                   ` ${g.d >= 0 ? "über" : "unter"} ${S.b}`;
    // ungünstige Kennzahlen außer Gewinn und Rendite, die stärksten zuerst (höchstens zwei)
    const schlecht = zs.filter(z => z.kl === "schlecht" && z.key !== "g" && z.key !== "r" && z.dp != null)
      .sort((a, b) => Math.abs(b.dp) - Math.abs(a.dp)).slice(0, 2);
    const teil = schlecht.length ? `ungünstig: ${und(schlecht.map(z => `${z.k.label} ${delta(z.dp, 1)}${NBSP}%`))}`
      : g.d >= 0 ? "keine Kennzahl ungünstig" : "";
    const lang = teil ? `${anfang}; ${teil}` : anfang;
    return tw(lang) <= breite ? lang : anfang;
  }

  /* ---------- Datenschnitte und Legende ---------- */
  const OPT = ST.map(s => [s.name, s.name]);
  DK.schnitt(bFilter, "Standort", "dropdown", { breite: 150, optionen: OPT, wert: S.a,
    onChange: v => { S.a = v; zeichnen(); } });
  DK.schnitt(bFilter, "Vergleich mit", "dropdown", { breite: 150, optionen: OPT, wert: S.b,
    onChange: v => { S.b = v; zeichnen(); } });
  const lg = el("div", { id: "vg-legende", class: "dk-rechts dk-legende", style: "align-self:flex-end;margin-bottom:6px" }, bFilter);
  [[FARBE.gut, "günstig"], [FARBE.schlecht, "ungünstig"]].forEach(([f, t]) => {
    const s = el("span", {}, lg); el("i", { style: `background:${f}` }, s); s.appendChild(document.createTextNode(t));
  });
  const lgText = el("span", { id: "legende-text" }, lg);

  /* ---------- Zeichnen ---------- */
  function zeichnen() {
    const zs = daten();
    DK.visual(bTitel, { titel: `Geschäftszahlen ${S.a} und ${S.b} ${JAHR}`, einheit: EINHEIT, botschaft: botschaft(zs, 695) });
    lgText.textContent = "für " + S.a;
    tabelle(bTab, sortiert(zs));
    bFuss.textContent = `Δ = ${S.a} − ${S.b}; Δ % bezogen auf ${S.b}; Umsatzrendite: Δ in %-Pkt.`;
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  /* ---------- Lernplattform: Designregeln, Nachbau, Tabellen, CSV ---------- */
  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "v-titel", anker: "links", versatz: [560, 0], regel: "SAY – Botschaft vermitteln", titel: "Aussage über der Tabelle",
        text: "Titel mit Jahr und Einheit, darunter die Kernaussage: um wie viel der Gewinn des einen Standorts über oder unter dem anderen liegt und was dagegen spricht. Sie rechnet sich bei jeder Auswahl neu. Das Original zeigte nur die Tabelle." },
      { nr: 2, ziel: "sp-dp", versatz: [-60, 0], regel: "UNIFY – Farbe nach Wirkung", titel: "Rot ist ungünstig, nicht negativ",
        text: "Δ und Δ % sind nach ihrer Wirkung gefärbt: Der höhere Betriebsaufwand Hamburgs (+180) ist ungünstig und deshalb rot, obwohl die Differenz positiv ist. Investitionen sind ohne Wertung schwarz. Das Original hatte keine Farbe." },
      { nr: 3, ziel: "sp-dp", anker: "links", versatz: [192, 79], regel: "EXPRESS – Passende Darstellung", titel: "Balken für die relative Differenz",
        text: "Die Δ-%-Spalte hat Balken an einer Nulllinie mit einem Maßstab: Sofort sichtbar, dass die Investitionen (+19,7 %) und der Free Cashflow (+15,0 %) am stärksten abweichen, Ertrag und Aufwand kaum. Absolute Differenzen bleiben ohne Balken, weil die Zeilen verschiedene Einheiten haben." },
      { nr: 4, ziel: "sp-d", anker: "links", versatz: [56, 0], regel: "UNIFY – Einheitliche Zahlen", titel: "Vorzeichen und Prozentpunkte",
        text: "Differenzen tragen ein Vorzeichen (+, −, ±), Prozentwerte eine Nachkommastelle. Die Differenz der Umsatzrendite ist ein Prozentpunkt-Wert (+0,2 %-Pkt.); das Original schrieb sie als „0,2%“ wie einen Anteil." },
      { nr: 5, ziel: "fussnote", anker: "links", versatz: [552, 0], regel: "CHECK – Visuelle Integrität", titel: "Rechenweg offenlegen",
        text: "Die Fußzeile sagt, wie gerechnet wird: Δ = Standort − Vergleich, Δ % bezogen auf den Vergleichsstandort. Alle Werte stammen aus einem Datensatz von zehn Standorten, den auch der Benchmark-Vergleich (Abb. 3.25) nutzt." },
      { nr: 6, ziel: "filter", anker: "links", versatz: [364, 26], regel: "CONDENSE – Filtern statt vervielfachen", titel: "Beliebige Standortpaare",
        text: "Zwei Datenschnitte wählen die verglichenen Objekte. Statt einer Tabelle je Paar zeigt dieselbe Tabelle jeden Vergleich; der Tooltip ergänzt den Rang des Standorts unter allen zehn." },
      { nr: 7, ziel: "sp-kz", versatz: [-40, 0], regel: "STRUCTURE – Inhalte ordnen", titel: "Rechenschema, sortierbar",
        text: "Die Zeilen folgen dem Rechenschema: Ertrag − Aufwand = Gewinn, daraus die Umsatzrendite, dann Investitionen und Free Cashflow. Ein Klick auf einen Spaltenkopf sortiert, ein Klick auf „Geschäftszahlen“ stellt das Schema wieder her." },
      { nr: 8, ziel: "sp-a", anker: "links", versatz: [38, 0], regel: "SIMPLIFY – Überflüssiges weglassen", titel: "Ohne senkrechte Linie und Fettdruck",
        text: "Die senkrechte Trennlinie und die fetten zweizeiligen Spaltenköpfe des Originals entfallen; Weißraum und rechtsbündige Zahlen gliedern die Spalten. Die Einheit steht einmal im Titel statt im Spaltenkopf." },
    ],
    nachbauIntro: "Standard-Visuals von Power BI Desktop. Seitengröße benutzerdefiniert 727 × 330 px. Schrift Arial: Tabelle 10,5 pt, Visualtitel 12 pt. Das Berichtsdesign (JSON) setzt Farben und Schriften. Datenmodell: Tabelle Standorte (Standort, Betriebsertrag, Betriebsaufwand, Investitionen, Free Cashflow) wie in der CSV-Datei, dazu eine getrennte, nicht verbundene Kopie „Vergleich“ für den zweiten Datenschnitt und eine Tabelle Kennzahlen (Name, Reihenfolge, Wirkung).",
    nachbau: [
      { id: "A", ziel: "v-tabelle", anker: "links", versatz: [142, 0], titel: "Geschäftszahlen", visual: "Matrix",
        felder: "Zeilen: Kennzahlen[Name] (sortiert nach Reihenfolge); Werte: Measures Standort = SWITCH(SELECTEDVALUE(Kennzahlen[Name]); \"Betriebsertrag\"; SUM(Standorte[Betriebsertrag]); …), Vergleich = derselbe Ausdruck über TREATAS(VALUES(Vergleich[Standort]); Standorte[Standort]), Δ = [Standort] − [Vergleich], Δ % = DIVIDE([Δ]; ABS([Vergleich]))",
        format: "Ganze Zahlen mit Tausenderpunkt, Umsatzrendite 0,0; Δ und Δ %: Schriftfarbe nach Measure Wirkungsfarbe (#00806B / #C62828 / #1A1A1A); Δ %: Datenbalken positiv und negativ mit derselben Farbregel, Achse automatisch; Spaltenkopf mit Linie #3A3F44",
        hinweis: "Spaltenköpfe mit dem gewählten Standortnamen: Feldparameter oder dynamische Formatzeichenfolge; einfacher sind feste Köpfe „Standort“ und „Vergleich“." },
      { id: "B", ziel: "filter", anker: "links", versatz: [98, 0], titel: "Datenschnitte", visual: "Datenschnitt (2×, Dropdown)",
        felder: "Standorte[Standort] (Einfachauswahl) und Vergleich[Standort] (Einfachauswahl)",
        format: "Kopfzeile 10,5 pt #4D4D4D, Rahmen #9A9A9A" },
      { id: "C", ziel: "v-titel", anker: "links", versatz: [596, 0], titel: "Titel und Kernaussage", visual: "Textfeld mit dynamischem Wert",
        felder: "Text-Measure aus [Δ] und [Δ %] des Gewinns sowie den ungünstigen Kennzahlen (Wirkung = −1)",
        format: "Titel 12 pt fett, Aussage 10,5 pt #4D4D4D" },
      { id: "D", ziel: "fussnote", anker: "links", versatz: [552, 0], titel: "Fußzeile", visual: "Textfeld mit dynamischem Wert",
        felder: "Measure mit den gewählten Standortnamen", format: "10,5 pt #4D4D4D" },
    ],
    theme: DK.thema(),
    csv: { name: "standorte_geschaeftszahlen.csv", text: () => {
      const de = (v, nk) => v.toFixed(nk).replace(".", ",");
      const k = ["Standort;Jahr;Betriebsertrag_Mio_EUR;Betriebsaufwand_Mio_EUR;Gewinn_Mio_EUR;Umsatzrendite_Prozent;Investitionen_Mio_EUR;Free_Cashflow_Mio_EUR"];
      ST.forEach(s => k.push([s.name, JAHR, s.e, s.a, s.g, de(s.r, 1), s.inv, s.fcf].join(";")));
      return k.join("\r\n"); } },
    tabellen: () => {
      const zs = daten();
      return [{ titel: `Geschäftszahlen ${S.a} und ${S.b} ${JAHR} (${EINHEIT}; Umsatzrendite in %, Δ in %-Pkt.)`,
        kopf: ["Geschäftszahlen", S.a, S.b, "Δ", "Δ %", "Wirkung"],
        zeilen: zs.map(z => [z.k.label, fw(z.k, z.va), fw(z.k, z.vb), delta(z.d, z.k.nk), z.dp == null ? "–" : delta(z.dp, 1), WIRKUNG[z.kl]]) }];
    },
  });
  zeichnen();
})();
