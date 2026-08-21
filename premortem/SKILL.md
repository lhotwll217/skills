---
name: premortem
description: Premortem before substantial work. Use when a wrong assumption could waste meaningful effort, invalidate the result, strand related work, or make hard-to-reverse changes; rerun when the target, inputs, scope, or surrounding state materially change.
---

# Premortem

Run a **premortem** before substantial work.

Imagine completing the planned work and then discovering that its result must be discarded, substantially redone, repaired, or declared complete while related work remains stranded. Work backward to find the **assumption cliffs** that could have caused that outcome.

For each cliff:

1. **Verify** it from available evidence.
2. **Bound** the work so the assumption remains cheap to reverse.
3. **Checkpoint** before the work crosses the cliff.
4. **Ask** only when the agent cannot resolve the cliff itself.

Focus on forks where the work commits to an interpretation before receiving evidence or feedback. Common forks concern the intended result, authoritative inputs, current state, audience, allowed changes, reversibility, and proof of completion.

Treat ambiguity as an assumption cliff when two plausible interpretations would produce materially different work. Resolve it from context or ask before choosing one.

Project the whole end state, including work already in flight. For each existing change, draft, artifact, or running task that would remain after completion, determine whether the outcome incorporates it, preserves it intentionally, or needs an owner decision.

Proceed when every material assumption cliff is verified, bounded, checkpointed, or raised to the user.

Keep the premortem proportional. Resolve it silently when it does not change the plan. Surface only unresolved questions, consequential assumptions, or safeguards that materially alter execution.

Run another premortem when new information changes the target, inputs, scope, surrounding state, or cost of being wrong.
