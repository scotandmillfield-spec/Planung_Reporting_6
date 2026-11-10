/* Abb. 6.1 „Werttreiberbasierte Planung“ – Logik der Maske mit dem Werttreiberbaum Personalkosten.
   Werte des Originals (Unternehmensbereich Motorräder): Fluktuationsrate 10 %, Mitarbeitende Vorperiode 20,
   Neuaufnahmen 12, geplante Abgänge 12, Personalkostensteigerung 25 %, Ø Kosten je MA Vorperiode 3.250 €,
   Einmalzahlung 45.000 €. Die Maske rechnet daraus wie das Original:
     ungeplante Abgänge        = Mitarbeitende Vorperiode × Fluktuationsrate (auf ganze Köpfe gerundet) = 2
     Mitarbeitende Planperiode = Vorperiode + Neuaufnahmen − ungeplante − geplante Abgänge = 18
     Ø Kosten je MA Plan       = Ø Kosten Vorperiode × (1 + Steigerung) = 4.062,5 (Anzeige 4.063)
     Personalkosten gesamt     = Ø Kosten je MA Plan × Mitarbeitende Planperiode + Einmalzahlung = 118.125
   Die Bereiche Fahrräder und Ersatzteile sind erfunden, damit die Auswahl etwas zeigt. */
(() => {
  "use strict";
  const { zahl, leseZahl, pruefeFeld } = MK;
  MK.init({ titel: "Werttreiberbasierte Planung" });
  const $ = id => document.getElementById(id);

  /* ---------- Stammdaten: Werttreiber je Unternehmensbereich ---------- */
  const BEREICHE = [
    ["3000", "Motorräder (3000)", { fluk: 10, mavor: 20, neu: 12, gepl: 12, steig: 25, kvor: 3250, einmal: 45000 }],
    ["2000", "Fahrräder (2000)", { fluk: 8, mavor: 35, neu: 6, gepl: 3, steig: 3.5, kvor: 3400, einmal: 20000 }],
    ["4000", "Ersatzteile (4000)", { fluk: 12, mavor: 15, neu: 2, gepl: 1, steig: 2.5, kvor: 2950, einmal: 0 }],
  ];
  // Treiber: Feld-id → [Nachkommastellen, min, max, ganzzahlig, Meldung]
  const TREIBER = {
    fluk: [1, 0, 100, false, "Prozentwert zwischen 0 und 100 mit Dezimalkomma"],
    mavor: [0, 0, 100000, true, "Anzahl als ganze Zahl ab 0"],
    neu: [0, 0, 100000, true, "Anzahl als ganze Zahl ab 0"],
    gepl: [0, 0, 100000, true, "Anzahl als ganze Zahl ab 0"],
    steig: [1, -50, 100, false, "Prozentwert zwischen −50 und 100 mit Dezimalkomma"],
    kvor: [0, 0, 1000000, false, "Betrag in € ab 0"],
    einmal: [0, 0, 100000000, false, "Betrag in € ab 0"],
  };
  const sel = $("f-bereich");
  BEREICHE.forEach(([v, t]) => MK.el("option", v === "3000" ? { value: v, selected: "" } : { value: v }, sel, t));
  let W = {};                                           // gültige Treiberwerte

  /* ---------- Rechnen von den Treibern bis zur Spitzenkennzahl ---------- */
  function rechnen() {
    const ungepl = Math.round(W.mavor * W.fluk / 100);
    const maplan = W.mavor + W.neu - ungepl - W.gepl;
    const kplan = W.kvor * (1 + W.steig / 100);
    const pk = kplan * maplan + W.einmal;
    $("f-ungepl").textContent = zahl(ungepl, 0);
    $("f-maplan").textContent = zahl(maplan, 0);
    $("f-kplan").textContent = zahl(kplan, 0);
    $("f-pk").textContent = zahl(pk, 0);
    const neg = maplan < 0;
    $("f-maplan").classList.toggle("mk-fehler", neg);
    $("f-maplan").title = neg ? "Mehr Abgänge als Mitarbeitende – Abgänge oder Neuaufnahmen prüfen" : "";
    if (neg) MK.meldung("Mitarbeitende Planperiode negativ: Abgänge oder Neuaufnahmen prüfen.");
  }
  function laden(code) {
    const b = BEREICHE.find(x => x[0] === code);
    W = { ...b[2] };
    Object.keys(TREIBER).forEach(k => { const f = $("f-" + k); f.value = zahl(W[k], TREIBER[k][0]); f.classList.remove("mk-fehler"); f.title = f.dataset.hilfe || ""; });
    rechnen();
  }
  Object.entries(TREIBER).forEach(([k, [nk, min, max, ganz, meldung]]) => {
    const f = $("f-" + k);
    f.addEventListener("input", () => {
      let v = pruefeFeld(f, "zahl", { min, max, pflicht: true, meldung });
      if (v !== null && ganz && !Number.isInteger(v)) { f.classList.add("mk-fehler"); f.title = meldung; v = null; }
      if (v !== null) { W[k] = v; rechnen(); }
    });
    f.addEventListener("blur", () => { if (!f.classList.contains("mk-fehler")) f.value = zahl(W[k], nk); });
  });
  sel.addEventListener("change", () => laden(sel.value));
  const zurueck = () => { laden(sel.value); MK.meldung("Ausgangswerte des Bereichs wiederhergestellt."); };
  $("l-zurueck").addEventListener("click", zurueck);
  $("l-zurueck").addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); zurueck(); } });
  laden("3000");

  /* ---------- Lernplattform: Erläuterungen und Gestaltung ---------- */
  MK.ebenen({
    erlaeuterungen: {
      titel: "Erläuterungen",
      intro: "Wie der Werttreiberbaum die Personalkosten aus wenigen Treibern errechnet. Ändern Sie einen weißen Wert: Der Baum rechnet bis zur Spitze durch.",
      eintraege: [
        { nr: 1, ziel: "k-pk", versatz: [-2, -16], titel: "Spitzenkennzahl",
          text: "Personalkosten gesamt sind die Spitzenkennzahl des Baums. Sie werden nicht direkt geplant, sondern aus den Werttreibern errechnet: Ø Kosten je Mitarbeitendem × Mitarbeitende + Einmalzahlung = 4.062,5 € × 18 + 45.000 € = 118.125 €." },
        { nr: 2, ziel: "f-bereich", versatz: [26, 2], titel: "Unternehmensbereich",
          text: "Der Baum gilt je Planungsobjekt, hier je Unternehmensbereich. Die Auswahl lädt die Treiberwerte des Bereichs; die Rechenlogik ist für alle Bereiche gleich." },
        { nr: 3, ziel: "k-maplan", versatz: [-2, -16], titel: "Mengentreiber Personalbestand",
          text: "Die Mitarbeitenden der Planperiode folgen aus der Personalbestandsplanung: Vorperiode + Neuaufnahmen − ungeplante − geplante Abgänge = 20 + 12 − 2 − 12 = 18." },
        { nr: 4, ziel: "k-fluk", versatz: [-2, -16], titel: "Fluktuation",
          text: "Ungeplante Abgänge werden nicht einzeln geplant, sondern über die Fluktuationsrate geschätzt: 20 Mitarbeitende × 10 % = 2 (auf ganze Köpfe gerundet). Geplante Abgänge, etwa Renteneintritte, werden direkt erfasst." },
        { nr: 5, ziel: "k-steig", versatz: [-2, -16], titel: "Prämisse Kostensteigerung",
          text: "Die Personalkostensteigerung, etwa aus einem Tarifabschluss, ist eine Planungsprämisse, wie sie das zentrale Controlling vorgibt (vgl. Prämissenplanung). Sie wirkt auf die Ø Kosten je Mitarbeitendem: 3.250 € × 1,25 = 4.062,5 €." },
        { nr: 6, ziel: "k-einmal", versatz: [-2, -16], titel: "Einmalzahlung",
          text: "Nicht jeder Bestandteil hängt an einem Treiber: Einmalzahlungen wie Sonderprämien kommen als fester Betrag hinzu." },
        { nr: 7, ziel: "op-maplan", anker: "links", versatz: [6, -22], titel: "Rechenweg im Baum",
          text: "Jede Verbindung trägt ihr Rechenzeichen. Wie beim Du-Pont-Kennzahlensystem lässt sich so verfolgen, wie ein Treiber auf die Spitzenkennzahl wirkt – hier aber von unten nach oben geplant statt von oben nach unten analysiert." },
        { nr: 8, ziel: "k-neu", versatz: [-2, -16], titel: "Simulation über Treiber",
          text: "Werttreiberbasierte Planung reduziert den Aufwand: Statt vieler Einzelpositionen werden wenige Treiber geplant. Zugleich lassen sich Was-wäre-wenn-Fragen beantworten, z. B. was zehn zusätzliche Neuaufnahmen für die Personalkosten bedeuten." },
      ],
    },
    gestaltung: {
      titel: "Gestaltung",
      intro: "Was gegenüber dem Original geändert wurde – softwareneutral im Buchstil und nach den Interaktionsprinzipien der DIN EN ISO 9241-110.",
      eintraege: [
        { nr: "A", ziel: "kopf", versatz: [-6, 8], regel: "BUCHSTIL – SOFTWARENEUTRAL", titel: "Kein Fenster, kein Logo",
          text: "Fensterrahmen, Menü- und Symbolleiste, Produktname und Logo, die Navigationsleiste (Prozess, Planung, Simulation, Reporting) und die Statuszeilen mit Datum, Benutzer, Server und „Schnellberechnung“ entfallen. Der Titel heißt richtig „Werttreiberbasierte Planung“ – im Original stand „Wertreiberbasierte Planunug“." },
        { nr: "B", ziel: "k-ungepl", versatz: [-2, -16], regel: "SELBSTBESCHREIBUNGSFÄHIGKEIT", titel: "Treiber und Ergebnisse unterscheidbar",
          text: "Werttreiber sind weiße Eingabefelder mit Rahmen, berechnete Knoten grau hinterlegt, die Spitzenkennzahl hat einen kräftigen Rahmen. Im Original sahen alle Knoten gleich aus; dass ungeplante Abgänge und Mitarbeitende errechnet werden, war nicht zu erkennen." },
        { nr: "C", ziel: "op-ungepl", versatz: [14, -18], regel: "SELBSTBESCHREIBUNGSFÄHIGKEIT", titel: "Rechenzeichen am Ast",
          text: "Jeder Eingang trägt sein Rechenzeichen im Kreis, wie im Du-Pont-Baum. Im Original standen „x“, „+“ und „-“ lose neben den Linien; welche Abgänge abgezogen werden, blieb offen." },
        { nr: "D", ziel: "k-kvor", versatz: [-2, -16], regel: "SELBSTBESCHREIBUNGSFÄHIGKEIT", titel: "Einheiten genannt",
          text: "Jeder Knoten nennt seine Einheit (in %, in €); Mitarbeitende sind Köpfe. Das Original nannte nur bei den Prozentwerten eine Einheit." },
        { nr: "E", ziel: "k-mavor", versatz: [-2, -16], regel: "ERLERNBARKEIT", titel: "Ohne Abkürzungen",
          text: "„Anzahl MA“ heißt „Mitarbeitende“, „durchschn. Kosten pro MA“ wird zu „Ø Kosten je MA“; je Knoten zwei Zeilen, damit nichts gekürzt wird. Die Vorperiode steht wie im Original links, die Spitzenkennzahl rechts." },
        { nr: "F", ziel: "f-kplan", anker: "links", versatz: [2, 2], regel: "ERWARTUNGSKONFORMITÄT", titel: "Zahlen rechtsbündig",
          text: "Zahlen stehen rechtsbündig mit Tausenderpunkt, Prozentwerte mit einer Nachkommastelle (10,0 statt 10,00). Im Original waren alle Werte zentriert." },
        { nr: "G", ziel: "k-gepl", versatz: [-2, -16], regel: "ROBUSTHEIT GEGEN BENUTZUNGSFEHLER", titel: "Eingaben werden geprüft",
          text: "Köpfe müssen ganze Zahlen ab 0 sein, Prozentwerte liegen in sinnvollen Grenzen; ungültige Eingaben werden rot markiert und nicht übernommen. Würden mehr Mitarbeitende abgehen als vorhanden, wird das Ergebnis markiert." },
        { nr: "H", ziel: "f-bereich", anker: "links", versatz: [2, 2], regel: "ERWARTUNGSKONFORMITÄT", titel: "Gewohntes Auswahlfeld",
          text: "Das Auswahlfeld trägt den Pfeil rechts; die Bereichsnummer ist von „0000003000“ auf „3000“ gekürzt. Das Original zeigte einen runden Pfeil links vor dem Wert." },
      ],
    },
  });
  MK.fertig();
})();
