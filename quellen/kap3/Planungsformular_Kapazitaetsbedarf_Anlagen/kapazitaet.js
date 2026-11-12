/* Abb. 3.191 „Planungsformular Kapazitätsbedarf Anlagen“ – Logik des Reiters „Kapazitätsbedarf Anlagen“.
   Je Periode: Kapazitätsbedarf aus der Absatzplanung (Anzeige, in Std.), Korrektur in %
   (Rationalisierungsvorgabe negativ, Aufschlag für technisches Risiko/Ausschuss positiv) und Mehrbedarf für
   Neuanläufe in Std. (Eingaben). Bedarf korrigiert = Bedarf × (1 + Korrektur) + Mehrbedarf, auf 0,1 Std. gerundet.
   Kapazitätsangebot der Anlage (Anzeige, aus der Angebotsplanung) und Abweichung = Angebot − Bedarf korrigiert
   in Std. und in % des Angebots; negative Abweichung = Engpass (fett). Die Ergebniszeile summiert die gerundeten Zeilen,
   die Korrektur als gewichteter Durchschnitt.
   Zusammenhang: Abb. 3.188 „Abstimmung der Personalplanung“ (Kapazitätsabgleich je Kostenstelle und Monat).
   Werte des Originals (Arbeitsplatz 51210): Bedarf der Perioden 2–12 unverändert (130,458 … 76,341 Std.); Januar ergänzt.
   Korrektur und Mehrbedarf waren 0 – hier Beispielwerte (−3,0 %, Neuanlauf ab Oktober 24/32/16 Std.).
   Weitere Werke, Kostenstellen und Arbeitsplätze sind Beispiele: Bedarf und Angebot mit Faktoren aus 51210 abgeleitet. */
(() => {
  "use strict";
  const { el, zahl, pruefeFeld } = MK;
  MK.init({ titel: "Planungsformular Kapazitätsbedarf Anlagen" });
  const $ = id => document.getElementById(id);
  const MINUS = MK.MINUS;

  /* ---------- Stammdaten ---------- */
  const MONATE = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
  // Kapazitätsbedarf aus der Absatzplanung (Std.) und Kapazitätsangebot (Std.) für Arbeitsplatz 51210, Perioden 1–12
  const BEDARF = [118.732, 130.458, 143.512, 127.217, 120.858, 127.217, 146.297, 38.172, 139.944, 139.944, 133.563, 76.341];
  const ANGEBOT = [144, 136, 152, 136, 128, 144, 152, 40, 144, 144, 144, 104];
  // Werk → Kostenstellen → Arbeitsplätze [Nummer, Name, Faktor Bedarf, Faktor Angebot]
  const WERKE = [
    ["4010", "4010 Werk Nord", [
      ["4-4651", "4-4651 Zuschneiden", [["51210", "Pkw-Stanzen", 1, 1], ["51220", "Lkw-Stanzen", 0.62, 0.75]]],
      ["4-4652", "4-4652 Umformen", [["52110", "Presse 1", 1.12, 1.05], ["52120", "Presse 2", 0.85, 1]]],
      ["4-4653", "4-4653 Schweißen", [["53110", "Schweißroboter 1", 0.94, 0.9], ["53120", "Schweißroboter 2", 0.71, 0.9]]]]],
    ["4020", "4020 Werk Süd", [
      ["4-4751", "4-4751 Zuschneiden", [["61210", "Laserschneiden", 0.8, 0.85], ["61220", "Plasmaschneiden", 0.55, 0.7]]],
      ["4-4752", "4-4752 Montage", [["62110", "Montagelinie 1", 1.25, 1.2], ["62120", "Montagelinie 2", 0.9, 1.1]]]]],
  ];
  // Eingaben je Arbeitsplatz (Korrektur %, Mehrbedarf Std.); Neuanlauf nur bei 51210
  const STAND = {};
  WERKE.forEach(w => w[2].forEach(k => k[2].forEach(([ap]) => {
    STAND[ap] = { korr: MONATE.map(() => -3), mehr: MONATE.map((_, i) => (ap === "51210" ? [0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 32, 16][i] : 0)) };
  })));

  /* ---------- Auswahlfelder ---------- */
  const fuelle = (sel, liste, wert) => { sel.textContent = ""; liste.forEach(([v, t]) => el("option", v === wert ? { value: v, selected: "" } : { value: v }, sel, t)); };
  const werk = () => WERKE.find(w => w[0] === $("f-werk").value);
  const kst = () => werk()[2].find(k => k[0] === $("f-kst").value);
  const ap = () => kst()[2].find(a => a[0] === $("f-ap").value);
  fuelle($("f-werk"), WERKE.map(w => [w[0], w[1]]), "4010");
  function kstFuellen(wert) { fuelle($("f-kst"), werk()[2].map(k => [k[0], k[1]]), wert || werk()[2][0][0]); }
  function apFuellen(wert) { fuelle($("f-ap"), kst()[2].map(a => [a[0], a[0] + " " + a[1]]), wert || kst()[2][0][0]); }
  kstFuellen("4-4651");
  apFuellen("51210");

  /* ---------- Raster ---------- */
  const mx = $("mx");
  const PR_KORR = { min: -50, max: 50, meldung: "Korrektur in % von −50 bis +50 mit Dezimalkomma, z. B. −3,0" };
  const PR_MEHR = { min: 0, max: 999.9, meldung: "Mehrbedarf in Std. ab 0 mit Dezimalkomma, z. B. 24,0" };
  const wert = f => { const v = MK.leseZahl(f.value); return v == null ? 0 : isNaN(v) || f.classList.contains("mk-fehler") ? null : v; };
  const zeilen = MONATE.map((name, i) => {
    const pp = String(i + 1).padStart(2, "0"), z = el("div", { class: "mx-zeile", id: "z" + pp, role: "row" }, mx);
    el("div", { class: "mx-l", id: "p" + pp }, z, `${pp} ${name}`);
    const r = { i };
    r.bedarfEl = el("div", { class: "mk-feld mk-anzeige mk-zahl", id: "b" + pp }, z);
    r.korr = el("input", { class: "mk-feld mk-zahl trenn", id: "k" + pp, inputmode: "decimal",
      "aria-label": `Korrektur in %, ${name}`, "data-hilfe": "Rationalisierungsvorgabe negativ, Aufschlag für technisches Risiko oder Ausschuss positiv",
      title: "Rationalisierungsvorgabe negativ, Aufschlag für technisches Risiko oder Ausschuss positiv" }, z);
    r.mehr = el("input", { class: "mk-feld mk-zahl", id: "m" + pp, inputmode: "decimal",
      "aria-label": `Mehrbedarf in Std., ${name}`, "data-hilfe": "Zusätzliche Stunden für Neuanläufe in dieser Periode",
      title: "Zusätzliche Stunden für Neuanläufe in dieser Periode" }, z);
    r.ergebnis = el("div", { class: "mk-feld mk-anzeige mk-zahl", id: "e" + pp }, z);
    r.angebotEl = el("div", { class: "mk-feld mk-anzeige mk-zahl trenn", id: "a" + pp }, z);
    r.abw = el("div", { class: "mk-feld mk-anzeige mk-zahl", id: "d" + pp }, z);
    r.abwp = el("div", { class: "mk-feld mk-anzeige mk-zahl", id: "dp" + pp }, z);
    r.korr.addEventListener("input", () => { pruefeFeld(r.korr, "zahl", PR_KORR); const v = wert(r.korr); if (v != null) STAND[ap()[0]].korr[i] = v; rechnen(); });
    r.mehr.addEventListener("input", () => { pruefeFeld(r.mehr, "zahl", PR_MEHR); const v = wert(r.mehr); if (v != null) STAND[ap()[0]].mehr[i] = v; rechnen(); });
    [r.korr, r.mehr].forEach(f => f.addEventListener("blur", () => { const v = wert(f); if (v != null) f.value = zahl(v, 1); }));
    return r;
  });
  const ez = el("div", { class: "mx-zeile ergebnis", id: "z-ergebnis", role: "row" }, mx);
  el("div", { class: "mx-l", id: "l-ergebnis" }, ez, "Ergebnis");
  const eBedarf = el("div", { class: "mk-feld mk-anzeige mk-zahl", id: "s-bedarf" }, ez);
  const eKorr = el("div", { class: "mk-feld mk-anzeige mk-zahl trenn", id: "s-korr" }, ez);
  const eMehr = el("div", { class: "mk-feld mk-anzeige mk-zahl", id: "s-mehr" }, ez);
  const eKorrigiert = el("div", { class: "mk-feld mk-anzeige mk-zahl", id: "s-korrigiert" }, ez);
  const eAngebot = el("div", { class: "mk-feld mk-anzeige mk-zahl trenn", id: "s-angebot" }, ez);
  const eAbw = el("div", { class: "mk-feld mk-anzeige mk-zahl", id: "s-abw" }, ez);
  const eAbwp = el("div", { class: "mk-feld mk-anzeige mk-zahl", id: "s-abwp" }, ez);

  /* ---------- Rechnen ---------- */
  const runde1 = x => Math.round(x * 10) / 10;
  const vz = (v, nk = 1) => (Math.abs(v) < 0.05 ? String.fromCharCode(0xB1) + zahl(0, nk) : (v > 0 ? "+" : "") + zahl(v, nk));
  let BED = [], ANG = [];
  function laden() {
    const [nr, name, fb, fa] = ap();
    BED = BEDARF.map(b => Math.round(b * fb * 1000) / 1000);
    ANG = ANGEBOT.map(a => runde1(a * fa));
    $("g-ap").textContent = nr + " " + name;
    zeilen.forEach(r => {
      r.bedarfEl.textContent = zahl(BED[r.i], 1);
      r.bedarfEl.title = `${zahl(BED[r.i], 3)} Std. laut Absatzplanung`;
      r.angebotEl.textContent = zahl(ANG[r.i], 1);
      r.angebotEl.title = "Kapazitätsangebot der Anlage laut Angebotsplanung";
      [r.korr, r.mehr].forEach(f => { f.classList.remove("mk-fehler"); f.title = f.dataset.hilfe; });
      r.korr.value = zahl(STAND[nr].korr[r.i], 1);
      r.mehr.value = zahl(STAND[nr].mehr[r.i], 1);
    });
    rechnen();
  }
  function rechnen() {
    let sB = 0, sBK = 0, sM = 0, sE = 0, sA = 0, ok = true;
    zeilen.forEach(r => {
      const b = BED[r.i], a = ANG[r.i], k = wert(r.korr), m = wert(r.mehr);
      sB += b; sA += a;
      if (k == null || m == null) { [r.ergebnis, r.abw, r.abwp].forEach(e => { e.textContent = "–"; e.classList.remove("engpass"); }); ok = false; return; }
      const e = runde1(b * (1 + k / 100) + m), d = runde1(a - e);
      r.ergebnis.textContent = zahl(e, 1);
      r.ergebnis.title = `${zahl(b, 1)} × (1 ${k < 0 ? MINUS : "+"} ${zahl(Math.abs(k), 1)} %) + ${zahl(m, 1)} = ${zahl(e, 1)} Std.`;
      r.abw.textContent = vz(d);
      r.abwp.textContent = a > 0 ? vz(d / a * 100) : "–";
      [r.abw, r.abwp].forEach(x => { x.classList.toggle("engpass", d < 0); x.title = d < 0 ? "Engpass: Bedarf über dem Angebot" : "Freie Kapazität"; });
      sBK += b * (1 + k / 100); sM += m; sE += e;
    });
    eBedarf.textContent = zahl(sB, 1);
    eKorr.textContent = ok ? vz((sBK / sB - 1) * 100) : "–";
    eKorr.title = "Korrektur gewichtet mit dem Kapazitätsbedarf der Perioden";
    eMehr.textContent = ok ? zahl(sM, 1) : "–";
    eKorrigiert.textContent = ok ? zahl(sE, 1) : "–";
    eAngebot.textContent = zahl(sA, 1);
    const sD = runde1(sA - sE);
    eAbw.textContent = ok ? vz(sD) : "–";
    eAbwp.textContent = ok ? vz(sD / sA * 100) : "–";
  }

  /* ---------- Auswahl, Aktionen ---------- */
  $("f-werk").addEventListener("change", () => { kstFuellen(); apFuellen(); laden(); });
  $("f-kst").addEventListener("change", () => { apFuellen(); laden(); });
  $("f-ap").addEventListener("change", laden);
  $("k-aktualisieren").addEventListener("click", () => { rechnen(); MK.meldung("Kapazitätsbedarf und Abweichungen neu berechnet."); });
  $("k-sichern").addEventListener("click", () => MK.meldung("Beispielmaske: Die Planwerte werden nicht gespeichert."));
  $("k-beenden").addEventListener("click", () => MK.meldung("Beispielmaske: Beenden ist ohne Funktion."));
  laden();
  // Werte der Ausgangslage für die Erläuterungen
  const T = id => $(id).textContent;
  const engpaesse = zeilen.filter(r => r.abw.classList.contains("engpass")).map(r => MONATE[r.i]);

  /* ---------- Lernplattform: Erläuterungen und Gestaltung ---------- */
  MK.ebenen({
    erlaeuterungen: {
      titel: "Erläuterungen",
      intro: "Was die Bereiche des Planungsformulars in der Kapazitätsplanung leisten. Die Nummern in der Maske zeigen, wo.",
      eintraege: [
        { nr: 1, ziel: "kopf-auswahl", anker: "links", versatz: [270, 0], titel: "Bedarf und Angebot abgleichen",
          text: "Geplant wird der Kapazitätsbedarf der Anlagen; daneben steht das Kapazitätsangebot aus der Angebotsplanung. Erst der Abgleich von Bedarf und Angebot je Arbeitsplatz und Monat zeigt Engpässe oder Leerkapazitäten." },
        { nr: 2, ziel: "f-kst", versatz: [14, 0], titel: "Planungsobjekt",
          text: "Geplant wird je Werk, Kostenstelle und Arbeitsplatz mit der Leistungsart Maschinenstunden fix. Wählen Sie ein anderes Werk, eine andere Kostenstelle oder einen anderen Arbeitsplatz: Bedarf, Angebot und Abweichung wechseln mit." },
        { nr: 3, ziel: "h-bedarf", anker: "links", versatz: [0, 0], titel: "Bedarf aus der Absatzplanung",
          text: "Der Kapazitätsbedarf folgt aus der Absatz- und Produktionsplanung: geplante Stückzahlen mal Vorgabezeiten der Arbeitspläne, je Kostenstelle, Arbeitsplatz, Leistungsart und Periode. Er ist eine Anzeige; im August sinkt er mit dem Betriebsurlaub." },
        { nr: 4, ziel: "k01", anker: "links", versatz: [30, 1], titel: "Korrektur in %",
          text: "Eine Rationalisierungsvorgabe senkt den Bedarf (negativ), ein Aufschlag für technisches Risiko oder Ausschuss erhöht ihn (positiv). Hier gilt eine Vorgabe von −3,0 % in allen Perioden." },
        { nr: 5, ziel: "m10", versatz: [-70, 1], titel: "Mehrbedarf für Neuanläufe",
          text: "Neuanläufe brauchen zusätzliche Stunden, die in den Arbeitsplänen noch nicht stehen – etwa für Einrichten und Anlaufverluste. Sie werden auf Monatsebene erfasst, hier für einen Serienanlauf ab Oktober." },
        { nr: 6, ziel: "h-korrigiert", versatz: [-50, 0], titel: "Bedarf korrigiert",
          text: "Kapazitätsbedarf × (1 + Korrektur) + Mehrbedarf, je Periode auf 0,1 Std. gerundet. Dieser Bedarf wird mit dem Angebot abgeglichen; aus der Differenz folgen Maßnahmen wie Zusatzschichten, Fremdvergabe oder Personalanpassung (FTE)." },
        { nr: 7, ziel: "d01", anker: "links", versatz: [30, 1], titel: "Abweichung: Engpass oder freie Kapazität",
          text: `Abweichung = Angebot − Bedarf korrigiert, in Std. und in % des Angebots. Negative Werte (fett) sind Engpässe – hier durch den Neuanlauf ${engpaesse.length ? "im " + engpaesse.join(" und ") : "nicht"}; positive Werte sind freie Kapazität, die sich für andere Aufträge nutzen ließe.` },
        { nr: 8, ziel: "l-ergebnis", versatz: [-4, 3], titel: "Ergebnis für das Jahr",
          text: `Die Ergebniszeile summiert Bedarf, Mehrbedarf, korrigierten Bedarf und Angebot; die Korrektur steht als mit dem Bedarf gewichteter Durchschnitt. ${T("s-bedarf")} Std. aus der Absatzplanung werden zu ${T("s-korrigiert")} Std.; über das Jahr bleibt eine Abweichung von ${T("s-abw")} Std. Erst der Monatsblick zeigt die Engpässe.` },
      ],
    },
    gestaltung: {
      titel: "Gestaltung",
      intro: "Was gegenüber dem Original geändert wurde – softwareneutral im Buchstil und nach den Interaktionsprinzipien der DIN EN ISO 9241-110.",
      eintraege: [
        { nr: "A", ziel: "kopf-titel", anker: "links", versatz: [238, 2], regel: "BUCHSTIL – SOFTWARENEUTRAL", titel: "Ohne Rahmen und Symbole",
          text: "Fensterrahmen, Symbole für die Werthilfe neben jedem Feld und die Knopfleiste über den Reitern entfallen. Der Titel „Kapazitätsplanung“ bleibt; die Titelzeile nennt Geschäftsjahr, Perioden und die Einheit." },
        { nr: "B", ziel: "gruppe", anker: "links", versatz: [500, 2], regel: "AUFGABENANGEMESSENHEIT", titel: "Gruppenkopf statt Leerspalten",
          text: "Arbeitsplatz und Leistungsart stehen einmal im Gruppenkopf, die Kostenstelle in der Auswahl. Im Original waren es vier Spalten, die nur in der ersten Zeile gefüllt waren und das Raster auf die volle Bildschirmbreite zogen." },
        { nr: "C", ziel: "a01", anker: "links", versatz: [30, 1], regel: "AUFGABENANGEMESSENHEIT", titel: "Angebot und Abweichung im Formular",
          text: "Das Kapazitätsangebot und die Abweichung stehen direkt neben dem Bedarf, statt auf einem eigenen Reiter. Engpässe sind fett und mit Minus gekennzeichnet – auch im Graustufendruck erkennbar." },
        { nr: "D", ziel: "b02", anker: "links", versatz: [6, 1], regel: "ERWARTUNGSKONFORMITÄT", titel: "Sinnvolle Genauigkeit, ganzes Jahr",
          text: "Stunden mit einer Nachkommastelle (130,458 → 130,5; genauer Wert im Tooltip), Prozent mit einer statt zwei; zur Periodennummer steht der Monat. Die Monatsreihe beginnt mit Januar; das Original begann mit Periode 2." },
        { nr: "E", ziel: "s-korr", anker: "links", versatz: [30, 3], regel: "SELBSTBESCHREIBUNGSFÄHIGKEIT", titel: "Spaltenköpfe und Ergebnis",
          text: "„Kapa.-Bedarf Korr. %“ heißt Korrektur in %, „Kapa.-Mehrbedarf“ Mehrbedarf Neuanlauf, „Kapa.Bedarf n.R.u.M.“ Bedarf korrigiert. Die Ergebniszeile zeigt die gewichtete Korrektur statt einer Summe von Prozentsätzen; die gelbe Hinterlegung entfällt." },
        { nr: "F", ziel: "m02", versatz: [-70, 1], regel: "ROBUSTHEIT GEGEN BENUTZUNGSFEHLER", titel: "Eingaben werden geprüft",
          text: "Korrekturen von −50 bis +50 % und Mehrbedarf ab 0 Std.; ungültige Eingaben werden rot markiert und nicht gerechnet. Im Tooltip des Ergebnisfelds steht die Rechnung der Zeile." },
        { nr: "G", ziel: "f-ap", versatz: [-30, 0], regel: "BUCHSTIL – NEUTRAL UND AKTUELL", titel: "Neutrale Namen, Beispielwerte",
          text: "„MOST Zuschneiden“ und „PKW STANZEN MOST“ heißen Zuschneiden und Pkw-Stanzen; weitere Werke, Kostenstellen und Arbeitsplätze sind Beispiele. Korrektur und Mehrbedarf waren im Original 0; die Beispielwerte machen die Rechnung sichtbar." },
        { nr: "H", ziel: "aktionen", anker: "links", versatz: [338, 6], regel: "STEUERBARKEIT", titel: "Aktionen am Ende",
          text: "Sichern, Beenden und Aktualisieren stehen unten rechts, Sichern als einzige Hauptaktion dunkel; im Original standen sie oben über den Reitern." },
      ],
    },
  });
  MK.fertig();
})();
