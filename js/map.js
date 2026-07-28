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
/* Viereck mit Normale aus dem Kreuzprodukt (trägt auch schräge Flächen). */
function quad(out,p0,p1,p2,p3,c){
  var ax=p1[0]-p0[0],ay=p1[1]-p0[1],az=p1[2]-p0[2],
      bx=p3[0]-p0[0],by=p3[1]-p0[1],bz=p3[2]-p0[2];
  var nx=ay*bz-az*by,ny=az*bx-ax*bz,nz=ax*by-ay*bx;
  var l=Math.sqrt(nx*nx+ny*ny+nz*nz)||1;nx/=l;ny/=l;nz/=l;
  var q=[p0,p1,p2,p0,p2,p3];
  for(var i=0;i<6;i++)out.push(q[i][0],q[i][1],q[i][2],nx,ny,nz,c[0],c[1],c[2]);
}
/* „Gespannter“ Körper aus Rechteck-Querschnitten entlang x — damit lassen
   sich zulaufende Formen bauen (ICE-Bug, Heck) statt nur Quader. */
function hull(out,sc,c){
  for(var i=0;i<sc.length-1;i++){
    var a=sc[i],b=sc[i+1];
    quad(out,[a.x,a.hy,a.z0],[a.x,a.hy,a.z1],[b.x,b.hy,b.z1],[b.x,b.hy,b.z0],c);        // +y
    quad(out,[a.x,-a.hy,a.z1],[a.x,-a.hy,a.z0],[b.x,-b.hy,b.z0],[b.x,-b.hy,b.z1],c);    // -y
    quad(out,[a.x,a.hy,a.z1],[a.x,-a.hy,a.z1],[b.x,-b.hy,b.z1],[b.x,b.hy,b.z1],c);      // oben
    quad(out,[a.x,-a.hy,a.z0],[a.x,a.hy,a.z0],[b.x,b.hy,b.z0],[b.x,-b.hy,b.z0],c);      // unten
  }
  var f=sc[sc.length-1],r=sc[0];
  quad(out,[f.x,f.hy,f.z0],[f.x,f.hy,f.z1],[f.x,-f.hy,f.z1],[f.x,-f.hy,f.z0],c);        // Bug
  quad(out,[r.x,-r.hy,r.z0],[r.x,-r.hy,r.z1],[r.x,r.hy,r.z1],[r.x,r.hy,r.z0],c);        // Heck
}
function sec(x,hy,z0,z1){return {x:x,hy:hy,z0:z0,z1:z1};}

/* ---- Croissant ----------------------------------------------------------
   Ein Hörnchen lässt sich nicht aus Quadern bauen: hier läuft ein Kreis-
   Querschnitt an einem Bogen entlang, wird zu den Spitzen hin dünner,
   leicht platt gedrückt und bekommt über eine Radius-Welle die typischen
   Wickel-Rippen.                                                           */
function croissant(out,crust,toast){
  var SEG=56,RING=14,ARC=2.70,RC=0.42,R0=0.185,FLAT=0.60,CX=0.33,RIB=7;
  function pt(t,ph){
    var a=-ARC/2+t*ARC,ca=Math.cos(a),sa=Math.sin(a);
    var prof=Math.pow(Math.sin(Math.PI*t),0.8);
    var r=R0*(0.10+0.90*prof)*(1+0.055*Math.cos(t*Math.PI*RIB));
    var nx=ca*Math.cos(ph),ny=sa*Math.cos(ph),nz=Math.sin(ph);
    return {p:[RC*ca-CX+r*nx, RC*sa+r*ny, r*nz*FLAT+R0*0.85],
            n:[nx,ny,nz],prof:prof};
  }
  for(var i=0;i<SEG;i++){
    for(var j=0;j<RING;j++){
      var t0=i/SEG,t1=(i+1)/SEG,f0=j/RING*Math.PI*2,f1=(j+1)/RING*Math.PI*2;
      var A=pt(t0,f0),B=pt(t0,f1),C=pt(t1,f1),D=pt(t1,f0);
      // Spitzen dunkler gebacken, Rillen zwischen den Wickeln abgedunkelt.
      var bake=(0.74+0.26*A.prof)*(0.90+0.10*Math.cos(t0*Math.PI*RIB));
      var top=0.5+0.5*A.n[2];
      var c=[crust[0]*bake+(toast[0]-crust[0])*(1-top)*0.5,
             crust[1]*bake+(toast[1]-crust[1])*(1-top)*0.5,
             crust[2]*bake+(toast[2]-crust[2])*(1-top)*0.5];
      var q=[A,B,C,A,C,D];
      for(var k=0;k<6;k++)out.push(q[k].p[0],q[k].p[1],q[k].p[2],
                                   q[k].n[0],q[k].n[1],q[k].n[2],c[0],c[1],c[2]);
    }
  }
}

function buildVehicleMesh(kind){
  var body=hexRGB(V.color,COLORS.route),
      accent=hexRGB(V.accent,'#FFD800'),
      glass=hexRGB(V.glass,'#26313E'),
      light=hexRGB(V.light,'#F2F0EA'),
      dark=[0.16,0.17,0.19];
  var v=[];
  // +x zeigt nach vorn: Bug/Front liegt bei +0.5, Heck bei -0.5.
  if(kind==='croissant'){
    croissant(v,hexRGB(V.crust,'#E0A552'),hexRGB(V.toast,'#A9662A'));
  }else if(kind==='ice'){
    /* ICE: weißer, spitz zulaufender Wagenkasten mit rotem Zierstreifen. */
    box(v,-0.45,0.45,-0.126,0.126,0.000,0.066,dark);          // Untergestell
    hull(v,[sec(-0.50,0.050,0.115,0.180),sec(-0.44,0.104,0.082,0.246),
            sec(-0.34,0.142,0.062,0.290),sec(0.34,0.142,0.062,0.290),
            sec(0.44,0.104,0.082,0.246),sec(0.50,0.050,0.115,0.180)],light);
    hull(v,[sec(-0.455,0.074,0.196,0.236),sec(-0.35,0.147,0.204,0.268),
            sec(0.35,0.147,0.204,0.268),sec(0.455,0.074,0.196,0.236)],glass);
    hull(v,[sec(-0.462,0.078,0.180,0.196),sec(-0.36,0.148,0.186,0.204),
            sec(0.36,0.148,0.186,0.204),sec(0.462,0.078,0.180,0.196)],body);
    box(v,-0.10,0.05,-0.020,0.020,0.290,0.334,dark);          // Stromabnehmer
    box(v,0.455,0.492,-0.046,-0.014,0.128,0.156,accent);      // Spitzenlichter
    box(v,0.455,0.492,0.014,0.046,0.128,0.156,accent);
  }else if(kind==='bus'){
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

var layerApi={setKind:function(){}};
function makeVehicleLayer(map){
  var gl_prog=null,buf=null,count=0,loc={},ctx=null;
  return {
    id:'vehicle',type:'custom',renderingMode:'3d',
    onAdd:function(m,gl){
      ctx=gl;
      var mesh=buildVehicleMesh(currentKind);count=mesh.length/9;
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
      // Modellwechsel: nur der Puffer wird neu gefüllt, Shader bleibt stehen.
      layerApi.setKind=function(kind){
        if(!ctx||!buf)return;
        var next=buildVehicleMesh(kind);count=next.length/9;
        ctx.bindBuffer(ctx.ARRAY_BUFFER,buf);
        ctx.bufferData(ctx.ARRAY_BUFFER,next,ctx.STATIC_DRAW);
      };
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
