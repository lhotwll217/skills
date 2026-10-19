# Local OCR for scans

Use this branch when the source is a scan or its text layer is unreliable. The deliverable is still an EPUB; OCR supplies its text. For a searchable PDF instead, OCRmyPDF + Tesseract is the simpler local tool.

## The accepted stack

Poppler page rasters at 144 DPI → LightOnOCR-2-1B (BF16) on MLX through Docling → Markdown with TeX mathematics. Free, open source and fully local, it produced the accepted Collingwood and complete 284-page Pólya editions at a median 6.8 s per page on the owner's M4 Pro (48 GB).

`uv run scripts/ocr_pages.py` runs it with the accepted versions pinned (`--help` for options). Its output directory is a cache, so the pilot range extends to the full book without repeating pages, and rebuilding an EPUB never needs fresh recognition. Run one recognition process at a time; review can proceed alongside it.

## What recognition leaves to you

Compare Markdown with `page-NNNN.png`, the exact image the model saw, which shows the full physical page. A text-layer crop once excluded real bottom-page text and a footnote, so extraction compared with itself hides omissions. Compare every pilot page; at scale, compare the pages carrying a difficulty class, character-count outliers and pages a pipeline fix touched.

- **Figures** are absent from the transcription. Crop them from the page images. Docling layout detection located Pólya's diagrams but missed a sparse one, merged two neighbours and caught a running header, so check every crop against its page.
- **Running heads and page numbers** arrive as text. Strip them, keeping page IDs as invisible anchors. A next-page running head can also distort a section's end-page locator.
- **Italics** are sometimes dropped; restore them where they carry meaning.
- **Empty, repetitive or invented text** can come back with a success status. The runner prints each page's character count; look at the image for outliers and blank pages.

Keep raw output unchanged and record corrections per physical page in a separate file, so the build can be rerun and each fix audited.

## When the stack struggles

If the pilot shows hand repair that keeps growing, compare an alternative on the **same** difficult pages before scaling. GLM-OCR via MLX is the first candidate when layout or table repair dominates. On this material Apple Vision mixed columns and damaged equations, and Granite-Docling 258M omitted text and misread Greek; both stay rejected. Quantization, lower DPI and parallel workers trade fidelity for speed: adopt one only after the same pages still pass. The evidence is in [the local OCR review](/Users/otwell/Documents/Life/Research/agentic-knowledge-work/question-asking/kindle-reading/verification/2026-10-15-local-ocr-tool-review.md).
