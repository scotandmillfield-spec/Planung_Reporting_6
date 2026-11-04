/* Einzelvisual „Normalisierte Tabellenstruktur in der 3. Normalform“ (Abb. 5.18).
   Seite 727 x 500 px = 110 x 75,6 mm. Daten: tabellen.json (daten_3nf.py) – die vier Tabellen des Originals mit
   unveränderten Werten. Anordnung wie im Original: Stammdaten (Produkte, Kunden) oben, Bewegungsdaten
   (Verkaufsdetails, Verkäufe) unten. Schlüssel als Text „PK“/„FK“ über den Spalten (Original: unterstrichen).
   Interaktion: Klick auf eine Zeile hebt in allen vier Tabellen die über Schlüssel verknüpften Zeilen hervor
   (Schlüsselwerte fett, übrige Zeilen blass) – so wird sichtbar, wie die Normalisierung die Daten verteilt,
   ohne Information zu verlieren. Esc hebt auf, Klick auf einen Spaltenkopf sortiert. */
(() => {
  "use strict";
  const { zahl, NBSP, el } = DK;
  const eur = v => zahl(v, 2) + NBSP + "€";
  const datum = iso => iso.split("-").reverse().join(".");
  const und = l => (l.length < 2 ? l.join("") : l.slice(0, -1).join(", ") + " und " + l[l.length - 1]);

  const PROD = DATA.produkte.map(([id, name, preis, vegan]) => ({ id, name, preis, vegan }));
  const KUND = DATA.kunden.map(([id, name, karte, vegan]) => ({ id, name, karte, vegan }));
  const DET = DATA.details.map(([v, p, menge, vegan]) => ({ key: v + "-" + p, v, p, menge, vegan }));
  const VERK = DATA.verkaeufe.map(([id, k, d, ort]) => ({ id, k, d, ort }));
  const prod = id => PROD.find(p => p.id === id), kund = id => KUND.find(k => k.id === id);
  const verk = id => VERK.find(v => v.id === id);
  const posWert = d => d.menge * prod(d.p).preis;

  /* ---------- Tabellen: Spalten mit Schlüsselrolle ---------- */
  const T = {
    produkte: { titel: "Produkte", liste: PROD, key: r => r.id, spalten: [
      { key: "id", titel: "ProduktID", tag: "PK", breite: 66, fmt: v => String(v) },
      { key: "name", titel: "ProduktName", breite: 118, typ: "text" },
      { key: "preis", titel: "Preis", breite: 40, fmt: v => zahl(v, 2) },
      { key: "vegan", titel: "VeganeOption", breite: 97, typ: "text" }] },
    kunden: { titel: "Kunden", liste: KUND, key: r => r.id, spalten: [
      { key: "id", titel: "KundenID", tag: "PK", breite: 66, fmt: v => String(v) },
      { key: "name", titel: "Name", breite: 73, typ: "text" },
      { key: "karte", titel: "DreamCardNr", breite: 95, fmt: v => String(v) },
      { key: "vegan", titel: "VeganePraeferenz", breite: 124, typ: "text" }] },
    details: { titel: "Verkaufsdetails", liste: DET, key: r => r.key, spalten: [
      { key: "v", titel: "VerkaufsID", tag: "PK, FK", breite: 72, fmt: v => String(v) },
      { key: "p", titel: "ProduktID", tag: "PK, FK", breite: 70, fmt: v => String(v) },
      { key: "menge", titel: "Menge", breite: 51, fmt: v => zahl(v) },
      { key: "vegan", titel: "Vegan", breite: 48, typ: "text" }] },
    verkaeufe: { titel: "Verkäufe", liste: VERK, key: r => r.id, spalten: [
      { key: "id", titel: "VerkaufsID", tag: "PK", breite: 72, fmt: v => String(v) },
      { key: "k", titel: "KundenID", tag: "FK", breite: 70, fmt: v => String(v) },
      { key: "d", titel: "Verkaufsdatum", breite: 101, fmt: v => datum(v), sortKey: v => v },
      { key: "ort", titel: "Verkaufsort", breite: 90, typ: "text" }] },
  };
  const breite = t => T[t].spalten.reduce((s, c) => s + c.breite, 0);

  /* ---------- Zustand ---------- */
  const S = { auswahl: null, sort: {} };              // auswahl: {tab, key}
  addEventListener("keydown", e => { if (e.key === "Escape" && S.auswahl) { S.auswahl = null; zeichnen(); } });

  /* ---------- Layout ---------- */
  const H = 500, XR = 711 - Math.max(breite("kunden"), breite("verkaeufe"));
  DK.init({ titel: "Normalisierte Tabellenstruktur in der 3. Normalform", breite: 727, hoehe: H });
  const bTitel = DK.box("v-titel", 16, 8, 695, 46);
  DK.haarlinie(60);
  const RZ = 22, KOPF = 20 + 18 + 22;                  // Zeilenhöhe; Tabellenname + Schlüsselzeile + Spaltenkopf
  const hoehe = t => KOPF + T[t].liste.length * RZ;
  const y1 = 70, y2 = y1 + Math.max(hoehe("produkte"), hoehe("kunden")) + 18;
  const B = {
    produkte: DK.box("t-produkte", 16, y1, breite("produkte"), hoehe("produkte")),
    kunden: DK.box("t-kunden", XR, y1, breite("kunden"), hoehe("kunden")),
    details: DK.box("t-details", 16, y2, breite("details"), hoehe("details")),
    verkaeufe: DK.box("t-verkaeufe", XR, y2, breite("verkaeufe"), hoehe("verkaeufe")),
  };
  DK.el("style", {}, document.head, `
    .t3nf .dk-matrix th, .t3nf .dk-matrix td { padding: 0 4px; }
    .t3nf .dk-matrix th { padding-bottom: 4px; }
    .t3nf .dk-matrix th:first-child, .t3nf .dk-matrix td:first-child { padding-left: 0; text-align: right; }
    .t3nf .dk-matrix tr.t-tags th { border-bottom: none; padding-bottom: 1px; font-weight: bold; height: 17px;
      color: var(--muted); vertical-align: bottom; }
    .t3nf .dk-matrix td.t-schluessel { font-weight: bold; }
    .t3nf .t-name { font-weight: bold; height: 20px; }`);

  /* ---------- Verknüpfung über Schlüssel ---------- */
  function verknuepft() {
    const a = S.auswahl;
    if (!a) return null;
    let V, D, P, K;
    if (a.tab === "produkte") {
      D = DET.filter(d => d.p === a.key); V = new Set(D.map(d => d.v)); P = new Set([a.key]);
      K = new Set([...V].map(v => verk(v).k));
    } else if (a.tab === "kunden") {
      V = new Set(VERK.filter(v => v.k === a.key).map(v => v.id)); D = DET.filter(d => V.has(d.v));
      P = new Set(D.map(d => d.p)); K = new Set([a.key]);
    } else if (a.tab === "verkaeufe") {
      V = new Set([a.key]); D = DET.filter(d => d.v === a.key); P = new Set(D.map(d => d.p)); K = new Set([verk(a.key).k]);
    } else {
      D = DET.filter(d => d.key === a.key); V = new Set([D[0].v]); P = new Set([D[0].p]); K = new Set([verk(D[0].v).k]);
    }
    return { produkte: P, kunden: K, details: new Set(D.map(d => d.key)), verkaeufe: V, D };
  }

  /* ---------- Botschaft ---------- */
  const passt = (k, b) => k.find(t => DK.tw(t) <= b) || k[k.length - 1];
  function botschaft(b) {
    const a = S.auswahl, menge = l => l.reduce((s, d) => s + d.menge, 0), wert = l => l.reduce((s, d) => s + posWert(d), 0);
    if (!a) {
      const n = `${VERK.length} Verkäufe mit ${DET.length} Positionen an ${KUND.length} Kunden`;
      return passt([`${n} – jeder Produkt- und Kundendatensatz steht nur einmal, Schlüssel verknüpfen`,
                    `${n} – Schlüssel verknüpfen die Tabellen`, n], b);
    }
    const r = verknuepft();
    if (a.tab === "produkte") {
      const p = prod(a.key), v = [...r.verkaeufe];
      if (!v.length) return `${p.name}: in keinem Verkauf enthalten`;
      const k = und([...r.kunden].map(id => kund(id).name));
      return passt([`${p.name}: ${v.length} ${v.length > 1 ? "Positionen" : "Position"} in Verkauf ${und(v.map(String))}, ` +
                    `${zahl(menge(r.D))} Stück, ${eur(wert(r.D))} – ${r.kunden.size > 1 ? "Kunden" : "Kunde"} ${k}`,
                    `${p.name}: Verkauf ${und(v.map(String))}, ${zahl(menge(r.D))} Stück, ${eur(wert(r.D))}`], b);
    }
    if (a.tab === "kunden") {
      const k = kund(a.key), v = [...r.verkaeufe];
      return passt([`${k.name}: ${v.length} Verkäufe (${und(v.map(String))}) mit ${r.D.length} Positionen, ` +
                    `${zahl(menge(r.D))} Stück, ${eur(wert(r.D))}`,
                    `${k.name}: ${v.length} Verkäufe, ${zahl(menge(r.D))} Stück, ${eur(wert(r.D))}`], b);
    }
    if (a.tab === "verkaeufe") {
      const v = verk(a.key), k = kund(v.k);
      return passt([`Verkauf ${v.id} am ${datum(v.d)} (${v.ort}): ${k.name} kauft ${r.D.length} ` +
                    `${r.D.length > 1 ? "Produkte" : "Produkt"}, ${zahl(menge(r.D))} Stück, ${eur(wert(r.D))}`,
                    `Verkauf ${v.id}: ${k.name}, ${zahl(menge(r.D))} Stück, ${eur(wert(r.D))}`], b);
    }
    const d = r.D[0], p = prod(d.p), k = kund(verk(d.v).k);
    return passt([`Verkauf ${d.v}, Position ${p.name}: ${zahl(d.menge)} × ${eur(p.preis)} = ${eur(posWert(d))}, Kunde ${k.name}`,
                  `Verkauf ${d.v}, ${p.name}: ${eur(posWert(d))}`], b);
  }

  /* ---------- Tooltips ---------- */
  const HINWEIS = "Klick zeigt die verknüpften Zeilen";
  function tooltip(tab, r) {
    if (tab === "produkte") {
      const D = DET.filter(d => d.p === r.id);
      return [r.name, `ProduktID ${r.id} (Primärschlüssel) · Preis ${eur(r.preis)} · vegane Option: ${r.vegan}`,
        D.length ? `In ${D.length} ${D.length > 1 ? "Positionen" : "Position"} (Verkauf ${und(D.map(d => String(d.v)))}), ` +
                   `${zahl(D.reduce((s, d) => s + d.menge, 0))} Stück` : "In keinem Verkauf enthalten", HINWEIS];
    }
    if (tab === "kunden") {
      const V = VERK.filter(v => v.k === r.id);
      return [r.name, `KundenID ${r.id} (Primärschlüssel) · DreamCardNr ${r.karte} · vegane Präferenz: ${r.vegan}`,
        `Verkäufe ${und(V.map(v => String(v.id)))}`, HINWEIS];
    }
    if (tab === "details") {
      const p = prod(r.p);
      return [`Verkauf ${r.v} · ${p.name}`, "Schlüssel aus VerkaufsID und ProduktID, beide zugleich Fremdschlüssel",
        `Menge ${zahl(r.menge)} × ${eur(p.preis)} = ${eur(posWert(r))} · vegan ausgegeben: ${r.vegan}`, HINWEIS];
    }
    const k = kund(r.k), D = DET.filter(d => d.v === r.id);
    return [`Verkauf ${r.id}`, `${datum(r.d)} · ${r.ort} · KundenID ${r.k} = ${k.name} (Fremdschlüssel)`,
      `${D.length} ${D.length > 1 ? "Positionen" : "Position"}: ${und(D.map(d => prod(d.p).name))}`, HINWEIS];
  }

  /* ---------- Tabelle zeichnen ---------- */
  function sortiert(tab) {
    const t = T[tab], s = S.sort[tab], l = t.liste.slice();
    if (!s) return l;
    const sp = t.spalten.find(c => c.key === s.key), sk = sp.sortKey || (v => v);
    return l.sort((a, b) => {
      const x = sk(a[s.key]), y = sk(b[s.key]);
      const c = typeof x === "number" ? x - y : String(x).localeCompare(String(y), "de");
      return (s.ab ? -c : c) || String(t.key(a)).localeCompare(String(t.key(b)), "de", { numeric: true });
    });
  }
  function sortieren(tab, key) {
    const s = S.sort[tab];
    S.sort[tab] = s && s.key === key ? { key, ab: !s.ab } : { key, ab: false };
    zeichnen();
  }
  function tabelle(tab, rel) {
    const t = T[tab], box = B[tab];
    box.textContent = "";
    box.classList.add("t3nf");
    el("div", { class: "t-name" }, box, t.titel);
    const huelle = el("div", {}, box);                 // DK.matrix leert sein Ziel – Tabellenname bleibt stehen
    const liste = sortiert(tab);
    const zeilen = liste.map(r => ({ key: t.key(r), label: t.spalten[0].fmt(r[t.spalten[0].key]), r,
      werte: Object.fromEntries(t.spalten.slice(1).map(c => [c.key, c.typ === "text" ? r[c.key] : r[c.key]])) }));
    const spalten = t.spalten.map((c, i) => ({ key: c.key, titel: c.titel, breite: c.breite, typ: c.typ, fmt: c.fmt,
                                               id: i === 0 ? `kopf-${tab}` : undefined }));
    const tab_ = DK.matrix(huelle, { spalten, zeilen, zeilenhoehe: RZ, sortierung: S.sort[tab], onSort: k => sortieren(tab, k),
      onClick: k => { S.auswahl = S.auswahl && S.auswahl.tab === tab && S.auswahl.key === k ? null : { tab, key: k }; zeichnen(); },
      tooltip: z => tooltip(tab, z.r) });
    // Sortierpfeil aus dem Spaltenkopf in die Schlüsselzeile (Spaltenbreite bleibt gleich)
    const kopf = tab_.querySelector("thead tr");
    const tags = el("tr", { class: "t-tags" });
    kopf.parentNode.insertBefore(tags, kopf);
    [...kopf.children].forEach((th, i) => {
      let pfeil = "";
      th.childNodes.forEach(n => { if (n.nodeType === 3 && /[▾▴]/.test(n.textContent) && n !== th.firstChild) { pfeil = n.textContent.trim(); n.remove(); } });
      const c = t.spalten[i];
      el("th", { style: `width:${c.breite}px;text-align:${c.typ === "text" ? "left" : "right"}`, id: `tag-${tab}-${i}` }, tags,
         [c.tag || "", pfeil].filter(Boolean).join(" "));
    });
    // Verknüpfung: nicht verbundene Zeilen blass, Schlüsselwerte verbundener Zeilen fett
    const trs = tab_.querySelectorAll("tbody tr");
    zeilen.forEach((z, i) => {
      const an = !rel || rel[tab].has(z.key);
      trs[i].classList.toggle("dk-blass", !an);
      if (rel && an) t.spalten.forEach((c, j) => { if (c.tag) trs[i].children[j].classList.add("t-schluessel"); });
    });
  }

  /* ---------- Zeichnen ---------- */
  function zeichnen() {
    DK.visual(bTitel, { titel: "Verkaufsdaten in vier Tabellen (3. Normalform)", einheit: "Preis in €",
                        botschaft: botschaft(695) });
    const rel = verknuepft();
    Object.keys(T).forEach(t => tabelle(t, rel));
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  /* ---------- Lernplattform: Designregeln, Nachbau, Tabellen, CSV ---------- */
  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "v-titel", anker: "links", versatz: [640, 22], regel: "SAY – Botschaft vermitteln", titel: "Aussage unter dem Titel",
        text: "Unter dem Titel steht, was die vier Tabellen zusammen enthalten; nach einem Klick, was zur gewählten Zeile gehört – z. B. alle Positionen, Stückzahl und Wert eines Verkaufs. Das Original zeigte vier Tabellen ohne Titel und ohne Aussage." },
      { nr: 2, ziel: "tag-produkte-0", versatz: [-32, 0], regel: "EXPRESS – Schlüssel benennen", titel: "PK und FK über den Spalten",
        text: "Primär- und Fremdschlüssel stehen als „PK“ und „FK“ über den Spalten – wie im Schema der Abb. 5.17. Im Original waren sie nur fett bzw. unterstrichen, ohne Erklärung. Verkaufsdetails hat einen zusammengesetzten Schlüssel aus VerkaufsID und ProduktID." },
      { nr: 3, ziel: "t-details", anker: "links", versatz: [280, 90], regel: "CONDENSE – Verknüpfung zeigen", titel: "Klick folgt den Schlüsseln",
        text: "Ein Klick auf eine Zeile hebt in allen vier Tabellen die Zeilen hervor, die über die Schlüssel dazugehören; die Schlüsselwerte werden fett, alles andere blass. So wird sichtbar, dass die Normalisierung die Daten auf Tabellen verteilt, ohne Information zu verlieren. Esc hebt auf." },
      { nr: 4, ziel: "t-kunden", anker: "links", versatz: [6, 136], regel: "STRUCTURE – Inhalte ordnen", titel: "Stammdaten oben, Bewegungsdaten unten",
        text: "Wie im Original stehen die Stammdaten (Produkte, Kunden) oben und die Bewegungsdaten (Verkaufsdetails, Verkäufe) darunter; die Schlüssel stehen in jeder Tabelle links. Ein Klick auf einen Spaltenkopf sortiert, die Richtung zeigt der Pfeil in der Schlüsselzeile." },
      { nr: 5, ziel: "kopf-verkaeufe", versatz: [287, 2], regel: "UNIFY – Einheitliche Formate", titel: "Text links, Zahlen rechts",
        text: "Texte stehen linksbündig, Zahlen und Datumswerte rechtsbündig; das Original setzte auch Namen und „Ja/Nein“ rechtsbündig. Preise mit zwei Nachkommastellen, Einheit einmal im Titel, Datum im deutschen Format (Original: 2024-10-01)." },
      { nr: 6, ziel: "t-produkte", anker: "links", versatz: [300, -2], regel: "SIMPLIFY – Überflüssiges weglassen", titel: "Ohne Rahmen und Farbflächen",
        text: "Die hellblauen Kopfzeilen und die Rahmen um jede Tabelle entfallen; eine Linie unter dem Spaltenkopf und feine Zeilenlinien genügen. Werte und Feldnamen sind die des Originals." },
      { nr: 7, ziel: "kopf-details", versatz: [198, 2], regel: "CHECK – Richtige Inhalte", titel: "Einheitliche Feldnamen",
        text: "Die Feldnamen lauten wie im Schema der Abb. 5.17 und in den Star-Schemata 5.19–5.22: „Verkaufsdatum“ und „Verkaufsort“ statt „VerkaufsDatum“ und „VerkaufsOrt“. „Vegan“ in Verkaufsdetails ist ein Merkmal der Position (vegan ausgegeben), nicht des Produkts – sonst hinge es nur von ProduktID ab." },
    ],
    nachbauIntro: "Standard-Visuals von Power BI Desktop. Seitengröße benutzerdefiniert 727 × 500 px. Schrift Arial: Tabellen 10,5 pt, Visualtitel 12 pt. Datenmodell: vier Tabellen aus der CSV-Datei (je Block eine Tabelle) mit den Beziehungen aus Abb. 5.17: Produkte 1:n Verkaufsdetails (ProduktID), Verkäufe 1:n Verkaufsdetails (VerkaufsID), Kunden 1:n Verkäufe (KundenID).",
    nachbau: [
      { id: "A", ziel: "t-produkte", versatz: [0, 0], titel: "Vier Tabellen", visual: "Tabelle (4×)",
        felder: "Je Tabelle alle Felder in der Reihenfolge des Originals; Preis als Dezimalzahl, Verkaufsdatum als Datum",
        format: "Gesamtsumme aus; Spaltenkopf 10,5 pt #4D4D4D mit Unterstrich #3A3F44, Zeilenraster #EFEFEF; Preis 2 Dezimalstellen; Text linksbündig, Zahlen rechtsbündig",
        hinweis: "„PK“/„FK“ über den Spalten ist kein Format der Tabelle – ersatzweise Textfelder über den Spalten oder Spalten umbenennen (z. B. „ProduktID (PK)“)." },
      { id: "B", ziel: "t-details", versatz: [0, 0], titel: "Verknüpfung per Klick", visual: "Interaktionen der Tabellen",
        felder: "Beziehungen 1:n wie oben, Kreuzfilterrichtung „Beide“, damit ein Klick auch von Verkaufsdetails zu Kunden und Produkten wirkt",
        format: "Format → Interaktionen bearbeiten: alle Tabellen „Filtern“",
        hinweis: "Power BI blendet nicht verknüpfte Zeilen aus, statt sie blass zu zeigen; Fettdruck der Schlüsselwerte ist nicht möglich." },
      { id: "C", ziel: "v-titel", anker: "links", versatz: [640, 22], titel: "Aussage", visual: "Textfeld mit dynamischem Wert",
        felder: "Text-Measure aus COUNTROWS(Verkäufe), COUNTROWS(Verkaufsdetails), SUMX(Verkaufsdetails; Verkaufsdetails[Menge] × RELATED(Produkte[Preis]))",
        format: "10,5 pt, #4D4D4D" },
    ],
    theme: DK.thema(),
    csv: { name: "verkaufsdaten_3nf.csv", text: () => {
      const z = ["Produkte;;;", "ProduktID;ProduktName;Preis_EUR;VeganeOption",
        ...PROD.map(p => [p.id, p.name, zahl(p.preis, 2), p.vegan].join(";")), "",
        "Kunden;;;", "KundenID;Name;DreamCardNr;VeganePraeferenz", ...KUND.map(k => [k.id, k.name, k.karte, k.vegan].join(";")), "",
        "Verkaufsdetails;;;", "VerkaufsID;ProduktID;Menge;Vegan", ...DET.map(d => [d.v, d.p, d.menge, d.vegan].join(";")), "",
        "Verkäufe;;;", "VerkaufsID;KundenID;Verkaufsdatum;Verkaufsort", ...VERK.map(v => [v.id, v.k, datum(v.d), v.ort].join(";"))];
      return z.join("\r\n"); } },
    tabellen: () => {
      const rel = verknuepft();
      return Object.keys(T).map(tab => {
        const t = T[tab];
        return { titel: t.titel + (rel ? " (verknüpfte Zeilen)" : ""),
          kopf: t.spalten.map(c => c.titel + (c.tag ? ` (${c.tag})` : "")),
          zeilen: sortiert(tab).filter(r => !rel || rel[tab].has(t.key(r)))
            .map(r => t.spalten.map(c => (c.fmt ? c.fmt(r[c.key]) : r[c.key]))) };
      });
    },
  });
  zeichnen();
})();
