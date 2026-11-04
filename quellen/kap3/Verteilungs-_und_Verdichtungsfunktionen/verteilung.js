/* Einzelvisual „Verteilungs- und Verdichtungsfunktionen“ (Abb. 3.178): Planumsatz je Region nach vier Verfahren –
   Top-down (verteilen), Bottom-up (verdichten), Gegenstrom (Vorgabe verteilen, Rückmeldung verdichten) und
   Verteilung mit fixiertem Wert. Seite 727 x 310 px = 110 x 46,9 mm. Daten: verteilung.json (daten_verteilung.py),
   Werte des Originals; die Seite rechnet Verteilungen und Summen selbst.
   Die vier Tabellen des Originals stehen nebeneinander in einer Tabelle mit gemeinsamen Zeilen. Erfasste Werte
   (im Original gelb) sind umrandet, berechnete nicht; Pfeile zeigen die Richtung (↓ verteilen, ↑ verdichten).
   Online: erfasste Werte sind Eingabefelder, Schalter wählt den Verteilschlüssel (Vorjahr oder gleichmäßig),
   Klick auf eine Region hebt sie hervor, Klick auf einen Spaltenkopf sortiert, Esc hebt die Auswahl auf. */
(() => {
  "use strict";
  const { zahl, delta, NBSP, sv, el } = DK;
  const REG = DATA.regionen, VJ = DATA.vj, NR = REG.length;
  const S = { schluessel: "vj", auswahl: null, sort: null, E: JSON.parse(JSON.stringify(DATA.eingabe)) };
  const auswaehlen = r => { S.auswahl = S.auswahl === r ? null : r; zeichnen(); };
  addEventListener("keydown", e => { if (e.key === "Escape" && S.auswahl !== null) { S.auswahl = null; zeichnen(); } });

  /* ---------- Rechnen ---------- */
  const summe = a => a.reduce((s, v) => s + v, 0);
  const gewichte = () => (S.schluessel === "vj" ? VJ : VJ.map(() => 1));
  function verteilen(gesamt, fix) {
    const g = gewichte();
    if (fix == null) return g.map(k => gesamt * k / summe(g));
    const rest = summe(g.filter((_, j) => j !== fix[0]));
    return g.map((k, j) => (j === fix[0] ? fix[1] : (gesamt - fix[1]) * k / rest));
  }
  function spalten() {
    const E = S.E, fixR = E.fixRegion;
    const td = verteilen(E.topdown), gv = verteilen(E.vorgabe), fx = verteilen(E.fixGesamt, [fixR, E.fixWert]);
    const mk = (regionen, gesamt, erfGesamt, erfRegion) => ({ werte: [gesamt, ...regionen], erfasst: [erfGesamt, ...regionen.map((_, j) => erfRegion(j))] });
    return {
      td: { ...mk(td, E.topdown, true, () => false), feld: [["topdown"]] },
      bu: { ...mk(E.bottomup, summe(E.bottomup), false, () => true), feld: [null, ...REG.map((_, j) => ["bottomup", j])] },
      gv: { ...mk(gv, E.vorgabe, true, () => false), feld: [["vorgabe"]] },
      gr: { ...mk(E.rueckmeldung, summe(E.rueckmeldung), false, () => true), feld: [null, ...REG.map((_, j) => ["rueckmeldung", j])] },
      fx: { ...mk(fx, E.fixGesamt, true, j => j === fixR), feld: [["fixGesamt"], ...REG.map((_, j) => (j === fixR ? ["fixWert"] : null))] },
    };
  }
  const ganz = v => Math.abs(v - Math.round(v)) < 1e-9;
  const nk = werte => (werte.every(ganz) ? 0 : 2);                 // ein Format je Spalte
  const SCHL = () => (S.schluessel === "vj" ? "nach Vorjahresanteil" : "gleichmäßig");

  /* ---------- Spalten der Tabelle ---------- */
  const SP = [
    { key: "td", gruppe: "Top-down", unter: "verteilen", x: 214, b: 88, auf: false },
    { key: "bu", gruppe: "Bottom-up", unter: "verdichten", x: 312, b: 88, auf: true },
    { key: "gv", gruppe: "Gegenstrom", unter: "Vorgabe", x: 410, b: 88, auf: false },
    { key: "gr", gruppe: null, unter: "Rückmeldung", x: 498, b: 92, auf: true },
    { key: "fx", gruppe: "Mit Fixierung", unter: "", x: 600, b: 95, auf: false },
  ];
  const ERKL = {
    vj: "Vorjahresumsatz – Grundlage des Verteilschlüssels",
    td: "Top-down: Die Jahresvorgabe wird auf die Regionen verteilt.",
    bu: "Bottom-up: Die Regionen planen, die Summe ergibt das Unternehmen.",
    gv: "Gegenstrom, Schritt 1: Die Vorgabe wird verteilt (wie Top-down).",
    gr: "Gegenstrom, Schritt 2: Die Regionen melden ihre Planung zurück, die Summe wird mit der Vorgabe abgestimmt.",
    fx: "Mit Fixierung: Ein manuell geplanter Wert bleibt fest, nur der Rest der Vorgabe wird verteilt.",
  };

  /* ---------- Layout ---------- */
  DK.init({ titel: "Verteilungs- und Verdichtungsfunktionen", breite: 727, hoehe: 310 });
  const bVis = DK.box("v-verteilung", 16, 10, 695, 292);
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
  el("style", {}, document.head, `
    #v-verteilung input.vv-feld { position: absolute; box-sizing: border-box; font: 14px Arial, "Liberation Sans", sans-serif;
      text-align: right; padding: 0 5px; border: 1px solid #3A3F44; border-radius: 2px; background: #FFFFFF; color: #1A1A1A; }
    #v-verteilung input.vv-feld:focus { outline: 2px solid #8F8F8F; outline-offset: 0; }
    #v-verteilung input.vv-feld.vv-fett { font-weight: bold; }
    #v-verteilung .vv-sort { cursor: pointer; }`);

  /* ---------- Botschaft ---------- */
  function botschaft(b, sp) {
    const passt = k => k.find(t => DK.tw(t) <= b) || k[k.length - 1];
    const f = (key, i) => zahl(sp[key].werte[i], nk(sp[key].werte));
    if (S.auswahl !== null) {
      const i = S.auswahl + 1, d = sp.gr.werte[i] - sp.gv.werte[i];
      const fix = S.auswahl === S.E.fixRegion ? " (fixiert)" : "";
      return passt([`Region ${REG[S.auswahl]}: Top-down ${f("td", i)}, Bottom-up ${f("bu", i)}, Gegenstrom ${f("gr", i)} (${delta(d, nk([d]))} zur Vorgabe), mit Fixierung ${f("fx", i)}${fix}`,
        `Region ${REG[S.auswahl]}: Top-down ${f("td", i)}, Bottom-up ${f("bu", i)}, Gegenstrom ${f("gr", i)}, mit Fixierung ${f("fx", i)}`]);
    }
    const d = sp.gr.werte[0] - sp.gv.werte[0];
    return passt([`Top-down verteilt ${f("td", 0)} ${SCHL()}; Bottom-up ergibt ${f("bu", 0)}, Gegenstrom ${f("gr", 0)} (${delta(d, nk([d]))} zur Vorgabe)`,
      `Bottom-up ergibt ${f("bu", 0)}, Gegenstrom ${f("gr", 0)} (${delta(d, nk([d]))} zur Vorgabe von ${f("gv", 0)})`]);
  }

  /* ---------- Tabelle ---------- */
  function reihenfolge(sp) {
    const idx = REG.map((_, j) => j);
    if (!S.sort) return idx;
    const wert = j => (S.sort.key === "vj" ? VJ[j] : S.sort.key === "label" ? 0 : sp[S.sort.key].werte[j + 1]);
    return idx.sort((a, b) => (S.sort.ab ? wert(b) - wert(a) : wert(a) - wert(b)) || a - b);
  }
  function sortieren(key) {
    if (!S.sort || S.sort.key !== key) S.sort = { key, ab: true };
    else if (S.sort.ab) S.sort.ab = false;
    else S.sort = null;
    zeichnen();
  }

  function tabelle(ziel, breite, hoehe, sp) {
    ziel.textContent = "";
    const svg = sv("svg", { width: breite, height: hoehe, role: "img",
      "aria-label": "Tabelle: Planumsatz je Region nach Top-down, Bottom-up, Gegenstrom und Verteilung mit fixiertem Wert" }, ziel);
    const K1 = 12, K2 = 32, LK = 44, Y0 = 48, ZH = 30, LW = 140, VJR = 198;
    const yz = i => Y0 + i * ZH;                                      // Oberkante Zeile i (0 = gesamt)
    const pfeil = (g, x, y, oben) => sv("path", { d: oben ? `M${x - 4.5},${y + 7} L${x + 4.5},${y + 7} L${x},${y} Z`
                                                         : `M${x - 4.5},${y - 7} L${x + 4.5},${y - 7} L${x},${y} Z`, fill: "#3A3F44" }, g);
    const sortZeichen = key => (S.sort && S.sort.key === key ? (S.sort.ab ? " ▾" : " ▴") : "");

    // Kopf: Verfahren und Schritt
    const gk = sv("g", { id: "vv-kopf" }, svg);
    const kopfKlick = (key, x, w) => {
      if (DK.PRINT) return;
      const h = sv("rect", { class: "vv-sort", x, y: 0, width: w, height: LK, fill: "transparent" }, gk);
      h.addEventListener("click", () => sortieren(key));
      tooltip(h, () => [ERKL[key] || "Region", "Klick sortiert die Regionen"]);
    };
    sv("text", { x: 0, y: K2, dy: "0.35em", class: "muted" }, gk, "Ebene" + sortZeichen("label"));
    sv("text", { x: VJR, y: K2, dy: "0.35em", "text-anchor": "end", class: "muted" }, gk, "Vorjahr" + sortZeichen("vj"));
    kopfKlick("vj", LW, VJR - LW + 6);
    SP.forEach(s => {
      if (s.gruppe) {
        const breiteGr = s.key === "gv" ? 180 : s.b;
        sv("text", { x: s.x + breiteGr / 2 + (s.key === "gv" ? 0 : 10), y: K1, dy: "0.35em", "text-anchor": "middle", style: "font-weight:bold" }, gk, s.gruppe);
        if (s.key === "gv") sv("line", { x1: s.x + 20, x2: s.x + breiteGr - 2, y1: K1 + 11, y2: K1 + 11, stroke: "#9A9A9A", "stroke-width": 1 }, gk);
      }
      const unter = s.key === "fx" ? `${REG[S.E.fixRegion]} fixiert` : s.unter;
      sv("text", { x: s.x + 20 + (s.b - 22) / 2, y: K2, dy: "0.35em", "text-anchor": "middle", class: "muted" }, gk, unter + sortZeichen(s.key));
      kopfKlick(s.key, s.x, s.b);
    });
    sv("line", { x1: 0, x2: breite, y1: LK + 0.5, y2: LK + 0.5, stroke: "#3A3F44", "stroke-width": 1 }, svg);

    // Zeilen
    const ord = reihenfolge(sp);
    const gz = sv("g", { id: "vv-zeilen" }, svg);
    const zeile = (i, r) => {                                         // i = Anzeigezeile, r = Region (null = gesamt)
      const k = r === null ? 0 : r + 1, y = yz(i), cy = y + ZH / 2, fett = r === null;
      const blass = r !== null && S.auswahl !== null && S.auswahl !== r;
      const g = sv("g", { id: r === null ? "vv-gesamt" : `vv-region-${r}`, class: (r !== null ? "dk-klick" : "") + (blass ? " dk-blass" : "") }, gz);
      sv("line", { x1: 0, x2: breite, y1: y + ZH - 0.5, y2: y + ZH - 0.5, stroke: r === null ? "#9A9A9A" : "#EFEFEF", "stroke-width": 1 }, g);
      const st = fett ? { style: "font-weight:bold" } : {};
      sv("text", { x: 0, y: cy, dy: "0.35em", ...st }, g, r === null ? "Unternehmen gesamt" : `Region ${REG[r]}`);
      sv("text", { x: VJR, y: cy, dy: "0.35em", "text-anchor": "end", ...st }, g, zahl(r === null ? summe(VJ) : VJ[r]));
      SP.forEach(s => {
        const c = sp[s.key], v = c.werte[k], x0 = s.x + 20, w = s.b - 22;
        if (c.erfasst[k]) sv("rect", { x: x0 + 0.5, y: y + 4.5, width: w - 1, height: ZH - 9, rx: 2, fill: "#FFFFFF", stroke: "#3A3F44", "stroke-width": 1,
                                       ...(r === null && s.key === "td" ? { id: "vv-erfasst" } : {}) }, g);
        sv("text", { x: x0 + w - 6, y: cy, dy: "0.35em", "text-anchor": "end", ...st }, g, zahl(v, nk(c.werte)));
      });
      const hit = sv("rect", { x: 0, y, width: breite, height: ZH, fill: "transparent" }, g);
      if (r !== null) hit.addEventListener("click", () => auswaehlen(r));
      tooltip(hit, () => (r === null ? tooltipGesamt(sp) : tooltipRegion(sp, r)));
    };
    zeile(0, null);
    ord.forEach((r, i) => zeile(i + 1, r));

    // Pfeile: Richtung der Rechnung je Spalte
    const gp = sv("g", { id: "vv-pfeile" }, svg);
    SP.forEach(s => {
      const x = s.x + 9, ya = yz(0) + 8, yb = yz(NR) + ZH - 6;
      sv("line", { x1: x, x2: x, y1: s.auf ? yb : ya, y2: s.auf ? ya + 6 : yb - 6, stroke: "#3A3F44", "stroke-width": 1.5 }, gp);
      pfeil(gp, x, s.auf ? ya : yb, s.auf);
    });

    // Schlüssel der Zeichen
    const gl = sv("g", { id: "vv-legende" }, svg), yl = yz(NR + 1) + 16;
    let x = 0;
    sv("rect", { x: x + 0.5, y: yl - 10.5, width: 34, height: 21, rx: 2, fill: "#FFFFFF", stroke: "#3A3F44", "stroke-width": 1 }, gl);
    x += 42; sv("text", { x, y: yl, dy: "0.35em", class: "muted" }, gl, DK.PRINT ? "erfasst" : "erfasst (Eingabefeld)");
    x += DK.tw(DK.PRINT ? "erfasst" : "erfasst (Eingabefeld)") + 26;
    sv("line", { x1: x + 4, x2: x + 4, y1: yl - 9, y2: yl + 3, stroke: "#3A3F44", "stroke-width": 1.5 }, gl); pfeil(gl, x + 4, yl + 9, false);
    x += 16; const t1 = `verteilt ${SCHL()}`; sv("text", { x, y: yl, dy: "0.35em", class: "muted" }, gl, t1);
    x += DK.tw(t1) + 26;
    sv("line", { x1: x + 4, x2: x + 4, y1: yl + 9, y2: yl - 3, stroke: "#3A3F44", "stroke-width": 1.5 }, gl); pfeil(gl, x + 4, yl - 9, true);
    x += 16; sv("text", { x, y: yl, dy: "0.35em", class: "muted" }, gl, "verdichtet (Summe)");

    // Eingabefelder über den erfassten Werten (nur online)
    if (!DK.PRINT) {
      ziel.style.position = "absolute";
      const zeilen = [null, ...ord];
      zeilen.forEach((r, i) => {
        const k = r === null ? 0 : r + 1, y = yz(i);
        SP.forEach(s => {
          const c = sp[s.key], feld = c.feld[k];
          if (!c.erfasst[k] || !feld) return;
          const inp = el("input", { class: "vv-feld" + (r === null ? " vv-fett" : ""), type: "text", inputmode: "decimal",
            "aria-label": `${s.gruppe || "Gegenstrom"} ${s.unter || "fixiert"}, ${r === null ? "Unternehmen gesamt" : "Region " + REG[r]}`,
            style: `left:${s.x + 20}px;top:${y + 4}px;width:${s.b - 22}px;height:${ZH - 8}px` }, ziel);
          inp.value = zahl(c.werte[k], nk(c.werte));
          inp.addEventListener("change", () => {
            const v = Number(inp.value.replace(/\s/g, "").replace(/\./g, "").replace(",", "."));
            const ok = isFinite(v) && v >= 0 && v <= 1e6 && !(feld[0] === "fixWert" && v > S.E.fixGesamt) &&
                       !(feld[0] === "fixGesamt" && v < S.E.fixWert);
            if (ok) { if (feld.length === 2) S.E[feld[0]][feld[1]] = v; else S.E[feld[0]] = v; }
            zeichnen();
          });
          inp.addEventListener("keydown", e => { if (e.key === "Enter") inp.blur(); });
        });
      });
    }
  }

  /* ---------- Tooltips ---------- */
  function tooltipRegion(sp, r) {
    const k = r + 1, f = key => zahl(sp[key].werte[k], nk(sp[key].werte)), g = gewichte();
    const dvj = key => delta((sp[key].werte[k] / VJ[r] - 1) * 100, 1, NBSP + "%");
    return [`Region ${REG[r]}`, `Vorjahr: ${zahl(VJ[r])} (Schlüssel ${zahl(g[r] / summe(g) * 100, 1)}${NBSP}%)`,
      `Top-down: ${f("td")} (${dvj("td")} zum Vorjahr)`, `Bottom-up: ${f("bu")} (erfasst)`,
      `Gegenstrom: Vorgabe ${f("gv")}, Rückmeldung ${f("gr")} (${delta(sp.gr.werte[k] - sp.gv.werte[k], nk(sp.gv.werte))})`,
      `Mit Fixierung: ${f("fx")}${r === S.E.fixRegion ? " (fixiert, manuell geplant)" : ""}`, "Klick hebt die Region hervor"];
  }
  function tooltipGesamt(sp) {
    const E = S.E, rest = E.fixGesamt - E.fixWert, g = gewichte(), fr = E.fixRegion;
    return ["Unternehmen gesamt", `Top-down: Vorgabe ${zahl(E.topdown)} ${SCHL()} verteilt`,
      `Bottom-up: Summe der Regionen ${zahl(sp.bu.werte[0])}`,
      `Gegenstrom: Vorgabe ${zahl(E.vorgabe)}, Rückmeldung ${zahl(sp.gr.werte[0])} (${delta(sp.gr.werte[0] - E.vorgabe, 0)})`,
      `Mit Fixierung: ${zahl(E.fixGesamt)} − ${zahl(E.fixWert)} (${REG[fr]}) = ${zahl(rest)}, verteilt auf die übrigen Regionen`,
      `Schlüssel der übrigen Regionen: ${S.schluessel === "vj" ? "Vorjahr " + zahl(summe(VJ.filter((_, j) => j !== fr))) : "gleichmäßig"}`];
  }

  /* ---------- Zeichnen ---------- */
  function zeichnen() {
    const sp = spalten();
    const v = DK.visual(bVis, { titel: "Planumsatz je Region nach Verfahren", einheit: "Tsd. €", botschaft: botschaft(695, sp),
      schalter: { optionen: [["vj", "nach Vorjahr"], ["gleich", "gleichmäßig"]], wert: S.schluessel,
                  onChange: w => { S.schluessel = w; zeichnen(); } } });
    tabelle(v.flaeche, v.breite, v.hoehe, sp);
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "v-verteilung", anker: "links", versatz: [690, 26], regel: "SAY – Botschaft vermitteln", titel: "Kernaussage unter dem Titel",
        text: "Unter dem Titel steht, was die Verfahren ergeben: Top-down verteilt die Vorgabe, Bottom-up und Gegenstrom landen unter ihr. Bei Auswahl einer Region stehen dort ihre Werte in allen Verfahren. Das Original hatte nur Überschriften je Verfahren." },
      { nr: 2, ziel: "vv-kopf", anker: "links", versatz: [205, -6], regel: "CONDENSE – Eine Tabelle statt sieben", titel: "Verfahren nebeneinander",
        text: "Die vier Verfahren stehen als Spalten nebeneinander, Regionen und Vorjahr nur einmal. Das Original zeigte sieben Tabellen (Eingabe und Ergebnis je Verfahren getrennt) mit siebenmal denselben Zeilen und Spaltenköpfen „Umsatz VJ/Plan“. Eingabe und Ergebnis stehen jetzt in derselben Spalte." },
      { nr: 3, ziel: "vv-erfasst", anker: "links", versatz: [6, -10], regel: "UNIFY – Erfasst und berechnet", titel: "Umrandet = erfasst",
        text: "Erfasste Werte sind umrandet wie Eingabefelder, berechnete stehen ohne Rahmen. In der Online-Fassung sind die umrandeten Werte tatsächlich Eingabefelder; jede Änderung rechnet die Verteilung neu. Das Original markierte Eingaben gelb." },
      { nr: 4, ziel: "vv-pfeile", anker: "links", versatz: [16, 70], regel: "EXPRESS – Richtung zeigen", titel: "↓ verteilen, ↑ verdichten",
        text: "Jede Spalte hat einen Pfeil in Rechenrichtung: nach unten, wenn ein Gesamtwert auf die Regionen verteilt wird, nach oben, wenn sich die Regionen zum Gesamtwert verdichten. Im Gegenstrom stehen beide Richtungen nebeneinander. Im Original fehlten die Pfeile bei den Ergebnistabellen." },
      { nr: 5, ziel: "vv-gesamt", anker: "links", versatz: [26, -12], regel: "STRUCTURE – Planungshierarchie", titel: "Gesamt oben",
        text: "Anders als in Berichten (Summe unten) steht das Unternehmen oben: Es ist der Ausgangspunkt der Top-down-Verteilung. Eine Linie trennt es von den Regionen. Die Regionen bleiben in der Reihenfolge des Originals; ein Klick auf einen Spaltenkopf sortiert sie." },
      { nr: 6, ziel: "vv-zeilen", anker: "links", versatz: [690, 120], regel: "CHECK – Rechnung nachvollziehbar", titel: "Fixierung: Rest verteilen",
        text: "West ist mit 220 fixiert; verteilt wird nur der Rest 1.200 − 220 = 980, nach dem Vorjahresanteil der übrigen Regionen (800): Nord und Ost je 306,25, Süd 367,50. Die Spalte hat deshalb zwei Nachkommastellen, alle anderen keine. Das Original schrieb „1200,00“ ohne Tausenderpunkt neben „1.200“." },
      { nr: 7, ziel: "vv-legende", anker: "links", versatz: [26, -12], regel: "SIMPLIFY – Kürzer beschriften", titel: "Kurze Köpfe, ein Zeichenschlüssel",
        text: "„Vertrieb Region Nord“ heißt „Region Nord“, die Überschrift „Verteilung ohne fixierte Werte zu überschreiben“ wird zu „Mit Fixierung“ mit „West fixiert“; der Hinweis „fixiert (manuell geplant)“ steht im Tooltip. Ein Zeichenschlüssel unter der Tabelle erklärt Rahmen und Pfeile." },
    ],
    nachbauIntro: "Seitengröße benutzerdefiniert 727 × 310 px. Schrift Arial: Beschriftungen 10,5 pt, Titel 12 pt. Datenmodell: Tabellen Region (Region, Umsatz_VJ), Planeingaben (Verfahren, Region, Plan) und Vorgaben (Verfahren, Wert) wie in der CSV-Datei. Eingaben direkt in der Matrix sind im Standard nicht möglich; die erfassten Werte kommen aus einer Planungstabelle oder einem Planungswerkzeug.",
    nachbau: [
      { id: "A", ziel: "vv-zeilen", anker: "links", versatz: [690, 60], titel: "Planumsatz je Verfahren", visual: "Matrix",
        felder: "Zeilen: Unternehmen, Region (Hierarchie, Zwischensumme oben); Werte: Umsatz VJ, Top-down, Bottom-up, Vorgabe, Rückmeldung, Mit Fixierung",
        format: "Zwischensummen der Zeilen: Position oben, fett; Gesamtergebnis aus; Spaltenkopf mit Unterstrich #3A3F44; Raster #EFEFEF; erfasste Werte über bedingte Formatierung › Rahmen #3A3F44 bzw. Hintergrund #FFFFFF",
        hinweis: "Measure Top-down = [Vorgabe] × DIVIDE( [Umsatz VJ]; CALCULATE( [Umsatz VJ]; ALL( Region ) ) ). Mit Fixierung: fixierte Region = Fixwert, übrige = ( [Vorgabe] − Fixwert ) × Anteil am Vorjahr der nicht fixierten Regionen." },
      { id: "B", ziel: "vv-erfasst", anker: "links", versatz: [6, -10], titel: "Jahresvorgabe ändern", visual: "Was-wäre-wenn-Parameter mit Datenschnitt",
        felder: "Modellierung › Neuer Parameter › Numerischer Bereich (z. B. 1.000 bis 1.400, Schrittweite 10); das Measure [Vorgabe] liest den Parameterwert",
        format: "Datenschnitt als Einzelwert-Eingabe" },
      { id: "C", ziel: "v-verteilung", anker: "links", versatz: [460, 0], titel: "Verteilschlüssel", visual: "Datenschnitt (Kacheln)",
        felder: "Hilfstabelle Schlüssel (nach Vorjahr; gleichmäßig); im Measure SWITCH( SELECTEDVALUE( Schlüssel[Schlüssel] ); … ) wählt den Nenner",
        format: "Einfachauswahl, ausgewählt #3A3F44 mit weißer Schrift" },
    ],
    theme: DK.thema(),
    csv: { name: "verteilung_daten.csv", text: () => {
      const sp = spalten(), z = ["Verfahren;Spalte;Ebene;Umsatz_VJ_TEUR;Plan_TEUR;Herkunft"];
      const f = v => zahl(v, 2).replace(/\./g, "");
      [["td", "Top-down", "Plan"], ["bu", "Bottom-up", "Plan"], ["gv", "Gegenstrom", "Vorgabe"], ["gr", "Gegenstrom", "Rückmeldung"], ["fx", "Mit Fixierung", "Plan"]]
        .forEach(([key, verf, spalte]) => {
          const c = sp[key];
          z.push([verf, spalte, "Unternehmen gesamt", summe(VJ), f(c.werte[0]), c.erfasst[0] ? "erfasst" : "verdichtet"].join(";"));
          REG.forEach((r, j) => z.push([verf, spalte, "Region " + r, VJ[j], f(c.werte[j + 1]),
            c.erfasst[j + 1] ? (key === "fx" ? "erfasst (fixiert)" : "erfasst") : "verteilt"].join(";")));
        });
      return z.join("\r\n"); } },
    tabellen: () => {
      const sp = spalten(), E = S.E;
      return [
        { titel: "Planumsatz je Region nach Verfahren (Tsd. €)", kopf: ["Ebene", "Vorjahr", "Top-down", "Bottom-up", "Vorgabe", "Rückmeldung", "Mit Fixierung"],
          zeilen: [null, ...REG.map((_, j) => j)].map(r => {
            const k = r === null ? 0 : r + 1;
            return [r === null ? "Unternehmen gesamt" : `Region ${REG[r]}`, zahl(r === null ? summe(VJ) : VJ[r]),
              ...SP.map(s => zahl(sp[s.key].werte[k], nk(sp[s.key].werte)) + (sp[s.key].erfasst[k] ? " (e)" : ""))];
          }) },
        { titel: "Rechenweg", kopf: ["Verfahren", "Rechnung"], zeilen: [
          ["Top-down", `${zahl(E.topdown)} ${SCHL()} verteilt`],
          ["Bottom-up", `${E.bottomup.map(v => zahl(v, nk(E.bottomup))).join(" + ")} = ${zahl(sp.bu.werte[0], nk(sp.bu.werte))}`],
          ["Gegenstrom", `Rückmeldung ${zahl(sp.gr.werte[0], nk(sp.gr.werte))} − Vorgabe ${zahl(E.vorgabe)} = ${delta(sp.gr.werte[0] - E.vorgabe, nk(sp.gr.werte))}`],
          ["Mit Fixierung", `${zahl(E.fixGesamt)} − ${zahl(E.fixWert)} = ${zahl(E.fixGesamt - E.fixWert)} auf die übrigen Regionen`]] },
      ];
    },
  });
  zeichnen();
})();
