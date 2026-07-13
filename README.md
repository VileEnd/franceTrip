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

Fertig. Alles andere (`js/core|ui|map|music|story.js`, `css/style.css`,
Rest von `index.html`) ist generisch.

## Dateien

| Datei          | Rolle |
|----------------|-------|
| `js/trip.js`   | ⭐ **Die Reise.** Nur diese Datei pro Trip anpassen. |
| `js/core.js`   | Engine-Kern: Geräte-Erkennung, Routen-Mathematik, Daten-Vorbereitung |
| `js/ui.js`     | Rendert alles aus den Trip-Daten: Hero, Karten, Inhaltsblöcke, RSVP, Footer |
| `js/map.js`    | MapLibre-Karte: Route, Halte, Zug-Icon, 3D-Gelände |
| `js/music.js`  | Musik am Meilenstein inkl. Dialog — überspringt sich selbst, wenn der Trip keine Musik hat |
| `js/story.js`  | Scroll-Steuerung: geglätteter Render-Loop + Autopilot |
| `css/style.css`| Alle Styles (DB-rotes Design, generische Klassen) |
| `index.html`   | Generische Hülle mit leeren Containern |

Ladereihenfolge (in `index.html`): `core → trip → ui → map → music → story`.
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
    trainEmoji:'🚆', routeColor:'#EC0016', doneColor:'#FFD800',
    stopColor:'#EC0016', bg:'#EFEDE8', terrain:false   // terrain:false = kein 3D
  },

  route: {
    coords: [[lng,lat], …],            // Streckenpunkte, Hin- UND Rückweg
    stopIdx: [0, 5, …]                 // Indizes der Punkte mit Halte-Kreis
  },

  music: {                             // ODER null → Trip ohne Musik
    ytId:'…',                          // YouTube-Video-ID
    label:'La vie en rose — Zaz',      // ♪-Button-Tooltip
    volume: 65,
    triggerScene: 3,                   // ab dieser Szene erscheint der Dialog
    gate: { flag:'🇫🇷', title:'…', text:'…', go:'Musik an & weiter ▶', skip:'Ohne Musik weiter' }
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
      ariaLabel:'…', caption:'…' },
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

### Tipps fürs Routen-Bauen

- Koordinaten sind `[Längengrad, Breitengrad]` (Lng zuerst — wie GeoJSON).
- Punkte entlang echter Bahnstrecken setzen; 30–50 Punkte reichen für eine
  glaubwürdige Linie. Für den Rückweg die Punkte gespiegelt anhängen.
- `i0`/`i1` der Szenen sind Indizes in `route.coords` — die Engine rechnet
  sie selbst in Streckenanteile um.
- Kamera: `z` 7–9 für Überblick, 11–12.5 für Städte; `p` (Pitch) 45–56 wirkt
  filmisch; `b` (Bearing) langsam drehen lassen (±30–60 zwischen Szenen).

## Technische Notizen

- **Autoplay:** Browser erlauben Ton nur nach echter Geste — deshalb der
  Dialog am Musik-Meilenstein (Klick auf sichtbaren Button = überall
  zuverlässig). Lautstärke wird sanft von 0 hochgefadet.
- **Performance auf Phones:** kein 3D-Gelände, keine `backdrop-filter`-Blurs,
  einfache Tiles, flachere Kamera — gesteuert über `SB.isMobile`/`SB.lowPower`
  in `core.js`.
- **`prefers-reduced-motion`** wird respektiert: keine Animationen, kein
  Autopilot, Karten-Kamera bleibt flach.
