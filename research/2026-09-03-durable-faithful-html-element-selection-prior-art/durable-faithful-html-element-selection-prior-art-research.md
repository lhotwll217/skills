# Durable, faithful HTML element selection: prior art

Date: 2026-09-03

## Problem

Determine how a rendered-HTML review overlay should let an owner select the exact intended DOM element and persist a reload-resolvable anchor that fails stale instead of silently moving feedback, settling interaction/hit-testing, selector identity, verification and ambiguity policy, Shadow DOM/iframe limits, and adopt-versus-build boundaries.

## Local context

The untracked draft is a dependency-free, same-document overlay. Its current [text anchor implementation](../../interactive-html-review/assets/review-client.js) concatenates body text (excluding the overlay), stores global offsets plus 80-character prefix/suffix and a hash, accepts the old offsets only when the quote and hash verify, otherwise relocates only a unique exact context, and marks failure stale. Its [skill contract](../../interactive-html-review/SKILL.md) explicitly promises stale surfacing. Screenshot anchors store only page coordinates and therefore identify a region, not a DOM element.

That text strategy already resembles W3C Text Position plus Text Quote selectors. The missing capability is an element-specific compound anchor and an interaction that makes element choice explicit.

## Evidence

### Candidate 1: Playwright selector generation

#### microsoft/playwright@34d2302 — `packages/injected/src/selectorGenerator.ts:78-180`

[local](sources/playwright@34d2302-selectorGenerator.ts) · [upstream](https://github.com/microsoft/playwright/blob/34d23028f36578d435f7a41967852c8a82612f65/packages/injected/src/selectorGenerator.ts#L78-L180)

```text
if (elements.length === 1) {
  // Perfect strict match.
  updateResult(candidate);
  break;
}
```

**Maintained by:** [Microsoft; current repository activity](sources/credibility-snapshot.md) · **Adoption:** [95,567 stars and 87,469,377 weekly package downloads at capture](sources/credibility-snapshot.md) · **Battle-tested:** this exact generator feeds Playwright's recorder/injected runtime, and returns both the selector and current matches.

**What applies:** score stable author intent first, require the target to be among matches, prefer a strict unique result, compose a parent with a target only when it improves discrimination, and heavily penalize ordinal fallback.

**What does not:** Playwright retargets non-editable descendants to an interactive ancestor (lines 98-103), which is wrong for an owner asking for the exact DOM element. Its selector language also includes Playwright-only role/text engines.

#### microsoft/playwright@34d2302 — `packages/injected/src/selectorGenerator.ts:204-242,395-428`

[local](sources/playwright@34d2302-selectorGenerator.ts) · [upstream](https://github.com/microsoft/playwright/blob/34d23028f36578d435f7a41967852c8a82612f65/packages/injected/src/selectorGenerator.ts#L204-L242)

```text
if (idAttr && !isGuidLike(idAttr))
  candidates.push({ engine: 'css', selector: makeSelectorForId(idAttr), score: kCSSIdScore });
```

The fallback labels ordinals “the weakest signal” and uses `:nth-child` only after IDs/classes fail ([upstream fallback](https://github.com/microsoft/playwright/blob/34d23028f36578d435f7a41967852c8a82612f65/packages/injected/src/selectorGenerator.ts#L395-L428)).

**Maintained by / Adoption / Battle-tested:** same facts as above.

**What applies:** reject GUID-like IDs; order stable review/test attributes before IDs, accessible identity, classes, tags, and positional structure.

**What does not:** uniqueness at capture time is not proof after reload. The generator supplies no persisted fingerprint, confidence threshold, or stale policy.

#### Public integration seam

[local manifest](sources/playwright@34d2302-playwright-core-package.json) · [upstream](https://github.com/microsoft/playwright/blob/34d23028f36578d435f7a41967852c8a82612f65/packages/playwright-core/package.json#L1-L32)

```text
"exports": {
  ".": { ... },
  "./package.json": "./package.json",
  "./lib/bootstrap": "./lib/bootstrap.js"
}
```

`packages/injected/src/selectorGenerator.ts` is absent from `playwright-core` exports. Importing it would depend on private build layout and Playwright's injected runtime. Recommendation consequence: adapt its policy, do not adopt or fork its implementation.

### Candidate 2: Cypress `@cypress/unique-selector`

#### cypress-io/unique-selector@3fcc7ce (tag `v2.2.0`) — `src/index.js:221-382`

[local](sources/unique-selector@3fcc7ce-index.js) · [upstream](https://github.com/cypress-io/unique-selector/blob/3fcc7ceeb6f41b4efb4dcc32584bbdb8e129c7a4/src/index.js#L221-L382)

```text
const {
  selectorTypes=['id', 'name', 'class', 'tag', 'nth-child'],
  filter,
} = options;
```

The public function walks ancestors until `isUnique` succeeds, supports caller-ordered selector types and trait filtering, and scopes Shadow DOM uniqueness to a root. Its `isUnique` implementation requires exactly one match and identity equality ([local](sources/unique-selector@3fcc7ce-isUnique.js) · [upstream](https://github.com/cypress-io/unique-selector/blob/3fcc7ceeb6f41b4efb4dcc32584bbdb8e129c7a4/src/isUnique.js#L1-L22)).

**Maintained by:** [Cypress; latest pinned work dated 2026-03-27](sources/credibility-snapshot.md) · **Adoption:** [3,849 weekly downloads](sources/credibility-snapshot.md) · **Battle-tested:** Cypress's driver imports the package and prioritizes `data-cy`, `data-test`, `data-testid`, and `data-qa` before structure ([local](sources/cypress@cd55bae-element_selector.ts) · [upstream](https://github.com/cypress-io/cypress/blob/cd55bae5ffc0bf5559299d1eea0661747cbce2b2/packages/driver/src/cypress/element_selector.ts#L1-L58)).

**What applies:** a narrow API accepts an `Element`, strategy priorities, and a filter; the implementation demonstrates exact uniqueness checking and escaping.

**What does not:** it defaults to classes and `nth-child`, stops its ancestor walk at a ShadowRoot, and returns no host/frame route, alternate selectors, semantic fingerprint, or reload verification result. Capture-time uniqueness can later point uniquely to a different sibling.

#### Public integration seam

[local manifest](sources/unique-selector@3fcc7ce-package.json) · [upstream](https://github.com/cypress-io/unique-selector/blob/3fcc7ceeb6f41b4efb4dcc32584bbdb8e129c7a4/package.json#L1-L36)

```text
"name": "@cypress/unique-selector",
"main": "./lib/index.js",
"files": ["lib"]
```

This is a genuine public package seam, unlike Playwright's generator. However, its published surface owns only CSS uniqueness, a small part of the required safety behavior. Adoption would add a dependency without eliminating the product-specific compound route, fingerprint, or stale resolver.

### Candidate 3: Lexical DevTools element picker

#### facebook/lexical@c3b629d (`v0.50.0`) — `packages/lexical-devtools/src/element-picker/element-picker.ts:35-125`

[local](sources/lexical@c3b629d-element-picker.ts) · [upstream](https://github.com/facebook/lexical/blob/c3b629dcf6b5111811bb9ca5a3db0665099b2856/packages/lexical-devtools/src/element-picker/element-picker.ts#L35-L125)

```text
this.overlay.ignoreCursor();
let elAtCursor = document.elementFromPoint(this.mouseX, this.mouseY);
while (elAtCursor !== null && elAtCursor.shadowRoot !== null) {
```

It installs capture listeners only while active, continuously re-hit-tests after making its own overlay pointer-transparent, descends through open shadow roots, previews bounds, and confirms with a prevented click.

**Maintained by:** [Meta; `v0.50.0` pinned](sources/credibility-snapshot.md) · **Adoption:** [23,825 repository stars](sources/credibility-snapshot.md) · **Battle-tested:** part of Lexical DevTools, but not exposed as a supported package.

**What applies:** explicit inspect mode, hover preview, click confirmation, Escape/stop cleanup, native viewport hit-testing, and open-root descent are the right interaction shape.

**What does not:** it has no iframe descent or persistent identity. Its [manifest](sources/lexical@c3b629d-package.json) says `"private": true`, so there is no public adoption seam.

### Standard: W3C Web Annotation selector composition

[local](sources/w3c-annotation-selectors.md) · [upstream, W3C Recommendation 2017-02-23](https://www.w3.org/TR/2017/REC-annotation-model-20170223/#selectors)

```text
Multiple Selectors can be given to describe the same Segment in different ways.
```

**Authority:** W3C Recommendation, reviewed and endorsed as stable reference material. · **Adoption/battle-testing:** the standard exists specifically for interoperable annotation targets; authority comes from the Recommendation process, not repository popularity.

**What applies:** persist several descriptions of one target: a CSS/route selector, text quote/position evidence where present, and a captured representation state/fingerprint. Refinement supports applying a selector inside a selected frame/shadow root.

**What does not:** the model does not prescribe resolver scoring. Multiple descriptions must corroborate one candidate here, not act as “first one that matches” alternatives.

### Standard: native hit testing

[local](sources/cssom-view-element-from-point.md) · [upstream, CSSOM View revision e9f4977](https://github.com/w3c/csswg-drafts/blob/e9f49775e6d62d8e406dfc7ff160e8f96977ad52/cssom-view-1/Overview.bs#L1072-L1083)

```text
return the associated element and terminate these steps.
```

**Authority:** CSS Working Group Editor's Draft backed by Web Platform Tests listed beside the algorithm. · **Adoption/battle-testing:** `elementFromPoint` is a browser platform API; the specification notes longstanding browser support.

**Decision constraint:** use the event's viewport coordinates and native hit testing after excluding overlay chrome. Do not treat paint order alone as identity: `pointer-events` changes hit-test eligibility, so preview and explicit confirmation are mandatory. `elementsFromPoint()` may power an optional ancestor/depth chooser when overlapping or tiny elements make the first candidate surprising.

### Standards: Shadow DOM and iframe boundaries

[local DOM excerpt](sources/whatwg-dom-shadow-root.md) · [upstream, DOM revision a2331a4](https://github.com/whatwg/dom/blob/a2331a45360129e8645ef7e0a04740241b6e3726/dom.bs#L7952-L7962)

```text
If shadow is null or its mode is "closed", then return null.
```

[local HTML excerpt](sources/whatwg-html-content-document.md) · [upstream, HTML revision 1379cdd](https://github.com/whatwg/html/blob/1379cdd841fcd5368aabea3f8e34b2d76a57f852/source#L105321-L105340)

```text
are not same origin-domain, then return null.
```

**Authority:** WHATWG Living Standards at exact source revisions. · **Adoption/battle-testing:** these algorithms govern browser DOM access.

**Decision constraint:** route through each open `ShadowRoot`; closed-root internals are not supportable. Route into a same-origin iframe only by attaching a cooperating picker/resolver in that document and storing the iframe element's own anchor as a preceding segment. Cross-origin or sandbox-opaque frames stop at the outer iframe element. Never imply that screen coordinates can restore inaccessible internal identity.

## Comparison

| Candidate | Hit-test / exact choice | Generated identity | Reload safety | Boundaries | Public seam | Fit |
|---|---|---|---|---|---|---|
| Playwright generator | Recorder integration retargets some descendants | Strong scored selector/locator candidates; strict current match | No persisted fingerprint or stale policy | Cross-shadow utilities; frame-specific locator model | Generator is not exported | Best policy precedent, unsafe dependency seam |
| `@cypress/unique-selector` | None | Unique CSS path, priorities/filter, root-scoped Shadow DOM | Only capture-time uniqueness | No complete host/frame route | Yes, default export | Usable component, but owns too little of the problem |
| Lexical picker | Excellent explicit mode, preview, click, overlay bypass | None | None | Open roots; no iframe handling | Private package | Best interaction precedent, no adoption path |
| Current draft text anchor | Text drag, not exact element | Global offsets + quote context | Fail-closed for uniquely relocated text | Light DOM only | Local | Preserve for text; insufficient for element comments |

## Recommendation: build narrowly

Build a small product-owned element-anchor mechanism using browser public APIs; adapt the evidenced policies, but do not copy Playwright/Lexical source or adopt `@cypress/unique-selector` initially.

The narrow boundary is:

1. **Explicit picker mode.** A toolbar action enters inspect mode. Capture `pointermove`/`click`; temporarily set overlay chrome to `pointer-events:none`; hit-test using `elementsFromPoint()`/`elementFromPoint()` in the current root; descend open shadow roots and cooperating same-origin frames; draw a bounds/name preview. Click confirms, Escape cancels. Do not silently retarget to an interactive ancestor. Offer an ancestor/depth stepper when the owner needs a parent rather than the deepest painted target.
2. **Compound route, not one magic selector.** Persist a versioned sequence of browsing/root segments: document → iframe element anchor → document → shadow-host anchor → open shadow root → target. For every element segment, store ranked selector candidates generated from explicit durable attributes (`data-review-id`/test IDs), non-GUID `id`, stable semantic attributes (`name`, `role`, `aria-label`, `alt`, `title`), conservative stable classes, and finally a structural path. Persist whether a selector is positional; do not treat a positional selector as strong identity.
3. **Independent fingerprint.** Alongside selectors store tag/local name, a filtered stable-attribute map, normalized direct/accessible text snippets where available, ancestor landmark signatures, sibling-neighborhood hints, and a capture-time uniqueness count. Keep the existing text quote/position/hash anchor for a text subrange or as corroborating evidence, not as the identity of the whole element. Store page source hash as representation state.
4. **Fail-closed resolution.** Resolve every route segment with `querySelectorAll`, never `querySelector`. Accept only a single candidate that clears required invariants and a documented fingerprint threshold. A selector match with a tag/strong-attribute contradiction is stale. Multiple passing candidates are ambiguous and stale; zero is missing/stale. A unique weak positional match without independent corroboration is stale. Candidate selectors may recover after modest edits, but no match is accepted merely because it is first or unique.
5. **Visible status.** Persist `resolved`, `relocated`, `ambiguous`, `missing`, or `unsupported-boundary`, plus reason/evidence. Never overwrite the captured anchor during automatic resolution; only an owner-confirmed re-anchor updates it.

Why `build`: exact selection and fail-closed verification are the behavior that matters, and no inspected package owns them. The only adoptable selector package would still require nearly all route/fingerprint/resolver policy locally, while its class/ordinal defaults create false confidence. Reconsider adopting it only if selector escaping/combinator coverage grows materially or local property tests show selector generation—not verification—is a significant maintenance burden.

## Applicability boundaries

- Intended for trusted, locally served HTML where injected review JavaScript runs.
- Supports ordinary light DOM, open Shadow DOM, and same-origin frames that the launcher can instrument.
- Closed Shadow DOM internals, cross-origin frames, sandboxed opaque-origin frames, canvas pixels, generated pseudo-element content, and browser/native UI are not exact DOM-element targets. Anchor their accessible outer host/iframe/canvas element or use a screenshot region and label the limitation.
- Virtualized lists or frameworks that destroy/recreate semantically identical nodes can resolve only when stable author-provided identity or a strong fingerprint survives; otherwise stale is correct.
- Modest edits means local sibling insertion, wrapper insertion, or nearby text change with stable semantic identity—not arbitrary redesign.

## Open questions

1. Which attributes should be declared durable by default for arbitrary local HTML, and should the owner be able to configure an allowlist per review?
2. Should accessible name computation be implemented locally, omitted, or obtained from a supported browser API? Playwright's full computation is internal and too large to copy casually.
3. What exact fingerprint threshold and contradiction rules minimize both false attachment and unnecessary staleness? This needs adversarial fixtures: duplicate cards, reordered lists, inserted wrappers, generated IDs/classes, and changed labels.
4. Should same-origin iframe injection be in the first release, or should v1 intentionally stop at the iframe element and state the boundary?
5. Is an explicit ancestor/depth keyboard control sufficient for SVG and zero-size wrapper selection, or is an element breadcrumb chooser needed?
6. Should screenshot comments optionally carry the hit-tested element anchor at the crop center/corners, while remaining region-first when points disagree?
