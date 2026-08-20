---
name: precheck
description: Premortem before substantial work. Use when a wrong assumption could waste meaningful effort, invalidate the result, or make hard-to-reverse changes; rerun when the target, inputs, or scope materially change.
---

# Precheck

Run a **premortem** before substantial work.

Imagine completing the planned work and then discovering that its result must be discarded, substantially redone, or repaired. Work backward to find the **assumption cliffs** that could have caused that outcome.

For each cliff:

1. **Verify** it from available evidence.
2. **Bound** the work so the assumption remains cheap to reverse.
3. **Checkpoint** before the work crosses the cliff.
4. **Ask** only when the agent cannot resolve the cliff itself.

Focus on forks where the work commits to an interpretation before receiving evidence or feedback. Common forks concern the intended result, authoritative inputs, current state, audience, allowed changes, reversibility, and proof of completion.

Treat ambiguity as an assumption cliff when two plausible interpretations would produce materially different work. Resolve it from context or ask before choosing one.

Proceed when every material assumption cliff is verified, bounded, checkpointed, or raised to the user.

Keep the precheck proportional. Resolve it silently when it does not change the plan. Surface only unresolved questions, consequential assumptions, or safeguards that materially alter execution.

Run another precheck when new information changes the target, inputs, scope, or cost of being wrong.
