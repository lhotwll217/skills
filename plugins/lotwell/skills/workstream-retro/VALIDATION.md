# Validating workstream-retro changes

This is maintainer documentation, not generation context. The skill must produce a useful retrospective without seeing a completed output.

## Example policy

The original Owner Operator capture remains in the owner's private workspace. It is not vendored with this public skill because exposing a finished artifact lets a generation test pass by copying its structure and content instead of following the skill.

A prior capture may still be supplied intentionally when visual continuity is the task. That is a reference-assisted generation case, not an isolated test of the skill.

## What failed during the generalization change

Two checks were insufficient:

1. A static review compared the revised instructions with the existing capture. That showed that explicit requirements remained, but it did not exercise generation.
2. A fresh agent was asked to regenerate the capture while allowed to read the accepted HTML. Its output differed from the accepted file by one CSS rule. This showed preservation under direct reference exposure, not independent generation or portability.

Neither result supports the claim that generalized wording preserves output quality by itself.

## Isolated validation protocol

### 1. Freeze the baseline

Save the before-change skill and grammar. Record the harness, model, effort, task prompt, evidence inputs, and allowed references.

### 2. Run a regression pair

Launch fresh isolated sessions for the old and new skill with identical inputs. The skill version is the only variable. Withhold completed output artifacts from both sessions.

Use a real, evidence-backed Owner Operator brief to test regression behavior.

### 3. Run a portability case

Use a real brief from another orchestrator. Give the agent that system's transcript/search surface, execution records, tracker evidence, and artifacts. Withhold completed output artifacts.

This case passes when the result preserves the orchestration grammar without inventing Owner Operator-specific lifecycle concepts.

### 4. Grade behavior

Check each output against the same rubric:

- workstream roots, outcomes, and chronology match the evidence;
- the human-owner route is visible;
- owner-participating sessions remain distinct from unattended child executions;
- verification remains distinct from independent review;
- consequential checkpoints include their routing consequences;
- failures, interruptions, supersessions, and reroutes remain discoverable;
- overview, topology, chronology, checkpoints, legend, filters, and details work;
- keyboard behavior, desktop/mobile layout, overflow, console errors, and privacy checks pass.

Use a fresh reviewer blinded to which skill produced each artifact. Compare structure and screenshots for material regressions; byte equality is not the goal.

### 5. Bound the claim

A reference-assisted generation proves visual continuity under reference exposure. An isolated regression pair tests behavior preservation. A non-Owner-Operator case tests portability. Report only the claim earned by the completed case.
