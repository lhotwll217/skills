Canonical URL: https://dom.spec.whatwg.org/#dom-element-shadowroot
Pinned source: https://github.com/whatwg/dom/blob/a2331a45360129e8645ef7e0a04740241b6e3726/dom.bs#L7952-L7962
Version: DOM Standard source revision a2331a45360129e8645ef7e0a04740241b6e3726, 25 August 2026
Accessed: 2026-09-03

# Governing excerpt: closed shadow roots

The `Element.shadowRoot` getter returns `null` when the root is absent or its mode is `closed`; otherwise it returns the shadow root.

Applicability note: page JavaScript can deliberately descend through open roots, but cannot build or resolve an internal route through a closed root. A closed host is therefore the deepest dependable target.
