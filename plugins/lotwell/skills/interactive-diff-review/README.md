# interactive-diff-review

I don't want to read diffs in the terminal. I don't want my diff reader coupled to any one tool or GUI. And when I review, I want to leave feedback in place and have any agent thread — from any harness — absorb those comments.

So this skill teaches an agent to:

- render exactly the diff I ask for as a standalone side-by-side HTML page, opened locally in the browser;
- let me highlight changed text and leave anchored Comments right on the diff;
- persist those Comments to a local JSON file that any agent can read back as review feedback.

No accounts, no uploads, no dependencies — one Node script and a browser.

How it works, step by step: [SKILL.md](SKILL.md).
