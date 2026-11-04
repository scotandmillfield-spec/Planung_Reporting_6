/* Abb. 4.20 – Web-Bericht „Scorecard“ eines Führungsinformationssystems (softwareneutraler Nachbau).
   Seite 1024 x 646 px. Daten: scorecard.json (daten_scorecard.py).
   Aufbau wie im Original: rechts die Scorecard der gewählten Perspektive (strategisches Ziel, Messgröße, Ist, Budget,
   Plan der Folgejahre) und darunter Risiken mit Ausmaß, Beurteilung, Maßnahme und Verantwortlichem; links die Kennzahlen
   aus Bilanz und GuV. Umbau: Kreisdiagramm aus nicht zusammengehörigen Kennzahlen → Ergebnisbrücke bis zum EBT;
   „Realisierung“ → Abweichung zum Budget nach Wirkung; Punkte der Beurteilung → Balken 1–5.
   Datenschnitte: Perspektive (wie die Auswahlliste des Originals) und Mindestbeurteilung der Risiken (Original „3“).
   Klick auf eine Zeile oder einen Balken hebt hervor, Klick auf einen Spaltenkopf der Risiken sortiert, Esc hebt auf. */
(() => {
  "use strict";
  const { zahl, delta, wirkung, FARBE, NBSP, sv, el, tw } = DK;
  const D = DATA, P = D.perspektiven;
  const M = D.messgroessen.map(([p, ziel, name, einheit, nk, richtung, ist, bu, p1, p2], i) => ({ i, p, ziel, name, einheit, nk, richtung, ist, bu, p1, p2,
    dbu: (ist / bu - 1) * 100 }));
  const RI = D.risiken.map(([p, name, ausmass, note, massnahme, wer], i) => ({ i, p, name, ausmass, note, massnahme, wer }));
  const KZ = D.kennzahlen.map(([gruppe, name, wert, vj, nk, def], i) => ({ i, gruppe, name, wert, vj, nk, def }));
  const pz = (v, nk = 1) => zahl(v, nk) + NBSP + "%";
  const passt = (k, breite) => k.find(t => tw(t) <= breite) || k[k.length - 1];
  const fw = (m, v) => zahl(v, m.nk);
  const einheitLang = m => (m.einheit === "Index" ? "Indexpunkte" : m.einheit === "je MA" ? "je Mitarbeiter" : m.einheit === "Tage" && m.p === 3 ? "Tage je Mitarbeiter" : m.einheit);
  const dAbs = m => (m.einheit === "%" ? delta(m.ist - m.bu, m.nk, NBSP + "%-Pkt.") : delta(m.ist - m.bu, m.nk, NBSP + einheitLang(m)));

  /* ---------- Zustand ---------- */
  const S = { p: 0, note: 3, sel: null, sort: null };       // sel: {typ: "mg"|"risiko"|"bruecke"|"kz", key}
  addEventListener("keydown", e => { if (e.key === "Escape" && S.sel) { S.sel = null; zeichnen(); } });
  const waehlen = (typ, key) => { S.sel = S.sel && S.sel.typ === typ && S.sel.key === key ? null : { typ, key }; zeichnen(); };
  const blass = (typ, key) => !!S.sel && S.sel.typ === typ && S.sel.key !== key;

  /* ---------- Layout ---------- */
  DK.init({ titel: "Scorecard" });
  const bKopf = DK.box("kopf", 16, 10, 992, 46);
  DK.haarlinie(62);
  const bFilter = DK.box("filter", 16, 68, 992, 50, "dk-filter");
  DK.haarlinie(124);
  const bBr = DK.box("v-bruecke", 16, 134, 262, 184);
  DK.haarlinie(326, 16, 746);
  const bKz = DK.box("v-kennzahlen", 16, 334, 262, 308);
  DK.el("div", { style: "position:absolute;left:287px;top:134px;height:508px;border-left:1px solid var(--linie)" }, document.getElementById("seite"));
  const bSc = DK.box("v-scorecard", 296, 134, 712, 214);
  DK.haarlinie(356, 296, 16);
  const bRi = DK.box("v-risiken", 296, 364, 712, 278);
  DK.el("style", {}, document.head, `
    .sc { table-layout: fixed; }
    .sc td { height: 21px; overflow: hidden; text-overflow: ellipsis; }
    .sc td.sc-ziel { vertical-align: top; padding-top: 2px; white-space: normal; line-height: 17px; font-weight: bold; color: var(--text); }
    .sc tr.sc-neu td { border-top: 1px solid #BDBDBD; }
    .sc td.sc-einheit { color: var(--muted); }
    .sc td.dk-dbalken { padding: 0 4px; }
    .sc tr.dk-blass td { opacity: .32; }
    .sc tr.dk-zeile:hover td.sc-ziel { background: #FFFFFF; }`);

  /* ---------- lokaler Tooltip ---------- */
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

  /* ---------- Datenschnitte ---------- */
  const knopfP = DK.schnitt(bFilter, "Perspektive", "knoepfe", { optionen: P.map((n, i) => [i, n]), wert: S.p,
    onChange: v => { S.p = Number(v); S.sel = null; S.sort = null; zeichnen(); } });
  const selNote = DK.schnitt(bFilter, "Risiken mit Beurteilung", "dropdown", { breite: 150, wert: "3",
    optionen: [["1", "ab 1 (alle)"], ["2", "ab 2"], ["3", "ab 3"], ["4", "ab 4"], ["5", "nur 5"]],
    onChange: v => { S.note = Number(v); if (S.sel && S.sel.typ === "risiko") S.sel = null; zeichnen(); } });

  /* ---------- Berechnungen ---------- */
  const messgroessen = () => M.filter(m => m.p === S.p);
  function risiken() {
    let r = RI.filter(x => x.p === S.p && x.note >= S.note);
    if (S.sort) r = r.slice().sort((a, b) => (S.sort.key === "name" || S.sort.key === "massnahme" || S.sort.key === "wer"
      ? a[S.sort.key].localeCompare(b[S.sort.key], "de") * (S.sort.ab ? -1 : 1) : (S.sort.ab ? b[S.sort.key] - a[S.sort.key] : a[S.sort.key] - b[S.sort.key])) || a.i - b.i);
    return r;
  }

  /* ---------- Scorecard (Tabelle mit Zielgruppen und Abweichungsbalken) ---------- */
  function scorecard(f, ms) {
    const W = { ziel: 144, mg: 166, ist: 72, bu: 72, d: 110, p1: 74, p2: 74 };
    const t = el("table", { class: "dk-matrix sc", id: "sc-tabelle" }, f.flaeche);
    const cg = el("colgroup", {}, t);
    Object.values(W).forEach(w => el("col", { style: `width:${w}px` }, cg));
    const hr = el("tr", {}, el("thead", {}, t));
    [["Strategisches Ziel", "left", "sc-kopf-ziel"], ["Messgröße", "left", "sc-kopf-mg"], ["Ist", "right", "sc-kopf-ist"], ["Budget", "right", "sc-kopf-bu"],
     ["ΔBU %", "center", "sc-kopf-d"], [`Plan ${D.jahr + 1}`, "right", "sc-kopf-p1"], [`Plan ${D.jahr + 2}`, "right", "sc-kopf-p2"]]
      .forEach(([h, a, id]) => el("th", { style: `text-align:${a}`, id }, hr, h));
    const tb = el("tbody", {}, t);
    const sp = { neg: Math.max(0, ...ms.map(m => -m.dbu * 1)), pos: Math.max(0, ...ms.map(m => m.dbu)) };
    ms.forEach((m, i) => {
      const neu = i === 0 || ms[i - 1].ziel !== m.ziel, n = ms.filter(x => x.ziel === m.ziel).length;
      const tr = el("tr", { class: "dk-zeile" + (neu && i > 0 ? " sc-neu" : "") + (blass("mg", m.i) ? " dk-blass" : "") }, tb);
      if (neu) el("td", { class: "sc-ziel", rowspan: n }, tr, m.ziel);
      const tdm = el("td", { style: "text-align:left;padding-left:8px" }, tr, m.name + " ");
      el("span", { class: "sc-einheit" }, tdm, `(${m.einheit})`);
      el("td", { style: "font-weight:bold" }, tr, fw(m, m.ist));
      el("td", {}, tr, fw(m, m.bu));
      const td = el("td", { class: "dk-dbalken" }, tr), Wd = W.d - 8, H = 18, txtW = 52;
      const svg = sv("svg", { width: Wd, height: H, style: "display:block" }, td);
      const kl = wirkung(m.dbu, m.richtung, 1), k = (Wd - txtW - 4) / Math.max(sp.neg + sp.pos, 1e-9), mitte = txtW + 2 + sp.neg * k;
      sv("text", { x: txtW - 6, y: H / 2, dy: "0.35em", "text-anchor": "end", style: `font-size:14px;fill:${kl === "neutral" ? "var(--text)" : FARBE[kl]}` }, svg, delta(m.dbu, 1));
      const bw = Math.abs(m.dbu) * k;
      sv("rect", { x: m.dbu >= 0 ? mitte : mitte - bw, y: (H - 10) / 2, width: bw, height: 10, fill: FARBE[kl] }, svg);
      sv("line", { x1: mitte, x2: mitte, y1: 1, y2: H - 1, stroke: "#8C8C8C", "stroke-width": 1 }, svg);
      el("td", {}, tr, fw(m, m.p1));
      el("td", {}, tr, fw(m, m.p2));
      requestAnimationFrame(() => [...tr.children].forEach(c => { if (c.scrollWidth > c.clientWidth + 1) console.error("Text zu lang: " + c.textContent); }));
      tr.addEventListener("click", ev => { if (ev.target.closest("td.sc-ziel")) return; waehlen("mg", m.i); });
      tooltip(tr, () => [`${m.name} (${einheitLang(m)}) · ${m.ziel}`,
        `Ist ${fw(m, m.ist)} · Budget ${fw(m, m.bu)} · Erfüllung ${pz(m.ist / m.bu * 100)}`,
        `Abweichung ${dAbs(m)} bzw. ${delta(m.dbu, 1, NBSP + "%")} – ${kl === "gut" ? "günstig" : kl === "schlecht" ? "ungünstig" : "neutral"}` +
          (m.richtung < 0 ? " (niedriger ist besser)" : ""),
        `Plan ${D.jahr + 1}: ${fw(m, m.p1)} (${delta((m.p1 / m.ist - 1) * 100, 1, NBSP + "%")} zum Ist) · Plan ${D.jahr + 2}: ${fw(m, m.p2)}`,
        "Klick hebt die Messgröße hervor"]);
    });
  }

  /* ---------- Risiken (DK.matrix, Beurteilung als Balken 1–5) ---------- */
  function risikoTabelle(f, rs) {
    if (!rs.length) { el("div", { class: "dk-botschaft" }, f.flaeche, "Keine Risiken mit dieser Beurteilung."); return; }
    const t = DK.matrix(f.flaeche, {
      spalten: [{ key: "name", titel: "Risiko", breite: 200, id: "ri-kopf-name" }, { key: "ausmass", titel: "Ausmaß", breite: 76, fmt: v => zahl(v), id: "ri-kopf-ausmass" },
                { key: "note", titel: "Beurteilung", breite: 112, typ: "anteil", textBreite: 26, id: "ri-kopf-note" },
                { key: "massnahme", titel: "Maßnahme (Projekt)", breite: 214, typ: "text" }, { key: "wer", titel: "Verantwortlich", breite: 110, typ: "text" }],
      zeilen: rs.map(r => ({ key: r.i, label: r.name, werte: { ausmass: r.ausmass, note: r.note / 5, massnahme: r.massnahme, wer: r.wer } })),
      auswahl: S.sel && S.sel.typ === "risiko" ? S.sel.key : null,
      onClick: k => waehlen("risiko", k),
      tooltip: z => { const r = RI[z.key];
        return [r.name, `Ausmaß ${zahl(r.ausmass)} Tsd. € · Beurteilung ${r.note} von 5`, `Maßnahme: ${r.massnahme}`, `Verantwortlich: ${r.wer}`,
                `Perspektive ${P[r.p]}`, "Klick hebt hervor"]; },
      sortierung: S.sort, onSort: key => { S.sort = S.sort && S.sort.key === key ? { key, ab: !S.sort.ab } : { key, ab: key !== "name" && key !== "massnahme" && key !== "wer" }; zeichnen(); },
    });
    // Beurteilung: Zahl statt Prozent im Datenbalken (Skala 0–5)
    t.querySelectorAll("tbody tr").forEach((tr, i) => { const tx = tr.children[2].querySelector("text"); if (tx) tx.textContent = String(rs[i].note); });
    t.id = "ri-tabelle";
  }

  /* ---------- Ergebnisbrücke (waagerechter Wasserfall) ---------- */
  function bruecke(f) {
    const B = D.bruecke, W = f.breite, rh = 30, H = rh * B.length;
    const svg = sv("svg", { width: W, height: H, role: "img", "aria-label": "Ergebnisbrücke bis zum EBT", id: "br-svg" }, f.flaeche);
    const lw = Math.ceil(Math.max(...B.map(b => tw(b[0], 14, b[2] === "s")))) + 10;
    const vw = Math.ceil(Math.max(...B.map(b => tw(b[2] === "d" ? delta(b[1], 0) : zahl(b[1]))))) + 8;
    let lauf = 0;
    const spannen = B.map(([, v, typ]) => { const a = typ === "s" ? 0 : lauf, e = typ === "s" ? v : lauf + v; lauf = typ === "s" ? v : e; return [Math.min(a, e), Math.max(a, e)]; });
    const max = Math.max(...spannen.map(s => s[1])), pw = W - lw - vw, k = pw / max;
    B.forEach(([name, v, typ], i) => {
      const [a, e] = spannen[i], y = i * rh, bh = 16;
      const g = sv("g", { class: "dk-klick" + (blass("bruecke", i) ? " dk-blass" : "") }, svg);
      sv("text", { x: lw - 10, y: y + rh / 2, dy: "0.35em", "text-anchor": "end", style: typ === "s" ? "font-weight:bold" : "" }, g, name);
      sv("rect", { x: lw + a * k, y: y + (rh - bh) / 2, width: Math.max(1, (e - a) * k), height: bh, fill: typ === "s" ? FARBE.ist : "#A9A9A9" }, g);
      sv("text", { x: lw + e * k + 5, y: y + rh / 2, dy: "0.35em", style: typ === "s" ? "font-weight:bold" : "" }, g, typ === "d" ? delta(v, 0) : zahl(v));
      if (i < B.length - 1) {
        const yv = y + (rh + bh) / 2, xv = lw + (typ === "s" ? e : (v < 0 ? a : e)) * k;
        sv("line", { x1: xv, x2: xv, y1: yv, y2: yv + rh - bh, stroke: "#8C8C8C", "stroke-width": 1 }, g);
      }
      const hit = sv("rect", { x: 0, y, width: W, height: rh, fill: "transparent" }, g);
      hit.addEventListener("click", () => waehlen("bruecke", i));
      tooltip(hit, () => [name, `${typ === "d" ? delta(v, 0) : zahl(v)} Tsd. € · ${pz(v / B[3][1] * 100)} des EBT`,
        name === "AO-Ergebnis" ? "Außerordentliches Ergebnis" : name === "EBT" ? "Ergebnis vor Steuern = Betriebs- + Finanz- + AO-Ergebnis" : null,
        "Klick hebt hervor"]);
    });
    sv("line", { x1: lw, x2: lw, y1: 0, y2: H, stroke: "#8C8C8C", "stroke-width": 1 }, svg);
  }

  /* ---------- Kennzahlen Bilanz/GuV ---------- */
  function kennzahlen(f) {
    const zeilen = [];
    KZ.forEach((k, i) => {
      if (i === 0 || KZ[i - 1].gruppe !== k.gruppe) zeilen.push({ key: "g" + i, label: k.gruppe, werte: { w: null, d: null }, summe: true });
      zeilen.push({ key: k.i, label: NBSP + NBSP + NBSP + k.name, werte: { w: k.wert, d: delta(k.wert - k.vj, k.nk) } });
    });
    const t = DK.matrix(f.flaeche, {
      spalten: [{ key: "n", titel: "Kennzahl", breite: 150 }, { key: "w", titel: String(D.jahr), breite: 50, fmt: v => zahl(v, v < 5 ? 2 : 1), id: "kz-kopf-wert" },
                { key: "d", titel: "ΔVJ", breite: 62, fmt: v => v }],
      zeilen, auswahl: S.sel && S.sel.typ === "kz" ? S.sel.key : null, onClick: k => waehlen("kz", k),
      tooltip: z => { const k = KZ[z.key];
        return [k.name, `${D.jahr}: ${zahl(k.wert, k.nk)} · Vorjahr ${zahl(k.vj, k.nk)} · ΔVJ ${delta(k.wert - k.vj, k.nk)}${k.gruppe.startsWith("Rent") ? NBSP + "%-Pkt." : ""}`,
                k.def, "Klick hebt hervor"]; } });
    // Gruppenzeilen: ohne Linie oben, ohne Werte; ΔVJ nach Wirkung färben (alle Kennzahlen: Anstieg günstig)
    t.querySelectorAll("tr.dk-summe td").forEach(td => { td.style.borderTop = "none"; td.style.paddingTop = "6px"; td.style.color = "var(--muted)"; });
    t.querySelectorAll("tr.dk-summe td:not(:first-child)").forEach(td => { td.textContent = ""; });
    t.querySelectorAll("tr.dk-zeile").forEach(tr => {
      const lab = tr.children[0].textContent.trim(), k = KZ.find(x => x.name === lab);
      if (k) tr.children[2].className = wirkung(k.wert - k.vj, 1, k.nk);
    });
    t.id = "kz-tabelle";
  }

  /* ---------- Zeichnen ---------- */
  function zeichnen() {
    [...knopfP.querySelectorAll("button")].forEach((b, i) => b.setAttribute("aria-pressed", String(i === S.p)));
    selNote.value = String(S.note);
    DK.kopf(bKopf, { titel: "Scorecard", untertitel: `Perspektive ${P[S.p]} · Geschäftsjahr ${D.jahr} · Ist zum Budget (ΔBU), Plan ${D.jahr + 1} und ${D.jahr + 2}`,
      quelle: "Quelle: Führungsinformationssystem · Stand 31.12." + D.jahr, legende: [[FARBE.gut, "günstig"], [FARBE.schlecht, "ungünstig"]] });

    // Scorecard
    const ms = messgroessen(), ung = ms.filter(m => wirkung(m.dbu, m.richtung, 1) === "schlecht");
    const schlimm = ung.slice().sort((a, b) => Math.abs(b.dbu) - Math.abs(a.dbu))[0];
    const selM = S.sel && S.sel.typ === "mg" ? M[S.sel.key] : null;
    const bSc_ = selM ? passt([`${selM.name}: Ist ${fw(selM, selM.ist)} ${einheitLang(selM)}, ${dAbs(selM)} zum Budget; Plan ${D.jahr + 2}: ${fw(selM, selM.p2)}`,
                               `${selM.name}: ${dAbs(selM)} zum Budget`], 708)
      : schlimm ? passt([`${ung.length} von ${ms.length} Messgrößen ungünstig zum Budget, größte Lücke: ${schlimm.name} (${delta(schlimm.dbu, 1, NBSP + "%")})`,
                         `${ung.length} von ${ms.length} Messgrößen ungünstig zum Budget`], 708)
      : "Alle Messgrößen erreichen das Budget";
    let f = DK.visual(bSc, { titel: "Strategische Ziele und Messgrößen", einheit: "Einheit je Zeile", botschaft: bSc_ });
    scorecard(f, ms);

    // Risiken
    const rs = risiken(), selR = S.sel && S.sel.typ === "risiko" ? RI[S.sel.key] : null;
    const top = rs.slice().sort((a, b) => b.note - a.note || b.ausmass - a.ausmass)[0], summe = rs.reduce((s, r) => s + r.ausmass, 0);
    const bRi_ = selR ? passt([`${selR.name}: ${zahl(selR.ausmass)} Tsd. €, Beurteilung ${selR.note} von 5 – Maßnahme „${selR.massnahme}“ (${selR.wer})`,
                               `${selR.name}: ${zahl(selR.ausmass)} Tsd. €, Beurteilung ${selR.note}`], 708)
      : top ? passt([`${rs.length} Risiken ab Beurteilung ${S.note}, zusammen ${zahl(summe)} Tsd. €; am höchsten: ${top.name} (${top.note} von 5)`,
                     `${rs.length} Risiken, zusammen ${zahl(summe)} Tsd. €; am höchsten: ${top.name}`], 708) : "Keine Risiken ab dieser Beurteilung";
    f = DK.visual(bRi, { titel: "Risiken und Maßnahmen", einheit: "Ausmaß in Tsd. €, Beurteilung 1–5", botschaft: bRi_ });
    risikoTabelle(f, rs);

    // Ergebnisbrücke
    const B = D.bruecke;
    f = DK.visual(bBr, { titel: "Ergebnis vor Steuern", einheit: "Tsd. €",
      botschaft: passt([`EBT ${zahl(B[3][1])} = ${zahl(B[0][1])} ${delta(B[1][1], 0).replace(/^([+−])/, "$1 ")} ${delta(B[2][1], 0).replace(/^([+−])/, "$1 ")}`, `EBT ${zahl(B[3][1])} Tsd. €`], 258) });
    bruecke(f);

    // Kennzahlen
    const besser = KZ.filter(k => k.wert > k.vj), schlechter = KZ.filter(k => k.wert < k.vj);
    f = DK.visual(bKz, { titel: "Kennzahlen Bilanz/GuV", einheit: "",
      botschaft: passt([`${besser.length} von ${KZ.length} über Vorjahr; ${schlechter.map(k => k.name.replace("umschlag", "u.")).join(", ")} darunter`,
                        `${besser.length} von ${KZ.length} Kennzahlen über Vorjahr`], 258) });
    kennzahlen(f);
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  /* ---------- Lernplattform ---------- */
  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "sc-kopf-d", versatz: [0, -2], regel: "EXPRESS – Abweichung statt Prozentzahl", titel: "ΔBU nach Wirkung",
        text: "Die Spalte „Realisierung“ des Originals (81–92 %, ohne erkennbare Rechnung) ist ersetzt durch die Abweichung des Ist vom Budget in Prozent, als Balken an einer Nulllinie und gefärbt nach Wirkung: Blaugrün günstig, Rot ungünstig; bei Quoten wie der Reklamationsquote ist ein Anstieg ungünstig. Erfüllungsgrad und absolute Abweichung stehen im Tooltip." },
      { nr: 2, ziel: "sc-kopf-ziel", anker: "links", versatz: [140, -6], regel: "STRUCTURE – Gruppieren", titel: "Messgrößen unter ihrem Ziel",
        text: "Messgrößen stehen geordnet unter ihrem strategischen Ziel, jedes Ziel einmal. Im Original wiederholten sich die Ziele („Sicherung der Liquidität“ zweimal) in ungeordneter Folge." },
      { nr: 3, ziel: "v-bruecke", anker: "links", versatz: [264, 2], regel: "EXPRESS – Passende Darstellung", titel: "Ergebnisbrücke statt Kreisdiagramm",
        text: "Das Kreisdiagramm „Ken_Auspraegung“ stellte außerordentliches Ergebnis, EBT und liquide Mittel als Anteile eines Ganzen dar – sie bilden keines. Jetzt zeigt eine Brücke, wie sich das EBT aus Betriebs-, Finanz- und außerordentlichem Ergebnis zusammensetzt." },
      { nr: 4, ziel: "kz-kopf-wert", anker: "links", versatz: [-6, -6], regel: "CHECK – Stimmige Zahlen", titel: "Kennzahlen passen zusammen",
        text: "Im Original stand ein Betriebsergebnis von 4.499.035 neben einem EBT von 24.500, und die liquiden Mittel (118.000 T€) überstiegen das Gesamtkapital, das sich aus Umsatz und Kapitalumschlag ergibt. Hier gilt: Betriebs- + Finanz- + AO-Ergebnis = EBT, ROS 11 % × Kapitalumschlag 1,66 = Gesamtkapitalrentabilität 18,3 %; liquide Mittel 11.800 Tsd. €." },
      { nr: 5, ziel: "v-kennzahlen", anker: "links", versatz: [264, 2], regel: "UNIFY – Einheitliche Formate", titel: "Einheit je Gruppe, Vorjahresvergleich",
        text: "Das Original mischte Formate („3.610,000“, „0,236“, „19,400“) ohne Einheiten. Jetzt sind die Kennzahlen nach Rentabilität (in %) und Umschlagshäufigkeit (pro Jahr) gegliedert, mit Vorjahr und ΔVJ nach Wirkung; die Ergebniswerte stehen in der Brücke." },
      { nr: 6, ziel: "v-risiken", anker: "links", versatz: [504, 2], regel: "SIMPLIFY – Lesbare Skala", titel: "Beurteilung als Balken mit Zahl",
        text: "Die Beurteilung steht als Zahl von 1 bis 5 mit Balken statt als Punktefolge „●●●○○“; das Ausmaß ist für alle Risiken angegeben (im Original nur für zwei) und die Tabelle nach jeder Spalte sortierbar. Abkürzungen wie „mang. Schnittstellenkoord.“ oder „Markterschließg. SüdostEU“ sind ausgeschrieben." },
      { nr: 7, ziel: "filter", anker: "links", versatz: [624, 26], regel: "CONDENSE – Auswahl statt Seiten", titel: "Perspektive und Risikobeurteilung als Datenschnitt",
        text: "Wie die Auswahllisten des Originals („Finanzen“, „3“) wählen die Datenschnitte die Perspektive der Scorecard und die Mindestbeurteilung der Risiken. Ein Klick auf eine Zeile hebt sie hervor, Esc hebt auf; die Botschaften rechnen mit." },
      { nr: 8, ziel: "kopf-titel", anker: "links", versatz: [140, 0], regel: "SIMPLIFY – Ohne Portalrahmen", titel: "Ohne Browser, Logo und Portalknöpfe",
        text: "Browserfenster, Adresszeile, Portal-Navigation („Eigene Seiten“, „Noch einmal ausführen“, „Zurück“), Benutzername, Logo und der Kürzel-Titel „FIS II“ entfallen. Der Bericht heißt nach seinem Inhalt; die Verantwortlichen tragen neutrale Namen." },
    ],
    nachbauIntro: "Seitengröße benutzerdefiniert 1024 × 646 px. Schrift Arial: Beschriftungen 10,5 pt, Visualtitel 12 pt. Datenmodell: Tabellen Messgrößen, Risiken, Ergebnisbrücke und Kennzahlen (in der CSV-Datei über die Spalte „Ebene“ getrennt); Perspektive als gemeinsame Dimension für Messgrößen und Risiken. Measures: ΔBU % = DIVIDE(SUM([Ist]) − SUM([Budget]); SUM([Budget])); Wirkung = [ΔBU %] * SELECTEDVALUE(Messgrößen[Wirkung]) für die bedingte Formatierung.",
    nachbau: [
      { id: "A", ziel: "v-scorecard", versatz: [0, 0], titel: "Strategische Ziele und Messgrößen", visual: "Matrix (Layout tabellarisch)",
        felder: "Zeilen: Strategisches Ziel, Messgröße (mit Einheit); Werte: Ist, Budget, ΔBU %, Plan 2027, Plan 2028",
        format: "ΔBU % als Datenbalken (positiv #00806B, negativ #C62828, Achse in der Mitte) – bei Messgrößen mit Wirkung −1 Farben über bedingte Formatierung nach [Wirkung]; Zwischensummen aus; wiederholte Ziele aus (Zeilenköpfe zusammenfassen)" },
      { id: "B", ziel: "v-risiken", versatz: [0, 0], titel: "Risiken und Maßnahmen", visual: "Tabelle",
        felder: "Risiko, Ausmaß, Beurteilung, Maßnahme, Verantwortlich", format: "Beurteilung als Datenbalken (Min 0, Max 5, #3A3F44) mit Wert; Spaltenköpfe sortierbar" },
      { id: "C", ziel: "v-bruecke", versatz: [0, 0], titel: "Ergebnis vor Steuern", visual: "Wasserfalldiagramm",
        felder: "Kategorie: Betriebsergebnis, Finanzergebnis, AO-Ergebnis; Y-Achse: Betrag; Gesamt ein (EBT)",
        format: "Erhöhung/Verringerung #A9A9A9, Gesamt #3A3F44; Datenbeschriftungen ein; Achsen aus",
        hinweis: "Das Standard-Wasserfalldiagramm ist senkrecht; die waagerechte Fassung hier spart Platz in der schmalen Spalte." },
      { id: "D", ziel: "v-kennzahlen", versatz: [0, 0], titel: "Kennzahlen Bilanz/GuV", visual: "Matrix",
        felder: "Zeilen: Gruppe, Kennzahl; Werte: Wert 2026, ΔVJ", format: "ΔVJ Schriftfarbe nach Wirkung (#00806B/#C62828); Gruppenzeilen ohne Werte" },
      { id: "E", ziel: "filter", anker: "links", versatz: [124, -2], titel: "Datenschnitte", visual: "Datenschnitt (2×)",
        felder: "Perspektive als Kacheln (Einzelauswahl), Beurteilung als Dropdown „größer oder gleich“", format: "Ausgewählt #3A3F44 mit weißer Schrift" },
    ],
    theme: DK.thema(),
    csv: { name: "scorecard_daten.csv", text: () => {
      const de = v => String(v).replace(".", ",");
      const k = ["Ebene;Perspektive;Gruppe_Ziel;Name;Einheit;Ist_2026;Budget_2026;Plan_2027;Plan_2028;Vorjahr;Ausmass_Tsd_EUR;Beurteilung;Massnahme;Verantwortlich"];
      M.forEach(m => k.push(["Messgröße", P[m.p], m.ziel, m.name, m.einheit, de(m.ist), de(m.bu), de(m.p1), de(m.p2), "", "", "", "", ""].join(";")));
      RI.forEach(r => k.push(["Risiko", P[r.p], "", r.name, "Tsd. €", "", "", "", "", "", r.ausmass, r.note, r.massnahme, r.wer].join(";")));
      D.bruecke.forEach(([n, v]) => k.push(["Ergebnisbrücke", "", "", n, "Tsd. €", v, "", "", "", "", "", "", "", ""].join(";")));
      KZ.forEach(x => k.push(["Kennzahl", "", x.gruppe, x.name, x.gruppe.split(", ")[1], de(x.wert), "", "", "", de(x.vj), "", "", "", ""].join(";")));
      return k.join("\r\n"); } },
    tabellen: () => [
      { titel: `Scorecard – Perspektive ${P[S.p]}`, kopf: ["Ziel", "Messgröße", "Einheit", "Ist", "Budget", "ΔBU %", `Plan ${D.jahr + 1}`, `Plan ${D.jahr + 2}`],
        zeilen: messgroessen().map(m => [m.ziel, m.name, m.einheit, fw(m, m.ist), fw(m, m.bu), delta(m.dbu, 1), fw(m, m.p1), fw(m, m.p2)]) },
      { titel: `Risiken ab Beurteilung ${S.note}`, kopf: ["Risiko", "Ausmaß Tsd. €", "Beurteilung", "Maßnahme", "Verantwortlich"],
        zeilen: risiken().map(r => [r.name, zahl(r.ausmass), String(r.note), r.massnahme, r.wer]) },
      { titel: "Ergebnisbrücke, Tsd. €", kopf: ["Position", "Tsd. €"], zeilen: D.bruecke.map(([n, v, t]) => [n, t === "d" ? delta(v, 0) : zahl(v)]) },
      { titel: "Kennzahlen Bilanz/GuV", kopf: ["Kennzahl", String(D.jahr), "Vorjahr", "ΔVJ"], zeilen: KZ.map(k => [k.name, zahl(k.wert, k.nk), zahl(k.vj, k.nk), delta(k.wert - k.vj, k.nk)]) },
    ],
  });
  zeichnen();
})();
