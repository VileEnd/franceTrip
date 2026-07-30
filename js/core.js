/* ==========================================================================
   Engine – Kern: Namespace, Geräte-Erkennung, Routen-Mathematik
   Lädt als ERSTES. Danach: trip.js (Daten) → ui → map → music → story.

   Trip-Autoren müssen diese Datei nie anfassen: SB.prepareTrip() wird am
   Ende von js/trip.js aufgerufen und macht die Daten fahrbereit (Route
   vermessen, Szenen-Indizes in Streckenanteile umrechnen, Defaults setzen).
   ========================================================================== */
(function(){
'use strict';
var SB=window.SB=window.SB||{};

/* Geräte-Erkennung – steuert alle Performance-Abkürzungen der Engine. */
SB.reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
SB.isMobile=window.matchMedia('(max-width:640px)').matches||
            (('ontouchstart' in window)&&Math.min(screen.width,screen.height)<820);
SB.lowPower=SB.isMobile||(navigator.hardwareConcurrency||8)<=4;

SB.fmtEUR=function(n){return n.toFixed(2).replace('.',',')+' €';};

var CONFIG_DEFAULTS={
  sceneVh:260,          // Scrollhöhe pro Szene (vh)
  autoSecPerScene:12,   // Autopilot-Tempo: Sekunden pro Szene
  tickerLabel:'Fahrtkosten p. P.'
};

/* Macht SB.trip fahrbereit. Wird am Ende von js/trip.js aufgerufen. */
SB.prepareTrip=function(){
  var trip=SB.trip;
  if(!trip)throw new Error('SB.trip fehlt — js/trip.js muss vor den Engine-Dateien laden.');

  var cfg=trip.config||{};
  for(var k in CONFIG_DEFAULTS)if(cfg[k]===undefined)cfg[k]=CONFIG_DEFAULTS[k];
  trip.config=cfg;
  SB.config=cfg;   // Kurz-Alias für die Engine

  /* Route vermessen: kumulierte Länge je Punkt → Position bei Anteil f. */
  var R=trip.route.coords;
  function d(a,b){var dx=a[0]-b[0],dy=a[1]-b[1];return Math.sqrt(dx*dx+dy*dy);}
  var cum=[0];for(var i=1;i<R.length;i++)cum[i]=cum[i-1]+d(R[i-1],R[i]);
  var LEN=cum[cum.length-1];
  function frac(idx){return cum[idx]/LEN;}
  function pointAt(f){var t=f*LEN;
    for(var i=1;i<cum.length;i++){if(cum[i]>=t){var lt=(t-cum[i-1])/Math.max(cum[i]-cum[i-1],1e-9);
      return [R[i-1][0]+(R[i][0]-R[i-1][0])*lt,R[i-1][1]+(R[i][1]-R[i-1][1])*lt];}}
    return R[R.length-1];}

  /* ---- Namen statt Nummern -------------------------------------------------
     Sobald eine Route nicht mehr aus zwanzig, sondern aus zweihundert Punkten
     besteht (Straßenzüge!), sind Zahlen-Indizes in den Szenen nicht mehr
     lesbar und beim Einfügen eines Punktes sofort falsch. Deshalb darf
     trip.route.marks Namen vergeben — Szenen und Etappen dürfen dann überall
     'kolosseum' statt 87 schreiben.                                         */
  var marks=trip.route.marks||{};
  function idx(v){
    if(typeof v==='number')return v;
    if(v==='ende')return R.length-1;
    if(marks[v]===undefined)throw new Error('Unbekannter Streckenpunkt: '+v);
    return marks[v];
  }

  /* ---- Reisearten je Abschnitt ---------------------------------------------
     trip.route.legs=[{to:<Index|Name>, mode:'rail'|'foot'|'bus'|…}, …]
     Jeder Eintrag beschreibt das Stück von dort, wo der vorige aufhörte, bis
     `to`. Daraus entsteht für jedes Streckensegment eine Reiseart — die Karte
     wählt danach Fahrzeug, Zoom und Linienstil. Ohne `legs` ist alles 'rail',
     die Karte verhält sich dann exakt wie bisher.                           */
  var segM=[],legs=(trip.route.legs||[]).map(function(l){
    return {to:idx(l.to),mode:l.mode||'rail'};
  });
  (function(){
    var pos=0,letzte=legs.length?legs[legs.length-1].mode:'rail';
    legs.forEach(function(l){
      for(;pos<l.to&&pos<R.length-1;pos++)segM[pos]=l.mode;
      pos=Math.max(pos,l.to);
    });
    for(;pos<R.length-1;pos++)segM[pos]=letzte;
  })();
  /* Segment-Nummer zu einem Streckenanteil (Segment i verbindet R[i], R[i+1]). */
  function segAt(f){var t=f*LEN,i;
    for(i=1;i<cum.length;i++)if(cum[i]>=t)return i-1;
    return cum.length-2;}
  function modeAt(f){return segM[Math.max(0,segAt(f))]||'rail';}

  /* Zusammenhängende Abschnitte gleicher Reiseart — die Karte zeichnet
     daraus je Art eine eigene Linie (Gleis, Trittspur, Buslinie). */
  var lines={};
  (function(){
    var s=0;
    for(var i=1;i<=segM.length;i++){
      if(i===segM.length||segM[i]!==segM[s]){
        (lines[segM[s]]=lines[segM[s]]||[]).push(R.slice(s,i+1));
        s=i;
      }
    }
  })();

  SB.route={
    R:R,cum:cum,LEN:LEN,frac:frac,pointAt:pointAt,idx:idx,
    segModes:segM,modeAt:modeAt,lines:lines,
    STOP_PTS:(trip.route.stopIdx||[]).map(function(i){return R[idx(i)];})
  };

  /* Szenen: Autoren schreiben Routen-PUNKTE (i0/i1, Zahl oder Name); die
     Engine rechnet sie hier einmalig in Streckenanteile (f0/f1) um. */
  trip.scenes.forEach(function(s){
    s.i0=idx(s.i0);s.i1=idx(s.i1);
    s.f0=frac(s.i0);s.f1=frac(s.i1);
  });
  SB.scenes=trip.scenes;
  SB.N=trip.scenes.length;

  if(trip.meta&&trip.meta.title)document.title=trip.meta.title;
};
})();
