/* Einzelvisual „Kennzahlenzuordnung zu Berichtszeilen“ (Abb. 5.24) – Revision 16.11.2026: Bild wie Abb. 5.25 statt
   LaTeX-Tabelle. Seite 727 x 480 px = 110 x 72,6 mm.
   Daten: kennzahlenzuordnung.json (daten_kennzahlenzuordnung.py) – vier Zeilen des Kennzahlenmodells mit den Werten
   aus Abb. 5.23/5.25 (Jahre 2027/2028) und drei Berichtszeilen. Schalter „Rabatte“: ohne Differenzierung drei
   Kennzahlen (Bruttoumsatz, Rabatte, Skonti), mit Differenzierung fünf (Rabatte aufgeteilt 60 : 30 : 10 in Kunden-,
   Aktions- und Sonderrabatte). Oben die Faktentabelle mit einer Spalte je Kennzahl und Summenzeile, darunter die
   Zuordnung: je Berichtszeile steht unter jeder zugeordneten Kennzahl ihr Betrag, rechts die Summe = Betrag der
   Berichtszeile. Die Kennzahlspalten beider Tabellen stehen genau untereinander.
   Klick auf eine Zeile der Faktentabelle rechnet nur diese Zeile; Klick auf eine Berichtszeile hebt sie hervor und
   rechnet sie in der Aussage vor. Esc hebt auf. Druckfassung: mit Rabattdifferenzierung. */
(() => {
  "use strict";
  const { zahl, el, tw } = DK;
  const B = 695, H = 480;
  const PN = new Map(DATA.produkte), KN = new Map(DATA.kunden);
  const Z = DATA.zeilen.map(([p, k, t, w], i) => ({ i, p, k, t, w }));
  const eur = v => zahl(v);
  const passt = (k, breite = B - 12) => k.find(t => tw(t) <= breite) || k[k.length - 1];
  const und = l => (l.length < 2 ? l.join("") : l.slice(0, -1).join(", ") + " und " + l[l.length - 1]);
  const DIMB = [["p", "Produkt", 56], ["k", "Kunde", 54], ["t", "Zeit", 44]];
  const DIMBREITE = DIMB.reduce((s, d) => s + d[2], 0), BETRAG = 70;

  /* ---------- Zustand ---------- */
  const S = { rabatte: "differenziert", auswahl: null };
  const V = () => DATA.varianten[S.rabatte];
  const KZ = () => V().kennzahlen;
  const ZU = () => new Map(V().zuordnung);
  const gleich = (a, b) => a && b && a.typ === b.typ && a.i === b.i && a.b === b.b;
  const waehlen = a => { S.auswahl = gleich(S.auswahl, a) ? null : a; zeichnen(); };
  addEventListener("keydown", e => { if (e.key === "Escape" && S.auswahl) { S.auswahl = null; zeichnen(); } });
  const gefiltert = () => (S.auswahl && S.auswahl.typ === "zeile" ? Z.filter(z => z.i === S.auswahl.i) : Z);
  const summe = (zz, kz) => zz.reduce((s, z) => s + z.w[kz], 0);
  const zeileText = z => `${z.p} ${PN.get(z.p)} · ${z.k} ${KN.get(z.k)} · ${z.t}`;
  /* Spaltenbreiten der Kennzahlen: aus dem längsten Text, Rest gleichmäßig verteilt */
  function breiten() {
    const kz = KZ(), roh = kz.map(k => Math.ceil(tw(k)) + 14);
    const rest = B - DIMBREITE - BETRAG - roh.reduce((s, w) => s + w, 0);
    return roh.map(w => w + Math.floor(Math.max(0, rest) / kz.length));
  }

  /* ---------- Layout ---------- */
  DK.init({ titel: DATA.titel, breite: 727, hoehe: H });
  const bTitel = DK.box("v-titel", 16, 8, B, 46);
  const bFilter = DK.box("filter", 16, 60, B, 50, "dk-filter");
  DK.haarlinie(116);
  const bFakten = DK.box("z-fakten", 16, 126, B, 162);
  DK.haarlinie(296);
  const bZuord = DK.box("z-zuordnung", 16, 306, B, 124);
  const bLegende = DK.box("legende", 16, 436, B, 40);
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
    .kt tr.summe td { font-weight: bold; border-top: 1px solid var(--ac); border-bottom: none; }
    .kt .fett { font-weight: bold; }
    .kt .grp { border-left: 1px solid #D9D9D9; }
    #legende { color: var(--muted); line-height: 20px; }`);

  /* ---------- Tooltip ---------- */
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

  /* ---------- Tabelle: o.spalten [{titel, breite, re, schl, id}], o.gruppe [[titel, span, re, schl]],
     o.zeilen [{zellen: [text | {text, cls}], blass, cls, klick, tip}] ---------- */
  function tabelle(ziel, o) {
    const t = el("table", { class: "kt", id: o.id || "" }, ziel);
    const cg = el("colgroup", {}, t);
    o.spalten.forEach(s => el("col", { style: `width:${s.breite}px` }, cg));
    t.style.width = o.spalten.reduce((a, s) => a + s.breite, 0) + "px";
    const th = el("thead", {}, t);
    if (o.gruppe) {
      const r = el("tr", {}, th);
      o.gruppe.forEach(([titel, span, re, schl]) => el("th", { colspan: span, class: re ? "re" : "" }, r).appendChild(
        schl ? el("span", { class: "schl" }, null, titel) : document.createTextNode(titel)));
    }
    const kr = el("tr", {}, th);
    o.spalten.forEach(s => {
      const c = el("th", { class: s.re ? "re" : "", ...(s.id ? { id: s.id } : {}) }, kr);
      if (s.schl) el("span", { class: "schl" }, c, s.titel); else c.appendChild(document.createTextNode(s.titel));
    });
    const tb = el("tbody", {}, t);
    o.zeilen.forEach(z => {
      const tr = el("tr", { class: (z.summe ? "summe" : "dk-zeile") + (z.blass ? " dk-blass" : "") + (z.cls ? " " + z.cls : "") }, tb);
      z.zellen.forEach((c, j) => {
        const x = typeof c === "object" && c !== null ? c : { text: c };
        el("td", { class: (o.spalten[j].re ? "re " : "") + (x.cls || ""), ...(x.id ? { id: x.id } : {}) }, tr, x.text);
      });
      if (z.klick) tr.addEventListener("click", z.klick);
      if (z.tip) tooltip(tr, z.tip);
    });
    return t;
  }

  /* ---------- Bausteine ---------- */
  function faktentabelle() {
    bFakten.textContent = "";
    el("div", { class: "zl" }, bFakten, "Faktentabelle im Kennzahlenmodell");
    const kz = KZ(), w = breiten(), a = S.auswahl;
    tabelle(bFakten, {
      id: "t-fakten",
      gruppe: [["Dim.-ID", 3, false, true], ["Kennzahl", kz.length, true]],
      spalten: [...DIMB.map(([key, titel, breite]) => ({ titel, breite })),
                ...kz.map((k, j) => ({ titel: k, breite: w[j], re: true, id: j === 1 ? "sp-rabatt" : undefined }))],
      zeilen: [...Z.map(z => ({
        zellen: [String(z.p), String(z.k), String(z.t), ...kz.map(k => eur(z.w[k]))],
        blass: a && a.typ === "zeile" && a.i !== z.i,
        klick: () => waehlen({ typ: "zeile", i: z.i }),
        tip: () => [`Zeile ${z.i + 1} von ${Z.length}`, zeileText(z), ...kz.map(k => `${k}: ${eur(z.w[k])} €`),
          S.rabatte === "differenziert" ? `zusammen Rabatte ${eur(z.w.Rabatte)} €` : null,
          "Klick rechnet die Berichtszeilen nur für diese Zeile, Esc hebt auf"].filter(Boolean),
      })), { summe: true, zellen: [{ text: a && a.typ === "zeile" ? "Summe (ohne Auswahl)" : "Summe" }, "", "", ...kz.map(k => eur(summe(Z, k)))] }],
    });
  }

  function zuordnung() {
    bZuord.textContent = "";
    const ff = gefiltert(), kz = KZ(), w = breiten(), zu = ZU(), a = S.auswahl;
    el("div", { class: "zl" }, bZuord, a && a.typ === "zeile"
      ? `Zuordnung zu Berichtszeilen – nur Zeile ${a.i + 1} (${zeileText(Z[a.i])})` : "Zuordnung zu Berichtszeilen");
    tabelle(bZuord, {
      id: "t-zuordnung",
      gruppe: [["", 1], ["zugeordnete Kennzahlen", kz.length, true], ["", 1]],
      spalten: [{ titel: "Berichtszeile", breite: DIMBREITE, id: "sp-berichtszeile" },
                ...kz.map((k, j) => ({ titel: k, breite: w[j], re: true })), { titel: "Betrag", breite: BETRAG, re: true, id: "sp-betrag" }],
      zeilen: [...zu.keys()].map((b, n) => {
        const l = zu.get(b), v = l.reduce((s, k) => s + summe(ff, k), 0);
        return {
          zellen: [{ text: b, cls: "fett", id: n === 1 ? "m-netto" : undefined },
                   ...kz.map(k => (l.includes(k) ? eur(summe(ff, k)) : "")), { text: eur(v), cls: "fett" }],
          blass: a && a.typ === "bz" && a.b !== b,
          klick: () => waehlen({ typ: "bz", b }),
          tip: () => [b, `${anzK(l.length)}: ${l.join(" + ")}`,
            `${l.map(k => `${eur(summe(ff, k))} €`).join(" + ").replace(/\+ −/g, "− ")} = ${eur(v)} €`,
            "Klick hebt die Berichtszeile hervor und rechnet sie vor, Esc hebt auf"],
        };
      }),
    });
  }
  const anzK = n => `${n} ${n === 1 ? "Kennzahl" : "Kennzahlen"}`;

  function botschaft() {
    const zu = ZU(), ff = gefiltert(), a = S.auswahl, kz = KZ();
    const rechnung = b => {
      const l = zu.get(b), v = l.reduce((s, k) => s + summe(ff, k), 0);
      return { l, v, text: l.map(k => `${eur(summe(ff, k))}`).join(" + ").replace(/\+ −/g, "− ") + ` = ${eur(v)} €` };
    };
    if (a && a.typ === "bz") {
      const r = rechnung(a.b);
      return passt([`${a.b} = ${r.l.join(" + ")}: ${r.text}`, `${a.b}: ${anzK(r.l.length)}, ${r.text}`]);
    }
    if (a && a.typ === "zeile") {
      const z = Z[a.i], r = rechnung("NettoNetto-Umsatz");
      return passt([`Zeile ${a.i + 1} (${zeileText(z)}): NettoNetto-Umsatz ${r.text}`, `Zeile ${a.i + 1}: NettoNetto-Umsatz ${eur(r.v)} €`]);
    }
    const n = zu.get("Nettoumsatz"), v = rechnung("Nettoumsatz").v;
    if (S.rabatte === "differenziert") {
      const ra = n.filter(k => k !== "Bruttoumsatz");
      return passt([`Nettoumsatz summiert ${anzK(n.length)}: Bruttoumsatz und ${ra.length} Rabattarten ergeben ${eur(v)} €`,
        `Nettoumsatz = Summe aus ${anzK(n.length)}, ${eur(v)} €`]);
    }
    return passt([`${anzK(kz.length)}, ${zu.size} Berichtszeilen: Nettoumsatz = ${n.join(" + ")}, ${eur(v)} €`,
      `Nettoumsatz = ${n.join(" + ")}, ${eur(v)} €`]);
  }

  function legende() {
    bLegende.textContent = "";
    const z1 = el("div", {}, bLegende);
    el("span", { style: "text-decoration:underline;text-underline-offset:2px;color:var(--text)" }, z1, "unterstrichen");
    z1.appendChild(document.createTextNode(": Schlüssel   ·   Betrag unter einer Kennzahl: der Berichtszeile zugeordnet"));
    el("div", {}, bLegende, "Betrag der Berichtszeile = Summe der zugeordneten Kennzahlen · Rabatte und Skonti als negative Werte");
  }

  /* ---------- Zeichnen ---------- */
  const schalter = DK.schnitt(bFilter, "Rabatte", "knoepfe", {
    optionen: [["gesamt", "ohne Differenzierung"], ["differenziert", "mit Differenzierung"]],
    wert: S.rabatte,
    onChange: v => { if (v === S.rabatte) return; S.rabatte = v; if (S.auswahl && S.auswahl.typ !== "zeile") S.auswahl = null; zeichnen(); } });
  schalter.id = "schalter-rabatte";
  function zeichnen() {
    DK.visual(bTitel, { titel: "Kennzahlenzuordnung zu Berichtszeilen", einheit: "Betrag in €", botschaft: botschaft() });
    faktentabelle();
    zuordnung();
    legende();
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  /* ---------- Lernplattform ---------- */
  DK.ebenen({
    get regeln() {
      return [
        { nr: 1, ziel: "v-titel", versatz: [0, 0], regel: "SAY – Botschaft vermitteln", titel: "Aussage zur Zuordnung",
          text: "Unter dem Titel steht, was die Zuordnung leistet: Mit Rabattdifferenzierung summiert die Berichtszeile Nettoumsatz vier Kennzahlen – Bruttoumsatz und drei Rabattarten – und ergibt wie ohne Differenzierung 3.790 €. Die Aussage wird aus den Daten berechnet; das Original war eine reine Texttabelle ohne Werte." },
        { nr: 2, ziel: "schalter-rabatte", versatz: [28, 0], regel: "STRUCTURE – Varianten vergleichen", titel: "Ohne und mit Rabattdifferenzierung",
          text: "Der Schalter wechselt zwischen drei Kennzahlen (Bruttoumsatz, Rabatte, Skonti) und fünf Kennzahlen (Rabatte aufgeteilt in Kunden-, Aktions- und Sonderrabatte, 60 : 30 : 10). Die drei Berichtszeilen bleiben gleich, nur ihre Zuordnung ändert sich. Das Original zeigte die beiden Varianten als zwei Tabellen untereinander. Die Druckfassung zeigt die Variante mit Differenzierung." },
        { nr: 3, ziel: "sp-rabatt", versatz: [0, -22], regel: "EXPRESS – Struktur zeigen", titel: "Spalten untereinander",
          text: "Jede Kennzahl hat in der Faktentabelle und in der Zuordnung dieselbe Spalte. Ein Betrag unter einer Kennzahl heißt: Sie gehört zur Berichtszeile; leere Zellen gehören nicht dazu. So ist die Zuordnung ohne Pfeile oder Pluszeichen ablesbar." },
        { nr: 4, ziel: "z-fakten", versatz: [0, 0], regel: "UNIFY – Semantische Notation", titel: "Wie Abb. 5.23 und 5.25",
          text: "Schlüssel unterstrichen, Rollenzeile Dim.-ID und Kennzahl, Summenzeile fett mit Linie – wie im Kennzahlenmodell (Abb. 5.23). Werte, Produkte, Kunden und Jahre stammen aus demselben Datensatz wie Abb. 5.23 und die Serie Kontenmodell (Abb. 5.25–5.27); die Rabattaufteilung ist dieselbe wie dort." },
        { nr: 5, ziel: "sp-betrag", versatz: [0, -22], regel: "CHECK – Visuelle Integrität", titel: "Nachrechenbar",
          text: "Der Betrag einer Berichtszeile ist die Summe der Beträge links daneben, und jeder dieser Beträge steht als Summe direkt darüber in der Faktentabelle: 4.000 − 126 − 63 − 21 = 3.790 € Nettoumsatz, dazu −76 € Skonti = 3.714 € NettoNetto-Umsatz." },
        { nr: 6, ziel: "legende", versatz: [0, 6], regel: "SIMPLIFY – Einheitliche Zahlen", titel: "Zahlenformat, kein Gitter",
          text: "Beträge mit Tausenderpunkt und echtem Minus rechtsbündig, die Einheit einmal im Titel; Haarlinien statt Gitternetz. Die drei Umsatzstufen stehen fett wie im Original." },
        { nr: 7, ziel: "z-zuordnung", versatz: [-30, 0], regel: "CONDENSE – Details im Tooltip", titel: "Rechnung per Klick",
          text: "Der Tooltip einer Berichtszeile nennt die zugeordneten Kennzahlen und rechnet sie vor. Ein Klick auf eine Zeile der Faktentabelle rechnet alle Berichtszeilen nur für diese Zeile – etwa für Produkt 3312 Ring im Jahr 2027." },
      ];
    },
    nachbauIntro: "Standard-Visuals von Power BI Desktop. Seitengröße benutzerdefiniert 727 × 480 px. Schrift Arial: Tabellen 10,5 pt, Visualtitel 12 pt. Datenmodell: Faktentabelle Kennzahlen im Langformat (Variante, Produkt, Kunde, Jahr, Kennzahl, Betrag – wie in der CSV-Datei), Brückentabelle Zuordnung (Berichtszeile, Kennzahl) mit m:n-Beziehung über die Kennzahl.",
    nachbau: [
      { id: "A", ziel: "z-fakten", versatz: [0, 0], titel: "Faktentabelle im Kennzahlenmodell", visual: "Matrix",
        felder: "Zeilen: Kennzahlen[Produkt], Kennzahlen[Kunde], Kennzahlen[Jahr] (tabellarisches Layout); Spalten: Kennzahlen[Kennzahl] nach Sortierspalte; Werte: Measure Betrag = SUM(Kennzahlen[Betrag])",
        format: "Gesamtsumme der Zeilen an (fett, Linie oben); Zwischensummen aus; Kopf mit Unterstrich #3A3F44; Format #.##0 mit Minuszeichen" },
      { id: "B", ziel: "z-zuordnung", versatz: [0, 0], titel: "Zuordnung zu Berichtszeilen", visual: "Matrix",
        felder: "Zeilen: Zuordnung[Berichtszeile] nach Sortierspalte; Spalten: Kennzahlen[Kennzahl]; Werte: Measure Betrag über die Brückentabelle (Kreuzfilter in beide Richtungen zwischen Zuordnung und Kennzahl)",
        format: "Gesamtsumme der Spalten an und als „Betrag“ beschriftet, fett; Spaltenbreiten wie in A, damit die Kennzahlen untereinander stehen",
        hinweis: "Nicht zugeordnete Kombinationen bleiben leer, weil die Brückentabelle sie herausfiltert – genau das Bild der Zuordnung." },
      { id: "C", ziel: "schalter-rabatte", versatz: [28, 0], titel: "Rabatte", visual: "Datenschnitt (Kacheln)",
        felder: "Kennzahlen[Variante Rabatte]: ohne / mit Differenzierung, einfache Auswahl",
        format: "ausgewählt #3A3F44 mit weißer Schrift, sonst weiß mit Rahmen #9A9A9A" },
      { id: "D", ziel: "v-titel", versatz: [0, 0], titel: "Aussage", visual: "Textfeld mit dynamischem Wert",
        felder: "Text-Measure, z. B. \"Nettoumsatz summiert \" & CALCULATE(DISTINCTCOUNT(Zuordnung[Kennzahl]); Zuordnung[Berichtszeile] = \"Nettoumsatz\") & \" Kennzahlen\"",
        format: "10,5 pt, #4D4D4D" },
    ],
    theme: DK.thema(),
    csv: { name: "kennzahlenzuordnung_daten.csv", text: () => DATA.csv },
    tabellen: () => {
      const kz = KZ(), ff = gefiltert(), zu = ZU();
      return [
        { titel: `Faktentabelle (Betrag in €, Rabatte ${S.rabatte === "gesamt" ? "ohne" : "mit"} Differenzierung)`,
          kopf: ["Produkt", "Kunde", "Zeit", ...kz], zeilen: Z.map(z => [String(z.p), String(z.k), String(z.t), ...kz.map(k => eur(z.w[k]))]) },
        { titel: "Zuordnung zu Berichtszeilen (Betrag in €)", kopf: ["Berichtszeile", "zugeordnete Kennzahlen", "Betrag"],
          zeilen: [...zu.entries()].map(([b, l]) => [b, l.join(" + "), eur(l.reduce((s, k) => s + summe(ff, k), 0))]) },
      ];
    },
  });
  zeichnen();
})();
