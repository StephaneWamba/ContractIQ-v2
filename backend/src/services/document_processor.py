import fitz  # PyMuPDF
from dataclasses import dataclass, field
from pathlib import Path


PAGE_MARKER_TEMPLATE = "\n\n--- PAGE {n} ---\n\n"
HEADER_FOOTER_MARGIN = 0.08  # top/bottom 8% of page height


@dataclass(frozen=True)
class PageChunk:
    page_number: int
    chunk_index: int
    text: str
    bbox: tuple | None = None


@dataclass(frozen=True)
class ProcessedDocument:
    full_text: str          # with PAGE N markers injected
    chunks: list[PageChunk]
    page_count: int
    metadata: dict
    truncated: bool = False


class DocumentProcessor:
    MAX_CHARS = 400_000  # ~100K tokens — safe for Claude 200K context window

    def process_pdf(self, file_path: str) -> ProcessedDocument:
        doc = fitz.open(file_path)
        chunks = []
        full_text_parts = []
        chunk_index = 0

        for page_num, page in enumerate(doc, start=1):
            page_height = page.rect.height
            page_width = page.rect.width

            # Inject page marker for accurate LLM page attribution
            full_text_parts.append(PAGE_MARKER_TEMPLATE.format(n=page_num))

            # Get blocks with coordinates
            blocks = page.get_text("dict")["blocks"]

            # Text blocks only (type 0)
            text_blocks = [b for b in blocks if b["type"] == 0]

            # Strip headers/footers by position (top/bottom 8%)
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

                full_text_parts.append(text)
                chunks.append(PageChunk(
                    page_number=page_num,
                    chunk_index=chunk_index,
                    text=text,
                    bbox=tuple(block["bbox"]),
                ))
                chunk_index += 1

        full_text = "\n".join(full_text_parts)

        # Truncate chunks to match full_text budget
        char_budget = self.MAX_CHARS
        running = 0
        kept_chunks = []
        truncated = False
        for chunk in chunks:
            if running + len(chunk.text) > char_budget:
                truncated = True
                break
            running += len(chunk.text)
            kept_chunks.append(chunk)
        chunks = kept_chunks

        if len(full_text) > self.MAX_CHARS:
            truncated = True
            cut = full_text.rfind("\n", 0, self.MAX_CHARS)
            full_text = full_text[:cut] if cut > 0 else full_text[:self.MAX_CHARS]

        return ProcessedDocument(
            full_text=full_text,
            chunks=chunks,
            page_count=len(doc),
            metadata={
                "title": doc.metadata.get("title", ""),
                "author": doc.metadata.get("author", ""),
            },
            truncated=truncated,
        )
