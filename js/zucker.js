/* ==========================================================================
   Schlemmer Bahn – Die Zuckerdose (Frühstücks-Einlage vor dem RSVP)
   Vorbild: die marschierende Zuckerdose aus dem Zeichentrick — sie hüpft von
   links nach rechts zur Tasse, klappt den Deckel auf, kippt, schüttet Zucker
   nach, marschiert zurück und holt nach. Die Tasse wird Runde für Runde voller.

   Bauprinzip: KEINE CSS-Keyframes, sondern eine Zeitleiste. zustand(t)
   beschreibt die komplette Szene für jeden Zeitpunkt t, zeichne() schreibt sie
   in transform-Attribute. Dadurch sind Standbild (Reduced Motion), Neustart
   per Klick und Pausieren außerhalb des Bildschirms derselbe Codepfad.
   Braucht: js/data.js (SB.reduced, SB.isMobile), js/ui.js (SB.showToast)
   ========================================================================== */
(function(){
'use strict';
var SB=window.SB=window.SB||{};
var svg=document.getElementById('zuckersvg');
if(!svg)return;

var buehne=document.getElementById('zuckerbuehne');
var szene=document.getElementById('zk-szene');
var dose=document.getElementById('zk-dose'),schatten=document.getElementById('zk-schatten'),
    loeffel=document.getElementById('zk-loeffel'),deckel=document.getElementById('zk-deckel'),
    pegel=document.getElementById('zk-pegel'),berg=document.getElementById('zk-berg'),
    haufen=document.getElementById('zk-haufen'),strahl=document.getElementById('zk-strahl'),
    koernerBox=document.getElementById('zk-koerner'),funken=document.getElementById('zk-funken'),
    streu=document.getElementById('zk-streu'),
    cap=document.getElementById('zk-cap');

/* ---- Bühnenmaße (alles in viewBox-Einheiten) -------------------------------- */
var BASE=196,          // Tischkante: darauf steht alles
    X0=62,             // Startplatz links
    X1=350,            // Gießplatz links neben der Tasse
    TASSE=470,RAND=144,// Tassenmitte & Tassenrand
    PEGEL_LEER=202,PEGEL_VOLL=144,
    KIPP=46,           // Kippwinkel beim Gießen (Drehpunkt: rechte Fußkante)
    STEMM=8,           // so weit stemmt sie sich beim Gießen hoch
    LIPPE_X=19,LIPPE_Y=-80,   // Ausgusslippe (Halsrand) in Dosen-Koordinaten
    HUB=15,            // Hüpfhöhe
    HUEPFER=5,         // Hüpfer pro Weg
    TAKT=1/12;         // „auf Zweien": 12 Zeichnungen je Sekunde, wie im Trickfilm

/* Wie voll die Tasse nach Runde 1…4 ist – „mehr und mehr". */
var STUFEN=[0,.30,.55,.79,1];
var TEXTE=["Erster Löffel. Zum Aufwärmen.",
           "Zweiter Gang. Sie meint es ernst.",
           "Langsam wird's süß.",
           "Noch einer — es sind ja Ferien.",
           "Voll. Fehlt nur noch dein Ja."];

/* ---- Zeitplan einer Runde (Sekunden) ---------------------------------------- */
var PHASEN=[['hin',1.25],['ansatz',.22],['kipp',.3],['giess',.8],['auf',.3],
            ['dreh',.18],['rueck',1.15],['dreh2',.18],['ruhe',.2]];
var RUNDE=0;for(var pi=0;pi<PHASEN.length;pi++)RUNDE+=PHASEN[pi][1];
var RUNDEN=STUFEN.length-1,FINALE=4.2,LEEREN=1;
var ZYKLUS=RUNDEN*RUNDE+FINALE+LEEREN;

function clamp(v,a,b){return v<a?a:(v>b?b:v);}
function lerp(a,b,t){return a+(b-a)*t;}
function weich(t){return t*t*(3-2*t);}                     // smoothstep
function zurueck(t){var k=t-1;return 1+2.7*k*k*k+1.7*k*k;} // easeOutBack
function phase(lt){
  var acc=0;
  for(var i=0;i<PHASEN.length;i++){
    if(lt<acc+PHASEN[i][1])return {n:PHASEN[i][0],p:(lt-acc)/PHASEN[i][1]};
    acc+=PHASEN[i][1];
  }
  return {n:'ruhe',p:1};
}
/* Hüpfen: Sinusbogen + Squash bei der Landung, Stretch im Scheitel. */
function huepfen(s,p,n,dir){
  var w=p*n*Math.PI,h=Math.abs(Math.sin(w));
  var land=Math.pow(1-h,6);
  s.y=-HUB*h;
  s.rot=Math.cos(w)*7*dir;          // beim Abstoßen nach vorn, bei der Landung zurück
  s.sqx=1+.13*land;
  s.sqy=1-.13*land+.06*h*h*h;
}

/* ---- Zeitleiste: die ganze Szene als Funktion von t ------------------------- */
function zustand(t){
  var s={x:X0,y:0,rot:0,tilt:0,dir:1,sqx:1,sqy:1,loef:0,deck:0,
         pegel:0,berg:0,haufen:0,strahl:0,giessP:0,funke:0,text:0,zitterX:0,zitterY:0};
  var bild=Math.round(t/TAKT);                  // laufende Nummer der Zeichnung
  s.zitterX=(bild*7%3-1)*.45;s.zitterY=(bild*11%3-1)*.4;
  if(t<RUNDEN*RUNDE){
    var r=Math.floor(t/RUNDE),lt=t-r*RUNDE,ph=phase(lt),p=ph.p,e;
    s.text=r;s.pegel=STUFEN[r];
    switch(ph.n){
      case 'hin':
        s.x=lerp(X0,X1,weich(p));huepfen(s,p,HUEPFER,1);
        s.loef=Math.sin(p*HUEPFER*2*Math.PI)*11;break;
      case 'ansatz':                                  // kurz sammeln, Deckel wackelt
        s.x=X1;s.rot=-6*Math.sin(p*Math.PI);s.loef=-9*p;s.deck=-8*p;break;
      case 'kipp':
        e=weich(p);s.x=X1;s.tilt=KIPP*e;s.y=-STEMM*e;s.deck=-8-37*e;s.loef=-9-36*e;break;
      case 'giess':
        s.x=X1;s.y=-STEMM;s.deck=-45;s.tilt=KIPP+Math.sin(p*Math.PI*4)*1.8;
        s.loef=-45+Math.sin(p*Math.PI*6)*5;
        s.giessP=p;s.strahl=clamp(p*7,0,1)*clamp((1-p)*7,0,1);
        s.pegel=lerp(STUFEN[r],STUFEN[r+1],weich(p));break;
      case 'auf':
        e=weich(p);s.x=X1;s.tilt=KIPP*(1-e);s.y=-STEMM*(1-e);s.deck=-45*(1-e);s.loef=-45*(1-e);
        s.pegel=STUFEN[r+1];break;
      case 'dreh':                                    // Kehrtwende: einmal auf der Stelle
        s.x=X1;s.dir=Math.cos(p*Math.PI);s.y=-12*Math.sin(p*Math.PI);s.pegel=STUFEN[r+1];break;
      case 'rueck':
        s.x=lerp(X1,X0,weich(p));s.dir=-1;huepfen(s,p,HUEPFER,-1);
        s.loef=Math.sin(p*HUEPFER*2*Math.PI)*11;s.pegel=STUFEN[r+1];break;
      case 'dreh2':
        s.x=X0;s.dir=-Math.cos(p*Math.PI);s.y=-12*Math.sin(p*Math.PI);s.pegel=STUFEN[r+1];break;
      default:
        s.x=X0;s.pegel=STUFEN[r+1];
    }
    /* Was daneben geht, sammelt sich neben der Tasse (kleines Häufchen). */
    s.haufen=clamp((s.pegel-.18)/.82,0,1)*.62;
  }else if(t<RUNDEN*RUNDE+FINALE){
    var ft=t-(RUNDEN*RUNDE);
    s.text=RUNDEN;s.pegel=1;s.x=X0;
    s.berg=zurueck(clamp(ft/.55,0,1));
    s.haufen=.62+.38*clamp(ft/.7,0,1);
    if(ft>.25&&ft<1.45)huepfen(s,(ft-.25)/1.2,2,1);     // Freudensprünge
    s.funke=clamp(ft/.5,0,1)*clamp((FINALE-ft)/.8,0,1);
    s.loef=Math.sin(ft*7)*7;
  }else{                                                // Tasse wird geleert, dann von vorn
    var et=(t-(RUNDEN*RUNDE+FINALE))/LEEREN;
    s.text=RUNDEN;s.x=X0;
    s.pegel=1-weich(clamp(et*1.3,0,1));
    s.berg=1-weich(clamp(et*2.6,0,1));
    s.haufen=1-weich(clamp(et*2,0,1));
  }
  return s;
}

/* ---- Zeichnen --------------------------------------------------------------- */
var KOERNER=[],ANZ=(SB.isMobile?10:20);
for(var ki=0;ki<ANZ;ki++){
  var c=document.createElementNS('http://www.w3.org/2000/svg','circle');
  c.setAttribute('class','zk-korn-zucker');c.setAttribute('r',[2,2.6,3.4,2.2,3][ki%5]);
  koernerBox.appendChild(c);KOERNER.push(c);
}
function f(v){return Math.round(v*100)/100;}
function drehPunkt(px,py,grad,cx,cy){
  var a=grad*Math.PI/180,co=Math.cos(a),si=Math.sin(a);
  return {x:cx+(px-cx)*co-(py-cy)*si,y:cy+(px-cx)*si+(py-cy)*co};
}
var letzterText=-1;
function zeichne(s){
  /* Linienzittern: echte Zeichentrick-Cels „kochen" leicht, weil jedes Bild
     neu gezeichnet wurde. Ein halber Pixel pro Zeichnung reicht dafür. */
  if(szene)szene.setAttribute('transform','translate('+f(s.zitterX)+','+f(s.zitterY)+')');
  dose.setAttribute('transform','translate('+f(s.x)+','+f(BASE+s.y)+') rotate('+f(s.rot)+
    ') rotate('+f(s.tilt)+',15,0) scale('+f(s.dir*s.sqx)+','+f(s.sqy)+')');
  var hoch=clamp(-s.y/HUB,0,1);
  schatten.setAttribute('transform','translate('+f(s.x+s.tilt*.35)+','+BASE+') scale('+f(1-.28*hoch)+',1)');
  schatten.setAttribute('opacity',f(.95-.45*hoch));
  loeffel.setAttribute('transform','rotate('+f(s.loef)+',10,-82)');
  deckel.setAttribute('transform','rotate('+f(s.deck)+',-19,-80)');
  pegel.setAttribute('transform','translate(0,'+f(lerp(PEGEL_LEER,PEGEL_VOLL,s.pegel))+')');
  berg.setAttribute('transform','translate('+TASSE+','+RAND+') scale('+f(.55+.45*s.berg)+','+f(Math.max(s.berg,0))+')');
  haufen.setAttribute('transform','translate(404,'+BASE+') scale('+f(Math.max(s.haufen,0))+')');
  funken.setAttribute('opacity',f(s.funke));
  streu.setAttribute('opacity',f(clamp(s.pegel*1.3,0,1)*.9));

  /* Der Strahl hängt an der Ausgusslippe der gekippten Dose und fällt im Bogen
     in die Tasse; die Körner spritzen am Aufschlagpunkt weg. */
  if(s.strahl>.01){
    var lp=drehPunkt(LIPPE_X,LIPPE_Y,s.tilt,15,0),lx=s.x+lp.x,ly=BASE+s.y+lp.y;
    var zx=TASSE-10,zy=RAND+3,mx=lx+(zx-lx)*.55;
    strahl.setAttribute('opacity',f(s.strahl));
    strahl.setAttribute('d','M'+f(lx-4)+','+f(ly-7)+
      ' C'+f(mx)+','+f(ly+2)+' '+f(zx-20)+','+f(zy-20)+' '+f(zx-13)+','+f(zy)+
      ' L'+f(zx+14)+','+f(zy)+
      ' C'+f(zx+6)+','+f(zy-26)+' '+f(mx+7)+','+f(ly+13)+' '+f(lx+7)+','+f(ly+1)+' Z');
    /* Spritzer: Fächer vom Aufschlagpunkt weg, mit Schwerkraft. */
    for(var i=0;i<KOERNER.length;i++){
      var u=(s.giessP*2.4+i/KOERNER.length)%1;
      var w=-2.75+(i/KOERNER.length)*3.1,weit=(12+(i%5)*7)*u*1.9;
      var gx=zx-6+Math.cos(w)*weit,gy=zy-9+Math.sin(w)*weit+30*u*u;
      KOERNER[i].setAttribute('transform','translate('+f(gx)+','+f(gy)+')');
      KOERNER[i].setAttribute('opacity',f(s.strahl*(1-u*.85)));
    }
  }else{
    strahl.setAttribute('opacity',0);
    for(var j=0;j<KOERNER.length;j++)KOERNER[j].setAttribute('opacity',0);
  }
  if(s.text!==letzterText){letzterText=s.text;cap.textContent=TEXTE[s.text];}
}

/* ---- Antrieb: läuft nur, solange die Bühne sichtbar ist ---------------------- */
var raf=null,start=0,steht=0,laeuft=false;
var letztesBild=-1;
function tick(ts){
  raf=null;
  var t=((ts-start)/1000)%ZYKLUS;
  var bild=Math.floor(t/TAKT);                 // nur alle 1/12 s ein neues Bild
  if(bild!==letztesBild){letztesBild=bild;zeichne(zustand(bild*TAKT));}
  if(laeuft)raf=requestAnimationFrame(tick);
}
function los(){
  if(laeuft||SB.reduced)return;
  laeuft=true;
  raf=requestAnimationFrame(function(ts){start=ts-steht*1000;tick(ts);});
}
function halt(){
  if(!laeuft)return;
  laeuft=false;
  if(raf)cancelAnimationFrame(raf);raf=null;
  steht=((performance.now()-start)/1000)%ZYKLUS;   // Position merken
}
function vonVorn(){steht=0;if(laeuft){halt();los();}else{los();}}

if(SB.reduced){
  zeichne(zustand(RUNDEN*RUNDE+1.2));              // Standbild: volle Tasse
}else{
  zeichne(zustand(0));
  if(window.IntersectionObserver){
    new IntersectionObserver(function(es){
      es.forEach(function(e){e.isIntersecting?los():halt();});
    },{threshold:.15}).observe(buehne);
  }else los();
  document.addEventListener('visibilitychange',function(){document.hidden?halt():los();});
  buehne.addEventListener('click',function(){
    vonVorn();
    SB.showToast&&SB.showToast('Noch ein Löffel? Immer.');
  });
}

SB.zucker={zustand:zustand,zeichne:zeichne,los:los,halt:halt,ZYKLUS:ZYKLUS,RUNDE:RUNDE};
})();
