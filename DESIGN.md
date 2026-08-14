# Selector Preference

SkyrimNet add-on. In-game sliders plus one speaker-selector `.prompt` file. The meta model still only outputs `0` or `Name>target`. Jinja should delete every instruction paragraph that does not apply to this processing of the prompt, so the model is not given two opposite orders in the same prompt.

Public SkyrimNet API only. No private repo, no Discord, no rewriting the selector's answer after it returns.

## The problem

The default speaker-selector prompt and the revised three-phase speaker-selector prompt both fail, from opposite sides.

- Default: a standing instruction that companions should talk. Followers take over almost every conversation between the player and someone else.
- Revised three-phase prompt: a standing instruction to stay quiet for the player. GameMaster starts a line, then the selector keeps returning `0` and nearby NPCs stop talking.

Both dump a long list of conflicting rules onto a small, cheap model that runs very often. In that mess, `0` is used to mean three different things: wait for the player, the conversation is over, and nobody has anything to say.

To the game, `0` is already one thing: no NPC speaks this time. The player can still type. We cannot add a third output token. We can make sure the prompt the model sees this time only explains `0` one way.

Whether companions interrupt conversations is a preference. So is wanting to finish a sentence with Hulda. That belongs on sliders, not in a long essay the model will latch onto.

## What we are building

1. **A plugin** that publishes slider positions as Inja decorators, the same way `lastSpeaker.name` already works. The PrismaUI overlay and the MCM both read and write **one** settings file. Add a slider once; both menus show it. The overlay is what we will use while testing. MCM exists so a full keyboard is not required. We do not inject into the F6 SkyrimNet dashboard.
2. **One selector `.prompt` file** that contains every instruction paragraph. Jinja deletes the paragraphs that do not apply. The model never sees the deleted ones.

What decides which paragraphs stay:

- **Who just spoke to whom** (no plugin): facts the selector already has: `lastSpeaker`, `lastDialogueTarget`, `player.UUID`, `is_follower`.
- **Preference** (plugin): discrete slider positions. Each position is a different short instruction paragraph. The other positions are absent.

## What the meta model should see

SkyrimNet already injects nearby candidates, short bios, Interjection lines, and recent dialogue. We add:

- Output `0` or `Name>target`.
- One explanation of what `0` means this time.
- Only the instruction paragraphs that match who just spoke to whom and these slider positions.

It should not see "companions should talk" and "wait for the player" in the same prompt. It should not see a three-phase decision list or "mild reason."

If that is honest, a small model (4B-class, e.g. Gemma 4 E4B) can do the pick. Interjection already says whether this person would barge in. The log already says what happened. The slider already says how often that is allowed.

## Sliders (current draft)

Not 0–100 turned into vague prose. Named positions, each a different instruction paragraph. These are graded sliders, not on/off switches.

Followers: five positions on interruption. Non-followers: four positions on interruption.

How often someone speaks when they are **not** cutting into someone else's conversation, and how often they **are** cutting in, are different. One slider cannot cover both.

The long personality paragraph (`render_character_profile("bio_personality", ...)`) is printed only when interruption is high enough to use it: follower interruption positions 4 and 5, non-follower interruption position 4. Other SkyrimNet prompts are unchanged. We do not ship replacement character files.

The `.prompt` file will be long because it stores every grade. The model only sees the grades that apply to this processing of the prompt. We do not write a unique silence section for every mix of the four sliders. How the kept paragraphs stack is in `prompt-chunks.md`.

### Followers

1. **Follower chattiness** — how often a follower speaks when they are not cutting in on the player talking to a non-follower. Asking the player a question. Starting a conversation with an NPC or another follower. Comments on the road ("this rain doesn't let up", "I could go for a sweetroll").
2. **Follower interruption** — how often a follower cuts in on a conversation between the player and a non-follower NPC, no matter who started that conversation.

### Non-followers

GameMaster starts world talk. These sliders cover what the selector does after that, and what nearby town NPCs do on their own. There is no separate control whose job is "keep the world going." That was mixing GameMaster's job into the selector.

3. **Non-follower chattiness** — how often a non-follower speaks when they are not cutting in on someone else's conversation. Idle comments. Continuing after GameMaster started a line. Two townspeople who were already talking.
4. **Non-follower interruption** — how often a non-follower cuts in on a conversation they are not already in. Nazeem jumping into you talking to Hulda. A third person jumping into two other NPCs talking.

### Dropped

- Do not add a control whose whole job is "read the vibe of a public scene." The four sliders above already cover bystanders cutting in.
- Do not add a slider that asks the model to classify the last line as a question versus a statement, then weigh that against interruption settings. That is two jobs and competing orders.

### Open: followers joining NPC-to-NPC talk

Olfina roasting Jon, or two townspeople talking, and a follower wants to comment. That is not "player talking to a non-follower," so it is not covered by follower interruption as defined above. It is also not really a road comment while traveling. Unresolved. Do not add a fifth slider until we pick one of:

- Count it as follower chattiness (they are not interrupting the player).
- Count it as follower interruption (they are interrupting someone else's conversation).
- Leave it out of the first version and watch what happens in the Bannered Mare.

## Who just spoke, plus the slider — not "was it a question?"

Jinja already knows whether the player was the last target. Nested conditionals in the `.prompt` pick the instruction paragraph. The model is not asked to decide what kind of sentence that was.

Examples (wording of the paragraphs comes later):

- If the player was the last target AND follower interruption is Stay out, keep the paragraph that forbids picking a follower as speaker. Followers still appear under Candidates so a later processing of the prompt, when nobody is in that conversation, can still pick them.
- If the player was the last target AND follower interruption is Jump in, keep the paragraph that allows a follower when Interjection says they would barge in.
- If the player was the last target AND non-follower interruption is Stay out, keep the paragraph that forbids picking a bystander. Bystanders still appear under Candidates. The person you are talking to is not a bystander.
- If the last line was NPC-to-NPC, do not include the paragraphs that assume the player was just spoken to. Include the chattiness and interruption paragraphs that match two NPCs talking.

Do not omit people from Candidates to enforce Stay out. The same list is used when someone is cutting in and when they are not. Stay out only tells the model not to pick those people as speaker.

The person who was just addressed is the natural next speaker. That is a fact about who just spoke to whom, not a vibe. Hulda answering you after you spoke to her is not interruption. Olfina cutting in before Hulda answers is interruption, and the follower-interruption paragraph is what allows or forbids it.

When Hulda just spoke to you and interruptions are off, `0` means no NPC speaks, so you can answer. When the tavern is idle and chattiness is low, `0` means nobody needs to start talking. Those are different paragraphs, not one paragraph that tries to mean both.

First version: the slider position you set stays until you change it. No extra random roll. A later version can add a chance roll on top of the same positions if we want variation from one processing of the prompt to the next.

## Overlay and MCM

One settings file. Both menus read and write it. Change a position in either menu, the other shows it the next time it opens, and the next processing of the prompt uses it.

The overlay hotkey can be rebound in MCM. That is still one setting.

Look and feel is mocked in `docs/` (GitHub Pages). Slider labels in the mockup should match these four sliders.

English instruction paragraphs are sketched in `prompt-chunks.md`. Fill that before Jinja.

## What the public API allows

We cannot change a pick after the meta model answers. No published function rewrites `Lydia>player` into `0`. `PurgeDialogue` kills the whole queue. "Mark busy" is advertised in the README and **not** in `SkyrimNetApi.psc`. `SkyrimNet_SpeechStarted` is not a documented Papyrus contract.

We **can**: `RegisterDecorator`, MCM, `RegisterShortLivedEvent`, `GetTimeSinceLastAudioEnded` (expose it as a decorator if it is not already in Inja). We change what prompt the selector sees. We do not override its answer.

## References

Under `References/`:

- `prompts/target_selectors/dialogue_speaker_selector.prompt` — current revised three-phase selector. Too long. Conflicting orders. This is what we are replacing.
- `original_prompts/characters/` — `{% block interject_summary %}` examples. Personality. Olfina jumps on Gray-Mane / Thorald / Jon; Nazeem jumps to assert status; Jenassa jumps on combat and ruins. A rude companion's Interjection is supposed to fire. A standing "companions should talk" rule is not.
- `prompts/gamemaster_scene_planner.prompt` — GameMaster **starts** NPC talk. The selector **continues** it. A prompt that always prefers `0` after anyone speaks to the player will stall what GameMaster started.
- `prompts/submodules/test_decorators/` — Inja that actually works here: `if/elif/else`, `and/or/not`, `{% set %}`, `exists`, `default`, `{# comments #}`, `{%- -%}` whitespace trim. `elif` chains are legal for slider positions.
- `prompts/components/character_bio_interject_inline.prompt` — what the selector already prints per candidate as **Interjection**.

## Out of scope until we choose it

C++, intercepting selector output, Discord, private SkyrimNet tree, replacing GameMaster's own cooldown slider.
