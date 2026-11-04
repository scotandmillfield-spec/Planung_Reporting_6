/* Einzelvisual „Kennzahlenmodell“ (Abb. 5.23). Seite 727 x 394 px = 110 x 59,6 mm.
   Daten: kennzahlenmodell.json (daten_kennzahlenmodell.py) – Dimensionstabellen Produkt, Kunde, Zeit und vier Zeilen
   der Faktentabelle mit je einer Spalte je Kennzahl; Nettoumsatz = Bruttoumsatz + Rabatte und NettoNetto-Umsatz =
   Nettoumsatz + Skonti werden je Zeile berechnet. Werte und Stammdaten wie in der Serie „Kontenmodell“ (Abb. 5.25–5.27).
   Oben die drei Dimensionstabellen nebeneinander, darunter die Faktentabelle mit Rollenzeile (Dim.-ID, Kennzahl,
   berechnet) und neuer Summenzeile, unten die Rechenregeln. Klick auf eine Dimensionszeile filtert die Faktentabelle
   (Summe der gewählten Zeilen), Klick auf eine Zeile der Faktentabelle zeigt ihre Dimensionen und rechnet sie vor.
   Esc hebt auf, Spaltenköpfe sortieren. */
(() => {
  "use strict";
  const { zahl, el, tw } = DK;
  const B = 695, H = 394;
  const PN = new Map(DATA.produkte), KN = new Map(DATA.kunden), JN = new Map(DATA.zeit);
  const KZ = DATA.kennzahlen, BER = new Set(DATA.berechnet);
  const Z = DATA.zeilen.map(([p, k, t, ...w], i) => ({ i, p, k, t, w }));       // w: Werte in der Reihenfolge KZ
  const IX = Object.fromEntries(KZ.map((k, j) => [k, j]));
  const eur = v => zahl(v);
  const op = v => (v < 0 ? `− ${zahl(-v)} €` : `+ ${zahl(v)} €`);
  const passt = (k, breite = B - 12) => k.find(t => tw(t) <= breite) || k[k.length - 1];
  const anz = (n, s, p) => `${n} ${n === 1 ? s : p}`;
  const DIM = { p: ["Produkt", PN], k: ["Kunde", KN], t: ["Jahr", JN] };
  const dimText = (d, id) => (d === "t" ? `Jahr ${id}` : `${DIM[d][0]} ${id} ${DIM[d][1].get(id)}`);
  const summe = zz => KZ.map((_, j) => zz.reduce((s, z) => s + z.w[j], 0));

  /* ---------- Zustand ---------- */
  const S = { auswahl: null, sort: null };
  const gleich = (a, b) => a && b && a.typ === b.typ && a.dim === b.dim && a.id === b.id && a.i === b.i;
  const waehlen = a => { S.auswahl = gleich(S.auswahl, a) ? null : a; zeichnen(); };
  addEventListener("keydown", e => { if (e.key === "Escape" && S.auswahl) { S.auswahl = null; zeichnen(); } });
  const gefiltert = () => (S.auswahl && S.auswahl.typ === "dim" ? Z.filter(z => z[S.auswahl.dim] === S.auswahl.id) : Z);

  /* ---------- Layout ---------- */
  DK.init({ titel: DATA.titel, breite: 727, hoehe: H });
  const bTitel = DK.box("v-titel", 16, 8, B, 46);
  DK.haarlinie(62);
  const bDim = DK.box("z-dim", 16, 72, B, 82);
  DK.haarlinie(164);
  const bFakten = DK.box("z-fakten", 16, 174, B, 166);
  const bLegende = DK.box("legende", 16, 346, B, 42);
  DK.el("style", {}, document.head, `
    .zl { font-weight: bold; height: 20px; line-height: 18px; white-space: nowrap; }
    .kt { border-collapse: collapse; table-layout: fixed; font-size: 14px; }
    .kt th, .kt td { padding: 0 0 0 12px; text-align: left; white-space: nowrap; overflow: hidden; }
    .kt th:first-child, .kt td:first-child { padding-left: 0; }
    .kt th { height: 20px; font-weight: normal; color: var(--muted); vertical-align: bottom; padding-bottom: 2px; }
    .kt thead tr:last-child th { border-bottom: 1px solid var(--ac); }
    .kt td { height: 20px; border-bottom: 1px solid #EFEFEF; font-variant-numeric: tabular-nums; }
    .kt .re { text-align: right; }
    .kt .schl { text-decoration: underline; text-underline-offset: 2px; }
    .kt tbody tr.dk-zeile { cursor: pointer; }
    .kt tbody tr.dk-zeile:hover td { background: var(--flaeche); }
    .kt tr.dk-blass td { opacity: 1; }
    .kt tr.summe td { font-weight: bold; border-top: 1px solid var(--ac); border-bottom: none; height: 22px; }
    .kt th.dk-sortierbar { cursor: pointer; }
    .kt th.dk-sortierbar:hover { color: var(--text); }
    #z-dim .dimreihe { display: flex; gap: 30px; }
    #legende { color: var(--muted); line-height: 20px; }`);

  /* ---------- lokale Hilfe: Tooltip mit Ereignis ---------- */
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

  /* ---------- lokale Hilfe: Tabelle (wie in der Serie „Kontenmodell“) ---------- */
  function tabelle(ziel, o) {
    const t = el("table", { class: "kt", id: o.id || "" }, ziel);
    const cg = el("colgroup", {}, t);
    o.spalten.forEach(s => el("col", { style: `width:${s.breite}px` }, cg));
    t.style.width = o.spalten.reduce((a, s) => a + s.breite, 0) + "px";
    const th = el("thead", {}, t);
    if (o.gruppe) {
      const r = el("tr", { id: o.gruppeId || "" }, th);
      o.gruppe.forEach(([titel, span, re, schl], j) => el("th", { colspan: span, class: re ? "re" : "", ...(j === 0 && o.gruppeId ? { id: o.gruppeId + "-0" } : {}) }, r).appendChild(
        schl ? el("span", { class: "schl" }, null, titel) : document.createTextNode(titel)));
    }
    const kr = el("tr", {}, th);
    o.spalten.forEach(s => {
      const c = el("th", { class: s.re ? "re" : "", ...(s.id ? { id: s.id } : {}) }, kr);
      if (s.schl) el("span", { class: "schl" }, c, s.titel); else c.appendChild(document.createTextNode(s.titel));
      if (s.sort !== undefined && o.onSort && !DK.PRINT) {
        c.classList.add("dk-sortierbar"); c.title = "Klick sortiert";
        c.addEventListener("click", () => o.onSort(s.sort));
        if (o.sort && o.sort.key === s.sort) c.appendChild(document.createTextNode(o.sort.ab ? " ▾" : " ▴"));
      }
    });
    const tb = el("tbody", {}, t);
    o.zeilen.forEach(z => {
      const tr = el("tr", { class: (z.summe ? "summe" : "dk-zeile") + (z.blass ? " dk-blass" : ""), ...(z.id ? { id: z.id } : {}) }, tb);
      z.zellen.forEach((c, j) => el("td", { class: o.spalten[j].re ? "re" : "" }, tr, c));
      if (z.klick) tr.addEventListener("click", z.klick);
      if (z.tip) tooltip(tr, z.tip);
    });
    return t;
  }

  /* ---------- Bausteine ---------- */
  function dimensionen(h) {
    bDim.textContent = "";
    el("div", { class: "zl" }, bDim, "Dimensionstabellen");
    const reihe = el("div", { class: "dimreihe" }, bDim);
    [["p", "Produkt-ID", "Produkt-Bez.", DATA.produkte], ["k", "Kunde-ID", "Kunde-Bez.", DATA.kunden], ["t", "Zeit-ID", "Jahr", DATA.zeit]]
      .forEach(([d, idT, bezT, liste], i) => {
        tabelle(el("div", {}, reihe), {
          id: "t-dim-" + d,
          spalten: [{ titel: idT, breite: 95, schl: true, id: i === 0 ? "sp-schluessel" : undefined }, { titel: bezT, breite: 115 }],
          zeilen: liste.map(([id, bez]) => {
            const zz = Z.filter(z => z[d] === id);
            return {
              zellen: [String(id), String(bez)], blass: h.dim[d] && !h.dim[d].has(id),
              klick: () => waehlen({ typ: "dim", dim: d, id }),
              tip: () => [dimText(d, id), `${anz(zz.length, "Zeile", "Zeilen")} der Faktentabelle · NettoNetto-Umsatz ${eur(summe(zz)[IX["NettoNetto-Umsatz"]])} €`,
                `Schlüssel ${id} steht in der Faktentabelle in der Spalte ${d === "t" ? "Zeit" : DIM[d][0]}`,
                "Klick filtert die Faktentabelle, Esc hebt auf"],
            };
          }),
        });
      });
  }

  const ID_SP = [["p", "Produkt", 66], ["k", "Kunde", 66], ["t", "Zeit", 66]];
  const KZ_BREITE = { Bruttoumsatz: 100, Rabatte: 80, Nettoumsatz: 100, Skonti: 75, "NettoNetto-Umsatz": 142 };
  function rechnung(w) {
    const g = k => w[IX[k]];
    return [`Nettoumsatz = Bruttoumsatz + Rabatte = ${eur(g("Bruttoumsatz"))} € ${op(g("Rabatte"))} = ${eur(g("Nettoumsatz"))} €`,
            `NettoNetto-Umsatz = Nettoumsatz + Skonti = ${eur(g("Nettoumsatz"))} € ${op(g("Skonti"))} = ${eur(g("NettoNetto-Umsatz"))} €`];
  }
  function faktentabelle(h) {
    bFakten.textContent = "";
    el("div", { class: "zl" }, bFakten, "Faktentabelle");
    const zz = gefiltert(), sm = summe(zz);
    const wertVon = (z, key) => (typeof key === "number" ? z.w[key] : z[key]);
    const liste = S.sort ? Z.slice().sort((a, b) => ((wertVon(a, S.sort.key) - wertVon(b, S.sort.key)) * (S.sort.ab ? -1 : 1)) || a.i - b.i) : Z;
    tabelle(bFakten, {
      id: "t-fakten", gruppeId: "g-rolle",
      gruppe: [["Dim.-ID", 3, false, true], ...KZ.map(k => [BER.has(k) ? "berechnet" : "Kennzahl", 1, true])],
      spalten: ID_SP.map(([key, titel, breite]) => ({ titel, breite, sort: key, id: key === "t" ? "sp-zeit" : undefined }))
        .concat(KZ.map((k, j) => ({ titel: k, breite: KZ_BREITE[k], re: true, sort: j, id: "sp-" + j }))),
      sort: S.sort, onSort: key => { S.sort = S.sort && S.sort.key === key ? { key, ab: !S.sort.ab } : { key, ab: false }; zeichnen(); },
      zeilen: liste.map(z => ({
        zellen: [String(z.p), String(z.k), String(z.t), ...z.w.map(eur)],
        blass: h.zeile && !h.zeile.has(z.i),
        klick: () => waehlen({ typ: "zeile", i: z.i }),
        tip: () => [`Zeile ${z.i + 1} von ${Z.length}`, `Produkt ${z.p} ${PN.get(z.p)} · Kunde ${z.k} ${KN.get(z.k)} · Jahr ${z.t}`,
          ...rechnung(z.w), "Klick zeigt die Dimensionen der Zeile, Esc hebt auf"],
      })).concat([{ summe: true, id: "z-summe", zellen: [S.auswahl && S.auswahl.typ === "dim" ? "Summe Auswahl" : "Summe", "", "", ...sm.map(eur)] }]),
    });
  }

  function hervor() {
    const a = S.auswahl, h = { zeile: null, dim: { p: null, k: null, t: null } };
    if (!a) return h;
    if (a.typ === "dim") { h.zeile = new Set(Z.filter(z => z[a.dim] === a.id).map(z => z.i)); h.dim[a.dim] = new Set([a.id]); }
    else { const z = Z[a.i]; h.zeile = new Set([z.i]); h.dim = { p: new Set([z.p]), k: new Set([z.k]), t: new Set([z.t]) }; }
    return h;
  }
  function botschaft() {
    const a = S.auswahl, sm = summe(gefiltert()), g = k => sm[IX[k]];
    if (a && a.typ === "dim") {
      const n = gefiltert().length;
      return passt([`${dimText(a.dim, a.id)}: ${anz(n, "Zeile", "Zeilen")}, ${eur(g("Bruttoumsatz"))} € Bruttoumsatz ergeben ${eur(g("NettoNetto-Umsatz"))} € NettoNetto-Umsatz`,
        `${dimText(a.dim, a.id)}: ${anz(n, "Zeile", "Zeilen")}, ${eur(g("NettoNetto-Umsatz"))} € NettoNetto-Umsatz`]);
    }
    if (a && a.typ === "zeile") {
      const z = Z[a.i], w = k => z.w[IX[k]];
      const r = `Nettoumsatz ${eur(w("Bruttoumsatz"))} € ${op(w("Rabatte"))} = ${eur(w("Nettoumsatz"))} €, NettoNetto-Umsatz ${op(w("Skonti"))} = ${eur(w("NettoNetto-Umsatz"))} €`;
      return passt([`${z.p} ${PN.get(z.p)} · ${z.k} ${KN.get(z.k)} · ${z.t}: ${r}`, `Zeile ${z.i + 1}: ${r}`]);
    }
    return passt([`Je Kennzahl eine Spalte, zwei davon je Zeile berechnet: ${eur(g("Bruttoumsatz"))} € Bruttoumsatz ergeben ${eur(g("NettoNetto-Umsatz"))} € NettoNetto-Umsatz`,
      `Je Kennzahl eine Spalte: ${eur(g("Bruttoumsatz"))} € Bruttoumsatz ergeben ${eur(g("NettoNetto-Umsatz"))} € NettoNetto-Umsatz`]);
  }
  function legende() {
    bLegende.textContent = "";
    el("div", {}, bLegende, "berechnet: Nettoumsatz = Bruttoumsatz + Rabatte · NettoNetto-Umsatz = Nettoumsatz + Skonti");
    const z = el("div", {}, bLegende);
    el("span", { style: "text-decoration:underline;text-underline-offset:2px;color:var(--text)" }, z, "unterstrichen");
    z.appendChild(document.createTextNode(": Schlüssel · Rabatte und Skonti als negative Werte"));
  }

  function zeichnen() {
    const h = hervor();
    DK.visual(bTitel, { titel: "Kennzahlenmodell", einheit: "Werte in €", botschaft: botschaft() });
    dimensionen(h);
    faktentabelle(h);
    legende();
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  /* ---------- Lernplattform: Designregeln, Nachbau, Tabellen, CSV ---------- */
  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "v-titel", versatz: [0, 0], regel: "SAY – Botschaft vermitteln", titel: "Aussage zum Modell",
        text: "Unter dem Titel steht, was das Kennzahlenmodell ausmacht: je Kennzahl eine Spalte, zwei davon je Zeile berechnet; aus 4.000 € Bruttoumsatz werden 3.714 € NettoNetto-Umsatz – aus den Zeilen berechnet und filterabhängig. Das Original zeigte nur die Tabellen." },
      { nr: 2, ziel: "z-dim", versatz: [0, 0], regel: "STRUCTURE – Inhalte ordnen", titel: "Dimensionen oben, Fakten darunter",
        text: "Wie im Original stehen die drei Dimensionstabellen über der Faktentabelle; die Kennzahlen folgen der Rechnung vom Bruttoumsatz zum NettoNetto-Umsatz. Dieselben Stammdaten und Werte zeigen die Abbildungen 5.25 bis 5.27 als Kontenmodell – dort als zwölf Buchungen auf drei Konten." },
      { nr: 3, ziel: "g-rolle-0", versatz: [0, 0], regel: "UNIFY – Semantische Notation", titel: "Rolle der Spalte im Kopf",
        text: "Die Kopfzeile über den Spaltennamen nennt die Rolle jeder Spalte: Dim.-ID (unterstrichen als Schlüssel wie in den Dimensionstabellen), Kennzahl oder berechnet. Das Original schrieb „Berechnete Kennzahl“ zweizeilig über die Spalten und brach „NettoNetto-Umsatz“ um." },
      { nr: 4, ziel: "z-summe", anker: "links", versatz: [100, 3], regel: "CHECK – Visuelle Integrität", titel: "Summenzeile zum Nachrechnen",
        text: "Neu ist die Summenzeile: 4.000 € − 210 € = 3.790 € Nettoumsatz, − 76 € = 3.714 € NettoNetto-Umsatz. Alle vier Zeilen des Originals rechnen richtig. Bei einem Filter summiert sie nur die gewählten Zeilen – dieselben Werte liefert die Hierarchie des Kontenmodells." },
      { nr: 5, ziel: "legende", versatz: [0, 0], regel: "EXPRESS – Rechenregel zeigen", titel: "Formeln unter der Tabelle",
        text: "Die Rechenregeln der berechneten Kennzahlen stehen unter der Tabelle, der Tooltip einer Zeile rechnet sie mit den Werten vor. Im Original war nur zu erkennen, dass eine Spalte berechnet ist, nicht wie." },
      { nr: 6, ziel: "sp-zeit", versatz: [0, 0], regel: "SIMPLIFY – Einheitliche Zahlen", titel: "Zahlenformat, kein Gitter",
        text: "Tausenderpunkt und echtes Minus (−100 statt -100), Beträge rechtsbündig, Schlüssel linksbündig, die Einheit einmal im Titel. Gitternetz und Rahmen des Tabellenblatts entfallen; Haarlinien trennen die Zeilen, eine dunkle Linie den Kopf." },
      { nr: 7, ziel: "sp-schluessel", versatz: [4, 0], regel: "CONDENSE – Details im Tooltip", titel: "Bezeichnungen im Tooltip",
        text: "Die Faktentabelle enthält nur Schlüssel; Produkt-, Kunden- und Jahresbezeichnung nennt der Tooltip. Ein Klick auf eine Dimensionszeile filtert die Faktentabelle, ein Klick auf eine Zeile der Faktentabelle hebt ihre Dimensionen hervor." },
    ],
    nachbauIntro: `Standard-Visuals von Power BI Desktop. Seitengröße benutzerdefiniert 727 × ${H} px. Schrift Arial: Tabellen 10,5 pt, Visualtitel 12 pt. Datenmodell: Faktentabelle Umsätze (vier Zeilen wie in der CSV-Datei, ohne die berechneten Spalten) mit 1:n-Beziehungen zu Produkt, Kunde und Zeit (Sternschema).`,
    nachbau: [
      { id: "A", ziel: "z-fakten", versatz: [0, 0], titel: "Faktentabelle", visual: "Tabelle",
        felder: "Umsätze[Produkt], Umsätze[Kunde], Umsätze[Zeit]; Measures Bruttoumsatz = SUM(Umsätze[Bruttoumsatz]), Rabatte = SUM(Umsätze[Rabatte]), Nettoumsatz = [Bruttoumsatz] + [Rabatte], Skonti = SUM(Umsätze[Skonti]), NettoNetto-Umsatz = [Nettoumsatz] + [Skonti]",
        format: "Schrift 10,5 pt; Gesamtsummen an (Summenzeile fett, Linie #3A3F44); Zeilenraster #EFEFEF; Format #.##0 mit Minuszeichen",
        hinweis: "Berechnete Kennzahlen als Measures statt gespeicherter Spalten: Sie stimmen dann auch in der Summenzeile und auf jeder Verdichtungsstufe. Die Rollenzeile (Dim.-ID, Kennzahl, berechnet) als Textfeld über der Tabelle." },
      { id: "B", ziel: "z-dim", versatz: [0, 0], titel: "Dimensionstabellen", visual: "drei Tabellen",
        felder: "Produkt[Produkt-ID], Produkt[Produkt-Bez.]; Kunde[Kunde-ID], Kunde[Kunde-Bez.]; Zeit[Zeit-ID], Zeit[Jahr]",
        format: "wie A, ohne Gesamtsummen",
        hinweis: "Format → Interaktionen bearbeiten: Klick auf eine Zeile filtert die Faktentabelle." },
      { id: "C", ziel: "v-titel", versatz: [0, 0], titel: "Aussage", visual: "Textfeld mit dynamischem Wert",
        felder: "Text-Measure, z. B. \"Je Kennzahl eine Spalte: \" & FORMAT([Bruttoumsatz]; \"#.##0\") & \" € Bruttoumsatz ergeben \" & FORMAT([NettoNetto-Umsatz]; \"#.##0\") & \" € NettoNetto-Umsatz\"",
        format: "10,5 pt, #4D4D4D" },
      { id: "D", ziel: "legende", versatz: [0, 0], titel: "Rechenregeln", visual: "Textfeld", felder: "statischer Text", format: "10,5 pt, #4D4D4D" },
    ],
    theme: DK.thema(),
    csv: { name: "kennzahlenmodell_daten.csv", text: () => DATA.csv },
    tabellen: () => [
      { titel: "Dimensionstabellen", kopf: ["Dimension", "ID", "Bezeichnung"],
        zeilen: [...DATA.produkte.map(([i, b]) => ["Produkt", String(i), b]), ...DATA.kunden.map(([i, b]) => ["Kunde", String(i), b]),
                 ...DATA.zeit.map(([i, b]) => ["Zeit", String(i), String(b)])] },
      { titel: `Faktentabelle (Werte in €${S.auswahl && S.auswahl.typ === "dim" ? ", " + dimText(S.auswahl.dim, S.auswahl.id) : ""})`,
        kopf: ["Produkt", "Kunde", "Zeit", ...KZ],
        zeilen: gefiltert().map(z => [String(z.p), String(z.k), String(z.t), ...z.w.map(eur)])
          .concat([["Summe", "", "", ...summe(gefiltert()).map(eur)]]) },
    ],
  });
  zeichnen();
})();
