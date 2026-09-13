---
name: html-theme
description: Luke's house theme for generated HTML. Use whenever generating an HTML page, artifact, report, dashboard, mockup, or review UI for Luke, or when another skill produces styled HTML output.
---

# House theme for generated HTML

Every HTML page you generate for Luke uses one visual system: **gunmetal gray, radius 0, mono headings**. Its neutral hierarchy is adapted from GitHub Primer's battle-tested `dark_dimmed` palette; it is a single gray mode, not a light/dark theme pair. The look reads like a terminal-grade fintech dashboard: flat, 1px borders, no shadows, no rounded corners, monospace headings and numbers.

## How to apply

1. Inline the entire contents of [`theme.css`](theme.css) in a `<style>` tag. Never link external stylesheets, CDNs, or web fonts (artifact CSP blocks them; the font stacks in the file degrade gracefully).
2. Build the page from the theme's classes and variables only — no per-page color literals, no inline hex/oklch values, no `border-radius` other than `var(--radius)`, no `box-shadow`.
3. Charts use `--chart-1` … `--chart-5` by default. For workflow, orchestration, status, or system diagrams, use the terminal semantic palette in `theme.css`; color should encode meaning, not decorate. On financial pages, green/red remain reserved for money via `.positive` / `.negative`.

## Workflow and system artifacts

Keep the house geometry—gunmetal background, flat 1px borders, square corners, mono labels—but do not force orchestration diagrams into grayscale. Start with Owner Operator's terminal colors:

- `--terminal-bronze`: human owner, approval, or feedback
- `--terminal-blue`: parent context, delegation, or information flow
- `--terminal-green`: completed implementation or successful execution
- `--terminal-red`: failure, rejection, or destructive state
- `--terminal-yellow`: warning, interruption, capacity pressure, or reroute
- `--terminal-purple`: independent review or high-reasoning analysis
- `--terminal-teal`: artifacts, evidence, integration, or convergence

Pair color with labels, symbols, or line styles so meaning never depends on color alone. Additional colors are allowed when the subject requires another stable category, but define them as theme variables rather than scattering literals through the page.

## Idiom rules

- **Cards**: `.card` — 1px border, no shadow, square corners. Title via `.card-title`, subtitle via `.card-sub`.
- **Section micro-labels**: `.label` — uppercase, mono, letter-spaced (e.g. "RETIREMENT", "AUTO-SAVE PLAN").
- **Big figures**: `.stat` or `.num` — headline numbers are always mono ("$420,000").
- **Buttons**: `.btn .btn-primary` (solid near-black), `.btn-outline`; full-width CTAs get `.btn-block`.
- **Progress**: `.progress > div` with an inline width % — thick, flat, no gradient.
- **Tables**: mono uppercase `th`; numeric columns get `.num` (right-aligned mono).
- Body text is sans (Inter stack); anything heading-like or numeric is mono (Geist Mono stack).

## Gray mode

`theme.css` has one canonical gunmetal-gray palette. Emit no light/dark toggle or alternate palette; use the supplied variables so the visual hierarchy stays consistent.
