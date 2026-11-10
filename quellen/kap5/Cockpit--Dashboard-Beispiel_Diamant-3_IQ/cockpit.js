/* Abb. 5.43 – Dashboard „Controlling-Cockpit“ (softwareneutraler Nachbau eines Management-Cockpits einer
   Rechnungswesen-Software). Seite 1024 x 646 px. Daten: cockpit.json (daten_cockpit.py) – Plan Januar bis Dezember 2027
   und Ist Januar bis März für Umsatz, Deckungsbeitrag II und Cashflow, dazu Fixkosten und Capital Employed für den ROCE.
   Inhalte wie im Original: ROCE, Umsatz, DB II und Cashflow mit Ist, Plan und relativer Abweichung für den Monat und
   kumuliert; Monatsverläufe Ist gegen Plan für Umsatz, DB II und Cashflow. Die vier Einzeltabellen sind zu einer Matrix
   zusammengefasst, die beiden Tachometer (ROCE Monat und kumuliert) durch Abweichungsbalken ersetzt.
   Schalter Stichtag (Jan–Mär): Ist liegt nur bis zum Stichtag vor. Klick auf eine Kennzahl hebt ihr Diagramm hervor,
   Klick auf einen Monat hebt ihn in allen Diagrammen hervor, Esc hebt auf. */
(() => {
  "use strict";
  const { zahl, delta, wirkung, FARBE, NBSP, sv, el, tw } = DK;
  const D = DATA, MON = D.monate, P = D.plan, I = D.ist, JAHR = D.jahr;
  const MLANG = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
  const pd = (a, b, nk = 1) => delta((a / b - 1) * 100, nk, NBSP + "%");
  const passt = (k, b) => k.find(t => tw(t) <= b) || k[k.length - 1];

  /* ---------- Kennzahlen ---------- */
  const roce = (d, n) => {
    const ebit = m => d.db2[m] - d.fixkosten[m];
    let s = 0, ce = 0;
    for (let m = 0; m <= n; m++) { s += ebit(m); ce += d.ce[m]; }
    return { mon: ebit(n) * 12 / d.ce[n] * 100, kum: s * 12 / (n + 1) / (ce / (n + 1)) * 100, ebit: ebit(n), ebitKum: s };
  };
  const KZ = [
    { key: "roce", name: "ROCE", einheit: "%", nk: 1, lang: "Return on Capital Employed (annualisiert)" },
    { key: "umsatz", name: "Umsatz", einheit: "Tsd. €", nk: 0, lang: "Umsatz" },
    { key: "db2", name: "DB II", einheit: "Tsd. €", nk: 0, lang: "Deckungsbeitrag II" },
    { key: "cashflow", name: "Cashflow", einheit: "Tsd. €", nk: 0, lang: "Cashflow" },
  ];
  function werte(kz, n) {
    if (kz.key === "roce") {
      const i = roce(I, n), p = roce(P, n);
      return { ist: i.mon, plan: p.mon, ik: i.kum, pk: p.kum, extra: { i, p } };
    }
    const sum = (a, m) => a.slice(0, m + 1).reduce((s, v) => s + v, 0);
    return { ist: I[kz.key][n], plan: P[kz.key][n], ik: sum(I[kz.key], n), pk: sum(P[kz.key], n) };
  }
  const rel = (a, b) => (b ? (a - b) / Math.abs(b) * 100 : null);

  /* ---------- Zustand ---------- */
  const S = { n: I.umsatz.length - 1, kz: null, mon: null };
  addEventListener("keydown", e => { if (e.key === "Escape" && (S.kz !== null || S.mon !== null)) { S.kz = null; S.mon = null; zeichnen(); } });

  /* ---------- Layout (Seite 1024 x 646) ---------- */
  DK.init({ titel: "Controlling-Cockpit" });
  const bKopf = DK.box("kopf", 16, 10, 992, 46);
  DK.haarlinie(62);
  const bMatrix = DK.box("v-kennzahlen", 16, 72, 484, 276);
  const bUms = DK.box("v-umsatz", 524, 72, 484, 276);
  DK.haarlinie(357);
  const bDb = DK.box("v-db2", 16, 366, 484, 276);
  const bCf = DK.box("v-cashflow", 524, 366, 484, 276);
  el("div", { style: "position:absolute;left:511px;top:72px;height:570px;border-left:1px solid var(--linie)" }, document.getElementById("seite"));
  DK.el("style", {}, document.head, `
    #v-kennzahlen .dk-matrix th.vk-gruppe { text-align: center; color: var(--text); font-weight: bold; border-bottom: 1px solid #BDBDBD; }
    #v-kennzahlen .dk-matrix th { padding-left: 4px; padding-right: 4px; }
    #v-kennzahlen .dk-matrix td { padding-left: 4px; padding-right: 4px; }
    #v-kennzahlen .dk-matrix td:first-child, #v-kennzahlen .dk-matrix th:first-child { padding-left: 0; }
    #v-kennzahlen .vk-fuss { color: var(--muted); margin-top: 10px; line-height: 1.3; }
    .dk-visual svg.vk-blass { opacity: .32; }`);

  /* ---------- Tooltip ---------- */
  const tip = document.querySelector(".dk-tooltip");
  function tooltip(ziel, fn) {
    ziel.addEventListener("pointermove", ev => {
      tip.textContent = "";
      fn().filter(Boolean).forEach((z, i) => el(i === 0 ? "b" : "div", {}, tip, z));
      tip.style.display = "block";
      const r = tip.getBoundingClientRect();
      let x = ev.clientX + 14, y = ev.clientY + 14;
      if (x + r.width > innerWidth - 8) x = ev.clientX - r.width - 14;
      if (y + r.height > innerHeight - 8) y = ev.clientY - r.height - 14;
      tip.style.left = x + "px"; tip.style.top = y + "px";
    });
    ziel.addEventListener("pointerleave", () => { tip.style.display = "none"; });
  }

  /* ---------- Matrix: Kennzahlen Monat und kumuliert ---------- */
  function matrix(f) {
    const n = S.n, kum = kumText();
    const zeilen = KZ.map(kz => {
      const w = werte(kz, n), fz = v => zahl(v, kz.nk);
      return { key: kz.key, kz, w, label: `${kz.name}, ${kz.einheit}`,
        werte: { ist: fz(w.ist), plan: fz(w.plan), d: rel(w.ist, w.plan), ik: fz(w.ik), pk: fz(w.pk), dk: rel(w.ik, w.pk) } };
    });
    const t = DK.matrix(f.flaeche, {
      spalten: [
        { key: "label", titel: "Kennzahl", breite: 112 },
        { key: "ist", titel: "Ist", breite: 46, fmt: v => v, id: "vk-kopf-ist" },
        { key: "plan", titel: "Plan", breite: 46, fmt: v => v },
        { key: "d", titel: "ΔPL %", breite: 92, typ: "delta", richtung: 1, nk: 1, textBreite: 52, id: "vk-kopf-d" },
        { key: "ik", titel: "Ist", breite: 50, fmt: v => v },
        { key: "pk", titel: "Plan", breite: 50, fmt: v => v },
        { key: "dk", titel: "ΔPL %", breite: 92, typ: "delta", richtung: 1, nk: 1, textBreite: 52, id: "vk-kopf-dk" },
      ],
      zeilen, zeilenhoehe: 30, auswahl: S.kz,
      onClick: key => { S.kz = S.kz === key ? null : key; zeichnen(); },
      tooltip: z => {
        const { kz, w } = z, f1 = v => zahl(v, kz.nk) + (kz.einheit === "%" ? NBSP + "%" : NBSP + kz.einheit);
        const zt = [`${kz.lang}`, `${MLANG[n]} ${JAHR}: Ist ${f1(w.ist)} · Plan ${f1(w.plan)} · ΔPL ${delta(rel(w.ist, w.plan), 1, NBSP + "%")}`,
          `Kumuliert ${kum}: Ist ${f1(w.ik)} · Plan ${f1(w.pk)} · ΔPL ${delta(rel(w.ik, w.pk), 1, NBSP + "%")}`];
        if (kz.key === "roce") zt.push(`Abweichung in %-Punkten: ${delta(w.ist - w.plan, 1, NBSP + "%-Pkt.")} (Monat), ${delta(w.ik - w.pk, 1, NBSP + "%-Pkt.")} (kumuliert)`,
          `EBIT ${MLANG[n]}: Ist ${zahl(w.extra.i.ebit)} · Plan ${zahl(w.extra.p.ebit)} Tsd. € (DB II − Fixkosten)`);
        else zt.push(`Jahresplan ${zahl(P[kz.key].reduce((s, v) => s + v, 0))} Tsd. €, davon erreicht ${zahl(w.ik / P[kz.key].reduce((s, v) => s + v, 0) * 100, 0)}${NBSP}%`);
        zt.push(kz.key === "roce" ? "Klick hebt die Kennzahl hervor" : "Klick hebt das Diagramm der Kennzahl hervor");
        return zt;
      },
    });
    // Gruppenkopf über den Spalten: Monat bzw. kumuliert
    const g = el("tr", {}), th = t.querySelector("thead");
    el("th", { style: "border-bottom:none" }, g, "");
    el("th", { class: "vk-gruppe", colspan: "3", id: "vk-monat" }, g, `${MLANG[n]} ${JAHR}`);
    el("th", { class: "vk-gruppe", colspan: "3", id: "vk-kum" }, g, `kumuliert ${kum}`);
    th.insertBefore(g, th.firstChild);
    el("div", { class: "vk-fuss", id: "vk-fuss" }, f.flaeche, "ROCE annualisiert = EBIT × 12 / Capital Employed, EBIT = DB II − Fixkosten; ΔPL % relativ zum Plan.");
    return zeilen;
  }

  /* ---------- Monatsverlauf: Plan als Kontur, Ist gefüllt davor (IBCS) ---------- */
  function verlauf(f, kz, id) {
    const W = f.breite, H = f.hoehe, n = S.n, pl = P[kz.key], is = I[kz.key].slice(0, n + 1);
    const svg = sv("svg", { width: W, height: H, role: "img", id, class: S.kz !== null && S.kz !== kz.key ? "vk-blass" : "" }, f.flaeche);
    const alle = [...pl, ...is], max = Math.max(0, ...alle), min = Math.min(0, ...alle);
    const oben = 18, unten = 20, negLab = min < 0 ? 16 : 0;
    const PH = H - oben - unten - negLab, k = PH / Math.max(max - min, 1e-9), y0 = oben + max * k;
    const slot = W / 12, bw = Math.min(22, slot * 0.55), off = 4;
    MON.forEach((m, i) => {
      const cx = slot * i + slot / 2, hatIst = i <= n, blass = S.mon !== null && S.mon !== i;
      const g = sv("g", { class: "dk-klick" + (blass ? " dk-blass" : ""), "data-name": m }, svg);
      const bar = (v, x, attrs) => sv("rect", { x, y: v >= 0 ? y0 - v * k : y0, width: bw, height: Math.max(Math.abs(v) * k, 0.8), ...attrs }, g);
      // Plan: weiß mit Kontur, bei Ist-Monaten leicht nach links versetzt hinter dem Ist
      bar(pl[i], cx - bw / 2 - (hatIst ? off : 0) + 0.5, { fill: "#FFFFFF", stroke: "#3A3F44", "stroke-width": 1 });
      if (hatIst) bar(is[i], cx - bw / 2 + off, { fill: FARBE.ist });
      const v = hatIst ? is[i] : pl[i];
      const yTop = Math.min(y0 - Math.max(pl[i], hatIst ? is[i] : -Infinity, 0) * k, y0);
      const yBot = y0 + Math.max(0, -Math.min(pl[i], hatIst ? is[i] : Infinity)) * k;
      sv("text", { x: cx + (hatIst ? off / 2 : 0), y: v >= 0 ? yTop - 5 : yBot + 14, "text-anchor": "middle",
                   style: hatIst ? "font-weight:bold" : "fill:var(--muted)" }, g, zahl(v));
      sv("text", { x: cx, y: H - 3, "text-anchor": "middle", class: "muted", style: i === n ? "font-weight:bold;fill:var(--text)" : "" }, g, m);
      const hit = sv("rect", { x: slot * i, y: 0, width: slot, height: H, fill: "transparent" }, g);
      hit.addEventListener("click", () => { S.mon = S.mon === i ? null : i; zeichnen(); });
      tooltip(hit, () => {
        const z = [`${kz.lang} ${MLANG[i]} ${JAHR}`];
        if (hatIst) {
          const d = is[i] - pl[i], kl = wirkung(d, 1, 0);
          z.push(`Ist ${zahl(is[i])} · Plan ${zahl(pl[i])} Tsd. €`, `ΔPL ${delta(d, 0)} Tsd. € (${delta(rel(is[i], pl[i]), 1, NBSP + "%")}, ${kl === "gut" ? "günstig" : kl === "schlecht" ? "ungünstig" : "im Plan"})`);
          if (kz.key === "db2") z.push(`DB-II-Quote Ist ${zahl(is[i] / I.umsatz[i] * 100, 1)}${NBSP}% · Plan ${zahl(pl[i] / P.umsatz[i] * 100, 1)}${NBSP}%`);
        } else z.push(`Plan ${zahl(pl[i])} Tsd. € (Ist liegt erst nach dem Stichtag vor)`);
        z.push("Klick hebt den Monat in allen Diagrammen hervor");
        return z;
      });
    });
    sv("line", { x1: 0, x2: W, y1: y0 + 0.5, y2: y0 + 0.5, stroke: "#8C8C8C", "stroke-width": 1 }, svg);
    // Stichtag: dünne Trennlinie zwischen Ist- und Planmonaten
    if (n < 11) sv("line", { x1: slot * (n + 1), x2: slot * (n + 1), y1: oben - 14, y2: H - unten + 4, stroke: "#BDBDBD", "stroke-width": 1, "stroke-dasharray": "3 3" }, svg);
  }

  /* ---------- Botschaften ---------- */
  const kumText = () => (S.n === 0 ? "Januar" : `Jan.–${MON[S.n]}.`.replace("Mär.", "März"));
  function botschaftMatrix(z) {
    const unter = z.filter(x => x.werte.dk !== null && wirkung(x.werte.dk, 1, 1) === "schlecht");
    const schlimm = z.slice().sort((a, b) => a.werte.dk - b.werte.dk)[0];
    if (S.kz !== null) {
      const x = z.find(q => q.key === S.kz);
      return passt([`${x.kz.name}: ${MLANG[S.n]} ${delta(x.werte.d, 1, NBSP + "%")}, kumuliert ${delta(x.werte.dk, 1, NBSP + "%")} zum Plan`], 484);
    }
    const anzahl = unter.length === z.length ? "Alle vier Kennzahlen" : `${unter.length} von ${z.length} Kennzahlen`;
    return passt([`${anzahl} kumuliert unter Plan, am stärksten ${schlimm.kz.name} (${delta(schlimm.werte.dk, 1, NBSP + "%")})`,
      `${anzahl} unter Plan, ${schlimm.kz.name} ${delta(schlimm.werte.dk, 1, NBSP + "%")}`], 484);
  }
  function botschaftVerlauf(kz) {
    const n = S.n, w = werte(kz, n), jp = P[kz.key].reduce((s, v) => s + v, 0);
    if (S.mon !== null) {
      const i = S.mon;
      return i <= n ? passt([`${MLANG[i]}: Ist ${zahl(I[kz.key][i])} statt ${zahl(P[kz.key][i])} Tsd. € (${pd(I[kz.key][i], P[kz.key][i])} zum Plan)`], 484)
        : passt([`${MLANG[i]}: Plan ${zahl(P[kz.key][i])} Tsd. €, Ist folgt nach dem Stichtag`], 484);
    }
    const d = w.ik - w.pk, dp = delta(rel(w.ik, w.pk), 1, NBSP + "%");
    if (kz.key === "umsatz") return passt([`${kumText()} ${delta(d, 0)} Tsd. € (${dp}) zum Plan; ${zahl(w.ik / jp * 100, 0)}${NBSP}% des Jahresplans erreicht`,
      `${kumText()} ${delta(d, 0)} Tsd. € (${dp}) zum Plan`], 484);
    if (kz.key === "db2") {
      const ui = I.umsatz.slice(0, n + 1).reduce((s, v) => s + v, 0), up = P.umsatz.slice(0, n + 1).reduce((s, v) => s + v, 0);
      return passt([`${kumText()} ${delta(d, 0)} Tsd. € (${dp}), DB-II-Quote ${zahl(w.ik / ui * 100, 1)}${NBSP}% statt ${zahl(w.pk / up * 100, 1)}${NBSP}%`,
        `${kumText()} ${delta(d, 0)} Tsd. € (${dp}) zum Plan`], 484);
    }
    return passt([`${kumText()} ${zahl(w.ik)} statt ${zahl(w.pk)} Tsd. € (${dp}); Plan erwartet ${zahl(jp - w.pk)} Tsd. € bis Dezember`,
      `${kumText()} ${zahl(w.ik)} statt ${zahl(w.pk)} Tsd. € (${dp})`], 484);
  }

  /* ---------- Zeichnen ---------- */
  function zeichnen() {
    DK.kopf(bKopf, { titel: "Controlling-Cockpit",
      untertitel: `Stichtag ${MLANG[S.n]} ${JAHR} · Ist gegen Plan (PL), Monat und kumuliert seit Januar`,
      quelle: "", legende: [[FARBE.ist, "Ist"], ["#FFFFFF", "Plan", "#3A3F44"], [FARBE.gut, "günstig"], [FARBE.schlecht, "ungünstig"]] });
    let f = DK.visual(bMatrix, { titel: "Kennzahlen Ist gegen Plan", einheit: "ΔPL in %", botschaft: "",
      schalter: { optionen: I.umsatz.map((_, i) => [i, MON[i]]), wert: S.n, onChange: v => { S.n = Number(v); S.mon = null; zeichnen(); } } });
    const z = matrix(f);
    bMatrix.querySelector(".dk-botschaft").textContent = botschaftMatrix(z);
    [[bUms, KZ[1], "vl-umsatz"], [bDb, KZ[2], "vl-db2"], [bCf, KZ[3], "vl-cashflow"]].forEach(([b, kz, id]) => {
      const v = DK.visual(b, { titel: `${kz.lang} je Monat ${JAHR}`, einheit: "Tsd. €", botschaft: botschaftVerlauf(kz) });
      verlauf(v, kz, id);
    });
    // Titelzeilen der oberen Visuals gleich hoch (links mit Schalter)
    const tz = [bMatrix, bUms, bDb, bCf].map(b => b.querySelector(".dk-titelzeile"));
    const h = Math.max(...tz.map(x => x.offsetHeight));
    tz.forEach(x => { x.style.height = h + "px"; x.style.alignItems = "center"; });
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  /* ---------- Lernplattform ---------- */
  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "v-umsatz", anker: "links", versatz: [460, 0], regel: "SAY – Botschaft vermitteln", titel: "Aussage je Visual",
        text: "Unter jedem Titel steht ein Satz aus den Daten: Umsatz Januar bis März 396 Tsd. € (−21,7 %) unter Plan, die DB-II-Quote niedriger als geplant, der Cashflow fast bei null. Das Original nannte nur Kennzahl und Einheit („Umsatz (Periodenbetrachtung) [TEUR]“)." },
      { nr: 2, ziel: "vk-kopf-d", anker: "links", versatz: [98, -2], regel: "EXPRESS – Abweichungsbalken statt Tacho", titel: "Tachometer ersetzt",
        text: "Die beiden Tachometer des Originals zeigten nur die ROCE-Abweichung (−74 % bzw. −73 %) auf einer Skala von −100 bis +100 – viel Fläche für eine Zahl, ohne Vergleich zu den übrigen Kennzahlen. Jetzt steht die Abweichung jeder Kennzahl als Balken an einer Nulllinie, ein Maßstab je Spalte." },
      { nr: 3, ziel: "vk-monat", anker: "links", versatz: [40, 0], regel: "CONDENSE – Zusammenfassen", titel: "Eine Matrix statt vier Tabellen",
        text: "Vier gleich aufgebaute Einzeltabellen (Ist, Plan, Abw. rel., Ist kum., Plan kum., Abw. kum. rel.) sind zu einer Matrix zusammengefasst: Kennzahlen in den Zeilen, Monat und kumuliert als Spaltengruppen. Info-, Schlüssel-, Tabellen- und Schließen-Symbole entfallen." },
      { nr: 4, ziel: "vl-umsatz", anker: "links", versatz: [60, 6], regel: "UNIFY – Semantische Notation", titel: "Ist gefüllt, Plan als Kontur",
        text: "Ist ist anthrazit gefüllt, Plan weiß mit Kontur und leicht dahinter versetzt – wie in allen Dashboards des Buches. Das Original zeigte Ist rot und Plan grün: Rot signalisiert eine Abweichung, auch wo keine ist, und Rot/Grün ist für Farbenfehlsichtige kaum unterscheidbar." },
      { nr: 5, ziel: "v-umsatz", anker: "links", versatz: [168, 91], regel: "CHECK – Fehlende Werte nicht als Null", titel: "Ist endet am Stichtag",
        text: "Das Original zeichnete die Ist-Linie im April auf null – ein Umsatzeinbruch, den es nicht gab; die Daten fehlten nur. Hier endet Ist am Stichtag (gestrichelte Linie), danach steht der Plan allein. Der Schalter Stichtag zeigt den Bericht für Januar, Februar oder März." },
      { nr: 6, ziel: "vl-db2", anker: "links", versatz: [60, 6], regel: "EXPRESS – Säulen für Zeitreihen", titel: "Säulen statt Linien",
        text: "Monatswerte sind Zeiträume und stehen deshalb als Säulen, Umsatz und Cashflow im Original als Linien. Alle drei Verläufe haben dieselbe Form, Werte stehen an den Säulen; Gitternetz, Achsen, Legenden und Farbverläufe der Säulen entfallen." },
      { nr: 7, ziel: "vk-fuss", anker: "links", versatz: [191, 20], regel: "CHECK – Stimmige Zahlen", titel: "ROCE aus den Daten gerechnet",
        text: "Umsatz, DB II und Cashflow haben die Werte des Originals. Der ROCE war dort mit Plan 113,6 % unplausibel; hier wird er aus DB II, Fixkosten und Capital Employed gerechnet und liegt wie im Original rund drei Viertel unter Plan." },
      { nr: 8, ziel: "kopf-titel", versatz: [26, 0], regel: "SIMPLIFY – Softwareneutral", titel: "Ohne Programmoberfläche",
        text: "Menüband, Explorer mit Berichtsordnern, Symbolleisten, Statuszeile und die Navigationsschaltflächen (Bilanz-, Finanz-, Kosten-/Erfolgs-Controlling) entfallen. Im Nachbau übernimmt der Seitennavigator die Verzweigung in weitere Cockpits." },
    ],
    nachbauIntro: "Seitengröße benutzerdefiniert 1024 × 646 px. Schrift Arial: Beschriftungen 10,5 pt, Visualtitel 12 pt. Datenmodell: Faktentabelle Erfolg (Monat, Szenario Ist/Plan, Umsatz, DB II, Cashflow, Fixkosten, Capital Employed) wie in der CSV-Datei mit Datumstabelle. Measures: Ist = CALCULATE(SUM(…); Szenario = \"Ist\"), Plan analog, kumuliert mit DATESYTD(Datum[Datum]). Weitere Cockpits über den Seitennavigator.",
    nachbau: [
      { id: "A", ziel: "vk-monat", anker: "links", versatz: [40, 0], titel: "Kennzahlen Ist gegen Plan", visual: "Matrix",
        felder: "Zeilen: Kennzahl (Feldparameter oder Berechnungsgruppe); Werte: Ist, Plan, ΔPL % (Monat), Ist kum., Plan kum., ΔPL kum. %",
        format: "Spaltengruppen über eine Berechnungsgruppe Zeitintelligenz (Monat, kumuliert); ΔPL % mit Datenbalken über zwei Measures (günstig #00806B, ungünstig #C62828), Achse automatisch; Zahlenformat je Kennzahl über dynamische Formatzeichenfolge",
        hinweis: "ROCE = DIVIDE(([DB II] − [Fixkosten]) × 12; [Capital Employed]); kumuliert mit dem Durchschnitt des Capital Employed." },
      { id: "B", ziel: "v-kennzahlen", anker: "links", versatz: [364, 4], titel: "Schalter Stichtag", visual: "Datenschnitt (Kacheln, Einfachauswahl)",
        felder: "Monat (Januar bis letzter Ist-Monat)", format: "Ausgewählt #3A3F44, Schrift weiß" },
      { id: "C", ziel: "vl-umsatz", anker: "links", versatz: [60, 6], titel: "Monatsverläufe", visual: "Gruppiertes Säulendiagramm (3×: Umsatz, DB II, Cashflow)",
        felder: "X-Achse: Monat (alle zwölf, „Elemente ohne Daten anzeigen“); Y-Achse: Plan, Ist",
        format: "Plan: Füllung #FFFFFF, Rahmen #3A3F44; Ist: #3A3F44; Überlappung über „Abstand innerhalb der Kategorie“ −40 %; Datenbeschriftung ein, Y-Achse und Gitternetz aus",
        hinweis: "Ist nach dem Stichtag als BLANK() statt 0, damit keine Nullwerte gezeichnet werden; Stichtaglinie als Konstantenlinie der X-Achse." },
      { id: "D", ziel: "kopf-titel", versatz: [26, 0], titel: "Kopf und Legende", visual: "Textfeld, Formen", felder: "Titel, Untertitel mit Stichtag (dynamischer Text), Legende Ist/Plan/günstig/ungünstig" },
    ],
    theme: DK.thema(),
    csv: { name: "controlling_cockpit_daten.csv", text: () => {
      const z = ["Monat;Szenario;Umsatz_TsdEUR;Deckungsbeitrag_II_TsdEUR;Cashflow_TsdEUR;Fixkosten_TsdEUR;Capital_Employed_TsdEUR"];
      [["Plan", P], ["Ist", I]].forEach(([sz, d]) => d.umsatz.forEach((_, m) => z.push([`${JAHR}-${String(m + 1).padStart(2, "0")}`, sz, d.umsatz[m], d.db2[m], d.cashflow[m], d.fixkosten[m], d.ce[m]].join(";"))));
      return z.join("\r\n"); } },
    tabellen: () => {
      const n = S.n;
      return [
        { titel: `Kennzahlen ${MLANG[n]} ${JAHR} und kumuliert ${kumText()}`, kopf: ["Kennzahl", "Ist", "Plan", "ΔPL %", "Ist kum.", "Plan kum.", "ΔPL kum. %"],
          zeilen: KZ.map(kz => { const w = werte(kz, n), f = v => zahl(v, kz.nk); return [`${kz.name} (${kz.einheit})`, f(w.ist), f(w.plan), delta(rel(w.ist, w.plan), 1), f(w.ik), f(w.pk), delta(rel(w.ik, w.pk), 1)]; }) },
        { titel: `Monatswerte ${JAHR} (Tsd. €)`, kopf: ["Monat", "Umsatz Ist", "Umsatz Plan", "DB II Ist", "DB II Plan", "Cashflow Ist", "Cashflow Plan"],
          zeilen: MON.map((m, i) => [m, i <= n ? zahl(I.umsatz[i]) : "–", zahl(P.umsatz[i]), i <= n ? zahl(I.db2[i]) : "–", zahl(P.db2[i]), i <= n ? zahl(I.cashflow[i]) : "–", zahl(P.cashflow[i])]) },
      ];
    },
  });
  zeichnen();
})();
