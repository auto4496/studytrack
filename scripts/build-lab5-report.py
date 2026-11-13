"""Render the reviewed Lab5 Markdown draft; original evidence files stay unchanged."""

from __future__ import annotations

import hashlib
import html
import json
import os
from pathlib import Path
import re
import subprocess

from PIL import Image as PILImage
from pypdf import PdfReader
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate, Flowable, Frame, KeepTogether, PageBreak,
    PageTemplate, Paragraph, Spacer, Table, TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "docs/deliverables/lab5"
META = json.loads((SOURCE_DIR / "submission.json").read_text(encoding="utf-8"))
REPO = "https://github.com/auto4496/studytrack"
PIN = META["evidenceCommit"]
OUT = ROOT / "output/pdf" / META["pdfFilename"]
TEMP = ROOT / "tmp/pdfs"
WIDTH = A4[0] - 84
GREEN = colors.HexColor("#205748")
INK = colors.HexColor("#243930")
MUTED = colors.HexColor("#53655F")
FONT_DIR = Path(os.environ.get("LAB5_FONT_DIR", "C:/Windows/Fonts"))
pdfmetrics.registerFont(TTFont("Lab5", str(FONT_DIR / "tahoma.ttf")))
pdfmetrics.registerFont(TTFont("Lab5Bold", str(FONT_DIR / "tahomabd.ttf")))
pdfmetrics.registerFontFamily("Lab5", normal="Lab5", bold="Lab5Bold", italic="Lab5", boldItalic="Lab5Bold")

styles = {
    "body": ParagraphStyle("body", fontName="Lab5", fontSize=9.5, leading=14, textColor=INK, spaceAfter=7),
    "h1": ParagraphStyle("h1", fontName="Lab5Bold", fontSize=21, leading=27, textColor=GREEN, spaceAfter=14),
    "h2": ParagraphStyle("h2", fontName="Lab5Bold", fontSize=13.5, leading=18, textColor=GREEN, spaceBefore=5, spaceAfter=9),
    "h3": ParagraphStyle("h3", fontName="Lab5Bold", fontSize=10.5, leading=15, textColor=GREEN, spaceBefore=6, spaceAfter=6),
    "cell": ParagraphStyle("cell", fontName="Lab5", fontSize=8.4, leading=12.4, textColor=INK),
    "caption": ParagraphStyle("caption", fontName="Lab5", fontSize=8.2, leading=11.5, textColor=MUTED, spaceBefore=4, spaceAfter=10),
    "code": ParagraphStyle("code", fontName="Lab5", fontSize=8.2, leading=12.5, textColor=INK, backColor=colors.HexColor("#F0F4F0"), borderPadding=7, spaceAfter=8),
}


def target_url(value: str) -> str:
    if re.match(r"https?://", value):
        return value
    if value.startswith("#"):
        raise ValueError("Use a direct source link rather than a PDF-local anchor")
    relative, _, fragment = value.partition("#")
    resolved = (SOURCE_DIR / relative).resolve()
    path = resolved.relative_to(ROOT).as_posix()
    if not resolved.exists():
        raise FileNotFoundError(resolved)
    authored = path.startswith("docs/deliverables/lab5/") or path in {"docs/labs/lab-05/deployment.md", "docs/ai-use.md"}
    ref = (META.get("reportContentCommit") or "codex/lab5-report-draft") if authored else PIN
    return f"{REPO}/blob/{ref}/{path}" + (f"#{fragment}" if fragment else "")


def inline(value: str) -> str:
    tokens: dict[str, str] = {}

    def link(match):
        key = f"ZZLINK{len(tokens)}ZZ"
        tokens[key] = f'<a href="{html.escape(target_url(match[2]), quote=True)}" color="#176D68"><u>{html.escape(match[1])}</u></a>'
        return key

    value = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", link, value)
    value = html.escape(value)
    value = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", value)
    value = re.sub(r"`([^`]+)`", r'<font size="8.5">\1</font>', value)
    for key, content in tokens.items():
        value = value.replace(key, content)
    return value


class NativePanels(Flowable):
    """PDF clip rectangles only; pixel bytes in the original source never change."""

    def __init__(self, path: Path, panels: list[list[float]]):
        super().__init__()
        self.path, self.panels = path, panels
        self.iw, self.ih = PILImage.open(path).size
        self.width = WIDTH
        self.height = 0
        for x, y, w, h, fraction in panels:
            if min(x, y) < 0 or min(w, h, fraction) <= 0 or x + w > self.iw or y + h > self.ih or fraction > 1:
                raise ValueError(f"Invalid source crop: {path} {x,y,w,h,fraction}")
            self.height += WIDTH * fraction * h / w + 4

    def draw(self):
        cursor = self.height
        for x, y, w, h, fraction in self.panels:
            scale = WIDTH * fraction / w
            height = h * scale
            cursor -= height
            canvas = self.canv
            canvas.saveState()
            clip = canvas.beginPath()
            clip.rect(0, cursor, WIDTH * fraction, height)
            canvas.clipPath(clip, stroke=0)
            canvas.drawImage(str(self.path), -x * scale, cursor - (self.ih - y - h) * scale,
                             width=self.iw * scale, height=self.ih * scale)
            canvas.restoreState()
            canvas.setStrokeColor(colors.HexColor("#D7E0D9"))
            canvas.rect(0, cursor, WIDTH * fraction, height, fill=0, stroke=1)
            cursor -= 4


def source_image(value: str) -> Path:
    name, _, page = value.partition("#page=")
    path = ROOT / name
    if path.suffix.lower() == ".pdf":
        if not page.isdigit():
            raise ValueError("A PDF evidence source needs a page number")
        output = TEMP / f"{path.stem}-page{page}"
        subprocess.run(["pdftoppm", "-f", page, "-singlefile", "-scale-to", "1600", "-png", str(path), str(output)], check=True)
        return output.with_suffix(".png")
    return path


def make_table(rows: list[list[str]], fractions: list[float] | None):
    count = len(rows[0])
    if fractions is None:
        fractions = {2: [0.28, 0.72], 3: [0.14, 0.44, 0.42], 4: [0.13, 0.32, 0.23, 0.32]}[count]
    if len(fractions) != count or abs(sum(fractions) - 1) > .001 or any(len(r) != count for r in rows):
        raise ValueError("Table column mismatch")
    data = [[Paragraph(inline(cell), styles["cell"]) for cell in row] for row in rows]
    table = Table(data, colWidths=[WIDTH * f for f in fractions], repeatRows=1, hAlign="LEFT")
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E4EEE7")),
        ("LINEBELOW", (0, 0), (-1, 0), .8, GREEN),
        ("LINEBELOW", (0, 1), (-1, -1), .35, colors.HexColor("#D4DED6")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6), ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    return [table, Spacer(1, 9)]


def parse_source():
    lines = (SOURCE_DIR / "report-source.md").read_text(encoding="utf-8").splitlines()
    flow, index, fractions = [], 0, None
    figures = []
    while index < len(lines):
        line = lines[index].strip()
        index += 1
        if not line:
            continue
        if line == ":::page":
            flow.append(PageBreak())
        elif line.startswith(":::widths "):
            fractions = [float(v) for v in line.split()[1:]]
        elif line.startswith(":::figure "):
            record = json.loads(line.removeprefix(":::figure "))
            original = record["file"].split("#page=")[0]
            pinned = subprocess.check_output(["git", "show", f"{PIN}:{original}"], cwd=ROOT)
            if (ROOT / original).read_bytes() != pinned:
                raise ValueError(f"Source evidence differs from accepted Git blob: {original}")
            path = source_image(record["file"])
            caption = record["caption"] + f' [Original source]({record["url"]}). Document crop panels; source unchanged.'
            flow.append(KeepTogether([NativePanels(path, record["panels"]), Paragraph(inline(caption), styles["caption"])]))
            figures.append(record)
        elif line.startswith("|"):
            rows = [line]
            while index < len(lines) and lines[index].strip().startswith("|"):
                rows.append(lines[index].strip())
                index += 1
            parsed = [[cell.strip() for cell in row.strip("|").split("|")] for row in rows]
            parsed = [row for row in parsed if not all(re.fullmatch(r":?-+:?", cell) for cell in row)]
            flow.extend(make_table(parsed, fractions))
            fractions = None
        elif line.startswith("```"):
            code = []
            while index < len(lines) and not lines[index].strip().startswith("```"):
                code.append(lines[index])
                index += 1
            index += 1
            flow.append(Paragraph("<br/>".join(html.escape(v).replace(" ", "&#160;") for v in code), styles["code"]))
        elif line.startswith("# "):
            flow.append(Paragraph(inline(line[2:]), styles["h1"]))
        elif line.startswith("## "):
            flow.append(Paragraph(inline(line[3:]), styles["h2"]))
        elif line.startswith("### "):
            flow.append(Paragraph(inline(line[4:]), styles["h3"]))
        else:
            flow.append(Paragraph(inline(line), styles["body"]))
    return flow, figures


def page_decoration(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(GREEN)
    canvas.setLineWidth(2)
    canvas.line(42, A4[1] - 26, A4[0] - 42, A4[1] - 26)
    canvas.setFont("Lab5", 7.6)
    canvas.setFillColor(MUTED)
    canvas.drawString(42, 23, "StudyTrack | TH-057_P8 | Section B | 13 November 2026 | DRAFT - not submitted")
    canvas.drawRightString(A4[0] - 42, 23, str(doc.page))
    canvas.restoreState()


def build():
    TEMP.mkdir(parents=True, exist_ok=True)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    flow, figures = parse_source()
    doc = BaseDocTemplate(str(OUT), pagesize=A4, leftMargin=42, rightMargin=42,
                          topMargin=42, bottomMargin=42, title="StudyTrack - Lab5 evidence index - draft",
                          author="TH-057_P8 - Pitchai Chadchuangchot and Phanuwit Butchari",
                          pageCompression=1, invariant=1)
    frame = Frame(42, 42, WIDTH, A4[1] - 84, leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
    doc.addPageTemplates(PageTemplate(id="report", frames=frame, onPage=page_decoration))
    doc.build(flow)
    reader = PdfReader(OUT)
    text = "\n".join(page.extract_text() for page in reader.pages)
    expected = [f"Answer Part {n}" for n in range(5)]
    if any(label not in text for label in expected) or [text.index(v) for v in expected] != sorted(text.index(v) for v in expected):
        raise ValueError("Required parts absent or out of order")
    if len(reader.pages) != 8:
        raise ValueError(f"Unexpected pagination: {len(reader.pages)} pages; inspect overflow")
    links = sum(1 for p in reader.pages for a in p.get("/Annots", []) if a.get_object().get("/Subtype") == "/Link")
    if links < 40:
        raise ValueError("Expected direct evidence links are missing")
    # Preserve exact bytes of pinned Git evidence rather than Windows checkout EOLs.
    sources = sorted({r["file"].split("#page=")[0] for r in figures})
    evidence = []
    for path in sources:
        blob = subprocess.check_output(["git", "show", f"{PIN}:{path}"], cwd=ROOT)
        evidence.append({"path": path, "commit": PIN, "bytes": len(blob), "sha256": hashlib.sha256(blob).hexdigest()})
    paths = [OUT, SOURCE_DIR / "report-source.md", SOURCE_DIR / "submission.json", SOURCE_DIR / "evidence-index.md",
             SOURCE_DIR / "report-preflight.json", ROOT / "docs/labs/lab-05/deployment.md", Path(__file__)]
    outputs = [{"path": p.relative_to(ROOT).as_posix(), "bytes": len(p.read_bytes()),
                "sha256": hashlib.sha256(p.read_bytes()).hexdigest()} for p in paths]
    manifest = {"scope": "Exact current report bytes plus pinned original evidence Git blobs; excludes manifest itself",
                "status": META["status"], "applicationCommit": META["applicationCommit"], "evidenceCommit": PIN,
                "pages": len(reader.pages), "links": links, "figures": figures, "originalEvidence": evidence,
                "outputs": outputs, "visualQa": "Separate rendering and all-page visual inspection required after build"}
    (SOURCE_DIR / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    print(json.dumps({"pdf": str(OUT), "pages": len(reader.pages), "links": links, "figures": len(figures)}, ensure_ascii=False))


if __name__ == "__main__":
    build()
