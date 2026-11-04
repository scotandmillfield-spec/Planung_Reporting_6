/* Abb. 3.11 „Exemplarische Startnavigation“ – Logik der Startseite „Berichtsnavigation“.
   Jeder Eintrag ist ein Link; ein Klick meldet, welcher Bericht mit welcher Vorselektion geöffnet würde. */
(() => {
  "use strict";
  MK.init({ titel: "Exemplarische Startnavigation" });

  const ART = {
    cockpit: "Cockpit mit den wichtigsten Kennzahlen des Bereichs – Einstieg für Drill-down und Analysen",
    planvergleich: "Plan-Ist-Vergleich mit Abweichungen",
    ranking: "Rangfolge der Kostenträger (Top/Flop) nach Deckungsbeitrag",
    ktr: "Analyse nach Kostenträgern (Produkte, Aufträge)",
    kst: "Analyse nach Kostenstellen",
    projekt: "Analyse der Entwicklungsprojekte",
    pdf: "Standardbericht als PDF zum Drucken und Ablegen",
  };
  const maske = document.getElementById("navigation");
  maske.querySelectorAll("a.mk-link").forEach(a => {
    a.setAttribute("role", "link");
    a.tabIndex = 0;
    const bereich = a.closest(".mk-gruppe").querySelector(".mk-gruppenkopf").textContent;
    const oeffnen = () => {
      const vorselektion = a.dataset.art === "pdf" ? "" : `, vorselektiert auf ${bereich}`;
      MK.meldung(`Beispiel: „${a.textContent}“ – ${ART[a.dataset.art]}${vorselektion}. Nicht hinterlegt.`);
    };
    a.addEventListener("click", oeffnen);
    a.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); oeffnen(); } });
  });

  /* ---------- Lernplattform: Erläuterungen und Gestaltung ---------- */
  MK.ebenen({
    erlaeuterungen: {
      titel: "Erläuterungen",
      intro: "Was die Startseite eines Berichtsportals leistet. Die Nummern auf der Seite zeigen, wo.",
      eintraege: [
        { nr: 1, ziel: "kopf-titel", versatz: [6, 6], titel: "Einstieg ins Berichtswesen",
          text: "Die Startnavigation ist die erste Seite nach der Anmeldung. Sie bündelt alle Berichte an einer Stelle; niemand muss wissen, wo ein Bericht abgelegt ist oder wie er technisch heißt." },
        { nr: 2, ziel: "k-gl", versatz: [0, 0], titel: "Gliederung nach Empfängern",
          text: "Die Berichte sind nach Unternehmensbereichen geordnet – von der Geschäftsleitung bis zum Controlling. Jeder Bereich findet seine Berichte unter seinem Namen; die Struktur folgt den Empfängern, nicht den Datenquellen." },
        { nr: 3, ziel: "l-gl-cockpit", versatz: [28, 2], titel: "Cockpit zuerst",
          text: "Jede Gruppe beginnt mit einem Cockpit: wenige Kennzahlen im Überblick. Von dort führen die Analysewege per Drill-down in die Details; die Listeneinträge darunter sind der direkte Weg zu den Detailberichten." },
        { nr: 4, ziel: "l-vt-plan", versatz: [28, 2], titel: "Plan-Ist-Vergleiche",
          text: "GuV-Planvergleich und Planvergleich Absatz/Umsatz zeigen die Abweichungen der Ist- von den Planwerten. Sie verbinden Planung und Reporting im Regelkreis." },
        { nr: 5, ziel: "l-ks-kst", versatz: [28, 2], titel: "Ein Bericht, viele Sichten",
          text: "Die Kostenstellenanalyse steht in allen sechs Bereichen. Es ist derselbe Bericht, jeweils auf die Kostenstellen des Bereichs vorselektiert – das spart Pflegeaufwand und sorgt für einheitliche Zahlen. Die Berechtigungen regeln, wer welche Daten sieht." },
        { nr: 6, ziel: "l-gl-ranking", versatz: [28, 2], titel: "Kostenträger: Ranking und Analyse",
          text: "Rankings ordnen Produkte oder Aufträge nach ihrem Ergebnisbeitrag (Top/Flop); die Kostenträgeranalyse zerlegt Erlöse und Kosten je Kostenträger." },
        { nr: 7, ziel: "l-pe-fert", versatz: [28, 2], titel: "Standardberichte als PDF",
          text: "Neben den interaktiven Berichten stehen feste Standardberichte als PDF – zum Drucken, Versenden und Archivieren, etwa für Fertigungskosten oder die Umsatzabgrenzung zum Monatsabschluss." },
        { nr: 8, ziel: "hinweis", versatz: [0, -22], titel: "Kurzhinweis",
          text: "Eine Zeile erklärt die zwei Arten von Einträgen: interaktive Berichte mit Vorselektion und PDF-Berichte. So ist die Seite ohne Schulung verständlich." },
      ],
    },
    gestaltung: {
      titel: "Gestaltung",
      intro: "Was gegenüber dem Original geändert wurde – softwareneutral im Buchstil und nach den Interaktionsprinzipien der DIN EN ISO 9241-110.",
      eintraege: [
        { nr: "A", ziel: "kopf-titel", versatz: [6, 6], regel: "BUCHSTIL – SOFTWARENEUTRAL", titel: "Kein Fenster, kein Logo",
          text: "Fensterrahmen, Menü- und Symbolleiste, Produktname, Firmenname und Firmenlogo sowie die Statusleiste des Originals entfallen. Übrig bleibt die Seite mit ihrem Namen als Titel; die Titelzeile ist gestaltet wie bei den Dashboards." },
        { nr: "B", ziel: "l-gl-guv", versatz: [28, 2], regel: "ERWARTUNGSKONFORMITÄT", titel: "Links statt Kacheln",
          text: "Alle Einträge sind unterstrichene Links in einer Liste, wie man es aus dem Web kennt. Das Original setzte hellblaue Kacheln mit Schatten und unterstrich nur einen Teil der Einträge – ohne erkennbaren Grund." },
        { nr: "C", ziel: "g-ks", versatz: [-60, 0], regel: "AUFGABENANGEMESSENHEIT", titel: "Keine leeren Felder",
          text: "Das Original zeigte ein Raster aus 13 Zeilen je Bereich, überwiegend leere Kacheln. Jetzt stehen nur die vorhandenen Berichte da; die Gruppen sind so lang wie ihr Inhalt." },
        { nr: "D", ziel: "l-gl-kst", versatz: [28, 2], regel: "SELBSTBESCHREIBUNGSFÄHIGKEIT", titel: "Abkürzungen ausgeschrieben",
          text: "KST-Analyse heißt Kostenstellenanalyse, KTR-Analyse Kostenträgeranalyse, KTR-Rankings Kostenträger-Ranking; P-, PE-, KS- und CO-Cockpit heißen nach ihrem Bereich, das Sales-Cockpit Vertriebscockpit." },
        { nr: "E", ziel: "l-co-umsatz", versatz: [28, 2], regel: "ERWARTUNGSKONFORMITÄT", titel: "Einheitliche Kennzeichnung",
          text: "PDF-Berichte tragen einheitlich „(PDF)“ am Ende der Zeile; im Original stand „(pdf)“ klein geschrieben und teils in einer zweiten Zeile." },
        { nr: "F", ziel: "g-co", versatz: [-90, 0], regel: "ERLERNBARKEIT", titel: "Gleiche Reihenfolge",
          text: "In jeder Gruppe gilt dieselbe Ordnung: Cockpit, Planvergleich, Ranking, Kostenträger-, Kostenstellenanalyse, PDF-Berichte. Im Controlling stand die Kostenstellen- vor der Kostenträgeranalyse." },
        { nr: "G", ziel: "k-pe", versatz: [0, 0], regel: "BUCHSTIL – NEUTRAL UND AKTUELL", titel: "Drei statt sechs Spalten",
          text: "Die sechs Bereiche stehen in zwei Reihen zu drei Spalten, damit die Seite 110 mm breit lesbar bleibt. Reihenfolge wie im Original von links nach rechts." },
        { nr: "H", ziel: "hinweis", versatz: [0, -22], regel: "SELBSTBESCHREIBUNGSFÄHIGKEIT", titel: "Kurzhinweis ergänzt",
          text: "Neu ist die Hinweiszeile unten. Die Kachel „FOCUS“ unten links im Original – vermutlich der Absprung in eine weitere Anwendung – entfällt." },
      ],
    },
  });
  MK.fertig();
})();
