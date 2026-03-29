import anthropic
import json
from collections.abc import AsyncGenerator
from src.core.config import get_settings
from src.services.vector_store import VectorStore
from sqlalchemy.ext.asyncio import AsyncSession

LOW_CONFIDENCE_THRESHOLD = 0.30


class RAGAgent:
    def __init__(self):
        settings = get_settings()
        self._client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
        self._vector_store = VectorStore()

    async def query_stream(
        self,
        db: AsyncSession,
        workspace_id: str,
        question: str,
        document_id: str | None = None,
    ) -> AsyncGenerator[str, None]:
        """
        Streams SSE events. Yields strings in SSE format:
        - data: {"type": "text", "text": "..."}
        - data: {"type": "citations", "citations": [...]}
        - data: {"type": "low_confidence", "value": true/false}
        - data: {"type": "done"}
        """
        chunks = await self._vector_store.query(
            db=db,
            workspace_id=workspace_id,
            query_text=question,
            n_results=10,
            document_id=document_id,
        )

        low_confidence = len(chunks) == 0 or chunks[0]["similarity"] < LOW_CONFIDENCE_THRESHOLD
        yield f"data: {json.dumps({'type': 'low_confidence', 'value': low_confidence})}\n\n"

        if not chunks:
            yield f"data: {json.dumps({'type': 'text', 'text': 'No relevant content found in the document for this question.'})}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
            return

        # Build document blocks for Citations API
        document_blocks = [
            {
                "type": "document",
                "source": {
                    "type": "text",
                    "media_type": "text/plain",
                    "data": chunk["text"],
                },
                "title": f"Page {chunk['page_number']}" if chunk.get("page_number") else "Contract excerpt",
                "citations": {"enabled": True},
            }
            for chunk in chunks
        ]

        async with self._client.messages.stream(
            model="claude-haiku-4-5-20251001",
            max_tokens=2048,
            system="You are a contract analysis assistant. Answer questions about the contract using ONLY the provided document excerpts. Always cite your sources.",
            messages=[
                {
                    "role": "user",
                    "content": document_blocks + [
                        {"type": "text", "text": question}
                    ]
                }
            ],
            extra_headers={"anthropic-beta": "citations-2024-11-06"},
        ) as stream:
            async for event in stream:
                if hasattr(event, "type"):
                    if event.type == "content_block_delta":
                        delta = event.delta
                        if hasattr(delta, "type"):
                            if delta.type == "text_delta":
                                yield f"data: {json.dumps({'type': 'text', 'text': delta.text})}\n\n"
                            elif delta.type == "citations_delta":
                                # NOTE: The exact shape of citations_delta may vary by SDK version.
                                # The Citations API (beta: citations-2024-11-06) streams citation objects
                                # in delta.citation (list). Adjust if SDK changes the field name.
                                citation_list = delta.citation if hasattr(delta, "citation") else []
                                yield f"data: {json.dumps({'type': 'citations', 'citations': [{'document_title': getattr(c, 'document_title', ''), 'cited_text': getattr(c, 'cited_text', '')} for c in citation_list]})}\n\n"

        yield f"data: {json.dumps({'type': 'done'})}\n\n"
