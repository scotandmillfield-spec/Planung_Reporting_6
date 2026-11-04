/* Dashboard „Pie- bzw. Donut-Chart“ (Abb. 3.43): Kennzahlen eines Online-Shops mit drei Ringdiagrammen.
   Seite 1024 x 646 px. Daten: shop.json (daten_shop.py) – je Monat und Kanal Besuche, qualifizierte Besuche und
   Besuche mit Produktaufruf, je Monat, Kanal und Kategorie Produktaufrufe, Bestellungen und Umsatz.
   Aufbau wie im Original: drei Donuts nebeneinander (Besuche nach Kanal, Produktaufrufe und Umsatz nach Kategorie),
   je Donut eine Quote – hier als KPI-Leiste über dem zugehörigen Donut, mit Vormonatsvergleich nach Wirkung.
   Datenschnitte Monat und Kanal; Klick auf einen Kanal filtert, Klick auf eine Kategorie hebt sie in beiden
   Kategorie-Donuts hervor. */
(() => {
  "use strict";
  const { zahl, delta, wirkung, FARBE, NBSP, sv, el } = DK;
  const MON = DATA.monate, KAN = DATA.kanaele, KAT = DATA.kategorien;
  const MNAME = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
  const MKURZ = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
  const mName = mi => MNAME[Number(MON[mi].slice(5)) - 1] + " " + MON[mi].slice(0, 4);
  const KANAL_LANG = { Organisch: "Organische Suche und Direktaufrufe", Bezahlt: "Bezahlte Kampagnen" };
  const F_KAT = ["#3A3F44", "#6E747A", "#A9A9A9", "#D4D4D4"], T_KAT = ["#FFFFFF", "#FFFFFF", "#1A1A1A", "#1A1A1A"];
  const F_KAN = ["#3A3F44", "#C9C9C9"], T_KAN = ["#FFFFFF", "#1A1A1A"];
  const pz = (a, nk = 0) => zahl(a * 100, nk) + NBSP + "%";
  const pp = (d, nk) => delta(d * 100, nk, NBSP + "%-Pkt.");
  const pd = (a, b, nk = 1) => delta((a / b - 1) * 100, nk, NBSP + "%");
  const tsd = v => zahl(v / 1000, 0) + NBSP + "Tsd.";
  const mio = (v, nk = 2) => zahl(v / 1e6, nk) + NBSP + "Mio.";
  const TAU = 2 * Math.PI;

  /* ---------- Zustand ---------- */
  const S = { monat: MON.length - 1, kanal: null, kat: null };
  addEventListener("keydown", e => {
    if (e.key !== "Escape") return;
    if (S.kat !== null) S.kat = null; else if (S.kanal !== null) S.kanal = null; else return;
    zeichnen();
  });

  /* ---------- Layout (Seite 1024 x 646) ---------- */
  DK.init({ titel: "Pie- bzw. Donut-Chart" });
  const bKopf = DK.box("kopf", 16, 10, 992, 46);
  DK.haarlinie(62);
  const bFilter = DK.box("filter", 16, 68, 992, 50, "dk-filter");
  const bKpi = DK.box("kpis", 16, 128, 992, 68);
  DK.haarlinie(206);
  const bBes = DK.box("v-besuche", 16, 216, 318, 426);
  const bAuf = DK.box("v-aufrufe", 359, 216, 318, 426);
  const bUms = DK.box("v-umsatz", 690, 216, 318, 426);

  /* ---------- Berechnungen ---------- */
  function daten(mi = S.monat) {
    const kz = DATA.kanal.filter(z => z[0] === mi), tz = DATA.kategorie.filter(z => z[0] === mi);
    const imKanal = c => S.kanal === null || c === S.kanal;
    const kanaele = KAN.map((name, c) => {
      const z = kz.find(x => x[1] === c);
      const t = tz.filter(x => x[1] === c);
      return { c, name, besuche: z[2], qual: z[3], mit: z[4], bestell: t.reduce((s, x) => s + x[4], 0), umsatz: t.reduce((s, x) => s + x[5], 0) };
    });
    const ks = kanaele.filter(k => imKanal(k.c));
    const sum = f => ks.reduce((s, k) => s + k[f], 0);
    const kat = KAT.map((name, k) => {
      const t = tz.filter(x => x[2] === k && imKanal(x[1]));
      return { k, name, aufrufe: t.reduce((s, x) => s + x[3], 0), bestell: t.reduce((s, x) => s + x[4], 0), umsatz: t.reduce((s, x) => s + x[5], 0) };
    });
    const ges = { besuche: sum("besuche"), qual: sum("qual"), mit: sum("mit"), bestell: sum("bestell"), umsatz: sum("umsatz"),
                  aufrufe: kat.reduce((s, x) => s + x.aufrufe, 0), alleBesuche: kanaele.reduce((s, k) => s + k.besuche, 0) };
    return { mi, kanaele, kat, ges };
  }
  const quoten = g => ({ qual: g.qual / g.besuche, aufruf: g.mit / g.besuche, konv: g.bestell / g.besuche });

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

  /* ---------- Ringdiagramm ---------- */
  const P = (cx, cy, r, a) => [cx + r * Math.sin(a), cy - r * Math.cos(a)];       // a im Uhrzeigersinn ab 12 Uhr
  function ring(cx, cy, r0, r1, a0, a1) {
    if (a1 - a0 >= TAU - 1e-6) {
      return `M${cx},${cy - r1}A${r1},${r1} 0 1 1 ${cx},${cy + r1}A${r1},${r1} 0 1 1 ${cx},${cy - r1}Z` +
             `M${cx},${cy - r0}A${r0},${r0} 0 1 0 ${cx},${cy + r0}A${r0},${r0} 0 1 0 ${cx},${cy - r0}Z`;
    }
    const g = a1 - a0 > Math.PI ? 1 : 0;
    const [ax, ay] = P(cx, cy, r1, a0), [bx, by] = P(cx, cy, r1, a1), [c_x, c_y] = P(cx, cy, r0, a1), [dx, dy] = P(cx, cy, r0, a0);
    return `M${ax},${ay}A${r1},${r1} 0 ${g} 1 ${bx},${by}L${c_x},${c_y}A${r0},${r0} 0 ${g} 0 ${dx},${dy}Z`;
  }
  // Lage eines waagerechten Textblocks w x h im Ringsegment (Suche ab der Mitte des Segments, wie im Sunburst 3.44)
  function lage(cx, cy, r0, r1, a0, a1, w, h) {
    const passtBei = (am, rm) => {
      const [mx, my] = P(cx, cy, rm, am);
      const ok = [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2], [0, -h / 2], [0, h / 2], [-w / 2, 0], [w / 2, 0]]
        .every(([ddx, ddy]) => {
          const x = mx + ddx - cx, y = my + ddy - cy, r = Math.hypot(x, y);
          if (r < r0 + 2 || r > r1 - 2) return false;
          if (a1 - a0 >= TAU - 1e-6) return true;
          let a = Math.atan2(x, -y);
          while (a < a0) a += TAU;
          while (a > a0 + TAU) a -= TAU;
          return a >= a0 + 3 / r && a <= a1 - 3 / r;
        });
      return ok ? [mx, my] : null;
    };
    const mitte = (a0 + a1) / 2, spanne = (a1 - a0) / 2, schritt = Math.PI / 90;
    const rm = (r0 + r1) / 2, dr = (r1 - r0) * 0.1;
    for (let i = 0; i * schritt <= spanne; i++)
      for (const am of i ? [mitte - i * schritt, mitte + i * schritt] : [mitte])
        for (const r of [rm, rm - dr, rm + dr]) { const m = passtBei(am, r); if (m) return m; }
    return null;
  }
  // segs: [{ key, name, wert, fuell, text, blass, gewaehlt, tip, klick }]; mitte: [Zeile, Wert]
  // Alle drei Ringe gleich groß. Beschriftung innen, wenn sie waagerecht in das Segment passt; sonst über bzw. unter
  // dem Ring mit Führungslinie (seitlich ist neben dem Ring kein Platz).
  function donut(ziel, breite, hoehe, id, segs, mitte) {
    const svg = sv("svg", { width: breite, height: hoehe, role: "img", "aria-label": mitte[0] }, ziel);
    const g = sv("g", { id }, svg);
    const ges = segs.reduce((s, x) => s + x.wert, 0), cx = breite / 2, cy = hoehe / 2 - 6;
    const R = Math.min(hoehe / 2 - 70, breite / 2 - 30), r0 = R * 0.56;
    let a0 = 0;
    const out = segs.map(s => {
      const a1 = a0 + TAU * s.wert / ges, am = (a0 + a1) / 2, zeilen = [s.name, pz(s.wert / ges)];
      const w = Math.max(...zeilen.map(t => DK.tw(t, 14, true))) + 4;
      const m = lage(cx, cy, r0, R, a0, a1, w, 34);
      const r = { s, a0, a1, am, zeilen, w, innen: !!m, x: m ? m[0] : P(cx, cy, R, am)[0], oben: Math.cos(am) >= 0 };
      if (m) r.y = m[1] - 8;
      a0 = a1;
      return r;
    });
    // äußere Etiketten je Band (oben/unten) waagerecht auseinanderschieben und in der Fläche halten
    [true, false].forEach(oben => {
      const L = out.filter(r => !r.innen && r.oben === oben).sort((p, q) => p.x - q.x);
      L.forEach((r, k) => { r.x = Math.max(r.x, r.w / 2 + 2, k ? L[k - 1].x + (L[k - 1].w + r.w) / 2 + 10 : -Infinity); });
      for (let k = L.length - 1; k >= 0; k--)
        L[k].x = Math.min(L[k].x, breite - L[k].w / 2 - 2, k < L.length - 1 ? L[k + 1].x - (L[k + 1].w + L[k].w) / 2 - 10 : Infinity);
      L.forEach(r => { r.y = oben ? cy - R - 46 : cy + R + 20; });
    });
    out.forEach(r => {
      const { s, a0, a1, am, zeilen } = r;
      const gs = sv("g", { class: "dk-klick" + (s.blass ? " dk-blass" : ""), "data-name": s.name }, g);
      const p = sv("path", { d: ring(cx, cy, r0, R, a0, a1), fill: s.gewaehlt ? "#8F8F8F" : s.fuell, stroke: "#FFFFFF", "stroke-width": 2 }, gs);
      p.addEventListener("click", s.klick);
      tooltip(p, s.tip);
      if (!r.innen) {
        const [px, py] = P(cx, cy, R + 3, am), ly = r.oben ? r.y + 28 : r.y - 12;
        sv("polyline", { points: `${px},${py} ${r.x},${ly}`, fill: "none", stroke: "#8C8C8C", "stroke-width": 1 }, gs);
      }
      const farbe = r.innen ? (s.gewaehlt ? "#1A1A1A" : s.text) : "#1A1A1A";
      const t = sv("text", { x: r.x, y: r.y, dy: "0.35em", "text-anchor": "middle", style: `fill:${farbe};pointer-events:none` }, gs);
      sv("tspan", { x: r.x, dy: 0, "font-weight": "bold" }, t, zeilen[0]);
      sv("tspan", { x: r.x, dy: 17 }, t, zeilen[1]);
    });
    sv("text", { x: cx, y: cy - 10, dy: "0.35em", "text-anchor": "middle", class: "muted" }, g, mitte[0]);
    sv("text", { x: cx, y: cy + 10, dy: "0.35em", "text-anchor": "middle", style: "font-weight:bold;font-size:16px" }, g, mitte[1]);
  }

  /* ---------- Botschaften ---------- */
  const passt = (k, breite) => k.find(t => DK.tw(t) <= breite) || k[k.length - 1];
  function botschaften(d, v) {
    const g = d.ges, B = 318;
    const kanalTxt = S.kanal === null ? "" : ` (${KAN[S.kanal]})`;
    // Besuche
    let b1;
    if (S.kanal === null) {
      const o = d.kanaele[0], dv = v ? pd(g.besuche, v.ges.besuche) : null;
      b1 = passt([`${pz(o.besuche / g.besuche)} der Besuche organisch, gesamt ΔVM ${dv}`, `${pz(o.besuche / g.besuche)} der Besuche kommen organisch`], B);
    } else {
      const k = d.kanaele[S.kanal], q = quoten(k);
      b1 = passt([`${k.name}: ${pz(k.besuche / g.alleBesuche)} der Besuche, Konversion ${pz(q.konv, 2)}`, `${k.name}: ${pz(k.besuche / g.alleBesuche)} der Besuche`], B);
    }
    // Produktaufrufe
    const topA = d.kat.slice().sort((x, y) => y.aufrufe - x.aufrufe)[0];
    const b2 = passt([`${topA.name} am häufigsten aufgerufen (${pz(topA.aufrufe / g.aufrufe)})${kanalTxt}`,
      `${topA.name} am häufigsten aufgerufen (${pz(topA.aufrufe / g.aufrufe)})`], B);
    // Umsatz: Kategorie, die mehr Umsatz als Aufrufe bringt
    const best = d.kat.map(x => ({ x, d: x.umsatz / g.umsatz - x.aufrufe / g.aufrufe })).sort((p, q) => q.d - p.d)[0].x;
    const b3 = passt([`${best.name}: ${pz(best.aufrufe / g.aufrufe)} der Aufrufe, ${pz(best.umsatz / g.umsatz)} des Umsatzes`,
      `${best.name}: ${pz(best.umsatz / g.umsatz)} des Umsatzes`], B);
    return [b1, b2, b3];
  }

  /* ---------- Datenschnitte ---------- */
  const monatsIdx = MON.map((_, i) => i).slice(1);              // Dezember 2026 nur als Vormonat
  DK.schnitt(bFilter, "Monat 2027", "knoepfe", {
    optionen: monatsIdx.map(i => [i, MKURZ[Number(MON[i].slice(5)) - 1]]), wert: S.monat,
    onChange: v => { S.monat = Number(v); zeichnen(); } });
  const kanalKnoepfe = DK.schnitt(bFilter, "Kanal", "knoepfe", {
    optionen: [["alle", "Alle"], ...KAN.map((k, i) => [String(i), k])], wert: "alle",
    onChange: v => { S.kanal = v === "alle" ? null : Number(v); zeichnen(); } });
  const kanalSetzen = c => { S.kanal = S.kanal === c ? null : c; zeichnen(); };
  const katSetzen = k => { S.kat = S.kat === k ? null : k; zeichnen(); };

  /* ---------- Zeichnen ---------- */
  function zeichnen() {
    const d = daten(), v = S.monat > 0 ? daten(S.monat - 1) : null, g = d.ges, q = quoten(g), qv = v ? quoten(v.ges) : null;
    [...kanalKnoepfe.querySelectorAll("button")].forEach((b, i) =>
      b.setAttribute("aria-pressed", String(i === 0 ? S.kanal === null : S.kanal === i - 1)));
    DK.kopf(bKopf, { titel: "Online-Shop: Besuche, Produktaufrufe, Umsatz",
      untertitel: `${mName(S.monat)} · ${S.kanal === null ? "alle Kanäle" : "Kanal " + KAN[S.kanal]} · Vergleich zum Vormonat (ΔVM)`,
      quelle: "", legende: [[FARBE.gut, "günstig"], [FARBE.schlecht, "ungünstig"]] });
    const kpi = (label, wert, nk, dWert) => ({ label, wert: zahl(wert * 100, nk), einheit: "%", bezug: "ΔVM",
      delta: dWert === null ? "–" : pp(dWert, nk), klasse: dWert === null ? "neutral" : wirkung(dWert * 100, +1, nk) });
    DK.kpis(bKpi, [
      kpi("Qualifizierte Besuche", q.qual, 1, qv && q.qual - qv.qual),
      kpi("Produktaufrufquote", q.aufruf, 1, qv && q.aufruf - qv.aufruf),
      kpi("Konversionsrate", q.konv, 2, qv && q.konv - qv.konv),
    ]);
    const [b1, b2, b3] = botschaften(d, v);
    const vorm = (liste, key, wert) => v && v[liste].find(x => x[key.k] === key.v);

    // Besuche nach Kanal
    let f = DK.visual(bBes, { titel: "Besuche nach Kanal", einheit: "Anzahl", botschaft: b1 });
    donut(f.flaeche, f.breite, f.hoehe, "do-besuche", d.kanaele.map(k => ({
      name: k.name, wert: k.besuche, fuell: F_KAN[k.c], text: T_KAN[k.c],
      blass: S.kanal !== null && S.kanal !== k.c, gewaehlt: false, klick: () => kanalSetzen(k.c),
      tip: () => {
        const qk = quoten(k), vk = vorm("kanaele", { k: "c", v: k.c });
        const z = [KANAL_LANG[k.name], `Besuche: ${zahl(k.besuche)} · Anteil ${pz(k.besuche / g.alleBesuche, 1)}`];
        if (vk) z.push(`Vormonat ${zahl(vk.besuche)} · ΔVM ${pd(k.besuche, vk.besuche)}`);
        z.push(`Qualifiziert ${pz(qk.qual, 1)} · Produktaufrufquote ${pz(qk.aufruf, 1)} · Konversion ${pz(qk.konv, 2)}`);
        z.push("Klick filtert das Dashboard auf diesen Kanal");
        return z;
      } })), ["Besuche", tsd(g.besuche)]);

    // Produktaufrufe und Umsatz nach Kategorie (gleiche Reihenfolge und Grautöne in beiden Ringen)
    const katSegs = (feld, einheit) => d.kat.map(x => ({
      name: x.name, wert: x[feld], fuell: F_KAT[x.k], text: T_KAT[x.k],
      blass: S.kat !== null && S.kat !== x.k, gewaehlt: S.kat === x.k, klick: () => katSetzen(x.k),
      tip: () => {
        const vk = vorm("kat", { k: "k", v: x.k }), gesamt = feld === "aufrufe" ? g.aufrufe : g.umsatz;
        const fmt = w => feld === "umsatz" ? `${zahl(w)} €` : zahl(w);
        const z = [`${x.name}${S.kanal === null ? "" : " · " + KAN[S.kanal]}`, `${einheit}: ${fmt(x[feld])} · Anteil ${pz(x[feld] / gesamt, 1)}`];
        if (vk) z.push(`Vormonat ${fmt(vk[feld])} · ΔVM ${pd(x[feld], vk[feld])}`);
        if (feld === "umsatz") z.push(`Bestellungen ${zahl(x.bestell)} · Ø Warenkorb ${zahl(x.umsatz / x.bestell)} €`);
        else z.push(`Anteil am Umsatz ${pz(x.umsatz / g.umsatz, 1)}`);
        z.push("Klick hebt die Kategorie in beiden Diagrammen hervor");
        return z;
      } }));
    f = DK.visual(bAuf, { titel: "Produktaufrufe nach Kategorie", einheit: "Anzahl", botschaft: b2 });
    donut(f.flaeche, f.breite, f.hoehe, "do-aufrufe", katSegs("aufrufe", "Produktaufrufe"), ["Produktaufrufe", mio(g.aufrufe)]);
    f = DK.visual(bUms, { titel: "Umsatz nach Kategorie", einheit: "€", botschaft: b3 });
    donut(f.flaeche, f.breite, f.hoehe, "do-umsatz", katSegs("umsatz", "Umsatz"), ["Umsatz", mio(g.umsatz) + NBSP + "€"]);
    if (DK._ebenenNeu) DK._ebenenNeu();
  }

  /* ---------- Lernplattform: Designregeln, Nachbau, Tabellen, CSV ---------- */
  DK.ebenen({
    regeln: [
      { nr: 1, ziel: "v-umsatz", anker: "links", versatz: [245, 4], regel: "SAY – Botschaft vermitteln", titel: "Eine Aussage je Diagramm",
        text: "Unter jedem Titel steht ein Satz, was das Diagramm zeigt – etwa, dass Dekoration nur 10 % der Aufrufe, aber 18 % des Umsatzes bringt. Das Original hatte nur die Titel „Visits“, „Product Category Views“ und „Turnover by Category“." },
      { nr: 2, ziel: "kpis", anker: "links", versatz: [300, 4], regel: "EXPRESS – Vergleich mit Maß", titel: "Abweichung in %-Punkten statt Pfeil",
        text: "Jede Quote nennt die Veränderung zum Vormonat in Prozentpunkten, farbig nach Wirkung: Blaugrün günstig, Rot ungünstig. Das Original zeigte nur grüne und rote Dreiecke – ohne Vergleichsbasis und ohne Größe der Veränderung." },
      { nr: 3, ziel: "kpis", anker: "links", versatz: [640, 4], regel: "STRUCTURE – Inhalte ordnen", titel: "Quote über dem passenden Diagramm",
        text: "Wie im Original gehört jede Quote zu einem Diagramm: qualifizierte Besuche zu den Besuchen, die Produktaufrufquote zu den Aufrufen, die Konversionsrate zum Umsatz. Die Kategorien stehen in beiden Ringen in derselben Reihenfolge (nach Umsatz) und im selben Grauton, so lassen sich Aufrufe und Umsatz vergleichen." },
      { nr: 4, ziel: "do-besuche", anker: "links", versatz: [110, 75], regel: "UNIFY – Semantische Notation", titel: "Grautöne statt Bunt",
        text: "Die Segmente sind in Grautönen abgestuft; Farbe gibt es nur für günstige und ungünstige Abweichungen. Das Original färbte Kategorien und Kanäle in Blau, Grün, Gelb und Pink." },
      { nr: 5, ziel: "do-aufrufe", anker: "links", versatz: [67, 163], regel: "EXPRESS – Lesbar beschriften", titel: "Namen ungekürzt",
        text: "Namen und Anteile stehen ungekürzt im Ring oder daneben. Das Original kürzte sie bis zur Unkenntlichkeit („Paid c…“, „Orga…“, „Decor…“, „Hous…“)." },
      { nr: 6, ziel: "do-umsatz", anker: "links", versatz: [305, 303], regel: "SIMPLIFY – Überflüssiges weglassen", titel: "Ohne Logos und Rahmen",
        text: "Browserrahmen, Reiter, Logos, Export-Knöpfe und der graue Kreis in der Mitte entfallen. Die Mitte nennt die Summe, auf die sich die Anteile beziehen." },
      { nr: 7, ziel: "do-besuche", anker: "links", versatz: [15, 303], regel: "CHECK – Stimmige Zahlen", titel: "Größenordnungen passen zusammen",
        text: "Im Original standen 44 Mio. Besuche neben 1,8 Mio. € Umsatz – bei 2 % Konversionsrate wären das Bestellungen von rund 2 €. Hier ergeben Besuche × Konversionsrate die Bestellungen und Umsatz : Bestellungen einen Warenkorb von rund 200 €." },
      { nr: 8, ziel: "filter", anker: "links", versatz: [600, -2], regel: "CONDENSE – Filtern und hervorheben", titel: "Monat, Kanal und Klick",
        text: "Monat und Kanal filtern das Dashboard; ein Klick auf einen Kanal wirkt wie der Datenschnitt. Ein Klick auf eine Kategorie hebt sie in beiden Kategorie-Ringen hervor. Esc hebt die Auswahl auf." },
    ],
    nachbauIntro: "Seitengröße 1024 × 646 px. Schrift Arial: Beschriftungen 10,5 pt, Visualtitel 12 pt, KPI-Werte 19,5 pt. Datenmodell: Tabelle Besuche (Monat, Kanal, Besuche, Qualifizierte Besuche, Besuche mit Produktaufruf) und Tabelle Kategorien (Monat, Kanal, Kategorie, Produktaufrufe, Bestellungen, Umsatz), verbunden über Monat und Kanal (Dimensionstabellen); in der CSV-Datei durch die Spalte „Ebene“ getrennt.",
    nachbau: [
      { id: "A", ziel: "kpis", anker: "links", versatz: [130, 4], titel: "Quoten", visual: "Karte (neu) mit Referenzbeschriftung",
        felder: "Qualifizierte Quote = DIVIDE(SUM(Besuche[Qualifiziert]); SUM(Besuche[Besuche])); Produktaufrufquote analog; Konversionsrate = DIVIDE(SUM(Kategorien[Bestellungen]); SUM(Besuche[Besuche])); Referenz ΔVM mit DATEADD(…; −1; MONTH)",
        format: "Wert 19,5 pt fett; Referenzbeschriftung in %-Punkten, Farbe über bedingte Formatierung (#00806B günstig, #C62828 ungünstig)" },
      { id: "B", ziel: "v-besuche", versatz: [0, 0], titel: "Besuche nach Kanal", visual: "Ringdiagramm (Standardvisual)",
        felder: "Legende: Kanal; Werte: Besuche", format: "Farben #3A3F44 / #C9C9C9; Innenradius 58 %; Detailbeschriftungen innen: Kategorie, Prozentsatz; Legende aus",
        hinweis: "Die Summe in der Mitte ist eine Karte (neu) ohne Hintergrund, über die Mitte gelegt." },
      { id: "C", ziel: "v-aufrufe", versatz: [0, 0], titel: "Produktaufrufe nach Kategorie", visual: "Ringdiagramm (Standardvisual)",
        felder: "Legende: Kategorie; Werte: Produktaufrufe", format: "Farben #3A3F44, #6E747A, #A9A9A9, #D4D4D4 in der Reihenfolge Schuhe, Textilien, Dekoration, Haushalt; Sortierung fest (Spalte Sortierreihenfolge)" },
      { id: "D", ziel: "v-umsatz", versatz: [0, 0], titel: "Umsatz nach Kategorie", visual: "Ringdiagramm (Standardvisual)",
        felder: "Legende: Kategorie; Werte: Umsatz", format: "wie C – gleiche Farben und Reihenfolge wie bei den Produktaufrufen" },
      { id: "E", ziel: "filter", anker: "links", versatz: [124, -2], titel: "Datenschnitte", visual: "Datenschnitt (2×)",
        felder: "Monat als Kacheln (Einzelauswahl), Kanal als Kacheln", format: "Ausgewählt #3A3F44 mit weißer Schrift, sonst weiß mit Rahmen #9A9A9A" },
    ],
    theme: DK.thema(),
    csv: { name: "online_shop_daten.csv", text: () => {
      const k = ["Ebene;Monat;Kanal;Kategorie;Besuche;Qualifizierte_Besuche;Besuche_mit_Produktaufruf;Produktaufrufe;Bestellungen;Umsatz_EUR"];
      DATA.kanal.forEach(([m, c, b, q, a]) => k.push(["Kanal", MON[m], KAN[c], "", b, q, a, "", "", ""].join(";")));
      DATA.kategorie.forEach(([m, c, t, au, n, u]) => k.push(["Kategorie", MON[m], KAN[c], KAT[t], "", "", "", au, n, u].join(";")));
      return k.join("\r\n"); } },
    tabellen: () => {
      const d = daten(), g = d.ges;
      const t1 = d.kanaele.map(k => { const q = quoten(k); return [k.name, zahl(k.besuche), pz(k.besuche / g.alleBesuche, 1), pz(q.qual, 1), pz(q.aufruf, 1), pz(q.konv, 2)]; });
      const t2 = d.kat.map(x => [x.name, zahl(x.aufrufe), pz(x.aufrufe / g.aufrufe, 1), zahl(x.bestell), zahl(x.umsatz), pz(x.umsatz / g.umsatz, 1), zahl(x.umsatz / x.bestell)]);
      t2.push(["Summe", zahl(g.aufrufe), pz(1, 1), zahl(g.bestell), zahl(g.umsatz), pz(1, 1), zahl(g.umsatz / g.bestell)]);
      const kt = S.kanal === null ? "alle Kanäle" : "Kanal " + KAN[S.kanal];
      return [
        { titel: `Besuche nach Kanal, ${mName(S.monat)}`, kopf: ["Kanal", "Besuche", "Anteil", "Qualifiziert", "Produktaufrufquote", "Konversionsrate"], zeilen: t1 },
        { titel: `Kategorien, ${mName(S.monat)}, ${kt}`, kopf: ["Kategorie", "Produktaufrufe", "Anteil", "Bestellungen", "Umsatz in €", "Anteil", "Ø Warenkorb in €"], zeilen: t2 },
      ];
    },
  });
  zeichnen();
})();
