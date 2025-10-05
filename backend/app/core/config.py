from pydantic import BaseModel
from functools import lru_cache
import os

class Settings(BaseModel):
    SUPABASE_DB_URL: str
    SUPABASE_URL: str | None = None
    SUPABASE_ANON_KEY: str | None = None
    SUPABASE_SERVICE_ROLE_KEY: str | None = None
    AUTH_DISABLED: bool = True
    CORS_ORIGINS: list[str] = []
    
    # RabbitMQ Settings
    RABBITMQ_HOST: str | None = None

@lru_cache
def get_settings() -> Settings:
    return Settings(
        SUPABASE_DB_URL=os.getenv("SUPABASE_DB_URL", ""),
        SUPABASE_URL=os.getenv("SUPABASE_URL"),
        SUPABASE_ANON_KEY=os.getenv("SUPABASE_ANON_KEY"),
        SUPABASE_SERVICE_ROLE_KEY=os.getenv("SUPABASE_SERVICE_ROLE_KEY"),
        AUTH_DISABLED=os.getenv("AUTH_DISABLED", "true").lower() == "true",
        CORS_ORIGINS=[o.strip() for o in os.getenv("CORS_ORIGINS", "*").split(",") if o.strip()],
        
        # RabbitMQ Settings
        RABBITMQ_HOST=os.getenv("RABBITMQ_HOST"),
    )
