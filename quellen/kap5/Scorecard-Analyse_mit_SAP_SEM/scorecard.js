/* Abb. 5.51 „Scorecard-Analyse“ (6. Auflage) – Dashboard 1024 x 646 px, softwareneutral nach dem Produktscreenshot.
   Aufbau wie im Fenster „Ursache-Wirkung Analyse“ des Originals: links die Ursache-Wirkungs-Kette der strategischen
   Ziele in vier Perspektiven, rechts Ziele und Kennzahlen mit Ist und Ziel. Beide Seiten teilen ein Zeilenraster:
   Jede Perspektive ist ein waagerechtes Band über die ganze Seite. Status in Worten statt Ampelsymbolen (wie in
   Abb. 3.182), Abweichung zum Ziel als Balken nach Wirkung (wie in Abb. 3.2).
   Daten: scorecard.json (daten_scorecard.py) – Werte des Originals. Klick auf ein Ziel hebt es mit seinen Ursachen und
   Wirkungen hervor, Klick auf eine Perspektive hebt sie hervor, Esc hebt auf. */
(() => {
  "use strict";
  const { zahl, delta, wirkung, FARBE, NBSP, sv, el, tw } = DK;
  const P = DATA.perspektiven, ST = DATA.stufen;
  const ZI = DATA.ziele.map(([p, name, ver, spalte], i) => ({ i, p, name, ver, spalte }));
  const KZ = DATA.kennzahlen.map(([z, name, einh, nk, ist, ziel, w, hinweis], i) => {
    const d = (ist - ziel) / Math.abs(ziel) * 100, e = Math.round(d * w * 10) / 10;
    return { i, z, name, einh, nk, ist, ziel, w, hinweis, d, st: e > 0 ? 3 : e === 0 ? 2 : e >= -10 ? 1 : 0 };
  });
  const LI = DATA.links.map(([a, b]) => ({ a, b }));
  ZI.forEach(z => { z.kz = KZ.filter(k => k.z === z.i); z.st = Math.min(...z.kz.map(k => k.st));
                    z.ursachen = LI.filter(l => l.b === z.i).map(l => l.a); z.wirkungen = LI.filter(l => l.a === z.i).map(l => l.b); });
  const FIN = ZI.filter(z => z.p === 0).map(z => z.i);
  const fuehrtZu = (i, ziele, besucht = new Set()) => ziele.includes(i) ||
    ZI[i].wirkungen.some(b => !besucht.has(b) && (besucht.add(b), fuehrtZu(b, ziele, besucht)));
  const STFARBE = s => (s === 0 ? FARBE.schlecht : s === 3 ? FARBE.gut : "var(--text)");
  const fz = (k, v) => zahl(v, k.nk);
  const EINH = { "Tsd. €": "Tsd. €", "%": "%", Tage: "Tage", Anzahl: "" };
  const einheit = k => (k.name.toLowerCase().endsWith(EINH[k.einh].toLowerCase()) ? "" : EINH[k.einh]);   // „Schulungstage“ ohne „Tage“
  const REGEL = "Status aus der Zielerreichung nach Wirkung: über Ziel übertroffen, auf Ziel erreicht, bis 10 % darunter im Rahmen, sonst kritisch; Ziel = schlechteste Kennzahl";

  /* ---------- Zustand ---------- */
  const S = { auswahl: null };                        // {typ: "ziel", i} | {typ: "persp", p}
  addEventListener("keydown", e => { if (e.key === "Escape" && S.auswahl) { S.auswahl = null; zeichnen(); } });
  const waehlen = (typ, wert) => {
    S.auswahl = S.auswahl && S.auswahl.typ === typ && S.auswahl.wert === wert ? null : { typ, wert };
    zeichnen();
  };
  const zielAktiv = i => !S.auswahl || (S.auswahl.typ === "persp" ? ZI[i].p === S.auswahl.wert
    : i === S.auswahl.wert || ZI[S.auswahl.wert].ursachen.includes(i) || ZI[S.auswahl.wert].wirkungen.includes(i));
  const linkAktiv = l => !S.auswahl || (S.auswahl.typ === "persp" ? ZI[l.a].p === S.auswahl.wert || ZI[l.b].p === S.auswahl.wert
    : l.a === S.auswahl.wert || l.b === S.auswahl.wert);
  const reiheAktiv = r => !S.auswahl || (S.auswahl.typ === "persp" ? r.p === S.auswahl.wert
    : r.typ === "p" ? ZI[S.auswahl.wert].p === r.p : r.z === S.auswahl.wert);

  /* ---------- Layout (Seite 1024 x 646) und gemeinsames Zeilenraster ---------- */
  DK.init({ titel: "Scorecard-Analyse" });
  const bKopf = DK.box("kopf", 16, 10, 992, 46);
  DK.haarlinie(62);
  const bKarte = DK.box("v-karte", 16, 70, 412, 572);
  const bTab = DK.box("v-tabelle", 428, 70, 580, 572);
  const KOPF_H = 22, RH = 21, REIHEN = [];
  let yy = KOPF_H;
  P.forEach((name, p) => {
    REIHEN.push({ typ: "p", p, y: yy }); yy += RH;
    ZI.filter(z => z.p === p).forEach(z => {
      REIHEN.push({ typ: "z", p, z: z.i, y: yy }); yy += RH;
      z.kz.forEach(k => { REIHEN.push({ typ: "k", p, z: z.i, k: k.i, y: yy }); yy += RH; });
    });
  });
  const H_RASTER = yy;
  const band = p => { const r = REIHEN.filter(x => x.p === p); return [r[0].y + RH, r[r.length - 1].y + RH]; };

  /* ---------- Tooltip (gleiches Verhalten wie die Bausteine von DK) ---------- */
  const tip = document.querySelector(".dk-tooltip");
  function tooltip(ziel, zeilenFn) {
    ziel.addEventListener("pointermove", ev => {
      tip.textContent = "";
      zeilenFn().filter(Boolean).forEach((z, i) => el(i === 0 ? "b" : "div", {}, tip, z));
      tip.style.display = "block";
      const r = tip.getBoundingClientRect();
      let x = ev.clientX + 14, y = ev.clientY + 14;
      if (x + r.width > innerWidth - 8) x = ev.clientX - r.width - 14;
      if (y + r.height > innerHeight - 8) y = ev.clientY - r.height - 14;
      tip.style.left = x + "px"; tip.style.top = y + "px";
    });
    ziel.addEventListener("pointerleave", () => { tip.style.display = "none"; });
  }
  const namen = ids => ids.map(i => ZI[i].name).join(", ") || "–";
  const tipZiel = i => { const z = ZI[i];
    return [z.name, `${P[z.p]} · Status: ${ST[z.st]}`, ...z.kz.map(k => `${k.name}: ${fz(k, k.ist)} zu ${fz(k, k.ziel)} ${EINH[k.einh]} (${delta(k.d, 1, NBSP + "%")}) – ${ST[k.st]}`),
      `Ursachen: ${namen(z.ursachen)}`, `Wirkt auf: ${namen(z.wirkungen)}`, `Verantwortlich: ${z.ver}`, "Klick hebt Ursachen und Wirkungen hervor"]; };
  const tipKz = k => { const z = ZI[k.z];
    return [`${k.name}${EINH[k.einh] ? ", " + EINH[k.einh] : ""}`, `${P[z.p]} · ${z.name}`,
      `Ist ${DATA.periode}: ${fz(k, k.ist)} · Ziel ${DATA.zielperiode}: ${fz(k, k.ziel)}`,
      `Abweichung zum Ziel ${delta(k.d, 1, NBSP + "%")}${k.w < 0 ? " (Anstieg ungünstig)" : ""} – ${ST[k.st]}`,
      k.hinweis ? `Hinweis: ${k.hinweis}` : "", `Verantwortlich: ${z.ver}`, "Klick hebt das Ziel in der Karte hervor"]; };
  const tipPersp = p => { const zs = ZI.filter(z => z.p === p);
    return [P[p], `${zs.length} ${zs.length === 1 ? "Ziel" : "Ziele"}: ${zs.map(z => `${z.name} (${ST[z.st]})`).join(", ")}`, "Klick hebt die Perspektive hervor"]; };

  /* ---------- Bänder der Perspektiven (in Karte und Tabelle auf gleicher Höhe) ---------- */
  function baender(svg, breite, mitText) {
    REIHEN.filter(r => r.typ === "p").forEach(r => {
      const g = sv("g", { class: "dk-klick" + (reiheAktiv(r) ? "" : " dk-blass"), id: (mitText ? "tp-" : "kp-") + r.p }, svg);
      sv("rect", { x: 0, y: r.y + 1, width: breite, height: RH - 1, fill: "#F6F6F6" }, g);
      if (mitText) sv("text", { x: 4, y: r.y + RH / 2 + 1, dy: "0.35em", style: "font-weight:bold" }, g, P[r.p]);
      const hit = sv("rect", { x: 0, y: r.y, width: breite, height: RH, fill: "transparent" }, g);
      hit.addEventListener("click", () => waehlen("persp", r.p));
      tooltip(hit, () => tipPersp(r.p));
    });
  }

  /* ---------- Karte: Knoten und rechtwinklige Pfeile ---------- */
  const NW = 175, NH = 40, XS = { 0: 0, 1: 217, 0.5: 108.5 };
  const LAGE = {};                                       // Oberkante je Ziel: Treppe wie im Original
  ZI.forEach(z => {
    const [o, u] = band(z.p), paar = ZI.filter(x => x.p === z.p).length > 1;
    LAGE[z.i] = { x: XS[z.spalte], y: !paar ? o + (u - o - NH) / 2 : z.spalte === 0 ? o + 7 : u - 7 - NH };
  });
  const L = i => LAGE[i], oben = i => L(i).y, unten = i => L(i).y + NH, links = i => L(i).x, rechts = i => L(i).x + NW;
  // Verlauf je Beziehung (Ursache → Wirkung) als Punktfolge; Kanäle zwischen den Knoten und in den Bändern
  function verlauf(a, b) {
    const A = ZI[a], B = ZI[b];
    if (A.p === B.p) {                                                       // waagerecht in derselben Perspektive
      if (oben(a) < unten(b) && oben(b) < unten(a)) {
        const y = (Math.max(oben(a), oben(b)) + Math.min(unten(a), unten(b))) / 2;
        return A.spalte > B.spalte ? [[links(a), y], [rechts(b), y]] : [[rechts(a), y], [links(b), y]];
      }
      const y = (oben(a) + unten(a)) / 2, x = links(b) + NW * 0.86;          // seitlich hinaus, dann hoch
      return [[links(a), y], [x, y], [x, unten(b)]];
    }
    const ol = [Math.max(links(a), links(b)), Math.min(rechts(a), rechts(b))];
    if (ol[1] - ol[0] > 20) { const x = (ol[0] + ol[1]) / 2; return [[x, oben(a)], [x, unten(b)]]; }   // senkrecht
    return null;
  }
  // Feste Verläufe dort, wo Knoten im Weg stehen (Kanäle in den Perspektivbändern), sonst automatisch
  function kanal(a, b) {
    const yBand = p => REIHEN.find(r => r.typ === "p" && r.p === p).y + RH / 2;
    const key = ZI[a].name + ">" + ZI[b].name;
    const fest = {
      "Marktposition verbessern>Ergebnisverbesserung": [[142, oben(a)], [142, unten(b)]],
      "Kundenbindung>Ergebnisverbesserung": [[250, oben(a)], [250, unten(b)]],
      "Prozessoptimierung>Marktposition verbessern": [[60, oben(a)], [60, unten(b)]],
      "Prozessoptimierung>Kundenbindung": [[120, oben(a)], [120, yBand(ZI[a].p)], [300, yBand(ZI[a].p)], [300, unten(b)]],
      "Mitarbeiterbindung>Prozessoptimierung": [[links(a), (oben(a) + unten(a)) / 2], [150, (oben(a) + unten(a)) / 2], [150, unten(b)]],
      "Umsetzung Innovation>Prozessoptimierung": [[30, oben(a)], [30, unten(b)]],
      "Weiterentwicklung>Prozessoptimierung": [[240, oben(a)], [240, yBand(ZI[a].p)], [90, yBand(ZI[a].p)], [90, unten(b)]],
      "Weiterentwicklung>Mitarbeiterbindung": [[330, oben(a)], [330, unten(b)]],
    };
    return fest[key] || verlauf(a, b);
  }
  function pfeil(svg, l) {
    const pts = kanal(l.a, l.b);
    if (!pts) { console.error("Kein Verlauf für " + ZI[l.a].name + " → " + ZI[l.b].name); return; }
    const g = sv("g", { id: `pf-${l.a}-${l.b}`, class: linkAktiv(l) ? "" : "dk-blass" }, svg);
    const [x1, y1] = pts[pts.length - 2], [x2, y2] = pts[pts.length - 1];
    const len = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / len, uy = (y2 - y1) / len, K = 8;
    const ende = [x2 - ux * K, y2 - uy * K];
    sv("polyline", { points: [...pts.slice(0, -1), ende].map(p => p.join(",")).join(" "), fill: "none", stroke: "#6E747A", "stroke-width": 1.5 }, g);
    sv("path", { d: `M${x2},${y2} L${ende[0] - uy * 4.5},${ende[1] + ux * 4.5} L${ende[0] + uy * 4.5},${ende[1] - ux * 4.5} Z`, fill: "#6E747A" }, g);
  }
  function knoten(svg, z) {
    const { x, y } = L(z.i), krit = z.st === 0;
    const g = sv("g", { id: "zk-" + z.i, class: "dk-klick" + (zielAktiv(z.i) ? "" : " dk-blass") }, svg);
    sv("rect", { x: x + 0.75, y: y + 0.75, width: NW - 1.5, height: NH - 1.5, rx: 6, fill: "#FFFFFF",
                 stroke: krit ? FARBE.schlecht : "#6E747A", "stroke-width": krit ? 2 : 1.5 }, g);
    sv("text", { x: x + NW / 2, y: y + 14, dy: "0.35em", "text-anchor": "middle" }, g, z.name);
    sv("text", { x: x + NW / 2, y: y + 29, dy: "0.35em", "text-anchor": "middle", style: `font-weight:bold;fill:${STFARBE(z.st)}` }, g, ST[z.st]);
    if (tw(z.name) > NW - 10) console.error("Zielname zu lang: " + z.name);
    const hit = sv("rect", { x, y, width: NW, height: NH, fill: "transparent" }, g);
    hit.addEventListener("click", () => waehlen("ziel", z.i));
    tooltip(hit, () => tipZiel(z.i));
  }

  /* ---------- Tabelle: Ziele und Kennzahlen ---------- */
  const T = { label: 0, ein: 14, ist: 284, ziel: 350, dTxt: 408, bar0: 414, bar1: 486, status: 496 };
  function tabelle(svg, breite) {
    const kopf = [[T.label, "Strategisches Ziel und Kennzahl"], [T.ist, "Ist", "end", "sp-ist"], [T.ziel, "Ziel", "end", "sp-ziel"],
      [(T.dTxt - 38 + T.bar1) / 2, "Δ Ziel %", "middle", "sp-delta"], [T.status, "Status", "start", "sp-status"]];
    kopf.forEach(([x, t, a, id]) => {
      const e = sv("text", { x, y: 15, "text-anchor": a || "start", class: "muted", ...(id ? { id } : {}) }, svg, t);
      if (id === "sp-status") tooltip(e, () => ["Status", REGEL]);
    });
    sv("line", { x1: 0, x2: breite, y1: KOPF_H - 2.5, y2: KOPF_H - 2.5, stroke: "#3A3F44", "stroke-width": 1 }, svg);
    baender(svg, breite, true);
    const ds = KZ.map(k => k.d), neg = Math.max(0, ...ds.map(d => -d)), pos = Math.max(0, ...ds);
    const k_ = (T.bar1 - T.bar0) / Math.max(neg + pos, 1e-9), m = T.bar0 + neg * k_;
    REIHEN.forEach((r, j) => {
      if (r.typ === "p") return;
      const g = sv("g", { class: "dk-klick" + (reiheAktiv(r) ? "" : " dk-blass"), id: r.typ === "z" ? "tz-" + r.z : "tk-" + r.k }, svg);
      const cy = r.y + RH / 2, naechste = REIHEN[j + 1];
      if (naechste && naechste.typ !== "p") sv("line", { x1: 0, x2: breite, y1: r.y + RH - 0.5, y2: r.y + RH - 0.5,
        stroke: naechste.typ === "z" ? "#D9D9D9" : "#EFEFEF", "stroke-width": 1 }, g);
      if (r.typ === "z") {
        const z = ZI[r.z];
        sv("text", { x: T.label, y: cy, dy: "0.35em", style: "font-weight:bold" }, g, z.name);
        sv("text", { x: T.status, y: cy, dy: "0.35em", style: `font-weight:bold;fill:${STFARBE(z.st)}` }, g, ST[z.st]);
      } else {
        const k = KZ[r.k], kl = wirkung(k.d, k.w, 1);
        const t = sv("text", { x: T.ein, y: cy, dy: "0.35em" }, g, k.name + (einheit(k) ? " " : ""));
        if (einheit(k)) sv("tspan", { class: "muted" }, t, einheit(k));
        if (tw(k.name + " " + EINH[k.einh]) > T.ist - 70 - T.ein) console.error("Kennzahl zu lang: " + k.name);
        sv("text", { x: T.ist, y: cy, dy: "0.35em", "text-anchor": "end" }, g, fz(k, k.ist));
        sv("text", { x: T.ziel, y: cy, dy: "0.35em", "text-anchor": "end" }, g, fz(k, k.ziel));
        sv("text", { x: T.dTxt, y: cy, dy: "0.35em", "text-anchor": "end", style: `fill:${kl === "neutral" ? "var(--text)" : FARBE[kl]}` }, g, delta(k.d, 1));
        const bw = Math.abs(k.d) * k_;
        if (bw > 0.5) sv("rect", { x: k.d >= 0 ? m : m - bw, y: r.y + (RH - 9) / 2, width: bw, height: 9, fill: FARBE[kl] }, g);
        sv("line", { x1: m, x2: m, y1: r.y + 2, y2: r.y + RH - 2, stroke: "#8C8C8C", "stroke-width": 1 }, g);
        sv("text", { x: T.status, y: cy, dy: "0.35em", style: `fill:${STFARBE(k.st)}` }, g, ST[k.st]);
      }
      const hit = sv("rect", { x: 0, y: r.y, width: breite, height: RH, fill: "transparent" }, g);
      hit.addEventListener("click", () => waehlen("ziel", r.z));
      tooltip(hit, () => (r.typ === "z" ? tipZiel(r.z) : tipKz(KZ[r.k])));
    });
  }

  /* ---------- Botschaften ---------- */
  const passt = (k, b) => k.find(t => tw(t) <= b) || k[k.length - 1];
  function botschaftKarte() {
    if (S.auswahl && S.auswahl.typ === "ziel") {
      const z = ZI[S.auswahl.wert], u = z.ursachen.length, w = z.wirkungen.length;
      const ur = u ? `${u} ${u === 1 ? "Ursache" : "Ursachen"}` : "Ausgangsziel";
      const wi = w ? `wirkt auf ${w === 1 ? ZI[z.wirkungen[0]].name : w + " Ziele"}` : "Endziel";
      const wk = w ? `wirkt auf ${w} ${w === 1 ? "Ziel" : "Ziele"}` : "Endziel";
      return passt([`${z.name} (${ST[z.st]}): ${ur}, ${wi}`, `${z.name}: ${ur}, ${wi}`, `${z.name} (${ST[z.st]}): ${ur}, ${wk}`, `${z.name}: ${ur}, ${wk}`], 412);
    }
    const zs = S.auswahl ? ZI.filter(z => z.p === S.auswahl.wert) : ZI, vor = S.auswahl ? P[S.auswahl.wert] + ": " : "";
    const krit = zs.filter(z => z.st === 0);
    if (!krit.length) return passt([zs.length === 1 ? `${vor}kein Ziel kritisch, ${zs[0].name} ${ST[zs[0].st]}`
      : `${vor}kein Ziel kritisch, ${zs.filter(z => z.st >= 2).length} von ${zs.length} erreicht oder übertroffen`, `${vor}kein Ziel kritisch`], 412);
    const alle = FIN.length && krit.every(z => fuehrtZu(z.i, FIN));
    return passt([`${vor}${krit.length} von ${zs.length} Zielen kritisch: ${krit.map(z => z.name).join(", ")}`,
      `${vor}${krit.length} von ${zs.length} Zielen kritisch${alle && !S.auswahl ? ", alle wirken aufs Ergebnis" : ""}`,
      `${vor}${krit.length} von ${zs.length} Zielen kritisch`], 412);
  }
  function botschaftTabelle() {
    if (S.auswahl && S.auswahl.typ === "ziel") {
      const z = ZI[S.auswahl.wert];
      return passt([`${z.name}: ` + z.kz.map(k => `${k.name} ${delta(k.d, 1, NBSP + "%")}`).join(", ") + " zum Ziel",
        `${z.name}: ` + z.kz.map(k => `${k.name} ${delta(k.d, 1, NBSP + "%")}`).join(", "),
        (w => `${z.name}: ${z.kz.length} Kennzahlen, schwächste ${w.name} (${delta(w.d, 1, NBSP + "%")}, ${ST[w.st]})`)(z.kz.slice().sort((x, y) => x.d * x.w - y.d * y.w)[0])], 580);
    }
    const ks = S.auswahl ? KZ.filter(k => ZI[k.z].p === S.auswahl.wert) : KZ, vor = S.auswahl ? P[S.auswahl.wert] + ": " : "";
    const einzeln = [...new Map(ks.map(k => [k.name, k])).values()];        // Verbesserungsvorschläge zählen einmal
    const gut = einzeln.filter(k => k.st >= 2).length;
    const luecke = einzeln.filter(k => k.st <= 1).sort((a, b) => a.d * a.w - b.d * b.w)[0];
    const l = luecke ? `größte Lücke: ${luecke.name} (${delta(luecke.d, 1, NBSP + "%")})` : "keine Kennzahl unter Ziel";
    return passt([`${vor}${gut} von ${einzeln.length} Kennzahlen im oder über Ziel; ${l}`,
      `${vor}${gut} von ${einzeln.length} Kennzahlen im oder über Ziel, ${luecke ? "größte Lücke: " + luecke.name : l}`,
      `${vor}${l[0].toUpperCase()}${l.slice(1)}`], 580);
  }

  /* ---------- Zeichnen ---------- */
  function zeichnen() {
    DK.kopf(bKopf, { titel: `Scorecard-Analyse: ${DATA.scorecard}`,
      untertitel: `Ursache-Wirkungs-Kette der strategischen Ziele · aktuelle Periode ${DATA.periode} · Zielperiode ${DATA.zielperiode} · Abweichung Ist zum Ziel`,
      quelle: "", legende: [[FARBE.gut, "günstig"], [FARBE.schlecht, "ungünstig"]] });
    let v = DK.visual(bKarte, { titel: "Ursache-Wirkungs-Kette", einheit: "Status je Ziel", botschaft: botschaftKarte() });
    let svg = sv("svg", { width: v.breite, height: H_RASTER, role: "img", "aria-label": "Ursache-Wirkungs-Kette der strategischen Ziele" }, v.flaeche);
    const lg = sv("g", { id: "karte-legende" }, svg);
    sv("line", { x1: 0, x2: 22, y1: 10, y2: 10, stroke: "#6E747A", "stroke-width": 1.5 }, lg);
    sv("path", { d: "M30,10 L22,5.5 L22,14.5 Z", fill: "#6E747A" }, lg);
    sv("text", { x: 38, y: 10, dy: "0.35em", class: "muted" }, lg, "wirkt auf");
    sv("line", { x1: 0, x2: v.breite, y1: KOPF_H - 2.5, y2: KOPF_H - 2.5, stroke: "#3A3F44", "stroke-width": 1 }, svg);
    baender(svg, v.breite, false);
    const gp = sv("g", { id: "karte-pfeile" }, svg);
    LI.forEach(l => pfeil(gp, l));
    ZI.forEach(z => knoten(svg, z));
    v = DK.visual(bTab, { titel: "Ziele und Kennzahlen", einheit: "Ist und Ziel, Abweichung in %", botschaft: botschaftTabelle() });
    svg = sv("svg", { width: v.breite, height: H_RASTER, role: "img", "aria-label": "Tabelle der strategischen Ziele und Kennzahlen" }, v.flaeche);
    tabelle(svg, v.breite);
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  /* ---------- Lernplattform: Designregeln, Nachbau, Tabellen, CSV ---------- */
  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "v-karte", anker: "links", versatz: [352, 22], regel: "SAY – Botschaft vermitteln", titel: "Aussage über jedem Visual",
        text: "Über der Karte steht, welche Ziele kritisch sind, über der Tabelle, wie viele Kennzahlen ihr Ziel erreichen und wo die größte Lücke liegt. Ein Klick auf ein Ziel bezieht beide Aussagen darauf. Das Original zeigte nur Symbole." },
      { nr: 2, ziel: "sp-status", anker: "links", versatz: [74, -4], regel: "UNIFY – Barrierearme Notation", titel: "Status in Worten statt Ampelsymbolen",
        text: "Fünf Symbole des Originals (Stoppschild, roter Blitz, gelbes Ausrufezeichen, grüner Haken, grüner Stern) werden zu vier Wörtern nach einer festen Regel: über Ziel „übertroffen“, auf Ziel „erreicht“, bis 10 % darunter „im Rahmen“, sonst „kritisch“. Rot und Blaugrün nur zusätzlich – lesbar auch in Graustufen und bei Farbfehlsichtigkeit." },
      { nr: 3, ziel: "sp-delta", anker: "links", versatz: [90, -4], regel: "EXPRESS – Vergleich mit Maß", titel: "Abweichung zum Ziel als Balken",
        text: "Neu ist die Abweichung Ist zu Ziel in Prozent mit Balken an einer Nulllinie, farbig nach Wirkung: Bei Kosten und Durchlaufzeit ist ein Anstieg ungünstig. Das Original stellte nur „Actual“ und „Target“ nebeneinander." },
      { nr: 4, ziel: "kp-2", anker: "links", versatz: [404, -1], regel: "STRUCTURE – Gemeinsames Raster", titel: "Perspektiven als durchgehende Bänder",
        text: "Jede Perspektive ist ein Band über Karte und Tabelle; Ziel und Kennzahlen stehen auf der Höhe ihres Knotens. Die Perspektiven heißen einheitlich deutsch und stehen waagerecht – im Original senkrecht und teils abgeschnitten („Financial“, „Extern“, „Intern“, „…ationsperspektive“)." },
      { nr: 5, ziel: "karte-pfeile", anker: "links", versatz: [328, 214], regel: "EXPRESS – Ursache und Wirkung", titel: "Rechtwinklige Pfeile, Klick zeigt Kette",
        text: "Die neun Beziehungen des Originals laufen als rechtwinklige Pfeile ohne Kreuzung; kritische Ziele sind rot umrandet. Ein Klick auf ein Ziel hebt seine Ursachen und Wirkungen hervor. Das Original nutzte geschwungene Pfeile und Ellipsen auf blauem Grund." },
      { nr: 6, ziel: "tk-7", anker: "links", versatz: [236, 0], regel: "CHECK – Einheiten und Plausibilität", titel: "Einheiten einmal, Lücken geschlossen",
        text: "Einheit einmal an der Kennzahl, Beträge in Tsd. € statt „180.000,00 EUR“, Kosten positiv statt mit Minus. Das fehlende Ziel der Durchlaufzeit (Original 0,000) ist mit 20 Tagen angenommen, „Schulungstage/MA 110“ als Schulungstage gesamt gelesen; „ST“ und „T“ heißen Anzahl und Tage." },
      { nr: 7, ziel: "kopf-titel", anker: "links", versatz: [412, 2], regel: "SIMPLIFY – Überflüssiges weglassen", titel: "Ein Bild statt zwei Fenster",
        text: "Fensterrahmen, Menü- und Symbolleisten, Logo und das zweite, überlappende Fenster (Navigationsbaum mit Kennzahldetails und Berichtsliste) entfallen. Die Navigation Perspektive › Ziel › Kennzahl steckt in der Tabelle, Verantwortliche und Hinweise stehen im Tooltip." },
    ],
    nachbauIntro: "Seitengröße 1024 × 646 px. Schrift Arial: Beschriftungen 10,5 pt, Visualtitel 12 pt, Berichtstitel 16,5 pt. Datenmodell: Tabellen Ziele (Perspektive, Ziel, Verantwortlich), Kennzahlen (Ziel, Kennzahl, Einheit, Wirkung, Ist, Ziel) und Beziehungen (Ursache, Wirkung) wie in der CSV-Datei. Eine Strategiekarte ist kein Standardvisual; sie wird aus Formen und Textfeldern zusammengesetzt.",
    nachbau: [
      { id: "A", ziel: "zk-3", anker: "links", versatz: [190, 0], titel: "Ursache-Wirkungs-Kette", visual: "Formen (abgerundetes Rechteck, Pfeil) und Karte (neu) je Ziel",
        felder: "Je Ziel eine Karte mit Kategoriebeschriftung = Zielname und Wert = Measure Status Ziel = MINX( Kennzahlen; [Statusstufe] ) als Text",
        format: "Rahmen #6E747A 1,5 pt, bei „kritisch“ #C62828 2 pt über bedingte Formatierung; Pfeile als Formen 1,5 pt #6E747A",
        hinweis: "Hervorheben einer Kette über Lesezeichen je Ziel oder Kreuzfilterung mit der Matrix (Interaktionen bearbeiten)." },
      { id: "B", ziel: "v-tabelle", anker: "links", versatz: [440, 4], titel: "Ziele und Kennzahlen", visual: "Matrix (Layout tabellarisch)",
        felder: "Zeilen: Perspektive, Ziel, Kennzahl; Werte: Ist, Ziel, Δ Ziel %, Status; QuickInfos: Verantwortlich, Hinweis",
        format: "Perspektive als Zeilenkopf mit Hintergrund #F6F6F6; Status-Schriftfarbe bedingt (kritisch #C62828, übertroffen #00806B)",
        hinweis: "Status = VAR e = DIVIDE( [Ist] − [Ziel]; ABS( [Ziel] ) ) * [Wirkung] RETURN SWITCH( TRUE(); e > 0; \"übertroffen\"; e = 0; \"erreicht\"; e >= −0,1; \"im Rahmen\"; \"kritisch\" )" },
      { id: "C", ziel: "sp-delta", anker: "links", versatz: [90, -4], titel: "Abweichung zum Ziel", visual: "Datenbalken in der Matrix",
        felder: "Zwei Measures „Δ günstig“ und „Δ ungünstig“ (Wert nur bei passender Wirkung, sonst BLANK())", format: "Datenbalken #00806B bzw. #C62828, gleiche Achse, Werte mit Vorzeichen" },
      { id: "D", ziel: "kopf-titel", anker: "links", versatz: [412, 2], titel: "Kopfzeile", visual: "Textfeld",
        felder: "Titel, Untertitel mit Perioden, Legende aus zwei Rechtecken", format: "Titel 16,5 pt fett, Untertitel 10,5 pt #4D4D4D" },
    ],
    theme: DK.thema(),
    csv: { name: "scorecard_analyse.csv", text: () => {
      const d = (v, nk) => v.toFixed(nk).replace(".", ",");
      const z = ["Perspektive;Strategisches_Ziel;Ziel_wirkt_auf;Kennzahl;Einheit;Wirkung;Ist;Ziel;Abweichung_Prozent;Status;Verantwortlich;Periode;Zielperiode"];
      KZ.forEach(k => { const zi = ZI[k.z];
        z.push([P[zi.p], zi.name, namen(zi.wirkungen).replace("–", ""), k.name, k.einh, k.w > 0 ? "Anstieg günstig" : "Anstieg ungünstig",
          d(k.ist, k.nk), d(k.ziel, k.nk), d(k.d, 1), ST[k.st], zi.ver, DATA.periode, DATA.zielperiode].join(";")); });
      return z.join("\r\n"); } },
    tabellen: () => [
      { titel: "Strategische Ziele", kopf: ["Perspektive", "Ziel", "Status", "Ursachen", "Wirkt auf", "Verantwortlich"],
        zeilen: ZI.map(z => [P[z.p], z.name, ST[z.st], namen(z.ursachen), namen(z.wirkungen), z.ver]) },
      { titel: "Kennzahlen", kopf: ["Ziel", "Kennzahl", "Einheit", "Ist", "Ziel", "Δ Ziel %", "Status"],
        zeilen: KZ.map(k => [ZI[k.z].name, k.name, k.einh, fz(k, k.ist), fz(k, k.ziel), delta(k.d, 1), ST[k.st]]) },
    ],
  });
  zeichnen();
})();
