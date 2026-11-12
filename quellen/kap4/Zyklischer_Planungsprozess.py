"""Abb. 4.13 – Zyklischer Planungsprozess."""
# Muster (identisch mit Abb. 4.17 Zyklischer Reportingprozess): Phasen links als senkrechte Kette (box_hi, fett)
# mit Pfeilen, Tätigkeiten je Phase rechts daneben als Aufzählung. Der Rückpfeil von der letzten zur ersten
# Phase entfällt auf Wunsch der Prüfer (Revision 11/2026). Bildtitel „Zyklischer Planungsprozess:“ entfällt (steht in der Caption).
STEM = "Zyklischer_Planungsprozess"
from bookfig import Fig, P

W = 110
PHASEN = [
    ("Planungsvorbereitung", [
        "Terminplan",
        "Systemeinstellungen",
        "Beschaffung und Transformation der Vorgabe- und Orientierungswerte zur Planung",
        "Bereitstellung der Planungsformulare und Planungsfunktionen",
    ]),
    ("Planungsdurchführung", [
        "Ausführen der automatischen Planungsfunktionen und der manuellen Planungseingaben",
        "Plausibilisierung und Prüfung der Planungsergebnisse",
        "Kommentierung zur Planung",
    ]),
    ("Abstimmung und Genehmigung der Planung", [
        "Präsentation, Diskussion und Abstimmung der Planungsinhalte",
        "Pflege und Korrektur der Änderungen",
        "Genehmigung der Planung",
        "Fixierung der Planung",
    ]),
]

# ---- gemeinsame Geometrie mit Abb. 4.17 ----
XR = W - 0.3
PX, PW = 0.3, 31.0               # Phasenspalte
AX = PX + PW + 1.6               # Tätigkeiten
AW = XR - AX
GAP = 4.2                        # Abstand der Phasen (Pfeil)
MIN_H = 9.0
INS_A = (1.4, 1.0)


def taetigkeiten(liste):
    return [P(s, bullet="•", align="l") for s in liste]


def build(theme):
    tmp = Fig(W, 30, theme)
    hs = []
    for ph, liste in PHASEN:
        h = max(tmp.measure([P(ph, bold=True)], PW), tmp.measure(taetigkeiten(liste), AW, ins=INS_A), MIN_H)
        hs.append(round(h + 0.6, 2))
    ys = [0.3]
    for h in hs[:-1]:
        ys.append(ys[-1] + h + GAP)
    H = round(ys[-1] + hs[-1] + 0.3, 1)
    f = Fig(W, H, theme, STEM)
    pcx = PX + PW / 2
    for i, ((ph, liste), y, h) in enumerate(zip(PHASEN, ys, hs)):
        f.box(PX, y, PW, h, [P(ph, bold=True)], role="box_hi", name=f"Phase {ph}")
        f.box(AX, y, AW, h, taetigkeiten(liste), role="box", align="l", anchor="m", ins=INS_A,
              name=f"Tätigkeiten {ph}"[:40])
        if i:
            f.arrow([(pcx, ys[i - 1] + hs[i - 1]), (pcx, y)], name=f"Pfeil Phase {i}→{i + 1}")
    return f
