/* ==========================================================================
   Engine – Karte (MapLibre): Boot, Layer, Fahrzeug
   Liest trip.map (alle Felder optional):
     zoomMode  'fixed' (Standard) · 'steps' · 'scenes'   → siehe unten
     zoom      Reise-Zoom für 'fixed'                     (Standard 9.6)
     vehicle   {model:'train'|'bus'|'car', color, accent, glass, light, size}
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

/* ---- 3D-Modell: kleine Klötzchen-Fahrzeuge in reinem WebGL ---------------
   Bewusst ohne Fremdbibliothek (kein three.js, kein glTF-Download): ein
   paar Quader mit Normalen reichen für ein erkennbares Fahrzeug, laden
   sofort und funktionieren auch auf GitHub Pages ohne Build-Schritt.
   Modellraum: +x = Fahrtrichtung, +z = oben, Länge 1 (wird pro Frame auf
   eine feste Pixelgröße skaliert, damit das Fahrzeug immer gleich groß
   erscheint — unabhängig von Zoom und Breitengrad).                        */
function hexRGB(h,fb){
  h=(h||fb).replace('#','');
  if(h.length===3)h=h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
  var n=parseInt(h,16);
  return [((n>>16)&255)/255,((n>>8)&255)/255,(n&255)/255];
}
function box(out,x0,x1,y0,y1,z0,z1,c){
  var p=[[x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0],
         [x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]];
  var faces=[[0,3,2,1,0,0,-1],[4,5,6,7,0,0,1],[0,1,5,4,0,-1,0],
             [2,3,7,6,0,1,0],[1,2,6,5,1,0,0],[3,0,4,7,-1,0,0]];
  for(var i=0;i<faces.length;i++){
    var f=faces[i],q=[p[f[0]],p[f[1]],p[f[2]],p[f[0]],p[f[2]],p[f[3]]];
    for(var j=0;j<6;j++)out.push(q[j][0],q[j][1],q[j][2],f[4],f[5],f[6],c[0],c[1],c[2]);
  }
}
function buildVehicleMesh(){
  var body=hexRGB(V.color,COLORS.route),
      accent=hexRGB(V.accent,'#FFD800'),
      glass=hexRGB(V.glass,'#26313E'),
      light=hexRGB(V.light,'#F2F0EA'),
      dark=[0.16,0.17,0.19];
  var v=[],kind=V.model||'train';
  // +x zeigt nach vorn: Bug/Front liegt bei +0.5, Heck bei -0.5.
  if(kind==='bus'){
    box(v,-0.46,0.46,-0.155,0.155,0.00,0.075,dark);          // Fahrwerk
    box(v,-0.50,0.50,-0.175,0.175,0.06,0.42,body);           // Aufbau
    box(v,-0.485,0.485,-0.182,0.182,0.24,0.355,glass);       // Fensterband
    box(v,-0.50,0.50,-0.168,0.168,0.42,0.45,light);          // Dach
    box(v,0.47,0.505,-0.14,0.14,0.10,0.20,accent);           // Front
  }else if(kind==='car'){
    box(v,-0.46,0.46,-0.15,0.15,0.00,0.06,dark);
    box(v,-0.50,0.50,-0.17,0.17,0.05,0.20,body);
    box(v,-0.24,0.18,-0.155,0.155,0.20,0.32,body);           // Kabine
    box(v,-0.23,0.17,-0.162,0.162,0.215,0.30,glass);
    box(v,0.47,0.505,-0.13,0.13,0.09,0.16,accent);           // Front
  }else{                                                      // 'train'
    box(v,-0.50,0.50,-0.115,0.115,0.00,0.055,dark);          // Untergestell
    box(v,0.02,0.50,-0.145,0.145,0.05,0.300,body);           // Lok
    box(v,0.03,0.492,-0.152,0.152,0.195,0.265,glass);        // Lok-Fenster
    box(v,0.44,0.505,-0.145,0.145,0.05,0.195,accent);        // Bugpartie
    box(v,0.02,0.50,-0.130,0.130,0.300,0.325,light);         // Dach
    box(v,-0.50,-0.02,-0.140,0.140,0.05,0.270,light);        // Wagen
    box(v,-0.49,-0.03,-0.147,0.147,0.175,0.240,glass);       // Wagen-Fenster
    box(v,-0.50,-0.02,-0.1425,0.1425,0.09,0.125,body);       // Zierstreifen
  }
  return new Float32Array(v);
}

var VERT=
  'attribute vec3 a_pos;attribute vec3 a_norm;attribute vec3 a_col;'+
  'uniform mat4 u_matrix;varying vec3 v_col;varying vec3 v_norm;'+
  'void main(){v_col=a_col;v_norm=a_norm;gl_Position=u_matrix*vec4(a_pos,1.0);}';
var FRAG=
  'precision mediump float;varying vec3 v_col;varying vec3 v_norm;uniform vec3 u_light;'+
  'void main(){float d=max(dot(normalize(v_norm),normalize(u_light)),0.0);'+
  'gl_FragColor=vec4(v_col*(0.58+0.52*d),1.0);}';

function compile(gl,type,src){
  var s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);
  if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));
  return s;
}
/* out = a · b, beide spaltenweise (wie MapLibre-Matrizen) */
function mul(a,b){
  var o=new Float64Array(16);
  for(var c=0;c<4;c++)for(var r=0;r<4;r++){
    o[c*4+r]=a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3];
  }
  return o;
}

function makeVehicleLayer(map){
  var gl_prog=null,buf=null,count=0,loc={};
  return {
    id:'vehicle',type:'custom',renderingMode:'3d',
    onAdd:function(m,gl){
      var mesh=buildVehicleMesh();count=mesh.length/9;
      gl_prog=gl.createProgram();
      gl.attachShader(gl_prog,compile(gl,gl.VERTEX_SHADER,VERT));
      gl.attachShader(gl_prog,compile(gl,gl.FRAGMENT_SHADER,FRAG));
      gl.linkProgram(gl_prog);
      if(!gl.getProgramParameter(gl_prog,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(gl_prog));
      loc.pos=gl.getAttribLocation(gl_prog,'a_pos');
      loc.norm=gl.getAttribLocation(gl_prog,'a_norm');
      loc.col=gl.getAttribLocation(gl_prog,'a_col');
      loc.matrix=gl.getUniformLocation(gl_prog,'u_matrix');
      loc.light=gl.getUniformLocation(gl_prog,'u_light');
      buf=gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER,buf);
      gl.bufferData(gl.ARRAY_BUFFER,mesh,gl.STATIC_DRAW);
    },
    render:function(gl,arg){
      if(!gl_prog)return;
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
      var out=mul(mat,model);

      // Licht aus Nordwest von oben, in den Modellraum gedreht (mitgedrehtes
      // Fahrzeug soll nicht die Beleuchtung mitdrehen).
      var lw=[-0.38,-0.52,0.76];
      var lm=[lw[0]*ux+lw[1]*uy, -lw[0]*uy+lw[1]*ux, lw[2]];

      gl.useProgram(gl_prog);
      gl.depthMask(true);
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      gl.clear(gl.DEPTH_BUFFER_BIT);   // letzter Layer → Fahrzeug immer sichtbar
      gl.disable(gl.BLEND);
      gl.disable(gl.CULL_FACE);
      gl.bindBuffer(gl.ARRAY_BUFFER,buf);
      var STRIDE=9*4;
      gl.enableVertexAttribArray(loc.pos);
      gl.vertexAttribPointer(loc.pos,3,gl.FLOAT,false,STRIDE,0);
      gl.enableVertexAttribArray(loc.norm);
      gl.vertexAttribPointer(loc.norm,3,gl.FLOAT,false,STRIDE,12);
      gl.enableVertexAttribArray(loc.col);
      gl.vertexAttribPointer(loc.col,3,gl.FLOAT,false,STRIDE,24);
      gl.uniformMatrix4fv(loc.matrix,false,new Float32Array(out));
      gl.uniform3f(loc.light,lm[0],lm[1],lm[2]);
      gl.drawArrays(gl.TRIANGLES,0,count);
      gl.disableVertexAttribArray(loc.pos);
      gl.disableVertexAttribArray(loc.norm);
      gl.disableVertexAttribArray(loc.col);
      gl.disable(gl.DEPTH_TEST);
      gl.enable(gl.BLEND);
    }
  };
}

/* ---- Öffentliche Fahrzeug-Schnittstelle (story.js ruft das pro Frame) ---- */
var has3d=false;
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
      map.addImage('zug',emojiImage(M.trainEmoji||'🚆',96),{pixelRatio:2});
      map.addLayer({id:'train',type:'symbol',source:'train',layout:{'icon-image':'zug','icon-size':0.62,'icon-allow-overlap':true,'icon-ignore-placement':true}});
    }
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
