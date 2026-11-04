/* Einzelvisual „Zielerreichungsbericht“ (Abb. 3.18): Geschäftszahlen und Personalbestand mit Quote und Abweichung
   zum Plan p. a. und zum Vorjahr p. a.
   Seite 727 x 408 px = 110 x 61,8 mm. Daten: ziele.json (daten_ziele.py) – neun Kennzahlen des Originals; Gewinn und
   Umsatzrendite werden aus Betriebsertrag und Betriebsaufwand gerechnet. Eine Tabelle mit zwei Abschnitten
   (Geschäftszahlen in Mio. €, Personalbestand in FTE) und zwei Spaltengruppen (Plan, Vorjahr). Quote und Abweichung nach
   Wirkung gefärbt; Investitionen, Bilanzsumme und Personalbestände ohne Wertung. Ohne Balken: Die Zeilen haben
   verschiedene Einheiten, ein gemeinsamer Maßstab ist nicht möglich. Klick auf eine Zeile hebt sie hervor, Esc hebt auf;
   die Quote-Spalten sortieren innerhalb der Abschnitte. */
(() => {
  "use strict";
  const { zahl, delta, NBSP, el, wirkung } = DK;
  const JAHR = DATA.jahr;
  const K = Object.fromEntries(DATA.kennzahlen.map(([name, ab, art, ri, pl, ist, vj]) => [name, { name, ab, art, ri, pl, ist, vj }]));
  const pz = (v, nk = 1) => zahl(v * 100, nk) + NBSP + "%";
  const und = l => (l.length < 2 ? l.join("") : l.slice(0, -1).join(", ") + " und " + l[l.length - 1]);

  /* ---------- Kennzahlen (Reihenfolge des Originals) ---------- */
  function kennzahlen() {
    const e = K.Betriebsertrag, a = K.Betriebsaufwand;
    const gewinn = { name: "Gewinn", ab: "GZ", art: "fluss", ri: 1, pl: e.pl - a.pl, ist: e.ist - a.ist, vj: e.vj - a.vj,
                     hinweis: "Betriebsertrag − Betriebsaufwand" };
    const rendite = { name: "Umsatzrendite", ab: "GZ", art: "fluss", ri: 1, quote: true, pl: gewinn.pl / e.pl,
                      ist: gewinn.ist / e.ist, vj: gewinn.vj / e.vj, hinweis: "Gewinn ÷ Betriebsertrag; Abweichungen in Prozentpunkten" };
    const liste = [e, a, gewinn, rendite, K.Investitionen, K["Free Cashflow"], K.Bilanzsumme, K.Eigenkapital,
                   K.Konzern, K.Stammhaus, K.Leihpersonal];
    return liste.map((k, i) => {
      const nk = k.quote ? 1 : 0;
      // Abweichung bei der Umsatzrendite in %-Punkten (gerundet wie angezeigt), sonst in Mio. € bzw. FTE
      const d = (x, y) => (k.quote ? (x - y) * 100 : x - y);
      return { ...k, i, nk, qpl: k.ist / k.pl, dpl: d(k.ist, k.pl), qvj: k.ist / k.vj, dvj: d(k.ist, k.vj) };
    });
  }
  const ABSCHNITT = { GZ: "Geschäftszahlen, Mio. €",
                      PB: "Personalbestand, FTE (Konzern und Stammhaus ohne Leihpersonal)" };
  const wert = (k, v) => (k.quote ? zahl(v * 100, 1) + NBSP + "%" : zahl(v, 0));
  const abw = (k, v) => (k.quote ? delta(v, 1, NBSP + "%-Pkt.") : delta(v, 0));

  /* ---------- Zustand ---------- */
  const S = { sort: null, auswahl: null };
  addEventListener("keydown", e => { if (e.key === "Escape" && S.auswahl != null) { S.auswahl = null; zeichnen(); } });
  const SORTIERBAR = ["zeile", "qpl", "qvj"];
  function sortieren(key) {
    if (!SORTIERBAR.includes(key)) return;                     // gemischte Einheiten: nur die Quoten sortieren
    if (key === "zeile") S.sort = null;
    else if (S.sort && S.sort.key === key) S.sort = { key, ab: !S.sort.ab };
    else S.sort = { key, ab: false };                           // zuerst die niedrigste Quote
    zeichnen();
  }
  function geordnet(rows) {
    const s = S.sort;
    if (!s) return rows;
    return rows.slice().sort((a, b) => ((s.ab ? -1 : 1) * (a[s.key] - b[s.key])) || a.i - b.i);
  }

  /* ---------- Layout ---------- */
  DK.init({ titel: "Zielerreichungsbericht", breite: 727, hoehe: 408 });
  const bTab = DK.box("v-tabelle", 16, 10, 695, 390);
  DK.el("style", {}, document.head, `
    #v-tabelle .dk-matrix tr.gk-gruppe th { border-bottom: none; padding: 0 0 2px 14px; text-align: center; color: var(--text); }
    #v-tabelle .dk-matrix tr.gk-gruppe th span { display: block; border-bottom: 1px solid #9A9A9A; padding-bottom: 3px; }
    #v-tabelle .dk-matrix thead tr:last-child th { vertical-align: bottom; padding-bottom: 11px; }
    #v-tabelle .dk-matrix th.sz { position: relative; }
    #v-tabelle .dk-matrix th.sz::after { content: ""; position: absolute; left: 12px; right: 0; bottom: 3px; height: 5px; }
    #v-tabelle .dk-matrix th.sz-ist::after { background: var(--ac); }
    #v-tabelle .dk-matrix th.sz-vj::after { background: var(--py); }
    #v-tabelle .dk-matrix th.sz-pl::after { background: #FFFFFF; box-shadow: inset 0 0 0 1px var(--ac); }
    #v-tabelle .dk-matrix th.nicht-sortierbar { cursor: default; }
    #v-tabelle .dk-matrix th.nicht-sortierbar:hover { color: var(--muted); text-decoration: none; }
    #v-tabelle .dk-matrix tr.abschnitt td { font-weight: bold; text-align: left; padding: 0; height: 26px;
      vertical-align: bottom; border-bottom: 1px solid #9A9A9A; }`);

  const SPALTEN = [
    { key: "zeile", id: "sp-zeile", titel: "", breite: 124 },
    { key: "pl", id: "sp-pl", titel: "Plan p. a.", breite: 80, sz: "pl" },
    { key: "ist", id: "sp-ist", titel: "Ist kum.", breite: 70, sz: "ist" },
    { key: "qpl", id: "sp-qpl", titel: "Quote PL", breite: 74, farbe: "dpl" },
    { key: "dpl", id: "sp-dpl", titel: "ΔPL", breite: 90, farbe: "dpl" },
    { key: "vj", id: "sp-vj", titel: "Ist VJ p. a.", breite: 84, sz: "vj" },
    { key: "qvj", id: "sp-qvj", titel: "Quote VJ", breite: 74, farbe: "dvj" },
    { key: "dvj", id: "sp-dvj", titel: "ΔVJ", breite: 90, farbe: "dvj" },
  ];
  const FMT = { pl: wert, ist: wert, vj: wert, qpl: (k, v) => pz(v), qvj: (k, v) => pz(v), dpl: abw, dvj: abw };

  /* ---------- Tooltip (DK.tooltip ist nicht exportiert) ---------- */
  const tip = document.querySelector(".dk-tooltip");
  function tipp(ziel, zeilenFn) {
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
  const WTEXT = { gut: "günstig", schlecht: "ungünstig", neutral: "ohne Wertung" };
  const einheit = k => (k.quote ? "" : k.ab === "GZ" ? " Mio. €" : " FTE");
  function tooltipKennzahl(k) {
    const w = x => (k.ri ? WTEXT[wirkung(x, k.ri, k.nk)] : "ohne Wertung");
    const t = [k.name + (k.ab === "PB" ? ` (Personalbestand${k.name === "Leihpersonal" ? "" : ", ohne Leihpersonal"})` : ""),
      `Plan p. a. ${wert(k, k.pl)} · Ist kum. ${wert(k, k.ist)}${einheit(k)}`,
      `Quote PL ${pz(k.qpl)} · ΔPL ${abw(k, k.dpl)} – ${w(k.dpl)}`,
      `Ist VJ p. a. ${wert(k, k.vj)} · Quote VJ ${pz(k.qvj)} · ΔVJ ${abw(k, k.dvj)} – ${w(k.dvj)}`];
    if (k.hinweis) t.push(k.hinweis);
    if (k.art === "bestand") t.push(`Bestandsgröße zum 31.12.${JAHR} bzw. 31.12.${JAHR - 1}`);
    if (k.ri < 0) t.push("Aufwand: Unterschreiten des Plans günstig");
    if (!k.ri) t.push("Ohne Wertung: Über- oder Unterschreiten kann je nach Lage günstig oder ungünstig sein");
    t.push("Klick hebt die Zeile hervor, Quote-Spalten sortieren");
    return t;
  }

  /* ---------- Kernaussage ---------- */
  function botschaft(liste, breite) {
    const g = liste.find(k => k.name === "Gewinn");
    const anfang = g.qpl >= 1 ? `Gewinnziel erreicht: Quote ${pz(g.qpl)} (${abw(g, g.dpl)} Mio. €)`
                              : `Gewinnziel zu ${pz(g.qpl)} erreicht (${abw(g, g.dpl)} Mio. €)`;
    const unter = liste.filter(k => k !== g && k.ab === "GZ" && k.ri && wirkung(k.dpl, k.ri, k.nk) === "schlecht")
      .sort((a, b) => a.qpl - b.qpl).map(k => k.name);
    const kand = [];
    for (let n = unter.length; n > 0; n--) kand.push(`${anfang} – unter Plan auch ${und(unter.slice(0, n))}`);
    kand.push(anfang);
    return kand.find(t => DK.tw(t) <= breite) || anfang;
  }

  /* ---------- Zeichnen ---------- */
  function zeichnen() {
    const liste = kennzahlen();
    const v = DK.visual(bTab, { titel: `Zielerreichung im Geschäftsjahr ${JAHR}`, einheit: "Mio. € bzw. FTE",
      botschaft: botschaft(liste, bTab.clientWidth || 695) });
    const reihe = [...geordnet(liste.filter(k => k.ab === "GZ")), ...geordnet(liste.filter(k => k.ab === "PB"))];
    const zeilen = reihe.map(k => ({ key: k.name, label: k.name, k, werte: Object.fromEntries(
      SPALTEN.slice(1).map(s => [s.key, FMT[s.key](k, k[s.key])])) }));
    const spalten = SPALTEN.map(s => (s.key === "zeile" ? s : { ...s, fmt: x => x }));
    const t = DK.matrix(v.flaeche, { spalten, zeilen, zeilenhoehe: 22, sortierung: S.sort, onSort: sortieren,
      auswahl: S.auswahl, onClick: k => { S.auswahl = S.auswahl === k ? null : k; zeichnen(); },
      tooltip: zr => tooltipKennzahl(zr.k) });
    // Spaltengruppen über den Spaltenköpfen
    const kopf = t.querySelector("thead"), gr = el("tr", { class: "gk-gruppe" });
    el("th", {}, gr, "");
    el("span", {}, el("th", { colspan: 4, id: "gr-pl" }, gr), `Plan ${JAHR}`);
    el("span", {}, el("th", { colspan: 3, id: "gr-vj" }, gr), `Vorjahr ${JAHR - 1}`);
    kopf.insertBefore(gr, kopf.firstChild);
    const ths = kopf.lastChild.querySelectorAll("th");
    SPALTEN.forEach((s, j) => {
      if (s.sz) ths[j].classList.add("sz", "sz-" + s.sz);
      if (!SORTIERBAR.includes(s.key)) { ths[j].classList.add("nicht-sortierbar"); ths[j].removeAttribute("title"); }
    });
    // Quote und Abweichung nach Wirkung färben
    const trs = [...t.querySelectorAll("tbody tr")];
    trs.forEach((tr, i) => {
      const k = reihe[i];
      SPALTEN.forEach((s, j) => {
        if (!s.farbe || !k.ri) return;
        const w = wirkung(k[s.farbe], k.ri, k.nk);
        if (w !== "neutral") tr.children[j].style.color = DK.FARBE[w];
      });
    });
    // Abschnittszeilen (kein Datensatz, nicht klickbar)
    const tb = t.querySelector("tbody");
    ["GZ", "PB"].forEach(ab => {
      const erste = trs[reihe.findIndex(k => k.ab === ab)];
      const tr = el("tr", { class: "abschnitt", id: "ab-" + ab.toLowerCase() });
      el("td", { colspan: SPALTEN.length }, tr, ABSCHNITT[ab]);
      tb.insertBefore(tr, erste);
    });
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  /* ---------- Lernplattform: Designregeln, Nachbau, Tabellen, CSV ---------- */
  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "v-tabelle", anker: "links", versatz: [444, 2], regel: "SAY – Botschaft vermitteln", titel: "Kernaussage über der Tabelle",
        text: "Unter dem Titel steht, zu welchem Grad das Gewinnziel erreicht ist und welche weiteren Ziele unter Plan blieben. Das Original zeigte nur die Überschrift „Geschäftszahlen (in Mio. €)“." },
      { nr: 2, ziel: "sp-pl", anker: "links", versatz: [12, 15], regel: "UNIFY – Semantische Notation", titel: "Szenarien und Abweichungen wie überall",
        text: "Marken unter den Spaltenköpfen kennzeichnen Plan (weiß mit Rahmen), Ist (anthrazit) und Vorjahr (hellgrau) – wie in Abb. 3.14 bis 3.17. Die Spalten „offen“ heißen jetzt ΔPL und ΔVJ: Ist minus Plan bzw. Vorjahr." },
      { nr: 3, ziel: "sp-dpl", anker: "links", versatz: [39, 80], regel: "UNIFY – Farbe nach Wirkung", titel: "Rot nur, wo es ungünstig ist",
        text: "Das Original färbte jede Quote unter 100 % rot – auch den Betriebsaufwand, der unter Plan blieb, was günstig ist. Jetzt gilt die Wirkung: Blaugrün günstig, Rot ungünstig. Investitionen, Bilanzsumme und Personalbestände stehen ohne Wertung, weil Über- und Unterschreiten je nach Lage beides sein kann." },
      { nr: 4, ziel: "v-tabelle", anker: "links", versatz: [127, 195], regel: "SIMPLIFY – Richtige Einheiten", titel: "Prozentpunkte bei der Rendite",
        text: "Die Abweichung der Umsatzrendite ist eine Differenz zweier Prozentwerte und steht deshalb in %-Punkten (−0,8 %-Pkt.); das Original zeigte „−0,8 %“. Werte ohne Nachkommastelle, Quoten mit einer, echtes Minus und Vorzeichen." },
      { nr: 5, ziel: "ab-pb", anker: "links", versatz: [494, 8], regel: "STRUCTURE – Abschnitte", titel: "Zwei Abschnitte, Einheit im Kopf",
        text: "Geschäftszahlen (Mio. €) und Personalbestand (FTE) sind getrennte Abschnitte mit Einheit in der Überschrift. „ohne Leihpersonal“ steht einmal in der Abschnittsüberschrift statt in zwei Zeilen; im Original stand die Einheit nur über den Geschäftszahlen." },
      { nr: 6, ziel: "gr-vj", anker: "links", versatz: [50, 0], regel: "STRUCTURE – Spaltengruppen", titel: "Plan und Vorjahr getrennt",
        text: "Die Spaltengruppen zeigen, wogegen gemessen wird: links das Jahresziel 2027 mit Quote und Abweichung, rechts das Vorjahr 2026. Das Ist kumuliert steht einmal und gilt für beide Vergleiche." },
      { nr: 7, ziel: "v-tabelle", anker: "links", versatz: [168, 173], regel: "CHECK – Visuelle Integrität", titel: "Abgeleitete Kennzahlen gerechnet",
        text: "Gewinn (Betriebsertrag − Betriebsaufwand) und Umsatzrendite (Gewinn ÷ Betriebsertrag) sind aus den Zeilen gerechnet, alle Quoten und Abweichungen ebenso – sie stimmen mit dem Original überein. Bestandsgrößen (Bilanzsumme, Eigenkapital, FTE) gelten zum Stichtag 31.12." },
      { nr: 8, ziel: "sp-dpl", anker: "links", versatz: [39, 1], regel: "EXPRESS – Passende Darstellung", titel: "Tabelle statt Balken",
        text: "Die Zeilen haben verschiedene Einheiten (Mio. €, %, FTE); Abweichungsbalken mit gemeinsamem Maßstab wären hier irreführend. Quote (Ist ÷ Ziel) und Abweichung stehen deshalb als Zahlen. Ein Klick auf „Quote PL“ oder „Quote VJ“ sortiert innerhalb der Abschnitte, niedrigste Quote zuerst." },
    ],
    nachbauIntro: "Standard-Visuals von Power BI Desktop. Seitengröße benutzerdefiniert 727 × 408 px. Schrift Arial: Tabelle 10,5 pt, Visualtitel 12 pt. Das Berichtsdesign (JSON) setzt Farben und Schriften. Datenmodell: Faktentabelle Kennzahlen (Kennzahl, Abschnitt, Einheit, Art, Richtung, Szenario, Jahr, Wert) wie in der CSV-Datei; Gewinn und Umsatzrendite als Measures.",
    nachbau: [
      { id: "A", ziel: "v-tabelle", versatz: [0, 0], titel: "Zielerreichung im Geschäftsjahr", visual: "Matrix",
        felder: "Zeilen: Abschnitt > Kennzahl (Sortierschlüssel wie im Original); Werte: Plan p. a., Ist kum., Ist VJ p. a. = CALCULATE(SUM(Kennzahlen[Wert]); Kennzahlen[Szenario] = …), Quote PL = DIVIDE([Ist kum.]; [Plan p. a.]), ΔPL = [Ist kum.] − [Plan p. a.], entsprechend Quote VJ und ΔVJ",
        format: "Stufenlayout aus, Abschnitte als Zeilenüberschriften ohne Zwischensummen; Werte ohne, Quoten mit einer Dezimalstelle; Schriftfarbe Quote und Δ bedingt nach dem Measure Wirkung = SIGN([ΔPL]) × MAX(Kennzahlen[Richtung]): 1 → #00806B, −1 → #C62828, 0 → Standard",
        hinweis: "Gewinn und Umsatzrendite sind keine Datensätze: Berichtszeilen-Tabelle mit diesen Zeilen anlegen und die Measures per SWITCH(SELECTEDVALUE(Zeile[Kennzahl]); \"Gewinn\"; [Ertrag] − [Aufwand]; \"Umsatzrendite\"; DIVIDE(…); …) rechnen; Format der Rendite per dynamischer Formatzeichenfolge (\"0,0 %\" bzw. \"+0,0 %-Pkt.\")." },
      { id: "B", ziel: "v-tabelle", anker: "links", versatz: [444, 2], titel: "Kernaussage", visual: "Textfeld mit dynamischem Wert",
        felder: "Text-Measure aus Quote PL und ΔPL des Gewinns sowie CONCATENATEX der Kennzahlen mit ungünstiger Abweichung",
        format: "10,5 pt, #4D4D4D" },
    ],
    theme: DK.thema(),
    csv: { name: "zielerreichung_daten.csv", text: () => {
      const k = ["Kennzahl;Abschnitt;Einheit;Art;Richtung;Szenario;Jahr;Wert"];
      DATA.kennzahlen.forEach(([name, ab, art, ri, pl, ist, vj]) =>
        [["Plan p. a.", JAHR, pl], ["Ist kumuliert", JAHR, ist], ["Ist Vorjahr p. a.", JAHR - 1, vj]].forEach(([sz, j, w]) =>
          k.push([name, ab === "GZ" ? "Geschäftszahlen" : "Personalbestand", ab === "GZ" ? "Mio. €" : "FTE", art, ri, sz, j, w].join(";"))));
      return k.join("\r\n"); } },
    tabellen: () => {
      const liste = kennzahlen();
      const reihe = [...geordnet(liste.filter(k => k.ab === "GZ")), ...geordnet(liste.filter(k => k.ab === "PB"))];
      return [{ titel: `Zielerreichung im Geschäftsjahr ${JAHR} (Mio. € bzw. FTE)`,
        kopf: ["Kennzahl", "Einheit", "Plan p. a.", "Ist kum.", "Quote PL", "ΔPL", "Ist VJ p. a.", "Quote VJ", "ΔVJ"],
        zeilen: reihe.map(k => [k.name, k.quote ? "%" : k.ab === "GZ" ? "Mio. €" : "FTE",
          ...SPALTEN.slice(1).map(s => FMT[s.key](k, k[s.key]))]) }];
    },
  });
  zeichnen();
})();
