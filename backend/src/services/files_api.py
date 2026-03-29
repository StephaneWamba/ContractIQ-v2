import anthropic
from pathlib import Path
from src.core.config import get_settings


class FilesAPIService:
    def __init__(self):
        settings = get_settings()
        self._client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

    async def upload_pdf(self, local_path: str) -> str:
        """Upload PDF to Anthropic Files API. Returns file_id."""
        path = Path(local_path)
        with open(path, "rb") as f:
            response = await self._client.beta.files.upload(
                file=(path.name, f, "application/pdf"),
            )
        return response.id

    async def delete_file(self, file_id: str) -> None:
        """Delete from Anthropic Files API (on document delete)."""
        try:
            await self._client.beta.files.delete(file_id)
        except Exception:
            pass  # best-effort; already logged by caller
