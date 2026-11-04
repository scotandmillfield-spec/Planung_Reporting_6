/* Einzelvisual „Beispiel Kursdiagramm“ (Abb. 3.70): Aktienkurs einer Handelswoche als Kerzendiagramm
   (Eröffnung, Hoch, Tief, Schluss) mit Handelsvolumen.
   Seite 727 x 440 px = 110 x 66,6 mm. Daten: kurs.json (daten_kurs.py); Hoch, Tief, Schluss und Volumen aus dem
   Original, Eröffnung ergänzt. Diagrammtyp bleibt: Kursdiagramm mit Volumen. Statt zweier Y-Achsen in einem Diagramm
   jetzt Kurs oben, Volumen unten (Säulen ab null) auf gemeinsamer Zeitachse. Kerzen: steigend hohl mit blaugrüner
   Kontur, fallend rot gefüllt – Unterscheidung durch Füllung und Farbe. Klick auf einen Tag hebt ihn hervor. */
(() => {
  "use strict";
  const { zahl, delta, NBSP, sv, el, FARBE } = DK;
  const T = DATA.tage, O = DATA.eroeffnung, HI = DATA.hoch, TI = DATA.tief, SC = DATA.schluss, V = DATA.volumen;
  const WT = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"], WTL = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
  const dat = T.map(t => new Date(t + "T12:00:00"));
  const kurz = i => `${WT[dat[i].getDay()]} ${T[i].slice(8, 10)}.${T[i].slice(5, 7)}.`;
  const lang = i => `${WTL[dat[i].getDay()]}, ${T[i].slice(8, 10)}.${T[i].slice(5, 7)}.${T[i].slice(0, 4)}`;
  const GRUEN = "#00806B", ROT = "#C62828";
  const steigt = i => SC[i] >= O[i];
  const eur = v => zahl(v, 2);
  const dvt = i => (i ? (SC[i] / SC[i - 1] - 1) * 100 : null);
  const S = { auswahl: null };
  const auswaehlen = i => { S.auswahl = S.auswahl === i ? null : i; zeichnen(); };
  addEventListener("keydown", e => { if (e.key === "Escape" && S.auswahl !== null) { S.auswahl = null; zeichnen(); } });

  DK.init({ titel: "Beispiel Kursdiagramm", breite: 727, hoehe: 440 });
  const bVis = DK.box("v-kurs", 16, 10, 695, 422);
  const zeitraum = `${T[0].slice(8, 10)}.–${T[T.length - 1].slice(8, 10)}.${T[0].slice(5, 7)}.${T[0].slice(0, 4)}`;

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

  function botschaft(b) {
    const passt = x => x.find(t => DK.tw(t) <= b) || x[x.length - 1];
    if (S.auswahl !== null) {
      const i = S.auswahl, d = dvt(i);
      const vt = d === null ? "" : ` (${delta(d, 1, NBSP + "%")} zum Vortag)`;
      return passt([`${kurz(i)}: Eröffnung ${eur(O[i])}, Hoch ${eur(HI[i])}, Tief ${eur(TI[i])}, Schluss ${eur(SC[i])} €${vt}`,
        `${kurz(i)}: Schluss ${eur(SC[i])} €${vt}, Spanne ${eur(TI[i])}–${eur(HI[i])} €`]);
    }
    const n = T.length - 1, m = SC.indexOf(Math.max(...SC)), vm = V.indexOf(Math.max(...V));
    const woche = delta((SC[n] / SC[0] - 1) * 100, 1, NBSP + "%");
    const vol = vm === m ? ", dazu das höchste Volumen" : `; höchstes Volumen am ${WTL[dat[vm].getDay()]}`;
    if (m > 0 && m < n)
      return passt([`Schlusskurs steigt bis ${WTL[dat[m].getDay()]} auf ${eur(SC[m])} € und fällt bis ${WTL[dat[n].getDay()]} auf ${eur(SC[n])} € (${woche} zum ${WTL[dat[0].getDay()]})${vol}`,
        `Schlusskurs steigt bis ${WTL[dat[m].getDay()]} auf ${eur(SC[m])} € und fällt bis ${WTL[dat[n].getDay()]} auf ${eur(SC[n])} € (${woche})`]);
    return passt([`Schlusskurs von ${eur(SC[0])} auf ${eur(SC[n])} € (${woche})${vol}`]);
  }

  function diagramm(ziel, breite, hoehe) {
    ziel.textContent = "";
    const svg = sv("svg", { width: breite, height: hoehe, role: "img",
      "aria-label": `Kerzendiagramm des Aktienkurses ${zeitraum} mit Handelsvolumen` }, ziel);
    const links = 58, rechts = 6, B = breite - links - rechts, fach = B / T.length, cx = i => links + fach * (i + 0.5);
    const kb = Math.min(34, fach * 0.3);                                    // Kerzenbreite
    // Felder: Kurs oben, Veränderung, Volumen unten
    const k0 = 34, k1 = 212, yd = 234, yv = 262, v0 = 292, v1 = 340, yx = 360;
    const ymin = 41.5, ymax = 50.5, sy = v => k1 - (v - ymin) / (ymax - ymin) * (k1 - k0);
    const vmax = Math.max(...V), svy = v => v1 - v / vmax * (v1 - v0);

    // Legende rechts oben
    const gl = sv("g", { id: "ku-legende" }, svg);
    const eintraege = [["steigend", "hohl"], ["fallend", "voll"]];
    let lx = breite - eintraege.reduce((s, [t]) => s + DK.tw(t) + 34, 0) - DK.tw("Docht = Hoch bis Tief") - 26;
    eintraege.forEach(([t, art]) => {
      const f = art === "hohl" ? GRUEN : ROT;
      sv("line", { x1: lx + 5, x2: lx + 5, y1: 0, y2: 16, stroke: f, "stroke-width": 1.5 }, gl);
      sv("rect", { x: lx + 0.75, y: 3.75, width: 8.5, height: 8.5, fill: art === "hohl" ? "#FFFFFF" : f, stroke: f, "stroke-width": 1.5 }, gl);
      sv("text", { x: lx + 16, y: 8, dy: "0.35em", class: "muted" }, gl, t);
      lx += 16 + DK.tw(t) + 18;
    });
    sv("text", { x: lx + 8, y: 8, dy: "0.35em", class: "muted" }, gl, "Docht = Hoch bis Tief");

    // Kursachse mit Gitterlinien (Lage statt Länge – Achse darf knapp unter dem Tiefstkurs beginnen)
    const ga = sv("g", { id: "ku-achse" }, svg);
    sv("text", { x: 0, y: 8, dy: "0.35em", class: "muted" }, ga, "Kurs, €");
    for (let t = 42; t <= 50; t += 2) {
      sv("line", { x1: links, x2: links + B, y1: sy(t), y2: sy(t), stroke: "#E3E3E3", "stroke-width": 1 }, ga);
      sv("text", { x: links - 8, y: sy(t), dy: "0.35em", "text-anchor": "end", class: "muted" }, ga, zahl(t));
    }
    // Zeilenbeschriftungen links
    const gz = sv("g", { id: "ku-zeilen" }, svg);
    sv("text", { x: 0, y: yd, dy: "0.35em", class: "muted" }, gz, "ΔVT");
    sv("text", { x: 0, y: yv, dy: "0.35em", class: "muted" }, gz, "Volumen, €");
    sv("line", { x1: links, x2: links + B, y1: v1 + 0.5, y2: v1 + 0.5, stroke: "#8C8C8C", "stroke-width": 1 }, gz);

    const gk = sv("g", { id: "ku-kerzen" }, svg), gs = sv("g", { id: "ku-schluss" }, svg),
      gd = sv("g", { id: "ku-delta" }, svg), gv = sv("g", { id: "ku-volumen" }, svg), gt = sv("g", { id: "ku-tage" }, svg);
    T.forEach((t, i) => {
      const x = cx(i), blass = S.auswahl !== null && S.auswahl !== i, kl = blass ? "dk-blass" : "";
      const auf = steigt(i), f = auf ? GRUEN : ROT;
      const g = sv("g", { class: "dk-klick " + kl, "data-name": t }, gk);
      const yo = sy(Math.max(O[i], SC[i])), yu = sy(Math.min(O[i], SC[i]));
      sv("line", { x1: x, x2: x, y1: sy(HI[i]), y2: yo, stroke: f, "stroke-width": 2 }, g);
      sv("line", { x1: x, x2: x, y1: yu, y2: sy(TI[i]), stroke: f, "stroke-width": 2 }, g);
      sv("rect", { x: x - kb / 2 + 1, y: yo + 1, width: kb - 2, height: Math.max(1, yu - yo - 2),
        fill: auf ? "#FFFFFF" : f, stroke: f, "stroke-width": 2 }, g);
      // Schlusskurs rechts neben der Kerze auf Höhe des Schlusskurses
      sv("text", { id: `ku-schluss-${i}`, x: x + kb / 2 + 6, y: sy(SC[i]), dy: "0.35em", class: kl, style: "font-weight:bold" }, gs, eur(SC[i]));
      // Veränderung zum Vortag
      const d = dvt(i), w = d === null ? "neutral" : d > 0 ? "gut" : d < 0 ? "schlecht" : "neutral";
      sv("text", { x, y: yd, dy: "0.35em", "text-anchor": "middle", class: kl,
        style: `font-weight:bold;fill:${FARBE[w]}` }, gd, d === null ? "–" : delta(d, 1, NBSP + "%"));
      // Volumen ab null
      sv("rect", { x: x - kb / 2, y: svy(V[i]), width: kb, height: v1 - svy(V[i]), fill: "#A9A9A9", class: kl }, gv);
      sv("text", { x, y: svy(V[i]) - 9, dy: "0.35em", "text-anchor": "middle", class: kl }, gv, zahl(V[i]));
      sv("text", { x, y: yx, dy: "0.35em", "text-anchor": "middle", class: kl }, gt, kurz(i));
      const hit = sv("rect", { x: x - fach / 2, y: k0 - 6, width: fach, height: yx + 12 - k0, fill: "transparent" }, g);
      hit.addEventListener("click", () => auswaehlen(i));
      tooltip(hit, () => [lang(i), `Eröffnung ${eur(O[i])} € · Schluss ${eur(SC[i])} €`, `Hoch ${eur(HI[i])} € · Tief ${eur(TI[i])} € (Spanne ${eur(HI[i] - TI[i])} €)`,
        `Tagesverlauf ${auf ? "steigend" : "fallend"}: ${delta(SC[i] - O[i], 2)} €`,
        d === null ? "Veränderung zum Vortag: – (Vorwoche nicht im Ausschnitt)" : `Veränderung zum Vortag: ${delta(SC[i] - SC[i - 1], 2)} € (${delta(d, 1, NBSP + "%")})`,
        `Volumen ${zahl(V[i])} €`, "Klick hebt den Tag hervor"]);
    });
  }

  function zeichnen() {
    const v = DK.visual(bVis, { titel: `Aktienkurs und Handelsvolumen ${zeitraum}`, einheit: "€", botschaft: botschaft(695) });
    diagramm(v.flaeche, v.breite, v.hoehe);
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "v-kurs", anker: "links", versatz: [690, 26], regel: "SAY – Botschaft vermitteln", titel: "Kernaussage unter dem Titel",
        text: "Unter dem Titel steht der Verlauf der Woche: Anstieg bis Mittwoch, danach Rückgang unter das Niveau vom Montag. Das Original hatte keinen Titel und keine Aussage." },
      { nr: 2, ziel: "ku-legende", anker: "links", versatz: [-4, -4], regel: "EXPRESS – Passende Darstellung", titel: "Kerzen: hohl oder gefüllt",
        text: "Jeder Tag ist eine Kerze: Der Körper reicht von Eröffnung bis Schluss, der Docht von Hoch bis Tief. Steigende Tage sind hohl mit blaugrüner Kontur, fallende rot gefüllt – die Füllung trägt die Aussage auch im Schwarz-Weiß-Druck und bei Rot-Grün-Sehschwäche, die Farbe verstärkt sie nur. Das Original zeigte nur Hoch-Tief-Striche mit einem kaum sichtbaren Querstrich für den Schlusskurs; Eröffnungskurse sind ergänzt." },
      { nr: 3, ziel: "ku-volumen", anker: "links", versatz: [0, 30], regel: "CHECK – Visuelle Integrität", titel: "Keine Doppelachse, Volumen ab null",
        text: "Volumen und Kurs stehen in eigenen Feldern übereinander statt mit zwei Y-Achsen in einem Diagramm. Die Volumensäulen beginnen bei null: Im Original begann die Achse bei 80.000 €, der Mittwoch wirkte viermal so hoch wie der Freitag – tatsächlich liegt er nur 9 % darüber." },
      { nr: 4, ziel: "ku-achse", anker: "links", versatz: [88, 92], regel: "CHECK – Achse bewusst wählen", titel: "Kursachse ohne Nullpunkt",
        text: "Kerzen vergleichen Lagen, nicht Längen; die Kursachse darf deshalb knapp unter dem Tiefstkurs beginnen. Gitterlinien helfen beim Ablesen. Bei Säulen wäre derselbe Ausschnitt eine Verzerrung (vgl. Abb. 3.53)." },
      { nr: 5, ziel: "ku-tage", anker: "links", versatz: [-2, -2], regel: "UNIFY – Einheitliche Zeitachse", titel: "Handelstage Montag bis Freitag",
        text: "Die Zeitachse zeigt fünf Handelstage mit Wochentag. Das Original reichte vom 01. bis 05.09.2011 und damit über ein Wochenende, an dem nicht gehandelt wird." },
      { nr: 6, ziel: "ku-schluss-2", versatz: [30, 0], regel: "SIMPLIFY – Werte am Element", titel: "Datentabelle entfällt",
        text: "Der Schlusskurs steht rechts neben jeder Kerze, das Volumen über den Säulen, darunter die Veränderung zum Vortag; Eröffnung, Hoch und Tief zeigt der Tooltip. Die Datentabelle unter dem Diagramm, die hellblauen Säulen und der Rahmen des Originals entfallen." },
      { nr: 7, ziel: "ku-delta", anker: "links", versatz: [-6, -4], regel: "CONDENSE – Hervorheben", titel: "Klick auf einen Tag",
        text: "Ein Klick auf einen Tag hebt Kerze, Veränderung und Volumen hervor; die Aussage nennt alle vier Kurse. Esc hebt die Auswahl auf." },
    ],
    nachbauIntro: "Seitengröße benutzerdefiniert 727 × 440 px. Schrift Arial: Beschriftungen 10,5 pt, Titel 12 pt. Datenmodell: Tabelle Kurs (Datum, Eröffnung, Hoch, Tief, Schluss, Volumen) wie in der CSV-Datei; X-Achse jeweils Typ „Kategorisch“, damit keine Wochenenden erscheinen.",
    nachbau: [
      { id: "A", ziel: "ku-kerzen", versatz: [0, 0], titel: "Kerzen", visual: "Kein Standardvisual – zertifiziertes Kerzendiagramm-Visual (AppSource) oder Annäherung mit Liniendiagramm und Fehlerbalken",
        felder: "X-Achse: Datum; Annäherung: Measures Docht = [Schluss] mit Fehlerbalken Obergrenze [Hoch], Untergrenze [Tief]; Körper steigend = IF([Schluss] >= [Eröffnung], [Schluss]) und Körper fallend = IF([Schluss] < [Eröffnung], [Schluss]), je mit Fehlerbalken MAX/MIN aus Eröffnung und Schluss",
        format: "Linien unsichtbar (Transparenz 100 %); Fehlerbalken Docht 2 px, Körper ca. 24 px breit; steigend #00806B, fallend #C62828; Y-Achse 41,5 bis 50,5, Gitternetz #E3E3E3",
        hinweis: "Hohle Körper lassen sich nur im zertifizierten Visual darstellen; in der Annäherung bleibt die Unterscheidung über die Farbe – dann zusätzlich den Tagesverlauf im Tooltip nennen." },
      { id: "B", ziel: "ku-volumen", anker: "links", versatz: [0, 30], titel: "Volumen", visual: "Gruppiertes Säulendiagramm (Standardvisual)",
        felder: "X-Achse: Datum; Y-Achse: SUM(Kurs[Volumen])",
        format: "Farbe #A9A9A9; Datenbeschriftungen ein; Y-Achse aus, Start 0; gleiche Breite und Position der X-Achse wie A" },
      { id: "C", ziel: "ku-delta", anker: "links", versatz: [-6, -4], titel: "Veränderung zum Vortag", visual: "Matrix (Spalten: Datum) zwischen A und B",
        felder: "Measure ΔVT % = DIVIDE([Schluss], CALCULATE([Schluss], OFFSET(-1, ALLSELECTED(Kurs[Datum]), ORDERBY(Kurs[Datum])))) − 1 – OFFSET springt zum vorigen Handelstag statt zum Kalendertag",
        format: "Bedingte Schriftfarbe: > 0 #00806B, < 0 #C62828; Zahlenformat +0,0 %;−0,0 %" },
    ],
    theme: DK.thema(),
    csv: { name: "kursdiagramm_daten.csv", text: () => ["Datum;Eroeffnung_EUR;Hoch_EUR;Tief_EUR;Schluss_EUR;Volumen_EUR",
      ...T.map((t, i) => [`${t.slice(8, 10)}.${t.slice(5, 7)}.${t.slice(0, 4)}`, eur(O[i]), eur(HI[i]), eur(TI[i]), eur(SC[i]), V[i]].join(";"))].join("\r\n") },
    tabellen: () => [{ titel: `Aktienkurs ${zeitraum} (€)`, kopf: ["Tag", "Eröffnung", "Hoch", "Tief", "Schluss", "ΔVT in %", "Volumen"],
      zeilen: T.map((t, i) => [kurz(i), eur(O[i]), eur(HI[i]), eur(TI[i]), eur(SC[i]), dvt(i) === null ? "–" : delta(dvt(i), 1), zahl(V[i])]) }],
  });
  zeichnen();
})();
