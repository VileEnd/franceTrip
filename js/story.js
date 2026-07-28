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

/* ---- Ein einziger Frame-Loop -------------------------------------------------
   Vorher liefen zwei getrennte requestAnimationFrame-Schleifen: eine hat
   den Autopiloten gescrollt, die andere hat auf das Scroll-Ereignis hin
   gerendert. Wann dieses Ereignis zugestellt wird, entscheidet der Browser
   — mal im selben Bild, mal im nächsten. Genau daraus entstand das
   Stottern: die Karte bekam ihre Positionen in unregelmäßigen Abständen.

   Jetzt macht ein Loop beides in derselben Zuteilung: erst der Autopilot
   scrollen, dann glätten, dann zeichnen. Dadurch ist der Abstand zwischen
   zwei Kamerapositionen genau ein Bild — und der Zug läuft gleichmäßig.
   Die Scrollposition wird zusätzlich exponentiell geglättet, damit auch
   gerasterte Mausrad- und Touch-Ticks weich ankommen.                       */
var smoothP=0,smoothInit=false,raf=null,lastTs=null;
function tick(ts){
  raf=null;
  if(lastTs===null)lastTs=ts;
  var dt=Math.min((ts-lastTs)/1000,MAX_DT);lastTs=ts;
  var moved=autoStep(dt);            // Autopilot zuerst: eigener scrollBy
  var target=progress();
  if(!smoothInit||SB.reduced){smoothP=target;smoothInit=true;}
  else{
    smoothP+=(target-smoothP)*(1-Math.exp(-dt*9));
    if(Math.abs(target-smoothP)<0.00002)smoothP=target;   // eingerastet
  }
  render(smoothP);
  if(moved||smoothP!==target)raf=requestAnimationFrame(tick);
  else lastTs=null;                                        // Ruhe: Loop aus
}
function wake(){if(!raf){lastTs=null;raf=requestAnimationFrame(tick);}}

/* ---- Render: Karte + Karten-Overlay aus der (geglätteten) Position ------------
   Pro Bild passiert hier so wenig wie möglich. Zwei Dinge waren teuer und
   sind jetzt gedrosselt:
   * Die zurückgelegte Strecke ist eine GeoJSON-Quelle. Jedes setData lässt
     MapLibre die Linie neu zerlegen und hochladen — das muss nicht 60-mal
     pro Sekunde sein, ein paar Mal pro Sekunde reicht fürs Auge.
   * Die Story-Karten wurden pro Bild alle zehn angefasst. Jetzt wird nur
     noch die sichtbare Karte geschrieben (und die vorherige einmal
     zurückgesetzt).                                                          */
var lastSi=-1,lastDoneMs=0,lastDoneLen=-1,lastO=-1;
function render(p){
  progfill.style.width=(p*100)+'%';
  var fs=p*N,si=clamp(Math.floor(fs),0,N-1),local=fs-si,s=SC[si];
  if(si!==lastSi){
    if(lastSi>=0){
      var prev=document.getElementById('card'+lastSi);
      prev.style.opacity=0;prev.style.transform='translateY(34px)';
    }
    lastSi=si;lastO=-1;SB.startType(si);
  }
  if(SB.music)SB.music.onScene(si);   // Musik-Meilenstein (falls der Trip einen hat)
  var o=local<.05?local/.05:(local>.93?(1-local)/.07:1);
  if(Math.abs(o-lastO)>0.004){
    lastO=o;
    var el=document.getElementById('card'+si);
    el.style.opacity=o;el.style.transform='translateY('+((1-o)*34)+'px)';
  }
  var sum=0;for(var j=0;j<si;j++)sum+=SC[j].cost;if(local>.5)sum+=s.cost;
  tv.textContent=SB.fmtEUR(sum);
  if(!SB.mapCtl.ready)return;
  var map=SB.mapCtl.map;
  var tt=ease(clamp(local/.7,0,1));
  var f=lerp(s.f0,s.f1,tt),pos=route.pointAt(f);
  // Blickpunkt kurz voraus → daraus leitet die Karte die Fahrtrichtung
  // (und damit die Ausrichtung des 3D-Modells) ab.
  SB.mapCtl.setVehicle(pos,route.pointAt(Math.min(f+0.0015,1)));

  var t=f*route.LEN,coords=[route.R[0]];
  for(var k=1;k<route.cum.length;k++){if(route.cum[k]<=t)coords.push(route.R[k]);else break;}
  var now=(typeof performance!=='undefined'&&performance.now)?performance.now():Date.now();
  if(coords.length!==lastDoneLen||now-lastDoneMs>120){
    lastDoneLen=coords.length;lastDoneMs=now;
    coords.push(pos);
    map.getSource('done').setData({type:'Feature',geometry:{type:'LineString',coordinates:coords}});
  }

  var cl=ease(local);
  // Flachere Kamera auf schwachen Geräten = weniger sichtbare Tiles.
  var pitchK=(SB.trip.map&&SB.trip.map.pitchScale)||(SB.lowPower?0.5:1);
  // Zoom kommt aus der Karten-Strategie (Standard: konstant, siehe map.js).
  map.jumpTo({center:pos,zoom:SB.mapCtl.zoomAt(s,cl),
    pitch:SB.reduced?0:lerp(s.p0,s.p1,cl)*pitchK,
    bearing:SB.reduced?0:lerp(s.b0,s.b1,cl)});
}
SB.requestRender=wake;   // map.js ruft das nach dem Boot
window.addEventListener('scroll',wake,{passive:true});
window.addEventListener('resize',function(){computeSpeed();wake();});

/* ---- Autopilot -----------------------------------------------------------------
   Ziele:
   * nach dem ALLERERSTEN Scroll übernehmen (auch im Hero) und von allein
     weiterfahren
   * nie gegen Finger/Trägheits-Scrollen kämpfen: jede Seitenbewegung, die
     nicht vom Autopiloten stammt, gilt als Eingabe → kurz zurückhalten,
     danach automatisch weiterfahren
   * nie ruckeln: Frame-Delta ist gedeckelt, ein Aussetzer wird kein Sprung   */
var auto={engaged:false,paused:false,pps:0,lastInput:0};
var ctl=document.getElementById('autoctl'),abtn=document.getElementById('autobtn');
var RESUME_DELAY=900;   // ms Ruhe, bevor der Autopilot wieder übernimmt
var MAX_DT=0.05;        // s – größere Frame-Lücken kappen (Anti-Ruck)
var externalHold=false; // von außen angehalten (z. B. Frankreich-Dialog offen)
var lastY=null;
function nowMs(){return (typeof performance!=='undefined'&&performance.now)?performance.now():Date.now();}
function computeSpeed(){
  var total=scrolly.getBoundingClientRect().height-window.innerHeight;
  auto.pps=total/(N*cfg.autoSecPerScene);
}
/* Ein Autopilot-Schritt, aufgerufen aus tick(). Rückgabe: läuft er noch?
   Bewegung, die wir nicht selbst ausgelöst haben, gilt als Eingabe —
   Touch-Events enden beim Loslassen, iOS gleitet aber weiter, deshalb
   zählt hier der Vergleich der Scrollposition von Bild zu Bild.            */
function autoStep(dt){
  if(!auto.engaged)return false;
  if(lastY!==null&&Math.abs(window.scrollY-lastY)>2)noteInput();
  if(!auto.paused&&!externalHold&&(nowMs()-auto.lastInput)>RESUME_DELAY){
    window.scrollBy(0,auto.pps*dt);
    if(progress()>=0.999){setPaused(true);lastY=window.scrollY;return false;}
  }
  lastY=window.scrollY;   // NACH dem eigenen scrollBy → zählt nicht als Eingabe
  return true;
}
function setPaused(p){
  auto.paused=p;
  abtn.textContent=p?'▶ Weiterfahrt':'⏸ Anhalten';
}
function noteInput(){auto.lastInput=nowMs();}
function engage(){
  if(auto.engaged||SB.reduced)return;
  auto.engaged=true;computeSpeed();ctl.style.display='flex';
  lastY=window.scrollY;wake();
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
  if(!auto.paused){auto.lastInput=0;wake();}   // bewusster Klick → sofort los
});

/* Von außen anhalten/freigeben (Frankreich-Dialog): hält den Autopiloten
   an, ohne den „⏸ Anhalten"-Zustand des Nutzers zu verändern. */
SB.autopilot={
  hold:function(on){
    externalHold=on;
    if(!on&&auto.engaged&&!auto.paused){auto.lastInput=0;wake();}
  }
};
})();
