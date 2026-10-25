# Credibility and adoption snapshot

Accessed: 2026-09-03. Counts are point-in-time facts, not quality guarantees.

| Project/package | Authority and maintenance | Adoption/battle-testing | Upstream evidence |
|---|---|---|---|
| Microsoft Playwright | Microsoft-owned repository; pushed 2026-09-03; pinned implementation commit `34d23028f36578d435f7a41967852c8a82612f65` | 95,567 GitHub stars, 6,383 forks; `playwright` had 87,469,377 npm downloads for 2026-08-23 through 2026-08-29 | [GitHub API](https://api.github.com/repos/microsoft/playwright) · [npm API](https://api.npmjs.org/downloads/point/last-week/playwright) |
| Cypress unique-selector | Cypress-owned repository; latest/tagged `v2.2.0` commit `3fcc7ceeb6f41b4efb4dcc32584bbdb8e129c7a4` dated 2026-03-27 | 10 GitHub stars, 4 forks; 3,849 weekly npm downloads in the same interval; directly imported by Cypress driver commit `cd55bae5ffc0bf5559299d1eea0661747cbce2b2` | [GitHub API](https://api.github.com/repos/cypress-io/unique-selector) · [npm API](https://api.npmjs.org/downloads/point/last-week/%40cypress%2Funique-selector) · [Cypress consumer](https://github.com/cypress-io/cypress/blob/cd55bae5ffc0bf5559299d1eea0661747cbce2b2/packages/driver/src/cypress/element_selector.ts#L1-L20) |
| Meta Lexical | Meta-owned repository; `v0.50.0` commit `c3b629dcf6b5111811bb9ca5a3db0665099b2856` dated 2026-09-02 | 23,825 GitHub stars and 2,219 forks; picker ships as part of the Lexical DevTools extension, but its package manifest is private | [GitHub API](https://api.github.com/repos/facebook/lexical) · [manifest](https://github.com/facebook/lexical/blob/c3b629dcf6b5111811bb9ca5a3db0665099b2856/packages/lexical-devtools/package.json#L1-L5) |

Raw API responses are preserved in this directory as `playwright-repo.json`, `lexical-repo.json`, `unique-selector-repo.json`, `playwright-npm-downloads.json`, and `unique-selector-npm-downloads.json`.
