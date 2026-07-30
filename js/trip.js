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

/* ==========================================================================
   DIE STRECKE
   Die Route ist kein Strich von Stadt zu Stadt mehr, sondern der Weg, den
   wir wirklich nehmen: die Bahn folgt der echten Trasse (Ingolstadt,
   Brenner, Etschtal, Apennin-Direttissima), und in Rom folgt die Linie den
   Straßen und Gassen, die wir ablaufen — Via Cavour, Via dei Serpenti,
   Lungotevere. Deshalb sind es ein paar hundert Punkte statt zwei Dutzend.

   Damit die Szenen trotzdem lesbar bleiben, hat jede Etappe einen Namen:
   Szenen schreiben `i0:'kolosseum'` statt einer Nummer, und beim Einfügen
   eines Straßenpunktes verrutscht nichts. Jede Etappe bringt außerdem ihre
   Reiseart mit — daraus baut die Karte Fahrzeug, Zoom und Linienstil
   (Zug auf Gleis, zwei Gehende auf einer Punktspur, Bus auf der Straße).

   Die Koordinaten sind von Hand gesetzt, nicht von einem Routendienst
   geholt: sie liegen auf den richtigen Straßen, aber auf ein paar Meter
   genau, nicht auf den Zentimeter.
   ========================================================================== */
var COORDS=[],MARK={},LEGS=[];
/* Eine Etappe anhängen. Ein String in der Punktliste benennt den Punkt,
   der direkt darauf folgt; `name` benennt den letzten Punkt der Etappe. */
function etappe(mode,name,punkte){
  for(var i=0;i<punkte.length;i++){
    if(typeof punkte[i]==='string')MARK[punkte[i]]=COORDS.length;
    else COORDS.push(punkte[i]);
  }
  MARK[name]=COORDS.length-1;
  LEGS.push({to:name,mode:mode});
}

/* ---- Mit der Bahn: Nürnberg → Rom ---------------------------------------- */
var NBG_MUC=[                                  // RE über Ingolstadt
  [11.0825,49.4456],  // Nürnberg Hbf
  [11.1650,49.4180],  // Nürnberg-Fischbach
  [11.2130,49.3760],  // Feucht
  [11.2320,49.2470],  // Allersberg (Schnellfahrstrecke an der A9)
  [11.3800,49.0000],  // Kinding im Altmühltal
  [11.4290,48.7900],  // Ingolstadt Nord
  [11.4419,48.7447],  // Ingolstadt Hbf
  [11.4680,48.6540],  // Reichertshofen
  [11.5390,48.5770],  // Rohrbach
  [11.5070,48.5310],  // Pfaffenhofen an der Ilm
  [11.4700,48.4110],  // Petershausen
  [11.4650,48.2570],  // Dachau
  [11.5040,48.1450],  // München-Laim
  [11.5581,48.1402]   // München Hbf
];
var MUC_BRE=[                                  // Nightjet, Inntal & Wipptal
  [11.6045,48.1270],  // München Ost
  [11.9660,48.0450],  // Grafing
  [12.1244,47.8561],  // Rosenheim
  [12.0930,47.7370],  // Brannenburg
  [12.1900,47.6130],  // Kiefersfelden
  'kufstein',
  [12.1667,47.5833],  // Kufstein — Grenze
  [12.0670,47.4870],  // Wörgl
  [11.7700,47.3880],  // Jenbach
  [11.7050,47.3480],  // Schwaz
  [11.5060,47.2810],  // Hall in Tirol
  'innsbruck',
  [11.4011,47.2632],  // Innsbruck Hbf
  [11.4290,47.2050],  // Unterberg-Stefansbrücke
  [11.4470,47.1290],  // Matrei am Brenner
  [11.4680,47.0870],  // Steinach am Brenner
  [11.4870,47.0380],  // Gries am Brenner
  [11.5064,47.0033]   // Brennero/Brenner — 1371 m
];
var BRE_VER=[                                  // Eisacktal & Etschtal
  [11.4430,46.9450],  // Gossensaß
  [11.4300,46.8950],  // Sterzing/Vipiteno
  [11.6120,46.7940],  // Franzensfeste
  [11.6560,46.7150],  // Brixen
  [11.5670,46.6400],  // Klausen
  [11.5350,46.5860],  // Waidbruck
  'bozen',
  [11.3548,46.4983],  // Bozen/Bolzano
  [11.3000,46.3480],  // Auer/Ora
  [11.2130,46.2400],  // Salurn
  [11.1230,46.2100],  // Mezzocorona
  'trento',
  [11.1211,46.0748],  // Trento
  [11.0400,45.8900],  // Rovereto
  [11.0030,45.7600],  // Ala
  [10.9400,45.6300],  // Peri
  [10.8330,45.5330],  // Domegliara
  [10.9828,45.4299]   // Verona Porta Nuova
];
var VER_BOL=[                                  // Poebene
  [11.0000,45.2730],  // Isola della Scala
  [11.0600,45.1780],  // Nogara
  [11.1420,45.0680],  // Ostiglia
  [11.1170,44.9700],  // Poggio Rusco
  [11.0670,44.8850],  // Mirandola
  [11.1500,44.7180],  // Crevalcore
  [11.1850,44.6390],  // San Giovanni in Persiceto
  [11.3426,44.4949]   // Bologna Centrale
];
var BOL_FLR=[                                  // Direttissima durch den Apennin
  [11.3400,44.3900],  // Pianoro
  [11.1900,44.2400],  // Grizzana, Tunnel an Tunnel
  [11.1520,44.0430],  // Vernio
  [11.0980,43.8800],  // Prato
  [11.2320,43.8000],  // Firenze Rifredi
  [11.2481,43.7807]   // Firenze Santa Maria Novella
];
var FLR_ROM=[                                  // Valdarno, Tiber-Tal
  [11.3100,43.7600],  // Firenze Rovezzano
  [11.4700,43.6200],  // Figline Valdarno
  [11.5700,43.5250],  // Montevarchi
  [11.8800,43.4600],  // Arezzo
  [12.0000,43.1900],  // Terontola
  [11.9500,43.0100],  // Chiusi
  [12.1200,42.7200],  // Orvieto
  [12.3900,42.4600],  // Orte
  [12.6600,42.2200],  // Poggio Mirteto
  [12.6400,42.1600],  // Fara Sabina
  [12.5400,42.0100],  // Settebagni
  [12.5300,41.9100],  // Roma Tiburtina
  [12.5014,41.9009]   // Roma Termini
];
/* Die ganze Trasse am Stück — für die Heimfahrt. Die Namen unterwegs
   müssen raus: sonst würde die Rückfahrt sie ein zweites Mal vergeben und
   „Kufstein" läge plötzlich hinter Rom. */
var SCHIENE=NBG_MUC.concat(MUC_BRE,BRE_VER,VER_BOL,BOL_FLR,FLR_ROM)
              .filter(function(p){return typeof p!=='string';});

/* ---- Zu Fuß durch Rom ----------------------------------------------------
   Sechs Runden, hintereinanderweg. Die Linie ist die Summe unserer
   Schritte — die Nächte dazwischen sind nicht eingezeichnet.              */
var TAG1=[                                     // Termini → Piazza Venezia
  [12.4998,41.9004],  // Via Cavour, Ecke Via Giolitti
  [12.4991,41.8995],
  [12.4985,41.8983],  // Piazza dell'Esquilino
  'maggiore',
  [12.4983,41.8976],  // Santa Maria Maggiore
  [12.4974,41.8969],  // Via Cavour, bergab
  [12.4958,41.8957],
  [12.4940,41.8945],
  [12.4923,41.8934],  // Ecke Via dei Serpenti
  [12.4906,41.8928],  // Via Cavour trifft die Fori Imperiali
  [12.4910,41.8916],  // Via dei Fori Imperiali
  [12.4917,41.8906],
  'kolosseum',
  [12.4924,41.8901],  // Kolosseum
  [12.4913,41.8895],  // Konstantinsbogen
  [12.4901,41.8890],  // Via di San Gregorio, Eingang Palatin
  [12.4890,41.8888],  // Palatin, Südhang
  [12.4877,41.8893],  // Domus Augustana
  [12.4869,41.8903],  // Farnesische Gärten
  'forum',
  [12.4862,41.8914],  // Forum Romanum, Via Sacra
  [12.4852,41.8923],  // Basilica Aemilia
  [12.4840,41.8928],  // Aufstieg zum Kapitol
  'kapitol',
  [12.4829,41.8931],  // Piazza del Campidoglio
  [12.4822,41.8940],  // Cordonata
  [12.4823,41.8950],  // Piazza d'Aracoeli
  [12.4823,41.8957]   // Piazza Venezia
];
var TAG1A=[                                    // abends nach Monti
  [12.4838,41.8949],  // Via dei Fori Imperiali
  [12.4862,41.8938],
  [12.4884,41.8934],  // Largo Corrado Ricci
  [12.4894,41.8938],  // Via della Madonna dei Monti
  [12.4903,41.8940],  // Piazza Madonna dei Monti
  [12.4908,41.8948],  // Via dei Serpenti
  [12.4906,41.8957],
  [12.4905,41.8964]   // Via Nazionale
];
var TAG2=[                                     // Monti → Centro Storico → Spanische Treppe
  [12.4894,41.8957],  // Largo Magnanapoli
  [12.4862,41.8955],  // Via IV Novembre
  [12.4832,41.8957],  // Piazza Venezia
  [12.4806,41.8959],  // Via del Plebiscito
  [12.4789,41.8958],  // Piazza del Gesù
  'argentina',
  [12.4768,41.8955],  // Largo di Torre Argentina
  [12.4757,41.8944],  // Via Arenula
  [12.4742,41.8949],  // Via dei Giubbonari
  'campo',
  [12.4724,41.8955],  // Campo de' Fiori
  [12.4720,41.8963],  // Via del Pellegrino
  [12.4727,41.8969],  // Corso Vittorio Emanuele II
  [12.4728,41.8980],  // Corso del Rinascimento
  'navona',
  [12.4731,41.8990],  // Piazza Navona
  [12.4736,41.8999],  // Fontana del Nettuno
  [12.4750,41.8997],
  [12.4760,41.8990],  // Piazza Sant'Eustachio
  'pantheon',
  [12.4769,41.8986],  // Pantheon
  [12.4780,41.8987],  // Via del Seminario
  [12.4789,41.8998],  // Piazza di Montecitorio
  [12.4800,41.9001],  // Piazza Colonna
  [12.4818,41.9005],  // Via delle Muratte
  'trevi',
  [12.4833,41.9009],  // Fontana di Trevi
  [12.4841,41.9016],  // Via della Stamperia
  [12.4838,41.9024],  // Via del Tritone
  [12.4828,41.9036],  // Via dei Due Macelli
  [12.4823,41.9050],
  [12.4823,41.9058]   // Spanische Treppe
];
var TAG2A=[                                    // abends: Trastevere & Gianicolo
  [12.4808,41.9055],  // Via dei Condotti
  [12.4790,41.9050],  // Via del Corso
  [12.4795,41.9026],
  [12.4800,41.9002],  // Piazza Colonna
  [12.4808,41.8982],
  [12.4816,41.8965],
  [12.4823,41.8957],  // Piazza Venezia
  [12.4801,41.8952],  // Via d'Aracoeli
  [12.4787,41.8947],  // Via delle Botteghe Oscure
  [12.4785,41.8935],  // Via del Portico d'Ottavia
  [12.4783,41.8925],  // Jüdisches Viertel
  [12.4781,41.8915],  // Ponte Fabricio
  'tiberinsel',
  [12.4779,41.8907],  // Tiberinsel
  [12.4773,41.8900],  // Ponte Cestio
  [12.4765,41.8896],  // Piazza in Piscinula
  [12.4740,41.8897],  // Via della Lungaretta
  [12.4715,41.8895],
  'trastevere',
  [12.4698,41.8894],  // Santa Maria in Trastevere
  [12.4686,41.8896],  // Via della Paglia
  [12.4674,41.8891],  // Via Garibaldi
  [12.4660,41.8884],  // Serpentinen bergauf
  [12.4642,41.8886],  // Fontanone dell'Acqua Paola
  [12.4633,41.8894],  // Passeggiata del Gianicolo
  [12.4622,41.8906],
  [12.4617,41.8917]   // Piazzale Garibaldi
];
var TAG3=[                                     // Vatikan, Engelsburg, Popolo, Pincio
  [12.4610,41.8932],  // Passeggiata del Gianicolo
  [12.4606,41.8950],  // Blick über die ganze Stadt
  [12.4614,41.8966],  // Salita di Sant'Onofrio
  [12.4628,41.8981],
  [12.4639,41.8993],  // Piazza della Rovere
  [12.4620,41.9002],  // Borgo Santo Spirito
  [12.4600,41.9012],  // Via della Conciliazione
  [12.4585,41.9018],
  'petersplatz',
  [12.4573,41.9022],  // Petersplatz
  [12.4560,41.9022],  // Petersdom
  [12.4590,41.9017],  // zurück über die Conciliazione
  [12.4620,41.9020],  // Borgo Sant'Angelo
  'engelsburg',
  [12.4650,41.9029],  // Castel Sant'Angelo
  [12.4665,41.9027],
  [12.4666,41.9016],  // Ponte Sant'Angelo
  [12.4680,41.9024],  // Lungotevere Tor di Nona
  [12.4700,41.9042],  // Lungotevere Marzio
  [12.4716,41.9060],  // Lungotevere in Augusta
  [12.4732,41.9082],
  [12.4749,41.9098],
  'popolo',
  [12.4763,41.9107],  // Piazza del Popolo
  [12.4772,41.9110],  // Aufstieg zum Pincio
  [12.4780,41.9114],  // Terrazza del Pincio
  [12.4820,41.9133],  // Villa Borghese
  [12.4845,41.9138]
];
var TAG4=[                                     // Aventin, Testaccio
  [12.4832,41.9124],  // Villa Borghese, zurück
  [12.4812,41.9096],  // Viale Gabriele d'Annunzio
  [12.4820,41.9074],  // Viale della Trinità dei Monti
  [12.4826,41.9062],  // oben an der Spanischen Treppe
  [12.4823,41.9057],
  [12.4806,41.9053],  // Via dei Condotti
  [12.4790,41.9050],  // Via del Corso
  [12.4796,41.9022],
  [12.4805,41.8992],
  [12.4814,41.8970],
  [12.4822,41.8958],  // Piazza Venezia
  [12.4816,41.8946],  // Via del Teatro di Marcello
  [12.4805,41.8930],  // Teatro di Marcello
  [12.4808,41.8912],  // Via Luigi Petroselli
  [12.4814,41.8890],  // Bocca della Verità
  [12.4818,41.8874],  // Via della Greca
  'circo',
  [12.4830,41.8866],  // Circus Maximus, Nordwestende
  [12.4810,41.8858],  // Clivo dei Publicii, bergauf
  [12.4800,41.8849],  // Via di Santa Sabina
  'aventin',
  [12.4794,41.8843],  // Giardino degli Aranci
  [12.4787,41.8838],
  [12.4783,41.8834],  // Schlüsselloch der Malteser
  [12.4776,41.8827],  // Via di Porta Lavernale
  [12.4768,41.8817],
  [12.4762,41.8805],  // Via Marmorata
  [12.4756,41.8790],
  [12.4750,41.8776],  // Via Galvani
  [12.4749,41.8770]   // Mercato Testaccio
];
/* ---- Einmal Bus: mit Gepäck zurück zum Bahnhof --------------------------- */
var BUS75=[
  [12.4762,41.8780],  // Haltestelle Via Marmorata
  [12.4790,41.8768],  // Piramide
  [12.4810,41.8770],
  [12.4838,41.8790],  // Viale Aventino
  [12.4858,41.8818],
  [12.4868,41.8842],  // Piazza di Porta Capena
  [12.4880,41.8862],  // Via di San Gregorio
  [12.4897,41.8882],
  [12.4915,41.8896],  // am Kolosseum vorbei
  [12.4940,41.8901],  // Via Labicana
  [12.4968,41.8909],
  [12.4978,41.8935],  // Via Merulana
  [12.4986,41.8960],
  [12.4984,41.8976],  // Santa Maria Maggiore
  [12.4990,41.8990],  // Via Cavour
  [12.4998,41.9003],
  [12.5014,41.9009]   // Roma Termini
];

MARK.nuernberg=0;
etappe('rail','muenchen', NBG_MUC);
etappe('rail','brenner',  MUC_BRE);
etappe('rail','verona',   BRE_VER);
etappe('rail','bologna',  VER_BOL);
etappe('rail','florenz',  BOL_FLR);
etappe('rail','termini',  FLR_ROM);
etappe('foot','venezia',  TAG1);
etappe('foot','monti',    TAG1A);
etappe('foot','spagna',   TAG2);
etappe('foot','gianicolo',TAG2A);
etappe('foot','borghese', TAG3);
etappe('foot','testaccio',TAG4);
etappe('bus', 'bahnhof',  BUS75);
// Heimfahrt: dieselbe Trasse rückwärts, ohne Rom doppelt zu setzen.
etappe('rail','daheim',   SCHIENE.slice(0,-1).reverse());

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
       stehen wir dagegen in einzelnen Gassen — mit 'fixed' wäre beides
       derselbe Ausschnitt. Wo der Sprung zu hart wäre (Ankunft, Abfahrt),
       fährt zRamp:true den Zoom innerhalb der Szene durch. */
    zoomMode:'steps',
    /* Zu Fuß laufen wir zu zweit; die Größen sind Pixel Körperhöhe bzw.
       Buslänge auf dem Schirm. Der Bus trägt römisches Rot, nicht das
       Nachtblau des Nightjet. */
    modes:{
      foot:{size:SB.isMobile?32:40,cloth:'#C0392B',cloth2:'#F2EFE7',
            trousers:'#37414F',trousers2:'#2C3542',pack:'#C98A3C'},
      bus:{size:SB.isMobile?38:48,color:'#C0392B',accent:'#F2EFE7',
           glass:'#2B3742',light:'#F7F4EC'}
    },
    footColor:'#C0392B',busColor:'#2E6F97',
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

  /* Strecke, Namen und Reisearten kommen aus dem Baukasten ganz oben. */
  route:{
    coords:COORDS,marks:MARK,legs:LEGS,
    stopIdx:['nuernberg','muenchen','brenner','verona','bologna','florenz','termini',
             'kolosseum','forum','kapitol','pantheon','trevi','spagna','trastevere',
             'gianicolo','petersplatz','popolo','aventin','testaccio']
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
    {i0:'nuernberg',i1:'nuernberg',z0:11.6,z1:11.6,p0:0,p1:50,b0:0,b1:18,cost:0,badge:"DV 294",cls:"b-herz",
     t:"Nürnberg Hbf",w:"„Okay. Zeit für die eigentliche Frage.“",
     x:"Zwei Plätze, einer davon deiner. Vier Tage Rom, hin und zurück auf Schienen, keine 100 € Fahrt — kommst du mit?",
     fact:"Rom liegt 1000 km entfernt. Mit dem Nachtzug ist das genau eine Nacht Schlaf.",
     k:"0,00 € · D-Ticket",frei:true,ch:["Cornetto liegt bereit","Rückfahrt schon eingeplant"]},

    {i0:'nuernberg',i1:'muenchen',z0:9.6,z1:9.6,p0:50,p1:48,b0:18,b1:-6,cost:0,badge:"RE",cls:"b-re",
     t:"Erstmal nach München",w:"„Der Regionalzug: langsam, aber im Preis schon drin.“",
     x:"Knapp zwei Stunden über Allersberg, Kinding und Ingolstadt, mit dem D-Ticket. Wir haben Zeit — der Nachtzug fährt erst am Abend.",
     fact:"Bis München zahlen wir keinen Cent extra. Das D-Ticket gilt für alles ohne Aufpreis.",
     k:"0,00 € · D-Ticket",frei:true},

    {i0:'muenchen',i1:'muenchen',z0:11.4,z1:11.4,p0:48,p1:54,b0:-6,b1:30,cost:0,badge:"MÜNCHEN",cls:"b-re",
     t:"Nachmittag in München",w:"„Wir haben vier Stunden. Rate mal, was wir machen.“",
     x:"Rucksack ins Schließfach, einmal durch die Stadt, Proviant kaufen. Im Nachtzug gibt es zwar Frühstück, aber der Abend gehört uns.",
     fact:"Proviant selbst mitbringen ist im Nightjet ausdrücklich erlaubt — Brot, Käse, etwas zu trinken, fertig ist das Abendessen.",
     k:"0,00 € · Schließfach zahlt der Chef",frei:true,ch:["Brot & Käse besorgen","Wasser nicht vergessen"]},

    {i0:'muenchen',i1:'kufstein',z0:9.4,z1:9.4,p0:54,p1:52,b0:30,b1:14,cost:44.90,badge:"NIGHTJET",cls:"b-bus",
     t:"Einsteigen, hinlegen",w:"„Das einzige Hotel, das nachts 700 km zurücklegt.“",
     x:"Abends ab München, über Rosenheim ins Inntal. Sitzwagen ist am günstigsten, Liegewagen kostet rund 20 € mehr — dafür schläft man wirklich. Ich würde den Liegewagen nehmen.",
     fact:"Eine Nacht im Zug spart eine Hotelnacht. Der Nachtzug rechnet sich zweimal.",
     k:"+ 44,90 € · Sparschiene",ch:["Sitzwagen ab ca. 39 €","Liegewagen ab ca. 59 €","6 Monate vorher buchbar"]},

    {i0:'kufstein',i1:'brenner',z0:9.0,z1:9.0,p0:52,p1:50,b0:14,b1:-8,cost:0,badge:"BRENNER",cls:"b-bus",
     t:"Über den Brenner",w:"„Die Alpen: großartig. Wir haben die Augen zu.“",
     x:"Wörgl, Jenbach, Innsbruck, dann hoch durchs Wipptal zum Pass. Wer nachts einmal aufwacht und den Vorhang aufschiebt, sieht schwarze Berge und ein paar Lichter.",
     fact:"Der Brenner ist mit 1371 m der niedrigste Alpenübergang — deshalb führt hier schon seit 1867 eine Bahn drüber.",
     k:"im Nachtzug-Preis",frei:true},

    {i0:'brenner',i1:'verona',z0:8.8,z1:8.8,p0:50,p1:48,b0:-8,b1:10,cost:0,badge:"SÜDTIROL",cls:"b-bus",
     t:"Bozen, Trient, Verona — verschlafen",w:"„Drei Städte, komplett im Schlaf genommen.“",
     x:"Der Zug rollt durchs Eisacktal und dann die Etsch hinunter. Von Weinbergen, Burgen und Verona kriegen wir nichts mit, und das ist auch der Plan.",
     fact:"Ab Bozen sind die Bahnhofsschilder zweisprachig. Man merkt am Fahrplan, dass man das Land gewechselt hat, bevor man es sieht.",
     k:"im Nachtzug-Preis",frei:true},

    {i0:'verona',i1:'florenz',z0:8.6,z1:8.6,p0:48,p1:46,b0:10,b1:22,cost:0,badge:"MORGENS",cls:"b-bus",
     t:"Aufwachen hinter Bologna",w:"„Kaffee ans Abteil. Draußen Zypressen.“",
     x:"Über die Poebene wird es noch nicht hell — erst hinter Bologna, im Apennin. Frühstück ist im Liegewagen dabei: Kaffee, Semmel, Marmelade, und der Blick gehört dazu.",
     fact:"Zwischen Bologna und Florenz fährt der Zug durch den Apennin. Auf 78 km liegen über 40 Tunnel.",
     k:"Frühstück inklusive",frei:true,ch:["Toskana am Fenster","Noch zwei Stunden"]},

    /* Ankunft: die Kamera kommt aus der Reiseflughöhe herunter (zRamp). */
    {i0:'florenz',i1:'termini',z0:9.4,z1:13.0,zRamp:true,p0:46,p1:56,b0:22,b1:-10,cost:0,badge:"ROMA",cls:"b-tgv",
     t:"Ankunft: Roma Termini",w:"„Buongiorno. Ab hier tragen uns die Füße.“",
     x:"Arezzo, Orte, das Tibertal — kurz vor halb zehn hält der Zug. Rucksack in die Unterkunft oder ins Gepäckdepot, Cappuccino im Stehen an der Bar, und dann laufen wir los.",
     fact:"An der Bar kostet der Espresso rund 1,20 €, am Tisch das Doppelte. Also stehen wir.",
     k:"0,00 € · angekommen",frei:true,ch:["Cappuccino nur vormittags","Wasser aus dem Nasone"]},

    /* Ab hier geht die Karte auf Schrittgeschwindigkeit: die Linie folgt den
       Straßen, und aus dem Zug werden wir zwei. */
    {i0:'termini',i1:'venezia',z0:13.0,z1:16.0,zRamp:true,p0:56,p1:54,b0:-10,b1:6,cost:0,badge:"TAG 1",cls:"b-ter",
     t:"Das antike Rom",w:"„Alle Wege führen nach Rom. Innerhalb Roms führen alle Wege bergauf.“",
     x:"Die Via Cavour hinunter, an Santa Maria Maggiore vorbei zum Kolosseum, dann Forum, Palatin, hoch aufs Kapitol und die Cordonata runter zur Piazza Venezia. Rund 4 km.",
     fact:"Am ersten Sonntag im Monat sind die staatlichen Museen frei — Kolosseum, Forum und Palatin gehören dazu.",
     k:"0,00 € · zu Fuß",frei:true,ch:["Kolosseum ca. 18 €","Forum im selben Ticket","Kapitolsplatz frei"]},

    {i0:'venezia',i1:'monti',z0:16.0,z1:16.0,p0:54,p1:52,b0:6,b1:-14,cost:0,badge:"TAG 1 ABENDS",cls:"b-ter",
     t:"Abends in Monti",w:"„Das Viertel hinter dem Kolosseum, in dem die Römer selbst essen.“",
     x:"Über die Fori Imperiali zurück, dann links in die Via della Madonna dei Monti: enge Gassen, Efeu, kleine Lokale ohne Speisekarte auf Englisch. Zehn Gehminuten vom Forum und trotzdem eine andere Stadt.",
     fact:"Monti ist Roms ältestes Viertel — hier lag die Subura, das dicht bebaute Wohnquartier des antiken Rom.",
     k:"0,00 € · zu Fuß",frei:true,ch:["Aperitivo statt Vorspeise","Piazza Madonna dei Monti"]},

    {i0:'monti',i1:'spagna',z0:15.5,z1:15.5,p0:52,p1:56,b0:-14,b1:16,cost:0,badge:"TAG 2",cls:"b-ter",
     t:"Centro Storico",w:"„Pantheon, Navona, Trevi — und alle drei Meter ein Eis.“",
     x:"Largo Argentina, Campo de' Fiori, Piazza Navona, Pantheon, Trevi, Spanische Treppe. Etwa 4 km, fast alles auf Kopfsteinpflaster.",
     fact:"Die Kuppel des Pantheons ist seit 1900 Jahren die größte unbewehrte Betonkuppel der Welt. Oben ist ein Loch, und wenn es regnet, regnet es hinein.",
     k:"0,00 € · zu Fuß",frei:true,ch:["Pizza al taglio nach Gewicht","Supplì aus der Friggitoria","Pantheon 5 €"]},

    {i0:'spagna',i1:'gianicolo',z0:15.5,z1:15.5,p0:56,p1:52,b0:16,b1:-24,cost:0,badge:"TAG 2 ABENDS",cls:"b-ter",
     t:"Trastevere & Gianicolo",w:"„Über den Fluss. Da drüben ist das Essen besser und billiger.“",
     x:"Den Corso hinunter, durchs jüdische Viertel, über die Tiberinsel nach Trastevere — und dann die Serpentinen hoch auf den Gianicolo. Der beste Blick über Rom, und er kostet nichts.",
     fact:"Auf dem Gianicolo fällt jeden Mittag um zwölf ein Kanonenschuss. Seit 1904, damit die Kirchturmuhren der Stadt zusammenpassen.",
     k:"0,00 € · zu Fuß",frei:true,ch:["Sonnenuntergang gratis","Trapizzino probieren"]},

    {i0:'gianicolo',i1:'borghese',z0:15.0,z1:15.0,p0:52,p1:54,b0:-24,b1:18,cost:0,badge:"TAG 3",cls:"b-ter",
     t:"Vatikan, Engelsburg, Pincio",w:"„Der kleinste Staat der Welt. Und die längste Schlange.“",
     x:"Am Gianicolo entlang nach Sant'Onofrio hinunter, über die Conciliazione auf den Petersplatz. Danach Engelsburg, am Tiber nordwärts zur Piazza del Popolo und hoch auf den Pincio.",
     fact:"Der Vatikan ist mit 0,44 km² der kleinste Staat der Erde. Man umrundet ihn zu Fuß in einer knappen Stunde.",
     k:"0,00 € · zu Fuß",frei:true,ch:["Petersdom frei","Kuppel ca. 8 € zu Fuß","Museen letzter So. frei"]},

    {i0:'borghese',i1:'testaccio',z0:15.0,z1:15.0,p0:54,p1:50,b0:18,b1:-16,cost:0,badge:"TAG 4",cls:"b-ter",
     t:"Aventin & Testaccio",w:"„Die ruhigste Runde. Und die mit dem besten Markt.“",
     x:"Vom Pincio den Corso hinunter, am Teatro di Marcello vorbei zum Circus Maximus, hoch auf den Aventin: Orangengarten, das Schlüsselloch der Malteser — und dann runter nach Testaccio in die Markthalle.",
     fact:"Durch das Schlüsselloch am Malteserplatz sieht man die Kuppel des Petersdoms — exakt mittig, hinter einer Allee. Kostenlos, aber mit Schlange.",
     k:"0,00 € · zu Fuß",frei:true,ch:["Markthalle Testaccio","Cimitero Acattolico","Letzter Espresso"]},

    {i0:'testaccio',i1:'bahnhof',z0:15.0,z1:13.2,zRamp:true,p0:50,p1:44,b0:-16,b1:-4,cost:1.50,badge:"BUS 75",cls:"b-bus",
     t:"Einmal fahren, mit Gepäck",w:"„Die einzige Fahrkarte, die wir in Rom kaufen.“",
     x:"Vom Testaccio zurück zum Bahnhof: Bus 75 über Piramide, Circus Maximus und am Kolosseum vorbei die Via Merulana hinauf. 1,50 € — oder eben 40 Minuten laufen, dann kostet auch der nichts.",
     fact:"Das BIT-Ticket gilt 100 Minuten für Bus und Tram. Im Bus wird es an der gelben Säule entwertet, sonst zählt es nicht.",
     k:"+ 1,50 € · BIT-Ticket",ch:["Oder zu Fuß: 3 km","Entwerten nicht vergessen"]},

    {i0:'bahnhof',i1:'daheim',z0:8.2,z1:8.2,p0:44,p1:40,b0:-4,b1:0,cost:44.90,badge:"HEIMFAHRT",cls:"b-bus",
     t:"Nachts zurück",w:"„Zug endet in Nürnberg. Der Jetlag heißt hier Espresso-Entzug.“",
     x:"Abends in Rom einsteigen, morgens in München frühstücken, mittags daheim. Im Gepäck: Kaffee, Pasta, wunde Füße.",
     fact:"Wir sind in Rom rund 40 km gelaufen. Das ist ungefähr ein Marathon — nur mit Pausen für Eis.",
     k:"+ 44,90 € · Sparschiene",ch:["Kaffee für zuhause","Blasenpflaster leer"]}
  ],

  sections:[
    {type:'price',bg:'hell',
     title:'Der Kassenzettel.',
     sub:'Nur die Fahrt, pro Person, zusätzlich zum D-Ticket. In Rom selbst brauchen wir genau eine Fahrkarte — den Rest laufen wir.',
     cols:['Strecke','Produkt','Preis'],
     rows:[
       {label:'Nürnberg → Ingolstadt → München',product:'RE (D-Ticket)',price:'0,00 €',free:true},
       {label:'München → Rom <span class="sparpreis">Sparschiene</span>',product:'ÖBB Nightjet · über Nacht',price:'44,90 €'},
       {label:'Rom, vier Tage · rund 40 km',product:'zu Fuß',price:'0,00 €',free:true},
       {label:'Testaccio → Termini, mit Gepäck',product:'Bus 75 · BIT-Ticket',price:'1,50 €'},
       {label:'Rom → München <span class="sparpreis">Sparschiene</span>',product:'ÖBB Nightjet · über Nacht',price:'44,90 €'},
       {label:'München → … → Nürnberg',product:'RE (D-Ticket)',price:'0,00 €',free:true}
     ],
     total:{label:'Summe pro Person',price:'91,30 €'},
     budget:{pct:61,text:'91 € von 150 € Budget · bleiben knapp 59 € für Eintritte, Eis und einen Kaffee zum Mitnehmen.'}},

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
     sub:'Rom ist kleiner, als es aussieht. Vom Bahnhof bis zum Petersdom sind es keine 5 km — die Stadt lässt sich komplett erlaufen. Auf der Karte oben liegt jede dieser Runden als Punktspur in den echten Straßen; wir gehen sie oben Schritt für Schritt ab.',
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
