/* ==========================================================================
   Engine – Musik am Meilenstein (optional)
   Liest trip.music: { ytId, label, volume, triggerScene, gate:{flag,title,
   text,go,skip} }. Fehlt trip.music, tut dieses Modul nichts (SB.music=null)
   und der ♪-Knopf bleibt unsichtbar — der Trip funktioniert ohne Musik.
   Der Dialog (#francegate) wird hier dynamisch erzeugt, nicht in index.html.

   Warum ein Dialog? Browser erlauben unmutierten Ton nur nach einer echten
   Geste, und beim eingebetteten YouTube-Player (Ton läuft im iFrame, per
   postMessage gesteuert) verlangen manche Browser den play()-Aufruf synchron
   IM Klick-Handler. Ein Klick auf einen sichtbaren Button ist der einzige
   Weg, der überall zuverlässig funktioniert. Danach wird die Lautstärke
   sanft von 0 hochgefadet. Autopilot & Scrollen pausieren, solange der
   Dialog offen ist, und laufen beim Schließen genau dort weiter.
   ========================================================================== */
(function(){
'use strict';
var SB=window.SB;
var M=SB.trip.music;
var musicbtn=document.getElementById('musicbtn');
if(!M){SB.music=null;return;}

var TARGET_VOL=M.volume||65;
if(musicbtn){
  musicbtn.title=M.label||'Musik';
  musicbtn.setAttribute('aria-label','Musik an/aus: '+(M.label||''));
}

var ytPlayer=null,ytReady=false,apiRequested=false;
var wantMusic=false,hit=false,playing=false,pendingPlay=false;
var fadeTimer=null;

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
        if(pendingPlay){pendingPlay=false;startWithFadeIn();}
      },
      onStateChange:function(e){
        playing=(e.data===1);   // 1 = PLAYING
        setUI();
      }
    }});
};
/* Player so früh wie möglich laden, damit er beim Dialog schon bereitsteht. */
['pointerdown','touchstart','keydown','wheel'].forEach(function(ev){
  window.addEventListener(ev,loadAPI,{passive:true,once:true});
});

function setUI(){
  if(!musicbtn)return;
  musicbtn.classList.toggle('on',playing);
  musicbtn.setAttribute('aria-pressed',playing?'true':'false');
}

/* Direkt aus einem echten Klick-Handler aufrufen — nur dann ist der Ton in
   jedem Browser garantiert erlaubt. Startet bei Lautstärke 0 und blendet auf. */
function startWithFadeIn(){
  wantMusic=true;
  if(!ytReady){pendingPlay=true;loadAPI();return;}
  try{ytPlayer.unMute();ytPlayer.setVolume(0);ytPlayer.playVideo();}catch(e){}
  fadeVolume(TARGET_VOL,2600);
}
function pause(){
  wantMusic=false;
  clearInterval(fadeTimer);
  try{ytPlayer&&ytPlayer.pauseVideo();}catch(e){}
}
function resumeWithFadeIn(){
  if(!ytReady)return;
  wantMusic=true;
  try{ytPlayer.playVideo();}catch(e){}
  fadeVolume(TARGET_VOL,1800);
}

/* ---- Meilenstein-Dialog: dynamisch erzeugt, Scroll-/Autopilot-Sperre ---------- */
var G=M.gate||{};
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
function blockScroll(e){if(gateOpen)e.preventDefault();}
function blockScrollKeys(e){
  if(!gateOpen||gate.contains(e.target))return;
  if(['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '].indexOf(e.key)>-1)e.preventDefault();
}
window.addEventListener('wheel',blockScroll,{passive:false});
window.addEventListener('touchmove',blockScroll,{passive:false});
window.addEventListener('keydown',blockScrollKeys);

function openGate(){
  gateOpen=true;
  gate.classList.add('show');
  gate.setAttribute('aria-hidden','false');
  SB.autopilot&&SB.autopilot.hold(true);
  gateGo.focus();
}
function closeGate(){
  gateOpen=false;
  gate.classList.remove('show');
  gate.setAttribute('aria-hidden','true');
  SB.autopilot&&SB.autopilot.hold(false);
}
gateGo.addEventListener('click',function(){closeGate();startWithFadeIn();});
gateSkip.addEventListener('click',closeGate);
gate.addEventListener('click',function(e){if(e.target===gate)closeGate();});   // Klick auf Backdrop
gate.addEventListener('keydown',function(e){if(e.key==='Escape')closeGate();});

/* ---- Öffentliche Schnittstelle: story.js meldet jede Szene ---------------------- */
SB.music={
  onScene:function(si){
    if(hit||si<M.triggerScene)return;
    hit=true;
    if(musicbtn)musicbtn.style.display='inline-flex';
    openGate();
  }
};

/* Der ♪-Button dient nach dem Dialog nur noch als Pause/Weiter-Schalter. */
if(musicbtn){
  musicbtn.addEventListener('click',function(){
    if(!ytReady&&!playing){SB.showToast('♪ Musik lädt …');return;}
    if(playing)pause();else resumeWithFadeIn();
  });
}
})();
