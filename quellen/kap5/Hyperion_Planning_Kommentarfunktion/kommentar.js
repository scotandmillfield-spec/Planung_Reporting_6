/* Abb. 5.81 „Kommentarfunktion“ – Logik des Formulars „Investitionsplanung“ mit Positionsanmerkung und Anmerkungen der
   Planungseinheit (= Kombination aus Szenario, Version und Einheit).
   Raster je Investition (Seite Gesellschaft x Kostenstelle x Investition): Eingaben im Monat der Anschaffung –
   geplanter Anschaffungswert, Nutzungsdauer in Jahren, Restwert, Durchführung (1 = ja). Daraus:
   Anschaffungswert und Auszahlung im Anschaffungsmonat, Bruttowert ab dann, Abschreibung linear je Monat
   = (Anschaffungswert − Restwert) / (Nutzungsdauer x 12) ab dem Anschaffungsmonat, Wertberichtigung = kumulierte
   Abschreibung, Nettowert = Bruttowert − Wertberichtigung. Bei Durchführung 0 entfallen die Werte.
   Anmerkungen: Titel und Text; gespeichert werden Autor (angemeldete Person), Datum und Uhrzeit, neueste zuerst.
   Druckfassung: Deutschland · Sonstige Kostenstellen · Investition 1 (Büromöbel), wie im Original. */
(() => {
  "use strict";
  const { el, zahl, leseZahl, pruefeFeld } = MK;
  MK.init({ titel: "Kommentarfunktion" });
  const $ = id => document.getElementById(id);

  // <daten> erzeugt von ../Hyperion_Planning_Mehrdimensionale_Planungsformulare/daten_planungsmodell.py – nicht von Hand ändern
const DATEN = {"stand":"14.10.2027","jahrPlan":2028,"monate":["Jan","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"],"gesellschaften":["Deutschland","Großbritannien","USA","Australien","Japan"],"personen":{"albers":["Herr Albers","Konzerncontrolling"],"brandt":["Frau Brandt","Controlling Deutschland"],"roth":["Herr Roth","Kostenstellenleitung Deutschland"],"kaya":["Frau Kaya","Controlling Amerika"]},"benutzer":"brandt","investitionen":{"Deutschland":{"Sonstige Kostenstellen":[["Investition 1","Büromöbel",6000,5,0,3,1],["Investition 2","Medientechnik",18000,6,0,6,1]],"Fertigung":[["Investition 1","Montagelinie",480000,10,0,4,1],["Investition 2","Prüfstand",96000,8,0,9,0]],"Vertrieb":[["Investition 1","Showroom",36000,5,0,2,1]]},"Großbritannien":{"Sonstige Kostenstellen":[["Investition 1","Büromöbel",4800,5,0,5,1]],"Vertrieb":[["Investition 1","Lieferfahrzeug",42000,6,6000,7,1]]},"USA":{"Fertigung":[["Investition 1","Lackieranlage",240000,10,0,3,1]],"Sonstige Kostenstellen":[["Investition 1","Server",21600,3,0,1,1]]},"Australien":{"Vertrieb":[["Investition 1","Showroom",24000,5,0,8,1]]},"Japan":{"Sonstige Kostenstellen":[["Investition 1","Büromöbel",7200,5,0,4,1]],"Fertigung":[["Investition 1","Werkzeuge",60000,5,0,10,1]]}},"anmerkungen":{"Deutschland":[["Status überprüfen – nicht beendet","albers","13.10.2027","12:06","Bitte überarbeiten."],["Status überprüfen – wird überprüft","roth","13.10.2027","12:04","Bitte um Feedback."]],"Großbritannien":[["Genehmigt","albers","08.10.2027","16:30","Freigabe ohne Änderungen."]],"USA":[["Daten eingeben – wird überprüft","kaya","12.10.2027","18:45","Lackieranlage nach Angebot vom 30.09.2027."]],"Australien":[],"Japan":[["Genehmigt","albers","11.10.2027","09:20","Werkzeugbudget wie besprochen."]]}};
// </daten>

  const D = DATEN, M = D.monate;
  const person = k => D.personen[k][0];
  const optionen = (sel, liste, wert) => { sel.textContent = ""; liste.forEach(t => el("option", t === wert ? { value: t, selected: "" } : { value: t }, sel, t)); };

  /* ---------- Arbeitsstand je Investition ---------- */
  const STAND = {};
  const schluessel = () => [$("f-ges").value, $("f-ks").value, $("f-inv").value].join("|");
  function laden(neu) {
    const k = schluessel();
    if (!STAND[k] || neu) {
      const [g, ks, inv] = k.split("|");
      const d = ((D.investitionen[g] || {})[ks] || []).find(x => x[0] === inv);
      const leer = () => Array(12).fill(null);
      const S = { anm: ["", "", "", ""], aw: leer(), nd: leer(), rw: leer(), df: leer() };
      if (d) { const m = d[5] - 1; S.anm[0] = d[1]; S.aw[m] = d[2]; S.nd[m] = d[3]; S.rw[m] = d[4]; S.df[m] = d[6]; }
      STAND[k] = S;
    }
    return STAND[k];
  }

  /* ---------- Seite ---------- */
  optionen($("f-ges"), D.gesellschaften, "Deutschland");
  function kostenstellen(wert) { const ks = Object.keys(D.investitionen[$("f-ges").value] || {}); optionen($("f-ks"), ks, ks.includes(wert) ? wert : ks[0]); }
  function investitionen(wert) { const iv = ((D.investitionen[$("f-ges").value] || {})[$("f-ks").value] || []).map(x => x[0]); optionen($("f-inv"), iv, iv.includes(wert) ? wert : iv[0]); }
  kostenstellen("Sonstige Kostenstellen"); investitionen("Investition 1");

  /* ---------- Raster ---------- */
  const raster = $("raster");
  const pos = (r, c, n = 1) => `grid-row:${r};grid-column:${c}${n > 1 ? " / span " + n : ""}`;
  M.forEach((m, j) => el("div", { class: "mx-k k2", style: pos(2, 3 + j) }, raster, m));
  const EIN = [["aw", "Geplanter Anschaffungswert", { min: 0, max: 99999999, meldung: "Betrag in € ab 0, ganze Zahl" }],
               ["nd", "Nutzungsdauer in Jahren", { min: 1, max: 50, meldung: "Nutzungsdauer in Jahren, ganze Zahl von 1 bis 50" }],
               ["rw", "Restwert", { min: 0, max: 99999999, meldung: "Restwert in € ab 0, höchstens der Anschaffungswert" }],
               ["df", "Durchführung (1 = ja)", { min: 0, max: 1, meldung: "1 = Investition wird durchgeführt, 0 = nicht" }]];
  const AUS = [["anschaffung", "Anschaffungswert"], ["brutto", "Bruttowert"], ["afa", "Abschreibungen"],
               ["wb", "Wertberichtigung"], ["netto", "Nettowert"], ["auszahlung", "Auszahlung Investition"]];
  function aufbauen() {
    raster.querySelectorAll(".zeile").forEach(e => e.remove());
    const S = laden();
    EIN.forEach(([k, lab, pr], i) => {
      const r = 3 + i;
      el("div", { class: "mx-l zeile", id: "l-" + k, style: pos(r, 1) }, raster, lab);
      const a = el("input", { class: "mk-feld zeile trenn", id: "pa-" + k, style: pos(r, 2), value: S.anm[i],
        "aria-label": `Positionsanmerkung ${lab}`, "data-hilfe": "Positionsanmerkung: kurzer Text zur Zeile, z. B. Art der Investition" }, raster);
      a.addEventListener("input", () => { S.anm[i] = a.value; });
      M.forEach((mn, m) => {
        const f = el("input", { class: "mk-feld mk-zahl zeile" + (m === 0 ? " trenn" : ""), id: `${k}-${m}`, style: pos(r, 3 + m), inputmode: "numeric",
          value: S[k][m] == null ? "" : zahl(S[k][m], 0), "aria-label": `${lab}, ${mn} ${D.jahrPlan}`, "data-hilfe": pr.meldung }, raster);
        f.addEventListener("input", () => {
          const v = pruefeFeld(f, "zahl", pr);
          if (v != null && v % 1) { f.classList.add("mk-fehler"); f.title = pr.meldung; }
          if (!f.classList.contains("mk-fehler")) S[k][m] = v;
          rechnen();
        });
        f.addEventListener("blur", () => { if (!f.classList.contains("mk-fehler")) f.value = S[k][m] == null ? "" : zahl(S[k][m], 0); });
      });
    });
    AUS.forEach(([k, lab], i) => {
      const r = 3 + EIN.length + i, oben = i === 0 ? " oben" : "";
      el("div", { class: "mx-l zeile" + oben, id: "l-" + k, style: pos(r, 1) }, raster, lab);
      el("div", { class: "mk-feld mk-anzeige zeile trenn" + oben, id: "pa-" + k, style: pos(r, 2) }, raster);
      M.forEach((_, m) => el("div", { class: "mk-feld mk-anzeige mk-zahl zeile" + oben + (m === 0 ? " trenn" : ""), id: `${k}-${m}`, style: pos(r, 3 + m) }, raster));
    });
    rechnen();
    if (MK.skalieren) MK.skalieren();
    if (MK._ebenenNeu) MK._ebenenNeu();
  }
  function werte(S) {
    const out = Object.fromEntries(AUS.map(([k]) => [k, Array(12).fill(null)]));
    const m0 = S.aw.findIndex(v => v != null && v > 0);
    if (m0 < 0) return { out, hinweis: "keine Anschaffung geplant" };
    const aw = S.aw[m0], nd = S.nd[m0], rw = S.rw[m0] || 0, df = S.df[m0];
    if (df === 0) return { out, hinweis: "nicht durchgeführt" };
    if (!nd || rw > aw) return { out, hinweis: "Angaben unvollständig" };
    const afa = (aw - rw) / (nd * 12);
    let wb = 0;
    for (let m = m0; m < 12; m++) {
      wb += afa;
      out.brutto[m] = aw; out.afa[m] = afa; out.wb[m] = wb; out.netto[m] = aw - wb;
    }
    out.anschaffung[m0] = aw; out.auszahlung[m0] = aw;
    return { out, hinweis: "" };
  }
  function rechnen() {
    const S = laden(), { out } = werte(S);
    // Restwert über dem Anschaffungswert desselben Monats ist ein Fehler
    M.forEach((_, m) => { const f = $(`rw-${m}`); if (f && S.rw[m] != null && S.aw[m] != null) f.classList.toggle("mk-fehler", S.rw[m] > S.aw[m]); });
    AUS.forEach(([k]) => M.forEach((_, m) => { $(`${k}-${m}`).textContent = out[k][m] == null ? "" : zahl(out[k][m], 0); }));
  }

  /* ---------- Anmerkungen der Planungseinheit ---------- */
  optionen($("a-einheit"), D.gesellschaften, "Deutschland");
  const ANM = {};
  const anmKey = () => [$("a-szenario").value, $("a-version").value, $("a-einheit").value].join("|");
  function anmerkungen() {
    const k = anmKey();
    if (!ANM[k]) {
      const [, v, e] = k.split("|");
      ANM[k] = v === "BU" ? (D.anmerkungen[e] || []).map(a => ({ titel: a[0], autor: person(a[1]), datum: a[2], zeit: a[3], text: a[4] })) : [];
    }
    return ANM[k];
  }
  function liste() {
    const L = $("liste"), A = anmerkungen();
    L.textContent = "";
    $("kopf-vorhanden").textContent = `Vorhandene Anmerkungen (${A.length})`;
    if (!A.length) { el("p", { class: "leer" }, L, "Zu dieser Planungseinheit gibt es noch keine Anmerkungen."); return; }
    A.forEach((a, i) => {
      const e = el("div", { class: "eintrag", id: i === 0 ? "anm-0" : undefined }, L);
      el("p", { class: "titel" }, e, a.titel);
      el("p", { class: "meta" }, e, `${a.autor} · ${a.datum}, ${a.zeit} Uhr`);
      el("p", {}, e, a.text);
    });
  }
  ["a-szenario", "a-version", "a-einheit"].forEach(id => $(id).addEventListener("change", liste));
  $("k-anm-speichern").addEventListener("click", () => {
    const t = $("a-titel"), x = $("a-text");
    [t, x].forEach(f => { const leer = !f.value.trim(); f.classList.toggle("mk-fehler", leer); f.title = leer ? "Pflichtfeld" : (f.dataset.hilfe || ""); });
    if (!t.value.trim() || !x.value.trim()) { MK.meldung("Bitte Titel und Text der Anmerkung eingeben."); return; }
    // Datum des Beispiels (Stand der Planung), Uhrzeit aktuell
    const jetzt = new Date(), zz = n => String(n).padStart(2, "0");
    anmerkungen().unshift({ titel: t.value.trim(), autor: person(D.benutzer), datum: D.stand, zeit: `${zz(jetzt.getHours())}:${zz(jetzt.getMinutes())}`, text: x.value.trim() });
    liste();
    MK.meldung(`Anmerkung gespeichert – ${person(D.benutzer)}, ${D.stand}, Planungseinheit ${anmKey().replace("P2028", "Plan 2028").replace("BU", "Bottom-up").replace("TD", "Top-down").split("|").join(" · ")}.`);
    t.value = ""; x.value = "";
  });

  /* ---------- Auswahl und Knöpfe ---------- */
  $("f-ges").addEventListener("change", () => { kostenstellen(); investitionen(); optionen($("a-einheit"), D.gesellschaften, $("f-ges").value); liste(); aufbauen(); });
  $("f-ks").addEventListener("change", () => { investitionen(); aufbauen(); });
  $("f-inv").addEventListener("change", aufbauen);
  const fehler = () => !!document.querySelector("#raster .mk-fehler");
  $("k-speichern").addEventListener("click", () => {
    if (fehler()) { MK.meldung("Nicht gespeichert: Bitte zuerst die rot markierten Eingaben korrigieren."); return; }
    const S = laden(), { out, hinweis } = werte(S), afa = out.afa.reduce((a, v) => a + (v || 0), 0);
    MK.meldung(`Gespeichert: ${schluessel().split("|").join(" · ")}` + (hinweis ? ` – ${hinweis}.` : `, Abschreibungen ${D.jahrPlan}: ${zahl(afa, 0)} €.`));
  });
  $("k-aktualisieren").addEventListener("click", () => { laden(true); aufbauen(); MK.meldung("Aktualisiert: gespeicherte Werte neu geladen."); });
  $("k-regeln").addEventListener("click", () => MK.meldung("Regel „Investitionen berechnen“: Abschreibungen und Auszahlungen gehen in GuV und Finanzrechnung ein (vgl. Abb. 5.80)."));
  $("k-anweisungen").addEventListener("click", () => MK.meldung("Anweisung: Anschaffungswert, Nutzungsdauer, Restwert und Durchführung im Monat der Anschaffung eingeben."));
  const zeigen = (id, text) => { const g = $(id); g.classList.add("hervor"); setTimeout(() => g.classList.remove("hervor"), 1600); MK.meldung(text); };
  $("k-anmerkungen").addEventListener("click", () => zeigen("abschnitt-anm", "Anmerkungen der Planungseinheit stehen unter dem Raster."));
  $("k-posanm").addEventListener("click", () => { const f = $("pa-aw"); f.focus(); f.select(); MK.meldung("Positionsanmerkung der Zeile bearbeiten und mit „Speichern“ sichern."); });
  document.querySelectorAll("#reiter span:not(.aktiv)").forEach(r => r.addEventListener("click", () =>
    MK.meldung(`Das Formular „${r.textContent.replace(/^[IV]+\. /, "")}“ ist in diesem Beispiel nicht hinterlegt.`)));
  liste();
  aufbauen();

  /* ---------- Lernplattform: Erläuterungen und Gestaltung ---------- */
  MK.ebenen({
    erlaeuterungen: {
      titel: "Erläuterungen",
      intro: "Was die Bereiche des Formulars und seine Kommentarfunktionen leisten. Die Nummern in der Maske zeigen, wo.",
      eintraege: [
        { nr: 1, ziel: "pa-aw", versatz: [-2, 1], titel: "Positionsanmerkung",
          text: "Zu einer einzelnen Zeile lässt sich eine kurze Anmerkung hinterlegen, hier „Büromöbel“ zum geplanten Anschaffungswert. Sie erklärt den Wert dort, wo er steht, und wird mit ihm gespeichert." },
        { nr: 2, ziel: "band-anm", versatz: [-24, 2], titel: "Anmerkungen der Planungseinheit",
          text: "Für die ganze Planungseinheit gibt es zusätzlich Anmerkungen mit Titel und Text – etwa Begründungen, Rückfragen oder Hinweise zum Bearbeitungsstand." },
        { nr: 3, ziel: "g-einheit", versatz: [-4, 2], titel: "Planungseinheit",
          text: "Eine Planungseinheit ist die Kombination aus Szenario, Version und Einheit (Gesellschaft), hier Plan 2028 · Bottom-up · Deutschland. Auf dieser Ebene laufen auch Status und Workflow (Abb. 5.82). Wählen Sie eine andere Einheit." },
        { nr: 4, ziel: "g-vorhanden", versatz: [-4, 2], titel: "Autor, Datum und Uhrzeit",
          text: "Gespeichert werden der Autor, Datum und Uhrzeit; die neueste Anmerkung steht oben. So bleibt nachvollziehbar, wer wann was angemerkt hat – hier die Rückfrage aus der Kostenstelle und die Antwort des Konzerncontrollings." },
        { nr: 5, ziel: "k-anm-speichern", versatz: [12, 4], titel: "Anmerkung hinzufügen",
          text: "Titel und Text eingeben und speichern: Die Anmerkung erscheint mit Ihrem Namen und der aktuellen Uhrzeit oben in der Liste." },
        { nr: 6, ziel: "aw-1", versatz: [-2, 1], titel: "Eingaben im Anschaffungsmonat",
          text: "Anschaffungswert, Nutzungsdauer, Restwert und Durchführung werden im Monat der Anschaffung eingegeben, hier März 2028. Steht bei Durchführung 0, entfallen alle abgeleiteten Werte – probieren Sie es aus." },
        { nr: 7, ziel: "afa-1", versatz: [-2, 1], titel: "Abschreibung und Nettowert",
          text: "Die Abschreibung ist linear: (6.000 € − 0 €) / (5 Jahre × 12) = 100 € je Monat ab März. Wertberichtigung kumuliert die Abschreibungen, Nettowert = Bruttowert − Wertberichtigung. Die Abschreibungen gehen in die GuV ein (Abb. 5.80)." },
        { nr: 8, ziel: "auszahlung-1", versatz: [-2, 1], titel: "Auszahlung",
          text: "Im Anschaffungsmonat fließt der Anschaffungswert ab; die Zeile geht in die Finanzrechnung ein. Im Original hieß sie „Cash Investitionen“." },
      ],
    },
    gestaltung: {
      titel: "Gestaltung",
      intro: "Was gegenüber dem Original geändert wurde – softwareneutral im Buchstil und nach den Interaktionsprinzipien der DIN EN ISO 9241-110.",
      eintraege: [
        { nr: "A", ziel: "kopf", versatz: [-6, 8], regel: "BUCHSTIL – SOFTWARENEUTRAL", titel: "Kein Browserfenster, kein Produktname",
          text: "Browserfenster mit Adresszeile, Menü- und Symbolleisten, Produktname mit Firmenplatzhalter, Navigationsleisten und Statuszeile entfallen. Formularordner und Planjahr stehen im Untertitel." },
        { nr: "B", ziel: "band-anm", versatz: [-54, 2], regel: "STEUERBARKEIT", titel: "Fenster als Abschnitt",
          text: "„Anmerkungen der Planungseinheit“ war ein eigenes Fenster über dem Raster und verdeckte die Monate ab Juni. Jetzt ist es ein Abschnitt darunter; der Knopf „Navigation“ entfällt, die Einheit lädt bei der Auswahl." },
        { nr: "C", ziel: "nd-1", versatz: [-2, 1], regel: "SELBSTBESCHREIBUNGSFÄHIGKEIT", titel: "Einheiten und Bedeutung",
          text: "„Nutzungsdauer“ ohne Einheit heißt jetzt „Nutzungsdauer in Jahren“, „Durchführung (ja,nein)“ mit dem Wert 1 heißt „Durchführung (1 = ja)“; Werte in € stehen im Untertitel." },
        { nr: "D", ziel: "pa-anschaffung", anker: "links", versatz: [0, 1], regel: "SELBSTBESCHREIBUNGSFÄHIGKEIT", titel: "Eingabe und Anzeige unterscheidbar",
          text: "Die vier Eingabezeilen sind weiß, die sechs berechneten Zeilen grau und durch eine Linie abgesetzt. Im Original waren Eingabe- und Ergebniszeilen kaum zu unterscheiden." },
        { nr: "E", ziel: "liste", versatz: [-6, 8], regel: "AUFGABENANGEMESSENHEIT", titel: "Anmerkungen lesbar",
          text: "Titel fett, Autor mit Datum und Uhrzeit in einer Zeile, Text darunter, Trennlinien zwischen den Einträgen. Das Original zeigte englische Feldnamen („Title, Author, Date, Text“) in Schreibmaschinenschrift mit Strichlinien." },
        { nr: "F", ziel: "f-ges", anker: "links", versatz: [0, 2], regel: "BUCHSTIL – NEUTRAL UND AKTUELL", titel: "Fiktive Personen, aktuelle Daten",
          text: "„admin“ und „CC Mgr“ heißen Herr Albers (Konzerncontrolling) und Herr Roth (Kostenstellenleitung), die Einheit „GES_E1“ heißt Deutschland; 25.02.2003 wird zum 13.10.2027, FY02 zu 2028." },
        { nr: "G", ziel: "aw-3", versatz: [-2, 1], regel: "BUCHSTIL – NEUTRAL UND AKTUELL", titel: "Stimmige Werte",
          text: "Nutzungsdauer 20 ohne Einheit und Restwert 100 ergaben 295 € je Monat. Mit 5 Jahren, wie für Büromöbel üblich, und ohne Restwert sind es 100 € je Monat; Anschaffungswert 6.000 € wie im Original." },
        { nr: "H", ziel: "df-3", versatz: [-2, 1], regel: "ROBUSTHEIT GEGEN BENUTZUNGSFEHLER", titel: "Eingaben werden geprüft",
          text: "Beträge und Nutzungsdauer sind ganze Zahlen, der Restwert höchstens der Anschaffungswert, Durchführung nur 0 oder 1; Titel und Text einer Anmerkung sind Pflicht. Fehler werden rot markiert." },
      ],
    },
  });
  MK.fertig();
})();
