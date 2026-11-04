/* Einzelvisual „Analyse gemäß einem Star-Schema“ (Abb. 5.20).
   Seite 727 x 464 px = 110 x 70,2 mm. Daten: star.json (daten_star.py) – Star-Schema wie Abb. 5.19 mit den
   Werten aus Abb. 5.18. Aufbau wie im Original von links nach rechts bzw. oben nach unten: Datenschnitt
   „Produktfilter“, Absatzmenge je Kunde ohne Filter und mit Produktfilter (gleicher Maßstab, gleiche Reihenfolge),
   darunter die Felder des Star-Schemas (im Original der Datenbereich des Werkzeugs) mit Kennzeichnung, welches
   Feld im Bericht Wert, Achse, Filter oder Tooltip ist. Klick auf einen Balken hebt den Kunden in beiden
   Diagrammen hervor, Esc hebt auf. */
(() => {
  "use strict";
  const { zahl, NBSP, el, sv } = DK;
  const eur = v => zahl(v, 2) + NBSP + "€";
  const und = l => (l.length < 2 ? l.join("") : l.slice(0, -1).join(", ") + " und " + l[l.length - 1]);
  const PROD = DATA.produkt.map(([id, name, preis, vegan]) => ({ id, name, preis, vegan }));
  const KUND = DATA.kunde.map(([id, name, karte, vegan]) => ({ id, name, karte, vegan }));
  const ORT = DATA.ort.map(([id, name]) => ({ id, name }));
  const DAT = DATA.datum.map(([id, tag, monat, quartal, halbjahr, jahr]) => ({ id, tag, monat, quartal, halbjahr, jahr }));
  const F = DATA.fakten.map(([k, p, d, o, menge, umsatz]) => ({ k, p, d, o, menge, umsatz }));
  const prod = id => PROD.find(p => p.id === id);
  const datum = iso => iso.split("-").reverse().join(".");

  /* ---------- Zustand ---------- */
  const S = { produkt: 1, kunde: null };                 // Druck wie das Original: Produktfilter Latte Macchiato
  addEventListener("keydown", e => { if (e.key === "Escape" && S.kunde != null) { S.kunde = null; zeichnen(); } });

  /* ---------- Layout ---------- */
  const H = 464;
  DK.init({ titel: "Analyse gemäß einem Star-Schema", breite: 727, hoehe: H });
  const bTitel = DK.box("v-titel", 16, 8, 695, 46);
  const bFilter = DK.box("filter", 16, 60, 695, 50, "dk-filter");
  DK.haarlinie(116);
  const bAlle = DK.box("v-alle", 16, 126, 335, 164);
  const bGef = DK.box("v-filter", 376, 126, 335, 164);
  DK.haarlinie(298);
  const bFelder = DK.box("v-felder", 16, 306, 695, 152);

  /* ---------- Berechnungen (Faktentabelle, gefiltert über die Dimension Produkt) ---------- */
  const zeilen = produkt => F.filter(f => produkt === "alle" || f.p === produkt);
  function jeKunde(produkt) {
    const z = zeilen(produkt);
    return KUND.map(k => {
      const r = z.filter(f => f.k === k.id);
      return { key: k.id, label: k.name, n: r.length, wert: r.length ? r.reduce((s, f) => s + f.menge, 0) : null,
               umsatz: r.reduce((s, f) => s + f.umsatz, 0), r };
    });
  }
  const summe = l => l.reduce((s, z) => s + (z.wert || 0), 0);
  const MAX = Math.max(...jeKunde("alle").map(z => z.wert));          // ein Maßstab für beide Diagramme
  const pName = () => (S.produkt === "alle" ? "Alle Produkte" : prod(S.produkt).name);

  /* ---------- Botschaft ---------- */
  const passt = (k, b) => k.find(t => DK.tw(t) <= b) || k[k.length - 1];
  function botschaft(b) {
    const alle = jeKunde("alle"), gef = jeKunde(S.produkt), M = summe(alle), m = summe(gef);
    if (S.kunde != null) {
      const a = alle.find(z => z.key === S.kunde), g = gef.find(z => z.key === S.kunde);
      if (S.produkt === "alle") return `${a.label}: ${zahl(a.wert)} von ${zahl(M)} Stück, Umsatz ${eur(a.umsatz)}`;
      return passt([`${a.label}: ${zahl(g.wert || 0)} von ${zahl(a.wert)} Stück ${g.wert === 1 ? "ist" : "sind"} ${pName()}`,
                    `${a.label}: ${zahl(g.wert || 0)} von ${zahl(a.wert)} Stück`], b);
    }
    if (S.produkt === "alle") {
      const top = alle.slice().sort((x, y) => y.wert - x.wert)[0];
      return `${zahl(M)} Stück an ${alle.length} Kunden – ${top.label} kauft ${zahl(top.wert)} davon`;
    }
    const mit = gef.filter(z => z.wert);
    if (!mit.length) return `${pName()}: nicht verkauft – nach dem Filter bleibt kein Balken`;
    if (mit.length === 1) return `${pName()}: ${zahl(m)} von ${zahl(M)} Stück, gekauft nur von ${mit[0].label}`;
    return passt([`${pName()}: ${zahl(m)} von ${zahl(M)} Stück – ${und(mit.map(z => `${z.label} ${zahl(z.wert)}`))}`,
                  `${pName()}: ${zahl(m)} von ${zahl(M)} Stück`], b);
  }

  /* ---------- Balkendiagramm mit festem Maßstab (lokal: DK.balken skaliert je Diagramm) ---------- */
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
  function diagramm(box, id, titel, daten, tipFn) {
    box.textContent = "";
    box.classList.add("dk-visual");
    el("div", { style: "font-weight:bold;height:22px" }, box, titel);
    const W = box.clientWidth, RH = 36, BH = 24, oben = 26;
    const svg = sv("svg", { width: W, height: box.clientHeight - oben, id, role: "img",
      "aria-label": `Balkendiagramm Absatzmenge je Kunde, ${titel}`, style: "position:absolute;left:0;top:" + oben + "px" }, box);
    const lw = Math.ceil(Math.max(...KUND.map(k => DK.tw(k.name)))) + 10, pw = W - lw - 34;
    daten.forEach((z, i) => {
      const y = i * RH, blass = S.kunde != null && S.kunde !== z.key;
      const g = sv("g", { class: "dk-klick" + (blass ? " dk-blass" : "") }, svg);
      sv("text", { x: lw - 10, y: y + RH / 2, dy: "0.35em", "text-anchor": "end" }, g, z.label);
      const bw = z.wert ? z.wert / MAX * pw : 0;
      if (bw) sv("rect", { x: lw, y: y + (RH - BH) / 2, width: bw, height: BH, fill: DK.FARBE.ist }, g);
      sv("text", { x: lw + bw + 5, y: y + RH / 2, dy: "0.35em" }, g, z.wert ? zahl(z.wert) : "–");
      const hit = sv("rect", { x: 0, y, width: W, height: RH, fill: "transparent" }, g);
      hit.addEventListener("click", () => { S.kunde = S.kunde === z.key ? null : z.key; zeichnen(); });
      tooltip(hit, () => tipFn(z));
    });
    const ys = daten.length * RH + 6;
    sv("line", { x1: 0, x2: W, y1: ys, y2: ys, stroke: "#3A3F44", "stroke-width": 1 }, svg);
    const gs = sv("g", { id: id + "-summe" }, svg);
    sv("text", { x: lw - 10, y: ys + 16, dy: "0.35em", "text-anchor": "end", style: "font-weight:bold" }, gs, "Summe");
    sv("text", { x: lw + 5, y: ys + 16, dy: "0.35em", style: "font-weight:bold" }, gs, zahl(summe(daten)));
    sv("line", { x1: lw, x2: lw, y1: 2, y2: daten.length * RH - 2, stroke: "#8C8C8C", "stroke-width": 1 }, svg);
  }
  function positionen(z) {
    return z.r.map(f => `${datum(f.d)} · ${prod(f.p).name} ${zahl(f.menge)} Stück, ${eur(f.umsatz)}`);
  }

  /* ---------- Felder des Star-Schemas ---------- */
  const ROLLE = { Menge: "Wert", Umsatz: "Tooltip", Name: "Achse", ProduktName: "Filter" };
  const FELDER = [["Verkäufe", "Faktentabelle", ["Menge", "Umsatz"]],
                  ["Kunde", "Dimensionstabelle", ["Name", "DreamCardNr", "VeganePraeferenz"]],
                  ["Produkt", "Dimensionstabelle", ["ProduktName", "Preis", "VeganeOption"]],
                  ["Datum", "Dimensionstabelle", ["Tag", "Monat", "Quartal", "Halbjahr", "Jahr"]],
                  ["Verkaufsort", "Dimensionstabelle", ["Verkaufsort"]]];
  function felder() {
    bFelder.textContent = "";
    const k = el("div", { id: "felder-kopf", style: "height:22px" }, bFelder);
    el("b", {}, k, "Felder des Star-Schemas");
    el("span", { style: "color:var(--muted)" }, k, " · Schlüsselfelder ausgeblendet, fett: im Bericht verwendet");
    const CW = [125, 140, 160, 135, 135];               // Spaltenbreiten nach dem längsten Eintrag
    FELDER.forEach(([tab, rolle, fl], i) => {
      const x = CW.slice(0, i).reduce((a, b) => a + b, 0);
      const c = el("div", { id: "felder-" + i, style: `position:absolute;left:${x}px;top:26px;width:${CW[i] - 6}px;line-height:17px;white-space:nowrap` }, bFelder);
      el("div", { style: "font-weight:bold" }, c, tab);
      el("div", { style: "color:var(--muted);margin-bottom:3px" }, c, rolle);
      fl.forEach(f => {
        const d = el("div", {}, c);
        if (ROLLE[f]) { el("b", {}, d, f); el("span", { style: "color:var(--muted)" }, d, ` (${ROLLE[f]})`); }
        else d.textContent = f;
      });
    });
  }

  /* ---------- Datenschnitt und Summen ---------- */
  DK.schnitt(bFilter, "Produktfilter", "dropdown", {
    breite: 200, optionen: [["alle", "Alle Produkte"], ...PROD.map(p => [String(p.id), p.name])], wert: String(S.produkt),
    onChange: v => { S.produkt = v === "alle" ? "alle" : Number(v); zeichnen(); } });
  const gesamt = el("div", { id: "summen", class: "dk-rechts dk-quelle", style: "align-self:flex-end;padding-bottom:6px" }, bFilter);

  /* ---------- Zeichnen ---------- */
  function zeichnen() {
    const alle = jeKunde("alle"), gef = jeKunde(S.produkt);
    DK.visual(bTitel, { titel: "Absatzmenge je Kunde", einheit: "Stück", botschaft: botschaft(695) });
    gesamt.textContent = "";
    gesamt.appendChild(document.createTextNode("Faktentabelle: "));
    el("b", { style: "color:#1A1A1A" }, gesamt, `${zahl(summe(alle))} Stück`);
    gesamt.appendChild(document.createTextNode(" · nach Filter: "));
    el("b", { style: "color:#1A1A1A" }, gesamt, `${zahl(summe(gef))} Stück`);
    diagramm(bAlle, "bar-alle", "Ohne Filter: alle Produkte", alle, z => {
      const g = gef.find(x => x.key === z.key);
      return [`${z.label} · alle Produkte`, `${zahl(z.wert)} Stück · Umsatz ${eur(z.umsatz)} · ${z.n} Positionen`,
        ...positionen(z), S.produkt === "alle" ? "" : `davon ${pName()}: ${g.wert ? zahl(g.wert) + " Stück" : "–"}`,
        "Klick hebt den Kunden hervor"].filter(Boolean);
    });
    diagramm(bGef, "bar-filter", `Produktfilter: ${pName()}`, gef, z => {
      const a = alle.find(x => x.key === z.key);
      return [`${z.label} · ${pName()}`, z.wert ? `${zahl(z.wert)} von ${zahl(a.wert)} Stück · Umsatz ${eur(z.umsatz)}`
                                               : `Kein Kauf – von ${zahl(a.wert)} Stück insgesamt`,
        ...positionen(z), "Klick hebt den Kunden hervor"];
    });
    felder();
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  /* ---------- Lernplattform: Designregeln, Nachbau, Tabellen, CSV ---------- */
  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "v-titel", anker: "links", versatz: [640, 22], regel: "SAY – Botschaft vermitteln", titel: "Aussage zum Filter",
        text: "Unter dem Titel steht, was der Produktfilter bewirkt – z. B. dass Latte Macchiato nur von Max gekauft wurde; nach einem Klick auf einen Kunden dessen Anteil. Das Original zeigte nur die beiden Diagramme mit Pfeilen dazwischen." },
      { nr: 2, ziel: "v-alle", anker: "links", versatz: [230, -4], regel: "CHECK – Richtige Inhalte", titel: "Titel passt zum Inhalt",
        text: "Die Balken zeigen die Absatzmenge je Kunde. Das Original hieß „Verkäufe je Produkt“ und beschriftete die Achse mit „Produktname“, obwohl Kundennamen daran standen. Einheit „Stück“ ergänzt." },
      { nr: 3, ziel: "bar-filter", versatz: [-60, 12], regel: "CHECK – Visuelle Integrität", titel: "Ein Maßstab für beide Diagramme",
        text: "Beide Diagramme haben denselben Maßstab: Max’ 2 Stück Latte Macchiato sind halb so lang wie seine 4 Stück insgesamt. Im Original füllte der gefilterte Balken (2) die ganze Breite wie der ungefilterte (4)." },
      { nr: 4, ziel: "bar-filter", versatz: [-220, 48], regel: "STRUCTURE – Inhalte ordnen", titel: "Feste Reihenfolge, „–“ für ohne Kauf",
        text: "Die Kunden stehen in beiden Diagrammen in derselben Reihenfolge (KundenID); wer das Produkt nicht gekauft hat, erhält „–“ statt zu verschwinden. So bleibt der Vergleich vorher/nachher auf einen Blick möglich." },
      { nr: 5, ziel: "felder-0", anker: "links", versatz: [96, -4], regel: "EXPRESS – Herkunft der Felder", titel: "Fakten und Dimensionen benannt",
        text: "Unter den Diagrammen steht, aus welcher Tabelle des Star-Schemas jedes Feld kommt: Menge (Wert) aus der Faktentabelle Verkäufe, Name (Achse) aus der Dimension Kunde, ProduktName (Filter) aus der Dimension Produkt. Der Filter auf Produkt wirkt über die Faktentabelle auf die Kunden." },
      { nr: 6, ziel: "filter", anker: "links", versatz: [250, 6], regel: "CONDENSE – Filtern statt vervielfachen", titel: "Ein Datenschnitt, ein Klick",
        text: "Der Produktfilter wählt das Produkt für das rechte Diagramm, das linke bleibt ungefiltert als Vergleich. Ein Klick auf einen Balken hebt den Kunden in beiden Diagrammen hervor, der Tooltip nennt seine Positionen; Esc hebt auf." },
      { nr: 7, ziel: "summen", anker: "links", versatz: [-22, -2], regel: "SIMPLIFY – Überflüssiges weglassen", titel: "Ohne Rahmen, Pfeile und Symbole",
        text: "Rahmen um die Visuals, Blockpfeile, Symbolleisten, Suchfeld und Kontrollkästchen des Werkzeugs entfallen. Summen stehen einmal über und je Diagramm unter den Balken." },
    ],
    nachbauIntro: "Standard-Visuals von Power BI Desktop. Seitengröße benutzerdefiniert 727 × 464 px. Schrift Arial: Beschriftungen 10,5 pt, Visualtitel 12 pt. Datenmodell: Star-Schema wie Abb. 5.19 aus der CSV-Datei (je Block eine Tabelle): Verkäufe n:1 Produkt (ProduktID), Kunde (KundenID), Datum (VerkaufsdatumID → DatumID), Verkaufsort (VerkaufsortID), Kreuzfilterrichtung einfach; Schlüsselfelder in der Berichtsansicht ausblenden.",
    nachbau: [
      { id: "A", ziel: "bar-alle", versatz: [-40, -30], titel: "Ohne Filter", visual: "Gruppiertes Balkendiagramm",
        felder: "Y-Achse: Kunde[Name]; X-Achse: Measure Menge alle Produkte = CALCULATE(SUM(Verkäufe[Menge]); ALL(Produkt)); Tooltip: SUM(Verkäufe[Umsatz])",
        format: "Balken #3A3F44; Datenbeschriftungen an; X-Achse aus, Ende fest 4; Gitternetz aus; Sortierung nach KundenID (Spalte „Nach Spalte sortieren“)",
        hinweis: "Alternativ: Format → Interaktionen bearbeiten → Datenschnitt wirkt nicht auf dieses Visual." },
      { id: "B", ziel: "bar-filter", versatz: [-40, -30], titel: "Mit Produktfilter", visual: "Gruppiertes Balkendiagramm",
        felder: "Y-Achse: Kunde[Name] mit „Elemente ohne Daten anzeigen“; X-Achse: SUM(Verkäufe[Menge]); Tooltip: SUM(Verkäufe[Umsatz])",
        format: "wie A; X-Achse Ende fest 4 (gleicher Maßstab wie A)" },
      { id: "C", ziel: "filter", anker: "links", versatz: [240, 30], titel: "Produktfilter", visual: "Datenschnitt",
        felder: "Produkt[ProduktName] als Dropdown, Einzelauswahl, „Alle auswählen“ als „Alle Produkte“",
        format: "Rahmen #9A9A9A, Kopfzeile 10,5 pt #4D4D4D" },
      { id: "D", ziel: "felder-kopf", versatz: [-140, 2], titel: "Felder des Star-Schemas", visual: "Kein Visual – Datenbereich",
        felder: "Entspricht dem Bereich „Daten“ in Power BI Desktop: je Tabelle die sichtbaren Felder; Schlüssel ausgeblendet",
        hinweis: "Im veröffentlichten Bericht ggf. als Textfeld; im Buch zeigt es, aus welcher Tabelle jedes Feld stammt." },
      { id: "E", ziel: "v-titel", anker: "links", versatz: [640, 22], titel: "Aussage", visual: "Textfeld mit dynamischem Wert",
        felder: "Text-Measure aus SELECTEDVALUE(Produkt[ProduktName]), SUM(Verkäufe[Menge]) und CONCATENATEX(FILTER(VALUES(Kunde[Name]); [Menge] > 0); Kunde[Name]; \", \")",
        format: "10,5 pt, #4D4D4D" },
    ],
    theme: DK.thema(),
    csv: { name: "star_schema_verkaeufe.csv", text: () => {
      const k = ["Verkäufe (Faktentabelle);;;;;", "KundenID;ProduktID;VerkaufsdatumID;VerkaufsortID;Menge;Umsatz_EUR",
        ...F.map(f => [f.k, f.p, datum(f.d), f.o, f.menge, zahl(f.umsatz, 2)].join(";")), "",
        "Produkt (Dimension);;;", "ProduktID;ProduktName;Preis_EUR;VeganeOption",
        ...PROD.map(p => [p.id, p.name, zahl(p.preis, 2), p.vegan].join(";")), "",
        "Kunde (Dimension);;;", "KundenID;Name;DreamCardNr;VeganePraeferenz", ...KUND.map(c => [c.id, c.name, c.karte, c.vegan].join(";")), "",
        "Datum (Dimension);;;;;", "DatumID;Tag;Monat;Quartal;Halbjahr;Jahr",
        ...DAT.map(d => [datum(d.id), d.tag, d.monat, d.quartal, d.halbjahr, d.jahr].join(";")), "",
        "Verkaufsort (Dimension);", "VerkaufsortID;Verkaufsort", ...ORT.map(o => [o.id, o.name].join(";"))];
      return k.join("\r\n"); } },
    tabellen: () => {
      const alle = jeKunde("alle"), gef = jeKunde(S.produkt);
      return [{ titel: `Absatzmenge je Kunde (Stück), Produktfilter: ${pName()}`,
        kopf: ["Kunde", "Alle Produkte", "Umsatz alle (€)", pName(), `Umsatz ${pName()} (€)`],
        zeilen: [...alle.map((z, i) => [z.label, zahl(z.wert), zahl(z.umsatz, 2), gef[i].wert ? zahl(gef[i].wert) : "–",
                                         gef[i].wert ? zahl(gef[i].umsatz, 2) : "–"]),
                 ["Summe", zahl(summe(alle)), zahl(alle.reduce((s, z) => s + z.umsatz, 0), 2), zahl(summe(gef)),
                  zahl(gef.reduce((s, z) => s + z.umsatz, 0), 2)]] }];
    },
  });
  zeichnen();
})();
