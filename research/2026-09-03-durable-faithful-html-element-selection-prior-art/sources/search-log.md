# Search log

Access date: 2026-09-03. Exa MCP was available and was used for the discovery sweep. Search-result summaries were discovery only; recommendations cite opened implementations, manifests, registries, or governing specification text.

## External-implementation lane

Search location: Exa MCP (`mcp__exa__web_search_exa`).

1. `GitHub source implementation browser inspect mode hit testing exact DOM element elementFromPoint pointer events DevTools Overlay inspect`
   - Led to Chrome DevTools inspect-mode documentation, Lexical's `element-picker.ts`, React Dev Inspector, and an unmerged Chrome DevTools MCP proposal.
   - Opened/pinned: Lexical picker implementation. The Chrome documentation was not load-bearing because browser source/specification was stronger; the unmerged proposal was not used as precedent.
2. `GitHub source implementation Playwright locator generator selector generation public package exports locatorUtils asLocator`
   - Led to Playwright's injected selector generator and consumer paths.
   - Opened/pinned: `selectorGenerator.ts`, `playwright-core/package.json`, and the repository/npm metadata.
3. `GitHub source implementation Cypress selector playground selector generation public API getSelector`
   - Led to Cypress's selector-priority facade and `@cypress/unique-selector`.
   - Opened/pinned: both repositories' implementation/manifest files and package/repository metadata.
4. `GitHub source implementation rrweb DOM mirror node identity serialized node id reload persistence`
   - Led to rrweb snapshot/mirror sources. Rejected after sweep: its generated IDs correlate nodes only within a recorded snapshot/mutation stream, not independently rendered reloads, so it is not a close persistence candidate.
5. `@cypress/unique-selector GitHub source package selectorTypes implementation npm`
6. `site:github.com/cypress-io unique-selector package source`
7. `Playwright selectorGenerator.ts GitHub generateSelector injectedScript source`
   - Confirmed the public Cypress package and current Playwright source location. README/package summaries were not used to settle behavior.

Direct opening/pinning locations:

- Temporary filtered clones of `microsoft/playwright`, `facebook/lexical`, `cypress-io/cypress`, and `cypress-io/unique-selector`; exact revisions are in the report.
- GitHub repository API: `https://api.github.com/repos/{owner}/{repo}`.
- npm downloads API: `https://api.npmjs.org/downloads/point/last-week/{package}`.

## Standard-practice lane

Search location: Exa MCP (`mcp__exa__web_search_exa`).

1. `W3C Web Annotation Data Model CSS Selector Fragment Selector Text Quote Selector Text Position Selector state refinement specification`
   - Opened the dated W3C Recommendation; selector multiplicity, CSS selector, quote/position selectors, refinement, and state concepts were relevant.
2. `WHATWG DOM elementFromPoint ShadowRoot elementFromPoint retargeting open closed shadow DOM specification`
   - Opened the CSSOM View and DOM standards; then pinned the standards source repositories.
3. `HTML Living Standard iframe same origin contentDocument cross origin access specification`
   - Opened and pinned the HTML Standard's content-document algorithm.
4. `W3C Selectors API querySelector invalid selector uniqueness DOM standard`
   - Confirmed that `querySelector()` returns the first match, which reinforced the need to count all matches. The report relies on the current DOM/CSSOM and Annotation standards instead of the superseded Selectors API Recommendation.

Direct opening/pinning locations:

- Exa full-page fetch of the W3C Recommendation, CSSOM View, DOM, and HTML standard sections.
- Official standards source at exact revisions from `w3c/csswg-drafts`, `whatwg/dom`, and `whatwg/html`; the governing excerpts are preserved beside this log.
