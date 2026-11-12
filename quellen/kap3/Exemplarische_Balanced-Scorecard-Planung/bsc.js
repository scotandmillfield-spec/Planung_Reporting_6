/* Abb. 3.182 „Exemplarische Balanced-Scorecard-Planung“ – Logik der Maske.
   Vier Perspektiven mit strategischen Zielen und Kennzahlen; Ist 2026/2027, Plan 2027 (Anzeige), Plan 2028–2030 (Eingabe).
   Tendenz = Veränderung Ist 2027 gegenüber Ist 2026 nach Wirkung: ab 10 % deutlich besser, ab 5 % besser, sonst stabil
   (entspricht den Pfeilen ↑ ↗ → des Originals). Status = Zielerreichung Ist 2027 gegenüber Plan 2027 nach Wirkung:
   über Plan übertroffen, bis 10 % darunter im Rahmen, sonst kritisch (entspricht den Statussymbolen des Originals).
   Abgeleitet: ROS = EBIT / Umsatz; Umsatz neue Produkte = Umsatzanteil neue Produkte × Umsatz.
   Werte des Originals; Beträge als Tsd. € gelesen, Jahre 2007–2011 → 2026–2030. */
(() => {
  "use strict";
  const { el, zahl, pruefeFeld } = MK;
  const $ = id => document.getElementById(id);
  const NBSP = MK.NBSP;

  /* ---------- Stammdaten ----------
     [Kennzahl, Einheit, Nachkommastellen, Ist 2026, Ist 2027, Plan 2027, Plan 2028, Plan 2029, Plan 2030, Wirkung (+1 mehr ist besser), Art] */
  const BSC = [
    { id: "fin", name: "Finanzen", mass: ["Rationalisierung", "Finanzrisiken absichern"], ziele: [
      ["Steigerung der Rentabilität", [
        ["roce", "ROCE", "%", 2, 14.41, 14.93, 16.23, 18.07, 19.76, 21.17, 1],
        ["ros", "ROS", "%", 2, 8.00, 8.22, 9.00, 10.00, 11.00, 12.00, 1, "ros"]]],
      ["Profitables Wachstum", [
        ["umsatz", "Umsatz", "Tsd. €", 0, 200000, 219000, 220000, 242000, 266200, 292820, 1],
        ["ebit", "EBIT", "Tsd. €", 0, 16000, 18000, 19800, 24200, 29282, 35138, 1]]],
      ["Sicherung der Liquidität", [
        ["cf", "Cashflow", "Tsd. €", 0, 16000, 21020, 20460, 24440, 29216, 34821, 1]]]] },
    { id: "kun", name: "Kunden", mass: ["Marktoffensive Asien", "Werbekampagne Europa"], ziele: [
      ["Steigerung Marktanteil", [
        ["ma", "Marktanteil", "%", 2, 20.00, 20.56, 20.95, 22.00, 23.15, 24.40, 1]]],
      ["Kundenzufriedenheit steigern", [
        ["kz", "Kundenzufriedenheit", "%", 2, 80.00, 77.50, 82.50, 85.00, 87.50, 90.00, 1]]],
      ["Kundenbeziehung/-treue verbessern", [
        ["kontakte", "Persönliche Kundenkontakte", "Anzahl", 0, 323, 350, 400, 480, 520, 560, 1],
        ["stamm", "Stammkundenanteil", "%", 2, 46.43, 48.63, 50.00, 50.00, 50.00, 50.00, 1],
        ["stammu", "Stammkundenumsatz", "Tsd. €", 0, 23213, 27716, 30000, 33000, 36300, 39930, 1, "ohne"]]],
      ["Neukundengewinnung", [
        ["neuk", "Anzahl Neukunden", "Anzahl", 0, 6, 10, 8, 8, 8, 8, 1],
        ["neuu", "Neukundenumsatzanteil", "%", 2, 14.18, 14.38, 15.00, 15.00, 15.00, 15.00, 1]]]] },
    { id: "pro", name: "Prozesse", mass: ["Savingprojekt Einkauf", "Prozessoptimierung"], ziele: [
      ["Innovationsfähigkeit verbessern", [
        ["np", "Neue Produkte", "Anzahl", 0, 2, 3, 4, 4, 4, 4, 1],
        ["npa", "Umsatzanteil neue Produkte", "%", 2, 22.25, 23.73, 25.00, 25.00, 25.00, 25.00, 1],
        ["npu", "Umsatz neue Produkte", "Tsd. €", 0, 44500, 51958, 55000, 60500, 66550, 73205, 1, "npu"]]],
      ["Prozessabwicklung optimieren", [
        ["dlz", "Fertigungsdurchlaufzeit", "Tage", 1, 11.8, 10.3, 10.0, 9.5, 9.0, 8.5, -1],
        ["lt", "Liefertreue", "%", 2, 80.73, 83.35, 85.00, 88.00, 91.00, 94.00, 1]]],
      ["Interne Prozesse optimieren", [
        ["fq", "Fehlerquote", "ppm", 0, 3143, 2633, 2500, 2000, 1750, 1500, -1]]]] },
    { id: "pot", name: "Potenziale", mass: ["Qualifikationsprogramm", "Quality-Gates"], ziele: [
      ["Mitarbeitertreue sichern", [
        ["fl", "Fluktuationsquote", "%", 2, 9.00, 8.25, 8.00, 7.00, 6.00, 5.00, -1]]],
      ["Mitarbeiterzufriedenheit steigern", [
        ["mz", "Mitarbeiterzufriedenheit", "%", 2, 70.00, 69.00, 75.00, 80.00, 85.00, 90.00, 1]]],
      ["Mitarbeiter motivieren", [
        ["vv", "Verbesserungsvorschläge", "je MA", 2, 0.73, 1.08, 1.00, 1.20, 1.40, 1.60, 1],
        ["uv", "Umgesetzte Vorschläge", "je MA", 2, 0.36, 0.56, 0.50, 0.60, 0.70, 0.80, 1]]],
      ["Kompetenzsicherung\nund -aufbau", [
        ["adz", "Aufgabendeckungsziffer", "Index", 2, 0.81, 0.88, 0.85, 0.90, 0.95, 1.00, 1],
        ["wb", "Weiterbildungsaufwand", "Tsd. €", 0, 949, 991, 1000, 1050, 1100, 1150, 1]]]] },
  ];
  const JAHRE = [2028, 2029, 2030];
  const KZ = {};   // id -> { name, einheit, nk, ist26, ist27, p27, plan[3], w, art, felder[3] }

  /* ---------- Bewertung wie im Original ---------- */
  function tendenz(k) {
    const d = (k.ist27 - k.ist26) / Math.abs(k.ist26) * k.w;
    return d >= 0.10 ? "deutlich besser" : d >= 0.05 ? "besser" : d > -0.05 ? "stabil" : d > -0.10 ? "schlechter" : "deutlich schlechter";
  }
  function status(k) {
    const e = (k.ist27 - k.p27) / Math.abs(k.p27) * k.w;
    return e > 0 ? "übertroffen" : e >= -0.10 ? "im Rahmen" : "kritisch";
  }

  /* ---------- Maske aufbauen (vor MK.init, damit die Bänder klappbar werden) ---------- */
  const ziel = $("perspektiven");
  BSC.forEach(p => {
    const ab = el("section", { class: "mk-abschnitt", id: "a-" + p.id }, ziel);
    const band = el("div", { class: "mk-band", id: "band-" + p.id }, ab, p.name);
    const m = el("span", { class: "massnahmen", id: "mass-" + p.id }, band, "Maßnahmen: " + p.mass.join(" · "));
    const neu = el("a", { class: "mk-link", id: "neu-" + p.id, tabindex: "0", role: "button" }, m, "Maßnahmen pflegen");
    const anlegen = e => { e.stopPropagation(); e.preventDefault();
      MK.meldung(`Beispiel: Maßnahmen zur Perspektive ${p.name} pflegen – anlegen, ändern, mit Ziel, Verantwortlichem, Termin und Budget. Nicht hinterlegt.`); };
    neu.addEventListener("click", anlegen);
    neu.addEventListener("keydown", e => { if (e.key === "Enter") anlegen(e); });
    const r = el("div", { class: "raster" }, ab);
    p.ziele.forEach(([zielText, kennzahlen], zi) => {
      el("div", { class: "st", id: `st-${p.id}-${zi}`, style: `grid-row: span ${kennzahlen.length}` }, r, zielText);
      kennzahlen.forEach((d, ki) => {
        const [id, name, einheit, nk, ist26, ist27, p27, p28, p29, p30, w, art] = d;
        const k = KZ[id] = { id, name, einheit, nk, ist26, ist27, p27, plan: [p28, p29, p30], w, art: art || "" };
        const ende = ki === kennzahlen.length - 1 ? " ende" : "";
        const suffix = { "%": " in %", "Tsd. €": " in Tsd. €", "Tage": " in Tagen", "ppm": " in ppm", "je MA": " je MA" }[einheit] || "";
        el("div", { class: "kz" + ende, id: "kz-" + id }, r, name + suffix);
        el("div", { class: "mk-feld mk-anzeige mk-zahl" + ende }, r, zahl(ist26, nk));
        el("div", { class: "mk-feld mk-anzeige mk-zahl" + ende, id: "i27-" + id }, r, zahl(ist27, nk));
        el("div", { class: "mk-feld mk-anzeige" + ende, id: "t-" + id }, r, k.art === "ohne" || k.art === "npu" ? "" : tendenz(k));
        el("div", { class: "mk-feld mk-anzeige mk-zahl" + ende, id: "p27-" + id }, r, zahl(p27, nk));
        el("div", { class: "mk-feld mk-anzeige" + ende, id: "s-" + id }, r, k.art === "ohne" || k.art === "npu" ? "" : status(k));
        k.felder = JAHRE.map((j, n) => el("input", { class: "mk-feld mk-zahl" + ende, id: `p${j}-${id}`, inputmode: "decimal", value: zahl(k.plan[n], nk),
              "aria-label": `${name}, Plan ${j} in ${einheit}`, "data-hilfe": `Planwert ${j} in ${einheit}, ${nk ? nk + " Nachkommastelle" + (nk > 1 ? "n" : "") : "ganze Zahl"}` }, r));
      });
    });
  });

  MK.init({ titel: "Exemplarische Balanced-Scorecard-Planung" });

  /* ---------- Abgeleitete Kennzahlen ---------- */
  // ROS und Umsatz neue Produkte sind ebenfalls pflegbar: Eine Eingabe dort rechnet EBIT bzw. Umsatzanteil zurück.
  const setze = (k, n, nk) => { const f = k.felder[n]; if (f !== document.activeElement) { f.value = k.plan[n] == null ? "" : zahl(k.plan[n], nk); f.classList.remove("mk-fehler"); } };
  function ableiten(quelle) {
    JAHRE.forEach((j, n) => {
      const u = KZ.umsatz.plan[n];
      if (quelle === KZ.ros && KZ.ros.plan[n] != null && u > 0) { KZ.ebit.plan[n] = Math.round(KZ.ros.plan[n] / 100 * u); setze(KZ.ebit, n, 0); }
      if (quelle === KZ.npu && KZ.npu.plan[n] != null && u > 0) { KZ.npa.plan[n] = Math.round(KZ.npu.plan[n] / u * 10000) / 100; setze(KZ.npa, n, 2); }
      const e = KZ.ebit.plan[n], a = KZ.npa.plan[n];
      if (quelle !== KZ.ros) KZ.ros.plan[n] = u > 0 && e != null ? Math.round(e / u * 10000) / 100 : null;
      if (quelle !== KZ.npu) KZ.npu.plan[n] = u != null && a != null ? Math.round(a / 100 * u) : null;
      setze(KZ.ros, n, 2); setze(KZ.npu, n, 0);
    });
  }

  /* ---------- Eingaben: prüfen, übernehmen, Zielpfad prüfen ---------- */
  Object.values(KZ).forEach(k => k.felder.forEach((f, n) => {
    if (f.tagName !== "INPUT") return;
    const opt = { min: 0, max: k.einheit === "%" ? 100 : 1e7, pflicht: true,
      meldung: `Planwert in ${k.einheit}${k.einheit === "%" ? " zwischen 0 und 100" : " ab 0"}, Dezimalkomma` };
    f.addEventListener("input", () => {
      const v = pruefeFeld(f, "zahl", opt);
      k.plan[n] = f.classList.contains("mk-fehler") ? null : v;
      ableiten(k);
    });
    f.addEventListener("change", () => {
      if (f.classList.contains("mk-fehler") || k.plan[n] == null) return;
      const vorher = n === 0 ? k.p27 : k.plan[n - 1];
      if (vorher != null && (k.plan[n] - vorher) * k.w < 0)
        MK.meldung(`Hinweis: Plan ${JAHRE[n]} für ${k.name} liegt hinter ${n === 0 ? "Plan 2027" : "Plan " + JAHRE[n - 1]} zurück – Zielpfad prüfen.`);
    });
    f.addEventListener("blur", () => { if (!f.classList.contains("mk-fehler") && k.plan[n] != null) f.value = zahl(k.plan[n], k.nk); });
  }));
  ableiten();

  /* ---------- Klappen ohne Maßstabssprung (wie Abb. 3.7) ---------- */
  if (!MK.PRINT) {
    const maske = $("bsc"), seite = $("seite"), rahmen = seite.parentElement;
    let alt = null;
    const merken = e => { if (e.target.closest && e.target.closest(".mk-band") && !e.target.closest("a")) alt = seite.style.transform; };
    const halten = e => {
      if (alt === null || !(e.target.closest && e.target.closest(".mk-band"))) return;
      const s = parseFloat((/scale\(([\d.]+)\)/.exec(alt) || [0, 1])[1]);
      seite.style.transform = alt; alt = null;
      rahmen.style.width = maske.offsetWidth * s + "px"; rahmen.style.height = maske.offsetHeight * s + "px";
      if (MK._ebenenNeu) MK._ebenenNeu();
    };
    ["click", "keydown"].forEach(t => { maske.addEventListener(t, merken, true); maske.addEventListener(t, halten); });
  }

  /* ---------- Lernplattform: Erläuterungen und Gestaltung ---------- */
  MK.ebenen({
    erlaeuterungen: {
      titel: "Erläuterungen",
      intro: "Was die Bereiche der Maske in der Balanced-Scorecard-Planung leisten. Die Nummern in der Maske zeigen, wo.",
      eintraege: [
        { nr: 1, ziel: "band-fin", anker: "links", versatz: [140, 1], titel: "Vier Perspektiven",
          text: "Die Balanced Scorecard plant nicht nur Finanzkennzahlen: Kunden, interne Prozesse und Potenziale (Mitarbeiter, Wissen) stehen gleichrangig daneben. Jede Perspektive ist ein Abschnitt, der sich auf- und zuklappen lässt." },
        { nr: 2, ziel: "st-kun-2", versatz: [-6, 1], titel: "Strategische Ziele und Kennzahlen",
          text: "Jedem strategischen Ziel sind eine oder mehrere Kennzahlen zugeordnet, die seine Erreichung messen – etwa „Kundenbeziehung/-treue verbessern“ mit Kundenkontakten, Stammkundenanteil und Stammkundenumsatz." },
        { nr: 3, ziel: "sk-tendenz", versatz: [-2, 1], titel: "Tendenz",
          text: "Die Tendenz vergleicht Ist 2027 mit Ist 2026 nach der Wirkung: Bei Fehlerquote, Durchlaufzeit und Fluktuation ist weniger besser. Ab 10 % Verbesserung „deutlich besser“, ab 5 % „besser“, sonst „stabil“." },
        { nr: 4, ziel: "sk-status", versatz: [-1, 1], titel: "Status der Zielerreichung",
          text: "Der Status vergleicht Ist 2027 mit Plan 2027: „übertroffen“, „im Rahmen“ (bis 10 % unter Plan) oder „kritisch“. Kritisch sind die persönlichen Kundenkontakte (350 statt 400) und die neuen Produkte (3 statt 4)." },
        { nr: 5, ziel: "p2028-kontakte", anker: "links", versatz: [29, 3], titel: "Mehrjährige Zielwerte",
          text: "Geplant werden die Zielwerte für drei Jahre (Plan 2028 bis 2030) – die strategische Planung gibt den Zielpfad vor, aus dem die operative Jahresplanung abgeleitet wird. Weicht ein Wert vom Zielpfad ab, erscheint ein Hinweis." },
        { nr: 6, ziel: "p2028-ros", anker: "links", versatz: [29, 3], titel: "Abgeleitete Kennzahlen",
          text: "ROS ergibt sich aus EBIT und Umsatz, der Umsatz mit neuen Produkten aus Umsatzanteil und Umsatz. Ändern Sie Umsatz oder EBIT 2028: Beide Werte folgen sofort. Umgekehrt lässt sich auch ein ROS-Ziel eingeben – dann wird der EBIT zurückgerechnet." },
        { nr: 7, ziel: "t-npu", anker: "links", versatz: [30, 3], titel: "Ursache-Wirkungs-Kette",
          text: "Die Perspektiven hängen zusammen: Qualifizierte, motivierte Mitarbeiter verbessern Prozesse und Innovation, das steigert Kundenzufriedenheit und Umsatz. Hier greift der Umsatz der Finanzperspektive direkt in die Prozessperspektive." },
        { nr: 8, ziel: "mass-kun", anker: "links", versatz: [0, 0], titel: "Maßnahmen",
          text: "Zu jeder Perspektive gehören strategische Maßnahmen, mit denen die Ziele erreicht werden sollen, etwa eine Marktoffensive in Asien. Über „Maßnahmen pflegen“ werden sie je Perspektive angelegt und geändert." },
      ],
    },
    gestaltung: {
      titel: "Gestaltung",
      intro: "Was gegenüber dem Original geändert wurde – softwareneutral im Buchstil und nach den Interaktionsprinzipien der DIN EN ISO 9241-110.",
      eintraege: [
        { nr: "A", ziel: "kopf-titel", versatz: [30, 2], regel: "BUCHSTIL – SOFTWARENEUTRAL", titel: "Kein Fenster, keine Farbflächen",
          text: "Blaue Rahmen und Kopfbalken, gelb hinterlegte Auswahlzeilen und gelbe Knöpfe des Originals entfallen; die Seite trägt einen Titel wie die Dashboards. Die Knöpfe „Uebersicht“ je Perspektive entfallen, die Abschnitte lassen sich stattdessen klappen." },
        { nr: "B", ziel: "sk-tendenz", versatz: [-4, 1], regel: "SELBSTBESCHREIBUNGSFÄHIGKEIT", titel: "Wörter statt Pfeile",
          text: "Die Tendenzpfeile (↑, ↗, →) heißen „deutlich besser“, „besser“ und „stabil“ – bei Fehlerquote oder Durchlaufzeit zeigte ein Pfeil nach oben eine sinkende Zahl, das war missverständlich." },
        { nr: "C", ziel: "sk-status", versatz: [-4, 1], regel: "BUCHSTIL – NEUTRAL UND AKTUELL", titel: "Status in Worten statt Symbolen",
          text: "Häkchen, Ausrufezeichen und grünes Symbol werden zu „im Rahmen“, „kritisch“ und „übertroffen“ – auch im Graustufendruck lesbar. Die Regel dahinter steht in den Erläuterungen." },
        { nr: "D", ziel: "kz-umsatz", versatz: [-6, 0], regel: "SELBSTBESCHREIBUNGSFÄHIGKEIT", titel: "Einheit in der Beschriftung",
          text: "Die Einheit steht einmal in der Beschriftung der Kennzahl statt an jeder Zahl („200,000.00[EUR]“, „# 323“, „0.73 p/MA“); Dezimalkomma und Tausenderpunkt statt englischem Format." },
        { nr: "E", ziel: "p2028-neuk", anker: "links", versatz: [29, 3], regel: "SELBSTBESCHREIBUNGSFÄHIGKEIT", titel: "Eingabe und Anzeige unterscheidbar",
          text: "Alle Planwerte 2028 bis 2030 sind Eingaben (weiß), auch ROS und Umsatz neuer Produkte; Ist, Plan 2027, Tendenz und Status sind grau. Im Original sahen alle Zellen gleich aus." },
        { nr: "F", ziel: "t-stammu", anker: "links", versatz: [30, 3], regel: "ERWARTUNGSKONFORMITÄT", titel: "Eindeutige Bezeichnungen",
          text: "„Stammkundenumsatz mit ext. Kunden“ stand zweimal da, einmal in % und einmal in €: jetzt Stammkundenanteil und Stammkundenumsatz. Ebenso Neukundenumsatzanteil, Weiterbildungsaufwand; „Vorschlaege“ und „fuer“ mit Umlaut." },
        { nr: "G", ziel: "p2029-lt", anker: "links", versatz: [29, 3], regel: "ROBUSTHEIT GEGEN BENUTZUNGSFEHLER", titel: "Eingaben werden geprüft",
          text: "Ungültige Werte werden rot markiert und nicht übernommen, Prozentwerte nur zwischen 0 und 100. Fällt ein Planwert hinter das Vorjahr zurück, weist die Maske darauf hin." },
        { nr: "H", ziel: "kopf-info", anker: "links", versatz: [0, 2], regel: "BUCHSTIL – NEUTRAL UND AKTUELL", titel: "Aktuelle Jahre",
          text: "Ist 2007/2008, Plan 2008 und Plan 2009–2011 werden zu Ist 2026/2027, Plan 2027 und Plan 2028–2030. Beträge als Tsd. € gelesen (Original: [EUR] ohne Größenordnung)." },
      ],
    },
  });
  MK.fertig();
})();
