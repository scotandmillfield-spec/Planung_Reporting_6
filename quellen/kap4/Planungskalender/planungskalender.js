/* Dashboard „Planungskalender“ (Abb. 4.11).
   Daten: planungskalender.json (daten_planungskalender.py) – Strategische Planung, Budgetierung 2027 mit 19 Teilplänen
   und Mehrjahresplanung, Termine 2026 aus dem Original (Wochentage erhalten), Stichtag 16.10.2026.
   Gleiche Gestaltung wie der Reportingkalender (Abb. 4.15 und 4.16) und der Reporting- und Planungskalender (Abb. 3.12):
   links die Vorgangstabelle (Vorgang, Dauer, Anfang, Ende, Status), rechts die Zeitachse mit Plan, Ist und Verzug.
   Status je Vorgang aus Plan-Ende, Ist-Ende und Stichtag (gleiche Regel wie der Generator). */
(() => {
  "use strict";
  const { FARBE, sv, tw, el } = DK;
  const CFG = {
    titel: "Planungskalender",
    untertitel: s => `Strategische Planung, Budgetierung 2027 und Mehrjahresplanung · Stichtag ${s}`,
    visualTitel: "Termine",
    einheit: () => "Plan 2026 nach Kalenderwochen, Dauer in Arbeitstagen",
    aria: "Planungskalender: Vorgänge der Planung 2026 auf einer Zeitachse",
    datumMitJahr: false,
    csvName: "planungskalender_daten.csv",
    regeln: [
      { nr: 1, ziel: "v-kalender", anker: "links", versatz: [507, 3], regel: "SAY – Botschaft vermitteln", titel: "Kernaussage über dem Kalender",
        text: "Unter dem Titel steht, welcher Teilplan zum Stichtag überfällig ist, welcher verspätet fertig wurde und wie viele planmäßig laufen. Der Satz folgt den Datenschnitten. Der Bildschirmausschnitt des Originals zeigte nur Balken – ob die Planung im Zeitplan liegt, war nicht zu sehen." },
      { nr: 2, ziel: "kopf-legende", anker: "links", regel: "UNIFY – Semantische Notation", titel: "Plan, Ist und Verzug",
        text: "Plantermine sind weiße Balken mit Kontur, der Ist-Verlauf ist anthrazit, Verzug rot – wie im Reporting- und Planungskalender (Abb. 3.12) und in der Roadmap (Abb. 3.3). Das Original zeichnete jeden Vorgang als schwarzen Sammelbalken mit Endmarken; Plan und Ist ließen sich nicht unterscheiden." },
      { nr: 3, ziel: "sp-dauer", anker: "links", versatz: [0, -2], regel: "CONDENSE – Informationsdichte", titel: "Termine als Zahlen neben dem Balken",
        text: "Dauer in Arbeitstagen, Anfang und Ende stehen in eigenen Spalten wie in der Vorgangstabelle einer Projektsoftware – so bleiben die Termine auch im Druck ablesbar. Die Vorgangsnummern des Originals (77, 83, 84 …) entfallen." },
      { nr: 4, ziel: "kal-achse", anker: "links", versatz: [150, -2], regel: "CHECK – Visuelle Integrität", titel: "Lineare, tagesgenaue Zeitachse",
        text: "Jede Kalenderwoche ist gleich breit, Balken beginnen und enden am Tag. Die Achse reicht von der strategischen Planung bis zur Veröffentlichung des Budgets; der Datenschnitt Zeitraum vergrößert einen Monat. Das Original zeigte Wochenspalten bis in den Dezember mit leerem Rand." },
      { nr: 5, ziel: "kal-stichtag", anker: "links", versatz: [0, -2], regel: "EXPRESS – Passende Darstellung", titel: "Stichtag und Status",
        text: "Die gestrichelte Linie trennt Erledigtes von Kommendem; der Status steht als Wort in der Tabelle, „überfällig“ rot. Verzug in Arbeitstagen und Ist-Termine stehen im Tooltip und unter „Werte als Tabelle“." },
      { nr: 6, ziel: "kopf-titel", versatz: [26, 0], regel: "SIMPLIFY – Überflüssiges weglassen", titel: "Keine Programmoberfläche",
        text: "Titel-, Menü- und Symbolleisten, die Ansichtsleiste links, Bildlaufleisten, Statuszeile und Taskleiste des Originals entfallen, ebenso der Produktname: Der Kalender ist softwareneutral und lässt sich mit jedem Projekt- oder BI-Werkzeug bauen." },
      { nr: 7, ziel: "sp-vorgang", versatz: [36, -2], regel: "STRUCTURE – Inhalte ordnen", titel: "Gliederung wie im Original",
        text: "Strategische Planung, Budgetierung mit ihren 19 Teilplänen in der Abfolge der Planung und Mehrjahresplanung stehen untereinander; +/− klappt die Budgetierung zu. Schreibfehler wie „Ergebnispanungplanung“ sind korrigiert." },
    ],
    nachbauIntro: "Alle Elemente sind Standard-Visuals von Power BI Desktop. Ein Gantt-Diagramm ist kein Standard-Visual; der Kalender entsteht als eine Matrix, deren Spalten erst die Vorgangsdaten und dann die Tage bzw. Wochen tragen, mit bedingter Hintergrundfarbe. Seitengröße benutzerdefiniert 1024 × 646 px. Schrift Arial: Beschriftungen 10,5 pt, Visualtitel 12 pt, Berichtstitel 16,5 pt.",
    nachbau: [
      { id: "A", ziel: "kopf-titel", versatz: [26, 0], titel: "Kopfzeile und Legende", visual: "Textfeld; Formen (Rechteck)",
        felder: "Untertitel mit dynamischem Wert: Measure „Stichtag Text“",
        format: "Titel 16,5 pt fett; Legende: Rechtecke 9 × 9 px (Plan weiß mit Rahmen #3A3F44, Ist #3A3F44, Verzug #C62828)" },
      { id: "B", ziel: "filter", anker: "links", versatz: [742, 28], titel: "Datenschnitte", visual: "Datenschnitt (Stil Kacheln)",
        felder: "Zeitraum (berechnete Spalte der Datumstabelle: Monat bzw. „Aug.–Nov.“), Status zum Stichtag",
        format: "Ausgewählt: Füllung #3A3F44, Schrift weiß; nicht ausgewählt: weiß, Rahmen #9A9A9A",
        hinweis: "Status als berechnete Spalte: SWITCH(TRUE(); Vorgang[Ist_Ende] <= [Stichtag]; \"erledigt\"; Vorgang[Plan_Ende] < [Stichtag]; \"überfällig\"; Vorgang[Plan_Anfang] <= [Stichtag]; \"läuft\"; \"offen\")." },
      { id: "C", ziel: "sp-vorgang", versatz: [36, -2], titel: "Kalender – Vorgangstabelle", visual: "Matrix, Layout „Abgestuft“, Plus-/Minus-Symbole an",
        felder: "Zeilen: Gruppe, Vorgang (Hierarchie); Spalten: Tabelle „Kalenderspalten“ (ohne Beziehung) mit den Einträgen Dauer, Anfang, Ende, Status und danach je Tag eine Spalte, sortiert nach Spaltennummer; Werte: Measure „Zelle“",
        format: "Zeilenüberschriften 10,5 pt, oberste Ebene fett; Text-Measure „Zelle“ liefert für die ersten vier Spalten Dauer (NETWORKDAYS), Anfang und Ende (FORMAT „TT.MM.“) und Status; „überfällig“ per bedingter Schriftfarbe #C62828",
        hinweis: "Auf Gruppenebene nimmt „Zelle“ MIN(Plan_Anfang) und MAX(Plan_Ende) der Teilpläne; ISINSCOPE(Vorgang[Vorgang]) unterscheidet die Ebenen." },
      { id: "D", ziel: "kal-achse", anker: "links", versatz: [150, -2], titel: "Kalender – Zeitachse", visual: "Dieselbe Matrix, Spalten ab Nummer 5 aus der Datumstabelle",
        felder: "Measure „Zelle“ liefert in den Tagesspalten einen Code: 1 Plan, 2 Ist, 3 Verzug, leer außerhalb des Vorgangs",
        format: "Bedingte Formatierung Hintergrund nach Feldwert über Measure „Zellfarbe“ (Plan #EFEFEF, da weiß mit Rahmen nicht möglich; Ist #3A3F44; Verzug #C62828); Schriftfarbe = Hintergrund; Spaltenbreite 4 px, Spaltenüberschrift Kalenderwoche",
        hinweis: "Tagesraster statt freier Balken. Zugeklappt zeigt die Budgetierung die Spanne vom ersten Beginn bis zum letzten Ende." },
      { id: "E", ziel: "kal-stichtag", anker: "links", versatz: [0, -2], titel: "Stichtag", visual: "Bedingte Formatierung der Spalte bzw. Textfeld",
        felder: "Measure „Stichtag“ (Datum)", format: "Tagesspalte des Stichtags mit Rahmen rechts #1A1A1A; Beschriftung „Stichtag“ fett als Textfeld über der Matrix" },
      { id: "F", ziel: "v-kalender", anker: "links", versatz: [507, 3], titel: "Kernaussage", visual: "Textfeld mit dynamischem Wert",
        felder: "Text-Measure aus TOPN(1; FILTER(Vorgang; [Status] = \"überfällig\"); [Verzug]) und der Anzahl laufender Vorgänge",
        format: "10,5 pt, #4D4D4D" },
    ],
  };

  /* ---------- Datum, Arbeitstage ---------- */
  const tag = iso => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) / 864e5;
  const p2 = n => String(n).padStart(2, "0");
  const D = t => new Date(t * 864e5);
  const WT = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
  const MONATE = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
  const wt = t => WT[D(t).getUTCDay()];
  const dm = t => p2(D(t).getUTCDate()) + "." + p2(D(t).getUTCMonth() + 1) + ".";
  const dmy = t => dm(t) + D(t).getUTCFullYear();
  const datum = CFG.datumMitJahr ? t => dm(t) + String(D(t).getUTCFullYear()).slice(2) : dm;
  const FREI = new Set(DATA.feiertage.map(tag));
  const istAT = t => { const w = D(t).getUTCDay(); return w > 0 && w < 6 && !FREI.has(t); };
  const anzahlAT = (b, e) => { let n = 0; for (let t = b; t <= e; t++) if (istAT(t)) n++; return n; };
  const kw = t => {             // Kalenderwoche nach ISO 8601
    const d = D(t), wd = (d.getUTCDay() + 6) % 7, don = t - wd + 3;
    const j = D(don).getUTCFullYear();
    return 1 + Math.floor((don - tag(`${j}-01-01`)) / 7);
  };
  const STICH = tag(DATA.stichtag);
  const atText = n => `${n} ${n === 1 ? "Arbeitstag" : "Arbeitstage"}`;

  /* ---------- Baum ---------- */
  const K = DATA.knoten.map(([id, parent, name, b, e, ist, serie]) =>
    ({ id, parent, name, b: b && tag(b), e: e && tag(e), ist: ist && tag(ist), serie, kinder: [] }));
  const M = new Map(K.map(k => [k.id, k]));
  K.forEach(k => { k.eltern = k.parent ? M.get(k.parent) : null; if (k.eltern) k.eltern.kinder.push(k); });
  K.forEach(k => { k.ebene = k.eltern ? k.eltern.ebene + 1 : 0; });
  const gruppe = k => k.kinder.length > 0;
  // Nur eine Wurzel (Abb. 4.16): deren Auswahl hätte keine Wirkung – Klick auf die Zeile klappt stattdessen auf und zu
  const nurKlappen = k => !k.eltern && K.filter(x => !x.eltern).length === 1;
  const BLATT = K.filter(k => !gruppe(k));
  const blaetter = k => (gruppe(k) ? k.kinder.flatMap(blaetter) : [k]);
  const pfad = k => (k.eltern ? [...pfad(k.eltern), k.name] : [k.name]);
  const unter = (k, a) => { for (let x = k; x; x = x.eltern) if (x === a) return true; return false; };
  K.filter(gruppe).forEach(k => { const bl = blaetter(k); k.b = Math.min(...bl.map(x => x.b)); k.e = Math.max(...bl.map(x => x.e)); });
  BLATT.forEach(k => {
    k.st = k.ist != null && k.ist <= STICH ? "erledigt" : k.e < STICH ? "überfällig" : k.b <= STICH ? "läuft" : "offen";
    // Verzug in Arbeitstagen: erledigt nach Plan-Ende bzw. überfällig bis zum Stichtag
    k.verzug = k.ist != null && k.ist > k.e ? anzahlAT(k.e + 1, k.ist) : k.st === "überfällig" ? anzahlAT(k.e + 1, STICH) : 0;
  });
  const STATUS = ["offen", "läuft", "überfällig", "erledigt"];
  const ZR = DATA.zeitraeume.map(([key, text, a, b]) => ({ key, text, t0: tag(a), t1: tag(b) }));

  /* ---------- Zustand ---------- */
  const S = { zr: ZR[0].key, status: "alle", achse: "kalender", auswahl: null, auf: new Set(DATA.auf) };
  const fenster = () => ZR.find(z => z.key === S.zr);
  const sichtbar = k => { const z = fenster(); return (S.status === "alle" || k.st === S.status) && k.e >= z.t0 && k.b < z.t1; };
  function zeilen() {
    const out = [];
    const besuch = k => {
      const bl = blaetter(k).filter(sichtbar);
      if (!bl.length) return;
      const auf = gruppe(k) && S.auf.has(k.id);
      out.push({ k, bl, auf });
      if (auf) k.kinder.forEach(besuch);
    };
    K.filter(k => !k.eltern).forEach(besuch);
    return out;
  }
  const sammelStatus = bl => (bl.some(b => b.st === "überfällig") ? "überfällig" : bl.every(b => b.st === "erledigt") ? "erledigt"
    : bl.every(b => b.st === "offen") ? "offen" : "läuft");
  function auswaehlen(id) { S.auswahl = S.auswahl === id ? null : id; zeichnen(); }
  function umschalten(id) { if (S.auf.has(id)) S.auf.delete(id); else S.auf.add(id); zeichnen(); }
  addEventListener("keydown", e => { if (e.key === "Escape" && S.auswahl) { S.auswahl = null; zeichnen(); } });

  /* ---------- Layout (Seite 1024 x 646, ohne KPI-Leiste wie Abb. 3.12) ---------- */
  DK.init({ titel: CFG.titel });
  const bKopf = DK.box("kopf", 16, 10, 992, 46);
  DK.haarlinie(62);
  const bFilter = DK.box("filter", 16, 68, 992, 50, "dk-filter");
  DK.haarlinie(128);
  const bKal = DK.box("v-kalender", 16, 138, 992, 504);

  /* ---------- Tooltip (gleiches Verhalten wie die Bausteine von DK) ---------- */
  const tip = document.querySelector(".dk-tooltip");
  function tooltip(ziel, zeilenFn) {
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

  /* ---------- Datenschnitte ---------- */
  if (ZR.length > 1) DK.schnitt(bFilter, "Zeitraum", "knoepfe", { optionen: ZR.map(z => [z.key, z.text]), wert: S.zr,
    onChange: v => { S.zr = v; zeichnen(); } });
  if (CFG.achsenWahl) DK.schnitt(bFilter, "Zeitachse", "knoepfe", { optionen: [["kalender", "Kalendertage"], ["arbeit", "Arbeitstage"]],
    wert: S.achse, onChange: v => { S.achse = v; zeichnen(); } });
  DK.schnitt(bFilter, "Status zum Stichtag", "knoepfe", { optionen: [["alle", "Alle"], ...STATUS.map(s => [s, s])], wert: "alle",
    onChange: v => { S.status = v; S.auswahl = null; zeichnen(); } });

  /* ---------- Kalender: Vorgangstabelle + Zeitachse ---------- */
  const ZH = 19, EINZUG = 12, TEXT_X = 14, PLAN_RAND = "#3A3F44";
  const BEISPIEL = datum(tag("2026-12-28"));
  const SP_V = Math.ceil(Math.max(...K.map(k => k.ebene * EINZUG + TEXT_X + tw(k.name, 14, k.ebene === 0)))) + 14;
  const SP_D = Math.ceil(Math.max(tw("Dauer"), tw("99"))) + 14;
  const SP_A = Math.ceil(Math.max(tw("Anfang"), tw(BEISPIEL))) + 16;
  const SP_E = Math.ceil(Math.max(tw("Ende"), tw(BEISPIEL))) + 16;
  const SP_S = Math.ceil(Math.max(tw("Status"), ...STATUS.map(s => tw(s)))) + 12;
  const XD = SP_V + SP_D - 10, XA = SP_V + SP_D + 6, XE = XA + SP_A, XS = XE + SP_E;

  function kalender(ziel, breite, hoehe, rows) {
    const { t0: T0, t1: T1 } = fenster();
    const at = S.achse === "arbeit";
    // Position eines Tagesanfangs: Kalendertage linear; Arbeitstage zählen nur Arbeitstage (Wochenende ohne Breite)
    const kum = [0];
    for (let t = T0; t < T1; t++) kum.push(kum[kum.length - 1] + (!at || istAT(t) ? 1 : 0));
    const U = kum[kum.length - 1], x0 = XS + SP_S + 4;
    // Einheit nach verfügbarer Breite – Tage (Kopf dreizeilig: KW, Wochentag, Tag), Kalenderwochen oder Monate
    const pxTag0 = (breite - 14 - x0) / U;
    const einheit = pxTag0 >= 24 ? "tag" : pxTag0 * (at ? 5 : 7) >= 18 ? "woche" : "monat";
    const KOPF_H = einheit === "tag" ? 53 : 36, kopfY = KOPF_H - 7;
    const H = rows.length * ZH, scroll = !DK.PRINT && KOPF_H + H > hoehe;
    const W = scroll ? breite - 12 : breite;
    const x1 = W - 2, pxTag = (x1 - x0) / U;
    const X = t => x0 + kum[Math.min(Math.max(t, T0), T1) - T0] * pxTag;
    const box = el("div", { style: `position:absolute;inset:0;overflow-x:hidden;overflow-y:${scroll ? "auto" : "hidden"};scrollbar-width:thin` }, ziel);
    const kopf = sv("svg", { width: W, height: KOPF_H, style: "position:sticky;top:0;background:#FFFFFF;z-index:1;display:block" }, box);
    const svg = sv("svg", { width: W, height: H + 1, role: "img", "aria-label": CFG.aria, style: "display:block" }, box);

    // Spaltenköpfe
    sv("text", { x: 0, y: kopfY, class: "muted", id: "sp-vorgang" }, kopf, "Vorgang");
    sv("text", { x: XD, y: kopfY, class: "muted", id: "sp-dauer", "text-anchor": "end" }, kopf, "Dauer");
    sv("text", { x: XA, y: kopfY, class: "muted", id: "sp-anfang" }, kopf, "Anfang");
    sv("text", { x: XE, y: kopfY, class: "muted", id: "sp-ende" }, kopf, "Ende");
    sv("text", { x: XS, y: kopfY, class: "muted", id: "sp-status" }, kopf, "Status");

    // Zeitachse: Einheit nach verfügbarer Breite – Tage, Kalenderwochen oder Monate
    const linienK = sv("g", {}, kopf);                // Linien im Kopf liegen unter den Achsentexten
    const HALO = "paint-order:stroke;stroke:#FFFFFF;stroke-width:4px;stroke-linejoin:round";
    const achse = sv("g", { id: "kal-achse", style: HALO }, kopf);
    const mehrjahr = D(T0).getUTCFullYear() !== D(T1 - 1).getUTCFullYear();
    const oben = [];                                   // Beschriftungen der oberen Zeile [links, rechts]
    const obenText = (x, text) => { const w = tw(text); if (x + w > x1) return; oben.push([x, x + w, sv("text", { x, y: 12 }, achse, text)]); };
    const linie = (x, y1, farbe, beide = true, y2 = KOPF_H) => {
      const xr = Math.round(x) + 0.5;
      sv("line", { x1: xr, x2: xr, y1, y2, stroke: farbe, "stroke-width": 1 }, linienK);
      if (beide) sv("line", { x1: xr, x2: xr, y1: 0, y2: H, stroke: farbe, "stroke-width": 1 }, svg);
    };
    if (einheit === "tag") {
      for (let t = T0; t < T1; t++) {
        if (!istAT(t) && !at) sv("rect", { x: X(t), y: 0, width: X(t + 1) - X(t), height: H, fill: "#EFEFEF" }, svg);
      }
      for (let t = T0; t < T1; t++) {
        if (at && !istAT(t)) continue;
        const wochenanfang = t === T0 || D(t).getUTCDay() === 1;
        if (t > T0) linie(X(t), wochenanfang ? 0 : 17, wochenanfang ? "#C9C9C9" : "#E3E3E3");
        if (wochenanfang) obenText(X(t) + 4, "KW " + kw(t));
        sv("text", { x: (X(t) + X(t + 1)) / 2, y: 29, "text-anchor": "middle", class: "muted" }, achse, wt(t));
        sv("text", { x: (X(t) + X(t + 1)) / 2, y: kopfY, "text-anchor": "middle", class: "muted" }, achse, D(t).getUTCDate() + ".");
      }
    } else if (einheit === "woche") {
      for (let t = T0; t < T1; t++) {
        const d = D(t);
        if (d.getUTCDate() === 1 || t === T0) {
          const naechster = tag(d.getUTCMonth() === 11 ? `${d.getUTCFullYear() + 1}-01-01` : `${d.getUTCFullYear()}-${p2(d.getUTCMonth() + 2)}-01`);
          const text = MONATE[d.getUTCMonth()] + (mehrjahr && (d.getUTCMonth() === 0 || t === T0) ? " " + d.getUTCFullYear() : "");
          if (X(Math.min(naechster, T1)) - X(t) >= tw(text) + 8) {
            if (t > T0) linie(X(t), 0, "#C9C9C9", false, 17);
            obenText(X(t) + 4, text);
          }
        }
        if (t === T0 || d.getUTCDay() === 1) {
          let e = t + 1; while (e < T1 && D(e).getUTCDay() !== 1) e++;
          if (t > T0) linie(X(t), 17, "#E3E3E3");
          const w = X(e) - X(t), text = w >= 46 ? "KW " + kw(t) : String(kw(t));
          if (w >= tw(text) + 2) sv("text", { x: (X(t) + X(e)) / 2, y: kopfY, "text-anchor": "middle", class: "muted" }, achse, text);
        }
      }
    } else {
      for (let t = T0; t < T1; t++) {
        const d = D(t);
        if (d.getUTCDate() !== 1 && t !== T0) continue;
        if (t > T0) linie(X(t), 17, "#E3E3E3");
        if (d.getUTCMonth() === 0 || t === T0) obenText(X(t) + 4, String(d.getUTCFullYear()));
        const e = tag(d.getUTCMonth() === 11 ? `${d.getUTCFullYear() + 1}-01-01` : `${d.getUTCFullYear()}-${p2(d.getUTCMonth() + 2)}-01`);
        const mw = X(Math.min(e, T1)) - X(t), mt = mw >= tw("Mär") + 10 ? MONATE[d.getUTCMonth()] : MONATE[d.getUTCMonth()][0];
        sv("text", { x: (X(t) + X(Math.min(e, T1))) / 2, y: kopfY, "text-anchor": "middle", class: "muted" }, achse, mt);
      }
    }
    sv("line", { x1: 0, x2: W, y1: KOPF_H - 0.5, y2: KOPF_H - 0.5, stroke: "#3A3F44", "stroke-width": 1 }, kopf);

    // Stichtag (Ende des Stichtags), Beschriftung rechts der Linie, sonst links; verdeckte Achsentexte entfallen
    const mitStich = STICH + 1 > T0 && STICH + 1 < T1;
    const xs = Math.round(X(STICH + 1)) + 0.5;
    if (mitStich) {
      sv("line", { x1: xs, x2: xs, y1: 15, y2: KOPF_H, stroke: "#1A1A1A", "stroke-width": 1, "stroke-dasharray": "3 2" }, linienK);
      const lw = tw("Stichtag", 14, true);
      const frei = a => a >= x0 && a + lw <= W && !oben.some(([l, r]) => a < r + 4 && a + lw > l - 4);
      const lx = [xs + 4, xs - 4 - lw].find(frei) ?? (xs + 4 + lw <= W ? xs + 4 : xs - 4 - lw);
      oben.filter(([l, r]) => lx < r + 4 && lx + lw > l - 4).forEach(([, , n]) => n.remove());
      sv("text", { x: lx, y: 12, id: "kal-stichtag", style: "font-weight:bold;" + HALO }, kopf, "Stichtag");
    }

    // Balken: Plan weiß mit Kontur, Ist anthrazit bis Erledigung bzw. Stichtag, Verzug rot
    function balken(g, k, cy) {
      if (k.e < T0 || k.b >= T1) return;
      const h = 10, o = cy - h / 2, xb = X(k.b), xe = Math.max(X(k.e + 1), xb + 2), st = k.st;
      sv("rect", { x: xb, y: o, width: xe - xb, height: h, fill: "#FFFFFF" }, g);
      const istBis = st === "erledigt" ? Math.min(k.ist, k.e) + 1 : st === "läuft" ? STICH + 1 : st === "überfällig" ? k.e + 1 : null;
      if (istBis != null) sv("rect", { x: xb, y: o, width: Math.max(2, X(istBis) - xb), height: h, fill: FARBE.ist }, g);
      if (k.verzug > 0) {
        const a = X(k.e + 1), b = X(k.st === "erledigt" ? k.ist + 1 : STICH + 1);
        sv("rect", { x: a, y: o, width: Math.max(2, b - a), height: h, fill: FARBE.schlecht }, g);
      }
      const offenL = k.b < T0, offenR = k.e + 1 > T1;
      const d = `M${offenL ? xb : xb + 0.5},${o + 0.5}H${xe - 0.5}` + (offenR ? `M${xe - 0.5},${o + h - 0.5}` : `V${o + h - 0.5}`) +
                `H${offenL ? xb : xb + 0.5}` + (offenL ? "" : "Z");
      sv("path", { d, fill: "none", stroke: PLAN_RAND, "stroke-width": 1 }, g);
    }
    // Klammer einer Gruppe: vom ersten Beginn bis zum letzten Ende
    function klammer(g, bl, cy) {
      const b = Math.min(...bl.map(x => x.b)), e = Math.max(...bl.map(x => x.e)) + 1;
      if (e <= T0 || b >= T1) return;
      const xb = X(b), xe = X(e), y = cy - 2;
      sv("path", { d: `${b < T0 ? `M${xb},${y}` : `M${xb + 0.75},${cy + 4}V${y}`}H${xe - 0.75}${e > T1 ? "" : `V${cy + 4}`}`,
        fill: "none", stroke: "#3A3F44", "stroke-width": 1.5 }, g);
    }

    rows.forEach((z, i) => {
      const { k, bl, auf } = z, y = i * ZH, cy = y + ZH / 2;
      if (i > 0) sv("line", { x1: 0, x2: W, y1: y - 0.5, y2: y - 0.5, stroke: k.ebene === 0 ? "#9A9A9A" : "#EFEFEF", "stroke-width": 1 }, svg);
      const sel = S.auswahl && M.get(S.auswahl);
      const blass = sel && !(unter(k, sel) || unter(sel, k));
      const g = sv("g", { class: (nurKlappen(k) ? "" : "dk-klick") + (blass ? " dk-blass" : ""), id: "z-" + k.id }, svg);
      const fett = k.ebene === 0 ? "font-weight:bold" : "";
      sv("text", { x: k.ebene * EINZUG + TEXT_X, y: cy, dy: "0.35em", id: "t-" + k.id, style: fett }, g, k.name);
      sv("text", { x: XD, y: cy, dy: "0.35em", "text-anchor": "end" }, g, String(anzahlAT(k.b, k.e)));
      sv("text", { x: XA, y: cy, dy: "0.35em" }, g, datum(k.b));
      sv("text", { x: XE, y: cy, dy: "0.35em" }, g, datum(k.e));
      const st = gruppe(k) ? (auf ? "" : sammelStatus(bl)) : k.st;
      if (st) sv("text", { x: XS, y: cy, dy: "0.35em", style: st === "überfällig" ? `fill:${FARBE.schlecht}` : "" }, g, st);
      if (!gruppe(k)) balken(g, k, cy);
      else if (k.serie && !auf) bl.forEach(b => balken(g, b, cy));
      else klammer(g, bl, cy);
      const hit = sv("rect", { x: 0, y, width: W, height: ZH, fill: "transparent", style: "cursor:pointer" }, g);
      hit.addEventListener("click", () => (nurKlappen(k) ? umschalten(k.id) : auswaehlen(k.id)));
      tooltip(hit, () => tooltipZeile(k, bl, auf));
      if (gruppe(k)) {
        const ix = k.ebene * EINZUG + 0.5, iy = Math.round(cy - 4.5) + 0.5;
        const ic = sv("g", { class: "dk-klick", id: "i-" + k.id, "aria-label": auf ? "zuklappen" : "aufklappen" }, g);
        sv("rect", { x: ix - 2, y: iy - 2, width: 13, height: 13, fill: "#FFFFFF", "fill-opacity": 0 }, ic);
        sv("rect", { x: ix, y: iy, width: 9, height: 9, fill: "#FFFFFF", stroke: "#8C8C8C", "stroke-width": 1 }, ic);
        sv("line", { x1: ix + 2, x2: ix + 7, y1: iy + 4.5, y2: iy + 4.5, stroke: "#3A3F44", "stroke-width": 1 }, ic);
        if (!auf) sv("line", { x1: ix + 4.5, x2: ix + 4.5, y1: iy + 2, y2: iy + 7, stroke: "#3A3F44", "stroke-width": 1 }, ic);
        ic.addEventListener("click", ev => { ev.stopPropagation(); umschalten(k.id); });
      }
    });
    sv("line", { x1: 0, x2: W, y1: H + 0.5, y2: H + 0.5, stroke: "#EFEFEF", "stroke-width": 1 }, svg);
    if (mitStich) sv("line", { x1: xs, x2: xs, y1: 0, y2: H, stroke: "#1A1A1A", "stroke-width": 1, "stroke-dasharray": "3 2" }, svg);
  }

  /* ---------- Tooltip, Botschaft ---------- */
  function zaehlen(bl) {
    const n = s => bl.filter(b => b.st === s).length;
    return [["erledigt", n("erledigt")], ["laufend", n("läuft")], ["offen", n("offen")], ["überfällig", n("überfällig")]]
      .filter(([, v]) => v).map(([t, v]) => `${v} ${t}`).join(", ");
  }
  function tooltipZeile(k, bl, auf) {
    const klick = nurKlappen(k) ? ["Klick klappt auf und zu"] : gruppe(k) ? ["+/− klappt auf und zu", "Klick hebt hervor"] : ["Klick hebt hervor"];
    const ort = k.eltern ? [pfad(k).slice(0, -1).join(" › ")] : [];
    const plan = `Plan: ${wt(k.b)} ${dmy(k.b)} bis ${wt(k.e)} ${dmy(k.e)} (${atText(anzahlAT(k.b, k.e))})`;
    if (gruppe(k)) return [k.name, ...ort, plan, `${bl.length} ${bl.length === 1 ? "Vorgang" : "Vorgänge"}: ${zaehlen(bl)}`, ...klick];
    const z = [k.name, ...ort, plan];
    if (k.st === "erledigt") z.push(`Erledigt am ${wt(k.ist)} ${dmy(k.ist)}${k.verzug ? ` (${atText(k.verzug)} nach Plan)` : ""}`);
    z.push(`Status zum Stichtag ${dmy(STICH)}: ${k.st}${k.st === "überfällig" ? `, ${atText(k.verzug)} Verzug` : ""}`);
    return [...z, ...klick];
  }
  function botschaft(breite) {
    const passt = kand => kand.find(t => tw(t) <= breite) || kand[kand.length - 1];
    const bl = BLATT.filter(sichtbar);
    if (!bl.length) return "keine Vorgänge in dieser Auswahl";
    const ueber = bl.filter(b => b.st === "überfällig").sort((a, b) => b.verzug - a.verzug || a.e - b.e);
    const spaet = bl.filter(b => b.st === "erledigt" && b.verzug > 0).sort((a, b) => b.ist - a.ist);
    const lauf = bl.filter(b => b.st === "läuft").length;
    const laufText = n => `${n} ${n === 1 ? "Vorgang läuft" : "Vorgänge laufen"} im Plan`;
    const spaetText = spaet.length ? `${spaet[0].name} ${atText(spaet[0].verzug)} später erledigt` : "";
    const t = x => atText(x.verzug);
    if (!ueber.length) {
      const a = lauf ? `Kein Vorgang überfällig, ${laufText(lauf)}` : "Kein Vorgang überfällig";
      return passt([spaetText ? `${a}; ${spaetText}` : a, a]);
    }
    let kern;
    if (ueber.length === 1) kern = [`Überfällig: ${ueber[0].name} (Plan-Ende ${dm(ueber[0].e)}, ${t(ueber[0])})`, `Überfällig: ${ueber[0].name} (${t(ueber[0])})`];
    else if (ueber.length === 2) kern = [`Überfällig: ${ueber[0].name} (${t(ueber[0])}) und ${ueber[1].name} (${t(ueber[1])})`,
      `2 Vorgänge überfällig, am längsten ${ueber[0].name} (${t(ueber[0])})`];
    else kern = [`${ueber.length} Vorgänge überfällig, am längsten ${ueber[0].name} (${t(ueber[0])})`];
    const kand = [];
    kern.forEach(k => {
      if (lauf && spaetText) kand.push(`${k}; ${spaetText}; ${laufText(lauf)}`);
      if (spaetText) kand.push(`${k}; ${spaetText}`);
      if (lauf) kand.push(`${k}; ${ueber.length === 1 ? "weitere " : ""}${laufText(lauf)}`);
      kand.push(k);
    });
    return passt(kand);
  }

  /* ---------- Zeichnen ---------- */
  function zeichnen() {
    const legende = [["#FFFFFF", "Plan", PLAN_RAND], [FARBE.ist, "Ist"], [FARBE.schlecht, "Verzug"]];
    if (CFG.arbeitsfrei && S.achse !== "arbeit") legende.push(["#EFEFEF", "arbeitsfrei"]);
    DK.kopf(bKopf, { titel: CFG.titel, untertitel: CFG.untertitel(dmy(STICH)), quelle: "", legende });
    const v = DK.visual(bKal, { titel: CFG.visualTitel, einheit: CFG.einheit(S), botschaft: botschaft(bKal.clientWidth || 992) });
    kalender(v.flaeche, v.breite, v.hoehe, zeilen());
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  /* ---------- Lernplattform: Designregeln, Nachbau, Tabellen, CSV ---------- */
  DK.ebenen({
    regeln: CFG.regeln, nachbauIntro: CFG.nachbauIntro, nachbau: CFG.nachbau, theme: DK.thema(),
    csv: { name: CFG.csvName, text: () => ["Gliederung;Vorgang;Plan_Anfang;Plan_Ende;Dauer_Arbeitstage;Ist_Ende;Status_zum_Stichtag;Verzug_Arbeitstage",
      ...BLATT.map(k => [pfad(k).slice(0, -1).join(" › "), k.name, dmy(k.b), dmy(k.e), anzahlAT(k.b, k.e), k.ist == null ? "" : dmy(k.ist),
        k.st, k.verzug].join(";"))].join("\r\n") },
    tabellen: () => {
      const bl = BLATT.filter(sichtbar);
      const tabs = [{ titel: `Vorgänge zum Stichtag ${dmy(STICH)} (${bl.length})`, kopf: ["Vorgang", "Anfang", "Ende", "Dauer", "Ist-Ende", "Status"],
        zeilen: bl.map(k => [k.name, datum(k.b), datum(k.e), String(anzahlAT(k.b, k.e)), k.ist == null ? "–" : datum(k.ist), k.st]) }];
      const verzug = bl.filter(k => k.verzug > 0);
      if (verzug.length) tabs.push({ titel: "Verzug in Arbeitstagen", kopf: ["Vorgang", "Plan-Ende", "Verzug"],
        zeilen: verzug.map(k => [k.name, datum(k.e), `${k.verzug} (${k.st})`]) });
      return tabs;
    },
  });
  zeichnen();
})();
