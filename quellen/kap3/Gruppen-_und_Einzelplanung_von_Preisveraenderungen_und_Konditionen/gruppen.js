/* Abb. 3.184 (zusammengeführt mit Abb. 3.185) „Selektive Gruppenplanung von Preisveränderungen und Konditionen“ –
   Logik der Maske „Absatz-/Umsatzplanung“ mit Gruppen- und Einzelplanung in einem Formular.
   Gruppenplanung: Savings (beeinflussbar, nicht beeinflussbar) je Materialgruppe 2/3, Rabatt und Skonto je Kundengruppe 3.
   Einzelplanung: Jede Position Kunde/Artikel übernimmt Savings und Rabatt ihrer Gruppe, solange sie nicht einzeln
   überschrieben ist (überschriebene Werte fett; Feld leeren übernimmt wieder den Gruppenwert).
   Nettopreis nach Saving = Vk-Preis × (1 − Savings);  Planumsatz = Planabsatz × Nettopreis × (1 − Rabatt).
   Erlöswirkung Savings    = −Σ Planabsatz × Vk-Preis × Savings über alle Positionen der Materialgruppe (alle Kunden).
   Erlöswirkung Konditionen = −Σ Planabsatz × Nettopreis × (Rabatt + Skonto) über alle Positionen der Kunden der Gruppe.
   Artikel, Planabsatz und Vk-Preise des Kunden 11002 wie im Original von Abb. 3.185, Kunde 11017 ergänzt (fiktiv).
   Gruppenwerte im Original 0,000; Beispielwerte S01/L22 2,0 + 1,0 %, Kundengruppe 008 Rabatt 2,0 %, Skonto 2,0 %.
   Zwei Beispiele für Einzelplanung: 1127457 Saving beeinflussbar 3,0 %, 142834 Rabatt 3,0 %. */
(() => {
  "use strict";
  const { el, zahl, leseZahl, pruefeFeld } = MK;
  MK.init({ titel: "Selektive Gruppenplanung von Preisveränderungen und Konditionen" });
  const $ = id => document.getElementById(id);
  const NDASH = String.fromCharCode(0x2013);

  /* ---------- Stammdaten ---------- */
  const KG = [["008", "Landtechnik"], ["034", "Schienenfahrzeuge"]];
  const KUNDEN = { "008": [["11002", "Agrarwerk", "Mitte"]], "034": [["11017", "Waggonbau", "Ost"]] };
  const MG2 = [["S01", "Fahrersitze"], ["S02", "Sitzteile"]];
  const MG3 = { S01: [["L22", "Baureihe 44"], ["L23", "Baureihe 83/85"]], S02: [["L31", "Mechanik"], ["L32", "Polster"]] };
  // Artikel je Kunde: Material, Bezeichnung, MG2, MG3, Planabsatz in Stück, Vk-Preis in €
  const ARTIKEL = {
    "11002": [["137583", "Mitnehmer kpl.", "S02", "L31", 6, 40.57], ["143767", "Mustersitz", "S01", "L22", 4, 0],
      ["142518", "Fahrersitz FS44/2H-4", "S01", "L22", 138, 181.65], ["142520", "Fahrersitz FS44/2H-4", "S01", "L22", 158, 187.80],
      ["1044231", "Fahrersitz FS44/8", "S01", "L22", 100, 99.13], ["1127457", "Fahrersitz FS44/1HBA", "S01", "L22", 17, 215.09],
      ["1059017", "Fahrersitz FS83/20", "S01", "L23", 89, 152.16], ["1163872", "Fahrersitz FS83/731", "S01", "L23", 40, 150.64],
      ["142834", "Fahrersitz FS85/731", "S01", "L23", 7, 260.76], ["106161", "Sitzschale S44 kpl.", "S02", "L31", 72, 57.42],
      ["130649", "Konsolen kpl.", "S02", "L31", 15, 9.64], ["138787", "Rückenpolster Stoff", "S02", "L32", 16, 29.90],
      ["138788", "Sitzpolster Stoff", "S02", "L32", 142, 33.14], ["138968", "Rückenpolster Kunstleder", "S02", "L32", 446, 24.50]],
    "11017": [["151230", "Fahrersitz FS44/6", "S01", "L22", 36, 204.80], ["151204", "Fahrersitz FS85/420", "S01", "L23", 24, 312.40],
      ["138788", "Sitzpolster Stoff", "S02", "L32", 60, 34.20]],
  };
  const kgVon = kd => Object.keys(KUNDEN).find(k => KUNDEN[k].some(x => x[0] === kd));
  // Gruppenwerte in %: Savings [beeinflussbar, nicht beeinflussbar] je MG2|MG3, Konditionen [Rabatt, Skonto] je KG3
  const START_SAV = { "S01|L22": [2.0, 1.0], "S01|L23": [0, 0], "S02|L31": [0, 0], "S02|L32": [0, 0] };
  const START_KOND = { "008": [2.0, 2.0], "034": [1.5, 2.0] };
  // Einzelplanung: je Position Vk-Preis und Überschreibungen (null = Gruppenwert)
  const START_UEBER = { "11002|1127457": { s1: 3.0 }, "11002|142834": { rab: 3.0 } };
  const kopie = x => JSON.parse(JSON.stringify(x));
  let SAV, KOND, POS;
  function laden() {
    SAV = kopie(START_SAV); KOND = kopie(START_KOND); POS = {};
    Object.entries(ARTIKEL).forEach(([kd, liste]) => {
      POS[kd] = liste.map(a => Object.assign({ vk: a[5], s1: null, s2: null, rab: null }, START_UEBER[kd + "|" + a[0]] || {}));
    });
  }
  laden();
  const gruppenwert = (kd, a, k) => k === "rab" ? KOND[kgVon(kd)][0] : SAV[a[2] + "|" + a[3]][k === "s1" ? 0 : 1];
  const wert = (kd, i, k) => { const p = POS[kd][i]; return p[k] == null ? gruppenwert(kd, ARTIKEL[kd][i], k) : p[k]; };
  const netto = (kd, i) => POS[kd][i].vk * (1 - (wert(kd, i, "s1") + wert(kd, i, "s2")) / 100);
  const umsatz = (kd, i) => ARTIKEL[kd][i][4] * netto(kd, i) * (1 - wert(kd, i, "rab") / 100);
  const euro = v => (Math.abs(v) < 0.5 ? zahl(0, 0) : zahl(v, 0));

  /* ---------- Auswahl ---------- */
  const optionen = (sel, liste, w) => { sel.textContent = ""; liste.forEach(([v, t]) => el("option", v === w ? { value: v, selected: "" } : { value: v }, sel, t)); };
  optionen($("f-kg"), KG.map(([c, t]) => [c, c + " " + t]), "008");
  optionen($("f-mg2"), [["*", "Alle"], ...MG2.map(([c, t]) => [c, c + " " + t])], "S01");
  function mg3Fuellen() {
    const m2 = $("f-mg2").value;
    optionen($("f-mg3"), [["*", "Alle"], ...(m2 === "*" ? [] : MG3[m2].map(([c, t]) => [c, c + " " + t]))], "*");
  }
  mg3Fuellen();
  const passt = (m2, m3) => ($("f-mg2").value === "*" || $("f-mg2").value === m2) && ($("f-mg3").value === "*" || $("f-mg3").value === m3);

  /* ---------- Raster ---------- */
  const pos = (z, s, n = 1) => `grid-row:${z};grid-column:${s}${n > 1 ? " / span " + n : ""}`;
  const PR = { min: 0, max: 50, meldung: "Prozentwert von 0 bis 50 mit Dezimalkomma, z. B. 1,5" };
  function gruppenFeld(raster, z, s, id, w, label, setzen) {
    const f = el("input", { class: "mk-feld mk-zahl zeile", id, style: pos(z, s), value: zahl(w, 1), inputmode: "decimal",
      "aria-label": label, "data-hilfe": "Gruppenwert in % – gilt für alle nicht überschriebenen Positionen der Gruppe" }, raster);
    f.addEventListener("input", () => { const v = pruefeFeld(f, "zahl", PR); if (!f.classList.contains("mk-fehler")) setzen(v || 0); rechnen(); });
    f.addEventListener("blur", () => { const v = leseZahl(f.value); if (!f.classList.contains("mk-fehler")) f.value = zahl(v || 0, 1); });
    return f;
  }
  function zeilenSav() {
    const r = $("raster-sav");
    r.querySelectorAll(".zeile").forEach(e => e.remove());
    const liste = MG2.flatMap(([m2, t2]) => MG3[m2].map(([m3, t3]) => [m2, t2, m3, t3])).filter(([m2, , m3]) => passt(m2, m3));
    liste.forEach(([m2, t2, m3, t3], i) => {
      const z = 3 + i, schl = m2 + "|" + m3;
      [[1, m2], [2, t2], [3, m3], [4, t3]].forEach(([s, t]) => el("span", { class: "mk-label mx-l zeile", style: pos(z, s), id: `l-sav-${i}-${s}` }, r, t));
      gruppenFeld(r, z, 5, `s-b-${i}`, SAV[schl][0], `Saving beeinflussbar, ${m2}/${m3}`, v => { SAV[schl][0] = v; });
      gruppenFeld(r, z, 6, `s-n-${i}`, SAV[schl][1], `Saving nicht beeinflussbar, ${m2}/${m3}`, v => { SAV[schl][1] = v; });
      el("div", { class: "mk-feld mk-anzeige mk-zahl zeile", style: pos(z, 7), id: `w-sav-${i}`, "data-schl": schl }, r);
    });
  }
  function zeilenKond() {
    const r = $("raster-kond");
    r.querySelectorAll(".zeile").forEach(e => e.remove());
    KG.forEach(([c, t], i) => {
      const z = 3 + i;
      [[1, c], [2, t]].forEach(([s, x]) => el("span", { class: "mk-label mx-l zeile", style: pos(z, s), id: `l-kond-${i}-${s}` }, r, x));
      gruppenFeld(r, z, 3, `k-r-${i}`, KOND[c][0], `Rabatt, Kundengruppe ${c}`, v => { KOND[c][0] = v; });
      gruppenFeld(r, z, 4, `k-s-${i}`, KOND[c][1], `Skonto, Kundengruppe ${c}`, v => { KOND[c][1] = v; });
      el("div", { class: "mk-feld mk-anzeige mk-zahl zeile", style: pos(z, 5), id: `w-kond-${i}`, "data-kg": c }, r);
    });
  }

  // Einzelplanung: Felder der Positionen (Schlüssel, Spalte, Nachkommastellen, Prüfung, Beschriftung)
  const FELDER = [
    ["vk", 6, 2, { min: 0, max: 99999, meldung: "Preis in € mit Dezimalkomma, z. B. 181,65" }, "Vk-Preis in €"],
    ["s1", 7, 1, PR, "Saving beeinflussbar in %"],
    ["s2", 8, 1, PR, "Saving nicht beeinflussbar in %"],
    ["rab", 10, 1, PR, "Rabatt in %"],
  ];
  let ZEILEN = [], KD = null;
  function zeilenPos() {
    const r = $("raster-pos");
    r.querySelectorAll(".zeile").forEach(e => e.remove());
    const kunde = KUNDEN[$("f-kg").value][0];
    KD = kunde[0];
    ZEILEN = ARTIKEL[KD].map((a, i) => [a, i]).filter(([a]) => passt(a[2], a[3]));
    const n = ZEILEN.length;
    const kb = el("div", { class: "mx-b zeile", id: "b-kunde", style: `grid-row:3 / span ${Math.max(n, 1)};grid-column:1` }, r);
    kunde.forEach(t => el("span", { class: "mk-label" }, kb, t));
    ZEILEN.forEach(([a, i], j) => {
      const z = 3 + j, p = POS[KD][i];
      el("span", { class: "mk-label mx-l zeile", id: `m-${j}`, style: pos(z, 2) }, r, a[0]);
      el("span", { class: "mk-label mx-l zeile", id: `t-${j}`, style: pos(z, 3) }, r, a[1]);
      const rz = el("div", { class: "mx-r zeile", id: `r-${j}`, style: pos(z, 4) }, r);
      const lab = el("label", { class: "mk-option" }, rz);
      el("input", { type: "radio", class: "mk-check", name: "auswahl", value: String(j), "aria-label": `Material ${a[0]} auswählen` }, lab);
      el("div", { class: "mk-feld mk-anzeige mk-zahl zeile", id: `pa-${j}`, style: pos(z, 5) }, r, zahl(a[4], 0));
      FELDER.forEach(([k, s, nk, pr, lbl]) => {
        const f = el("input", { class: "mk-feld mk-zahl zeile", id: `${k}-${j}`, style: pos(z, s), inputmode: "decimal",
          "aria-label": `${lbl}, Material ${a[0]}`, "data-k": k, "data-i": String(i), "data-nk": String(nk) }, r);
        f.addEventListener("input", () => {
          if (k !== "vk" && f.value.trim() === "") { p[k] = null; f.classList.remove("mk-fehler", "ueber"); rechnen(); return; }
          const v = pruefeFeld(f, "zahl", Object.assign({}, pr, { pflicht: k === "vk" }));
          if (!f.classList.contains("mk-fehler")) { p[k] = v; if (k !== "vk") f.classList.add("ueber"); }
          rechnen();
        });
        f.addEventListener("blur", () => { if (!f.classList.contains("mk-fehler")) feldZeigen(f); });
      });
      el("div", { class: "mk-feld mk-anzeige mk-zahl zeile", id: `net-${j}`, style: pos(z, 9) }, r);
      el("div", { class: "mk-feld mk-anzeige mk-zahl zeile", id: `um-${j}`, style: pos(z, 11) }, r);
    });
    const zs = 3 + Math.max(n, 1);
    el("div", { class: "leer zeile", style: pos(zs, 1) }, r);
    el("span", { class: "mk-label mx-l summe zeile", id: "l-summe", style: pos(zs, 2, 2) }, r, n ? "Summe" : "Keine Artikel in dieser Auswahl");
    el("div", { class: "leer zeile", style: pos(zs, 4) }, r);
    el("div", { class: "mk-feld mk-anzeige mk-zahl summe zeile", id: "sum-menge", style: pos(zs, 5) }, r);
    el("div", { class: "leer zeile", style: pos(zs, 6, 5) }, r);
    el("div", { class: "mk-feld mk-anzeige mk-zahl summe zeile", id: "sum-umsatz", style: pos(zs, 11) }, r);
  }
  // Positionsfeld mit dem gültigen Wert füllen: eigener Wert (fett) oder Gruppenwert
  function feldZeigen(f) {
    const k = f.dataset.k, i = +f.dataset.i, p = POS[KD][i];
    f.value = zahl(k === "vk" ? p.vk : wert(KD, i, k), +f.dataset.nk);
    const eigen = k !== "vk" && p[k] != null;
    f.classList.toggle("ueber", eigen);
    if (k !== "vk") {
      const g = gruppenwert(KD, ARTIKEL[KD][i], k);
      f.title = eigen ? `Einzeln überschrieben (Gruppenwert ${zahl(g, 1)} %) – Feld leeren übernimmt den Gruppenwert`
        : "Wert aus der Gruppenplanung – Eingabe überschreibt ihn für diese Position";
    }
  }

  /* ---------- Rechnen: Gruppenwerte wirken sofort auf die Positionen ---------- */
  const fehlerIn = sel => !!document.querySelector(sel + " .mk-fehler");
  function rechnen() {
    // Positionen: nicht überschriebene Felder folgen dem Gruppenwert
    document.querySelectorAll("#raster-pos input.mk-zahl").forEach(f => {
      if (f !== document.activeElement && !f.classList.contains("mk-fehler")) feldZeigen(f);
    });
    let menge = 0, um = 0, ok = true;
    ZEILEN.forEach(([a, i], j) => {
      const fehler = FELDER.some(([k]) => $(`${k}-${j}`).classList.contains("mk-fehler")) || fehlerIn("#raster-sav") || fehlerIn("#raster-kond");
      $(`net-${j}`).textContent = fehler ? NDASH : zahl(netto(KD, i), 2);
      $(`um-${j}`).textContent = fehler ? NDASH : zahl(umsatz(KD, i), 0);
      menge += a[4]; if (fehler) ok = false; else um += umsatz(KD, i);
    });
    $("sum-menge").textContent = ZEILEN.length ? zahl(menge, 0) : "";
    $("sum-umsatz").textContent = ZEILEN.length ? (ok ? zahl(um, 0) : NDASH) : "";
    // Gruppen: Erlöswirkung über alle Positionen der Gruppe, mit den gültigen (auch überschriebenen) Werten
    document.querySelectorAll("#raster-sav [data-schl]").forEach(e => {
      let w = 0;
      Object.entries(ARTIKEL).forEach(([kd, liste]) => liste.forEach((a, i) => {
        if (a[2] + "|" + a[3] === e.dataset.schl) w -= a[4] * POS[kd][i].vk * (wert(kd, i, "s1") + wert(kd, i, "s2")) / 100;
      }));
      e.textContent = euro(w);
    });
    document.querySelectorAll("#raster-kond [data-kg]").forEach(e => {
      const kg = e.dataset.kg;
      let w = 0;
      KUNDEN[kg].forEach(([kd]) => ARTIKEL[kd].forEach((a, i) => { w -= a[4] * netto(kd, i) * (wert(kd, i, "rab") + KOND[kg][1]) / 100; }));
      e.textContent = euro(w);
    });
    return [menge, um];
  }
  function neu() { zeilenSav(); zeilenKond(); zeilenPos(); rechnen(); if (MK.skalieren) MK.skalieren(); if (MK._ebenenNeu) MK._ebenenNeu(); }
  $("f-kg").addEventListener("change", neu);
  $("f-mg2").addEventListener("change", () => { mg3Fuellen(); neu(); });
  $("f-mg3").addEventListener("change", neu);
  neu();

  /* ---------- Knöpfe ---------- */
  const fehler = () => !!document.querySelector("#gruppen .mk-fehler");
  $("k-sichern").addEventListener("click", () => {
    if (fehler()) { MK.meldung("Nicht gesichert: Bitte zuerst die rot markierten Eingaben korrigieren."); return; }
    const n = Object.values(POS).flat().reduce((s, p) => s + ["s1", "s2", "rab"].filter(k => p[k] != null).length, 0);
    MK.meldung(`Gesichert: Gruppenwerte und ${n} einzeln überschriebene Werte, Planumsatz Kunde ${KD} ${zahl(rechnen()[1], 0)} €.`);
  });
  $("k-aktualisieren").addEventListener("click", () => {
    laden(); neu();
    MK.meldung("Aktualisiert: gesicherte Gruppenwerte, Einzelwerte und Preise aus dem ERP-System neu geladen.");
  });
  $("k-perioden").addEventListener("click", () => {
    const r = document.querySelector("#raster-pos input[type=radio]:checked");
    if (!r) { MK.meldung("Bitte zuerst einen Artikel in der Spalte „Auswahl“ markieren."); return; }
    const [a] = ZEILEN[+r.value];
    MK.meldung(`Periodenwerte für ${a[0]} ${a[1]}: Monatsmaske in dieser Beispielmaske nicht hinterlegt.`);
  });
  $("k-verteilen").addEventListener("click", () => {
    if (fehler()) { MK.meldung("Bitte zuerst die rot markierten Eingaben korrigieren."); return; }
    const [menge, um] = rechnen();
    MK.meldung(`Gleichmäßig auf zwölf Perioden verteilt: je Monat ${zahl(menge / 12, 1)} Stück und ${zahl(um / 12, 0)} € Planumsatz.`);
  });

  /* ---------- Klappen ohne Maßstabssprung (wie Abb. 3.7) ---------- */
  if (!document.body.classList.contains("print")) {
    const maske = $("gruppen"), seite = $("seite"), rahmen = seite.parentElement;
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
      intro: "Was die Bereiche der Maske in der Absatz- und Umsatzplanung leisten. Die Nummern in der Maske zeigen, wo.",
      eintraege: [
        { nr: 1, ziel: "f-mg2", versatz: [-26, 2], titel: "Selektive Planung",
          text: "Kundengruppe und Materialgruppen grenzen den Ausschnitt ein – für die Gruppenplanung oben und die Positionen unten zugleich. Hier: die Fahrersitze (S01) des Kunden 11002 aus der Kundengruppe Landtechnik." },
        { nr: 2, ziel: "kopf-sav", versatz: [-6, 2], titel: "Savings je Materialgruppe",
          text: "Savings sind Preisnachlässe, die Kunden – in der Zulieferindustrie meist jährlich – verlangen. Der beeinflussbare Teil ist noch Verhandlungssache, der nicht beeinflussbare vertraglich festgelegt. Geplant wird einmal je Materialgruppe statt für jeden Artikel." },
        { nr: 3, ziel: "kopf-kond", versatz: [-6, 2], titel: "Konditionen je Kundengruppe",
          text: "Rabatt und Skonto sind Erlösschmälerungen. Sie gelten für alle Kunden der Gruppe und werden auf den Nettopreis nach Saving gerechnet. Der Skonto wirkt nur auf Gruppenebene; der Rabatt erscheint auch je Position." },
        { nr: 4, ziel: "band-pos", versatz: [-24, 2], titel: "Gruppenplanung wirkt auf die Positionen",
          text: "Jede Position übernimmt Savings und Rabatt ihrer Gruppe. Ändern Sie oben das Saving der Baureihe 44 oder den Rabatt der Kundengruppe 008: Alle nicht überschriebenen Positionen, ihre Nettopreise und der Planumsatz folgen sofort." },
        { nr: 5, ziel: "s1-4", anker: "links", versatz: [32, 1], titel: "Einzeln überschreiben",
          text: "Für einzelne Artikel lässt sich der Gruppenwert überschreiben – hier 3,0 % Saving für den FS44/1HBA und 3,0 % Rabatt für den FS85/731. Überschriebene Werte sind fett und bleiben stehen, wenn sich der Gruppenwert ändert; ein geleertes Feld übernimmt wieder den Gruppenwert." },
        { nr: 6, ziel: "h-wirkung-sav", versatz: [-4, 2], titel: "Erlöswirkung der Gruppe",
          text: "Die Erlöswirkung summiert über alle Positionen der Gruppe, auch die anderer Kunden, und zwar mit den tatsächlich geltenden Werten: Eine einzeln überschriebene Position zählt mit ihrem eigenen Wert." },
        { nr: 7, ziel: "sum-umsatz", anker: "links", versatz: [32, 1], titel: "Vom Preis zum Planumsatz",
          text: "Nettopreis nach Saving = Vk-Preis × (1 − Savings); Planumsatz = Planabsatz × Nettopreis × (1 − Rabatt). Planabsatz kommt aus der Absatzplanung, der Vk-Preis als Vorschlag aus dem ERP-System." },
        { nr: 8, ziel: "k-perioden", versatz: [14, -10], titel: "Periodische Bearbeitung",
          text: "Die Maske zeigt Jahreswerte. „Periodenwerte planen“ öffnet für den markierten Artikel die Monate; „Jahreswerte auf Perioden verteilen“ verteilt gleichmäßig auf zwölf Monate." },
      ],
    },
    gestaltung: {
      titel: "Gestaltung",
      intro: "Was gegenüber dem Original geändert wurde – softwareneutral im Buchstil und nach den Interaktionsprinzipien der DIN EN ISO 9241-110.",
      eintraege: [
        { nr: "A", ziel: "kopf", versatz: [-6, 8], regel: "BUCHSTIL – SOFTWARENEUTRAL", titel: "Kein Browserfenster",
          text: "Browserfenster mit Adresszeile (Servername mit Firmennamen), Menü-, Symbol- und Taskleiste, Bildlauf- und Blätterleisten sowie die Knöpfe „Beenden“ und „Zurück“ der Originale entfallen." },
        { nr: "B", ziel: "band-gruppe", versatz: [-24, 2], regel: "AUFGABENANGEMESSENHEIT", titel: "Gruppen- und Einzelplanung in einem Formular",
          text: "Die drei Bildschirme des Originals – „Savings“, „Rabatte“ und „Übersicht Absatz-/Umsatzplanung“ – sind eine Maske: oben die Gruppen, darunter die Positionen. Wer einen Gruppenwert ändert, sieht die Wirkung auf jeden Artikel, ohne die Maske zu wechseln." },
        { nr: "C", ziel: "h-saving-pos", versatz: [-4, -2], regel: "SELBSTBESCHREIBUNGSFÄHIGKEIT", titel: "Herkunft der Werte sichtbar",
          text: "Normal gesetzte Werte kommen aus der Gruppe, fett gesetzte sind einzeln überschrieben; der Hinweis im Untertitel und der Tooltip nennen den Gruppenwert. Im Original war nicht zu erkennen, woher ein Wert stammt." },
        { nr: "D", ziel: "kopf-unter", versatz: [-6, -2], regel: "SELBSTBESCHREIBUNGSFÄHIGKEIT", titel: "Einheiten einmal genannt",
          text: "Einheiten stehen im Untertitel und an den Spaltenköpfen; die Spalten „Basis-ME“ und „Währung“ und die Einheiten in jeder Zeile entfallen. Prozentwerte mit einer statt drei Nachkommastellen, Mengen ganzzahlig." },
        { nr: "E", ziel: "f-kg", versatz: [-26, 2], regel: "ERWARTUNGSKONFORMITÄT", titel: "Eine Auswahl für beide Ebenen",
          text: "Kunden- und Materialgruppen werden einmal oben aus einer Liste gewählt und gelten für Gruppen und Positionen; leere Felder heißen „Alle“. Das Original verlangte die Codes mit Suchhilfesymbol in jedem Bildschirm." },
        { nr: "F", ziel: "net-1", anker: "links", versatz: [32, 1], regel: "SELBSTBESCHREIBUNGSFÄHIGKEIT", titel: "Eingabe und Anzeige unterscheidbar",
          text: "Planabsatz, Nettopreis, Planumsatz und Erlöswirkung sind berechnet bzw. übernommen und grau; Preise, Savings, Rabatt und Skonto sind weiße Eingabefelder." },
        { nr: "G", ziel: "b-kunde", versatz: [-6, 62], regel: "BUCHSTIL – NEUTRAL UND AKTUELL", titel: "Fiktive Kunden und Artikel",
          text: "Die im Original geschwärzten Kunden und Kundengruppen tragen fiktive Namen, die Typenbezeichnungen realer Sitze sind ersetzt, Materialtexte ausgeschrieben. Die Gruppenwerte standen im Original auf 0,000 – Beispielwerte machen die Wirkung sichtbar." },
        { nr: "H", ziel: "rab-0", anker: "links", versatz: [32, 1], regel: "ROBUSTHEIT GEGEN BENUTZUNGSFEHLER", titel: "Eingaben werden geprüft",
          text: "Preise ab 0 €, Prozentwerte von 0 bis 50 mit Dezimalkomma. Ungültige Eingaben werden rot markiert, Nettopreis und Planumsatz zeigen „–“, Sichern ist erst nach der Korrektur möglich." },
      ],
    },
  });
  MK.fertig();
})();
