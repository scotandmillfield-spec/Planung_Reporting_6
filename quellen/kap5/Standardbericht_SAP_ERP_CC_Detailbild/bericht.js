/* Abb. 5.73 „Standardbericht SAP ERP CC (Detailbild)“: Bericht „Kostenstellen: Ist/Soll/Abweichung“, softwareneutral
   nachgebaut. Einzelvisual 727 x 726 px = 110 x 109,8 mm. Daten: kostenstellen.json (daten_kostenstellen.py).
   Gehört zur Selektionsmaske Abb. 5.72: Startzustand = deren Vorbelegung (Kostenrechnungskreis 1000, Geschäftsjahr 2026,
   Perioden 1 bis 12, Version 0, Kostenstelle 1000, alle Kostenarten); die Datenschnitte entsprechen den Feldern der Maske.
   Aufbau wie im Original: Berichtskopf mit der Selektion, Liste der Kostenarten mit Ist- und Sollkosten, Abweichung absolut
   und in %, Summen Belastung, Entlastung und Über-/Unterdeckung. Abweichung = Ist − Soll; negativ = unter Soll = günstig.
   Klick auf eine Zeile hebt sie hervor, Klick auf einen Spaltenkopf sortiert die Belastung, Esc hebt auf. */
(() => {
  "use strict";
  const { zahl, delta, NBSP, el, tw } = DK;
  const D = DATA, J = D.jahr;
  const KST = D.kostenstellen, KA = D.kostenarten;
  const MLANG = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
  const eur = c => zahl(c / 100, 0), eur2 = c => zahl(c / 100, 2);
  const pz = v => delta(v, 1) + NBSP + "%";
  const passt = (k, breite) => k.find(t => tw(t) <= breite) || k[k.length - 1];
  const GRUPPEN = [["alle", "Alle"], ["P", "Primärkosten"], ["S", "Sekundärkosten"]];
  const PLAN_574 = ["470000", "471000", "473000", "476000", "476100", "476500", "476900"];   // Plankosten fix in Abb. 5.74

  /* ---------- Zustand (Start = Vorbelegung der Selektionsmaske Abb. 5.72) ---------- */
  const S = { kst: 0, von: 1, bis: 12, gruppe: "alle", auswahl: null, sort: null };
  addEventListener("keydown", e => { if (e.key === "Escape" && S.auswahl !== null) { S.auswahl = null; zeichnen(); } });

  /* ---------- Layout ---------- */
  const H = 726;
  DK.init({ titel: "Kostenstellen: Ist/Soll/Abweichung", breite: 727, hoehe: H });
  const bTitel = DK.box("v-titel", 16, 8, 695, 46);
  const bFilter = DK.box("filter", 16, 60, 695, 50, "dk-filter");
  DK.haarlinie(116);
  const bKopf = DK.box("berichtskopf", 16, 124, 695, 38);
  const bTab = DK.box("v-tabelle", 16, 170, 695, H - 178);
  el("style", {}, document.head, `
    #berichtskopf { display: grid; grid-template-columns: 300px 1fr; row-gap: 2px; line-height: 18px; }
    #berichtskopf .bk-l { color: var(--muted); }
    #berichtskopf b { font-weight: normal; color: var(--text); }
    #v-tabelle .dk-matrix td:nth-child(2) { color: var(--text); }
    #v-tabelle tr.dk-summe td:nth-child(2) { font-weight: bold; }`);

  /* ---------- Berechnung ---------- */
  function zeilen() {
    const rows = KA.map((k, i) => ({ i, nr: k[0], name: k[1], gruppe: k[2], info: k[3], ist: 0, soll: 0, istGebucht: false, vorhanden: false, per: [] }));
    D.werte.forEach(([kst, ka, p, ist, soll]) => {
      if (kst !== S.kst) return;
      const r = rows[ka];
      r.vorhanden = true;
      if (p < S.von || p > S.bis) return;
      if (ist !== null) { r.ist += ist; r.istGebucht = true; }
      r.soll += soll;
      r.per.push([p, ist, soll]);
    });
    return rows.filter(r => r.vorhanden && (S.gruppe === "alle" || r.gruppe === S.gruppe)).map(r => {
      r.abw = r.ist - r.soll; r.proz = r.soll ? r.abw / Math.abs(r.soll) * 100 : null;
      r.entlastung = r.soll < 0 || r.ist < 0;
      return r;
    });
  }
  const summe = rows => { const s = { ist: 0, soll: 0 }; rows.forEach(r => { s.ist += r.ist; s.soll += r.soll; });
    s.abw = s.ist - s.soll; s.proz = s.soll ? s.abw / Math.abs(s.soll) * 100 : null; return s; };
  function bloecke() {
    const rows = zeilen(), bel = rows.filter(r => !r.entlastung), ent = rows.filter(r => r.entlastung);
    if (S.sort) {
      const k = S.sort.key, f = r => (k === "nr" ? r.nr : k === "name" ? r.name : r[k] ?? -Infinity);
      bel.sort((a, b) => { const x = f(a), y = f(b); const c = typeof x === "string" ? x.localeCompare(y, "de") : x - y; return (S.sort.ab ? -c : c) || a.i - b.i; });
    }
    return { bel, ent, sBel: summe(bel), sEnt: summe(ent), sGes: summe(rows) };
  }

  /* ---------- Datenschnitte (Felder der Selektionsmaske Abb. 5.72) ---------- */
  DK.schnitt(bFilter, "Kostenstelle", "dropdown", { optionen: KST.map((k, i) => [String(i), k[0] + " " + k[1]]), wert: "0", breite: 210,
    onChange: v => { S.kst = Number(v); S.auswahl = null; zeichnen(); } });
  const perOpt = Array.from({ length: 12 }, (_, i) => [String(i + 1), String(i + 1)]);
  const selVon = DK.schnitt(bFilter, "Von Periode", "dropdown", { optionen: perOpt, wert: "1", breite: 76,
    onChange: v => { S.von = Number(v); if (S.von > S.bis) { S.bis = S.von; selBis.value = String(S.bis); } zeichnen(); } });
  const selBis = DK.schnitt(bFilter, "Bis Periode", "dropdown", { optionen: perOpt, wert: "12", breite: 76,
    onChange: v => { S.bis = Number(v); if (S.bis < S.von) { S.von = S.bis; selVon.value = String(S.von); } zeichnen(); } });
  DK.schnitt(bFilter, "Kostenartengruppe", "dropdown", { optionen: GRUPPEN, wert: "alle", breite: 150,
    onChange: v => { S.gruppe = v; S.auswahl = null; zeichnen(); } });

  /* ---------- Tabelle ---------- */
  const SPALTEN = [
    { key: "nr", titel: "Kostenart", breite: 62 },
    { key: "name", titel: "Bezeichnung", typ: "text", breite: 222 },
    { key: "ist", titel: "Istkosten", id: "sp-ist", breite: 90, fmt: eur },
    { key: "soll", titel: "Sollkosten", id: "sp-soll", breite: 92, fmt: eur },
    { key: "abw", titel: "Abweichung", id: "sp-abw", typ: "delta", richtung: -1, nk: 0, breite: 158, textBreite: 80 },
    { key: "proz", titel: "Abw. in %", id: "sp-proz", breite: 71, fmt: v => delta(v, 1) },
  ];
  const zeitraum = () => (S.von === S.bis ? `Periode ${S.von}/${J}` : `Perioden ${S.von} bis ${S.bis}/${J}`);
  function tipZeile(r) {
    const k = KST[S.kst], w = r.abw === 0 ? "keine Abweichung" : (r.abw < 0) ? "unter Soll – günstig" : "über Soll – ungünstig";
    const z = [`${r.nr} ${r.name}`, `${k[0]} ${k[1]}, ${zeitraum()}`,
      `Ist ${r.istGebucht ? eur2(r.ist) + " €" : "keine Buchung"} · Soll ${eur2(r.soll)} €`,
      `Abweichung ${delta(r.abw / 100, 2)} €${r.proz === null ? "" : " (" + pz(r.proz) + ")"}, ${w}`];
    if (r.info) z.push(r.info);
    if (S.kst === 0 && PLAN_574.includes(r.nr)) z.push("Soll = Plankosten fix der Kostenartenplanung (Abb. 5.74), anteilig je Periode");
    z.push(S.auswahl === r.nr ? "Klick hebt die Hervorhebung auf" : "Klick hebt die Kostenart hervor");
    return z;
  }
  function tabelle(B) {
    const z = [];
    const zeile = r => ({ key: r.nr, label: r.nr, r, werte: { name: r.name, ist: r.istGebucht ? r.ist : null, soll: r.soll, abw: r.abw / 100, proz: r.proz } });
    const sum = (key, name, s) => ({ key, label: "", summe: true, trenner: true, werte: { name, ist: s.ist, soll: s.soll, abw: s.abw / 100, proz: s.proz } });
    B.bel.forEach(r => z.push(zeile(r)));
    if (B.bel.length) z.push(sum("s-bel", "Belastung", B.sBel));
    B.ent.forEach(r => z.push(zeile(r)));
    if (B.ent.length) z.push(sum("s-ent", "Entlastung", B.sEnt));
    if (B.bel.length && B.ent.length) z.push(sum("s-ges", "Über-/Unterdeckung", B.sGes));
    DK.matrix(bTab, { spalten: SPALTEN, zeilen: z, auswahl: S.auswahl,
      onClick: key => { S.auswahl = S.auswahl === key ? null : key; zeichnen(); },
      tooltip: zz => tipZeile(zz.r),
      sortierung: S.sort, onSort: key => { S.sort = S.sort && S.sort.key === key ? (S.sort.ab ? { key, ab: false } : null) : { key, ab: true }; zeichnen(); } });
  }

  /* ---------- Botschaft ---------- */
  function botschaft(B) {
    if (S.auswahl !== null) {
      const r = [...B.bel, ...B.ent].find(x => x.nr === S.auswahl);
      if (r) return passt([`${r.nr} ${r.name}: Ist ${eur(r.ist)} €, Soll ${eur(r.soll)} €, Abweichung ${delta(r.abw / 100, 0)} €${r.proz === null ? "" : " (" + pz(r.proz) + ")"}`,
        `${r.name}: Abweichung ${delta(r.abw / 100, 0)} €`], 690);
    }
    const s = B.sBel;
    if (!B.bel.length) return "Keine Belastung in dieser Auswahl";
    const top = B.bel.slice().sort((a, b) => Math.abs(b.abw) - Math.abs(a.abw))[0];
    const lage = s.abw <= 0 ? "unter" : "über";
    return passt([`Istkosten ${eur(s.ist)} € liegen ${eur(Math.abs(s.abw))} € (${zahl(Math.abs(s.proz), 1)} %) ${lage} Soll, größter Beitrag: ${top.name}`,
      `Istkosten ${eur(Math.abs(s.abw))} € (${zahl(Math.abs(s.proz), 1)} %) ${lage} Soll, größter Beitrag: ${top.name}`,
      `Istkosten ${eur(Math.abs(s.abw))} € ${lage} Soll`], 690);
  }

  /* ---------- Zeichnen ---------- */
  function zeichnen() {
    const B = bloecke(), k = KST[S.kst];
    DK.visual(bTitel, { titel: "Kostenstellen: Ist/Soll/Abweichung", einheit: "€", botschaft: botschaft(B) });
    bKopf.textContent = "";
    [["Kostenrechnungskreis", `${D.krk[0]} ${D.krk[1]}`], ["Verantwortlich", k[2]], ["Version", `${D.version[0]} ${D.version[1]}`],
     ["Berichtszeitraum", `${zeitraum()} · Stand ${D.stand}`]].forEach(([l, w]) => {
      const d = el("div", { class: "bk-l" }, bKopf, l + " ");
      el("b", {}, d, w);
    });
    tabelle(B);
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  /* ---------- Lernplattform ---------- */
  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "v-titel", anker: "links", versatz: [355, 0], regel: "SAY – Botschaft vermitteln", titel: "Aussage über der Liste",
        text: "Unter dem Berichtsnamen steht, wie weit die Istkosten vom Soll abweichen und welche Kostenart am meisten beiträgt – bei den Zentralen Diensten die kalkulatorischen Zinsen. Das Original zeigte nur die Liste." },
      { nr: 2, ziel: "sp-abw", anker: "links", versatz: [156, 45], regel: "EXPRESS – Abweichung nach Wirkung", titel: "Balken statt Zahlenkolonne",
        text: "Die Abweichung Ist − Soll steht als Zahl mit Balken: Blaugrün, wenn die Istkosten unter dem Soll liegen, Rot darüber. Das Original schrieb das Minus nachgestellt („200,20-“) und hob nichts hervor." },
      { nr: 3, ziel: "v-tabelle", anker: "links", versatz: [272, 3], regel: "UNIFY – Klartext", titel: "Lesbare Kostenarten",
        text: "Abgeschnittene Texte sind ausgeschrieben („Tarifl. Jahresleist“ → Tarifliche Jahresleistung, „Postkosten ohne Tel“ → Postkosten (ohne Telefon)); „DILV“ und „IILV“ heißen „Verrechnung …“ – direkte bzw. indirekte innerbetriebliche Leistungsverrechnung, erklärt im Tooltip." },
      { nr: 4, ziel: "berichtskopf", anker: "links", versatz: [640, -4], regel: "STRUCTURE – Selektion im Kopf", titel: "Berichtskopf aus der Selektion",
        text: "Kopf und Datenschnitte zeigen die Selektion aus Abb. 5.72: Kostenrechnungskreis, Kostenstelle mit Verantwortlicher, Version und Berichtszeitraum. Seiten- und Spaltenzähler („Seiten 2/4“, „Spalte 1/6“) des Listenformats entfallen; der Bericht steht vollständig auf einer Seite." },
      { nr: 5, ziel: "v-tabelle", anker: "links", versatz: [52, 465], regel: "CHECK – Summen aus den Zeilen", titel: "Belastung vollständig",
        text: "Das Original zeigte Seite 2 von 4: Die Belastung von 627.269 € enthielt Kostenarten der Seite 1. Die Differenz steht jetzt als 430000 Gehälter, damit Belastung, Entlastung und Über-/Unterdeckung aus den Zeilen folgen. Zeilen ohne Werte entfallen." },
      { nr: 6, ziel: "v-tabelle", anker: "links", versatz: [52, 507], regel: "CONDENSE – Ganze Euro", titel: "Cent im Tooltip",
        text: "Die Liste zeigt ganze Euro; die Werte auf den Cent stehen im Tooltip. Das Original führte zwei Nachkommastellen bei Beträgen bis über eine Million." },
      { nr: 7, ziel: "filter", anker: "links", versatz: [600, -2], regel: "CONDENSE – Selektion ändern", titel: "Datenschnitte statt neuer Selektion",
        text: "Kostenstelle, Perioden und Kostenartengruppe lassen sich direkt im Bericht ändern – im Original führte jede Änderung über die Selektionsmaske. Klick auf eine Zeile hebt sie hervor, Klick auf einen Spaltenkopf sortiert die Belastung." },
      { nr: 8, ziel: "v-titel", anker: "links", versatz: [702, 4], regel: "SIMPLIFY – Softwareneutral", titel: "Ohne Programmoberfläche",
        text: "Menü- und Symbolleisten, Statuszeile, Taskleiste, Bildlaufleiste, Logo sowie die blauen und gelben Flächen entfallen. Kostenstelle „Corporate Services“ heißt Zentrale Dienste, der Name des Verantwortlichen ist ersetzt, das Jahr 2008 wird zu 2026." },
    ],
    nachbauIntro: "Seitengröße 727 × 726 px (110 mm breit), Schrift Arial: Tabelle 10,5 pt, Titel 12 pt. Datenmodell: Faktentabelle Kostenstellenrechnung (Kostenrechnungskreis, Geschäftsjahr, Version, Kostenstelle, Kostenart, Periode, Istkosten, Sollkosten) mit Dimensionen Kostenstelle (Text, Verantwortlich) und Kostenart (Text, Gruppe primär/sekundär); Spalte „Block“ (Belastung/Entlastung) aus dem Vorzeichen.",
    nachbau: [
      { id: "A", ziel: "v-tabelle", anker: "links", versatz: [272, 3], titel: "Kostenartenliste", visual: "Matrix",
        felder: "Zeilen: Block, Kostenart, Bezeichnung; Werte: Istkosten = SUM(KSt[Istkosten]); Sollkosten = SUM(KSt[Sollkosten]); Abweichung = [Istkosten] − [Sollkosten]; Abw. in % = DIVIDE([Abweichung]; ABS([Sollkosten]))",
        format: "Layout tabellarisch, Zwischensummen je Block („Belastung“, „Entlastung“), Gesamtsumme „Über-/Unterdeckung“; Abweichung mit Datenbalken (negativ #00806B, positiv #C62828, Achse Mitte); Zahlenformat #.##0",
        hinweis: "Leere Istwerte erscheinen als „–“ (Measure mit IF(ISBLANK(…); BLANK(); …) und Formatzeichenfolge)." },
      { id: "B", ziel: "filter", anker: "links", versatz: [130, -2], titel: "Selektion", visual: "Datenschnitt (4×)",
        felder: "Kostenstelle (Dropdown, Einzelauswahl), Periode von/bis (Datenschnitt „Zwischen“ oder zwei Dropdowns), Kostenartengruppe",
        format: "Ausgewählt #3A3F44; Vorbelegung wie die Selektionsmaske (Abb. 5.72) über gespeicherte Lesezeichen oder Berichts-URL-Filter" },
      { id: "C", ziel: "berichtskopf", anker: "links", versatz: [640, -4], titel: "Berichtskopf", visual: "Karte (neu) bzw. Textfeld mit dynamischem Wert",
        felder: "Text = \"Verantwortlich \" & SELECTEDVALUE(Kostenstelle[Verantwortlich]); Berichtszeitraum aus MIN/MAX(Periode)",
        format: "Beschriftung #4D4D4D, Wert #1A1A1A, 10,5 pt, ohne Hintergrund und Rahmen" },
    ],
    theme: DK.thema(),
    csv: { name: "kostenstellen_ist_soll.csv", text: () => {
      const z = ["Kostenrechnungskreis;Geschaeftsjahr;Version;Kostenstelle;Kostenstelle_Text;Kostenart;Kostenart_Text;Kostenartengruppe;Periode;Istkosten_EUR;Sollkosten_EUR"];
      D.werte.forEach(([kst, ka, p, ist, soll]) => z.push([D.krk[0], J, D.version[0], KST[kst][0], KST[kst][1], KA[ka][0], KA[ka][1],
        KA[ka][2] === "P" ? "Primärkosten" : "Sekundärkosten", p, ist === null ? "" : (ist / 100).toFixed(2).replace(".", ","), (soll / 100).toFixed(2).replace(".", ",")].join(";")));
      return z.join("\r\n"); } },
    tabellen: () => {
      const B = bloecke(), k = KST[S.kst];
      const z = r => [r.nr, r.name, r.istGebucht ? eur2(r.ist) : "–", eur2(r.soll), delta(r.abw / 100, 2), r.proz === null ? "–" : delta(r.proz, 2)];
      const s = (n, x) => ["", n, eur2(x.ist), eur2(x.soll), delta(x.abw / 100, 2), x.proz === null ? "–" : delta(x.proz, 2)];
      const rows = [...B.bel.map(z), s("Belastung", B.sBel), ...B.ent.map(z)];
      if (B.ent.length) rows.push(s("Entlastung", B.sEnt), s("Über-/Unterdeckung", B.sGes));
      const per = Array.from({ length: S.bis - S.von + 1 }, (_, i) => S.von + i);
      const perZeilen = per.map(p => { let ist = 0, soll = 0; D.werte.forEach(w => { if (w[0] === S.kst && w[2] === p && !(w[4] < 0)) { ist += w[3] || 0; soll += w[4]; } });
        return [String(p), MLANG[p - 1], eur2(ist), eur2(soll), delta((ist - soll) / 100, 2)]; });
      return [
        { titel: `${k[0]} ${k[1]}, ${zeitraum()}, Werte in €`, kopf: ["Kostenart", "Bezeichnung", "Istkosten", "Sollkosten", "Abweichung", "Abw. in %"], zeilen: rows },
        { titel: "Belastung je Periode in € (alle Kostenarten der Kostenstelle)", kopf: ["Periode", "Monat", "Istkosten", "Sollkosten", "Abweichung"], zeilen: perZeilen },
      ];
    },
  });
  zeichnen();
})();
