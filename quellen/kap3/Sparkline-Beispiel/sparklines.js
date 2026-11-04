/* Einzelvisual „Sparkline-Beispiel“ (Abb. 3.69): Produktionscontrolling mit täglicher Aktualisierung –
   drei Tabellen (Aufträge, Materialverfügbarkeit, Produktion) mit Sparklines der letzten 20 Arbeitstage.
   Seite 727 x 440 px = 110 x 66,6 mm. Daten: sparklines.json (daten_sparklines.py); Stichtagswerte des Originals.
   Diagrammtyp bleibt: Wortgrößen-Diagramme (Sparklines) in Tabellenzeilen neben dem aktuellen Wert. Spalten über alle
   drei Blöcke ausgerichtet, gemeinsamer Maßstab je Spalte, letzter Tag dunkel, Mindermengen rot unter der Nulllinie,
   Änderung zum Vortag als Abweichungsbalken nach Wirkung, Ziele als gestrichelte Bezugslinie.
   Klick auf eine Zeile hebt die Produktfamilie in allen Blöcken hervor, Klick auf einen Spaltenkopf sortiert. */
(() => {
  "use strict";
  const { zahl, delta, NBSP, sv, el, FARBE } = DK;
  const TAGE = DATA.tage, PF = DATA.familien, N = TAGE.length, ZD = DATA.ziel_dlz, ZP = DATA.ziel_ppm;
  const A = DATA.auftraege, LG = DATA.lager, PR = DATA.produktion, DZ = DATA.dlz, PP = DATA.ppm;
  const tag = i => `${TAGE[i].slice(8, 10)}.${TAGE[i].slice(5, 7)}.`;
  const stand = `${TAGE[N - 1].slice(8, 10)}.${TAGE[N - 1].slice(5, 7)}.${TAGE[N - 1].slice(0, 4)}`;
  const kurz = j => PF[j].replace("Produktfamilie", "Familie");
  const ROT = "#C62828";
  const letzt = r => r[N - 1], vortag = r => r[N - 2];
  const dA = j => (letzt(A[j]) / vortag(A[j]) - 1) * 100, dL = j => letzt(LG[j]) - vortag(LG[j]);

  /* Spalten: typ "saeulen" | "linie" | "delta"; wert(j) = aktueller Wert, reihe(j) = Tageswerte */
  const BLOECKE = [
    { id: "sp-auftraege", titel: ["Aufträge"], spalten: [
      { kopf: ["Bestellte Stückzahl", "Stück"], typ: "saeulen", reihe: j => A[j], wert: j => letzt(A[j]), fmt: v => zahl(v) },
      { kopf: ["Änderung zum Vortag", "in %"], typ: "delta", wert: dA, fmt: v => delta(v, 0), richtung: 1 },
    ] },
    { id: "sp-material", titel: ["Material-", "verfügbarkeit"], spalten: [
      { kopf: ["Lagermenge", "Stück, < 0 = Mindermenge"], typ: "saeulen", reihe: j => LG[j], wert: j => letzt(LG[j]), fmt: v => zahl(v),
        schlecht: v => v < 0 },
      { kopf: ["Änderung zum Vortag", "Stück"], typ: "delta", wert: dL, fmt: v => delta(v, 0), richtung: 1 },
    ] },
    { id: "sp-produktion", titel: ["Produktion"], spalten: [
      { kopf: ["Produktionsmenge", "Stück"], typ: "saeulen", reihe: j => PR[j], wert: j => letzt(PR[j]), fmt: v => zahl(v) },
      { kopf: ["Durchlaufzeit", `Std., Ziel ≤ ${zahl(ZD, 1)}`], typ: "linie", reihe: j => DZ[j], wert: j => letzt(DZ[j]), fmt: v => zahl(v, 2),
        ziel: ZD, schlecht: v => v > ZD },
      { kopf: ["Produktqualität", `PPM, Ziel ≤ ${zahl(ZP)}`], typ: "linie", reihe: j => PP[j], wert: j => letzt(PP[j]), fmt: v => zahl(v),
        ziel: ZP, schlecht: v => v > ZP, abNull: true },
    ] },
  ];

  const S = { auswahl: null, sort: null };              // sort: {b, c, ab}
  const auswaehlen = j => { S.auswahl = S.auswahl === j ? null : j; zeichnen(); };
  const sortieren = (b, c) => {
    S.sort = S.sort && S.sort.b === b && S.sort.c === c ? (S.sort.ab ? { b, c, ab: false } : null) : { b, c, ab: true };
    zeichnen();
  };
  addEventListener("keydown", e => { if (e.key === "Escape" && S.auswahl !== null) { S.auswahl = null; zeichnen(); } });

  DK.init({ titel: "Sparkline-Beispiel", breite: 727, hoehe: 440 });
  const bVis = DK.box("v-sparklines", 16, 10, 695, 422);

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
  const spanne = r => {
    const mi = Math.min(...r), ma = Math.max(...r);
    return `20 Tage: min. ${zahl(mi)} (${tag(r.indexOf(mi))}), max. ${zahl(ma)} (${tag(r.indexOf(ma))})`;
  };

  function botschaft(b) {
    const passt = x => x.find(t => DK.tw(t) <= b) || x[x.length - 1];
    const js = PF.map((p, j) => j);
    if (S.auswahl !== null) {
      const j = S.auswahl, teile = [`Aufträge ${delta(dA(j), 0, NBSP + "%")} zum Vortag`];
      if (letzt(LG[j]) < 0) teile.push(`Mindermenge ${zahl(-letzt(LG[j]))} Stück`);
      else teile.push(`Lager ${zahl(letzt(LG[j]))} Stück`);
      teile.push(`Durchlaufzeit ${zahl(letzt(DZ[j]), 2)} Std.${letzt(DZ[j]) > ZD ? " (über Ziel)" : ""}`);
      teile.push(`${zahl(letzt(PP[j]))} PPM${letzt(PP[j]) > ZP ? " (über Ziel)" : ""}`);
      return passt([`${PF[j]}: ${teile.join(", ")}`, `${PF[j]}: ${teile.slice(0, 3).join(", ")}`, `${PF[j]}: ${teile.slice(0, 2).join(", ")}`]);
    }
    const sprung = js.filter(j => Math.abs(dA(j)) >= 50).map(j => `${kurz(j)} ${delta(dA(j), 0, NBSP + "%")}`);
    const fehl = js.filter(j => letzt(LG[j]) < 0);
    const dlz = js.filter(j => letzt(DZ[j]) > ZD).map(j => String(j + 1));
    const tAuf = sprung.length ? `Aufträge ${sprung.join(", ")} zum Vortag` : "Aufträge ohne große Sprünge";
    const tFehl = fehl.length ? fehl.map(j => `${kurz(j)} mit ${zahl(-letzt(LG[j]))} Stück Mindermenge`).join(", ") : "keine Mindermengen";
    const tDlz = dlz.length ? `Durchlaufzeit über Ziel bei Familie ${dlz.join(" und ")}` : "Durchlaufzeiten im Ziel";
    return passt([`${tAuf}; ${tFehl}; ${tDlz}`, `${tAuf}; ${tFehl}`, tAuf]);
  }

  /* ---------- Zeichnen ---------- */
  function tabelle(ziel, breite, hoehe) {
    ziel.textContent = "";
    const svg = sv("svg", { width: breite, height: hoehe, role: "img",
      "aria-label": `Sparkline-Tabellen Produktionscontrolling, 20 Arbeitstage bis ${stand}` }, ziel);
    const lw = 140, GW = (breite - lw) / 3, VW = 62, SW = GW - VW - 16;
    const kh = 38, rh = 24, lueck = 18, bh = kh + PF.length * rh;
    const gx = c => lw + GW * c;                                       // Beginn der Spaltengruppe
    BLOECKE.forEach((B, b) => {
      const y0 = b * (bh + lueck);
      const gb = sv("g", { id: B.id }, svg);
      // Kopf
      const gk = sv("g", { id: `${B.id}-kopf` }, gb);
      B.titel.forEach((t, z) => sv("text", { x: 0, y: y0 + 10 + z * 17, dy: "0.35em", style: "font-weight:bold" }, gk, t));
      B.spalten.forEach((s, c) => {
        const g = sv("g", { class: DK.PRINT ? "" : "dk-klick" }, gk);
        const pfeil = S.sort && S.sort.b === b && S.sort.c === c ? (S.sort.ab ? " ▾" : " ▴") : "";
        sv("text", { x: gx(c) + 6, y: y0 + 10, dy: "0.35em" }, g, s.kopf[0] + pfeil);
        sv("text", { x: gx(c) + 6, y: y0 + 27, dy: "0.35em", class: "muted" }, g, s.kopf[1]);
        if (!DK.PRINT) {
          const h = sv("rect", { x: gx(c), y: y0, width: GW, height: kh, fill: "none", "pointer-events": "all" }, g);
          h.addEventListener("click", () => sortieren(b, c));
          sv("title", {}, h, "Klick sortiert");
        }
      });
      sv("line", { x1: 0, x2: breite, y1: y0 + kh - 0.5, y2: y0 + kh - 0.5, stroke: "#3A3F44", "stroke-width": 1 }, gk);
      // Reihenfolge der Zeilen
      let ord = PF.map((p, j) => j);
      if (S.sort && S.sort.b === b) {
        const w = B.spalten[S.sort.c].wert;
        ord = ord.sort((p, q) => (S.sort.ab ? w(q) - w(p) : w(p) - w(q)));
      }
      // Maßstäbe je Spalte (über alle Produktfamilien gemeinsam)
      const mass = B.spalten.map(s => {
        if (s.typ === "delta") { const w = PF.map((p, j) => s.wert(j)); return { neg: Math.max(0, ...w.map(v => -v)), pos: Math.max(0, ...w) }; }
        const alle = PF.flatMap((p, j) => s.reihe(j)).concat(s.ziel ?? []);
        if (s.typ === "linie") {
          const mi = s.abNull ? 0 : Math.min(...alle), ma = Math.max(...alle), r = ma - mi;
          return { mi: s.abNull ? 0 : mi - r * 0.08, ma: ma + r * 0.04 };
        }
        return { mi: Math.min(0, ...alle), ma: Math.max(0, ...alle) };
      });
      ord.forEach((j, z) => {
        const y = y0 + kh + z * rh, yc = y + rh / 2, blass = S.auswahl !== null && S.auswahl !== j;
        const g = sv("g", { class: "dk-klick" + (blass ? " dk-blass" : ""), "data-name": PF[j] }, gb);
        sv("line", { x1: 0, x2: breite, y1: y + rh - 0.5, y2: y + rh - 0.5, stroke: "#EFEFEF", "stroke-width": 1 }, g);
        sv("text", { x: 0, y: yc, dy: "0.35em" }, g, PF[j]);
        B.spalten.forEach((s, c) => {
          const x0 = gx(c) + 6, xv = gx(c) + GW - 4, m = mass[c], v = s.wert(j);
          const gs = sv("g", { id: `${B.id}-${c}-${j}` }, g);
          if (s.typ === "delta") {
            const k = (SW + VW - 64) / Math.max(m.neg + m.pos, 1e-9), mitte = x0 + m.neg * k, w = Math.abs(v) * k;
            const kl = DK.wirkung(v, s.richtung, 1);
            sv("line", { x1: mitte, x2: mitte, y1: y + 3, y2: y + rh - 3, stroke: "#8C8C8C", "stroke-width": 1 }, gs);
            sv("rect", { x: v >= 0 ? mitte : mitte - w, y: yc - 5, width: Math.max(1, w), height: 10, fill: FARBE[kl] }, gs);
            sv("text", { x: xv, y: yc, dy: "0.35em", "text-anchor": "end", style: `font-weight:bold;fill:${FARBE[kl]}` }, gs, s.fmt(v));
            return;
          }
          const r = s.reihe(j), slot = SW / N, top = y + 3, unten = y + rh - 3;
          const sy = w => unten - (w - m.mi) / (m.ma - m.mi) * (unten - top);
          if (s.typ === "saeulen") {
            const nl = sy(0);
            r.forEach((w, i) => {
              const fill = w < 0 ? ROT : i === N - 1 ? "#3A3F44" : "#A9A9A9";
              sv("rect", { x: x0 + i * slot + 0.8, y: Math.min(sy(w), nl), width: slot - 1.6, height: Math.max(0.8, Math.abs(sy(w) - nl)), fill }, gs);
            });
            if (m.mi < 0) sv("line", { x1: x0, x2: x0 + SW, y1: nl, y2: nl, stroke: "#8C8C8C", "stroke-width": 0.8 }, gs);
          } else {
            if (s.ziel != null) sv("line", { x1: x0, x2: x0 + SW, y1: sy(s.ziel), y2: sy(s.ziel), stroke: "#8C8C8C", "stroke-width": 1, "stroke-dasharray": "3 2" }, gs);
            sv("path", { d: r.map((w, i) => `${i ? "L" : "M"}${(x0 + (i + 0.5) * slot).toFixed(1)},${sy(w).toFixed(1)}`).join(" "),
              fill: "none", stroke: "#6E747A", "stroke-width": 1.3, "stroke-linejoin": "round" }, gs);
            sv("circle", { cx: x0 + (N - 0.5) * slot, cy: sy(v), r: 2.6, fill: s.schlecht && s.schlecht(v) ? ROT : "#3A3F44" }, gs);
          }
          const rot = s.schlecht && s.schlecht(v);
          sv("text", { x: xv, y: yc, dy: "0.35em", "text-anchor": "end", style: rot ? `font-weight:bold;fill:${ROT}` : "" }, gs, s.fmt(v));
        });
        const hit = sv("rect", { x: 0, y, width: breite, height: rh, fill: "transparent" }, g);
        hit.addEventListener("click", () => auswaehlen(j));
        tooltip(hit, () => {
          const z = [`${PF[j]} – ${B.titel.join("").replace("-", "")}, Stand ${stand}`];
          if (b === 0) z.push(`Bestellt ${zahl(letzt(A[j]))} Stück, Vortag ${zahl(vortag(A[j]))} (${delta(dA(j), 1, NBSP + "%")})`, spanne(A[j]));
          if (b === 1) z.push(`Lager ${zahl(letzt(LG[j]))} Stück, Vortag ${zahl(vortag(LG[j]))} (${delta(dL(j), 0)})`, spanne(LG[j]),
            letzt(LG[j]) < 0 ? `Mindermenge seit ${tag(LG[j].findIndex((w, i) => LG[j].slice(i).every(x => x < 0)))}` : "keine Mindermenge");
          if (b === 2) z.push(`Produktion ${zahl(letzt(PR[j]))} Stück, Vortag ${zahl(vortag(PR[j]))}`,
            `Durchlaufzeit ${zahl(letzt(DZ[j]), 2)} Std. (Ziel ≤ ${zahl(ZD, 1)}), Mittel 20 Tage ${zahl(DZ[j].reduce((s, w) => s + w, 0) / N, 2)}`,
            `Qualität ${zahl(letzt(PP[j]))} PPM (Ziel ≤ ${zahl(ZP)}), Spitze ${zahl(Math.max(...PP[j]))} am ${tag(PP[j].indexOf(Math.max(...PP[j])))}`);
          z.push("Klick hebt die Produktfamilie hervor");
          return z;
        });
      });
    });
  }

  function zeichnen() {
    const v = DK.visual(bVis, { titel: "Produktionscontrolling je Produktfamilie", einheit: `20 Arbeitstage bis ${stand}`, botschaft: botschaft(695) });
    tabelle(v.flaeche, v.breite, v.hoehe);
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  const reiheTab = (titel, R, f) => ({ titel, kopf: ["Tag", ...PF.map((p, j) => kurz(j))], zeilen: TAGE.map((t, i) => [tag(i), ...PF.map((p, j) => f(R[j][i]))]) });
  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "v-sparklines", anker: "links", versatz: [690, 26], regel: "SAY – Botschaft vermitteln", titel: "Kernaussage unter dem Titel",
        text: "Unter dem Titel steht, was heute auffällt: Sprünge im Auftragseingang, Mindermengen und Durchlaufzeiten über Ziel – aus den Daten berechnet. Das Original hatte nur die Überschrift „Cockpit: Produktionscontrolling (tägl. Aktualisierung)“." },
      { nr: 2, ziel: "sp-auftraege-0-0", anker: "links", versatz: [-4, -8], regel: "EXPRESS – Verlauf im Wortformat", titel: "Sparklines neben dem Wert",
        text: "Jede Sparkline zeigt die letzten 20 Arbeitstage, der heutige Tag ist dunkel; daneben steht der aktuelle Wert. So sieht man, ob ein Wert ein Ausreißer oder Teil eines Trends ist. Wie im Original sind Stückzahlen Säulen, Durchlaufzeit und Qualität Linien; neu sind Mindermengen als rote Säulen unter einer Nulllinie statt kaum sichtbarer Striche." },
      { nr: 3, ziel: "sp-material-1-0", versatz: [32, 0], regel: "UNIFY – Semantische Notation", titel: "Farbe nach Wirkung statt Orange",
        text: "Das Original färbte Zellen in zwei Orangetönen ohne erkennbare Regel (−53 % kräftig, +14 % hell, +178 % gar nicht). Jetzt gilt im ganzen Buch dieselbe Regel: rot ungünstig, blaugrün günstig; bei Durchlaufzeit und Qualität ist die Regel – das Ziel – im Spaltenkopf genannt." },
      { nr: 4, ziel: "sp-produktion-2-0", anker: "links", versatz: [88, 1], regel: "CHECK – Gleicher Maßstab", titel: "Ein Maßstab je Spalte, Ziel als Linie",
        text: "Alle Sparklines einer Spalte haben denselben Maßstab, Säulen beginnen bei null – die Familien sind damit vergleichbar. Bei Durchlaufzeit und Qualität markiert eine gestrichelte Linie das Ziel. Einzeln skalierte Sparklines zeigen das Muster deutlicher, verleiten aber zum Vergleich unvergleichbarer Höhen." },
      { nr: 5, ziel: "sp-auftraege-1-0", versatz: [32, 0], regel: "CONDENSE – Abweichung als Balken", titel: "Änderung zum Vortag mit Balken",
        text: "Die Änderung zum Vortag steht als Abweichungsbalken an einer Nulllinie mit Zahl daneben; Prozent bei den Aufträgen, Stück beim Lager – die Einheit steht im Kopf. Im Original standen nur Zahlen, teils mit, teils ohne Vorzeichen." },
      { nr: 6, ziel: "sp-produktion-kopf", anker: "links", versatz: [110, -4], regel: "STRUCTURE – Ausrichten", titel: "Drei Blöcke, ein Raster",
        text: "Die drei Blöcke folgen dem Prozess (Auftrag, Material, Produktion) und nutzen dieselben Spaltenbreiten, sodass Sparklines und Werte untereinanderstehen. Zellrahmen und Gitter entfallen; Kopfzeilen nennen Kennzahl und Einheit in zwei Zeilen; „Produktfamilie1“ heißt jetzt „Produktfamilie 1“." },
      { nr: 7, ziel: "sp-material-kopf", anker: "links", versatz: [128, -4], regel: "SIMPLIFY – Interaktion statt Zusatzspalten", titel: "Klick, Tooltip, Sortierung",
        text: "Ein Klick auf eine Zeile hebt die Produktfamilie in allen drei Blöcken hervor; der Tooltip nennt Vortag, Minimum und Maximum der 20 Tage. Ein Klick auf einen Spaltenkopf sortiert den Block. Esc hebt die Auswahl auf." },
    ],
    nachbauIntro: "Seitengröße benutzerdefiniert 727 × 440 px. Schrift Arial: Beschriftungen 10,5 pt, Titel 12 pt. Datenmodell: Tabelle Produktion (Datum, Produktfamilie, Bestellte Stück, Lagermenge, Produktionsmenge, Durchlaufzeit, Qualität PPM) wie in der CSV-Datei, dazu eine Datumstabelle nur mit Arbeitstagen.",
    nachbau: [
      { id: "A", ziel: "sp-auftraege-0-0", anker: "links", versatz: [-4, -8], titel: "Tabellen mit Sparklines", visual: "Tabelle (Standardvisual) mit Sparklines – je Block eine Tabelle",
        felder: "Zeilen: Produktfamilie; Werte: Measures für den Stichtag, z. B. Bestellt heute = CALCULATE(SUM(Produktion[Bestellte Stück]), LASTDATE(Datum[Datum])); Sparkline über Kontextmenü des Werts › Sparkline hinzufügen: Y-Achse Summe des Felds, X-Achse Datum",
        format: "Sparklines: Diagrammtyp Säule (Stückzahlen) bzw. Linie (Durchlaufzeit, Qualität), Farbe #A9A9A9 bzw. #6E747A, Markierung „Letzter“ #3A3F44; Rasterlinien und Zellrahmen aus",
        hinweis: "Negative Säulen lassen sich in der Sparkline nicht eigens rot färben, Ziellinien sind in Sparklines nicht vorgesehen – beides zeigt dann nur die Zahl daneben." },
      { id: "B", ziel: "sp-auftraege-1-0", versatz: [32, 0], titel: "Änderung zum Vortag", visual: "Spalte derselben Tabelle mit Datenbalken",
        felder: "Measure ΔVT % = DIVIDE([Bestellt heute], CALCULATE([Bestellt heute], OFFSET(-1, ALLSELECTED(Datum[Datum]), ORDERBY(Datum[Datum])))) − 1; Lager analog als Differenz",
        format: "Bedingte Formatierung › Datenbalken: positiv #00806B, negativ #C62828, Achse in der Mitte; Schriftfarbe nach denselben Regeln" },
      { id: "C", ziel: "sp-produktion-2-0", anker: "links", versatz: [88, 1], titel: "Werte gegen Ziel", visual: "Bedingte Formatierung in der Tabelle",
        felder: "Durchlaufzeit heute, Qualität heute; Ziele 4,0 Std. und 80 PPM als Measures",
        format: "Schriftfarbe › Regeln: Wert > Ziel → #C62828, fett; Lagermenge < 0 → #C62828" },
    ],
    theme: DK.thema(),
    csv: { name: "sparkline_daten.csv", text: () => ["Datum;Produktfamilie;Bestellte_Stueck;Lagermenge_Stueck;Produktionsmenge_Stueck;Durchlaufzeit_Std;Qualitaet_PPM",
      ...TAGE.flatMap((t, i) => PF.map((p, j) => [`${tag(i)}${t.slice(0, 4)}`, p, A[j][i], LG[j][i], PR[j][i], zahl(DZ[j][i], 2), PP[j][i]].join(";")))].join("\r\n") },
    tabellen: () => [
      { titel: `Stichtag ${stand}`, kopf: ["Produktfamilie", "Bestellt", "ΔVT in %", "Lager", "ΔVT Stück", "Produktion", "DLZ Std.", "PPM"],
        zeilen: PF.map((p, j) => [p, zahl(letzt(A[j])), delta(dA(j), 1), zahl(letzt(LG[j])), delta(dL(j), 0), zahl(letzt(PR[j])), zahl(letzt(DZ[j]), 2), zahl(letzt(PP[j]))]) },
      reiheTab("Bestellte Stückzahl je Tag", A, v => zahl(v)), reiheTab("Lagermenge je Tag (Stück)", LG, v => zahl(v)),
      reiheTab("Produktionsmenge je Tag (Stück)", PR, v => zahl(v)), reiheTab("Durchlaufzeit je Tag (Std.)", DZ, v => zahl(v, 2)),
      reiheTab("Produktqualität je Tag (PPM)", PP, v => zahl(v)),
    ],
  });
  zeichnen();
})();
