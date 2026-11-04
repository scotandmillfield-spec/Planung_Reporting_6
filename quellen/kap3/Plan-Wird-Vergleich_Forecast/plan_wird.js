/* Einzelvisual „Plan-Wird-Vergleich (Forecast)“ (Abb. 3.17): Erfolgsrechnung mit Ist und Forecast im Planvergleich.
   Seite 727 x 360 px = 110 x 54,5 mm. Daten: guv.json (daten_guv.py) – acht Berichtszeilen, Ist und Plan kumuliert,
   Forecast und Plan für das Gesamtjahr; derselbe Datensatz wie Abb. 3.14 (Ist-Ist) und 3.15 (Plan-Ist), gleiches Layout.
   Forecast (Wird) = Ist Januar–August + Erwartung September–Dezember (Tooltip).
   Eine Tabelle mit zwei Spaltengruppen (kumuliert, Gesamtjahr); Gesamtleistung, Gesamtkosten und Erfolg werden aus den Zeilen
   gerechnet. Abweichungen nach Wirkung gefärbt (Kosten: Anstieg ungünstig). Bewusst ohne Abweichungsbalken – die
   grafisch unterstützte Tabelle zeigt Abb. 3.16. Klick auf eine Zeile hebt sie hervor, Esc hebt auf; Klick auf einen
   Spaltenkopf sortiert Leistungs- und Kostenzeilen innerhalb ihres Blocks, die Summenzeilen bleiben stehen. */
(() => {
  "use strict";
  const { zahl, delta, NBSP, el, wirkung } = DK;
  const JAHR = DATA.jahr, EINHEIT = DATA.einheit, W = DATA.werte;
  const MONATE = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober",
                  "November", "Dezember"];
  const MON = MONATE[DATA.monat - 1];
  const BASIS = DATA.zeilen.map(([name, gruppe], i) => ({ i, name, gruppe, r: gruppe === "L" ? 1 : -1 }));
  const pz = v => (v == null ? "–" : delta(v * 100, 1, NBSP + "%"));

  /* ---------- Vergleich: zwei Spaltengruppen ---------- */
  const IST = { kurz: "IST", lang: "Ist", sz: "ist" }, FC = { kurz: "FC", lang: "Forecast", sz: "fc" };
  const BLOECKE = [
    { id: "k", titel: `Januar–${MON} ${JAHR}`, lang: `Januar–${MON}`, ref: "PL_K", ist: "IST_K", sz: IST },
    { id: "j", titel: `Gesamtjahr ${JAHR}`, lang: `Gesamtjahr (Forecast)`, ref: "PL_J", ist: "FC_J", sz: FC },
  ];
  const REF = { kurz: "PL", lang: "Plan", sz: "pl" };
  const DK_ = "ΔPL";
  const NACH = MONATE[DATA.monat] || "";                    // erster Monat der Erwartung

  /* ---------- Zustand ---------- */
  const S = { sort: null, auswahl: null };
  addEventListener("keydown", e => { if (e.key === "Escape" && S.auswahl != null) { S.auswahl = null; zeichnen(); } });

  /* ---------- Layout ---------- */
  DK.init({ titel: "Plan-Wird-Vergleich (Forecast)", breite: 727, hoehe: 360 });
  const bTab = DK.box("v-tabelle", 16, 10, 695, 342);
  DK.el("style", {}, document.head, `
    #v-tabelle .dk-matrix tr.gk-gruppe th { border-bottom: none; padding: 0 0 2px 14px; text-align: center; color: var(--text); }
    #v-tabelle .dk-matrix tr.gk-gruppe th span { display: block; border-bottom: 1px solid #9A9A9A; padding-bottom: 3px; }
    #v-tabelle .dk-matrix thead tr:last-child th { vertical-align: bottom; padding-bottom: 11px; }
    #v-tabelle .dk-matrix th.sz { position: relative; }
    #v-tabelle .dk-matrix th.sz::after { content: ""; position: absolute; left: 12px; right: 0; bottom: 3px; height: 5px; }
    #v-tabelle .dk-matrix th.sz-ist::after { background: var(--ac); }
    #v-tabelle .dk-matrix th.sz-vj::after { background: var(--py); }
    #v-tabelle .dk-matrix th.sz-pl::after { background: #FFFFFF; box-shadow: inset 0 0 0 1px var(--ac); }
    #v-tabelle .dk-matrix th.sz-fc::after { background: var(--fc); }
    #v-tabelle .dk-matrix tr.dk-summe td { height: 23px; }
    #v-tabelle .dk-matrix tr.vor-summe td { border-bottom: 1px solid var(--ac); }`);

  /* ---------- Berechnungen ---------- */
  function werte(z) {
    const v = {};
    BLOECKE.forEach(b => {
      const ref = W[b.ref][z.i], ist = W[b.ist][z.i];
      Object.assign(v, { [b.id + "_ref"]: ref, [b.id + "_ist"]: ist, [b.id + "_d"]: ist - ref, [b.id + "_dp"]: ref ? (ist - ref) / ref : null });
    });
    return v;
  }
  function summe(name, r, teile) {
    const v = {};
    BLOECKE.forEach(b => {
      const ref = teile.reduce((s, [z, f]) => s + f * z.v[b.id + "_ref"], 0);
      const ist = teile.reduce((s, [z, f]) => s + f * z.v[b.id + "_ist"], 0);
      Object.assign(v, { [b.id + "_ref"]: ref, [b.id + "_ist"]: ist, [b.id + "_d"]: ist - ref, [b.id + "_dp"]: ref ? (ist - ref) / ref : null });
    });
    return { name, r, v, summe: true };
  }
  function daten() {
    const z = BASIS.map(b => ({ ...b, v: werte(b) }));
    const L = z.filter(x => x.gruppe === "L"), K = z.filter(x => x.gruppe === "K");
    const gl = summe("Gesamtleistung", 1, L.map(x => [x, 1]));
    const gk = summe("Gesamtkosten", -1, K.map(x => [x, 1]));
    const erfolg = summe("Erfolg", 1, [[gl, 1], [gk, -1]]);
    gl.teile = L; gk.teile = K;
    return { L, K, gl, gk, erfolg };
  }
  const effekt = (z, key) => z.v[key] * z.r;               // Wirkung auf den Erfolg (Kostenanstieg negativ)
  function geordnet(rows) {
    const s = S.sort;
    if (!s) return rows;
    const eff = /_dp?$/.test(s.key);
    return rows.slice().sort((a, b) => {
      const va = eff ? effekt(a, s.key) : a.v[s.key], vb = eff ? effekt(b, s.key) : b.v[s.key];
      const c = (va ?? -Infinity) - (vb ?? -Infinity);
      return (s.ab ? -c : c) || a.i - b.i;
    });
  }
  function sortieren(key) {
    if (key === "zeile") S.sort = null;                      // Klick auf „Berichtszeile“: Reihenfolge des Schemas
    else if (S.sort && S.sort.key === key) S.sort = { key, ab: !S.sort.ab };
    else S.sort = { key, ab: !/_dp?$/.test(key) };            // Werte absteigend, Abweichungen: ungünstigste zuerst
    zeichnen();
  }

  const SPALTEN = [{ key: "zeile", id: "sp-zeile", titel: "Berichtszeile", breite: 168 }];
  BLOECKE.forEach(b => SPALTEN.push(
    { key: b.id + "_ref", id: `sp-${b.id}-ref`, titel: REF.kurz, breite: 58, fmt: v => zahl(v, 0), sz: REF.sz },
    { key: b.id + "_ist", id: `sp-${b.id}-ist`, titel: b.sz.kurz, breite: 58, fmt: v => zahl(v, 0), sz: b.sz.sz },
    { key: b.id + "_d", id: `sp-${b.id}-d`, titel: DK_, breite: 58, fmt: v => delta(v, 0), farbe: true },
    { key: b.id + "_dp", id: `sp-${b.id}-dp`, titel: DK_ + " %", breite: 82, fmt: pz, farbe: true }));

  /* ---------- Tooltip (DK.tooltip ist nicht exportiert; auch für Summenzeilen) ---------- */
  const tip = document.querySelector(".dk-tooltip");
  function tipp(ziel, zeilenFn) {
    ziel.addEventListener("pointermove", ev => {
      tip.textContent = "";
      zeilenFn().forEach((z, i) => el(i === 0 ? "b" : "div", {}, tip, z));
      tip.style.display = "block";
      const r = tip.getBoundingClientRect();
      let x = ev.clientX + 14, y = ev.clientY + 14;
      if (x + r.width > innerWidth - 8) x = ev.clientX - r.width - 14;
      if (y + r.height > innerHeight - 8) y = ev.clientY - r.height - 14;
      tip.style.left = x + "px"; tip.style.top = y + "px";
    });
    ziel.addEventListener("pointerleave", () => { tip.style.display = "none"; });
  }
  const WTEXT = { gut: "günstig", schlecht: "ungünstig", neutral: "unverändert" };
  function tooltipZeile(z, d) {
    const t = [z.name];
    BLOECKE.forEach(b => {
      const v = z.v, w = wirkung(v[b.id + "_d"], z.r, 0);
      t.push(`${b.titel}: ${b.sz.lang} ${zahl(v[b.id + "_ist"], 0)} · ${REF.lang} ${zahl(v[b.id + "_ref"], 0)} ${EINHEIT}`);
      t.push(`${DK_} ${delta(v[b.id + "_d"], 0)} (${pz(v[b.id + "_dp"])}) – ${WTEXT[w]}`);
      if (b.ist === "FC_J") t.push(`Forecast = Ist Januar–${MON} ${zahl(v.k_ist, 0)} + Erwartung ${NACH}–Dezember ${zahl(v.j_ist - v.k_ist, 0)}`);
    });
    const kb = BLOECKE[BLOECKE.length - 1].id + "_ist";
    if (z.summe && z.teile) t.push(`Summe aus ${z.teile.length} Zeilen`);
    else if (z.name === "Erfolg") t.push(`Gesamtleistung − Gesamtkosten; Umsatzrendite ${BLOECKE[BLOECKE.length - 1].lang}: ${zahl(z.v[kb] / d.L[0].v[kb] * 100, 1)}${NBSP}%`);
    else {
      const ges = z.gruppe === "L" ? d.gl : d.gk;
      t.push(`Anteil ${z.gruppe === "L" ? "an der Gesamtleistung" : "an den Gesamtkosten"} ${BLOECKE[BLOECKE.length - 1].lang}: ${zahl(z.v[kb] / ges.v[kb] * 100, 1)}${NBSP}%`);
    }
    if (z.r < 0 && !z.summe) t.push("Kosten: Anstieg ungünstig, Rückgang günstig");
    t.push(z.summe ? "Summenzeile – bleibt beim Sortieren stehen" : "Klick hebt die Zeile hervor, Spaltenkopf sortiert");
    return t;
  }

  /* ---------- Kernaussage ---------- */
  function botschaft(d, breite) {
    const e = d.erfolg.v;
    const anfang = `Erfolg ${JAHR} laut Forecast ${zahl(e.j_ist, 0)} statt ${zahl(e.j_ref, 0)} ${EINHEIT} (${delta(e.j_d, 0)})`;
    const lang = `${anfang} – Gesamtkosten ${delta(d.gk.v.j_d, 0)}, Gesamtleistung ${delta(d.gl.v.j_d, 0)} zum Plan`;
    const mittel = `${anfang}, bis ${MON} ${delta(e.k_d, 0)}`;
    return [lang, mittel, anfang].find(t => DK.tw(t) <= breite) || anfang;
  }

  /* ---------- Zeichnen ---------- */
  function zeichnen() {
    const d = daten();
    const v = DK.visual(bTab, { titel: "Erfolgsrechnung: Ist und Forecast im Planvergleich", einheit: EINHEIT,
      botschaft: botschaft(d, bTab.clientWidth || 695) });
    const reihe = [...geordnet(d.L), d.gl, ...geordnet(d.K), d.gk, d.erfolg];
    const zeilen = reihe.map(z => ({ key: z.name, label: z.name, z, summe: !!z.summe, werte: z.v }));
    const t = DK.matrix(v.flaeche, { spalten: SPALTEN, zeilen, zeilenhoehe: 22, sortierung: S.sort, onSort: sortieren,
      auswahl: S.auswahl, onClick: k => { S.auswahl = S.auswahl === k ? null : k; zeichnen(); },
      tooltip: zr => tooltipZeile(zr.z, d) });
    // Spaltengruppen (Zeiträume) über den Spaltenköpfen
    const kopf = t.querySelector("thead"), gr = el("tr", { class: "gk-gruppe" });
    el("th", {}, gr, "");
    BLOECKE.forEach(b => el("span", {}, el("th", { colspan: 4, id: "gr-" + b.id }, gr), b.titel));
    kopf.insertBefore(gr, kopf.firstChild);
    // Szenario-Marken unter den Spaltenköpfen
    const ths = kopf.lastChild.querySelectorAll("th");
    SPALTEN.forEach((s, j) => { if (s.sz) ths[j].classList.add("sz", "sz-" + s.sz); });
    // Abweichungen nach Wirkung färben; Tooltip auch auf den Summenzeilen
    t.querySelectorAll("tbody tr").forEach((tr, i) => {
      const z = reihe[i];
      SPALTEN.forEach((s, j) => {
        if (!s.farbe) return;
        const w = wirkung(z.v[s.key.replace(/_dp$/, "_d")], z.r, 0);
        if (w !== "neutral") tr.children[j].style.color = DK.FARBE[w];
      });
      if (z.summe) {
        tipp(tr, () => tooltipZeile(z, d));
        // Linie über der Summe an der Vorzeile setzen (im border-collapse gewinnt die obere Zelle)
        if (tr.previousElementSibling) tr.previousElementSibling.classList.add("vor-summe");
      }
    });
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  /* ---------- Lernplattform: Designregeln, Nachbau, Tabellen, CSV ---------- */
  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "v-tabelle", anker: "links", versatz: [698, 23], regel: "SAY – Botschaft vermitteln", titel: "Kernaussage über der Tabelle",
        text: "Unter dem Titel steht, welchen Erfolg der Forecast für das Gesamtjahr erwartet, wie weit er vom Plan abweicht und ob Kosten oder Leistung die Abweichung treiben. Das Original zeigte die Tabelle ohne Titel, Einheit und Aussage." },
      { nr: 2, ziel: "sp-j-ist", versatz: [23, 15], regel: "UNIFY – Semantische Notation", titel: "Forecast grau, Plan weiß",
        text: "Marken unter den Spaltenköpfen kennzeichnen die Szenarien: Plan weiß mit Rahmen, Ist anthrazit, Forecast (Wird) mittelgrau – wie in Abb. 3.14 bis 3.18. Der Forecast ist das Ist Januar–August plus die Erwartung für September–Dezember (Tooltip). Im Original hießen die Spalten „Forecast“ und „Plan ges.“ ohne Kennzeichnung." },
      { nr: 3, ziel: "sp-k-d", anker: "links", versatz: [34, 186], regel: "UNIFY – Farbe nach Wirkung", titel: "Rot heißt ungünstig, nicht negativ",
        text: "Blaugrün markiert günstige, Rot ungünstige Abweichungen; bei Kosten ist ein Überschreiten des Plans ungünstig. Das Original färbte nach dem Vorzeichen: Personal- und Gesamtkosten über Plan standen schwarz, eingesparte Fremdleistungen rot." },
      { nr: 4, ziel: "gr-j", anker: "links", versatz: [59, 0], regel: "CONDENSE – Bisher und erwartet", titel: "Ist bis August neben dem Jahr",
        text: "Links steht der bisherige Planvergleich, rechts der erwartete für das Gesamtjahr. So wird sichtbar, ob die Lücke aufgeholt wird: Der Erfolg liegt bis August 150 unter Plan, für das Jahr erwartet der Forecast noch 30." },
      { nr: 5, ziel: "v-tabelle", anker: "links", versatz: [142, 301], regel: "CHECK – Visuelle Integrität", titel: "Dieselben Werte wie Abb. 3.15",
        text: "Ist und Plan Januar–August sind dieselben wie im Plan-Ist-Vergleich (Abb. 3.15). Im Original standen hier als Plan bei Umsatzerlösen und Gesamtleistung die Vorjahreswerte aus Abb. 3.14 (900 und 1.550), der Plan-Erfolg lag deshalb bei 250 statt 350." },
      { nr: 6, ziel: "sp-k-dp", anker: "links", versatz: [34, 1], regel: "SIMPLIFY – Einheitliche Zahlen", titel: "Ein Format je Spalte",
        text: "Werte ohne Nachkommastelle, Abweichungen mit Vorzeichen und echtem Minus, „±0“ für Planerfüllung, Prozente mit einer Nachkommastelle und Leerzeichen. Die Einheit steht einmal im Titel – im Original fehlte sie und wurde als Mio. € ergänzt." },
      { nr: 7, ziel: "sp-zeile", anker: "links", versatz: [114, 1], regel: "STRUCTURE – Schema bleibt", titel: "Sortieren innerhalb der Blöcke",
        text: "Die Zeilen folgen dem Schema der Erfolgsrechnung, die Spaltengruppen der Zeit. Ein Klick auf einen Spaltenkopf sortiert Leistungs- und Kostenzeilen jeweils in ihrem Block – Abweichungen mit der ungünstigsten zuerst –, die Summenzeilen bleiben stehen. Ein Klick auf „Berichtszeile“ stellt das Schema wieder her." },
      { nr: 8, ziel: "v-tabelle", anker: "links", versatz: [482, 2], regel: "EXPRESS – Passende Darstellung", titel: "Tabelle für den Vergleich",
        text: "Für elf Zeilen und zwei Zeiträume ist die Tabelle die genaueste Form; der Tooltip zerlegt den Forecast in Ist und Erwartung. Wie Abweichungsbalken die Tabelle grafisch unterstützen, zeigt Abb. 3.16." },
    ],
    nachbauIntro: "Standard-Visuals von Power BI Desktop. Seitengröße benutzerdefiniert 727 × 360 px. Schrift Arial: Tabelle 10,5 pt, Visualtitel 12 pt. Das Berichtsdesign (JSON) setzt Farben und Schriften. Datenmodell: Faktentabelle GuV (Berichtszeile, Gruppe, Vorzeichen, Szenario, Zeitraum, Jahr, Wert) wie in der CSV-Datei; Dimension Berichtszeile mit Sortierschlüssel. Aufbau wie Abb. 3.14 und 3.15.",
    nachbau: [
      { id: "A", ziel: "v-tabelle", versatz: [0, 0], titel: "Erfolgsrechnung: Ist und Forecast im Planvergleich", visual: "Matrix",
        felder: "Zeilen: Gruppe (Gesamtleistung, Gesamtkosten) > Berichtszeile; Spalten: Zeitraum (kumuliert, Gesamtjahr); Werte: PL = CALCULATE(SUM(GuV[Wert]); GuV[Szenario] = \"Plan\"), IST/FC = CALCULATE(SUM(GuV[Wert]); GuV[Szenario] IN {\"Ist\"; \"Forecast\"}), ΔPL = [IST/FC] − [PL], ΔPL % = DIVIDE([ΔPL]; [PL])",
        format: "Ohne Dezimalstellen, ΔPL % mit einer; Zeilenzwischensummen unten, Gesamtsumme beschriftet „Erfolg“; Schriftfarbe ΔPL und ΔPL % bedingt nach dem Measure Wirkung = SIGN([ΔPL]) × MAX(GuV[Vorzeichen]): 1 → #00806B, −1 → #C62828; Spaltenkopf mit Unterstrich #3A3F44, Zeilenraster #EFEFEF",
        hinweis: "Im Datenmodell steht beim Zeitraum Gesamtjahr nur der Forecast, beim Zeitraum kumuliert nur das Ist – so liefert ein Measure beide Spalten. Ohne eigene Forecast-Daten: FC = Ist kumuliert + Plan der Restmonate (CALCULATE mit DATESBETWEEN). Erfolg auf Gesamtebene vorzeichenrichtig rechnen (ISINSCOPE, SUMX × Vorzeichen)." },
      { id: "B", ziel: "v-tabelle", anker: "links", versatz: [698, 23], titel: "Kernaussage", visual: "Textfeld mit dynamischem Wert",
        felder: "Text-Measure aus [FC] und [PL] des Erfolgs im Gesamtjahr sowie [ΔPL] von Gesamtkosten und Gesamtleistung",
        format: "10,5 pt, #4D4D4D" },
    ],
    theme: DK.thema(),
    csv: { name: "erfolgsrechnung_forecast_daten.csv", text: () => {
      const k = ["Berichtszeile;Gruppe;Vorzeichen;Szenario;Zeitraum;Jahr;Wert_Mio_EUR"];
      const ZR = { K: `kumuliert Januar–${MON}`, J: "Gesamtjahr" }, SZ = { IST: "Ist", PL: "Plan", FC: "Forecast" };
      BASIS.forEach(z => Object.keys(W).forEach(key => {
        const [sz, zr] = key.split("_");
        k.push([z.name, z.gruppe === "L" ? "Leistung" : "Kosten", z.r, SZ[sz], ZR[zr], sz === "VJ" ? JAHR - 1 : JAHR, W[key][z.i]].join(";"));
      }));
      return k.join("\r\n"); } },
    tabellen: () => {
      const d = daten(), reihe = [...geordnet(d.L), d.gl, ...geordnet(d.K), d.gk, d.erfolg];
      return [{ titel: `Erfolgsrechnung: Ist und Forecast im Planvergleich (${EINHEIT})`,
        kopf: ["Berichtszeile", ...BLOECKE.flatMap(b => [`${REF.kurz} ${b.titel}`, `${b.sz.kurz} ${b.titel}`, DK_, DK_ + " %"])],
        zeilen: reihe.map(z => [z.name, ...BLOECKE.flatMap(b => [zahl(z.v[b.id + "_ref"], 0), zahl(z.v[b.id + "_ist"], 0),
          delta(z.v[b.id + "_d"], 0), pz(z.v[b.id + "_dp"])])]) }];
    },
  });
  zeichnen();
})();
