Canonical URL: https://www.w3.org/TR/2017/REC-annotation-model-20170223/#selectors
Version: W3C Recommendation, 23 February 2017
Accessed: 2026-09-03

# Governing excerpts: selectors for a specific resource

The Recommendation says that multiple selectors can describe the same segment “in different ways in order to maximize the chances that it will be discoverable.”

For a CSS Selector, `value` is “the CSS selection path to the Segment.”

For a Text Quote Selector, `exact` is the selected text after normalization; `prefix` and `suffix` are the immediately surrounding snippets.

For a Text Position Selector, `start` is zero-based and inclusive, while `end` is not included.

The Recommendation also permits a selector to be `refinedBy` one or more selectors, so a broad selection can be narrowed by a more specific one.

Applicability note: the model defines interoperable description, not a DOM reattachment algorithm or an acceptance threshold. The local overlay must define fail-closed resolution.
