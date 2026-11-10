/* Abb. 5.78 „Mehrdimensionale Planungsformulare“ – Logik des Planungsformulars „Zielvorgaben“ (Konto Absatzmenge).
   Seite = Gesellschaft x Kunde x Vertriebsart; Zeilen = Produkthierarchie (Alle Produkte › Produktlinie › Produktgruppe
   › Produkt, auf- und zuklappbar); Spalten asymmetrisch: Ist 2027 als Jahreswert, Top-down-Vorgabe 2028 auf
   Jahresebene, Bottom-up 2028 auf Monatsbasis.
   Rechnung: Top-down je Produkt = Vorgabe „Alle Produkte“ nach dem Ist je Produkt verteilt (ganzzahlig, größte Reste);
   Regel „Top-down-Vorgabe verteilen“: Bottom-up je Produkt und Monat = Top-down je Produkt nach dem Monats-Ist verteilt;
   Regel „Kein Produkt auf Produkte verteilen“: Monatswerte von „Kein Produkt“ nach dem Bottom-up des Monats auf die
   Produkte. Summen der Gruppen, Linien und Monate laufend. Gleiche Verteilung wie daten_planungsmodell.py.
   Druckfassung: Seite Deutschland · Großkunde 1 · Normalgeschäft, Werte des Originals. */
(() => {
  "use strict";
  const { el, sv, zahl, leseZahl, pruefeFeld } = MK;
  const PM = String.fromCharCode(0xB1);
  MK.init({ titel: "Mehrdimensionale Planungsformulare" });
  const $ = id => document.getElementById(id);

  // <daten> erzeugt von daten_planungsmodell.py – nicht von Hand ändern
const DATEN = {"stand":"14.10.2027","jahrIst":2027,"jahrPlan":2028,"monate":["Jan","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"],"gesellschaften":["Deutschland","Großbritannien","USA","Australien","Japan"],"kunden":["Großkunde 1","Großkunde 2","Fachhandel"],"vertriebsarten":["Normalgeschäft","Aktionsgeschäft"],"linien":[["Fahrräder",[["Cityräder",["City 26","City 28"]],["E-Bikes",["E-City","E-Trekking"]]]],["Zubehör",[["Helme",["Helm Urban","Helm Sport"]]]]],"seiten":{"Deutschland|Großkunde 1|Normalgeschäft":{"td":10000,"ist":[[154,167,172,158,112,131,146,161,137,121,110,120],[202,211,240,220,155,171,210,240,195,179,146,160],[119,161,148,122,114,139,161,180,155,148,130,141],[193,264,240,199,184,228,261,298,254,241,212,229],null,null],"bu":[[180,196,201,185,131,153,171,189,160,142,129,141],[237,247,281,258,181,200,246,281,228,210,171,187],[139,189,173,143,133,163,189,211,182,173,152,165],[226,309,281,233,216,267,306,349,298,282,248,268],null,null]},"Deutschland|Großkunde 1|Aktionsgeschäft":{"td":1100,"ist":[[4,8,60,44,11,7,5,8,50,43,14,27],[5,9,74,51,13,8,6,12,66,49,19,29],[2,4,29,24,5,3,3,4,27,20,7,14],[3,5,37,32,8,5,4,6,36,30,9,19],null,null],"bu":[[5,9,68,48,12,8,6,9,55,46,16,30],[6,10,83,56,14,9,7,14,76,54,22,33],[2,5,33,29,6,3,3,5,32,23,8,16],[3,6,42,36,9,6,5,7,40,34,10,21],null,null]},"Deutschland|Großkunde 2|Normalgeschäft":{"td":10300,"ist":[[102,128,118,99,80,102,114,140,111,98,99,93],[112,151,142,123,93,124,144,163,129,125,116,128],[101,112,127,112,90,108,122,130,113,104,99,101],[142,176,189,165,116,150,153,196,156,148,138,129],[134,159,197,258,241,210,193,187,182,154,151,160],[61,78,100,126,123,112,106,90,83,85,72,79]],"bu":[[112,141,130,109,88,112,126,154,122,108,109,103],[123,166,156,135,102,137,159,180,142,138,128,141],[111,123,140,123,99,119,135,143,125,115,109,111],[156,194,208,182,128,165,168,216,172,163,152,142],[148,175,217,284,265,231,213,206,201,170,166,176],[67,86,110,139,136,123,117,99,91,94,79,87]]},"Deutschland|Großkunde 2|Aktionsgeschäft":{"td":1700,"ist":[[3,6,41,31,8,5,4,6,40,33,11,18],[4,7,56,38,9,6,4,7,46,42,14,23],[2,4,27,21,5,3,3,4,25,19,7,14],[2,4,31,22,5,3,2,4,27,20,8,14],[6,10,114,121,32,18,9,12,89,62,23,49],[3,5,53,55,19,9,5,7,48,32,12,23]],"bu":[[3,7,43,33,9,5,4,6,41,35,11,19],[4,7,55,39,9,6,4,7,48,43,14,23],[2,4,29,22,6,3,3,4,27,21,8,15],[2,4,34,24,6,3,2,4,29,21,9,15],[6,11,127,131,34,19,10,13,97,66,25,54],[3,6,61,63,22,10,5,8,56,36,13,26]]},"Deutschland|Fachhandel|Normalgeschäft":{"td":20600,"ist":[[69,87,77,69,58,65,77,97,80,69,58,67],[123,137,146,112,96,119,122,162,126,112,107,102],[133,148,152,140,106,125,143,181,141,138,115,130],[142,157,182,142,133,156,163,186,144,147,145,145],[413,446,613,830,716,658,668,622,511,431,441,460],[364,414,515,686,733,640,567,478,431,404,339,408]],"bu":[[77,98,86,77,63,70,87,108,87,76,63,75],[140,157,166,126,109,136,136,181,142,129,121,116],[146,165,167,151,113,140,154,191,155,153,128,139],[158,173,200,161,145,173,183,211,159,167,165,157],[447,459,634,869,732,708,715,658,522,443,477,489],[375,421,536,733,774,646,597,487,437,417,355,421]]},"Deutschland|Fachhandel|Aktionsgeschäft":{"td":2950,"ist":[[2,3,20,17,4,2,2,3,18,17,5,9],[3,5,33,32,8,4,3,5,30,29,10,16],[2,4,27,25,6,3,2,4,25,23,7,12],[3,5,40,30,8,5,3,7,33,33,10,18],[15,26,262,280,98,40,26,35,196,164,59,120],[10,17,158,192,62,24,14,23,141,108,40,69]],"bu":[[2,3,21,18,4,2,2,3,19,18,5,10],[3,5,35,34,8,4,3,5,32,31,11,17],[2,4,29,27,6,3,2,4,27,24,7,13],[3,5,42,32,9,5,3,7,35,35,11,19],[16,27,277,296,104,42,27,37,207,173,62,127],[11,18,167,203,65,25,15,24,149,114,42,73]]},"Großbritannien|Großkunde 1|Normalgeschäft":{"td":4100,"ist":[[63,72,75,65,46,63,68,70,67,64,51,54],[84,92,99,81,67,74,102,107,81,90,72,71],[74,92,91,71,59,70,76,86,83,66,65,64],[92,110,116,106,77,108,123,122,109,110,103,90],null,null],"bu":[[62,69,72,64,44,59,66,68,65,63,48,52],[84,91,99,80,66,75,103,105,82,89,70,72],[74,88,89,70,58,69,72,84,78,64,62,62],[96,115,121,113,81,111,128,127,115,118,106,96],null,null]},"Großbritannien|Großkunde 1|Aktionsgeschäft":{"td":450,"ist":[[2,3,22,18,5,3,2,3,22,16,6,10],[2,4,28,22,6,3,2,4,23,22,7,12],[1,2,14,10,2,2,1,2,12,10,4,6],[1,3,17,15,3,2,2,2,16,13,4,8],null,null],"bu":[[2,4,25,20,6,3,2,3,24,18,7,11],[2,4,33,26,7,3,2,4,26,25,8,14],[1,2,17,12,2,2,1,2,14,11,5,7],[1,4,19,17,3,2,2,2,18,15,5,9],null,null]},"Großbritannien|Großkunde 2|Normalgeschäft":{"td":5150,"ist":[[47,60,56,51,36,51,55,64,48,50,43,48],[74,88,87,73,61,73,81,97,85,81,62,74],[50,60,59,46,40,51,61,67,51,52,48,42],[59,68,64,63,50,62,65,83,67,63,53,56],[66,69,89,118,117,102,99,98,80,71,66,70],[36,36,57,70,65,68,55,51,48,40,36,43]],"bu":[[51,64,59,55,39,55,57,66,51,54,46,51],[84,102,100,85,69,85,92,109,97,92,71,84],[53,66,64,49,42,56,67,74,56,58,52,47],[64,72,69,67,52,67,70,87,72,67,56,60],[73,76,95,130,125,113,108,107,87,77,71,74],[41,41,67,81,73,77,64,60,55,45,41,50]]},"Großbritannien|Großkunde 2|Aktionsgeschäft":{"td":900,"ist":[[2,3,19,17,4,3,2,3,20,16,5,9],[2,4,29,20,5,3,3,4,26,19,7,12],[1,2,12,8,2,1,1,2,10,8,3,5],[1,2,14,11,3,1,1,2,13,11,4,6],[4,6,57,74,19,9,6,7,47,37,14,29],[1,3,26,25,8,4,2,3,20,16,6,11]],"bu":[[2,4,20,18,5,3,2,3,21,17,6,9],[2,5,32,23,6,3,3,4,28,22,8,14],[1,2,13,9,2,1,1,2,11,8,4,6],[1,2,17,13,3,1,1,2,16,12,5,7],[4,7,65,81,21,10,7,8,53,41,16,31],[1,3,30,29,9,5,2,3,24,18,7,14]]},"Großbritannien|Fachhandel|Normalgeschäft":{"td":9050,"ist":[[40,44,45,36,32,37,41,48,38,40,37,32],[54,62,65,55,46,55,63,67,56,50,49,50],[41,53,52,50,37,48,54,59,51,49,42,47],[78,95,98,85,64,79,86,103,76,80,68,75],[202,205,315,375,390,312,313,263,266,224,193,231],[152,171,243,284,305,257,233,229,217,202,155,201]],"bu":[[42,46,47,38,33,39,43,50,40,42,39,33],[56,65,68,58,48,58,66,70,59,52,51,52],[43,56,54,52,39,50,57,62,53,51,44,49],[82,99,103,89,67,83,90,108,79,84,71,78],[211,215,330,392,408,326,328,275,278,234,202,242],[159,179,254,297,319,269,244,240,227,211,162,210]]},"Großbritannien|Fachhandel|Aktionsgeschäft":{"td":1450,"ist":[[1,2,12,10,3,1,1,2,11,8,3,5],[1,2,14,10,3,2,1,2,11,11,3,6],[1,2,14,10,3,2,1,2,13,11,3,6],[1,3,15,14,3,2,2,2,13,13,4,7],[8,12,136,151,42,19,11,16,97,81,26,59],[5,9,83,95,31,14,8,11,66,55,19,39]],"bu":[[1,2,13,11,3,1,1,2,12,9,3,5],[1,2,14,10,3,2,1,2,11,11,3,6],[1,2,14,11,3,2,1,2,13,11,3,6],[1,3,17,15,3,2,2,2,14,14,4,8],[8,13,150,159,45,20,12,18,105,86,29,65],[5,10,88,106,34,15,9,13,73,62,20,41]]},"USA|Großkunde 1|Normalgeschäft":{"td":6700,"ist":[[92,116,119,116,80,106,114,127,109,101,93,107],[143,164,160,143,125,152,151,190,143,157,147,138],[87,110,103,101,69,85,97,116,99,83,89,86],[177,192,206,167,148,175,177,225,161,177,150,165],null,null],"bu":[[92,116,120,117,81,106,116,127,109,104,96,108],[148,171,165,146,134,156,154,198,150,165,153,142],[88,109,105,102,68,87,99,120,102,86,89,87],[186,198,210,174,156,186,186,233,170,188,157,170],null,null]},"USA|Großkunde 1|Aktionsgeschäft":{"td":750,"ist":[[3,4,34,25,7,4,3,5,30,25,7,15],[3,7,47,36,9,5,4,7,40,32,12,21],[1,3,19,16,4,2,2,3,17,15,5,9],[2,5,33,26,7,4,3,6,31,24,8,16],null,null],"bu":[[4,5,39,28,8,5,3,6,35,29,8,16],[4,8,56,43,10,6,5,8,47,38,14,24],[1,4,22,19,5,2,2,3,20,17,6,10],[2,6,38,30,8,5,4,7,37,27,9,19],null,null]},"USA|Großkunde 2|Normalgeschäft":{"td":7200,"ist":[[66,83,91,69,65,76,88,85,79,73,67,63],[99,109,100,91,74,90,100,108,90,101,77,85],[61,71,79,62,58,63,80,88,64,70,58,60],[89,91,106,93,69,86,91,112,83,80,81,75],[100,124,170,204,183,202,161,144,148,129,118,134],[56,57,87,92,94,99,82,77,67,55,51,70]],"bu":[[67,84,93,71,66,77,91,87,78,72,66,63],[105,117,108,97,77,96,104,115,92,109,82,89],[60,72,80,64,57,65,82,91,64,69,60,61],[99,99,119,99,78,97,101,126,91,89,91,85],[101,123,173,208,183,201,165,149,153,130,121,134],[61,60,93,96,102,107,85,81,74,60,55,75]]},"USA|Großkunde 2|Aktionsgeschäft":{"td":1300,"ist":[[3,5,37,30,6,4,3,5,27,24,9,17],[3,5,36,33,8,4,4,6,34,28,9,17],[1,3,19,15,4,2,2,3,17,15,5,9],[2,3,23,19,5,3,2,3,21,18,5,10],[5,8,99,95,29,13,9,12,73,61,21,40],[2,3,37,36,13,6,3,5,27,23,7,14]],"bu":[[3,6,37,30,6,4,3,5,27,25,10,17],[3,5,38,35,9,4,4,6,37,29,10,18],[1,3,20,15,4,2,2,3,17,16,6,10],[2,3,24,20,5,3,2,3,22,20,5,11],[5,8,113,105,31,15,10,13,79,68,24,45],[2,3,40,37,13,7,3,5,28,25,8,14]]},"USA|Fachhandel|Normalgeschäft":{"td":14950,"ist":[[50,57,60,48,44,53,56,66,51,50,43,52],[60,71,75,69,57,57,67,92,64,67,59,64],[78,85,101,89,63,70,89,108,79,87,76,83],[98,126,127,113,96,111,120,134,108,104,105,106],[288,344,452,583,562,485,527,399,377,336,301,402],[245,301,399,488,473,494,439,346,363,290,271,349]],"bu":[[57,64,66,55,51,60,64,75,57,55,49,60],[69,79,85,78,63,64,75,107,73,78,68,72],[83,90,105,94,69,75,95,114,84,91,78,90],[114,148,150,127,111,131,136,156,121,119,124,120],[318,372,488,623,606,529,582,445,419,363,324,433],[277,332,452,559,523,561,508,391,420,321,301,393]]},"USA|Fachhandel|Aktionsgeschäft":{"td":2250,"ist":[[1,3,21,15,4,2,2,3,17,15,5,8],[2,3,25,20,5,3,2,4,21,18,6,11],[2,3,23,18,4,3,2,3,17,15,5,9],[2,3,25,17,5,3,2,4,20,19,5,10],[12,20,197,225,75,29,17,28,158,122,45,83],[7,11,106,125,35,17,11,15,95,75,23,45]],"bu":[[1,3,24,17,5,2,2,3,19,16,6,9],[2,3,28,22,6,3,2,5,24,20,7,12],[2,3,24,20,5,3,2,3,19,17,6,10],[2,3,28,18,6,3,2,5,22,20,6,11],[13,22,222,256,86,32,19,31,173,134,51,92],[8,11,114,131,37,18,11,16,101,80,24,48]]},"Australien|Großkunde 1|Normalgeschäft":{"td":2000,"ist":[[31,31,30,30,23,29,31,36,31,29,25,27],[36,51,46,38,33,39,43,52,46,39,33,38],[27,36,38,31,26,28,37,38,33,31,30,29],[43,60,57,50,40,44,58,62,48,48,39,41],null,null],"bu":[[34,36,35,33,26,32,36,41,34,33,28,31],[42,57,51,43,37,44,50,58,51,45,38,42],[30,39,42,34,28,30,40,41,35,34,33,31],[45,60,59,53,41,46,59,64,49,50,40,42],null,null]},"Australien|Großkunde 1|Aktionsgeschäft":{"td":200,"ist":[[1,2,11,9,2,1,1,2,9,8,3,5],[1,2,12,10,3,2,1,2,11,10,4,5],[0,1,7,6,1,1,1,1,6,5,2,3],[1,1,9,7,2,1,1,1,7,7,2,4],null,null],"bu":[[1,2,12,10,2,1,1,2,9,8,3,5],[1,2,13,10,3,2,1,2,12,10,4,5],[0,1,8,6,1,1,1,1,6,5,2,3],[1,1,10,7,2,1,1,1,7,7,2,4],null,null]},"Australien|Großkunde 2|Normalgeschäft":{"td":2100,"ist":[[27,28,33,26,21,25,28,32,28,27,22,25],[29,31,33,30,25,29,30,38,32,26,24,27],[17,20,21,17,14,17,21,24,18,17,16,17],[25,33,31,27,25,26,32,39,30,27,28,26],[25,30,43,47,55,48,42,39,34,28,27,34],[16,19,26,29,28,27,25,23,19,20,16,18]],"bu":[[27,28,33,27,21,25,27,32,29,27,22,26],[30,32,35,30,26,31,32,41,34,28,25,28],[16,19,22,17,14,17,21,25,18,17,16,17],[26,35,33,29,26,27,33,40,32,29,29,27],[25,29,44,46,54,48,43,39,34,28,27,35],[17,19,28,30,29,28,26,25,20,21,16,19]]},"Australien|Großkunde 2|Aktionsgeschäft":{"td":400,"ist":[[1,1,10,8,2,1,1,2,9,7,3,5],[1,2,13,11,2,1,1,2,10,9,3,5],[0,1,5,4,1,1,1,1,5,4,1,3],[0,1,6,4,1,1,1,1,5,4,1,2],[2,3,30,29,9,4,3,3,24,19,7,12],[1,1,12,11,4,2,1,2,9,7,2,5]],"bu":[[1,1,11,9,2,1,1,2,10,8,3,6],[1,2,15,12,2,1,1,2,11,10,3,6],[0,1,6,5,1,1,1,1,6,4,1,3],[0,1,7,4,1,1,1,1,6,4,1,2],[2,3,33,32,10,4,3,3,26,21,8,13],[1,1,13,12,4,2,1,2,10,8,2,6]]},"Australien|Fachhandel|Normalgeschäft":{"td":4450,"ist":[[14,17,18,16,12,14,16,18,17,16,14,15],[21,27,26,23,18,24,25,28,25,22,23,20],[24,29,25,23,19,25,26,32,26,23,20,21],[33,40,41,30,27,34,36,40,35,30,29,30],[105,107,168,205,188,166,154,137,124,126,107,123],[65,69,107,115,131,119,96,86,83,76,68,74]],"bu":[[16,18,20,17,13,16,18,20,19,18,16,17],[23,30,27,24,19,27,27,30,27,24,25,21],[25,31,26,23,20,26,27,34,26,24,20,22],[36,45,44,34,30,38,39,43,38,34,32,33],[109,111,180,212,195,175,157,140,130,131,115,129],[71,79,122,130,151,131,107,100,91,85,76,85]]},"Australien|Fachhandel|Aktionsgeschäft":{"td":700,"ist":[[0,1,4,4,1,1,0,1,4,3,1,2],[0,1,7,6,1,1,1,1,7,5,2,3],[0,1,6,4,1,1,1,1,5,4,1,2],[1,1,10,7,2,1,1,1,7,6,2,4],[4,6,75,75,22,10,6,8,53,42,13,32],[2,4,41,45,12,6,3,5,33,25,8,17]],"bu":[[0,1,5,4,1,1,0,1,4,3,1,2],[0,1,8,6,1,1,1,1,7,5,2,3],[0,1,7,4,1,1,1,1,5,4,1,2],[1,1,11,8,2,1,1,1,7,6,2,4],[4,6,70,71,21,9,6,7,51,42,13,31],[2,4,40,44,12,6,3,5,33,25,8,17]]},"Japan|Großkunde 1|Normalgeschäft":{"td":2950,"ist":[[51,52,58,47,38,47,58,66,49,47,40,47],[66,71,70,61,50,56,68,79,71,62,57,57],[40,42,49,44,35,36,46,53,47,39,33,34],[76,88,93,71,60,73,81,102,84,67,68,69],null,null],"bu":[[56,56,64,49,40,51,62,71,52,50,43,49],[68,74,76,65,54,59,70,83,73,63,61,61],[42,44,52,45,37,39,49,55,49,41,34,35],[75,87,92,70,60,74,82,100,87,69,68,69],null,null]},"Japan|Großkunde 1|Aktionsgeschäft":{"td":350,"ist":[[1,2,17,12,3,2,1,3,15,12,4,7],[2,3,24,20,5,3,2,4,24,18,6,12],[1,1,9,8,2,1,1,1,8,7,2,4],[1,2,15,13,3,2,1,3,15,13,4,7],null,null],"bu":[[1,2,18,13,3,2,1,3,16,13,5,8],[2,3,25,21,5,3,2,4,25,17,7,13],[1,1,10,8,2,1,1,1,9,7,2,4],[1,2,16,15,3,2,1,3,17,14,5,8],null,null]},"Japan|Fachhandel|Normalgeschäft":{"td":6050,"ist":[[23,30,26,22,19,25,28,31,27,25,23,21],[33,37,41,37,27,30,35,40,37,35,33,29],[31,40,41,32,29,35,40,43,33,32,31,33],[45,61,61,51,45,53,56,61,58,49,48,49],[122,135,173,238,226,230,191,173,145,138,120,152],[111,125,161,206,224,188,176,155,150,131,113,150]],"bu":[[25,33,29,23,20,28,30,33,30,26,25,23],[33,37,43,38,28,31,36,41,38,35,35,31],[34,42,43,34,31,38,43,47,36,34,33,35],[47,63,64,51,45,52,57,62,58,51,49,49],[128,141,177,242,239,245,195,182,151,146,125,159],[116,135,170,221,228,197,188,167,159,136,115,155]]},"Japan|Fachhandel|Aktionsgeschäft":{"td":1050,"ist":[[0,1,8,6,1,1,1,1,6,6,2,3],[1,1,9,8,2,1,1,2,7,7,2,4],[1,1,8,7,2,1,1,1,8,7,2,4],[1,2,13,10,3,1,1,2,12,9,3,6],[5,10,85,97,29,15,8,11,73,64,20,42],[3,5,57,60,19,8,5,6,47,35,11,24]],"bu":[[0,1,9,7,1,1,1,1,7,7,2,4],[1,1,10,9,3,1,1,2,8,8,2,5],[1,1,9,8,3,1,1,1,9,8,2,5],[1,2,15,11,4,1,1,2,14,10,3,7],[6,11,98,113,32,17,9,12,86,72,23,48],[3,6,64,69,22,9,6,7,54,39,12,26]]}}};
// </daten>

  const D = DATEN, M = D.monate, PR = [], GR = [];
  D.linien.forEach(([l, gs], li) => gs.forEach(([g, ps], gi) => { GR.push({ name: g, linie: li, produkte: [] });
    ps.forEach(p => { GR[GR.length - 1].produkte.push(PR.length); PR.push({ name: p, linie: li, gruppe: GR.length - 1 }); }); }));
  const schluessel = () => [$("f-ges").value, $("f-kunde").value, $("f-va").value].join("|");

  /* ---------- Verteilung (wie verteilen() im Datengenerator) ---------- */
  function verteilen(summe, w) {
    const s = w.reduce((a, b) => a + b, 0);
    if (!s || summe == null) return w.map(() => 0);
    const roh = w.map(x => summe * x / s), ganz = roh.map(Math.floor);
    let rest = summe - ganz.reduce((a, b) => a + b, 0);
    roh.map((r, i) => [r - ganz[i], i]).sort((a, b) => b[0] - a[0] || a[1] - b[1]).slice(0, rest).forEach(([, i]) => { ganz[i] += 1; });
    return ganz;
  }
  const summe = a => a.reduce((x, y) => x + y, 0);

  /* ---------- Arbeitsstand je Seite (Änderungen bleiben beim Seitenwechsel erhalten) ---------- */
  const STAND = {};
  function laden(k, neu) {
    if (!STAND[k] || neu) {
      const s = D.seiten[k];
      STAND[k] = s ? { td: s.td, ist: s.ist.map(z => z && z.slice()), bu: s.bu.map(z => z && z.slice()), kp: Array(12).fill(null) }
                   : { td: null, ist: PR.map(() => null), bu: PR.map(() => null), kp: Array(12).fill(null) };
    }
    return STAND[k];
  }
  const tdProdukte = S => {
    const idx = PR.map((_, i) => i).filter(i => S.ist[i]);
    const v = verteilen(S.td, idx.map(i => summe(S.ist[i])));
    const out = PR.map(() => null);
    idx.forEach((i, j) => { out[i] = S.td == null ? null : v[j]; });
    return out;
  };

  /* ---------- Auswahl ---------- */
  const optionen = (sel, liste, wert) => liste.forEach(t => el("option", t === wert ? { value: t, selected: "" } : { value: t }, sel, t));
  optionen($("f-ges"), D.gesellschaften, "Deutschland");
  optionen($("f-kunde"), D.kunden, "Großkunde 1");
  optionen($("f-va"), D.vertriebsarten, "Normalgeschäft");

  /* ---------- Zeilen der Hierarchie ---------- */
  const offen = new Set(["alle", "l0", "g0"]);          // Druckfassung: Fahrräder und Cityräder aufgeklappt
  function zeilenListe() {
    const z = [];
    if (offen.has("alle")) {
      D.linien.forEach(([l, gs], li) => {
        if (offen.has("l" + li)) GR.forEach((g, gi) => {
          if (g.linie !== li) return;
          if (offen.has("g" + gi)) g.produkte.forEach(pi => z.push({ typ: "p", i: pi, ebene: 3, name: PR[pi].name }));
          z.push({ typ: "g", i: gi, ebene: 2, name: g.name, klapp: "g" + gi });
        });
        z.push({ typ: "l", i: li, ebene: 1, name: l, klapp: "l" + li });
      });
      z.push({ typ: "kp", ebene: 1, name: "Kein Produkt" });
    }
    z.push({ typ: "alle", ebene: 0, name: "Alle Produkte", klapp: "alle" });
    return z;
  }
  const produkteVon = z => z.typ === "p" ? [z.i] : z.typ === "g" ? GR[z.i].produkte : z.typ === "l" ? PR.map((p, i) => i).filter(i => PR[i].linie === z.i)
    : z.typ === "alle" ? PR.map((_, i) => i) : [];

  /* ---------- Raster aufbauen ---------- */
  const raster = $("raster");
  const pos = (r, c, n = 1) => `grid-row:${r};grid-column:${c}${n > 1 ? " / span " + n : ""}`;
  ["Jahr", "Jahr", "Jahr", ...M].forEach((t, j) => el("div", { class: "mx-k k2", style: pos(3, 2 + j) }, raster, t));
  const PRUEF = { min: 0, max: 999999, meldung: "Absatzmenge in Stück, ganze Zahl ab 0" };
  function dreieck(offenZu) {
    const s = sv("svg", { width: 8, height: 8, viewBox: "0 0 8 8", "aria-hidden": "true" });
    sv("polygon", { points: offenZu ? "0,2 8,2 4,7" : "2,0 7,4 2,8", fill: "#3A3F44" }, s);
    return s;
  }
  let ZEILEN = [];
  function aufbauen() {
    raster.querySelectorAll(".zeile").forEach(e => e.remove());
    const S = laden(schluessel());
    ZEILEN = zeilenListe();
    ZEILEN.forEach((z, j) => {
      const r = 4 + j, summeZ = z.typ !== "p" && z.typ !== "kp", oben = z.typ === "alle" ? " oben" : "";
      const id = z.typ === "p" ? "p" + z.i : z.typ === "g" ? "g" + z.i : z.typ === "l" ? "l" + z.i : z.typ;
      const lab = el("div", { class: "mx-l zeile" + (z.typ === "alle" || z.typ === "l" ? " summe" : "") + oben, id: "z-" + id,
                              style: pos(r, 1) + `;padding-left:${4 + z.ebene * 14}px` }, raster);
      const b = el("span", { class: "baum" }, lab);
      if (z.klapp) {
        b.appendChild(dreieck(offen.has(z.klapp)));
        if (!MK.PRINT) b.addEventListener("click", () => { offen.has(z.klapp) ? offen.delete(z.klapp) : offen.add(z.klapp); aufbauen(); });
        b.title = offen.has(z.klapp) ? "Zuklappen" : "Aufklappen";
      }
      lab.appendChild(document.createTextNode(z.name));
      const fett = z.typ === "alle" || z.typ === "l" ? " summe" : "";
      // Ist und Top-down
      el("div", { class: "mk-feld mk-anzeige mk-zahl zeile" + fett + oben, id: `ist-${id}`, style: pos(r, 2) }, raster);
      if (z.typ === "alle") {
        const f = el("input", { class: "mk-feld mk-zahl zeile summe trenn" + oben, id: "td-alle", style: pos(r, 3), inputmode: "numeric",
          value: S.td == null ? "" : zahl(S.td, 0), "aria-label": "Top-down-Vorgabe 2028, alle Produkte, Jahr", "data-hilfe": "Vorgabe in Stück für alle Produkte und das Jahr" }, raster);
        f.addEventListener("input", () => {
          const v = pruefeFeld(f, "zahl", PRUEF);
          if (v != null && v % 1) { f.classList.add("mk-fehler"); f.title = PRUEF.meldung; }
          if (!f.classList.contains("mk-fehler")) S.td = v;
          rechnen();
        });
        f.addEventListener("blur", () => { if (!f.classList.contains("mk-fehler")) f.value = S.td == null ? "" : zahl(S.td, 0); });
      } else el("div", { class: "mk-feld mk-anzeige mk-zahl zeile trenn" + fett, id: `td-${id}`, style: pos(r, 3) }, raster);
      el("div", { class: "mk-feld mk-anzeige mk-zahl zeile trenn" + fett + oben, id: `bj-${id}`, style: pos(r, 4) }, raster);
      // Monate: Eingabe nur auf Blattebene (Produkt, Kein Produkt)
      M.forEach((mn, m) => {
        if (summeZ) { el("div", { class: "mk-feld mk-anzeige mk-zahl zeile" + fett + oben + (m === 0 ? " trenn" : ""), id: `m${m}-${id}`, style: pos(r, 5 + m) }, raster); return; }
        const zeile = z.typ === "p" ? S.bu[z.i] : S.kp;
        const f = el("input", { class: "mk-feld mk-zahl zeile" + (m === 0 ? " trenn" : ""), id: `m${m}-${id}`, style: pos(r, 5 + m), inputmode: "numeric",
          value: zeile && zeile[m] != null ? zahl(zeile[m], 0) : "", "aria-label": `Bottom-up 2028, ${z.name}, ${mn}`, "data-hilfe": PRUEF.meldung }, raster);
        f.addEventListener("input", () => {
          const v = pruefeFeld(f, "zahl", PRUEF);
          if (v != null && v % 1) { f.classList.add("mk-fehler"); f.title = PRUEF.meldung; }
          if (!f.classList.contains("mk-fehler")) {
            if (z.typ === "p") { if (!S.bu[z.i]) S.bu[z.i] = Array(12).fill(null); S.bu[z.i][m] = v; }
            else S.kp[m] = v;
          }
          rechnen();
        });
        f.addEventListener("blur", () => { const zz = z.typ === "p" ? S.bu[z.i] : S.kp; if (!f.classList.contains("mk-fehler")) f.value = zz && zz[m] != null ? zahl(zz[m], 0) : ""; });
      });
    });
    rechnen();
    if (MK.skalieren) MK.skalieren();
    if (MK._ebenenNeu) MK._ebenenNeu();
  }

  /* ---------- Rechnen: Summen, Top-down-Verteilung, Abstimmung ---------- */
  const fmt = v => (v == null ? "" : zahl(v, 0));
  const diff = (a, b) => { const d = a - b; return (d === 0 ? PM + "0" : (d > 0 ? "+" : "") + zahl(d, 0)) + " Stück" +
    (b ? ` (${Math.abs(d / b) < 0.0005 ? PM + "0,0" : (d > 0 ? "+" : "") + zahl(d / b * 100, 1)}${MK.NBSP}%)` : ""); };
  function werte(S, ps, kp) {
    const td = tdProdukte(S);
    const ist = ps.some(i => S.ist[i]) ? summe(ps.map(i => S.ist[i] ? summe(S.ist[i]) : 0)) : null;
    const tdv = ps.some(i => td[i] != null) ? summe(ps.map(i => td[i] || 0)) : null;
    const mon = M.map((_, m) => { const v = ps.map(i => S.bu[i] && S.bu[i][m]).filter(x => x != null); if (kp && S.kp[m] != null) v.push(S.kp[m]); return v.length ? summe(v) : null; });
    const bj = mon.some(x => x != null) ? summe(mon.map(x => x || 0)) : null;
    return { ist, td: tdv, mon, bj };
  }
  function rechnen() {
    const S = laden(schluessel());
    ZEILEN.forEach(z => {
      const id = z.typ === "p" ? "p" + z.i : z.typ === "g" ? "g" + z.i : z.typ === "l" ? "l" + z.i : z.typ;
      const w = z.typ === "kp" ? { ist: null, td: null, mon: S.kp, bj: S.kp.some(x => x != null) ? summe(S.kp.map(x => x || 0)) : null }
        : werte(S, produkteVon(z), z.typ === "alle");
      $(`ist-${id}`).textContent = fmt(w.ist);
      if (z.typ !== "alle") $(`td-${id}`).textContent = fmt(w.td);
      $(`bj-${id}`).textContent = fmt(w.bj);
      if (z.typ !== "p" && z.typ !== "kp") w.mon.forEach((v, m) => { $(`m${m}-${id}`).textContent = fmt(v); });
    });
    const a = werte(S, PR.map((_, i) => i), true);
    $("f-diff-td").textContent = a.bj == null || S.td == null ? "–" : diff(a.bj, S.td);
    $("f-diff-ist").textContent = a.bj == null || !a.ist ? "–" : diff(a.bj, a.ist);
  }

  /* ---------- Geschäftsregeln ---------- */
  const fehler = () => !!document.querySelector("#zielvorgaben .mk-fehler");
  function regelStarten() {
    if (fehler()) { MK.meldung("Bitte zuerst die rot markierten Eingaben korrigieren."); return; }
    const S = laden(schluessel()), regel = document.querySelector("#regeln input:checked").value;
    if (regel === "waehrung") { MK.meldung("Absatzmengen in Stück: keine Währungsumrechnung erforderlich."); return; }
    if (regel === "formular") { rechnen(); MK.meldung("Formular berechnet: Summen der Produktgruppen, Linien und Monate aktualisiert."); return; }
    if (regel === "topdown") {
      if (S.td == null) { MK.meldung("Keine Vorgabe: Bitte zuerst die Top-down-Vorgabe für alle Produkte eingeben."); return; }
      const td = tdProdukte(S);
      let n = 0;
      PR.forEach((_, i) => { if (S.ist[i]) { S.bu[i] = verteilen(td[i], S.ist[i]); n++; } });
      if (!n) { MK.meldung("Kein Ist 2027 auf dieser Seite – die Vorgabe lässt sich nicht verteilen."); return; }
      aufbauen();
      MK.meldung(`Vorgabe ${zahl(S.td, 0)} Stück nach dem Ist ${D.jahrIst} auf ${n} Produkte und 12 Monate verteilt.`);
      return;
    }
    // Allokation: „Kein Produkt“ je Monat nach dem Bottom-up der Produkte verteilen
    if (!S.kp.some(x => x)) { MK.meldung("„Kein Produkt“ ist leer – nichts zu verteilen."); return; }
    M.forEach((_, m) => {
      const v = S.kp[m];
      if (!v) return;
      const idx = PR.map((_, i) => i).filter(i => S.bu[i] && S.bu[i][m]);
      if (!idx.length) return;
      verteilen(v, idx.map(i => S.bu[i][m])).forEach((x, j) => { S.bu[idx[j]][m] += x; });
      S.kp[m] = null;
    });
    aufbauen();
    MK.meldung("„Kein Produkt“ nach dem Bottom-up des Monats auf die Produkte verteilt.");
  }

  /* ---------- Knöpfe und Auswahl ---------- */
  ["f-ges", "f-kunde", "f-va"].forEach(id => $(id).addEventListener("change", aufbauen));
  $("k-starten").addEventListener("click", regelStarten);
  $("k-speichern").addEventListener("click", () => {
    if (fehler()) { MK.meldung("Nicht gespeichert: Bitte zuerst die rot markierten Eingaben korrigieren."); return; }
    const a = werte(laden(schluessel()), PR.map((_, i) => i), true);
    MK.meldung(`Gespeichert: ${schluessel().split("|").join(" · ")}, Bottom-up ${a.bj == null ? "leer" : zahl(a.bj, 0) + " Stück"}.`);
  });
  $("k-aktualisieren").addEventListener("click", () => { laden(schluessel(), true); aufbauen(); MK.meldung("Aktualisiert: gespeicherte Werte neu geladen, ungespeicherte Änderungen verworfen."); });
  const zeigen = (id, text) => { const g = $(id); g.classList.add("hervor"); setTimeout(() => g.classList.remove("hervor"), 1600); MK.meldung(text); };
  $("k-regeln").addEventListener("click", () => zeigen("g-regeln", "Regel auswählen und mit „Starten“ ausführen."));
  $("k-anweisungen").addEventListener("click", () => zeigen("g-anweisungen", "Anweisungen zum Formular stehen unter dem Raster."));
  $("k-anmerkungen").addEventListener("click", () => MK.meldung("Anmerkungen zur Planungseinheit zeigt Abb. 5.81 (eigene Beispielmaske)."));
  aufbauen();

  /* ---------- Lernplattform: Erläuterungen und Gestaltung ---------- */
  MK.ebenen({
    erlaeuterungen: {
      titel: "Erläuterungen",
      intro: "Was die Bereiche des mehrdimensionalen Planungsformulars leisten. Die Nummern in der Maske zeigen, wo.",
      eintraege: [
        { nr: 1, ziel: "g-sicht", versatz: [-4, 2], titel: "Datenfilter für das Formular",
          text: "Die Sicht legt Dimensionen fest, die für das ganze Formular gelten – hier das Konto Absatzmenge in Stück. Im Formular erscheinen nur Werte dieser Sicht." },
        { nr: 2, ziel: "g-seite", versatz: [-4, 2], titel: "Auswahlmenüs der Seite",
          text: "Gesellschaft, Kunde und Vertriebsart wählen die Seite des mehrdimensionalen Würfels, die das Formular zeigt. Welche Dimensionen als Auswahl dienen, legt der Formularentwurf fest. Wählen Sie z. B. den Fachhandel: Dort werden auch Helme geplant." },
        { nr: 3, ziel: "z-l0", versatz: [-4, 5], titel: "Hierarchische Produktstruktur",
          text: "Die Zeilen folgen der Produkthierarchie Alle Produkte › Produktlinie › Produktgruppe › Produkt; jede Ebene lässt sich mit dem Dreieck weiter auf- und zuklappen. Summen stehen unter ihren Elementen und rechnen laufend mit." },
        { nr: 4, ziel: "h-plan", versatz: [-6, 0], titel: "Asymmetrischer Spaltenaufbau",
          text: "Die Spalten kombinieren Szenario, Version und Zeit unterschiedlich: das Ist 2027 als Jahreswert, die Top-down-Vorgabe auf Jahresebene und die Bottom-up-Planung auf Monatsbasis mit Jahressumme." },
        { nr: 5, ziel: "td-alle", anker: "links", versatz: [26, 5], titel: "Top-down-Vorgabe",
          text: "Die Vorgabe wird nur einmal für alle Produkte und das Jahr eingegeben (10.000 Stück). Die Werte der Produktlinien, Produktgruppen und Produkte darüber folgen aus dem Ist-Anteil: 4.018 von 8.539 Stück Ist ergeben 4.705 Stück Vorgabe für die Cityräder." },
        { nr: 6, ziel: "g-regeln", versatz: [-4, 2], titel: "Geschäftsregeln",
          text: "Regeln rechnen auf dem Server, hier „Top-down-Vorgabe verteilen“: Die Vorgabe je Produkt wird nach dem Monatsverlauf des Ist auf die Monate verteilt und als Startwert der Bottom-up-Planung eingetragen. Ändern Sie die Vorgabe und starten Sie die Regel." },
        { nr: 7, ziel: "l-diff-td", anker: "links", versatz: [0, 2], titel: "Abstimmung im Gegenstromverfahren",
          text: "Die Planenden passen die verteilten Monatswerte bottom-up an. Die Differenz zur Vorgabe zeigt, wie weit Bottom-up und Top-down auseinanderliegen – direkt nach der Verteilung ±0, nach Anpassungen der Abstimmungsbedarf." },
        { nr: 8, ziel: "g-anweisungen", versatz: [-4, 2], titel: "Anweisungen zum Formular",
          text: "Zu jedem Formular hinterlegt die zentrale Planung Hinweise für die Planenden – was einzugeben ist und was automatisch berechnet wird; auch Links auf weitere Informationen sind möglich (vgl. Abb. 5.79)." },
      ],
    },
    gestaltung: {
      titel: "Gestaltung",
      intro: "Was gegenüber dem Original geändert wurde – softwareneutral im Buchstil und nach den Interaktionsprinzipien der DIN EN ISO 9241-110.",
      eintraege: [
        { nr: "A", ziel: "kopf", versatz: [-6, 8], regel: "BUCHSTIL – SOFTWARENEUTRAL", titel: "Kein Browserfenster, kein Produktname",
          text: "Browserfenster mit Adresszeile (Servername), Menü- und Symbolleiste, Produktname mit Firmenplatzhalter, Navigationsleisten, Statuszeile mit Anwender und Anwendung sowie die Bildlaufleiste entfallen. Formularordner und Szenario stehen im Untertitel." },
        { nr: "B", ziel: "h-bu", versatz: [-6, 0], regel: "SELBSTBESCHREIBUNGSFÄHIGKEIT", titel: "Klartext statt Systemkürzel",
          text: "„IST/REALCASE“, „PLAN/TOPDOWN“, „BESTCASE“, „YearTotal“ und „FY01/FY02“ heißen Ist 2027, Top-down, Bottom-up und Jahr; „Point-of-View: Accounts, Currencies“ und „Page“ heißen Sicht und Seite, die Monate deutsch." },
        { nr: "C", ziel: "td-g0", anker: "links", versatz: [28, 5], regel: "SELBSTBESCHREIBUNGSFÄHIGKEIT", titel: "Eingabe und Anzeige unterscheidbar",
          text: "Weiß sind nur die Vorgabe für alle Produkte und die Monatswerte der Produkte; Summen und verteilte Vorgaben sind grau. Im Original war die ganze Top-down-Spalte weiß, obwohl die Werte darin aus der Regel stammten." },
        { nr: "D", ziel: "g-regeln", anker: "links", versatz: [0, 2], regel: "STEUERBARKEIT", titel: "Dialoge als feste Bereiche",
          text: "„Anweisungen“ und „Geschäftsregeln starten“ waren eigene Fenster, die das Raster und die Bottom-up-Werte überdeckten. Jetzt stehen beide unter dem Raster; die Regel wird als Option gewählt und gestartet." },
        { nr: "E", ziel: "z-g0", versatz: [-4, 5], regel: "ERWARTUNGSKONFORMITÄT", titel: "Gewohnte Bedienelemente",
          text: "Klappdreiecke statt Plus- und Minuskästchen, Auswahlfelder mit Pfeil rechts, die Seite lädt bei der Auswahl (der Knopf „Navigation“ entfällt). Die Gruppe Cityräder ist bis zu den Produkten aufgeklappt, damit Eingabezeilen sichtbar sind." },
        { nr: "F", ziel: "f-diff-td", versatz: [26, 6], regel: "AUFGABENANGEMESSENHEIT", titel: "Abstimmung ergänzt",
          text: "Die Differenz des Bottom-up zur Vorgabe und zum Ist fehlte im Original; sie zeigt, ob nach Anpassungen noch Abstimmungsbedarf besteht. Alle zwölf Monate sind sichtbar – das Original war nach August abgeschnitten." },
        { nr: "G", ziel: "f-ges", anker: "links", versatz: [0, 2], regel: "BUCHSTIL – NEUTRAL UND AKTUELL", titel: "Aktuelle Jahre, sprechende Namen",
          text: "FY01/FY02 werden zu 2027/2028; „Produktlinie 1“, „Produktgruppe 1.1“ heißen Fahrräder, Cityräder usw., „Grosskunde 1“ wird zu „Großkunde 1“. Werte wie im Original: Ist 4.018 und 4.521, Vorgabe 10.000, Monate Januar bis Juli." },
        { nr: "H", ziel: "m0-p0", anker: "links", versatz: [28, 5], regel: "ROBUSTHEIT GEGEN BENUTZUNGSFEHLER", titel: "Eingaben werden geprüft",
          text: "Absatzmengen sind ganze Zahlen ab 0. Ungültige Eingaben werden rot markiert und nicht übernommen; Speichern und Regeln sind erst nach der Korrektur möglich." },
      ],
    },
  });
  MK.fertig();
})();
