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

# 2. Install your existing Node.js worker dependencies
COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev



# 3. Copy and install your Python Whisper worker dependencies
# Using --break-system-packages is required by modern Debian/Ubuntu bases inside safe Docker containers
# 🎯 Search flexibly for requirements.txt inside the repository context
COPY **/requirements.txt ./temp_requirements.txt
RUN pip3 install --no-cache-dir --break-system-packages -r temp_requirements.txt && rm temp_requirements.txt

# 4. Copy your monorepo code directories
COPY server ./server
COPY start.js ./start.js

# 5. Copy the supervisor orchestration mapping layer
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

ENV PORT=7860
EXPOSE 7860

# 🚀 Launch supervisor, which automatically spawns and manages both workers simultaneously
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]