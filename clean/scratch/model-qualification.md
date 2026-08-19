# Proposed model-qualification method

## Status

This cleaned scratch document records a possible way to evaluate whether a model can run the selector. It is not a locked requirement, work plan, or completed benchmark.

The proposed primary target is a 27–30B API model running on provider hardware. A local 4B-class model such as Gemma 4 E4B is a separate stretch goal and is not covered by the same performance assumptions.

## Proposed evaluation categories

### Response time

The source proposal expects the selector to support at least 15 calls per minute without noticeably stalling conversation. It proposes measuring provider-side p95 latency rather than estimating it.

This threshold has not been validated against a completed implementation.

### Reasoning effort

Low reasoning effort is preferred. Medium effort is considered only for an otherwise fast model. A model that succeeds only at its highest effort setting would not meet the proposed latency objective.

### Compliance with deterministic instructions

The proposed objective checks include:

- Do not select the last speaker.
- A Stay out position prevents selection of the class covered by that interruption control.
- The output is exactly `0` or `Name>target`.

The source scratch file also treats “the player was just addressed and Stay out is set means `0`” as deterministic. That statement depends on unresolved decisions about the availability of `0` and the interaction of the two interruption controls, so it is not treated as a settled test here.

### Responsiveness to settings

For the same scene, changing only an interruption position should change the selection rate in the intended direction across repeated runs. The source proposal uses this to distinguish a functioning control from a setting the model ignores.

No required sample size or acceptable rate difference has been chosen.

### Avoiding constant silence or constant speech

Across varied scenes, both `0` and speaker selections should occur. The source proposal rejects models that collapse to nearly all silence or nearly all speech.

No numerical boundaries have been chosen.

### Cost

The source proposal requires per-call cost to be no higher than the current DeepSeek V4 Flash selector and aims below that cost. The current provider, prompt length, output length, and exact DeepSeek baseline were not recorded in the repository, so this comparison cannot yet be executed from these files alone.

### Subjective speaker quality

The source proposal deliberately avoids treating one `speaker>target` answer as uniquely correct when several choices are plausible. It instead evaluates deterministic compliance, setting responsiveness, and aggregate behavior.

How subjective quality should be reviewed remains open.

## Proposed controlled-scene method

In-game testing changes several variables at once: nearby NPCs, GameMaster behavior, location, recent events, and character Interjection text. The proposed alternative is a harness that renders the selector prompt from fabricated or captured state.

The desired comparison would hold the following constant:

- Candidate list and candidate information.
- Recent events.
- Last speaker and last target.
- Location and other rendered context.
- Model and inference settings.

It would then change one interruption position and repeat the call enough times to measure compliance and selection rates.

The feasibility of setting all required state has not been established.

## SkyrimNet Prompt Tuner as an unverified candidate

The scratch notes identify SkyrimNet Prompt Tuner by SpookyPirate as a possible harness. Reported features include live scene preview, model comparison, meta-agent benchmarking, latency and token measurements, and support for common hosted and local API formats.

Before relying on it, verify whether it can:

- Set the last speaker and last dialogue target.
- Supply the custom interruption settings or decorators.
- Hold a scene constant while changing one setting.
- Fabricate or import candidate distance, tags, short profiles, and Interjection text.
- Render the exact selector prompt that the add-on will use.
- Repeat runs and export enough data for rate and latency measurements.

Until those points are verified, the application is only a possible tool.

## Missing decisions and measurements

- Final selector prompt and rendered token count.
- Exact model candidates and provider settings.
- Acceptable latency distribution.
- Number and composition of controlled scenes.
- Repetition count per setting.
- Numerical limits for rule violations and all-silence or all-speech behavior.
- Current DeepSeek cost baseline.
- Treatment of provider errors and malformed output.
- Method for reviewing plausible but undesirable speaker choices.
