/* Abb. 3.21 „ABC-Analyse (Beispiel MS Excel)“ (6. Auflage) – Einzelvisual 727 x 552 px = 110 x 83,6 mm.
   Die Rechentabelle der ABC-Analyse, wie sie in einer Tabellenkalkulation entsteht: Rang, Wert, Anteil, kumulierter
   Wert, kumulierter Anteil, Klasse – softwareneutral, ohne Tabellenblatt-Oberfläche.
   Daten: abc_rechnung.json (daten_abc_rechnung.py) = dieselben Produkte und Werte wie Abb. 3.22 „ABC-Analyse“
   (Jahr 2027, alle Kunden; Klassengrenzen A bis 80 %, B weitere 10 %, Regel wie dort). Schalter Absatz/Umsatz.
   Druckfassung: je Klasse die ersten Ränge und die Ränge an der Klassengrenze, die mittleren Ränge zusammengefasst;
   die interaktive Fassung zeigt alle 51 Produkte. */
(() => {
  "use strict";
  const { zahl, prozent, sv, el, tw, NBSP } = DK;
  const JAHR = DATA.jahr, GA = DATA.grenzen[0], GB = DATA.grenzen[1];
  const P = DATA.produkte.map((name, i) => ({ i, name, st: DATA.werte[i][0], u: DATA.werte[i][1] }));
  const KZ = {
    stueck: { name: "Absatz", spalte: "Stück", einheit: "Stück", gen: "des Absatzes", nk: 0, f: v => v, wert: p => p.st },
    umsatz: { name: "Umsatz", spalte: "Tsd. €", einheit: "Tsd. €", gen: "des Umsatzes", nk: 1, f: v => v / 1000, wert: p => p.u },
  };
  const KL = ["A", "B", "C"];
  const REGEL = [`kumuliert ≤ ${GA}${NBSP}%`, `${GA}${NBSP}% < kumuliert ≤ ${GA + GB}${NBSP}%`, `kumuliert > ${GA + GB}${NBSP}%`];
  // Druckfassung: je Klasse [erste Ränge, letzte Ränge]; dazwischen zusammengefasst, wenn mindestens 3 Ränge fehlen
  const KOMPAKT = [[5, 2], [4, 2], [2, 1]];

  /* ---------- Zustand ---------- */
  const S = { kz: "stueck", sort: null, auswahl: null };
  const K = () => KZ[S.kz];
  const fw = v => zahl(K().f(v), K().nk);
  const pz = v => zahl(v * 100, 1);
  addEventListener("keydown", e => { if (e.key === "Escape" && S.auswahl != null) { S.auswahl = null; zeichnen(); } });
  const waehlen = kl => { S.auswahl = S.auswahl === kl ? null : kl; zeichnen(); };

  /* ---------- Rechnung ---------- */
  function rechnen() {
    const liste = P.map(p => ({ ...p, wert: K().wert(p) })).sort((a, b) => b.wert - a.wert || a.i - b.i);
    const ges = liste.reduce((s, x) => s + x.wert, 0) || 1e-9;
    let kum = 0;
    liste.forEach((x, r) => {
      x.vorKum = kum; kum += x.wert;
      x.rang = r + 1; x.anteil = x.wert / ges; x.kumWert = kum; x.kum = kum / ges;
      x.kl = r === 0 || x.kum <= GA / 100 + 1e-9 ? 0 : x.kum <= (GA + GB) / 100 + 1e-9 ? 1 : 2;
    });
    const klassen = KL.map((label, k) => {
      const xs = liste.filter(x => x.kl === k), w = xs.reduce((s, x) => s + x.wert, 0);
      return { k, label, xs, n: xs.length, wert: w, anteil: w / ges, kumWert: xs.length ? xs[xs.length - 1].kumWert : null,
               kum: xs.length ? xs[xs.length - 1].kum : null, von: xs.length ? xs[0].rang : null, bis: xs.length ? xs[xs.length - 1].rang : null };
    });
    return { liste, klassen, ges, N: liste.length };
  }

  /* ---------- Layout ---------- */
  DK.init({ titel: "ABC-Analyse Rechentabelle", breite: 727, hoehe: 552 });
  const bTitel = DK.box("v-titel", 16, 8, 695, 46);
  const bTab = DK.box("v-tabelle", 16, 62, 695, 440);
  const bFuss = DK.box("fussnote", 16, 508, 695, 40);
  DK.el("style", {}, document.head, `
    table.abc-tab { table-layout: fixed; width: 695px; }
    .abc-tab th, .abc-tab td { padding: 0 6px; }
    .abc-tab th:first-child, .abc-tab td:first-child { padding-left: 0; }
    .abc-tab th { height: 24px; vertical-align: bottom; background: #FFFFFF; }
    .abc-tab td { height: 18px; }
    .abc-tab td.abc-kl { text-align: center; }
    .abc-tab th.abc-kl { text-align: center; }
    .abc-tab tr.abc-klasse td { background: var(--flaeche); font-weight: bold; border-bottom: 1px solid #FFFFFF; }
    .abc-tab tr.abc-rest td { color: var(--muted); }
    .abc-tab td.abc-db { padding: 0 2px 0 6px; }
    .abc-rollen { overflow-y: auto; }
    .abc-rollen thead th { position: sticky; top: 0; z-index: 1; }
    #fussnote { font-size: 14px; color: var(--muted); line-height: 1.35; white-space: nowrap; }
    .dk-panel dd { overflow-wrap: anywhere; }`);

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
  const tipProdukt = (x, d) => {
    const k = K();
    return [`${x.name} · Rang ${x.rang} · Klasse ${KL[x.kl]}`,
      `${k.name}: ${fw(x.wert)} ${k.einheit}`,
      `Anteil: ${fw(x.wert)} / ${fw(d.ges)} = ${prozent(x.anteil, 1)}`,
      `kumuliert: ${fw(x.vorKum)} + ${fw(x.wert)} = ${fw(x.kumWert)} ${k.einheit} = ${prozent(x.kum, 1)}`,
      x.rang === 1 ? "Klasse A: Rang 1 gehört immer zu A" : `Klasse ${KL[x.kl]}, da ${REGEL[x.kl]}`,
      "Klick hebt die Klasse hervor"];
  };
  const tipKlasse = (c, d) => [`Klasse ${c.label}: Rang ${c.von}–${c.bis}`,
    `${c.n} von ${d.N} Produkten (${prozent(c.n / d.N, 1)})`,
    `${K().name}: ${fw(c.wert)} ${K().einheit} = ${prozent(c.anteil, 1)}`, `Regel: ${REGEL[c.k]}`, "Klick hebt die Klasse hervor"];

  /* ---------- Spalten ---------- */
  const TXT = 50;                                           // Textbreite in der Spalte „kumuliert %“
  const SP = () => [
    { key: "rang", titel: "Rang", breite: 44, id: "sp-rang" },
    { key: "name", titel: "Produkt", breite: 178, id: "sp-produkt", text: true },
    { key: "wert", titel: K().spalte, breite: 72, id: "sp-wert" },
    { key: "anteil", titel: "Anteil %", breite: 70, id: "sp-anteil" },
    { key: "kumWert", titel: "kum. " + K().spalte, breite: 92, id: "sp-kumwert" },
    { key: "kum", titel: "kum. %", breite: 182, id: "sp-kum", balken: true },
    { key: "kl", titel: "Klasse", breite: 57, id: "sp-klasse" },
  ];

  /* ---------- Zeilen: Rangfolge mit Klassen-Zwischensummen (Druck: kompakt) oder sortierte Liste ---------- */
  function zeilen(d) {
    if (S.sort) {
      const k = S.sort.key, wert = x => (k === "name" ? x.name : k === "rang" ? -x.rang : x.wert);
      const l = d.liste.slice().sort((a, b) => {
        const c = k === "name" ? a.name.localeCompare(b.name, "de") : wert(a) - wert(b);
        return S.sort.ab ? -c : c;
      });
      return l.map(x => ({ typ: "p", x }));
    }
    const z = [];
    d.klassen.forEach((c, k) => {
      if (!c.n) return;
      const [vorn, hinten] = KOMPAKT[k];
      const kompakt = DK.PRINT && c.n - vorn - hinten >= 3;
      c.xs.forEach((x, i) => {
        if (!kompakt || i < vorn || i >= c.n - hinten) { z.push({ typ: "p", x }); return; }
        if (i === vorn) {
          const m = c.xs.slice(vorn, c.n - hinten), w = m.reduce((s, y) => s + y.wert, 0);
          z.push({ typ: "rest", kl: k, n: m.length, von: m[0].rang, bis: m[m.length - 1].rang, wert: w, anteil: w / d.ges,
                   kumWert: m[m.length - 1].kumWert, kum: m[m.length - 1].kum });
        }
      });
      z.push({ typ: "klasse", c });
    });
    return z;
  }

  /* ---------- Tabelle ---------- */
  function tabelle(ziel, d) {
    ziel.textContent = "";
    const t = el("table", { class: "dk-matrix abc-tab" }, ziel);
    const kopf = el("tr", {}, el("thead", {}, t));
    SP().forEach(s => {
      const th = el("th", { id: s.id, class: s.key === "kl" ? "abc-kl" : "",
                            style: `width:${s.breite}px;` + (s.text || s.balken ? "text-align:left;" : "") }, kopf,
                    s.balken ? undefined : s.titel);
      // Kopf der Balkenspalte rechtsbündig über den Zahlen, nicht über den Balken
      if (s.balken) el("span", { style: `display:inline-flex;justify-content:flex-end;width:${TXT - 6}px;white-space:nowrap` }, th, s.titel);
      if (!DK.PRINT) {
        th.classList.add("dk-sortierbar"); th.title = "Klick sortiert";
        th.addEventListener("click", () => sortieren(s.key));
        if (S.sort && S.sort.key === s.key) th.appendChild(document.createTextNode(S.sort.ab ? " ▾" : " ▴"));
      }
    });
    const tb = el("tbody", {}, t);
    const W = SP()[5].breite - 8, H = 17, bx = TXT + 2, bw = W - bx - 2;
    const balken = (td, v, mitBalken, fett) => {
      const svg = sv("svg", { width: W, height: H, style: "display:block" }, td);
      sv("text", { x: TXT - 6, y: H / 2, dy: "0.35em", "text-anchor": "end", style: `font-size:14px;fill:${fett ? "var(--text)" : "currentColor"}` }, svg,
         v == null ? "–" : pz(v));
      if (mitBalken && v != null) sv("rect", { x: bx, y: (H - 9) / 2, width: Math.max(1, v * bw), height: 9, fill: "var(--ac)" }, svg);
      sv("line", { x1: bx, x2: bx, y1: 0, y2: H, stroke: "#8C8C8C", "stroke-width": 1 }, svg);
      [GA, GA + GB].forEach(g => sv("line", { x1: bx + g / 100 * bw, x2: bx + g / 100 * bw, y1: 0, y2: H + 2,
        stroke: "#6E747A", "stroke-width": 1, "stroke-dasharray": "2 2" }, svg));
    };
    zeilen(d).forEach(z => {
      const kl = z.typ === "p" ? z.x.kl : z.typ === "rest" ? z.kl : z.c.k;
      const blass = S.auswahl != null && S.auswahl !== kl;
      const cls = z.typ === "klasse" ? "dk-zeile abc-klasse" : z.typ === "rest" ? "dk-zeile abc-rest" : "dk-zeile";
      const tr = el("tr", { class: cls + (blass ? " dk-blass" : "") }, tb);
      if (z.typ === "p") {
        const x = z.x;
        [String(x.rang)].forEach(v => el("td", {}, tr, v));
        el("td", { style: "text-align:left" }, tr, x.name);
        el("td", {}, tr, fw(x.wert));
        el("td", {}, tr, pz(x.anteil));
        el("td", {}, tr, fw(x.kumWert));
        balken(el("td", { class: "abc-db" }, tr), x.kum, true);
        el("td", { class: "abc-kl" }, tr, KL[x.kl]);
        tooltip(tr, () => tipProdukt(x, d));
      } else if (z.typ === "rest") {
        el("td", {}, tr, `${z.von}–${z.bis}`);
        el("td", { style: "text-align:left" }, tr, `${z.n} weitere Produkte`);
        el("td", {}, tr, fw(z.wert));
        el("td", {}, tr, pz(z.anteil));
        el("td", {}, tr, fw(z.kumWert));
        balken(el("td", { class: "abc-db" }, tr), z.kum, true);
        el("td", { class: "abc-kl" }, tr, KL[z.kl]);
        tooltip(tr, () => [`Rang ${z.von}–${z.bis}: ${z.n} Produkte der Klasse ${KL[z.kl]}`,
          `${K().name} zusammen: ${fw(z.wert)} ${K().einheit} = ${prozent(z.anteil, 1)}`,
          `kumuliert bis Rang ${z.bis}: ${prozent(z.kum, 1)}`, "Klick hebt die Klasse hervor"]);
      } else {
        const c = z.c;
        el("td", {}, tr, "");
        el("td", { style: "text-align:left" }, tr, `Klasse ${c.label}: ${c.n} ${c.n === 1 ? "Produkt" : "Produkte"}`);
        el("td", {}, tr, fw(c.wert));
        el("td", {}, tr, pz(c.anteil));
        el("td", {}, tr, "");
        balken(el("td", { class: "abc-db" }, tr), null, false, true);
        tr.lastChild.querySelector("text").textContent = "";
        el("td", { class: "abc-kl" }, tr, c.label);
        tooltip(tr, () => tipKlasse(c, d));
      }
      tr.addEventListener("click", () => waehlen(kl));
    });
    const tr = el("tr", { class: "dk-summe" }, tb);
    el("td", {}, tr, "");
    el("td", { style: "text-align:left" }, tr, `Summe: ${d.N} Produkte`);
    el("td", {}, tr, fw(d.ges));
    el("td", {}, tr, pz(1));
    el("td", {}, tr, "");
    el("td", {}, tr, "");
    el("td", {}, tr, "");
  }
  function sortieren(key) {
    if (key === "rang" && !S.sort) S.sort = { key, ab: true };                  // Rang absteigend
    else if (S.sort && S.sort.key === key) S.sort = key === "rang" && S.sort.ab ? null : { key, ab: !S.sort.ab };
    else S.sort = key === "rang" ? null : { key, ab: key !== "name" };
    zeichnen();
  }

  /* ---------- Zeichnen ---------- */
  function zeichnen() {
    const d = rechnen(), k = K(), A = d.klassen[0];
    DK.visual(bTitel, { titel: `ABC-Analyse der Produkte nach ${k.name} ${JAHR}`, einheit: k.einheit,
      botschaft: `${A.n} von ${d.N} Produkten (${prozent(A.n / d.N, 0)}) bringen ${prozent(A.anteil, 0)} ${k.gen} – Klasse A`,
      schalter: { optionen: [["stueck", "Absatz"], ["umsatz", "Umsatz"]], wert: S.kz, onChange: w => { S.kz = w; zeichnen(); } } });
    bTitel.querySelector(".dk-knoepfe").id = "schalter";
    tabelle(bTab, d);
    bTab.classList.toggle("abc-rollen", !DK.PRINT);
    bFuss.textContent = "";
    el("div", {}, bFuss, `Rechenweg: nach ${k.name} absteigend sortieren · Anteil = Wert / Summe · kumuliert = Summe bis zum Rang`);
    el("div", {}, bFuss, `Klasse A bis ${GA}${NBSP}% kumuliert, B bis ${GA + GB}${NBSP}%, C Rest (gestrichelt)` +
      (DK.PRINT ? " · mittlere Ränge zusammengefasst" : ""));
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  /* ---------- Lernplattform: Designregeln, Nachbau, Tabellen, CSV ---------- */
  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "v-titel", anker: "links", versatz: [482, 26], regel: "SAY – Botschaft vermitteln", titel: "Ergebnis als Satz",
        text: "Titel mit Kennzahl, Jahr und Einheit, darunter das Ergebnis der Rechnung: 5 von 51 Produkten (10 %) bringen 80 % des Absatzes. Das Original zeigte Tabelle und Diagramm ohne Titel und ohne Aussage." },
      { nr: 2, ziel: "sp-klasse", anker: "links", versatz: [64, 26], regel: "UNIFY – Semantische Notation", titel: "Klasse als Buchstabe, nicht als Ampel",
        text: "Das Original färbte die Klassen grün, gelb und rot. Das liest sich als gut, mittel, schlecht – C-Produkte sind aber nicht schlecht, nur weniger bedeutend – und ist bei Rot-Grün-Sehschwäche kaum unterscheidbar. Jetzt stehen Buchstabe und Zwischensumme je Klasse; Farbe bleibt Abweichungen vorbehalten." },
      { nr: 3, ziel: "sp-kum", anker: "links", versatz: [150, 0], regel: "EXPRESS – Passende Darstellung", titel: "Kumulierter Anteil als Balken",
        text: "Die Balken des kumulierten Anteils zeichnen die Konzentrationskurve in die Tabelle: steil bei den ersten Rängen, flach bei C. Die gestrichelten Linien markieren die Klassengrenzen 80 % und 90 %. Das separate Diagramm des Originals entfällt; die Kurve selbst zeigt das Dashboard ABC-Analyse (Abb. 3.22)." },
      { nr: 4, ziel: "sp-produkt", anker: "links", versatz: [132, 0], regel: "CONDENSE – Informationsdichte", titel: "Klassengrenzen statt aller Zeilen",
        text: "Die Druckfassung zeigt je Klasse die ersten Ränge und die Ränge an der Klassengrenze, die mittleren Ränge stehen in einer Zeile „… weitere Produkte“. Die interaktive Fassung zeigt alle 51 Produkte mit Bildlauf." },
      { nr: 5, ziel: "sp-wert", anker: "links", versatz: [28, 0], regel: "UNIFY – Einheitliche Zahlen", titel: "Einheit im Kopf, ein Format je Spalte",
        text: "Die Einheit steht im Titel und im Spaltenkopf, Anteile mit einer Nachkommastelle, Tausenderpunkt, ohne Prozentzeichen an jeder Zahl. Das Original wiederholte „%“ in jeder Zelle." },
      { nr: 6, ziel: "fussnote", anker: "links", versatz: [432, 23], regel: "CHECK – Visuelle Integrität", titel: "Rechenweg offenlegen",
        text: "Fußzeile und Tooltip zeigen die Rechnung: Anteil = Wert / Summe, kumuliert = Vorwert + Wert, und die Regel, nach der eine Zeile ihre Klasse erhält. Die Daten sind dieselben wie im Dashboard ABC-Analyse (Abb. 3.22), die Klassen stimmen überein." },
      { nr: 7, ziel: "schalter", anker: "links", versatz: [-2, 0], regel: "SIMPLIFY – Überflüssiges weglassen", titel: "Ohne Tabellenblatt und Firmennamen",
        text: "Gitternetz, farbige Zellen, Rahmen und das gerahmte Diagramm der Tabellenkalkulation entfallen. Die realen Versicherungsnamen des Originals sind durch die erfundenen Produkte des Dashboards ersetzt. Der Schalter wechselt zwischen Absatz und Umsatz." },
      { nr: 8, ziel: "sp-produkt", anker: "links", versatz: [92, 0], regel: "STRUCTURE – Inhalte ordnen", titel: "Rangfolge, Klassen als Gruppen",
        text: "Die Zeilen folgen dem Rang – so verlangt es die Rechnung. Jede Klasse schließt mit einer Zwischensumme, die Summe steht am Ende. Ein Klick auf einen Spaltenkopf sortiert (etwa nach Produkt), ein Klick auf „Rang“ stellt die Rechenfolge wieder her." },
    ],
    nachbauIntro: "Standard-Visuals von Power BI Desktop. Seitengröße benutzerdefiniert 727 × 552 px. Schrift Arial: Tabelle 10,5 pt, Visualtitel 12 pt. Das Berichtsdesign (JSON) setzt Farben und Schriften. Datenmodell: Faktentabelle Absatz (Jahr, Produkt, Kundengruppe, Stück, Umsatz) wie im Dashboard ABC-Analyse; die Klasse ist ein Measure, weil sie von Kennzahl und Filter abhängt.",
    nachbau: [
      { id: "A", ziel: "v-tabelle", anker: "links", versatz: [142, 0], titel: "Rechentabelle", visual: "Matrix",
        felder: "Zeilen: Klasse (getrennte Tabelle A, B, C) > Produkt; Werte: Rang = RANKX(ALLSELECTED(Produkt[Name]); [Wert]), Wert, Anteil = DIVIDE([Wert]; CALCULATE([Wert]; ALLSELECTED(Produkt))), kum. Wert = SUMX(FILTER(ALLSELECTED(Produkt[Name]); [Wert] >= aktueller Wert); [Wert]), kum. % = DIVIDE([kum. Wert]; Gesamt), Klasse = SWITCH(TRUE(); [Rang] = 1 || [kum. %] <= 0,8; \"A\"; [kum. %] <= 0,9; \"B\"; \"C\")",
        format: "Zwischensummen je Klasse an, Zeilenkopf fett mit Füllung #F6F6F6; Gesamtsumme oben mit Linie #3A3F44; Sortierung nach Wert absteigend; Datenbalken für kum. % mit Min 0 und Max 1, Farbe #3A3F44",
        hinweis: "Gestrichelte Klassengrenzen gibt es bei Datenbalken nicht – in Power BI ersatzweise in der Fußzeile nennen. Die Zuordnung der Produkte zu den Klassenzeilen verlangt ein Filter-Measure (Klasse des Produkts = gewählte Klasse)." },
      { id: "B", ziel: "schalter", anker: "links", versatz: [-2, 0], titel: "Schalter Absatz/Umsatz", visual: "Feldparameter mit Datenschnitt (Kacheln)",
        felder: "Feldparameter aus den Measures Absatz (Stück) und Umsatz (Tsd. €); [Wert] verweist auf den gewählten Parameter",
        format: "Ausgewählt #3A3F44 mit weißer Schrift, sonst weiß mit Rahmen #9A9A9A" },
      { id: "C", ziel: "v-titel", anker: "links", versatz: [482, 26], titel: "Titel und Kernaussage", visual: "Textfeld mit dynamischem Wert",
        felder: "Text-Measure aus Anzahl und Anteil der A-Produkte", format: "Titel 12 pt fett, Aussage 10,5 pt #4D4D4D" },
      { id: "D", ziel: "fussnote", anker: "links", versatz: [432, 23], titel: "Fußzeile", visual: "Textfeld", felder: "Rechenweg und Klassengrenzen",
        format: "10,5 pt #4D4D4D" },
    ],
    theme: DK.thema(),
    csv: { name: "abc_rechnung_produkte_2027.csv", text: () =>
      ["Produkt;Jahr;Absatz_Stueck;Umsatz_EUR", ...P.map(p => [p.name, JAHR, p.st, p.u].join(";"))].join("\r\n") },
    tabellen: () => {
      const d = rechnen(), k = K();
      return [
        { titel: `ABC-Klassen nach ${k.name} ${JAHR} (${k.einheit}, %)`, kopf: ["Klasse", "Ränge", "Produkte", k.spalte, "Anteil %"],
          zeilen: d.klassen.map(c => [c.label, c.n ? `${c.von}–${c.bis}` : "–", String(c.n), fw(c.wert), pz(c.anteil)])
            .concat([["Summe", "", String(d.N), fw(d.ges), "100,0"]]) },
        { titel: `Rechentabelle (${k.einheit}, %)`, kopf: ["Rang", "Produkt", k.spalte, "Anteil %", "kum. " + k.spalte, "kum. %", "Klasse"],
          zeilen: d.liste.map(x => [String(x.rang), x.name, fw(x.wert), pz(x.anteil), fw(x.kumWert), pz(x.kum), KL[x.kl]]) },
      ];
    },
  });
  zeichnen();
})();
