/* Abb. 5.72 „Standardbericht SAP ERP CC (Selektionsmaske)“ – Logik der Selektion „Kostenstellen: Ist/Soll/Abweichung“.
   Texte zu den Schlüsseln (Kostenrechnungskreis, Perioden, Version, Kostenstelle, Kostenarten) werden aus den Stammdaten
   angezeigt; Eingaben werden geprüft; „Ausführen“ fasst die Selektion zusammen, die den Detailbericht (Abb. 5.73) bestimmt.
   Stammdaten wie in Abb. 5.73 (daten_kostenstellen.py). */
(() => {
  "use strict";
  const { el, leseZahl, pruefeFeld } = MK;
  MK.init({ titel: "Kostenstellen: Ist/Soll/Abweichung – Selektion" });
  const $ = id => document.getElementById(id);
  const NDASH = String.fromCharCode(0x2013);

  /* ---------- Stammdaten (gleichlautend mit Abb. 5.73) ---------- */
  const KRK = { 1000: "Inland" };
  const VERSIONEN = [["0", "Plan/Ist-Version"], ["1", "Planversion 1 (Simulation)"]];
  const KST = { 1000: "Zentrale Dienste", 1100: "Personalwesen", 1200: "Informationstechnik" };
  const KST_GRUPPEN = [["", ""], ["VERWALTUNG", "Verwaltung (1000" + NDASH + "1200)"]];
  const KA = { 430000: "Gehälter", 435000: "Tarifliche Jahresleistung", 440000: "Gesetzliche Sozialaufwendungen",
    449000: "Sonstige Personalkosten", 451000: "Instandhaltung Gebäude", 466000: "Versicherungen", 470000: "Raumkosten",
    471000: "Maschinenmieten", 473000: "Postkosten (ohne Telefon)", 476000: "Büromaterial", 476100: "EDV-Material",
    476500: "Sonstige Verwaltungskosten", 476900: "Sonstige Kosten", 481000: "Kalkulatorische Abschreibungen",
    483000: "Kalkulatorische Zinsen", 618000: "Verrechnung EDV (direkt)", 632000: "Verrechnung Dienstleistungen",
    633000: "Verrechnung Kantine", 634000: "Verrechnung Telefoneinheiten", 635000: "Verrechnung Telefone",
    636000: "Verrechnung Fuhrpark", 637000: "Verrechnung Personal" };
  const KA_GRUPPEN = [["", ""], ["PRIMAER", "Primärkosten"], ["SEKUNDAER", "Sekundärkosten"]];
  const MLANG = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

  const optionen = (sel, liste, wert) => liste.forEach(([v, t]) => el("option", v === wert ? { value: v, selected: "" } : { value: v }, sel, t));
  optionen($("f-version"), VERSIONEN.map(([v]) => [v, v]), "0");
  optionen($("f-kstgr"), KST_GRUPPEN, "");
  optionen($("f-kagr"), KA_GRUPPEN, "");

  /* ---------- Prüfungen und Anzeigen ---------- */
  const ganz = v => v !== null && !isNaN(v) && Math.floor(v) === v;
  function periode(id) {
    const f = $(id), v = pruefeFeld(f, "zahl", { min: 1, max: 12, pflicht: true, meldung: "Periode 1 bis 12" });
    if (v !== null && !ganz(v)) { f.classList.add("mk-fehler"); f.title = "Periode als ganze Zahl 1 bis 12"; return null; }
    return v;
  }
  function intervall(idVon, idBis, stamm, idGruppe, art) {
    const fv = $(idVon), fb = $(idBis), gruppe = $(idGruppe).value;
    const v = pruefeFeld(fv, "zahl", { min: 0, meldung: art + " als Nummer" }), b = pruefeFeld(fb, "zahl", { min: 0, meldung: art + " als Nummer" });
    const fehler = (f, t) => { f.classList.add("mk-fehler"); f.title = t; };
    if (gruppe && (v !== null || b !== null)) {
      [fv, fb, $(idGruppe)].forEach(f => fehler(f, "Entweder Gruppe oder Einzelwerte angeben"));
      return { text: "Gruppe oder Werte", ok: false };
    }
    $(idGruppe).classList.remove("mk-fehler");
    if (fv.classList.contains("mk-fehler") || fb.classList.contains("mk-fehler")) return { text: "", ok: false };
    if (v === null && b !== null) { fehler(fv, "Untere Grenze fehlt"); return { text: "", ok: false }; }
    if (v === null) return { text: gruppe ? "" : "alle " + art.replace("Kostenart", "Kostenarten").replace("Kostenstelle", "Kostenstellen"), ok: true, leer: !gruppe };
    if (b === null) {
      if (!stamm[v]) { fehler(fv, `${art} ${v} ist nicht angelegt`); return { text: "nicht angelegt", ok: false }; }
      return { text: stamm[v], ok: true };
    }
    if (b < v) { fehler(fb, "Obere Grenze vor der unteren"); return { text: "", ok: false }; }
    const n = Object.keys(stamm).filter(k => +k >= v && +k <= b).length;
    return { text: n === 1 ? stamm[Object.keys(stamm).find(k => +k >= v && +k <= b)] : `${n} ${art === "Kostenart" ? "Kostenarten" : "Kostenstellen"}`, ok: n > 0 };
  }
  let ZUSTAND = {};
  function aktualisieren() {
    $("a-krk").textContent = KRK[$("f-krk").value] || "";
    const jahr = pruefeFeld($("f-jahr"), "zahl", { min: 2000, max: 2099, pflicht: true, meldung: "Geschäftsjahr vierstellig (2000–2099)" });
    if (jahr !== null && !ganz(jahr)) $("f-jahr").classList.add("mk-fehler");
    const von = periode("f-von"), bis = periode("f-bis");
    if (von !== null && bis !== null && von > bis) {
      $("f-bis").classList.add("mk-fehler"); $("f-bis").title = "Die Bis-Periode liegt vor der Von-Periode";
    }
    const j = $("f-jahr").classList.contains("mk-fehler") ? "" : " " + jahr;
    $("a-von").textContent = von !== null ? MLANG[von - 1] + j : "";
    $("a-bis").textContent = bis !== null && !$("f-bis").classList.contains("mk-fehler") ? MLANG[bis - 1] + j : "";
    $("a-version").textContent = (VERSIONEN.find(v => v[0] === $("f-version").value) || ["", ""])[1];
    const kst = intervall("f-kst-von", "f-kst-bis", KST, "f-kstgr", "Kostenstelle");
    const ka = intervall("f-ka-von", "f-ka-bis", KA, "f-kagr", "Kostenart");
    $("a-kst").textContent = kst.text;
    $("a-ka").textContent = ka.text || (KA_GRUPPEN.find(g => g[0] === $("f-kagr").value) || ["", ""])[1];
    ZUSTAND = { jahr, von, bis, kst, ka };
  }
  ["f-jahr", "f-von", "f-bis", "f-kst-von", "f-kst-bis", "f-ka-von", "f-ka-bis"].forEach(id => $(id).addEventListener("input", aktualisieren));
  ["f-krk", "f-version", "f-kstgr", "f-kagr"].forEach(id => $(id).addEventListener("change", aktualisieren));
  aktualisieren();

  /* ---------- Aktionen ---------- */
  $("k-ausfuehren").addEventListener("click", () => {
    aktualisieren();
    if (document.querySelector("#selektion .mk-fehler")) { MK.meldung("Bitte zuerst die rot markierten Eingaben korrigieren."); return; }
    const z = ZUSTAND, g = $("f-kstgr").value;
    if (!g && z.kst.leer) { $("f-kst-von").classList.add("mk-fehler"); MK.meldung("Bitte eine Kostenstellengruppe oder einen Wert angeben."); return; }
    const kst = g ? "Kostenstellengruppe " + $("f-kstgr").selectedOptions[0].text : `Kostenstelle ${$("f-kst-von").value}${$("f-kst-bis").value ? NDASH + $("f-kst-bis").value : ""} ${z.kst.text}`;
    const ka = $("a-ka").textContent || "alle Kostenarten";
    MK.meldung(`Bericht für ${kst}, Perioden ${z.von} bis ${z.bis}/${z.jahr}, Version ${$("f-version").value}, ${ka} – Ergebnis wie Abb. 5.73.`);
  });
  $("k-datenquelle").addEventListener("click", () => MK.meldung(`Datenquelle: Ist- und Plandaten der Kostenstellenrechnung, Kostenrechnungskreis ${$("f-krk").value}.`));
  ["l-kst", "l-ka"].forEach(id => $(id).addEventListener("click", () =>
    MK.meldung("Mehrfachauswahl: Einzelwerte, Intervalle und Ausschlüsse – in der Beispielmaske nicht hinterlegt.")));
  $("f-istbew").addEventListener("change", () => MK.meldung($("f-istbew").checked ? "Istbewertung gesetzt: Istwerte mit gesonderter Bewertung." : "Istbewertung aus: Standardbewertung der Istwerte."));

  /* ---------- Klappen ohne Maßstabssprung (wie Abb. 3.7) ---------- */
  if (!document.body.classList.contains("print")) {
    const maske = $("selektion"), seite = $("seite"), rahmen = seite.parentElement;
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
      intro: "Was die Felder der Selektion im Standardbericht der Kostenstellenrechnung leisten. Die Nummern in der Maske zeigen, wo.",
      eintraege: [
        { nr: 1, ziel: "kopf-titel", versatz: [8, 2], titel: "Standardbericht Ist/Soll/Abweichung",
          text: "Der Bericht vergleicht je Kostenstelle und Kostenart die Istkosten mit den Sollkosten – den Plankosten, angepasst an die tatsächliche Beschäftigung (flexible Plankostenrechnung). Vor dem Bericht steht diese Selektion; ihr Ergebnis zeigt Abb. 5.73." },
        { nr: 2, ziel: "f-krk", versatz: [-26, 2], titel: "Kostenrechnungskreis",
          text: "Der Kostenrechnungskreis ist die organisatorische Einheit, in der die Kostenrechnung geführt wird. Alle Kostenstellen und Kostenarten des Berichts gehören zu ihm; der Text daneben kommt aus den Stammdaten." },
        { nr: 3, ziel: "f-von", anker: "links", versatz: [0, 2], titel: "Geschäftsjahr und Perioden",
          text: "Geschäftsjahr und Von-/Bis-Periode legen den Berichtszeitraum fest, hier das ganze Jahr 2026. Wählt man z. B. Periode 1 bis 6, vergleicht der Bericht das erste Halbjahr." },
        { nr: 4, ziel: "f-version", versatz: [-26, 2], titel: "Planversion",
          text: "Die Planversion bestimmt, welche Planwerte die Grundlage der Sollkosten sind. Version 0 enthält Plan und Ist; weitere Versionen dienen Simulationen oder Planvarianten." },
        { nr: 5, ziel: "o-istbew", versatz: [10, 2], titel: "Istbewertung",
          text: "Optionales Kennzeichen für eine gesonderte Bewertung der Istwerte. Im Beispiel ist es nicht gesetzt; der Bericht zeigt die Istkosten in der Standardbewertung." },
        { nr: 6, ziel: "f-kstgr", versatz: [-26, 2], titel: "Kostenstellengruppe oder Werte",
          text: "Ausgewertet wird entweder eine Gruppe aus der Kostenstellenhierarchie oder einzelne Kostenstellen bzw. ein Intervall. Hier ist die Kostenstelle 1000 Zentrale Dienste gewählt; eine Gruppe verdichtet mehrere Kostenstellen in einem Bericht." },
        { nr: 7, ziel: "f-kagr", versatz: [-26, 2], titel: "Kostenartengruppe oder Werte",
          text: "Ohne Angabe enthält der Bericht alle Kostenarten. Eine Gruppe – etwa die Primärkosten (Kostenarten 4…) oder die Sekundärkosten der innerbetrieblichen Leistungsverrechnung (6…) – oder ein Intervall schränkt die Zeilen ein." },
        { nr: 8, ziel: "k-ausfuehren", versatz: [10, -8], titel: "Ausführen",
          text: "„Ausführen“ startet den Bericht mit dieser Selektion. Der Detailbericht übernimmt sie in seinen Berichtskopf: Kostenrechnungskreis, Kostenstelle mit Verantwortlicher, Version und Berichtszeitraum." },
      ],
    },
    gestaltung: {
      titel: "Gestaltung",
      intro: "Was gegenüber dem Original geändert wurde – softwareneutral im Buchstil und nach den Interaktionsprinzipien der DIN EN ISO 9241-110.",
      eintraege: [
        { nr: "A", ziel: "kopf", versatz: [-6, 8], regel: "BUCHSTIL – SOFTWARENEUTRAL", titel: "Kein Programmfenster",
          text: "Menüleiste, Symbolleiste mit Befehlsfeld, Info-Symbol und das Ausführen-Symbol des Originals entfallen. Übrig bleibt die Selektion mit dem Berichtsnamen als Titel; „: Selektieren“ steht im Untertitel." },
        { nr: "B", ziel: "a-krk", anker: "links", versatz: [0, 2], regel: "SELBSTBESCHREIBUNGSFÄHIGKEIT", titel: "Texte zu den Schlüsseln",
          text: "Neben Kostenrechnungskreis, Perioden, Version und Kostenstelle steht, wofür der Schlüssel steht (Inland, Januar 2026, Plan/Ist-Version, Zentrale Dienste). Das Original zeigte nur die Nummern." },
        { nr: "C", ziel: "a-von", anker: "links", versatz: [0, 2], regel: "SELBSTBESCHREIBUNGSFÄHIGKEIT", titel: "Eingabe und Anzeige unterscheidbar",
          text: "Eingabefelder sind weiß mit Rahmen, Texte aus den Stammdaten grau hinterlegt und nicht änderbar. Im Original sahen Eingaben und Hintergrund gleichermaßen hellblau aus." },
        { nr: "D", ziel: "l-kst", anker: "links", versatz: [-6, 2], regel: "ERWARTUNGSKONFORMITÄT", titel: "Mehrfachauswahl als Link",
          text: "Der gelbe Pfeilknopf des Originals ist ein beschrifteter Link „Mehrfachauswahl“; Auswahllisten tragen den Pfeil rechts, Zahlen stehen rechtsbündig, Istbewertung ist ein Kontrollkästchen." },
        { nr: "E", ziel: "f-bis", anker: "links", versatz: [0, 2], regel: "ROBUSTHEIT GEGEN BENUTZUNGSFEHLER", titel: "Eingaben werden geprüft",
          text: "Perioden 1 bis 12 mit Bis nicht vor Von, ein vierstelliges Geschäftsjahr, nur angelegte Kostenstellen und Kostenarten, Gruppe oder Einzelwerte – nicht beides. Fehler werden rot markiert; ausgeführt wird erst nach der Korrektur." },
        { nr: "F", ziel: "band-gruppen", versatz: [-24, 2], regel: "ERLERNBARKEIT", titel: "Zwei Abschnitte wie im Original",
          text: "Die Gruppen „Auswahl Werte“ und „Auswahl Gruppen“ sind Abschnitte mit Band, Beschriftungen und Felder liegen auf gemeinsamen Achsen; die Abschnitte lassen sich auf- und zuklappen." },
        { nr: "G", ziel: "k-datenquelle", versatz: [10, -8], regel: "STEUERBARKEIT", titel: "Beschriftete Knöpfe",
          text: "Ausführen ist die Hauptaktion (anthrazit), „Datenquelle …“ ein Nebenknopf. Im Original lag das Ausführen als Symbol über der Maske, „Datenquelle…“ als Text daneben." },
        { nr: "H", ziel: "f-jahr", anker: "links", versatz: [0, 2], regel: "BUCHSTIL – NEUTRAL UND AKTUELL", titel: "Aktuelles Jahr",
          text: "Geschäftsjahr 2008 wird zu 2026; Kostenstelle 1000 heißt im Beispiel „Zentrale Dienste“. Leere Felder des Originals bleiben leer." },
      ],
    },
  });
  MK.fertig();
})();
