/* ==========================================================================
   ⭐ DER TRIP: Schlemmer Bahn SB 143 — Nürnberg → Elsass → Burgund
   Für eine neue Reise NUR diese Datei kopieren & anpassen (plus die
   <head>-Metadaten in index.html). Schema-Doku: siehe README.md.
   Alle Text-Felder dürfen HTML enthalten (<b>, <i>, <span class="sparpreis">…).
   ========================================================================== */
(function(){
'use strict';
var SB=window.SB;

SB.trip={

  meta:{
    title:'Schlemmer Bahn Sonderzug – Willst du mit mir verreisen?',
    brand:{abbr:'SB',tagline:'Ein Trip, den ich uns ausgedacht habe.',logoTitle:'Nicht klicken. (Doch, klick.)'}
  },

  config:{
    email:'frankreich.0wl0i@passmail.net',
    sceneVh:320,           // Scrollhöhe pro Szene (vh) — mehr = gemächlicher
    autoSecPerScene:20,    // Autopilot: Sekunden pro Szene
    tickerLabel:'Fahrtkosten p. P.'
  },

  hero:{
    eyebrow:'Sonderzug SB 143 · nur ein Vorschlag',
    title:'Willst du mit mir <span>verreisen?</span>',
    sub:'Nürnberg → Elsass → Burgund. Etwa eine Woche, zwei Plätze. Ich hab\'s tatsächlich durchgerechnet.',
    kicker:'Croissants sind eingeplant · der Rosmarin auch, frag nicht',
    scrollhint:'Einmal scrollen — dann läuft\'s von allein weiter ↓',
    floaties:['🥐','🌿','🧈','🥖','🍲','🌿','🥐']
  },

  map:{
    /* Zoom bleibt die ganze Fahrt konstant — die Karte lädt ihre Kacheln
       dann einmal statt bei jeder Zoomstufe neu. 'steps' = feste Stufe pro
       Szene, 'scenes' = die alten, durchgehenden Zoomfahrten. */
    zoomMode:'fixed',
    zoom:9.6,
    /* 3D-Fahrzeug: 'ice' | 'train' | 'bus' | 'car'. vehicle3d:false = Emoji.
       Ein Tipp aufs Fahrzeug tauscht es gegen tapModel (null = aus).
       'ice' fährt als ganzer Triebzug auf Gleisen: cars = Anzahl Wagen,
       size = Pixel je WAGEN, wordmark/logo = Beschriftung, track:false
       nimmt die Schienen weg. */
    vehicle:{model:'ice',color:'#EC0016',accent:'#FFD800',glass:'#26313E',light:'#F4F2EE',
      wordmark:'ICE',logo:'DB',   // cars bleibt offen: Handy 3, sonst 4
      tapModel:'croissant',
      tapTitle:'Antippen — auf eigene Gefahr',
      tapAria:'Zug antippen: als Croissant weiterfahren',
      tapToast:'🥐 Croissant-Express — bon voyage!',
      tapToastBack:'🚄 Zurück auf die Schiene.'},
    trainEmoji:'🚆'
    // Optional überschreibbar: routeColor, doneColor, stopColor, bg,
    //   terrain:false, pitchScale, vehicle3d:false
  },

  /* Marschierende Teekanne: läuft während die Karte lädt und am Seitenende
     durchs Bild. teapot:null schaltet sie ab. */
  teapot:{
    color:'#8FD0EE',shade:'#5FAAD2',trim:'#2E6F97',
    caption:'Die Kanne besteht darauf, mitzukommen.'
  },

  /* Zuckerdosen-Szene direkt vor dem RSVP: die Dose marschiert von links nach
     rechts zur Tasse und füllt sie Runde für Runde. captions = eine Zeile je
     Runde, die letzte gehört zum übervollen Finale (also immer eine mehr als
     Füll-Runden). zucker:null schaltet die Szene ab. */
  zucker:{
    title:'Zum Schluss: der Zucker.',
    sub:'Frühstück ist Chefsache — und die Zuckerdose erledigt das allein. Sie marschiert von links nach rechts und füllt deine Tasse. Löffel für Löffel, bis nichts mehr reinpasst.',
    captions:['Erster Löffel. Zum Aufwärmen.',
              'Zweiter Gang. Sie meint es ernst.',
              'Langsam wird\'s süß.',
              'Noch einer — es sind ja Ferien.',
              'Voll. Fehlt nur noch dein Ja.']
  },

  /* Route als [Lng,Lat]-Punkte, Hin- und Rückweg. stopIdx = Indizes der
     Punkte, die als Halte-Kreise auf der Karte markiert werden. */
  route:{
    coords:[[11.0825,49.4456],[10.5719,49.3009],[10.0664,49.1367],[9.7550,49.1030],[9.4310,48.9466],[9.1829,48.7840],
      [8.9600,48.9360],[8.7060,48.8940],[8.4009,48.9936],[8.2110,48.8586],[8.1907,48.7904],[8.0760,48.6260],[7.9466,48.4766],[7.8100,48.5732],
      [7.7860,48.5760],[7.7455,48.5839],[7.4540,48.2597],[7.3468,48.0723],[7.2770,48.0870],[7.3468,48.0723],[7.3423,47.7418],[6.8990,47.5866],[5.9540,47.3080],[5.0272,47.3235],
      [4.9300,47.1620],[4.8485,47.0230],[4.7522,46.9137],[4.4730,46.7550],[4.1110,46.4522],[4.0331,46.2726],
      [4.1110,46.4522],[4.4730,46.7550],[4.7522,46.9137],[4.8485,47.0230],[5.0272,47.3235],
      [5.9540,47.3080],[6.8990,47.5866],[7.3423,47.7418],[7.3468,48.0723],[7.7455,48.5839],[7.8100,48.5732],[7.9466,48.4766],[8.4009,48.9936],[9.1829,48.7840],[10.0664,49.1367],[11.0825,49.4456]],
    stopIdx:[0,5,8,12,13,15,17,18,23,25,29]
  },

  /* Musik am Meilenstein. Weglassen (music:null) = Trip ohne Musik.
     triggerScene: ab dieser Szene erscheint der ♪-Knopf.
     gate:false = ohne Dialog, damit die Fahrt an der Grenze nicht stehen
     bleibt; stattdessen nur der Hinweis unten. Ton startet dann per Klick
     auf ♪ (ohne echte Geste lässt kein Browser Ton zu). */
  music:{
    ytId:'6A_lOwSnS8c',          // Zaz — „La vie en rose"
    label:'La vie en rose — Zaz',
    volume:65,
    triggerScene:3,              // Szene „Über den Rhein: Straßburg"
    gate:false,
    hint:'🇫🇷 Rhein überquert — ♪ oben antippen für „La vie en rose".'
  },

  /* Szenen der Kartenfahrt.
     i0/i1: Routen-Punkt-Index Start/Ende · z: Zoom · p: Pitch · b: Bearing
     cost: Ticketkosten dieser Etappe (für den Ticker) · t: Titel · w: Witz
     x: Kurztext · fact: Fun Fact · k: Kostenlabel · frei: grünes Label
     ch: Chips · cls: Badge-Farbe (b-re, b-tram, b-ter, b-tgv, b-bus, b-herz) */
  scenes:[
    {i0:0,i1:0,z0:11.8,z1:11.8,p0:0,p1:50,b0:0,b1:18,cost:0,badge:"SB 143",cls:"b-herz",
     t:"Nürnberg Hbf",w:"„Okay. Zeit für die eigentliche Frage.“",
     x:"Zwei Plätze, auf deinem liegt ein Croissant. Elsass &amp; Burgund, eine Woche, mit dem Zug — kommst du mit?",
     fact:"Die allererste deutsche Eisenbahn fuhr 1835 ab Nürnberg. Wir setzen die Tradition fort.",
     k:"0,00 € · D-Ticket",frei:true,ch:["Croissant liegt bereit","Rosmarin ist eingepackt"]},
    {i0:0,i1:5,z0:11.8,z1:8.4,p0:50,p1:48,b0:18,b1:-12,cost:0,badge:"RE 90",cls:"b-re",
     t:"Quer durch Franken",w:"„Der RE 90 hält überall. Wirklich überall. Auch emotional.“",
     x:"Ansbach, Crailsheim, Schwäbisch Hall. Drei Stunden, null Euro, ein geteilter Kopfhörer.",
     fact:"Schwäbisch Hall hieß bis 1934 einfach nur „Hall“ — das Schwäbisch kam per Erlass dazu.",
     k:"0,00 € · D-Ticket",frei:true},
    {i0:5,i1:13,z0:8.4,z1:9.4,p0:48,p1:54,b0:-12,b1:22,cost:0,badge:"RE/IRE",cls:"b-re",
     t:"Stuttgart → Kehl",w:"„In Kehl endet Deutschland. Kehl-mal drüber nach.“",
     x:"Bis Kehl gilt das D-Ticket. Die 2 € für Frankreich übernehm ich.",
     fact:"Unterwegs: Baden-Baden — die einzige Stadt, die so gut ist, dass sie sich selbst zitiert.",
     k:"0,00 € · D-Ticket",frei:true},
    {i0:13,i1:15,z0:9.4,z1:12.4,p0:54,p1:56,b0:22,b1:55,cost:2,badge:"TRAM D",cls:"b-tram",
     t:"Über den Rhein: Straßburg",w:"„Grenzüberschreitend gut — ein Tram-Traum.“",
     x:"Tram über den Rhein, abends Flammkuchen, morgens Pain au Chocolat am Kanal — Schulter an Schulter.",
     fact:"Das Straßburger Münster war 227 Jahre lang das höchste Gebäude der Welt.",
     k:"+ 2,00 € · Tram D",ch:["Binchstub","Plein la Moustache","Au Pont du Corbeau"]},
    {i0:15,i1:18,z0:12.4,z1:11.0,p0:56,p1:54,b0:55,b1:12,cost:12,badge:"TER",cls:"b-ter",
     t:"Colmar & Turckheim: Cocotte-Tag",w:"„Hier geht die Cocotte ab. Gusseisen: der einzige harte Stoff an Bord.“",
     x:"Staub-Store in Turckheim: die größte Cocotte-Auswahl der Welt. Und ja, wir kaufen den Rosmarin-Topf.",
     fact:"Colmar gilt als trockenste Stadt Frankreichs — bestes Croissant-Wetter, garantiert.",
     k:"+ 12,00 € · TER-Tag",ch:["Staub-Store","Beurre de baratte","Marché Couvert"]},
    {i0:18,i1:23,z0:11.0,z1:8.0,p0:54,p1:48,b0:12,b1:-32,cost:29,badge:"TGV",cls:"b-tgv",
     t:"Mit 320 km/h nach Dijon",w:"„TGV: Très Günstige Verbindung. Wer spät bucht: Très Gierige Verbindung.“",
     x:"2 h 06 direkt, ab 29 €. Links ziehen die Vogesen vorbei — in echtem 3D.",
     fact:"Ein TGV hält den Schienen-Weltrekord: 574,8 km/h. Wir nehmen die gemütlichen 320.",
     k:"+ 29,00 € · Sparpreis"},
    {i0:23,i1:23,z0:8.0,z1:12.4,p0:48,p1:56,b0:-32,b1:-64,cost:0,badge:"DIJON",cls:"b-tgv",
     t:"Dijon: Hauptquartier",w:"„Senfsationell hier.“",
     x:"Mittags Les Halles, Senf bei Fallot, Lebkuchen bei Mulot &amp; Petitjean. Alles zu Fuß.",
     fact:"Gustave Eiffel ist gebürtiger Dijoner — die Markthalle gilt als sein Entwurf.",
     k:"0,00 € · zu Fuß, Ehrensache",frei:true,ch:["Les Halles","Fallot & Maille","Du Pain Pour Demain"]},
    {i0:23,i1:25,z0:12.4,z1:11.0,p0:56,p1:54,b0:-64,b1:-26,cost:14,badge:"TER",cls:"b-ter",
     t:"Beaune-jour!",w:"„Und zum Essen: Beaune Appétit.“",
     x:"Samstagsmarkt, Senfmühlen-Tour bei Fallot, Traubensaft direkt vom Winzer.",
     fact:"Das bunte Dach der Hospices de Beaune leuchtet seit 1443 — Burgunds berühmteste Ziegel.",
     k:"+ 14,00 € · Dijon ⇄ Beaune",ch:["Moutarderie Fallot","Jus de raisin","Époisses (mutig!)"]},
    {i0:25,i1:29,z0:11.0,z1:10.2,p0:54,p1:52,b0:-26,b1:8,cost:0,badge:"BUS+TER",cls:"b-bus",
     t:"Bonus: Marcigny (2-Wochen-Version)",w:"„Emile Henry, −35 bis −40 %: der reinste Ton-Gewinn.“",
     x:"Werksverkauf des Keramik-Königs. Aber: <b>Di &amp; So geschlossen!</b>",
     fact:"Emile Henry brennt seit 1850 Keramik in Marcigny — im selben Ort, seit sechs Generationen.",
     k:"optional · ~25 € extra",frei:true},
    {i0:29,i1:45,z0:10.2,z1:7.4,p0:52,p1:42,b0:8,b1:0,cost:31,badge:"TGV+TRAM+RE",cls:"b-tgv",
     t:"Heimfahrt",w:"„Zug endet hier. Wie unsere Ausreden.“",
     x:"TGV, Tram, dann 0 € bis Nürnberg. Im Gepäck: Senf, Butter, 4 kg Gusseisen, ein Topf Rosmarin.",
     fact:"Schon 1390 regelte ein Erlass, was in Dijoner Senf darf. In unseren Rucksack: alles.",
     k:"+ 31,00 € · und heim",ch:["Gepäck: schwerer als hin","Rosmarin hat überlebt"]}
  ],

  /* Inhaltsblöcke nach der Kartenfahrt, in dieser Reihenfolge.
     Typen: 'price' (Tabelle + Budgetbalken), 'cards' (Kachel-Raster),
            'tee' (Trikot-Grafik), 'html' (freier Block).
     bg:'hell' = grauer Hintergrund (zum Abwechseln). */
  sections:[
    {type:'price',bg:'hell',
     title:'Der Kassenzettel.',
     sub:'Nur die Zugtickets, pro Person, zusätzlich zum D-Ticket. Croissants kommen nochmal oben drauf, aber die zähl ich nicht mit.',
     cols:['Strecke','Produkt','Preis'],
     rows:[
       {label:'Nürnberg → Stuttgart → Karlsruhe → Offenburg → Kehl',product:'RE / Regio (D-Ticket)',price:'0,00 €',free:true},
       {label:'Kehl Bahnhof → Straßburg',product:'Tram D · CTS-Ticket',price:'2,00 €'},
       {label:'Straßburg → Colmar → Turckheim &amp; zurück',product:'TER-Tag Elsass',price:'12,00 €'},
       {label:'Straßburg → Dijon <span class="sparpreis">Sparpreis</span>',product:'TGV direkt · 2 h 06',price:'29,00 €'},
       {label:'Dijon ⇄ Beaune',product:'TER Mobigo',price:'14,00 €'},
       {label:'Dijon → Straßburg <span class="sparpreis">Sparpreis</span>',product:'TGV direkt · 2 h 06',price:'29,00 €'},
       {label:'Straßburg → Kehl Bahnhof',product:'Tram D · CTS-Ticket',price:'2,00 €'},
       {label:'Kehl → … → Nürnberg',product:'RE / Regio (D-Ticket)',price:'0,00 €',free:true}
     ],
     total:{label:'Summe pro Person',price:'88,00 €'},
     budget:{pct:73,text:'88 € von 120 € Budget · bleiben 32 € übrig, ungefähr eine Mini-Cocotte.'}},

    {type:'cards',
     title:'Wo wir schlafen',
     sub:'Da schlafen wir nochmal drüber — hier ein paar günstige Optionen, einfach nachgeschaut, nichts gesponsert.',
     items:[
       {tag:'Straßburg · 1–2 Nächte',title:'Ibis Budget / B&amp;B an der Gare',html:'Null Meter Kofferschleppen. Sozial &amp; zentral: Jugendherberge <b>CIARUS</b>.',price:'ca. 60–90 € / DZ / Nacht'},
       {tag:'Colmar · 1 Nacht',title:'Ibis Budget Colmar Centre',html:'Fußläufig zu Altstadt &amp; Bahnhof. Morgens Turckheim, mittags Cocotte, abends Winstub.',price:'ca. 60–85 € / DZ / Nacht'},
       {tag:'Dijon · 3–4 Nächte',title:'Ibis Budget / B&amp;B / CIS Dijon',html:'Basislager Burgund. Geheimtipp: <b>CIS Dijon</b> (Ethic Étapes) für günstige Doppelzimmer.',price:'ca. 55–85 € / DZ / Nacht'}
     ]},

    {type:'tee',bg:'hell',
     title:'Die Dienstkleidung',
     sub:'Unser Motto steht schon drauf, ganz ohne Diskussion: <b>Essen bis zum Umfallen.</b>',
     emoji:'🥐',tag:'UT',
     motto1:'Essen bis zum',motto2:'Umfallen.',
     cut:'women',                    // 'women' | 'unisex' · d3:false = flaches SVG
     ariaLabel:'Weißes T-Shirt mit Croissant und dem Aufdruck: Essen bis zum Umfallen',
     caption:'Weißes Baumwoll-Tee, Croissant vorne drauf. Pflichtausstattung — Nachschlag ist kein Verstoß, sondern Vorschrift.'},

    {type:'cards',
     title:'Bonus-Runde: was noch geht',
     sub:'Kein Muss, nur Ideen, falls noch Zeit &amp; Rucksackplatz übrig ist.',
     items:[
       {tag:'Marcigny · optional',title:'Emile Henry Werksverkauf',html:'Keramik-König seit 1850, −35 bis −40 %. <b>Di &amp; So geschlossen!</b>',price:'Bus + TER · ~25 € extra'},
       {tag:'Bresse · optional',title:'Beurre de Bresse AOP',html:'Eine von nur drei Butter-AOPs Frankreichs — traditionell gebuttert, butterblumengelb. Abstecher via Chalon-sur-Saône.',price:'TER-Abstecher · Tagestrip'}
     ]}
  ],

  rsvp:{
    eyebrow:'Und jetzt im Ernst',
    title:'Kommst du mit?',
    text:'Ein Klick, und ich schreib dir direkt eine Mail dazu. Den Rest besprechen wir dann in echt.',
    buttons:['Ja','Sehr gerne'],
    done:'Mail ist offen — einfach abschicken. Croissants merk ich mir.',
    fine:'Der Rosmarin reist trotzdem im Handgepäck. Frag mich einfach, warum.',
    mailSubject:'Schlemmer Bahn SB 143',
    mailBody:'Ich bin dabei.',
    crumbs:['🥐','🌿','🧈','🥖','🍲','🧃','🥐','🌿']
  },

  footer:'Kartendaten © OpenStreetMap-Mitwirkende, © CARTO · Höhendaten: AWS Terrain Tiles · Musik: „La vie en rose" — Zaz (via YouTube) · Preise ca., Stand Sommer 2026.<br>Alles selbst zusammengesucht. Keine Werbung, kein Sponsoring — nur ich. · <b>Croissant du matin, tout va bien.</b>'
};

SB.prepareTrip();
})();
