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
    sceneVh:260,
    autoSecPerScene:15,
    tickerLabel:'Fahrtkosten p. P.'
  },

  hero:{
    eyebrow:'Nachtzug DV 294 · nur ein Vorschlag',
    title:'Fährst du mit mir <span>nach Rom?</span>',
    sub:'Abends in München einsteigen, morgens in Rom aufwachen. Vier Tage, alles zu Fuß, unter 90 € Fahrt pro Person.',
    kicker:'Ohne Flughafen, ohne Mietwagen, ohne Metro · Cornetto ist eingeplant',
    scrollhint:'Einmal scrollen — dann fährt es von allein weiter ↓',
    floaties:['🍕','🍝','🍦','☕','🍋','🏛️','🥐','🍇']
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
    ytId:'wCqDEGcA44o',
    label:'Musik für unterwegs',
    volume:65,
    triggerScene:4,              // ab dem Brenner: ab hier ist es Italien
    gate:false,
    hint:'🇮🇹 Brenner geschafft — ♪ oben antippen für Musik.'
  },

  scenes:[
    {i0:0,i1:0,z0:11.6,z1:11.6,p0:0,p1:50,b0:0,b1:18,cost:0,badge:"DV 294",cls:"b-herz",
     t:"Nürnberg Hbf",w:"„Okay. Zeit für die eigentliche Frage.“",
     x:"Zwei Plätze, einer davon deiner. Vier Tage Rom, hin und zurück auf Schienen, keine 90 € Fahrt — kommst du mit?",
     fact:"Rom liegt 1000 km entfernt. Mit dem Nachtzug ist das genau eine Nacht Schlaf.",
     k:"0,00 € · D-Ticket",frei:true,ch:["Cornetto liegt bereit","Rückfahrt schon eingeplant"]},

    {i0:0,i1:4,z0:9.6,z1:9.6,p0:50,p1:48,b0:18,b1:-6,cost:0,badge:"RE",cls:"b-re",
     t:"Erstmal nach München",w:"„Der Regionalzug: langsam, aber im Preis schon drin.“",
     x:"Knapp zwei Stunden über Ingolstadt, mit dem D-Ticket. Wir haben Zeit — der Nachtzug fährt erst am Abend.",
     fact:"Bis München zahlen wir keinen Cent extra. Das D-Ticket gilt für alles ohne Aufpreis.",
     k:"0,00 € · D-Ticket",frei:true},

    {i0:4,i1:4,z0:11.4,z1:11.4,p0:48,p1:54,b0:-6,b1:30,cost:0,badge:"MÜNCHEN",cls:"b-re",
     t:"Nachmittag in München",w:"„Wir haben vier Stunden. Rate mal, was wir machen.“",
     x:"Rucksack ins Schließfach, einmal durch die Stadt, Proviant kaufen. Im Nachtzug gibt es zwar Frühstück, aber der Abend gehört uns.",
     fact:"Proviant selbst mitbringen ist im Nightjet ausdrücklich erlaubt — Brot, Käse, etwas zu trinken, fertig ist das Abendessen.",
     k:"0,00 € · Schließfach zahlt der Chef",frei:true,ch:["Brot & Käse besorgen","Wasser nicht vergessen"]},

    {i0:4,i1:7,z0:9.4,z1:9.4,p0:54,p1:52,b0:30,b1:14,cost:44.90,badge:"NIGHTJET",cls:"b-bus",
     t:"Einsteigen, hinlegen",w:"„Das einzige Hotel, das nachts 700 km zurücklegt.“",
     x:"Abends ab München. Sitzwagen ist am günstigsten, Liegewagen kostet rund 20 € mehr — dafür schläft man wirklich. Ich würde den Liegewagen nehmen.",
     fact:"Eine Nacht im Zug spart eine Hotelnacht. Der Nachtzug rechnet sich zweimal.",
     k:"+ 44,90 € · Sparschiene",ch:["Sitzwagen ab ca. 39 €","Liegewagen ab ca. 59 €","6 Monate vorher buchbar"]},

    {i0:7,i1:11,z0:9.0,z1:9.0,p0:52,p1:50,b0:14,b1:-8,cost:0,badge:"BRENNER",cls:"b-bus",
     t:"Über den Brenner",w:"„Die Alpen: großartig. Wir haben die Augen zu.“",
     x:"Kufstein, Innsbruck, dann hoch zum Pass. Wer nachts einmal aufwacht und den Vorhang aufschiebt, sieht schwarze Berge und ein paar Lichter.",
     fact:"Der Brenner ist mit 1371 m der niedrigste Alpenübergang — deshalb führt hier schon seit 1867 eine Bahn drüber.",
     k:"im Nachtzug-Preis",frei:true},

    {i0:11,i1:17,z0:8.8,z1:8.8,p0:50,p1:48,b0:-8,b1:10,cost:0,badge:"SÜDTIROL",cls:"b-bus",
     t:"Bozen, Trient, Verona — verschlafen",w:"„Drei Städte, komplett im Schlaf genommen.“",
     x:"Der Zug rollt das Etschtal hinunter. Von Weinbergen, Burgen und Verona kriegen wir nichts mit, und das ist auch der Plan.",
     fact:"Ab Bozen sind die Bahnhofsschilder zweisprachig. Man merkt am Fahrplan, dass man das Land gewechselt hat, bevor man es sieht.",
     k:"im Nachtzug-Preis",frei:true},

    {i0:17,i1:21,z0:8.6,z1:8.6,p0:48,p1:46,b0:10,b1:22,cost:0,badge:"MORGENS",cls:"b-bus",
     t:"Aufwachen hinter Bologna",w:"„Kaffee ans Abteil. Draußen Zypressen.“",
     x:"Irgendwo zwischen Bologna und Florenz wird es hell. Frühstück ist im Liegewagen dabei — Kaffee, Semmel, Marmelade, und der Blick gehört dazu.",
     fact:"Zwischen Bologna und Florenz fährt der Zug durch den Apennin. Auf 78 km liegen über 40 Tunnel.",
     k:"Frühstück inklusive",frei:true,ch:["Toskana am Fenster","Noch zwei Stunden"]},

    {i0:21,i1:23,z0:9.6,z1:9.6,p0:46,p1:56,b0:22,b1:-10,cost:0,badge:"ROMA",cls:"b-tgv",
     t:"Ankunft: Roma Termini",w:"„Buongiorno. Ab hier tragen uns die Füße.“",
     x:"Kurz vor halb zehn hält der Zug. Rucksack in die Unterkunft oder ins Gepäckdepot, Cappuccino im Stehen an der Bar — und dann laufen wir los.",
     fact:"An der Bar kostet der Espresso rund 1,20 €, am Tisch das Doppelte. Also stehen wir.",
     k:"0,00 € · angekommen",frei:true,ch:["Cappuccino nur vormittags","Wasser aus dem Nasone"]},

    {i0:23,i1:23,z0:12.8,z1:12.8,p0:56,p1:54,b0:-10,b1:24,cost:0,badge:"TAG 1",cls:"b-ter",
     t:"Das antike Rom",w:"„Alle Wege führen nach Rom. Innerhalb Roms führen alle Wege bergauf.“",
     x:"Von Termini an Santa Maria Maggiore vorbei zum Kolosseum, dann Forum, Palatin, hoch aufs Kapitol und runter zur Piazza Venezia. Rund 4 km.",
     fact:"Am ersten Sonntag im Monat sind die staatlichen Museen frei — Kolosseum, Forum und Palatin gehören dazu.",
     k:"0,00 € · zu Fuß",frei:true,ch:["Kolosseum ca. 18 €","Forum im selben Ticket","Kapitolsplatz frei"]},

    {i0:23,i1:23,z0:13.0,z1:13.0,p0:54,p1:52,b0:24,b1:-34,cost:0,badge:"TAG 1 ABENDS",cls:"b-ter",
     t:"Abends in Monti",w:"„Das Viertel hinter dem Kolosseum, in dem die Römer selbst essen.“",
     x:"Enge Gassen, Efeu, kleine Lokale ohne Speisekarte auf Englisch. Zehn Gehminuten vom Forum und trotzdem eine andere Stadt.",
     fact:"Monti ist Roms ältestes Viertel — hier lag die Subura, das dicht bebaute Wohnquartier des antiken Rom.",
     k:"0,00 € · zu Fuß",frei:true,ch:["Aperitivo statt Vorspeise","Piazza Madonna dei Monti"]},

    {i0:23,i1:23,z0:13.0,z1:13.0,p0:52,p1:56,b0:-34,b1:16,cost:0,badge:"TAG 2",cls:"b-ter",
     t:"Centro Storico",w:"„Pantheon, Navona, Trevi — und alle drei Meter ein Eis.“",
     x:"Piazza Venezia, Pantheon, Piazza Navona, Campo de' Fiori, Trevibrunnen, Spanische Treppe. Etwa 3,5 km, davon drei auf Kopfsteinpflaster.",
     fact:"Die Kuppel des Pantheons ist seit 1900 Jahren die größte unbewehrte Betonkuppel der Welt. Oben ist ein Loch, und wenn es regnet, regnet es hinein.",
     k:"0,00 € · zu Fuß",frei:true,ch:["Pizza al taglio nach Gewicht","Supplì aus der Friggitoria","Pantheon 5 €"]},

    {i0:23,i1:23,z0:12.8,z1:12.8,p0:56,p1:52,b0:16,b1:-28,cost:0,badge:"TAG 2 ABENDS",cls:"b-ter",
     t:"Trastevere & Gianicolo",w:"„Über den Fluss. Da drüben ist das Essen besser und billiger.“",
     x:"Über die Tiberinsel nach Trastevere, durch die Gassen und hoch auf den Gianicolo. Der beste Blick über Rom, und er kostet nichts.",
     fact:"Auf dem Gianicolo fällt jeden Mittag um zwölf ein Kanonenschuss. Seit 1904, damit die Kirchturmuhren der Stadt zusammenpassen.",
     k:"0,00 € · zu Fuß",frei:true,ch:["Sonnenuntergang gratis","Trapizzino probieren"]},

    {i0:23,i1:23,z0:13.0,z1:13.0,p0:52,p1:54,b0:-28,b1:20,cost:0,badge:"TAG 3",cls:"b-ter",
     t:"Vatikan & Engelsburg",w:"„Der kleinste Staat der Welt. Und die längste Schlange.“",
     x:"Am Tiber entlang zur Engelsburg, über die Engelsbrücke auf den Petersplatz. Der Petersdom kostet nichts — nur früh da sein, sonst steht man zwei Stunden.",
     fact:"Der Vatikan ist mit 0,44 km² der kleinste Staat der Erde. Man umrundet ihn zu Fuß in einer knappen Stunde.",
     k:"0,00 € · zu Fuß",frei:true,ch:["Petersdom frei","Kuppel ca. 8 € zu Fuß","Museen letzter So. frei"]},

    {i0:23,i1:23,z0:12.8,z1:12.8,p0:54,p1:50,b0:20,b1:-16,cost:0,badge:"TAG 4",cls:"b-ter",
     t:"Aventin, Testaccio, Heimweg",w:"„Die ruhigste Runde. Und die mit dem besten Markt.“",
     x:"Circus Maximus, Orangengarten, das Schlüsselloch der Malteser, dann runter nach Testaccio in die Markthalle. Danach zurück zum Bahnhof.",
     fact:"Durch das Schlüsselloch am Malteserplatz sieht man die Kuppel des Petersdoms — exakt mittig, hinter einer Allee. Kostenlos, aber mit Schlange.",
     k:"0,00 € · zu Fuß",frei:true,ch:["Markthalle Testaccio","Cimitero Acattolico","Letzter Espresso"]},

    {i0:23,i1:46,z0:8.2,z1:8.2,p0:50,p1:42,b0:-16,b1:0,cost:44.90,badge:"HEIMFAHRT",cls:"b-bus",
     t:"Nachts zurück",w:"„Zug endet in Nürnberg. Der Jetlag heißt hier Espresso-Entzug.“",
     x:"Abends in Rom einsteigen, morgens in München frühstücken, mittags daheim. Im Gepäck: Kaffee, Pasta, wunde Füße.",
     fact:"Wir sind in Rom rund 40 km gelaufen. Das ist ungefähr ein Marathon — nur mit Pausen für Eis.",
     k:"+ 44,90 € · Sparschiene",ch:["Kaffee für zuhause","Blasenpflaster leer"]}
  ],

  sections:[
    {type:'price',bg:'hell',
     title:'Der Kassenzettel.',
     sub:'Nur die Fahrt, pro Person, zusätzlich zum D-Ticket. In Rom selbst kommt keine einzige Fahrkarte dazu — wir laufen.',
     cols:['Strecke','Produkt','Preis'],
     rows:[
       {label:'Nürnberg → Ingolstadt → München',product:'RE (D-Ticket)',price:'0,00 €',free:true},
       {label:'München → Rom <span class="sparpreis">Sparschiene</span>',product:'ÖBB Nightjet · über Nacht',price:'44,90 €'},
       {label:'Rom, vier Tage',product:'zu Fuß',price:'0,00 €',free:true},
       {label:'Rom → München <span class="sparpreis">Sparschiene</span>',product:'ÖBB Nightjet · über Nacht',price:'44,90 €'},
       {label:'München → … → Nürnberg',product:'RE (D-Ticket)',price:'0,00 €',free:true}
     ],
     total:{label:'Summe pro Person',price:'89,80 €'},
     budget:{pct:60,text:'90 € von 150 € Budget · bleiben 60 € für Eintritte, Eis und einen Kaffee zum Mitnehmen.'}},

    {type:'cards',
     title:'Vier Tage, Schritt für Schritt',
     sub:'So würde ich die Tage legen: morgens das Große, mittags Schatten, abends das Viertel. Nichts davon ist in Stein gemeißelt.',
     items:[
       {tag:'Tag 1 · ca. 9 km',title:'Antike & Monti',html:'Ankunft, Gepäck weg, Kolosseum und Forum am Vormittag. Nachmittags Kapitol und Piazza Venezia, abends durch Monti essen gehen.',price:'Eintritt ca. 18 €'},
       {tag:'Tag 2 · ca. 11 km',title:'Centro Storico & Trastevere',html:'Pantheon, Navona, Campo de\' Fiori, Trevi. Nachmittags Pause im Park, abends über den Fluss nach Trastevere und hoch auf den Gianicolo.',price:'Pantheon 5 €'},
       {tag:'Tag 3 · ca. 10 km',title:'Vatikan & Villa Borghese',html:'Früh zum Petersdom, danach Engelsburg. Nachmittags durch die Villa Borghese zur Terrazza del Pincio — Sonnenuntergang über der Piazza del Popolo.',price:'Petersdom frei'},
       {tag:'Tag 4 · ca. 8 km',title:'Aventin, Testaccio, Abschied',html:'Circus Maximus, Orangengarten, Schlüsselloch, Markthalle Testaccio. Nachmittags treiben lassen, abends zum Zug.',price:'kostenlos'}
     ]},

    {type:'cards',bg:'hell',
     title:'Rom zu Fuß: sechs Runden',
     sub:'Rom ist kleiner, als es aussieht. Vom Bahnhof bis zum Petersdom sind es keine 5 km — die Stadt lässt sich komplett erlaufen.',
     items:[
       {tag:'Runde 1 · ca. 4 km',title:'Das antike Rom',html:'Termini → Santa Maria Maggiore → Kolosseum → Forum &amp; Palatin → Kapitol → Piazza Venezia. Früh losgehen, dann steht man nicht in der Sonne an.',price:'Kolosseum ca. 18 €'},
       {tag:'Runde 2 · ca. 3,5 km',title:'Centro Storico',html:'Piazza Venezia → Pantheon → Piazza Navona → Campo de\' Fiori → Trevi → Spanische Treppe. Dazwischen: Pizza al taglio, nach Gewicht bezahlt.',price:'Pantheon 5 €, Rest frei'},
       {tag:'Runde 3 · ca. 3 km',title:'Trastevere &amp; Gianicolo',html:'Tiberinsel → Santa Maria in Trastevere → hoch auf den Gianicolo. Abends hin: erst der Blick über die Dächer, dann günstig essen.',price:'kostenlos'},
       {tag:'Runde 4 · ca. 4 km',title:'Vatikan &amp; Engelsburg',html:'Am Tiber entlang → Engelsburg → Engelsbrücke → Petersplatz → Petersdom. Wer mag, steigt die 551 Stufen zur Kuppel hoch.',price:'frei · Kuppel ca. 8 €'},
       {tag:'Runde 5 · ca. 3 km',title:'Aventin &amp; Testaccio',html:'Circus Maximus → Orangengarten → Schlüsselloch der Malteser → Markthalle Testaccio. Die ruhigste Runde von allen.',price:'kostenlos'},
       {tag:'Runde 6 · ca. 4 km',title:'Villa Borghese &amp; Pincio',html:'Spanische Treppe → Villa Borghese → Terrazza del Pincio → Piazza del Popolo. Roms größter Park, und der Blick zum Schluss ist umsonst.',price:'Park frei'}
     ]},

    {type:'cards',
     title:'Kostet nichts, ist trotzdem groß',
     sub:'Rom lässt sich erstaunlich weit umsonst anschauen. Das hier steht auf unserer Liste.',
     items:[
       {tag:'immer offen',title:'Die Nasoni',html:'Rund 2500 gusseiserne Trinkbrunnen sprudeln durchgehend, das Wasser ist trinkbar und kalt. Flasche mitnehmen, nie wieder Wasser kaufen.',price:'0 €'},
       {tag:'täglich',title:'Petersdom',html:'Der Eintritt ist frei, nur die Schlange kostet Geduld — vor acht Uhr ist sie kurz. Schultern und Knie müssen bedeckt sein.',price:'frei'},
       {tag:'1. Sonntag im Monat',title:'Museen umsonst',html:'An jedem ersten Sonntag sind die staatlichen Museen kostenlos — Kolosseum, Forum und Palatin gehören dazu. Sehr früh da sein.',price:'0 €'},
       {tag:'letzter Sonntag',title:'Vatikanische Museen',html:'Am letzten Sonntag im Monat freier Eintritt, Einlass nur vormittags. Sonst rund 20 € plus Reservierungsgebühr.',price:'0 € statt ca. 20 €'},
       {tag:'jeden Mittag',title:'Der Kanonenschuss',html:'Punkt zwölf feuert auf dem Gianicolo eine Kanone. Danach hat man den besten Blick über Rom fast für sich allein.',price:'0 €'},
       {tag:'abends & früh',title:'Trevi ohne Menschenmassen',html:'Tagsüber steht man in fünfter Reihe. Spät abends oder kurz nach Sonnenaufgang gehört der Brunnen beinahe einem allein.',price:'0 €'},
       {tag:'jederzeit',title:'Antike im Vorbeigehen',html:'Largo di Torre Argentina, das Marcellustheater, die Kaiserforen von der Straße aus: halb Rom steht frei zugänglich herum.',price:'0 €'},
       {tag:'sonntags autofrei',title:'Via Appia Antica',html:'Die älteste Fernstraße Europas, sonntags ohne Autos. Kopfsteinpflaster, Pinien, Grabmäler — ein Spaziergang aus der Stadt hinaus.',price:'0 €'}
     ]},

    {type:'cards',bg:'hell',
     title:'Essen für wenig Geld',
     sub:'Römisch essen heißt nicht teuer essen — es heißt nur, an der richtigen Theke zu stehen.',
     items:[
       {tag:'Mittags',title:'Pizza al taglio',html:'Pizza vom Blech, nach Gewicht bezahlt. Man zeigt auf das Stück, sagt wie viel, isst im Stehen. Satt wird man für zwei bis vier Euro.',price:'ca. 2–4 €'},
       {tag:'Zwischendurch',title:'Supplì',html:'Frittierte Reisbällchen mit Mozzarella-Kern, aus jeder Friggitoria. Das römische Gegenstück zum Snack am Kiosk.',price:'ca. 1,50–2,50 €'},
       {tag:'Abends',title:'Trapizzino',html:'Ein Pizzadreieck als Tasche, gefüllt mit Schmorgerichten. Römische Küche zum Aus-der-Hand-Essen, erfunden in Testaccio.',price:'ca. 4–6 €'},
       {tag:'Morgens',title:'Cornetto &amp; Cappuccino',html:'Frühstück im Stehen an der Bar, wie alle hier. Cappuccino gibt es nur vormittags — danach gilt Espresso.',price:'ca. 2,50–3,50 €'},
       {tag:'Markt',title:'Mercato Testaccio',html:'Markthalle mit Ständen zum Mitnehmen: Panini, Pasta, Gemüse. Vormittags hin, mittags ist das Beste weg.',price:'ca. 5–8 €'},
       {tag:'Nachtisch',title:'Gelato, aber richtig',html:'Faustregel: Wenn das Eis neonfarben und meterhoch aufgetürmt ist, weitergehen. Gute Läden zeigen wenig Farbe und decken die Behälter ab.',price:'ca. 2,50–4 €'}
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
     sub:'Zwei Nächte verbringen wir ohnehin im Zug. Für die Tage dazwischen: einfach, sauber, zentral — selbst nachgeschaut, nichts gesponsert.',
     items:[
       {tag:'Monti · zentral',title:'Hostel mit Doppelzimmer',html:'Zwischen Termini und Kolosseum. Alles zu Fuß erreichbar, morgens sind wir als Erste am Forum.',price:'ca. 70–100 € / DZ / Nacht'},
       {tag:'Geheimtipp',title:'Casa per ferie',html:'Klösterliche Gästehäuser mitten in der Stadt: schlicht, ruhig, oft mit Dachterrasse. Manche haben eine Sperrstunde — vorher fragen.',price:'ca. 60–90 € / DZ / Nacht'},
       {tag:'Trastevere',title:'Kleines B&amp;B über dem Fluss',html:'Abends das beste Viertel vor der Tür, morgens 25 Minuten Fußweg ins Zentrum. Lauter, dafür lebendiger.',price:'ca. 80–110 € / DZ / Nacht'},
       {tag:'San Lorenzo',title:'Studentenviertel',html:'Hinter Termini, unprätentiös und günstig. Wenig Sehenswürdigkeiten, dafür die niedrigsten Preise und volle Kneipen.',price:'ca. 55–80 € / DZ / Nacht'}
     ]},

    {type:'cards',bg:'hell',
     title:'Gut zu wissen',
     sub:'Ein paar Dinge, die den Unterschied zwischen einem guten und einem anstrengenden Tag machen.',
     items:[
       {tag:'Schuhe',title:'Kopfsteinpflaster überall',html:'Roms Sampietrini sind rund, glatt und uneben. Eingelaufene Schuhe mit Sohle, keine neuen. Blasenpflaster gehören ins Handgepäck.',price:'Pflicht'},
       {tag:'Kirchen',title:'Schultern und Knie bedeckt',html:'Gilt im Petersdom streng, in anderen Kirchen meist auch. Ein dünnes Tuch im Rucksack löst das Problem im Sommer.',price:'kostenlos'},
       {tag:'Mittags',title:'Die Stadt macht Pause',html:'Zwischen 13 und 16 Uhr ist es heiß und viele kleine Läden schließen. Beste Zeit für Kirchen, Schatten oder ein langes Mittagessen.',price:'—'},
       {tag:'Tickets',title:'Vorher buchen, wo es geht',html:'Kolosseum und Vatikanische Museen laufen über Zeitfenster. Ohne Reservierung steht man an oder kommt gar nicht rein.',price:'+2 bis 5 € Gebühr'},
       {tag:'Wasser',title:'Leitungswasser ist gut',html:'Das Wasser der Nasoni kommt aus denselben Quellen wie das der Antike. Zwei Flaschen pro Person und Tag spart Geld und Plastik.',price:'0 €'},
       {tag:'Termini',title:'Gepäck abgeben',html:'Der Nachtzug kommt vormittags an, die Zimmer sind erst nachmittags frei. Das Depot im Bahnhof kostet ein paar Euro — oder die Unterkunft nimmt die Rucksäcke.',price:'ca. 6 € / Stück'}
     ]},

    {type:'cards',
     title:'Wenn noch ein Tag bleibt',
     sub:'Beides erreicht man mit einem einzigen Nahverkehrsticket — die Ausnahme von der Fuß-Regel, und sie lohnt sich.',
     items:[
       {tag:'ca. 40 Min ab Piramide',title:'Ostia Antica',html:'Die Hafenstadt des antiken Rom: Straßen, Thermen, ein Theater, fast ohne Menschen. Wie Pompeji, nur vor der Haustür.',price:'Bahn 1,50 € · Eintritt ca. 18 €'},
       {tag:'zu Fuß erreichbar',title:'Centrale Montemartini',html:'Antike Statuen zwischen Turbinen und Dieselmotoren — ein altes Kraftwerk als Museum. Kaum jemand geht hin, alle sind begeistert.',price:'ca. 10 €'}
     ]},

    {type:'cards',bg:'hell',
     title:'Plan B: ohne Nachtzug',
     sub:'Der Nachtzug fährt nicht jeden Tag und die Sparschiene ist schnell weg. Dann geht es tagsüber — länger unterwegs, ähnlich günstig.',
     items:[
       {tag:'Vormittag',title:'München → Bologna',html:'EuroCity über den Brenner, rund sieben Stunden mit Blick auf die Dolomiten. Sparschiene rechtzeitig buchen.',price:'ab ca. 29,90 €'},
       {tag:'Nachmittag',title:'Bologna → Rom',html:'Frecciarossa oder Italo, gut zwei Stunden. Wer flexibel ist, fährt in der Nebenzeit deutlich billiger.',price:'ab ca. 19,90 €'},
       {tag:'Unterwegs',title:'Zwischenstopp einlegen',html:'Wenn wir schon tagsüber fahren: eine Nacht in Bologna oder Florenz dranhängen. Kostet eine Übernachtung, spart eine lange Sitzfahrt.',price:'+ 1 Nacht'}
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
    crumbs:['🍕','🍝','🍦','☕','🍋','🏛️','🥐','🍇']
  },

  footer:'Kartendaten © OpenStreetMap-Mitwirkende, © CARTO · Höhendaten: AWS Terrain Tiles · Musik über YouTube · Preise, Eintritte und Fahrpläne ca., Stand Sommer 2026 — vor dem Buchen bitte gegenprüfen.<br>Alles selbst zusammengesucht. Keine Werbung, kein Sponsoring — nur ich. · <b>Tutte le strade portano a Roma.</b>'
};

SB.prepareTrip();
})();
