#!/usr/bin/env bash
# Render an EPUB to ordinary (A5, 12pt) and narrow large-font (360x560pt, 18pt) proof PDFs.
# Usage: render_proofs.sh BOOK.epub OUTDIR
# Then view pages with: pdftoppm -f N -l N -r 80 -png OUTDIR/BOOK-narrow.pdf OUTDIR/BOOK-narrow-pN
# Headless proofs show layout, not Kindle ingestion or device behaviour.
set -euo pipefail
book=$1 out=$2
convert=$(command -v ebook-convert || echo /Applications/calibre.app/Contents/MacOS/ebook-convert)
name=$(basename "${book%.epub}")
mkdir -p "$out"
margins=(--pdf-page-margin-left 24 --pdf-page-margin-right 24 --pdf-page-margin-top 24 --pdf-page-margin-bottom 24)
"$convert" "$book" "$out/$name-ordinary.pdf" --paper-size a5 --pdf-default-font-size 12 "${margins[@]}" \
  >"$out/$name-ordinary.log" 2>&1 &
"$convert" "$book" "$out/$name-narrow.pdf" --custom-size 360x560 --unit point --pdf-default-font-size 18 "${margins[@]}" \
  >"$out/$name-narrow.log" 2>&1 &
wait
for kind in ordinary narrow; do
  pdf="$out/$name-$kind.pdf"
  pdftotext -layout "$pdf" "${pdf%.pdf}.txt"
  echo "$pdf: $(pdfinfo "$pdf" | awk '/^Pages:/ {print $2}') pages"
done
