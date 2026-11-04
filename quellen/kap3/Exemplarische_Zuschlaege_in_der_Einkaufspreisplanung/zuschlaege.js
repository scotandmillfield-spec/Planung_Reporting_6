/* Abb. 3.186 „Exemplarische Zuschläge in der Einkaufspreisplanung“ – Logik der Maske „Materialpreisplanung“, Reiter „Zuschläge“.
   Zuschlag Brutto = Planpreisfaktor des Lieferanten × (1 + Veränderung der Warengruppe im Werk);  Zuschlag MTZ = MTZ-Faktor.
   Ergebnis für Lieferant 55654, Warengruppe 3, Werk 1010 mit den 14 Materialien aus Abb. 3.187:
   Planpreis = Bruttopreis × Zuschlag Brutto + MTZ × Zuschlag MTZ (je 100 Stück, auf Cent gerundet),
   Planvolumen = Σ Menge × Planpreis / 100,  Abweichung = Σ Menge × (Ø-Preis lfd. Jahr − Planpreis) / 100.
   Lieferantenfaktoren 50000–50095 und die Umwertung 6/7010 +10 % wie im Original; Lieferant 55654 (Faktor 1,000) und die
   Umwertung 3/1010 +2,00 % ergänzt, sodass sich der Zuschlag 1,020 aus Abb. 3.187 ergibt. */
(() => {
  "use strict";
  const { el, zahl, leseZahl, pruefeFeld } = MK;
  MK.init({ titel: "Exemplarische Zuschläge in der Einkaufspreisplanung" });
  const $ = id => document.getElementById(id);

  /* ---------- Stammdaten (fiktiv; gemeinsam mit Abb. 3.187) ---------- */
  const LIEF = [["50000", "Nähfaden Nord", 0.969, 1.000], ["50015", "Chemie Süd", 1.040, 1.000],
    ["50024", "Bezugsstoffe West", 0.969, 1.000], ["50079", "Werkzeugbau Mitte", 1.114, 1.000],
    ["50090", "Elektrologistik Ost", 1.000, 1.000], ["50095", "Metallkomponenten Süd", 1.015, 1.000],
    ["55654", "Polsterwerk Ost", 1.000, 1.000]];
  const UMW = [["3", "Polster", "1010", 2.00], ["6", "Bezüge", "7010", 10.00]];
  // Materialien des Lieferanten 55654, Warengruppe 3, Werk 1010: Menge, Brutto, MTZ, Ø-Preis lfd. Jahr (je 100 Stück)
  const MAT = [[9484, 1761, 0, 1739], [9466, 2022, 0, 1981], [53248, 1553, 0, 1502], [47338, 1299, 0, 1267],
    [1461, 1401, 0, 1401], [2530, 1360, 0, 1360], [1461, 1593, 0, 1593], [1827, 1525, 0, 1525], [1341, 2131, 0, 2131],
    [1388, 2894, 0, 2894], [275, 1535, 0, 1535], [274, 1333, 0, 1333], [682, 1865, 0, 1865], [683, 1656, 0, 1656]];
  const ZIEL = { lief: "55654", wg: "3", werk: "1010" };

  const kopie = x => JSON.parse(JSON.stringify(x));
  let gesichert = { lief: kopie(LIEF), umw: kopie(UMW) };
  let L = kopie(LIEF), U = kopie(UMW);

  /* ---------- Auswahl ---------- */
  const optionen = (sel, liste, wert) => { sel.textContent = ""; liste.forEach(([v, t]) => el("option", v === wert ? { value: v, selected: "" } : { value: v }, sel, t)); };
  optionen($("f-wg"), [["*", "Alle"], ...UMW.map(u => [u[0], u[0] + " " + u[1]])], "*");
  optionen($("f-werk"), [["*", "Alle"], ...UMW.map(u => [u[2], u[2]])], "*");

  /* ---------- Raster ---------- */
  const pos = (z, s) => `grid-row:${z};grid-column:${s}`;
  function zahlFeld(raster, z, s, id, wert, nk, pr, label, setzen) {
    const f = el("input", { class: "mk-feld mk-zahl zeile", id, style: pos(z, s), value: zahl(wert, nk), inputmode: "decimal",
      "aria-label": label, "data-hilfe": pr.meldung }, raster);
    f.addEventListener("input", () => { const v = pruefeFeld(f, "zahl", pr); if (!f.classList.contains("mk-fehler")) setzen(v == null ? null : v); rechnen(); });
    f.addEventListener("blur", () => { const v = leseZahl(f.value); if (!f.classList.contains("mk-fehler") && v != null) f.value = zahl(v, nk); });
    return f;
  }
  const PR_F = { min: 0.5, max: 2, pflicht: true, meldung: "Faktor zwischen 0,500 und 2,000, z. B. 1,020" };
  const PR_P = { min: -50, max: 100, pflicht: true, meldung: "Veränderung in % zwischen −50 und 100, z. B. 2,00" };
  function zeilenLief() {
    const r = $("raster-lief");
    r.querySelectorAll(".zeile").forEach(e => e.remove());
    L.forEach((l, i) => {
      const z = 3 + i, ziel = l[0] === ZIEL.lief ? " ausgewaehlt" : "";
      el("span", { class: "mk-label mx-l zeile" + ziel, id: `l-nr-${i}`, style: pos(z, 1) }, r, l[0]);
      el("span", { class: "mk-label mx-l zeile" + ziel, id: `l-name-${i}`, style: pos(z, 2) }, r, l[1]);
      zahlFeld(r, z, 3, `ppf-${i}`, l[2], 3, PR_F, `Planpreisfaktor, Lieferant ${l[0]}`, v => { l[2] = v; });
      zahlFeld(r, z, 4, `mtz-${i}`, l[3], 3, PR_F, `MTZ-Faktor, Lieferant ${l[0]}`, v => { l[3] = v; });
    });
  }
  function zeilenUmw() {
    const r = $("raster-umw");
    r.querySelectorAll(".zeile").forEach(e => e.remove());
    const wg = $("f-wg").value, werk = $("f-werk").value;
    const liste = U.filter(u => (wg === "*" || u[0] === wg) && (werk === "*" || u[2] === werk));
    liste.forEach((u, i) => {
      const z = 3 + i, ziel = u[0] === ZIEL.wg && u[2] === ZIEL.werk ? " ausgewaehlt" : "";
      [[1, u[0]], [2, u[1]], [3, u[2]]].forEach(([s, t]) => el("span", { class: "mk-label mx-l zeile" + ziel, id: `u-${i}-${s}`, style: pos(z, s) }, r, t));
      zahlFeld(r, z, 4, `umw-${i}`, u[3], 2, PR_P, `Veränderung in %, Warengruppe ${u[0]}, Werk ${u[2]}`, v => { u[3] = v; });
    });
    if (!liste.length) el("span", { class: "mk-label mx-l zeile", style: "grid-row:3;grid-column:1 / span 4" }, r, "Keine Umwertung für diese Auswahl");
  }

  /* ---------- Ergebnis für die Preisplanung ---------- */
  function rechnen() {
    const l = L.find(x => x[0] === ZIEL.lief), u = U.find(x => x[0] === ZIEL.wg && x[2] === ZIEL.werk);
    $("e-lief").textContent = l[0] + " " + l[1];
    $("e-wg").textContent = u[0] + " " + u[1];
    $("e-werk").textContent = u[2];
    if (l[2] == null || l[3] == null || u[3] == null || document.querySelector("#zuschlaege .mk-fehler")) { ["e-zb", "e-zm", "e-vol", "e-abw"].forEach(id => { $(id).textContent = "–"; }); return; }
    const zb = Math.round(l[2] * (1 + u[3] / 100) * 1000) / 1000, zm = l[3];
    let vol = 0, abw = 0;
    MAT.forEach(([menge, brutto, mtz, dsp]) => {
      const pp = Math.round((brutto * zb + mtz * zm) * 100) / 100;
      vol += menge * pp / 100; abw += menge * (dsp - pp) / 100;
    });
    $("e-zb").textContent = zahl(zb, 3);
    $("e-zm").textContent = zahl(zm, 3);
    $("e-vol").textContent = zahl(vol, 0);
    $("e-abw").textContent = Math.abs(abw) < 0.5 ? String.fromCharCode(0xB1) + "0" : zahl(abw, 0);
  }
  function neu() { zeilenLief(); zeilenUmw(); rechnen(); if (MK.skalieren) MK.skalieren(); if (MK._ebenenNeu) MK._ebenenNeu(); }
  $("f-wg").addEventListener("change", () => { zeilenUmw(); rechnen(); if (MK.skalieren) MK.skalieren(); if (MK._ebenenNeu) MK._ebenenNeu(); });
  $("f-werk").addEventListener("change", () => { zeilenUmw(); rechnen(); if (MK.skalieren) MK.skalieren(); if (MK._ebenenNeu) MK._ebenenNeu(); });
  neu();

  /* ---------- Knöpfe und Reiter ---------- */
  const fehler = () => !!document.querySelector("#zuschlaege .mk-fehler");
  $("k-uebernahme").addEventListener("click", () => {
    L = kopie(LIEF); neu();
    MK.meldung("Konditionen aus den Einkaufsinfosätzen übernommen: Planpreis- und MTZ-Faktoren zurückgesetzt.");
  });
  $("k-sichern").addEventListener("click", () => {
    if (fehler()) { MK.meldung("Nicht gesichert: Bitte zuerst die rot markierten Eingaben korrigieren."); return; }
    gesichert = { lief: kopie(L), umw: kopie(U) };
    MK.meldung(`Gesichert: Zuschlag Brutto ${$("e-zb").textContent} gilt in der Preisplanung für Lieferant ${ZIEL.lief}.`);
  });
  $("k-aktualisieren").addEventListener("click", () => {
    L = kopie(gesichert.lief); U = kopie(gesichert.umw); neu();
    MK.meldung("Aktualisiert: zuletzt gesicherte Faktoren und Umwertungen geladen.");
  });
  $("reiter-preis").addEventListener("click", () => MK.meldung("Der Reiter „Preisplanung“ ist Abb. 3.187 (eigene Beispielmaske)."));

  /* ---------- Klappen ohne Maßstabssprung (wie Abb. 3.7) ---------- */
  if (!document.body.classList.contains("print")) {
    const maske = $("zuschlaege"), seite = $("seite"), rahmen = seite.parentElement;
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
      intro: "Was die Bereiche der Maske in der Einkaufspreisplanung leisten. Die Nummern in der Maske zeigen, wo.",
      eintraege: [
        { nr: 1, ziel: "reiter", versatz: [-6, 2], titel: "Zuschläge vor der Preisplanung",
          text: "Bevor Materialpreise einzeln geplant werden, legt der Einkauf pauschale Zuschläge fest. Sie erzeugen im Reiter „Preisplanung“ (Abb. 3.187) einen Vorschlag für jeden Planpreis." },
        { nr: 2, ziel: "f-planversion", versatz: [-26, 2], titel: "Version und Planversion",
          text: "Die Zuschläge gelten für eine Planversion des Planjahrs. Eine zweite Planversion erlaubt Varianten, etwa mit höherer Teuerung." },
        { nr: 3, ziel: "ppf-0", anker: "links", versatz: [32, 1], titel: "Planpreisfaktor je Lieferant",
          text: "Der Faktor gibt die erwartete Preisänderung je Lieferant wieder: 0,969 heißt 3,1 % billiger (etwa durch eine Rahmenvereinbarung), 1,114 heißt 11,4 % teurer." },
        { nr: 4, ziel: "mtz-0", anker: "links", versatz: [32, 1], titel: "MTZ-Faktor",
          text: "Der Materialteuerungszuschlag (MTZ) gibt Rohstoffpreise weiter, etwa für Stahl oder Kunststoff. Sein Faktor wird getrennt geplant; 1,000 heißt unverändert." },
        { nr: 5, ziel: "k-uebernahme", versatz: [14, -10], titel: "Konditionen übernehmen",
          text: "Die Faktoren werden aus den vereinbarten Lieferantenkonditionen des ERP-Systems übernommen und danach nur noch dort geändert, wo der Einkauf andere Erwartungen hat." },
        { nr: 6, ziel: "h-veraenderung", anker: "links", versatz: [4, 1], titel: "Umwertung je Warengruppe",
          text: "Für eine ganze Warengruppe in einem Werk lässt sich eine Preisveränderung in Prozent planen – etwa +10 % für Bezüge im Werk 7010, unabhängig vom Lieferanten." },
        { nr: 7, ziel: "e-zb", anker: "links", versatz: [32, 2], titel: "Zuschlag aus beiden Stufen",
          text: "Zuschlag Brutto = Planpreisfaktor × (1 + Veränderung): für den Lieferanten 55654 und die Polster im Werk 1010 also 1,000 × 1,02 = 1,020. Mit diesem Zuschlag rechnet die Preisplanung; Lieferant und Umwertung, die eingehen, sind oben fett." },
        { nr: 8, ziel: "e-abw", anker: "links", versatz: [32, 2], titel: "Wirkung auf das Einkaufsvolumen",
          text: "Planvolumen und Abweichung zum Durchschnittspreis des laufenden Jahres stimmen mit der Summenzeile der Preisplanung überein. Ändern Sie einen Faktor: Beide Werte folgen sofort." },
      ],
    },
    gestaltung: {
      titel: "Gestaltung",
      intro: "Was gegenüber dem Original geändert wurde – softwareneutral im Buchstil und nach den Interaktionsprinzipien der DIN EN ISO 9241-110.",
      eintraege: [
        { nr: "A", ziel: "kopf", versatz: [-6, 8], regel: "BUCHSTIL – SOFTWARENEUTRAL", titel: "Kein Browserfenster",
          text: "Browserfenster mit Adresszeile (Servername mit Firmennamen) und technischem Fenstertitel, Menü-, Symbol-, Status- und Taskleiste, Bildlauf- und Blätterleiste sowie der Knopf „Beenden“ des Originals entfallen." },
        { nr: "B", ziel: "reiter", versatz: [-6, 2], regel: "ERLERNBARKEIT", titel: "Eine Maske mit zwei Reitern",
          text: "Die beiden Teilmasken „Lieferantenkonditionen“ und „MatPreisPlanung Umwertung“ stehen als Abschnitte im Reiter „Zuschläge“; der Reiter „Preisplanung“ ist Abb. 3.187 – gleiche Gestaltung, gleiche Daten." },
        { nr: "C", ziel: "h-oben", versatz: [-6, 2], regel: "SELBSTBESCHREIBUNGSFÄHIGKEIT", titel: "Klartext statt Systemkürzel",
          text: "„PP3 Faktor“ heißt „Planpreisfaktor“, „PP3 Faktor MTZ“ „MTZ-Faktor“, „Commodity“ „Warengruppe“, „Plan MatPreis (%)“ „Veränderung in %“." },
        { nr: "D", ziel: "f-gj", versatz: [-6, 2], regel: "SELBSTBESCHREIBUNGSFÄHIGKEIT", titel: "Eingabe und Anzeige unterscheidbar",
          text: "Geschäfts- und Planjahr sowie das Ergebnis sind grau und nicht änderbar; Faktoren und Veränderungen sind weiße Eingabefelder. Im Original standen die Jahre nur als Text „Geschäftsjahr: 2009 | Planjahr: 2009“ in der Kopfzeile." },
        { nr: "E", ziel: "band-erg", versatz: [-24, 2], regel: "AUFGABENANGEMESSENHEIT", titel: "Ergebnis ergänzt",
          text: "Neu ist der Abschnitt „Ergebnis für die Preisplanung“: Er zeigt, welcher Zuschlag aus Lieferantenfaktor und Umwertung entsteht und was er für das Einkaufsvolumen bedeutet." },
        { nr: "F", ziel: "l-name-0", versatz: [-6, 1], regel: "BUCHSTIL – NEUTRAL UND AKTUELL", titel: "Fiktive Lieferanten, aktuelles Jahr",
          text: "Die Lieferantennamen des Originals (reale Unternehmen, im Buch geschwärzt) sind durch fiktive ersetzt; Geschäfts- und Planjahr 2009 werden zu 2028." },
        { nr: "G", ziel: "f-werk", versatz: [-26, 2], regel: "ERWARTUNGSKONFORMITÄT", titel: "Gewohnte Bedienelemente",
          text: "Auswahlfelder tragen den Pfeil rechts, ein leeres Werk heißt „Alle“. Faktoren stehen rechtsbündig mit drei, Prozentwerte mit zwei Nachkommastellen." },
        { nr: "H", ziel: "ppf-1", anker: "links", versatz: [32, 1], regel: "ROBUSTHEIT GEGEN BENUTZUNGSFEHLER", titel: "Eingaben werden geprüft",
          text: "Faktoren von 0,500 bis 2,000, Veränderungen von −50 bis 100 %. Ungültige Eingaben werden rot markiert, das Ergebnis zeigt „–“, Sichern ist erst nach der Korrektur möglich." },
      ],
    },
  });
  MK.fertig();
})();
