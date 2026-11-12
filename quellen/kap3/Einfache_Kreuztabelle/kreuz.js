/* Einzelvisual „Einfache Kreuztabelle“ (Tab. 3.2) – interaktive Fassung für die Lernplattform; im Druck bleibt die
   LaTeX-Tabelle tabellen/Einfache_Kreuztabelle.tex. Seite 727 x 310 px = 110 x 46,9 mm.
   Daten: kreuz.json (daten_kreuz.py) – Absatz in Stück je Kunde und Produkt, Werte des Originals; Summen rechnet das Visual.
   Interaktion: Klick auf eine Zelle hebt ihre Zeile und Spalte hervor (Fadenkreuz), Klick auf eine Zeilenbeschriftung
   oder Summe die ganze Zeile bzw. Spalte, Esc hebt auf; Klick auf einen Spaltenkopf sortiert. Datenschnitte: Zeilen
   und Spalten tauschen (Rotation, vgl. Abb. 3.34) und „Werte anzeigen als“ (Stück oder Anteile). Tooltip mit Anteilen. */
(() => {
  "use strict";
  const { zahl, NBSP, el } = DK;
  const K = DATA.kunden, PR = DATA.produkte, A = DATA.absatz, EINHEIT = DATA.einheit;
  const pz = (a, b) => zahl(b ? a / b * 100 : 0, 0) + NBSP + "%";
  const wert = (k, p) => {
    let s = 0;
    K.forEach((_, i) => PR.forEach((_, j) => { if ((k == null || k === i) && (p == null || p === j)) s += A[i][j]; }));
    return s;
  };
  const GES = wert(null, null);
  const maxIdx = (liste, f) => liste.reduce((best, _, i) => (f(i) > f(best) ? i : best), 0);

  /* ---------- Zustand ---------- */
  const S = { zeilen: "kunde", anzeige: "abs", sel: { k: null, p: null }, sort: null };
  const keineAuswahl = () => S.sel.k == null && S.sel.p == null;
  const waehlen = (k, p) => {
    S.sel = S.sel.k === k && S.sel.p === p ? { k: null, p: null } : { k, p };
    zeichnen();
  };
  addEventListener("keydown", e => { if (e.key === "Escape" && !keineAuswahl()) { S.sel = { k: null, p: null }; zeichnen(); } });

  /* ---------- Layout ---------- */
  DK.init({ titel: "Einfache Kreuztabelle", breite: 727, hoehe: 310 });
  const bTitel = DK.box("v-titel", 16, 8, 695, 46);
  const bFilter = DK.box("filter", 16, 60, 695, 50, "dk-filter");
  DK.haarlinie(116);
  const bTab = DK.box("v-tabelle", 16, 126, 695, 176);
  DK.el("style", {}, document.head, `
    .tp { table-layout: fixed; }
    .tp td { height: 24px; }
    .tp th { height: 22px; vertical-align: bottom; }
    .tp tr.tp-oben th { border-bottom: none; color: var(--muted); text-align: center; padding-bottom: 7px; }
    .tp tr.tp-oben th.tp-gruppe { position: relative; }
    .tp tr.tp-oben th.tp-gruppe::after { content: ""; position: absolute; left: 8px; right: 8px; bottom: 2px;
      border-bottom: 1px solid #9A9A9A; }
    .tp tr.dk-summe { cursor: pointer; }
    .tp th.tp-aktiv { color: var(--text); font-weight: bold; }
    .tp td.tp-fett { font-weight: bold; }
    .tp td.tp-randsumme { font-weight: bold; }`);

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

  /* ---------- Anordnung und Anzeige ---------- */
  const DIM = { kunde: { name: "Kunde", liste: K, mehrzahl: "Kunden" }, produkt: { name: "Produkt", liste: PR, mehrzahl: "Produkten" } };
  const zDim = () => DIM[S.zeilen], sDim = () => DIM[S.zeilen === "kunde" ? "produkt" : "kunde"];
  const kp = (r, c) => (S.zeilen === "kunde" ? [r, c] : [c, r]);            // Tabellenposition → [Kunde, Produkt]
  const ANZEIGE = { abs: EINHEIT, zeile: "Anteil an der Zeilensumme in %", spalte: "Anteil an der Spaltensumme in %",
                    gesamt: "Anteil am Gesamtabsatz in %" };
  function anteil(k, p) {
    const v = wert(k, p);
    if (S.anzeige === "abs") return v;
    const zs = S.zeilen === "kunde" ? wert(k, null) : wert(null, p);
    const ss = S.zeilen === "kunde" ? wert(null, p) : wert(k, null);
    const b = S.anzeige === "zeile" ? zs : S.anzeige === "spalte" ? ss : GES;
    return b ? v / b : 0;
  }
  const anzeigen = (k, p) => (S.anzeige === "abs" ? zahl(wert(k, p)) : zahl(anteil(k, p) * 100, 0) + NBSP + "%");
  const sichtbar = (k, p) => keineAuswahl() || (S.sel.k != null && k === S.sel.k) || (S.sel.p != null && p === S.sel.p);
  const name = (k, p) => [k == null ? "alle Kunden" : K[k], p == null ? "alle Produkte" : PR[p]].join(" · ");

  function sortieren(key) {
    if (S.sort && S.sort.key === key) S.sort = { key, ab: !S.sort.ab };
    else S.sort = { key, ab: key !== "name" };
    zeichnen();
  }
  const pfeil = key => (S.sort && S.sort.key === key ? (S.sort.ab ? " ▾" : " ▴") : "");

  function botschaft() {
    const { k, p } = S.sel;
    if (k != null && p != null) {
      const v = wert(k, p);
      return `${K[k]} × ${PR[p]}: ${zahl(v)} ${EINHEIT} – ${pz(v, wert(k, null))} von ${K[k]}, ${pz(v, wert(null, p))} von ${PR[p]}`;
    }
    if (k != null) {
      const v = wert(k, null), j = maxIdx(PR, j => wert(k, j));
      return `${K[k]}: ${zahl(v)} ${EINHEIT} (${pz(v, GES)} des Absatzes), davon ${pz(wert(k, j), v)} ${PR[j]}`;
    }
    if (p != null) {
      const v = wert(null, p), i = maxIdx(K, i => wert(i, p));
      return `${PR[p]}: ${zahl(v)} ${EINHEIT} (${pz(v, GES)} des Absatzes), davon ${pz(wert(i, p), v)} an ${K[i]}`;
    }
    const i = maxIdx(K, i => wert(i, null)), j = maxIdx(PR, j => wert(null, j));
    const teilK = `größter Kunde: ${K[i]} (${pz(wert(i, null), GES)})`, teilP = `stärkstes Produkt: ${PR[j]} (${pz(wert(null, j), GES)})`;
    return `Gesamtabsatz ${zahl(GES)} ${EINHEIT} – ` + (S.zeilen === "kunde" ? `${teilK}, ${teilP}` : `${teilP}, ${teilK}`);
  }

  function tabelleZeichnen() {
    const zeilen = zDim().liste.map((_, i) => i), spalten = sDim().liste.map((_, i) => i);
    if (S.sort) {
      const f = r => (S.sort.key === "name" ? r : S.sort.key === "summe" ? anteil(...kp(r, null)) : anteil(...kp(r, S.sort.key)));
      zeilen.sort((a, b) => { const c = f(a) - f(b); return (S.sort.ab ? -c : c) || a - b; });
    }
    const selZ = S.zeilen === "kunde" ? S.sel.k : S.sel.p, selS = S.zeilen === "kunde" ? S.sel.p : S.sel.k;
    const zelle = (r, c) => {
      const [k, p] = kp(r, c);
      const kreuz = r != null && c != null && r === selZ && c === selS;
      return { text: anzeigen(k, p), blass: !sichtbar(k, p), klasse: kreuz ? "tp-fett" : c == null || r == null ? "tp-randsumme" : "" };
    };
    const z = zeilen.map(r => ({ r, zellen: [{ text: zDim().liste[r], blass: selZ != null && r !== selZ },
      ...spalten.map(c => zelle(r, c)), zelle(r, null)] }));
    z.push({ r: null, summe: true, zellen: [{ text: "Summe", blass: selZ != null }, ...spalten.map(c => zelle(null, c)), zelle(null, null)] });
    const spalteVon = j => (j == null || j === 0 ? "label" : j <= spalten.length ? spalten[j - 1] : "summe");
    tabelle(bTab, {
      breiten: [140, 115, 115, 115, 115, 95],
      kopf: [
        [{ text: zDim().name + pfeil("name"), id: "kt-zeilendim", onClick: () => sortieren("name") },
         ...spalten.map(c => ({ text: sDim().liste[c] + pfeil(c), id: "kt-sp-" + c, klasse: c === selS ? "tp-aktiv" : "",
                                onClick: () => sortieren(c) })),
         { text: "Summe" + pfeil("summe"), id: "kt-summe", onClick: () => sortieren("summe") }],
      ],
      zeilen: z,
      onClick: (zeile, j) => {
        const c = spalteVon(j), r = zeile.r;
        if (r == null) {                                       // Summenzeile: Spalte hervorheben
          if (typeof c === "number") waehlen(...kp(null, c)); else if (!keineAuswahl()) waehlen(S.sel.k, S.sel.p);
          return;
        }
        if (typeof c === "number") waehlen(...kp(r, c)); else waehlen(...kp(r, null));
      },
      tooltip: (zeile, j) => {
        const c = spalteVon(j), [k, p] = kp(zeile.r, typeof c === "number" ? c : null), v = wert(k, p);
        const t = [name(k, p), `Absatz ${zahl(v)} ${EINHEIT}`];
        if (k != null && p != null) t.push(`Anteil an ${K[k]}: ${pz(v, wert(k, null))} · an ${PR[p]}: ${pz(v, wert(null, p))}`);
        if (k != null || p != null) t.push(`Anteil am Gesamtabsatz: ${pz(v, GES)}`);
        else t.push(`Summe der Zeilensummen = Summe der Spaltensummen = ${zahl(GES)} ${EINHEIT}`);
        t.push(k != null && p != null ? "Klick hebt Zeile und Spalte hervor, Esc hebt auf" : "Klick hebt hervor, Esc hebt auf");
        return t;
      },
    });
  }

  /* ---------- Zeichnen ---------- */
  function zeichnen() {
    DK.visual(bTitel, { titel: `Absatz nach ${zDim().mehrzahl} und ${sDim().mehrzahl}`, einheit: ANZEIGE[S.anzeige], botschaft: botschaft() });
    bFilter.textContent = "";
    DK.schnitt(bFilter, "Zeilen", "knoepfe", {
      optionen: [["kunde", "Kunden"], ["produkt", "Produkte"]], wert: S.zeilen,
      onChange: v => { if (v !== S.zeilen) { S.zeilen = v; S.sort = null; zeichnen(); } } });
    DK.schnitt(bFilter, "Werte anzeigen als", "knoepfe", {
      optionen: [["abs", "Stück"], ["zeile", "% Zeile"], ["spalte", "% Spalte"], ["gesamt", "% Gesamt"]], wert: S.anzeige,
      onChange: v => { if (v !== S.anzeige) { S.anzeige = v; zeichnen(); } } });
    tabelleZeichnen();
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  /* ---------- Lernplattform: Designregeln, Nachbau, Tabellen, CSV ---------- */
  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "kt-sp-0", anker: "links", versatz: [0, 0], regel: "STRUCTURE – Inhalte ordnen", titel: "Zwei Dimensionen, eine Zelle je Kombination",
        text: "Kunden bilden die Zeilen, Produkte die Spalten; jede Zelle enthält den Absatz einer Kombination, am Rand stehen die Summen. Aus 16 Datensätzen einer flachen Tabelle (siehe „Daten (CSV)“ und Tab. 3.1) wird so eine 4 × 4-Matrix." },
      { nr: 2, ziel: "filter", anker: "links", versatz: [78, 5], regel: "CONDENSE – Perspektive wechseln", titel: "Zeilen und Spalten tauschen",
        text: "Der Datenschnitt „Zeilen“ dreht die Tabelle: Produkte in die Zeilen, Kunden in die Spalten. Die Werte bleiben gleich, nur die Leserichtung ändert sich – das ist die Rotation (Pivoting) aus Abb. 3.34." },
      { nr: 3, ziel: "v-titel", anker: "links", versatz: [690, 22], regel: "SAY – Botschaft vermitteln", titel: "Aussage unter dem Titel",
        text: "Unter dem Titel steht in einem Satz, was die Kreuztabelle zeigt: größter Kunde und stärkstes Produkt mit ihrem Anteil – bei einer Auswahl die Werte der gewählten Zeile, Spalte oder Zelle." },
      { nr: 4, ziel: "v-tabelle", anker: "links", versatz: [132, 75], regel: "EXPRESS – Hervorheben statt Farbe", titel: "Fadenkreuz per Klick",
        text: "Ein Klick auf eine Zelle hebt ihre Zeile und Spalte hervor, die Zelle selbst wird fett; ein Klick auf eine Beschriftung oder Summe hebt nur die Zeile bzw. Spalte hervor. So bleibt die Tabelle ohne Farbflächen lesbar. Esc hebt auf." },
      { nr: 5, ziel: "kt-summe", versatz: [-62, 2], regel: "CHECK – Visuelle Integrität", titel: "Randsummen stimmen",
        text: "Zeilensummen (400, 450, 200, 550) und Spaltensummen (450, 550, 450, 150) ergeben beide 1.600 Stück; das Visual rechnet sie aus den Zellen. Der Tooltip zeigt zu jeder Zelle den Anteil an Zeile, Spalte und Gesamtabsatz." },
      { nr: 6, ziel: "filter", anker: "links", versatz: [520, 28], regel: "SIMPLIFY – Anteile statt Kopfrechnen", titel: "Werte anzeigen als",
        text: "Statt Anteile im Kopf zu rechnen, zeigt die Tabelle auf Wunsch Prozent der Zeile, der Spalte oder des Gesamtabsatzes – ohne Nachkommastellen, die Einheit steht im Titel. Im Original stand in der Eckzelle nur „Absatz“ ohne Einheit." },
      { nr: 7, ziel: "v-tabelle", anker: "links", versatz: [132, 147], regel: "UNIFY – Summen absetzen", titel: "Summen fett und abgesetzt",
        text: "Summenspalte und Summenzeile sind fett, die Summenzeile steht über einer Linie. Echte Nullen bleiben „0“ (Kunde 1 und 3 haben Produkt 4 nicht gekauft) – anders als die leere Zelle „–“ in der pivotierten flachen Tabelle, für die es gar keinen Datensatz gibt." },
    ],
    nachbauIntro: "Standard-Visuals von Power BI Desktop. Seitengröße benutzerdefiniert 727 × 310 px. Schrift Arial: Matrix 10,5 pt, Visualtitel 12 pt. Datenmodell: Tabelle Absatz (Kunde, Produkt, Absatz) in flacher Form wie in der CSV-Datei.",
    nachbau: [
      { id: "A", ziel: "v-tabelle", anker: "links", versatz: [132, 75], titel: "Kreuztabelle", visual: "Matrix",
        felder: "Zeilen: Kunde; Spalten: Produkt; Werte: Summe von Absatz",
        format: "Zeilen- und Spaltensummen an, Beschriftung „Summe“, fett; Spaltenkopf mit Unterstrich #3A3F44, Zeilenraster #EFEFEF; Anteile über „Wert anzeigen als“: Prozentsatz der Zeilensumme, der Spaltensumme oder des Gesamtergebnisses",
        hinweis: "Hervorheben per Klick und Kreuzfilterung gibt es in der Matrix nur zeilen- oder spaltenweise; das Fadenkreuz ist eine Vereinfachung des Visuals." },
      { id: "B", ziel: "filter", anker: "links", versatz: [78, 5], titel: "Zeilen und Spalten tauschen", visual: "Datenschnitt mit Feldparameter",
        felder: "Zwei Feldparameter (Zeilenfeld, Spaltenfeld) mit Kunde und Produkt; in der Matrix als Zeilen bzw. Spalten",
        format: "Kacheln, Einzelauswahl; ausgewählt #3A3F44 mit weißer Schrift",
        hinweis: "Einfacher: zwei Lesezeichen mit je einer Matrix (Kunden × Produkte, Produkte × Kunden) und Schaltflächen." },
      { id: "C", ziel: "filter", anker: "links", versatz: [520, 28], titel: "Werte anzeigen als", visual: "Datenschnitt mit Feldparameter",
        felder: "Feldparameter mit vier Measures: Absatz = SUM(Absatz[Absatz]); % Zeile, % Spalte, % Gesamt jeweils DIVIDE([Absatz]; CALCULATE([Absatz]; ALLSELECTED(…)))",
        format: "Prozent ohne Dezimalstellen" },
    ],
    theme: DK.thema(),
    csv: { name: "absatz_kunden_produkte_daten.csv", text: () => {
      const z = ["Kunde;Produkt;Absatz_Stueck"];
      K.forEach((k, i) => PR.forEach((p, j) => z.push(`${k};${p};${A[i][j]}`)));
      return z.join("\r\n"); } },
    tabellen: () => {
      const zeilen = zDim().liste.map((_, i) => i), spalten = sDim().liste.map((_, i) => i);
      return [{ titel: `Absatz nach ${zDim().mehrzahl} und ${sDim().mehrzahl} (${ANZEIGE[S.anzeige]})`,
        kopf: [zDim().name, ...spalten.map(c => sDim().liste[c]), "Summe"],
        zeilen: [...zeilen.map(r => [zDim().liste[r], ...[...spalten, null].map(c => anzeigen(...kp(r, c)))]),
                 ["Summe", ...[...spalten, null].map(c => anzeigen(...kp(null, c)))]] }];
    },
  });
  zeichnen();
})();
