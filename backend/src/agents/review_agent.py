import json
from collections.abc import AsyncGenerator

# The Python package is claude-code-sdk (pip install claude-code-sdk).
# It requires Node.js 18+ in PATH to spawn the Claude Code CLI subprocess.
try:
    from claude_code_sdk import query, ClaudeCodeOptions, AssistantMessage, TextBlock
    SDK_AVAILABLE = True
except ImportError:
    SDK_AVAILABLE = False


REVIEW_PROMPT_TEMPLATE = """You are reviewing a {contract_type} contract from the perspective of the {party_perspective} party.

## Contract Summary
{summary}

## Extracted Clauses
{clauses_text}

## Missing Required Clauses
{missing_clauses}

## Contract Text (first 20K characters)
{contract_excerpt}

Please provide a comprehensive legal risk review:
1. Overall risk assessment (CRITICAL/HIGH/MEDIUM/LOW)
2. Most critical risks for the {party_perspective} party
3. Negotiation priorities (top 5 items to push back on)
4. Red flags and unusual clauses
5. Missing protections that should be added
6. Jurisdiction-specific concerns

Use the contract-analysis and missing-clauses skills for domain expertise."""


class ReviewAgent:
    async def review_stream(
        self,
        contract_type: str,
        party_perspective: str,
        summary: str,
        clauses: list[dict],
        missing_clauses: list[str],
        contract_excerpt: str,
    ) -> AsyncGenerator[str, None]:
        """Streams review via Claude Agent SDK with Skills. Yields SSE strings."""
        if not SDK_AVAILABLE:
            yield 'data: {"type": "error", "message": "Agent SDK not available"}\n\n'
            return

        clauses_text = "\n".join(
            f"- [{c.get('clause_type', 'OTHER')}] {c.get('risk_level', 'INFO')}: {c.get('text', '')[:200]}"
            for c in clauses[:50]  # cap at 50 clauses
        )
        missing_text = ", ".join(missing_clauses) if missing_clauses else "None detected"

        prompt = REVIEW_PROMPT_TEMPLATE.format(
            contract_type=contract_type,
            party_perspective=party_perspective,
            summary=summary,
            clauses_text=clauses_text,
            missing_clauses=missing_text,
            contract_excerpt=contract_excerpt[:20_000],
        )

        options = ClaudeCodeOptions(
            system_prompt="You are a senior commercial attorney. Use your contract-analysis and missing-clauses skills.",
            setting_sources=["project"],
            bypass_permissions=True,
            disallowed_tools=["Bash", "Write", "Edit", "Read", "Glob", "Grep"],
        )

        async for message in query(prompt=prompt, options=options):
            if isinstance(message, AssistantMessage):
                for block in message.content:
                    if isinstance(block, TextBlock):
                        yield f"data: {json.dumps({'type': 'text', 'text': block.text})}\n\n"

        yield 'data: {"type": "done"}\n\n'
