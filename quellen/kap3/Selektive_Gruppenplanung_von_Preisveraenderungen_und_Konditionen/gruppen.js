/* Abb. 3.184 „Selektive Gruppenplanung von Preisveränderungen und Konditionen“ – Logik der Maske.
   Savings (Preisnachlässe an Kunden) werden je Materialgruppe 2/3 geplant, Rabatt und Skonto je Kundengruppe 3.
   Erlöswirkung Savings  = −Σ Planabsatz × Vk-Preis × (Saving beeinflussbar + nicht beeinflussbar) über alle Artikel der Gruppe.
   Erlöswirkung Kondition = −Σ Planabsatz × Nettopreis nach Saving × (Rabatt + Skonto) über alle Artikel der Kunden der Gruppe.
   Stammdaten wie Abb. 3.185 (Artikel und Planabsatz des Kunden 11002 aus dem Original, Kunde 11017 ergänzt, fiktiv).
   Im Original standen alle Prozentwerte auf 0,000; Beispielwerte S01/L22 2,0 + 1,0 %, Kundengruppe 008 Rabatt 2,0 %,
   Skonto 2,0 %, damit die Rechnung sichtbar wird. */
(() => {
  "use strict";
  const { el, zahl, leseZahl, pruefeFeld } = MK;
  const MINUS = MK.MINUS;
  MK.init({ titel: "Selektive Gruppenplanung von Preisveränderungen und Konditionen" });
  const $ = id => document.getElementById(id);

  /* ---------- Stammdaten (gemeinsam mit Abb. 3.185) ---------- */
  const KG = [["008", "Landtechnik"], ["034", "Schienenfahrzeuge"]];
  const KUNDEN = { "008": [["11002", "Agrarwerk Mitte"]], "034": [["11017", "Waggonbau Ost"]] };
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
  // Gruppenwerte in %: Savings [beeinflussbar, nicht beeinflussbar] je MG2|MG3, Konditionen [Rabatt, Skonto] je KG3
  const START_SAV = { "S01|L22": [2.0, 1.0], "S01|L23": [0, 0], "S02|L31": [0, 0], "S02|L32": [0, 0] };
  const START_KOND = { "008": [2.0, 2.0], "034": [1.5, 2.0] };
  let SAV = JSON.parse(JSON.stringify(START_SAV)), KOND = JSON.parse(JSON.stringify(START_KOND));
  const kg3Name = k => KG.find(x => x[0] === k)[1];

  /* ---------- Rechnen ---------- */
  const alleArtikel = () => Object.entries(ARTIKEL).flatMap(([kd, liste]) => liste.map(a => ({ kd, a })));
  const satz = a => SAV[a[2] + "|" + a[3]].reduce((s, v) => s + v, 0);
  function wirkungSav(schl) {
    const [m2, m3] = schl.split("|");
    const art = alleArtikel().filter(({ a }) => a[2] === m2 && a[3] === m3);
    return [art.length, -art.reduce((s, { a }) => s + a[4] * a[5] * satz(a) / 100, 0)];
  }
  function wirkungKond(kg) {
    const kunden = KUNDEN[kg].map(k => k[0]);
    const k = KOND[kg][0] + KOND[kg][1];
    const w = -kunden.reduce((s, kd) => s + ARTIKEL[kd].reduce((t, a) => t + a[4] * a[5] * (1 - satz(a) / 100) * k / 100, 0), 0);
    return [kunden.length, w];
  }
  const euro = v => (Math.abs(v) < 0.5 ? zahl(0, 0) : zahl(v, 0));

  /* ---------- Auswahl ---------- */
  const optionen = (sel, liste, wert) => { sel.textContent = ""; liste.forEach(([v, t]) => el("option", v === wert ? { value: v, selected: "" } : { value: v }, sel, t)); };
  optionen($("f-mg2"), MG2.map(([c, t]) => [c, c + " " + t]), "S01");
  function mg3Fuellen(wert) { optionen($("f-mg3"), [["*", "Alle"], ...MG3[$("f-mg2").value].map(([c, t]) => [c, c + " " + t])], wert); }
  mg3Fuellen("L22");
  optionen($("f-kg"), [["*", "Alle"], ...KG.map(([c, t]) => [c, c + " " + t])], "008");

  /* ---------- Raster ---------- */
  const PR = { min: 0, max: 50, meldung: "Prozentwert von 0 bis 50 mit Dezimalkomma, z. B. 1,5" };
  const pos = (z, s) => `grid-row:${z};grid-column:${s}`;
  const zellen = [];
  function zahlFeld(raster, z, s, id, wert, label, setzen) {
    const f = el("input", { class: "mk-feld mk-zahl", id, style: pos(z, s), value: zahl(wert, 1), inputmode: "decimal",
      "aria-label": label, "data-hilfe": "Prozentwert mit Dezimalkomma, z. B. 1,5" }, raster);
    f.addEventListener("input", () => { const v = pruefeFeld(f, "zahl", PR); if (!f.classList.contains("mk-fehler")) setzen(v || 0); rechnen(); });
    f.addEventListener("blur", () => { const v = leseZahl(f.value); if (!f.classList.contains("mk-fehler")) f.value = zahl(v || 0, 1); });
    return f;
  }
  function zeilenSav() {
    const r = $("raster-sav");
    r.querySelectorAll(".zeile").forEach(e => e.remove());
    const m2 = $("f-mg2").value, m3 = $("f-mg3").value;
    const gruppen = MG3[m2].filter(([c]) => m3 === "*" || c === m3);
    gruppen.forEach(([c3, t3], i) => {
      const z = 3 + i, schl = m2 + "|" + c3, t2 = MG2.find(x => x[0] === m2)[1];
      const rz = el("div", { class: "mx-r zeile", style: pos(z, 1) }, r);
      const lab = el("label", { class: "mk-option" }, rz);
      el("input", { type: "radio", class: "mk-check", name: "auswahl-sav", value: schl, id: "r-sav-" + i, "aria-label": `Zeile ${m2} ${c3} auswählen` }, lab);
      [[2, m2], [3, t2], [4, c3], [5, t3]].forEach(([s, t]) => el("span", { class: "mk-label mx-l zeile", style: pos(z, s), id: `l-sav-${i}-${s}` }, r, t));
      zahlFeld(r, z, 6, `s-b-${i}`, SAV[schl][0], `Saving beeinflussbar, ${c3}`, v => { SAV[schl][0] = v; }).classList.add("zeile");
      zahlFeld(r, z, 7, `s-n-${i}`, SAV[schl][1], `Saving nicht beeinflussbar, ${c3}`, v => { SAV[schl][1] = v; }).classList.add("zeile");
      el("div", { class: "mk-feld mk-anzeige mk-zahl zeile", style: pos(z, 8), id: `a-sav-${i}`, "data-schl": schl }, r);
      el("div", { class: "mk-feld mk-anzeige mk-zahl zeile", style: pos(z, 9), id: `w-sav-${i}`, "data-schl": schl }, r);
    });
  }
  function zeilenKond() {
    const r = $("raster-kond");
    r.querySelectorAll(".zeile").forEach(e => e.remove());
    const kg = $("f-kg").value;
    KG.filter(([c]) => kg === "*" || c === kg).forEach(([c, t], i) => {
      const z = 3 + i;
      [[2, c], [3, t]].forEach(([s, x]) => el("span", { class: "mk-label mx-l zeile", style: pos(z, s), id: `l-kond-${i}-${s}` }, r, x));
      zahlFeld(r, z, 4, `k-r-${i}`, KOND[c][0], `Rabatt, Kundengruppe ${c}`, v => { KOND[c][0] = v; }).classList.add("zeile");
      zahlFeld(r, z, 5, `k-s-${i}`, KOND[c][1], `Skonto, Kundengruppe ${c}`, v => { KOND[c][1] = v; }).classList.add("zeile");
      el("div", { class: "mk-feld mk-anzeige mk-zahl zeile", style: pos(z, 6), id: `a-kond-${i}`, "data-kg": c }, r);
      el("div", { class: "mk-feld mk-anzeige mk-zahl zeile", style: pos(z, 7), id: `w-kond-${i}`, "data-kg": c }, r);
    });
  }
  function rechnen() {
    document.querySelectorAll("#raster-sav [data-schl]").forEach(e => {
      const [n, w] = wirkungSav(e.dataset.schl);
      e.textContent = e.id.startsWith("a-") ? String(n) : euro(w);
    });
    document.querySelectorAll("#raster-kond [data-kg]").forEach(e => {
      const [n, w] = wirkungKond(e.dataset.kg);
      e.textContent = e.id.startsWith("a-") ? String(n) : euro(w);
    });
  }
  function neu() { zeilenSav(); zeilenKond(); rechnen(); if (MK.skalieren) MK.skalieren(); if (MK._ebenenNeu) MK._ebenenNeu(); }
  $("f-mg2").addEventListener("change", () => { mg3Fuellen("*"); neu(); });
  $("f-mg3").addEventListener("change", neu);
  $("f-kg").addEventListener("change", neu);
  neu();

  /* ---------- Meldungsprotokoll und Knöpfe ---------- */
  function protokoll(text) { $("meldungen").textContent = text; MK.meldung(text); }
  const fehler = () => !!document.querySelector("#gruppen .mk-fehler");
  $("k-perioden").addEventListener("click", () => {
    const r = document.querySelector("#raster-sav input[type=radio]:checked");
    if (!r) { protokoll("Bitte zuerst eine Zeile auswählen, dann Periodenwerte planen."); return; }
    const [m2, m3] = r.value.split("|");
    protokoll(`Periodenwerte für ${m2}/${m3}: Savings gelten in allen zwölf Monaten (Beispielmaske, Monatsmaske nicht hinterlegt).`);
  });
  $("k-sichern").addEventListener("click", () => {
    if (fehler()) { protokoll("Nicht gesichert: Bitte zuerst die rot markierten Eingaben korrigieren."); return; }
    const n = Object.keys(SAV).filter(k => SAV[k][0] + SAV[k][1] > 0).length, m = Object.keys(KOND).length;
    protokoll(`Gesichert: Savings für ${n} Materialgruppe(n), Konditionen für ${m} Kundengruppen – Vorschlag für die Planung je Kunde und Artikel.`);
  });
  $("k-aktualisieren").addEventListener("click", () => {
    SAV = JSON.parse(JSON.stringify(START_SAV)); KOND = JSON.parse(JSON.stringify(START_KOND));
    neu();
    protokoll("Aktualisiert: gesicherte Gruppenwerte neu geladen.");
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
        { nr: 1, ziel: "band-sav", versatz: [-24, 2], titel: "Savings",
          text: "Savings sind Preisnachlässe, die Kunden – in der Zulieferindustrie meist jährlich – verlangen. Sie mindern den Verkaufspreis und damit den Umsatz und werden deshalb als eigene Prämisse der Umsatzplanung geplant." },
        { nr: 2, ziel: "f-mg3", versatz: [-26, 2], titel: "Selektive Gruppenplanung",
          text: "Statt jeden Artikel einzeln zu bearbeiten, wird ein Wert einmal je Gruppe geplant – hier für die Materialgruppe S01/L22 mit sechs Artikeln. Die Auswahl legt fest, welche Gruppen bearbeitet werden; „Alle“ zeigt jede Untergruppe als eigene Zeile." },
        { nr: 3, ziel: "h-saving", versatz: [-4, -2], titel: "Beeinflussbar und nicht beeinflussbar",
          text: "Der beeinflussbare Teil ist noch Verhandlungssache, der nicht beeinflussbare vertraglich festgelegt. Getrennt geplant, zeigt sich, wie viel Erlösminderung der Vertrieb noch abwenden kann." },
        { nr: 4, ziel: "h-wirkung-sav", versatz: [-4, 2], titel: "Wirkung der Gruppenwerte",
          text: "Die Maske rechnet sofort, für wie viele Artikel der Wert gilt und wie stark er den Planumsatz mindert: Planabsatz × Verkaufspreis × Saving, summiert über alle Artikel der Gruppe." },
        { nr: 5, ziel: "k-perioden", versatz: [14, -10], titel: "Periodenwerte",
          text: "Gruppenwerte gelten zunächst für das ganze Jahr. Für die ausgewählte Zeile lassen sie sich auf Monate verteilen, etwa wenn eine Preissenkung erst ab Juli greift." },
        { nr: 6, ziel: "band-kond", versatz: [-24, 2], titel: "Konditionen je Kundengruppe",
          text: "Rabatt und Skonto sind Erlösschmälerungen. Sie werden je Kundengruppe geplant und gelten für alle Kunden der Gruppe, hier Landtechnik mit dem Kunden 11002." },
        { nr: 7, ziel: "h-wirkung-kond", versatz: [-4, 2], titel: "Konditionen nach Savings",
          text: "Rabatt und Skonto werden auf den Nettopreis nach Saving gerechnet. Ändern Sie oben ein Saving: Auch die Erlöswirkung der Konditionen ändert sich." },
        { nr: 8, ziel: "k-sichern", versatz: [14, -10], titel: "Vorschlag für die Detailplanung",
          text: "Gesicherte Gruppenwerte gehen als Vorschlag in die Planung je Kunde und Artikel ein (Abb. 3.185). Dort lassen sie sich für einzelne Artikel manuell überschreiben." },
      ],
    },
    gestaltung: {
      titel: "Gestaltung",
      intro: "Was gegenüber dem Original geändert wurde – softwareneutral im Buchstil und nach den Interaktionsprinzipien der DIN EN ISO 9241-110.",
      eintraege: [
        { nr: "A", ziel: "kopf", versatz: [-6, 8], regel: "BUCHSTIL – SOFTWARENEUTRAL", titel: "Kein Browserfenster",
          text: "Browserfenster mit Adresszeile (Servername mit Firmennamen), Menü- und Symbolleiste, Taskleiste und die Blätterleiste „Zeile 1 bis 1 / 1“ des Originals entfallen." },
        { nr: "B", ziel: "band-sav", versatz: [-24, 2], regel: "ERLERNBARKEIT", titel: "Eine Maske, zwei Abschnitte",
          text: "Die beiden getrennten Bildschirme „Savings“ und „Rabatte“ stehen als zwei Abschnitte untereinander, mit gleichem Aufbau: Auswahl oben, Raster darunter, Zahlenspalten bündig." },
        { nr: "C", ziel: "h-kond", versatz: [-4, -2], regel: "SELBSTBESCHREIBUNGSFÄHIGKEIT", titel: "Einheit einmal genannt",
          text: "„in %“ steht einmal am Spaltenkopf, die Werte haben eine Nachkommastelle. Das Original schrieb „( in % )“ an jede Spalte und zeigte drei Nachkommastellen („0,000“)." },
        { nr: "D", ziel: "f-mg2", versatz: [-26, 2], regel: "ERWARTUNGSKONFORMITÄT", titel: "Auswahlfelder statt Suchhilfe",
          text: "Material- und Kundengruppe werden aus einer Liste gewählt, Code und Bezeichnung stehen zusammen. Das Original verlangte die Eingabe des Codes mit Suchhilfesymbol." },
        { nr: "E", ziel: "h-artikel", versatz: [-4, 2], regel: "AUFGABENANGEMESSENHEIT", titel: "Wirkung sichtbar",
          text: "Neu sind die Spalten „Artikel“ bzw. „Kunden“ und „Erlöswirkung“: Wer einen Gruppenwert ändert, sieht sofort, wie viele Artikel betroffen sind und was es kostet." },
        { nr: "F", ziel: "g-meldung", versatz: [-4, 2], regel: "SELBSTBESCHREIBUNGSFÄHIGKEIT", titel: "Meldungsprotokoll mit Inhalt",
          text: "Das Meldungsprotokoll zeigt die letzte Aktion oder den Grund, warum nicht gesichert wurde. Im Original war es eine leere Leiste." },
        { nr: "G", ziel: "l-kond-0-3", versatz: [-6, 1], regel: "BUCHSTIL – NEUTRAL UND AKTUELL", titel: "Keine echten Daten",
          text: "Die im Original geschwärzte Kundengruppe trägt einen fiktiven Namen; Materialgruppe „S-Fahrersitz“ heißt „Fahrersitze“. Alle Prozentwerte standen auf 0,000 – Beispielwerte machen die Rechnung sichtbar." },
        { nr: "H", ziel: "s-n-0", anker: "links", versatz: [32, 1], regel: "ROBUSTHEIT GEGEN BENUTZUNGSFEHLER", titel: "Eingaben werden geprüft",
          text: "Prozentwerte von 0 bis 50 mit Dezimalkomma; ungültige Eingaben werden rot markiert und nicht übernommen. Sichern ist erst nach der Korrektur möglich, das Meldungsprotokoll nennt den Grund." },
      ],
    },
  });
  MK.fertig();
})();
