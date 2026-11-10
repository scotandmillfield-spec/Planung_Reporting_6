/* Abb. 5.76 „Reporting mit MS Access“ (6. Auflage) – Einzelvisual 727 x 384 px = 110 x 58,1 mm.
   Bericht „Kostenartenübersicht nach Kostenstellen“ einer Kostenstellenrechnung, softwareneutral nachgebaut:
   Kreuztabelle Kostenart × Kostenstelle mit den Werten des Originals (€), Gesamtspalte mit Balken, Summenzeile.
   Daten: kostenarten.json (daten_kostenarten.py) – 21 Einzelsätze; alle Summen rechnet die Seite.
   Online: Klick auf eine Zeile hebt die Kostenart hervor, Klick auf einen Betrag hebt Kostenart und Kostenstelle
   hervor, Klick auf eine Spaltensumme die Kostenstelle; Klick auf einen Spaltenkopf sortiert; Esc hebt auf. */
(() => {
  "use strict";
  const { zahl, NBSP, el, sv, tw, FARBE } = DK;
  const KS = DATA.kostenstellen;
  const ARTEN = DATA.kostenarten.map(([nr, name], i) => ({ i, nr, name, w: {}, ges: 0 }));
  const NACH_NR = Object.fromEntries(ARTEN.map(a => [a.nr, a]));
  DATA.saetze.forEach(([nr, ks, v]) => { NACH_NR[nr].w[ks] = v; NACH_NR[nr].ges += v; });
  const SPALTE = Object.fromEntries(KS.map(k => [k, ARTEN.reduce((s, a) => s + (a.w[k] || 0), 0)]));
  const GESAMT = ARTEN.reduce((s, a) => s + a.ges, 0);
  const MAX = Math.max(...ARTEN.map(a => a.ges));
  const pz = (a, b, nk = 0) => zahl(a / b * 100, nk) + NBSP + "%";
  const eur = v => zahl(v) + NBSP + "€";

  /* ---------- Zustand ---------- */
  const S = { zeile: null, spalte: null, sort: null };
  addEventListener("keydown", e => { if (e.key === "Escape" && (S.zeile || S.spalte)) { S.zeile = S.spalte = null; zeichnen(); } });

  /* ---------- Layout ---------- */
  const H = 384;
  DK.init({ titel: "Kostenartenübersicht nach Kostenstellen", breite: 727, hoehe: H });
  const bTab = DK.box("v-tabelle", 16, 10, 695, H - 18);
  const B = { nr: 38, art: 190, ges: 56, bar: 40, ks: 53 };            // 38 + 190 + 56 + 40 + 7 × 53 = 695
  el("style", {}, document.head, `
    #v-tabelle table.kt { table-layout: fixed; width: 695px; }
    #v-tabelle .kt th { padding: 0 4px 3px; vertical-align: bottom; }
    #v-tabelle .kt td { padding: 0 4px; height: 22px; }
    #v-tabelle .kt td:first-child, #v-tabelle .kt th:first-child { padding-left: 0; text-align: left; }
    #v-tabelle .kt td.art, #v-tabelle .kt th.art { text-align: left; }
    #v-tabelle .kt tr.gruppe th { border-bottom: none; padding-bottom: 2px; }
    #v-tabelle .kt tr.gruppe th.ks-gruppe { text-align: center; color: var(--text); border-bottom: 1px solid #9A9A9A; }
    #v-tabelle .kt td.bar { padding: 0 0 0 2px; }
    #v-tabelle .kt td.bar svg { display: block; }
    #v-tabelle .kt td.leer { color: var(--muted); }
    #v-tabelle .kt td.ks, #v-tabelle .kt tr.dk-summe td.ks { cursor: pointer; }
    #v-tabelle .kt td.ks.trenn, #v-tabelle .kt th.trenn { border-left: 1px solid #D9D9D9; }
    #v-tabelle .kt td.ks:hover { text-decoration: underline; }`);

  /* ---------- Berechnungen ---------- */
  function zeilen() {
    const liste = ARTEN.slice(), s = S.sort;
    if (s) liste.sort((a, b) => {
      const c = s.key === "nr" ? a.nr.localeCompare(b.nr) : s.key === "art" ? a.name.localeCompare(b.name, "de")
        : s.key === "ges" ? a.ges - b.ges : (a.w[s.key] || 0) - (b.w[s.key] || 0);
      return (s.ab ? -c : c) || a.i - b.i;
    });
    return liste;
  }
  function sortieren(key) {
    if (S.sort && S.sort.key === key) S.sort = { key, ab: !S.sort.ab };
    else S.sort = { key, ab: key !== "nr" && key !== "art" };
    zeichnen();
  }
  const groessteKs = a => KS.filter(k => a.w[k]).sort((x, y) => a.w[y] - a.w[x])[0];
  const groessteArt = k => ARTEN.filter(a => a.w[k]).sort((x, y) => y.w[k] - x.w[k])[0];
  function botschaft() {
    const passt = k => k.find(t => tw(t) <= 695) || k[k.length - 1];
    if (S.zeile && S.spalte) {
      const a = NACH_NR[S.zeile], v = a.w[S.spalte] || 0, k = S.spalte;
      if (!v) return `${a.name} in Kostenstelle ${k}: keine Kosten`;
      return passt([`${a.name} in Kostenstelle ${k}: ${eur(v)} – ${pz(v, a.ges)} der Kostenart, ${pz(v, SPALTE[k])} der Kostenstelle`,
                    `${a.name}, ${k}: ${eur(v)} – ${pz(v, a.ges)} der Kostenart, ${pz(v, SPALTE[k])} der Kostenstelle`]);
    }
    if (S.zeile) {
      const a = NACH_NR[S.zeile], n = KS.filter(k => a.w[k]).length, g = groessteKs(a);
      const kopf = `${a.name} ${eur(a.ges)} (${pz(a.ges, GESAMT)} der Gesamtkosten)`;
      return n === 1 ? passt([`${kopf} – vollständig in Kostenstelle ${g}`, kopf])
        : passt([`${kopf} – auf ${n} Kostenstellen, größter Anteil ${g} (${pz(a.w[g], a.ges)})`, kopf]);
    }
    if (S.spalte) {
      const k = S.spalte, a = groessteArt(k);
      return passt([`Kostenstelle ${k}: ${eur(SPALTE[k])} (${pz(SPALTE[k], GESAMT)} der Gesamtkosten) – größte Kostenart ${a.name} (${eur(a.w[k])})`,
                    `Kostenstelle ${k}: ${eur(SPALTE[k])} (${pz(SPALTE[k], GESAMT)}) – größte Kostenart ${a.name}`]);
    }
    const kmax = KS.slice().sort((x, y) => SPALTE[y] - SPALTE[x])[0];
    const amax = ARTEN.slice().sort((x, y) => y.ges - x.ges)[0];
    return passt([`Gesamtkosten ${eur(GESAMT)} – Kostenstelle ${kmax} trägt ${pz(SPALTE[kmax], GESAMT)}, größte Kostenart ${amax.name}`,
                  `Gesamtkosten ${eur(GESAMT)} – Kostenstelle ${kmax} trägt ${pz(SPALTE[kmax], GESAMT)}`]);
  }

  /* ---------- Tooltip (gleiches Verhalten wie die Bausteine von DK) ---------- */
  const tip = document.querySelector(".dk-tooltip");
  function tooltip(ziel, zeilenFn) {
    ziel.addEventListener("pointermove", ev => {
      tip.textContent = "";
      zeilenFn(ev).filter(Boolean).forEach((z, i) => el(i === 0 ? "b" : "div", {}, tip, z));
      tip.style.display = "block";
      const r = tip.getBoundingClientRect();
      let x = ev.clientX + 14, y = ev.clientY + 14;
      if (x + r.width > innerWidth - 8) x = ev.clientX - r.width - 14;
      if (y + r.height > innerHeight - 8) y = ev.clientY - r.height - 14;
      tip.style.left = x + "px"; tip.style.top = y + "px";
    });
    ziel.addEventListener("pointerleave", () => { tip.style.display = "none"; });
  }
  function tipZeile(a, ev) {
    const td = ev.target && ev.target.closest ? ev.target.closest("td") : null, k = td && td.dataset.ks;
    if (k) {
      const v = a.w[k] || 0;
      return [`${a.nr} ${a.name} · Kostenstelle ${k}`, v ? eur(v) : "keine Kosten",
        v ? `${pz(v, a.ges, 1)} der Kostenart · ${pz(v, SPALTE[k], 1)} der Kostenstelle` : "",
        "Klick hebt Kostenart und Kostenstelle hervor"];
    }
    const verteilung = KS.filter(x => a.w[x]).map(x => `${x}: ${zahl(a.w[x])}`).join(" · ");
    return [`${a.nr} ${a.name}`, `Gesamt ${eur(a.ges)} · ${pz(a.ges, GESAMT, 1)} der Gesamtkosten`,
      `Kostenstellen ${verteilung}`, "Klick hebt die Kostenart hervor, Klick auf einen Betrag auch die Kostenstelle"];
  }

  /* ---------- Zeichnen ---------- */
  function zeichnen() {
    const v = DK.visual(bTab, { titel: "Kostenarten nach Kostenstellen", einheit: `€, Stand ${DATA.stand}`, botschaft: botschaft() });
    const t = el("table", { class: "dk-matrix kt" }, v.flaeche);
    const cg = el("colgroup", {}, t);
    [B.nr, B.art, B.ges, B.bar, ...KS.map(() => B.ks)].forEach(b => el("col", { style: `width:${b}px` }, cg));
    const th = el("thead", {}, t);
    const g = el("tr", { class: "gruppe" }, th);
    el("th", { colspan: 4 }, g, "");
    el("th", { colspan: KS.length, class: "ks-gruppe", id: "kopf-ks" }, g, "Kostenstelle");
    const kopf = el("tr", {}, th);
    const spaltenkopf = (key, text, cls, id) => {
      const c = el("th", { class: cls || "", id: id || "" }, kopf, text);
      if (!key || DK.PRINT) return c;
      c.classList.add("dk-sortierbar"); c.title = "Klick sortiert";
      c.addEventListener("click", () => sortieren(key));
      if (S.sort && S.sort.key === key) c.appendChild(document.createTextNode(S.sort.ab ? " ▾" : " ▴"));
      return c;
    };
    spaltenkopf("nr", "Nr.", "", "kopf-nr");
    spaltenkopf("art", "Kostenart", "art", "kopf-art");
    spaltenkopf("ges", "Gesamt", "", "kopf-ges");
    el("th", { id: "kopf-bar" }, kopf, "");
    KS.forEach((k, j) => {
      const c = spaltenkopf(k, k, j === 0 ? "trenn" : "", "kopf-" + k);
      if (S.spalte && S.spalte !== k) c.classList.add("dk-blass");
    });
    const tb = el("tbody", {}, t);
    zeilen().forEach(a => {
      const blassZ = S.zeile && S.zeile !== a.nr;
      const tr = el("tr", { class: "dk-zeile" + (blassZ ? " dk-blass" : ""), id: "z-" + a.nr }, tb);
      el("td", {}, tr, a.nr);
      el("td", { class: "art" }, tr, a.name);
      el("td", {}, tr, zahl(a.ges));
      const tdb = el("td", { class: "bar" }, tr);
      const s = sv("svg", { width: B.bar - 2, height: 12 }, tdb);
      sv("rect", { x: 0, y: 0, width: Math.max(1, a.ges / MAX * (B.bar - 6)), height: 12, fill: FARBE.ist }, s);
      KS.forEach((k, j) => {
        const w = a.w[k];
        const td = el("td", { class: "ks" + (w ? "" : " leer") + (j === 0 ? " trenn" : ""), "data-ks": k }, tr, w ? zahl(w) : "–");
        if (!blassZ && S.spalte && S.spalte !== k) td.classList.add("dk-blass");
        td.addEventListener("click", ev => {
          ev.stopPropagation();
          const gleich = S.zeile === a.nr && S.spalte === k;
          S.zeile = gleich ? null : a.nr; S.spalte = gleich ? null : k; zeichnen();
        });
      });
      tr.addEventListener("click", () => { const gleich = S.zeile === a.nr && !S.spalte; S.zeile = gleich ? null : a.nr; S.spalte = null; zeichnen(); });
      tooltip(tr, ev => tipZeile(a, ev));
    });
    const su = el("tr", { class: "dk-summe", id: "z-summe" }, tb);
    el("td", {}, su, "");
    el("td", { class: "art" }, su, "Summe");
    el("td", { id: "summe-ges" }, su, zahl(GESAMT));
    el("td", {}, su, "");
    KS.forEach((k, j) => {
      const td = el("td", { class: "ks" + (j === 0 ? " trenn" : ""), id: "summe-" + k }, su, zahl(SPALTE[k]));
      if (S.spalte && S.spalte !== k) td.classList.add("dk-blass");
      td.addEventListener("click", () => { const gleich = S.spalte === k && !S.zeile; S.spalte = gleich ? null : k; S.zeile = null; zeichnen(); });
      tooltip(td, () => [`Kostenstelle ${k}`, `${eur(SPALTE[k])} · ${pz(SPALTE[k], GESAMT, 1)} der Gesamtkosten`,
        `größte Kostenart ${groessteArt(k).name}`, "Klick hebt die Kostenstelle hervor"]);
    });
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  /* ---------- Lernplattform: Designregeln, Nachbau, Tabellen, CSV ---------- */
  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "v-tabelle", anker: "links", versatz: [676, 22], regel: "SAY – Botschaft vermitteln", titel: "Aussage über der Tabelle",
        text: "Unter dem Titel steht, was die Tabelle zeigt: Gesamtkosten 106.104 €, fast ein Drittel davon trägt Kostenstelle 3455. Nach einem Klick spricht der Satz über die gewählte Kostenart, Kostenstelle oder Zelle. Das Original hatte nur die Überschrift." },
      { nr: 2, ziel: "kopf-bar", versatz: [0, 2], regel: "EXPRESS – Werte grafisch stützen", titel: "Balken für die Gesamtkosten",
        text: "Die Gesamtkosten je Kostenart stehen zusätzlich als Balken ab einer gemeinsamen Nulllinie; so fällt auf, dass Personalnebenkosten-Lohn, sonstige Kosten und Gemeinkostenlohn den Großteil ausmachen. Das Original zeigte nur Zahlen." },
      { nr: 3, ziel: "summe-ges", anker: "links", versatz: [-4, 0], regel: "CHECK – Summen zeigen", titel: "Summenzeile ergänzt",
        text: "Die Summenzeile nennt die Kosten je Kostenstelle; Zeilen- und Spaltensummen ergeben dieselben 106.104 €. Die Gesamtwerte des Originals sind nachgerechnet und stimmen." },
      { nr: 4, ziel: "kopf-ks", anker: "links", versatz: [26, 0], regel: "STRUCTURE – Inhalte ordnen", titel: "Kostenstellen als Spaltengruppe",
        text: "Die Kostenstellen stehen aufsteigend unter einem gemeinsamen Kopf, die Kostenarten in der Reihenfolge des Kostenartenplans. Ein Klick auf einen Spaltenkopf sortiert, z. B. nach Gesamt oder nach einer Kostenstelle." },
      { nr: 5, ziel: "z-4033", anker: "links", versatz: [324, 4], regel: "SIMPLIFY – Überflüssiges weglassen", titel: "Ohne Formularkästen",
        text: "Jede Zelle des Originals war ein umrandetes Feld wie in einer Eingabemaske; dazu kamen eine hellblaue Kopffläche mit Symbol, das Menüband, der Navigationsbereich und die Statusleiste. Übrig bleiben Zahlen auf feinen Zeilenlinien." },
      { nr: 6, ziel: "z-6018", anker: "links", versatz: [324, 4], regel: "UNIFY – Einheitliche Zahlen", titel: "Einheit und Tausenderpunkt",
        text: "Die Einheit € steht einmal im Titel, Beträge haben einen Tausenderpunkt, fehlende Werte einen Strich statt eines leeren Kastens. Im Original fehlten Einheit und Tausenderpunkt („11450“)." },
      { nr: 7, ziel: "z-6033", anker: "links", versatz: [324, 4], regel: "CONDENSE – Bei Bedarf vertiefen", titel: "Zeile, Spalte, Zelle",
        text: "Ein Klick auf eine Zeile hebt die Kostenart hervor, ein Klick auf einen Betrag Kostenart und Kostenstelle, ein Klick auf eine Spaltensumme die Kostenstelle; der Tooltip nennt die Anteile. Esc hebt die Auswahl auf." },
    ],
    nachbauIntro: "Seitengröße benutzerdefiniert 727 × 384 px. Schrift Arial: Tabelle 10,5 pt, Visualtitel 12 pt. Datenmodell: Tabelle Kosten (Kostenartennummer, Kostenart, Kostenstelle, Betrag) wie in der CSV-Datei; Kostenart und Kostenstelle als eigene Dimensionstabellen, wenn weitere Berichte folgen.",
    nachbau: [
      { id: "A", ziel: "kopf-ks", anker: "links", versatz: [26, 0], titel: "Kreuztabelle", visual: "Matrix",
        felder: "Zeilen: Kostenartennummer, Kostenart (Layout tabellarisch, Stufen nebeneinander); Spalten: Kostenstelle; Werte: Betrag = SUM( Kosten[Betrag] )",
        format: "Zeilensummen und Spaltensummen an, Summenzeile fett mit Linie #3A3F44 darüber; Rasterlinien horizontal #EFEFEF; leere Werte über ein Measure als „–“",
        hinweis: "Die Zeilensumme steht in Power BI rechts. Soll „Gesamt“ wie hier vor den Kostenstellen stehen, die Spaltensummen ausschalten und ein Measure Gesamt = CALCULATE( [Betrag]; REMOVEFILTERS( Kosten[Kostenstelle] ) ) in eine zweite Tabelle links daneben setzen." },
      { id: "B", ziel: "kopf-bar", versatz: [0, 2], titel: "Balken Gesamt", visual: "Bedingte Formatierung „Datenbalken“",
        felder: "Measure Gesamt (s. A)", format: "Nur Balken anzeigen, positiv #3A3F44, Minimum 0, Maximum automatisch" },
      { id: "C", ziel: "v-tabelle", anker: "links", versatz: [676, 22], titel: "Botschaft", visual: "Textfeld mit dynamischem Wert",
        felder: "Text-Measure aus [Betrag], TOPN( 1; VALUES( Kosten[Kostenstelle] ); [Betrag] ) und dem Anteil DIVIDE( [Betrag]; CALCULATE( [Betrag]; ALL( Kosten ) ) )",
        format: "10,5 pt, #4D4D4D", hinweis: "Hervorheben per Kreuzfilterung: Klick auf eine Zeile oder einen Wert der Matrix." },
    ],
    theme: DK.thema(),
    csv: { name: "kostenarten_kostenstellen.csv", text: () => {
      const z = ["Kostenartennummer;Kostenart;Kostenstelle;Betrag_EUR"];
      DATA.saetze.forEach(([nr, ks, v]) => z.push([nr, NACH_NR[nr].name, ks, v].join(";")));
      return z.join("\r\n"); } },
    tabellen: () => [{
      titel: `Kostenarten nach Kostenstellen (€), Stand ${DATA.stand}`,
      kopf: ["Nr.", "Kostenart", "Gesamt", ...KS],
      zeilen: [...zeilen().map(a => [a.nr, a.name, zahl(a.ges), ...KS.map(k => (a.w[k] ? zahl(a.w[k]) : "–"))]),
               ["", "Summe", zahl(GESAMT), ...KS.map(k => zahl(SPALTE[k]))]],
    }],
  });
  zeichnen();
})();
