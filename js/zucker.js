/* ==========================================================================
   Engine – die Zuckerdose (Frühstücks-Einlage vor dem RSVP)
   Sie hüpft von links nach rechts zur Teetasse, klappt den Deckel auf, kippt
   und schüttet Zucker nach; danach marschiert sie zurück und holt nach. Die
   Tasse wird Runde für Runde voller, zum Schluss quillt sie über.

   Gezeichnet wie ein altes Trickfilm-Cel: gemalter, stillstehender
   Hintergrund, darüber flach kolorierte Figuren mit Tuschekontur, dazu
   Vignette und Filmkorn. Bewegt wird mit 12 Zeichnungen je Sekunde.

   Bauprinzip: KEINE CSS-Keyframes, sondern eine Zeitleiste. zustand(t)
   beschreibt die komplette Szene für jeden Zeitpunkt t, zeichne() schreibt
   sie in transform-Attribute. Dadurch sind Standbild (Reduced Motion),
   Neustart per Klick und das Pausieren außerhalb des Bildschirms derselbe
   Codepfad.

   Die Szene hängt sich — wie js/teapot.js — selbst ins DOM, ans Ende von
   #content (also direkt vor das RSVP). Eingestellt wird sie in js/trip.js
   unter `zucker`; `zucker:null` schaltet sie ab.
   Braucht: js/core.js (SB.reduced, SB.isMobile), js/ui.js (SB.showToast)
   ========================================================================== */
(function(){
'use strict';
var SB=window.SB;
if(!SB||!SB.trip)return;
var Z=SB.trip.zucker;
if(Z===null||Z===false)return;
Z=Z||{};

var host=document.getElementById('content');
if(!host)return;

var ARIA=Z.ariaLabel||'Eine Zuckerdose marschiert von links nach rechts zu einer Teetasse und füllt sie nach und nach mit Zucker.';
var STANDARDTEXTE=["Erster Löffel. Zum Aufwärmen.",
                   "Zweiter Gang. Sie meint es ernst.",
                   "Langsam wird's süß.",
                   "Noch einer — es sind ja Ferien.",
                   "Voll. Fehlt nur noch dein Ja."];

/* ---- Bühne bauen ------------------------------------------------------------ */
var SVG=[
  '<svg id="zuckersvg" viewBox="0 0 620 250" role="img"',
  '         aria-label="\'+ARIA+\'">',
  '      <defs>',
  '        <!-- Tassen-Innenraum: begrenzt den Zuckerpegel (Bühnen-Koordinaten) -->',
  '        <clipPath id="zkTasseInnen">',
  '          <path d="M440,144 A30 7.5 0 0 1 500,144 C499,163 495,181 489,187 A19 5 0 0 1 451,187 C445,181 441,163 440,144 Z"/>',
  '        </clipPath>',
  '        <!-- Formen für die Cel-Schattierung (jeweils lokale Koordinaten) -->',
  '        <clipPath id="zkDoseForm">',
  '          <path d="M-13,-7 C-30,-11 -40,-18 -40,-27 C-40,-38 -29,-43 -22,-47 L22,-47 C29,-43 40,-38 40,-27 C40,-18 30,-11 13,-7 Z"/>',
  '        </clipPath>',
  '        <clipPath id="zkTasseForm">',
  '          <path d="M-33,-52 C-32,-33 -28,-15 -22,-8 A22 5.5 0 0 0 22,-8 C28,-15 32,-33 33,-52 Z"/>',
  '        </clipPath>',
  '        <linearGradient id="zkWand" x1="0" y1="0" x2="0" y2="1">',
  '          <stop offset="0" stop-color="#2F2C22"/><stop offset=".62" stop-color="#4A4432"/><stop offset="1" stop-color="#5B5340"/>',
  '        </linearGradient>',
  '        <linearGradient id="zkPlatte" x1="0" y1="0" x2="0" y2="1">',
  '          <stop offset="0" stop-color="#F2EADA"/><stop offset="1" stop-color="#DFD2BB"/>',
  '        </linearGradient>',
  '        <radialGradient id="zkVignette" cx=".5" cy=".46" r=".78">',
  '          <stop offset=".5" stop-color="#000" stop-opacity="0"/>',
  '          <stop offset="1" stop-color="#0F0B06" stop-opacity=".5"/>',
  '        </radialGradient>',
  '        <!-- Handstrich: verschiebt alle Kanten minimal entlang eines',
  '             Rauschfeldes — aus glatten Vektorkurven werden krakelige Striche -->',
  '        <filter id="zkSkizze" x="-6%" y="-6%" width="112%" height="112%">',
  '          <feTurbulence type="fractalNoise" baseFrequency="0.015 0.021" numOctaves="3" seed="11" result="wolke"/>',
  '          <feDisplacementMap in="SourceGraphic" in2="wolke" scale="2.3" xChannelSelector="R" yChannelSelector="G"/>',
  '        </filter>',
  '        <!-- Filmkorn: liegt als eigene, unbewegte Fläche obenauf -->',
  '        <filter id="zkKorn" x="0" y="0" width="100%" height="100%">',
  '          <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" stitchTiles="stitch"/>',
  '          <feColorMatrix type="saturate" values="0"/>',
  '        </filter>',
  '      </defs>',
  '',
  '      <!-- Gemalter Hintergrund: dunkle Küche, wie im Zeichentrick immer',
  '           still stehend — nur die Cels darüber bewegen sich. -->',
  '      <rect class="zk-wand" x="0" y="0" width="620" height="250"/>',
  '      <path class="zk-schrank" d="M0,0 H214 V190 H0 Z"/>',
  '      <path class="zk-schrankhell" d="M348,0 H620 V96 C520,99 430,97 348,100 Z"/>',
  '      <path class="zk-fuge" d="M214,0 C212,60 216,130 214,190"/>',
  '      <path class="zk-fuge" d="M348,99 C430,96 520,98 620,95"/>',
  '      <path class="zk-pinsel" d="M470,18 C520,4 560,2 604,10"/>',
  '      <path class="zk-pinsel" d="M262,150 C300,140 330,142 344,136"/>',
  '      <path class="zk-pinsel" d="M40,60 C86,50 130,52 172,44"/>',
  '      <path class="zk-platte" d="M0,188 C120,185 208,190 330,187 C438,185 520,190 620,186 L620,250 L0,250 Z"/>',
  '      <path class="zk-plattenlicht" d="M0,192 C120,189 208,194 330,191 C438,189 520,194 620,190"/>',
  '      <path class="zk-pinsel hell" d="M60,214 C150,208 260,212 340,206"/>',
  '      <path class="zk-pinsel hell" d="M300,232 C380,226 470,230 560,224"/>',
  '',
  '      <!-- Cel-Ebene: alles, was sich bewegt (inkl. der Tasse, die voller wird) -->',
  '      <g id="zk-szene">',
  '        <!-- Teetasse mit Untertasse -->',
  '        <g transform="translate(470,196)">',
  '          <ellipse class="zk-schlagschatten" cx="2" cy="1" rx="62" ry="12"/>',
  '          <ellipse class="zk-keramik" cx="0" cy="-2" rx="58" ry="12"/>',
  '          <path class="zk-ton" d="M-58,-1 C-40,9 40,9 58,-1 C56,6 30,10 0,10 C-30,10 -56,6 -58,-1 Z"/>',
  '          <ellipse class="zk-ring" cx="0" cy="-3" rx="34" ry="7"/>',
  '          <path class="zk-henkel-um" d="M31,-42 C56,-42 55,-14 28,-13"/>',
  '          <path class="zk-henkel" d="M31,-42 C56,-42 55,-14 28,-13"/>',
  '          <path class="zk-keramik" d="M-33,-52 C-32,-33 -28,-15 -22,-8 A22 5.5 0 0 0 22,-8 C28,-15 32,-33 33,-52 Z"/>',
  '          <g clip-path="url(#zkTasseForm)">',
  '            <ellipse class="zk-ton" cx="30" cy="-26" rx="17" ry="30"/>',
  '            <ellipse class="zk-glanzflaeche" cx="-21" cy="-32" rx="6" ry="16" transform="rotate(6,-21,-32)"/>',
  '          </g>',
  '          <ellipse class="zk-innen" cx="0" cy="-52" rx="33" ry="8.5"/>',
  '        </g>',
  '',
  '        <!-- Zuckerpegel in der Tasse (steigt Runde für Runde) -->',
  '        <g clip-path="url(#zkTasseInnen)">',
  '          <g id="zk-pegel" transform="translate(0,202)">',
  '            <rect class="zk-fuellung" x="430" y="0" width="80" height="72"/>',
  '            <ellipse class="zk-flaeche" cx="470" cy="0" rx="40" ry="8"/>',
  '            <circle class="zk-krumel" cx="456" cy="-1" r="2"/>',
  '            <circle class="zk-krumel" cx="471" cy="3" r="1.6"/>',
  '            <circle class="zk-krumel" cx="483" cy="-2" r="1.8"/>',
  '            <circle class="zk-krumel" cx="464" cy="5" r="1.3"/>',
  '          </g>',
  '        </g>',
  '        <ellipse class="zk-randlinie" cx="470" cy="144" rx="33" ry="8.5"/>',
  '',
  '        <!-- Zuckerberg über dem Rand + Häufchen daneben (Finale) -->',
  '        <g id="zk-berg" transform="translate(470,144) scale(1,0)">',
  '          <path class="zk-fuellung" d="M-29,0 C-23,-11 -9,-18 0,-18 C10,-18 23,-10 29,0 Z"/>',
  '          <path class="zk-zuckerton" d="M4,-17 C12,-15 22,-8 27,0 L11,0 C10,-7 8,-13 4,-17 Z"/>',
  '        </g>',
  '        <!-- Was danebengeht: verstreute Körner auf dem Tisch -->',
  '        <g id="zk-streu" opacity="0">',
  '          <circle class="zk-korn-zucker" cx="414" cy="207" r="2.4"/>',
  '          <circle class="zk-korn-zucker" cx="396" cy="199" r="2"/>',
  '          <circle class="zk-korn-zucker" cx="432" cy="213" r="1.8"/>',
  '          <circle class="zk-korn-zucker" cx="455" cy="216" r="1.7"/>',
  '          <circle class="zk-korn-zucker" cx="494" cy="212" r="2.4"/>',
  '          <circle class="zk-korn-zucker" cx="522" cy="205" r="2.1"/>',
  '          <circle class="zk-korn-zucker" cx="540" cy="197" r="1.9"/>',
  '          <circle class="zk-korn-zucker" cx="376" cy="203" r="2"/>',
  '          <circle class="zk-korn-zucker" cx="551" cy="210" r="2.2"/>',
  '        </g>',
  '        <g id="zk-haufen" transform="translate(556,196) scale(0,0)">',
  '          <ellipse class="zk-schlagschatten" cx="0" cy="0" rx="26" ry="6"/>',
  '          <path class="zk-fuellung" d="M-23,0 C-18,-19 -7,-30 0,-30 C8,-30 18,-18 23,0 Z"/>',
  '          <path class="zk-zuckerton" d="M3,-29 C12,-24 19,-12 22,0 L8,0 C8,-11 6,-21 3,-29 Z"/>',
  '        </g>',
  '        <g id="zk-funken" opacity="0">',
  '          <path class="zk-funke" d="M0,-9 L2.2,-2.2 L9,0 L2.2,2.2 L0,9 L-2.2,2.2 L-9,0 L-2.2,-2.2 Z" transform="translate(432,118)"/>',
  '          <path class="zk-funke" d="M0,-7 L1.7,-1.7 L7,0 L1.7,1.7 L0,7 L-1.7,1.7 L-7,0 L-1.7,-1.7 Z" transform="translate(508,128)"/>',
  '          <path class="zk-funke" d="M0,-8 L2,-2 L8,0 L2,2 L0,8 L-2,2 L-8,0 L-2,-2 Z" transform="translate(470,100)"/>',
  '          <path class="zk-funke" d="M0,-6 L1.5,-1.5 L6,0 L1.5,1.5 L0,6 L-1.5,1.5 L-6,0 L-1.5,-1.5 Z" transform="translate(396,132)"/>',
  '        </g>',
  '',
  '        <!-- Rieselnde Körner -->',
  '        <g id="zk-koerner"></g>',
  '',
  '        <!-- Die Zuckerdose: Schatten bleibt auf dem Tisch, die Dose hüpft -->',
  '        <ellipse id="zk-schatten" class="zk-schlagschatten" cx="0" cy="0" rx="32" ry="7" transform="translate(62,196)"/>',
  '        <g id="zk-dose" transform="translate(62,196)">',
  '          <!-- Löffel liegt HINTER der Dose: beim Schöpfen verschwindet die',
  '               Laffe dadurch im Topf, beim Ausschütten steht sie frei. -->',
  '          <g id="zk-loeffel" transform="translate(42,-62) rotate(28)">',
  '            <path class="zk-stiel-um" d="M0,15 L0,-24"/>',
  '            <path class="zk-stiel" d="M0,15 L0,-24"/>',
  '            <path class="zk-loeffelkopf" d="M0,-37 C7,-33 7.5,-20 0,-15 C-7.5,-20 -7,-33 0,-37 Z"/>',
  '            <path class="zk-loeffelglanz" d="M-2,-31 C1.5,-29 2,-24 0,-21"/>',
  '            <path id="zk-loeffelzucker" class="zk-fuellung" opacity="0" d="M-5,-25 C-4,-31 -1,-34 0,-34 C1,-34 4,-31 5,-25 C3,-23 -3,-23 -5,-25 Z"/>',
  '          </g>',
  '          <!-- Urnenform: breiter Bauch, eingezogene Taille, ausgestellter Kragen -->',
  '          <path class="zk-keramik" d="M-13,-7 C-30,-11 -40,-18 -40,-27 C-40,-38 -29,-43 -22,-47 L22,-47 C29,-43 40,-38 40,-27 C40,-18 30,-11 13,-7 Z"/>',
  '          <g clip-path="url(#zkDoseForm)">',
  '            <path class="zk-ton" d="M16,-47 C31,-41 41,-33 40,-23 C39,-13 29,-7 14,-5 L-8,-5 C14,-11 26,-24 24,-38 Z"/>',
  '          </g>',
  '          <path class="zk-locke" d="M-25,-33 C-34,-31 -35,-18 -26,-16 C-20,-15 -18,-19 -19,-23"/>',
  '          <path class="zk-keramik" d="M-22,-47 L-31,-58 L31,-58 L22,-47 Z"/>',
  '          <ellipse class="zk-innen" cx="0" cy="-58" rx="31" ry="6.5"/>',
  '          <!-- Linker Arm: greift den Knauf des Deckels und hebt ihn hoch -->',
  '          <g id="zk-deckel" transform="rotate(0,-32,-40)">',
  '            <path class="zk-arm-um" d="M-32,-40 C-41,-52 -26,-64 -9,-69"/>',
  '            <path class="zk-arm" d="M-32,-40 C-41,-52 -26,-64 -9,-69"/>',
  '            <path class="zk-keramik" d="M-28,-62 C-18,-69 14,-69 24,-62 C14,-55 -18,-55 -28,-62 Z"/>',
  '            <path class="zk-keramik" d="M-13,-65 C-13,-71 -3,-71 -3,-65 Z"/>',
  '            <circle class="zk-hand" cx="-8" cy="-69" r="4.5"/>',
  '          </g>',
  '          <!-- Rechter Arm: die Hand hält den Löffel (der Löffel folgt ihr) -->',
  '          <g id="zk-arm-r" transform="rotate(0,30,-40)">',
  '            <path class="zk-arm-um" d="M30,-40 C39,-50 39,-57 42,-62"/>',
  '            <path class="zk-arm" d="M30,-40 C39,-50 39,-57 42,-62"/>',
  '            <circle class="zk-hand" cx="42" cy="-62" r="4.5"/>',
  '          </g>',
  '          <path class="zk-keramik" d="M-13,-8 L13,-8 L18,0 C18,2.5 -18,2.5 -18,0 Z"/>',
  '        </g>',
  '      </g>',
  '',
  '      <!-- Vignette & Filmkorn ganz oben drauf -->',
  '      <rect class="zk-vignette" x="0" y="0" width="620" height="250"/>',
  '      <rect class="zk-korn" x="0" y="0" width="620" height="250" filter="url(#zkKorn)"/>',
  '    </svg>'
].join('');

var sek=document.createElement('section');
sek.className='block zuckerblock';
if(Z.bg==='hell')sek.style.background='var(--hell)';
sek.innerHTML='<div class="wrap">'+
  (Z.title?'<h3 class="bh">'+Z.title+'</h3>':'')+
  (Z.sub?'<p class="bs">'+Z.sub+'</p>':'')+
  '<div id="zuckerbuehne" title="'+(Z.replayTitle||'Antippen = nochmal von vorn')+'">'+
  SVG+'<div class="zk-cap" id="zk-cap"></div></div></div>';
host.appendChild(sek);

var buehne=document.getElementById('zuckerbuehne');
var szene=document.getElementById('zk-szene');
/* Der Handstrich-Filter kostet pro Bild Rechenzeit — auf Handys bleiben die
   Linien deshalb glatt (dort ist die Szene ohnehin klein). */
if(szene&&!SB.isMobile)szene.setAttribute('filter','url(#zkSkizze)');
var dose=document.getElementById('zk-dose'),schatten=document.getElementById('zk-schatten'),
    loeffel=document.getElementById('zk-loeffel'),deckel=document.getElementById('zk-deckel'),
    armR=document.getElementById('zk-arm-r'),
    pegel=document.getElementById('zk-pegel'),berg=document.getElementById('zk-berg'),
    haufen=document.getElementById('zk-haufen'),
    koernerBox=document.getElementById('zk-koerner'),funken=document.getElementById('zk-funken'),
    loeffelzucker=document.getElementById('zk-loeffelzucker'),
    streu=document.getElementById('zk-streu'),
    cap=document.getElementById('zk-cap');

/* ---- Bühnenmaße (alles in viewBox-Einheiten) -------------------------------- */
var BASE=196,          // Tischkante: darauf steht alles
    X0=62,             // Startplatz links
    X1=392,            // Schöpfplatz dicht neben der Tasse
    TASSE=470,RAND=144,// Tassenmitte & Tassenrand
    PEGEL_LEER=202,PEGEL_VOLL=144,
    DECKEL_AUF=70,     // so weit hebt der linke Arm den Deckel am Knauf hoch
    SCHULTER_X=30,SCHULTER_Y=-40,   // rechte Schulter (Löffelarm)
    LSCHULTER_X=-32,                // linke Schulter (Deckelarm)
    HAND_X=42,HAND_Y=-62,           // Hand in Ruhelage (sie hält den Löffel)
    LAFFE=26,          // Abstand Griff → Laffe
    ARM_TAUCH=-75,     // Arm schwenkt den Löffel in die Dose
    ARM_TASSE=-5,      // …und dann über die Tasse
    LOEF_RUHE=28,LOEF_TAUCH=182,LOEF_TRAGEN=10,LOEF_KIPP=85,
    DREH_X=15,         // Kippkante: rechter Fußrand
    HUB=15,            // Hüpfhöhe
    HUEPFER=5,         // Hüpfer pro Weg
    TAKT=1/12;         // „auf Zweien": 12 Zeichnungen je Sekunde, wie im Trickfilm

/* Wie voll die Tasse nach Runde 1…4 ist – „mehr und mehr". */
var STUFEN=[0,.30,.55,.79,1];
var TEXTE=(Z.captions&&Z.captions.length===STUFEN.length)?Z.captions:STANDARDTEXTE;

/* ---- Zeitplan einer Runde (Sekunden) ---------------------------------------- */
var PHASEN=[['hin',1.15],['ansatz',.2],['deckel',.3],['tauchen',.45],['heben',.4],
            ['giess',.8],['zurueck',.45],['dreh',.18],['rueck',1.05],['dreh2',.18],['ruhe',.2]];
var RUNDE=0;for(var pi=0;pi<PHASEN.length;pi++)RUNDE+=PHASEN[pi][1];
var RUNDEN=STUFEN.length-1,FINALE=4.2,LEEREN=1;
var ZYKLUS=RUNDEN*RUNDE+FINALE+LEEREN;

function clamp(v,a,b){return v<a?a:(v>b?b:v);}
function lerp(a,b,t){return a+(b-a)*t;}
function weich(t){return t*t*(3-2*t);}                     // smoothstep
function zurueck(t){var k=t-1;return 1+2.7*k*k*k+1.7*k*k;} // easeOutBack
function phase(lt){
  var acc=0;
  for(var i=0;i<PHASEN.length;i++){
    if(lt<acc+PHASEN[i][1])return {n:PHASEN[i][0],p:(lt-acc)/PHASEN[i][1]};
    acc+=PHASEN[i][1];
  }
  return {n:'ruhe',p:1};
}
/* Hüpfen: Sinusbogen + Squash bei der Landung, Stretch im Scheitel. */
function huepfen(s,p,n,dir){
  var w=p*n*Math.PI,h=Math.abs(Math.sin(w));
  s.gang=w;
  var land=Math.pow(1-h,6);
  s.y=-HUB*h;
  s.rot=Math.cos(w)*7*dir;          // beim Abstoßen nach vorn, bei der Landung zurück
  s.sqx=1+.16*land;
  s.sqy=1-.16*land+.08*h*h*h;
}

/* Beim Marschieren schlenkern beide Arme gegenläufig mit — sonst sieht der
   Gang geschoben aus statt gelaufen. */
function gangArme(s){
  s.armR=Math.sin(s.gang)*10;
  s.deck=-Math.sin(s.gang)*7;
  s.loef=LOEF_RUHE+Math.sin(s.gang+1)*6;
}

/* ---- Zeitleiste: die ganze Szene als Funktion von t ------------------------- */
function zustand(t){
  var s={x:X0,y:0,rot:0,tilt:0,dir:1,sqx:1,sqy:1,loef:0,deck:0,
         armR:0,gang:0,pegel:0,berg:0,haufen:0,strahl:0,giessP:0,funke:0,zuckerLoef:0,text:0,zitterX:0,zitterY:0};
  var bild=Math.round(t/TAKT);                  // laufende Nummer der Zeichnung
  s.zitterX=(bild*7%3-1)*.45;s.zitterY=(bild*11%3-1)*.4;
  if(t<RUNDEN*RUNDE){
    var r=Math.floor(t/RUNDE),lt=t-r*RUNDE,ph=phase(lt),p=ph.p,e;
    s.text=r;s.pegel=STUFEN[r];s.loef=LOEF_RUHE;
    switch(ph.n){
      case 'hin':
        s.x=lerp(X0,X1,weich(p));huepfen(s,p,HUEPFER,1);gangArme(s);break;
      case 'ansatz':                                  // stehenbleiben, durchatmen
        s.x=X1;s.rot=-5*Math.sin(p*Math.PI);break;
      case 'deckel':                                  // linker Arm hebt den Deckel
        s.x=X1;s.deck=-DECKEL_AUF*weich(p);break;
      case 'tauchen':                                 // Löffel in die Dose, schöpfen
        e=weich(p);s.x=X1;s.deck=-DECKEL_AUF;
        s.armR=ARM_TAUCH*e;s.loef=lerp(LOEF_RUHE,LOEF_TAUCH,e);
        if(p>.55)s.loef+=Math.sin((p-.55)*Math.PI*9)*7;   // im Zucker rühren
        s.zuckerLoef=clamp((p-.6)/.3,0,1);break;
      case 'heben':                                   // gefüllt raus und rüber
        e=weich(p);s.x=X1;s.deck=-DECKEL_AUF;s.zuckerLoef=1;
        s.armR=lerp(ARM_TAUCH,ARM_TASSE,e);s.loef=lerp(LOEF_TAUCH,LOEF_TRAGEN,e);break;
      case 'giess':                                   // Laffe kippt, Zucker rieselt
        e=weich(clamp(p*1.8,0,1));
        s.x=X1;s.deck=-DECKEL_AUF;s.armR=ARM_TASSE;s.tilt=3;
        s.loef=lerp(LOEF_TRAGEN,LOEF_KIPP,e)+Math.sin(p*Math.PI*7)*2;
        s.giessP=p;s.strahl=clamp(p*6,0,1)*clamp((1-p)*6,0,1);
        s.zuckerLoef=1-weich(clamp((p-.08)/.45,0,1));
        s.pegel=lerp(STUFEN[r],STUFEN[r+1],weich(p));break;
      case 'zurueck':                                 // Arme zurück, Deckel zu
        e=weich(p);s.x=X1;s.deck=-DECKEL_AUF*(1-e);
        s.armR=ARM_TASSE*(1-e);s.loef=lerp(LOEF_KIPP,LOEF_RUHE,e);
        s.pegel=STUFEN[r+1];break;
      case 'dreh':                                    // Kehrtwende auf der Stelle
        s.x=X1;s.dir=Math.cos(p*Math.PI);s.y=-12*Math.sin(p*Math.PI);s.pegel=STUFEN[r+1];break;
      case 'rueck':
        s.x=lerp(X1,X0,weich(p));s.dir=-1;huepfen(s,p,HUEPFER,-1);gangArme(s);
        s.pegel=STUFEN[r+1];break;
      case 'dreh2':
        s.x=X0;s.dir=-Math.cos(p*Math.PI);s.y=-12*Math.sin(p*Math.PI);s.pegel=STUFEN[r+1];break;
      default:
        s.x=X0;s.pegel=STUFEN[r+1];
    }
    /* Was daneben geht, sammelt sich neben der Tasse (kleines Häufchen). */
    s.haufen=clamp((s.pegel-.18)/.82,0,1)*.62;
  }else if(t<RUNDEN*RUNDE+FINALE){
    var ft=t-(RUNDEN*RUNDE);
    s.text=RUNDEN;s.pegel=1;s.x=X0;
    s.berg=zurueck(clamp(ft/.55,0,1));
    s.haufen=.62+.38*clamp(ft/.7,0,1);
    if(ft>.25&&ft<1.45)huepfen(s,(ft-.25)/1.2,2,1);     // Freudensprünge
    s.funke=clamp(ft/.5,0,1)*clamp((FINALE-ft)/.8,0,1);
    s.loef=LOEF_RUHE+Math.sin(ft*7)*9;s.armR=Math.sin(ft*7)*8;
  }else{                                                // Tasse wird geleert, dann von vorn
    var et=(t-(RUNDEN*RUNDE+FINALE))/LEEREN;
    s.text=RUNDEN;s.x=X0;
    s.pegel=1-weich(clamp(et*1.3,0,1));
    s.berg=1-weich(clamp(et*2.6,0,1));
    s.haufen=1-weich(clamp(et*2,0,1));
  }
  return s;
}

/* ---- Zeichnen --------------------------------------------------------------- */
var KOERNER=[],ANZ=(SB.isMobile?16:30);
for(var ki=0;ki<ANZ;ki++){
  var c=document.createElementNS('http://www.w3.org/2000/svg','circle');
  c.setAttribute('class','zk-korn-zucker');c.setAttribute('r',[1.7,2.5,1.9,2.9,2.1,2.6,1.8][ki%7]);
  koernerBox.appendChild(c);KOERNER.push(c);
}
function f(v){return Math.round(v*100)/100;}
function drehPunkt(px,py,grad,cx,cy){
  var a=grad*Math.PI/180,co=Math.cos(a),si=Math.sin(a);
  return {x:cx+(px-cx)*co-(py-cy)*si,y:cy+(px-cx)*si+(py-cy)*co};
}
var letzterText=-1;
function zeichne(s){
  /* Linienzittern: echte Zeichentrick-Cels „kochen" leicht, weil jedes Bild
     neu gezeichnet wurde. Ein halber Pixel pro Zeichnung reicht dafür. */
  if(szene)szene.setAttribute('transform','translate('+f(s.zitterX)+','+f(s.zitterY)+')');
  dose.setAttribute('transform','translate('+f(s.x)+','+f(BASE+s.y)+') rotate('+f(s.rot)+
    ') rotate('+f(s.tilt)+','+DREH_X+',0) scale('+f(s.dir*s.sqx)+','+f(s.sqy)+')');
  var hoch=clamp(-s.y/HUB,0,1);
  schatten.setAttribute('transform','translate('+f(s.x+s.tilt*.35)+','+BASE+') scale('+f(1-.28*hoch)+',1)');
  schatten.setAttribute('opacity',f(.95-.45*hoch));
  deckel.setAttribute('transform','rotate('+f(s.deck)+','+LSCHULTER_X+','+SCHULTER_Y+')');
  armR.setAttribute('transform','rotate('+f(s.armR)+','+SCHULTER_X+','+SCHULTER_Y+')');
  var hand=drehPunkt(HAND_X,HAND_Y,s.armR,SCHULTER_X,SCHULTER_Y);
  loeffel.setAttribute('transform','translate('+f(hand.x)+','+f(hand.y)+') rotate('+f(s.loef)+')');
  pegel.setAttribute('transform','translate(0,'+f(lerp(PEGEL_LEER,PEGEL_VOLL,s.pegel))+')');
  berg.setAttribute('transform','translate('+TASSE+','+RAND+') scale('+f(.55+.45*s.berg)+','+f(Math.max(s.berg,0))+')');
  haufen.setAttribute('transform','translate(556,'+BASE+') scale('+f(Math.max(s.haufen,0))+')');
  funken.setAttribute('opacity',f(Math.max(s.funke,s.strahl*.5)));
  streu.setAttribute('opacity',f(clamp(s.pegel*1.3,0,1)*.9));

  /* Zucker rieselt vom Löffelkopf in die Tasse: viele feine Körner auf
     leicht gestreuten Bahnen, unten schneller — das liest sich als Rieseln,
     nicht als gegossener Strang. */
  if(s.strahl>.01){
    var a=s.loef*Math.PI/180;
    var hx=s.x+hand.x+Math.sin(a)*LAFFE,hy=BASE+s.y+hand.y-Math.cos(a)*LAFFE+3;
    var zy=Math.min(lerp(PEGEL_LEER,PEGEL_VOLL,s.pegel),RAND+14);
    for(var i=0;i<KOERNER.length;i++){
      var u=(s.giessP*1.75+i*0.137)%1;
      var seit=((i*29)%17-8)*.85;
      var gx=hx+3+seit*(.35+u)+(TASSE-hx)*u*.45;
      var gy=hy+(zy-hy)*(.25*u+.75*u*u);
      KOERNER[i].setAttribute('transform','translate('+f(gx)+','+f(gy)+')');
      KOERNER[i].setAttribute('opacity',f(s.strahl*clamp(u*8,0,1)*clamp((1-u)*6,0,1)));
    }
  }else{
    for(var j=0;j<KOERNER.length;j++)KOERNER[j].setAttribute('opacity',0);
  }
  loeffelzucker.setAttribute('opacity',f(s.zuckerLoef));
  if(s.text!==letzterText){letzterText=s.text;cap.textContent=TEXTE[s.text];}
}

/* ---- Antrieb: läuft nur, solange die Bühne im Bild und der Tab vorn ist ------ */
var raf=null,start=0,steht=0,laeuft=false,sichtbar=false;
var letztesBild=-1;
function tick(ts){
  raf=null;
  var t=((ts-start)/1000)%ZYKLUS;
  var bild=Math.floor(t/TAKT);                 // nur alle 1/12 s ein neues Bild
  if(bild!==letztesBild){letztesBild=bild;zeichne(zustand(bild*TAKT));}
  if(laeuft)raf=requestAnimationFrame(tick);
}
function los(){
  if(laeuft||SB.reduced||!sichtbar||document.hidden)return;
  laeuft=true;
  raf=requestAnimationFrame(function(ts){start=ts-steht*1000;tick(ts);});
}
function halt(){
  if(!laeuft)return;
  laeuft=false;
  if(raf)cancelAnimationFrame(raf);raf=null;
  steht=((performance.now()-start)/1000)%ZYKLUS;   // Position merken
}
function vonVorn(){halt();steht=0;letztesBild=-1;los();}   // halt() zuerst: es überschreibt steht

if(SB.reduced){
  zeichne(zustand(RUNDEN*RUNDE+1.2));              // Standbild: volle Tasse
  buehne.style.cursor='default';buehne.removeAttribute('title');
}else{
  zeichne(zustand(0));
  if(window.IntersectionObserver){
    new IntersectionObserver(function(es){
      es.forEach(function(e){sichtbar=e.isIntersecting;sichtbar?los():halt();});
    },{threshold:.15}).observe(buehne);
  }else{sichtbar=true;los();}
  document.addEventListener('visibilitychange',function(){document.hidden?halt():los();});
  buehne.addEventListener('click',function(){
    vonVorn();
    SB.showToast&&SB.showToast('Noch ein Löffel? Immer.');
  });
}

SB.zucker={zustand:zustand,zeichne:zeichne,los:los,halt:halt,ZYKLUS:ZYKLUS,RUNDE:RUNDE};
})();
