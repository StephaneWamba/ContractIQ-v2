import re
import json
import asyncio
from dataclasses import dataclass
from rapidfuzz import process as fuzz_process, fuzz
from src.services.gcs_service import GCSService
from src.services.vector_store import VectorStore
from sqlalchemy.ext.asyncio import AsyncSession


@dataclass
class GrepMatch:
    path: str
    line_number: int
    line: str
    score: float = 1.0


@dataclass
class SearchResult:
    document_id: str
    page_number: int | None
    text: str
    similarity: float


class WorkspaceToolkit:
    """
    Agent's file tools, scoped to a workspace.
    All paths are relative to workspaces/{workspace_id}/.
    """

    def __init__(self, workspace_id: str, db: AsyncSession):
        self.workspace_id = workspace_id
        self.db = db
        self._gcs = GCSService()
        self._vector_store = VectorStore()

    def _full_path(self, relative_path: str) -> str:
        relative_path = relative_path.lstrip("/")
        if relative_path.startswith(f"workspaces/{self.workspace_id}/"):
            return relative_path
        return f"workspaces/{self.workspace_id}/{relative_path}"

    async def read(self, path: str) -> str | None:
        return await self._gcs.read_text(self._full_path(path))

    async def write(self, path: str, content: str) -> None:
        await self._gcs.write_text(self._full_path(path), content)

    async def glob(self, pattern: str) -> list[str]:
        prefix = f"workspaces/{self.workspace_id}/"
        all_paths = await self._gcs.list_blobs(prefix)
        pattern_full = prefix + pattern.lstrip("/")
        regex = re.escape(pattern_full).replace(r"\*\*", ".*").replace(r"\*", "[^/]*")
        compiled = re.compile(f"^{regex}$")
        return [p[len(prefix):] for p in all_paths if compiled.match(p)]

    async def grep(
        self,
        query: str,
        path_pattern: str = "**/*.md",
        mode: str = "exact",
        fuzzy_threshold: int = 70,
        max_results: int = 20,
    ) -> list[GrepMatch]:
        paths = await self.glob(path_pattern)
        results: list[GrepMatch] = []

        for path in paths:
            content = await self.read(path)
            if not content:
                continue
            lines = content.splitlines()

            for i, line in enumerate(lines, start=1):
                if mode == "exact":
                    if query.lower() in line.lower():
                        results.append(GrepMatch(path=path, line_number=i, line=line.strip()))
                elif mode == "regex":
                    if re.search(query, line, re.IGNORECASE):
                        results.append(GrepMatch(path=path, line_number=i, line=line.strip()))
                elif mode == "fuzzy":
                    score = fuzz.partial_ratio(query.lower(), line.lower())
                    if score >= fuzzy_threshold:
                        results.append(GrepMatch(path=path, line_number=i, line=line.strip(), score=score / 100))

        if mode == "fuzzy":
            results.sort(key=lambda r: r.score, reverse=True)

        return results[:max_results]

    async def semantic_search(
        self,
        query: str,
        document_id: str | None = None,
        n_results: int = 10,
    ) -> list[SearchResult]:
        chunks = await self._vector_store.query(
            db=self.db,
            workspace_id=self.workspace_id,
            query_text=query,
            n_results=n_results,
            document_id=document_id,
        )
        return [
            SearchResult(
                document_id=c["document_id"],
                page_number=c.get("page_number"),
                text=c["text"],
                similarity=c["similarity"],
            )
            for c in chunks
        ]

    def to_tool_definitions(self) -> list[dict]:
        return [
            {
                "name": "workspace_read",
                "description": "Read a file from the workspace. Path is relative to the workspace root (e.g. 'documents/{id}/contract.md', 'skills/playbook-nda.md', 'memory/counterparties.md').",
                "input_schema": {
                    "type": "object",
                    "properties": {"path": {"type": "string"}},
                    "required": ["path"],
                    "additionalProperties": False,
                }
            },
            {
                "name": "workspace_write",
                "description": "Write or overwrite a file in the workspace. Use this to save analysis.md, update portfolio.md, update memory files.",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "path": {"type": "string"},
                        "content": {"type": "string", "description": "Full file content (full overwrite, not append)"}
                    },
                    "required": ["path", "content"],
                    "additionalProperties": False,
                }
            },
            {
                "name": "workspace_glob",
                "description": "List files in the workspace matching a glob pattern. Use ** for recursive. E.g. 'documents/*/analysis.md'.",
                "input_schema": {
                    "type": "object",
                    "properties": {"pattern": {"type": "string"}},
                    "required": ["pattern"],
                    "additionalProperties": False,
                }
            },
            {
                "name": "workspace_grep",
                "description": "Search file contents. mode='exact' for substring, mode='regex' for patterns, mode='fuzzy' for approximate matching (handles paraphrasing).",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "query": {"type": "string"},
                        "path_pattern": {"type": "string", "default": "**/*.md"},
                        "mode": {"type": "string", "enum": ["exact", "regex", "fuzzy"], "default": "exact"},
                        "fuzzy_threshold": {"type": "integer", "default": 70},
                        "max_results": {"type": "integer", "default": 20}
                    },
                    "required": ["query"],
                    "additionalProperties": False,
                }
            },
            {
                "name": "workspace_semantic_search",
                "description": "Semantic vector search over contract text using embeddings. Best for meaning-based queries like 'clauses that shift risk to vendor'.",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "query": {"type": "string"},
                        "document_id": {"type": "string"},
                        "n_results": {"type": "integer", "default": 10}
                    },
                    "required": ["query"],
                    "additionalProperties": False,
                }
            },
        ]

    async def dispatch_tool(self, tool_name: str, tool_input: dict) -> str:
        """Execute a tool call from the agent, log it, and return result as string."""
        result = await self._dispatch(tool_name, tool_input)

        # Audit log — GDPR data access trail
        try:
            from src.models.agent_audit_log import AgentAuditLog
            path = tool_input.get("path", "")
            doc_id = None
            if "/documents/" in path:
                parts = path.split("/documents/")
                if len(parts) > 1:
                    doc_id = parts[1].split("/")[0]
            log = AgentAuditLog(
                workspace_id=self.workspace_id,
                document_id=doc_id,
                tool=tool_name,
                input_summary=json.dumps(tool_input)[:500],
                result_chars=len(result),
            )
            self.db.add(log)
            await self.db.flush()
        except Exception:
            pass  # never block agent over audit logging

        return result

    async def _dispatch(self, tool_name: str, tool_input: dict) -> str:
        if tool_name == "workspace_read":
            content = await self.read(tool_input["path"])
            return content if content is not None else f"File not found: {tool_input['path']}"

        elif tool_name == "workspace_write":
            await self.write(tool_input["path"], tool_input["content"])
            return f"Written: {tool_input['path']}"

        elif tool_name == "workspace_glob":
            paths = await self.glob(tool_input["pattern"])
            return json.dumps(paths) if paths else "No files matched"

        elif tool_name == "workspace_grep":
            matches = await self.grep(
                query=tool_input["query"],
                path_pattern=tool_input.get("path_pattern", "**/*.md"),
                mode=tool_input.get("mode", "exact"),
                fuzzy_threshold=tool_input.get("fuzzy_threshold", 70),
                max_results=tool_input.get("max_results", 20),
            )
            if not matches:
                return "No matches found"
            return "\n".join(
                f"{m.path}:{m.line_number}: {m.line}" + (f" (score={m.score:.2f})" if m.score < 1.0 else "")
                for m in matches
            )

        elif tool_name == "workspace_semantic_search":
            results = await self.semantic_search(
                query=tool_input["query"],
                document_id=tool_input.get("document_id"),
                n_results=tool_input.get("n_results", 10),
            )
            if not results:
                return "No results found"
            return "\n\n".join(
                f"[doc:{r.document_id} page:{r.page_number} sim:{r.similarity:.2f}]\n{r.text}"
                for r in results
            )

        return f"Unknown tool: {tool_name}"
