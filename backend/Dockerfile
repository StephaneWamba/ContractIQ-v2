FROM python:3.12-slim AS runtime

# Node.js 20 required by Claude Agent SDK CLI + libmagic for file type validation
RUN apt-get update && apt-get install -y --no-install-recommends \
        curl gnupg ca-certificates libmagic1 \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

RUN groupadd -r agent && useradd -r -g agent -m -d /home/agent agent

WORKDIR /app
COPY --chown=agent:agent . .
RUN pip install --no-cache-dir -e .
RUN mkdir -p /home/agent/.claude && chown -R agent:agent /home/agent/.claude

USER agent
ENV HOME=/home/agent PYTHONUNBUFFERED=1 PORT=8000
EXPOSE 8000
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
