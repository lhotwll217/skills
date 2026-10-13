Read [pstack portability and capability checks](../pstack/README.md) before following this workflow. Owner and harness policy governs every step.

# Poteto help

Answer the user's question about pstack, hand them a prompt they can send, and link the file the answer came from. For a help question, don't start the work. The user asked how, and a pstack run spends real tokens, so let them send the prompt.

A message that asks for work, such as "use pstack to fix this bug", is not a help question. Read [`poteto-mode`](../pstack-poteto-mode/WORKFLOW.md) and do the work under it.

This file maps questions to the skills and guide pages that hold the answers. Those files own the details. Read the file you route to before you quote it, and trust it when it disagrees with this map. The links here point into the installed port, which the user may not be able to open, so give the user the file's public copy: `https://github.com/lhotwll217/pstack/blob/main/skills/` followed by its path. Guide pages are not ported; link them at the upstream commit this port tracks.

## Find out what they need

Infer the need from the message and the conversation. A named situation, such as "which skill reviews a PR?", goes straight to its section. If the need is still unclear, ask one multiple-choice question with these options, then answer only the section they pick:

- Get set up
- Start a task with `/pstack-poteto-mode`
- Pick a skill for a situation
- Fix a run that went wrong
- Make pstack my own

Check the state that changes the answer, and mention it only when it does:

- The owner's model-selection policy decides which roles can run. `/pstack-setup-pstack` reports which roles that policy supports.
- No `verify-*` skill or other app harness in the project means agents have no scripted way to drive the app. Mention `/pstack-create-verification-skill` when the question is about proving a change works.

When role support is unknown and it matters, offer `/pstack-setup-pstack` once per chat. It matters when the user is new, the question is about setup or cost, or the answer depends on which models run. Answer their question either way.

## Get set up

1. Install the port as the [pstack README](../pstack/README.md) describes, and reload or restart the harness.
2. Run [`/pstack-setup-pstack`](../pstack-setup-pstack/WORKFLOW.md). It reports which roles the owner's model-selection policy supports. It writes no rule and changes no preference.
3. Start a real task with `/pstack-poteto-mode`, a goal, and a check that can pass or fail.

Installing changes nothing until the user invokes a skill. Every pstack skill is user-invoked, so none loads from the user's words alone. Each harness spells the invocation its own way. The [pstack README](../pstack/README.md) lists the spellings, and upstream [guide page 1](https://github.com/cursor/plugins/blob/1dcc2bacde73ddd284803b7af28164d0436198fc/pstack/docs/guide/01-setup.md) have the details. Offer to word their first prompt with them, per [`references/prompting.md`](references/prompting.md).

If cost is the worry, say where the tokens go and how to spend fewer. pstack spends extra tokens on subagents and review panels. Cheaper models or shorter panels come from the owner's model-selection policy, and a shorter panel runs fewer subagents, one for each entry. Save `/pstack-poteto-mode` for work that needs rigor.

Upstream pstack is built for Cursor. This port runs in any harness that reads Agent Skills. Most workflow skills, including `/pstack-poteto-mode`, `/pstack-how`, `/pstack-why`, and `/pstack-teach`, spawn subagents with per-role models. The [pstack README](../pstack/README.md) says how delegation, model selection, and unattended waits resolve in each harness. A missing capability is a stated gap.

## Start a task with `/pstack-poteto-mode`

`/pstack-poteto-mode` matches the task to a playbook, copies the playbook's steps into the todo list, and runs the other skills as the steps need them. A step it skips stays in the list as `skip: <reason>`. A good prompt states the goal and how to tell it's done. It doesn't list skills, because a hand-written sequence tends to drop or reorder steps the playbook would keep. Read [`references/prompting.md`](references/prompting.md) before you help word one. Upstream [guide page 2](https://github.com/cursor/plugins/blob/1dcc2bacde73ddd284803b7af28164d0436198fc/pstack/docs/guide/02-poteto-mode.md) has examples.

An invocation of `/pstack-poteto-mode` applies to the request it starts. It fades as the chat moves on, so start each new task with it. Mid-chat, "new task" makes the mode match a fresh playbook. `/pstack-poteto-mode` already passes the [poteto-agent prompt](../pstack/agents/poteto-agent.md) to the subagents its playbook steps spawn. To get the same style from a subagent of your own, pass it that prompt.

## Pick a skill

The default answer is `/pstack-poteto-mode`, which runs most of the others when its steps need them. Name a skill directly when the user wants more or less of something than the playbook gives. Read the skill before you recommend it, and give one example prompt.

| The user wants to | Skill |
|---|---|
| Do any non-trivial task with rigor | [`/pstack-poteto-mode`](../pstack-poteto-mode/WORKFLOW.md) |
| Know how code works now, or where new code should live | [`/pstack-how`](../pstack-how/WORKFLOW.md) |
| Know why code is shaped this way, or where a number came from | [`/pstack-why`](../pstack-why/WORKFLOW.md) |
| Understand a change or subsystem, explained plainly | [`/pstack-teach`](../pstack-teach/WORKFLOW.md) |
| Catch up on their own recent work on a topic | [`/pstack-recall`](../pstack-recall/WORKFLOW.md) |
| Catch up on everything in this chat since their last message, with enough context to decide each action item | [`/pstack-ketchup`](../pstack-ketchup/WORKFLOW.md) |
| Know what a small diff could break outside itself | [`/pstack-blast-radius`](../pstack-blast-radius/WORKFLOW.md) |
| Settle types and module shape before code that crosses a function boundary | [`/pstack-architect`](../pstack-architect/WORKFLOW.md) |
| Get several attempts at one brief, merged into the best one | [`/pstack-arena`](../pstack-arena/WORKFLOW.md) |
| Run parallel checks over slices, or race workers | [`/pstack-swarm`](../pstack-swarm/WORKFLOW.md) |
| Have different models review a diff and try to break it | [`/pstack-interrogate`](../pstack-interrogate/WORKFLOW.md) |
| Fix a bug test-first when a cheap local test exists | [`/pstack-tdd`](../pstack-tdd/WORKFLOW.md) |
| Apply TypeScript rules to `.ts` or `.tsx` work | [`/pstack-typescript-best-practices`](../pstack-typescript-best-practices/WORKFLOW.md) |
| Strip comments before review, using a reviewer that didn't write them | [`/pstack-no-comments`](../pstack-no-comments/WORKFLOW.md) |
| Clean AI tells out of prose | [`/pstack-unslop`](../pstack-unslop/WORKFLOW.md) |
| Write docs, an RFC, a README, a PR description, or a commit message to a standard | [`/pstack-technical-writing`](../pstack-technical-writing/WORKFLOW.md) |
| Hear the last reply again in plain words | [`/pstack-bro`](../pstack-bro/WORKFLOW.md) |
| Give agents a scripted way to drive the app and prove behavior | [`/pstack-create-verification-skill`](../pstack-create-verification-skill/WORKFLOW.md) |
| Bring a verification skill and its feature map back in line with the app | [`/pstack-maintain-verification-skill`](../pstack-maintain-verification-skill/WORKFLOW.md) |
| Vet a performance number before reporting or acting on it | [`/pstack-benchmark-checklist`](../pstack-benchmark-checklist/WORKFLOW.md) |
| Run a large or cross-cutting change, or one to review after stepping away | [`/pstack-figure-it-out`](../pstack-figure-it-out/WORKFLOW.md) |
| Keep a decision log during a run, and review it afterward | [`/pstack-show-me-your-work`](../pstack-show-me-your-work/WORKFLOW.md) |
| Check which roles the owner's model policy supports | [`/pstack-setup-pstack`](../pstack-setup-pstack/WORKFLOW.md) |
| Turn their own working habits into a personal mode skill | [`/pstack-automate-me`](../pstack-automate-me/WORKFLOW.md) |
| Turn what a finished task taught into skill edits | [`/pstack-reflect`](../pstack-reflect/WORKFLOW.md) |
| Stop agents from repeating the same mistakes in this repo | [`/pstack-correct`](../pstack-correct/WORKFLOW.md) |
| Build a page whose buttons wake a Grok Bot over a webhook | [`/pstack-make-bot-ui`](../pstack-make-bot-ui/WORKFLOW.md) |
| Find their way around pstack | `/pstack-poteto-help` |

If a skill directory next to this one is missing from the table, read its frontmatter and route by its description. The `principle-*` directories are covered under principles below.

Close calls:

- `/pstack-how` explains what the code does. `/pstack-why` explains the reasons. `/pstack-teach` runs one or both and explains the result plainly.
- `/pstack-arena` gives every worker the same brief and merges the best parts. `/pstack-swarm` splits work into slices or a race and returns one report.
- `/pstack-architect` implements right after it settles the design. Add "with checkpoint" to review the design before it writes code.
- `/pstack-interrogate` reviews the diff. `/pstack-blast-radius` looks for breakage outside the diff and proves the one fact that makes the change safe.
- `/pstack-recall` rebuilds context across recent chats. `/pstack-ketchup` covers only this chat since the user's last message. Resuming one specific chat or branch is the Session pickup playbook.
- `/pstack-figure-it-out` designs one rigorous run. The Orchestrate playbook runs a program that spans days and many PRs. The Autonomous run playbook drives one task to a finish condition.

Not in pstack:

- `/deslop`, `control-cli`, and `control-ui` ship in Cursor's `cursor-team-kit` plugin. The [pstack README](../pstack/README.md) names the substitutes.
- `/loop` and `/create-skill` are Cursor built-ins. The [pstack README](../pstack/README.md) names the substitutes.
- pstack has no `/orchestrate` skill. Orchestrate is a `/pstack-poteto-mode` playbook. If the slash menu shows `/orchestrate`, another plugin provides it.

## Playbooks and principles

Playbooks are step lists inside `/pstack-poteto-mode`, not skills, so they have no slash command. Inside `/pstack-poteto-mode`, describing the task picks one, and these phrases name one directly:

- "babysit this pr" or "check on pr 123" runs Babysit. It drives the PR to merge-ready and stops there. It doesn't merge unless the user asks to merge, land, or ship.
- "land the stack" runs Shipping.
- "take over this branch" runs Session pickup.
- "pause safely" runs Pause safely.
- "full autopilot on this queue" runs Autopilot-full. "stack them, don't ship" runs Autopilot-stack.
- "run the eval playbook" runs Eval.

Without `/pstack-poteto-mode`, a phrase such as "babysit this pr" can start another installed skill for the same job instead. The Playbooks section of [`poteto-mode`](../pstack-poteto-mode/WORKFLOW.md) lists every playbook and when it applies. Upstream [guide page 6](https://github.com/cursor/plugins/blob/1dcc2bacde73ddd284803b7af28164d0436198fc/pstack/docs/guide/06-verify-and-ship.md) covers opening, babysitting, and landing a PR.

pstack has no planning skill. A harness plan mode works alongside it. For work that spans phases or stacked PRs, asking `/pstack-poteto-mode` for a plan runs the [Multi-phase plan playbook](../pstack-poteto-mode/playbooks/multi-phase-plan.md), which writes the plan and doesn't implement it. For a design question, the Prototype playbook or `/pstack-architect` settles it in code first.

Principles are one-rule skills that `/pstack-poteto-mode` reads and cites in its replies. The user rarely invokes one. They steer with the names instead, as in "apply prove it works. show me the real output." Typing `/pstack-principle-<name>` still loads one on demand. The [pstack README](../pstack/README.md) lists them.

## Fix a run that went wrong

| Symptom | Fix |
|---|---|
| The mode stopped applying after a few turns | An invocation applies to the request it starts. Start each task with `/pstack-poteto-mode`. |
| A question got treated as the next step of the last task | Say "new task", or say the turn doesn't need the mode. |
| A new model choice had no effect | Model choices come from the owner's policy, and some harnesses apply a change only to new sessions. Start one. |
| Runs cost more than expected | See the cost paragraph under Get set up. |
| A skill didn't load on its own | Every pstack skill is user-invoked. Each loads when the user invokes it or when `/pstack-poteto-mode` reads it, and it doesn't read every skill. |
| Parallel agents overwrote each other | Give each agent its own worktree. |
| An overnight run moved but finished nothing | An unattended run needs a check that can pass or fail, not a duration. See upstream [guide page 7](https://github.com/cursor/plugins/blob/1dcc2bacde73ddd284803b7af28164d0436198fc/pstack/docs/guide/07-overnight.md). |
| The reply claims success from a green build | Ask for the real command, flow, stored value, or profile. That's the prove-it-works principle. |

For a run that drifts, [`references/prompting.md`](references/prompting.md) has one-line steers. Upstream [guide page 10](https://github.com/cursor/plugins/blob/1dcc2bacde73ddd284803b7af28164d0436198fc/pstack/docs/guide/10-recipes-and-pitfalls.md) has more pitfalls and the recipes worth copying.

## Make pstack my own

- [`/pstack-automate-me`](../pstack-automate-me/WORKFLOW.md) drafts a personal mode skill from the user's own history, to use alongside `/pstack-poteto-mode`.
- [`/pstack-reflect`](../pstack-reflect/WORKFLOW.md) after a session turns its lessons into skill edits the user approves.
- `/pstack-poteto-mode write a skill for <workflow>` runs the authoring playbook. The eval playbook tests a skill change blind.
- Fix a misbehaving skill in its own PR, not inside the feature work where it went wrong.

Upstream [guide page 9](https://github.com/cursor/plugins/blob/1dcc2bacde73ddd284803b7af28164d0436198fc/pstack/docs/guide/09-make-it-yours.md) covers each of these.

## Reply

Lead with the answer. Give at most one example prompt in a code block, adapted from [`references/recipes.md`](references/recipes.md) when one fits, then the link to that file. Keep it short unless the user asked for the whole map.
