# Schlemmer Bahn 🚆

Eine scrollbare Zugreise-Einladung: 3D-Karte mit fahrendem Zug, handgeschriebene
Reisenotizen, Autopilot, Musik am Grenzübergang, Kassenzettel & RSVP per Mail.

**Live:** https://vileend.github.io/franceTrip/

## Neue Reise bauen — in 2 Schritten

Die gesamte Reise (Texte, Route, Szenen, Preise, Musik) steht in **einer** Datei.
Der Rest ist wiederverwendbare Engine, die man nicht anfassen muss.

1. **`js/trip.js` anpassen** — alle Inhalte stehen dort als ein Datenobjekt
   (`SB.trip`). Felder-Referenz siehe unten.
2. **`<head>` in `index.html` anpassen** — Titel, Beschreibung & Open-Graph-Tags
   für Link-Vorschauen (Messenger/Suchmaschinen führen kein JavaScript aus,
   deshalb stehen diese doppelt).

Fertig. Alles andere (`js/core|mesh|ui|map|music|story|tee3d.js`,
`css/style.css`, Rest von `index.html`) ist generisch.

## Dateien

| Datei          | Rolle |
|----------------|-------|
| `js/trip.js`   | ⭐ **Die Reise.** Nur diese Datei pro Trip anpassen. |
| `js/core.js`   | Engine-Kern: Geräte-Erkennung, Routen-Mathematik, Daten-Vorbereitung |
| `js/mesh.js`   | 3D-Werkzeugkasten: Grundkörper, Modelle & Shader (Fahrzeug **und** T-Shirt) |
| `js/ui.js`     | Rendert alles aus den Trip-Daten: Hero, Karten, Inhaltsblöcke, RSVP, Footer |
| `js/map.js`    | MapLibre-Karte: Route, Halte, Zug-Icon, 3D-Gelände |
| `js/music.js`  | Musik am Meilenstein: Autostart ohne Knopfdruck (oder Dialog) — überspringt sich selbst, wenn der Trip keine Musik hat |
| `js/story.js`  | Scroll-Steuerung: geglätteter Render-Loop + Autopilot |
| `js/tee3d.js`  | Macht aus dem T-Shirt-Abschnitt ein drehendes 3D-Modell (SVG bleibt Rückfallebene) |
| `js/teapot.js` | Marschierende Teekanne (Ladeanzeige der Karte & Seitenende) |
| `js/zucker.js` | Zuckerdosen-Szene vor dem RSVP: marschiert, kippt, füllt die Tasse |
| `css/style.css`| Alle Styles (DB-rotes Design, generische Klassen) |
| `index.html`   | Generische Hülle mit leeren Containern |

Ladereihenfolge (in `index.html`):
`core → trip → mesh → ui → map → music → story → tee3d → teapot → zucker`.
Klassische `<script>`-Tags mit gemeinsamem `SB`-Namespace — läuft direkt von
Platte (`file://`) und auf GitHub Pages, kein Build-Schritt.

## `SB.trip` — Felder-Referenz

Alle Text-Felder dürfen HTML enthalten (`<b>`, `<span class="sparpreis">` …).

```js
SB.trip = {
  meta: {
    title: '…',                        // Browser-Tab (wird zur Laufzeit gesetzt)
    brand: { abbr:'SB', tagline:'…', logoTitle:'…' }   // Topbar-Logo & -Zeile
  },

  config: {
    email: '…',                        // RSVP-Mail-Empfänger
    sceneVh: 260,                      // Scrollhöhe pro Szene (mehr = gemächlicher)
    autoSecPerScene: 12,               // Autopilot-Tempo
    tickerLabel: 'Fahrtkosten p. P.'   // Label im Kosten-Ticker
  },

  hero: { eyebrow, title, sub, kicker, scrollhint, floaties:['🥐',…] },
  //     title darf <span>…</span> fürs rote Highlight enthalten.
  //     floaties: schwebende Emojis in Hero & RSVP (auch Krümel-Regen-Default).

  map: {                               // alles optional
    zoomMode:'fixed',                  // 'fixed' | 'steps' | 'scenes' – siehe unten
    zoom: 9.6,                         // Reise-Zoom für 'fixed'
    vehicle:{ model:'ice',             // 'ice'|'train'|'bus'|'car'|'croissant'
              color:'#EC0016', accent:'#FFD800', glass:'#26313E',
              light:'#F2F0EA',
              size:68,                      // px je WAGEN (Handy 52)
              cars:4,                       // Anzahl Wagen (Handy 3); nur 'ice'
              pitch:1.03,                   // Wagenabstand in Wagenlängen
              track:false,                  // → ohne Gleis (Standard: mit)
              wordmark:'ICE', logo:'DB',    // Beschriftung, false = ohne
              rail:'#9AA0A6', tie:'#544941', ballast:'#918B82',
              tapModel:'croissant',         // Antippen tauscht das Modell (null = aus)
              tapTitle:'…', tapAria:'…', tapToast:'…', tapToastBack:'…' },
    vehicle3d:false,                   // → flaches Emoji statt 3D-Modell
    trainEmoji:'🚆',                   // nur für die Emoji-Variante
    routeColor:'#EC0016', doneColor:'#FFD800', stopColor:'#EC0016',
    bg:'#EFEDE8', terrain:true,        // 3D-Gelände (Standard: aus, weil teuer)
    pitchScale: 1                      // Kamera-Neigung dämpfen (0…1)
  },

  route: {
    coords: [[lng,lat], …],            // Streckenpunkte, Hin- UND Rückweg
    stopIdx: [0, 5, …]                 // Indizes der Punkte mit Halte-Kreis
  },

  teapot: {                            // ODER null → keine Teekanne
    color:'#8FD0EE', shade:'#5FAAD2', trim:'#2E6F97',
    caption:'…',                       // Zeile unter der Kanne am Seitenende
    where:['loading','end'],           // wo sie auftaucht
    speed:0.34, step:2.1               // Lauftempo & Schrittfrequenz
  },

  zucker: {                            // ODER null → keine Zuckerdose
    title:'…', sub:'…',                // Überschrift & Vorspann des Abschnitts
    captions:['…','…','…','…','…'],    // eine Zeile je Füll-Runde + Finale
    bg:'hell',                         // optional: grauer Abschnitt
    ariaLabel:'…', replayTitle:'…'     // Vorlesetext & Tooltip zum Neustart
  },

  music: {                             // ODER null → Trip ohne Musik
    ytId:'…',                          // YouTube-Video-ID
    label:'La vie en rose — Zaz',      // ♪-Button-Tooltip
    volume: 65,
    triggerScene: 3,                   // ab dieser Szene startet der Titel
    gate: false,                       // false = ohne Dialog (Fahrt läuft weiter)
    autostart: true,                   // Standard: an — startet ohne Knopfdruck
    hint: '🇫🇷 … läuft. Einmal tippen.',// Hinweis statt Dialog
    // gate:{flag,title,text,go,skip}  = Dialog, hält Autopilot & Scrollen an
  },

  scenes: [{
    i0:0, i1:5,                        // Routen-PUNKT-Index Start/Ende der Etappe
    z0:11.8, z1:8.4,                   // Karten-Zoom Start/Ende
    p0:50, p1:48,                      // Kamera-Neigung (Pitch)
    b0:18, b1:-12,                     // Kamera-Drehung (Bearing)
    cost: 29,                          // Ticketkosten (summiert der Ticker)
    badge:'TGV', cls:'b-tgv',          // Badge-Text & -Farbe:
                                       //   b-re b-tram b-ter b-tgv b-bus b-herz
    t:'Titel', w:'„Witz“', x:'Kurztext',
    fact:'Fun Fact 💡', k:'+ 29,00 € · Sparpreis',
    frei:true,                         // grünes statt rotes Kostenlabel
    ch:['Chip 1','Chip 2']             // optionale Stichwort-Pillen
  }, …],

  sections: [                          // Inhaltsblöcke nach der Kartenfahrt
    { type:'price', bg:'hell', title, sub, cols:['Strecke','Produkt','Preis'],
      rows:[{label, product, price, free:true}, …],
      total:{label,price}, budget:{pct:73, text:'…'} },
    { type:'cards', title, sub, items:[{tag, title, html, price}, …] },
    { type:'tee',   bg:'hell', title, sub, emoji:'🥐', tag:'UT',
      motto1:'Zeile 1', motto2:'Zeile 2',   // kurz halten, ~18 Zeichen/Zeile
      ariaLabel:'…', caption:'…',
      cloth:'#F4F2EE', trim:'#DAD6CE', printColor:'#1B1F26',
      d3:false },                           // d3:false = flaches SVG statt 3D
    { type:'html',  title, sub, html:'<p>freier Block</p>' }
  ],

  rsvp: {
    eyebrow, title, text,
    buttons:['Ja','Sehr gerne'],       // 1. Button rot, weitere dunkel
    done:'…', fine:'…',
    mailSubject:'Schlemmer Bahn SB 143',   // Betreff: "<Button> — <mailSubject>"
    mailBody:'Ich bin dabei.',
    crumbs:['🥐','🌿',…]               // Konfetti beim Klick
  },

  footer: 'HTML-String'
};
```

### Zoom-Strategie (`map.zoomMode`)

Rasterkarten laden pro Zoomstufe einen komplett neuen Kachelsatz. Zoomt die
Kamera durchgehend rein und raus, lädt und verwirft der Browser die ganze
Fahrt über Kacheln — mit 3D-Gelände kommt pro Stufe noch ein neues Höhengitter
dazu. Genau das ruckelt. Deshalb:

| Modus | Verhalten | Kosten |
|-------|-----------|--------|
| `'fixed'` *(Standard)* | ein Zoom für die ganze Reise (`map.zoom`), Kamera schwenkt/neigt/dreht nur | am ruhigsten & schnellsten |
| `'steps'` | eine feste Stufe **pro Szene** (aus `z0`/`z1` gemittelt, auf halbe Stufen gerundet) — Wechsel nur an Szenengrenzen | Mittelweg |
| `'scenes'` | die durchgehend animierten Zoomfahrten aus `z0`→`z1` | filmisch, aber am teuersten |

`z0`/`z1` der Szenen bleiben in jedem Fall stehen — sie werden nur von
`'fixed'` ignoriert.

### Das 3D-Fahrzeug

Das Fahrzeug ist ein Modell in reinem WebGL (MapLibre-Custom-Layer) — keine
Fremdbibliothek, kein Modell-Download, kein Build-Schritt. Es zeigt immer in
Fahrtrichtung, bleibt bei jedem Zoom gleich groß (`vehicle.size` in
Bildschirm-Pixeln), sitzt auf der Geländehöhe und wird über `vehicle.color` /
`accent` / `glass` / `light` eingefärbt. Klappt WebGL nicht, fällt die Karte
lautlos auf `trainEmoji` zurück; `vehicle3d:false` erzwingt das Emoji.

**Der ICE ist ein ganzer Zug.** `model:'ice'` fährt als Triebzug aus
`cars` Wagen: Kopfwagen, Mittelwagen (die tragen die Stromabnehmer) und
zum Schluss derselbe Kopfwagen um 180° gedreht. `size` ist dabei die Länge
**eines Wagens** in Pixeln — der ganze Zug ist entsprechend `cars` mal so
lang.

**Das Gleis liegt auf der ganzen Strecke** und wird als Linie gezeichnet:
vier Layer über die Route (Schotterbett, Schwellenschraffur, zwei versetzte
Schienen). Das rechnet die GPU beim Linienzeichnen praktisch umsonst,
während tausende Schwellen als Körper sinnlos teuer wären — und unter dem
Zug noch einmal ein plastisches Gleisstück wäre dasselbe zweimal. Die
Breiten kommen aus `SB.mesh.GAUGE` (halbe Breiten in Modelllängen), aus
denen auch die Räder ihre Spurweite nehmen; nur so läuft der Zug wirklich
auf seinen Schienen statt daneben. `track:false` nimmt das Gleis weg.

Jeder Wagen wird **einzeln** auf die Route gesetzt, um genau seinen Abstand
zur Zugspitze zurückversetzt. Dafür misst `js/map.js` die Route einmal in
Mercator aus: nur dort lassen sich die in Pixeln festgelegten Wagenabstände
in Streckenlängen umrechnen. Der Zug legt sich damit in Kurven an die
Strecke, statt sie als starrer Balken abzuschneiden. Seine Blickrichtung
nimmt jeder Wagen aus der Sehne über die eigene Länge — ein reiner
Segment-Tangens würde an jedem Routenpunkt umspringen.

Beschriftung (`wordmark`, `logo`) wird in ein kleines Canvas gezeichnet und
als Textur auf die Flanken des Kopfwagens gelegt — derselbe Weg wie beim
Brustdruck des T-Shirts. `false` lässt sie weg.

**Warum die Modelle gerechnet und nicht geladen werden.** Ein fertiger
Wagen sind rund 5 000 Dreiecke, also gut 600 kB rohe Eckdaten — als Datei
ausgeliefert wäre das ein Vielfaches der Zeit, die das Rechnen kostet
(zusammen etwa 60 ms, einmalig). Dazu käme ein Build-Schritt, den dieses
Projekt bewusst nicht hat. Gerechnet wird deshalb im Browser, aber **nur
einmal**: jedes Netz landet nach dem ersten Bauen in seinem GPU-Puffer und
bleibt dort. Ein Modellwechsel beim Antippen sortiert danach nur noch die
Teileliste um und kostet gar nichts mehr.

| `model` | Form |
|---------|------|
| `'ice'` | ICE 3 als mehrteiliger Triebzug auf Gleis: heruntergezogene Nase mit umlaufender Bugscheibe, Fensterband mit einzelnen Scheiben, roter Zierstreifen unter den Fenstern, Beschriftung, Drehgestelle mit Rädern, einarmiger Stromabnehmer auf den Mittelwagen |
| `'train'` | Lok mit gelber Bugpartie + Wagen |
| `'bus'` | Reisebus |
| `'car'` | Auto |
| `'croissant'` | ein Hörnchen mit diagonalen Wickeln |

**Antippen:** Ein Klick aufs Fahrzeug tauscht `model` gegen `tapModel` und
wieder zurück — beim Frankreich-Trip fährt der ICE dann als Croissant weiter,
und zwar als ganzer Croissant-Zug: die Aufstellung bleibt, nur das Wagen-Netz
wird getauscht. Das Gleis bleibt liegen.
Trefferfläche ist eine unsichtbare Schaltfläche in der Kartenmitte (dort
fährt das Fahrzeug immer), damit das Ganze auch per Tastatur bedienbar
bleibt — ein WebGL-Layer kennt keine anklickbaren Objekte. In der
Emoji-Rückfallebene wird stattdessen das Symbol getauscht (`tapEmoji`).
`tapModel:null` schaltet den Gag ab.

### Warum es rund aussieht

Alle Modelle sind **parametrische Flächen**, keine Klötzchen: `SB.mesh.surface(P,…)`
tastet eine Funktion `P(u,v)` ab und leitet die Normalen aus den Ableitungen
ab — daher die weichen Kanten. Darauf setzen `revolve` (Rotationskörper),
`sweep` (Rohr entlang einer Kurve) und `ring` (Fläche zwischen zwei Ringen)
auf. Die Farbfunktion färbt jeden Punkt einzeln — so entstehen Dachrand und
Schürze des ICE ohne zusätzliche Geometrie. Wo eine Kante scharf stehen soll
(Fensterband, Scheiben, Zierstreifen, Bugscheibe), liegt stattdessen eine
hauchdünn nach außen versetzte Fläche auf der Hülle; sie folgt deren Rundung,
darf sich mit ihresgleichen aber nicht überlappen. `detail` regelt die
Segmentzahl: auf der Karte gröber, im eigenen Canvas feiner.

### Das 3D-T-Shirt

Der Abschnitt `type:'tee'` wird von `js/tee3d.js` zu einem langsam drehenden
3D-Modell aufgerüstet. Der Brustdruck (Emoji + Motto) wird in ein Canvas
gezeichnet und als Textur aufgelegt — der Text bleibt dadurch scharf und
steht weiterhin in `js/trip.js`. Gezeichnet wird nur, solange das Shirt im
Bild ist; bei `prefers-reduced-motion` steht es still. Ohne WebGL bleibt die
gezeichnete SVG-Variante stehen, `d3:false` erzwingt sie. `cut:'women'`
(Standard) ist tailliert mit Cap-Sleeves und rundem Ausschnitt,
`cut:'unisex'` schneidet gerade.

### Die marschierende Teekanne

`js/teapot.js` hängt eine kleine 3D-Teekanne ein, die von links nach rechts
durchs Bild stapft: Beine im Wechsel, Körper im Takt wippend, Deckel
hüpfend, Löffel hinterherwackelnd. Sie läuft während die Karte lädt und
noch einmal am Seitenende. Gezeichnet wird nur, solange sie sichtbar ist —
und bei `prefers-reduced-motion` bleibt sie stehen.

### Die Zuckerdose

`js/zucker.js` hängt ganz ans Ende von `#content` — also direkt vor das
RSVP — eine gezeichnete Szene: eine Zuckerdose marschiert von links nach
rechts zur Teetasse. Sie hat zwei Arme; der linke hebt den Deckel hoch, der
rechte schwenkt den Löffel über die Tasse und kippt ihn aus, worauf feiner
Zucker in die Tasse rieselt. Vier Runden lang, die Tasse wird jedes Mal
voller, zum Schluss quillt sie über. Unter der Bühne steht je Runde eine
Zeile aus `captions`, ein Tipp auf die Szene startet sie neu.

Gezeichnet ist alles als Trickfilm-Cel: gemalter, stillstehender
Hintergrund, darüber flache Farbflächen mit Tuschekontur, dazu Vignette und
Filmkorn. Ein Rausch-Filter verschiebt die Kanten minimal, damit die Linien
nach Hand und nicht nach Kurvenlineal aussehen — auf Handys bleibt er aus.
Bewegt wird mit 12 Zeichnungen je Sekunde („auf Zweien"), nicht mit
CSS-Keyframes: `zustand(t)` beschreibt die Szene für jeden Zeitpunkt.
Deshalb sind Standbild bei `prefers-reduced-motion`, Neustart per Klick und
das Pausieren außerhalb des Bildschirms derselbe Codepfad.

### Tipps fürs Routen-Bauen

- Koordinaten sind `[Längengrad, Breitengrad]` (Lng zuerst — wie GeoJSON).
- Punkte entlang echter Bahnstrecken setzen; 30–50 Punkte reichen für eine
  glaubwürdige Linie. Für den Rückweg die Punkte gespiegelt anhängen.
- `i0`/`i1` der Szenen sind Indizes in `route.coords` — die Engine rechnet
  sie selbst in Streckenanteile um.
- Kamera: `z` 7–9 für Überblick, 11–12.5 für Städte; `p` (Pitch) 45–56 wirkt
  filmisch; `b` (Bearing) langsam drehen lassen (±30–60 zwischen Szenen).

## Veröffentlichen: GitHub Pages mit Branch-Vorschauen

`.github/workflows/pages.yml` veröffentlicht bei **jedem** Push. Da Pages pro
Repository nur eine Seite ausliefert, baut `.github/build-site.sh` die Seite
jedes Mal komplett neu zusammen:

| URL | Inhalt |
|-----|--------|
| `/` | Stand von `main` |
| `/previews/<branch>/` | Stand jedes anderen Branches |
| `/previews/` | Übersicht mit Links zu allen Vorschauen |

Gelöschte Branches verschwinden beim nächsten Deploy von selbst, weil bei
jedem Lauf alle Branches frisch eingelesen werden. Lokal ausprobieren:

```sh
DEFAULT_BRANCH=main bash .github/build-site.sh   # baut ./_site
```

Zwei Einstellungen im Repository, falls der erste Lauf hakt:

1. **Settings → Pages → Source** muss auf *GitHub Actions* stehen. Der
   Workflow stellt das über `actions/configure-pages` mit `enablement: true`
   selbst um; schlägt das an fehlenden Rechten fehl, einmal von Hand setzen.
2. **Settings → Environments → `github-pages` → Deployment branches**: für
   Vorschauen aus Feature-Branches muss *All branches* erlaubt sein. Steht
   dort nur der Standard-Branch, bricht der Deploy-Schritt auf anderen
   Branches mit „Branch is not allowed to deploy“ ab.

## Technische Notizen

- **Autoplay:** Browser erlauben *hörbaren* Ton nur, wenn die Seite schon
  einmal berührt wurde (Klick, Tipp, Taste — Scrollen und Mausrad zählen
  ausdrücklich **nicht**); *stummer* Ton ist dagegen immer erlaubt. Daraus
  besteht der Startweg in `js/music.js` (`autostart`, Standard an): am
  Meilenstein wird direkt hörbar gestartet, ~1,4 s später prüft der Code per
  `getPlayerState()`/`isMuted()` nach. Kam kein Ton durch, läuft der Titel
  **stumm** weiter, der ♪-Knopf pulsiert, und die nächste Berührung
  *irgendwo* auf der Seite dreht ihn auf — ein Druck auf ♪ ist nie nötig.
  Klappt auch das nicht, meldet sich der Prüfer erneut an und versucht es
  beim nächsten Griff wieder. Lautstärke wird immer sanft von 0 hochgefadet.
  Mit `gate:{…}` gibt es statt Autostart weiter den Dialog, der Autopilot und
  Scrollen anhält, bis geklickt wurde.
- **Flüssige Fahrt:** Autopilot, Glättung und Zeichnen laufen in *einer*
  `requestAnimationFrame`-Schleife (`js/story.js`). Vorher rief eine zweite
  Schleife das Zeichnen erst auf das Scroll-Ereignis hin auf — wann das
  zugestellt wird, entscheidet der Browser, und daraus entstand ein
  ungleichmäßiger Bildabstand. Zusätzlich gedrosselt: die zurückgelegte
  Strecke (GeoJSON-Quelle, alle 120 ms statt jedes Bild) und die
  Story-Karten (nur die sichtbare wird angefasst).
- **Startweg:** `maplibre-gl.js` ist das größte Paket der Seite und stand
  früher als blockierendes `<script>` im Body — die ganze Seite wartete darauf.
  Jetzt steht im `<head>` nur ein `<link rel="preload">` (der Download läuft
  also weiter sofort an), eingehängt wird die Bibliothek erst von `js/map.js`.
  Schriften und Karten-CSS kommen aus demselben Grund als `media="print"`, das
  beim `onload` auf `all` umgeschaltet wird: Text steht, bevor irgendein CDN
  geantwortet hat.
- **Kacheln auf Vorrat** (`js/map.js`): Startpunkt und Zoom stehen im Trip,
  die Kachel-Adressen lassen sich also ausrechnen, *bevor* MapLibre da ist.
  Beim Seitenaufruf holt die Engine deshalb schon den ersten Bildausschnitt in
  den Browser-Cache, und während der Fahrt immer ~5 % Strecke im Voraus,
  zwei Kacheln links und rechts der Linie. Es sind exakt dieselben Adressen,
  die MapLibre gleich darauf anfordert (gleiche Host-Verteilung `(x+y) % 3`,
  gleiche Zoomstufe `round(zoom + 1)` für 256er-Kacheln) — also **kein**
  zusätzlicher Traffic, nur früher. Der Vorrat pausiert, solange die Karte am
  aktuellen Bild lädt, und bleibt bei „Datensparen“/2G ganz aus.
- **`@2x`-Kacheln** nur auf Bildschirmen, die sie auflösen können
  (`devicePixelRatio > 1.2`): auf einem 1×-Monitor sind sie die vierfache
  Datenmenge fürs identische Bild.
- **Performance auf Phones:** kein 3D-Gelände, keine `backdrop-filter`-Blurs,
  einfache Tiles, flachere Kamera, gröber tesselliertes Fahrzeug — gesteuert
  über `SB.isMobile`/`SB.lowPower` in `core.js`.
- **Nichts zeichnen, was niemand sieht:** immer nur die aktuelle Story-Karte
  ist `visible` (die anderen neun bekämen sonst je eine Compositing-Ebene mit
  Blur), schwebende Emojis pausieren außerhalb des Bildes, die Ladeanzeige
  verschwindet samt WebGL-Kontext der Teekanne, und der YouTube-Player lädt
  erst in einer Leerlaufpause statt beim ersten Scroll.
- **3D-Gelände** kostet pro Bild einen kompletten zusätzlichen Renderdurchgang
  und ist deshalb standardmäßig **aus**. Wer die Berge sehen will: `map.terrain:true`.
- **`prefers-reduced-motion`** wird respektiert: keine Animationen, kein
  Autopilot, Karten-Kamera bleibt flach.
