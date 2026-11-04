/* Einzelvisual „Balkendiagramm“ (Abb. 3.49): Cash-to-Cash Cycle in Tagen.
   Seite 727 x 300 px = 110 x 45,4 mm. Daten: balken.json (daten_balken.py), Werte des Originals.
   Diagrammtyp bleibt: waagerechte Balken in Tagen. Die Reihenfolge folgt jetzt der Rechnung (Materialumschlag
   + Erzeugnisumschlag + Debitorenziel − Kreditorenziel = Cash-to-Cash Cycle), das Ergebnis steht unten, fett und
   durch eine Linie abgesetzt. Klick auf einen Balken hebt ihn hervor. */
(() => {
  "use strict";
  const { zahl, NBSP, el } = DK;
  const J = DATA.jahr, CCC = DATA.ccc;
  const ZEILEN = [...DATA.posten.map(([name, tage, vz], i) => ({ key: i, name, wert: tage, vz })),
    { key: "ccc", name: "Cash-to-Cash Cycle", wert: CCC, vz: 0 }];
  const OP = z => (z.vz === 0 ? "= " : z.key === 0 ? "" : z.vz > 0 ? "+ " : "− ");
  const S = { auswahl: null };
  addEventListener("keydown", e => { if (e.key === "Escape" && S.auswahl !== null) { S.auswahl = null; zeichnen(); } });

  DK.init({ titel: "Balkendiagramm", breite: 727, hoehe: 300 });
  const bVis = DK.box("v-balken", 16, 10, 695, 282);
  const INFO = {
    Materialumschlag: "Tage, die Material im Lager liegt, bis es verbraucht wird",
    Erzeugnisumschlag: "Tage, die fertige Erzeugnisse im Lager liegen, bis sie verkauft werden",
    Debitorenziel: "Tage, bis Kunden ihre Rechnungen bezahlen",
    Kreditorenziel: "Tage, bis das Unternehmen Lieferanten bezahlt – verkürzt den Zyklus",
    "Cash-to-Cash Cycle": "Tage zwischen der Zahlung an Lieferanten und dem Zahlungseingang von Kunden",
  };

  function botschaft(b) {
    const passt = k => k.find(t => DK.tw(t) <= b) || k[k.length - 1];
    if (S.auswahl !== null) {
      const z = ZEILEN.find(x => x.key === S.auswahl);
      return passt([`${z.name}: ${zahl(z.wert)} Tage – ${INFO[z.name]}`, `${z.name}: ${zahl(z.wert)} Tage`]);
    }
    const top = ZEILEN.filter(z => z.vz > 0).sort((a, c) => c.wert - a.wert)[0];
    return passt([`${zahl(CCC)} Tage vom Bezahlen der Lieferanten bis zum Geldeingang; größter Treiber ist der ${top.name} (${zahl(top.wert)} Tage)`,
      `${zahl(CCC)} Tage Kapitalbindung; größter Treiber ist der ${top.name} (${zahl(top.wert)} Tage)`]);
  }

  function zeichnen() {
    const v = DK.visual(bVis, { titel: `Cash-to-Cash Cycle ${J}`, einheit: "Tage", botschaft: botschaft(695) });
    const rh = Math.floor((v.hoehe - 6) / ZEILEN.length);
    const svg = DK.balken(v.flaeche, { breite: v.breite, hoehe: v.hoehe, zeilenhoehe: rh,
      zeilen: ZEILEN.map(z => ({ key: z.key, label: OP(z) + z.name, wert: z.wert, ...(z.vz < 0 ? { kontur: "#3A3F44" } : {}) })),
      labelBreite: Math.ceil(Math.max(...ZEILEN.map(z => DK.tw(OP(z) + z.name, 14, z.vz === 0)))) + 12,
      fmt: w => zahl(w), auswahl: S.auswahl, onClick: k => { S.auswahl = S.auswahl === k ? null : k; zeichnen(); },
      tooltip: z => { const x = ZEILEN.find(y => y.key === z.key); return [x.name, `${zahl(x.wert, 1)} Tage`, INFO[x.name], "Klick hebt den Balken hervor"]; },
      aria: `Balkendiagramm: Cash-to-Cash Cycle ${J} in Tagen` });
    svg.id = "ba-balken";
    // Ergebnis absetzen: Linie über der letzten Zeile, Beschriftung fett
    const gruppen = svg.querySelectorAll(":scope > g"), letzte = gruppen[gruppen.length - 1];
    letzte.querySelectorAll("text").forEach(t => t.style.fontWeight = "bold");
    DK.sv("line", { x1: 0, x2: v.breite, y1: rh * (ZEILEN.length - 1) + 0.5, y2: rh * (ZEILEN.length - 1) + 0.5, stroke: "#3A3F44", "stroke-width": 1 }, svg);
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "v-balken", anker: "links", versatz: [690, 26], regel: "SAY – Botschaft vermitteln", titel: "Kernaussage unter dem Titel",
        text: "Unter dem Titel steht, was der Cash-to-Cash Cycle bedeutet und was ihn treibt. Das Original hatte nur die Überschrift „Cash-to-Cash Cycle“." },
      { nr: 2, ziel: "ba-balken", anker: "links", versatz: [14, 4], regel: "STRUCTURE – Inhalte ordnen", titel: "Reihenfolge der Rechnung",
        text: "Die Balken folgen der Rechnung: Materialumschlag + Erzeugnisumschlag + Debitorenziel − Kreditorenziel = Cash-to-Cash Cycle. Die Rechenzeichen stehen vor den Namen, das Ergebnis unten, fett und durch eine Linie abgesetzt. Im Original stand das Ergebnis zwischen den Bestandteilen, ohne dass die Rechnung erkennbar war." },
      { nr: 3, ziel: "ba-balken", anker: "links", versatz: [440, 150], regel: "UNIFY – Semantische Notation", titel: "Abzug als Kontur",
        text: "Das Kreditorenziel verkürzt den Zyklus; sein Balken ist deshalb nur als Kontur gezeichnet. Alle anderen Balken sind anthrazit." },
      { nr: 4, ziel: "ba-balken", anker: "links", versatz: [600, 40], regel: "SIMPLIFY – Überflüssiges weglassen", titel: "Ohne Achse und Gitternetz",
        text: "Die Werte stehen am Balkenende; Größenachse, Gitternetz und Teilstriche des Originals entfallen. Die Einheit steht im Titel." },
      { nr: 5, ziel: "ba-balken", anker: "links", versatz: [465, 90], regel: "CHECK – Stimmige Zahlen", titel: "Rechnung geht auf",
        text: "Mit den ganzen Tagen des Originals ergäbe die Rechnung 65 statt 64 Tage. Die Werte sind deshalb mit einer Nachkommastelle hinterlegt (Tooltip, Tabelle), gerundet zeigen sie die Zahlen des Originals." },
    ],
    nachbauIntro: "Seitengröße benutzerdefiniert 727 × 300 px. Schrift Arial: Beschriftungen 10,5 pt, Titel 12 pt. Datenmodell: Tabelle Kennzahlen (Kennzahl, Tage, Vorzeichen, Sortierung) wie in der CSV-Datei.",
    nachbau: [
      { id: "A", ziel: "ba-balken", versatz: [0, 0], titel: "Balken", visual: "Gruppiertes Balkendiagramm (Standardvisual)",
        felder: "Y-Achse: Kennzahl mit Rechenzeichen (berechnete Spalte), sortiert nach Spalte Sortierung; X-Achse: Tage",
        format: "Datenfarbe #3A3F44, Kreditorenziel weiß mit Rahmen #3A3F44 (bedingte Formatierung); Datenbeschriftungen ein; X-Achse und Gitternetz aus",
        hinweis: "Der Cash-to-Cash Cycle ist ein Measure: Materialumschlag + Erzeugnisumschlag + Debitorenziel − Kreditorenziel." },
    ],
    theme: DK.thema(),
    csv: { name: "cash_to_cash_daten.csv", text: () => ["Kennzahl;Tage;Vorzeichen",
      ...ZEILEN.map(z => [z.name, zahl(z.wert, 1), z.vz === 0 ? "=" : z.vz > 0 ? "+" : "−"].join(";"))].join("\r\n") },
    tabellen: () => [{ titel: `Cash-to-Cash Cycle ${J} (Tage)`, kopf: ["", "Kennzahl", "Tage"],
      zeilen: ZEILEN.map(z => [OP(z).trim() || "", z.name, zahl(z.wert, 1)]) }],
  });
  zeichnen();
})();
