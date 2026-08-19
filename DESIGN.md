# Selector Preference — Design Document

## Project Goal

A SkyrimNet add-on that gives the player a single setting to control how often companions interrupt the player's conversations. Built as a Skyrim mod with two UI surfaces (PrismaUI overlay and MCM menu), powered by a Jinja-conditional speaker-selector prompt.

## The Prompt

`prompts/target_selectors/dialogue_speaker_selector.prompt` is the deliverable. It uses Jinja conditionals to render different instruction paragraphs based on the active companion-interruption level, supplied as `ss.companionInterrupt` (integer 1–5) from the mod's settings.

The prompt is purely reactionary. The runtime sequence is:

1. GameMaster evaluation and action selection
2. Directed NPC line generated through `dialogue_response.prompt`
3. Memory search
4. Mood analysis
5. Speaker-selector call — this prompt reacts to the completed line and returns `0` or `Name>target`

## Companion Interruption Slider

One slider, five levels, controls how readily a tagged companion may enter a conversation where the player is involved (as speaker or target).

| Level | Label | Behavior |
|-------|-------|----------|
| 1 | STFU | Companions must not be selected. No exceptions. |
| 2 | Rare | Companions may speak only when directly addressed/referred to, when their role demands a response, or when a specific person in their Interjection guidance is mentioned. |
| 3 | Sometimes | All of Rare, plus full Interjection text (including topic triggers) and a strong incentive to warn, object, de-escalate, or escalate in real conflict. |
| 4 | More Often | All of Sometimes, plus the companion's profile ties to something specific in the last line, and player actions that affect the companion (quest accepted, house bought, child adopted, new party member). Personality profile is rendered. |
| 5 | Chatty | Companions are granted broad latitude under the general selection rules. Personality profile is rendered. They are more likely to speak for any plausible reason, but this alone does not demand selection. |

The companion section of the prompt only renders when the last exchange was between the player and a non-companion, or between the player and a companion — i.e., a player-involving conversation. The `is_follower` check is used internally to identify companions; the UI and prompt text use "Companion" terminology, never swapping `is_follower` for `is_companion`.

## UI Surfaces

### PrismaUI Overlay (Primary)

- Default keybinding: **Page Up**
- Opens a floating overlay in-game, no pause required
- Contains one slider for the 5-level companion interruption setting
- Theme switcher: Dark Mode (default), Light Mode, Colorblind Friendly
- The keybinding is changed via MCM only, not from within PrismaUI

### MCM Menu (Fallback)

- Buried several clicks deep and requires pausing the game, so it is the secondary interface
- Contains the same companion interruption slider (1–5)
- Contains the keybinding setting for PrismaUI; accepts a keypress as input (press the desired key to assign it)
- Contains the theme setting (Dark / Light / Colorblind Friendly)

### Terminology

Both UIs use **"Companion"** throughout, matching the `[COMPANION]` tag convention in SkyrimNet. The internal `is_follower` function is never renamed — it is a SkyrimNet API function and renaming it would break the prompt.

## Settings Flow

1. The mod reads the slider value (1–5) and publishes it as a Jinja decorator accessible via `ss.companionInterrupt`
2. The speaker-selector prompt reads `{% set companionInterruption = ss.companionInterrupt %}` and uses `companionInterruption == 1` through `companionInterruption == 5` to conditionally include instruction blocks
3. Jinja strips inapplicable paragraphs before the model sees the rendered prompt

## Build Tools

The project will be built using:

- **HouseCARL** — for load-order record inspection, ESP patch authoring, and any record-level work
- **SkyrimNet MCP** — for live-game inspection, prompt template validation, and runtime data access

## Repository Structure

```
├── DESIGN.md                  ← this file
├── prompts/
│   └── target_selectors/
│       └── dialogue_speaker_selector.prompt   ← the deliverable prompt
├── docs/                      ← PrismaUI mockups (1.html–5.html)
├── References/                ← SkyrimNet reference prompts and source material
└── clean/
    ├── draft/                 ← earlier prompt drafts (archived, not active)
    └── scratch/               ← earlier exploration notes (archived, not active)
```

## What This Mod Does Not Do

- Does not rewrite the selector's output after the model returns it
- Does not inject controls into SkyrimNet's F6 dashboard
- Does not change the output format — it remains exactly `0` or `Name>target`
- Does not rename `is_follower` to `is_companion`
- Does not add a third output form
