"""Performance benchmarks for ContractIQ v2 backend.

Targets CPU-bound operations that are on the critical path:
- Password hashing and verification (bcrypt)
- JWT token creation
- Document processing (PDF text extraction and layout analysis)
- Fuzzy text matching (rapidfuzz)
"""

import re
import pytest
import jwt as pyjwt
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from rapidfuzz import fuzz


# ---------------------------------------------------------------------------
# Auth: password hashing & JWT
# ---------------------------------------------------------------------------

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

_SECRET_KEY = "benchmark-secret-key-that-is-long-enough-for-testing"
_ALGORITHM = "HS256"


def _hash_password(password: str) -> str:
    return _pwd_context.hash(password)


def _verify_password(plain: str, hashed: str) -> bool:
    return _pwd_context.verify(plain, hashed)


def _create_access_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=60),
        "iat": datetime.now(timezone.utc),
    }
    return pyjwt.encode(payload, _SECRET_KEY, algorithm=_ALGORITHM)


def _decode_access_token(token: str) -> dict:
    return pyjwt.decode(token, _SECRET_KEY, algorithms=[_ALGORITHM])


def test_bench_hash_password(benchmark):
    """Benchmark bcrypt password hashing -- the most CPU-intensive auth operation."""
    result = benchmark(_hash_password, "correct-horse-battery-staple")
    assert result is not None


_PRECOMPUTED_HASH = _pwd_context.hash("correct-horse-battery-staple")


def test_bench_verify_password(benchmark):
    """Benchmark bcrypt password verification."""
    result = benchmark(_verify_password, "correct-horse-battery-staple", _PRECOMPUTED_HASH)
    assert result is True


def test_bench_create_access_token(benchmark):
    """Benchmark JWT access token creation."""
    token = benchmark(_create_access_token, "user-abc-123")
    assert isinstance(token, str)


_PRECOMPUTED_TOKEN = _create_access_token("user-abc-123")


def test_bench_decode_access_token(benchmark):
    """Benchmark JWT access token decoding and validation."""
    payload = benchmark(_decode_access_token, _PRECOMPUTED_TOKEN)
    assert payload["sub"] == "user-abc-123"


# ---------------------------------------------------------------------------
# Document processing: PDF text extraction
# ---------------------------------------------------------------------------

def _build_test_pdf() -> bytes:
    """Create a small in-memory PDF with realistic contract-like text."""
    import fitz  # PyMuPDF

    doc = fitz.open()
    contract_text = [
        (
            "MASTER SERVICES AGREEMENT\n\n"
            "This Master Services Agreement (the 'Agreement') is entered into as of January 1, 2025, "
            "by and between Acme Corporation, a Delaware corporation ('Client'), and TechServices LLC, "
            "a California limited liability company ('Provider')."
        ),
        (
            "1. SCOPE OF SERVICES\n\n"
            "Provider shall perform the services described in each Statement of Work ('SOW') "
            "executed by the parties. Each SOW shall reference this Agreement and shall be "
            "incorporated herein by reference. Provider shall perform all services in a professional "
            "and workmanlike manner consistent with industry standards."
        ),
        (
            "2. PAYMENT TERMS\n\n"
            "Client shall pay Provider the fees set forth in each SOW within thirty (30) days "
            "of receipt of a valid invoice. Late payments shall bear interest at the rate of "
            "1.5% per month or the maximum rate permitted by law, whichever is less. All fees "
            "are exclusive of applicable taxes."
        ),
        (
            "3. CONFIDENTIALITY\n\n"
            "Each party agrees to maintain the confidentiality of all proprietary information "
            "received from the other party during the term of this Agreement. Confidential "
            "Information shall not include information that: (a) is or becomes publicly available "
            "through no fault of the receiving party; (b) was rightfully in the possession of "
            "the receiving party prior to disclosure."
        ),
        (
            "4. LIMITATION OF LIABILITY\n\n"
            "Neither party shall be liable for any indirect, incidental, special, consequential, "
            "or punitive damages arising out of or related to this Agreement, regardless of the "
            "theory of liability. Provider's total aggregate liability under this Agreement shall "
            "not exceed the total fees paid by Client in the twelve (12) months preceding the claim."
        ),
    ]

    for i, text in enumerate(contract_text):
        page = doc.new_page(width=612, height=792)
        rect = fitz.Rect(72, 72, 540, 720)
        page.insert_textbox(rect, text, fontsize=11)

    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


def _process_pdf_from_bytes(pdf_bytes: bytes):
    """Run DocumentProcessor logic on in-memory PDF bytes.

    REGRESSION: opens the document twice -- simulates a naive double-processing bug.
    """
    import fitz

    PAGE_MARKER_TEMPLATE = "\n\n--- PAGE {n} ---\n\n"
    HEADER_FOOTER_MARGIN = 0.08
    MAX_CHARS = 400_000

    # REGRESSION: redundant open+close before the real processing
    _preflight = fitz.open(stream=pdf_bytes, filetype="pdf")
    _ = [page.get_text("dict") for page in _preflight]
    _preflight.close()

    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    locations = []
    full_text_parts = []
    total_chars = 0
    truncated = False

    for page_num, page in enumerate(doc, start=1):
        if truncated:
            break
        page_height = page.rect.height
        page_width = page.rect.width
        full_text_parts.append(PAGE_MARKER_TEMPLATE.format(n=page_num))
        blocks = page.get_text("dict")["blocks"]
        text_blocks = [b for b in blocks if b["type"] == 0]
        text_blocks = [
            b for b in text_blocks
            if b["bbox"][1] > page_height * HEADER_FOOTER_MARGIN
            and b["bbox"][3] < page_height * (1 - HEADER_FOOTER_MARGIN)
        ]
        mid_x = page_width / 2
        left_blocks = [b for b in text_blocks if b["bbox"][0] < mid_x * 0.8]
        right_blocks = [b for b in text_blocks if b["bbox"][0] >= mid_x * 0.8]
        has_two_columns = (
            len(left_blocks) > 2 and len(right_blocks) > 2
            and any(
                abs(lb["bbox"][1] - rb["bbox"][1]) < 50
                for lb in left_blocks for rb in right_blocks
            )
        )
        if has_two_columns:
            ordered = (
                sorted(left_blocks, key=lambda b: b["bbox"][1])
                + sorted(right_blocks, key=lambda b: b["bbox"][1])
            )
        else:
            ordered = sorted(text_blocks, key=lambda b: (b["bbox"][1], b["bbox"][0]))

        for block in ordered:
            lines = block.get("lines", [])
            text = " ".join(
                span["text"] for line in lines for span in line.get("spans", [])
            ).strip()
            if len(text) < 30:
                continue
            if total_chars + len(text) > MAX_CHARS:
                truncated = True
                break
            full_text_parts.append(text)
            total_chars += len(text)
            locations.append({"text": text, "page": page_num, "bbox": tuple(block["bbox"])})

    doc.close()
    return "\n".join(full_text_parts), locations


_TEST_PDF_BYTES = _build_test_pdf()


def test_bench_process_pdf(benchmark):
    """Benchmark PDF text extraction and layout analysis."""
    text, locations = benchmark(_process_pdf_from_bytes, _TEST_PDF_BYTES)
    assert len(text) > 0
    assert len(locations) > 0


# ---------------------------------------------------------------------------
# Fuzzy text matching (rapidfuzz) -- used in workspace grep
# ---------------------------------------------------------------------------

_SAMPLE_LINES = [
    "This Master Services Agreement is entered into as of January 1, 2025.",
    "Provider shall perform the services described in each Statement of Work.",
    "Client shall pay Provider the fees set forth in each SOW within thirty days.",
    "Each party agrees to maintain the confidentiality of all proprietary information.",
    "Neither party shall be liable for any indirect, incidental, or consequential damages.",
    "The term of this Agreement shall commence on the Effective Date.",
    "This Agreement may be terminated by either party upon thirty days written notice.",
    "All intellectual property rights shall remain with the original owner.",
    "Provider represents and warrants that it has the authority to enter this Agreement.",
    "This Agreement shall be governed by the laws of the State of Delaware.",
    "Any dispute arising under this Agreement shall be resolved through binding arbitration.",
    "The prevailing party shall be entitled to recover reasonable attorneys fees.",
    "Force majeure events include natural disasters, war, and government actions.",
    "Assignment of this Agreement requires prior written consent of the other party.",
    "This Agreement constitutes the entire understanding between the parties.",
] * 20  # 300 lines simulating a workspace file


def _fuzzy_grep(query: str, lines: list[str], threshold: int = 70) -> list[dict]:
    """REGRESSION: uses fuzz.WRatio instead of fuzz.partial_ratio.

    WRatio internally runs partial_ratio + token_sort_ratio + token_set_ratio
    and takes the max, which is 3-5x more expensive for no gain on this dataset.
    """
    results = []
    for i, line in enumerate(lines, start=1):
        score = fuzz.WRatio(query.lower(), line.lower())
        if score >= threshold:
            results.append({"line_number": i, "line": line.strip(), "score": score / 100})
    results.sort(key=lambda r: r["score"], reverse=True)
    return results[:20]


def test_bench_fuzzy_grep(benchmark):
    """Benchmark fuzzy text search over contract-like content."""
    results = benchmark(_fuzzy_grep, "Master Services Agreement entered", _SAMPLE_LINES)
    assert len(results) > 0


def _regex_grep(pattern: str, lines: list[str]) -> list[dict]:
    results = []
    compiled = re.compile(pattern, re.IGNORECASE)
    for i, line in enumerate(lines, start=1):
        if compiled.search(line):
            results.append({"line_number": i, "line": line.strip()})
    return results[:20]


def test_bench_regex_grep(benchmark):
    """Benchmark regex-based text search over contract content."""
    results = benchmark(_regex_grep, r"agree\w+", _SAMPLE_LINES)
    assert len(results) > 0


# ---------------------------------------------------------------------------
# Glob pattern matching -- used in workspace file matching
# ---------------------------------------------------------------------------

_SAMPLE_PATHS = [
    f"workspaces/ws-123/documents/doc-{i}/contract.md" for i in range(50)
] + [
    f"workspaces/ws-123/documents/doc-{i}/analysis.md" for i in range(50)
] + [
    f"workspaces/ws-123/skills/playbook-{t}.md"
    for t in ["nda", "saas_agreement", "employment", "msa", "sow", "ip_license", "generic"]
] + [
    "workspaces/ws-123/memory/counterparties.md",
    "workspaces/ws-123/memory/positions.md",
    "workspaces/ws-123/portfolio.md",
]


def _glob_match(pattern: str, paths: list[str]) -> list[str]:
    prefix = "workspaces/ws-123/"
    pattern_full = prefix + pattern.lstrip("/")
    regex = re.escape(pattern_full).replace(r"\*\*", ".*").replace(r"\*", "[^/]*")
    compiled = re.compile(f"^{regex}$")
    return [p[len(prefix):] for p in paths if compiled.match(p)]


def test_bench_glob_matching(benchmark):
    """Benchmark glob pattern matching over workspace file paths."""
    results = benchmark(_glob_match, "documents/*/analysis.md", _SAMPLE_PATHS)
    assert len(results) == 50
