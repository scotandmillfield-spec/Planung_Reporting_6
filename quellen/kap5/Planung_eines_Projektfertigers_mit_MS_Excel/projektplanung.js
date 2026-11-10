/* Abb. 5.75 „Planung eines Projektfertigers“ – Logik des Tabellenblatts „Projektplanung“.
   Werte des Originals (Projekt 1992, Geschäftsjahr 2003/04 → 2027/28), intern in €, angezeigt in Tsd. €.
   Rechenweg wie im Original (nachgerechnet, alle Werte des Screenshots ergeben sich bis auf Rundung):
     Prognose nach Chancen = Prognose lt. Projektliste − Chancen (Sozialkosten: Ist + 80 % × Lohnänderung)
     Rest ab 01.04. = neue Prognose − Ist · Rest ab 01.07. = Rest − davon bis 30.06. · Folgejahr = Rest − davon GJ
     Quartale: fremdbezogene Leistungen = GJ × Kostenverteilung; Lohn und Leasing je Quartal erfasst, GJ = Summe
     Sozialkosten = 80 % des Lohns · Montagenebenkosten = Lohn × (Rest Montage ÷ Rest Lohn) = 21,55 %
     Fertigstellungsgrad = kumulierte Einzelkosten ÷ Einzelkosten der neuen Prognose (Cost-to-Cost)
     Gesamtleistung der Periode = Einzelkosten der Periode ÷ Einzelkosten gesamt × Gesamtleistung gesamt
     Bestandsveränderung = Gesamtleistung − Umsatz · Bestand kumuliert · Arbeitsvorrat = Gesamtleistung gesamt − kum.
     MOR-Schema: Gesamtleistung − fremdbezogene Leistungen = Eigenleistung − Personalkosten = DB Projektergebnis
                 − Deckungsbedarf (40 % der Eigenleistung) = Projektvollkostenergebnis
   Die Chance „Material 150.000“ stand im Original in einer ausgeblendeten Zeile; sie folgt aus der Summe 195.000
   und aus Projektliste − nach Chancen (2.321.162 − 2.171.162). */
(() => {
  "use strict";
  const { el, zahl, leseZahl, pruefeFeld } = MK;
  const NBSP = MK.NBSP, MINUS = MK.MINUS;
  MK.init({ titel: "Projektplanung" });
  const $ = id => document.getElementById(id);

  /* ---------- Daten (€) ---------- */
  const IST = { mat: 0, son: 53, sub: 0, lea: 0, loh: 2081, soz: 1457, mon: 213, um: 0 };
  const LISTE = { mat: 2321162, son: 291250, sub: 410000, lea: 0, loh: 475000, soz: 332500, mon: 0, gl: 3083189 };
  const START = {
    chance: { mat: 150000, son: 15000, sub: 30000, lea: 0, loh: 0, mon: 0 },
    deck: 40, soz: 80, vertU: [25, 25, 25, 25], vertK: [18.75, 31.25, 25, 25],
    I: { mat: 2171162, son: 291250, sub: 380000, lea: 4000, loh: 172555, mon: 36950, gl: 3083189 },
    K: { mat: 10000, son: 2000, sub: 3000, lea: 4000, loh: 19373, um: 100000 },
    M: { mat: 1736930, son: 232958, sub: 304000, um: 10000 },
    Q: { lea: [0, 0, 0, 0], loh: [38323, 37228, 36408, 39142] },
  };
  const P = JSON.parse(JSON.stringify(START));
  const QS = ["N", "O", "P", "Q"];
  const COLS = ["E", "F", "C", "G", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "S"];
  const PER = ["E", "K", "M", "N", "O", "P", "Q", "S"];          // Perioden der Fertigstellungsgradplanung
  const TRENN = new Set(["J", "L", "S"]);
  const KOPF = { E: ["Ist", "bis", "31.03."], F: ["Progn.", "Projekt-", "liste"], C: ["", "", "Chancen"],
    G: ["Progn.", "nach", "Chancen"], I: ["Neue", "Progn.", "gesamt"], J: ["Rest", "ab", "01.04."],
    K: ["davon", "bis", "30.06."], L: ["Rest", "ab", "01.07."], M: ["davon", "GJ", "2027/28"], N: ["Q1", "bis", "30.09."],
    O: ["Q2", "bis", "31.12."], P: ["Q3", "bis", "31.03."], Q: ["Q4", "bis", "30.06."], S: ["Rest", "Folge-", "jahr"] };
  const MOR = "E F G I K M N O P Q S", FGP = "E K M N O P Q S";
  const ZEILEN = [
    { band: "Planung fremdbezogener Leistungen", link: ["l-fremd", "alle übernehmen"] },
    { id: "mat", label: "Material", ein: "C I K M" },
    { id: "son", label: "Sonstige direkte Kosten", ein: "C I K M" },
    { id: "sub", label: "Subunternehmerleistung", ein: "C I K M" },
    { id: "sumF", label: "Summe", summe: true },
    { band: "Personalkostenplanung", link: ["l-pers", "Leasing und Lohn übernehmen"] },
    { id: "lea", label: "Leasingkosten", ein: "C I K N O P Q" },
    { id: "loh", label: "Produktiver Lohn/Gehalt", ein: "C I K N O P Q" },
    { id: "soz", label: "Sozial-/Personalnebenkosten", ohne: "C" },
    { id: "mon", label: "Montagenebenkosten", ein: "C I" },
    { id: "msatz", label: "Montagezuschlag in % Lohn", nur: "J", pz: true, neben: true },
    { id: "sumP", label: "Summe", summe: true },
    { band: "Fertigstellungsgradplanung",
      notiz: "Fertigstellungsgrad = kumulierte Einzelkosten ÷ Einzelkosten der neuen Prognose" },
    { id: "ek", label: "Einzelkosten der Periode", ohne: "C" },
    { id: "fg", label: "Fertigstellungsgrad in %", nur: FGP, pz: true },
    { id: "gl", label: "Gesamtleistung der Periode", ohne: "C", ein: "I" },
    { id: "um", label: "Umsatz der Periode", nur: "E J K L M N O P Q S", ein: "K M" },
    { id: "bv", label: "Bestandsveränderung", nur: FGP },
    { id: "be", label: "Bestand am Periodenende", nur: FGP },
    { band: "MOR-Schema" },
    { id: "mgl", label: "= Gesamtleistung", nur: MOR, summe: true },
    { id: "mfr", label: MINUS + " Fremdbezogene Leistungen", nur: MOR },
    { id: "mel", label: "= Eigenleistung", nur: MOR, summe: true },
    { id: "mpk", label: MINUS + " Personalkosten", nur: MOR },
    { id: "mdb", label: "= DB Projektergebnis", nur: MOR, summe: true },
    { id: "mde", label: MINUS + " Deckungsbedarf", nur: MOR },
    { id: "mpvk", label: "= Projektvollkostenergebnis", nur: MOR, summe: true },
    { id: "av", label: "Arbeitsvorrat am Ende", nur: "E K M N O P Q", abstand: true },
  ];
  const spalten = z => (z.nur ? z.nur.split(" ") : COLS.filter(c => !(z.ohne || "").split(" ").includes(c)));
  const NAME = { C: "Chancen", I: "neue Prognose", K: "davon bis 30.06.", M: "davon GJ 2027/28", N: "Q1", O: "Q2", P: "Q3", Q: "Q4" };

  /* ---------- Eingabewerte lesen und schreiben ---------- */
  function wert(z, c) {
    if (c === "C") return P.chance[z];
    if (c === "I" || c === "K" || c === "M") return P[c][z];
    return P.Q[z][QS.indexOf(c)];
  }
  function setzen(z, c, v) {
    if (c === "C") P.chance[z] = v;
    else if (c === "I" || c === "K" || c === "M") P[c][z] = v;
    else P.Q[z][QS.indexOf(c)] = v;
  }

  /* ---------- Raster aufbauen ---------- */
  const raster = $("raster");
  const kk = el("div", { class: "mx-k links", id: "kopf-zeile" }, raster);
  ["", "", "Tsd. €"].forEach(t => el("span", {}, kk, t));
  COLS.forEach(c => {
    const k = el("div", { class: "mx-k" + (c === "C" || c === "G" ? " eng" : "") + (TRENN.has(c) ? " trenn" : ""), id: "kopf-" + c }, raster);
    KOPF[c].forEach(t => el("span", {}, k, t));
  });
  const zellen = {};                                  // "zeile-spalte" → Element
  ZEILEN.forEach(z => {
    if (z.band) {
      const b = el("div", { class: "mk-band pp-band", id: "band-" + z.band.split(" ")[0].toLowerCase() }, raster, z.band);
      if (z.link) el("a", { class: "mk-link", id: z.link[0], tabindex: "0", role: "button", style: "left:448px" }, b, z.link[1]);
      if (z.notiz) el("span", { class: "band-notiz", id: "notiz-fg" }, b, z.notiz);
      return;
    }
    const sp = spalten(z), ein = (z.ein || "").split(" ");
    const zus = (z.summe ? " summe" : "") + (z.abstand ? " abstand" : "");
    el("div", { class: "mx-l" + (z.neben ? " neben" : "") + zus, id: "l-" + z.id }, raster, z.label);
    COLS.forEach(c => {
      const tr = TRENN.has(c) ? " trenn" : "";
      let e;
      if (!sp.includes(c)) e = el("div", { class: "leer" + tr + zus, id: `x-${z.id}-${c}` }, raster);
      else if (ein.includes(c)) e = el("input", { class: "mk-feld mk-zahl" + tr + zus, id: `i-${z.id}-${c}`, inputmode: "decimal",
        "aria-label": `${z.label}, ${NAME[c]}`, "data-hilfe": "Betrag in Tsd. € mit Dezimalkomma, z. B. 10,0" }, raster);
      else e = el("div", { class: "mk-feld mk-anzeige mk-zahl" + tr + zus, id: `c-${z.id}-${c}` }, raster);
      zellen[`${z.id}-${c}`] = e;
    });
  });
  // Quartalsverteilung im Kopfblock unter den Quartalsspalten
  [["vu", 2, "vertU", "Umsatz"], ["vk", 3, "vertK", "Kosten"]].forEach(([k, zeile, key, was]) => {
    let vor = $(`f-${k}-sum`).nextSibling;
    QS.forEach((q, i) => {
      const f = el("input", { class: "mk-feld mk-zahl", id: `f-${k}-${q}`, inputmode: "decimal", style: `grid-column:${11 + i};grid-row:${zeile}`,
        "aria-label": `Quartalsverteilung ${was}, Q${i + 1}`, "data-hilfe": "Anteil des Quartals in %, Summe 100,00" });
      $("kopfblock").insertBefore(f, vor);
      f.value = zahl(P[key][i], 2);
    });
  });
  $("f-deck").value = zahl(P.deck, 2);
  $("f-soz").value = zahl(P.soz, 2);

  /* ---------- Rechnen ---------- */
  function rechnen() {
    const R = {}, r = (z, c, v) => { (R[z] = R[z] || {})[c] = v; };
    const soz = P.soz / 100;
    const FREMD = ["mat", "son", "sub"], KOST = ["mat", "son", "sub", "lea", "loh", "soz", "mon"];
    KOST.forEach(z => { r(z, "E", IST[z]); r(z, "F", LISTE[z]); if (z !== "soz") r(z, "C", P.chance[z]); });
    ["mat", "son", "sub", "lea", "loh", "mon"].forEach(z => { r(z, "G", LISTE[z] - P.chance[z]); r(z, "I", P.I[z]); });
    r("soz", "G", IST.soz + soz * (R.loh.G - IST.loh));
    r("soz", "I", IST.soz + soz * (P.I.loh - IST.loh));
    KOST.forEach(z => r(z, "J", R[z].I - IST[z]));
    const satzM = R.loh.J ? R.mon.J / R.loh.J : 0;
    r("msatz", "J", satzM * 100);
    FREMD.forEach(z => { r(z, "K", P.K[z]); r(z, "M", P.M[z]); });
    ["lea", "loh"].forEach(z => { r(z, "K", P.K[z]); r(z, "M", P.Q[z].reduce((a, b) => a + b, 0)); });
    r("soz", "K", soz * R.loh.K); r("mon", "K", satzM * R.loh.K);
    r("soz", "M", soz * R.loh.M); r("mon", "M", satzM * R.loh.M);
    QS.forEach((q, i) => {
      FREMD.forEach(z => r(z, q, P.M[z] * P.vertK[i] / 100));
      ["lea", "loh"].forEach(z => r(z, q, P.Q[z][i]));
      r("soz", q, soz * R.loh[q]); r("mon", q, satzM * R.loh[q]);
    });
    KOST.forEach(z => { r(z, "L", R[z].J - R[z].K); r(z, "S", R[z].L - R[z].M); });
    // Summen und Einzelkosten
    const ALLE = ["E", "F", "G", "I", "J", "K", "L", "M", ...QS, "S"];
    ALLE.forEach(c => {
      r("sumF", c, FREMD.reduce((s, z) => s + R[z][c], 0));
      r("sumP", c, ["lea", "loh", "soz", "mon"].reduce((s, z) => s + R[z][c], 0));
      r("ek", c, R.sumF[c] + R.sumP[c]);
    });
    r("sumF", "C", FREMD.reduce((s, z) => s + P.chance[z], 0));
    r("sumP", "C", ["lea", "loh", "mon"].reduce((s, z) => s + P.chance[z], 0));
    // Fertigstellungsgrad, Gesamtleistung, Umsatz, Bestand
    const EKG = R.ek.I, GLG = P.I.gl, anteil = c => (EKG ? R.ek[c] / EKG : 0);
    let kum = R.ek.E + R.ek.K;
    r("fg", "E", anteil("E") * 100); r("fg", "K", kum / EKG * 100);
    QS.forEach(q => { kum += R.ek[q]; r("fg", q, kum / EKG * 100); });
    r("fg", "M", R.fg.Q); r("fg", "S", (kum + R.ek.S) / EKG * 100);
    PER.forEach(c => r("gl", c, anteil(c) * GLG));
    r("gl", "F", LISTE.gl); r("gl", "G", LISTE.gl); r("gl", "I", GLG);
    r("gl", "J", GLG - R.gl.E); r("gl", "L", R.gl.J - R.gl.K);
    r("um", "E", IST.um); r("um", "J", GLG - IST.um); r("um", "K", P.K.um); r("um", "L", R.um.J - P.K.um);
    r("um", "M", P.M.um); QS.forEach((q, i) => r("um", q, P.M.um * P.vertU[i] / 100)); r("um", "S", R.um.L - P.M.um);
    PER.forEach(c => r("bv", c, R.gl[c] - R.um[c]));
    let best = R.bv.E; r("be", "E", best); best += R.bv.K; r("be", "K", best);
    QS.forEach(q => { best += R.bv[q]; r("be", q, best); });
    r("be", "M", R.be.Q); r("be", "S", best + R.bv.S);
    // MOR-Schema
    MOR.split(" ").forEach(c => {
      r("mgl", c, R.gl[c]); r("mfr", c, R.sumF[c]); r("mel", c, R.gl[c] - R.sumF[c]); r("mpk", c, R.sumP[c]);
      r("mdb", c, R.mel[c] - R.sumP[c]); r("mde", c, P.deck / 100 * R.mel[c]); r("mpvk", c, R.mdb[c] - R.mde[c]);
    });
    // Arbeitsvorrat
    let av = GLG - R.gl.E; r("av", "E", av); av -= R.gl.K; r("av", "K", av);
    QS.forEach(q => { av -= R.gl[q]; r("av", q, av); });
    r("av", "M", R.av.Q);
    return R;
  }
  const fmt = (z, v) => (z.pz ? zahl(v, 2) : zahl(Math.abs(v) < 50 ? 0 : v / 1000, 1));
  function anzeigen() {
    const R = rechnen();
    ZEILEN.forEach(z => {
      if (z.band) return;
      spalten(z).forEach(c => {
        const e = zellen[`${z.id}-${c}`];
        if (e.tagName === "INPUT") { if (!e.classList.contains("mk-fehler") && document.activeElement !== e) e.value = fmt(z, wert(z.id, c)); }
        else e.textContent = R[z.id] && R[z.id][c] != null && isFinite(R[z.id][c]) ? fmt(z, R[z.id][c]) : "–";
      });
    });
    [["vu", "vertU"], ["vk", "vertK"]].forEach(([k, key]) => {
      const s = P[key].reduce((a, b) => a + b, 0), ok = Math.abs(s - 100) < 0.005;
      $(`f-${k}-sum`).textContent = zahl(s, 2);
      $(`f-${k}-sum`).classList.toggle("mk-fehler", !ok);
      $(`f-${k}-sum`).title = ok ? "" : "Die Quartalsanteile müssen zusammen 100,00 % ergeben";
    });
  }

  /* ---------- Eingaben ---------- */
  ZEILEN.forEach(z => (z.ein || "").split(" ").filter(Boolean).forEach(c => {
    const f = zellen[`${z.id}-${c}`];
    f.addEventListener("input", () => {
      const v = pruefeFeld(f, "zahl", { pflicht: true, min: c === "C" ? 0 : -100000, max: 100000,
        meldung: "Betrag in Tsd. € mit Dezimalkomma" + (c === "C" ? ", Chancen ab 0" : "") });
      // Steht wieder die Anzeige vom Betreten des Felds da (Tsd. €, eine Nachkommastelle), gilt der genaue Wert
      if (v !== null) { setzen(z.id, c, f.value.trim() === f._anzeige ? f._exakt : Math.round(v * 1000)); anzeigen(); }
    });
    f.addEventListener("focus", () => { f._exakt = wert(z.id, c); f._anzeige = fmt(z, f._exakt); });
    f.addEventListener("blur", () => { if (!f.classList.contains("mk-fehler")) f.value = fmt(z, wert(z.id, c)); });
  }));
  const prozent = (id, lesen, schreiben, opt) => {
    const f = $(id);
    f.addEventListener("input", () => { const v = pruefeFeld(f, "zahl", opt); if (v !== null) { schreiben(v); anzeigen(); } });
    f.addEventListener("blur", () => { if (!f.classList.contains("mk-fehler")) f.value = zahl(lesen(), 2); });
  };
  prozent("f-deck", () => P.deck, v => { P.deck = v; }, { pflicht: true, min: 0, max: 100, meldung: "Prozentwert zwischen 0 und 100" });
  prozent("f-soz", () => P.soz, v => { P.soz = v; }, { pflicht: true, min: 0, max: 200, meldung: "Prozentwert zwischen 0 und 200" });
  [["vu", "vertU"], ["vk", "vertK"]].forEach(([k, key]) => QS.forEach((q, i) =>
    prozent(`f-${k}-${q}`, () => P[key][i], v => { P[key][i] = v; }, { pflicht: true, min: 0, max: 100, meldung: "Anteil in % zwischen 0 und 100" })));
  // Projektmonate MM/JJJJ, Fertigstellung nicht vor Beginn
  const monat = t => { const m = /^(0[1-9]|1[0-2])\/(\d{4})$/.exec(t.trim()); return m ? +m[2] * 12 + +m[1] : null; };
  function termine() {
    const ids = ["f-beg-plan", "f-beg-prog", "f-fer-plan", "f-fer-prog"], w = ids.map(id => monat($(id).value));
    ids.forEach((id, i) => { const ok = w[i] !== null; $(id).classList.toggle("mk-fehler", !ok); $(id).title = ok ? $(id).dataset.hilfe : "Monat im Format MM/JJJJ"; });
    [[0, 2], [1, 3]].forEach(([b, e]) => {
      if (w[b] !== null && w[e] !== null && w[e] < w[b]) { $(ids[e]).classList.add("mk-fehler"); $(ids[e]).title = "Fertigstellung liegt vor dem Projektbeginn"; }
    });
  }
  ["f-beg-plan", "f-beg-prog", "f-fer-plan", "f-fer-prog"].forEach(id => $(id).addEventListener("input", termine));
  ["f-nr", "f-name"].forEach(id => $(id).addEventListener("input", () => {
    const ok = $(id).value.trim() !== ""; $(id).classList.toggle("mk-fehler", !ok); $(id).title = ok ? $(id).dataset.hilfe : "Pflichtfeld";
  }));
  // Übernahme der Prognose nach Chancen in die neue Prognose (im Original Schaltflächen und Pfeile je Zeile)
  function uebernehmen(zeilen, text) {
    zeilen.forEach(z => { P.I[z] = LISTE[z] - P.chance[z]; const f = zellen[`${z}-I`]; f.classList.remove("mk-fehler"); f.value = fmt({}, P.I[z]); });
    anzeigen(); MK.meldung(text);
  }
  const klick = (id, fn) => { $(id).addEventListener("click", fn); $(id).addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fn(); } }); };
  klick("l-fremd", () => uebernehmen(["mat", "son", "sub"], "Prognose nach Chancen für Material, sonstige direkte Kosten und Subunternehmer übernommen."));
  klick("l-pers", () => uebernehmen(["lea", "loh"], "Prognose nach Chancen für Leasing und produktiven Lohn übernommen."));
  anzeigen();

  /* ---------- Lernplattform: Erläuterungen und Gestaltung ---------- */
  MK.ebenen({
    erlaeuterungen: {
      titel: "Erläuterungen",
      intro: "Wie ein Projektfertiger ein einzelnes Projekt über seine Laufzeit plant. Weiße Felder lassen sich ändern; das Blatt rechnet bis zum Projektergebnis durch.",
      eintraege: [
        { nr: 1, ziel: "kopf-zeile", anker: "links", versatz: [60, 4], titel: "Planung je Projekt",
          text: "Ein Projektfertiger (z. B. Anlagen- oder Klinikbau) plant nicht nach Kalenderjahren allein, sondern je Projekt über die gesamte Laufzeit – hier von März 2027 bis September 2028. Die Spalten führen vom Ist über die Prognose des Gesamtprojekts bis zu den Quartalen des Geschäftsjahrs." },
        { nr: 2, ziel: "x-soz-C", versatz: [-36, 2], titel: "Chancen",
          text: "Chancen sind erwartete Einsparungen bei den Einzelkosten, etwa durch Nachverhandlung mit Lieferanten. Prognose lt. Projektliste − Chancen = Prognose nach Chancen: beim Material 2.321,2 − 150,0 = 2.171,2 Tsd. €." },
        { nr: 3, ziel: "l-fremd", versatz: [32, 3], titel: "Neue Prognose",
          text: "Die Projektleitung legt die neue Prognose für das Gesamtprojekt fest. „alle übernehmen“ setzt die Prognose nach Chancen ein; bei den sonstigen direkten Kosten wurde die Chance hier bewusst nicht übernommen (291,3 statt 276,3)." },
        { nr: 4, ziel: "x-be-J", versatz: [-16, 2], titel: "Restbeträge und Quartale",
          text: "Vom Rest der neuen Prognose wird zuerst das laufende Geschäftsjahr bis 30.06. abgezogen, dann das Geschäftsjahr 2027/28; was bleibt, fällt ins Folgejahr. Fremdbezogene Leistungen verteilt die Kostenverteilung oben auf die Quartale, Lohn und Leasing kommen je Quartal aus der Personaleinsatzplanung." },
        { nr: 5, ziel: "band-personalkostenplanung", anker: "links", versatz: [718, 2], titel: "Personalkosten",
          text: "Sozial- und Personalnebenkosten werden mit 80 % auf den produktiven Lohn geschlagen; Montagenebenkosten folgen dem Lohn im Verhältnis der neuen Prognose (21,55 %). Ändern Sie den Lohn eines Quartals: Zuschläge und Summen folgen." },
        { nr: 6, ziel: "x-bv-I", versatz: [-16, -2], titel: "Fertigstellungsgrad",
          text: "Der Fertigstellungsgrad misst den Fortschritt über die Kosten (Cost-to-Cost): kumulierte Einzelkosten ÷ Einzelkosten gesamt. Die Gesamtleistung einer Periode ist der entsprechende Anteil am Auftragswert; was noch nicht abgerechnet ist, erhöht als Bestandsveränderung den Bestand an unfertigen Leistungen." },
        { nr: 7, ziel: "x-mdb-J", versatz: [-16, -2], titel: "MOR-Schema",
          text: "Die Ergebnisrechnung des Projekts ist stufig: Gesamtleistung − fremdbezogene Leistungen = Eigenleistung − Personalkosten = DB Projektergebnis − Deckungsbedarf (40 % der Eigenleistung für Gemeinkosten) = Projektvollkostenergebnis. Mit der neuen Prognose bringt das Projekt −206,9 Tsd. €." },
        { nr: 8, ziel: "x-av-L", versatz: [-16, -2], titel: "Arbeitsvorrat",
          text: "Der Arbeitsvorrat ist die noch zu erbringende Gesamtleistung am Ende jeder Periode. Nach dem Geschäftsjahr 2027/28 bleiben 534,3 Tsd. € für das Folgejahr." },
      ],
    },
    gestaltung: {
      titel: "Gestaltung",
      intro: "Was gegenüber dem Original geändert wurde – softwareneutral im Buchstil und nach den Interaktionsprinzipien der DIN EN ISO 9241-110.",
      eintraege: [
        { nr: "A", ziel: "kopf", versatz: [-6, 6], regel: "BUCHSTIL – SOFTWARENEUTRAL", titel: "Kein Tabellenblatt-Fenster",
          text: "Fensterrahmen, Menü-, Symbol- und Bearbeitungsleiste, Zeilen- und Spaltenköpfe, Statusleiste und Taskleiste entfallen. „NL Erfurt“ und die Projektbezeichnung (eine reale Klinik) sind durch neutrale Angaben ersetzt, die Jahre auf 2027/28 gesetzt." },
        { nr: "B", ziel: "kopf-zeile", anker: "links", versatz: [92, 4], regel: "SELBSTBESCHREIBUNGSFÄHIGKEIT", titel: "Einheit Tsd. €",
          text: "Die Werte stehen in Tsd. € mit einer Nachkommastelle; die Einheit steht im Untertitel und über der Zeilenspalte. Das Original zeigte volle Euro ohne Einheit – 14 Wertspalten passen so nicht lesbar auf eine Buchseite." },
        { nr: "C", ziel: "x-mel-J", versatz: [-16, -2], regel: "SELBSTBESCHREIBUNGSFÄHIGKEIT", titel: "Eingabe und Anzeige unterscheidbar",
          text: "Eingabefelder sind weiß, berechnete Werte grau. Im Original bedeuteten Gelb (berechnet), Weiß mit fetter Kursivschrift (Eingabe), Grün (Projektdaten) und Türkis (Summen) etwas, ohne dass es erklärt war." },
        { nr: "D", ziel: "x-fg-C", versatz: [-36, 2], regel: "AUFGABENANGEMESSENHEIT", titel: "Chancen als Spalte",
          text: "Die Chancen standen im Original in einem Block über der Tabelle, die Materialchance sogar in einer ausgeblendeten Zeile. Als Spalte zwischen Projektliste und Prognose nach Chancen wird die Rechnung Liste − Chancen sichtbar." },
        { nr: "E", ziel: "l-pers", versatz: [32, 3], regel: "STEUERBARKEIT", titel: "Übernahme per Link",
          text: "Die Schaltflächen „alle übernehmen“ und „Übernahme Leasing, Lohn/Gehalt“ sowie die Pfeile je Zeile sind zu zwei Links in den Bändern zusammengefasst; die Pfeilspalte entfällt." },
        { nr: "F", ziel: "band-mor-schema", anker: "links", versatz: [718, 2], regel: "AUFGABENANGEMESSENHEIT", titel: "MOR-Schema verdichtet",
          text: "Das Original wiederholte im MOR-Schema Umsatz, Bestandsveränderung und alle sieben Kostenzeilen. Jetzt stehen dort die Stufen mit den Summen der Abschnitte darüber – dieselben Ergebnisse auf halber Höhe." },
        { nr: "G", ziel: "x-mpvk-J", versatz: [-16, -2], regel: "ERWARTUNGSKONFORMITÄT", titel: "Minus statt Rot",
          text: "Negative Werte tragen ein Minuszeichen statt roter Schrift; Spaltenköpfe sind kurz und nennen die Stichtage, Trennlinien gliedern Rest und Davon-Spalten. Der versteckte Sozialzuschlag von 80 % steht jetzt sichtbar oben rechts." },
        { nr: "H", ziel: "f-vk-Q", versatz: [30, -8], regel: "ROBUSTHEIT GEGEN BENUTZUNGSFEHLER", titel: "Eingaben werden geprüft",
          text: "Die Quartalsanteile müssen 100,00 % ergeben, sonst wird die Summe markiert; Beträge, Prozentwerte und Monate (MM/JJJJ) werden geprüft. Die Fertigstellung „Sep 2000“ lag im Original vor dem Ist-Stichtag und ist auf September 2028 korrigiert." },
      ],
    },
  });
  MK.fertig();
})();
