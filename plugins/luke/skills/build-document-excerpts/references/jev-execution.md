# Jev execution

## Prepare requests

Read `jev --help` for the installed interface. Before a new live run, dry-run a representative request and inspect the emitted state and question map: they must contain the intended passage and every criterion with the expected answer type. Keep the task's question map, unit inputs and raw results together with source provenance. Use stable unit IDs; include the substantive passage in each state, with locators as metadata.

For graded relevance, the demonstrated question-map shape is:

```json
{
  "emerging_requirements": {
    "type": "noul",
    "instructions": "Does this passage explain how requirements emerge during design? Judge this criterion from the supplied passage. Score 0 for absent, 0.25 for a mention, 0.5 for useful indirect treatment, 0.75 for a substantive explanation, and 1 for a central developed explanation."
  }
}
```

Apply the same relevance anchors to candidates being compared. Keep author reputation and title outside the basis for judgment; the passage supplies the evidence.

## Reuse and run

Reuse a result when the exact submitted state, question map and model configuration match the intended comparison; retain its original run provenance. Older results with different criteria can still locate candidates, but keep them distinguishable from current comparable scores. Preserve submitted inputs if later locator corrections change the reading guide.

Run the pilot first, then batch only the remaining units. Preserve errors and partial successes so retries target missing results. Check that every successful unit has an answer for every question. Retain reported token usage and request counts; report dollar cost only when pricing is available. Jev is unavailable only when `jev auth status` or a live request fails. Then report the failure, use applicable cached results, and ask the reader before selecting without Jev; record any such selection as unscored.
