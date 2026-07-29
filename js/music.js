/* ==========================================================================
   Engine – Musik am Meilenstein (optional)
   Liest trip.music: { ytId, label, volume, triggerScene, hint, autostart,
   gate:false | {flag,title,text,go,skip} }. Fehlt trip.music, tut dieses
   Modul nichts (SB.music=null) und der ♪-Knopf bleibt unsichtbar — der Trip
   funktioniert ohne Musik.

   Warum ist Ton überhaupt kompliziert? Browser lassen HÖRBAREN Ton nur zu,
   wenn die Seite schon einmal berührt wurde („user activation": Klick, Tipp,
   Tastendruck — Scrollen und Mausrad zählen ausdrücklich NICHT). Stummer Ton
   dagegen ist immer erlaubt.

   Daraus wird der Startweg (autostart, Standard: an):
   1. Am Meilenstein versuchen wir es direkt hörbar: unMute + play, Lautstärke
      von 0 hochgefadet. Auf jeder Seite, die vorher schon eine echte Geste
      gesehen hat (fast immer: der erste Tipp/Klick), klappt genau das.
   2. Kurz danach prüfen wir nach, ob wirklich hörbar gespielt wird. Wenn der
      Browser blockt, läuft der Titel STUMM weiter (immer erlaubt) — es fehlt
      dann nur noch das Aufdrehen.
   3. Dieses Aufdrehen passiert bei der nächsten Geste IRGENDWO auf der Seite,
      nicht erst beim Druck auf ♪. Ein Knopfdruck ist also nirgends nötig, der
      ♪-Knopf bleibt nur als Aus-/Ein-Schalter.

   Zwei Wege zum Meilenstein: `gate:{…}` legt dort einen Dialog vor
   (#francegate, hier dynamisch erzeugt) und hält so lange Autopilot und
   Scrollen an. `gate:false` unterbricht die Fahrt nicht — dann startet der
   Titel von selbst (siehe oben), dazu ein kurzer Hinweis (`hint`).
   ========================================================================== */
(function(){
'use strict';
var SB=window.SB;
var M=SB.trip.music;
var musicbtn=document.getElementById('musicbtn');
if(!M){SB.music=null;return;}

var TARGET_VOL=M.volume||65;
var AUTOSTART=(M.autostart!==false);
if(musicbtn){
  musicbtn.title=M.label||'Musik';
  musicbtn.setAttribute('aria-label','Musik an/aus: '+(M.label||''));
}

var ytPlayer=null,ytReady=false,apiRequested=false;
var wantMusic=false,hit=false,playing=false,pendingPlay=false;
var userOff=false;              // ♪ ausdrücklich ausgeschaltet → nichts mehr von selbst
var fadeTimer=null,checkTimer=null,checkTries=0;

function isMuted(){try{return ytPlayer.isMuted();}catch(e){return true;}}
function state(){try{return ytPlayer.getPlayerState();}catch(e){return -1;}}
function audible(){return playing&&!isMuted();}

/* Lautstärke in kleinen Schritten auf `to` bringen statt hart zu springen. */
function fadeVolume(to,ms){
  clearInterval(fadeTimer);
  var steps=24,stepMs=Math.max(ms/steps,25);
  var from=0;try{from=ytPlayer.getVolume();}catch(e){}
  var i=0;
  fadeTimer=setInterval(function(){
    if(!wantMusic){clearInterval(fadeTimer);return;}
    i++;
    try{ytPlayer.setVolume(Math.round(from+(to-from)*(i/steps)));}catch(e){}
    if(i>=steps)clearInterval(fadeTimer);
  },stepMs);
}

function loadAPI(){
  if(apiRequested||(window.YT&&window.YT.Player))return;
  apiRequested=true;
  var t=document.createElement('script');t.id='yt-api';t.src='https://www.youtube.com/iframe_api';
  (document.head||document.body).appendChild(t);
}
window.onYouTubeIframeAPIReady=function(){
  if(ytPlayer)return;
  ytPlayer=new YT.Player('yt',{videoId:M.ytId,
    playerVars:{autoplay:0,controls:0,rel:0,playsinline:1,modestbranding:1,loop:1,playlist:M.ytId},
    events:{
      onReady:function(){
        ytReady=true;
        if(pendingPlay){pendingPlay=false;startWithFadeIn();prueferStarten();}
      },
      onStateChange:function(e){
        playing=(e.data===1);   // 1 = PLAYING
        setUI();
      }
    }});
};
/* Player früh laden, damit er am Meilenstein bereitsteht — aber nicht MITTEN
   im Start. Das YouTube-Skript zieht einen kompletten Player samt iFrame nach
   und ist damit das größte Paket der Seite; die erste Geste ist meistens der
   erste Scroll, also genau der Moment, in dem die Karte ihre Kacheln holt und
   der Zug anfährt. Deshalb erst in einer Leerlaufpause danach (spätestens
   nach dem Timeout), und am Meilenstein notfalls sofort.                   */
function ladePlanen(){
  if(window.requestIdleCallback)requestIdleCallback(loadAPI,{timeout:6000});
  else setTimeout(loadAPI,2500);
}
['pointerdown','touchstart','keydown','wheel'].forEach(function(ev){
  window.addEventListener(ev,ladePlanen,{passive:true,once:true});
});
/* Ohne Autostart reicht die Geste oben als Auslöser — mit Autostart muss der
   Player auch dann stehen, wenn nie jemand tippt (Autopilot fährt allein). */
if(AUTOSTART)window.addEventListener('load',function(){setTimeout(ladePlanen,4000);});

function setUI(){
  if(!musicbtn)return;
  var an=audible();
  musicbtn.classList.toggle('on',an);
  musicbtn.classList.toggle('wait',playing&&!an);   // läuft stumm, wartet auf Geste
  musicbtn.setAttribute('aria-pressed',an?'true':'false');
}

/* Direkt aus einem echten Klick-Handler aufrufen — dann ist der Ton in jedem
   Browser garantiert erlaubt. Startet bei Lautstärke 0 und blendet auf. */
function startWithFadeIn(){
  wantMusic=true;userOff=false;
  if(!ytReady){pendingPlay=true;loadAPI();return;}
  try{ytPlayer.unMute();ytPlayer.setVolume(0);ytPlayer.playVideo();}catch(e){}
  fadeVolume(TARGET_VOL,2600);
  setUI();
}
function pause(){
  wantMusic=false;userOff=true;
  clearInterval(fadeTimer);clearTimeout(checkTimer);
  gesteWiederAbmelden();
  try{ytPlayer&&ytPlayer.pauseVideo();}catch(e){}
}

/* ---- Autostart: erst hörbar versuchen, sonst stumm laufen lassen -------------
   Schritt 1 ist derselbe Aufruf wie beim Knopfdruck. Schritt 2 schaut nach,
   ob daraus wirklich Ton wurde: `getPlayerState()===1` UND nicht stumm. Ein
   blockierter Start sieht anders aus (unstarted/paused oder vom Player selbst
   stummgeschaltet) — dann übernimmt der stille Weg.                        */
function autoStart(){
  if(userOff)return;
  startWithFadeIn();
  if(!ytReady)return;            // onReady spielt nach, prueferStarten folgt dort
  prueferStarten();
}
function prueferStarten(){
  clearTimeout(checkTimer);checkTries=0;
  checkTimer=setTimeout(pruefen,1400);
}
function pruefen(){
  if(userOff)return;
  var st=state();
  if(st===1&&!isMuted()){setUI();return;}           // läuft hörbar — fertig
  if((st===3||st===-1)&&++checkTries<3){            // puffert noch → nochmal schauen
    checkTimer=setTimeout(pruefen,1400);return;
  }
  stummWeiterlaufen();
}
/* Blockiert: stumm ist immer erlaubt. Der Titel läuft also los, und es fehlt
   nur noch das Aufdrehen — das übernimmt die nächste Geste irgendwo auf der
   Seite. Scrollen/Mausrad zählen dabei nicht als Geste, deshalb stehen hier
   nur die Ereignisse, die der Browser wirklich als Berührung wertet.      */
var hinweisGezeigt=false;
function stummWeiterlaufen(){
  wantMusic=true;
  clearInterval(fadeTimer);
  try{ytPlayer.mute();ytPlayer.playVideo();}catch(e){}
  gesteAbwarten();
  setUI();
  if(!hinweisGezeigt&&SB.showToast){
    hinweisGezeigt=true;
    SB.showToast(M.hint||('♪ '+(M.label||'Musik')+' — tippe kurz, dann läuft sie.'));
  }
}

/* Nur Ereignisse, die der Browser als echte Berührung wertet. Scrollen und
   Mausrad fehlen hier mit Absicht: sie zählen nicht als Geste. Wertet der
   Browser eine davon doch nicht (z. B. ein touchend, aus dem ein Scroll
   wurde), fällt der Prüfer unten wieder auf „stumm weiter" zurück und
   meldet sich erneut an — der nächste Griff versucht es dann noch mal.   */
var GESTEN=['pointerdown','touchend','keydown','click'];
function ersteGeste(e){
  /* Griffe auf die Bedienelemente überlassen wir deren eigenen Handlern.
     Sonst würde dieser Lauscher (Capture-Phase, also VOR dem Knopf) den Ton
     erst aufdrehen — und der ♪-Knopf sähe danach „läuft hörbar" und würde
     ihn sofort wieder ausschalten. Ein Klick auf ♪ täte dann nichts.     */
  var t=e&&e.target;
  if(t&&t.nodeType===1&&t.closest&&t.closest('#musicbtn,#francegate'))return;
  gesteWiederAbmelden();
  if(userOff)return;
  startWithFadeIn();
  if(ytReady)prueferStarten();
}
function gesteAbwarten(){
  GESTEN.forEach(function(ev){window.addEventListener(ev,ersteGeste,{capture:true,passive:true});});
}
function gesteWiederAbmelden(){
  GESTEN.forEach(function(ev){window.removeEventListener(ev,ersteGeste,{capture:true});});
}

/* ---- Am Meilenstein: Dialog ODER Autostart -----------------------------------
   Der Dialog ist der ausdrückliche Weg, den Ton freizugeben — er hält dafür
   aber die ganze Fahrt an. `gate:false` lässt ihn weg: dann startet der Titel
   von selbst (hörbar, wenn der Browser es zulässt; sonst stumm, bis die
   nächste Berührung ihn aufdreht).                                        */
/* Nur ein AUSDRÜCKLICHES gate:false schaltet den Dialog ab — ein Trip, der
   das Feld einfach weglässt, bekommt weiter den alten Standard (Dialog mit
   Standardtexten). So bricht die Änderung keine bestehenden Trips.        */
var G=(M.gate===undefined)?{}:M.gate,openGate=null;
if(G){
  var gate=document.createElement('div');
  gate.id='francegate';
  gate.setAttribute('role','dialog');
  gate.setAttribute('aria-modal','true');
  gate.setAttribute('aria-labelledby','fgate-h');
  gate.setAttribute('aria-hidden','true');
  gate.innerHTML=
    '<div class="fgate-card">'+
      (G.flag?'<div class="fgate-flag">'+G.flag+'</div>':'')+
      '<h4 id="fgate-h">'+(G.title||'')+'</h4>'+
      (G.text?'<p>'+G.text+'</p>':'')+
      '<div class="fgate-actions">'+
        '<button id="fgate-go" class="rot" type="button">'+(G.go||'♪ Musik an')+'</button>'+
        '<button id="fgate-skip" type="button" class="fgate-skip">'+(G.skip||'Ohne Musik weiter')+'</button>'+
      '</div>'+
    '</div>';
  document.body.appendChild(gate);
  var gateGo=document.getElementById('fgate-go'),gateSkip=document.getElementById('fgate-skip');

  var gateOpen=false;
  var blockScroll=function(e){if(gateOpen)e.preventDefault();};
  var blockScrollKeys=function(e){
    if(!gateOpen||gate.contains(e.target))return;
    if(['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '].indexOf(e.key)>-1)e.preventDefault();
  };
  window.addEventListener('wheel',blockScroll,{passive:false});
  window.addEventListener('touchmove',blockScroll,{passive:false});
  window.addEventListener('keydown',blockScrollKeys);

  openGate=function(){
    gateOpen=true;
    gate.classList.add('show');
    gate.setAttribute('aria-hidden','false');
    SB.autopilot&&SB.autopilot.hold(true);
    gateGo.focus();
  };
  var closeGate=function(){
    gateOpen=false;
    gate.classList.remove('show');
    gate.setAttribute('aria-hidden','true');
    SB.autopilot&&SB.autopilot.hold(false);
  };
  gateGo.addEventListener('click',function(){closeGate();startWithFadeIn();});
  gateSkip.addEventListener('click',function(){userOff=true;closeGate();});
  gate.addEventListener('click',function(e){if(e.target===gate)closeGate();});  // Backdrop
  gate.addEventListener('keydown',function(e){if(e.key==='Escape')closeGate();});
}

/* ---- Öffentliche Schnittstelle: story.js meldet jede Szene ---------------------- */
SB.music={
  onScene:function(si){
    if(hit||si<M.triggerScene)return;
    hit=true;
    loadAPI();                        // ab hier kann jederzeit geklickt werden
    if(musicbtn)musicbtn.style.display='inline-flex';
    if(openGate){openGate();return;}
    if(AUTOSTART)autoStart();
    else if(SB.showToast)SB.showToast(M.hint||('♪ '+(M.label||'Musik')+' — oben antippen.'));
  }
};

/* Der ♪-Button ist nur noch Schalter, kein Startknopf: hörbar → aus, sonst
   an. Über startWithFadeIn(), das sich den Wunsch merkt (pendingPlay), falls
   der Player noch lädt, statt den Klick zu verschlucken.                  */
if(musicbtn){
  musicbtn.addEventListener('click',function(){
    if(audible()){pause();return;}
    gesteWiederAbmelden();            // dieser Klick IST die Geste
    if(!ytReady&&SB.showToast)SB.showToast('♪ Musik lädt …');
    startWithFadeIn();
    if(ytReady)prueferStarten();
  });
}
})();
