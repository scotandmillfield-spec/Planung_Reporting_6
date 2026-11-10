/* Abb. 5.82 „Workflowkomponente“ – Logik der Maske „Status überprüfen und Prozess verwalten“.
   Je Planungseinheit (Szenario x Version x Einheit): Teilnahme am Planzyklus (Starten/Ausschließen), Prozessstatus und
   aktueller Eigentümer. Status: Nicht gestartet › Erste Bearbeitung › Wird überprüft › Genehmigt (Zurückgewiesen wie
   Erste Bearbeitung). Summenknoten zeigen den am wenigsten fortgeschrittenen Status ihrer gestarteten Einheiten
   (wie im Original: Europa „Wird überprüft“, weil Deutschland noch überprüft wird; Asien „Genehmigt“).
   Details: Aktionen je nach Status – Weiterleiten (an den nächsten Eigentümer, aus der Bearbeitung in die Überprüfung),
   Genehmigen, Zurückweisen; jede Aktion wird mit Person, Datum, Uhrzeit und Anmerkung im Verlauf protokolliert.
   An einem Summenknoten wirken Genehmigen und Zurückweisen auf alle darunterliegenden Einheiten.
   Druckfassung: Version Bottom-up, Baumstruktur, Details der Einheit Deutschland mit der Aktion „Weiterleiten“. */
(() => {
  "use strict";
  const { el, sv } = MK;
  MK.init({ titel: "Workflowkomponente" });
  const $ = id => document.getElementById(id);

  // <daten> erzeugt von ../Hyperion_Planning_Mehrdimensionale_Planungsformulare/daten_planungsmodell.py – nicht von Hand ändern
const DATEN = {"stand":"14.10.2027","jahrPlan":2028,"baum":["Konzern",[["Europa",["Deutschland","Großbritannien","Dänemark","Polen","Russland","Frankreich","Österreich","Schweiz"]],["Amerika",["USA","Kanada","Brasilien"]],["Asien",["Australien","China","Hongkong","Japan","Neuseeland","Singapur"]]]],"aktiv":["Deutschland","Großbritannien","USA","Australien","Japan"],"workflow":{"Konzern":["Wird überprüft",null],"Europa":["Wird überprüft","brandt"],"Deutschland":["Wird überprüft","brandt"],"Großbritannien":["Genehmigt","albers"],"Amerika":["Wird überprüft","kaya"],"USA":["Wird überprüft","kaya"],"Asien":["Genehmigt","albers"],"Australien":["Genehmigt","albers"],"Japan":["Genehmigt","albers"]},"verlauf":{"Deutschland":[["01.10.2027","08:12","albers","Planzyklus gestartet","Erste Bearbeitung","roth",""],["13.10.2027","12:04","roth","Weitergeleitet","Wird überprüft","brandt","Bitte um Feedback."]],"Großbritannien":[["01.10.2027","08:12","albers","Planzyklus gestartet","Erste Bearbeitung","albers",""],["08.10.2027","16:30","albers","Genehmigt","Genehmigt","albers","Freigabe ohne Änderungen."]],"USA":[["01.10.2027","08:14","albers","Planzyklus gestartet","Erste Bearbeitung","kaya",""],["12.10.2027","18:45","kaya","Weitergeleitet","Wird überprüft","kaya",""]],"Australien":[["01.10.2027","08:15","albers","Planzyklus gestartet","Erste Bearbeitung","albers",""],["11.10.2027","09:05","albers","Genehmigt","Genehmigt","albers",""]],"Japan":[["01.10.2027","08:15","albers","Planzyklus gestartet","Erste Bearbeitung","albers",""],["11.10.2027","09:20","albers","Genehmigt","Genehmigt","albers",""]]},"personen":{"albers":["Herr Albers","Konzerncontrolling"],"brandt":["Frau Brandt","Controlling Deutschland"],"roth":["Herr Roth","Kostenstellenleitung Deutschland"],"kaya":["Frau Kaya","Controlling Amerika"]},"benutzer":"albers"};
// </daten>

  const D = DATEN, person = k => (k ? D.personen[k][0] : null);
  const RANG = { "Nicht gestartet": 0, "Erste Bearbeitung": 1, "Zurückgewiesen": 1, "Wird überprüft": 2, "Genehmigt": 3 };

  /* ---------- Einheiten (Baum) ---------- */
  const U = [];                                       // {name, ebene, eltern, kinder}
  (function baum(knoten, ebene, eltern) {
    const [name, kinder] = Array.isArray(knoten) ? knoten : [knoten, null];
    const i = U.length; U.push({ name, ebene, eltern, kinder: [] });
    if (eltern !== null) U[eltern].kinder.push(i);
    (kinder || []).forEach(k => baum(k, ebene + 1, i));
  })(D.baum, 0, null);
  const blatt = i => !U[i].kinder.length;
  const blaetter = i => (blatt(i) ? [i] : U[i].kinder.flatMap(blaetter));
  const idx = name => U.findIndex(u => u.name === name);

  /* ---------- Zustand je Version ---------- */
  const ZUSTAND = {};
  function zustand() {
    const v = $("f-version").value;
    if (!ZUSTAND[v]) {
      const z = U.map(u => ({ start: false, status: "Nicht gestartet", eigner: null, verlauf: [] }));
      U.forEach((u, i) => {
        if (v === "BU") {
          const w = D.workflow[u.name];
          if (w) { z[i].status = w[0]; z[i].eigner = w[1]; z[i].start = true; }
          z[i].verlauf = (D.verlauf[u.name] || []).map(e => e.slice());
        } else if (D.aktiv.includes(u.name) || !blatt(i) && blaetter(i).some(b => D.aktiv.includes(U[b].name))) {
          z[i].start = true; z[i].status = "Genehmigt"; z[i].eigner = "albers";
          if (blatt(i)) z[i].verlauf = [["30.06.2027", "10:00", "albers", "Genehmigt", "Genehmigt", "albers", "Top-down-Vorgabe freigegeben."]];
        }
      });
      ZUSTAND[v] = z;
    }
    return ZUSTAND[v];
  }
  // Status und Teilnahme der Summenknoten aus den Einheiten darunter
  function status(i) {
    const z = zustand();
    if (blatt(i)) return z[i].start ? z[i].status : "Nicht gestartet";
    const s = U[i].kinder.map(status).filter(x => x !== "Nicht gestartet");
    if (!s.length) return "Nicht gestartet";
    const min = Math.min(...s.map(x => RANG[x]));
    return s.find(x => RANG[x] === min && x === "Zurückgewiesen") || s.find(x => RANG[x] === min);
  }
  const gestartet = i => status(i) !== "Nicht gestartet";

  /* ---------- Raster ---------- */
  const raster = $("raster");
  const pos = (r, c) => `grid-row:${r};grid-column:${c}`;
  const offen = new Set(U.map((_, i) => i).filter(i => !blatt(i)));
  let gewaehlt = idx("Deutschland");
  function dreieck(auf) {
    const s = sv("svg", { width: 8, height: 8, viewBox: "0 0 8 8", "aria-hidden": "true" });
    sv("polygon", { points: auf ? "0,2 8,2 4,7" : "2,0 7,4 2,8", fill: "#3A3F44" }, s);
    return s;
  }
  function sichtbar() {
    if ($("o-flach").checked) return U.map((_, i) => i).sort((a, b) => U[a].name.localeCompare(U[b].name, "de"));
    const out = [];
    (function gehe(i) { out.push(i); if (offen.has(i)) U[i].kinder.forEach(gehe); })(0);
    return out;
  }
  function aufbauen() {
    raster.querySelectorAll(".zeile").forEach(e => e.remove());
    const z = zustand(), flach = $("o-flach").checked;
    sichtbar().forEach((i, j) => {
      const r = 3 + j, u = U[i], st = status(i), start = gestartet(i);
      const lab = el("div", { class: "mx-l zeile" + (blatt(i) ? "" : " summe") + (i === gewaehlt ? " gewaehlt" : ""), id: "e" + i,
                              style: pos(r, 1) + `;padding-left:${4 + (flach ? 0 : u.ebene * 16)}px` }, raster);
      const b = el("span", { class: "baum" }, lab);
      if (!flach && !blatt(i)) {
        b.appendChild(dreieck(offen.has(i)));
        if (!MK.PRINT) b.addEventListener("click", () => { offen.has(i) ? offen.delete(i) : offen.add(i); aufbauen(); });
        b.title = offen.has(i) ? "Zuklappen" : "Aufklappen";
      }
      lab.appendChild(document.createTextNode(u.name));
      [["s", true], ["a", false]].forEach(([k, wert], c) => {
        const zelle = el("div", { class: "mx-l mitte zeile", style: pos(r, 2 + c) }, raster);
        const o = el("input", { type: "radio", class: "mk-check", name: "pz" + i, id: `pz${k}${i}`,
          "aria-label": `${u.name}: ${wert ? "Planzyklus starten" : "aus dem Planzyklus ausschließen"}` }, zelle);
        o.checked = start === wert;
        o.addEventListener("change", () => zyklus(i, wert));
      });
      el("div", { class: "mx-l zeile" + (start ? "" : " leise"), id: "st" + i, style: pos(r, 4) }, raster, st);
      const ow = blatt(i) ? z[i].eigner : (z[i].eigner || null);
      el("div", { class: "mx-l zeile" + (ow ? "" : " leise"), id: "ow" + i, style: pos(r, 5) }, raster, ow ? person(ow) : "kein Eigentümer");
      const ak = el("div", { class: "mx-l zeile", id: "ak" + i, style: pos(r, 6) }, raster);
      if (start) {
        const a = el("a", { class: "mk-link", id: "dl" + i }, ak, "Details");
        a.addEventListener("click", () => { gewaehlt = i; aufbauen(); });
      }
    });
    details();
    if (MK.skalieren) MK.skalieren();
    if (MK._ebenenNeu) MK._ebenenNeu();
  }

  /* ---------- Planzyklus starten oder ausschließen ---------- */
  const jetzt = () => { const d = new Date(), zz = n => String(n).padStart(2, "0"); return [D.stand, `${zz(d.getHours())}:${zz(d.getMinutes())}`]; };
  function zyklus(i, start) {
    const z = zustand(), [dat, zeit] = jetzt();
    blaetter(i).forEach(b => {
      if (z[b].start === start) return;
      z[b].start = start; z[b].status = start ? "Erste Bearbeitung" : "Nicht gestartet"; z[b].eigner = null;
      z[b].verlauf.push([dat, zeit, D.benutzer, start ? "Planzyklus gestartet" : "Aus dem Planzyklus ausgeschlossen", z[b].status, null, ""]);
    });
    if (!start && !gestartet(gewaehlt)) gewaehlt = i;
    aufbauen();
    MK.meldung(`${U[i].name}: ${start ? "Planzyklus gestartet" : "aus dem Planzyklus ausgeschlossen"}${blatt(i) ? "" : " (alle Einheiten darunter)"}.`);
  }

  /* ---------- Details ---------- */
  const AKTIONEN = { "Nicht gestartet": [], "Erste Bearbeitung": ["Weiterleiten"], "Zurückgewiesen": ["Weiterleiten"],
                     "Wird überprüft": ["Weiterleiten", "Genehmigen", "Zurückweisen"], "Genehmigt": ["Zurückweisen"] };
  Object.entries(D.personen).forEach(([k, [n]]) => el("option", k === "albers" ? { value: k, selected: "" } : { value: k }, $("d-neu"), n));
  function details() {
    const z = zustand(), i = gewaehlt, st = status(i);
    $("d-einheit").textContent = U[i].name + (blatt(i) ? "" : " (Summe)");
    $("d-status").textContent = st;
    $("d-eigner").textContent = z[i].eigner ? person(z[i].eigner) : "kein Eigentümer";
    const sel = $("d-aktion"), alt = sel.value;
    sel.textContent = "";
    const ak = AKTIONEN[st];
    if (!ak.length) el("option", { value: "" }, sel, "keine Aktion möglich");
    ak.forEach(a => el("option", a === alt ? { value: a, selected: "" } : { value: a }, sel, a));
    if (ak.includes("Weiterleiten") && !ak.includes(alt)) sel.value = "Weiterleiten";
    const L = $("verlauf");
    L.textContent = "";
    const eintraege = blatt(i) ? z[i].verlauf : [];
    $("kopf-verlauf").textContent = `Verlauf ${U[i].name}`;
    if (!eintraege.length) { el("p", { class: "meta" }, L, blatt(i) ? "Noch keine Aktionen." : "Der Verlauf wird je Einheit geführt; Genehmigen und Zurückweisen wirken hier auf alle Einheiten darunter."); return; }
    eintraege.forEach(([dat, zeit, wer, aktion, neu, eigner, anm]) => {
      const e = el("div", { class: "eintrag" }, L);
      el("p", { class: "titel" }, e, `${dat}, ${zeit} Uhr · ${aktion}`);
      el("p", { class: "meta" }, e, `${person(wer)} · Status ${neu}` + (eigner ? `, Eigentümer ${person(eigner)}` : ""));
      if (anm) el("p", {}, e, `„${anm}“`);
    });
  }
  $("k-ausfuehren").addEventListener("click", () => {
    const z = zustand(), i = gewaehlt, a = $("d-aktion").value, neu = $("d-neu").value, anm = $("d-anm").value.trim();
    if (!a) { MK.meldung(`${U[i].name}: In diesem Status ist keine Aktion möglich.`); return; }
    const [dat, zeit] = jetzt();
    const ziele = blatt(i) ? [i] : blaetter(i).filter(b => z[b].start);
    if (a === "Weiterleiten" && !blatt(i)) { z[i].eigner = neu; }
    ziele.forEach(b => {
      const st = z[b].status;
      if (a === "Weiterleiten") { z[b].status = "Wird überprüft"; z[b].eigner = neu; }
      else if (a === "Genehmigen") { if (st !== "Wird überprüft") return; z[b].status = "Genehmigt"; z[b].eigner = D.benutzer; }
      else { if (st !== "Wird überprüft" && st !== "Genehmigt") return; z[b].status = "Zurückgewiesen"; z[b].eigner = neu; }
      z[b].verlauf.push([dat, zeit, D.benutzer, a === "Weiterleiten" ? "Weitergeleitet" : a === "Genehmigen" ? "Genehmigt" : "Zurückgewiesen", z[b].status, z[b].eigner, anm]);
    });
    aufbauen();
    const an = n => person(n).replace(/^Herr /, "Herrn ");          // Dativ: „an Herrn Albers“
    MK.meldung(`${U[i].name}: ${a === "Weiterleiten" ? "weitergeleitet an " + an(neu) : a === "Genehmigen" ? "genehmigt" : "zurückgewiesen an " + an(neu)}.`);
  });

  /* ---------- Auswahl ---------- */
  $("f-version").addEventListener("change", () => { if (!gestartet(gewaehlt)) gewaehlt = idx("Deutschland"); aufbauen(); });
  ["o-baum", "o-flach"].forEach(id => $(id).addEventListener("change", aufbauen));
  aufbauen();

  /* ---------- Lernplattform: Erläuterungen und Gestaltung ---------- */
  const DE = idx("Deutschland"), EU = idx("Europa"), AS = idx("Asien");
  MK.ebenen({
    erlaeuterungen: {
      titel: "Erläuterungen",
      intro: "Wie die Workflowkomponente den Planungsprozess über alle Gesellschaften steuert. Die Nummern in der Maske zeigen, wo.",
      eintraege: [
        { nr: 1, ziel: "e" + EU, versatz: [-4, 3], titel: "Planungseinheiten im Gesellschaftsbaum",
          text: "Der Workflow läuft je Planungseinheit – Szenario, Version und Einheit. Die Einheiten stehen im Gesellschaftsbaum wie in der Konsolidierung: Konzern › Region › Gesellschaft." },
        { nr: 2, ziel: "h-zyklus", versatz: [-6, 0], titel: "Planzyklus starten oder ausschließen",
          text: "Die zentrale Planung legt fest, welche Einheiten am Planzyklus teilnehmen. Ausgeschlossene Einheiten haben keine Planwerte – deshalb bieten die Auswertungen (Abb. 5.80) nur fünf Gesellschaften an. Starten Sie z. B. Dänemark." },
        { nr: 3, ziel: "h-status", versatz: [-4, 20], titel: "Prozessstatus",
          text: "Jede Einheit durchläuft Erste Bearbeitung, Überprüfung und Genehmigung. Summenknoten zeigen den am wenigsten fortgeschrittenen Status darunter: Europa wird überprüft, solange Deutschland nicht genehmigt ist." },
        { nr: 4, ziel: "ow" + DE, versatz: [-4, 3], titel: "Aktueller Eigentümer",
          text: "Der Eigentümer bearbeitet die Planungseinheit; alle anderen sehen sie nur. So ist jederzeit klar, wer am Zug ist – hier Frau Brandt aus dem Controlling Deutschland." },
        { nr: 5, ziel: "ak" + DE, versatz: [12, 3], titel: "Aktion – Details",
          text: "Über „Details“ öffnet sich die Planungseinheit mit den Aktionen, die ihr Status erlaubt. Eine Einheit in Überprüfung lässt sich weiterleiten, genehmigen oder zurückweisen." },
        { nr: 6, ziel: "d-neu", versatz: [-4, 2], titel: "Weiterleiten",
          text: "Weiterleiten übergibt die Planungseinheit an den nächsten Eigentümer, hier an Herrn Albers im Konzerncontrolling zur Genehmigung. Die Anmerkung geht in den Verlauf ein." },
        { nr: 7, ziel: "g-verlauf", versatz: [-4, 2], titel: "Verlauf",
          text: "Jede Aktion wird mit Person, Datum, Uhrzeit, neuem Status und Anmerkung protokolliert – der Planungsprozess bleibt nachvollziehbar. Führen Sie die Aktion aus: Der Verlauf wächst." },
        { nr: 8, ziel: "f-version", anker: "links", versatz: [0, 2], titel: "Workflow je Version",
          text: "Jede Version hat einen eigenen Workflow. Die Top-down-Vorgaben sind bereits genehmigt, die Bottom-up-Planung ist noch in Arbeit." },
      ],
    },
    gestaltung: {
      titel: "Gestaltung",
      intro: "Was gegenüber dem Original geändert wurde – softwareneutral im Buchstil und nach den Interaktionsprinzipien der DIN EN ISO 9241-110.",
      eintraege: [
        { nr: "A", ziel: "kopf", versatz: [-6, 8], regel: "BUCHSTIL – SOFTWARENEUTRAL", titel: "Kein Browserfenster, kein Produktname",
          text: "Browserfenster mit Adresszeile, Menü- und Symbolleiste, Produktname mit Firmenplatzhalter, Navigationsleisten (Eingabe, Workflow, Verwaltung) und Statuszeile entfallen; die Maske heißt wie im Original." },
        { nr: "B", ziel: "h-status", versatz: [-4, 20], regel: "SELBSTBESCHREIBUNGSFÄHIGKEIT", titel: "Status in Worten statt Farben",
          text: "Das Original färbte den Status grün, blau und rot. Jetzt trägt allein der Text die Bedeutung; nicht gestartete Einheiten sind grau – auch im Graustufendruck eindeutig." },
        { nr: "C", ziel: "band-details", versatz: [-24, 2], regel: "AUFGABENANGEMESSENHEIT", titel: "Details in der Maske",
          text: "Der Link „Details“ öffnete eine eigene Seite. Jetzt stehen Status, Eigentümer, die erlaubten Aktionen und der Verlauf der gewählten Einheit direkt unter dem Raster." },
        { nr: "D", ziel: "ow" + EU, versatz: [-4, 3], regel: "BUCHSTIL – NEUTRAL UND AKTUELL", titel: "Namen statt Benutzerkennungen",
          text: "„CO_D“, „CO_USA“ und „admin“ heißen Frau Brandt, Frau Kaya und Herr Albers (fiktiv); Szenario und Version „PLAN/REALCASE“ heißen Plan 2028 und Bottom-up." },
        { nr: "E", ziel: "e" + AS, versatz: [-4, 3], regel: "ERWARTUNGSKONFORMITÄT", titel: "Gewohnte Bedienelemente",
          text: "Klappdreiecke statt Plus- und Minuskästchen, Auswahlfelder mit Pfeil rechts; die Version lädt bei der Auswahl, der Knopf „Navigation“ entfällt." },
        { nr: "F", ziel: "g-anzeige", versatz: [-4, 2], regel: "BUCHSTIL – NEUTRAL UND AKTUELL", titel: "Einheitliche Bezeichnungen",
          text: "„Summe Europa“ heißt Europa wie in den Auswertungen, „Grossbritannien“ Großbritannien, „New Zealand“ Neuseeland; der Wurzelknoten „Gesellschaften“ entfällt, der Baum beginnt beim Konzern." },
        { nr: "G", ziel: "d-aktion", anker: "links", versatz: [0, 2], regel: "ROBUSTHEIT GEGEN BENUTZUNGSFEHLER", titel: "Nur erlaubte Aktionen",
          text: "Die Liste bietet nur Aktionen an, die der Status zulässt – eine genehmigte Einheit kann nur zurückgewiesen werden, eine nicht gestartete gar nicht bearbeitet." },
        { nr: "H", ziel: "d-status", anker: "links", versatz: [0, 2], regel: "SELBSTBESCHREIBUNGSFÄHIGKEIT", titel: "Eingabe und Anzeige unterscheidbar",
          text: "Einheit, Status und Eigentümer sind graue Anzeigefelder, Aktion, nächster Eigentümer und Anmerkung weiße Eingaben; die gewählte Einheit ist im Raster hinterlegt." },
      ],
    },
  });
  MK.fertig();
})();
