"use strict";

for (const button of document.querySelectorAll("[data-open]")) {
  button.addEventListener("click", () => byId(button.dataset.open).showModal());
}

let lastActivity = -1;
byId("preview-advent").addEventListener("click", () => {
  const choices = activities.map((_, index) => index).filter((index) => index !== lastActivity);
  lastActivity = choices[Math.floor(Math.random() * choices.length)];
  showActivity(lastActivity, "A festive activity");
});

const treeKey = "december-house.tree.v1";
const colors = {
  Cranberry: "#d94a52",
  Gold: "#f4bd4e",
  Ice: "#84d8ee",
  Rose: "#ee91b9"
};
const positions = [
  [140, 68], [125, 91], [156, 95],
  [110, 121], [142, 121], [171, 124],
  [91, 151], [124, 155], [154, 151], [185, 153],
  [78, 187], [111, 191], [143, 181], [173, 191], [205, 189]
];
const tree = load(treeKey, {ornaments: {}, lights: false});
const stage = byId("tree-spots").parentElement;
const lights = byId("tree-lights");
let selectedColor = "Cranberry";

const swatches = Object.entries(colors).map(([name, color]) => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "swatch";
  button.setAttribute("aria-label", name);
  button.setAttribute("aria-pressed", String(name === selectedColor));
  button.style.setProperty("--ornament", color);
  button.addEventListener("click", () => {
    selectedColor = name;
    for (const swatch of swatches) {
      swatch.setAttribute("aria-pressed", String(swatch === button));
    }
    byId("tree-status").textContent = name + " selected.";
  });
  byId("tree-colors").append(button);
  return button;
});

const spots = positions.map(([x, y], index) => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "tree-spot";
  button.style.setProperty("--x", x / 280 * 100 + "%");
  button.style.setProperty("--y", y / 235 * 100 + "%");
  button.addEventListener("click", () => {
    const currentColor = tree.ornaments[index];
    if (currentColor === selectedColor) {
      delete tree.ornaments[index];
    } else {
      tree.ornaments[index] = selectedColor;
    }
    updateTree();
  });
  byId("tree-spots").append(button);
  return button;
});

function renderTree() {
  spots.forEach((button, index) => {
    const name = tree.ornaments[index];
    button.dataset.filled = String(Boolean(name));
    button.style.setProperty("--ornament", colors[name] ?? "transparent");
    button.setAttribute("aria-label", "Spot " + (index + 1) + (name ? ", " + name + " ornament" : ", empty"));
  });
  stage.classList.toggle("lit", tree.lights);
  lights.setAttribute("aria-pressed", String(tree.lights));
  lights.querySelector("span").textContent = tree.lights ? "on" : "off";
  const count = Object.keys(tree.ornaments).length;
  byId("tree-status").textContent = count + " of " + spots.length + " spots decorated.";
}

function updateTree() {
  save(treeKey, tree);
  renderTree();
}

lights.addEventListener("click", () => {
  tree.lights = !tree.lights;
  updateTree();
});
byId("tree-clear").addEventListener("click", () => {
  tree.ornaments = {};
  updateTree();
});
renderTree();

const symbols = [
  ["🎁", "Present"], ["⭐", "Star"], ["🍪", "Cookie"],
  ["☃️", "Snowman"], ["🔔", "Bell"], ["🧤", "Glove"]
];
const matchGrid = byId("match-grid");
const matchStatus = byId("match-status");
const bestKey = "december-house.match-best.v1";
let best = load(bestKey, null);
let firstCard;
let flipTimer;
let moves;
let pairs;

function updateScore() {
  byId("match-score").textContent = pairs + " of " + symbols.length + " pairs · " + moves + (moves === 1 ? " move" : " moves");
  byId("match-best").textContent = best === null ? "Best score: —" : "Best score: " + best + " moves";
}

function paintCard(card, state) {
  const hidden = state === "hidden";
  card.button.className = "match-card " + state;
  card.button.textContent = hidden ? "✦" : card.symbol;
  card.button.setAttribute("aria-label", "Card " + card.number + (hidden ? ", face down" : ", " + card.name + ", " + state));
  card.button.setAttribute("aria-disabled", String(!hidden));
}

function flipCard(card) {
  if (flipTimer || card.button.getAttribute("aria-disabled") === "true") return;
  paintCard(card, "revealed");
  if (!firstCard) {
    firstCard = card;
    matchStatus.textContent = card.name + ". Choose another card.";
    return;
  }

  moves++;
  const other = firstCard;
  firstCard = null;
  if (card.name === other.name) {
    paintCard(card, "matched");
    paintCard(other, "matched");
    pairs++;
    matchStatus.textContent = "You found a pair of " + card.name.toLowerCase() + " cards!";
    if (pairs === symbols.length) {
      const newBest = best === null || moves < best;
      if (newBest) {
        best = moves;
        save(bestKey, best);
      }
      matchStatus.textContent = "All six pairs in " + moves + " moves!" + (newBest ? " New personal best." : "");
    }
  } else {
    matchStatus.textContent = other.name + " and " + card.name + ". Try another pair.";
    flipTimer = setTimeout(() => {
      paintCard(other, "hidden");
      paintCard(card, "hidden");
      flipTimer = null;
    }, 800);
  }
  updateScore();
}

function startMatch() {
  clearTimeout(flipTimer);
  flipTimer = null;
  firstCard = null;
  moves = 0;
  pairs = 0;
  const deck = [...symbols, ...symbols];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  matchGrid.replaceChildren();
  deck.forEach(([symbol, name], index) => {
    const button = document.createElement("button");
    button.type = "button";
    const card = {button, symbol, name, number: index + 1};
    paintCard(card, "hidden");
    button.addEventListener("click", () => flipCard(card));
    matchGrid.append(button);
  });
  matchStatus.textContent = "Pick any card to start.";
  updateScore();
}

byId("match-reset").addEventListener("click", startMatch);
startMatch();
