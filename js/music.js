/* ==========================================================================
   Schlemmer Bahn – Musik: „La vie en rose" (Zaz) am Rheinübergang
   Braucht: js/data.js (SB.config.YT_ID), js/ui.js (SB.showToast),
            js/story.js (SB.autopilot.hold)
   Stellt bereit: SB.music.reachFrance()

   Autoplay-Strategie:
   Browser erlauben unmutierten Ton nur nach einer „aktivierenden" Geste —
   und bei einem eingebetteten, plattformfremden YouTube-Player (der Ton läuft
   im iFrame, gesteuert per postMessage) verlangen manche Browser, dass genau
   DIESER Aufruf noch synchron innerhalb eines echten Klick-Handlers passiert.
   Ein früh „geprimtes" Scrollen/Wischen reicht dafür nicht zuverlässig überall.

   Deshalb: sobald der Zug Frankreich erreicht, erscheint ein kurzer, klarer
   Dialog („Wir überqueren den Rhein.“). Der Klick auf „Musik an & weiter" ist
   eine echte, frische Geste direkt am Button — das funktioniert in jedem
   Browser zuverlässig. Danach wird die Lautstärke sanft von 0 hochgefadet,
   kein harter Einsatz. Autopilot & Scrollen pausieren, solange der Dialog
   offen ist, und laufen beim Schließen genau da weiter, wo sie waren.
   ========================================================================== */
(function(){
'use strict';
var SB=window.SB;
var cfg=SB.config;
var TARGET_VOL=65;
var musicbtn=document.getElementById('musicbtn');
var gate=document.getElementById('francegate');
var gateGo=document.getElementById('fgate-go'),gateSkip=document.getElementById('fgate-skip');

var ytPlayer=null,ytReady=false,apiRequested=false;
var wantMusic=false,franceHit=false,playing=false,pendingPlay=false;
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
  ytPlayer=new YT.Player('yt',{videoId:cfg.YT_ID,
    playerVars:{autoplay:0,controls:0,rel:0,playsinline:1,modestbranding:1,loop:1,playlist:cfg.YT_ID},
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

/* ---- Frankreich-Gate: Dialog, Scroll-/Autopilot-Sperre ------------------------ */
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
  if(!gate)return;
  gateOpen=true;
  gate.classList.add('show');
  gate.setAttribute('aria-hidden','false');
  SB.autopilot&&SB.autopilot.hold(true);
  if(gateGo)gateGo.focus();
}
function closeGate(){
  if(!gate)return;
  gateOpen=false;
  gate.classList.remove('show');
  gate.setAttribute('aria-hidden','true');
  SB.autopilot&&SB.autopilot.hold(false);
}
if(gateGo)gateGo.addEventListener('click',function(){closeGate();startWithFadeIn();});
if(gateSkip)gateSkip.addEventListener('click',closeGate);
if(gate){
  gate.addEventListener('click',function(e){if(e.target===gate)closeGate();});   // Klick auf Backdrop
  gate.addEventListener('keydown',function(e){if(e.key==='Escape')closeGate();});
}

SB.music={
  reachFrance:function(){
    if(franceHit)return;franceHit=true;
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
