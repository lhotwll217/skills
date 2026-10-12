# Alignment examples

## Settled request

> **Request:** Rename `fetchUser` to `getUser` across the repo.
>
> **Alignment:** I'll rename its definition and call sites, including tests. It's internal to this repo, so an alias isn't needed. Confirm?

The repo establishes that the function is internal. If it were exported from a published package, preserving compatibility would instead be a consequential decision to settle before renaming.

## Handoff

> **Brief:** Review the question-asking skill against the research and the owner's feedback. Read-only.
>
> **Receiver's alignment:** Purpose: find why the skill's outputs miss the big picture. Result: a verdict with quoted causes and sourced edits; I apply nothing. Open: whether to run the current skill for fresh outputs, since every existing output predates it. I recommend yes. I'll start once you confirm.

If the receiver had planned to apply its edits, the sender corrects that authority before confirming.

## Ambiguous artifact

> **Request:** Make a shared folder.
>
> **Alignment:** I'll create a folder for these files. Should it be shared independently or inherit access from the existing team folder? I recommend independent sharing if it needs a different audience.

## Showing the shape

> **Request:** Build the results pages from the wireframes. What are we using for the components?
>
> **Alignment:** One shared table on both pages, inside the existing shadcn setup:
>
> ```text
> <DesignDetail>
>   <Tabs>          new ui/tabs.tsx
>   <ChartCard>     existing, on ui/chart.tsx
>   <ResultsTable>  TanStack Table + ui/table.tsx
> <AllDesigns>
>   <ResultsTable>  same component
> ```
>
> Confirm?

## Correction

> **Request:** Drop the rule requiring three or four annotation boxes per screen.
>
> **Alignment:** I'll remove the fixed count and annotate what each screen needs. The agreed layout and both annotation dimensions remain: implementation state (Exists / Update / Add) and commitment status (including TBD). Confirm?

## Joint exploration

> **Request:** Help me figure out why our project handoffs keep going wrong.
>
> **Alignment:** We'll investigate where intended meaning gets lost across handoffs. Which episodes matter and how to group them are still open. I'll use actual episodes to develop findings and questions we can examine together. Confirm?

## Completion evidence

> **Request:** Enter this week's hours against these projects.
>
> **Alignment:** I'll enter the listed hours. Completion means the entries are saved in the timesheet; I'll identify any that fail to save. Confirm?

## A question during authorized work

> **Request:** Why did you check a scripted runtime instead of the real app?
>
> **Alignment:** I'll explain that choice. The existing requirement to verify against the real app still holds.

If real-app verification was already authorized, the agent answers and continues it. If the prior request was only to explain a discrepancy, it answers within that scope.

## Grounded writing

> **Request:** Tailor my resume for this platform-engineering role.
>
> **Alignment:** I'll tailor the resume using the verified experience in your career records. I'll flag gaps where those records don't support a requested qualification. The result is a draft for your review. Confirm?
