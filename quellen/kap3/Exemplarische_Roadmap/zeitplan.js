/* Abb. 3.3 „Strategische Projektroadmap – Zeitplan“ (6. Auflage).
   Gleicher Datensatz wie Abb. 3.5 (Strategische Projektroadmap), ergänzt um Plantermine und Ist-Beginn
   (daten_zeitplan.py). Alle Kennzahlen und Balken werden hier aus den Einzelsätzen berechnet. */
(() => {
  "use strict";
  const { zahl, delta, prozent, wirkung, FARBE, sv, tw } = DK;
  const ST = DATA.status, GB = DATA.gb, FB = DATA.fb, BSC = DATA.bsc, STAENDE = DATA.staende;
  const tag = iso => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) / 864e5;
  const datum = t => { const d = new Date(t * 864e5);
    return String(d.getUTCDate()).padStart(2, "0") + "." + String(d.getUTCMonth() + 1).padStart(2, "0") + "." + d.getUTCFullYear(); };
  const STAND_TAG = DATA.stand_iso.map(tag);
  const STAND_PLUS12 = DATA.stand_iso.map(iso => tag((+iso.slice(0, 4) + 1) + iso.slice(4)));   // Stichtag + 12 Monate (kalendergenau)
  const PJ = DATA.projekte.map((p, i) => {
    const t = DATA.termine[i];
    return { name: p[0], gb: p[1], fb: p[2], bsc: p[3], verantw: p[4], plan: p[5],
             beginn: t ? tag(t[0]) : null, umsetzung: t ? tag(t[1]) : null, ende: t ? tag(t[2]) : null, ist: t ? tag(t[3]) : null };
  });
  const R = DATA.zeilen.map(z => ({ q: z[0], p: z[1], st: z[2], fert: z[3] == null ? null : z[3] / 100, verz: z[5], ...PJ[z[1]] }));
  const UMSETZUNG = 0, PLANUNG = 1, IDEE = 2, ERLEDIGT = 3;
  const offen = r => r.st === UMSETZUNG || r.st === PLANUNG;
  const terminiert = r => r.st !== IDEE && r.beginn != null;
  const endeEff = r => r.ende + 7 * (r.verz || 0);            // Prognose-Ende bzw. Ist-Ende (erledigt)
  const STAND_KNOEPFE = [[1, "Q3/26"], [2, "Q4/26"], [3, "Q1/27"], [4, "Q2/27"]];
  const T0 = tag("2026-01-01"), T1 = tag("2030-01-01"), JAHRE = [2026, 2027, 2028, 2029];
  const PLANUNGSPHASE = "#D4D4D4";

  /* ---------- Zustand ---------- */
  const S = { stand: 4, gb: "alle", fb: "alle", bsc: "alle", auswahl: null };
  function zeilen(q, ohne) {
    const a = S.auswahl;
    return R.filter(r => r.q === q &&
      (S.gb === "alle" || r.gb === +S.gb) && (S.fb === "alle" || r.fb === +S.fb) && (S.bsc === "alle" || r.bsc === +S.bsc) &&
      (!a || a.typ === ohne || r.p === a.wert));
  }
  function auswaehlen(p) {
    S.auswahl = S.auswahl && S.auswahl.wert === p ? null : { typ: "projekt", wert: p };
    zeichnen();
  }
  addEventListener("keydown", e => { if (e.key === "Escape" && S.auswahl) { S.auswahl = null; zeichnen(); } });

  /* ---------- Layout (Seite 1024 x 646) ---------- */
  DK.init({ titel: "Strategische Projektroadmap – Zeitplan" });
  const bKopf = DK.box("kopf", 16, 10, 992, 46);
  DK.haarlinie(62);
  const bFilter = DK.box("filter", 16, 68, 992, 50, "dk-filter");
  const bKpi = DK.box("kpis", 16, 128, 992, 68);
  DK.haarlinie(206);
  const bZeit = DK.box("v-zeitplan", 16, 216, 992, 426);

  /* ---------- Tooltip (gleiches Verhalten wie die Bausteine von DK) ---------- */
  const tip = document.querySelector(".dk-tooltip");
  function tooltip(ziel, zeilenFn) {
    ziel.addEventListener("pointermove", ev => {
      tip.textContent = "";
      zeilenFn().forEach((z, i) => DK.el(i === 0 ? "b" : "div", {}, tip, z));
      tip.style.display = "block";
      const r = tip.getBoundingClientRect();
      let x = ev.clientX + 14, y = ev.clientY + 14;
      if (x + r.width > innerWidth - 8) x = ev.clientX - r.width - 14;
      if (y + r.height > innerHeight - 8) y = ev.clientY - r.height - 14;
      tip.style.left = x + "px"; tip.style.top = y + "px";
    });
    ziel.addEventListener("pointerleave", () => { tip.style.display = "none"; });
  }

  /* ---------- Datenschnitte ---------- */
  DK.schnitt(bFilter, "Stand", "knoepfe", { optionen: STAND_KNOEPFE, wert: S.stand,
    onChange: v => { S.stand = v; zeichnen(); } });
  const dd = (label, key, liste, breite) => DK.schnitt(bFilter, label, "dropdown", { breite,
    optionen: [["alle", "Alle"], ...liste.map((t, i) => [String(i), t])], wert: "alle",
    onChange: v => { S[key] = v; S.auswahl = null; zeichnen(); } });
  dd("Geschäftsbereich", "gb", GB, 170);
  dd("Funktionsbereich", "fb", FB, 150);
  dd("BSC-Perspektive", "bsc", BSC, 190);

  /* ---------- Berechnungen ---------- */
  const summe = (rows, f) => rows.reduce((s, r) => s + (f(r) ?? 0), 0);
  function kennzahlen(rows, q) {
    const u = rows.filter(r => r.st === UMSETZUNG), pu = summe(u, r => r.plan), o = rows.filter(offen);
    return { n: rows.length, um: u.length,
             fert: pu ? summe(u, r => r.plan * r.fert) / pu * 100 : null,
             verz: o.filter(r => r.verz > 0).length,
             dverz: o.length ? summe(o, r => r.verz) / o.length : null,
             ab12: o.filter(r => endeEff(r) <= STAND_PLUS12[q]).length };
  }
  function kpiDaten() {
    const ist = kennzahlen(zeilen(S.stand), S.stand), vq = kennzahlen(zeilen(S.stand - 1), S.stand - 1);
    const def = [
      ["Projekte", "n", 0, 0, "", ""],
      ["In Umsetzung", "um", 0, 0, "", ""],
      ["Ø Fertigstellung", "fert", 0, +1, "%", " %-Pkt."],
      ["Im Terminverzug", "verz", 0, -1, "Projekte", ""],
      ["Ø Terminverzug", "dverz", 1, -1, "Wochen", ""],
      ["Enden in 12 Monaten", "ab12", 0, 0, "Projekte", ""],
    ];
    return def.map(([label, k, nk, richtung, einheit, suffix]) => {
      const a = ist[k], p = vq[k], d = a == null || p == null ? null : a - p;
      return { label, bezug: "ΔVQ", einheit: a == null ? "" : einheit === "Projekte" && a === 1 ? "Projekt" : einheit,
        wert: a == null ? "–" : zahl(a, nk), delta: d == null ? "–" : delta(d, nk, suffix),
        klasse: d == null ? "neutral" : wirkung(d, richtung, nk) };
    });
  }
  function zeitplanDaten() {
    const rows = zeilen(S.stand, "projekt").slice();
    const schluessel = r => (r.st === IDEE ? -r.plan : r.st === ERLEDIGT ? endeEff(r) : r.beginn);
    rows.sort((a, b) => a.st - b.st || schluessel(a) - schluessel(b));
    return rows;
  }

  /* ---------- Zeitplan (Projekttabelle + Zeitachse) ---------- */
  const ZH = 18, KOPF_H = 36;
  const SP = { status: Math.ceil(Math.max(...ST.map(s => tw(s)), tw("Status"))) + 14, fert: 66, termin: 84 };
  SP.name = Math.ceil(Math.max(...PJ.map(p => tw(p.name)))) + 14;
  function zeitplan(ziel, breite, rows) {
    const x0 = SP.name + SP.status + SP.fert + SP.termin + 14, x1 = breite - 2;
    const X = t => x0 + (Math.min(Math.max(t, T0), T1) - T0) / (T1 - T0) * (x1 - x0);
    const H = KOPF_H + rows.length * ZH;
    const svg = sv("svg", { width: breite, height: H, role: "img", "aria-label": "Zeitplan der strategischen Projekte" }, ziel);
    const stand = STAND_TAG[S.stand], xs = X(stand);
    // Kopf: Spaltentitel, Jahre, Quartale
    const kopfY = 29;
    sv("text", { x: 0, y: kopfY, class: "muted", id: "sp-projekt" }, svg, "Projekt");
    sv("text", { x: SP.name, y: kopfY, class: "muted", id: "zp-status" }, svg, "Status");
    sv("text", { x: SP.name + SP.status + SP.fert - 8, y: kopfY, "text-anchor": "end", class: "muted", id: "sp-fert" }, svg, "Fertigst.");
    sv("text", { x: SP.name + SP.status + SP.fert + SP.termin - 8, y: kopfY, "text-anchor": "end", class: "muted", id: "sp-termin" }, svg, "ΔPL Termin");
    const achse = sv("g", { id: "zp-achse" }, svg);
    const jahrLabels = [];
    JAHRE.forEach(j => {
      const xj = X(tag(`${j}-01-01`));
      sv("text", { x: xj + 5, y: 12 }, achse, String(j));
      jahrLabels.push([xj + 5, xj + 5 + tw(String(j))]);
      ["01", "04", "07", "10"].forEach((m, k) => {
        const a = X(tag(`${j}-${m}-01`)), b = X(k < 3 ? tag(`${j}-${["04", "07", "10"][k]}-01`) : tag(`${j + 1}-01-01`));
        sv("text", { x: (a + b) / 2, y: kopfY, "text-anchor": "middle", class: "muted" }, achse, "Q" + (k + 1));
      });
    });
    sv("line", { x1: 0, x2: breite, y1: KOPF_H - 2.5, y2: KOPF_H - 2.5, stroke: "#3A3F44", "stroke-width": 1 }, svg);
    // Jahreslinien
    JAHRE.forEach(j => {
      const xj = Math.round(X(tag(`${j}-01-01`))) + 0.5;
      sv("line", { x1: xj, x2: xj, y1: 0, y2: H, stroke: "#D9D9D9", "stroke-width": 1 }, svg);
    });
    // Zeilen
    rows.forEach((r, i) => {
      const y = KOPF_H + i * ZH, cy = y + ZH / 2;
      const neueGruppe = i === 0 || rows[i - 1].st !== r.st;
      if (neueGruppe && i > 0) sv("line", { x1: 0, x2: breite, y1: y - 0.5, y2: y - 0.5, stroke: "#9A9A9A", "stroke-width": 1 }, svg);
      else sv("line", { x1: 0, x2: breite, y1: y - 0.5, y2: y - 0.5, stroke: "#EFEFEF", "stroke-width": 1 }, svg);
      const blass = S.auswahl && S.auswahl.wert !== r.p;
      const g = sv("g", { class: "dk-klick" + (blass ? " dk-blass" : "") }, svg);
      sv("text", { x: 0, y: cy, dy: "0.35em" }, g, r.name);
      if (neueGruppe) sv("text", { x: SP.name, y: cy, dy: "0.35em" }, g, ST[r.st]);
      sv("text", { x: SP.name + SP.status + SP.fert - 8, y: cy, dy: "0.35em", "text-anchor": "end" }, g,
         r.fert == null ? "–" : zahl(r.fert * 100, 0) + DK.NBSP + "%");
      const kl = r.verz == null || !terminiert(r) ? "neutral" : wirkung(r.verz, -1, 0);
      sv("text", { x: SP.name + SP.status + SP.fert + SP.termin - 8, y: cy, dy: "0.35em", "text-anchor": "end",
                   style: kl === "neutral" ? "" : `fill:${FARBE[kl]}` }, g, r.verz == null || !terminiert(r) ? "–" : delta(r.verz, 0));
      if (!terminiert(r)) {
        sv("text", { x: x0 + 6, y: cy, dy: "0.35em", class: "muted" }, g, "nicht terminiert");
      } else {
        // Plan: Planungsphase hellgrau, Umsetzung weiß, gemeinsame Kontur; links offen, wenn vor 2026 begonnen
        const xb = X(r.beginn), xu = X(r.umsetzung), xe = X(r.ende), oben = y + 3, unten = y + ZH - 3;
        if (xu > xb) sv("rect", { x: xb, y: oben, width: xu - xb, height: unten - oben, fill: PLANUNGSPHASE }, g);
        sv("rect", { x: xu, y: oben, width: Math.max(0, xe - xu), height: unten - oben, fill: "#FFFFFF" }, g);
        const offenLinks = r.beginn < T0;
        const pfad = offenLinks
          ? `M${xb},${oben + 0.5}H${xe - 0.5}V${unten - 0.5}H${xb}`
          : `M${xb + 0.5},${oben + 0.5}H${xe - 0.5}V${unten - 0.5}H${xb + 0.5}Z`;
        sv("path", { d: pfad, fill: "none", stroke: "#3A3F44", "stroke-width": 1 }, g);
        // Ist bis Stichtag bzw. Ist-Ende, Vorschau bis Prognose-Ende, Überschreitung des Plan-Endes rot
        const ende = endeEff(r), istBis = r.st === ERLEDIGT ? Math.min(ende, stand) : stand;
        const b = cy - 2, h = 4;
        if (r.ist <= stand) sv("rect", { x: X(r.ist), y: b, width: Math.max(1, X(istBis) - X(r.ist)), height: h, fill: FARBE.ist }, g);
        if (offen(r) && ende > stand) sv("rect", { x: xs, y: b, width: X(ende) - xs, height: h, fill: FARBE.fc }, g);
        if (ende > r.ende) {
          const von = Math.max(r.ende, r.ist);
          sv("rect", { x: X(von), y: b, width: Math.max(1, X(ende) - X(von)), height: h, fill: FARBE.schlecht }, g);
        }
      }
      const hit = sv("rect", { x: 0, y, width: breite, height: ZH, fill: "transparent" }, g);
      hit.addEventListener("click", () => auswaehlen(r.p));
      tooltip(hit, () => tooltipProjekt(r));
    });
    sv("line", { x1: 0, x2: breite, y1: H - 0.5, y2: H - 0.5, stroke: "#EFEFEF", "stroke-width": 1 }, svg);
    // Stichtag
    sv("line", { x1: Math.round(xs) + 0.5, x2: Math.round(xs) + 0.5, y1: 15, y2: H, stroke: "#1A1A1A", "stroke-width": 1,
                 "stroke-dasharray": "3 2" }, svg);
    // Beschriftung rechts der Linie, sonst links, sonst rechts hinter der kollidierenden Jahreszahl
    const lw = tw("Stichtag", 14, true);
    const frei = a => a >= x0 && a + lw <= breite && !jahrLabels.some(([l, r]) => a < r + 4 && a + lw > l - 4);
    const kandidaten = [xs + 4, xs - 4 - lw, ...jahrLabels.map(([, r]) => r + 6).sort((u, v) => Math.abs(u - xs) - Math.abs(v - xs))];
    const lx = kandidaten.find(frei) ?? xs + 4;
    sv("text", { x: lx, y: 12, id: "zp-stichtag", style: "font-weight:bold" }, svg, "Stichtag");
    return svg;
  }
  function tooltipProjekt(r) {
    const z = [r.name, `${ST[r.st]} · ${r.verantw}`, `${GB[r.gb]} · ${FB[r.fb]}`];
    if (!terminiert(r)) return [...z, `Plan-Kosten (Grobschätzung): ${zahl(r.plan, 0)} Tsd. €`, "noch nicht terminiert", "Klick filtert das Dashboard"];
    z.push(`Plan: ${datum(r.beginn)} bis ${datum(r.ende)}`, `Plan-Beginn Umsetzung: ${datum(r.umsetzung)}`, `Ist-Beginn: ${datum(r.ist)}`);
    z.push(r.st === ERLEDIGT ? `Ist-Ende: ${datum(endeEff(r))} (${delta(r.verz, 0)} Wochen)`
                             : `Ende laut Prognose: ${datum(endeEff(r))} (${delta(r.verz, 0)} Wochen)`);
    z.push(`Fertigstellung: ${r.fert == null ? "–" : prozent(r.fert, 0)}`, "Klick filtert das Dashboard");
    return z;
  }

  /* ---------- Zeichnen ---------- */
  function zeichnen() {
    DK.kopf(bKopf, { titel: "Strategische Projektroadmap – Zeitplan",
      untertitel: `Stand ${STAENDE[S.stand]} · Plan, Ist und Vorschau je Projekt`,
      quelle: DK.NBSP,   // keine Quellenzeile (Revision DS); Platzhalter hält die Legende in der zweiten Zeile
      legende: [[PLANUNGSPHASE, "Planungsphase (PL)", "#3A3F44"], ["#FFFFFF", "Umsetzung (PL)", "#3A3F44"], [FARBE.ist, "Ist"],
                [FARBE.fc, "Vorschau"], [FARBE.gut, "günstig"], [FARBE.schlecht, "ungünstig"]] });
    DK.kpis(bKpi, kpiDaten());
    const rows = zeitplanDaten(), o = rows.filter(offen), spaet = o.filter(r => r.verz > 0);
    const max = spaet.slice().sort((a, b) => b.verz - a.verz)[0];
    const botschaft = !rows.length ? "keine Projekte in dieser Auswahl"
      : !o.length ? "keine laufenden Projekte in dieser Auswahl"
      : spaet.length ? `${spaet.length} von ${o.length} laufenden Projekten enden später als geplant, größter Verzug: ${max.name} (${delta(max.verz, 0)} Wo.)`
      : "alle laufenden Projekte enden planmäßig oder früher";
    const v = DK.visual(bZeit, { titel: "Zeitplan", einheit: "Quartale 2026–2029, ΔPL Termin in Wochen", botschaft });
    zeitplan(v.flaeche, v.breite, rows);
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  /* ---------- Lernplattform: Designregeln, Nachbau, Tabellen, CSV ---------- */
  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "v-zeitplan", regel: "SAY – Botschaft vermitteln", titel: "Kernaussage über dem Zeitplan",
        text: "Unter dem Titel steht, wie viele laufende Projekte später enden als geplant und welches den größten Verzug hat. Der Satz wird bei jedem Filter neu berechnet. Das Original zeigte nur Balken; ob ein Projekt im Plan liegt, ließ sich nicht ablesen." },
      { nr: 2, ziel: "kopf-legende", anker: "links", regel: "UNIFY – Semantische Notation", titel: "Plan umrandet, Ist dunkel, Vorschau grau",
        text: "Plantermine sind umrandete Balken (Planungsphase hellgrau, Umsetzung weiß), der Ist-Verlauf ist ein dunkler, die Vorschau ein grauer Strich. Die Überschreitung des Plan-Endes ist rot. Das Original nutzte Gelb und Grün für Phasen und Schwarz für die Durchführung – Farben ohne Bezug zu Plan und Ist." },
      { nr: 3, ziel: "zp-stichtag", anker: "links", versatz: [0, -2], regel: "UNIFY – Zeitbezug", titel: "Benannter Stichtag",
        text: "Der Stichtag ist eine beschriftete Linie und folgt dem Datenschnitt „Stand“. Im Original markierte eine unbeschriftete dünne Linie den Stichtag, der Kopf nannte nur „06-2025“." },
      { nr: 4, ziel: "sp-termin", versatz: [26, -2], regel: "CONDENSE – Informationsdichte", titel: "Zahlen neben den Balken",
        text: "Fertigstellung und Terminabweichung stehen als Zahlen in der Tabelle, die KPI-Leiste verdichtet den Stand des Portfolios. So beantwortet die Seite „wann“, „wie weit“ und „wie spät“ zugleich." },
      { nr: 5, ziel: "zp-achse", versatz: [-10, -6], regel: "CHECK – Visuelle Integrität", titel: "Tagesgenaue, lineare Zeitachse",
        text: "Balken beginnen und enden am Datum, nicht am Quartalsraster; jedes Jahr ist gleich breit. Die Achse endet 2029, weil kein Projekt später endet – das Original zeigte ein leeres Folgejahr und brauchte Bildlaufleisten." },
      { nr: 6, ziel: "v-zeitplan", versatz: [-28, 0], regel: "EXPRESS – Passende Darstellung", titel: "Zeit waagerecht",
        text: "Termine stehen auf einer waagerechten Zeitachse. Projekte mit Beginn vor 2026 sind links offen gezeichnet; die genauen Daten stehen im Tooltip." },
      { nr: 7, ziel: "kopf-titel", versatz: [26, 0], regel: "SIMPLIFY – Überflüssiges weglassen", titel: "Kein Logo, keine Navigationsknöpfe",
        text: "Logo, Info-Symbol, Farbverlauf im Kopf, hinterlegte Filterkästen und Navigationsknöpfe entfallen. Abkürzungen wie „Fixkostenmanagem.“ oder „m. Sub“ sind ausgeschrieben; „BCR-Felder“ heißt jetzt „BSC-Perspektive“." },
      { nr: 8, ziel: "zp-status", versatz: [26, -2], regel: "STRUCTURE – Inhalte ordnen", titel: "Gruppen nach Status, dann nach Beginn",
        text: "Die Projekte sind nach Status gruppiert – Umsetzung, Planung, Idee, erledigt, wie in der Übersicht (Abb. 3.5) – und innerhalb der Gruppe nach geplantem Beginn sortiert. Im Original standen die Status gemischt." },
    ],
    nachbauIntro: "Alle Elemente sind Standard-Visuals von Power BI Desktop. Ein Gantt-Diagramm ist kein Standard-Visual; es entsteht hier aus zwei deckungsgleichen gestapelten Balkendiagrammen. Seitengröße benutzerdefiniert 1024 × 646 px. Schrift Arial: Beschriftungen 10,5 pt, Visualtitel 12 pt, Kennzahlen 19,5 pt.",
    nachbau: [
      { id: "A", ziel: "kopf-titel", versatz: [26, 0], titel: "Kopfzeile und Legende", visual: "Textfeld; Formen (Rechteck)",
        felder: "Untertitel mit dynamischem Wert: Measure „Stand Text“",
        format: "Titel 16,5 pt fett; Legende: Rechtecke 9 × 9 px (Planungsphase #D4D4D4, Umsetzung weiß, beide mit Rahmen #3A3F44)" },
      { id: "B", ziel: "filter", titel: "Datenschnitte", visual: "Datenschnitt (Stil Kacheln bzw. Dropdown)",
        felder: "Stand (Quartal), Geschäftsbereich, Funktionsbereich, BSC-Perspektive",
        format: "Ausgewählt: Füllung #3A3F44, Schrift weiß; nicht ausgewählt: weiß, Rahmen #9A9A9A",
        hinweis: "Gleiche Datenschnitte wie die Übersicht (Abb. 3.5); mit „Datenschnitte synchronisieren“ wirken sie auf beiden Seiten." },
      { id: "C", ziel: "kpis", versatz: [0, 50], titel: "KPI-Leiste", visual: "Karte (neu) mit 6 Measures",
        felder: "Projekte, In Umsetzung, Ø Fertigstellung (kostengewichtet), Im Terminverzug, Ø Terminverzug (Wochen), Enden in 12 Monaten; Referenzbeschriftung ΔVQ",
        format: "Referenzbeschriftung: bedingte Formatierung nach Feldwert (Farb-Measure liefert #00806B, #C62828 oder #1A1A1A)" },
      { id: "D", ziel: "sp-projekt", versatz: [40, -2], titel: "Projekttabelle", visual: "Tabelle",
        felder: "Projekt, Status, Fertigstellung, Terminverzug (Wochen)",
        format: "Schriftfarbe Terminverzug bedingt: > 0 #C62828, < 0 #00806B; Zeilenhöhe wie die Balken im Zeitplan (kompakt, 10,5 pt); Status als Sortierspalte, dann Plan-Beginn",
        hinweis: "Tabelle und Balkendiagramme müssen dieselbe Sortierung und Zeilenzahl haben, damit die Zeilen fluchten." },
      { id: "E", ziel: "zp-achse", versatz: [-10, -6], titel: "Zeitplan – Plan", visual: "Gestapeltes Balkendiagramm",
        felder: "Y-Achse: Projekt (Achse ausgeblendet); X-Achse: Tage ab 01.01.2026; Werte: Offset Plan, Planungsphase, Umsetzung",
        format: "Offset ohne Füllung; Planungsphase #D4D4D4, Umsetzung #FFFFFF, beide Rahmen #3A3F44 1 px; X-Achse fest 0 bis 1461 (bis 31.12.2029), vertikale Gitternetzlinien je Jahr #D9D9D9",
        hinweis: "Offset Plan = DATEDIFF(DATE(2026;1;1); MIN(Termine[Plan_Beginn]); DAY), Planungsphase = DATEDIFF(Plan_Beginn; Plan_Beginn_Umsetzung; DAY), Umsetzung = DATEDIFF(Plan_Beginn_Umsetzung; Plan_Ende; DAY)." },
      { id: "F", ziel: "zp-stichtag", anker: "links", versatz: [0, -2], titel: "Zeitplan – Ist und Vorschau", visual: "Zweites gestapeltes Balkendiagramm, deckungsgleich darüber",
        felder: "Werte: Offset Ist, Ist (Ist-Beginn bis Stichtag), Vorschau (Stichtag bis Prognose-Ende, ohne Überschreitung), Verzug (Plan-Ende bis Prognose-Ende)",
        format: "Hintergrund transparent, innerer Abstand ca. 75 % (dünne Balken); Offset ohne Füllung, Ist #3A3F44, Vorschau #8F8F8F, Verzug #C62828; X-Achse fest wie E; X-Konstantenlinie „Stichtag“ gestrichelt #1A1A1A",
        hinweis: "Prognose-Ende = Plan-Ende + Terminverzug × 7 Tage; der Stichtag kommt aus dem Datenschnitt Stand (SELECTEDVALUE)." },
      { id: "G", ziel: "v-zeitplan", versatz: [-28, 0], titel: "Kernaussage", visual: "Textfeld mit dynamischem Wert",
        felder: "Text-Measure aus „Im Terminverzug“, Anzahl laufender Projekte und TOPN(1; Projekte; [Terminverzug])",
        format: "10,5 pt, #4D4D4D" },
    ],
    theme: DK.thema(),
    csv: { name: "projektroadmap_zeitplan_beispieldaten.csv", text: () => {
      const kopf = "Stand;Projekt_ID;Projekt;Status;Verantwortung;Geschäftsbereich;Funktionsbereich;BSC_Perspektive;Plan_Kosten_TEUR;Plan_Beginn;Plan_Beginn_Umsetzung;Plan_Ende;Ist_Beginn;Ende_Prognose_bzw_Ist;Terminverzug_Wochen;Fertigstellung_Prozent";
      return [kopf, ...R.map(r => {
        const t = terminiert(r);
        return [STAENDE[r.q], r.p + 1, r.name, ST[r.st], r.verantw, GB[r.gb], FB[r.fb], BSC[r.bsc], r.plan,
          t ? datum(r.beginn) : "", t ? datum(r.umsetzung) : "", t ? datum(r.ende) : "", t ? datum(r.ist) : "",
          t ? datum(endeEff(r)) : "", t ? r.verz : "", r.fert == null ? "" : Math.round(r.fert * 100)].join(";");
      })].join("\r\n"); } },
    tabellen: () => [
      { titel: "KPI-Leiste", kopf: ["Kennzahl", "Ist", "ΔVQ"], zeilen: kpiDaten().map(k => [k.label, k.wert + (k.einheit ? " " + k.einheit : ""), k.delta]) },
      { titel: `Zeitplan zum ${STAENDE[S.stand]}`, kopf: ["Projekt", "Status", "Plan-Beginn", "Beginn Umsetzung", "Plan-Ende", "Ist-Beginn", "Ende (Prognose/Ist)", "ΔPL Termin (Wo.)", "Fertigst."],
        zeilen: zeitplanDaten().map(r => terminiert(r)
          ? [r.name, ST[r.st], datum(r.beginn), datum(r.umsetzung), datum(r.ende), datum(r.ist), datum(endeEff(r)), delta(r.verz, 0), r.fert == null ? "–" : prozent(r.fert, 0)]
          : [r.name, ST[r.st], "–", "–", "–", "–", "–", "–", "–"]) },
    ],
  });
  zeichnen();
})();
