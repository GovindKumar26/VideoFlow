# 1. Use a clean, lightweight Node 20 environment
FROM node:20-alpine

# 2. Install production-grade FFmpeg natively into the Linux container core
RUN apk add --no-cache ffmpeg

# 3. Create the app working workspace
WORKDIR /app

# 4. Copy package manifests and install dependencies
COPY package*.json ./
RUN npm install --production

# 5. Copy the rest of your worker code and assets
COPY . .

# 6. Execute your engine initializer script
CMD ["node", "initializeEngine.js"]