FROM node:22-bookworm-slim

# 1. Install system utilities: Python, Pip, FFmpeg, and supervisor process manager
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       ffmpeg \
       ca-certificates \
       python3 \
       python3-pip \
       supervisor \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 2. Copy your entire codebase in first so ALL file paths are physically present
COPY . .

# 3. Install your existing Node.js worker dependencies
RUN cd server && npm ci --omit=dev

# 4. Install your Python dependencies directly from their explicit folder location 🎯
RUN pip3 install --no-cache-dir --break-system-packages -r server/worker/ai-worker/requirements.txt

# 5. Copy the supervisor orchestration mapping layer to its proper system path
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

ENV PORT=7860
EXPOSE 7860

# 🚀 Launch supervisor, which automatically spawns and manages both workers simultaneously
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]