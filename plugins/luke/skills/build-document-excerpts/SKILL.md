---
name: build-document-excerpts
description: Use when choosing original passages to read with Jev or assembling them into a reading guide or compilation.
---

# Build document excerpts

## Establish the reading purpose

Recover the reader's learning question, source scope, available reading time and requested output from the conversation. Resolve missing information only when it changes the selection. Distinguish a guide linking to readings from a compilation containing them. Finish with a concrete selection target, such as understanding how requirements emerge during design within a half-hour reading.

Inspect available originals, extracted text, prior judgments and accepted readings. Record the source edition and its locators: printed pages separately from physical PDF pages, or stable headings for unpaginated text. Finish the inventory with a usable source path and locator scheme for each ready work, and explicit missing or unreadable regions for the rest. Use existing usable text; when source preparation is needed, identify that dependency and continue with ready sources. Selection begins with available material; acquisition and OCR belong to source preparation.

## Design the relevance questions

Translate the purpose into separate questions, each judging one criterion from the supplied passage. For example, “Does this passage explain how requirements emerge during design?” and “Does this passage explain how conflicts between requirements are resolved?” need separate answers. Use task-specific questions and explicit relevance anchors; a high score should mean developed treatment, rather than a passing mention. Keep individual answers visible, including when questions are grouped by topic.

Choose scoring units that fit the source and requested coverage: passages, complete sections or page-based units. Sections suit judging an argument; pages suit locating promising regions in a long work. Record unit IDs and source boundaries so every judgment can be traced back. This step is complete when each question has one interpretable criterion and each unit has enough source text to judge it.

Jev supplies every relevance score, even for a short source you could read whole; calling it is part of doing the work yourself. Your reading then chooses among scored candidates and fixes their boundaries.

## Prove one usable reading

Before scoring the collection, score a small set of plausible candidates with Jev and produce one complete recommendation. Read [Jev execution](references/jev-execution.md) before the first Jev request. An existing accepted pilot can satisfy this step when its purpose, inputs and output requirements still apply.

Read the candidates in context and expand the strongest choice to a coherent reading. Include the definitions, argument setup, figures, equations and notes needed to understand it, including dependencies on other pages. Mark exact heading or textual start/stop anchors and verify uncertain boundaries against the original. Whole-page extracts may contain neighboring material; specify where the recommended reading begins and ends.

The pilot passes when the reading has a citation and edition, exact start/stop anchors, printed and physical page ranges where applicable, a reason tied to the learning purpose, and access to the complete passage with its dependencies. A guide links to the full reading; a compilation includes the source body, figures and notes, with editorial introductions visibly separate. Assemble the first reading in the requested format. Assess remaining selection and assembly effort from this result before scaling; successful API responses alone leave the pilot unfinished.

## Select within scope

Reuse applicable judgments and score the remaining units within the requested scope. Account for scored, reused, excluded, unreadable and failed units; describe a sampled search as sampled. Address missing answers before claiming complete scoring coverage.

Use individual scores to find candidates, then read them and choose a complementary set. Record which part of the learning purpose each selection serves and its approximate reading time; the total must fit the reader's time budget. A valuable passage can reveal a gap in the questions: explain its inclusion from the text and its weaker measured match. Treat a revised question set as a new scoring basis. Relevance scores measure neither factual truth nor source fidelity.

Apply the pilot’s acceptance criteria to each remaining selection, reusing accepted checks where the source and transformation are unchanged. Finish when every selection passes and the collection covers the purpose within its declared search scope.

## Deliver the readings

Arrange the accepted readings in a useful order and merge overlaps without repeating source text. For EPUB or Kindle output, use [converting-to-epub](../converting-to-epub/SKILL.md) with the selected bodies, assets and boundary records.

Check the delivered guide's links or compilation's actual contents against the selected boundaries and dependencies. Report the artifact paths, coverage limits and any unresolved source defects. Completion is the requested usable reading artifact; scores and short quotations serve as selection evidence.
