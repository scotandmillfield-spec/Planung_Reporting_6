/* Abb. 3.186 (zusammengeführt mit Abb. 3.187) „Exemplarische Zuschläge in der Einkaufspreisplanung“ – Logik der Maske
   „Materialpreisplanung“ mit Gruppen- und Einzelplanung in einem Formular.
   Gruppenplanung: je ein Preisänderungsfaktor für jede Lieferantengruppe (LG) und jede Warengruppe (WG).
   Einzelplanung je Lieferant und Material (Preise je 100 Stück):
     Planpreis (Vorschlag) = Brutto × Faktor LG × Faktor WG, auf Cent gerundet; einzeln überschreibbar (fett),
     ein geleertes Feld übernimmt wieder den Vorschlag;
     Volumen = Menge × Planpreis / 100;  Abweichung = Menge × (Ø-Preis lfd. Jahr − Planpreis) / 100;
     Abweichung in % = (Ø-Preis − Planpreis) / Planpreis (negativ: Planpreis über dem Durchschnittspreis).
   Gruppen: Positionen und Volumen über alle Positionen der Gruppe.
   Werte: LG10 1,000 (Lieferant 55654) und WG 3 Polster 1,020 ergeben den Zuschlag 1,020 aus Abb. 3.187; die ersten sechs
   Materialien von 55654 mit Mengen, Bruttopreisen und Ø-Preisen wie im Original von Abb. 3.187. LG20 0,969 (Faktor des
   Originals) und WG 6 Bezüge +10 % (Umwertung des Originals) als Faktor 1,100; Lieferant 50024 mit vier Positionen fiktiv
   ergänzt (dasselbe Material 1082081 bei zwei Lieferanten). Beispiel Einzelplanung: 1082088 Planpreis 1.310,00 €. */
(() => {
  "use strict";
  const { el, zahl, leseZahl, pruefeFeld } = MK;
  MK.init({ titel: "Exemplarische Zuschläge in der Einkaufspreisplanung" });
  const $ = id => document.getElementById(id);
  const NDASH = String.fromCharCode(0x2013), PM = String.fromCharCode(0xB1);

  /* ---------- Stammdaten (fiktiv) ---------- */
  const START_LG = [["LG10", "Polster- und Schaumteile", 1.000], ["LG20", "Textilien und Bezüge", 0.969]];
  const START_WG = [["3", "Polster", 1.020], ["6", "Bezüge", 1.100]];
  const LIEF = [["55654", "Polsterwerk Ost", "LG10"], ["50024", "Bezugsstoffe West", "LG20"]];
  // Lieferant, Material, Bezeichnung, Warengruppe, Menge in Stück, Brutto, Ø-Preis lfd. Jahr (je 100 Stück)
  const POS = [
    ["55654", "1075379", "Rückenpolster Stoff", "3", 9484, 1761, 1739],
    ["55654", "1075377", "Sitzpolster Stoff", "3", 9466, 2022, 1981],
    ["55654", "1082081", "Sitzpolster Kunstleder", "3", 53248, 1553, 1502],
    ["55654", "1082088", "Rückenpolster Kunstleder", "3", 47338, 1299, 1267],
    ["55654", "1089870", "Rückenpolster Stoff", "3", 1461, 1401, 1401],
    ["55654", "1073500", "Rückenpolster Kunstleder", "3", 2530, 1360, 1360],
    ["50024", "1082081", "Sitzpolster Kunstleder", "3", 6000, 1530, 1515],
    ["50024", "2040110", "Bezugsstoff anthrazit", "6", 12000, 845, 860],
    ["50024", "2040115", "Bezug Kunstleder", "6", 8400, 1120, 1100],
    ["50024", "2040120", "Bezugsstoff grau", "6", 5200, 905, 905]];
  const START_UEBER = { 3: 1310.00 };     // Index der Position → einzeln geplanter Planpreis
  const kopie = x => JSON.parse(JSON.stringify(x));
  let LG, WG, PP;                          // PP[i] = eigener Planpreis oder null (Vorschlag)
  function laden() { LG = kopie(START_LG); WG = kopie(START_WG); PP = POS.map((_, i) => START_UEBER[i] == null ? null : START_UEBER[i]); }
  laden();
  const lgVon = p => LIEF.find(l => l[0] === p[0])[2];
  const fLG = p => LG.find(g => g[0] === lgVon(p))[2];
  const fWG = p => WG.find(g => g[0] === p[3])[2];
  const vorschlag = i => { const p = POS[i]; return Math.round(p[5] * fLG(p) * fWG(p) * 100) / 100; };
  const planpreis = i => PP[i] == null ? vorschlag(i) : PP[i];

  /* ---------- Raster ---------- */
  const pos = (z, s, n = 1) => `grid-row:${z};grid-column:${s}${n > 1 ? " / span " + n : ""}`;
  const PR_F = { min: 0.5, max: 2, pflicht: true, meldung: "Faktor zwischen 0,500 und 2,000, z. B. 1,020" };
  const PR_P = { min: 0, max: 99999, meldung: "Preis je 100 Stück in € mit Dezimalkomma, z. B. 1.796,22" };
  function gruppen(rid, liste, art) {
    const r = $(rid);
    r.querySelectorAll(".zeile").forEach(e => e.remove());
    liste.forEach((g, i) => {
      const z = 3 + i;
      [[1, g[0]], [2, g[1]]].forEach(([s, t]) => el("span", { class: "mk-label mx-l zeile", id: `${art}-${i}-${s}`, style: pos(z, s) }, r, t));
      const f = el("input", { class: "mk-feld mk-zahl zeile", id: `${art}-f-${i}`, style: pos(z, 3), value: zahl(g[2], 3), inputmode: "decimal",
        "aria-label": `Preisänderungsfaktor, ${art === "lg" ? "Lieferantengruppe" : "Warengruppe"} ${g[0]}`,
        "data-hilfe": "Faktor gilt für alle nicht überschriebenen Positionen der Gruppe" }, r);
      f.addEventListener("input", () => { const v = pruefeFeld(f, "zahl", PR_F); if (!f.classList.contains("mk-fehler")) g[2] = v; rechnen(); });
      f.addEventListener("blur", () => { if (!f.classList.contains("mk-fehler")) f.value = zahl(g[2], 3); });
      el("div", { class: "mk-feld mk-anzeige mk-zahl zeile", id: `${art}-n-${i}`, style: pos(z, 4) }, r);
      el("div", { class: "mk-feld mk-anzeige mk-zahl zeile", id: `${art}-v-${i}`, style: pos(z, 5) }, r);
    });
  }
  function positionen() {
    const r = $("raster-pos");
    r.querySelectorAll(".zeile").forEach(e => e.remove());
    let z = 3;
    LIEF.forEach(l => {
      const idx = POS.map((p, i) => [p, i]).filter(([p]) => p[0] === l[0]);
      const b = el("div", { class: "mx-b zeile", id: `b-${l[0]}`, style: `grid-row:${z} / span ${idx.length};grid-column:1` }, r);
      [l[0], l[1], "Gruppe " + l[2]].forEach(t => el("span", { class: "mk-label" }, b, t));
      idx.forEach(([p, i]) => {
        el("span", { class: "mk-label mx-l zeile", id: `m-${i}`, style: pos(z, 2) }, r, p[1]);
        el("span", { class: "mk-label mx-l zeile", id: `t-${i}`, style: pos(z, 3) }, r, p[2]);
        el("span", { class: "mk-label mx-l zeile", id: `w-${i}`, style: pos(z, 4) }, r, p[3]);
        el("div", { class: "mk-feld mk-anzeige mk-zahl zeile", id: `me-${i}`, style: pos(z, 5) }, r, zahl(p[4], 0));
        el("div", { class: "mk-feld mk-anzeige mk-zahl zeile", id: `br-${i}`, style: pos(z, 6) }, r, zahl(p[5], 2));
        el("div", { class: "mk-feld mk-anzeige mk-zahl zeile", id: `flg-${i}`, style: pos(z, 7) }, r);
        el("div", { class: "mk-feld mk-anzeige mk-zahl zeile", id: `fwg-${i}`, style: pos(z, 8) }, r);
        const f = el("input", { class: "mk-feld mk-zahl zeile", id: `pp-${i}`, style: pos(z, 9), inputmode: "decimal", "data-i": String(i),
          "aria-label": `Planpreis je 100 Stück, Lieferant ${p[0]}, Material ${p[1]}` }, r);
        f.addEventListener("input", () => {
          if (f.value.trim() === "") { PP[i] = null; f.classList.remove("mk-fehler", "ueber"); rechnen(); return; }
          const v = pruefeFeld(f, "zahl", PR_P);
          if (!f.classList.contains("mk-fehler")) { PP[i] = v; f.classList.add("ueber"); }
          rechnen();
        });
        f.addEventListener("blur", () => { if (!f.classList.contains("mk-fehler")) ppZeigen(f); });
        el("div", { class: "mk-feld mk-anzeige mk-zahl zeile", id: `dsp-${i}`, style: pos(z, 10) }, r, zahl(p[6], 2));
        [11, 12, 13].forEach(s => el("div", { class: "mk-feld mk-anzeige mk-zahl zeile", id: `a${s}-${i}`, style: pos(z, s) }, r));
        z++;
      });
    });
    el("div", { class: "leer zeile", style: pos(z, 1) }, r);
    el("span", { class: "mk-label mx-l summe zeile", id: "l-summe", style: pos(z, 2, 2) }, r, "Summe");
    el("div", { class: "leer zeile", style: pos(z, 4) }, r);
    el("div", { class: "mk-feld mk-anzeige mk-zahl summe zeile", id: "sum-menge", style: pos(z, 5) }, r);
    el("div", { class: "leer zeile", id: "sum-preis", style: pos(z, 6, 5) }, r);
    [11, 12, 13].forEach(s => el("div", { class: "mk-feld mk-anzeige mk-zahl summe zeile", id: `sum-${s}`, style: pos(z, s) }, r));
  }
  function ppZeigen(f) {
    const i = +f.dataset.i, eigen = PP[i] != null;
    f.value = zahl(planpreis(i), 2);
    f.classList.toggle("ueber", eigen);
    f.title = eigen ? `Einzeln geplant (Vorschlag ${zahl(vorschlag(i), 2)} €) – Feld leeren übernimmt den Vorschlag`
      : "Vorschlag aus Brutto × Faktor LG × Faktor WG – Eingabe überschreibt ihn für diese Position";
  }

  /* ---------- Rechnen: Gruppenfaktoren wirken sofort auf die Positionen ---------- */
  const prozent = v => (Math.abs(v) < 0.005 ? PM + zahl(0, 2) : zahl(v, 2));
  function rechnen() {
    const gFehler = !!document.querySelector("#abschnitt-gruppe .mk-fehler");
    let menge = 0, vol = 0, abw = 0, ok = !gFehler;
    const gruppe = { lg: {}, wg: {} };
    POS.forEach((p, i) => {
      menge += p[4];
      $(`flg-${i}`).textContent = gFehler ? NDASH : zahl(fLG(p), 3);
      $(`fwg-${i}`).textContent = gFehler ? NDASH : zahl(fWG(p), 3);
      const f = $(`pp-${i}`);
      if (f !== document.activeElement && !f.classList.contains("mk-fehler") && !gFehler) ppZeigen(f);
      if (gFehler || f.classList.contains("mk-fehler")) { [11, 12, 13].forEach(s => { $(`a${s}-${i}`).textContent = NDASH; }); ok = false; return; }
      const pp = planpreis(i), v = p[4] * pp / 100, a = p[4] * (p[6] - pp) / 100;
      $(`a11-${i}`).textContent = zahl(v, 0);
      $(`a12-${i}`).textContent = Math.abs(a) < 0.5 ? PM + "0" : zahl(a, 0);
      $(`a13-${i}`).textContent = pp ? prozent((p[6] - pp) / pp * 100) : NDASH;
      vol += v; abw += a;
      [["lg", lgVon(p)], ["wg", p[3]]].forEach(([art, k]) => { const g = gruppe[art][k] || (gruppe[art][k] = [0, 0]); g[0]++; g[1] += v; });
    });
    [["lg", LG], ["wg", WG]].forEach(([art, liste]) => liste.forEach((g, i) => {
      const w = gruppe[art][g[0]] || [0, 0];
      $(`${art}-n-${i}`).textContent = String(POS.filter(p => (art === "lg" ? lgVon(p) : p[3]) === g[0]).length);
      $(`${art}-v-${i}`).textContent = ok ? zahl(w[1], 0) : NDASH;
    }));
    $("sum-menge").textContent = zahl(menge, 0);
    $("sum-11").textContent = ok ? zahl(vol, 0) : NDASH;
    $("sum-12").textContent = ok ? zahl(abw, 0) : NDASH;
    $("sum-13").textContent = ok && vol ? prozent(abw / vol * 100) : NDASH;
    return [vol, abw];
  }
  function neu() { gruppen("raster-lg", LG, "lg"); gruppen("raster-wg", WG, "wg"); positionen(); rechnen(); if (MK.skalieren) MK.skalieren(); if (MK._ebenenNeu) MK._ebenenNeu(); }
  neu();

  /* ---------- Knöpfe ---------- */
  const fehler = () => !!document.querySelector("#zuschlaege .mk-fehler");
  $("k-sichern").addEventListener("click", () => {
    if (fehler()) { MK.meldung("Nicht gesichert: Bitte zuerst die rot markierten Eingaben korrigieren."); return; }
    const [vol] = rechnen(), n = PP.filter(v => v != null).length;
    MK.meldung(`Gesichert: Gruppenfaktoren und ${POS.length} Planpreise (${n} einzeln geplant), Einkaufsvolumen ${zahl(vol, 0)} €.`);
  });
  $("k-aktualisieren").addEventListener("click", () => {
    laden(); neu();
    MK.meldung("Aktualisiert: zuletzt gesicherte Faktoren und Planpreise geladen.");
  });
  $("k-uebernahme").addEventListener("click", () => {
    LG = kopie(START_LG); neu();
    MK.meldung("Konditionen aus den Einkaufsinfosätzen übernommen: Faktoren der Lieferantengruppen zurückgesetzt.");
  });

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
        { nr: 1, ziel: "band-gruppe", versatz: [-24, 2], titel: "Gruppenplanung vor der Einzelplanung",
          text: "Statt jeden Materialpreis einzeln zu schätzen, legt der Einkauf zuerst pauschale Preisänderungen fest – einmal je Lieferantengruppe und einmal je Warengruppe. Daraus entsteht für jede Position ein Planpreis-Vorschlag." },
        { nr: 2, ziel: "lg-f-1", anker: "links", versatz: [32, 1], titel: "Faktor je Lieferantengruppe",
          text: "Der Faktor gibt die erwartete Preisänderung der Lieferanten einer Gruppe wieder, etwa aus Rahmenverträgen: 0,969 heißt 3,1 % billiger, 1,000 unverändert." },
        { nr: 3, ziel: "wg-f-1", anker: "links", versatz: [32, 1], titel: "Faktor je Warengruppe",
          text: "Unabhängig vom Lieferanten wirkt die Marktentwicklung einer Warengruppe, etwa steigende Rohstoffpreise: 1,100 heißt +10 % für alle Bezüge." },
        { nr: 4, ziel: "h-faktor", versatz: [-4, -2], titel: "Beide Faktoren je Position",
          text: "Jede Kombination aus Lieferant und Material erhält den Faktor ihrer Lieferantengruppe und den ihrer Warengruppe. Planpreis = Brutto × Faktor LG × Faktor WG, etwa 1.761,00 × 1,000 × 1,020 = 1.796,22 €." },
        { nr: 5, ziel: "b-50024", versatz: [-6, 62], titel: "Lieferanten-Produkt-Kombination",
          text: "Dasselbe Material kann von mehreren Lieferanten kommen: Das Sitzpolster Kunstleder 1082081 bezieht das Unternehmen von 55654 und 50024 – mit eigenem Bruttopreis, eigenem Faktor und deshalb eigenem Planpreis." },
        { nr: 6, ziel: "pp-3", anker: "links", versatz: [32, 1], titel: "Einzeln überschreiben",
          text: "Der Vorschlag lässt sich je Position überschreiben, etwa wenn ein Lieferantenwechsel oder eine Verhandlung ansteht – hier 1.310,00 € statt 1.324,98 €. Überschriebene Preise sind fett und bleiben stehen, wenn sich ein Faktor ändert; ein geleertes Feld übernimmt wieder den Vorschlag." },
        { nr: 7, ziel: "h-abw", versatz: [12, -2], titel: "Abweichung zum Durchschnittspreis",
          text: "Abweichung = Menge × (Ø-Preis lfd. Jahr − Planpreis). Negativ heißt: Der Planpreis liegt über dem heutigen Durchschnittspreis, das Material wird teurer." },
        { nr: 8, ziel: "h-lg-vol", versatz: [-4, 2], titel: "Wirkung der Gruppen",
          text: "Positionen und Volumen je Gruppe zeigen, wie viel Einkaufsvolumen ein Faktor bewegt. Ändern Sie einen Faktor: Planpreise, Volumen, Abweichungen und Summe folgen sofort." },
      ],
    },
    gestaltung: {
      titel: "Gestaltung",
      intro: "Was gegenüber dem Original geändert wurde – softwareneutral im Buchstil und nach den Interaktionsprinzipien der DIN EN ISO 9241-110.",
      eintraege: [
        { nr: "A", ziel: "kopf", versatz: [-6, 8], regel: "BUCHSTIL – SOFTWARENEUTRAL", titel: "Kein Browserfenster",
          text: "Browserfenster mit Adresszeile (Servername mit Firmennamen) und technischem Fenstertitel, Menü-, Symbol-, Status- und Taskleiste, Bildlauf- und Blätterleiste sowie der Knopf „Beenden“ der Originale entfallen." },
        { nr: "B", ziel: "band-pos", versatz: [-24, 2], regel: "AUFGABENANGEMESSENHEIT", titel: "Gruppen- und Einzelplanung in einem Formular",
          text: "Die Masken „Lieferantenkonditionen“, „MatPreisPlanung Umwertung“ und „Preisplanung“ des Originals sind eine Maske: oben die Faktoren, darunter die Positionen. Die Wirkung eines Faktors ist sofort sichtbar, ohne Reiterwechsel." },
        { nr: "C", ziel: "h-wg-faktor", versatz: [-4, 2], regel: "ERWARTUNGSKONFORMITÄT", titel: "Ein Faktor je Gruppe",
          text: "Lieferanten- und Warengruppe tragen beide einen Preisänderungsfaktor; die Umwertung der Warengruppe in Prozent (+10,00 %) wird zum Faktor 1,100. Der getrennte MTZ-Faktor entfällt, weil alle Positionen ohne Materialteuerungszuschlag sind." },
        { nr: "D", ziel: "pp-0", anker: "links", versatz: [32, 1], regel: "SELBSTBESCHREIBUNGSFÄHIGKEIT", titel: "Herkunft des Planpreises sichtbar",
          text: "Normal gesetzte Planpreise sind Vorschläge aus den Faktoren, fett gesetzte sind einzeln geplant; der Tooltip nennt den Vorschlag. Nur Faktoren und Planpreise sind weiße Eingabefelder, alles andere ist grau." },
        { nr: "E", ziel: "kopf-unter", versatz: [-6, -2], regel: "SELBSTBESCHREIBUNGSFÄHIGKEIT", titel: "Klartext und Einheiten",
          text: "„PB00“ heißt „Brutto“, „PP3“ „Planpreis“, „DSP LFJ“ „Ø-Preis lfd. Jahr“, „Commodity“ „Warengruppe“. Einheiten im Untertitel und an den Spalten, Preise ausdrücklich je 100 Stück, Mengen ganzzahlig." },
        { nr: "F", ziel: "l-summe", versatz: [-6, 1], regel: "AUFGABENANGEMESSENHEIT", titel: "Summenzeile ergänzt",
          text: "Die Summe von Menge, Volumen und Abweichung fehlte im Original. Gleichbleibende Spalten (Werk, Basis-ME, Preiseinheit) stehen einmal im Untertitel." },
        { nr: "G", ziel: "b-55654", versatz: [-6, 62], regel: "BUCHSTIL – NEUTRAL UND AKTUELL", titel: "Fiktive Lieferanten, aktuelles Jahr",
          text: "Die Lieferanten des Originals (reale Unternehmen, im Buch geschwärzt) sind durch fiktive ersetzt, Materialtexte ausgeschrieben; Geschäfts- und Planjahr 2009 werden zu 2028." },
        { nr: "H", ziel: "lg-f-0", anker: "links", versatz: [32, 1], regel: "ROBUSTHEIT GEGEN BENUTZUNGSFEHLER", titel: "Eingaben werden geprüft",
          text: "Faktoren von 0,500 bis 2,000, Preise ab 0 € mit Dezimalkomma. Ungültige Eingaben werden rot markiert, Volumen und Abweichung zeigen „–“, Sichern ist erst nach der Korrektur möglich." },
      ],
    },
  });
  MK.fertig();
})();
