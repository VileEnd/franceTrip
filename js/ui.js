/* ==========================================================================
   Engine – UI: rendert ALLES aus SB.trip (Topbar-Texte, Hero, Story-Karten,
   Inhaltsblöcke, RSVP, Footer) + Schreibmaschine, Toast, Krümel-Regen.
   Enthält keinerlei Trip-Texte — die stehen komplett in js/trip.js.
   ========================================================================== */
(function(){
'use strict';
var SB=window.SB;
var trip=SB.trip,SC=SB.scenes;

function el(tag,cls,html){
  var n=document.createElement(tag);
  if(cls)n.className=cls;
  if(html!==undefined)n.innerHTML=html;
  return n;
}

/* ---- Topbar: Marke & Ticker-Label ------------------------------------------- */
var logoEl=document.getElementById('logo');
if(logoEl&&trip.meta.brand){
  logoEl.textContent=trip.meta.brand.abbr||'♥';
  if(trip.meta.brand.logoTitle)logoEl.title=trip.meta.brand.logoTitle;
}
var clEl=document.querySelector('#topbar .cl');
if(clEl)clEl.textContent=(trip.meta.brand&&trip.meta.brand.tagline)||'';
var tickerL=document.querySelector('#ticker .l');
if(tickerL)tickerL.textContent=SB.config.tickerLabel;

/* ---- Hero --------------------------------------------------------------------- */
var hero=document.getElementById('hero');
hero.innerHTML=
  '<div class="ey">'+trip.hero.eyebrow+'</div>'+
  '<h1>'+trip.hero.title+'</h1>'+
  '<p class="sub">'+trip.hero.sub+'</p>'+
  '<div class="kicker2">'+trip.hero.kicker+'</div>'+
  '<div class="scrollhint">'+trip.hero.scrollhint+'</div>';

/* ---- Spacer: Gesamt-Scrollhöhe der Story --------------------------------------- */
document.getElementById('spacer').style.height=(SB.N*SB.config.sceneVh)+'vh';

/* ---- Schwebende Emojis in Hero & RSVP (auf Phones weniger) --------------------- */
if(!SB.reduced){
  var floatSet=trip.hero.floaties||['✨'];
  ['#hero','#rsvp'].forEach(function(sel){
    var host=document.querySelector(sel);
    var n=SB.isMobile?4:9;
    for(var i=0;i<n;i++){
      var f=el('div','floaty');
      f.textContent=floatSet[i%floatSet.length];
      f.style.left=(5+Math.random()*90)+'%';f.style.bottom='-8vh';
      f.style.animationDuration=(14+Math.random()*16)+'s';
      f.style.animationDelay=(-Math.random()*20)+'s';
      f.style.fontSize=(1.1+Math.random()*1.2)+'rem';
      host.appendChild(f);
    }
  });
}

/* ---- Story-Karten bauen; jedes Wort in ein .tw-Span für den Wort-Fade ---------- */
var cardsBox=document.getElementById('cards');
SC.forEach(function(s,i){
  var card=el('div','scard');card.id='card'+i;
  var chips=s.ch?'<div class="chips">'+s.ch.map(function(c){return '<span class="chip">'+c+'</span>'}).join('')+'</div>':'';
  var fakt=s.fact?'<div class="fakt">💡 '+s.fact+'</div>':'';
  card.innerHTML='<span class="badge '+s.cls+'">'+s.badge+'</span>'+
    '<h2><span class="h2t"></span><span class="caret"></span></h2>'+
    '<div class="witz">'+s.w+'</div><div class="txt">'+s.x+'</div>'+fakt+chips+
    '<span class="kost'+(s.frei?' frei':'')+'">'+s.k+'</span>';
  cardsBox.appendChild(card);
  ['.witz','.txt'].forEach(function(sel){
    var box=card.querySelector(sel);
    (function wrap(node){
      Array.prototype.slice.call(node.childNodes).forEach(function(ch){
        if(ch.nodeType===3){
          var fragment=document.createDocumentFragment();
          ch.textContent.split(/(\s+)/).forEach(function(tok){
            if(tok.trim()===''){fragment.appendChild(document.createTextNode(tok));}
            else{var sp=el('span','tw');sp.textContent=tok;fragment.appendChild(sp);}
          });
          node.replaceChild(fragment,ch);
        } else if(ch.nodeType===1){wrap(ch);}
      });
    })(box);
  });
});

/* ---- Inhaltsblöcke nach der Karte (aus trip.sections) --------------------------- */
function buildPrice(sec){
  var box=el('div','preis');
  var cols=sec.cols||['','',''];
  var rows=sec.rows.map(function(r){
    return '<tr'+(r.free?' class="frei"':'')+'><td>'+r.label+'</td><td>'+r.product+'</td><td class="p">'+r.price+'</td></tr>';
  }).join('');
  box.innerHTML='<table><thead><tr><th>'+cols[0]+'</th><th>'+cols[1]+'</th><th style="text-align:right">'+cols[2]+'</th></tr></thead>'+
    '<tbody>'+rows+
    '<tr class="summe"><td colspan="2">'+sec.total.label+'</td><td class="p">'+sec.total.price+'</td></tr></tbody></table>'+
    (sec.budget?'<div class="budgetbar"><div class="fill" style="width:'+sec.budget.pct+'%"></div><span>'+sec.budget.text+'</span></div>':'');
  return box;
}
function buildCards(sec){
  var g=el('div','hgrid');
  sec.items.forEach(function(it){
    g.appendChild(el('div','hcard',
      '<span class="ort">'+it.tag+'</span><h4>'+it.title+'</h4><p>'+it.html+'</p>'+
      (it.price?'<p class="pr">'+it.price+'</p>':'')));
  });
  return g;
}
function buildTee(sec){
  var w=el('div','teewrap');
  w.innerHTML=
    '<svg class="tee" viewBox="0 0 400 430" role="img" aria-label="'+(sec.ariaLabel||'')+'">'+
      '<path class="shirt" d="M132,44 C160,78 240,78 268,44 L330,62 L364,128 L314,156 L300,134 L300,388 Q300,398 290,398 L110,398 Q100,398 100,388 L100,134 L86,156 L36,128 L70,62 Z"/>'+
      '<path class="collar" d="M150,52 C176,80 224,80 250,52"/>'+
      (sec.tag?'<text class="tag" x="243" y="120" text-anchor="middle">'+sec.tag+'</text>':'')+
      '<text x="200" y="232" text-anchor="middle" font-size="78">'+(sec.emoji||'🥐')+'</text>'+
      '<text class="teetxt" x="200" y="286" text-anchor="middle">'+sec.motto1+'</text>'+
      (sec.motto2?'<text class="teetxt" x="200" y="312" text-anchor="middle">'+sec.motto2+'</text>':'')+
    '</svg>'+
    (sec.caption?'<div class="teecap">'+sec.caption+'</div>':'');
  return w;
}
var contentHost=document.getElementById('content');
(trip.sections||[]).forEach(function(sec){
  var s=el('section','block');
  if(sec.bg==='hell')s.style.background='var(--hell)';
  var wrap=el('div','wrap');s.appendChild(wrap);
  if(sec.title)wrap.appendChild(el('h3','bh',sec.title));
  if(sec.sub)wrap.appendChild(el('p','bs',sec.sub));
  if(sec.type==='price')wrap.appendChild(buildPrice(sec));
  else if(sec.type==='cards')wrap.appendChild(buildCards(sec));
  else if(sec.type==='tee')wrap.appendChild(buildTee(sec));
  else if(sec.type==='html')wrap.appendChild(el('div','',sec.html));
  contentHost.appendChild(s);
});

/* ---- Live-Handschrift: Titel Buchstabe für Buchstabe, dann schreibt ein
   kleiner Stift die Notizen Wort für Wort — mit menschlich-unregelmäßigem
   Tempo. Fun Fact, Chips & Preis erscheinen zum Schluss als „Aufkleber".     */
var typeTimers=[];
function clearType(){typeTimers.forEach(clearTimeout);typeTimers=[];}
function setDone(card,on){
  ['.fakt','.chips','.kost'].forEach(function(sel){
    var n=card.querySelector(sel);
    n&&n.classList[on?'add':'remove']('an');
  });
}
SB.startType=function(i){
  clearType();
  var card=document.getElementById('card'+i),s=SC[i];
  var h=card.querySelector('.h2t'),caret=card.querySelector('.caret');
  h.textContent='';caret.style.display='inline-block';
  card.querySelectorAll('.pen').forEach(function(p){p.remove()});
  card.querySelectorAll('.tw').forEach(function(w){w.classList.remove('an')});
  setDone(card,false);
  if(SB.reduced){ h.textContent=s.t;caret.style.display='none';
    card.querySelectorAll('.tw').forEach(function(w){w.classList.add('an')});
    setDone(card,true);return;}
  var title=s.t,ci=0;
  (function tick(){
    if(ci<=title.length){h.textContent=title.slice(0,ci);ci++;typeTimers.push(setTimeout(tick,30+Math.random()*28));}
    else{caret.style.display='none';words();}
  })();
  function words(){
    var ws=card.querySelectorAll('.tw'),wi=0;
    var pen=el('span','pen','✍️');
    (function wtick(){
      if(wi<ws.length){
        var w=ws[wi];w.classList.add('an');
        w.parentNode.insertBefore(pen,w.nextSibling);   // der Stift folgt dem Wort
        wi++;typeTimers.push(setTimeout(wtick,36+Math.random()*52));
      }else{
        pen.remove();
        typeTimers.push(setTimeout(function(){setDone(card,true);},250));
      }
    })();
  }
};

/* ---- Toast ----------------------------------------------------------------------- */
var toast=document.getElementById('toast');
SB.showToast=function(msg){
  if(!toast)return;
  toast.textContent=msg;toast.classList.add('show');
  clearTimeout(SB.showToast._t);
  SB.showToast._t=setTimeout(function(){toast.classList.remove('show');},3400);
};

/* ---- Krümel-Regen (Logo-Easter-Egg & RSVP-Feier) ----------------------------------- */
SB.crumbRain=function(count,icons,stepMs){
  if(SB.reduced)return;
  icons=icons||trip.hero.floaties||['✨'];
  for(var i=0;i<count;i++){(function(i){setTimeout(function(){
    var c=el('div','crumb');
    c.textContent=icons[Math.floor(Math.random()*icons.length)];
    c.style.left=(Math.random()*96)+'vw';
    c.style.animationDuration=(2+Math.random()*2.6)+'s';
    document.body.appendChild(c);setTimeout(function(){c.remove()},5600);
  },i*(stepMs||90))})(i);}
};

if(logoEl){
  logoEl.addEventListener('keydown',function(e){
    if(e.key==='Enter'||e.key===' '){e.preventDefault();logoEl.click();}
  });
  logoEl.addEventListener('click',function(){SB.crumbRain(9,null,70);});
}

/* ---- RSVP (aus trip.rsvp) ------------------------------------------------------------ */
var R=trip.rsvp;
var rsvpHost=document.getElementById('rsvp');
rsvpHost.innerHTML=
  '<div class="ey">'+R.eyebrow+'</div>'+
  '<h3>'+R.title+'</h3>'+
  '<p>'+R.text+'</p>'+
  '<div class="btnrow" id="rsvpbtns"></div>'+
  '<div id="rsvpdone">'+R.done+'</div>'+
  (R.fine?'<p class="fine">'+R.fine+'</p>':'');
function mailtoUrl(label){
  var subject=label+' — '+R.mailSubject;
  return 'mailto:'+encodeURIComponent(SB.config.email)+
    '?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(R.mailBody);
}
function feiern(label){
  document.querySelectorAll('#rsvpbtns button').forEach(function(b){b.style.display='none'});
  document.getElementById('rsvpdone').style.display='block';
  SB.crumbRain(34,R.crumbs,90);
  setTimeout(function(){window.location.href=mailtoUrl(label);},700);
}
var btnrow=document.getElementById('rsvpbtns');
(R.buttons||[]).forEach(function(label,i){
  var b=el('button','rot'+(i>0?' alt':''),label);
  b.type='button';
  b.addEventListener('click',function(){feiern(label)});
  btnrow.appendChild(b);
});

/* ---- Footer ---------------------------------------------------------------------------- */
var footEl=document.getElementById('footer');
if(footEl)footEl.innerHTML=trip.footer||'';
})();
