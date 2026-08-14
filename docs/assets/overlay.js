const KEY = "selector-preference-mock";

const NOTCHES = {
  interruption: ["Stay out", "Rare", "Sometimes", "Chatty", "Jump in freely"],
  world: ["Leave a gap", "Rare follow-up", "Sometimes continue", "Keep talking", "Always pick someone"],
  room: ["Stay out", "Rare comment", "Sometimes", "Often", "Pile on"],
};

const HINTS = {
  interruption: "Companions during a talk you are already in. Interjection still decides who would barge in.",
  world: "After GameMaster or a world NPC speaks. High notches keep the room going; low ones let a gap sit.",
  room: "Bystanders on a loud public scene. The person being discussed is involved, not a bystander.",
};

const DEFAULTS = {
  interruption: 2,
  world: 2,
  room: 1,
  yieldAfterQuestion: true,
  scene: "your-turn",
};

const SCENES = {
  "your-turn": {
    label: "Hulda just answered you",
    job: "Your turn",
    zero: "Wait for the player. Do not mention stale loops or nobody having a line.",
  },
  "room-continues": {
    label: "Olfina is roasting Jon",
    job: "Room continues",
    zero: "This exchange can end. Do not mention yielding to the player.",
  },
  idle: {
    label: "Idle tavern, nobody mid-exchange",
    job: "Idle",
    zero: "Nobody needs a line — or omit 0 if keep-talking is high.",
  },
};

function load() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch {
    return { ...DEFAULTS };
  }
}

function save(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

function compileLetter(state) {
  const scene = SCENES[state.scene];
  const interrupt = NOTCHES.interruption[state.interruption];
  const world = NOTCHES.world[state.world];
  const room = NOTCHES.room[state.room];
  const yieldLine = state.yieldAfterQuestion
    ? "If the last line was a question aimed at the player, output 0."
    : "A question aimed at the player is not a special hold.";

  let taste = "";
  if (state.scene === "your-turn") {
    taste = `Follower interruption: ${interrupt}.`;
  } else if (state.scene === "room-continues") {
    taste = `Let the world continue: ${world}. Room reaction: ${room}.`;
  } else {
    taste = `Let the world continue: ${world}.`;
  }

  return [
    `JOB: ${scene.job}`,
    `0 means: ${scene.zero}`,
    "",
    "Nearby: Hulda, Olfina Gray-Mane, Jon Battle-Born, Nazeem",
    "Last speaker → last target as the game already prints them.",
    "Interjection lines for each candidate (unchanged).",
    "",
    `TASTE (this notch only): ${taste}`,
    yieldLine,
    "",
    "Output 0 or Name>target. Nothing else.",
  ].join("\n");
}

function renderTicks(el, key, state) {
  const labels = NOTCHES[key];
  el.innerHTML = "";
  labels.forEach((label, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tick" + (state[key] === i ? " is-on" : "");
    btn.textContent = label;
    btn.addEventListener("click", () => {
      state[key] = i;
      save(state);
      paint(state);
    });
    el.appendChild(btn);
  });
}

function paint(state) {
  document.querySelectorAll("[data-notches]").forEach((el) => {
    renderTicks(el, el.getAttribute("data-notches"), state);
  });
  document.querySelectorAll("[data-value]").forEach((el) => {
    const key = el.getAttribute("data-value");
    el.textContent = NOTCHES[key][state[key]];
  });
  document.querySelectorAll("[data-toggle=yield]").forEach((el) => {
    el.classList.toggle("is-on", state.yieldAfterQuestion);
    el.setAttribute("aria-pressed", state.yieldAfterQuestion ? "true" : "false");
  });
  document.querySelectorAll("[data-yield-label]").forEach((el) => {
    el.textContent = state.yieldAfterQuestion ? "On" : "Off";
  });
  document.querySelectorAll("[data-scene]").forEach((el) => {
    const id = el.getAttribute("data-scene");
    el.classList.toggle("is-on", state.scene === id);
  });
  const letter = document.querySelector("[data-letter]");
  if (letter) letter.textContent = compileLetter(state);
}

function boot() {
  const state = load();
  document.querySelectorAll("[data-toggle=yield]").forEach((el) => {
    el.addEventListener("click", () => {
      state.yieldAfterQuestion = !state.yieldAfterQuestion;
      save(state);
      paint(state);
    });
  });
  document.querySelectorAll("[data-scene]").forEach((el) => {
    el.addEventListener("click", () => {
      state.scene = el.getAttribute("data-scene");
      save(state);
      paint(state);
    });
  });
  paint(state);
}

document.addEventListener("DOMContentLoaded", boot);
