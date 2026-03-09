"""Application settings loaded from environment."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Settings for the Ollama proxy API."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    DATABASE_URL: str = ""
    SECRET_KEY: str = ""
    OLLAMA_BACKEND_URL: str = "http://ollama:11434"


settings = Settings()
