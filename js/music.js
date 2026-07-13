/* ==========================================================================
   SenfBahn – Musik: „La vie en rose" (Zaz) am Rheinübergang
   Braucht: js/data.js (SB.config.YT_ID), js/ui.js (SB.showToast)
   Stellt bereit: SB.music.reachFrance()

   Autoplay-Strategie (Browser blocken Ton ohne Nutzer-Geste):
     1. Frankreich erreicht → Versuch, MIT Ton zu starten.
     2. Blockt der Browser → sofort STUMM starten (stumm ist immer erlaubt)
        und bei der allernächsten Geste (Tipp/Taste/Scroll-Rad) den Ton
        einschalten. Fühlt sich wie echtes Autoplay an.
   ========================================================================== */
(function(){
'use strict';
var SB=window.SB;
var cfg=SB.config;
var musicbtn=document.getElementById('musicbtn');

var ytPlayer=null,ytReady=false,apiRequested=false;
var wantMusic=false,franceHit=false,mutedFallback=false,playing=false;

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
      onReady:function(){ytReady=true;if(wantMusic)tryPlay();},
      onStateChange:function(e){
        playing=(e.data===1);   // 1 = PLAYING
        setUI();
      }
    }});
};

function setUI(){
  if(!musicbtn)return;
  var on=playing&&!mutedFallback;   // „an" heißt: läuft UND ist hörbar
  musicbtn.classList.toggle('on',on);
  if(on)musicbtn.classList.remove('pulse');
  musicbtn.setAttribute('aria-pressed',on?'true':'false');
}

function tryPlay(){
  wantMusic=true;
  if(!ytReady){loadAPI();return;}   // onReady ruft tryPlay() erneut
  try{ytPlayer.unMute();ytPlayer.setVolume(65);ytPlayer.playVideo();}catch(e){}
  // Nach kurzer Frist prüfen: Läuft nichts? → Autoplay geblockt → Stumm-Start.
  clearTimeout(tryPlay._t);
  tryPlay._t=setTimeout(function(){
    if(!wantMusic)return;
    var st=-9;try{st=ytPlayer.getPlayerState();}catch(e){}
    if(st!==1&&st!==3){   // weder PLAYING noch BUFFERING
      mutedFallback=true;
      try{ytPlayer.mute();ytPlayer.playVideo();}catch(e){}
      if(musicbtn)musicbtn.classList.add('pulse');
      SB.showToast('♪ läuft stumm — einmal tippen für Ton');
    }
  },900);
}
function pause(){
  wantMusic=false;
  try{ytPlayer&&ytPlayer.pauseVideo();}catch(e){}
}
/* Erste Geste nach dem Stumm-Start → Ton an. */
function unlockSound(){
  if(!mutedFallback||!ytReady)return;
  mutedFallback=false;
  try{
    ytPlayer.unMute();ytPlayer.setVolume(65);
    if(ytPlayer.getPlayerState()!==1)ytPlayer.playVideo();
  }catch(e){}
  if(musicbtn)musicbtn.classList.remove('pulse');
  setUI();
  SB.showToast('♪ La vie en rose · Zaz');
}

SB.music={
  reachFrance:function(){
    if(franceHit)return;franceHit=true;
    if(musicbtn){musicbtn.style.display='inline-flex';musicbtn.classList.add('pulse');}
    SB.showToast('♪ La vie en rose · Zaz');
    tryPlay();
  }
};

if(musicbtn){
  musicbtn.addEventListener('click',function(){
    musicbtn.classList.remove('pulse');
    if(mutedFallback){unlockSound();return;}
    if(playing){pause();}
    else{if(!ytReady)SB.showToast('♪ Musik lädt …');tryPlay();}
  });
}
/* Ton-Freischaltung nach Stumm-Start: irgendeine echte Geste genügt. */
['pointerdown','touchend','keydown','wheel'].forEach(function(ev){
  window.addEventListener(ev,unlockSound,{passive:true});
});
/* Player früh laden, damit der Ton am Rhein sofort bereitsteht. */
['pointerdown','touchstart','keydown','wheel'].forEach(function(ev){
  window.addEventListener(ev,loadAPI,{passive:true,once:true});
});
})();
