import json
import logging
from collections.abc import AsyncGenerator
import anthropic
from src.core.config import get_settings
from src.services.workspace_tools import WorkspaceToolkit

logger = logging.getLogger(__name__)

MODEL = "claude-haiku-4-5-20251001"
MAX_TOKENS = 8192
MAX_TOOL_ROUNDS = 20


ANALYZE_SYSTEM = """You are a senior commercial attorney analyzing contracts.

You have tools to read and write files in a workspace:
- workspace_read: read contract.md, playbooks, memory files
- workspace_write: write analysis.md and update portfolio.md and memory files
- workspace_glob: list files
- workspace_grep: search with exact, regex, or fuzzy matching
- workspace_semantic_search: meaning-based search over contract chunks

## Your analysis workflow for a new document:
1. Read the contract: workspace_read("documents/{document_id}/contract.md")
2. Read the relevant playbook: workspace_read("skills/playbook-{contract_type}.md")
3. Read counterparty memory: workspace_read("memory/counterparties.md")
4. Analyze the contract thoroughly against the playbook
5. Write structured analysis: workspace_write("documents/{document_id}/analysis.md", <content>)
6. Read portfolio.md, append this document's summary, write it back
7. Update counterparty memory if new information found

## analysis.md format you MUST follow:
```
# Contract Analysis: {filename}

**Contract Type:** {type}
**Party Perspective:** {perspective}
**Counterparty:** {name or "Unknown"}
**Overall Risk:** CRITICAL|HIGH|MEDIUM|LOW
**Analyzed At:** {ISO timestamp}

## Summary
{2-3 sentences}

## Clauses

### {CLAUSE_TYPE} — {RISK_LEVEL}
**Page:** {n}
**Text:** "{exact quote from contract}"
**Risk Reasoning:** {why}
**Jurisdiction Note:** {if applicable, else omit}

## Missing Clauses
- {TYPE}: required by playbook, not found in contract

## Negotiation Priorities
1. {item}

## Red Flags
- {description}

## Counterparty Notes
{patterns observed}
```

Be thorough. Quote exact text. Reference page numbers. Apply playbook rules explicitly."""


QA_SYSTEM = """You are a contract analysis assistant.

You have tools to search and read contract files:
- workspace_read: read contract.md or analysis.md for a specific document
- workspace_grep: search across all documents (exact, regex, fuzzy)
- workspace_semantic_search: meaning-based search

Answer the user's question using the contract content. Always cite page numbers.
If the question is about a specific document, read that document's contract.md and analysis.md first.
If the question spans the entire portfolio, use grep or semantic_search across all documents."""


class ContractAgent:
    def __init__(self):
        settings = get_settings()
        self._client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

    async def _run_tool_loop(
        self,
        system: str,
        initial_messages: list[dict],
        toolkit: WorkspaceToolkit,
    ) -> AsyncGenerator[str, None]:
        """
        Agentic tool loop: Haiku calls tools, we execute them, feed results back.
        Streams text chunks as SSE events.
        """
        messages = list(initial_messages)
        tools = toolkit.to_tool_definitions()

        for round_num in range(MAX_TOOL_ROUNDS):
            response = await self._client.messages.create(
                model=MODEL,
                max_tokens=MAX_TOKENS,
                system=system,
                tools=tools,
                messages=messages,
            )

            # Stream text blocks to client
            for block in response.content:
                if block.type == "text" and block.text:
                    yield f"data: {json.dumps({'type': 'text', 'text': block.text})}\n\n"

            if response.stop_reason == "end_turn":
                break

            if response.stop_reason != "tool_use":
                logger.warning(f"Unexpected stop_reason: {response.stop_reason}")
                break

            # Execute all tool calls
            tool_results = []
            for block in response.content:
                if block.type == "tool_use":
                    logger.info(f"Tool: {block.name}({json.dumps(block.input)[:200]})")
                    result = await toolkit.dispatch_tool(block.name, block.input)
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": result,
                    })

            messages.append({"role": "assistant", "content": response.content})
            messages.append({"role": "user", "content": tool_results})

        else:
            yield f"data: {json.dumps({'type': 'error', 'message': 'Max tool rounds reached'})}\n\n"

        yield 'data: {"type": "done"}\n\n'

    async def analyze_document(
        self,
        toolkit: WorkspaceToolkit,
        document_id: str,
        filename: str,
        contract_type: str,
        party_perspective: str,
    ) -> AsyncGenerator[str, None]:
        """Full autonomous document analysis. Writes analysis.md + updates portfolio."""
        prompt = (
            f"Analyze the contract '{filename}' (document_id: {document_id}).\n"
            f"Contract type: {contract_type}, party perspective: {party_perspective}.\n\n"
            f"Follow your analysis workflow: read contract.md, read the playbook, "
            f"read counterparty memory, write analysis.md, update portfolio.md."
        )
        async for chunk in self._run_tool_loop(
            system=ANALYZE_SYSTEM,
            initial_messages=[{"role": "user", "content": prompt}],
            toolkit=toolkit,
        ):
            yield chunk

    async def ask(
        self,
        toolkit: WorkspaceToolkit,
        question: str,
        document_id: str | None = None,
    ) -> AsyncGenerator[str, None]:
        """Q&A over workspace contracts. Streams SSE."""
        context = f"Document ID in scope: {document_id}" if document_id else "Search across all workspace documents."
        prompt = f"{context}\n\nQuestion: {question}"
        async for chunk in self._run_tool_loop(
            system=QA_SYSTEM,
            initial_messages=[{"role": "user", "content": prompt}],
            toolkit=toolkit,
        ):
            yield chunk
