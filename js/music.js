/* ==========================================================================
   Schlemmer Bahn – Musik: „La vie en rose" (Zaz) am Rheinübergang
   Braucht: js/data.js (SB.config.YT_ID), js/ui.js (SB.showToast)
   Stellt bereit: SB.music.reachFrance()

   Autoplay-Strategie:
   Browser erlauben Ton nur nach einer „aktivierenden" Geste — laut Spec sind
   das NUR click, keydown und touchend. Scrollen (wheel/touchmove/scroll),
   auch das automatische Weiterscrollen des Autopiloten, zählt NICHT. Wer die
   Seite nur mit dem Mausrad durchscrollt, löst also nie von selbst eine
   gültige Geste aus — deshalb reichte es vorher oft nicht bis Frankreich.

   Lösung: Sobald IRGENDWO auf der Seite die allererste gültige Geste
   passiert (bei Touch meist einfach der erste Wisch zum Scrollen — ganz
   normales Verhalten, kein Extra-Tap nötig), wird der Player kurz lautlos
   an- und wieder ausgeschaltet („primen"). Das „verbraucht" die Geste schon
   VOR Frankreich. Kommt der Zug dann am Rhein an, wird nur noch die
   Lautstärke hochgefadet — kein neuer play()-Aufruf, also auch keine neue
   Geste nötig. Nur wenn bis Frankreich wirklich noch NIE eine gültige Geste
   vorkam (z. B. reines Mausrad-Scrollen ohne jeden Klick), bleibt der
   stumme Fallback mit Freischaltung bei der nächsten Geste übrig.
   ========================================================================== */
(function(){
'use strict';
var SB=window.SB;
var cfg=SB.config;
var TARGET_VOL=65;
var musicbtn=document.getElementById('musicbtn');

var ytPlayer=null,ytReady=false,apiRequested=false;
var wantMusic=false,franceHit=false,mutedFallback=false,playing=false;
var primed=false,priming=false,primeRequested=false;
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
        if(primeRequested)primeNow();
        if(wantMusic)tryPlay();
      },
      onStateChange:function(e){
        if(priming)return;   // kurzes Stumm-Anspielen soll die Anzeige nicht flackern lassen
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

/* Erste gültige Geste irgendwo auf der Seite → Player kurz lautlos anspielen
   und sofort wieder pausieren. „Verbraucht" die Geste schon vor Frankreich,
   damit dort nur noch die Lautstärke hochgefadet werden muss. */
function primeNow(){
  if(primed||priming)return;
  if(!ytReady){primeRequested=true;loadAPI();return;}
  priming=true;
  try{ytPlayer.unMute();ytPlayer.setVolume(0);ytPlayer.playVideo();}catch(e){}
  setTimeout(function(){
    try{ytPlayer.pauseVideo();}catch(e){}
    primed=true;priming=false;
  },300);
}

function tryPlay(){
  wantMusic=true;
  if(!ytReady){loadAPI();return;}   // onReady ruft tryPlay() erneut
  if(primed){
    // Schon früher freigeschaltet — nur fortsetzen & einblenden, kein neuer
    // play()-Aufruf nötig, also auch keine frische Geste erforderlich.
    mutedFallback=false;
    try{ytPlayer.unMute();ytPlayer.playVideo();}catch(e){}
    fadeVolume(TARGET_VOL,2600);
    return;
  }
  try{ytPlayer.unMute();ytPlayer.setVolume(0);ytPlayer.playVideo();}catch(e){}
  // Nach kurzer Frist prüfen, ob der Ton wirklich läuft.
  clearTimeout(tryPlay._t);
  tryPlay._t=setTimeout(function(){
    if(!wantMusic)return;
    var st=-9;try{st=ytPlayer.getPlayerState();}catch(e){}
    if(st===1||st===3){   // PLAYING oder BUFFERING → hörbar gestartet, einblenden
      primed=true;mutedFallback=false;
      fadeVolume(TARGET_VOL,2600);
    } else {               // vom Browser geblockt (noch nie eine gültige Geste) → Stumm-Start
      mutedFallback=true;
      try{ytPlayer.mute();ytPlayer.setVolume(TARGET_VOL);ytPlayer.playVideo();}catch(e){}
      if(musicbtn)musicbtn.classList.add('pulse');
      SB.showToast('♪ läuft stumm — einmal tippen für Ton');
    }
  },900);
}
function pause(){
  wantMusic=false;
  clearInterval(fadeTimer);
  try{ytPlayer&&ytPlayer.pauseVideo();}catch(e){}
}
/* Erste Geste nach dem Stumm-Start → Ton an, sanft eingeblendet. */
function unlockSound(){
  if(!mutedFallback||!ytReady)return;
  primed=true;mutedFallback=false;
  try{
    ytPlayer.unMute();ytPlayer.setVolume(0);
    if(ytPlayer.getPlayerState()!==1)ytPlayer.playVideo();
  }catch(e){}
  fadeVolume(TARGET_VOL,1800);
  if(musicbtn)musicbtn.classList.remove('pulse');
  setUI();
  SB.showToast('♪ La vie en rose · Zaz');
}

SB.music={
  reachFrance:function(){
    if(franceHit)return;franceHit=true;
    if(musicbtn){musicbtn.style.display='inline-flex';if(!primed)musicbtn.classList.add('pulse');}
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
/* Gültige Aktivierungs-Gesten laut Spec: click, keydown, touchend (NICHT
   wheel/touchmove/pointerdown — die zählen für Browser nicht als „Geste"). */
['click','keydown','touchend'].forEach(function(ev){
  window.addEventListener(ev,function(){primeNow();unlockSound();},{passive:true});
});
/* Player so früh wie möglich laden (auch bei Scroll-Vorgeschmack), damit die
   erste echte Geste sofort etwas zum Primen vorfindet. */
['pointerdown','touchstart','keydown','wheel'].forEach(function(ev){
  window.addEventListener(ev,loadAPI,{passive:true,once:true});
});
})();
