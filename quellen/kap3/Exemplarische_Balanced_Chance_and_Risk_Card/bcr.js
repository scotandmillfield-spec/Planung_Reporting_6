/* Abb. 3.2 „Balanced Chance and Risk Card“ (6. Auflage) – Neuaufbau der BCR-Card der 5. Auflage.
   Struktur wie im Original: Perspektiven, strategische Ziele, Kennzahlen (Vorjahr, Forecast, Plan, Mittelfristplanung),
   Maßnahmen, Chancen und Risiken mit Eintrittswahrscheinlichkeit und Wert. Daten: daten_bcr.py (Stand 30.06.2027,
   Maßnahmen = Projekte der Roadmap aus Abb. 3.3/3.5). Zwei Tabellen mit gemeinsamem Zeilenraster.
   Datenschnitt Geschäftsbereich (Standard „Alle“): setzt die Werte der Zeilen auf den gewählten Bereich. */
(() => {
  "use strict";
  const { zahl, delta, prozent, wirkung, FARBE, sv, tw, NBSP } = DK;
  const PERSP = DATA.perspektiven, STAND = DATA.stand, GB = DATA.bereiche;
  let zielAkt = "";
  const Z = DATA.zeilen.map((z, i) => {
    if (z[1]) zielAkt = z[1];
    return { i, p: z[0], ziel: zielAkt, neuesZiel: !!z[1], kz: z[2], einh: z[3], nk: z[4], wirk: z[5], vj: z[6], fc: z[7],
             pl: z[8], mf: z[9], mn: z[10], proj: z[11], art: z[12], cr: z[13], ein: z[14], wert: z[15], erkl: z[16] };
  });
  const EIN = ["", "sehr gering", "gering", "mittel", "groß", "sehr groß"];
  const ART = { C: "Chance", R: "Risiko" };
  const GUT = "#00806B", SCHLECHT = "#C62828";

  /* ---------- Zustand ---------- */
  const S = { vgl: "pl", gb: "alle", auswahl: null };
  /* Geschäftsbereich: Werte der Zeilen in place setzen (REIHEN behält die Objekte) */
  function bereichAnwenden() {
    Z.forEach(z => {
      const roh = DATA.zeilen[z.i];
      if (S.gb === "alle") {
        Object.assign(z, { vj: roh[6], fc: roh[7], pl: roh[8], mf: roh[9], mn: roh[10], proj: roh[11], art: roh[12], wert: roh[15] });
        return;
      }
      const b = roh[17][+S.gb];
      Object.assign(z, { vj: b[0], fc: b[1], pl: b[2], mf: b[3], mn: b[5] ? roh[10] : "", proj: b[5] ? roh[11] : null,
                         art: b[4] != null ? roh[12] : "", wert: b[4] });
    });
  }
  const refWert = z => (S.vgl === "pl" ? z.pl : z.vj);
  const dProz = (z, ref = refWert(z)) => (z.fc - ref) / Math.abs(ref) * 100;
  const fw = (z, v) => zahl(v, z.nk);
  function auswaehlen(typ, wert) {
    S.auswahl = S.auswahl && S.auswahl.typ === typ && S.auswahl.wert === wert ? null : { typ, wert };
    zeichnen();
  }
  addEventListener("keydown", e => { if (e.key === "Escape" && S.auswahl) { S.auswahl = null; zeichnen(); } });
  const aktiv = r => !S.auswahl || (S.auswahl.typ === "persp" ? r.p === S.auswahl.wert
    : r.typ === "k" && r.z.i === S.auswahl.wert);

  /* ---------- Layout (Seite 1024 x 646) ---------- */
  DK.init({ titel: "Balanced Chance and Risk Card" });
  const bKopf = DK.box("kopf", 16, 10, 992, 46);
  DK.haarlinie(62);
  // Datenschnitt rechts oben im Kopf (die Tabellen brauchen die volle Höhe, daher keine eigene Filterzeile)
  const bFilter = DK.box("filter", 708, 8, 300, 28, "dk-filter");
  bFilter.style.justifyContent = "flex-end";
  const sel = DK.schnitt(bFilter, "Geschäftsbereich", "dropdown", { breite: 170,
    optionen: [["alle", "Alle"], ...GB.map((g, i) => [String(i), g])], wert: S.gb,
    onChange: w => { S.gb = w; bereichAnwenden(); zeichnen(); } });
  sel.style.height = "26px";
  Object.assign(sel.parentNode.style, { flexDirection: "row", alignItems: "center", gap: "8px" });
  const bZiele = DK.box("v-ziele", 16, 70, 532, 572);
  const bCR = DK.box("v-cr", 568, 70, 440, 572);

  /* Zeilenraster beider Tabellen: Kopf, je Perspektive eine Gruppenzeile, dann die Kennzahlen */
  const KOPF_H = 22, GRUPPE_H = 19, ZEILE_H = 17;
  const REIHEN = [];
  let yy = KOPF_H;
  PERSP.forEach((name, p) => {
    REIHEN.push({ typ: "g", p, y: yy, h: GRUPPE_H }); yy += GRUPPE_H;
    Z.filter(z => z.p === p).forEach(z => { REIHEN.push({ typ: "k", p, z, y: yy, h: ZEILE_H }); yy += ZEILE_H; });
  });
  const TAB_H = yy;

  /* ---------- Tooltip (gleiches Verhalten wie die Bausteine von DK) ---------- */
  const tip = document.querySelector(".dk-tooltip");
  function tooltip(ziel, zeilenFn) {
    ziel.addEventListener("pointermove", ev => {
      tip.textContent = "";
      zeilenFn().filter(Boolean).forEach((z, i) => DK.el(i === 0 ? "b" : "div", {}, tip, z));
      tip.style.display = "block";
      const r = tip.getBoundingClientRect();
      let x = ev.clientX + 14, y = ev.clientY + 14;
      if (x + r.width > innerWidth - 8) x = ev.clientX - r.width - 14;
      if (y + r.height > innerHeight - 8) y = ev.clientY - r.height - 14;
      tip.style.left = x + "px"; tip.style.top = y + "px";
    });
    ziel.addEventListener("pointerleave", () => { tip.style.display = "none"; });
  }
  const saldo = zs => {
    const c = zs.filter(z => z.art === "C").reduce((s, z) => s + z.wert, 0);
    const r = zs.filter(z => z.art === "R").reduce((s, z) => s + z.wert, 0);
    return { c, r, s: c + r };
  };
  const tipKennzahl = z => [z.kz, `${PERSP[z.p]} · ${z.ziel}`, z.erkl,
    `VJ 2026: ${fw(z, z.vj)} · FC 2027: ${fw(z, z.fc)} · PL 2027: ${fw(z, z.pl)} ${z.einh}`,
    `ΔPL: ${delta(dProz(z, z.pl), 1, NBSP + "%")} · ΔVJ: ${delta(dProz(z, z.vj), 1, NBSP + "%")}` +
      (z.wirk ? "" : " (ohne Wertung)"),
    `Plan 2028–2030: ${z.mf.map(v => fw(z, v)).join(" / ")} ${z.einh}`,
    z.mn ? `Maßnahme: ${z.mn}` + (z.proj ? ` (Roadmap: ${z.proj[0]}${z.proj[1] != null ? ", " + z.proj[1] + NBSP + "% fertig" : ""})` : "") : "",
    z.art ? `${ART[z.art]}: ${z.cr}, Eintritt ${EIN[z.ein]}, ${delta(z.wert, 1)} Mio. €` : "",
    "Klick hebt hervor"];
  const tipGruppe = p => {
    const zs = Z.filter(z => z.p === p), sd = saldo(zs);
    const hinter = zs.filter(z => wirkung(dProz(z), z.wirk, 1) === "schlecht").length;
    return [PERSP[p] + (S.gb === "alle" ? "" : " · " + GB[+S.gb]), `${zs.length} Kennzahlen, ${hinter} hinter ${S.vgl === "pl" ? "Plan" : "Vorjahr"}`,
      `Chancen ${delta(sd.c, 1)} · Risiken ${delta(sd.r, 1)} · Saldo ${delta(sd.s, 1)} Mio. €`, "Klick hebt die Perspektive hervor"];
  };

  /* Gemeinsames Gerüst je Tabelle: SVG, Kopfzeile, Zeilengruppen mit Trefferfläche */
  function gerust(v, breite, kopf) {
    const svg = sv("svg", { width: breite, height: TAB_H, role: "img" }, v.flaeche);
    kopf.forEach(([x, text, anker, id]) => sv("text", { x, y: 15, "text-anchor": anker || "start", class: "muted", ...(id ? { id } : {}) }, svg, text));
    sv("line", { x1: 0, x2: breite, y1: KOPF_H - 2.5, y2: KOPF_H - 2.5, stroke: "#3A3F44", "stroke-width": 1 }, svg);
    return REIHEN.map((r, j) => {
      const g = sv("g", { class: "dk-klick" + (aktiv(r) ? "" : " dk-blass") }, svg);
      const hit = sv("rect", { x: 0, y: r.y, width: breite, height: r.h, fill: "transparent" }, g);
      if (r.typ === "g") {
        hit.addEventListener("click", () => auswaehlen("persp", r.p));
        tooltip(hit, () => tipGruppe(r.p));
        sv("rect", { x: 0, y: r.y + 2, width: breite, height: r.h - 2, fill: "#F6F6F6" }, g);
      } else {
        hit.addEventListener("click", () => auswaehlen("zeile", r.z.i));
        tooltip(hit, () => tipKennzahl(r.z));
        const naechste = REIHEN[j + 1];
        const linie = naechste && naechste.typ === "k" && naechste.z.neuesZiel ? "#D9D9D9" : "#EFEFEF";
        if (naechste && naechste.typ === "k") sv("line", { x1: 0, x2: breite, y1: r.y + r.h - 0.5, y2: r.y + r.h - 0.5, stroke: linie, "stroke-width": 1 }, g);
      }
      return g;
    });
  }
  const mitte = r => r.y + r.h / 2 + (r.typ === "g" ? 1 : 0);
  function text(g, x, r, t, attrs = {}, maxB) {
    if (maxB && tw(t, 14, attrs["font-weight"] === "bold") > maxB) console.error("Text zu lang: " + t);
    return sv("text", { x, y: mitte(r), dy: "0.35em", ...attrs }, g, t);
  }

  /* ---------- Linke Tabelle: Ziele und Kennzahlen ---------- */
  const L = { ziel: 0, kz: 170, fc: 376, ref: 422, dTxt: 472, bar0: 478, bar1: 530 };
  function tabelleZiele(v) {
    const W = v.breite, vgl = S.vgl === "pl";
    const gs = gerust(v, W, [[L.ziel, "Strategisches Ziel"], [L.kz, "Kennzahl"], [L.fc, "FC", "end"],
      [L.ref, vgl ? "PL" : "VJ", "end"], [(L.dTxt + L.bar1) / 2 - 4, vgl ? "ΔPL %" : "ΔVJ %", "middle", "sp-delta"]]);
    const ds = Z.map(z => dProz(z));
    const neg = Math.max(0, ...ds.map(d => -d)), pos = Math.max(0, ...ds);
    const k = (L.bar1 - L.bar0) / Math.max(neg + pos, 1e-9), m = L.bar0 + neg * k;
    REIHEN.forEach((r, j) => {
      const g = gs[j];
      if (r.typ === "g") { text(g, 4, r, PERSP[r.p], { "font-weight": "bold" }); return; }
      const z = r.z, d = ds[z.i], kl = wirkung(d, z.wirk, 1);
      if (z.neuesZiel) text(g, L.ziel, r, z.ziel, {}, L.kz - 6);
      const t = text(g, L.kz, r, z.kz + (z.einh ? " " : ""));
      if (z.einh) sv("tspan", { class: "muted" }, t, z.einh);
      if (tw(z.kz + " " + z.einh) > L.fc - 36 - L.kz - 6) console.error("Kennzahl zu lang: " + z.kz);
      text(g, L.fc, r, fw(z, z.fc), { "text-anchor": "end" });
      text(g, L.ref, r, fw(z, refWert(z)), { "text-anchor": "end" });
      text(g, L.dTxt, r, delta(d, 1), { "text-anchor": "end", style: `fill:${kl === "neutral" ? "var(--text)" : FARBE[kl]}` });
      const bw = Math.abs(d) * k;
      if (bw > 0.5) sv("rect", { x: d >= 0 ? m : m - bw, y: r.y + (r.h - 9) / 2, width: bw, height: 9, fill: FARBE[kl] }, g);
      sv("line", { x1: m, x2: m, y1: r.y + 2, y2: r.y + r.h - 2, stroke: "#8C8C8C", "stroke-width": 1 }, g);
    });
  }

  /* ---------- Rechte Tabelle: Maßnahmen, Chancen und Risiken ---------- */
  const R = { mn: 0, cr: 174, ein: 366, wert: 436 };
  function punkte(g, r, n, farbe) {
    for (let i = 0; i < 5; i++) sv("circle", { cx: R.ein - 16 + i * 8, cy: mitte(r), r: 3.2, fill: i < n ? farbe : "#FFFFFF",
                                              stroke: farbe, "stroke-width": 1 }, g);
  }
  function tabelleCR(v) {
    const W = v.breite;
    const gs = gerust(v, W, [[R.mn, "Maßnahme"], [R.cr, "Chance/Risiko"], [R.ein, "Eintritt", "middle", "sp-eintritt"], [R.wert, "Wert", "end"]]);
    REIHEN.forEach((r, j) => {
      const g = gs[j];
      if (r.typ === "g") {
        const sd = saldo(Z.filter(z => z.p === r.p));
        text(g, R.cr, r, "Saldo", { class: "muted" });
        text(g, R.wert, r, delta(sd.s, 1), { "text-anchor": "end", "font-weight": "bold",
          style: `fill:${sd.s > 0 ? GUT : sd.s < 0 ? SCHLECHT : "var(--text)"}` });
        return;
      }
      const z = r.z;
      if (z.mn) text(g, R.mn, r, z.mn, {}, R.cr - R.mn - 6);
      if (!z.art) return;
      const farbe = z.art === "C" ? GUT : SCHLECHT;
      text(g, R.cr, r, z.cr, {}, R.ein - 24 - R.cr - 4);
      punkte(g, r, z.ein, farbe);
      text(g, R.wert, r, delta(z.wert, 1), { "text-anchor": "end", style: `fill:${farbe}` });
    });
  }

  /* ---------- Zeichnen ---------- */
  function zeichnen() {
    const vgl = S.vgl === "pl";
    DK.kopf(bKopf, { titel: "Balanced Chance and Risk Card",
      untertitel: `Stand: ${STAND} · Forecast (FC) und Plan (PL) 2027, Vorjahr (VJ) 2026`,
      quelle: "",
      legende: [[GUT, "günstig bzw. Chance"], [SCHLECHT, "ungünstig bzw. Risiko"]] });
    const lg = document.getElementById("kopf-legende");
    lg.style.marginTop = "29px";              // unter dem Datenschnitt
    const sp = DK.el("span", { id: "legende-eintritt" }, lg);
    const s = sv("svg", { width: 38, height: 10, style: "overflow:visible" }, sp);
    for (let i = 0; i < 5; i++) sv("circle", { cx: 3.5 + i * 7.5, cy: 5, r: 3, fill: i < 3 ? "#3A3F44" : "#FFFFFF", stroke: "#3A3F44", "stroke-width": 1 }, s);
    sp.appendChild(document.createTextNode("Eintritt 1–5"));

    // Geltungsbereich der Botschaften: ausgewählte Perspektive oder alle
    const pSel = !S.auswahl ? null : S.auswahl.typ === "persp" ? S.auswahl.wert : Z[S.auswahl.wert].p;
    const zs = pSel == null ? Z : Z.filter(z => z.p === pSel);
    const vor = pSel == null ? "" : PERSP[pSel] + ": ";
    const schlecht = zs.filter(z => wirkung(dProz(z), z.wirk, 1) === "schlecht");
    const luecke = schlecht.slice().sort((a, b) => Math.abs(dProz(b)) - Math.abs(dProz(a)))[0];
    let v = DK.visual(bZiele, { titel: "Ziele und Kennzahlen", einheit: "Δ in %",
      botschaft: vor + (luecke ? `${schlecht.length} von ${zs.length} Kennzahlen hinter ${vgl ? "Plan" : "Vorjahr"}, größte Lücke: ${luecke.kz} (${delta(dProz(luecke), 1, NBSP + "%")})`
                               : `alle Kennzahlen im oder über ${vgl ? "Plan" : "Vorjahr"}`),
      schalter: { optionen: [["pl", "ΔPL"], ["vj", "ΔVJ"]], wert: S.vgl, onChange: w => { S.vgl = w; zeichnen(); } } });
    tabelleZiele(v);

    const sd = saldo(zs);
    const risk = zs.filter(z => z.art === "R").sort((a, b) => a.wert - b.wert)[0];
    const chance = zs.filter(z => z.art === "C").sort((a, b) => b.wert - a.wert)[0];
    const top = risk || chance;
    v = DK.visual(bCR, { titel: "Maßnahmen, Chancen und Risiken", einheit: "Wert in Mio. €",
      botschaft: vor + `${pSel == null ? "Gesamtsaldo" : "Saldo"} ${delta(sd.s, 1)} Mio. €` + (top ? `, größtes ${risk ? "Risiko" : "Chance"}: ${top.cr} (${delta(top.wert, 1)})` : "") });
    tabelleCR(v);
    // Titelzeilen beider Visuals gleich hoch (links mit Schalter), damit die Botschaften auf einer Linie stehen
    const tz = [bZiele, bCR].map(b => b.querySelector(".dk-titelzeile"));
    const h = Math.max(...tz.map(t => t.offsetHeight));
    tz.forEach(t => { t.style.height = h + "px"; t.style.alignItems = "center"; });
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  /* ---------- Lernplattform: Designregeln, Nachbau, Tabellen, CSV ---------- */
  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "v-ziele", versatz: [-150, 0], regel: "SAY – Botschaft vermitteln", titel: "Aussage statt Farbfläche",
        text: "Unter jedem Titel steht, was zählt: wie viele Kennzahlen hinter Plan liegen, wo die größte Lücke ist und wie Chancen und Risiken saldiert stehen. Ein Klick auf eine Perspektive bezieht die Aussagen auf sie." },
      { nr: 2, ziel: "sp-delta", versatz: [26, -4], regel: "UNIFY – Semantische Notation", titel: "Abweichung nach Wirkung",
        text: "Blaugrün ist günstig, Rot ungünstig – je Kennzahl nach ihrer Wirkungsrichtung. Das Original färbte die Zielerreichung mit einer Rot-Gelb-Grün-Skala nach Wert: Das um ein Drittel längere Debitorenziel erschien grün." },
      { nr: 3, ziel: "sp-eintritt", anker: "links", regel: "UNIFY – Semantische Notation", titel: "Chance blaugrün, Risiko rot",
        text: "Chancen sind mögliche günstige, Risiken mögliche ungünstige Abweichungen. Sie tragen dieselben Farben wie die Abweichungen und zusätzlich ein Vorzeichen, damit sie auch in Graustufen unterscheidbar sind. Das Original nutzte Blau und Rot." },
      { nr: 4, ziel: "v-cr", regel: "CONDENSE – Informationsdichte", titel: "Saldo je Perspektive",
        text: "Die Gruppenzeile jeder Perspektive zeigt den Saldo aus Chancen und Risiken. Die Mittelfristplanung 2028–2030 steht im Tooltip statt in schwarzen Mini-Säulen ohne Werte; Vorjahr und Plan teilen sich eine Spalte (Schalter ΔPL/ΔVJ)." },
      { nr: 5, ziel: "v-ziele", versatz: [-178, 0], regel: "CHECK – Visuelle Integrität", titel: "Eine Zahlenbasis, sichtbare Nulllinie",
        text: "Alle Werte kommen aus einem Datensatz, jede Kennzahl hat ihre Einheit. Im Original wich der ROI im Balken oben (10,5 %) von der Tabelle (10,1 %) ab, Einheiten waren abgeschnitten („[T€“), einzelne Werte unplausibel (Umsatz je Verkäufer −91 %)." },
      { nr: 6, ziel: "kopf-legende", anker: "links", regel: "EXPRESS – Passende Darstellung", titel: "Balken statt eingefärbter Zellen",
        text: "Abweichungen stehen als Balken an einer Nulllinie, ein Maßstab für die ganze Spalte. Die Eintrittswahrscheinlichkeit bleibt als Punkteskala wie im Original; die Legende steht einmal im Kopf." },
      { nr: 7, ziel: "kopf-titel", versatz: [26, 0], regel: "SIMPLIFY – Überflüssiges weglassen", titel: "Ohne Logo, Banderole und Schaltflächen",
        text: "Logo, Banderole „BI-Controlling“, Info-Symbol, die Schaltflächen „Strategische Planung“ und „Ursache-Wirkung“, schwarze Zellen und Rahmen entfallen. Der ROI-Balken oben entfällt, der ROI steht in der Tabelle." },
      { nr: 8, ziel: "v-cr", versatz: [0, 26], regel: "STRUCTURE – Inhalte ordnen", titel: "Perspektiven waagerecht, eine Zeile je Kennzahl",
        text: "Perspektiven stehen als Gruppenzeilen statt gedrehter Seitenbeschriftung; Ziel, Kennzahl, Maßnahme, Chance oder Risiko stehen auf derselben Zeile. Maßnahmen tragen die Projektnamen der Roadmap (Abb. 3.3 und 3.5)." },
    ],
    nachbauIntro: "Alle Elemente sind Standard-Visuals von Power BI Desktop. Seitengröße benutzerdefiniert 1024 × 646 px. Schrift Arial: Beschriftungen 10,5 pt, Visualtitel 12 pt. Beide Tabellen haben dieselben Zeilen (Perspektive > Ziel > Kennzahl) und dieselbe Sortierung, damit sie nebeneinander zeilengleich stehen.",
    nachbau: [
      { id: "A", ziel: "kopf-titel", versatz: [26, 0], titel: "Kopfzeile und Legende", visual: "Textfeld; Formen",
        felder: "Titel und Untertitel (mit Stand) als Text; Legende aus zwei Rechtecken 9 × 9 px und einem Textfeld mit ●●●○○",
        format: "Titel 16,5 pt fett, Untertitel 10,5 pt #4D4D4D" },
      { id: "B", ziel: "v-ziele", versatz: [-150, 0], titel: "Ziele und Kennzahlen", visual: "Matrix (Layout tabellarisch, Zwischensummen aus)",
        felder: "Zeilen: Perspektive, Ziel, Kennzahl; Werte: FC 2027, Vergleichswert, Δ %; QuickInfos: VJ, PL, PL 2028–2030, Erläuterung",
        format: "Perspektive als Zeilenkopf mit Hintergrund #F6F6F6; Zahlenformat je Kennzahl über dynamische Formatzeichenfolge",
        hinweis: "Δ % = (FC − Vergleich) / |Vergleich|. Farbe nach Wirkung: zwei Measures „Δ günstig“ und „Δ ungünstig“ (Wert nur bei passender Wirkung, sonst BLANK()) als Datenbalken in #00806B bzw. #C62828 mit gleicher Achse." },
      { id: "C", ziel: "sp-delta", versatz: [26, -4], titel: "Schalter ΔPL/ΔVJ", visual: "Datenschnitt (Kacheln) auf einem Feldparameter",
        felder: "Feldparameter mit den Measures „Vergleich PL“ und „Vergleich VJ“ bzw. Berechnungsgruppe Szenario",
        format: "Ausgewählt: Füllung #3A3F44, Schrift weiß" },
      { id: "D", ziel: "v-cr", titel: "Maßnahmen, Chancen und Risiken", visual: "Matrix (gleiche Zeilen, Zwischensummen oben)",
        felder: "Maßnahme, Chance/Risiko, Eintritt, Wert; Zwischensumme der Perspektive = Saldo",
        format: "Wert mit Vorzeichen (+0,0;−0,0), Schriftfarbe nach Feldwert (Farb-Measure: Chance #00806B, Risiko #C62828)",
        hinweis: "Eintritt als Text-Measure REPT(\"●\"; [Eintritt]) & REPT(\"○\"; 5 − [Eintritt]) mit derselben Schriftfarbe." },
      { id: "E", ziel: "v-cr", versatz: [0, 26], titel: "Kernaussagen", visual: "Textfeld mit dynamischem Wert",
        felder: "Text-Measures: Anzahl Kennzahlen hinter Plan, größte Lücke (TOPN), Saldo und größtes Risiko",
        format: "10,5 pt, #4D4D4D" },
      { id: "F", ziel: "filter", anker: "links", titel: "Datenschnitt Geschäftsbereich", visual: "Datenschnitt (Dropdown, Einfachauswahl)",
        felder: "Geschäftsbereich (Werte Alle, Antriebstechnik, Lineartechnik, Service); Standardwert Alle",
        format: "Kopfzeile des Datenschnitts links neben dem Feld, 10,5 pt",
        hinweis: "Die Daten enthalten je Kennzahl eine Zeile „Alle“, weil sich Quoten nicht über die Bereiche summieren; Mengen, Chancen und Risiken der Bereiche ergeben in Summe den Wert „Alle“." },
    ],
    theme: DK.thema(),
    csv: { name: "bcr_card_beispieldaten.csv", text: () => {
      const d = v => (v == null ? "" : String(v).replace(".", ","));
      const kopf = "Geschäftsbereich;Perspektive;Strategisches_Ziel;Kennzahl;Einheit;Wirkung;VJ_2026;FC_2027;PL_2027;PL_2028;PL_2029;PL_2030;Maßnahme;Roadmap_Status;Chance_Risiko;Art;Eintritt_1_5;Wert_MioEUR";
      const zeilen = [];
      [["Alle", null], ...GB.map((g, i) => [g, i])].forEach(([name, gi]) => DATA.zeilen.forEach((roh, k) => {
        const b = gi == null ? [roh[6], roh[7], roh[8], roh[9], roh[15], 1] : roh[17][gi];
        const mn = b[5] ? roh[10] : "", cr = b[4] != null;
        zeilen.push([name, PERSP[roh[0]], Z[k].ziel, roh[2], roh[3], { 1: "Anstieg günstig", "-1": "Anstieg ungünstig", 0: "neutral" }[roh[5]],
          d(b[0]), d(b[1]), d(b[2]), ...b[3].map(d), mn, mn && roh[11] ? roh[11][0] : "", cr ? roh[13] : "",
          cr ? ART[roh[12]] || "" : "", cr ? roh[14] || "" : "", d(b[4])].join(";"));
      }));
      return [kopf, ...zeilen].join("\r\n"); } },
    tabellen: () => [
      { titel: "Ziele und Kennzahlen" + (S.gb === "alle" ? "" : " – " + GB[+S.gb]), kopf: ["Perspektive", "Kennzahl", "Einheit", "VJ 2026", "FC 2027", "PL 2027", "ΔPL %", "ΔVJ %", "PL 2028", "PL 2029", "PL 2030"],
        zeilen: Z.map(z => [PERSP[z.p], z.kz, z.einh, fw(z, z.vj), fw(z, z.fc), fw(z, z.pl), delta(dProz(z, z.pl), 1), delta(dProz(z, z.vj), 1), ...z.mf.map(v => fw(z, v))]) },
      { titel: "Maßnahmen, Chancen und Risiken (Mio. €)" + (S.gb === "alle" ? "" : " – " + GB[+S.gb]), kopf: ["Perspektive", "Maßnahme", "Chance/Risiko", "Art", "Eintritt", "Wert"],
        zeilen: Z.filter(z => z.mn || z.art).map(z => [PERSP[z.p], z.mn || "–", z.cr || "–", ART[z.art] || "–", z.ein ? EIN[z.ein] : "–", z.art ? delta(z.wert, 1) : "–"])
          .concat(PERSP.map((n, p) => ["Saldo " + n, "", "", "", "", delta(saldo(Z.filter(z => z.p === p)).s, 1)]))
          .concat([["Gesamtsaldo", "", "", "", "", delta(saldo(Z).s, 1)]]) },
    ],
  });
  zeichnen();
})();
