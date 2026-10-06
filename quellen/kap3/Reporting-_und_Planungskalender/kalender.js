/* Dashboard „Reporting- und Planungskalender“ (Abb. 3.12).
   Daten: kalender.json (daten_kalender.py) – Berichts- und Planungsprozesse 2026 mit der Budgetierung 2027 als Baum
   (Prozessart › Prozess › Teilprozess › Schritt). Status je Termin aus Plan-Ende, Ist-Ende und Stichtag (gleiche Regel wie
   der Generator). Bewusst ohne KPI-Leiste: Die Seite ist ein Kalender. */
(() => {
  "use strict";
  const { FARBE, sv, tw, el } = DK;
  const tag = iso => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) / 864e5;
  const p2 = n => String(n).padStart(2, "0");
  const dm = t => { const d = new Date(t * 864e5); return p2(d.getUTCDate()) + "." + p2(d.getUTCMonth() + 1) + "."; };
  const dmy = t => dm(t) + new Date(t * 864e5).getUTCFullYear();
  const JAHR = DATA.jahr, STICH = tag(DATA.stichtag);
  const MONATE = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

  /* ---------- Baum aufbauen ---------- */
  const K = DATA.knoten.map(([id, parent, name, verantw, b, e, ist, serie]) =>
    ({ id, parent, name, verantw, b: b && tag(b), e: e && tag(e), ist: ist && tag(ist), serie, kinder: [] }));
  const M = new Map(K.map(k => [k.id, k]));
  K.forEach(k => { k.eltern = k.parent ? M.get(k.parent) : null; if (k.eltern) k.eltern.kinder.push(k); });
  K.forEach(k => { k.ebene = k.eltern ? k.eltern.ebene + 1 : 0; k.wurzel = k.eltern ? k.eltern.wurzel : k; });
  const gruppe = k => k.kinder.length > 0;
  const BLATT = K.filter(k => !gruppe(k));
  const blaetter = k => (gruppe(k) ? k.kinder.flatMap(blaetter) : [k]);
  const pfad = k => (k.eltern ? [...pfad(k.eltern), k.name] : [k.name]);
  const unter = (k, a) => { for (let x = k; x; x = x.eltern) if (x === a) return true; return false; };
  BLATT.forEach(k => {
    k.st = k.ist != null && k.ist <= STICH ? "erledigt" : k.e < STICH ? "überfällig" : k.b <= STICH ? "läuft" : "offen";
    k.verzug = k.ist != null && k.ist > k.e ? k.ist - k.e : k.st === "überfällig" ? STICH - k.e : 0;
  });
  const STATUS = ["offen", "läuft", "überfällig", "erledigt"];
  const VERANTW = [...new Set(BLATT.map(k => k.verantw))].sort((a, b) => a.localeCompare(b, "de"));
  const ZEITRAUM = { jahr: [tag(`${JAHR}-01-01`), tag(`${JAHR + 1}-01-01`)], h2: [tag(`${JAHR}-07-01`), tag(`${JAHR + 1}-01-01`)] };

  /* ---------- Zustand ---------- */
  const S = { zeitraum: "jahr", verantw: "alle", status: "alle", auswahl: null, auf: new Set(["rep", "pla", "bud", "aeb"]) };
  const sichtbar = k => {
    const [t0, t1] = ZEITRAUM[S.zeitraum];
    return (S.verantw === "alle" || k.verantw === S.verantw) && (S.status === "alle" || k.st === S.status) && k.e >= t0 && k.b < t1;
  };
  function zeilen() {
    const out = [];
    const besuch = k => {
      const bl = blaetter(k).filter(sichtbar);
      if (!bl.length) return;
      out.push({ k, bl, auf: gruppe(k) && S.auf.has(k.id) });
      if (gruppe(k) && S.auf.has(k.id)) k.kinder.forEach(besuch);
    };
    K.filter(k => !k.eltern).forEach(besuch);
    return out;
  }
  const sammelStatus = bl => (bl.some(b => b.st === "überfällig") ? "überfällig" : bl.every(b => b.st === "erledigt") ? "erledigt"
    : bl.every(b => b.st === "offen") ? "offen" : "läuft");
  function auswaehlen(id) { S.auswahl = S.auswahl === id ? null : id; zeichnen(); }
  function umschalten(id) { if (S.auf.has(id)) S.auf.delete(id); else S.auf.add(id); zeichnen(); }
  addEventListener("keydown", e => { if (e.key === "Escape" && S.auswahl) { S.auswahl = null; zeichnen(); } });

  /* ---------- Layout (Seite 1024 x 646, ohne KPI-Leiste) ---------- */
  DK.init({ titel: "Reporting- und Planungskalender" });
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
  DK.schnitt(bFilter, "Zeitraum", "knoepfe", { optionen: [["jahr", "Gesamtjahr " + JAHR], ["h2", "2. Halbjahr"]], wert: S.zeitraum,
    onChange: v => { S.zeitraum = v; zeichnen(); } });
  DK.schnitt(bFilter, "Verantwortlich", "dropdown", { breite: 230, optionen: [["alle", "Alle"], ...VERANTW.map(v => [v, v])], wert: "alle",
    onChange: v => { S.verantw = v; S.auswahl = null; zeichnen(); } });
  DK.schnitt(bFilter, "Status zum Stichtag", "knoepfe", { optionen: [["alle", "Alle"], ...STATUS.map(s => [s, s])], wert: "alle",
    onChange: v => { S.status = v; S.auswahl = null; zeichnen(); } });

  /* ---------- Kalender (Prozesstabelle + Zeitachse) ---------- */
  const ZH = 19, KOPF_H = 36, EINZUG = 12, TEXT_X = 14;
  const SP_P = Math.ceil(Math.max(...K.map(k => k.ebene * EINZUG + TEXT_X + tw(k.name, 14, k.ebene === 0)))) + 12;
  const SP_V = Math.ceil(Math.max(tw("Verantwortlich"), ...K.map(k => tw(k.verantw)))) + 14;
  const SP_S = Math.ceil(Math.max(tw("Status"), ...STATUS.map(s => tw(s)))) + 12;
  const PLAN_RAND = "#3A3F44";

  function kalender(ziel, breite, hoehe, rows) {
    const H = rows.length * ZH, scroll = !DK.PRINT && KOPF_H + H > hoehe;
    const W = scroll ? breite - 12 : breite;
    const x0 = SP_P + SP_V + SP_S + 8, x1 = W - 2;
    const [T0, T1] = ZEITRAUM[S.zeitraum];
    const X = t => x0 + (Math.min(Math.max(t, T0), T1) - T0) / (T1 - T0) * (x1 - x0);
    const xs = Math.round(X(STICH + 1)) + 0.5;
    const box = el("div", { style: `position:absolute;inset:0;overflow-x:hidden;overflow-y:${scroll ? "auto" : "hidden"};scrollbar-width:thin` }, ziel);
    const kopf = sv("svg", { width: W, height: KOPF_H, style: "position:sticky;top:0;background:#FFFFFF;z-index:1;display:block" }, box);
    const svg = sv("svg", { width: W, height: H + 1, role: "img", "aria-label": "Kalender der Berichts- und Planungsprozesse", style: "display:block" }, box);

    // Kopf: Spaltentitel, Jahr, Monate, Stichtag
    const kopfY = 29;
    sv("text", { x: 0, y: kopfY, class: "muted", id: "sp-prozess" }, kopf, "Prozess");
    sv("text", { x: SP_P, y: kopfY, class: "muted", id: "sp-verantw" }, kopf, "Verantwortlich");
    sv("text", { x: SP_P + SP_V, y: kopfY, class: "muted", id: "sp-status" }, kopf, "Status");
    const achse = sv("g", { id: "kal-achse" }, kopf);
    sv("text", { x: x0 + 4, y: 12 }, achse, String(JAHR));
    const monate = [];
    for (let m = 0; m < 12; m++) {
      const a = tag(`${JAHR}-${p2(m + 1)}-01`), b = m < 11 ? tag(`${JAHR}-${p2(m + 2)}-01`) : tag(`${JAHR + 1}-01-01`);
      if (b <= T0 || a >= T1) continue;
      monate.push(a);
      sv("text", { x: (X(a) + X(b)) / 2, y: kopfY, "text-anchor": "middle", class: "muted" }, achse, MONATE[m]);
    }
    monate.forEach(a => {
      const x = Math.round(X(a)) + 0.5;
      sv("line", { x1: x, x2: x, y1: 17, y2: KOPF_H, stroke: "#E3E3E3", "stroke-width": 1 }, kopf);
      sv("line", { x1: x, x2: x, y1: 0, y2: H, stroke: "#E3E3E3", "stroke-width": 1 }, svg);
    });
    sv("line", { x1: 0, x2: W, y1: KOPF_H - 0.5, y2: KOPF_H - 0.5, stroke: "#3A3F44", "stroke-width": 1 }, kopf);
    sv("line", { x1: xs, x2: xs, y1: 15, y2: KOPF_H, stroke: "#1A1A1A", "stroke-width": 1, "stroke-dasharray": "3 2" }, kopf);
    const lw = tw("Stichtag", 14, true), jahrR = x0 + 4 + tw(String(JAHR));
    const lx = [xs + 4, xs - 4 - lw].find(a => a >= x0 && a + lw <= W && (a > jahrR + 4 || a + lw < x0)) ?? jahrR + 8;
    sv("text", { x: lx, y: 12, id: "kal-stichtag", style: "font-weight:bold" }, kopf, "Stichtag");

    // Balken eines Termins: Plan weiß mit Kontur, Ist anthrazit bis Erledigung bzw. Stichtag, Verzug rot
    function balken(g, k, cy) {
      if (k.e < T0 || k.b >= T1) return;
      const st = k.st;
      if (k.b === k.e) {
        const x = X(k.b + 0.5), r = 5.5;
        sv("path", { d: `M${x},${cy - r}L${x + r},${cy}L${x},${cy + r}L${x - r},${cy}Z`, "stroke-width": 1,
          fill: st === "erledigt" ? FARBE.ist : st === "überfällig" ? FARBE.schlecht : "#FFFFFF", stroke: st === "überfällig" ? FARBE.schlecht : PLAN_RAND }, g);
        return;
      }
      const h = 10, o = cy - h / 2, xb = X(k.b), xe = Math.max(X(k.e + 1), xb + 2);
      sv("rect", { x: xb, y: o, width: xe - xb, height: h, fill: "#FFFFFF" }, g);
      const istBis = st === "erledigt" ? Math.min(k.ist, k.e) + 1 : st === "läuft" ? STICH + 1 : st === "überfällig" ? k.e + 1 : null;
      if (istBis != null) sv("rect", { x: xb, y: o, width: Math.max(2, X(istBis) - xb), height: h, fill: FARBE.ist }, g);
      if (k.verzug > 0) {
        const a = X(k.e + 1);
        sv("rect", { x: a, y: o, width: Math.max(2, X(k.e + 1 + k.verzug) - a), height: h, fill: FARBE.schlecht }, g);
      }
      const offenLinks = k.b < T0;
      sv("path", { d: offenLinks ? `M${xb},${o + 0.5}H${xe - 0.5}V${o + h - 0.5}H${xb}` : `M${xb + 0.5},${o + 0.5}H${xe - 0.5}V${o + h - 0.5}H${xb + 0.5}Z`,
        fill: "none", stroke: PLAN_RAND, "stroke-width": 1 }, g);
    }
    // Klammer einer aufgeklappten bzw. zusammengefassten Gruppe: Zeitraum vom ersten Beginn bis zum letzten Ende
    function klammer(g, bl, cy) {
      const b = Math.min(...bl.map(x => x.b)), e = Math.max(...bl.map(x => x.e)) + 1;
      if (e <= T0 || b >= T1) return;
      const xb = X(b), xe = X(e), y = cy - 2;
      sv("path", { d: `${b < T0 ? `M${xb},${y}` : `M${xb + 0.75},${cy + 4}V${y}`}H${xe - 0.75}V${cy + 4}`, fill: "none", stroke: "#3A3F44", "stroke-width": 1.5 }, g);
    }

    rows.forEach((z, i) => {
      const { k, bl, auf } = z, y = i * ZH, cy = y + ZH / 2;
      if (i > 0) sv("line", { x1: 0, x2: W, y1: y - 0.5, y2: y - 0.5, stroke: k.ebene === 0 ? "#9A9A9A" : "#EFEFEF", "stroke-width": 1 }, svg);
      const sel = S.auswahl && M.get(S.auswahl);
      const blass = sel && !(unter(k, sel) || unter(sel, k));
      const g = sv("g", { class: "dk-klick" + (blass ? " dk-blass" : ""), id: "z-" + k.id }, svg);
      sv("text", { x: k.ebene * EINZUG + TEXT_X, y: cy, dy: "0.35em", id: "t-" + k.id, style: k.ebene === 0 ? "font-weight:bold" : "" }, g, k.name);
      if (k.ebene > 0) {
        sv("text", { x: SP_P, y: cy, dy: "0.35em" }, g, k.verantw);
        const st = gruppe(k) ? (auf ? "" : sammelStatus(bl)) : k.st;
        if (st) sv("text", { x: SP_P + SP_V, y: cy, dy: "0.35em", style: st === "überfällig" ? `fill:${FARBE.schlecht}` : "" }, g, st);
        if (!gruppe(k)) balken(g, k, cy);
        else if (k.serie && !auf) bl.forEach(b => balken(g, b, cy));
        else klammer(g, bl, cy);
      }
      const hit = sv("rect", { x: 0, y, width: W, height: ZH, fill: "transparent" }, g);
      hit.addEventListener("click", () => auswaehlen(k.id));
      tooltip(hit, () => tooltipZeile(k, bl, auf));
      if (gruppe(k)) {
        const ix = k.ebene * EINZUG + 0.5, iy = Math.round(cy - 4.5) + 0.5;
        const ic = sv("g", { class: "dk-klick", id: "i-" + k.id, "aria-label": auf ? "zuklappen" : "aufklappen" }, g);
        sv("rect", { x: ix - 2, y: iy - 2, width: 13, height: 13, fill: "transparent" }, ic);
        sv("rect", { x: ix, y: iy, width: 9, height: 9, fill: "#FFFFFF", stroke: "#8C8C8C", "stroke-width": 1 }, ic);
        sv("line", { x1: ix + 2, x2: ix + 7, y1: iy + 4.5, y2: iy + 4.5, stroke: "#3A3F44", "stroke-width": 1 }, ic);
        if (!auf) sv("line", { x1: ix + 4.5, x2: ix + 4.5, y1: iy + 2, y2: iy + 7, stroke: "#3A3F44", "stroke-width": 1 }, ic);
        ic.addEventListener("click", ev => { ev.stopPropagation(); umschalten(k.id); });
      }
    });
    sv("line", { x1: 0, x2: W, y1: H + 0.5, y2: H + 0.5, stroke: "#EFEFEF", "stroke-width": 1 }, svg);
    sv("line", { x1: xs, x2: xs, y1: 0, y2: H, stroke: "#1A1A1A", "stroke-width": 1, "stroke-dasharray": "3 2" }, svg);
  }

  function zaehlen(bl) {
    const n = s => bl.filter(b => b.st === s).length;
    return [["erledigt", n("erledigt")], ["laufend", n("läuft")], ["offen", n("offen")], ["überfällig", n("überfällig")]]
      .filter(([, v]) => v).map(([t, v]) => `${v} ${t}`).join(", ");
  }
  function tooltipZeile(k, bl, auf) {
    const klick = gruppe(k) ? ["+/− klappt auf und zu", "Klick hebt hervor"] : ["Klick hebt hervor"];
    if (k.ebene === 0) return [k.name, `${bl.length} Termine: ${zaehlen(bl)}`, ...klick];
    if (gruppe(k)) {
      const b = Math.min(...bl.map(x => x.b)), e = Math.max(...bl.map(x => x.e));
      const z = [k.name, pfad(k).slice(0, -1).join(" › "), `Verantwortlich: ${k.verantw}`, `Zeitraum: ${dm(b)} bis ${dmy(e)}`,
        `${bl.length} Termine: ${zaehlen(bl)}`];
      if (k.serie) bl.forEach(x => z.push(`${x.name}: ${dm(x.b)}–${dm(x.e)} · ${x.st}`));
      return [...z, ...klick];
    }
    const z = [k.name, pfad(k).slice(0, -1).join(" › "), `Verantwortlich: ${k.verantw}`,
      k.b === k.e ? `Termin: ${dmy(k.b)}` : `Plan: ${dmy(k.b)} bis ${dmy(k.e)}`];
    if (k.st === "erledigt") z.push(`Erledigt am ${dmy(k.ist)}${k.verzug ? ` (${k.verzug} Tage nach Plan)` : ""}`);
    z.push(`Status zum Stichtag ${dmy(STICH)}: ${k.st}${k.st === "überfällig" ? `, ${k.verzug} Tage Verzug` : ""}`);
    return [...z, ...klick];
  }
  function botschaft() {
    const bl = BLATT.filter(sichtbar);
    if (!bl.length) return "keine Termine in dieser Auswahl";
    const ueber = bl.filter(b => b.st === "überfällig").sort((a, b) => b.verzug - a.verzug), lauf = bl.filter(b => b.st === "läuft").length;
    const laufText = n => `${n} ${n === 1 ? "Prozess läuft" : "Prozesse laufen"} im Plan`;
    if (!ueber.length) return lauf ? `Kein Termin überfällig, ${laufText(lauf)}` : "Kein Termin überfällig";
    const u = ueber[0], t = `${u.verzug} ${u.verzug === 1 ? "Tag" : "Tage"}`;
    if (ueber.length === 1) return `Überfällig: ${u.name} (Plan-Ende ${dm(u.e)}, ${t})` + (lauf ? `; weitere ${laufText(lauf)}` : "");
    return `${ueber.length} Termine überfällig, am längsten ${u.name} (${t})` + (lauf ? `; ${laufText(lauf)}` : "");
  }

  /* ---------- Zeichnen ---------- */
  function zeichnen() {
    DK.kopf(bKopf, { titel: "Reporting- und Planungskalender",
      untertitel: `Berichts- und Planungsprozesse ${JAHR} mit der Budgetierung ${JAHR + 1} · Stichtag ${dmy(STICH)}`,
      quelle: `Quelle: Controlling · Stand ${dmy(STICH)}`,
      legende: [["#FFFFFF", "Plan", PLAN_RAND], [FARBE.ist, "Ist"], [FARBE.schlecht, "Verzug"]] });
    const v = DK.visual(bKal, { titel: "Termine", einheit: `Plan ${JAHR}, Status zum Stichtag`, botschaft: botschaft() });
    kalender(v.flaeche, v.breite, v.hoehe, zeilen());
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  /* ---------- Lernplattform: Designregeln, Nachbau, Tabellen, CSV ---------- */
  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "v-kalender", anker: "links", versatz: [632, 26], regel: "SAY – Botschaft vermitteln", titel: "Kernaussage über dem Kalender",
        text: "Unter dem Titel steht, welcher Termin zum Stichtag überfällig ist und wie viele Prozesse planmäßig laufen. Der Satz folgt den Datenschnitten. Das Original zeigte nur Ampeln je Zeile; ob etwas zu tun ist, musste der Leser selbst suchen." },
      { nr: 2, ziel: "kopf-legende", anker: "links", regel: "UNIFY – Semantische Notation", titel: "Plan, Ist und Verzug statt Ampeln",
        text: "Plantermine sind weiße Balken mit Kontur, der Ist-Verlauf ist anthrazit, Verzug rot – wie in den Roadmaps (Abb. 3.3 und 3.5). Das Original färbte Balken grün oder grau je nach Gliederungsebene und setzte rote Ampeln auch an Termine, die noch gar nicht begonnen hatten." },
      { nr: 3, ziel: "t-mr", versatz: [130, 1], regel: "CONDENSE – Informationsdichte", titel: "Wiederkehrende Termine in einer Zeile",
        text: "Monatsreporting, Quartalsabschluss und Forecast stehen zugeklappt je in einer Zeile mit allen Terminen des Jahres; +/− klappt die Einzeltermine auf. Das Original brauchte allein für das Monatsreporting zehn Zeilen." },
      { nr: 4, ziel: "kal-achse", anker: "links", versatz: [71, 0], regel: "CHECK – Visuelle Integrität", titel: "Lineare, tagesgenaue Zeitachse",
        text: "Jeder Monat ist gleich breit, Balken beginnen und enden am Datum. Das Original mischte zugeklappte Monate und aufgeklappte Tage in einer Achse und füllte ganze Monatszellen, auch wenn ein Termin nur wenige Tage dauerte." },
      { nr: 5, ziel: "kal-stichtag", versatz: [26, -2], regel: "EXPRESS – Passende Darstellung", titel: "Stichtag als Linie",
        text: "Die gestrichelte Linie trennt Erledigtes von Kommendem. Meilensteine (Eingabesperre, Export der Planwerte) sind Rauten. Termine, Ist-Ende und Verzug in Tagen stehen im Tooltip." },
      { nr: 6, ziel: "kopf-titel", versatz: [26, 0], regel: "SIMPLIFY – Überflüssiges weglassen", titel: "Keine Menüs, keine Linkspalte",
        text: "Fenster-, Menü- und Symbolleiste, Navigationsleiste, die Spalte „Link“ mit „…“ und die Statuszeile mit der Serververbindung entfallen. Beginn und Ende stehen im Tooltip statt in zwei eigenen Spalten; so bleibt die halbe Breite für den Kalender." },
      { nr: 7, ziel: "sp-prozess", versatz: [26, -2], regel: "STRUCTURE – Inhalte ordnen", titel: "Nach Prozessart gegliedert",
        text: "Reporting und Planung stehen getrennt, darunter Prozesse, Teilprozesse und Schritte in ihrer Abfolge. Das Original mischte beide Prozessarten chronologisch. Die Datenschnitte Zeitraum, Verantwortlich und Status ersetzen „Planungsdurchlauf“, „Variante“ und „Monatsebene ausblenden“." },
      { nr: 8, ziel: "sp-verantw", versatz: [26, -2], regel: "UNIFY – Begriffe", titel: "Rollen statt Personen, keine Software",
        text: "Verantwortlich sind Rollen (Controlling, Rechnungswesen, Treasury …) statt Personennamen und Spitznamen wie „Häuptling“. Softwarebezüge sind neutral: Innenaufträge statt CO-Aufträge, ERP-System statt SAP. Abgeschnittene Texte des Originals sind vollständig." },
    ],
    nachbauIntro: "Alle Elemente sind Standard-Visuals von Power BI Desktop. Ein Gantt-Diagramm ist kein Standard-Visual; der Kalender entsteht hier als Matrix mit Wochenspalten und bedingter Hintergrundfarbe – wie die Zellen des Originals. Seitengröße benutzerdefiniert 1024 × 646 px. Schrift Arial: Beschriftungen 10,5 pt, Visualtitel 12 pt, Berichtstitel 16,5 pt.",
    nachbau: [
      { id: "A", ziel: "kopf-titel", versatz: [26, 0], titel: "Kopfzeile und Legende", visual: "Textfeld; Formen (Rechteck)",
        felder: "Untertitel und Quelle mit dynamischem Wert: Measure „Stichtag Text“",
        format: "Titel 16,5 pt fett; Legende: Rechtecke 9 × 9 px (Plan weiß mit Rahmen #3A3F44, Ist #3A3F44, Verzug #C62828)" },
      { id: "B", ziel: "filter", versatz: [-28, 0], titel: "Datenschnitte", visual: "Datenschnitt (Stil Kacheln bzw. Dropdown)",
        felder: "Zeitraum (berechnete Spalte Halbjahr der Datumstabelle), Verantwortlich, Status zum Stichtag",
        format: "Ausgewählt: Füllung #3A3F44, Schrift weiß; nicht ausgewählt: weiß, Rahmen #9A9A9A",
        hinweis: "Status als berechnete Spalte: SWITCH(TRUE(); Termine[Ist_Ende] <= [Stichtag]; \"erledigt\"; Termine[Plan_Ende] < [Stichtag]; \"überfällig\"; Termine[Plan_Beginn] <= [Stichtag]; \"läuft\"; \"offen\")." },
      { id: "C", ziel: "sp-prozess", versatz: [26, -2], titel: "Kalender – Zeilen", visual: "Matrix, Layout „Abgestuft“, Plus-/Minus-Symbole an",
        felder: "Zeilen: Prozessart, Prozess, Teilprozess, Schritt (Hierarchie); Werte: Verantwortlich (erster Wert), Measure „Status“",
        format: "Zeilenüberschriften 10,5 pt, Prozessart fett; Status „überfällig“ per bedingter Schriftfarbe #C62828; Zeilenrasterlinien #EFEFEF",
        hinweis: "Measure „Status“ auf Gruppenebene: überfällig, wenn ein Termin überfällig ist; erledigt, wenn alle erledigt sind; sonst läuft bzw. offen (ISINSCOPE unterscheidet die Ebenen)." },
      { id: "D", ziel: "kal-achse", anker: "links", versatz: [71, 0], titel: "Kalender – Zeitachse", visual: "Dieselbe Matrix, Spalten: Kalenderwoche aus der Datumstabelle",
        felder: "Werte: Measure „Kalenderzelle“ – 1 Plan, 2 Ist, 3 Verzug, 4 Meilenstein, leer außerhalb des Termins (Datumstabelle ohne Beziehung, Vergleich über Plan_Beginn und Plan_Ende)",
        format: "Bedingte Formatierung Hintergrund nach Feldwert über Measure „Kalenderfarbe“ (#FFFFFF mit Rahmen nicht möglich, daher Plan #E3E3E3; Ist #3A3F44; Verzug #C62828); Schriftfarbe = Hintergrund; Spaltenbreite 8 px",
        hinweis: "Wochenraster statt tagesgenauer Balken. Zugeklappte Serien (Monatsreporting) zeigen alle Termine in einer Zeile, weil das Measure auf Gruppenebene je Woche prüft, ob ein Termin der Gruppe liegt." },
      { id: "E", ziel: "kal-stichtag", versatz: [26, -2], titel: "Stichtag", visual: "Bedingte Formatierung der Spaltenüberschrift bzw. Textfeld",
        felder: "Measure „Stichtag“ (Datum), Kalenderwoche des Stichtags",
        format: "Wochenspalte des Stichtags mit Rahmen links #1A1A1A; Beschriftung „Stichtag“ fett als Textfeld über der Matrix" },
      { id: "F", ziel: "v-kalender", anker: "links", versatz: [632, 26], titel: "Kernaussage", visual: "Textfeld mit dynamischem Wert",
        felder: "Text-Measure aus TOPN(1; FILTER(Termine; [Status] = \"überfällig\"); [Verzug Tage]) und der Anzahl laufender Termine",
        format: "10,5 pt, #4D4D4D" },
    ],
    theme: DK.thema(),
    csv: { name: "reporting_planungskalender_daten.csv", text: () => {
      const d = t => (t == null ? "" : dmy(t));
      return ["Prozessart;Prozess;Teilprozess;Schritt;Verantwortlich;Plan_Beginn;Plan_Ende;Ist_Ende;Meilenstein;Status_zum_Stichtag;Verzug_Tage",
        ...BLATT.map(k => [...[...pfad(k), "", "", ""].slice(0, 4), k.verantw, d(k.b), d(k.e), d(k.ist), k.b === k.e ? "ja" : "nein", k.st, k.verzug].join(";"))]
        .join("\r\n"); } },
    tabellen: () => {
      const bl = BLATT.filter(sichtbar), plan = k => (k.b === k.e ? dm(k.b) : `${dm(k.b)}–${dm(k.e)}`);
      const nachStatus = ["überfällig", "läuft", "offen", "erledigt"].map(st => {
        const z = bl.filter(k => k.st === st);
        return { titel: `${st[0].toUpperCase() + st.slice(1)} zum ${dmy(STICH)} (${z.length})`, kopf: ["Termin", "Plan"], zeilen: z.map(k => [k.name, plan(k)]) };
      });
      const verzug = bl.filter(k => k.verzug > 0);
      return [...nachStatus, { titel: "Verzug in Tagen", kopf: ["Termin", "Plan-Ende", "Verzug"],
        zeilen: verzug.map(k => [k.name, dm(k.e), `${k.verzug} (${k.st})`]) }].filter(t => t.zeilen.length);
    },
  });
  zeichnen();
})();
