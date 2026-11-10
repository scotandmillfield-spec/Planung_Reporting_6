/* Abb. 5.52 „Launchpad-Startseite im Editiermodus“ – Logik der Startseite.
   Gruppe „Meine Startseite“ mit acht Kacheln und „Kachel hinzufügen“, Gruppe mit drei Link-Kacheln, drei
   Benachrichtigungen. Editiermodus (Druckfassung): Kacheln per Drag & Drop oder Pfeiltasten verschieben,
   „Entfernen“ nimmt sie aus der Gruppe, „Kachel hinzufügen“ holt sie zurück bzw. ergänzt Apps aus dem Katalog;
   „Fertig“ wechselt in die normale Ansicht. Inhalte des Originals übersetzt, Namen fiktiv. */
(() => {
  "use strict";
  const { el } = MK;
  MK.init({ titel: "Launchpad-Startseite im Editiermodus" });
  const $ = id => document.getElementById(id);
  const PRINT = MK.PRINT;
  const NBSP = MK.NBSP;

  /* ---------- Stammdaten ---------- */
  let G1 = [
    { id: "k-kunden", titel: "Kunden verwalten" },
    { id: "k-produkte", titel: "Produkte verwalten" },
    { id: "k-news", titel: "Windkarte: Windverhältnisse weltweit in Echtzeit und als Prognose", unter: "Heute · Nachrichten", breit: true },
    { id: "k-termine", titel: "Meine Termine" },
    { id: "k-auftraege", titel: "Kundenaufträge verwalten" },
    { id: "k-umsatz", titel: "Jahresumsätze im Vergleich", unter: "nach Region, in Mio.", breit: true,
      balken: [["Amerika", 234], ["EMEA", 97], ["APAC", 197]] },
    { id: "k-teamkalender", titel: "Teamkalender", zahl: "1", einheit: "heute" },
    { id: "k-reise", titel: "Reiseanträge genehmigen", zahl: "35", einheit: "offen" },
  ];
  let G2 = [
    { id: "l-fracht", titel: "Strategische Frachtübersicht" },
    { id: "l-notfall", titel: "Notfall" },
    { id: "l-rueckmeldungen", titel: "Rückmeldungen überwachen" },
  ];
  const KATALOG = [{ id: "k-budget", titel: "Budget freigeben" }, { id: "k-liquiditaet", titel: "Liquiditätsvorschau", zahl: "7", einheit: "Tage" },
                   { id: "k-kostenstellen", titel: "Kostenstellen prüfen" }];
  let NACHRICHTEN = [
    { id: "n-1", titel: "2 Hauptansprechpartner wurden kürzlich geändert", meta: "Geschäftskontakte · vor 17 Min.", prio: "Hohe Priorität" },
    { id: "n-2", titel: "Neuer Urlaubsantrag wartet auf Genehmigung", text: `Frau Brandt beantragt Urlaub vom 12. bis 16.04.2027.`,
      meta: "Frau Brandt · vor 32 Min." },
    { id: "n-3", titel: "Neuer Urlaubsantrag wartet auf Genehmigung", text: `Herr Tal beantragt Urlaub vom 03. bis 07.05.2027.`,
      meta: `Herr Tal · vor 2${NBSP}Std.` },
  ];
  let bearbeiten = true;
  const entfernt = [];

  /* ---------- Darstellung ---------- */
  const r1 = $("raster1"), r2 = $("raster2"), marke = el("div", { class: "einfuegen", id: "einfuegen" }, r1);
  const fokusbar = e => { if (!PRINT) e.setAttribute("tabindex", "0"); };
  function entfernenLink(parent, k, gruppe) {
    const a = el("a", { class: "mk-link ent", role: "button", "aria-label": `${k.titel} entfernen` }, parent, "Entfernen");
    fokusbar(a);
    if (PRINT) return a;
    const tun = e => { e.preventDefault(); e.stopPropagation(); entfernen(k, gruppe); };
    a.addEventListener("click", tun);
    a.addEventListener("pointerdown", e => e.stopPropagation());
    a.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") tun(e); });
    return a;
  }
  function kachel(k) {
    const d = el("div", { class: "kachel" + (k.breit ? " breit" : ""), id: k.id, role: "group", "aria-label": k.titel }, r1);
    fokusbar(d);
    el("div", { class: "k-titel" }, d, k.titel);
    if (k.unter) el("div", { class: "k-unter" }, d, k.unter);
    if (k.balken) {
      const g = el("div", { class: "balken" }, d), max = Math.max(...k.balken.map(b => b[1]));
      k.balken.forEach(([n, v]) => {
        el("div", {}, g, n);
        const z = el("div", {}, g);
        el("div", { class: "b", style: `width:${Math.round(v / max * 120)}px` }, z);
        el("div", { class: "w" }, g, `${v}${NBSP}Mio.`);
      });
    }
    if (k.zahl) { el("div", { class: "k-einheit" }, d, k.einheit); el("div", { class: "k-zahl" }, d, k.zahl); }
    const f = el("div", { class: "k-fuss" }, d);
    entfernenLink(f, k, G1);
    if (!PRINT) {
      ziehbar(d, k, G1, r1);
      d.addEventListener("keydown", e => tasten(e, k, G1));
      d.addEventListener("click", () => { if (!bearbeiten) MK.meldung(`App „${k.titel}“ öffnen – in der Beispielmaske nicht hinterlegt.`); });
    }
  }
  function zeichnen() {
    r1.querySelectorAll(".kachel").forEach(e => e.remove());
    G1.forEach(kachel);
    const neu = el("div", { class: "kachel neu", id: "k-neu", role: "button" }, r1, "Kachel hinzufügen");
    fokusbar(neu);
    if (!PRINT) {
      neu.addEventListener("click", hinzufuegen);
      neu.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); hinzufuegen(); } });
    }
    r2.textContent = "";
    G2.forEach(k => {
      const d = el("div", { class: "link-kachel", id: k.id }, r2);
      fokusbar(d);
      el("a", { class: "mk-link" }, d, k.titel);
      entfernenLink(d, k, G2);
      if (!PRINT) {
        ziehbar(d, k, G2, r2);
        d.addEventListener("keydown", e => tasten(e, k, G2));
        d.addEventListener("click", () => { if (!bearbeiten) MK.meldung(`Link „${k.titel}“ öffnen – in der Beispielmaske nicht hinterlegt.`); });
      }
    });
    const n = $("nachrichten");
    n.textContent = "";
    if (!NACHRICHTEN.length) el("div", { class: "nachricht" }, n, "Keine Benachrichtigungen.");
    NACHRICHTEN.forEach(m => {
      const d = el("div", { class: "nachricht", id: m.id }, n);
      el("div", { class: "n-titel" }, d, m.titel);
      if (m.text) el("div", { class: "n-text" }, d, m.text);
      el("div", { class: "n-meta" }, d, m.meta);
      const z = el("div", { class: "n-meta" }, d);
      el("span", {}, z, m.prio || "");
      const a = el("a", { class: "mk-link", role: "button" }, z, "Ausblenden");
      fokusbar(a);
      if (!PRINT) {
        const weg = e => { e.preventDefault(); NACHRICHTEN = NACHRICHTEN.filter(x => x !== m); zeichnen(); MK.meldung("Benachrichtigung ausgeblendet."); };
        a.addEventListener("click", weg);
        a.addEventListener("keydown", e => { if (e.key === "Enter") weg(e); });
      }
    });
    if (MK._ebenenNeu) MK._ebenenNeu();
  }

  /* ---------- Entfernen, hinzufügen, verschieben ---------- */
  function entfernen(k, gruppe) {
    if (!bearbeiten) return;
    const i = gruppe.indexOf(k);
    if (i < 0) return;
    gruppe.splice(i, 1);
    entfernt.push([k, gruppe]);
    zeichnen();
    MK.meldung(`„${k.titel}“ entfernt – „Kachel hinzufügen“ nimmt sie wieder auf.`);
  }
  function hinzufuegen() {
    if (!bearbeiten) return;
    let k, g;
    if (entfernt.length) [k, g] = entfernt.pop();
    else if (KATALOG.length) { k = KATALOG.shift(); g = G1; }
    else { MK.meldung("Alle Apps des Katalogs sind bereits auf der Startseite."); return; }
    g.push(k);
    zeichnen();
    MK.meldung(`„${k.titel}“ ${g === G1 ? "als Kachel" : "als Link"} hinzugefügt.`);
    const d = $(k.id); if (d) d.focus();
  }
  function verschieben(gruppe, k, ziel) {
    const i = gruppe.indexOf(k);
    gruppe.splice(i, 1);
    gruppe.splice(Math.max(0, Math.min(ziel > i ? ziel - 1 : ziel, gruppe.length)), 0, k);
    zeichnen();
  }
  function tasten(e, k, gruppe) {
    if (!bearbeiten || e.target !== e.currentTarget) return;
    const i = gruppe.indexOf(k);
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      const z = e.key === "ArrowLeft" ? i - 1 : i + 2;
      if (z < 0 || z > gruppe.length) return;
      verschieben(gruppe, k, z);
      $(k.id).focus();
      MK.meldung(`„${k.titel}“ an Position ${gruppe.indexOf(k) + 1} verschoben.`);
    } else if (e.key === "Delete") { e.preventDefault(); entfernen(k, gruppe); }
  }
  function ziehbar(d, k, gruppe, raster) {
    d.addEventListener("pointerdown", e => {
      if (!bearbeiten || e.button !== 0) return;
      e.preventDefault();
      const x0 = e.clientX, y0 = e.clientY;
      let geist = null, ziel = null;
      const andere = () => gruppe.filter(x => x !== k).map(x => $(x.id));
      const bewegen = ev => {
        if (!geist && Math.hypot(ev.clientX - x0, ev.clientY - y0) < 5) return;
        const sk = $("seite").getBoundingClientRect().width / $("startseite").offsetWidth;
        if (!geist) {
          geist = el("div", { class: "kachel-geist" }, document.body, k.titel);
          geist.style.fontSize = 14 * sk + "px"; geist.style.lineHeight = 18 * sk + "px";
          geist.style.width = d.offsetWidth * sk + "px";
          d.classList.add("zieht");
        }
        geist.style.left = ev.clientX + 10 + "px"; geist.style.top = ev.clientY + 8 + "px";
        // Einfügestelle: vor der Kachel, über deren linker Hälfte der Zeiger steht, sonst dahinter
        ziel = null;
        const kand = andere();
        const R = raster.getBoundingClientRect();
        if (ev.clientX >= R.left - 20 && ev.clientX <= R.right + 20 && ev.clientY >= R.top - 20 && ev.clientY <= R.bottom + 20) {
          let best = null, dist = Infinity;
          kand.forEach(t => {
            const r = t.getBoundingClientRect();
            const dx = Math.max(r.left - ev.clientX, 0, ev.clientX - r.right), dy = Math.max(r.top - ev.clientY, 0, ev.clientY - r.bottom);
            const dd = Math.hypot(dx, dy);
            if (dd < dist) { dist = dd; best = [t, r]; }
          });
          if (best) {
            const [t, r] = best, vor = ev.clientX < r.left + r.width / 2;
            const idx = gruppe.findIndex(x => x.id === t.id) + (vor ? 0 : 1);
            ziel = idx;
            if (raster === r1) {
              const rr = r1.getBoundingClientRect();
              marke.style.display = "block";
              marke.style.left = ((vor ? r.left : r.right + 10 * sk) - rr.left) / sk + "px";
              marke.style.top = (r.top - rr.top) / sk + "px";
              marke.style.height = r.height / sk + "px";
            }
          }
        }
        if (ziel === null) marke.style.display = "none";
      };
      const ende = () => {
        removeEventListener("pointermove", bewegen); removeEventListener("pointerup", ende); removeEventListener("pointercancel", ende);
        marke.style.display = "none";
        if (!geist) return;
        geist.remove(); d.classList.remove("zieht");
        if (ziel !== null) {
          verschieben(gruppe, k, ziel);
          MK.meldung(`„${k.titel}“ an Position ${gruppe.indexOf(k) + 1} verschoben.`);
        }
      };
      addEventListener("pointermove", bewegen); addEventListener("pointerup", ende); addEventListener("pointercancel", ende);
    });
  }

  /* ---------- Modus, Reiter ---------- */
  function modus() {
    $("teile").classList.toggle("bearbeiten", bearbeiten);
    $("teile").classList.toggle("normal", !bearbeiten);
    $("k-fertig").textContent = bearbeiten ? "Fertig" : "Bearbeiten";
    $("kopf-unter").textContent = bearbeiten ? "Editiermodus · Gruppen und Kacheln anordnen, entfernen und hinzufügen" : "Startseite · Apps per Klick auf die Kachel öffnen";
    $("modus-hinweis").textContent = bearbeiten ? "Kacheln per Drag & Drop verschieben · „Entfernen“ nimmt eine Kachel aus der Gruppe"
      : "„Bearbeiten“ öffnet den Editiermodus";
    if (MK._ebenenNeu) MK._ebenenNeu();
  }
  $("k-fertig").addEventListener("click", () => {
    bearbeiten = !bearbeiten; modus();
    MK.meldung(bearbeiten ? "Editiermodus: Kacheln verschieben, entfernen oder hinzufügen." : `Änderungen gespeichert – ${G1.length} Kacheln und ${G2.length} Links auf der Startseite.`);
  });
  document.querySelectorAll("#reiter > span").forEach(s => {
    fokusbar(s);
    if (PRINT) return;
    const w = () => {
      document.querySelectorAll("#reiter > span").forEach(x => x.classList.toggle("aktiv", x === s));
      MK.meldung(s.dataset.gruppe === "g1" ? "Gruppe „Meine Startseite“." : `Reiter springt zur Gruppe „${s.textContent}“ – in der Beispielmaske ist nur „Meine Startseite“ ausgeführt.`);
    };
    s.addEventListener("click", w);
    s.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); w(); } });
  });
  zeichnen();
  modus();

  /* ---------- Lernplattform: Erläuterungen und Gestaltung ---------- */
  MK.ebenen({
    erlaeuterungen: {
      titel: "Erläuterungen",
      intro: "Wie Anwender ihre rollenbasierte Startseite selbst zusammenstellen. Verschieben Sie Kacheln per Drag & Drop, entfernen und ergänzen Sie Kacheln und beenden Sie den Editiermodus mit „Fertig“.",
      eintraege: [
        { nr: 1, ziel: "reiter", versatz: [-6, 2], titel: "Gruppen als Reiter",
          text: "Die Startseite ist in Gruppen gegliedert, z. B. „Meine Startseite“, „Nützliche Apps“ und eine Gruppe je Rolle wie „Innendienst Vertrieb“. Ein Reiter springt zur Gruppe." },
        { nr: 2, ziel: "g1-kopf", versatz: [-4, 0], titel: "Persönliche Gruppe",
          text: "Jede Kachel startet eine App. Welche Apps jemand sieht, hängt von seiner Rolle ab; innerhalb dieses Rahmens stellt er seine Startseite selbst zusammen – Self-Service statt fester Menüs." },
        { nr: 3, ziel: "k-teamkalender", versatz: [-4, 2], titel: "Kacheln mit Kennzahl",
          text: "Dynamische Kacheln zeigen eine aktuelle Zahl, etwa 35 offene Reiseanträge oder einen Termin heute. So erkennt man ohne Öffnen der App, wo etwas zu tun ist." },
        { nr: 4, ziel: "k-umsatz", versatz: [-4, 2], titel: "Diagramm- und Nachrichtenkacheln",
          text: "Breite Kacheln zeigen ein kleines Diagramm (Jahresumsätze je Region) oder eine Nachricht. Sie sind der Einstieg in die Analyse – Details liefert die App dahinter." },
        { nr: 5, ziel: "k-kunden", versatz: [-4, 2], titel: "Editiermodus: verschieben und entfernen",
          text: "Im Editiermodus lassen sich Kacheln per Drag & Drop (oder mit den Pfeiltasten) umordnen; „Entfernen“ nimmt eine Kachel aus der Gruppe, „Kachel hinzufügen“ holt Apps aus dem Katalog." },
        { nr: 6, ziel: "g2", versatz: [-4, -12], titel: "Link-Kacheln",
          text: "Eine zweite Gruppe enthält Apps als schlichte Links. Sie belegen weniger Platz und eignen sich für selten genutzte Anwendungen." },
        { nr: 7, ziel: "benachrichtigungen", versatz: [-4, 2], titel: "Benachrichtigungen",
          text: "Rechts stehen Meldungen aus den Prozessen, etwa geänderte Ansprechpartner oder Urlaubsanträge zur Genehmigung – mit Absender, Zeitpunkt und Priorität." },
        { nr: 8, ziel: "k-fertig", versatz: [-6, -12], titel: "Fertig",
          text: "„Fertig“ speichert die Anordnung und wechselt in die normale Ansicht; dann öffnet ein Klick auf eine Kachel die App. „Bearbeiten“ führt zurück in den Editiermodus." },
      ],
    },
    gestaltung: {
      titel: "Gestaltung",
      intro: "Was gegenüber dem Original geändert wurde – softwareneutral im Buchstil und nach den Interaktionsprinzipien der DIN EN ISO 9241-110.",
      eintraege: [
        { nr: "A", ziel: "kopf-titel", versatz: [-4, 4], regel: "BUCHSTIL – SOFTWARENEUTRAL", titel: "Keine Kopfleiste der Software",
          text: "Profilfoto, Logo, Such-, Benachrichtigungs- und Menüsymbole sowie der Hintergrund mit Farbverlauf entfallen; „Home“ ist die Titelzeile „Startseite“. Alle Texte sind übersetzt." },
        { nr: "B", ziel: "k-produkte", versatz: [-4, 2], regel: "BUCHSTIL – SOFTWARENEUTRAL", titel: "Kacheln ohne Icons",
          text: "Die blassen Symbole in den Kacheln (Person, Würfel, Kalender) entfallen; jede Kachel trägt ihren Titel und gegebenenfalls eine Zahl. Das Foto mit Abspielknopf der Nachrichtenkachel entfällt, die Schlagzeile bleibt." },
        { nr: "C", ziel: "k-umsatz", versatz: [-4, 2], regel: "BUCHSTIL – NEUTRAL UND AKTUELL", titel: "Balken ohne Ampelfarben",
          text: "Die grünen, roten und gelben Balken trugen keine Bedeutung und sind einheitlich anthrazit; „234M“ heißt „234 Mio.“, der Untertitel nennt die Einheit." },
        { nr: "D", ziel: "k-reise", versatz: [-4, 2], regel: "SELBSTBESCHREIBUNGSFÄHIGKEIT", titel: "Zahl mit Bedeutung",
          text: "Die Zahlen der Kacheln tragen jetzt ein Wort: „35 offen“, „1 heute“. Im Original standen 35 und 1 ohne Erläuterung." },
        { nr: "E", ziel: "k-kunden", versatz: [-4, 2], regel: "SELBSTBESCHREIBUNGSFÄHIGKEIT", titel: "Text statt Symbol",
          text: "Das Kreuz an jeder Kachel heißt „Entfernen“, das Plus „Kachel hinzufügen“; die Schaltfläche „…“ entfällt. So ist jede Aktion ohne Vorwissen verständlich." },
        { nr: "F", ziel: "n-1", versatz: [-4, -16], regel: "BUCHSTIL – NEUTRAL UND AKTUELL", titel: "Benachrichtigungen ohne Farbcode",
          text: "Die roten und grünen Randstreifen werden zu „Hohe Priorität“, Personenfotos entfallen; Blindtext und der Name aus der Vorlage sind durch fiktive Angaben (Frau Brandt, Herr Tal) ersetzt." },
        { nr: "G", ziel: "reiter", versatz: [-6, 2], regel: "ERWARTUNGSKONFORMITÄT", titel: "Reiter im Buchstil",
          text: "Der aktive Reiter ist anthrazit hinterlegt wie in den übrigen Masken; das Original unterstrich ihn nur blau." },
        { nr: "H", ziel: "k-fertig", versatz: [-6, -12], regel: "STEUERBARKEIT", titel: "Modus jederzeit wechseln",
          text: "„Fertig“ und „Bearbeiten“ wechseln zwischen Editier- und Normalansicht; Kacheln lassen sich ziehen oder mit Tabulator und Pfeiltasten verschieben, Entf entfernt sie, „Kachel hinzufügen“ macht das rückgängig." },
      ],
    },
  });
  MK.fertig();
})();
