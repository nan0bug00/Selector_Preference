const KEY = "selector-preference-mock";
try {
  const savedTheme = JSON.parse(localStorage.getItem(KEY) || "{}").theme;
  if (savedTheme) document.documentElement.setAttribute("data-theme", savedTheme);
} catch (e) {}

const NOTCHES = {
  interruption: ["Stay out", "Rare", "Sometimes", "Chatty", "Jump in freely"],
  world: ["Leave a gap", "Rare follow-up", "Sometimes continue", "Keep talking", "Always pick someone"],
  room: ["Stay out", "Rare comment", "Sometimes", "Often", "Pile on"],
};

const HINTS = {
  interruption: [
    "Companions stay quiet unless named, or Interjection says barge in.",
    "They jump in only on a hard Interjection hit. Most ticks stay silent.",
    "About one companion-worthy beat in three, if Interjection fits.",
    "They comment when Interjection fits — not every tick, no pep-talk.",
    "They take the beat whenever Interjection says they would.",
  ],
  world: [
    "After a spark, prefer silence. A quiet room is allowed.",
    "Someone speaks only if asked or named. Otherwise the exchange ends.",
    "A plausible next line is enough; a gap is also fine.",
    "Prefer a speaker if anyone has a line. Silence can still end it.",
    "No silence option. Pick the best candidate.",
  ],
  room: [
    "Bystanders do not comment on other people's talk.",
    "Only if they were named, or Interjection is a hard hit.",
    "A bystander may react to a loud scene if Interjection fits.",
    "Public scenes invite a nearby reaction. Pick the best Interjection.",
    "The room may pile on. Still one speaker this tick.",
  ],
};

const YIELD_HINTS = {
  true: "If they asked you something, wait. 0 means yield, not an empty room.",
  false: "A question aimed at you is not a special hold.",
};

const PACKETS = {
  interruption: [
    "Followers are not a reason to speak. Do not pick a companion unless they were addressed by name, or their Interjection says they would barge in on this exact beat.",
    "A companion may speak only if Interjection is a direct hit and jumping in would be in character. Most ticks: output 0.",
    "Companions may take about one beat in three when Interjection fits. Do not treat [COMPANION] as a speaking magnet.",
    "Companions may comment when Interjection fits. Still not every tick. No pep-talk, no filling silence for the party's sake.",
    "Companions may take the beat whenever Interjection says they would. Still one speaker. Still honor a yield packet if it is in this letter.",
  ],
  world: [
    "Prefer 0. The spark already happened. A gap in the room is allowed.",
    "Pick someone only if they were asked a question or named. Otherwise 0 is the exchange ending.",
    "A plausible next line is enough; a gap is also fine. 0 means this exchange can end, not that the world is forbidden to talk.",
    "Prefer a speaker if anyone has a line. 0 still means the exchange can end.",
    "Do not offer 0. Pick the best candidate.",
  ],
  room: [
    "Bystanders do not comment on other people's talk.",
    "A bystander may speak only if they were named or Interjection is a hard hit.",
    "A bystander may react to a loud public scene if Interjection fits.",
    "Public scenes invite a nearby reaction. Pick the bystander whose Interjection fits best.",
    "The room may pile on. Pick the bystander whose Interjection fits hardest. Still one speaker this tick.",
  ],
};

const DEFAULTS = {
  interruption: 2,
  world: 2,
  room: 1,
  yieldAfterQuestion: true,
  scene: "your-turn",
  preview: false,
  theme: "dark",
};

const CANDIDATES = [
  {
    id: 1,
    name: "Hulda",
    meta: "Female Nord, 1.2m",
    tags: [],
    summary:
      "Hulda is the proud Nord owner of The Bannered Mare in Whiterun's Plains District. A seasoned innkeeper approaching retirement age, she runs her establishment with efficiency and traditional Nord values, maintaining a warm but professional demeanor with patrons while harboring prejudice against elves.",
    interject:
      "Hulda interjects when: patrons need service; someone mentions elves favorably; customers discuss Whiterun gossip; the topic of magic arises; someone inquires about lodging; Nazeem is mentioned; or when Mikael plays inappropriate music.",
  },
  {
    id: 2,
    name: "Olfina Gray-Mane",
    meta: "Female Nord, 3.4m",
    tags: ["COMPANION"],
    summary:
      "Olfina Gray-Mane is a proud, independent Nord woman from the influential Gray-Mane family of Whiterun. She works as a barmaid at the Bannered Mare and carries the Gray-Mane name in a city sharply divided by her family's feud with the Battle-Borns. A staunch Stormcloak supporter, she embodies Nord strength and independence while navigating complex family dynamics and political tensions.",
    interject:
      "Olfina interjects when: Nord women are underestimated; Gray-Manes are insulted; Imperial sympathies are expressed; her family is mentioned; Thorald is discussed; someone implies weakness in women; Jon Battle-Born is criticized; Nazeem is mentioned; or when she notices someone watching her interactions with Jon.",
  },
  {
    id: 3,
    name: "Jon Battle-Born",
    meta: "Male Nord, 4.1m",
    tags: [],
    summary:
      "Jon Battle-Born is a young Nord poet from one of Whiterun's oldest and most respected families. Unlike his militaristic relatives, he gravitates toward art, drink, and song, and is more often found at the Bannered Mare than at the family's Wind District manor. He dreams of attending the Bards College in Solitude, despite his family's preference for more traditional pursuits.",
    interject:
      "Jon interjects when hearing about: poetry or songs, the Bards College, the Battle-Born/Gray-Mane feud, the civil war, romance, drinking and revelry, Olfina Gray-Mane (though cautiously), Mikael the bard, or Nazeem.",
  },
  {
    id: 4,
    name: "Nazeem",
    meta: "Male Redguard, 6.8m",
    tags: [],
    summary:
      "Nazeem is a wealthy, arrogant Redguard businessman who owns Chillfurrow Farm outside Whiterun. He considers himself part of Whiterun's elite, frequently boasts about advising Jarl Balgruuf, and treats most citizens with condescension and disdain.",
    interject:
      "Nazeem interjects when hearing mentions of quality goods, the Cloud District, Jarl Balgruuf, farming, wealth, or social status. He interrupts conversations to correct perceived misconceptions about quality standards or to assert his superior position in Whiterun society.",
  },
  {
    id: 5,
    name: "Saadia",
    meta: "Female Redguard, 5.0m",
    tags: [],
    summary:
      "Saadia is a Redguard barmaid at The Bannered Mare in Whiterun, a polite, efficient server who keeps to herself and rarely talks about where she comes from. She has the careful manners of someone raised better than her station, though she gives no specifics if asked.",
    interject:
      "Saadia will interject if: anyone mentions Alik'r warriors or Redguard mercenaries in Whiterun; if someone discusses Hammerfell politics or the war with the Aldmeri Dominion; if patrons become unruly or disrespectful in the tavern; if Nazeem is mentioned; or if someone speaks about the fall of Taneth.",
  },
];

const NEARBY = [
  "1. Hulda: proud Nord innkeeper of The Bannered Mare (Female Nord, 1.2 meters away)",
  "2. Olfina Gray-Mane: Gray-Mane barmaid, Stormcloak, secretly involved with Jon (Female Nord, 3.4 meters away)",
  "3. Jon Battle-Born: Battle-Born poet, drinks here more than at the manor (Male Nord, 4.1 meters away)",
  "4. Saadia: Redguard barmaid who keeps her past to herself (Female Redguard, 5.0 meters away)",
  "5. Nazeem: Chillfurrow Farm owner, Cloud District windbag (Male Redguard, 6.8 meters away)",
  "6. Mikael: tavern bard, currently between songs (Male Nord, 7.2 meters away)",
];

const SCENES = {
  "your-turn": {
    label: "Hulda just answered you",
    job: "Your turn",
    lastSpeaker: "Hulda",
    lastTarget: "player",
    lastLine: "**Last exchange:** Hulda was speaking to player",
    log: [
      "- [8:41 PM] (dialogue) Player to Hulda: Which way to Dragonsreach from here? I just rode in.",
      "- [8:42 PM] (dialogue) Hulda to Player: Up the steps through the Wind District, love. Can't miss the keep. Need a room first, or are you heading straight up?",
    ],
    summary:
      "The player is at the bar. Hulda just answered a directions question and asked a follow-up. Olfina is serving with a tankard in hand. Jon sits two stools down. Nazeem stands near the door. Saadia is collecting mugs. No combat. Indoor evening crowd, not a brawl.",
  },
  "room-continues": {
    label: "Olfina is roasting Jon",
    job: "Room continues",
    lastSpeaker: "Olfina Gray-Mane",
    lastTarget: "Jon Battle-Born",
    lastLine: "**Last exchange:** Olfina Gray-Mane was speaking to Jon Battle-Born",
    log: [
      "- [8:38 PM] (gamemaster_dialogue) GameMaster: Olfina Gray-Mane leans on the bar and cuts a look at Jon Battle-Born as he fumbles a verse.",
      "- [8:39 PM] (dialogue) Olfina Gray-Mane to Jon Battle-Born: If that's a love poem, Battle-Born, the horse you rode in on writes better.",
      "- [8:40 PM] (dialogue) Jon Battle-Born to Olfina Gray-Mane: It's a work in progress. The subject keeps glaring at me.",
      "- [8:41 PM] (dialogue) Olfina Gray-Mane to Jon Battle-Born: Then stop reciting it in my inn. Some of us are working.",
    ],
    summary:
      "GameMaster sparked an Olfina/Jon exchange. They are mid-roast at the bar. The player is nearby but was not addressed. Hulda is working. Nazeem is in earshot. Saadia is moving between tables.",
  },
  idle: {
    label: "Idle tavern",
    job: "Idle",
    lastSpeaker: null,
    lastTarget: null,
    lastLine: "**Last speaker:** none — no specific target",
    log: [
      "- [8:20 PM] (dialogue) Hulda to Saadia: Another round for the corner table when you can.",
      "- [8:21 PM] (dialogue) Saadia to Hulda: Already moving.",
      "- *A little time has passed.*",
    ],
    summary:
      "The Bannered Mare is open and occupied. No one just addressed the player. No NPC-to-NPC exchange is mid-sentence. Tankards, fire, low talk.",
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

function omitZero(state) {
  return state.scene === "idle" && state.world === 4;
}

function jobZero(state) {
  if (state.scene === "your-turn") {
    return "Wait for the player. Do not mention stale loops or nobody having a line.";
  }
  if (state.scene === "room-continues") {
    return "This exchange can end. Do not mention yielding to the player.";
  }
  if (omitZero(state)) {
    return null;
  }
  return "Nobody needs a line this tick.";
}

function tastePackets(state) {
  const out = [];
  if (state.scene === "your-turn") {
    out.push({
      label: "Follower interruption — " + NOTCHES.interruption[state.interruption],
      text: PACKETS.interruption[state.interruption],
    });
    if (state.yieldAfterQuestion) {
      out.push({
        label: "Yield after a question to you — On",
        text: "The last line was aimed at the player. Output 0. Wait.",
      });
    }
  } else if (state.scene === "room-continues") {
    out.push({
      label: "Let the world continue — " + NOTCHES.world[state.world],
      text: PACKETS.world[state.world],
    });
    out.push({
      label: "Room reaction — " + NOTCHES.room[state.room],
      text: PACKETS.room[state.room],
    });
  } else {
    out.push({
      label: "Let the world continue — " + NOTCHES.world[state.world],
      text: PACKETS.world[state.world],
    });
  }
  return out;
}

function candidateHtml() {
  return CANDIDATES.map((c) => {
    const tags = c.tags.map((t) => ` **[${t}]**`).join("");
    return `${c.id}. **${c.name}** (${c.meta})${tags}
   - ${c.summary}
   - **Interjection**: ${c.interject}`;
  }).join("\n");
}

function compileLetterHTML(state) {
  const scene = SCENES[state.scene];
  const zero = jobZero(state);
  const packets = tastePackets(state);
  const allowZero = !omitZero(state);
  const formatZero = allowZero
    ? "- `0` = " + zero
    : "- `0` is not offered this tick.";
  const outputLine = allowZero
    ? "Output format: `0` or `[Name]>[target]`"
    : "Output format: `[Name]>[target]`";
  const lastSpeakerRule = scene.lastSpeaker
    ? `Do NOT select ${scene.lastSpeaker} as speaker (they just spoke — they CAN be a target).`
    : "No last speaker lock this tick.";

  const packetBlocks = packets
    .map(
      (p) =>
        `<div class="pkt"><div class="pkt-label">${p.label}</div><div>${p.text}</div></div>`
    )
    .join("");

  return `<div class="letter-doc">
<div class="letter-tag">[ system ]</div>
# Task
Select which NPC should speak next, if anyone. Output only ${
    allowZero ? "`0` or " : ""
  }\`[speaker]>[target]\`

## Output Format
${formatZero}
- \`Lydia>player\` = Lydia speaks to player
- \`Ulfric Stormcloak>Galmar Stone-Fist\` = Ulfric speaks to Galmar

<div class="pkt">
<div class="pkt-label">This tick's job — ${scene.job}</div>
<div>${
    zero
      ? "0 means: " + zero
      : "Do not mention 0. Someone should speak."
  }</div>
</div>

## Taste
Only the packet below is in this letter. Other notches were deleted before send.
${packetBlocks}

## Scene Information
## Current Location
The scene is taking place in **The Bannered Mare, Whiterun**

## Current Time
**Time**: 8:42 PM, 17th of Last Seed, 4E 201
- It's currently evening.

## Current Weather
**Weather**: You are indoors and sheltered from the weather. Outside, it is Overcast

## Nearby People
${NEARBY.join("\n")}

## Scene Summary
${scene.summary}

<div class="letter-tag">[ user ]</div>
## Location
The Bannered Mare, Whiterun

## Recent Dialogue
${scene.log.join("\n")}
${scene.lastLine}

## Candidates
${candidateHtml()}

**Tag meanings:**
- \`[COMPANION]\` — Player's active follower. More invested in the player's affairs. This tag is a fact, not a reason to speak. Interjection and the taste packet decide that.

**Targeting rules:**
- Consider who was just speaking to whom. ${
    scene.lastSpeaker
      ? scene.lastSpeaker + " was just speaking to " + scene.lastTarget + "."
      : "No current exchange."
  }
- Only use \`player\` as target when the NPC is genuinely addressing the player.
- Always specify a target — every output must be exactly ${
    allowZero ? "`0` or " : ""
  }\`[speaker]>[target]\`.
- ${lastSpeakerRule}

### Examples
- CORRECT: \`Aela the Huntress>Lydia\`
${allowZero ? "- CORRECT: `0`\n" : ""}- INCORRECT: \`Aela the Huntress [Female Nord]>Lydia\` (do not add gender and race)
- INCORRECT: \`Aela>Lydia\` (use exact full name, not shortened)
- INCORRECT: \`Aela>{{ player.name }}\` (target player as lowercase "player")

IMPORTANT: ${lastSpeakerRule}
${outputLine}
<div class="letter-tag">[ end user ]</div>
</div>`;
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

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme || "dark");
}

function paint(state) {
  applyTheme(state.theme);
  document.body.classList.toggle("is-preview", !!state.preview);
  document.querySelectorAll("[data-notches]").forEach((el) => {
    renderTicks(el, el.getAttribute("data-notches"), state);
  });
  document.querySelectorAll("[data-hint]").forEach((el) => {
    const key = el.getAttribute("data-hint");
    el.textContent = HINTS[key][state[key]];
  });
  document.querySelectorAll("[data-yield-hint]").forEach((el) => {
    el.textContent = YIELD_HINTS[state.yieldAfterQuestion];
  });
  document.querySelectorAll("[data-toggle=yield]").forEach((el) => {
    el.classList.toggle("is-on", state.yieldAfterQuestion);
    el.setAttribute("aria-pressed", state.yieldAfterQuestion ? "true" : "false");
  });
  document.querySelectorAll("[data-yield-label]").forEach((el) => {
    el.textContent = state.yieldAfterQuestion ? "On" : "Off";
  });
  document.querySelectorAll("[data-toggle=preview]").forEach((el) => {
    el.classList.toggle("is-on", !!state.preview);
    el.setAttribute("aria-pressed", state.preview ? "true" : "false");
    if (el.dataset.labelToggle !== undefined) {
      el.textContent = state.preview ? "Hide letter preview" : "Show letter preview";
    }
  });
  document.querySelectorAll("[data-theme-set]").forEach((el) => {
    el.classList.toggle("is-on", el.getAttribute("data-theme-set") === state.theme);
  });
  document.querySelectorAll("[data-scene]").forEach((el) => {
    const id = el.getAttribute("data-scene");
    el.classList.toggle("is-on", state.scene === id);
  });
  const letter = document.querySelector("[data-letter]");
  if (letter) letter.innerHTML = compileLetterHTML(state);
}

function boot() {
  const state = load();
  if (document.body.hasAttribute("data-force-preview")) {
    state.preview = true;
  }
  document.querySelectorAll("[data-toggle=yield]").forEach((el) => {
    el.addEventListener("click", () => {
      state.yieldAfterQuestion = !state.yieldAfterQuestion;
      save(state);
      paint(state);
    });
  });
  document.querySelectorAll("[data-toggle=preview]").forEach((el) => {
    el.addEventListener("click", () => {
      state.preview = !state.preview;
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
  document.querySelectorAll("[data-theme-set]").forEach((el) => {
    el.addEventListener("click", () => {
      state.theme = el.getAttribute("data-theme-set");
      save(state);
      paint(state);
    });
  });
  paint(state);
}

document.addEventListener("DOMContentLoaded", boot);
