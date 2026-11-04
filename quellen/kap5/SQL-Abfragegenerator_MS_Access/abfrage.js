/* Abb. 5.40 „SQL-Abfragegenerator“ – Logik des Abfrageentwurfs.
   Tabellen und Felder wie in der SELECT-Anweisung aus Abb. 5.39 (Kunden, Auftrag, Artikel, Farbe; 6 Gruppierungs-
   und 10 Summenfelder). Felder werden per Drag & Drop oder Doppelklick ins Raster übernommen; Funktion, Sortierung,
   Anzeigen und Kriterien erzeugen die SQL-Anweisung (Anfangszustand = Listing in Abb. 5.39). */
(() => {
  "use strict";
  const { el, sv } = MK;
  MK.init({ titel: "SQL-Abfragegenerator" });
  const $ = id => document.getElementById(id);
  const PRINT = MK.PRINT;
  const NDASH = String.fromCharCode(0x2013);

  /* ---------- Stammdaten: Tabellen, Felder, Beziehungen ---------- */
  const TABELLEN = [
    { id: "kunden", name: "Kunden", x: 0, w: 140, schluessel: ["KNDNR"],
      felder: ["*", "KNDNR", "Name", "PLZ", "Ort", "Land", "Kundenbezirk"] },
    { id: "auftrag", name: "Auftrag", x: 260, w: 160, schluessel: [],
      felder: ["*", "PLIKZ", "KNDNR", "ARTNR", "FKART", "KHIER", "Umsatz Flaschen", "Umsatz Verpackung", "Rabatt", "Skonto",
               "Bonus", "Fracht", "Gruppenbonus", "Herstellkosten", "Menge", "Provision", "Sonderbonus"] },
    { id: "artikel", name: "Artikel", x: 540, w: 140, schluessel: ["ARTNR"], felder: ["*", "ARTNR", "Bezeichnung", "Farbe"] },
    { id: "farbe", name: "Farbe", x: 820, w: 140, schluessel: ["Farbnr"], felder: ["*", "Farbnr", "Farbe"] },
  ];
  const HILFE = { KNDNR: "Kundennummer", ARTNR: "Artikelnummer", PLIKZ: "Plan-/Ist-Kennzeichen", KHIER: "Kundenhierarchie",
                  FKART: "Fakturaart", Farbnr: "Farbnummer", "*": "alle Felder der Tabelle" };
  // von Tabelle.Feld nach Tabelle.Feld, Kardinalität an beiden Enden
  const BEZIEHUNGEN = [["kunden", "KNDNR", "auftrag", "KNDNR", "1", "n"], ["auftrag", "ARTNR", "artikel", "ARTNR", "", ""],
                       ["artikel", "Farbe", "farbe", "Farbnr", "", ""]];
  const FROM = ["FROM Kunden", "     INNER JOIN (Farbe", "       INNER JOIN (Artikel",
                "         INNER JOIN Auftrag ON Artikel.ARTNR = Auftrag.ARTNR)", "       ON Farbe.Farbnr = Artikel.Farbe)",
                "     ON Kunden.KNDNR = Auftrag.KNDNR"];
  const FUNKTIONEN = ["Gruppierung", "Summe", "Mittelwert", "Min", "Max", "Anzahl", "Bedingung"];
  const AGG = { Summe: "Sum", Mittelwert: "Avg", Min: "Min", Max: "Max", Anzahl: "Count" };
  const SORT = [["", ""], ["auf", "Aufsteigend"], ["ab", "Absteigend"]];
  const tabelle = id => TABELLEN.find(t => t.id === id);

  /* ---------- Entwurf: 16 Spalten wie Abb. 5.39, Raster mit 7 Spalten je Ansicht ---------- */
  const PRO_SEITE = 7;
  const spalte = (tab, feld, fn) => ({ tab, feld, fn, zeigen: true, sort: "", krit: "", oder: "" });
  let SP = [spalte("kunden", "KNDNR", "Gruppierung"), spalte("artikel", "ARTNR", "Gruppierung"),
            spalte("auftrag", "PLIKZ", "Gruppierung"), spalte("kunden", "Name", "Gruppierung"),
            spalte("auftrag", "KHIER", "Gruppierung"), spalte("artikel", "Farbe", "Gruppierung"),
            ...["Umsatz Flaschen", "Umsatz Verpackung", "Rabatt", "Skonto", "Bonus", "Fracht", "Gruppenbonus",
                "Herstellkosten", "Provision", "Sonderbonus"].map(f => spalte("auftrag", f, "Summe"))];
  let seite = 0;
  function auffuellen() {                                   // immer mindestens eine leere Spalte am Ende
    let letzte = -1;
    SP.forEach((s, i) => { if (s) letzte = i; });
    const n = Math.max(3, Math.ceil((letzte + 2) / PRO_SEITE)) * PRO_SEITE;
    while (SP.length < n) SP.push(null);
    while (SP.length > n && SP[SP.length - 1] === null) SP.pop();
  }
  auffuellen();

  /* ---------- Tabellen mit Feldlisten ---------- */
  const flaeche = $("flaeche");
  const zeilen = {};
  TABELLEN.forEach(t => {
    const b = el("div", { class: "tb", id: "t-" + t.id, style: `left:${t.x}px;width:${t.w}px` }, flaeche);
    el("div", { class: "tb-kopf", id: "tk-" + t.id }, b, t.name);
    t.felder.forEach(f => {
      const z = el("div", { class: "tb-feld" + (t.schluessel.includes(f) ? " schluessel" : ""), tabindex: PRINT ? undefined : "0",
        id: `f-${t.id}-${f.replace(/\W/g, "")}`, title: (HILFE[f] ? HILFE[f] + " – " : "") + "ins Raster ziehen oder doppelklicken" }, b, f);
      if (PRINT) z.removeAttribute("tabindex");
      zeilen[t.id + "." + f] = z;
      if (!PRINT) {
        z.addEventListener("dblclick", () => anhaengen(t.id, f));
        z.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); anhaengen(t.id, f); } });
        ziehbar(z, t.id, f);
      }
    });
  });

  /* ---------- Verknüpfungslinien (rechtwinklig) und Kardinalitäten ---------- */
  const svg = $("bez");
  function linien() {
    svg.textContent = "";
    flaeche.querySelectorAll(".kard").forEach(k => k.remove());
    BEZIEHUNGEN.forEach(([ta, fa, tb, fb, ka, kb], i) => {
      const A = tabelle(ta), Bt = tabelle(tb), za = zeilen[ta + "." + fa], zb = zeilen[tb + "." + fb];
      const ya = za.offsetTop + za.parentElement.offsetTop + 1 + za.offsetHeight / 2;
      const yb = zb.offsetTop + zb.parentElement.offsetTop + 1 + zb.offsetHeight / 2;
      const xa = A.x + A.w, xb = Bt.x, xm = Math.round((xa + xb) / 2);
      sv("polyline", { points: `${xa},${ya} ${xm},${ya} ${xm},${yb} ${xb},${yb}`, fill: "none", stroke: "#3A3F44", "stroke-width": 1.5 }, svg);
      if (ka) el("span", { class: "kard", id: `kard-${i}-a`, style: `left:${xa + 6}px;top:${ya - 19}px` }, flaeche, ka);
      if (kb) el("span", { class: "kard", id: `kard-${i}-b`, style: `left:${xb - 16}px;top:${yb - 19}px` }, flaeche, kb);
    });
  }
  linien();

  /* ---------- Entwurfsraster ---------- */
  const qbe = $("qbe");
  const ZEILEN = [["feld", "Feld"], ["tabelle", "Tabelle"], ["fn", "Funktion"], ["sort", "Sortierung"],
                  ["zeigen", "Anzeigen"], ["krit", "Kriterien"], ["oder", "oder"]];
  const Z = {};
  ZEILEN.forEach(([k, text]) => {
    el("div", { class: "qbe-l", id: "l-" + k }, qbe, text);
    Z[k] = [];
    for (let s = 0; s < PRO_SEITE; s++) {
      let c;
      const id = `${k}-${s}`;
      if (k === "feld") {
        c = el("select", { class: "mk-feld" + (s === 0 ? " aktiv" : ""), id, "aria-label": `Feld, Spalte ${s + 1}`,
          "data-hilfe": "Feld wählen oder aus einer Feldliste hierher ziehen" }, qbe);
        el("option", { value: "" }, c, "");
        TABELLEN.forEach(t => {
          const g = el("optgroup", { label: t.name }, c);
          t.felder.filter(f => f !== "*").forEach(f => el("option", { value: `${t.id}.${f}` }, g, f));
        });
      } else if (k === "tabelle") {
        c = el("div", { class: "mk-feld mk-anzeige", id }, qbe);
      } else if (k === "fn") {
        c = el("select", { class: "mk-feld", id, "aria-label": `Funktion, Spalte ${s + 1}`, "data-hilfe": "Gruppierung, Summenfunktion oder Bedingung" }, qbe);
        el("option", { value: "" }, c, "");
        FUNKTIONEN.forEach(f => el("option", { value: f }, c, f));
      } else if (k === "sort") {
        c = el("select", { class: "mk-feld", id, "aria-label": `Sortierung, Spalte ${s + 1}`, "data-hilfe": "Sortierung des Ergebnisses" }, qbe);
        SORT.forEach(([v, t]) => el("option", { value: v }, c, t));
      } else if (k === "zeigen") {
        const zelle = el("div", { class: "mk-feld ck", id: "zelle-" + id }, qbe);
        const lab = el("label", { class: "mk-option" }, zelle);
        c = el("input", { type: "checkbox", class: "mk-check", id, "aria-label": `Anzeigen, Spalte ${s + 1}` }, lab);
      } else {
        c = el("input", { class: "mk-feld", id, "aria-label": `${text}, Spalte ${s + 1}`,
          "data-hilfe": "Bedingung, z. B. >1000, Nord oder Like \"A*\"" }, qbe);
      }
      c.dataset.spalte = s;
      Z[k].push(c);
    }
  });
  const marke = el("div", { class: "einfuegen", id: "einfuegen" }, qbe);

  const index = s => seite * PRO_SEITE + s;
  function zeigen() {
    for (let s = 0; s < PRO_SEITE; s++) {
      const c = SP[index(s)];
      Z.feld[s].value = c ? `${c.tab}.${c.feld}` : "";
      Z.tabelle[s].textContent = c ? tabelle(c.tab).name : "";
      Z.fn[s].value = c ? c.fn : "";
      Z.sort[s].value = c ? c.sort : "";
      Z.zeigen[s].checked = !!(c && c.zeigen);
      Z.krit[s].value = c ? c.krit : "";
      Z.oder[s].value = c ? c.oder : "";
      [Z.krit[s], Z.oder[s]].forEach(f => { f.classList.remove("mk-fehler"); f.title = f.dataset.hilfe; });
    }
    const belegt = SP.filter(Boolean).length;
    const a = seite * PRO_SEITE + 1, b = a + PRO_SEITE - 1;
    $("seiten").textContent = `Spalten ${a}${NDASH}${b} · ${belegt} Felder im Entwurf`;
    sql();
  }

  /* ---------- SQL-Anweisung aus dem Entwurf ---------- */
  const name = f => (/[^A-Za-z0-9_]/.test(f) ? `[${f}]` : f);
  const ref = c => `${tabelle(c.tab).name}.${name(c.feld)}`;
  const ausdruck = c => (AGG[c.fn] ? `${AGG[c.fn]}(${ref(c)})` : ref(c));
  function bedingung(aus, k) {
    let t = String(k || "").trim();
    if (!t) return null;
    t = t.replace(/(\d),(\d)/g, "$1.$2");
    const m = /^(<>|<=|>=|=|<|>)\s*(.+)$/.exec(t);
    if (m) {
      const w = /^-?\d+(\.\d+)?$/.test(m[2]) || /^".*"$/.test(m[2]) ? m[2] : `"${m[2]}"`;
      return `${aus} ${m[1]} ${w}`;
    }
    if (/^(like|between|in|is|not)\b/i.test(t)) return `${aus} ${t}`;
    if (/^-?\d+(\.\d+)?$/.test(t) || /^".*"$/.test(t)) return `${aus} = ${t}`;
    return `${aus} = "${t}"`;
  }
  function liste(teile, einzug) {
    // einfache Felder zu dritt in einer Zeile, Summenfelder je Zeile mit ausgerichtetem AS
    const breit = Math.max(0, ...teile.filter(t => t.as).map(t => t.aus.length));
    const z = [];
    let offen = [];
    teile.forEach(t => {
      if (t.as) { if (offen.length) { z.push(offen.join(", ")); offen = []; } z.push(t.aus.padEnd(breit) + " AS " + t.as); }
      else { offen.push(t.aus); if (offen.length === 3) { z.push(offen.join(", ")); offen = []; } }
    });
    if (offen.length) z.push(offen.join(", "));
    return z.join(",\n" + einzug);
  }
  function sql() {
    const sp = SP.filter(Boolean);
    const sel = sp.filter(c => c.zeigen && c.fn !== "Bedingung")
      .map(c => (AGG[c.fn] ? { aus: ausdruck(c), as: `[${c.fn} von ${c.feld}]` } : { aus: ref(c) }));
    const teile = [];
    teile.push(sel.length ? "SELECT " + liste(sel, "       ") : "SELECT  (kein Feld angezeigt)");
    teile.push(...FROM);
    const zeilen2 = k => {
      const wo = [], hv = [];
      sp.forEach(c => {
        const b = bedingung(c.fn === "Bedingung" ? ref(c) : ausdruck(c), c[k]);
        if (b) (c.fn === "Bedingung" ? wo : hv).push(b);
      });
      return [wo, hv];
    };
    const [w1, h1] = zeilen2("krit"), [w2, h2] = zeilen2("oder");
    const oder = (a, b) => [a, b].filter(x => x.length).map(x => (x.length > 1 ? `(${x.join(" AND ")})` : x[0]));
    const wo = oder(w1, w2), hv = oder(h1, h2);
    if (wo.length) teile.push("WHERE " + wo.join("\n   OR "));
    const gr = sp.filter(c => c.fn === "Gruppierung").map(c => ({ aus: ref(c) }));
    if (gr.length) teile.push("GROUP BY " + liste(gr, "         "));
    if (hv.length) teile.push("HAVING " + hv.join("\n    OR "));
    const so = sp.filter(c => c.sort && c.fn !== "Bedingung").map(c => ausdruck(c) + (c.sort === "ab" ? " DESC" : ""));
    if (so.length) teile.push("ORDER BY " + so.join(", "));
    $("sql").textContent = teile.join("\n") + ";";
  }

  /* ---------- Eingaben im Raster ---------- */
  const leer = s => { if (!SP[index(s)]) { MK.meldung("Zuerst ein Feld in diese Spalte ziehen oder in der Zeile „Feld“ wählen."); zeigen(); return true; } return false; };
  for (let s = 0; s < PRO_SEITE; s++) {
    Z.feld[s].addEventListener("focus", () => { Z.feld.forEach(f => f.classList.toggle("aktiv", f === Z.feld[s])); });
    Z.feld[s].addEventListener("change", () => {
      const v = Z.feld[s].value, i = index(s);
      if (!v) SP[i] = null;
      else {
        const [tab, feld] = v.split(".");
        SP[i] = SP[i] ? Object.assign(SP[i], { tab, feld }) : spalte(tab, feld, "Gruppierung");
      }
      auffuellen(); zeigen();
    });
    Z.fn[s].addEventListener("change", () => {
      if (leer(s)) return;
      const c = SP[index(s)];
      if (!Z.fn[s].value) { Z.fn[s].value = c.fn; return; }
      c.fn = Z.fn[s].value;
      if (c.fn === "Bedingung") c.zeigen = false;
      zeigen();
    });
    Z.sort[s].addEventListener("change", () => { if (leer(s)) return; SP[index(s)].sort = Z.sort[s].value; sql(); });
    Z.zeigen[s].addEventListener("change", () => {
      if (leer(s)) return;
      const c = SP[index(s)];
      if (c.fn === "Bedingung" && Z.zeigen[s].checked) { Z.zeigen[s].checked = false; MK.meldung("Felder mit der Funktion „Bedingung“ werden nicht angezeigt."); return; }
      c.zeigen = Z.zeigen[s].checked; sql();
    });
    ["krit", "oder"].forEach(k => Z[k][s].addEventListener("input", () => {
      const f = Z[k][s];
      if (!SP[index(s)]) { if (f.value) { f.value = ""; MK.meldung("Zuerst ein Feld in diese Spalte ziehen oder in der Zeile „Feld“ wählen."); } return; }
      const t = f.value.trim();
      const ok = !/[;]/.test(t) && (t.match(/"/g) || []).length % 2 === 0;
      f.classList.toggle("mk-fehler", !ok);
      f.title = ok ? f.dataset.hilfe : "Kriterium ohne Semikolon, Anführungszeichen paarweise";
      if (ok) { SP[index(s)][k] = t; sql(); }
    }));
  }

  /* ---------- Felder übernehmen: Drag & Drop, Doppelklick, Enter ---------- */
  function einfuegen(i, tab, feld) {
    if (feld === "*") { MK.meldung("„*“ (alle Felder) passt nicht zu einer Abfrage mit Summenfunktion – Felder einzeln übernehmen."); return; }
    const c = spalte(tab, feld, "Gruppierung");
    const letzte = SP.reduce((m, x, k) => (x ? k : m), -1);
    if (i > letzte) i = letzte + 1;                           // keine Lücken: hinter die letzte belegte Spalte
    SP.splice(i, 0, c);
    auffuellen();
    seite = Math.floor(i / PRO_SEITE);
    zeigen();
    MK.meldung(`${tabelle(tab).name}.${feld} als Spalte ${i + 1} übernommen (Funktion Gruppierung).`);
  }
  function anhaengen(tab, feld) { einfuegen(SP.length, tab, feld); }
  function zielBei(x, y) {
    const r = qbe.getBoundingClientRect();
    if (y < r.top - 6 || y > r.bottom + 6) return null;
    for (let s = 0; s < PRO_SEITE; s++) {
      const a = Z.feld[s].getBoundingClientRect();
      if (x >= a.left && x < a.right) return s;
    }
    return null;
  }
  function markieren(s) {
    if (s === null) { marke.style.display = "none"; return; }
    marke.style.display = "block";
    marke.style.left = Z.feld[s].offsetLeft + "px";
  }
  function ziehbar(z, tab, feld) {
    z.addEventListener("pointerdown", e => {
      if (e.button !== 0) return;
      e.preventDefault();
      z.focus();
      const x0 = e.clientX, y0 = e.clientY;
      let geist = null, ziel = null;
      const bewegen = ev => {
        if (!geist && Math.hypot(ev.clientX - x0, ev.clientY - y0) < 5) return;
        if (!geist) geist = el("div", { class: "zieh-geist" }, document.body, `${tabelle(tab).name}.${feld}`);
        geist.style.left = ev.clientX + 12 + "px"; geist.style.top = ev.clientY + 10 + "px";
        ziel = zielBei(ev.clientX, ev.clientY); markieren(ziel);
      };
      const ende = () => {
        removeEventListener("pointermove", bewegen); removeEventListener("pointerup", ende); removeEventListener("pointercancel", ende);
        if (!geist) return;
        geist.remove(); markieren(null);
        if (ziel !== null) einfuegen(index(ziel), tab, feld);
      };
      addEventListener("pointermove", bewegen); addEventListener("pointerup", ende); addEventListener("pointercancel", ende);
    });
  }

  /* ---------- Blättern und SQL-Ansicht ---------- */
  $("k-weiter").addEventListener("click", () => {
    if ((seite + 1) * PRO_SEITE >= SP.length) { MK.meldung("Letzte Spalten erreicht – neue Felder kommen hinter die letzte Spalte."); return; }
    seite++; zeigen();
  });
  $("k-zurueck").addEventListener("click", () => {
    if (seite === 0) { MK.meldung("Die ersten Spalten werden bereits angezeigt."); return; }
    seite--; zeigen();
  });
  $("k-sql").addEventListener("click", () => {
    const b = $("sql-bereich"), auf = b.style.display === "none";
    b.style.display = auf ? "block" : "none";
    $("k-sql").textContent = auf ? "SQL-Anweisung ausblenden" : "SQL-Anweisung anzeigen";
    MK.skalieren(); if (MK._ebenenNeu) MK._ebenenNeu();
  });
  zeigen();

  /* ---------- Klappen ohne Maßstabssprung (wie Abb. 3.7) ---------- */
  if (!PRINT) {
    const maske = $("abfrage"), seiteEl = $("seite"), rahmen = seiteEl.parentElement;
    let alt = null;
    const merken = e => { if (e.target.closest && e.target.closest(".mk-band")) alt = seiteEl.style.transform; };
    const halten = e => {
      if (alt === null || !(e.target.closest && e.target.closest(".mk-band"))) return;
      const s = parseFloat((/scale\(([\d.]+)\)/.exec(alt) || [0, 1])[1]);
      seiteEl.style.transform = alt; alt = null;
      rahmen.style.width = maske.offsetWidth * s + "px"; rahmen.style.height = maske.offsetHeight * s + "px";
      if (MK._ebenenNeu) MK._ebenenNeu();
    };
    ["click", "keydown"].forEach(t => { maske.addEventListener(t, merken, true); maske.addEventListener(t, halten); });
  }

  /* ---------- Lernplattform: Erläuterungen und Gestaltung ---------- */
  MK.ebenen({
    erlaeuterungen: {
      titel: "Erläuterungen",
      intro: "Wie der Abfragegenerator aus dem grafischen Entwurf eine SQL-Anweisung erzeugt. Ziehen Sie Felder ins Raster, ändern Sie Funktion, Sortierung oder Kriterien und lassen Sie sich die SQL-Anweisung anzeigen.",
      eintraege: [
        { nr: 1, ziel: "tk-auftrag", versatz: [-4, 2], titel: "Tabellen als Datenquelle",
          text: "Die Abfrage liest aus vier Tabellen der Auftragsdatenbank. Jede Feldliste zeigt alle Felder einer Tabelle, Primärschlüssel fett; „*“ steht für alle Felder. Die Felder entsprechen dem Listing in Abb. 5.39." },
        { nr: 2, ziel: "kard-0-a", versatz: [4, -2], titel: "Beziehungen (Joins)",
          text: "Die Linien verbinden gleichbedeutende Felder: Ein Kunde hat viele Aufträge (1:n über KNDNR), jeder Auftrag betrifft einen Artikel (ARTNR), jeder Artikel eine Farbe. Der Generator setzt sie als INNER JOIN in die FROM-Klausel." },
        { nr: 3, ziel: "f-auftrag-Rabatt", versatz: [-4, -3], titel: "Felder per Drag & Drop",
          text: "Ein Feld wird aus der Feldliste in eine Spalte des Rasters gezogen oder doppelgeklickt. Jede Spalte ist ein Feld der SELECT-Anweisung; die Tabelle trägt der Generator selbst ein." },
        { nr: 4, ziel: "l-fn", versatz: [-6, 2], titel: "Gruppierung und Summe",
          text: "„Gruppierung“ verdichtet die Aufträge je Kunde, Artikel, Plan-/Ist-Kennzeichen, Kundenhierarchie und Farbe (GROUP BY), „Summe“ addiert die Wertfelder (Sum … AS [Summe von …]) – daher der Name „Verdichtete Summenwerte“." },
        { nr: 5, ziel: "l-sort", versatz: [-6, 2], titel: "Sortierung",
          text: "Aufsteigend oder absteigend sortierte Spalten bilden die ORDER-BY-Klausel, in der Reihenfolge der Spalten von links nach rechts." },
        { nr: 6, ziel: "l-zeigen", versatz: [-6, 2], titel: "Anzeigen",
          text: "Nur angehakte Felder erscheinen im Ergebnis. Ein ausgeblendetes Gruppierungsfeld gruppiert trotzdem mit – so lassen sich Werte je Kunde verdichten, ohne die Kundennummer auszugeben." },
        { nr: 7, ziel: "l-krit", versatz: [-6, 2], titel: "Kriterien und oder",
          text: "Bedingungen in einer Zeile gelten gemeinsam (UND), die Zeilen „Kriterien“ und „oder“ alternativ (ODER). Bei Gruppierungs- und Summenfeldern entsteht HAVING, bei der Funktion „Bedingung“ WHERE." },
        { nr: 8, ziel: "k-sql", versatz: [-6, -12], titel: "SQL-Anweisung",
          text: "Der Generator schreibt die Anweisung aus Abb. 5.39. So können Fachanwender frei recherchieren, ohne SQL zu beherrschen – das Datenmodell mit seinen Tabellen und Beziehungen müssen sie aber kennen." },
      ],
    },
    gestaltung: {
      titel: "Gestaltung",
      intro: "Was gegenüber dem Original geändert wurde – softwareneutral im Buchstil und nach den Interaktionsprinzipien der DIN EN ISO 9241-110.",
      eintraege: [
        { nr: "A", ziel: "kopf-titel", versatz: [-4, 4], regel: "BUCHSTIL – SOFTWARENEUTRAL", titel: "Kein Programmfenster",
          text: "Fensterrahmen, Menü- und Symbolleiste, Datenbankfenster, Statusleiste, Taskleiste und Bildlaufleisten entfallen; der Fenstertitel „Verdichtete Summenwerte : Auswahlabfrage“ steht als Titelzeile über der Maske." },
        { nr: "B", ziel: "tabelle-1", versatz: [-4, 1], regel: "SELBSTBESCHREIBUNGSFÄHIGKEIT", titel: "Eingabe und Anzeige unterscheidbar",
          text: "Die Tabelle folgt aus dem gewählten Feld und ist grau hinterlegt; Feld, Funktion und Sortierung sind Auswahlfelder, Kriterien Eingabefelder. Im Original sahen alle Zellen gleich aus." },
        { nr: "C", ziel: "kard-0-b", versatz: [-20, -2], regel: "SELBSTBESCHREIBUNGSFÄHIGKEIT", titel: "n statt ∞, rechtwinklige Linien",
          text: "Die Kardinalität heißt „1“ und „n“ wie im Text; das Unendlichzeichen entfällt. Die schrägen Verbindungslinien sind rechtwinklig geführt und docken an den verknüpften Feldern an." },
        { nr: "D", ziel: "seiten", versatz: [-4, -3], regel: "AUFGABENANGEMESSENHEIT", titel: "Blättern statt abschneiden",
          text: "Das Original zeigte acht Spalten, die letzte abgeschnitten, und einen Bildlauf. Jetzt stehen sieben vollständige Spalten im Raster, die übrigen der 16 Felder sind über „Weitere Spalten“ erreichbar." },
        { nr: "E", ziel: "feld-6", versatz: [-4, 1], regel: "ERWARTUNGSKONFORMITÄT", titel: "Feldname statt Alias",
          text: "Die Zeile „Feld“ nennt das Feld (Umsatz Flaschen); der Alias „Summe von Umsatz Flaschen“ entsteht beim Erzeugen der Anweisung. Im Original stand der Alias abgeschnitten als „Summe von Umsatz“ im Raster." },
        { nr: "F", ziel: "feld-0", versatz: [-4, 1], regel: "ERWARTUNGSKONFORMITÄT", titel: "Pfeil in der aktiven Zelle",
          text: "Wie im Original trägt nur die aktive Zelle den Pfeil des Auswahlfelds; das Raster bleibt ruhig. Die grünen Häkchen der Kontrollkästchen sind anthrazit." },
        { nr: "G", ziel: "t-farbe", versatz: [-4, 2], regel: "STEUERBARKEIT", titel: "Ziehen, Doppelklick oder Tastatur",
          text: "Felder lassen sich ziehen, doppelklicken oder mit der Tabulatortaste ansteuern und mit Enter übernehmen. Eine senkrechte Marke zeigt beim Ziehen, wo die neue Spalte eingefügt wird." },
        { nr: "H", ziel: "kopf-unter", versatz: [-4, 2], regel: "BUCHSTIL – NEUTRAL UND AKTUELL", titel: "Kein Datenbankname",
          text: "Der Name der Datenbankdatei im Original entfällt („Auftragsdatenbank“). Tabellen- und Feldnamen bleiben, damit Entwurf und Listing in Abb. 5.39 übereinstimmen." },
      ],
    },
  });
  MK.fertig();
})();
