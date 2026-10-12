# Alignment examples

These illustrative exchanges calibrate the rules in [SKILL.md](SKILL.md). They show proposed behavior, including adaptations of observed failures; they are not transcripts or evidence that the skill works.

## Settled request

> **Request:** Rename `fetchUser` to `getUser` across the repo.
>
> **Alignment:** I'll rename its definition and call sites, including tests. It's internal to this repo, so an alias isn't needed.

The repo establishes that the function is internal. If it were exported from a published package, preserving compatibility would instead be a consequential decision to settle before renaming.

## Settled handoff

> **Request:** Continue the agent and write the skill from our agreed design: establish alignment and maintain it as work changes.
>
> **Alignment:** I'll continue the same agent to write the skill and its examples from that design. It includes your latest clarification: restate settled understanding so it's reviewable, then proceed.

If the receiver instead describes a skill that aligns only once at the start, the sender corrects that scope before drafting begins.

## Ambiguous artifact

> **Request:** Make a shared folder.
>
> **Alignment:** I'll create a folder for these files. Should it be shared independently or inherit access from the existing team folder? I recommend independent sharing if it needs a different audience.

## Correction

> **Request:** Drop the rule requiring three or four annotation boxes per screen.
>
> **Alignment:** I'll remove the fixed count and annotate what each screen needs. The agreed layout and both annotation dimensions remain: implementation state (Exists / Update / Add) and commitment status (including TBD).

## Joint exploration

> **Request:** Help me figure out why our project handoffs keep going wrong.
>
> **Alignment:** We'll investigate where intended meaning gets lost across handoffs. Which episodes matter and how to group them are still open. I'll use actual episodes to develop findings and questions we can examine together.

## Completion evidence

> **Request:** Enter this week's hours against these projects.
>
> **Alignment:** I'll enter the listed hours. Completion means the entries are saved in the timesheet; I'll identify any that fail to save.

## A question during authorized work

> **Request:** Why did you check a scripted runtime instead of the real app?
>
> **Alignment:** I'll explain that choice. The existing requirement to verify against the real app still holds.

If real-app verification was already authorized, the agent answers and continues it. If the prior request was only to explain a discrepancy, it answers within that scope.

## Grounded writing

> **Request:** Tailor my resume for this platform-engineering role.
>
> **Alignment:** I'll tailor the resume using the verified experience in your career records. I'll flag gaps where those records don't support a requested qualification. The result is a draft for your review.

