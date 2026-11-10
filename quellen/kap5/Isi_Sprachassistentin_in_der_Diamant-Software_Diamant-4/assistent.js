/* Abb. 5.69 Sprach- und Chat-Assistent – Gesprächslogik.
   Anfangszustand = Druckfassung: Gesprächsverlauf des Originals (27.05.2021 → 27.05.2027, Werte unverändert,
   EUR → €), die Antwort zusätzlich als kleiner Bericht (Tabelle Vorjahr, Vorschau, Bandbreite, ΔVJ).
   Interaktiv: vorgeschlagene Fragen wählen oder eintippen → Antwort mit Bericht erscheint; bei den Umsatzerlösen
   fragt der Assistent nach der Basisgröße (Auswahlknöpfe BWA/HGB). Alle Zahlen erfunden. */
(() => {
  "use strict";
  const { el, zahl } = MK;
  const PRINT = MK.PRINT, NBSP = MK.NBSP, MINUS = MK.MINUS, NDASH = String.fromCharCode(0x2013);
  MK.init({ titel: "Sprach- und Chat-Assistent im Rechnungswesen" });
  const $ = id => document.getElementById(id);
  const chat = $("chat");

  /* ---------- Daten (erfunden; BWA-Werte wie im Original) ---------- */
  const MON = ["Mai", "Juni", "Juli"], JAHR = 2027;
  const UMSATZ = {
    bwa: { name: "BWA-Basisgrößen", vj: [7.21, 8.64, 7.58], fc: [7.56, 9.12, 7.44], lo: [7.38, 8.85, 7.23], hi: [7.74, 9.39, 7.95] },
    hgb: { name: "HGB-Basisgrößen", vj: [7.35, 8.81, 7.73], fc: [7.71, 9.30, 7.59], lo: [7.53, 9.03, 7.37], hi: [7.89, 9.57, 8.11] },
  };
  const LIQ = { stichtag: "27.05.2027", vormonat: "27.04.2027", zeilen: [["Bankguthaben", 3.12, 3.48], ["Freie Kreditlinien", 0.72, 0.77]] };
  const OP = [["1–30 Tage", 14, 231], ["31–60 Tage", 5, 85], ["über 60 Tage", 4, 96]];
  const PERS = [["Januar", 1.39, 1.44], ["Februar", 1.40, 1.45], ["März", 1.42, 1.48], ["April", 1.43, 1.49]];
  const FRAGEN = [
    ["umsatz", "Wie werden sich die Umsatzerlöse entwickeln?"],
    ["liquiditaet", "Wie hoch ist die Liquidität heute?"],
    ["forderungen", "Welche Forderungen sind überfällig?"],
    ["personal", "Wie entwickeln sich die Personalkosten gegenüber dem Vorjahr?"],
  ];

  /* ---------- Format ---------- */
  const mio = v => zahl(v, 2);
  const pd = (a, b) => { const d = Math.round((a / b - 1) * 1000) / 10; return (d > 0 ? "+" : d < 0 ? MINUS : "±") + zahl(Math.abs(d), 1) + NBSP + "%"; };
  const dz = (d, nk = 2) => { const r = Number(d.toFixed(nk)); return (r > 0 ? "+" : r < 0 ? MINUS : "±") + zahl(Math.abs(r), nk); };
  const summe = a => a.reduce((s, v) => s + v, 0);
  const kumuliert = a => a.map((_, i) => summe(a.slice(0, i + 1)));

  /* ---------- Bausteine des Verlaufs ---------- */
  const S = { wartet: null };
  function nachricht(wer, absaetze, id) {
    const m = el("div", { class: "msg " + wer }, chat);
    if (id) m.id = id;
    absaetze.forEach(t => el("p", {}, m, t));
    return m;
  }
  function bericht(ziel, o) {
    const b = el("div", { class: "bericht" }, ziel);
    if (o.id) b.id = o.id;
    const t = el("div", { class: "bericht-titel" }, b, o.titel);
    el("span", {}, t, ", " + o.einheit);
    const tab = el("table", { class: "bt" }, b);
    const kr = el("tr", {}, el("thead", {}, tab));
    o.kopf.forEach(k => el("th", {}, kr, k));
    const tb = el("tbody", {}, tab);
    o.zeilen.forEach(z => { const tr = el("tr", {}, tb); z.forEach(c => el("td", {}, tr, c)); });
    if (o.summe) { const tr = el("tr", { class: "summe" }, tb); o.summe.forEach(c => el("td", {}, tr, c)); }
    return b;
  }
  const nachUnten = () => { if (!PRINT) chat.scrollTop = chat.scrollHeight; };

  /* ---------- Antworten ---------- */
  function umsatzAntwort(key, id, berichtId) {
    const u = UMSATZ[key];
    const hoeher = u.fc.filter((v, i) => v > u.vj[i]).length;
    const kfc = kumuliert(u.fc), kvj = kumuliert(u.vj);
    const khoeher = kfc.filter((v, i) => v > kvj[i]).length;
    const wort = n => (n === 3 ? "stets höher" : n === 2 ? "meist höher" : n === 1 ? "meist niedriger" : "stets niedriger");
    const m = nachricht("assistent", [
      `Der Wert für die Umsatzerlöse wird im ${MON[2]} ${JAHR} voraussichtlich zwischen ${mio(u.lo[2])}${NBSP}Mio.${NBSP}€ und ${mio(u.hi[2])}${NBSP}Mio.${NBSP}€ liegen. ` +
      `Im Mittel betragen die Werte voraussichtlich für ${MON[0]} ${mio(u.fc[0])}${NBSP}Mio.${NBSP}€, für ${MON[1]} ${mio(u.fc[1])}${NBSP}Mio.${NBSP}€ und für ${MON[2]} ${mio(u.fc[2])}${NBSP}Mio.${NBSP}€. ` +
      `Damit wären die Werte für die nächsten drei Monate ${wort(hoeher)} als im Vorjahr. ` +
      `Die kumulierten Werte wären in den nächsten drei Monaten ${wort(khoeher)} als im Vorjahr.`], id);
    bericht(m, { id: berichtId, titel: `Umsatzerlöse (${u.name})`, einheit: "Mio. €",
      kopf: ["Monat", "Vorjahr", "Vorschau", "Bandbreite", "ΔVJ"],
      zeilen: MON.map((mn, i) => [mn + " " + JAHR, mio(u.vj[i]), mio(u.fc[i]), mio(u.lo[i]) + NDASH + mio(u.hi[i]), pd(u.fc[i], u.vj[i])]),
      summe: [`${MON[0]}${NDASH}${MON[2]}`, mio(summe(u.vj)), mio(summe(u.fc)), NDASH, pd(summe(u.fc), summe(u.vj))] });
    return m;
  }
  function rueckfrage(id, mitKnoepfen) {
    const m = nachricht("assistent", ["Möchten Sie die Basisgröße aus den „BWA-Basisgrößen“ oder den „HGB-Basisgrößen“?"], id);
    if (mitKnoepfen) {
      const w = el("div", { class: "wahl" }, m);
      Object.entries(UMSATZ).forEach(([key, u]) => {
        const b = el("button", { type: "button", class: "mk-knopf mk-zweit" }, w, u.name);
        b.addEventListener("click", () => { w.remove(); waehle(key); });
      });
      S.wartet = "umsatz";
    }
    return m;
  }
  function waehle(key) {
    S.wartet = null;
    chat.querySelectorAll(".wahl").forEach(w => w.remove());
    nachricht("nutzer", [UMSATZ[key].name]);
    umsatzAntwort(key);
    nachUnten();
  }
  function antworten(text) {
    const t = text.toLowerCase();
    if (S.wartet === "umsatz" && /bwa|hgb/.test(t)) { nachricht("nutzer", [text]); S.wartet = null;
      chat.querySelectorAll(".wahl").forEach(w => w.remove()); umsatzAntwort(/hgb/.test(t) ? "hgb" : "bwa"); return; }
    nachricht("nutzer", [text]);
    if (/umsatz/.test(t)) { rueckfrage(null, true); return; }
    if (/liquid|bankguthaben|kasse/.test(t)) {
      const s = summe(LIQ.zeilen.map(z => z[1])), v = summe(LIQ.zeilen.map(z => z[2]));
      const m = nachricht("assistent", [`Am ${LIQ.stichtag} stehen liquide Mittel von ${mio(s)}${NBSP}Mio.${NBSP}€ zur Verfügung, ${mio(v - s)}${NBSP}Mio.${NBSP}€ weniger als vor einem Monat.`]);
      bericht(m, { titel: "Liquide Mittel", einheit: "Mio. €", kopf: ["Position", LIQ.stichtag, LIQ.vormonat, "Veränderung"],
        zeilen: LIQ.zeilen.map(z => [z[0], mio(z[1]), mio(z[2]), dz(z[1] - z[2])]), summe: ["Summe", mio(s), mio(v), dz(s - v)] });
      return;
    }
    if (/forderung|überfällig|ueberfaellig|offene posten|debitor/.test(t)) {
      const n = summe(OP.map(z => z[1])), b = summe(OP.map(z => z[2]));
      const m = nachricht("assistent", [`Überfällig sind ${zahl(b, 0)}${NBSP}Tsd.${NBSP}€ in ${n} offenen Posten, davon ${zahl(OP[2][2], 0)}${NBSP}Tsd.${NBSP}€ seit mehr als 60 Tagen.`]);
      bericht(m, { titel: "Überfällige Forderungen", einheit: "Tsd. €", kopf: ["Überfällig seit", "Posten", "Betrag", "Anteil"],
        zeilen: OP.map(z => [z[0], zahl(z[1], 0), zahl(z[2], 0), zahl(z[2] / b * 100, 1) + NBSP + "%"]),
        summe: ["Summe", zahl(n, 0), zahl(b, 0), zahl(100, 1) + NBSP + "%"] });
      return;
    }
    if (/personal/.test(t)) {
      const v = summe(PERS.map(z => z[1])), a = summe(PERS.map(z => z[2]));
      const m = nachricht("assistent", [`Von Januar bis April ${JAHR} betragen die Personalkosten ${mio(a)}${NBSP}Mio.${NBSP}€, ${pd(a, v).replace("+", "")} mehr als im Vorjahr (${mio(v)}${NBSP}Mio.${NBSP}€).`]);
      bericht(m, { titel: "Personalkosten", einheit: "Mio. €", kopf: ["Monat", "Vorjahr", String(JAHR), "ΔVJ"],
        zeilen: PERS.map(z => [z[0], mio(z[1]), mio(z[2]), pd(z[2], z[1])]), summe: [`Januar${NDASH}April`, mio(v), mio(a), pd(a, v)] });
      return;
    }
    if (/^(hallo|guten|hi\b)/.test(t)) { nachricht("assistent", ["Hallo. Wie kann ich Ihnen helfen?"]); return; }
    nachricht("assistent", ["Dazu habe ich in dieser Beispielmaske keine Antwort. Bitte wählen Sie eine der vorgeschlagenen Fragen."]);
  }

  /* ---------- Anfangszustand (= Druckfassung): Verlauf des Originals ---------- */
  el("div", { class: "datum", id: "datum" }, chat, "Donnerstag, 27.05.2027");
  nachricht("nutzer", ["Hallo"], "m-hallo");
  nachricht("assistent", ["Hallo, ich bin Ihr KI-Assistent. Wie kann ich Ihnen helfen?"], "m-gruss");
  nachricht("nutzer", [FRAGEN[0][1]], "m-frage");
  rueckfrage("m-rueckfrage", false);
  nachricht("nutzer", [UMSATZ.bwa.name], "m-auswahl");
  umsatzAntwort("bwa", "m-antwort", "bericht");
  // feste Höhe des Verlaufs (interaktiv mit Bildlauf), damit neue Nachrichten die Maske nicht vergrößern
  chat.style.height = chat.scrollHeight + "px";
  if (!PRINT) chat.style.overflowY = "auto";

  /* ---------- Eingabe ---------- */
  const frage = $("f-frage"), vorschlag = $("f-vorschlag");
  el("option", { value: "", selected: "" }, vorschlag, "Vorschlag wählen");
  FRAGEN.forEach(([k, t]) => el("option", { value: k }, vorschlag, t));
  vorschlag.addEventListener("change", () => {
    const f = FRAGEN.find(x => x[0] === vorschlag.value);
    frage.value = f ? f[1] : "";
  });
  // Ebenen erläutern den Ausgangsdialog: beim Öffnen an den Anfang des Verlaufs blättern, damit die Marken passen
  document.addEventListener("click", e => { if (e.target.closest && e.target.closest(".mk-leiste button")) chat.scrollTop = 0; }, true);
  function senden() {
    const t = frage.value.trim();
    if (!t) { MK.meldung("Bitte eine Frage eingeben oder einen Vorschlag wählen."); return; }
    antworten(t);
    frage.value = ""; vorschlag.value = "";
    nachUnten();
  }
  $("k-senden").addEventListener("click", senden);
  frage.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); senden(); } });
  $("k-sprache").addEventListener("click", () =>
    MK.meldung("Spracheingabe ist in der Beispielmaske nicht verfügbar – bitte eine Frage eingeben oder einen Vorschlag wählen."));

  /* ---------- Lernplattform: Erläuterungen und Gestaltung ---------- */
  MK.ebenen({
    erlaeuterungen: {
      titel: "Erläuterungen",
      intro: "Wie ein Sprach- oder Chat-Assistent in Rechnungswesen und Controlling arbeitet. Die Nummern in der Maske zeigen, wo.",
      eintraege: [
        { nr: 1, ziel: "kopf-unter", versatz: [6, 2], titel: "Assistent im Rechnungswesen",
          text: "Der Assistent beantwortet Fragen in natürlicher Sprache direkt aus den Daten von Rechnungswesen und BI, statt dass man sich durch Berichte navigiert. Die Antworten beziehen sich auf den gewählten Mandanten." },
        { nr: 2, ziel: "m-frage", anker: "links", versatz: [-2, 2], titel: "Frage in natürlicher Sprache",
          text: "Man fragt, wie man eine Kollegin fragen würde. Der Assistent erkennt Absicht (Prognose) und Kennzahl (Umsatzerlöse) und ordnet sie dem Datenmodell zu." },
        { nr: 3, ziel: "m-rueckfrage", versatz: [28, 2], titel: "Rückfrage bei Mehrdeutigkeit",
          text: "Umsatzerlöse sind in der BWA und im HGB-Abschluss unterschiedlich abgegrenzt. Der Assistent fragt nach der Basisgröße, statt zu raten – einheitlich definierte Kennzahlen sind Voraussetzung für verlässliche Antworten." },
        { nr: 4, ziel: "m-antwort", versatz: [28, 2], titel: "Prognose mit Bandbreite",
          text: "Die Antwort beruht auf einer Zeitreihenprognose (Predictive Analytics): erwarteter Wert je Monat und ein Prognoseintervall, das mit dem Horizont breiter wird, verglichen mit dem Vorjahr – je Monat und kumuliert." },
        { nr: 5, ziel: "bericht", versatz: [32, 2], titel: "Kleiner Bericht in der Antwort",
          text: "Der Text fasst zusammen, die Tabelle belegt: Vorjahr, Vorschau, Bandbreite und Abweichung je Monat sowie die Summe der drei Monate." },
        { nr: 6, ziel: "k-sprache", versatz: [-4, -22], titel: "Spracheingabe",
          text: "Fragen lassen sich sprechen statt tippen; die Spracherkennung wandelt sie in Text um. In der Beispielmaske treten die Vorschläge an ihre Stelle." },
        { nr: 7, ziel: "f-vorschlag", versatz: [-30, 2], titel: "Vorgeschlagene Fragen",
          text: "Vorschläge erleichtern den Einstieg und zeigen, welche Fragen das Datenmodell beantworten kann. Der Assistent kennt nur, was dort abgebildet ist – unbekannte Fragen beantwortet er mit einem Hinweis." },
      ],
    },
    gestaltung: {
      titel: "Gestaltung",
      intro: "Was gegenüber dem Original geändert wurde – softwareneutral im Buchstil und nach den Interaktionsprinzipien der DIN EN ISO 9241-110.",
      eintraege: [
        { nr: "A", ziel: "kopf-titel", versatz: [8, 2], regel: "BUCHSTIL – SOFTWARENEUTRAL", titel: "Nur das Dialogfenster",
          text: "Startseite im Hintergrund, Favoritenleiste, Produktname, Name der Assistentin, Firmenname des Mandanten und schwebender Knopf mit Logo entfallen. Der Dialog steht allein unter dem Titel „Assistent“." },
        { nr: "B", ziel: "m-hallo", anker: "links", versatz: [-2, 2], regel: "SELBSTBESCHREIBUNGSFÄHIGKEIT", titel: "Eingabe und Anzeige unterscheidbar",
          text: "Fragen des Anwenders stehen rechts weiß mit Rahmen, Antworten links grau – wie Eingabe- und Anzeigefelder der übrigen Masken. Das Original zeigte blaue und weiße Sprechblasen mit Schatten." },
        { nr: "C", ziel: "bericht", versatz: [32, 2], regel: "AUFGABENANGEMESSENHEIT", titel: "Antwort mit Tabelle",
          text: "Die Antwort enthält zusätzlich eine kleine Tabelle mit Vorjahr, Vorschau, Bandbreite und Abweichung. Im Original musste man sechs Zahlen aus dem Fließtext vergleichen; Vorjahreswerte und die Bandbreiten für Mai und Juni sind ergänzt (erfunden)." },
        { nr: "D", ziel: "m-auswahl", anker: "links", versatz: [-2, 2], regel: "STEUERBARKEIT", titel: "Auswahl statt Tippen",
          text: "Auf die Rückfrage antwortet man in der HTML-Fassung mit Auswahlknöpfen (BWA- oder HGB-Basisgrößen); Fragen lassen sich aus Vorschlägen wählen oder frei eingeben und mit Enter senden." },
        { nr: "E", ziel: "m-antwort", versatz: [28, 2], regel: "ERWARTUNGSKONFORMITÄT", titel: "Deutsche Schreibweisen",
          text: "„Mio. €“ statt „Mio. EUR“, „drei Monate“ statt „3 Monate“, „BWA-Basisgrößen“ mit Bindestrich und deutschen Anführungszeichen, Datum im Format TT.MM.JJJJ." },
        { nr: "F", ziel: "f-frage", versatz: [-4, -22], regel: "ROBUSTHEIT GEGEN BENUTZUNGSFEHLER", titel: "Keine erfundenen Antworten",
          text: "Leere Eingaben werden nicht gesendet; auf unbekannte Fragen antwortet der Assistent mit einem Hinweis auf die Vorschläge statt mit einer geratenen Zahl." },
        { nr: "G", ziel: "datum", versatz: [26, -2], regel: "BUCHSTIL – NEUTRAL UND AKTUELL", titel: "Aktuelles Datum, neutrale Anrede",
          text: "27. Mai 2021 → 27.05.2027 (wieder ein Donnerstag), Prognose für Mai bis Juli 2027, Werte unverändert. Anrede „du“ → „Sie“; „Isi, die KI-Assistentin“ → „Ihr KI-Assistent“." },
        { nr: "H", ziel: "k-senden", versatz: [-4, -22], regel: "BUCHSTIL – SOFTWARENEUTRAL", titel: "Text statt Symbole",
          text: "Die Symbole für Zurück, Schließen, Mikrofon und Senden werden zu den Textknöpfen „Spracheingabe“ und „Senden“; „Senden“ ist die einzige Hauptaktion." },
      ],
    },
  });
  MK.fertig();
})();
