# Lab5 report draft

Section **B**, LEB2 submission group **TH-057_P8**, friendly name **กำลังปั้นเครดิตครับ**, topic8. Metadata is in [submission.json](submission.json). The output is [lab5_secB_TH-057_P8.pdf](../../../output/pdf/lab5_secB_TH-057_P8.pdf). This is a draft for A/joint review, not an upload receipt or course acceptance.

- [Report source](report-source.md): Answer Part0-4, linked evidence and numbered native figures.
- [Complete C01-06/R01-12 index](evidence-index.md).
- [Current deployment runbook](../../labs/lab-05/deployment.md).
- [Report preflight](report-preflight.json): dated public/GitHub observations, safe selected fields only.
- [Manifest](manifest.json): exact report/PDF and pinned source Git-blob hashes; excludes itself.

Rebuild from the repository root with Python3, reportlab, pypdf, Pillow and Poppler `pdftoppm`, plus Tahoma/Tahoma Bold (Windows Fonts by default; override LAB5_FONT_DIR for a font directory containing tahoma.ttf/tahomabd.ttf):

```sh
python scripts/build-lab5-report.py
pdftoppm -r 120 -png output/pdf/lab5_secB_TH-057_P8.pdf tmp/pdfs/lab5
```

The source is Markdown with `:::page` for explicit page breaks and `:::figure` for a source path, top-left pixel crop panels, caption and original GitHub link. The generator translates normal relative source links to the pinned accepted evidence snapshot, embeds fonts and clips original images on the PDF canvas. Original screenshot files are never rewritten. The settings source PDF is rasterized in ignored tmp/pdfs before clipping. This is document layout, not removal of evidence content.

Application source, accepted evidence and report content are distinct versions: submission.json records all three. Existing evidence links pin c6b63f7; new/updated report/runbook/disclosure links pin the source-content commit recorded as reportContentCommit. The final PDF/manifest are generated in a following commit, avoiding a self-referential PDF hash or an extra app deployment. Until that pin is assigned during preparation the generator uses this draft branch; the delivered draft must have an immutable content pin.

Before delivery visually inspect every rendered page at 100% for text, tables, Thai glyphs, image legibility, links and captions. The handout deadline is15November2026,23:59 Bangkok, but current LEB2 must be checked before submission. No Docker/cloud mutation is required for report preparation. Keep Issue24 open until real joint review/integration/submission acceptance.
