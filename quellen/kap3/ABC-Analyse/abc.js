/* Abb. 3.22 „ABC-Analyse Produkte“ (6. Auflage) – Neuaufbau des Cubeware-Beispiels der 5. Auflage.
   Inhalt wie im Original: Kennzahlwahl, Jahr, Kunden, Klassengrenzen; ABC-Klassen, Produktrangliste, Konzentrationskurve.
   Daten: daten_abc.py (Absatz 2027 über alle Kunden = Werte des Originals). Alle Werte werden hier aus den Einzelsätzen berechnet. */
(() => {
  "use strict";
  const { zahl, prozent, sv, tw, NBSP } = DK;
  const PROD = DATA.produkte, KUNDEN = DATA.kunden, JAHRE = DATA.jahre;
  const R = DATA.zeilen.map(z => ({ j: 2000 + z[0], p: z[1], k: z[2], st: z[3], u: z[4], we: z[5] }));
  const KZ = {
    stueck: { name: "Absatz", spalte: "Stück", einheit: "Stück", gen: "des Absatzes", nk: 0, f: v => v },
    umsatz: { name: "Umsatz", spalte: "Umsatz", einheit: "Tsd. €", gen: "des Umsatzes", nk: 1, f: v => v / 1000 },
    we: { name: "Wareneinsatz", spalte: "Wareneinsatz", einheit: "Tsd. €", gen: "des Wareneinsatzes", nk: 1, f: v => v / 1000 },
    db: { name: "Deckungsbeitrag", spalte: "DB", einheit: "Tsd. €", gen: "des Deckungsbeitrags", nk: 1, f: v => v / 1000 },
  };
  const KL = ["A", "B", "C"];
  const pz = v => zahl(v * 100, 1);                       // Anteil ohne Prozentzeichen (Einheit im Spaltenkopf)

  /* ---------- Zustand ---------- */
  const S = { kz: "stueck", jahr: 2027, kunde: "alle", a: 80, b: 10, auswahl: null };
  const K = () => KZ[S.kz];
  const fw = v => zahl(K().f(v), K().nk);
  function auswaehlen(typ, wert) {
    S.auswahl = S.auswahl && S.auswahl.typ === typ && S.auswahl.wert === wert ? null : { typ, wert };
    zeichnen();
  }
  addEventListener("keydown", e => { if (e.key === "Escape" && S.auswahl) { S.auswahl = null; zeichnen(); } });

  /* ---------- ABC-Berechnung ---------- */
  function abc() {
    const agg = PROD.map((name, p) => ({ p, name, st: 0, u: 0, we: 0 }));
    R.forEach(r => {
      if (r.j !== S.jahr || (S.kunde !== "alle" && r.k !== +S.kunde)) return;
      const x = agg[r.p]; x.st += r.st; x.u += r.u; x.we += r.we;
    });
    agg.forEach(x => { x.db = x.u - x.we; x.wert = S.kz === "stueck" ? x.st : S.kz === "umsatz" ? x.u : S.kz === "we" ? x.we : x.db; });
    const liste = agg.slice().sort((a, b) => b.wert - a.wert || a.p - b.p);
    const ges = liste.reduce((s, x) => s + x.wert, 0) || 1e-9, N = liste.length;
    let kum = 0;
    liste.forEach((x, i) => {
      kum += x.wert;
      x.rang = i + 1; x.anteil = x.wert / ges; x.kum = kum / ges;
      x.kl = i === 0 || x.kum <= S.a / 100 + 1e-9 ? 0 : x.kum <= (S.a + S.b) / 100 + 1e-9 ? 1 : 2;
    });
    let kumK = 0;
    const klassen = KL.map((label, k) => {
      const xs = liste.filter(x => x.kl === k), w = xs.reduce((s, x) => s + x.wert, 0);
      kumK += w;
      return { key: k, label, n: xs.length, anteilN: xs.length / N, wert: w, anteil: w / ges, kum: kumK / ges,
               bisRang: xs.length ? xs[xs.length - 1].rang : null };
    });
    return { liste, klassen, ges, N };
  }
  const klasseVon = (d, p) => (d.liste.find(x => x.p === p) || {}).kl;

  /* ---------- Layout (Seite 1024 x 646) ---------- */
  DK.init({ titel: "ABC-Analyse Produkte" });
  const bKopf = DK.box("kopf", 16, 10, 992, 46);
  DK.haarlinie(62);
  const bFilter = DK.box("filter", 16, 68, 992, 50, "dk-filter");
  DK.haarlinie(128);
  const bProd = DK.box("v-produkte", 16, 138, 520, 504);
  const bKlassen = DK.box("v-klassen", 556, 138, 452, 156);
  DK.haarlinie(302, 556, 16);
  const bKurve = DK.box("v-kurve", 556, 310, 452, 332);
  const css = DK.el("style", {}, document.head);
  css.textContent = ".dk-rollen { overflow-y: auto; } .dk-rollen thead th { position: sticky; top: 0; background: #FFFFFF; z-index: 1; }" +
    " .dk-rest td { color: var(--muted); }";

  /* ---------- Tooltip (gleiches Verhalten wie die Bausteine von DK) ---------- */
  const tip = document.querySelector(".dk-tooltip");
  function tooltip(ziel, zeilenFn) {
    ziel.addEventListener("pointermove", ev => {
      tip.textContent = "";
      zeilenFn().forEach((z, i) => DK.el(i === 0 ? "b" : "div", {}, tip, z));
      tip.style.display = "block";
      const r = tip.getBoundingClientRect();
      let x = ev.clientX + 14, y = ev.clientY + 14;
      if (x + r.width > innerWidth - 8) x = ev.clientX - r.width - 14;
      if (y + r.height > innerHeight - 8) y = ev.clientY - r.height - 14;
      tip.style.left = x + "px"; tip.style.top = y + "px";
    });
    ziel.addEventListener("pointerleave", () => { tip.style.display = "none"; });
  }
  const tipProdukt = x => [x.name, `Rang ${x.rang} · Klasse ${KL[x.kl]}`,
    `${K().spalte}: ${fw(x.wert)} ${K().einheit}`, `Anteil: ${prozent(x.anteil, 1)} · kumuliert: ${prozent(x.kum, 1)}`,
    `Stück ${zahl(x.st, 0)} · Umsatz ${zahl(x.u / 1000, 1)} Tsd. € · DB ${zahl(x.db / 1000, 1)} Tsd. €`, "Klick hebt hervor"];

  /* ---------- Datenschnitte ---------- */
  DK.schnitt(bFilter, "Kennzahl", "knoepfe", { optionen: Object.entries(KZ).map(([k, v]) => [k, v.spalte]), wert: S.kz,
    onChange: v => { S.kz = v; zeichnen(); } });
  DK.schnitt(bFilter, "Jahr", "knoepfe", { optionen: JAHRE.map(j => [j, String(j)]), wert: S.jahr,
    onChange: v => { S.jahr = v; zeichnen(); } });
  DK.schnitt(bFilter, "Kunden", "dropdown", { breite: 170, optionen: [["alle", "Alle Kunden"], ...KUNDEN.map((k, i) => [String(i), k])],
    wert: "alle", onChange: v => { S.kunde = v; zeichnen(); } });
  const rechts = DK.el("div", { class: "dk-rechts", id: "grenzen", style: "display:flex;gap:24px" }, bFilter);
  DK.schnitt(rechts, "Klasse A bis", "dropdown", { breite: 90, optionen: [50, 60, 70, 80].map(v => [String(v), v + NBSP + "%"]),
    wert: String(S.a), onChange: v => { S.a = +v; zeichnen(); } });
  DK.schnitt(rechts, "Klasse B weitere", "dropdown", { breite: 90, optionen: [10, 15, 20, 25, 30].map(v => [String(v), v + NBSP + "%"]),
    wert: String(S.b), onChange: v => { S.b = +v; zeichnen(); } });

  /* ---------- Spalten ---------- */
  const spKlassen = () => [
    { key: "label", titel: "Klasse", breite: 58 },
    { key: "n", titel: "Produkte", breite: 70, fmt: v => zahl(v, 0) },
    { key: "anteilN", titel: "Anteil %", breite: 70, fmt: pz },
    { key: "wert", titel: K().spalte, breite: 96, fmt: fw },
    { key: "anteil", titel: "Anteil %", breite: 70, fmt: pz },
    { key: "kum", titel: "kumuliert %", breite: 88, fmt: pz, id: "sp-kum" },
  ];
  const spProdukte = () => [
    { key: "label", titel: "Rang", breite: 46 },
    { key: "name", titel: "Produkt", breite: 182, typ: "text" },
    { key: "kl", titel: "Klasse", breite: 56, typ: "text", id: "sp-klasse" },
    { key: "wert", titel: K().spalte, breite: 92, fmt: fw },
    { key: "anteil", titel: "Anteil %", breite: 62, fmt: pz },
    { key: "kum", titel: "kumuliert %", breite: 82, fmt: pz },
  ];

  /* ---------- Zeichnen ---------- */
  function zeichnen() {
    const d = abc(), k = K();
    const kundeText = S.kunde === "alle" ? "alle Kunden" : "Kundengruppe " + KUNDEN[+S.kunde];
    DK.kopf(bKopf, { titel: "ABC-Analyse Produkte",
      untertitel: `${k.name} in ${k.einheit} · Jahr ${S.jahr} · ${kundeText} · Klassengrenzen A ${S.a}${NBSP}%, B ${S.b}${NBSP}% · Stand 31.12.2027`,
      quelle: "", legende: [] });
    bKopf.querySelector(".dk-quelle").id = "kopf-quelle";

    const selKlasse = !S.auswahl ? null : S.auswahl.typ === "klasse" ? S.auswahl.wert : klasseVon(d, S.auswahl.wert);
    const selProdukt = S.auswahl && S.auswahl.typ === "produkt" ? S.auswahl.wert : null;
    const blassProdukt = x => S.auswahl != null && (selProdukt != null ? x.p !== selProdukt : x.kl !== selKlasse);

    // ABC-Klassen
    const A = d.klassen[0];
    let v = DK.visual(bKlassen, { titel: "ABC-Klassen", einheit: k.einheit,
      botschaft: `${A.n} A-${A.n === 1 ? "Produkt" : "Produkte"} (${prozent(A.anteilN, 0)}) ${A.n === 1 ? "bringt" : "bringen"} ${prozent(A.anteil, 0)} ${k.gen}` });
    const zk = d.klassen.map(x => ({ key: x.key, label: x.label, werte: x }));
    zk.push({ key: "summe", label: "Gesamt", summe: true, werte: { n: d.N, anteilN: 1, wert: d.ges, anteil: 1, kum: null } });
    DK.matrix(v.flaeche, { spalten: spKlassen(), zeilen: zk, auswahl: selKlasse, onClick: key => auswaehlen("klasse", key),
      tooltip: z => [`Klasse ${z.label}`, `${z.werte.n} ${z.werte.n === 1 ? "Produkt" : "Produkte"}` +
        (z.werte.n ? ` (Rang ${z.werte.bisRang - z.werte.n + 1}–${z.werte.bisRang})` : ""),
        `${k.spalte}: ${fw(z.werte.wert)} ${k.einheit}`, `Anteil: ${prozent(z.werte.anteil, 1)}`, "Klick hebt hervor"] });

    // Produkte nach Rang
    const top = d.liste[0];
    v = DK.visual(bProd, { titel: `Produkte nach ${k.name}`, einheit: k.einheit,
      botschaft: `Rang 1: ${top.name} mit ${prozent(top.anteil, 1)} ${k.gen}` });
    let zeigen = d.liste, rest = null;
    if (DK.PRINT) {                                          // Druck: so viele Zeilen, wie passen, dann „übrige“
      const passen = Math.floor((v.hoehe - 23) / 18);
      if (d.N > passen) {
        zeigen = d.liste.slice(0, passen - 1);
        const r = d.liste.slice(passen - 1);
        rest = { n: r.length, wert: r.reduce((s, x) => s + x.wert, 0), kl: [...new Set(r.map(x => KL[x.kl]))].join(", ") };
      }
    } else v.flaeche.classList.add("dk-rollen");
    const zp = zeigen.map((x, i) => ({ key: x.p, label: String(x.rang), x, trenner: i > 0 && zeigen[i - 1].kl !== x.kl,
      werte: { name: x.name, kl: i === 0 || zeigen[i - 1].kl !== x.kl ? KL[x.kl] : "", wert: x.wert, anteil: x.anteil, kum: x.kum } }));
    if (rest) zp.push({ key: "rest", label: "", trenner: true,
      werte: { name: `übrige ${rest.n} Produkte`, kl: rest.kl, wert: rest.wert, anteil: rest.wert / d.ges, kum: 1 } });
    DK.matrix(v.flaeche, { spalten: spProdukte(), zeilen: zp, zeilenhoehe: 18,
      onClick: key => { if (key !== "rest") auswaehlen("produkt", key); },
      tooltip: z => (z.x ? tipProdukt(z.x) : [z.werte.name, `Klasse ${z.werte.kl}`, `${k.spalte}: ${fw(z.werte.wert)} ${k.einheit}`]) });
    const trs = v.flaeche.querySelectorAll("tbody tr");
    zp.forEach((z, i) => { if (z.x && blassProdukt(z.x)) trs[i].classList.add("dk-blass"); if (!z.x) trs[i].classList.add("dk-rest"); });

    // Konzentrationskurve
    const AB = d.klassen[1];
    const xAB = (A.n + AB.n) / d.N;
    v = DK.visual(bKurve, { titel: "Konzentrationskurve", einheit: "kumulierte Anteile in %",
      botschaft: d.klassen[2].n === 0 ? "keine C-Produkte: A und B umfassen alle Produkte"
        : `${prozent(xAB, 0)} der Produkte (A und B) bringen ${prozent(AB.kum, 0)} ${k.gen}` });
    kurve(v, d, selKlasse, selProdukt);
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  /* ---------- Konzentrationskurve (Liniendiagramm) ---------- */
  function kurve(v, d, selKlasse, selProdukt) {
    const W = v.breite, H = v.hoehe, k = K();
    const svg = sv("svg", { width: W, height: H, role: "img", "aria-label": "Konzentrationskurve der ABC-Analyse" }, v.flaeche);
    const grenzen = d.klassen.slice(0, 2).filter(x => x.n > 0 && x.bisRang < d.N).map(x => ({ x: x.bisRang / d.N, y: x.kum }));
    const links = Math.ceil(tw("100")) + 8, rechts = 14, oben = 22, unten = 38;
    const PW = W - links - rechts, PH = H - oben - unten;
    const sx = t => links + t * PW, sy = t => oben + PH - t * PH;
    sv("text", { x: 0, y: 12, class: "muted" }, svg, `Anteil ${k.name} kumuliert`);
    sv("text", { x: links + PW, y: H - 3, "text-anchor": "end", class: "muted" }, svg, "Anteil Produkte nach Rang");
    // Achsenbeschriftung nur an 0, den Klassengrenzen und 100
    const yT = [{ t: 0, txt: "0" }, ...grenzen.map(g => ({ t: g.y, txt: pz(g.y) })), { t: 1, txt: "100" }];
    yT.filter((a, i) => !yT.some((b, j) => j !== i && (a.t === 0 || a.t === 1) && Math.abs(sy(a.t) - sy(b.t)) < 15))
      .forEach(a => sv("text", { x: links - 6, y: sy(a.t), dy: "0.35em", "text-anchor": "end", class: "muted" }, svg, a.txt));
    const xT = [{ t: 0, txt: "0" }, ...grenzen.map(g => ({ t: g.x, txt: pz(g.x) })), { t: 1, txt: "100" }];
    xT.filter((a, i) => !xT.some((b, j) => j !== i && (a.t === 0 || a.t === 1) &&
        Math.abs(sx(a.t) - sx(b.t)) < (tw(a.txt) + tw(b.txt)) / 2 + 8))
      .forEach(a => sv("text", { x: sx(a.t), y: oben + PH + 16, "text-anchor": a.t === 1 ? "end" : "middle", class: "muted" }, svg, a.txt));
    // Klassengrenzen
    const strich = { stroke: "#9A9A9A", "stroke-width": 1, "stroke-dasharray": "3 3" };
    grenzen.forEach(g => {
      sv("line", { x1: sx(g.x), x2: sx(g.x), y1: sy(g.y), y2: oben + PH, ...strich }, svg);
      sv("line", { x1: links, x2: sx(g.x), y1: sy(g.y), y2: sy(g.y), ...strich }, svg);
    });
    // Klassenfelder beschriften
    const xs = [0, ...d.klassen.map((x, i) => d.klassen.slice(0, i + 1).reduce((s, y) => s + y.n, 0) / d.N)];
    d.klassen.forEach((x, i) => {
      if (!x.n || sx(xs[i + 1]) - sx(xs[i]) < 16) return;
      sv("text", { x: (sx(xs[i]) + sx(xs[i + 1])) / 2, y: oben + PH - 7, "text-anchor": "middle", "font-weight": "bold",
                   class: selKlasse != null && selKlasse !== i ? "dk-blass" : "" }, svg, x.label);
    });
    // Achsen
    sv("line", { x1: links, x2: links, y1: oben, y2: oben + PH, stroke: "#8C8C8C", "stroke-width": 1 }, svg);
    sv("line", { x1: links, x2: links + PW, y1: oben + PH, y2: oben + PH, stroke: "#8C8C8C", "stroke-width": 1 }, svg);
    // Kurve je Klasse (für die Hervorhebung), beginnend im Ursprung
    const pkt = [{ x: 0, y: 0, kl: 0 }, ...d.liste.map(x => ({ x: x.rang / d.N, y: x.kum, kl: x.kl }))];
    KL.forEach((_, kl) => {
      const seg = pkt.filter((p, i) => i > 0 && p.kl === kl);
      if (!seg.length) return;
      const start = pkt[pkt.indexOf(seg[0]) - 1];
      const pfad = [start, ...seg].map((p, i) => (i ? "L" : "M") + sx(p.x).toFixed(1) + " " + sy(p.y).toFixed(1)).join(" ");
      sv("path", { d: pfad, fill: "none", stroke: "#3A3F44", "stroke-width": 2, "stroke-linejoin": "round",
                   class: selKlasse != null && selKlasse !== kl ? "dk-blass" : "" }, svg);
    });
    grenzen.forEach(g => sv("circle", { cx: sx(g.x), cy: sy(g.y), r: 3.5, fill: "#3A3F44", stroke: "#FFFFFF", "stroke-width": 1 }, svg));
    // Ausgewähltes Produkt
    const sel = selProdukt != null ? d.liste.find(x => x.p === selProdukt) : null;
    if (sel) {
      const cx = sx(sel.rang / d.N), cy = sy(sel.kum), txt = `${sel.name} (${pz(sel.kum)})`, w = tw(txt);
      sv("circle", { cx, cy, r: 5, fill: "#FFFFFF", stroke: "#3A3F44", "stroke-width": 2 }, svg);
      const rechtsFrei = cx + 9 + w <= links + PW;
      sv("text", { x: rechtsFrei ? cx + 9 : cx - 9, y: cy + 16, "text-anchor": rechtsFrei ? "start" : "end" }, svg, txt);
    }
    // Trefferflächen je Produkt
    d.liste.forEach(x => {
      const g = sv("g", { class: "dk-klick" }, svg);
      const hit = sv("circle", { cx: sx(x.rang / d.N), cy: sy(x.kum), r: 6, fill: "transparent" }, g);
      hit.addEventListener("click", () => auswaehlen("produkt", x.p));
      tooltip(hit, () => tipProdukt(x));
    });
  }

  /* ---------- Lernplattform: Designregeln, Nachbau, Tabellen, CSV ---------- */
  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "v-klassen", regel: "SAY – Botschaft vermitteln", titel: "Kernaussage statt Bedienhinweis",
        text: "Unter jedem Titel steht die Aussage, z. B. „11 A-Produkte (22 %) bringen 60 % des Absatzes“. Das Original hatte an dieser Stelle einen gelben Kasten mit einer Bedienanleitung." },
      { nr: 2, ziel: "kopf-titel", versatz: [26, 0], regel: "UNIFY – Titel und Sprache", titel: "Ein Titel, eine Sprache",
        text: "Kennzahl, Einheit, Jahr, Kunden und Klassengrenzen stehen im Untertitel. Das Original mischte Deutsch und Englisch (Count, Quantity Share, Cumulative value, Percentage of Elements)." },
      { nr: 3, ziel: "v-produkte", regel: "UNIFY – Zahlenformate", titel: "Stück ohne Nachkommastellen",
        text: "Stück sind ganze Zahlen, Euro in Tsd. € mit einer Stelle, Anteile in % mit einer Stelle. Das Original zeigte kumulierte Stück mit zwei Nachkommastellen („3.302,00“) und Anteile mit zwei Stellen." },
      { nr: 4, ziel: "sp-klasse", versatz: [24, -3], regel: "UNIFY – Semantische Notation", titel: "Klasse als Spalte, nicht als Farbe",
        text: "Die Klasse steht als Buchstabe in einer eigenen Spalte, Trennlinien gliedern die Liste. Das Original kennzeichnete A magenta und C türkis; Farbe bleibt hier Abweichungen vorbehalten." },
      { nr: 5, ziel: "v-kurve", regel: "CHECK – Visuelle Integrität", titel: "Volle Achsen, nur relevante Werte",
        text: "Beide Achsen reichen von 0 bis 100 %. Beschriftet sind nur 0, die Klassengrenzen und 100; die Hilfslinien führen von den Grenzpunkten zu den Achsen." },
      { nr: 6, ziel: "v-kurve", versatz: [0, 26], regel: "EXPRESS – Passende Darstellung", titel: "Eine Kurve, Klassen als Felder",
        text: "Die Konzentrationskurve (Lorenzkurve) bleibt. Statt drei Linienfarben sind die Felder A, B und C beschriftet; Klick auf eine Klasse hebt ihren Abschnitt hervor." },
      { nr: 7, ziel: "kopf-quelle", anker: "links", regel: "SIMPLIFY – Überflüssiges weglassen", titel: "Ohne Logo, Hinweiskasten und Drehfelder",
        text: "Logo, gelber Hinweiskasten, Drehfelder, Bildlaufleisten und die Schaltflächen „zurück“ und „Erklärung“ entfallen. Die Bedienung erklärt sich aus der Filterzeile." },
      { nr: 8, ziel: "grenzen", anker: "links", regel: "STRUCTURE – Inhalte ordnen", titel: "Alle Einstellungen in einer Zeile",
        text: "Kennzahl, Jahr, Kunden und Klassengrenzen stehen in einer Zeile über dem Inhalt; im Original verteilten sie sich auf eine Registerleiste und zwei Filterkästen. Die Produktliste folgt dem Rang." },
    ],
    nachbauIntro: "Alle Elemente sind Standard-Visuals von Power BI Desktop. Seitengröße benutzerdefiniert 1024 × 646 px. Schrift Arial: Beschriftungen 10,5 pt, Visualtitel 12 pt. Das Berichtsdesign (JSON) setzt Farben und Schriften. Die Klassen hängen von Filter und Grenzen ab und werden deshalb als Measures berechnet, nicht als berechnete Spalte.",
    nachbau: [
      { id: "A", ziel: "kopf-titel", versatz: [26, 0], titel: "Kopfzeile", visual: "Textfeld",
        felder: "Untertitel mit dynamischem Wert: Measure „Untertitel“ aus Kennzahl, Jahr, Kunden und Grenzen",
        format: "Titel 16,5 pt fett, Untertitel 10,5 pt #4D4D4D" },
      { id: "B", ziel: "grenzen", anker: "links", titel: "Datenschnitte", visual: "Datenschnitt (Stil Kacheln bzw. Dropdown)",
        felder: "Kennzahl als Feldparameter (Stück, Umsatz, Wareneinsatz, DB); Jahr; Kundengruppe; Grenzen A und B als Was-wäre-wenn-Parameter (Liste 50–80 bzw. 10–30)",
        format: "Ausgewählt: Füllung #3A3F44, Schrift weiß; nicht ausgewählt: weiß, Rahmen #9A9A9A" },
      { id: "C", ziel: "v-klassen", titel: "ABC-Klassen", visual: "Matrix",
        felder: "Zeilen: Klasse aus einer getrennten Tabelle (A, B, C); Werte: Produkte, Anteil Produkte, Wert, Anteil, kumuliert",
        format: "Gesamtzeile fett, Linie oben; keine Rasterlinien",
        hinweis: "Kum. Anteil je Produkt: Summe der Werte aller Produkte mit Wert ≥ eigenem Wert (ALLSELECTED) / Gesamtwert. Klasse: SWITCH(TRUE(); kum ≤ A; \"A\"; kum ≤ A + B; \"B\"; \"C\"). Produkte je Klasse: COUNTROWS(FILTER(VALUES(Produkt); [Klasse] = SELECTEDVALUE(Klassen[Klasse])))." },
      { id: "D", ziel: "v-produkte", titel: "Produkte nach Rang", visual: "Tabelle",
        felder: "Rang (RANKX über ALLSELECTED(Produkt)), Produkt, Klasse, Wert, Anteil, kumulierter Anteil",
        format: "Sortierung nach Wert absteigend; Zeilenabstand kompakt; Tabelle scrollt, Kopf bleibt stehen" },
      { id: "E", ziel: "v-kurve", titel: "Konzentrationskurve", visual: "Liniendiagramm",
        felder: "X-Achse: Produkt, nach Wert absteigend sortiert (gleiche Abstände = Anteil der Produkte); Y-Achse: Measure kumulierter Anteil",
        format: "Linie #3A3F44, 2 px; Y-Achse 0–1 fest, Format 0 %; X-Achsenbeschriftung aus; Y-Konstantenlinien bei A und A + B (Wert aus den Parametern), gestrichelt #9A9A9A",
        hinweis: "Senkrechte Grenzlinien gibt es im Standardvisual nicht; die Datenbeschriftung nur an den beiden Grenzprodukten (Measure liefert sonst BLANK()) zeigt die Grenzpunkte." },
      { id: "F", ziel: "v-kurve", versatz: [-28, 0], titel: "Kernaussagen", visual: "Textfeld mit dynamischem Wert",
        felder: "Je Visual ein Text-Measure, z. B. Anzahl A-Produkte und ihr Anteil am Wert", format: "10,5 pt, #4D4D4D" },
    ],
    theme: DK.thema(),
    csv: { name: "abc_analyse_beispieldaten.csv", text: () => {
      const kopf = "Jahr;Produkt;Kundengruppe;Stück;Umsatz_EUR;Wareneinsatz_EUR;DB_EUR";
      return [kopf, ...R.map(r => [r.j, PROD[r.p], KUNDEN[r.k], r.st, r.u, r.we, r.u - r.we].join(";"))].join("\r\n"); } },
    tabellen: () => {
      const d = abc(), k = K();
      return [
        { titel: `ABC-Klassen (${k.einheit}, %)`, kopf: ["Klasse", "Produkte", "Anteil %", k.spalte, "Anteil %", "kumuliert %"],
          zeilen: d.klassen.map(x => [x.label, String(x.n), pz(x.anteilN), fw(x.wert), pz(x.anteil), pz(x.kum)])
            .concat([["Gesamt", String(d.N), "100,0", fw(d.ges), "100,0", "–"]]) },
        { titel: `Produkte nach ${k.name} (${k.einheit}, %)`, kopf: ["Rang", "Produkt", "Klasse", k.spalte, "Anteil %", "kumuliert %"],
          zeilen: d.liste.map(x => [String(x.rang), x.name, KL[x.kl], fw(x.wert), pz(x.anteil), pz(x.kum)]) },
      ];
    },
  });
  zeichnen();
})();
