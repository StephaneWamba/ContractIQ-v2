import fitz  # PyMuPDF
from dataclasses import dataclass, field
from pathlib import Path


PAGE_MARKER_TEMPLATE = "\n\n--- PAGE {n} ---\n\n"
HEADER_FOOTER_MARGIN = 0.08  # top/bottom 8% of page height
MAX_CHARS = 400_000  # ~100K tokens — safe for Claude 200K context window


@dataclass(frozen=True)
class LocationEntry:
    """A text block's position in the PDF — used by the frontend for highlighting."""
    text: str
    page: int
    bbox: tuple  # (x0, y0, x1, y1)


@dataclass(frozen=True)
class ProcessedDocument:
    contract_md: str                  # full contract as page-marked markdown (sent to LLM)
    locations: list[LocationEntry]    # bbox per text block (for PDF highlighting)
    page_count: int
    metadata: dict
    truncated: bool = False


class DocumentProcessor:

    def process_pdf(self, file_path: str) -> ProcessedDocument:
        doc = fitz.open(file_path)
        locations: list[LocationEntry] = []
        full_text_parts: list[str] = []
        total_chars = 0
        truncated = False

        for page_num, page in enumerate(doc, start=1):
            if truncated:
                break

            page_height = page.rect.height
            page_width = page.rect.width

            # Page marker for accurate LLM page attribution
            full_text_parts.append(PAGE_MARKER_TEMPLATE.format(n=page_num))

            blocks = page.get_text("dict")["blocks"]
            text_blocks = [b for b in blocks if b["type"] == 0]

            # Strip headers/footers (top/bottom 8%)
            text_blocks = [
                b for b in text_blocks
                if b["bbox"][1] > page_height * HEADER_FOOTER_MARGIN
                and b["bbox"][3] < page_height * (1 - HEADER_FOOTER_MARGIN)
            ]

            # Detect two-column layout
            mid_x = page_width / 2
            left_blocks = [b for b in text_blocks if b["bbox"][0] < mid_x * 0.8]
            right_blocks = [b for b in text_blocks if b["bbox"][0] >= mid_x * 0.8]
            has_two_columns = (
                len(left_blocks) > 2 and len(right_blocks) > 2
                and any(
                    abs(l["bbox"][1] - r["bbox"][1]) < 50
                    for l in left_blocks for r in right_blocks
                )
            )

            if has_two_columns:
                ordered = (
                    sorted(left_blocks, key=lambda b: b["bbox"][1]) +
                    sorted(right_blocks, key=lambda b: b["bbox"][1])
                )
            else:
                ordered = sorted(text_blocks, key=lambda b: (b["bbox"][1], b["bbox"][0]))

            for block in ordered:
                lines = block.get("lines", [])
                text = " ".join(
                    span["text"]
                    for line in lines
                    for span in line.get("spans", [])
                ).strip()

                if len(text) < 30:
                    continue

                # Truncate at MAX_CHARS
                if total_chars + len(text) > MAX_CHARS:
                    truncated = True
                    break

                full_text_parts.append(text)
                total_chars += len(text)
                locations.append(LocationEntry(
                    text=text,
                    page=page_num,
                    bbox=tuple(block["bbox"]),
                ))

        contract_md = "\n".join(full_text_parts)

        return ProcessedDocument(
            contract_md=contract_md,
            locations=locations,
            page_count=len(doc),
            metadata={
                "title": doc.metadata.get("title", ""),
                "author": doc.metadata.get("author", ""),
            },
            truncated=truncated,
        )
