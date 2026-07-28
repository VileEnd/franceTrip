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
     vehicle3d false = flaches Emoji statt 3D-Modell
     trainEmoji, routeColor, doneColor, stopColor, bg, terrain:false, pitchScale
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

/* ---- Zoom-Strategie ----------------------------------------------------- */
var zoomMode=M.zoomMode||'fixed';
var cruiseZoom=(typeof M.zoom==='number')?M.zoom:9.6;
function stepZoom(s){
  // Halbe Stufen: der Wechsel passiert an Szenengrenzen, nicht laufend.
  if(s.zStep===undefined)s.zStep=Math.round(((s.z0+s.z1)/2)*2)/2;
  return s.zStep;
}
SB.mapCtl.zoomAt=function(s,t){
  if(zoomMode==='scenes')return s.z0+(s.z1-s.z0)*t;
  if(zoomMode==='steps')return stepZoom(s);
  return cruiseZoom;
};
var startZoom=SB.mapCtl.zoomAt(SB.scenes[0],0);

/* ---- Fahrzeug ------------------------------------------------------------ */
var V=M.vehicle||{};
var use3d=(M.vehicle3d!==false);
/* size = Pixel je Modelllänge, also die Länge EINES Wagens. Der ganze Zug
   ist entsprechend `cars` mal so lang — deshalb liegt der Wert deutlich
   unter dem eines Einzelfahrzeugs. */
var vehicle={pos:R[0].slice(),dir:[0,-1],f:0,
             size:V.size||(SB.isMobile?52:68)};
var baseKind=V.model||'ice';
/* Antippen tauscht das Modell (tapModel:null schaltet den Gag ab). */
var tapKind=(V.tapModel===undefined)?'croissant':V.tapModel;
var currentKind=baseKind;

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
/* Mehrere Wagen und Gleis gibt es nur für den Triebzug — ein Bus oder ein
   Auto fährt einzeln und ohne Schienen. */
var isTrain=(baseKind==='ice');
var CARS=Math.max(1,V.cars===undefined?(isTrain?(SB.isMobile?3:4):1):V.cars);
var RAILS=isTrain&&V.track!==false;
var PITCH=V.pitch||1.03;              // Wagenabstand in Modelllängen
function meshCfg(){
  var C={};for(var k in V)C[k]=V[k];
  C.detail=DETAIL;C.pitch=PITCH;
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
  var P=null,ctx=null,tex=null,parts=[],bufs={};
  function upload(gl,name,data){
    var m=bufs[name]||(bufs[name]={buf:gl.createBuffer(),count:0});
    gl.bindBuffer(gl.ARRAY_BUFFER,m.buf);
    gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);
    m.count=data.length/MESH.FLOATS;
    return m;
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
    },
    render:function(gl,arg){
      if(!P)return;
      // MapLibre 4 übergibt die Matrix direkt, spätere Versionen ein Objekt.
      var mat=(arg&&arg.length===16)?arg:
              (arg&&arg.defaultProjectionData&&arg.defaultProjectionData.mainMatrix)||
              (arg&&arg.mainMatrix);
      if(!mat)return;

      var lngLat={lng:vehicle.pos[0],lat:vehicle.pos[1]},alt=0;
      if(map.getTerrain&&map.getTerrain()&&map.queryTerrainElevation){
        try{alt=map.queryTerrainElevation(lngLat)||0;}catch(e){alt=0;}
      }
      var mc=maplibregl.MercatorCoordinate.fromLngLat(lngLat,alt);
      // 1 Mercator-Einheit = 512·2^zoom Pixel → feste Pixelgröße des Modells.
      var k=vehicle.size/(512*Math.pow(2,map.getZoom()));
      var head=MLEN?arcAt(vehicle.f):null;
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
        var part=parts[i],m=bufs[part.n];
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
  return kind==='croissant'?(V.tapEmoji||'🥐'):(M.trainEmoji||'🚆');
}
function applyModel(){
  var m=SB.mapCtl.map;
  if(has3d){
    layerApi.rebuild();
    if(m&&m.triggerRepaint)m.triggerRepaint();
  }else{
    try{if(m&&m.updateImage)m.updateImage('zug',emojiImage(emoji4(currentKind),96));}catch(e){}
  }
}
function toggleModel(){
  if(!tapKind)return;
  currentKind=(currentKind===baseKind)?tapKind:baseKind;
  applyModel();
  if(SB.showToast)SB.showToast(currentKind===baseKind
    ?(V.tapToastBack||'🚄 Weiter im Takt.')
    :(V.tapToast||'🥐 Croissant-Express — bon voyage!'));
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
  if(typeof f==='number')vehicle.f=f;
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
};

function boot(){
  if(typeof maplibregl==='undefined'){loading.textContent='Karte offline — bitte mit Internet öffnen. Der Rest fährt trotzdem.';return;}
  measureRoute();
  var suf=SB.isMobile?'':'@2x';   // normale Tiles auf Phones = ein Viertel der Pixel
  var map=new maplibregl.Map({container:'map',interactive:false,
    pixelRatio:Math.min(window.devicePixelRatio||1,SB.isMobile?1.5:2),
    center:R[0].slice(),zoom:startZoom,pitch:0,bearing:0,
    maxTileCacheSize:SB.isMobile?512:2048,fadeDuration:0,antialias:false,
    style:{version:8,sources:{carto:{type:'raster',tiles:[
      'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}'+suf+'.png',
      'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}'+suf+'.png',
      'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}'+suf+'.png'],
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
    /* ---- Gleis über die ganze Strecke ---------------------------------
       Nicht als 3D-Körper (das wären tausende Schwellen), sondern als vier
       Linien: Schotterbett, Schwellenschraffur (kurze Striche über die
       Breite) und zwei versetzte Schienen. Die Breiten kommen aus denselben
       Maßen, aus denen die Wagen ihre Spurweite nehmen (SB.mesh.GAUGE ×
       Pixel je Modelllänge) — nur so stehen die Räder auf den Schienen und
       nicht daneben.                                                     */
    if(RAILS){
      var G=MESH.GAUGE,px=vehicle.size;
      map.addLayer({id:'rail-bed',type:'line',source:'route',
        layout:{'line-cap':'round','line-join':'round'},
        paint:{'line-color':V.ballast||'#918B82','line-width':2*G.bed*px,'line-opacity':.92}});
      map.addLayer({id:'rail-ties',type:'line',source:'route',
        paint:{'line-color':V.tie||'#544941','line-width':2*G.tie*px,'line-opacity':.6,
               'line-dasharray':[0.24,0.34]}});
      [-1,1].forEach(function(s){
        map.addLayer({id:'rail'+(s<0?'-l':'-r'),type:'line',source:'route',
          layout:{'line-cap':'round','line-join':'round'},
          paint:{'line-color':V.rail||'#9AA0A6',
                 'line-width':Math.max(1.2,2*G.railw*px),'line-offset':s*G.rail*px}});
      });
    }else{
      map.addLayer({id:'route-casing',type:'line',source:'route',paint:{'line-color':'#fff','line-width':7,'line-opacity':.7}});
    }
    // Die Route selbst bleibt der rote Faden — auf dem Gleis dünner, damit
    // Schwellen und Schienen darunter sichtbar bleiben.
    map.addLayer({id:'route',type:'line',source:'route',
      paint:{'line-color':COLORS.route,'line-width':RAILS?2.4:4,
             'line-dasharray':[2,1.4],'line-opacity':RAILS?.85:1}});
    map.addSource('done',{type:'geojson',data:{type:'Feature',geometry:{type:'LineString',coordinates:[R[0],R[0]]}}});
    map.addLayer({id:'done',type:'line',source:'done',
      paint:{'line-color':COLORS.done,'line-width':RAILS?3.4:5}});
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
