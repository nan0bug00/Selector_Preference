# Speaker-selector prompt drafts

## First three attempts

`01-minimal-reaction.prompt`, `02-addressed-first.prompt`, and `03-permitted-reasons.prompt` are retained as failed attempts. They made the recipient and enumerated interruption reasons nearly the only routes to speech. Their Jinja structure and candidate labels may contain reusable pieces, but their central selection logic is too restrictive.

## Second three attempts

### `04-surgical-three-phase.prompt`

This is the conservative attempt. It preserves a broad general reaction-selection section and the existing three-part order while replacing standing interruption pressure with one Jinja-selected instruction for each applicable population. Its selection factors are expressly non-exhaustive.

### `05-random-permission.prompt`

This attempt removes interpretation of graded frequency from the model. Jinja converts each interruption position and SkyrimNet's existing `random` value into a simple permitted or blocked result for the current call. The percentages are illustrative, and reuse of the silence-roll value creates a correlation that would need testing.

### `06-holistic-reaction.prompt`

This attempt removes enumerated permission lists. The model makes one broad comparison using all supplied candidate information, while Jinja changes only how reluctant it should be to select someone who would displace the current exchange. It deliberately accepts vague relative judgment in exchange for preserving open-ended reactions.

## Shared draft assumptions

- `ss.followerInterruption` and `ss.nonFollowerInterruption` are placeholder setting fields.
- `0` is always available when the player was addressed. Otherwise the existing silence roll controls whether `0` is offered.
- Every candidate row remains visible.
- The long `bio_personality` render remains unverified.
- These files have not been rendered or validated by a live SkyrimNet instance.
