# Handoff — Selector Preference (build phase)

## What this project is

A SkyrimNet add-on that gives the player one setting: how much a companion may interrupt the player's conversations. It ships as a Skyrim mod with two configuration surfaces — a PrismaUI overlay (primary) and an MCM menu (fallback) — both writing the same setting value into SkyrimNet's speaker-selector settings. The selector prompt then renders a different instruction block depending on that value.

The prompt side is already written. This handoff is for the build phase: the plugin, the MCM, and the PrismaUI overlay.

## Current repo state

```
├── DESIGN.md                  ← current design
├── HANDOFF.md                 ← this file
├── prompts/                   ← the deliverable prompt (already written)
├── docs/                      ← PrismaUI mockups (1.html–5.html). Mockup 5 = thin HUD.
├── References/                ← SkyrimNet reference prompts, original selector, character bios
├── clean/
│   ├── draft/                 ← archived earlier prompt drafts (leave alone)
│   └── scratch/               ← archived exploration notes (leave alone)
└── .cursor/rules/             ← project rules (plain-english, no-install-without-asking)
```

`prompts/`, `docs/`, and `References/` are canonical and should not be reorganized.

## Locked design decisions

These are settled. Do not relitigate them.

1. **One setting.** A single "Companion Interruption" setting with five levels, present in both the MCM and the PrismaUI overlay. The old four-slider design (follower/non-follower × interruption/chattiness) is gone.
2. **The five labels, in order:**
   - 1 — STFU
   - 2 — Rare
   - 3 — Sometimes
   - 4 — More Often
   - 5 — Chatty
3. **The setting value (integer 1–5) is passed to the prompt as `ss.companionInterrupt`.** The prompt already reads it at `prompts/target_selectors/dialogue_speaker_selector.prompt:8`.
4. **Terminology is "Companion", not "Follower"**, in the MCM and PrismaUI, matching SkyrimNet's existing `[COMPANION]` tag language. **`is_follower` must NEVER be renamed to `is_companion`** — it is a SkyrimNet API function and renaming it breaks the prompt.
5. **PrismaUI is primary, MCM is fallback.** PrismaUI lets the player change the setting live, unpaused. MCM is buried several clicks deep and requires pausing, so it is the secondary surface.
6. **PrismaUI default key is Page Up.** The key can be rebound only from the MCM, not from PrismaUI. MCM key assignment accepts a keypress (press the desired key to bind it).
7. **Theme switcher** in the PrismaUI overlay: Dark mode (default), Light mode, and Colorblind-friendly.
8. **Build tools are HouseCARL and SkyrimNet MCP.** Load the `housecarl` skill for any load-order/record work and the `skyrimnet-mcp` skill for live-game inspection and prompt validation. Both are behind mcpproxy — use `retrieve_tools` then `call_tool`.

## What the mod does not do

- Output stays exactly `0` or `Name>target`. No third output form.
- No post-processing of the model's answer. The setting is enforced by the prompt only; there is no rewrite of a completed selector result.
- No injection into SkyrimNet's F6 dashboard.
- No replacement of SkyrimNet's character bios.

## What needs to be built

### 1. The mod / plugin

A Skyrim mod (ESL/ESP) that publishes one new setting into the struct returned by `get_speaker_selector_settings()`, under the field name `companionInterrupt` (integer 1–5). The existing fields (`silenceChancePercent`, `tagCompanion`, `tagEngaged`, `tagInScene`) are already exposed that way — follow the same mechanism. The exact registration API should be confirmed against SkyrimNet's public API during the build.

### 2. MCM menu

- A slider: Companion Interruption, positions 1–5, labeled STFU / Rare / Sometimes / More Often / Chatty.
- A hotkey setting for the PrismaUI overlay, default Page Up, that accepts a keypress as input.

### 3. PrismaUI overlay

- Based on the mockup 5 design language (thin HUD, low chrome, stays up while playing). Use `docs/5.html` for the look, **not** its content — that mockup still shows the old four settings. The real overlay has one setting.
- The Companion Interruption setting presented as **five labelled buttons** — STFU / Rare / Sometimes / More Often / Chatty — not a slider.
- Theme switcher: Dark (default), Light, Colorblind-friendly.
- Opens/closes on Page Up by default. No key rebinding inside PrismaUI.

### 4. Settings flow

MCM and PrismaUI write the same settings file. The setting value (1–5) lands in `ss.companionInterrupt`, which the prompt reads at line 8.

## Reference material

- `References/dialogue_speaker_selector_original.prompt` — the confusing, contradictory original selector this project replaces. Read it to understand the baseline, not to copy from it.
- `References/prompts/dev/mcm_test.prompt` — an MCM test prompt (`{{ test_variable }}`, `{{ timestamp }}`), evidence of how MCM-supplied variables reach prompts.
- `References/prompts/documentation/main.prompt` — decorator documentation template (shows the decorator/variable schema SkyrimNet exposes).
- `docs/5.html` and `docs/assets/overlay.js` — the mockup design language; note `overlay.js` still contains the old four-setting labels and should not be copied verbatim into the real overlay.

## Standing rules for this repo

- Do not commit, amend, or push unless explicitly asked.
- Load `housecarl` before any record work; load `mutagen-reference` before changing a record field. Load `skyrimnet-mcp` for live-game work. Tools are behind mcpproxy — search with `retrieve_tools`, invoke with `call_tool`.
- Do not install software without asking.
- Plain-english rule: no invented shorthand or nicknames. Refer to files, fields, and line numbers literally.
