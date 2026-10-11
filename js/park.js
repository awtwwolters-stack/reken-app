// "Mijn park" (BACKLOG D15, M-02): every child builds their own animal park with the stars they
// earn, and a running story tells why the animals come back.
//
// Two kinds of stars: profile.stars counts every star ever earned and never goes down; the animals
// (motivation.js), the story chapters and the family goal follow it. Buying only empties the
// spaarpot: what is left of the earned stars after the prices of everything bought. So buying
// never takes away an animal or a chapter.
//
// profile.park = { items: [{ id, price, tile }], animalTiles: { animalIndex: tile }, storyRead, saveFor }
// The price paid is stored with each item, so the spaarpot stays right if a price changes later.

const PARK_COLUMNS = 6;
const PARK_START_ROWS = 3;
// Every new animal opens one more row ("a new piece of park"), up to this many.
const PARK_MAX_ROWS = 10;

// The shop. `chapter`: the story chapter that brings the item into the shop (0 = from the start).
// Small 3-10 (something after every session), middle 25-60 (save 1-2 sessions), big 80-250
// (save 1-2 weeks). Only emoji up to Emoji 13.0, which the oldest iPad (iOS 15) shows.
const PARK_ITEMS = [
  { id: 'tulp', emoji: '🌷', name: 'Tulp', price: 3, chapter: 0 },
  { id: 'madelief', emoji: '🌼', name: 'Bloem', price: 3, chapter: 0 },
  { id: 'rots', emoji: '🪨', name: 'Rots', price: 5, chapter: 0 },
  { id: 'boom', emoji: '🌳', name: 'Boom', price: 8, chapter: 0 },
  { id: 'bankje', emoji: '🪑', name: 'Bankje', price: 10, chapter: 0 },
  { id: 'paddenstoel', emoji: '🍄', name: 'Paddenstoel', price: 4, chapter: 1 },
  { id: 'boomstam', emoji: '🪵', name: 'Boomstam', price: 6, chapter: 1 },
  { id: 'den', emoji: '🌲', name: 'Dennenboom', price: 8, chapter: 1 },
  { id: 'lantaarn', emoji: '🏮', name: 'Lantaarn', price: 10, chapter: 2 },
  { id: 'telescoop', emoji: '🔭', name: 'Telescoop', price: 45, chapter: 2 },
  { id: 'plantje', emoji: '🌱', name: 'Plantje', price: 3, chapter: 3 },
  { id: 'sla', emoji: '🥬', name: 'Moestuin', price: 6, chapter: 3 },
  { id: 'potplant', emoji: '🪴', name: 'Potplant', price: 7, chapter: 3 },
  { id: 'vijver', emoji: '🌊', name: 'Vijver', price: 40, chapter: 4 },
  { id: 'fontein', emoji: '⛲', name: 'Fontein', price: 90, chapter: 4 },
  { id: 'kaars', emoji: '🕯️', name: 'Kaarsje', price: 5, chapter: 5 },
  { id: 'tent', emoji: '⛺', name: 'Tent', price: 30, chapter: 5 },
  { id: 'bamboe', emoji: '🎋', name: 'Bamboe', price: 6, chapter: 6 },
  { id: 'bed', emoji: '🛏️', name: 'Bed', price: 25, chapter: 6 },
  { id: 'palmboom', emoji: '🌴', name: 'Palmboom', price: 10, chapter: 7 },
  { id: 'reuzenrad', emoji: '🎡', name: 'Reuzenrad', price: 200, chapter: 7 },
  { id: 'zeilboot', emoji: '⛵', name: 'Zeilboot', price: 45, chapter: 8 },
  { id: 'strand', emoji: '🏖️', name: 'Strand', price: 60, chapter: 8 },
  { id: 'bladeren', emoji: '🍂', name: 'Bladerhoop', price: 3, chapter: 9 },
  { id: 'appel', emoji: '🍎', name: 'Appel', price: 4, chapter: 9 },
  { id: 'riet', emoji: '🌿', name: 'Riet', price: 4, chapter: 10 },
  { id: 'kano', emoji: '🛶', name: 'Kano', price: 35, chapter: 10 },
  { id: 'regenboog', emoji: '🌈', name: 'Regenboog', price: 120, chapter: 11 },
  { id: 'kasteel', emoji: '🏰', name: 'Kasteel', price: 250, chapter: 11 },
  { id: 'kampvuur', emoji: '🔥', name: 'Kampvuur', price: 15, chapter: 12 },
  { id: 'vulkaan', emoji: '🌋', name: 'Vulkaan', price: 180, chapter: 12 },
  { id: 'bloesem', emoji: '🌸', name: 'Bloesem', price: 4, chapter: 13 },
  { id: 'zonnebloem', emoji: '🌻', name: 'Zonnebloem', price: 4, chapter: 13 },
  { id: 'draaimolen', emoji: '🎠', name: 'Draaimolen', price: 150, chapter: 13 },
  { id: 'vuurwerk', emoji: '🎆', name: 'Vuurwerk', price: 80, chapter: 14 },
  { id: 'eiland', emoji: '🏝️', name: 'Eilandje', price: 220, chapter: 14 }
];

// "Het vergeten park". Chapter 0 opens the park; chapter n arrives with animal n (COLLECTION[n - 1]
// in motivation.js) and ends with a hint about the next animal, to make the child curious.
// {naam} becomes the child's name. Short sentences: the youngest listen with 🔊.
const STORY = [
  {
    title: 'Het roestige hek',
    text: 'Achter een oude muur vindt {naam} een roestig hek. Het piept als je het openduwt. Daarachter ligt een park vol onkruid, maar er is geen dier te zien. Op de grond ligt een briefje: "Dit park was ooit vol dieren. Maak het weer mooi, dan komen ze terug. Elk dier neemt iets mee. Groetjes, Opa Bram, de oude parkwachter." Ineens schiet er iets roods de struiken in. Was dat een staart?'
  },
  {
    title: 'Een vos in de struiken',
    text: 'Uit de struiken stapt een vos met een rode staart. "Ik ben Fien," zegt ze. "Ik woonde hier vroeger. Nu het park weer mooi wordt, durf ik terug te komen." Fien legt een oud papiertje neer, met een vreemd teken erop. "Dit lag in mijn hol. Wat zou het zijn?" Die nacht klinkt er hoog in een boom: oehoe, oehoe...'
  },
  {
    title: 'Oehoe!',
    text: 'In de oude boom zit een uil met grote ogen. "Ik ben Otto," zegt hij. "Laat dat papiertje eens zien." Otto kijkt er heel lang naar. "Dit is een stukje van een kaart! Opa Bram heeft hem in veertien stukjes gescheurd. Elk dier heeft er één." Otto geeft {naam} het tweede stukje. Nog twaalf te gaan! Die middag beweegt er iets heel langzaam door het hoge gras. Iets met een schild...'
  },
  {
    title: 'De oudste bewoner',
    text: 'Heel, heel langzaam komt er een schildpad aan. "Hallo {naam}. Ik ben Tuur, en ik ben al honderd jaar oud." Tuur kende Opa Bram nog. "Vroeger was het hier zo druk," vertelt hij. "Overal dieren, bloemen en lachende kinderen. Maar toen Opa Bram oud werd, werd het park stil." Tuur geeft het derde stukje van de kaart. Bij de oude vijver komen ineens belletjes omhoog. Blub, blub, blub...'
  },
  {
    title: 'Belletjes in de vijver',
    text: 'Uit het water steekt een paarse arm. En nog een. En nog een! "Hoi! Ik ben Olly," zegt een octopus. "Ik heb acht armen, maar mijn vijver is bijna leeg." Misschien kan {naam} een nieuwe vijver kopen in de winkel? Olly geeft het vierde stukje van de kaart. Er staan golven op getekend. Die nacht klinkt er een harde brul door het park. ROAAAR!'
  },
  {
    title: 'Wie brult daar?',
    text: 'Achter een rots zit een grote leeuw. Hij ziet er stoer uit. "Ik ben Leo," bromt hij. Dan fluistert hij: "Maar ik ben stiekem een beetje bang in het donker. Daarom brul ik zo hard." {naam} belooft dat er lampjes komen in het park. Leo is zo blij dat hij het vijfde stukje van de kaart geeft. Even later ritselt het in het bamboe. Wie eet daar zo luid?'
  },
  {
    title: 'Een slaperige gast',
    text: 'In het bamboe zit een panda. Hij eet, en eet, en valt dan in slaap. Midden in een hap! "Oh, hallo," gaapt hij. "Ik ben Pim." Pim slaapt op het zesde stukje van de kaart, als een kussentje. {naam} mag het hebben, maar dan wil Pim wel een echt bed. Boven het hek steekt ineens een heel lange nek uit. Wie is er zo groot?'
  },
  {
    title: 'Uitzicht vanaf de top',
    text: 'Over het hek kijkt een giraf. "Ik ben Gijs," zegt hij. "Van hierboven zie ik alles." Hij tilt {naam} op zijn rug. Wat een uitzicht! Achter het park ligt de zee. Dat wist niemand. Gijs heeft het zevende stukje van de kaart tussen zijn hoorntjes. Ver in zee spat het water hoog op. Daar zwemt iets snels...'
  },
  {
    title: 'Een sprong uit de zee',
    text: 'Een dolfijn springt hoog uit het water. "Hoi, ik ben Dex!" roept hij. "Leg alle stukjes van de kaart eens naast elkaar." {naam} legt ze op een rij. Het park staat erop, met overal water eromheen. "Het park ligt op een eiland!" zegt Dex. Hij geeft het achtste stukje. Onder een hoop bladeren prikt er iets. Au!'
  },
  {
    title: 'Het kistje',
    text: 'Onder de bladeren zit een egeltje. "Sorry voor het prikken," zegt ze. "Ik ben Eef, en ik graaf graag." Eef graaft en graaft en vindt iets hards: een oud houten kistje! Op het deksel staat: "Voor wie het park weer mooi maakt." Maar het kistje zit op slot. Eef geeft het negende stukje van de kaart. Bij de vijver klinkt het: kwaak, kwaak!'
  },
  {
    title: 'Waar is de sleutel?',
    text: 'Op een blad in de vijver zit een kikker. "Ik ben Koos," kwaakt hij. "Ik weet iets over dat kistje! Opa Bram verstopte de sleutel waar het glinstert." Maar waar glinstert het in het park? Koos springt weg en laat het tiende stukje van de kaart achter. \'s Avonds glinstert er iets in het gras. Zilveren glitters, als kleine sterretjes...'
  },
  {
    title: 'Glitters in het gras',
    text: 'Een eenhoorn stapt het park in. Overal waar ze loopt, glinstert het gras. "Ik ben Elin," zegt ze zacht. Ze geeft het elfde stukje en raakt alle stukjes aan met haar hoorn. Ze gaan gloeien! Er verschijnt een kruisje op de kaart, maar je ziet het nog maar half. Er missen nog drie stukjes. Achter de heuvel stijgt warme rook op. Daar spuwt iets vuur!'
  },
  {
    title: 'Vuur achter de heuvel',
    text: 'Achter de heuvel zit een draak. Een kleine draak, met lieve ogen. "Niet schrikken," zegt ze. "Ik ben Doris. Ik spuw alleen vuur om lampjes aan te steken." Pfff! Alle lantaarns in het park gaan branden. Leo de leeuw is er heel blij mee. Doris geeft {naam} het twaalfde stukje. In het licht van de lantaarns fladderen ineens heel veel kleurige vleugels.'
  },
  {
    title: 'De weg naar de kust',
    text: 'Honderden vlinders dansen door het park. De mooiste heet Vera. "Volg ons!" zegt ze, en de vlinders vliegen naar het strand. Vera geeft {naam} het dertiende stukje. "Het laatste stukje heeft het grootste dier van allemaal," fluistert ze. Ver op zee spuit een hoge straal water omhoog. Psssjjj!'
  },
  {
    title: 'Het geheim van Opa Bram',
    text: 'Een enorme walvis zwemt naar het strand. "Hallo {naam}, ik ben Wim," zegt hij met een diepe stem. "Ik heb lang op je gewacht." Wim geeft het laatste stukje. De kaart is compleet! Het kruisje staat bij de oudste boom. Daar glinstert iets in de grond: de sleutel! Het kistje gaat open. Er zit een brief in: "Lieve {naam}, het park is van jou. Het echte geheim? Jij hebt het zelf gebouwd, ster voor ster. Opa Bram." Wordt vervolgd...'
  }
];

function emptyPark() {
  return { items: [], animalTiles: {}, storyRead: 0, saveFor: null };
}

// Read-only view of a child's park (a child who never opened it has none stored yet).
function parkOf(profile) {
  return Object.assign(emptyPark(), (profile && profile.park) || {});
}

// The park as stored, created on the first write.
function ensurePark(profile) {
  profile.park = Object.assign(emptyPark(), profile.park || {});
  return profile.park;
}

function parkItem(id) {
  return PARK_ITEMS.find((item) => item.id === id) || null;
}

function spentStars(profile) {
  return parkOf(profile).items.reduce((n, item) => n + (item.price || 0), 0);
}

// The spaarpot: earned minus spent.
function walletStars(profile) {
  return (profile.stars || 0) - spentStars(profile);
}

function animalsInPark(profile) {
  return unlockedCharacters(profile.stars || 0).length;
}

function chaptersUnlocked(profile) {
  return Math.min(STORY.length, 1 + animalsInPark(profile));
}

function unreadChapters(profile) {
  return Math.max(0, chaptersUnlocked(profile) - (parkOf(profile).storyRead || 0));
}

function markChapterRead(profile, chapter) {
  const park = ensurePark(profile);
  park.storyRead = Math.max(park.storyRead || 0, chapter + 1);
}

function chapterText(chapter, name) {
  return STORY[chapter].text.replace(/\{naam\}/g, name || 'je');
}

function parkRows(profile) {
  return Math.min(PARK_MAX_ROWS, PARK_START_ROWS + animalsInPark(profile));
}

function parkTileCount(profile) {
  return parkRows(profile) * PARK_COLUMNS;
}

// Room for things you buy: what is free now, and never so much that an animal still to come would
// find the full-grown park without a place.
function maxParkItems(profile) {
  return Math.min(parkTileCount(profile) - animalsInPark(profile), PARK_MAX_ROWS * PARK_COLUMNS - COLLECTION.length);
}

function shopItems(profile) {
  const chapters = chaptersUnlocked(profile);
  return PARK_ITEMS.filter((item) => item.chapter < chapters);
}

// Buying happens after practising: on a day this child finished a session (on any iPad).
function shopOpenToday(profile, today = new Date()) {
  return (profile.practiceDays || []).includes(dateKey(today));
}

// Why this item can't be bought now, or null: 'locked' (later chapter), 'closed' (not practised
// today), 'tooExpensive', 'full'.
function buyRefusal(profile, itemId, today = new Date()) {
  const item = parkItem(itemId);
  if (!item || item.chapter >= chaptersUnlocked(profile)) return 'locked';
  if (!shopOpenToday(profile, today)) return 'closed';
  if (walletStars(profile) < item.price) return 'tooExpensive';
  if (parkOf(profile).items.length >= maxParkItems(profile)) return 'full';
  return null;
}

// What stands on each tile: null, { kind: 'animal', index } or { kind: 'item', index } (index into
// COLLECTION or park.items). Stored tiles are kept; anything without a valid, free tile (a new
// animal, or a clash after a sync) gets the first free tile, animals first.
function parkLayout(profile) {
  const park = parkOf(profile);
  const tiles = new Array(parkTileCount(profile)).fill(null);
  const pieces = [];
  for (let i = 0; i < animalsInPark(profile); i++) pieces.push({ kind: 'animal', index: i, tile: park.animalTiles[i] });
  park.items.forEach((item, i) => pieces.push({ kind: 'item', index: i, tile: item.tile }));
  const homeless = [];
  pieces.forEach((piece) => {
    const t = piece.tile;
    if (Number.isInteger(t) && t >= 0 && t < tiles.length && !tiles[t]) tiles[t] = { kind: piece.kind, index: piece.index };
    else homeless.push(piece);
  });
  homeless.forEach((piece) => {
    const free = tiles.indexOf(null);
    if (free >= 0) tiles[free] = { kind: piece.kind, index: piece.index };
  });
  return tiles;
}

// Stores where everything stands, so it stays put on every iPad.
function saveParkLayout(profile, tiles) {
  const park = ensurePark(profile);
  park.animalTiles = {};
  tiles.forEach((piece, tile) => {
    if (!piece) return;
    if (piece.kind === 'animal') park.animalTiles[piece.index] = tile;
    else park.items[piece.index].tile = tile;
  });
}

// Buys an item and puts it on the first free tile. Returns that tile, or null when refused.
function buyItem(profile, itemId, today = new Date()) {
  if (buyRefusal(profile, itemId, today)) return null;
  const item = parkItem(itemId);
  const tiles = parkLayout(profile);
  const tile = tiles.indexOf(null);
  if (tile < 0) return null;
  const park = ensurePark(profile);
  park.items.push({ id: item.id, price: item.price, tile });
  tiles[tile] = { kind: 'item', index: park.items.length - 1 };
  saveParkLayout(profile, tiles);
  if (park.saveFor === item.id) park.saveFor = null;
  return tile;
}

// Moves what stands on one tile to another; whatever stood there swaps places.
function moveInPark(profile, fromTile, toTile) {
  const tiles = parkLayout(profile);
  if (!tiles[fromTile] || toTile < 0 || toTile >= tiles.length || fromTile === toTile) return false;
  [tiles[fromTile], tiles[toTile]] = [tiles[toTile], tiles[fromTile]];
  saveParkLayout(profile, tiles);
  return true;
}

function setSaveFor(profile, itemId) {
  ensurePark(profile).saveFor = itemId;
}

// The item the child saves for, while it is in the shop.
function saveForItem(profile) {
  const item = parkItem(parkOf(profile).saveFor);
  return item && item.chapter < chaptersUnlocked(profile) ? item : null;
}
