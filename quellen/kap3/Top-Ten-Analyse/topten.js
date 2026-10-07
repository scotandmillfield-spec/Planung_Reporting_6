/* Einzelvisual „Top-Ten-Analyse“ (Abb. 3.20).
   Seite 727 x 460 px = 110 x 69,7 mm. Daten: topten.json (daten_topten.py) – 48 Kunden mit Vertriebsgebiet und Umsatz
   2023–2025 in €; die zehn größten Kunden 2025 sind die des Originals (Namen erfunden). Eine Rangtabelle mit
   Abweichung zum Vorjahr und Umsatzanteil als Datenbalken; sie ersetzt Tabelle und Balkendiagramm des Originals,
   die dieselben Zahlen doppelt zeigten. Datenschnitte Jahr und Vertriebsgebiet, keine weiteren Visuals. */
(() => {
  "use strict";
  const { zahl, delta, NBSP } = DK;
  const JAHRE = DATA.jahre;
  const K = DATA.kunden.map(([name, gebiet], i) => ({ i, name, gebiet, u: DATA.werte[i] }));
  const GEBIETE = ["Nord", "Ost", "Süd", "West"];
  const N = 10;
  const tsd = v => zahl(v / 1000, 1);
  const pz = (v, nk = 0) => delta(v * 100, nk, NBSP + "%");
  const anteilText = v => zahl(v * 100, 0) + NBSP + "%";

  /* ---------- Zustand ---------- */
  const S = { jahr: JAHRE[JAHRE.length - 1], gebiet: "alle", sort: null, auswahl: null };
  addEventListener("keydown", e => { if (e.key === "Escape" && S.auswahl != null) { S.auswahl = null; zeichnen(); } });

  /* ---------- Layout ---------- */
  DK.init({ titel: "Top-Ten-Analyse", breite: 727, hoehe: 460 });
  const bFilter = DK.box("filter", 16, 8, 695, 50, "dk-filter");
  DK.haarlinie(66);
  const bTab = DK.box("v-tabelle", 16, 76, 695, 374);
  DK.el("style", {}, document.head, `
    #v-tabelle .dk-matrix th { vertical-align: bottom; }
    #v-tabelle .dk-matrix td:nth-child(2) { text-align: left; }
    #v-tabelle .dk-matrix th:nth-child(2) { text-align: left; }
    #v-tabelle .dk-matrix tr.dk-summe.dk-rest td { font-weight: normal; border-top-color: var(--linie); }
    #v-tabelle .dk-matrix tr.dk-rest text { font-weight: normal !important; }`);

  /* ---------- Berechnungen ---------- */
  const j = () => JAHRE.indexOf(S.jahr);
  function daten() {
    const ji = j();
    const auswahl = K.filter(k => S.gebiet === "alle" || k.gebiet === S.gebiet)
      .map(k => ({ k, ist: k.u[ji], vj: k.u[ji - 1] }));
    const gesIst = auswahl.reduce((s, r) => s + r.ist, 0), gesVj = auswahl.reduce((s, r) => s + r.vj, 0);
    const rangVj = auswahl.slice().sort((a, b) => b.vj - a.vj);
    auswahl.forEach(r => { r.dvj = r.ist - r.vj; r.dvjp = r.dvj / r.vj; r.anteil = r.ist / gesIst; r.rangVj = rangVj.indexOf(r) + 1; });
    const sortiert = auswahl.slice().sort((a, b) => b.ist - a.ist);
    sortiert.forEach((r, i) => { r.rang = i + 1; });
    const top = sortiert.slice(0, N), rest = sortiert.slice(N);
    const summe = l => { const ist = l.reduce((s, r) => s + r.ist, 0), vj = l.reduce((s, r) => s + r.vj, 0);
      return { ist, vj, dvj: ist - vj, dvjp: vj ? (ist - vj) / vj : 0, anteil: ist / gesIst, n: l.length }; };
    return { top, rest, sTop: summe(top), sRest: summe(rest), ges: { ...summe(auswahl), anteil: null }, gesIst, gesVj };
  }
  const gebietText = () => (S.gebiet === "alle" ? "alle Vertriebsgebiete" : "Vertriebsgebiet " + S.gebiet);

  const SPALTEN = [
    { key: "rang", titel: "Rang", breite: 40 },
    { key: "kunde", id: "sp-kunde", titel: "Kunde", breite: 186, typ: "text" },
    { key: "vj", id: "sp-vj", titel: "VJ", breite: 66, fmt: tsd },
    { key: "ist", id: "sp-ist", titel: "IST", breite: 66, fmt: tsd },
    { key: "dvj", id: "sp-dvj", titel: "ΔVJ", breite: 140, typ: "delta", richtung: 1, nk: 1, textBreite: 52 },
    { key: "dvjp", id: "sp-dvjp", titel: "ΔVJ %", breite: 66, fmt: v => pz(v) },
    { key: "anteil", id: "sp-anteil", titel: "Anteil", breite: 131, typ: "anteil", textBreite: 46 },
  ];
  function tabellenZeilen(d) {
    const liste = d.top.slice(), s = S.sort;
    if (s) liste.sort((a, b) => {
      const c = s.key === "kunde" ? a.k.name.localeCompare(b.k.name, "de") : s.key === "rang" ? a.rang - b.rang : a[s.key] - b[s.key];
      return (s.ab ? -c : c) || a.rang - b.rang;
    });
    const z = liste.map(r => ({ key: r.k.name, label: String(r.rang), r,
      werte: { kunde: r.k.name, vj: r.vj, ist: r.ist, dvj: r.dvj / 1000, dvjp: r.dvjp, anteil: r.anteil } }));
    const zs = (label, x, rest) => ({ key: label, label: "", summe: true, rest,
      werte: { kunde: label, vj: x.vj, ist: x.ist, dvj: x.dvj / 1000, dvjp: x.dvjp, anteil: x.anteil } });
    z.push(zs(`Summe Top ${Math.min(N, d.top.length)}`, d.sTop));
    if (d.rest.length) z.push(zs(`Übrige ${d.rest.length} Kunden`, d.sRest, true));
    z.push(zs(`Alle ${d.top.length + d.rest.length} Kunden`, d.ges));
    return z;
  }
  function sortieren(key) {
    if (S.sort && S.sort.key === key) S.sort = { key, ab: !S.sort.ab };
    else S.sort = { key, ab: !["kunde", "rang"].includes(key) };
    zeichnen();
  }
  function tooltipKunde(r) {
    return [r.k.name, `Vertriebsgebiet ${r.k.gebiet} · Rang ${r.rang} (Vorjahr Rang ${r.rangVj})`,
      `Umsatz ${S.jahr}: ${tsd(r.ist)} Tsd. € · ${S.jahr - 1}: ${tsd(r.vj)} Tsd. €`,
      `ΔVJ ${delta(r.dvj / 1000, 1)} Tsd. € (${pz(r.dvjp)})`,
      `Anteil am Umsatz (${gebietText()}): ${zahl(r.anteil * 100, 1)}${NBSP}%`,
      "Klick hebt den Kunden hervor, Klick auf einen Spaltenkopf sortiert"];
  }
  function botschaft(d, breite) {
    const erster = d.top[0], rueck = d.top.slice().sort((a, b) => a.dvjp - b.dvjp)[0];
    const anfang = `Top ${d.top.length} = ${anteilText(d.sTop.anteil)} des Umsatzes`;
    const teile = [];
    if (rueck && rueck.dvjp < -0.05) teile.push(`stärkster Rückgang: ${rueck.k.name} (${pz(rueck.dvjp)})`);
    teile.push(`größter Kunde ${anteilText(erster.anteil)}`);
    for (let n = teile.length; n >= 0; n--) {
      const t = n ? `${anfang} – ${teile.slice(0, n).join(", ")}` : anfang;
      if (DK.tw(t) <= breite) return t;
    }
    return anfang;
  }

  /* ---------- Datenschnitte ---------- */
  DK.schnitt(bFilter, "Jahr", "knoepfe", {
    optionen: JAHRE.slice(1).map(y => [y, String(y)]), wert: S.jahr,
    onChange: v => { S.jahr = Number(v); S.auswahl = null; zeichnen(); } });
  DK.schnitt(bFilter, "Vertriebsgebiet", "dropdown", {
    breite: 170, optionen: [["alle", "Alle Gebiete"], ...GEBIETE.map(g => [g, g])], wert: S.gebiet,
    onChange: v => { S.gebiet = v; S.auswahl = null; zeichnen(); } });

  /* ---------- Zeichnen ---------- */
  function zeichnen() {
    const d = daten();
    const v = DK.visual(bTab, { titel: `Top-Ten-Kunden nach Umsatz ${S.jahr}`, einheit: "Tsd. €, Anteil in %",
      botschaft: botschaft(d, bTab.clientWidth || 695) });
    const zeilen = tabellenZeilen(d);
    const t = DK.matrix(v.flaeche, { spalten: SPALTEN, zeilen, zeilenhoehe: 22,
      sortierung: S.sort, onSort: sortieren, auswahl: S.auswahl,
      onClick: k => { S.auswahl = S.auswahl === k ? null : k; zeichnen(); },
      tooltip: z => tooltipKunde(z.r) });
    // Summenzeilen: „Übrige Kunden“ ohne Fettschrift, Gesamtzeile ohne Anteilsbalken (immer 100 %)
    const tr = t.querySelectorAll("tbody tr");
    zeilen.forEach((z, i) => { if (z.rest) tr[i].classList.add("dk-rest"); });
    const letzte = tr[tr.length - 1];
    letzte.querySelectorAll("td:last-child rect").forEach(r => r.remove());
    const txt = letzte.querySelector("td:last-child text");
    if (txt) txt.textContent = "100" + NBSP + "%";
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  /* ---------- Lernplattform: Designregeln, Nachbau, Tabellen, CSV ---------- */
  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "v-tabelle", anker: "links", versatz: [692, 21], regel: "SAY – Botschaft vermitteln", titel: "Kernaussage über der Tabelle",
        text: "Unter dem Titel steht, welchen Anteil die zehn größten Kunden am Umsatz haben, wie groß der größte Kunde ist und wo der stärkste Rückgang liegt – berechnet für das gewählte Jahr und Gebiet. Das Original hatte nur die Überschriften „Top-Ten-Kunden“ und „Umsatz Top-Ten-Kunden (€)“." },
      { nr: 2, ziel: "v-tabelle", anker: "links", versatz: [167, 50], regel: "CONDENSE – Doppeltes zusammenführen", titel: "Eine Tabelle statt Tabelle und Diagramm",
        text: "Das Original zeigte dieselben 20 Zahlen zweimal – als Tabelle und als gruppiertes Balkendiagramm. Jetzt steht alles in einer Zeile je Kunde: Werte, Abweichung mit Balken und Umsatzanteil mit Balken." },
      { nr: 3, ziel: "sp-anteil", versatz: [-6, -2], regel: "EXPRESS – Passende Darstellung", titel: "Anteil statt doppelter Balken",
        text: "Die Größe eines Kunden zeigt der Anteil am Umsatz als Balken ab null; die Summenzeilen machen die Konzentration sichtbar (Top 10 gegen übrige Kunden). Die Veränderung zeigt der Abweichungsbalken ΔVJ – im Original musste man sie aus zwei Balken je Kunde selbst ablesen." },
      { nr: 4, ziel: "sp-dvj", versatz: [-30, -2], regel: "UNIFY – Farbe nach Wirkung", titel: "Blaugrün und Rot nur für Abweichungen",
        text: "Das Original färbte Ist rot und Vorjahr blau – Rot stand also für ein Szenario, nicht für eine schlechte Entwicklung. Jetzt bleibt Rot den Rückgängen vorbehalten, Blaugrün den Zuwächsen; Werte stehen in Anthrazit." },
      { nr: 5, ziel: "sp-ist", versatz: [33, -2], regel: "STRUCTURE – Inhalte ordnen", titel: "Rang nach dem Ist",
        text: "Die Rangfolge richtet sich nach dem Umsatz des gewählten Jahres. Das Original sortierte nach dem Vorjahr, sodass z. B. der fünftgrößte Kunde mit mehr Umsatz hinter dem vierten stand. Der Tooltip nennt den Vorjahresrang; ein Klick auf einen Spaltenkopf sortiert um." },
      { nr: 6, ziel: "v-tabelle", anker: "links", versatz: [231, 50], regel: "SIMPLIFY – Einheitliche Zahlen", titel: "Tsd. € mit einer Nachkommastelle",
        text: "Statt sechsstelliger Eurobeträge („164.674“) stehen Tausend Euro mit einer Nachkommastelle; die Einheit steht einmal im Titel. Abgeschnittene Kundennamen („Hamburg-…“) und die Legende fern vom Diagramm entfallen." },
      { nr: 7, ziel: "filter", anker: "links", versatz: [300, 6], regel: "CONDENSE – Filtern statt vervielfachen", titel: "Jahr und Vertriebsgebiet als Datenschnitte",
        text: "Die Rangfolge wird für jede Auswahl neu berechnet: Im Vertriebsgebiet Ost erscheinen andere Kunden als bundesweit. Eine Top-Ten-Liste ist immer eine Momentaufnahme – deshalb steht das Jahr im Titel." },
      { nr: 8, ziel: "v-tabelle", anker: "links", versatz: [40, 290], regel: "CHECK – Visuelle Integrität", titel: "Namen der Kunden erfunden",
        text: "Das Original nannte reale Versicherungsunternehmen. Die Umsätze der zehn Kunden sind unverändert, die Namen erfunden; 38 weitere erfundene Kunden machen Anteil und Datenschnitte rechenbar." },
    ],
    nachbauIntro: "Standard-Visuals von Power BI Desktop. Seitengröße benutzerdefiniert 727 × 460 px. Schrift Arial: Tabelle 10,5 pt, Visualtitel 12 pt. Das Berichtsdesign (JSON) setzt Farben und Schriften. Datenmodell: Tabelle Umsatz (Kunde, Vertriebsgebiet, Jahr, Umsatz) wie in der CSV-Datei.",
    nachbau: [
      { id: "A", ziel: "v-tabelle", versatz: [0, 0], titel: "Top-Ten-Kunden", visual: "Tabelle",
        felder: "Kunde; Measures Rang = RANKX(ALLSELECTED(Umsatz[Kunde]); [IST]), VJ, IST, ΔVJ = [IST] − [VJ], ΔVJ % = DIVIDE([ΔVJ]; [VJ]), Anteil = DIVIDE([IST]; CALCULATE([IST]; ALLSELECTED(Umsatz[Kunde])))",
        format: "Filter auf Kunde: Top N = 10 nach [IST]; Werte in Tsd. € mit 1 Dezimalstelle; bedingte Formatierung: Datenbalken für ΔVJ (positiv #00806B, negativ #C62828, Achse Mitte) und für Anteil (#3A3F44, Minimum 0, Maximum 1)",
        hinweis: "Die Zeilen „Übrige Kunden“ und „Alle Kunden“ entstehen in Power BI über eine Hilfstabelle mit den Einträgen Top 10 und Übrige oder als zweite Tabelle darunter; die Gesamtsumme der Tabelle zeigt nur die Top 10." },
      { id: "B", ziel: "filter", anker: "links", versatz: [80, 6], titel: "Datenschnitte", visual: "Datenschnitt (2×)",
        felder: "Jahr als Kacheln (Einzelauswahl), Vertriebsgebiet als Dropdown; VJ = CALCULATE([IST]; SAMEPERIODLASTYEAR(Datum[Datum])) oder über die Jahresspalte",
        format: "Ausgewählt #3A3F44 mit weißer Schrift, sonst weiß mit Rahmen #9A9A9A" },
      { id: "C", ziel: "v-tabelle", anker: "links", versatz: [692, 21], titel: "Kernaussage", visual: "Textfeld mit dynamischem Wert",
        felder: "Text-Measure aus [Anteil] der Top 10, dem größten Kunden und dem Kunden mit dem kleinsten [ΔVJ %]",
        format: "10,5 pt, #4D4D4D" },
    ],
    theme: DK.thema(),
    csv: { name: "top_ten_kunden_daten.csv", text: () => {
      const k = ["Kunde;Vertriebsgebiet;Jahr;Umsatz_EUR"];
      K.forEach(x => JAHRE.forEach((y, i) => k.push([x.name, x.gebiet, y, x.u[i]].join(";"))));
      return k.join("\r\n"); } },
    tabellen: () => {
      const d = daten();
      const zeile = r => [String(r.rang), r.k.name, r.k.gebiet, tsd(r.vj), tsd(r.ist), delta(r.dvj / 1000, 1), pz(r.dvjp), zahl(r.anteil * 100, 1)];
      return [{ titel: `Top-Ten-Kunden ${S.jahr}, ${gebietText()} (Tsd. €, Anteil in %)`,
        kopf: ["Rang", "Kunde", "Gebiet", "VJ", "IST", "ΔVJ", "ΔVJ %", "Anteil"],
        zeilen: [...d.top.map(zeile),
                 ["", `Summe Top ${d.top.length}`, "", tsd(d.sTop.vj), tsd(d.sTop.ist), delta(d.sTop.dvj / 1000, 1), pz(d.sTop.dvjp), zahl(d.sTop.anteil * 100, 1)],
                 ["", `Übrige ${d.rest.length} Kunden`, "", tsd(d.sRest.vj), tsd(d.sRest.ist), delta(d.sRest.dvj / 1000, 1), pz(d.sRest.dvjp), zahl(d.sRest.anteil * 100, 1)],
                 ["", "Alle Kunden", "", tsd(d.ges.vj), tsd(d.ges.ist), delta(d.ges.dvj / 1000, 1), pz(d.ges.dvjp), "100,0"]] }];
    },
  });
  zeichnen();
})();
