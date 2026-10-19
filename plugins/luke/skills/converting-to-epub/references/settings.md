# Calibre settings and tradeoffs

On macOS, `ebook-convert` lives at `/Applications/calibre.app/Contents/MacOS/ebook-convert` and is not on `PATH`. Read `ebook-convert INPUT OUTPUT --help` for the exact input/output pair: installed help settles option availability. These choices were exercised with Calibre 9.7.0.

## Recipe that produced the accepted editions

```sh
ebook-convert book.html book.epub --title "…" --authors "…" --language en \
  --output-profile generic_eink_hd --epub-version 2 --disable-font-rescaling \
  --minimum-line-height 0 --chapter / --page-breaks-before / \
  --level1-toc '//h:h2' --max-toc-links 0 \
  --margin-left 0 --margin-right 0 --margin-top 0 --margin-bottom 0
```

Save the exact command and log beside the EPUB. Each flag is a tradeoff for prepared semantic HTML:

| Choice | When it earns its place | Tradeoff |
| --- | --- | --- |
| `--output-profile generic_eink_hd` | Unspecified modern e-reader | Device profiles also change image dimensions; use one only when targeting that device. |
| `--epub-version 2` | Text and images | Use `3` for MathML or other EPUB3 semantics. |
| `--disable-font-rescaling` | Input typography is already relative and consistent | Keeps heading/body proportions; leave rescaling on for badly scaled input. |
| `--minimum-line-height 0` | Spacing belongs to the prepared CSS and reader controls | Confirm in the narrow proof. |
| `--level1-toc '//h:h2'`, optional `--level2-toc '//h:h3'` | Headings are deliberately semantic | Heading-based navigation still needs its destinations checked. |
| `--max-toc-links 0` | Stops harvesting unrelated links into the TOC | Supply heading navigation instead. |
| `--chapter / --page-breaks-before /` | Short papers where headings should not force a new screen | Long books may want chapter breaks. |
| Zero EPUB margins | The reader controls margins | PDF proof margins are separate flags. |
| `--extra-css FILE` | A demonstrated source-CSS defect | Prefer specific selectors; let text colour inherit and avoid forced note backgrounds. Check the generated CSS, since `background` shorthand can leave a separate `background-color` rule. |
| `--cover`, `--start-reading-at` | A real cover image or front matter to skip | Collingwood used its original front page and started at the preface. |
| `--debug-pipeline DIR` | Locating which stage caused damage | Compare input, parsed, structure and processed stages. |
| Heuristics, unwrap factor, table linearization | A pilot shows the specific defect they repair | Heuristics can worsen content; linearization destroys real tables. Neither fixes scanned or multi-column PDFs. |

## Proof renders

For a hand-made proof size, pass `--unit point` with `--custom-size`; without it Calibre reads the numbers in inches and silently renders an enormous page. Headless proofs show layout; Amazon's ingestion and a physical Kindle can differ.

## Primary documentation

- [Conversion manual](https://manual.calibre-ebook.com/conversion.html): pipeline debugging, page setup, heuristics, tables, PDF limits.
- [ebook-convert reference](https://manual.calibre-ebook.com/generated/en/ebook-convert.html): option meanings; installed help wins on version support.
- [EPUB output plugin source](https://github.com/kovidgoyal/calibre/blob/master/src/calibre/ebooks/conversion/plugins/epub_output.py): when documented options do not explain packaging behaviour.
