# Notation, figures, notes and navigation

## Mathematics

- **Semantic route:** source-checked TeX → `pandoc --mathml` → Calibre with `--epub-version 3`. Before Pandoc, remove whitespace just inside inline `$` delimiters and decode HTML entities inside TeX, notes included; otherwise Pandoc prints the delimiters and drops symbols (Pólya). `verify_epub.py` reports leftovers.
- **Source crops** keep notation exact when text extraction changes its meaning, as when Heckerman's product sign became a letter. Give each crop a text alternative, and check that numerator, denominator, limits and equation number all fall inside it.
- **Punctuation** stays attached: keep commas and closing quotes with the preceding inline expression, in notes as in body text.
- **Long displays** that clip in the narrow proof split at an existing relation; check both lines against the original.
- **Kindle:** Amazon's [Enhanced Typesetting guidance](https://kdp.amazon.com/en_US/help/topic/GH4DRT75GWWAGBTU) supports `annotation`, `math`, `mfrac`, `mi`, `mn`, `mo`, `mrow`, `msup` and `semantics`. That is KDP guidance; Send-to-Kindle and device behaviour stay untested until tried.

## Figures

Inventory the source's figures and match each to a checked asset. An intact image file or a retained caption does not show the figure is present. Reject leftover placeholders and invented transcriptions of diagrams.

## Notes and page joins

- Move footnotes into linked endnotes **before** joining body text across pages, then confirm call, complete note and backlink in the EPUB.
- Join a sentence that continues across a page break; a bottom-page acknowledgment belongs in an end section, outside the sentence (Simon).
- Hyphens need judgment: `stu-` / `dent` joins, `city-` / `dweller` keeps its hyphen. Keep an explicit override list.
- Detect paragraphs by indentation relative to the preceding line; scan margins vary page to page.
- Turn printed page labels into invisible anchors. Dewey's absolute page labels overlapped the text and its floated sidenotes narrowed it; flattening sidenotes to blocks fixed both.

## Columns, tables and structure

- Rebuild two-column reading order from coordinates before joining lines (Howard).
- Keep a small real table together, compare every cell with the original and check cells stay distinct at large type. A contents list read as a table often reads better as label–locator paragraphs.
- Preserve relationships carried by position: aligned premises, inference bars, equation–table pairings, dialogue order.

## Navigation

When combining sections, regenerate unique heading IDs. Link each printed contents entry to its own destination, Roman-numbered preliminary pages included. `verify_epub.py` checks both.
