# Proposed decomposition of the selector prompt

## Status

This is a cleaned scratch document. It proposes a way to classify the work performed by the selector prompt and records possible conflicts for later verification. It is not a design decision, implementation plan, or authoritative interpretation of SkyrimNet's runtime flow.

## Five proposed responsibilities in the original prompt

### 1. Output format

The prompt defines `0` and `Name>target`, requires an exact full candidate name, requires a target, and prohibits explanations or additional markup.

### 2. Decision whether an NPC speaks

The prompt contains the silence roll, the preference for silence under uncertainty, lists of reasons to choose or reject silence, and guidance about natural endings and exhausted exchanges.

### 3. Candidate eligibility

The prompt determines whether a person may be selected at all. Relevant instructions include the restriction against choosing someone for proximity alone, companion awareness, authority or duty, virtual-NPC rules, and the prohibition against selecting the last speaker.

### 4. Selection among eligible candidates

The prompt ranks direct involvement, unresolved exchanges, personal stakes, witnessed events, and Interjection guidance.

### 5. Target selection

The prompt considers the previous speaker and target, the addressed person's expected response, NPC-to-NPC continuation or conclusion, and redirection toward the player.

These categories overlap in the original prompt. The proposed decomposition is intended to reveal that overlap; it does not establish that each category can or should be implemented separately.

## Possible conflicts to verify

### Meaning of proximity

The prompt says proximity alone is not a reason to select a bystander. It separately treats witnessed events, companion status, authority, and duty as possible reasons. Those factors are not identical to physical proximity, but they generally require presence or awareness. The prompt does not clearly state what additional evidence makes presence sufficient.

The earlier scratch text called companion and role relationships forms of "relational proximity." That terminology risks obscuring distinct facts and has not been retained as a design concept.

### Topic relevance

The unresolved-exchange criterion says conversational momentum does not come from vague topical interest. Companion-awareness and Interjection instructions can still permit topic-based reactions. The boundary between an insufficient topical connection and a valid topic trigger is not explicit.

### Classification of the last line

The silence and restriction sections ask the model to distinguish a direct question or request from a statement, observation, or comment. This is a semantic judgment based on the dialogue, not a fact currently supplied by Jinja.

### Silence and companion speech

The prompt says not to force dialogue to fill silence and says that companions should speak when there is even a mild reason. Both instructions may apply to the same selector call.

### Section order

The documents report that moving the silence, eligibility, and selection sections changes the model's behavior. This is an observation to reproduce, not a proven explanation of model weighting.

## Runtime flow clarified after the scratch work

The selector is purely reactionary. The established sequence is GameMaster evaluation, a directed response generated through `dialogue_response.prompt`, memory search, mood analysis, and only then the speaker-selector call.

GameMaster's `StartConversation` and `ContinueConversation` actions both operate upstream of the selector. Each directs an NPC line through `dialogue_response.prompt`. The selector receives the resulting speaker-recipient exchange and decides whether another NPC reacts.

The earlier claim that every non-addressed speaker is an interruption remains only a hypothesis and has not been accepted as a complete definition of selector behavior.

## Cost of additional settings

Each setting may add conditional instructions and context to the rendered prompt. The scratch hypothesis is that more controls may reduce instruction-following reliability on a small model even when each control is individually reasonable.

The only accepted consequence is that the usefulness of every additional control should be evaluated. No minimum number of controls has been chosen. The two interruption controls remain locked regardless of this hypothesis.

## Proposed structural eligibility question

The scratch work asks whether facts available to Jinja can decide enough eligibility questions that the model is left with a smaller selection task.

Available facts include the last speaker, last target, player identity, follower status, virtual-NPC status, candidate tags, and other values already rendered by SkyrimNet. Semantic facts such as whether a remark is insulting, whether a duty requires a response, or whether Interjection guidance applies to the last line are not established template facts.

It remains open whether eligibility can be fully determined from available facts, partially reduced, or must remain substantially model-judged.

## Model-size observations and hypotheses

- The final output is a classification result, but producing it may still require semantic judgment.
- The current prompt requires that judgment while presenting overlapping or contradictory instructions in a single forward pass.
- The reported difference between DeepSeek V4 Flash builds 0423 and 0731 on the same prompt suggests prompt fragility, but it does not by itself identify the cause.
- A 27–31B API model is a proposed practical target, not a requirement.
- A local model such as Gemma 4 E4B is a separate stretch goal.
- Small mixture-of-experts models may still spend too many reasoning tokens to meet latency and cost goals. Model name or active-parameter count alone is not a qualification result.

## Open questions retained from the scratch work

- Can any eligibility decisions be made entirely from available template facts?
- Which semantic judgments remain after interruption instructions are selected conditionally?
- Does any selector decision require a control distinct from interruption?
- Where is the practical model floor for the reorganized prompt?
- How can candidate models be tested without relying only on long, uncontrolled play sessions?
