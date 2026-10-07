/* Einzelvisual „Grafisch unterstützte Tabellendarstellung“ (Abb. 3.16).
   Seite 727 x 540 px = 110 x 81,7 mm. Daten: tabelle.json (daten_tabelle.py) – Vorjahr, Plan und Ist je Bundesland
   und Quartal in Zehntel-Mio. €; die Jahressummen sind die Werte des Originals. Eine Tabelle mit Szenario-Kennzeichnung
   im Spaltenkopf, Abweichungen und Abweichungsbalken; Datenschnitte Zeitraum und Region, keine weiteren Visuals.
   Hinweispunkt: wesentliche Planabweichung, d. h. Ist mehr als 1 % des Plans Deutschland (gleicher Zeitraum) unter Plan. */
(() => {
  "use strict";
  const { zahl, delta, NBSP } = DK;
  const JAHR = DATA.jahr, EINHEIT = DATA.einheit;
  const L = DATA.laender.map(([name, region], i) => ({ i, name, region, w: DATA.werte[i] }));
  const REGIONEN = ["Nord", "Ost", "Süd", "West"];
  const SCHWELLE = 0.01;                                   // 1 % des Plans Deutschland
  const pz = (v, nk = 0) => delta(v * 100, nk, NBSP + "%");
  const und = l => (l.length < 2 ? l.join("") : l.slice(0, -1).join(", ") + " und " + l[l.length - 1]);

  /* ---------- Zustand ---------- */
  const S = { zeitraum: "jahr", region: "alle", sort: null, auswahl: null };
  addEventListener("keydown", e => { if (e.key === "Escape" && S.auswahl != null) { S.auswahl = null; zeichnen(); } });

  /* ---------- Layout ---------- */
  DK.init({ titel: "Grafisch unterstützte Tabellendarstellung", breite: 727, hoehe: 540 });
  const bFilter = DK.box("filter", 16, 8, 695, 50, "dk-filter");
  DK.haarlinie(66);
  const bTab = DK.box("v-tabelle", 16, 76, 695, 452);
  // Szenario-Kennzeichnung unter den Spaltenköpfen (IBCS): Vorjahr hellgrau, Plan weiß mit Rahmen, Ist anthrazit
  DK.el("style", {}, document.head, `
    #v-tabelle .dk-matrix th { vertical-align: bottom; padding-bottom: 11px; }
    #sp-vj, #sp-pl, #sp-ist { position: relative; }
    #sp-vj::after, #sp-pl::after, #sp-ist::after { content: ""; position: absolute; left: 6px; right: 0; bottom: 3px; height: 5px; }
    #sp-vj::after { background: var(--py); }
    #sp-pl::after { background: #FFFFFF; box-shadow: inset 0 0 0 1px var(--ac); }
    #sp-ist::after { background: var(--ac); }
    #v-tabelle .dk-matrix td:nth-child(2) { color: var(--schlecht); text-align: center; padding: 0; font-size: 13px; }
    #v-tabelle .dk-matrix th:nth-child(2) { padding: 0; }`);

  /* ---------- Berechnungen ---------- */
  const QUARTALE = { q1: [0], q2: [1], q3: [2], q4: [3], jahr: [0, 1, 2, 3] };
  const ZEITRAUM = { q1: "1. Quartal " + JAHR, q2: "2. Quartal " + JAHR, q3: "3. Quartal " + JAHR, q4: "4. Quartal " + JAHR,
                     jahr: "Geschäftsjahr " + JAHR };
  const summe = (w, k) => QUARTALE[S.zeitraum].reduce((s, q) => s + w[k][q], 0) / 10;
  function zeilenwerte(l) {
    const vj = summe(l.w, 0), pl = summe(l.w, 1), ist = summe(l.w, 2);
    return { vj, pl, ist, dvj: ist - vj, dpl: ist - pl, dplp: (ist - pl) / pl };
  }
  function daten() {
    const alle = L.map(l => ({ l, ...zeilenwerte(l) }));
    const plDE = alle.reduce((s, r) => s + r.pl, 0);
    alle.forEach(r => { r.hinweis = r.dpl < -SCHWELLE * plDE - 1e-9; });
    const rows = alle.filter(r => S.region === "alle" || r.l.region === S.region);
    const g = { vj: 0, pl: 0, ist: 0 };
    rows.forEach(r => { g.vj += r.vj; g.pl += r.pl; g.ist += r.ist; });
    Object.assign(g, { dvj: g.ist - g.vj, dpl: g.ist - g.pl, dplp: (g.ist - g.pl) / g.pl });
    return { rows, gesamt: g, plDE };
  }
  const gesamtLabel = () => (S.region === "alle" ? "Deutschland" : "Region " + S.region);

  const SPALTEN = [
    { key: "land", titel: "", breite: 186 },
    { key: "hinweis", id: "sp-hinweis", titel: "", breite: 20, typ: "text" },
    { key: "vj", id: "sp-vj", titel: "VJ", breite: 62, fmt: v => zahl(v, 1) },
    { key: "pl", id: "sp-pl", titel: "PL", breite: 62, fmt: v => zahl(v, 1) },
    { key: "ist", id: "sp-ist", titel: "IST", breite: 62, fmt: v => zahl(v, 1) },
    { key: "dvj", id: "sp-dvj", titel: "ΔVJ", breite: 66, fmt: v => delta(v, 1) },
    { key: "dplp", id: "sp-dplp", titel: "ΔPL %", breite: 66, fmt: v => pz(v) },
    { key: "dpl", id: "sp-dpl", titel: "ΔPL", breite: 171, typ: "delta", richtung: 1, nk: 1, textBreite: 52 },
  ];
  function tabellenZeilen(d) {
    const liste = d.rows.slice(), s = S.sort;
    if (s) liste.sort((a, b) => {
      const c = s.key === "land" ? a.l.name.localeCompare(b.l.name, "de") : s.key === "hinweis" ? a.hinweis - b.hinweis : a[s.key] - b[s.key];
      return (s.ab ? -c : c) || a.l.i - b.l.i;
    });
    const z = liste.map(r => ({ key: r.l.name, label: r.l.name, r,
      werte: { hinweis: r.hinweis ? "●" : "", vj: r.vj, pl: r.pl, ist: r.ist, dvj: r.dvj, dplp: r.dplp, dpl: r.dpl } }));
    const g = d.gesamt;
    z.push({ key: "gesamt", label: gesamtLabel(), summe: true,
             werte: { hinweis: "", vj: g.vj, pl: g.pl, ist: g.ist, dvj: g.dvj, dplp: g.dplp, dpl: g.dpl } });
    return z;
  }
  function sortieren(key) {
    if (S.sort && S.sort.key === key) S.sort = { key, ab: !S.sort.ab };
    else S.sort = { key, ab: key !== "land" && key !== "dpl" && key !== "dplp" && key !== "dvj" };
    zeichnen();
  }
  function tooltipLand(r, plDE) {
    const z = [r.l.name, `Region ${r.l.region} · ${ZEITRAUM[S.zeitraum]}`,
      `Ist ${zahl(r.ist, 1)} · Plan ${zahl(r.pl, 1)} · Vorjahr ${zahl(r.vj, 1)} ${EINHEIT}`,
      `ΔPL ${delta(r.dpl, 1)} (${pz(r.dplp)}) · ΔVJ ${delta(r.dvj, 1)} ${EINHEIT}`];
    if (r.hinweis) z.push(`● Wesentliche Planabweichung: mehr als 1${NBSP}% des Plans Deutschland (${zahl(SCHWELLE * plDE, 1)} ${EINHEIT})`);
    z.push("Klick hebt das Land hervor, Klick auf einen Spaltenkopf sortiert");
    return z;
  }
  function botschaft(d, breite) {
    const g = d.gesamt, rows = d.rows;
    const fmt = r => `${r.l.name} (${delta(r.dpl, 1)})`;
    const anfang = `Ist ${delta(g.dpl, 1)} ${EINHEIT} (${pz(g.dplp)}) zum Plan`;
    let teil;
    if (g.dpl < 0) {
      const neg = rows.filter(r => r.dpl < -0.05).sort((a, b) => a.dpl - b.dpl).slice(0, 2);
      teil = neg.length ? `größte ${neg.length > 1 ? "Lücken" : "Lücke"}: ${und(neg.map(fmt))}` : "";
    } else {
      const pos = rows.filter(r => r.dpl > 0.05).sort((a, b) => b.dpl - a.dpl).slice(0, 2);
      teil = pos.length ? `getragen von ${und(pos.map(fmt))}` : "";
    }
    const lang = teil ? `${anfang} – ${teil}` : anfang;
    return DK.tw(lang) <= breite ? lang : anfang;
  }

  /* ---------- Datenschnitte ---------- */
  DK.schnitt(bFilter, "Zeitraum", "knoepfe", {
    optionen: [["q1", "Q1"], ["q2", "Q2"], ["q3", "Q3"], ["q4", "Q4"], ["jahr", "Jahr " + JAHR]], wert: S.zeitraum,
    onChange: v => { S.zeitraum = v; zeichnen(); } });
  DK.schnitt(bFilter, "Region", "dropdown", {
    breite: 150, optionen: [["alle", "Deutschland"], ...REGIONEN.map(r => [r, r])], wert: S.region,
    onChange: v => { S.region = v; S.auswahl = null; zeichnen(); } });

  /* ---------- Zeichnen ---------- */
  function zeichnen() {
    const d = daten();
    const v = DK.visual(bTab, { titel: `Umsatz nach Bundesländern, ${ZEITRAUM[S.zeitraum]}`, einheit: EINHEIT,
      botschaft: botschaft(d, bTab.clientWidth || 695) });
    DK.matrix(v.flaeche, { spalten: SPALTEN, zeilen: tabellenZeilen(d), zeilenhoehe: 22,
      sortierung: S.sort, onSort: sortieren, auswahl: S.auswahl,
      onClick: k => { S.auswahl = S.auswahl === k ? null : k; zeichnen(); },
      tooltip: z => tooltipLand(z.r, d.plDE) });
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  /* ---------- Lernplattform: Designregeln, Nachbau, Tabellen, CSV ---------- */
  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "v-tabelle", anker: "links", versatz: [600, 21], regel: "SAY – Botschaft vermitteln", titel: "Kernaussage über der Tabelle",
        text: "Unter dem Titel steht in einem Satz, wie weit das Ist vom Plan abweicht und welche Länder die Abweichung verursachen – berechnet für den gewählten Zeitraum und die gewählte Region. Das Original zeigte die Tabelle ohne Titel und ohne Aussage." },
      { nr: 2, ziel: "sp-ist", versatz: [22, -2], regel: "UNIFY – Semantische Notation", titel: "Szenarien im Spaltenkopf",
        text: "Wie im Original kennzeichnen Marken unter den Spaltenköpfen die Szenarien: Vorjahr hellgrau, Plan weiß mit Rahmen, Ist anthrazit – dieselbe Notation wie in allen Abbildungen des Buchs. Abweichungen heißen ΔVJ und ΔPL." },
      { nr: 3, ziel: "sp-dpl", versatz: [-40, -2], regel: "UNIFY – Farbe nach Wirkung", titel: "Blaugrün und Rot für die Wirkung",
        text: "Die Balken zeigen die Planabweichung: blaugrün, wenn das Ist über Plan liegt, rot darunter. Das Original nutzte Ampelgrün; Blaugrün bleibt auch bei Rot-Grün-Sehschwäche von Rot unterscheidbar. Die Zahl steht direkt neben ihrem Balken." },
      { nr: 4, ziel: "sp-dpl", versatz: [-4, 379], regel: "CHECK – Visuelle Integrität", titel: "Eine Nulllinie, ein Maßstab",
        text: "Alle Balken beginnen an derselben Nulllinie und haben einen gemeinsamen Maßstab, so ist Niedersachsen (−10,2) sichtbar doppelt so stark wie Berlin (−4,9). Die Summenzeile hat keinen Balken – sie ist ein anderes Aggregat und würde den Maßstab sprengen." },
      { nr: 5, ziel: "sp-hinweis", anker: "links", versatz: [6, 64], regel: "EXPRESS – Hinweise erklären", titel: "Roter Punkt mit Regel",
        text: "Der rote Punkt markiert wesentliche Planabweichungen: Ist mehr als 1 % des Plans Deutschland unter Plan. Im Original standen die Punkte ohne Erklärung; jetzt nennt der Tooltip die Regel, und die Punkte rechnen im gewählten Zeitraum neu." },
      { nr: 6, ziel: "v-tabelle", anker: "links", versatz: [202, 165], regel: "SIMPLIFY – Einheitliche Zahlen", titel: "Ein Format je Spalte",
        text: "Eine Nachkommastelle, echtes Minuszeichen, „±0,0“ statt „+0,0“ und Prozent mit Leerzeichen. Die Einheit steht einmal im Titel – im Original fehlte sie ganz und wurde als Mio. € ergänzt." },
      { nr: 7, ziel: "filter", anker: "links", versatz: [460, 6], regel: "CONDENSE – Filtern statt vervielfachen", titel: "Zeitraum und Region als Datenschnitte",
        text: "Statt weiterer Tabellen je Quartal oder Region filtern zwei Datenschnitte dieselbe Tabelle. So wird sichtbar, dass Berlins Lücke erst ab dem dritten Quartal entsteht, während Niedersachsen das ganze Jahr unter Plan liegt." },
      { nr: 8, ziel: "v-tabelle", anker: "links", versatz: [200, 64], regel: "STRUCTURE – Inhalte ordnen", titel: "Feste Reihenfolge, sortierbar",
        text: "Die Länder stehen alphabetisch wie in amtlichen Übersichten, die Summe steht abgesetzt am Ende. Ein Klick auf einen Spaltenkopf sortiert, z. B. nach ΔPL; ein zweiter Klick kehrt die Richtung um." },
    ],
    nachbauIntro: "Standard-Visuals von Power BI Desktop. Seitengröße benutzerdefiniert 727 × 540 px. Schrift Arial: Tabelle 10,5 pt, Visualtitel 12 pt. Das Berichtsdesign (JSON) setzt Farben und Schriften. Datenmodell: Faktentabelle Umsatz (Bundesland, Region, Quartal, Vorjahr, Plan, Ist) wie in der CSV-Datei.",
    nachbau: [
      { id: "A", ziel: "v-tabelle", versatz: [0, 0], titel: "Umsatz nach Bundesländern", visual: "Tabelle",
        felder: "Bundesland; Measures Hinweis, VJ = SUM(Umsatz[Vorjahr]), PL = SUM(Umsatz[Plan]), IST = SUM(Umsatz[Ist]), ΔVJ = [IST] − [VJ], ΔPL % = DIVIDE([IST] − [PL]; [PL]), ΔPL = [IST] − [PL]",
        format: "1 Dezimalstelle; Gesamtsumme an, Beschriftung über ein Measure „Deutschland“ bzw. Region; bedingte Formatierung für ΔPL: Datenbalken, positiv #00806B, negativ #C62828, Achse in der Mitte, Wert neben dem Balken; Spaltenkopf mit Unterstrich #3A3F44, Zeilenraster #EFEFEF",
        hinweis: "Die Szenario-Marken unter den Spaltenköpfen sind kein Standard-Format – in Power BI ersatzweise die Spaltennamen VJ, PL und IST. Datenbalken lassen sich für die Gesamtzeile nicht abschalten; deshalb ΔPL in der Summe über ein eigenes Measure ohne Balken oder Balken auf Werte < Summe begrenzen." },
      { id: "B", ziel: "sp-hinweis", anker: "links", versatz: [6, 64], titel: "Hinweispunkt", visual: "Tabelle – bedingte Formatierung „Symbole“",
        felder: "Measure Hinweis = IF([ΔPL] < −0,01 × CALCULATE([PL]; ALL(Umsatz[Bundesland]; Umsatz[Region])); 1)",
        format: "Symbole nach Regel: Wert = 1 → roter Kreis #C62828, sonst kein Symbol; nur Symbol anzeigen" },
      { id: "C", ziel: "filter", anker: "links", versatz: [89, 6], titel: "Datenschnitte", visual: "Datenschnitt (2×)",
        felder: "Zeitraum: Umsatz[Quartal] als Kacheln, Einzelauswahl, „Alle auswählen“ als „Jahr“; Region: Umsatz[Region] als Dropdown",
        format: "Ausgewählt #3A3F44 mit weißer Schrift, sonst weiß mit Rahmen #9A9A9A; Kopfzeile 10,5 pt #4D4D4D" },
      { id: "D", ziel: "v-tabelle", anker: "links", versatz: [596, 22], titel: "Kernaussage", visual: "Textfeld mit dynamischem Wert",
        felder: "Text-Measure aus [ΔPL], [ΔPL %] und TOPN(2; …; [ΔPL]; ASC) für die größten Lücken",
        format: "10,5 pt, #4D4D4D" },
    ],
    theme: DK.thema(),
    csv: { name: "umsatz_bundeslaender_daten.csv", text: () => {
      const de = z => (z / 10).toFixed(1).replace(".", ",");
      const k = ["Bundesland;Region;Quartal;Vorjahr_Mio_EUR;Plan_Mio_EUR;Ist_Mio_EUR"];
      L.forEach(l => [0, 1, 2, 3].forEach(q => k.push([l.name, l.region, `Q${q + 1} ${JAHR}`, de(l.w[0][q]), de(l.w[1][q]), de(l.w[2][q])].join(";"))));
      return k.join("\r\n"); } },
    tabellen: () => {
      const d = daten();
      return [{ titel: `Umsatz nach Bundesländern, ${ZEITRAUM[S.zeitraum]} (${EINHEIT})`,
        kopf: ["Bundesland", "Hinweis", "VJ", "PL", "IST", "ΔVJ", "ΔPL %", "ΔPL"],
        zeilen: [...d.rows.map(r => [r.l.name, r.hinweis ? "wesentlich" : "", zahl(r.vj, 1), zahl(r.pl, 1), zahl(r.ist, 1),
                                    delta(r.dvj, 1), pz(r.dplp), delta(r.dpl, 1)]),
                 [gesamtLabel(), "", zahl(d.gesamt.vj, 1), zahl(d.gesamt.pl, 1), zahl(d.gesamt.ist, 1), delta(d.gesamt.dvj, 1),
                  pz(d.gesamt.dplp), delta(d.gesamt.dpl, 1)]] }];
    },
  });
  zeichnen();
})();
