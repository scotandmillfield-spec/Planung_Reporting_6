/* Abb. 3.180 „Integrierte Planungsfunktionen …“ – Logik der Planungsseite „Verteilung und Verdichtung“.
   Jede Zelle ist eingabefähig:
   – Einzelwert (Produkt × Monat): Verdichtung – Summen von Sorte, Monat, Jahr und das Diagramm folgen sofort.
   – Summenzelle (Jahr, Sorte, Gesamt): Verteilung – der neue Wert wird proportional zu den bisherigen Werten
     auf die darunterliegenden Einzelwerte verteilt (mit Enter oder beim Verlassen des Felds).
   Gerechnet wird in Zehnteln Tsd. € (ganze Zahlen); Rundungsreste gehen an die größten Nachkommaanteile,
   so stimmen alle Summen exakt. Werte des Originals (Gesamt 20.000.000) in Tsd. € übernommen. */
(() => {
  "use strict";
  const { el, zahl, leseZahl, pruefeFeld } = MK;
  MK.init({ titel: "Integrierte Planungsfunktionen in einem Bericht" });
  const $ = id => document.getElementById(id);
  const PRINT = MK.PRINT;

  /* ---------- Stammdaten ---------- */
  const MONATE = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
  const SORTEN = ["Apfel", "Cola", "Orange", "Tonic"];
  const PRODUKTE = [[0, "0,5 l Flasche"], [0, "0,5 l Dose"],
                    [1, "0,5 l Flasche"], [1, "0,5 l Dose"], [1, "20 l Fass"], [1, "30 l Fass"],
                    [2, "0,5 l Flasche"], [2, "0,5 l Dose"], [2, "30 l Fass"],
                    [3, "0,5 l Flasche"], [3, "0,5 l Dose"]];
  // Umsatz 2028 in Zehnteln Tsd. € (= 100 €) je Produkt und Monat; Summe 200.000 = 20.000,0 Tsd. €
  const BASIS = [
    [20, 12, 24, 50, 73, 65, 42, 38, 31, 26, 29, 62],
    [43, 42, 65, 113, 182, 119, 114, 92, 86, 74, 52, 183],
    [127, 99, 138, 295, 457, 304, 234, 245, 191, 168, 161, 303],
    [5061, 4320, 7185, 10696, 21882, 16680, 12787, 10455, 9354, 7061, 7703, 13659],
    [1222, 626, 616, 1116, 1332, 1087, 759, 683, 644, 777, 1029, 1242],
    [390, 264, 1184, 408, 730, 453, 387, 359, 339, 325, 410, 559],
    [25, 19, 24, 46, 81, 52, 43, 39, 36, 33, 31, 58],
    [1468, 1189, 1488, 3230, 5394, 5272, 2543, 2461, 2146, 1735, 1622, 4267],
    [610, 435, 549, 958, 1497, 1730, 790, 727, 658, 611, 641, 1082],
    [3, 3, 5, 8, 13, 11, 9, 7, 7, 5, 4, 10],
    [259, 261, 382, 820, 1424, 1004, 850, 702, 614, 447, 378, 1041],
  ];
  const klon = d => d.map(z => z.slice());
  const summe = a => a.reduce((s, v) => s + v, 0);

  /* Verteilung mit Restausgleich: ganzzahliges Ziel proportional zu den Gewichten, Summe exakt */
  function verteile(ziel, gewichte) {
    const n = gewichte.length;
    let W = summe(gewichte);
    const g = W > 0 ? gewichte : gewichte.map(() => 1);
    if (W <= 0) W = n;
    const exakt = g.map(x => ziel * x / W);
    const teil = exakt.map(Math.floor);
    const rest = ziel - summe(teil);
    exakt.map((x, i) => [x - teil[i], g[i], i]).sort((a, b) => b[0] - a[0] || b[1] - a[1])
      .slice(0, rest).forEach(([, , i]) => { teil[i] += 1; });
    return teil;
  }
  function skaliert(daten, faktor) {
    const zellen = [];
    daten.forEach((z, i) => z.forEach((_, m) => zellen.push([i, m])));
    const neu = klon(daten);
    const w = verteile(Math.round(summe(zellen.map(([i, m]) => daten[i][m])) * faktor), zellen.map(([i, m]) => daten[i][m]));
    zellen.forEach(([i, m], k) => { neu[i][m] = w[k]; });
    return neu;
  }
  // Planungsalternativen: Best Case +5 %, Worst Case −8 % auf den Planwerten (gleiche Struktur)
  const START = { "Planung": BASIS, "Best Case": skaliert(BASIS, 1.05), "Worst Case": skaliert(BASIS, 0.92) };
  const STAND = {}, GESPEICHERT = {};
  Object.keys(START).forEach(k => { STAND[k] = klon(START[k]); GESPEICHERT[k] = klon(START[k]); });
  let alt = "Planung";
  const D = () => STAND[alt];

  /* ---------- Filter ---------- */
  SORTEN.forEach((s, j) => el("option", { value: String(j) }, $("f-sorte"), s));
  const sichtbar = i => $("f-sorte").value === "alle" || +$("f-sorte").value === PRODUKTE[i][0];

  /* ---------- Matrix aufbauen ---------- */
  const mx = $("mx");
  const kopf = el("div", { class: "mx-zeile kopfzeile" }, mx);
  el("div", { class: "mx-k links" }, kopf, "Sorte");
  el("div", { class: "mx-k links" }, kopf, "Produkt");
  MONATE.forEach(m => el("div", { class: "mx-k" }, kopf, m));
  el("div", { class: "mx-k jahr", id: "k-jahr" }, kopf, "Jahr");

  const ZEILEN = [];   // { key, art: "p"|"s"|"g", i, zeile, label, felder[13] }
  function zeileAnlegen(key, art, i, sorteText, produktText, cls) {
    const z = el("div", { class: "mx-zeile " + cls, id: "z-" + key, role: "row" }, mx);
    const labels = [];
    if (art === "g") labels.push(el("div", { class: "mx-l sorte", id: "l-" + key }, z, sorteText));
    else {
      labels.push(el("div", { class: "mx-l sorte" }, z, sorteText));
      labels.push(el("div", { class: "mx-l", id: "l-" + key }, z, produktText));
    }
    const name = art === "p" ? `${SORTEN[PRODUKTE[i][0]]} ${produktText}` : art === "s" ? `Summe ${SORTEN[i]}` : "Gesamt";
    const felder = [];
    for (let m = 0; m <= 12; m++) {
      const spalte = m < 12 ? MONATE[m] : "Jahr";
      felder.push(el("input", { class: "mk-feld mk-zahl" + (m === 12 ? " jahr" : ""), id: `c-${key}-${m}`, inputmode: "decimal",
        "aria-label": `${name}, ${spalte}`, "data-hilfe": art === "p" && m < 12
          ? "Einzelwert in Tsd. € – Summen und Diagramm folgen sofort"
          : "Summe in Tsd. € – neuer Wert wird mit Enter proportional verteilt" }, z));
    }
    const r = { key, art, i, zeile: z, labels, felder, name };
    ZEILEN.push(r);
    return r;
  }
  SORTEN.forEach((s, j) => {
    let erste = true;
    PRODUKTE.forEach(([sj, p], i) => {
      if (sj !== j) return;
      zeileAnlegen("p" + i, "p", i, erste ? s : "", p, "produkt");
      erste = false;
    });
    zeileAnlegen("s" + j, "s", j, "", "Summe", "summe");
  });
  zeileAnlegen("g", "g", 0, "Gesamt", "", "gesamt");

  /* ---------- Diagramm aufbauen ---------- */
  const dg = $("diagramm");
  const dgTitel = el("div", { class: "dg-titel" }, dg);
  const dgName = el("span", { class: "dg-name", id: "dg-name" }, dgTitel, "Gesamt");
  el("span", { class: "dg-einheit" }, dgTitel, "Monatsverlauf in Tsd. €");
  const SAEULEN = MONATE.map(() => {
    const zelle = el("div", { class: "dg-monat" }, dg);
    return { wert: el("div", { class: "dg-wert" }, zelle), balken: el("div", { class: "dg-balken" }, zelle) };
  });
  el("div", { class: "dg-leer" }, dg);

  /* ---------- Werte, Verdichtung, Verteilung ---------- */
  function einzelzellen(r, m) {
    const produkte = r.art === "p" ? [r.i] : PRODUKTE.map((_, i) => i).filter(i => sichtbar(i) && (r.art === "g" || PRODUKTE[i][0] === r.i));
    const monate = m === 12 ? MONATE.map((_, k) => k) : [m];
    const out = [];
    produkte.forEach(i => monate.forEach(k => out.push([i, k])));
    return out;
  }
  const wert = (r, m) => summe(einzelzellen(r, m).map(([i, k]) => D()[i][k]));
  function verteilen(r, m, ziel) {
    const zellen = einzelzellen(r, m);
    const neu = verteile(ziel, zellen.map(([i, k]) => D()[i][k]));
    zellen.forEach(([i, k], n) => { D()[i][k] = neu[n]; });
    return zellen.length;
  }
  const text = v => zahl(v / 10, 1);

  let gewaehlt = ZEILEN[ZEILEN.length - 1];
  function anzeigen() {
    const aktiv = document.activeElement;
    ZEILEN.forEach(r => {
      const an = r.art === "g" || (r.art === "p" ? sichtbar(r.i) : $("f-sorte").value === "alle" || +$("f-sorte").value === r.i);
      r.zeile.classList.toggle("aus", !an);
      r.felder.forEach((f, m) => { if (f !== aktiv) f.value = text(wert(r, m)); });
      r.labels.forEach(l => l.classList.toggle("gewaehlt", r === gewaehlt));
    });
    diagramm();
  }
  function diagramm() {
    const werte = MONATE.map((_, m) => wert(gewaehlt, m));
    const max = Math.max(1, ...werte);
    dgName.textContent = gewaehlt.name;
    SAEULEN.forEach((s, m) => {
      const h = Math.round(werte[m] / max * 56);
      s.balken.style.height = h + "px";
      s.balken.style.display = h > 0 ? "block" : "none";
      s.wert.textContent = text(werte[m]);
    });
  }
  const PRUEF = { min: 0, max: 999999.9, meldung: "Betrag in Tsd. € ab 0 mit Dezimalkomma, z. B. 1.250,0" };

  ZEILEN.forEach(r => r.felder.forEach((f, m) => {
    const einzel = r.art === "p" && m < 12;
    f.addEventListener("focus", () => {
      if (gewaehlt !== r) { gewaehlt = r; ZEILEN.forEach(z => z.labels.forEach(l => l.classList.toggle("gewaehlt", z === r))); diagramm(); }
    });
    f.addEventListener("input", () => {
      const v = pruefeFeld(f, "zahl", PRUEF);
      if (einzel && !f.classList.contains("mk-fehler") && v !== null) { D()[r.i][m] = Math.round(v * 10); anzeigen(); }
    });
    const uebernehmen = () => {
      const v = pruefeFeld(f, "zahl", PRUEF);
      if (f.classList.contains("mk-fehler")) return;
      if (v === null) { f.value = text(wert(r, m)); return; }
      const ziel = Math.round(v * 10), vorher = wert(r, m);
      if (!einzel && ziel !== vorher) {
        const n = verteilen(r, m, ziel);
        MK.meldung(`${r.name}, ${m < 12 ? MONATE[m] : "Jahr"}: ${text(vorher)} → ${text(ziel)} Tsd. € proportional auf ${n} Einzelwerte verteilt.`);
      }
      f.value = text(wert(r, m));
      anzeigen();
    };
    f.addEventListener("change", uebernehmen);
    f.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); uebernehmen(); f.select(); } });
    f.addEventListener("blur", () => { if (!f.classList.contains("mk-fehler")) f.value = text(wert(r, m)); });
  }));

  /* ---------- Schnitte, Knöpfe, Funktionen ---------- */
  function neuZeichnen() { anzeigen(); MK.skalieren(); if (MK._ebenenNeu) MK._ebenenNeu(); }
  const fehlerWeg = () => document.querySelectorAll("#verteilung .mk-fehler").forEach(f => { f.classList.remove("mk-fehler"); f.title = f.dataset.hilfe || ""; });
  $("f-alternative").addEventListener("change", () => { alt = $("f-alternative").value; fehlerWeg(); neuZeichnen(); });
  $("f-sorte").addEventListener("change", () => {
    if (gewaehlt.zeile.classList.contains("aus") || gewaehlt.art !== "g") gewaehlt = ZEILEN[ZEILEN.length - 1];
    neuZeichnen();
  });
  $("l-filter").addEventListener("click", () => { $("f-sorte").value = "alle"; gewaehlt = ZEILEN[ZEILEN.length - 1]; neuZeichnen(); });
  $("k-speichern").addEventListener("click", () => {
    if (document.querySelector("#verteilung .mk-fehler")) { MK.meldung("Bitte zuerst die rot markierten Eingaben korrigieren."); return; }
    GESPEICHERT[alt] = klon(D());
    MK.meldung(`${alt} 2028 gespeichert und in die Datenbank zurückgeschrieben (Write-back).`);
  });
  $("k-verwerfen").addEventListener("click", () => {
    STAND[alt] = klon(GESPEICHERT[alt]); fehlerWeg(); anzeigen();
    MK.meldung("Ungespeicherte Änderungen verworfen – letzter gespeicherter Stand.");
  });
  $("k-zurueck").addEventListener("click", () => {
    STAND[alt] = klon(START[alt]); GESPEICHERT[alt] = klon(START[alt]); fehlerWeg(); anzeigen();
    MK.meldung("Auf die Ausgangswerte zurückgesetzt.");
  });
  $("k-zielwert").addEventListener("click", () => {
    const f = $("c-g-12");
    if (!PRINT) { f.focus(); f.select(); }
    MK.meldung("Zielwertsuche: Zielwert für das Jahr eingeben und mit Enter bestätigen – alle Werte werden proportional angepasst.");
  });
  document.querySelectorAll("#funktionen > span").forEach(s => {
    if (!PRINT) { s.tabIndex = 0; s.setAttribute("role", "button"); }
    const zeigen = () => MK.meldung(`${s.textContent}: ${s.dataset.info}.`);
    s.addEventListener("click", zeigen);
    s.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); zeigen(); } });
  });
  anzeigen();

  /* ---------- Lernplattform: Erläuterungen und Gestaltung ---------- */
  MK.ebenen({
    erlaeuterungen: {
      titel: "Erläuterungen",
      intro: "Wie Planung direkt im Bericht funktioniert. Die Nummern in der Maske zeigen, wo – probieren Sie die Eingaben aus.",
      eintraege: [
        { nr: 1, ziel: "kopf-titel", versatz: [8, 4], titel: "Planung im Bericht",
          text: "Die Planungsfunktionen sind in den Bericht integriert: Werte werden in der Matrix erfasst, Summen und Diagramm folgen sofort. Ein Wechsel in ein eigenes Planungswerkzeug oder in eine Tabellenkalkulation entfällt; geplant wird auf denselben Daten, die berichtet werden." },
        { nr: 2, ziel: "funktionen", anker: "links", versatz: [24, -24], titel: "Planungsfunktionen",
          text: "Die Leiste führt zu den Funktionen der Planung: manuelle Planung, Verteilung und Verdichtung, Hochrechnung, Übernahme von Versionen, Rückschreiben in die Datenbank, Vorselektion, Filter, Überwachung des Planungsfortschritts, Abstimmung und Genehmigung, Kommentare und Export. Ein Klick zeigt, was die Funktion leistet." },
        { nr: 3, ziel: "schnitte", anker: "links", versatz: [0, 18], titel: "Datenschnitte",
          text: "Jahr, Planungsalternative und Sorte grenzen den Planungsausschnitt ein. Eine Verteilung wirkt nur auf die sichtbaren Werte – wählen Sie z. B. die Sorte Cola und verteilen Sie deren Jahressumme." },
        { nr: 4, ziel: "c-p3-4", anker: "links", versatz: [0, 2], titel: "Verdichtung (bottom-up)",
          text: "Ändern Sie einen Einzelwert, etwa Cola 0,5 l Dose im Mai: Die Summe der Sorte, die Monatssumme, das Jahr und das Diagramm werden sofort neu verdichtet." },
        { nr: 5, ziel: "c-g-12", anker: "links", versatz: [0, 2], titel: "Verteilung (top-down)",
          text: "Geben Sie in eine Summenzelle einen neuen Wert ein, z. B. 21.000,0 für das Gesamtjahr, und bestätigen Sie mit Enter: Der Wert wird proportional zu den bisherigen Werten auf Produkte und Monate verteilt. Struktur und Saisonverlauf bleiben erhalten." },
        { nr: 6, ziel: "c-s1-12", anker: "links", versatz: [0, 2], titel: "Exakte Summen",
          text: "Verteilt wird in Schritten von 0,1 Tsd. €; Rundungsreste erhalten die Werte mit den größten Nachkommaanteilen. So ergeben die Einzelwerte immer genau die eingegebene Summe – ohne Rundungsdifferenzen im Bericht." },
        { nr: 7, ziel: "dg-name", versatz: [-4, -20], titel: "Diagramm folgt der Eingabe",
          text: "Die Säulen zeigen den Monatsverlauf der gewählten Zeile, als Planwerte weiß mit Kontur. Klicken Sie in eine Zeile, um ihren Verlauf zu sehen; jede Eingabe ändert das Diagramm sofort." },
        { nr: 8, ziel: "k-speichern", anker: "links", versatz: [0, 4], titel: "Speichern und Rückschreiben",
          text: "Erst Speichern schreibt die Planwerte in die Datenbank zurück (Write-back); danach stehen sie allen Berichten zur Verfügung. Verwerfen holt den letzten gespeicherten Stand, Zurücksetzen die Ausgangswerte." },
      ],
    },
    gestaltung: {
      titel: "Gestaltung",
      intro: "Was gegenüber dem Original geändert wurde – softwareneutral im Buchstil und nach den Interaktionsprinzipien der DIN EN ISO 9241-110.",
      eintraege: [
        { nr: "A", ziel: "kopf-titel", anker: "links", versatz: [-2, 4], regel: "BUCHSTIL – SOFTWARENEUTRAL", titel: "Kein Logo, keine Symbole",
          text: "Logo, Startseiten-Symbol und Radiergummi-Symbol des Originals entfallen; der Filter wird über den Link „Filter zurücksetzen“ gelöscht. Der Knopf mit dem Namen einer Tabellenkalkulation heißt „Export“. Die Titelzeile ist gestaltet wie bei den Dashboards." },
        { nr: "B", ziel: "kopf-unter", versatz: [26, 0], regel: "SELBSTBESCHREIBUNGSFÄHIGKEIT", titel: "Einheit genannt",
          text: "Die Werte stehen in Tsd. € mit einer Nachkommastelle; die Einheit steht in der Titelzeile und am Diagramm. Das Original zeigte volle Beträge bis 20.000.000 ohne Einheit." },
        { nr: "C", ziel: "k-jahr", anker: "links", versatz: [0, 0], regel: "BUCHSTIL – NEUTRAL UND AKTUELL", titel: "Keine Farbflächen",
          text: "Dunkelblaue Kopf- und Randflächen und die grauen Streifen des Originals entfallen. Haarlinien gliedern die Matrix, Summen sind fett, Sorten durch eine Linie getrennt." },
        { nr: "D", ziel: "c-p0-0", anker: "links", versatz: [0, 2], regel: "SELBSTBESCHREIBUNGSFÄHIGKEIT", titel: "Eingabe erkennbar",
          text: "Jede Zelle ist ein weißes Eingabefeld im Raster; der Hinweis am Feld sagt, ob verdichtet oder verteilt wird. Im Original sah die Matrix wie ein reiner Bericht aus." },
        { nr: "E", ziel: "diagramm", anker: "links", versatz: [26, 30], regel: "AUFGABENANGEMESSENHEIT", titel: "Diagramm ergänzt",
          text: "Neu ist der Monatsverlauf unter der Matrix, an deren Spalten ausgerichtet: Die Wirkung einer Eingabe ist sofort sichtbar. Das Original zeigte nur die Matrix." },
        { nr: "F", ziel: "funktionen", versatz: [-4, -24], regel: "ERWARTUNGSKONFORMITÄT", titel: "Deutsche Begriffe, deutsches Format",
          text: "„Goal Seek“ heißt Zielwertsuche, „Write Back“ Rückschreiben; Monate Jan bis Dez statt „Jan - 15“; Sorten und Produkte deutsch (Apfel, 0,5 l Flasche statt „Apple 0.5l bottle“); Dezimalkomma. Zweizeilige Knöpfe sind auf ein Wort gekürzt." },
        { nr: "G", ziel: "c-s0-12", anker: "links", versatz: [0, 2], regel: "ROBUSTHEIT GEGEN BENUTZUNGSFEHLER", titel: "Eingaben werden geprüft",
          text: "Ungültige oder negative Beträge werden rot markiert und nicht übernommen. Verteilt wird erst mit Enter oder beim Verlassen des Felds – nicht schon bei jedem Tastendruck." },
        { nr: "H", ziel: "f-jahr", anker: "links", versatz: [0, -22], regel: "BUCHSTIL – NEUTRAL UND AKTUELL", titel: "Aktuelles Jahr",
          text: "Das Planjahr 2015 des Originals wird zu 2028. Die Werte selbst sind unverändert, nur in Tsd. € gerundet." },
      ],
    },
  });
  MK.fertig();
})();
