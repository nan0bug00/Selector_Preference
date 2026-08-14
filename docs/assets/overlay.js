const KEY = "selector-preference-mock";
try {
  const savedTheme = JSON.parse(localStorage.getItem(KEY) || "{}").theme;
  if (savedTheme) document.documentElement.setAttribute("data-theme", savedTheme);
} catch (e) {}

const SLIDER_LABELS = {
  followerInterruption: ["Stay out", "Rare", "Sometimes", "Often", "Jump in"],
  followerChattiness: ["Quiet", "Rare", "Sometimes", "Chatty", "Very chatty"],
  nonFollowerInterruption: ["Stay out", "Low", "Medium", "Chatty"],
  nonFollowerChattiness: ["Quiet", "Sometimes", "Chatty"],
};

const HINTS = {
  followerInterruption: [
    "Do not pick a follower as speaker while you are talking to a townsperson. That townsperson can still answer you.",
    "Pick a follower only if they were named, referred to, their job actually requires a response here, or Interjection names a specific person who was just discussed.",
    "Same as Rare, plus the full Interjection list, plus a real conflict in the log (argument, threat, or fight — not a calm directions question).",
    "Same as Sometimes, plus a decision in the log that affects this follower, plus the long personality paragraph giving a reason that points at the last line.",
    "Companions have broad latitude to enter conversations as they see fit. Interjection and personality stay in the prompt. Being nearby is not a reason by itself.",
  ],
  followerChattiness: [
    "Road comments and starting a new talk are rare. This slider does not apply while you are talking to a townsperson.",
    "Occasional questions to you, or a comment while traveling, without a crisis.",
    "Followers speak now and then when they are not cutting into your conversation with someone else.",
    "Followers often start talk or comment on the road. Still not a reason to cut in on you and a townsperson.",
    "Followers speak freely when they are not interrupting you and a townsperson. Rain comments and sweetroll comments are allowed.",
  ],
  nonFollowerInterruption: [
    "Do not pick a bystander as speaker. The person you are already talking to can still be picked.",
    "Pick a bystander only if they were named or referred to, their job actually requires a response here, or Interjection names a specific person who was just discussed.",
    "Same as Low, plus the full Interjection list, plus a real conflict in the log they have a job or Interjection reason to enter.",
    "Same as Medium, plus the long personality paragraph giving a reason that points at the last line. Being nearby is still not enough.",
  ],
  nonFollowerChattiness: [
    "Idle comments from townspeople are rare. The person who was just addressed can still continue.",
    "Townspeople may continue a line GameMaster started, or talk to each other, without cutting into a conversation they are not in.",
    "Townspeople speak freely when they are not cutting in. Still one speaker. The person who just spoke cannot speak again.",
  ],
};

const INSTRUCTION_PARAGRAPHS = {
  followerInterruption: [
    "Followers stay on the candidate list. Do not pick a follower as speaker. The townsperson you are talking to can still be picked. If they just spoke to you, output 0 so you can answer. Interjection, [COMPANION], and [ENGAGED] do not override this.",
    "Pick a follower only if they were addressed or referred to by name, their job would actually demand a response in this exchange, or the Interjection list names a specific person (friend, lover, family, rival) who was just talked about. Topic triggers on that list do not count yet.",
    "Everything in Rare still counts, and the full Interjection list may count. Also pick a follower if they have a reason, tied to what just happened, to warn, object, de-escalate, or escalate a real conflict in the log — not a calm directions question.",
    "Everything in Sometimes still counts, plus a decision in the recent log that affects this follower (quest, house, adoption, new companion), plus the one-line summary and long personality paragraph giving a reason that points at this last line.",
    "Do not keep the reason lists from lower positions as a filter. The model uses the conversation log plus this follower's summary, Interjection, and personality, and judges for itself whether they would enter. Still one speaker. The person who just spoke cannot speak again. Being nearby is not a reason by itself.",
  ],
  followerChattiness: [
    "Comments while traveling and starting a new conversation should be rare. Do not pick a follower just because they are standing there.",
    "A follower may occasionally ask the player a question, start a conversation, or comment on the road, without a crisis in the log.",
    "Followers may speak now and then when they are not cutting into a conversation between the player and a townsperson.",
    "Followers often start talk or comment while traveling. That is not permission to cut in on the player talking to a townsperson.",
    "Followers may speak freely when they are not interrupting the player and a townsperson. Lines like rain not letting up, or wanting a sweetroll, are allowed.",
  ],
  nonFollowerInterruption: [
    "Bystanders stay on the candidate list. The person you are talking to is not a bystander and can still be picked. Do not pick a bystander as speaker. Interjection does not override this.",
    "Pick a bystander only if they were addressed or referred to by name, their job would actually demand a response in this exchange, or the Interjection list names a specific person who was just talked about. Topic triggers do not count yet.",
    "Everything in Low still counts, plus the full Interjection list, plus warn, object, de-escalate, or escalate when the log shows a real conflict they have a job or Interjection reason to enter.",
    "Everything in Medium still counts, plus the one-line summary and long personality paragraph giving a reason to cut in on this last line. Still not because they are nearby, and still not because the player has not answered yet.",
  ],
  nonFollowerChattiness: [
    "Idle comments from townspeople should be rare. If someone was just addressed, they may still answer. Do not pick a third person to cut in.",
    "A townsperson may continue after GameMaster started a line, or answer someone who just spoke to them. Do not pick someone who is not already in that conversation unless the interruption slider allows it.",
    "Townspeople may speak freely when they are not cutting into a conversation they are not already in. Still one speaker. The person who just spoke cannot speak again.",
  ],
};

const DEFAULTS = {
  followerInterruption: 1,
  followerChattiness: 2,
  nonFollowerInterruption: 1,
  nonFollowerChattiness: 1,
  scene: "player-and-townsperson",
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
  "player-and-townsperson": {
    lastSpeaker: "Hulda",
    lastTarget: "player",
    lastLine: "**Last exchange:** Hulda was speaking to player",
    zeroMeans:
      "No NPC speaks, so the player can answer. Hulda just spoke to the player.",
    log: [
      "- [8:41 PM] (dialogue) Player to Hulda: Which way to Dragonsreach from here? I just rode in.",
      "- [8:42 PM] (dialogue) Hulda to Player: Up the steps through the Wind District, love. Can't miss the keep. Need a room first, or are you heading straight up?",
    ],
    summary:
      "The player is at the bar. Hulda just answered a directions question and asked a follow-up. Olfina is serving with a tankard in hand. Jon sits two stools down. Nazeem stands near the door. Saadia is collecting mugs. No combat. Indoor evening crowd, not a brawl.",
    sliders: ["followerInterruption", "nonFollowerInterruption"],
  },
  "two-npcs-talking": {
    lastSpeaker: "Olfina Gray-Mane",
    lastTarget: "Jon Battle-Born",
    lastLine: "**Last exchange:** Olfina Gray-Mane was speaking to Jon Battle-Born",
    zeroMeans:
      "This exchange between these two NPCs can end. Do not treat 0 as waiting for the player; the player was not addressed.",
    log: [
      "- [8:38 PM] (gamemaster_dialogue) GameMaster: Olfina Gray-Mane leans on the bar and cuts a look at Jon Battle-Born as he fumbles a verse.",
      "- [8:39 PM] (dialogue) Olfina Gray-Mane to Jon Battle-Born: If that's a love poem, Battle-Born, the horse you rode in on writes better.",
      "- [8:40 PM] (dialogue) Jon Battle-Born to Olfina Gray-Mane: It's a work in progress. The subject keeps glaring at me.",
      "- [8:41 PM] (dialogue) Olfina Gray-Mane to Jon Battle-Born: Then stop reciting it in my inn. Some of us are working.",
    ],
    summary:
      "GameMaster started an exchange between Olfina and Jon. They are mid-roast at the bar. The player is nearby but was not addressed. Hulda is working. Nazeem is in earshot. Saadia is moving between tables.",
    sliders: ["nonFollowerChattiness", "nonFollowerInterruption"],
  },
  idle: {
    lastSpeaker: null,
    lastTarget: null,
    lastLine: "**Last speaker:** none — no specific target",
    zeroMeans: "Nobody needs to start talking.",
    log: [
      "- [8:20 PM] (dialogue) Hulda to Saadia: Another round for the corner table when you can.",
      "- [8:21 PM] (dialogue) Saadia to Hulda: Already moving.",
      "- *A little time has passed.*",
    ],
    summary:
      "The Bannered Mare is open and occupied. No one just addressed the player. No NPC-to-NPC exchange is mid-sentence. Tankards, fire, low talk.",
    sliders: ["followerChattiness", "nonFollowerChattiness"],
  },
};

const SLIDER_TITLES = {
  followerInterruption: "Follower interruption",
  followerChattiness: "Follower chattiness",
  nonFollowerInterruption: "Non-follower interruption",
  nonFollowerChattiness: "Non-follower chattiness",
};

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "{}");
    let scene = raw.scene;
    if (scene === "your-turn") scene = "player-and-townsperson";
    if (scene === "room-continues") scene = "two-npcs-talking";
    return {
      ...DEFAULTS,
      followerInterruption: raw.followerInterruption ?? DEFAULTS.followerInterruption,
      followerChattiness: raw.followerChattiness ?? DEFAULTS.followerChattiness,
      nonFollowerInterruption: raw.nonFollowerInterruption ?? DEFAULTS.nonFollowerInterruption,
      nonFollowerChattiness: raw.nonFollowerChattiness ?? DEFAULTS.nonFollowerChattiness,
      scene: SCENES[scene] ? scene : DEFAULTS.scene,
      preview: !!raw.preview,
      theme: raw.theme || DEFAULTS.theme,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

function save(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

function instructionParagraphsForThisPrompt(state) {
  const scene = SCENES[state.scene];
  return scene.sliders.map((key) => ({
    label: SLIDER_TITLES[key] + " — " + SLIDER_LABELS[key][state[key]],
    text: INSTRUCTION_PARAGRAPHS[key][state[key]],
  }));
}

function candidateHtml() {
  return CANDIDATES.map((c) => {
    const tags = c.tags.map((t) => ` **[${t}]**`).join("");
    return `${c.id}. **${c.name}** (${c.meta})${tags}
   - ${c.summary}
   - **Interjection**: ${c.interject}`;
  }).join("\n");
}

function compilePromptPreviewHTML(state) {
  const scene = SCENES[state.scene];
  const paragraphs = instructionParagraphsForThisPrompt(state);
  const lastSpeakerRule = scene.lastSpeaker
    ? `Do NOT select ${scene.lastSpeaker} as speaker (they just spoke — they CAN be a target).`
    : "No last speaker to exclude; nobody just spoke.";

  const paragraphBlocks = paragraphs
    .map(
      (p) =>
        `<div class="instruction-paragraph"><div class="instruction-label">${p.label}</div><div>${p.text}</div></div>`
    )
    .join("");

  return `<div class="prompt-doc">
<div class="prompt-tag">[ system ]</div>
# Task
Select which NPC should speak next, if anyone. Output only \`0\` or \`[speaker]>[target]\`

## Output Format
- \`0\` = ${scene.zeroMeans}
- \`Lydia>player\` = Lydia speaks to player
- \`Ulfric Stormcloak>Galmar Stone-Fist\` = Ulfric speaks to Galmar

<div class="instruction-paragraph">
<div class="instruction-label">What 0 means this time</div>
<div>${scene.zeroMeans}</div>
</div>

## Instructions kept for this processing of the prompt
Jinja would delete every other slider position before send. The model only sees the paragraphs below.
${paragraphBlocks}

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

<div class="prompt-tag">[ user ]</div>
## Location
The Bannered Mare, Whiterun

## Recent Dialogue
${scene.log.join("\n")}
${scene.lastLine}

## Candidates
${candidateHtml()}

**Tag meanings:**
- \`[COMPANION]\` — Player's active follower. More invested in the player's affairs. This tag is a fact, not a reason to speak. Interjection and the kept instruction paragraphs decide that.

**Targeting rules:**
- Consider who was just speaking to whom. ${
    scene.lastSpeaker
      ? scene.lastSpeaker + " was just speaking to " + scene.lastTarget + "."
      : "No current exchange."
  }
- Only use \`player\` as target when the NPC is genuinely addressing the player.
- Always specify a target — every output must be exactly \`0\` or \`[speaker]>[target]\`.
- ${lastSpeakerRule}

### Examples
- CORRECT: \`Aela the Huntress>Lydia\`
- CORRECT: \`0\`
- INCORRECT: \`Aela the Huntress [Female Nord]>Lydia\` (do not add gender and race)
- INCORRECT: \`Aela>Lydia\` (use exact full name, not shortened)
- INCORRECT: \`Aela>{{ player.name }}\` (target player as lowercase "player")

IMPORTANT: ${lastSpeakerRule}
Output format: \`0\` or \`[Name]>[target]\`
<div class="prompt-tag">[ end user ]</div>
</div>`;
}

function renderSliderPositions(el, key, state) {
  const labels = SLIDER_LABELS[key];
  el.innerHTML = "";
  labels.forEach((label, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "slider-position" + (state[key] === i ? " is-on" : "");
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
  document.querySelectorAll("[data-slider]").forEach((el) => {
    renderSliderPositions(el, el.getAttribute("data-slider"), state);
  });
  document.querySelectorAll("[data-hint]").forEach((el) => {
    const key = el.getAttribute("data-hint");
    el.textContent = HINTS[key][state[key]];
  });
  document.querySelectorAll("[data-value]").forEach((el) => {
    const key = el.getAttribute("data-value");
    const labels = SLIDER_LABELS[key];
    if (labels) el.textContent = labels[state[key]];
  });
  document.querySelectorAll("[data-toggle=preview]").forEach((el) => {
    el.classList.toggle("is-on", !!state.preview);
    el.setAttribute("aria-pressed", state.preview ? "true" : "false");
    if (el.dataset.labelToggle !== undefined) {
      el.textContent = state.preview
        ? "Hide selector prompt preview"
        : "Show selector prompt preview";
    }
  });
  document.querySelectorAll("[data-theme-set]").forEach((el) => {
    el.classList.toggle("is-on", el.getAttribute("data-theme-set") === state.theme);
  });
  document.querySelectorAll("[data-scene]").forEach((el) => {
    const id = el.getAttribute("data-scene");
    el.classList.toggle("is-on", state.scene === id);
  });
  const preview = document.querySelector("[data-preview]");
  if (preview) preview.innerHTML = compilePromptPreviewHTML(state);
}

function boot() {
  const state = load();
  if (document.body.hasAttribute("data-force-preview")) {
    state.preview = true;
  }
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
