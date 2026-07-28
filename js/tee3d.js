/* ==========================================================================
   Engine – 3D-T-Shirt im Inhaltsteil
   Rüstet jeden Abschnitt vom Typ 'tee' auf ein drehendes 3D-Modell um.
   Die gezeichnete SVG-Version aus ui.js bleibt die Rückfallebene: klappt
   WebGL nicht (alte GPU, abgeschaltet), bleibt sie einfach stehen.

   Der Brustdruck (Emoji + Motto) wird in ein Canvas gezeichnet und als
   Textur auf die Vorderseite gelegt — so bleibt der Text scharf und
   inhaltlich in js/trip.js, statt im Modell zu stecken.

   Abschalten pro Trip: sections[i].d3 = false.
   ========================================================================== */
(function(){
'use strict';
var SB=window.SB;
if(!SB||!SB.mesh)return;
var MESH=SB.mesh;

function texture(gl,sec,cloth){
  var S=512,c=document.createElement('canvas');c.width=c.height=S;
  var x=c.getContext('2d');
  function paint(){
    x.clearRect(0,0,S,S);
    x.textAlign='center';
    x.font='196px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
    x.textBaseline='middle';
    x.fillText(sec.emoji||'🥐',S/2,S*0.30);
    x.fillStyle=sec.printColor||'#1B1F26';
    x.font='700 90px Caveat, "Segoe Script", cursive';
    x.fillText(sec.motto1||'',S/2,S*0.62);
    if(sec.motto2)x.fillText(sec.motto2,S/2,S*0.78);
    if(sec.tag){
      x.font='800 26px Inter, system-ui, sans-serif';
      x.globalAlpha=.55;x.fillText(sec.tag,S*0.5,S*0.93);x.globalAlpha=1;
    }
  }
  paint();
  var t=gl.createTexture();
  function upload(){
    gl.bindTexture(gl.TEXTURE_2D,t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,c);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  }
  upload();
  // Schrift kommt oft erst nach dem ersten Zeichnen an → einmal nachlegen.
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){
    paint();upload();if(SB.tee3d&&SB.tee3d.repaint)SB.tee3d.repaint();
  });
  return t;
}

/* Orthografische Ansicht: leicht von oben, langsam um die Hochachse. */
function viewMatrix(angle,aspect){
  var H=0.78,W=H*Math.max(aspect,0.55);
  var ortho=[1/W,0,0,0, 0,1/H,0,0, 0,0,-0.5,0, 0,0.06,0,1];
  var t=0.22,ct=Math.cos(t),st=Math.sin(t);
  var rotX=[1,0,0,0, 0,ct,st,0, 0,-st,ct,0, 0,0,0,1];
  var ca=Math.cos(angle),sa=Math.sin(angle);
  var rotY=[ca,0,-sa,0, 0,1,0,0, sa,0,ca,0, 0,0,0,1];
  return MESH.mul(ortho,MESH.mul(rotX,rotY));
}

function upgrade(host,sec){
  var wrap=host.querySelector('.teewrap');
  if(!wrap)return;
  var svg=wrap.querySelector('svg.tee');
  var cv=document.createElement('canvas');
  cv.className='tee3d';
  cv.setAttribute('role','img');
  cv.setAttribute('aria-label',sec.ariaLabel||'');
  var gl=null;
  try{gl=cv.getContext('webgl',{antialias:true,alpha:true,premultipliedAlpha:false});}catch(e){}
  if(!gl)return;                                  // SVG bleibt stehen

  if(svg)svg.style.display='none';
  wrap.insertBefore(cv,wrap.firstChild);

  var P=MESH.program(gl);
  var mesh=MESH.tee({cloth:sec.cloth,trim:sec.trim,cut:sec.cut,detail:SB.isMobile?0.7:1});
  var count=mesh.length/MESH.FLOATS;
  var buf=gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER,buf);
  gl.bufferData(gl.ARRAY_BUFFER,mesh,gl.STATIC_DRAW);
  var tex=texture(gl,sec,sec.cloth);

  var angle=SB.reduced?-0.5:0,raf=null,last=null,visible=false;
  function size(){
    var r=cv.getBoundingClientRect();
    var dpr=Math.min(window.devicePixelRatio||1,2);
    var w=Math.max(Math.round(r.width*dpr),1),h=Math.max(Math.round(r.height*dpr),1);
    if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h;}
    return r.width/Math.max(r.height,1);
  }
  function frame(){
    var aspect=size();
    gl.viewport(0,0,cv.width,cv.height);
    gl.clearColor(0,0,0,0);gl.clearDepth(1);
    gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    // Licht bleibt im Raum stehen, während sich das Shirt dreht.
    var lw=[-0.45,0.62,0.65],ca=Math.cos(-angle),sa=Math.sin(-angle);
    var lm=[lw[0]*ca+lw[2]*sa, lw[1], -lw[0]*sa+lw[2]*ca];
    MESH.draw(gl,P,buf,count,viewMatrix(angle,aspect),lm,{tex:tex,amb:0.72,spec:0.05});
  }
  function loop(ts){
    raf=null;
    if(last===null)last=ts;
    var dt=Math.min((ts-last)/1000,0.05);last=ts;
    angle+=dt*0.55;
    frame();
    if(visible&&!SB.reduced)raf=requestAnimationFrame(loop);
  }
  function start(){
    if(raf||SB.reduced)return;
    last=null;raf=requestAnimationFrame(loop);
  }
  SB.tee3d={repaint:frame};
  frame();

  // Nur zeichnen, solange das Shirt zu sehen ist — sonst dreht es im Leeren.
  if(window.IntersectionObserver){
    new IntersectionObserver(function(es){
      visible=es[0].isIntersecting;
      if(visible)start();
    },{rootMargin:'80px'}).observe(cv);
  }else{visible=true;start();}
  window.addEventListener('resize',frame,{passive:true});
}

var secs=(SB.trip.sections||[]),blocks=document.querySelectorAll('#content section.block');
secs.forEach(function(sec,i){
  if(sec.type!=='tee'||sec.d3===false)return;
  var host=blocks[i];
  if(host)upgrade(host,sec);
});
})();
