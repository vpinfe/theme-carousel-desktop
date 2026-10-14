// Carousel Desktop - the backglass picture behind a row of wheels, with the selected table's
// name, manufacturer and authors above the row.
//
// This file does four things, in this order: note that there are no options, draw the list,
// draw the selection, and hand every message to core. The list is the row of wheels. Input,
// audio, preloading, layout, the loading indicator, attract mode, turning the page for a
// sideways screen and the backglass and score view pages are core's.

const vpin = new VPinFECore();
window.vpin = vpin;                  // core and its overlays look for this name
window.receiveEvent = receiveEvent;  // core delivers every message through this one

start();

async function start() {
  vpin.init();
  await vpin.ready;                  // the tables and the layout are in

  // Input. Core moves the wheel, pages it and opens the menu and the collection picker.
  // Select is the one action it leaves to a theme.
  vpin.registerInputHandler((action) => {
    if (action === "select") vpin.launchTable(vpin.getCurrentTableIndex());
  });

  draw();
  document.body.dataset.ready = "true";
}

// --- 1. Options ---------------------------------------------------------------------
// This theme has no options, so there is no options.json. A theme that declares some reads
// them here from vpin.themeConfig.

// --- 2. The list --------------------------------------------------------------------
// activeList() is the list core is moving: the tables, or the collections while the picker
// is open. indexAfter(n) is core's wrap-around: it is the reason this file has no modulo.
//
// Up to nine wheels sit in the row with the selected one in the middle; the collection
// picker shows seven, larger.

const REACH = { tables: 4, collections: 3 };   // wheels either side of the selected one
const MOVE_MS = 180;                           // the wheel transition in style.css

const stage = document.querySelector(".stage");
const wheelsEl = document.getElementById("wheels");
const cards = new Map();

function place(card, offset, reach) {
  const selected = offset === 0;
  if (selected && !card.classList.contains("selected")) {
    card.classList.remove("shake");
    card.offsetWidth;                // so the animation can start again
    card.classList.add("shake");
  }
  card.style.setProperty("--offset", String(offset));
  card.dataset.offset = String(offset);
  if (selected) card.setAttribute("aria-current", "true");
  else card.removeAttribute("aria-current");
  card.classList.toggle("selected", selected);
  card.classList.toggle("out", Math.abs(offset) > reach);
}

function drawWheels(list) {
  const picking = list.kind === "collection";
  const reach = picking ? REACH.collections : REACH.tables;
  if (wheelsEl.dataset.kind !== list.kind) {
    wheelsEl.replaceChildren();
    cards.clear();
    wheelsEl.dataset.kind = list.kind;
  }

  const shown = Math.min(2 * reach + 1, list.length);
  const before = Math.min(reach, Math.floor((shown - 1) / 2));
  const wanted = new Map();
  for (let offset = -before; offset <= shown - 1 - before; offset += 1) {
    const index = list.indexAfter(offset);
    const item = list.items[index];
    wanted.set(picking ? item.label : item.table.id, { index, item, offset });
  }

  for (const [key, card] of cards) {
    if (wanted.has(key)) continue;
    // Leaving: past the end of the row on the side it was on.
    place(card, Math.sign(Number(card.dataset.offset) || 1) * (reach + 1), reach);
    cards.delete(key);
    setTimeout(() => card.remove(), MOVE_MS);
  }

  for (const [key, { index, item, offset }] of wanted) {
    let card = cards.get(key);
    if (!card) {
      card = makeCard(list, index, item);
      cards.set(key, card);
      // Entering: it starts past the end of the row on the side it comes from.
      place(card, Math.sign(offset || 1) * (reach + 1), reach);
      wheelsEl.appendChild(card);
      card.offsetWidth;              // so the move to its place is animated
    } else if (Math.abs(offset - Number(card.dataset.offset)) > 2) {
      // A short list wraps: the wheel that left one end is wanted at the other. It jumps
      // there unanimated, so it does not slide across the others.
      card.style.transition = "none";
      place(card, Math.sign(offset || 1) * (reach + 1), reach);
      card.offsetWidth;
      card.style.transition = "";
    }
    place(card, offset, reach);
  }
}

// A collection is a row with a label and pictures instead of a media list.
function makeCard(list, index, item) {
  const picking = list.kind === "collection";
  const card = document.createElement("li");
  const label = picking ? item.label : item.game.name;
  const url = picking
    ? item.image_url || (item.game_wheel_urls || [])[0]
    : item.media.includes("wheel") && vpin.getImageURL(index, "wheel");

  if (url) {
    const node = document.createElement("img");
    node.alt = label;
    node.src = url;
    card.appendChild(node);
  } else {
    const name = document.createElement("span");
    name.className = "missing";
    name.textContent = label;
    card.appendChild(name);
  }
  return card;
}

// --- 3. The selection ---------------------------------------------------------------
// Everything about the selected table is on its entry: entry.game is the game, entry.table
// the file and entry.media lists the kinds of art that have a file. A collection in the
// picker is a row with a name and a table count, and no picture behind it.

const titleEl = document.getElementById("title");
const metaEl = document.getElementById("meta");
const creditEl = document.getElementById("credit");
const authorsEl = document.getElementById("authors");
const infoEl = document.getElementById("info");
const artEl = document.getElementById("art");
const emptyEl = document.getElementById("empty");

function drawSelection(list) {
  const empty = list.length === 0;
  emptyEl.hidden = !empty;
  emptyEl.textContent = vpin.t("frontend.theme.no_tables_found", "No tables found");
  infoEl.hidden = empty;
  wheelsEl.hidden = empty;
  if (empty) {
    stage.dataset.view = "tables";
    artFader.clear();
    return;
  }

  const picking = list.kind === "collection";
  stage.dataset.view = picking ? "collections" : "tables";
  if (picking) drawCollection(list.current);
  else drawTable(list.current, list.cursor);
}

function drawTable(entry, index) {
  const { game, table } = entry;

  setTitle(game.name || vpin.t("frontend.theme.unknown_table", "Unknown Table"));
  metaEl.textContent = [game.manufacturer, game.year].filter(Boolean).join(" • ");
  creditEl.hidden = false;
  authorsEl.textContent = table.authors.length
    ? table.authors.join(", ")
    : vpin.t("frontend.theme.unknown_author", "Unknown Author");
  authorsEl.dataset.size = sizeFor(authorsEl.textContent.length, 30, 60);

  // The backglass picture, else the full single screen one. getImageURL has no fallback, so
  // a table with only the second is asked for it by name.
  const kind = ["backglass", "playfield_fss"].find((name) => entry.media.includes(name));
  if (kind) artFader.show(vpin.getImageURL(index, kind));
  else artFader.clear();
}

function drawCollection(row) {
  const count = row.table_count;
  setTitle(row.label);
  metaEl.textContent = Number.isFinite(count) ? `${count} ${count === 1 ? "Table" : "Tables"}` : "";
  creditEl.hidden = true;
  artFader.clear();
}

function setTitle(text) {
  titleEl.textContent = text;
  titleEl.dataset.size = sizeFor(text.length, 24, 40);
}

function sizeFor(length, long, longer) {
  if (length > longer) return "longer";
  return length > long ? "long" : "normal";
}

// The art. A new picture loads at the back and fades in over the one already there; a later
// one supersedes it, so a slow load for a table no longer selected never shows. Asking for
// the picture already showing changes nothing. A picture that cannot be loaded leaves the
// screen dark, so the one before it does not stay up under another table's name.

const FADE_MS = 500;                 // the layer transition in style.css

const artFader = (() => {
  let token = 0;
  let shownURL = null;

  function clear() {
    token += 1;
    shownURL = null;
    for (const layer of artEl.querySelectorAll(".layer")) retire(layer);
  }

  function retire(layer) {
    layer.classList.add("exiting");
    setTimeout(() => layer.remove(), FADE_MS);
  }

  function show(url) {
    if (url === shownURL) return;
    shownURL = url;
    token += 1;
    const mine = token;
    for (const layer of artEl.querySelectorAll(".entering")) layer.remove();

    const node = document.createElement("img");
    node.alt = "";
    const layer = document.createElement("div");
    layer.className = "layer entering";
    layer.appendChild(node);
    artEl.appendChild(layer);

    node.addEventListener("load", () => {
      if (mine !== token || !layer.isConnected) return;
      for (const old of artEl.querySelectorAll(".layer:not(.entering):not(.exiting)")) retire(old);
      layer.offsetWidth;             // so the fade starts from the hidden look
      layer.classList.remove("entering");
    }, { once: true });
    node.addEventListener("error", () => {
      if (mine === token && layer.isConnected) clear();
    }, { once: true });
    node.src = url;
  }

  return { show, clear };
})();

// --- 4. Messages --------------------------------------------------------------------
// Core needs to see every message first: it keeps the selection, the audio and the
// loading indicator in step with them. After that the theme draws.
//
// TableIndexUpdate is the wheel moving. TableDataChange is a new list, and core has
// already filled in message.index by the time handleEvent returns.

async function receiveEvent(message) {
  await vpin.handleEvent(message);

  if (message.type === "TableIndexUpdate" || message.type === "TableDataChange") draw();
}

function draw() {
  const list = vpin.activeList();
  drawSelection(list);
  if (list.length > 0) drawWheels(list);
  else {
    wheelsEl.replaceChildren();
    cards.clear();
  }
}
