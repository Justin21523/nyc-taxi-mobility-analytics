FROM node:22-bookworm-slim

ARG NEXT_PUBLIC_BASE_PATH=""

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH=/app/src \
    NEXT_TELEMETRY_DISABLED=1 \
    NEXT_PUBLIC_BASE_PATH=${NEXT_PUBLIC_BASE_PATH}

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential python3 python3-pip python3-venv \
    && ln -s /usr/bin/python3 /usr/local/bin/python \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt package.json package-lock.json ./
RUN python3 -m pip install --break-system-packages --no-cache-dir -r requirements.txt
RUN npm ci

COPY . .
RUN make sample-data && make etl && npm run build

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || '3000') + '/api/health').then(async (response) => { if (!response.ok) throw new Error('HTTP ' + response.status); const body = await response.json(); if (body.status !== 'ok' || body.warehouseReady !== true) throw new Error('warehouse not ready'); }).catch((error) => { console.error(error); process.exit(1); })"

CMD ["sh", "-c", "npm run start -- --hostname 0.0.0.0 --port ${PORT:-3000}"]
