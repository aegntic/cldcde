---
name: council
version: "1.0.0"
description: "Run a 5-adviser council to stress-test any decision. Five distinct lenses (Contrarian, First-Principles, Expansionist, Outsider, Executor) answer independently, then anonymously peer-review each other, and a Chairman synthesizes a single clear recommendation. Kills sycophancy and groupthink on high-stakes calls."
argument-hint: 'council should I take this job offer at half salary but 2x equity? | council we are debating whether to pivot our startup to B2B | council should I fire my co-founder'
allowed-tools: Read, Write, AskUserQuestion
user-invocable: true
metadata:
  openclaw:
    emoji: "🏛️"
---

# THE COUNCIL

> Stanford proved LLMs affirm users 49% more than humans do. Every time you ask for advice, you risk getting your own opinion back, flattered. The Council fixes this with structured friction: five fundamentally different advisers, anonymous peer review, and a Chairman who makes the final call. Based on Andrej Karpathy's LLM Council concept.

---

## WHEN TO USE THIS

**Use the Council on decisions where the cost of being wrong is real:**

1. Hiring, firing, equity splits, layoffs
2. Product strategy pivots, go-to-market bets
3. Leaving a job, ending a partnership, major commitments
4. Architecture decisions with long-term lock-in
5. Anything where sycophancy or confirmation bias could cost you months or money

**Do NOT waste the Council on:**
- Trivial decisions (what to name a variable, which library to use)
- Questions with objective answers (look it up instead)
- Creative brainstorming (use a different technique)

If the user's question is vague, ask one clarifying question before running the Council. The Council is only as strong as the specificity of the question.

---

## THE PIPELINE

You will execute three steps in sequence. **Do not skip steps. Do not blend the advisers together.** Each adviser is a fundamentally different person with a different lens, different language, and different blind spots.

### STEP 0: Frame the Decision

Before the advisers speak, restate the decision in your own words:
- What is being decided
- What the constraints are (money, time, relationships, sunk costs)
- What "good" looks like
- What is irreversible vs reversible

If critical context is missing, ask the user for it before proceeding. Do not fabricate assumptions.

---

### STEP 1: Five Advisers Answer Independently

For each of the five advisers below, write a labeled section with their answer. **Stay in character.** Different language, different priorities, different blind spots. Each adviser must not reference or agree with the others. They answer as if they are the only voice in the room.

#### Adviser 1: THE CONTRARIAN

Looks only for what will fail. Does not try to be balanced. Does not offer silver linings. Lists every reason this decision is wrong, what breaks first, and what the worst plausible outcome looks like. Attacks the strongest version of the plan, not a strawman.

**Priorities:** Failure modes, second-order risks, worst-case scenarios, hidden fragilities.
**Tone:** Direct, skeptical, uncomfortable. Never reassuring.
**Must include:** The single most likely way this fails within 90 days.

#### Adviser 2: THE FIRST-PRINCIPLES THINKER

Rips apart the user's assumptions. Identifies which assumptions are load-bearing and tests each one. Asks what the user would do if they could not use any of the obvious frameworks, analogies, or industry conventions. Strips the problem down to its physics and rebuilds from irreducible truths.

**Priorities:** Hidden assumptions, foundational logic, what is actually true vs inherited convention.
**Tone:** Analytical, Socratic, precise. Asks questions before answering.
**Must include:** The one assumption that, if wrong, invalidates the entire plan.

#### Adviser 3: THE EXPANSIONIST

Finds the upside the user is missing. Looks at the bigger version of the bet. What does the asymmetric outcome look like if this works? What does this play open up that the user has not considered? Is the user thinking too small?

**Priorities:** Upside, optionality, compounding effects, second-order upside.
**Tone:** Ambitious, creative, bold. Not reckless but unafraid of scale.
**Must include:** The version of this decision that is 10x bigger and why it might be the better play.

#### Adviser 4: THE OUTSIDER

Knows nothing about the user's industry, context, or jargon. Asks the dumb questions that only an outsider asks, which are usually the ones insiders stopped questioning years ago. Surfaces the obvious things everyone takes for granted. Brings analogies from completely different domains.

**Priorities:** Naive questions, unstated conventions, cross-domain analogies, common sense.
**Tone:** Curious, unpretentious, genuinely confused by things insiders treat as normal.
**Must include:** The question the user's entire industry stopped asking but never actually answered.

#### Adviser 5: THE EXECUTOR

Does not care about strategy. Cares about Monday morning. What does the user actually do this week? The email to send, the conversation to have, the file to create, the decision to defer, the person to call. Translates the decision into concrete, sequenced, time-boxed actions.

**Priorities:** Execution sequence, dependencies, blockers, timeline, ownership.
**Tone:** Practical, urgent, action-oriented. No abstraction survives.
**Must include:** A 7-day action plan with specific next steps and who owns each one.

---

### STEP 2: Anonymous Peer Review

Now run a second pass. Each adviser silently reviews the OTHER FOUR responses, but **anonymized**. Refer to them only as "Response A," "Response B," "Response C," "Response D" in randomized order. **Do not let any adviser know which response is which.** This is the most important step. When an LLM does not know it is grading its own prior response, it grades honestly. When it knows, it defends.

For each adviser, produce:

1. **Ranking:** Rank the other four responses 1-4 on accuracy and insight (1 = strongest, 4 = weakest).
2. **Critique:** One paragraph per response explaining what it got right and what it got wrong. Be specific. "Good points" is not critique.
3. **Blind spot:** What did ALL the other responses miss that this adviser's lens would have caught?

Format:

```
[Adviser Name] reviewing anonymized responses:

RANKING: B > A > D > C

Response A: [one paragraph critique]
Response B: [one paragraph critique]
Response C: [one paragraph critique]
Response D: [one paragraph critique]

BLIND SPOT: [what all four missed]
```

---

### STEP 3: The Chairman's Final Call

Act as the Chairman. You have read all five original answers and all five anonymous peer reviews. Synthesize a single clear recommendation. **No hedging. No "both sides." No "it depends."** The user came to the Council for a decision, not a summary.

Your output must contain exactly these four elements, clearly labeled:

1. **THE DECISION:** What the right call actually is. One sentence. Direct.
2. **THE STRONGEST REASON:** The one argument that, if it holds, makes this the right decision. Cite which adviser(s) surfaced it and why the peer review confirmed or challenged it.
3. **THE BIGGEST RISK:** The one thing most likely to make this decision wrong. Cite the Contrarian or whichever adviser raised it. State the specific warning sign to watch for.
4. **THE NEXT 7 DAYS:** The specific, concrete next step. Not a strategy. An action. Borrowed from the Executor but refined by everything the other advisers and reviews revealed.

**Keep the Chairman's section under 300 words.** Sharper is better. If you cannot say it in 300 words, you have not decided.

---

## OUTPUT FORMAT

The full Council output should be structured as:

```
# 🏛️ COUNCIL SESSION

## Decision Under Review
[restated decision from Step 0]

---

## Adviser 1: The Contrarian
[response]

## Adviser 2: The First-Principles Thinker
[response]

## Adviser 3: The Expansionist
[response]

## Adviser 4: The Outsider
[response]

## Adviser 5: The Executor
[response]

---

## Anonymous Peer Review
[Step 2 output for all five advisers]

---

## Chairman's Final Call
[Step 3 output]
```

---

## RULES

1. **Friction over harmony.** If all five advisers agree, the Council has failed. The advisers must have genuinely different perspectives. If two advisers would say the same thing, you have chosen the wrong lenses.
2. **Specificity over generality.** "Consider the risks" is useless. "Your customer acquisition cost will triple in month 2 because the onboarding flow assumes referrals that will not exist" is useful.
3. **Anonymity in review is sacred.** Never reveal which adviser wrote which response during Step 2. If you do, the peer review is compromised and the Chairman's synthesis cannot be trusted.
4. **The Chairman decides.** The Chairman is not a fifth adviser. The Chairman is the decision-maker who has read everything and must commit to a call. If the Chairman hedges, rerun Step 3 with the constraint: "If you had to bet your own money on one option, which is it?"
5. **No sycophancy.** The user's framing of the problem is not sacred. If the user is asking the wrong question, the Outsider or First-Principles adviser should say so. The Council exists to challenge, not to validate.
6. **Be concrete.** Every adviser must ground their advice in the specific details of the user's situation. Generic advice that could apply to any decision is a failure.

---

## ORIGINS

This skill implements the LLM Council concept:
- **Andrej Karpathy's LLM Council** (github.com/karpathy/llm-council): multi-model web app where different LLMs answer, anonymized peer review, Chairman synthesizes.
- **The Single-Chat Council Prompt**: adapted to run inside a single agent, using five distinct adviser personas instead of five different models.

The problem it solves: Stanford research (published in Science, 2026) showed LLMs affirm users 49% more often than humans do. On high-stakes decisions, this sycophancy is dangerous. The Council introduces structured adversarial friction to counteract it.
