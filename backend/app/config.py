from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Lingo-Latency"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = "supersecretkey_change_me_in_production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    # Infrastructure
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/lingo_latency"
    REDIS_URL: str = "redis://localhost:6379/0"

    # AI Translation Engine (Groq)
    GROQ_API_KEY: str
    DEFAULT_TRANSLATION_MODEL: str = "llama-3.3-70b-versatile" # Fast & cheap for hot-path translation

    model_config = SettingsConfigDict(
        env_file=".env", 
        env_file_encoding="utf-8", 
        extra="ignore"
    )


settings = Settings()