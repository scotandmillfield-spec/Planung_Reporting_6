#!/usr/bin/env python3
"""Rauchtest der Lernplattform-Ansicht eines Dashboards (HTML ohne ?print).

Aufruf:  python3 test_interaktion.py out/abb_3-4.html [--bilder out/test_abb_3-4]

Prüft: keine JS-Fehler · jeder Datenschnitt (Knöpfe, Dropdowns) lässt sich bedienen · der erste klickbare
Eintrag je Visual löst eine Auswahl aus (Elemente werden blass) und Esc hebt sie auf · Tooltip erscheint ·
Designregeln, Nachbau und Tabelle öffnen ein Panel, alle Marken liegen auf der Berichtsseite · CSV-Download
ist nicht leer. Mit --bilder werden Bildschirmfotos der Ebenen abgelegt. Exit 1 bei Problemen.
"""
import argparse
import os
import sys
import tempfile

from playwright.sync_api import sync_playwright


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("html")
    ap.add_argument("--bilder", default="")
    a = ap.parse_args()
    url = "file://" + os.path.abspath(a.html)
    fehler, probleme, ok = [], [], []
    if a.bilder:
        os.makedirs(a.bilder, exist_ok=True)
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={"width": 1440, "height": 860}, accept_downloads=True)
        pg.on("pageerror", lambda e: fehler.append(str(e)))
        pg.on("console", lambda m: fehler.append(m.text) if m.type == "error" else None)
        pg.goto(url)
        pg.wait_for_timeout(300)
        blass = lambda: pg.locator("#seite .dk-blass").count()

        # Datenschnitte: Knopfgruppen und Dropdowns
        for gi in range(pg.locator("#seite .dk-knoepfe").count()):
            g = pg.locator("#seite .dk-knoepfe").nth(gi)
            knoepfe = g.locator("button")
            start = next((i for i in range(knoepfe.count()) if knoepfe.nth(i).get_attribute("aria-pressed") == "true"), 0)
            for i in range(knoepfe.count()):
                knoepfe.nth(i).click()
                pg.wait_for_timeout(60)
            knoepfe.nth(start).click()
        for si in range(pg.locator("#seite select").count()):
            s = pg.locator("#seite select").nth(si)
            werte = s.locator("option").evaluate_all("os => os.map(o => o.value)")
            start = s.input_value()
            for w in werte:
                s.select_option(w)
                pg.wait_for_timeout(60)
            s.select_option(start)
        ok.append("Datenschnitte bedient")

        # Auswahl je Visual, Esc, Tooltip
        boxen = pg.locator("#seite > .dk-abs")
        for bi in range(boxen.count()):
            box = boxen.nth(bi)
            ziel = box.locator("g.dk-klick > [fill=transparent], tr.dk-zeile").first
            if not box.locator("g.dk-klick > [fill=transparent], tr.dk-zeile").count():
                continue
            name = box.get_attribute("id") or f"Box {bi}"
            ziel.dispatch_event("click")
            pg.wait_for_timeout(120)
            if blass() == 0:
                probleme.append(f"{name}: Klick löst keine sichtbare Auswahl aus")
            pg.keyboard.press("Escape")
            pg.wait_for_timeout(120)
            if blass() != 0:
                probleme.append(f"{name}: Esc hebt die Auswahl nicht auf")
            ziel = box.locator("g.dk-klick > [fill=transparent], tr.dk-zeile").first
            ziel.dispatch_event("pointermove", {"clientX": 200, "clientY": 200})
            pg.wait_for_timeout(60)
            tip = pg.locator(".dk-tooltip")
            if not tip.is_visible() or not tip.inner_text().strip():
                probleme.append(f"{name}: kein Tooltip")
            ziel.dispatch_event("pointerleave")
            ok.append(f"Auswahl, Esc, Tooltip: {name}")

        # Ebenen der Lernplattform
        seite = lambda: pg.locator("#seite").bounding_box()
        for knopf, marken in [("Designregeln", True), ("Nachbau in Power BI", True), ("Werte als Tabelle", False)]:
            k = pg.get_by_role("button", name=knopf, exact=True)
            if not k.count():
                probleme.append(f"Knopf fehlt: {knopf}")
                continue
            k.click()
            pg.wait_for_timeout(300)
            if not pg.locator(".dk-panel").is_visible() or len(pg.locator(".dk-panel").inner_text()) < 40:
                probleme.append(f"{knopf}: Panel leer")
            if marken:
                s = seite()
                n = pg.locator(".dk-marke").count()
                if n == 0:
                    probleme.append(f"{knopf}: keine Marken")
                for i in range(n):
                    r = pg.locator(".dk-marke").nth(i).bounding_box()
                    if r["x"] < s["x"] - 1 or r["y"] < s["y"] - 1 or r["x"] + r["width"] > s["x"] + s["width"] + 1 \
                            or r["y"] + r["height"] > s["y"] + s["height"] + 1:
                        probleme.append(f"{knopf}: Marke {pg.locator('.dk-marke').nth(i).inner_text()} ragt aus der Seite")
            if a.bilder:
                pg.screenshot(path=os.path.join(a.bilder, knopf.split()[0].lower() + ".png"))
            k.click()
            pg.wait_for_timeout(150)
            ok.append(f"Ebene: {knopf}")

        # CSV
        k = pg.get_by_role("button", name="Daten (CSV)", exact=True)
        if k.count():
            with pg.expect_download() as d:
                k.click()
            pfad = os.path.join(tempfile.mkdtemp(), d.value.suggested_filename)
            d.value.save_as(pfad)
            zeilen = open(pfad, encoding="utf-8-sig").read().splitlines()
            if len(zeilen) < 2 or ";" not in zeilen[0]:
                probleme.append("CSV leer oder ohne Semikolon")
            else:
                ok.append(f"CSV: {d.value.suggested_filename}, {len(zeilen) - 1} Datensätze")
        else:
            probleme.append("Knopf fehlt: Daten (CSV)")
        b.close()

    for o in ok:
        print("ok  ", o)
    probleme += [f"JS-Fehler: {f}" for f in fehler]
    if probleme:
        print("\nPROBLEME:")
        for x in probleme:
            print("  ", x)
        sys.exit(1)
    print("Keine Probleme.")


if __name__ == "__main__":
    main()
