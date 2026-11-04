/* Einzelvisual „Erweiterte Kreuztabelle“ (Tab. 3.3) – interaktive Fassung für die Lernplattform; im Druck bleibt die
   LaTeX-Tabelle tabellen/Erweiterte_Kreuztabelle.tex. Seite 727 x 310 px = 110 x 46,9 mm.
   Daten: erweitert.json (daten_erweitert.py) – Absatz in Stück je Kunde und Produkt, Werte des Originals; Produkt 1 und 2
   bilden Produktgruppe A, Produkt 3 und 4 Produktgruppe B. Teilsummen je Produktgruppe als eigene Spalte.
   Interaktion: Klick auf den Gruppenkopf klappt die Produktgruppe auf oder zu (Drill-Down/Roll-Up, vgl. Abb. 3.37),
   Datenschnitt für alle Gruppen; Klick auf eine Zelle hebt Zeile und Spalte hervor, Esc hebt auf; Klick auf einen
   Spaltenkopf sortiert; „Werte anzeigen als“ wie in Tab. 3.2; Tooltip mit Anteilen an Kunde, Gruppe und Gesamt. */
(() => {
  "use strict";
  const { zahl, NBSP, el } = DK;
  const K = DATA.kunden, PR = DATA.produkte, A = DATA.absatz, G = DATA.gruppen, EINHEIT = DATA.einheit;
  const ALLE = PR.map((_, j) => j);
  const pz = (a, b) => zahl(b ? a / b * 100 : 0, 0) + NBSP + "%";
  const wert = (k, prods) => K.reduce((s, _, i) => (k == null || k === i ? s + prods.reduce((t, j) => t + A[i][j], 0) : s), 0);
  const GES = wert(null, ALLE);
  const gruppeVon = j => G.findIndex(([, idx]) => idx.includes(j));
  const maxIdx = (liste, f) => liste.reduce((best, x) => (f(x) > f(best) ? x : best), liste[0]);

  /* ---------- Zustand ---------- */
  const S = { offen: G.map(() => true), anzeige: "abs", sel: { k: null, s: null }, sort: null };
  const keineAuswahl = () => S.sel.k == null && S.sel.s == null;
  const waehlen = (k, s) => {
    S.sel = S.sel.k === k && S.sel.s === s ? { k: null, s: null } : { k, s };
    zeichnen();
  };
  addEventListener("keydown", e => { if (e.key === "Escape" && !keineAuswahl()) { S.sel = { k: null, s: null }; zeichnen(); } });
  function klappen(g, offen) {
    S.offen[g] = offen;
    if (!offen) {                                            // Auswahl und Sortierung auf die Teilsumme übertragen
      const inG = key => key != null && key[0] === "p" && gruppeVon(+key.slice(1)) === g;
      if (inG(S.sel.s)) S.sel.s = "g" + g;
      if (S.sort && inG(S.sort.key)) S.sort = null;
    }
    zeichnen();
  }

  /* ---------- Layout ---------- */
  DK.init({ titel: "Erweiterte Kreuztabelle", breite: 727, hoehe: 310 });
  const bTitel = DK.box("v-titel", 16, 8, 695, 46);
  const bFilter = DK.box("filter", 16, 60, 695, 50, "dk-filter");
  DK.haarlinie(116);
  const bTab = DK.box("v-tabelle", 16, 126, 695, 176);
  DK.el("style", {}, document.head, `
    .tp { table-layout: fixed; }
    .tp td { height: 24px; }
    .tp th { height: 22px; vertical-align: bottom; }
    .tp tr.tp-oben th { border-bottom: none; color: var(--text); text-align: center; padding-bottom: 7px; }
    .tp tr.tp-oben th.tp-gruppe { position: relative; }
    .tp tr.tp-oben th.tp-gruppe::after { content: ""; position: absolute; left: 8px; right: 8px; bottom: 2px;
      border-bottom: 1px solid #9A9A9A; }
    .tp tr.dk-summe { cursor: pointer; }
    .tp th.tp-aktiv { color: var(--text); font-weight: bold; }
    .tp td.tp-fett, .tp td.tp-teil { font-weight: bold; }`);

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

  /* ---------- Spalten (aufgeklappt: Produkte + Teilsumme je Gruppe; zugeklappt: nur Teilsumme) ---------- */
  function spalten() {
    const s = [];
    G.forEach(([, idx], g) => {
      if (S.offen[g]) idx.forEach(j => s.push({ key: "p" + j, typ: "p", j, g, prods: [j], titel: PR[j], breite: 82 }));
      s.push({ key: "g" + g, typ: "g", g, prods: idx, titel: "Teilsumme", breite: S.offen[g] ? 92 : 150 });
    });
    s.push({ key: "s", typ: "s", prods: ALLE, titel: "Summe", breite: 73 });
    return s;
  }
  const spName = c => (c.typ === "p" ? PR[c.j] : c.typ === "g" ? G[c.g][0] : "alle Produkte");
  const ANZEIGE = { abs: EINHEIT, zeile: "Anteil an der Zeilensumme in %", spalte: "Anteil an der Spaltensumme in %",
                    gesamt: "Anteil am Gesamtabsatz in %" };
  function anteil(k, prods) {
    const v = wert(k, prods);
    if (S.anzeige === "abs") return v;
    const b = S.anzeige === "zeile" ? wert(k, ALLE) : S.anzeige === "spalte" ? wert(null, prods) : GES;
    return b ? v / b : 0;
  }
  const anzeigen = (k, prods) => (S.anzeige === "abs" ? zahl(wert(k, prods)) : zahl(anteil(k, prods) * 100, 0) + NBSP + "%");
  const sichtbar = (k, key) => keineAuswahl() || (S.sel.k != null && k === S.sel.k) || (S.sel.s != null && key === S.sel.s);

  function sortieren(key) {
    if (S.sort && S.sort.key === key) S.sort = { key, ab: !S.sort.ab };
    else S.sort = { key, ab: key !== "name" };
    zeichnen();
  }
  const pfeil = key => (S.sort && S.sort.key === key ? (S.sort.ab ? " ▾" : " ▴") : "");

  function botschaft(sp) {
    const { k, s } = S.sel, c = sp.find(x => x.key === s);
    if (k != null && c && c.typ !== "s") {
      const v = wert(k, c.prods), zweit = c.typ === "p" ? `${pz(v, wert(k, G[c.g][1]))} der ${G[c.g][0]}` : `${pz(v, wert(null, c.prods))} der ${G[c.g][0]}`;
      return `${K[k]} × ${spName(c)}: ${zahl(v)} ${EINHEIT} – ${pz(v, wert(k, ALLE))} von ${K[k]}, ${zweit}`;
    }
    if (k != null) {
      const v = wert(k, ALLE), g = maxIdx(G.map((_, i) => i), g => wert(k, G[g][1]));
      return `${K[k]}: ${zahl(v)} ${EINHEIT} (${pz(v, GES)} des Absatzes), davon ${pz(wert(k, G[g][1]), v)} ${G[g][0]}`;
    }
    if (c && c.typ === "p") {
      const v = wert(null, c.prods);
      return `${PR[c.j]}: ${zahl(v)} ${EINHEIT} = ${pz(v, wert(null, G[c.g][1]))} der ${G[c.g][0]}, ${pz(v, GES)} des Absatzes`;
    }
    if (c && c.typ === "g") {
      const v = wert(null, c.prods), i = maxIdx(K.map((_, i) => i), i => wert(i, c.prods));
      return `${G[c.g][0]}: ${zahl(v)} ${EINHEIT} (${pz(v, GES)}), größter Kunde: ${K[i]} (${pz(wert(i, c.prods), v)})`;
    }
    const g = maxIdx(G.map((_, i) => i), g => wert(null, G[g][1])), j = maxIdx(ALLE, j => -wert(null, [j]));
    return `${G[g][0]} trägt ${pz(wert(null, G[g][1]), GES)} des Absatzes (${zahl(wert(null, G[g][1]))} von ${zahl(GES)} ${EINHEIT}), ` +
           `schwächstes Produkt: ${PR[j]} (${zahl(wert(null, [j]))})`;
  }

  function tabelleZeichnen(sp) {
    const zeilen = K.map((_, i) => i);
    if (S.sort) {
      const c = sp.find(x => x.key === S.sort.key);
      const f = r => (S.sort.key === "name" || !c ? r : anteil(r, c.prods));
      zeilen.sort((a, b) => { const d = f(a) - f(b); return (S.sort.ab ? -d : d) || a - b; });
    }
    const zelle = (k, c) => ({ text: anzeigen(k, c.prods), blass: !sichtbar(k, c.key),
      klasse: c.typ !== "p" ? "tp-teil" : k != null && k === S.sel.k && c.key === S.sel.s ? "tp-fett" : "" });
    const z = zeilen.map(k => ({ k, zellen: [{ text: K[k], blass: S.sel.k != null && k !== S.sel.k }, ...sp.map(c => zelle(k, c))] }));
    z.push({ k: null, summe: true, zellen: [{ text: "Summe", blass: S.sel.k != null }, ...sp.map(c => zelle(null, c))] });
    const kopf1 = [{ text: "" }];
    G.forEach(([gname, idx], g) => kopf1.push({ text: gname + (DK.PRINT ? "" : S.offen[g] ? " ▾" : " ▸"), span: S.offen[g] ? idx.length + 1 : 1,
      klasse: "tp-gruppe", id: "ek-gruppe-" + g, titel: "Klick klappt die Produktgruppe auf oder zu", onClick: () => klappen(g, !S.offen[g]) }));
    kopf1.push({ text: "" });
    const spalteVon = j => (j == null || j === 0 ? null : sp[j - 1]);
    tabelle(bTab, {
      breiten: [110, ...sp.map(c => c.breite)],
      kopf: [kopf1, [{ text: "Kunde" + pfeil("name"), id: "ek-kunde", onClick: () => sortieren("name") },
        ...sp.map(c => ({ text: c.titel + pfeil(c.key), id: "ek-sp-" + c.key, klasse: c.key === S.sel.s ? "tp-aktiv" : "",
                          onClick: () => sortieren(c.key) }))]],
      zeilen: z,
      onClick: (zeile, j) => {
        const c = spalteVon(j);
        if (zeile.k == null) { if (c && c.typ !== "s") waehlen(null, c.key); else if (!keineAuswahl()) waehlen(S.sel.k, S.sel.s); return; }
        if (c && c.typ !== "s") waehlen(zeile.k, c.key); else waehlen(zeile.k, null);
      },
      tooltip: (zeile, j) => {
        const c = spalteVon(j) || sp[sp.length - 1], k = zeile.k, v = wert(k, c.prods);
        const t = [`${k == null ? "alle Kunden" : K[k]} · ${spName(c)}`];
        t.push(`Absatz ${zahl(v)} ${EINHEIT}` + (c.typ === "g" ? ` = ${c.prods.map(j => `${zahl(wert(k, [j]))}`).join(" + ")} (${c.prods.map(j => PR[j]).join(", ")})` : ""));
        if (k != null && c.typ !== "s") t.push(`Anteil an ${K[k]}: ${pz(v, wert(k, ALLE))}`);
        if (c.typ === "p") t.push(`Anteil an ${G[c.g][0]}${k != null ? " bei " + K[k] : ""}: ${pz(v, wert(k, G[c.g][1]))}`);
        if (k != null || c.typ !== "s") t.push(`Anteil am Gesamtabsatz: ${pz(v, GES)}`);
        else t.push(`Teilsummen ${G.map(([, idx]) => zahl(wert(null, idx))).join(" + ")} = ${zahl(GES)} ${EINHEIT}`);
        t.push(k != null && c.typ !== "s" ? "Klick hebt Zeile und Spalte hervor, Esc hebt auf" : "Klick hebt hervor, Esc hebt auf");
        return t;
      },
    });
  }

  /* ---------- Zeichnen ---------- */
  function zeichnen() {
    const sp = spalten();
    DK.visual(bTitel, { titel: "Absatz nach Kunden und Produktgruppen", einheit: ANZEIGE[S.anzeige], botschaft: botschaft(sp) });
    bFilter.textContent = "";
    const zustand = S.offen.every(x => x) ? "auf" : S.offen.every(x => !x) ? "zu" : "gemischt";
    DK.schnitt(bFilter, "Produktgruppen", "knoepfe", {
      optionen: [["auf", "aufgeklappt"], ["zu", "zugeklappt"]], wert: zustand,
      onChange: v => { S.offen = G.map(() => v === "auf"); if (v === "zu") G.forEach((_, g) => klappen(g, false)); else zeichnen(); } });
    DK.schnitt(bFilter, "Werte anzeigen als", "knoepfe", {
      optionen: [["abs", "Stück"], ["zeile", "% Zeile"], ["spalte", "% Spalte"], ["gesamt", "% Gesamt"]], wert: S.anzeige,
      onChange: v => { if (v !== S.anzeige) { S.anzeige = v; zeichnen(); } } });
    tabelleZeichnen(sp);
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  /* ---------- Lernplattform: Designregeln, Nachbau, Tabellen, CSV ---------- */
  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "ek-gruppe-0", anker: "links", versatz: [20, 0], regel: "STRUCTURE – Inhalte ordnen", titel: "Gruppen im Spaltenkopf",
        text: "Die Produkte sind nach Produktgruppen geordnet; ein zweizeiliger Spaltenkopf zeigt die Hierarchie Produktgruppe → Produkt. Jede Gruppe endet mit ihrer Teilsumme, ganz rechts steht die Summe über alle Gruppen." },
      { nr: 2, ziel: "ek-gruppe-1", versatz: [-8, 0], regel: "CONDENSE – Auf- und zuklappen", titel: "Teilsummen per Klick",
        text: "Ein Klick auf den Gruppenkopf klappt die Produktgruppe zu – übrig bleibt nur ihre Teilsumme – und wieder auf; der Datenschnitt „Produktgruppen“ tut das für alle Gruppen. Das ist Roll-Up bzw. Drill-Down aus Abb. 3.37 in einer Tabelle." },
      { nr: 3, ziel: "v-tabelle", anker: "links", versatz: [312, 147], regel: "UNIFY – Eindeutige Begriffe", titel: "Teilsumme und Summe",
        text: "Das Original hatte zwei Summenzeilen: „Zw.-Summe“ je Produkt und darunter „Summe“ je Produktgruppe in verbundenen Zellen. Jetzt gibt es eine Teilsummen-Spalte je Gruppe und eine Summenzeile; die Gruppensummen 1.000 und 600 stehen dort unter „Teilsumme“." },
      { nr: 4, ziel: "v-titel", anker: "links", versatz: [690, 22], regel: "SAY – Botschaft vermitteln", titel: "Aussage unter dem Titel",
        text: "Unter dem Titel steht in einem Satz, was die Tabelle zeigt: die stärkere Produktgruppe und das schwächste Produkt – bei einer Auswahl die Werte des Kunden, der Gruppe oder der Zelle." },
      { nr: 5, ziel: "v-tabelle", anker: "links", versatz: [112, 147], regel: "CHECK – Visuelle Integrität", titel: "Teilsummen addieren sich",
        text: "Produkt 1 + Produkt 2 = Teilsumme A, Produkt 3 + Produkt 4 = Teilsumme B, Teilsumme A + B = Summe (1.000 + 600 = 1.600 Stück). Der Tooltip einer Teilsumme zeigt ihre Summanden, der Tooltip eines Produkts seinen Anteil an der Gruppe." },
      { nr: 6, ziel: "v-tabelle", anker: "links", versatz: [112, 75], regel: "EXPRESS – Hervorheben statt Farbe", titel: "Fadenkreuz per Klick",
        text: "Ein Klick auf eine Zelle hebt Zeile und Spalte hervor, ein Klick auf einen Kunden oder eine Summe nur die Zeile bzw. Spalte. Teil- und Gesamtsummen sind fett, Farbflächen sind nicht nötig. Esc hebt auf." },
      { nr: 7, ziel: "filter", anker: "links", versatz: [553, 28], regel: "SIMPLIFY – Anteile statt Kopfrechnen", titel: "Werte anzeigen als",
        text: "Wie in Tab. 3.2 zeigt die Tabelle auf Wunsch Prozent der Zeile, der Spalte oder des Gesamtabsatzes. Mit „% Zeile“ und zugeklappten Gruppen wird z. B. sichtbar, dass Kunde 4 zu 73 % Produktgruppe A kauft." },
    ],
    nachbauIntro: "Standard-Visuals von Power BI Desktop. Seitengröße benutzerdefiniert 727 × 310 px. Schrift Arial: Matrix 10,5 pt, Visualtitel 12 pt. Datenmodell: Tabelle Absatz (Kunde, Produktgruppe, Produkt, Absatz) wie in der CSV-Datei; Hierarchie Produktgruppe → Produkt.",
    nachbau: [
      { id: "A", ziel: "v-tabelle", anker: "links", versatz: [112, 75], titel: "Erweiterte Kreuztabelle", visual: "Matrix",
        felder: "Zeilen: Kunde; Spalten: Produktgruppe, Produkt (Hierarchie); Werte: Summe von Absatz",
        format: "Spaltenteilergebnisse an, Position „nach“ der Gruppe, Beschriftung „Teilsumme“; Gesamtsumme „Summe“; Teil- und Gesamtsummen fett; Spaltenkopf mit Unterstrich #3A3F44",
        hinweis: "Aufklappen über „Alle auf die nächste Ebene der Hierarchie erweitern“ im Visualkopf (gilt für alle Gruppen); +/–-Symbole je Gruppe bietet die Matrix nur für Zeilenköpfe – dafür Produktgruppe und Produkt in die Zeilen legen." },
      { id: "B", ziel: "filter", anker: "links", versatz: [553, 28], titel: "Werte anzeigen als", visual: "Datenschnitt mit Feldparameter",
        felder: "Feldparameter mit vier Measures: Absatz = SUM(Absatz[Absatz]); % Zeile, % Spalte, % Gesamt jeweils DIVIDE([Absatz]; CALCULATE([Absatz]; ALLSELECTED(…)))",
        format: "Kacheln, Einzelauswahl; ausgewählt #3A3F44 mit weißer Schrift; Prozent ohne Dezimalstellen" },
    ],
    theme: DK.thema(),
    csv: { name: "absatz_produktgruppen_daten.csv", text: () => {
      const z = ["Kunde;Produktgruppe;Produkt;Absatz_Stueck"];
      K.forEach((k, i) => PR.forEach((p, j) => z.push(`${k};${G[gruppeVon(j)][0]};${p};${A[i][j]}`)));
      return z.join("\r\n"); } },
    tabellen: () => {
      const sp = spalten();
      return [{ titel: `Absatz nach Kunden und Produktgruppen (${ANZEIGE[S.anzeige]})`,
        kopf: ["Kunde", ...sp.map(c => (c.typ === "g" ? "Teilsumme " + G[c.g][0].slice(-1) : c.titel))],
        zeilen: [...K.map((k, i) => [k, ...sp.map(c => anzeigen(i, c.prods))]), ["Summe", ...sp.map(c => anzeigen(null, c.prods))]] }];
    },
  });
  zeichnen();
})();
