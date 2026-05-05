# ============================================================
# DiffBell 開発用コンテナ
# ============================================================
FROM node:22-bookworm-slim

WORKDIR /workspace

# システムパッケージ
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    git \
    unzip \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# pnpm
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

# Supabase CLI
RUN curl -fsSL https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.tar.gz \
    | tar -xz -C /usr/local/bin supabase

# Deno (Edge Function ローカル実行)
RUN curl -fsSL https://deno.land/install.sh | sh
ENV DENO_INSTALL="/root/.deno"
ENV PATH="${DENO_INSTALL}/bin:${PATH}"

# Playwright ブラウザ用依存 (E2E)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 libcups2 \
    libdrm2 libdbus-1-3 libxkbcommon0 libatspi2.0-0 libx11-6 \
    libxcomposite1 libxdamage1 libxext6 libxfixes3 libxrandr2 \
    libgbm1 libpango-1.0-0 libcairo2 libasound2 \
    && rm -rf /var/lib/apt/lists/*

# 依存をキャッシュするためにまず package.json だけコピー
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile || pnpm install

# Playwright ブラウザをインストール
RUN pnpm exec playwright install chromium

EXPOSE 5173

CMD ["pnpm", "dev"]
