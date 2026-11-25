/* Abb. 5.69 Sprach- und Chat-Assistent – Gesprächslogik.
   Revision DS 24.11.2026: eigenes Dialogbeispiel, vom Original gelöst (dort: Prognose der Umsatzerlöse mit Rückfrage
   nach BWA-/HGB-Basisgrößen). Anfangszustand = Druckfassung: Frage nach Budgetüberschreitungen der Kostenstellen im
   ersten Quartal, Rückfrage zur Vergleichsbasis (Budget oder Forecast), Antwort mit kleinem Bericht.
   Interaktiv: vorgeschlagene Fragen wählen oder eintippen → Antwort mit Bericht erscheint; bei den Kostenstellen
   fragt der Assistent nach der Vergleichsbasis (Auswahlknöpfe Budget/Forecast). Alle Zahlen erfunden. */
(() => {
  "use strict";
  const { el, zahl } = MK;
  const PRINT = MK.PRINT, NBSP = MK.NBSP, MINUS = MK.MINUS, NDASH = String.fromCharCode(0x2013);
  MK.init({ titel: "Sprach- und Chat-Assistent im Rechnungswesen" });
  const $ = id => document.getElementById(id);
  const chat = $("chat");

  /* ---------- Daten (alle erfunden) ---------- */
  const JAHR = 2027, HEUTE = "12.04.2027", QUARTAL = "ersten Quartal " + JAHR;
  // Kostenstelle, Budget, Forecast, Ist – Januar bis März in Tsd. €
  const KST = [["Fertigung", 1240, 1235, 1228], ["Montage", 860, 870, 874], ["Instandhaltung", 480, 520, 538],
               ["Logistik", 390, 410, 414], ["Vertrieb", 520, 510, 506], ["Verwaltung", 310, 305, 302],
               ["IT", 270, 265, 262], ["Qualitätssicherung", 180, 178, 177]];
  const BASIS = { budget: { name: "Budget", kurz: "ΔBudget", spalte: 1 }, forecast: { name: "Forecast", kurz: "ΔForecast", spalte: 2 } };
  const LIQ = { stichtag: HEUTE, vormonat: "12.03.2027", zeilen: [["Bankguthaben", 3.12, 3.48], ["Freie Kreditlinien", 0.72, 0.77]] };
  const OP = [["1–30 Tage", 14, 231], ["31–60 Tage", 5, 85], ["über 60 Tage", 4, 96]];
  const PERS = [["Januar", 1.39, 1.44], ["Februar", 1.40, 1.45], ["März", 1.42, 1.48]];
  const FRAGEN = [
    ["kosten", "Welche Kostenstellen haben ihr Budget im ersten Quartal überschritten?"],
    ["liquiditaet", "Wie hoch ist die Liquidität heute?"],
    ["forderungen", "Welche Forderungen sind überfällig?"],
    ["personal", "Wie entwickeln sich die Personalkosten gegenüber dem Vorjahr?"],
  ];

  /* ---------- Format ---------- */
  const mio = v => zahl(v, 2);
  const tsd = v => zahl(v, 0);
  const pd = (a, b) => { const d = Math.round((a / b - 1) * 1000) / 10; return (d > 0 ? "+" : d < 0 ? MINUS : "±") + zahl(Math.abs(d), 1) + NBSP + "%"; };
  const dz = (d, nk = 2) => { const r = Number(d.toFixed(nk)); return (r > 0 ? "+" : r < 0 ? MINUS : "±") + zahl(Math.abs(r), nk); };
  const summe = a => a.reduce((s, v) => s + v, 0);
  const ZAHLWORT = ["keine", "eine", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht"];

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
  function kostenAntwort(key, id, berichtId) {
    const bs = BASIS[key], sp = bs.spalte, TE = `${NBSP}Tsd.${NBSP}€`;
    const ueber = KST.filter(k => k[3] > k[sp]).sort((x, y) => (y[3] - y[sp]) - (x[3] - x[sp]));
    const rest = KST.filter(k => k[3] <= k[sp]);
    const sB = summe(KST.map(k => k[sp])), sI = summe(KST.map(k => k[3]));
    const sU = summe(ueber.map(k => k[3] - k[sp]));
    const top = ueber[0];
    const gesamt = sI > sB ? `${tsd(sI - sB)}${TE} (${pd(sI, sB)}) über` : sI < sB ? `${tsd(sB - sI)}${TE} (${pd(sI, sB)}) unter` : "genau auf";
    const text = ueber.length
      ? `Im ${QUARTAL} liegen ${ZAHLWORT[ueber.length]} von ${ZAHLWORT[KST.length]} Kostenstellen über dem ${bs.name}, zusammen um ${tsd(sU)}${TE}. ` +
        `Die größte Überschreitung hat die Kostenstelle ${top[0]} mit ${tsd(top[3] - top[sp])}${TE} (${pd(top[3], top[sp])}). ` +
        `Weil die übrigen Kostenstellen weniger verbraucht haben, liegen die Kosten insgesamt ${gesamt} dem ${bs.name}.`
      : `Im ${QUARTAL} liegt keine Kostenstelle über dem ${bs.name}.`;
    const m = nachricht("assistent", [text], id);
    const zeile = (name, b_, i_) => [name, tsd(b_), tsd(i_), dz(i_ - b_, 0), pd(i_, b_)];
    const zeilen = ueber.map(k => zeile(k[0], k[sp], k[3]));
    if (rest.length) zeilen.push(zeile(`Übrige Kostenstellen (${rest.length})`, summe(rest.map(k => k[sp])), summe(rest.map(k => k[3]))));
    bericht(m, { id: berichtId, titel: `Kosten nach Kostenstellen, Januar${NDASH}März ${JAHR}`, einheit: "Tsd. €",
      kopf: ["Kostenstelle", bs.name, "Ist", bs.kurz, bs.kurz + " %"], zeilen, summe: zeile("Summe", sB, sI) });
    return m;
  }
  function rueckfrage(id, mitKnoepfen) {
    const m = nachricht("assistent", ["Soll ich das Ist mit dem Budget oder mit dem aktuellen Forecast vergleichen?"], id);
    if (mitKnoepfen) {
      const w = el("div", { class: "wahl" }, m);
      Object.entries(BASIS).forEach(([key, u]) => {
        const b = el("button", { type: "button", class: "mk-knopf mk-zweit" }, w, u.name);
        b.addEventListener("click", () => { w.remove(); waehle(key); });
      });
      S.wartet = "kosten";
    }
    return m;
  }
  function waehle(key) {
    S.wartet = null;
    chat.querySelectorAll(".wahl").forEach(w => w.remove());
    nachricht("nutzer", [BASIS[key].name]);
    kostenAntwort(key);
    nachUnten();
  }
  function antworten(text) {
    const t = text.toLowerCase();
    if (S.wartet === "kosten" && /budget|forecast|vorschau/.test(t)) { nachricht("nutzer", [text]); S.wartet = null;
      chat.querySelectorAll(".wahl").forEach(w => w.remove()); kostenAntwort(/forecast|vorschau/.test(t) ? "forecast" : "budget"); return; }
    nachricht("nutzer", [text]);
    if (/kostenstelle|budget|überschritten|ueberschritten/.test(t)) { rueckfrage(null, true); return; }
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
      const m = nachricht("assistent", [`Von Januar bis März ${JAHR} betragen die Personalkosten ${mio(a)}${NBSP}Mio.${NBSP}€, ${pd(a, v).replace("+", "")} mehr als im Vorjahr (${mio(v)}${NBSP}Mio.${NBSP}€).`]);
      bericht(m, { titel: "Personalkosten", einheit: "Mio. €", kopf: ["Monat", "Vorjahr", String(JAHR), "ΔVJ"],
        zeilen: PERS.map(z => [z[0], mio(z[1]), mio(z[2]), pd(z[2], z[1])]), summe: [`Januar${NDASH}März`, mio(v), mio(a), pd(a, v)] });
      return;
    }
    if (/^(hallo|guten|hi\b)/.test(t)) { nachricht("assistent", ["Guten Tag. Wie kann ich Ihnen helfen?"]); return; }
    nachricht("assistent", ["Dazu habe ich in dieser Beispielmaske keine Antwort. Bitte wählen Sie eine der vorgeschlagenen Fragen."]);
  }

  /* ---------- Anfangszustand (= Druckfassung): eigenes Dialogbeispiel ---------- */
  el("div", { class: "datum", id: "datum" }, chat, "Montag, " + HEUTE);
  nachricht("nutzer", ["Guten Morgen"], "m-hallo");
  nachricht("assistent", ["Guten Morgen. Ich bin Ihr KI-Assistent für Rechnungswesen und Controlling. Wie kann ich Ihnen helfen?"], "m-gruss");
  nachricht("nutzer", [FRAGEN[0][1]], "m-frage");
  rueckfrage("m-rueckfrage", false);
  nachricht("nutzer", [BASIS.budget.name], "m-auswahl");
  kostenAntwort("budget", "m-antwort", "bericht");
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
          text: "Man fragt, wie man eine Kollegin fragen würde. Der Assistent erkennt Absicht (Abweichungsanalyse), Kennzahl (Kosten), Dimension (Kostenstellen) und Zeitraum (erstes Quartal) und ordnet sie dem Datenmodell zu." },
        { nr: 3, ziel: "m-rueckfrage", versatz: [28, 2], titel: "Rückfrage bei Mehrdeutigkeit",
          text: "„Budget“ kann im Sprachgebrauch das verabschiedete Budget oder den aktuellen Forecast meinen. Der Assistent fragt nach der Vergleichsbasis, statt zu raten – einheitlich definierte Kennzahlen und Szenarien sind Voraussetzung für verlässliche Antworten." },
        { nr: 4, ziel: "m-antwort", versatz: [28, 2], titel: "Antwort als Abweichungsanalyse",
          text: "Der Assistent übersetzt die Frage in eine Abfrage des Datenmodells (Ist gegen Budget je Kostenstelle, Januar bis März) und fasst das Ergebnis in Sätzen zusammen: Anzahl und Summe der Überschreitungen, die größte Abweichung und die Wirkung auf die Gesamtkosten." },
        { nr: 5, ziel: "bericht", versatz: [32, 2], titel: "Kleiner Bericht in der Antwort",
          text: "Der Text fasst zusammen, die Tabelle belegt: Budget, Ist und Abweichung der überschrittenen Kostenstellen, die übrigen Kostenstellen zusammengefasst und die Summe." },
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
          text: "Die Antwort enthält zusätzlich eine kleine Tabelle mit Budget, Ist und Abweichung. Das Original antwortete nur mit Fließtext, aus dem man die Zahlen heraussuchen musste." },
        { nr: "D", ziel: "m-auswahl", anker: "links", versatz: [-2, 2], regel: "STEUERBARKEIT", titel: "Auswahl statt Tippen",
          text: "Auf die Rückfrage antwortet man in der HTML-Fassung mit Auswahlknöpfen (Budget oder Forecast); Fragen lassen sich aus Vorschlägen wählen oder frei eingeben und mit Enter senden." },
        { nr: "E", ziel: "m-antwort", versatz: [28, 2], regel: "ERWARTUNGSKONFORMITÄT", titel: "Deutsche Schreibweisen",
          text: "„Tsd. €“ und „Mio. €“ statt „EUR“, Zahlwörter im Satz („drei von acht“), echtes Minuszeichen und Vorzeichen bei Abweichungen, Datum im Format TT.MM.JJJJ." },
        { nr: "F", ziel: "f-frage", versatz: [-4, -22], regel: "ROBUSTHEIT GEGEN BENUTZUNGSFEHLER", titel: "Keine erfundenen Antworten",
          text: "Leere Eingaben werden nicht gesendet; auf unbekannte Fragen antwortet der Assistent mit einem Hinweis auf die Vorschläge statt mit einer geratenen Zahl." },
        { nr: "G", ziel: "datum", versatz: [26, -2], regel: "BUCHSTIL – NEUTRAL UND AKTUELL", titel: "Eigenes Dialogbeispiel, neutrale Anrede",
          text: "Der Gesprächsverlauf ist ein eigenes Beispiel (Budgetüberschreitungen der Kostenstellen im ersten Quartal 2027) und unabhängig vom Dialog des Originals (Prognose der Umsatzerlöse); alle Zahlen sind erfunden. Anrede „Sie“, der Assistent trägt keinen Produktnamen." },
        { nr: "H", ziel: "k-senden", versatz: [-4, -22], regel: "BUCHSTIL – SOFTWARENEUTRAL", titel: "Text statt Symbole",
          text: "Die Symbole für Zurück, Schließen, Mikrofon und Senden werden zu den Textknöpfen „Spracheingabe“ und „Senden“; „Senden“ ist die einzige Hauptaktion." },
      ],
    },
  });
  MK.fertig();
})();
