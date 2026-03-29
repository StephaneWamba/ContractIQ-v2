import logging

logger = logging.getLogger(__name__)

# Lazy-loaded engines — presidio is heavy, only initialize on first call
_analyzer = None
_anonymizer = None


def _get_engines():
    global _analyzer, _anonymizer
    if _analyzer is None:
        from presidio_analyzer import AnalyzerEngine
        from presidio_anonymizer import AnonymizerEngine
        _analyzer = AnalyzerEngine()
        _anonymizer = AnonymizerEngine()
    return _analyzer, _anonymizer


# PII entity types to redact before sending contract text to external LLM APIs.
# We intentionally do NOT redact ORG (company names) — they are essential for contract analysis.
REDACT_ENTITIES = [
    "PERSON",
    "EMAIL_ADDRESS",
    "PHONE_NUMBER",
    "US_SSN",
    "CREDIT_CARD",
    "IBAN_CODE",
    "IP_ADDRESS",
]


def redact_pii(text: str) -> str:
    """
    Replace personal data with labeled placeholders before sending to Anthropic/Voyage.
    e.g. "John Smith" -> "<PERSON>", "john@corp.com" -> "<EMAIL_ADDRESS>"

    The raw PDF is never modified — only the in-memory text sent to LLMs is redacted.
    Falls back to returning the original text if presidio is not installed or fails.
    """
    try:
        analyzer, anonymizer = _get_engines()
        results = analyzer.analyze(
            text=text,
            entities=REDACT_ENTITIES,
            language="en",
        )
        if not results:
            return text
        return anonymizer.anonymize(text=text, analyzer_results=results).text
    except ImportError:
        # presidio not installed — log warning and continue without redaction
        logger.warning(
            "presidio not installed — sending contract text without PII redaction. "
            "Run: pip install presidio-analyzer presidio-anonymizer && python -m spacy download en_core_web_lg"
        )
        return text
    except Exception as e:
        # Never block processing due to redaction failure
        logger.warning(f"PII redaction failed, continuing without redaction: {e}")
        return text
