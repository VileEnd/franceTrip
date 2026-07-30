/* ==========================================================================
   Engine – Karte (MapLibre): Boot, Layer, Fahrzeug
   Liest trip.map (alle Felder optional):
     zoomMode  'fixed' (Standard) · 'steps' · 'scenes'   → siehe unten
     zoom      Reise-Zoom für 'fixed'                     (Standard 9.6)
     vehicle   {model:'ice'|'train'|'bus'|'car'|'croissant', color, accent,
                glass, light,
                size    Pixel je Modelllänge = Länge EINES Wagens,
                cars    Anzahl Wagen (Standard 4, auf Phones 3),
                pitch   Wagenabstand in Modelllängen (Standard 1.03),
                track   false = ohne Gleis,
                wordmark/logo  Beschriftung (Standard 'ICE' / 'DB',
                        false lässt sie weg),
                tapModel:'croissant' (Antippen tauscht das Modell;
                        null schaltet das ab)}
     modes     Profile je Reiseart, überschreibt die Vorgaben:
               {foot:{size:34,cycle:1.9}, bus:{size:44,model:'bus'}, …}
               Welcher Abschnitt zu Fuß, mit Bus oder mit der Bahn
               zurückgelegt wird, steht in trip.route.legs (js/core.js);
               die Karte wechselt Modell, Größe und Linienstil dann von
               selbst — Zug auf Gleis, zwei Gehende auf einer Punktspur.
     vehicle3d false = flaches Emoji statt 3D-Modell
     trainEmoji, routeColor, doneColor, stopColor, footColor, busColor,
     bg, terrain:false, pitchScale
   Stellt bereit: SB.mapCtl = { map, ready, zoomAt(), setVehicle() }

   ---- Warum ein fester Zoom? ---------------------------------------------
   Rasterkarten laden pro Zoomstufe einen komplett neuen Kachelsatz. Fährt
   die Kamera durchgehend rein und raus, lädt, dekodiert und verwirft der
   Browser die ganze Fahrt über Kacheln — genau das ruckelt (und mit 3D-
   Gelände kommt bei jeder Stufe noch ein neues Höhengitter dazu).
   Deshalb bleibt der Zoom standardmäßig konstant: Kacheln werden einmal
   geladen, liegen danach im Cache, und die Kamera macht nur noch das
   Billige — schwenken, neigen, drehen.
     'fixed'  eine Zoomstufe für die ganze Reise (ruhigstes Bild)
     'steps'  pro Szene eine feste Stufe (Wechsel nur an Szenengrenzen)
     'scenes' die alten, durchgehend animierten Zoomfahrten (am teuersten)
   ========================================================================== */
(function(){
'use strict';
var SB=window.SB;
var route=SB.route,R=route.R;
var M=SB.trip.map||{};
var COLORS={
  route:M.routeColor||'#EC0016',
  done:M.doneColor||'#FFD800',
  stop:M.stopColor||'#EC0016',
  bg:M.bg||'#EFEDE8'
};
var loading=document.getElementById('loading');
SB.mapCtl={map:null,ready:false};

/* ---- Kacheln: Adressen, Auflösung ---------------------------------------
   Die Adressen baut die Engine an zwei Stellen: hier für den Vorrat (siehe
   unten) und unten im Style für MapLibre. Beide MÜSSEN Zeichen für Zeichen
   dieselben sein — sonst holt der Browser jede Kachel zweimal.
   @2x-Kacheln haben die vierfache Pixelmenge. Auf einem 1×-Bildschirm ist das
   reine Verschwendung: das Bild wird sofort wieder heruntergerechnet. */
var TILE_HOSTS=['a','b','c'];
var TILE_SUF=(!SB.isMobile&&(window.devicePixelRatio||1)>1.2)?'@2x':'';
var TILE_URL=TILE_HOSTS.map(function(h){
  return 'https://'+h+'.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}'+TILE_SUF+'.png';
});
function tileUrl(z,x,y){
  var n=1<<z;
  if(y<0||y>=n)return null;              // über Pol / unter Pol gibt es nichts
  x=((x%n)+n)%n;                         // Weltumlauf, wie MapLibre ihn rechnet
  // Host-Verteilung exakt wie in MapLibre: urls[(x+y) % urls.length]
  return TILE_URL[(x+y)%TILE_URL.length]
    .replace('{z}',z).replace('{x}',x).replace('{y}',y);
}
/* Lng/Lat → Kachelnummer (Web-Mercator, Standardformel). */
function lngLatTile(z,lng,lat){
  var n=1<<z,s=Math.sin(lat*Math.PI/180);
  s=Math.max(Math.min(s,0.9999),-0.9999);
  return [Math.floor((lng+180)/360*n),
          Math.floor((0.5-Math.log((1+s)/(1-s))/(4*Math.PI))*n)];
}
/* Welche Kachel-Stufe zeigt MapLibre bei diesem Zoom? Für 256er-Kacheln ist
   es eine Stufe feiner als der Kartenzoom, kaufmännisch gerundet — genau die
   Rechnung aus MapLibres coveringZoomLevel(). */
function tileZoom(zoom){
  return Math.max(0,Math.min(18,Math.round(zoom+1)));
}

/* ---- Kacheln auf Vorrat holen -------------------------------------------
   Die Karte wartet beim Start auf zwei Dinge: die Bibliothek (groß) und die
   ersten Kacheln (viele). Das läuft normalerweise NACHEINANDER — erst wenn
   maplibre-gl.js da ist, weiß der Browser überhaupt, welche Bilder er braucht.
   Die Adressen kennen wir aber schon vorher: Startpunkt und Zoom stehen im
   Trip. Also holen wir sie parallel zur Bibliothek in den HTTP-Cache; wenn
   MapLibre sie dann anfordert, liegen sie bereits da.

   Dasselbe während der Fahrt: die Kamera folgt einer bekannten Linie, also
   holen wir immer ein Stück Strecke im Voraus. Es sind exakt dieselben
   Kacheln, die die Karte Sekunden später ohnehin lädt — nur eben früh genug,
   dass unterwegs nichts mehr grau bleibt. Mehr Daten werden dadurch NICHT
   geladen, sie kommen nur früher.

   Bei „Datensparen“ und auf 2G bleibt der Vorrat aus.                      */
var PRE={queue:[],seen:{},busy:0,max:SB.isMobile?3:5,last:0,lastF:-1,aus:false};
(function(){
  var c=navigator.connection||navigator.mozConnection||navigator.webkitConnection;
  if(!window.fetch||(c&&(c.saveData||/(^|-)2g$/.test(c.effectiveType||''))))PRE.aus=true;
})();
function preQueue(z,x,y){
  if(PRE.queue.length>=40)return;        // Warteschlange kurz halten …
  var k=z+'/'+x+'/'+y;
  if(PRE.seen[k])return;                 // … und nichts doppelt holen
  var u=tileUrl(z,x,y);
  if(!u)return;
  PRE.seen[k]=1;PRE.queue.push(u);
}
function prePump(){
  while(PRE.busy<PRE.max&&PRE.queue.length){
    PRE.busy++;
    var fertig=function(){PRE.busy--;prePump();};
    /* Ohne Optionen: genau der Request, den MapLibre später stellt
       (GET, mode 'cors', credentials 'same-origin') — nur so ist es
       derselbe Cache-Eintrag. Der Body wird gelesen und weggeworfen. */
    fetch(PRE.queue.shift()).then(function(r){return r.blob();}).then(fertig,fertig);
  }
}
/* Rechteck um eine Mittelkachel, von innen nach außen — das Bild füllt sich
   dann von der Mitte her, nicht in Zeilen. */
function preBlock(z,cx,cy,rx,ry){
  var rmax=Math.max(rx,ry);
  for(var r=0;r<=rmax;r++)
    for(var dx=-rx;dx<=rx;dx++)
      for(var dy=-ry;dy<=ry;dy++)
        if(Math.max(Math.abs(dx),Math.abs(dy))===r)preQueue(z,cx+dx,cy+dy);
}

/* ---- Zoom-Strategie ----------------------------------------------------- */
var zoomMode=M.zoomMode||'fixed';
var cruiseZoom=(typeof M.zoom==='number')?M.zoom:9.6;
function stepZoom(s){
  // Halbe Stufen: der Wechsel passiert an Szenengrenzen, nicht laufend.
  if(s.zStep===undefined)s.zStep=Math.round(((s.z0+s.z1)/2)*2)/2;
  return s.zStep;
}
/* zRamp:true an einer Szene fährt den Zoom auch im 'steps'-Betrieb durch —
   gedacht für den einen Moment, in dem die Karte aus der Reiseflughöhe in
   die Stadt hineinfährt. Als Dauerzustand wäre das zu teuer, als einzelne
   Szene ist es genau das, was man sehen will. */
SB.mapCtl.zoomAt=function(s,t){
  if(zoomMode==='scenes'||s.zRamp)return s.z0+(s.z1-s.z0)*t;
  if(zoomMode==='steps')return stepZoom(s);
  return cruiseZoom;
};
var startZoom=SB.mapCtl.zoomAt(SB.scenes[0],0);

/* Der erste Blick: genau die Kacheln, die das erste Bild bedeckt — berechnet
   aus Bühnengröße und Startzoom, noch während die Bibliothek lädt. */
function warmStart(){
  if(PRE.aus)return;
  var z=tileZoom(startZoom);
  var st=document.getElementById('stage');
  var w=(st&&st.clientWidth)||window.innerWidth||1024,
      h=(st&&st.clientHeight)||window.innerHeight||768;
  var px=256*Math.pow(2,startZoom+1-z);      // Bildschirmpixel je Kachel
  var t=lngLatTile(z,R[0][0],R[0][1]);
  preBlock(z,t[0],t[1],Math.min(4,Math.ceil(w/2/px)),Math.min(4,Math.ceil(h/2/px)));
  prePump();
}
/* Während der Fahrt: ein Stück Strecke voraus, ein paar Kacheln breit
   (das Sichtfeld ist breiter als die Linie). Gedrosselt, damit das Planen
   nicht in jedem Bild passiert.

   Wie weit „voraus" ist, darf KEIN fester Anteil der Gesamtstrecke sein:
   dieselben 5 % sind auf der Bahnfahrt eine sinnvolle Etappe und in der
   Stadt ein Vorgriff über fünfzig Kilometer — lauter Kacheln, die nie
   gebraucht werden und dem Bild von jetzt die Leitung wegnehmen. Gemessen
   wird deshalb in Bildschirmbreiten: gut zwei davon, egal bei welchem Zoom. */
var VORAUS=2.2,    // Bildschirmbreiten Vorlauf
    STUETZ=7,      // Stützstellen darauf
    BAND=2;        // Kacheln links/rechts der Strecke
function preAhead(f){
  var map=SB.mapCtl.map;
  if(PRE.aus||!map||!MLEN)return;
  var jetzt=(typeof performance!=='undefined'&&performance.now)?performance.now():Date.now();
  if(jetzt-PRE.last<350||Math.abs(f-PRE.lastF)<0.002)return;
  PRE.last=jetzt;PRE.lastF=f;
  /* Vorrat ist Kür: solange die Karte noch am Bild von JETZT arbeitet, darf
     ihr der Vorrat keine Leitung wegnehmen. Beim nächsten Anlauf (350 ms)
     wird es erneut versucht. */
  if(map.areTilesLoaded&&!map.areTilesLoaded())return;
  var z=tileZoom(map.getZoom());
  var st=document.getElementById('stage');
  var w=(st&&st.clientWidth)||window.innerWidth||1024;
  // 1 Mercator-Einheit = 512·2^zoom Pixel → Vorlauf in Mercator-Bogenlänge.
  var span=w*VORAUS/(512*Math.pow(2,map.getZoom()));
  var a0=arcAt(f);
  for(var i=0;i<=STUETZ;i++){
    var m=atArc(a0+span*i/STUETZ);
    var ll=new maplibregl.MercatorCoordinate(m[0],m[1],0).toLngLat();
    var t=lngLatTile(z,ll.lng,ll.lat);
    for(var dx=-BAND;dx<=BAND;dx++)
      for(var dy=-BAND;dy<=BAND;dy++)preQueue(z,t[0]+dx,t[1]+dy);
  }
  prePump();
}

/* ---- Fahrzeug ------------------------------------------------------------
   Eine Reise besteht selten aus nur einer Fortbewegungsart: erst Zug, dann
   zu Fuß durch die Stadt, dazwischen mal ein Bus. Welcher Abschnitt wie
   zurückgelegt wird, steht in trip.route.legs (siehe js/core.js) — hier
   hängt an jeder Reiseart ein Profil: Modell, Pixelgröße, Anzahl, Gleis.
   Trips überschreiben einzelne Werte über trip.map.modes.                  */
var V=M.vehicle||{};
var use3d=(M.vehicle3d!==false);
var isTrain=((V.model||'ice')==='ice');
var PROFILE={
  /* size = Pixel je Modelllänge. Beim Zug ist das die Länge EINES Wagens,
     beim Fußgänger die Körperhöhe. */
  rail:{model:V.model||'ice',size:V.size||(SB.isMobile?52:68),
        cars:V.cars===undefined?(isTrain?(SB.isMobile?3:4):1):V.cars,
        pitch:V.pitch||1.03,track:isTrain&&V.track!==false,emoji:M.trainEmoji||'🚆'},
  /* Gehende sind auf dem Schirm halb so hoch wie ein Wagen lang ist —
     entsprechend gröber dürfen sie sein. Das zählt hier doppelt: von jeder
     Haltung liegt ein eigenes Netz im Speicher. */
  foot:{model:'walker',size:SB.isMobile?30:36,cars:1,pitch:1,anim:true,
        cycle:1.9,detail:SB.lowPower?0.5:0.8,emoji:'🚶'},
  bus :{model:'bus', size:SB.isMobile?34:44,cars:1,pitch:1,emoji:'🚌'},
  car :{model:'car', size:SB.isMobile?30:38,cars:1,pitch:1,emoji:'🚗'},
  boat:{model:'bus', size:SB.isMobile?34:44,cars:1,pitch:1,emoji:'⛴️'}
};
(function(){
  var U=M.modes||{};
  for(var m in U){
    if(!PROFILE[m])PROFILE[m]={model:'car',size:36,cars:1,pitch:1};
    for(var k in U[m])PROFILE[m][k]=U[m][k];
  }
})();
function profil(m){return PROFILE[m]||PROFILE.rail;}

/* Wie viele Haltungen hat der Schrittzyklus? Mehr = weicher, aber jede
   Haltung ist ein eigenes Netz im Speicher. */
var POSEN=SB.lowPower?6:8;

var mode='rail',P0=profil('rail');
SB.mapCtl.mode=mode;
var vehicle={pos:R[0].slice(),dir:[0,-1],f:0,size:P0.size};
/* Antippen tauscht das Modell (tapModel:null schaltet den Gag ab). */
var tapKind=(V.tapModel===undefined)?'croissant':V.tapModel;
var getippt=false;
function baseKind(){return profil(mode).model;}
function currentKindOf(){return getippt&&tapKind?tapKind:baseKind();}
var currentKind=currentKindOf();

/* Emoji → Canvas-Bild (Rückfallebene, wenn kein 3D möglich/gewünscht ist) */
function emojiImage(emoji,size){
  var c=document.createElement('canvas');c.width=size;c.height=size;
  var x=c.getContext('2d');
  x.font=(size*0.8)+'px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
  x.textAlign='center';x.textBaseline='middle';
  x.shadowColor='rgba(0,0,0,.35)';x.shadowBlur=size*0.06;x.shadowOffsetY=size*0.05;
  x.fillText(emoji,size/2,size/2+size*0.03);
  return x.getImageData(0,0,size,size);
}

/* ---- 3D-Modell -----------------------------------------------------------
   Die Formen und der Shader stehen in js/mesh.js (SB.mesh) — dieselbe
   Basis nutzt das 3D-T-Shirt im Inhaltsteil. Hier bleibt nur, was mit der
   Karte zu tun hat: Aufstellung, Ausrichtung und Größe des Zuges.
   Alles wird pro Frame auf eine feste Pixelgröße skaliert, damit der Zug
   bei jedem Zoom gleich groß erscheint.

   Der Zug ist kein starres Modell, sondern eine Kette: Kopfwagen, Mittel-
   wagen, gedrehter Kopfwagen. Jeder Wagen wird einzeln auf die Route
   gesetzt, um genau seinen Abstand zur Zugspitze zurückversetzt. Deshalb
   legt sich der Zug in Kurven an die Strecke, statt sie als Balken
   abzuschneiden. Das Gleis darunter zeichnet die Karte als Linie über die
   ganze Route (siehe boot()).                                             */
var MESH=SB.mesh;
/* Auf der Karte bewusst gröber tesselliert als im eigenen Canvas: dort
   zählt jedes Detail, hier zählt jede Millisekunde pro Bild. */
/* Der Zug besteht jetzt aus mehreren Wagen: jeder einzelne ist auf dem
   Schirm nur noch gut 60 px lang, also darf er gröber sein als früher das
   Einzelfahrzeug — sonst zahlt man die Feinheit vier Mal. */
var DETAIL=V.detail||(SB.lowPower?0.45:0.62);
/* Mehrere Wagen und Gleis gibt es nur für den Triebzug — ein Bus, ein Auto
   oder zwei Fußgänger sind einzeln unterwegs. Beides kommt jetzt aus dem
   Profil der aktuellen Reiseart. */
var CARS=Math.max(1,P0.cars);
var PITCH=P0.pitch;                   // Wagenabstand in Modelllängen
var RAILPX=PROFILE.rail.size;         // Gleisbreiten hängen an der ZUG-Größe
/* Farben & Maße für das Netz: erst die Fahrzeug-Angaben des Trips, dann das
   Profil der Reiseart darüber — so bekommt der Bus seinen eigenen Lack,
   ohne dass der Zug ihn erbt. */
function meshCfg(m){
  var C={},k,p=profil(m||mode);
  for(k in V)C[k]=V[k];
  for(k in p)C[k]=p[k];
  C.detail=p.detail||DETAIL;C.pitch=p.pitch||PITCH;
  return C;
}

/* ---- Route in Mercator vermessen ----------------------------------------
   Die Wagenabstände stehen in Bildschirm-Pixeln fest. Umrechnen lassen die
   sich nur dort, wo die Karte „gerade" ist — also in Mercator, nicht in
   Längen-/Breitengraden.                                                   */
var MR=[],MCUM=[0],MLEN=0;
function measureRoute(){
  MR=R.map(function(p){
    var m=maplibregl.MercatorCoordinate.fromLngLat({lng:p[0],lat:p[1]});
    return [m.x,m.y];
  });
  for(var i=1;i<MR.length;i++){
    var dx=MR[i][0]-MR[i-1][0],dy=MR[i][1]-MR[i-1][1];
    MCUM[i]=MCUM[i-1]+Math.sqrt(dx*dx+dy*dy);
  }
  MLEN=MCUM[MCUM.length-1];
}
/* Streckenanteil (so rechnet story.js) → Mercator-Bogenlänge. */
function arcAt(f){
  var t=f*route.LEN,i;
  for(i=1;i<route.cum.length;i++)if(route.cum[i]>=t)break;
  i=Math.min(i,route.cum.length-1);
  var seg=Math.max(route.cum[i]-route.cum[i-1],1e-12);
  return MCUM[i-1]+(MCUM[i]-MCUM[i-1])*((t-route.cum[i-1])/seg);
}
/* Bogenlänge → Punkt. Vor dem Anfang und hinter dem Ende geht es geradeaus
   weiter, sonst stünde der Zug beim Start auf einem Haufen.               */
function atArc(d){
  var i,a,b,L;
  if(d<=0){a=MR[0];b=MR[1];L=Math.max(MCUM[1],1e-12);}
  else if(d>=MLEN){
    i=MCUM.length-1;a=MR[i-1];b=MR[i];
    L=Math.max(MLEN-MCUM[i-1],1e-12);d-=MCUM[i-1];
  }else{
    for(i=1;i<MCUM.length;i++)if(MCUM[i]>=d)break;
    a=MR[i-1];b=MR[i];L=Math.max(MCUM[i]-MCUM[i-1],1e-12);d-=MCUM[i-1];
  }
  var dx=(b[0]-a[0])/L,dy=(b[1]-a[1])/L;
  return [a[0]+dx*d,a[1]+dy*d];
}
/* Standort UND Blickrichtung eines Wagens. Die Richtung kommt aus der Sehne
   über seine eigene Länge — ein reiner Segment-Tangens würde an jedem
   Routenpunkt umspringen und den Zug zucken lassen.                       */
function poseAt(d,half){
  var p=atArc(d),a=atArc(d-half),b=atArc(d+half);
  var dx=b[0]-a[0],dy=b[1]-a[1],l=Math.sqrt(dx*dx+dy*dy);
  if(l<1e-12)return {x:p[0],y:p[1],dx:1,dy:0};
  return {x:p[0],y:p[1],dx:dx/l,dy:dy/l};
}

/* ---- Beschriftung als Textur --------------------------------------------
   Schriftzug und Logo liegen nebeneinander in einem kleinen Bild; welches
   Feld wo liegt, steht in SB.mesh.BRAND — das Modell legt die passenden
   Texturkoordinaten auf seine Flanken. Beides ist über den Trip frei
   wählbar (`wordmark`, `logo`), `false` lässt es weg.                     */
function brandTexture(gl){
  var W=512,H=160,B=MESH.BRAND;
  var word=V.wordmark===undefined?'ICE':V.wordmark,
      logo=V.logo===undefined?'DB':V.logo;
  var c=document.createElement('canvas');c.width=W;c.height=H;
  var x=c.getContext('2d');
  function paint(){
    x.clearRect(0,0,W,H);
    x.textAlign='center';x.textBaseline='middle';
    x.fillStyle=V.color||'#EC0016';
    if(word){
      var w0=B.word[0]*W,w1=B.word[1]*W;
      x.font='italic 900 '+Math.round(H*0.80)+'px Inter, system-ui, sans-serif';
      x.fillText(String(word),(w0+w1)/2,H*0.54,(w1-w0)*0.90);
    }
    if(logo){
      var l0=B.logo[0]*W,lw=(B.logo[1]-B.logo[0])*W;
      var px=l0+lw*0.10,py=H*0.15,pw=lw*0.80,ph=H*0.70;
      x.beginPath();
      if(x.roundRect)x.roundRect(px,py,pw,ph,H*0.14);else x.rect(px,py,pw,ph);
      x.fill();
      x.fillStyle='#fff';
      x.font='900 '+Math.round(H*0.46)+'px Inter, system-ui, sans-serif';
      x.fillText(String(logo),px+pw/2,py+ph*0.54,pw*0.78);
    }
  }
  var t=gl.createTexture();
  function upload(){
    gl.bindTexture(gl.TEXTURE_2D,t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,c);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    // Zwingend zurücksetzen: das ist MapLibres eigener Kontext.
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
  }
  paint();upload();
  // Schrift kommt oft erst nach dem ersten Zeichnen an → einmal nachlegen.
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){
    paint();upload();
    var m=SB.mapCtl.map;if(m&&m.triggerRepaint)m.triggerRepaint();
  });
  return t;
}

/* ---- Der Zug als Kette von Teilen ---------------------------------------- */
var layerApi={rebuild:function(){}};
function makeVehicleLayer(map){
  var P=null,ctx=null,tex=null,parts=[],bufs={},roh={};
  function upload(gl,name,data){
    var m=bufs[name]||(bufs[name]={buf:gl.createBuffer(),count:0});
    gl.bindBuffer(gl.ARRAY_BUFFER,m.buf);
    gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);
    m.count=data.length/MESH.FLOATS;
    delete roh[name];              // liegt jetzt auf der Grafikkarte
    return m;
  }
  /* Rohdaten eines Netzes — einmal gerechnet, dann gemerkt, bis sie
     hochgeladen sind. */
  function netz(name,make){
    return roh[name]||(roh[name]=make());
  }
  function walkerNetz(i){
    return netz('walker'+i,function(){
      var C=meshCfg('foot');
      C.phase=i/POSEN;
      return MESH.walker(C);
    });
  }
  /* Ein Schrittzyklus sind POSEN einzelne Körper — zusammen einige zehn
     Millisekunden Rechenzeit. Genau dann anzufallen, wenn die Karte in die
     Stadt hineinfährt, wäre der denkbar schlechteste Moment. Also werden
     sie schon während der Bahnfahrt in den Leerlaufpausen gebaut, eine je
     Pause, und beim Wechsel nur noch hochgeladen.                        */
  function vorrat(){
    if(!SB.route.lines.foot||!window.requestIdleCallback)return;
    var i=0;
    (function weiter(){
      if(i>=POSEN)return;
      var k=i++;
      requestIdleCallback(function(){walkerNetz(k);weiter();},{timeout:4000});
    })();
  }
  /* Aufstellung bauen: nur die Wagen — das Gleis liegt als Linie auf der
     Karte, über die ganze Strecke (siehe boot()). Jedes Netz wird höchstens
     EINMAL gerechnet und hochgeladen; danach kostet ein Modellwechsel nur
     noch das Umsortieren der Liste, kein Neubauen. Deshalb ist das Antippen
     ab dem zweiten Mal umsonst. `at` ist der Abstand zur Zugspitze in
     Modelllängen.                                                        */
  function need(gl,name,make){
    if(!bufs[name])upload(gl,name,make());
  }
  function build(gl){
    var C=meshCfg(),i;
    parts=[];
    if(currentKind==='ice'&&CARS>1){
      if(!bufs.head||!bufs.mid){
        var t=MESH.iceTrain(C);
        upload(gl,'head',t.head);upload(gl,'mid',t.mid);
      }
      parts.push({n:'head',at:0,turn:false});
      for(i=1;i<CARS-1;i++)parts.push({n:'mid',at:i*PITCH,turn:false});
      parts.push({n:'head',at:(CARS-1)*PITCH,turn:true});
    }else if(currentKind==='walker'){
      /* Gehende bekommen keinen Wagen, sondern einen Zyklus: derselbe
         Körper in POSEN Haltungen, einmal gebaut (siehe vorrat()) und
         danach nur noch durchgeschaltet. */
      for(i=0;i<POSEN;i++)need(gl,'walker'+i,(function(k){
        return function(){return walkerNetz(k);};
      })(i));
      parts.push({n:'walker',at:0,turn:false,zyklus:true});
    }else{
      var one=currentKind;
      need(gl,one,function(){return MESH.vehicle(one,C);});
      for(i=0;i<CARS;i++)parts.push({n:one,at:i*PITCH,turn:false});
    }
  }
  return {
    id:'vehicle',type:'custom',renderingMode:'3d',
    onAdd:function(m,gl){
      ctx=gl;P=MESH.program(gl);tex=brandTexture(gl);
      build(gl);
      layerApi.rebuild=function(){if(ctx)build(ctx);};
      vorrat();
    },
    render:function(gl,arg){
      if(!P)return;
      // MapLibre 4 übergibt die Matrix direkt, spätere Versionen ein Objekt.
      var mat=(arg&&arg.length===16)?arg:
              (arg&&arg.defaultProjectionData&&arg.defaultProjectionData.mainMatrix)||
              (arg&&arg.mainMatrix);
      if(!mat)return;

      var zoom=map.getZoom();
      var lngLat={lng:vehicle.pos[0],lat:vehicle.pos[1]},alt=0;
      if(map.getTerrain&&map.getTerrain()&&map.queryTerrainElevation){
        try{alt=map.queryTerrainElevation(lngLat)||0;}catch(e){alt=0;}
      }
      var mc=maplibregl.MercatorCoordinate.fromLngLat(lngLat,alt);
      // 1 Mercator-Einheit = 512·2^zoom Pixel → feste Pixelgröße des Modells.
      var ppm=512*Math.pow(2,zoom),k=vehicle.size/ppm;
      var head=MLEN?arcAt(vehicle.f):null;
      /* Schritthaltung aus der zurückgelegten Strecke, nicht aus der Uhr:
         so bleiben die Füße am Boden, egal wie schnell gescrollt wird. Ein
         voller Zyklus (zwei Schritte) misst `cycle` Körperhöhen. */
      var pose=0;
      if(head!==null){
        var zyk=Math.max(profil(mode).cycle||1.9,0.2)*vehicle.size;
        pose=Math.floor(head*ppm/(zyk/POSEN))%POSEN;
        if(pose<0)pose+=POSEN;
      }
      // Licht aus Nordwest von oben, in den Modellraum gedreht (der
      // mitgedrehte Wagen soll die Beleuchtung nicht mitdrehen).
      var lw=[-0.38,-0.52,0.76];

      gl.depthMask(true);
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      gl.clear(gl.DEPTH_BUFFER_BIT);   // letzter Layer → Zug immer sichtbar
      gl.disable(gl.BLEND);
      gl.disable(gl.CULL_FACE);
      for(var i=0;i<parts.length;i++){
        var part=parts[i],m=bufs[part.zyklus?part.n+pose:part.n];
        if(!m||!m.count)continue;
        var px=mc.x,py=mc.y,ux=vehicle.dir[0],uy=vehicle.dir[1];
        if(head!==null){
          var q=poseAt(head-part.at*k,k*0.42);
          px=q.x;py=q.y;ux=q.dx;uy=q.dy;
        }
        if(part.turn){ux=-ux;uy=-uy;}
        var model=[ k*ux, k*uy,0,0,
                   -k*uy, k*ux,0,0,
                    0,0,k,0,
                    px,py,mc.z||0,1];
        MESH.draw(gl,P,m.buf,m.count,MESH.mul(mat,model),
          [lw[0]*ux+lw[1]*uy, -lw[0]*uy+lw[1]*ux, lw[2]],{tex:tex});
      }
      gl.disable(gl.DEPTH_TEST);
      gl.enable(gl.BLEND);
    }
  };
}

/* ---- Antippen: Modell tauschen ------------------------------------------
   Das Fahrzeug fährt immer im Kartenmittelpunkt — deshalb reicht eine
   unsichtbare, mittig platzierte Schaltfläche als Trefferfläche. Sie ist
   zugleich per Tastatur bedienbar, was bei einem WebGL-Layer sonst nicht
   ginge: der kennt keine anklickbaren Objekte.                             */
var has3d=false;
function emoji4(kind){
  if(kind==='croissant')return V.tapEmoji||'🥐';
  return profil(mode).emoji||M.trainEmoji||'🚆';
}
function applyModel(){
  var m=SB.mapCtl.map;
  currentKind=currentKindOf();
  if(has3d){
    layerApi.rebuild();
    if(m&&m.triggerRepaint)m.triggerRepaint();
  }else{
    try{if(m&&m.updateImage)m.updateImage('zug',emojiImage(emoji4(currentKind),96));}catch(e){}
  }
}
/* Reiseart gewechselt: Modell, Größe und Anzahl kommen aus dem Profil.
   Aufgerufen aus setVehicle(), also höchstens einmal je Bild — und die
   Netze werden dabei nur beim allerersten Mal wirklich gebaut. */
function setMode(m){
  if(m===mode||!PROFILE[m])return;
  mode=m;SB.mapCtl.mode=m;
  var p=profil(m);
  vehicle.size=p.size;CARS=Math.max(1,p.cars);PITCH=p.pitch||1;
  applyModel();
  // Hängt sich z. B. js/gebaeude.js ein, um Häuser nur in der Stadt zu zeigen.
  if(SB.mapCtl.onMode)SB.mapCtl.onMode(m);
}
function toggleModel(){
  if(!tapKind)return;
  getippt=!getippt;
  applyModel();
  if(SB.showToast)SB.showToast(getippt
    ?(V.tapToast||'🥐 Croissant-Express — bon voyage!')
    :(V.tapToastBack||'🚄 Weiter im Takt.'));
}
function addHitArea(){
  if(!tapKind)return;
  var stage=document.getElementById('stage');
  if(!stage||document.getElementById('vehiclehit'))return;
  var b=document.createElement('button');
  b.id='vehiclehit';b.type='button';
  b.title=V.tapTitle||'Antippen';
  b.setAttribute('aria-label',V.tapAria||'Fahrzeug antippen: Modell wechseln');
  b.addEventListener('click',toggleModel);
  stage.appendChild(b);
}
SB.mapCtl.setVehicle=function(pos,ahead,f){
  vehicle.pos=pos;
  if(typeof f==='number'){vehicle.f=f;setMode(route.modeAt(f));}
  if(ahead){
    // Richtung im Mercator-Raum bestimmen — dort ist die Karte „gerade“.
    var dx=ahead[0]-pos[0],dy=pos[1]-ahead[1];   // y wächst nach Süden
    if(typeof maplibregl!=='undefined'&&maplibregl.MercatorCoordinate){
      var a=maplibregl.MercatorCoordinate.fromLngLat({lng:pos[0],lat:pos[1]}),
          b=maplibregl.MercatorCoordinate.fromLngLat({lng:ahead[0],lat:ahead[1]});
      dx=b.x-a.x;dy=b.y-a.y;
    }
    var len=Math.sqrt(dx*dx+dy*dy);
    if(len>1e-12)vehicle.dir=[dx/len,dy/len];
  }
  var map=SB.mapCtl.map;
  if(!has3d&&map&&map.getSource('train')){
    map.getSource('train').setData({type:'Feature',geometry:{type:'Point',coordinates:pos}});
  }
  if(typeof f==='number')preAhead(f);
};

/* ---- Bibliothek nachladen ------------------------------------------------
   maplibre-gl.js stand früher als blockierendes <script> im Body: die halbe
   Seite wartete auf ein Paket, das erst gebraucht wird, wenn die Karte dran
   ist. Jetzt hängt es diese Funktion ein — der Preload im <head> hat den
   Download da längst angestoßen, hier wird er nur noch abgeholt.          */
var LIB='https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js';
function ladeLib(fertig){
  if(typeof maplibregl!=='undefined')return fertig(true);
  var s=document.createElement('script');
  s.src=LIB;s.async=true;
  s.onload=function(){fertig(typeof maplibregl!=='undefined');};
  s.onerror=function(){fertig(false);};
  (document.head||document.body).appendChild(s);
}

function boot(){
  warmStart();                    // Kacheln parallel zur Bibliothek holen
  ladeLib(function(ok){
    if(!ok){loading.textContent='Karte offline — bitte mit Internet öffnen. Der Rest fährt trotzdem.';return;}
    starteKarte();
  });
}

function starteKarte(){
  // Erst hier: measureRoute() rechnet in Mercator und braucht dafür maplibregl.
  measureRoute();
  var map=new maplibregl.Map({container:'map',interactive:false,
    pixelRatio:Math.min(window.devicePixelRatio||1,SB.isMobile?1.5:2),
    center:R[0].slice(),zoom:startZoom,pitch:0,bearing:0,
    maxTileCacheSize:SB.isMobile?512:2048,fadeDuration:0,antialias:false,
    // Einmal geholte Kacheln bleiben gültig: die Fahrt dauert Minuten, ein
    // erneutes Laden wegen abgelaufener Cache-Header bringt nichts als Traffic.
    refreshExpiredTiles:false,
    style:{version:8,sources:{carto:{type:'raster',tiles:TILE_URL,
      tileSize:256,maxzoom:18,attribution:'© OpenStreetMap-Mitwirkende © CARTO'}},
    layers:[{id:'bg',type:'background',paint:{'background-color':COLORS.bg}},
      {id:'carto',type:'raster',source:'carto',paint:{'raster-fade-duration':0}}]}});
  SB.mapCtl.map=map;
  map.on('load',function(){
    // 3D-Gelände ist der teuerste Layer – auf Phones/schwachen Geräten weglassen.
    if(M.terrain===true&&!SB.lowPower){try{map.addSource('dem',{type:'raster-dem',encoding:'terrarium',
      tiles:['https://elevation-tiles-prod.s3.amazonaws.com/terrarium/{z}/{x}/{y}.png'],
      tileSize:256,maxzoom:11});
      map.setTerrain({source:'dem',exaggeration:1.5});}catch(e){}}
    map.addSource('route',{type:'geojson',data:{type:'Feature',geometry:{type:'LineString',coordinates:R}}});

    /* ---- Die Strecke, nach Reiseart getrennt gezeichnet -----------------
       Jede Art bekommt ihre eigene Quelle (ein MultiLineString aus allen
       Abschnitten dieser Art) und ihren eigenen Stil. Ein Gleis unter einem
       Gassenspaziergang sähe albern aus — und eine Trittspur quer über die
       Alpen genauso.

       Das Gleis ist kein 3D-Körper (das wären tausende Schwellen), sondern
       vier Linien: Schotterbett, Schwellenschraffur, zwei versetzte
       Schienen. Die Breiten kommen aus denselben Maßen, aus denen die Wagen
       ihre Spurweite nehmen (SB.mesh.GAUGE × Pixel je Wagenlänge) — nur so
       stehen die Räder auf den Schienen und nicht daneben.                */
    var LINES=route.lines||{};
    function quelle(m){
      var ls=LINES[m];
      if(!ls||!ls.length)return false;
      map.addSource('w-'+m,{type:'geojson',
        data:{type:'Feature',geometry:{type:'MultiLineString',coordinates:ls}}});
      return true;
    }
    if(quelle('rail')){
      if(PROFILE.rail.track){
        var G=MESH.GAUGE,px=RAILPX;
        map.addLayer({id:'rail-bed',type:'line',source:'w-rail',
          layout:{'line-cap':'round','line-join':'round'},
          paint:{'line-color':V.ballast||'#918B82','line-width':2*G.bed*px,'line-opacity':.92}});
        map.addLayer({id:'rail-ties',type:'line',source:'w-rail',
          paint:{'line-color':V.tie||'#544941','line-width':2*G.tie*px,'line-opacity':.6,
                 'line-dasharray':[0.24,0.34]}});
        [-1,1].forEach(function(s){
          map.addLayer({id:'rail'+(s<0?'-l':'-r'),type:'line',source:'w-rail',
            layout:{'line-cap':'round','line-join':'round'},
            paint:{'line-color':V.rail||'#9AA0A6',
                   'line-width':Math.max(1.2,2*G.railw*px),'line-offset':s*G.rail*px}});
        });
      }else{
        map.addLayer({id:'rail-casing',type:'line',source:'w-rail',
          paint:{'line-color':'#fff','line-width':7,'line-opacity':.7}});
      }
      // Der rote Faden: auf dem Gleis dünner, damit Schwellen und Schienen
      // darunter sichtbar bleiben.
      map.addLayer({id:'route',type:'line',source:'w-rail',
        paint:{'line-color':COLORS.route,'line-width':PROFILE.rail.track?2.4:4,
               'line-dasharray':[2,1.4],'line-opacity':PROFILE.rail.track?.85:1}});
    }
    /* Zu Fuß: keine Linie, sondern eine Spur aus Punkten — runde Enden und
       eine Strichfolge ohne Strich ergeben genau das. */
    if(quelle('foot')){
      map.addLayer({id:'foot-casing',type:'line',source:'w-foot',
        layout:{'line-cap':'round','line-join':'round'},
        paint:{'line-color':'#fff','line-width':9,'line-opacity':.72}});
      map.addLayer({id:'foot',type:'line',source:'w-foot',
        layout:{'line-cap':'round','line-join':'round'},
        paint:{'line-color':M.footColor||COLORS.route,'line-width':3.6,
               'line-dasharray':[0,1.75]}});
    }
    // Bus & Auto: eine glatte Straße, ohne Gestrichel.
    ['bus','car','boat'].forEach(function(m){
      if(!quelle(m))return;
      map.addLayer({id:m+'-casing',type:'line',source:'w-'+m,
        layout:{'line-cap':'round','line-join':'round'},
        paint:{'line-color':'#fff','line-width':8,'line-opacity':.75}});
      map.addLayer({id:m+'-line',type:'line',source:'w-'+m,
        layout:{'line-cap':'round','line-join':'round'},
        paint:{'line-color':M.busColor||'#2E6F97','line-width':4}});
    });
    map.addSource('done',{type:'geojson',data:{type:'Feature',geometry:{type:'LineString',coordinates:[R[0],R[0]]}}});
    map.addLayer({id:'done',type:'line',source:'done',
      paint:{'line-color':COLORS.done,'line-width':PROFILE.rail.track?3.4:5}});
    map.addSource('stops',{type:'geojson',data:{type:'FeatureCollection',features:route.STOP_PTS.map(function(p){return {type:'Feature',geometry:{type:'Point',coordinates:p}}})}});
    map.addLayer({id:'stops-o',type:'circle',source:'stops',paint:{'circle-radius':8,'circle-color':COLORS.stop}});
    map.addLayer({id:'stops-i',type:'circle',source:'stops',paint:{'circle-radius':4,'circle-color':'#fff'}});
    map.addSource('train',{type:'geojson',data:{type:'Feature',geometry:{type:'Point',coordinates:R[0]}}});

    // Erst 3D versuchen; klappt das nicht (alte GPU, kein WebGL-Programm),
    // fällt die Karte lautlos auf das Emoji-Symbol zurück.
    if(use3d){
      try{map.addLayer(makeVehicleLayer(map));has3d=true;}catch(e){has3d=false;}
    }
    if(!has3d){
      map.addImage('zug',emojiImage(emoji4(currentKind),96),{pixelRatio:2});
      map.addLayer({id:'train',type:'symbol',source:'train',layout:{'icon-image':'zug','icon-size':0.62,'icon-allow-overlap':true,'icon-ignore-placement':true}});
    }
    addHitArea();
    SB.mapCtl.ready=true;loading.classList.add('aus');
    /* Ladeanzeige nach dem Ausblenden ganz aus dem Bild nehmen: eine
       bildschirmfüllende Fläche über der Karte kostet sonst in jedem Bild
       Compositing — unsichtbar, aber nicht umsonst. */
    setTimeout(function(){if(loading.classList.contains('aus'))loading.style.display='none';},900);
    preAhead(0);                       // Vorrat für die erste Etappe anlegen
    SB.requestRender&&SB.requestRender();
  });
  map.on('error',function(){});
}

/* Boot erst, wenn die Karte in Sichtweite kommt (spart Start-Traffic). */
var scrolly=document.getElementById('scrolly');
var booted=false;
function maybeBoot(){
  if(booted)return;
  if(scrolly.getBoundingClientRect().top<window.innerHeight*1.6){
    booted=true;boot();
    window.removeEventListener('scroll',maybeBoot);
  }
}
window.addEventListener('scroll',maybeBoot,{passive:true});
maybeBoot();
})();
