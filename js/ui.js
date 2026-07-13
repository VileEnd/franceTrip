/* ==========================================================================
   SenfBahn – UI: Story-Karten, Schreibmaschine, Toast, Deko & RSVP
   Braucht: js/data.js (SB.config, SB.scenes, SB.reduced, SB.isMobile)
   Stellt bereit: SB.startType(i), SB.showToast(msg), SB.crumbRain(n)
   ========================================================================== */
(function(){
'use strict';
var SB=window.SB;
var SC=SB.scenes;

/* ---- Spacer: Gesamt-Scrollhöhe der Story ------------------------------------ */
document.getElementById('spacer').style.height=(SB.N*SB.config.SCENE_VH)+'vh';

/* ---- Schwebende Emojis in Hero & RSVP (auf Phones weniger) ------------------- */
if(!SB.reduced){
  ['#hero','#rsvp'].forEach(function(sel){
    var host=document.querySelector(sel), set=['🥐','🌿','🧈','🥖','🍲','🌿','🥐'];
    var n=SB.isMobile?4:9;
    for(var i=0;i<n;i++){
      var f=document.createElement('div');f.className='floaty';
      f.textContent=set[i%set.length];
      f.style.left=(5+Math.random()*90)+'%';f.style.bottom='-8vh';
      f.style.animationDuration=(14+Math.random()*16)+'s';
      f.style.animationDelay=(-Math.random()*20)+'s';
      f.style.fontSize=(1.1+Math.random()*1.2)+'rem';
      host.appendChild(f);
    }
  });
}

/* ---- Story-Karten bauen; jedes Wort in ein .tw-Span für den Wort-Fade -------- */
var cardsBox=document.getElementById('cards');
SC.forEach(function(s,i){
  var el=document.createElement('div');el.className='scard';el.id='card'+i;
  var chips=s.ch?'<div class="chips">'+s.ch.map(function(c){return '<span class="chip">'+c+'</span>'}).join('')+'</div>':'';
  el.innerHTML='<span class="badge '+s.cls+'">'+s.badge+'</span>'+
    '<h2><span class="h2t"></span><span class="caret"></span></h2>'+
    '<div class="witz">'+s.w+'</div><div class="txt">'+s.x+'</div>'+chips+
    '<span class="kost'+(s.frei?' frei':'')+'">'+s.k+'</span>';
  cardsBox.appendChild(el);
  ['.witz','.txt'].forEach(function(sel){
    var box=el.querySelector(sel);
    (function wrap(node){
      Array.prototype.slice.call(node.childNodes).forEach(function(ch){
        if(ch.nodeType===3){
          var fragment=document.createDocumentFragment();
          ch.textContent.split(/(\s+)/).forEach(function(tok){
            if(tok.trim()===''){fragment.appendChild(document.createTextNode(tok));}
            else{var sp=document.createElement('span');sp.className='tw';sp.textContent=tok;fragment.appendChild(sp);}
          });
          node.replaceChild(fragment,ch);
        } else if(ch.nodeType===1){wrap(ch);}
      });
    })(box);
  });
});

/* ---- Schreibmaschine: Titel tippen, dann Wörter einblenden -------------------- */
var typeTimers=[];
function clearType(){typeTimers.forEach(clearTimeout);typeTimers=[];}
SB.startType=function(i){
  clearType();
  var el=document.getElementById('card'+i),s=SC[i];
  var h=el.querySelector('.h2t'),caret=el.querySelector('.caret');
  h.textContent='';caret.style.display='inline-block';
  el.querySelectorAll('.tw').forEach(function(w){w.classList.remove('an')});
  el.querySelector('.chips')&&el.querySelector('.chips').classList.remove('an');
  el.querySelector('.kost').classList.remove('an');
  if(SB.reduced){ h.textContent=s.t;caret.style.display='none';
    el.querySelectorAll('.tw').forEach(function(w){w.classList.add('an')});
    el.querySelector('.chips')&&el.querySelector('.chips').classList.add('an');
    el.querySelector('.kost').classList.add('an');return;}
  var title=s.t,ci=0;
  (function tick(){
    if(ci<=title.length){h.textContent=title.slice(0,ci);ci++;typeTimers.push(setTimeout(tick,34));}
    else{caret.style.display='none';words();}
  })();
  function words(){
    var ws=el.querySelectorAll('.tw'),wi=0;
    (function wtick(){
      if(wi<ws.length){ws[wi].classList.add('an');wi++;typeTimers.push(setTimeout(wtick,42));}
      else{
        typeTimers.push(setTimeout(function(){
          el.querySelector('.chips')&&el.querySelector('.chips').classList.add('an');
          el.querySelector('.kost').classList.add('an');
        },250));
      }
    })();
  }
};

/* ---- Toast -------------------------------------------------------------------- */
var toast=document.getElementById('toast');
SB.showToast=function(msg){
  if(!toast)return;
  toast.textContent=msg;toast.classList.add('show');
  clearTimeout(SB.showToast._t);
  SB.showToast._t=setTimeout(function(){toast.classList.remove('show');},3400);
};

/* ---- Krümel-Regen (Logo-Easter-Egg & RSVP-Feier) -------------------------------- */
SB.crumbRain=function(count,icons,stepMs){
  if(SB.reduced)return;
  icons=icons||['🥐','🥐','🧈','🥖'];
  for(var i=0;i<count;i++){(function(i){setTimeout(function(){
    var c=document.createElement('div');c.className='crumb';
    c.textContent=icons[Math.floor(Math.random()*icons.length)];
    c.style.left=(Math.random()*96)+'vw';
    c.style.animationDuration=(2+Math.random()*2.6)+'s';
    document.body.appendChild(c);setTimeout(function(){c.remove()},5600);
  },i*(stepMs||90))})(i);}
};

var logoEl=document.getElementById('logo');
if(logoEl){
  logoEl.addEventListener('keydown',function(e){
    if(e.key==='Enter'||e.key===' '){e.preventDefault();logoEl.click();}
  });
  logoEl.addEventListener('click',function(){SB.crumbRain(9,null,70);});
}

/* ---- RSVP: Mail im Reise-Ton ------------------------------------------------------ */
function mailtoUrl(variante){
  var subject=variante+' — ich steig ein (SenfBahn SB 143)';
  var body=[
    'Hallo,','',
    variante+'. Ich komm mit — Nürnberg, Elsass, Burgund. Zwei Plätze,',
    'auf deinem liegt schon ein Croissant.','',
    'Croissant du matin, tout va bien. Der Rest steht in der Karte,',
    'die du gerade gesehen hast.','',
    'Meine drei Bedingungen (nicht verhandelbar, aber charmant):',
    '  1. Den Fensterplatz teilen wir uns — abtreten gilt nicht.',
    '  2. Der Rosmarin-Topf fährt im Handgepäck mit. Frag nicht.',
    '  3. Beim Rheinübergang läuft „La vie en rose". Einmal. Mindestens.','',
    'Sag mir nur, wann wir die TGV-Sparpreise buchen (ab 29 € —',
    'die sind schneller weg als ein warmes Pain au Chocolat).','',
    'À bientôt — und ja, an die Croissants hab ich gedacht.'
  ].join('\n');
  return 'mailto:'+encodeURIComponent(SB.config.EMAIL_AN)+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
}
function feiern(variante){
  document.getElementById('ja1').style.display='none';
  document.getElementById('ja2').style.display='none';
  document.getElementById('rsvpdone').style.display='block';
  SB.crumbRain(34,['🥐','🌿','🧈','🥖','🍲','🧃','🥐','🌿'],90);
  setTimeout(function(){window.location.href=mailtoUrl(variante);},700);
}
document.getElementById('ja1').addEventListener('click',function(){feiern('Ja')});
document.getElementById('ja2').addEventListener('click',function(){feiern('Sehr gerne')});
})();
