/* Abb. 3.8 „Exemplarische Top-Down-Vorgaben und Abstimmungen“ – Logik der Maske „Top-Down-Vorgabe“.
   Die Konzernleitung gibt eine Zielgröße vor; sie wird auf Gesellschaften und Bereiche verteilt, Maßnahmen schließen die Lücke.
   Abstimmung 1: Summe der Gesellschaften + Maßnahmen − Vorgabe. Abstimmung 2: je Gesellschaft Summe der Bereiche − Vorgabe.
   Werte in Mio. €; Umsatz wie im Original (117.000.000 € usw.), Deckungsbeitrag und Ergebnis erfunden und in sich stimmig. */
(() => {
  "use strict";
  const { el, zahl, leseZahl, pruefeFeld } = MK;
  const MINUS = MK.MINUS, PLUSMINUS = String.fromCharCode(0xB1);
  MK.init({ titel: "Exemplarische Top-Down-Vorgaben und Abstimmungen" });

  /* ---------- Stammdaten je Zielgröße ---------- */
  const MASSNAHMEN = ["Neuen Vertriebskanal anlegen", "Kosteneinsparung", "Effizienzsteigerung"];
  const DATEN = {
    umsatz: { name: "Umsatz", vorgabe: 117.0, mass: [1.7, 1.4, 1.5],
              ges: { vertrieb: 77.0, produktion: 34.0, neu: 1.0 },
              ber: { grosskunden: 36.0, massen: 41.0, winter: 22.0, sommer: 12.0 } },
    db:     { name: "Deckungsbeitrag", vorgabe: 38.0, mass: [0.6, 0.9, 0.5],
              ges: { vertrieb: 23.5, produktion: 12.8, neu: 0.2 },
              ber: { grosskunden: 11.2, massen: 12.3, winter: 8.1, sommer: 4.7 } },
    ebt:    { name: "Ergebnis vor Steuern", vorgabe: 10.0, mass: [0.3, 0.5, 0.4],
              ges: { vertrieb: 6.2, produktion: 3.0, neu: -0.4 },
              ber: { grosskunden: 2.9, massen: 3.3, winter: 2.1, sommer: 0.9 } },
  };
  const GES = ["vertrieb", "produktion", "neu"];
  const BEREICHE = { vertrieb: ["grosskunden", "massen"], produktion: ["winter", "sommer"] };

  const $ = id => document.getElementById(id);
  const PRUEF = { min: -10000, max: 100000, meldung: "Betrag in Mio. € mit Dezimalkomma, z. B. 77,0" };
  const wert = f => { const v = leseZahl(f.value); return v == null || isNaN(v) || f.classList.contains("mk-fehler") ? null : v; };
  const diff = v => (Math.abs(v) < 0.05 ? PLUSMINUS + zahl(0, 1) : (v > 0 ? "+" : "") + zahl(v, 1));
  const summe = liste => liste.reduce((s, v) => s + (v || 0), 0);

  /* ---------- Maßnahmen ---------- */
  const liste = $("massnahmen");
  function massnahmeZeile(name, betrag) {
    const i = liste.children.length;
    const z = el("div", { class: "mass-zeile" }, liste);
    el("input", { class: "mk-feld", id: `m-name-${i}`, value: name, "aria-label": `Maßnahme ${i + 1}`, "data-hilfe": "Bezeichnung der Maßnahme" }, z);
    const w = el("input", { class: "mk-feld mk-zahl", id: `m-wert-${i}`, value: betrag == null ? "" : zahl(betrag, 1), inputmode: "decimal",
      "aria-label": `Beitrag der Maßnahme ${i + 1} in Mio. €`, "data-hilfe": "Beitrag in Mio. € mit Dezimalkomma" }, z);
    zahlFeld(w);
    return z;
  }
  $("l-neu").addEventListener("click", () => {
    if (liste.children.length >= 6) { MK.meldung("Beispielmaske: höchstens sechs Maßnahmen."); return; }
    massnahmeZeile("", null).querySelector("input").focus();
    MK.skalieren(); if (MK._ebenenNeu) MK._ebenenNeu();
  });

  /* ---------- Zahlenfelder: prüfen, neu rechnen, beim Verlassen formatieren ---------- */
  function zahlFeld(f) {
    f.addEventListener("input", () => { pruefeFeld(f, "zahl", PRUEF); rechnen(); });
    f.addEventListener("blur", () => { const v = wert(f); if (v != null) f.value = zahl(v, 1); });
  }
  ["f-vorgabe", ...GES.map(g => "g-" + g), ...Object.values(BEREICHE).flat().map(b => "b-" + b)].forEach(id => zahlFeld($(id)));

  /* ---------- Abstimmung ---------- */
  function rechnen() {
    const ges = GES.map(g => wert($("g-" + g)));
    const holding = summe(ges);
    const mass = summe([...liste.querySelectorAll(".mk-zahl")].map(wert));
    $("f-holding").textContent = zahl(holding, 1);
    $("f-mass-summe").textContent = zahl(mass, 1);
    const vorgabe = wert($("f-vorgabe"));
    if (vorgabe == null) { $("f-differenz").textContent = "–"; $("f-status").textContent = "Vorgabe fehlt"; }
    else {
      const d = holding + mass - vorgabe;
      $("f-differenz").textContent = diff(d);
      $("f-status").textContent = Math.abs(d) < 0.05 ? "abgestimmt" : d < 0 ? "nicht abgestimmt, Lücke" : "nicht abgestimmt, Überhang";
    }
    Object.entries(BEREICHE).forEach(([g, bs]) => {
      const v = wert($("g-" + g));
      $("v-" + g).textContent = v == null ? "–" : zahl(v, 1);
      $("d-" + g).textContent = v == null ? "–" : diff(summe(bs.map(b => wert($("b-" + b)))) - v);
    });
  }

  /* ---------- Zielgröße: Datensatz laden ---------- */
  Object.entries(DATEN).forEach(([k, d]) => el("option", k === "umsatz" ? { value: k, selected: "" } : { value: k }, $("f-zielgroesse"), d.name));
  function laden() {
    const d = DATEN[$("f-zielgroesse").value];
    $("f-vorgabe").value = zahl(d.vorgabe, 1);
    GES.forEach(g => { $("g-" + g).value = zahl(d.ges[g], 1); });
    Object.entries(d.ber).forEach(([b, v]) => { $("b-" + b).value = zahl(v, 1); });
    liste.textContent = "";
    MASSNAHMEN.forEach((n, i) => massnahmeZeile(n, d.mass[i]));
    document.querySelectorAll("#topdown .mk-fehler").forEach(f => f.classList.remove("mk-fehler"));
    rechnen();
    MK.skalieren(); if (MK._ebenenNeu) MK._ebenenNeu();
  }
  $("f-zielgroesse").addEventListener("change", laden);
  laden();

  /* ---------- Lernplattform: Erläuterungen und Gestaltung ---------- */
  MK.ebenen({
    erlaeuterungen: {
      titel: "Erläuterungen",
      intro: "Was die Bereiche der Maske bei Top-Down-Vorgaben und ihrer Abstimmung leisten. Die Nummern in der Maske zeigen, wo.",
      eintraege: [
        { nr: 1, ziel: "f-vorgabe", anker: "links", versatz: [0, 2], titel: "Top-Down-Vorgabe",
          text: "Die Unternehmensleitung gibt für das Budgetjahr eine Zielgröße vor, hier den Umsatz von 117,0 Mio. €. Sie ist der Ausgangspunkt der Planung von oben nach unten und wird anschließend auf Gesellschaften und Bereiche verteilt." },
        { nr: 2, ziel: "f-zielgroesse", anker: "links", versatz: [0, 2], titel: "Zielgröße",
          text: "Vorgegeben werden kann jede steuerungsrelevante Kennzahl: Umsatz, Deckungsbeitrag oder Ergebnis. Je Zielgröße gibt es eigene Vorgaben, Verteilungen und Maßnahmen – wählen Sie eine andere Zielgröße." },
        { nr: 3, ziel: "k-holding", versatz: [-4, 6], titel: "Summe der Gesellschaften",
          text: "Die Holding zeigt die Summe der Vorgaben ihrer Gesellschaften. Vereinfacht wird ohne Konsolidierung addiert; im Konzern wären Innenumsätze, etwa Lieferungen der Produktions- an die Vertriebs GmbH, herauszurechnen." },
        { nr: 4, ziel: "g-massnahmen", versatz: [-4, 2], titel: "Maßnahmen zur Zielerreichung",
          text: "Reicht die Summe der Gesellschaften nicht an die Vorgabe heran, schließen Maßnahmen die Planungslücke (Gap-Analyse). Ihr Beitrag wird einzeln erfasst und summiert; weitere Maßnahmen lassen sich hinzufügen." },
        { nr: 5, ziel: "l-differenz", versatz: [26, 2], titel: "Abstimmung mit der Vorgabe",
          text: "Differenz = Summe der Gesellschaften + Maßnahmen − Vorgabe. Bei −0,4 Mio. € fehlen noch 0,4 Mio. €: Die Vorgaben der Gesellschaften oder die Maßnahmen müssen nachgebessert werden, bis die Differenz null ist." },
        { nr: 6, ziel: "k-neu", versatz: [-4, 6], titel: "Verteilung auf Gesellschaften",
          text: "Die Konzernvorgabe wird auf die Gesellschaften heruntergebrochen – auch auf eine neu gegründete Gesellschaft, die erst einen kleinen Beitrag leistet. Die Felder sind Eingaben der zentralen Planung." },
        { nr: 7, ziel: "k2-produktion", versatz: [26, 6], titel: "Verteilung auf Bereiche",
          text: "Jede Gesellschaft verteilt ihre Vorgabe auf ihre Bereiche. Die Differenz im Knoten zeigt, ob die Vorgabe vollständig verteilt ist (±0,0) – die zweite Abstimmungsebene." },
        { nr: 8, ziel: "k-massen", versatz: [-4, 6], titel: "Gegenstromverfahren",
          text: "Auf die Vorgaben antworten die Bereiche mit ihrer Bottom-up-Planung. Weichen beide ab, wird in weiteren Runden abgestimmt, bis Vorgabe und Planung übereinstimmen." },
      ],
    },
    gestaltung: {
      titel: "Gestaltung",
      intro: "Was gegenüber dem Original geändert wurde – softwareneutral im Buchstil und nach den Interaktionsprinzipien der DIN EN ISO 9241-110.",
      eintraege: [
        { nr: "A", ziel: "kopf", versatz: [-480, 4], regel: "BUCHSTIL – SOFTWARENEUTRAL", titel: "Kein Fenster, kein Logo",
          text: "Fensterrahmen, Menü- und Symbolleiste, Produktname, Navigationsleiste (Prozess, Planung, Simulation, Reporting), Klappsymbole und Bildlaufleisten des Originals entfallen. Übrig bleibt die Maske mit ihrem Namen in der Kopfleiste." },
        { nr: "B", ziel: "kopf-info", anker: "links", versatz: [0, 4], regel: "SELBSTBESCHREIBUNGSFÄHIGKEIT", titel: "Einheit einmal genannt",
          text: "Alle Beträge in Mio. € mit einer Nachkommastelle; die Einheit steht einmal in der Kopfleiste. Das Original schrieb ausgeschriebene Beträge wie „117.000.000 €“ und setzte „€“ teils neben, teils in das Feld." },
        { nr: "C", ziel: "f-status", anker: "links", versatz: [0, 2], regel: "SELBSTBESCHREIBUNGSFÄHIGKEIT", titel: "Status in Worten statt roter Fläche",
          text: "Die Differenz ist ein berechnetes, graues Anzeigefeld mit Vorzeichen; darunter steht der Status in Worten. Das Original färbte das Feld rot – im Graustufendruck nicht zu erkennen und leicht mit einem Eingabefehler zu verwechseln." },
        { nr: "D", ziel: "f-holding", anker: "links", versatz: [0, 2], regel: "SELBSTBESCHREIBUNGSFÄHIGKEIT", titel: "Eingabe und Anzeige unterscheidbar",
          text: "Summen und Vorgaben aus der oberen Ebene sind grau (berechnet), Vorgaben zum Verteilen weiß mit Rahmen. Im Original trugen alle Knoten einen grauen Kopf mit leerem Feld, der Wechsel zwischen grauem und weißem Wert war nicht erklärt." },
        { nr: "E", ziel: "f-zielgroesse", anker: "links", versatz: [0, 2], regel: "ERWARTUNGSKONFORMITÄT", titel: "Gewohnte Bedienelemente",
          text: "Auswahlfelder tragen den Pfeil rechts, Zahlen stehen rechtsbündig mit Dezimalkomma. Die doppelte Bezeichnung „Umsatz - Umsatz“ heißt jetzt „Umsatz“." },
        { nr: "F", ziel: "d-vertrieb", versatz: [32, 2], regel: "AUFGABENANGEMESSENHEIT", titel: "Zweite Abstimmung sichtbar",
          text: "Die Knoten der Bereichsebene zeigen Vorgabe und Differenz der Gesellschaft. Im Original musste man die Summe der Bereiche selbst mit der Vorgabe vergleichen." },
        { nr: "G", ziel: "k-grosskunden", versatz: [-4, 6], regel: "BUCHSTIL – NEUTRAL UND AKTUELL", titel: "Einheitliche Namen, aktuelles Jahr",
          text: "„GB Großkunden“ und „GB Massengeschäft“ heißen wie die übrigen Bereiche ohne Kürzel. Die Periode „BUD 2012 Vorgabe“ wird zu „Budget 2027 – Vorgabe“." },
        { nr: "H", ziel: "g-vertrieb", anker: "links", versatz: [-4, 2], regel: "ROBUSTHEIT GEGEN BENUTZUNGSFEHLER", titel: "Eingaben werden geprüft",
          text: "Ungültige Beträge werden rot markiert und nicht in Summen und Differenzen übernommen; gültige Eingaben rechnen sofort durch beide Abstimmungsebenen." },
      ],
    },
  });
  MK.fertig();
})();
