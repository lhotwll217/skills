# /// script
# requires-python = ">=3.11"
# dependencies = [
#   "docling-slim[format-pdf,format-markdown,models-vlm-inline,convert-core,cli]==2.138.0",
#   "mlx-vlm==0.7.6",
#   "mlx==0.32.3",
# ]
# ///
# Pins match the cached uv environments behind the accepted Pólya and Collingwood runs.
"""Recognize chosen PDF pages locally with LightOnOCR-2-1B (MLX) through Docling.

Each page is rasterized with Poppler, wrapped as a one-page image PDF and recognized.
Pages whose Markdown already exists in OUT are skipped, so reruns resume and extend.
Output per physical page N: page-NNNN.png (the exact model input), .md, .json, -status.json.
Recognition success says nothing about fidelity; compare output with the PNG.
"""
import argparse
import hashlib
import json
import subprocess
import time
from pathlib import Path


def page_list(spec):
    pages = []
    for part in spec.split(","):
        start, _, end = part.partition("-")
        pages.extend(range(int(start), int(end or start) + 1))
    return sorted(set(pages))


parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
parser.add_argument("source", type=Path, help="source PDF")
parser.add_argument("--pages", required=True, type=page_list, help="physical pages, e.g. 17-18,45,150")
parser.add_argument("--out", required=True, type=Path, help="output directory (also the cache)")
parser.add_argument("--dpi", type=int, default=144, help="raster resolution; 144 is the accepted setting")
args = parser.parse_args()
args.out.mkdir(parents=True, exist_ok=True)

converter = options = None
for page in args.pages:
    stem = args.out / f"page-{page:04}"
    if stem.with_suffix(".md").exists():
        print(f"{page}: cached", flush=True)
        continue
    subprocess.run(["pdftoppm", "-f", str(page), "-l", str(page), "-r", str(args.dpi), "-png",
                    "-singlefile", str(args.source), str(stem)], check=True)
    from PIL import Image
    raster_pdf = args.out / f"input-{page:04}.pdf"
    Image.open(stem.with_suffix(".png")).convert("RGB").save(raster_pdf, resolution=args.dpi, quality=100)
    if converter is None:
        from docling.datamodel.base_models import InputFormat
        from docling.datamodel.pipeline_options import VlmConvertOptions, VlmPipelineOptions
        from docling.datamodel.vlm_engine_options import MlxVlmEngineOptions
        from docling.document_converter import DocumentConverter, PdfFormatOption
        from docling.pipeline.vlm_pipeline import VlmPipeline
        options = VlmConvertOptions.from_preset("lightonocr", engine_options=MlxVlmEngineOptions())
        converter = DocumentConverter(allowed_formats=[InputFormat.PDF], format_options={
            InputFormat.PDF: PdfFormatOption(pipeline_cls=VlmPipeline, pipeline_options=VlmPipelineOptions(
                vlm_options=options, generate_page_images=True))})
    started = time.monotonic()
    result = converter.convert(source=raster_pdf, page_range=(1, 1))
    elapsed = round(time.monotonic() - started, 2)
    result.document.save_as_markdown(stem.with_suffix(".md"))
    result.document.save_as_json(stem.with_suffix(".json"))
    raster_pdf.unlink()
    status = {"source": str(args.source.resolve()), "pdf_page": page, "status": str(result.status),
              "model": options.model_spec.get_repo_id(options.engine_options.engine_type), "dpi": args.dpi,
              "input_png_sha256": hashlib.sha256(stem.with_suffix(".png").read_bytes()).hexdigest(),
              "elapsed_seconds": elapsed, "review": "unreviewed"}
    Path(f"{stem}-status.json").write_text(json.dumps(status, indent=2) + "\n")
    chars = len(stem.with_suffix(".md").read_text().strip())
    print(f"{page}: {status['status']} {elapsed}s {chars} chars", flush=True)
