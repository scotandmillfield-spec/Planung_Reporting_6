/* Abb. 3.185 „Detaillierte Umsatzplanung auf Ebene Kunde/Artikel“ – Logik der Maske „Übersicht Absatz-/Umsatzplanung“.
   Je Artikel: Nettopreis nach Saving = Vk-Preis × (1 − Saving beeinflussbar − Saving nicht beeinflussbar),
   Planumsatz = Planabsatz × Nettopreis nach Saving × (1 − Rabatt). Summenzeile über die gezeigten Artikel.
   Artikel, Planabsatz und Vk-Preise des Kunden 11002 wie im Original (14 Zeilen); Savings und Rabatt als Vorschlag aus
   der Gruppenplanung (Abb. 3.184: S01/L22 2,0 + 1,0 %, Kundengruppe 008 Rabatt 2,0 %; im Original 0,000). */
(() => {
  "use strict";
  const { el, zahl, leseZahl, pruefeFeld } = MK;
  MK.init({ titel: "Detaillierte Umsatzplanung auf Ebene Kunde/Artikel" });
  const $ = id => document.getElementById(id);

  /* ---------- Stammdaten (gemeinsam mit Abb. 3.184) ---------- */
  const KG = [["008", "Landtechnik"], ["034", "Schienenfahrzeuge"]];
  const KUNDEN = { "008": [["11002", "Agrarwerk", "Mitte"]], "034": [["11017", "Waggonbau", "Ost"]] };
  const MG2 = [["S01", "Fahrersitze"], ["S02", "Sitzteile"]];
  const MG3 = { S01: [["L22", "Baureihe 44"], ["L23", "Baureihe 83/85"]], S02: [["L31", "Mechanik"], ["L32", "Polster"]] };
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
  // Vorschläge aus der Gruppenplanung (Abb. 3.184)
  const SAV = { "S01|L22": [2.0, 1.0], "S01|L23": [0, 0], "S02|L31": [0, 0], "S02|L32": [0, 0] };
  const KOND = { "008": [2.0, 2.0], "034": [1.5, 2.0] };

  // Planwerte je Kunde und Artikel: Vk-Preis, Saving beeinflussbar, nicht beeinflussbar, Rabatt
  let W = {};
  function vorschlag() {
    W = {};
    Object.entries(KUNDEN).forEach(([kg, kunden]) => kunden.forEach(([kd]) => {
      W[kd] = ARTIKEL[kd].map(a => ({ vk: a[5], s1: SAV[a[2] + "|" + a[3]][0], s2: SAV[a[2] + "|" + a[3]][1], rab: KOND[kg][0] }));
    }));
  }
  vorschlag();
  const netto = w => w.vk * (1 - (w.s1 + w.s2) / 100);
  const umsatz = (a, w) => a[4] * netto(w) * (1 - w.rab / 100);

  /* ---------- Auswahl ---------- */
  const optionen = (sel, liste, wert) => { sel.textContent = ""; liste.forEach(([v, t]) => el("option", v === wert ? { value: v, selected: "" } : { value: v }, sel, t)); };
  optionen($("f-kg"), KG.map(([c, t]) => [c, c + " " + t]), "008");
  optionen($("f-mg2"), [["*", "Alle"], ...MG2.map(([c, t]) => [c, c + " " + t])], "*");
  function mg3Fuellen() {
    const m2 = $("f-mg2").value;
    optionen($("f-mg3"), [["*", "Alle"], ...(m2 === "*" ? [] : MG3[m2].map(([c, t]) => [c, c + " " + t]))], "*");
  }
  mg3Fuellen();

  /* ---------- Raster ---------- */
  const raster = $("raster");
  const pos = (z, s, n = 1) => `grid-row:${z};grid-column:${s}${n > 1 ? " / span " + n : ""}`;
  const FELDER = [
    ["vk", 6, 2, { min: 0, max: 99999, meldung: "Preis in € mit Dezimalkomma, z. B. 181,65" }, "Vk-Preis in €"],
    ["s1", 7, 1, { min: 0, max: 50, meldung: "Prozentwert von 0 bis 50, z. B. 2,0" }, "Saving beeinflussbar in %"],
    ["s2", 8, 1, { min: 0, max: 50, meldung: "Prozentwert von 0 bis 50, z. B. 1,0" }, "Saving nicht beeinflussbar in %"],
    ["rab", 10, 1, { min: 0, max: 50, meldung: "Prozentwert von 0 bis 50, z. B. 2,0" }, "Rabatt in %"],
  ];
  let ZEILEN = [];   // [Artikel, Planwerte, Index]
  function aufbauen() {
    raster.querySelectorAll(".zeile").forEach(e => e.remove());
    const kg = $("f-kg").value, kunde = KUNDEN[kg][0], kd = kunde[0];
    const m2 = $("f-mg2").value, m3 = $("f-mg3").value;
    $("kunden-info").textContent = `Kunde ${kd} ${kunde[1]} ${kunde[2]}`;
    ZEILEN = ARTIKEL[kd].map((a, i) => [a, W[kd][i], i]).filter(([a]) => (m2 === "*" || a[2] === m2) && (m3 === "*" || a[3] === m3));
    const n = ZEILEN.length;
    const kb = el("div", { class: "mx-b zeile", id: "b-kunde", style: `grid-row:3 / span ${Math.max(n, 1)};grid-column:1` }, raster);
    [kd, kunde[1], kunde[2]].forEach(t => el("span", { class: "mk-label" }, kb, t));
    ZEILEN.forEach(([a, w], i) => {
      const z = 3 + i;
      el("span", { class: "mk-label mx-l zeile", id: `m-${i}`, style: pos(z, 2) }, raster, a[0]);
      el("span", { class: "mk-label mx-l zeile", id: `t-${i}`, style: pos(z, 3) }, raster, a[1]);
      const rz = el("div", { class: "mx-r zeile", id: `r-${i}`, style: pos(z, 4) }, raster);
      const lab = el("label", { class: "mk-option" }, rz);
      el("input", { type: "radio", class: "mk-check", name: "auswahl", value: String(i), "aria-label": `Material ${a[0]} auswählen` }, lab);
      el("div", { class: "mk-feld mk-anzeige mk-zahl zeile", id: `pa-${i}`, style: pos(z, 5) }, raster, zahl(a[4], 0));
      FELDER.forEach(([k, s, nk, pr, lbl]) => {
        const f = el("input", { class: "mk-feld mk-zahl zeile", id: `${k}-${i}`, style: pos(z, s), value: zahl(w[k], nk), inputmode: "decimal",
          "aria-label": `${lbl}, Material ${a[0]}`, "data-hilfe": pr.meldung }, raster);
        f.addEventListener("input", () => { const v = pruefeFeld(f, "zahl", pr); if (!f.classList.contains("mk-fehler")) w[k] = v || 0; rechnen(); });
        f.addEventListener("blur", () => { if (!f.classList.contains("mk-fehler")) f.value = zahl(w[k], nk); });
      });
      el("div", { class: "mk-feld mk-anzeige mk-zahl zeile", id: `net-${i}`, style: pos(z, 9) }, raster);
      el("div", { class: "mk-feld mk-anzeige mk-zahl zeile", id: `um-${i}`, style: pos(z, 11) }, raster);
    });
    const zs = 3 + Math.max(n, 1);
    el("div", { class: "leer zeile", style: pos(zs, 1) }, raster);
    el("span", { class: "mk-label mx-l summe zeile", id: "l-summe", style: pos(zs, 2, 2) }, raster, n ? "Summe" : "Keine Artikel in dieser Auswahl");
    el("div", { class: "leer zeile", style: pos(zs, 4) }, raster);
    el("div", { class: "mk-feld mk-anzeige mk-zahl summe zeile", id: "sum-menge", style: pos(zs, 5) }, raster);
    el("div", { class: "leer zeile", style: pos(zs, 6, 5) }, raster);
    el("div", { class: "mk-feld mk-anzeige mk-zahl summe zeile", id: "sum-umsatz", style: pos(zs, 11) }, raster);
    rechnen();
    if (MK.skalieren) MK.skalieren();
    if (MK._ebenenNeu) MK._ebenenNeu();
  }
  function rechnen() {
    let menge = 0, um = 0;
    ZEILEN.forEach(([a, w], i) => {
      const fehler = FELDER.some(([k]) => $(`${k}-${i}`).classList.contains("mk-fehler"));
      $(`net-${i}`).textContent = fehler ? "–" : zahl(netto(w), 2);
      $(`um-${i}`).textContent = fehler ? "–" : zahl(umsatz(a, w), 0);
      menge += a[4]; if (!fehler) um += umsatz(a, w);
    });
    $("sum-menge").textContent = ZEILEN.length ? zahl(menge, 0) : "";
    $("sum-umsatz").textContent = ZEILEN.length ? zahl(um, 0) : "";
    return [menge, um];
  }
  $("f-kg").addEventListener("change", aufbauen);
  $("f-mg2").addEventListener("change", () => { mg3Fuellen(); aufbauen(); });
  $("f-mg3").addEventListener("change", aufbauen);
  aufbauen();

  /* ---------- Knöpfe ---------- */
  const fehler = () => !!document.querySelector("#umsatz .mk-fehler");
  $("k-sichern").addEventListener("click", () => {
    if (fehler()) { MK.meldung("Nicht gesichert: Bitte zuerst die rot markierten Eingaben korrigieren."); return; }
    const [, um] = rechnen();
    MK.meldung(`Gesichert: ${ZEILEN.length} Artikel, Planumsatz ${zahl(um, 0)} €.`);
  });
  $("k-aktualisieren").addEventListener("click", () => {
    vorschlag(); aufbauen();
    MK.meldung("Aktualisiert: Preise aus dem ERP-System und Vorschläge der Gruppenplanung neu geladen.");
  });
  $("k-perioden").addEventListener("click", () => {
    const r = document.querySelector("#raster input[type=radio]:checked");
    if (!r) { MK.meldung("Bitte zuerst einen Artikel in der Spalte „Auswahl“ markieren."); return; }
    const [a] = ZEILEN[+r.value];
    MK.meldung(`Periodenwerte für ${a[0]} ${a[1]}: Monatsmaske in dieser Beispielmaske nicht hinterlegt.`);
  });
  $("k-verteilen").addEventListener("click", () => {
    if (fehler()) { MK.meldung("Bitte zuerst die rot markierten Eingaben korrigieren."); return; }
    const [menge, um] = rechnen();
    MK.meldung(`Gleichmäßig auf zwölf Perioden verteilt: je Monat ${zahl(menge / 12, 1)} Stück und ${zahl(um / 12, 0)} € Planumsatz.`);
  });

  /* ---------- Lernplattform: Erläuterungen und Gestaltung ---------- */
  MK.ebenen({
    erlaeuterungen: {
      titel: "Erläuterungen",
      intro: "Was die Bereiche der Maske in der detaillierten Umsatzplanung leisten. Die Nummern in der Maske zeigen, wo.",
      eintraege: [
        { nr: 1, ziel: "b-kunde", versatz: [-6, 62], titel: "Planung auf Kunden- und Artikelebene",
          text: "Geplant wird je Kunde und Artikel. Aus Planabsatz, Preis, Savings und Rabatt entsteht der Planumsatz von unten, also bottom-up – die feinste Ebene der Umsatzplanung." },
        { nr: 2, ziel: "f-kg", versatz: [-26, 2], titel: "Auswahl",
          text: "Kundengruppe sowie Materialgruppe 2 und 3 grenzen den Ausschnitt ein. Ohne Materialgruppe zeigt die Maske alle Artikel des Kunden; wählen Sie „S01 Fahrersitze“, bleiben nur die Sitze." },
        { nr: 3, ziel: "pa-0", anker: "links", versatz: [32, 1], titel: "Planabsatz aus der Absatzplanung",
          text: "Die Planabsatzmengen kommen aus der Absatzplanung (vgl. Abb. 3.183) und werden hier nur angezeigt. Die Umsatzplanung bewertet sie mit Preisen." },
        { nr: 4, ziel: "vk-0", anker: "links", versatz: [32, 1], titel: "Preisvorschlag aus dem ERP-System",
          text: "Die Verkaufspreise werden aus dem ERP-System übernommen und als Vorschlag für die Planpreise eingesetzt. Wer eine Preiserhöhung erwartet, überschreibt den Vorschlag." },
        { nr: 5, ziel: "s2-0", anker: "links", versatz: [32, 1], titel: "Manuelle Planung",
          text: "Savings und Rabatt stammen aus der Gruppenplanung (Abb. 3.184) – hier 2,0 % + 1,0 % für die Baureihe 44 und 2,0 % Rabatt für die Kundengruppe 008. Für einzelne Artikel lassen sie sich manuell überschreiben." },
        { nr: 6, ziel: "sum-umsatz", anker: "links", versatz: [32, 1], titel: "Vom Preis zum Planumsatz",
          text: "Nettopreis nach Saving = Vk-Preis × (1 − Savings); Planumsatz = Planabsatz × Nettopreis × (1 − Rabatt). Die Summe rechnet bei jeder Eingabe mit." },
        { nr: 7, ziel: "k-perioden", versatz: [14, -10], titel: "Periodische Bearbeitung",
          text: "Die Übersicht zeigt Jahreswerte. „Periodenwerte planen“ öffnet für den markierten Artikel die Monate, etwa für saisonale Mengen oder eine Preisänderung zur Jahresmitte." },
        { nr: 8, ziel: "k-verteilen", versatz: [14, -10], titel: "Jahreswerte verteilen",
          text: "Wer nicht monatlich planen will, verteilt die Jahreswerte auf die Perioden – hier gleichmäßig auf zwölf Monate, in der Praxis auch nach Saisonverlauf oder Arbeitstagen." },
      ],
    },
    gestaltung: {
      titel: "Gestaltung",
      intro: "Was gegenüber dem Original geändert wurde – softwareneutral im Buchstil und nach den Interaktionsprinzipien der DIN EN ISO 9241-110.",
      eintraege: [
        { nr: "A", ziel: "kopf", versatz: [-6, 8], regel: "BUCHSTIL – SOFTWARENEUTRAL", titel: "Kein Browserfenster",
          text: "Browserfenster mit Adresszeile (Servername mit Firmennamen), Menü- und Symbolleiste, Taskleiste, Bildlauf- und Blätterleiste („Zeile 1 bis 14 / 499“) entfallen; ebenso die Knöpfe „Beenden“ und „Zurück“." },
        { nr: "B", ziel: "kopf-unter", versatz: [-6, -2], regel: "SELBSTBESCHREIBUNGSFÄHIGKEIT", titel: "Einheiten einmal genannt",
          text: "Die Spalten „Basis-ME“ und „Währung“ und die Einheiten ST und EUR in jeder Zeile entfallen; die Einheiten stehen im Untertitel und an den Spaltenköpfen. Mengen ganzzahlig statt „138,000“." },
        { nr: "C", ziel: "net-1", anker: "links", versatz: [32, 1], regel: "SELBSTBESCHREIBUNGSFÄHIGKEIT", titel: "Eingabe und Anzeige unterscheidbar",
          text: "Planabsatz, Nettopreis und Planumsatz sind berechnet bzw. übernommen und grau; Preise, Savings und Rabatt sind weiße Eingabefelder. Im Original stand der Nettopreis ohne Kennzeichnung zwischen den Eingabefeldern." },
        { nr: "D", ziel: "f-mg2", versatz: [-26, 2], regel: "ERWARTUNGSKONFORMITÄT", titel: "Auswahlfelder",
          text: "Kunden- und Materialgruppen werden aus einer Liste gewählt, leere Felder heißen „Alle“. Das Original verlangte den Code mit Suchhilfesymbol." },
        { nr: "E", ziel: "l-summe", versatz: [-6, 1], regel: "AUFGABENANGEMESSENHEIT", titel: "Planumsatz und Summe ergänzt",
          text: "Die rechts abgeschnittenen Spalten des Originals (ab „Logistikerlös“) entfallen; dafür zeigt die Maske den Planumsatz je Artikel und die Summe über die Auswahl – das Ergebnis, um das es in der Umsatzplanung geht." },
        { nr: "F", ziel: "b-kunde", versatz: [-6, 62], regel: "BUCHSTIL – NEUTRAL UND AKTUELL", titel: "Fiktive Kunden und Artikel",
          text: "Der im Original geschwärzte Kunde und die Kundengruppe tragen fiktive Namen, die Typenbezeichnungen realer Sitze sind ersetzt, Materialtexte ausgeschrieben („POLSTER F.R_STOFF“ → „Rückenpolster Stoff“)." },
        { nr: "G", ziel: "r-0", versatz: [0, 1], regel: "ERWARTUNGSKONFORMITÄT", titel: "Auswahlspalte beschriftet",
          text: "Die Spalte mit den Optionsfeldern heißt „Auswahl“; im Original stand dort nur ein Symbol. Markiert wird der Artikel für „Periodenwerte planen“." },
        { nr: "H", ziel: "rab-0", anker: "links", versatz: [32, 1], regel: "ROBUSTHEIT GEGEN BENUTZUNGSFEHLER", titel: "Eingaben werden geprüft",
          text: "Preise ab 0 €, Savings und Rabatt von 0 bis 50 % mit Dezimalkomma. Ungültige Eingaben werden rot markiert, Nettopreis und Planumsatz der Zeile zeigen „–“, Sichern ist erst nach der Korrektur möglich." },
      ],
    },
  });
  MK.fertig();
})();
