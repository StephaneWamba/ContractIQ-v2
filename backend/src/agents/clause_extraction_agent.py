import anthropic
import json
from src.core.config import get_settings


CLAUSE_EXTRACTION_SCHEMA = {
    "type": "object",
    "properties": {
        "clauses": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "clause_type": {"type": "string"},
                    "text": {"type": "string"},
                    "page_number": {"type": "integer"},
                    "risk_level": {"type": "string", "enum": ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"]},
                    "risk_reasoning": {"type": "string"},
                    "jurisdiction_note": {"type": "string"},
                    "parties": {"type": "array", "items": {"type": "string"}}
                },
                "required": ["clause_type", "text", "risk_level", "risk_reasoning"]
            }
        },
        "contract_type_detected": {"type": "string"},
        "summary": {"type": "string"}
    },
    "required": ["clauses", "contract_type_detected", "summary"]
}


class ClauseExtractionAgent:
    def __init__(self):
        settings = get_settings()
        self._client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

    async def extract(
        self,
        full_text: str,
        contract_type: str,
        party_perspective: str,
        document_id: str,
    ) -> dict:
        """
        Extract clauses from full_text.
        Returns dict with keys: clauses (list), contract_type_detected (str), summary (str)
        """
        system_prompt = f"""You are a senior commercial attorney specializing in contract risk analysis.

Contract type: {contract_type}
Party perspective: {party_perspective} (risk is directional — calibrate accordingly)

Extract all significant clauses from the contract. For each clause:
- Identify the clause type from the taxonomy
- Assign risk level from the PERSPECTIVE of the {party_perspective} party
- Write risk_reasoning explaining WHY this is risky or not for this party
- Note the page number (use the --- PAGE N --- markers in the text)
- Note jurisdiction-specific concerns if applicable

Clause taxonomy: PAYMENT, TERMINATION, LIABILITY, INDEMNIFICATION, CONFIDENTIALITY,
IP_OWNERSHIP, NON_COMPETE, GOVERNING_LAW, DISPUTE_RESOLUTION, FORCE_MAJEURE,
DATA_PROCESSING, ASSIGNMENT, WARRANTIES, CHANGE_ORDER, ACCEPTANCE_CRITERIA,
AUDIT_RIGHTS, KEY_PERSONNEL, LIQUIDATED_DAMAGES, MFN, BENCHMARKING, WAIVER,
AMENDMENT, ENTIRE_AGREEMENT, SEVERABILITY, NOTICE, OTHER

Risk calibration for {party_perspective}:
- A liability cap is GOOD for vendor, BAD for customer — adjust risk_level accordingly
- Missing governing law clause = HIGH risk for both parties
- Unlimited liability = CRITICAL for vendor, LOW for customer

After extraction, identify the actual contract type if different from provided.
Write a brief executive summary (3-5 sentences) of the contract's key commercial terms."""

        message = await self._client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=8192,
            system=system_prompt,
            messages=[
                {
                    "role": "user",
                    "content": f"Extract all clauses from this contract:\n\n{full_text[:200_000]}"
                }
            ],
            output_config={
                "format": {
                    "type": "json_schema",
                    "name": "clause_extraction",
                    "schema": CLAUSE_EXTRACTION_SCHEMA,
                    "strict": True
                }
            }
        )

        return json.loads(message.content[0].text)
