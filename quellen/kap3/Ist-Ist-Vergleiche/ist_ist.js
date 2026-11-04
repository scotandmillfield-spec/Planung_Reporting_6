/* Einzelvisual „Ist-Ist-Vergleiche“ (Abb. 3.14): Erfolgsrechnung im Vorjahresvergleich.
   Seite 727 x 360 px = 110 x 54,5 mm. Daten: guv.json (daten_guv.py) – acht Berichtszeilen, Ist und Vorjahr für den
   Berichtsmonat und kumuliert; derselbe Datensatz wie Abb. 3.15 (Plan-Ist) und 3.17 (Plan-Wird).
   Eine Tabelle mit zwei Spaltengruppen (Monat, kumuliert); Gesamtleistung, Gesamtkosten und Erfolg werden aus den Zeilen
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
  const BLOECKE = [
    { id: "m", titel: `${MON} ${JAHR}`, lang: `im ${MON}`, ref: "VJ_M", ist: "IST_M" },
    { id: "k", titel: `Januar–${MON} ${JAHR}`, lang: `Januar–${MON}`, ref: "VJ_K", ist: "IST_K" },
  ];
  const REF = { kurz: "VJ", lang: "Vorjahr", sz: "vj" }, IST = { kurz: "IST", lang: "Ist", sz: "ist" };
  const DK_ = "ΔVJ";

  /* ---------- Zustand ---------- */
  const S = { sort: null, auswahl: null };
  addEventListener("keydown", e => { if (e.key === "Escape" && S.auswahl != null) { S.auswahl = null; zeichnen(); } });

  /* ---------- Layout ---------- */
  DK.init({ titel: "Ist-Ist-Vergleiche", breite: 727, hoehe: 360 });
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
    { key: b.id + "_ist", id: `sp-${b.id}-ist`, titel: IST.kurz, breite: 58, fmt: v => zahl(v, 0), sz: IST.sz },
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
      t.push(`${b.titel}: ${IST.lang} ${zahl(v[b.id + "_ist"], 0)} · ${REF.lang} ${zahl(v[b.id + "_ref"], 0)} ${EINHEIT}`);
      t.push(`${DK_} ${delta(v[b.id + "_d"], 0)} (${pz(v[b.id + "_dp"])}) – ${WTEXT[w]}`);
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
    const [bm, bk] = BLOECKE, e = d.erfolg.v;
    const anfang = `Erfolg zum Vorjahr: ${MON} ${delta(e[bm.id + "_d"], 0)}, Januar–${MON} ${delta(e[bk.id + "_d"], 0)} ${EINHEIT}`;
    const last = [...d.L, ...d.K].filter(z => effekt(z, bk.id + "_d") < 0)
      .sort((a, b) => effekt(a, bk.id + "_d") - effekt(b, bk.id + "_d"))[0];
    const lang = last ? `${anfang} – größte Belastung: ${last.name} (${delta(last.v[bk.id + "_d"], 0)})` : anfang;
    return DK.tw(lang) <= breite ? lang : anfang;
  }

  /* ---------- Zeichnen ---------- */
  function zeichnen() {
    const d = daten();
    const v = DK.visual(bTab, { titel: "Erfolgsrechnung im Vorjahresvergleich", einheit: EINHEIT,
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
      { nr: 1, ziel: "v-tabelle", anker: "links", versatz: [678, 23], regel: "SAY – Botschaft vermitteln", titel: "Kernaussage über der Tabelle",
        text: "Unter dem Titel steht in einem Satz, wie sich der Erfolg gegenüber dem Vorjahr entwickelt hat – im Monat und kumuliert – und welche Zeile ihn am stärksten belastet. Das Original zeigte die Tabelle ohne Titel, Einheit und Aussage." },
      { nr: 2, ziel: "sp-m-ref", anker: "links", versatz: [12, 15], regel: "UNIFY – Semantische Notation", titel: "Szenarien im Spaltenkopf",
        text: "Marken unter den Spaltenköpfen kennzeichnen die Szenarien: Vorjahr hellgrau, Ist anthrazit – wie in Abb. 3.15 bis 3.18 und in allen Dashboards des Buchs. Die Abweichung heißt einheitlich ΔVJ; im Original standen „Ist VJ kum.“ und „Ist VJ Monat“ ohne Kennzeichnung." },
      { nr: 3, ziel: "sp-m-d", anker: "links", versatz: [34, 142], regel: "UNIFY – Farbe nach Wirkung", titel: "Rot heißt ungünstig, nicht negativ",
        text: "Blaugrün markiert günstige, Rot ungünstige Abweichungen; bei Kosten ist ein Anstieg ungünstig. Das Original färbte nach dem Vorzeichen: gesunkene Material- und Fremdleistungskosten standen rot, gestiegene Personalkosten schwarz." },
      { nr: 4, ziel: "gr-k", anker: "links", versatz: [59, 0], regel: "STRUCTURE – Zeit von links nach rechts", titel: "Monat, dann kumuliert",
        text: "Die Spaltengruppen nennen den Zeitraum und folgen der Zeit: links der Berichtsmonat, rechts Januar bis Berichtsmonat. Im Original stand die Berichtszeile in der Mitte, kumuliert links und Monat rechts, ohne Angabe des Zeitraums." },
      { nr: 5, ziel: "v-tabelle", anker: "links", versatz: [142, 301], regel: "CHECK – Visuelle Integrität", titel: "Summen aus den Zeilen",
        text: "Gesamtleistung, Gesamtkosten und Erfolg sind aus den gezeigten Zeilen gerechnet. Das Original rechnete im Monat mit verdeckten Nachkommastellen, die Summen passten nicht zu den Zeilen (Gesamtkosten 118 statt 117, Vorjahr 127 statt 128)." },
      { nr: 6, ziel: "sp-m-dp", anker: "links", versatz: [34, 1], regel: "SIMPLIFY – Einheitliche Zahlen", titel: "Ein Format je Spalte",
        text: "Werte ohne Nachkommastelle, Abweichungen mit Vorzeichen und echtem Minus, „±0“ für keine Veränderung, Prozente mit einer Nachkommastelle und Leerzeichen. Die Einheit steht einmal im Titel – im Original fehlte sie und wurde als Mio. € ergänzt." },
      { nr: 7, ziel: "sp-zeile", anker: "links", versatz: [114, 1], regel: "STRUCTURE – Schema bleibt", titel: "Sortieren innerhalb der Blöcke",
        text: "Die Zeilen folgen dem Schema der Erfolgsrechnung. Ein Klick auf einen Spaltenkopf sortiert Leistungs- und Kostenzeilen jeweils in ihrem Block – Abweichungen mit der ungünstigsten zuerst –, die Summenzeilen bleiben stehen. Ein Klick auf „Berichtszeile“ stellt das Schema wieder her." },
      { nr: 8, ziel: "v-tabelle", anker: "links", versatz: [388, 2], regel: "EXPRESS – Passende Darstellung", titel: "Tabelle für den Vergleich",
        text: "Für elf Zeilen und zwei Zeiträume ist die Tabelle die genaueste Form; der Tooltip ergänzt Anteile an Gesamtleistung bzw. Gesamtkosten. Wie Abweichungsbalken die Tabelle grafisch unterstützen, zeigt Abb. 3.16." },
    ],
    nachbauIntro: "Standard-Visuals von Power BI Desktop. Seitengröße benutzerdefiniert 727 × 360 px. Schrift Arial: Tabelle 10,5 pt, Visualtitel 12 pt. Das Berichtsdesign (JSON) setzt Farben und Schriften. Datenmodell: Faktentabelle GuV (Berichtszeile, Gruppe, Vorzeichen, Szenario, Zeitraum, Jahr, Wert) wie in der CSV-Datei; Dimension Berichtszeile mit Sortierschlüssel.",
    nachbau: [
      { id: "A", ziel: "v-tabelle", versatz: [0, 0], titel: "Erfolgsrechnung im Vorjahresvergleich", visual: "Matrix",
        felder: "Zeilen: Gruppe (Gesamtleistung, Gesamtkosten) > Berichtszeile; Spalten: Zeitraum (Monat, kumuliert); Werte: VJ = CALCULATE(SUM(GuV[Wert]); GuV[Szenario] = \"Vorjahr\"), IST = CALCULATE(SUM(GuV[Wert]); GuV[Szenario] = \"Ist\"), ΔVJ = [IST] − [VJ], ΔVJ % = DIVIDE([ΔVJ]; [VJ])",
        format: "Ohne Dezimalstellen, ΔVJ % mit einer; Zeilenzwischensummen unten, Gesamtsumme beschriftet „Erfolg“; Schriftfarbe ΔVJ und ΔVJ % bedingt nach dem Measure Wirkung = SIGN([ΔVJ]) × MAX(GuV[Vorzeichen]): 1 → #00806B, −1 → #C62828; Spaltenkopf mit Unterstrich #3A3F44, Zeilenraster #EFEFEF",
        hinweis: "Der Erfolg ist keine einfache Summe: in allen Measures auf Gesamtebene vorzeichenrichtig rechnen, z. B. IF(ISINSCOPE(GuV[Gruppe]); SUM(GuV[Wert]); SUMX(GuV; GuV[Wert] × GuV[Vorzeichen])). Die Szenario-Marken unter den Spaltenköpfen sind kein Standardformat." },
      { id: "B", ziel: "v-tabelle", anker: "links", versatz: [678, 23], titel: "Kernaussage", visual: "Textfeld mit dynamischem Wert",
        felder: "Text-Measure aus [ΔVJ] des Erfolgs je Zeitraum und TOPN(1; …; [ΔVJ] × Vorzeichen; ASC) für die größte Belastung",
        format: "10,5 pt, #4D4D4D" },
    ],
    theme: DK.thema(),
    csv: { name: "erfolgsrechnung_vorjahr_daten.csv", text: () => {
      const k = ["Berichtszeile;Gruppe;Vorzeichen;Szenario;Zeitraum;Jahr;Wert_Mio_EUR"];
      const ZR = { M: `Monat ${MON}`, K: `kumuliert Januar–${MON}` }, SZ = { IST: "Ist", VJ: "Vorjahr" };
      BASIS.forEach(z => Object.keys(W).forEach(key => {
        const [sz, zr] = key.split("_");
        k.push([z.name, z.gruppe === "L" ? "Leistung" : "Kosten", z.r, SZ[sz], ZR[zr], sz === "VJ" ? JAHR - 1 : JAHR, W[key][z.i]].join(";"));
      }));
      return k.join("\r\n"); } },
    tabellen: () => {
      const d = daten(), reihe = [...geordnet(d.L), d.gl, ...geordnet(d.K), d.gk, d.erfolg];
      return [{ titel: `Erfolgsrechnung im Vorjahresvergleich (${EINHEIT})`,
        kopf: ["Berichtszeile", ...BLOECKE.flatMap(b => [`${REF.kurz} ${b.titel}`, `${IST.kurz} ${b.titel}`, DK_, DK_ + " %"])],
        zeilen: reihe.map(z => [z.name, ...BLOECKE.flatMap(b => [zahl(z.v[b.id + "_ref"], 0), zahl(z.v[b.id + "_ist"], 0),
          delta(z.v[b.id + "_d"], 0), pz(z.v[b.id + "_dp"])])]) }];
    },
  });
  zeichnen();
})();
