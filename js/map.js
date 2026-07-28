/* ==========================================================================
   Engine – Karte (MapLibre): Boot, Layer, Fahrzeug
   Liest trip.map (alle Felder optional):
     zoomMode  'fixed' (Standard) · 'steps' · 'scenes'   → siehe unten
     zoom      Reise-Zoom für 'fixed'                     (Standard 9.6)
     vehicle   {model:'ice'|'train'|'bus'|'car'|'croissant', color, accent,
                glass, light, size, tapModel:'croissant' (Antippen tauscht
                das Modell; null schaltet das ab)}
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
var vehicle={pos:R[0].slice(),dir:[0,-1],size:V.size||(SB.isMobile?74:96)};
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
   Karte zu tun hat: Positionierung, Ausrichtung und Größe des Fahrzeugs.
   Das Modell wird pro Frame auf eine feste Pixelgröße skaliert, damit es
   bei jedem Zoom gleich groß erscheint.                                    */
var MESH=SB.mesh;
function buildVehicleMesh(kind){return MESH.vehicle(kind,V);}

var layerApi={setKind:function(){}};
function makeVehicleLayer(map){
  var P=null,buf=null,count=0,ctx=null;
  return {
    id:'vehicle',type:'custom',renderingMode:'3d',
    onAdd:function(m,gl){
      ctx=gl;
      var mesh=buildVehicleMesh(currentKind);count=mesh.length/MESH.FLOATS;
      P=MESH.program(gl);
      buf=gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER,buf);
      gl.bufferData(gl.ARRAY_BUFFER,mesh,gl.STATIC_DRAW);
      // Modellwechsel: nur der Puffer wird neu gefüllt, Shader bleibt stehen.
      layerApi.setKind=function(kind){
        if(!ctx||!buf)return;
        var next=buildVehicleMesh(kind);count=next.length/MESH.FLOATS;
        ctx.bindBuffer(ctx.ARRAY_BUFFER,buf);
        ctx.bufferData(ctx.ARRAY_BUFFER,next,ctx.STATIC_DRAW);
      };
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
      var ux=vehicle.dir[0],uy=vehicle.dir[1];
      var model=[ k*ux, k*uy,0,0,
                 -k*uy, k*ux,0,0,
                  0,0,k,0,
                  mc.x,mc.y,mc.z||0,1];

      // Licht aus Nordwest von oben, in den Modellraum gedreht (das
      // mitgedrehte Fahrzeug soll die Beleuchtung nicht mitdrehen).
      var lw=[-0.38,-0.52,0.76];
      var lm=[lw[0]*ux+lw[1]*uy, -lw[0]*uy+lw[1]*ux, lw[2]];

      gl.depthMask(true);
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      gl.clear(gl.DEPTH_BUFFER_BIT);   // letzter Layer → Fahrzeug immer sichtbar
      gl.disable(gl.BLEND);
      gl.disable(gl.CULL_FACE);
      MESH.draw(gl,P,buf,count,MESH.mul(mat,model),lm,null);
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
    layerApi.setKind(currentKind);
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
SB.mapCtl.setVehicle=function(pos,ahead){
  vehicle.pos=pos;
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
    if(M.terrain!==false&&!SB.lowPower){try{map.addSource('dem',{type:'raster-dem',encoding:'terrarium',
      tiles:['https://elevation-tiles-prod.s3.amazonaws.com/terrarium/{z}/{x}/{y}.png'],
      tileSize:256,maxzoom:11});
      map.setTerrain({source:'dem',exaggeration:1.5});}catch(e){}}
    map.addSource('route',{type:'geojson',data:{type:'Feature',geometry:{type:'LineString',coordinates:R}}});
    map.addLayer({id:'route-casing',type:'line',source:'route',paint:{'line-color':'#fff','line-width':7,'line-opacity':.7}});
    map.addLayer({id:'route',type:'line',source:'route',paint:{'line-color':COLORS.route,'line-width':4,'line-dasharray':[2,1.4]}});
    map.addSource('done',{type:'geojson',data:{type:'Feature',geometry:{type:'LineString',coordinates:[R[0],R[0]]}}});
    map.addLayer({id:'done',type:'line',source:'done',paint:{'line-color':COLORS.done,'line-width':5}});
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
