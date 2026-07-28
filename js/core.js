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
  SB.route={
    R:R,cum:cum,LEN:LEN,frac:frac,pointAt:pointAt,
    STOP_PTS:(trip.route.stopIdx||[]).map(function(i){return R[i];})
  };

  /* Szenen: Autoren schreiben Routen-PUNKT-Indizes (i0/i1); die Engine
     rechnet sie hier einmalig in Streckenanteile (f0/f1) um. */
  trip.scenes.forEach(function(s){s.f0=frac(s.i0);s.f1=frac(s.i1);});
  SB.scenes=trip.scenes;
  SB.N=trip.scenes.length;

  if(trip.meta&&trip.meta.title)document.title=trip.meta.title;
};
})();
