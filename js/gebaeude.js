/* ==========================================================================
   VERSUCH: 3D-Gebäude auf der Karte  —  nur mit ?3d=1
   Diese Datei ist bewusst ein abgetrennter Versuch. Ohne den Schalter in der
   Adresszeile tut sie gar nichts, und sie fasst weder den Kartenstil noch
   die Fahrzeuge an. Fällt sie weg, ist die Seite exakt die von vorher.

   ---- Warum nicht streets.gl? --------------------------------------------
   streets.gl ist eine Anwendung, keine Bibliothek: kein Einbettungs-API,
   keine Custom-Layer wie bei MapLibre — unser Zug und die beiden Gehenden
   müssten in deren Renderer neu gebaut werden. Dazu holt es seine Geometrie
   live von öffentlichen Overpass-Servern (für eine veröffentlichte Seite
   weder erlaubt noch verlässlich) und nennt als Mindestanforderung eine
   moderne dedizierte Grafikkarte. Für eine Einladung, die auf einem Handy
   geöffnet wird, ist das der falsche Weg.

   Was denselben Eindruck macht und fast nichts kostet: MapLibre kann
   Gebäude selbst extrudieren. Dafür braucht es Vektorkacheln — die
   Rasterkacheln von CARTO bleiben liegen, die Häuser kommen als EINE
   zusätzliche Ebene obendrauf. Zwei Vorsichtsmaßnahmen:

   * Die Kachel-Adresse wird NICHT fest verdrahtet, sondern zur Laufzeit aus
     dem Style des Anbieters gelesen. Anbieter versionieren ihre Pfade; ein
     hart notierter Pfad wäre irgendwann tot.
   * Geht dabei irgendetwas schief, bleibt es bei der Karte von heute. Der
     Versuch darf die Seite nicht mitreißen.

   Schalter (alle optional, hinten an die Adresse hängen):
     ?3d=1            Gebäude an (Standardanbieter: OpenFreeMap)
     ?3d=<Style-URL>  eigener Anbieter, z. B. eine MapTiler-Style-URL
     &bl=building     Name der Gebäude-Ebene in den Kacheln (OpenMapTiles)
     &3dall=1         Häuser auch auf der Bahnfahrt (Standard: nur Stadt)
     ?fps             kleine Anzeige mit Bildrate & Rucklern (zum Vergleichen)
   ========================================================================== */
(function(){
'use strict';
var SB=window.SB;
if(!SB||!SB.mapCtl)return;

/* ?fps ohne Wert soll auch zählen — deshalb von Hand geparst. */
function param(n){
  var m=new RegExp('[?&]'+n+'(=([^&]*))?').exec(location.search);
  return m?(m[2]===undefined?'1':decodeURIComponent(m[2])):null;
}
var flag=param('3d');
var an=!!flag&&flag!=='0';
var STYLE=(flag&&flag.indexOf('http')===0)?flag
          :'https://tiles.openfreemap.org/styles/liberty';
var EBENE=param('bl')||'building';
var IMMER=param('3dall')==='1';

/* ---- Kleine Anzeige unten links -----------------------------------------
   Die Stile stehen hier und nicht in style.css: der Versuch soll sich mit
   einer einzigen Datei wieder entfernen lassen.                           */
var box=null;
function melde(txt){
  if(!box){
    box=document.createElement('div');
    box.id='dreid';
    /* Unter die Topbar gesetzt: die liegt fix darüber und würde die Zahlen
       sonst verdecken. Unten links sitzt die Story-Tafel. */
    box.style.cssText='position:absolute;left:12px;top:66px;z-index:12;'+
      'background:rgba(20,24,32,.78);color:#fff;font:600 11px/1.45 Inter,system-ui,sans-serif;'+
      'padding:6px 10px;border-radius:8px;white-space:pre;pointer-events:none;'+
      'font-variant-numeric:tabular-nums';
    var st=document.getElementById('stage');
    (st||document.body).appendChild(box);
  }
  box.textContent=txt;
}

/* ---- Bildrate messen -----------------------------------------------------
   Zum Vergleichen braucht es Zahlen, nicht Gefühl: Bilder pro Sekunde und
   die Summe der langen Aufgaben (alles über 50 ms blockiert die Eingabe).  */
var fps={an:param('fps')!==null||an,bilder:0,seit:0,wert:0,lang:0,jetztLang:0};
function messen(){
  if(!fps.an)return;
  if(window.PerformanceObserver){
    try{
      new PerformanceObserver(function(l){
        l.getEntries().forEach(function(e){fps.lang+=e.duration;});
      }).observe({entryTypes:['longtask']});
    }catch(e){}
  }
  fps.seit=performance.now();
  (function tick(){
    fps.bilder++;
    var jetzt=performance.now();
    if(jetzt-fps.seit>=1000){
      fps.wert=Math.round(fps.bilder*1000/(jetzt-fps.seit));
      fps.jetztLang=fps.lang;fps.lang=0;      // je Sekunde, nicht aufsummiert
      fps.bilder=0;fps.seit=jetzt;
      zeige();
    }
    requestAnimationFrame(tick);
  })();
}
var haeuser='—';
function zeige(){
  if(!fps.an)return;
  melde(fps.wert+' fps · '+Math.round(fps.jetztLang||0)+' ms/s blockiert\nHäuser: '+haeuser);
}

/* ---- Gebäude-Ebene -------------------------------------------------------
   Unter unsere eigenen Linien gehängt: der rote Faden und die Trittspur
   sollen über den Dächern liegen, sonst verschwindet in der Altstadt genau
   der Weg, um den es geht. Höhen kommen aus dem OpenMapTiles-Schema
   (render_height / render_min_height), mit height/min_height als Ausweg.  */
function hoehe(a,b,fb){return ['coalesce',['get',a],['get',b],fb];}
function unterUnserenLinien(map){
  var kandidaten=['rail-bed','rail-casing','route','foot-casing','foot',
                  'bus-casing','bus-line','done','stops-o'];
  for(var i=0;i<kandidaten.length;i++)
    if(map.getLayer(kandidaten[i]))return kandidaten[i];
  return undefined;
}
function ebeneBauen(map,quelle){
  map.addSource('omt',quelle);
  map.addLayer({
    id:'gebaeude',type:'fill-extrusion',source:'omt','source-layer':EBENE,
    minzoom:13.5,
    /* Unsichtbar starten: eine Ebene ohne Sichtbarkeit lässt MapLibre gar
       keine Kacheln laden — auf der Bahnfahrt kostet das also nichts. */
    layout:{visibility:'none'},
    paint:{
      'fill-extrusion-color':['interpolate',['linear'],hoehe('render_height','height',8),
        0,'#EDE7DB', 10,'#E3DCCD', 25,'#D6CDBB', 60,'#C7BCA6'],
      'fill-extrusion-height':hoehe('render_height','height',8),
      'fill-extrusion-base':hoehe('render_min_height','min_height',0),
      'fill-extrusion-opacity':0.93
    }
  },unterUnserenLinien(map));
  haeuser='an (aus)';
  SB.gebaeude.bereit=true;
  schalte(SB.mapCtl.mode||'rail');
}
/* Nur dort einblenden, wo wir wirklich zwischen Häusern stehen. Auf der
   Bahnfahrt bei Zoom 9 wäre es ohnehin nichts als Rechenzeit. */
function schalte(m){
  var map=SB.mapCtl.map;
  if(!map||!map.getLayer('gebaeude'))return;
  var zeigen=IMMER||m==='foot'||m==='bus';
  map.setLayoutProperty('gebaeude','visibility',zeigen?'visible':'none');
  haeuser=zeigen?'sichtbar':'an (aus)';
  zeige();
}
SB.mapCtl.onMode=function(m){if(SB.gebaeude&&SB.gebaeude.bereit)schalte(m);};
SB.gebaeude={bereit:false,ebeneBauen:ebeneBauen};

/* ---- Style holen, Vektorquelle herauslösen ------------------------------- */
function starte(map){
  haeuser='lädt …';zeige();
  if(!window.fetch){haeuser='Browser zu alt';zeige();return;}
  fetch(STYLE).then(function(r){
    if(!r.ok)throw new Error('HTTP '+r.status);
    return r.json();
  }).then(function(st){
    var q=null,k;
    for(k in (st.sources||{}))
      if(st.sources[k]&&st.sources[k].type==='vector'){q=st.sources[k];break;}
    if(!q)throw new Error('keine Vektorquelle im Style');
    ebeneBauen(map,q);
  })['catch'](function(e){
    /* Bewusst leise: die Karte von heute steht ja noch. */
    haeuser='nicht geladen ('+e.message+')';zeige();
  });
}

if(an||fps.an){
  messen();
  var warte=setInterval(function(){
    if(!SB.mapCtl.ready||!SB.mapCtl.map)return;
    clearInterval(warte);
    zeige();
    if(an)starte(SB.mapCtl.map);
  },250);
}
})();
