"""
Alembic env.py — CareerPilot
Loads the sync database URL dynamically from application settings.
Uses psycopg2 (sync) driver for migrations while the app uses asyncpg.
"""

from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
import sys
import os

# Make backend package importable from alembic context
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import settings and all models so Alembic can detect schema changes
from utils.config import settings
from db.database import Base

# Import all models to populate Base.metadata
# Alembic needs them registered for autogenerate to work
import db.models  # noqa: F401  (registers User, Company, Job, etc.)

# ---------------------------------------------------------------------------
# Alembic Config object — provides access to alembic.ini values
# ---------------------------------------------------------------------------
config = context.config

# Override sqlalchemy.url with the sync URL from our settings
config.set_main_option("sqlalchemy.url", settings.sync_database_url)

# Interpret the config file for Python logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Target metadata for autogenerate support
target_metadata = Base.metadata


# ---------------------------------------------------------------------------
# Run migrations in "offline" mode (no active DB connection needed)
# ---------------------------------------------------------------------------
def run_migrations_offline() -> None:
    """
    Emit SQL to stdout without connecting to the database.
    Useful for reviewing migration SQL before applying.
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        compare_server_default=True,
    )
    with context.begin_transaction():
        context.run_migrations()


# ---------------------------------------------------------------------------
# Run migrations in "online" mode (active DB connection)
# ---------------------------------------------------------------------------
def run_migrations_online() -> None:
    """
    Create a sync engine and apply migrations directly to Neon DB.
    psycopg2 is used here (not asyncpg) because Alembic is sync.
    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,  # No connection pooling for migrations
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            compare_server_default=True,
        )
        with context.begin_transaction():
            context.run_migrations()


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
