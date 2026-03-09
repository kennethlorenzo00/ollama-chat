"""Application settings loaded from environment."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Settings for the Ollama proxy API."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Comma-separated API keys, or single API_KEY for one key.
    API_KEYS: str = ""
    API_KEY: str | None = None

    OLLAMA_BACKEND_URL: str = "http://ollama:11434"

    @property
    def valid_api_keys(self) -> set[str]:
        """Set of valid API keys (from API_KEYS and optional API_KEY)."""
        keys: set[str] = set()
        if self.API_KEYS:
            keys.update(k.strip() for k in self.API_KEYS.split(",") if k.strip())
        if self.API_KEY and self.API_KEY.strip():
            keys.add(self.API_KEY.strip())
        return keys


settings = Settings()
