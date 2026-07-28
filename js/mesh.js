/* ==========================================================================
   Engine – 3D-Werkzeugkasten (SB.mesh)
   Gemeinsame Basis für alle 3D-Objekte der Seite: das Fahrzeug auf der
   Karte (js/map.js), das T-Shirt (js/tee3d.js) und die marschierende
   Teekanne (js/teapot.js).

   Bewusst ohne Fremdbibliothek (kein three.js, kein glTF-Download): die
   Formen entstehen als parametrische Flächen — dadurch sind die Kanten
   rund und die Normalen weich statt facettig. Der Detailgrad ist über
   `detail` regelbar: auf der Karte fährt das Fahrzeug bewusst gröber,
   im eigenen Canvas darf es feiner sein.

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
function sgn(v){return v<0?-1:(v>0?1:0);}
function vsub(a,b){return [a[0]-b[0],a[1]-b[1],a[2]-b[2]];}
function vadd(a,b){return [a[0]+b[0],a[1]+b[1],a[2]+b[2]];}
function vmul(a,s){return [a[0]*s,a[1]*s,a[2]*s];}
function vcross(a,b){return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];}
function vlen(a){return Math.sqrt(a[0]*a[0]+a[1]*a[1]+a[2]*a[2]);}
function vnorm(a){var l=vlen(a)||1;return [a[0]/l,a[1]/l,a[2]/l];}
function mix(a,b,t){return a+(b-a)*t;}
function smooth(t){return t<=0?0:(t>=1?1:t*t*(3-2*t));}
/* Superellipse: p=2 rund, große p → immer eckiger. */
function se(a,p){var c=Math.cos(a);return sgn(c)*Math.pow(Math.abs(c),2/p);}
function sez(a,p){var s=Math.sin(a);return sgn(s)*Math.pow(Math.abs(s),2/p);}
/* Detailgrad: Segmentzahlen werden damit skaliert (min. 4). */
var DET=1;
function seg(n){return Math.max(4,Math.round(n*DET));}

/* ---- Parametrische Fläche ------------------------------------------------
   P(u,v) liefert einen Punkt, die Normale kommt aus den Ableitungen —
   deshalb sind alle Rundungen weich schattiert. col(u,v,pos,n) färbt jeden
   Punkt einzeln (so entstehen Fensterbänder & Zierstreifen ohne zusätzliche
   Geometrie), uv(u,v,pos,n) darf Texturkoordinaten liefern oder null.
   opt.openV: v läuft nicht rundherum · opt.flip: Normalen umdrehen.       */
function surface(out,P,NU,NV,col,uv,opt){
  opt=opt||{};
  var eu=0.35/NU,ev=0.35/NV,fl=opt.flip?-1:1,i,j;
  function wrapV(v){return opt.openV?Math.max(0,Math.min(1,v)):(v-Math.floor(v));}
  function nAt(u,v,k){
    var du=vsub(P(Math.min(u+eu*k,1),v),P(Math.max(u-eu*k,0),v));
    var dv=vsub(P(u,wrapV(v+ev*k)),P(u,wrapV(v-ev*k)));
    var n=vcross(dv,du);
    if(vlen(n)<1e-9)return k<9?nAt(u,v,k*3):[0,0,1];   // Pol: weiter ausholen
    n=vnorm(n);
    return [n[0]*fl,n[1]*fl,n[2]*fl];
  }
  var g=[];
  for(i=0;i<=NU;i++){
    g[i]=[];
    for(j=0;j<=NV;j++){
      var u=i/NU,v=j/NV,p=P(u,v),n=nAt(u,v,1);
      var c=col?col(u,v,p,n):[1,1,1],t=uv?uv(u,v,p,n):null;
      g[i][j]=[p[0],p[1],p[2],n[0],n[1],n[2],c[0],c[1],c[2],
               t?t[0]:NO_UV,t?t[1]:NO_UV];
    }
  }
  for(i=0;i<NU;i++)for(j=0;j<NV;j++){
    var q=[g[i][j],g[i+1][j],g[i+1][j+1],g[i][j],g[i+1][j+1],g[i][j+1]],k;
    for(k=0;k<6;k++)out.push.apply(out,q[k]);
  }
}
/* Rotationskörper: prof(t) → [radius, höhe]. */
function revolve(out,prof,NU,NV,col,opt){
  surface(out,function(u,v){
    var r=prof(u),a=v*Math.PI*2;
    return [r[0]*Math.cos(a),r[1],r[0]*Math.sin(a)];
  },NU,NV,col,null,opt);
}
/* Rohr entlang einer Kurve: center(t) → Punkt, rad(t) → Radius oder
   [r1,r2] für ovale Querschnitte. Für Tüllen, Henkel, Ärmel, Beine.      */
function sweep(out,center,rad,up,NU,NV,col,opt){
  function frame(t){
    var e=0.004,a=center(Math.max(t-e,0)),b=center(Math.min(t+e,1));
    var tan=vnorm(vsub(b,a));
    var n1=vcross(up,tan);
    if(vlen(n1)<1e-6)n1=vcross([1,0,0],tan);
    n1=vnorm(n1);
    return [n1,vnorm(vcross(tan,n1))];
  }
  surface(out,function(u,v){
    var c=center(u),f=frame(u),r=rad(u),a=v*Math.PI*2;
    var r1=r.length?r[0]:r,r2=r.length?r[1]:r;
    return vadd(c,vadd(vmul(f[0],Math.cos(a)*r1),vmul(f[1],Math.sin(a)*r2)));
  },NU,NV,col,null,opt);
}
/* Fläche zwischen zwei Ringen (Halsausschnitt, Böden, Bündchen). */
function ring(out,outer,inner,NU,NV,col,opt){
  surface(out,function(u,v){
    var a=outer(v),b=inner(v);
    return [mix(a[0],b[0],u),mix(a[1],b[1],u),mix(a[2],b[2],u)];
  },NU,NV,col,null,opt);
}
/* Kanten für Kleinteile, die keine Rundung brauchen. */
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
/* Kugel/Ellipsoid — Knäufe, Füße, Nieten. */
function ball(out,cx,cy,cz,rx,ry,rz,c,n){
  n=seg(n||14);
  surface(out,function(u,v){
    var th=u*Math.PI,ph=v*Math.PI*2;
    return [cx+rx*Math.sin(th)*Math.cos(ph),cy+ry*Math.cos(th),
            cz+rz*Math.sin(th)*Math.sin(ph)];
  },n,n,function(){return c;},null);
}
/* Werte aus Stützstellen weich interpolieren: keys=[[t,wert],…] */
function curve(keys,t){
  if(t<=keys[0][0])return keys[0][1];
  for(var i=1;i<keys.length;i++)if(t<=keys[i][0]){
    var a=keys[i-1],b=keys[i];
    return mix(a[1],b[1],smooth((t-a[0])/(b[0]-a[0])));
  }
  return keys[keys.length-1][1];
}

/* ---- Croissant ----------------------------------------------------------
   Ein Kreisquerschnitt läuft an einem Bogen entlang, wird zu den Spitzen
   hin dünner und leicht platt gedrückt. Die typischen Wickel entstehen
   über eine schräg umlaufende Radius-Welle — dadurch sitzen die Rippen
   wie beim echten Hörnchen diagonal.                                      */
function croissant(out,crust,toast){
  var ARC=2.70,RC=0.42,R0=0.190,FLAT=0.62,CX=0.33,RIB=6.0,TWIST=0.85;
  function wick(t,v){return Math.cos((RIB*t+TWIST*v)*Math.PI*2);}
  function P(t,v){
    var a=-ARC/2+t*ARC,ca=Math.cos(a),sa=Math.sin(a),ph=v*Math.PI*2;
    var prof=Math.pow(Math.sin(Math.PI*t),0.72);
    var r=R0*(0.09+0.91*prof)*(1+0.070*wick(t,v));
    return [RC*ca-CX+r*ca*Math.cos(ph), RC*sa+r*sa*Math.cos(ph),
            r*Math.sin(ph)*FLAT+R0*0.80];
  }
  surface(out,P,seg(80),seg(26),function(t,v,p,n){
    var prof=Math.pow(Math.sin(Math.PI*t),0.72);
    // Spitzen und Wickelfurchen dunkler gebacken, Oberseite goldener.
    var bake=(0.88+0.12*prof)*(0.93+0.07*wick(t,v));
    var unten=0.5-0.5*n[2];                      // Unterseite kräftiger gebacken
    return [crust[0]*bake+(toast[0]-crust[0])*unten*0.30,
            crust[1]*bake+(toast[1]-crust[1])*unten*0.30,
            crust[2]*bake+(toast[2]-crust[2])*unten*0.30];
  },null,{flip:true});
}

/* ---- ICE -----------------------------------------------------------------
   Ein durchgehender Wagenkasten als Fläche: der Querschnitt ist unten
   flach und oben rund, zu beiden Enden läuft er weich zur Nase zusammen.
   Fensterband, roter Streifen und Schürze entstehen über die Farbfunktion
   statt über zusätzliche Geometrie — dadurch folgen sie der Rundung.      */
function ice(out,C){
  var shell=hexRGB(C.light,'#F4F2EE'),stripe=hexRGB(C.color,'#EC0016'),
      glass=hexRGB(C.glass,'#26313E'),accent=hexRGB(C.accent,'#FFD800'),
      dark=[0.17,0.18,0.20],metal=[0.62,0.63,0.64];
  var PT=3.2,PB=4.6;                             // Dachrundung / Bodenrundung
  function prof(u){
    var t=Math.min(u,1-u)/0.215;                 // 0 an den Spitzen, 1 im Wagen
    var s=t>=1?1:Math.pow(smooth(t),0.46);
    return {x:-0.5+u,hy:0.016+0.126*s,hz:0.020+0.092*s,zc:0.190-0.026*(1-s)};
  }
  function P(u,v,off){
    var pr=prof(u),a=v*Math.PI*2,p=(Math.sin(a)>=0)?PT:PB,k=off||1;
    return [pr.x,se(a,p)*pr.hy*k,pr.zc+sez(a,p)*pr.hz*k];
  }
  surface(out,P,seg(56),seg(26),function(u,v,p,n){
    var pr=prof(u),h=(p[2]-pr.zc)/pr.hz;
    return h<-0.66?dark:shell;                   // Schürze unten
  });
  // Enden schließen
  [0,1].forEach(function(e){
    ring(out,function(v){return P(e,v);},function(){var pr=prof(e);
      return [pr.x+(e?0.010:-0.010),0,pr.zc];},2,seg(26),
      function(){return shell;},{flip:!e});
  });
  /* Zierbänder als eigene, hauchdünn abgehobene Flächen — nur so bleiben
     die Kanten scharf. Höhe h ist auf den Querschnitt bezogen (−1 unten,
     +1 oben), deshalb laufen die Bänder von selbst mit der Nase zusammen. */
  function band(h0,h1,col,side,nu){
    function ang(h){
      var a=Math.asin(sgn(h)*Math.pow(Math.min(Math.abs(h),1),PT/2));
      return side>0?a:(Math.PI-a);
    }
    var a0=ang(h0),a1=ang(h1);
    surface(out,function(u,v){
      var pr=prof(u),a=mix(a0,a1,v);
      return [pr.x,se(a,PT)*pr.hy*1.007,pr.zc+sez(a,PT)*pr.hz*1.007];
    },seg(nu||56),seg(5),function(){return col;},null,{openV:true});
  }
  [1,-1].forEach(function(side){
    band(0.02,0.17,stripe,side);                // roter Zierstreifen
    band(0.21,0.74,glass,side);                  // Fensterband
  });
  // Spitzenlichter: kurze helle Felder ganz vorn
  function lamp(u0,u1,side){
    surface(out,function(u,v){
      var pr=prof(mix(u0,u1,u)),a=mix(-0.62,-0.16,v);
      a=side>0?a:(Math.PI-a);
      return [pr.x,se(a,PT)*pr.hy*1.010,pr.zc+sez(a,PT)*pr.hz*1.010];
    },4,4,function(){return accent;},null,{openV:true});
  }
  lamp(0.972,0.996,1);lamp(0.972,0.996,-1);
  box(out,-0.455,0.455,-0.112,0.112,0.000,0.060,dark);             // Untergestell
  box(out,-0.31,-0.23,-0.100,0.100,0.000,0.030,[0.10,0.10,0.11]);  // Drehgestelle
  box(out,0.23,0.31,-0.100,0.100,0.000,0.030,[0.10,0.10,0.11]);
  box(out,-0.115,0.020,-0.026,0.026,0.278,0.290,dark);             // Stromabnehmer
  sweep(out,function(t){return [mix(-0.10,0.03,t),0,mix(0.290,0.336,t)];},
        function(){return 0.008;},[0,1,0],4,seg(8),function(){return metal;});
  box(out,-0.02,0.05,-0.058,0.058,0.334,0.344,metal);
}

/* ---- Fahrzeuge ----------------------------------------------------------
   Modellraum: +x = Fahrtrichtung, +z = oben, Gesamtlänge 1.               */
function vehicle(kind,C){
  C=C||{};
  DET=C.detail||1;
  var body=hexRGB(C.color,'#EC0016'),accent=hexRGB(C.accent,'#FFD800'),
      glass=hexRGB(C.glass,'#26313E'),light=hexRGB(C.light,'#F2F0EA'),
      dark=[0.16,0.17,0.19],v=[];
  if(kind==='croissant')croissant(v,hexRGB(C.crust,'#F2B863'),hexRGB(C.toast,'#C07C34'));
  else if(kind==='ice')ice(v,C);
  else if(kind==='bus'){
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
  DET=1;
  return new Float32Array(v);
}

/* ---- T-Shirt ------------------------------------------------------------
   Modellraum: +x rechts, +y oben, +z zum Betrachter.
   cut:'women' (Standard) → tailliert, leicht ausgestellter Saum, kurze
   Cap-Sleeves und ein runder Ausschnitt, der vorn tiefer sitzt.
   cut:'unisex' → gerader Schnitt. Der Brustdruck liegt als uv auf der
   Vorderseite und folgt damit der Wölbung des Stoffs.                     */
function tee(C){
  C=C||{};
  DET=C.detail||1;
  var cloth=hexRGB(C.cloth,'#F4F2EE'),trim=hexRGB(C.trim,'#E2DED6'),v=[];
  var women=(C.cut||'women')!=='unisex';
  var HEM=-0.46,SHO=0.28,PW=2.7;
  var wKeys=women
    ?[[HEM,0.290],[-0.30,0.246],[-0.12,0.220],[0.04,0.252],[0.17,0.266],[SHO,0.282]]
    :[[HEM,0.300],[-0.30,0.296],[-0.12,0.296],[0.04,0.302],[0.17,0.310],[SHO,0.318]];
  var dKeys=women
    ?[[HEM,0.088],[-0.30,0.074],[-0.12,0.066],[0.04,0.088],[0.17,0.082],[SHO,0.072]]
    :[[HEM,0.086],[-0.30,0.082],[-0.12,0.080],[0.04,0.086],[0.17,0.086],[SHO,0.080]];
  function hx(y){return curve(wKeys,y);}
  function hz(y){return curve(dKeys,y);}
  function shell(y,a,k){k=k===undefined?1:k;
    return [se(a,PW)*hx(y)*k,y,sez(a,PW)*hz(y)*k];}

  /* Brustdruck: die uv laufen durchgehend über den ganzen Umfang. Nur
     im vorderen Fenster liegen sie in [0,1] — außerhalb greift
     CLAMP_TO_EDGE auf den durchsichtigen Rand der Textur, deshalb gibt es
     keine ausgefransten Kanten (die entstünden, wenn man an der Grenze
     zwischen „Textur“ und „keine Textur“ interpolieren müsste).          */
  var PV=0.148,PY0=-0.150,PY1=0.190;
  surface(v,function(u,v2){return shell(mix(HEM,SHO,u),v2*Math.PI*2);},
    seg(36),seg(44),function(){return cloth;},
    function(u,v2,p){
      return [1-(v2-(0.25-PV))/(2*PV),(p[1]-PY0)/(PY1-PY0)];
    },{flip:true});
  // Saum: eingeschlagenes Bündchen, damit unten keine offene Kante steht.
  ring(v,function(v2){return shell(HEM,v2*Math.PI*2);},
         function(v2){return shell(HEM,v2*Math.PI*2,0.86);},
       3,seg(44),function(){return trim;},{flip:true});

  /* Schulterpartie: vom oberen Rumpfring zum Halsausschnitt, der vorn
     tiefer sitzt — das macht den runden Damen-Ausschnitt.                */
  var NRX=women?0.100:0.106,NRZ=women?0.064:0.068;
  ring(v,function(v2){return shell(SHO,v2*Math.PI*2);},
    function(v2){
      var a=v2*Math.PI*2,s=Math.sin(a);
      return [NRX*Math.cos(a),SHO+0.046-(women?0.062:0.042)*Math.max(0,s),NRZ*s];
    },seg(8),seg(44),function(u){return u>0.82?trim:cloth;},{flip:true});

  /* Cap-Sleeves: kurzes, nach außen unten laufendes Rohr. */
  var SL=women?0.150:0.200;
  [1,-1].forEach(function(side){
    var x0=side*(hx(0.21)-0.014);
    sweep(v,function(t){return [x0+side*SL*t,0.212-0.118*t*t-0.028*t,0];},
      function(t){return [0.086-0.020*t,0.080-0.015*t];},[0,1,0],
      seg(10),seg(24),function(t){return t>0.88?trim:cloth;});
  });
  DET=1;
  return new Float32Array(v);
}

/* ---- Teekanne -----------------------------------------------------------
   In Teile zerlegt, damit Beine, Deckel und Löffel einzeln wackeln können.
   Jedes Teil bringt seinen Drehpunkt mit; js/teapot.js setzt sie in Bewegung.
   Modellraum: Standfläche bei y=0, Laufrichtung +x.                       */
function teapot(C){
  C=C||{};
  DET=C.detail||1;
  var pot=hexRGB(C.color,'#7FC6E8'),
      dark=hexRGB(C.shade,'#59A6CE'),
      trim=hexRGB(C.trim,'#2E6F97'),
      metal=[0.82,0.84,0.87];
  // Unten etwas abgedunkelt — das gibt der Kanne Volumen.
  function belly(u,v,p){
    var k=0.82+0.18*Math.min(Math.max(p[1]/0.55,0),1);
    return [pot[0]*k,pot[1]*k,pot[2]*k];
  }
  var R=[[0,0.150],[0.05,0.208],[0.13,0.268],[0.24,0.302],[0.34,0.292],
         [0.44,0.244],[0.52,0.190],[0.560,0.176]];
  var body=[];
  revolve(body,function(u){var y=u*0.560;return [curve(R,y),y];},
          seg(30),seg(30),belly,{flip:true});
  ring(body,function(v){var a=v*Math.PI*2;return [0.150*Math.cos(a),0,0.150*Math.sin(a)];},
       function(){return [0,0.014,0];},2,seg(30),function(){return trim;});
  revolve(body,function(u){return [mix(0.176,0.196,Math.sin(u*Math.PI)),0.560+u*0.026];},
          4,seg(30),function(){return trim;},{flip:true});   // Deckelsitz
  sweep(body,function(t){                                    // Tülle
    return [mix(0.17,0.470,t)+0.055*Math.sin(t*Math.PI),
            mix(0.235,0.487,t)+0.045*Math.sin(t*Math.PI),0];
  },function(t){return [0.084-0.050*t,0.080-0.048*t];},[0,0,1],
    seg(16),seg(20),belly);
  sweep(body,function(t){                                    // Henkel
    var a=Math.PI*(-0.46+t*0.92);
    return [-0.205-0.150*Math.cos(a),0.330+0.175*Math.sin(a),0];
  },function(){return 0.031;},[0,0,1],seg(18),seg(14),function(){return dark;});

  var lid=[];
  revolve(lid,function(u){
    return [curve([[0,0.200],[0.28,0.186],[0.62,0.126],[1,0.028]],u),0.588+u*0.070];
  },seg(12),seg(30),function(){return pot;},{flip:true});
  ball(lid,0,0.674,0,0.040,0.044,0.040,trim,12);

  var spoon=[];
  sweep(spoon,function(t){return [mix(-0.06,0.20,t),mix(0.58,0.83,t),0];},
        function(){return 0.013;},[0,0,1],seg(6),seg(10),function(){return metal;});
  ball(spoon,0.225,0.855,0,0.052,0.022,0.038,metal,12);

  function leg(side){
    var l=[];
    sweep(l,function(t){return [0.018*t,-t*0.185,side*0.082];},
          function(t){return 0.044-0.014*t;},[1,0,0],seg(6),seg(12),
          function(){return dark;});
    ball(l,0.034,-0.194,side*0.082,0.076,0.038,0.054,trim,12);
    return {name:'leg',verts:new Float32Array(l),pivot:[0,0.02,side*0.082]};
  }
  var parts=[{name:'body',verts:new Float32Array(body),pivot:[0,0,0]},
             {name:'lid',verts:new Float32Array(lid),pivot:[0,0.588,0]},
             {name:'spoon',verts:new Float32Array(spoon),pivot:[0,0.60,0]},
             leg(1),leg(-1)];
  DET=1;
  return {parts:parts};
}

/* ---- Shader & Zeichnen --------------------------------------------------- */
var VERT=
  'attribute vec3 a_pos;attribute vec3 a_norm;attribute vec3 a_col;attribute vec2 a_uv;'+
  'uniform mat4 u_matrix;varying vec3 v_col;varying vec3 v_norm;varying vec2 v_uv;'+
  'void main(){v_col=a_col;v_norm=a_norm;v_uv=a_uv;gl_Position=u_matrix*vec4(a_pos,1.0);}';
var FRAG=
  'precision mediump float;varying vec3 v_col;varying vec3 v_norm;varying vec2 v_uv;'+
  'uniform vec3 u_light;uniform sampler2D u_tex;uniform float u_amb;uniform float u_spec;'+
  'void main(){vec3 n=normalize(v_norm);vec3 l=normalize(u_light);'+
  'float d=max(dot(n,l),0.0);'+
  'float sp=pow(max(dot(reflect(-l,n),vec3(0.0,0.0,1.0)),0.0),20.0)*u_spec;'+
  'vec3 col=v_col;'+
  'if(v_uv.x>=0.0){vec4 t=texture2D(u_tex,v_uv);col=mix(col,t.rgb,t.a);}'+
  'gl_FragColor=vec4(col*(u_amb+(1.10-u_amb)*d)+sp,1.0);}';

function shader(gl,type,src){
  var s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);
  if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));
  return s;
}
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
    amb:gl.getUniformLocation(p,'u_amb'),spec:gl.getUniformLocation(p,'u_spec'),
    tex:gl.getUniformLocation(p,'u_tex')};
}
var STRIDE=11*4;
/* Zeichnet ein Mesh. Alle GL-Zustände werden hier gesetzt — der Aufrufer
   (MapLibre-Custom-Layer!) muss sie danach ggf. wieder aufräumen.
   opt: {tex, amb, spec}                                                   */
function draw(gl,P,buf,count,matrix,light,opt){
  opt=opt||{};
  gl.useProgram(P.prog);
  gl.bindBuffer(gl.ARRAY_BUFFER,buf);
  gl.enableVertexAttribArray(P.pos);gl.vertexAttribPointer(P.pos,3,gl.FLOAT,false,STRIDE,0);
  gl.enableVertexAttribArray(P.norm);gl.vertexAttribPointer(P.norm,3,gl.FLOAT,false,STRIDE,12);
  gl.enableVertexAttribArray(P.col);gl.vertexAttribPointer(P.col,3,gl.FLOAT,false,STRIDE,24);
  gl.enableVertexAttribArray(P.uv);gl.vertexAttribPointer(P.uv,2,gl.FLOAT,false,STRIDE,36);
  gl.uniformMatrix4fv(P.matrix,false,new Float32Array(matrix));
  gl.uniform3f(P.light,light[0],light[1],light[2]);
  gl.uniform1f(P.amb,opt.amb===undefined?0.58:opt.amb);
  gl.uniform1f(P.spec,opt.spec===undefined?0.12:opt.spec);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D,opt.tex||P.blank);
  gl.uniform1i(P.tex,0);
  gl.drawArrays(gl.TRIANGLES,0,count);
  gl.disableVertexAttribArray(P.pos);gl.disableVertexAttribArray(P.norm);
  gl.disableVertexAttribArray(P.col);gl.disableVertexAttribArray(P.uv);
}

/* ---- Matrizen (spaltenweise, wie MapLibre) -------------------------------- */
function mul(a,b){
  var o=new Float64Array(16);
  for(var c=0;c<4;c++)for(var r=0;r<4;r++)
    o[c*4+r]=a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3];
  return o;
}
var mat={
  ident:function(){return [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];},
  trans:function(x,y,z){return [1,0,0,0, 0,1,0,0, 0,0,1,0, x,y,z,1];},
  scale:function(x,y,z){return [x,0,0,0, 0,y,0,0, 0,0,z,0, 0,0,0,1];},
  rotX:function(a){var c=Math.cos(a),s=Math.sin(a);
    return [1,0,0,0, 0,c,s,0, 0,-s,c,0, 0,0,0,1];},
  rotY:function(a){var c=Math.cos(a),s=Math.sin(a);
    return [c,0,-s,0, 0,1,0,0, s,0,c,0, 0,0,0,1];},
  rotZ:function(a){var c=Math.cos(a),s=Math.sin(a);
    return [c,s,0,0, -s,c,0,0, 0,0,1,0, 0,0,0,1];},
  ortho:function(hw,hh,hd){return [1/hw,0,0,0, 0,1/hh,0,0, 0,0,-1/hd,0, 0,0,0,1];},
  chain:function(){var m=arguments[0];
    for(var i=1;i<arguments.length;i++)m=mul(m,arguments[i]);
    return m;}
};
/* Teil um seinen eigenen Drehpunkt bewegen: hin, drehen, zurück. */
function chainPivot(base,pivot,rot){
  return mul(base,mul(mat.trans(pivot[0],pivot[1],pivot[2]),
             mul(rot,mat.trans(-pivot[0],-pivot[1],-pivot[2]))));
}

SB.mesh={hexRGB:hexRGB,surface:surface,revolve:revolve,sweep:sweep,ring:ring,
         box:box,ball:ball,curve:curve,croissant:croissant,ice:ice,
         vehicle:vehicle,tee:tee,teapot:teapot,
         program:program,draw:draw,mul:mul,mat:mat,chainPivot:chainPivot,
         STRIDE:STRIDE,FLOATS:11};
})();
