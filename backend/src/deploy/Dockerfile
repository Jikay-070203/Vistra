FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PIP_DISABLE_PIP_VERSION_CHECK=1 PYTHONPATH=/app
WORKDIR /app
RUN pip install --no-cache-dir uv
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project
# Used to encrypt provider API keys stored in PostgreSQL.
RUN uv pip install --python /app/.venv/bin/python "cryptography>=43,<51"
COPY src ./backend
COPY scripts ./backend/scripts
COPY seed/YourTripYourTry_Places_Schema.sql ./backend/seed/YourTripYourTry_Places_Schema.sql
COPY seed/places_seed.seed ./backend/seed/places_seed.seed
RUN mkdir -p /app/data
ENV PATH="/app/.venv/bin:${PATH}"
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=5 CMD ["python", "-c", "import os,urllib.request; urllib.request.urlopen('http://127.0.0.1:' + os.getenv('PORT','8000') + '/health', timeout=5)"]
CMD ["sh", "-c", "exec uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
