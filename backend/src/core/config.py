from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # App
    environment: str = "production"
    log_level: str = "INFO"

    # Auth — no default, fails at startup if missing
    secret_key: str
    access_token_expire_minutes: int = 60
    algorithm: str = "HS256"

    # Anthropic
    anthropic_api_key: str

    # Voyage AI
    voyage_api_key: str

    # Database (Cloud SQL via asyncpg)
    database_url: str  # postgresql+asyncpg://user:pass@host/dbname

    # Redis (Cloud Memorystore)
    redis_url: str

    # GCS
    gcs_bucket_name: str
    gcp_project_id: str = ""

    # CORS
    allowed_origins: list[str] = ["http://localhost:3000"]

    # Langfuse (optional observability)
    langfuse_public_key: str = ""
    langfuse_secret_key: str = ""

    def model_post_init(self, __context) -> None:
        if self.environment == "production":
            if len(self.secret_key) < 32:
                raise ValueError("SECRET_KEY must be at least 32 characters in production")


@lru_cache
def get_settings() -> Settings:
    return Settings()
