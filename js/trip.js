/* ==========================================================================
   ⭐ DER TRIP: Dolce Vita Express DV 294 — Nürnberg → Rom, mit dem Nachtzug
   Für eine neue Reise NUR diese Datei kopieren & anpassen (plus die
   <head>-Metadaten in index.html). Schema-Doku: siehe README.md.
   Alle Text-Felder dürfen HTML enthalten (<b>, <i>, <span class="sparpreis">…).

   Preise & Fahrpläne: Stand Sommer 2026, alles selbst nachgeschaut und
   gerundet. Der Nachtzug fährt saisonal unterschiedlich — vor dem Buchen
   einmal im ÖBB-Fahrplan gegenprüfen.
   ========================================================================== */
(function(){
'use strict';
var SB=window.SB;

SB.trip={

  meta:{
    title:'Dolce Vita Express – Fährst du mit mir nach Rom?',
    brand:{abbr:'DV',tagline:'Einmal Rom. Im Liegen hin, zu Fuß durch.',logoTitle:'Nicht drücken. (Doch, drück.)'}
  },

  config:{
    email:'frankreich.0wl0i@passmail.net',
    sceneVh:320,
    autoSecPerScene:20,
    tickerLabel:'Fahrtkosten p. P.'
  },

  hero:{
    eyebrow:'Nachtzug DV 294 · nur ein Vorschlag',
    title:'Fährst du mit mir <span>nach Rom?</span>',
    sub:'Abends in München einsteigen, morgens in Rom aufwachen. Vier Tage, alles zu Fuß, unter 90 € Fahrt pro Person.',
    kicker:'Ohne Flughafen, ohne Mietwagen · Cornetto ist eingeplant',
    scrollhint:'Einmal scrollen — dann fährt es von allein weiter ↓',
    floaties:['🍕','🍝','🍦','☕','🍋','🏛️','🍕']
  },

  map:{
    /* 'steps': feste Zoomstufe je Szene. Die Fahrt geht über 1000 km, in Rom
       wollen wir aber nah ran — mit 'fixed' wäre beides derselbe Ausschnitt. */
    zoomMode:'steps',
    vehicle:{model:'ice',color:'#1B2A5B',accent:'#E2001A',glass:'#26313E',light:'#F4F2EE',
      wordmark:'NIGHTJET',logo:'ÖBB',
      tapModel:'croissant',
      tapTitle:'Antippen — auf eigene Gefahr',
      tapAria:'Zug antippen: als Cornetto weiterfahren',
      tapToast:'🥐 Cornetto-Express — buon viaggio!',
      tapToastBack:'🚆 Zurück auf die Schiene.'},
    trainEmoji:'🚆'
  },

  /* Marschierende Teekanne als Ladeanzeige der Karte. */
  teapot:{
    color:'#8FD0EE',shade:'#5FAAD2',trim:'#2E6F97',
    where:['loading']
  },

  /* Zuckerdosen-Szene vor dem RSVP — in Rom heißt das Ziel Espresso. */
  zucker:{
    captions:['Un caffè. Der erste von vielen.',
              'Zweiter. Es ist ja Urlaub.',
              'Langsam wird\'s süß.',
              'Noch einer — wir laufen ihn wieder ab.',
              'Voll. Fehlt nur noch dein Ja.']
  },

  /* Route als [Lng,Lat]-Punkte: Hinweg 0–23, Rückweg gespiegelt.
     Nürnberg → München → Brenner → Bozen → Verona → Bologna → Florenz → Rom. */
  route:{
    coords:[[11.0825,49.4456],[11.2100,49.2400],[11.4419,48.7447],[11.5100,48.5300],[11.5581,48.1402],
      [11.9700,48.0450],[12.1244,47.8561],[12.1667,47.5833],[12.0670,47.4870],[11.7700,47.3880],
      [11.4011,47.2632],[11.5064,47.0033],[11.4300,46.8950],[11.6560,46.7150],[11.3548,46.4983],
      [11.1211,46.0748],[11.0400,45.8900],[10.9828,45.4299],[11.1500,45.0500],[11.3426,44.4949],
      [11.2481,43.7807],[11.8800,43.4600],[12.3900,42.4600],[12.5018,41.9009],
      [12.3900,42.4600],[11.8800,43.4600],[11.2481,43.7807],[11.3426,44.4949],[11.1500,45.0500],
      [10.9828,45.4299],[11.0400,45.8900],[11.1211,46.0748],[11.3548,46.4983],[11.6560,46.7150],
      [11.4300,46.8950],[11.5064,47.0033],[11.4011,47.2632],[11.7700,47.3880],[12.0670,47.4870],
      [12.1667,47.5833],[12.1244,47.8561],[11.9700,48.0450],[11.5581,48.1402],[11.5100,48.5300],
      [11.4419,48.7447],[11.2100,49.2400],[11.0825,49.4456]],
    stopIdx:[0,4,10,14,17,19,20,23]
  },

  music:{
    ytId:'6A_lOwSnS8c',
    label:'La vie en rose — Zaz',
    volume:65,
    triggerScene:3,              // Szene „Über den Brenner" → Italien
    gate:false,
    hint:'🇮🇹 Brenner geschafft — ♪ oben antippen für Musik.'
  },

  scenes:[
    {i0:0,i1:0,z0:11.6,z1:11.6,p0:0,p1:50,b0:0,b1:18,cost:0,badge:"DV 294",cls:"b-herz",
     t:"Nürnberg Hbf",w:"„Okay. Zeit für die eigentliche Frage.“",
     x:"Zwei Plätze, einer davon deiner. Vier Tage Rom, hin und zurück auf Schienen — kommst du mit?",
     fact:"Rom liegt 1000 km entfernt. Mit dem Nachtzug ist das genau eine Nacht Schlaf.",
     k:"0,00 € · D-Ticket",frei:true,ch:["Cornetto liegt bereit","Rückfahrt ist schon eingeplant"]},

    {i0:0,i1:4,z0:9.6,z1:9.6,p0:50,p1:48,b0:18,b1:-6,cost:0,badge:"RE",cls:"b-re",
     t:"Erstmal nach München",w:"„Der Regionalzug: langsam, aber im Preis schon drin.“",
     x:"Knapp zwei Stunden über Ingolstadt, mit dem D-Ticket. Wir haben Zeit — der Nachtzug fährt erst abends.",
     fact:"Bis München zahlen wir keinen Cent extra. Das D-Ticket gilt für alles ohne Aufpreis.",
     k:"0,00 € · D-Ticket",frei:true},

    {i0:4,i1:7,z0:9.4,z1:9.4,p0:48,p1:52,b0:-6,b1:14,cost:44.90,badge:"NIGHTJET",cls:"b-bus",
     t:"München: einsteigen, hinlegen",w:"„Das einzige Hotel, das nachts 700 km zurücklegt.“",
     x:"Abends ab München, Frühstück gibt's in Italien. Sitzwagen ist am günstigsten, Liegewagen kostet etwa 20 € mehr — dafür schläft man wirklich.",
     fact:"Eine Nacht im Zug spart eine Hotelnacht. Der Nachtzug rechnet sich zweimal.",
     k:"+ 44,90 € · Sparschiene",ch:["Sitzwagen ab ca. 39 €","Liegewagen ab ca. 59 €","6 Monate vorher buchbar"]},

    {i0:7,i1:13,z0:9.0,z1:9.0,p0:52,p1:50,b0:14,b1:-10,cost:0,badge:"BRENNER",cls:"b-bus",
     t:"Über den Brenner, im Schlaf",w:"„Die Alpen: schön, aber wir haben die Augen zu.“",
     x:"Kufstein, Innsbruck, Brenner. Wenn du wach wirst und aus dem Fenster schaust, ist draußen schon Südtirol.",
     fact:"Der Brenner ist mit 1371 m der niedrigste Alpenübergang — deshalb führt hier seit 1867 eine Bahn drüber.",
     k:"im Nachtzug-Preis",frei:true},

    {i0:13,i1:19,z0:8.6,z1:8.6,p0:50,p1:46,b0:-10,b1:8,cost:0,badge:"NJ 294",cls:"b-bus",
     t:"Verschlafen: Verona, Bologna",w:"„Zwei Weltstädte, komplett im Schlaf genommen.“",
     x:"Der Zug rollt nachts durch die Po-Ebene. Wir kriegen davon nichts mit — und das ist auch der Plan.",
     fact:"Bologna hat 38 km überdachte Arkaden. Zu Fuß trocken durch eine ganze Stadt.",
     k:"im Nachtzug-Preis",frei:true},

    {i0:19,i1:23,z0:8.4,z1:8.4,p0:46,p1:54,b0:8,b1:26,cost:0,badge:"ROMA",cls:"b-tgv",
     t:"Ankunft: Roma Termini",w:"„Buongiorno. Der Zug hat uns hergetragen, ab jetzt tragen uns die Füße.“",
     x:"Morgens raus aus dem Bahnhof, Rucksack ins Zimmer, Cappuccino im Stehen an der Bar. Ab hier zahlen wir keine Fahrkarte mehr.",
     fact:"An der Bar kostet der Espresso rund 1,20 €, am Tisch das Doppelte. Also stehen wir.",
     k:"0,00 € · angekommen",frei:true,ch:["Cappuccino nur vormittags","Wasser aus dem Nasone"]},

    {i0:23,i1:23,z0:12.6,z1:12.6,p0:54,p1:56,b0:26,b1:-14,cost:0,badge:"ZU FUSS",cls:"b-ter",
     t:"Runde 1: das antike Rom",w:"„Alle Wege führen nach Rom. Innerhalb Roms führen alle Wege bergauf.“",
     x:"Von Termini an Santa Maria Maggiore vorbei zum Kolosseum, dann Forum, Palatin und hoch aufs Kapitol. Rund 4 km.",
     fact:"Am ersten Sonntag im Monat sind die staatlichen Museen frei — Kolosseum und Forum inklusive.",
     k:"0,00 € · zu Fuß",frei:true,ch:["Kolosseum ca. 18 €","Forum im selben Ticket","Kapitolsplatz frei"]},

    {i0:23,i1:23,z0:12.8,z1:12.8,p0:56,p1:54,b0:-14,b1:22,cost:0,badge:"ZU FUSS",cls:"b-ter",
     t:"Runde 2: Centro Storico",w:"„Pantheon, Navona, Trevi — und dazwischen alle drei Meter ein Eis.“",
     x:"Piazza Venezia, Pantheon, Piazza Navona, Campo de' Fiori, Trevibrunnen. Etwa 3,5 km, davon 3 km Kopfsteinpflaster.",
     fact:"Die Kuppel des Pantheons ist seit 1900 Jahren die größte unbewehrte Betonkuppel der Welt.",
     k:"0,00 € · zu Fuß",frei:true,ch:["Pizza al taglio nach Gewicht","Supplì aus der Friggitoria","Pantheon 5 €"]},

    {i0:23,i1:23,z0:12.6,z1:12.6,p0:54,p1:52,b0:22,b1:-30,cost:0,badge:"ZU FUSS",cls:"b-ter",
     t:"Runde 3: Trastevere & Gianicolo",w:"„Abends über den Fluss. Da drüben ist das Essen billiger.“",
     x:"Über die Tiberinsel nach Trastevere, durch die Gassen und hoch auf den Gianicolo — der beste Blick über Rom, und er kostet nichts.",
     fact:"Auf dem Gianicolo fällt jeden Mittag um zwölf ein Kanonenschuss. Seit 1904, damit die Kirchturmuhren zusammenpassen.",
     k:"0,00 € · zu Fuß",frei:true,ch:["Sonnenuntergang gratis","Trapizzino probieren"]},

    {i0:23,i1:46,z0:8.2,z1:8.2,p0:52,p1:42,b0:-30,b1:0,cost:44.90,badge:"HEIMFAHRT",cls:"b-bus",
     t:"Nachts zurück",w:"„Zug endet in Nürnberg. Der Jetlag heißt hier Espresso-Entzug.“",
     x:"Abends in Rom einsteigen, morgens in München frühstücken, mittags daheim. Im Gepäck: Kaffee, Pasta, wunde Füße.",
     fact:"Wir sind in Rom rund 40 km gelaufen. Das ist ungefähr ein Marathon — nur mit Pausen für Eis.",
     k:"+ 44,90 € · Sparschiene",ch:["Kaffee für zuhause","Blasenpflaster leer"]}
  ],

  sections:[
    {type:'price',bg:'hell',
     title:'Der Kassenzettel.',
     sub:'Nur die Fahrt, pro Person, zusätzlich zum D-Ticket. In Rom selbst kommt nichts mehr dazu — wir laufen.',
     cols:['Strecke','Produkt','Preis'],
     rows:[
       {label:'Nürnberg → Ingolstadt → München',product:'RE (D-Ticket)',price:'0,00 €',free:true},
       {label:'München → Rom <span class="sparpreis">Sparschiene</span>',product:'ÖBB Nightjet · über Nacht',price:'44,90 €'},
       {label:'Rom, vier Tage',product:'zu Fuß',price:'0,00 €',free:true},
       {label:'Rom → München <span class="sparpreis">Sparschiene</span>',product:'ÖBB Nightjet · über Nacht',price:'44,90 €'},
       {label:'München → … → Nürnberg',product:'RE (D-Ticket)',price:'0,00 €',free:true}
     ],
     total:{label:'Summe pro Person',price:'89,80 €'},
     budget:{pct:60,text:'90 € von 150 € Budget · bleiben 60 € für Eis, Pizza und einen Kaffee zum Mitnehmen.'}},

    {type:'cards',
     title:'Rom zu Fuß: vier Runden',
     sub:'Rom ist kleiner, als es aussieht. Vom Bahnhof bis zum Petersdom sind es keine 5 km — wir brauchen keine einzige Fahrkarte.',
     items:[
       {tag:'Runde 1 · ca. 4 km',title:'Das antike Rom',html:'Termini → Santa Maria Maggiore → Kolosseum → Forum &amp; Palatin → Kapitol → Piazza Venezia. Früh losgehen, dann steht man nicht in der Sonne an.',price:'Eintritt Kolosseum ca. 18 €'},
       {tag:'Runde 2 · ca. 3,5 km',title:'Centro Storico',html:'Pantheon → Piazza Navona → Campo de\' Fiori → Trevi → Spanische Treppe. Dazwischen: Pizza al taglio, nach Gewicht bezahlt.',price:'Pantheon 5 €, der Rest frei'},
       {tag:'Runde 3 · ca. 3 km',title:'Trastevere &amp; Gianicolo',html:'Tiberinsel → Trastevere → hoch auf den Gianicolo. Abends hin: erst der Blick über die Dächer, dann günstig essen.',price:'kostenlos'},
       {tag:'Runde 4 · ca. 3 km',title:'Aventin &amp; Testaccio',html:'Circus Maximus → Orangengarten → das Schlüsselloch der Malteser → Markthalle Testaccio. Die ruhigste Runde von allen.',price:'kostenlos'}
     ]},

    {type:'cards',bg:'hell',
     title:'Kostet nichts, ist trotzdem groß',
     sub:'Rom lässt sich erstaunlich weit umsonst anschauen. Das hier steht auf unserer Liste.',
     items:[
       {tag:'immer offen',title:'Die Nasoni',html:'Rund 2500 gusseiserne Trinkbrunnen sprudeln durchgehend, das Wasser ist trinkbar. Flasche mitnehmen, nie wieder Wasser kaufen.',price:'0 €'},
       {tag:'täglich',title:'Petersdom',html:'Der Eintritt ist frei, nur die Schlange kostet Geduld. Wer hoch zur Kuppel will, zahlt extra (zu Fuß günstiger als mit Aufzug).',price:'frei · Kuppel ca. 8–10 €'},
       {tag:'1. Sonntag im Monat',title:'Museen umsonst',html:'An jedem ersten Sonntag sind die staatlichen Museen kostenlos — Kolosseum, Forum und Palatin gehören dazu. Früh da sein.',price:'0 €'},
       {tag:'letzter Sonntag',title:'Vatikanische Museen',html:'Am letzten Sonntag im Monat freier Eintritt, Einlass nur vormittags. Sonst rund 20 € plus Reservierung.',price:'0 € statt ca. 20 €'},
       {tag:'jeden Mittag',title:'Der Kanonenschuss',html:'Punkt zwölf feuert auf dem Gianicolo eine Kanone. Danach hat man den besten Blick auf Rom ganz für sich.',price:'0 €'},
       {tag:'abends',title:'Trevi ohne Menschenmassen',html:'Tagsüber steht man dort in fünfter Reihe. Spät abends oder kurz nach Sonnenaufgang gehört der Brunnen fast einem allein.',price:'0 €'}
     ]},

    {type:'tee',
     title:'Die Dienstkleidung',
     sub:'Unser Motto steht schon drauf, ganz ohne Diskussion: <b>Alle Wege führen zum Essen.</b>',
     emoji:'🍕',tag:'RM',
     motto1:'Alle Wege führen',motto2:'zum Essen.',
     cut:'women',
     ariaLabel:'Weißes T-Shirt mit Pizzastück und dem Aufdruck: Alle Wege führen zum Essen',
     caption:'Weißes Baumwoll-Tee, Pizza vorne drauf. Pflichtausstattung — Nachschlag ist kein Verstoß, sondern Vorschrift.'},

    {type:'cards',
     title:'Wo wir schlafen',
     sub:'Zwei Nächte davon verbringen wir ohnehin im Zug. Für die Tage dazwischen: einfach, sauber, zentral — selbst nachgeschaut, nichts gesponsert.',
     items:[
       {tag:'Monti · zentral',title:'Hostel mit Doppelzimmer',html:'Zwischen Termini und Kolosseum. Alles zu Fuß erreichbar, morgens sind wir als Erste am Forum.',price:'ca. 70–100 € / DZ / Nacht'},
       {tag:'Geheimtipp',title:'Casa per ferie',html:'Klösterliche Gästehäuser mitten in der Stadt: schlicht, ruhig, oft mit Dachterrasse. Manche haben eine Sperrstunde — vorher fragen.',price:'ca. 60–90 € / DZ / Nacht'},
       {tag:'Trastevere',title:'Kleines B&amp;B über dem Fluss',html:'Abends das beste Viertel vor der Tür, morgens 25 Minuten Fußweg ins Zentrum. Lauter, dafür lebendiger.',price:'ca. 80–110 € / DZ / Nacht'}
     ]},

    {type:'cards',bg:'hell',
     title:'Plan B: ohne Nachtzug',
     sub:'Der Nachtzug fährt nicht jeden Tag und die Sparschiene ist schnell weg. Dann geht es tagsüber — länger unterwegs, ähnlich günstig.',
     items:[
       {tag:'Vormittag',title:'München → Bologna',html:'EuroCity über den Brenner, rund 7 Stunden mit Blick auf die Dolomiten. Sparschiene rechtzeitig buchen.',price:'ab ca. 29,90 €'},
       {tag:'Nachmittag',title:'Bologna → Rom',html:'Frecciarossa oder Italo, gut zwei Stunden. Wer flexibel ist, fährt in der Nebenzeit deutlich billiger.',price:'ab ca. 19,90 €'}
     ]}
  ],

  rsvp:{
    eyebrow:'Und jetzt im Ernst',
    title:'Kommst du mit?',
    text:'Ein Klick, und ich schreib dir direkt eine Mail dazu. Den Rest besprechen wir dann in echt.',
    buttons:['Ja','Sehr gerne'],
    done:'Mail ist offen — einfach abschicken. Die Blasenpflaster nehm ich mit.',
    fine:'Bequeme Schuhe sind keine Empfehlung, sondern Voraussetzung. Frag mich einfach, warum.',
    mailSubject:'Dolce Vita Express DV 294',
    mailBody:'Ich bin dabei.',
    crumbs:['🍕','🍝','🍦','☕','🍋','🏛️','🍕','🍦']
  },

  footer:'Kartendaten © OpenStreetMap-Mitwirkende, © CARTO · Höhendaten: AWS Terrain Tiles · Musik über YouTube · Preise und Fahrpläne ca., Stand Sommer 2026 — vor dem Buchen bitte gegenprüfen.<br>Alles selbst zusammengesucht. Keine Werbung, kein Sponsoring — nur ich. · <b>Tutte le strade portano a Roma.</b>'
};

SB.prepareTrip();
})();
