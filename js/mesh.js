/* ==========================================================================
   Engine – 3D-Werkzeugkasten (SB.mesh)
   Gemeinsame Basis für alle 3D-Objekte der Seite: das Fahrzeug auf der
   Karte (js/map.js) und das T-Shirt im Inhaltsteil (js/tee3d.js).

   Bewusst ohne Fremdbibliothek (kein three.js, kein glTF-Download): ein
   paar Grundkörper mit Normalen reichen für erkennbare Objekte, laden
   sofort und funktionieren auch auf GitHub Pages ohne Build-Schritt.

   Vertex-Format: pos(3) · normal(3) · farbe(3) · uv(2) = 11 Floats.
   uv = (-1,-1) heißt „keine Textur“ — dann zählt nur die Vertex-Farbe.
   ========================================================================== */
(function(){
'use strict';
var SB=window.SB=window.SB||{};
var NO_UV=-1;

function hexRGB(h,fb){
  h=String(h||fb).replace('#','');
  if(h.length===3)h=h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
  var n=parseInt(h,16);
  return [((n>>16)&255)/255,((n>>8)&255)/255,(n&255)/255];
}

/* Ein Viereck; die Normale kommt aus dem Kreuzprodukt, damit auch schräge
   Flächen (zulaufende Bugpartien) richtig beleuchtet werden. uv optional. */
function quad(out,p0,p1,p2,p3,c,uv){
  var ax=p1[0]-p0[0],ay=p1[1]-p0[1],az=p1[2]-p0[2],
      bx=p3[0]-p0[0],by=p3[1]-p0[1],bz=p3[2]-p0[2];
  var nx=ay*bz-az*by,ny=az*bx-ax*bz,nz=ax*by-ay*bx;
  var l=Math.sqrt(nx*nx+ny*ny+nz*nz)||1;nx/=l;ny/=l;nz/=l;
  var q=[p0,p1,p2,p0,p2,p3],t=uv?[uv[0],uv[1],uv[2],uv[0],uv[2],uv[3]]:null;
  for(var i=0;i<6;i++){
    out.push(q[i][0],q[i][1],q[i][2],nx,ny,nz,c[0],c[1],c[2]);
    if(t)out.push(t[i][0],t[i][1]);else out.push(NO_UV,NO_UV);
  }
}
function box(out,x0,x1,y0,y1,z0,z1,c){
  var p=[[x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0],
         [x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]];
  var f=[[0,3,2,1,0,0,-1],[4,5,6,7,0,0,1],[0,1,5,4,0,-1,0],
         [2,3,7,6,0,1,0],[1,2,6,5,1,0,0],[3,0,4,7,-1,0,0]];
  for(var i=0;i<f.length;i++){
    var g=f[i],q=[p[g[0]],p[g[1]],p[g[2]],p[g[0]],p[g[2]],p[g[3]]];
    for(var j=0;j<6;j++)out.push(q[j][0],q[j][1],q[j][2],g[4],g[5],g[6],
                                 c[0],c[1],c[2],NO_UV,NO_UV);
  }
}
/* Rechteck-Querschnitte entlang x aufspannen → zulaufende Formen. */
function sec(x,hy,z0,z1){return {x:x,hy:hy,z0:z0,z1:z1};}
function hull(out,sc,c){
  for(var i=0;i<sc.length-1;i++){
    var a=sc[i],b=sc[i+1];
    quad(out,[a.x,a.hy,a.z0],[a.x,a.hy,a.z1],[b.x,b.hy,b.z1],[b.x,b.hy,b.z0],c);
    quad(out,[a.x,-a.hy,a.z1],[a.x,-a.hy,a.z0],[b.x,-b.hy,b.z0],[b.x,-b.hy,b.z1],c);
    quad(out,[a.x,a.hy,a.z1],[a.x,-a.hy,a.z1],[b.x,-b.hy,b.z1],[b.x,b.hy,b.z1],c);
    quad(out,[a.x,-a.hy,a.z0],[a.x,a.hy,a.z0],[b.x,b.hy,b.z0],[b.x,-b.hy,b.z0],c);
  }
  var f=sc[sc.length-1],r=sc[0];
  quad(out,[f.x,f.hy,f.z0],[f.x,f.hy,f.z1],[f.x,-f.hy,f.z1],[f.x,-f.hy,f.z0],c);
  quad(out,[r.x,-r.hy,r.z0],[r.x,-r.hy,r.z1],[r.x,r.hy,r.z1],[r.x,r.hy,r.z0],c);
}
/* Dasselbe stehend: Querschnitte entlang y (für Kleidungsstücke). */
function secY(y,hx,hz){return {y:y,hx:hx,hz:hz};}
function loftY(out,sc,c){
  for(var i=0;i<sc.length-1;i++){
    var a=sc[i],b=sc[i+1];
    quad(out,[a.hx,a.y,a.hz],[a.hx,a.y,-a.hz],[b.hx,b.y,-b.hz],[b.hx,b.y,b.hz],c);      // +x
    quad(out,[-a.hx,a.y,-a.hz],[-a.hx,a.y,a.hz],[-b.hx,b.y,b.hz],[-b.hx,b.y,-b.hz],c);  // -x
    quad(out,[-a.hx,a.y,a.hz],[a.hx,a.y,a.hz],[b.hx,b.y,b.hz],[-b.hx,b.y,b.hz],c);      // vorn
    quad(out,[a.hx,a.y,-a.hz],[-a.hx,a.y,-a.hz],[-b.hx,b.y,-b.hz],[b.hx,b.y,-b.hz],c);  // hinten
  }
  var t=sc[sc.length-1],u=sc[0];
  quad(out,[-t.hx,t.y,t.hz],[t.hx,t.y,t.hz],[t.hx,t.y,-t.hz],[-t.hx,t.y,-t.hz],c);      // oben
  quad(out,[-u.hx,u.y,-u.hz],[u.hx,u.y,-u.hz],[u.hx,u.y,u.hz],[-u.hx,u.y,u.hz],c);      // unten
}
/* Teil-Mesh um die z-Achse drehen und verschieben (Ärmel, Anbauteile). */
function rotZinto(out,sub,ang,tx,ty,tz){
  var ca=Math.cos(ang),sa=Math.sin(ang);
  for(var i=0;i<sub.length;i+=11){
    var x=sub[i],y=sub[i+1],nx=sub[i+3],ny=sub[i+4];
    out.push(x*ca-y*sa+tx, x*sa+y*ca+ty, sub[i+2]+tz,
             nx*ca-ny*sa, nx*sa+ny*ca, sub[i+5],
             sub[i+6],sub[i+7],sub[i+8],sub[i+9],sub[i+10]);
  }
}

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
    return {p:[RC*ca-CX+r*nx, RC*sa+r*ny, r*nz*FLAT+R0*0.85],n:[nx,ny,nz],prof:prof};
  }
  for(var i=0;i<SEG;i++)for(var j=0;j<RING;j++){
    var t0=i/SEG,t1=(i+1)/SEG,f0=j/RING*Math.PI*2,f1=(j+1)/RING*Math.PI*2;
    var A=pt(t0,f0),B=pt(t0,f1),C=pt(t1,f1),D=pt(t1,f0);
    var bake=(0.74+0.26*A.prof)*(0.90+0.10*Math.cos(t0*Math.PI*RIB));
    var top=0.5+0.5*A.n[2];
    var c=[crust[0]*bake+(toast[0]-crust[0])*(1-top)*0.5,
           crust[1]*bake+(toast[1]-crust[1])*(1-top)*0.5,
           crust[2]*bake+(toast[2]-crust[2])*(1-top)*0.5];
    var q=[A,B,C,A,C,D];
    for(var k=0;k<6;k++)out.push(q[k].p[0],q[k].p[1],q[k].p[2],
                                 q[k].n[0],q[k].n[1],q[k].n[2],
                                 c[0],c[1],c[2],NO_UV,NO_UV);
  }
}

/* ---- Fahrzeuge ----------------------------------------------------------
   Modellraum: +x = Fahrtrichtung, +z = oben, Gesamtlänge 1.               */
function vehicle(kind,C){
  var body=hexRGB(C.color,'#EC0016'),accent=hexRGB(C.accent,'#FFD800'),
      glass=hexRGB(C.glass,'#26313E'),light=hexRGB(C.light,'#F2F0EA'),
      dark=[0.16,0.17,0.19],v=[];
  if(kind==='croissant'){
    croissant(v,hexRGB(C.crust,'#E0A552'),hexRGB(C.toast,'#A9662A'));
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
    box(v,-0.46,0.46,-0.155,0.155,0.00,0.075,dark);
    box(v,-0.50,0.50,-0.175,0.175,0.06,0.42,body);
    box(v,-0.485,0.485,-0.182,0.182,0.24,0.355,glass);
    box(v,-0.50,0.50,-0.168,0.168,0.42,0.45,light);
    box(v,0.47,0.505,-0.14,0.14,0.10,0.20,accent);
  }else if(kind==='car'){
    box(v,-0.46,0.46,-0.15,0.15,0.00,0.06,dark);
    box(v,-0.50,0.50,-0.17,0.17,0.05,0.20,body);
    box(v,-0.24,0.18,-0.155,0.155,0.20,0.32,body);
    box(v,-0.23,0.17,-0.162,0.162,0.215,0.30,glass);
    box(v,0.47,0.505,-0.13,0.13,0.09,0.16,accent);
  }else{                                                      // 'train'
    box(v,-0.50,0.50,-0.115,0.115,0.00,0.055,dark);
    box(v,0.02,0.50,-0.145,0.145,0.05,0.300,body);
    box(v,0.03,0.492,-0.152,0.152,0.195,0.265,glass);
    box(v,0.44,0.505,-0.145,0.145,0.05,0.195,accent);
    box(v,0.02,0.50,-0.130,0.130,0.300,0.325,light);
    box(v,-0.50,-0.02,-0.140,0.140,0.05,0.270,light);
    box(v,-0.49,-0.03,-0.147,0.147,0.175,0.240,glass);
    box(v,-0.50,-0.02,-0.1425,0.1425,0.09,0.125,body);
  }
  return new Float32Array(v);
}

/* ---- T-Shirt ------------------------------------------------------------
   Modellraum: +x rechts, +y oben, +z zum Betrachter. Der Brustdruck ist
   ein eigenes Viereck mit uv — die Textur (Emoji + Motto) liefert tee3d.js.
   ------------------------------------------------------------------------ */
function tee(C){
  var cloth=hexRGB(C.cloth,'#F4F2EE'),
      trim=hexRGB(C.trim,'#DAD6CE'),
      v=[];
  loftY(v,[secY(-0.50,0.325,0.082),secY(-0.26,0.312,0.076),
           secY(0.02,0.322,0.080),secY(0.26,0.352,0.090),
           secY(0.30,0.344,0.088)],cloth);
  // Ärmel: waagerechter Stumpf, nach außen unten gekippt.
  var sl=[];
  hull(sl,[sec(0,0.092,-0.090,0.090),sec(0.20,0.080,-0.076,0.076)],cloth);
  rotZinto(v,sl,-0.30,0.335,0.225,0);
  var sr=[];
  hull(sr,[sec(0,0.092,-0.090,0.090),sec(-0.20,0.080,-0.076,0.076)],cloth);
  rotZinto(v,sr,0.30,-0.335,0.225,0);
  // Kragen: schmaler Bund, fast bündig mit der Schulter, darauf die dunkle
  // Halsöffnung — ein echtes Loch wäre für diese Größe Aufwand ohne Gewinn.
  box(v,-0.120,0.120,0.272,0.316,-0.100,0.100,trim);
  var hole=[0.30,0.29,0.27];
  quad(v,[-0.092,0.3165,0.076],[0.092,0.3165,0.076],
         [0.092,0.3165,-0.076],[-0.092,0.3165,-0.076],hole);
  // Saum
  box(v,-0.330,0.330,-0.525,-0.487,-0.086,0.086,trim);
  // Brustdruck (Textur), minimal vor dem Stoff
  var z=0.0845;
  quad(v,[-0.215,-0.205,z],[0.215,-0.205,z],[0.215,0.195,z],[-0.215,0.195,z],
       cloth,[[0,0],[1,0],[1,1],[0,1]]);
  return new Float32Array(v);
}

/* ---- Shader & Zeichnen --------------------------------------------------- */
var VERT=
  'attribute vec3 a_pos;attribute vec3 a_norm;attribute vec3 a_col;attribute vec2 a_uv;'+
  'uniform mat4 u_matrix;varying vec3 v_col;varying vec3 v_norm;varying vec2 v_uv;'+
  'void main(){v_col=a_col;v_norm=a_norm;v_uv=a_uv;gl_Position=u_matrix*vec4(a_pos,1.0);}';
var FRAG=
  'precision mediump float;varying vec3 v_col;varying vec3 v_norm;varying vec2 v_uv;'+
  'uniform vec3 u_light;uniform sampler2D u_tex;uniform float u_amb;'+
  'void main(){float d=max(dot(normalize(v_norm),normalize(u_light)),0.0);'+
  'vec3 col=v_col;'+
  'if(v_uv.x>=0.0){vec4 t=texture2D(u_tex,v_uv);col=mix(col,t.rgb,t.a);}'+
  'gl_FragColor=vec4(col*(u_amb+(1.10-u_amb)*d),1.0);}';

function shader(gl,type,src){
  var s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);
  if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));
  return s;
}
/* Programm + Attribut-/Uniform-Plätze + 1×1-Ersatztextur in einem Rutsch. */
function program(gl){
  var p=gl.createProgram();
  gl.attachShader(p,shader(gl,gl.VERTEX_SHADER,VERT));
  gl.attachShader(p,shader(gl,gl.FRAGMENT_SHADER,FRAG));
  gl.linkProgram(p);
  if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));
  var blank=gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D,blank);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,
                new Uint8Array([0,0,0,0]));
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  return {prog:p,blank:blank,
    pos:gl.getAttribLocation(p,'a_pos'),norm:gl.getAttribLocation(p,'a_norm'),
    col:gl.getAttribLocation(p,'a_col'),uv:gl.getAttribLocation(p,'a_uv'),
    matrix:gl.getUniformLocation(p,'u_matrix'),light:gl.getUniformLocation(p,'u_light'),
    amb:gl.getUniformLocation(p,'u_amb'),
    tex:gl.getUniformLocation(p,'u_tex')};
}
var STRIDE=11*4;
/* Zeichnet ein Mesh. Alle GL-Zustände werden hier gesetzt — der Aufrufer
   (MapLibre-Custom-Layer!) muss sie danach ggf. wieder aufräumen.          */
function draw(gl,P,buf,count,matrix,light,tex,amb){
  gl.useProgram(P.prog);
  gl.bindBuffer(gl.ARRAY_BUFFER,buf);
  gl.enableVertexAttribArray(P.pos);gl.vertexAttribPointer(P.pos,3,gl.FLOAT,false,STRIDE,0);
  gl.enableVertexAttribArray(P.norm);gl.vertexAttribPointer(P.norm,3,gl.FLOAT,false,STRIDE,12);
  gl.enableVertexAttribArray(P.col);gl.vertexAttribPointer(P.col,3,gl.FLOAT,false,STRIDE,24);
  gl.enableVertexAttribArray(P.uv);gl.vertexAttribPointer(P.uv,2,gl.FLOAT,false,STRIDE,36);
  gl.uniformMatrix4fv(P.matrix,false,new Float32Array(matrix));
  gl.uniform3f(P.light,light[0],light[1],light[2]);
  gl.uniform1f(P.amb,amb===undefined?0.58:amb);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D,tex||P.blank);
  gl.uniform1i(P.tex,0);
  gl.drawArrays(gl.TRIANGLES,0,count);
  gl.disableVertexAttribArray(P.pos);gl.disableVertexAttribArray(P.norm);
  gl.disableVertexAttribArray(P.col);gl.disableVertexAttribArray(P.uv);
}
/* out = a · b, beide spaltenweise (wie MapLibre-Matrizen). */
function mul(a,b){
  var o=new Float64Array(16);
  for(var c=0;c<4;c++)for(var r=0;r<4;r++)
    o[c*4+r]=a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3];
  return o;
}

SB.mesh={hexRGB:hexRGB,quad:quad,box:box,sec:sec,hull:hull,secY:secY,loftY:loftY,
         rotZinto:rotZinto,croissant:croissant,vehicle:vehicle,tee:tee,
         program:program,draw:draw,mul:mul,STRIDE:STRIDE,FLOATS:11};
})();
