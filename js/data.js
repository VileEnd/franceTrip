/* ==========================================================================
   SenfBahn – Daten & Konfiguration
   Alles, was man beim Pflegen anfassen will (E-Mail, Tempo, Route, Szenen),
   steht in DIESER Datei. Die übrigen js/-Dateien sind Maschinenraum.
   Ladereihenfolge: data → ui → map → music → story (siehe index.html).
   ========================================================================== */
(function(){
'use strict';
var SB=window.SB=window.SB||{};

SB.config={
  EMAIL_AN:'frankreich.0wl0i@passmail.net',
  SCENE_VH:260,            // Scrollhöhe pro Szene (vh)
  AUTO_SEK_PRO_SZENE:12,   // Autopilot-Tempo: Sekunden pro Szene
  FRANCE_SCENE:3,          // Szene „Über den Rhein: Straßburg" → Musik startet
  YT_ID:'6A_lOwSnS8c'      // Zaz — „La vie en rose"
};

/* Geräte-Erkennung – steuert alle Performance-Abkürzungen. */
SB.reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
SB.isMobile=window.matchMedia('(max-width:640px)').matches||
            (('ontouchstart' in window)&&Math.min(screen.width,screen.height)<820);
SB.lowPower=SB.isMobile||(navigator.hardwareConcurrency||8)<=4;

/* ---- Route (Lng/Lat), Hin- und Rückweg -------------------------------------- */
var R=[[11.0825,49.4456],[10.5719,49.3009],[10.0664,49.1367],[9.7550,49.1030],[9.4310,48.9466],[9.1829,48.7840],
  [8.9600,48.9360],[8.7060,48.8940],[8.4009,48.9936],[8.2110,48.8586],[8.1907,48.7904],[8.0760,48.6260],[7.9466,48.4766],[7.8100,48.5732],
  [7.7860,48.5760],[7.7455,48.5839],[7.4540,48.2597],[7.3468,48.0723],[7.2770,48.0870],[7.3468,48.0723],[7.3423,47.7418],[6.8990,47.5866],[5.9540,47.3080],[5.0272,47.3235],
  [4.9300,47.1620],[4.8485,47.0230],[4.7522,46.9137],[4.4730,46.7550],[4.1110,46.4522],[4.0331,46.2726],
  [4.1110,46.4522],[4.4730,46.7550],[4.7522,46.9137],[4.8485,47.0230],[5.0272,47.3235],
  [5.9540,47.3080],[6.8990,47.5866],[7.3423,47.7418],[7.3468,48.0723],[7.7455,48.5839],[7.8100,48.5732],[7.9466,48.4766],[8.4009,48.9936],[9.1829,48.7840],[10.0664,49.1367],[11.0825,49.4456]];

function d(a,b){var dx=a[0]-b[0],dy=a[1]-b[1];return Math.sqrt(dx*dx+dy*dy);}
var cum=[0];for(var i=1;i<R.length;i++)cum[i]=cum[i-1]+d(R[i-1],R[i]);
var LEN=cum[cum.length-1];
function frac(idx){return cum[idx]/LEN;}
function pointAt(f){var t=f*LEN;
  for(var i=1;i<cum.length;i++){if(cum[i]>=t){var lt=(t-cum[i-1])/Math.max(cum[i]-cum[i-1],1e-9);
    return [R[i-1][0]+(R[i][0]-R[i-1][0])*lt,R[i-1][1]+(R[i][1]-R[i-1][1])*lt];}}
  return R[R.length-1];}

SB.route={
  R:R,cum:cum,LEN:LEN,frac:frac,pointAt:pointAt,
  STOP_PTS:[R[0],R[5],R[8],R[12],R[13],R[15],R[17],R[18],R[23],R[25],R[29]]
};

/* ---- Szenen ------------------------------------------------------------------
   f0/f1: Streckenanteil Start/Ende · z: Zoom · p: Pitch · b: Bearing
   cost: Ticketkosten dieser Etappe · t: Titel · w: Witz · x: Kurztext
   fact: Fun Fact unterwegs · k: Kostenlabel · frei: grünes Label · ch: Chips     */
SB.scenes=[
  {f0:frac(0),f1:frac(0),z0:11.8,z1:11.8,p0:0,p1:50,b0:0,b1:18,cost:0,badge:"SB 143",cls:"b-herz",
   t:"Nürnberg Hbf",w:"„Okay. Zeit für die eigentliche Frage.“",
   x:"Zwei Plätze, auf deinem liegt ein Croissant. Elsass &amp; Burgund, eine Woche, mit dem Zug — kommst du mit?",
   fact:"Die allererste deutsche Eisenbahn fuhr 1835 ab Nürnberg. Wir setzen die Tradition fort.",
   k:"0,00 € · D-Ticket",frei:true,ch:["Croissant liegt bereit","Rosmarin ist eingepackt"]},
  {f0:frac(0),f1:frac(5),z0:11.8,z1:8.4,p0:50,p1:48,b0:18,b1:-12,cost:0,badge:"RE 90",cls:"b-re",
   t:"Quer durch Franken",w:"„Der RE 90 hält überall. Wirklich überall. Auch emotional.“",
   x:"Ansbach, Crailsheim, Schwäbisch Hall. Drei Stunden, null Euro, ein geteilter Kopfhörer.",
   fact:"Schwäbisch Hall hieß bis 1934 einfach nur „Hall“ — das Schwäbisch kam per Erlass dazu.",
   k:"0,00 € · D-Ticket",frei:true},
  {f0:frac(5),f1:frac(13),z0:8.4,z1:9.4,p0:48,p1:54,b0:-12,b1:22,cost:0,badge:"RE/IRE",cls:"b-re",
   t:"Stuttgart → Kehl",w:"„In Kehl endet Deutschland. Kehl-mal drüber nach.“",
   x:"Bis Kehl gilt das D-Ticket. Die 2 € für Frankreich übernehm ich.",
   fact:"Unterwegs: Baden-Baden — die einzige Stadt, die so gut ist, dass sie sich selbst zitiert.",
   k:"0,00 € · D-Ticket",frei:true},
  {f0:frac(13),f1:frac(15),z0:9.4,z1:12.4,p0:54,p1:56,b0:22,b1:55,cost:2,badge:"TRAM D",cls:"b-tram",
   t:"Über den Rhein: Straßburg",w:"„Grenzüberschreitend gut — ein Tram-Traum.“",
   x:"Tram über den Rhein, abends Flammkuchen, morgens Pain au Chocolat am Kanal — Schulter an Schulter.",
   fact:"Das Straßburger Münster war 227 Jahre lang das höchste Gebäude der Welt.",
   k:"+ 2,00 € · Tram D",ch:["Binchstub","Plein la Moustache","Au Pont du Corbeau"]},
  {f0:frac(15),f1:frac(18),z0:12.4,z1:11.0,p0:56,p1:54,b0:55,b1:12,cost:12,badge:"TER",cls:"b-ter",
   t:"Colmar & Turckheim: Cocotte-Tag",w:"„Hier geht die Cocotte ab. Gusseisen: der einzige harte Stoff an Bord.“",
   x:"Staub-Store in Turckheim: die größte Cocotte-Auswahl der Welt. Und ja, wir kaufen den Rosmarin-Topf.",
   fact:"Colmar gilt als trockenste Stadt Frankreichs — bestes Croissant-Wetter, garantiert.",
   k:"+ 12,00 € · TER-Tag",ch:["Staub-Store","Beurre de baratte","Marché Couvert"]},
  {f0:frac(18),f1:frac(23),z0:11.0,z1:8.0,p0:54,p1:48,b0:12,b1:-32,cost:29,badge:"TGV",cls:"b-tgv",
   t:"Mit 320 km/h nach Dijon",w:"„TGV: Très Günstige Verbindung. Wer spät bucht: Très Gierige Verbindung.“",
   x:"2 h 06 direkt, ab 29 €. Links ziehen die Vogesen vorbei — in echtem 3D.",
   fact:"Ein TGV hält den Schienen-Weltrekord: 574,8 km/h. Wir nehmen die gemütlichen 320.",
   k:"+ 29,00 € · Sparpreis"},
  {f0:frac(23),f1:frac(23),z0:8.0,z1:12.4,p0:48,p1:56,b0:-32,b1:-64,cost:0,badge:"DIJON",cls:"b-tgv",
   t:"Dijon: Hauptquartier",w:"„Senfsationell hier.“",
   x:"Mittags Les Halles, Senf bei Fallot, Lebkuchen bei Mulot &amp; Petitjean. Alles zu Fuß.",
   fact:"Gustave Eiffel ist gebürtiger Dijoner — die Markthalle gilt als sein Entwurf.",
   k:"0,00 € · zu Fuß, Ehrensache",frei:true,ch:["Les Halles","Fallot & Maille","Du Pain Pour Demain"]},
  {f0:frac(23),f1:frac(25),z0:12.4,z1:11.0,p0:56,p1:54,b0:-64,b1:-26,cost:14,badge:"TER",cls:"b-ter",
   t:"Beaune-jour!",w:"„Und zum Essen: Beaune Appétit.“",
   x:"Samstagsmarkt, Senfmühlen-Tour bei Fallot, Traubensaft direkt vom Winzer.",
   fact:"Das bunte Dach der Hospices de Beaune leuchtet seit 1443 — Burgunds berühmteste Ziegel.",
   k:"+ 14,00 € · Dijon ⇄ Beaune",ch:["Moutarderie Fallot","Jus de raisin","Époisses (mutig!)"]},
  {f0:frac(25),f1:frac(29),z0:11.0,z1:10.2,p0:54,p1:52,b0:-26,b1:8,cost:0,badge:"BUS+TER",cls:"b-bus",
   t:"Bonus: Marcigny (2-Wochen-Version)",w:"„Emile Henry, −35 bis −40 %: der reinste Ton-Gewinn.“",
   x:"Werksverkauf des Keramik-Königs. Aber: <b>Di &amp; So geschlossen!</b>",
   fact:"Emile Henry brennt seit 1850 Keramik in Marcigny — im selben Ort, seit sechs Generationen.",
   k:"optional · ~25 € extra",frei:true},
  {f0:frac(29),f1:frac(45),z0:10.2,z1:7.4,p0:52,p1:42,b0:8,b1:0,cost:31,badge:"TGV+TRAM+RE",cls:"b-tgv",
   t:"Heimfahrt",w:"„Zug endet hier. Wie unsere Ausreden.“",
   x:"TGV, Tram, dann 0 € bis Nürnberg. Im Gepäck: Senf, Butter, 4 kg Gusseisen, ein Topf Rosmarin.",
   fact:"Schon 1390 regelte ein Erlass, was in Dijoner Senf darf. In unseren Rucksack: alles.",
   k:"+ 31,00 € · und heim",ch:["Gepäck: schwerer als hin","Rosmarin hat überlebt"]}
];
SB.N=SB.scenes.length;
})();
