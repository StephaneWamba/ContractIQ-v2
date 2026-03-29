from google.cloud import storage
from datetime import timedelta
from src.core.config import get_settings


class GCSService:
    def __init__(self):
        settings = get_settings()
        self.client = storage.Client()
        self.bucket = self.client.bucket(settings.gcs_bucket_name)

    async def upload_file(self, local_path: str, gcs_path: str, content_type: str = "application/pdf") -> str:
        blob = self.bucket.blob(gcs_path)
        blob.upload_from_filename(local_path, content_type=content_type)
        return gcs_path

    def get_signed_url(self, gcs_path: str, expiration_minutes: int = 15) -> str:
        blob = self.bucket.blob(gcs_path)
        return blob.generate_signed_url(expiration=timedelta(minutes=expiration_minutes))

    async def delete_file(self, gcs_path: str) -> None:
        blob = self.bucket.blob(gcs_path)
        if blob.exists():
            blob.delete()
