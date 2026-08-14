# Selector Preference

SkyrimNet add-on: in-game sliders plus a compiled speaker-selector prompt. The meta model still only outputs `0` or `Name>target`. It should only see the slice of instructions that apply to **this tick**.

Public SkyrimNet API only. No private repo, no Discord, no intercepting the selector after it answers.

## The problem

The default selector prompt and the pipeline rewrite both fail, from opposite sides.

- Default: a standing “companions should talk” magnet. Followers take over almost every player–NPC conversation.
- Pipeline: a standing “yield to the player” magnet. GameMaster sparks a line, then meta stalls the room.

Both dump a novel of conflicting rules onto a small, cheap, high-frequency meta model. `0` is overloaded in that novel: wait for the player, the scene is over, and nobody has a line.

To the **game**, `0` is already one thing: no NPC talks this tick. The player can still type. We cannot add a third output token. We can make sure each letter teaches **one** meaning of `0`.

Taste is not a prompt-engineering problem. The wiki author’s “companions step on talks” is a preference. So is “I want to finish a sentence with Hulda.” Sliders, not essays.

## What we are building

1. **A plugin** that publishes slider positions (and optionally dice) as Inja decorators, the same way `lastSpeaker.name` already works. Two doors into the same settings (fast PrismaUI overlay, slow MCM backup). One file on disk is the room; both doors read and write it.
2. **One selector `.prompt` file** that still contains every packet (the binder). Jinja deletes every packet that does not apply. Meta never reads the binder.

Two scissors:

- **Situation** (no plugin): who just spoke to whom. Public facts already in the selector (`lastSpeaker`, `lastDialogueTarget`, `player.UUID`, `is_follower`).
- **Preference** (plugin): discrete slider notches. Which taste paragraph is allowed into that job, or none.

## What meta should see each tick

- Nearby candidates, short bios, Interjection lines, recent dialogue/events (SkyrimNet already injects these).
- One job: output `0` or `Name>target`.
- One meaning of `0` for this tick.
- One taste packet from the sliders.

It should not see companion pep-talk and yield-the-floor in the same letter, “silence when uncertain” next to “err toward speaking,” a three-phase pipeline, or “mild reason.”

If that compile is honest, a small model (4B-class, e.g. Gemma 4 E4B) can do the pick. Interjection already says whether this person would barge in. The log already says what happened. The slider already says how the table is run.

## Situation packets (draft)

Compiled from last speaker / last target, not from “is there an active thread?”

| Job | When | What `0` means in this letter |
| --- | --- | --- |
| Your turn | Last line was aimed at the player (especially a question or a reply they are owed) | Wait for the player. Do not mention stale loops or “nobody has anything to say.” |
| Room continues | Last line was NPC-to-NPC, or GameMaster just sparked the room | This exchange can end. Do not mention yielding to the player. |
| Idle | Nothing aimed at the player, no mid-exchange | Nobody needs a line — or omit `0` entirely if the “keep the world talking” slider is high. |

Follower vs stranger as last speaker matters: Olfina roasting Jon in the Mare is not the same job as Hulda giving directions.

## Preference sliders (draft)

Not 0–100 interpreted as prose. Discrete notches, each a **different short packet**. Other notches are absent from the message.

Suggested first MCM page:

1. **Follower interruption** — stay out / rare / sometimes / chatty / jump in freely.
2. **Let the world continue** — after GM or a world NPC speaks, how hard to pick someone vs leave a gap.
3. **Room reaction** — bystanders on a loud public scene (Jon being discussed is involved, not a bystander).
4. Optional: **Yield after a question to you** — almost always on.

Dice are optional later (same notch, this beat flickers). First version can be sticky packets only.

## Two doors, one room

Settings live in **one** file (JSON or equivalent). The selector decorator reads that file. The PrismaUI overlay and the MCM both read and write that file. Neither menu owns a private copy.

Rules:

- Add a slider once, in the shared list. Then both menus show it. Never add a control to only one door.
- Change a notch in either menu, the other shows the new value the next time it opens (and the next selector letter uses it immediately).
- Change how a notch behaves (rename, extra packet, different meaning of `0`), change the packets and the labels in both menus in the same change.
- The overlay hotkey can be rebound in MCM. That is still one setting, not a second system.

The overlay is the door we will actually use while testing. MCM exists so a full keyboard is not required. F6 SkyrimNet dashboard is not a door; we do not inject into their config.

## Ceiling (public API)

We cannot veto a pick after meta answers. No published function rewrites `Lydia>player` into `0`. `PurgeDialogue` kills the whole queue. “Mark busy” is advertised in the README and **not** in `SkyrimNetApi.psc`. `SkyrimNet_SpeechStarted` is not a documented Papyrus contract.

We **can**: `RegisterDecorator`, MCM, `RegisterShortLivedEvent`, `GetTimeSinceLastAudioEnded` (wrap as a decorator if it is not already Inja). Steering the letter, not replacing the referee.

## References

Under `References/`:

- `prompts/target_selectors/dialogue_speaker_selector.prompt` — current pipeline revision (the novel to compile down).
- `original_prompts/characters/` — `{% block interject_summary %}` examples. These are the personality. Example: Olfina jumps on Gray-Mane / Thorald / Jon; Nazeem jumps to assert status; Jenassa jumps on combat and ruins. A rude companion’s interjection is supposed to fire. A standing companion magnet is not.
- `prompts/gamemaster_scene_planner.prompt` — GM **starts** NPC talk; meta **continues** it. A yield-first letter stalls GM.
- `prompts/submodules/test_decorators/` — Inja that actually works here: `if/elif/else`, `and/or/not`, `{% set %}`, `exists`, `default`, `{# comments #}`, `{%- -%}` whitespace trim. Confirms `elif` chains are legal for slider notches.
- `prompts/components/character_bio_interject_inline.prompt` — what the selector already prints per candidate as **Interjection**.

## Out of scope until we choose it

C++, intercepting selector output, Discord, private SkyrimNet tree, replacing GameMaster’s own cooldown slider.
