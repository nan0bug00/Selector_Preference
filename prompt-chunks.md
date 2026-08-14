# Instruction paragraph worksheet

This is a sketch pad, not the real `.prompt` file. No Jinja yet. We fill short English paragraphs here, argue about wording, then wire the `{% if %}` checks later.

## Why this is not 450 prompts

Four sliders, times every mix of their positions, times "the player was the last target or was not," looks like a huge grid. It is not.

Each processing of the prompt only includes the sliders that apply right now. The others are deleted before the model sees anything.

So we never write a special "when to choose silence" essay for the mix 3,2,2,1 versus 5,1,3,1. We write one instruction paragraph per slider position. This processing of the prompt keeps two or three of those paragraphs. Together, they are the silence section.

If two kept paragraphs ever tell the model opposite things, that is a bug in those paragraphs, not a missing 451st variant.

## Grades (not on/off)

Followers get five positions on interruption. Non-followers get four.

**Follower interruption:** 1 Stay out / 2 Rare / 3 Sometimes / 4 Often / 5 Jump in

**Follower chattiness:** Quiet / Rare / Sometimes / Chatty / Very chatty *(not filled yet)*

**Non-follower interruption:** 1 Stay out / 2 Low / 3 Medium / 4 Chatty

**Non-follower chattiness:** Quiet / Sometimes / Chatty *(not filled yet)*

Chattiness does not pull the long personality paragraph. Interruption does, starting at the position that asks whether this person's personality warrants cutting in.

For followers, that is position 4 and 5: print `render_character_profile("bio_personality", ...)` for each follower on the candidate list. Positions 1–3 do not print it.

For non-followers, that is position 4: print the same for bystanders. Positions 1–3 do not.

The person you are already talking to is never a bystander. Hulda answering you is not this slider.

## Candidate list (always printed)

The engine always hands the selector the nearby people. We always print that list: every row the selector already prints (name, tags, one-line summary, Interjection). We do not omit a follower or a bystander from Candidates because interruption is Stay out.

Stay out tells the model not to pick those people as speaker. It does not delete their row. During a processing of the prompt where the last speaker and last target are the player and a townsperson, do not pick a follower (or a bystander) as speaker. Interjection and tags do not override that. A later processing of the prompt, when nobody is in that conversation, does not include the interruption paragraph, so the same people can still be picked for idle talk or road comments.

Omitting the row would stop them cutting in, and would also stop them talking on the road. Telling the model not to pick them is a weaker lock: a small model can still pick a name that is on the list. That is the trade. Do not go back to hiding rows to make Stay out stricter.

Personality is a separate print: still only at follower interruption 4–5 and non-follower interruption 4. That is extra bio on a row that is already there, not a reason to hide anyone.

---

## Four cases, from who just spoke and who they spoke to

The model is not asked "was that a question?"

| What just happened | How we know | Which sliders apply |
| --- | --- | --- |
| You and a townsperson | Last speaker and last target are you and a non-follower, either way | Follower interruption. Non-follower interruption (bystanders). The townsperson you were talking to answering you is not a slider; they were addressed. |
| You and a follower | Last speaker and last target are you and a follower, either way | Follower chattiness (other followers joining). Non-follower interruption (a townsperson cutting in). |
| Two NPCs talking | Last speaker and last target are both NPCs | Non-follower chattiness (the person who was addressed, continuing). Non-follower interruption (a third townsperson). Followers joining this is still the open question. |
| Idle or travel | Nobody just addressed anyone, or only a GameMaster nudge with no back-and-forth yet | Follower chattiness. Non-follower chattiness. Interruption sliders stay out of the prompt. |

Hulda answering you after you asked her something is "you and a townsperson," not interruption. Olfina cutting in before you answer Hulda is follower interruption.

## What each grade must answer

Three lists. They have to agree with each other. At Stay out, "choose `0`" is long and "do not choose `0`" is almost empty. At Jump in, the opposite.

1. **Choose `0` when** — silence is the right output.
2. **Do not choose `0` when** — silence would be wrong. Omit this list entirely at the lowest grade if there is nothing honest to put here.
3. **If someone speaks, prefer** — who, and only among people this slider is about (followers, or bystanders, not both in the same paragraph).

Interjection still decides who among the people this slider allows. The slider decides how often that is allowed.

---

## You and a townsperson

This is the case that has been ruining conversations in the Bannered Mare (you talk to Hulda, a follower or a bystander speaks before you can answer). Fill this completely before the others.

Shared, always kept when the last speaker and last target are you and a townsperson (not a slider):

- Do not pick the person who just spoke.
- If you just spoke to Hulda, Hulda is the natural next speaker if anyone NPC should talk.
- If Hulda just spoke to you, `0` means you can answer. A follower or bystander speaking is interruption, and only the interruption paragraphs below may allow it.
- Do not pick someone just because they are nearby.
- Do not have anyone comment that you are taking too long.

### Follower interruption

Each position **adds** reasons. Higher positions still include everything below them. Every position still forbids: you have not answered yet; they are a follower and standing there; a pause in the talk.

#### 1 — Stay out

Followers stay on the candidate list. Do not pick a follower as speaker. The townsperson you are talking to can still be picked. If Hulda just spoke to you, `0` means you can answer. Interjection, `[COMPANION]`, and `[ENGAGED]` do not override this. No extra reasons.

#### 2 — Rare

Pick a follower only if at least one of these is true:

- You (or the townsperson) addressed them by name, including an introduction (“let me introduce you to my friend, Olfina”).
- The last line referred to them (“Olfina will love this mead”).
- Their job would demand a response here (the same idea as the original prompt’s authority/duty line: guard, housecarl, and so on, and only when that job actually requires a response in this exchange, not because they have the job).
- Personal stakes that are specific people: the Interjection list names a friend, lover, family member, or rival who was just talked about. Topic triggers on that list (elves, rain, Imperial talk in general) do **not** count at this position.

#### 3 — Sometimes

Everything in 2, except the Interjection restriction is lifted: the **full** Interjection list may count (topics as well as people).

Also pick a follower if they have a reason, tied to what just happened, to warn, object, de-escalate, or escalate a conflict. “Conflict” means an actual argument, threat, or fight in the recent log, not a calm directions question.

#### 4 — Often

Everything in 3, plus:

- You just made a decision that affects this follower: accepted a quest, bought a house, adopted a child, took a new companion, and so on. The last events in the log have to show that, not a guess.
- The one-line summary and the long personality paragraph (now printed) give a reason to cut in on **this** last line. The reason must point at what was just said.

#### 5 — Jump in

Print followers, including the long personality paragraph. Interjection is in the prompt, same as at lower positions.

Do not include the reason lists from 1–4. Do not tell the model it may only cut in if someone was named, if a job demands it, if there is a conflict in the log, or if a decision affected the follower. The model uses the conversation log plus that follower's summary, Interjection, and personality, and judges for itself whether they would enter.

This position is for people who do not mind followers talking over them often, or who are paying for a larger model that can use that extra bio context. Still one speaker. The person who just spoke cannot speak again.

### Non-follower interruption (bystanders)

Nazeem at the door is a bystander. Hulda, if you are talking to Hulda, is not.

#### 1 — Stay out

Bystanders stay on the candidate list. The person you are talking to is not a bystander and can still be picked. Do not pick a bystander as speaker. Interjection does not override this.

#### 2 — Low

Pick a bystander only if:

- They were addressed or referred to by name in the last line.
- Their job would demand a response in this exchange (innkeeper, guard, merchant, jarl — only when that job actually requires it here).
- The Interjection list names a specific person who was just talked about (friend, family, rival). Topic triggers do not count yet.

#### 3 — Medium

Everything in 2, plus the full Interjection list, plus warn / object / de-escalate / escalate when the log shows a real conflict they have a job or Interjection reason to enter.

#### 4 — Chatty

Everything in 3, plus the one-line summary and the long personality paragraph (now printed) give a reason to cut in on this last line. More latitude than 3, still not “I am nearby” and still not “the player has not answered yet.”

---

## Idle or travel (sketch, not filled)

Only chattiness. Interruption paragraphs are not in the prompt.

Need to write Quiet through Very chatty for followers, and Quiet / Sometimes / Chatty for non-followers, with the same three lists.

Quiet should make comments while traveling rare. Very chatty should allow a follower to say something like "this rain doesn't let up" without a crisis happening. These chattiness paragraphs must not be included while you are talking to a townsperson. That case uses the interruption paragraphs above instead.

## Two NPCs talking (not filled)

Non-follower chattiness: Jon answering Olfina is continuing, not interrupting.

Non-follower interruption: Nazeem joining them.

Followers joining them: still open. Do not write that paragraph until we pick chattiness vs interruption vs ignore.

## You and a follower (not filled)

Other followers joining: follower chattiness until we say otherwise.

A townsperson cutting in: non-follower interruption, same grades as above. We can reuse those bystander paragraphs if the wording still holds.

---

## Order of work

1. Finish the wording for "you and a townsperson" (the paragraphs already drafted above). That is the case where you ask Hulda for directions and Olfina or Nazeem jump in before you can answer.
2. Write the idle / travel chattiness grades. That is the case where you are walking a road or standing around with no conversation in progress, and you either want comments like the rain line or you want people to stay quiet.
3. Write "two NPCs talking" after we decide what followers do when they are not part of that conversation.
4. Write "you and a follower" last.
5. Only then turn this file into Jinja. If a paragraph is still unclear in English, it will be unclear in the `.prompt` too.

When we test, change one slider, keep who just spoke to whom fixed. If the mix 3,2,2,1 and the mix 5,1,3,1 feel wrong, look at which one kept instruction paragraph is wrong. Do not start writing a unique essay for every mix of slider positions.
