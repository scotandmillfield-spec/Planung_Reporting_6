/* Einzelvisual „Kombination Kreis-Säulen-Diagramm“ (Abb. 3.72): Umsatz 2027 nach Kundengruppen als Kreis,
   das Segment der Kundengruppe A als gestapelte Säule nach Kunden aufgeschlüsselt.
   Seite 727 x 420 px = 110 x 63,6 mm. Daten: kreis_saeule.json (daten_kreis_saeule.py), Anteile des Originals.
   Diagrammtyp bleibt: Kreis mit herausgelöstem Segment, daneben die Säule, Verbindungslinien vom Segment zur Säule.
   Grautöne statt Gelb und Blau, Segment A und Säule anthrazit (eine Gruppe), Beschriftung direkt statt Legende.
   Klick auf ein Segment oder einen Säulenabschnitt hebt ihn hervor. */
(() => {
  "use strict";
  const { zahl, NBSP, sv, el } = DK;
  const J = DATA.jahr;
  const GR = DATA.gruppen.map(([name, wert]) => ({ key: name, name, wert }));
  const KA = DATA.kunden_a.map(([name, wert]) => ({ key: name, name, wert }));
  const GES = GR.reduce((s, g) => s + g.wert, 0);
  const A = GR[0], SUM_A = KA.reduce((s, k) => s + k.wert, 0);
  const pz = (a, nk = 0) => zahl(a * 100, nk) + NBSP + "%";
  const mio = v => zahl(v, 1);
  const TAU = 2 * Math.PI;
  // Kreis: Segment A zeigt zur Säule (Mitte bei 3 Uhr), danach die übrigen Gruppen im Uhrzeigersinn nach Größe
  const REST = GR.slice(1).sort((a, b) => b.wert - a.wert);
  const FUELL = { [A.key]: "#3A3F44" };
  ["#6E747A", "#A9A9A9", "#D4D4D4"].forEach((f, i) => { FUELL[REST[i].key] = f; });
  // Säule: Kunden absteigend von oben, „sonstige“ zuletzt (unten)
  const SAEULE = KA.filter(k => !k.name.startsWith("sonstige")).sort((a, b) => b.wert - a.wert)
    .concat(KA.filter(k => k.name.startsWith("sonstige")));

  /* ---------- Zustand ---------- */
  const S = { auswahl: null };
  const auswaehlen = k => { S.auswahl = S.auswahl === k ? null : k; zeichnen(); };
  addEventListener("keydown", e => { if (e.key === "Escape" && S.auswahl !== null) { S.auswahl = null; zeichnen(); } });
  const istKunde = k => KA.some(x => x.key === k);
  const blass = key => {
    const s = S.auswahl;
    if (s === null || s === key) return false;
    if (s === A.key) return !(key === A.key || istKunde(key));        // Gruppe A: Säule bleibt sichtbar
    if (istKunde(s)) return key !== A.key;                              // Kunde: Segment A bleibt sichtbar
    return true;
  };

  DK.init({ titel: "Kombination Kreis-Säulen-Diagramm", breite: 727, hoehe: 420 });
  const bVis = DK.box("v-ks", 16, 10, 695, 402);

  /* ---------- Tooltip ---------- */
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

  /* ---------- Botschaft ---------- */
  const passt = (k, b) => k.find(t => DK.tw(t) <= b) || k[k.length - 1];
  function botschaft(b) {
    const s = S.auswahl;
    if (s !== null && istKunde(s)) {
      const k = KA.find(x => x.key === s);
      return passt([`${k.name}: ${mio(k.wert)} Mio. € = ${pz(k.wert / GES)} des Umsatzes, ${pz(k.wert / SUM_A)} der Kundengruppe A`,
        `${k.name}: ${mio(k.wert)} Mio. € = ${pz(k.wert / GES)} des Umsatzes`], b);
    }
    if (s !== null) {
      const g = GR.find(x => x.key === s);
      return passt([`${g.name}: ${mio(g.wert)} Mio. € = ${pz(g.wert / GES)} des Umsatzes von ${mio(GES)} Mio. €`], b);
    }
    const [k1, k2] = KA.filter(k => !k.name.startsWith("sonstige")).sort((a, c) => c.wert - a.wert);
    const groesste = GR.slice().sort((a, c) => c.wert - a.wert)[0];
    const anfang = groesste === A ? `${A.name} ist mit ${pz(A.wert / GES)} die größte Gruppe` : `${A.name} trägt ${pz(A.wert / GES)} zum Umsatz bei`;
    return passt([`${anfang}; ${k1.name} und ${k2.name.replace("Kunde ", "")} allein ${pz((k1.wert + k2.wert) / GES)} des Umsatzes`,
      `${anfang}; ${k1.name} und ${k2.name.replace("Kunde ", "")} allein ${pz((k1.wert + k2.wert) / GES)}`, anfang], b);
  }

  /* ---------- Kreis und Säule ---------- */
  const P = (cx, cy, r, a) => [cx + r * Math.sin(a), cy - r * Math.cos(a)];   // a im Uhrzeigersinn ab 12 Uhr
  const sektor = (cx, cy, r, a0, a1) => {
    const [ax, ay] = P(cx, cy, r, a0), [bx, by] = P(cx, cy, r, a1);
    return `M${cx},${cy}L${ax},${ay}A${r},${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${bx},${by}Z`;
  };
  function diagramm(ziel, breite, hoehe) {
    ziel.textContent = "";
    const svg = sv("svg", { width: breite, height: hoehe, role: "img",
      "aria-label": `Kreisdiagramm Umsatz ${J} nach Kundengruppen, Kundengruppe A als gestapelte Säule nach Kunden` }, ziel);
    const R = 142, cx = 288, cy = hoehe / 2;
    const gV = sv("g", { id: "ks-verbinder" }, svg), gK = sv("g", { id: "ks-kreis" }, svg), gLL = sv("g", { id: "ks-lab-links" }, svg);
    const gS = sv("g", { id: "ks-saeule" }, svg), gLR = sv("g", { id: "ks-lab-rechts" }, svg);

    // Segmente: A mittig bei 3 Uhr, dann Rest im Uhrzeigersinn
    const wA = TAU * A.wert / GES, aA0 = Math.PI / 2 - wA / 2, aA1 = Math.PI / 2 + wA / 2;
    const segs = [{ g: A, a0: aA0, a1: aA1 }];
    let a0 = aA1;
    REST.forEach(g => { const a1 = a0 + TAU * g.wert / GES; segs.push({ g, a0, a1 }); a0 = a1; });
    const links = [];
    segs.forEach(({ g, a0, a1 }) => {
      const gg = sv("g", { class: "dk-klick" + (blass(g.key) ? " dk-blass" : ""), "data-name": g.name }, gK);
      sv("path", { d: sektor(cx, cy, R, a0, a1), fill: FUELL[g.key], stroke: "#FFFFFF", "stroke-width": 2 }, gg);
      const hit = sv("path", { d: sektor(cx, cy, R, a0, a1), fill: "transparent" }, gg);
      hit.addEventListener("click", () => auswaehlen(g.key));
      tooltip(hit, () => {
        const z = [g.name, `Umsatz ${J}: ${mio(g.wert)} Mio. € · Anteil ${pz(g.wert / GES, 1)}`];
        if (g === A) z.push(`Aufgeschlüsselt in der Säule: ${KA.length} Positionen, zusammen ${mio(SUM_A)} Mio. €`);
        z.push("Klick hebt das Segment hervor");
        return z;
      });
      const am = (a0 + a1) / 2;
      if (g === A) {                                                     // Beschriftung innen, weiß
        const [mx, my] = P(cx, cy, R * 0.55, am);
        const t = sv("text", { x: mx, y: my - 9, dy: "0.35em", "text-anchor": "middle", style: "fill:#FFFFFF;pointer-events:none;font-weight:bold" }, gg, g.name);
        sv("tspan", { x: mx, dy: 18, style: "font-weight:normal" }, t, `${mio(g.wert)} · ${pz(g.wert / GES)}`);
      } else {
        const [px, py] = P(cx, cy, R + 4, am);
        links.push({ g, am, px, py, y: P(cx, cy, R + 22, am)[1] });
      }
    });
    // äußere Beschriftung links (B, C, D liegen links der Senkrechten), Etiketten auseinanderschieben
    const H = 36, oben = 16, unten = hoehe - 18;
    links.sort((p, q) => p.y - q.y);
    links.forEach((l, k) => { l.y = Math.max(l.y, oben, k ? links[k - 1].y + H : -Infinity); });
    for (let k = links.length - 1; k >= 0; k--)
      links[k].y = Math.min(links[k].y, unten - (links.length - 1 - k) * H, k < links.length - 1 ? links[k + 1].y - H : Infinity);
    links.forEach(l => {
      const x = cx - R - 30, g = sv("g", { class: blass(l.g.key) ? "dk-blass" : "" }, gLL);
      const [kx, ky] = P(cx, cy, R + 14, l.am);
      sv("polyline", { points: `${l.px},${l.py} ${kx},${ky} ${x + 5},${l.y}`, fill: "none", stroke: "#8C8C8C", "stroke-width": 1 }, g);
      sv("text", { x, y: l.y - 8, dy: "0.35em", "text-anchor": "end", style: "font-weight:bold" }, g, l.g.name);
      sv("text", { x, y: l.y + 9, dy: "0.35em", "text-anchor": "end" }, g, `${mio(l.g.wert)} · ${pz(l.g.wert / GES)}`);
    });

    // Säule: Höhe 240 px für die Gruppe A, Abschnitte proportional
    const sx = cx + R + 56, sb = 48, sh = 240, top = cy - sh / 2, k = sh / SUM_A;
    const [ox, oy] = P(cx, cy, R, aA0), [ux, uy] = P(cx, cy, R, aA1);
    const vb = blass(A.key) && (S.auswahl === null || !istKunde(S.auswahl)) ? " dk-blass" : "";
    const gv = sv("g", { class: vb.trim() }, gV);
    sv("line", { x1: ox, y1: oy, x2: sx, y2: top, stroke: "#8C8C8C", "stroke-width": 1 }, gv);
    sv("line", { x1: ux, y1: uy, x2: sx, y2: top + sh, stroke: "#8C8C8C", "stroke-width": 1 }, gv);
    let y = top;
    const rechts = [];
    SAEULE.forEach((kd, i) => {
      const h = kd.wert * k;
      const gg = sv("g", { class: "dk-klick" + (blass(kd.key) ? " dk-blass" : ""), "data-name": kd.name }, gS);
      sv("rect", { x: sx, y, width: sb, height: h, fill: "#3A3F44" }, gg);
      if (i) sv("line", { x1: sx - 1, x2: sx + sb + 1, y1: y, y2: y, stroke: "#FFFFFF", "stroke-width": 2 }, gg);
      const hit = sv("rect", { x: sx - 4, y, width: sb + 8, height: h, fill: "transparent" }, gg);
      hit.addEventListener("click", () => auswaehlen(kd.key));
      tooltip(hit, () => [kd.name, `Umsatz ${J}: ${mio(kd.wert)} Mio. €`,
        `Anteil am Gesamtumsatz ${pz(kd.wert / GES, 1)} · an Kundengruppe A ${pz(kd.wert / SUM_A, 1)}`, "Klick hebt den Kunden hervor"]);
      rechts.push({ kd, ym: y + h / 2, y: y + h / 2 });
      y += h;
    });
    rechts.forEach((l, i) => { l.y = Math.max(l.y, oben, i ? rechts[i - 1].y + H : -Infinity); });
    for (let i = rechts.length - 1; i >= 0; i--)
      rechts[i].y = Math.min(rechts[i].y, unten - (rechts.length - 1 - i) * H, i < rechts.length - 1 ? rechts[i + 1].y - H : Infinity);
    rechts.forEach(l => {
      const x = sx + sb + 18, g = sv("g", { class: blass(l.kd.key) ? "dk-blass" : "" }, gLR);
      sv("polyline", { points: `${sx + sb + 2},${l.ym} ${sx + sb + 8},${l.ym} ${x - 4},${l.y}`, fill: "none", stroke: "#8C8C8C", "stroke-width": 1 }, g);
      sv("text", { x, y: l.y - 8, dy: "0.35em", style: "font-weight:bold" }, g, l.kd.name);
      sv("text", { x, y: l.y + 9, dy: "0.35em" }, g, `${mio(l.kd.wert)} · ${pz(l.kd.wert / GES)}`);
    });
  }

  function zeichnen() {
    const v = DK.visual(bVis, { titel: `Umsatz ${J} nach Kundengruppen, Gruppe A nach Kunden`, einheit: "Mio. € und Anteil am Umsatz", botschaft: botschaft(695) });
    diagramm(v.flaeche, v.breite, v.hoehe);
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  /* ---------- Lernplattform ---------- */
  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "v-ks", anker: "links", versatz: [690, 26], regel: "SAY – Botschaft vermitteln", titel: "Kernaussage unter dem Titel",
        text: "Unter dem Titel steht, was die Kombination zeigt: welchen Anteil die Kundengruppe A am Umsatz hat und dass zwei Kunden einen großen Teil davon tragen. Das Original hatte weder Titel noch Einheit." },
      { nr: 2, ziel: "ks-verbinder", anker: "links", versatz: [56, -16], regel: "STRUCTURE – Inhalte ordnen", titel: "Segment zeigt zur Säule",
        text: "Das aufgeschlüsselte Segment steht bei 3 Uhr, direkt vor der Säule; zwei Linien verbinden seine Kanten mit Ober- und Unterkante der Säule. So ist klar, dass die Säule nur dieses Segment zerlegt – das ist der Kern des Diagrammtyps, er bleibt erhalten." },
      { nr: 3, ziel: "ks-saeule", anker: "links", versatz: [40, 24], regel: "UNIFY – Semantische Notation", titel: "Eine Farbe für eine Gruppe",
        text: "Segment A und alle Säulenabschnitte sind anthrazit – sie gehören zusammen; die übrigen Gruppen sind grau abgestuft. Das Original nutzte Gelbtöne für den Kreis und fünf Blautöne für die Säule ohne weitere Bedeutung." },
      { nr: 4, ziel: "ks-lab-rechts", anker: "links", versatz: [140, 0], regel: "SIMPLIFY – Überflüssiges weglassen", titel: "Beschriftung statt Legende",
        text: "Name, Wert und Anteil stehen direkt an Segment und Abschnitt; die Legende mit acht Farbfeldern unter dem Diagramm entfällt, ebenso der Rahmen." },
      { nr: 5, ziel: "ks-kreis", anker: "links", versatz: [68, 130], regel: "STRUCTURE – Inhalte ordnen", titel: "Nach Größe geordnet",
        text: "Die übrigen Gruppen folgen im Uhrzeigersinn nach Größe (C, B, D), die Kunden in der Säule von oben absteigend, „sonstige A-Kunden“ zuletzt. Im Original standen D, B, C und die Kunden in der Reihenfolge A1 bis A4." },
      { nr: 6, ziel: "ks-saeule", anker: "links", versatz: [40, 150], regel: "CHECK – Visuelle Integrität", titel: "Zwei Maßstäbe",
        text: "Kreis und Säule haben verschiedene Maßstäbe: 30 % des Kreises entsprechen der ganzen Säule. Deshalb stehen die Anteile am Gesamtumsatz an jedem Abschnitt. Wer alle Kunden vergleichen will, ist mit einem nach Umsatz sortierten Balkendiagramm besser bedient." },
      { nr: 7, ziel: "ks-kreis", anker: "links", versatz: [140, 200], regel: "CONDENSE – Hervorheben", titel: "Klick auf Segment oder Abschnitt",
        text: "Ein Klick hebt eine Gruppe oder einen Kunden hervor; die Aussage nennt Wert und Anteile. Ein Klick auf Segment A hebt die ganze Säule mit hervor. Esc hebt die Auswahl auf." },
    ],
    nachbauIntro: "Seitengröße benutzerdefiniert 727 × 420 px. Schrift Arial: Beschriftungen 10,5 pt, Titel 12 pt. Datenmodell: Tabelle Umsatz (Jahr, Kundengruppe, Kunde, Umsatz in Mio. €) wie in der CSV-Datei; Kunde nur für Gruppe A gefüllt.",
    nachbau: [
      { id: "A", ziel: "ks-kreis", anker: "links", versatz: [140, 0], titel: "Kreis", visual: "Kreisdiagramm (Standardvisual)",
        felder: "Legende: Kundengruppe; Werte: Umsatz", format: "Farben A #3A3F44, C #6E747A, B #A9A9A9, D #D4D4D4; Trennlinien weiß; Drehung so, dass A bei 3 Uhr liegt; Detailbeschriftung Kategorie, Datenwert, Prozentsatz; Legende aus",
        hinweis: "Ein Kreis-aus-Säule-Diagramm (Excel: „Balken aus Kreis“) gibt es in Power BI nicht als Standardvisual; Kreis und Säule werden als zwei Visuals nebeneinandergesetzt." },
      { id: "B", ziel: "ks-saeule", anker: "links", versatz: [40, 24], titel: "Säule der Gruppe A", visual: "Gestapeltes Säulendiagramm (Standardvisual)",
        felder: "Legende: Kunde; Werte: Umsatz; Filter Kundengruppe = A", format: "Alle Reihen #3A3F44, Rahmen weiß 1 px; Achsen und Gitternetz aus; Datenbeschriftung aus (Beschriftung über Textfelder oder Tooltip)" },
      { id: "C", ziel: "ks-verbinder", anker: "links", versatz: [56, -16], titel: "Verbindungslinien", visual: "Form › Linie (2×)",
        felder: "–", format: "#8C8C8C, 1 pt", hinweis: "Statische Formen; sie passen nur, solange Gruppe A bei 3 Uhr liegt." },
    ],
    theme: DK.thema(),
    csv: { name: "kreis_saeule_umsatz_daten.csv", text: () => {
      const z = ["Jahr;Kundengruppe;Kunde;Umsatz_Mio_EUR"];
      REST.slice().sort((a, b) => a.name.localeCompare(b.name)).forEach(g => z.push([J, g.name, "", zahl(g.wert, 2)].join(";")));
      KA.forEach(k => z.push([J, A.name, k.name, zahl(k.wert, 2)].join(";")));
      return z.join("\r\n"); } },
    tabellen: () => [
      { titel: `Umsatz ${J} nach Kundengruppen (Mio. €)`, kopf: ["Kundengruppe", "Umsatz", "Anteil"],
        zeilen: [...[A, ...REST].map(g => [g.name, mio(g.wert), pz(g.wert / GES, 1)]), ["Summe", mio(GES), pz(1, 1)]] },
      { titel: `Kundengruppe A nach Kunden (Mio. €)`, kopf: ["Kunde", "Umsatz", "Anteil am Umsatz", "Anteil an Gruppe A"],
        zeilen: [...SAEULE.map(k => [k.name, mio(k.wert), pz(k.wert / GES, 1), pz(k.wert / SUM_A, 1)]), ["Summe", mio(SUM_A), pz(SUM_A / GES, 1), pz(1, 1)]] },
    ],
  });
  zeichnen();
})();
