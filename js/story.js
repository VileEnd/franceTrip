/* ==========================================================================
   Engine – Scrollytelling: Render-Loop & Autopilot
   Braucht: core/trip (Szenen/Route/Config), ui.js (startType),
            map.js (mapCtl), music.js (SB.music, optional)
   ========================================================================== */
(function(){
'use strict';
var SB=window.SB;
var cfg=SB.config,SC=SB.scenes,N=SB.N,route=SB.route;
var scrolly=document.getElementById('scrolly');
var tv=document.getElementById('tv'),progfill=document.getElementById('progfill');

function clamp(v,a,b){return v<a?a:(v>b?b:v);}
function ease(t){return t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;}
function lerp(a,b,t){return a+(b-a)*t;}
function progress(){
  var rect=scrolly.getBoundingClientRect(),vh=window.innerHeight;
  return clamp(-rect.top/Math.max(rect.height-vh,1),0,1);
}

/* ---- Sanfter Zug: die Scrollposition wird pro Frame geglättet -----------------
   Scroll-Events kommen stufig (Mausrad-Rasten, Touch-Ticks) — würde die Karte
   ihnen direkt folgen, springt der Zug. Stattdessen folgt eine geglättete
   Position dem Scroll-Ziel exponentiell: butterweich & framerate-unabhängig.   */
var smoothP=0,smoothInit=false,animRaf=null,animLastTs=null;
function animate(ts){
  animRaf=null;
  if(animLastTs===null)animLastTs=ts;
  var dt=Math.min((ts-animLastTs)/1000,0.1);animLastTs=ts;
  var target=progress();
  if(!smoothInit||SB.reduced){smoothP=target;smoothInit=true;}
  else{
    smoothP+=(target-smoothP)*(1-Math.exp(-dt*8));
    if(Math.abs(target-smoothP)<0.00004)smoothP=target;   // eingerastet
  }
  render(smoothP);
  if(smoothP!==target)animRaf=requestAnimationFrame(animate);   // weiter glätten
  else animLastTs=null;                                          // Ruhe: Loop aus
}

/* ---- Render: Karte + Karten-Overlay aus der (geglätteten) Position ------------ */
var lastSi=-1;
function render(p){
  progfill.style.width=(p*100)+'%';
  var fs=p*N,si=clamp(Math.floor(fs),0,N-1),local=fs-si,s=SC[si];
  if(si!==lastSi){lastSi=si;SB.startType(si);}
  if(SB.music)SB.music.onScene(si);   // Musik-Meilenstein (falls der Trip einen hat)
  for(var i=0;i<N;i++){
    var el=document.getElementById('card'+i);
    if(i!==si){el.style.opacity=0;el.style.transform='translateY(34px)';continue;}
    var o=local<.05?local/.05:(local>.93?(1-local)/.07:1);
    el.style.opacity=o;el.style.transform='translateY('+((1-o)*34)+'px)';
  }
  var sum=0;for(var j=0;j<si;j++)sum+=SC[j].cost;if(local>.5)sum+=s.cost;
  tv.textContent=SB.fmtEUR(sum);
  if(!SB.mapCtl.ready)return;
  var map=SB.mapCtl.map;
  var tt=ease(clamp(local/.7,0,1));
  var f=lerp(s.f0,s.f1,tt),pos=route.pointAt(f);
  map.getSource('train').setData({type:'Feature',geometry:{type:'Point',coordinates:pos}});
  var t=f*route.LEN,coords=[route.R[0]];
  for(var k=1;k<route.cum.length;k++){if(route.cum[k]<=t)coords.push(route.R[k]);else break;}
  coords.push(pos);
  map.getSource('done').setData({type:'Feature',geometry:{type:'LineString',coordinates:coords}});
  var cl=ease(local);
  // Flachere Kamera auf schwachen Geräten = weniger sichtbare Tiles.
  var pitchK=SB.lowPower?0.5:1;
  map.jumpTo({center:pos,zoom:lerp(s.z0,s.z1,cl),
    pitch:SB.reduced?0:lerp(s.p0,s.p1,cl)*pitchK,
    bearing:SB.reduced?0:lerp(s.b0,s.b1,cl)});
}
function onScroll(){if(!animRaf)animRaf=requestAnimationFrame(animate);}
SB.requestRender=onScroll;   // map.js ruft das nach dem Boot
window.addEventListener('scroll',onScroll,{passive:true});
window.addEventListener('resize',function(){computeSpeed();onScroll();});

/* ---- Autopilot -----------------------------------------------------------------
   Ziele:
   * nach dem ALLERERSTEN Scroll übernehmen (auch im Hero) und von allein
     weiterfahren
   * nie gegen Finger/Trägheits-Scrollen kämpfen: jede Seitenbewegung, die
     nicht vom Autopiloten stammt, gilt als Eingabe → kurz zurückhalten,
     danach automatisch weiterfahren
   * nie ruckeln: Frame-Delta ist gedeckelt, ein Aussetzer wird kein Sprung   */
var auto={engaged:false,paused:false,pps:0,lastInput:0,raf:null};
var ctl=document.getElementById('autoctl'),abtn=document.getElementById('autobtn');
var RESUME_DELAY=900;   // ms Ruhe, bevor der Autopilot wieder übernimmt
var MAX_DT=0.05;        // s – größere Frame-Lücken kappen (Anti-Ruck)
var externalHold=false; // von außen angehalten (z. B. Frankreich-Dialog offen)
function nowMs(){return (typeof performance!=='undefined'&&performance.now)?performance.now():Date.now();}
function computeSpeed(){
  var total=scrolly.getBoundingClientRect().height-window.innerHeight;
  auto.pps=total/(N*cfg.autoSecPerScene);
}
var lastT=null,lastY=null;
function aloop(ts){
  if(!auto.engaged){auto.raf=null;return;}
  if(lastT===null){lastT=ts;lastY=window.scrollY;}
  var dt=(ts-lastT)/1000;lastT=ts;
  if(dt>MAX_DT)dt=MAX_DT;
  // Bewegung, die wir nicht selbst ausgelöst haben = Finger oder Trägheit.
  // Touch-Events enden beim Loslassen, iOS gleitet aber weiter — dieser
  // Frame-Vergleich zählt die Schonfrist ab dem echten Stillstand.
  if(lastY!==null&&Math.abs(window.scrollY-lastY)>2)noteInput();
  if(!auto.paused&&!externalHold&&(nowMs()-auto.lastInput)>RESUME_DELAY){
    window.scrollBy(0,auto.pps*dt);
    if(progress()>=0.999){setPaused(true);auto.raf=null;return;}  // Endstation
  }
  lastY=window.scrollY;   // NACH dem eigenen scrollBy → eigene Bewegung zählt nicht
  auto.raf=requestAnimationFrame(aloop);
}
function setPaused(p){
  auto.paused=p;
  abtn.textContent=p?'▶ Weiterfahrt':'⏸ Anhalten';
}
function noteInput(){auto.lastInput=nowMs();}
function engage(){
  if(auto.engaged||SB.reduced)return;
  auto.engaged=true;computeSpeed();ctl.style.display='flex';
  lastT=null;auto.raf=requestAnimationFrame(aloop);
}
/* Nach dem ersten echten Scroll übernehmen — schon im Hero, nicht erst in der
   Karte. Nur nicht mehr einsteigen, wenn die Story schon durch ist. */
window.addEventListener('scroll',function(){
  if(auto.engaged)return;
  if(window.scrollY>10&&progress()<0.95)engage();
},{passive:true});
/* Eingaben pausieren den Autopiloten nur kurz; danach fährt er weiter. */
['wheel','touchstart','touchmove'].forEach(function(ev){
  window.addEventListener(ev,noteInput,{passive:true});
});
window.addEventListener('keydown',function(e){
  if(['ArrowDown','ArrowUp','PageDown','PageUp',' ','Home','End'].indexOf(e.key)>-1)noteInput();
});
abtn.addEventListener('click',function(){
  setPaused(!auto.paused);
  if(!auto.paused){
    auto.lastInput=0;                       // bewusster Klick → sofort losfahren
    lastT=null;
    if(!auto.raf)auto.raf=requestAnimationFrame(aloop);
  }
});

/* Von außen anhalten/freigeben (Frankreich-Dialog): hält den Autopiloten
   an, ohne den „⏸ Anhalten"-Zustand des Nutzers zu verändern. */
SB.autopilot={
  hold:function(on){
    externalHold=on;
    if(!on&&auto.engaged&&!auto.paused){
      auto.lastInput=0;lastT=null;
      if(!auto.raf)auto.raf=requestAnimationFrame(aloop);
    }
  }
};
})();
