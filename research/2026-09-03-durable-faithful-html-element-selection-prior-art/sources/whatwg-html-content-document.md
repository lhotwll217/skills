Canonical URL: https://html.spec.whatwg.org/multipage/document-sequences.html#concept-bcc-content-document
Pinned source: https://github.com/whatwg/html/blob/1379cdd841fcd5368aabea3f8e34b2d76a57f852/source#L105321-L105340
Version: HTML Standard source revision 1379cdd841fcd5368aabea3f8e34b2d76a57f852, 3 September 2026
Accessed: 2026-09-03

# Governing excerpt: iframe content-document access

The content-document algorithm returns `null` when the embedded document and the container's node document are not same origin-domain; otherwise it returns the active document.

Applicability note: a same-origin frame can be a separate route segment with its own hit test and selector root. A cross-origin or sandbox-opaque frame can only be targeted as the outer `iframe` element unless the child cooperates through an explicitly designed messaging protocol.
