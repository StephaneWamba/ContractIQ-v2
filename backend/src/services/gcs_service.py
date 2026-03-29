import asyncio
from datetime import timedelta
from google.cloud import storage
from google.api_core.exceptions import NotFound
from src.core.config import get_settings


class GCSService:
    def __init__(self):
        settings = get_settings()
        self.client = storage.Client()
        self._buckets = {
            "us": self.client.bucket(settings.gcs_bucket_name),
        }
        if settings.gcs_bucket_eu:
            self._buckets["eu"] = self.client.bucket(settings.gcs_bucket_eu)
        self._kms_keys = {
            "us": settings.gcs_kms_key_us or None,
            "eu": settings.gcs_kms_key_eu or None,
        }
        # Default bucket (backwards compat for callers that use self.bucket directly)
        self.bucket = self._buckets["us"]

    def bucket_for_region(self, region: str):
        return self._buckets.get(region, self._buckets["us"])

    def _blob(self, gcs_path: str, region: str = "us"):
        """Get a blob handle for the given path + region, with optional CMEK key."""
        bucket = self.bucket_for_region(region)
        blob = bucket.blob(gcs_path)
        kms_key = self._kms_keys.get(region)
        if kms_key:
            blob.kms_key_name = kms_key
        return blob

    async def upload_file(self, local_path: str, gcs_path: str, content_type: str = "application/pdf", region: str = "us") -> str:
        blob = self._blob(gcs_path, region)
        await asyncio.to_thread(blob.upload_from_filename, local_path, content_type=content_type)
        return gcs_path

    async def write_text(self, gcs_path: str, content: str, content_type: str = "text/markdown", region: str = "us") -> None:
        """Upload a UTF-8 string to GCS. Uses region bucket + CMEK if configured."""
        blob = self._blob(gcs_path, region)
        await asyncio.to_thread(blob.upload_from_string, content.encode("utf-8"), content_type=content_type)

    async def read_text(self, gcs_path: str, region: str = "us") -> str | None:
        """Download a GCS object as UTF-8 string. Returns None if not found."""
        blob = self._blob(gcs_path, region)
        try:
            data = await asyncio.to_thread(blob.download_as_bytes)
            return data.decode("utf-8")
        except NotFound:
            return None

    async def list_blobs(self, prefix: str, region: str = "us") -> list[str]:
        """Return all GCS object names under the given prefix."""
        bucket = self.bucket_for_region(region)
        blobs = await asyncio.to_thread(
            lambda: list(self.client.list_blobs(bucket.name, prefix=prefix))
        )
        return [b.name for b in blobs]

    def get_signed_url(self, gcs_path: str, expiration_minutes: int = 15, region: str = "us") -> str:
        blob = self._blob(gcs_path, region)
        return blob.generate_signed_url(expiration=timedelta(minutes=expiration_minutes))

    async def delete_file(self, gcs_path: str, region: str = "us") -> None:
        blob = self._blob(gcs_path, region)
        try:
            await asyncio.to_thread(blob.delete)
        except NotFound:
            pass
