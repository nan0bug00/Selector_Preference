# Handoff — Selector Preference (build phase)

## What this project is

A SkyrimNet add-on that gives the player one setting: how much a companion may interrupt the player's conversations. It ships as a Skyrim mod with two configuration surfaces — a PrismaUI overlay (primary) and an MCM menu (fallback) — both writing the same setting value into SkyrimNet's speaker-selector settings. The selector prompt then renders a different instruction block depending on that value.

The prompt side is already written. This handoff is for the build phase: the plugin, the MCM, the PrismaUI overlay, and in-game testing.

## Current repo state

```
├── DESIGN.md                  ← current design (written after cleanup)
├── HANDOFF.md                 ← this file
├── prompts/
│   ├── target_selectors/
│   │   └── dialogue_speaker_selector.prompt   ← THE deliverable prompt (already written)
│   └── components/
│       └── character_bio_personality_inline.prompt  ← stub, used at level 5
├── docs/                      ← PrismaUI mockups (1.html–5.html). Mockup 5 = thin HUD.
├── References/                ← SkyrimNet reference prompts, original selector, character bios
├── clean/
│   ├── draft/                 ← archived earlier prompt drafts (leave alone unless design fails)
│   └── scratch/               ← archived exploration notes (leave alone)
└── .cursor/rules/             ← project rules (plain-english, no-install-without-asking)
```

The repo has been cleaned of the old four-slider design, the committee-process scratch files, and all debate/brainstorming documents. `prompts/`, `docs/`, and `References/` are canonical and should not be reorganized.

## Locked design decisions

These are settled. Do not relitigate them.

1. **One slider.** A single "Companion Interruption" setting with five positions, present in both the MCM and the PrismaUI overlay. The old four-slider design (follower/non-follower × interruption/chattiness) is gone.
2. **The five labels, in order:**
   - 1 — STFU
   - 2 — Rare
   - 3 — Sometimes
   - 4 — More Often
   - 5 — Chatty
3. **The slider value (integer 1–5) is passed to the prompt as `ss.companionInterrupt`.** The prompt already reads it at `prompts/target_selectors/dialogue_speaker_selector.prompt:9`.
4. **Terminology is "Companion", not "Follower"**, in the MCM and PrismaUI, matching SkyrimNet's existing `[COMPANION]` tag language. **`is_follower` must NEVER be renamed to `is_companion`** — it is a SkyrimNet API function and renaming it breaks the prompt. The prompt already unifies terminology in prose while keeping `is_follower` as the function name; no further changes are needed.
5. **PrismaUI is primary, MCM is fallback.** PrismaUI lets the player change the setting live, unpaused. MCM is buried several clicks deep and requires pausing, so it is the secondary surface.
6. **PrismaUI default key is Page Up.** The key can be rebound only from the MCM, not from PrismaUI. MCM key assignment accepts a keypress (press the desired key to bind it).
7. **Theme switcher** in the PrismaUI overlay: Dark mode (default), Light mode, and Colorblind-friendly. Small, optional.
8. **Build tools are HouseCARL and SkyrimNet MCP.** Load the `housecarl` skill for any load-order/record work and the `skyrimnet-mcp` skill for live-game inspection and prompt validation. Both are behind mcpproxy — use `retrieve_tools` then `call_tool`.

## The prompt — already written

`prompts/target_selectors/dialogue_speaker_selector.prompt` is the deliverable and is complete except for the plugin wiring. Key facts:

- It sets `{% set ss = get_speaker_selector_settings() %}` (line 2) and reads the existing settings `silenceChancePercent`, `tagCompanion`, `tagEngaged`, and `tagInScene`.
- Line 9 reads the new setting: `{% set companionInterruption = ss.companionInterrupt %}`.
- The "Companion interruption preference" section (lines 65–113) renders one instruction block per level, selected by `companionInterruption == 1` through `== 5`. This section only renders when `companionSectionShown` is true (the last exchange was between the player and a non-follower).
- Level 5 additionally renders the personality profile: `render_character_profile("personality_inline", candidate.UUID)` (line 152), backed by `prompts/components/character_bio_personality_inline.prompt`. That file is currently the empty stub `{% block personality %}{% endblock %}` — same shape as the working `character_bio_short_inline.prompt` (`{% block summary %}`) and `character_bio_interject_inline.prompt` (`{% block interject_summary %}`) in `References/`, so it is assumed to resolve via the `character_bio_<mode>.prompt` path convention. **Verify it renders in game at level 5 during testing.**

### The `allowSilence` gate (decided, do not revert)

Lines 11–13:

```jinja
{% set playerWasAddressed = existsIn(lastDialogueTarget, "name") and lastDialogueTarget.UUID == player.UUID %}
{% set companionSectionShown = existsIn(lastSpeaker, "name") and existsIn(lastDialogueTarget, "name") and ((lastSpeaker.UUID == player.UUID and lastDialogueTarget.UUID != player.UUID and not is_follower(lastDialogueTarget.UUID)) or (lastSpeaker.UUID != player.UUID and lastDialogueTarget.UUID == player.UUID and not is_follower(lastSpeaker.UUID))) %}
{% set allowSilence = random < zerochance or playerWasAddressed or (companionSectionShown and companionInterruption == 1) %}
```

The third clause on `allowSilence` closes a leak: at level 1 (STFU), if the silence roll failed and the player was not addressed, the model used to be forced to select *someone*, which could force it to pick a companion and violate the "must not be selected" rule. Gating on `(companionSectionShown and companionInterruption == 1)` makes `0` always available in exactly the scenario the level-1 prohibition governs, so the model is never cornered. The ordering matters — `companionSectionShown` must be defined *before* `allowSilence` because Jinja evaluates `{% set %}` top-to-bottom. Do not move it back below.

### One stale comment

Line 8 still says `{# PLACEHOLDER: future companion-interruption setting field ... #}` above line 9, which now references the real `ss.companionInterrupt`. The comment is stale and can be deleted or updated during the build; it has no functional effect.

## What the prompt does not do (constraints)

- Output remains exactly `0` or `Name>target`. No third output form.
- No post-processing of the model's answer. The setting is enforced by the prompt only; there is no rewrite of a completed selector result.
- No injection into SkyrimNet's F6 dashboard.
- No replacement of SkyrimNet's character bios.

## What needs to be built

### 1. The mod / plugin

A Skyrim mod (ESL/ESP) that publishes one new setting into the struct returned by `get_speaker_selector_settings()`, under the field name `companionInterrupt` (integer 1–5). The existing fields (`silenceChancePercent`, `tagCompanion`, `tagEngaged`, `tagInScene`) are already exposed that way — follow the same mechanism. The exact registration API should be confirmed against SkyrimNet's public API during the build (the old design notes mentioned a `RegisterDecorator` facility and MCM support; confirm the current names before coding).

### 2. MCM menu

- One slider: Companion Interruption, positions 1–5, labeled STFU / Rare / Sometimes / More Often / Chatty.
- A hotkey setting for the PrismaUI overlay, default Page Up, that accepts a keypress as input.
- The theme setting (Dark / Light / Colorblind-friendly) if it is not kept PrismaUI-only. Decide during build; the requirement says the theme switcher is on the PrismaUI side.

### 3. PrismaUI overlay

- Based on the mockup 5 design language (thin HUD, low chrome, stays up while playing). Use `docs/5.html` for the look, **not** its content — that mockup still shows the old four-slider labels. The real overlay has one slider.
- One Companion Interruption slider, positions 1–5 with the labels above.
- Theme switcher: Dark (default), Light, Colorblind-friendly.
- Opens/closes on Page Up by default. No key rebinding inside PrismaUI.

### 4. Settings flow

MCM and PrismaUI write the same settings file. The slider value (1–5) lands in `ss.companionInterrupt`, which the prompt reads at line 9.

## Reference material

- `References/dialogue_speaker_selector_original.prompt` — the confusing, contradictory original selector this project replaces. Read it to understand the baseline, not to copy from it.
- `References/prompts/target_selectors/dialogue_speaker_selector.prompt` — the older revised three-phase selector (also superseded).
- `References/prompts/components/character_bio_full.prompt` — shows the `{% block personality %}` block name, confirming `personality_inline`'s naming convention.
- `References/prompts/dev/mcm_test.prompt` — an MCM test prompt (`{{ test_variable }}`, `{{ timestamp }}`), evidence of how MCM-supplied variables reach prompts.
- `References/prompts/documentation/main.prompt` — decorator documentation template (shows the decorator/variable schema SkyrimNet exposes).
- `docs/5.html` and `docs/assets/overlay.js` — the mockup design language; note `overlay.js` still contains the four-slider labels and should not be copied verbatim into the real overlay.

## Things to verify during testing

1. **`personality_inline` renders at level 5.** This is the only assumed dependency. If it renders empty or errors, levels 4 and 5 lose their personality context, and the fix is to confirm the mode-path convention with the SkyrimNet devs (the user has already flagged this with them).
2. **Levels 1 and 5 behave as designed.** STFU should reliably keep companions silent; Chatty should visibly grant them latitude. The three middle levels may partially blur — that is an accepted risk, not a failure. The target is "better than the original prompt," not "five crisply distinct levels."
3. **STFU does not quiet the whole game.** With the `allowSilence` gate, a directly addressed follower still replies (the companion section doesn't render), and NPC-to-NPC exchanges keep their normal silence rate. Confirm in game that STFU scopes to interruptions, not all companion speech.
4. **The MCM keybinding accepts a keypress** and the Page Up default opens PrismaUI out of the box.

## Standing rules for this repo

- Do not commit, amend, or push unless explicitly asked.
- Load `housecarl` before any record work; load `mutagen-reference` before changing a record field. Load `skyrimnet-mcp` for live-game work. Tools are behind mcpproxy — search with `retrieve_tools`, invoke with `call_tool`.
- Do not install software without asking.
- Plain-english rule: no invented shorthand or nicknames. Refer to files, fields, and line numbers literally.
