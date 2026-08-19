# Selector Preference — Build Handoff

> Status: **LOCKED** — ready to hand off to an implementing model. Phase 0 (mechanism discovery) is complete. Do not re-investigate decisions marked LOCKED.

## 1. What this project is

A SkyrimNet add-on that gives the player one setting: how often a companion may interrupt the player's conversations. Five levels. Two UI surfaces — a PrismaUI overlay (primary) and an MCM page (fallback) — both write the same value, which the speaker-selector prompt reads and turns into a different instruction block.

The prompt is the deliverable and is already written at `prompts/target_selectors/dialogue_speaker_selector.prompt` (line 7 already corrected — see §4).

## 2. LOCKED decisions

1. **One setting, five levels:** 1 STFU / 2 Rare / 3 Sometimes / 4 More Often / 5 Chatty. Default **3 (Sometimes)**.
2. **Terminology is "Companion", never "Follower".** `is_follower` is a SkyrimNet API function and must never be renamed.
3. **PrismaUI is primary** (live, unpaused); **MCM is fallback** (paused, buried).
4. **Overlay toggle hotkey:** Page Up by default. Rebind is **MCM-only** (never inside PrismaUI). MCM hotkey accepts a keypress.
5. **Theme switcher is PrismaUI-only**: `[moon | sun | eye]` = Dark / Light / Colorblind, upper-right of the popout. **No theme setting in the MCM** (DESIGN.md's mention of an MCM theme is outdated/wrong).
6. **MCM uses plain `SKI_ConfigBase`** (SkyUI), not MCM Helper.
7. **The prompt ships inside our mod folder**, which loads after SkyrimNet in MO2, so our copy of the prompt file wins.
8. **No SkyrimNet F6-dashboard changes, no output post-processing, output stays exactly `0` or `Name>target`.**

## 3. Phase 0 result (settled — do not redo)

`get_speaker_selector_settings()` is a **built-in native decorator hardcoded to exactly four fields** (`silenceChancePercent`, `tagCompanion`, `tagEngaged`, `tagInScene`). Verified by inspecting `SkyrimNet.dll` (it contains the four dotted config paths `dialogue.speakerSelector.*` plus the log line `get_speaker_selector_settings: GameConfig not registered, returning defaults`; `companionInterrupt` appears zero times) and the live MCP `get_decorators` return info ("Object with silenceChancePercent … tagInScene").

**Consequence:** a third-party mod CANNOT add a field to that decorator's return, and cannot override a built-in decorator name. The original plan (`ss.companionInterrupt`) is unachievable. The setting instead flows through a **Skyrim global variable + the built-in `get_global_value()` decorator** (§4). `get_global_value(editorID)` is a built-in "Game System" decorator that returns the global's value as a float (0.0 if the global is missing).

## 4. Settings flow (the corrected architecture)

```
MCM slider (1–5)   ──┐
                     ├──▶ global SP_CompanionInterrupt (Long, default 3)
PrismaUI buttons   ──┘
                              │
                              ▼
        prompt line 7:  {% set companionInterruption = get_global_value("SP_CompanionInterrupt") %}
                              │
                              ▼
        {% if companionInterruption == 1 %} … {% elif … == 5 %}  (lines 67–111, unchanged)
```

- The value is read live on every selector call. Changing it in MCM or PrismaUI takes effect on the very next selector pass — no sync, no reload, no SkyrimNet config write.
- No `PatchConfig`, no shared JSON settings file for the level. The global IS the shared state (globals persist in the save).

There are three persistent pieces of state total:

| State | Where it lives | Read by | Written by |
|-------|----------------|---------|------------|
| Companion level (1–5) | global `SP_CompanionInterrupt` | prompt (`get_global_value`), MCM (display) | MCM, PrismaUI |
| Overlay hotkey | global `SP_OverlayHotkey` | PrismaUI C++ host | MCM (only) |
| Theme | PrismaUI-local | PrismaUI web view | PrismaUI web view (persist via localStorage or a small host file) |

## 5. Naming conventions (use exactly these)

- Plugin filename: `SelectorPreference.esl`
- Mod folder name (MO2): `SelectorPreference` (must be ordered AFTER `SkyrimNet_beta23.1` in the MO2 left pane)
- Global EditorIDs: `SP_CompanionInterrupt` (Long, default 3), `SP_OverlayHotkey` (Long, default = Page Up)
- Quest EditorIDs: `SP_ConfigQuest` (holds the config script), `SP_McmQuest` (holds the MCM script)
- Papyrus scripts: `SP_ConfigScript.psc` (extends `Quest`), `SP_McmScript.psc` (extends `SKI_ConfigBase`)
- PrismaUI view folder: `Data\PrismaUI\views\SelectorPreference\` (entry `index.html`)
- SKSE plugin DLL: `SelectorPreference.dll` (in `SKSE\Plugins\`)
- Mod event names: `SP_SetCompanionInterrupt`, `SP_OverlayHotkeyChanged`

## 6. Deliverable file tree (what the finished mod folder contains)

```
SelectorPreference/                        (MO2 mod folder)
├── SelectorPreference.esl
├── Scripts/
│   ├── SP_ConfigScript.pex
│   └── SP_McmScript.pex
├── SKSE/
│   ├── Plugins/
│   │   ├── SelectorPreference.dll
│   │   └── SkyrimNet/prompts/target_selectors/dialogue_speaker_selector.prompt   ← our deliverable prompt
│   └── ...
└── PrismaUI/views/SelectorPreference/
    ├── index.html
    ├── styles.css
    └── script.js
```

(The `.prompt` is the repo file at `prompts/target_selectors/dialogue_speaker_selector.prompt`, copied verbatim into the tree above.)

## 7. Component specs

### 7.1 Component 1 — Plugin (ESL) records

Author with houseCARL (`housecarl_create_record` + `housecarl_set_field`) or in the CK/xEdit. Load `mutagen-reference` before setting any field. Records:

- `GLOB` `SP_CompanionInterrupt` — Long, value **3**, constant **false**.
- `GLOB` `SP_OverlayHotkey` — Long, value = Page Up scan code (DXScanCode 201; verify the exact value the MCM `AddKeyMapOption` will emit), constant false.
- `QUST` `SP_ConfigQuest` — start-game-enabled, with `SP_ConfigScript` attached (VMAD) and the two globals bound as properties.
- `QUST` `SP_McmQuest` — start-game-enabled, with `SP_McmScript` attached (VMAD); bind the `ModName` property to the MCM page name (e.g. "Selector Preference") and the globals.

**Gotcha:** start-game-enabled quests silently never run without a `.seq` file. Generate it with `housecarl_write_seq` for `SelectorPreference.esl` (one .seq covers both quests). A plugin with start-game-enabled quests needs this or nothing starts.

### 7.2 Component 2 — Papyrus scripts

Compile with `housecarl_compile_script` (import the SkyrimNet `Source\Scripts` and SKSE/SkyUI SDK source dirs so `SKI_ConfigBase` and `SkyrimNetApi` resolve). Load `papyrus-reference` before writing calls.

**`SP_ConfigScript.psc`** (extends `Quest`):

- `OnInit()`: register for mod event `SP_SetCompanionInterrupt`; read `SP_CompanionInterrupt` and clamp to 1–5 (if <1 or >5, reset to 3). This script does NOT register the overlay hotkey — the C++ host owns that (§7.3).
- Function `SetCompanionInterrupt(int level)`: clamp to 1–5, `SP_CompanionInterrupt.SetValueInt(level)`.
- Function `GetCompanionInterrupt()`: `return SP_CompanionInterrupt.GetValueInt()`.
- Event `OnSP_SetCompanionInterrupt(string ev, string arg, float num, Form sender)`: `SetCompanionInterrupt(num as int)` — this is the bridge the PrismaUI host uses (the C++ host sets the global directly AND/OR fires this event; spec: the host sets the global directly via `RE::TESGlobal`, so this event is the fallback path and may be omitted — keep it simple: host sets the global directly, no event needed for the level).

**`SP_McmScript.psc`** (extends `SKI_ConfigBase`):

- Page "Companion Interruption":
  - `AddSliderOption("Companion Interruption", currentLevel, "{0}")` — range 1–5, interval 1, with a text label next to it showing the current label (STFU/Rare/Sometimes/More Often/Chatty). `OnOptionSliderAccept` → `SP_CompanionInterrupt.SetValueInt(round(value))`, refresh label.
  - `AddKeyMapOption("Overlay Toggle Key", SP_OverlayHotkey value)` → `OnOptionKeyMapChange` → write `SP_OverlayHotkey`, then `SendModEvent("SP_OverlayHotkeyChanged")`. `OnOptionDefault` resets to Page Up.
- **Gotcha (from SkyrimNet's own MCM):** reading `SKI_ConfigBase.CurrentPage`'s auto-property backing variable can throw `::CurrentPage_var was not successfully looked up` on some saves — track the current page in a local `string` and branch on that, as `skynet_McmScript.psc` does.

### 7.3 Component 3 — PrismaUI overlay (C++ SKSE plugin + web view)

This is a **C++ SKSE plugin** built with CommonLibSSE-NG + CMake. Requirements: SKSE64, Address Library, Media Keys Fix, VC++ 2022 redist (all already satisfied in this setup). Reference the Prisma UI docs (https://prismaui.dev) and the example plugin `PrismaUI-SKSE/example-skse-plugin`; the C++ header is `PrismaUI_API.h` and the API is requested via `PRISMA_UI_API::RequestPluginAPI(PRISMA_UI_API::InterfaceVersion::V1)`.

C++ host responsibilities:

1. On `kDataLoaded`: request the PrismaUI API; `CreateView("SelectorPreference/index.html", onDomReady)` — base dir is `Data\PrismaUI\views\`. Create exactly **one** view per plugin (Prisma UI requirement).
2. Read `SP_OverlayHotkey`; if <= 0, use Page Up. Register input handling for that key. On press, toggle `Show`/`Hide` (and `Focus`/`Unfocus`). Listen for the `SP_OverlayHotkeyChanged` mod event and re-read + re-register.
3. On DOM ready, `Invoke(view, "setState(...)")` with the current level (read `SP_CompanionInterrupt`) and stored theme.
4. `RegisterJSListener(view, "setLevel", ...)` — the web UI calls this when a button is clicked; the host sets `SP_CompanionInterrupt` (via `RE::TESDataHandler::GetSingleton()->LookupForm<RE::TESGlobal>(...)` then `->value = level`) and persists nothing else (the global persists).
5. `RegisterJSListener(view, "setTheme", ...)` — persist the theme (small JSON next to the DLL, or reuse localStorage if it persists in the view; pick one and document it).

Web view (`index.html` + `styles.css` + `script.js`):

- Thin HUD popout styled after `docs/5.html` + `docs/assets/overlay.css` (look only — do NOT copy the four-setting labels from `docs/assets/overlay.js`).
- Five labelled buttons: STFU / Rare / Sometimes / More Often / Chatty. Clicking calls `window.setLevel(n)`.
- Theme switcher `[moon | sun | eye]` in the upper-right; clicking calls `window.setTheme("dark"|"light"|"colorblind")` and swaps a `data-theme` attribute. Dark is default.

### 7.4 Component 4 — Prompt deployment

Copy `prompts/target_selectors/dialogue_speaker_selector.prompt` (from this repo, after the line-7 edit) to `SKSE\Plugins\SkyrimNet\prompts\target_selectors\` inside our mod folder. Because the mod folder is ordered after SkyrimNet in MO2, this overwrites SkyrimNet's copy. Then reload prompts in-game via the SkyrimNet MCP `reload_content(type="prompts")` (or the dashboard) so the change takes effect without restarting.

## 8. Verified API reference (facts to build against)

**SkyrimNet Papyrus API** (`mods\SkyrimNet_beta23.1\Source\Scripts\SkyrimNetApi.psc`, already verified — not needed for the level now, but relevant):

- `int RegisterDecorator(String decoratorID, String sourceScript, String functionName) Global Native`
- `int GetConfigInt(String configName, String path, int defaultValue)` / `bool PatchConfig(String name, String jsonPatch)` — the "game" config = `SkyrimNet.yaml` (`dialogue.speakerSelector.*` lives there). No longer needed for this mod's level, but recorded.
- Config write pattern is confirmed in `skynet_ConfigUtilityMenu.psc`.

**SkyrimNet decorators (via MCP `get_decorators`)**:

- `get_global_value(editorID)` → float, 0.0 if the global is missing. Used by the prompt.
- `get_speaker_selector_settings()` → hardcoded 4 fields (do not rely on it for the new setting).

**Prisma UI C++ API** (prismaui.dev): `CreateView(htmlPath, onDomReadyCallback)`, `Invoke(view, "jsExpr(...)")`, `RegisterJSListener(view, "jsFnName", callback)`, `Show/Hide/Focus/Unfocus/IsValid/Destroy`. Base dir `Data\PrismaUI\views\`. One view per plugin.

**SkyUI MCM (`SKI_ConfigBase`)**: `AddSliderOption`, `AddKeyMapOption`, `AddHeaderOption`, `AddTextOption`; events `OnConfigInit`, `OnConfigOpen`, `OnPageReset`, `OnOptionSelect`, `OnOptionKeyMapChange`, `OnOptionDefault`, `OnOptionSliderAccept`, `OnOptionHighlight`. Reference implementation: `mods\SkyrimNet_beta23.1\Source\Scripts\skynet_McmScript.psc` (note its `CurrentPage` workaround).

## 9. Build order + validation

1. **Phase 1 — plugin + Papyrus:** author the ESL records (globals, quests), attach + compile the two scripts, write the `.seq`. Validate: load a save, confirm `get_globals` (MCP) shows `SP_CompanionInterrupt` = 3, and `get_quest_scripts` shows the quests; confirm the MCM page appears.
2. **Phase 2 — MCM:** verify slider writes the global and the keymap writes `SP_OverlayHotkey`.
3. **Phase 3 — PrismaUI:** build the DLL + view; verify the overlay opens/closes on Page Up and clicking a button changes the global.
4. **Phase 4 — prompt + end-to-end:** deploy the prompt, `reload_content("prompts")`, then use MCP `render_template` (or `validate_prompt`) to confirm the rendered selector shows the correct block for each level (1–5), and that `get_global_value("SP_CompanionInterrupt")` resolves.

## 10. Gotchas / risks (read before coding)

- **`.seq` is mandatory** for start-game-enabled quests (houseCARL `housecarl_write_seq`).
- **`CurrentPage` Papyrus crash** in SKI_ConfigBase on some saves — use a local page-tracking string.
- **PrismaUI: one `PrismaView` per plugin**; assets must be local (no remote URLs).
- **`get_global_value` returns a float**; `{% if companionInterruption == 1 %}` … `== 5` compares numerically and works. Do not add a type filter unless verified against SkyrimNet's Inja build.
- **Do not touch anything under `overwrite\SKSE\Plugins\SkyrimNet\prompts\`** — those are the user's personal modifications, not ground truth.
- The level is enforced by the prompt only; the mod never rewrites a completed selector result.

## 11. Reference paths (all local, verified)

- Deliverable prompt: `prompts/target_selectors/dialogue_speaker_selector.prompt`
- Design language: `docs/5.html`, `docs/assets/overlay.css` (ignore the old four-setting labels in `docs/assets/overlay.js`)
- SkyrimNet Papyrus API: `mods\SkyrimNet_beta23.1\Source\Scripts\SkyrimNetApi.psc`
- SkyrimNet MCM reference: `mods\SkyrimNet_beta23.1\Source\Scripts\skynet_McmScript.psc`, `skynet_ConfigUtilityMenu.psc`
- SkyrimNet C++ API: `mods\SkyrimNet_beta23.1\CppAPI\PublicAPI.h`
- SkyrimNet modding docs: `mods\SkyrimNet_beta23.1\docs\modding\prompts-and-decorators.md`, `prompt-file-syntax.md`
- Prisma UI docs: https://prismaui.dev (API: `/api/create-view/`, `/api/invoke/`, `/api/register-js-listener/`), example plugin `github.com/PrismaUI-SKSE/example-skse-plugin`
- Original selector (baseline only): `References\dialogue_speaker_selector_original.prompt`
