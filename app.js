"use strict";

const byId = (id) => document.getElementById(id);
const activities = [
  ["A warm welcome", "Make a mug of something warm and pick one thing you want to make time for this December."],
  ["First lights", "Take a short walk after dark and look for a window with Christmas lights."],
  ["A song for December", "Put on a favorite Christmas song and send it to someone who might enjoy it."],
  ["Paper snowflakes", "Fold a piece of scrap paper, snip out tiny shapes, and unfold your snowflake."],
  ["The good list", "Write down three things that made you smile this week."],
  ["Cinnamon in the kitchen", "Add a little cinnamon to your coffee, cocoa, or morning porridge."],
  ["A note in the post", "Write a card to someone you haven’t seen in a while."],
  ["An evening by candlelight", "Spend ten quiet minutes with a candle or a small lamp and a good book."],
  ["A Christmas movie", "Pick a film, put the kettle on, and settle in."],
  ["Winter photo walk", "Take a picture of one small detail that feels like winter."],
  ["A little generosity", "Leave a kind note or do a small favor for someone today."],
  ["Bake something", "Make a batch of cookies or choose a recipe to try later this month."],
  ["An ornament with a story", "Find a decoration that brings back a memory and tell someone about it."],
  ["Clear a little space", "Set aside a book, toy, or warm item you could pass along to someone."],
  ["A festive breakfast", "Make toast, pancakes, or porridge and add something that feels special."],
  ["Wrap one present", "Wrap a gift and add a handwritten tag. A scrap of ribbon is enough."],
  ["A winter playlist", "Pick five songs for an evening of cooking, wrapping, or winding down."],
  ["Christmas past", "Ask someone about a holiday tradition they remember from childhood."],
  ["Bring the outside in", "Put a fallen twig or a little greenery in a jar and give it a place on the table."],
  ["One less thing", "Cross a low-priority task off your holiday to-do list and enjoy the time back."],
  ["Share a treat", "Offer a cookie or another small treat to someone who could use a bright spot."],
  ["The night sky", "Step outside for a minute and look up, even if all you see are clouds."],
  ["Make tomorrow easier", "Set out something you’ll need tomorrow, then take a real break."],
  ["Christmas Eve", "Put on a favorite song and take a moment to enjoy wherever you are."]
];

function load(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    byId("storage-status").hidden = false;
    return fallback;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    byId("storage-status").hidden = false;
  }
}

const giftKey = "december-house.gifts.v1";
const adventKey = "december-house.advent.v1";
let gifts = load(giftKey, []);
let opened = load(adventKey, {});
let displayedDate;

function season(now) {
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();
  return {
    christmasYear: year + Number(month === 11 && day > 25),
    adventYear: year,
    available: month === 11 ? Math.min(day, 24) : 0,
    christmasDay: month === 11 && day === 25
  };
}

function refreshClock() {
  const now = new Date();
  const {christmasYear, christmasDay} = season(now);
  const target = new Date(christmasYear, 11, 25);
  const seconds = Math.max(0, Math.ceil((target - now) / 1000));
  byId("days").textContent = Math.floor(seconds / 86400);
  byId("hours").textContent = String(Math.floor(seconds / 3600) % 24).padStart(2, "0");
  byId("minutes").textContent = String(Math.floor(seconds / 60) % 60).padStart(2, "0");
  byId("seconds").textContent = String(seconds % 60).padStart(2, "0");

  if (now.toDateString() !== displayedDate) {
    displayedDate = now.toDateString();
    byId("countdown-note").textContent = christmasDay ? "Merry Christmas!" : "Counting down to December 25, " + christmasYear + ".";
    byId("christmas-title").innerHTML = christmasDay ? "Merry<br><em>Christmas!</em>" : "Christmas<br><em>is coming.</em>";
    renderCalendar(now);
  }
}

const calendar = byId("calendar");
const dialog = byId("surprise");
const lock = '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><rect x="2" y="5" width="8" height="6" rx="1"/><path d="M4 5V3a2 2 0 0 1 4 0v2"/></svg>';

for (let day = 1; day <= 24; day++) {
  const door = document.createElement("button");
  door.type = "button";
  door.className = "door";
  door.dataset.day = day;
  door.innerHTML = day + lock;
  calendar.append(door);
}

function renderCalendar(now) {
  const {adventYear, available} = season(now);
  const history = opened[adventYear] ?? [];
  for (const door of calendar.children) {
    const day = Number(door.dataset.day);
    const isOpen = history.includes(day);
    const isLocked = day > available;
    door.classList.toggle("opened", isOpen && !isLocked);
    door.setAttribute("aria-disabled", String(isLocked));
    door.setAttribute("aria-label", "December " + day + (isLocked ? ", locked" : isOpen ? ", opened" : ", ready to open"));
    door.querySelector("svg").style.display = isLocked ? "" : "none";
  }
  byId("advent-status").textContent = available === 0 ? "The first door opens December 1." : history.length + " of 24 doors opened.";
}

calendar.addEventListener("click", (event) => {
  const door = event.target.closest("button");
  if (!door || door.getAttribute("aria-disabled") === "true") return;
  const now = new Date();
  const {adventYear, available} = season(now);
  const day = Number(door.dataset.day);
  if (day > available) return;

  const history = opened[adventYear] ?? [];
  if (!history.includes(day)) {
    opened[adventYear] = [...history, day];
    save(adventKey, opened);
  }
  renderCalendar(now);
  showActivity(day - 1, "December " + day);
});

function showActivity(index, label) {
  const [title, activity] = activities[index];
  byId("surprise-day").textContent = label;
  byId("surprise-title").textContent = title;
  byId("surprise-text").textContent = activity;
  dialog.showModal();
}

const giftForm = byId("gift-form");
const giftItems = byId("gift-items");

function updateGiftSummary() {
  const ready = gifts.filter((gift) => gift.ready).length;
  byId("gift-count").textContent = ready + " of " + gifts.length + " gifts ready";
  byId("gift-progress").max = Math.max(gifts.length, 1);
  byId("gift-progress").value = ready;
  byId("gift-empty").hidden = gifts.length > 0;
}

function appendGift(gift) {
  const row = document.createElement("li");
  const label = document.createElement("label");
  label.className = "gift-label";
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = gift.ready;
  const text = document.createElement("span");
  const idea = document.createElement("strong");
  idea.textContent = gift.idea;
  const person = document.createElement("small");
  person.textContent = "For " + gift.person;
  text.append(idea, person);
  label.append(checkbox, text);
  checkbox.addEventListener("change", () => {
    gift.ready = checkbox.checked;
    save(giftKey, gifts);
    updateGiftSummary();
  });

  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "remove";
  remove.textContent = "×";
  remove.setAttribute("aria-label", "Remove " + gift.idea + " for " + gift.person);
  remove.addEventListener("click", () => {
    const nextRow = row.nextElementSibling || row.previousElementSibling;
    gifts = gifts.filter((item) => item !== gift);
    save(giftKey, gifts);
    row.remove();
    updateGiftSummary();
    (nextRow?.querySelector("button") || giftForm.elements.person).focus();
  });
  row.append(label, remove);
  giftItems.append(row);
}

giftForm.addEventListener("input", (event) => event.target.setCustomValidity(""));
giftForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const {person, idea} = giftForm.elements;
  for (const field of [person, idea]) {
    if (field.value.trim()) continue;
    field.setCustomValidity("Enter a " + (field === person ? "recipient." : "gift idea."));
    field.reportValidity();
    return;
  }
  const gift = {person: person.value.trim(), idea: idea.value.trim(), ready: false};
  gifts.push(gift);
  save(giftKey, gifts);
  appendGift(gift);
  updateGiftSummary();
  giftForm.reset();
  person.focus();
});

gifts.forEach(appendGift);
updateGiftSummary();
refreshClock();
setInterval(refreshClock, 1000);
