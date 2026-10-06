#!/usr/bin/env python3
"""Rauchtest der interaktiven Maske.

Aufruf:  python3 test_maske.py out/Exemplarische_Praemissenplanung.html [--bilder out/test]
Prüft: JS-Fehler · gleiche Geometrie interaktiv und Druckfassung · jede Auswahl jedes Auswahlfelds
(danach Layoutprüfung, z. B. zu lange Texte) · Eingaben in alle Textfelder · Knöpfe · Ebenen mit Marken,
die keinen Text verdecken.
"""
import argparse
import os
import sys

GEOMETRIE = """() => {
  const m = document.querySelector('.mk-maske'), R = m.getBoundingClientRect(), s = R.width / m.offsetWidth;
  return [...m.querySelectorAll('.mk-feld, .mk-knopf, .mk-label, .mk-band, .mk-gruppenkopf, .mk-textbereich, .mk-check, .mk-check-druck')]
    .filter(e => e.offsetParent).map(e => { const r = e.getBoundingClientRect();
      return [e.className.baseVal !== undefined ? 'check' : e.className.split(' ')[0], (r.left - R.left) / s, (r.top - R.top) / s, r.width / s, r.height / s]; });
}"""

VERDECKT = """() => {
  const m = document.querySelector('.mk-maske'), out = [];
  const marken = [...document.querySelectorAll('.mk-marke')].map(e => [e.textContent, e.getBoundingClientRect()]);
  const tw = document.createTreeWalker(m, NodeFilter.SHOW_TEXT); let n;
  while ((n = tw.nextNode())) {
    if (!n.textContent.trim() || !n.parentElement.offsetParent) continue;
    const rg = document.createRange(); rg.selectNodeContents(n);
    for (const r of rg.getClientRects()) for (const [t, k] of marken)
      if (k.left < r.right - 1 && r.left < k.right - 1 && k.top < r.bottom - 1 && r.top < k.bottom - 1)
        out.push(`Marke ${t} verdeckt „${n.textContent.trim().slice(0, 30)}“`);
  }
  const S = document.getElementById('seite').getBoundingClientRect();
  for (const [t, k] of marken) if (k.right > S.right + 30 || k.left < S.left - 30) out.push(`Marke ${t} außerhalb der Maske`);
  return [...new Set(out)];
}"""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("html")
    ap.add_argument("--bilder", default=None)
    a = ap.parse_args()
    from playwright.sync_api import sync_playwright
    url = "file://" + os.path.abspath(a.html)
    fehler, probleme = [], []
    if a.bilder:
        os.makedirs(a.bilder, exist_ok=True)
    with sync_playwright() as p:
        b = p.chromium.launch()
        # Geometrie: interaktiv gegen Druckfassung
        s = b.new_page(viewport={"width": 1500, "height": 1000})
        s.on("pageerror", lambda e: fehler.append(str(e)))
        s.goto(url + "?print"); s.wait_for_timeout(200)
        druck = s.evaluate(GEOMETRIE)
        s.close()
        s = b.new_page(viewport={"width": 1500, "height": 1000})
        s.on("pageerror", lambda e: fehler.append(str(e)))
        s.on("console", lambda m: fehler.append(m.text) if m.type == "error" else None)
        s.goto(url); s.wait_for_timeout(200)
        inter = s.evaluate(GEOMETRIE)
        if len(druck) != len(inter):
            probleme.append(f"Geometrie: {len(inter)} Elemente interaktiv, {len(druck)} im Druck")
        else:
            abw = [(i, d, g) for i, (d, g) in enumerate(zip(druck, inter)) if max(abs(x - y) for x, y in zip(d[1:], g[1:])) > 0.6]
            for i, d, g in abw[:5]:
                probleme.append(f"Geometrie weicht ab: {d[0]} Nr. {i} Druck {[round(v) for v in d[1:]]} interaktiv {[round(v) for v in g[1:]]}")
        print(("ok   " if not probleme else "FEHL ") + f"Geometrie interaktiv = Druck ({len(inter)} Elemente)")
        if a.bilder:
            s.screenshot(path=os.path.join(a.bilder, "interaktiv.png"))

        # Auswahlfelder: jede Option, danach Layoutprüfung und zurück
        n_opt = 0
        for i in range(s.locator(".mk-maske select").count()):
            sel = s.locator(".mk-maske select").nth(i)
            if not sel.is_visible():
                continue
            start = sel.input_value()
            for v in sel.locator("option").evaluate_all("o => o.map(x => x.value)"):
                sel.select_option(v); n_opt += 1
                for pr in s.evaluate("() => MK.pruefen()"):
                    probleme.append(f"Auswahl „{v}“: {pr}")
            sel.select_option(start)
        print(f"ok   Auswahlfelder: {n_opt} Optionen durchgespielt")

        # Textfelder: Eingabe und Wiederherstellung
        felder = s.locator(".mk-maske input.mk-feld")
        n_in = 0
        for i in range(felder.count()):
            f = felder.nth(i)
            if not f.is_visible() or f.is_disabled() or f.get_attribute("readonly") is not None:
                continue
            alt = f.input_value()
            f.fill("2,0" if "mk-zahl" in (f.get_attribute("class") or "") else alt or "Test")
            f.fill(alt); f.blur(); n_in += 1
        for pr in s.evaluate("() => MK.pruefen()"):
            probleme.append(f"Nach Eingaben: {pr}")
        print(f"ok   Eingaben: {n_in} Felder")

        # Knöpfe
        for i in range(s.locator(".mk-maske button").count()):
            k = s.locator(".mk-maske button").nth(i)
            if k.is_visible():
                k.click(); s.wait_for_timeout(50)
        s.keyboard.press("Escape")

        # Ebenen
        for name in ("Erläuterungen", "Gestaltung"):
            k = s.locator(".mk-leiste button", has_text=name)
            if not k.count():
                continue
            k.click(); s.wait_for_timeout(250)
            n_e = s.locator(".mk-panel .mk-eintrag").count()
            n_m = s.locator(".mk-marke").count()
            if n_e != n_m:
                probleme.append(f"Ebene {name}: {n_e} Einträge, aber {n_m} Marken (Ziel fehlt?)")
            probleme += [f"Ebene {name}: {t}" for t in s.evaluate(VERDECKT)]
            if a.bilder:
                s.screenshot(path=os.path.join(a.bilder, ("erlaeuterungen" if name.startswith("Erl") else "gestaltung") + ".png"))
            print(f"ok   Ebene: {name} ({n_e} Einträge)")
            k.click(); s.wait_for_timeout(100)
        b.close()
    probleme = [f"JS-Fehler: {f}" for f in fehler] + probleme
    if probleme:
        print("\nPROBLEME:")
        for pr in dict.fromkeys(probleme):
            print("  ", pr)
        sys.exit(1)
    print("Keine Probleme.")


if __name__ == "__main__":
    main()
