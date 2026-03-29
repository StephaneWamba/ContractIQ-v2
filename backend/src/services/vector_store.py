import voyageai
from sqlalchemy import select, delete as sa_delete
from sqlalchemy.ext.asyncio import AsyncSession
from src.models.document_chunk import DocumentChunk
from src.core.config import get_settings

SIMILARITY_THRESHOLD = 0.15  # meaningful cosine similarity for voyage-law-2
DEDUP_THRESHOLD = 0.92       # pre-filter threshold for clause deduplication


class VectorStore:
    def __init__(self):
        settings = get_settings()
        self.voyage = voyageai.AsyncClient(api_key=settings.voyage_api_key)

    async def embed_texts(self, texts: list[str], input_type: str = "document") -> list[list[float]]:
        result = await self.voyage.embed(
            texts=texts,
            model="voyage-law-2",
            input_type=input_type,
        )
        return result.embeddings

    async def add_chunks(
        self,
        db: AsyncSession,
        document_id: str,
        workspace_id: str,
        chunks: list[dict],  # {text, page_number, chunk_index, metadata}
    ) -> int:
        texts = [c["text"] for c in chunks]
        embeddings = await self.embed_texts(texts, input_type="document")

        db_chunks = [
            DocumentChunk(
                document_id=document_id,
                workspace_id=workspace_id,
                page_number=c["page_number"],
                chunk_index=c["chunk_index"],
                text=c["text"],
                embedding=emb,
                chunk_metadata=c.get("metadata"),
            )
            for c, emb in zip(chunks, embeddings)
        ]
        db.add_all(db_chunks)
        await db.flush()
        return len(db_chunks)

    async def query(
        self,
        db: AsyncSession,
        workspace_id: str,
        query_text: str,
        n_results: int = 10,
        document_id: str | None = None,
    ) -> list[dict]:
        query_embedding = (await self.embed_texts([query_text], input_type="query"))[0]

        stmt = (
            select(
                DocumentChunk,
                (1 - DocumentChunk.embedding.cosine_distance(query_embedding)).label("similarity"),
            )
            .where(DocumentChunk.workspace_id == workspace_id)
            .where((1 - DocumentChunk.embedding.cosine_distance(query_embedding)) >= SIMILARITY_THRESHOLD)
        )
        if document_id:
            stmt = stmt.where(DocumentChunk.document_id == document_id)

        stmt = stmt.order_by(
            DocumentChunk.embedding.cosine_distance(query_embedding)
        ).limit(n_results)

        result = await db.execute(stmt)
        rows = result.all()

        return [
            {
                "text": row.DocumentChunk.text,
                "page_number": row.DocumentChunk.page_number,
                "document_id": row.DocumentChunk.document_id,
                "similarity": float(row.similarity),
            }
            for row in rows
        ]

    async def dedup_candidates(
        self,
        db: AsyncSession,
        document_id: str,
        clause_text: str,
    ) -> list[dict]:
        """Pre-filter for clause deduplication — only return high-similarity pairs to avoid O(n^2) LLM calls."""
        embedding = (await self.embed_texts([clause_text], input_type="document"))[0]
        stmt = (
            select(
                DocumentChunk,
                (1 - DocumentChunk.embedding.cosine_distance(embedding)).label("similarity"),
            )
            .where(DocumentChunk.document_id == document_id)
            .where((1 - DocumentChunk.embedding.cosine_distance(embedding)) >= DEDUP_THRESHOLD)
            .limit(5)
        )
        result = await db.execute(stmt)
        return [
            {"text": r.DocumentChunk.text, "similarity": float(r.similarity)}
            for r in result.all()
        ]

    async def delete_document_chunks(self, db: AsyncSession, document_id: str) -> None:
        await db.execute(sa_delete(DocumentChunk).where(DocumentChunk.document_id == document_id))
