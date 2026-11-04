/* Einzelvisual-Serie „Beispiel zu Defektklassen“ (Abb. 5.11–5.15) – diese Datei ist in allen fünf Quellordnern
   gleich; den Startschritt und den Seitentitel liefern die Daten (DATA.start, DATA.titel).
   Seite 727 x 376 px = 110 x 56,9 mm. Daten: defektklassen.json (daten_defektklassen.py) – sieben Kundenbestellungen
   (Rohdaten des Originals) und 13 fehlerhafte Werte mit Klasse, Rohwert, korrigiertem Wert, Beschreibung und Regel.
   Schritt-Schalter: Rohdaten · Klasse 1 automatisch · Klasse 2 manuell · Klasse 3 manuell · Ergebnis. Ein Defekt der
   Klasse k ist ab Schritt k + 1 korrigiert. Schritte 1–4 zeigen die Tabelle mit Marken am Wert (Ziffer = Klasse):
   offen rot gefüllt und rot gewellt unterstrichen, im Schritt seiner Korrektur blaugrün umrandet und unterstrichen,
   danach grau umrandet. Schritt 5 zeigt den Umsatz je Kunde vor und nach der Korrektur der Klasse 3 (ein Maßstab).
   Klick auf einen markierten Wert hebt alle Defekte seiner Klasse hervor, Klick auf eine Zeile oder einen Balken den
   Kunden; Esc hebt auf. Spaltenköpfe sortieren (Texte als Text – so zeigt sich der Formatfehler im Bestelldatum). */
(() => {
  "use strict";
  const { zahl, el, sv, tw, NBSP } = DK;
  const SP = DATA.spalten, SCHRITTE = DATA.schritte;
  const KL = {}; DATA.klassen.forEach(([k, text]) => { KL[k] = text; });
  const DEF = DATA.defekte.map(([r, c, klasse, roh, neu, beschreibung, regel], i) => ({ i, r, c, klasse, roh, neu, beschreibung, regel }));
  const B = 695;                                             // Inhaltsbreite
  const eur = cent => zahl(cent / 100, 2);
  const und = l => (l.length < 2 ? l.join("") : l.slice(0, -1).join(", ") + " und " + l[l.length - 1]);
  const passt = (k, breite = B - 12) => k.find(t => tw(t) <= breite) || k[k.length - 1];
  const MEHRZAHL = { Kunden_ID: ["Kundennummer", "Kundennummern"], Name: ["Name", "Namen"], Geburtsdatum: ["Geburtsdatum", "Geburtsdaten"],
                     Alter: ["Alter", "Alter"], Bestelldatum: ["Bestelldatum", "Bestelldaten"] };
  const anzahl = (n, sp) => `${n} ${MEHRZAHL[sp][n === 1 ? 0 : 1]}`;

  /* ---------- Bereinigungsstand ---------- */
  const status = (d, s) => (s <= d.klasse ? "offen" : s === d.klasse + 1 ? "neu" : "frueher");
  function stand(s) {                                       // Werte aller Datensätze nach Schritt s
    const w = DATA.roh.map(z => z.slice());
    DEF.forEach(d => { if (s >= d.klasse + 1) w[d.r][d.c] = d.neu; });
    return w;
  }
  function umsatzJeKunde(s) {
    const u = new Map();
    stand(s).forEach(w => u.set(w[0], (u.get(w[0]) || 0) + w[6]));
    return u;
  }
  const IDS = [...new Set(DATA.roh.map(z => z[0]))].sort((a, b) => a - b);
  const NAME = new Map();
  stand(3).forEach(w => { if (!NAME.has(w[0])) NAME.set(w[0], w[1]); });
  const kunde = id => `${id} ${NAME.get(id)}`;
  const fmt = (c, v) => (c === 6 ? eur(v) + NBSP + "€" : String(v));

  /* ---------- Zustand ---------- */
  const S = { schritt: DATA.start, auswahl: null, sort: null };
  const gleich = (a, b) => a && b && a.typ === b.typ && a.id === b.id && a.k === b.k;
  const waehlen = a => { S.auswahl = gleich(S.auswahl, a) ? null : a; zeichnen(); };
  addEventListener("keydown", e => { if (e.key === "Escape" && S.auswahl) { S.auswahl = null; zeichnen(); } });

  /* ---------- Layout ---------- */
  DK.init({ titel: DATA.titel, breite: 727, hoehe: 376 });
  const bTitel = DK.box("v-titel", 16, 8, B, 46);
  const bFilter = DK.box("filter", 16, 60, B, 50, "dk-filter");
  DK.haarlinie(116);
  const bHaupt = DK.box("v-haupt", 16, 124, B, 210);
  const bLegende = DK.box("legende", 16, 344, B, 22);
  DK.el("style", {}, document.head, `
    .dq { table-layout: fixed; width: ${B}px; }
    .dq th, .dq td { padding: 0 0 0 13px; text-align: left; }
    .dq th:first-child, .dq td:first-child { padding-left: 0; }
    .dq th { height: 22px; padding-bottom: 4px; vertical-align: bottom; }
    .dq td { height: 26px; }
    .dq th.re, .dq td.re { text-align: right; }
    .dq .z { display: flex; align-items: center; justify-content: space-between; gap: 4px; }
    .dq .z.re { justify-content: flex-end; }
    .w.offen { color: var(--schlecht); text-decoration: underline wavy var(--schlecht); text-decoration-thickness: 1px;
      text-underline-offset: 3px; }
    .w.neu { text-decoration: underline solid var(--gut); text-decoration-thickness: 2px; text-underline-offset: 3px; }
    .bd { flex: 0 0 16px; display: inline-block; box-sizing: border-box; width: 16px; height: 17px; line-height: 15px;
      border-radius: 3px; font-size: 14px; font-weight: bold; text-align: center; }
    .bd.offen { background: var(--schlecht); color: #FFFFFF; border: 1px solid var(--schlecht); }
    .bd.neu { background: #FFFFFF; color: var(--gut); border: 1.5px solid var(--gut); line-height: 14px; }
    .bd.frueher { background: #FFFFFF; color: #6E747A; border: 1px solid #A9A9A9; }
    .dq td.dk-blass { opacity: .32; }
    #legende { display: flex; align-items: center; gap: 22px; color: var(--muted); white-space: nowrap; }
    #legende span.lg { display: inline-flex; align-items: center; gap: 6px; }
    #v-haupt svg { position: absolute; top: 0; overflow: visible; }
    #v-haupt svg text { font-family: var(--schrift); font-size: 14px; fill: var(--text); }
    #v-haupt svg text.muted { fill: var(--muted); }`);

  /* ---------- lokale Hilfe: Tooltip mit Ereignis (Zellbezug) ---------- */
  const tipEl = document.querySelector(".dk-tooltip");
  function tooltip(ziel, zeilenFn) {
    ziel.addEventListener("pointermove", ev => {
      const zeilen = zeilenFn(ev);
      if (!zeilen || !zeilen.length) { tipEl.style.display = "none"; return; }
      tipEl.textContent = "";
      zeilen.forEach((z, i) => el(i === 0 ? "b" : "div", {}, tipEl, z));
      tipEl.style.display = "block";
      const r = tipEl.getBoundingClientRect();
      let x = ev.clientX + 14, y = ev.clientY + 14;
      if (x + r.width > innerWidth - 8) x = ev.clientX - r.width - 14;
      if (y + r.height > innerHeight - 8) y = ev.clientY - r.height - 14;
      tipEl.style.left = x + "px"; tipEl.style.top = y + "px";
    });
    ziel.addEventListener("pointerleave", () => { tipEl.style.display = "none"; });
  }
  const marke = (st, k, parent) => el("span", { class: "bd " + st }, parent, String(k));

  /* ---------- Tabelle (Schritte 1–4) ---------- */
  const SPALTEN = [
    { c: 0, titel: "Kunden_ID", id: "sp-kunde", breite: 70, slot: true },
    { c: 1, titel: "Name", id: "sp-name", breite: 110, slot: true },
    { c: 2, titel: "Geburtsdatum", id: "sp-geburt", breite: 92, slot: true },
    { c: 3, titel: "Alter", id: "sp-alter", breite: 40, slot: true, re: true },
    { c: 4, titel: "Bestelldatum", id: "sp-bestelldatum", breite: 92, slot: true },
    { c: 5, titel: "Bestellung", id: "sp-bestellung", breite: 169 },        // Summe der Spalten = 695 px
    { c: 6, titel: "Betrag", id: "sp-betrag", breite: 44, re: true, kopfRe: true },
  ];
  function zeilen(s) {
    const liste = stand(s).map((w, r) => {
      const defs = {};
      DEF.filter(d => d.r === r).forEach(d => { defs[d.c] = { d, st: status(d, s) }; });
      return { r, w, defs };
    });
    const so = S.sort;
    liste.sort((a, b) => {
      let c;
      if (so) {
        const x = a.w[so.c], y = b.w[so.c];
        c = typeof x === "number" ? x - y : String(x).localeCompare(String(y), "de");
        if (so.ab) c = -c;
      } else c = a.w[0] - b.w[0];
      return c || a.r - b.r;
    });
    return liste;
  }
  function sortieren(c) {
    S.sort = S.sort && S.sort.c === c ? { c, ab: !S.sort.ab } : { c, ab: false };
    zeichnen();
  }
  const pfeil = c => (S.sort && S.sort.c === c ? (S.sort.ab ? " ▾" : " ▴") : "");
  const fokus = s => (s === 1 ? "offen" : "neu");               // Zelle, an der die Designregel-Marke sitzt

  function tooltipZelle(z, c, s) {
    const x = c != null ? z.defs[c] : null;
    if (x) {
      const d = x.d;
      return [`Defektklasse ${d.klasse} · ${KL[d.klasse]}`, `Defekt: ${d.beschreibung}`, `Regel: ${d.regel}`,
        `Rohwert ${fmt(d.c, d.roh)} → korrigiert ${fmt(d.c, d.neu)}`,
        x.st === "offen" ? `Status: offen – korrigiert im Schritt „${SCHRITTE[d.klasse]}“`
          : x.st === "neu" ? "Status: in diesem Schritt korrigiert" : `Status: korrigiert im Schritt „${SCHRITTE[d.klasse]}“`,
        "Klick hebt alle Defekte dieser Klasse hervor, Esc hebt auf"];
    }
    const alle = Object.values(z.defs), offen = alle.filter(y => y.st === "offen");
    return [`Kunde ${z.w[0]} · ${z.w[1]}`, `${z.w[5]}, ${eur(z.w[6])} € · Bestelldatum ${z.w[4]}`,
      offen.length ? `Offene Defekte: ${offen.map(y => `${SP[y.d.c]} (Klasse ${y.d.klasse})`).join(", ")}`
        : alle.length ? `Alle ${alle.length} Defekte dieses Datensatzes korrigiert` : "Datensatz ohne Defekte",
      s > 1 && alle.some(y => y.st !== "offen") ? `Korrigiert: ${alle.filter(y => y.st !== "offen").map(y => SP[y.d.c]).join(", ")}` : null,
      "Klick hebt die Bestellungen des Kunden hervor, Esc hebt auf"].filter(Boolean);
  }

  function tabelle(s) {
    bHaupt.textContent = "";
    const t = el("table", { class: "dk-matrix dq", id: "tabelle" }, bHaupt);
    const cg = el("colgroup", {}, t);
    SPALTEN.forEach(sp => el("col", { style: `width:${sp.breite + (sp.c ? 13 : 0)}px` }, cg));
    const hr = el("tr", {}, el("thead", {}, t));
    SPALTEN.forEach(sp => {
      const th = el("th", { id: sp.id, class: sp.kopfRe ? "re" : "" }, hr, sp.titel + pfeil(sp.c));
      if (!DK.PRINT) { th.classList.add("dk-sortierbar"); th.title = "Klick sortiert"; th.addEventListener("click", () => sortieren(sp.c)); }
    });
    const tb = el("tbody", {}, t);
    const a = S.auswahl;
    let fokusGesetzt = false;
    zeilen(s).forEach(z => {
      const blassZeile = a && a.typ === "kunde" && z.w[0] !== a.id;
      const tr = el("tr", { class: "dk-zeile" + (blassZeile ? " dk-blass" : "") }, tb);
      SPALTEN.forEach(sp => {
        const x = z.defs[sp.c];
        const blass = a && a.typ === "klasse" && !(x && x.d.klasse === a.k);
        const td = el("td", { "data-c": sp.c, class: (sp.re ? "re" : "") + (blass ? " dk-blass" : "") }, tr);
        const text = sp.c === 6 ? eur(z.w[6]) : String(z.w[sp.c]);
        if (!sp.slot) { td.textContent = text; return; }
        const box = el("div", { class: "z" + (sp.re ? " re" : "") }, td);
        el("span", { class: "w" + (x && x.st !== "frueher" ? " " + x.st : "") }, box, text);
        if (x) marke(x.st, x.d.klasse, box); else el("span", { class: "bd" }, box);
        if (x && !fokusGesetzt && x.st === fokus(s)) { td.id = "m-zelle"; fokusGesetzt = true; }
      });
      tr.addEventListener("click", ev => {
        const td = ev.target.closest ? ev.target.closest("td") : null;
        const x = td ? z.defs[+td.dataset.c] : null;
        waehlen(x ? { typ: "klasse", k: x.d.klasse } : { typ: "kunde", id: z.w[0] });
      });
      tooltip(tr, ev => {
        const td = ev.target.closest ? ev.target.closest("td") : null;
        return tooltipZelle(z, td ? +td.dataset.c : null, s);
      });
    });
  }

  /* ---------- Umsatz je Kunde vor und nach der Korrektur der Klasse 3 (Schritt 5) ---------- */
  function vergleich() {
    const vor = umsatzJeKunde(3), nach = umsatzJeKunde(4);
    return IDS.map(id => ({ id, vor: vor.get(id) || 0, nach: nach.get(id) || 0 }));
  }
  const rang = (liste, key, id) => liste.filter(x => x[key] > 0).sort((a, b) => b[key] - a[key] || a.id - b.id).findIndex(x => x.id === id) + 1;
  function tooltipKunde(x, liste) {
    const n = k => stand(k).filter(w => w[0] === x.id).length;
    const best = k => `${n(k)} ${n(k) === 1 ? "Bestellung" : "Bestellungen"}`;
    const z = [`Kunde ${kunde(x.id)}`,
      `vor der Korrektur: ${eur(x.vor)} € aus ${best(3)}, Rang ${rang(liste, "vor", x.id)}`,
      x.nach ? `nach der Korrektur: ${eur(x.nach)} € aus ${best(4)}, Rang ${rang(liste, "nach", x.id)}` : "nach der Korrektur: keine eigene Kundennummer mehr"];
    const d = DEF.find(y => y.klasse === 3);
    if (x.nach > x.vor) z.push(`+${eur(x.nach - x.vor)} € aus der Kundennummer ${d.roh} (Dublette) übernommen`);
    if (x.nach < x.vor) z.push(`Bestellung der Kundennummer ${d.neu} zugeordnet (Dublette)`);
    z.push("Klick hebt den Kunden hervor, Esc hebt auf");
    return z;
  }
  function diagramm() {
    bHaupt.textContent = "";
    const liste = vergleich(), a = S.auswahl;
    const PB = 335, GAP = B - 2 * PB, KOPF = 24, RH = 26, BH = 16, SLOT = 22;
    const max = Math.max(...liste.map(x => Math.max(x.vor, x.nach)));
    const lw = Math.ceil(Math.max(...IDS.map(id => tw(kunde(id))))) + 10;
    const vw = Math.ceil(Math.max(...liste.map(x => tw(eur(Math.max(x.vor, x.nach)))))) + 6;
    const k = (PB - lw - vw - SLOT) / max;                    // ein Maßstab für beide Seiten
    [["vor", "vor der Korrektur der Klasse 3", "#C9C9C9", 0], ["nach", "nach der Korrektur der Klasse 3", "var(--ac)", PB + GAP]]
      .forEach(([key, kopf, farbe, x0]) => {
        const svg = sv("svg", { id: "p-" + key, width: PB, height: KOPF + RH * liste.length, style: `left:${x0}px`, role: "img",
                                "aria-label": `Umsatz je Kunde ${kopf}` }, bHaupt);
        sv("text", { x: lw, y: 14, class: "muted" }, svg, kopf);
        liste.forEach((x, i) => {
          const y = KOPF + i * RH, v = x[key], blass = a && a.typ === "kunde" && a.id !== x.id;
          const g = sv("g", { class: "dk-klick" + (blass ? " dk-blass" : "") }, svg);
          sv("text", { x: lw - 10, y: y + RH / 2, dy: "0.35em", "text-anchor": "end", class: v ? "" : "muted" }, g, kunde(x.id));
          const bw = v * k;
          if (v) sv("rect", { x: lw, y: y + (RH - BH) / 2, width: bw, height: BH, fill: farbe }, g);
          const text = v ? eur(v) : "–", tx = lw + bw + 5;
          sv("text", { x: tx, y: y + RH / 2, dy: "0.35em" }, g, text);
          if (key === "nach" && x.nach !== x.vor) {
            const mx = tx + tw(text) + 6, my = y + (RH - 17) / 2;
            const m = sv("g", x.nach > x.vor ? { id: "m-geaendert" } : {}, g);
            sv("rect", { x: mx + 0.75, y: my + 0.75, width: 14.5, height: 15.5, rx: 2.5, fill: "#FFFFFF", stroke: "var(--gut)", "stroke-width": 1.5 }, m);
            sv("text", { x: mx + 8, y: my + 8.5, dy: "0.35em", "text-anchor": "middle", style: "font-weight:bold;fill:var(--gut)" }, m, "3");
          }
          const hit = sv("rect", { x: 0, y, width: PB, height: RH, fill: "transparent" }, g);
          hit.addEventListener("click", () => waehlen({ typ: "kunde", id: x.id }));
          tooltip(hit, () => tooltipKunde(x, liste));
        });
      });
  }

  /* ---------- Titel, Botschaft, Legende ---------- */
  const TITEL = ["Kundenbestellungen: Rohdaten mit Defekten", "Kundenbestellungen nach automatischer Korrektur der Klasse 1",
    "Kundenbestellungen nach manueller Korrektur der Klasse 2", "Kundenbestellungen nach manueller Korrektur der Klasse 3",
    "Umsatz je Kunde vor und nach der Korrektur der Klasse 3"];
  function proSpalte(defs) {
    const n = {};
    defs.forEach(d => { n[SP[d.c]] = (n[SP[d.c]] || 0) + 1; });
    return Object.entries(n).sort((x, y) => y[1] - x[1]).map(([sp, m]) => anzahl(m, sp));
  }
  function offenText(s) {
    const o = DEF.filter(d => status(d, s) === "offen");
    if (!o.length) return "keine offenen Defekte";
    const kl = [...new Set(o.map(d => d.klasse))];
    return `offen: ${o.length} ${o.length === 1 ? "Wert" : "Werte"} der Klasse${kl.length > 1 ? "n" : ""} ${und(kl.map(String))}`;
  }
  function botschaft(s) {
    const a = S.auswahl;
    if (s === 5) {
      const liste = vergleich();
      if (a && a.typ === "kunde") {
        const x = liste.find(y => y.id === a.id);
        return passt([`${kunde(x.id)}: vor der Korrektur ${eur(x.vor)} €, danach ${x.nach ? eur(x.nach) + " €" : "in Kundennummer 1001 enthalten"}` +
          (x.nach === x.vor ? " – unverändert" : "")]);
      }
      const x = liste.find(y => y.nach > y.vor), ges = liste.reduce((t, y) => t + y.nach, 0);
      const nv = liste.filter(y => y.vor).length, nn = liste.filter(y => y.nach).length;
      const kurz = `${NAME.get(x.id)} (${x.id}): ${eur(x.nach)} € statt ${eur(x.vor)} € – Rang ${rang(liste, "nach", x.id)} statt ${rang(liste, "vor", x.id)}`;
      return passt([`${kurz} unter ${nn} statt ${nv} Kunden, Gesamtumsatz unverändert ${eur(ges)} €`, `${kurz}, Gesamtumsatz unverändert ${eur(ges)} €`, kurz]);
    }
    if (a && a.typ === "kunde") {
      const defs = DEF.filter(d => stand(s)[d.r][0] === a.id), o = defs.filter(d => status(d, s) === "offen").length;
      return passt([`Kunde ${kunde(a.id)}: ${defs.length} fehlerhafte Werte – ${o} offen, ${defs.length - o} korrigiert`]);
    }
    if (a && a.typ === "klasse") {
      const defs = DEF.filter(d => d.klasse === a.k), st = status(defs[0], s);
      const wie = st === "offen" ? "offen" : st === "neu" ? "in diesem Schritt korrigiert" : "bereits korrigiert";
      return passt([`Klasse ${a.k} – ${KL[a.k]}: ${und(proSpalte(defs))}, ${wie}`, `Klasse ${a.k}: ${und(proSpalte(defs))}, ${wie}`]);
    }
    if (s === 1) {
      const n = k => DEF.filter(d => d.klasse === k).length, zeilenMit = new Set(DEF.map(d => d.r)).size;
      const wo = zeilenMit === DATA.roh.length ? `allen ${zeilenMit}` : `${zeilenMit} von ${DATA.roh.length}`;
      return passt([`${DEF.length} fehlerhafte Werte in ${wo} Datensätzen: ${n(1)} der Klasse 1, ${n(2)} der Klasse 2, ${n(3)} der Klasse 3`,
        `${DEF.length} fehlerhafte Werte: ${n(1)} der Klasse 1, ${n(2)} der Klasse 2, ${n(3)} der Klasse 3`]);
    }
    const k = s - 1, neu = DEF.filter(d => d.klasse === k), wie = k === 1 ? "automatisch" : "manuell";
    if (k === 3) {
      const d = neu[0], n4 = new Set(stand(4).map(w => w[0])).size, n3 = new Set(stand(3).map(w => w[0])).size;
      return passt([`Klasse 3 manuell korrigiert: Dublette ${d.roh} in Kundennummer ${d.neu} zusammengeführt – ${n4} statt ${n3} Kunden, ${offenText(s)}`,
        `Klasse 3 manuell korrigiert: Dublette ${d.roh} mit ${d.neu} zusammengeführt – ${n4} statt ${n3} Kunden, ${offenText(s)}`,
        `Klasse 3 manuell korrigiert: Dublette ${d.roh} mit ${d.neu} zusammengeführt – ${offenText(s)}`]);
    }
    return passt([`Klasse ${k} ${wie} korrigiert: ${und(proSpalte(neu))} – ${offenText(s)}`]);
  }
  function legende(s) {
    bLegende.textContent = "";
    const eintrag = (st, k, text) => { const l = el("span", { class: "lg" }, bLegende); marke(st, k, l); l.appendChild(document.createTextNode(text)); };
    if (s === 5) {
      eintrag("neu", 3, "durch die Korrektur der Klasse 3 geändert");
      el("span", {}, bLegende, "Kunden nach Kundennummer, ein Maßstab für beide Seiten");
      return;
    }
    const min = st => Math.min(...DEF.filter(d => status(d, s) === st).map(d => d.klasse));
    if (DEF.some(d => status(d, s) === "offen")) eintrag("offen", min("offen"), "Defekt offen");
    if (DEF.some(d => status(d, s) === "neu")) eintrag("neu", s - 1, "in diesem Schritt korrigiert");
    if (DEF.some(d => status(d, s) === "frueher")) eintrag("frueher", min("frueher"), "zuvor korrigiert");
    el("span", {}, bLegende, "Ziffer = Defektklasse");
  }

  /* ---------- Zeichnen ---------- */
  DK.schnitt(bFilter, "Schritt", "knoepfe", {
    optionen: SCHRITTE.map((t, i) => [i + 1, t]), wert: S.schritt,
    onChange: v => {
      if (v === S.schritt) return;
      S.schritt = v;
      const a = S.auswahl;
      if (a && a.typ === "kunde" && v < 5 && !stand(v).some(w => w[0] === a.id)) S.auswahl = null;
      zeichnen();
    } });
  function zeichnen() {
    const s = S.schritt;
    DK.visual(bTitel, { titel: TITEL[s - 1], einheit: s === 5 ? "€" : "Betrag in €", botschaft: botschaft(s) });
    if (s === 5) diagramm(); else tabelle(s);
    legende(s);
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  /* ---------- Lernplattform: Designregeln, Nachbau, Tabellen, CSV ---------- */
  const REGELN_TABELLE = [
    { nr: 1, ziel: "v-titel", anker: "links", versatz: [0, 0], regel: "SAY – Botschaft vermitteln", titel: "Aussage zum Schritt",
      text: "Unter dem Titel steht in einem Satz, was der gewählte Schritt bewirkt: wie viele Werte welcher Klasse fehlerhaft, korrigiert oder noch offen sind – aus der Defektliste berechnet. Das Original zeigte vier Tabellen ohne Titel und Aussage; was sich geändert hatte, musste man durch Vergleich der Abbildungen suchen." },
    { nr: 2, ziel: "filter", anker: "links", versatz: [0, 0], regel: "STRUCTURE – Inhalte ordnen", titel: "Ein Datensatz, fünf Schritte",
      text: "Der Schalter führt in der Reihenfolge der Bereinigung durch die Serie: Rohdaten, automatische Korrektur der Klasse 1, manuelle Korrektur der Klassen 2 und 3, Ergebnis. Die Abbildungen 5.11 bis 5.15 zeigen dieselben sieben Datensätze im selben Layout; jede startet in ihrem Schritt." },
    { nr: 3, ziel: "m-zelle", versatz: [0, 0], regel: "UNIFY – Semantische Notation", titel: "Marke am fehlerhaften Wert",
      text: "Jeder fehlerhafte Wert trägt eine Marke mit der Ziffer seiner Defektklasse: rot gefüllt und rot gewellt unterstrichen, solange er offen ist; blaugrün umrandet und unterstrichen im Schritt seiner Korrektur; grau umrandet danach. Rot steht nur für Defekte. Das Original markierte nichts." },
    { nr: 4, ziel: "legende", anker: "links", versatz: [0, 0], regel: "CHECK – Visuelle Integrität", titel: "Lesbar ohne Farbe",
      text: "Rot und Blaugrün haben fast denselben Grauwert. Deshalb tragen Form und Linie die Bedeutung: gefüllte gegen umrandete Marke, gewellte gegen gerade Unterstreichung, dazu die Ziffer der Klasse. So bleibt die Abbildung im Schwarzweißdruck und bei Farbsehschwäche eindeutig." },
    { nr: 5, ziel: "sp-bestellung", anker: "links", versatz: [0, 0], regel: "CONDENSE – Details im Tooltip", titel: "Regel im Tooltip",
      text: "Der Tooltip eines markierten Werts nennt Klasse, Erkennung und Korrektur, die Beschreibung des Defekts, die Prüf- oder Korrekturregel sowie Rohwert und korrigierten Wert – statt einer zweiten Tabelle. Ein Klick auf einen markierten Wert hebt alle Defekte derselben Klasse hervor." },
    { nr: 6, ziel: "sp-betrag", versatz: [0, 0], regel: "SIMPLIFY – Einheitliche Zahlen", titel: "Dezimalkomma, Einheit im Titel",
      text: "Der Betrag steht mit Dezimalkomma und zwei Nachkommastellen (Original: 4.50), die Einheit einmal im Titel. Texte links-, Zahlen rechtsbündig. Die Datumsangaben bleiben in ihren Rohformaten, denn sie sind Gegenstand der Korrektur. Blaue Kopfzeile und Rahmen des Originals entfallen." },
    { nr: 7, ziel: "sp-bestelldatum", versatz: [0, 0], regel: "EXPRESS – Fehler sichtbar machen", titel: "Sortieren zeigt den Formatfehler",
      text: "Ein Klick auf einen Spaltenkopf sortiert. Nach Bestelldatum sortiert, ordnen die Rohdaten falsch (01-05-2023 vor 2023-04-05); nach der Korrektur der Klasse 1 stimmt die Reihenfolge. Standard ist die Reihenfolge der Kundennummer – nach der Zusammenführung steht die Espresso-Bestellung bei 1001 wie im Original." },
  ];
  const REGELN_DIAGRAMM = [
    { nr: 1, ziel: "v-titel", anker: "links", versatz: [0, 0], regel: "SAY – Botschaft vermitteln", titel: "Wirkung der Korrektur in einem Satz",
      text: "Die Aussage nennt, was die Zusammenführung der Dublette in der Auswertung ändert: Meyer, Sofia (1001) kommt auf 7,00 € statt 4,50 € und rückt von Rang 4 auf Rang 3; der Gesamtumsatz bleibt gleich. Das Original hatte nur den Titel „Umsatzanalyse (€)“." },
    { nr: 2, ziel: "p-vor", anker: "links", versatz: [0, 0], regel: "STRUCTURE – Inhalte ordnen", titel: "Vorher und nachher nebeneinander",
      text: "Wie im Original stehen die Auswertungen vor und nach der Korrektur nebeneinander – jetzt mit allen Kunden in der Reihenfolge der Kundennummer wie in der Tabelle der Abbildungen 5.11 bis 5.14. Das Original zeigte nur die drei Einträge „Sofia“, „Sofiá“ und „Sofía“." },
    { nr: 3, ziel: "p-nach", versatz: [0, 0], regel: "CHECK – Visuelle Integrität", titel: "Ein Maßstab für beide Seiten",
      text: "Beide Seiten haben denselben Maßstab und beginnen bei null. Im Original waren 5 € links rund ein Viertel länger als rechts; der Zuwachs von 4,50 € auf 7,00 € wirkte dadurch kleiner, als er ist." },
    { nr: 4, ziel: "p-vor", versatz: [0, 0], regel: "UNIFY – Semantische Notation", titel: "Vorher hellgrau, nachher anthrazit",
      text: "Der frühere Stand ist hellgrau, der bereinigte anthrazit – dieselbe Notation wie Vorjahr und Ist in den Abbildungen des Buchs. Im Original hatten beide Diagramme dasselbe Blau." },
    { nr: 5, ziel: "m-geaendert", versatz: [0, 0], regel: "EXPRESS – Hervorheben", titel: "Geänderte Werte markiert",
      text: "Die blaugrün umrandete Marke mit der Ziffer 3 zeigt die beiden Kunden, deren Umsatz sich durch die Korrektur der Klasse 3 ändert – dieselbe Marke wie für die korrigierte Kundennummer in der Tabelle." },
    { nr: 6, ziel: "p-nach", anker: "links", versatz: [0, 0], regel: "CONDENSE – Richtig verdichten", titel: "Je Kundennummer statt je Namensvariante",
      text: "Der Umsatz ist je Kundennummer verdichtet, der Name steht dabei. Das Original verdichtete nach Schreibweisen des Vornamens; entscheidend ist aber die Kundennummer: 1004 (Meyer, Sofía) bleibt trotz ähnlichen Namens eine eigene Kundin mit anderem Geburtsdatum." },
    { nr: 7, ziel: "legende", anker: "links", versatz: [0, 0], regel: "SIMPLIFY – Weglassen", titel: "Werte statt Achse",
      text: "Die Werte stehen direkt an den Balken. Achse, gepunktete Gitterlinien, Achsentitel „Name“ sowie Kacheln mit runden Ecken und Schatten des Originals entfallen." },
  ];
  const NACHBAU_TABELLE = [
    { id: "A", ziel: "v-haupt", versatz: [0, 0], titel: "Kundenbestellungen", visual: "Tabelle",
      felder: "Bestellungen[Datensatz] (ausgeblendet), je Spalte ein Measure „Wert im Schritt“, z. B. Bestelldatum angezeigt = VAR s = SELECTEDVALUE(Schritte[Nr]; 1) VAR k = MAX(Defekte[Klasse]) RETURN IF(NOT ISBLANK(k) && s > k; MAX(Defekte[Korrigiert]); MAX(Bestellungen[Bestelldatum])) über die Beziehung Datensatz und Spalte",
      format: "Schrift 10,5 pt; bedingte Formatierung je Spalte über ein Status-Measure (1 offen, 2 in diesem Schritt korrigiert, 3 zuvor korrigiert): Schriftfarbe #C62828 bei offen; Klassenziffer als Präfix im Measure („❶“ offen, „①“ korrigiert); Kopf mit Unterstrich #3A3F44, Zeilenraster #EFEFEF",
      hinweis: "Gewellte Unterstreichung gibt es in Power BI nicht – Symbol und Ziffer tragen die Bedeutung. Die Bereinigung selbst gehört in Power Query: Klasse 1 als feste Transformationsschritte, Klassen 2 und 3 als gepflegte Korrekturtabelle." },
    { id: "B", ziel: "filter", versatz: [0, 0], titel: "Schritt-Schalter", visual: "Datenschnitt",
      felder: "Schritte[Name], sortiert nach Schritte[Nr] (1 Rohdaten … 5 Ergebnis)",
      format: "Kacheln, Einzelauswahl erzwingen; ausgewählt #3A3F44 mit weißer Schrift, sonst weiß mit Rahmen #9A9A9A",
      hinweis: "Startschritt je Abbildung über ein Lesezeichen." },
    { id: "C", ziel: "m-zelle", versatz: [0, 0], titel: "Tooltip mit Regel", visual: "Berichtsseite als QuickInfo",
      felder: "Defekte[Klasse], Defektklassen[Erkennung und Korrektur], Defekte[Beschreibung], Defekte[Regel], Defekte[Rohwert], Defekte[Korrigiert]",
      format: "QuickInfo-Seite 320 × 180 px, Textfelder 10,5 pt" },
    { id: "D", ziel: "v-titel", versatz: [0, 0], titel: "Aussage", visual: "Textfeld mit dynamischem Wert",
      felder: "Text-Measure, z. B. COUNTROWS(FILTER(Defekte; Defekte[Klasse] = s − 1)) & \" Werte korrigiert – offen: \" & COUNTROWS(FILTER(Defekte; Defekte[Klasse] >= s))",
      format: "10,5 pt, #4D4D4D" },
    { id: "E", ziel: "legende", versatz: [0, 0], titel: "Legende", visual: "Textfeld", felder: "statischer Text mit den Symbolen ❶ ① und der Erklärung", format: "10,5 pt, #4D4D4D" },
  ];
  const NACHBAU_DIAGRAMM = [
    { id: "A", ziel: "p-vor", versatz: [0, 0], titel: "Umsatz je Kunde vor und nach der Korrektur", visual: "Gruppiertes Balkendiagramm mit kleinen Vielfachen",
      felder: "Y-Achse: Kunden[Kunde] (Kundennummer und Name); X-Achse: Measure Umsatz = SUM(Bestellungen[Betrag]); kleine Vielfache und Legende: Zustand (vor/nach der Korrektur der Klasse 3) aus einer Tabelle Bestellungen_Stand mit Kunden_ID je Zustand",
      format: "Datenfarben #C9C9C9 (vor) und #3A3F44 (nach); Datenbeschriftungen an, X-Achse und Gitternetz aus; Y-Achse nach Kundennummer sortiert",
      hinweis: "Kleine Vielfache teilen sich die Achse – so haben beide Seiten automatisch denselben Maßstab. Zwei getrennte Balkendiagramme nur mit fest eingestelltem X-Bereich 0–9." },
    { id: "B", ziel: "m-geaendert", versatz: [0, 0], titel: "Marke für geänderte Werte", visual: "Datenbeschriftung über Measure",
      felder: "Measure Geändert = IF([Umsatz nach] <> [Umsatz vor]; \"③\")", format: "Schriftfarbe #00806B" },
    { id: "C", ziel: "filter", versatz: [0, 0], titel: "Schritt-Schalter", visual: "Datenschnitt",
      felder: "Schritte[Name]; der Schritt „Ergebnis“ schaltet per Lesezeichen von der Tabelle auf das Balkendiagramm", format: "wie in den Schritten 1–4" },
    { id: "D", ziel: "v-titel", versatz: [0, 0], titel: "Aussage", visual: "Textfeld mit dynamischem Wert",
      felder: "Text-Measure mit RANKX(ALL(Kunden); [Umsatz]) für den Rang vor und nach der Korrektur", format: "10,5 pt, #4D4D4D" },
  ];
  DK.ebenen({
    get regeln() { return S.schritt === 5 ? REGELN_DIAGRAMM : REGELN_TABELLE; },
    get nachbau() { return S.schritt === 5 ? NACHBAU_DIAGRAMM : NACHBAU_TABELLE; },
    nachbauIntro: "Standard-Visuals von Power BI Desktop. Seitengröße benutzerdefiniert 727 × 376 px. Schrift Arial: Tabelle und Beschriftungen 10,5 pt, Visualtitel 12 pt. Datenmodell: Tabelle Bestellungen (sieben Datensätze wie in der CSV-Datei, Stand Rohdaten), Tabelle Defekte (Datensatz, Spalte, Klasse, Rohwert, Korrigiert, Beschreibung, Regel), Tabelle Defektklassen (Klasse, Erkennung, Korrektur) und Tabelle Schritte (1–5) für den Datenschnitt.",
    theme: DK.thema(),
    csv: { name: "defektklassen_daten.csv", text: () => DATA.csv },
    tabellen: () => {
      const s = S.schritt, st = Math.min(s, 4);
      const tab = { titel: `Kundenbestellungen – Stand ${SCHRITTE[st - 1]}`, kopf: [...SP.slice(0, 6), "Betrag (€)"],
        zeilen: zeilen(st).map(z => z.w.map((v, c) => (c === 6 ? eur(v) : String(v)))) };
      const wort = { offen: "offen", neu: "in diesem Schritt korrigiert", frueher: "zuvor korrigiert" };
      const def = { titel: "Defekte und ihr Status im gewählten Schritt", kopf: ["Datensatz", "Spalte", "Klasse", "Rohwert", "korrigiert", "Status"],
        zeilen: DEF.map(d => [String(DATA.roh[d.r][0]), SP[d.c], String(d.klasse), fmt(d.c, d.roh), fmt(d.c, d.neu), wort[status(d, s)]]) };
      const um = { titel: "Umsatz je Kunde vor und nach der Korrektur der Klasse 3 (€)", kopf: ["Kunde", "vorher", "nachher", "Δ"],
        zeilen: vergleich().map(x => [kunde(x.id), eur(x.vor), x.nach ? eur(x.nach) : "–", DK.delta((x.nach - x.vor) / 100, 2)]) };
      return [tab, def, um];
    },
  });
  zeichnen();
})();
