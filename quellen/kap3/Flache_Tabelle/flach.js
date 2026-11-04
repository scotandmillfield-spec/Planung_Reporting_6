/* Einzelvisual „Flache Tabelle“ (Tab. 3.1) – interaktive Fassung für die Lernplattform; im Druck bleibt die
   LaTeX-Tabelle tabellen/Flache_Tabelle.tex. Seite 727 x 290 px = 110 x 43,9 mm.
   Daten: flach.json (daten_flach.py) – die fünf Auftragspositionen des Originals.
   Ansicht „Flache Tabelle“: ein Datensatz je Zeile, sortierbar. Klick auf eine Auftrags- bzw. Artikelnummer hebt alle
   Positionen dieses Auftrags bzw. Artikels hervor, Klick auf einen Wert die einzelne Position.
   Ansicht „Pivotiert“: dieselben Datensätze als Kreuztabelle Auftrag × Artikel mit Summen (Brücke zu Tab. 3.2),
   Wertfeld Umsatz oder Menge. Die Hervorhebung bleibt beim Umschalten erhalten. */
(() => {
  "use strict";
  const { zahl, NBSP, el } = DK;
  const P = DATA.positionen.map(([auftrag, artikel, menge, preis, umsatz], i) =>
    ({ i, auftrag: String(auftrag), artikel: String(artikel), menge, preis, umsatz }));
  const AUFTRAEGE = [...new Set(P.map(p => p.auftrag))].sort();
  const ARTIKEL = [...new Set(P.map(p => p.artikel))].sort();
  const summe = (liste, k) => liste.reduce((s, p) => s + p[k], 0);
  const GES = { menge: summe(P, "menge"), umsatz: summe(P, "umsatz") };
  const pz = (a, b) => zahl(b ? a / b * 100 : 0, 0) + NBSP + "%";
  const EINHEIT = { menge: "Stück", umsatz: "€" };
  const WERTNAME = { menge: "Menge", umsatz: "Umsatz" };

  /* ---------- Zustand ---------- */
  const S = { ansicht: "flach", wert: "umsatz", sel: { auftrag: null, artikel: null }, sort: null };
  const keineAuswahl = () => S.sel.auftrag == null && S.sel.artikel == null;
  const waehlen = (auftrag, artikel) => {
    S.sel = S.sel.auftrag === auftrag && S.sel.artikel === artikel ? { auftrag: null, artikel: null } : { auftrag, artikel };
    zeichnen();
  };
  addEventListener("keydown", e => {
    if (e.key === "Escape" && !keineAuswahl()) { S.sel = { auftrag: null, artikel: null }; zeichnen(); }
  });

  /* ---------- Layout ---------- */
  DK.init({ titel: "Flache Tabelle", breite: 727, hoehe: 290 });
  const bTitel = DK.box("v-titel", 16, 8, 695, 46);
  const bFilter = DK.box("filter", 16, 60, 695, 50, "dk-filter");
  DK.haarlinie(116);
  const bTab = DK.box("v-tabelle", 16, 126, 695, 156);
  DK.el("style", {}, document.head, `
    .tp { table-layout: fixed; }
    .tp td { height: 24px; }
    .tp th { height: 22px; vertical-align: bottom; }
    .tp tr.tp-oben th { border-bottom: none; color: var(--muted); text-align: center; padding-bottom: 7px; }
    .tp tr.tp-oben th.tp-gruppe { position: relative; }
    .tp tr.tp-oben th.tp-gruppe::after { content: ""; position: absolute; left: 8px; right: 8px; bottom: 2px;
      border-bottom: 1px solid #9A9A9A; }
    .tp tr.dk-summe { cursor: pointer; }
    .tp .tp-links { text-align: left !important; }
    .tp td.tp-leer { color: var(--muted); }`);

  /* ---------- lokale Hilfen: Tooltip mit Ereignis, Tabelle mit Zellbezug ---------- */
  const tipEl = document.querySelector(".dk-tooltip");
  function tooltip(ziel, zeilenFn) {
    ziel.addEventListener("pointermove", ev => {
      const zeilen = zeilenFn(ev);
      if (!zeilen || !zeilen.length) { tipEl.style.display = "none"; return; }
      tipEl.textContent = "";
      zeilen.forEach((z, i) => el(i === 0 ? "b" : "div", {}, tipEl, z));
      tipEl.style.display = "block";
      const r = tipEl.getBoundingClientRect();
      let x = ev.clientX + 14, y = ev.clientY + 14;
      if (x + r.width > innerWidth - 8) x = ev.clientX - r.width - 14;
      if (y + r.height > innerHeight - 8) y = ev.clientY - r.height - 14;
      tipEl.style.left = x + "px"; tipEl.style.top = y + "px";
    });
    ziel.addEventListener("pointerleave", () => { tipEl.style.display = "none"; });
  }
  /* tabelle(ziel, {breiten, kopf: [[{text, span, id, klasse, onClick}]], zeilen: [{summe, zellen: [{text, klasse, blass}]}],
     onClick(zeile, spaltenIndex | null), tooltip(zeile, spaltenIndex | null)}) – Zellbezug über data-j */
  function tabelle(ziel, o) {
    ziel.textContent = "";
    const t = el("table", { class: "dk-matrix tp" }, ziel);
    const cg = el("colgroup", {}, t);
    o.breiten.forEach(b => el("col", { style: `width:${b}px` }, cg));
    const kopf = el("thead", {}, t);
    o.kopf.forEach((reihe, ri) => {
      const tr = el("tr", { class: ri < o.kopf.length - 1 ? "tp-oben" : "" }, kopf);
      reihe.forEach(c => {
        const a = { class: c.klasse || "" };
        if (c.span > 1) a.colspan = c.span;
        if (c.id) a.id = c.id;
        const th = el("th", a, tr, c.text);
        if (c.onClick && !DK.PRINT) {
          th.classList.add("dk-sortierbar"); th.title = c.titel || "Klick sortiert";
          th.addEventListener("click", c.onClick);
        }
      });
    });
    const tb = el("tbody", {}, t);
    const spalte = ev => { const td = ev.target.closest ? ev.target.closest("td") : null; return td ? +td.dataset.j : null; };
    o.zeilen.forEach(z => {
      const tr = el("tr", { class: z.summe ? "dk-summe" : "dk-zeile" }, tb);
      z.zellen.forEach((c, j) => el("td", { "data-j": j, class: (c.klasse || "") + (c.blass ? " dk-blass" : "") }, tr, c.text));
      tr.addEventListener("click", ev => o.onClick(z, spalte(ev)));
      tooltip(tr, ev => o.tooltip(z, spalte(ev)));
    });
    return t;
  }

  /* ---------- Berechnungen ---------- */
  const pos = (auftrag, artikel) => P.filter(p => (auftrag == null || p.auftrag === auftrag) && (artikel == null || p.artikel === artikel));
  function pivotWert(auftrag, artikel) {
    const l = pos(auftrag, artikel);
    return l.length ? summe(l, S.wert) : null;
  }
  const sichtbar = p => (S.sel.auftrag == null || p.auftrag === S.sel.auftrag) && (S.sel.artikel == null || p.artikel === S.sel.artikel);
  function sortieren(key) {
    if (S.sort && S.sort.key === key) S.sort = { key, ab: !S.sort.ab };
    else S.sort = { key, ab: !["auftrag", "artikel"].includes(key) };
    zeichnen();
  }
  const pfeil = key => (S.sort && S.sort.key === key ? (S.sort.ab ? " ▾" : " ▴") : "");

  function botschaft() {
    const { auftrag, artikel } = S.sel;
    if (auftrag != null && artikel != null) {
      const p = pos(auftrag, artikel)[0];
      return `Position ${auftrag}/${artikel}: ${p.menge} Stück × ${zahl(p.preis)} € = ${zahl(p.umsatz)} € (${pz(p.umsatz, GES.umsatz)} des Umsatzes)`;
    }
    if (auftrag != null) {
      const l = pos(auftrag, null);
      return `Auftrag ${auftrag}: ${l.length} ${l.length === 1 ? "Position" : "Positionen"}, Umsatz ${zahl(summe(l, "umsatz"))} € (${pz(summe(l, "umsatz"), GES.umsatz)} des Gesamtumsatzes)`;
    }
    if (artikel != null) {
      const l = pos(null, artikel);
      return `Artikel ${artikel}: in ${l.length} ${l.length === 1 ? "Auftrag" : "Aufträgen"}, ${zahl(summe(l, "menge"))} Stück, Umsatz ${zahl(summe(l, "umsatz"))} € (${pz(summe(l, "umsatz"), GES.umsatz)})`;
    }
    if (S.ansicht === "flach")
      return `${P.length} Positionen aus ${AUFTRAEGE.length} Aufträgen, Umsatz ${zahl(GES.umsatz)} € – je Zeile ein Datensatz, Umsatz = Menge × Preis`;
    const leer = AUFTRAEGE.length * ARTIKEL.length - P.length;
    return `Pivotiert: ${P.length} Positionen in ${AUFTRAEGE.length} × ${ARTIKEL.length} Zellen, ${leer} ${leer === 1 ? "Kombination" : "Kombinationen"} ohne Position („–“)`;
  }

  /* ---------- Ansicht „Flache Tabelle“ ---------- */
  const SP_FLACH = [
    { key: "auftrag", titel: "Auftragsnummer", id: "sp-auftrag", breite: 150, links: true },
    { key: "artikel", titel: "Artikelnummer", id: "sp-artikel", breite: 150, links: true },
    { key: "menge", titel: "Menge", id: "sp-menge", breite: 130 },
    { key: "preis", titel: "Preis", id: "sp-preis", breite: 130 },
    { key: "umsatz", titel: "Umsatz", id: "sp-umsatz", breite: 135 },
  ];
  function flach() {
    const liste = P.slice();
    if (S.sort) liste.sort((a, b) => {
      const c = Number(a[S.sort.key]) - Number(b[S.sort.key]);
      return (S.sort.ab ? -c : c) || a.i - b.i;
    });
    tabelle(bTab, {
      breiten: SP_FLACH.map(s => s.breite),
      kopf: [SP_FLACH.map(s => ({ text: s.titel + pfeil(s.key), id: s.id, klasse: s.links ? "tp-links" : "", onClick: () => sortieren(s.key) }))],
      zeilen: liste.map(p => ({ p, zellen: SP_FLACH.map(s => ({
        text: s.links ? p[s.key] : zahl(p[s.key]), klasse: s.links ? "tp-links" : "", blass: !sichtbar(p) })) })),
      onClick: (z, j) => {
        const p = z.p;
        if (j === 0) waehlen(p.auftrag, null);
        else if (j === 1) waehlen(null, p.artikel);
        else waehlen(p.auftrag, p.artikel);
      },
      tooltip: (z, j) => {
        const p = z.p, auftragU = summe(pos(p.auftrag, null), "umsatz");
        return [`Auftrag ${p.auftrag} · Artikel ${p.artikel}`,
          `Menge ${p.menge} Stück × Preis ${zahl(p.preis)} € = Umsatz ${zahl(p.umsatz)} €`,
          `Anteil am Auftrag ${p.auftrag}: ${pz(p.umsatz, auftragU)} · am Gesamtumsatz: ${pz(p.umsatz, GES.umsatz)}`,
          j === 0 ? "Klick hebt alle Positionen des Auftrags hervor"
            : j === 1 ? "Klick hebt alle Positionen des Artikels hervor" : "Klick hebt die Position hervor, Esc hebt auf"];
      },
    });
  }

  /* ---------- Ansicht „Pivotiert“: Zeilen Auftrag, Spalten Artikel ---------- */
  function pivot() {
    const W = S.wert;
    let zeilen = AUFTRAEGE.slice();
    if (S.sort) {
      const wert = a => (S.sort.key === "summe" ? pivotWert(a, null) : S.sort.key === "auftrag" ? Number(a) : pivotWert(a, S.sort.key) ?? -1);
      zeilen.sort((a, b) => { const c = wert(a) - wert(b); return (S.sort.ab ? -c : c) || a.localeCompare(b); });
    }
    const spalten = [...ARTIKEL, null];                     // null = Summe
    const blass = (a, b) => (S.sel.auftrag != null && a !== S.sel.auftrag) || (S.sel.artikel != null && b !== S.sel.artikel);
    const zelle = (a, b) => {
      const v = pivotWert(a, b);
      return { text: v == null ? "–" : zahl(v), klasse: v == null ? "tp-leer" : "", blass: blass(a, b) };
    };
    const z = zeilen.map(a => ({ a, zellen: [{ text: a, klasse: "tp-links", blass: S.sel.auftrag != null && a !== S.sel.auftrag },
      ...spalten.map(b => zelle(a, b))] }));
    z.push({ a: null, summe: true, zellen: [{ text: "Summe", klasse: "tp-links", blass: S.sel.auftrag != null },
      ...spalten.map(b => zelle(null, b))] });
    tabelle(bTab, {
      breiten: [150, 135, 135, 135, 140],
      kopf: [
        [{ text: "" }, { text: "Artikelnummer", span: ARTIKEL.length, klasse: "tp-gruppe", id: "pv-artikel" }, { text: "" }],
        [{ text: "Auftragsnummer" + pfeil("auftrag"), id: "pv-auftrag", onClick: () => sortieren("auftrag") },
         ...ARTIKEL.map(b => ({ text: b + pfeil(b), onClick: () => sortieren(b) })),
         { text: "Summe" + pfeil("summe"), id: "pv-summe", onClick: () => sortieren("summe") }],
      ],
      zeilen: z,
      onClick: (zeile, j) => {
        const b = j == null || j === 0 ? null : spalten[j - 1];
        if (zeile.a == null) { if (b != null) waehlen(null, b); else if (!keineAuswahl()) waehlen(S.sel.auftrag, S.sel.artikel); return; }
        waehlen(zeile.a, b);
      },
      tooltip: (zeile, j) => {
        const a = zeile.a, b = j == null || j === 0 ? null : spalten[j - 1];
        const v = pivotWert(a, b), n = pos(a, b).length;
        const titel = [a == null ? "alle Aufträge" : "Auftrag " + a, b == null ? "alle Artikel" : "Artikel " + b].join(" · ");
        if (v == null) return [titel, "Keine Position – die Zelle der Kreuztabelle bleibt leer („–“)"];
        const zeilenS = pivotWert(a, null), spaltenS = pivotWert(null, b), ges = pivotWert(null, null);
        return [titel, `${WERTNAME[W]} ${zahl(v)} ${EINHEIT[W]} aus ${n} ${n === 1 ? "Position" : "Positionen"}`,
          `Anteil an der Zeile ${pz(v, zeilenS)} · an der Spalte ${pz(v, spaltenS)} · gesamt ${pz(v, ges)}`,
          "Klick hebt hervor, Esc hebt auf, Klick auf einen Spaltenkopf sortiert"];
      },
    });
  }

  /* ---------- Zeichnen ---------- */
  function zeichnen() {
    const piv = S.ansicht === "pivot";
    DK.visual(bTitel, {
      titel: piv ? `${WERTNAME[S.wert]} nach Auftrag und Artikel` : "Auftragspositionen",
      einheit: piv ? EINHEIT[S.wert] : "Menge in Stück, Preis und Umsatz in €", botschaft: botschaft() });
    bFilter.textContent = "";
    DK.schnitt(bFilter, "Ansicht", "knoepfe", {
      optionen: [["flach", "Flache Tabelle"], ["pivot", "Pivotiert: Auftrag × Artikel"]], wert: S.ansicht,
      onChange: v => { if (v !== S.ansicht) { S.ansicht = v; S.sort = null; zeichnen(); } } });
    if (piv) DK.schnitt(bFilter, "Wertfeld", "knoepfe", {
      optionen: [["umsatz", "Umsatz"], ["menge", "Menge"]], wert: S.wert,
      onChange: v => { if (v !== S.wert) { S.wert = v; zeichnen(); } } });
    if (piv) pivot(); else flach();
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  /* ---------- Lernplattform: Designregeln, Nachbau, Tabellen, CSV ---------- */
  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "v-tabelle", anker: "links", versatz: [312, 29], regel: "STRUCTURE – Inhalte ordnen", titel: "Ein Datensatz je Zeile",
        text: "Die flache Tabelle hat genau eine Zeile je Auftragsposition und eine Spalte je Merkmal: zwei Schlüssel (Auftrag, Artikel) und drei Werte. Sie ist das Ausgangsformat jeder Auswertung; Verdichtung und Summen entstehen erst in der Kreuztabelle (Tab. 3.2 und 3.3)." },
      { nr: 2, ziel: "sp-auftrag", versatz: [-16, 2], regel: "SIMPLIFY – Einheitliche Zahlen", titel: "Schlüssel links, Werte rechts",
        text: "Auftrags- und Artikelnummern sind Bezeichner, keine Mengen: Sie stehen linksbündig und ohne Tausenderpunkt. Menge, Preis und Umsatz stehen rechtsbündig mit einem Format je Spalte. Im Original waren alle Spalten gleich rechtsbündig gesetzt." },
      { nr: 3, ziel: "v-titel", anker: "links", versatz: [482, 2], regel: "UNIFY – Einheiten nennen", titel: "Einheiten im Titel",
        text: "Das Original nannte keine Einheiten. Sie stehen jetzt einmal im Titel (Menge in Stück, Preis und Umsatz in €) statt an jeder Zahl – eine Annahme, die zum Beispiel passt." },
      { nr: 4, ziel: "v-titel", anker: "links", versatz: [690, 22], regel: "SAY – Botschaft vermitteln", titel: "Aussage unter dem Titel",
        text: "Unter dem Titel steht in einem Satz, was die Tabelle zeigt – berechnet aus den Daten und abhängig von der Auswahl, z. B. Umsatz und Anteil eines Auftrags." },
      { nr: 5, ziel: "sp-preis", versatz: [-48, 2], regel: "CHECK – Visuelle Integrität", titel: "Umsatz = Menge × Preis",
        text: "Der Tooltip zeigt die Rechnung je Position; alle fünf Zeilen gehen auf. Der Preis ist nicht additiv – eine Summe der Preise wäre sinnlos. In der pivotierten Ansicht sind deshalb nur Menge und Umsatz als Wertfeld wählbar." },
      { nr: 6, ziel: "filter", anker: "links", versatz: [342, 30], regel: "CONDENSE – Verdichten", titel: "Pivotieren verdichtet",
        text: "Die Ansicht „Pivotiert“ ordnet dieselben fünf Datensätze als Kreuztabelle an: Aufträge in den Zeilen, Artikel in den Spalten, Summen am Rand. Die Kombination ohne Position bleibt leer („–“). Genau dieser Schritt führt zur Kreuztabelle in Tab. 3.2." },
      { nr: 7, ziel: "v-tabelle", anker: "links", versatz: [140, 52], regel: "EXPRESS – Hervorheben statt Farbe", titel: "Wiederholte Schlüssel sichtbar machen",
        text: "Ein Klick auf eine Auftragsnummer hebt alle Positionen dieses Auftrags hervor, ein Klick auf eine Artikelnummer alle Positionen des Artikels. So wird sichtbar, dass sich Schlüssel in der flachen Tabelle wiederholen. Esc hebt die Hervorhebung auf." },
    ],
    nachbauIntro: "Standard-Visuals von Power BI Desktop. Seitengröße benutzerdefiniert 727 × 290 px. Schrift Arial: Tabelle 10,5 pt, Visualtitel 12 pt. Datenmodell: eine Tabelle Positionen (Auftragsnummer, Artikelnummer, Menge, Preis, Umsatz) wie in der CSV-Datei; Auftrags- und Artikelnummer mit Datentyp Text.",
    nachbau: [
      { id: "A", ziel: "v-tabelle", anker: "links", versatz: [312, 3], titel: "Flache Tabelle", visual: "Tabelle",
        felder: "Auftragsnummer, Artikelnummer, Menge, Preis, Umsatz – je Feld „Nicht zusammenfassen“ (sonst verdichtet Power BI gleiche Zeilen)",
        format: "Gesamtsumme aus; Spaltenkopf mit Unterstrich #3A3F44, Zeilenraster #EFEFEF; Schlüssel linksbündig, Werte rechtsbündig ohne Dezimalstellen",
        hinweis: "Hervorheben: Kreuzfilterung zwischen Visuals oder Auswahl in der Tabelle (Strg + Klick für mehrere Zeilen)." },
      { id: "B", ziel: "filter", anker: "links", versatz: [342, 30], titel: "Pivotierte Ansicht", visual: "Matrix",
        felder: "Zeilen: Auftragsnummer; Spalten: Artikelnummer; Werte: Measure Wert – per SWITCH je nach gewähltem Wertfeld SUM(Positionen[Menge]) oder SUM(Positionen[Umsatz])",
        format: "Zeilen- und Spaltensummen an, Beschriftung „Summe“; leere Zellen bleiben leer",
        hinweis: "Umschalten zwischen Tabelle und Matrix über zwei Lesezeichen und Schaltflächen; Wertfeld als Datenschnitt auf einer getrennten Tabelle (oder Feldparameter)." },
    ],
    theme: DK.thema(),
    csv: { name: "auftragspositionen_daten.csv", text: () => ["Auftragsnummer;Artikelnummer;Menge_Stueck;Preis_EUR;Umsatz_EUR",
      ...P.map(p => [p.auftrag, p.artikel, p.menge, p.preis, p.umsatz].join(";"))].join("\r\n") },
    tabellen: () => {
      const flachT = { titel: "Auftragspositionen (flache Tabelle)", kopf: ["Auftragsnummer", "Artikelnummer", "Menge (Stück)", "Preis (€)", "Umsatz (€)"],
        zeilen: P.map(p => [p.auftrag, p.artikel, zahl(p.menge), zahl(p.preis), zahl(p.umsatz)]) };
      const pivT = { titel: `${WERTNAME[S.wert]} nach Auftrag und Artikel (${EINHEIT[S.wert]})`, kopf: ["Auftrag", ...ARTIKEL, "Summe"],
        zeilen: [...AUFTRAEGE, null].map(a => [a ?? "Summe", ...[...ARTIKEL, null].map(b => { const v = pivotWert(a, b); return v == null ? "–" : zahl(v); })]) };
      return [flachT, pivT];
    },
  });
  zeichnen();
})();
