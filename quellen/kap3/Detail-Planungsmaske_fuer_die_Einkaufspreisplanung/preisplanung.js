/* Abb. 3.187 „Detail-Planungsmaske für die Einkaufspreisplanung“ – Logik der Maske „Materialpreisplanung“, Reiter „Preisplanung“.
   Je Material (Preise je 100 Stück): Summe Konditionen = Brutto + MTZ;
   Planpreis (Vorschlag) = Brutto × Zuschlag Brutto + MTZ × Zuschlag MTZ, auf Cent gerundet und manuell überschreibbar;
   Volumen = Menge × Planpreis / 100;  Abweichung = Menge × (Ø-Preis lfd. Jahr − Planpreis) / 100;
   Abweichung in % = (Ø-Preis − Planpreis) / Planpreis. Negativ heißt: Der Planpreis liegt über dem aktuellen Durchschnittspreis.
   Zuschläge aus Abb. 3.186 (Lieferant 55654 Faktor 1,000 × Umwertung Warengruppe 3/Werk 1010 +2,00 % = 1,020; MTZ 1,000).
   Mengen, Konditionen, Ø-Preise, Planpreise, Volumen und Abweichungen der ersten 14 Zeilen wie im Original. */
(() => {
  "use strict";
  const { el, zahl, leseZahl, pruefeFeld } = MK;
  MK.init({ titel: "Detail-Planungsmaske für die Einkaufspreisplanung" });
  const $ = id => document.getElementById(id);

  /* ---------- Stammdaten (gemeinsam mit Abb. 3.186) ---------- */
  const ZB = 1.020, ZM = 1.000;
  // Material, Bezeichnung, Menge in Stück, Brutto, MTZ, Ø-Preis lfd. Jahr (je 100 Stück)
  const MAT = [
    ["1075379", "Rückenpolster Stoff", 9484, 1761, 0, 1739], ["1075377", "Sitzpolster Stoff", 9466, 2022, 0, 1981],
    ["1082081", "Sitzpolster Kunstleder", 53248, 1553, 0, 1502], ["1082088", "Rückenpolster Kunstleder", 47338, 1299, 0, 1267],
    ["1089870", "Rückenpolster Stoff", 1461, 1401, 0, 1401], ["1073500", "Rückenpolster Kunstleder", 2530, 1360, 0, 1360],
    ["1089878", "Sitzpolster Stoff", 1461, 1593, 0, 1593], ["1091005", "Sitzpolster Kunstleder", 1827, 1525, 0, 1525],
    ["1082089", "Rückenpolster Kunstl. beheizt", 1341, 2131, 0, 2131], ["1082079", "Sitzpolster Stoff beheizt", 1388, 2894, 0, 2894],
    ["1110011", "Sitzpolster Kunstleder", 275, 1535, 0, 1535], ["1110006", "Rückenpolster Kunstleder", 274, 1333, 0, 1333],
    ["1110008", "Sitzpolster Stoff", 682, 1865, 0, 1865], ["1110004", "Rückenpolster Stoff", 683, 1656, 0, 1656]];
  const vorschlag = m => Math.round((m[3] * ZB + m[4] * ZM) * 100) / 100;
  let W = [];
  const laden = () => { W = MAT.map(m => ({ dsp: m[5], pp: vorschlag(m) })); };
  laden();

  /* ---------- Auswahl ---------- */
  el("option", { value: "*", selected: "" }, $("f-mat"), "Alle");
  MAT.forEach(m => el("option", { value: m[0] }, $("f-mat"), m[0]));

  /* ---------- Raster ---------- */
  const raster = $("raster");
  const pos = (z, s, n = 1) => `grid-row:${z};grid-column:${s}${n > 1 ? " / span " + n : ""}`;
  const PR = { min: 0, max: 99999, pflicht: true, meldung: "Preis je 100 Stück in € mit Dezimalkomma, z. B. 1.796,22" };
  let ZEILEN = [];
  function aufbauen() {
    raster.querySelectorAll(".zeile").forEach(e => e.remove());
    const wahl = $("f-mat").value;
    ZEILEN = MAT.map((m, i) => [m, W[i], i]).filter(([m]) => wahl === "*" || m[0] === wahl);
    ZEILEN.forEach(([m, w], j) => {
      const z = 3 + j;
      el("span", { class: "mk-label mx-l zeile", id: `m-${j}`, style: pos(z, 1) }, raster, m[0]);
      el("span", { class: "mk-label mx-l zeile", id: `t-${j}`, style: pos(z, 2) }, raster, m[1]);
      [[3, zahl(m[2], 0)], [4, zahl(m[3], 2)], [5, zahl(m[4], 2)], [6, zahl(m[3] + m[4], 2)], [7, zahl(ZB, 3)], [8, zahl(ZM, 3)]]
        .forEach(([s, t]) => el("div", { class: "mk-feld mk-anzeige mk-zahl zeile", id: `a${s}-${j}`, style: pos(z, s) }, raster, t));
      [["dsp", 9, "Ø-Preis laufendes Jahr"], ["pp", 10, "Planpreis"]].forEach(([k, s, lbl]) => {
        const f = el("input", { class: "mk-feld mk-zahl zeile", id: `${k}-${j}`, style: pos(z, s), value: zahl(w[k], 2), inputmode: "decimal",
          "aria-label": `${lbl} je 100 Stück, Material ${m[0]}`, "data-hilfe": PR.meldung }, raster);
        f.addEventListener("input", () => { const v = pruefeFeld(f, "zahl", PR); if (!f.classList.contains("mk-fehler")) w[k] = v; rechnen(); });
        f.addEventListener("blur", () => { if (!f.classList.contains("mk-fehler")) f.value = zahl(w[k], 2); });
      });
      [11, 12, 13].forEach(s => el("div", { class: "mk-feld mk-anzeige mk-zahl zeile", id: `a${s}-${j}`, style: pos(z, s) }, raster));
    });
    const zs = 3 + ZEILEN.length;
    el("span", { class: "mk-label mx-l summe zeile", id: "l-summe", style: pos(zs, 1, 2) }, raster, "Summe");
    el("div", { class: "mk-feld mk-anzeige mk-zahl summe zeile", id: "sum-menge", style: pos(zs, 3) }, raster);
    el("div", { class: "leer zeile", id: "sum-preis", style: pos(zs, 4, 7) }, raster);
    [11, 12, 13].forEach(s => el("div", { class: "mk-feld mk-anzeige mk-zahl summe zeile", id: `sum-${s}`, style: pos(zs, s) }, raster));
    rechnen();
    if (MK.skalieren) MK.skalieren();
    if (MK._ebenenNeu) MK._ebenenNeu();
  }
  const PM = String.fromCharCode(0xB1);
  const prozent = v => (Math.abs(v) < 0.005 ? PM + zahl(0, 2) : zahl(v, 2));
  function rechnen() {
    let menge = 0, vol = 0, abw = 0, ok = true;
    ZEILEN.forEach(([m, w], j) => {
      const fehler = $(`dsp-${j}`).classList.contains("mk-fehler") || $(`pp-${j}`).classList.contains("mk-fehler");
      menge += m[2];
      if (fehler) { [11, 12, 13].forEach(s => { $(`a${s}-${j}`).textContent = "–"; }); ok = false; return; }
      const v = m[2] * w.pp / 100, a = m[2] * (w.dsp - w.pp) / 100;
      $(`a11-${j}`).textContent = zahl(v, 0);
      $(`a12-${j}`).textContent = Math.abs(a) < 0.5 ? PM + "0" : zahl(a, 0);
      $(`a13-${j}`).textContent = w.pp ? prozent((w.dsp - w.pp) / w.pp * 100) : "–";
      vol += v; abw += a;
    });
    $("sum-menge").textContent = zahl(menge, 0);
    $("sum-11").textContent = ok ? zahl(vol, 0) : "–";
    $("sum-12").textContent = ok ? zahl(abw, 0) : "–";
    $("sum-13").textContent = ok && vol ? prozent(abw / vol * 100) : "–";
    return [vol, abw];
  }
  $("f-mat").addEventListener("change", aufbauen);
  aufbauen();

  /* ---------- Knöpfe und Reiter ---------- */
  const fehler = () => !!document.querySelector("#preisplanung .mk-fehler");
  $("k-sichern").addEventListener("click", () => {
    if (fehler()) { MK.meldung("Nicht gesichert: Bitte zuerst die rot markierten Eingaben korrigieren."); return; }
    const [vol] = rechnen();
    MK.meldung(`Gesichert: ${ZEILEN.length} Planpreise, Einkaufsvolumen ${zahl(vol, 0)} €.`);
  });
  $("k-aktualisieren").addEventListener("click", () => {
    laden(); aufbauen();
    MK.meldung("Aktualisiert: Planpreise aus Konditionen und Zuschlägen neu vorgeschlagen, manuelle Änderungen verworfen.");
  });
  $("reiter-zuschlaege").addEventListener("click", () => MK.meldung("Der Reiter „Zuschläge“ ist Abb. 3.186 (eigene Beispielmaske)."));

  /* ---------- Lernplattform: Erläuterungen und Gestaltung ---------- */
  MK.ebenen({
    erlaeuterungen: {
      titel: "Erläuterungen",
      intro: "Was die Bereiche der Maske in der Einkaufspreisplanung leisten. Die Nummern in der Maske zeigen, wo.",
      eintraege: [
        { nr: 1, ziel: "f-wg", versatz: [-26, 2], titel: "Planung nach Warengruppe, Lieferant oder Material",
          text: "Die Auswahl bestimmt die Ebene der Planung: alle Materialien einer Warengruppe, eines Lieferanten oder ein einzelnes Material. Wählen Sie unter „Material“ eine Nummer, bleibt nur diese Zeile." },
        { nr: 2, ziel: "f-pe", versatz: [-6, 2], titel: "Kopfdaten",
          text: "Werk, Mengen- und Preiseinheit sowie Gültigkeit gelten für alle Zeilen. Preise beziehen sich auf 100 Stück: 1.761,00 € je 100 Stück sind 17,61 € je Polster." },
        { nr: 3, ziel: "h-kond", versatz: [-4, -2], titel: "Konditionen aus dem Einkauf",
          text: "Bruttopreis und Materialteuerungszuschlag (MTZ) werden aus dem Einkaufsinformationssystem übernommen – die vereinbarten Konditionen des laufenden Jahres." },
        { nr: 4, ziel: "h-zuschlag", versatz: [-4, -2], titel: "Zuschläge",
          text: "Die Zuschläge kommen aus dem Reiter „Zuschläge“ (Abb. 3.186): Planpreisfaktor des Lieferanten 1,000 × Umwertung der Warengruppe +2 % = 1,020." },
        { nr: 5, ziel: "h-pp2", versatz: [-4, 4], titel: "Vorschlag und manuelle Planung",
          text: "Planpreis = Bruttopreis × Zuschlag + MTZ × Zuschlag MTZ, etwa 1.761,00 × 1,020 = 1.796,22 €. Der Vorschlag lässt sich je Material überschreiben, etwa wenn ein Lieferantenwechsel ansteht." },
        { nr: 6, ziel: "h-abw", versatz: [-4, -2], titel: "Abweichung zum Durchschnittspreis",
          text: "Abweichung = Menge × (Ø-Preis lfd. Jahr − Planpreis). Negativ heißt: Der Planpreis liegt über dem heutigen Durchschnittspreis, das Material wird teurer. Bei den ersten vier Materialien lag der Durchschnittspreis schon unter dem Bruttopreis." },
        { nr: 7, ziel: "l-summe", versatz: [-6, 1], titel: "Einkaufsvolumen",
          text: "Volumen = Menge × Planpreis. Die Summe – 2.047.078 € und −88.411 € Abweichung – ist dasselbe Ergebnis, das der Reiter „Zuschläge“ zeigt; sie geht in die Material- und Kostenplanung ein." },
        { nr: 8, ziel: "k-aktualisieren", versatz: [14, -10], titel: "Vorschlag neu berechnen",
          text: "„Aktualisieren“ berechnet alle Planpreise neu aus Konditionen und Zuschlägen und verwirft manuelle Änderungen – etwa nachdem die Zuschläge geändert wurden." },
      ],
    },
    gestaltung: {
      titel: "Gestaltung",
      intro: "Was gegenüber dem Original geändert wurde – softwareneutral im Buchstil und nach den Interaktionsprinzipien der DIN EN ISO 9241-110.",
      eintraege: [
        { nr: "A", ziel: "kopf", versatz: [-6, 8], regel: "BUCHSTIL – SOFTWARENEUTRAL", titel: "Kein Browserfenster",
          text: "Browserfenster mit Adresszeile (Servername mit Firmennamen) und technischem Fenstertitel, Menü-, Symbol-, Status- und Taskleiste, Bildlaufleiste und der Knopf „Beenden“ des Originals entfallen." },
        { nr: "B", ziel: "f-werk", versatz: [-6, 2], regel: "AUFGABENANGEMESSENHEIT", titel: "Gleichbleibende Spalten als Kopfdaten",
          text: "Lieferant, Werk, Commodity, NB-Kennzeichen, „Kond. gültig“, Basis-ME und Preiseinheit waren im Original in jeder Zeile gleich. Sie stehen jetzt einmal in Auswahl und Kopfdaten; das Raster zeigt nur, was sich je Material unterscheidet." },
        { nr: "C", ziel: "h-kond", versatz: [-4, -2], regel: "SELBSTBESCHREIBUNGSFÄHIGKEIT", titel: "Klartext statt Systemkürzel",
          text: "„PB00“ heißt „Brutto“, „PP3“ „Planpreis“, „DSP LFJ“ „Ø-Preis lfd. Jahr“, „Summe Kond.“ „Summe“, „Commodity“ „Warengruppe“." },
        { nr: "D", ziel: "kopf-unter", versatz: [-6, -2], regel: "SELBSTBESCHREIBUNGSFÄHIGKEIT", titel: "Einheiten genannt",
          text: "Mengen ganzzahlig statt „9.484,000“; Einheiten im Untertitel und an den Spalten, Preise ausdrücklich je 100 Stück. Das Original nannte weder Währung noch Bezugsmenge." },
        { nr: "E", ziel: "h-pp2", versatz: [-4, 4], regel: "SELBSTBESCHREIBUNGSFÄHIGKEIT", titel: "Eingabe und Anzeige unterscheidbar",
          text: "Nur Ø-Preis und Planpreis sind weiße Eingabefelder; Konditionen, Zuschläge, Volumen und Abweichungen sind grau. Das Original hinterlegte das ganze Raster graublau und setzte nur kleine weiße Kästchen für die Eingabe hinein." },
        { nr: "F", ziel: "l-summe", versatz: [-6, 1], regel: "AUFGABENANGEMESSENHEIT", titel: "Summenzeile ergänzt",
          text: "Die Summe von Menge, Volumen und Abweichung fehlte im Original. Sie stimmt mit dem Ergebnis im Reiter „Zuschläge“ überein." },
        { nr: "G", ziel: "f-lief", versatz: [-26, 2], regel: "BUCHSTIL – NEUTRAL UND AKTUELL", titel: "Fiktiver Lieferant, lesbare Texte",
          text: "Der Lieferant des Originals (reales Unternehmen, im Buch geschwärzt) ist ersetzt; Materialtexte wie „POLSTER F.R.KSTL.KPL.“ heißen „Rückenpolster Kunstleder“. Umfang wie der Bildausschnitt: die ersten 14 Materialien." },
        { nr: "H", ziel: "sum-preis", versatz: [-6, 1], regel: "ROBUSTHEIT GEGEN BENUTZUNGSFEHLER", titel: "Eingaben werden geprüft",
          text: "Preise sind Pflicht, ab 0 € und mit Dezimalkomma. Ungültige Eingaben werden rot markiert, Volumen und Abweichung der Zeile und die Summe zeigen „–“, Sichern ist erst nach der Korrektur möglich." },
      ],
    },
  });
  MK.fertig();
})();
