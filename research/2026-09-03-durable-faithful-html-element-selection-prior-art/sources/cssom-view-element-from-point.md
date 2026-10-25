Canonical URL: https://drafts.csswg.org/cssom-view/#dom-document-elementfrompoint
Pinned source: https://github.com/w3c/csswg-drafts/blob/e9f49775e6d62d8e406dfc7ff160e8f96977ad52/cssom-view-1/Overview.bs#L1072-L1083
Version: Editor's Draft source revision e9f49775e6d62d8e406dfc7ff160e8f96977ad52, 12 July 2026
Accessed: 2026-09-03

# Governing excerpt: viewport hit testing

`Document.elementFromPoint(x, y)` returns the element associated with the CSS box that would be a hit-test target at the viewport coordinates. It returns `null` for coordinates outside the viewport, and the root element when no hit-testable box is found.

The specification warns that the result is not necessarily the topmost painted element because `pointer-events` can exclude an element from hit testing.

Applicability note: this is the native primitive for the hover candidate, but a review overlay must remove itself from hit testing and show the resolved target before confirmation.
