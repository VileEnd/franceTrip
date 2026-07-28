/* ==========================================================================
   Engine – marschierende Teekanne
   Eine kleine 3D-Teekanne, die von links nach rechts durchs Bild stapft:
   Beine schwingen im Wechsel, der Körper wippt, der Deckel hüpft und der
   Löffel wackelt hinterher.

   Sie wird an zwei Stellen eingehängt (trip.teapot.where):
     'loading' → während die Karte lädt
     'end'     → am Seitenende über dem Impressum
   trip.teapot = null schaltet sie ganz ab. Ohne WebGL passiert nichts,
   der bisherige Text bleibt dann einfach stehen.
   ========================================================================== */
(function(){
'use strict';
var SB=window.SB;
if(!SB||!SB.mesh)return;
var MESH=SB.mesh,mat=MESH.mat;
var T=SB.trip.teapot;
if(T===null||T===false)return;
T=T||{};
var WHERE=T.where||['loading','end'];

function mount(host,height,klass){
  var cv=document.createElement('canvas');
  cv.className='teapotwalk'+(klass?' '+klass:'');
  cv.setAttribute('aria-hidden','true');
  var gl=null;
  try{gl=cv.getContext('webgl',{antialias:true,alpha:true,premultipliedAlpha:false});}catch(e){}
  if(!gl)return null;
  host.insertBefore(cv,host.firstChild);

  var P=MESH.program(gl);
  var pot=MESH.teapot({color:T.color,shade:T.shade,trim:T.trim,
                       detail:SB.isMobile?0.6:0.85});
  var parts=pot.parts.map(function(p){
    var b=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,b);
    gl.bufferData(gl.ARRAY_BUFFER,p.verts,gl.STATIC_DRAW);
    return {name:p.name,pivot:p.pivot,buf:b,count:p.verts.length/MESH.FLOATS};
  });

  var t=0,raf=null,last=null,visible=true;
  var SPEED=T.speed||0.34;          // Bilddurchläufe pro Sekunde
  var STEP=T.step||2.1;             // Schritte pro Durchlauf-Einheit

  function size(){
    var r=cv.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2);
    var w=Math.max(Math.round(r.width*dpr),1),h=Math.max(Math.round(r.height*dpr),1);
    if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h;}
    return r.width/Math.max(r.height,1);
  }
  function frame(){
    var aspect=size(),H=0.62,W=H*Math.max(aspect,0.6);
    gl.viewport(0,0,cv.width,cv.height);
    gl.clearColor(0,0,0,0);gl.clearDepth(1);
    gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);

    var gait=t*STEP*Math.PI*2;                 // Schrittphase
    var walk=-(W+0.42)+((t%1)*(2*W+0.84));     // läuft durchs Bild und wieder rein
    var bob=0.030*Math.abs(Math.sin(gait));
    var lean=0.05+0.035*Math.sin(gait*2);

    var view=MESH.mul(mat.ortho(W,H,4),
             MESH.mul(mat.rotX(0.20),mat.rotY(-0.62)));
    var base=MESH.mul(view,MESH.mul(mat.trans(walk,-0.34+bob,0),mat.rotZ(-lean*0.25)));

    var lw=[-0.42,0.66,0.62];
    var legIdx=0;
    for(var i=0;i<parts.length;i++){
      var p=parts[i],m=base;
      if(p.name==='leg'){
        var swing=Math.sin(gait+(legIdx?Math.PI:0))*0.62;
        m=MESH.chainPivot(base,p.pivot,mat.rotZ(swing));
        legIdx++;
      }else if(p.name==='lid'){
        var hop=0.022*Math.max(0,Math.sin(gait*2));
        m=MESH.mul(base,MESH.mul(mat.trans(0,hop,0),mat.rotZ(0.10*Math.sin(gait))));
      }else if(p.name==='spoon'){
        m=MESH.chainPivot(base,p.pivot,mat.rotZ(-0.34*Math.sin(gait-0.7)));
      }
      MESH.draw(gl,P,p.buf,p.count,m,lw,{amb:0.74,spec:0.22});
    }
  }
  function loop(ts){
    raf=null;
    if(last===null)last=ts;
    t+=Math.min((ts-last)/1000,0.05)*SPEED;last=ts;
    frame();
    if(visible&&!SB.reduced&&!host.classList.contains('aus'))raf=requestAnimationFrame(loop);
  }
  function start(){if(!raf&&!SB.reduced){last=null;raf=requestAnimationFrame(loop);}}
  frame();
  if(window.IntersectionObserver){
    new IntersectionObserver(function(es){
      visible=es[0].isIntersecting;if(visible)start();
    },{rootMargin:'60px'}).observe(cv);
  }else start();
  window.addEventListener('resize',frame,{passive:true});
  return cv;
}

if(WHERE.indexOf('loading')>-1){
  var loading=document.getElementById('loading');
  if(loading)mount(loading,0,'klein');
}
if(WHERE.indexOf('end')>-1){
  var foot=document.getElementById('footer');
  if(foot){
    var wrap=document.createElement('div');
    wrap.className='teapotend';
    if(T.caption)wrap.innerHTML='<p class="teacap">'+T.caption+'</p>';
    foot.insertBefore(wrap,foot.firstChild);
    mount(wrap,0);
  }
}
})();
