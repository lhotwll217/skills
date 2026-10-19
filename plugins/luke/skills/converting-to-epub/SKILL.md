---
name: converting-to-epub
description: Use when converting source material to EPUB, choosing local OCR for scans, or repairing an unreadable e-reader edition.
---

1. **Fix the target.** Name the material, the coverage wanted (whole work or chosen sections) and the difficulty classes it contains: notes, figures, tables, mathematics, columns, page-crossing sentences. Check its beginning, middle and end against its contents. Keep the original untouched and record where it came from. _Done when_ the source is a complete copy of the intended edition and its difficulty classes are listed.

2. **Choose the route.** Start from the input closest to semantic text:
   - Native EPUB or semantic HTML: convert directly and repair only what the pilot shows.
   - PDF with a usable text layer: rebuild paragraphs, headings and notes as HTML, then convert.
   - Scan or unreliable text layer: recognize it with the local stack in [ocr.md](references/ocr.md).

   For mathematics, figures, notes, columns, page joins or navigation, read [layout.md](references/layout.md). For `ebook-convert` flags and the recorded recipe, read [settings.md](references/settings.md). _Done when_ each listed difficulty class has a planned treatment.

3. **Pilot a small complete unit.** Take a few pages or a short chapter that together contain every listed difficulty class all the way to an EPUB, then compare its render with the original page images. Count the hand repairs it needed. _Done when_ the pilot reads correctly for every difficulty class and you can state the repair effort the full scope will cost. When that effort is per-page hand work, show the user the pilot and the estimate before scaling.

4. **Build the full scope.** Run the accepted route over everything, reusing cached recognition and accepted samples. Fix each systematic defect once in the pipeline and recheck the pages it touches; keep source-specific corrections in the project beside the build script. A defect class the pilot missed means re-estimating effort before continuing; if hand repair keeps growing, compare another route on the same difficult pages. _Done when_ every expected section, figure and note of the source is accounted for in the build.

5. **Accept the EPUB.** Each check settles one claim; after a change, rerun only the checks it can affect.
   - `python3 scripts/verify_epub.py BOOK.epub`: errors block; read the warnings.
   - `scripts/render_proofs.sh BOOK.epub OUTDIR`: in both proofs, inspect at least one page per difficulty class, a page transition and a navigation destination against the originals.
   - Figure and note counts match the source inventory.

   _Done when_ every check passes for the agreed coverage. Stop there.

Return the EPUB path, edition and coverage, the build command, where the evidence lives and any remaining defects. Kindle delivery is a separate step through the user's chosen route.
