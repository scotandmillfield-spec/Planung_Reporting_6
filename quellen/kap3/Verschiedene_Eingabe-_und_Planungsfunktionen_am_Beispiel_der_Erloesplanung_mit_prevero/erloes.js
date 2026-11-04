/* Abb. 3.179 „Verschiedene Eingabe- und Planungsfunktionen am Beispiel der Erlösplanung“ – Logik des Arbeitsblatts.
   1. Prognose des Gesamterlöses aus den Vorjahren (Durchschnitt Ist 2025, Ist 2026, Forecast 2027 = 151,7)
   2. Vertikale Verteilung der Vorgabe von Gesamt auf die Einzelprodukte (wie Forecast 2027)
   3. Horizontale Verteilung der Jahresvorgaben auf die Monate (Saisonverlauf Ist 2026)
   4. Manuelle Korrektur der Monatswerte; Budget = Summe der Monate
   5. Ergebnisvorschau: Umsatzziel (= Vorgabe Gesamt) gegen aktuelle Planung (= Budget Gesamt)
   Werte in Zehnteln Tsd. € (ganze Zahlen), Verteilung mit Restausgleich – Summen stimmen exakt.
   Werte des Originals (Umsatz in €) in Tsd. € übernommen; Nov/Dez im Original abgeschnitten, ergänzt. */
(() => {
  "use strict";
  const { el, zahl, pruefeFeld } = MK;
  MK.init({ titel: "Verschiedene Eingabe- und Planungsfunktionen am Beispiel der Erlösplanung" });
  const $ = id => document.getElementById(id);
  const PRINT = MK.PRINT;

  /* ---------- Stammdaten (Zehntel Tsd. €) ---------- */
  const MONATE = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
  const BLAETTER = ["Carving 100X", "Speed 200X", "Freestyle Xtreme", "Speed Xtreme", "Rennrad 100", "Rennrad 200", "Fun 100S", "Inline 200S"];
  // Ist 2025, Ist 2026, Forecast 2027 je Produkt
  const HIST = [[322, 258, 288], [272, 309, 360], [269, 285, 245], [250, 229, 202], [79, 117, 98], [115, 128, 108], [125, 97, 94], [87, 98, 116]];
  // Stand im Original: Vorgabe verteilt wie Forecast 2027; Monatswerte teils manuell korrigiert, drei Produkte noch nicht geplant
  const VORGABE0 = [289, 362, 246, 203, 98, 108, 94, 117];
  const MONATE0 = [
    [80, 16, 37, 17, 26, 26, 16, 26, 16, 52, 34, 22],
    [48, 53, 54, 22, 7, 14, 7, 7, 7, 36, 36, 33],
    [50, 20, 25, 6, 11, 6, 12, 17, 16, 42, 12, 39],
    [80, 18, 11, 6, 18, 6, 6, 11, 18, 17, 13, 51],
    [8, 5, 2, 8, 16, 5, 23, 12, 7, 3, 3, 9],
    null, null, null];
  // Saisonverlauf Ist 2026 je Produkt in % (Verteilungskurve für die horizontale Verteilung)
  const SKI = [18, 10, 8, 3, 1, 1, 1, 2, 5, 12, 17, 22], BOARD = [16, 11, 9, 3, 1, 1, 1, 2, 5, 13, 18, 20];
  const RAD = [2, 4, 8, 12, 14, 14, 13, 11, 9, 6, 3, 4], SKATE = [3, 4, 8, 11, 13, 13, 12, 10, 8, 6, 5, 7];
  const SAISON = [SKI, SKI, BOARD, BOARD, RAD, RAD, SKATE, SKATE];
  // Zeilen: Name, Ebene, Blätter
  const ZEILEN = [
    ["Gesamt", 0, [0, 1, 2, 3, 4, 5, 6, 7]], ["Wintersport", 1, [0, 1, 2, 3]], ["Ski", 2, [0, 1]],
    ["Carving 100X", 3, [0]], ["Speed 200X", 3, [1]], ["Snowboard", 2, [2, 3]],
    ["Freestyle Xtreme", 3, [2]], ["Speed Xtreme", 3, [3]], ["Sommersport", 1, [4, 5, 6, 7]],
    ["Fahrräder", 2, [4, 5]], ["Rennrad 100", 3, [4]], ["Rennrad 200", 3, [5]],
    ["Skates", 2, [6, 7]], ["Fun 100S", 3, [6]], ["Inline 200S", 3, [7]],
  ].map(([name, ebene, blaetter]) => ({ name, ebene, blaetter, blatt: ebene === 3 }));

  let VORG = VORGABE0.slice(), MON = MONATE0.map(m => m && m.slice());
  const summe = a => a.reduce((s, v) => s + v, 0);
  const text = v => (v == null ? "" : zahl(v / 10, 1));
  function verteile(ziel, gewichte) {
    const n = gewichte.length;
    let W = summe(gewichte);
    const g = W > 0 ? gewichte : gewichte.map(() => 1);
    if (W <= 0) W = n;
    const exakt = g.map(x => ziel * x / W);
    const teil = exakt.map(Math.floor);
    exakt.map((x, i) => [x - teil[i], g[i], i]).sort((a, b) => b[0] - a[0] || b[1] - a[1])
      .slice(0, ziel - summe(teil)).forEach(([, , i]) => { teil[i] += 1; });
    return teil;
  }

  /* ---------- Tabelle aufbauen ---------- */
  const mx = $("mx"), k2 = $("kopf2");
  el("div", { class: "mx-k links" }, k2, "Umsatz in Tsd. €");
  ["2025", "2026", "2027", "2028", "2028"].forEach(j => el("div", { class: "mx-k" }, k2, j));
  MONATE.forEach(m => el("div", { class: "mx-k" }, k2, m));
  const HILFE_V = "Vorgabe in Tsd. € – bei Summenzeilen mit Enter auf die Produkte verteilt";
  const HILFE_M = "Monatswert in Tsd. € – manuell korrigierbar";
  ZEILEN.forEach((r, z) => {
    const zeile = el("div", { class: "mx-zeile" + (r.blatt ? "" : " eltern"), id: "z" + z, role: "row" }, mx);
    el("div", { class: "mx-l", id: "l" + z, style: `padding-left:${r.ebene * 12}px` }, zeile, r.name);
    r.hist = [0, 1, 2].map(k => el("div", { class: "mk-feld mk-anzeige mk-zahl" }, zeile));
    r.vorgabe = el("input", { class: "mk-feld mk-zahl trenn", id: `v${z}`, inputmode: "decimal", "aria-label": `${r.name}, Vorgabe 2028`,
      "data-hilfe": r.blatt ? "Vorgabe in Tsd. € – Summen und Ergebnisvorschau folgen sofort" : HILFE_V }, zeile);
    r.budget = el("div", { class: "mk-feld mk-anzeige mk-zahl", id: `b${z}` }, zeile);
    r.monate = MONATE.map((m, k) => r.blatt
      ? el("input", { class: "mk-feld mk-zahl" + (k === 0 ? " trenn" : ""), id: `m${z}-${k}`, inputmode: "decimal",
          "aria-label": `${r.name}, ${m} 2028`, "data-hilfe": HILFE_M }, zeile)
      : el("div", { class: "mk-feld mk-anzeige mk-zahl" + (k === 0 ? " trenn" : ""), id: `m${z}-${k}` }, zeile));
  });

  /* ---------- Rechnen und Anzeigen ---------- */
  const vorgabe = r => summe(r.blaetter.map(i => VORG[i]));
  const geplant = r => r.blaetter.filter(i => MON[i]);
  const monat = (r, k) => (geplant(r).length ? summe(geplant(r).map(i => MON[i][k])) : null);
  const budget = r => (geplant(r).length ? summe(geplant(r).map(i => summe(MON[i]))) : null);
  function prognose() {
    const g = [0, 1, 2].map(k => summe(HIST.map(h => h[k])));
    const v = $("f-prognose").value;
    return v === "fc" ? g[2] : v === "trend" ? Math.max(0, Math.round(g[2] + (g[2] - g[0]) / 2)) : Math.round(summe(g) / 3);
  }
  function anzeigen() {
    const aktiv = document.activeElement;
    const setze = (f, v) => { if (f !== aktiv) { if (f.tagName === "INPUT") f.value = text(v); else f.textContent = text(v); } };
    ZEILEN.forEach(r => {
      r.hist.forEach((f, k) => { f.textContent = text(summe(r.blaetter.map(i => HIST[i][k]))); });
      setze(r.vorgabe, vorgabe(r));
      r.budget.textContent = text(budget(r));
      r.monate.forEach((f, k) => setze(f, monat(r, k)));
    });
    $("f-prognosewert").textContent = text(prognose());
    const ziel = vorgabe(ZEILEN[0]), plan = budget(ZEILEN[0]) || 0;
    $("f-ziel").textContent = text(ziel);
    $("f-planung").textContent = text(plan);
    $("f-erreichung").textContent = ziel > 0 ? zahl(plan / ziel * 100, 1) + MK.NBSP + "%" : "–";
  }
  function gewichteVertikal(blaetter) {
    const s = $("f-vertikal").value;
    return blaetter.map(i => (s === "fc" ? HIST[i][2] : s === "ist" ? HIST[i][1] : 1));
  }
  function vertikal(r, ziel) {
    const w = verteile(ziel, gewichteVertikal(r.blaetter));
    r.blaetter.forEach((i, n) => { VORG[i] = w[n]; });
  }

  /* ---------- Eingaben ---------- */
  const PRUEF = { min: 0, max: 99999.9, meldung: "Betrag in Tsd. € ab 0 mit Dezimalkomma, z. B. 28,9" };
  ZEILEN.forEach(r => {
    const f = r.vorgabe;
    f.addEventListener("input", () => {
      const v = pruefeFeld(f, "zahl", PRUEF);
      if (r.blatt && v !== null && !f.classList.contains("mk-fehler")) { VORG[r.blaetter[0]] = Math.round(v * 10); anzeigen(); }
    });
    const uebernehmen = () => {
      const v = pruefeFeld(f, "zahl", PRUEF);
      if (f.classList.contains("mk-fehler")) return;
      if (v !== null && !r.blatt && Math.round(v * 10) !== vorgabe(r)) {
        vertikal(r, Math.round(v * 10));
        MK.meldung(`Vorgabe ${r.name} ${text(Math.round(v * 10))} Tsd. € ${$("f-vertikal").selectedOptions[0].text} auf ${r.blaetter.length} Produkte verteilt.`);
      }
      f.value = text(vorgabe(r)); anzeigen();
    };
    f.addEventListener("change", uebernehmen);
    f.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); uebernehmen(); f.select(); } });
    f.addEventListener("blur", () => { if (!f.classList.contains("mk-fehler")) f.value = text(vorgabe(r)); });
    if (!r.blatt) return;
    const i = r.blaetter[0];
    r.monate.forEach((m, k) => {
      m.addEventListener("input", () => {
        const v = pruefeFeld(m, "zahl", PRUEF);
        if (v === null || m.classList.contains("mk-fehler")) return;
        if (!MON[i]) MON[i] = MONATE.map(() => 0);
        MON[i][k] = Math.round(v * 10); anzeigen();
      });
      m.addEventListener("blur", () => { if (!m.classList.contains("mk-fehler")) m.value = text(MON[i] ? MON[i][k] : null); });
    });
  });

  /* ---------- Planungsfunktionen ---------- */
  $("f-prognose").addEventListener("change", anzeigen);
  $("k-prognose").addEventListener("click", () => {
    vertikal(ZEILEN[0], prognose()); anzeigen();
    MK.meldung(`Prognose ${text(prognose())} Tsd. € als Vorgabe Gesamt übernommen und ${$("f-vertikal").selectedOptions[0].text} auf die Produkte verteilt.`);
  });
  $("k-vertikal").addEventListener("click", () => {
    vertikal(ZEILEN[0], vorgabe(ZEILEN[0])); anzeigen();
    MK.meldung(`Vorgabe Gesamt ${$("f-vertikal").selectedOptions[0].text} auf die Einzelprodukte verteilt.`);
  });
  $("k-horizontal").addEventListener("click", () => {
    const saison = $("f-horizontal").value === "saison";
    BLAETTER.forEach((_, i) => { MON[i] = verteile(VORG[i], saison ? SAISON[i] : MONATE.map(() => 1)); });
    document.querySelectorAll("#erloes .mk-fehler").forEach(f => f.classList.remove("mk-fehler"));
    anzeigen();
    MK.meldung(`Jahresvorgaben aller ${BLAETTER.length} Produkte ${saison ? "nach dem Saisonverlauf Ist 2026" : "gleichmäßig"} auf die Monate verteilt – Budget = Vorgabe.`);
  });
  anzeigen();

  /* ---------- Klappen ohne Maßstabssprung (wie Abb. 3.7) ---------- */
  if (!PRINT) {
    const maske = $("erloes"), seite = $("seite"), rahmen = seite.parentElement;
    let alt = null;
    const merken = e => { if (e.target.closest && e.target.closest(".mk-band")) alt = seite.style.transform; };
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
      intro: "Wie die Eingabe- und Planungsfunktionen in der Erlösplanung zusammenwirken. Die Nummern in der Maske zeigen, wo – die Funktionen 1 bis 5 lassen sich ausprobieren.",
      eintraege: [
        { nr: 1, ziel: "k-prognose", versatz: [24, 2], titel: "Prognose aus den Vorjahren",
          text: "Ausgangspunkt ist eine Prognose der Produkterlöse gesamt: hier der Durchschnitt aus Ist 2025, Ist 2026 und Forecast 2027 = 151,7 Tsd. €. „Übernehmen“ setzt sie als Vorgabe Gesamt. Alternativ: Forecast fortschreiben oder linearer Trend." },
        { nr: 2, ziel: "v3", anker: "links", versatz: [29, 1], titel: "Vertikale Verteilung (top-down)",
          text: "Die Vorgabe Gesamt wird auf die Einzelprodukte heruntergebrochen, im Beispiel wie die Basisperiode Forecast 2027: Carving 100X erhält 28,9 von 151,7 Tsd. €. Eine neue Summe in einer Zeile wie Wintersport wird mit Enter auf deren Produkte verteilt." },
        { nr: 3, ziel: "k-horizontal", versatz: [24, 2], titel: "Horizontale Verteilung",
          text: "Die Jahresvorgaben werden automatisch auf die Monate verteilt, nach einer Verteilungskurve – hier dem Saisonverlauf des Ist 2026: Ski im Winter, Fahrräder im Sommer. Danach ist das Budget gleich der Vorgabe." },
        { nr: 4, ziel: "k-monate", versatz: [-4, -1], titel: "Manuelle Korrektur je Monat",
          text: "Die Planer korrigieren die Monatswerte, etwa Carving 100X im Januar auf 8,0 Tsd. € für eine Messeaktion. Das Budget ist die Summe der Monate; bei Carving 100X liegt es mit 36,8 Tsd. € über der Vorgabe von 28,9." },
        { nr: 5, ziel: "l11", versatz: [-4, 1], titel: "Noch nicht geplant",
          text: "Für Rennrad 200, Fun 100S und Inline 200S fehlen noch Monatswerte: Die Bottom-up-Planung ist unvollständig, das Budget der Summenzeilen enthält nur die geplanten Produkte." },
        { nr: 6, ziel: "f-erreichung", versatz: [24, 2], titel: "Ergebnisvorschau",
          text: "Umsatzziel ist die Vorgabe Gesamt, aktuelle Planung das Budget aus den Monatswerten. Mit 86,0 % ist das Ziel noch nicht erreicht: Fehlende Produkte planen oder Werte nachbessern – Vorgabe und Planung werden im Gegenstromverfahren abgestimmt." },
        { nr: 7, ziel: "g-auswahl", versatz: [-4, 0], titel: "Planungsobjekt",
          text: "Geplant wird je Vertriebsgebiet, Kunde und Planungsdurchlauf. Jeder Durchlauf ist eine eigene Variante; so bleibt der erste Stand erhalten, wenn nachgeplant wird." },
        { nr: 8, ziel: "b3", anker: "links", versatz: [29, 1], titel: "Vorgabe und Budget nebeneinander",
          text: "Top-down-Vorgabe und Bottom-up-Budget stehen je Produkt nebeneinander. Die Differenz zeigt, wo die Planer von der Vorgabe abweichen – Grundlage für das Abstimmungsgespräch." },
      ],
    },
    gestaltung: {
      titel: "Gestaltung",
      intro: "Was gegenüber dem Original geändert wurde – softwareneutral im Buchstil und nach den Interaktionsprinzipien der DIN EN ISO 9241-110.",
      eintraege: [
        { nr: "A", ziel: "kopf-titel", versatz: [-4, 4], regel: "BUCHSTIL – SOFTWARENEUTRAL", titel: "Kein Fenster, kein Logo",
          text: "Fensterrahmen, Menü- und Symbolleiste, Produktname und Logo, die grüne Navigationsleiste (Prozess, Planung, Simulation, Reporting), die Statusleiste mit Benutzer und Server und die Bildlaufleisten entfallen; ebenso der zugeklappte Abschnitt „Planungsvorgaben“." },
        { nr: "B", ziel: "g-funktionen", versatz: [-4, 0], regel: "AUFGABENANGEMESSENHEIT", titel: "Funktionen in Arbeitsreihenfolge",
          text: "Im Original steckten die Funktionen als kleine Knöpfe in den Spaltenköpfen („∅“, „…“, „reset“, „refresh“) und als Auswahl je Zeile. Jetzt stehen Prognose, vertikale und horizontale Verteilung nummeriert über der Tabelle; die Sprechblasen 1 bis 5 des Originals sind zu Beschriftungen geworden." },
        { nr: "C", ziel: "f-vertikal", anker: "links", versatz: [0, 2], regel: "SELBSTBESCHREIBUNGSFÄHIGKEIT", titel: "Klartext statt Kürzel",
          text: "„WBJ“ (wie Basisjahr) heißt „wie Forecast 2027“ bzw. „Saisonverlauf Ist 2026“, „BUD“ Budget, „FC 1“ Forecast. Die Einheit Tsd. € steht im Spaltenkopf; das Original zeigte volle Beträge ohne Einheit." },
        { nr: "D", ziel: "b2", anker: "links", versatz: [29, 1], regel: "SELBSTBESCHREIBUNGSFÄHIGKEIT", titel: "Eingabe und Anzeige unterscheidbar",
          text: "Vorgaben und Monatswerte der Produkte sind weiß (Eingabe), Ist, Forecast, Budget und die Summen der Monatswerte grau (berechnet). Im Original waren Eingabe- und Anzeigezellen kaum zu unterscheiden." },
        { nr: "E", ziel: "f-planung", versatz: [24, 2], regel: "BUCHSTIL – NEUTRAL UND AKTUELL", titel: "Zahl statt Ampel",
          text: "Der gelbe Ampelpunkt wird zur Zielerreichung in Prozent. Das Umsatzziel von 13.000.000 € passte nicht zu den Zeilen der Tabelle; es ist jetzt die Vorgabe Gesamt." },
        { nr: "F", ziel: "l1", versatz: [-4, 1], regel: "AUFGABENANGEMESSENHEIT", titel: "Nur Umsatz, eine Ebene weniger",
          text: "Die Zeilen „Absatzmenge“ entfallen aus Platzgründen, ebenso die Ebene „Outdoor“, die mit Gesamt identisch war. Das im Original abgeschnittene zweite Skate-Produkt ist als „Inline 200S“ ergänzt, damit die Summen stimmen." },
        { nr: "G", ziel: "v4", anker: "links", versatz: [29, 1], regel: "ROBUSTHEIT GEGEN BENUTZUNGSFEHLER", titel: "Eingaben werden geprüft",
          text: "Ungültige oder negative Beträge werden rot markiert und nicht übernommen. Summenzeilen verteilen erst mit Enter oder beim Verlassen des Felds." },
        { nr: "H", ziel: "f-kunde", anker: "links", versatz: [0, 2], regel: "BUCHSTIL – NEUTRAL UND AKTUELL", titel: "Keine echten Namen, aktuelle Jahre",
          text: "Der Kundenname des Originals (ein reales Handelsunternehmen) ist durch „Sportfachhandel“ ersetzt, die Rolle „GL Administrator“ entfällt. Ist 2009/2010, FC 2011 und BUD 2012 werden zu Ist 2025/2026, Forecast 2027 und Budget 2028." },
      ],
    },
  });
  MK.fertig();
})();
