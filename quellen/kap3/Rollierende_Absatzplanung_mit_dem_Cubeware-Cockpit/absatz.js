/* Abb. 3.183 „Rollierende Absatzplanung“ – Logik der Maske „Absatzplanung Produkt/Kunde“.
   Absatzmengen in Stück je Produkt und Kunde: Ø des Ist der letzten 12/6/3 Monate, Ist der letzten fünf Monate,
   Plan für die nächsten zwölf Monate (rollierend). Trend (Vorjahr) = Ist des Vorjahresmonats.
   Summe = Ist/Plan + Aktion bestätigt + Aktion geplant + Listung geplant; „Alle Kunden“ bzw. „Alle Produkte“ = Summe der Blöcke.
   Werte der Kundenblöcke wie im Original (Ebene „All Products“, Kunden 15548 und 15561); sie stimmen in sich:
   Ø 12/6/3 Monate und Trend folgen aus derselben Ist-Historie. Produkt „Kombi 2.0“ aus dem Block „A4“ des Originals,
   auf die beiden Kunden aufgeteilt. Monatsachse um 15 Jahre und 8 Monate verschoben (2/2012 → 10/2027). */
(() => {
  "use strict";
  const { el, sv, zahl, leseZahl, pruefeFeld } = MK;
  MK.init({ titel: "Rollierende Absatzplanung" });
  const $ = id => document.getElementById(id);

  /* ---------- Monate: m = 0 ist Oktober 2026; c = erster Planmonat (Oktober 2027) ---------- */
  const MON = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
  const MON_LANG = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
  const mIdx = m => (m + 9) % 12, mJahr = m => 2026 + Math.floor((m + 9) / 12);
  const mLang = m => MON_LANG[mIdx(m)] + " " + mJahr(m);
  let c = 12;

  /* ---------- Stammdaten (fiktiv) ---------- */
  const PROD = [["P1", "Kompakt 2.0"], ["P2", "Kombi 2.0"]];
  const KUND = [["15548", "Autohaus Kiel"], ["15561", "Service Lübeck"]];
  const ARTEN = ["basis", "akb", "akg", "lst"];
  const ZEILEN = ["Trend (Vorjahr)", "Ist/Plan", "Aktion bestätigt", "Aktion geplant", "Listung geplant", "Summe"];
  // Ist Okt 2026 bis Sep 2027 (m 0–11); Planzeilen ab Okt 2027 (m 12 ff.)
  function blatt(ist, plan) {
    const o = { ist: {} };
    ist.forEach((v, i) => { if (v) o.ist[i] = v; });
    ARTEN.forEach((a, j) => { o[a] = {}; plan[j].forEach((v, i) => { if (v) o[a][12 + i] = v; }); });
    return o;
  }
  const D = {
    P1: { "15548": blatt([3, 2, 3, 4, 6, 1, 2, 0, 1, 2, 0, 1], [[5, 5, 8, 8], [3, 1, 2, 1], [0, 2, 2, 2], [1, 0, 0, 0]]),
          "15561": blatt([1, 2, 1, 2, 1, 1, 0, 3, 2, 1, 1, 1], [[2, 1, 3, 2], [1, 0, 0, 0], [0, 0, 0, 1], [0, 0, 2, 0]]) },
    P2: { "15548": blatt([1, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 1], [[2, 2, 3, 3], [1, 1, 1, 0], [0, 1, 0, 1], [1, 0, 0, 0]]),
          "15561": blatt([0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0], [[0, 1, 2, 1], [1, 0, 1, 0], [0, 0, 1, 1], [0, 0, 0, 0]]) },
  };

  /* ---------- Hierarchie: Produkt → Kunde (PK) oder Kunde → Produkt (KP) ---------- */
  let hier = "PK";
  const wahl = { PK: "P1", KP: "15548" };
  function bloecke() {
    if (hier === "PK") {
      const p = wahl.PK;
      return [{ p, k: "*", text: ["Alle Kunden", "Region Nord"] }, ...KUND.map(([k, t]) => ({ p, k, text: [k, t] }))];
    }
    const k = wahl.KP;
    return [{ p: "*", k, text: ["Alle Produkte"] }, ...PROD.map(([p, t]) => ({ p, k, text: [t] }))];
  }
  const blaetter = blk => {
    const r = [];
    PROD.forEach(([p]) => KUND.forEach(([k]) => { if ((blk.p === "*" || blk.p === p) && (blk.k === "*" || blk.k === k)) r.push(D[p][k]); }));
    return r;
  };
  const wert = (blk, art, m) => blaetter(blk).reduce((s, L) => s + (L[art][m] || 0), 0);
  const plansumme = (blk, m) => ARTEN.reduce((s, a) => s + wert(blk, a, m), 0);
  const mittel = (blk, n) => { let s = 0; for (let m = c - n; m < c; m++) s += wert(blk, "ist", m); return s / n; };
  const editierbar = blk => blk.p !== "*" && blk.k !== "*";

  /* ---------- Auswahlfeld ---------- */
  function auswahlFuellen() {
    const sel = $("f-auswahl");
    sel.textContent = "";
    const liste = hier === "PK" ? [["*", "Alle Produkte"], ...PROD] : [["*", "Alle Kunden"], ...KUND.map(([k, t]) => [k, k + " " + t])];
    liste.forEach(([v, t]) => el("option", v === wahl[hier] ? { value: v, selected: "" } : { value: v }, sel, t));
    $("l-auswahl").textContent = hier === "PK" ? "Produkt" : "Kunde";
    $("kopf-titel").textContent = hier === "PK" ? "Absatzplanung Produkt/Kunde" : "Absatzplanung Kunde/Produkt";
  }
  $("f-auswahl").addEventListener("change", e => { wahl[hier] = e.target.value; aufbauen(); });

  /* ---------- Raster aufbauen ---------- */
  const raster = $("raster");
  const SP_IST = 4, SP_PLAN = 9;                                // Spaltenindex j der ersten Ist- bzw. Planspalte
  const monat = j => (j < SP_PLAN ? c - 5 + (j - SP_IST) : c + (j - SP_PLAN));
  const pos = (z, s, n = 1) => `grid-row:${z};grid-column:${s}${n > 1 ? " / span " + n : ""}`;
  function kopfzeilen() {
    el("div", { class: "mx-k gruppe", id: "h-avg", style: pos(1, 3, 3) }, raster, "Ø Ist der letzten");
    el("div", { class: "mx-k gruppe", id: "h-ist", style: pos(1, 3 + SP_IST, 5) }, raster, "Ist in Stück");
    el("div", { class: "mx-k gruppe", id: "h-plan", style: pos(1, 3 + SP_PLAN, 12) }, raster, "Plan in Stück – rollierend über 12 Monate");
    // Jahreszeile: zusammenhängende Monate desselben Jahres je Abschnitt
    [[SP_IST, 5, "ist"], [SP_PLAN, 12, "plan"]].forEach(([j0, n, name]) => {
      let j = j0;
      while (j < j0 + n) {
        const jahr = mJahr(monat(j));
        let k = j;
        while (k + 1 < j0 + n && mJahr(monat(k + 1)) === jahr) k++;
        const at = { class: "mx-k links" + (j === j0 ? " trenn" : ""), style: pos(2, 3 + j, k - j + 1) + ";padding-left:4px" };
        if (j === j0) at.id = "h-jahr-" + name;
        el("div", at, raster, String(jahr));
        j = k + 1;
      }
    });
    el("div", { class: "mx-k links k3", id: "h-block", style: pos(3, 1) }, raster, hier === "PK" ? "Kunde" : "Produkt");
    el("div", { class: "mx-k links k3", style: pos(3, 2) }, raster, "Planzeile");
    ["12 M", "6 M", "3 M"].forEach((t, j) => el("div", { class: "mx-k k3", style: pos(3, 3 + j) }, raster, t));
    el("div", { class: "mx-k mitte k3", id: "h-verlauf", style: pos(3, 6) }, raster, "Verlauf");
    for (let j = SP_IST; j < SP_PLAN + 12; j++)
      el("div", { class: "mx-k k3" + (j === SP_IST || j === SP_PLAN ? " trenn" : ""), style: pos(3, 3 + j) }, raster, MON[mIdx(monat(j))]);
  }
  let BL = [];
  function aufbauen() {
    raster.textContent = "";
    kopfzeilen();
    BL = bloecke();
    BL.forEach((blk, b) => {
      const z0 = 4 + b * 6, edit = editierbar(blk);
      const kb = el("div", { class: "mx-b", id: "b" + b, style: `grid-row:${z0} / span 6;grid-column:1` }, raster);
      blk.text.forEach(t => el("span", { class: "mk-label" }, kb, t));
      ZEILEN.forEach((t, r) => {
        const sum = r === 5 ? " summe" : "";
        el("span", { class: "mk-label mx-l" + sum, id: `z${b}-${r}`, style: pos(z0 + r, 2) }, raster, t);
        for (let j = 0; j < SP_PLAN + 12; j++) {
          const id = `c${b}-${r}-${j}`, st = pos(z0 + r, 3 + j);
          const trenn = j === SP_IST || j === SP_PLAN ? " trenn" : "";
          if (edit && j >= SP_PLAN && r >= 1 && r <= 4) {
            const art = ARTEN[r - 1], m = monat(j), v = wert(blk, art, m);
            const f = el("input", { class: "mk-feld mk-zahl" + trenn, id, style: st, value: v ? zahl(v, 0) : "", inputmode: "numeric",
              "aria-label": `${t}, ${MON_LANG[mIdx(m)]} ${mJahr(m)}`, "data-hilfe": "Ganze Stückzahl", "data-b": b, "data-art": art, "data-j": j }, raster);
            f.addEventListener("input", eingabe);
            f.addEventListener("blur", () => { const w = gueltig(f); if (w !== undefined) f.value = w ? zahl(w, 0) : ""; });
          } else {
            el("div", { class: "mk-feld mk-anzeige" + (j === 3 ? " verlauf" : " mk-zahl") + trenn + sum, id, style: st }, raster);
          }
        }
      });
    });
    const mm = String(mIdx(c) + 1).padStart(2, "0");
    $("kopf-unter").textContent = `Absatzmenge in Stück nach Liefermonat · Stand 12.${mm}.${mJahr(c)} · Bearbeitung: Frau Brandt`;
    rechnen();
    if (MK.skalieren) MK.skalieren();
    if (MK._ebenenNeu) MK._ebenenNeu();
  }

  /* ---------- Rechnen: Ø, Verlauf, Ist, Trend, Summen ---------- */
  const setze = (id, v, nk = 0) => { const e = $(id); if (e) e.textContent = v ? zahl(v, nk) : ""; };
  function verlauf(zelle, werte) {
    zelle.textContent = "";
    const max = Math.max(...werte);
    const s = sv("svg", { width: 30, height: 17, viewBox: "0 0 30 17", "aria-hidden": "true" }, zelle);
    ["#A9A9A9", "#6E747A", "#3A3F44"].forEach((f, i) => {
      const h = max > 0 && werte[i] > 0 ? Math.max(1, Math.round(werte[i] / max * 16)) : 0;
      if (h) sv("rect", { x: i * 11, y: 17 - h, width: 8, height: h, fill: f }, s);
    });
    zelle.title = "Ø 12 / 6 / 3 Monate: " + werte.map(v => zahl(v, 1)).join(" / ");
  }
  function rechnen() {
    BL.forEach((blk, b) => {
      const avg = [12, 6, 3].map(n => mittel(blk, n));
      [1, 5].forEach(r => avg.forEach((v, j) => setze(`c${b}-${r}-${j}`, v, 1)));
      verlauf($(`c${b}-1-3`), avg);
      for (let j = SP_IST; j < SP_PLAN; j++) { const v = wert(blk, "ist", monat(j)); setze(`c${b}-1-${j}`, v); setze(`c${b}-5-${j}`, v); }
      for (let j = SP_PLAN; j < SP_PLAN + 12; j++) {
        const m = monat(j);
        setze(`c${b}-0-${j}`, wert(blk, "ist", m - 12));
        if (!editierbar(blk)) ARTEN.forEach((a, i) => setze(`c${b}-${i + 1}-${j}`, wert(blk, a, m)));
        setze(`c${b}-5-${j}`, plansumme(blk, m));
      }
    });
  }

  /* ---------- Eingaben: ganze Stückzahlen 0–999 ---------- */
  const MELD = "Ganze Stückzahl von 0 bis 999";
  function gueltig(f) {
    const v = pruefeFeld(f, "zahl", { min: 0, max: 999, meldung: MELD });
    if (v != null && !Number.isInteger(v)) { f.classList.add("mk-fehler"); f.title = MELD; }
    return f.classList.contains("mk-fehler") ? undefined : (v || 0);
  }
  function eingabe(e) {
    const f = e.target, v = gueltig(f);
    if (v !== undefined) {
      const blk = BL[+f.dataset.b], L = D[blk.p][blk.k], m = monat(+f.dataset.j);
      if (v) L[f.dataset.art][m] = v; else delete L[f.dataset.art][m];
    }
    rechnen();
  }

  /* ---------- Knöpfe ---------- */
  $("k-tauschen").addEventListener("click", () => { hier = hier === "PK" ? "KP" : "PK"; auswahlFuellen(); aufbauen(); });
  $("k-rollieren").addEventListener("click", () => {
    if (document.querySelector("#absatz .mk-fehler")) { MK.meldung("Bitte zuerst die rot markierten Eingaben korrigieren."); return; }
    if (c >= 18) { MK.meldung("Beispielmaske: höchstens sechs Monate weiterrollen."); return; }
    PROD.forEach(([p]) => KUND.forEach(([k]) => {
      const L = D[p][k], s = ARTEN.reduce((a, art) => a + (L[art][c] || 0), 0);
      if (s) L.ist[c] = s; else delete L.ist[c];
      ARTEN.forEach(art => delete L[art][c]);
    }));
    const alt = c;
    c++;
    aufbauen();
    MK.meldung(`${mLang(alt)} abgeschlossen: Plansumme als Ist übernommen, Planung reicht jetzt bis ${mLang(c + 11)}.`);
  });
  [["k-drucken", "Bericht drucken"], ["k-pdf", "PDF-Bericht"], ["k-excel", "Excel-Bericht"]].forEach(([id, t]) =>
    $(id).addEventListener("click", () => MK.meldung(`Beispielmaske: „${t}“ ist nicht hinterlegt.`)));

  auswahlFuellen();
  aufbauen();

  /* ---------- Lernplattform: Erläuterungen und Gestaltung ---------- */
  MK.ebenen({
    erlaeuterungen: {
      titel: "Erläuterungen",
      intro: "Was die Bereiche der Maske in der rollierenden Absatzplanung leisten. Die Nummern in der Maske zeigen, wo.",
      eintraege: [
        { nr: 1, ziel: "f-auswahl", versatz: [-4, 2], titel: "Planungsobjekt Produkt und Kunde",
          text: "Geplant wird die Absatzmenge in Stück je Produkt und Kunde, nach Liefermonat. Die Auswahl legt den Ausschnitt fest: ein Produkt mit allen Kunden der Kundengruppe. Wählen Sie „Alle Produkte“: Dann zeigt die Maske nur verdichtete Werte." },
        { nr: 2, ziel: "c1-0-2", versatz: [-6, 1], titel: "Vergleichswerte",
          text: "Der Durchschnitt des Ist der letzten 12, 6 und 3 Monate zeigt das übliche Niveau eines Kunden. Die drei Balken unter „Verlauf“ stellen ihn nebeneinander: Wird der rechte, jüngste Balken kürzer, sinkt der Absatz." },
        { nr: 3, ziel: "c1-2-6", versatz: [-6, 1], titel: "Ist der letzten fünf Monate",
          text: "Das Ist der jüngsten Monate schließt die Planung an die Vergangenheit an. Planende sehen, ob der zuletzt geplante Verlauf eingetreten ist, bevor sie die nächsten Monate planen." },
        { nr: 4, ziel: "h-plan", versatz: [-4, -2], titel: "Rollierender Planungshorizont",
          text: "Geplant werden immer die nächsten zwölf Monate. Ist ein Monat abgeschlossen, rückt sein Ist in den Vergleich, und am Ende kommt ein neuer Planmonat hinzu – der Horizont bleibt gleich lang. Probieren Sie „Monat weiterrollen“." },
        { nr: 5, ziel: "c1-0-8", versatz: [-6, 1], titel: "Trend aus dem Vorjahr",
          text: "Als Vorschlag zeigt die Zeile „Trend (Vorjahr)“ die Absatzmenge desselben Monats im Vorjahr. So wird die Saison sichtbar; wer davon abweicht, plant bewusst." },
        { nr: 6, ziel: "c1-3-15", versatz: [-6, 1], titel: "Planzeilen und Summe",
          text: "Neben der Grundplanung (Ist/Plan) werden bestätigte und geplante Verkaufsaktionen sowie geplante Listungen getrennt erfasst. Die Summe rechnet sich aus den vier Zeilen; Sondereffekte bleiben so im Plan-Ist-Vergleich erkennbar." },
        { nr: 7, ziel: "b0", versatz: [-6, 62], titel: "Verdichtung bottom-up",
          text: "Der Block „Alle Kunden“ addiert die Kundenblöcke. Geplant wird nur auf der untersten Ebene Produkt und Kunde; die Summen folgen bottom-up und gehen in die Umsatzplanung ein." },
        { nr: 8, ziel: "k-tauschen", versatz: [14, -12], titel: "Sicht wechseln",
          text: "„Kunde/Produkt tauschen“ wechselt die Hierarchie: Dann stehen die Produkte eines Kunden untereinander. Die Zahlen bleiben dieselben, nur die Sicht ändert sich – für Kundengespräche ist sie oft die passendere." },
      ],
    },
    gestaltung: {
      titel: "Gestaltung",
      intro: "Was gegenüber dem Original geändert wurde – softwareneutral im Buchstil und nach den Interaktionsprinzipien der DIN EN ISO 9241-110.",
      eintraege: [
        { nr: "A", ziel: "kopf", versatz: [-6, 8], regel: "BUCHSTIL – SOFTWARENEUTRAL", titel: "Kein Logo, kein Benutzername",
          text: "Firmenlogo, farbiger Titelbalken mit Verlauf, Benutzername, Filtersymbole, Bildlaufleiste und die Navigationsknöpfe „Start-Cockpit“ und „Zurück zur Vertrieb“ des Originals entfallen. Übrig bleibt die Maske mit ihrem Namen als Titel." },
        { nr: "B", ziel: "z1-5", versatz: [-6, 1], regel: "SELBSTBESCHREIBUNGSFÄHIGKEIT", titel: "Summen fett statt gelb",
          text: "Summenzeilen sind fett und grau hinterlegt, die Abschnitte durch Linien getrennt. Das Original färbte die Summen gelb, die Spaltenköpfe türkis, grün und violett und trennte die Abschnitte durch dunkle Balken – im Graustufendruck kaum zu unterscheiden." },
        { nr: "C", ziel: "c1-1-14", versatz: [-6, 1], regel: "SELBSTBESCHREIBUNGSFÄHIGKEIT", titel: "Eingabe und Anzeige unterscheidbar",
          text: "Nur die Planzellen der Kunden sind weiß und eingabebereit; Ist, Durchschnitte, Trend, Summen und der Block „Alle Kunden“ sind grau. Im Original sahen alle Zellen gleich aus." },
        { nr: "D", ziel: "c2-2-5", versatz: [-6, 1], regel: "ERWARTUNGSKONFORMITÄT", titel: "Stückzahlen ohne Nachkommastellen",
          text: "Absatzmengen stehen als ganze Stück, Durchschnitte mit einer Nachkommastelle. Das Original zeigte Stückzahlen wie „7,00“ mit zwei Nachkommastellen." },
        { nr: "E", ziel: "h-jahr-ist", versatz: [-6, -2], regel: "SELBSTBESCHREIBUNGSFÄHIGKEIT", titel: "Monate und Einheit lesbar",
          text: "Spaltenköpfe mit Jahreszeile und Monatsnamen statt „9 2011“; die Einheit Stück steht an den Abschnitten. „IstPlan“, „Aktion_bestätigt“ und „Listung_geplant“ heißen jetzt „Ist/Plan“, „Aktion bestätigt“ und „Listung geplant“." },
        { nr: "F", ziel: "b1", versatz: [-6, 62], regel: "BUCHSTIL – NEUTRAL UND AKTUELL", titel: "Fiktive Namen, stimmige Daten",
          text: "Hersteller, Modelle, Kunden und Benutzername des Originals sind durch fiktive Angaben ersetzt. Das Original nannte als Datum den 12.10.2015, zeigte aber Monate von 2011 bis 2013; jetzt passen Stand 12.10.2027, Ist Mai bis September 2027 und Plan Oktober 2027 bis September 2028 zusammen." },
        { nr: "G", ziel: "z0-5", versatz: [-6, 1], regel: "AUFGABENANGEMESSENHEIT", titel: "Summen über alle Ebenen",
          text: "„Alle Kunden“ ist genau die Summe der gezeigten Kundenblöcke und rechnet bei jeder Eingabe mit. Im Original enthielt die Summe weitere, nicht gezeigte Kunden." },
        { nr: "H", ziel: "c2-1-13", versatz: [-6, 1], regel: "ROBUSTHEIT GEGEN BENUTZUNGSFEHLER", titel: "Eingaben werden geprüft",
          text: "Planzellen nehmen nur ganze Stückzahlen von 0 bis 999 an. Ungültige Eingaben werden rot markiert und nicht in die Summen übernommen; „Monat weiterrollen“ ist erst nach der Korrektur möglich." },
      ],
    },
  });
  MK.fertig();
})();
