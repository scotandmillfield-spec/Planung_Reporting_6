/* Einzelvisual-Serie „Kontenmodell“ (Abb. 5.25–5.27) – diese Datei ist in allen drei Quellordnern gleich; die
   Startansicht und den Seitentitel liefern die Daten (DATA.start, DATA.titel).
   Seite 727 x 596 px = 110 x 90,2 mm. Daten: kontenmodell.json (daten_kontenmodell.py) – Dimensionstabellen Produkt,
   Kunde, Zeit, zwölf Buchungen auf drei Konten und die Kontendimension mit Parent-Child-Hierarchie (Vorgänger,
   Sortiercode) bzw. ohne (Ebenenspalten mit Sortiercodes), Werte aus den Originalen.
   Schalter „Kontenmodell“: 1 mit Parent-Child-Hierarchie (Abb. 5.25) · 2 ohne Parent-Child-Hierarchie (Abb. 5.26) ·
   3 Hierarchieaufbau ohne Parent-Child-Hierarchie (Abb. 5.27). Gleiches Raster in allen Ansichten: links oben
   Dimensionstabellen (Ansicht 3: Hierarchieaufbau), rechts oben Faktentabelle, unten die Kontendimension; in Ansicht 1
   rechts daneben die Hierarchie, die aus Vorgänger und Sortiercode entsteht. Beträge der Knoten = Summe der Buchungen.
   Klick auf eine Dimensionszeile filtert Faktentabelle und Hierarchie; Klick auf eine Buchung zeigt Dimensionen, Konto
   und Pfad; Klick auf ein Konto oder einen Knoten zeigt Vorgänger, Kinder und Buchungen. Esc hebt auf.
   Spaltenköpfe der Fakten- und der Kontentabelle sortieren. Rot gestrichelt: Wiederholung eines Werts, weil die
   Ebenenspalten eine Zwischenebene verlangen, die es für Skonti nicht gibt. */
(() => {
  "use strict";
  const { zahl, el, sv, tw } = DK;
  const B = 695, EIN = 16, H = 596;
  const PN = new Map(DATA.produkte), KN = new Map(DATA.kunden), JN = new Map(DATA.zeit);
  const F = DATA.fakten.map(([p, k, t, konto, betrag], i) => ({ i, p, k, t, konto, betrag }));
  const PC = DATA.konten_pc.map(([id, name, vg, sc]) => ({ id, name, vg, sc }));
  const EB = DATA.konten_ebenen.map(([id, name, sc3, e2, sc2, e1, sc1]) => ({ id, name, sc3, e2, sc2, e1, sc1 }));
  const KNAME = new Map(PC.map(k => [k.id, k.name]));
  const eur = v => zahl(v);
  const passt = (k, breite = B - 12) => k.find(t => tw(t) <= breite) || k[k.length - 1];
  const und = l => (l.length < 2 ? l.join("") : l.slice(0, -1).join(", ") + " und " + l[l.length - 1]);
  const anz = (n, s, p) => `${n} ${n === 1 ? s : p}`;
  const DIM = { p: ["Produkt", PN], k: ["Kunde", KN], t: ["Jahr", JN] };
  const dimText = (d, id) => (d === "t" ? `Jahr ${id}` : `${DIM[d][0]} ${id} ${DIM[d][1].get(id)}`);

  /* ---------- Hierarchien: aus Vorgänger und Sortiercode bzw. aus den Ebenenspalten ---------- */
  const knoten = (key, label, tiefe, parent, extra) => ({ key, label, tiefe, parent, kinder: [], blaetter: new Set(), ...extra });
  function blaetterSetzen(baum) {
    [...baum.values()].reverse().forEach(n => {
      if (!n.kinder.length) n.blaetter.add(n.id);
      n.kinder.forEach(c => c.blaetter.forEach(b => n.blaetter.add(b)));
    });
  }
  const PCB = new Map();                                       // Vorordnung: Knoten vor Kindern, Kinder nach Sortiercode
  (function () {
    const kinder = new Map();
    PC.forEach(k => { const l = kinder.get(k.vg) || []; l.push(k); kinder.set(k.vg, l); });
    const lauf = (vg, tiefe, parent) => (kinder.get(vg) || []).slice().sort((a, b) => a.sc - b.sc).forEach(k => {
      const n = knoten("pc:" + k.id, k.name, tiefe, parent, { id: k.id, ebene: `Ebene ${tiefe}`, sc: k.sc });
      PCB.set(n.key, n);
      if (parent) parent.kinder.push(n);
      lauf(k.id, tiefe + 1, n);
    });
    lauf(null, 1, null);
    blaetterSetzen(PCB);
  })();
  const EBB = new Map();                                       // sortiert nach Sortiercode 1, 2, 3
  (function () {
    const z = EB.slice().sort((a, b) => a.sc1 - b.sc1 || a.e1.localeCompare(b.e1, "de") || a.sc2 - b.sc2 ||
                                      a.e2.localeCompare(b.e2, "de") || a.sc3 - b.sc3);
    let n1 = null, n2 = null;
    z.forEach(k => {
      if (!n1 || n1.label !== k.e1) {
        n1 = knoten("e1:" + k.e1, k.e1, 1, null, { ebene: "Ebene 1", sc: k.sc1 }); EBB.set(n1.key, n1); n2 = null;
      }
      if (!n2 || n2.label !== k.e2) {
        n2 = knoten("e2:" + k.e1 + "|" + k.e2, k.e2, 2, n1, { ebene: "Ebene 2", sc: k.sc2 }); EBB.set(n2.key, n2); n1.kinder.push(n2);
      }
      const w = knoten("w:" + k.id, k.name, 3, n2, { ebene: "Werte", sc: k.sc3, id: k.id, wdh: k.name === k.e2 });
      EBB.set(w.key, w); n2.kinder.push(w);
    });
    blaetterSetzen(EBB);
  })();
  const pc = () => S.ansicht === 1;
  const baumAkt = () => (pc() ? PCB : EBB);
  const blattKey = konto => (pc() ? "pc:" : "w:") + konto;
  const wurzel = baum => baum.values().next().value;
  const vorfahren = n => { const l = []; for (let x = n; x; x = x.parent) l.push(x); return l; };
  const wert = (n, ff) => ff.reduce((s, f) => s + (n.blaetter.has(f.konto) ? f.betrag : 0), 0);
  const knotenText = n => (pc() ? `${n.label} (${n.id})` : n.tiefe === 3 ? `${n.label} (${n.id})` : `${n.label} (${n.ebene})`);
  const maxTiefe = baum => Math.max(...[...baum.values()].map(n => n.tiefe));

  /* ---------- Zustand ---------- */
  const S = { ansicht: DATA.start, auswahl: null, sortF: null, sortK: null };
  const gleich = (a, b) => a && b && a.typ === b.typ && a.dim === b.dim && a.id === b.id && a.i === b.i && a.key === b.key;
  const waehlen = a => { S.auswahl = gleich(S.auswahl, a) ? null : a; zeichnen(); };
  addEventListener("keydown", e => { if (e.key === "Escape" && S.auswahl) { S.auswahl = null; zeichnen(); } });
  const gefiltert = () => (S.auswahl && S.auswahl.typ === "dim" ? F.filter(f => f[S.auswahl.dim] === S.auswahl.id) : F);

  function hervor() {                                         // null = nichts blass
    const a = S.auswahl, baum = baumAkt(), h = { fakt: null, dim: { p: null, k: null, t: null }, knoten: null, konten: null };
    if (!a) return h;
    if (a.typ === "dim") {
      h.fakt = new Set(F.filter(f => f[a.dim] === a.id).map(f => f.i));
      h.dim[a.dim] = new Set([a.id]);
    } else if (a.typ === "fakt") {
      const f = F[a.i], pfad = vorfahren(baum.get(blattKey(f.konto)));
      h.fakt = new Set([f.i]);
      h.dim = { p: new Set([f.p]), k: new Set([f.k]), t: new Set([f.t]) };
      h.knoten = new Set(pfad.map(x => x.key));
      h.konten = pc() ? new Set(pfad.map(x => x.id)) : new Set([f.konto]);
    } else {
      const n = baum.get(a.key), nah = [n, n.parent, ...n.kinder].filter(Boolean);
      h.knoten = new Set(nah.map(x => x.key));
      h.fakt = new Set(F.filter(f => n.blaetter.has(f.konto)).map(f => f.i));
      h.konten = pc() ? new Set(nah.map(x => x.id)) : new Set(n.blaetter);
    }
    return h;
  }

  /* ---------- Layout ---------- */
  DK.init({ titel: DATA.titel, breite: 727, hoehe: H });
  const bTitel = DK.box("v-titel", 16, 8, B, 46);
  const bFilter = DK.box("filter", 16, 60, B, 50, "dk-filter");
  DK.haarlinie(116);
  const bLinks = DK.box("z-links", 16, 126, 300, 252);
  const bLegende = DK.box("legende", 16, 386, 300, 40);
  const bFakten = DK.box("z-fakten", 16 + B - 365, 126, 365, 302);
  DK.haarlinie(436);
  const bKonten = DK.box("z-konten", 16, 446, B, 142);
  const bBaum = DK.box("z-baum", 16 + B - 270, 446, 270, 142);
  DK.el("style", {}, document.head, `
    .zl { font-weight: bold; height: 20px; line-height: 18px; white-space: nowrap; }
    .kt { border-collapse: collapse; table-layout: fixed; font-size: 14px; }
    .kt th, .kt td { padding: 0 0 0 12px; text-align: left; white-space: nowrap; overflow: hidden; }
    .kt th:first-child, .kt td:first-child { padding-left: 0; }
    .kt th { height: 20px; font-weight: normal; color: var(--muted); vertical-align: bottom; padding-bottom: 2px; }
    .kt thead tr:last-child th { border-bottom: 1px solid var(--ac); }
    .kt td { height: 20px; border-bottom: 1px solid #EFEFEF; font-variant-numeric: tabular-nums; }
    .kt .re { text-align: right; }
    .kt .schl { text-decoration: underline; text-underline-offset: 2px; }
    .kt tbody tr.dk-zeile { cursor: pointer; }
    .kt tbody tr.dk-zeile:hover td { background: var(--flaeche); }
    .kt tr.dk-blass td { opacity: 1; }
    .kt th.dk-sortierbar { cursor: pointer; }
    .kt th.dk-sortierbar:hover { color: var(--text); }
    .kb td { border-bottom: none; }
    .kb .ast { display: flex; align-items: center; height: 20px; }
    .kb .ast svg { flex: 0 0 auto; display: block; }
    .fett { font-weight: bold; }
    .muted { color: var(--muted); }
    .wdh { color: var(--schlecht); text-decoration: underline dashed var(--schlecht); text-decoration-thickness: 1.5px;
      text-underline-offset: 3px; }
    #legende { color: var(--muted); line-height: 20px; }
    #legende .lg { white-space: nowrap; }`);

  /* ---------- lokale Hilfe: Tooltip mit Ereignis ---------- */
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

  /* ---------- lokale Hilfe: Tabelle ----------
     o.spalten: [{titel, breite, re, schl, id, sort}] · o.gruppe: [[titel, span, re, schl]] · o.zeilen: [{zellen: [text |
     {text, cls, id, knoten}], blass, cls, klick, tip}] · o.sort: {key, ab} · o.onSort(key) */
  function tabelle(ziel, o) {
    const t = el("table", { class: "kt " + (o.klasse || ""), id: o.id || "" }, ziel);
    const cg = el("colgroup", {}, t);
    o.spalten.forEach(s => el("col", { style: `width:${s.breite}px` }, cg));
    t.style.width = o.spalten.reduce((a, s) => a + s.breite, 0) + "px";
    const th = el("thead", {}, t);
    if (o.gruppe) {
      const r = el("tr", {}, th);
      o.gruppe.forEach(([titel, span, re, schl]) => el("th", { colspan: span, class: (re ? "re" : "") }, r).appendChild(
        schl ? el("span", { class: "schl" }, null, titel) : document.createTextNode(titel)));
    }
    const kr = el("tr", {}, th);
    o.spalten.forEach(s => {
      const c = el("th", { class: s.re ? "re" : "", ...(s.id ? { id: s.id } : {}) }, kr);
      if (s.schl) el("span", { class: "schl" }, c, s.titel); else c.appendChild(document.createTextNode(s.titel));
      if (s.sort && o.onSort && !DK.PRINT) {
        c.classList.add("dk-sortierbar"); c.title = "Klick sortiert";
        c.addEventListener("click", () => o.onSort(s.sort));
        if (o.sort && o.sort.key === s.sort) c.appendChild(document.createTextNode(o.sort.ab ? " ▾" : " ▴"));
      }
    });
    const tb = el("tbody", {}, t);
    o.zeilen.forEach(z => {
      const tr = el("tr", { class: "dk-zeile" + (z.blass ? " dk-blass" : "") + (z.cls ? " " + z.cls : "") }, tb);
      z.zellen.forEach((c, j) => {
        const x = typeof c === "object" && c !== null ? c : { text: c };
        const td = el("td", { class: (o.spalten[j].re ? "re " : "") + (x.cls || ""), ...(x.id ? { id: x.id } : {}) }, tr);
        if (x.knoten) td.appendChild(x.knoten); else td.textContent = x.text;
      });
      if (z.klick) tr.addEventListener("click", z.klick);
      if (z.tip) tooltip(tr, z.tip);
    });
    return t;
  }
  const sortiert = (liste, s, wertFn) => {
    if (!s) return liste;
    return liste.slice().sort((a, b) => {
      const x = wertFn(a, s.key), y = wertFn(b, s.key);
      let c = typeof x === "number" && typeof y === "number" ? x - y : String(x ?? "").localeCompare(String(y ?? ""), "de");
      return (s.ab ? -c : c) || 0;
    });
  };
  const sortWechsel = (alt, key) => (alt && alt.key === key ? { key, ab: !alt.ab } : { key, ab: false });

  /* ---------- Baumzeile mit Verbindungslinien ---------- */
  function ast(n, text, cls, id) {
    const box = el("div", { class: "ast" });
    if (n.tiefe > 1) {
      const letzt = [];
      for (let x = n; x.parent; x = x.parent) letzt.unshift(x.parent.kinder[x.parent.kinder.length - 1] === x);
      const w = (n.tiefe - 1) * EIN + 2, svg = sv("svg", { width: w, height: 20, "aria-hidden": "true" }, box);
      const linie = (x1, y1, x2, y2) => sv("line", { x1, y1, x2, y2, stroke: "#8C8C8C", "stroke-width": 1 }, svg);
      for (let j = 0; j < n.tiefe - 2; j++) if (!letzt[j]) linie(j * EIN + 6.5, 0, j * EIN + 6.5, 20);
      const x = (n.tiefe - 2) * EIN + 6.5;
      linie(x, 0, x, letzt[n.tiefe - 2] ? 10.5 : 20);
      linie(x, 10.5, w - 1, 10.5);
    }
    el("span", { class: cls || "", style: n.tiefe > 1 ? "padding-left:4px" : "", ...(id ? { id } : {}) }, box, text);
    return box;
  }

  /* ---------- Bausteine ---------- */
  function dimensionen(h) {
    el("div", { class: "zl" }, bLinks, "Dimensionstabellen");
    [["p", "Produkt-ID", "Produkt-Bez.", DATA.produkte], ["k", "Kunde-ID", "Kunde-Bez.", DATA.kunden], ["t", "Zeit-ID", "Jahr", DATA.zeit]]
      .forEach(([d, idT, bezT, liste], i) => {
        const w = el("div", { style: i ? "margin-top:12px" : "" }, bLinks);
        tabelle(w, {
          id: "t-dim-" + d,
          spalten: [{ titel: idT, breite: 100, schl: true, id: i === 0 ? "sp-schluessel" : undefined }, { titel: bezT, breite: 120 }],
          zeilen: liste.map(([id, bez]) => {
            const ff = F.filter(f => f[d] === id);
            return {
              zellen: [String(id), String(bez)], blass: h.dim[d] && !h.dim[d].has(id),
              klick: () => waehlen({ typ: "dim", dim: d, id }),
              tip: () => [dimText(d, id), `${anz(ff.length, "Buchung", "Buchungen")} · ${wurzel(baumAkt()).label} ${eur(wert(wurzel(baumAkt()), ff))} €`,
                `Schlüssel ${id} steht in der Faktentabelle in der Spalte ${d === "t" ? "Zeit" : DIM[d][0]}`,
                "Klick filtert Faktentabelle und Hierarchie, Esc hebt auf"],
            };
          }),
        });
      });
  }

  const FSP = [["p", "Produkt", 70], ["k", "Kunde", 70], ["t", "Zeit", 70], ["konto", "Konten", 75], ["betrag", "Betrag", 80]];
  function faktentabelle(h) {
    bFakten.textContent = "";
    el("div", { class: "zl" }, bFakten, "Faktentabelle");
    const baum = baumAkt();
    tabelle(bFakten, {
      id: "t-fakten",
      gruppe: [["Dim.-ID", 4, false, true], ["Kennzahl", 1, true]],
      spalten: FSP.map(([key, titel, breite]) => ({ titel, breite, sort: key, re: key === "betrag", id: key === "betrag" ? "sp-betrag" : undefined })),
      sort: S.sortF, onSort: key => { S.sortF = sortWechsel(S.sortF, key); zeichnen(); },
      zeilen: sortiert(F, S.sortF, (f, key) => f[key]).map(f => ({
        zellen: [String(f.p), String(f.k), String(f.t), String(f.konto), eur(f.betrag)],
        blass: h.fakt && !h.fakt.has(f.i),
        klick: () => waehlen({ typ: "fakt", i: f.i }),
        tip: () => {
          const pfad = vorfahren(baum.get(blattKey(f.konto))).reverse().map(x => x.label);
          return [`Buchung ${f.i + 1} von ${F.length}`, `Produkt ${f.p} ${PN.get(f.p)} · Kunde ${f.k} ${KN.get(f.k)} · Jahr ${f.t}`,
            `Konto ${f.konto} ${KNAME.get(f.konto)}: ${eur(f.betrag)} €`, `Pfad: ${pfad.join(" › ")}`,
            "Klick zeigt Dimensionen, Konto und Pfad, Esc hebt auf"];
        },
      })),
    });
  }

  function kontenPC(h) {
    el("div", { class: "zl" }, bKonten, "Kontendimension mit Parent-Child-Hierarchie");
    const sp = [["id", "Konten-ID", 85], ["name", "Werte", 140], ["vg", "Vorgänger", 85], ["sc", "Sortiercode", 85]];
    tabelle(bKonten, {
      id: "t-konten",
      spalten: sp.map(([key, titel, breite]) => ({ titel, breite, sort: key, schl: key === "id", re: key === "sc", id: "sp-k-" + key })),
      sort: S.sortK, onSort: key => { S.sortK = sortWechsel(S.sortK, key); zeichnen(); },
      zeilen: sortiert(PC, S.sortK, (k, key) => k[key]).map(k => {
        const n = PCB.get("pc:" + k.id), v = wert(n, gefiltert()), nb = F.filter(f => f.konto === k.id).length;
        return {
          zellen: [String(k.id), k.name, k.vg == null ? { text: "NULL", cls: "muted" } : String(k.vg), String(k.sc)],
          blass: h.konten && !h.konten.has(k.id),
          klick: () => waehlen({ typ: "knoten", key: n.key }),
          tip: () => [`Konto ${k.id} · ${k.name}`,
            k.vg == null ? "Vorgänger NULL: oberster Knoten der Hierarchie" : `Vorgänger ${k.vg} ${KNAME.get(k.vg)}`,
            n.kinder.length ? `Kinder: ${und(n.kinder.map(c => `${c.id} ${c.label}`))} – ohne eigene Buchungen` : `ohne Kinder: bebuchtes Konto mit ${anz(nb, "Buchung", "Buchungen")}`,
            `Sortiercode ${k.sc}: Stelle in der Hierarchie, Ebene ${n.tiefe}`, `Betrag ${eur(v)} €`,
            "Klick hebt Vorgänger, Kinder und Buchungen hervor, Esc hebt auf"],
        };
      }),
    });
  }

  function kontenEbenen(h) {
    el("div", { class: "zl" }, bKonten, "Kontendimension ohne Parent-Child-Hierarchie");
    const sp = [["id", "Konten-ID", 80], ["name", "Werte", 98], ["sc3", "Sortiercode 3", 95], ["e2", "Ebene 2", 100],
                ["sc2", "Sortiercode 2", 95], ["e1", "Ebene 1", 132], ["sc1", "Sortiercode 1", 95]];
    let markiert = false;
    tabelle(bKonten, {
      id: "t-konten",
      spalten: sp.map(([key, titel, breite]) => ({ titel, breite, sort: key, schl: key === "id", re: key.startsWith("sc"), id: "sp-k-" + key })),
      sort: S.sortK, onSort: key => { S.sortK = sortWechsel(S.sortK, key); zeichnen(); },
      zeilen: sortiert(EB, S.sortK, (k, key) => k[key]).map(k => {
        const n = EBB.get("w:" + k.id), v = wert(n, gefiltert()), nb = F.filter(f => f.konto === k.id).length;
        const wdh = k.e2 === k.name;
        const e2 = wdh ? { knoten: el("span", { class: "wdh", ...(markiert ? {} : { id: "m-wdh" }) }, null, k.e2) } : k.e2;
        if (wdh) markiert = true;
        return {
          zellen: [String(k.id), k.name, String(k.sc3), e2, String(k.sc2), k.e1, String(k.sc1)],
          blass: h.konten && !h.konten.has(k.id),
          klick: () => waehlen({ typ: "knoten", key: n.key }),
          tip: () => [`Konto ${k.id} · ${k.name}`, `Ebene 1 ${k.e1} › Ebene 2 ${k.e2} › Werte ${k.name}`,
            `Sortiercodes ${k.sc1} · ${k.sc2} · ${k.sc3}: Reihenfolge je Ebene`,
            wdh ? `Ebene 2 wiederholt „${k.name}“: das Konto hat keine Zwischenebene, die Spalte muss trotzdem gefüllt sein` : null,
            `${anz(nb, "Buchung", "Buchungen")}, Betrag ${eur(v)} €`, "Klick hebt die Buchungen des Kontos hervor, Esc hebt auf"].filter(Boolean),
        };
      }),
    });
  }

  function hierarchie(ziel, h, o) {
    el("div", { class: "zl" }, ziel, o.titel);
    const baum = o.baum, ff = gefiltert();
    const spalten = (o.mitEbene ? [{ titel: "Ebene", breite: 75 }] : []).concat([{ titel: "Element", breite: o.breiteElement }, { titel: "Betrag", breite: o.breiteBetrag, re: true }]);
    let markiert = false;
    tabelle(ziel, {
      id: o.id, klasse: "kb", spalten,
      zeilen: [...baum.values()].map(n => {
        const v = wert(n, ff), cls = n.wdh ? "wdh" : n.kinder.length ? "fett" : "";
        const id = n.wdh && !markiert ? "m-wdh" : undefined;
        if (id) markiert = true;
        const zellen = [{ knoten: ast(n, n.label, cls, id) }, { text: eur(v), cls: n.kinder.length ? "fett" : "" }];
        if (o.mitEbene) zellen.unshift(n.ebene);
        return {
          zellen, blass: h.knoten && !h.knoten.has(n.key),
          klick: () => waehlen({ typ: "knoten", key: n.key }),
          tip: () => {
            const z = [`${n.label} · ${n.ebene}${n.id != null ? ` · Konto ${n.id}` : ""}`];
            if (n.kinder.length) z.push(`${eur(v)} € = ${n.kinder.map(c => `${c.label} ${eur(wert(c, ff))} €`).join(" + ")}`);
            else z.push(`${eur(v)} € aus ${anz(ff.filter(f => f.konto === n.id).length, "Buchung", "Buchungen")}`);
            if (n.parent) z.push(pc() ? `Vorgänger: ${n.parent.id} ${n.parent.label}` : `darüber: ${n.parent.label} (${n.parent.ebene})`);
            if (n.wdh) z.push(`Wiederholung: ${n.label} steht schon als ${n.parent.ebene} darüber, weil eine Zwischenebene fehlt`);
            if (n.kinder.length === 1 && n.kinder[0].wdh) z.push("Füllknoten: nur ein Wert mit demselben Namen darunter");
            z.push("Klick hebt den Knoten, darüber und darunter hervor, Esc hebt auf");
            return z;
          },
        };
      }),
    });
  }

  /* ---------- Titel, Botschaft, Legende ---------- */
  const TITEL = ["Kontenmodell mit Parent-Child-Hierarchie", "Kontenmodell ohne Parent-Child-Hierarchie",
                 "Hierarchieaufbau ohne Parent-Child-Hierarchie"];
  function botschaft() {
    const a = S.auswahl, baum = baumAkt(), w = wurzel(baum), s = S.ansicht;
    if (a && a.typ === "dim") {
      const ff = F.filter(f => f[a.dim] === a.id);
      return passt([`${dimText(a.dim, a.id)}: ${anz(ff.length, "Buchung", "Buchungen")} ergeben ${eur(wert(w, ff))} € ${w.label}`]);
    }
    if (a && a.typ === "fakt") {
      const f = F[a.i], n = baum.get(blattKey(f.konto)), pfad = vorfahren(n).slice(1);
      const weg = pfad.length > 1 ? `über ${pfad.slice(0, -1).map(knotenText).join(" und ")} in den ${w.label}` : `direkt in den ${w.label}`;
      return passt([`Buchung ${f.p} ${PN.get(f.p)} · ${f.k} ${KN.get(f.k)} · ${f.t}: ${eur(f.betrag)} € auf ${f.konto} ${n.label}, fließt ${weg}`,
        `${eur(f.betrag)} € auf Konto ${f.konto} ${n.label} – fließt ${weg}`]);
    }
    if (a && a.typ === "knoten") {
      const n = baum.get(a.key), v = wert(n, F);
      if (n.kinder.length > 1)
        return passt([`${knotenText(n)}: ${und(n.kinder.map(c => `${c.label} ${eur(wert(c, F))} €`))} ergeben ${eur(v)} €`]);
      if (n.kinder.length === 1) {
        const c = n.kinder[0];
        return passt([`${knotenText(n)}: nur ${c.label} (${c.ebene}) darunter, ${eur(wert(c, F))} €${c.wdh ? " – derselbe Name eine Ebene tiefer" : ""}`]);
      }
      const nb = F.filter(f => f.konto === n.id).length;
      const oben = n.parent ? `${pc() ? "Vorgänger" : "darüber"} ${knotenText(n.parent)}` : "oberster Knoten";
      return passt([`${knotenText(n)}: ${eur(v)} € aus ${anz(nb, "Buchung", "Buchungen")}, ${oben}${n.wdh ? " – Wiederholung ohne Zwischenebene" : ""}`,
        `${knotenText(n)}: ${eur(v)} € aus ${anz(nb, "Buchung", "Buchungen")}, ${oben}`]);
    }
    if (s === 1) {
      const t = maxTiefe(PCB), kurz = [...PCB.values()].filter(n => !n.kinder.length && n.tiefe < t);
      const k = und(kurz.map(n => `${n.label} (${n.id})`)), am = kurz.length ? kurz[0].parent.label : "";
      return passt([`Vorgänger verknüpft ${PC.length} Konten zu ${t} Ebenen – ${k} hängt ohne Zwischenebene am ${am}`,
        `${PC.length} Konten in ${t} Ebenen: ${k} hängt ohne Zwischenebene am ${am}`]);
    }
    const wdh = EB.filter(k => k.e2 === k.name);
    if (s === 2) {
      const k = und(wdh.map(x => `${x.name} (${x.id})`));
      return passt([`Jede Zeile füllt alle Ebenen: ${k} hat keine Zwischenebene, Ebene 2 wiederholt den Wert`,
        `${k} hat keine Zwischenebene – Ebene 2 wiederholt den Wert „${wdh.map(x => x.name).join("“, „")}“`]);
    }
    const l = [...EBB.values()].filter(n => n.wdh);
    const k = und(l.map(n => n.label)), v = l.length === 1 ? `, beide mit ${eur(wert(l[0], F))} €` : "";
    return passt([`Feste Ebenen: ${k} steht zweimal untereinander – als Ebene 2 und als Wert${v}`,
      `${k} steht zweimal – als Ebene 2 und als Wert${v}`]);
  }
  function legende() {
    bLegende.textContent = "";
    const z1 = el("div", {}, bLegende);
    const s1 = el("span", { class: "lg" }, z1);
    el("span", { style: "text-decoration:underline;text-underline-offset:2px;color:var(--text)" }, s1, "unterstrichen");
    s1.appendChild(document.createTextNode(": Schlüssel"));
    if (S.ansicht !== 2) {
      z1.appendChild(document.createTextNode("   ·   "));
      const s2 = el("span", { class: "lg" }, z1);
      el("span", { class: "fett", style: "color:var(--text)" }, s2, "fett");
      s2.appendChild(document.createTextNode(": Summe darunter"));
    }
    if (S.ansicht !== 1) {
      const s3 = el("div", { class: "lg" }, bLegende);
      el("span", { class: "wdh" }, s3, "Skonti");
      s3.appendChild(document.createTextNode(": Wiederholung ohne Zwischenebene"));
    }
  }

  /* ---------- Zeichnen ---------- */
  DK.schnitt(bFilter, "Kontenmodell", "knoepfe", {
    optionen: [[1, "mit Parent-Child-Hierarchie"], [2, "ohne Parent-Child-Hierarchie"], [3, "Hierarchieaufbau ohne Parent-Child"]],
    wert: S.ansicht,
    onChange: v => {
      if (v === S.ansicht) return;
      S.ansicht = v; S.sortK = null;
      if (S.auswahl && S.auswahl.typ === "knoten") S.auswahl = null;
      zeichnen();
    } });
  function zeichnen() {
    const s = S.ansicht, h = hervor();
    DK.visual(bTitel, { titel: TITEL[s - 1], einheit: "Betrag in €", botschaft: botschaft() });
    bLinks.textContent = ""; bKonten.textContent = ""; bBaum.textContent = "";
    bKonten.style.width = (s === 1 ? 395 : B) + "px";
    if (s === 3) hierarchie(bLinks, h, { titel: "Hierarchieaufbau", baum: EBB, id: "t-hierarchie", mitEbene: true, breiteElement: 150, breiteBetrag: 75 });
    else dimensionen(h);
    faktentabelle(h);
    if (s === 1) {
      kontenPC(h);
      hierarchie(bBaum, h, { titel: "Daraus entstehende Hierarchie", baum: PCB, id: "t-baum", breiteElement: 190, breiteBetrag: 80 });
    } else kontenEbenen(h);
    legende();
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  /* ---------- Lernplattform: Designregeln, Nachbau, Tabellen, CSV ---------- */
  const R_SAY = t => ({ nr: 1, ziel: "v-titel", versatz: [0, 0], regel: "SAY – Botschaft vermitteln", titel: "Aussage zur Ansicht", text: t });
  const R_STRUCTURE = { nr: 2, ziel: "filter", versatz: [0, 0], regel: "STRUCTURE – Inhalte ordnen", titel: "Ein Kontenplan, drei Ansichten",
    text: "Die Abbildungen 5.25 bis 5.27 zeigen dieselben Konten, dieselben zwölf Buchungen und dasselbe Raster: links oben die Dimensionstabellen, rechts die Faktentabelle, unten die Kontendimension. Der Schalter wechselt zwischen den Ansichten; jede Abbildung startet in ihrer. Im Original hieß Konto 8050 in Abb. 5.25 „Rabatt“, sonst „Rabatte“ – vereinheitlicht." };
  const R_UNIFY = { nr: 4, ziel: "sp-k-id", versatz: [8, 0], regel: "UNIFY – Semantische Notation", titel: "Schlüssel unterstrichen, Summen fett",
    text: "Wie im Original sind Schlüsselspalten unterstrichen: Produkt-, Kunde-, Zeit- und Konten-ID; die Dim.-ID-Spalten der Faktentabelle verweisen auf sie. Knoten, die Konten darunter summieren, stehen fett – wie Summenzeilen in den Berichten des Buchs. Rot ist der Wiederholung vorbehalten, die die Ebenenspalten erzwingen." };
  const R_CHECK = { nr: 5, ziel: "z-fakten", versatz: [0, 0], regel: "CHECK – Visuelle Integrität", titel: "Beträge nachrechenbar",
    text: "Jeder Knoten zeigt die Summe der Buchungen seiner Konten: 4.000 € Bruttoumsatz, −210 € Rabatte und −76 € Skonti ergeben 3.714 € NettoNetto-Umsatz – dieselben Werte wie im Kennzahlenmodell (Abb. 5.23). Ein Klick auf einen Knoten hebt seine Buchungen hervor, die Aussage rechnet die Summe vor." };
  const R_SIMPLIFY = { nr: 6, ziel: "sp-betrag", anker: "links", versatz: [30, 0], regel: "SIMPLIFY – Einheitliche Zahlen", titel: "Zahlenformat, kein Gitter",
    text: "Beträge mit Tausenderpunkt und echtem Minus (−100 statt -100) rechtsbündig, Schlüssel linksbündig, die Einheit einmal im Titel. Gitternetz und Rahmen des Tabellenblatts entfallen; Haarlinien trennen die Zeilen, eine dunkle Linie den Kopf." };
  const R_CONDENSE = { nr: 7, ziel: "legende", versatz: [0, -18], regel: "CONDENSE – Details im Tooltip", titel: "Zusammenhänge per Klick",
    text: "Der Tooltip einer Buchung nennt Produkt, Kunde, Jahr und den Pfad bis zum NettoNetto-Umsatz, der eines Kontos Vorgänger, Kinder und Buchungen. Ein Klick auf eine Dimensionszeile filtert Faktentabelle und Hierarchie – so lässt sich etwa der NettoNetto-Umsatz des Produkts Ring ablesen." };
  const REGELN = {
    1: [R_SAY("Unter dem Titel steht, was die Kontendimension leistet: Die Spalte Vorgänger verknüpft fünf Konten zu drei Ebenen, Skonti hängt ohne Zwischenebene direkt am NettoNetto-Umsatz – aus der Tabelle berechnet. Das Original zeigte nur Tabellen ohne Aussage."),
      R_STRUCTURE,
      { nr: 3, ziel: "z-baum", versatz: [0, 0], regel: "EXPRESS – Struktur zeigen", titel: "Hierarchie neben der Tabelle",
        text: "Rechts steht die Hierarchie, die aus Vorgänger und Sortiercode entsteht – mit Verbindungslinien und den Beträgen aus der Faktentabelle. Sie zeigt, was die Parent-Child-Tabelle leistet: Skonti sitzt auf Ebene 2, Rabatte und Bruttoumsatz auf Ebene 3, ohne Füllknoten. Das Original überließ es dem Leser, die Verweise zu verfolgen." },
      R_UNIFY, R_CHECK, R_SIMPLIFY,
      { ...R_CONDENSE, text: R_CONDENSE.text + " „NULL“ bleibt als Kennzeichen des obersten Knotens stehen." }],
    2: [R_SAY("Unter dem Titel steht der Haken der Ebenenspalten: Jede Zeile muss alle Ebenen füllen; Skonti hat keine Zwischenebene, deshalb wiederholt Ebene 2 den Wert – aus der Tabelle ermittelt. Das Original zeigte die Tabelle ohne Aussage."),
      R_STRUCTURE,
      { nr: 3, ziel: "m-wdh", versatz: [26, 0], regel: "EXPRESS – Hervorheben", titel: "Wiederholung markiert",
        text: "Der Wert „Skonti“ in Ebene 2 ist rot gestrichelt unterstrichen: Er wiederholt das Konto selbst, weil die Spalte gefüllt sein muss. Die Strichlinie trägt die Bedeutung auch im Schwarzweißdruck. Das Original markierte nichts; die Folge zeigt erst der Hierarchieaufbau (Abb. 5.27)." },
      { ...R_UNIFY, text: "Wie im Original sind Schlüsselspalten unterstrichen: Produkt-, Kunde-, Zeit- und Konten-ID; die Dim.-ID-Spalten der Faktentabelle verweisen auf sie. Werte und Ebenen stehen links, die Sortiercodes rechtsbündig rechts daneben – je Ebene ein Paar aus Name und Sortiercode. Rot ist der Wiederholung vorbehalten." },
      R_CHECK, R_SIMPLIFY, R_CONDENSE],
    3: [R_SAY("Unter dem Titel steht die Folge der festen Ebenen: Skonti steht zweimal untereinander, als Ebene 2 und als Wert, beide mit −76 € – aus dem Hierarchieaufbau berechnet. Das Original zeigte nur die Tabelle mit einer gelben Zeile."),
      R_STRUCTURE,
      { nr: 3, ziel: "m-wdh", versatz: [26, 0], regel: "EXPRESS – Hervorheben", titel: "Rot gestrichelt statt gelb",
        text: "Die Wiederholung „Skonti“ unter dem gleichnamigen Knoten der Ebene 2 ist rot gestrichelt unterstrichen, wie in der Kontendimension darunter. Das Original hatte die Zeile gelb hinterlegt; Gelb verschwindet im Schwarzweißdruck und hat im Buch keine Bedeutung." },
      { nr: 4, ziel: "z-links", versatz: [0, 0], regel: "UNIFY – Semantische Notation", titel: "Gleiche Baumdarstellung",
        text: "Ebene 1, Ebene 2 und Werte stehen wie im Original untereinander, sortiert nach Sortiercode 1 bis 3 – eingerückt, mit Verbindungslinien und fetten Summen wie die Hierarchie der Ansicht mit Parent-Child-Hierarchie. Neu sind die Beträge: Sie zeigen, dass der Füllknoten Skonti nichts verdichtet – er hat genau einen Wert mit demselben Betrag." },
      R_CHECK, R_SIMPLIFY, R_CONDENSE],
  };
  const N_MODELL = { id: "A", ziel: "z-fakten", versatz: [0, 0], titel: "Datenmodell und Faktentabelle", visual: "Tabelle",
    felder: "Buchungen[Produkt], Buchungen[Kunde], Buchungen[Zeit], Buchungen[Konten], Measure Betrag = SUM(Buchungen[Betrag])",
    format: "Schrift 10,5 pt; Kopf mit Unterstrich #3A3F44, Zeilenraster #EFEFEF; Betrag Format #.##0 mit Minuszeichen",
    hinweis: "Modellansicht: Sternschema – Buchungen mit 1:n-Beziehungen zu Produkt, Kunde, Zeit und Konten (Kreuzfilter einfach)." };
  const N_DIM = { id: "B", ziel: "z-links", versatz: [0, 0], titel: "Dimensionstabellen", visual: "drei Tabellen",
    felder: "Produkt[Produkt-ID], Produkt[Produkt-Bez.]; Kunde[Kunde-ID], Kunde[Kunde-Bez.]; Zeit[Zeit-ID], Zeit[Jahr]",
    format: "wie A; den Schlüssel kennzeichnet in Power BI die Beziehung in der Modellansicht – eine Unterstreichung einzelner Spaltenköpfe gibt es nicht",
    hinweis: "Format → Interaktionen bearbeiten: Klick auf eine Zeile filtert Faktentabelle und Hierarchie." };
  const N_SCHALTER = { id: "E", ziel: "filter", versatz: [0, 0], titel: "Ansicht", visual: "Lesezeichen-Navigator",
    felder: "drei Lesezeichen (mit, ohne Parent-Child-Hierarchie, Hierarchieaufbau), die Tabellen ein- und ausblenden",
    format: "ausgewählt #3A3F44 mit weißer Schrift, sonst weiß mit Rahmen #9A9A9A" };
  const N_AUSSAGE = { id: "F", ziel: "v-titel", versatz: [0, 0], titel: "Aussage", visual: "Textfeld mit dynamischem Wert",
    felder: "Text-Measure, z. B. \"Vorgänger verknüpft \" & COUNTROWS(Konten) & \" Konten zu \" & MAX(Konten[Tiefe]) & \" Ebenen\"",
    format: "10,5 pt, #4D4D4D" };
  const N_HIER = (ziel, mitEbene) => ({ id: "D", ziel, versatz: [0, 0], titel: mitEbene ? "Hierarchieaufbau" : "Hierarchie", visual: "Matrix",
    felder: "Zeilen: Konten[Ebene 1], Konten[Ebene 2], Konten[Werte] als Hierarchie; Werte: Measure Betrag",
    format: "Stufenlayout an, Einzug 16 px, alle Ebenen erweitert; Zwischensummen fett; Zeilenüberschriften 10,5 pt",
    hinweis: mitEbene
      ? "Power BI zeigt die Wiederholung „Skonti“ genauso. Ausblenden: Measure Betrag (ohne Wiederholung) = IF(MAX(Konten[Tiefe]) < ISINSCOPE(Konten[Ebene 1]) + ISINSCOPE(Konten[Ebene 2]) + ISINSCOPE(Konten[Werte]); BLANK(); [Betrag]) – setzt eine Spalte Tiefe voraus, die nur die Parent-Child-Tabelle liefert."
      : "Verbindungslinien gibt es in der Matrix nicht, das Stufenlayout rückt ein. Die Wiederholung von Skonti, die PATHITEM erzeugt, blendet ein Measure aus: IF(MAX(Konten[Tiefe]) < ISINSCOPE(Konten[Ebene 1]) + ISINSCOPE(Konten[Ebene 2]) + ISINSCOPE(Konten[Werte]); BLANK(); [Betrag])." });
  const NACHBAU = {
    1: [N_MODELL, N_DIM,
      { id: "C", ziel: "z-konten", versatz: [0, 0], titel: "Kontendimension mit Parent-Child-Hierarchie", visual: "Tabelle",
        felder: "Konten[Konten-ID], Konten[Werte], Konten[Vorgänger], Konten[Sortiercode]; berechnete Spalten: Pfad = PATH(Konten[Konten-ID]; Konten[Vorgänger]), Tiefe = PATHLENGTH(Konten[Pfad]), Ebene 1 = LOOKUPVALUE(Konten[Werte]; Konten[Konten-ID]; PATHITEM(Konten[Pfad]; 1; INTEGER)), Ebene 2 und Werte analog mit 2 und 3 (fehlt die Ebene, den Wert der Ebene darüber einsetzen)",
        format: "wie A; Vorgänger leer (BLANK) beim obersten Knoten, angezeigt als „NULL“",
        hinweis: "Power BI kennt keine Parent-Child-Dimension: PATH und PATHITEM flachen sie zu Ebenenspalten ab – genau zur Kontendimension ohne Parent-Child-Hierarchie (Abb. 5.26)." },
      N_HIER("z-baum", false), N_SCHALTER, N_AUSSAGE],
    2: [N_MODELL, N_DIM,
      { id: "C", ziel: "z-konten", versatz: [0, 0], titel: "Kontendimension ohne Parent-Child-Hierarchie", visual: "Tabelle",
        felder: "Konten[Konten-ID], Konten[Werte], Konten[Sortiercode 3], Konten[Ebene 2], Konten[Sortiercode 2], Konten[Ebene 1], Konten[Sortiercode 1]",
        format: "wie A; bedingte Formatierung der Spalte Ebene 2: Schriftfarbe #C62828, wenn Konten[Ebene 2] = Konten[Werte]",
        hinweis: "Spaltentools → Nach Spalte sortieren: Werte nach Sortiercode 3, Ebene 2 nach Sortiercode 2, Ebene 1 nach Sortiercode 1 – dafür sind die Sortiercodes da. Gestrichelte Unterstreichung gibt es nicht; die Farbe allein trägt im Graudruck nicht, deshalb zusätzlich ein Symbol über ein Measure." },
      N_SCHALTER, N_AUSSAGE],
    3: [N_MODELL,
      N_HIER("z-links", true),
      { id: "C", ziel: "z-konten", versatz: [0, 0], titel: "Kontendimension ohne Parent-Child-Hierarchie", visual: "Tabelle",
        felder: "wie in der Ansicht ohne Parent-Child-Hierarchie", format: "wie A" },
      N_SCHALTER, N_AUSSAGE],
  };
  DK.ebenen({
    get regeln() { return REGELN[S.ansicht]; },
    get nachbau() { return NACHBAU[S.ansicht]; },
    nachbauIntro: "Standard-Visuals von Power BI Desktop. Seitengröße benutzerdefiniert 727 × 596 px. Schrift Arial: Tabellen 10,5 pt, Visualtitel 12 pt. Datenmodell: Faktentabelle Buchungen (zwölf Zeilen wie in der CSV-Datei) mit den Dimensionen Produkt, Kunde, Zeit und Konten.",
    theme: DK.thema(),
    csv: { name: "kontenmodell_daten.csv", text: () => DATA.csv },
    tabellen: () => {
      const ff = gefiltert(), s = S.ansicht;
      const dims = { titel: "Dimensionstabellen", kopf: ["Dimension", "ID", "Bezeichnung"],
        zeilen: [...DATA.produkte.map(([i, b]) => ["Produkt", String(i), b]), ...DATA.kunden.map(([i, b]) => ["Kunde", String(i), b]),
                 ...DATA.zeit.map(([i, b]) => ["Zeit", String(i), String(b)])] };
      const fak = { titel: "Faktentabelle (Betrag in €)", kopf: ["Produkt", "Kunde", "Zeit", "Konten", "Betrag"],
        zeilen: sortiert(F, S.sortF, (f, key) => f[key]).map(f => [String(f.p), String(f.k), String(f.t), String(f.konto), eur(f.betrag)]) };
      const kon = s === 1
        ? { titel: "Kontendimension mit Parent-Child-Hierarchie", kopf: ["Konten-ID", "Werte", "Vorgänger", "Sortiercode"],
            zeilen: PC.map(k => [String(k.id), k.name, k.vg == null ? "NULL" : String(k.vg), String(k.sc)]) }
        : { titel: "Kontendimension ohne Parent-Child-Hierarchie", kopf: ["Konten-ID", "Werte", "Sortiercode 3", "Ebene 2", "Sortiercode 2", "Ebene 1", "Sortiercode 1"],
            zeilen: EB.map(k => [String(k.id), k.name, String(k.sc3), k.e2, String(k.sc2), k.e1, String(k.sc1)]) };
      const baum = baumAkt();
      const hie = { titel: `${s === 1 ? "Hierarchie aus Vorgänger und Sortiercode" : "Hierarchieaufbau aus den Ebenenspalten"} (Betrag in €${S.auswahl && S.auswahl.typ === "dim" ? ", " + dimText(S.auswahl.dim, S.auswahl.id) : ""})`,
        kopf: ["Ebene", "Element", "Konto", "Betrag", "Buchungen"],
        zeilen: [...baum.values()].map(n => [n.ebene, n.label, n.id != null ? String(n.id) : "–", eur(wert(n, ff)),
          String(ff.filter(f => n.blaetter.has(f.konto)).length)]) };
      return [dims, fak, kon, hie];
    },
  });
  zeichnen();
})();
